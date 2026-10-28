import { fetchCreatorDirectoryPool, validateCandidateRole } from "../src/lib/omniforge/matcher";

async function main() {
  const pool = await fetchCreatorDirectoryPool();

  console.log("--- CAMERA OPERATOR MATCHES (23) ---");
  for (const c of pool) {
    const val = validateCandidateRole(c, "Camera Operator");
    if (val.valid) {
      console.log(`@${c.username}: specs=[${c.specialties}], role=${c.role}`);
    }
  }

  console.log("\n--- COLORIST MATCHES (24) ---");
  for (const c of pool) {
    const val = validateCandidateRole(c, "Colorist");
    if (val.valid) {
      console.log(`@${c.username}: specs=[${c.specialties}], skills=[${c.skills}]`);
    }
  }
}

main().catch(console.error);
