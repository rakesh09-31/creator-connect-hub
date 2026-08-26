import fs from 'fs';
import path from 'path';

const dir = 'supabase/migrations';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

console.log(`Found ${files.length} migration files:\n`);

for (const file of files) {
  const content = fs.readFileSync(path.join(dir, file), 'utf-8');
  
  const tables = [...content.matchAll(/CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+public\.([a-zA-Z0-9_]+)/gi)].map(m => m[1]);
  const alters = [...content.matchAll(/ALTER\s+TABLE\s+public\.([a-zA-Z0-9_]+)/gi)].map(m => m[1]);
  const functions = [...content.matchAll(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+public\.([a-zA-Z0-9_]+)/gi)].map(m => m[1]);
  const policies = [...content.matchAll(/CREATE\s+POLICY\s+["']?([^"'\s]+)["']?\s+ON\s+public\.([a-zA-Z0-9_]+)/gi)].map(m => `${m[1]} ON ${m[2]}`);
  
  console.log(`=== ${file} (${content.length} bytes) ===`);
  if (tables.length) console.log(`  Tables Created: ${[...new Set(tables)].join(', ')}`);
  if (alters.length) console.log(`  Tables Altered: ${[...new Set(alters)].join(', ')}`);
  if (functions.length) console.log(`  Functions: ${[...new Set(functions)].join(', ')}`);
  if (policies.length) console.log(`  Policies (${policies.length}): ${policies.slice(0, 5).join('; ')}${policies.length > 5 ? '...' : ''}`);
  console.log('');
}
