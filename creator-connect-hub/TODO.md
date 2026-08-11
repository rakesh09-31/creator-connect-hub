# TODO — Story Storage Configuration Fix

## Root Cause
- The `stories` storage bucket and all other required feature buckets do not exist in the newly-migrated Supabase project.
- Feature uploads all shared the generic `media` bucket instead of dedicated buckets.
- Story upload path was not organized (`{userId}/file` instead of `users/{userId}/YYYY/MM/uuid.ext`).
- No centralized storage configuration; bucket names were scattered.

## Steps
- [x] Create comprehensive idempotent storage migration creating ALL required buckets + RLS policies
  - [x] profile-images (public)
  - [x] cover-images (public)
  - [x] posts (public)
  - [x] stories (public)
  - [x] portfolio (public)
  - [x] thumbnails (public)
  - [x] resumes (private)
  - [x] documents (private)
  - [x] chat-media (public — must be public so public URLs render; owner-only write)
  - [x] verification (private, admin access)
  - [x] temp-uploads (private)
- [x] Refactor `src/lib/uploadMedia.ts` into a centralized storage service
  - [x] Add bucket constants for every feature
  - [x] Keep `STORIES_BUCKET = BUCKETS.STORIES` — stories ONLY use the stories bucket
  - [x] `uploadStoryMedia` uses organized path `users/{userId}/YYYY/MM/{label}-{uuid}.ext`
  - [x] `uploadFeatureMedia` accepts explicit bucket per feature
  - [x] Add shared `removeStorageFile` helper
  - [x] Add file validation (image/video/document types + max size)
- [x] Update callers to use correct buckets
  - [x] `_app.create.tsx` (post) → `BUCKETS.POSTS`
  - [x] `_app.messages.tsx` (chat) → `BUCKETS.CHAT_MEDIA`
  - [x] `_app.profile.tsx` (portfolio thumbnail) → `BUCKETS.PORTFOLIO`
- [x] Add `stories`, `story_views`, `story_reactions` to `types.ts` (remove `as any`)
- [x] Verify stories insert only into `stories` table (never posts/portfolio)
- [x] Run TypeScript/ESLint/build checks
- [x] Provide final report
