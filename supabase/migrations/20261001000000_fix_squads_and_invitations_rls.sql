-- Migration: Fix Squads, Members, and Invitations RLS & Profile Mapping
-- File: supabase/migrations/20261001000000_fix_squads_and_invitations_rls.sql

BEGIN;

-- ============================================================================
-- 1. SQUADS TABLE: Support profiles.auth_user_id mapping for owner_id
-- ============================================================================
DROP POLICY IF EXISTS "squads_insert" ON public.squads;
CREATE POLICY "squads_insert" ON public.squads FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = owner_id
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = squads.owner_id
          AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
    )
);

DROP POLICY IF EXISTS "squads_update" ON public.squads;
CREATE POLICY "squads_update" ON public.squads FOR UPDATE TO authenticated
USING (
    auth.uid() = owner_id
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = squads.owner_id
          AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
    )
)
WITH CHECK (
    auth.uid() = owner_id
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = squads.owner_id
          AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
    )
);

DROP POLICY IF EXISTS "squads_delete" ON public.squads;
CREATE POLICY "squads_delete" ON public.squads FOR DELETE TO authenticated
USING (
    auth.uid() = owner_id
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = squads.owner_id
          AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
    )
);

-- ============================================================================
-- 2. SQUAD_MEMBERS TABLE: Support profiles.auth_user_id mapping for user_id & squad owner
-- ============================================================================
DROP POLICY IF EXISTS "squad_members_insert" ON public.squad_members;
CREATE POLICY "squad_members_insert" ON public.squad_members FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = squad_members.user_id
          AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.squads s
        WHERE s.id = squad_members.squad_id
          AND (
            s.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = s.owner_id
                  AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
            )
          )
    )
);

DROP POLICY IF EXISTS "squad_members_update" ON public.squad_members;
CREATE POLICY "squad_members_update" ON public.squad_members FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.squads s
        WHERE s.id = squad_members.squad_id
          AND (
            s.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = s.owner_id
                  AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
            )
          )
    )
);

DROP POLICY IF EXISTS "squad_members_delete" ON public.squad_members;
CREATE POLICY "squad_members_delete" ON public.squad_members FOR DELETE TO authenticated
USING (
    auth.uid() = user_id
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = squad_members.user_id
          AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.squads s
        WHERE s.id = squad_members.squad_id
          AND (
            s.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = s.owner_id
                  AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
            )
          )
    )
);

-- ============================================================================
-- 3. SQUAD_INVITATIONS TABLE: Support profiles.auth_user_id mapping for inviter_id & squad owner
-- ============================================================================
DROP POLICY IF EXISTS "squad_invitations_insert" ON public.squad_invitations;
CREATE POLICY "squad_invitations_insert" ON public.squad_invitations FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = inviter_id
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = squad_invitations.inviter_id
          AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.squads s
        WHERE s.id = squad_invitations.squad_id
          AND (
            s.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = s.owner_id
                  AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
            )
          )
    )
);

DROP POLICY IF EXISTS "squad_invitations_delete" ON public.squad_invitations;
CREATE POLICY "squad_invitations_delete" ON public.squad_invitations FOR DELETE TO authenticated
USING (
    auth.uid() = inviter_id
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = squad_invitations.inviter_id
          AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.squads s
        WHERE s.id = squad_invitations.squad_id
          AND (
            s.owner_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.profiles p
                WHERE p.id = s.owner_id
                  AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
            )
          )
    )
);

-- ============================================================================
-- 4. NOTIFICATIONS TABLE: Support profiles.auth_user_id mapping for actor_id
-- ============================================================================
DROP POLICY IF EXISTS "notifications_insert_actor" ON public.notifications;
CREATE POLICY "notifications_insert_actor" ON public.notifications FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = actor_id
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = notifications.actor_id
          AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
    )
);

-- ============================================================================
-- 5. SQUAD_TASKS TABLE: Ensure workspace tasks respect mapped profile identity
-- ============================================================================
DROP POLICY IF EXISTS "squad_tasks_select_members" ON public.squad_tasks;
CREATE POLICY "squad_tasks_select_members" ON public.squad_tasks
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.squads s 
            WHERE s.id = squad_tasks.squad_id 
              AND (
                s.owner_id = auth.uid() 
                OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = s.owner_id AND (p.auth_user_id = auth.uid() OR p.id = auth.uid()))
              )
        )
        OR
        EXISTS (
            SELECT 1 FROM public.squad_members sm 
            WHERE sm.squad_id = squad_tasks.squad_id 
              AND (
                sm.user_id = auth.uid() 
                OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = sm.user_id AND (p.auth_user_id = auth.uid() OR p.id = auth.uid()))
              )
        )
    );

