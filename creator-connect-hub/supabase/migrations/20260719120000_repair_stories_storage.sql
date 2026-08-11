-- Repairs projects where the Stories migration was recorded but its Storage
-- bucket was removed or was created with stale configuration.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stories', 'stories', true, 104857600,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Files are addressed as {user_id}/{unique-file-name}; these policies ensure
-- authenticated users can only upload, update, or delete their own files.
DROP POLICY IF EXISTS "Story media is publicly readable" ON storage.objects;
DROP POLICY IF EXISTS "Users upload their own story media" ON storage.objects;
DROP POLICY IF EXISTS "Users update their own story media" ON storage.objects;
DROP POLICY IF EXISTS "Users delete their own story media" ON storage.objects;

CREATE POLICY "Story media is publicly readable" ON storage.objects
  FOR SELECT USING (bucket_id = 'stories');
CREATE POLICY "Users upload their own story media" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users update their own story media" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text
  ) WITH CHECK (
    bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text
  );
CREATE POLICY "Users delete their own story media" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'stories' AND (storage.foldername(name))[1] = auth.uid()::text
  );
