-- ============================================================================
-- Idempotent storage setup for Omnicraft.
-- Creates every bucket the app needs with correct visibility, size limits,
-- allowed MIME types, and RLS policies. Safe to run repeatedly.
-- ============================================================================

-- Drop any legacy policies that reference the old generic "media" bucket so
-- they never leak access to the new per-feature buckets.
DROP POLICY IF EXISTS "media public read" ON storage.objects;
DROP POLICY IF EXISTS "media user upload" ON storage.objects;
DROP POLICY IF EXISTS "media user update" ON storage.objects;
DROP POLICY IF EXISTS "media user delete" ON storage.objects;

-- ---------------------------------------------------------------------------
-- PUBLIC buckets (everyone can view, authenticated users upload own files)
-- ---------------------------------------------------------------------------

-- profile-images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images', 'profile-images', true, 5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "profile-images public read" ON storage.objects;
DROP POLICY IF EXISTS "profile-images user upload" ON storage.objects;
DROP POLICY IF EXISTS "profile-images user update" ON storage.objects;
DROP POLICY IF EXISTS "profile-images user delete" ON storage.objects;
CREATE POLICY "profile-images public read" ON storage.objects FOR SELECT USING (bucket_id = 'profile-images');
CREATE POLICY "profile-images user upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'profile-images' AND (storage.foldername(name))[1] = 'users' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "profile-images user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'profile-images' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "profile-images user delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'profile-images' AND (storage.foldername(name))[2] = auth.uid()::text
);

-- cover-images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cover-images', 'cover-images', true, 10485760,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "cover-images public read" ON storage.objects;
DROP POLICY IF EXISTS "cover-images user upload" ON storage.objects;
DROP POLICY IF EXISTS "cover-images user update" ON storage.objects;
DROP POLICY IF EXISTS "cover-images user delete" ON storage.objects;
CREATE POLICY "cover-images public read" ON storage.objects FOR SELECT USING (bucket_id = 'cover-images');
CREATE POLICY "cover-images user upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'cover-images' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "cover-images user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'cover-images' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'cover-images' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "cover-images user delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'cover-images' AND (storage.foldername(name))[2] = auth.uid()::text
);

-- posts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'posts', 'posts', true, 104857600,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','video/mp4','video/quicktime','video/webm','video/x-msvideo']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "posts public read" ON storage.objects;
DROP POLICY IF EXISTS "posts user upload" ON storage.objects;
DROP POLICY IF EXISTS "posts user update" ON storage.objects;
DROP POLICY IF EXISTS "posts user delete" ON storage.objects;
CREATE POLICY "posts public read" ON storage.objects FOR SELECT USING (bucket_id = 'posts');
CREATE POLICY "posts user upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'posts' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "posts user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'posts' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "posts user delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'posts' AND (storage.foldername(name))[2] = auth.uid()::text
);

-- stories
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories', 'stories', true, 104857600,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','video/mp4','video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Story media is publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users upload their own story media" ON storage.objects;
DROP POLICY IF EXISTS "Users update their own story media" ON storage.objects;
DROP POLICY IF EXISTS "Users delete their own story media" ON storage.objects;
CREATE POLICY "Story media is publicly readable" ON storage.objects FOR SELECT USING (bucket_id = 'stories');
CREATE POLICY "Users upload their own story media" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'stories' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "Users update their own story media" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'stories' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'stories' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "Users delete their own story media" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'stories' AND (storage.foldername(name))[2] = auth.uid()::text
);

-- portfolio
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio', 'portfolio', true, 104857600,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic','video/mp4','video/quicktime','video/webm','video/x-msvideo']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "portfolio public read" ON storage.objects;
DROP POLICY IF EXISTS "portfolio user upload" ON storage.objects;
DROP POLICY IF EXISTS "portfolio user update" ON storage.objects;
DROP POLICY IF EXISTS "portfolio user delete" ON storage.objects;
CREATE POLICY "portfolio public read" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "portfolio user upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'portfolio' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "portfolio user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'portfolio' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'portfolio' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "portfolio user delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'portfolio' AND (storage.foldername(name))[2] = auth.uid()::text
);

-- thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails', 'thumbnails', true, 5242880,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "thumbnails public read" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails user upload" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails user update" ON storage.objects;
DROP POLICY IF EXISTS "thumbnails user delete" ON storage.objects;
CREATE POLICY "thumbnails public read" ON storage.objects FOR SELECT USING (bucket_id = 'thumbnails');
CREATE POLICY "thumbnails user upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'thumbnails' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "thumbnails user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'thumbnails' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'thumbnails' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "thumbnails user delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'thumbnails' AND (storage.foldername(name))[2] = auth.uid()::text
);

-- ---------------------------------------------------------------------------
-- PRIVATE buckets (owner-only access)
-- ---------------------------------------------------------------------------

-- resumes (owner only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resumes', 'resumes', false, 10485760,
  ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "resumes own read" ON storage.objects;
DROP POLICY IF EXISTS "resumes own upload" ON storage.objects;
DROP POLICY IF EXISTS "resumes own update" ON storage.objects;
DROP POLICY IF EXISTS "resumes own delete" ON storage.objects;
CREATE POLICY "resumes own read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'resumes' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "resumes own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'resumes' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "resumes own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'resumes' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "resumes own delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'resumes' AND (storage.foldername(name))[2] = auth.uid()::text
);

-- documents (owner only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents', 'documents', false, 52428800,
  ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/plain','application/vnd.ms-powerpoint','application/vnd.openxmlformats-officedocument.presentationml.presentation','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "documents own read" ON storage.objects;
DROP POLICY IF EXISTS "documents own upload" ON storage.objects;
DROP POLICY IF EXISTS "documents own update" ON storage.objects;
DROP POLICY IF EXISTS "documents own delete" ON storage.objects;
CREATE POLICY "documents own read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'documents' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "documents own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'documents' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "documents own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'documents' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "documents own delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'documents' AND (storage.foldername(name))[2] = auth.uid()::text
);

-- verification (owner + admins)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification', 'verification', false, 52428800,
  ARRAY['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/jpg','image/png','image/webp','image/heic']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "verification own read" ON storage.objects;
DROP POLICY IF EXISTS "verification own upload" ON storage.objects;
DROP POLICY IF EXISTS "verification own update" ON storage.objects;
DROP POLICY IF EXISTS "verification own delete" ON storage.objects;
DROP POLICY IF EXISTS "verification admin read" ON storage.objects;
CREATE POLICY "verification own read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'verification' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "verification own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'verification' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "verification own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'verification' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'verification' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "verification own delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'verification' AND (storage.foldername(name))[2] = auth.uid()::text
);
-- Admins can read all verification documents.
CREATE POLICY "verification admin read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'verification'
  AND EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin')
);

-- chat-media (public bucket so uploaded attachments render via public URLs;
-- each user can only upload/update/delete their own files)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-media', 'chat-media', true, 52428800,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif','image/heic','video/mp4','video/quicktime','video/webm','video/x-msvideo','application/pdf','application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "chat-media public read" ON storage.objects;
DROP POLICY IF EXISTS "chat-media user upload" ON storage.objects;
DROP POLICY IF EXISTS "chat-media user update" ON storage.objects;
DROP POLICY IF EXISTS "chat-media user delete" ON storage.objects;
CREATE POLICY "chat-media public read" ON storage.objects FOR SELECT USING (bucket_id = 'chat-media');
CREATE POLICY "chat-media user upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'chat-media' AND (storage.foldername(name))[2] = auth.uid()::text
);
CREATE POLICY "chat-media user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'chat-media' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'chat-media' AND (storage.foldername(name))[2] = auth.uid()::text);
CREATE POLICY "chat-media user delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'chat-media' AND (storage.foldername(name))[2] = auth.uid()::text
);

-- temp-uploads (owner only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'temp-uploads', 'temp-uploads', false, 52428800,
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/heic','video/mp4','video/quicktime','application/pdf','application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "temp-uploads own read" ON storage.objects;
DROP POLICY IF EXISTS "temp-uploads own upload" ON storage.objects;
DROP POLICY IF EXISTS "temp-uploads own update" ON storage.objects;
DROP POLICY IF EXISTS "temp-uploads own delete" ON storage.objects;
CREATE POLICY "temp-uploads own read" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'temp-uploads' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "temp-uploads own upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'temp-uploads' AND (storage.foldername(name))[1] = auth.uid()::text
);
CREATE POLICY "temp-uploads own update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'temp-uploads' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'temp-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "temp-uploads own delete" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'temp-uploads' AND (storage.foldername(name))[1] = auth.uid()::text
);

NOTIFY pgrst, 'reload schema';
