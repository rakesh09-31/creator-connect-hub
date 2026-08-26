import fs from 'fs';
import { execSync } from 'child_process';

const sql = `
DO $$ 
DECLARE
  r RECORD;
BEGIN
  -- Test conversion of text columns to UUID
  -- profiles
  ALTER TABLE public.profiles ALTER COLUMN id TYPE UUID USING (id::uuid);
  
  -- user_roles
  ALTER TABLE public.user_roles ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.user_roles ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  
  -- creator_specialties
  ALTER TABLE public.creator_specialties ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.creator_specialties ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  
  -- follows
  ALTER TABLE public.follows ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.follows ALTER COLUMN follower_id TYPE UUID USING (follower_id::uuid);
  ALTER TABLE public.follows ALTER COLUMN following_id TYPE UUID USING (following_id::uuid);
  
  -- conversations
  ALTER TABLE public.conversations ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.conversations ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by IS NULL OR created_by = '' THEN NULL ELSE created_by::uuid END);
  
  -- conversation_members
  ALTER TABLE public.conversation_members ALTER COLUMN conversation_id TYPE UUID USING (conversation_id::uuid);
  ALTER TABLE public.conversation_members ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  
  -- messages
  ALTER TABLE public.messages ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.messages ALTER COLUMN conversation_id TYPE UUID USING (conversation_id::uuid);
  ALTER TABLE public.messages ALTER COLUMN sender_id TYPE UUID USING (sender_id::uuid);
  
  -- message_reactions
  ALTER TABLE public.message_reactions ALTER COLUMN message_id TYPE UUID USING (message_id::uuid);
  ALTER TABLE public.message_reactions ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  
  -- typing_status
  ALTER TABLE public.typing_status ALTER COLUMN conversation_id TYPE UUID USING (conversation_id::uuid);
  ALTER TABLE public.typing_status ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  
  -- squads
  ALTER TABLE public.squads ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.squads ALTER COLUMN owner_id TYPE UUID USING (owner_id::uuid);
  
  -- squad_members
  ALTER TABLE public.squad_members ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.squad_members ALTER COLUMN squad_id TYPE UUID USING (squad_id::uuid);
  ALTER TABLE public.squad_members ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  
  -- squad_invites
  ALTER TABLE public.squad_invites ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.squad_invites ALTER COLUMN squad_id TYPE UUID USING (squad_id::uuid);
  ALTER TABLE public.squad_invites ALTER COLUMN inviter_id TYPE UUID USING (inviter_id::uuid);
  ALTER TABLE public.squad_invites ALTER COLUMN invitee_id TYPE UUID USING (invitee_id::uuid);
  
  -- squad_join_requests
  ALTER TABLE public.squad_join_requests ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.squad_join_requests ALTER COLUMN squad_id TYPE UUID USING (squad_id::uuid);
  ALTER TABLE public.squad_join_requests ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  
  -- jobs
  ALTER TABLE public.jobs ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.jobs ALTER COLUMN client_id TYPE UUID USING (client_id::uuid);
  
  -- job_applications
  ALTER TABLE public.job_applications ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.job_applications ALTER COLUMN job_id TYPE UUID USING (job_id::uuid);
  ALTER TABLE public.job_applications ALTER COLUMN applicant_id TYPE UUID USING (CASE WHEN applicant_id IS NULL OR applicant_id = '' THEN NULL ELSE applicant_id::uuid END);
  ALTER TABLE public.job_applications ALTER COLUMN squad_id TYPE UUID USING (CASE WHEN squad_id IS NULL OR squad_id = '' THEN NULL ELSE squad_id::uuid END);
  
  -- posts
  ALTER TABLE public.posts ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.posts ALTER COLUMN author_id TYPE UUID USING (author_id::uuid);
  
  -- post_likes
  ALTER TABLE public.post_likes ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.post_likes ALTER COLUMN post_id TYPE UUID USING (post_id::uuid);
  ALTER TABLE public.post_likes ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  
  -- post_comments
  ALTER TABLE public.post_comments ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.post_comments ALTER COLUMN post_id TYPE UUID USING (post_id::uuid);
  ALTER TABLE public.post_comments ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  
  -- post_saves
  ALTER TABLE public.post_saves ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.post_saves ALTER COLUMN post_id TYPE UUID USING (post_id::uuid);
  ALTER TABLE public.post_saves ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  
  -- portfolios
  ALTER TABLE public.portfolios ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.portfolios ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  
  -- profile_contacts
  ALTER TABLE public.profile_contacts ALTER COLUMN id TYPE UUID USING (id::uuid);
  
  -- creator_requests
  ALTER TABLE public.creator_requests ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.creator_requests ALTER COLUMN client_id TYPE UUID USING (client_id::uuid);
  ALTER TABLE public.creator_requests ALTER COLUMN creator_id TYPE UUID USING (creator_id::uuid);
  
  -- notifications
  ALTER TABLE public.notifications ALTER COLUMN id TYPE UUID USING (id::uuid);
  ALTER TABLE public.notifications ALTER COLUMN user_id TYPE UUID USING (user_id::uuid);
  ALTER TABLE public.notifications ALTER COLUMN actor_id TYPE UUID USING (CASE WHEN actor_id IS NULL OR actor_id = '' THEN NULL ELSE actor_id::uuid END);
  ALTER TABLE public.notifications ALTER COLUMN entity_id TYPE UUID USING (CASE WHEN entity_id IS NULL OR entity_id = '' THEN NULL ELSE entity_id::uuid END);
  
  -- skills
  ALTER TABLE public.skills ALTER COLUMN created_by TYPE UUID USING (CASE WHEN created_by IS NULL OR created_by = '' THEN NULL ELSE created_by::uuid END);
END $$;
`;

fs.writeFileSync('scripts/convert_types.sql', sql);
console.log('Written scripts/convert_types.sql');
