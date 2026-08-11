-- Stories are an independent feature. They never reference, populate, or
-- inherit visibility from posts or portfolio records.
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS bucket_name text NOT NULL DEFAULT 'stories',
  ADD COLUMN IF NOT EXISTS is_highlight boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0 CHECK (view_count >= 0),
  ADD COLUMN IF NOT EXISTS reply_count integer NOT NULL DEFAULT 0 CHECK (reply_count >= 0),
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

UPDATE public.stories
SET bucket_name = 'stories', created_by = COALESCE(created_by, user_id)
WHERE bucket_name IS DISTINCT FROM 'stories' OR created_by IS NULL;

ALTER TABLE public.stories
  ALTER COLUMN created_by SET NOT NULL,
  DROP CONSTRAINT IF EXISTS stories_bucket_name_is_stories,
  ADD CONSTRAINT stories_bucket_name_is_stories CHECK (bucket_name = 'stories');

CREATE INDEX IF NOT EXISTS stories_visible_idx
  ON public.stories (user_id, expires_at DESC)
  WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS stories_highlights_idx
  ON public.stories (user_id, created_at DESC)
  WHERE is_highlight = true AND deleted_at IS NULL;

-- Keep the denormalized count accurate without involving the posts system.
CREATE OR REPLACE FUNCTION public.refresh_story_view_count()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE affected_story_id uuid;
BEGIN
  affected_story_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.story_id ELSE NEW.story_id END;
  UPDATE public.stories
  SET view_count = (SELECT count(*) FROM public.story_views WHERE story_id = affected_story_id)
  WHERE id = affected_story_id;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;
DROP TRIGGER IF EXISTS story_views_refresh_count ON public.story_views;
CREATE TRIGGER story_views_refresh_count
AFTER INSERT OR DELETE ON public.story_views
FOR EACH ROW EXECUTE FUNCTION public.refresh_story_view_count();

-- RLS is the source of truth for story visibility. It handles public stories,
-- followers-only stories, and blocks in either direction.
CREATE OR REPLACE FUNCTION public.story_users_are_blocked(_viewer_id uuid, _owner_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.blocked_users b
    WHERE (b.blocker_id = _owner_id AND b.blocked_id = _viewer_id)
       OR (b.blocker_id = _viewer_id AND b.blocked_id = _owner_id)
  );
$$;

DROP POLICY IF EXISTS "Stories respect visibility and archive" ON public.stories;
CREATE POLICY "Stories respect visibility and blocks" ON public.stories FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      deleted_at IS NULL
      AND (expires_at > now() OR is_highlight = true)
      AND NOT public.story_users_are_blocked(auth.uid(), stories.user_id)
      AND (
        visibility = 'public'
        OR EXISTS (
          SELECT 1 FROM public.follows f
          WHERE f.follower_id = auth.uid() AND f.following_id = stories.user_id
        )
      )
    )
  );

-- Required after ALTER TABLE so PostgREST sees the independent Stories fields.
NOTIFY pgrst, 'reload schema';
