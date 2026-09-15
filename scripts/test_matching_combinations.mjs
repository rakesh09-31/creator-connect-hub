import {
  calculateJobMatchScore,
  calculateCreatorMatchForBrief,
  areSkillsRelated,
} from '../src/lib/job-matching.ts';

console.log('===========================================================');
console.log('TESTING REALISTIC MATCHING COMBINATIONS (REQUIREMENT 15)');
console.log('===========================================================');

const brief = {
  id: 'brief-video-edit-1',
  title: 'Lead Commercial Video Editor Needed',
  description: 'Looking for a skilled video editor to cut commercial reels and ads.',
  category: 'Video',
  skillsRequired: ['Video Editing', 'Premiere Pro', 'After Effects'],
  rolesRequired: ['Video Editor'],
  experienceLevel: 'Senior',
  location: 'Remote',
  budget: '$3,500',
  createdAt: new Date().toISOString(),
};

// Creator A: 3/3 required skills
const creatorA = {
  id: 'creator-a',
  username: 'creator_alpha',
  roles: ['Video Editor'],
  skills: ['Video Editing', 'Premiere Pro', 'After Effects', 'Photoshop'],
  specialties: ['Commercials', 'Color Grading'],
  experienceLevel: 'Senior',
};

// Creator B: 2/3 required skills
const creatorB = {
  id: 'creator-b',
  username: 'creator_beta',
  roles: ['Video Editor'],
  skills: ['Video Editing', 'Premiere Pro'],
  specialties: ['YouTube'],
  experienceLevel: 'Senior',
};

// Creator B2: 1/3 required skills
const creatorB2 = {
  id: 'creator-b2',
  username: 'creator_beta2',
  roles: ['Video Editor'],
  skills: ['Video Editing'],
  specialties: [],
  experienceLevel: 'Intermediate',
};

// Creator C: 0/3 required skills
const creatorC = {
  id: 'creator-c',
  username: 'creator_gamma',
  roles: ['Photographer'],
  skills: ['Photography', 'Lightroom', 'Figma'],
  specialties: ['Portrait'],
  experienceLevel: 'Senior',
};

// 1. Test A: Creator A vs Brief
const resA = calculateJobMatchScore(creatorA, brief);
console.log('\n--- TEST A: Creator with 3/3 Required Skills ---');
console.log(`Creator A Match Score: ${resA.matchScore}%`);
console.log(`Tier: ${resA.tier} (${resA.tierLabel})`);
console.log(`Matching Skills:`, resA.yourMatchingSkills);
console.log(`Missing Skills:`, resA.missingSkills);

// 2. Test B: Creator B vs Brief
const resB = calculateJobMatchScore(creatorB, brief);
console.log('\n--- TEST B: Creator with 2/3 Required Skills ---');
console.log(`Creator B Match Score: ${resB.matchScore}%`);
console.log(`Tier: ${resB.tier} (${resB.tierLabel})`);
console.log(`Matching Skills:`, resB.yourMatchingSkills);
console.log(`Missing Skills:`, resB.missingSkills);

// 3. Test B2: Creator B2 (1/3)
const resB2 = calculateJobMatchScore(creatorB2, brief);
console.log('\n--- TEST B2: Creator with 1/3 Required Skills ---');
console.log(`Creator B2 Match Score: ${resB2.matchScore}%`);
console.log(`Tier: ${resB2.tier} (${resB2.tierLabel})`);

// 4. Test C: Creator C (0/3)
const resC = calculateJobMatchScore(creatorC, brief);
console.log('\n--- TEST C: Creator with 0/3 Required Skills ---');
console.log(`Creator C Match Score: ${resC.matchScore}%`);
console.log(`Tier: ${resC.tier} (${resC.tierLabel})`);
console.log(`Matching Skills:`, resC.yourMatchingSkills);
console.log(`Missing Skills:`, resC.missingSkills);

