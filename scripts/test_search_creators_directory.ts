import { searchCreatorsDirectory } from "../src/lib/omniforge/matcher";

async function run() {
  const res = await searchCreatorsDirectory({ targetRole: "Creator", page: 1, pageSize: 6 });
  console.log("Total creators found:", res.totalCount);
  console.log("Creators returned:", res.creators.length);
  res.creators.forEach((c, i) => {
    console.log(`${i + 1}. ${c.creator.name} (@${c.creator.username}) - Role: ${c.creator.role}, Score: ${c.matchScore}`);
  });
}

run().catch(console.error);
