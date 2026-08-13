-- 1. Create or replace the atomic accept RPC for squad invitations
CREATE OR REPLACE FUNCTION public.accept_squad_invitation(p_invitation_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  -- Lock the row for update to prevent race conditions
  SELECT * INTO v_invitation FROM public.squad_invitations 
  WHERE id = p_invitation_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found.';
  END IF;

  -- Verify the current user is the invitee
  IF v_invitation.invitee_id != auth.uid() THEN
    RAISE EXCEPTION 'You do not have permission to accept this invitation.';
  END IF;

  -- Verify the invitation is still pending
  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'This invitation is no longer pending.';
  END IF;

  -- Verify the squad still exists
  IF NOT EXISTS (SELECT 1 FROM public.squads WHERE id = v_invitation.squad_id) THEN
    RAISE EXCEPTION 'This squad no longer exists.';
  END IF;

  -- Insert into squad_members with 'member' role
  -- (Will fail gracefully if unique constraint is violated due to ON CONFLICT DO NOTHING)
  INSERT INTO public.squad_members (squad_id, user_id, role)
  VALUES (v_invitation.squad_id, v_invitation.invitee_id, 'member')
  ON CONFLICT (squad_id, user_id) DO NOTHING;

  -- Update invitation status (using responded_at instead of updated_at)
  UPDATE public.squad_invitations 
  SET status = 'accepted', responded_at = now()
  WHERE id = p_invitation_id;
END;
$$;

-- 2. Create or replace the atomic reject RPC for squad invitations
CREATE OR REPLACE FUNCTION public.reject_squad_invitation(p_invitation_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  SELECT * INTO v_invitation FROM public.squad_invitations 
  WHERE id = p_invitation_id 
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found.';
  END IF;

  IF v_invitation.invitee_id != auth.uid() THEN
    RAISE EXCEPTION 'You do not have permission to reject this invitation.';
  END IF;

  IF v_invitation.status != 'pending' THEN
    RAISE EXCEPTION 'This invitation is no longer pending.';
  END IF;

  UPDATE public.squad_invitations 
  SET status = 'rejected', responded_at = now()
  WHERE id = p_invitation_id;
END;
$$;

-- Ensure execute permissions are granted
GRANT EXECUTE ON FUNCTION public.accept_squad_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_squad_invitation(UUID) TO authenticated;
