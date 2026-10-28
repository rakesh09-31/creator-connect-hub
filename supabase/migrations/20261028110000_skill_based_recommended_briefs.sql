-- ============================================================================
-- Migration: 20261028110000_skill_based_recommended_briefs.sql
-- Description: Skill-Based Recommended Briefs Engine with Strict Relevance Filtering
-- ============================================================================

-- 1. Helper function to expand canonical role capabilities across all domains
CREATE OR REPLACE FUNCTION public.get_role_canonical_capabilities(p_roles TEXT[])
RETURNS TEXT[] LANGUAGE sql IMMUTABLE AS $$
    SELECT COALESCE(array_agg(DISTINCT cap), '{}'::TEXT[])
    FROM (
        SELECT unnest(p_roles) AS r
    ) t,
    LATERAL (
        SELECT LOWER(TRIM(r)) AS cap
        UNION ALL
        -- Actor & Performance
        SELECT 'acting' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'
        UNION ALL
        SELECT 'actor' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'
        UNION ALL
        SELECT 'actors' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'
        UNION ALL
        SELECT 'actors for characters' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'
        UNION ALL
        SELECT 'voice acting' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%' OR r ILIKE '%voice%'
        UNION ALL
        SELECT 'voiceover' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%' OR r ILIKE '%voice%'
        UNION ALL
        SELECT 'modelling' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%' OR r ILIKE '%model%'
        UNION ALL
        SELECT 'performance' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'
        UNION ALL
        SELECT 'film acting' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'
        UNION ALL
        SELECT 'theatre acting' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'
        UNION ALL
        SELECT 'screen performance' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'
        UNION ALL
        SELECT 'character portrayal' WHERE r ILIKE '%actor%' OR r ILIKE '%acting%'

        -- Video Editor & Post-Production
        UNION ALL
        SELECT 'video editing' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%' OR r ILIKE '%premiere%' OR r ILIKE '%after effects%'
        UNION ALL
        SELECT 'video editor' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%'
        UNION ALL
        SELECT 'reels editing' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%' OR r ILIKE '%video%'
        UNION ALL
        SELECT 'youtube editing' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%' OR r ILIKE '%video%'
        UNION ALL
        SELECT 'post-production' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%' OR r ILIKE '%post production%'
        UNION ALL
        SELECT 'post production' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%' OR r ILIKE '%post-production%'
        UNION ALL
        SELECT 'timeline editing' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%'
        UNION ALL
        SELECT 'color grading' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%' OR r ILIKE '%color%'
        UNION ALL
        SELECT 'sound design' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%' OR r ILIKE '%sound%'
        UNION ALL
        SELECT 'premiere pro' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%' OR r ILIKE '%premiere%'
        UNION ALL
        SELECT 'adobe premiere pro' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%' OR r ILIKE '%premiere%'
        UNION ALL
        SELECT 'after effects' WHERE r ILIKE '%editor%' OR r ILIKE '%editing%' OR r ILIKE '%after effects%'

        -- Photographer
        UNION ALL
        SELECT 'photography' WHERE r ILIKE '%photographer%' OR r ILIKE '%photography%' OR r ILIKE '%photo%'
        UNION ALL
        SELECT 'photographer' WHERE r ILIKE '%photographer%' OR r ILIKE '%photography%'
        UNION ALL
        SELECT 'event photography' WHERE r ILIKE '%photographer%' OR r ILIKE '%photography%'
        UNION ALL
        SELECT 'portraits' WHERE r ILIKE '%photographer%' OR r ILIKE '%photography%' OR r ILIKE '%portrait%'
        UNION ALL
        SELECT 'portrait photography' WHERE r ILIKE '%photographer%' OR r ILIKE '%photography%' OR r ILIKE '%portrait%'
        UNION ALL
        SELECT 'product photography' WHERE r ILIKE '%photographer%' OR r ILIKE '%photography%'
        UNION ALL
        SELECT 'photoshoot' WHERE r ILIKE '%photographer%' OR r ILIKE '%photography%'
        UNION ALL
        SELECT 'photo editing' WHERE r ILIKE '%photographer%' OR r ILIKE '%photography%' OR r ILIKE '%lightroom%'

        -- Graphic Designer
        UNION ALL
        SELECT 'graphic design' WHERE r ILIKE '%designer%' OR r ILIKE '%design%'
        UNION ALL
        SELECT 'graphic designer' WHERE r ILIKE '%designer%' OR r ILIKE '%design%'
        UNION ALL
        SELECT 'design' WHERE r ILIKE '%designer%' OR r ILIKE '%design%'
        UNION ALL
        SELECT 'designer' WHERE r ILIKE '%designer%' OR r ILIKE '%design%'
        UNION ALL
        SELECT 'logos' WHERE r ILIKE '%designer%' OR r ILIKE '%design%' OR r ILIKE '%logo%'
        UNION ALL
        SELECT 'logo design' WHERE r ILIKE '%designer%' OR r ILIKE '%design%' OR r ILIKE '%logo%'
        UNION ALL
        SELECT 'branding' WHERE r ILIKE '%designer%' OR r ILIKE '%design%' OR r ILIKE '%brand%'
        UNION ALL
        SELECT 'brand identity' WHERE r ILIKE '%designer%' OR r ILIKE '%design%' OR r ILIKE '%brand%'
        UNION ALL
        SELECT 'posters' WHERE r ILIKE '%designer%' OR r ILIKE '%design%'
        UNION ALL
        SELECT 'thumbnails' WHERE r ILIKE '%designer%' OR r ILIKE '%design%'
        UNION ALL
        SELECT 'ui ux' WHERE r ILIKE '%designer%' OR r ILIKE '%design%' OR r ILIKE '%ui%' OR r ILIKE '%ux%'

        -- Content Writer
        UNION ALL
        SELECT 'content writing' WHERE r ILIKE '%writer%' OR r ILIKE '%writing%'
        UNION ALL
        SELECT 'content writer' WHERE r ILIKE '%writer%' OR r ILIKE '%writing%'
        UNION ALL
        SELECT 'writing' WHERE r ILIKE '%writer%' OR r ILIKE '%writing%'
        UNION ALL
        SELECT 'writer' WHERE r ILIKE '%writer%' OR r ILIKE '%writing%'
        UNION ALL
        SELECT 'blog writing' WHERE r ILIKE '%writer%' OR r ILIKE '%writing%' OR r ILIKE '%blog%'
        UNION ALL
        SELECT 'scripts' WHERE r ILIKE '%writer%' OR r ILIKE '%writing%' OR r ILIKE '%script%'
        UNION ALL
        SELECT 'scriptwriting' WHERE r ILIKE '%writer%' OR r ILIKE '%writing%' OR r ILIKE '%script%'
        UNION ALL
        SELECT 'copywriting' WHERE r ILIKE '%writer%' OR r ILIKE '%writing%' OR r ILIKE '%copy%'
        UNION ALL
        SELECT 'content creation' WHERE r ILIKE '%writer%' OR r ILIKE '%writing%' OR r ILIKE '%content%'

        -- Web Developer
        UNION ALL
        SELECT 'web development' WHERE r ILIKE '%developer%' OR r ILIKE '%development%' OR r ILIKE '%programmer%' OR r ILIKE '%engineer%'
        UNION ALL
        SELECT 'web developer' WHERE r ILIKE '%developer%' OR r ILIKE '%development%' OR r ILIKE '%programmer%' OR r ILIKE '%engineer%'
        UNION ALL
        SELECT 'website development' WHERE r ILIKE '%developer%' OR r ILIKE '%development%'
        UNION ALL
        SELECT 'frontend' WHERE r ILIKE '%developer%' OR r ILIKE '%frontend%' OR r ILIKE '%react%'
        UNION ALL
        SELECT 'backend' WHERE r ILIKE '%developer%' OR r ILIKE '%backend%' OR r ILIKE '%node%'
        UNION ALL
        SELECT 'web applications' WHERE r ILIKE '%developer%' OR r ILIKE '%development%'

        -- Dancer
        UNION ALL
        SELECT 'dance' WHERE r ILIKE '%dancer%' OR r ILIKE '%dance%'
        UNION ALL
        SELECT 'dancer' WHERE r ILIKE '%dancer%' OR r ILIKE '%dance%'
        UNION ALL
        SELECT 'choreography' WHERE r ILIKE '%dancer%' OR r ILIKE '%dance%'

        -- Singer & Audio
        UNION ALL
        SELECT 'singing' WHERE r ILIKE '%singer%' OR r ILIKE '%singing%' OR r ILIKE '%vocal%'
        UNION ALL
        SELECT 'singer' WHERE r ILIKE '%singer%' OR r ILIKE '%singing%'
        UNION ALL
        SELECT 'music composition' WHERE r ILIKE '%composer%' OR r ILIKE '%music%'
        UNION ALL
        SELECT 'mixing' WHERE r ILIKE '%mixing%' OR r ILIKE '%music%' OR r ILIKE '%audio%'
        UNION ALL
        SELECT 'mastering' WHERE r ILIKE '%mastering%' OR r ILIKE '%music%' OR r ILIKE '%audio%'

        -- Cinematographer
        UNION ALL
        SELECT 'cinematography' WHERE r ILIKE '%cinematographer%' OR r ILIKE '%cinematography%'
        UNION ALL
        SELECT 'camera operator' WHERE r ILIKE '%cinematographer%' OR r ILIKE '%cinematography%' OR r ILIKE '%videographer%'
    ) caps
    WHERE TRIM(cap) <> '';
