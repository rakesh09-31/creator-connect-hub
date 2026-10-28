async function testDirectOllama() {
  console.log('--- 1. Testing Direct Ollama (qwen3:4b) ---');
  const t0 = Date.now();
  const res = await fetch('http://127.0.0.1:11434/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'qwen3:4b',
      messages: [
        { role: 'user', content: 'Write a short 2-sentence story about a village girl who becomes a singer.' }
      ],
      stream: true,
      options: {
        num_predict: 200,
        temperature: 0.4
      }
    })
  });

  if (!res.ok) {
    console.error('Ollama error:', res.status, await res.text());
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let firstTokenTime = null;
  let fullText = '';
  let tokenCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(Boolean);
    for (const l of lines) {
      try {
        const data = JSON.parse(l);
        if (data.message?.content) {
          if (!firstTokenTime) {
            firstTokenTime = Date.now() - t0;
            console.log(`[First token from Ollama in ${firstTokenTime}ms]`);
          }
          fullText += data.message.content;
          tokenCount++;
        }
      } catch (e) {}
    }
  }

  console.log(`[Ollama Completed in ${Date.now() - t0}ms, tokens: ${tokenCount}]`);
  console.log('Result snippet:', fullText.slice(0, 150));
}

async function testBackend() {
  console.log('\n--- 2. Testing FastAPI Backend (/api/chat) ---');
  const t0 = Date.now();
  const res = await fetch('http://127.0.0.1:8001/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Write a short 2-sentence story about a village girl who becomes a singer.',
      stream: true,
      num_predict: 200
    })
  });

  if (!res.ok) {
    console.error('Backend error:', res.status, await res.text());
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let firstTokenTime = null;
  let fullText = '';
  let tokenCount = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value);
    const lines = chunk.split('\n').filter(l => l.startsWith('data: '));
    for (const l of lines) {
      try {
        const data = JSON.parse(l.replace('data: ', ''));
        if (data.token) {
          if (!firstTokenTime) {
            firstTokenTime = Date.now() - t0;
            console.log(`[First token from FastAPI in ${firstTokenTime}ms]`);
          }
          fullText += data.token;
          tokenCount++;
        }
        if (data.done) {
          console.log(`[FastAPI Done event received. Intent: ${data.intent}]`);
        }
      } catch (e) {}
    }
  }

  console.log(`[FastAPI Completed in ${Date.now() - t0}ms, chunks: ${tokenCount}]`);
  console.log('Result snippet:', fullText.slice(0, 150));
}

async function run() {
  await testDirectOllama();
  await testBackend();
}

run().catch(console.error);
