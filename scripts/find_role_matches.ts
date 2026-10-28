import { supabase } from '../src/integrations/supabase/client';

async function main() {
  const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, role, bio');
  const ids = (profiles || []).map(p => p.id);
  const [
    { data: skillsData },
    { data: specData },
    { data: rolesData },
    { data: portData }
  ] = await Promise.all([
    supabase.from('creator_skills').select('creator_id, skills:skill_id(name)').in('creator_id', ids),
    supabase.from('creator_specialties').select('user_id, specialty').in('user_id', ids),
    supabase.from('creator_roles').select('creator_id, professional_roles:role_id(name)').in('creator_id', ids),
    supabase.from('portfolios').select('user_id, title, description').in('user_id', ids)
  ]);

  const targetRoles = [
    { name: 'Lead Actor', query: ['actor', 'lead actor', 'acting', 'drama', 'theatre'] },
    { name: 'Lead Actress', query: ['actress', 'lead actress', 'female actor', 'heroine'] },
    { name: 'Dancer', query: ['dancer', 'dance', 'choreograph'] },
    { name: 'Singer', query: ['singer', 'vocal', 'singing', 'playback'] },
    { name: 'Cinematographer', query: ['cinematograph', 'dop', 'camera'] },
    { name: 'Video Editor', query: ['editor', 'editing', 'premiere', 'davinci', 'final cut'] },
    { name: 'Sound Designer', query: ['sound', 'audio', 'foley', 'pro tools'] },
  ];

  targetRoles.forEach(tr => {
    console.log(`\n================ REAL CANDIDATES FOR ${tr.name} ================`);
    (profiles || []).forEach(p => {
      const s = (skillsData || []).filter((r: any) => r.creator_id === p.id).map((r: any) => r.skills?.name).filter(Boolean);
      const sp = (specData || []).filter((r: any) => r.user_id === p.id).map((r: any) => r.specialty).filter(Boolean);
      const ro = (rolesData || []).filter((r: any) => r.creator_id === p.id).map((r: any) => r.professional_roles?.name).filter(Boolean);
      const po = (portData || []).filter((r: any) => r.user_id === p.id).map((r: any) => r.title).filter(Boolean);
      const allText = [p.role, ...ro, ...sp, ...s, ...po, p.bio].filter(Boolean).join(' ').toLowerCase();

      const matchedKeywords = tr.query.filter(k => allText.includes(k));
      if (matchedKeywords.length > 0) {
        console.log(`@${p.username} (${p.full_name}): matched [${matchedKeywords.join(', ')}]`);
        console.log(`  Roles: [${ro.join(', ')}], Specs: [${sp.join(', ')}], Skills: [${s.join(', ')}], Portfolios: [${po.join(', ')}]`);
      }
    });
  });
}

main().catch(console.error);
