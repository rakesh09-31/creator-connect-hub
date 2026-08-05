# OmniCraft — Supabase Migration Report

Run `docs/migration/omnicraft_full_schema.sql` in your own Supabase project's SQL editor
**after** connecting it through Lovable → Settings → Integrations → Supabase.

## 1. Extensions
`pgcrypto`, `uuid-ossp`, `pg_stat_statements` (plus Supabase defaults).

## 2. Enums
`public.app_role` = `creator | client | admin`

## 3. Tables (25)
profiles, profile_contacts, user_roles, creator_specialties, follows,
posts, post_likes, post_comments, post_saves, stories, story_views,
portfolios, jobs, job_applications, creator_requests,
squads, squad_members, squad_invites, squad_join_requests,
conversations, conversation_members, messages, message_reactions, typing_status,
notifications

## 4. RPC / functions
- `handle_new_user()` — provisions profile + contacts + auto-follow of `omnicraft_official`
- `has_role(uuid, app_role)` — security-definer role check
- `is_conversation_member(uuid, uuid)`
- `is_squad_owner_or_admin(uuid, uuid)`
- `get_or_create_dm(uuid)` — used by every "Message" button
- `get_or_create_squad_conversation(uuid)`
- `create_notification(...)` and the notify_* trigger functions
- `touch_updated_at()`

## 5. Triggers
`on_auth_user_created` (auth.users), notification triggers on follows, post_likes,
post_comments, creator_requests, squad_invites, squad_join_requests, messages,
plus `touch_updated_at` triggers on conversations, jobs, portfolios, profiles,
squads, squad_invites, squad_join_requests.

## 6. RLS, policies, grants
Every public table has RLS enabled with the policies reproduced in the SQL file.
Grants: `authenticated` and `service_role` full access; `anon` read access on public
content tables (no `anon` SELECT on `profiles`, none on `profile_contacts` beyond policy).

## 7. Indexes
All non-constraint indexes are recreated in section 5 of the SQL file.

## 8. Realtime
`REPLICA IDENTITY FULL` + publication membership for:
notifications, conversations, conversation_members, messages, message_reactions, typing_status.

## 9. Storage buckets (feature based)
| bucket | visibility | used by |
| --- | --- | --- |
| profile-images | shared* | avatars |
| cover-images | shared* | profile covers |
| posts | shared* | photo/video posts and reels (`reels/` subfolder) |
| stories | shared* | 24h stories |
| portfolio | shared* | portfolio `images/` and `videos/` |
| thumbnails | shared* | generated video posters |
| creator-assets | shared* | creator uploads |
| client-assets | shared* | client uploads |
| resumes | private | resume PDF/DOC/DOCX (owner only) |
| documents | private | contracts, invoices, job & project files |
| chat-media | private | VChat attachments (conversation members only) |
| verification | private | IDs / certificates (owner + admin) |
| temp-uploads | private | staging |
| media | public | legacy bucket (kept so existing URLs keep working) |

\* "shared" buckets are physically private because the workspace blocks public
buckets; they are readable by every signed-in member through RLS and served via
long-lived signed URLs. Flip `SHARED_BUCKETS_ARE_PUBLIC` in `src/lib/storage.ts`
after making them public.

Folder layout: `users/{userId}/{feature}/{YYYY}/{MM}/{uuid}.{ext}`,
`chat-media/conversations/{conversationId}/…`, `resumes/users/{userId}/resume/…`.
File metadata (bucket, path, name, size, mime, feature, owner, entity) is
recorded in `public.file_uploads`; binaries never touch Postgres.


Storage policies: public read on public buckets, owner-only read on private buckets,
owner-only insert/update/delete where the first path segment equals `auth.uid()`.

## 10. Application changes made for the migration
- New unified upload service: `src/lib/storage.ts`
  (`uploadFile`, `replaceFile`, `deleteFile`, `getPublicUrl`, `getSignedUrl`,
  `validateFile`, `parseStorageUrl`, `featureForMedia`, `STORAGE_BUCKETS`)
  with size + MIME validation, progress callbacks, retry, typed `StorageError`.
- `src/lib/uploadMedia.ts` is now a thin backwards-compatible wrapper.
- Post creation and portfolio thumbnail upload now go through the service.
- No bucket name is hardcoded outside `src/lib/storage.ts`.
- Fixed stale table references (`portfolio_items` → `portfolios`,
  `squad_invitations` → `squad_invites`) so the app matches the schema being migrated.

## 11. Manual steps after connecting your Supabase project
1. Connect the project via Lovable → Settings → Integrations → Supabase (generated files refresh automatically).
2. Run `docs/migration/omnicraft_full_schema.sql`.
3. Auth → URL configuration: set Site URL + redirect URLs to your Lovable preview/published domains.
4. Enable the Email provider (and Google if you use it) and disable anonymous sign-ups.
5. Create the official account, then run the `UPDATE public.profiles … 'omnicraft_official'` statement at the end of the SQL file.
6. Optional: copy existing objects from the old `media` bucket into the new feature buckets, or leave them — the `media` bucket is recreated so old URLs still resolve once files are copied.
7. Optional: export/import row data (profiles, posts, jobs, …) if you want the demo content.
