/**
 * OmniForge Master Subject-Aware Curriculum Planner
 *
 * Implements Section 4: Subject-aware curriculum planning without fixed one-size-fits-all templates.
 *
 * Before generating content, creates an internal curriculum plan that identifies:
 * - Subject and target outcome
 * - Starting skill level (when known)
 * - Required foundational knowledge
 * - Major competency areas
 * - Prerequisite relationships
 * - Stage sequence
 * - Practical application opportunities
 * - Final capstone
 * - Estimated learning effort
 * - Criteria for mastery
 */

import { CurriculumBlueprint, BlueprintStageDefinition, StageContentDetail, RoadmapType, ExperienceLevel } from "./types";
import { PYTHON_BLUEPRINT_STAGES, getPythonDeepStageContent } from "./python-curriculum";
import { FRONTEND_BLUEPRINT_STAGES, getFrontendDeepStageContent } from "./frontend-curriculum";
import { ML_BLUEPRINT_STAGES, getMLDeepStageContent } from "./ml-curriculum";
import { CYBERSECURITY_BLUEPRINT_STAGES, getCybersecurityDeepStageContent } from "./cybersecurity-curriculum";
import { VIDEO_EDITING_BLUEPRINT, buildVideoEditingStageContent } from "./video-editing-curriculum";
import { DSA_BLUEPRINT, buildDSAStageContent } from "./dsa-curriculum";
import { buildExecutionPhasesForProject } from "./execution-curriculum";
import { DeepTopicItem } from "../user-intelligence";

export interface PlannerOptions {
  domain?: string;
  roadmapType?: RoadmapType;
  experienceLevel?: ExperienceLevel;
  userObjective?: string;
  totalStages?: number;
}

