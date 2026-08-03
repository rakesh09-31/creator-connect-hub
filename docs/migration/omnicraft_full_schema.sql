-- =====================================================================
-- OmniCraft — complete backend schema for a fresh Supabase project
-- Run this ONCE in the SQL editor of your own Supabase project after
-- connecting it through Lovable → Settings → Integrations → Supabase.
-- Idempotent-ish: safe on an empty database.
-- =====================================================================

-- 1. EXTENSIONS -------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- 2. ENUMS ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('creator', 'client', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABLES -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_members (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text,
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  muted boolean NOT NULL DEFAULT false,
  pinned boolean NOT NULL DEFAULT false,
  archived boolean NOT NULL DEFAULT false,
  joined_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  is_group boolean NOT NULL DEFAULT false,
  title text,
  created_by uuid,
  last_message_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  subject text NOT NULL,
  message text,
  budget text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.creator_specialties (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  specialty text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.job_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  applicant_id uuid,
  squad_id uuid,
  portfolio_url text,
  message text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resume_url text,
  cover_letter text
);

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  category text,
  location text,
  budget text,
  status text NOT NULL DEFAULT 'open'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  company_name text,
  skills_required text[] DEFAULT '{}'::text[],
  experience_level text,
  duration text,
  deadline date
);

CREATE TABLE IF NOT EXISTS public.message_reactions (
  message_id uuid NOT NULL,
  user_id uuid NOT NULL,
  emoji text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  sender_id uuid NOT NULL,
  body text,
  attachment_url text,
  attachment_type text,
  reply_to uuid,
  edited boolean NOT NULL DEFAULT false,
  deleted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  actor_id uuid,
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.portfolios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  media_url text,
  media_type text NOT NULL DEFAULT 'image'::text,
  project_link text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  cover_url text,
  category text,
  skills text[] NOT NULL DEFAULT '{}'::text[],
  tags text[] NOT NULL DEFAULT '{}'::text[],
  tech text[] NOT NULL DEFAULT '{}'::text[],
  github_url text,
  website_url text,
  demo_url text
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_saves (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL,
  post_type text NOT NULL DEFAULT 'photo'::text,
  media_url text,
  caption text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profile_contacts (
  id uuid NOT NULL,
  email text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL,
  username text NOT NULL,
  full_name text,
  avatar_url text,
  bio text,
  role app_role,
  client_field text,
  onboarded boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  portfolio_url text,
  cover_url text,
  location text,
  website text,
  languages text[] DEFAULT '{}'::text[],
  verified boolean NOT NULL DEFAULT false,
  portfolio_template text DEFAULT 'classic'::text,
  portfolio_theme text DEFAULT 'light'::text,
  services jsonb DEFAULT '[]'::jsonb,
  testimonials jsonb DEFAULT '[]'::jsonb,
  social_links jsonb DEFAULT '{}'::jsonb,
  resume_url text,
  portfolio_tagline text
);

CREATE TABLE IF NOT EXISTS public.squad_invites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL,
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.squad_join_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL,
  user_id uuid NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.squad_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  squad_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member'::text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.squads (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  specialty text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  conversation_id uuid
);

CREATE TABLE IF NOT EXISTS public.stories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  media_url text NOT NULL,
  media_type text NOT NULL,
  caption text,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval)
);

