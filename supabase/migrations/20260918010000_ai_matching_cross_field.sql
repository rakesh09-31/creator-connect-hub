-- ============================================================================
-- OmniCraft AI Matching System Migration: Cross-Field Semantic Matching
-- Migration: 20260918010000_ai_matching_cross_field.sql
-- Searches across Roles, Skills, and Specialties for all requirements
-- ============================================================================

-- Helper function to expand canonical role capabilities
CREATE OR REPLACE FUNCTION public.get_role_canonical_capabilities(p_roles TEXT[])
RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
    SELECT COALESCE(array_agg(DISTINCT cap), '{}'::TEXT[])
    FROM (
        SELECT unnest(p_roles) AS r
    ) t,
    LATERAL (
        SELECT r AS cap
        UNION ALL
        SELECT 'acting' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'
        UNION ALL
        SELECT 'film acting' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'
        UNION ALL
        SELECT 'screen performance' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'
        UNION ALL
        SELECT 'dance' WHERE r ILIKE '%dancer%' OR r ILIKE '%dance%'
        UNION ALL
        SELECT 'choreography' WHERE r ILIKE '%dancer%' OR r ILIKE '%dance%'
        UNION ALL
        SELECT 'singing' WHERE r ILIKE '%singer%' OR r ILIKE '%singing%' OR r ILIKE '%vocal%'
        UNION ALL
        SELECT 'photography' WHERE r ILIKE '%photographer%' OR r ILIKE '%photography%'
        UNION ALL
        SELECT 'photoshoot' WHERE r ILIKE '%photographer%' OR r ILIKE '%photography%'
        UNION ALL
        SELECT 'video editing' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%'
        UNION ALL
        SELECT 'editing' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%'
        UNION ALL
        SELECT 'post production' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%'
        UNION ALL
        SELECT 'writing' WHERE r ILIKE '%writer%' OR r ILIKE '%writing%'
        UNION ALL
        SELECT 'copywriting' WHERE r ILIKE '%writer%' OR r ILIKE '%writing%'
        UNION ALL
        SELECT 'directing' WHERE r ILIKE '%director%' OR r ILIKE '%directing%'
        UNION ALL
        SELECT 'animation' WHERE r ILIKE '%animator%' OR r ILIKE '%animation%'
        UNION ALL
        SELECT 'design' WHERE r ILIKE '%designer%' OR r ILIKE '%design%'
        UNION ALL
        SELECT 'graphic design' WHERE r ILIKE '%designer%' OR r ILIKE '%design%'
        UNION ALL
        SELECT 'cinematography' WHERE r ILIKE '%cinematographer%' OR r ILIKE '%cinematography%'
        UNION ALL
        SELECT 'camera operator' WHERE r ILIKE '%cinematographer%' OR r ILIKE '%cinematography%'
        UNION ALL
        SELECT 'voice acting' WHERE r ILIKE '%voice%'
        UNION ALL
        SELECT 'voiceover' WHERE r ILIKE '%voice%'
        UNION ALL
        SELECT 'content creation' WHERE r ILIKE '%content creator%' OR r ILIKE '%content creation%'
    ) caps;
$$;

