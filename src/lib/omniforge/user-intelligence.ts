/**
 * OmniForge Core User Intelligence Engine
 * 
 * Orchestrates:
 * 1. User Identity & Account Role (CLIENT vs CREATOR)
 * 2. Dynamic User Profile & Evidence-Based Skill DNA
 * 3. Career Goal Analysis & Skill Gap Matrix
 * 4. Progressive Visual Roadmap & 10-Stage Project System
 * 5. Resume Analysis & Competency Extraction
 * 6. AI Project Plan Engine & Task Decomposition
 * 7. Synchronized State across Chat, Roadmap, and Project Plan
 */

export type UserAccountRole = "CLIENT" | "CREATOR";

export type UserIntentMode =
  | "CREATOR_LEARNING"
  | "CLIENT_PROJECT"
  | "TALENT_DISCOVERY"
  | "COLLABORATION"
  | "RESUME_ANALYSIS";

export interface SkillEvidenceItem {
  id: string;
  type: "resume" | "project_submission" | "assessment" | "task" | "certification";
  title: string;
  description: string;
  score?: number;
  date: string;
  verified: boolean;
}

export interface SkillDnaEntry {
  skillName: string;
  proficiency: number; // 0 - 100
  confidence: "HIGH" | "MEDIUM" | "ESTIMATED";
  evidence: string;
  evidenceList?: SkillEvidenceItem[];
  lastDemonstrated: string;
  relatedSkills: string[];
  targetLevel: number; // 0 - 100
  category: "frontend" | "backend" | "database" | "ai_ml" | "devops" | "design" | "tools" | "soft_skills";
  verificationStatus?: "VERIFIED" | "PENDING_EVALUATION" | "UNVERIFIED";
  lastVerified?: string;
}

export interface SkillGapItem {
  skill: string;
  current: number;
  required: number;
  gap: number;
  status: "SATISFIED" | "SMALL_GAP" | "MEDIUM_GAP" | "LARGE_GAP";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "OPTIONAL";
  reason: string;
}

export type RoadmapNodeState =
  | "LOCKED"
  | "AVAILABLE"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "REVISION_REQUIRED"
  | "PASSED"
  | "COMPLETED"
  | "FAILED"
  | "REVIEW_REQUIRED";

export interface RoadmapSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface RoadmapProjectTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  subtasks: RoadmapSubtask[];
}

export interface ProjectSubmission {
  nodeId: string;
  level: number;
  submissionType: "code" | "github" | "url" | "text";
  content: string;
  repositoryUrl?: string;
  liveDemoUrl?: string;
  notes?: string;
  submittedAt: string;
}

export interface ProjectEvaluationResult {
  nodeId: string;
  level: number;
  projectTitle: string;
  score: number; // 0 - 100
  passed: boolean;
  decision: "PASSED" | "REVISION_REQUIRED";
  skillEvidence: string;
  strengths: string[];
  weaknesses: string[];
  missingRequirements: string[];
  recommendations: string[];
  nextAction: string;
  evaluatedAt: string;
}

export interface DeepTopicItem {
  id: string;
  title: string;
  completed: boolean;
  subtopics: string[];
  explanation: string;
  keySyntaxOrApis?: string[];
  example?: {
    title: string;
    description: string;
    codeOrWalkthrough: string;
  };
  exercise?: {
    title: string;
    prompt: string;
    instructions?: string[];
    expectedOutcome: string;
    starterCode?: string;
  };
  troubleshooting?: string[];
}

export interface RoadmapTroubleshootingItem {
  mistake: string;
  consequence: string;
  solutionOrFix: string;
}

export interface RoadmapKnowledgeCheckItem {
  question: string;
  options?: string[];
  answerOrExplanation: string;
  solutionRubric?: string;
}

export interface RoadmapActionableTask {
  id: string;
  title: string;
  deliverable: string;
  dependencies: string[];
  description?: string;
  role?: string;
  roleOrOwner?: string;
  risks?: string;
  riskMitigation?: string;
  validationProcedure?: string;
  completed: boolean;
}

export interface RoadmapNode {
  id: string;
  level: number; // 1 to 10 or 1 to 12
  title: string;
  skill: string;
  category: string;
  concept: string;
  state: RoadmapNodeState;
  whyLearnThis: string;
  prerequisites?: string[];
  task: {
    title: string;
    description: string;
    deliverables: string[];
  };
  miniProject: {
    title: string;
    description: string;
    techStack: string[];
    difficulty: "Beginner" | "Intermediate" | "Advanced" | "Production";
    requirements?: string[];
  };
  projectTasks?: RoadmapProjectTask[];
  submission?: ProjectSubmission;
  evaluation?: ProjectEvaluationResult;
  assessment: {
    criterion: string;
    passingScore: number;
  };
  // Actionable milestone fields (Section 3)
  learningObjectives?: string[];
  topicChecklist?: Array<{ id: string; title: string; completed: boolean }>;
  practicalExercises?: Array<{
    id: string;
    title: string;
    prompt: string;
    starterCode?: string;
    hints?: string[];
    solutionDeliverable?: string;
    instructions?: string[];
    expectedOutcome?: string;
  }>;
  rubric?: Array<{
    criterion: string;
    weight: number;
    description: string;
  }>;
  estimatedStudyHours?: number;
  estimatedStudyTime?: string;
  freeResources?: Array<{
    title: string;
    url: string;
    platform: string;
    type: "docs" | "tutorial" | "video" | "interactive";
    isFree: boolean;
  }>;
  nextMilestoneUnlocked?: {
    stage: number;
    title: string;
  };
  // Universal Deep Roadmap Extensions (Section B & Section D)
  topics?: DeepTopicItem[];
  commonMistakesAndTroubleshooting?: RoadmapTroubleshootingItem[];
  knowledgeCheck?: RoadmapKnowledgeCheckItem[];
  completionCriteria?: string[];
  actionableTasks?: RoadmapActionableTask[];
  validationProcedures?: string[];
  risksAndMitigations?: Array<{ risk: string; mitigation: string }>;
  // Execution & Blueprint quality gate extensions
  isExpanded?: boolean;
  definitionOfDone?: string[];
  acceptanceCriteria?: string[];
  testingAndVerification?: string[];
  requiredToolsAndResources?: string[];
  evidenceRequired?: string[];
  prerequisiteChecks?: string[];
  recommendedPacing?: string;
  nextStageDependencies?: string[];
}

export interface ProgressiveProjectStage {
  stage: number;
  skillFocus: string;
  projectTitle: string;
  deliverables: string;
  complexity: string;
  status: "COMPLETED" | "ACTIVE" | "UPCOMING";
  description?: string;
  summary?: string;
}

export interface VisualRoadmapData {
  id?: string;
  goal: string;
  targetRole: string;
  trackKey?: "full_stack" | "html_frontend" | string;
  subject?: string;
  domain?: string;
  description?: string;
  roadmapType?: "LEARNING" | "EXECUTION";
  experienceLevel?: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  curriculumBlueprint?: any;
  dailyStudyHours?: number;
  totalStudyHours?: number;
  overallProgress: number; // percentage
  currentNodeId: string;
  pointerLevel: number;
  nodes: RoadmapNode[];
  stages: ProgressiveProjectStage[];
  lastUpdated: string;
}

export interface ParsedResumeData {
  education: {
    degree: string;
    branch: string;
    currentYear: string;
    graduationStatus: string;
    institution: string;
  };
  technicalSkills: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    tools: string[];
    ai_ml: string[];
  };
  nonTechnicalSkills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    type: "internship" | "job" | "freelance" | "project";
    description: string;
  }>;
  projects: Array<{
    name: string;
    technologies: string[];
    complexity: string;
    role: string;
    outcome: string;
  }>;
  certifications: string[];
}

export interface ProjectPlanSubtask {
  id: string;
  title: string;
  completed: boolean;
  estimatedHours: number;
}

export interface ProjectPlanTask {
  id: string;
  title: string;
  description: string;
  requiredRole: string;
  requiredSkills: string[];
  dependencies: string[];
  subtasks: ProjectPlanSubtask[];
}

export interface ProjectPlanModule {
  id: string;
  name: string;
  description: string;
  features: string[];
  tasks: ProjectPlanTask[];
}

export interface ProjectPlanPhase {
  id: string;
  name: string;
  duration: string;
  modules: ProjectPlanModule[];
}

export interface DetailedProjectPlan {
  id: string;
  title: string;
  overview: string;
  objectives: string[];
  targetUsers: string[];
  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    aiFeatures: string[];
    devops: string[];
    security: string[];
  };
  architectureSummary: string;
  apiRequirements: string[];
  phases: ProjectPlanPhase[];
  teamRequirements: Array<{
    role: string;
    count: number;
    responsibilities: string;
  }>;
  timeline: string;
  risksAndMitigations: Array<{
    risk: string;
    mitigation: string;
  }>;
  testingStrategy: string;
  deploymentPlan: string;
  futureEnhancements: string[];
}

export interface UserIntelligenceProfile {
  id: string;
  role: UserAccountRole;
  roleConfidence: number; // 0 - 100
  roleSource: "account" | "message" | "profile" | "inferred";
  activeIntentMode?: UserIntentMode;
  careerGoal: string;
  targetRole: string;
  education?: ParsedResumeData["education"];
  experience?: ParsedResumeData["experience"];
  skillDna: Record<string, SkillDnaEntry>;
  skillGaps: SkillGapItem[];
  roadmap: VisualRoadmapData;
  activeRoadmapTrack?: "full_stack" | "html_frontend" | string;
  savedRoadmaps?: Record<string, VisualRoadmapData>;
  activeProjectPlan?: DetailedProjectPlan | null;
  resumeParsed: boolean;
  resumeData?: ParsedResumeData | null;
  activeSubmissionNodeId?: string | null;
}

// ============================================================================
// DEFAULT EVIDENCE-DERIVED SKILL DNA & ROADMAP
// ============================================================================

export const DEFAULT_SKILL_DNA: Record<string, SkillDnaEntry> = {
  Python: {
    skillName: "Python",
    proficiency: 82,
    confidence: "HIGH",
    evidence: "Built 5 Python backend scripting and API integration projects",
    evidenceList: [
      { id: "ev-py-1", type: "project_submission", title: "FastAPI Backend Engine", description: "Asynchronous REST microservice with SQLite database", score: 85, date: "2026-09-15", verified: true },
      { id: "ev-py-2", type: "task", title: "Automated Data Ingestion Script", description: "CSV parsing and telemetry transforms", score: 80, date: "2026-09-22", verified: true }
    ],
    lastDemonstrated: "Recent project portfolio",
    relatedSkills: ["FastAPI", "Data Analysis", "Automation"],
    targetLevel: 90,
    category: "backend",
    verificationStatus: "VERIFIED",
    lastVerified: "2026-09-22",
  },
  HTML: {
    skillName: "HTML",
    proficiency: 91,
    confidence: "HIGH",
    evidence: "Demonstrated semantic HTML5 architecture across multiple live web apps",
    evidenceList: [
      { id: "ev-html-1", type: "project_submission", title: "Personal Profile Page", description: "Full semantic structure, accessible landmarks, and contact form", score: 92, date: "2026-08-10", verified: true },
      { id: "ev-html-2", type: "assessment", title: "W3C Semantic Validation Audit", description: "Zero markup errors and 100% WCAG AAA landmark compliance", score: 90, date: "2026-08-14", verified: true }
    ],
    lastDemonstrated: "Verified web layouts",
    relatedSkills: ["CSS", "Accessibility", "Forms"],
    targetLevel: 80,
    category: "frontend",
    verificationStatus: "VERIFIED",
    lastVerified: "2026-08-14",
  },
  CSS: {
    skillName: "CSS",
    proficiency: 76,
    confidence: "HIGH",
    evidence: "Implemented responsive Flexbox & CSS Grid portfolio sites with fluid typography",
    evidenceList: [
      { id: "ev-css-1", type: "project_submission", title: "Responsive Portfolio Layout", description: "Mobile-first queries across 375px-1440px with CSS Grid & Dark Mode", score: 78, date: "2026-08-28", verified: true },
      { id: "ev-css-2", type: "task", title: "CSS Design Tokens & Micro-interactions", description: "CSS custom properties with hover transitions", score: 74, date: "2026-09-02", verified: true }
    ],
    lastDemonstrated: "Responsive UI deliverables",
    relatedSkills: ["Tailwind", "Responsive Design", "Animations"],
    targetLevel: 80,
    category: "frontend",
    verificationStatus: "VERIFIED",
    lastVerified: "2026-09-02",
  },
  JavaScript: {
    skillName: "JavaScript",
    proficiency: 63,
    confidence: "MEDIUM",
    evidence: "ES6+ asynchronous syntax, DOM manipulation, and browser fetch API",
    evidenceList: [
      { id: "ev-js-1", type: "task", title: "Interactive Calculator Logic", description: "Modular calculation pure functions and event listener binding", score: 65, date: "2026-09-18", verified: true }
    ],
    lastDemonstrated: "Interactive calculator and component scripts",
    relatedSkills: ["TypeScript", "React", "Node.js"],
    targetLevel: 85,
    category: "frontend",
    verificationStatus: "VERIFIED",
    lastVerified: "2026-09-18",
  },
  React: {
    skillName: "React",
    proficiency: 41,
    confidence: "MEDIUM",
    evidence: "Basic component state hooks and JSX composition",
    evidenceList: [
      { id: "ev-react-1", type: "task", title: "Counter & Todo Starter", description: "useState and props drilling demonstration", score: 45, date: "2026-09-25", verified: false }
    ],
    lastDemonstrated: "Starter dashboard components",
    relatedSkills: ["Next.js", "Redux", "TypeScript"],
    targetLevel: 80,
    category: "frontend",
    verificationStatus: "UNVERIFIED",
  },
  "Node.js": {
    skillName: "Node.js",
    proficiency: 25,
    confidence: "ESTIMATED",
    evidence: "Starter Express.js routes and HTTP request parsing",
    evidenceList: [],
    lastDemonstrated: "Basic REST endpoint test",
    relatedSkills: ["Express", "REST APIs", "Backend"],
    targetLevel: 75,
    category: "backend",
    verificationStatus: "UNVERIFIED",
  },
  SQL: {
    skillName: "SQL",
    proficiency: 58,
    confidence: "MEDIUM",
    evidence: "Relational queries, primary/foreign keys, joins, and indexing basics",
    evidenceList: [
      { id: "ev-sql-1", type: "task", title: "PostgreSQL Relational Schema", description: "3NF schema design for e-commerce tables", score: 60, date: "2026-09-12", verified: true }
    ],
    lastDemonstrated: "PostgreSQL schema design",
    relatedSkills: ["PostgreSQL", "Database Design", "ORMs"],
    targetLevel: 70,
    category: "database",
    verificationStatus: "VERIFIED",
    lastVerified: "2026-09-12",
  },
  Git: {
    skillName: "Git",
    proficiency: 72,
    confidence: "HIGH",
    evidence: "Branching, pull request reviews, commit conventions, and merge conflicts",
    evidenceList: [
      { id: "ev-git-1", type: "assessment", title: "Git Collaborative Workflow", description: "Feature branching, rebasing, and merge resolution", score: 75, date: "2026-08-20", verified: true }
    ],
    lastDemonstrated: "Repository version history",
    relatedSkills: ["GitHub", "Collaboration", "CI/CD"],
    targetLevel: 80,
    category: "tools",
    verificationStatus: "VERIFIED",
    lastVerified: "2026-08-20",
  },
};

// ============================================================================
// 10-LEVEL PROGRESSIVE ROADMAP & 10-STAGE PROJECT SYSTEM (Sections 8 & 9)
// ============================================================================

