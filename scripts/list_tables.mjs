import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function listTables() {
  const candidateTables = [
    'profiles', 'users', 'auth_users', 'creators', 'creator_profiles',
    'squads', 'squad_members', 'squad_invitations', 'squad_tasks', 'squad_messages',
    'portfolio_items', 'portfolios', 'creator_roles', 'creator_skills', 'creator_specialties',
    'professional_roles', 'skills', 'assessments', 'assessment_submissions', 'conversations',
    'notifications', 'user_roles', 'posts', 'skill_swaps', 'skill_swap_requests', 'skill_swap_reviews',
    'client_jobs', 'job_proposals', 'reviews'
  ];

  for (const t of candidateTables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (!error) {
      console.log(`Table '${t}': EXISTS (count: ${count})`);
    } else {
      // console.log(`Table '${t}': error ${error.message}`);
    }
  }
}

listTables();