CREATE TABLE IF NOT EXISTS public.story_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  viewer_id uuid NOT NULL,
  viewed_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.typing_status (
  conversation_id uuid NOT NULL,
  user_id uuid NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- 4. CONSTRAINTS (PK / UNIQUE / CHECK / FK) ---------------------------
ALTER TABLE public.conversation_members ADD CONSTRAINT conversation_members_pkey PRIMARY KEY (conversation_id, user_id);
ALTER TABLE public.conversations ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);
ALTER TABLE public.creator_requests ADD CONSTRAINT creator_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.creator_specialties ADD CONSTRAINT creator_specialties_pkey PRIMARY KEY (id);
ALTER TABLE public.follows ADD CONSTRAINT follows_pkey PRIMARY KEY (id);
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_pkey PRIMARY KEY (id);
ALTER TABLE public.jobs ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);
ALTER TABLE public.message_reactions ADD CONSTRAINT message_reactions_pkey PRIMARY KEY (message_id, user_id, emoji);
ALTER TABLE public.messages ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE public.portfolios ADD CONSTRAINT portfolios_pkey PRIMARY KEY (id);
ALTER TABLE public.post_comments ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);
ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);
ALTER TABLE public.post_saves ADD CONSTRAINT post_saves_pkey PRIMARY KEY (id);
ALTER TABLE public.posts ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
ALTER TABLE public.profile_contacts ADD CONSTRAINT profile_contacts_pkey PRIMARY KEY (id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);
ALTER TABLE public.squad_invites ADD CONSTRAINT squad_invites_pkey PRIMARY KEY (id);
ALTER TABLE public.squad_join_requests ADD CONSTRAINT squad_join_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.squad_members ADD CONSTRAINT squad_members_pkey PRIMARY KEY (id);
ALTER TABLE public.squads ADD CONSTRAINT squads_pkey PRIMARY KEY (id);
ALTER TABLE public.stories ADD CONSTRAINT stories_pkey PRIMARY KEY (id);
ALTER TABLE public.story_views ADD CONSTRAINT story_views_pkey PRIMARY KEY (id);
ALTER TABLE public.typing_status ADD CONSTRAINT typing_status_pkey PRIMARY KEY (conversation_id, user_id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE public.creator_specialties ADD CONSTRAINT creator_specialties_user_id_specialty_key UNIQUE (user_id, specialty);
ALTER TABLE public.follows ADD CONSTRAINT follows_follower_id_following_id_key UNIQUE (follower_id, following_id);
ALTER TABLE public.post_likes ADD CONSTRAINT post_likes_post_id_user_id_key UNIQUE (post_id, user_id);
ALTER TABLE public.post_saves ADD CONSTRAINT post_saves_post_id_user_id_key UNIQUE (post_id, user_id);
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
ALTER TABLE public.squad_invites ADD CONSTRAINT squad_invites_squad_id_invitee_id_key UNIQUE (squad_id, invitee_id);
ALTER TABLE public.squad_join_requests ADD CONSTRAINT squad_join_requests_squad_id_user_id_key UNIQUE (squad_id, user_id);
ALTER TABLE public.squad_members ADD CONSTRAINT squad_members_squad_id_user_id_key UNIQUE (squad_id, user_id);
ALTER TABLE public.story_views ADD CONSTRAINT story_views_story_id_viewer_id_key UNIQUE (story_id, viewer_id);
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);
ALTER TABLE public.follows ADD CONSTRAINT follows_check CHECK ((follower_id <> following_id));
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_check CHECK (((applicant_id IS NOT NULL) OR (squad_id IS NOT NULL)));
ALTER TABLE public.stories ADD CONSTRAINT stories_media_type_check CHECK ((media_type = ANY (ARRAY['image'::text, 'video'::text])));
ALTER TABLE public.conversation_members ADD CONSTRAINT conversation_members_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE public.conversation_members ADD CONSTRAINT conversation_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.conversations ADD CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.creator_specialties ADD CONSTRAINT creator_specialties_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
ALTER TABLE public.job_applications ADD CONSTRAINT job_applications_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE;
ALTER TABLE public.message_reactions ADD CONSTRAINT message_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.message_reactions ADD CONSTRAINT message_reactions_message_id_fkey FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.messages ADD CONSTRAINT messages_reply_to_fkey FOREIGN KEY (reply_to) REFERENCES messages(id) ON DELETE SET NULL;
ALTER TABLE public.posts ADD CONSTRAINT posts_author_id_fkey FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.squad_invites ADD CONSTRAINT squad_invites_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE;
ALTER TABLE public.squad_join_requests ADD CONSTRAINT squad_join_requests_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE;
ALTER TABLE public.squad_members ADD CONSTRAINT squad_members_squad_id_fkey FOREIGN KEY (squad_id) REFERENCES squads(id) ON DELETE CASCADE;
ALTER TABLE public.squads ADD CONSTRAINT squads_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;
ALTER TABLE public.squads ADD CONSTRAINT squads_conversation_fk FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE SET NULL;
ALTER TABLE public.stories ADD CONSTRAINT stories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.story_views ADD CONSTRAINT story_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.story_views ADD CONSTRAINT story_views_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE;
ALTER TABLE public.typing_status ADD CONSTRAINT typing_status_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
ALTER TABLE public.typing_status ADD CONSTRAINT typing_status_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 5. INDEXES ----------------------------------------------------------
CREATE INDEX idx_follows_follower ON public.follows USING btree (follower_id);
CREATE INDEX idx_follows_following ON public.follows USING btree (following_id);
CREATE INDEX messages_conversation_id_created_at_idx ON public.messages USING btree (conversation_id, created_at DESC);
CREATE INDEX notifications_user_created_idx ON public.notifications USING btree (user_id, created_at DESC);
CREATE INDEX notifications_user_unread_idx ON public.notifications USING btree (user_id) WHERE (read = false);