export function planSubjectCurriculum(
  subject: string,
  options?: PlannerOptions
): CurriculumBlueprint {
  const normSubj = (subject || "Software Engineering").toLowerCase().trim();
  const domain = options?.domain || "Professional Discipline";
  const roadmapType: RoadmapType = options?.roadmapType || "LEARNING";
  const experienceLevel: ExperienceLevel = options?.experienceLevel || "All Levels";

  // 1. PROJECT EXECUTION ROADMAPS
  if (roadmapType === "EXECUTION") {
    const templates = buildExecutionPhasesForProject(subject, domain);
    const stages: BlueprintStageDefinition[] = templates.map((t) => ({
      stage: t.phase,
      title: t.title,
      skillFocus: t.roles[0] || "Architecture & Delivery",
      objective: t.objective,
      prerequisites: t.phase === 1 ? ["Project Scope Definition"] : [`Phase ${t.phase - 1} Completion Gate`],
      keyCompetencies: t.roles,
      projectTitle: `${t.title.split(",")[0].split("&")[0].trim()} Deliverable Package`,
      deliverables: t.deliverables,
      definitionOfDone: t.definitionOfDone,
      acceptanceCriteria: t.acceptanceCriteria,
      testingAndVerification: t.testingAndVerification,
      requiredToolsAndResources: t.requiredTools,
      evidenceRequired: t.evidenceRequired,
      estimatedStudyHours: t.estimatedEffortHours,
      recommendedPacing: t.estimatedCalendarPacing,
    }));

    return {
      subject,
      domain,
      roadmapType: "EXECUTION",
      experienceLevel,
      targetOutcome: `Deliver a production-ready, verified launch of ${subject}.`,
      estimatedEffort: `${stages.length} Project Phases · ~${stages.reduce((acc, s) => acc + s.estimatedStudyHours, 0)} Engineering Hours · 8–12 Weeks`,
      stages,
    };
  }

  // 2. PYTHON CURRICULUM
  if (normSubj.includes("python") || normSubj.includes("fastapi") || normSubj.includes("django")) {
    return {
      subject: "Python",
      domain: "Software & AI Engineering",
      roadmapType: "LEARNING",
      experienceLevel,
      targetOutcome: "Master Python programming from syntax and OOP to production FastAPI microservices, testing, and Docker.",
      estimatedEffort: "12 Stages · ~216 Study Hours · 10–14 Weeks at 2h/day",
      stages: PYTHON_BLUEPRINT_STAGES,
    };
  }

  // 3. FRONTEND & WEB CURRICULUM
  if (
    normSubj.includes("frontend") ||
    normSubj.includes("html") ||
    normSubj.includes("css") ||
    normSubj.includes("web dev") ||
    normSubj.includes("react")
  ) {
    return {
      subject: "Frontend Development",
      domain: "Web & Frontend Engineering",
      roadmapType: "LEARNING",
      experienceLevel,
      targetOutcome: "Master modern frontend engineering: semantic HTML5, modern CSS Grid/Flexbox, JavaScript/TypeScript, React 18+, testing, and web performance.",
      estimatedEffort: "12 Stages · ~216 Study Hours · 10–14 Weeks at 2h/day",
      stages: FRONTEND_BLUEPRINT_STAGES,
    };
  }

  // 4. MACHINE LEARNING & AI CURRICULUM
  if (
    normSubj.includes("machine learning") ||
    normSubj.includes("ml") ||
    normSubj.includes("artificial intelligence") ||
    normSubj.includes("deep learning") ||
    normSubj.includes("data science")
  ) {
    return {
      subject: "Machine Learning & AI",
      domain: "Data Science & Artificial Intelligence",
      roadmapType: "LEARNING",
      experienceLevel,
      targetOutcome: "Master machine learning foundations, NumPy/Pandas pipelines, Scikit-Learn ensembles, PyTorch deep learning, transformers, and RAG architectures.",
      estimatedEffort: "12 Stages · ~228 Study Hours · 12–16 Weeks at 2h/day",
      stages: ML_BLUEPRINT_STAGES,
    };
  }

  // 5. CYBERSECURITY & DEFENSE CURRICULUM
  if (
    normSubj.includes("cybersecurity") ||
    normSubj.includes("security") ||
    normSubj.includes("infosec") ||
    normSubj.includes("ethical hacking") ||
    normSubj.includes("penetration testing")
  ) {
    return {
      subject: "Cybersecurity",
      domain: "Information Security & Defense",
      roadmapType: "LEARNING",
      experienceLevel,
      targetOutcome: "Master network protocol analysis, Linux internals, applied cryptography, OWASP defense, threat modeling, and incident response.",
      estimatedEffort: "10 Stages · ~176 Study Hours · 10–12 Weeks at 2h/day",
      stages: CYBERSECURITY_BLUEPRINT_STAGES,
    };
  }

  // 6. SCREENWRITING & NARRATIVE CRAFT
  if (
    normSubj.includes("screenwriting") ||
    normSubj.includes("scriptwriting") ||
    normSubj.includes("screenplay")
  ) {
    const screenwritingStages: BlueprintStageDefinition[] = [
      {
        stage: 1,
        title: "Premise, Logline & Dramatic Core",
        skillFocus: "Dramatic Question, Protagonist Goal & Conflict Catalyst",
        objective: "Develop a compelling dramatic premise, 25-word logline, and core thematic argument.",
        prerequisites: ["Commitment to narrative storytelling"],
        keyCompetencies: ["Logline anatomy", "Protagonist flaw vs desire", "Central dramatic question"],
        projectTitle: "Thematic Logline & Concept One-Pager",
        deliverables: ["Polished 25-word logline", "One-page concept brief with dramatic stakes"],
        definitionOfDone: ["Logline includes protagonist, inciting incident, primary conflict, and stakes"],
        estimatedStudyHours: 12,
        recommendedPacing: "1 week at 2h/day",
      },
      {
        stage: 2,
        title: "Three-Act Structure & Key Narrative Milestones",
        skillFocus: "Narrative Pacing, Inciting Incidents, Midpoints & Climax",
        objective: "Structure a feature or short narrative across classic narrative beats and turning points.",
        prerequisites: ["Stage 1: Premise & Logline"],
        keyCompetencies: ["Three-act structural landmarks", "Midpoint reversal", "All Hope Is Lost beat", "Climactic showdown"],
        projectTitle: "Beat Sheet & Major Structural Blueprint",
        deliverables: ["15-beat structural outline following Save the Cat or Hero's Journey framework"],
        definitionOfDone: ["Every beat connects logically with clear cause-and-effect progression"],
        estimatedStudyHours: 14,
        recommendedPacing: "1 week at 2h/day",
      },
      {
        stage: 3,
        title: "Character Psychology, Flaws & Relational Dynamics",
        skillFocus: "Character Arc, Internal Want vs Need & Dialogue Voice",
        objective: "Author layered character dossiers defining backstory wounds, internal vs external desires, and distinctive dialogue cadences.",
        prerequisites: ["Stage 2: Narrative Structure"],
        keyCompetencies: ["Character arcs (positive, flat, negative)", "Secondary character foils", "Distinctive dialogue cadences"],
        projectTitle: "Character Dossier & Foil Matrix",
        deliverables: ["Protagonist & Antagonist psychological character dossiers", "Dialogue sample scenes"],
        definitionOfDone: ["Characters speak in distinguishable voices without character name tags"],
        estimatedStudyHours: 14,
        recommendedPacing: "1 week at 2h/day",
      },
      {
        stage: 4,
        title: "Scene Construction, Subtext & Micro-Tension",
        skillFocus: "Scene Objectives, Conflict Escalation & Dramatic Subtext",
        objective: "Write high-tension individual scenes where every scene enters late, leaves early, and advances plot or character.",
        prerequisites: ["Stage 3: Character Dynamics"],
        keyCompetencies: ["Scene entering late and leaving early", "Subtext and unspoken agendas", "Beats and emotional polarity shifts (+ to -)"],
        projectTitle: "High-Tension Dramatic Scene Trilogy",
        deliverables: ["Three fully formatted 3-page scenes exhibiting strong polarity reversals"],
        definitionOfDone: ["Every scene demonstrates an emotional polarity shift from beginning to end"],
        estimatedStudyHours: 16,
        recommendedPacing: "1 week at 2.5h/day",
      },
      {
        stage: 5,
        title: "Industry Standard Screenplay Formatting & Software",
        skillFocus: "Sluglines, Action Lines, Dialogue Parentheticals & Software",
        objective: "Format scripts professionally according to AMPAS / WGA industry standards using Final Draft / WriterDuet.",
        prerequisites: ["Stage 4: Scene Construction"],
        keyCompetencies: ["Scene heading syntax (INT. COFFEE SHOP - DAY)", "Action line economy and active voice", "Parenthetical usage rules"],
        projectTitle: "Industry-Standard Formatted 10-Page Sequence",
        deliverables: ["Formatted 10-page opening sequence PDF complying with standard Courier 12pt format"],
        definitionOfDone: ["Zero formatting errors (margins, headers, page numbers, character cues)"],
        estimatedStudyHours: 14,
        recommendedPacing: "1 week at 2h/day",
      },
      {
        stage: 6,
        title: "Complete Formatted Screenplay & Revision Masterwork",
        skillFocus: "Full Script Execution, Table Reads, Feedback Integration & Polish",
        objective: "Write, table-read, rewrite, and polish a complete short film screenplay or first-act feature script.",
        prerequisites: ["Stages 1 through 5"],
        keyCompetencies: ["First-draft execution velocity", "Development notes analysis and table-read feedback", "Line-by-line dialogue polish"],
        projectTitle: "Completed Short Film Screenplay Master Draft",
        deliverables: ["Complete 15-page short film screenplay master draft with title page and synopsis"],
        definitionOfDone: ["Script passes table read with clean narrative momentum and positive peer feedback"],
        estimatedStudyHours: 24,
        recommendedPacing: "2 weeks at 2h/day",
      },
    ];

    return {
      subject: "Screenwriting",
      domain: "Cinematic Arts & Narrative Design",
      roadmapType: "LEARNING",
      experienceLevel,
      targetOutcome: "Master cinematic storytelling, three-act structure, character psychology, subtextual dialogue, and industry-standard script formatting.",
      estimatedEffort: "6 Stages · ~94 Writing & Study Hours · 6–8 Weeks at 2h/day",
      stages: screenwritingStages,
    };
  }

  // 6.5 VIDEO EDITING & POST-PRODUCTION CURRICULUM
  if (
    normSubj.includes("video edit") ||
    normSubj.includes("video-edit") ||
    normSubj.includes("video editor")
  ) {
    return VIDEO_EDITING_BLUEPRINT;
  }

  // 6.6 DATA STRUCTURES & ALGORITHMS (DSA) CURRICULUM
  if (
    normSubj === "dsa" ||
    normSubj.includes("dsa") ||
    normSubj.includes("data structure") ||
    normSubj.includes("algorithms")
  ) {
    return DSA_BLUEPRINT;
  }

  // 7. UNIVERSAL DYNAMIC SUBJECT PLANNER
  const isCreativeSubject = /\b(?:creative|arts|film|cinema|movie|acting|directing|writing|screenplay|script|music|audio|sound|photography|design|drawing|animation|dance|theatre|video|art)\b/i.test(subject + " " + domain);

  const dynamicStageTitles = isCreativeSubject
    ? [
        `${subject} Foundations, Creative Vision & Toolchain Setup`,
        `Core ${subject} Techniques, Craft Mechanics & Iterative Workflows`,
        `Intermediate ${subject} Composition, Structural Harmony & Project Design`,
        `Advanced ${subject} Artistry, Nuance & Expressive Mastery`,
        `${subject} Peer Critique, Professional Polish & Presentation Standards`,
        `Master ${subject} Capstone, Public Showcase & Professional Portfolio`,
      ]
    : [
        `${subject} Foundations, Mental Models & Toolchain Setup`,
        `Core ${subject} Principles, Syntax & Standard Idioms`,
        `Intermediate ${subject} Architecture, Modular Design & Integration`,
        `Advanced ${subject} Systems, Performance & Optimization`,
        `${subject} Automated Testing, Verification & Quality Standards`,
        `Production ${subject} Capstone, Portfolio Release & Industry Evaluation`,
      ];

  const dynamicStages: BlueprintStageDefinition[] = dynamicStageTitles.map((title, idx) => ({
    stage: idx + 1,
    title,
    skillFocus: title.split(",")[0].trim(),
    objective: `Acquire and demonstrate mastery over ${title} with practical deliverables and verifiable criteria.`,
    prerequisites: idx === 0 ? ["Foundational curiosity and commitment to deliberate practice"] : [`Stage ${idx} Completion Gate`],
    keyCompetencies: [`${subject} stage ${idx + 1} core competencies`, "Practical creative/technical execution", "Professional standards"],
    projectTitle: `${title.split(",")[0].trim()} Milestone Project`,
    deliverables: [`Verified Stage ${idx + 1} project deliverable`, isCreativeSubject ? "Portfolio piece and creative reflection notes" : "Passing unit assertions or technical documentation"],
    definitionOfDone: [`Satisfies all project brief requirements with high fidelity`, `Documented process and design rationale`],
    estimatedStudyHours: 16 + idx * 2,
    recommendedPacing: "1 to 1.5 weeks at 2h/day",
  }));

  return {
    subject,
    domain,
    roadmapType: "LEARNING",
    experienceLevel,
    targetOutcome: `Master ${subject} from foundational principles to production-grade portfolio capstone.`,
    estimatedEffort: `${dynamicStages.length} Stages · ~120 Study Hours · 8–10 Weeks at 2h/day`,
    stages: dynamicStages,
  };
}

