-- Add INSERT policy for notifications so actors can notify recipients
DROP POLICY IF EXISTS "notifications_insert_actor" ON public.notifications;

CREATE POLICY "notifications_insert_actor" ON public.notifications
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = actor_id);
