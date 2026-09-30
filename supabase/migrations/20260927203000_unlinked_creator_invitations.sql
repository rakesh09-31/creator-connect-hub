-- Migration: Support Inviting All Directory Creators (Linked & Unlinked)
-- File: supabase/migrations/20260927203000_unlinked_creator_invitations.sql

BEGIN;

-- 1. Remove the restrictive auth.users FK constraint on invitee_id
-- This allows squad_invitations.invitee_id to reference public.profiles(id),
-- enabling project owners to invite any verified creator in the OmniCraft directory.
ALTER TABLE public.squad_invitations
    DROP CONSTRAINT IF EXISTS squad_invitations_invitee_id_fkey;

-- 2. Ensure foreign key to public.profiles is active with ON DELETE CASCADE
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

-- 3. Update RLS policies to allow invitee resolution by Auth UID or username
DROP POLICY IF EXISTS "squad_invitations_read" ON public.squad_invitations;
CREATE POLICY "squad_invitations_read" ON public.squad_invitations FOR SELECT TO authenticated
USING (
    auth.uid() = invitee_id
    OR auth.uid() = inviter_id
    OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_invitations.squad_id AND s.owner_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.profiles p_auth, public.profiles p_inv
        WHERE p_auth.id = auth.uid() 
          AND p_inv.id = squad_invitations.invitee_id 
          AND LOWER(p_auth.username) = LOWER(p_inv.username)
    )
);

DROP POLICY IF EXISTS "squad_invitations_update" ON public.squad_invitations;
CREATE POLICY "squad_invitations_update" ON public.squad_invitations FOR UPDATE TO authenticated
USING (
    auth.uid() = invitee_id
    OR auth.uid() = inviter_id
    OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_invitations.squad_id AND s.owner_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.profiles p_auth, public.profiles p_inv
        WHERE p_auth.id = auth.uid() 
          AND p_inv.id = squad_invitations.invitee_id 
          AND LOWER(p_auth.username) = LOWER(p_inv.username)
    )
);

-- 4. Update accept_squad_invitation RPC to support directory profile invitations
CREATE OR REPLACE FUNCTION public.accept_squad_invitation(p_invitation_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_inv public.squad_invitations;
BEGIN
    IF v_user IS NULL THEN 
        RAISE EXCEPTION 'Not authenticated'; 
    END IF;

    -- Find pending invitation for current user by ID or username match
    SELECT * INTO v_inv FROM public.squad_invitations 
    WHERE id = p_invitation_id 
      AND (
        invitee_id = v_user 
        OR invitee_id IN (
            SELECT p_dir.id FROM public.profiles p_curr, public.profiles p_dir
            WHERE p_curr.id = v_user AND LOWER(p_curr.username) = LOWER(p_dir.username)
        )
      )
      AND status = 'pending';

    IF NOT FOUND THEN 
        RAISE EXCEPTION 'Invitation not found or already processed'; 
    END IF;

    -- Update invitation record to link with authenticated user and mark accepted
    UPDATE public.squad_invitations 
    SET invitee_id = v_user, status = 'accepted', updated_at = now() 
    WHERE id = p_invitation_id;

    -- Add creator to squad members
    INSERT INTO public.squad_members (squad_id, user_id, role)
    VALUES (v_inv.squad_id, v_user, v_inv.role)
    ON CONFLICT (squad_id, user_id) DO UPDATE SET role = EXCLUDED.role;

    -- Add to squad chat if conversation exists
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    SELECT conversation_id, v_user, 'member'
    FROM public.squads
    WHERE id = v_inv.squad_id AND conversation_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    RETURN true;
END;
$$;

-- 5. Update reject_squad_invitation RPC to support directory profile invitations
CREATE OR REPLACE FUNCTION public.reject_squad_invitation(p_invitation_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
BEGIN
    IF v_user IS NULL THEN 
        RAISE EXCEPTION 'Not authenticated'; 
    END IF;

    UPDATE public.squad_invitations
    SET status = 'declined', updated_at = now()
    WHERE id = p_invitation_id 
      AND (
        invitee_id = v_user 
        OR invitee_id IN (
            SELECT p_dir.id FROM public.profiles p_curr, public.profiles p_dir
            WHERE p_curr.id = v_user AND LOWER(p_curr.username) = LOWER(p_dir.username)
        )
      )
      AND status = 'pending';

    RETURN true;
END;
$$;

COMMIT;
