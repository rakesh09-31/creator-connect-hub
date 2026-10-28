import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function inspectRavi() {
  const { data: raviPortfolios } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('user_id', '485f7840-3ead-443e-8438-1eb2a6dfe2c1');
  console.log('Ravi portfolios:', raviPortfolios);
}
inspectRavi();