$$;

-- 2. Upgraded get_recommended_jobs_for_creator with strict relevance filtering and genuine scoring
DROP FUNCTION IF EXISTS public.get_recommended_jobs_for_creator(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.get_recommended_jobs_for_creator(p_creator_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
    job_id UUID,
    title TEXT,
    description TEXT,
    budget TEXT,
    company_name TEXT,
    matching_score NUMERIC,
    matched_skills TEXT[]
) LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_cap_count INTEGER;
BEGIN
    -- Check if creator exists and has any profile capabilities
    SELECT COUNT(*) INTO v_cap_count
    FROM (
        SELECT 1 FROM public.creator_roles WHERE creator_id = p_creator_id
        UNION ALL
        SELECT 1 FROM public.creator_skills WHERE creator_id = p_creator_id
        UNION ALL
        SELECT 1 FROM public.creator_specialties WHERE user_id = p_creator_id
    ) c;

    -- If creator has NO roles, NO skills, and NO specialties, return empty recommendations
    IF v_cap_count = 0 OR v_cap_count IS NULL THEN
        RETURN;
    END IF;

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
            ARRAY(
                SELECT DISTINCT LOWER(TRIM(x))
                FROM unnest(cr.skill_names || cr.specialties || cr.role_names || public.get_role_canonical_capabilities(cr.role_names || cr.skill_names || cr.specialties)) x
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
            j.category AS j_category,
            COALESCE(array_agg(DISTINCT jr.role_id) FILTER (WHERE jr.role_id IS NOT NULL), '{}') AS j_role_ids,
            COALESCE(array_agg(DISTINCT LOWER(TRIM(jpr.name))) FILTER (WHERE jpr.name IS NOT NULL), '{}') AS j_role_names,
            COALESCE(
                ARRAY(
                    SELECT DISTINCT LOWER(TRIM(s))
                    FROM (
                        SELECT LOWER(TRIM(x)) AS s
                        FROM jsonb_array_elements_text(CASE WHEN j.skills_required IS NOT NULL AND jsonb_typeof(j.skills_required) = 'array' THEN j.skills_required ELSE '[]'::jsonb END) x
                        UNION ALL
                        SELECT LOWER(TRIM(js_s.name)) AS s
                        FROM public.job_skills js
                        JOIN public.skills js_s ON js_s.id = js.skill_id
                        WHERE js.job_id = j.id
                    ) s_all
                    WHERE s <> ''
                ),
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
        GROUP BY j.id, j.title, j.description, j.budget, j.company_name, j.created_at, j.experience_level, j.category, j.skills_required, j.specialties_required
    ),
    evaluated_jobs AS (
        SELECT
            jd.j_id,
            jd.j_title,
            jd.j_desc,
            jd.j_budget,
            jd.j_company,
            jd.j_created,
            jd.j_skills,
            jd.j_role_names,
            jd.j_specialties,
            jd.j_category,
            jd.j_exp_level,
            -- Extracted role names from title/category when j_role_names is empty
            ARRAY(
                SELECT DISTINCT LOWER(TRIM(r))
                FROM (
                    SELECT unnest(jd.j_role_names) AS r
                    UNION ALL
                    SELECT 'actor' WHERE (jd.j_category ILIKE '%actor%' OR jd.j_title ILIKE '%actor%' OR jd.j_title ILIKE '%acting%')
                    UNION ALL
                    SELECT 'video editor' WHERE (jd.j_category ILIKE '%edit%' OR jd.j_category ILIKE '%video%' OR jd.j_title ILIKE '%editor%' OR jd.j_title ILIKE '%editing%')
                    UNION ALL
                    SELECT 'photographer' WHERE (jd.j_category ILIKE '%photo%' OR jd.j_title ILIKE '%photographer%' OR jd.j_title ILIKE '%photography%')
                    UNION ALL
                    SELECT 'graphic designer' WHERE (jd.j_category ILIKE '%design%' OR jd.j_title ILIKE '%design%' OR jd.j_title ILIKE '%logo%')
                    UNION ALL
                    SELECT 'content writer' WHERE (jd.j_category ILIKE '%writing%' OR jd.j_category ILIKE '%writer%' OR jd.j_title ILIKE '%writer%' OR jd.j_title ILIKE '%script%')
                    UNION ALL
                    SELECT 'web developer' WHERE (jd.j_category ILIKE '%web%' OR jd.j_category ILIKE '%developer%' OR jd.j_title ILIKE '%developer%' OR jd.j_title ILIKE '%website%')
                    UNION ALL
                    SELECT 'dancer' WHERE (jd.j_category ILIKE '%dance%' OR jd.j_title ILIKE '%dancer%' OR jd.j_title ILIKE '%dance%')
                    UNION ALL
                    SELECT 'singer' WHERE (jd.j_category ILIKE '%music%' OR jd.j_category ILIKE '%audio%' OR jd.j_category ILIKE '%sing%' OR jd.j_title ILIKE '%music%' OR jd.j_title ILIKE '%singer%' OR jd.j_title ILIKE '%podcast%')
                ) r_all
                WHERE TRIM(r) <> ''
            ) AS effective_roles,
            -- Check if job has ANY identifiable requirement
            (
                cardinality(jd.j_skills) > 0
                OR cardinality(jd.j_role_names) > 0
                OR cardinality(jd.j_specialties) > 0
                OR (jd.j_category IS NOT NULL AND TRIM(jd.j_category) <> '')
                OR (jd.j_title ILIKE '%actor%' OR jd.j_title ILIKE '%acting%'
                    OR jd.j_title ILIKE '%editor%' OR jd.j_title ILIKE '%editing%'
                    OR jd.j_title ILIKE '%photo%' OR jd.j_title ILIKE '%photographer%'
                    OR jd.j_title ILIKE '%designer%' OR jd.j_title ILIKE '%design%'
                    OR jd.j_title ILIKE '%writer%' OR jd.j_title ILIKE '%writing%'
                    OR jd.j_title ILIKE '%developer%' OR jd.j_title ILIKE '%web%'
                    OR jd.j_title ILIKE '%dance%' OR jd.j_title ILIKE '%music%')
            ) AS has_identifiable_requirements
        FROM job_details jd
    ),
    scored AS (
        SELECT
            ej.j_id,
            ej.j_title,
            ej.j_desc,
            ej.j_budget,
            ej.j_company,
            ej.j_created,
            -- Calculate matched skills
            ARRAY(
                SELECT DISTINCT s
                FROM unnest(ej.j_skills) s
                WHERE EXISTS (
                    SELECT 1 FROM unnest(cp.all_capabilities) cap
                    WHERE cap = s
                       OR (length(cap) > 3 AND s LIKE '%' || cap || '%')
                       OR (length(s) > 3 AND cap LIKE '%' || s || '%')
                )
            ) AS matched_skills,
            -- Calculate matched roles
            ARRAY(
                SELECT DISTINCT r
                FROM unnest(ej.effective_roles) r
                WHERE EXISTS (
                    SELECT 1 FROM unnest(cp.all_capabilities) cap
                    WHERE cap = r
                       OR (length(cap) > 3 AND r LIKE '%' || cap || '%')
                       OR (length(r) > 3 AND cap LIKE '%' || r || '%')
                )
            ) AS matched_roles,
            -- Calculate matched specialties
            ARRAY(
                SELECT DISTINCT sp
                FROM unnest(ej.j_specialties) sp
                WHERE EXISTS (
                    SELECT 1 FROM unnest(cp.all_capabilities) cap
                    WHERE cap = sp
                       OR (length(cap) > 3 AND sp LIKE '%' || cap || '%')
                       OR (length(sp) > 3 AND cap LIKE '%' || sp || '%')
                )
            ) AS matched_specialties,
            cardinality(ej.j_skills) AS req_skill_count,
            cardinality(ej.effective_roles) AS req_role_count,
            cardinality(ej.j_specialties) AS req_spec_count,
            ej.has_identifiable_requirements,
            cp.experience_level AS cp_exp_level,
            ej.j_exp_level
        FROM evaluated_jobs ej
        CROSS JOIN creator_profile cp
    ),
    final_matches AS (
        SELECT
            s.j_id,
            s.j_title,
            s.j_desc,
            s.j_budget,
            s.j_company,
            s.j_created,
            s.matched_skills,
            s.req_skill_count,
            s.req_role_count,
            s.req_spec_count,
            cardinality(s.matched_skills) AS matched_skill_count,
            cardinality(s.matched_roles) AS matched_role_count,
            cardinality(s.matched_specialties) AS matched_spec_count,
            -- Strict relevance gate:
            -- 1. Job must have identifiable requirements
            -- 2. Must match at least one skill OR role OR specialty
            (
                s.has_identifiable_requirements
                AND (cardinality(s.matched_skills) > 0 OR cardinality(s.matched_roles) > 0 OR cardinality(s.matched_specialties) > 0)
            ) AS is_relevant,
            -- Score components
            CASE
                WHEN s.req_role_count > 0 THEN
                    (cardinality(s.matched_roles)::numeric / s.req_role_count::numeric) * 35.0
                WHEN cardinality(s.matched_roles) > 0 THEN 35.0
                ELSE 0.0
            END AS role_score,
            CASE
                WHEN s.req_skill_count > 0 THEN
                    (cardinality(s.matched_skills)::numeric / s.req_skill_count::numeric) * 45.0
                WHEN cardinality(s.matched_roles) > 0 THEN 35.0
                ELSE 0.0
            END AS skill_score,
            CASE
                WHEN s.req_spec_count > 0 THEN
                    (cardinality(s.matched_specialties)::numeric / s.req_spec_count::numeric) * 10.0
                WHEN cardinality(s.matched_specialties) > 0 THEN 10.0
                ELSE 5.0
            END AS spec_score,
            CASE
                WHEN s.j_exp_level IS NULL THEN 10.0
                WHEN LOWER(COALESCE(s.cp_exp_level, '')) = LOWER(s.j_exp_level) THEN 10.0
                WHEN LOWER(COALESCE(s.cp_exp_level, '')) = 'senior' THEN 10.0
                WHEN LOWER(COALESCE(s.cp_exp_level, '')) = 'intermediate' AND LOWER(s.j_exp_level) = 'entry' THEN 10.0
                ELSE 3.0
            END AS exp_score
        FROM scored s
    ),
    ranked AS (
        SELECT
            fm.j_id,
            fm.j_title,
            fm.j_desc,
            fm.j_budget,
            fm.j_company,
            fm.j_created,
            fm.matched_skills,
            (
                CASE
                    -- If not strictly relevant, match score is 0.0
                    WHEN NOT fm.is_relevant THEN 0.0
                    -- 100% full match bonus when all required skills and roles are satisfied
                    WHEN (fm.req_skill_count = 0 OR fm.matched_skill_count = fm.req_skill_count)
                     AND (fm.req_role_count = 0 OR fm.matched_role_count >= 1)
                     AND fm.exp_score >= 8.0 THEN 100.0
                    ELSE LEAST(99.0, GREATEST(10.0, fm.role_score + fm.skill_score + fm.spec_score + fm.exp_score))
                END
            ) AS raw_score
        FROM final_matches fm
    )
    SELECT
        r.j_id AS job_id,
        r.j_title AS title,
        r.j_desc AS description,
        r.j_budget AS budget,
        r.j_company AS company_name,
        ROUND(r.raw_score, 0) AS matching_score,
        r.matched_skills
    FROM ranked r
    WHERE r.raw_score >= 50.0
    ORDER BY matching_score DESC, r.j_created DESC
    LIMIT p_limit;
END;
$$;
