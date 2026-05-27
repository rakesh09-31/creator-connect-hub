-- has_role: keep search_path immutable (already set), restrict EXECUTE to authenticated only
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

-- touch_updated_at: trigger-only, no API exposure
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

-- handle_new_user: trigger-only, runs as definer from auth schema
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;