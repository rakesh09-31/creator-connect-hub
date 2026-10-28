import { supabase } from '../src/integrations/supabase/client';

async function testAuth() {
  const { data: auth, error: aErr } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#'
  });
  if (aErr) {
    console.error('Auth error:', aErr);
    return;
  }
  console.log('Logged in as user ID:', auth.user.id);
  const { data: invs, error: iErr } = await supabase
    .from('squad_invitations')
    .select('id, squad_id, role, status, invitee_id, invitee:profiles!invitee_id(username)');
  if (iErr) {
    console.error('Invs error:', iErr);
    return;
  }
  console.log(`FOUND ${invs?.length} INVITATIONS:`);
  for (const inv of invs || []) {
    console.log(` - Role: "${inv.role}", Status: "${inv.status}", Invitee: @${(inv.invitee as any)?.username}, InviteeID: ${inv.invitee_id}`);
  }
}

testAuth().catch(console.error);
