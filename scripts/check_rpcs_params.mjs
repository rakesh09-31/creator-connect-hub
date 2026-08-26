import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

const dummyUUID = '00000000-0000-0000-0000-000000000000';

async function checkRPCsWithParams() {
  const tests = [
    { name: 'get_or_create_dm', params: { _other: dummyUUID } },
    { name: 'decide_job_application', params: { _application_id: dummyUUID, _status: 'accepted' } },
    { name: 'add_client_to_squad_conversation', params: { _squad_id: dummyUUID, _client_id: dummyUUID } },
    { name: 'get_or_create_squad_conversation', params: { _squad_id: dummyUUID } },
    { name: 'get_recommended_creators_for_job', params: { p_job_id: dummyUUID, p_limit: 5 } },
    { name: 'get_recommended_jobs_for_creator', params: { p_creator_id: dummyUUID, p_limit: 5 } },
    { name: 'accept_squad_invitation', params: { p_invitation_id: dummyUUID } },
    { name: 'reject_squad_invitation', params: { p_invitation_id: dummyUUID } },
  ];

  for (const t of tests) {
    const { data, error } = await supabase.rpc(t.name, t.params);
    if (error) {
      if (error.message.includes('Could not find the function') || error.code === 'PGRST202') {
        console.log(`❌ [RPC DOES NOT EXIST] ${t.name}: ${error.message}`);
      } else {
        console.log(`✅ [RPC EXISTS AND EXECUTED] ${t.name} -> returned error: ${error.message} (Code: ${error.code})`);
      }
    } else {
      console.log(`✅ [RPC EXISTS AND SUCCEEDED] ${t.name} -> data:`, data);
    }
  }
}

checkRPCsWithParams();
