-- Refactor conversation RLS around the non-recursive SECURITY DEFINER helper.
-- The helper in the preceding migration is owned by postgres, so its single
-- membership EXISTS query bypasses this table's RLS.  All client-facing table
-- access below remains subject to RLS and requires a positive membership test.
ALTER FUNCTION public.get_or_create_dm(uuid) SET search_path = '';
ALTER FUNCTION public.on_new_message() SET search_path = '';

DROP POLICY IF EXISTS "Members can view conversation" ON public.conversations;
DROP POLICY IF EXISTS "Anyone can create conversation" ON public.conversations;
DROP POLICY IF EXISTS "Members can update conversation" ON public.conversations;
DROP POLICY IF EXISTS "Members can delete conversation" ON public.conversations;
CREATE POLICY "Members can view conversation" ON public.conversations FOR SELECT TO authenticated
  USING (public.is_conversation_member(id, auth.uid()));
CREATE POLICY "Anyone can create conversation" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());
CREATE POLICY "Members can update conversation" ON public.conversations FOR UPDATE TO authenticated
  USING (public.is_conversation_member(id, auth.uid()))
  WITH CHECK (public.is_conversation_member(id, auth.uid()));
CREATE POLICY "Members can delete conversation" ON public.conversations FOR DELETE TO authenticated
  USING (created_by = auth.uid() AND public.is_conversation_member(id, auth.uid()));

DROP POLICY IF EXISTS "Members can view members of their conversations" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can add themselves to conversation" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can update own membership" ON public.conversation_members;
DROP POLICY IF EXISTS "Users can leave conversation" ON public.conversation_members;
CREATE POLICY "Members can view members of their conversations" ON public.conversation_members FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));
-- Initial membership is created atomically by the authenticated
-- SECURITY DEFINER get_or_create_dm RPC. There is intentionally no direct
-- client INSERT policy: a user must not be able to join an arbitrary chat.
CREATE POLICY "Users can update own membership" ON public.conversation_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users can leave conversation" ON public.conversation_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Members can view messages" ON public.messages;
DROP POLICY IF EXISTS "Members can send messages" ON public.messages;
DROP POLICY IF EXISTS "Senders can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Senders can delete own messages" ON public.messages;
CREATE POLICY "Members can view messages" ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Senders can update own messages" ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()))
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Senders can delete own messages" ON public.messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Members can view reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users manage own reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Members add own reactions" ON public.message_reactions;
DROP POLICY IF EXISTS "Users delete own reactions" ON public.message_reactions;
CREATE POLICY "Members can view reactions" ON public.message_reactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.messages AS message WHERE message.id = message_id
    AND public.is_conversation_member(message.conversation_id, auth.uid())));
CREATE POLICY "Members add own reactions" ON public.message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.messages AS message WHERE message.id = message_id
    AND public.is_conversation_member(message.conversation_id, auth.uid())));
CREATE POLICY "Users delete own reactions" ON public.message_reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.messages AS message WHERE message.id = message_id
    AND public.is_conversation_member(message.conversation_id, auth.uid())));

DROP POLICY IF EXISTS "Members can view typing" ON public.typing_status;
DROP POLICY IF EXISTS "Users manage own typing" ON public.typing_status;
DROP POLICY IF EXISTS "Users update own typing" ON public.typing_status;
DROP POLICY IF EXISTS "Users delete own typing" ON public.typing_status;
CREATE POLICY "Members can view typing" ON public.typing_status FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users manage own typing" ON public.typing_status FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users update own typing" ON public.typing_status FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users delete own typing" ON public.typing_status FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
