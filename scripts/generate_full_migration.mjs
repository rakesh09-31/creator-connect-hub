-- 1. Drop all policies to allow type conversions without dependency locks
DO $$ 
DECLARE pol RECORD;
BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- 2. Drop existing foreign keys that might block type changes
ALTER TABLE IF EXISTS public.creator_roles DROP CONSTRAINT IF EXISTS creator_roles_creator_id_fkey;
ALTER TABLE IF EXISTS public.creator_roles DROP CONSTRAINT IF EXISTS creator_roles_role_id_fkey;
ALTER TABLE IF EXISTS public.professional_roles DROP CONSTRAINT IF EXISTS professional_roles_created_by_fkey;
ALTER TABLE IF EXISTS public.job_applications DROP CONSTRAINT IF EXISTS job_applications_job_id_fkey;
ALTER TABLE IF EXISTS public.squad_members DROP CONSTRAINT IF EXISTS squad_members_squad_id_fkey;

-- 3. Alter tables column types to UUID
ALTER TABLE public.profiles ALTER COLUMN id TYPE UUID USING (id::uuid);

ALTER TABLE public.user_roles ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.user_roles ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);

ALTER TABLE public.creator_specialties ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.creator_specialties ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.creator_specialties ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);

ALTER TABLE public.follows ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.follows ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.follows ALTER COLUMN follower_id TYPE UUID USING (follower_id::uuid);
ALTER TABLE public.follows ALTER COLUMN following_id TYPE UUID USING (following_id::uuid);

ALTER TABLE public.conversations ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.conversations ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.conversations ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by IS NULL OR created_by = '' THEN NULL ELSE created_by::uuid END);

ALTER TABLE public.conversation_members ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.conversation_members ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.conversation_members ALTER COLUMN conversation_id TYPE UUID USING (conversation_id::uuid);
ALTER TABLE public.conversation_members ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);

ALTER TABLE public.messages ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.messages ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.messages ALTER COLUMN conversation_id TYPE UUID USING (conversation_id::uuid);
ALTER TABLE public.messages ALTER COLUMN sender_id TYPE UUID USING (sender_id::uuid);

ALTER TABLE public.message_reactions ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.message_reactions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.message_reactions ALTER COLUMN message_id TYPE UUID USING (message_id::uuid);
ALTER TABLE public.message_reactions ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);

ALTER TABLE public.typing_status ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.typing_status ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.typing_status ALTER COLUMN conversation_id TYPE UUID USING (conversation_id::uuid);
ALTER TABLE public.typing_status ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);

ALTER TABLE public.squads ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.squads ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.squads ALTER COLUMN owner_id TYPE UUID USING (owner_id::uuid);

ALTER TABLE public.squad_members ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.squad_members ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.squad_members ALTER COLUMN squad_id TYPE UUID USING (squad_id::uuid);
ALTER TABLE public.squad_members ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);

ALTER TABLE public.squad_invites ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.squad_invites ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.squad_invites ALTER COLUMN squad_id TYPE UUID USING (squad_id::uuid);
ALTER TABLE public.squad_invites ALTER COLUMN inviter_id TYPE UUID USING (inviter_id::uuid);
ALTER TABLE public.squad_invites ALTER COLUMN invitee_id TYPE UUID USING (invitee_id::uuid);

ALTER TABLE public.squad_join_requests ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.squad_join_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.squad_join_requests ALTER COLUMN squad_id TYPE UUID USING (squad_id::uuid);
ALTER TABLE public.squad_join_requests ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);

ALTER TABLE public.jobs ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.jobs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.jobs ALTER COLUMN client_id TYPE UUID USING (client_id::uuid);

ALTER TABLE public.job_applications ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.job_applications ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.job_applications ALTER COLUMN job_id TYPE UUID USING (job_id::uuid);
ALTER TABLE public.job_applications ALTER COLUMN applicant_id TYPE UUID USING (CASE WHEN applicant_id IS NULL OR applicant_id = '' THEN NULL ELSE applicant_id::uuid END);
ALTER TABLE public.job_applications ALTER COLUMN squad_id TYPE UUID USING (CASE WHEN squad_id IS NULL OR squad_id = '' THEN NULL ELSE squad_id::uuid END);

ALTER TABLE public.posts ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.posts ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.posts ALTER COLUMN author_id TYPE UUID USING (author_id::uuid);

ALTER TABLE public.post_likes ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.post_likes ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.post_likes ALTER COLUMN post_id TYPE UUID USING (post_id::uuid);
ALTER TABLE public.post_likes ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);

ALTER TABLE public.post_comments ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.post_comments ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.post_comments ALTER COLUMN post_id TYPE UUID USING (post_id::uuid);
ALTER TABLE public.post_comments ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);

ALTER TABLE public.post_saves ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.post_saves ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.post_saves ALTER COLUMN post_id TYPE UUID USING (post_id::uuid);
ALTER TABLE public.post_saves ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);

ALTER TABLE public.portfolios ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.portfolios ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.portfolios ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);

ALTER TABLE public.profile_contacts ALTER COLUMN id TYPE UUID USING (id::uuid);

