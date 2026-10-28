import { fetchCreatorDirectoryPool, evaluateRoleMatchEvidence, validateCandidateRole } from "../src/lib/omniforge/matcher";

async function main() {
  const pool = await fetchCreatorDirectoryPool();
  console.log(`Pool size: ${pool.length}`);

  // Check anyone with cinematography or camera
  console.log("--- CAMERA / CINEMATOGRAPHY CANDIDATES ---");
  for (const c of pool) {
    const text = JSON.stringify({
      username: c.username,
      role: c.role,
      roles: c.roles,
      specialties: c.specialties,
      skills: c.skills
    });
    if (/cinemat|camera|dop|video/i.test(text)) {
      const cinVal = validateCandidateRole(c, "Cinematographer");
      const camVal = validateCandidateRole(c, "Camera Operator");
      console.log(`@${c.username}: role=${c.role}, specs=[${c.specialties}], skills=[${c.skills.slice(0, 5)}] => Cinematographer: valid=${cinVal.valid}, score=${cinVal.score}, roleAlign=${evaluateRoleMatchEvidence(c, "Cinematographer").roleAlignment} | Camera Operator: valid=${camVal.valid}, score=${camVal.score}`);
    }
  }

  console.log("\n--- SOUND DESIGNER CANDIDATES ---");
  for (const c of pool) {
    const text = JSON.stringify({
      username: c.username,
      role: c.role,
      roles: c.roles,
      specialties: c.specialties,
      skills: c.skills
    });
    if (/sound|audio|foley|music/i.test(text)) {
      const sndVal = validateCandidateRole(c, "Sound Designer");
      const sndEv = evaluateRoleMatchEvidence(c, "Sound Designer");
      console.log(`@${c.username}: role=${c.role}, specs=[${c.specialties}], skills=[${c.skills.slice(0, 5)}] => Sound Designer: valid=${sndVal.valid}, score=${sndVal.score}, roleAlign=${sndEv.roleAlignment}, reason=${sndEv.reason}`);
    }
  }
}

main().catch(console.error);
