-- 1. Modify the notify trigger to REMOVE the INSERT INTO squad_members logic.
-- We want acceptance to be strictly handled by the atomic RPC, while the trigger only handles notifications.
CREATE OR REPLACE FUNCTION public.notify_squad_invite()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO v_name FROM public.squads WHERE id = NEW.squad_id;
    PERFORM public.create_notification(NEW.invitee_id, NEW.inviter_id, 'squad_invite', 'squad', NEW.squad_id,
      jsonb_build_object('squad_name', v_name, 'invite_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT name INTO v_name FROM public.squads WHERE id = NEW.squad_id;
    PERFORM public.create_notification(NEW.inviter_id, NEW.invitee_id,
      CASE WHEN NEW.status='accepted' THEN 'squad_invite_accepted' ELSE 'squad_invite_rejected' END,
      'squad', NEW.squad_id, jsonb_build_object('squad_name', v_name));
  END IF;
  RETURN NEW;
END $$;

-- 2. Create the atomic accept RPC
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

  -- Insert into squad_members
  -- (Will fail gracefully if unique constraint is violated due to ON CONFLICT DO NOTHING,
  -- but normally wouldn't happen because of the pending status check)
  INSERT INTO public.squad_members (squad_id, user_id, role)
  VALUES (v_invitation.squad_id, v_invitation.invitee_id, 'member')
  ON CONFLICT (squad_id, user_id) DO NOTHING;

  -- Update invitation status
  UPDATE public.squad_invitations 
  SET status = 'accepted', updated_at = now()
  WHERE id = p_invitation_id;
END;
$$;

-- 3. Create the atomic reject RPC
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
  SET status = 'rejected', updated_at = now()
  WHERE id = p_invitation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_squad_invitation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_squad_invitation(UUID) TO authenticated;