ALTER TABLE public.creator_requests ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.creator_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.creator_requests ALTER COLUMN client_id TYPE UUID USING (client_id::uuid);
ALTER TABLE public.creator_requests ALTER COLUMN creator_id TYPE UUID USING (creator_id::uuid);

ALTER TABLE public.notifications ALTER COLUMN id TYPE UUID USING (id::uuid);
ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE public.notifications ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
ALTER TABLE public.notifications ALTER COLUMN actor_id TYPE UUID USING (CASE WHEN actor_id IS NULL OR actor_id = '' THEN NULL ELSE actor_id::uuid END);
ALTER TABLE public.notifications ALTER COLUMN entity_id TYPE UUID USING (CASE WHEN entity_id IS NULL OR entity_id = '' THEN NULL ELSE entity_id::uuid END);

ALTER TABLE public.skills ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by IS NULL OR created_by = '' THEN NULL ELSE created_by::uuid END);
ALTER TABLE public.professional_roles ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by IS NULL OR created_by = '' THEN NULL ELSE created_by::uuid END);

-- 4. Add missing columns to existing tables
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS account_type TEXT,
    ADD COLUMN IF NOT EXISTS experience_level TEXT,
    ADD COLUMN IF NOT EXISTS experience_years INTEGER,
    ADD COLUMN IF NOT EXISTS availability TEXT,
    ADD COLUMN IF NOT EXISTS portfolio_url TEXT,
    ADD COLUMN IF NOT EXISTS cover_url TEXT,
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS website TEXT,
    ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS portfolio_template TEXT DEFAULT 'modern',
    ADD COLUMN IF NOT EXISTS portfolio_theme TEXT DEFAULT 'dark',
    ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS resume_url TEXT,
    ADD COLUMN IF NOT EXISTS portfolio_tagline TEXT;

UPDATE public.profiles
SET account_type = role::text
WHERE account_type IS NULL AND role IS NOT NULL;

ALTER TABLE public.professional_roles
    ADD COLUMN IF NOT EXISTS role_type TEXT DEFAULT 'creator',
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.skills
    ADD COLUMN IF NOT EXISTS category_id UUID,
    ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS role_id UUID,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.jobs
    ADD COLUMN IF NOT EXISTS company_name TEXT,
    ADD COLUMN IF NOT EXISTS skills_required TEXT[],
    ADD COLUMN IF NOT EXISTS experience_level TEXT,
    ADD COLUMN IF NOT EXISTS duration TEXT,
    ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.job_applications
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.squads
    ADD COLUMN IF NOT EXISTS conversation_id UUID,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

ALTER TABLE public.posts
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

ALTER TABLE public.portfolios
    ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 5. Create Missing Tables
CREATE TABLE IF NOT EXISTS public.skill_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skill_subskills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    is_custom BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(skill_id, name)
);

