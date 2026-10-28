import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function inspectCreator() {
  const { data: creator } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', '442b38ab-ce40-48f3-8b89-8e5ae8e69482')
    .single();
  console.log('Creator 1787749078759 profile:', JSON.stringify(creator, null, 2));

  // Check creator portfolio
  const { data: portfolios } = await supabase
    .from('portfolio_items')
    .select('*')
    .eq('user_id', '442b38ab-ce40-48f3-8b89-8e5ae8e69482');
  console.log('Portfolios:', portfolios);
}
inspectCreator();
