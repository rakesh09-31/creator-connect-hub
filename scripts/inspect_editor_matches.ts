import { fetchCreatorDirectoryPool, evaluateRoleMatchEvidence, validateCandidateRole } from "../src/lib/omniforge/matcher";

async function main() {
  const pool = await fetchCreatorDirectoryPool();
  console.log(`Pool size: ${pool.length}`);

  let editorCount = 0;
  for (const c of pool) {
    const text = JSON.stringify(c).toLowerCase();
    if (text.includes("edit") || text.includes("premiere") || text.includes("cut") || text.includes("resolve") || text.includes("davinci") || text.includes("video")) {
      editorCount++;
    }
  }
  console.log(`Total creators mentioning edit/video/premiere/cut/resolve: ${editorCount}`);
}

main().catch(console.error);