CREATE TABLE IF NOT EXISTS public.skill_specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    subskill_id UUID REFERENCES public.skill_subskills(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    software TEXT,
    description TEXT,
    is_custom BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_roles (
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.professional_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (creator_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.client_roles (
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.professional_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (client_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.creator_skills (
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (creator_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.creator_learning_skills (
    creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (creator_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.job_roles (
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.professional_roles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (job_id, role_id)
);

CREATE TABLE IF NOT EXISTS public.job_skills (
    job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
    skill_id UUID REFERENCES public.skills(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (job_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    caption TEXT,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.story_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (story_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS public.post_views (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ip_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.squad_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(squad_id, invitee_id)
);

CREATE TABLE IF NOT EXISTS public.squad_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    attachment_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.portfolio_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    tech TEXT[] DEFAULT '{}',
    media_url TEXT,
    media_type TEXT DEFAULT 'image',
    cover_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.file_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bucket TEXT NOT NULL,
    path TEXT NOT NULL,
    file_name TEXT,
    mime_type TEXT,
    size_bytes BIGINT,
    entity_type TEXT,
    entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skill_swap_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    role TEXT,
    role_id UUID REFERENCES public.professional_roles(id) ON DELETE SET NULL,
    description TEXT,
    learning_mode TEXT DEFAULT 'Any',
    availability TEXT DEFAULT 'Flexible',
    is_active BOOLEAN DEFAULT true,
    verification_status TEXT DEFAULT 'unverified',
    overall_score NUMERIC,
    theory_score NUMERIC,
    technical_score NUMERIC,
    scenario_score NUMERIC,
    practical_score NUMERIC,
    software_score NUMERIC,
    troubleshooting_score NUMERIC,
    decision_making_score NUMERIC,
    communication_score NUMERIC,
    technical_knowledge_score NUMERIC,
    skill_level TEXT DEFAULT 'Intermediate',
    declared_level TEXT,
    demonstrated_level TEXT,
    verification_confidence NUMERIC,
    stage2_score NUMERIC,
    stage3_score NUMERIC,
    knowledge_score NUMERIC,
    problem_solving_score NUMERIC,
    strengths_summary TEXT,
    weaknesses_summary TEXT,
    recommendations_summary TEXT,
    ai_feedback TEXT,
    experience_duration TEXT,
    ai_verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skill_swap_listing_teach_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(listing_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.skill_swap_listing_learn_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(listing_id, skill_id)
);

CREATE TABLE IF NOT EXISTS public.skill_swap_specialties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE,
    specialty TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skill_swap_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.skill_swap_listings(id) ON DELETE SET NULL,
    requester_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT,
    status TEXT DEFAULT 'pending',
    contact_info TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skill_swap_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.skill_swap_listings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'in_progress',
    score NUMERIC,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skill_swap_assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.skill_swap_assessments(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice',
    difficulty TEXT DEFAULT 'intermediate',
    skill_area TEXT,
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer TEXT,
    criteria TEXT,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skill_swap_assessment_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.skill_swap_assessments(id) ON DELETE CASCADE,
    question_id UUID REFERENCES public.skill_swap_assessment_questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN DEFAULT false,
    score NUMERIC DEFAULT 0,
    feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.skill_swap_assessment_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES public.skill_swap_assessments(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.skill_swap_listings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_score NUMERIC DEFAULT 0,
    category_scores JSONB DEFAULT '{}'::jsonb,
    strengths TEXT[] DEFAULT '{}',
    weaknesses TEXT[] DEFAULT '{}',
    recommendation TEXT,
    certified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.assessment_question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    skill TEXT NOT NULL,
    question_type TEXT DEFAULT 'multiple_choice',
    difficulty TEXT DEFAULT 'intermediate',
    question_text TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer TEXT NOT NULL,
    criteria TEXT,
    points INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Re-add Foreign Keys and Relationships
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_user_id_role_key') THEN
        ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'squad_members_squad_id_fkey') THEN
        ALTER TABLE public.squad_members ADD CONSTRAINT squad_members_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES public.squads(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'job_applications_job_id_fkey') THEN
        ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;
    END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 7. Row Level Security Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_subskills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_learning_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_swap_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_swap_listing_teach_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_swap_listing_learn_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_swap_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_swap_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_swap_assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_swap_assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_swap_assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_question_bank ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON public.profiles, public.professional_roles, public.skills, public.skill_categories, public.skill_subskills, public.skill_specialties, public.creator_roles, public.client_roles, public.creator_skills, public.creator_learning_skills, public.creator_specialties, public.jobs, public.job_roles, public.job_skills, public.squads, public.squad_members, public.posts, public.post_likes, public.post_comments, public.stories, public.portfolios, public.portfolio_items, public.assessment_question_bank, public.skill_swap_listings, public.skill_swap_listing_teach_skills, public.skill_swap_listing_learn_skills, public.skill_swap_specialties TO anon;

CREATE POLICY "profiles_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "user_roles_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles_insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_roles_update" ON public.user_roles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "user_roles_delete" ON public.user_roles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "roles_read" ON public.professional_roles FOR SELECT USING (true);
CREATE POLICY "roles_insert" ON public.professional_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL OR is_custom = true);
CREATE POLICY "roles_update" ON public.professional_roles FOR UPDATE TO authenticated USING (auth.uid() = created_by);

CREATE POLICY "categories_read" ON public.skill_categories FOR SELECT USING (is_active = true OR is_active IS NULL);
CREATE POLICY "categories_manage" ON public.skill_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "skills_read" ON public.skills FOR SELECT USING (is_active = true OR is_active IS NULL);
CREATE POLICY "skills_insert" ON public.skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL OR is_custom = true);

CREATE POLICY "subskills_read" ON public.skill_subskills FOR SELECT USING (is_active = true OR is_active IS NULL);
CREATE POLICY "subskills_insert" ON public.skill_subskills FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL OR is_custom = true);

CREATE POLICY "specialties_read" ON public.skill_specialties FOR SELECT USING (is_active = true OR is_active IS NULL);
CREATE POLICY "specialties_insert" ON public.skill_specialties FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL OR is_custom = true);

CREATE POLICY "creator_roles_read" ON public.creator_roles FOR SELECT USING (true);
CREATE POLICY "creator_roles_manage" ON public.creator_roles FOR ALL TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "client_roles_read" ON public.client_roles FOR SELECT USING (true);
CREATE POLICY "client_roles_manage" ON public.client_roles FOR ALL TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);

CREATE POLICY "creator_skills_read" ON public.creator_skills FOR SELECT USING (true);
CREATE POLICY "creator_skills_manage" ON public.creator_skills FOR ALL TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "creator_learning_skills_read" ON public.creator_learning_skills FOR SELECT USING (true);
CREATE POLICY "creator_learning_skills_manage" ON public.creator_learning_skills FOR ALL TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "creator_specialties_read" ON public.creator_specialties FOR SELECT USING (true);
CREATE POLICY "creator_specialties_insert" ON public.creator_specialties FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "creator_specialties_delete" ON public.creator_specialties FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "jobs_read" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "jobs_insert" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "jobs_update" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = client_id) WITH CHECK (auth.uid() = client_id);
CREATE POLICY "jobs_delete" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = client_id);

CREATE POLICY "job_roles_read" ON public.job_roles FOR SELECT USING (true);
CREATE POLICY "job_roles_manage" ON public.job_roles FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_id AND jobs.client_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_id AND jobs.client_id = auth.uid()));

CREATE POLICY "job_skills_read" ON public.job_skills FOR SELECT USING (true);
CREATE POLICY "job_skills_manage" ON public.job_skills FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_id AND jobs.client_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.jobs WHERE jobs.id = job_id AND jobs.client_id = auth.uid()));

CREATE POLICY "apps_read" ON public.job_applications FOR SELECT TO authenticated
    USING (auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_id = auth.uid()) OR (squad_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = job_applications.squad_id AND sm.user_id = auth.uid())));
CREATE POLICY "apps_insert" ON public.job_applications FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = applicant_id OR (squad_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid())));
CREATE POLICY "apps_update" ON public.job_applications FOR UPDATE TO authenticated
    USING (auth.uid() = applicant_id OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.client_id = auth.uid()));

