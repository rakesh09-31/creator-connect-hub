-- ============================================================================
-- OmniCraft Complete Skill Swap & AI Verification Database Migration
-- All-in-one, idempotent, production-ready schema with RLS, indexes & seed bank
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Reusable Helper Functions & Triggers
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- 1. Extend professional_roles (reusable existing table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.professional_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    role_type text DEFAULT 'creator',
    category text DEFAULT 'General',
    description text,
    is_custom boolean DEFAULT false,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.professional_roles
    ADD COLUMN IF NOT EXISTS role_type text DEFAULT 'creator',
    ADD COLUMN IF NOT EXISTS category text DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.professional_roles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professional_roles' AND policyname = 'Anyone can view professional roles') THEN
    CREATE POLICY "Anyone can view professional roles" ON public.professional_roles FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professional_roles' AND policyname = 'Users can insert custom professional roles') THEN
    CREATE POLICY "Users can insert custom professional roles" ON public.professional_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Create skill_categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_categories (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_categories' AND policyname = 'Anyone can view skill categories') THEN
    CREATE POLICY "Anyone can view skill categories" ON public.skill_categories FOR SELECT TO authenticated USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_categories' AND policyname = 'Admins can manage skill categories') THEN
    CREATE POLICY "Admins can manage skill categories" ON public.skill_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. Extend skills (reusable existing table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    category_id uuid REFERENCES public.skill_categories(id) ON DELETE SET NULL,
    category text DEFAULT 'General',
    role_id uuid REFERENCES public.professional_roles(id) ON DELETE SET NULL,
    description text,
    is_custom boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.skills
    ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.skill_categories(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS category text DEFAULT 'General',
    ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.professional_roles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS is_custom boolean DEFAULT false,
    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skills' AND policyname = 'Anyone can view skills') THEN
    CREATE POLICY "Anyone can view skills" ON public.skills FOR SELECT TO authenticated USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skills' AND policyname = 'Users can add custom skills') THEN
    CREATE POLICY "Users can add custom skills" ON public.skills FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 4. Create skill_subskills
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_subskills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    category text,
    description text,
    is_custom boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(skill_id, name)
);

ALTER TABLE public.skill_subskills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_subskills' AND policyname = 'Anyone can view skill subskills') THEN
    CREATE POLICY "Anyone can view skill subskills" ON public.skill_subskills FOR SELECT TO authenticated USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_subskills' AND policyname = 'Users can add custom subskills') THEN
    CREATE POLICY "Users can add custom subskills" ON public.skill_subskills FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 5. Create skill_specialties
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_specialties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    subskill_id uuid REFERENCES public.skill_subskills(id) ON DELETE SET NULL,
    name text NOT NULL,
    software text,
    description text,
    is_custom boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(skill_id, name)
);

ALTER TABLE public.skill_specialties ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_specialties' AND policyname = 'Anyone can view skill specialties') THEN
    CREATE POLICY "Anyone can view skill specialties" ON public.skill_specialties FOR SELECT TO authenticated USING (is_active = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_specialties' AND policyname = 'Users can add custom specialties') THEN
    CREATE POLICY "Users can add custom specialties" ON public.skill_specialties FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 6. Extend creator_skills (reusable existing table)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    declared_level text,
    level text,
    specialties text[] DEFAULT '{}',
    experience_duration text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.creator_skills
    ADD COLUMN IF NOT EXISTS declared_level text,
    ADD COLUMN IF NOT EXISTS level text,
    ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS experience_duration text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.creator_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_skills' AND policyname = 'Anyone can view creator skills') THEN
    CREATE POLICY "Anyone can view creator skills" ON public.creator_skills FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_skills' AND policyname = 'Users can manage their creator skills') THEN
    CREATE POLICY "Users can manage their creator skills" ON public.creator_skills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 7. Create creator_learning_skills
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.creator_learning_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    desired_level text,
    requirements text,
    learning_requirements text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id, skill_id)
);

ALTER TABLE public.creator_learning_skills
    ADD COLUMN IF NOT EXISTS desired_level text,
    ADD COLUMN IF NOT EXISTS requirements text,
    ADD COLUMN IF NOT EXISTS learning_requirements text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.creator_learning_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_learning_skills' AND policyname = 'Anyone can view creator learning skills') THEN
    CREATE POLICY "Anyone can view creator learning skills" ON public.creator_learning_skills FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'creator_learning_skills' AND policyname = 'Users manage their learning skills') THEN
    CREATE POLICY "Users manage their learning skills" ON public.creator_learning_skills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 8. Create / Extend skill_swap_listings (MAIN TABLE)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_swap_listings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text,
    role text,
    role_id uuid REFERENCES public.professional_roles(id) ON DELETE SET NULL,
    description text,
    learning_mode text DEFAULT 'Online',
    availability text,
    is_active boolean DEFAULT true,
    verification_status text DEFAULT 'pending',
    verification_confidence text DEFAULT 'low',
    overall_score numeric(5,2),
    theory_score numeric(5,2),
    technical_score numeric(5,2),
    scenario_score numeric(5,2),
    practical_score numeric(5,2),
    software_score numeric(5,2),
    troubleshooting_score numeric(5,2),
    decision_making_score numeric(5,2),
    communication_score numeric(5,2),
    technical_knowledge_score numeric(5,2),
    knowledge_score numeric(5,2),
    problem_solving_score numeric(5,2),
    stage2_score numeric(5,2),
    stage3_score numeric(5,2),
    skill_level text,
    declared_level text,
    demonstrated_level text,
    ai_feedback text,
    recommendations_summary text,
    strengths_summary text,
    weaknesses_summary text,
    experience_duration text,
    ai_verified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Fully ensure all columns exist on skill_swap_listings
