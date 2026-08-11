
-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group BOOLEAN NOT NULL DEFAULT false,
  title TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Members
CREATE TABLE public.conversation_members (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  muted BOOLEAN NOT NULL DEFAULT false,
  pinned BOOLEAN NOT NULL DEFAULT false,
  archived BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;
GRANT ALL ON public.conversation_members TO service_role;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;

-- Helper: is user a member?
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv UUID, _user UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = _conv AND user_id = _user);
$$;

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT,
  attachment_url TEXT,
  attachment_type TEXT,
  reply_to UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  edited BOOLEAN NOT NULL DEFAULT false,
  deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.messages (conversation_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Reactions
CREATE TABLE public.message_reactions (
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Typing
CREATE TABLE public.typing_status (
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.typing_status TO authenticated;
GRANT ALL ON public.typing_status TO service_role;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;

-- Policies: conversations
CREATE POLICY "Members can view conversation" ON public.conversations
  FOR SELECT TO authenticated
  USING (public.is_conversation_member(id, auth.uid()));
CREATE POLICY "Anyone can create conversation" ON public.conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Members can update conversation" ON public.conversations
  FOR UPDATE TO authenticated USING (public.is_conversation_member(id, auth.uid()));

-- Policies: conversation_members
CREATE POLICY "Members can view members of their conversations" ON public.conversation_members
  FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users can add themselves to conversation" ON public.conversation_members
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users can update own membership" ON public.conversation_members
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can leave conversation" ON public.conversation_members
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Policies: messages
CREATE POLICY "Members can view messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Members can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Senders can update own messages" ON public.messages
  FOR UPDATE TO authenticated USING (sender_id = auth.uid());
CREATE POLICY "Senders can delete own messages" ON public.messages
  FOR DELETE TO authenticated USING (sender_id = auth.uid());

-- Policies: reactions
CREATE POLICY "Members can view reactions" ON public.message_reactions
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_conversation_member(m.conversation_id, auth.uid()))
  );
CREATE POLICY "Users manage own reactions" ON public.message_reactions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own reactions" ON public.message_reactions
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Policies: typing
CREATE POLICY "Members can view typing" ON public.typing_status
  FOR SELECT TO authenticated USING (public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users manage own typing" ON public.typing_status
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own typing" ON public.typing_status
  FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users delete own typing" ON public.typing_status
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- Triggers: bump conversation last_message_at, notify recipients
CREATE OR REPLACE FUNCTION public.on_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r RECORD; v_preview TEXT;
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at, updated_at = now() WHERE id = NEW.conversation_id;
  v_preview := LEFT(COALESCE(NEW.body, CASE WHEN NEW.attachment_type IS NOT NULL THEN '[' || NEW.attachment_type || ']' ELSE '' END), 140);
  FOR r IN SELECT user_id FROM public.conversation_members WHERE conversation_id = NEW.conversation_id AND user_id <> NEW.sender_id LOOP
    PERFORM public.create_notification(r.user_id, NEW.sender_id, 'message', 'conversation', NEW.conversation_id,
      jsonb_build_object('preview', v_preview, 'message_id', NEW.id));
  END LOOP;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.on_new_message();

-- updated_at trigger for conversations
CREATE TRIGGER trg_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;

-- Helper RPC: get-or-create DM between two users
CREATE OR REPLACE FUNCTION public.get_or_create_dm(_other UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_me UUID := auth.uid(); v_conv UUID;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _other IS NULL OR _other = v_me THEN RAISE EXCEPTION 'invalid recipient'; END IF;
  SELECT c.id INTO v_conv
    FROM public.conversations c
    JOIN public.conversation_members m1 ON m1.conversation_id = c.id AND m1.user_id = v_me
    JOIN public.conversation_members m2 ON m2.conversation_id = c.id AND m2.user_id = _other
   WHERE c.is_group = false
   LIMIT 1;
  IF v_conv IS NOT NULL THEN RETURN v_conv; END IF;
  INSERT INTO public.conversations (is_group, created_by) VALUES (false, v_me) RETURNING id INTO v_conv;
  INSERT INTO public.conversation_members (conversation_id, user_id) VALUES (v_conv, v_me), (v_conv, _other);
  RETURN v_conv;
END $$;
GRANT EXECUTE ON FUNCTION public.get_or_create_dm(UUID) TO authenticated;
