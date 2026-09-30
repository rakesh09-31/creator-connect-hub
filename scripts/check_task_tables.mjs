import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function checkTaskTables() {
  const possible = [
    'squad_tasks', 'collaboration_tasks', 'workspace_tasks',
    'squad_projects', 'omniforge_projects', 'omniforge_tasks',
    'project_tasks', 'job_tasks', 'tasks'
  ];
  for (const p of possible) {
    const { error } = await supabase.from(p).select('*').limit(1);
    console.log(`${p}: ${error ? error.message : 'EXISTS'}`);
  }
}

checkTaskTables();
