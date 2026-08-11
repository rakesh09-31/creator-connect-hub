-- Restore the helper required by conversation RLS. A prior hardening migration
-- revoked EXECUTE from authenticated while policies continued to call it.
-- SECURITY DEFINER avoids recursively evaluating conversation_members RLS.
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv uuid, _user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT _user = auth.uid()
     AND EXISTS (
       SELECT 1
       FROM public.conversation_members AS member
       WHERE member.conversation_id = _conv
         AND member.user_id = auth.uid()
     );
$$;

-- Do not leave implicit execution available to every database role. Anonymous
-- callers receive false because auth.uid() is null, but the explicit grant
-- keeps policy evaluation and Supabase's role model consistent.
REVOKE ALL ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO anon;
