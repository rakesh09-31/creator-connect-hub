const fs = require('fs');

const filePath = 'src/lib/omniforge/universal-roadmap.ts';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Upgrade buildCompletePythonRoadmap
const pyStart = code.indexOf('export function buildCompletePythonRoadmap');
const pyEndMarker = '// ============================================================================\n// UNIVERSAL EXECUTION PLAN BUILDER (PROJECT ROADMAPS)';
const pyEnd = code.indexOf(pyEndMarker);

if (pyStart === -1 || pyEnd === -1) {
  console.error('Could not locate buildCompletePythonRoadmap boundaries!');
  process.exit(1);
}

const newPythonRoadmap = `export function buildCompletePythonRoadmap(conversationId?: string, userId?: string): UniversalRoadmap {
  const roadmapId = \`rm_python_\${Date.now()}_\${Math.random().toString(36).slice(2, 7)}\`;
  const now = new Date().toISOString();

  const blueprint = planSubjectCurriculum("Python");

  const stages: ProgressiveProjectStage[] = PYTHON_BLUEPRINT_STAGES.map((s) => ({
    stage: s.stage,
    skillFocus: s.skillFocus,
    projectTitle: s.projectTitle,
    deliverables: s.deliverables.join(", "),
    complexity: s.stage <= 3 ? "Beginner" : s.stage <= 6 ? "Intermediate" : s.stage <= 9 ? "Advanced" : "Production",
    status: s.stage === 1 ? "ACTIVE" : "UPCOMING",
  }));

  const nodes: RoadmapNode[] = PYTHON_BLUEPRINT_STAGES.map((s) => {
    const deep = getPythonDeepStageContent(s.stage);
    return {
      id: \`py_node_\${s.stage}\`,
      level: s.stage,
      title: s.title,
      skill: s.skillFocus,
      category: s.stage <= 3 ? "Foundations" : s.stage <= 6 ? "Core Engineering" : s.stage <= 9 ? "Backend Architecture" : "Production Systems",
      concept: s.objective,
      state: s.stage === 1 ? "IN_PROGRESS" : "AVAILABLE",
      whyLearnThis: \`Mastering \${s.skillFocus} is essential for writing robust, scalable, and idiomatic Python applications.\`,
      prerequisites: s.prerequisites,
      prerequisiteChecks: s.prerequisites.map((p) => \`Verified understanding of \${p}\`),
      task: {
        title: s.projectTitle,
        description: \`Implement the milestone deliverable for Stage \${s.stage}: \${s.objective}\`,
        deliverables: s.deliverables,
      },
      miniProject: {
        title: s.projectTitle,
        description: s.deliverables.join("; "),
        techStack: ["Python 3.12", ...(s.stage >= 7 ? ["FastAPI", "SQLAlchemy", "Pydantic"] : []), ...(s.stage >= 10 ? ["pytest", "Docker"] : [])],
        difficulty: s.stage <= 3 ? "Beginner" : s.stage <= 6 ? "Intermediate" : s.stage <= 9 ? "Advanced" : "Production",
      },
      learningObjectives: [s.objective, ...s.keyCompetencies],
      topicChecklist: deep.topics.map((t) => ({ id: t.id, title: t.title, completed: false })),
      topics: deep.topics,
      commonMistakesAndTroubleshooting: deep.commonMistakesAndTroubleshooting,
      knowledgeCheck: deep.knowledgeCheck,
      completionCriteria: deep.completionCriteria,
      practicalExercises: deep.topics.map((t) => ({
        id: \`ex_\${t.id}\`,
        title: t.exercise.title,
        prompt: t.exercise.prompt,
        starterCode: t.exercise.starterCode,
        solution: t.example.codeOrWalkthrough,
        expectedOutcome: t.exercise.expectedOutcome,
      })),
      assessment: {
        criterion: deep.completionCriteria.join("; "),
        passingScore: 85,
        knowledgeCheck: deep.knowledgeCheck,
      },
      estimatedStudyHours: s.estimatedStudyHours,
      estimatedStudyTime: s.recommendedPacing,
      isExpanded: true,
    };
  });

  return {
    id: roadmapId,
    ownerId: userId || "current_user",
    conversationId,
    title: "Python Mastery Roadmap (Beginner to Production)",
    domain: "Software & AI Engineering",
    subject: "Python",
    roadmapType: "LEARNING",
    userObjective: "Master Python programming from syntax and OOP to production FastAPI microservices, testing, and Docker.",
    summary: "Comprehensive 12-stage Python curriculum featuring runnable code examples, testing, and Docker containerization.",
    experienceLevel: "All Levels",
    estimatedDuration: "10–14 Weeks at 2h/day",
    version: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    goal: "Python Mastery Roadmap (Beginner to Production)",
    targetRole: "Python Backend & Automation Engineer",
    trackKey: "python_mastery",
    dailyStudyHours: 2.0,
    totalStudyHours: 216,
    overallProgress: 0,
    currentNodeId: nodes[0].id,
    pointerLevel: 1,
    nodes,
    stages,
    curriculumBlueprint: blueprint,
    lastUpdated: now,
  };
}\n\n`;

