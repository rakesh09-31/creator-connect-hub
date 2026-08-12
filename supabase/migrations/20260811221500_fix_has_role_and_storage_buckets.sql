-- Approved migration: Fix Story storage
-- 2 statements only, as approved.

-- Statement 1: Restore EXECUTE on public.has_role for authenticated users.
-- Required so the Storage RLS policy "Verification readable by owner or admin"
-- (which calls public.has_role(auth.uid(), 'admin')) does not throw 42501.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- Statement 2: Create the missing stories bucket as public.
-- Verified missing: listBuckets() = [], HTTP GET returns NoSuchBucket.
-- ON CONFLICT DO NOTHING ensures idempotency.
INSERT INTO storage.buckets (id, name, public)
VALUES ('stories', 'stories', true)
ON CONFLICT (id) DO NOTHING;
