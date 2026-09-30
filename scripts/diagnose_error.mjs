import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function diagnose() {
  console.log('=== DIAGNOSING INVITATION FOREIGN KEY CONSTRAINTS ===\n');

  // Check sketchsiren, abhiram_actor, ram09chinnram09chinna in profiles
  const targets = ['sketchsiren', 'abhiram_actor', 'ram09chinnram09chinna', 'ramu'];
  for (const username of targets) {
    const { data: prof, error } = await supabase.from('profiles').select('id, username, full_name, role').eq('username', username);
    console.log(`Profile @${username}:`, prof, error);
  }

  // Check squads created in last 24h
  const { data: squads } = await supabase.from('squads').select('id, name, owner_id, created_at').order('created_at', { ascending: false }).limit(5);
  console.log('\nRecent squads:');
  for (const s of squads || []) {
    const { data: ownerProf } = await supabase.from('profiles').select('id, username').eq('id', s.owner_id).maybeSingle();
    console.log(`- Squad ${s.id} (${s.name}) Owner: ${s.owner_id} -> in profiles: ${ownerProf ? `@${ownerProf.username}` : 'NOT IN PROFILES!'}`);
  }

  // Check recent squad_invitations
  const { data: invs } = await supabase.from('squad_invitations').select('id, squad_id, inviter_id, invitee_id, status, created_at').order('created_at', { ascending: false }).limit(5);
  console.log('\nRecent invitations:');
  for (const inv of invs || []) {
    const { data: inviterProf } = await supabase.from('profiles').select('username').eq('id', inv.inviter_id).maybeSingle();
    const { data: inviteeProf } = await supabase.from('profiles').select('username').eq('id', inv.invitee_id).maybeSingle();
    console.log(`- Inv ${inv.id}: Inviter: ${inv.inviter_id} (@${inviterProf?.username}), Invitee: ${inv.invitee_id} (@${inviteeProf?.username})`);
  }
}

diagnose();
