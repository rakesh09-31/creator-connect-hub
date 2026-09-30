SELECT 
  p.id AS profile_id, 
  p.username, 
  p.full_name, 
  p.role,
  u.id AS auth_user_id,
  u.email AS auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY (u.id IS NOT NULL) DESC, p.username ASC;
