import { generateStructuredBlueprint } from '../src/lib/omniforge/engine-blueprint';
import { getOrCreateProjectSquad } from '../src/lib/omniforge/collaboration';

async function testAnonSquad() {
  const project = generateStructuredBlueprint("Romantic Musical Film", "creator", "anon", "DIRECTOR");
  console.log("Calling getOrCreateProjectSquad with ownerId='anon'...");
  const res = await getOrCreateProjectSquad(project, "anon");
  console.log("Result:", res);
}

testAnonSquad().catch(console.error);