// Assert ranking
if (resA.matchScore > resB.matchScore && resB.matchScore > resB2.matchScore && resB2.matchScore > resC.matchScore) {
  console.log('\n✅ PASS: Creator A (3/3: ' + resA.matchScore + '%) > Creator B (2/3: ' + resB.matchScore + '%) > Creator B2 (1/3: ' + resB2.matchScore + '%) > Creator C (0/3: ' + resC.matchScore + '%)');
} else {
  console.error('\n❌ FAIL: Ranking order violated!');
  process.exit(1);
}

if (resC.tier === 'other') {
  console.log('✅ PASS: Creator C with 0/3 required skills is partitioned to "other" (Other Opportunities)!');
} else {
  console.error('❌ FAIL: Creator C should be in "other" tier');
  process.exit(1);
}

// 5. Test D: Client brief ranking multiple creators
console.log('\n--- TEST D: Client Brief Discovery for Creators ---');
const creatorsList = [creatorC, creatorB, creatorA, creatorB2];
const rankedForClient = creatorsList
  .map(c => ({ creator: c, result: calculateCreatorMatchForBrief(brief, c) }))
  .sort((a, b) => b.result.matchScore - a.result.matchScore);

console.log('Ranked Creators for Client Brief:');
rankedForClient.forEach((item, i) => {
  console.log(`  ${i + 1}. @${item.creator.username}: ${item.result.matchScore}% (${item.result.tier}) - matched: ${item.result.creatorMatchingSkills.join(', ')}`);
});

if (rankedForClient[0].creator.username === 'creator_alpha' && rankedForClient[1].creator.username === 'creator_beta') {
  console.log('✅ PASS: Highest match is Creator A followed by Creator B!');
} else {
  console.error('❌ FAIL: Creator ranking for client is incorrect!');
  process.exit(1);
}

// 6. Test E: Search + Filter + Most Relevant
console.log('\n--- TEST E: Search + Filter + Most Relevant Working Together ---');

const briefWeb = {
  id: 'brief-web-1',
  title: 'Full Stack React Developer',
  description: 'Need React developer for dashboard',
  category: 'Development',
  skillsRequired: ['React', 'TypeScript', 'Node.js'],
  rolesRequired: ['Web Developer'],
  experienceLevel: 'Intermediate',
  location: 'Remote',
  budget: '$4,000',
  createdAt: new Date().toISOString(),
};

const briefVideoOnsite = {
  ...brief,
  id: 'brief-video-onsite',
  location: 'Onsite - Los Angeles',
};

const allBriefs = [brief, briefWeb, briefVideoOnsite];

// Scenario: Filter = "Remote", Search = "video editor", Sort = "relevant"
const filterLocation = 'remote';
const search = 'video editor';

// Step 1: Filter
const filteredBriefs = allBriefs.filter(b => {
  if (filterLocation === 'remote') {
    return (b.location || '').toLowerCase().includes('remote');
  }
  return true;
});

// Step 2: Score & Search
const scoredBriefs = filteredBriefs.map(b => ({
  brief: b,
  result: calculateJobMatchScore(creatorA, b, search),
}));

// Step 3: Sort by Most Relevant
scoredBriefs.sort((a, b) => b.result.matchScore - a.result.matchScore);

console.log('Filtered & Ranked Briefs:');
scoredBriefs.forEach(item => {
  console.log(`  - "${item.brief.title}" (${item.brief.location}) -> ${item.result.matchScore}% match`);
});

if (scoredBriefs.length === 2 && scoredBriefs[0].brief.id === 'brief-video-edit-1') {
  console.log('✅ PASS: Filter removed Onsite brief. Search + relevance prioritized Commercial Video Editor above React Developer!');
} else {
  console.error('❌ FAIL: Search + filter + relevance did not produce expected results!');
  process.exit(1);
}

console.log('\n🎉 ALL 5 TEST COMBINATIONS PASSED PERFECTLY!');
