import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testMatch() {
  console.log('--- Testing Database Queries for Creators ---');
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, role, bio, portfolio_url, website, experience_level, availability, account_type')
    .limit(100);

  console.log(`Fetched ${profiles?.length} profiles, error:`, profErr);

  const creatorIds = (profiles || []).map(p => p.id);

  const [
    { data: skillsData, error: skErr },
    { data: specData, error: spErr },
    { data: portfolioData, error: poErr },
    { data: portfolioItemsData, error: poiErr },
    { data: rolesData, error: roErr },
  ] = await Promise.all([
    supabase.from('creator_skills').select('creator_id, skill_id, skills:skill_id(name)').in('creator_id', creatorIds),
    supabase.from('creator_specialties').select('user_id, specialty').in('user_id', creatorIds),
    supabase.from('portfolios').select('id, user_id, title, description, media_url, media_type, project_link').in('user_id', creatorIds),
    supabase.from('portfolio_items').select('id, user_id, title, description, media_url, media_type, url, tech').in('user_id', creatorIds),
    supabase.from('creator_roles').select('creator_id, role_id, professional_roles:role_id(name)').in('creator_id', creatorIds),
  ]);

  console.log('Skills count:', skillsData?.length, 'error:', skErr);
  console.log('Specialties count:', specData?.length, 'error:', spErr);
  console.log('Portfolios count:', portfolioData?.length, 'error:', poErr);
  console.log('Portfolio Items count:', portfolioItemsData?.length, 'error:', poiErr);
  console.log('Roles count:', rolesData?.length, 'error:', roErr);

  console.log('\nSample Creator Skills:');
  console.log(skillsData?.slice(0, 5));

  console.log('\nSample Creator Roles:');
  console.log(rolesData?.slice(0, 5));

  console.log('\nSample Portfolio Items:');
  console.log(portfolioItemsData?.slice(0, 3));
}

testMatch();
