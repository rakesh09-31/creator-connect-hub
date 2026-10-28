SELECT p.id as profile_id, p.username, u.id as auth_id
FROM public.profiles p
FULL OUTER JOIN auth.users u ON u.id = p.id
WHERE p.id IN ('84595bb3-7350-4921-9316-5c2d91c0998d', '64b10400-23e9-4080-91f6-aed84a8f95cb', '9b050dec-41de-4a9f-a5b8-5e41129cb2cd', '1db1f000-718e-4164-b216-e428fd874afb')
   OR u.id IN ('84595bb3-7350-4921-9316-5c2d91c0998d', '64b10400-23e9-4080-91f6-aed84a8f95cb', '9b050dec-41de-4a9f-a5b8-5e41129cb2cd', '1db1f000-718e-4164-b216-e428fd874afb');
