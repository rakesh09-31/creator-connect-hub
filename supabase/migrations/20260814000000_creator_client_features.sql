-- Add new columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS account_type text,
ADD COLUMN IF NOT EXISTS experience_level text,
ADD COLUMN IF NOT EXISTS experience_years integer,
ADD COLUMN IF NOT EXISTS availability text;

-- Backfill account_type from role
UPDATE public.profiles
SET account_type = role::text
WHERE account_type IS NULL AND role IS NOT NULL;

-- 1. Create professional_roles table
CREATE TABLE IF NOT EXISTS public.professional_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    role_type text NOT NULL CHECK (role_type IN ('creator', 'client', 'both')),
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    is_custom boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.professional_roles ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Anyone can view professional_roles"
    ON public.professional_roles FOR SELECT
    TO authenticated
    USING (true);

-- Allow inserts (for custom roles)
CREATE POLICY "Users can insert custom roles"
    ON public.professional_roles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by AND is_custom = true);

-- 2. Create skills table
CREATE TABLE IF NOT EXISTS public.skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    is_custom boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view skills"
    ON public.skills FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can insert custom skills"
    ON public.skills FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by AND is_custom = true);


-- 3. Create creator_roles table
CREATE TABLE IF NOT EXISTS public.creator_roles (
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id uuid REFERENCES public.professional_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (creator_id, role_id)
);

ALTER TABLE public.creator_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creator_roles"
    ON public.creator_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Creators can manage their own roles"
    ON public.creator_roles FOR ALL
    TO authenticated
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);


-- 4. Create client_roles table
CREATE TABLE IF NOT EXISTS public.client_roles (
    client_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id uuid REFERENCES public.professional_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (client_id, role_id)
);

ALTER TABLE public.client_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view client_roles"
    ON public.client_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Clients can manage their own roles"
    ON public.client_roles FOR ALL
    TO authenticated
    USING (auth.uid() = client_id)
    WITH CHECK (auth.uid() = client_id);


-- 5. Create creator_skills table
CREATE TABLE IF NOT EXISTS public.creator_skills (
    creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (creator_id, skill_id)
);

ALTER TABLE public.creator_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view creator_skills"
    ON public.creator_skills FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Creators can manage their own skills"
    ON public.creator_skills FOR ALL
    TO authenticated
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);


-- 6. Create job_roles table
CREATE TABLE IF NOT EXISTS public.job_roles (
    job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
    role_id uuid REFERENCES public.professional_roles(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, role_id)
);

ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view job_roles"
    ON public.job_roles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Clients can manage roles for their jobs"
    ON public.job_roles FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = job_id AND jobs.client_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = job_id AND jobs.client_id = auth.uid()
        )
    );

-- 7. Create job_skills table
CREATE TABLE IF NOT EXISTS public.job_skills (
    job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    PRIMARY KEY (job_id, skill_id)
);

ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view job_skills"
    ON public.job_skills FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Clients can manage skills for their jobs"
    ON public.job_skills FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = job_id AND jobs.client_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.jobs
            WHERE jobs.id = job_id AND jobs.client_id = auth.uid()
        )
    );

-- Insert initial roles
INSERT INTO public.professional_roles (name, role_type, is_custom) VALUES
('Actor', 'creator', false),
('Dancer', 'creator', false),
('Video Editor', 'creator', false),
('Photographer', 'creator', false),
('Videographer', 'creator', false),
('Graphic Designer', 'creator', false),
('Content Creator', 'both', false),
('Singer', 'creator', false),
('Music Producer', 'both', false),
('Writer', 'creator', false),
('Director', 'both', false),
('Animator', 'creator', false),
('UI/UX Designer', 'creator', false),
('Web Developer', 'creator', false),
('Mobile App Developer', 'creator', false),
('Social Media Manager', 'creator', false),
('Voice Artist', 'creator', false),
('Model', 'creator', false),
('Influencer', 'both', false),
('Cinematographer', 'creator', false),
('3D Artist', 'creator', false),
('Motion Graphics Artist', 'creator', false),
('VFX Artist', 'creator', false),
('Sound Designer', 'creator', false),
('Makeup Artist', 'creator', false),
('Stylist', 'creator', false),
('Choreographer', 'creator', false),
('Illustrator', 'creator', false),
('Producer', 'client', false),
('YouTuber', 'client', false),
('Gamer', 'both', false),
('Filmmaker', 'both', false),
('Advertising Agency', 'client', false),
('Brand', 'client', false),
('Startup', 'client', false),
('Event Organizer', 'client', false),
('Business Owner', 'client', false),
('Talent Manager', 'client', false),
('Casting Director', 'client', false),
('Production House', 'client', false),
('Media Company', 'client', false),
('Marketing Agency', 'client', false)
ON CONFLICT (name) DO NOTHING;

