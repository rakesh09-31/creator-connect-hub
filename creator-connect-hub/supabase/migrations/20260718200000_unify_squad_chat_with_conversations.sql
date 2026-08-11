-- Use the shared conversations/messages model for squad chat.
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'direct',
  ADD COLUMN IF NOT EXISTS squad_id uuid REFERENCES public.squads(id) ON DELETE CASCADE;

ALTER TABLE public.conversations
  DROP CONSTRAINT IF EXISTS conversations_type_squad_id_check;
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_type_squad_id_check CHECK (
    (type = 'direct' AND squad_id IS NULL)
    OR (type = 'squad' AND squad_id IS NOT NULL)
  );
CREATE UNIQUE INDEX IF NOT EXISTS conversations_one_squad_conversation_idx
  ON public.conversations (squad_id) WHERE type = 'squad';

-- Client-created conversations are DMs only. Squad conversations are created
-- by the owner-scoped functions/triggers below.
DROP POLICY IF EXISTS "Anyone can create conversation" ON public.conversations;
CREATE POLICY "Anyone can create conversation" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND type = 'direct' AND squad_id IS NULL);
DROP POLICY IF EXISTS "Members can delete conversation" ON public.conversations;
CREATE POLICY "Members can delete conversation" ON public.conversations FOR DELETE TO authenticated
  USING (type = 'direct' AND created_by = auth.uid() AND public.is_conversation_member(id, auth.uid()));

CREATE OR REPLACE FUNCTION public.prevent_conversation_scope_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.type IS DISTINCT FROM OLD.type
     OR NEW.squad_id IS DISTINCT FROM OLD.squad_id
     OR NEW.is_group IS DISTINCT FROM OLD.is_group THEN
    RAISE EXCEPTION 'conversation type, squad, and group status cannot be changed';
  END IF;
  RETURN NEW;
END;
$$;
ALTER FUNCTION public.prevent_conversation_scope_change() OWNER TO postgres;
DROP TRIGGER IF EXISTS trg_prevent_conversation_scope_change ON public.conversations;
CREATE TRIGGER trg_prevent_conversation_scope_change
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.prevent_conversation_scope_change();

CREATE OR REPLACE FUNCTION public.sync_squad_conversation_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_squad_id uuid := COALESCE(NEW.squad_id, OLD.squad_id);
  v_user_id uuid := COALESCE(NEW.user_id, OLD.user_id);
  v_conversation_id uuid;
BEGIN
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE type = 'squad' AND squad_id = v_squad_id;

  -- A squad created before this migration is backfilled below. For a newly
  -- created squad, its conversation exists before membership is inserted.
  IF v_conversation_id IS NULL THEN
    IF TG_OP = 'INSERT' THEN RETURN NEW; END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.conversation_members (conversation_id, user_id, role)
    VALUES (v_conversation_id, v_user_id, COALESCE(NEW.role, 'member'))
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  ELSE
    DELETE FROM public.conversation_members
    WHERE conversation_id = v_conversation_id AND user_id = v_user_id;
  END IF;
  IF TG_OP = 'INSERT' THEN RETURN NEW; END IF;
  RETURN OLD;
END;
$$;
ALTER FUNCTION public.sync_squad_conversation_members() OWNER TO postgres;

CREATE OR REPLACE FUNCTION public.create_squad_conversation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.conversations (type, squad_id, is_group, title, created_by)
  VALUES ('squad', NEW.id, true, NEW.name, NEW.owner_id)
  ON CONFLICT (squad_id) WHERE type = 'squad' DO NOTHING;
  RETURN NEW;
END;
$$;
ALTER FUNCTION public.create_squad_conversation() OWNER TO postgres;

DROP TRIGGER IF EXISTS trg_create_squad_conversation ON public.squads;
CREATE TRIGGER trg_create_squad_conversation
  AFTER INSERT ON public.squads
  FOR EACH ROW EXECUTE FUNCTION public.create_squad_conversation();
DROP TRIGGER IF EXISTS trg_sync_squad_conversation_members ON public.squad_members;
CREATE TRIGGER trg_sync_squad_conversation_members
  AFTER INSERT OR DELETE ON public.squad_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_squad_conversation_members();

-- Create a conversation for every existing squad and synchronize all current
-- squad members. The partial unique index makes this repeat-safe.
INSERT INTO public.conversations (type, squad_id, is_group, title, created_by)
SELECT 'squad', s.id, true, s.name, s.owner_id
FROM public.squads AS s
ON CONFLICT (squad_id) WHERE type = 'squad' DO NOTHING;

INSERT INTO public.conversation_members (conversation_id, user_id, role)
SELECT c.id, sm.user_id, sm.role
FROM public.conversations AS c
JOIN public.squad_members AS sm ON sm.squad_id = c.squad_id
WHERE c.type = 'squad'
ON CONFLICT (conversation_id, user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.get_or_create_squad_conversation(_squad_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.squad_members
    WHERE squad_id = _squad_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'not a squad member';
  END IF;

  INSERT INTO public.conversations (type, squad_id, is_group, title, created_by)
  SELECT 'squad', s.id, true, s.name, s.owner_id
  FROM public.squads AS s
  WHERE s.id = _squad_id
  ON CONFLICT (squad_id) WHERE type = 'squad' DO NOTHING;

  INSERT INTO public.conversation_members (conversation_id, user_id, role)
  SELECT c.id, sm.user_id, sm.role
  FROM public.conversations AS c
  JOIN public.squad_members AS sm ON sm.squad_id = c.squad_id
  WHERE c.type = 'squad' AND c.squad_id = _squad_id
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  SELECT id INTO v_conversation_id FROM public.conversations
  WHERE type = 'squad' AND squad_id = _squad_id;
  RETURN v_conversation_id;
END;
$$;
ALTER FUNCTION public.get_or_create_squad_conversation(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_or_create_squad_conversation(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_squad_conversation(uuid) TO authenticated;

-- Migrate any legacy squad-message rows when an earlier deployment created
-- those tables. New deployments never create them.
DO $$
BEGIN
  IF to_regclass('public.squad_messages') IS NOT NULL THEN
    INSERT INTO public.messages (id, conversation_id, sender_id, body, attachment_url, created_at)
    SELECT sm.id, c.id, sm.sender_id, sm.message, sm.media_url, sm.created_at
    FROM public.squad_messages AS sm
    JOIN public.conversations AS c ON c.type = 'squad' AND c.squad_id = sm.squad_id
    ON CONFLICT (id) DO NOTHING;
  END IF;
END;
$$;

DO $$
BEGIN
  IF to_regclass('public.squad_message_reactions') IS NOT NULL THEN
    INSERT INTO public.message_reactions (message_id, user_id, emoji, created_at)
    SELECT r.message_id, r.user_id, r.emoji, r.created_at
    FROM public.squad_message_reactions AS r
    JOIN public.messages AS m ON m.id = r.message_id
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

DROP TABLE IF EXISTS public.squad_message_reactions;
DROP TABLE IF EXISTS public.squad_messages;
DROP FUNCTION IF EXISTS public.notify_squad_message();
