-- Complete the job application workflow without introducing a second project
-- model: a posted job remains the project, and accepted applications become
-- project assignments.
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

CREATE INDEX IF NOT EXISTS project_assignments_creator_idx ON public.project_assignments (creator_id, joined_at DESC);
CREATE INDEX IF NOT EXISTS application_status_history_application_idx ON public.application_status_history (application_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS job_applications_one_creator_per_job ON public.job_applications (job_id, applicant_id) WHERE applicant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS job_applications_one_squad_per_job ON public.job_applications (job_id, squad_id) WHERE squad_id IS NOT NULL;

ALTER TABLE public.project_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_status_history ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.project_assignments, public.application_status_history TO authenticated;

CREATE POLICY "Project members see assignments" ON public.project_assignments FOR SELECT TO authenticated
  USING (creator_id = auth.uid() OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_id = auth.uid()));
CREATE POLICY "Application participants see history" ON public.application_status_history FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.job_applications a JOIN public.jobs j ON j.id = a.job_id
    WHERE a.id = application_id AND (a.applicant_id = auth.uid() OR j.client_id = auth.uid())
  ));

-- Notify the job owner at submission time. The security-definer helper is
-- necessary because creators intentionally cannot insert arbitrary alerts.
CREATE OR REPLACE FUNCTION public.notify_job_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_client uuid; v_title text;
BEGIN
  SELECT client_id, title INTO v_client, v_title FROM public.jobs WHERE id = NEW.job_id;
  PERFORM public.create_notification(v_client, COALESCE(NEW.applicant_id, auth.uid()), 'job_application', 'job_application', NEW.id,
    jsonb_build_object('job_id', NEW.job_id, 'job_title', v_title));
  INSERT INTO public.application_status_history (application_id, status, changed_by) VALUES (NEW.id, 'pending', COALESCE(NEW.applicant_id, auth.uid()));
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_notify_job_application ON public.job_applications;
CREATE TRIGGER trg_notify_job_application AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_job_application();

-- The client-only decision is atomic: status, history, notification, direct
-- conversation reuse/creation, and assignment all succeed or fail together.
CREATE OR REPLACE FUNCTION public.decide_job_application(_application_id uuid, _status text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_app public.job_applications%ROWTYPE; v_job public.jobs%ROWTYPE; v_conversation uuid;
BEGIN
  IF _status NOT IN ('accepted', 'rejected') THEN RAISE EXCEPTION 'Invalid application decision'; END IF;
  SELECT * INTO v_app FROM public.job_applications WHERE id = _application_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;
  SELECT * INTO v_job FROM public.jobs WHERE id = v_app.job_id;
  IF v_job.client_id <> auth.uid() THEN RAISE EXCEPTION 'Only the job owner can decide applications'; END IF;
  IF v_app.status <> 'pending' THEN RAISE EXCEPTION 'This application has already been decided'; END IF;

  UPDATE public.job_applications SET status = _status WHERE id = v_app.id;
  INSERT INTO public.application_status_history (application_id, status, changed_by) VALUES (v_app.id, _status, auth.uid());

  IF _status = 'accepted' AND v_app.applicant_id IS NOT NULL THEN
    v_conversation := public.get_or_create_dm(v_app.applicant_id);
    INSERT INTO public.project_assignments (job_id, application_id, creator_id, conversation_id)
    VALUES (v_job.id, v_app.id, v_app.applicant_id, v_conversation)
    ON CONFLICT (application_id) DO UPDATE SET conversation_id = EXCLUDED.conversation_id;
    PERFORM public.create_notification(v_app.applicant_id, auth.uid(), 'project_assigned', 'job', v_job.id,
      jsonb_build_object('job_title', v_job.title, 'conversation_id', v_conversation));
  END IF;
  PERFORM public.create_notification(COALESCE(v_app.applicant_id, (SELECT owner_id FROM public.squads WHERE id = v_app.squad_id)), auth.uid(),
    CASE WHEN _status = 'accepted' THEN 'job_application_accepted' ELSE 'job_application_rejected' END,
    'job_application', v_app.id, jsonb_build_object('job_id', v_job.id, 'job_title', v_job.title, 'conversation_id', v_conversation));
  RETURN v_conversation;
END; $$;
REVOKE ALL ON FUNCTION public.decide_job_application(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decide_job_application(uuid, text) TO authenticated;

ALTER PUBLICATION supabase_realtime ADD TABLE public.job_applications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_assignments;
