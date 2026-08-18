-- ============================================================
-- OmniCraft Comprehensive Skill Swap & Assessment Database Schema (V3)
-- Ensures ALL score, assessment, question, and result columns exist.
-- Synchronizes numeric(5,2) score fields and refreshes PostgREST schema cache.
-- ============================================================

-- 1. Ensure professional_roles and skills tables are extended
ALTER TABLE public.professional_roles
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'General',
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.professional_roles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. Create skill_subskills and skill_specialties
CREATE TABLE IF NOT EXISTS public.skill_subskills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    name text NOT NULL,
    category text,
    is_custom boolean DEFAULT false,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(skill_id, name)
);

ALTER TABLE public.skill_subskills ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_subskills' AND policyname = 'Anyone can view skill subskills') THEN
    CREATE POLICY "Anyone can view skill subskills" ON public.skill_subskills FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_subskills' AND policyname = 'Users can add custom subskills') THEN
    CREATE POLICY "Users can add custom subskills" ON public.skill_subskills FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.skill_specialties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    name text NOT NULL,
    software text,
    is_custom boolean DEFAULT false,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(skill_id, name)
);

ALTER TABLE public.skill_specialties ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_specialties' AND policyname = 'Anyone can view skill specialties') THEN
    CREATE POLICY "Anyone can view skill specialties" ON public.skill_specialties FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_specialties' AND policyname = 'Users can add custom specialties') THEN
    CREATE POLICY "Users can add custom specialties" ON public.skill_specialties FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by OR created_by IS NULL);
  END IF;
END $$;

-- 3. Create / Update skill_swap_listings table with ALL score metrics
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
    knowledge_score numeric(5,2),
    problem_solving_score numeric(5,2),
    skill_level text,
    declared_level text,
    demonstrated_level text,
    verification_confidence text DEFAULT 'low',
    strengths_summary text,
    weaknesses_summary text,
    recommendations_summary text,
    ai_feedback text,
    experience_duration text,
    ai_verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Ensure all columns exist on skill_swap_listings if table already existed
ALTER TABLE public.skill_swap_listings
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS role text,
  ADD COLUMN IF NOT EXISTS role_id uuid REFERENCES public.professional_roles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS learning_mode text DEFAULT 'Online',
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
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
  ADD COLUMN IF NOT EXISTS knowledge_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS problem_solving_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS skill_level text,
  ADD COLUMN IF NOT EXISTS declared_level text,
  ADD COLUMN IF NOT EXISTS demonstrated_level text,
  ADD COLUMN IF NOT EXISTS verification_confidence text DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS strengths_summary text,
  ADD COLUMN IF NOT EXISTS weaknesses_summary text,
  ADD COLUMN IF NOT EXISTS recommendations_summary text,
  ADD COLUMN IF NOT EXISTS ai_feedback text,
  ADD COLUMN IF NOT EXISTS experience_duration text,
  ADD COLUMN IF NOT EXISTS ai_verified_at timestamp with time zone;

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

-- 4. Create / Update skill_swap_listing_teach_skills table
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
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(listing_id, skill_id)
);

ALTER TABLE public.skill_swap_listing_teach_skills
  ADD COLUMN IF NOT EXISTS skill_name text,
  ADD COLUMN IF NOT EXISTS sub_skills text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS software text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specialties text[] DEFAULT '{}';

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

-- 5. Create / Update skill_swap_listing_learn_skills table
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
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(listing_id, skill_id)
);

ALTER TABLE public.skill_swap_listing_learn_skills
  ADD COLUMN IF NOT EXISTS skill_name text,
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

-- 6. Create / Update skill_swap_specialties table
CREATE TABLE IF NOT EXISTS public.skill_swap_specialties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    specialty_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

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