code = code.slice(0, pyStart) + newPythonRoadmap + code.slice(pyEnd);

// 2. Upgrade buildProjectExecutionPlan
const execStart = code.indexOf('export function buildProjectExecutionPlan');
const execEndMarker = '// ============================================================================\n// PART 5: COMPLETE 12-STAGE FILMMAKING ROADMAP';
const execEnd = code.indexOf(execEndMarker);

if (execStart === -1 || execEnd === -1) {
  console.error('Could not locate buildProjectExecutionPlan boundaries!');
  process.exit(1);
}

const newExecutionPlan = `export function buildProjectExecutionPlan(
  projectTitle: string,
  domain: string = "Software & Product Engineering",
  conversationId?: string,
  userId?: string
): UniversalRoadmap {
  const roadmapId = \`exec_\${Date.now()}_\${Math.random().toString(36).slice(2, 7)}\`;
  const now = new Date().toISOString();

  const isMobile =
    /\\b(?:mobile|ios|android|react\\s*native|flutter|app)\\b/i.test(projectTitle) ||
    /\\b(?:mobile)\\b/i.test(domain);
  const isRestaurant =
    projectTitle.toLowerCase().includes("restaurant") || projectTitle.toLowerCase().includes("food");

  const title = isMobile
    ? "Mobile Application Development Execution Plan"
    : isRestaurant
    ? "AI-Powered Restaurant & Food Delivery Execution Plan"
    : \`\${projectTitle} Execution Plan\`;

  const safeDomain = isMobile
    ? "Mobile Engineering"
    : isRestaurant
    ? "Full Stack Web & Mobile Systems"
    : domain || "Software & Product Engineering";

  const phaseTemplates = buildExecutionPhasesForProject(projectTitle, safeDomain);

  const stages: ProgressiveProjectStage[] = phaseTemplates.map((p) => ({
    stage: p.phase,
    skillFocus: p.title,
    projectTitle: \`\${p.title.split(",")[0].split("&")[0].trim()} Deliverables\`,
    deliverables: p.deliverables.join(", "),
    complexity: p.phase <= 2 ? "Moderate" : p.phase <= 4 ? "Advanced" : "Production",
    status: p.phase === 1 ? "ACTIVE" : "UPCOMING",
  }));

  const nodes = buildExecutionNodesFromTemplates(projectTitle, safeDomain, stages);

  const totalHours = phaseTemplates.reduce((acc, p) => acc + p.estimatedEffortHours, 0);
  const durationStr = \`\${stages.length} Phases · ~\${totalHours} Engineering Hours · 8–12 Weeks\`;

  const blueprint = planSubjectCurriculum(projectTitle, {
    domain: safeDomain,
    roadmapType: "EXECUTION",
  });

  return {
    id: roadmapId,
    ownerId: userId || "current_user",
    conversationId,
    title,
    domain: safeDomain,
    roadmapType: "EXECUTION",
    userObjective: \`Execute the complete multi-stage production plan for \${projectTitle}.\`,
    summary: \`Structured execution plan across \${stages.length} phases with assignable roles, deliverables, risks, DoD, and acceptance criteria.\`,
    experienceLevel: "All Levels",
    estimatedDuration: durationStr,
    version: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    goal: title,
    targetRole: isMobile ? "Lead Mobile Engineer & Architect" : "Project Lead & Technical Architect",
    trackKey: isMobile ? "mobile_execution" : isRestaurant ? "restaurant_execution" : "custom_execution",
    dailyStudyHours: 4.0,
    totalStudyHours: totalHours,
    overallProgress: 0,
    currentNodeId: nodes[0].id,
    pointerLevel: 1,
    nodes,
    stages,
    curriculumBlueprint: blueprint,
    lastUpdated: now,
  };
}\n\n`;

