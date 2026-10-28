import { supabase } from '../src/integrations/supabase/client';

async function main() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, bio')
    .in('username', ['e2e_user_414450', 'e2e_user_909499', 'vinay', 'omniforger_fresh']);
  
  console.log('Profiles:', profiles, 'Error:', error);
  if (!profiles || profiles.length === 0) return;

  const ids = profiles.map(p => p.id);
  const { data: skills } = await supabase.from('creator_skills').select('creator_id, skill_id, skills:skill_id(name)').in('creator_id', ids);
  console.log('Skills:', JSON.stringify(skills, null, 2));

  const { data: specs } = await supabase.from('creator_specialties').select('user_id, specialty').in('user_id', ids);
  console.log('Specialties:', JSON.stringify(specs, null, 2));

  const { data: roles } = await supabase.from('creator_roles').select('creator_id, role_id, professional_roles:role_id(name)').in('creator_id', ids);
  console.log('Roles:', JSON.stringify(roles, null, 2));

  const { data: ports } = await supabase.from('portfolios').select('user_id, title, description').in('user_id', ids);
  console.log('Portfolios:', JSON.stringify(ports, null, 2));
}

main().catch(console.error);
