-- Migration: Complete Client Squad Hiring System
-- File: supabase/migrations/20260930120000_squad_hiring_system.sql

BEGIN;

-- 1. Create squad_hiring_requests table
CREATE TABLE IF NOT EXISTS public.squad_hiring_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    leader_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL,
    project_name TEXT NOT NULL,
    project_brief TEXT,
    budget TEXT,
    timeline TEXT,
    message TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_shr_squad_id ON public.squad_hiring_requests(squad_id);
CREATE INDEX IF NOT EXISTS idx_shr_client_id ON public.squad_hiring_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_shr_client_profile_id ON public.squad_hiring_requests(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_shr_leader_profile_id ON public.squad_hiring_requests(leader_profile_id);
CREATE INDEX IF NOT EXISTS idx_shr_status ON public.squad_hiring_requests(status);
CREATE INDEX IF NOT EXISTS idx_shr_project_id ON public.squad_hiring_requests(project_id);

-- Foreign keys to profiles for PostgREST joins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'squad_hiring_requests_leader_profile_id_fkey'
    ) THEN
        ALTER TABLE public.squad_hiring_requests
            ADD CONSTRAINT squad_hiring_requests_leader_profile_id_fkey
            FOREIGN KEY (leader_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'squad_hiring_requests_client_profile_id_fkey'
    ) THEN
        ALTER TABLE public.squad_hiring_requests
            ADD CONSTRAINT squad_hiring_requests_client_profile_id_fkey
            FOREIGN KEY (client_profile_id) REFERENCES public.profiles(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Grants and Row Level Security
GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_hiring_requests TO authenticated;
GRANT ALL ON public.squad_hiring_requests TO service_role;
ALTER TABLE public.squad_hiring_requests ENABLE ROW LEVEL SECURITY;

-- Select policy: client, squad leader, or squad owner can view
DROP POLICY IF EXISTS "shr_select" ON public.squad_hiring_requests;
CREATE POLICY "shr_select" ON public.squad_hiring_requests FOR SELECT TO authenticated
USING (
    auth.uid() = client_id
    OR client_profile_id IN (
        SELECT p.id FROM public.profiles p WHERE p.auth_user_id = auth.uid() OR p.id = auth.uid()
    )
    OR leader_profile_id = auth.uid()
    OR leader_profile_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.auth_user_id = auth.uid() 
           OR p.id = auth.uid() 
           OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', ''))
    )
    OR EXISTS (
        SELECT 1 FROM public.squads s 
        WHERE s.id = squad_hiring_requests.squad_id 
          AND (
              s.owner_id = auth.uid() 
              OR s.owner_id IN (
                  SELECT p.id FROM public.profiles p 
                  WHERE p.auth_user_id = auth.uid() 
                     OR p.id = auth.uid() 
                     OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', ''))
              )
          )
    )
);

-- Insert policy: clients can only create requests with their own client_id
DROP POLICY IF EXISTS "shr_insert" ON public.squad_hiring_requests;
CREATE POLICY "shr_insert" ON public.squad_hiring_requests FOR INSERT TO authenticated
WITH CHECK (
    auth.uid() = client_id
);

-- Update policy: client can cancel, squad leader can accept/decline
DROP POLICY IF EXISTS "shr_update" ON public.squad_hiring_requests;
CREATE POLICY "shr_update" ON public.squad_hiring_requests FOR UPDATE TO authenticated
USING (
    auth.uid() = client_id
    OR leader_profile_id = auth.uid()
    OR leader_profile_id IN (
        SELECT p.id FROM public.profiles p 
        WHERE p.auth_user_id = auth.uid() 
           OR p.id = auth.uid() 
           OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', ''))
    )
    OR EXISTS (
        SELECT 1 FROM public.squads s 
        WHERE s.id = squad_hiring_requests.squad_id 
          AND (
              s.owner_id = auth.uid() 
              OR s.owner_id IN (
                  SELECT p.id FROM public.profiles p 
                  WHERE p.auth_user_id = auth.uid() 
                     OR p.id = auth.uid() 
                     OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', ''))
              )
          )
    )
);

-- 3. Trigger for notifications
CREATE OR REPLACE FUNCTION public.notify_squad_hiring_request()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_squad_name TEXT;
    v_leader_user_id UUID;
    v_client_user_id UUID;
    v_actor_id UUID;