-- 1. Upgrade get_recommended_jobs_for_creator with Cross-Field matching
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
    WITH creator_raw AS (
        SELECT
            p.id,
            p.experience_level,
            COALESCE(array_agg(DISTINCT cr.role_id) FILTER (WHERE cr.role_id IS NOT NULL), '{}') AS role_ids,
            COALESCE(array_agg(DISTINCT LOWER(TRIM(pr.name))) FILTER (WHERE pr.name IS NOT NULL), '{}') AS role_names,
            COALESCE(array_agg(DISTINCT LOWER(TRIM(s.name))) FILTER (WHERE s.name IS NOT NULL), '{}') AS skill_names,
            COALESCE(array_agg(DISTINCT LOWER(TRIM(cspec.specialty))) FILTER (WHERE cspec.specialty IS NOT NULL), '{}') AS specialties
        FROM public.profiles p
        LEFT JOIN public.creator_roles cr ON cr.creator_id = p.id
        LEFT JOIN public.professional_roles pr ON pr.id = cr.role_id
        LEFT JOIN public.creator_skills cs ON cs.creator_id = p.id
        LEFT JOIN public.skills s ON s.id = cs.skill_id
        LEFT JOIN public.creator_specialties cspec ON cspec.user_id = p.id
        WHERE p.id = p_creator_id
        GROUP BY p.id, p.experience_level
    ),
    creator_profile AS (
        SELECT
            cr.id,
            cr.experience_level,
            cr.role_ids,
            cr.role_names,
            cr.skill_names,
            cr.specialties,
            -- Cross-field capabilities combines skills, specialties, role names, and canonical role capabilities
            ARRAY(
                SELECT DISTINCT LOWER(TRIM(x))
                FROM unnest(cr.skill_names || cr.specialties || cr.role_names || public.get_role_canonical_capabilities(cr.role_names)) x
                WHERE TRIM(x) <> ''
            ) AS all_capabilities
        FROM creator_raw cr
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
            COALESCE(array_agg(DISTINCT LOWER(TRIM(jpr.name))) FILTER (WHERE jpr.name IS NOT NULL), '{}') AS j_role_names,
            COALESCE(
                CASE 
                    WHEN j.skills_required IS NOT NULL AND jsonb_typeof(j.skills_required) = 'array' THEN 
                        ARRAY(SELECT LOWER(TRIM(x)) FROM jsonb_array_elements_text(j.skills_required) x WHERE TRIM(x) <> '')
                    ELSE '{}'::text[]
                END,
                '{}'::text[]
            ) AS j_skills,
            COALESCE(
                ARRAY(
                    SELECT LOWER(TRIM(y)) 
                    FROM unnest(COALESCE(j.specialties_required, '{}'::text[])) y 
                    WHERE TRIM(y) <> ''
                ), 
                '{}'::text[]
            ) AS j_specialties
        FROM public.jobs j
        LEFT JOIN public.job_roles jr ON jr.job_id = j.id
        LEFT JOIN public.professional_roles jpr ON jpr.id = jr.role_id
        WHERE j.status = 'open'
        GROUP BY j.id, j.title, j.description, j.budget, j.company_name, j.created_at, j.experience_level, j.skills_required, j.specialties_required
    ),
    score_calc AS (
        SELECT
            jd.j_id,
            jd.j_title,
            jd.j_desc,
            jd.j_budget,
            jd.j_company,
            jd.j_created,
            cardinality(jd.j_skills) AS req_skill_count,
            -- CROSS-FIELD SKILL MATCH: Search across creator's all_capabilities
            cardinality(ARRAY(SELECT unnest(cp.all_capabilities) INTERSECT SELECT unnest(jd.j_skills))) AS matched_skill_count,
            cardinality(jd.j_specialties) AS req_spec_count,
            -- CROSS-FIELD SPECIALTY MATCH: Search across creator's all_capabilities
            cardinality(ARRAY(SELECT unnest(cp.all_capabilities) INTERSECT SELECT unnest(jd.j_specialties))) AS matched_spec_count,
            cardinality(jd.j_role_ids) AS req_role_count,
            -- ROLE MATCH: Either exact role ID/name match OR capability match
            (
                CASE
                    WHEN cardinality(jd.j_role_ids) = 0 THEN 1
                    WHEN cardinality(ARRAY(SELECT unnest(cp.role_ids) INTERSECT SELECT unnest(jd.j_role_ids))) > 0 THEN 1
                    WHEN cardinality(ARRAY(SELECT unnest(cp.all_capabilities) INTERSECT SELECT unnest(jd.j_role_names))) > 0 THEN 1
                    ELSE 0
                END
            ) AS is_role_matched,
            -- Skills Points (0 - 40 points)
            (
                CASE 
                    WHEN cardinality(jd.j_skills) > 0 THEN
                        (cardinality(ARRAY(SELECT unnest(cp.all_capabilities) INTERSECT SELECT unnest(jd.j_skills)))::numeric / cardinality(jd.j_skills)::numeric * 40.0)
                    ELSE 20.0
                END
            ) AS skill_points,
            -- Specialties Points (0 - 20 points)
            (
                CASE
                    WHEN cardinality(jd.j_specialties) > 0 THEN
                        (cardinality(ARRAY(SELECT unnest(cp.all_capabilities) INTERSECT SELECT unnest(jd.j_specialties)))::numeric / cardinality(jd.j_specialties)::numeric * 20.0)
                    ELSE 15.0
                END
            ) AS spec_points,
            -- Roles Points (0 - 25 points)
            (
                CASE
                    WHEN cardinality(jd.j_role_ids) > 0 THEN
                        (CASE WHEN (cardinality(ARRAY(SELECT unnest(cp.role_ids) INTERSECT SELECT unnest(jd.j_role_ids))) > 0 OR cardinality(ARRAY(SELECT unnest(cp.all_capabilities) INTERSECT SELECT unnest(jd.j_role_names))) > 0) THEN 25.0 ELSE 0.0 END)
                    ELSE 20.0
                END
            ) AS role_points,
            -- Experience Points (0 - 15 points)
            (
                CASE
                    WHEN jd.j_exp_level IS NULL THEN 12.0
                    WHEN LOWER(COALESCE(cp.experience_level, '')) = LOWER(jd.j_exp_level) THEN 15.0
                    WHEN LOWER(COALESCE(cp.experience_level, '')) = 'senior' THEN 15.0
                    WHEN LOWER(COALESCE(cp.experience_level, '')) = 'intermediate' AND LOWER(jd.j_exp_level) = 'entry' THEN 15.0
                    ELSE 3.0
                END
            ) AS exp_points
        FROM job_details jd
        CROSS JOIN creator_profile cp
    ),
    final_scores AS (
        SELECT
            sc.j_id,
            sc.j_title,
            sc.j_desc,
            sc.j_budget,
            sc.j_company,
            sc.j_created,
            (
                CASE
                    -- If nothing matched across skills, specialties and roles: strict 0%
                    WHEN (sc.req_skill_count > 0 AND sc.matched_skill_count = 0)
                     AND (sc.req_spec_count > 0 AND sc.matched_spec_count = 0)
                     AND sc.is_role_matched = 0 THEN 0.0
                    -- 100% full match bonus when all required criteria match
                    WHEN (sc.req_skill_count = 0 OR sc.matched_skill_count = sc.req_skill_count)
                     AND (sc.req_spec_count = 0 OR sc.matched_spec_count = sc.req_spec_count)
                     AND sc.is_role_matched = 1
                     AND sc.exp_points >= 12.0 THEN 100.0
                    ELSE LEAST(99.0, GREATEST(0.0, sc.skill_points + sc.spec_points + sc.role_points + sc.exp_points))
                END
            ) AS raw_match
        FROM score_calc sc
    )
    SELECT
        fs.j_id AS job_id,
        fs.j_title AS title,
        fs.j_desc AS description,
        fs.j_budget AS budget,
        fs.j_company AS company_name,
        ROUND(fs.raw_match, 0) AS matching_score
    FROM final_scores fs
    ORDER BY matching_score DESC, fs.j_created DESC
    LIMIT p_limit;
