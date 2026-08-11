-- Creator requests: clients send appointment/booking requests to a specific creator
CREATE TABLE IF NOT EXISTS public.creator_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  subject text NOT NULL,
  message text,
  budget text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.creator_requests TO authenticated;
GRANT ALL ON public.creator_requests TO service_role;
ALTER TABLE public.creator_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cr_read_self ON public.creator_requests;
CREATE POLICY cr_read_self ON public.creator_requests FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR auth.uid() = creator_id);

DROP POLICY IF EXISTS cr_insert_client ON public.creator_requests;
CREATE POLICY cr_insert_client ON public.creator_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS cr_update_creator ON public.creator_requests;
CREATE POLICY cr_update_creator ON public.creator_requests FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS cr_delete_client ON public.creator_requests;
CREATE POLICY cr_delete_client ON public.creator_requests FOR DELETE TO authenticated
  USING (auth.uid() = client_id);