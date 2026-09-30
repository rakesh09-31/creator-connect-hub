import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function searchRamuEverywhere() {
  const ramuId = '219895fb-b8b0-488d-bdd0-e20159dc2045';

  const tables = [
    { name: 'profiles', cols: ['id', 'username'] },
    { name: 'creator_roles', cols: ['creator_id'] },
    { name: 'creator_skills', cols: ['creator_id'] },
    { name: 'creator_specialties', cols: ['user_id'] },
    { name: 'portfolios', cols: ['user_id', 'creator_id'] },
    { name: 'portfolio_items', cols: ['user_id'] },
    { name: 'posts', cols: ['author_id'] },
    { name: 'user_roles', cols: ['user_id'] },
    { name: 'squad_members', cols: ['user_id'] },
  ];

  for (const t of tables) {
    for (const c of t.cols) {
      const { data, error } = await supabase.from(t.name).select('*').eq(c, ramuId);
      if (data && data.length > 0) {
        console.log(`Found in table ${t.name}.${c}:`, data.length, 'records');
      }
    }
  }

  // Also search for username = 'ramu'
  const { data: posts } = await supabase.from('posts').select('*').ilike('caption', '%ramu%');
  console.log('Posts mentioning ramu:', posts?.length);
}

searchRamuEverywhere();
