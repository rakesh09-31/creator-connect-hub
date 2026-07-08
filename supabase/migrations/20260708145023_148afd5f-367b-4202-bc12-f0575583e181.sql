
-- Allow updates on squad_members for role changes by owner/admin
GRANT UPDATE ON public.squad_members TO authenticated;

CREATE OR REPLACE FUNCTION public.is_squad_owner_or_admin(_squad_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.squads s WHERE s.id = _squad_id AND s.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.squad_members m WHERE m.squad_id = _squad_id AND m.user_id = _user_id AND m.role IN ('owner','admin'));
$$;

DROP POLICY IF EXISTS squad_members_owner_update ON public.squad_members;
CREATE POLICY squad_members_owner_update ON public.squad_members FOR UPDATE TO authenticated
  USING (public.is_squad_owner_or_admin(squad_id, auth.uid()))
  WITH CHECK (public.is_squad_owner_or_admin(squad_id, auth.uid()));

-- SQUAD INVITES
CREATE TABLE public.squad_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL,
  invitee_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (squad_id, invitee_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_invites TO authenticated;
GRANT ALL ON public.squad_invites TO service_role;
ALTER TABLE public.squad_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY squad_invites_visible ON public.squad_invites FOR SELECT TO authenticated
  USING (invitee_id = auth.uid() OR inviter_id = auth.uid() OR public.is_squad_owner_or_admin(squad_id, auth.uid()));
CREATE POLICY squad_invites_create ON public.squad_invites FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid() AND public.is_squad_owner_or_admin(squad_id, auth.uid()));
CREATE POLICY squad_invites_update ON public.squad_invites FOR UPDATE TO authenticated
  USING (invitee_id = auth.uid() OR public.is_squad_owner_or_admin(squad_id, auth.uid()))
  WITH CHECK (invitee_id = auth.uid() OR public.is_squad_owner_or_admin(squad_id, auth.uid()));
CREATE POLICY squad_invites_delete ON public.squad_invites FOR DELETE TO authenticated
  USING (invitee_id = auth.uid() OR public.is_squad_owner_or_admin(squad_id, auth.uid()));
CREATE TRIGGER squad_invites_touch BEFORE UPDATE ON public.squad_invites FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- SQUAD JOIN REQUESTS
CREATE TABLE public.squad_join_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (squad_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_join_requests TO authenticated;
GRANT ALL ON public.squad_join_requests TO service_role;
ALTER TABLE public.squad_join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY sjr_visible ON public.squad_join_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_squad_owner_or_admin(squad_id, auth.uid()));
CREATE POLICY sjr_create ON public.squad_join_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY sjr_update ON public.squad_join_requests FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_squad_owner_or_admin(squad_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_squad_owner_or_admin(squad_id, auth.uid()));
CREATE POLICY sjr_delete ON public.squad_join_requests FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_squad_owner_or_admin(squad_id, auth.uid()));
CREATE TRIGGER sjr_touch BEFORE UPDATE ON public.squad_join_requests FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Notification triggers
CREATE OR REPLACE FUNCTION public.notify_squad_invite()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO v_name FROM public.squads WHERE id = NEW.squad_id;
    PERFORM public.create_notification(NEW.invitee_id, NEW.inviter_id, 'squad_invite', 'squad', NEW.squad_id,
      jsonb_build_object('squad_name', v_name, 'invite_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO public.squad_members (squad_id, user_id, role) VALUES (NEW.squad_id, NEW.invitee_id, 'member')
      ON CONFLICT DO NOTHING;
    END IF;
    SELECT name INTO v_name FROM public.squads WHERE id = NEW.squad_id;
    PERFORM public.create_notification(NEW.inviter_id, NEW.invitee_id,
      CASE WHEN NEW.status='accepted' THEN 'squad_invite_accepted' ELSE 'squad_invite_rejected' END,
      'squad', NEW.squad_id, jsonb_build_object('squad_name', v_name));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER squad_invites_notify AFTER INSERT OR UPDATE ON public.squad_invites
FOR EACH ROW EXECUTE FUNCTION public.notify_squad_invite();

CREATE OR REPLACE FUNCTION public.notify_squad_join_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner UUID; v_name TEXT;
BEGIN
  SELECT owner_id, name INTO v_owner, v_name FROM public.squads WHERE id = NEW.squad_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(v_owner, NEW.user_id, 'squad_join_request', 'squad', NEW.squad_id,
      jsonb_build_object('squad_name', v_name, 'request_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO public.squad_members (squad_id, user_id, role) VALUES (NEW.squad_id, NEW.user_id, 'member')
      ON CONFLICT DO NOTHING;
    END IF;
    PERFORM public.create_notification(NEW.user_id, v_owner,
      CASE WHEN NEW.status='accepted' THEN 'squad_join_accepted' ELSE 'squad_join_rejected' END,
      'squad', NEW.squad_id, jsonb_build_object('squad_name', v_name));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER squad_join_requests_notify AFTER INSERT OR UPDATE ON public.squad_join_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_squad_join_request();
