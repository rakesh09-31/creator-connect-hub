import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split(/\r?\n/);
const keyLine = lines.find(l => l.startsWith('GROQ_API_KEY='));
const modelLine = lines.find(l => l.startsWith('GROQ_MODEL='));

if (keyLine) {
  const val = keyLine.substring('GROQ_API_KEY='.length);
  console.log('val length:', val.length);
  console.log('first char code:', val.charCodeAt(0));
  console.log('prefix characters:', val.slice(0, 4));
}
if (modelLine) {
  console.log('model:', modelLine.substring('GROQ_MODEL='.length));
}