ALTER TABLE public.skill_swap_listings
    ADD COLUMN IF NOT EXISTS title text,
    ADD COLUMN IF NOT EXISTS role text,
    ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.professional_roles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS description text,
    ADD COLUMN IF NOT EXISTS learning_mode text DEFAULT 'Online',
    ADD COLUMN IF NOT EXISTS availability text,
    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS verification_confidence text DEFAULT 'low',
    ADD COLUMN IF NOT EXISTS overall_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS theory_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS technical_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS scenario_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS practical_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS software_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS troubleshooting_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS decision_making_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS communication_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS technical_knowledge_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS knowledge_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS problem_solving_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS stage2_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS stage3_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS skill_level text,
    ADD COLUMN IF NOT EXISTS declared_level text,
    ADD COLUMN IF NOT EXISTS demonstrated_level text,
    ADD COLUMN IF NOT EXISTS ai_feedback text,
    ADD COLUMN IF NOT EXISTS recommendations_summary text,
    ADD COLUMN IF NOT EXISTS strengths_summary text,
    ADD COLUMN IF NOT EXISTS weaknesses_summary text,
    ADD COLUMN IF NOT EXISTS experience_duration text,
    ADD COLUMN IF NOT EXISTS ai_verified_at timestamptz,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'skill_swap_listings_user_id_fkey'
  ) THEN
    ALTER TABLE public.skill_swap_listings 
      ADD CONSTRAINT skill_swap_listings_user_id_fkey 
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_skill_swap_listings_updated_at'
  ) THEN
    CREATE TRIGGER tr_skill_swap_listings_updated_at
        BEFORE UPDATE ON public.skill_swap_listings
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

ALTER TABLE public.skill_swap_listings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listings' AND policyname = 'Anyone can view active skill swap listings') THEN
    CREATE POLICY "Anyone can view active skill swap listings" ON public.skill_swap_listings FOR SELECT TO authenticated USING (is_active = true OR auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listings' AND policyname = 'Users can create their own skill swap listings') THEN
    CREATE POLICY "Users can create their own skill swap listings" ON public.skill_swap_listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listings' AND policyname = 'Users can update their own skill swap listings') THEN
    CREATE POLICY "Users can update their own skill swap listings" ON public.skill_swap_listings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listings' AND policyname = 'Users can delete their own skill swap listings') THEN
    CREATE POLICY "Users can delete their own skill swap listings" ON public.skill_swap_listings FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 9. Create skill_swap_listing_teach_skills (and alias skill_swap_listing_skills)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_swap_listing_teach_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    skill_name text,
    skill_level text,
    sub_skills text[] DEFAULT '{}',
    software text[] DEFAULT '{}',
    specialties text[] DEFAULT '{}',
    verification_status text DEFAULT 'self_declared',
    created_at timestamptz DEFAULT now(),
    UNIQUE(listing_id, skill_id)
);

ALTER TABLE public.skill_swap_listing_teach_skills
    ADD COLUMN IF NOT EXISTS skill_name text,
    ADD COLUMN IF NOT EXISTS skill_level text,
    ADD COLUMN IF NOT EXISTS sub_skills text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS software text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'self_declared';

ALTER TABLE public.skill_swap_listing_teach_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listing_teach_skills' AND policyname = 'Anyone can view teach skills') THEN
    CREATE POLICY "Anyone can view teach skills" ON public.skill_swap_listing_teach_skills FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listing_teach_skills' AND policyname = 'Users can manage teach skills for their listings') THEN
    CREATE POLICY "Users can manage teach skills for their listings" ON public.skill_swap_listing_teach_skills FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()));
  END IF;