BEGIN
    SELECT name INTO v_squad_name FROM public.squads WHERE id = NEW.squad_id;
    
    -- Resolve recipient user id for leader
    SELECT COALESCE(auth_user_id, id) INTO v_leader_user_id 
    FROM public.profiles 
    WHERE id = NEW.leader_profile_id;

    v_client_user_id := NEW.client_id;
    v_actor_id := COALESCE(NEW.client_profile_id, NEW.client_id);

    IF TG_OP = 'INSERT' THEN
        -- Notify leader
        PERFORM public.create_notification(
            v_leader_user_id,
            v_actor_id,
            'squad_hire_request',
            'squad_hiring_request',
            NEW.id,
            jsonb_build_object(
                'request_id', NEW.id,
                'squad_id', NEW.squad_id,
                'squad_name', v_squad_name,
                'project_id', NEW.project_id,
                'project_name', NEW.project_name,
                'budget', NEW.budget,
                'timeline', NEW.timeline,
                'message', NEW.message
            )
        );

        IF NEW.leader_profile_id IS NOT NULL AND NEW.leader_profile_id != v_leader_user_id THEN
            PERFORM public.create_notification(
                NEW.leader_profile_id,
                v_actor_id,
                'squad_hire_request',
                'squad_hiring_request',
                NEW.id,
                jsonb_build_object(
                    'request_id', NEW.id,
                    'squad_id', NEW.squad_id,
                    'squad_name', v_squad_name,
                    'project_id', NEW.project_id,
                    'project_name', NEW.project_name,
                    'budget', NEW.budget,
                    'timeline', NEW.timeline,
                    'message', NEW.message
                )
            );
        END IF;

    ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
        -- Notify client of status change (accepted / declined / cancelled)
        PERFORM public.create_notification(
            v_client_user_id,
            NEW.leader_profile_id,
            CASE WHEN NEW.status = 'accepted' THEN 'squad_hire_accepted'
                 WHEN NEW.status = 'declined' THEN 'squad_hire_declined'
                 WHEN NEW.status = 'cancelled' THEN 'squad_hire_cancelled'
                 ELSE 'squad_hire_updated' END,
            'squad_hiring_request',
            NEW.id,
            jsonb_build_object(
                'request_id', NEW.id,
                'squad_id', NEW.squad_id,
                'squad_name', v_squad_name,
                'project_id', NEW.project_id,
                'project_name', NEW.project_name,
                'status', NEW.status
            )
        );

        IF NEW.client_profile_id IS NOT NULL AND NEW.client_profile_id != v_client_user_id THEN
            PERFORM public.create_notification(
                NEW.client_profile_id,
                NEW.leader_profile_id,
                CASE WHEN NEW.status = 'accepted' THEN 'squad_hire_accepted'
                     WHEN NEW.status = 'declined' THEN 'squad_hire_declined'
                     WHEN NEW.status = 'cancelled' THEN 'squad_hire_cancelled'
                     ELSE 'squad_hire_updated' END,
                'squad_hiring_request',
                NEW.id,
                jsonb_build_object(
                    'request_id', NEW.id,
                    'squad_id', NEW.squad_id,
                    'squad_name', v_squad_name,
                    'project_id', NEW.project_id,
                    'project_name', NEW.project_name,
                    'status', NEW.status
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_squad_hire ON public.squad_hiring_requests;
CREATE TRIGGER trg_notify_squad_hire AFTER INSERT OR UPDATE ON public.squad_hiring_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_squad_hiring_request();

-- 4. RPC: send_squad_hiring_request
CREATE OR REPLACE FUNCTION public.send_squad_hiring_request(
    p_squad_id UUID,
    p_project_name TEXT,
    p_project_brief TEXT DEFAULT NULL,
    p_budget TEXT DEFAULT NULL,
    p_timeline TEXT DEFAULT NULL,
    p_message TEXT DEFAULT NULL,
    p_project_id UUID DEFAULT NULL
)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_client_id UUID := auth.uid();
    v_client_profile_id UUID;
    v_squad public.squads;
    v_leader_profile public.profiles;
    v_request_id UUID;
    v_conv_id UUID;
    v_msg_body TEXT;
BEGIN
    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_project_name IS NULL OR TRIM(p_project_name) = '' THEN
        RAISE EXCEPTION 'Project name is required';
    END IF;

    -- Fetch squad
    SELECT * INTO v_squad FROM public.squads WHERE id = p_squad_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Squad not found';
    END IF;

    -- Fetch squad leader profile
    SELECT * INTO v_leader_profile FROM public.profiles WHERE id = v_squad.owner_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Squad leader profile not found';
    END IF;

    -- Resolve client profile ID
    SELECT id INTO v_client_profile_id
    FROM public.profiles
    WHERE auth_user_id = v_client_id OR id = v_client_id
    LIMIT 1;
    IF v_client_profile_id IS NULL THEN
        v_client_profile_id := v_client_id;
    END IF;

    -- Check duplicate pending request
    IF EXISTS (
        SELECT 1 FROM public.squad_hiring_requests
        WHERE squad_id = p_squad_id
          AND client_id = v_client_id
          AND status = 'pending'
          AND (
              (p_project_id IS NOT NULL AND project_id = p_project_id)
              OR LOWER(project_name) = LOWER(TRIM(p_project_name))
          )
    ) THEN
        RAISE EXCEPTION 'A pending hiring request already exists for this squad and project';
    END IF;

    -- Insert request
    INSERT INTO public.squad_hiring_requests (
        squad_id, client_id, client_profile_id, leader_profile_id,
        project_id, project_name, project_brief, budget, timeline, message, status
    ) VALUES (
        p_squad_id, v_client_id, v_client_profile_id, v_leader_profile.id,
        p_project_id, TRIM(p_project_name), TRIM(COALESCE(p_project_brief, '')),
        TRIM(COALESCE(p_budget, '')), TRIM(COALESCE(p_timeline, '')), TRIM(COALESCE(p_message, '')),
        'pending'
    ) RETURNING id INTO v_request_id;

    -- Direct message flow: establish conversation between Client and Leader
    BEGIN
        SELECT c.id INTO v_conv_id
        FROM public.conversations c
        JOIN public.conversation_members cm1 ON cm1.conversation_id = c.id
        JOIN public.conversation_members cm2 ON cm2.conversation_id = c.id
        WHERE c.is_group = false
          AND cm1.user_id = v_client_profile_id
          AND cm2.user_id = v_leader_profile.id
        LIMIT 1;

        IF v_conv_id IS NULL THEN
            INSERT INTO public.conversations (is_group, title, created_by, last_message_at)
            VALUES (false, NULL, v_client_profile_id, now())
            RETURNING id INTO v_conv_id;

            INSERT INTO public.conversation_members (conversation_id, user_id, role, last_read_at)
            VALUES
                (v_conv_id, v_client_profile_id, 'member', now()),
                (v_conv_id, v_leader_profile.id, 'member', now())
            ON CONFLICT DO NOTHING;
        END IF;

        -- Post hiring brief message
        v_msg_body := '📋 SQUAD HIRING REQUEST: ' || v_squad.name || E'\n' ||
                      'Project: ' || TRIM(p_project_name) || E'\n' ||
                      CASE WHEN p_budget IS NOT NULL AND TRIM(p_budget) != '' THEN 'Budget: ' || TRIM(p_budget) || E'\n' ELSE '' END ||
                      CASE WHEN p_timeline IS NOT NULL AND TRIM(p_timeline) != '' THEN 'Timeline: ' || TRIM(p_timeline) || E'\n' ELSE '' END ||
                      CASE WHEN p_message IS NOT NULL AND TRIM(p_message) != '' THEN E'Message: "' || TRIM(p_message) || '"' ELSE '' END;

        INSERT INTO public.messages (conversation_id, sender_id, body, created_at)
        VALUES (v_conv_id, v_client_profile_id, TRIM(v_msg_body), now());

        UPDATE public.conversations
        SET last_message_at = now()
        WHERE id = v_conv_id;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Direct message creation skipped: %', SQLERRM;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'request_id', v_request_id,
        'squad_id', p_squad_id,
        'leader_profile_id', v_leader_profile.id,
        'leader_username', v_leader_profile.username,
        'conversation_id', v_conv_id
    );
END;
$$;

-- 5. RPC: accept_squad_hiring_request
CREATE OR REPLACE FUNCTION public.accept_squad_hiring_request(p_request_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_req public.squad_hiring_requests;
    v_squad public.squads;
    v_conv_id UUID;
    v_client_profile_id UUID;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_req FROM public.squad_hiring_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Hiring request not found';
    END IF;

    IF v_req.status != 'pending' THEN
        RAISE EXCEPTION 'Hiring request is already %', v_req.status;
    END IF;

    -- Verify caller is the squad leader
    IF v_req.leader_profile_id != v_user 
       AND NOT EXISTS (
           SELECT 1 FROM public.profiles p 
           WHERE p.id = v_req.leader_profile_id 
             AND (p.auth_user_id = v_user OR p.id = v_user OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', '')))
       )
       AND NOT EXISTS (
           SELECT 1 FROM public.squads s 
           WHERE s.id = v_req.squad_id 
             AND (s.owner_id = v_user OR s.owner_id IN (
                 SELECT p.id FROM public.profiles p 
                 WHERE p.auth_user_id = v_user OR p.id = v_user OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', ''))
             ))
       ) THEN
        RAISE EXCEPTION 'Not authorized to accept requests for this squad';
    END IF;

    -- 1. Update request status to accepted
    UPDATE public.squad_hiring_requests
    SET status = 'accepted', updated_at = now()
    WHERE id = p_request_id;

    -- 2. Link collaboration / update squad metadata if needed
    SELECT * INTO v_squad FROM public.squads WHERE id = v_req.squad_id;
    IF (v_squad.project_brief IS NULL OR v_squad.project_brief = '') AND v_req.project_brief IS NOT NULL THEN
        UPDATE public.squads
        SET project_brief = v_req.project_brief,
            budget = COALESCE(budget, v_req.budget),
            timeline = COALESCE(timeline, v_req.timeline)
        WHERE id = v_req.squad_id;
    END IF;

    -- 3. Resolve client profile id
    SELECT COALESCE(v_req.client_profile_id, p.id, v_req.client_id) INTO v_client_profile_id
    FROM public.profiles p
    WHERE p.id = v_req.client_id OR p.auth_user_id = v_req.client_id
    LIMIT 1;
    IF v_client_profile_id IS NULL THEN
        v_client_profile_id := v_req.client_id;
    END IF;

    -- 4. Add client to squad conversation for workspace communication
    BEGIN
        v_conv_id := public.add_client_to_squad_conversation(v_req.squad_id, v_client_profile_id);
    EXCEPTION WHEN OTHERS THEN
        v_conv_id := v_squad.conversation_id;
    END;

    RETURN jsonb_build_object(
        'success', true,
        'request_id', p_request_id,
        'squad_id', v_req.squad_id,
        'status', 'accepted',
        'conversation_id', v_conv_id
    );
END;
$$;

-- 6. RPC: decline_squad_hiring_request
CREATE OR REPLACE FUNCTION public.decline_squad_hiring_request(p_request_id UUID)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_req public.squad_hiring_requests;
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT * INTO v_req FROM public.squad_hiring_requests WHERE id = p_request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Hiring request not found';
    END IF;

    IF v_req.status != 'pending' THEN
        RAISE EXCEPTION 'Hiring request is already %', v_req.status;
    END IF;

    -- Verify caller is the squad leader
    IF v_req.leader_profile_id != v_user 
       AND NOT EXISTS (
           SELECT 1 FROM public.profiles p 
           WHERE p.id = v_req.leader_profile_id 
             AND (p.auth_user_id = v_user OR p.id = v_user OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', '')))
       )
       AND NOT EXISTS (
           SELECT 1 FROM public.squads s 
           WHERE s.id = v_req.squad_id 
             AND (s.owner_id = v_user OR s.owner_id IN (
                 SELECT p.id FROM public.profiles p 
                 WHERE p.auth_user_id = v_user OR p.id = v_user OR LOWER(p.username) = LOWER(COALESCE(auth.jwt() -> 'user_metadata' ->> 'username', ''))
             ))
       ) THEN
        RAISE EXCEPTION 'Not authorized to decline requests for this squad';
    END IF;

    -- Update status to declined
    UPDATE public.squad_hiring_requests
    SET status = 'declined', updated_at = now()
    WHERE id = p_request_id;

    RETURN jsonb_build_object(
        'success', true,
        'request_id', p_request_id,
        'squad_id', v_req.squad_id,
        'status', 'declined'
    );
END;
$$;

-- 7. Update is_conversation_member to support mapped directory profiles
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conv uuid, _user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public' AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversation_members cm
        WHERE cm.conversation_id = _conv 
          AND (
              cm.user_id = _user 
              OR EXISTS (
                  SELECT 1 FROM public.profiles p 
                  WHERE p.id = cm.user_id 
                    AND (p.auth_user_id = _user OR p.id = _user)
              )
          )
    );
$$;

-- Update msg_insert policy to support sender_id as profile id
DROP POLICY IF EXISTS "msg_insert" ON public.messages;
CREATE POLICY "msg_insert" ON public.messages FOR INSERT TO authenticated
WITH CHECK (
    (
        auth.uid() = sender_id 
        OR EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = sender_id AND (p.auth_user_id = auth.uid() OR p.id = auth.uid())
        )
    )
    AND is_conversation_member(conversation_id, auth.uid())
);

COMMIT;
