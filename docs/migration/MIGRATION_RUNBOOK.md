# Omnicraft :: Migration Runbook (Lovable Cloud → your own Supabase)

Everything needed to move the backend with minimal downtime and intact
relationships. Estimated hands-on time: **30–45 minutes**, of which roughly
**5–10 minutes** is actual downtime.

---

## What ships in this toolkit

| File | Purpose |
| --- | --- |
| `docs/migration/omnicraft_full_schema.sql` | Full schema: 25 tables, enums, RPCs, triggers, RLS, grants, realtime |
| `scripts/migration/manifest.json` | The 25 tables in strict dependency order |
| `scripts/migration/export.sh` | Re-runnable CSV export + row-count baseline |
| `scripts/migration/import.sql` | Staged, idempotent, FK-safe load with a conflict report |
| `scripts/migration/validate.sql` | Row-count diff, auth coverage, integrity spot checks |
| `scripts/migration/run-import.sh` | Runs schema → auth → data → validation in one shot |
| `scripts/migration/generate-sql.mjs` | Regenerates `import.sql` / `validate.sql` after schema changes |
| `migration-data/*.csv` | **Your data, already exported** (see counts below) |
| `migration-data/auth_users.sql` | 160 accounts with original UUIDs |
| `docs/migration/AUTH_USERS.md` | Auth import vs. re-signup, in detail |

### Exported dataset

```
profiles 160   profile_contacts 160   user_roles 1     creator_specialties 120
follows 907    conversations 7        conversation_members 11
squads 13      squad_members 53       squad_join_requests 7   squad_invites 0
jobs 87        job_applications 2     posts 382        portfolios 180
post_likes 2   post_comments 2        post_saves 0     messages 7
creator_requests 3   notifications 20   stories 0   story_views 0
message_reactions 0  typing_status 0
```

Authoritative counts live in `migration-data/_counts.csv`; `validate.sql`
compares against them.

---

## Phase 0 — Prepare (no downtime, do this early)

1. Create the target project in your Supabase account. Pick the region closest
   to your users.
2. Grab the connection string from **Project Settings → Database → Connection
   string → URI** (session pooler, port 5432) and export it:
   ```bash
   export TARGET_DB_URL="postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
   ```
3. Copy the `migration-data/` folder to your project root (same level as
   `package.json`). All scripts use paths relative to the root.
4. Dry run against the empty target — this validates the whole chain before you
   touch production:
   ```bash
   ./scripts/migration/run-import.sh
   ```
   Review the report, then wipe and repeat if you need to adjust:
   ```sql
   -- reverse dependency order
   TRUNCATE public.notifications, public.creator_requests, public.typing_status,
     public.message_reactions, public.messages, public.story_views, public.stories,
     public.portfolios, public.post_saves, public.post_comments, public.post_likes,
     public.posts, public.job_applications, public.jobs, public.squad_join_requests,
     public.squad_invites, public.squad_members, public.squads,
     public.conversation_members, public.conversations, public.creator_specialties,
     public.user_roles, public.profile_contacts, public.profiles CASCADE;
   DELETE FROM auth.users;
   ```

## Phase 1 — Storage buckets (no downtime)

Create the buckets your app uses (`src/lib/storage.ts` is the registry) and
re-run the storage policy block at the end of `omnicraft_full_schema.sql`.
Existing media files keep working from the old public URLs until you copy them;
copy at your leisure with the Supabase CLI or a small script that streams each
object from the old public URL into the new bucket.

## Phase 2 — Cutover (the only downtime)

1. Announce a short maintenance window.
2. Re-export to capture anything written since the dry run:
   ```bash
   ./scripts/migration/export.sh      # from the Lovable Cloud side
   ```
3. Load:
   ```bash
   ./scripts/migration/run-import.sh
   ```
4. Read the two reports it prints (below). Downtime ends here.

## Phase 3 — Point the app at your project

A workspace admin: **Cloud tab → Advanced → Disconnect**, then add the
**Supabase integration** and select your project. Lovable regenerates `.env`
and `src/integrations/supabase/*`. No application code changes — everything
already goes through the generated client and `src/lib/storage.ts`.

> Disconnecting Cloud permanently deletes the Cloud database and storage.
> Only do this once Phase 2 is verified.

Then in your Supabase dashboard:
- **Authentication → URL Configuration**: set Site URL and add your preview and
  published domains as Redirect URLs.
- **Authentication → Providers**: enable Email, and Google if you use it.
- **Authentication → Emails**: check the password-reset template, since every
  migrated user will use it once.

## Phase 4 — Verify

```bash
psql "$TARGET_DB_URL" -f scripts/migration/validate.sql
```

Then smoke-test in the app: sign in (after a password reset), load the home
feed, open a profile with squads, post a comment, open VChat, and check that a
notification lands.

---

## Reading the reports

`import.sql` writes two tables and prints both.

**`public._migration_report`** — one row per table:

| column | meaning |
| --- | --- |
| `csv_rows` | rows in the export file |
| `importable_rows` | rows that passed FK guards |
| `inserted` | rows actually written |
| `skipped_orphan` | dropped because a parent row or auth user was missing |
| `skipped_conflict` | already present in the target (safe — this is what makes re-runs idempotent) |

**`public._migration_orphans`** — application rows referencing a user id with no
auth account. Should be empty on Path A. Anything here means you either skipped
`auth_users.sql` or a profile lost its account.

`validate.sql` then prints source-vs-target counts with an `OK`/`MISMATCH`
flag, auth coverage, and eight referential-integrity spot checks that must all
report `0`.

### Interpreting a MISMATCH

- **target > source** — you re-exported after loading, or the target already had
  data. Truncate and reload.
- **target < source, `skipped_conflict` high** — rows already existed; usually
  fine, confirm with a spot check.
- **target < source, `skipped_orphan` high** — auth users were not imported, or
  a parent table failed earlier. Fix the parent, re-run `import.sql` (it is
  idempotent), and re-validate.

---

## Design notes

- **Dependency order** is fixed in `manifest.json`; parents always load first.
- **Triggers are disabled during load** (`session_replication_role = replica`),
  so migrating a like does not fire a notification and `updated_at` values are
  preserved as exported.
- **Staging tables** mean a bad row cannot poison a whole table: each row is
  filtered against real foreign keys before insert.
- **`messages.reply_to`** is self-referencing, so it loads as `NULL` and is
  back-filled once all messages exist.
- **Everything is idempotent** — `ON CONFLICT DO NOTHING` throughout, so a
  partial run can simply be re-run.

## Rollback

Until Phase 3 the Lovable Cloud backend is still live and untouched — rollback
is simply not disconnecting. After Phase 3, rollback means reconnecting a
backend and reloading from the same CSVs, so keep `migration-data/` archived
until you are confident.
