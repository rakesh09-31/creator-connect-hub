import { 
  buildCompleteVideoEditingRoadmap, 
  buildCompleteDSARoadmap, 
  buildUniversalRoadmap,
  getCanonicalRoadmapTitle,
  cleanAndExtractGoalSubject,
  validateAndSanitizeRoadmap
} from '../src/lib/omniforge/universal-roadmap';
import { VIDEO_EDITING_BLUEPRINT } from '../src/lib/omniforge/curriculum/video-editing-curriculum';
import { DSA_BLUEPRINT } from '../src/lib/omniforge/curriculum/dsa-curriculum';
import { classifyUserIntent } from '../src/lib/omniforge/intent';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    throw new Error(`Assertion failed: ${msg}`);
  }
  console.log(`✅ PASSED: ${msg}`);
}

async function runMasterVerification() {
  console.log('\n======================================================');
  console.log('🎬 RUNNING OMNIFORGE MASTER CURRICULUM & PERSISTENCE SUITE');
  console.log('======================================================\n');

  // --- SECTION 1: CANONICAL TITLE & SUBJECT EXTRACTION ---
  console.log('--- SECTION 1: Canonical Titles & Prompt Sanitization ---');
  const prompt1 = 'can you generate a complete video editing roadmap from basic to advanced';
  const extracted1 = cleanAndExtractGoalSubject(prompt1);
  assert(extracted1.subject === 'Video Editing', `Extracted subject must be 'Video Editing' (got '${extracted1.subject}')`);
  
  const title1 = getCanonicalRoadmapTitle(extracted1.subject, 'LEARNING', prompt1);
  assert(title1 === 'Complete Video Editing Roadmap', `Title must be 'Complete Video Editing Roadmap' (got '${title1}')`);
  assert(!title1.toLowerCase().includes('can you'), `Title must not contain 'can you'`);
  assert(!title1.toLowerCase().includes('generate'), `Title must not contain 'generate'`);

  const prompt2 = 'Generate a complete DSA roadmap';
  const extracted2 = cleanAndExtractGoalSubject(prompt2);
  assert(extracted2.subject.toLowerCase().includes('data structures') || extracted2.subject === 'DSA', `Extracted subject must be DSA / Data Structures (got '${extracted2.subject}')`);
  const title2 = getCanonicalRoadmapTitle(extracted2.subject, 'LEARNING', prompt2);
  assert(title2 === 'Data Structures and Algorithms Roadmap', `Title must be 'Data Structures and Algorithms Roadmap' (got '${title2}')`);

  // --- SECTION 2: VIDEO EDITING CURRICULUM AUTHENTICITY ---
  console.log('\n--- SECTION 2: Video Editing Curriculum Integrity ---');
  const veRoadmap = buildCompleteVideoEditingRoadmap('conv-ve-1', 'user-ve-1');
  assert(veRoadmap.stages.length === 10, `Video editing must have 10 stages (got ${veRoadmap.stages.length})`);
  assert(veRoadmap.nodes.length === 10, `Video editing nodes must have 10 nodes (got ${veRoadmap.nodes.length})`);
  assert(veRoadmap.title === 'Complete Video Editing Roadmap', `Title must be 'Complete Video Editing Roadmap' (got '${veRoadmap.title}')`);
  assert(veRoadmap.subject === 'Video Editing', `Subject must be 'Video Editing' (got '${veRoadmap.subject}')`);
  assert(veRoadmap.goal.includes('Video Editing'), `Goal must include 'Video Editing' (got '${veRoadmap.goal}')`);

  // Check creative domain authenticity & ZERO software development boilerplate
  const fullVEContent = JSON.stringify(veRoadmap).toLowerCase();
  
  const forbiddenTechTerms = [
    'npm test',
    'interface i',
    'runtime errors',
    'compiler',
    'runcodewithtimeout',
    '0 runtime errors',
    'automated tests',
    'production deployment pipeline'
  ];

  for (const forbidden of forbiddenTechTerms) {
    assert(!fullVEContent.includes(forbidden), `Video editing roadmap must NEVER contain software boilerplate '${forbidden}'`);
  }

  const requiredCreativeTerms = [
    'nle',
    'proxy',
    'cut',
    'audio',
    'davinci',
    'premiere',
    'waveform',
    'vectorscope',
    'showreel'
  ];

  for (const term of requiredCreativeTerms) {
    assert(fullVEContent.includes(term), `Video editing roadmap must contain authentic creative term '${term}'`);
  }

  // --- SECTION 3: DSA CURRICULUM INTEGRITY ---
  console.log('\n--- SECTION 3: DSA Curriculum Integrity ---');
  const dsaRoadmap = buildCompleteDSARoadmap('conv-dsa-1', 'user-dsa-1');
  assert(dsaRoadmap.stages.length === 14, `DSA roadmap must have 14 stages (got ${dsaRoadmap.stages.length})`);
  assert(dsaRoadmap.nodes.length === 14, `DSA roadmap nodes must have 14 nodes (got ${dsaRoadmap.nodes.length})`);
  assert(dsaRoadmap.title === 'Data Structures and Algorithms Roadmap', `Title must be 'Data Structures and Algorithms Roadmap' (got '${dsaRoadmap.title}')`);
  
  const fullDSAContent = JSON.stringify(dsaRoadmap).toLowerCase();
  const requiredDSATerms = [
    'asymptotic',
    'big-o',
    'two-pointer',
    'sliding window',
    'linked list',
    'binary search tree',
    'dynamic programming',
    'interview'
  ];

  for (const term of requiredDSATerms) {
    assert(fullDSAContent.includes(term), `DSA roadmap must contain DSA term '${term}'`);
  }

  // --- SECTION 4: UNIVERSAL ROADMAP DISPATCHER ---
  console.log('\n--- SECTION 4: Universal Roadmap Dispatcher Dispatch ---');
  const dispatchedVE = buildUniversalRoadmap(
    'can you generate a complete video editing roadmap from basic to advanced',
    'conv-ve-dispatch',
    'user-ve-dispatch'
  );
  assert(dispatchedVE.title === 'Complete Video Editing Roadmap', `Dispatched VE title must be canonical (got '${dispatchedVE.title}')`);
  assert(dispatchedVE.stages.length === 10, `Dispatched VE must have 10 stages (got ${dispatchedVE.stages.length})`);

  const dispatchedDSA = buildUniversalRoadmap(
    'can you generate a complete DSA roadmap',
    'conv-dsa-dispatch',
    'user-dsa-dispatch'
  );
  assert(dispatchedDSA.title === 'Data Structures and Algorithms Roadmap', `Dispatched DSA title must be canonical (got '${dispatchedDSA.title}')`);
  assert(dispatchedDSA.stages.length === 14, `Dispatched DSA must have 14 stages (got ${dispatchedDSA.stages.length})`);

  // --- SECTION 5: SANITIZATION & ARTIFACT PERSISTENCE VALIDATION ---
  console.log('\n--- SECTION 5: Sanitization and Artifact Compatibility ---');
  const sanitizeResultVE = validateAndSanitizeRoadmap(dispatchedVE);
  assert(sanitizeResultVE.valid, `Sanitized VE roadmap must be valid`);
  assert(sanitizeResultVE.roadmap.stages.length === 10, `Sanitized VE roadmap must preserve 10 stages`);

  const sanitizeResultDSA = validateAndSanitizeRoadmap(dispatchedDSA);
  assert(sanitizeResultDSA.valid, `Sanitized DSA roadmap must be valid`);
  assert(sanitizeResultDSA.roadmap.stages.length === 14, `Sanitized DSA roadmap must preserve 14 stages`);

  // --- SECTION 6: ZERO CREATOR SEARCH TRAPS ---
  console.log('\n--- SECTION 6: Verification of Anti-Search Trapping ---');
  const saveQueries = [
    'add this roadmap to my Roadmaps section',
    'add it to my Roadmaps section',
    'save it',
    'save this roadmap',
    'save roadmap'
  ];

  for (const sq of saveQueries) {
    const intentRes = classifyUserIntent(sq);
    assert(intentRes.intent === 'SAVE_ROADMAP', `'${sq}' must classify as SAVE_ROADMAP (got ${intentRes.intent})`);
    assert(intentRes.matching_action !== 'SEARCH_CREATORS', `'${sq}' must NEVER trigger SEARCH_CREATORS (got ${intentRes.matching_action})`);
  }

  const skillQueries = [
    'what skills do i need to become a video editor',
    'what skills are required for video editing',
    'how to become a video editor'
  ];

  for (const sk of skillQueries) {
    const intentRes = classifyUserIntent(sk);
    assert(intentRes.intent === 'EXPLAIN_TOPIC', `'${sk}' must classify as EXPLAIN_TOPIC (got ${intentRes.intent})`);
    assert(intentRes.matching_action !== 'SEARCH_CREATORS', `'${sk}' must NEVER trigger SEARCH_CREATORS (got ${intentRes.matching_action})`);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL 24 MASTER ACCEPTANCE TESTS PASSED WITH 100% SUCCESS');
  console.log('======================================================\n');
}

runMasterVerification().catch(err => {
  console.error('Master verification failed:', err);
  process.exit(1);
});
