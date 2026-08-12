-- Migration: Add post_views table for video view tracking and video_posts view for unified video discovery

-- 1. Create post_views table
CREATE TABLE IF NOT EXISTS public.post_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(post_id, viewer_id)
);

-- Enable RLS on post_views
ALTER TABLE public.post_views ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "post_views_insert_self" ON public.post_views;
DROP POLICY IF EXISTS "post_views_read" ON public.post_views;

-- Create policies
CREATE POLICY "post_views_insert_self" ON public.post_views
  FOR INSERT TO authenticated
  WITH CHECK (viewer_id = auth.uid());

CREATE POLICY "post_views_read" ON public.post_views
  FOR SELECT TO authenticated
  USING (true);

-- Grant privileges
GRANT SELECT, INSERT ON public.post_views TO authenticated;
GRANT ALL ON public.post_views TO service_role;

-- Index for performance
CREATE INDEX IF NOT EXISTS post_views_post_id_idx ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS post_views_viewer_id_idx ON public.post_views(viewer_id);

-- 2. Create video_posts read-only view for unified video discovery
CREATE OR REPLACE VIEW public.video_posts AS
SELECT p.id, p.author_id, p.caption, p.media_url, p.thumbnail_url,
       p.post_type, p.created_at,
       pr.username, pr.full_name, pr.avatar_url, pr.role
FROM public.posts p
JOIN public.profiles pr ON pr.id = p.author_id
WHERE p.post_type IN ('video', 'reel')
  AND p.media_url IS NOT NULL;

-- Grant select on the view
GRANT SELECT ON public.video_posts TO authenticated;
GRANT SELECT ON public.video_posts TO anon;