code = code.slice(0, execStart) + newExecutionPlan + code.slice(execEnd);

// 3. Upgrade buildCompleteFrontendRoadmap and add Machine Learning + Cybersecurity
const feStart = code.indexOf('export function buildCompleteFrontendRoadmap');
const feEndMarker = '// ============================================================================\n// ============================================================================\n// PART 7: UNIVERSAL DEEP ROADMAP GENERATOR';
const feEnd = code.indexOf(feEndMarker);

if (feStart === -1 || feEnd === -1) {
  console.error('Could not locate buildCompleteFrontendRoadmap boundaries!');
  process.exit(1);
}

const newFrontendAndNewRoadmaps = `export function buildCompleteFrontendRoadmap(conversationId?: string, userId?: string): UniversalRoadmap {
  const roadmapId = \`rm_frontend_\${Date.now()}_\${Math.random().toString(36).slice(2, 7)}\`;
  const now = new Date().toISOString();

  const blueprint = planSubjectCurriculum("Frontend Development");

  const stages: ProgressiveProjectStage[] = FRONTEND_BLUEPRINT_STAGES.map((s) => ({
    stage: s.stage,
    skillFocus: s.skillFocus,
    projectTitle: s.projectTitle,
    deliverables: s.deliverables.join(", "),
    complexity: s.stage <= 3 ? "Beginner" : s.stage <= 6 ? "Intermediate" : s.stage <= 9 ? "Advanced" : "Production",
    status: s.stage === 1 ? "ACTIVE" : "UPCOMING",
  }));

  const nodes: RoadmapNode[] = FRONTEND_BLUEPRINT_STAGES.map((s) => {
    const deep = getFrontendDeepStageContent(s.stage);
    return {
      id: \`fe_node_\${s.stage}\`,
      level: s.stage,
      title: s.title,
      skill: s.skillFocus,
      category: s.stage <= 3 ? "Foundations" : s.stage <= 6 ? "Core Engineering" : s.stage <= 9 ? "Framework Architecture" : "Production Systems",
      concept: s.objective,
      state: s.stage === 1 ? "IN_PROGRESS" : "AVAILABLE",
      whyLearnThis: \`Mastering \${s.skillFocus} gives you modern frontend engineering mastery with zero compromise on accessibility and web performance.\`,
      prerequisites: s.prerequisites,
      prerequisiteChecks: s.prerequisites.map((p) => \`Verified understanding of \${p}\`),
      task: {
        title: s.projectTitle,
        description: \`Implement the milestone deliverable for Stage \${s.stage}: \${s.objective}\`,
        deliverables: s.deliverables,
      },
      miniProject: {
        title: s.projectTitle,
        description: s.deliverables.join("; "),
        techStack: ["HTML5", "CSS3", ...(s.stage >= 4 ? ["JavaScript ES2024", "TypeScript"] : []), ...(s.stage >= 7 ? ["React 18+", "Next.js"] : []), ...(s.stage >= 11 ? ["Vitest", "Playwright"] : [])],
        difficulty: s.stage <= 3 ? "Beginner" : s.stage <= 6 ? "Intermediate" : s.stage <= 9 ? "Advanced" : "Production",
      },
      learningObjectives: [s.objective, ...s.keyCompetencies],
      topicChecklist: deep.topics.map((t) => ({ id: t.id, title: t.title, completed: false })),
      topics: deep.topics,
      commonMistakesAndTroubleshooting: deep.commonMistakesAndTroubleshooting,
      knowledgeCheck: deep.knowledgeCheck,
      completionCriteria: deep.completionCriteria,
      practicalExercises: deep.topics.map((t) => ({
        id: \`ex_\${t.id}\`,
        title: t.exercise.title,
        prompt: t.exercise.prompt,
        starterCode: t.exercise.starterCode,
        solution: t.example.codeOrWalkthrough,
        expectedOutcome: t.exercise.expectedOutcome,
      })),
      assessment: {
        criterion: deep.completionCriteria.join("; "),
        passingScore: 85,
        knowledgeCheck: deep.knowledgeCheck,
      },
      estimatedStudyHours: s.estimatedStudyHours,
      estimatedStudyTime: s.recommendedPacing,
      isExpanded: true,
    };
  });

  return {
    id: roadmapId,
    ownerId: userId || "current_user",
    conversationId,
    title: "Frontend Software Engineering Roadmap (12 Stages)",
    domain: "Web & Frontend Engineering",
    subject: "Frontend Development",
    roadmapType: "LEARNING",
    userObjective: "Master modern frontend engineering: semantic HTML5, CSS Grid/Flexbox, TypeScript, React 18+, testing, and Web Vitals.",
    summary: "Comprehensive 12-stage frontend curriculum from accessibility and responsive CSS to React 18+ and Next.js.",
    experienceLevel: "All Levels",
    estimatedDuration: "10–14 Weeks at 2h/day",
    version: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    goal: "Frontend Software Engineering Roadmap",
    targetRole: "Frontend Software Engineer",
    trackKey: "frontend_development",
    dailyStudyHours: 2.0,
    totalStudyHours: 216,
    overallProgress: 0,
    currentNodeId: nodes[0].id,
    pointerLevel: 1,
    nodes,
    stages,
    curriculumBlueprint: blueprint,
    lastUpdated: now,
  };
}

export function buildCompleteMachineLearningRoadmap(conversationId?: string, userId?: string): UniversalRoadmap {
  const roadmapId = \`rm_ml_\${Date.now()}_\${Math.random().toString(36).slice(2, 7)}\`;
  const now = new Date().toISOString();

  const blueprint = planSubjectCurriculum("Machine Learning & AI");

  const stages: ProgressiveProjectStage[] = ML_BLUEPRINT_STAGES.map((s) => ({
    stage: s.stage,
    skillFocus: s.skillFocus,
    projectTitle: s.projectTitle,
    deliverables: s.deliverables.join(", "),
    complexity: s.stage <= 3 ? "Beginner" : s.stage <= 6 ? "Intermediate" : s.stage <= 9 ? "Advanced" : "Production",
    status: s.stage === 1 ? "ACTIVE" : "UPCOMING",
  }));

  const nodes: RoadmapNode[] = ML_BLUEPRINT_STAGES.map((s) => {
    const deep = getMLDeepStageContent(s.stage);
    return {
      id: \`ml_node_\${s.stage}\`,
      level: s.stage,
      title: s.title,
      skill: s.skillFocus,
      category: s.stage <= 3 ? "Foundations" : s.stage <= 6 ? "Classical Machine Learning" : s.stage <= 9 ? "Deep Learning & NLP" : "Production MLOps",
      concept: s.objective,
      state: s.stage === 1 ? "IN_PROGRESS" : "AVAILABLE",
      whyLearnThis: \`Mastering \${s.skillFocus} provides rigorous mathematical and practical competence in machine learning engineering.\`,
      prerequisites: s.prerequisites,
      prerequisiteChecks: s.prerequisites.map((p) => \`Verified understanding of \${p}\`),
      task: {
        title: s.projectTitle,
        description: \`Implement the milestone deliverable for Stage \${s.stage}: \${s.objective}\`,
        deliverables: s.deliverables,
      },
      miniProject: {
        title: s.projectTitle,
        description: s.deliverables.join("; "),
        techStack: ["Python 3.12", "NumPy", "Pandas", ...(s.stage >= 4 ? ["Scikit-Learn"] : []), ...(s.stage >= 7 ? ["PyTorch"] : []), ...(s.stage >= 9 ? ["Hugging Face", "ChromaDB"] : [])],
        difficulty: s.stage <= 3 ? "Beginner" : s.stage <= 6 ? "Intermediate" : s.stage <= 9 ? "Advanced" : "Production",
      },
      learningObjectives: [s.objective, ...s.keyCompetencies],
      topicChecklist: deep.topics.map((t) => ({ id: t.id, title: t.title, completed: false })),
      topics: deep.topics,
      commonMistakesAndTroubleshooting: deep.commonMistakesAndTroubleshooting,
      knowledgeCheck: deep.knowledgeCheck,
      completionCriteria: deep.completionCriteria,
      practicalExercises: deep.topics.map((t) => ({
        id: \`ex_\${t.id}\`,
        title: t.exercise.title,
        prompt: t.exercise.prompt,
        starterCode: t.exercise.starterCode,
        solution: t.example.codeOrWalkthrough,
        expectedOutcome: t.exercise.expectedOutcome,
      })),
      assessment: {
        criterion: deep.completionCriteria.join("; "),
        passingScore: 85,
        knowledgeCheck: deep.knowledgeCheck,
      },
      estimatedStudyHours: s.estimatedStudyHours,
      estimatedStudyTime: s.recommendedPacing,
      isExpanded: true,
    };
  });

  return {
    id: roadmapId,
    ownerId: userId || "current_user",
    conversationId,
    title: "Machine Learning & AI Engineering Roadmap",
    domain: "Data Science & Artificial Intelligence",
    subject: "Machine Learning & AI",
    roadmapType: "LEARNING",
    userObjective: "Master machine learning foundations, NumPy/Pandas pipelines, Scikit-Learn ensembles, PyTorch deep learning, transformers, and RAG architectures.",
    summary: "Comprehensive 12-stage ML curriculum from vector math and statistics to PyTorch deep learning and RAG systems.",
    experienceLevel: "All Levels",
    estimatedDuration: "12–16 Weeks at 2h/day",
    version: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    goal: "Machine Learning & AI Engineering Roadmap",
    targetRole: "Machine Learning Engineer & AI Architect",
    trackKey: "machine_learning_ai",
    dailyStudyHours: 2.0,
    totalStudyHours: 228,
    overallProgress: 0,
    currentNodeId: nodes[0].id,
    pointerLevel: 1,
    nodes,
    stages,
    curriculumBlueprint: blueprint,
    lastUpdated: now,
  };
}

export function buildCompleteCybersecurityRoadmap(conversationId?: string, userId?: string): UniversalRoadmap {
  const roadmapId = \`rm_sec_\${Date.now()}_\${Math.random().toString(36).slice(2, 7)}\`;
  const now = new Date().toISOString();

  const blueprint = planSubjectCurriculum("Cybersecurity");

  const stages: ProgressiveProjectStage[] = CYBERSECURITY_BLUEPRINT_STAGES.map((s) => ({
    stage: s.stage,
    skillFocus: s.skillFocus,
    projectTitle: s.projectTitle,
    deliverables: s.deliverables.join(", "),
    complexity: s.stage <= 3 ? "Beginner" : s.stage <= 6 ? "Intermediate" : s.stage <= 8 ? "Advanced" : "Production",
    status: s.stage === 1 ? "ACTIVE" : "UPCOMING",
  }));

  const nodes: RoadmapNode[] = CYBERSECURITY_BLUEPRINT_STAGES.map((s) => {
    const deep = getCybersecurityDeepStageContent(s.stage);
    return {
      id: \`sec_node_\${s.stage}\`,
      level: s.stage,
      title: s.title,
      skill: s.skillFocus,
      category: s.stage <= 3 ? "Foundations" : s.stage <= 6 ? "Offensive & Defensive Security" : s.stage <= 8 ? "Incident Operations" : "Controlled Defense Capstone",
      concept: s.objective,
      state: s.stage === 1 ? "IN_PROGRESS" : "AVAILABLE",
      whyLearnThis: \`Mastering \${s.skillFocus} provides essential offensive and defensive security capabilities in real-world infrastructure.\`,
      prerequisites: s.prerequisites,
      prerequisiteChecks: s.prerequisites.map((p) => \`Verified understanding of \${p}\`),
      task: {
        title: s.projectTitle,
        description: \`Implement the milestone deliverable for Stage \${s.stage}: \${s.objective}\`,
        deliverables: s.deliverables,
      },
      miniProject: {
        title: s.projectTitle,
        description: s.deliverables.join("; "),
        techStack: ["Linux", "Wireshark", "OpenSSL", ...(s.stage >= 5 ? ["Burp Suite", "OWASP ZAP"] : []), ...(s.stage >= 8 ? ["Wazuh", "Snort", "Splunk"] : [])],
        difficulty: s.stage <= 3 ? "Beginner" : s.stage <= 6 ? "Intermediate" : s.stage <= 8 ? "Advanced" : "Production",
      },
      learningObjectives: [s.objective, ...s.keyCompetencies],
      topicChecklist: deep.topics.map((t) => ({ id: t.id, title: t.title, completed: false })),
      topics: deep.topics,
      commonMistakesAndTroubleshooting: deep.commonMistakesAndTroubleshooting,
      knowledgeCheck: deep.knowledgeCheck,
      completionCriteria: deep.completionCriteria,
      practicalExercises: deep.topics.map((t) => ({
        id: \`ex_\${t.id}\`,
        title: t.exercise.title,
        prompt: t.exercise.prompt,
        starterCode: t.exercise.starterCode,
        solution: t.example.codeOrWalkthrough,
        expectedOutcome: t.exercise.expectedOutcome,
      })),
      assessment: {
        criterion: deep.completionCriteria.join("; "),
        passingScore: 85,
        knowledgeCheck: deep.knowledgeCheck,
      },
      estimatedStudyHours: s.estimatedStudyHours,
      estimatedStudyTime: s.recommendedPacing,
      isExpanded: true,
    };
  });

  return {
    id: roadmapId,
    ownerId: userId || "current_user",
    conversationId,
    title: "Cybersecurity & Information Defense Roadmap",
    domain: "Information Security & Defense",
    subject: "Cybersecurity",
    roadmapType: "LEARNING",
    userObjective: "Master network protocol analysis, Linux internals, applied cryptography, OWASP defense, threat modeling, and incident response.",
    summary: "Comprehensive 10-stage cybersecurity curriculum covering networking, Linux, cryptography, OWASP Top 10, and SIEM defense.",
    experienceLevel: "All Levels",
    estimatedDuration: "10–12 Weeks at 2h/day",
    version: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    goal: "Cybersecurity & Information Defense Roadmap",
    targetRole: "Cybersecurity Engineer & Security Operations Analyst",
    trackKey: "cybersecurity_defense",
    dailyStudyHours: 2.0,
    totalStudyHours: 176,
    overallProgress: 0,
    currentNodeId: nodes[0].id,
    pointerLevel: 1,
    nodes,
    stages,
    curriculumBlueprint: blueprint,
    lastUpdated: now,
  };
}\n\n`;