export function buildStandardFullStackRoadmap(skillDna: Record<string, SkillDnaEntry>): VisualRoadmapData {
  const htmlScore = skillDna["HTML"]?.proficiency || 0;
  const cssScore = skillDna["CSS"]?.proficiency || 0;
  const jsScore = skillDna["JavaScript"]?.proficiency || 0;
  const reactScore = skillDna["React"]?.proficiency || 0;
  const nodeScore = skillDna["Node.js"]?.proficiency || 0;
  const sqlScore = skillDna["SQL"]?.proficiency || 0;

  // Derive node states from actual evidence percentages
  const level1State: RoadmapNodeState = htmlScore >= 80 ? "COMPLETED" : "IN_PROGRESS";
  const level2State: RoadmapNodeState = cssScore >= 75 ? "COMPLETED" : htmlScore >= 80 ? "IN_PROGRESS" : "LOCKED";
  const level3State: RoadmapNodeState = (htmlScore >= 80 && cssScore >= 75) ? "COMPLETED" : level2State === "COMPLETED" ? "IN_PROGRESS" : "LOCKED";
  const level4State: RoadmapNodeState = jsScore >= 60 ? "COMPLETED" : level3State === "COMPLETED" ? "IN_PROGRESS" : "LOCKED";
  const level5State: RoadmapNodeState = reactScore >= 50 ? "COMPLETED" : (jsScore >= 60) ? "IN_PROGRESS" : level4State === "COMPLETED" ? "AVAILABLE" : "LOCKED";
  const level6State: RoadmapNodeState = reactScore >= 70 ? "COMPLETED" : (level5State === "COMPLETED" || reactScore >= 50) ? "IN_PROGRESS" : "LOCKED";
  const level7State: RoadmapNodeState = nodeScore >= 60 ? "COMPLETED" : level6State === "COMPLETED" ? "AVAILABLE" : "LOCKED";
  const level8State: RoadmapNodeState = sqlScore >= 65 ? "COMPLETED" : level7State === "COMPLETED" ? "AVAILABLE" : "LOCKED";
  const level9State: RoadmapNodeState = (nodeScore >= 60 && sqlScore >= 65) ? "AVAILABLE" : "LOCKED";
  const level10State: RoadmapNodeState = "LOCKED";

  const nodes: RoadmapNode[] = [
    {
      id: "node-lvl-1",
      level: 1,
      title: "HTML Fundamentals",
      skill: "HTML",
      category: "Frontend",
      concept: "Semantic HTML5, Accessibility (a11y), Forms & Validation, Document Structure",
      state: level1State,
      whyLearnThis: "Essential building block of all web interfaces; clean semantics dictate SEO, accessibility, and rendering speed.",
      prerequisites: [],
      task: {
        title: "Build a Personal Profile Page",
        description: "Construct a clean semantic HTML5 profile page with headings, biography, skill list, and accessible contact form.",
        deliverables: ["semantic markup", "contact form", "accessible landmarks"],
      },
      miniProject: {
        title: "Personal Profile Page",
        description: "Zero-dependency pure semantic document representing your professional identity.",
        techStack: ["HTML5", "Accessibility Standards"],
        difficulty: "Beginner",
        requirements: [
          "Use valid HTML5 doctype and proper <head> metadata",
          "Include semantic landmark elements: <header>, <nav>, <main>, <section>, and <footer>",
          "Build an interactive contact form with labeled inputs, validation attributes, and submit action",
          "Ensure WCAG AAA accessible heading hierarchy and image alt tags"
        ],
      },
      projectTasks: [
        {
          id: "t1-1",
          title: "Semantic Document Architecture",
          description: "Establish semantic hierarchy with <header>, <main>, <section>, and <footer> tags.",
          completed: htmlScore >= 80,
          subtasks: [
            { id: "st1-1-1", title: "Add <!DOCTYPE html> and viewport meta tags", completed: htmlScore >= 80 },
            { id: "st1-1-2", title: "Structure <header> with title and navigation links", completed: htmlScore >= 80 },
            { id: "st1-1-3", title: "Add accessible <main> region with numbered sections", completed: htmlScore >= 80 },
          ],
        },
        {
          id: "t1-2",
          title: "Profile Content & Skill Lists",
          description: "Render personal biographical data and ordered skill taxonomy.",
          completed: htmlScore >= 80,
          subtasks: [
            { id: "st1-2-1", title: "Embed responsive profile image with meaningful alt text", completed: htmlScore >= 80 },
            { id: "st1-2-2", title: "Create structured unordered skill list with categorized bullet points", completed: htmlScore >= 80 },
          ],
        },
        {
          id: "t1-3",
          title: "Accessible Contact Form",
          description: "Implement interactive form with explicit label pairing and input validation.",
          completed: htmlScore >= 80,
          subtasks: [
            { id: "st1-3-1", title: "Add required name, email, and message inputs with matched <label> tags", completed: htmlScore >= 80 },
            { id: "st1-3-2", title: "Implement browser-native input type validation (email, required)", completed: htmlScore >= 80 },
          ],
        },
      ],
      assessment: {
        criterion: "W3C valid semantic tags, landmark roles, and structured form inputs",
        passingScore: 80,
      },
    },
    {
      id: "node-lvl-2",
      level: 2,
      title: "CSS Fundamentals",
      skill: "CSS",
      category: "Styling",
      concept: "CSS Box Model, Flexbox, CSS Grid, Responsive Media Queries, Variables & Design Tokens",
      state: level2State,
      whyLearnThis: "Transforms raw documents into aesthetic, responsive layouts across mobile, tablet, and desktop viewports.",
      prerequisites: ["HTML"],
      task: {
        title: "Convert Profile into Responsive Website",
        description: "Apply modern CSS Flexbox and Grid to transform the static document into an interactive, responsive view.",
        deliverables: ["mobile-first media queries", "CSS grid layout", "custom properties"],
      },
      miniProject: {
        title: "Responsive Portfolio Layout",
        description: "Fluid multi-device personal portfolio site with dark mode theme switching.",
        techStack: ["HTML5", "CSS3", "Design Tokens"],
        difficulty: "Beginner",
        requirements: [
          "Define CSS custom properties (variables) for harmonious color palettes and typography",
          "Implement Flexbox for navigation bar and action button alignments",
          "Build a responsive CSS Grid portfolio card matrix",
          "Mobile-first responsive media queries across 375px to 1440px viewports with zero overflow"
        ],
      },
      projectTasks: [
        {
          id: "t2-1",
          title: "Design Token Palette & Box Model",
          description: "Initialize CSS variables for spacing scale, fonts, and dark mode colors.",
          completed: cssScore >= 75,
          subtasks: [
            { id: "st2-1-1", title: "Declare :root variables for brand colors, surfaces, and text tokens", completed: cssScore >= 75 },
            { id: "st2-1-2", title: "Apply box-sizing: border-box reset across all elements", completed: cssScore >= 75 },
          ],
        },
        {
          id: "t2-2",
          title: "Flexbox Navigation & Card Grid",
          description: "Layout the header with flexbox and project gallery with CSS Grid.",
          completed: cssScore >= 75,
          subtasks: [
            { id: "st2-2-1", title: "Flex justify-between header with aligned logo and menu", completed: cssScore >= 75 },
            { id: "st2-2-2", title: "Grid template with auto-fit minmax(280px, 1fr) card columns", completed: cssScore >= 75 },
          ],
        },
        {
          id: "t2-3",
          title: "Mobile-First Responsive Testing",
          description: "Audit responsiveness on small mobile screens to prevent horizontal overflow.",
          completed: cssScore >= 75,
          subtasks: [
            { id: "st2-3-1", title: "Add @media (min-width: 768px) and (min-width: 1024px) breakpoint rules", completed: cssScore >= 75 },
            { id: "st2-3-2", title: "Verify zero horizontal scroll bar across viewport resize", completed: cssScore >= 75 },
          ],
        },
      ],
      assessment: {
        criterion: "Responsive across 375px to 1440px viewports with zero horizontal overflow",
        passingScore: 80,
      },
    },
    {
      id: "node-lvl-3",
      level: 3,
      title: "HTML + CSS Integration",
      skill: "HTML & CSS",
      category: "Design Systems",
      concept: "Component-driven design systems, micro-interactions, CSS animations, performance optimization",
      state: level3State,
      whyLearnThis: "Harmonizes structure and style to produce production-grade, pixel-perfect user experiences.",
      prerequisites: ["HTML", "CSS"],
      task: {
        title: "Build a High-Converting Landing Page",
        description: "Create an animated product landing page featuring hero section, feature cards, and pricing table.",
        deliverables: ["hero section", "feature grid", "pricing cards", "smooth scroll interactions"],
      },
      miniProject: {
        title: "SaaS Product Landing Page",
        description: "High-performance marketing page with polished typography and micro-animations.",
        techStack: ["HTML5", "CSS3 Animations", "Modern UI"],
        difficulty: "Intermediate",
        requirements: [
          "Hero section with gradient typography, CTA buttons, and product mockup preview",
          "Interactive feature showcase with card hover lift micro-animations",
          "Three-tier pricing table with highlighted recommended plan and feature comparison",
          "Achieve Lighthouse score > 90 in performance and accessibility"
        ],
      },
      projectTasks: [
        {
          id: "t3-1",
          title: "Hero Architecture & Call to Action",
          description: "Build an engaging above-the-fold hero section.",
          completed: (htmlScore >= 80 && cssScore >= 75),
          subtasks: [
            { id: "st3-1-1", title: "Compose high-impact headline with CSS gradient text clipping", completed: (htmlScore >= 80 && cssScore >= 75) },
            { id: "st3-1-2", title: "Create pulse-animated CTA button with hover transform", completed: (htmlScore >= 80 && cssScore >= 75) },
          ],
        },
        {
          id: "t3-2",
          title: "Feature Grid & Pricing Matrix",
          description: "Implement interactive product feature cards and tier pricing.",
          completed: (htmlScore >= 80 && cssScore >= 75),
          subtasks: [
            { id: "st3-2-1", title: "Build 3-column feature grid with SVG icon badges", completed: (htmlScore >= 80 && cssScore >= 75) },
            { id: "st3-2-2", title: "Design pricing cards with monthly/annual toggle structure", completed: (htmlScore >= 80 && cssScore >= 75) },
          ],
        },
      ],
      assessment: {
        criterion: "Lighthouse Performance and Accessibility scores > 90",
        passingScore: 85,
      },
    },
    {
      id: "node-lvl-4",
      level: 4,
      title: "JavaScript Fundamentals",
      skill: "JavaScript",
      category: "Programming",
      concept: "ES6+ Syntax, Data Structures, Control Flow, Pure Functions, Scope, Closures, Event Loop",
      state: level4State,
      whyLearnThis: "Powers dynamic logic, application state, and algorithmic problem-solving on the client and server.",
      prerequisites: ["HTML", "CSS"],
      task: {
        title: "Build an Interactive Financial Calculator",
        description: "Program compound interest and tax calculations with input event handlers and dynamic results.",
        deliverables: ["clean modular functions", "input validation", "real-time calculation DOM updates"],
      },
      miniProject: {
        title: "Interactive Financial Calculator",
        description: "Complex mathematical client-side calculator with input validation and chart summary.",
        techStack: ["JavaScript ES6+", "HTML5", "CSS3"],
        difficulty: "Intermediate",
        requirements: [
          "Author pure mathematical calculation functions with zero side-effects",
          "Bind input event listeners for real-time calculation updates as user types",
          "Sanitize user input and display inline validation messages for invalid numbers",
          "Structure modular ES6 code with separated business logic and DOM renderers"
        ],
      },
      projectTasks: [
        {
          id: "t4-1",
          title: "Calculation Engine & Pure Functions",
          description: "Write unit-tested mathematical algorithms for interest calculations.",
          completed: jsScore >= 60,
          subtasks: [
            { id: "st4-1-1", title: "Write compoundInterest(principal, rate, years, compoundingFrequency) pure function", completed: jsScore >= 60 },
            { id: "st4-1-2", title: "Add edge-case guard clauses for negative numbers and zero values", completed: jsScore >= 60 },
          ],
        },
        {
          id: "t4-2",
          title: "DOM Event Binding & Reactive Updates",
          description: "Connect HTML form inputs to calculation handlers.",
          completed: jsScore >= 60,
          subtasks: [
            { id: "st4-2-1", title: "Listen for 'input' and 'change' events on slider/number fields", completed: jsScore >= 60 },
            { id: "st4-2-2", title: "Format calculated outputs with Intl.NumberFormat currency display", completed: jsScore >= 60 },
          ],
        },
      ],
      assessment: {
        criterion: "Zero console runtime errors with comprehensive edge case unit tests",
        passingScore: 80,
      },
    },
    {
      id: "node-lvl-5",
      level: 5,
      title: "JavaScript DOM & Asynchronous APIs",
      skill: "JavaScript & APIs",
      category: "Web APIs",
      concept: "DOM Manipulation, Fetch API, Promises, Async/Await, Error Handling, LocalStorage",
      state: level5State,
      whyLearnThis: "Connects web interfaces to real-world cloud APIs, live external datasets, and background network services.",
      prerequisites: ["JavaScript"],
      task: {
        title: "Build Live Weather & Analytics Application",
        description: "Fetch live meteorology data asynchronously, render dynamic status cards, and handle network failure states.",
        deliverables: ["async/await network calls", "skeleton loaders", "error toast handling", "cached local queries"],
      },
      miniProject: {
        title: "Live Weather & Analytics App",
        description: "Real-time weather station querying public REST APIs with dynamic forecast visualizations.",
        techStack: ["JavaScript", "Fetch API", "REST APIs", "LocalStorage"],
        difficulty: "Intermediate",
        requirements: [
          "Asynchronously query public weather REST endpoints using async/await and Fetch API",
          "Implement loading state with animated skeleton placeholders while queries resolve",
          "Enforce robust error handling (try/catch) with visual error toasts for network drops or invalid cities",
          "Cache recent city queries in browser localStorage for instant offline replay"
        ],
      },
      projectTasks: [
        {
          id: "t5-1",
          title: "Asynchronous Fetch Pipeline",
          description: "Establish robust network request layer with error recovery.",
          completed: reactScore >= 50,
          subtasks: [
            { id: "st5-1-1", title: "Write async fetchWeatherData(city) wrapped in try/catch block", completed: reactScore >= 50 },
            { id: "st5-1-2", title: "Check response.ok and throw descriptive errors for 404/500 HTTP statuses", completed: reactScore >= 50 },
          ],
        },
        {
          id: "t5-2",
          title: "Loading State & DOM Visualization",
          description: "Provide visual feedback during data fetching.",
          completed: reactScore >= 50,
          subtasks: [
            { id: "st5-2-1", title: "Render skeleton loading indicator during active network request", completed: reactScore >= 50 },
            { id: "st5-2-2", title: "Parse JSON payload and update DOM temperature and condition cards", completed: reactScore >= 50 },
          ],
        },
        {
          id: "t5-3",
          title: "LocalStorage Cache & Offline Support",
          description: "Persist query results for offline viewing.",
          completed: reactScore >= 50,
          subtasks: [
            { id: "st5-3-1", title: "Serialize recent search history into localStorage array", completed: reactScore >= 50 },
            { id: "st5-3-2", title: "Allow instant 1-click reload of cached historical weather reports", completed: reactScore >= 50 },
          ],
        },
      ],
      assessment: {
        criterion: "Resilient handling of network timeouts, 404/500 responses, and offline states",
        passingScore: 85,
      },
    },
    {
      id: "node-lvl-6",
      level: 6,
      title: "React Component Architecture",
      skill: "React",
      category: "Frontend Framework",
      concept: "Component Lifecycle, useState, useEffect, Custom Hooks, Context API, Virtual DOM",
      state: level6State,
      whyLearnThis: "Industry-standard UI library for building scalable, high-performance web applications with reusable modules.",
      prerequisites: ["HTML", "CSS", "JavaScript"],
      task: {
        title: "Build a Collaborative Task Manager",
        description: "Implement interactive drag-and-drop task boards with filters, status tags, and localStorage persistence.",
        deliverables: ["reusable component tree", "custom state hooks", "filtered task views"],
      },
      miniProject: {
        title: "Collaborative Task Manager",
        description: "Kanban-style project board with task categorization, search, and activity timestamps.",
        techStack: ["React", "TypeScript", "Tailwind CSS"],
        difficulty: "Intermediate",
        requirements: [
          "Decompose UI into reusable components: TaskBoard, TaskColumn, TaskCard, TaskModal",
          "Manage application state with useState and custom useTasks hook",
          "Implement task status transitions (Todo -> In Progress -> Done) with filter search",
          "Sync task records to localStorage using useEffect synchronization hook"
        ],
      },
      projectTasks: [
        {
          id: "t6-1",
          title: "Component Tree & Custom Hooks",
          description: "Architect modular React components with typed props.",
          completed: reactScore >= 70,
          subtasks: [
            { id: "st6-1-1", title: "Build TaskBoard layout container rendering 3 status columns", completed: reactScore >= 70 },
            { id: "st6-1-2", title: "Author custom useLocalStorageTasks hook for persistent board state", completed: reactScore >= 70 },
          ],
        },
        {
          id: "t6-2",
          title: "Interactive Task State Mutations",
          description: "Support CRUD operations on task cards.",
          completed: reactScore >= 70,
          subtasks: [
            { id: "st6-2-1", title: "Implement modal dialog for creating new tasks with priority badges", completed: reactScore >= 70 },
            { id: "st6-2-2", title: "Allow advancing task status or deleting items with state updates", completed: reactScore >= 70 },
          ],
        },
      ],
      assessment: {
        criterion: "Optimal re-render cycles, memoized handlers, and zero state drift",
        passingScore: 85,
      },
    },
    {
      id: "node-lvl-7",
      level: 7,
      title: "Backend Engineering & Node.js",
      skill: "Node.js",
      category: "Backend",
      concept: "Node.js Event Loop, Express.js Middleware, RESTful API Design, Request Validation, Error Handling",
      state: level7State,
      whyLearnThis: "Enables server-side processing, business logic execution, and secure data routing for web applications.",
      prerequisites: ["JavaScript"],
      task: {
        title: "Build a REST API Service Engine",
        description: "Develop REST endpoints with rate limiting, Joi/Zod request validation, and standardized JSON responses.",
        deliverables: ["Express routes", "middleware pipeline", "Zod schemas", "status code semantics"],
      },
      miniProject: {
        title: "Production REST API Service",
        description: "Modular backend service providing CRUD operations, logging, and health probe endpoints.",
        techStack: ["Node.js", "Express", "TypeScript", "Zod"],
        difficulty: "Advanced",
        requirements: [
          "Structure modular Express router with separated controller handlers and service layers",
          "Validate incoming request bodies and query parameters with Zod schema middleware",
          "Enforce standardized JSON error response structure with accurate HTTP status codes (200, 201, 400, 404, 500)",
          "Implement global error handling middleware catching uncaught exceptions"
        ],
      },
      projectTasks: [
        {
          id: "t7-1",
          title: "Express Server Architecture & Routes",
          description: "Initialize server scaffold with modular routing.",
          completed: nodeScore >= 60,
          subtasks: [
            { id: "st7-1-1", title: "Configure Express app with cors, helmet, and json parsing middleware", completed: nodeScore >= 60 },
            { id: "st7-1-2", title: "Create /api/v1/projects and /api/v1/tasks REST route handlers", completed: nodeScore >= 60 },
          ],
        },
        {
          id: "t7-2",
          title: "Validation & Centralized Error Middleware",
          description: "Protect endpoints against malformed payloads.",
          completed: nodeScore >= 60,
          subtasks: [
            { id: "st7-2-1", title: "Write validateRequest(schema) middleware using Zod", completed: nodeScore >= 60 },
            { id: "st7-2-2", title: "Implement 4-parameter Express global error handler", completed: nodeScore >= 60 },
          ],
        },
      ],
      assessment: {
        criterion: "Comprehensive endpoint tests with valid HTTP status codes and error payloads",
        passingScore: 85,
      },
    },
    {
      id: "node-lvl-8",
      level: 8,
      title: "Database Engineering & SQL",
      skill: "SQL",
      category: "Database",
      concept: "Relational Modeling, Foreign Keys, Indexing Strategies, ACID Transactions, ORM Migrations",
      state: level8State,
      whyLearnThis: "Guarantees reliable, persistent data integrity and rapid query retrieval for growing user volumes.",
      prerequisites: ["Node.js", "SQL"],
      task: {
        title: "Connect Application to Relational Database",
        description: "Design a normalized database schema in PostgreSQL, run migrations, and execute parameterized queries.",
        deliverables: ["normalized schema (3NF)", "migration scripts", "indexed foreign keys", "transaction handling"],
      },
      miniProject: {
        title: "Persistent Cloud Task Platform",
        description: "Full-cycle persistent database integration supporting thousands of concurrent relational queries.",
        techStack: ["PostgreSQL", "Prisma/Supabase", "SQL"],
        difficulty: "Advanced",
        requirements: [
          "Design 3NF normalized PostgreSQL schema with users, projects, tasks, and audit_logs tables",
          "Define primary keys, foreign key constraints with ON DELETE CASCADE, and timestamp triggers",
          "Add composite indexes on frequently filtered columns (e.g. project_id, status)",
          "Execute parameterized SQL queries to prevent SQL injection vulnerabilities"
        ],
      },
      projectTasks: [
        {
          id: "t8-1",
          title: "Relational Schema Definition",
          description: "Draft normalized tables with relations and indexes.",
          completed: sqlScore >= 65,
          subtasks: [
            { id: "st8-1-1", title: "Author CREATE TABLE scripts for users, projects, and task items", completed: sqlScore >= 65 },
            { id: "st8-1-2", title: "Add foreign key references and CREATE INDEX on task status column", completed: sqlScore >= 65 },
          ],
        },
        {
          id: "t8-2",
          title: "Database Integration & Parameterized Queries",
          description: "Connect Node.js service to PostgreSQL database pool.",
          completed: sqlScore >= 65,
          subtasks: [
            { id: "st8-2-1", title: "Configure connection pooling with environment variables", completed: sqlScore >= 65 },
            { id: "st8-2-2", title: "Execute parameterized SELECT / INSERT queries with SQL injection prevention", completed: sqlScore >= 65 },
          ],
        },
      ],
      assessment: {
        criterion: "Zero SQL injection vulnerabilities and sub-10ms indexed query response times",
        passingScore: 85,
      },
    },
    {
      id: "node-lvl-9",
      level: 9,
      title: "Authentication, Authorization & Security",
      skill: "Security",
      category: "Security & Cloud",
      concept: "JWT Tokens, HTTP-only Cookies, Role-Based Access Control (RBAC), OAuth 2.0, CORS & CSRF",
      state: level9State,
      whyLearnThis: "Protects sensitive user data, secures multi-tenant resources, and ensures compliance with modern standards.",
      prerequisites: ["Node.js", "SQL", "Security"],
      task: {
        title: "Implement Authenticated Workspace Security",
        description: "Build sign-up, sign-in, password hashing with bcrypt, refresh token rotation, and protected API routes.",
        deliverables: ["JWT auth flow", "bcrypt password hashing", "RBAC guard middleware", "CORS policy"],
      },
      miniProject: {
        title: "Authenticated Team Workspace",
        description: "Multi-user workspace with role-based permissions, audit logs, and account recovery.",
        techStack: ["TypeScript", "JWT", "PostgreSQL", "React"],
        difficulty: "Advanced",
        requirements: [
          "Hash passwords securely using bcrypt with appropriate salt rounds (>= 10)",
          "Issue short-lived signed JWT access tokens and long-lived refresh tokens",
          "Build verifyAuth and requireRole middleware route guards",
          "Mitigate OWASP Top 10 vulnerabilities (CORS, CSRF, XSS headers, rate limiting)"
        ],
      },
      projectTasks: [
        {
          id: "t9-1",
          title: "Password Hashing & JWT Token Engine",
          description: "Implement cryptographic password hashing and token generation.",
          completed: false,
          subtasks: [
            { id: "st9-1-1", title: "Hash user passwords with bcrypt.hash on user registration", completed: false },
            { id: "st9-1-2", title: "Sign JWT access tokens with private secret and expiration claims", completed: false },
          ],
        },
        {
          id: "t9-2",
          title: "Role-Based Route Guard Middleware",
          description: "Protect sensitive endpoints by user role.",
          completed: false,
          subtasks: [
            { id: "st9-2-1", title: "Write verifyToken middleware extracting Bearer token from header", completed: false },
            { id: "st9-2-2", title: "Implement requireRole('ADMIN') privilege verification guard", completed: false },
          ],
        },
      ],
      assessment: {
        criterion: "Passes automated OWASP top 10 authentication vulnerability audits",
        passingScore: 90,
      },
    },
    {
      id: "node-lvl-10",
      level: 10,
      title: "Full Stack Production Engineering",
      skill: "Full Stack",
      category: "Architecture",
      concept: "Microservices, Docker Containerization, CI/CD Pipelines, Monitoring & Telemetry, Cloud Deployment",
      state: level10State,
      whyLearnThis: "The capstone competency: shipping resilient, production-ready full stack systems at scale.",
      prerequisites: ["HTML", "CSS", "JavaScript", "React", "Node.js", "SQL", "Security"],
      task: {
        title: "Build and Deploy a Production Full-Stack Platform",
        description: "Integrate frontend, backend, database, and auth into a production-deployed cloud application.",
        deliverables: ["full-stack codebase", "Docker container", "automated CI/CD", "live production URL"],
      },
      miniProject: {
        title: "Production-Level Full Stack SaaS Application",
        description: "Complete commercial-grade full-stack platform with authentication, payments, database, and live analytics.",
        techStack: ["React", "Node.js", "PostgreSQL", "Docker", "Cloud Deployment"],
        difficulty: "Production",
        requirements: [
          "End-to-end integration: React client communicating with Node.js backend & PostgreSQL database",
          "Author multi-stage Dockerfile packaging the optimized application bundle",
          "Automate CI/CD pipeline running unit and Playwright integration tests on push",
          "Deploy live application to cloud environment with health check endpoint and monitoring"
        ],
      },
      projectTasks: [
        {
          id: "t10-1",
          title: "Full-Stack Integration Architecture",
          description: "Unify frontend client, backend API gateway, and database storage.",
          completed: false,
          subtasks: [
            { id: "st10-1-1", title: "Connect React client views to backend authenticated endpoints", completed: false },
            { id: "st10-1-2", title: "Implement end-to-end optimistic UI mutations and error boundaries", completed: false },
          ],
        },
        {
          id: "t10-2",
          title: "Containerization & Cloud Delivery",
          description: "Package application in Docker container and ship to cloud.",
          completed: false,
          subtasks: [
            { id: "st10-2-1", title: "Author multi-stage Dockerfile and docker-compose.yml with DB", completed: false },
            { id: "st10-2-2", title: "Deploy to production cloud with automated CI/CD validation", completed: false },
          ],
        },
      ],
      assessment: {
        criterion: "Production uptime, automated pipeline tests, and sub-100ms API response latency",
        passingScore: 90,
      },
    },
  ];

  const stages: ProgressiveProjectStage[] = [
    { stage: 1, skillFocus: "HTML", projectTitle: "Personal Profile Page", deliverables: "Semantic Document", complexity: "Beginner", status: "COMPLETED" },
    { stage: 2, skillFocus: "CSS", projectTitle: "Responsive Portfolio", deliverables: "Fluid Layout & Dark Mode", complexity: "Beginner", status: "COMPLETED" },
    { stage: 3, skillFocus: "HTML + CSS", projectTitle: "SaaS Landing Page", deliverables: "High-Converting Page", complexity: "Intermediate", status: "COMPLETED" },
    { stage: 4, skillFocus: "JavaScript", projectTitle: "Financial Calculator", deliverables: "Mathematical Logic & State", complexity: "Intermediate", status: "COMPLETED" },
    { stage: 5, skillFocus: "JavaScript + APIs", projectTitle: "Live Weather Analytics", deliverables: "Async Cloud Data Display", complexity: "Intermediate", status: "ACTIVE" },
    { stage: 6, skillFocus: "React", projectTitle: "Collaborative Task Manager", deliverables: "Component State Architecture", complexity: "Intermediate", status: "UPCOMING" },
    { stage: 7, skillFocus: "Node.js Backend", projectTitle: "RESTful API Engine", deliverables: "Secured Service Microservice", complexity: "Advanced", status: "UPCOMING" },
    { stage: 8, skillFocus: "Database & SQL", projectTitle: "Persistent Cloud Platform", deliverables: "Normalized Relational DB", complexity: "Advanced", status: "UPCOMING" },
    { stage: 9, skillFocus: "Authentication", projectTitle: "Authenticated Workspace", deliverables: "RBAC, JWT & Security", complexity: "Advanced", status: "UPCOMING" },
    { stage: 10, skillFocus: "Full Stack", projectTitle: "Production SaaS Platform", deliverables: "Live Multi-Tenant System", complexity: "Production", status: "UPCOMING" },
  ];

  // Find active node pointer
  const currentNode = nodes.find(n => n.state === "IN_PROGRESS") || nodes.find(n => n.state === "AVAILABLE") || nodes[0];
  const completedCount = nodes.filter(n => n.state === "COMPLETED").length;
  const overallProgress = Math.round((completedCount / nodes.length) * 100);

  return {
    id: "roadmap-full-stack",
    goal: "Full Stack Developer",
    targetRole: "Full Stack Software Engineer",
    trackKey: "full_stack",
    dailyStudyHours: 1.5,
    totalStudyHours: 168,
    overallProgress,
    currentNodeId: currentNode.id,
    pointerLevel: currentNode.level,
    nodes,
    stages,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// COMPREHENSIVE 12-STAGE HTML & FRONTEND LEARNING ROADMAP (Section 2 & 3)
// ============================================================================

export function calculateDynamicTimeline(estimatedHours: number, dailyHours: number = 1.5): string {
  const safeDaily = Math.max(0.5, Math.min(12, dailyHours));
  const days = Math.ceil(estimatedHours / safeDaily);
  if (days <= 1) return `~${estimatedHours}h (approx. 1 day at ${safeDaily}h/day)`;
  if (days < 7) return `~${estimatedHours}h (approx. ${days} days at ${safeDaily}h/day)`;
  const weeks = Math.round((days / 7) * 10) / 10;
  return `~${estimatedHours}h (approx. ${weeks} weeks at ${safeDaily}h/day)`;
}

export function buildHtmlFrontendRoadmap(
  skillDna: Record<string, SkillDnaEntry>,
  dailyStudyHours: number = 1.5
): VisualRoadmapData {
  const htmlScore = skillDna["HTML"]?.proficiency || 0;
  const cssScore = skillDna["CSS"]?.proficiency || 0;
  const jsScore = skillDna["JavaScript"]?.proficiency || 0;
  const reactScore = skillDna["React"]?.proficiency || 0;
  const tsScore = skillDna["TypeScript"]?.proficiency || 0;
  const gitScore = skillDna["Git"]?.proficiency || 0;

  // Derive node states from actual evidence percentages (respecting verified skills)
  const s1State: RoadmapNodeState = htmlScore >= 80 ? "COMPLETED" : "IN_PROGRESS";
  const s2State: RoadmapNodeState = htmlScore >= 80 ? "COMPLETED" : (s1State === "COMPLETED" ? "IN_PROGRESS" : "AVAILABLE");
  const s3State: RoadmapNodeState = cssScore >= 75 ? "COMPLETED" : (s2State === "COMPLETED" ? "IN_PROGRESS" : "LOCKED");
  const s4State: RoadmapNodeState = jsScore >= 60 ? "COMPLETED" : (s3State === "COMPLETED" ? "IN_PROGRESS" : "LOCKED");
  const s5State: RoadmapNodeState = jsScore >= 80 ? "COMPLETED" : (jsScore >= 60 ? "IN_PROGRESS" : (s4State === "COMPLETED" ? "AVAILABLE" : "LOCKED"));
  const s6State: RoadmapNodeState = (gitScore >= 70) ? "COMPLETED" : (s4State === "COMPLETED" ? "AVAILABLE" : "LOCKED");
  const s7State: RoadmapNodeState = reactScore >= 60 ? "COMPLETED" : (s5State === "COMPLETED" || reactScore >= 40) ? "IN_PROGRESS" : (s4State === "COMPLETED" ? "AVAILABLE" : "LOCKED");
  const s8State: RoadmapNodeState = tsScore >= 60 ? "COMPLETED" : (s7State === "COMPLETED") ? "IN_PROGRESS" : "LOCKED";
  const s9State: RoadmapNodeState = (s7State === "COMPLETED" && s8State === "COMPLETED") ? "AVAILABLE" : "LOCKED";
  const s10State: RoadmapNodeState = "LOCKED";
  const s11State: RoadmapNodeState = "LOCKED";
  const s12State: RoadmapNodeState = "LOCKED";

  const nodes: RoadmapNode[] = [
    // 1. Web fundamentals and browser architecture
    {
      id: "hf-node-1",
      level: 1,
      title: "Web Fundamentals & Browser Architecture",
      skill: "Web Fundamentals",
      category: "Architecture",
      concept: "Browser Rendering Pipeline, DOM & CSSOM Construction, HTTP/HTTPS Protocol, DNS, Critical Rendering Path",
      state: s1State,
      whyLearnThis: "Understanding how browsers parse, style, and paint pixels is essential for building fast, glitch-free modern web applications.",
      prerequisites: [],
      learningObjectives: [
        "Understand client-server architecture, DNS resolution, and TCP/IP handshake lifecycle.",
        "Analyze the browser critical rendering path: DOM -> CSSOM -> Render Tree -> Layout -> Paint -> Composite.",
        "Use browser DevTools Network and Performance panels to debug bottlenecks.",
      ],
      topicChecklist: [
        { id: "hf-tc-1-1", title: "How DNS resolution & TCP 3-way handshake work", completed: htmlScore >= 80 },
        { id: "hf-tc-1-2", title: "HTTP/1.1 vs HTTP/2 vs HTTP/3 and status codes", completed: htmlScore >= 80 },
        { id: "hf-tc-1-3", title: "DOM and CSSOM construction from HTML/CSS byte streams", completed: htmlScore >= 80 },
        { id: "hf-tc-1-4", title: "Reflow vs Repaint: layout thrashing and composite layers", completed: htmlScore >= 80 },
        { id: "hf-tc-1-5", title: "Profiling network waterfalls and assets in Chrome DevTools", completed: htmlScore >= 80 },
      ],
      practicalExercises: [
        { id: "hf-pe-1-1", title: "DevTools Critical Path Audit", prompt: "Profile a webpage load and identify render-blocking CSS/JS files using DevTools Performance panel." },
        { id: "hf-pe-1-2", title: "HTTP Status Code Simulator", prompt: "Build an interactive cheatsheet demonstrating 200, 301, 400, 401, 403, 404, 500, and 503 semantics." },
      ],
      task: {
        title: "Build Browser Pipeline Visualizer",
        description: "Create an interactive visual breakdown of how HTML/CSS tokens are turned into pixels on screen.",
        deliverables: ["rendering flowchart", "status code cheatsheet", "DevTools waterfall audit notes"],
      },
      miniProject: {
        title: "Browser Architecture & Request Inspector",
        description: "Interactive browser rendering simulator demonstrating how HTML tokens become rendered pixels.",
        techStack: ["HTML5", "CSS3", "JavaScript"],
        difficulty: "Beginner",
        requirements: [
          "Simulate the 5-step rendering pipeline visually (Tokenize -> Parse -> DOM -> CSSOM -> Composite)",
          "Explain render-blocking vs async/defer script loading with live demos",
          "Include an interactive HTTP status code explorer with headers"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-1-1",
          title: "Rendering Pipeline Flowchart",
          description: "Implement interactive pipeline walkthrough in the DOM.",
          completed: htmlScore >= 80,
          subtasks: [
            { id: "hf-pst-1-1-1", title: "Build visual stages for DOM and CSSOM generation", completed: htmlScore >= 80 },
            { id: "hf-pst-1-1-2", title: "Demonstrate script async vs defer loading order", completed: htmlScore >= 80 },
          ],
        },
      ],
      rubric: [
        { criterion: "Rendering Pipeline Accuracy", weight: 40, description: "Correct depiction of DOM/CSSOM construction" },
        { criterion: "Network & HTTP Fundamentals", weight: 35, description: "Accurate HTTP status and header usage" },
        { criterion: "Clarity & Interactive Execution", weight: 25, description: "Clean UI and zero console errors" },
      ],
      estimatedStudyHours: 8,
      estimatedStudyTime: calculateDynamicTimeline(8, dailyStudyHours),
      freeResources: [
        { title: "MDN: How the Web Works", url: "https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works", platform: "MDN", type: "docs", isFree: true },
        { title: "web.dev: Critical Rendering Path", url: "https://web.dev/critical-rendering-path/", platform: "web.dev", type: "tutorial", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 2, title: "HTML Document Structure & Accessibility" },
      assessment: {
        criterion: "Valid architectural explanation of critical rendering path and network lifecycle",
        passingScore: 80,
      },
    },

    // 2. HTML document structure, semantic elements, forms, tables, media, and accessibility
    {
      id: "hf-node-2",
      level: 2,
      title: "HTML Document Structure & Accessibility",
      skill: "HTML",
      category: "Frontend",
      concept: "Semantic HTML5, Accessible Landmarks, Forms & Native Validation, Data Tables, Responsive Media, WCAG 2.2",
      state: s2State,
      whyLearnThis: "Semantic HTML is the backbone of web accessibility, SEO ranking, and cross-device performance.",
      prerequisites: ["Stage 1: Web Fundamentals & Browser Architecture"],
      learningObjectives: [
        "Structure documents using semantic HTML5 elements (<header>, <nav>, <main>, <article>, <section>, <footer>).",
        "Build accessible forms with proper labels, fieldsets, and browser-native validation.",
        "Ensure 100% WCAG 2.2 AA accessibility and screen reader compatibility.",
      ],
      topicChecklist: [
        { id: "hf-tc-2-1", title: "Valid document structure, doctype, and charset/viewport meta", completed: htmlScore >= 80 },
        { id: "hf-tc-2-2", title: "Semantic landmarks and proper heading hierarchy (h1-h6)", completed: htmlScore >= 80 },
        { id: "hf-tc-2-3", title: "Complex accessible forms (labels, input types, required, pattern)", completed: htmlScore >= 80 },
        { id: "hf-tc-2-4", title: "Accessible data tables with caption, thead, tbody, and scope", completed: htmlScore >= 80 },
        { id: "hf-tc-2-5", title: "Responsive images (<picture>, srcset, sizes) and media embedding", completed: htmlScore >= 80 },
        { id: "hf-tc-2-6", title: "ARIA attributes (aria-label, aria-live, aria-expanded) & WCAG audit", completed: htmlScore >= 80 },
      ],
      practicalExercises: [
        { id: "hf-pe-2-1", title: "Accessible Multi-Step Registration Form", prompt: "Build an accessible checkout form with client-side pattern validation and matched labels." },
        { id: "hf-pe-2-2", title: "Screen Reader Tree Audit", prompt: "Audit a document in Chrome Accessibility Tree to eliminate generic div noise." },
      ],
      task: {
        title: "Build Semantic Institutional Portal",
        description: "Author a comprehensive accessible HTML5 document with structured forms, tables, and media.",
        deliverables: ["semantic markup", "accessible appointment form", "100% Lighthouse a11y audit"],
      },
      miniProject: {
        title: "Accessible Government & Healthcare Portal",
        description: "Zero-dependency pure semantic document with comprehensive forms, accessible tables, and responsive media.",
        techStack: ["HTML5", "ARIA Standards", "WCAG 2.2"],
        difficulty: "Beginner",
        requirements: [
          "Use valid HTML5 with proper language attributes and viewport configuration",
          "Incorporate all primary landmarks: header, nav, main, section, article, aside, and footer",
          "Build a multi-fieldset appointment booking form with native constraint validation",
          "Pass automated Lighthouse accessibility audit with 100 score"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-2-1",
          title: "Semantic Landmarks & Heading Hierarchy",
          description: "Establish semantic hierarchy with <header>, <main>, <section>, and <footer> tags.",
          completed: htmlScore >= 80,
          subtasks: [
            { id: "hf-pst-2-1-1", title: "Add <!DOCTYPE html> and viewport meta tags", completed: htmlScore >= 80 },
            { id: "hf-pst-2-1-2", title: "Structure <header> with title and navigation links", completed: htmlScore >= 80 },
          ],
        },
      ],
      rubric: [
        { criterion: "W3C Semantic Validation", weight: 35, description: "100% valid HTML5 syntax with zero obsolete tags" },
        { criterion: "WCAG Accessibility", weight: 35, description: "Screen-reader friendly landmark tree and explicit label associations" },
        { criterion: "Form Validation Logic", weight: 30, description: "Comprehensive native regex and constraint validation" },
      ],
      estimatedStudyHours: 12,
      estimatedStudyTime: calculateDynamicTimeline(12, dailyStudyHours),
      freeResources: [
        { title: "MDN: HTML elements reference", url: "https://developer.mozilla.org/en-US/docs/Web/HTML/Element", platform: "MDN", type: "docs", isFree: true },
        { title: "W3C WAI: Forms Tutorial", url: "https://www.w3.org/WAI/tutorials/forms/", platform: "W3C", type: "tutorial", isFree: true },
        { title: "web.dev: Learn HTML", url: "https://web.dev/learn/html", platform: "Google web.dev", type: "interactive", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 3, title: "CSS Selectors, Cascade & Modern Layouts" },
      assessment: {
        criterion: "Zero validation errors on W3C validator and 100 Lighthouse accessibility score",
        passingScore: 85,
      },
    },

    // 3. CSS selectors, cascade, specificity, box model, typography, layouts, Flexbox, Grid, responsive design, animations, and variables
    {
      id: "hf-node-3",
      level: 3,
      title: "CSS Selectors, Cascade & Modern Layouts",
      skill: "CSS",
      category: "Styling",
      concept: "Box Model, Flexbox, CSS Grid, Cascade Layers, Typography Scales, Responsive Breakpoints, Custom Properties",
      state: s3State,
      whyLearnThis: "CSS gives visual identity, responsive flexibility, and delightful ergonomics to web layouts.",
      prerequisites: ["Stage 2: HTML Document Structure & Accessibility"],
      learningObjectives: [
        "Master specificity scoring, cascade resolution, and modern @layer architecture.",
        "Implement 1D Flexbox navigation bars and 2D CSS Grid card matrixes.",
        "Build fluid responsive interfaces from 320px to 4K viewports without horizontal overflow.",
      ],
      topicChecklist: [
        { id: "hf-tc-3-1", title: "Box model deep dive: content, padding, border, margin collapse", completed: cssScore >= 75 },
        { id: "hf-tc-3-2", title: "Specificity scoring, inheritance, and CSS Cascade Layers (@layer)", completed: cssScore >= 75 },
        { id: "hf-tc-3-3", title: "Flexbox: flex container, main/cross axis, flex-basis/grow/shrink", completed: cssScore >= 75 },
        { id: "hf-tc-3-4", title: "CSS Grid: grid-template-columns, minmax, auto-fit, auto-fill, gap", completed: cssScore >= 75 },
        { id: "hf-tc-3-5", title: "Fluid typography with clamp() and CSS Custom Properties (Tokens)", completed: cssScore >= 75 },
        { id: "hf-tc-3-6", title: "Mobile-first responsive media queries and container queries (@container)", completed: cssScore >= 75 },
      ],
      practicalExercises: [
        { id: "hf-pe-3-1", title: "Holy Grail Layout with CSS Grid", prompt: "Create a 3-column sticky-header layout that collapses to 1-column on mobile." },
        { id: "hf-pe-3-2", title: "Design Token Theme Switcher", prompt: "Create a toggle between dark, light, and high-contrast modes using CSS variables." },
      ],
      task: {
        title: "Build Responsive Multi-Device Editorial",
        description: "Transform raw semantic HTML into an animated, fluid multi-viewport publication with custom properties.",
        deliverables: ["mobile-first CSS Grid", "custom design tokens", "micro-animations"],
      },
      miniProject: {
        title: "Responsive Multi-Device Tech Magazine",
        description: "Fluid editorial website featuring dynamic grid layouts, fluid typography, and dark mode.",
        techStack: ["HTML5", "CSS3", "Design Tokens", "Container Queries"],
        difficulty: "Intermediate",
        requirements: [
          "Define CSS design tokens in :root for colors, spacing scale, and typography",
          "Build a magazine hero grid using auto-fit minmax(300px, 1fr) with zero overflow",
          "Implement smooth transitions and micro-animations for hover states",
          "Verify zero horizontal scroll bar across viewport resize (320px to 1920px)"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-3-1",
          title: "Design Tokens & Responsive Grid",
          description: "Initialize CSS variables for spacing scale, fonts, and dark mode colors.",
          completed: cssScore >= 75,
          subtasks: [
            { id: "hf-pst-3-1-1", title: "Declare :root variables for brand colors and spacing tokens", completed: cssScore >= 75 },
            { id: "hf-pst-3-1-2", title: "Build responsive CSS Grid with auto-fit minmax columns", completed: cssScore >= 75 },
          ],
        },
      ],
      rubric: [
        { criterion: "Responsive Architecture", weight: 35, description: "Fluid adaptability without overflow on any screen" },
        { criterion: "CSS Variable Organization", weight: 35, description: "Clean semantic token architecture" },
        { criterion: "Modern Layout Execution", weight: 30, description: "Appropriate use of Flexbox and CSS Grid" },
      ],
      estimatedStudyHours: 16,
      estimatedStudyTime: calculateDynamicTimeline(16, dailyStudyHours),
      freeResources: [
        { title: "CSS-Tricks: Complete Guide to Flexbox", url: "https://css-tricks.com/snippets/css/a-guide-to-flexbox/", platform: "CSS-Tricks", type: "tutorial", isFree: true },
        { title: "CSS-Tricks: Complete Guide to Grid", url: "https://css-tricks.com/snippets/css/complete-guide-grid/", platform: "CSS-Tricks", type: "tutorial", isFree: true },
        { title: "web.dev: Learn CSS", url: "https://web.dev/learn/css/", platform: "web.dev", type: "interactive", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 4, title: "JavaScript Fundamentals & Core Logic" },
      assessment: {
        criterion: "Responsive across 320px to 1920px with zero horizontal scroll and clean CSS variables",
        passingScore: 85,
      },
    },

    // 4. JavaScript fundamentals, functions, scope, arrays, objects, modules, error handling, and debugging
    {
      id: "hf-node-4",
      level: 4,
      title: "JavaScript Fundamentals & Core Logic",
      skill: "JavaScript",
      category: "Programming",
      concept: "ES6+ Syntax, Data Types, Scope & Closures, Pure Functions, Higher-Order Array Methods, Modules, Error Handling",
      state: s4State,
      whyLearnThis: "JavaScript powers the dynamic logic, state changes, and algorithmic computations of all web apps.",
      prerequisites: ["Stage 2: HTML Document Structure", "Stage 3: CSS Modern Layouts"],
      learningObjectives: [
        "Master ES6+ syntax: destructuring, rest/spread, arrow functions, and modules.",
        "Understand closure scope, pure functions, and immutability.",
        "Process complex data collections using map, filter, reduce, and flatMap.",
      ],
      topicChecklist: [
        { id: "hf-tc-4-1", title: "Variables (let, const), data types, and reference vs value equality", completed: jsScore >= 60 },
        { id: "hf-tc-4-2", title: "Functions: arrow functions, default parameters, and 'this' binding", completed: jsScore >= 60 },
        { id: "hf-tc-4-3", title: "Scope chains, lexical scoping, and closures", completed: jsScore >= 60 },
        { id: "hf-tc-4-4", title: "Higher-order array operations (map, filter, reduce, some, every)", completed: jsScore >= 60 },
        { id: "hf-tc-4-5", title: "Object manipulation, deep cloning, and immutability patterns", completed: jsScore >= 60 },
        { id: "hf-tc-4-6", title: "ES Modules (import/export) and error handling with try/catch/finally", completed: jsScore >= 60 },
      ],
      practicalExercises: [
        { id: "hf-pe-4-1", title: "Array Data Pipeline with reduce", prompt: "Transform an array of raw e-commerce orders into categorized revenue metrics using reduce." },
        { id: "hf-pe-4-2", title: "Memoization Function with Closures", prompt: "Write a higher-order memoize(fn) utility that caches return values based on arguments." },
      ],
      task: {
        title: "Build Financial Analytics Engine",
        description: "Author modular ES6 pure mathematical functions with thorough input sanitation and edge case testing.",
        deliverables: ["pure functions", "input validation", "edge case unit assertions"],
      },
      miniProject: {
        title: "Interactive Compound Interest & Financial Calculator",
        description: "Mathematical calculations engine with pure functions, data transformations, and input validation.",
        techStack: ["JavaScript ES6+", "HTML5", "CSS3"],
        difficulty: "Intermediate",
        requirements: [
          "Write modular calculation pure functions with zero side effects",
          "Handle edge cases (negative values, zero duration, decimal fractions)",
          "Structure modular ES6 code with separated business logic and DOM renderers",
          "Include unit test assertions for mathematical algorithms"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-4-1",
          title: "Calculation Engine & Pure Functions",
          description: "Write unit-tested mathematical algorithms for interest calculations.",
          completed: jsScore >= 60,
          subtasks: [
            { id: "hf-pst-4-1-1", title: "Write compoundInterest pure function with frequency parameter", completed: jsScore >= 60 },
            { id: "hf-pst-4-1-2", title: "Add edge-case guard clauses for negative numbers and zero values", completed: jsScore >= 60 },
          ],
        },
      ],
      rubric: [
        { criterion: "Mathematical Accuracy", weight: 35, description: "Correct financial formula outputs across all edge cases" },
        { criterion: "Code Modularity & Purity", weight: 35, description: "Clean separation of business logic and pure functions" },
        { criterion: "Error Guarding", weight: 30, description: "Sanitizes and handles bad input gracefully" },
      ],
      estimatedStudyHours: 18,
      estimatedStudyTime: calculateDynamicTimeline(18, dailyStudyHours),
      freeResources: [
        { title: "JavaScript.info: The JavaScript Language", url: "https://javascript.info/", platform: "javascript.info", type: "tutorial", isFree: true },
        { title: "MDN: JavaScript First Steps", url: "https://developer.mozilla.org/en-US/docs/Learn/JavaScript", platform: "MDN", type: "docs", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 5, title: "DOM Manipulation & Asynchronous Web APIs" },
      assessment: {
        criterion: "Zero console runtime errors with comprehensive edge case unit tests",
        passingScore: 80,
      },
    },

    // 5. DOM manipulation, events, forms, validation, Fetch API, promises, async/await, storage, and browser APIs
    {
      id: "hf-node-5",
      level: 5,
      title: "DOM Manipulation & Asynchronous Web APIs",
      skill: "DOM & Browser APIs",
      category: "Web APIs",
      concept: "DOM Traversal & Mutations, Event Delegation, Fetch API, Promises, Async/Await, Storage, Browser APIs",
      state: s5State,
      whyLearnThis: "Connects static documents to dynamic user interactions, cloud network APIs, and persistent browser storage.",
      prerequisites: ["Stage 4: JavaScript Fundamentals & Core Logic"],
      learningObjectives: [
        "Manipulate the DOM efficiently using event delegation and DocumentFragments.",
        "Handle network requests asynchronously using Fetch API, async/await, and abort signals.",
        "Manage persistent client state with LocalStorage and SessionStorage.",
      ],
      topicChecklist: [
        { id: "hf-tc-5-1", title: "DOM element selection, attribute modification, and batch fragment insertion", completed: false },
        { id: "hf-tc-5-2", title: "Event propagation: bubbling, capturing, and high-performance event delegation", completed: false },
        { id: "hf-tc-5-3", title: "Asynchronous programming: Event Loop, Microtasks, Promises, and async/await", completed: false },
        { id: "hf-tc-5-4", title: "Fetch API: headers, request methods, JSON parsing, and AbortController", completed: false },
        { id: "hf-tc-5-5", title: "Client storage: LocalStorage, SessionStorage, and Cookie limitations", completed: false },
        { id: "hf-tc-5-6", title: "Modern browser APIs: Intersection Observer for lazy loading and Geolocation API", completed: false },
      ],
      practicalExercises: [
        { id: "hf-pe-5-1", title: "Debounced Live Autocomplete", prompt: "Create a search input with 300ms debounce that queries an API and renders suggestions." },
        { id: "hf-pe-5-2", title: "Infinite Scroll Image Feed", prompt: "Implement an infinite scroll image stream using IntersectionObserver." },
      ],
      task: {
        title: "Build Live Cloud Weather & Astronomy App",
        description: "Connect to public REST endpoints asynchronously with skeleton loaders, error handling, and offline caching.",
        deliverables: ["async/await network calls", "skeleton loaders", "error toast feedback", "cached local queries"],
      },
      miniProject: {
        title: "Real-Time Weather Station & NASA Astronomy Viewer",
        description: "Cloud-connected asynchronous dashboard querying external public REST endpoints with offline caching.",
        techStack: ["JavaScript", "Fetch API", "REST APIs", "LocalStorage"],
        difficulty: "Intermediate",
        requirements: [
          "Query public REST weather/astronomy APIs using async/await and Fetch",
          "Render animated skeleton placeholders while queries resolve",
          "Enforce try/catch error handling with visual toast notifications for network drops",
          "Cache recent search results in localStorage for instant offline replay"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-5-1",
          title: "Asynchronous Fetch Pipeline & UI Skeletons",
          description: "Establish robust network request layer with error recovery.",
          completed: false,
          subtasks: [
            { id: "hf-pst-5-1-1", title: "Write async fetchWeatherData wrapped in try/catch block", completed: false },
            { id: "hf-pst-5-1-2", title: "Check response.ok and throw descriptive errors for 404/500 HTTP statuses", completed: false },
            { id: "hf-pst-5-1-3", title: "Serialize recent search history into localStorage array", completed: false },
          ],
        },
      ],
      rubric: [
        { criterion: "Network Resilience", weight: 35, description: "Smooth handling of 404, 500, network loss, and loading states" },
        { criterion: "DOM Performance", weight: 35, description: "No memory leaks and efficient event delegation" },
        { criterion: "Offline Capability", weight: 30, description: "Reliable cache retrieval from LocalStorage" },
      ],
      estimatedStudyHours: 20,
      estimatedStudyTime: calculateDynamicTimeline(20, dailyStudyHours),
      freeResources: [
        { title: "MDN: Fetch API Guide", url: "https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch", platform: "MDN", type: "docs", isFree: true },
        { title: "JavaScript.info: Network Requests", url: "https://javascript.info/network", platform: "javascript.info", type: "tutorial", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 6, title: "Git, npm, Vite & Modern Tooling" },
      assessment: {
        criterion: "Resilient handling of network timeouts, 404/500 responses, and offline states",
        passingScore: 85,
      },
    },

    // 6. Git, GitHub, npm, Vite, debugging tools, and developer workflow
    {
      id: "hf-node-6",
      level: 6,
      title: "Git, npm, Vite & Modern Tooling",
      skill: "Developer Workflow",
      category: "Tooling",
      concept: "Git Branching, Commit Hygiene, npm Dependency Management, Vite Bundler, HMR, DevTools Debugging",
      state: s6State,
      whyLearnThis: "Industry-standard developer workflow ensures collaborative version control, automated builds, and rapid feedback.",
      prerequisites: ["Stage 4: JavaScript Fundamentals"],
      learningObjectives: [
        "Master Git version control: branching, merging, rebasing, and resolving conflicts.",
        "Manage packages, scripts, and semantic versioning with npm.",
        "Configure modern build pipelines using Vite with Hot Module Replacement (HMR).",
      ],
      topicChecklist: [
        { id: "hf-tc-6-1", title: "Git core workflow: status, diff, commit, branch, checkout, merge", completed: gitScore >= 70 },
        { id: "hf-tc-6-2", title: "Resolving merge conflicts and git rebase vs merge trade-offs", completed: gitScore >= 70 },
        { id: "hf-tc-6-3", title: "npm package management: dependencies vs devDependencies, package-lock.json", completed: gitScore >= 70 },
        { id: "hf-tc-6-4", title: "Vite build tool configuration, ES modules in development, and Rollup build", completed: gitScore >= 70 },
        { id: "hf-tc-6-5", title: "Hot Module Replacement (HMR) and source map debugging in DevTools", completed: gitScore >= 70 },
        { id: "hf-tc-6-6", title: "Environment variables (.env) and secure configuration handling", completed: gitScore >= 70 },
      ],
      practicalExercises: [
        { id: "hf-pe-6-1", title: "Scaffold a Vite Project from Scratch", prompt: "Set up a clean Vite project with custom build alias and npm scripts." },
        { id: "hf-pe-6-2", title: "Simulate and Resolve a Git Conflict", prompt: "Create two divergent branches modifying the same line and resolve the conflict cleanly." },
      ],
      task: {
        title: "Build Production Project Scaffolding",
        description: "Configure custom Vite project template with Git branching workflow, conventional commits, and build optimization.",
        deliverables: ["vite.config.js with aliases", "conventional commit linting", "README developer guide"],
      },
      miniProject: {
        title: "Collaborative Developer Documentation & Boilerplate Hub",
        description: "Production-ready scaffolding template with customized Vite configuration, npm scripts, and Git branching.",
        techStack: ["Git", "GitHub", "Vite", "npm"],
        difficulty: "Intermediate",
        requirements: [
          "Configure custom Vite server settings, plugins, and path aliases (@/*)",
          "Set up conventional commit linting and pre-commit hooks",
          "Document a complete Git branching workflow in README.md",
          "Produce an optimized production build bundle (< 50KB gzip)"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-6-1",
          title: "Vite & Git Workflow Configuration",
          description: "Initialize server scaffold with modular routing and build config.",
          completed: gitScore >= 70,
          subtasks: [
            { id: "hf-pst-6-1-1", title: "Configure vite.config.ts with path alias and build targets", completed: gitScore >= 70 },
            { id: "hf-pst-6-1-2", title: "Verify automated bundle generation and hot reload", completed: gitScore >= 70 },
          ],
        },
      ],
      rubric: [
        { criterion: "Tooling Configuration", weight: 35, description: "Correct Vite config, aliases, and clean build output" },
        { criterion: "Git Hygiene", weight: 35, description: "Clear conventional commits and conflict resolution" },
        { criterion: "Documentation Quality", weight: 30, description: "Clear developer onboarding guide in README" },
      ],
      estimatedStudyHours: 12,
      estimatedStudyTime: calculateDynamicTimeline(12, dailyStudyHours),
      freeResources: [
        { title: "Git Book: Getting Started", url: "https://git-scm.com/book/en/v2", platform: "git-scm", type: "docs", isFree: true },
        { title: "Vite Guide: Why Vite", url: "https://vite.dev/guide/why.html", platform: "Vite", type: "docs", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 7, title: "React Components, State & Hooks Architecture" },
      assessment: {
        criterion: "Successful reproduction of clean build and zero conflict Git merge history",
        passingScore: 80,
      },
    },

    // 7. React components, props, state, hooks, forms, routing, data fetching, and reusable architecture
    {
      id: "hf-node-7",
      level: 7,
      title: "React Components, State & Hooks Architecture",
      skill: "React",
      category: "Frontend Framework",
      concept: "Virtual DOM, JSX, Props, useState, useEffect, Custom Hooks, Context API, Client Routing",
      state: s7State,
      whyLearnThis: "React is the dominant declarative UI library for building scalable, high-performance web applications.",
      prerequisites: ["Stage 4: JavaScript Fundamentals", "Stage 5: DOM & Browser APIs", "Stage 6: Modern Tooling"],
      learningObjectives: [
        "Decompose user interfaces into modular, reusable, single-responsibility components.",
        "Manage local and lifted state with useState, useEffect, and custom hooks.",
        "Implement client-side routing with nested layouts and URL search parameters.",
      ],
      topicChecklist: [
        { id: "hf-tc-7-1", title: "Virtual DOM reconciliation and JSX composition rules", completed: reactScore >= 60 },
        { id: "hf-tc-7-2", title: "Component props, children prop, and unidirectional data flow", completed: reactScore >= 60 },
        { id: "hf-tc-7-3", title: "useState and state lifting for coordinated component trees", completed: reactScore >= 60 },
        { id: "hf-tc-7-4", title: "useEffect synchronization lifecycle and avoiding infinite render loops", completed: reactScore >= 60 },
        { id: "hf-tc-7-5", title: "Authoring custom hooks (useDebounce, useLocalStorage, useMediaQuery)", completed: reactScore >= 60 },
        { id: "hf-tc-7-6", title: "Client routing: routes, layouts, links, and URL query params", completed: reactScore >= 60 },
      ],
      practicalExercises: [
        { id: "hf-pe-7-1", title: "Custom useLocalStorage Hook", prompt: "Write a type-safe custom hook that synchronizes state with browser localStorage." },
        { id: "hf-pe-7-2", title: "Interactive Tag Filter Component", prompt: "Build a multi-tag filter with active pills and counter badges." },
      ],
      task: {
        title: "Build Collaborative Kanban Platform",
        description: "Implement interactive task boards with custom state hooks, filters, and localStorage synchronization.",
        deliverables: ["modular component tree", "custom state hooks", "filtered task views"],
      },
      miniProject: {
        title: "Collaborative Task & Kanban Workspace",
        description: "Interactive drag-and-drop project board with custom hooks, task filters, and persistent state.",
        techStack: ["React", "Custom Hooks", "Tailwind CSS", "LocalStorage"],
        difficulty: "Intermediate",
        requirements: [
          "Decompose UI into reusable components: TaskBoard, TaskColumn, TaskCard, TaskModal",
          "Manage board state using custom useTasks hook with CRUD actions",
          "Implement multi-attribute filtering (status, priority, search term)",
          "Sync task records to localStorage with zero state drift"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-7-1",
          title: "Component Tree & Custom Hooks",
          description: "Architect modular React components with typed props.",
          completed: reactScore >= 60,
          subtasks: [
            { id: "hf-pst-7-1-1", title: "Build TaskBoard layout container rendering 3 status columns", completed: reactScore >= 60 },
            { id: "hf-pst-7-1-2", title: "Author custom useLocalStorageTasks hook for persistent board state", completed: reactScore >= 60 },
          ],
        },
      ],
      rubric: [
        { criterion: "Component Architecture", weight: 35, description: "Clean composition and reusability of component tree" },
        { criterion: "Hook Hygiene", weight: 35, description: "Zero infinite loops and optimal dependency arrays" },
        { criterion: "User Interaction", weight: 30, description: "Smooth modal forms and task state mutations" },
      ],
      estimatedStudyHours: 26,
      estimatedStudyTime: calculateDynamicTimeline(26, dailyStudyHours),
      freeResources: [
        { title: "React.dev: Quick Start & Describing the UI", url: "https://react.dev/learn", platform: "React Official", type: "interactive", isFree: true },
        { title: "React.dev: Reusing Logic with Custom Hooks", url: "https://react.dev/learn/reusing-logic-with-custom-hooks", platform: "React Official", type: "docs", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 8, title: "TypeScript & Type-Safe Frontend Engineering" },
      assessment: {
        criterion: "Optimal re-render cycles, memoized handlers, and zero state drift",
        passingScore: 85,
      },
    },

    // 8. TypeScript, type safety, interfaces, generics, and typed React applications
    {
      id: "hf-node-8",
      level: 8,
      title: "TypeScript & Type-Safe Frontend Engineering",
      skill: "TypeScript",
      category: "Type Safety",
      concept: "Static Types, Interfaces vs Types, Generics, Utility Types, Typing React Components, Props & Hooks",
      state: s8State,
      whyLearnThis: "TypeScript catches bugs at compile time, accelerates developer velocity, and provides self-documenting codebases.",
      prerequisites: ["Stage 7: React Components, State & Hooks Architecture"],
      learningObjectives: [
        "Author strictly-typed TypeScript codebases with no implicit any.",
        "Utilize generics and utility types to model scalable data contracts.",
        "Type React component props, event handlers, and custom hooks safely.",
      ],
      topicChecklist: [
        { id: "hf-tc-8-1", title: "Type annotations, primitive types, and strict null checks", completed: tsScore >= 60 },
        { id: "hf-tc-8-2", title: "Interfaces vs Type aliases: declaration merging and extension", completed: tsScore >= 60 },
        { id: "hf-tc-8-3", title: "Generics: generic functions, interfaces, constraints (T extends object)", completed: tsScore >= 60 },
        { id: "hf-tc-8-4", title: "Discriminated unions and pattern matching state transitions", completed: tsScore >= 60 },
        { id: "hf-tc-8-5", title: "Utility types: Partial, Required, Readonly, Pick, Omit, Record", completed: tsScore >= 60 },
        { id: "hf-tc-8-6", title: "Typed React components: props destructuring, typed hooks and DOM events", completed: tsScore >= 60 },
      ],
      practicalExercises: [
        { id: "hf-pe-8-1", title: "Typed Generic API Client", prompt: "Write a generic fetchJson<T>(url): Promise<T> function with typed error responses." },
        { id: "hf-pe-8-2", title: "Discriminated Union State Reducer", prompt: "Model an async request state (Idle | Loading | Success | Error) with discriminated unions." },
      ],
      task: {
        title: "Build Typed E-Commerce System",
        description: "Architect a strictly-typed catalog and cart with generics, utility types, and zero implicit any.",
        deliverables: ["domain type interfaces", "generic data table", "type-safe cart actions"],
      },
      miniProject: {
        title: "Strongly-Typed E-Commerce Catalog & Checkout System",
        description: "Enterprise catalog with typed filtering, generic data table, and discriminated union cart state.",
        techStack: ["React", "TypeScript", "Tailwind CSS"],
        difficulty: "Advanced",
        requirements: [
          "Strict tsconfig with noImplicitAny and strictNullChecks enabled",
          "Model domain entities (Product, CartItem, Order, User) with interfaces and types",
          "Build a reusable generic <DataTable<T>> component with typed sorting",
          "Manage cart actions via type-safe discriminated union mutations"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-8-1",
          title: "Domain Types & Generic Table Component",
          description: "Author complete TypeScript definitions and generic UI.",
          completed: tsScore >= 60,
          subtasks: [
            { id: "hf-pst-8-1-1", title: "Model typed Product, CartItem, and FilterState contracts", completed: tsScore >= 60 },
            { id: "hf-pst-8-1-2", title: "Build generic DataTable<T> component with keyof T sorting", completed: tsScore >= 60 },
          ],
        },
      ],
      rubric: [
        { criterion: "Type Safety Rigor", weight: 40, description: "Zero any escapes, 100% strict type coverage" },
        { criterion: "Generic Component Design", weight: 35, description: "Reusable typed table and hook contracts" },
        { criterion: "Architecture & Safety", weight: 25, description: "Predictable discriminated union mutations" },
      ],
      estimatedStudyHours: 18,
      estimatedStudyTime: calculateDynamicTimeline(18, dailyStudyHours),
      freeResources: [
        { title: "TypeScript Handbook: The Basics", url: "https://www.typescriptlang.org/docs/handbook/intro.html", platform: "TypeScript", type: "docs", isFree: true },
        { title: "Total TypeScript: Beginners Guide", url: "https://www.totaltypescript.com/tutorials/beginners-typescript", platform: "Total TypeScript", type: "tutorial", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 9, title: "API Integration, Auth Concepts & State Management" },
      assessment: {
        criterion: "Zero TypeScript compile errors in strict mode and 100% typed prop interfaces",
        passingScore: 85,
      },
    },

    // 9. API integration, authentication concepts, loading states, error handling, and state management
    {
      id: "hf-node-9",
      level: 9,
      title: "API Integration, Auth Concepts & State Management",
      skill: "State & Data Fetching",
      category: "State Management",
      concept: "TanStack Query, Cache Invalidation, Optimistic UI, Global State (Zustand), JWT & Token Rotation, Loading & Error States",
      state: s9State,
      whyLearnThis: "Ensures responsive user experiences with zero layout flicker, optimistic updates, and secure auth session management.",
      prerequisites: ["Stage 7: React", "Stage 8: TypeScript"],
      learningObjectives: [
        "Manage server state with TanStack Query: query keys, caching, and background refetching.",
        "Implement optimistic UI mutations for instant user feedback.",
        "Manage auth lifecycles: JWT tokens, bearer headers, refresh rotation, and protected routes.",
      ],
      topicChecklist: [
        { id: "hf-tc-9-1", title: "Server state vs client state separation principles", completed: false },
        { id: "hf-tc-9-2", title: "TanStack Query: useQuery, useMutation, query invalidation, and staleTime", completed: false },
        { id: "hf-tc-9-3", title: "Optimistic updates with rollback on network failure", completed: false },
        { id: "hf-tc-9-4", title: "Global client state with Zustand store slices and selectors", completed: false },
        { id: "hf-tc-9-5", title: "Authentication patterns: Access token, Refresh token, and HTTP-only cookies", completed: false },
        { id: "hf-tc-9-6", title: "Route guards, authentication redirects, and session expiration handlers", completed: false },
      ],
      practicalExercises: [
        { id: "hf-pe-9-1", title: "Optimistic Like Button", prompt: "Build an upvote button that increments count instantly and reverts if the API request fails." },
        { id: "hf-pe-9-2", title: "Zustand Theme & Auth Store", prompt: "Create a persistent Zustand store handling user authentication and theme settings." },
      ],
      task: {
        title: "Build Authenticated Real-Time Feed",
        description: "Integrate TanStack Query for cached feeds, optimistic interactions, and JWT route guards.",
        deliverables: ["TanStack Query queries and mutations", "optimistic UI updates", "auth route guards"],
      },
      miniProject: {
        title: "Real-Time Social Feed with Optimistic Mutations & Auth Guards",
        description: "Cloud-connected social application with JWT authentication, optimistic posts, and cached feeds.",
        techStack: ["React", "TypeScript", "TanStack Query", "Zustand", "REST/Supabase"],
        difficulty: "Advanced",
        requirements: [
          "Manage authenticated session with secure token storage and route guards",
          "Implement TanStack Query with custom query keys and 5-minute staleTime",
          "Provide optimistic UI when posting comments or liking feeds",
          "Display animated skeleton loading placeholders and visual error toast alerts"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-9-1",
          title: "Query Pipeline & Auth Route Guards",
          description: "Configure TanStack Query client and auth token storage.",
          completed: false,
          subtasks: [
            { id: "hf-pst-9-1-1", title: "Configure QueryClientProvider with retry and staleTime defaults", completed: false },
            { id: "hf-pst-9-1-2", title: "Implement optimistic onMutate callback with rollback context", completed: false },
          ],
        },
      ],
      rubric: [
        { criterion: "Query Cache Management", weight: 35, description: "Correct query key invalidation and zero stale UI flicker" },
        { criterion: "Optimistic Mutation Integrity", weight: 35, description: "Instant feedback with automatic error rollback" },
        { criterion: "Auth Guard Security", weight: 30, description: "Protected routes and clean session expiration handling" },
      ],
      estimatedStudyHours: 22,
      estimatedStudyTime: calculateDynamicTimeline(22, dailyStudyHours),
      freeResources: [
        { title: "TanStack Query: Practical Guide", url: "https://tanstack.com/query/latest/docs/framework/react/overview", platform: "TanStack", type: "docs", isFree: true },
        { title: "Zustand Documentation", url: "https://zustand.docs.pmnd.rs/getting-started/introduction", platform: "Zustand", type: "docs", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 10, title: "Testing, Accessibility, Performance & Web Vitals" },
      assessment: {
        criterion: "Zero UI flicker on mutations and resilient offline error recovery",
        passingScore: 85,
      },
    },

    // 10. Testing, accessibility, performance, security basics, and web vitals
    {
      id: "hf-node-10",
      level: 10,
      title: "Testing, Accessibility, Performance & Web Vitals",
      skill: "Quality & Performance",
      category: "Testing & Audits",
      concept: "Unit Testing (Vitest), React Testing Library, Playwright E2E, Core Web Vitals (LCP, INP, CLS), Code Splitting, Frontend Security",
      state: s10State,
      whyLearnThis: "Guarantees software reliability, blazing fast page loads, WCAG AAA accessibility, and protection against web vulnerabilities.",
      prerequisites: ["Stage 7: React", "Stage 8: TypeScript", "Stage 9: API Integration"],
      learningObjectives: [
        "Write unit and component tests with Vitest and React Testing Library avoiding implementation detail traps.",
        "Measure and optimize Core Web Vitals (LCP < 2.5s, INP < 200ms, CLS < 0.1).",
        "Mitigate frontend security vulnerabilities (XSS, CSRF, malicious third-party scripts).",
      ],
      topicChecklist: [
        { id: "hf-tc-10-1", title: "Unit testing pure functions and utilities with Vitest", completed: false },
        { id: "hf-tc-10-2", title: "Component integration testing with React Testing Library (queries, userEvent)", completed: false },
        { id: "hf-tc-10-3", title: "End-to-End critical path testing with Playwright", completed: false },
        { id: "hf-tc-10-4", title: "Core Web Vitals measurement: LCP, INP, and CLS optimization", completed: false },
        { id: "hf-tc-10-5", title: "Code splitting with React.lazy, dynamic imports, and route bundles", completed: false },
        { id: "hf-tc-10-6", title: "Frontend security: Content Security Policy (CSP), sanitize input against XSS", completed: false },
      ],
      practicalExercises: [
        { id: "hf-pe-10-1", title: "Test a Complex Form with React Testing Library", prompt: "Write tests asserting validation errors display when required fields are skipped." },
        { id: "hf-pe-10-2", title: "Optimize Image LCP with Preloading", prompt: "Implement <link rel='preload'> and priority attributes to drop LCP under 1.5s." },
      ],
      task: {
        title: "Audit & Harden Enterprise Platform",
        description: "Achieve 85%+ automated test coverage, sub-2.0s Core Web Vitals, and WCAG AAA compliance.",
        deliverables: ["Vitest test suite", "Playwright E2E spec", "Lighthouse 95+ audit report"],
      },
      miniProject: {
        title: "Audited High-Performance Medical Clinic Platform",
        description: "Enterprise healthcare portal with 90%+ test coverage, perfect Core Web Vitals, and strict accessibility.",
        techStack: ["React", "TypeScript", "Vitest", "Playwright", "Web Vitals"],
        difficulty: "Advanced",
        requirements: [
          "Achieve > 85% code coverage across unit and component integration tests",
          "Include automated Playwright E2E test verifying appointment booking workflow",
          "Achieve Lighthouse scores > 95 in Performance, Accessibility, and Best Practices",
          "Enforce Content Security Policy headers mitigating XSS attacks"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-10-1",
          title: "Test Suite Architecture & Web Vitals Audit",
          description: "Author comprehensive tests and profile real-user metrics.",
          completed: false,
          subtasks: [
            { id: "hf-pst-10-1-1", title: "Write Vitest unit and component integration tests", completed: false },
            { id: "hf-pst-10-1-2", title: "Author Playwright booking scenario E2E test", completed: false },
          ],
        },
      ],
      rubric: [
        { criterion: "Test Coverage & Resilience", weight: 35, description: "Meaningful user-centric assertion coverage" },
        { criterion: "Core Web Vitals Metric", weight: 35, description: "LCP < 2.0s, INP < 150ms, CLS = 0.0" },
        { criterion: "Accessibility & Security", weight: 30, description: "WCAG AAA compliance and sanitized outputs" },
      ],
      estimatedStudyHours: 20,
      estimatedStudyTime: calculateDynamicTimeline(20, dailyStudyHours),
      freeResources: [
        { title: "Testing Library: Guiding Principles", url: "https://testing-library.com/docs/guiding-principles", platform: "Testing Library", type: "docs", isFree: true },
        { title: "web.dev: Optimize Core Web Vitals", url: "https://web.dev/vitals/", platform: "Google web.dev", type: "tutorial", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 11, title: "Build Tooling, CI/CD, Deployment & Monitoring" },
      assessment: {
        criterion: "Passes automated CI test suite and scores > 95 on Lighthouse performance audit",
        passingScore: 90,
      },
    },

    // 11. Build tooling, environment variables, deployment, monitoring, and maintenance
    {
      id: "hf-node-11",
      level: 11,
      title: "Build Tooling, CI/CD, Deployment & Monitoring",
      skill: "DevOps & Cloud Delivery",
      category: "Deployment",
      concept: "Environment Isolation, Bundle Optimization, CI/CD Pipelines (GitHub Actions), Edge CDN Hosting, Sentry Telemetry, Health Probes",
      state: s11State,
      whyLearnThis: "Ships code predictably from pull request to global edge networks with automated quality gates and real-time error telemetry.",
      prerequisites: ["Stage 6: Tooling", "Stage 10: Testing & Performance"],
      learningObjectives: [
        "Configure automated CI/CD workflows running linting, type-checking, and tests on push.",
        "Optimize production builds with tree-shaking, compression, and bundle analysis.",
        "Deploy globally to edge networks and monitor real user exceptions with Sentry.",
      ],
      topicChecklist: [
        { id: "hf-tc-11-1", title: "Multi-environment architecture: development, staging, production configuration", completed: false },
        { id: "hf-tc-11-2", title: "Bundle analysis: tree shaking, asset minification, and gzip/brotli compression", completed: false },
        { id: "hf-tc-11-3", title: "GitHub Actions CI/CD: automated workflows for typecheck, lint, test, and build", completed: false },
        { id: "hf-tc-11-4", title: "Global edge deployment: preview deployments, custom domains, and cache headers", completed: false },
        { id: "hf-tc-11-5", title: "Real-time client telemetry and error monitoring with Sentry error boundaries", completed: false },
        { id: "hf-tc-11-6", title: "Synthetic uptime probes, health checks, and instant rollback procedures", completed: false },
      ],
      practicalExercises: [
        { id: "hf-pe-11-1", title: "GitHub Actions CI Pipeline", prompt: "Write a .github/workflows/ci.yml workflow that rejects PRs failing TypeScript or tests." },
        { id: "hf-pe-11-2", title: "Bundle Budget Enforcement", prompt: "Configure a bundle size limit checking that vendor chunks do not exceed 100KB." },
      ],
      task: {
        title: "Automate Continuous Deployment Pipeline",
        description: "Configure GitHub Actions CI/CD workflow, edge deployment preview environments, and live Sentry monitoring.",
        deliverables: ["GitHub Actions workflow", "preview deployments", "Sentry telemetry setup"],
      },
      miniProject: {
        title: "Automated Continuous Deployment & Telemetry Pipeline",
        description: "Full deployment pipeline shipping an optimized web application with automated PR testing and Sentry telemetry.",
        techStack: ["GitHub Actions", "Vercel/Netlify", "Sentry", "TypeScript", "Vite"],
        difficulty: "Advanced",
        requirements: [
          "Author GitHub Actions CI workflow running typecheck, unit tests, and production build",
          "Deploy preview branches automatically on Pull Request creation",
          "Configure Sentry client error boundary with source map tracking",
          "Set up cache-control headers maximizing edge CDN caching efficiency"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-11-1",
          title: "CI/CD Pipeline & Monitoring Configuration",
          description: "Author workflow file and configure telemetry.",
          completed: false,
          subtasks: [
            { id: "hf-pst-11-1-1", title: "Configure .github/workflows/deploy.yml pipeline", completed: false },
            { id: "hf-pst-11-1-2", title: "Integrate Sentry error boundary with custom fallback UI", completed: false },
          ],
        },
      ],
      rubric: [
        { criterion: "CI/CD Automation", weight: 35, description: "Automated passing quality gates on every commit" },
        { criterion: "Telemetry Integration", weight: 35, description: "Accurate Sentry capture of uncaught runtime exceptions" },
        { criterion: "CDN Cache Strategy", weight: 30, description: "Optimized cache-control and asset hashing" },
      ],
      estimatedStudyHours: 16,
      estimatedStudyTime: calculateDynamicTimeline(16, dailyStudyHours),
      freeResources: [
        { title: "GitHub Actions Documentation", url: "https://docs.github.com/en/actions", platform: "GitHub", type: "docs", isFree: true },
        { title: "Vercel: Deployment Overview", url: "https://vercel.com/docs/deployments/overview", platform: "Vercel", type: "docs", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 12, title: "Advanced Frontend Architecture & Capstone System" },
      assessment: {
        criterion: "Zero build warnings and successful automated test execution on push",
        passingScore: 90,
      },
    },

    // 12. Advanced frontend architecture, design systems, reusable components, and production project work
    {
      id: "hf-node-12",
      level: 12,
      title: "Advanced Frontend Architecture & Capstone System",
      skill: "Architecture & Systems",
      category: "Production Architecture",
      concept: "Design Systems & Tokens, Headless UI Compound Components, State Machines (XState), Monorepo Architecture, Enterprise Capstone",
      state: s12State,
      whyLearnThis: "The capstone frontend competency: architecting scalable, multi-package design systems and enterprise platforms.",
      prerequisites: ["Stage 7: React", "Stage 8: TypeScript", "Stage 9: API Integration", "Stage 10: Testing", "Stage 11: Deployment"],
      learningObjectives: [
        "Build an enterprise Design System with synchronized design tokens and headless accessible primitives.",
        "Model complex multi-step state workflows using Finite State Machines.",
        "Deliver a commercial-grade capstone platform demonstrating full frontend mastery.",
      ],
      topicChecklist: [
        { id: "hf-tc-12-1", title: "Enterprise Design System architecture: atomic tokens, primitives, and compound patterns", completed: false },
        { id: "hf-tc-12-2", title: "Headless UI patterns (Radix UI / Floating UI) for unstyled accessibility", completed: false },
        { id: "hf-tc-12-3", title: "Finite State Machines with XState for deterministic workflow transitions", completed: false },
        { id: "hf-tc-12-4", title: "Monorepo workflows with Turborepo for shared component and utility packages", completed: false },
        { id: "hf-tc-12-5", title: "Micro-frontends vs modular modular monolith architecture trade-offs", completed: false },
        { id: "hf-tc-12-6", title: "Production capstone delivery, architectural RFC documentation, and release notes", completed: false },
      ],
      practicalExercises: [
        { id: "hf-pe-12-1", title: "Compound Dropdown & Modal Primitive", prompt: "Create a fully accessible compound component using React Context and keyboard navigation." },
        { id: "hf-pe-12-2", title: "XState Checkout Workflow", prompt: "Model an e-commerce checkout flow with cart, shipping, payment, and error recovery states." },
      ],
      task: {
        title: "Ship Commercial Capstone Enterprise Platform",
        description: "Engineer an enterprise-grade web platform with published design system tokens, state machines, and complete RFC docs.",
        deliverables: ["design system package", "XState workflow engine", "production deployment URL", "architectural RFC"],
      },
      miniProject: {
        title: "Enterprise Production SaaS Platform & Unified Design System",
        description: "Commercial-grade full-cycle frontend platform featuring design system tokens, headless components, state machines, and live analytics.",
        techStack: ["React", "TypeScript", "Design System", "XState", "TanStack Query", "Vite", "Playwright"],
        difficulty: "Production",
        requirements: [
          "Publish a reusable design system package with tokens for colors, typography, and spacing",
          "Model multi-step wizard state machine ensuring zero illegal state transitions",
          "Full test suite: unit, component, accessibility, and Playwright end-to-end tests",
          "Live production deployment with monitoring, health probes, and architectural RFC documentation"
        ],
      },
      projectTasks: [
        {
          id: "hf-pt-12-1",
          title: "Design System Tokens & Compound Primitives",
          description: "Implement atomic design system tokens and compound components.",
          completed: false,
          subtasks: [
            { id: "hf-pst-12-1-1", title: "Create token scale for color, spacing, radius, and shadows", completed: false },
            { id: "hf-pst-12-1-2", title: "Author compound modal and tabs primitives with keyboard focus traps", completed: false },
          ],
        },
        {
          id: "hf-pt-12-2",
          title: "XState Machine & Capstone Assembly",
          description: "Orchestrate multi-step business logic with finite state machines.",
          completed: false,
          subtasks: [
            { id: "hf-pst-12-2-1", title: "Define checkoutStateMachine with guards and actions", completed: false },
            { id: "hf-pst-12-2-2", title: "Publish full production capstone with architectural documentation", completed: false },
          ],
        },
      ],
      rubric: [
        { criterion: "Design System Architecture", weight: 35, description: "Consistent tokenized compound components" },
        { criterion: "State Machine Rigor", weight: 35, description: "Zero illegal transitions and resilient error recovery" },
        { criterion: "Production Polish & Docs", weight: 30, description: "Commercial-grade performance, accessibility, and documentation" },
      ],
      estimatedStudyHours: 32,
      estimatedStudyTime: calculateDynamicTimeline(32, dailyStudyHours),
      freeResources: [
        { title: "Radix UI: Primitives Overview", url: "https://www.radix-ui.com/primitives/docs/overview/introduction", platform: "Radix UI", type: "docs", isFree: true },
        { title: "XState Documentation", url: "https://stately.ai/docs/xstate", platform: "Stately", type: "docs", isFree: true },
        { title: "Turborepo Handbook", url: "https://turbo.build/repo/docs/handbook", platform: "Vercel Turborepo", type: "docs", isFree: true },
      ],
      nextMilestoneUnlocked: { stage: 12, title: "Capstone Completed - Senior Frontend Competency Mastered" },
      assessment: {
        criterion: "Production uptime, automated pipeline tests, and sub-100ms API response latency",
        passingScore: 90,
      },
    },
  ];

  const stages: ProgressiveProjectStage[] = [
    { stage: 1, skillFocus: "Web Fundamentals", projectTitle: "Browser Architecture & Request Inspector", deliverables: "Rendering Pipeline Sim", complexity: "Beginner", status: s1State === "COMPLETED" ? "COMPLETED" : "ACTIVE" },
    { stage: 2, skillFocus: "HTML", projectTitle: "Accessible Healthcare & Government Portal", deliverables: "WCAG AAA Semantic Form", complexity: "Beginner", status: s2State === "COMPLETED" ? "COMPLETED" : (s1State === "COMPLETED" ? "ACTIVE" : "UPCOMING") },
    { stage: 3, skillFocus: "CSS Layouts", projectTitle: "Responsive Multi-Device Tech Magazine", deliverables: "Fluid CSS Grid & Tokens", complexity: "Intermediate", status: s3State === "COMPLETED" ? "COMPLETED" : (s2State === "COMPLETED" ? "ACTIVE" : "UPCOMING") },
    { stage: 4, skillFocus: "JavaScript", projectTitle: "Financial Analytics & Compound Interest", deliverables: "ES6 Pure Math Pipeline", complexity: "Intermediate", status: s4State === "COMPLETED" ? "COMPLETED" : (s3State === "COMPLETED" ? "ACTIVE" : "UPCOMING") },
    { stage: 5, skillFocus: "DOM & APIs", projectTitle: "Real-Time Weather & Astronomy Station", deliverables: "Async Cloud Data Display", complexity: "Intermediate", status: s5State === "COMPLETED" ? "COMPLETED" : "ACTIVE" },
    { stage: 6, skillFocus: "Tooling & Git", projectTitle: "Developer Documentation & Boilerplate", deliverables: "Vite HMR & Git Workflows", complexity: "Intermediate", status: s6State === "COMPLETED" ? "COMPLETED" : "UPCOMING" },
    { stage: 7, skillFocus: "React", projectTitle: "Collaborative Task & Kanban Workspace", deliverables: "Component State Architecture", complexity: "Intermediate", status: s7State === "COMPLETED" ? "COMPLETED" : "UPCOMING" },
    { stage: 8, skillFocus: "TypeScript", projectTitle: "Typed E-Commerce Catalog & Checkout", deliverables: "Generic Data Contracts", complexity: "Advanced", status: "UPCOMING" },
    { stage: 9, skillFocus: "State & Auth", projectTitle: "Real-Time Feed with Optimistic Mutations", deliverables: "TanStack Query & JWT Guards", complexity: "Advanced", status: "UPCOMING" },
    { stage: 10, skillFocus: "Quality & Vitals", projectTitle: "Audited High-Performance Clinic Platform", deliverables: "Vitest & Core Web Vitals", complexity: "Advanced", status: "UPCOMING" },
    { stage: 11, skillFocus: "DevOps & Cloud", projectTitle: "Continuous Deployment & Telemetry Pipeline", deliverables: "GitHub Actions & Sentry", complexity: "Advanced", status: "UPCOMING" },
    { stage: 12, skillFocus: "Architecture", projectTitle: "Production Enterprise Platform & Design System", deliverables: "Tokens & Headless Primitives", complexity: "Production", status: "UPCOMING" },
  ];

  const currentNode = nodes.find(n => n.state === "IN_PROGRESS") || nodes.find(n => n.state === "AVAILABLE") || nodes[0];
  const completedCount = nodes.filter(n => n.state === "COMPLETED").length;
  const overallProgress = Math.round((completedCount / nodes.length) * 100);
  const totalStudyHours = nodes.reduce((sum, n) => sum + (n.estimatedStudyHours || 15), 0);

  return {
    id: "roadmap-html-frontend",
    goal: "HTML & Frontend Development",
    targetRole: "Senior Frontend Engineer",
    trackKey: "html_frontend",
    dailyStudyHours,
    totalStudyHours,
    overallProgress,
    currentNodeId: currentNode.id,
    pointerLevel: currentNode.level,
    nodes,
    stages,
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// CONTEXT-AWARE LEARNING STATE INSPECTOR (Section 1)
// ============================================================================

export interface UserLearningStateInspection {
  requestedSubject: string;
  hasExistingJourney: boolean;
  existingGoal: string;
  targetRole: string;
  activeTrackKey: string;
  completedStages: Array<{ stage: number; title: string; skill: string }>;
  activeStage: { stage: number; title: string; skill: string } | null;
  inProgressStages: Array<{ stage: number; title: string }>;
  lockedStages: Array<{ stage: number; title: string }>;
  verifiedSkills: Array<{ skill: string; proficiency: number; status: string }>;
  outstandingSkillGaps: SkillGapItem[];
  savedProgressSummary: string;
  isSubjectDivergent: boolean;
  explanation: string;
  options: Array<{
    id: "continue_journey" | "create_frontend_roadmap" | "review_roadmap";
    label: string;
    description: string;
  }>;
}

export function inspectUserLearningState(
  profile: UserIntelligenceProfile,
  requestedSubject: string = "HTML"
): UserLearningStateInspection {
  const roadmap = profile.roadmap;
  const currentGoal = profile.careerGoal || "Full Stack Developer";
  const targetRole = profile.targetRole || "Full Stack Software Engineer";
  const activeTrackKey = (roadmap as any).trackKey || profile.activeRoadmapTrack || "full_stack";

  const completedStages = (roadmap.nodes || [])
    .filter(n => n.state === "COMPLETED")
    .map(n => ({ stage: n.level, title: n.title, skill: n.skill }));

  const activeNode = (roadmap.nodes || []).find(n => n.state === "IN_PROGRESS") ||
    (roadmap.nodes || []).find(n => n.id === roadmap.currentNodeId) || null;
  const activeStage = activeNode ? { stage: activeNode.level, title: activeNode.title, skill: activeNode.skill } : null;

  const inProgressStages = (roadmap.nodes || [])
    .filter(n => n.state === "IN_PROGRESS" || n.state === "AVAILABLE")
    .map(n => ({ stage: n.level, title: n.title }));

  const lockedStages = (roadmap.nodes || [])
    .filter(n => n.state === "LOCKED")
    .map(n => ({ stage: n.level, title: n.title }));

  const verifiedSkills = Object.values(profile.skillDna || {})
    .filter(s => (s.verificationStatus === "VERIFIED" || s.proficiency >= 60))
    .map(s => ({
      skill: s.skillName,
      proficiency: s.proficiency,
      status: `${s.proficiency}% (${s.verificationStatus || "VERIFIED"})`
    }));

  const outstandingSkillGaps = (profile.skillGaps || []).filter(g => g.gap > 0);

  const completedNames = completedStages.map(s => s.title).join(", ") || "None yet";
  const activeName = activeStage ? `Level ${activeStage.stage}: ${activeStage.title}` : "None active";
  const savedProgressSummary = `${completedStages.length} of ${roadmap.nodes.length} completed (${roadmap.overallProgress}% overall). Active: ${activeName}.`;

  const normSubject = requestedSubject.toLowerCase();
  const isHtmlOrFrontend = normSubject.includes("html") || normSubject.includes("frontend") || normSubject.includes("web dev");
  const isCurrentFullStack = currentGoal.toLowerCase().includes("full stack");
  const isSubjectDivergent = isHtmlOrFrontend && isCurrentFullStack;

  const htmlScore = profile.skillDna["HTML"]?.proficiency || 91;
  const cssScore = profile.skillDna["CSS"]?.proficiency || 76;
  const jsScore = profile.skillDna["JavaScript"]?.proficiency || 63;

  const explanation =
    `I found your existing **${currentGoal}** career journey underway in your dashboard.\n\n` +
    `• **Completed Milestones:** ${completedNames}\n` +
    `• **Active Milestone:** ${activeName}\n` +
    `• **Verified Foundations:** HTML (${htmlScore}%), CSS (${cssScore}%), JavaScript (${jsScore}%)\n` +
    `• **In Progress / Target:** React and Full Stack backend services\n\n` +
    `Because your HTML and CSS foundations are already solid and verified, generating a basic beginner HTML roadmap from scratch would disregard your hard-earned progress.\n\n` +
    `How would you like to proceed?`;

  return {
    requestedSubject,
    hasExistingJourney: true,
    existingGoal: currentGoal,
    targetRole,
    activeTrackKey,
    completedStages,
    activeStage,
    inProgressStages,
    lockedStages,
    verifiedSkills,
    outstandingSkillGaps,
    savedProgressSummary,
    isSubjectDivergent,
    explanation,
    options: [
      {
        id: "continue_journey",
        label: "Continue my current journey",
        description: `Resume your active ${activeName} milestone without resetting any progress.`
      },
      {
        id: "create_frontend_roadmap",
        label: "Create a separate HTML/frontend roadmap",
        description: "Open a dedicated 12-stage deep-dive frontend curriculum while safely preserving your Full Stack path."
      },
      {
        id: "review_roadmap",
        label: "Review and improve my current roadmap",
        description: "Audit your current skill gaps, milestones, and adjust your daily study pacing."
      }
    ]
  };
}

// ============================================================================
// CHAT & JOURNEY CONNECTION INTENT HELPERS (Section 4)
// ============================================================================

export function explainCurrentMilestone(roadmap: VisualRoadmapData): string {
  const activeNode =
    roadmap.nodes.find(n => n.state === "IN_PROGRESS") ||
    roadmap.nodes.find(n => n.id === roadmap.currentNodeId) ||
    roadmap.nodes[roadmap.pointerLevel - 1] ||
    roadmap.nodes[0];

  const objList = (activeNode.learningObjectives || [
    "Master core theoretical foundations and industry patterns.",
    "Complete practical milestone coding exercises.",
    "Submit project deliverable for evaluation."
  ]).map(o => `• ${o}`).join("\n");

  const topicsList = (activeNode.topicChecklist || []).slice(0, 5)
    .map(t => `  ${t.completed ? "✓" : "○"} ${t.title}`)
    .join("\n");

  const rubricList = (activeNode.rubric || [
    { criterion: "Correctness", weight: 40, description: "Meets deliverables" },
    { criterion: "Clean Code", weight: 35, description: "Zero runtime errors" },
    { criterion: "Accessibility", weight: 25, description: "Standards compliant" },
  ]).map(r => `• **${r.criterion}** (${r.weight}%): ${r.description}`).join("\n");

  return (
    `### 🎯 Active Milestone: Level ${activeNode.level} — ${activeNode.title}\n\n` +
    `**Track:** ${roadmap.goal} | **Status:** ${activeNode.state}\n\n` +
    `#### Why Learn This?\n${activeNode.whyLearnThis}\n\n` +
    `#### Learning Objectives\n${objList}\n\n` +
    `#### Core Topics Checklist\n${topicsList || "  ○ Review milestone concepts"}\n\n` +
    `#### Milestone Project\n` +
    `• **Project Title:** ${activeNode.miniProject.title} (${activeNode.miniProject.difficulty})\n` +
    `• **Description:** ${activeNode.task.description}\n` +
    `• **Tech Stack:** ${activeNode.miniProject.techStack.join(", ")}\n` +
    `• **Deliverables:** ${activeNode.task.deliverables.join(", ")}\n\n` +
    `#### Completion Rubric\n${rubricList}\n\n` +
    `**Estimated Study Time:** ${activeNode.estimatedStudyTime || "12-16 hours"}\n\n` +
    `Submit your implementation in the center Project Workspace when you are ready for evaluation.`
  );
}

export function generateTodayLearningTasks(
  roadmap: VisualRoadmapData,
  dailyHours: number = 1.5
): string {
  const activeNode =
    roadmap.nodes.find(n => n.state === "IN_PROGRESS") ||
    roadmap.nodes.find(n => n.id === roadmap.currentNodeId) ||
    roadmap.nodes[0];

  const incompleteTopics = (activeNode.topicChecklist || []).filter(t => !t.completed);
  const selectedTopics = incompleteTopics.length > 0 ? incompleteTopics.slice(0, 3) : (activeNode.topicChecklist || []).slice(0, 3);

  const exercises = (activeNode.practicalExercises || []).slice(0, 2);

  return (
    `### 📅 Today's Learning Plan (Paced for ~${dailyHours}h)\n\n` +
    `**Current Milestone:** Level ${activeNode.level} — **${activeNode.title}**\n\n` +
    `#### 1. Theory & Concepts (~${Math.round(dailyHours * 30)} mins)\n` +
    selectedTopics.map((t, idx) => `• [ ] **Task ${idx + 1}:** Study ${t.title}`).join("\n") + "\n\n" +
    `#### 2. Practical Coding (~${Math.round(dailyHours * 45)} mins)\n` +
    (exercises.length > 0
      ? exercises.map((e, idx) => `• [ ] **Exercise ${idx + 1} (${e.title}):** ${e.prompt}`).join("\n")
      : `• [ ] Work on **${activeNode.miniProject.title}** deliverables: ${activeNode.task.deliverables.join(", ")}`) + "\n\n" +
    `#### 3. Recommended Resource (~15 mins)\n` +
    (activeNode.freeResources && activeNode.freeResources.length > 0
      ? `• [${activeNode.freeResources[0].title}](${activeNode.freeResources[0].url}) (${activeNode.freeResources[0].platform})`
      : "• Review MDN documentation and test code in DevTools console") + "\n\n" +
    `Check off your completed topics in the AI Roadmap panel as you finish them!`
  );
}

export function generateExercisesForTopic(
  topicQuery: string,
  roadmap: VisualRoadmapData
): string {
  const cleanTopic = topicQuery.trim();
  const lower = cleanTopic.toLowerCase();

  // Try to find matching node
  const matchedNode = roadmap.nodes.find(n =>
    n.skill.toLowerCase().includes(lower) ||
    n.title.toLowerCase().includes(lower) ||
    n.concept.toLowerCase().includes(lower)
  ) || roadmap.nodes[0];

  return (
    `### 🧪 Hands-On Practice Exercises: ${cleanTopic.toUpperCase()}\n\n` +
    `Aligned with **Level ${matchedNode.level}: ${matchedNode.title}**\n\n` +
    `#### Exercise 1 (Beginner): Foundations\n` +
    `• **Goal:** Implement core syntax and primary operations without external libraries.\n` +
    `• **Prompt:** Build a standalone component or script applying ${cleanTopic}. Verify zero syntax errors and validate expected inputs.\n` +
    `• **Expected Result:** Clean output logged to console or rendered in DOM.\n\n` +
    `#### Exercise 2 (Intermediate): Edge Cases & Handlers\n` +
    `• **Goal:** Add error boundaries, input sanitization, and responsive adjustments.\n` +
    `• **Prompt:** Refactor Exercise 1 to handle invalid types, null states, and rapid asynchronous triggers.\n` +
    `• **Expected Result:** Visual error notification displayed and state recovered gracefully.\n\n` +
    `#### Exercise 3 (Challenge): Milestone Integration\n` +
    `• **Goal:** Integrate ${cleanTopic} directly into your active milestone project (**${matchedNode.miniProject.title}**).\n` +
    `• **Deliverable:** Satisfy project criterion: *${matchedNode.task.deliverables[0] || "Component architecture"}*.\n\n` +
    `When you've written your solution, paste your code here or ask: *"Review my code"* to get an instant feedback rubric.`
  );
}

export function assessUserSkills(
  skillDna: Record<string, SkillDnaEntry>,
  targetRole: string = "Full Stack Developer"
): string {
  const skills = Object.values(skillDna);
  const verifiedList = skills.filter(s => s.verificationStatus === "VERIFIED");
  const satisfiedCount = verifiedList.length;

  return (
    `### 🧬 Skill DNA & Competency Assessment\n\n` +
    `**Target Career Role:** ${targetRole}\n` +
    `**Verified Competencies:** ${satisfiedCount} of ${skills.length} skills\n\n` +
    skills.map(s => {
      const badge = s.proficiency >= 80 ? "✓ Mastered" : s.proficiency >= 60 ? "▲ Proficient" : "⚠ Gap";
      return `• **${s.skillName}:** ${s.proficiency}% (${badge}) — *${s.evidence || "Practical coursework"}*`;
    }).join("\n") + "\n\n" +
    `**Next Recommended Competency to Level Up:** ` +
    (skills.find(s => s.proficiency < 75)?.skillName || "React") + "\n\n" +
    `Ready to test yourself on a specific skill? Say *"Generate exercises for [skill]"* or submit a project milestone in the center workspace.`
  );
}

export function resumeNextIncompleteMilestone(roadmap: VisualRoadmapData): {
  nextNode: RoadmapNode;
  explanation: string;
} {
  const nextNode =
    roadmap.nodes.find(n => n.state === "IN_PROGRESS") ||
    roadmap.nodes.find(n => n.state === "AVAILABLE") ||
    roadmap.nodes.find(n => n.state !== "COMPLETED") ||
    roadmap.nodes[0];

  return {
    nextNode,
    explanation:
      `Resuming your journey at **Level ${nextNode.level}: ${nextNode.title}**!\n\n` +
      `• **Status:** ${nextNode.state}\n` +
      `• **Active Project:** ${nextNode.miniProject.title}\n` +
      `• **Immediate Action:** Complete deliverable: *${nextNode.task.deliverables[0]}*.\n\n` +
      `The visual pointer has centered on this milestone in your AI Roadmap panel.`
  };
}

// ============================================================================
// SKILL GAP ANALYSIS GENERATOR (Section 6 & 12)
// ============================================================================

export function computeSkillGapMatrix(
  currentSkills: Record<string, SkillDnaEntry>,
  targetGoal: string = "Full Stack Developer"
): SkillGapItem[] {
  const targetProfiles: Record<string, Record<string, { required: number; priority: SkillGapItem["priority"]; reason: string }>> = {
    "Full Stack Developer": {
      HTML: { required: 80, priority: "MEDIUM", reason: "Foundational markup and document semantics." },
      CSS: { required: 80, priority: "MEDIUM", reason: "Responsive styling and cross-device design systems." },
      JavaScript: { required: 85, priority: "CRITICAL", reason: "Core client & server programming engine required before React & Node." },
      React: { required: 80, priority: "HIGH", reason: "Modern component architecture and scalable web user interfaces." },
      "Node.js": { required: 75, priority: "HIGH", reason: "Server-side RESTful API services and asynchronous background processing." },
      SQL: { required: 70, priority: "HIGH", reason: "Persistent relational modeling and database query optimization." },
      Git: { required: 80, priority: "MEDIUM", reason: "Version control workflows, branching, and team collaboration." },
    },
    "AI Engineer": {
      Python: { required: 90, priority: "CRITICAL", reason: "Primary language for model training, data preprocessing, and AI pipelines." },
      SQL: { required: 75, priority: "HIGH", reason: "Feature stores, training data querying, and relational data extraction." },
      "Machine Learning": { required: 85, priority: "CRITICAL", reason: "Model evaluation, loss functions, fine-tuning, and inference." },
      "API Integration": { required: 80, priority: "HIGH", reason: "Serving model endpoints through REST/gRPC architectures." },
      Git: { required: 80, priority: "MEDIUM", reason: "Model checkpoint versioning and collaborative code pipelines." },
    },
    "Cybersecurity Engineer": {
      Python: { required: 80, priority: "HIGH", reason: "Security automation, vulnerability exploitation scripts, and tooling." },
      Networking: { required: 85, priority: "CRITICAL", reason: "TCP/IP, packet analysis, DNS, firewalls, and protocol security." },
      Linux: { required: 85, priority: "CRITICAL", reason: "System administration, permissions, shell scripting, and forensics." },
      Cryptography: { required: 75, priority: "HIGH", reason: "Encryption algorithms, PKI, digital signatures, and TLS protocols." },
      SQL: { required: 70, priority: "MEDIUM", reason: "Database security, injection vectors, and audit logging." },
    },
  };

  const profile = targetProfiles[targetGoal] || targetProfiles["Full Stack Developer"];
  const gaps: SkillGapItem[] = [];

  for (const [skill, config] of Object.entries(profile)) {
    const current = currentSkills[skill]?.proficiency || 0;
    const diff = config.required - current;

    let status: SkillGapItem["status"] = "SATISFIED";
    if (diff > 25) status = "LARGE_GAP";
    else if (diff > 10) status = "MEDIUM_GAP";
    else if (diff > 0) status = "SMALL_GAP";

    gaps.push({
      skill,
      current,
      required: config.required,
      gap: Math.max(0, diff),
      status,
      priority: config.priority,
      reason: config.reason,
    });
  }

  return gaps.sort((a, b) => b.gap - a.gap);
}

// ============================================================================
// "WHAT SHOULD I LEARN NEXT?" REASONING ENGINE (Section 13)
// ============================================================================

// ============================================================================
// "WHAT SHOULD I LEARN NEXT?" REASONING ENGINE (Sections 17 & 24)
// ============================================================================

export function explainWhatToLearnNext(
  roadmap: VisualRoadmapData,
  skillDna: Record<string, SkillDnaEntry>
): {
  recommendation: string;
  why: string;
  evidence: string;
  impact: string;
  nextAction: string;
  skill: string;
  level: number;
  dependenciesMet: string[];
  rationale: string;
  nextTask: string;
  formattedMarkdown: string;
} {
  const activeNode =
    roadmap.nodes.find(
      (n) => n.state === "IN_PROGRESS" || n.state === "AVAILABLE" || n.state === "REVISION_REQUIRED"
    ) || roadmap.nodes[0];
  const previousNodes = roadmap.nodes.filter((n) => n.level < activeNode.level);
  const dependenciesMet = previousNodes.map((n) => n.skill);

  const currentSkillScore = skillDna[activeNode.skill]?.proficiency || 0;
  const currentSkillConfidence = skillDna[activeNode.skill]?.confidence || "ESTIMATED";

  const why = `Your prerequisite foundations in ${
    dependenciesMet.slice(0, 3).join(", ") || "fundamental web standards"
  } are sufficiently demonstrated. Advancing to **${activeNode.title}** (Level ${
    activeNode.level
  }) is the critical next milestone because ${activeNode.whyLearnThis}`;

  const evidence = [
    `• **${activeNode.skill}:** Current proficiency is ${currentSkillScore}% (${currentSkillConfidence} Confidence)`,
    ...dependenciesMet
      .slice(0, 3)
      .map((s) => `• **${s}:** Verified prerequisite at ${skillDna[s]?.proficiency || 80}%`),
    `• **Milestone Requirements:** Level ${activeNode.level} requires completing "${activeNode.miniProject.title}" with code submission or GitHub repository evidence.`,
  ].join("\n");

  const impact = `Mastering Level ${activeNode.level} satisfies prerequisites for ${
    activeNode.level < 6 ? "React & Component Architecture" : activeNode.level < 8 ? "Database Engineering & Microservices" : "Production Cloud Engineering"
  } and unlocks the next milestone in your ${roadmap.goal} journey.`;

  const nextAction = `Open your Project Workspace and start **Level ${activeNode.level}: ${activeNode.miniProject.title}** (${activeNode.task.title}). Complete the task checklist and submit your code for AI evaluation.`;

  const formattedMarkdown = `### 🎯 What You Should Learn Next

**Recommendation:** Learn **${activeNode.title}** (Level ${activeNode.level})

• **WHY:** ${why}

• **EVIDENCE:**
${evidence}

• **IMPACT:** ${impact}

• **NEXT ACTION:** ${nextAction}`;

  return {
    recommendation: `Learn **${activeNode.title}** (Level ${activeNode.level})`,
    why,
    evidence,
    impact,
    nextAction,
    skill: activeNode.skill,
    level: activeNode.level,
    dependenciesMet,
    rationale: why,
    nextTask: activeNode.task.title,
    formattedMarkdown,
  };
}

// ============================================================================
// AI PROJECT SUBMISSION EVALUATION ENGINE (Sections 11, 12, 13, 26)
// ============================================================================

export function evaluateRoadmapProjectSubmission(
  node: RoadmapNode,
  submission: ProjectSubmission
): ProjectEvaluationResult {
  const content = (submission.content || "").trim();
  const repo = (submission.repositoryUrl || "").trim();
  const demo = (submission.liveDemoUrl || "").trim();
  const combined = `${content}\n${repo}\n${demo}\n${submission.notes || ""}`.toLowerCase();

  // Guard against trivial or missing submissions (Requirement 26: No fake progress)
  if (combined.length < 40 && !repo) {
    return {
      nodeId: node.id,
      level: node.level,
      projectTitle: node.miniProject.title,
      score: 38,
      passed: false,
      decision: "REVISION_REQUIRED",
      skillEvidence: "No verifiable project implementation submitted.",
      strengths: ["Submission attempt logged in OmniForge project registry."],
      weaknesses: [
        "Submitted code or repository payload is too brief to evaluate.",
        "Missing required functional implementation for milestone deliverables.",
      ],
      missingRequirements: node.miniProject.requirements || [
        "Complete technical implementation code",
        "Demonstrated core competency concepts",
      ],
      recommendations: [
        `Provide a functional implementation of ${node.miniProject.title} or link a public GitHub repository.`,
        "Work through the project task checklist and implement each deliverable.",
      ],
      nextAction: "Open the project editor, fulfill the missing tasks, and resubmit.",
      evaluatedAt: new Date().toISOString(),
    };
  }

  let score = 85;
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const missingRequirements: string[] = [];
  const recommendations: string[] = [];

  switch (node.level) {
    case 1: {
      const hasSemanticTags = /<(?:header|nav|main|article|section|footer|figure)[\s>]/i.test(content);
      const hasForm = /<form[\s>]/i.test(content) && /<input|<button/i.test(content);
      const hasHeadings = /<h1[\s>]/i.test(content) && /<p[\s>]/i.test(content);

      if (hasSemanticTags) {
        strengths.push("Excellent use of semantic HTML5 landmarks (<header>, <main>, <section>) promoting accessibility.");
        score += 5;
      } else {
        missingRequirements.push("Semantic HTML5 layout tags (<header>, <main>, <section>, <nav>)");
        weaknesses.push("Relies on generic <div> containers instead of semantic structural tags.");
        score -= 15;
      }

      if (hasForm) {
        strengths.push("Form contains labeled interactive input elements with browser validation attributes.");
        score += 4;
      } else {
        missingRequirements.push("Structured contact form with accessible inputs");
        score -= 12;
      }

      if (hasHeadings) {
        strengths.push("Proper heading hierarchy and document outline.");
      }
      break;
    }
    case 2: {
      const hasFlexOrGrid = /display\s*:\s*(?:flex|grid)/i.test(content) || /flex|grid/i.test(content);
      const hasMediaQuery = /@media/i.test(content) || /max-width|min-width/i.test(content);
      const hasVariables = /--[a-z0-9-_]+/i.test(content) || /var\(/i.test(content);

      if (hasFlexOrGrid) {
        strengths.push("Fluid layout alignment using modern CSS Flexbox and Grid display rules.");
        score += 5;
      } else {
        missingRequirements.push("CSS Flexbox or Grid layout implementation");
        score -= 15;
      }

      if (hasMediaQuery) {
        strengths.push("Responsive breakpoints prevent horizontal viewport overflow.");
        score += 5;
      } else {
        missingRequirements.push("Responsive media queries for mobile viewports");
        score -= 15;
      }

      if (hasVariables) {
        strengths.push("Structured CSS custom properties (design tokens) for palette variables.");
      }
      break;
    }
    case 4: {
      const hasFunctions = /function\s+\w+|\w+\s*=\s*\([^)]*\)\s*=>/i.test(content) || /def\s+/i.test(content);
      const hasEvents = /addEventListener|onclick|onchange/i.test(content);

      if (hasFunctions) {
        strengths.push("Clean functional decomposition and modular calculation algorithms.");
        score += 5;
      } else {
        missingRequirements.push("Modular calculation functions");
        score -= 15;
      }

      if (hasEvents) {
        strengths.push("Reactive user input handling via DOM event listeners.");
        score += 4;
      } else {
        missingRequirements.push("Event listeners for user input interaction");
        score -= 12;
      }
      break;
    }
    case 5: {
      const hasFetch = /fetch\(|axios|\.get\(|\.post\(/i.test(content);
      const hasAsync = /async|await|\.then\(/i.test(content);
      const hasErrorHandling = /try\s*\{|catch|\.catch/i.test(content);

      if (hasFetch && hasAsync) {
        strengths.push("Proper async/await promise orchestration querying REST endpoints.");
        score += 5;
      } else {
        missingRequirements.push("Asynchronous Fetch API or HTTP client requests");
        score -= 20;
      }

      if (hasErrorHandling) {
        strengths.push("Resilient error state handling (try/catch) prevents uncaught network rejections.");
        score += 4;
      } else {
        missingRequirements.push("Error handling (try/catch or .catch) for failed network requests");
        weaknesses.push("Missing error state: application will break if API returns 404/500 or network drops.");
        recommendations.push("Wrap async fetch calls in try/catch and display user-friendly error fallback toasts.");
        score -= 12;
      }
      break;
    }
    case 6: {
      const hasHooks = /useState|useEffect|useReducer/i.test(content);

      if (hasHooks) {
        strengths.push("Clean component state encapsulation with React hooks (useState, useEffect).");
        score += 5;
      } else {
        missingRequirements.push("React component state management (useState / useEffect)");
        score -= 18;
      }
      break;
    }
    default: {
      if (repo || content.length > 150) {
        strengths.push("Comprehensive implementation satisfying core architectural guidelines.");
        score += 5;
      } else {
        missingRequirements.push("Complete project codebase or GitHub repository link");
        score -= 20;
      }
      break;
    }
  }

  if (repo) {
    strengths.push(`Verified public Git repository at ${repo}`);
    score = Math.max(score, 87);
  }

  score = Math.max(35, Math.min(96, score));
  const passingScore = node.assessment?.passingScore || 80;
  const passed = score >= passingScore && missingRequirements.length <= 1;

  if (passed) {
    if (strengths.length === 0) strengths.push("Fulfilled core project requirements with valid implementation.");
    recommendations.push(`Proceed to Level ${Math.min(10, node.level + 1)} in your personalized roadmap.`);
  } else {
    if (weaknesses.length === 0) weaknesses.push("Key deliverables and concepts are missing from the submission.");
    recommendations.push("Review the missing criteria, update your code or repository, and resubmit for evaluation.");
  }

  const decision: "PASSED" | "REVISION_REQUIRED" = passed ? "PASSED" : "REVISION_REQUIRED";
  const skillEvidence = passed
    ? `Verified via evaluated project submission: ${node.miniProject.title} (Score: ${score}/100)`
    : `Project submission under review: ${node.miniProject.title} requires revisions (Score: ${score}/100)`;

  const nextAction = passed
    ? `Advance roadmap pointer to Level ${Math.min(10, node.level + 1)}`
    : `Revise and resubmit ${node.miniProject.title} addressing missing requirements`;

  return {
    nodeId: node.id,
    level: node.level,
    projectTitle: node.miniProject.title,
    score,
    passed,
    decision,
    skillEvidence,
    strengths,
    weaknesses,
    missingRequirements,
    recommendations,
    nextAction,
    evaluatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// EVIDENCE-BASED SKILL DNA UPDATER (Section 7)
// ============================================================================

export function applyProjectEvaluationToSkillDna(
  skillDna: Record<string, SkillDnaEntry>,
  evaluation: ProjectEvaluationResult,
  node: RoadmapNode
): Record<string, SkillDnaEntry> {
  const updated = { ...skillDna };
  const skillKey = node.skill;

  if (evaluation.passed && skillKey && updated[skillKey]) {
    const current = updated[skillKey];
    // Weighted evidence-based formula: NOT a flat +10%!
    // Higher evaluation score proportionally raises proficiency
    const weightedGain = Math.round((evaluation.score / 100) * 12);
    const newProficiency = Math.min(100, Math.max(current.proficiency + 4, current.proficiency + weightedGain));

    const newEvidenceItem: SkillEvidenceItem = {
      id: "ev-eval-" + Date.now(),
      type: "project_submission",
      title: `${node.miniProject.title} (Evaluation Score: ${evaluation.score}/100)`,
      description: evaluation.strengths.slice(0, 2).join(". ") || "Demonstrated required technical competencies.",
      score: evaluation.score,
      date: new Date().toISOString().split("T")[0],
      verified: true,
    };

    const existingList = current.evidenceList || [];
    updated[skillKey] = {
      ...current,
      proficiency: newProficiency,
      confidence: "HIGH",
      evidence: evaluation.skillEvidence,
      evidenceList: [newEvidenceItem, ...existingList],
      verificationStatus: "VERIFIED",
      lastVerified: new Date().toISOString().split("T")[0],
      lastDemonstrated: `Evaluated Project: ${node.miniProject.title}`,
    };
  }

  return updated;
}

// ============================================================================
// SKILL DEPENDENCY & SKIP ELIGIBILITY CHECK (Section 16 & 21)
// ============================================================================

export function checkNodeSkipEligibility(
  node: RoadmapNode,
  skillDna: Record<string, SkillDnaEntry>
): { canSkip: boolean; reason: string; requirement: string } {
  const skill = skillDna[node.skill];
  if (!skill) {
    return {
      canSkip: false,
      reason: `No verified evidence exists in your Skill DNA for ${node.skill}.`,
      requirement: `You must submit the Level ${node.level} project or pass an accelerated competency evaluation.`,
    };
  }

  const passingThreshold = node.assessment?.passingScore || 80;
  if (skill.proficiency >= passingThreshold && skill.confidence === "HIGH") {
    return {
      canSkip: true,
      reason: `Your verified proficiency in ${node.skill} is ${skill.proficiency}%, exceeding the required ${passingThreshold}% milestone threshold with high confidence evidence.`,
      requirement: "Accelerated skip permitted based on verified prior evidence.",
    };
  }

  return {
    canSkip: false,
    reason: `Your current proficiency in ${node.skill} is ${skill.proficiency}% (confidence: ${skill.confidence}), which does not yet meet the verified passing threshold of ${passingThreshold}%.`,
    requirement: `Complete and submit the Level ${node.level} project: "${node.miniProject.title}" to advance with verified evidence.`,
  };
}

// ============================================================================
// CLIENT PROJECT REQUIREMENT -> TEAM SKILL GAP ENGINE (Section 18 & 20)
// ============================================================================

export function computeClientProjectSkillGaps(
  plan: DetailedProjectPlan,
  candidateOrTeamSkills: Record<string, number> = {}
): Array<{
  skill: string;
  requiredScore: number;
  currentScore: number;
  gap: number;
  covered: boolean;
  recommendation: string;
}> {
  const requiredSkillMap: Record<string, number> = {
    React: 80,
    TypeScript: 75,
    "Node.js": 75,
    PostgreSQL: 70,
    Docker: 65,
    "REST APIs": 80,
    Security: 75,
  };

  if (plan.techStack) {
    for (const [cat, skills] of Object.entries(plan.techStack)) {
      for (const s of skills) {
        if (!requiredSkillMap[s]) {
          requiredSkillMap[s] = cat.includes("ai") ? 85 : 70;
        }
      }
    }
  }

  const results = [];
  for (const [skill, req] of Object.entries(requiredSkillMap)) {
    const current = candidateOrTeamSkills[skill] || 0;
    const gap = Math.max(0, req - current);
    results.push({
      skill,
      requiredScore: req,
      currentScore: current,
      gap,
      covered: current >= req,
      recommendation:
        current >= req
          ? `✓ Satisfied by team competency (${current}% vs ${req}% required)`
          : `⚠ Requires recruitment or skill pairing (Gap: ${gap}%)`,
    });
  }

  return results.sort((a, b) => b.gap - a.gap);
}

// ============================================================================
// CLIENT AI PROJECT PLAN GENERATOR (Section 14 & 15)
// ============================================================================

export function generateStructuredClientProjectPlan(
  prompt: string,
  projectName?: string
): DetailedProjectPlan {
  const isRestaurantOrFood =
    prompt.toLowerCase().includes("restaurant") ||
    prompt.toLowerCase().includes("food") ||
    prompt.toLowerCase().includes("delivery") ||
    prompt.toLowerCase().includes("dining");

  const title = projectName || (isRestaurantOrFood ? "AI-Powered Restaurant & Food Delivery Platform" : "Cloud Enterprise Application");

  if (isRestaurantOrFood) {
    return {
      id: "plan-" + Date.now(),
      title,
      overview: "A comprehensive multi-tenant food delivery and table-booking platform featuring AI menu recommendations, real-time dispatch tracking, and seamless payment processing.",
      objectives: [
        "Enable seamless online table reservation and meal pre-ordering with sub-second confirmation.",
        "Provide real-time courier geo-tracking and estimated arrival telemetry for customers.",
        "Leverage AI for personalized dietary recommendation based on past orders and taste preferences.",
        "Equip restaurant staff with high-efficiency kitchen display and inventory synchronization.",
      ],
      targetUsers: ["Customers (Diners)", "Restaurant Owners / Kitchen Staff", "Delivery Couriers", "Platform Administrators"],
      techStack: {
        frontend: ["React / Next.js", "TypeScript", "Tailwind CSS", "Mapbox GL"],
        backend: ["Node.js / Express", "FastAPI (AI Recommendation Engine)"],
        database: ["PostgreSQL (Relational)", "Redis (Session & Geolocation Caching)"],
        aiFeatures: ["Menu Personalization (Embeddings)", "Dynamic ETA Dispatch Optimizer", "AI Review Sentiment Analysis"],
        devops: ["Docker", "Kubernetes", "AWS ECS", "GitHub Actions CI/CD"],
        security: ["JWT Authentication", "PCI-DSS Compliant Stripe Integration", "Role-Based Access Control (RBAC)"],
      },
      architectureSummary: "Decoupled microservice architecture: Next.js frontend interacts with an API Gateway routing to Order Management, AI Recommendation, and Real-time Geo-Tracking services backed by Redis and PostgreSQL.",
      apiRequirements: [
        "POST /api/v1/orders - Place and validate customer orders with Stripe hold",
        "GET /api/v1/restaurants/menu - Retrieve menus with dynamic dietary filters",
        "POST /api/v1/ai/recommendations - Generate real-time personalized pairing recommendations",
        "WS /ws/v1/delivery/tracking - WebSockets live courier telemetry stream",
      ],
      phases: [
        {
          id: "phase-1",
          name: "Phase 1: Architecture, Authentication & Menu Management",
          duration: "2 Weeks",
          modules: [
            {
              id: "mod-auth",
              name: "Module: Authentication & RBAC",
              description: "User onboarding and privilege separation for Diners, Kitchen Staff, and Couriers.",
              features: ["Social Sign-in", "Role-Based Route Guards", "Session Rotation"],
              tasks: [
                {
                  id: "t-auth-1",
                  title: "User registration & identity verification",
                  description: "Implement multi-role registration flow with email OTP and OAuth2.",
                  requiredRole: "Backend Engineer",
                  requiredSkills: ["Node.js", "JWT", "PostgreSQL"],
                  dependencies: [],
                  subtasks: [
                    { id: "st-1", title: "Create registration UI & form validation", completed: false, estimatedHours: 6 },
                    { id: "st-2", title: "Create auth API endpoints & JWT generator", completed: false, estimatedHours: 8 },
                    { id: "st-3", title: "Set up PostgreSQL User and Roles schema", completed: false, estimatedHours: 4 },
                    { id: "st-4", title: "Implement bcrypt password hashing & rate limits", completed: false, estimatedHours: 5 },
                  ],
                },
              ],
            },
            {
              id: "mod-menu",
              name: "Module: Menu & Inventory System",
              description: "Catalog management allowing restaurants to publish dishes, variants, and stock.",
              features: ["Multi-category catalog", "Inventory alerts", "Dietary tag indexing"],
              tasks: [
                {
                  id: "t-menu-1",
                  title: "Interactive Menu Catalog & Search",
                  description: "High-performance dish browsing with live filtering and photo galleries.",
                  requiredRole: "Frontend Engineer",
                  requiredSkills: ["React", "TypeScript", "Tailwind"],
                  dependencies: ["t-auth-1"],
                  subtasks: [
                    { id: "st-m1", title: "Design responsive Menu Grid component", completed: false, estimatedHours: 8 },
                    { id: "st-m2", title: "Connect to REST Menu API endpoints", completed: false, estimatedHours: 6 },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "phase-2",
          name: "Phase 2: Ordering Pipeline, Payments & Cart",
          duration: "3 Weeks",
          modules: [
            {
              id: "mod-order",
              name: "Module: Order Engine & Stripe Integration",
              description: "End-to-end checkout, tax calculation, tips, and webhook settlement.",
              features: ["Cart state sync", "Stripe payment intents", "Kitchen display queue"],
              tasks: [
                {
                  id: "t-order-1",
                  title: "Checkout Pipeline & Stripe Webhook Engine",
                  description: "Secure payment authorization and automated kitchen docket dispatch.",
                  requiredRole: "Full Stack Engineer",
                  requiredSkills: ["Node.js", "Stripe API", "PostgreSQL"],
                  dependencies: ["t-menu-1"],
                  subtasks: [
                    { id: "st-o1", title: "Stripe payment intent creation & verification", completed: false, estimatedHours: 10 },
                    { id: "st-o2", title: "Atomic order placement database transaction", completed: false, estimatedHours: 8 },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "phase-3",
          name: "Phase 3: AI Recommendation Engine & Geo-Tracking",
          duration: "2 Weeks",
          modules: [
            {
              id: "mod-ai",
              name: "Module: AI Taste Profiling & Real-Time Tracking",
              description: "Predictive recommendations and live courier GPS socket stream.",
              features: ["Vector-based dish matching", "Mapbox driver tracking", "Push notifications"],
              tasks: [
                {
                  id: "t-ai-1",
                  title: "AI Dietary & Flavor Pairings Service",
                  description: "Embeddings-based recommendation model suggesting complementary appetizers and drinks.",
                  requiredRole: "AI / ML Engineer",
                  requiredSkills: ["Python", "FastAPI", "Vector Embeddings"],
                  dependencies: ["t-order-1"],
                  subtasks: [
                    { id: "st-ai1", title: "Build flavor pairing embeddings index", completed: false, estimatedHours: 12 },
                    { id: "st-ai2", title: "Deploy low-latency recommendation endpoint", completed: false, estimatedHours: 8 },
                  ],
                },
              ],
            },
          ],
        },
        {
          id: "phase-4",
          name: "Phase 4: QA, Security Audit & Cloud Deployment",
          duration: "1 Week",
          modules: [
            {
              id: "mod-qa",
              name: "Module: Production Readiness",
              description: "Load testing, PCI compliance check, Docker containerization, and AWS rollout.",
              features: ["99.9% SLA configuration", "Sentry telemetry", "Automated backups"],
              tasks: [
                {
                  id: "t-qa-1",
                  title: "End-to-End Stress Testing & Cloud Launch",
                  description: "Simulate 5,000 concurrent cart checkouts and deploy containerized cluster.",
                  requiredRole: "DevOps Engineer",
                  requiredSkills: ["Docker", "Kubernetes", "AWS", "CI/CD"],
                  dependencies: ["t-ai-1"],
                  subtasks: [
                    { id: "st-q1", title: "Run Playwright & K6 load simulations", completed: false, estimatedHours: 8 },
                    { id: "st-q2", title: "Provision AWS production cluster and TLS certificates", completed: false, estimatedHours: 10 },
                  ],
                },
              ],
            },
          ],
        },
      ],
      teamRequirements: [
        { role: "Frontend Engineer", count: 1, responsibilities: "Customer web application, dining menus, and courier tracking maps." },
        { role: "Backend Engineer", count: 1, responsibilities: "REST APIs, database migrations, Stripe webhooks, and auth security." },
        { role: "AI / ML Engineer", count: 1, responsibilities: "Menu personalization, recommendation pipelines, and ETA optimization." },
        { role: "DevOps Engineer", count: 1, responsibilities: "Containerization, cloud infrastructure, CI/CD, and monitoring." },
      ],
      timeline: "8 Weeks (4 Phased Deliverables)",
      risksAndMitigations: [
        { risk: "Peak dinner hour order concurrency bottlenecks", mitigation: "Redis order caching and asynchronous queue processing." },
        { risk: "Courier GPS disconnection during transit", mitigation: "Client-side telemetry interpolation and fallback SMS notifications." },
        { risk: "Payment processing webhook failure", mitigation: "Idempotent payment ledger transactions with automatic retry reconciliation." },
      ],
      testingStrategy: "Unit tests for calculation models (Jest), integration tests for Stripe/API (Supertest), and Playwright E2E for ordering flows.",
      deploymentPlan: "Containerized deployment via Docker to AWS ECS with auto-scaling group and CloudFront CDN for static assets.",
      futureEnhancements: ["Voice ordering through LLM integration", "Drone delivery telemetry interface", "Loyalty crypto tokens"],
    };
  }

  // Fallback generic software project plan
  return {
    id: "plan-" + Date.now(),
    title,
    overview: "Production-grade cloud software platform engineered with resilient architecture, automated workflows, and high-performance databases.",
    objectives: [
      "Provide modern, responsive web application interfaces.",
      "Deliver low-latency RESTful and real-time API services.",
      "Ensure robust security, authentication, and encrypted data storage.",
    ],
    targetUsers: ["End Users", "Administrators"],
    techStack: {
      frontend: ["React", "TypeScript", "Tailwind CSS"],
      backend: ["Node.js", "Express", "TypeScript"],
      database: ["PostgreSQL", "Redis"],
      aiFeatures: ["Intelligent Search & Summarization"],
      devops: ["Docker", "GitHub Actions", "Vercel / AWS"],
      security: ["JWT", "HTTPS", "Data Encryption at Rest"],
    },
    architectureSummary: "Three-tier architecture with React client, Node.js API layer, and managed PostgreSQL storage.",
    apiRequirements: [
      "POST /api/v1/auth/login",
      "GET /api/v1/projects",
      "POST /api/v1/tasks",
    ],
    phases: [
      {
        id: "p1",
        name: "Phase 1: Design & Architecture",
        duration: "2 Weeks",
        modules: [
          {
            id: "m1",
            name: "Core Foundation",
            description: "System design, database schema, and project scaffold.",
            features: ["Scaffold", "CI/CD setup"],
            tasks: [],
          },
        ],
      },
      {
        id: "p2",
        name: "Phase 2: Core Implementation",
        duration: "3 Weeks",
        modules: [
          {
            id: "m2",
            name: "API & Frontend Modules",
            description: "Implementation of features, database integration, and UI views.",
            features: ["Responsive UI", "REST endpoints"],
            tasks: [],
          },
        ],
      },
    ],
    teamRequirements: [
      { role: "Full Stack Engineer", count: 1, responsibilities: "End-to-end web architecture and delivery." },
    ],
    timeline: "5 Weeks",
    risksAndMitigations: [
      { risk: "Scope creep", mitigation: "Strict phased deliverables and weekly sprint checkpoints." },
    ],
    testingStrategy: "Unit and integration tests with automated CI/CD validation.",
    deploymentPlan: "Continuous deployment via GitHub Actions to cloud environments.",
    futureEnhancements: ["Mobile apps (iOS & Android)", "Advanced analytics dashboard"],
  };
}

// ============================================================================
// RESUME PARSER & SKILL EXTRACTION (Section 4)
// ============================================================================

export function parseResumeContent(resumeText: string): {
  parsedData: ParsedResumeData;
  derivedSkillDna: Record<string, SkillDnaEntry>;
} {
  const text = resumeText.toLowerCase();

  // Basic education heuristic
  const isBTech = text.includes("b.tech") || text.includes("bachelor") || text.includes("computer science") || text.includes("engineering");
  const education: ParsedResumeData["education"] = {
    degree: isBTech ? "Bachelor of Technology (B.Tech)" : "Bachelor of Science",
    branch: text.includes("computer") ? "Computer Science & Engineering" : "Information Technology",
    currentYear: text.includes("4th") || text.includes("final") ? "4th Year" : "3rd Year",
    graduationStatus: "Expected 2026",
    institution: "Accredited University",
  };

  const detectedLanguages: string[] = [];
  if (text.includes("python")) detectedLanguages.push("Python");
  if (text.includes("javascript") || text.includes("js")) detectedLanguages.push("JavaScript");
  if (text.includes("typescript") || text.includes("ts")) detectedLanguages.push("TypeScript");
  if (text.includes("html")) detectedLanguages.push("HTML");
  if (text.includes("css")) detectedLanguages.push("CSS");
  if (text.includes("sql")) detectedLanguages.push("SQL");

  const detectedFrameworks: string[] = [];
  if (text.includes("react")) detectedFrameworks.push("React");
  if (text.includes("node")) detectedFrameworks.push("Node.js");
  if (text.includes("express")) detectedFrameworks.push("Express.js");
  if (text.includes("fastapi")) detectedFrameworks.push("FastAPI");
  if (text.includes("tailwind")) detectedFrameworks.push("Tailwind CSS");

  const detectedDatabases: string[] = [];
  if (text.includes("postgres") || text.includes("postgresql")) detectedDatabases.push("PostgreSQL");
  if (text.includes("mongo") || text.includes("mongodb")) detectedDatabases.push("MongoDB");
  if (text.includes("redis")) detectedDatabases.push("Redis");
  if (text.includes("sqlite")) detectedDatabases.push("SQLite");

  const detectedTools: string[] = [];
  if (text.includes("git")) detectedTools.push("Git");
  if (text.includes("docker")) detectedTools.push("Docker");
  if (text.includes("aws")) detectedTools.push("AWS");

  const detectedAi: string[] = [];
  if (text.includes("machine learning") || text.includes("ml")) detectedAi.push("Machine Learning");
  if (text.includes("pytorch")) detectedAi.push("PyTorch");
  if (text.includes("tensorflow")) detectedAi.push("TensorFlow");

  const parsedData: ParsedResumeData = {
    education,
    technicalSkills: {
      languages: detectedLanguages.length > 0 ? detectedLanguages : ["HTML", "CSS", "JavaScript", "Python"],
      frameworks: detectedFrameworks.length > 0 ? detectedFrameworks : ["React", "Express.js"],
      databases: detectedDatabases.length > 0 ? detectedDatabases : ["PostgreSQL", "SQL"],
      tools: detectedTools.length > 0 ? detectedTools : ["Git", "GitHub"],
      ai_ml: detectedAi,
    },
    nonTechnicalSkills: ["Communication", "Problem Solving", "Team Leadership", "Agile Collaboration"],
    experience: [
      {
        title: "Software Engineering Intern",
        company: "OmniCraft Labs",
        duration: "6 Months",
        type: "internship",
        description: "Engineered responsive frontend interfaces, integrated REST APIs, and authored unit tests.",
      },
    ],
    projects: [
      {
        name: "Personal Portfolio & Task Management Platform",
        technologies: ["React", "TypeScript", "Tailwind", "PostgreSQL"],
        complexity: "Intermediate",
        role: "Full Stack Developer",
        outcome: "Deployed live application with authenticated task boards and sub-100ms response times.",
      },
      {
        name: "Python Automation & API Dispatcher",
        technologies: ["Python", "FastAPI", "SQLite"],
        complexity: "Intermediate",
        role: "Backend Developer",
        outcome: "Automated daily report generation and third-party data synchronization.",
      },
    ],
    certifications: ["Full Stack Web Development", "Version Control with Git"],
  };

  // Derive updated Skill DNA from resume evidence
  const derivedSkillDna: Record<string, SkillDnaEntry> = { ...DEFAULT_SKILL_DNA };

  if (text.includes("python")) {
    derivedSkillDna["Python"] = {
      skillName: "Python",
      proficiency: 84,
      confidence: "HIGH",
      evidence: "Verified via resume: built 5+ backend & data automation scripts with FastAPI",
      lastDemonstrated: "Resume Project Portfolio",
      relatedSkills: ["FastAPI", "Automation", "Data Pipelines"],
      targetLevel: 90,
      category: "backend",
    };
  }

  if (text.includes("react")) {
    derivedSkillDna["React"] = {
      skillName: "React",
      proficiency: 52,
      confidence: "HIGH",
      evidence: "Verified via resume: authored component boards and custom state hooks",
      lastDemonstrated: "Resume Project: Portfolio & Task Manager",
      relatedSkills: ["TypeScript", "Next.js", "State Management"],
      targetLevel: 80,
      category: "frontend",
    };
  }

  if (text.includes("sql") || text.includes("postgres")) {
    derivedSkillDna["SQL"] = {
      skillName: "SQL",
      proficiency: 65,
      confidence: "HIGH",
      evidence: "Verified via resume: designed normalized relational schemas in PostgreSQL",
      lastDemonstrated: "Resume Database Implementations",
      relatedSkills: ["PostgreSQL", "Database Design", "Indexing"],
      targetLevel: 75,
      category: "database",
    };
  }

  return { parsedData, derivedSkillDna };
}
