import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

const tables = [
  'profiles',
  'follows',
  'posts',
  'professional_roles',
  'skills',
  'skill_categories',
  'skill_subskills',
  'skill_specialties',
  'skill_swap_listings',
  'squads',
  'squad_members',
  'post_likes',
  'creator_specialties',
  'post_saves',
  'messages',
  'skill_swap_requests',
  'portfolios',
  'portfolio_items',
  'squad_join_requests',
  'squad_invitations',
  'squad_invites',
  'post_comments',
  'conversation_members',
  'conversations',
  'stories',
  'story_views',
  'jobs',
  'creator_roles',
  'client_roles',
  'notifications',
  'skill_swap_listing_teach_skills',
  'skill_swap_listing_learn_skills',
  'creator_skills',
  'creator_learning_skills',
  'job_applications',
  'job_roles',
  'job_skills',
  'typing_status',
  'skill_swap_specialties',
  'file_uploads',
  'user_roles',
  'creator_requests',
  'skill_swap_assessments',
  'skill_swap_assessment_questions',
  'skill_swap_assessment_answers',
  'skill_swap_assessment_results',
  'assessment_question_bank',
  'profile_contacts'
];

async function run() {
  console.log('Testing access to all tables:');
  const existing = [];
  const missing = [];
  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      missing.push({ table: t, error: error.message, code: error.code, details: error.details, hint: error.hint });
    } else {
      existing.push({ table: t, count: data.length });
    }
  }

  console.log('\n--- EXISTING TABLES (' + existing.length + ') ---');
  for (const e of existing) {
    console.log(`[OK] ${e.table}`);
  }

  console.log('\n--- MISSING OR RESTRICTED TABLES (' + missing.length + ') ---');
  for (const m of missing) {
    console.log(`[ERR] ${m.table}: ${m.error} (Code: ${m.code || 'none'})`);
  }
}

run();
