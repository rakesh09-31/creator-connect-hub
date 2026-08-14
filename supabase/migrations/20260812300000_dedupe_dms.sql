-- 1. Deduplicate existing direct messages safely
DO $$
DECLARE
  dup_pair RECORD;
  canonical UUID;
BEGIN
  -- Find pairs of users who have more than 1 direct conversation
  FOR dup_pair IN
    WITH pair_convs AS (
      SELECT
        c.id AS conv_id,
        c.created_at,
        LEAST(m1.user_id, m2.user_id) AS u1,
        GREATEST(m1.user_id, m2.user_id) AS u2
      FROM public.conversations c
      JOIN public.conversation_members m1 ON m1.conversation_id = c.id
      JOIN public.conversation_members m2 ON m2.conversation_id = c.id AND m1.user_id < m2.user_id
      WHERE c.is_group = false
    ),
    grouped_pairs AS (
      SELECT u1, u2, array_agg(conv_id ORDER BY created_at ASC) as convs
      FROM pair_convs
      GROUP BY u1, u2
      HAVING count(*) > 1
    )
    SELECT * FROM grouped_pairs
  LOOP
    -- The oldest conversation becomes the canonical one
    canonical := dup_pair.convs[1];
    
    -- Migrate all messages from the duplicates to the canonical conversation
    UPDATE public.messages
    SET conversation_id = canonical
    WHERE conversation_id = ANY(dup_pair.convs[2:]);
    
    -- Migrate typing statuses (though they are transient, it's safer to avoid orphan rows)
    UPDATE public.typing_status
    SET conversation_id = canonical
    WHERE conversation_id = ANY(dup_pair.convs[2:])
    AND NOT EXISTS (
      SELECT 1 FROM public.typing_status t2 
      WHERE t2.conversation_id = canonical AND t2.user_id = public.typing_status.user_id
    );
    DELETE FROM public.typing_status WHERE conversation_id = ANY(dup_pair.convs[2:]);

    -- Delete the duplicate conversation records.
    -- Because conversation_members has ON DELETE CASCADE on conversation_id,
    -- the duplicate members will be removed automatically.
    DELETE FROM public.conversations
    WHERE id = ANY(dup_pair.convs[2:]);
  END LOOP;
END $$;


-- 2. Secure get_or_create_dm against race conditions
CREATE OR REPLACE FUNCTION public.get_or_create_dm(_other UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE 
  v_me UUID := auth.uid(); 
  v_conv UUID;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _other IS NULL OR _other = v_me THEN RAISE EXCEPTION 'invalid recipient'; END IF;

  -- Acquire a session-level advisory lock using a composite hash of the two user IDs.
  -- This forces concurrent requests for the SAME user pair to queue up and execute sequentially.
  PERFORM pg_advisory_xact_lock(
    hashtext(least(v_me::text, _other::text)),
    hashtext(greatest(v_me::text, _other::text))
  );

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
