import http from 'http';

function postChat(payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request({
      hostname: '127.0.0.1',
      port: 8001,
      path: '/api/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error(`Failed to parse JSON: ${body}`));
        }
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

async function runStorySuite() {
  console.log('==============================================');
  console.log('OMNIFORGE CORE NARRATIVE GOAL & STORY SUITE');
  console.log('==============================================\n');

  // TEST 1: Village Girl Becomes a Singer
  console.log('>>> TEST 1: Village girl becomes a singer <<<');
  const res1 = await postChat({
    message: 'generate a short story about a village girl who becomes a singer',
    stream: false,
  });

  assert(res1.success === true, 'Response indicates success');
  assert(res1.intent === 'STORY_GENERATION', `Intent is STORY_GENERATION (got ${res1.intent})`);
  assert(!res1.answer.includes('OmniCraft'), 'Story does not contain "OmniCraft" platform terminology');
  assert(!res1.answer.includes('Supabase'), 'Story does not contain "Supabase"');
  assert(!res1.answer.includes('database'), 'Story does not contain "database"');
  assert(!res1.answer.toLowerCase().includes('disclaimer'), 'Story does not contain disclaimers');

  // Core Goal Transformation Check
  const hasSingerOutcome = /\b(?:singer|became a singer|recognized singer|singing for|sang for the|applause|audience)\b/i.test(res1.answer);
  assert(hasSingerOutcome, 'Story explicitly develops and reaches the singer transformation');

  assert(Array.isArray(res1.suggested_chips) && res1.suggested_chips.includes('Make More Emotional'), 'Follow-up actions include "Make More Emotional"');
  assert(res1.suggested_chips.includes('Add a Villain'), 'Follow-up actions include "Add a Villain"');
  assert(res1.suggested_chips.includes('Convert to Screenplay'), 'Follow-up actions include "Convert to Screenplay"');
  console.log('Test 1 output preview:\n', res1.answer.slice(0, 300), '...\n');

  // TEST 2: Boy becomes a filmmaker
  console.log('>>> TEST 2: Boy who becomes a filmmaker <<<');
  const resFilm = await postChat({
    message: 'write a story about a boy who becomes a filmmaker',
    stream: false,
  });

  assert(resFilm.success === true, 'Response indicates success');
  assert(resFilm.intent === 'STORY_GENERATION', `Intent is STORY_GENERATION (got ${resFilm.intent})`);
  const hasFilmOutcome = /\b(?:film|camera|filmmaker|direct|screening|screen|festival|movie)\b/i.test(resFilm.answer);
  assert(hasFilmOutcome, 'Story explicitly develops the boy becoming a filmmaker');
  console.log('Test 2 output preview:\n', resFilm.answer.slice(0, 300), '...\n');

  // TEST 3: Student who builds a startup
  console.log('>>> TEST 3: Student who builds a startup <<<');
  const resStartup = await postChat({
    message: 'create a story about a student who builds a startup',
    stream: false,
  });

  assert(resStartup.success === true, 'Response indicates success');
  assert(resStartup.intent === 'STORY_GENERATION', `Intent is STORY_GENERATION (got ${resStartup.intent})`);
  const hasStartupOutcome = /\b(?:startup|company|code|launch|platform|app|founder|product|users)\b/i.test(resStartup.answer);
  assert(hasStartupOutcome, 'Story explicitly develops the student building a startup');
  console.log('Test 3 output preview:\n', resStartup.answer.slice(0, 300), '...\n');

  // TEST 4: Continuity - Make it more emotional (Preserves singer goal)
  console.log('>>> TEST 4: Make it more emotional (Preserves singer goal) <<<');
  const history1 = [
    { role: 'user', content: 'generate a short story about a village girl who becomes a singer' },
    { role: 'assistant', content: res1.answer }
  ];

  const res2 = await postChat({
    message: 'make it more emotional',
    history: history1,
    stream: false,
  });

  assert(res2.intent === 'STORY_MODIFICATION', `Intent is STORY_MODIFICATION (got ${res2.intent})`);
  assert(/\b(?:sing|song|voice|music|melody)\b/i.test(res2.answer), 'Emotional modification preserves the core singing goal');
  console.log('Test 4 output preview:\n', res2.answer.slice(0, 300), '...\n');

  // TEST 5: Continuity - Add a villain (Creates obstacle to singing)
  console.log('>>> TEST 5: Add a villain (Opposes singing goal) <<<');
  const history2 = [
    ...history1,
    { role: 'user', content: 'make it more emotional' },
    { role: 'assistant', content: res2.answer }
  ];

  const res3 = await postChat({
    message: 'add a villain',
    history: history2,
    stream: false,
  });

  assert(res3.intent === 'STORY_MODIFICATION', `Intent is STORY_MODIFICATION (got ${res3.intent})`);
  assert(/\b(?:sing|song|voice|music|elder|stop|forbid)\b/i.test(res3.answer), 'Villain addition relates to the singing journey');
  console.log('Test 5 output preview:\n', res3.answer.slice(0, 300), '...\n');

  // TEST 6: Continuity - Convert to screenplay (Preserves scene & performance)
  console.log('>>> TEST 6: Convert to screenplay (Preserves character arc) <<<');
  const history3 = [
    ...history2,
    { role: 'user', content: 'add a villain' },
    { role: 'assistant', content: res3.answer }
  ];

  const res4 = await postChat({
    message: 'convert it to screenplay',
    history: history3,
    stream: false,
  });

  assert(res4.intent === 'STORY_MODIFICATION', `Intent is STORY_MODIFICATION (got ${res4.intent})`);
  assert(/\b(?:EXT|INT)\./i.test(res4.answer) || /\bSCENE\b/i.test(res4.answer), 'Screenplay contains scene slug (EXT. or INT.)');
  assert(/\b(?:sing|song|voice|music)\b/i.test(res4.answer), 'Screenplay preserves the singer character arc');
  console.log('Test 6 output preview:\n', res4.answer.slice(0, 300), '...\n');

  console.log('==============================================');
  console.log('ALL NARRATIVE TRANSFORMATION TESTS PASSED!');
  console.log('==============================================');
}

runStorySuite().catch(err => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
