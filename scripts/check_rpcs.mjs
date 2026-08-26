import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

const rpcs = [
  'get_or_create_dm',
  'decide_job_application',
  'add_client_to_squad_conversation',
  'get_or_create_squad_conversation',
  'get_recommended_creators_for_job',
  'get_recommended_jobs_for_creator',
  'accept_squad_invitation',
  'reject_squad_invitation',
  'has_role'
];

async function checkRPCs() {
  console.log('Testing RPCs:');
  for (const rpc of rpcs) {
    const { data, error } = await supabase.rpc(rpc, {});
    if (error) {
      if (error.message.includes('Could not find the function') || error.code === 'PGRST202') {
        console.log(`❌ [RPC MISSING] ${rpc}: ${error.message}`);
      } else {
        console.log(`✅ [RPC EXISTS] ${rpc} (returned schema/param validation: ${error.message})`);
      }
    } else {
      console.log(`✅ [RPC EXISTS] ${rpc}: OK`);
    }
  }
}

checkRPCs();
