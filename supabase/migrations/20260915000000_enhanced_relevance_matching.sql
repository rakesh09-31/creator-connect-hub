-- ============================================================================
-- OmniCraft Enhanced Relevance Matching Architecture
-- Migration: 20260915000000_enhanced_relevance_matching.sql
-- Proportional Server-Side Ranking with Required Skills Prioritization
-- ============================================================================

-- 1. Upgraded RPC: get_recommended_jobs_for_creator
-- Replaces hardcoded 85.0 score with real proportional match calculation
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
            p.id,
            p.experience_level,
            COALESCE(array_agg(DISTINCT cr.role_id) FILTER (WHERE cr.role_id IS NOT NULL), '{}') AS role_ids,
            COALESCE(array_agg(DISTINCT cs.skill_id) FILTER (WHERE cs.skill_id IS NOT NULL), '{}') AS skill_ids
        FROM public.profiles p
        LEFT JOIN public.creator_roles cr ON cr.creator_id = p.id
        LEFT JOIN public.creator_skills cs ON cs.creator_id = p.id
        WHERE p.id = p_creator_id
        GROUP BY p.id, p.experience_level
    ),
    job_details AS (
        SELECT
            j.id AS j_id,
            j.title AS j_title,
            j.description AS j_desc,
            j.budget AS j_budget,
            j.company_name AS j_company,
            j.created_at AS j_created,
            j.experience_level AS j_exp_level,
            COALESCE(array_agg(DISTINCT jr.role_id) FILTER (WHERE jr.role_id IS NOT NULL), '{}') AS j_role_ids,
            COALESCE(array_agg(DISTINCT js.skill_id) FILTER (WHERE js.skill_id IS NOT NULL), '{}') AS j_skill_ids
        FROM public.jobs j
        LEFT JOIN public.job_roles jr ON jr.job_id = j.id
        LEFT JOIN public.job_skills js ON js.job_id = j.id
        WHERE j.status = 'open'
        GROUP BY j.id, j.title, j.description, j.budget, j.company_name, j.created_at, j.experience_level
    ),
    score_calc AS (
        SELECT
            jd.j_id,
            jd.j_title,
            jd.j_desc,
            jd.j_budget,
            jd.j_company,
            jd.j_created,
            -- Required Skills Match Score (0 - 55 points)
            (
                CASE 
                    WHEN cardinality(jd.j_skill_ids) > 0 THEN
                        (cardinality(ARRAY(SELECT unnest(cp.skill_ids) INTERSECT SELECT unnest(jd.j_skill_ids)))::numeric / cardinality(jd.j_skill_ids)::numeric * 40.0)
                        + (CASE 
                            WHEN cardinality(ARRAY(SELECT unnest(cp.skill_ids) INTERSECT SELECT unnest(jd.j_skill_ids))) = cardinality(jd.j_skill_ids) THEN 15.0 
                            WHEN cardinality(ARRAY(SELECT unnest(cp.skill_ids) INTERSECT SELECT unnest(jd.j_skill_ids))) >= 2 THEN 8.0 
                            ELSE 0.0 
                          END)
                    ELSE 25.0
                END
            ) AS skill_points,
            -- Roles Match Score (0 - 25 points)
            (
                CASE
                    WHEN cardinality(jd.j_role_ids) > 0 THEN
                        (cardinality(ARRAY(SELECT unnest(cp.role_ids) INTERSECT SELECT unnest(jd.j_role_ids)))::numeric / cardinality(jd.j_role_ids)::numeric * 25.0)
                    ELSE 15.0
                END
            ) AS role_points,
            -- Experience Match Score (0 - 20 points)
            (
                CASE
                    WHEN jd.j_exp_level IS NULL THEN 10.0
                    WHEN LOWER(COALESCE(cp.experience_level, '')) = LOWER(jd.j_exp_level) THEN 20.0
                    WHEN LOWER(COALESCE(cp.experience_level, '')) = 'senior' THEN 18.0
                    WHEN LOWER(COALESCE(cp.experience_level, '')) = 'intermediate' AND LOWER(jd.j_exp_level) = 'entry' THEN 16.0
                    ELSE 5.0
                END
            ) AS exp_points
        FROM job_details jd
        CROSS JOIN creator_profile cp
    )
    SELECT
        sc.j_id AS job_id,
        sc.j_title AS title,
        sc.j_desc AS description,
        sc.j_budget AS budget,
        sc.j_company AS company_name,
        ROUND(LEAST(100.0, GREATEST(5.0, sc.skill_points + sc.role_points + sc.exp_points)), 1) AS matching_score
    FROM score_calc sc
    ORDER BY matching_score DESC, sc.j_created DESC
    LIMIT p_limit;