DROP POLICY IF EXISTS "squad_tasks_insert_members" ON public.squad_tasks;
CREATE POLICY "squad_tasks_insert_members" ON public.squad_tasks
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.squads s 
            WHERE s.id = squad_tasks.squad_id 
              AND (
                s.owner_id = auth.uid() 
                OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = s.owner_id AND (p.auth_user_id = auth.uid() OR p.id = auth.uid()))
              )
        )
        OR
        EXISTS (
            SELECT 1 FROM public.squad_members sm 
            WHERE sm.squad_id = squad_tasks.squad_id 
              AND (
                sm.user_id = auth.uid() 
                OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = sm.user_id AND (p.auth_user_id = auth.uid() OR p.id = auth.uid()))
              )
        )
    );

DROP POLICY IF EXISTS "squad_tasks_update_members" ON public.squad_tasks;
CREATE POLICY "squad_tasks_update_members" ON public.squad_tasks
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.squads s 
            WHERE s.id = squad_tasks.squad_id 
              AND (
                s.owner_id = auth.uid() 
                OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = s.owner_id AND (p.auth_user_id = auth.uid() OR p.id = auth.uid()))
              )
        )
        OR
        EXISTS (
            SELECT 1 FROM public.squad_members sm 
            WHERE sm.squad_id = squad_tasks.squad_id 
              AND (
                sm.user_id = auth.uid() 
                OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = sm.user_id AND (p.auth_user_id = auth.uid() OR p.id = auth.uid()))
              )
        )
    );

DROP POLICY IF EXISTS "squad_tasks_delete_owner_or_creator" ON public.squad_tasks;
CREATE POLICY "squad_tasks_delete_owner_or_creator" ON public.squad_tasks
    FOR DELETE TO authenticated
    USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.squads s 
            WHERE s.id = squad_tasks.squad_id 
              AND (
                s.owner_id = auth.uid() 
                OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = s.owner_id AND (p.auth_user_id = auth.uid() OR p.id = auth.uid()))
              )
        )
    );

-- ============================================================================
-- 6. SECURITY DEFINER RPC: create_project_squad_workspace
-- Creates squad workspace + owner membership atomically with strict auth checks
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_project_squad_workspace(
    p_name TEXT,
    p_description TEXT DEFAULT NULL,
    p_specialty TEXT DEFAULT 'Creative',
    p_budget TEXT DEFAULT NULL,
    p_timeline TEXT DEFAULT NULL,
    p_project_brief TEXT DEFAULT NULL,
    p_owner_profile_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_profile_id UUID;
    v_squad_id UUID;
    v_existing_id UUID;
BEGIN
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Resolve canonical profile id for current authenticated user
    IF p_owner_profile_id IS NOT NULL THEN
        SELECT id INTO v_profile_id
        FROM public.profiles
        WHERE id = p_owner_profile_id
          AND (auth_user_id = v_auth_uid OR id = v_auth_uid);
        
        IF v_profile_id IS NULL THEN
            RAISE EXCEPTION 'Unauthorized: specified profile does not belong to the authenticated user';
        END IF;
    ELSE
        SELECT id INTO v_profile_id
        FROM public.profiles
        WHERE auth_user_id = v_auth_uid OR id = v_auth_uid
        ORDER BY (CASE WHEN auth_user_id = v_auth_uid THEN 1 ELSE 2 END)
        LIMIT 1;
    END IF;

    -- Fallback to auth.uid() if no profile row found
    IF v_profile_id IS NULL THEN
        v_profile_id := v_auth_uid;
    END IF;

    -- Check if an existing squad with same name already exists for this owner
    SELECT id INTO v_existing_id
    FROM public.squads
    WHERE (owner_id = v_profile_id OR owner_id = v_auth_uid)
      AND name = p_name
    LIMIT 1;

    IF v_existing_id IS NOT NULL THEN
        -- Ensure owner is in squad_members
        INSERT INTO public.squad_members (squad_id, user_id, role)
        VALUES (v_existing_id, v_profile_id, 'owner')
        ON CONFLICT (squad_id, user_id) DO UPDATE SET role = 'owner';

        RETURN jsonb_build_object(
            'success', true,
            'squad_id', v_existing_id,
            'is_new', false
        );
    END IF;

    -- Insert new squad
    INSERT INTO public.squads (
        name,
        description,
        specialty,
        owner_id,
        budget,
        timeline,
        project_brief
    ) VALUES (
        p_name,
        p_description,
        COALESCE(p_specialty, 'Creative'),
        v_profile_id,
        p_budget,
        p_timeline,
        p_project_brief
    ) RETURNING id INTO v_squad_id;

    -- Atomically insert owner into squad_members
    INSERT INTO public.squad_members (squad_id, user_id, role)
    VALUES (v_squad_id, v_profile_id, 'owner')
    ON CONFLICT (squad_id, user_id) DO UPDATE SET role = 'owner';

    -- Return result
    RETURN jsonb_build_object(
        'success', true,
        'squad_id', v_squad_id,
        'is_new', true
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_project_squad_workspace TO authenticated;

COMMIT;
