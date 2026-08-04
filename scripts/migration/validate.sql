-- =====================================================================
-- Omnicraft :: POST-IMPORT VALIDATION
--   psql "$TARGET_DB_URL" -f scripts/migration/validate.sql
-- Run from the directory holding ./migration-data/_counts.csv
-- =====================================================================
CREATE TEMP TABLE src_counts (table_name text, row_count int);
\copy src_counts FROM 'migration-data/_counts.csv' WITH (FORMAT csv, HEADER true)

CREATE TEMP TABLE tgt_counts AS
  SELECT 'profiles'::text AS table_name, count(*)::int AS target_rows FROM public.profiles
  UNION ALL
  SELECT 'profile_contacts'::text AS table_name, count(*)::int AS target_rows FROM public.profile_contacts
  UNION ALL
  SELECT 'user_roles'::text AS table_name, count(*)::int AS target_rows FROM public.user_roles
  UNION ALL
  SELECT 'creator_specialties'::text AS table_name, count(*)::int AS target_rows FROM public.creator_specialties
  UNION ALL
  SELECT 'follows'::text AS table_name, count(*)::int AS target_rows FROM public.follows
  UNION ALL
  SELECT 'conversations'::text AS table_name, count(*)::int AS target_rows FROM public.conversations
  UNION ALL
  SELECT 'conversation_members'::text AS table_name, count(*)::int AS target_rows FROM public.conversation_members
  UNION ALL
  SELECT 'squads'::text AS table_name, count(*)::int AS target_rows FROM public.squads
  UNION ALL
  SELECT 'squad_members'::text AS table_name, count(*)::int AS target_rows FROM public.squad_members
  UNION ALL
  SELECT 'squad_invites'::text AS table_name, count(*)::int AS target_rows FROM public.squad_invites
  UNION ALL
  SELECT 'squad_join_requests'::text AS table_name, count(*)::int AS target_rows FROM public.squad_join_requests
  UNION ALL
  SELECT 'jobs'::text AS table_name, count(*)::int AS target_rows FROM public.jobs
  UNION ALL
  SELECT 'job_applications'::text AS table_name, count(*)::int AS target_rows FROM public.job_applications
  UNION ALL
  SELECT 'posts'::text AS table_name, count(*)::int AS target_rows FROM public.posts
  UNION ALL
  SELECT 'post_likes'::text AS table_name, count(*)::int AS target_rows FROM public.post_likes
  UNION ALL
  SELECT 'post_comments'::text AS table_name, count(*)::int AS target_rows FROM public.post_comments
  UNION ALL
  SELECT 'post_saves'::text AS table_name, count(*)::int AS target_rows FROM public.post_saves
  UNION ALL
  SELECT 'portfolios'::text AS table_name, count(*)::int AS target_rows FROM public.portfolios
  UNION ALL
  SELECT 'stories'::text AS table_name, count(*)::int AS target_rows FROM public.stories
  UNION ALL
  SELECT 'story_views'::text AS table_name, count(*)::int AS target_rows FROM public.story_views
  UNION ALL
  SELECT 'messages'::text AS table_name, count(*)::int AS target_rows FROM public.messages
  UNION ALL
  SELECT 'message_reactions'::text AS table_name, count(*)::int AS target_rows FROM public.message_reactions
  UNION ALL
  SELECT 'typing_status'::text AS table_name, count(*)::int AS target_rows FROM public.typing_status
  UNION ALL
  SELECT 'creator_requests'::text AS table_name, count(*)::int AS target_rows FROM public.creator_requests
  UNION ALL
  SELECT 'notifications'::text AS table_name, count(*)::int AS target_rows FROM public.notifications;

\echo ''
\echo '=== ROW COUNT COMPARISON (source vs target) ==='
SELECT s.table_name,
       s.row_count AS source_rows,
       t.target_rows,
       t.target_rows - s.row_count AS diff,
       CASE WHEN t.target_rows = s.row_count THEN 'OK' ELSE 'MISMATCH' END AS status
  FROM src_counts s
  JOIN tgt_counts t USING (table_name)
 ORDER BY status DESC, s.table_name;

\echo ''
\echo '=== SUMMARY ==='
SELECT count(*) FILTER (WHERE t.target_rows = s.row_count) AS tables_ok,
       count(*) FILTER (WHERE t.target_rows <> s.row_count) AS tables_mismatched,
       sum(s.row_count) AS source_total,
       sum(t.target_rows) AS target_total
  FROM src_counts s JOIN tgt_counts t USING (table_name);

\echo ''
\echo '=== AUTH COVERAGE ==='
SELECT (SELECT count(*) FROM auth.users) AS auth_users,
       (SELECT count(*) FROM public.profiles) AS profiles,
       (SELECT count(*) FROM public.profiles p
         WHERE NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = p.id)) AS profiles_without_auth_user;

\echo ''
\echo '=== REFERENTIAL INTEGRITY SPOT CHECKS ==='
SELECT 'follows -> profiles' AS check, count(*) AS broken FROM public.follows f
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = f.follower_id)
     OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = f.following_id)
UNION ALL SELECT 'posts -> profiles', count(*) FROM public.posts x
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = x.author_id)
UNION ALL SELECT 'post_likes -> posts', count(*) FROM public.post_likes x
  WHERE NOT EXISTS (SELECT 1 FROM public.posts p WHERE p.id = x.post_id)
UNION ALL SELECT 'post_comments -> posts', count(*) FROM public.post_comments x
  WHERE NOT EXISTS (SELECT 1 FROM public.posts p WHERE p.id = x.post_id)
UNION ALL SELECT 'job_applications -> jobs', count(*) FROM public.job_applications x
  WHERE NOT EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = x.job_id)
UNION ALL SELECT 'squad_members -> squads', count(*) FROM public.squad_members x
  WHERE NOT EXISTS (SELECT 1 FROM public.squads s WHERE s.id = x.squad_id)
UNION ALL SELECT 'messages -> conversations', count(*) FROM public.messages x
  WHERE NOT EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = x.conversation_id)
UNION ALL SELECT 'portfolios -> profiles', count(*) FROM public.portfolios x
  WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = x.user_id);
