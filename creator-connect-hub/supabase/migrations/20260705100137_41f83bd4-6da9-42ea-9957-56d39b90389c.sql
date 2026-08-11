
-- 1. Ensure omnicraft_official is verified and admin
UPDATE public.profiles
  SET verified = true,
      full_name = 'Omnicraft Official',
      onboarded = true,
      role = 'admin'
  WHERE username = 'omnicraft_official';

INSERT INTO public.user_roles (user_id, role)
  SELECT id, 'admin'::app_role FROM public.profiles WHERE username = 'omnicraft_official'
  ON CONFLICT (user_id, role) DO NOTHING;

-- 2. Backfill: every existing user follows omnicraft_official
INSERT INTO public.follows (follower_id, following_id)
  SELECT p.id, o.id
  FROM public.profiles p
  CROSS JOIN (SELECT id FROM public.profiles WHERE username = 'omnicraft_official') o
  WHERE p.id <> o.id
  ON CONFLICT (follower_id, following_id) DO NOTHING;

-- 3. Prevent unfollowing the official account
DROP POLICY IF EXISTS "follows_self_delete" ON public.follows;
CREATE POLICY "follows_self_delete" ON public.follows
  FOR DELETE TO authenticated
  USING (
    auth.uid() = follower_id
    AND following_id <> (SELECT id FROM public.profiles WHERE username = 'omnicraft_official')
  );

-- 4. Update handle_new_user to auto-follow the official account on signup
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
  v_official UUID;
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

  SELECT id INTO v_official FROM public.profiles WHERE username = 'omnicraft_official';
  IF v_official IS NOT NULL AND v_official <> NEW.id THEN
    INSERT INTO public.follows (follower_id, following_id)
    VALUES (NEW.id, v_official)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;
