-- Conversation RLS helper hardening.
--
-- The helper is called from policies on conversation_members itself, so it must
-- run as the table owner to avoid recursive RLS evaluation.  It deliberately
-- only answers about the current authenticated principal; callers cannot use
-- the _user argument to probe another user's membership.
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT _conv IS NOT NULL
     AND _user = auth.uid()
     AND EXISTS (
       SELECT 1
       FROM public.conversation_members AS member
       WHERE member.conversation_id = _conv
         AND member.user_id = auth.uid()
     );
$$;

-- Supabase migrations are run by postgres.  Make the definer explicit so the
-- helper retains a role that owns the protected tables and therefore does not
-- recurse through their RLS policies.
ALTER FUNCTION public.is_conversation_member(uuid, uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO anon;

-- Every mutation of existing conversation data must retain membership.  The
-- original SELECT/INSERT checks remain in place; these replacements close the
-- UPDATE/DELETE paths as well.
DROP POLICY IF EXISTS "Members can update conversation" ON public.conversations;
CREATE POLICY "Members can update conversation" ON public.conversations
  FOR UPDATE TO authenticated
  USING (public.is_conversation_member(id, auth.uid()))
  WITH CHECK (public.is_conversation_member(id, auth.uid()));

DROP POLICY IF EXISTS "Users can update own membership" ON public.conversation_members;
CREATE POLICY "Users can update own membership" ON public.conversation_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users can leave conversation" ON public.conversation_members;
CREATE POLICY "Users can leave conversation" ON public.conversation_members
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Senders can update own messages" ON public.messages;
CREATE POLICY "Senders can update own messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()))
  WITH CHECK (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Senders can delete own messages" ON public.messages;
CREATE POLICY "Senders can delete own messages" ON public.messages
  FOR DELETE TO authenticated
  USING (sender_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users delete own reactions" ON public.message_reactions;
CREATE POLICY "Users delete own reactions" ON public.message_reactions
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.messages AS message
      WHERE message.id = message_id
        AND public.is_conversation_member(message.conversation_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users manage own typing" ON public.typing_status;
CREATE POLICY "Users manage own typing" ON public.typing_status
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users update own typing" ON public.typing_status;
CREATE POLICY "Users update own typing" ON public.typing_status
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS "Users delete own typing" ON public.typing_status;
CREATE POLICY "Users delete own typing" ON public.typing_status
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() AND public.is_conversation_member(conversation_id, auth.uid()));