code = code.slice(0, feStart) + newFrontendAndNewRoadmaps + code.slice(feEnd);

// 4. Add expandRoadmapStage and update buildUniversalRoadmap
const buildUniStart = code.indexOf('export function buildUniversalRoadmap(');
if (buildUniStart === -1) {
  console.error('Could not locate buildUniversalRoadmap!');
  process.exit(1);
}

const newExpandAndUniversalRoadmap = `/**
 * Level B Stage Content Expansion Engine
 * Expands stage from approved blueprint or on-demand generation while preserving identifiers, dependencies, and progress.
 */
export function expandRoadmapStage(
  roadmap: UniversalRoadmap,
  stageNumber: number
): UniversalRoadmap {
  if (!roadmap || !roadmap.nodes) return roadmap;
  const targetNode = roadmap.nodes.find((n) => n.level === stageNumber);
  if (!targetNode) return roadmap;

  const blueprintStage = roadmap.curriculumBlueprint?.stages?.find((s) => s.stage === stageNumber) || {
    stage: stageNumber,
    title: targetNode.title,
    skillFocus: targetNode.skill || targetNode.title,
    objective: targetNode.concept || \`Master Stage \${stageNumber}\`,
    prerequisites: targetNode.prerequisites || [],
    keyCompetencies: targetNode.learningObjectives || [],
    projectTitle: targetNode.miniProject?.title || \`\${targetNode.title} Project\`,
    deliverables: targetNode.task?.deliverables || [],
    estimatedStudyHours: targetNode.estimatedStudyHours || 15,
    recommendedPacing: targetNode.estimatedStudyTime || "1 week",
  };

  const deep = buildDeepContentForStage(
    blueprintStage,
    roadmap.subject || roadmap.title,
    roadmap.domain,
    roadmap.roadmapType
  );

  const updatedNodes = roadmap.nodes.map((node) => {
    if (node.level !== stageNumber) return node;
    return {
      ...node,
      isExpanded: true,
      topics: deep.topics,
      commonMistakesAndTroubleshooting: deep.commonMistakesAndTroubleshooting,
      knowledgeCheck: deep.knowledgeCheck,
      completionCriteria: deep.completionCriteria,
      topicChecklist: deep.topics.map((t) => {
        const existing = node.topicChecklist?.find((c) => c.id === t.id);
        return {
          id: t.id,
          title: t.title,
          completed: existing ? existing.completed : false,
        };
      }),
    };
  });

  return {
    ...roadmap,
    nodes: updatedNodes,
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Universal Roadmap Generator Factory
 */
export function buildUniversalRoadmap(
  prompt: string,
  conversationId?: string,
  userId?: string
): UniversalRoadmap {
  const { subject, domain, isExecutionPlan, isAmbiguous } = detectRoadmapSubject(prompt);
  const safeSubject = isAmbiguous || !subject ? "Software Engineering" : subject;

  let raw: UniversalRoadmap;
  if (isExecutionPlan) {
    raw = buildProjectExecutionPlan(safeSubject, domain, conversationId, userId);
  } else {
    const lower = prompt.toLowerCase();
    const cleanLower = safeSubject.toLowerCase();
    if (lower.includes("film") || lower.includes("cinema") || lower.includes("movie") || cleanLower.includes("film") || cleanLower.includes("screenwriting")) {
      raw = buildCompleteFilmmakingRoadmap(conversationId, userId);
    } else if ((lower.includes("java") || cleanLower.includes("java")) && !lower.includes("javascript") && !cleanLower.includes("javascript")) {
      raw = buildCompleteJavaRoadmap(conversationId, userId);
    } else if (lower.includes("python") || cleanLower.includes("python")) {
      raw = buildCompletePythonRoadmap(conversationId, userId);
    } else if (lower.includes("frontend") || lower.includes("html") || lower.includes("css") || cleanLower.includes("frontend")) {
      raw = buildCompleteFrontendRoadmap(conversationId, userId);
    } else if (
      lower.includes("machine learning") ||
      lower.includes("deep learning") ||
      lower.includes("data science") ||
      cleanLower.includes("machine learning") ||
      cleanLower.includes("data science") ||
      lower.includes("ai")
    ) {
      raw = buildCompleteMachineLearningRoadmap(conversationId, userId);
    } else if (
      lower.includes("cybersecurity") ||
      lower.includes("security") ||
      lower.includes("infosec") ||
      cleanLower.includes("cybersecurity")
    ) {
      raw = buildCompleteCybersecurityRoadmap(conversationId, userId);
    } else {
      // Universal dynamic roadmap adapts to ANY requested subject with deep topic & subtopic hierarchy
      raw = buildUniversalDynamicRoadmap(safeSubject, domain, conversationId, userId);
    }
  }

  const { repairedRoadmap } = validateRoadmapCompleteness(raw, safeSubject);
  return repairedRoadmap;
}
`;

code = code.slice(0, buildUniStart) + newExpandAndUniversalRoadmap;

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully upgraded universal-roadmap.ts!');
