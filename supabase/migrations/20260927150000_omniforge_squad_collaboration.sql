-- Migration: OmniForge Real Collaboration, Squad Formation, and Project Workspace Tasks
-- File: 20260927150000_omniforge_squad_collaboration.sql

-- 1. Extend squad_invitations with project context metadata
ALTER TABLE public.squad_invitations
    ADD COLUMN IF NOT EXISTS project_name TEXT,
    ADD COLUMN IF NOT EXISTS brief TEXT,
    ADD COLUMN IF NOT EXISTS budget TEXT,
    ADD COLUMN IF NOT EXISTS timeline TEXT;

-- Update status check constraint to include 'declined' alongside 'rejected'
ALTER TABLE public.squad_invitations DROP CONSTRAINT IF EXISTS squad_invitations_status_check;
ALTER TABLE public.squad_invitations ADD CONSTRAINT squad_invitations_status_check
    CHECK (status IN ('pending', 'accepted', 'declined', 'rejected', 'cancelled'));

-- Add foreign key relationships to profiles for PostgREST joins
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'squad_invitations_invitee_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.squad_invitations
            ADD CONSTRAINT squad_invitations_invitee_id_profiles_fkey
            FOREIGN KEY (invitee_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'squad_invitations_inviter_id_profiles_fkey'
    ) THEN
        ALTER TABLE public.squad_invitations
            ADD CONSTRAINT squad_invitations_inviter_id_profiles_fkey
            FOREIGN KEY (inviter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Extend squads table with workspace metadata
ALTER TABLE public.squads
    ADD COLUMN IF NOT EXISTS budget TEXT,
    ADD COLUMN IF NOT EXISTS timeline TEXT,
    ADD COLUMN IF NOT EXISTS project_brief TEXT;

-- 3. Create squad_tasks table for persistent workspace tasks
CREATE TABLE IF NOT EXISTS public.squad_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    due_date TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_squad_tasks_squad_id ON public.squad_tasks(squad_id);
CREATE INDEX IF NOT EXISTS idx_squad_tasks_assigned_to ON public.squad_tasks(assigned_to);

-- 4. Enable RLS on squad_tasks
ALTER TABLE public.squad_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "squad_tasks_select_members" ON public.squad_tasks;
CREATE POLICY "squad_tasks_select_members" ON public.squad_tasks
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_tasks.squad_id AND s.owner_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = squad_tasks.squad_id AND sm.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "squad_tasks_insert_members" ON public.squad_tasks;
CREATE POLICY "squad_tasks_insert_members" ON public.squad_tasks
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_tasks.squad_id AND s.owner_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = squad_tasks.squad_id AND sm.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "squad_tasks_update_members" ON public.squad_tasks;
CREATE POLICY "squad_tasks_update_members" ON public.squad_tasks
    FOR UPDATE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_tasks.squad_id AND s.owner_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = squad_tasks.squad_id AND sm.user_id = auth.uid())
    )
    WITH CHECK (
        EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_tasks.squad_id AND s.owner_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM public.squad_members sm WHERE sm.squad_id = squad_tasks.squad_id AND sm.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "squad_tasks_delete_owner_or_creator" ON public.squad_tasks;
CREATE POLICY "squad_tasks_delete_owner_or_creator" ON public.squad_tasks
    FOR DELETE TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.squads s WHERE s.id = squad_tasks.squad_id AND s.owner_id = auth.uid())
        OR
        created_by = auth.uid()
    );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.squad_tasks TO authenticated;
GRANT SELECT ON public.squad_tasks TO anon;
