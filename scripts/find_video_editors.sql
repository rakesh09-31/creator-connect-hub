SELECT p.id, p.auth_user_id, p.username, p.full_name, p.role, p.bio,
       (CASE WHEN p.auth_user_id IS NOT NULL THEN 'auth_linked' ELSE 'directory_only' END) as link_type
FROM public.profiles p
WHERE p.bio ILIKE '%editor%' 
   OR p.bio ILIKE '%video%' 
   OR p.full_name ILIKE '%editor%' 
   OR p.username ILIKE '%editor%'
   OR EXISTS (
       SELECT 1 FROM creator_specialties cs 
       WHERE cs.user_id = p.id AND cs.specialty ILIKE '%editor%'
   );
