-- Phase 2: harden direct messaging interactions using the existing tables.
CREATE TABLE IF NOT EXISTS public.blocked_users (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.blocked_users TO authenticated;
CREATE POLICY "Users manage their blocks" ON public.blocked_users FOR ALL TO authenticated
  USING (blocker_id = auth.uid()) WITH CHECK (blocker_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.conversation_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.conversation_reports ENABLE ROW LEVEL SECURITY;
GRANT INSERT, SELECT ON public.conversation_reports TO authenticated;
CREATE POLICY "Members submit own conversation reports" ON public.conversation_reports FOR INSERT TO authenticated
  WITH CHECK (reporter_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Reporters view own reports" ON public.conversation_reports FOR SELECT TO authenticated USING (reporter_id = auth.uid());

-- Prevent reactions from being placed on messages outside a user's conversations.
DROP POLICY IF EXISTS "Users manage own reactions" ON public.message_reactions;
CREATE POLICY "Members add own reactions" ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.messages m WHERE m.id = message_id AND public.is_conversation_member(m.conversation_id, auth.uid())
  ));

CREATE OR REPLACE FUNCTION public.notify_message_interaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_id uuid; conv_id uuid;
BEGIN
  SELECT sender_id, conversation_id INTO target_id, conv_id FROM public.messages WHERE id = NEW.message_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(target_id, NEW.user_id, 'message_reaction', 'conversation', conv_id,
      jsonb_build_object('message_id', NEW.message_id, 'emoji', NEW.emoji));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_message_reaction ON public.message_reactions;
CREATE TRIGGER trg_notify_message_reaction AFTER INSERT ON public.message_reactions
  FOR EACH ROW EXECUTE FUNCTION public.notify_message_interaction();

CREATE OR REPLACE FUNCTION public.notify_message_reply()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target_id uuid;
BEGIN
  IF NEW.reply_to IS NOT NULL THEN
    SELECT sender_id INTO target_id FROM public.messages WHERE id = NEW.reply_to;
    PERFORM public.create_notification(target_id, NEW.sender_id, 'message_reply', 'conversation', NEW.conversation_id,
      jsonb_build_object('message_id', NEW.id, 'reply_to', NEW.reply_to, 'preview', left(coalesce(NEW.body, ''), 140)));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_message_reply ON public.messages;
CREATE TRIGGER trg_notify_message_reply AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_message_reply();
