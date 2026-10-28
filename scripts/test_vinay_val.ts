import { fetchCreatorDirectoryPool, validateCandidateRole, evaluateRoleMatchEvidence } from "../src/lib/omniforge/matcher";

async function test() {
  const pool = await fetchCreatorDirectoryPool();
  const vinay = pool.find(c => c.username === "vinay");
  console.log("Vinay:", vinay);
  if (vinay) {
    const val = validateCandidateRole(vinay, "Cinematographer");
    const ev = evaluateRoleMatchEvidence(vinay, "Cinematographer");
    console.log("val:", val);
    console.log("ev:", ev);
  }
}
test();
