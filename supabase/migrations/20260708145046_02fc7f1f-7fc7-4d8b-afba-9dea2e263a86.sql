
REVOKE ALL ON FUNCTION public.is_squad_owner_or_admin(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_squad_invite() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_squad_join_request() FROM PUBLIC, anon, authenticated;
