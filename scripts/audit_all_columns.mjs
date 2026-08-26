import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

const typesContent = fs.readFileSync('src/integrations/supabase/types.ts', 'utf-8');

function parseTypes() {
  const tableRegex = /([a-zA-Z0-9_]+):\s*{\s*Row:\s*{([^}]+)}/g;
  const tables = {};
  let match;
  while ((match = tableRegex.exec(typesContent)) !== null) {
    const tableName = match[1];
    const rowBody = match[2];
    const colRegex = /([a-zA-Z0-9_]+)(\??):\s*([^;\n]+)/g;
    const cols = [];
    let colMatch;
    while ((colMatch = colRegex.exec(rowBody)) !== null) {
      cols.push(colMatch[1]);
    }
    tables[tableName] = cols;
  }
  return tables;
}

const expectedTables = parseTypes();

async function runCheck() {
  console.log(`Checking ${Object.keys(expectedTables).length} tables in parallel...`);
  
  await Promise.all(Object.entries(expectedTables).map(async ([table, cols]) => {
    const { error: allColsErr } = await supabase.from(table).select(cols.join(',')).limit(0);
    if (!allColsErr) {
      console.log(`✅ [ALL COLS EXIST] ${table} (${cols.length} cols)`);
      return;
    }

    // Check if table itself doesn't exist
    const { error: tableErr } = await supabase.from(table).select('*').limit(0);
    if (tableErr && (tableErr.message.includes('Could not find the table') || tableErr.code === 'PGRST205')) {
      console.log(`❌ [TABLE MISSING] ${table}`);
      return;
    }

    // Table exists, check column by column in parallel
    const colResults = await Promise.all(cols.map(async col => {
      const { error } = await supabase.from(table).select(col).limit(0);
      return { col, missing: !!error, error: error ? error.message : null };
    }));

    const missing = colResults.filter(r => r.missing);
    const existing = colResults.filter(r => !r.missing);

    console.log(`⚠️ [TABLE EXISTS, MISSING COLS] ${table}:`);
    console.log(`   Existing (${existing.length}):`, existing.map(e => e.col).join(', '));
    console.log(`   MISSING (${missing.length}):`, missing.map(m => m.col).join(', '));
  }));
}

runCheck();
