import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testInsert() {
  console.log('Testing insert on skill_swap_listings...');
  // Let's see what users exist in profiles
  const { data: profiles, error: pErr } = await supabase.from('profiles').select('id, username, full_name').limit(3);
  console.log('Sample profiles:', profiles, pErr);

  if (profiles && profiles.length > 0) {
    const testUserId = profiles[0].id;
    console.log('Testing with user_id:', testUserId);

    const testPayload = {
      user_id: testUserId,
      title: 'Test Video Editor',
      role: 'Video Editor',
      description: 'Testing skill swap listing publication',
      learning_mode: 'Online',
      availability: 'Weekends',
      is_active: true,
      verification_status: 'pending',
      overall_score: 85,
      skill_level: 'Intermediate',
      declared_level: 'Intermediate',
      demonstrated_level: 'Intermediate',
      verification_confidence: 'medium',
      scenario_score: 80,
      recommendations_summary: 'Practice color grading workflows',
      experience_duration: '2-3 years'
    };

    const { data: insData, error: insErr } = await supabase
      .from('skill_swap_listings')
      .insert(testPayload)
      .select('*')
      .single();

    console.log('Insert test result:', { insData, error: insErr?.message, details: insErr?.details });

    if (insData) {
      console.log('Successfully inserted listing id:', insData.id);
      // Clean up test row
      await supabase.from('skill_swap_listings').delete().eq('id', insData.id);
      console.log('Cleaned up test row.');
    }
  }
}

testInsert();
