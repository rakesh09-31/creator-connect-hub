CREATE TABLE public.squad_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message TEXT,
  media_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_messages TO authenticated;
GRANT ALL ON public.squad_messages TO service_role;
ALTER TABLE public.squad_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY squad_messages_visible ON public.squad_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.squad_members sm
      WHERE sm.squad_id = squad_messages.squad_id AND sm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.squads s
      WHERE s.id = squad_messages.squad_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY squad_messages_insert ON public.squad_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND (
      EXISTS (
        SELECT 1
        FROM public.squad_members sm
        WHERE sm.squad_id = squad_messages.squad_id AND sm.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.squads s
        WHERE s.id = squad_messages.squad_id AND s.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY squad_messages_update ON public.squad_messages FOR UPDATE TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.squad_members sm
      WHERE sm.squad_id = squad_messages.squad_id AND sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1
      FROM public.squads s
      WHERE s.id = squad_messages.squad_id AND s.owner_id = auth.uid()
    )
  );

CREATE POLICY squad_messages_delete ON public.squad_messages FOR DELETE TO authenticated
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.squad_members sm
      WHERE sm.squad_id = squad_messages.squad_id AND sm.user_id = auth.uid() AND sm.role IN ('owner', 'admin')
    )
    OR EXISTS (
      SELECT 1
      FROM public.squads s
      WHERE s.id = squad_messages.squad_id AND s.owner_id = auth.uid()
    )
  );

CREATE TRIGGER squad_messages_touch BEFORE UPDATE ON public.squad_messages
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