-- 6. FUNCTIONS (incl. trigger functions + RPCs) -----------------------
CREATE OR REPLACE FUNCTION public.create_notification(_user_id uuid, _actor_id uuid, _type text, _entity_type text, _entity_id uuid, _data jsonb)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF _user_id IS NULL OR _user_id = _actor_id THEN RETURN; END IF;
  INSERT INTO public.notifications (user_id, actor_id, type, entity_type, entity_id, data)
  VALUES (_user_id, _actor_id, _type, _entity_type, _entity_id, COALESCE(_data, '{}'::jsonb));
END; $function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_dm(_other uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_me UUID := auth.uid(); v_conv UUID;
BEGIN
  IF v_me IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF _other IS NULL OR _other = v_me THEN RAISE EXCEPTION 'invalid recipient'; END IF;
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
END $function$
;

CREATE OR REPLACE FUNCTION public.get_or_create_squad_conversation(_squad_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_conversation_id uuid;
    v_owner uuid;
    v_title text;
BEGIN
    SELECT
        conversation_id,
        owner_id,
        name
    INTO
        v_conversation_id,
        v_owner,
        v_title
    FROM public.squads
    WHERE id = _squad_id;

    IF v_conversation_id IS NOT NULL THEN
        RETURN v_conversation_id;
    END IF;

    INSERT INTO public.conversations (
        is_group,
        title,
        created_by,
        created_at,
        updated_at
    )
    VALUES (
        TRUE,
        v_title,
        v_owner,
        now(),
        now()
    )
    RETURNING id
    INTO v_conversation_id;

    UPDATE public.squads
    SET conversation_id = v_conversation_id
    WHERE id = _squad_id;

    RETURN v_conversation_id;
END;
$function$
;

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
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$function$
;

CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv uuid, _user uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.conversation_members WHERE conversation_id = _conv AND user_id = _user);
$function$
;

CREATE OR REPLACE FUNCTION public.is_squad_owner_or_admin(_squad_id uuid, _user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.squads s WHERE s.id = _squad_id AND s.owner_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.squad_members m WHERE m.squad_id = _squad_id AND m.user_id = _user_id AND m.role IN ('owner','admin'));
$function$
;

CREATE OR REPLACE FUNCTION public.notify_hire_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(NEW.creator_id, NEW.client_id, 'hire_request', 'creator_request', NEW.id,
      jsonb_build_object('subject', NEW.subject));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM public.create_notification(NEW.client_id, NEW.creator_id,
      CASE WHEN NEW.status = 'accepted' THEN 'hire_accepted'
           WHEN NEW.status = 'rejected' THEN 'hire_rejected'
           ELSE 'hire_updated' END,
      'creator_request', NEW.id, jsonb_build_object('subject', NEW.subject, 'status', NEW.status));
  END IF;
  RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION public.notify_new_follow()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.create_notification(NEW.following_id, NEW.follower_id, 'follow', 'user', NEW.follower_id, '{}'::jsonb);
  RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION public.notify_post_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_author UUID;
BEGIN
  SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
  PERFORM public.create_notification(v_author, NEW.user_id, 'comment', 'post', NEW.post_id,
    jsonb_build_object('preview', LEFT(NEW.body, 140)));
  RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION public.notify_post_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_author UUID;
BEGIN
  SELECT author_id INTO v_author FROM public.posts WHERE id = NEW.post_id;
  PERFORM public.create_notification(v_author, NEW.user_id, 'like', 'post', NEW.post_id, '{}'::jsonb);
  RETURN NEW;
END; $function$
;

CREATE OR REPLACE FUNCTION public.notify_squad_invite()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_name TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT name INTO v_name FROM public.squads WHERE id = NEW.squad_id;
    PERFORM public.create_notification(NEW.invitee_id, NEW.inviter_id, 'squad_invite', 'squad', NEW.squad_id,
      jsonb_build_object('squad_name', v_name, 'invite_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO public.squad_members (squad_id, user_id, role) VALUES (NEW.squad_id, NEW.invitee_id, 'member')
      ON CONFLICT DO NOTHING;
    END IF;
    SELECT name INTO v_name FROM public.squads WHERE id = NEW.squad_id;
    PERFORM public.create_notification(NEW.inviter_id, NEW.invitee_id,
      CASE WHEN NEW.status='accepted' THEN 'squad_invite_accepted' ELSE 'squad_invite_rejected' END,
      'squad', NEW.squad_id, jsonb_build_object('squad_name', v_name));
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.notify_squad_join_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_owner UUID; v_name TEXT;
BEGIN
  SELECT owner_id, name INTO v_owner, v_name FROM public.squads WHERE id = NEW.squad_id;
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_notification(v_owner, NEW.user_id, 'squad_join_request', 'squad', NEW.squad_id,
      jsonb_build_object('squad_name', v_name, 'request_id', NEW.id));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO public.squad_members (squad_id, user_id, role) VALUES (NEW.squad_id, NEW.user_id, 'member')
      ON CONFLICT DO NOTHING;
    END IF;
    PERFORM public.create_notification(NEW.user_id, v_owner,
      CASE WHEN NEW.status='accepted' THEN 'squad_join_accepted' ELSE 'squad_join_rejected' END,
      'squad', NEW.squad_id, jsonb_build_object('squad_name', v_name));
  END IF;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.on_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE r RECORD; v_preview TEXT;
BEGIN
  UPDATE public.conversations SET last_message_at = NEW.created_at, updated_at = now() WHERE id = NEW.conversation_id;
  v_preview := LEFT(COALESCE(NEW.body, CASE WHEN NEW.attachment_type IS NOT NULL THEN '[' || NEW.attachment_type || ']' ELSE '' END), 140);
  FOR r IN SELECT user_id FROM public.conversation_members WHERE conversation_id = NEW.conversation_id AND user_id <> NEW.sender_id LOOP
    PERFORM public.create_notification(r.user_id, NEW.sender_id, 'message', 'conversation', NEW.conversation_id,
      jsonb_build_object('preview', v_preview, 'message_id', NEW.id));
  END LOOP;
  RETURN NEW;
END $function$
;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$
;

-- 7. TRIGGERS ---------------------------------------------------------
-- auth.users trigger that provisions profile + contacts + auto-follow
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER jobs_touch BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER portfolios_touch BEFORE UPDATE ON public.portfolios FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER profiles_touch_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER sjr_touch BEFORE UPDATE ON public.squad_join_requests FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER squad_invites_notify AFTER INSERT OR UPDATE ON public.squad_invites FOR EACH ROW EXECUTE FUNCTION notify_squad_invite();
CREATE TRIGGER squad_invites_touch BEFORE UPDATE ON public.squad_invites FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER squad_join_requests_notify AFTER INSERT OR UPDATE ON public.squad_join_requests FOR EACH ROW EXECUTE FUNCTION notify_squad_join_request();
CREATE TRIGGER squads_touch BEFORE UPDATE ON public.squads FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
CREATE TRIGGER trg_notify_comment AFTER INSERT ON public.post_comments FOR EACH ROW EXECUTE FUNCTION notify_post_comment();
CREATE TRIGGER trg_notify_follow AFTER INSERT ON public.follows FOR EACH ROW EXECUTE FUNCTION notify_new_follow();
CREATE TRIGGER trg_notify_hire_ins AFTER INSERT ON public.creator_requests FOR EACH ROW EXECUTE FUNCTION notify_hire_request();
CREATE TRIGGER trg_notify_hire_upd AFTER UPDATE ON public.creator_requests FOR EACH ROW EXECUTE FUNCTION notify_hire_request();
CREATE TRIGGER trg_notify_like AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION notify_post_like();
CREATE TRIGGER trg_on_new_message AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION on_new_message();

-- 8. ROW LEVEL SECURITY ----------------------------------------------
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squad_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.squads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.typing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 9. POLICIES ---------------------------------------------------------
CREATE POLICY "Members can view members of their conversations" ON public.conversation_members AS PERMISSIVE FOR SELECT TO authenticated USING (is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users can add themselves to conversation" ON public.conversation_members AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR is_conversation_member(conversation_id, auth.uid())));
CREATE POLICY "Users can leave conversation" ON public.conversation_members AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users can update own membership" ON public.conversation_members AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Anyone can create conversation" ON public.conversations AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = created_by));
CREATE POLICY "Members can update conversation" ON public.conversations AS PERMISSIVE FOR UPDATE TO authenticated USING (is_conversation_member(id, auth.uid()));
CREATE POLICY "Members can view conversation" ON public.conversations AS PERMISSIVE FOR SELECT TO authenticated USING (is_conversation_member(id, auth.uid()));
CREATE POLICY cr_delete_client ON public.creator_requests AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = client_id));
CREATE POLICY cr_insert_client ON public.creator_requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = client_id));
CREATE POLICY cr_read_self ON public.creator_requests AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = client_id) OR (auth.uid() = creator_id)));
CREATE POLICY cr_update_creator ON public.creator_requests AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = creator_id));
CREATE POLICY specialties_public_read ON public.creator_specialties AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY specialties_self_delete ON public.creator_specialties AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY specialties_self_insert ON public.creator_specialties AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY follows_public_read ON public.follows AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY follows_self_delete ON public.follows AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = follower_id) AND (following_id <> ( SELECT profiles.id
   FROM profiles
  WHERE (profiles.username = 'omnicraft_official'::text)))));
