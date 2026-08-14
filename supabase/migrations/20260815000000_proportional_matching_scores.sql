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
    v_req_roles_len integer;
    v_req_skills_len integer;
BEGIN
    SELECT * INTO v_job FROM public.jobs WHERE id = p_job_id;
    
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    SELECT array_agg(role_id) INTO v_req_roles FROM public.job_roles WHERE job_id = p_job_id;
    SELECT array_agg(skill_id) INTO v_req_skills FROM public.job_skills WHERE job_id = p_job_id;

    v_req_roles_len := array_length(v_req_roles, 1);
    v_req_skills_len := array_length(v_req_skills, 1);

    RETURN QUERY
    WITH creator_matches AS (
        SELECT p.id as cid,
               p.experience_level as c_exp_level,
               p.experience_years as c_exp_years,
               (SELECT array_agg(role_id) FROM public.creator_roles WHERE creator_id = p.id) as c_roles,
               (SELECT array_agg(skill_id) FROM public.creator_skills WHERE creator_id = p.id) as c_skills
        FROM public.profiles p
        WHERE p.role = 'creator' OR p.account_type = 'creator'
    ),
    score_calculation AS (
        SELECT cid,
               -- Role match (40%)
               (CASE WHEN v_req_roles_len IS NULL OR v_req_roles_len = 0 THEN 40
                     WHEN c_roles IS NOT NULL THEN 
                         LEAST(40, (COALESCE(array_length(ARRAY(SELECT unnest(v_req_roles) INTERSECT SELECT unnest(c_roles)), 1), 0)::float / v_req_roles_len) * 40)
                     ELSE 0 END) as role_score,
               -- Skill match (35%)
               (CASE WHEN v_req_skills_len IS NULL OR v_req_skills_len = 0 THEN 35
                     WHEN c_skills IS NOT NULL THEN 
                         LEAST(35, (COALESCE(array_length(ARRAY(SELECT unnest(v_req_skills) INTERSECT SELECT unnest(c_skills)), 1), 0)::float / v_req_skills_len) * 35)
                     ELSE 0 END) as skill_score,
               -- Experience match (15%)
               (CASE WHEN v_job.experience_level IS NULL THEN 15
                     WHEN c_exp_level = v_job.experience_level THEN 15
                     ELSE 5 END) as exp_score,
               -- Availability/Location (10%)
               10 as avail_score
        FROM creator_matches
    )
    SELECT cid,
           CAST(ROUND(role_score + skill_score + exp_score + avail_score) AS integer) as score
    FROM score_calculation
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
    ),
    score_calculation AS (
        SELECT jid,
               -- Role match (40%)
               (CASE WHEN array_length(j_roles, 1) IS NULL OR array_length(j_roles, 1) = 0 THEN 40
                     WHEN v_c_roles IS NOT NULL THEN 
                         LEAST(40, (COALESCE(array_length(ARRAY(SELECT unnest(j_roles) INTERSECT SELECT unnest(v_c_roles)), 1), 0)::float / array_length(j_roles, 1)) * 40)
                     ELSE 0 END) as role_score,
               -- Skill match (35%)
               (CASE WHEN array_length(j_skills, 1) IS NULL OR array_length(j_skills, 1) = 0 THEN 35
                     WHEN v_c_skills IS NOT NULL THEN 
                         LEAST(35, (COALESCE(array_length(ARRAY(SELECT unnest(j_skills) INTERSECT SELECT unnest(v_c_skills)), 1), 0)::float / array_length(j_skills, 1)) * 35)
                     ELSE 0 END) as skill_score,
               -- Experience match (15%)
               (CASE WHEN j_exp_level IS NULL THEN 15
                     WHEN v_creator.experience_level = j_exp_level THEN 15
                     ELSE 5 END) as exp_score,
               -- Availability/Location (10%)
               10 as avail_score
        FROM job_matches
    )
    SELECT jid,
           CAST(ROUND(role_score + skill_score + exp_score + avail_score) AS integer) as score
    FROM score_calculation
    ORDER BY score DESC
    LIMIT p_limit;
END;
$$;
