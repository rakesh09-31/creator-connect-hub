import { supabase } from '../src/integrations/supabase/client';

async function main() {
  const { data: soundSpecs } = await supabase
    .from('creator_specialties')
    .select('user_id, specialty')
    .in('specialty', ['Music Producer']);
  
  const uids = (soundSpecs || []).map(s => s.user_id);
  const { data: profs } = await supabase.from('profiles').select('id, username, full_name, bio').in('id', uids);
  console.log('Music Producers:', profs?.map(p => `@${p.username} (${p.full_name})`));
}

main().catch(console.error);
