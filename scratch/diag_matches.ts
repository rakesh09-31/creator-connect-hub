import { getCreatorsForRole } from '../src/lib/omniforge/matcher';

async function diag() {
  const cines = await getCreatorsForRole("Cinematographer");
  console.log("=== CINEMATOGRAPHER MATCHES (" + cines.creators.length + ") ===");
  for (const c of cines.creators) {
    console.log(`@${c.username} (${c.fullName}): roles=[${c.roles?.join(', ')}], specialties=[${c.specialties?.join(', ')}], skills=[${c.skills?.slice(0, 5).join(', ')}]`);
  }

  const sounds = await getCreatorsForRole("Sound Designer");
  console.log("\n=== SOUND DESIGNER MATCHES (" + sounds.creators.length + ") ===");
  for (const c of sounds.creators) {
    console.log(`@${c.username} (${c.fullName}): roles=[${c.roles?.join(', ')}], specialties=[${c.specialties?.join(', ')}], skills=[${c.skills?.slice(0, 5).join(', ')}]`);
  }

  const musicDirs = await getCreatorsForRole("Music Director");
  console.log("\n=== MUSIC DIRECTOR MATCHES (" + musicDirs.creators.length + ") ===");
  for (const c of musicDirs.creators) {
    console.log(`@${c.username} (${c.fullName}): roles=[${c.roles?.join(', ')}], specialties=[${c.specialties?.join(', ')}], skills=[${c.skills?.slice(0, 5).join(', ')}]`);
  }
}

diag().catch(console.error);
