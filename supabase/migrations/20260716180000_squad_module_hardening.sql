-- Align the implementation with the public Squad contract and close the client-side
-- authorization gaps left by the original module.
ALTER TABLE public.squad_invites RENAME TO squad_invitations;

CREATE OR REPLACE FUNCTION public.is_creator_account(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT role::text <> 'client' FROM public.profiles WHERE id = _user_id), false);
$$;

CREATE OR REPLACE FUNCTION public.is_squad_manager(_squad_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.squads WHERE id = _squad_id AND owner_id = _user_id)
      OR EXISTS (
        SELECT 1 FROM public.squad_members
        WHERE squad_id = _squad_id AND user_id = _user_id AND role = 'admin'
      );
$$;

-- Only creator/admin accounts can create or participate in squads. Clients retain
-- read access to public squads but cannot obtain membership, invitations, or chat.
DROP POLICY IF EXISTS squads_owner_insert ON public.squads;
CREATE POLICY squads_creator_insert ON public.squads FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id AND public.is_creator_account(auth.uid()));
DROP POLICY IF EXISTS squads_public_read ON public.squads;
CREATE POLICY squads_scoped_read ON public.squads FOR SELECT
  USING (
    COALESCE(privacy, 'public') = 'public'
    OR owner_id = auth.uid()
    OR (public.is_creator_account(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.squad_members WHERE squad_id = squads.id AND user_id = auth.uid()
    ))
  );

DROP POLICY IF EXISTS squad_members_owner_insert ON public.squad_members;
CREATE POLICY squad_members_manager_insert ON public.squad_members FOR INSERT TO authenticated
  WITH CHECK (public.is_creator_account(auth.uid()) AND public.is_squad_manager(squad_id, auth.uid()));
DROP POLICY IF EXISTS squad_members_owner_delete ON public.squad_members;
CREATE POLICY squad_members_manager_or_self_delete ON public.squad_members FOR DELETE TO authenticated
  USING (public.is_squad_manager(squad_id, auth.uid()) OR user_id = auth.uid());
DROP POLICY IF EXISTS squad_members_owner_update ON public.squad_members;
CREATE POLICY squad_members_owner_update ON public.squad_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.squads WHERE id = squad_id AND owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.squads WHERE id = squad_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS squad_invites_visible ON public.squad_invitations;
DROP POLICY IF EXISTS squad_invites_create ON public.squad_invitations;
DROP POLICY IF EXISTS squad_invites_update ON public.squad_invitations;
DROP POLICY IF EXISTS squad_invites_delete ON public.squad_invitations;
CREATE POLICY squad_invitations_visible ON public.squad_invitations FOR SELECT TO authenticated
  USING (invitee_id = auth.uid() OR public.is_squad_manager(squad_id, auth.uid()));
CREATE POLICY squad_invitations_create ON public.squad_invitations FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid() AND public.is_creator_account(auth.uid()) AND public.is_squad_manager(squad_id, auth.uid()));
CREATE POLICY squad_invitations_update ON public.squad_invitations FOR UPDATE TO authenticated
  USING (invitee_id = auth.uid() OR public.is_squad_manager(squad_id, auth.uid()))
  WITH CHECK (invitee_id = auth.uid() OR public.is_squad_manager(squad_id, auth.uid()));
CREATE POLICY squad_invitations_delete ON public.squad_invitations FOR DELETE TO authenticated
  USING (invitee_id = auth.uid() OR public.is_squad_manager(squad_id, auth.uid()));

DROP POLICY IF EXISTS sjr_create ON public.squad_join_requests;
CREATE POLICY sjr_creator_create ON public.squad_join_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_creator_account(auth.uid()));
DROP POLICY IF EXISTS sjr_update ON public.squad_join_requests;
CREATE POLICY sjr_manager_update ON public.squad_join_requests FOR UPDATE TO authenticated
  USING (public.is_squad_manager(squad_id, auth.uid()))
  WITH CHECK (public.is_squad_manager(squad_id, auth.uid()));

DROP POLICY IF EXISTS squad_messages_insert ON public.squad_messages;
CREATE POLICY squad_messages_creator_insert ON public.squad_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_creator_account(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.squad_members WHERE squad_id = squad_messages.squad_id AND user_id = auth.uid()
  ));

-- The trigger names survive a table rename, but the policy/function naming should
-- describe the table applications query.
ALTER TABLE public.squad_invitations RENAME CONSTRAINT squad_invites_squad_id_fkey TO squad_invitations_squad_id_fkey;
ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_messages;

CREATE OR REPLACE FUNCTION public.notify_squad_owner_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.owner_id IS DISTINCT FROM OLD.owner_id THEN
    PERFORM public.create_notification(
      NEW.owner_id, OLD.owner_id, 'squad_ownership_transferred', 'squad', NEW.id,
      jsonb_build_object('squad_name', NEW.name)
    );
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS squad_owner_change_notify ON public.squads;
CREATE TRIGGER squad_owner_change_notify AFTER UPDATE OF owner_id ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.notify_squad_owner_change();
