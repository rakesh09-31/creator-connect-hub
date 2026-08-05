-- ============ metadata table ============
CREATE TABLE IF NOT EXISTS public.file_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_name text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text,
  feature text NOT NULL,
  is_public boolean NOT NULL DEFAULT false,
  public_url text,
  entity_type text,
  entity_id uuid,
  uploaded_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket_name, file_path)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_uploads TO authenticated;
GRANT ALL ON public.file_uploads TO service_role;

ALTER TABLE public.file_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage their uploads"
  ON public.file_uploads FOR ALL TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Members view shared media metadata"
  ON public.file_uploads FOR SELECT TO authenticated
  USING (is_public = true);

CREATE INDEX IF NOT EXISTS file_uploads_owner_idx ON public.file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS file_uploads_entity_idx ON public.file_uploads(entity_type, entity_id);

CREATE TRIGGER file_uploads_touch BEFORE UPDATE ON public.file_uploads
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ storage policies ============
-- Shared (formerly public) buckets: authenticated read, owner write.
CREATE POLICY "Shared media readable by members"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('profile-images','cover-images','posts','stories','portfolio','thumbnails','creator-assets','client-assets'));

CREATE POLICY "Shared media insert by owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('profile-images','cover-images','posts','stories','portfolio','thumbnails','creator-assets','client-assets')
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Shared media update by owner"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('profile-images','cover-images','posts','stories','portfolio','thumbnails','creator-assets','client-assets')
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('profile-images','cover-images','posts','stories','portfolio','thumbnails','creator-assets','client-assets')
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Shared media delete by owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('profile-images','cover-images','posts','stories','portfolio','thumbnails','creator-assets','client-assets')
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Private owner-only buckets
CREATE POLICY "Private files readable by owner"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('resumes','documents','temp-uploads')
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Private files insert by owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('resumes','documents','temp-uploads')
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Private files update by owner"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('resumes','documents','temp-uploads')
    AND (storage.foldername(name))[2] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id IN ('resumes','documents','temp-uploads')
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Private files delete by owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('resumes','documents','temp-uploads')
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- Verification: owner + admins read, owner writes
CREATE POLICY "Verification readable by owner or admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification'
    AND ((storage.foldername(name))[2] = auth.uid()::text OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Verification insert by owner"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification'
    AND (storage.foldername(name))[1] = 'users'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

CREATE POLICY "Verification update by owner"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'verification' AND (storage.foldername(name))[2] = auth.uid()::text)
  WITH CHECK (bucket_id = 'verification' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Verification delete by owner"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'verification' AND (storage.foldername(name))[2] = auth.uid()::text);

-- Chat media: conversation participants only
CREATE POLICY "Chat media readable by participants"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = 'conversations'
    AND public.is_conversation_member(((storage.foldername(name))[2])::uuid, auth.uid())
  );

CREATE POLICY "Chat media insert by participants"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'chat-media'
    AND (storage.foldername(name))[1] = 'conversations'
    AND public.is_conversation_member(((storage.foldername(name))[2])::uuid, auth.uid())
  );

CREATE POLICY "Chat media delete by uploader"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'chat-media' AND owner = auth.uid());