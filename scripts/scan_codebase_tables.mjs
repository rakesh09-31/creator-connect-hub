import fs from 'fs';
import path from 'path';

function findFiles(dir, exts = ['.ts', '.tsx', '.js', '.jsx']) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git') {
        files = files.concat(findFiles(full, exts));
      }
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(full);
    }
  }
  return files;
}

const srcFiles = findFiles('./src');

const tableCounts = new Map();
const rpcCounts = new Map();
const storageCounts = new Map();

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf-8');
  
  // match .from('table')
  const fromMatches = content.matchAll(/\.from\(\s*['"]([a-zA-Z0-9_]+)['"]\s*\)/g);
  for (const m of fromMatches) {
    tableCounts.set(m[1], (tableCounts.get(m[1]) || 0) + 1);
  }
  
  // match .rpc('fn_name')
  const rpcMatches = content.matchAll(/\.rpc\(\s*['"]([a-zA-Z0-9_]+)['"]/g);
  for (const m of rpcMatches) {
    rpcCounts.set(m[1], (rpcCounts.get(m[1]) || 0) + 1);
  }
  
  // match .storage.from('bucket')
  const storageMatches = content.matchAll(/storage\.from\(\s*['"]([a-zA-Z0-9_-]+)['"]/g);
  for (const m of storageMatches) {
    storageCounts.set(m[1], (storageCounts.get(m[1]) || 0) + 1);
  }
}

console.log('--- ALL ACCESSED TABLES (' + tableCounts.size + ') ---');
for (const [table, count] of Array.from(tableCounts.entries()).sort((a, b) => b[1] - a[1])) {
  console.log(`${table.padEnd(35)} : ${count} usages`);
}

console.log('\n--- ALL ACCESSED RPCs (' + rpcCounts.size + ') ---');
for (const [rpc, count] of Array.from(rpcCounts.entries()).sort((a, b) => b[1] - a[1])) {
  console.log(`${rpc.padEnd(35)} : ${count} usages`);
}

console.log('\n--- ALL ACCESSED STORAGE BUCKETS (' + storageCounts.size + ') ---');
for (const [bucket, count] of Array.from(storageCounts.entries()).sort((a, b) => b[1] - a[1])) {
  console.log(`${bucket.padEnd(35)} : ${count} usages`);
}
