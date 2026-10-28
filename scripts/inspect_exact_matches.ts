import { fetchCreatorDirectoryPool } from "../src/lib/omniforge/matcher";

async function main() {
  const pool = await fetchCreatorDirectoryPool();
  console.log(`Pool size: ${pool.length}`);

  console.log("\n--- Colorist keywords in DB ---");
  let colorCount = 0;
  for (const c of pool) {
    const text = JSON.stringify(c).toLowerCase();
    if (text.includes("color") || text.includes("grade") || text.includes("davinci")) {
      colorCount++;
      console.log(`@${c.username}: role=${c.role}, specs=[${c.specialties}], skills=[${c.skills}]`);
    }
  }
  console.log(`Total colorist hits: ${colorCount}`);

  console.log("\n--- Choreographer & Dancer in DB ---");
  let danceCount = 0;
  for (const c of pool) {
    const text = JSON.stringify(c).toLowerCase();
    if (text.includes("dance") || text.includes("choreo")) {
      danceCount++;
      console.log(`@${c.username}: role=${c.role}, specs=[${c.specialties}], skills=[${c.skills}]`);
    }
  }
  console.log(`Total dance hits: ${danceCount}`);

  console.log("\n--- Camera / Video in DB ---");
  let countCam = 0;
  for (const c of pool) {
    const text = JSON.stringify(c).toLowerCase();
    if (text.includes("camera") || text.includes("cinemat") || text.includes("videograph") || text.includes("dop")) {
      countCam++;
      console.log(`@${c.username}: role=${c.role}, specs=[${c.specialties}], skills=[${c.skills}]`);
    }
  }
  console.log(`Total with camera/cinemat/videograph/dop: ${countCam}`);
}

main().catch(console.error);
