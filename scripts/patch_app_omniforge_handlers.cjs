const fs = require('fs');

const filePath = 'src/routes/_authenticated/_app.omniforge.tsx';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Update universal-roadmap import to include expandRoadmapStage
code = code.replace(
  '  validateAndSanitizeRoadmap,\n} from "@/lib/omniforge/universal-roadmap";',
  '  validateAndSanitizeRoadmap,\n  expandRoadmapStage,\n} from "@/lib/omniforge/universal-roadmap";'
);

// 2. Add intent handlers before EXPLAIN_CURRENT_MILESTONE
const newHandlers = `        } else if (intentResult.intent === "EXPAND_ROADMAP_STAGE") {
          const stageNum = parseInt(intentResult.targetRole || "1", 10);
          if (intelProfile.roadmap) {
            const updatedRm = expandRoadmapStage(intelProfile.roadmap, stageNum);
            setIntelProfile((prev) => {
              const nextProf = {
                ...prev,
                roadmap: updatedRm,
                savedRoadmaps: {
                  ...(prev.savedRoadmaps || {}),
                  [updatedRm.trackKey || "active"]: updatedRm,
                },
              };
              saveUserIntelligenceProfile(nextProf, user?.id);
              return nextProf;
            });
            const existingItem = loadSavedRoadmapsList(user?.id).find((r) => r.id === updatedRm.id);
            if (existingItem) {
              saveRoadmapItem({ ...existingItem, roadmapData: updatedRm }, user?.id);
              setSavedRoadmaps(loadSavedRoadmapsList(user?.id));
            }
          }
          setCenterView("skill_analysis");
          finalResponseText = intentResult.deterministicText || \`✓ **Stage \${stageNum} Expanded!** Generated deep topics, runnable code examples, common pitfalls, and verifiable knowledge checks for Stage \${stageNum}.\`;
          suggestedChips = [
            \`Explain Stage \${stageNum}\`,
            "Give me today's learning tasks",
            "Show all my roadmaps",
          ];
          finalIntent = "EXPAND_ROADMAP_STAGE";
        } else if (intentResult.intent === "COMPARE_ROADMAPS") {
          const allSaved = loadSavedRoadmapsList(user?.id);
          if (allSaved.length === 0) {
            finalResponseText = \`You currently have 0 saved roadmaps. Ask me to generate a roadmap (e.g., *Python Backend*, *Frontend Software Engineering*, or *Mobile Application Execution*) to start tracking your progress!\`;
          } else {
            finalResponseText = \`### 📊 Saved Roadmaps Overview & Comparison\\n\\n\` +
              allSaved.map((r, idx) => \`**\${idx + 1}. \${r.title}** (\${r.roadmapType || "LEARNING"})\\n• Progress: \${r.progressPercent || 0}% (\${r.completedStages || 0}/\${r.totalStages || 1} stages)\\n• Focus: \${r.activeMilestoneTitle || r.targetSkillOrOutcome || "In Progress"}\\n• Domain: \${r.domain || "Engineering"}\`).join("\\n\\n") +
              \`\\n\\nYou can switch between roadmaps anytime from the Roadmaps sidebar.\`;
          }
          suggestedChips = allSaved.slice(0, 3).map((r) => \`View \${r.title.split(" ")[0]} roadmap\`);
          finalIntent = "COMPARE_ROADMAPS";
        } else if (intentResult.intent === "EXPLAIN_TOPIC") {
          const topicName = intentResult.targetRole || "this concept";
          finalResponseText = intentResult.deterministicText || \`### 💡 Deep Concept Explanation: \${topicName}\\n\\nUnderstanding \${topicName} is foundational for building scalable, resilient architectures and eliminating common runtime failure modes.\`;
          suggestedChips = [
            \`Give me exercises for \${topicName}\`,
            "Explain current milestone",
            "View current roadmap",
          ];
          finalIntent = "EXPLAIN_TOPIC";
        } else if (intentResult.intent === "DELETE_ROADMAP") {
          finalResponseText = intentResult.deterministicText || \`To safely delete a roadmap, click the trash icon next to the roadmap in the Roadmaps sidebar, or confirm deletion.\`;
          suggestedChips = ["Show all my roadmaps", "View current roadmap"];
          finalIntent = "DELETE_ROADMAP";`;

const targetAnchor = '        } else if (intentResult.intent === "EXPLAIN_CURRENT_MILESTONE") {';
if (!code.includes('intentResult.intent === "EXPAND_ROADMAP_STAGE"')) {
  code = code.replace(targetAnchor, newHandlers + '\n' + targetAnchor);
}

// 3. Update exclude list in line 4080
code = code.replace(
  '"VIEW_SAVED_ROADMAP", "LIST_SAVED_ROADMAPS"].includes(finalIntent)',
  '"VIEW_SAVED_ROADMAP", "LIST_SAVED_ROADMAPS", "EXPAND_ROADMAP_STAGE", "COMPARE_ROADMAPS", "EXPLAIN_TOPIC", "DELETE_ROADMAP"].includes(finalIntent)'
);

// 4. Update roadmapArtifact check around line 4170
code = code.replace(
  '            finalIntent === "ROADMAP_REQUEST"',
  '            finalIntent === "ROADMAP_REQUEST" ||\n            finalIntent === "EXPAND_ROADMAP_STAGE"'
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched _app.omniforge.tsx!');