CREATE POLICY follows_self_insert ON public.follows AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = follower_id));
CREATE POLICY apps_delete_self ON public.job_applications AS PERMISSIVE FOR DELETE TO authenticated USING (((auth.uid() = applicant_id) OR (EXISTS ( SELECT 1
   FROM squads s
  WHERE ((s.id = job_applications.squad_id) AND (s.owner_id = auth.uid()))))));
CREATE POLICY apps_insert_self ON public.job_applications AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((((applicant_id IS NULL) OR (auth.uid() = applicant_id)) AND ((squad_id IS NULL) OR (EXISTS ( SELECT 1
   FROM squads s
  WHERE ((s.id = job_applications.squad_id) AND (s.owner_id = auth.uid())))))));
CREATE POLICY apps_read_own_or_job_owner ON public.job_applications AS PERMISSIVE FOR SELECT TO authenticated USING (((auth.uid() = applicant_id) OR (EXISTS ( SELECT 1
   FROM jobs j
  WHERE ((j.id = job_applications.job_id) AND (j.client_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM squads s
  WHERE ((s.id = job_applications.squad_id) AND (s.owner_id = auth.uid()))))));
CREATE POLICY apps_update_job_owner ON public.job_applications AS PERMISSIVE FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM jobs j
  WHERE ((j.id = job_applications.job_id) AND (j.client_id = auth.uid())))));
