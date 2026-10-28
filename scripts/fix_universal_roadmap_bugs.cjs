const fs = require('fs');

const filePath = 'src/lib/omniforge/universal-roadmap.ts';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Fix import
code = code.replace(
`import {
  CurriculumBlueprint,
  planSubjectCurriculum,
  buildDeepContentForStage,
} from "./curriculum/planner";`,
`import { CurriculumBlueprint } from "./curriculum/types";
import {
  planSubjectCurriculum,
  buildDeepContentForStage,
} from "./curriculum/planner";`
);

// 2. Fix buildExecutionNodesFromTemplates call
code = code.replace(
  'const nodes = buildExecutionNodesFromTemplates(projectTitle, safeDomain, stages);',
  'const nodes = buildExecutionNodesFromTemplates(phaseTemplates);'
);

// 3. Fix t.exercise and t.example optional access in practicalExercises
const oldExBlock = `      practicalExercises: deep.topics.map((t) => ({
        id: \`ex_\${t.id}\`,
        title: t.exercise.title,
        prompt: t.exercise.prompt,
        starterCode: t.exercise.starterCode,
        solution: t.example.codeOrWalkthrough,
        expectedOutcome: t.exercise.expectedOutcome,
      })),`;

const newExBlock = `      practicalExercises: deep.topics.map((t) => ({
        id: \`ex_\${t.id}\`,
        title: t.exercise?.title || \`\${t.title} Exercise\`,
        prompt: t.exercise?.prompt || \`Implement practical exercise for \${t.title}.\`,
        starterCode: t.exercise?.starterCode || \`// Starter code for \${t.title}\`,
        solution: t.example?.codeOrWalkthrough || \`// Solution for \${t.title}\`,
        expectedOutcome: t.exercise?.expectedOutcome || \`Passing test assertions for \${t.title}.\`,
      })),`;

code = code.split(oldExBlock).join(newExBlock);

// 4. Fix type in expandRoadmapStage
code = code.replace(
  'roadmap.curriculumBlueprint?.stages?.find((s) => s.stage === stageNumber)',
  'roadmap.curriculumBlueprint?.stages?.find((s: any) => s.stage === stageNumber)'
);

// 5. Fix screenwriting routing in buildUniversalRoadmap
code = code.replace(
  'if (lower.includes("film") || lower.includes("cinema") || lower.includes("movie") || cleanLower.includes("film") || cleanLower.includes("screenwriting")) {',
  'if (lower.includes("film") || lower.includes("cinema") || lower.includes("movie") || cleanLower.includes("film")) {'
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Fixed universal-roadmap.ts issues successfully!');
