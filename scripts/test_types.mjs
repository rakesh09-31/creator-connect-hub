import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testTypeMismatch() {
  // Let's test specific queries that might trigger text = uuid or RLS errors
  console.log('--- Testing RLS and types with anon client ---');
  
  // Test profiles select
  const { data: p, error: pErr } = await supabase.from('profiles').select('id, username, account_type').limit(1);
  console.log('Profiles test:', p ? 'OK, count=' + p.length : pErr);

  // Test professional_roles select
  const { data: pr, error: prErr } = await supabase.from('professional_roles').select('*').limit(5);
  console.log('Professional roles test:', pr ? 'OK, rows=' + pr.length : prErr);
  if (pr && pr.length > 0) console.log('Sample role:', pr[0]);

  // Test creator_roles select
  const { data: cr, error: crErr } = await supabase.from('creator_roles').select('*').limit(5);
  console.log('Creator roles test:', cr ? 'OK, rows=' + cr.length : crErr);

  // Test user_roles select
  const { data: ur, error: urErr } = await supabase.from('user_roles').select('*').limit(5);
  console.log('User roles test:', ur ? 'OK, rows=' + ur.length : urErr);

  // Test skills select
  const { data: sk, error: skErr } = await supabase.from('skills').select('*').limit(5);
  console.log('Skills test:', sk ? 'OK, rows=' + sk.length : skErr);

  // Test jobs select
  const { data: jb, error: jbErr } = await supabase.from('jobs').select('*').limit(5);
  console.log('Jobs test:', jb ? 'OK, rows=' + jb.length : jbErr);
}

testTypeMismatch();
