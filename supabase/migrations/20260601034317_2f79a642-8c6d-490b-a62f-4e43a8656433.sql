
-- 1. Onboard everyone
UPDATE public.profiles SET onboarded = true WHERE onboarded = false;

-- 2. Assign roles to unrolled demo accounts.
-- Heuristic: the last 40 profiles by created_at are client/brand handles; rest are creators.
WITH ranked AS (
  SELECT id, row_number() OVER (ORDER BY created_at DESC) AS rn
  FROM public.profiles WHERE role IS NULL
)
UPDATE public.profiles p
SET role = CASE WHEN r.rn <= 40 THEN 'client'::app_role ELSE 'creator'::app_role END
FROM ranked r WHERE p.id = r.id;

-- 3. Assign specialties to creators in round-robin (10 specialties)
WITH creators AS (
  SELECT id, row_number() OVER (ORDER BY created_at) - 1 AS idx
  FROM public.profiles
  WHERE role = 'creator'
    AND id NOT IN (SELECT user_id FROM public.creator_specialties)
), spec_list AS (
  SELECT * FROM (VALUES
    (0,'Photographer'),(1,'Videographer'),(2,'Designer'),(3,'Developer'),
    (4,'Writer'),(5,'Editor'),(6,'Colorist'),(7,'Music Producer'),
    (8,'Illustrator'),(9,'Animator')
  ) AS s(i, name)
)
INSERT INTO public.creator_specialties (user_id, specialty)
SELECT c.id, s.name FROM creators c JOIN spec_list s ON s.i = c.idx % 10
ON CONFLICT DO NOTHING;

-- 4. Give clients a client_field tag where missing
UPDATE public.profiles SET client_field = COALESCE(client_field, 'Brand / Studio')
WHERE role = 'client' AND (client_field IS NULL OR client_field = '');

-- 5. Add bios where missing
UPDATE public.profiles SET bio = CASE role
  WHEN 'creator' THEN 'Creator on Omnicraft. Open to collabs and briefs.'
  WHEN 'client'  THEN 'Brand on Omnicraft. Looking for talented creators.'
  ELSE 'Member of Omnicraft.' END
WHERE bio IS NULL OR bio = '';

-- 6. Everyone follows @omnicraft master account
INSERT INTO public.follows (follower_id, following_id)
SELECT p.id, m.id FROM public.profiles p
CROSS JOIN (SELECT id FROM public.profiles WHERE username='omnicraft_official' LIMIT 1) m
WHERE p.id <> m.id
ON CONFLICT DO NOTHING;

-- 7. Random follow graph: each user follows 5 random others
INSERT INTO public.follows (follower_id, following_id)
SELECT a.id, b.id FROM public.profiles a
CROSS JOIN LATERAL (
  SELECT id FROM public.profiles WHERE id <> a.id ORDER BY random() LIMIT 5
) b
ON CONFLICT DO NOTHING;

-- 8. Posts: 2 per profile with picsum/sample media
INSERT INTO public.posts (author_id, caption, media_url, post_type, created_at)
SELECT p.id,
  (ARRAY[
    'New drop on the grid ✨',
    'Behind the scenes today.',
    'Latest project — what do you think?',
    'Color study from this morning.',
    'Studio day. Coffee included.',
    'Shipping soon. Stay tuned.',
    'Throwback to last week''s shoot.',
    'Mood for this season.'
  ])[1 + floor(random()*8)::int],
  'https://picsum.photos/seed/' || substr(p.id::text, 1, 8) || gs::text || '/800/1000',
  'photo',
  now() - (random() * interval '20 days')
FROM public.profiles p CROSS JOIN generate_series(1,2) gs;

-- 9. Jobs: each client posts 1-2 briefs
INSERT INTO public.jobs (client_id, title, description, category, location, budget)
SELECT p.id,
  (ARRAY['Brand video for product launch','Wedding photography weekend','Logo + identity refresh',
         'Animated explainer (60s)','Lifestyle photo series','Podcast intro music',
         'YouTube channel edit retainer','Editorial illustration set'])[1 + floor(random()*8)::int],
  'Looking for a talented creator (or squad) to deliver high-quality work. DM for full brief and timeline.',
  (ARRAY['Video','Photography','Design','Animation','Music','Editing'])[1 + floor(random()*6)::int],
  (ARRAY['Remote','Mumbai','Bangalore','Delhi','Hyderabad','Pune'])[1 + floor(random()*6)::int],
  (ARRAY['$500 - $1,000','$1,000 - $3,000','$3,000 - $7,500','$7,500+'])[1 + floor(random()*4)::int]
FROM public.profiles p CROSS JOIN generate_series(1,2) gs
WHERE p.role = 'client';

-- 10. Squads: 10 demo squads, owned by creators, with 4-5 members each
WITH owners AS (
  SELECT id FROM public.profiles WHERE role='creator' ORDER BY random() LIMIT 10
), inserted AS (
  INSERT INTO public.squads (owner_id, name, description, specialty)
  SELECT id,
    (ARRAY['Pixel Pirates','Frame Forge','Neon Nomads','Studio Sonder','Color Crew',
           'Echo Atelier','Loom Collective','Bright Beat','Type Tribe','Cinema Citizens'])[row_number() OVER ()],
    'A creative collective on Omnicraft — available for briefs and collabs.',
    (ARRAY['Video','Design','Photography','Animation','Music'])[1 + floor(random()*5)::int]
  FROM owners
  RETURNING id, owner_id
)
INSERT INTO public.squad_members (squad_id, user_id, role)
SELECT i.id, m.id, CASE WHEN m.id = i.owner_id THEN 'owner' ELSE 'member' END
FROM inserted i
CROSS JOIN LATERAL (
  (SELECT i.owner_id AS id)
  UNION ALL
  (SELECT id FROM public.profiles WHERE role='creator' AND id <> i.owner_id ORDER BY random() LIMIT 4)
) m
ON CONFLICT DO NOTHING;
