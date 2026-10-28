-- Find an auth-linked creator and a directory-only creator
(
  SELECT 'auth_linked' AS type, id, auth_user_id, username, full_name, role
  FROM public.profiles
  WHERE auth_user_id IS NOT NULL
  LIMIT 3
)
UNION ALL
(
  SELECT 'directory_only' AS type, id, auth_user_id, username, full_name, role
  FROM public.profiles
  WHERE auth_user_id IS NULL
  LIMIT 3
);