CREATE POLICY jobs_client_delete ON public.jobs AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = client_id));
CREATE POLICY jobs_client_insert ON public.jobs AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = client_id));
CREATE POLICY jobs_client_update ON public.jobs AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = client_id));
CREATE POLICY jobs_public_read ON public.jobs AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Members can view reactions" ON public.message_reactions AS PERMISSIVE FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM messages m
  WHERE ((m.id = message_reactions.message_id) AND is_conversation_member(m.conversation_id, auth.uid())))));
CREATE POLICY "Users delete own reactions" ON public.message_reactions AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users manage own reactions" ON public.message_reactions AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Members can send messages" ON public.messages AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((sender_id = auth.uid()) AND is_conversation_member(conversation_id, auth.uid())));
CREATE POLICY "Members can view messages" ON public.messages AS PERMISSIVE FOR SELECT TO authenticated USING (is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Senders can delete own messages" ON public.messages AS PERMISSIVE FOR DELETE TO authenticated USING ((sender_id = auth.uid()));
CREATE POLICY "Senders can update own messages" ON public.messages AS PERMISSIVE FOR UPDATE TO authenticated USING ((sender_id = auth.uid()));
CREATE POLICY "Users delete their own notifications" ON public.notifications AS PERMISSIVE FOR DELETE TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users read their own notifications" ON public.notifications AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Users update their own notifications" ON public.notifications AS PERMISSIVE FOR UPDATE TO public USING ((auth.uid() = user_id)) WITH CHECK ((auth.uid() = user_id));
CREATE POLICY portfolios_public_read ON public.portfolios AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY portfolios_self_delete ON public.portfolios AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY portfolios_self_insert ON public.portfolios AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY portfolios_self_update ON public.portfolios AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY comments_public_read ON public.post_comments AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY comments_self_delete ON public.post_comments AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY comments_self_insert ON public.post_comments AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY likes_public_read ON public.post_likes AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY likes_self_delete ON public.post_likes AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY likes_self_insert ON public.post_likes AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY saves_self_delete ON public.post_saves AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY saves_self_insert ON public.post_saves AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));
CREATE POLICY saves_self_read ON public.post_saves AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));
CREATE POLICY posts_public_read ON public.posts AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY posts_self_delete ON public.posts AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = author_id));
CREATE POLICY posts_self_insert ON public.posts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = author_id));
CREATE POLICY posts_self_update ON public.posts AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = author_id));
CREATE POLICY contacts_self_delete ON public.profile_contacts AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = id));
CREATE POLICY contacts_self_insert ON public.profile_contacts AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));
CREATE POLICY contacts_self_read ON public.profile_contacts AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = id));
CREATE POLICY contacts_self_update ON public.profile_contacts AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = id));
CREATE POLICY profiles_auth_read ON public.profiles AS PERMISSIVE FOR SELECT TO authenticated USING (true);
CREATE POLICY profiles_self_insert ON public.profiles AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));
CREATE POLICY profiles_self_update ON public.profiles AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = id));
CREATE POLICY squad_invites_create ON public.squad_invites AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((inviter_id = auth.uid()) AND is_squad_owner_or_admin(squad_id, auth.uid())));
CREATE POLICY squad_invites_delete ON public.squad_invites AS PERMISSIVE FOR DELETE TO authenticated USING (((invitee_id = auth.uid()) OR is_squad_owner_or_admin(squad_id, auth.uid())));
CREATE POLICY squad_invites_update ON public.squad_invites AS PERMISSIVE FOR UPDATE TO authenticated USING (((invitee_id = auth.uid()) OR is_squad_owner_or_admin(squad_id, auth.uid()))) WITH CHECK (((invitee_id = auth.uid()) OR is_squad_owner_or_admin(squad_id, auth.uid())));
CREATE POLICY squad_invites_visible ON public.squad_invites AS PERMISSIVE FOR SELECT TO authenticated USING (((invitee_id = auth.uid()) OR (inviter_id = auth.uid()) OR is_squad_owner_or_admin(squad_id, auth.uid())));
CREATE POLICY sjr_create ON public.squad_join_requests AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY sjr_delete ON public.squad_join_requests AS PERMISSIVE FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR is_squad_owner_or_admin(squad_id, auth.uid())));
CREATE POLICY sjr_update ON public.squad_join_requests AS PERMISSIVE FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR is_squad_owner_or_admin(squad_id, auth.uid()))) WITH CHECK (((user_id = auth.uid()) OR is_squad_owner_or_admin(squad_id, auth.uid())));
CREATE POLICY sjr_visible ON public.squad_join_requests AS PERMISSIVE FOR SELECT TO authenticated USING (((user_id = auth.uid()) OR is_squad_owner_or_admin(squad_id, auth.uid())));
CREATE POLICY squad_members_owner_delete ON public.squad_members AS PERMISSIVE FOR DELETE TO authenticated USING (((EXISTS ( SELECT 1
   FROM squads s
  WHERE ((s.id = squad_members.squad_id) AND (s.owner_id = auth.uid())))) OR (auth.uid() = user_id)));