END;
$$;


-- 2. Upgraded RPC: get_recommended_creators_for_job
-- Prioritizes creators with all required skills over partial skills
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
            j.id,
            j.experience_level AS j_exp_level,
            COALESCE(array_agg(DISTINCT jr.role_id) FILTER (WHERE jr.role_id IS NOT NULL), '{}') AS role_ids,
            COALESCE(array_agg(DISTINCT js.skill_id) FILTER (WHERE js.skill_id IS NOT NULL), '{}') AS skill_ids
        FROM public.jobs j
        LEFT JOIN public.job_roles jr ON jr.job_id = j.id
        LEFT JOIN public.job_skills js ON js.job_id = j.id
        WHERE j.id = p_job_id
        GROUP BY j.id, j.experience_level
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
    ),
    score_calc AS (
        SELECT
            c.id,
            c.username,
            c.full_name,
            c.avatar_url,
            c.bio,
            c.account_type,
            c.experience_level,
            -- Required Skills Match Score (0 - 55 points)
            (
                CASE 
                    WHEN cardinality(jr.skill_ids) > 0 THEN
                        (cardinality(ARRAY(SELECT unnest(c.creator_skill_ids) INTERSECT SELECT unnest(jr.skill_ids)))::numeric / cardinality(jr.skill_ids)::numeric * 40.0)
                        + (CASE 
                            WHEN cardinality(ARRAY(SELECT unnest(c.creator_skill_ids) INTERSECT SELECT unnest(jr.skill_ids))) = cardinality(jr.skill_ids) THEN 15.0 
                            WHEN cardinality(ARRAY(SELECT unnest(c.creator_skill_ids) INTERSECT SELECT unnest(jr.skill_ids))) >= 2 THEN 8.0 
                            ELSE 0.0 
                          END)
                    ELSE 25.0
                END
            ) AS skill_points,
            -- Roles Match Score (0 - 25 points)
            (
                CASE
                    WHEN cardinality(jr.role_ids) > 0 THEN
                        (cardinality(ARRAY(SELECT unnest(c.creator_role_ids) INTERSECT SELECT unnest(jr.role_ids)))::numeric / cardinality(jr.role_ids)::numeric * 25.0)
                    ELSE 15.0
                END
            ) AS role_points,
            -- Experience Match Score (0 - 20 points)
            (
                CASE
                    WHEN jr.j_exp_level IS NULL THEN 10.0
                    WHEN LOWER(COALESCE(c.experience_level, '')) = LOWER(jr.j_exp_level) THEN 20.0
                    WHEN LOWER(COALESCE(c.experience_level, '')) = 'senior' THEN 18.0
                    WHEN LOWER(COALESCE(c.experience_level, '')) = 'intermediate' AND LOWER(jr.j_exp_level) = 'entry' THEN 16.0
                    ELSE 5.0
                END
            ) AS exp_points
        FROM creators c
        CROSS JOIN job_reqs jr
    )
    SELECT
        sc.id AS creator_id,
        sc.username,
        sc.full_name,
        sc.avatar_url,
        sc.bio,
        sc.account_type,
        sc.experience_level,
        ROUND(LEAST(100.0, GREATEST(5.0, sc.skill_points + sc.role_points + sc.exp_points)), 1) AS matching_score
    FROM score_calc sc
    ORDER BY matching_score DESC, sc.username ASC
    LIMIT p_limit;
END;
$$;
