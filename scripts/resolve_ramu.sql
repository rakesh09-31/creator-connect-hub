BEGIN;

-- 1. Update dependent tables from old unlinked ID to valid Auth user ID
UPDATE public.creator_specialties SET user_id = '01214642-fd80-41b3-b1c8-e1241ab84c60' WHERE user_id = '219895fb-b8b0-488d-bdd0-e20159dc2045';
UPDATE public.creator_roles SET creator_id = '01214642-fd80-41b3-b1c8-e1241ab84c60' WHERE creator_id = '219895fb-b8b0-488d-bdd0-e20159dc2045';
UPDATE public.creator_skills SET creator_id = '01214642-fd80-41b3-b1c8-e1241ab84c60' WHERE creator_id = '219895fb-b8b0-488d-bdd0-e20159dc2045';
UPDATE public.portfolios SET user_id = '01214642-fd80-41b3-b1c8-e1241ab84c60' WHERE user_id = '219895fb-b8b0-488d-bdd0-e20159dc2045';
UPDATE public.squad_members SET user_id = '01214642-fd80-41b3-b1c8-e1241ab84c60' WHERE user_id = '219895fb-b8b0-488d-bdd0-e20159dc2045';
UPDATE public.squads SET owner_id = '01214642-fd80-41b3-b1c8-e1241ab84c60' WHERE owner_id = '219895fb-b8b0-488d-bdd0-e20159dc2045';

-- 2. Delete the old unlinked profile
DELETE FROM public.profiles WHERE id = '219895fb-b8b0-488d-bdd0-e20159dc2045';

-- 3. Update the auth-linked profile to be @ramu
UPDATE public.profiles
SET 
  username = 'ramu',
  full_name = 'Ramu',
  role = 'creator',
  account_type = 'creator',
  onboarded = true,
  updated_at = now()
WHERE id = '01214642-fd80-41b3-b1c8-e1241ab84c60';

COMMIT;
