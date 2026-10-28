SELECT id, auth_user_id, username, full_name, role 
FROM public.profiles 
WHERE username ILIKE '%creator_1789410388281%' 
   OR username ILIKE '%client%'
   OR username = 'ramu';
