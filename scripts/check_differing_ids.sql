SELECT id, auth_user_id, username, full_name, role
FROM public.profiles
WHERE auth_user_id IS NOT NULL AND id != auth_user_id;
