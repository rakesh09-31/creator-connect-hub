import { searchCinemaCreatorsByDepartments } from '../src/lib/omniforge/matcher';

async function testCinemaSearch() {
  console.log("Testing searchCinemaCreatorsByDepartments with isUserDirector: true...");
  const t0 = performance.now();
  const res = await searchCinemaCreatorsByDepartments({
    genre: "Cinema",
    isUserDirector: true,
  });
  console.log(`Executed in ${Math.round(performance.now() - t0)}ms`);
  console.log("Departments returned:", res.departments.map(d => d.department));
  console.log("Total count:", res.totalCount);
  console.log("Found creators count:", res.allFoundCreators.length);
  console.log("\nSample creators by roleName:");
  for (const c of res.allFoundCreators.slice(0, 10)) {
    console.log(`- @${c.creator.username} as "${c.roleName}" (${c.matchScore}% Match) -> Reason: ${c.matchReason}`);
  }
  console.log("\nReply message preview:\n" + res.replyMessage.slice(0, 600));
}

testCinemaSearch().catch(console.error);