export function buildDeepContentForStage(
  blueprintStage: BlueprintStageDefinition,
  subject: string,
  domain: string,
  roadmapType: RoadmapType
): StageContentDetail {
  const normSubj = subject.toLowerCase();

  if (normSubj.includes("python")) {
    return getPythonDeepStageContent(blueprintStage.stage);
  }
  if (normSubj.includes("frontend") || normSubj.includes("html") || normSubj.includes("css") || normSubj.includes("react")) {
    return getFrontendDeepStageContent(blueprintStage.stage);
  }
  if (normSubj.includes("machine learning") || normSubj.includes("ml") || normSubj.includes("deep learning") || normSubj.includes("ai")) {
    return getMLDeepStageContent(blueprintStage.stage);
  }
  if (normSubj.includes("cybersecurity") || normSubj.includes("security") || normSubj.includes("infosec")) {
    return getCybersecurityDeepStageContent(blueprintStage.stage);
  }
  if (normSubj.includes("video edit") || normSubj.includes("video-edit") || normSubj.includes("video editor")) {
    return buildVideoEditingStageContent(blueprintStage.stage);
  }
  if (normSubj === "dsa" || normSubj.includes("dsa") || normSubj.includes("data structure") || normSubj.includes("algorithms")) {
    return buildDSAStageContent(blueprintStage.stage);
  }

  // Dynamic high-depth generator for any other subject
  const stageNum = blueprintStage.stage;
  const title = blueprintStage.title;
  const isCreative = /\b(?:creative|arts|film|cinema|movie|acting|directing|writing|screenplay|script|music|audio|sound|photography|design|drawing|animation|dance|theatre|video|art)\b/i.test(subject + " " + domain);

  return {
    topics: isCreative
      ? [
          {
            id: `dyn_${stageNum}_1`,
            title: `${title}: Core Creative Principles & Craft Foundations`,
            completed: false,
            subtopics: [
              `Foundational concepts, creative vision, and mental models of ${title}`,
              `Standard artistic conventions, terminology, and workflows in ${subject}`,
              `Aesthetic balance, stylistic intentionality, and compositional harmony`,
              `Medium-specific techniques, tools, and material/digital requirements`,
              `Workflow organization, reference collection, and initial creative setup`,
            ],
            explanation:
              `Stage ${stageNum} establishes the core artistic and technical mechanics of ${title}. Mastering these fundamentals in ${subject} ensures that your work achieves emotional clarity, expressive depth, and professional execution.`,
            keySyntaxOrApis: [
              `// Creative Principles for Stage ${stageNum}: ${title}`,
              `Primary Focus: Establish compelling artistic intent, technical fluency, and distinct voice.`,
            ],
            example: {
              title: `${title} Creative Walkthrough`,
              description: `Demonstrating professional creative workflows and execution for Stage ${stageNum}.`,
              codeOrWalkthrough:
                `// Professional Workflow for ${subject} - Stage ${stageNum}: ${title}\n1. Concept & Vision: Define the emotional tone and target audience response.\n2. Foundation Setup: Gather source material, references, and toolchain presets.\n3. First Draft / Assembly: Execute the primary structure without premature self-critique.\n4. Critical Review: Check alignment with core principles of ${title}.`,
            },
            exercise: {
              title: `${title} Craft Exercise`,
              prompt: `Execute a focused creative piece applying the foundational techniques of ${title} for ${subject}.`,
              expectedOutcome: `Completed creative study demonstrating deliberate mastery and professional polish.`,
            },
            troubleshooting: [
              `Avoid rushing into details before establishing strong foundational composition.`,
              `Maintain a reference library of professional works to guide aesthetic standards.`,
            ],
          },
          {
            id: `dyn_${stageNum}_2`,
            title: `${title}: Expressive Composition & Project Execution`,
            completed: false,
            subtopics: [
              `Structural composition, rhythm, and emotional pacing in ${subject}`,
              `Integrating nuanced techniques to elevate storytelling and aesthetic impact`,
              `Iterative revision: diagnosing weak points and refining execution`,
              `Stylistic cohesion across complex, multi-part creative projects`,
              `Feedback integration and peer critique methodologies`,
            ],
            explanation:
              `Creative execution in ${subject} requires balancing technical precision with artistic voice. Structuring projects with disciplined iteration allows ideas to mature from raw concepts into captivating deliverables.`,
            keySyntaxOrApis: [
              `// Expressive Composition Guidelines`,
              `Pacing, rhythm, and harmonic balance guide viewer/listener engagement.`,
            ],
            example: {
              title: `${title} Project Execution Case Study`,
              description: `Step-by-step breakdown of an intermediate creative deliverable.`,
              codeOrWalkthrough:
                `// Case Study for ${subject} - Stage ${stageNum}\n• Pre-Production / Ideation: Identify central narrative or aesthetic goal.\n• Production / Execution: Apply specialized ${subject} techniques.\n• Post-Production / Polish: Refine transitions, balance, and presentation.\n• Evaluation: Assess emotional resonance and technical finish.`,
            },
            exercise: {
              title: `${title} Portfolio Project Piece`,
              prompt: `Develop an original, substantial project deliverable applying ${title} techniques suitable for your professional portfolio.`,
              expectedOutcome: `Polished creative project deliverable reflecting authentic craft depth.`,
            },
            troubleshooting: [
              `Balance experimentation with structural clarity to prevent audience disorientation.`,
              `Step back periodically to assess the project as a cohesive whole rather than isolated details.`,
            ],
          },
          {
            id: `dyn_${stageNum}_3`,
            title: `${title}: Professional Polish, Critique & Portfolio Standards`,
            completed: false,
            subtopics: [
              `Industry-standard presentation formats, delivery specifications, and mastering`,
              `Critical analysis: conducting objective peer critiques and client reviews`,
              `Overcoming common pitfalls, creative blocks, and technical bottlenecks`,
              `Portfolio curation: presenting project breakdowns, context, and creative decisions`,
              `Career pathways, professional networks, and continuous artistic growth`,
            ],
            explanation:
              `Achieving professional caliber in ${subject} demands rigorous quality standards. Preparing work for public exhibition, client handoff, or portfolio presentation requires meticulous attention to detail and delivery standards.`,
            keySyntaxOrApis: [
              `// Professional Delivery Standards`,
              `Clean delivery formats, comprehensive project case studies, and presentation readiness.`,
            ],
            example: {
              title: `${title} Portfolio Presentation Breakdown`,
              description: `How to document and showcase your Stage ${stageNum} deliverable professionally.`,
              codeOrWalkthrough:
                `// Portfolio Presentation Guide for ${subject}\n• Project Title & Role: Clearly state your contribution.\n• Creative Intent & Brief: Contextualize the challenge and aesthetic vision.\n• Process Documentation: Showcase progression from initial draft to final master.\n• Final Artifact: High-resolution showcase asset.`,
            },
            exercise: {
              title: `${title} Capstone Review & Showcase`,
              prompt: `Conduct a complete self-critique of your Stage ${stageNum} deliverables, implement final refinements, and prepare a presentation-ready case study.`,
              expectedOutcome: `High-fidelity deliverable with professional case study documentation.`,
            },
            troubleshooting: [
              `Always test presentation assets across multiple viewing/listening environments.`,
              `Document the problem-solving journey to highlight your creative decision-making.`,
            ],
          },
        ]
      : [
          {
            id: `dyn_${stageNum}_1`,
            title: `${title}: Core Mechanics & Foundational Principles`,
            completed: false,
            subtopics: [
              `Foundational principles, core abstractions, and mental models of ${title}`,
              `Standard conventions, terminology, and syntax structures in ${subject}`,
              `Edge case validation, defensive assertions, and boundary checks`,
              `Performance, scalability, and resource utilization considerations`,
              `Tooling integration, diagnostic environments, and setup validation`,
            ],
            explanation:
              `Stage ${stageNum} establishes the core mechanics of ${title}. Mastering these fundamental concepts in ${subject} ensures that subsequent architectures rest on solid, well-understood principles while preventing common anti-patterns.`,
            keySyntaxOrApis: [
              `// Primary syntax demonstration for Stage ${stageNum}: ${title}`,
              `const ${subject.toLowerCase().replace(/[^a-z0-9]/g, "_")}_context = initializeStage(${stageNum});`,
            ],
            example: {
              title: `${title} Worked Example`,
              description: `Practical walkthrough demonstrating the core techniques of Stage ${stageNum}.`,
              codeOrWalkthrough:
                `// Worked walkthrough for ${subject} - Stage ${stageNum}: ${title}\nfunction execute${subject.replace(/[^a-zA-Z0-9]/g, "")}Stage${stageNum}() {\n  const config = { stage: ${stageNum}, subject: "${subject}", active: true };\n  if (!config.subject) throw new Error("Invalid configuration");\n  return config;\n}\n\n// Verified execution\nconsole.log(execute${subject.replace(/[^a-zA-Z0-9]/g, "")}Stage${stageNum}());`,
            },
            exercise: {
              title: `${title} Implementation Exercise`,
              prompt: `Implement a modular artifact satisfying the functional requirements of Stage ${stageNum} with zero runtime warnings.`,
              expectedOutcome: `Artifact passes all verification assertions and adheres to ${subject} best practices.`,
              starterCode: `// Starter workspace for Stage ${stageNum}\nfunction runExercise() {\n  return { stage: ${stageNum}, completed: true };\n}`,
            },
            troubleshooting: [
              `Verify that all input data is validated before processing.`,
              `Ensure toolchain versions match project requirements.`,
            ],
          },
          {
            id: `dyn_${stageNum}_2`,
            title: `${title}: Modular Architecture & Practical Design`,
            completed: false,
            subtopics: [
              `Modular architecture, separation of concerns, and clean interfaces`,
              `Composing reusable building blocks and eliminating redundancy`,
              `Defensive error handling, fault tolerance, and graceful degradation`,
              `State management, transactional safety, and data flow synchronization`,
              `Structured logging, diagnostic instrumentation, and telemetry`,
            ],
            explanation:
              `Designing modular architectures in ${subject} ensures that individual components can be tested, refactored, and maintained independently. Clean interface boundaries reduce coupling and allow systems to scale smoothly.`,
            keySyntaxOrApis: [
              `// Architecture abstraction pattern`,
              `interface I${subject.replace(/[^a-zA-Z0-9]/g, "")}Service { execute(): Promise<boolean>; }`,
            ],
            example: {
              title: `${title} Architecture Pattern`,
              description: `Demonstrating modular decomposition and defensive error boundaries.`,
              codeOrWalkthrough:
                `// Architecture pattern for ${subject}\nexport class ${subject.replace(/[^a-zA-Z0-9]/g, "")}Service {\n  constructor(private name: string = "Service") {}\n  process(data: unknown): boolean {\n    if (!data) throw new Error("Data required");\n    return true;\n  }\n}`,
            },
            exercise: {
              title: `${title} Architecture Lab`,
              prompt: `Decompose an existing workflow into three modular, reusable components with explicit input/output contracts.`,
              expectedOutcome: `Refactored components execute independently with zero coupling.`,
            },
            troubleshooting: [
              `Avoid creating monolithic classes or functions exceeding single-responsibility limits.`,
              `Always handle potential null or undefined states defensively.`,
            ],
          },
          {
            id: `dyn_${stageNum}_3`,
            title: `${title}: Verification, Testing & Quality Standards`,
            completed: false,
            subtopics: [
              `Automated testing, test-driven validation, and assertion suites`,
              `Benchmarking throughput, latency, and resource efficiency`,
              `Defensive security hardening and boundary audit checks`,
              `Documentation standards, diagrams, and peer review checklists`,
              `Production readiness review and verification milestones`,
            ],
            explanation:
              `Quality assurance in ${subject} separates prototypes from reliable, enterprise-grade deliverables. Implementing automated verification suites and structured testing rubrics ensures that changes do not introduce regressions.`,
            keySyntaxOrApis: [
              `// Quality assertion pattern`,
              `assert(result.status === "verified", "Stage ${stageNum} assertion failed");`,
            ],
            example: {
              title: `${title} Test Suite Example`,
              description: `Demonstrating automated assertions and edge case validation for Stage ${stageNum}.`,
              codeOrWalkthrough:
                `// Test suite pattern for Stage ${stageNum}\nfunction testStage${stageNum}Requirements() {\n  const result = { level: ${stageNum}, valid: true };\n  console.assert(result.level === ${stageNum}, "Stage number matches");\n  console.assert(result.valid === true, "Validation passes");\n  return true;\n}\ntestStage${stageNum}Requirements();`,
            },
            exercise: {
              title: `${title} Verification Lab`,
              prompt: `Author an automated test harness validating normal cases, boundary limits, and expected failure modes for Stage ${stageNum}.`,
              expectedOutcome: `Test suite verifies 100% of defined success and failure conditions.`,
            },
            troubleshooting: [
              `Ensure test environments are completely isolated from production state.`,
              `Write descriptive assertion error messages that clearly identify why a check failed.`,
            ],
          },
        ],
    commonMistakesAndTroubleshooting: isCreative
      ? [
          {
            mistake: `Overcomplicating the composition before mastering foundational ${title} craft`,
            consequence: "Work feels cluttered, confusing the audience and obscuring the central creative message.",
            solutionOrFix: "Focus on strong, clear core choices. Simplify elements until only what serves the emotional vision remains.",
          },
          {
            mistake: `Neglecting technical delivery specifications (resolution, color space, audio levels)`,
            consequence: "High-quality creative work suffers from distortion, banding, clipping, or exhibition errors.",
            solutionOrFix: "Calibrate your production environment and verify all technical specs against exhibition standards.",
          },
          {
            mistake: `Working in isolation without iterative critique and peer review`,
            consequence: "Unconscious stylistic blind spots and structural pacing issues remain unaddressed.",
            solutionOrFix: "Seek structured feedback from peer creators and test your work with representative audiences.",
          },
        ]
      : [
          {
            mistake: `Skipping defensive input validation and edge cases in Stage ${stageNum}`,
            consequence: "Unexpected runtime exceptions, corrupted state, or security vulnerabilities in production.",
            solutionOrFix: "Add strict input bounds checking, schema validation, and guard clauses upfront.",
          },
          {
            mistake: `Ignoring automated testing until final integration`,
            consequence: "Regressions multiply and debugging becomes exponentially slower.",
            solutionOrFix: "Write automated assertions alongside implementation for rapid, immediate feedback.",
          },
          {
            mistake: `Violating single-responsibility principles in component design`,
            consequence: "Tight coupling makes refactoring, testing, and scaling extremely difficult.",
            solutionOrFix: "Decompose monoliths into focused, modular functions with clear input/output contracts.",
          },
        ],
    knowledgeCheck: [
      {
        question: `What are the primary architectural principles and tradeoffs introduced in Stage ${stageNum}: ${title}?`,
        options: [
          "Superficial brevity over maintainability and team readability",
          "Modularity, type safety, clean separation of concerns, and defensive boundary validation",
          "Global mutable state to bypass function arguments",
          "Skipping error handling to maximize raw throughput",
        ],
        answerOrExplanation:
          "Option B: Professional discipline emphasizes modularity, explicit type contracts, clean separation of concerns, and defensive validation to ensure systems remain maintainable, testable, and robust at scale.",
        solutionRubric: "Demonstrates clear grasp of architectural tradeoffs, edge cases, and design rationale.",
      },
      {
        question: `How do you systematically troubleshoot unexpected failures when executing Stage ${stageNum} tasks?`,
        answerOrExplanation:
          "Inspect diagnostic logs, isolate components in minimal test harnesses, verify environment configurations, and validate inputs against expected schemas.",
        solutionRubric: "Articulates a structured scientific debugging methodology rather than trial and error.",
      },
      {
        question: `What criteria distinguish production-ready work from an MVP prototype in Stage ${stageNum}?`,
        answerOrExplanation:
          "Production readiness requires automated test coverage, defensive error handling, accessibility compliance, performance profiling, and comprehensive documentation.",
        solutionRubric: "Mentions observability, testing, error recovery, and security considerations.",
      },
    ],
    completionCriteria: [
      `All Stage ${stageNum} topic checklists verified and thoroughly understood`,
      `Milestone project implemented and passing all functional test cases`,
      `Artifact adheres to ecosystem best practices with zero unhandled warnings`,
      `Self-assessment knowledge check answered accurately`,
    ],
    freeResources: [
      {
        title: `Official ${subject} Documentation & Reference Manual`,
        url: "https://developer.mozilla.org/en-US/",
        platform: "Reference Documentation",
        type: "docs",
        isFree: true,
      },
      {
        title: `${subject} Architecture & Best Practices Guide`,
        url: "https://github.com/",
        platform: "Open Source Guide",
        type: "tutorial",
        isFree: true,
      },
    ],
  };
}
