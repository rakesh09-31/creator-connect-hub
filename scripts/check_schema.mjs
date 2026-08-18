import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

console.log('Using Supabase URL:', url);
const supabase = createClient(url, key);

async function test() {
  console.log('Testing tables...');
  const tables = [
    'skills',
    'skill_categories',
    'skill_subskills',
    'skill_specialties',
    'creator_skills',
    'creator_learning_skills',
    'skill_swap_listings',
    'skill_swap_listing_teach_skills',
    'skill_swap_listing_learn_skills',
    'skill_swap_specialties',
    'skill_swap_assessments',
    'skill_swap_assessment_questions',
    'skill_swap_assessment_answers',
    'skill_swap_assessment_results',
    'skill_swap_question_bank',
    'assessment_question_bank',
    'skill_swap_requests',
    'professional_roles'
  ];

  for (const t of tables) {
    const { data, error } = await supabase.from(t).select('*').limit(1);
    if (error) {
      console.log(`Table ${t}: ERROR ->`, error.message);
    } else {
      console.log(`Table ${t}: OK (rows: ${data.length})`);
    }
  }

  // Also test columns on skill_swap_listings
  console.log('\nTesting skill_swap_listings specific columns...');
  const columnsToTest = [
    'id', 'user_id', 'title', 'role', 'role_id', 'description', 'learning_mode', 'availability', 'is_active',
    'verification_status', 'overall_score', 'theory_score', 'technical_score', 'scenario_score',
    'practical_score', 'software_score', 'troubleshooting_score', 'decision_making_score', 'communication_score',
    'technical_knowledge_score', 'skill_level', 'declared_level', 'demonstrated_level', 'verification_confidence',
    'stage2_score', 'stage3_score', 'knowledge_score', 'problem_solving_score',
    'strengths_summary', 'weaknesses_summary', 'recommendations_summary', 'ai_feedback',
    'experience_duration', 'ai_verified_at', 'created_at', 'updated_at'
  ];

  for (const col of columnsToTest) {
    const { error } = await supabase.from('skill_swap_listings').select(col).limit(1);
    if (error) {
      console.log(`Column skill_swap_listings.${col}: MISSING/ERROR ->`, error.message);
    } else {
      console.log(`Column skill_swap_listings.${col}: EXISTS`);
    }
  }
}

test();