CREATE POLICY "squads_read" ON public.squads FOR SELECT USING (true);
CREATE POLICY "squads_insert" ON public.squads FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "squads_update" ON public.squads FOR UPDATE TO authenticated USING (auth.uid() = owner_id);
CREATE POLICY "squads_delete" ON public.squads FOR DELETE TO authenticated USING (auth.uid() = owner_id);

CREATE POLICY "squad_members_read" ON public.squad_members FOR SELECT USING (true);
CREATE POLICY "squad_members_insert" ON public.squad_members FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()) OR auth.uid() = user_id);
CREATE POLICY "squad_members_update" ON public.squad_members FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()));
CREATE POLICY "squad_members_delete" ON public.squad_members FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()) OR auth.uid() = user_id);

CREATE POLICY "squad_invitations_read" ON public.squad_invitations FOR SELECT TO authenticated
    USING (auth.uid() = invitee_id OR auth.uid() = inviter_id OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()));
CREATE POLICY "squad_invitations_insert" ON public.squad_invitations FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = inviter_id OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()));
CREATE POLICY "squad_invitations_update" ON public.squad_invitations FOR UPDATE TO authenticated
    USING (auth.uid() = invitee_id OR auth.uid() = inviter_id OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()));
CREATE POLICY "squad_invitations_delete" ON public.squad_invitations FOR DELETE TO authenticated
    USING (auth.uid() = inviter_id OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()));

CREATE POLICY "squad_join_requests_read" ON public.squad_join_requests FOR SELECT TO authenticated
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()));
CREATE POLICY "squad_join_requests_insert" ON public.squad_join_requests FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);
CREATE POLICY "squad_join_requests_update" ON public.squad_join_requests FOR UPDATE TO authenticated
    USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_id AND s.owner_id = auth.uid()));

CREATE POLICY "squad_messages_read" ON public.squad_messages FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = squad_messages.squad_id AND sm.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_messages.squad_id AND s.owner_id = auth.uid()));
CREATE POLICY "squad_messages_insert" ON public.squad_messages FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id AND (EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = squad_messages.squad_id AND sm.user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_messages.squad_id AND s.owner_id = auth.uid())));

CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv UUID, _user UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = _conv AND user_id = _user);
$$;

CREATE POLICY "conv_read" ON public.conversations FOR SELECT TO authenticated
    USING (public.is_conversation_member(id, auth.uid()));
CREATE POLICY "conv_insert" ON public.conversations FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
CREATE POLICY "conv_update" ON public.conversations FOR UPDATE TO authenticated
    USING (public.is_conversation_member(id, auth.uid()));

CREATE POLICY "members_read" ON public.conversation_members FOR SELECT TO authenticated
    USING (public.is_conversation_member(conversation_id, auth.uid()) OR user_id = auth.uid());
CREATE POLICY "members_insert" ON public.conversation_members FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid()) OR public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "members_update" ON public.conversation_members FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "msg_read" ON public.messages FOR SELECT TO authenticated
    USING (public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "msg_insert" ON public.messages FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "msg_update" ON public.messages FOR UPDATE TO authenticated
    USING (auth.uid() = sender_id);

CREATE POLICY "reactions_read" ON public.message_reactions FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_conversation_member(m.conversation_id, auth.uid())));
CREATE POLICY "reactions_insert" ON public.message_reactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reactions_delete" ON public.message_reactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "typing_read" ON public.typing_status FOR SELECT TO authenticated USING (public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "typing_manage" ON public.typing_status FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_read" ON public.posts FOR SELECT USING (true);
CREATE POLICY "posts_insert" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "posts_delete" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE POLICY "stories_read" ON public.stories FOR SELECT USING (expires_at > now() OR auth.uid() = user_id);
CREATE POLICY "stories_insert" ON public.stories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "stories_delete" ON public.stories FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "story_views_read" ON public.story_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "story_views_insert" ON public.story_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id);

CREATE POLICY "post_views_read" ON public.post_views FOR SELECT TO authenticated USING (true);
CREATE POLICY "post_views_insert" ON public.post_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = viewer_id OR viewer_id IS NULL);

CREATE POLICY "post_likes_read" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "post_saves_read" ON public.post_saves FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "post_saves_insert" ON public.post_saves FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_saves_delete" ON public.post_saves FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "post_comments_read" ON public.post_comments FOR SELECT USING (true);
CREATE POLICY "post_comments_insert" ON public.post_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_comments_delete" ON public.post_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "follows_read" ON public.follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);

