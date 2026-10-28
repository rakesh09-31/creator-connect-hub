import http from 'http';

function postStream(payload, onChunk) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ ...payload, stream: true });
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8001,
      path: '/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let buffer = '';
      let fullText = '';
      let telemetry = null;
      let finalMeta = null;

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6).trim();
          if (jsonStr === '[DONE]') continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.token) {
              fullText += parsed.token;
              if (onChunk) onChunk(parsed.token, fullText);
            }
            if (parsed.telemetry) {
              telemetry = parsed.telemetry;
            }
            if (parsed.intent || parsed.active_story || parsed.suggested_chips) {
              finalMeta = parsed;
            }
          } catch (e) {
            // ignore partial JSON parse
          }
        }
      });

      res.on('end', () => {
        resolve({
          text: fullText,
          telemetry,
          meta: finalMeta,
        });
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runRegressionSuite() {
  console.log('===============================================================');
  console.log('REGRESSION TEST: DIRECTOR ACTION-THRILLER STORY GENERATION');
  console.log('===============================================================\n');

  // TEST 1: The exact user prompt
  const exactPrompt = "I am a director so I have an interest that I need to direct a short film on action thriller so generate the story for it.";
  console.log(`Prompt: "${exactPrompt}"\n`);
  console.log('Starting stream...');

  let chunkCount = 0;
  let firstTokenTime = null;
  const startTime = Date.now();

  const result1 = await postStream({ message: exactPrompt }, (token, accumulated) => {
    chunkCount++;
    if (!firstTokenTime) {
      firstTokenTime = Date.now() - startTime;
      console.log(`[Stream] First token received in ${firstTokenTime}ms`);
    }
    if (chunkCount % 30 === 0) {
      process.stdout.write(`.`);
    }
  });

  const totalTime = Date.now() - startTime;
  console.log(`\n[Stream Completed] in ${totalTime}ms with ${chunkCount} chunks`);
  console.log(`Generated story length: ${result1.text.length} characters`);

  // Assertions for Test 1
  assert(result1.text.length > 200, 'Story generated with substantial length (>200 chars)');
  assert(!result1.text.includes('Request timed out after 60s'), 'No 60-second timeout error occurred');
  assert(result1.telemetry !== null, 'Telemetry object was returned by engine');
  assert(result1.telemetry.intent === 'STORY_GENERATION', `Telemetry intent is STORY_GENERATION (got ${result1.telemetry?.intent})`);
  assert(result1.telemetry.completion_status === 'completed', `Completion status is 'completed' (got ${result1.telemetry?.completion_status})`);
  assert(result1.telemetry.chunks_received > 0, `Chunks recorded in telemetry (>0, got ${result1.telemetry?.chunks_received})`);
  
  // Verify story narrative context (action thriller, director, short film)
  const isActionThriller = /\b(?:thriller|action|chase|heist|agent|conspiracy|ticking|hostage|danger|escape|shadow|detective|investigation|run|gun|bullet|threat)\b/i.test(result1.text);
  assert(isActionThriller, 'Story contains authentic action-thriller narrative elements');

  console.log('\nPreview of generated story:\n----------------------------------------');
  console.log(result1.text.slice(0, 400), '...\n----------------------------------------\n');

  const activeStory = result1.text;

  // TEST 2: Story Modification 1 - "Make it more emotional"
  console.log('===============================================================');
  console.log('TEST 2: Modification 1 - "Make it more emotional"');
  console.log('===============================================================');
  const modPrompt1 = "Make it more emotional";
  const result2 = await postStream({
    message: modPrompt1,
    project_context: { active_story: activeStory },
    history: [
      { role: 'user', content: exactPrompt },
      { role: 'assistant', content: activeStory }
    ]
  });

  assert(result2.telemetry.intent === 'STORY_MODIFICATION', `Intent is STORY_MODIFICATION (got ${result2.telemetry?.intent})`);
  assert(result2.text.length > 150, 'Modified story returned substantial content');
  const hasEmotional = /\b(?:emotion|heart|tears|love|family|pain|regret|guilt|grief|hope|sacrifice|bond)\b/i.test(result2.text);
  assert(hasEmotional, 'Story incorporates emotional depth');
  console.log('Preview of emotional revision:\n', result2.text.slice(0, 300), '...\n');

  const activeStory2 = result2.text;

  // TEST 3: Story Modification 2 - "Add a villain"
  console.log('===============================================================');
  console.log('TEST 3: Modification 2 - "Add a villain"');
  console.log('===============================================================');
  const modPrompt2 = "Add a villain";
  const result3 = await postStream({
    message: modPrompt2,
    project_context: { active_story: activeStory2 },
    history: [
      { role: 'user', content: exactPrompt },
      { role: 'assistant', content: activeStory },
      { role: 'user', content: modPrompt1 },
      { role: 'assistant', content: activeStory2 }
    ]
  });

  assert(result3.telemetry.intent === 'STORY_MODIFICATION', `Intent is STORY_MODIFICATION (got ${result3.telemetry?.intent})`);
  assert(result3.text.length > 150, 'Villain addition returned substantial content');
  const hasVillain = /\b(?:villain|antagonist|enemy|ruthless|mastermind|corrupt|syndicate|nemesis|rival|assassin)\b/i.test(result3.text);
  assert(hasVillain, 'Story introduces or intensifies the villain/antagonist');
  console.log('Preview of villain addition:\n', result3.text.slice(0, 300), '...\n');

  const activeStory3 = result3.text;

  // TEST 4: Story Modification 3 - "Convert it to screenplay"
  console.log('===============================================================');
  console.log('TEST 4: Modification 3 - "Convert it to screenplay"');
  console.log('===============================================================');
  const modPrompt3 = "Convert it to screenplay";
  const result4 = await postStream({
    message: modPrompt3,
    project_context: { active_story: activeStory3 },
    history: [
      { role: 'user', content: exactPrompt },
      { role: 'assistant', content: activeStory },
      { role: 'user', content: modPrompt2 },
      { role: 'assistant', content: activeStory3 }
    ]
  });

  assert(result4.telemetry.intent === 'STORY_MODIFICATION', `Intent is STORY_MODIFICATION (got ${result4.telemetry?.intent})`);
  assert(result4.text.length > 150, 'Screenplay returned substantial content');
  const hasScreenplayFormat = /\b(?:INT\.|EXT\.|SCENE|CUT TO:|FADE IN:|CLOSE UP|ANGLE ON)\b/i.test(result4.text);
  assert(hasScreenplayFormat, 'Story successfully formatted with screenplay elements (INT./EXT./SCENE)');
  console.log('Preview of screenplay conversion:\n', result4.text.slice(0, 300), '...\n');

  console.log('===============================================================');
  console.log('ALL REGRESSION CHECKS PASSED SUCCESSFULLY!');
  console.log('===============================================================');
}

runRegressionSuite().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