END $$;

-- Also support direct table name skill_swap_listing_skills
CREATE TABLE IF NOT EXISTS public.skill_swap_listing_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    skill_name text,
    skill_level text,
    sub_skills text[] DEFAULT '{}',
    software text[] DEFAULT '{}',
    specialties text[] DEFAULT '{}',
    verification_status text DEFAULT 'self_declared',
    created_at timestamptz DEFAULT now(),
    UNIQUE(listing_id, skill_id)
);
ALTER TABLE public.skill_swap_listing_skills ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listing_skills' AND policyname = 'Anyone can view listing skills') THEN
    CREATE POLICY "Anyone can view listing skills" ON public.skill_swap_listing_skills FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listing_skills' AND policyname = 'Users can manage listing skills') THEN
    CREATE POLICY "Users can manage listing skills" ON public.skill_swap_listing_skills FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 10. Create skill_swap_listing_learn_skills (and alias skill_swap_listing_learning_skills)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_swap_listing_learn_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    skill_name text,
    desired_level text,
    requirement text,
    requirements text,
    sub_skills text[] DEFAULT '{}',
    desired_software text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    UNIQUE(listing_id, skill_id)
);

ALTER TABLE public.skill_swap_listing_learn_skills
    ADD COLUMN IF NOT EXISTS skill_name text,
    ADD COLUMN IF NOT EXISTS desired_level text,
    ADD COLUMN IF NOT EXISTS requirement text,
    ADD COLUMN IF NOT EXISTS requirements text,
    ADD COLUMN IF NOT EXISTS sub_skills text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS desired_software text[] DEFAULT '{}';

ALTER TABLE public.skill_swap_listing_learn_skills ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listing_learn_skills' AND policyname = 'Anyone can view learn skills') THEN
    CREATE POLICY "Anyone can view learn skills" ON public.skill_swap_listing_learn_skills FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listing_learn_skills' AND policyname = 'Users can manage learn skills for their listings') THEN
    CREATE POLICY "Users can manage learn skills for their listings" ON public.skill_swap_listing_learn_skills FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()));
  END IF;
END $$;