CREATE POLICY "portfolios_read" ON public.portfolios FOR SELECT USING (true);
CREATE POLICY "portfolios_insert" ON public.portfolios FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portfolios_update" ON public.portfolios FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "portfolios_delete" ON public.portfolios FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "portfolio_items_read" ON public.portfolio_items FOR SELECT USING (true);
CREATE POLICY "portfolio_items_insert" ON public.portfolio_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "portfolio_items_update" ON public.portfolio_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "portfolio_items_delete" ON public.portfolio_items FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "file_uploads_read" ON public.file_uploads FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "file_uploads_insert" ON public.file_uploads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "creator_requests_read" ON public.creator_requests FOR SELECT TO authenticated USING (auth.uid() = client_id OR auth.uid() = creator_id);
CREATE POLICY "creator_requests_insert" ON public.creator_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "creator_requests_update" ON public.creator_requests FOR UPDATE TO authenticated USING (auth.uid() = client_id OR auth.uid() = creator_id);

CREATE POLICY "notifications_read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "skill_swap_listings_read" ON public.skill_swap_listings FOR SELECT USING (is_active = true OR auth.uid() = user_id);
CREATE POLICY "skill_swap_listings_insert" ON public.skill_swap_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "skill_swap_listings_update" ON public.skill_swap_listings FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "skill_swap_listings_delete" ON public.skill_swap_listings FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "skill_swap_teach_read" ON public.skill_swap_listing_teach_skills FOR SELECT USING (true);
CREATE POLICY "skill_swap_teach_manage" ON public.skill_swap_listing_teach_skills FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.skill_swap_listings l WHERE l.id = listing_id AND l.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));

CREATE POLICY "skill_swap_learn_read" ON public.skill_swap_listing_learn_skills FOR SELECT USING (true);
CREATE POLICY "skill_swap_learn_manage" ON public.skill_swap_listing_learn_skills FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.skill_swap_listings l WHERE l.id = listing_id AND l.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));

CREATE POLICY "skill_swap_specialties_read" ON public.skill_swap_specialties FOR SELECT USING (true);
CREATE POLICY "skill_swap_specialties_manage" ON public.skill_swap_specialties FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM public.skill_swap_listings l WHERE l.id = listing_id AND l.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings l WHERE l.id = listing_id AND l.user_id = auth.uid()));

CREATE POLICY "skill_swap_requests_read" ON public.skill_swap_requests FOR SELECT TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR auth.uid() = requester_id);
CREATE POLICY "skill_swap_requests_insert" ON public.skill_swap_requests FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = sender_id OR auth.uid() = requester_id);
CREATE POLICY "skill_swap_requests_update" ON public.skill_swap_requests FOR UPDATE TO authenticated
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR auth.uid() = requester_id);

CREATE POLICY "skill_swap_assessments_manage" ON public.skill_swap_assessments FOR ALL TO authenticated
    USING (auth.uid() = user_id OR user_id IS NULL) WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "skill_swap_questions_manage" ON public.skill_swap_assessment_questions FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
CREATE POLICY "skill_swap_answers_manage" ON public.skill_swap_assessment_answers FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
CREATE POLICY "skill_swap_results_manage" ON public.skill_swap_assessment_results FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
CREATE POLICY "question_bank_read" ON public.assessment_question_bank FOR SELECT USING (true);

