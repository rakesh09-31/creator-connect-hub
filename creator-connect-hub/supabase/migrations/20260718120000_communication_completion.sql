-- Communication completion: extend the existing direct-message and squad-message
-- models; no parallel conversation tables are introduced.

CREATE TABLE IF NOT EXISTS public.user_presence (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.user_presence TO authenticated;
GRANT ALL ON public.user_presence TO service_role;
CREATE POLICY "Authenticated users can view presence" ON public.user_presence
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users maintain own presence" ON public.user_presence
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users update own presence" ON public.user_presence
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;

-- Squad messages remain the canonical squad chat. These columns allow the same
-- interaction model as DMs without moving historical squad messages.
ALTER TABLE public.squad_messages
  ADD COLUMN IF NOT EXISTS reply_to uuid REFERENCES public.squad_messages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS attachment_type text;
CREATE INDEX IF NOT EXISTS squad_messages_squad_created_idx ON public.squad_messages (squad_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.squad_message_reactions (
  message_id uuid NOT NULL REFERENCES public.squad_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (message_id, user_id, emoji)
);
ALTER TABLE public.squad_message_reactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.squad_message_reactions TO authenticated;
GRANT ALL ON public.squad_message_reactions TO service_role;
CREATE POLICY "Members view squad reactions" ON public.squad_message_reactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.squad_messages m JOIN public.squad_members sm ON sm.squad_id = m.squad_id WHERE m.id = message_id AND sm.user_id = auth.uid()));
CREATE POLICY "Members add own squad reactions" ON public.squad_message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.squad_messages m JOIN public.squad_members sm ON sm.squad_id = m.squad_id WHERE m.id = message_id AND sm.user_id = auth.uid()));
CREATE POLICY "Users remove own squad reactions" ON public.squad_message_reactions FOR DELETE TO authenticated USING (user_id = auth.uid());
ALTER PUBLICATION supabase_realtime ADD TABLE public.squad_message_reactions;

CREATE OR REPLACE FUNCTION public.notify_squad_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE member_row record; squad_name text; preview text;
BEGIN
  SELECT name INTO squad_name FROM public.squads WHERE id = NEW.squad_id;
  preview := left(coalesce(NEW.message, CASE WHEN NEW.media_url IS NOT NULL THEN '[attachment]' ELSE '' END), 140);
  FOR member_row IN SELECT user_id FROM public.squad_members WHERE squad_id = NEW.squad_id AND user_id <> NEW.sender_id LOOP
    PERFORM public.create_notification(member_row.user_id, NEW.sender_id, 'squad_message', 'squad', NEW.squad_id,
      jsonb_build_object('squad_name', squad_name, 'preview', preview, 'message_id', NEW.id));
  END LOOP;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS trg_notify_squad_message ON public.squad_messages;
CREATE TRIGGER trg_notify_squad_message AFTER INSERT ON public.squad_messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_squad_message();