-- 7. Create / Update skill_swap_assessments table
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
    assessment_type text DEFAULT 'multi_stage_technical_assessment',
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
    stage2_score numeric(5,2),
    stage3_score numeric(5,2),
    knowledge_score numeric(5,2),
    problem_solving_score numeric(5,2),
    strengths text,
    weaknesses text,
    recommendations text,
    ai_feedback text,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.skill_swap_assessments
  ADD COLUMN IF NOT EXISTS role_name text,
  ADD COLUMN IF NOT EXISTS skill_name text,
  ADD COLUMN IF NOT EXISTS declared_level text,
  ADD COLUMN IF NOT EXISTS demonstrated_level text,
  ADD COLUMN IF NOT EXISTS verification_confidence text DEFAULT 'low',
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
  ADD COLUMN IF NOT EXISTS stage2_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS stage3_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS knowledge_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS problem_solving_score numeric(5,2),
  ADD COLUMN IF NOT EXISTS strengths text,
  ADD COLUMN IF NOT EXISTS weaknesses text,
  ADD COLUMN IF NOT EXISTS recommendations text,
  ADD COLUMN IF NOT EXISTS ai_feedback text;

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

-- 8. Create / Update skill_swap_assessment_questions table
CREATE TABLE IF NOT EXISTS public.skill_swap_assessment_questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id uuid REFERENCES public.skill_swap_assessments(id) ON DELETE CASCADE,
    question_number integer,
    question_text text NOT NULL,
    question_type text DEFAULT 'voice',
    difficulty text,
    topic text,
    sub_skill text,
    software text,
    competency text,
    options jsonb,
    correct_answer text,
    expected_concepts text[] DEFAULT '{}',
    evaluation_criteria text,
    scenario_context text,
    assessment_stage integer DEFAULT 2,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.skill_swap_assessment_questions
  ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'voice',
  ADD COLUMN IF NOT EXISTS sub_skill text,
  ADD COLUMN IF NOT EXISTS software text,
  ADD COLUMN IF NOT EXISTS competency text,
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

-- 9. Create / Update skill_swap_assessment_answers table
CREATE TABLE IF NOT EXISTS public.skill_swap_assessment_answers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id uuid REFERENCES public.skill_swap_assessments(id) ON DELETE CASCADE,
    question_id uuid REFERENCES public.skill_swap_assessment_questions(id) ON DELETE CASCADE,
    question_type text,
    answer_text text,
    answer_transcript text,
    is_correct boolean,
    score numeric(5,2),
    answer_quality text,
    competency text,
    feedback text,
    concepts_matched text[] DEFAULT '{}',
    concepts_missed text[] DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.skill_swap_assessment_answers
  ADD COLUMN IF NOT EXISTS question_type text,
  ADD COLUMN IF NOT EXISTS is_correct boolean,
  ADD COLUMN IF NOT EXISTS score numeric(5,2),
  ADD COLUMN IF NOT EXISTS answer_quality text,
  ADD COLUMN IF NOT EXISTS competency text,
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

-- 10. Create / Update skill_swap_assessment_results table
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
    weaknesses text,
    recommendations text,
    ai_summary text,
    verification_status text,
    created_at timestamp with time zone DEFAULT now()
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
  ADD COLUMN IF NOT EXISTS recommendations text;

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

-- 11. Create / Update skill_swap_requests table
CREATE TABLE IF NOT EXISTS public.skill_swap_requests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    sender_listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    receiver_listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    message text,
    match_score integer,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    responded_at timestamp with time zone
);

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

-- 12. Performance indexes
CREATE INDEX IF NOT EXISTS idx_skill_swap_listings_user_id ON public.skill_swap_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_listings_is_active ON public.skill_swap_listings(is_active);
CREATE INDEX IF NOT EXISTS idx_skill_swap_assessments_listing_id ON public.skill_swap_assessments(listing_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_assessments_user_id ON public.skill_swap_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_requests_receiver_id ON public.skill_swap_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_skill_swap_requests_sender_id ON public.skill_swap_requests(sender_id);

-- 13. Critical PostgREST schema cache reload
NOTIFY pgrst, 'reload schema';
