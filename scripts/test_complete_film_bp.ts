import { generateStructuredBlueprint } from '../src/lib/omniforge/engine-blueprint';

const p = generateStructuredBlueprint("Complete Film Production", "creator", "anon", "DIRECTOR");
console.log("Domain:", p.domain);
console.log("Title:", p.title);
console.log("Roles count:", p.roles.length);
console.log("Roles:", p.roles.map(r => r.roleName));
