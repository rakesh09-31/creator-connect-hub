import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import {
  calculateJobMatchScore,
} from '../src/lib/job-matching.ts';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function runAllTests() {
  console.log('================================================================');
  console.log('  OMNICRAFT SKILL-BASED RECOMMENDED BRIEFS ENGINE TEST SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let total = 7;

  // --- Real Briefs for Testing ---
  const actorBrief = {
    id: 'brief-actor-001',
    title: 'Actor Needed for Lead Character in Feature Film',
    description: 'Looking for an expressive actor for a dramatic lead role. Must have strong screen performance.',
    category: 'Acting',
    skillsRequired: ['Acting', 'Screen Performance', 'Actors for Characters'],
    rolesRequired: ['Actor'],
    specialtiesRequired: ['Film Acting'],
    experienceLevel: 'Intermediate',
  };

  const videoEditorBrief = {
    id: 'brief-editor-001',
    title: 'Lead Commercial Video Editor Needed',
    description: 'Looking for a seasoned editor for commercial post-production. Timeline editing and color grading.',
    category: 'Video Editing',
    skillsRequired: ['Video Editing', 'Premiere Pro', 'After Effects', 'Color Grading'],
    rolesRequired: ['Video Editor'],
    specialtiesRequired: ['YouTube Editing'],
    experienceLevel: 'Intermediate',
  };

  const webDevBrief = {
    id: 'brief-webdev-001',
    title: 'Full Stack React & Node Web Developer',
    description: 'Build responsive web application frontend and API backend.',
    category: 'Web Development',
    skillsRequired: ['React', 'TypeScript', 'Node.js', 'Website Development'],
    rolesRequired: ['Web Developer'],
    specialtiesRequired: ['Frontend'],
    experienceLevel: 'Senior',
  };

  // -------------------------------------------------------------------------
  // TEST A: Actor profile + actor-required brief -> Show the brief
  // -------------------------------------------------------------------------
  console.log('TEST A: Actor profile + actor-required brief → Show the brief');
  const actorCreator = {
    id: 'creator-actor-01',
    username: 'john_actor',
    roles: ['Actor'],
    skills: ['Acting', 'Screen Performance'],
    specialties: ['Film Acting'],
    experienceLevel: 'Intermediate',
  };

  const scoreA = calculateJobMatchScore(actorCreator, actorBrief);
  console.log(`  Match Score: ${scoreA.matchScore}%`);
  console.log(`  Matched Skills:`, scoreA.matchedSkills);
  console.log(`  Matched Roles:`, scoreA.matchedRoles);
  const passA = scoreA.matchScore >= 50 && scoreA.isRoleMatch && scoreA.matchedSkills.length > 0;
  if (passA) {
    console.log('  ✅ TEST A PASSED: Actor matched actor brief with high score.\n');
    passed++;
  } else {
    console.error('  ❌ TEST A FAILED\n');
  }

  // -------------------------------------------------------------------------
  // TEST B: Actor profile + video-editor-required brief -> Exclude the brief
  // -------------------------------------------------------------------------
  console.log('TEST B: Actor profile + video-editor-required brief → Exclude the brief');
  const scoreB = calculateJobMatchScore(actorCreator, videoEditorBrief);
  console.log(`  Match Score: ${scoreB.matchScore}%`);
  console.log(`  Matched Skills:`, scoreB.matchedSkills);
  console.log(`  Matched Roles:`, scoreB.matchedRoles);
  const passB = scoreB.matchScore === 0 && scoreB.matchedSkills.length === 0 && !scoreB.isRoleMatch;
  if (passB) {
    console.log('  ✅ TEST B PASSED: Video editor brief strictly excluded for actor (0% match).\n');
    passed++;
  } else {
    console.error('  ❌ TEST B FAILED\n');
  }

  // -------------------------------------------------------------------------
  // TEST C: Actor and Video Editor profile + both types of briefs -> Show both
  // -------------------------------------------------------------------------
  console.log('TEST C: Actor and Video Editor profile + both types of briefs → Show both');
  const dualCreator = {
    id: 'creator-dual-01',
    username: 'multitalented_alex',
    roles: ['Actor', 'Video Editor'],
    skills: ['Acting', 'Screen Performance', 'Video Editing', 'Premiere Pro'],
    specialties: ['Film Acting', 'YouTube Editing'],
    experienceLevel: 'Intermediate',
  };

  const scoreC_Actor = calculateJobMatchScore(dualCreator, actorBrief);
  const scoreC_Editor = calculateJobMatchScore(dualCreator, videoEditorBrief);
  console.log(`  Actor Brief Match: ${scoreC_Actor.matchScore}%`);
  console.log(`  Editor Brief Match: ${scoreC_Editor.matchScore}%`);
  const passC =
    scoreC_Actor.matchScore >= 50 &&
    scoreC_Actor.matchedSkills.length > 0 &&
    scoreC_Editor.matchScore >= 50 &&
    scoreC_Editor.matchedSkills.length > 0;
  if (passC) {
    console.log('  ✅ TEST C PASSED: Dual-role creator successfully matched both briefs.\n');
    passed++;
  } else {
    console.error('  ❌ TEST C FAILED\n');
  }

  // -------------------------------------------------------------------------
  // TEST D: Photographer profile + web-development brief -> Exclude the brief
  // -------------------------------------------------------------------------
  console.log('TEST D: Photographer profile + web-development brief → Exclude the brief');
  const photographerCreator = {
    id: 'creator-photo-01',
    username: 'lisa_lens',
    roles: ['Photographer'],
    skills: ['Photography', 'Lightroom', 'Portraits'],
    specialties: ['Portrait Photography'],
    experienceLevel: 'Intermediate',
  };

  const scoreD = calculateJobMatchScore(photographerCreator, webDevBrief);
  console.log(`  Match Score: ${scoreD.matchScore}%`);
  console.log(`  Matched Skills:`, scoreD.matchedSkills);
  console.log(`  Matched Roles:`, scoreD.matchedRoles);
  const passD = scoreD.matchScore === 0 && scoreD.matchedSkills.length === 0 && !scoreD.isRoleMatch;
  if (passD) {
    console.log('  ✅ TEST D PASSED: Web-development brief strictly excluded for photographer.\n');
    passed++;
  } else {
    console.error('  ❌ TEST D FAILED\n');
  }

  // -------------------------------------------------------------------------
  // TEST E: Empty skills or missing profile -> Do not show arbitrary recommendations
  // -------------------------------------------------------------------------
  console.log('TEST E: Empty skills or missing profile → Do not show arbitrary recommendations');
  const emptyCreator = {
    id: 'creator-empty-01',
    username: 'new_unonboarded_user',
    roles: [],
    skills: [],
    specialties: [],
  };

  const scoreE_Actor = calculateJobMatchScore(emptyCreator, actorBrief);
  const scoreE_Editor = calculateJobMatchScore(emptyCreator, videoEditorBrief);
  const scoreE_Web = calculateJobMatchScore(emptyCreator, webDevBrief);
  console.log(`  Empty profile vs Actor brief: ${scoreE_Actor.matchScore}%`);
  console.log(`  Empty profile vs Editor brief: ${scoreE_Editor.matchScore}%`);
  console.log(`  Empty profile vs WebDev brief: ${scoreE_Web.matchScore}%`);
  const passE = scoreE_Actor.matchScore === 0 && scoreE_Editor.matchScore === 0 && scoreE_Web.matchScore === 0;
  if (passE) {
    console.log('  ✅ TEST E PASSED: Empty creator profile receives 0% and 0 arbitrary recommendations.\n');
    passed++;
  } else {
    console.error('  ❌ TEST E FAILED\n');
  }

  // -------------------------------------------------------------------------
  // TEST F: Client posts a new brief requiring an actor -> It becomes eligible
  // -------------------------------------------------------------------------
  console.log('TEST F: Client posts a new brief requiring an actor → Eligible for matching actor profiles');
  const newClientActorBrief = {
    id: 'brief-new-actor-999',
    title: 'Urgent: Theatre Actor for Upcoming Production',
    description: 'Casting an actor for upcoming play. Auditions next week.',
    category: 'Performing Arts',
    skillsRequired: ['Acting', 'Voice Acting', 'Stage Acting'],
    rolesRequired: ['Actor'],
    specialtiesRequired: ['Theatre Acting'],
    experienceLevel: 'Intermediate',
  };

  const scoreF_Actor = calculateJobMatchScore(actorCreator, newClientActorBrief);
  const scoreF_Photographer = calculateJobMatchScore(photographerCreator, newClientActorBrief);
  console.log(`  Actor Creator match for new brief: ${scoreF_Actor.matchScore}%`);
  console.log(`  Photographer Creator match for new brief: ${scoreF_Photographer.matchScore}%`);
  const passF = scoreF_Actor.matchScore >= 50 && scoreF_Photographer.matchScore === 0;
  if (passF) {
    console.log('  ✅ TEST F PASSED: New actor brief is immediately eligible for actor, excluded for photographer.\n');
    passed++;
  } else {
    console.error('  ❌ TEST F FAILED\n');
  }

  // -------------------------------------------------------------------------
  // TEST G: User changes their skills -> Recommendations update accordingly
  // -------------------------------------------------------------------------
  console.log('TEST G: User changes their skills → Recommendations update accordingly');
  // Creator starts as Actor
  const evolvingCreator = {
    id: 'creator-evolving-01',
    username: 'alex_pivot',
    roles: ['Actor'],
    skills: ['Acting'],
    specialties: ['Film Acting'],
  };

  const beforeChangeActor = calculateJobMatchScore(evolvingCreator, actorBrief);
  const beforeChangeEditor = calculateJobMatchScore(evolvingCreator, videoEditorBrief);

  // Creator updates skills to Video Editor
  const updatedCreator = {
    ...evolvingCreator,
    roles: ['Video Editor'],
    skills: ['Video Editing', 'Premiere Pro'],
    specialties: ['YouTube Editing'],
  };

  const afterChangeActor = calculateJobMatchScore(updatedCreator, actorBrief);
  const afterChangeEditor = calculateJobMatchScore(updatedCreator, videoEditorBrief);

  console.log(`  Before skill change: Actor brief=${beforeChangeActor.matchScore}%, Editor brief=${beforeChangeEditor.matchScore}%`);
  console.log(`  After skill change:  Actor brief=${afterChangeActor.matchScore}%, Editor brief=${afterChangeEditor.matchScore}%`);

  const passG =
    beforeChangeActor.matchScore >= 50 &&
    beforeChangeEditor.matchScore === 0 &&
    afterChangeActor.matchScore === 0 &&
    afterChangeEditor.matchScore >= 50;

  if (passG) {
    console.log('  ✅ TEST G PASSED: Profile skill change cleanly flips recommended briefs.\n');
    passed++;
  } else {
    console.error('  ❌ TEST G FAILED\n');
  }

  // -------------------------------------------------------------------------
  // Live Database RPC Verification
  // -------------------------------------------------------------------------
  console.log('----------------------------------------------------------------');
  console.log('  VERIFYING LIVE DATABASE RPC (get_recommended_jobs_for_creator)');
  console.log('----------------------------------------------------------------');

  // Test live RPC on Actor profile: 5e7c0af7-c68f-4bd3-b12f-17d0ad09d42a
  const { data: actorRecs, error: rpcErr1 } = await supabase.rpc('get_recommended_jobs_for_creator', {
    p_creator_id: '5e7c0af7-c68f-4bd3-b12f-17d0ad09d42a',
    p_limit: 10
  });

  if (rpcErr1) {
    console.error('  ❌ Live RPC error for Actor:', rpcErr1);
  } else {
    console.log(`  Actor RPC returned ${actorRecs.length} briefs:`, actorRecs.map(r => `"${r.title}" (${r.matching_score}%)`));
    const allRelevant = actorRecs.every(r => r.title.toLowerCase().includes('actor') || r.matched_skills.some(s => s.includes('actor') || s.includes('acting')));
    console.log(`  Strict relevance verified for live Actor RPC: ${allRelevant}`);
  }

  // Test live RPC on Empty profile: d4cd89c3-6854-4036-b406-19bd8f6593d2
  const { data: emptyRecs, error: rpcErr2 } = await supabase.rpc('get_recommended_jobs_for_creator', {
    p_creator_id: 'd4cd89c3-6854-4036-b406-19bd8f6593d2',
    p_limit: 10
  });

  if (rpcErr2) {
    console.error('  ❌ Live RPC error for Empty profile:', rpcErr2);
  } else {
    console.log(`  Empty profile RPC returned ${emptyRecs.length} briefs (Expected: 0).`);
  }

  console.log('\n================================================================');
  console.log(`  TEST RESULTS: ${passed}/${total} TESTS PASSED!`);
  console.log('================================================================');
  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runAllTests();
