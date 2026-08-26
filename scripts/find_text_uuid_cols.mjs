import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { execSync } from 'child_process';

const result = execSync('supabase db query --linked "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = \'public\' ORDER BY table_name, ordinal_position;"', { encoding: 'utf-8' });

const jsonStart = result.indexOf('{');
const jsonEnd = result.lastIndexOf('}') + 1;
const data = JSON.parse(result.substring(jsonStart, jsonEnd));

const idCols = ['id', 'user_id', 'author_id', 'client_id', 'creator_id', 'applicant_id', 'owner_id', 'sender_id', 'reviewed_by', 'created_by', 'conversation_id', 'post_id', 'job_id', 'squad_id', 'role_id', 'skill_id', 'listing_id', 'message_id', 'story_id', 'following_id', 'follower_id', 'invitee_id', 'inviter_id', 'viewer_id', 'actor_id', 'entity_id'];

const textIdColumns = data.rows.filter(r => idCols.includes(r.column_name) && r.data_type === 'text');

console.log('--- TEXT COLUMNS THAT SHOULD BE UUID ---');
for (const col of textIdColumns) {
  console.log(`${col.table_name}.${col.column_name} (currently ${col.data_type})`);
}
