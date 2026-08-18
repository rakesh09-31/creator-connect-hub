import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

console.log('Testing query on:', url);
const supabase = createClient(url, key);

async function test() {
  console.log('\n--- 1. Simple select from skill_swap_listings ---');
  const { data: simpleData, error: simpleErr } = await supabase
    .from('skill_swap_listings')
    .select('id, user_id, title, role, is_active, verification_status')
    .limit(10);
  console.log('Simple query:', { count: simpleData?.length, data: simpleData, error: simpleErr });

  console.log('\n--- 2. Full nested select from SkillSwapPanel ---');
  const { data: fullData, error: fullErr } = await supabase
    .from('skill_swap_listings')
    .select(`
      id, user_id, title, role, role_id, description, learning_mode, availability, is_active,
      verification_status, overall_score, theory_score, technical_score, scenario_score,
      practical_score, software_score, troubleshooting_score, decision_making_score,
      communication_score, technical_knowledge_score, knowledge_score, problem_solving_score,
      stage2_score, stage3_score, skill_level, declared_level, demonstrated_level,
      verification_confidence, strengths_summary, weaknesses_summary, recommendations_summary,
      ai_feedback, experience_duration, ai_verified_at, created_at,
      profile:profiles!skill_swap_listings_user_id_fkey ( username, full_name, avatar_url ),
      teach_skills:skill_swap_listing_teach_skills ( skill_id, skill_name, skill_level, sub_skills, software ),
      learn_skills:skill_swap_listing_learn_skills ( skill_id, skill_name, desired_level, requirements ),
      specialties:skill_swap_specialties ( skill_id, specialty_name )
    `)
    .eq('is_active', true);
  console.log('Full query result:', { count: fullData?.length, error: fullErr });

  console.log('\n--- 3. Check profiles relation join without explicit fkey ---');
  const { data: profileJoin, error: profileJoinErr } = await supabase
    .from('skill_swap_listings')
    .select(`
      id, user_id, title,
      profile:profiles ( username, full_name, avatar_url )
    `)
    .limit(5);
  console.log('Profile join result:', { count: profileJoin?.length, error: profileJoinErr });
}

test();
