
-- FOLLOWS
CREATE TABLE public.follows (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL,
  following_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (follower_id, following_id),
  CHECK (follower_id <> following_id)
);
GRANT SELECT ON public.follows TO anon;
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY follows_public_read ON public.follows FOR SELECT USING (true);
CREATE POLICY follows_self_insert ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY follows_self_delete ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

-- JOBS
CREATE TABLE public.jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  location TEXT,
  budget TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY jobs_public_read ON public.jobs FOR SELECT USING (true);
CREATE POLICY jobs_client_insert ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY jobs_client_update ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = client_id);
CREATE POLICY jobs_client_delete ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = client_id);
CREATE TRIGGER jobs_touch BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SQUADS
CREATE TABLE public.squads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  specialty TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.squads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squads TO authenticated;
GRANT ALL ON public.squads TO service_role;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY squads_public_read ON public.squads FOR SELECT USING (true);
CREATE POLICY squads_owner_insert ON public.squads FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY squads_owner_update ON public.squads FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY squads_owner_delete ON public.squads FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE TRIGGER squads_touch BEFORE UPDATE ON public.squads FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SQUAD MEMBERS
CREATE TABLE public.squad_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (squad_id, user_id)
);
GRANT SELECT ON public.squad_members TO anon;
GRANT SELECT, INSERT, DELETE ON public.squad_members TO authenticated;
GRANT ALL ON public.squad_members TO service_role;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY squad_members_public_read ON public.squad_members FOR SELECT USING (true);
CREATE POLICY squad_members_owner_insert ON public.squad_members FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()) OR auth.uid() = user_id);
CREATE POLICY squad_members_owner_delete ON public.squad_members FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()) OR auth.uid() = user_id);

-- JOB APPLICATIONS
CREATE TABLE public.job_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID,
  squad_id UUID REFERENCES public.squads(id) ON DELETE CASCADE,
  portfolio_url TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((applicant_id IS NOT NULL) OR (squad_id IS NOT NULL))
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY apps_read_own_or_job_owner ON public.job_applications FOR SELECT TO authenticated USING (
  auth.uid() = applicant_id
  OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid())
);
CREATE POLICY apps_insert_self ON public.job_applications FOR INSERT TO authenticated WITH CHECK (
  (applicant_id IS NULL OR auth.uid() = applicant_id)
  AND (squad_id IS NULL OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()))
);
CREATE POLICY apps_update_job_owner ON public.job_applications FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_id = auth.uid())
);
CREATE POLICY apps_delete_self ON public.job_applications FOR DELETE TO authenticated USING (
  auth.uid() = applicant_id
  OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid())
);

-- STORAGE bucket for user media
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "media public read" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "media user upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "media user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "media user delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);