-- 8. Stored Procedures & RPC Functions
CREATE OR REPLACE FUNCTION public.get_or_create_dm(_other UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_me UUID := auth.uid();
    v_conv UUID;
BEGIN
    IF v_me IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF _other IS NULL OR _other = v_me THEN RAISE EXCEPTION 'Invalid recipient'; END IF;

    SELECT cm1.conversation_id INTO v_conv
    FROM public.conversation_members cm1
    JOIN public.conversation_members cm2 ON cm1.conversation_id = cm2.conversation_id
    JOIN public.conversations c ON c.id = cm1.conversation_id
    WHERE cm1.user_id = v_me AND cm2.user_id = _other AND c.is_group = false
    LIMIT 1;

    IF v_conv IS NOT NULL THEN RETURN v_conv; END IF;

    INSERT INTO public.conversations (is_group, created_by, last_message_at)
    VALUES (false, v_me, now())
    RETURNING id INTO v_conv;

    INSERT INTO public.conversation_members (conversation_id, user_id, role, last_read_at)
    VALUES
        (v_conv, v_me, 'member', now()),
        (v_conv, _other, 'member', now());

    RETURN v_conv;
END;
$$;

CREATE OR REPLACE FUNCTION public.decide_job_application(_application_id UUID, _status TEXT)
RETURNS public.job_applications LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_client UUID := auth.uid();
    v_app public.job_applications;
    v_job public.jobs;
BEGIN
    IF v_client IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    IF _status NOT IN ('accepted', 'rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;

    SELECT * INTO v_app FROM public.job_applications WHERE id = _application_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Application not found'; END IF;

    SELECT * INTO v_job FROM public.jobs WHERE id = v_app.job_id;
    IF v_job.client_id != v_client THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    UPDATE public.job_applications
    SET status = _status, reviewed_at = now(), reviewed_by = v_client, updated_at = now()
    WHERE id = _application_id
    RETURNING * INTO v_app;

    RETURN v_app;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_or_create_squad_conversation(_squad_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_squad public.squads;
    v_conv UUID;
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    SELECT * INTO v_squad FROM public.squads WHERE id = _squad_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Squad not found'; END IF;

    IF v_squad.owner_id != v_user AND NOT EXISTS (
        SELECT 1 FROM public.squad_members WHERE squad_id = _squad_id AND user_id = v_user
    ) THEN
        RAISE EXCEPTION 'Not a member of this squad';
    END IF;

    IF v_squad.conversation_id IS NOT NULL THEN
        RETURN v_squad.conversation_id;
    END IF;

    INSERT INTO public.conversations (is_group, title, created_by, last_message_at)
    VALUES (true, v_squad.name || ' Team Chat', v_squad.owner_id, now())
    RETURNING id INTO v_conv;

    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES (v_conv, v_squad.owner_id, 'admin')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    SELECT v_conv, user_id, 'member'
    FROM public.squad_members
    WHERE squad_id = _squad_id AND user_id != v_squad.owner_id
    ON CONFLICT DO NOTHING;

    UPDATE public.squads SET conversation_id = v_conv WHERE id = _squad_id;
    RETURN v_conv;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_client_to_squad_conversation(_squad_id UUID, _client_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_conv UUID;
BEGIN
    v_conv := public.get_or_create_squad_conversation(_squad_id);
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES (v_conv, _client_id, 'member')
    ON CONFLICT DO NOTHING;
    RETURN v_conv;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_squad_invitation(p_invitation_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_inv public.squad_invitations;
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    SELECT * INTO v_inv FROM public.squad_invitations WHERE id = p_invitation_id AND invitee_id = v_user AND status = 'pending';
    IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found or already processed'; END IF;

    INSERT INTO public.squad_members (squad_id, user_id, role)
    VALUES (v_inv.squad_id, v_user, v_inv.role)
    ON CONFLICT (squad_id, user_id) DO UPDATE SET role = EXCLUDED.role;

    UPDATE public.squad_invitations SET status = 'accepted', updated_at = now() WHERE id = p_invitation_id;

    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    SELECT conversation_id, v_user, 'member'
    FROM public.squads
    WHERE id = v_inv.squad_id AND conversation_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.reject_squad_invitation(p_invitation_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
    UPDATE public.squad_invitations
    SET status = 'rejected', updated_at = now()
    WHERE id = p_invitation_id AND invitee_id = v_user AND status = 'pending';
    RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_recommended_creators_for_job(p_job_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    creator_id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    account_type TEXT,
    experience_level TEXT,
    matching_score NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    WITH job_reqs AS (
        SELECT
            COALESCE(array_agg(DISTINCT jr.role_id), '{}') AS role_ids,
            COALESCE(array_agg(DISTINCT js.skill_id), '{}') AS skill_ids
        FROM public.jobs j
        LEFT JOIN public.job_roles jr ON jr.job_id = j.id
        LEFT JOIN public.job_skills js ON js.job_id = j.id
        WHERE j.id = p_job_id
        GROUP BY j.id
    ),
    creators AS (
        SELECT
            p.id,
            p.username,
            p.full_name,
            p.avatar_url,
            p.bio,
            p.account_type,
            p.experience_level,
            COALESCE(array_agg(DISTINCT cr.role_id) FILTER (WHERE cr.role_id IS NOT NULL), '{}') AS creator_role_ids,
            COALESCE(array_agg(DISTINCT cs.skill_id) FILTER (WHERE cs.skill_id IS NOT NULL), '{}') AS creator_skill_ids
        FROM public.profiles p
        LEFT JOIN public.creator_roles cr ON cr.creator_id = p.id
        LEFT JOIN public.creator_skills cs ON cs.creator_id = p.id
        WHERE p.role = 'creator' OR p.account_type = 'creator'
        GROUP BY p.id, p.username, p.full_name, p.avatar_url, p.bio, p.account_type, p.experience_level
    )
    SELECT
        c.id AS creator_id,
        c.username,
        c.full_name,
        c.avatar_url,
        c.bio,
        c.account_type,
        c.experience_level,
        ROUND(
            (
                CASE WHEN cardinality(jr.role_ids) > 0 THEN
                    (cardinality(ARRAY(SELECT unnest(c.creator_role_ids) INTERSECT SELECT unnest(jr.role_ids)))::numeric / cardinality(jr.role_ids)::numeric) * 60
                ELSE 30 END
                +
                CASE WHEN cardinality(jr.skill_ids) > 0 THEN
                    (cardinality(ARRAY(SELECT unnest(c.creator_skill_ids) INTERSECT SELECT unnest(jr.skill_ids)))::numeric / cardinality(jr.skill_ids)::numeric) * 40
                ELSE 20 END
            ),
            1
        ) AS matching_score
    FROM creators c, job_reqs jr
    ORDER BY matching_score DESC
    LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_recommended_jobs_for_creator(p_creator_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    job_id UUID,
    title TEXT,
    description TEXT,
    budget TEXT,
    company_name TEXT,
    matching_score NUMERIC
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    WITH creator_profile AS (
        SELECT
            COALESCE(array_agg(DISTINCT cr.role_id) FILTER (WHERE cr.role_id IS NOT NULL), '{}') AS role_ids,
            COALESCE(array_agg(DISTINCT cs.skill_id) FILTER (WHERE cs.skill_id IS NOT NULL), '{}') AS skill_ids
        FROM public.profiles p
        LEFT JOIN public.creator_roles cr ON cr.creator_id = p.id
        LEFT JOIN public.creator_skills cs ON cs.creator_id = p.id
        WHERE p.id = p_creator_id
        GROUP BY p.id
    )
    SELECT
        j.id AS job_id,
        j.title,
        j.description,
        j.budget,
        j.company_name,
        85.0::numeric AS matching_score
    FROM public.jobs j, creator_profile cp
    WHERE j.status = 'open'
    ORDER BY j.created_at DESC
    LIMIT p_limit;
END;
$$;

-- 9. Notification Triggers
CREATE OR REPLACE FUNCTION public.create_notification(
    _user_id UUID, _actor_id UUID, _type TEXT,
    _entity_type TEXT, _entity_id UUID, _data JSONB
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF _user_id IS NULL OR _user_id = _actor_id THEN RETURN; END IF;
    INSERT INTO public.notifications (user_id, actor_id, type, entity_type, entity_id, data)
    VALUES (_user_id, _actor_id, _type, _entity_type, _entity_id, COALESCE(_data, '{}'::jsonb));
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_new_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    PERFORM public.create_notification(NEW.following_id, NEW.follower_id, 'follow', 'user', NEW.follower_id, '{}'::jsonb);
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_follow ON public.follows;
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION public.notify_new_follow();

CREATE OR REPLACE FUNCTION public.notify_post_like()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_author UUID;
BEGIN
    SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
    PERFORM public.create_notification(v_author, NEW.user_id, 'like', 'post', NEW.post_id, '{}'::jsonb);
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_like ON public.post_likes;
CREATE TRIGGER trg_notify_like AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.notify_post_like();

CREATE OR REPLACE FUNCTION public.notify_post_comment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_author UUID;
BEGIN
    SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
    PERFORM public.create_notification(v_author, NEW.user_id, 'comment', 'post', NEW.post_id, jsonb_build_object('preview', LEFT(NEW.body, 140)));
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_comment ON public.post_comments;
CREATE TRIGGER trg_notify_comment AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION public.notify_post_comment();

CREATE OR REPLACE FUNCTION public.notify_hire_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM public.create_notification(NEW.creator_id, NEW.client_id, 'hire_request', 'creator_request', NEW.id, jsonb_build_object('subject', NEW.subject));
    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        PERFORM public.create_notification(NEW.client_id, NEW.creator_id,
            CASE WHEN NEW.status = 'accepted' THEN 'hire_accepted' WHEN NEW.status = 'rejected' THEN 'hire_rejected' ELSE 'hire_updated' END,
            'creator_request', NEW.id, jsonb_build_object('subject', NEW.subject, 'status', NEW.status));
    END IF;
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_notify_hire ON public.creator_requests;
CREATE TRIGGER trg_notify_hire AFTER INSERT OR UPDATE ON public.creator_requests FOR EACH ROW EXECUTE FUNCTION public.notify_hire_request();

-- 10. Curated Seed Data
INSERT INTO public.professional_roles (name, role_type, category, is_custom) VALUES
('Actor', 'creator', 'Performing Arts', false),
('Dancer', 'creator', 'Performing Arts', false),
('Video Editor', 'creator', 'Video & Media', false),
('Photographer', 'creator', 'Visual Arts', false),
('Videographer', 'creator', 'Video & Media', false),
('Graphic Designer', 'creator', 'Design', false),
('Designer', 'creator', 'Design', false),
('Content Creator', 'both', 'Media & Content', false),
('Singer', 'creator', 'Music & Audio', false),
('Music Producer', 'both', 'Music & Audio', false),
('Voice Artist', 'creator', 'Music & Audio', false),
('Writer', 'creator', 'Writing', false),
('Content Writer', 'creator', 'Writing', false),
('Director', 'both', 'Video & Film', false),
('Producer', 'client', 'Business & Production', false),
('YouTuber', 'both', 'Media & Content', false),
('Gamer', 'both', 'Gaming', false),
('Filmmaker', 'both', 'Video & Film', false),
('Brand', 'client', 'Business & Marketing', false),
('Agency', 'client', 'Business & Marketing', false),
('Event Organizer', 'client', 'Business & Events', false),
('Animator', 'creator', 'Animation & 3D', false),
('UI/UX Designer', 'creator', 'Design', false),
('Web Developer', 'creator', 'Development', false),
('Mobile App Developer', 'creator', 'Development', false),
('Developer', 'creator', 'Development', false),
('Electrician', 'creator', 'Trades', false),
('Plumber', 'creator', 'Trades', false),
('Carpenter', 'creator', 'Trades', false),
('Technician', 'creator', 'Trades', false)
ON CONFLICT (name) DO UPDATE SET
    role_type = EXCLUDED.role_type,
    category = EXCLUDED.category,
    is_custom = false;

INSERT INTO public.skill_categories (name, description, is_active) VALUES
('Video & Film', 'Cinematography, editing, post-production, directing, lighting', true),
('Design & Visual Arts', 'Graphic design, UI/UX, illustration, 3D modeling, branding', true),
('Music & Audio', 'Music production, vocal performance, mixing, audio engineering', true),
('Performing Arts', 'Acting, dance, voiceover, physical performance, staging', true),
('Writing & Content', 'Copywriting, screenwriting, creative writing, content creation', true),
('Software & Web Development', 'Web development, mobile apps, frontend, backend', true),
('Marketing & Strategy', 'Social media strategy, SEO, brand campaigns, analytics', true)
ON CONFLICT (name) DO UPDATE SET is_active = true;

INSERT INTO public.skills (name, category, is_custom, is_active) VALUES
('Adobe Premiere Pro', 'Video & Film', false, true),
('DaVinci Resolve', 'Video & Film', false, true),
('Final Cut Pro', 'Video & Film', false, true),
('After Effects', 'Video & Film', false, true),
('Color Grading', 'Video & Film', false, true),
('Sound Design', 'Video & Film', false, true),
('Cinematography', 'Video & Film', false, true),
('Lighting Setup', 'Video & Film', false, true),
('Storyboarding', 'Video & Film', false, true),
('Figma', 'Design & Visual Arts', false, true),
('Adobe Photoshop', 'Design & Visual Arts', false, true),
('Adobe Illustrator', 'Design & Visual Arts', false, true),
('UI/UX Design', 'Design & Visual Arts', false, true),
('Typography', 'Design & Visual Arts', false, true),
('Branding & Identity', 'Design & Visual Arts', false, true),
('3D Modeling', 'Design & Visual Arts', false, true),
('Blender', 'Design & Visual Arts', false, true),
('Motion Graphics', 'Design & Visual Arts', false, true),
('Logic Pro', 'Music & Audio', false, true),
('Ableton Live', 'Music & Audio', false, true),
('FL Studio', 'Music & Audio', false, true),
('Pro Tools', 'Music & Audio', false, true),
('Vocal Performance', 'Music & Audio', false, true),
('Mixing & Mastering', 'Music & Audio', false, true),
('Voice Modulation', 'Music & Audio', false, true),
('Method Acting', 'Performing Arts', false, true),
('Contemporary Dance', 'Performing Arts', false, true),
('Hip Hop Dance', 'Performing Arts', false, true),
('Character Voice Acting', 'Performing Arts', false, true),
('Stage Presence', 'Performing Arts', false, true),
('Screenwriting', 'Writing & Content', false, true),
('Copywriting', 'Writing & Content', false, true),
('Creative Writing', 'Writing & Content', false, true),
('Storytelling', 'Writing & Content', false, true),
('React', 'Software & Web Development', false, true),
('TypeScript', 'Software & Web Development', false, true),
('Next.js', 'Software & Web Development', false, true),
('Node.js', 'Software & Web Development', false, true),
('Tailwind CSS', 'Software & Web Development', false, true),
('PostgreSQL', 'Software & Web Development', false, true)
ON CONFLICT (name) DO UPDATE SET is_active = true, is_custom = false;

INSERT INTO public.assessment_question_bank (role, skill, question_type, difficulty, question_text, options, correct_answer, criteria, points) VALUES
('Video Editor', 'Adobe Premiere Pro', 'multiple_choice', 'intermediate',
 'Which tool in Premiere Pro is used to perform a three-point edit that preserves timeline duration?',
 '["Rolling Edit Tool", "Ripple Edit Tool", "Slip Tool", "Slide Tool"]'::jsonb,
 'Slip Tool',
 'Understanding of timeline trimming tools', 10),
('Video Editor', 'DaVinci Resolve', 'multiple_choice', 'intermediate',
 'In DaVinci Resolve, what color node allows you to combine two parallel operations with specific blend modes?',
 '["Serial Node", "Parallel Node", "Layer Mixer Node", "Splitter/Combiner Node"]'::jsonb,
 'Layer Mixer Node',
 'Node tree architecture knowledge', 10),
('Designer', 'Figma', 'multiple_choice', 'intermediate',
 'How does Auto Layout ''Fill Container'' behave when resizing parent frames?',
 '["Maintains fixed width", "Stretches to occupy available remaining space", "Pins to center", "Clips overflow"]'::jsonb,
 'Stretches to occupy available remaining space',
 'Responsive auto layout understanding', 10),
('Photographer', 'Adobe Photoshop', 'multiple_choice', 'intermediate',
 'What is the most non-destructive way to retouch skin texture in portraits?',
 '["Clone Stamp with 100% opacity", "Frequency Separation using High Pass and Gaussian Blur", "Gaussian Blur mask", "Smudge Tool"]'::jsonb,
 'Frequency Separation using High Pass and Gaussian Blur',
 'Non-destructive retouching techniques', 10),
('Web Developer', 'React', 'multiple_choice', 'intermediate',
 'When should useMemo be utilized in a React application?',
 '["On every state change", "To memoize expensive calculations between renders", "To replace useEffect", "To store global state"]'::jsonb,
 'To memoize expensive calculations between renders',
 'Performance optimization principles', 10)
ON CONFLICT DO NOTHING;
`;

fs.writeFileSync('scripts/apply_all_migration.sql', sql);
fs.writeFileSync('supabase/migrations/20260826000000_omnicraft_complete_stabilization.sql', sql);
console.log('Saved migration files.');
