import { evaluateRoleMatchEvidence, searchCreatorsDirectory } from '../src/lib/omniforge/matcher';
import { RealCreatorProfile } from '../src/lib/omniforge/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`✓ ${message}`);
}

async function runRegressionTests() {
  console.log("=== RUNNING MATCHER QUALITY REGRESSION TESTS ===\n");

  // 1. Photoshop-only creator cannot become 98% Lead Actor
  const photoshopActor: RealCreatorProfile = {
    id: "test-ps-actor",
    username: "ps_actor",
    fullName: "Photoshop Guy",
    avatarUrl: null,
    role: "Actor",
    bio: "Actor with photoshop skills",
    skills: ["Adobe Photoshop"],
    specialties: ["Action"],
    roles: ["Actor"],
    portfolioItemsCount: 0,
    portfolioSamples: [],
  };
  const evalPsActor = evaluateRoleMatchEvidence(photoshopActor, "Lead Actor");
  assert(
    evalPsActor.score <= 65,
    `Photoshop-only actor score is capped (got ${evalPsActor.score}%, expected <= 65%, cannot be 98%)`
  );
  assert(
    !evalPsActor.skillsMatched.includes("Adobe Photoshop"),
    "Photoshop is NOT matched as an acting skill"
  );
  assert(
    !evalPsActor.reason.includes("Adobe Photoshop"),
    "Why Match reason does NOT cite Photoshop as acting evidence"
  );

  // 2. Illustrator/Branding-only creator cannot become 98% Sound Designer (must be 0 or rejected)
  const illustratorDesigner: RealCreatorProfile = {
    id: "test-illus-designer",
    username: "omniforger_fresh",
    fullName: "Graphic Designer Fresh",
    avatarUrl: null,
    role: "Designer",
    bio: "Brand identity designer",
    skills: ["Adobe Illustrator", "Branding & Identity"],
    specialties: ["Brand Identity", "UI/UX"],
    roles: ["Designer"],
    portfolioItemsCount: 0,
    portfolioSamples: [],
  };
  const evalSoundFresh = evaluateRoleMatchEvidence(illustratorDesigner, "Sound Designer");
  assert(
    evalSoundFresh.score === 0,
    `Illustrator/Branding creator gets 0% for Sound Designer (got ${evalSoundFresh.score}%)`
  );
  assert(
    evalSoundFresh.reason === "Limited role-specific evidence found.",
    "Illustrator designer gives 'Limited role-specific evidence found.' for Sound Designer"
  );

  // 3. Cinematography-only creator cannot become 98% Lead Actor
  const cineActor: RealCreatorProfile = {
    id: "test-cine-actor",
    username: "vinay",
    fullName: "Vinay",
    avatarUrl: null,
    role: "Actor",
    bio: "Camera and acting enthusiast",
    skills: ["Cinematography"],
    specialties: ["Film Acting"],
    roles: ["Actor"],
    portfolioItemsCount: 1,
    portfolioSamples: [{ title: "restaurent website" }],
  };
  const evalCineActor = evaluateRoleMatchEvidence(cineActor, "Lead Actor");
  assert(
    evalCineActor.score <= 65,
    `Cinematography-only actor score is capped at moderate evidence (got ${evalCineActor.score}%, cannot be 98%)`
  );
  assert(
    !evalCineActor.skillsMatched.includes("Cinematography"),
    "Cinematography is NOT matched as an acting skill"
  );

  // 4. Male actor CANNOT become Lead Actress / Heroine (Role & Gender Purity)
  const evalActressVinay = evaluateRoleMatchEvidence(cineActor, "Lead Actress");
  assert(
    evalActressVinay.score === 0,
    `Male actor cannot match Lead Actress (got ${evalActressVinay.score}%, expected 0%)`
  );

  // 5. Real Video Editor + Adobe Premiere Pro gets strong Video Editor evidence
  const videoEditorCreator: RealCreatorProfile = {
    id: "test-editor",
    username: "pro_editor",
    fullName: "Pro Editor",
    avatarUrl: null,
    role: "Video Editor",
    bio: "Cinematic film editor and colorist",
    skills: ["Adobe Premiere Pro", "DaVinci Resolve"],
    specialties: ["YouTube Editing", "Film Editing"],
    roles: ["Video Editor"],
    portfolioItemsCount: 1,
    portfolioSamples: [{ title: "Cinematic Short Reel 2026", description: "Edited in Premiere Pro" }],
  };
  const evalEditor = evaluateRoleMatchEvidence(videoEditorCreator, "Video Editor");
  assert(
    evalEditor.score >= 85,
    `Video Editor with Premiere Pro and Reel gets top-tier score (got ${evalEditor.score}%, expected >= 85%)`
  );
  assert(
    evalEditor.skillsMatched.includes("Adobe Premiere Pro"),
    "Premiere Pro is matched as video editing skill"
  );
  assert(
    evalEditor.portfolioMatches.length > 0,
    "Portfolio reel is matched as video editing evidence"
  );
  assert(
    evalEditor.reason.includes("Adobe Premiere Pro") && evalEditor.reason.includes("Cinematic Short Reel"),
    "Why Match reason explains profile role, skill, and portfolio piece"
  );

  // 6. Real Dancer + dance competency gets strong Dancer evidence
  const dancerCreator: RealCreatorProfile = {
    id: "test-dancer",
    username: "dhee_dancer",
    fullName: "Raju Dancer",
    avatarUrl: null,
    role: "Dancer",
    bio: "Hip hop and contemporary performer",
    skills: ["Contemporary Dance", "Hip-hop"],
    specialties: ["Dancer", "Choreographer"],
    roles: ["Dancer"],
    portfolioItemsCount: 1,
    portfolioSamples: [{ title: "Dance Routine Championship", description: "Stage choreography" }],
  };
  const evalDancer = evaluateRoleMatchEvidence(dancerCreator, "Dancer");
  assert(
    evalDancer.score >= 85,
    `Dancer with skills and routine gets top-tier score (got ${evalDancer.score}%, expected >= 85%)`
  );
  assert(
    evalDancer.skillsMatched.includes("Contemporary Dance"),
    "Contemporary dance is matched as dancer skill"
  );

  // 7. Real Singer + singing competency gets strong Singer evidence
  const singerCreator: RealCreatorProfile = {
    id: "test-singer",
    username: "playback_shreya",
    fullName: "Shreya Vocalist",
    avatarUrl: null,
    role: "Lead Singer",
    bio: "Playback singer and vocal recording artist",
    skills: ["Playback Singing", "Carnatic"],
    specialties: ["Playback Singer", "Vocalist"],
    roles: ["Singer"],
    portfolioItemsCount: 1,
    portfolioSamples: [{ title: "Melody Track Release", description: "Studio vocal playback" }],
  };
  const evalSinger = evaluateRoleMatchEvidence(singerCreator, "Lead Singer");
  assert(
    evalSinger.score >= 85,
    `Singer with playback skills and vocal track gets top-tier score (got ${evalSinger.score}%, expected >= 85%)`
  );

  // 8. Relevant portfolio increases the appropriate role score, unrelated does not
  const actorWithPortfolio: RealCreatorProfile = {
    ...photoshopActor,
    portfolioSamples: [{ title: "Actor Monologue Audition Reel", description: "Dramatic monologue scene" }],
    portfolioItemsCount: 1,
  };
  const evalActorWithPort = evaluateRoleMatchEvidence(actorWithPortfolio, "Lead Actor");
  assert(
    evalActorWithPort.score > evalPsActor.score,
    `Relevant portfolio increases score: with portfolio = ${evalActorWithPort.score}% vs without = ${evalPsActor.score}%`
  );

  const actorWithIrrelevantPort: RealCreatorProfile = {
    ...photoshopActor,
    portfolioSamples: [{ title: "WordPress WooCommerce Store", description: "E-commerce web development" }],
    portfolioItemsCount: 1,
  };
  const evalActorIrrPort = evaluateRoleMatchEvidence(actorWithIrrelevantPort, "Lead Actor");
  assert(
    evalActorIrrPort.score === evalPsActor.score,
    `Irrelevant portfolio does NOT increase role score (${evalActorIrrPort.score}% vs ${evalPsActor.score}%)`
  );

  // 9. Real Supabase Live Directory Searches
  console.log("\n--- Testing Against Real Supabase Creator Directory ---");

  // Search Lead Actor
  const liveLeadActor = await searchCreatorsDirectory({ targetRole: "Lead Actor", page: 1, pageSize: 5 });
  console.log(`Live Lead Actor matches found: ${liveLeadActor.totalCount}`);
  assert(liveLeadActor.totalCount > 0, "Lead Actor returns real profiles from database");
  for (const c of liveLeadActor.creators) {
    assert(c.matchScore <= 75, `Lead Actor match score is realistically bounded (got ${c.matchScore}% for @${c.creator.username})`);
    assert(c.evidenceSources.roleAlignment === true, `Candidate @${c.creator.username} has real role alignment`);
    console.log(`  - @${c.creator.username}: ${c.matchScore}% | ${c.matchReason}`);
  }

  // Search Lead Actress (purity check)
  const liveLeadActress = await searchCreatorsDirectory({ targetRole: "Lead Actress", page: 1, pageSize: 5 });
  console.log(`Live Lead Actress matches found: ${liveLeadActress.totalCount}`);
  assert(liveLeadActress.totalCount === 0, "Lead Actress does NOT falsely return male actors as 98% matches");

  // Search Sound Designer (purity check: no graphic designers!)
  const liveSound = await searchCreatorsDirectory({ targetRole: "Sound Designer", page: 1, pageSize: 5 });
  console.log(`Live Sound Designer matches found: ${liveSound.totalCount}`);
  for (const c of liveSound.creators) {
    assert(c.creator.username !== "omniforger_fresh", "Graphic designer @omniforger_fresh is NOT matched as Sound Designer");
    console.log(`  - @${c.creator.username}: ${c.matchScore}% | ${c.matchReason}`);
  }

  // Search Video Editor
  const liveEditor = await searchCreatorsDirectory({ targetRole: "Video Editor", page: 1, pageSize: 5 });
  console.log(`Live Video Editor matches found: ${liveEditor.totalCount}`);
  assert(liveEditor.totalCount > 0, "Video Editor returns real profiles");
  for (const c of liveEditor.creators) {
    console.log(`  - @${c.creator.username}: ${c.matchScore}% | ${c.matchReason}`);
  }

  console.log("\n🎉 ALL 12 REGRESSION TESTS PASSED SUCCESSFULLY!");
}

runRegressionTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
