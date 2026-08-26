import fs from 'fs';

const content = fs.readFileSync('scripts/generate_full_migration.mjs', 'utf-8');
const lines = content.split('\n');
const sqlLines = lines.slice(0, 1207);
const sql = sqlLines.join('\n');

fs.writeFileSync('supabase/migrations/20260826000000_omnicraft_complete_stabilization.sql', sql);
console.log(`Saved pure SQL file with ${sqlLines.length} lines.`);
