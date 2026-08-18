-- ============================================================
-- Skill Swap V2 – Advanced Verification System
-- Extends existing tables; no breaking changes.
-- ============================================================

-- 1. Extend skill_swap_assessments
ALTER TABLE public.skill_swap_assessments
  ADD COLUMN IF NOT EXISTS declared_level text,
  ADD COLUMN IF NOT EXISTS demonstrated_level text,
  ADD COLUMN IF NOT EXISTS verification_confidence text DEFAULT 'low',
  ADD COLUMN IF NOT EXISTS stage2_score integer,
  ADD COLUMN IF NOT EXISTS stage3_score integer,
  ADD COLUMN IF NOT EXISTS scenario_score integer,
  ADD COLUMN IF NOT EXISTS software_score integer,
  ADD COLUMN IF NOT EXISTS knowledge_score_v2 integer,
  ADD COLUMN IF NOT EXISTS strengths text,
  ADD COLUMN IF NOT EXISTS weaknesses text,
  ADD COLUMN IF NOT EXISTS recommendations text,
  ADD COLUMN IF NOT EXISTS assessment_stage integer DEFAULT 2;

-- 2. Extend skill_swap_assessment_questions
ALTER TABLE public.skill_swap_assessment_questions
  ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'voice',
  ADD COLUMN IF NOT EXISTS sub_skill text,
  ADD COLUMN IF NOT EXISTS software text,
  ADD COLUMN IF NOT EXISTS competency text,
  ADD COLUMN IF NOT EXISTS options jsonb,
  ADD COLUMN IF NOT EXISTS correct_answer text,
  ADD COLUMN IF NOT EXISTS evaluation_criteria text,
  ADD COLUMN IF NOT EXISTS assessment_stage integer DEFAULT 2;

-- 3. Extend skill_swap_assessment_answers
ALTER TABLE public.skill_swap_assessment_answers
  ADD COLUMN IF NOT EXISTS question_type text,
  ADD COLUMN IF NOT EXISTS is_correct boolean,
  ADD COLUMN IF NOT EXISTS answer_quality text,
  ADD COLUMN IF NOT EXISTS competency text;

-- 4. Extend skill_swap_assessment_results
ALTER TABLE public.skill_swap_assessment_results
  ADD COLUMN IF NOT EXISTS declared_level text,
  ADD COLUMN IF NOT EXISTS demonstrated_level text,
  ADD COLUMN IF NOT EXISTS verification_confidence text,
  ADD COLUMN IF NOT EXISTS stage2_score integer,
  ADD COLUMN IF NOT EXISTS stage3_score integer,
  ADD COLUMN IF NOT EXISTS scenario_score integer,
  ADD COLUMN IF NOT EXISTS software_score integer,
  ADD COLUMN IF NOT EXISTS practical_score_v2 integer,
  ADD COLUMN IF NOT EXISTS recommendations text;

-- 5. Extend skill_swap_listings with v2 fields
ALTER TABLE public.skill_swap_listings
  ADD COLUMN IF NOT EXISTS demonstrated_level text,
  ADD COLUMN IF NOT EXISTS verification_confidence text,
  ADD COLUMN IF NOT EXISTS stage2_score integer,
  ADD COLUMN IF NOT EXISTS stage3_score integer,
  ADD COLUMN IF NOT EXISTS scenario_score integer,
  ADD COLUMN IF NOT EXISTS software_score integer,
  ADD COLUMN IF NOT EXISTS strengths_summary text,
  ADD COLUMN IF NOT EXISTS weaknesses_summary text,
  ADD COLUMN IF NOT EXISTS experience_duration text;

-- 6. Extend teach_skills with sub-skills and software arrays
ALTER TABLE public.skill_swap_listing_teach_skills
  ADD COLUMN IF NOT EXISTS sub_skills text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS software text[] DEFAULT '{}';

-- 7. Extend learn_skills with sub-skills and desired software
ALTER TABLE public.skill_swap_listing_learn_skills
  ADD COLUMN IF NOT EXISTS sub_skills text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS desired_software text[] DEFAULT '{}';

-- 8. Policy: allow listing owners to also read public assessment results summary
-- (other creators see only the public summary fields on the listing, not raw Q&A)
-- Existing RLS on skill_swap_assessments already restricts to owner.
-- We add a public result policy on listing level only — done via listing SELECT policy.

-- 9. Index for performance
CREATE INDEX IF NOT EXISTS idx_skill_swap_assessments_listing_id
  ON public.skill_swap_assessments(listing_id);

CREATE INDEX IF NOT EXISTS idx_skill_swap_assessments_user_id
  ON public.skill_swap_assessments(user_id);
