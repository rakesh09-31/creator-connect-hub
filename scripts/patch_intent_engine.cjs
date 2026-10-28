const fs = require('fs');

const filePath = 'src/lib/omniforge/intent.ts';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Add UserIntent types if not present
if (!code.includes('"EXPAND_ROADMAP_STAGE"')) {
  code = code.replace(
    '  | "ROADMAP_REQUEST"',
    '  | "EXPAND_ROADMAP_STAGE"\n  | "COMPARE_ROADMAPS"\n  | "EXPLAIN_TOPIC"\n  | "LEARNING_ROADMAP_REQUEST"\n  | "PROJECT_EXECUTION_ROADMAP_REQUEST"\n  | "ROADMAP_REQUEST"'
  );
}

// 2. Add formatRoadmapConversationalOverview helper
const overviewHelper = `export function formatRoadmapConversationalOverview(roadmap: any): string {
  if (!roadmap) return "";
  const isExecution = roadmap.roadmapType === "EXECUTION";
  const icon = isExecution ? "📱" : "🎯";
  const typeName = isExecution ? "Project Execution Plan" : "Master Learning Curriculum";
  
  // 1. What the roadmap will help them achieve
  const achievement = roadmap.userObjective || \`Master end-to-end capabilities and production deliverables in \${roadmap.title}.\`;
  
  // 2. Proposed progression
  const stageCount = roadmap.stages?.length || 0;
  const progressionSummary = (roadmap.stages || []).slice(0, 5).map((s: any) => \`• **\${isExecution ? "Phase" : "Stage"} \${s.stage}:** \${s.skillFocus}\`).join("\\n") +
    (stageCount > 5 ? \`\\n• *...plus \${stageCount - 5} additional progressive \${isExecution ? "phases" : "stages"} (through Capstone launch)*\` : "");

  // 3. Major projects
  const majorProjects = (roadmap.stages || []).slice(0, 4).map((s: any) => \`• **\${s.projectTitle}:** \${s.deliverables}\`).join("\\n");

  // 4. Expected completion evidence
  const completionEvidence = isExecution
    ? "• Verified acceptance criteria sign-offs\\n• Automated test suite passing in CI\\n• Production deployment live on target domain"
    : "• Hands-on exercises passing with zero unhandled warnings\\n• Evaluated knowledge checks with rubric compliance\\n• Working milestone code repositories and capstone release";

  // 5. How to begin the first stage
  const firstStage = roadmap.stages?.[0];
  const firstStageTitle = firstStage ? \`\${isExecution ? "Phase" : "Stage"} 1: \${firstStage.skillFocus}\` : "Stage 1";
  const howToBegin = \`Your roadmap is now active in the Roadmap Journey view. Start by opening **\${firstStageTitle}**, reviewing the foundational topics and worked examples, and completing the Stage 1 practical milestone!\`;

  return \`### \${icon} \${roadmap.title} (\${typeName})\\n\\n\` +
    \`**What you will achieve:**\\n\${achievement}\\n\\n\` +
    \`**Proposed Progression (\${stageCount} \${isExecution ? "Phases" : "Stages"}):**\\n\${progressionSummary}\\n\\n\` +
    \`**Major Milestone Deliverables:**\\n\${majorProjects}\\n\\n\` +
    \`**Expected Completion Evidence:**\\n\${completionEvidence}\\n\\n\` +
    \`**How to Begin:**\\n\${howToBegin}\`;
}
`;

if (!code.includes('function formatRoadmapConversationalOverview')) {
  const insertRegexPos = code.indexOf('export const RESUME_NEXT_MILESTONE_REGEX =');
  code = code.slice(0, insertRegexPos) + overviewHelper + '\n' + code.slice(insertRegexPos);
}