-- Insert initial skills
INSERT INTO public.skills (name, is_custom) VALUES
('Adobe Premiere Pro', false),
('After Effects', false),
('DaVinci Resolve', false),
('CapCut', false),
('Photoshop', false),
('Illustrator', false),
('Blender', false),
('Figma', false),
('React', false),
('Java', false),
('Python', false),
('Camera Operation', false),
('Video Editing', false),
('Color Grading', false),
('Acting', false),
('Dancing', false),
('Singing', false),
('Script Writing', false),
('Storytelling', false),
('Photography', false)
ON CONFLICT (name) DO NOTHING;

-- Recommendation RPCs
CREATE OR REPLACE FUNCTION public.get_recommended_creators_for_job(p_job_id uuid, p_limit integer DEFAULT 20)
RETURNS TABLE (
    creator_id uuid,
    match_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_job record;
    v_req_roles uuid[];
    v_req_skills uuid[];
BEGIN
    SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    SELECT array_agg(role_id) INTO v_req_roles FROM public.job_roles WHERE job_id = p_job_id;
    SELECT array_agg(skill_id) INTO v_req_skills FROM public.job_skills WHERE job_id = p_job_id;

    RETURN QUERY
    WITH creator_matches AS (
        SELECT p.id as cid,
               p.experience_level as c_exp_level,
               p.experience_years as c_exp_years,
               (SELECT array_agg(role_id) FROM public.creator_roles WHERE creator_id = p.id) as c_roles,
               (SELECT array_agg(skill_id) FROM public.creator_skills WHERE creator_id = p.id) as c_skills
        FROM public.profiles p
        WHERE p.role = 'creator' OR p.account_type = 'creator'
    )
    SELECT cid,
           CAST(
               (
                   -- Role match (30%)
                   (CASE WHEN v_req_roles IS NULL OR array_length(v_req_roles, 1) = 0 THEN 30
                         WHEN c_roles IS NOT NULL AND c_roles && v_req_roles THEN 30
                         ELSE 0 END) +
                   -- Skill match (40%)
                   (CASE WHEN v_req_skills IS NULL OR array_length(v_req_skills, 1) = 0 THEN 40
                         WHEN c_skills IS NOT NULL AND c_skills && v_req_skills THEN 40
                         ELSE 0 END) +
                   -- Experience match (15%) - simplistic match
                   (CASE WHEN v_job.experience_level IS NULL THEN 15
                         WHEN c_exp_level = v_job.experience_level THEN 15
                         ELSE 5 END) +
                   -- Availability/Location fallback (15% constant for now to keep it simple, can be expanded)
                   15
               ) AS integer
           ) as score
    FROM creator_matches
    ORDER BY score DESC
    LIMIT p_limit;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_recommended_jobs_for_creator(p_creator_id uuid, p_limit integer DEFAULT 20)
RETURNS TABLE (
    job_id uuid,
    match_score integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_creator record;
    v_c_roles uuid[];
    v_c_skills uuid[];
BEGIN
    SELECT * INTO v_creator FROM public.profiles WHERE id = p_creator_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    SELECT array_agg(role_id) INTO v_c_roles FROM public.creator_roles WHERE creator_id = p_creator_id;
    SELECT array_agg(skill_id) INTO v_c_skills FROM public.creator_skills WHERE creator_id = p_creator_id;

    RETURN QUERY
    WITH job_matches AS (
        SELECT j.id as jid,
               j.experience_level as j_exp_level,
               (SELECT array_agg(role_id) FROM public.job_roles WHERE job_id = j.id) as j_roles,
               (SELECT array_agg(skill_id) FROM public.job_skills WHERE job_id = j.id) as j_skills
        FROM public.jobs j
        WHERE j.status = 'open'
    )
    SELECT jid,
           CAST(
               (
                   -- Role match (30%)
                   (CASE WHEN j_roles IS NULL OR array_length(j_roles, 1) = 0 THEN 30
                         WHEN v_c_roles IS NOT NULL AND v_c_roles && j_roles THEN 30
                         ELSE 0 END) +
                   -- Skill match (40%)
                   (CASE WHEN j_skills IS NULL OR array_length(j_skills, 1) = 0 THEN 40
                         WHEN v_c_skills IS NOT NULL AND v_c_skills && j_skills THEN 40
                         ELSE 0 END) +
                   -- Experience match (15%)
                   (CASE WHEN j_exp_level IS NULL THEN 15
                         WHEN v_creator.experience_level = j_exp_level THEN 15
                         ELSE 5 END) +
                   -- Location/Availability base match (15%)
                   15
               ) AS integer
           ) as score
    FROM job_matches
    ORDER BY score DESC
    LIMIT p_limit;
END;
$$;
