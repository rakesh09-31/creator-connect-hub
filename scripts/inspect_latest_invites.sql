SELECT 
    si.id,
    si.squad_id,
    si.inviter_id,
    p_inviter.username AS inviter_username,
    si.invitee_id,
    p_invitee.username AS invitee_username,
    si.role,
    si.status,
    si.created_at
FROM public.squad_invitations si
JOIN public.profiles p_inviter ON p_inviter.id = si.inviter_id
JOIN public.profiles p_invitee ON p_invitee.id = si.invitee_id
ORDER BY si.created_at DESC
LIMIT 10;
