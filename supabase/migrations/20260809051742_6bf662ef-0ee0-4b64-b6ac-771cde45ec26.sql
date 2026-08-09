
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE public.portfolios ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- ---------------------------------------------------------------- squad chat
CREATE OR REPLACE FUNCTION public.get_or_create_squad_conversation(_squad_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_conv uuid;
  v_owner uuid;
  v_name text;
  v_me uuid := auth.uid();
BEGIN
  SELECT conversation_id, owner_id, name INTO v_conv, v_owner, v_name
    FROM public.squads WHERE id = _squad_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'squad not found'; END IF;

  -- only squad members / owner may open the squad chat
  IF v_me IS DISTINCT FROM v_owner
     AND NOT EXISTS (SELECT 1 FROM public.squad_members m
                     WHERE m.squad_id = _squad_id AND m.user_id = v_me)
     AND NOT EXISTS (SELECT 1 FROM public.conversation_members cm
                     WHERE cm.conversation_id = v_conv AND cm.user_id = v_me)
  THEN
    RAISE EXCEPTION 'not a member of this squad';
  END IF;

  IF v_conv IS NULL THEN
    INSERT INTO public.conversations (is_group, title, created_by)
    VALUES (true, v_name, v_owner)
    RETURNING id INTO v_conv;
    UPDATE public.squads SET conversation_id = v_conv WHERE id = _squad_id;
  END IF;

  -- keep membership in sync (owner + every squad member)
  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  VALUES (v_conv, v_owner, 'owner')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  SELECT v_conv, m.user_id, 'member'
    FROM public.squad_members m
   WHERE m.squad_id = _squad_id
  ON CONFLICT DO NOTHING;

  RETURN v_conv;
END $function$;

REVOKE ALL ON FUNCTION public.get_or_create_squad_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_squad_conversation(uuid) TO authenticated, service_role;

-- client joins the squad chat (called by the client after inviting/hiring a squad)
CREATE OR REPLACE FUNCTION public.add_client_to_squad_conversation(_squad_id uuid, _client_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_conv uuid; v_owner uuid; v_name text; v_me uuid := auth.uid();
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT conversation_id, owner_id, name INTO v_conv, v_owner, v_name
    FROM public.squads WHERE id = _squad_id;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'squad not found'; END IF;

  -- the caller must be the client joining, the squad owner, or a squad member
  IF v_me IS DISTINCT FROM _client_id
     AND v_me IS DISTINCT FROM v_owner
     AND NOT EXISTS (SELECT 1 FROM public.squad_members m
                     WHERE m.squad_id = _squad_id AND m.user_id = v_me)
  THEN
    RAISE EXCEPTION 'not allowed';
  END IF;

  IF v_conv IS NULL THEN
    INSERT INTO public.conversations (is_group, title, created_by)
    VALUES (true, v_name, v_owner) RETURNING id INTO v_conv;
    UPDATE public.squads SET conversation_id = v_conv WHERE id = _squad_id;
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES (v_conv, v_owner, 'owner') ON CONFLICT DO NOTHING;
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    SELECT v_conv, m.user_id, 'member' FROM public.squad_members m WHERE m.squad_id = _squad_id
    ON CONFLICT DO NOTHING;
  END IF;

  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  VALUES (v_conv, _client_id, 'client') ON CONFLICT DO NOTHING;

  RETURN v_conv;
END $function$;

REVOKE ALL ON FUNCTION public.add_client_to_squad_conversation(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.add_client_to_squad_conversation(uuid, uuid) TO authenticated, service_role;

-- keep the squad conversation membership in sync automatically
CREATE OR REPLACE FUNCTION public.sync_squad_conversation_member()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE v_conv uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT conversation_id INTO v_conv FROM public.squads WHERE id = NEW.squad_id;
    IF v_conv IS NOT NULL THEN
      INSERT INTO public.conversation_members (conversation_id, user_id, role)
      VALUES (v_conv, NEW.user_id, 'member') ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
  ELSE
    SELECT conversation_id INTO v_conv FROM public.squads WHERE id = OLD.squad_id;
    IF v_conv IS NOT NULL THEN
      DELETE FROM public.conversation_members
       WHERE conversation_id = v_conv AND user_id = OLD.user_id
         AND user_id <> (SELECT owner_id FROM public.squads WHERE id = OLD.squad_id);
    END IF;
    RETURN OLD;
  END IF;
END $function$;

DROP TRIGGER IF EXISTS squad_members_sync_conversation_ins ON public.squad_members;
CREATE TRIGGER squad_members_sync_conversation_ins
AFTER INSERT ON public.squad_members
FOR EACH ROW EXECUTE FUNCTION public.sync_squad_conversation_member();

DROP TRIGGER IF EXISTS squad_members_sync_conversation_del ON public.squad_members;
CREATE TRIGGER squad_members_sync_conversation_del
AFTER DELETE ON public.squad_members
FOR EACH ROW EXECUTE FUNCTION public.sync_squad_conversation_member();
