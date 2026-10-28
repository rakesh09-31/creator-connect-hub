import { supabase } from '../src/integrations/supabase/client';

async function cleanCorrupt() {
  await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#'
  });
  const { data, error } = await supabase
    .from('squad_invitations')
    .delete()
    .eq('invitee_id', '485f7840-3ead-443e-8438-1eb2a6dfe2c1')
    .eq('role', 'Lead Actress');
  console.log('Deleted corrupt invite result:', { data, error });
}

cleanCorrupt().catch(console.error);
