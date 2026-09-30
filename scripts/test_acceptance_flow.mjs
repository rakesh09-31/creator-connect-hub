import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

async function testAcceptance() {
  console.log('Testing invitation acceptance flow between real accounts...');

  // 1. Inviter: sign in as creator_1789410388281
  const inviterClient = createClient(url, key);
  const { data: inviterSign } = await inviterClient.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  const inviterId = inviterSign?.user?.id;
  console.log('Inviter authenticated:', inviterId);

  // Inviter squad
  const { data: squad } = await inviterClient.from('squads').select('*').eq('owner_id', inviterId).limit(1).single();
  console.log('Inviter squad:', squad.id);

  // Invitee: ramu@gmail.com
  const inviteeClient = createClient(url, key);
  const { data: inviteeSign } = await inviteeClient.auth.signInWithPassword({
    email: 'ramu@gmail.com',
    password: 'TemporaryPassword123!#',
  });
  const inviteeId = inviteeSign?.user?.id;
  console.log('Invitee authenticated (@ramu):', inviteeId);

  // Clean old
  await inviterClient.from('squad_invitations').delete().eq('squad_id', squad.id).eq('invitee_id', inviteeId);

  // Send invitation
  const { data: inv, error: invErr } = await inviterClient.from('squad_invitations').insert({
    squad_id: squad.id,
    inviter_id: inviterId,
    invitee_id: inviteeId,
    role: 'Lead Sound Designer',
    project_name: 'Acceptance Test Project',
    status: 'pending'
  }).select().single();

  console.log('Sent invitation:', inv?.id, invErr?.message);

  // Accept invitation as invitee
  const { data: accRes, error: accErr } = await inviteeClient.rpc('accept_squad_invitation', {
    p_invitation_id: inv.id
  });
  console.log('Accept RPC result:', accRes, 'error:', accErr?.message);

  // Verify status in DB
  const { data: checkInv } = await inviterClient.from('squad_invitations').select('status').eq('id', inv.id).single();
  console.log('Verified invitation status in DB:', checkInv?.status);

  // Verify membership in squad_members
  const { data: mem } = await inviterClient.from('squad_members').select('*').eq('squad_id', squad.id).eq('user_id', inviteeId).single();
  console.log('Verified squad member row in DB:', mem?.role);

  // Clean up
  await inviterClient.from('squad_members').delete().eq('id', mem.id);
  await inviterClient.from('squad_invitations').delete().eq('id', inv.id);
  console.log('Cleaned up acceptance test data successfully.');
}

testAcceptance();
