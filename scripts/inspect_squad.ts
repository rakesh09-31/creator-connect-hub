import { supabase } from '../src/integrations/supabase/client';

async function inspectSquad() {
  const squadId = 'd7c14b35-6554-4c23-a638-527f0d6c7df4';
  const { data: invs } = await supabase
    .from('squad_invitations')
    .select('*, invitee:profiles!invitee_id(username)')
    .eq('squad_id', squadId);
  console.log('SQUAD INVITATIONS:');
  for (const inv of invs || []) {
    console.log(` - Role: "${inv.role}", Status: "${inv.status}", Invitee: @${inv.invitee?.username}`);
  }

  const { data: mems } = await supabase
    .from('squad_members')
    .select('*, user:profiles!user_id(username)')
    .eq('squad_id', squadId);
  console.log('SQUAD MEMBERS:');
  for (const mem of mems || []) {
    console.log(` - Role: "${mem.role}", User: @${mem.user?.username}`);
  }
}

inspectSquad().catch(console.error);
