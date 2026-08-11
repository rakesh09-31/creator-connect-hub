# Backend-first Supabase workflow

Before writing or changing frontend code that uses Supabase, inspect the existing database schema and migrations. If a required table, Storage bucket, RLS policy, trigger, index, or RPC function is absent, create and apply an idempotent SQL migration first. Never add frontend references to database objects that do not exist in the deployed schema. Verify the migration refreshes the PostgREST schema cache before treating the frontend work as complete.
