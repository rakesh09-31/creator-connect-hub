-- This migration updates the initial skill swap tables and adds the AI assessment tables.

-- 1. Update creator_skills
ALTER TABLE public.creator_skills
ADD COLUMN IF NOT EXISTS level text,
ADD COLUMN IF NOT EXISTS specialties text[],
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. Create creator_learning_skills
CREATE TABLE IF NOT EXISTS public.creator_learning_skills (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    desired_level text,
    requirements text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, skill_id)
);

ALTER TABLE public.creator_learning_skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view creator learning skills" ON public.creator_learning_skills FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage their learning skills" ON public.creator_learning_skills FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. Update skill_swap_listings
ALTER TABLE public.skill_swap_listings
ADD COLUMN IF NOT EXISTS title text,
ADD COLUMN IF NOT EXISTS role text,
ADD COLUMN IF NOT EXISTS verification_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS overall_score integer,
ADD COLUMN IF NOT EXISTS skill_level text,
ADD COLUMN IF NOT EXISTS ai_verified_at timestamp with time zone;

-- 4. Update skill_swap_listing_teach_skills
ALTER TABLE public.skill_swap_listing_teach_skills
ADD COLUMN IF NOT EXISTS skill_name text;

-- 5. Update skill_swap_listing_learn_skills
ALTER TABLE public.skill_swap_listing_learn_skills
ADD COLUMN IF NOT EXISTS skill_name text,
ADD COLUMN IF NOT EXISTS requirements text;

-- 6. Create skill_swap_specialties
CREATE TABLE IF NOT EXISTS public.skill_swap_specialties (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE NOT NULL,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
    specialty_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.skill_swap_specialties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view specialties" ON public.skill_swap_specialties FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage specialties" ON public.skill_swap_specialties FOR ALL TO authenticated 
USING (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_listings WHERE id = listing_id AND user_id = auth.uid()));

-- 7. Create skill_swap_assessments
CREATE TABLE IF NOT EXISTS public.skill_swap_assessments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    listing_id uuid REFERENCES public.skill_swap_listings(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    skill_level text,
    assessment_type text DEFAULT 'ai_voice_interview',
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    overall_score integer,
    technical_score integer,
    practical_score integer,
    problem_solving_score integer,
    knowledge_score integer,
    communication_score integer,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.skill_swap_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own assessments" ON public.skill_swap_assessments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own assessments" ON public.skill_swap_assessments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own assessments" ON public.skill_swap_assessments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own assessments" ON public.skill_swap_assessments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. Create skill_swap_assessment_questions
CREATE TABLE IF NOT EXISTS public.skill_swap_assessment_questions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id uuid REFERENCES public.skill_swap_assessments(id) ON DELETE CASCADE,
    question_number integer,
    question_text text NOT NULL,
    difficulty text,
    topic text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.skill_swap_assessment_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own assessment questions" ON public.skill_swap_assessment_questions FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert questions" ON public.skill_swap_assessment_questions FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));

-- 9. Create skill_swap_assessment_answers
CREATE TABLE IF NOT EXISTS public.skill_swap_assessment_answers (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id uuid REFERENCES public.skill_swap_assessments(id) ON DELETE CASCADE,
    question_id uuid REFERENCES public.skill_swap_assessment_questions(id) ON DELETE CASCADE,
    answer_text text,
    answer_transcript text,
    score integer,
    feedback text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.skill_swap_assessment_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own assessment answers" ON public.skill_swap_assessment_answers FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert answers" ON public.skill_swap_assessment_answers FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));

-- 10. Create skill_swap_assessment_results
CREATE TABLE IF NOT EXISTS public.skill_swap_assessment_results (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    assessment_id uuid REFERENCES public.skill_swap_assessments(id) ON DELETE CASCADE,
    skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE,
    skill_level text,
    overall_score integer,
    strengths text,
    weaknesses text,
    ai_summary text,
    verification_status text,
    created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.skill_swap_assessment_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only see their own assessment results" ON public.skill_swap_assessment_results FOR SELECT TO authenticated 
USING (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));
CREATE POLICY "Users can insert results" ON public.skill_swap_assessment_results FOR INSERT TO authenticated 
WITH CHECK (EXISTS (SELECT 1 FROM public.skill_swap_assessments WHERE id = assessment_id AND user_id = auth.uid()));
