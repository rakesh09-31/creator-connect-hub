import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testRLSAndDataTypes() {
  console.log('Testing queries and filters on tables:');

  // Test filter with text vs uuid string on profiles
  const testId = '00000000-0000-0000-0000-000000000000';
  
  const { data: pData, error: pErr } = await supabase.from('profiles').select('id, username').eq('id', testId);
  console.log('profiles.id = uuid:', pErr ? pErr.message : 'SUCCESS (count: ' + pData.length + ')');

  const { data: uData, error: uErr } = await supabase.from('user_roles').select('*').eq('user_id', testId);
  console.log('user_roles.user_id = uuid:', uErr ? uErr.message : 'SUCCESS (count: ' + uData.length + ')');

  const { data: cData, error: cErr } = await supabase.from('creator_roles').select('*').eq('creator_id', testId);
  console.log('creator_roles.creator_id = uuid:', cErr ? cErr.message : 'SUCCESS (count: ' + cData.length + ')');

  const { data: fData, error: fErr } = await supabase.from('follows').select('*').eq('follower_id', testId);
  console.log('follows.follower_id = uuid:', fErr ? fErr.message : 'SUCCESS (count: ' + fData.length + ')');

  const { data: mData, error: mErr } = await supabase.from('messages').select('*').eq('sender_id', testId);
  console.log('messages.sender_id = uuid:', mErr ? mErr.message : 'SUCCESS (count: ' + mData.length + ')');

  const { data: sData, error: sErr } = await supabase.from('squad_members').select('*').eq('user_id', testId);
  console.log('squad_members.user_id = uuid:', sErr ? sErr.message : 'SUCCESS (count: ' + sData.length + ')');
}

testRLSAndDataTypes();
