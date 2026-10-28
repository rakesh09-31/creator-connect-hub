import { fetchCreatorDirectoryPool, evaluateRoleMatchEvidence } from "../src/lib/omniforge/matcher";

async function main() {
  const pool = await fetchCreatorDirectoryPool();

  console.log("--- ACTING CANDIDATES (total = ?) ---");
  let actCount = 0;
  for (const c of pool) {
    const text = JSON.stringify(c).toLowerCase();
    if (text.includes("actor") || text.includes("acting") || text.includes("theatre") || text.includes("drama") || text.includes("action") || text.includes("hero")) {
      const ev = evaluateRoleMatchEvidence(c, "Lead Actor");
      console.log(`@${c.username}: role=${c.role}, specs=[${c.specialties}], score=${ev.score}, align=${ev.roleAlignment}`);
      if (ev.score >= 40 && ev.roleAlignment) actCount++;
    }
  }
  console.log(`Matching Lead Actor: ${actCount}`);

  console.log("\n--- CAMERA OPERATOR / CINEMATOGRAPHER CANDIDATES ---");
  for (const c of pool) {
    const text = JSON.stringify(c).toLowerCase();
    if (text.includes("camera") || text.includes("cinemat") || text.includes("videograph") || text.includes("dop") || text.includes("photo")) {
      const camEv = evaluateRoleMatchEvidence(c, "Camera Operator");
      const cinEv = evaluateRoleMatchEvidence(c, "Cinematographer");
      if (camEv.score > 0 || cinEv.score > 0) {
        console.log(`@${c.username}: specs=[${c.specialties}], camScore=${camEv.score}(${camEv.roleAlignment}), cinScore=${cinEv.score}(${cinEv.roleAlignment})`);
      }
    }
  }

  console.log("\n--- COLORIST CANDIDATES ---");
  for (const c of pool) {
    const text = JSON.stringify(c).toLowerCase();
    if (text.includes("color") || text.includes("grade") || text.includes("davinci") || text.includes("resolve") || text.includes("edit")) {
      const colEv = evaluateRoleMatchEvidence(c, "Colorist");
      if (colEv.score >= 40 && colEv.roleAlignment) {
        console.log(`@${c.username}: specs=[${c.specialties}], skills=[${c.skills}]`);
      }
    }
  }
}

main().catch(console.error);
