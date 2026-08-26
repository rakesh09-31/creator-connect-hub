import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

// Read types.ts to find all tables and columns defined in the TypeScript database schema
const typesContent = fs.readFileSync('src/integrations/supabase/types.ts', 'utf-8');

// Also test specific columns on existing tables
async function checkTableColumns() {
  const existingTables = [
    'profiles',
    'follows',
    'posts',
    'professional_roles',
    'skills',
    'squads',
    'squad_members',
    'post_likes',
    'creator_specialties',
    'post_saves',
    'messages',
    'portfolios',
    'squad_join_requests',
    'squad_invites',
    'post_comments',
    'conversation_members',
    'conversations',
    'jobs',
    'creator_roles',
    'notifications',
    'job_applications',
    'typing_status',
    'user_roles',
    'creator_requests',
    'profile_contacts'
  ];

  for (const table of existingTables) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.log(`[TABLE ERROR] ${table}: ${error.message}`);
    } else {
      if (data.length > 0) {
        console.log(`[TABLE COLS from row] ${table}:`, Object.keys(data[0]));
      } else {
        console.log(`[TABLE EMPTY] ${table} (empty table)`);
      }
    }
  }
}

checkTableColumns();
