import { supabase } from '../src/integrations/supabase/client';

async function main() {
  const { data: skills } = await supabase.from('skills').select('id, name');
  console.log('All available skills in DB:', skills?.map(s => s.name));

  const { data: specs } = await supabase.from('creator_specialties').select('specialty');
  const uniqueSpecs = Array.from(new Set(specs?.map(s => s.specialty)));
  console.log('All specialties in DB:', uniqueSpecs);

  const { data: roles } = await supabase.from('professional_roles').select('id, name');
  console.log('All professional_roles in DB:', roles?.map(r => r.name));
}

main().catch(console.error);
