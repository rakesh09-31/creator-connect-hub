-- ============ 1. job_applications integrity ============

-- de-duplicate existing rows (keep earliest per job+applicant / job+squad)
DELETE FROM public.job_applications a
USING public.job_applications b
WHERE a.applicant_id IS NOT NULL
  AND a.applicant_id = b.applicant_id
  AND a.job_id = b.job_id
  AND (a.created_at, a.id) > (b.created_at, b.id);

DELETE FROM public.job_applications a
USING public.job_applications b
WHERE a.squad_id IS NOT NULL
  AND a.squad_id = b.squad_id
  AND a.job_id = b.job_id
  AND (a.created_at, a.id) > (b.created_at, b.id);

ALTER TABLE public.job_applications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID;

UPDATE public.job_applications SET status = 'pending'
WHERE status IS NULL OR status NOT IN ('pending','accepted','rejected','withdrawn');

ALTER TABLE public.job_applications DROP CONSTRAINT IF EXISTS job_applications_status_check;
ALTER TABLE public.job_applications
  ADD CONSTRAINT job_applications_status_check
  CHECK (status IN ('pending','accepted','rejected','withdrawn'));

CREATE UNIQUE INDEX IF NOT EXISTS job_applications_unique_applicant
  ON public.job_applications (job_id, applicant_id) WHERE applicant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS job_applications_unique_squad
  ON public.job_applications (job_id, squad_id) WHERE squad_id IS NOT NULL;

DROP TRIGGER IF EXISTS job_applications_touch ON public.job_applications;
CREATE TRIGGER job_applications_touch BEFORE UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- allow the applicant (or squad owner) to withdraw / update their own row
DROP POLICY IF EXISTS "apps_update_own" ON public.job_applications;
CREATE POLICY "apps_update_own" ON public.job_applications
  FOR UPDATE TO authenticated
  USING (auth.uid() = applicant_id OR EXISTS (
    SELECT 1 FROM public.squads s WHERE s.id = job_applications.squad_id AND s.owner_id = auth.uid()))
  WITH CHECK (auth.uid() = applicant_id OR EXISTS (
    SELECT 1 FROM public.squads s WHERE s.id = job_applications.squad_id AND s.owner_id = auth.uid()));

-- ============ 2. notifications for applications ============

CREATE OR REPLACE FUNCTION public.notify_job_application()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_client UUID; v_title TEXT; v_actor UUID; v_target UUID; v_squad TEXT;
BEGIN
  SELECT client_id, title INTO v_client, v_title FROM public.jobs WHERE id = NEW.job_id;

  IF TG_OP = 'INSERT' THEN
    v_actor := COALESCE(NEW.applicant_id, (SELECT owner_id FROM public.squads WHERE id = NEW.squad_id));
    SELECT name INTO v_squad FROM public.squads WHERE id = NEW.squad_id;
    PERFORM public.create_notification(v_client, v_actor, 'job_application', 'job', NEW.job_id,
      jsonb_build_object('job_title', v_title, 'application_id', NEW.id, 'squad_name', v_squad));
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('accepted','rejected') THEN
    v_target := COALESCE(NEW.applicant_id, (SELECT owner_id FROM public.squads WHERE id = NEW.squad_id));
    PERFORM public.create_notification(v_target, v_client,
      CASE WHEN NEW.status = 'accepted' THEN 'job_application_accepted' ELSE 'job_application_rejected' END,
      'job', NEW.job_id,
      jsonb_build_object('job_title', v_title, 'application_id', NEW.id, 'status', NEW.status));
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS job_applications_notify_ins ON public.job_applications;
CREATE TRIGGER job_applications_notify_ins AFTER INSERT ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_job_application();

DROP TRIGGER IF EXISTS job_applications_notify_upd ON public.job_applications;
CREATE TRIGGER job_applications_notify_upd AFTER UPDATE ON public.job_applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_job_application();

-- ============ 3. decide_job_application RPC ============

CREATE OR REPLACE FUNCTION public.decide_job_application(_application_id UUID, _status TEXT)
RETURNS public.job_applications
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_me UUID := auth.uid(); v_app public.job_applications; v_owner UUID;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _status NOT IN ('accepted','rejected') THEN
    RAISE EXCEPTION 'invalid status %, expected accepted or rejected', _status;
  END IF;

  SELECT * INTO v_app FROM public.job_applications WHERE id = _application_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'application not found'; END IF;

  SELECT client_id INTO v_owner FROM public.jobs WHERE id = v_app.job_id;
  IF v_owner IS DISTINCT FROM v_me THEN
    RAISE EXCEPTION 'only the client who posted this job can decide applications';
  END IF;

  IF v_app.status <> 'pending' THEN
    RAISE EXCEPTION 'application is already %', v_app.status;
  END IF;

  UPDATE public.job_applications
     SET status = _status, reviewed_at = now(), reviewed_by = v_me, updated_at = now()
   WHERE id = _application_id
  RETURNING * INTO v_app;

  RETURN v_app;
END $$;

REVOKE ALL ON FUNCTION public.decide_job_application(UUID, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.decide_job_application(UUID, TEXT) TO authenticated;

-- ============ 4. stories access rules (RLS was on with zero policies) ============

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;

DROP POLICY IF EXISTS "stories_select_active" ON public.stories;
CREATE POLICY "stories_select_active" ON public.stories
  FOR SELECT TO authenticated
  USING (expires_at IS NULL OR expires_at > now() OR user_id = auth.uid());

DROP POLICY IF EXISTS "stories_insert_own" ON public.stories;
CREATE POLICY "stories_insert_own" ON public.stories
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "stories_delete_own" ON public.stories;
CREATE POLICY "stories_delete_own" ON public.stories
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS stories_user_created_idx ON public.stories (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS stories_expires_idx ON public.stories (expires_at);

ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;

DROP POLICY IF EXISTS "story_views_insert_self" ON public.story_views;
CREATE POLICY "story_views_insert_self" ON public.story_views
  FOR INSERT TO authenticated WITH CHECK (viewer_id = auth.uid());

DROP POLICY IF EXISTS "story_views_read" ON public.story_views;
CREATE POLICY "story_views_read" ON public.story_views
  FOR SELECT TO authenticated
  USING (viewer_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.stories s WHERE s.id = story_views.story_id AND s.user_id = auth.uid()));

CREATE UNIQUE INDEX IF NOT EXISTS story_views_unique ON public.story_views (story_id, viewer_id);