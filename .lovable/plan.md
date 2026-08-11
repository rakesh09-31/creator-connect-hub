## Omnicraft — build plan

A social + professional platform (Instagram × LinkedIn) connecting **Clients** and **Creators**. The uploaded Figma export defines the visual language; we'll port it into the project's stack (TanStack Start + React 19 + Tailwind v4 + shadcn) and wire real auth/data via Lovable Cloud.

---

## Phase 1 — Foundation (this build)

### 1. Enable Lovable Cloud
Provision Postgres, Auth, and Storage. We'll use Cloud for:
- Email/password auth (+ Google sign-in)
- Account recovery via email
- `profiles`, `user_roles`, `specialties`, `posts` tables
- Storage bucket for avatars and post media

### 2. Design system (match Figma exactly)
Port the Omnicraft tokens into `src/styles.css`:
- **Creator theme** — emerald → teal → cyan gradient (`#10B981 → #14B8A6 → #06B6D4`)
- **Client theme** — indigo → purple → pink gradient (`#4F46E5 → #9333EA → #EC4899`)
- Theme switches dynamically based on the signed-in user's role (CSS variable swap on `<body data-role="creator|client">`)
- Fonts, radii, shadows from the export's `theme.css`

### 3. Auth & onboarding flow
Routes (TanStack file-based):
```
/splash                  Animated logo intro (auto-redirect after ~1.5s)
/login                   Username/email + password, "forgot password" link
/signup                  Username + email + phone + password
/forgot-password         Email or phone-based recovery
/_onboarding/role        Choose Creator or Client
/_onboarding/specialty   Creator-only: pick one or more specialties
                         (18 presets + custom "Other" entry, searchable)
/_onboarding/client-role Client-only: business/role context
```
- Splash uses Motion for the logo animation
- Auth state hydrated via Supabase; `_authenticated` layout gates the app
- After signup, redirect into the onboarding subtree until `profiles.onboarded = true`

### 4. App shell + Core pages
Under `_authenticated` layout (bottom-tab nav matching the export):
```
/                Home — feed (Instagram-style stories + LinkedIn-style posts)
/explore         Search creators by username + grid feed
/create          Photo / Video / Project post composer
/profile         Own profile (portfolio grid + bio + stats)
/user/:username  Public profile view
```
- Mock seed data for first-render polish; real posts persist to Cloud
- Role-aware Home: Creators see a "Client Messages" inbox strip; Clients see "Post a project" CTA

---

## Phase 2 — Jobs & Projects
- `/jobs` board (clients post, creators apply)
- `/project/:id` detail with apply / message / accept flow
- `projects`, `applications` tables

## Phase 3 — Messaging & Notifications
- `/messages` inbox + thread view (Cloud-backed, realtime)
- `/notifications` (likes, follows, project invites)

## Phase 4 — Groups, Reels, Admin
- `/groups`, `/group/:id` (Squads)
- `/reel/:id`, `/post/:id` full-screen viewer
- `/admin/dashboard` (gated by `app_role = 'admin'`)

---

## Technical notes

**Stack mapping** — the upload uses React Router v7 + Vite + localStorage. We'll convert routes to TanStack file-based routes under `src/routes/`, replace localStorage auth with Supabase, and reuse the existing shadcn `ui/` components (already in the template). Pages are ported one-by-one as `.tsx` components keeping the original JSX/styles.

**Database (Phase 1)**
- `profiles` (id → auth.users, username unique, full_name, avatar_url, bio, role, onboarded)
- `user_roles` (separate table, `app_role` enum: `creator | client | admin`) — RLS via `has_role()` security-definer fn
- `creator_specialties` (user_id, specialty text) — many per creator
- `posts` (id, author_id, type: photo|video|project, media_url, caption, created_at)
- Storage bucket `media` for uploads
- RLS: users read public profiles/posts; write only their own

**Brand** — keeping **Omnicraft** as the product name (per your answer).

---

## What you'll get at the end of Phase 1
Working app where you can: sign up → pick Creator/Client → (Creator: pick specialties) → land on a themed home feed → browse Explore → view your profile → create a post. Phases 2–4 follow once you confirm Phase 1 looks right.

Reply "go" (or pick a different scope) and I'll start the build.