-- Also support table name skill_swap_listing_learning_skills
CREATE TABLE IF NOT EXISTS public.skill_swap_listing_learning_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    skill_name text,
    desired_level text,
    requirement text,
    requirements text,
    sub_skills text[] DEFAULT '{}',
    desired_software text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now(),
    UNIQUE(listing_id, skill_id)
);
ALTER TABLE public.skill_swap_listing_learning_skills ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listing_learning_skills' AND policyname = 'Anyone can view learning skills') THEN
    CREATE POLICY "Anyone can view learning skills" ON public.skill_swap_listing_learning_skills FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listing_learning_skills' AND policyname = 'Users can manage learning skills') THEN
    CREATE POLICY "Users can manage learning skills" ON public.skill_swap_listing_learning_skills FOR ALL TO authenticated
      USING (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 11. Create skill_swap_specialties (and alias skill_swap_listing_specialties)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_swap_specialties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    subskill_id uuid REFERENCES public.skill_subskills(id) ON DELETE SET NULL,
    specialty_id uuid REFERENCES public.skill_specialties(id) ON DELETE SET NULL,
    specialty_name text NOT NULL,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.skill_swap_specialties
    ADD COLUMN IF NOT EXISTS subskill_id uuid REFERENCES public.skill_subskills(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS specialty_id uuid REFERENCES public.skill_specialties(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS specialty_name text;

ALTER TABLE public.skill_swap_specialties ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_specialties' AND policyname = 'Anyone can view specialties') THEN
    CREATE POLICY "Anyone can view specialties" ON public.skill_swap_specialties FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_specialties' AND policyname = 'Users manage specialties') THEN
    CREATE POLICY "Users manage specialties" ON public.skill_swap_specialties FOR ALL TO authenticated 
      USING (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.skill_swap_listing_specialties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    subskill_id uuid REFERENCES public.skill_subskills(id) ON DELETE SET NULL,
    specialty_id uuid REFERENCES public.skill_specialties(id) ON DELETE SET NULL,
    specialty_name text NOT NULL,
    created_at timestamptz DEFAULT now()
);
ALTER TABLE public.skill_swap_listing_specialties ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listing_specialties' AND policyname = 'Anyone can view listing specialties') THEN
    CREATE POLICY "Anyone can view listing specialties" ON public.skill_swap_listing_specialties FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_listing_specialties' AND policyname = 'Users manage listing specialties') THEN
    CREATE POLICY "Users manage listing specialties" ON public.skill_swap_listing_specialties FOR ALL TO authenticated 
      USING (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 12. Create skill_swap_assessments
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_swap_assessments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    role_name text,
    skill_name text,
    declared_level text,
    demonstrated_level text,
    verification_confidence text DEFAULT 'low',
    assessment_type text DEFAULT 'adaptive_technical_assessment',
    assessment_stage integer DEFAULT 2,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    overall_score numeric(5,2),
    theory_score numeric(5,2),
    technical_score numeric(5,2),
    scenario_score numeric(5,2),
    practical_score numeric(5,2),
    software_score numeric(5,2),
    troubleshooting_score numeric(5,2),
    decision_making_score numeric(5,2),
    communication_score numeric(5,2),
    knowledge_score numeric(5,2),
    problem_solving_score numeric(5,2),
    stage2_score numeric(5,2),
    stage3_score numeric(5,2),
    strengths text,
    weaknesses text,
    recommendations text,
    ai_feedback text,
    started_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.skill_swap_assessments
    ADD COLUMN IF NOT EXISTS role_name text,
    ADD COLUMN IF NOT EXISTS skill_name text,
    ADD COLUMN IF NOT EXISTS declared_level text,
    ADD COLUMN IF NOT EXISTS demonstrated_level text,
    ADD COLUMN IF NOT EXISTS verification_confidence text DEFAULT 'low',
    ADD COLUMN IF NOT EXISTS assessment_type text DEFAULT 'adaptive_technical_assessment',
    ADD COLUMN IF NOT EXISTS assessment_stage integer DEFAULT 2,
    ADD COLUMN IF NOT EXISTS overall_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS theory_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS technical_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS scenario_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS practical_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS software_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS troubleshooting_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS decision_making_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS communication_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS knowledge_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS problem_solving_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS stage2_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS stage3_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS strengths text,
    ADD COLUMN IF NOT EXISTS weaknesses text,
    ADD COLUMN IF NOT EXISTS recommendations text,
    ADD COLUMN IF NOT EXISTS ai_feedback text,
    ADD COLUMN IF NOT EXISTS started_at timestamptz,
    ADD COLUMN IF NOT EXISTS completed_at timestamptz,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.skill_swap_assessments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_assessments' AND policyname = 'Users can only see their own assessments') THEN
    CREATE POLICY "Users can only see their own assessments" ON public.skill_swap_assessments FOR SELECT TO authenticated USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_assessments' AND policyname = 'Users can insert their own assessments') THEN
    CREATE POLICY "Users can insert their own assessments" ON public.skill_swap_assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_assessments' AND policyname = 'Users can update their own assessments') THEN
    CREATE POLICY "Users can update their own assessments" ON public.skill_swap_assessments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_assessments' AND policyname = 'Users can delete their own assessments') THEN
    CREATE POLICY "Users can delete their own assessments" ON public.skill_swap_assessments FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 13. Create skill_swap_assessment_questions
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_swap_assessment_questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id uuid REFERENCES public.skill_swap_assessments(id) ON DELETE CASCADE,
    question_number integer,
    skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
    subskill_id uuid REFERENCES public.skill_subskills(id) ON DELETE SET NULL,
    specialty_id uuid REFERENCES public.skill_specialties(id) ON DELETE SET NULL,
    competency text,
    difficulty text,
    topic text,
    sub_skill text,
    software text,
    question_type text DEFAULT 'voice',
    question_text text NOT NULL,
    options jsonb,
    correct_answer text,
    expected_concepts text[] DEFAULT '{}',
    evaluation_criteria text,
    scenario_context text,
    assessment_stage integer DEFAULT 2,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.skill_swap_assessment_questions
    ADD COLUMN IF NOT EXISTS skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subskill_id uuid REFERENCES public.skill_subskills(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS specialty_id uuid REFERENCES public.skill_specialties(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS competency text,
    ADD COLUMN IF NOT EXISTS difficulty text,
    ADD COLUMN IF NOT EXISTS topic text,
    ADD COLUMN IF NOT EXISTS sub_skill text,
    ADD COLUMN IF NOT EXISTS software text,
    ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'voice',
    ADD COLUMN IF NOT EXISTS options jsonb,
    ADD COLUMN IF NOT EXISTS correct_answer text,
    ADD COLUMN IF NOT EXISTS expected_concepts text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS evaluation_criteria text,
    ADD COLUMN IF NOT EXISTS scenario_context text,
    ADD COLUMN IF NOT EXISTS assessment_stage integer DEFAULT 2;

ALTER TABLE public.skill_swap_assessment_questions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_assessment_questions' AND policyname = 'Users can view their assessment questions') THEN
    CREATE POLICY "Users can view their assessment questions" ON public.skill_swap_assessment_questions FOR SELECT TO authenticated 
      USING (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_assessment_questions' AND policyname = 'Users can insert assessment questions') THEN
    CREATE POLICY "Users can insert assessment questions" ON public.skill_swap_assessment_questions FOR INSERT TO authenticated 
      WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 14. Create skill_swap_assessment_answers
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_swap_assessment_answers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id uuid REFERENCES public.skill_swap_assessments(id) ON DELETE CASCADE,
    question_id uuid REFERENCES public.skill_swap_assessment_questions(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    question_type text,
    answer_text text,
    answer_transcript text,
    is_correct boolean,
    score numeric(5,2),
    accuracy_score numeric(5,2),
    technical_score numeric(5,2),
    reasoning_score numeric(5,2),
    practical_score numeric(5,2),
    answer_quality text,
    competency text,
    feedback text,
    ai_feedback text,
    concepts_matched text[] DEFAULT '{}',
    concepts_missed text[] DEFAULT '{}',
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.skill_swap_assessment_answers
    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    ADD COLUMN IF NOT EXISTS question_type text,
    ADD COLUMN IF NOT EXISTS answer_text text,
    ADD COLUMN IF NOT EXISTS answer_transcript text,
    ADD COLUMN IF NOT EXISTS is_correct boolean,
    ADD COLUMN IF NOT EXISTS score numeric(5,2),
    ADD COLUMN IF NOT EXISTS accuracy_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS technical_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS reasoning_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS practical_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS answer_quality text,
    ADD COLUMN IF NOT EXISTS competency text,
    ADD COLUMN IF NOT EXISTS feedback text,
    ADD COLUMN IF NOT EXISTS ai_feedback text,
    ADD COLUMN IF NOT EXISTS concepts_matched text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS concepts_missed text[] DEFAULT '{}';

ALTER TABLE public.skill_swap_assessment_answers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_assessment_answers' AND policyname = 'Users can view their assessment answers') THEN
    CREATE POLICY "Users can view their assessment answers" ON public.skill_swap_assessment_answers FOR SELECT TO authenticated 
      USING (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_assessment_answers' AND policyname = 'Users can insert assessment answers') THEN
    CREATE POLICY "Users can insert assessment answers" ON public.skill_swap_assessment_answers FOR INSERT TO authenticated 
      WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 15. Create skill_swap_assessment_results
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_swap_assessment_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id uuid REFERENCES public.skill_swap_assessments(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    skill_name text,
    declared_level text,
    demonstrated_level text,
    verification_confidence text,
    overall_score numeric(5,2),
    theory_score numeric(5,2),
    technical_score numeric(5,2),
    scenario_score numeric(5,2),
    practical_score numeric(5,2),
    software_score numeric(5,2),
    troubleshooting_score numeric(5,2),
    decision_making_score numeric(5,2),
    communication_score numeric(5,2),
    stage2_score numeric(5,2),
    stage3_score numeric(5,2),
    strengths text,
    strengths_summary text,
    weaknesses text,
    weaknesses_summary text,
    recommendations text,
    recommendations_summary text,
    ai_summary text,
    ai_feedback text,
    verification_status text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.skill_swap_assessment_results
    ADD COLUMN IF NOT EXISTS skill_name text,
    ADD COLUMN IF NOT EXISTS declared_level text,
    ADD COLUMN IF NOT EXISTS demonstrated_level text,
    ADD COLUMN IF NOT EXISTS verification_confidence text,
    ADD COLUMN IF NOT EXISTS overall_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS theory_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS technical_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS scenario_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS practical_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS software_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS troubleshooting_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS decision_making_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS communication_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS stage2_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS stage3_score numeric(5,2),
    ADD COLUMN IF NOT EXISTS strengths text,
    ADD COLUMN IF NOT EXISTS strengths_summary text,
    ADD COLUMN IF NOT EXISTS weaknesses text,
    ADD COLUMN IF NOT EXISTS weaknesses_summary text,
    ADD COLUMN IF NOT EXISTS recommendations text,
    ADD COLUMN IF NOT EXISTS recommendations_summary text,
    ADD COLUMN IF NOT EXISTS ai_summary text,
    ADD COLUMN IF NOT EXISTS ai_feedback text,
    ADD COLUMN IF NOT EXISTS verification_status text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.skill_swap_assessment_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_assessment_results' AND policyname = 'Users can view their assessment results') THEN
    CREATE POLICY "Users can view their assessment results" ON public.skill_swap_assessment_results FOR SELECT TO authenticated 
      USING (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_assessment_results' AND policyname = 'Users can insert assessment results') THEN
    CREATE POLICY "Users can insert assessment results" ON public.skill_swap_assessment_results FOR INSERT TO authenticated 
      WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 16. Create Question Banks (assessment_question_bank & skill_swap_question_bank)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_question_bank (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name text,
    skill_name text,
    skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
    subskill_id uuid REFERENCES public.skill_subskills(id) ON DELETE SET NULL,
    specialty_id uuid REFERENCES public.skill_specialties(id) ON DELETE SET NULL,
    sub_skill text,
    specialty text,
    software text,
    question_type text NOT NULL,
    difficulty text NOT NULL,
    competency text NOT NULL,
    question_text text NOT NULL,
    options jsonb,
    correct_answer text,
    acceptable_answers text[],
    expected_concepts text[] NOT NULL DEFAULT '{}',
    evaluation_criteria text,
    rubric jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.assessment_question_bank
    ADD COLUMN IF NOT EXISTS role_name text,
    ADD COLUMN IF NOT EXISTS skill_name text,
    ADD COLUMN IF NOT EXISTS skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS subskill_id uuid REFERENCES public.skill_subskills(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS specialty_id uuid REFERENCES public.skill_specialties(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS sub_skill text,
    ADD COLUMN IF NOT EXISTS specialty text,
    ADD COLUMN IF NOT EXISTS software text,
    ADD COLUMN IF NOT EXISTS acceptable_answers text[],
    ADD COLUMN IF NOT EXISTS evaluation_criteria text,
    ADD COLUMN IF NOT EXISTS rubric jsonb,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.assessment_question_bank ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_question_bank' AND policyname = 'Anyone can read question bank') THEN
    CREATE POLICY "Anyone can read question bank" ON public.assessment_question_bank FOR SELECT TO authenticated USING (is_active = true);
  END IF;
END $$;

-- Also support table name skill_swap_question_bank
CREATE TABLE IF NOT EXISTS public.skill_swap_question_bank (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    role_name text,
    skill_name text,
    skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
    subskill_id uuid REFERENCES public.skill_subskills(id) ON DELETE SET NULL,
    specialty_id uuid REFERENCES public.skill_specialties(id) ON DELETE SET NULL,
    sub_skill text,
    specialty text,
    software text,
    question_type text NOT NULL,
    difficulty text NOT NULL,
    competency text NOT NULL,
    question_text text NOT NULL,
    options jsonb,
    correct_answer text,
    acceptable_answers text[],
    expected_concepts text[] NOT NULL DEFAULT '{}',
    evaluation_criteria text,
    rubric jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.skill_swap_question_bank ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_question_bank' AND policyname = 'Anyone can read skill_swap_question_bank') THEN
    CREATE POLICY "Anyone can read skill_swap_question_bank" ON public.skill_swap_question_bank FOR SELECT TO authenticated USING (is_active = true);
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 17. Create skill_swap_requests
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_swap_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    sender_listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    receiver_listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    message text,
    match_score integer,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    responded_at timestamptz
);

ALTER TABLE public.skill_swap_requests
    ADD COLUMN IF NOT EXISTS message text,
    ADD COLUMN IF NOT EXISTS match_score integer,
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
    ADD COLUMN IF NOT EXISTS responded_at timestamptz,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'tr_skill_swap_requests_updated_at'
  ) THEN
    CREATE TRIGGER tr_skill_swap_requests_updated_at
        BEFORE UPDATE ON public.skill_swap_requests
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
  END IF;
END $$;

ALTER TABLE public.skill_swap_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_requests' AND policyname = 'Sender can view their sent requests') THEN
    CREATE POLICY "Sender can view their sent requests" ON public.skill_swap_requests FOR SELECT TO authenticated USING (auth.uid() = sender_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_requests' AND policyname = 'Receiver can view their received requests') THEN
    CREATE POLICY "Receiver can view their received requests" ON public.skill_swap_requests FOR SELECT TO authenticated USING (auth.uid() = receiver_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_requests' AND policyname = 'Sender can create requests') THEN
    CREATE POLICY "Sender can create requests" ON public.skill_swap_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND sender_id != receiver_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_requests' AND policyname = 'Sender can cancel pending requests') THEN
    CREATE POLICY "Sender can cancel pending requests" ON public.skill_swap_requests FOR UPDATE TO authenticated USING (auth.uid() = sender_id AND status = 'pending') WITH CHECK (auth.uid() = sender_id AND status IN ('cancelled'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_swap_requests' AND policyname = 'Receiver can accept or reject pending requests') THEN
    CREATE POLICY "Receiver can accept or reject pending requests" ON public.skill_swap_requests FOR UPDATE TO authenticated USING (auth.uid() = receiver_id AND status = 'pending') WITH CHECK (auth.uid() = receiver_id AND status IN ('accepted', 'rejected'));
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 18. Performance Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_skill_swap_listings_user_id ON public.skill_swap_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_listings_is_active ON public.skill_swap_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_skill_swap_listings_verification_status ON public.skill_swap_listings(verification_status);
CREATE INDEX IF NOT EXISTS idx_creator_skills_user_id ON public.creator_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_skills_skill_id ON public.creator_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_creator_learning_skills_user_id ON public.creator_learning_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_learning_skills_skill_id ON public.creator_learning_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_teach_skills_listing_id ON public.skill_swap_listing_teach_skills(listing_id);
CREATE INDEX IF NOT EXISTS idx_teach_skills_skill_id ON public.skill_swap_listing_teach_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_learn_skills_listing_id ON public.skill_swap_listing_learn_skills(listing_id);
CREATE INDEX IF NOT EXISTS idx_learn_skills_skill_id ON public.skill_swap_listing_learn_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_specialties_listing_id ON public.skill_swap_specialties(listing_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_assessments_listing_id ON public.skill_swap_assessments(listing_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_assessments_user_id ON public.skill_swap_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_assessment_questions_assessment_id ON public.skill_swap_assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_assessment_answers_assessment_id ON public.skill_swap_assessment_answers(assessment_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_assessment_answers_question_id ON public.skill_swap_assessment_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_assessment_results_assessment_id ON public.skill_swap_assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_requests_receiver_id ON public.skill_swap_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_requests_sender_id ON public.skill_swap_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_requests_status ON public.skill_swap_requests(status);
CREATE INDEX IF NOT EXISTS idx_assessment_question_bank_lookup ON public.assessment_question_bank(role_name, skill_name, difficulty);

-- ----------------------------------------------------------------------------
-- 19. Seed Core Skill Categories & Core Skills
-- ----------------------------------------------------------------------------
INSERT INTO public.skill_categories (name, description) VALUES
    ('Technology', 'Software engineering, web development, systems, and IT'),
    ('Creative', 'Creative arts, music production, sound design, and writing'),
    ('Design', 'UI/UX design, graphic design, branding, and motion design'),
    ('Marketing', 'Digital marketing, SEO, content strategy, and advertising'),
    ('Business', 'Business development, management, sales, and analytics'),
    ('Communication', 'Public speaking, podcasting, voice acting, and translation'),
    ('Media', 'Journalism, broadcasting, livestreaming, and content creation'),
    ('Photography', 'Portrait, commercial, product, and architectural photography'),
    ('Video', 'Video editing, color grading, cinematography, and visual effects'),
    ('Programming', 'Full-stack development, mobile apps, databases, and APIs'),
    ('AI/ML', 'Machine learning, prompt engineering, generative AI, and computer vision'),
    ('Other', 'Specialized and multidisciplinary creator skills')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- Seed key skills linked to categories
INSERT INTO public.skills (name, category, description) VALUES
    ('Video Editing', 'Video', 'Timeline assembly, pacing, B-roll integration, and rough cuts'),
    ('Color Grading', 'Video', 'Primary correction, secondary adjustments, LUT management, and scopes'),
    ('Motion Graphics', 'Design', 'Kinetic typography, 2D/3D animation, and title sequences'),
    ('Visual Effects (VFX)', 'Video', 'Compositing, rotoscoping, chroma keying, and camera tracking'),
    ('Sound Design & Mixing', 'Creative', 'Dialogue clean-up, Foley, sound effects, and spatial audio'),
    ('Photo Editing & Retouching', 'Photography', 'Frequency separation, dodge & burn, color balancing, and raw processing'),
    ('UI/UX Design', 'Design', 'Wireframing, interactive prototyping, user research, and design systems'),
    ('Graphic Design', 'Design', 'Brand identity, typography, layout, and visual marketing assets'),
    ('Frontend Development', 'Technology', 'React, Next.js, TypeScript, TailwindCSS, and responsive web design'),
    ('Backend & API Development', 'Technology', 'Node.js, PostgreSQL, REST APIs, GraphQL, and microservices'),
    ('3D Modeling & Animation', 'Creative', 'Hard-surface modeling, sculpting, rigging, texturing, and rendering'),
    ('Copywriting & Scriptwriting', 'Creative', 'Direct-response copywriting, YouTube scripts, and narrative structure')
ON CONFLICT (name) DO UPDATE SET category = EXCLUDED.category, description = EXCLUDED.description;

-- Seed Question Bank with rich, technical questions
INSERT INTO public.assessment_question_bank (
    role_name, skill_name, question_type, difficulty, competency, question_text, options, correct_answer, expected_concepts, evaluation_criteria
) VALUES
    (
        'Video Editor', 'Video Editing', 'multiple_choice', 'Intermediate', 'software_knowledge',
        'When editing multi-camera 4K ProRes footage on an Apple Silicon or high-end workstation with timeline stutter, which workflow best preserves playback performance without quality loss during final export?',
        '["Render in-to-out cache as uncompressed 8-bit RGB", "Generate ProRes Proxy or DNxHR LB media at 1080p and toggle proxy mode", "Lower the project frame rate from 60fps to 24fps during cutting", "Apply timeline noise reduction to each individual angle before cutting"]'::jsonb,
        'Generate ProRes Proxy or DNxHR LB media at 1080p and toggle proxy mode',
        ARRAY['proxy workflow', 'prores proxy', 'dnxhr', 'playback performance', 'source relink'],
        'Tests knowledge of non-destructive offline-online proxy editing pipelines.'
    ),
    (
        'Video Editor', 'Video Editing', 'short_answer', 'Intermediate', 'technical_skill',
        'Explain the standard L-cut and J-cut split edit procedures and describe when each should be utilized in dialogue scenes to enhance conversational pacing.',
        NULL,
        NULL,
        ARRAY['j-cut', 'l-cut', 'split edit', 'audio lead', 'audio overhang', 'conversational flow', 'reaction shot'],
        'Must accurately distinguish between J-cut (audio precedes video) and L-cut (video precedes audio) with narrative rationale.'
    ),
    (
        'Colorist', 'Color Grading', 'scenario', 'Advanced', 'scenario_reasoning',
        'A client delivers mixed log footage from Sony FX3 (S-Log3/S-Gamut3.Cine) and Canon R5 (C-Log2/Cinema Gamut). What exact color management pipeline in DaVinci Resolve ensures consistent primary exposure and accurate Rec.709 transformation across all angles?',
        NULL,
        NULL,
        ARRAY['davinci yrgb color managed', 'acescct', 'cst node', 'color space transform', 's-log3 to rec.709', 'tone mapping', 'input color space'],
        'Must specify CST (Color Space Transform) or ACES / DaVinci YRGB Color Management with accurate input/output space parameters.'
    ),
    (
        'Frontend Developer', 'Frontend Development', 'multiple_choice', 'Intermediate', 'technical_skill',
        'In React 19 / modern React development, what happens when a state update inside a transition created with startTransition causes a component re-render?',
        '["The UI blocks all user input until the async render completes", "React keeps the existing UI interactive while rendering the new state in the background", "React throws an uncaught Promise error if suspense is not mounted", "The browser forces a full synchronous DOM reflow immediately"]'::jsonb,
        'React keeps the existing UI interactive while rendering the new state in the background',
        ARRAY['starttransition', 'concurrent rendering', 'non-blocking update', 'interactivity'],
        'Evaluates understanding of React concurrent features and non-blocking transitions.'
    ),
    (
        'Frontend Developer', 'Frontend Development', 'short_answer', 'Advanced', 'troubleshooting',
        'Describe how to diagnose and eliminate unnecessary component re-renders in a heavy React application using browser devtools and modern React architectural patterns.',
        NULL,
        NULL,
        ARRAY['react profiler', 'flamegraph', 'ranked chart', 'usememo', 'usecallback', 'state colocation', 'memo', 'context splitting'],
        'Must mention React Profiler/DevTools and concrete architectural optimizations (state colocation, context splitting, memoization).'
    ),
    (
        'Photo Editor / Retoucher', 'Photo Editing & Retouching', 'short_answer', 'Intermediate', 'technical_skill',
        'Explain the procedural difference between the high-frequency and low-frequency layers in Frequency Separation, and list which retouching tools belong on each layer.',
        NULL,
        NULL,
        ARRAY['high frequency', 'low frequency', 'texture', 'skin tone', 'color and tone', 'gaussian blur', 'apply image', 'clone stamp', 'mixer brush'],
        'Must correctly explain separation of texture (high) from tone/color (low) and appropriate tools for each.'
    )
ON CONFLICT DO NOTHING;

-- Populate skill_swap_question_bank matching assessment_question_bank
INSERT INTO public.skill_swap_question_bank (
    role_name, skill_name, question_type, difficulty, competency, question_text, options, correct_answer, acceptable_answers, expected_concepts, evaluation_criteria
)
SELECT role_name, skill_name, question_type, difficulty, competency, question_text, options, correct_answer, acceptable_answers, expected_concepts, evaluation_criteria
FROM public.assessment_question_bank
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------------------
-- 20. PostgREST Schema Cache Reload
-- ----------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
