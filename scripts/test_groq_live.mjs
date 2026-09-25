import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const lines = envContent.split(/\r?\n/);
const keyLine = lines.find(l => l.startsWith('GROQ_API_KEY='));
const modelLine = lines.find(l => l.startsWith('GROQ_MODEL='));

let apiKey = keyLine ? keyLine.substring('GROQ_API_KEY='.length).trim() : '';
if ((apiKey.startsWith('"') && apiKey.endsWith('"')) || (apiKey.startsWith("'") && apiKey.endsWith("'"))) {
  apiKey = apiKey.slice(1, -1).trim();
}
const configuredModel = modelLine ? modelLine.substring('GROQ_MODEL='.length).trim() : 'llama-3.3-70b-versatile';

console.log('Key length after unquoting:', apiKey.length);
console.log('Starts with gsk_:', apiKey.startsWith('gsk_'));
console.log('Testing configured model:', configuredModel);

async function testModel(modelName) {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: 'Say hello in 5 words' }],
        max_tokens: 50
      })
    });
    const status = res.status;
    const json = await res.json();
    console.log(`\n[Model: ${modelName}] Status: ${status}`);
    if (status === 200) {
      console.log('Success! Message:', json.choices?.[0]?.message?.content);
    } else {
      console.log('Error payload:', JSON.stringify(json));
    }
  } catch (err) {
    console.error(`Fetch error for ${modelName}:`, err.message);
  }
}

async function listModels() {
  try {
    const res = await fetch('https://api.groq.com/openai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const json = await res.json();
    console.log('\nAvailable models on this key:');
    if (json.data) {
      const ids = json.data.map(m => m.id).sort();
      console.log(ids);
    } else {
      console.log(json);
    }
  } catch (err) {
    console.error('List models error:', err.message);
  }
}

import { OMNIFORGE_TOOL_DEFINITIONS } from '../src/lib/omniforge/server/tools.server.js';

async function testTools(modelName) {
  const start = Date.now();
  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: 'user', content: 'can you provide the steps to develop the ecommerce website' }],
        tools: OMNIFORGE_TOOL_DEFINITIONS.map(t => ({
          type: 'function',
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters
          }
        })),
        tool_choice: 'auto',
        max_tokens: 1000
      })
    });
    const status = res.status;
    const json = await res.json();
    console.log(`[Model: ${modelName}] Status: ${status} in ${Date.now() - start}ms`);
    console.log('Full text:\n', json.choices?.[0]?.message?.content);
    console.log('Tool calls:\n', json.choices?.[0]?.message?.tool_calls);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

async function run() {
  console.log('Testing qwen/qwen3.8-27b with tools:');
  await testTools('qwen/qwen3.8-27b');
}

run();


