import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}
const supabase = createClient(url, key);

// Simulate matcher logic from matcher.ts
async function simulateMatch(targetRole, skills = []) {
  console.log(`\n=== MATCHING FOR: ${targetRole}, skills: [${skills.join(', ')}] ===`);
  const { data: profiles } = await supabase.from('profiles').select('*').limit(100);
  const creatorIds = (profiles || []).map(p => p.id);

  const [
    { data: skillsData },
    { data: specData },
    { data: portfolioData },
    { data: rolesData },
  ] = await Promise.all([
    supabase.from('creator_skills').select('creator_id, skill_id, skills:skill_id(name)').in('creator_id', creatorIds),
    supabase.from('creator_specialties').select('user_id, specialty').in('user_id', creatorIds),
    supabase.from('portfolios').select('id, user_id, title, description, media_url, media_type, project_link').in('user_id', creatorIds),
    supabase.from('creator_roles').select('creator_id, role_id, professional_roles:role_id(name)').in('creator_id', creatorIds),
  ]);

  const candidates = [];
  const roleLower = targetRole.toLowerCase();
  const isActorRole = roleLower.includes("actor") || roleLower.includes("actress") || roleLower.includes("acting");

  for (const prof of profiles || []) {
    const pRoles = (rolesData || []).filter(r => r.creator_id === prof.id).map(r => r.professional_roles?.name || '');
    const pSpecs = (specData || []).filter(s => s.user_id === prof.id).map(s => s.specialty || '');
    const pSkills = (skillsData || []).filter(s => s.creator_id === prof.id).map(s => s.skills?.name || '');
    
    let score = 0;
    let roleAlignment = false;
    const hasActorAffiliation =
      pSpecs.some(s => s.toLowerCase().includes("actor") || s.toLowerCase().includes("acting")) ||
      pRoles.some(r => r.toLowerCase().includes("actor") || r.toLowerCase().includes("acting")) ||
      (prof.username && prof.username.toLowerCase().includes("actor"));

    if (
      pRoles.some(r => r.toLowerCase().includes(roleLower) || roleLower.includes(r.toLowerCase())) ||
      pSpecs.some(s => s.toLowerCase().includes(roleLower) || roleLower.includes(s.toLowerCase())) ||
      (isActorRole && hasActorAffiliation)
    ) {
      roleAlignment = true;
      score += 45;
    }

    for (const sk of skills) {
      const skL = sk.toLowerCase();
      if (pSkills.some(s => s.toLowerCase().includes(skL)) || pSpecs.some(s => s.toLowerCase().includes(skL)) || pRoles.some(r => r.toLowerCase().includes(skL))) {
        score += 25;
      }
    }

    if (roleAlignment || score >= 25) {
      candidates.push({
        id: prof.id,
        username: prof.username,
        score,
        roles: pRoles,
        specialties: pSpecs,
        skills: pSkills
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  console.log(`Found ${candidates.length} candidates:`);
  for (const c of candidates) {
    console.log(`  - @${c.username} | Score: ${c.score} | Roles: [${c.roles.join(', ')}] | Specs: [${c.specialties.join(', ')}] | Skills: [${c.skills.join(', ')}]`);
  }
}

async function run() {
  await simulateMatch("Actor");
  await simulateMatch("Lead Actor");
  await simulateMatch("Lead Actress");
  await simulateMatch("Actor", ["Singing"]);
}
run();
