-- Fix RLS: use auth.jwt() instead of querying auth.users directly
BEGIN;

-- 1. Update RLS policies for notifications
DROP POLICY IF EXISTS "notifications_read" ON public.notifications;
CREATE POLICY "notifications_read" ON public.notifications FOR SELECT TO authenticated
USING (
    auth.uid() = user_id 
    OR auth.uid() = actor_id 
    OR EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE (p.id = notifications.user_id OR p.id = notifications.actor_id) 
          AND (
            p.auth_user_id = auth.uid() 
            OR p.id = auth.uid() 
            OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', ''))
          )
    )
);

DROP POLICY IF EXISTS "notifications_update" ON public.notifications;
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE TO authenticated
USING (
    auth.uid() = user_id 
    OR EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = notifications.user_id 
          AND (
            p.auth_user_id = auth.uid() 
            OR p.id = auth.uid() 
            OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', ''))
          )
    )
);

DROP POLICY IF EXISTS "notifications_delete" ON public.notifications;
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE TO authenticated
USING (
    auth.uid() = user_id 
    OR EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = notifications.user_id 
          AND (
            p.auth_user_id = auth.uid() 
            OR p.id = auth.uid() 
            OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', ''))
          )
    )
);

-- 2. Update RLS policies for squad_invitations
DROP POLICY IF EXISTS "squad_invitations_read" ON public.squad_invitations;
CREATE POLICY "squad_invitations_read" ON public.squad_invitations FOR SELECT TO authenticated
USING (
    auth.uid() = invitee_id
    OR auth.uid() = inviter_id
    OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_invitations.squad_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = s.owner_id AND p.auth_user_id = auth.uid())))
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE (p.id = squad_invitations.invitee_id OR p.id = squad_invitations.inviter_id)
          AND (
            p.auth_user_id = auth.uid() 
            OR p.id = auth.uid() 
            OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', ''))
          )
    )
);

DROP POLICY IF EXISTS "squad_invitations_update" ON public.squad_invitations;
CREATE POLICY "squad_invitations_update" ON public.squad_invitations FOR UPDATE TO authenticated
USING (
    auth.uid() = invitee_id
    OR auth.uid() = inviter_id
    OR EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_invitations.squad_id AND (s.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = s.owner_id AND p.auth_user_id = auth.uid())))
    OR EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE (p.id = squad_invitations.invitee_id OR p.id = squad_invitations.inviter_id)
          AND (
            p.auth_user_id = auth.uid() 
            OR p.id = auth.uid() 
            OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', ''))
          )
    )
);

-- 3. Update accept_squad_invitation RPC
CREATE OR REPLACE FUNCTION public.accept_squad_invitation(p_invitation_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_username TEXT := COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', '');
    v_inv public.squad_invitations;
    v_target_profile_id UUID;
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
            SELECT p.id FROM public.profiles p
            WHERE p.id = v_user 
               OR p.auth_user_id = v_user 
               OR (v_username != '' AND LOWER(p.username) = LOWER(v_username))
               OR LOWER(p.username) IN (SELECT LOWER(p2.username) FROM public.profiles p2 WHERE p2.id = v_user OR p2.auth_user_id = v_user)
        )
      )
      AND status = 'pending';

    IF NOT FOUND THEN 
        RAISE EXCEPTION 'Invitation not found or already processed'; 
    END IF;

    -- Target profile is the directory profile that was invited
    v_target_profile_id := v_inv.invitee_id;

    -- Link auth_user_id to the directory profile if not already linked
    UPDATE public.profiles
    SET auth_user_id = v_user, updated_at = now()
    WHERE id = v_target_profile_id AND (auth_user_id IS NULL OR auth_user_id = v_user);

    -- Update invitation record status to accepted (preserving invitee_id as the valid profile UUID!)
    UPDATE public.squad_invitations 
    SET status = 'accepted', updated_at = now() 
    WHERE id = p_invitation_id;

    -- Add creator to squad members using the valid profile UUID
    INSERT INTO public.squad_members (squad_id, user_id, role)
    VALUES (v_inv.squad_id, v_target_profile_id, v_inv.role)
    ON CONFLICT (squad_id, user_id) DO UPDATE SET role = EXCLUDED.role;

    -- Add to squad chat if conversation exists
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    SELECT conversation_id, v_target_profile_id, 'member'
    FROM public.squads
    WHERE id = v_inv.squad_id AND conversation_id IS NOT NULL
    ON CONFLICT DO NOTHING;

    RETURN true;
END;
$$;

-- 4. Update reject_squad_invitation RPC
CREATE OR REPLACE FUNCTION public.reject_squad_invitation(p_invitation_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_username TEXT := COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', '');
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
            SELECT p.id FROM public.profiles p
            WHERE p.id = v_user 
               OR p.auth_user_id = v_user 
               OR (v_username != '' AND LOWER(p.username) = LOWER(v_username))
               OR LOWER(p.username) IN (SELECT LOWER(p2.username) FROM public.profiles p2 WHERE p2.id = v_user OR p2.auth_user_id = v_user)
        )
      )
      AND status = 'pending';

    RETURN true;
END;
$$;

COMMIT;
