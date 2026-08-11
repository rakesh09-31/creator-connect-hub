-- Repair the original direct-message lookup after the conversation model
-- gained squad conversations.  This continues to use the existing four
-- messaging tables and preserves every stored message.
--
-- The transaction-scoped lock serializes two simultaneous first messages for
-- the same pair, so the existing get-or-create path cannot create duplicates.
CREATE OR REPLACE FUNCTION public.get_or_create_dm(_other uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_me uuid := auth.uid();
  v_conv uuid;
  v_pair_key text;
BEGIN
  IF v_me IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF _other IS NULL OR _other = v_me THEN
    RAISE EXCEPTION 'invalid recipient';
  END IF;

  v_pair_key := LEAST(v_me::text, _other::text) || ':' || GREATEST(v_me::text, _other::text);
  PERFORM pg_advisory_xact_lock(hashtext(v_pair_key));

  SELECT c.id
    INTO v_conv
    FROM public.conversations AS c
    JOIN public.conversation_members AS mine
      ON mine.conversation_id = c.id AND mine.user_id = v_me
    JOIN public.conversation_members AS other
      ON other.conversation_id = c.id AND other.user_id = _other
   WHERE c.is_group = false
     AND c.type = 'direct'
     AND NOT EXISTS (
       SELECT 1
       FROM public.conversation_members AS extra
       WHERE extra.conversation_id = c.id
         AND extra.user_id NOT IN (v_me, _other)
     )
   ORDER BY c.created_at ASC
   LIMIT 1;

  IF v_conv IS NOT NULL THEN
    RETURN v_conv;
  END IF;

  INSERT INTO public.conversations (is_group, type, created_by)
  VALUES (false, 'direct', v_me)
  RETURNING id INTO v_conv;

  INSERT INTO public.conversation_members (conversation_id, user_id)
  VALUES (v_conv, v_me), (v_conv, _other);

  RETURN v_conv;
END;
$$;

ALTER FUNCTION public.get_or_create_dm(uuid) OWNER TO postgres;
REVOKE ALL ON FUNCTION public.get_or_create_dm(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_or_create_dm(uuid) TO authenticated;
