import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testCounts() {
  const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, role, experience_level, bio');
  console.log('Total profiles:', profiles?.length);

  const { data: cRoles } = await supabase.from('creator_roles').select('creator_id, professional_roles(name)');
  const { data: specs } = await supabase.from('creator_specialties').select('user_id, specialty');
  const { data: skills } = await supabase.from('creator_skills').select('creator_id, skills(name)');

  const rolesByCreator = {};
  cRoles?.forEach(r => {
    const cid = r.creator_id;
    const name = r.professional_roles?.name;
    if (name) {
      rolesByCreator[cid] = rolesByCreator[cid] || [];
      rolesByCreator[cid].push(name);
    }
  });

  const specsByCreator = {};
  specs?.forEach(s => {
    const cid = s.user_id;
    if (s.specialty) {
      specsByCreator[cid] = specsByCreator[cid] || [];
      specsByCreator[cid].push(s.specialty);
    }
  });

  const skillsByCreator = {};
  skills?.forEach(s => {
    const cid = s.creator_id;
    const name = s.skills?.name;
    if (name) {
      skillsByCreator[cid] = skillsByCreator[cid] || [];
      skillsByCreator[cid].push(name);
    }
  });

  // Let's count by role matches
  const targetRoles = [
    'Lead Actor',
    'Lead Actress',
    'Actor',
    'Video Editor',
    'Fight Master',
    'Stunt Coordinator',
    'Choreographer',
    'Dancer',
    'Singer',
    'Lead Singer',
    'Music Director',
    'Composer',
    'Cinematographer',
    'Sound Designer',
    'Sound Engineer',
    'Producer'
  ];

  console.log('\n--- Profiles matching target roles directly in DB ---');
  for (const tr of targetRoles) {
    const matches = profiles?.filter(p => {
      const cid = p.id;
      const r = rolesByCreator[cid] || [];
      const sp = specsByCreator[cid] || [];
      const sk = skillsByCreator[cid] || [];
      const pRole = p.role || '';
      const allText = `${p.username} ${p.full_name} ${p.bio} ${pRole} ${r.join(' ')} ${sp.join(' ')} ${sk.join(' ')}`.toLowerCase();
      
      const trL = tr.toLowerCase();
      if (trL === 'lead actor' || trL === 'actor') {
        return r.some(x => /actor/i.test(x)) || sp.some(x => /actor|film acting/i.test(x)) || (pRole.toLowerCase() === 'actor');
      }
      if (trL === 'lead actress') {
        return r.some(x => /actress/i.test(x)) || sp.some(x => /actress/i.test(x)) || /female/i.test(allText);
      }
      if (trL === 'video editor') {
        return r.some(x => /video editor|editor/i.test(x)) || sp.some(x => /video editor|editor/i.test(x)) || sk.some(x => /video editing|premiere|davinci|cut/i.test(x));
      }
      if (trL === 'fight master' || trL === 'stunt coordinator') {
        return sp.some(x => /action|stunt/i.test(x)) || allText.includes('fight') || allText.includes('stunt');
      }
      if (trL === 'choreographer') {
        return sp.some(x => /choreographer|choreography/i.test(x)) || allText.includes('choreograph');
      }
      if (trL === 'dancer') {
        return r.some(x => /dancer/i.test(x)) || sp.some(x => /dancer/i.test(x)) || sk.some(x => /dance/i.test(x));
      }
      if (trL === 'singer' || trL === 'lead singer') {
        return r.some(x => /singer/i.test(x)) || sp.some(x => /singer/i.test(x)) || sk.some(x => /vocal|sing/i.test(x));
      }
      if (trL === 'cinematographer') {
        return r.some(x => /cinematographer|videographer/i.test(x)) || sp.some(x => /cinematographer|videographer/i.test(x)) || sk.some(x => /cinematography|camera/i.test(x));
      }
      return false;
    });
    console.log(`${tr}: ${matches?.length || 0} matches`);
  }
}

testCounts();
