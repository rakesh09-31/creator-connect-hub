-- Add unique constraint on (squad_id, user_id) for squad_members
CREATE UNIQUE INDEX IF NOT EXISTS squad_members_squad_user_idx ON public.squad_members(squad_id, user_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'squad_members_squad_user_unique'
    ) THEN
        ALTER TABLE public.squad_members
            ADD CONSTRAINT squad_members_squad_user_unique
            UNIQUE USING INDEX squad_members_squad_user_idx;
    END IF;
END $$;
