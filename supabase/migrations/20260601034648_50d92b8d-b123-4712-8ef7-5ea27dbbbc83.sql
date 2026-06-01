
-- 1) Private contacts table for email/phone (self-only)
CREATE TABLE IF NOT EXISTS public.profile_contacts (
  id uuid PRIMARY KEY,
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_contacts TO authenticated;
GRANT ALL ON public.profile_contacts TO service_role;

ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_self_read" ON public.profile_contacts
  FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "contacts_self_insert" ON public.profile_contacts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "contacts_self_update" ON public.profile_contacts
  FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "contacts_self_delete" ON public.profile_contacts
  FOR DELETE TO authenticated USING (auth.uid() = id);

-- 2) Backfill from profiles, then drop the sensitive columns
INSERT INTO public.profile_contacts (id, email, phone)
SELECT id, email, phone FROM public.profiles
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;

-- 3) Update new-user trigger to write contacts to the private table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_username TEXT;
  v_base TEXT;
  v_suffix INT := 0;
BEGIN
  v_base := COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1), 'user');
  v_username := v_base;
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE username = v_username) LOOP
    v_suffix := v_suffix + 1;
    v_username := v_base || v_suffix::text;
  END LOOP;

  INSERT INTO public.profiles (id, username, full_name)
  VALUES (NEW.id, v_username, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.profile_contacts (id, email, phone)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$function$;

-- 4) Restrict profiles SELECT to signed-in users only (no more anon enumeration)
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_auth_read" ON public.profiles
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

-- 5) Lock down has_role: only invoked from RLS / SECURITY DEFINER contexts
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO service_role;

-- 6) Storage: drop the broad listing policy on the media bucket.
-- Public URLs continue to work because the bucket is marked public; only
-- enumeration of every uploaded file is removed.
DROP POLICY IF EXISTS "media public read" ON storage.objects;
