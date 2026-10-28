import { supabase } from '../src/integrations/supabase/client';

async function main() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, bio, experience_level');
  
  const creatorIds = (profiles || []).map(p => p.id);
  const [
    { data: skillsData },
    { data: specData },
    { data: rolesData },
    { data: portData }
  ] = await Promise.all([
    supabase.from('creator_skills').select('creator_id, skills:skill_id(name)').in('creator_id', creatorIds),
    supabase.from('creator_specialties').select('user_id, specialty').in('user_id', creatorIds),
    supabase.from('creator_roles').select('creator_id, professional_roles:role_id(name)').in('creator_id', creatorIds),
    supabase.from('portfolios').select('user_id, title').in('user_id', creatorIds)
  ]);

  console.log(`Total profiles: ${profiles?.length}`);
  const summary: any[] = [];
  (profiles || []).forEach(p => {
    const s = (skillsData || []).filter((r: any) => r.creator_id === p.id).map((r: any) => r.skills?.name).filter(Boolean);
    const sp = (specData || []).filter((r: any) => r.user_id === p.id).map((r: any) => r.specialty).filter(Boolean);
    const ro = (rolesData || []).filter((r: any) => r.creator_id === p.id).map((r: any) => r.professional_roles?.name).filter(Boolean);
    const po = (portData || []).filter((r: any) => r.user_id === p.id).map((r: any) => r.title).filter(Boolean);
    if (s.length > 0 || sp.length > 0 || ro.length > 0 || po.length > 0 || p.bio) {
      summary.push({
        username: p.username,
        role: p.role,
        roles: ro,
        specialties: sp,
        skills: s,
        portfolios: po,
        bio: p.bio ? p.bio.substring(0, 40) : null
      });
    }
  });

  console.log('Creators with data:', JSON.stringify(summary, null, 2));
}

main().catch(console.error);
