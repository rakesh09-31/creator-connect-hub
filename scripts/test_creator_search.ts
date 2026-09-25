import { matchCreatorsForSingleRole, matchCreatorsForProject } from "../src/lib/omniforge/matcher";
import { generateStructuredBlueprint } from "../src/lib/omniforge/engine-blueprint";

async function main() {
  console.log("Searching actors in Supabase database...");
  const actors = await matchCreatorsForSingleRole("Actor", ["Acting", "Method Acting", "Stage Presence"]);
  console.log(`Found ${actors.length} actors:`, actors.map(a => ({
    name: a.creator.fullName || a.creator.username,
    skills: a.creator.skills,
    specialties: a.creator.specialties,
    score: a.matchScore,
    reason: a.matchReason,
  })));

  console.log("\nSearching Film Directors in Supabase database...");
  const directors = await matchCreatorsForSingleRole("Film Director", ["Directing", "Storyboarding"]);
  console.log(`Found ${directors.length} directors:`, directors.map(d => ({
    name: d.creator.fullName || d.creator.username,
    skills: d.creator.skills,
    score: d.matchScore,
  })));

  console.log("\nGenerating Blueprint for Short Film...");
  const bp = generateStructuredBlueprint("A suspense thriller short film about a missing student", "client", "test-user");
  console.log(`Blueprint: "${bp.title}", ${bp.phases.length} phases, ${bp.roles.length} roles.`);

  const matchRes = await matchCreatorsForProject(bp, "test-user");
  console.log(`Matched ${matchRes.recommendations.length} recommendations, coverage: ${matchRes.coverage.percentage}%`);
  for (const rec of matchRes.recommendations) {
    console.log(`- Role: ${rec.roleName} -> ${rec.creator.fullName || rec.creator.username} (${rec.matchScore}%)`);
  }
}

main().catch(console.error);