CREATE POLICY squad_members_owner_insert ON public.squad_members AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (((EXISTS ( SELECT 1
   FROM squads s
  WHERE ((s.id = squad_members.squad_id) AND (s.owner_id = auth.uid())))) OR (auth.uid() = user_id)));
CREATE POLICY squad_members_owner_update ON public.squad_members AS PERMISSIVE FOR UPDATE TO authenticated USING (is_squad_owner_or_admin(squad_id, auth.uid())) WITH CHECK (is_squad_owner_or_admin(squad_id, auth.uid()));
CREATE POLICY squad_members_public_read ON public.squad_members AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY squads_owner_delete ON public.squads AS PERMISSIVE FOR DELETE TO authenticated USING ((auth.uid() = owner_id));
CREATE POLICY squads_owner_insert ON public.squads AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((auth.uid() = owner_id));
CREATE POLICY squads_owner_update ON public.squads AS PERMISSIVE FOR UPDATE TO authenticated USING ((auth.uid() = owner_id));
CREATE POLICY squads_public_read ON public.squads AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Members can view typing" ON public.typing_status AS PERMISSIVE FOR SELECT TO authenticated USING (is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "Users delete own typing" ON public.typing_status AS PERMISSIVE FOR DELETE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY "Users manage own typing" ON public.typing_status AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()));
CREATE POLICY "Users update own typing" ON public.typing_status AS PERMISSIVE FOR UPDATE TO authenticated USING ((user_id = auth.uid()));
CREATE POLICY user_roles_self_read ON public.user_roles AS PERMISSIVE FOR SELECT TO authenticated USING ((auth.uid() = user_id));

