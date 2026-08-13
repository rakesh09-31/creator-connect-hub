CREATE TABLE IF NOT EXISTS public.squad_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    squad_id UUID NOT NULL REFERENCES public.squads(id) ON DELETE CASCADE,
    inviter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    responded_at TIMESTAMPTZ
);

-- Unique constraint to prevent duplicate pending invites
CREATE UNIQUE INDEX IF NOT EXISTS squad_invitations_unique_pending 
ON public.squad_invitations (squad_id, invitee_id) 
WHERE status = 'pending';

-- RLS Policies
ALTER TABLE public.squad_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert invitations if they are the inviter"
    ON public.squad_invitations
    FOR INSERT
    WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Users can view invitations they sent or received"
    ON public.squad_invitations
    FOR SELECT
    USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Invitee can update their invitation"
    ON public.squad_invitations
    FOR UPDATE
    USING (auth.uid() = invitee_id);

CREATE POLICY "Inviter can delete pending invitations"
    ON public.squad_invitations
    FOR DELETE
    USING (auth.uid() = inviter_id AND status = 'pending');

-- Safe indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON public.follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);

-- Reload schema cache to fix frontend errors
NOTIFY pgrst, 'reload schema';