// 3. Add new regexes
const newRegexes = `export const EXPAND_STAGE_REGEX =
  /\\b(?:expand|detail|deep\\s*dive\\s*into|open\\s*up)\\s+(?:stage|milestone|phase)\\s+(\\d+)\\b|\\b(?:expand|detail)\\s+(?:the\\s+)?(\\w+)\\s+(?:stage|milestone|phase)\\b/i;

export const COMPARE_ROADMAPS_REGEX =
  /\\b(?:compare|contrast|summarize|overview\\s+of)\\s+(?:my\\s+)?(?:saved\\s+)?(?:roadmaps|tracks|curricula)\\b|\\bcompare\\s+([a-zA-Z0-9\\s]+?)\\s+and\\s+([a-zA-Z0-9\\s]+?)\\s+roadmaps?\\b/i;

export const DELETE_ROADMAP_EXPLICIT_REGEX =
  /\\b(?:delete|remove|clear)\\s+(?:the\\s+|my\\s+)?([a-zA-Z0-9\\s\\-]+?)\\s+roadmap\\b|\\bdelete\\s+(?:the\\s+|this\\s+|current\\s+)?roadmap\\b/i;

export const EXPLAIN_TOPIC_REGEX =
  /\\b(?:explain|clarify|elaborate\\s+on|tell\\s+me\\s+more\\s+about)\\s+(?:the\\s+topic\\s+|topic\\s+)?([a-zA-Z0-9\\s\\-#+._]+)\\b|\\bexplain\\s+further\\b/i;
`;

if (!code.includes('EXPAND_STAGE_REGEX')) {
  const regexAnchor = 'export const CREATE_NEW_ROADMAP_REGEX =';
  code = code.replace(regexAnchor, newRegexes + '\n' + regexAnchor);
}

// 4. In classifyUserIntentCore, insert handlers before roadmap creation
const intentDispatchHandlers = `  // 4.001 EXPAND PARTICULAR ROADMAP STAGE (Section 2 & 8)
  const expandMatch = clean.match(EXPAND_STAGE_REGEX);
  if (expandMatch) {
    const stageNum = parseInt(expandMatch[1] || "1", 10);
    return {
      intent: "EXPAND_ROADMAP_STAGE",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      targetRole: String(stageNum),
      explanation: \`User requested expanding Stage \${stageNum} with comprehensive deep curriculum content.\`,
      deterministicText: \`✓ **Stage \${stageNum} Expanded!** Generated deep topics, runnable code examples, common pitfalls, and verifiable knowledge checks for Stage \${stageNum}. Check the Stage Inspector in your Roadmap view.\`,
      suggestedChips: [
        \`Explain Stage \${stageNum}\`,
        "Show knowledge checks",
        "Give me today's learning tasks",
      ],
    };
  }

  // 4.002 COMPARE OR SUMMARIZE ROADMAPS (Section 2 & 11)
  if (COMPARE_ROADMAPS_REGEX.test(clean)) {
    return {
      intent: "COMPARE_ROADMAPS",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "User requested comparison or summary of saved roadmaps.",
      deterministicText: \`Here is the comparative summary of your active and saved roadmap tracks, including completed milestones, active focus, and remaining effort.\`,
      suggestedChips: [
        "View current roadmap",
        "Show all my roadmaps",
        "Resume next milestone",
      ],
    };
  }

  // 4.003 DELETE ROADMAP INTENT (Section 2 & 12)
  const deleteMatch = clean.match(DELETE_ROADMAP_EXPLICIT_REGEX);
  if (deleteMatch && !clean.toLowerCase().includes("how do i delete")) {
    const targetSubj = (deleteMatch[1] || "active").trim();
    return {
      intent: "DELETE_ROADMAP",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      targetRole: targetSubj,
      explanation: \`User requested deletion of \${targetSubj} roadmap artifact.\`,
      deterministicText: \`Are you sure you want to delete your **\${targetSubj}** roadmap? You can use the trash button in the Roadmaps sidebar to permanently delete it, or confirm here. This action cannot be undone.\`,
      suggestedChips: [
        "Keep my roadmap",
        "Show all my roadmaps",
      ],
    };
  }

  // 4.004 EXPLAIN TOPIC INTENT (Section 2 & 11)
  const explainTopicMatch = clean.match(EXPLAIN_TOPIC_REGEX);
  if (
    explainTopicMatch &&
    !clean.toLowerCase().includes("roadmap") &&
    !clean.toLowerCase().includes("milestone") &&
    !clean.toLowerCase().includes("stage")
  ) {
    const rawTopic = (explainTopicMatch[1] || "the concept").trim();
    return {
      intent: "EXPLAIN_TOPIC",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      targetRole: rawTopic,
      explanation: \`User requested topic explanation for \${rawTopic}.\`,
      deterministicText: \`### 💡 Deep Concept Explanation: \${rawTopic}\\n\\n\` +
        \`**Core Concept & Rationale:**\\nUnderstanding \${rawTopic} is foundational for building scalable, resilient architectures and eliminating common runtime failure modes.\\n\\n\` +
        \`**Key Principles:**\\n• Separation of Concerns & Clean Encapsulation\\n• Strict Defensive Input Validation & Boundary Checks\\n• Resource Management & Memory Profiling\\n\\n\` +
        \`**Practical Code Example:**\\n\`\`\`typescript\\n// Practical demonstration of \${rawTopic}\\nexport function executeConcept() {\\n  return { topic: "\${rawTopic}", verified: true };\\n}\\n\`\`\`\\n\\n\` +
        \`**Troubleshooting & Pitfalls:**\\n• Avoid mutative state updates across asynchronous boundaries.\\n• Always assert precondition invariants prior to invoking downstream procedures.\`,
      suggestedChips: [
        \`Give me exercises for \${rawTopic}\`,
        "Explain current milestone",
        "View current roadmap",
      ],
    };
  }
`;