-- 10. GRANTS ----------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;
GRANT ALL ON public.conversation_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_requests TO authenticated;
GRANT ALL ON public.creator_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_specialties TO authenticated;
GRANT ALL ON public.creator_specialties TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_specialties TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follows TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolios TO authenticated;
GRANT ALL ON public.portfolios TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.portfolios TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO authenticated;
GRANT ALL ON public.post_comments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_comments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_likes TO authenticated;
GRANT ALL ON public.post_likes TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_likes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_saves TO authenticated;
GRANT ALL ON public.post_saves TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_saves TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_contacts TO authenticated;
GRANT ALL ON public.profile_contacts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_contacts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_invites TO authenticated;
GRANT ALL ON public.squad_invites TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_invites TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_join_requests TO authenticated;
GRANT ALL ON public.squad_join_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_join_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_members TO authenticated;
GRANT ALL ON public.squad_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_members TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squads TO authenticated;
GRANT ALL ON public.squads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_views TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.typing_status TO authenticated;
GRANT ALL ON public.typing_status TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.typing_status TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO anon;

-- 11. REALTIME --------------------------------------------------------
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.conversation_members REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.message_reactions REPLICA IDENTITY FULL;
ALTER TABLE public.typing_status REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.typing_status;

-- 12. STORAGE BUCKETS -------------------------------------------------
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('cover-images', 'cover-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-images', 'portfolio-images', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-videos', 'portfolio-videos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('posts', 'posts', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('stories', 'stories', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('reels', 'reels', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-media', 'chat-media', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('creator-assets', 'creator-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('client-assets', 'client-assets', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('verification', 'verification', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('thumbnails', 'thumbnails', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('temp-uploads', 'temp-uploads', false) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT (id) DO NOTHING;

-- 13. STORAGE POLICIES ------------------------------------------------
-- Public (readable) buckets: anyone can read, owner (first path segment
-- must equal auth.uid()) can write/update/delete.
DROP POLICY IF EXISTS "omnicraft public read" ON storage.objects;
CREATE POLICY "omnicraft public read" ON storage.objects FOR SELECT TO public
  USING (bucket_id IN ('profile-images','cover-images','portfolio-images','portfolio-videos','posts','stories','reels','creator-assets','client-assets','thumbnails','media'));

DROP POLICY IF EXISTS "omnicraft owner read private" ON storage.objects;
CREATE POLICY "omnicraft owner read private" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('chat-media','documents','verification','temp-uploads') AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "omnicraft owner insert" ON storage.objects;
CREATE POLICY "omnicraft owner insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ((auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "omnicraft owner update" ON storage.objects;
CREATE POLICY "omnicraft owner update" ON storage.objects FOR UPDATE TO authenticated
  USING ((auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "omnicraft owner delete" ON storage.objects;
CREATE POLICY "omnicraft owner delete" ON storage.objects FOR DELETE TO authenticated
  USING ((auth.uid())::text = (storage.foldername(name))[1]);

-- 14. OFFICIAL ACCOUNT ------------------------------------------------
-- Create a user with email omnicraft@yourdomain via Auth, then:
-- UPDATE public.profiles SET username = 'omnicraft_official', full_name = 'OmniCraft', verified = true WHERE id = '<user-uuid>';
