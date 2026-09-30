import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function inspectCols() {
  // Query 0 rows with select to get columns if possible or check migration files
  const { data: inv, error: invErr } = await supabase.from('squad_invitations').select('*').limit(0);
  console.log('squad_invitations error:', invErr);

  const { data: notif, error: notifErr } = await supabase.from('notifications').select('*').limit(0);
  console.log('notifications error:', notifErr);
}

inspectCols();
