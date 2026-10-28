import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function findMembers() {
  const { data: raviMembers } = await supabase
    .from('squad_members')
    .select('*, squads(id, name, owner_id)')
    .eq('user_id', '485f7840-3ead-443e-8438-1eb2a6dfe2c1');
  console.log('Ravi edits squad members:', JSON.stringify(raviMembers, null, 2));

  const { data: testCreatorMembers } = await supabase
    .from('squad_members')
    .select('*, squads(id, name, owner_id)')
    .eq('user_id', '442b38ab-ce40-48f3-8b89-8e5ae8e69482');
  console.log('Test Creator E2E (442b38ab...) squad members:', JSON.stringify(testCreatorMembers, null, 2));

  // Check squad_invitations for both
  const { data: raviInvs } = await supabase
    .from('squad_invitations')
    .select('*')
    .eq('invitee_id', '485f7840-3ead-443e-8438-1eb2a6dfe2c1');
  console.log('Ravi edits invitations:', JSON.stringify(raviInvs, null, 2));

  const { data: testInvs } = await supabase
    .from('squad_invitations')
    .select('*')
    .eq('invitee_id', '442b38ab-ce40-48f3-8b89-8e5ae8e69482');
  console.log('Test Creator E2E invitations:', JSON.stringify(testInvs, null, 2));
}
findMembers();
