import { cleanAndExtractGoalSubject, detectRoadmapSubject, buildUniversalRoadmap } from '../src/lib/omniforge/universal-roadmap';
import { classifyUserIntent } from '../src/lib/omniforge/intent';

const queries = [
  'I need a complete roadmap for video editing from basic to advanced',
  'can you generate a complete video editing roadmap from basic to advanced',
  'roadmap for video editing from basic to advanced',
  'Generate a complete DSA roadmap',
  'Plan the complete production of a short film',
  'I want to learn video editing from basic to advanced',
  'what skills do i need to become a video editor',
  'add this roadmap to my Roadmaps section',
  'add it to my Roadmaps section',
  'save it',
  'save roadmap',
  'show my saved roadmaps',
  'Find all video editors',
];

console.log('=== SUBJECT EXTRACTION & INTENT CLASSIFICATION TEST ===');
for (const q of queries) {
  const extracted = cleanAndExtractGoalSubject(q);
  const detected = detectRoadmapSubject(q);
  const intent = classifyUserIntent(q);
  console.log(`\nQuery: "${q}"`);
  console.log(`  Extracted Subject: "${extracted.subject}", Domain: "${extracted.domain}", isAmbiguous: ${extracted.isAmbiguous}`);
  console.log(`  Detected Subject: "${detected.subject}", Domain: "${detected.domain}", Type: ${detected.type}`);
  console.log(`  Intent: "${intent.intent}", MatchingAction: "${intent.matching_action}", TargetRole: "${intent.targetRole}"`);
}