END;
$$;

-- 2. Upgrade get_recommended_creators_for_job with Cross-Field matching
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
            COALESCE(array_agg(DISTINCT LOWER(TRIM(jpr.name))) FILTER (WHERE jpr.name IS NOT NULL), '{}') AS role_names,
            COALESCE(
                CASE 
                    WHEN j.skills_required IS NOT NULL AND jsonb_typeof(j.skills_required) = 'array' THEN 
                        ARRAY(SELECT LOWER(TRIM(x)) FROM jsonb_array_elements_text(j.skills_required) x WHERE TRIM(x) <> '')
                    ELSE '{}'::text[]
                END,
                '{}'::text[]
            ) AS skills,
            COALESCE(
                ARRAY(
                    SELECT LOWER(TRIM(y)) 
                    FROM unnest(COALESCE(j.specialties_required, '{}'::text[])) y 
                    WHERE TRIM(y) <> ''
                ), 
                '{}'::text[]
            ) AS specialties
        FROM public.jobs j
        LEFT JOIN public.job_roles jr ON jr.job_id = j.id
        LEFT JOIN public.professional_roles jpr ON jpr.id = jr.role_id
        WHERE j.id = p_job_id
        GROUP BY j.id, j.experience_level, j.skills_required, j.specialties_required
    ),
    creators_raw AS (
        SELECT
            p.id,
            p.username,
            p.full_name,
            p.avatar_url,
            p.bio,
            p.account_type,
            p.experience_level,
            COALESCE(array_agg(DISTINCT cr.role_id) FILTER (WHERE cr.role_id IS NOT NULL), '{}') AS role_ids,
            COALESCE(array_agg(DISTINCT LOWER(TRIM(pr.name))) FILTER (WHERE pr.name IS NOT NULL), '{}') AS role_names,
            COALESCE(array_agg(DISTINCT LOWER(TRIM(s.name))) FILTER (WHERE s.name IS NOT NULL), '{}') AS skill_names,
            COALESCE(array_agg(DISTINCT LOWER(TRIM(cspec.specialty))) FILTER (WHERE cspec.specialty IS NOT NULL), '{}') AS specialties
        FROM public.profiles p
        LEFT JOIN public.creator_roles cr ON cr.creator_id = p.id
        LEFT JOIN public.professional_roles pr ON pr.id = cr.role_id
        LEFT JOIN public.creator_skills cs ON cs.creator_id = p.id
        LEFT JOIN public.skills s ON s.id = cs.skill_id
        LEFT JOIN public.creator_specialties cspec ON cspec.user_id = p.id
        WHERE p.role = 'creator' OR p.account_type = 'creator'
        GROUP BY p.id, p.username, p.full_name, p.avatar_url, p.bio, p.account_type, p.experience_level
    ),
    creators AS (
        SELECT
            cr.id,
            cr.username,
            cr.full_name,
            cr.avatar_url,
            cr.bio,
            cr.account_type,
            cr.experience_level,
            cr.role_ids,
            cr.role_names,
            cr.skill_names,
            cr.specialties,
            ARRAY(
                SELECT DISTINCT LOWER(TRIM(x))
                FROM unnest(cr.skill_names || cr.specialties || cr.role_names || public.get_role_canonical_capabilities(cr.role_names)) x
                WHERE TRIM(x) <> ''
            ) AS all_capabilities
        FROM creators_raw cr
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
            cardinality(jr.skills) AS req_skill_count,
            cardinality(ARRAY(SELECT unnest(c.all_capabilities) INTERSECT SELECT unnest(jr.skills))) AS matched_skill_count,
            cardinality(jr.specialties) AS req_spec_count,
            cardinality(ARRAY(SELECT unnest(c.all_capabilities) INTERSECT SELECT unnest(jr.specialties))) AS matched_spec_count,
            cardinality(jr.role_ids) AS req_role_count,
            (
                CASE
                    WHEN cardinality(jr.role_ids) = 0 THEN 1
                    WHEN cardinality(ARRAY(SELECT unnest(c.role_ids) INTERSECT SELECT unnest(jr.role_ids))) > 0 THEN 1
                    WHEN cardinality(ARRAY(SELECT unnest(c.all_capabilities) INTERSECT SELECT unnest(jr.role_names))) > 0 THEN 1
                    ELSE 0
                END
            ) AS is_role_matched,
            -- Skill Points (0 - 40 points)
            (
                CASE 
                    WHEN cardinality(jr.skills) > 0 THEN
                        (cardinality(ARRAY(SELECT unnest(c.all_capabilities) INTERSECT SELECT unnest(jr.skills)))::numeric / cardinality(jr.skills)::numeric * 40.0)
                    ELSE 20.0
                END
            ) AS skill_points,
            -- Specialty Points (0 - 20 points)
            (
                CASE
                    WHEN cardinality(jr.specialties) > 0 THEN
                        (cardinality(ARRAY(SELECT unnest(c.all_capabilities) INTERSECT SELECT unnest(jr.specialties)))::numeric / cardinality(jr.specialties)::numeric * 20.0)
                    ELSE 15.0
                END
            ) AS spec_points,
            -- Role Points (0 - 25 points)
            (
                CASE
                    WHEN cardinality(jr.role_ids) > 0 THEN
                        (CASE WHEN (cardinality(ARRAY(SELECT unnest(c.role_ids) INTERSECT SELECT unnest(jr.role_ids))) > 0 OR cardinality(ARRAY(SELECT unnest(c.all_capabilities) INTERSECT SELECT unnest(jr.role_names))) > 0) THEN 25.0 ELSE 0.0 END)
                    ELSE 20.0
                END
            ) AS role_points,
            -- Experience Points (0 - 15 points)
            (
                CASE
                    WHEN jr.j_exp_level IS NULL THEN 12.0
                    WHEN LOWER(COALESCE(c.experience_level, '')) = LOWER(jr.j_exp_level) THEN 15.0
                    WHEN LOWER(COALESCE(c.experience_level, '')) = 'senior' THEN 15.0
                    WHEN LOWER(COALESCE(c.experience_level, '')) = 'intermediate' AND LOWER(jr.j_exp_level) = 'entry' THEN 15.0
                    ELSE 3.0
                END
            ) AS exp_points
        FROM creators c
        CROSS JOIN job_reqs jr
    ),
    final_scores AS (
        SELECT
            sc.id,
            sc.username,
            sc.full_name,
            sc.avatar_url,
            sc.bio,
            sc.account_type,
            sc.experience_level,
            (
                CASE
                    -- If nothing matched across skills, specialties and roles: strict 0%
                    WHEN (sc.req_skill_count > 0 AND sc.matched_skill_count = 0)
                     AND (sc.req_spec_count > 0 AND sc.matched_spec_count = 0)
                     AND sc.is_role_matched = 0 THEN 0.0
                    -- 100% full match bonus when all required criteria match
                    WHEN (sc.req_skill_count = 0 OR sc.matched_skill_count = sc.req_skill_count)
                     AND (sc.req_spec_count = 0 OR sc.matched_spec_count = sc.req_spec_count)
                     AND sc.is_role_matched = 1
                     AND sc.exp_points >= 12.0 THEN 100.0
                    ELSE LEAST(99.0, GREATEST(0.0, sc.skill_points + sc.spec_points + sc.role_points + sc.exp_points))
                END
            ) AS raw_match
        FROM score_calc sc
    )
    SELECT
        fs.id AS creator_id,
        fs.username,
        fs.full_name,
        fs.avatar_url,
        fs.bio,
        fs.account_type,
        fs.experience_level,
        ROUND(fs.raw_match, 0) AS matching_score
    FROM final_scores fs
    ORDER BY matching_score DESC
    LIMIT p_limit;
END;
$$;