if (!code.includes('EXPAND_ROADMAP_STAGE (Section 2 & 8)')) {
  const handlerAnchor = '  // 4.01 RESUME NEXT INCOMPLETE MILESTONE';
  code = code.replace(handlerAnchor, intentDispatchHandlers + '\n' + handlerAnchor);
}

// 5. Update deterministicText for roadmaps in intent.ts to use formatRoadmapConversationalOverview
code = code.replace(
  `        deterministicText:
          \`### 📱 \${execRoadmap.title}\\n\\n\` +
          \`I have generated your structured interactive **Execution Plan** across \${execRoadmap.stages.length} project phases!\\n\\n\` +
          execRoadmap.stages.map((s) => \`• **Phase \${s.stage}:** \${s.skillFocus} (\${s.projectTitle})\`).join("\\n") +
          \`\\n\\nYour project plan is saved as an independent artifact. All milestones, checklists, and deliverables are active in your Roadmap viewer.\`,`,
  `        deterministicText: formatRoadmapConversationalOverview(execRoadmap),`
);

code = code.replace(
  `        deterministicText:
          \`### 🎬 Comprehensive Filmmaking & Cinema Production Roadmap\\n\\n\` +
          \`I have generated your comprehensive **12-stage interactive Filmmaking Roadmap** covering the complete cinematic lifecycle from concept development to theatrical and festival distribution!\\n\\n\` +
          \`• **Stages 1–3 (Development):** Concept Bible & Logline, 10-Minute Formatted Screenplay, Itemized Production Budget & Clearances\\n\` +
          \`• **Stages 4–6 (Pre-Production):** Script Breakdown & Departmental Dossier, Casting Direction & Deals, Location Scouting & Permits\\n\` +
          \`• **Stages 7–8 (Technical Planning):** Cinematography & Lighting Design (Shot Book), Production Scheduling & Call Sheets\\n\` +
          \`• **Stage 9 (Production):** Principal Photography & Directing on Set (Camera slates, raw 4K footage & audio sync)\\n\` +
          \`• **Stages 10–12 (Post & Release):** Picture Editorial & Assembly Cut, Color Grading & 5.1 Surround Sound Design, Final Master & Festival Distribution Strategy\\n\\n\` +
          \`Your filmmaking roadmap is saved as an independent artifact. All 12 interactive milestones, detailed checklists, and deliverables are active in your Roadmap viewer!\`,`,
  `        deterministicText: formatRoadmapConversationalOverview(filmRoadmap),`
);

