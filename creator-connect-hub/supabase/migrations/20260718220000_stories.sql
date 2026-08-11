-- Instagram-style stories: isolated media bucket, minimal relational data,
-- and owner-safe archive/view policies.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories', 'stories', true, 104857600,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Story media is publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');
CREATE POLICY "Users upload their own story media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users update their own story media" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users delete their own story media" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  thumbnail_url text,
  caption text,
  visibility text NOT NULL DEFAULT 'public' CHECK (visibility IN ('public', 'followers')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  deleted_at timestamptz
);
CREATE INDEX stories_active_user_idx ON public.stories (user_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE public.story_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (story_id, viewer_id)
);
CREATE INDEX story_views_story_idx ON public.story_views (story_id, viewed_at DESC);

CREATE TABLE public.story_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL CHECK (char_length(emoji) <= 16),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_story_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER set_story_updated_at BEFORE UPDATE ON public.stories
  FOR EACH ROW EXECUTE FUNCTION public.set_story_updated_at();

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories, public.story_views, public.story_reactions TO authenticated;

-- Active public stories are visible to all. Followers-only stories are
-- additionally protected at the database layer; owners can always access
-- their expired records as a private archive.
CREATE POLICY "Stories respect visibility and archive" ON public.stories FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR (deleted_at IS NULL AND expires_at > now() AND (
      visibility = 'public' OR EXISTS (
        SELECT 1 FROM public.follows f
        WHERE f.follower_id = auth.uid() AND f.following_id = stories.user_id
      )
    ))
  );
CREATE POLICY "Users create own stories" ON public.stories FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND expires_at <= now() + interval '24 hours 5 minutes');
CREATE POLICY "Users manage own stories" ON public.stories FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own stories" ON public.stories FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Story owners see viewers" ON public.story_views FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid()));
CREATE POLICY "Users record a single view" ON public.story_views FOR INSERT TO authenticated
  WITH CHECK (viewer_id = auth.uid());
CREATE POLICY "Users remove their own views" ON public.story_views FOR DELETE TO authenticated USING (viewer_id = auth.uid());

CREATE POLICY "Users see reactions on their stories" ON public.story_reactions FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid()));
CREATE POLICY "Users send reactions" ON public.story_reactions FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
