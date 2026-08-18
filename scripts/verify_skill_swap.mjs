import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

console.log('--- OmniCraft Skill Swap Schema Verification ---');
console.log('Target Supabase Instance:', url);

const supabase = createClient(url, key);

const REQUIRED_TABLES = [
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
  'skill_swap_requests'
];

const LISTING_COLUMNS = [
  'id',
  'user_id',
  'title',
  'role',
  'role_id',
  'description',
  'learning_mode',
  'availability',
  'is_active',
  'verification_status',
  'verification_confidence',
  'overall_score',
  'theory_score',
  'technical_score',
  'scenario_score',
  'practical_score',
  'software_score',
  'troubleshooting_score',
  'decision_making_score',
  'communication_score',
  'technical_knowledge_score',
  'knowledge_score',
  'problem_solving_score',
  'stage2_score',
  'stage3_score',
  'skill_level',
  'declared_level',
  'demonstrated_level',
  'ai_feedback',
  'recommendations_summary',
  'strengths_summary',
  'weaknesses_summary',
  'experience_duration',
  'ai_verified_at',
  'created_at',
  'updated_at'
];

async function verify() {
  let tableErrors = 0;
  let columnErrors = 0;

  console.log('\n[1/3] Verifying 17 Required Tables...');
  for (const table of REQUIRED_TABLES) {
    const { error } = await supabase.from(table).select('*').limit(1);
    if (error) {
      console.error(`  ❌ [MISSING] Table ${table}: ${error.message}`);
      tableErrors++;
    } else {
      console.log(`  ✅ [OK] Table ${table}`);
    }
  }

  console.log('\n[2/3] Verifying skill_swap_listings Columns...');
  for (const col of LISTING_COLUMNS) {
    const { error } = await supabase.from('skill_swap_listings').select(col).limit(1);
    if (error) {
      console.error(`  ❌ [MISSING] Column skill_swap_listings.${col}: ${error.message}`);
      columnErrors++;
    } else {
      console.log(`  ✅ [OK] Column skill_swap_listings.${col}`);
    }
  }

  console.log('\n[3/3] Verifying Assessment Question Bank & Seed Data...');
  const { data: qbData, error: qbError } = await supabase.from('assessment_question_bank').select('id, skill_name, question_type').limit(5);
  if (qbError) {
    console.error(`  ❌ [ERROR] Question Bank query failed: ${qbError.message}`);
  } else {
    console.log(`  ✅ [OK] Question Bank accessible (sampled ${qbData?.length || 0} questions)`);
  }

  const { data: catData, error: catError } = await supabase.from('skill_categories').select('id, name').limit(15);
  if (catError) {
    console.error(`  ❌ [ERROR] Skill categories query failed: ${catError.message}`);
  } else {
    console.log(`  ✅ [OK] Skill Categories accessible (found ${catData?.length || 0} categories)`);
  }

  console.log('\n==================================================');
  if (tableErrors === 0 && columnErrors === 0) {
    console.log('🎉 ALL SKILL SWAP TABLES AND COLUMNS VERIFIED SUCCESSFULLY! 0 ERRORS.');
  } else {
    console.log(`⚠️ VERIFICATION FOUND: ${tableErrors} missing tables, ${columnErrors} missing columns.`);
    console.log('👉 Please execute the complete migration SQL in the Supabase Dashboard SQL Editor.');
  }
  console.log('==================================================\n');
}

verify();
