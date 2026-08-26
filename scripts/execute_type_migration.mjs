import fs from 'fs';
import { execSync } from 'child_process';

function runSql(sql) {
  fs.writeFileSync('scripts/.temp_query.sql', sql);
  const res = execSync('supabase db query --linked --file scripts/.temp_query.sql', { encoding: 'utf-8' });
  return res;
}

const commands = [
  // 1. Drop all policies
  `DO $$ 
  DECLARE pol RECORD;
  BEGIN
    FOR pol IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
  END $$;`,

  // 2. Drop existing foreign keys that might block type changes
  `ALTER TABLE IF EXISTS public.creator_roles DROP CONSTRAINT IF EXISTS creator_roles_creator_id_fkey;`,
  `ALTER TABLE IF EXISTS public.creator_roles DROP CONSTRAINT IF EXISTS creator_roles_role_id_fkey;`,
  `ALTER TABLE IF EXISTS public.professional_roles DROP CONSTRAINT IF EXISTS professional_roles_created_by_fkey;`,

  // 3. Alter tables column types to UUID
  `ALTER TABLE public.profiles ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.user_roles ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.user_roles ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,

  `ALTER TABLE public.creator_specialties ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.creator_specialties ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.creator_specialties ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,

  `ALTER TABLE public.follows ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.follows ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.follows ALTER COLUMN follower_id TYPE UUID USING (follower_id::uuid);`,
  `ALTER TABLE public.follows ALTER COLUMN following_id TYPE UUID USING (following_id::uuid);`,

  `ALTER TABLE public.conversations ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.conversations ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.conversations ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by IS NULL OR created_by = '' THEN NULL ELSE created_by::uuid END);`,

  `ALTER TABLE public.conversation_members ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.conversation_members ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.conversation_members ALTER COLUMN conversation_id TYPE UUID USING (conversation_id::uuid);`,
  `ALTER TABLE public.conversation_members ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,

  `ALTER TABLE public.messages ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.messages ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.messages ALTER COLUMN conversation_id TYPE UUID USING (conversation_id::uuid);`,
  `ALTER TABLE public.messages ALTER COLUMN sender_id TYPE UUID USING (sender_id::uuid);`,

  `ALTER TABLE public.message_reactions ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.message_reactions ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.message_reactions ALTER COLUMN message_id TYPE UUID USING (message_id::uuid);`,
  `ALTER TABLE public.message_reactions ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,

  `ALTER TABLE public.typing_status ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.typing_status ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.typing_status ALTER COLUMN conversation_id TYPE UUID USING (conversation_id::uuid);`,
  `ALTER TABLE public.typing_status ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,

  `ALTER TABLE public.squads ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.squads ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.squads ALTER COLUMN owner_id TYPE UUID USING (owner_id::uuid);`,

  `ALTER TABLE public.squad_members ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.squad_members ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.squad_members ALTER COLUMN squad_id TYPE UUID USING (squad_id::uuid);`,
  `ALTER TABLE public.squad_members ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,

  `ALTER TABLE public.squad_invites ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.squad_invites ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.squad_invites ALTER COLUMN squad_id TYPE UUID USING (squad_id::uuid);`,
  `ALTER TABLE public.squad_invites ALTER COLUMN inviter_id TYPE UUID USING (inviter_id::uuid);`,
  `ALTER TABLE public.squad_invites ALTER COLUMN invitee_id TYPE UUID USING (invitee_id::uuid);`,

  `ALTER TABLE public.squad_join_requests ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.squad_join_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.squad_join_requests ALTER COLUMN squad_id TYPE UUID USING (squad_id::uuid);`,
  `ALTER TABLE public.squad_join_requests ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,

  `ALTER TABLE public.jobs ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.jobs ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.jobs ALTER COLUMN client_id TYPE UUID USING (client_id::uuid);`,

  `ALTER TABLE public.job_applications ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.job_applications ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.job_applications ALTER COLUMN job_id TYPE UUID USING (job_id::uuid);`,
  `ALTER TABLE public.job_applications ALTER COLUMN applicant_id TYPE UUID USING (CASE WHEN applicant_id IS NULL OR applicant_id = '' THEN NULL ELSE applicant_id::uuid END);`,
  `ALTER TABLE public.job_applications ALTER COLUMN squad_id TYPE UUID USING (CASE WHEN squad_id IS NULL OR squad_id = '' THEN NULL ELSE squad_id::uuid END);`,

  `ALTER TABLE public.posts ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.posts ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.posts ALTER COLUMN author_id TYPE UUID USING (author_id::uuid);`,

  `ALTER TABLE public.post_likes ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.post_likes ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.post_likes ALTER COLUMN post_id TYPE UUID USING (post_id::uuid);`,
  `ALTER TABLE public.post_likes ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,

  `ALTER TABLE public.post_comments ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.post_comments ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.post_comments ALTER COLUMN post_id TYPE UUID USING (post_id::uuid);`,
  `ALTER TABLE public.post_comments ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,

  `ALTER TABLE public.post_saves ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.post_saves ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.post_saves ALTER COLUMN post_id TYPE UUID USING (post_id::uuid);`,
  `ALTER TABLE public.post_saves ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,

  `ALTER TABLE public.portfolios ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.portfolios ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.portfolios ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,

  `ALTER TABLE public.profile_contacts ALTER COLUMN id TYPE UUID USING (id::uuid);`,

  `ALTER TABLE public.creator_requests ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.creator_requests ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.creator_requests ALTER COLUMN client_id TYPE UUID USING (client_id::uuid);`,
  `ALTER TABLE public.creator_requests ALTER COLUMN creator_id TYPE UUID USING (creator_id::uuid);`,

  `ALTER TABLE public.notifications ALTER COLUMN id TYPE UUID USING (id::uuid);`,
  `ALTER TABLE public.notifications ALTER COLUMN id SET DEFAULT gen_random_uuid();`,
  `ALTER TABLE public.notifications ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);`,
  `ALTER TABLE public.notifications ALTER COLUMN actor_id TYPE UUID USING (CASE WHEN actor_id IS NULL OR actor_id = '' THEN NULL ELSE actor_id::uuid END);`,
  `ALTER TABLE public.notifications ALTER COLUMN entity_id TYPE UUID USING (CASE WHEN entity_id IS NULL OR entity_id = '' THEN NULL ELSE entity_id::uuid END);`,

  `ALTER TABLE public.skills ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by IS NULL OR created_by = '' THEN NULL ELSE created_by::uuid END);`,
  `ALTER TABLE public.professional_roles ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by IS NULL OR created_by = '' THEN NULL ELSE created_by::uuid END);`
];

console.log(`Executing ${commands.length} type migration commands...`);
for (let i = 0; i < commands.length; i++) {
  const cmd = commands[i];
  try {
    runSql(cmd);
    console.log(`[${i + 1}/${commands.length}] OK: ${cmd.slice(0, 60)}...`);
  } catch (err) {
    console.error(`[${i + 1}/${commands.length}] FAILED: ${cmd}\n`, err.message);
  }
}
