-- Migration: Fix squad_invitations inviter_id Foreign Key & Atomic Invitation RPC
-- File: supabase/migrations/20261001010000_fix_squad_invitations_inviter_fk.sql

BEGIN;

-- ============================================================================
-- 1. DROP OBSOLETE LEGACY CONSTRAINT squad_invitations_inviter_id_fkey
-- In 20260927203000_unlinked_creator_invitations.sql, squad_invitations_invitee_id_fkey
-- (which referenced auth.users) was dropped so invitee_id references public.profiles(id).
-- The legacy constraint squad_invitations_inviter_id_fkey (referencing auth.users) was
-- left behind, creating conflicting FKs with squad_invitations_inviter_id_profiles_fkey.
-- Dropping it allows inviter_id to cleanly reference public.profiles(id).
-- ============================================================================
ALTER TABLE public.squad_invitations
    DROP CONSTRAINT IF EXISTS squad_invitations_inviter_id_fkey;

-- Ensure foreign key from inviter_id to public.profiles(id) is active
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'squad_invitations_inviter_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.squad_invitations
            ADD CONSTRAINT squad_invitations_inviter_id_profiles_fkey
            FOREIGN KEY (inviter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Ensure foreign key from invitee_id to public.profiles(id) is active
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'squad_invitations_invitee_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.squad_invitations
            ADD CONSTRAINT squad_invitations_invitee_id_profiles_fkey
            FOREIGN KEY (invitee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- 2. SECURITY DEFINER RPC: send_project_squad_invitation
-- Atomically validates caller identity, resolves canonical profiles.id for both
-- inviter and invitee, inserts into squad_invitations and dispatches notification.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.send_project_squad_invitation(
    p_squad_id UUID,
    p_invitee_profile_id UUID,
    p_role TEXT,
    p_project_name TEXT DEFAULT NULL,
    p_brief TEXT DEFAULT NULL,
    p_budget TEXT DEFAULT NULL,
    p_timeline TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_auth_uid UUID := auth.uid();
    v_inviter_profile_id UUID;
    v_invitee_id UUID;
    v_inv_id UUID;
    v_existing public.squad_invitations;
BEGIN
    IF v_auth_uid IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Resolve canonical inviter profile id
    SELECT id INTO v_inviter_profile_id
    FROM public.profiles
    WHERE auth_user_id = v_auth_uid OR id = v_auth_uid
    ORDER BY (CASE WHEN auth_user_id = v_auth_uid THEN 1 ELSE 2 END)
    LIMIT 1;

    IF v_inviter_profile_id IS NULL THEN
        RAISE EXCEPTION 'Could not resolve authenticated user OmniCraft profile';
    END IF;

    -- Resolve canonical invitee profile id from directory
    SELECT id INTO v_invitee_id
    FROM public.profiles
    WHERE id = p_invitee_profile_id;

    IF v_invitee_id IS NULL THEN
        RAISE EXCEPTION 'Creator profile not found in OmniCraft directory';
    END IF;

    IF v_inviter_profile_id = v_invitee_id THEN
        RAISE EXCEPTION 'Cannot invite yourself to your own project';
    END IF;

    -- Check if invitation already exists
    SELECT * INTO v_existing
    FROM public.squad_invitations
    WHERE squad_id = p_squad_id AND invitee_id = v_invitee_id;

    IF FOUND THEN
        IF v_existing.status = 'pending' THEN
            RAISE EXCEPTION 'An active pending invitation has already been sent to this creator.';
        END IF;
        IF v_existing.status = 'accepted' THEN
            RAISE EXCEPTION 'This creator is already an accepted member of the squad.';
        END IF;

        -- Reactivate declined/cancelled invitation
        UPDATE public.squad_invitations
        SET status = 'pending',
            role = COALESCE(p_role, 'member'),
            project_name = p_project_name,
            brief = p_brief,
            budget = p_budget,
            timeline = p_timeline,
            updated_at = now()
        WHERE id = v_existing.id
        RETURNING id INTO v_inv_id;
    ELSE
        INSERT INTO public.squad_invitations (
            squad_id,
            inviter_id,
            invitee_id,
            role,
            status,
            project_name,
            brief,
            budget,
            timeline
        ) VALUES (
            p_squad_id,
            v_inviter_profile_id,
            v_invitee_id,
            COALESCE(p_role, 'member'),
            'pending',
            p_project_name,
            p_brief,
            p_budget,
            p_timeline
        ) RETURNING id INTO v_inv_id;
    END IF;

    -- Dispatch notification to invitee
    INSERT INTO public.notifications (
        user_id,
        actor_id,
        type,
        entity_type,
        entity_id,
        data,
        read
    ) VALUES (
        v_invitee_id,
        v_inviter_profile_id,
        'squad_invitation',
        'squad',
        p_squad_id,
        jsonb_build_object(
            'squad_id', p_squad_id,
            'project_name', p_project_name,
            'role', p_role,
            'brief', p_brief,
            'budget', p_budget,
            'timeline', p_timeline
        ),
        false
    );

    RETURN jsonb_build_object(
        'success', true,
        'invitation_id', v_inv_id,
        'inviter_id', v_inviter_profile_id,
        'invitee_id', v_invitee_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_project_squad_invitation TO authenticated;

COMMIT;
