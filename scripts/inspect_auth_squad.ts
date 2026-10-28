import { supabase } from '../src/integrations/supabase/client';

async function run() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#'
  });
  if (authErr) {
    console.error('Auth error:', authErr);
    process.exit(1);
  }
  console.log('Logged in as user:', authData.user?.id);

  const squadId = 'd7c14b35-6554-4c23-a638-527f0d6c7df4';
  const { data: invs, error: invErr } = await supabase
    .from('squad_invitations')
    .select('*, invitee:profiles!invitee_id(username, full_name)')
    .eq('squad_id', squadId);
  console.log('Invs error:', invErr);
  console.log('Invs count:', invs?.length);
  for (const inv of invs || []) {
    console.log(` - Role: "${inv.role}", Status: "${inv.status}", Invitee: @${inv.invitee?.username || inv.invitee_id}`);
  }

  const { data: mems, error: memErr } = await supabase
    .from('squad_members')
    .select('*, user:profiles!user_id(username, full_name)')
    .eq('squad_id', squadId);
  console.log('Mems error:', memErr);
  console.log('Mems count:', mems?.length);
  for (const m of mems || []) {
    console.log(` - Role: "${m.role}", User: @${m.user?.username || m.user_id}`);
  }

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
