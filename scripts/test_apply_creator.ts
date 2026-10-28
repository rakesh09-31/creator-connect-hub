import { generateStructuredBlueprint } from '../src/lib/omniforge/engine-blueprint';
import { applyCreatorToProject } from '../src/lib/omniforge/team-reconciliation';

const project = generateStructuredBlueprint("Romantic Musical Film", "creator", "anon", "DIRECTOR");
console.log("Project roles:", project.roles.map(r => r.roleName));

const vinayProf = {
  id: "af27cffd-257d-4881-bae0-83c13e7a89cb",
  username: "vinay",
  full_name: "vinay",
  avatar_url: null,
};

const updated = applyCreatorToProject(project, vinayProf, "Cinematographer");
console.log("Coverage after applyCreatorToProject:", updated.coverage);
console.log("Accepted recs:", updated.recommendations.filter(r => r.status === "accepted"));
