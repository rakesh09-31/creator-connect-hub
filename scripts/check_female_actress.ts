import { supabase } from '../src/integrations/supabase/client';

async function main() {
  const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, bio, role');
  const femaleMatches = (profiles || []).filter(p => {
    const text = [p.username, p.full_name, p.bio, p.role].filter(Boolean).join(' ').toLowerCase();
    return /actress|heroine|female|woman|girl|model|lady/i.test(text);
  });
  console.log('Female/Actress matches in profiles:', femaleMatches);
}

main().catch(console.error);
