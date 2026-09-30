-- Allow actors to also read notifications they sent (needed for PostgREST .insert().select() response)
DROP POLICY IF EXISTS "notifications_read" ON public.notifications;

CREATE POLICY "notifications_read" ON public.notifications
    FOR SELECT TO authenticated
    USING ((auth.uid() = user_id) OR (auth.uid() = actor_id));
