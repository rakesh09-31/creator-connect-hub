-- Repair a database that has the job workflow tables but is missing the
-- decision RPC (for example, when an earlier migration was not deployed).
-- A job is Omnicraft's project model; project_assignments is its membership
-- table. Do not add a second project_members table.

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (application_id),
  UNIQUE (job_id, creator_id)
);

CREATE TABLE IF NOT EXISTS public.application_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.job_applications(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
  changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_created_idx
  ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
  ON public.notifications (user_id) WHERE read = false;
CREATE INDEX IF NOT EXISTS project_assignments_creator_idx
  ON public.project_assignments (creator_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS application_status_history_application_idx
  ON public.application_status_history (application_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS job_applications_one_creator_per_job
  ON public.job_applications (job_id, applicant_id) WHERE applicant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS job_applications_one_squad_per_job
  ON public.job_applications (job_id, squad_id) WHERE squad_id IS NOT NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT ON public.project_assignments, public.application_status_history TO authenticated;

DO $$
BEGIN
  CREATE POLICY "Users read their own notifications" ON public.notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE POLICY "Users update their own notifications" ON public.notifications
    FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE POLICY "Users delete their own notifications" ON public.notifications
    FOR DELETE TO authenticated USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE POLICY "Project members see assignments" ON public.project_assignments
    FOR SELECT TO authenticated USING (
      creator_id = auth.uid()
      OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE POLICY "Application participants see history" ON public.application_status_history
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1
        FROM public.job_applications a
        JOIN public.jobs j ON j.id = a.job_id
        WHERE a.id = application_id
          AND (a.applicant_id = auth.uid() OR j.client_id = auth.uid())
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- SECURITY DEFINER is intentional: application submitters must not be able
-- to create arbitrary notifications, and the decision is an atomic workflow.
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _actor_id uuid,
  _type text,
  _entity_type text,
  _entity_id uuid,
  _data jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL OR _user_id = _actor_id THEN
    RETURN;
  END IF;

  INSERT INTO public.notifications (user_id, actor_id, type, entity_type, entity_id, data)
  VALUES (_user_id, _actor_id, _type, _entity_type, _entity_id, COALESCE(_data, '{}'::jsonb));
END;
$$;

-- Keep the existing submission workflow intact when this repair is deployed
-- to a database where the original hiring migration never ran.
CREATE OR REPLACE FUNCTION public.notify_job_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_id uuid;
  v_job_title text;
BEGIN
  SELECT client_id, title INTO v_client_id, v_job_title
  FROM public.jobs
  WHERE id = NEW.job_id;

  PERFORM public.create_notification(
    v_client_id,
    COALESCE(NEW.applicant_id, auth.uid()),
    'job_application',
    'job_application',
    NEW.id,
    jsonb_build_object('job_id', NEW.job_id, 'job_title', v_job_title)
  );
  INSERT INTO public.application_status_history (application_id, status, changed_by)
  VALUES (NEW.id, 'pending', COALESCE(NEW.applicant_id, auth.uid()));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_job_application ON public.job_applications;
CREATE TRIGGER trg_notify_job_application
  AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_job_application();

CREATE OR REPLACE FUNCTION public.decide_job_application(_application_id uuid, _status text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app public.job_applications%ROWTYPE;
  v_job public.jobs%ROWTYPE;
  v_conversation_id uuid;
  v_recipient_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF _application_id IS NULL OR _status NOT IN ('accepted', 'rejected') THEN
    RAISE EXCEPTION 'Invalid application decision';
  END IF;

  SELECT * INTO v_app
  FROM public.job_applications
  WHERE id = _application_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = v_app.job_id;
  IF NOT FOUND OR v_job.client_id <> auth.uid() THEN
    RAISE EXCEPTION 'Only the job owner can decide applications';
  END IF;
  IF v_app.status <> 'pending' THEN
    RAISE EXCEPTION 'This application has already been decided';
  END IF;

  UPDATE public.job_applications SET status = _status WHERE id = v_app.id;
  INSERT INTO public.application_status_history (application_id, status, changed_by)
  VALUES (v_app.id, _status, auth.uid());

  v_recipient_id := COALESCE(
    v_app.applicant_id,
    (SELECT s.owner_id FROM public.squads s WHERE s.id = v_app.squad_id)
  );

  IF _status = 'accepted' AND v_app.applicant_id IS NOT NULL THEN
    -- Reuse/create the existing direct-message conversation using the
    -- canonical helper, which serializes concurrent first messages.
    v_conversation_id := public.get_or_create_dm(v_app.applicant_id);

    -- project_assignments is the existing project-member record.
    INSERT INTO public.project_assignments (job_id, application_id, creator_id, conversation_id)
    VALUES (v_job.id, v_app.id, v_app.applicant_id, v_conversation_id)
    ON CONFLICT (application_id) DO UPDATE
      SET conversation_id = EXCLUDED.conversation_id;

    PERFORM public.create_notification(
      v_app.applicant_id, auth.uid(), 'project_assigned', 'job', v_job.id,
      jsonb_build_object('job_title', v_job.title, 'conversation_id', v_conversation_id)
    );
  END IF;

  PERFORM public.create_notification(
    v_recipient_id,
    auth.uid(),
    CASE WHEN _status = 'accepted' THEN 'job_application_accepted' ELSE 'job_application_rejected' END,
    'job_application',
    v_app.id,
    jsonb_build_object('job_id', v_job.id, 'job_title', v_job.title, 'conversation_id', v_conversation_id)
  );

  -- The UUID is the success value and preserves the existing UI contract:
  -- on acceptance it navigates directly to this conversation.
  RETURN v_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.create_notification(uuid, uuid, text, text, uuid, jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decide_job_application(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_job_application(uuid, text) TO authenticated;

-- Refresh PostgREST immediately as well as through its ordinary DDL listener,
-- so Supabase RPC discovery cannot retain a stale schema cache.
NOTIFY pgrst, 'reload schema';