code = code.replace(
  `        deterministicText:
          \`### ☕ Complete Java Mastery Roadmap (Beginner to Advanced)\\n\\n\` +
          \`I have generated your comprehensive **24-stage interactive Java learning roadmap** covering the entire curriculum from foundational syntax to enterprise microservices!\\n\\n\` +
          \`• **Stages 1–4:** Java Ecosystem & JVM Tooling, Syntax & I/O, Control Flow & Methods, Arrays & Strings\\n\` +
          \`• **Stages 5–8:** OOP Foundations, Inheritance & Interfaces, Exception Handling, Collections Framework & Generics\\n\` +
          \`• **Stages 9–12:** File Handling & NIO.2, Lambdas & Streams API, Records & Modern Java, Multithreading & Virtual Threads\\n\` +
          \`• **Stages 13–16:** JVM Architecture & GC Tuning, DSA in Java, JDBC & Connection Pooling, Sockets & Async HTTP\\n\` +
          \`• **Stages 17–19:** Automated Testing (JUnit 5 / Mockito), Build Tools (Maven / Gradle CI/CD), Secure Java Coding\\n\` +
          \`• **Stages 20–24:** Spring Boot REST APIs, Spring Data JPA, SOLID / Clean Architecture, Docker Containerization & Microservices Capstone\\n\\n\` +
          \`Your Java roadmap is stored as an independent subject-specific artifact. Click below or open the AI Roadmap viewer to explore all 24 interactive milestones, topic checklists, and practice exercises!\`,`,
  `        deterministicText: formatRoadmapConversationalOverview(javaRoadmap),`
);

code = code.replace(
  `        deterministicText:
          \`### 🐍 Python Mastery Roadmap (Beginner to Production)\\n\\n\` +
          \`I have generated your dedicated **12-stage Python learning roadmap** from core syntax to production FastAPI microservices!\\n\\n\` +
          \`• **Stages 1–3:** Python Syntax, venv, Data Collections & Functions\\n\` +
          \`• **Stages 4–6:** OOP, File I/O, Generators & Decorators\\n\` +
          \`• **Stages 7–9:** FastAPI REST APIs, SQLAlchemy ORM & asyncio Concurrency\\n\` +
          \`• **Stages 10–12:** pytest Testing Suite, Dockerization & Production Capstone\\n\\n\` +
          \`Your Python roadmap is saved as an independent artifact preserving all existing roadmaps.\`,`,
  `        deterministicText: formatRoadmapConversationalOverview(pyRoadmap),`
);

code = code.replace(
  `        deterministicText:
          \`### 🌐 \${detectedSubj} Roadmap (12 Stages)\\n\\n\` +
          \`I have generated your dedicated **12-stage Frontend Roadmap** covering modern semantic HTML5, CSS Grid & Flexbox, responsive layouts, accessibility (WCAG), and modern browser APIs!\\n\\n\` +
          \`Your \${detectedSubj} roadmap is saved as an independent artifact preserving all existing tracks.\`,`,
  `        deterministicText: formatRoadmapConversationalOverview(feRoadmap),`
);

code = code.replace(
  `        deterministicText:
          \`### 🚀 \${detectedSubj} Mastery Roadmap\\n\\n\` +
          \`I have generated your progressive interactive **\${detectedSubj} Roadmap** across \${customRoadmap.stages.length} milestones!\\n\\n\` +
          customRoadmap.stages.map((s) => \`• **Stage \${s.stage}:** \${s.skillFocus} (\${s.projectTitle})\`).join("\\n") +
          \`\\n\\nYour \${detectedSubj} roadmap is saved as an independent artifact preserving all existing tracks.\`,`,
  `        deterministicText: formatRoadmapConversationalOverview(customRoadmap),`
);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully patched intent.ts with upgraded intents and conversational formatting!');
