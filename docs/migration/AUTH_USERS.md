# Omnicraft :: Auth Users Migration

`auth.users` is the one table that cannot be moved with a normal export — it is
owned by the Auth service, it holds password hashes, and every `user_id` in the
application schema is a foreign key to it. Two supported paths.

---

## Path A — Preserve UUIDs (recommended, zero data loss)

`migration-data/auth_users.sql` recreates all **160** accounts in your project
with their **original UUIDs**, emails, signup timestamps, and username metadata.
It also creates the matching `auth.identities` rows, which Supabase requires for
email sign-in and password reset to work.

```bash
psql "$TARGET_DB_URL" -v ON_ERROR_STOP=1 -f migration-data/auth_users.sql
```

Run this **before** `import.sql`. Because UUIDs are preserved, every
`author_id`, `follower_id`, `sender_id`, `owner_id` and so on lands intact —
no remapping, no broken relationships.

### What is *not* carried over: passwords

Password hashes are not readable from the Lovable-managed project, so each row
gets a deliberately invalid `encrypted_password`. The accounts exist and are
email-confirmed, but nobody can sign in with an old password.

Users regain access through **Forgot password** on your `/auth` page — the
reset link works normally because the identity row is present. Send a one-time
notice before cutover:

> We have moved Omnicraft to new infrastructure. Your profile, posts, squads
> and followers are unchanged. Please use "Forgot password" once to set a new
> password.

Your own account: run the reset first and confirm sign-in before announcing.

### If you prefer real passwords for a few accounts

For staff/test accounts, set one directly after running the script:

```sql
UPDATE auth.users
   SET encrypted_password = crypt('a-strong-password', gen_salt('bf'))
 WHERE email = 'you@example.com';
```
(`pgcrypto` is enabled on Supabase by default.)

### OAuth (Google) users

Migrated rows are created as `email` identities. A user who originally signed
in with Google can still use Google: on first Google sign-in Supabase links the
provider to the existing account by matching email, keeping the same UUID.
Make sure the Google provider is enabled in your project **before** cutover, and
that the email on the account matches their Google address.

---

## Path B — Re-signup flow (no auth import)

Choose this if you would rather start with a clean auth table, or if the
accounts are demo data you do not need.

1. Skip `auth_users.sql` entirely.
2. Run `import.sql` anyway. Every row whose owner has no auth account is
   filtered out instead of failing the load, and the counts land in
   `public._migration_report.skipped_orphan` plus `public._migration_orphans`.
   In practice this means near-empty tables until people sign up.
3. Real users sign up fresh. `handle_new_user()` provisions their profile,
   contact row, and the auto-follow of `omnicraft_official`.

### Claiming content after a re-signup

If you want a returning user to reclaim their old posts, keep the export CSVs
and remap after they register:

```sql
-- old_id = UUID from migration-data/profiles.csv, new_id = their new auth UUID
UPDATE public.posts       SET author_id  = :'new_id' WHERE author_id  = :'old_id';
UPDATE public.portfolios  SET user_id    = :'new_id' WHERE user_id    = :'old_id';
UPDATE public.follows     SET follower_id = :'new_id' WHERE follower_id = :'old_id';
UPDATE public.follows     SET following_id = :'new_id' WHERE following_id = :'old_id';
-- ...repeat per table listed in scripts/migration/manifest.json
```

This is why Path A is strongly preferred: it avoids all of the above.

---

## Verifying either path

`validate.sql` prints an **AUTH COVERAGE** block:

```
auth_users | profiles | profiles_without_auth_user
       160 |      160 |                          0
```

`profiles_without_auth_user` must be `0` on Path A.
