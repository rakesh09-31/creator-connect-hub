import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testNotif() {
  const { data: signinData } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  const ownerId = signinData?.user?.id;
  const sketchsirenId = '9b050dec-41de-4a9f-a5b8-5e41129cb2cd';

  console.log('Testing notification insert for sketchsirenId:', sketchsirenId);
  const { data, error } = await supabase.from('notifications').insert({
    user_id: sketchsirenId,
    actor_id: ownerId,
    type: 'squad_invitation',
    entity_type: 'squad',
    entity_id: '52f1cd28-dc4e-45de-9a30-bb14085782a3',
    data: { test: true },
    read: false,
  }).select();

  console.log('Notification insert result:', data, error);
}

testNotif();
