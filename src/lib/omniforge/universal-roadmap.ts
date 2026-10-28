/**
 * Universal Roadmap & Multi-Stage Execution Plan Engine
 * 
 * Supports:
 * - Comprehensive Learning Roadmaps (Java 24-Stage Curriculum, Python, Web, Mobile, AI/ML)
 * - Project Execution Plans (Software architectures, Film production, Business launches)
 * - Independent subject-specific artifacts with stable IDs
 * - Actionable milestones with topic checklists, practical exercises, rubrics, and project tasks
 */

import {
  RoadmapNode,
  RoadmapNodeState,
  VisualRoadmapData,
  ProgressiveProjectStage,
  DeepTopicItem,
  RoadmapTroubleshootingItem,
  RoadmapKnowledgeCheckItem,
  RoadmapActionableTask,
} from "./user-intelligence";
import { z } from "zod";

export * from "./curriculum/types";
export * from "./curriculum/planner";
export * from "./curriculum/validator";
export * from "./curriculum/python-curriculum";
export * from "./curriculum/frontend-curriculum";
export * from "./curriculum/ml-curriculum";
export * from "./curriculum/cybersecurity-curriculum";
export * from "./curriculum/video-editing-curriculum";
export * from "./curriculum/dsa-curriculum";
export * from "./curriculum/execution-curriculum";

import { CurriculumBlueprint } from "./curriculum/types";
import {
  planSubjectCurriculum,
  buildDeepContentForStage,
} from "./curriculum/planner";
import { validateRoadmapQualityGate } from "./curriculum/validator";
import {
  PYTHON_BLUEPRINT_STAGES,
  getPythonDeepStageContent,
} from "./curriculum/python-curriculum";
import {
  FRONTEND_BLUEPRINT_STAGES,
  getFrontendDeepStageContent,
} from "./curriculum/frontend-curriculum";
import {
  ML_BLUEPRINT_STAGES,
  getMLDeepStageContent,
} from "./curriculum/ml-curriculum";
import {
  CYBERSECURITY_BLUEPRINT_STAGES,
  getCybersecurityDeepStageContent,
} from "./curriculum/cybersecurity-curriculum";
import {
  VIDEO_EDITING_BLUEPRINT,
  buildVideoEditingStageContent,
} from "./curriculum/video-editing-curriculum";
import {
  DSA_BLUEPRINT,
  buildDSAStageContent,
} from "./curriculum/dsa-curriculum";
import {
  buildExecutionPhasesForProject,
  buildExecutionNodesFromTemplates,
} from "./curriculum/execution-curriculum";

export type RoadmapType = "LEARNING" | "EXECUTION";

export interface RoadmapStageTopic {
  id: string;
  title: string;
  completed: boolean;
  subtopics?: string[];
  explanation?: string;
  keySyntaxOrApis?: string[];
  example?: {
    title: string;
    description: string;
    codeOrWalkthrough: string;
  };
  exercise?: {
    title: string;
    prompt: string;
    expectedOutcome: string;
  };
  troubleshooting?: string[];
}

export interface RoadmapPracticalExercise {
  id: string;
  title: string;
  prompt: string;
  starterCode?: string;
  hints?: string[];
  solution?: string;
  instructions?: string[];
  expectedOutcome?: string;
}

export interface RoadmapAssessment {
  criterion: string;
  passingScore: number;
  questions?: string[];
  knowledgeCheck?: RoadmapKnowledgeCheckItem[];
}

export interface UniversalRoadmap extends VisualRoadmapData {
  id: string;
  ownerId?: string;
  conversationId?: string;
  title: string;
  domain: string;
  subject?: string;
  summary?: string;
  roadmapType: RoadmapType;
  userObjective: string;
  description?: string;
  experienceLevel?: "Beginner" | "Intermediate" | "Advanced" | "All Levels";
  estimatedDuration: string;
  version: number;
  status: "ACTIVE" | "COMPLETED" | "ARCHIVED";
  createdAt: string;
  updatedAt: string;
  dependencies?: Record<string, string[]>;
  nodes: RoadmapNode[];
  stages: ProgressiveProjectStage[];
  sectionIndex?: number;
  totalSections?: number;
  isSectionComplete?: boolean;
}

export const UniversalRoadmapZodSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  domain: z.string().min(1),
  roadmapType: z.enum(["LEARNING", "EXECUTION"]),
  userObjective: z.string().min(1),
  status: z.enum(["ACTIVE", "COMPLETED", "ARCHIVED"]),
  nodes: z.array(z.any()).min(1),
  stages: z.array(z.any()).min(1),
});

/**
 * Robust extraction of subject, domain, and intent mode from user prompt.
 * Strips all conversational prefixes ("I need", "I want", "Can you generate", "as a")
 * without removing meaningful domain terms.
 */
export function cleanAndExtractGoalSubject(prompt: string): {
  subject: string;
  domain: string;
  isAmbiguous: boolean;
  isExecutionPlan: boolean;
} {
  let text = (prompt || "").trim();
  if (!text) {
    return { subject: "", domain: "Professional Discipline", isAmbiguous: true, isExecutionPlan: false };
  }

  // Remove common punctuation and trailing question marks
  text = text.replace(/[?!.]+$/, "").trim();

  // Check if it's an execution plan (project planning vs skill learning)
  const isExecutionPlan =
    /\b(?:plan|planning|execution\s+plan|build|make|launch|develop|project\s+plan)\b/i.test(text) &&
    /\b(?:app|application|platform|startup|business|event|film|short\s+film|movie|system|product|service)\b/i.test(text) &&
    !/\b(?:learn|study|curriculum|master|syllabus)\b/i.test(text);

  // Iteratively strip conversational intent prefixes
  let prev = "";
  while (prev !== text) {
    prev = text;
    text = text
      .replace(/^(?:can|could|would)\s+you\s+(?:please\s+)?(?:give\s+me|show\s+me|create|build|generate|make|provide|design|plan|teach\s+me|help\s+me\s+(?:to\s+)?(?:plan|create|build|make|learn|study|design)?)(?:\s+(?:a|an|the|me))?\s*/i, "")
      .replace(/^please\s+(?:give\s+me|show\s+me|create|build|generate|make|provide|design|plan|help\s+me\s+with)(?:\s+(?:a|an|the|me))?\s*/i, "")
      .replace(/^help\s+me\s+(?:to\s+)?(?:plan|build|create|learn|master|produce|develop|design)(?:\s+(?:a|an|the))?\s*/i, "")
      .replace(/^i\s+(?:need|want|would\s+like|wish)\s+(?:to\s+)?(?:learn|master|study|build|create|produce|develop|design|plan|become|be)?(?:\s+(?:a|an|the))?\s*/i, "")
      .replace(/^(?:give\s+me|create|generate|build|make|provide|design|draft|plan)\s+(?:a|an|the|new|me)?\s*/i, "")
      .replace(/^(?:the\s+|a\s+|an\s+|my\s+|our\s+)?(?:complete|comprehensive|detailed|deep|full|structured|step[\s\-]?by[\s\-]?step|in[\s\-]?depth|practical|ultimate)\s+/i, "")
      .replace(/^(?:a|an|the|my|new|some)?\s*(?:career|learning|execution|project|production)?\s*(?:roadmap|plan|curriculum|guide|pathway|path|course|syllabus)(?:\s+(?:for|on|in|about|to|as|of))?\s*/i, "")
      .replace(/^(?:as\s+(?:a|an)?|to\s+be\s+(?:a|an)?|to\s+become\s+(?:a|an)?|for\s+(?:a|an)?)\s*/i, "")
      .replace(/^(?:a|an|the)\s+/i, "")
      .trim();
  }

  // Iteratively strip trailing noise suffixes
  prev = "";
  while (prev !== text) {
    prev = text;
    text = text
      .replace(/\s*(?:career|learning|execution|project|production)?\s*(?:roadmap|plan|curriculum|guide|pathway|path|course|syllabus)\s*$/i, "")
      .replace(/\s*(?:from\s+scratch|from\s+beginner\s+to\s+advanced|step\s+by\s+step|for\s+beginners|from\s+basic\s+to\s+advanced|from\s+zero\s+to\s+hero|please)\s*$/i, "")
      .replace(/\s+(?:development|production|engineering)?\s*(?:roadmap|plan)\s*$/i, "")
      .trim();
  }

  // Check if remaining string is empty or contains stop words/fragments
  const stopWordRegex = /^(?:i\s+need|i\s+need\s+as\s+a|i\s+want|as\s+a|to\s+be|roadmap|plan|a|an|the|me|my|please|help|create|learn|something|anything|everything|curriculum|study)$/i;

  if (!text || text.length < 2 || stopWordRegex.test(text)) {
    // If the original prompt mentioned a specific discipline, extract that
    const lower = prompt.toLowerCase();
    if (/\b(?:dsa|data\s*structures?\s*(?:and|&)\s*algorithms?)\b/i.test(lower)) {
      return { subject: "Data Structures and Algorithms", domain: "Computer Science & Engineering", isAmbiguous: false, isExecutionPlan: false };
    }
    if (/\b(?:video\s*edit(?:ing|or)?|video-edit(?:ing|or)?)\b/i.test(lower)) {
      return { subject: "Video Editing", domain: "Media Production & Creative Arts", isAmbiguous: false, isExecutionPlan: false };
    }
    if (/\b(?:frontend|front[\s\-]?end)\b/i.test(lower)) {
      return { subject: "Frontend Development", domain: "Web Development", isAmbiguous: false, isExecutionPlan: false };
    }
    if (/\b(?:full\s*stack|fullstack)\b/i.test(lower)) {
      return { subject: "Full Stack Developer", domain: "Software Engineering", isAmbiguous: false, isExecutionPlan: false };
    }
    if (/\b(?:short\s*film|film\s*production|film|cinema|movie)\b/i.test(lower)) {
      return { subject: "Short Film Production", domain: "Filmmaking & Cinema Production", isAmbiguous: false, isExecutionPlan: isExecutionPlan };
    }
    if (/\b(?:mobile|ios|android|react\s*native|flutter)\b/i.test(lower)) {
      return { subject: "Mobile Application Development", domain: "Mobile Engineering", isAmbiguous: false, isExecutionPlan: isExecutionPlan };
    }
    if (/\b(?:java)\b/i.test(lower) && !/\b(?:javascript)\b/i.test(lower)) {
      return { subject: "Java", domain: "Software Engineering", isAmbiguous: false, isExecutionPlan: false };
    }
    if (/\b(?:python)\b/i.test(lower)) {
      return { subject: "Python", domain: "Software & AI", isAmbiguous: false, isExecutionPlan: false };
    }
    if (/\b(?:rust)\b/i.test(lower)) {
      return { subject: "Rust", domain: "Systems Programming", isAmbiguous: false, isExecutionPlan: false };
    }
    return { subject: "", domain: "Professional Discipline", isAmbiguous: true, isExecutionPlan: false };
  }

  // Canonical normalization for known patterns
  let cleanSubject = text;
  let domain = "Professional Discipline";

  const lowerText = text.toLowerCase();
  if (/\b(?:dsa|data\s*structures?\s*(?:and|&)\s*algorithms?)\b/i.test(lowerText) || lowerText === "dsa") {
    cleanSubject = "Data Structures and Algorithms";
    domain = "Computer Science & Engineering";
  } else if (/\b(?:video\s*edit(?:ing|or)?|video-edit(?:ing|or)?)\b/i.test(lowerText)) {
    cleanSubject = "Video Editing";
    domain = "Media Production & Creative Arts";
  } else if (/^frontend(?:\s+development)?$/i.test(lowerText) || /^html(?:\s*(?:&|and)\s*css)?$/i.test(lowerText)) {
    cleanSubject = "Frontend Development";
    domain = "Web Development";
  } else if (/^(?:making\s+a\s+)?(?:short\s+)?film(?:\s+production)?$/i.test(lowerText) || /^filmmaking$/i.test(lowerText) || /\b(?:short\s*film|film\s*production)\b/i.test(lowerText)) {
    cleanSubject = "Short Film Production";
    domain = "Filmmaking & Cinema Production";
  } else if (/^(?:complete\s+)?mobile\s+app(?:lication)?(?:\s+development)?$/i.test(lowerText)) {
    cleanSubject = "Mobile Application Development";
    domain = "Mobile Engineering";
  } else if (/^full\s*stack(?:\s+developer|\s+engineering)?$/i.test(lowerText)) {
    cleanSubject = "Full Stack Developer";
    domain = "Software Engineering";
  } else if (/^java$/i.test(lowerText)) {
    cleanSubject = "Java";
    domain = "Software Engineering";
  } else if (/^python$/i.test(lowerText)) {
    cleanSubject = "Python";
    domain = "Software & AI";
  } else if (/^rust$/i.test(lowerText)) {
    cleanSubject = "Rust";
    domain = "Systems Programming";
  } else if (/^cybersecurity$/i.test(lowerText)) {
    cleanSubject = "Cybersecurity";
    domain = "Information Security";
  } else if (/^machine\s*learning(?:\s*(?:&|and)\s*ai)?$/i.test(lowerText)) {
    cleanSubject = "Machine Learning & AI";
    domain = "Data Science & AI";
  } else if (/^screenplay|screenwriting|scriptwriting$/i.test(lowerText)) {
    cleanSubject = "Screenwriting";
    domain = "Filmmaking & Cinema Production";
  } else {
    // Title-case clean subject
    cleanSubject = text
      .split(/\s+/)
      .map((word) => {
        if (/^(?:and|or|in|of|for|on|with|to|at|by)$/i.test(word)) return word.toLowerCase();
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" ");

    // Infer domain from keywords if present
    if (/\b(?:react|vue|angular|css|html|ui|ux|web|design)\b/i.test(lowerText)) domain = "Web Development";
    else if (/\b(?:backend|api|server|microservice|database|sql)\b/i.test(lowerText)) domain = "Backend Engineering";
    else if (/\b(?:cloud|aws|azure|gcp|devops|docker|kubernetes)\b/i.test(lowerText)) domain = "Cloud & Infrastructure";
    else if (/\b(?:ai|ml|data|analytics|model)\b/i.test(lowerText)) domain = "Data Science & AI";
    else if (/\b(?:security|crypto|hack|audit)\b/i.test(lowerText)) domain = "Information Security";
    else if (/\b(?:film|cinema|video|audio|direct|acting|screenplay)\b/i.test(lowerText)) domain = "Filmmaking & Cinema Production";
    else if (/\b(?:app|ios|android|mobile)\b/i.test(lowerText)) domain = "Mobile Engineering";
    else if (/\b(?:game|unity|unreal|godot)\b/i.test(lowerText)) domain = "Game Development";
  }

  return {
    subject: cleanSubject,
    domain,
    isAmbiguous: false,
    isExecutionPlan,
  };
}

/**
 * Generates clean, canonical roadmap titles without conversational prompt fragments
 */
export function getCanonicalRoadmapTitle(
  subject: string,
  roadmapType: RoadmapType = "LEARNING",
  rawPrompt?: string
): string {
  const norm = (subject || "").toLowerCase().trim();
  const lowerPrompt = (rawPrompt || "").toLowerCase();

  if (norm.includes("video edit") || norm.includes("video-edit")) {
    return lowerPrompt.includes("complete") ? "Complete Video Editing Roadmap" : "Video Editing Roadmap";
  }
  if (norm === "dsa" || norm.includes("data structure") || norm.includes("algorithm")) {
    return "Data Structures and Algorithms Roadmap";
  }
  if (norm.includes("short film") || norm.includes("film production")) {
    return "Short Film Production Roadmap";
  }
  if (norm === "python") {
    return "Python Mastery Roadmap";
  }
  if (norm.includes("frontend") || norm.includes("html")) {
    return "Frontend Software Engineering Roadmap";
  }
  if (norm.includes("machine learning") || norm.includes("ai")) {
    return "Machine Learning & AI Engineering Roadmap";
  }
  if (norm.includes("cybersecurity") || norm.includes("security")) {
    return "Cybersecurity Defense Roadmap";
  }
  if (norm === "java") {
    return "Complete Java Mastery Roadmap";
  }
  if (norm.includes("screenwriting")) {
    return "Screenwriting & Narrative Architecture Roadmap";
  }
  if (roadmapType === "EXECUTION") {
    return `${subject} Execution Roadmap`;
  }
  return `${subject} Mastery Roadmap`;
}

/**
 * Detect requested subject and output type from user prompt
 */
export function detectRoadmapSubject(prompt: string): {
  subject: string;
  domain: string;
  type: RoadmapType;
  isExecutionPlan: boolean;
  isAmbiguous: boolean;
} {
  const extracted = cleanAndExtractGoalSubject(prompt);
  if (extracted.isAmbiguous || !extracted.subject) {
    return {
      subject: "Software Engineering",
      domain: "Software Engineering",
      type: "LEARNING",
      isExecutionPlan: false,
      isAmbiguous: true,
    };
  }
  return {
    subject: extracted.subject,
    domain: extracted.domain,
    type: extracted.isExecutionPlan ? "EXECUTION" : "LEARNING",
    isExecutionPlan: extracted.isExecutionPlan,
    isAmbiguous: false,
  };
}

/**
 * Strict validator and sanitizer: verifies data contract adherence,
 * eliminates corrupt prompt fragments, and ensures 1-to-1 sync between stages and nodes.
 */
export function validateAndSanitizeRoadmap(
  raw: any,
  fallbackSubject: string = "Software Engineering"
): { valid: boolean; roadmap: UniversalRoadmap; issues: string[] } {
  const issues: string[] = [];
  if (!raw || typeof raw !== "object") {
    issues.push("Invalid raw roadmap object; generated fresh roadmap.");
    return {
      valid: false,
      roadmap: buildUniversalDynamicRoadmap(fallbackSubject, "Professional Discipline"),
      issues,
    };
  }

  // Clean title from prompt fragments
  let cleanTitle = String(raw.title || raw.goal || `${fallbackSubject} Mastery Roadmap`).trim();
  if (
    cleanTitle.toLowerCase().includes("i need as a") ||
    cleanTitle.toLowerCase().includes("i need a mastery") ||
    cleanTitle === "Mastery Roadmap"
  ) {
    cleanTitle = `${fallbackSubject} Mastery Roadmap`;
    issues.push("Sanitized corrupted prompt fragment from roadmap title.");
  }

  const id = String(raw.id || `rm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  const domain = String(raw.domain || "Professional Discipline");
  const roadmapType: RoadmapType = raw.roadmapType === "EXECUTION" ? "EXECUTION" : "LEARNING";
  const userObjective = String(raw.userObjective || `Master ${fallbackSubject} through progressive milestones.`);
  const status = raw.status === "COMPLETED" || raw.status === "ARCHIVED" ? raw.status : "ACTIVE";
  const now = new Date().toISOString();
  const createdAt = String(raw.createdAt || now);
  const updatedAt = now;

  let targetRole = String(raw.targetRole || `${fallbackSubject} Specialist`);
  if (targetRole.toLowerCase().includes("i need as a") || targetRole.toLowerCase() === "i need as a") {
    targetRole = `${fallbackSubject} Specialist`;
    issues.push("Sanitized corrupted targetRole.");
  }

  // Validate and sanitize nodes
  let rawNodes: any[] = Array.isArray(raw.nodes) && raw.nodes.length > 0 ? raw.nodes : [];
  if (rawNodes.length === 0) {
    issues.push("Roadmap had empty nodes; rebuilt from dynamic template.");
    const fallbackRm = buildUniversalDynamicRoadmap(fallbackSubject, domain);
    rawNodes = fallbackRm.nodes;
  }

  const nodes: RoadmapNode[] = rawNodes.map((n, idx) => {
    const level = typeof n.level === "number" ? n.level : idx + 1;
    let nodeTitle = String(n.title || `Stage ${level}`);
    if (nodeTitle.toLowerCase().includes("i need as a")) {
      nodeTitle = nodeTitle.replace(/i need as a/gi, fallbackSubject).trim();
      issues.push(`Sanitized prompt fragment from node ${level} title.`);
    }

    const state: RoadmapNodeState =
      n.state === "COMPLETED" || n.state === "PASSED" || n.state === "IN_PROGRESS" || n.state === "AVAILABLE"
        ? n.state
        : idx === 0
        ? "IN_PROGRESS"
        : "LOCKED";

    const task =
      n.task && typeof n.task === "object"
        ? {
            title: String(n.task.title || `Execute Level ${level} Deliverables`),
            description: String(n.task.description || `Complete key tasks and exercises for Level ${level}.`),
            deliverables:
              Array.isArray(n.task.deliverables) && n.task.deliverables.length > 0
                ? n.task.deliverables.map(String)
                : [`Verified Level ${level} completion artifact`],
          }
        : {
            title: `Execute Level ${level} Deliverables`,
            description: `Complete key tasks and exercises for Level ${level}.`,
            deliverables: [`Verified Level ${level} completion artifact`],
          };

    const miniProject =
      n.miniProject && typeof n.miniProject === "object"
        ? {
            title: String(n.miniProject.title || `Level ${level} Project`),
            description: String(n.miniProject.description || `Practical application project for Level ${level}.`),
            techStack: Array.isArray(n.miniProject.techStack) ? n.miniProject.techStack.map(String) : [fallbackSubject],
            difficulty: n.miniProject.difficulty || (level <= 2 ? "Beginner" : level <= 4 ? "Intermediate" : "Advanced"),
          }
        : {
            title: `Level ${level} Project`,
            description: `Practical application project for Level ${level}.`,
            techStack: [fallbackSubject],
            difficulty: level <= 2 ? "Beginner" : level <= 4 ? "Intermediate" : "Advanced",
          };

    const learningObjectives =
      Array.isArray(n.learningObjectives) && n.learningObjectives.length > 0
        ? n.learningObjectives.map(String)
        : [`Master foundational concepts of Level ${level}`, `Apply practical principles to project deliverables`];

    // Topics: preserve deep topics if present, otherwise enrich from topicChecklist
    let topics: DeepTopicItem[] = [];
    if (Array.isArray(n.topics) && n.topics.length > 0) {
      topics = n.topics.map((top: any, tIdx: number) => {
        const topId = String(top.id || `top_${level}_${tIdx + 1}`);
        const topTitle = String(top.title || `Topic ${tIdx + 1}`).replace(/i need as a/gi, fallbackSubject).trim();
        const subtopics: string[] = Array.isArray(top.subtopics) && top.subtopics.length > 0
          ? top.subtopics.map(String)
          : [
              `Core principles and fundamentals of ${topTitle}`,
              `Syntax patterns and standard implementations`,
              `Edge cases, error handling, and performance boundaries`,
              `Practical applied tasks and validation criteria`,
            ];
        const explanation = String(
          top.explanation ||
          `${topTitle} is an essential component of ${fallbackSubject}. Understanding how these primitives function empowers developers to write reliable, maintainable solutions while avoiding common anti-patterns.`
        );
        const keySyntaxOrApis = Array.isArray(top.keySyntaxOrApis) ? top.keySyntaxOrApis.map(String) : undefined;
        const example = top.example && typeof top.example === "object"
          ? {
              title: String(top.example.title || `${topTitle} Example`),
              description: String(top.example.description || `Practical walkthrough of ${topTitle}.`),
              codeOrWalkthrough: String(top.example.codeOrWalkthrough || `// Example for ${topTitle}\nconsole.log("Verified implementation");`),
            }
          : undefined;
        const exercise = top.exercise && typeof top.exercise === "object"
          ? {
              title: String(top.exercise.title || `${topTitle} Exercise`),
              prompt: String(top.exercise.prompt || `Implement a solution demonstrating ${topTitle}.`),
              expectedOutcome: String(top.exercise.expectedOutcome || `Verified working solution passing test assertions.`),
            }
          : undefined;
        const troubleshooting = Array.isArray(top.troubleshooting) ? top.troubleshooting.map(String) : undefined;

        return {
          id: topId,
          title: topTitle,
          completed: Boolean(top.completed),
          subtopics,
          explanation,
          keySyntaxOrApis,
          example,
          exercise,
          troubleshooting,
        };
      });
    } else {
      // Derive deep topics with subtopics from topicChecklist
      const baseList = Array.isArray(n.topicChecklist) && n.topicChecklist.length > 0
        ? n.topicChecklist
        : [
            { id: `top_${level}_1`, title: `${fallbackSubject} Level ${level} Foundations`, completed: false },
            { id: `top_${level}_2`, title: `Core Workflows & Standard Operations`, completed: false },
            { id: `top_${level}_3`, title: `Defensive Architecture & Best Practices`, completed: false },
          ];
      topics = baseList.map((t: any, tIdx: number) => {
        const topTitle = String(t.title || `Topic ${tIdx + 1}`).replace(/i need as a/gi, fallbackSubject).trim();
        return {
          id: String(t.id || `top_${level}_${tIdx + 1}`),
          title: topTitle,
          completed: Boolean(t.completed),
          subtopics: [
            `Core principles and fundamentals of ${topTitle}`,
            `Syntax patterns and standard implementations`,
            `Edge cases, error handling, and performance boundaries`,
            `Practical applied tasks and validation criteria`,
          ],
          explanation: `${topTitle} is an essential milestone in ${fallbackSubject}. Mastering these primitives enables developers to build resilient, maintainable solutions while avoiding common anti-patterns and performance bottlenecks.`,
          keySyntaxOrApis: [`${fallbackSubject.toLowerCase().replace(/[^a-z0-9]/g, "_")}.${topTitle.toLowerCase().replace(/[^a-z0-9]/g, "_")}()`],
          example: {
            title: `${topTitle} Demonstration`,
            description: `Applied walkthrough of ${topTitle} in ${fallbackSubject}.`,
            codeOrWalkthrough: `// ${topTitle} Walkthrough\nfunction execute${topTitle.replace(/[^a-zA-Z0-9]/g, "")}() {\n  // Implementation verifying ${topTitle}\n  return true;\n}`,
          },
          exercise: {
            title: `${topTitle} Practice Lab`,
            prompt: `Write a modular implementation applying ${topTitle}.`,
            expectedOutcome: `Working code or artifact verifying ${topTitle} with 0 errors.`,
          },
          troubleshooting: [
            `Ensure all inputs to ${topTitle} are validated before processing.`,
            `Inspect environment configuration if unexpected runtime behavior occurs.`,
          ],
        };
      });
    }

    const topicChecklist = topics.map((t) => ({
      id: t.id,
      title: t.title,
      completed: t.completed,
    }));

    // Common mistakes & troubleshooting
    const commonMistakesAndTroubleshooting: RoadmapTroubleshootingItem[] =
      Array.isArray(n.commonMistakesAndTroubleshooting) && n.commonMistakesAndTroubleshooting.length > 0
        ? n.commonMistakesAndTroubleshooting.map((m: any) => ({
            mistake: String(m.mistake || "Common anti-pattern or syntax pitfall"),
            consequence: String(m.consequence || "Runtime exception or degraded maintainability"),
            solutionOrFix: String(m.solutionOrFix || "Follow idiomatic patterns and validate inputs"),
          }))
        : [
            {
              mistake: `Ignoring edge cases and unvalidated inputs in Stage ${level}`,
              consequence: "Runtime exceptions, unexpected state corruption, or memory leaks.",
              solutionOrFix: "Add defensive guard clauses, input bounds checking, and strict schema validation.",
            },
            {
              mistake: `Skipping automated unit tests during initial implementation`,
              consequence: "Regressions go unnoticed until late integration phases.",
              solutionOrFix: "Write test assertions verifying expected outputs before refactoring.",
            },
          ];

    // Knowledge checks
    const knowledgeCheck: RoadmapKnowledgeCheckItem[] =
      Array.isArray(n.knowledgeCheck) && n.knowledgeCheck.length > 0
        ? n.knowledgeCheck.map((k: any) => ({
            question: String(k.question || "Core concept self-check question"),
            options: Array.isArray(k.options) ? k.options.map(String) : undefined,
            answerOrExplanation: String(k.answerOrExplanation || "Standard expected answer and rubric criteria."),
            solutionRubric: k.solutionRubric ? String(k.solutionRubric) : undefined,
          }))
        : [
            {
              question: `What are the core architectural tradeoffs and principles introduced in Stage ${level}?`,
              answerOrExplanation: `Stage ${level} establishes the foundational conventions and separation of concerns required to build reliable ${fallbackSubject} systems.`,
              solutionRubric: "Demonstrates clear understanding of principles, trade-offs, and failure modes.",
            },
            {
              question: `How do you troubleshoot common failure modes when executing Stage ${level} deliverables?`,
              answerOrExplanation: "Trace error logs, verify toolchain environment configuration, and test components in isolation with reproducible inputs.",
              solutionRubric: "Articulates systematic debugging methodology rather than trial-and-error.",
            },
          ];

    // Completion criteria
    const completionCriteria: string[] =
      Array.isArray(n.completionCriteria) && n.completionCriteria.length > 0
        ? n.completionCriteria.map(String)
        : [
            `All Stage ${level} topic checklists verified and understood`,
            `Milestone project implemented and passing test requirements`,
            `Clean code execution with 0 unhandled warnings or runtime errors`,
            `Self-assessment knowledge check answered accurately`,
          ];

    const practicalExercises =
      Array.isArray(n.practicalExercises) && n.practicalExercises.length > 0
        ? n.practicalExercises.map((e: any, eIdx: number) => ({
            id: String(e.id || `ex_${level}_${eIdx + 1}`),
            title: String(e.title || `Exercise ${eIdx + 1}`),
            prompt: String(e.prompt || `Implement the exercise requirement for Stage ${level}.`),
            starterCode: e.starterCode ? String(e.starterCode) : undefined,
            hints: Array.isArray(e.hints) ? e.hints.map(String) : undefined,
            instructions: Array.isArray(e.instructions) ? e.instructions.map(String) : undefined,
            expectedOutcome: e.expectedOutcome ? String(e.expectedOutcome) : "Working verified implementation.",
            solutionDeliverable: e.solutionDeliverable ? String(e.solutionDeliverable) : undefined,
          }))
        : [
            {
              id: `ex_${level}_1`,
              title: `Hands-On Implementation Lab`,
              prompt: `Write code or build artifacts validating Stage ${level} competencies.`,
              instructions: [
                `Review the stage topics and requirements.`,
                `Implement the core functions or configuration.`,
                `Test against sample inputs and edge cases.`,
              ],
              expectedOutcome: `Validated working solution for Stage ${level} with zero errors.`,
            },
          ];

    const assessment =
      n.assessment && typeof n.assessment === "object"
        ? {
            criterion: String(n.assessment.criterion || `Demonstrated competency in Stage ${level} objectives.`),
            passingScore: typeof n.assessment.passingScore === "number" ? n.assessment.passingScore : 85,
          }
        : {
            criterion: `Demonstrated competency in Stage ${level} objectives.`,
            passingScore: 85,
          };

    return {
      id: String(n.id || `node_${level}`),
      level,
      title: nodeTitle,
      skill: String(n.skill || nodeTitle),
      category: String(n.category || domain),
      concept: String(n.concept || `Core concepts and practical execution for ${nodeTitle}.`),
      state,
      whyLearnThis: String(n.whyLearnThis || `Essential milestone for mastering ${fallbackSubject}.`),
      prerequisites: Array.isArray(n.prerequisites) ? n.prerequisites.map(String) : level === 1 ? ["None"] : [`Stage ${level - 1}`],
      task,
      miniProject,
      learningObjectives,
      topics,
      topicChecklist,
      practicalExercises,
      commonMistakesAndTroubleshooting,
      knowledgeCheck,
      completionCriteria,
      actionableTasks:
        Array.isArray(n.actionableTasks) && n.actionableTasks.length > 0
          ? n.actionableTasks
          : roadmapType === "EXECUTION"
          ? [
              {
                id: `task_${level}_1`,
                title: `Execute Stage ${level} Core Deliverables`,
                deliverable: (task.deliverables && task.deliverables[0]) || `Stage ${level} Core Deliverable`,
                dependencies: level === 1 ? [] : [`Stage ${level - 1} Completion`],
                description: task.description || `Implement and verify deliverables for Stage ${level}.`,
                role: "Lead Engineer / Project Owner",
                roleOrOwner: "Lead Engineer / Project Owner",
                risks: "Scope creep and unhandled edge case requirements",
                riskMitigation: "Strict milestone boundaries and automated tests",
                validationProcedure: "Pass automated CI pipeline and code review",
                completed: Boolean(state === "COMPLETED"),
              },
              {
                id: `task_${level}_2`,
                title: `Quality Assurance & Integration Testing for Stage ${level}`,
                deliverable: `Validated test execution report and security checklist`,
                dependencies: [`task_${level}_1`],
                description: `Run regression tests, verify boundary conditions, and test integration points.`,
                role: "QA / Security Engineer",
                roleOrOwner: "QA / Security Engineer",
                risks: "Integration regressions under concurrent load",
                riskMitigation: "Automated regression suite in CI harness",
                validationProcedure: "100% test assertions pass without regression",
                completed: Boolean(state === "COMPLETED"),
              },
            ]
          : undefined,
      validationProcedures: Array.isArray(n.validationProcedures) ? n.validationProcedures.map(String) : undefined,
      risksAndMitigations: Array.isArray(n.risksAndMitigations) ? n.risksAndMitigations : undefined,
      assessment,
      rubric: Array.isArray(n.rubric) ? n.rubric : undefined,
      freeResources: Array.isArray(n.freeResources) ? n.freeResources : undefined,
      estimatedStudyHours: typeof n.estimatedStudyHours === "number" ? n.estimatedStudyHours : 16,
      estimatedStudyTime: String(n.estimatedStudyTime || "1.5 weeks"),
    };
  });

  // Reconcile stages 1-to-1 with nodes while preserving domain stage metadata
  const stages: ProgressiveProjectStage[] = nodes.map((n, idx) => {
    const rawStage = Array.isArray(raw.stages) ? raw.stages[idx] : undefined;
    const skillFocus =
      rawStage?.skillFocus && !/\bi\s+need(?:\s+as\s+a)?\b/i.test(rawStage.skillFocus)
        ? String(rawStage.skillFocus)
        : n.skill || n.title;
    const projectTitle =
      rawStage?.projectTitle && !/\bi\s+need(?:\s+as\s+a)?\b/i.test(rawStage.projectTitle)
        ? String(rawStage.projectTitle)
        : n.miniProject.title;
    const deliverables = rawStage?.deliverables
      ? String(rawStage.deliverables)
      : n.task.deliverables.join(", ");
    const complexity = rawStage?.complexity || n.miniProject.difficulty;

    return {
      stage: n.level,
      skillFocus,
      projectTitle,
      deliverables,
      complexity,
      status:
        n.state === "COMPLETED" || n.state === "PASSED"
          ? "COMPLETED"
          : n.state === "IN_PROGRESS"
          ? "ACTIVE"
          : "UPCOMING",
    };
  });

  const completedNodeCount = nodes.filter((n) => n.state === "COMPLETED" || n.state === "PASSED").length;
  const calculatedProgress =
    nodes.length > 0
      ? Math.round((completedNodeCount / nodes.length) * 100)
      : typeof raw.overallProgress === "number"
      ? raw.overallProgress
      : 0;

  const sanitizedRoadmap: UniversalRoadmap = {
    id,
    ownerId: String(raw.ownerId || "current_user"),
    conversationId: raw.conversationId ? String(raw.conversationId) : undefined,
    title: cleanTitle,
    domain,
    subject: fallbackSubject,
    summary: String(raw.summary || raw.description || raw.userObjective || `${cleanTitle} with ${stages.length} progressive milestones.`),
    roadmapType,
    userObjective,
    description: String(raw.description || raw.userObjective || `Master ${fallbackSubject} through progressive milestones.`),
    experienceLevel: raw.experienceLevel || "All Levels",
    estimatedDuration: String(raw.estimatedDuration || `${stages.length} Stages · Multi-Week Track`),
    version: typeof raw.version === "number" ? raw.version : 1,
    status,
    createdAt,
    updatedAt,
    goal: cleanTitle,
    targetRole,
    trackKey: String(raw.trackKey || `${fallbackSubject.toLowerCase().replace(/[^a-z0-9]/g, "_")}_track`),
    dailyStudyHours: typeof raw.dailyStudyHours === "number" ? raw.dailyStudyHours : 1.5,
    totalStudyHours: typeof raw.totalStudyHours === "number" ? raw.totalStudyHours : stages.length * 16,
    overallProgress: calculatedProgress,
    currentNodeId: nodes.find((n) => n.state === "IN_PROGRESS")?.id || nodes[0]?.id || "node_1",
    pointerLevel: nodes.find((n) => n.state === "IN_PROGRESS")?.level || 1,
    nodes,
    stages,
    lastUpdated: updatedAt,
  };

  return {
    valid: issues.length === 0,
    roadmap: sanitizedRoadmap,
    issues,
  };
}

/**
 * Completeness Validator (Section C)
 *
 * Validates that:
 * 1. The subject explicitly matches the requested goal without conversational fragments.
 * 2. Stage sequence is logically and consecutively ordered (1..N).
 * 3. Stages cover the declared scope with appropriate depth.
 * 4. Major topics have meaningful subtopics (at least 2 detailed subtopics per major topic).
 * 5. Practical work and mini-projects are present and relevant.
 * 6. Completion criteria are specific and verifiable.
 * 7. No placeholder fragments ("TODO", "Lorem", "undefined", "null") exist.
 * 8. Content has not been silently truncated.
 *
 * Returns validity status, detailed issues list, and auto-repaired roadmap.
 */
export function validateRoadmapCompleteness(
  roadmap: UniversalRoadmap,
  requestedSubject: string
): {
  isValid: boolean;
  issues: string[];
  repairedRoadmap: UniversalRoadmap;
} {
  const issues: string[] = [];
  const cleanRequested = cleanAndExtractGoalSubject(requestedSubject);
  const targetSubj = cleanRequested.subject || "Software Engineering";

  // 1. Subject match validation
  const normTitle = (roadmap.title || "").toLowerCase();
  const normGoal = (roadmap.goal || "").toLowerCase();
  const normDomain = (roadmap.domain || "").toLowerCase();
  const normTarget = targetSubj.toLowerCase();

  if (
    !normTitle.includes(normTarget) &&
    !normGoal.includes(normTarget) &&
    !normDomain.includes(normTarget)
  ) {
    issues.push(`Subject mismatch: Roadmap title "${roadmap.title}" does not contain target "${targetSubj}".`);
  }

  // 2. Stage ordering and non-duplication
  const stageNumbers = (roadmap.stages || []).map((s) => s.stage);
  if (stageNumbers.length === 0) {
    issues.push("Roadmap contains zero stages.");
  } else {
    for (let i = 0; i < stageNumbers.length; i++) {
      if (stageNumbers[i] !== i + 1) {
        issues.push(`Invalid stage ordering at index ${i}: level is ${stageNumbers[i]}, expected ${i + 1}.`);
        break;
      }
    }
  }

  // 3. Node count parity
  if ((roadmap.nodes || []).length !== (roadmap.stages || []).length) {
    issues.push(`Node to stage count mismatch: ${roadmap.nodes?.length} nodes vs ${roadmap.stages?.length} stages.`);
  }

  // 4. Topic and subtopic depth check
  for (const node of roadmap.nodes || []) {
    if (!node.title || !node.concept) {
      issues.push(`Stage ${node.level} is missing required title or concept.`);
    }

    if (!Array.isArray(node.topics) || node.topics.length < 2) {
      issues.push(`Stage ${node.level} has insufficient major topics (< 2).`);
    } else {
      for (const topic of node.topics) {
        if (!Array.isArray(topic.subtopics) || topic.subtopics.length < 2) {
          issues.push(`Topic "${topic.title}" in Stage ${node.level} lacks detailed subtopics (< 2).`);
        }
        if (!topic.explanation || topic.explanation.length < 30) {
          issues.push(`Topic "${topic.title}" in Stage ${node.level} has shallow explanation.`);
        }
      }
    }

    // 5. Practical work verification
    if (!node.miniProject || !node.miniProject.title || !node.task || !node.task.deliverables || node.task.deliverables.length === 0) {
      issues.push(`Stage ${node.level} lacks concrete milestone project or deliverables.`);
    }

    // 6. Completion criteria verification
    if (!Array.isArray(node.completionCriteria) || node.completionCriteria.length < 2) {
      issues.push(`Stage ${node.level} lacks verifiable completion criteria.`);
    }
  }

  // 7. Placeholder and truncation check
  const jsonStr = JSON.stringify(roadmap);
  if (/\b(?:TODO|TBD|Lorem ipsum|\[Insert\b|undefined|null)\b/i.test(jsonStr)) {
    issues.push("Roadmap contains placeholder fragments or unrendered templates.");
  }
  if (/\b(?:i\s+need(?:\s+as\s+a)?)\b/i.test(normTitle)) {
    issues.push("Roadmap title contains conversational prompt fragments.");
  }

  // Auto-repair if issues were encountered
  const { roadmap: repairedRoadmap } = validateAndSanitizeRoadmap(roadmap, targetSubj);

  return {
    isValid: issues.length === 0,
    issues,
    repairedRoadmap,
  };
}

// ============================================================================
// PART 3: COMPLETE 24-STAGE JAVA CURRICULUM (BEGINNER TO ADVANCED)
// ============================================================================

export function buildCompleteJavaRoadmap(conversationId?: string, userId?: string): UniversalRoadmap {
  const roadmapId = `rm_java_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const stages: ProgressiveProjectStage[] = [
    { stage: 1, skillFocus: "JDK, JVM, IDEs & Compilation", projectTitle: "Environment Setup & CLI Tooling", deliverables: "Working JDK 21+ setup, CLI compilation script, IDE config", complexity: "Beginner", status: "ACTIVE" },
    { stage: 2, skillFocus: "Syntax, Data Types, Operators & I/O", projectTitle: "Interactive Unit Converter & Math CLI", deliverables: "CLI tool with casting, formatted I/O, primitive limits", complexity: "Beginner", status: "UPCOMING" },
    { stage: 3, skillFocus: "Control Flow, Loops, Methods & Recursion", projectTitle: "Number Theory & Prime Matrix Engine", deliverables: "Menu-driven recursive algorithms with switch expressions", complexity: "Beginner", status: "UPCOMING" },
    { stage: 4, skillFocus: "Arrays, Strings & Common Algorithms", projectTitle: "Text Processing & Lexical Tokenizer", deliverables: "In-memory token counter, StringBuilder, sorting algorithms", complexity: "Beginner", status: "UPCOMING" },
    { stage: 5, skillFocus: "OOP Foundations: Classes, Constructors & Packages", projectTitle: "Bank Account Domain Model", deliverables: "Encapsulated domain entities with immutable records and packages", complexity: "Beginner", status: "UPCOMING" },
    { stage: 6, skillFocus: "Inheritance, Polymorphism & Interfaces", projectTitle: "Vehicle Fleet & Payment Gateway Hierarchy", deliverables: "Abstract classes, polymorphic dispatch, interface contracts", complexity: "Intermediate", status: "UPCOMING" },
    { stage: 7, skillFocus: "Exception Handling & Defensive Programming", projectTitle: "Resilient File Parser with Custom Exceptions", deliverables: "Checked/unchecked exception hierarchy, try-with-resources", complexity: "Intermediate", status: "UPCOMING" },
    { stage: 8, skillFocus: "Java Collections Framework & Generics", projectTitle: "Generic Inventory Management System", deliverables: "Custom generic storage with List, Set, Map, and Comparators", complexity: "Intermediate", status: "UPCOMING" },
    { stage: 9, skillFocus: "File Handling, I/O Streams, NIO.2 & Serialization", projectTitle: "Binary & JSON Config Synchronizer", deliverables: "Non-blocking file channels, path traversal, serializable objects", complexity: "Intermediate", status: "UPCOMING" },
    { stage: 10, skillFocus: "Functional Interfaces, Lambdas, Streams & Optional", projectTitle: "E-Commerce Order Analytics Pipeline", deliverables: "Complex Stream pipelines, custom collectors, Optional chaining", complexity: "Intermediate", status: "UPCOMING" },
    { stage: 11, skillFocus: "Modern Java: Records, Sealed Classes, Date/Time", projectTitle: "Event Booking Engine with Modern Java Features", deliverables: "Sealed hierarchies, Pattern Matching for switch, java.time API", complexity: "Intermediate", status: "UPCOMING" },
    { stage: 12, skillFocus: "Multithreading, Synchronization & Concurrency", projectTitle: "Concurrent Web Scraper & Task Dispatcher", deliverables: "ExecutorService, CompletableFuture, Virtual Threads, Atomic counters", complexity: "Advanced", status: "UPCOMING" },
    { stage: 13, skillFocus: "JVM Architecture, Memory, GC & Performance", projectTitle: "JVM Memory Profiling & GC Tuning Lab", deliverables: "Heap dump analysis, JIT compilation inspection, benchmark report", complexity: "Advanced", status: "UPCOMING" },
    { stage: 14, skillFocus: "Data Structures & Algorithms in Java", projectTitle: "Custom Balanced Tree & Graph Traversal Engine", deliverables: "Custom Red-Black Tree / Trie with Big-O complexity analysis", complexity: "Advanced", status: "UPCOMING" },
    { stage: 15, skillFocus: "JDBC, Transactions & Connection Pooling", projectTitle: "Production Database Persistence Layer", deliverables: "HikariCP integration, ACID transactions, batch updates", complexity: "Advanced", status: "UPCOMING" },
    { stage: 16, skillFocus: "Networking, Sockets, HTTP Clients & JSON", projectTitle: "Asynchronous Weather & Crypto Dashboard", deliverables: "java.net.http.HttpClient, Jackson object mapping, WebSocket client", complexity: "Advanced", status: "UPCOMING" },
    { stage: 17, skillFocus: "Unit Testing, JUnit 5, Mockito & Code Quality", projectTitle: "Enterprise Test Suite with TDD", deliverables: "Parameterized JUnit tests, Mockito stubs, AssertJ assertions", complexity: "Advanced", status: "UPCOMING" },
    { stage: 18, skillFocus: "Build Tools: Maven, Gradle, Git & CI/CD", projectTitle: "Multi-Module Maven Build Pipeline", deliverables: "Multi-module POM, dependency scopes, GitHub Actions workflow", complexity: "Advanced", status: "UPCOMING" },
    { stage: 19, skillFocus: "Secure Java Coding & OWASP Protection", projectTitle: "Hardened Authentication & Encryption Utility", deliverables: "Argon2 / BCrypt hashing, AES-256 encryption, input sanitization", complexity: "Advanced", status: "UPCOMING" },
    { stage: 20, skillFocus: "Enterprise Backend Foundations: Spring Core", projectTitle: "Spring Dependency Injection & Aspect Framework", deliverables: "IoC container setup, Bean lifecycles, Custom Spring AOP aspects", complexity: "Advanced", status: "UPCOMING" },
    { stage: 21, skillFocus: "Spring Boot REST APIs & Persistence Layer", projectTitle: "Production REST API with Spring Data JPA", deliverables: "REST controllers, JPA repository queries, DTO validation", complexity: "Advanced", status: "UPCOMING" },
    { stage: 22, skillFocus: "Software Architecture, SOLID & Design Patterns", projectTitle: "Clean Architecture Domain-Driven Core", deliverables: "Hexagonal architecture, Factory, Strategy, and Observer patterns", complexity: "Advanced", status: "UPCOMING" },
    { stage: 23, skillFocus: "Performance Profiling, Docker & Observability", projectTitle: "Containerized Microservice with Micrometer Metrics", deliverables: "Multi-stage Dockerfile, Prometheus metrics, Actuator health probes", complexity: "Production", status: "UPCOMING" },
    { stage: 24, skillFocus: "Full Capstone Architecture & Technical Interviews", projectTitle: "Scalable Distributed E-Commerce Microservices", deliverables: "Production capstone, LeetCode Java solutions, System Design doc", complexity: "Production", status: "UPCOMING" },
  ];

  const nodes: RoadmapNode[] = [
    {
      id: "java_node_1",
      level: 1,
      title: "Java Ecosystem & Compilation Fundamentals",
      skill: "JDK, JRE, JVM & Build Basics",
      category: "Foundations",
      concept: "Understanding how Java achieves Write Once, Run Anywhere via the JVM, bytecode, class loaders, and compiler tooling.",
      state: "IN_PROGRESS",
      whyLearnThis: "Mastering the toolchain ensures you understand how source code transforms into portable bytecode executed by the JVM.",
      prerequisites: ["Basic computer literacy", "Terminal familiarity"],
      task: {
        title: "Install JDK 21 and Compile CLI Program",
        description: "Install an LTS JDK (Eclipse Temurin 21 or Oracle JDK), configure JAVA_HOME, and inspect compiled bytecode.",
        deliverables: ["Configured JDK 21 LTS environment", "Compiled HelloWorld.class", "javap bytecode disassembly output"],
      },
      miniProject: {
        title: "System Environment Inspector CLI",
        description: "Build a Java program that queries and prints system architecture, runtime version, JVM memory settings, and classpath.",
        techStack: ["Java 21", "javac", "java", "javap"],
        difficulty: "Beginner",
      },
      learningObjectives: [
        "Explain the distinct roles of the JDK, JRE, and JVM",
        "Install and verify OpenJDK 21 LTS and set JAVA_HOME in your operating system",
        "Compile .java files with javac and execute bytecode with the java launcher",
        "Disassemble class files using javap to observe JVM bytecode instructions",
      ],
      topicChecklist: [
        { id: "jv_1_1", title: "JDK vs JRE vs JVM architectural differences", completed: false },
        { id: "jv_1_2", title: "Installing OpenJDK 21 LTS & configuring PATH / JAVA_HOME", completed: false },
        { id: "jv_1_3", title: "Compiling with javac and executing with java", completed: false },
        { id: "jv_1_4", title: "Modern IDE configuration (IntelliJ IDEA / Eclipse / VS Code)", completed: false },
        { id: "jv_1_5", title: "Disassembling bytecode using javap -c", completed: false },
        { id: "jv_1_6", title: "Java source files structure, package declaration, and class naming conventions", completed: false },
      ],
      practicalExercises: [
        {
          id: "ex_1_1",
          title: "First Java Compilation via CLI",
          prompt: "Write a Main.java class with public static void main(String[] args). Compile it via terminal and run javap -v Main to inspect the constant pool.",
        },
      ],
      assessment: { criterion: "Demonstrate successful CLI compilation, execution, and environment reporting.", passingScore: 80 },
      estimatedStudyHours: 8,
      estimatedStudyTime: "1 week (1.5h/day)",
    },
    {
      id: "java_node_2",
      level: 2,
      title: "Syntax, Data Types, Operators & I/O",
      skill: "Java Primitives, Variables & Input/Output",
      category: "Language Syntax",
      concept: "Primitive data types, wrapper classes, memory sizes, arithmetic/bitwise operators, type casting, and standard I/O.",
      state: "AVAILABLE",
      whyLearnThis: "Precise control over data types and explicit casting prevents overflow errors and memory misuse.",
      prerequisites: ["Java Ecosystem & CLI compilation"],
      task: {
        title: "Build a Precision Financial Calculator",
        description: "Implement a program that processes user financial inputs using proper data types, Scanner, and formatted printf output.",
        deliverables: ["FinancialCalculator.java with input validation", "Formatted currency tables using printf", "Demonstration of explicit and implicit type casting"],
      },
      miniProject: {
        title: "Multi-Currency Converter CLI",
        description: "Accept user input, validate numerical bounds, compute currency exchange with interest calculations, and print receipts.",
        techStack: ["Java 21", "java.util.Scanner", "System.out.printf"],
        difficulty: "Beginner",
      },
      learningObjectives: [
        "Distinguish between 8 primitive data types (byte, short, int, long, float, double, char, boolean) and their bit sizes",
        "Perform implicit widening and explicit narrowing type casting safely",
        "Use arithmetic, relational, logical, and bitwise operators",
        "Capture user input with java.util.Scanner and format output with System.out.printf",
      ],
      topicChecklist: [
        { id: "jv_2_1", title: "8 Primitive types, memory footprints, and value ranges", completed: false },
        { id: "jv_2_2", title: "Variable declaration, naming conventions, and scopes", completed: false },
        { id: "jv_2_3", title: "Literal representations (hex, binary, underscore separators)", completed: false },
        { id: "jv_2_4", title: "Implicit widening and explicit narrowing type casting", completed: false },
        { id: "jv_2_5", title: "Arithmetic, relational, logical, ternary, and bitwise operators", completed: false },
        { id: "jv_2_6", title: "Interactive I/O using Scanner and formatted output with System.out.printf", completed: false },
      ],
      practicalExercises: [
        { id: "ex_2_1", title: "Overflow Prevention Exercise", prompt: "Write a program demonstrating integer overflow with Integer.MAX_VALUE and show how casting to long prevents calculation errors." },
      ],
      assessment: { criterion: "Accurate CLI execution with robust input validation and zero casting errors.", passingScore: 80 },
      estimatedStudyHours: 10,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "java_node_3",
      level: 3,
      title: "Control Flow, Loops, Methods & Recursion",
      skill: "Control Structures & Procedural Decomposition",
      category: "Language Syntax",
      concept: "Conditional branching (if/else, switch expressions), iterative loops (for, while, do-while), method signatures, and recursive calls.",
      state: "LOCKED",
      whyLearnThis: "Decomposing problems into reusable, modular methods and efficient control paths forms the bedrock of programming.",
      prerequisites: ["Syntax, Data Types & Operators"],
      task: {
        title: "Algorithm Exploration Suite",
        description: "Create an interactive CLI menu that computes mathematical sequences (Fibonacci, Factorial, GCD) using both iterative and recursive implementations.",
        deliverables: ["Modular methods with clear parameters and return types", "Modern Java switch expressions with arrow syntax (->)", "Iterative vs recursive performance comparison"],
      },
      miniProject: {
        title: "Prime Matrix & Number Theory Engine",
        description: "Generates prime numbers via Sieve of Eratosthenes, determines prime factorizations recursively, and measures execution time.",
        techStack: ["Java 21", "Switch Expressions", "System.nanoTime()"],
        difficulty: "Beginner",
      },
      learningObjectives: [
        "Implement complex branching with if/else-if and modern Java switch expressions",
        "Choose between for, enhanced for-each, while, and do-while loops",
        "Define static methods with pass-by-value semantics, method overloading, and return values",
        "Implement recursive methods with sound base cases and stack safety",
      ],
      topicChecklist: [
        { id: "jv_3_1", title: "if/else-if conditional ladders and boolean logic", completed: false },
        { id: "jv_3_2", title: "Modern switch expressions with arrow syntax (->) and yield", completed: false },
        { id: "jv_3_3", title: "for loops, while loops, and do-while loops with break/continue", completed: false },
        { id: "jv_3_4", title: "Method declaration, parameters, pass-by-value mechanics, and return types", completed: false },
        { id: "jv_3_5", title: "Method overloading and signature resolution", completed: false },
        { id: "jv_3_6", title: "Recursion principles, base cases, and StackOverflowError prevention", completed: false },
      ],
      practicalExercises: [
        { id: "ex_3_1", title: "Recursive Fibonacci with Memoization", prompt: "Implement both naive recursive Fibonacci and memoized array-backed Fibonacci; compare execution times for n=45." },
      ],
      assessment: { criterion: "Correct algorithm outputs, zero infinite recursion, and clean switch expressions.", passingScore: 80 },
      estimatedStudyHours: 12,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "java_node_4",
      level: 4,
      title: "Arrays, Strings, StringBuilder & Common Algorithms",
      skill: "Data Sequences, String Immutability & Search/Sort",
      category: "Data Structures",
      concept: "Fixed-size 1D/2D arrays, String pool and immutability, StringBuilder efficiency, binary search, and in-place sorting.",
      state: "LOCKED",
      whyLearnThis: "Strings and arrays are the most heavily used structures in Java. Understanding String immutability prevents massive memory leaks.",
      prerequisites: ["Control Flow & Methods"],
      task: {
        title: "Build a Text Analytics & Tokenizer Engine",
        description: "Parse large multi-line text input into word arrays, calculate word frequency, sort words alphabetically, and perform binary search.",
        deliverables: ["2D matrix rotation & search algorithm", "StringBuilder benchmark proving O(N) vs O(N^2) string concatenation", "Custom binary search on sorted string arrays"],
      },
      miniProject: {
        title: "Lexical Analyzer & Anagram Detector",
        description: "Processes text documents, computes letter histograms, identifies anagram clusters, and formats reports.",
        techStack: ["Java 21", "java.lang.StringBuilder", "java.util.Arrays"],
        difficulty: "Beginner",
      },
      learningObjectives: [
        "Allocate, initialize, and manipulate 1D and multidimensional arrays",
        "Explain String immutability and the JVM String Constant Pool",
        "Use StringBuilder for high-performance string manipulation in loops",
        "Implement linear search, binary search, and basic sorting algorithms on arrays",
      ],
      topicChecklist: [
        { id: "jv_4_1", title: "1D arrays allocation, indexing, and ArrayIndexOutOfBoundsException safety", completed: false },
        { id: "jv_4_2", title: "Multidimensional and jagged arrays manipulation", completed: false },
        { id: "jv_4_3", title: "String immutability and the String Constant Pool (interning)", completed: false },
        { id: "jv_4_4", title: "String methods: substring, split, replace, indexOf, contains", completed: false },
        { id: "jv_4_5", title: "StringBuilder vs StringBuffer vs String concatenation performance", completed: false },
        { id: "jv_4_6", title: "java.util.Arrays utility: sort, binarySearch, copyOf, equals", completed: false },
      ],
      practicalExercises: [
        { id: "ex_4_1", title: "StringBuilder vs String Concatenation Benchmark", prompt: "Concatenate 50,000 strings using String '+' operator versus StringBuilder.append(). Log the millisecond difference." },
      ],
      assessment: { criterion: "Demonstrate memory-efficient string processing and working binary search.", passingScore: 80 },
      estimatedStudyHours: 12,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "java_node_5",
      level: 5,
      title: "Object-Oriented Foundations: Classes & Objects",
      skill: "Classes, Constructors, Fields & Encapsulation",
      category: "Object-Oriented Programming",
      concept: "State and behavior encapsulation, reference types, constructor overloading, 'this' keyword, access modifiers, and packages.",
      state: "LOCKED",
      whyLearnThis: "Java is an object-oriented language at heart. Proper class design guarantees data integrity and domain modeling clarity.",
      prerequisites: ["Arrays & Strings"],
      task: {
        title: "Develop a Banking Domain Model",
        description: "Create an encapsulated BankAccount domain model with private fields, constructor overloading, validation invariants, and transfer methods.",
        deliverables: ["Package-organized domain classes (com.bank.model)", "Proper getter/setter encapsulation with business rule validation", "Static factory methods and constructor chaining using this()"],
      },
      miniProject: {
        title: "Student Information & Grading System",
        description: "CLI application modeling students, courses, enrollments, and GPA calculations with strict encapsulation.",
        techStack: ["Java 21", "Packages", "Static Initializers", "Constructor Chaining"],
        difficulty: "Intermediate",
      },
      learningObjectives: [
        "Model real-world entities into cohesive Java classes with fields and methods",
        "Differentiate between primitive values and reference types in the heap and stack",
        "Enforce access boundaries using private, package-private, protected, and public modifiers",
        "Implement overloaded constructors, constructor chaining, and static utility methods",
      ],
      topicChecklist: [
        { id: "jv_5_1", title: "Class definition, fields, methods, and instance creation (new operator)", completed: false },
        { id: "jv_5_2", title: "Heap allocation of objects vs stack allocation of references", completed: false },
        { id: "jv_5_3", title: "Constructor definition, overloading, and chaining with this()", completed: false },
        { id: "jv_5_4", title: "Access modifiers: public, protected, package-private, private", completed: false },
        { id: "jv_5_5", title: "static fields, static methods, and static initialization blocks", completed: false },
        { id: "jv_5_6", title: "Package hierarchy, imports, and directory structure matching", completed: false },
      ],
      practicalExercises: [
        { id: "ex_5_1", title: "Encapsulation Enforcement", prompt: "Create a BankAccount class where balance cannot be set directly; withdrawal must check for sufficient funds and throw an error or return a status boolean." },
      ],
      assessment: { criterion: "Clean package layout, private mutable state, and comprehensive unit tests.", passingScore: 85 },
      estimatedStudyHours: 14,
      estimatedStudyTime: "2 weeks",
    },
    {
      id: "java_node_6",
      level: 6,
      title: "Inheritance, Polymorphism, Abstraction & Interfaces",
      skill: "OOP Pillars & Polymorphic Dispatch",
      category: "Object-Oriented Programming",
      concept: "Class hierarchies with 'extends', method overriding, dynamic runtime dispatch, abstract classes, interface contracts, and composition.",
      state: "LOCKED",
      whyLearnThis: "Polymorphism enables open-closed software architecture where new features can be added without altering existing code.",
      prerequisites: ["OOP Foundations"],
      task: {
        title: "Multi-Provider Payment Processing Engine",
        description: "Architect a PaymentGateway interface with implementations for CreditCardGateway, PayPalGateway, and CryptoGateway.",
        deliverables: ["PaymentGateway interface with default and static methods", "Polymorphic payment execution across a collection of gateways", "Demonstration of Composition over Inheritance"],
      },
      miniProject: {
        title: "Vehicle Fleet Management & Rental System",
        description: "Abstract Vehicle base class with Car, Truck, and Motorcycle subclasses; rental rate calculation based on polymorphic dispatch.",
        techStack: ["Java 21", "Interfaces", "Abstract Classes", "Dynamic Dispatch"],
        difficulty: "Intermediate",
      },
      learningObjectives: [
        "Inherit state and behavior using 'extends' and invoke parent constructors with 'super()'",
        "Override methods with @Override and understand runtime dynamic method dispatch",
        "Design abstract classes for template workflows with partial implementation",
        "Define interface contracts with default, static, and private interface methods",
      ],
      topicChecklist: [
        { id: "jv_6_1", title: "Inheritance with 'extends' and constructor delegation with super()", completed: false },
        { id: "jv_6_2", title: "Method overriding vs method overloading rules", completed: false },
        { id: "jv_6_3", title: "Polymorphism, upcasting, downcasting, and instanceof / pattern matching", completed: false },
        { id: "jv_6_4", title: "Abstract classes and abstract methods", completed: false },
        { id: "jv_6_5", title: "Interfaces, multiple interface implementation, and default/static methods", completed: false },
        { id: "jv_6_6", title: "Composition over inheritance principle (has-a vs is-a)", completed: false },
      ],
      practicalExercises: [
        { id: "ex_6_1", title: "Polymorphic Dispatch Matrix", prompt: "Implement a Shape interface with area() and perimeter() methods. Instantiate an array of Circle, Rectangle, and Triangle, computing total area via single loop." },
      ],
      assessment: { criterion: "Successful polymorphic execution with zero unsafe downcasts.", passingScore: 85 },
      estimatedStudyHours: 14,
      estimatedStudyTime: "2 weeks",
    },
    {
      id: "java_node_7",
      level: 7,
      title: "Exception Handling & Defensive Programming",
      skill: "Checked/Unchecked Exceptions & Resource Management",
      category: "Robustness",
      concept: "Throwable hierarchy, try-catch-finally blocks, try-with-resources, custom domain exceptions, and exception propagation.",
      state: "LOCKED",
      whyLearnThis: "Graceful failure handling separates amateur scripts from enterprise-grade production software.",
      prerequisites: ["Inheritance & Interfaces"],
      task: {
        title: "Resilient Config File Parser",
        description: "Parse external configuration files, catching specific I/O and format errors, and wrapping them in custom domain exceptions.",
        deliverables: ["Custom checked (ConfigParseException) and unchecked (InvalidSettingException) classes", "try-with-resources auto-closing AutoCloseable streams", "Multi-catch blocks and re-throwing with stack trace preservation"],
      },
      miniProject: {
        title: "User Registration & Authentication Guard",
        description: "Validates incoming registration data, throwing specific exceptions (DuplicateUserException, WeakPasswordException) with detailed error codes.",
        techStack: ["Java 21", "AutoCloseable", "Custom Exceptions"],
        difficulty: "Intermediate",
      },
      learningObjectives: [
        "Trace the Throwable, Exception, RuntimeException, and Error class hierarchy",
        "Distinguish between checked exceptions (compile-time) and unchecked exceptions (runtime)",
        "Write clean try-catch-finally and modern try-with-resources statements",
        "Create expressive custom domain exceptions that retain causal exceptions",
      ],
      topicChecklist: [
        { id: "jv_7_1", title: "Throwable hierarchy: Error vs Exception vs RuntimeException", completed: false },
        { id: "jv_7_2", title: "Checked exceptions vs Unchecked (runtime) exceptions philosophy", completed: false },
        { id: "jv_7_3", title: "try, catch, finally mechanics and multi-catch syntax", completed: false },
        { id: "jv_7_4", title: "try-with-resources and the AutoCloseable interface", completed: false },
        { id: "jv_7_5", title: "throw vs throws keywords and exception propagation through call stack", completed: false },
        { id: "jv_7_6", title: "Designing custom checked and unchecked exception classes with chained causes", completed: false },
      ],
      practicalExercises: [
        { id: "ex_7_1", title: "AutoCloseable Custom Resource", prompt: "Write a DatabaseConnection class implementing AutoCloseable. Open it in a try-with-resources block and verify that close() runs even if an exception occurs." },
      ],
      assessment: { criterion: "Zero unhandled runtime crashes, proper resource closure in all branches.", passingScore: 85 },
      estimatedStudyHours: 12,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "java_node_8",
      level: 8,
      title: "Java Collections Framework & Generics",
      skill: "Lists, Sets, Maps, Queues & Type Safety",
      category: "Data Structures",
      concept: "Collection interfaces (List, Set, Queue, Deque), Map key-value store, equals/hashCode contracts, generics (<T>), wildcards (? extends / super), and Comparators.",
      state: "LOCKED",
      whyLearnThis: "The Collections framework is used in virtually every line of Java business logic. Mastering it is critical for interview and workplace success.",
      prerequisites: ["OOP Pillars & Exceptions"],
      task: {
        title: "Generic In-Memory Repository & Query Engine",
        description: "Build a generic Repository<T, ID> supporting CRUD operations, custom sorting with Comparator, and filtering with Set deduplication.",
        deliverables: ["Generic interface Repository<T, ID> with type-safe operations", "HashMap and ArrayList backed implementations", "Proper equals() and hashCode() override on domain objects"],
      },
      miniProject: {
        title: "Hospital ER Patient Triage Queue",
        description: "PriorityQueue-backed patient waiting list based on urgency triage scores and arrival timestamps.",
        techStack: ["Java 21", "java.util.Collections", "Generics", "PriorityQueue"],
        difficulty: "Intermediate",
      },
      learningObjectives: [
        "Select the appropriate collection for performance characteristics (ArrayList vs LinkedList, HashSet vs TreeSet, HashMap vs TreeMap)",
        "Enforce type safety with generic classes, methods, and bounded wildcards",
        "Implement the equals() and hashCode() contract to guarantee correct HashSet/HashMap behavior",
        "Sort collections using Comparable natural ordering and flexible custom Comparators",
      ],
      topicChecklist: [
        { id: "jv_8_1", title: "Collections framework overview: Collection vs Map hierarchies", completed: false },
        { id: "jv_8_2", title: "List implementations: ArrayList, LinkedList, and vector differences", completed: false },
        { id: "jv_8_3", title: "Set implementations: HashSet, LinkedHashSet, and TreeSet (SortedSet)", completed: false },
        { id: "jv_8_4", title: "Map implementations: HashMap, LinkedHashMap, and TreeMap", completed: false },
        { id: "jv_8_5", title: "The equals() and hashCode() contract and hashing collisions", completed: false },
        { id: "jv_8_6", title: "Queue & Deque implementations: ArrayDeque, PriorityQueue", completed: false },
        { id: "jv_8_7", title: "Generics: generic types, methods, upper bounds, lower bounds (? super T)", completed: false },
        { id: "jv_8_8", title: "Sorting with Comparable and Comparator (chaining with thenComparing)", completed: false },
      ],
      practicalExercises: [
        { id: "ex_8_1", title: "Broken Hash Contract Debugging", prompt: "Create a Person class that overrides equals() without hashCode(). Add two logically equal instances to a HashSet and demonstrate why size() is 2." },
      ],
      assessment: { criterion: "Demonstrate O(1) lookups, correct equals/hashCode implementation, and generic safety.", passingScore: 85 },
      estimatedStudyHours: 16,
      estimatedStudyTime: "2 weeks",
    },
    {
      id: "java_node_9",
      level: 9,
      title: "File Handling, I/O Streams, NIO.2 & Serialization",
      skill: "Byte Streams, Character Streams & java.nio.file",
      category: "I/O & Persistence",
      concept: "InputStream/OutputStream, Reader/Writer, buffered I/O, modern NIO.2 (Path, Paths, Files), serialization, and resource streaming.",
      state: "LOCKED",
      whyLearnThis: "Modern enterprise systems constantly interact with filesystems, cloud object stores, and byte streams.",
      prerequisites: ["Collections & Exceptions"],
      task: {
        title: "File Log Analyzer & Backup Engine",
        description: "Read large server log files line by line using NIO.2 Files.lines(), filter critical error entries, and write compressed summaries.",
        deliverables: ["NIO.2 Path manipulation with Files.walk() and Files.readAllLines()", "Buffered reading/writing preventing memory exhaustion on large files", "Java Object Serialization & Deserialization with serialVersionUID"],
      },
      miniProject: {
        title: "Recursive Directory Deduplicator CLI",
        description: "Scans a target directory, computes SHA-256 hashes of all files via NIO.2, and reports duplicate files.",
        techStack: ["Java 21", "java.nio.file.Files", "java.nio.file.Path", "MessageDigest"],
        difficulty: "Intermediate",
      },
      learningObjectives: [
        "Contrast byte-oriented streams (FileInputStream) with character-oriented readers (BufferedReader)",
        "Utilize modern NIO.2 (java.nio.file.Path and java.nio.file.Files) for robust filesystem operations",
        "Serialize and deserialize Java objects safely using the Serializable marker interface",
        "Stream file contents without loading entire multi-gigabyte files into memory",
      ],
      topicChecklist: [
        { id: "jv_9_1", title: "Classic I/O: InputStream, OutputStream, Reader, Writer", completed: false },
        { id: "jv_9_2", title: "Buffered streams for high-throughput I/O (BufferedReader / BufferedWriter)", completed: false },
        { id: "jv_9_3", title: "Modern NIO.2: Path, Paths, and Files utility methods", completed: false },
        { id: "jv_9_4", title: "Directory traversal with Files.walk(), Files.find(), and Files.lines()", completed: false },
        { id: "jv_9_5", title: "Java Object Serialization, transient fields, and serialVersionUID", completed: false },
        { id: "jv_9_6", title: "NIO FileChannel and memory-mapped files introduction", completed: false },
      ],
      practicalExercises: [
        { id: "ex_9_1", title: "Stream-Based Log Filtering", prompt: "Use Files.lines(Path) to process a simulated 500,000 line log file, filtering lines containing 'ERROR' without exceeding 64MB of heap memory." },
      ],
      assessment: { criterion: "Safe file I/O with auto-closing streams and zero file handle leaks.", passingScore: 85 },
      estimatedStudyHours: 14,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "java_node_10",
      level: 10,
      title: "Functional Programming, Lambdas & Stream API",
      skill: "Functional Interfaces, Streams, Optional & Method References",
      category: "Modern Java",
      concept: "Lambda expressions, built-in functional interfaces (Predicate, Function, Consumer, Supplier), Stream pipelines, Collectors, and Optional.",
      state: "LOCKED",
      whyLearnThis: "Declarative functional programming dramatically reduces boilerplate and forms the foundation of modern Java development.",
      prerequisites: ["Collections & Generics"],
      task: {
        title: "Enterprise E-Commerce Sales Analytics Pipeline",
        description: "Process thousands of order records using Java Stream pipelines to compute sales by category, average order value, and top customers.",
        deliverables: ["Stream filter, map, flatMap, reduce, and collect operations", "Complex groupings using Collectors.groupingBy and partitioningBy", "Clean Optional handling replacing null pointer checks"],
      },
      miniProject: {
        title: "Employee Compensation & Department Analyzer",
        description: "Loads CSV data, maps into immutable domain records, and executes multi-level aggregations via Streams.",
        techStack: ["Java 21", "java.util.stream.Stream", "Collectors", "Optional"],
        difficulty: "Intermediate",
      },
      learningObjectives: [
        "Write concise lambda expressions and method references (Class::method)",
        "Leverage java.util.function interfaces (Predicate, Function, Consumer, Supplier, BiFunction)",
        "Construct intermediate and terminal Stream pipelines (filter, map, flatMap, sorted, reduce)",
        "Eliminate NullPointerException using java.util.Optional idiomatic methods",
      ],
      topicChecklist: [
        { id: "jv_10_1", title: "Lambda expression syntax and SAM (Single Abstract Method) interfaces", completed: false },
        { id: "jv_10_2", title: "Core functional interfaces: Predicate, Function, Consumer, Supplier", completed: false },
        { id: "jv_10_3", title: "Four types of Method References (static, instance, arbitrary, constructor)", completed: false },
        { id: "jv_10_4", title: "Stream creation, intermediate operations (filter, map, distinct, sorted, flatMap)", completed: false },
        { id: "jv_10_5", title: "Stream terminal operations (collect, reduce, count, forEach, findFirst)", completed: false },
        { id: "jv_10_6", title: "Advanced Collectors: groupingBy, partitioningBy, summarizingInt, joining", completed: false },
        { id: "jv_10_7", title: "java.util.Optional: map, flatMap, orElse, orElseGet, orElseThrow", completed: false },
      ],
      practicalExercises: [
        { id: "ex_10_1", title: "Multi-Level Stream Grouping", prompt: "Given a list of Transactions, group them by currency, then within each currency find the maximum transaction using Collectors.groupingBy and Collectors.maxBy." },
      ],
      assessment: { criterion: "Idiomatic Stream pipelines without mutation or side effects.", passingScore: 85 },
      estimatedStudyHours: 16,
      estimatedStudyTime: "2 weeks",
    },
    {
      id: "java_node_11",
      level: 11,
      title: "Modern Java Features: Records, Sealed Classes & Date/Time",
      skill: "Java 17-21 Modern Enhancements",
      category: "Modern Java",
      concept: "Records for immutable data carriers, sealed classes/interfaces, pattern matching for instanceof and switch, text blocks, and java.time API.",
      state: "LOCKED",
      whyLearnThis: "Modern Java (17-21) has transformed the language, removing verbosity and introducing compiler-enforced domain modeling.",
      prerequisites: ["OOP & Functional Java"],
      task: {
        title: "Domain Event Notification Engine",
        description: "Implement a sealed domain event hierarchy (UserCreatedEvent, PaymentProcessedEvent) dispatched using Pattern Matching for switch.",
        deliverables: ["Sealed interface DomainEvent with permitted record implementations", "Pattern matching switch statement with exhaustive coverage", "Date and time calculations using java.time.Instant, ZonedDateTime, and Duration"],
      },
      miniProject: {
        title: "Global Flight Booking & Timezone Scheduler",
        description: "Calculates flight departure/arrival across international timezones, daylight saving boundaries, and transit layovers.",
        techStack: ["Java 21", "Records", "Sealed Classes", "java.time"],
        difficulty: "Intermediate",
      },
      learningObjectives: [
        "Declare compact immutable data structures using Java records with compact constructors",
        "Restrict inheritance using sealed classes and interfaces (permits clause)",
        "Apply pattern matching for switch to deconstruct records cleanly",
        "Handle dates, durations, intervals, and timezones with the modern java.time package",
      ],
      topicChecklist: [
        { id: "jv_11_1", title: "Java Records: components, auto-generated methods, compact constructors", completed: false },
        { id: "jv_11_2", title: "Sealed classes and interfaces: sealed, non-sealed, final, and permits", completed: false },
        { id: "jv_11_3", title: "Pattern matching for instanceof and record deconstruction patterns", completed: false },
        { id: "jv_11_4", title: "Pattern matching for switch with guarded patterns (when clause)", completed: false },
        { id: "jv_11_5", title: "Text blocks (multi-line strings) with stripIndent() and formatted()", completed: false },
        { id: "jv_11_6", title: "java.time API: LocalDate, LocalTime, LocalDateTime, ZonedDateTime, Instant, Duration", completed: false },
      ],
      practicalExercises: [
        { id: "ex_11_1", title: "Exhaustive Sealed Switch", prompt: "Define a sealed interface Result<T> permitted to be Success<T>(T data) or Failure<T>(String error). Write a switch expression that handles both without a default clause." },
      ],
      assessment: { criterion: "Clean domain model utilizing records and exhaustive compiler checks.", passingScore: 85 },
      estimatedStudyHours: 12,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "java_node_12",
      level: 12,
      title: "Multithreading, Concurrency Utilities & Virtual Threads",
      skill: "Threads, Synchronization, Executors & Virtual Threads",
      category: "Advanced Concurrency",
      concept: "Thread lifecycle, synchronized blocks, volatile keyword, locks, thread pools (ExecutorService), CompletableFuture async pipelines, and Java 21 Virtual Threads.",
      state: "LOCKED",
      whyLearnThis: "Concurrency is what enables high-throughput backend servers handling millions of simultaneous user requests.",
      prerequisites: ["OOP & Functional Programming"],
      task: {
        title: "High-Throughput Concurrent Web Scraper",
        description: "Fetch web resources concurrently across thousands of virtual threads, using CompletableFuture to join results and AtomicInteger for metrics.",
        deliverables: ["ExecutorService and Java 21 Executors.newVirtualThreadPerTaskExecutor()", "Thread-safe shared state using ConcurrentHashMap and AtomicLong", "CompletableFuture async composition with allOf and thenApply"],
      },
      miniProject: {
        title: "Asynchronous Order Processing Queue",
        description: "Simulates an order checkout pipeline where inventory checks, payment charging, and email receipts run concurrently.",
        techStack: ["Java 21", "Virtual Threads", "CompletableFuture", "ReentrantLock"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Explain race conditions, deadlocks, and thread visibility issues",
        "Synchronize shared state with synchronized, volatile, and java.util.concurrent.locks",
        "Manage thread lifecycles using ExecutorService thread pools",
        "Compose asynchronous pipelines using CompletableFuture",
        "Leverage Java 21 Virtual Threads (Project Loom) for high-scale I/O bound tasks",
      ],
      topicChecklist: [
        { id: "jv_12_1", title: "Thread creation (Thread class, Runnable interface) and thread lifecycle states", completed: false },
        { id: "jv_12_2", title: "Race conditions, critical sections, and synchronized methods/blocks", completed: false },
        { id: "jv_12_3", title: "Memory visibility, CPU caches, and the volatile keyword", completed: false },
        { id: "jv_12_4", title: "java.util.concurrent: AtomicInteger, ConcurrentHashMap, BlockingQueue", completed: false },
        { id: "jv_12_5", title: "ExecutorService, Callable<T>, Future<T>, and ThreadPoolExecutors", completed: false },
        { id: "jv_12_6", title: "Asynchronous programming with CompletableFuture (supplyAsync, thenCompose, allOf)", completed: false },
        { id: "jv_12_7", title: "Java 21 Virtual Threads vs Platform (OS) Threads architecture", completed: false },
      ],
      practicalExercises: [
        { id: "ex_12_1", title: "10,000 Virtual Threads Benchmark", prompt: "Spawn 10,000 platform threads sleeping 100ms and observe system memory; repeat with Virtual Threads to demonstrate low overhead." },
      ],
      assessment: { criterion: "Zero deadlocks, zero race conditions, verified thread safety.", passingScore: 85 },
      estimatedStudyHours: 18,
      estimatedStudyTime: "2.5 weeks",
    },
    {
      id: "java_node_13",
      level: 13,
      title: "JVM Architecture, Memory Management & GC Tuning",
      skill: "JVM Internals, ClassLoaders, Memory Areas & Garbage Collectors",
      category: "JVM Internals",
      concept: "Class loading stages, JVM memory structure (Heap, Stack, Metaspace), garbage collection algorithms (G1, ZGC), JIT compilation, and memory profiling.",
      state: "LOCKED",
      whyLearnThis: "Deep knowledge of JVM internals enables diagnosing OutOfMemoryErrors, tuning garbage collection, and writing high-performance code.",
      prerequisites: ["Multithreading & Concurrency"],
      task: {
        title: "Memory Leak Reproduction & Profiling Lab",
        description: "Create an intentional static collection memory leak, generate a heap dump with jcmd, and inspect object retention using a profiler.",
        deliverables: ["Heap dump (.hprof) generation and inspection report", "JVM flags configuration (-Xms, -Xmx, -XX:+UseZGC)", "Comparison of G1GC vs ZGC throughput and pause times"],
      },
      miniProject: {
        title: "Class Loading Diagnostic Utility",
        description: "Inspects class loader hierarchy (Bootstrap, Platform, App) and dynamically loads classes at runtime using URLClassLoader.",
        techStack: ["Java 21", "VisualVM", "jcmd", "jstack", "jmap"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Diagram JVM runtime data areas: Heap, JVM Stacks, Metaspace, PC Registers, and Native Stacks",
        "Explain the class loading process (Loading, Linking, Initialization) and delegation model",
        "Compare modern Garbage Collectors: G1GC, ParallelGC, and ultra-low-latency ZGC",
        "Diagnose memory leaks and CPU spikes using CLI diagnostic tools (jcmd, jstack, jmap)",
      ],
      topicChecklist: [
        { id: "jv_13_1", title: "JVM Architecture overview and specification vs implementation", completed: false },
        { id: "jv_13_2", title: "Class Loading mechanism: Bootstrap, Platform, Application ClassLoaders", completed: false },
        { id: "jv_13_3", title: "JVM Memory Structure: Heap (Young/Old Generations), Stack frames, Metaspace", completed: false },
        { id: "jv_13_4", title: "Garbage Collection fundamentals: Mark-Sweep-Compact, stop-the-world pauses", completed: false },
        { id: "jv_13_5", title: "Modern GC Algorithms: G1GC vs ZGC vs Shenandoah", completed: false },
        { id: "jv_13_6", title: "JIT Compiler (Tiered Compilation, C1/C2, Escape Analysis, Inlining)", completed: false },
        { id: "jv_13_7", title: "Troubleshooting: OutOfMemoryError, StackOverflowError, jcmd, jstack, jmap", completed: false },
      ],
      practicalExercises: [
        { id: "ex_13_1", title: "Trigger and Analyze OutOfMemoryError", prompt: "Write code that fills heap memory to trigger java.lang.OutOfMemoryError: Java heap space. Run with -XX:+HeapDumpOnOutOfMemoryError and inspect." },
      ],
      assessment: { criterion: "Accurate diagnosis of memory retention paths and correct GC parameter usage.", passingScore: 85 },
      estimatedStudyHours: 16,
      estimatedStudyTime: "2 weeks",
    },
    {
      id: "java_node_14",
      level: 14,
      title: "Data Structures & Algorithms Using Java",
      skill: "Custom Trees, Graphs, Sorting & Complexity Analysis",
      category: "Computer Science",
      concept: "Implementing fundamental data structures from scratch in Java, Big-O time and space complexity, dynamic programming, and graph traversals.",
      state: "LOCKED",
      whyLearnThis: "DSA mastery is critical for passing top-tier technical interviews and selecting optimal data representations.",
      prerequisites: ["Generics & Collections"],
      task: {
        title: "Implement a Custom Generic Binary Search Tree & Trie",
        description: "Implement a generic BinarySearchTree<T> with in-order traversal, insertion, deletion, and an Autocomplete Trie.",
        deliverables: ["BST with O(log N) average search and rebalancing", "Prefix Autocomplete Trie with frequency tracking", "Rigorous Big-O time and space complexity analysis for every method"],
      },
      miniProject: {
        title: "Shortest Path Routing Engine (Dijkstra's Algorithm)",
        description: "Models a road network as an adjacency list graph and computes optimal routes using Dijkstra's algorithm.",
        techStack: ["Java 21", "Generics", "Graph Algorithms", "PriorityQueue"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Analyze algorithm complexity using Big-O notation for time and space",
        "Implement linked data structures (LinkedList, BST, Trie, Graph) from scratch",
        "Apply Depth-First Search (DFS) and Breadth-First Search (BFS)",
        "Solve algorithmic interview problems using two-pointer, sliding window, and memoization techniques",
      ],
      topicChecklist: [
        { id: "jv_14_1", title: "Big-O Time and Space complexity analysis", completed: false },
        { id: "jv_14_2", title: "Custom Singly and Doubly Linked List implementation", completed: false },
        { id: "jv_14_3", title: "Custom Stack and Queue implementation using arrays and nodes", completed: false },
        { id: "jv_14_4", title: "Binary Search Tree: insertion, deletion, search, traversals", completed: false },
        { id: "jv_14_5", title: "Graph representations: Adjacency Matrix vs Adjacency List", completed: false },
        { id: "jv_14_6", title: "Graph traversals: BFS, DFS, and Dijkstra's Shortest Path", completed: false },
        { id: "jv_14_7", title: "Algorithm paradigms: Divide & Conquer, Greedy, Dynamic Programming", completed: false },
      ],
      practicalExercises: [
        { id: "ex_14_1", title: "Invert a Binary Tree in Java", prompt: "Implement TreeNode<T> and write a recursive method to invert a binary tree; test with multiple depth levels." },
      ],
      assessment: { criterion: "Bug-free custom data structures with passing unit test suites.", passingScore: 85 },
      estimatedStudyHours: 20,
      estimatedStudyTime: "2.5 weeks",
    },
    {
      id: "java_node_15",
      level: 15,
      title: "JDBC, Relational Databases & Connection Pooling",
      skill: "SQL Integration, Transactions & HikariCP",
      category: "Persistence",
      concept: "Connecting to PostgreSQL/MySQL via JDBC, PreparedStatement SQL injection protection, transaction management (commit/rollback), and connection pooling with HikariCP.",
      state: "LOCKED",
      whyLearnThis: "Relational persistence is the core of backend enterprise engineering. JDBC forms the foundation beneath Hibernate and Spring Data.",
      prerequisites: ["Collections & Exceptions"],
      task: {
        title: "Production JDBC Data Access Layer (DAO)",
        description: "Create a database layer executing ACID transactions across multiple tables with connection pooling and rollback safety.",
        deliverables: ["HikariCP DataSource configuration", "PreparedStatement parameterized queries preventing SQL injection", "Multi-table transaction with setAutoCommit(false), commit(), and rollback()"],
      },
      miniProject: {
        title: "Bank Account Fund Transfer Service",
        description: "Transfers funds between accounts inside an ACID database transaction; tests rollbacks on simulated mid-flight server errors.",
        techStack: ["Java 21", "PostgreSQL / H2", "JDBC", "HikariCP"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Establish database connections using modern JDBC Driver Manager and DataSources",
        "Prevent SQL injection vulnerabilities by exclusively using PreparedStatement",
        "Manage database transactions manually with commit and rollback semantics",
        "Configure and monitor connection pooling using HikariCP for high concurrency",
      ],
      topicChecklist: [
        { id: "jv_15_1", title: "JDBC Architecture: Driver, DriverManager, Connection, Statement", completed: false },
        { id: "jv_15_2", title: "Statement vs PreparedStatement and SQL injection prevention", completed: false },
        { id: "jv_15_3", title: "ResultSet traversal, data extraction, and type mapping", completed: false },
        { id: "jv_15_4", title: "Database transactions: ACID properties, setAutoCommit(false), commit(), rollback()", completed: false },
        { id: "jv_15_5", title: "Batch execution (addBatch(), executeBatch()) for high performance", completed: false },
        { id: "jv_15_6", title: "Connection pooling fundamentals and HikariCP integration", completed: false },
      ],
      practicalExercises: [
        { id: "ex_15_1", title: "Simulated Transfer with Rollback", prompt: "Write a fund transfer method debiting Account A and crediting Account B. Throw an exception after debit and verify that rollback() leaves Account A balance intact." },
      ],
      assessment: { criterion: "Zero SQL injection vulnerabilities, proper connection pooling, and atomic transactions.", passingScore: 90 },
      estimatedStudyHours: 14,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "java_node_16",
      level: 16,
      title: "Networking, Sockets, HTTP Client & JSON Parsing",
      skill: "TCP Sockets, HTTP/2 Client & Jackson Mapping",
      category: "Networking & APIs",
      concept: "Socket programming, java.net.http.HttpClient, consuming RESTful APIs, JSON serialization and deserialization with Jackson, and async request handling.",
      state: "LOCKED",
      whyLearnThis: "Modern applications are distributed systems that constantly talk across networks and consume third-party HTTP/JSON APIs.",
      prerequisites: ["Multithreading & I/O"],
      task: {
        title: "Asynchronous Financial Market Aggregator",
        description: "Call multiple external REST endpoints concurrently using HttpClient.sendAsync(), parse JSON responses into Java records with Jackson, and aggregate data.",
        deliverables: ["java.net.http.HttpClient with HTTP/2 and timeouts", "Jackson ObjectMapper configuring custom date serializers and naming strategies", "Asynchronous CompletableFuture joining multiple API calls"],
      },
      miniProject: {
        title: "Multi-Client TCP Chat Server",
        description: "Multi-threaded socket server (ServerSocket) that broadcasts messages between connected client sockets.",
        techStack: ["Java 21", "java.net.http.HttpClient", "Jackson", "TCP Sockets"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Explain low-level networking primitives (TCP/IP, Sockets, Port binding)",
        "Send synchronous and asynchronous GET/POST requests using java.net.http.HttpClient",
        "Serialize Java objects to JSON and deserialize JSON to Java records using Jackson",
        "Handle HTTP status codes, headers, authentication tokens, and request timeouts",
      ],
      topicChecklist: [
        { id: "jv_16_1", title: "TCP Socket programming: ServerSocket and Socket communication", completed: false },
        { id: "jv_16_2", title: "HTTP protocol fundamentals (methods, status codes, headers, body)", completed: false },
        { id: "jv_16_3", title: "Modern java.net.http.HttpClient, HttpRequest, and HttpResponse", completed: false },
        { id: "jv_16_4", title: "Synchronous vs asynchronous HTTP requests with CompletableFuture", completed: false },
        { id: "jv_16_5", title: "JSON processing with Jackson: ObjectMapper, @JsonProperty, annotations", completed: false },
        { id: "jv_16_6", title: "Error handling: timeouts, retries, and HTTP error status codes", completed: false },
      ],
      practicalExercises: [
        { id: "ex_16_1", title: "Async HTTP Fetch with Jackson", prompt: "Fetch public GitHub API user details asynchronously using HttpClient.sendAsync() and deserialize into a GitHubUser record." },
      ],
      assessment: { criterion: "Clean async HTTP client, zero unhandled network timeouts, and verified JSON mapping.", passingScore: 85 },
      estimatedStudyHours: 14,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "java_node_17",
      level: 17,
      title: "Automated Testing: JUnit 5, Mockito & Code Quality",
      skill: "Unit Testing, Mocking, TDD & AssertJ",
      category: "Software Quality",
      concept: "Unit testing with JUnit 5, assertions with AssertJ, mocking dependencies with Mockito, test lifecycle, parameterized tests, and Test-Driven Development (TDD).",
      state: "LOCKED",
      whyLearnThis: "A software engineer who cannot write automated tests cannot deliver production software. TDD guarantees bug-free refactoring.",
      prerequisites: ["OOP & Collections"],
      task: {
        title: "Comprehensive Test Suite for Banking Service",
        description: "Write unit and integration tests achieving 90%+ code coverage for a banking transfer service, using Mockito to mock repository dependencies.",
        deliverables: ["JUnit 5 lifecycle annotations (@BeforeEach, @Test, @ParameterizedTest)", "Mockito stubs (@Mock, when(...).thenReturn(...), verify(...))", "Fluent assertions using AssertJ (assertThat(...))"],
      },
      miniProject: {
        title: "TDD String Calculator Kata",
        description: "Implement a String Calculator entirely using Test-Driven Development (Red-Green-Refactor cycle).",
        techStack: ["Java 21", "JUnit 5 (Jupiter)", "Mockito", "AssertJ"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Structure clean test cases using the Arrange-Act-Assert (AAA) pattern",
        "Execute parameterized tests across diverse test data sets in JUnit 5",
        "Isolate business logic from external systems using Mockito mocks and spies",
        "Apply Test-Driven Development (Red-Green-Refactor) to write verified code",
      ],
      topicChecklist: [
        { id: "jv_17_1", title: "Testing fundamentals: Unit vs Integration vs End-to-End tests", completed: false },
        { id: "jv_17_2", title: "JUnit 5 Jupiter architecture and test lifecycle (@BeforeEach, @AfterEach)", completed: false },
        { id: "jv_17_3", title: "Assertions: standard JUnit assertions vs fluent AssertJ (assertThat)", completed: false },
        { id: "jv_17_4", title: "Parameterized tests with @ValueSource, @CsvSource, @MethodSource", completed: false },
        { id: "jv_17_5", title: "Mocking with Mockito: @Mock, @InjectMocks, when().thenReturn(), verify()", completed: false },
        { id: "jv_17_6", title: "Capturing method arguments using ArgumentCaptor", completed: false },
        { id: "jv_17_7", title: "Test-Driven Development (TDD) workflow and code coverage analysis", completed: false },
      ],
      practicalExercises: [
        { id: "ex_17_1", title: "Mockito Verification Exercise", prompt: "Mock an EmailService inside an OrderService. Verify that emailService.sendReceipt() was called exactly once with the correct recipient email." },
      ],
      assessment: { criterion: "90%+ line and branch test coverage with comprehensive Mockito verifications.", passingScore: 90 },
      estimatedStudyHours: 14,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "java_node_18",
      level: 18,
      title: "Build Tools: Maven, Gradle, Dependency Management & Git",
      skill: "Project Lifecycle, Multi-Module Builds & CI/CD",
      category: "Tooling & DevOps",
      concept: "Maven POM structure, build lifecycles, Gradle Groovy/Kotlin DSL, transitive dependency resolution, semantic versioning, Git branching, and GitHub Actions CI.",
      state: "LOCKED",
      whyLearnThis: "Modern Java projects are managed through Maven or Gradle build files that bundle dependencies and automate CI/CD deployments.",
      prerequisites: ["JUnit 5 & CLI basics"],
      task: {
        title: "Multi-Module Maven Build & GitHub Actions CI",
        description: "Set up a multi-module Maven project (core, api, service) with shared parent pom, dependency management, and automated GitHub Actions CI.",
        deliverables: ["Parent pom.xml with <dependencyManagement> and plugins", "Multi-module project compilation and packaging (mvn clean verify)", ".github/workflows/ci.yml running builds and unit tests on pull requests"],
      },
      miniProject: {
        title: "Automated Release & Artifact Packaging",
        description: "Packages an executable JAR with dependencies using maven-shade-plugin / maven-assembly-plugin.",
        techStack: ["Java 21", "Apache Maven", "Gradle", "Git", "GitHub Actions"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Explain the standard Maven directory layout and build lifecycle phases (compile, test, package, install)",
        "Manage dependencies, scopes (compile, test, provided, runtime), and resolve version conflicts",
        "Structure scalable multi-module Maven and Gradle enterprise projects",
        "Write CI/CD pipeline definitions that compile code, execute tests, and fail on regressions",
      ],
      topicChecklist: [
        { id: "jv_18_1", title: "Maven project structure and Project Object Model (pom.xml)", completed: false },
        { id: "jv_18_2", title: "Maven lifecycle: validate, compile, test, package, verify, install, deploy", completed: false },
        { id: "jv_18_3", title: "Dependency management: scopes (compile, test, provided), transitive dependencies", completed: false },
        { id: "jv_18_4", title: "Multi-module Maven projects with parent POMs", completed: false },
        { id: "jv_18_5", title: "Gradle fundamentals: build.gradle, tasks, and dependency configuration", completed: false },
        { id: "jv_18_6", title: "Continuous Integration with GitHub Actions for automated testing", completed: false },
      ],
      practicalExercises: [
        { id: "ex_18_1", title: "Fix Transitive Dependency Conflict", prompt: "Use 'mvn dependency:tree' to diagnose conflicting transitive versions of a library and use <exclusions> to resolve it." },
      ],
      assessment: { criterion: "Clean multi-module Maven compilation with passing CI build workflow.", passingScore: 85 },
      estimatedStudyHours: 12,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "java_node_19",
      level: 19,
      title: "Secure Coding in Java & OWASP Protection",
      skill: "Input Sanitization, Cryptography & Security Defenses",
      category: "Security",
      concept: "Mitigating OWASP Top 10 vulnerabilities in Java: SQL injection, XSS, insecure deserialization, password hashing with Argon2/BCrypt, and cryptographic ciphers.",
      state: "LOCKED",
      whyLearnThis: "Security is non-negotiable. Building applications that resist malicious exploitation protects user data and enterprise infrastructure.",
      prerequisites: ["JDBC & Web Networking"],
      task: {
        title: "Hardened Security Utility & Password Vault",
        description: "Implement secure password hashing using BCrypt, AES-GCM-256 data encryption for sensitive records, and strict input validation.",
        deliverables: ["AES-GCM encryption/decryption utility using java.security and javax.crypto", "BCrypt/Argon2 password hashing with salt and work factor", "Input sanitization and defense against deserialization attacks"],
      },
      miniProject: {
        title: "Secure JWT Token Authenticator",
        description: "Generates, signs, and validates HMAC-SHA256 and RSA JWT tokens with expiration verification.",
        techStack: ["Java 21", "javax.crypto", "BCrypt", "JWT"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Identify and prevent OWASP Top 10 vulnerabilities in Java codebases",
        "Hash passwords securely using salted work-factor algorithms (BCrypt, Argon2)",
        "Encrypt sensitive database fields using AES-256 with GCM authenticated mode",
        "Prevent deserialization vulnerabilities by using safe object schemas or Jackson allow-lists",
      ],
      topicChecklist: [
        { id: "jv_19_1", title: "OWASP Top 10 vulnerabilities relevant to Java applications", completed: false },
        { id: "jv_19_2", title: "SQL Injection and Path Traversal vulnerability mitigations", completed: false },
        { id: "jv_19_3", title: "Java Cryptography Architecture (JCA): MessageDigest, SecureRandom", completed: false },
        { id: "jv_19_4", title: "Symmetric encryption with AES-256-GCM and initialization vectors (IV)", completed: false },
        { id: "jv_19_5", title: "Password security: Salted hashing with BCrypt and Argon2 vs weak SHA-256", completed: false },
        { id: "jv_19_6", title: "Insecure Java deserialization risks and serialization filtering", completed: false },
      ],
      practicalExercises: [
        { id: "ex_19_1", title: "AES-256 Encryption Roundtrip", prompt: "Write an AESGCMCipher class that encrypts a secret string with a 256-bit key and random 12-byte IV, returning Base64; decrypt and assert equality." },
      ],
      assessment: { criterion: "Zero plain-text password storage, verified cryptographic signatures, robust sanitization.", passingScore: 90 },
      estimatedStudyHours: 14,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "java_node_20",
      level: 20,
      title: "Java Backend Foundations: Spring & Spring Boot",
      skill: "Inversion of Control, Dependency Injection & Spring Core",
      category: "Enterprise Frameworks",
      concept: "Spring Framework architecture, Inversion of Control (IoC), Dependency Injection (@Component, @Autowired), Bean lifecycles, and Spring Boot auto-configuration.",
      state: "LOCKED",
      whyLearnThis: "Spring Boot is the dominant enterprise Java backend framework globally, powering modern corporate services and microservices.",
      prerequisites: ["OOP, Maven & Testing"],
      task: {
        title: "Spring Boot Microservice Core Setup",
        description: "Bootstrap a production-ready Spring Boot application using Spring Initializr, custom configuration properties, and constructor injection.",
        deliverables: ["Spring Boot project with proper @SpringBootApplication structure", "Constructor injection on services and repositories (no field injection)", "Externalized configuration with application.yml and @ConfigurationProperties"],
      },
      miniProject: {
        title: "Notification Dispatch Service with Spring Profiles",
        description: "Dispatches SMS or Email notifications based on active Spring profiles ('dev', 'prod') using Spring Bean polymorphism.",
        techStack: ["Java 21", "Spring Boot 3+", "Spring Core", "Lombok"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Explain Inversion of Control (IoC) and how the Spring ApplicationContext manages objects",
        "Apply Constructor-based Dependency Injection over deprecated field injection",
        "Configure Spring Beans, scopes (singleton, prototype), and lifecycle hooks (@PostConstruct)",
        "Understand Spring Boot auto-configuration, starter POMs, and profile switching",
      ],
      topicChecklist: [
        { id: "jv_20_1", title: "Spring Core architecture: IoC container and BeanFactory vs ApplicationContext", completed: false },
        { id: "jv_20_2", title: "Stereotype annotations: @Component, @Service, @Repository, @Controller", completed: false },
        { id: "jv_20_3", title: "Dependency Injection techniques: Constructor vs Setter vs Field injection", completed: false },
        { id: "jv_20_4", title: "Bean scopes (Singleton, Prototype) and Bean lifecycle methods", completed: false },
        { id: "jv_20_5", title: "Spring Boot magic: @SpringBootApplication, auto-configuration, Starter dependencies", completed: false },
        { id: "jv_20_6", title: "Externalized configuration: application.properties / application.yml and Profiles", completed: false },
      ],
      practicalExercises: [
        { id: "ex_20_1", title: "Profile-Based Bean Selection", prompt: "Create a PaymentService interface with FakePaymentService (@Profile('test')) and StripePaymentService (@Profile('prod')). Verify active injection per profile." },
      ],
      assessment: { criterion: "Clean Spring Boot application with constructor injection and zero startup errors.", passingScore: 85 },
      estimatedStudyHours: 16,
      estimatedStudyTime: "2 weeks",
    },
    {
      id: "java_node_21",
      level: 21,
      title: "Spring Boot REST APIs & Persistence (Data JPA)",
      skill: "REST Controllers, DTOs, Spring Data JPA & Validation",
      category: "Enterprise Frameworks",
      concept: "Spring MVC REST controllers (@RestController, @GetMapping, @PostMapping), DTO patterns, Jakarta Validation, Spring Data JPA, and global exception handling.",
      state: "LOCKED",
      whyLearnThis: "Building robust REST APIs that validate incoming payloads and interact with relational databases is the core responsibility of backend developers.",
      prerequisites: ["Spring Core & JDBC"],
      task: {
        title: "Production CRUD REST API with JPA Persistence",
        description: "Build a complete RESTful API for a Product Catalog with pagination, sorting, DTO validation, and global @RestControllerAdvice error handling.",
        deliverables: ["RestController with standardized HTTP status codes (200, 201, 204, 400, 404)", "Spring Data JPA Repository with derived query methods and JPQL", "Global exception handler returning RFC-7807 Problem Details"],
      },
      miniProject: {
        title: "Blog & Commenting API with Entity Relationships",
        description: "Models Post and Comment entities with @OneToMany and @ManyToOne JPA relationships and DTO mapping.",
        techStack: ["Java 21", "Spring Boot 3", "Spring Data JPA", "Hibernate", "Jakarta Validation"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Develop RESTful endpoints following standard HTTP methods, status codes, and URI conventions",
        "Validate incoming request payloads using Jakarta Validation (@NotNull, @Size, @Email)",
        "Map relational tables to Java classes using Hibernate and JPA entity annotations (@Entity, @Table, @Id)",
        "Query databases cleanly using Spring Data JpaRepository interfaces and custom JPQL queries",
      ],
      topicChecklist: [
        { id: "jv_21_1", title: "RESTful principles: Resources, URIs, HTTP verbs, and HTTP status codes", completed: false },
        { id: "jv_21_2", title: "Spring MVC: @RestController, @RequestMapping, @PathVariable, @RequestParam, @RequestBody", completed: false },
        { id: "jv_21_3", title: "DTO (Data Transfer Object) pattern vs Entity exposure and mapping", completed: false },
        { id: "jv_21_4", title: "Request validation with Jakarta Validation (@Valid, @NotBlank, @Min, @Max)", completed: false },
        { id: "jv_21_5", title: "Global error handling with @ControllerAdvice and @ExceptionHandler", completed: false },
        { id: "jv_21_6", title: "Spring Data JPA: JpaRepository, derived query methods, @Query with JPQL", completed: false },
        { id: "jv_21_7", title: "JPA entity relationships: @OneToMany, @ManyToOne, and N+1 query problem awareness", completed: false },
      ],
      practicalExercises: [
        { id: "ex_21_1", title: "Global Error Handler for Validation Failures", prompt: "Create a @RestControllerAdvice method capturing MethodArgumentNotValidException and returning a clean JSON map of field names to error messages." },
      ],
      assessment: { criterion: "Clean RESTful contracts, validated payloads, and optimal JPA queries.", passingScore: 90 },
      estimatedStudyHours: 18,
      estimatedStudyTime: "2.5 weeks",
    },
    {
      id: "java_node_22",
      level: 22,
      title: "Design Patterns, SOLID Principles & Clean Architecture",
      skill: "SOLID, GoF Patterns & Clean Hexagonal Design",
      category: "Software Architecture",
      concept: "SOLID principles in Java, classic GoF design patterns (Factory, Builder, Singleton, Strategy, Observer, Decorator), and Clean / Hexagonal Architecture.",
      state: "LOCKED",
      whyLearnThis: "Great software is designed for maintainability and evolution. Design patterns provide proven, shared vocabularies for solving architectural challenges.",
      prerequisites: ["OOP & Spring REST"],
      task: {
        title: "Clean Architecture Order Fulfillment Domain",
        description: "Restructure an order processing system into Hexagonal architecture, isolating domain logic from external frameworks, databases, and HTTP controllers.",
        deliverables: ["Domain layer with zero external framework dependencies", "Application ports and adapters (Hexagonal Architecture)", "GoF patterns: Strategy pattern for tax calculation, Builder for immutable orders"],
      },
      miniProject: {
        title: "Extensible Notification Pipeline (Observer & Factory)",
        description: "Publishes domain events to registered notification observers instantiated via a factory pattern.",
        techStack: ["Java 21", "Clean Architecture", "GoF Design Patterns"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Apply all 5 SOLID principles (Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion)",
        "Implement creational patterns (Builder, Factory Method, Singleton with thread safety)",
        "Implement structural patterns (Adapter, Decorator, Facade)",
        "Implement behavioral patterns (Strategy, Observer, Template Method)",
        "Organize multi-layered codebases following Clean / Onion / Hexagonal Architecture",
      ],
      topicChecklist: [
        { id: "jv_22_1", title: "SOLID Principles: Deep dive with Java refactoring examples", completed: false },
        { id: "jv_22_2", title: "Creational Patterns: Builder pattern, Factory Method, and Thread-Safe Singleton", completed: false },
        { id: "jv_22_3", title: "Structural Patterns: Adapter pattern and Decorator pattern in Java I/O", completed: false },
        { id: "jv_22_4", title: "Behavioral Patterns: Strategy pattern (with Lambdas) and Observer pattern", completed: false },
        { id: "jv_22_5", title: "Clean Architecture: Ports and Adapters (Hexagonal Architecture) structure", completed: false },
        { id: "jv_22_6", title: "Separation of concerns: Domain entities vs Use cases vs Infrastructure adapters", completed: false },
      ],
      practicalExercises: [
        { id: "ex_22_1", title: "Replace if/else Ladder with Strategy Pattern", prompt: "Refactor a 5-branch shipping cost if/else ladder into a clean Strategy pattern using a Map of discount strategies and lambdas." },
      ],
      assessment: { criterion: "Rigorous adherence to SOLID principles, decoupled domain logic.", passingScore: 90 },
      estimatedStudyHours: 16,
      estimatedStudyTime: "2 weeks",
    },
    {
      id: "java_node_23",
      level: 23,
      title: "Performance Profiling, Docker & Production Fundamentals",
      skill: "JMH Benchmarks, Multi-Stage Docker & Observability",
      category: "Production Readiness",
      concept: "Microbenchmarking with JMH, containerizing Java apps with multi-stage Docker builds, memory limits, Spring Actuator, and Prometheus metrics.",
      state: "LOCKED",
      whyLearnThis: "Running Java in production requires container optimization, memory tuning inside cgroups, and live telemetry observability.",
      prerequisites: ["Spring Boot & JVM Architecture"],
      task: {
        title: "Production Dockerization & Metric Instrumentation",
        description: "Package a Spring Boot service into a minimal multi-stage Docker image using eclipse-temurin:21-jre, instrumented with Actuator and Prometheus.",
        deliverables: ["Optimized multi-stage Dockerfile with non-root user", "Spring Boot Actuator health, info, and Prometheus metrics endpoints", "JMH benchmark comparing two algorithmic implementations"],
      },
      miniProject: {
        title: "Dockerized Microservice with Health Probes",
        description: "Deployable container configured for Kubernetes liveness/readiness probes and JVM cgroup memory limits.",
        techStack: ["Java 21", "Docker", "JMH", "Spring Boot Actuator", "Prometheus"],
        difficulty: "Production",
      },
      learningObjectives: [
        "Benchmark critical Java methods accurately using the Java Microbenchmark Harness (JMH)",
        "Build lightweight, secure container images using multi-stage Dockerfiles and JRE base images",
        "Configure JVM flags for container environments (-XX:MaxRAMPercentage)",
        "Expose live health and performance metrics via Spring Boot Actuator and Micrometer",
      ],
      topicChecklist: [
        { id: "jv_23_1", title: "Writing accurate microbenchmarks with JMH (Java Microbenchmark Harness)", completed: false },
        { id: "jv_23_2", title: "Multi-stage Docker builds: separating build environment from runtime JRE", completed: false },
        { id: "jv_23_3", title: "JVM in Containers: cgroups memory/CPU detection and -XX:MaxRAMPercentage", completed: false },
        { id: "jv_23_4", title: "Running as non-root user inside Docker for container security", completed: false },
        { id: "jv_23_5", title: "Spring Boot Actuator: /health, /info, /metrics, and custom health indicators", completed: false },
        { id: "jv_23_6", title: "Micrometer and Prometheus integration for production telemetry", completed: false },
      ],
      practicalExercises: [
        { id: "ex_23_1", title: "Multi-Stage Dockerfile", prompt: "Write a Dockerfile that compiles the app using maven:3.9-eclipse-temurin-21 and runs the JAR using eclipse-temurin:21-jre-alpine under 200MB image size." },
      ],
      assessment: { criterion: "Verified container build, under-250MB image footprint, working Actuator metrics.", passingScore: 90 },
      estimatedStudyHours: 16,
      estimatedStudyTime: "2 weeks",
    },
    {
      id: "java_node_24",
      level: 24,
      title: "Advanced Capstone Project & Technical Interview Mastery",
      skill: "Distributed Architecture & Mock Technical Interviews",
      category: "Mastery & Career",
      concept: "Architecting an end-to-end distributed system, LeetCode Java algorithms preparation, system design concepts, and mock interview readiness.",
      state: "LOCKED",
      whyLearnThis: "Synthesizing all 23 prior stages into an enterprise capstone and mastering technical interviews secures top software engineering roles.",
      prerequisites: ["All Stages 1–23"],
      task: {
        title: "Production Distributed Microservices Capstone",
        description: "Build an end-to-end distributed system featuring authentication, persistence, messaging, caching, containerization, and unit tests.",
        deliverables: ["Microservices architecture with REST communication and database persistence", "Complete automated test suite with JUnit 5 and Mockito", "System design documentation detailing trade-offs, scalability, and bottlenecks", "Portfolio-ready GitHub repository with comprehensive README"],
      },
      miniProject: {
        title: "Scalable Distributed E-Commerce Microservices",
        description: "Full production capstone featuring User, Product, and Order services with PostgreSQL, Docker, and comprehensive tests.",
        techStack: ["Java 21", "Spring Boot 3", "PostgreSQL", "Docker", "JUnit 5", "System Design"],
        difficulty: "Production",
      },
      learningObjectives: [
        "Architect and implement a production-grade multi-service Java application from scratch",
        "Document system architecture, API contracts, and non-functional requirements",
        "Confidently solve complex data structures and algorithms questions in Java",
        "Articulate JVM internals, concurrency trade-offs, and design patterns in technical interviews",
      ],
      topicChecklist: [
        { id: "jv_24_1", title: "Capstone system requirements, API specifications, and architecture diagrams", completed: false },
        { id: "jv_24_2", title: "Database schema design, entity modeling, and indexing strategies", completed: false },
        { id: "jv_24_3", title: "Secure authentication and authorization integration", completed: false },
        { id: "jv_24_4", title: "High-throughput asynchronous messaging or batch processing", completed: false },
        { id: "jv_24_5", title: "Complete test coverage (unit, integration, and contract tests)", completed: false },
        { id: "jv_24_6", title: "Containerization with Docker Compose for local orchestration", completed: false },
        { id: "jv_24_7", title: "Java technical interview preparation: Core Java, Concurrency, JVM, and LeetCode", completed: false },
      ],
      practicalExercises: [
        { id: "ex_24_1", title: "System Design Mock Interview", prompt: "Design a high-scale URL Shortener (Bit.ly) in Java: detail API design, hashing algorithm, database schema, caching strategy, and concurrency." },
      ],
      assessment: { criterion: "Successful deployment of production capstone and passing interview rubric.", passingScore: 95 },
      estimatedStudyHours: 30,
      estimatedStudyTime: "4 weeks",
    },
  ];

  return {
    id: roadmapId,
    ownerId: userId || "current_user",
    conversationId,
    title: "Complete Java Mastery: Beginner to Advanced",
    domain: "Software Engineering",
    roadmapType: "LEARNING",
    userObjective: "Learn complete Java from absolute beginner to advanced, covering all core and enterprise concepts step by step.",
    experienceLevel: "All Levels",
    estimatedDuration: "24 Stages · ~350 Study Hours · 20–24 Weeks at 2h/day",
    version: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    goal: "Complete Java Mastery: Beginner to Advanced",
    targetRole: "Senior Java & Backend Engineer",
    trackKey: "java_mastery",
    dailyStudyHours: 2.0,
    totalStudyHours: 350,
    overallProgress: 0,
    currentNodeId: "java_node_1",
    pointerLevel: 1,
    nodes,
    stages,
    lastUpdated: now,
  };
}

// ============================================================================
// PYTHON MASTERY ROADMAP (SEPARATE ARTIFACT)
// ============================================================================

export function buildCompletePythonRoadmap(conversationId?: string, userId?: string): UniversalRoadmap {
  const roadmapId = `rm_python_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
      id: `py_node_${s.stage}`,
      level: s.stage,
      title: s.title,
      skill: s.skillFocus,
      category: s.stage <= 3 ? "Foundations" : s.stage <= 6 ? "Core Engineering" : s.stage <= 9 ? "Backend Architecture" : "Production Systems",
      concept: s.objective,
      state: s.stage === 1 ? "IN_PROGRESS" : "AVAILABLE",
      whyLearnThis: `Mastering ${s.skillFocus} is essential for writing robust, scalable, and idiomatic Python applications.`,
      prerequisites: s.prerequisites,
      prerequisiteChecks: s.prerequisites.map((p) => `Verified understanding of ${p}`),
      task: {
        title: s.projectTitle,
        description: `Implement the milestone deliverable for Stage ${s.stage}: ${s.objective}`,
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
        id: `ex_${t.id}`,
        title: t.exercise?.title || `${t.title} Exercise`,
        prompt: t.exercise?.prompt || `Implement practical exercise for ${t.title}.`,
        starterCode: t.exercise?.starterCode || `// Starter code for ${t.title}`,
        solution: t.example?.codeOrWalkthrough || `// Solution for ${t.title}`,
        expectedOutcome: t.exercise?.expectedOutcome || `Passing test assertions for ${t.title}.`,
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
}

// ============================================================================
// UNIVERSAL EXECUTION PLAN BUILDER (PROJECT ROADMAPS)
// ============================================================================

export function buildProjectExecutionPlan(
  projectTitle: string,
  domain: string = "Software & Product Engineering",
  conversationId?: string,
  userId?: string
): UniversalRoadmap {
  const roadmapId = `exec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const isMobile =
    /\b(?:mobile|ios|android|react\s*native|flutter|app)\b/i.test(projectTitle) ||
    /\b(?:mobile)\b/i.test(domain);
  const isRestaurant =
    projectTitle.toLowerCase().includes("restaurant") || projectTitle.toLowerCase().includes("food");

  const title = isMobile
    ? "Mobile Application Development Execution Plan"
    : isRestaurant
    ? "AI-Powered Restaurant & Food Delivery Execution Plan"
    : `${projectTitle} Execution Plan`;

  const safeDomain = isMobile
    ? "Mobile Engineering"
    : isRestaurant
    ? "Full Stack Web & Mobile Systems"
    : domain || "Software & Product Engineering";

  const phaseTemplates = buildExecutionPhasesForProject(projectTitle, safeDomain);

  const stages: ProgressiveProjectStage[] = phaseTemplates.map((p) => ({
    stage: p.phase,
    skillFocus: p.title,
    projectTitle: `${p.title.split(",")[0].split("&")[0].trim()} Deliverables`,
    deliverables: p.deliverables.join(", "),
    complexity: p.phase <= 2 ? "Moderate" : p.phase <= 4 ? "Advanced" : "Production",
    status: p.phase === 1 ? "ACTIVE" : "UPCOMING",
  }));

  const nodes = buildExecutionNodesFromTemplates(phaseTemplates);

  const totalHours = phaseTemplates.reduce((acc, p) => acc + p.estimatedEffortHours, 0);
  const durationStr = `${stages.length} Phases · ~${totalHours} Engineering Hours · 8–12 Weeks`;

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
    userObjective: `Execute the complete multi-stage production plan for ${projectTitle}.`,
    summary: `Structured execution plan across ${stages.length} phases with assignable roles, deliverables, risks, DoD, and acceptance criteria.`,
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
}

// ============================================================================
// PART 5: COMPLETE 12-STAGE FILMMAKING ROADMAP
// ============================================================================

export function buildCompleteFilmmakingRoadmap(conversationId?: string, userId?: string): UniversalRoadmap {
  const roadmapId = `rm_film_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const stages: ProgressiveProjectStage[] = [
    { stage: 1, skillFocus: "Concept Development & Premise Architecture", projectTitle: "Film Concept Bible & Logline", deliverables: "Treatment, character bios, 3-act spine", complexity: "Beginner", status: "ACTIVE" },
    { stage: 2, skillFocus: "Screenwriting & Industry Formatting", projectTitle: "10-Minute Formatted Screenplay", deliverables: "Industry-standard formatted script in Final Draft / WriterDuet", complexity: "Beginner", status: "UPCOMING" },
    { stage: 3, skillFocus: "Budgeting, Financing & Legal Clearances", projectTitle: "Itemized Film Production Budget", deliverables: "Line-item budget, actor agreements, insurance policy", complexity: "Intermediate", status: "UPCOMING" },
    { stage: 4, skillFocus: "Pre-Production Logistics & Script Breakdown", projectTitle: "Departmental Breakdown Dossier", deliverables: "Eighths of a page breakdown sheets, prop & wardrobe sheets", complexity: "Intermediate", status: "UPCOMING" },
    { stage: 5, skillFocus: "Casting Direction, Auditions & Deals", projectTitle: "Actor Casting Package", deliverables: "Audition sides, audition recordings, signed actor agreements", complexity: "Intermediate", status: "UPCOMING" },
    { stage: 6, skillFocus: "Location Scouting, Recce & Permits", projectTitle: "Location Recce & Permit Package", deliverables: "Recce photos, sound level log, power diagrams, signed permits", complexity: "Intermediate", status: "UPCOMING" },
    { stage: 7, skillFocus: "Cinematography Planning & Lighting Design", projectTitle: "Master Director-DoP Shot Book", deliverables: "Shot lists, lighting schematics, lens choices, color palette", complexity: "Advanced", status: "UPCOMING" },
    { stage: 8, skillFocus: "Production Scheduling & Call Sheets", projectTitle: "Master Stripboard & Daily Call Sheets", deliverables: "Shooting schedule, stripboards, cast & crew call sheets", complexity: "Advanced", status: "UPCOMING" },
    { stage: 9, skillFocus: "Principal Photography & Directing on Set", projectTitle: "Raw 4K Footage & Audio Library", deliverables: "Principal photography footage, camera slates, sound logs", complexity: "Advanced", status: "UPCOMING" },
    { stage: 10, skillFocus: "Picture Editing & Assembly in NLEs", projectTitle: "Locked Picture Cut (Fine Cut)", deliverables: "Rough cut, director's assembly, fine cut, picture lock export", complexity: "Advanced", status: "UPCOMING" },
    { stage: 11, skillFocus: "Sound Design, Foley & Score Mixing", projectTitle: "Master 5.1 & Stereo Audio Mix", deliverables: "Dialogue cleanups, original Foley, tension score, 5.1 stems", complexity: "Advanced", status: "UPCOMING" },
    { stage: 12, skillFocus: "Color Grading, VFX & Festival Release", projectTitle: "Festival Master Package & DCP", deliverables: "Calibrated 4K DCP master, trailer, press kit, festival strategy", complexity: "Production", status: "UPCOMING" },
  ];

  const nodes: RoadmapNode[] = [
    {
      id: "film_node_1",
      level: 1,
      title: "Concept Development, Theme & Premise Architecture",
      skill: "Idea Generation & Dramatic Structure",
      category: "Pre-Production",
      concept: "Developing a commercially viable and artistically compelling film idea. Identifying the central dramatic argument, character motivations, stakes, and three-act narrative spine.",
      state: "IN_PROGRESS",
      whyLearnThis: "Every great film begins with an undeniable core concept. Without clear stakes and thematic clarity, production resources are wasted.",
      prerequisites: ["Visual storytelling curiosity"],
      task: {
        title: "Craft Film Treatment & Logline",
        description: "Draft a compelling 2-sentence logline and a 3-page narrative treatment defining protagonist flaw, inciting incident, and crisis climax.",
        deliverables: ["2-sentence industry logline", "3-page narrative treatment", "Character relationship map"],
      },
      miniProject: {
        title: "Film Concept Bible & Mood Board",
        description: "Compile visual references, thematic inspirations, and character dossiers into an executive concept bible.",
        techStack: ["Notion", "Figma / Milanote", "Mood Boards"],
        difficulty: "Beginner",
      },
      learningObjectives: [
        "Craft high-concept loglines that instantly communicate stakes and genre",
        "Structure story arcs using the classic Three-Act structure and Hero's Journey",
        "Establish internal and external character motivations",
      ],
      topicChecklist: [
        { id: "flm_1_1", title: "Logline anatomy: Protagonist + Inciting Incident + Conflict + Stakes", completed: false },
        { id: "flm_1_2", title: "Three-Act narrative spine (Setup, Debate, Midpoint, Climax, Resolution)", completed: false },
        { id: "flm_1_3", title: "Character arcs: Flaw, Want vs. Need, and Ghost/Wound", completed: false },
        { id: "flm_1_4", title: "Visual tone and mood curation", completed: false },
      ],
      assessment: { criterion: "Clear narrative treatment demonstrating genuine conflict and authentic thematic resolution.", passingScore: 85 },
      estimatedStudyHours: 15,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "film_node_2",
      level: 2,
      title: "Screenwriting & Industry Script Formatting",
      skill: "Screenwriting in Final Draft / WriterDuet",
      category: "Scriptwriting",
      concept: "Mastering professional screenplay formatting: sluglines, action description subtext, character dialogue voice, parentheticals, and pacing for a standard 1-page-per-minute runtime.",
      state: "AVAILABLE",
      whyLearnThis: "Format compliance is mandatory for cast and crew readability, budget scheduling, and festival consideration.",
      prerequisites: ["Concept Development"],
      task: {
        title: "Write 10-Minute Formatted Screenplay",
        description: "Draft a complete 10-page short film screenplay following standard industry rules using industry software.",
        deliverables: ["10-page screenplay PDF", "Scene beat sheet"],
      },
      miniProject: {
        title: "Short Film Screenplay: 'Vanished Echoes'",
        description: "Write a high-tension short film screenplay with distinct dialogue and rhythmic visual descriptions.",
        techStack: ["Final Draft / WriterDuet / Highland", "PDF Screenplay Standard"],
        difficulty: "Beginner",
      },
      learningObjectives: [
        "Use industry-standard sluglines (INT./EXT., LOCATION, TIME)",
        "Write lean, present-tense action lines with evocative visual subtext",
        "Give each character an authentic, distinguishable spoken voice",
      ],
      topicChecklist: [
        { id: "flm_2_1", title: "Standard screenplay margins, Courier 12pt font, and layout hierarchy", completed: false },
        { id: "flm_2_2", title: "Scene sluglines and scene transitions (CUT TO, DISSOLVE TO, MATCH CUT)", completed: false },
        { id: "flm_2_3", title: "Dialogue subtext and avoiding on-the-nose exposition", completed: false },
        { id: "flm_2_4", title: "Pacing beats, page count budgeting (1 page = 1 minute)", completed: false },
      ],
      assessment: { criterion: "Format-compliant 10-page screenplay with zero typographical or structural errors.", passingScore: 90 },
      estimatedStudyHours: 25,
      estimatedStudyTime: "2.5 weeks",
    },
    {
      id: "film_node_3",
      level: 3,
      title: "Budgeting, Financing, Clearances & Production Insurance",
      skill: "Movie Magic Budgeting & Entertainment Law",
      category: "Producing",
      concept: "Constructing line-item budgets covering above-the-line talent, below-the-line equipment/crew, location rentals, meals, insurance, contingency reserves, and copyright clearances.",
      state: "LOCKED",
      whyLearnThis: "Without budget discipline and legal protections, indie films run out of money mid-shoot or face copyright lawsuits.",
      prerequisites: ["Screenwriting"],
      task: {
        title: "Build Balanced Short Film Budget",
        description: "Create an itemized budget spreadsheet allocating expenses across pre-production, 2 production shoot days, and post-production.",
        deliverables: ["Balanced budget spreadsheet", "Model actor release contract", "Location agreement form"],
      },
      miniProject: {
        title: "Production Financing Blueprint",
        description: "Complete itemized budget with cash flow projections and contingency protocols.",
        techStack: ["Movie Magic Budgeting / Excel", "Entertainment Contract Templates"],
        difficulty: "Intermediate",
      },
      learningObjectives: [
        "Calculate accurate rental rates for camera, lighting, and sound gear",
        "Budget crew stipends, catering, travel, and local municipal permits",
        "Draft airtight talent and location release forms",
      ],
      topicChecklist: [
        { id: "flm_3_1", title: "Above-the-Line vs. Below-the-Line cost allocation", completed: false },
        { id: "flm_3_2", title: "Equipment rental quotes and insurance requirements", completed: false },
        { id: "flm_3_3", title: "Cast & crew compensation, catering, and travel logistics", completed: false },
        { id: "flm_3_4", title: "Location release forms, talent agreements, and music licensing clearances", completed: false },
      ],
      assessment: { criterion: "Balanced budget with 10% contingency reserve and verified legal clearance checklist.", passingScore: 85 },
      estimatedStudyHours: 20,
      estimatedStudyTime: "2 weeks",
    },
    {
      id: "film_node_4",
      level: 4,
      title: "Pre-Production Logistics & Script Breakdown",
      skill: "Movie Magic Scheduling & Production Logistics",
      category: "Pre-Production",
      concept: "Breaking down every script page into eighths, tagging props, costumes, vehicles, special equipment, stunts, and sound requirements for efficient scheduling.",
      state: "LOCKED",
      whyLearnThis: "The script breakdown is the blueprint for every production department. A single missed prop can halt a shoot day.",
      prerequisites: ["Budgeting"],
      task: {
        title: "Complete Script Breakdown Sheets",
        description: "Break down all scenes into color-coded breakdown sheets tagging cast, props, wardrobe, and special gear.",
        deliverables: ["Color-coded scene breakdown sheets", "Master prop & wardrobe list"],
      },
      miniProject: {
        title: "Departmental Pre-Production Binder",
        description: "Consolidated breakdown binder ready for department heads (DoP, Gaffer, Sound, Wardrobe).",
        techStack: ["Movie Magic Scheduling / StudioBinder", "Google Sheets"],
        difficulty: "Intermediate",
      },
      learningObjectives: [
        "Calculate scene page count in eighths of a page",
        "Extract departmental requirements per scene without omission",
        "Coordinate technical needs with Art and Camera departments",
      ],
      topicChecklist: [
        { id: "flm_4_1", title: "Eighths of a page measurement protocol", completed: false },
        { id: "flm_4_2", title: "Color-coded script breakdown tagging (Cast, Props, Wardrobe, Vehicles)", completed: false },
        { id: "flm_4_3", title: "Art department continuity sheets and prop master tracking", completed: false },
      ],
      assessment: { criterion: "Complete script breakdown with 100% item coverage verified against shooting script.", passingScore: 90 },
      estimatedStudyHours: 18,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "film_node_5",
      level: 5,
      title: "Casting Direction, Audition Workflows & Actor Contracts",
      skill: "Casting Direction & Performance Coaching",
      category: "Casting",
      concept: "Drafting character breakdowns, running audition workshops, directing chemistry reads, selecting talent, and executing cast contracts.",
      state: "LOCKED",
      whyLearnThis: "Great casting represents 80% of directing. Believable performances make audiences forget the budget.",
      prerequisites: ["Script Breakdown"],
      task: {
        title: "Conduct Casting Sessions & Select Actors",
        description: "Publish casting calls on OmniCraft, conduct video audition callbacks, and sign agreements.",
        deliverables: ["Casting call briefs", "Audition feedback rubric", "Executed talent agreements"],
      },
      miniProject: {
        title: "Cast Dossier & Rehearsal Schedule",
        description: "Complete cast package with verified talent, headshots, and rehearsal calendar.",
        techStack: ["OmniCraft Creator Network", "Audition Recording / Zoom"],
        difficulty: "Intermediate",
      },
      learningObjectives: [
        "Write descriptive character breakdowns outlining emotional stakes and physicality",
        "Direct audition sides to test emotional range and adjustability",
        "Run productive table reads that establish trust and character chemistry",
      ],
      topicChecklist: [
        { id: "flm_5_1", title: "Character breakdown writing and casting call publication", completed: false },
        { id: "flm_5_2", title: "Audition sides selection and performance adjustment prompts", completed: false },
        { id: "flm_5_3", title: "Chemistry reads, table reads, and blocking preparation", completed: false },
      ],
      assessment: { criterion: "Cast confirmed with signed talent releases and completed table read recordings.", passingScore: 85 },
      estimatedStudyHours: 20,
      estimatedStudyTime: "2 weeks",
    },
    {
      id: "film_node_6",
      level: 6,
      title: "Location Scouting, Technical Recce & Municipal Permits",
      skill: "Location Management & Permit Operations",
      category: "Locations",
      concept: "Scouting locations that serve the story, conducting technical recces for sound/power/lighting, securing permits, and planning parking/restrooms.",
      state: "LOCKED",
      whyLearnThis: "Unplanned location noise (HVAC, street traffic) ruins audio, and unpermitted locations get shut down by authorities.",
      prerequisites: ["Pre-Production Logistics"],
      task: {
        title: "Execute Technical Recce Dossier",
        description: "Scout 3 candidate locations, measure ambient sound, audit electrical circuits, and secure written owner permissions.",
        deliverables: ["Location photos & panoramic maps", "Audio room tone recordings", "Signed location release agreements"],
      },
      miniProject: {
        title: "Master Location Packet",
        description: "Complete location dossier with directions, parking maps, nearest hospitals, and emergency contacts.",
        techStack: ["SunSeeker app", "Decibel Meter app", "Permit Application Portals"],
        difficulty: "Intermediate",
      },
      learningObjectives: [
        "Audit natural sunlight trajectories across shooting hours using sun-tracking apps",
        "Measure ambient sound interference (refrigerators, traffic, airport flight paths)",
        "Determine power breaker load capacity for production lighting fixtures",
      ],
      topicChecklist: [
        { id: "flm_6_1", title: "Location scouting aesthetics and story alignment", completed: false },
        { id: "flm_6_2", title: "Technical recce protocol: Sound, power, accessibility, and crew holding", completed: false },
        { id: "flm_6_3", title: "Municipal filming permits, police notifications, and neighbor releases", completed: false },
      ],
      assessment: { criterion: "Secured permits and complete technical recce dossier for all shooting locations.", passingScore: 90 },
      estimatedStudyHours: 16,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "film_node_7",
      level: 7,
      title: "Cinematography Planning, Shot Lists & Lighting Schemes",
      skill: "Director of Photography (DoP) Workflow",
      category: "Cinematography",
      concept: "Translating script beats into a visual language: camera angles, focal lengths, camera movement (dolly, steadicam), lighting ratios, color temperature, and floor plans.",
      state: "LOCKED",
      whyLearnThis: "Visual grammar guides the audience's subconscious emotions. Intentional lighting separates amateur videos from cinematic films.",
      prerequisites: ["Location Scouting"],
      task: {
        title: "Draft Complete Shot List & Overhead Lighting Schematics",
        description: "Create a scene-by-scene shot list with camera coverage and design 2D lighting schematics for all principal setups.",
        deliverables: ["Shot list with camera movements and lenses", "Shot Designer lighting overheads", "Visual moodboard LUT palette"],
      },
      miniProject: {
        title: "Director-DoP Master Lookbook & Shot Deck",
        description: "Comprehensive lookbook detailing aspect ratio, color palettes, reference frames, and lighting setups.",
        techStack: ["Shot Designer", "Celtx", "Frame.io"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Select focal lengths (24mm, 35mm, 50mm, 85mm) to evoke psychological proximity or detachment",
        "Design 3-point and practical lighting setups with key-to-fill contrast ratios",
        "Maintain the 180-degree rule and eyeline axis consistency across multi-camera coverage",
      ],
      topicChecklist: [
        { id: "flm_7_1", title: "Camera framing: ELS, Wide, Medium, Close-Up, Extreme Close-Up, Over-the-Shoulder", completed: false },
        { id: "flm_7_2", title: "The 180-degree rule, spatial continuity, and crossing the line intentionally", completed: false },
        { id: "flm_7_3", title: "Lighting styles: High-key, Low-key, Chiaroscuro, Motivated practical lights", completed: false },
        { id: "flm_7_4", title: "Color temperature (3200K Tungsten vs. 5600K Daylight) and CRI ratings", completed: false },
      ],
      assessment: { criterion: "Cohesive shot list and floor plans covering all dramatic requirements.", passingScore: 90 },
      estimatedStudyHours: 30,
      estimatedStudyTime: "3 weeks",
    },
    {
      id: "film_node_8",
      level: 8,
      title: "Production Scheduling, Stripboards & Daily Call Sheets",
      skill: "1st Assistant Director (1st AD) Operations",
      category: "Production Management",
      concept: "Creating a viable shooting schedule, grouping scenes by location and cast availability, calculating company moves, and generating daily call sheets.",
      state: "LOCKED",
      whyLearnThis: "The 1st AD is the timekeeper of the set. Realistic schedules prevent expensive overtime and exhausted crews.",
      prerequisites: ["Cinematography Planning"],
      task: {
        title: "Generate Master Stripboard & Call Sheets",
        description: "Build a 2-day production stripboard schedule and create formatted call sheets with scene orders and weather reports.",
        deliverables: ["2-day production stripboard", "Day 1 and Day 2 official call sheets", "Safety briefing protocol"],
      },
      miniProject: {
        title: "Production Day Packets",
        description: "Consolidated packets for cast and crew containing schedules, safety rules, and contact sheets.",
        techStack: ["StudioBinder / Movie Magic Scheduling", "PDF Call Sheet Standards"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Sequence scenes logically based on lighting changes (day vs. night) and actor call times",
        "Budget realistic setup and shooting durations per camera setup (30–45 mins per setup)",
        "Enforce strict 12-hour turnaround times between shoot wrap and next day call times",
      ],
      topicChecklist: [
        { id: "flm_8_1", title: "Stripboard construction and scene grouping by location & lighting setup", completed: false },
        { id: "flm_8_2", title: "Call sheet structure: Crew call times, talent pickup, meal breaks, nearest hospital", completed: false },
        { id: "flm_8_3", title: "Set safety protocols, emergency procedures, and weather contingency plans", completed: false },
      ],
      assessment: { criterion: "Feasible shooting schedule adhering to legal turnarounds and production logistics.", passingScore: 90 },
      estimatedStudyHours: 15,
      estimatedStudyTime: "1.5 weeks",
    },
    {
      id: "film_node_9",
      level: 9,
      title: "Principal Photography & Directing Actors on Set",
      skill: "Directing Performances & On-Set Command",
      category: "Production",
      concept: "Leading the film crew during principal photography: running the set protocol (slate, roll sound, roll camera, action, cut), directing actor performances using actionable verbs, and managing camera/sound coverage.",
      state: "LOCKED",
      whyLearnThis: "The director must remain calm and decisive on set. Guiding actors with actionable verbs yields authentic, moving performances.",
      prerequisites: ["Production Scheduling"],
      task: {
        title: "Direct Principal Photography Shoot",
        description: "Execute a 2-day shoot capturing all planned coverage, ensuring dual-system audio sync and script continuity.",
        deliverables: ["Raw 4K footage media", "Sound recording logs", "Daily continuity supervisor report"],
      },
      miniProject: {
        title: "Principal Photography Production Run",
        description: "Live production execution capturing the complete raw footage library of the short film.",
        techStack: ["Cinema Camera (BMPCC / Sony FX / RED)", "Sound Devices / Zoom F6", "Sennheiser Shotguns"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Direct actors using actionable verbs instead of emotional result-directing",
        "Command standard set protocol smoothly ('Sound speeds', 'Camera rolling', 'Mark it', 'Action', 'Cut')",
        "Collaborate with the Script Supervisor to maintain visual and prop continuity across takes",
      ],
      topicChecklist: [
        { id: "flm_9_1", title: "Standard on-set verbal protocol and department communication", completed: false },
        { id: "flm_9_2", title: "Directing actors with actionable verbs (Judith Weston technique)", completed: false },
        { id: "flm_9_3", title: "Dual-system audio synchronization with clapper slates and timecode", completed: false },
        { id: "flm_9_4", title: "Digital Imaging Technician (DIT) 3-2-1 backup rule on hard drives", completed: false },
      ],
      assessment: { criterion: "Clean dual-system audio and all planned camera coverage safely backed up.", passingScore: 95 },
      estimatedStudyHours: 40,
      estimatedStudyTime: "2 weeks",
    },
    {
      id: "film_node_10",
      level: 10,
      title: "Picture Editing, Rough Cut & Assembly in NLEs",
      skill: "Film Editing in Premiere Pro / DaVinci Resolve",
      category: "Post-Production",
      concept: "Ingesting and organizing raw footage, syncing dual-system audio, cutting the assembly cut, refining pacing into the director's cut, and locking picture cut.",
      state: "LOCKED",
      whyLearnThis: "Editing is the final rewrite of the screenplay. Rhythm, cutting on action, and reaction shots define the emotional truth of the scene.",
      prerequisites: ["Principal Photography"],
      task: {
        title: "Edit Complete Short Film to Picture Lock",
        description: "Assemble raw footage into a synchronized project, build an assembly cut, and refine pacing into a tight fine cut.",
        deliverables: ["Synchronized NLE project file", "Director's rough cut", "Locked picture export (ProRes)"],
      },
      miniProject: {
        title: "Picture Lock Master Cut",
        description: "Fine cut export ready for sound design, Foley, score, and color grading departments.",
        techStack: ["Adobe Premiere Pro / DaVinci Resolve Studio", "Apple ProRes 422 HQ"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Organize project bins, metadata, scene/take numbering, and proxy workflows",
        "Cut on action to make visual transitions invisible to the viewer",
        "Use J-cuts, L-cuts, and reaction shots to control dramatic tension and emotional pacing",
      ],
      topicChecklist: [
        { id: "flm_10_1", title: "Project organization, proxies, and multi-track audio sync", completed: false },
        { id: "flm_10_2", title: "Assembly cut -> Rough cut -> Fine cut -> Picture lock progression", completed: false },
        { id: "flm_10_3", title: "Cutting techniques: Match cut, J-cut, L-cut, Jump cut, Cross-cutting", completed: false },
        { id: "flm_10_4", title: "EDL / XML export protocols for sound mixing and color grading handoff", completed: false },
      ],
      assessment: { criterion: "Locked picture edit demonstrating seamless continuity and rhythmic emotional pacing.", passingScore: 90 },
      estimatedStudyHours: 35,
      estimatedStudyTime: "3 weeks",
    },
    {
      id: "film_node_11",
      level: 11,
      title: "Sound Design, Foley, Dialogue ADR & Original Tension Score",
      skill: "Audio Post-Production in Pro Tools / Fairlight",
      category: "Sound Design",
      concept: "Dialogue spectral repair (iZotope RX), Foley footsteps and cloth movement, environmental ambiances, sound effects (SFX), tension scoring, and 5.1/stereo re-recording mixing.",
      state: "LOCKED",
      whyLearnThis: "Audio carries 60% of the cinematic experience. Poor audio ruins great visuals, while rich sound design immerses audiences completely.",
      prerequisites: ["Picture Editing"],
      task: {
        title: "Mix Full Film Soundscape to EBU R128 Standards",
        description: "Clean production dialogue, record original Foley passes, design room ambience layers, and mix the soundtrack with dialogue clarity.",
        deliverables: ["Pro Tools / Fairlight session", "Master stereo mix (-24 LUFS)", "Stems (Dialogue, Music, Effects)"],
      },
      miniProject: {
        title: "Master 5.1 & Stereo Sound Mix",
        description: "Clean cinematic audio master with isolated stems ready for theatrical and streaming delivery.",
        techStack: ["Avid Pro Tools / DaVinci Fairlight", "iZotope RX", "FabFilter"],
        difficulty: "Advanced",
      },
      learningObjectives: [
        "Clean dialogue noise and clicks using spectral repair and de-reverberation",
        "Layer background room tones and ambient Foley to ground every scene in reality",
        "Mix sound elements so dialogue remains crisp and intelligible over music score and explosions",
      ],
      topicChecklist: [
        { id: "flm_11_1", title: "Dialogue editing, room tone matching, and ADR replacement", completed: false },
        { id: "flm_11_2", title: "Foley recording (footsteps, clothing, prop interactions)", completed: false },
        { id: "flm_11_3", title: "Atmosphere design and original musical score placement", completed: false },
        { id: "flm_11_4", title: "Re-recording mixing: EQ, compression, panning, and LUFS loudness standards", completed: false },
      ],
      assessment: { criterion: "Clean, broadcast-compliant audio master with crisp dialogue and dynamic soundscape.", passingScore: 95 },
      estimatedStudyHours: 25,
      estimatedStudyTime: "2.5 weeks",
    },
    {
      id: "film_node_12",
      level: 12,
      title: "Color Grading, Visual Effects & Festival/Theatrical Distribution",
      skill: "DaVinci Resolve Colorist & Distribution Strategy",
      category: "Finishing & Distribution",
      concept: "Color balancing in ACES / Rec.709 color management, matching shots, creative color grades, clean-up visual effects, creating Digital Cinema Packages (DCPs), and submitting to FilmFreeway festivals.",
      state: "LOCKED",
      whyLearnThis: "Color grading unifies scenes shot across different times into one visual reality. Finishing with a DCP and press kit guarantees festival readiness.",
      prerequisites: ["Sound Design"],
      task: {
        title: "Grade Film & Generate Theatrical DCP Master",
        description: "Balance all shots, apply creative grade (e.g. cold-teal suspense grade), render master ProRes 4444, and package a Digital Cinema Package (DCP).",
        deliverables: ["Color-graded master ProRes 4444", "Calibrated SMPTE DCP package", "FilmFreeway submission package with Electronic Press Kit (EPK)"],
      },
      miniProject: {
        title: "Festival-Ready Master Package & Trailer",
        description: "Complete release package including 4K DCP, official 60-second trailer, poster artwork, and press kit.",
        techStack: ["DaVinci Resolve Studio", "DCP-o-matic", "FilmFreeway", "Adobe Photoshop"],
        difficulty: "Production",
      },
      learningObjectives: [
        "Balance exposure, contrast, and color temperature across shot angles",
        "Protect skin tones using vector scopes and selective secondary qualifiers",
        "Package calibrated DCI-compliant DCPs with 5.1 uncompressed audio",
        "Develop an effective film festival submission run on FilmFreeway with realistic tiering",
      ],
      topicChecklist: [
        { id: "flm_12_1", title: "ACES and DaVinci YRGB Color Management fundamentals", completed: false },
        { id: "flm_12_2", title: "Primary grading (Lift, Gamma, Gain, Offset) and scopes (Waveform, Vectorscope)", completed: false },
        { id: "flm_12_3", title: "Secondary grading, skin tone indicators, and film emulation LUTs", completed: false },
        { id: "flm_12_4", title: "DCP creation (24.000 fps, DCI 2K/4K, XYZ color space, 5.1 audio)", completed: false },
        { id: "flm_12_5", title: "FilmFreeway campaign: Tier 1, Tier 2, and Oscar-qualifying film festivals", completed: false },
      ],
      assessment: { criterion: "Calibrated 4K DCP master with official press kit and confirmed festival submissions.", passingScore: 95 },
      estimatedStudyHours: 25,
      estimatedStudyTime: "2.5 weeks",
    },
  ];

  return {
    id: roadmapId,
    ownerId: userId || "current_user",
    conversationId,
    title: "Comprehensive Filmmaking & Cinema Production Roadmap",
    domain: "Filmmaking & Cinema Production",
    roadmapType: "LEARNING",
    userObjective: "Master complete independent filmmaking from initial story concept to theatrical and festival distribution.",
    experienceLevel: "All Levels",
    estimatedDuration: "12 Stages · ~275 Study Hours · 20–24 Weeks at 2h/day",
    version: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    goal: "Comprehensive Filmmaking & Cinema Production Roadmap",
    targetRole: "Independent Film Director & Producer",
    trackKey: "filmmaking_mastery",
    dailyStudyHours: 2.0,
    totalStudyHours: 275,
    overallProgress: 0,
    currentNodeId: "film_node_1",
    pointerLevel: 1,
    nodes,
    stages,
    lastUpdated: now,
  };
}

// ============================================================================
// PART 6: COMPLETE 12-STAGE FRONTEND ROADMAP
// ============================================================================

export function buildCompleteFrontendRoadmap(conversationId?: string, userId?: string): UniversalRoadmap {
  const roadmapId = `rm_frontend_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
      id: `fe_node_${s.stage}`,
      level: s.stage,
      title: s.title,
      skill: s.skillFocus,
      category: s.stage <= 3 ? "Foundations" : s.stage <= 6 ? "Core Engineering" : s.stage <= 9 ? "Framework Architecture" : "Production Systems",
      concept: s.objective,
      state: s.stage === 1 ? "IN_PROGRESS" : "AVAILABLE",
      whyLearnThis: `Mastering ${s.skillFocus} gives you modern frontend engineering mastery with zero compromise on accessibility and web performance.`,
      prerequisites: s.prerequisites,
      prerequisiteChecks: s.prerequisites.map((p) => `Verified understanding of ${p}`),
      task: {
        title: s.projectTitle,
        description: `Implement the milestone deliverable for Stage ${s.stage}: ${s.objective}`,
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
        id: `ex_${t.id}`,
        title: t.exercise?.title || `${t.title} Exercise`,
        prompt: t.exercise?.prompt || `Implement practical exercise for ${t.title}.`,
        starterCode: t.exercise?.starterCode || `// Starter code for ${t.title}`,
        solution: t.example?.codeOrWalkthrough || `// Solution for ${t.title}`,
        expectedOutcome: t.exercise?.expectedOutcome || `Passing test assertions for ${t.title}.`,
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
  const roadmapId = `rm_ml_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
      id: `ml_node_${s.stage}`,
      level: s.stage,
      title: s.title,
      skill: s.skillFocus,
      category: s.stage <= 3 ? "Foundations" : s.stage <= 6 ? "Classical Machine Learning" : s.stage <= 9 ? "Deep Learning & NLP" : "Production MLOps",
      concept: s.objective,
      state: s.stage === 1 ? "IN_PROGRESS" : "AVAILABLE",
      whyLearnThis: `Mastering ${s.skillFocus} provides rigorous mathematical and practical competence in machine learning engineering.`,
      prerequisites: s.prerequisites,
      prerequisiteChecks: s.prerequisites.map((p) => `Verified understanding of ${p}`),
      task: {
        title: s.projectTitle,
        description: `Implement the milestone deliverable for Stage ${s.stage}: ${s.objective}`,
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
        id: `ex_${t.id}`,
        title: t.exercise?.title || `${t.title} Exercise`,
        prompt: t.exercise?.prompt || `Implement practical exercise for ${t.title}.`,
        starterCode: t.exercise?.starterCode || `// Starter code for ${t.title}`,
        solution: t.example?.codeOrWalkthrough || `// Solution for ${t.title}`,
        expectedOutcome: t.exercise?.expectedOutcome || `Passing test assertions for ${t.title}.`,
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
  const roadmapId = `rm_sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
      id: `sec_node_${s.stage}`,
      level: s.stage,
      title: s.title,
      skill: s.skillFocus,
      category: s.stage <= 3 ? "Foundations" : s.stage <= 6 ? "Offensive & Defensive Security" : s.stage <= 8 ? "Incident Operations" : "Controlled Defense Capstone",
      concept: s.objective,
      state: s.stage === 1 ? "IN_PROGRESS" : "AVAILABLE",
      whyLearnThis: `Mastering ${s.skillFocus} provides essential offensive and defensive security capabilities in real-world infrastructure.`,
      prerequisites: s.prerequisites,
      prerequisiteChecks: s.prerequisites.map((p) => `Verified understanding of ${p}`),
      task: {
        title: s.projectTitle,
        description: `Implement the milestone deliverable for Stage ${s.stage}: ${s.objective}`,
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
        id: `ex_${t.id}`,
        title: t.exercise?.title || `${t.title} Exercise`,
        prompt: t.exercise?.prompt || `Implement practical exercise for ${t.title}.`,
        starterCode: t.exercise?.starterCode || `// Starter code for ${t.title}`,
        solution: t.example?.codeOrWalkthrough || `// Solution for ${t.title}`,
        expectedOutcome: t.exercise?.expectedOutcome || `Passing test assertions for ${t.title}.`,
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
}

export function buildCompleteVideoEditingRoadmap(conversationId?: string, userId?: string): UniversalRoadmap {
  const roadmapId = `rm_video_editing_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const stages: ProgressiveProjectStage[] = VIDEO_EDITING_BLUEPRINT.stages.map((s) => ({
    stage: s.stage,
    skillFocus: s.skillFocus,
    projectTitle: s.projectTitle,
    deliverables: s.deliverables.join(", "),
    complexity: s.stage <= 2 ? "Beginner" : s.stage <= 5 ? "Intermediate" : s.stage <= 8 ? "Advanced" : "Production",
    status: s.stage === 1 ? "ACTIVE" : "UPCOMING",
  }));

  const nodes: RoadmapNode[] = VIDEO_EDITING_BLUEPRINT.stages.map((s) => {
    const deep = buildVideoEditingStageContent(s.stage);
    return {
      id: `ve_node_${s.stage}`,
      level: s.stage,
      title: s.title,
      skill: s.skillFocus,
      category: s.stage <= 2 ? "Foundations" : s.stage <= 5 ? "Editorial Craft" : s.stage <= 8 ? "Finishing & Color/Audio" : "Mastery & Showcase",
      concept: s.objective,
      state: s.stage === 1 ? "IN_PROGRESS" : "AVAILABLE",
      whyLearnThis: `Stage ${s.stage} establishes critical creative and technical competencies in ${s.skillFocus}.`,
      prerequisites: s.prerequisites,
      prerequisiteChecks: s.prerequisites.map((p) => `Verified mastery of ${p}`),
      task: {
        title: s.projectTitle,
        description: `Implement the creative project deliverable for Stage ${s.stage}: ${s.objective}`,
        deliverables: s.deliverables,
      },
      miniProject: {
        title: s.projectTitle,
        description: s.deliverables.join("; "),
        techStack: ["NLE Timeline", "Waveform Scopes", "Audio LUFS", ...(s.stage >= 6 ? ["Color Wheels", "LUTs"] : [])],
        difficulty: s.stage <= 2 ? "Beginner" : s.stage <= 5 ? "Intermediate" : s.stage <= 8 ? "Advanced" : "Production",
      },
      learningObjectives: [s.objective, ...s.keyCompetencies],
      topicChecklist: deep.topics.map((t) => ({ id: t.id, title: t.title, completed: false })),
      topics: deep.topics,
      commonMistakesAndTroubleshooting: deep.commonMistakesAndTroubleshooting,
      knowledgeCheck: deep.knowledgeCheck,
      completionCriteria: deep.completionCriteria,
      practicalExercises: deep.practicalExercises?.map((ex) => ({
        id: ex.id,
        title: ex.title,
        prompt: ex.prompt,
        instructions: ex.instructions,
        expectedOutcome: ex.expectedOutcome,
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
    title: "Complete Video Editing Roadmap",
    domain: "Media Production & Creative Arts",
    subject: "Video Editing",
    roadmapType: "LEARNING",
    userObjective: "Master video editing from NLE ingestion, rough cuts, and pacing to audio post, color grading, motion graphics, and portfolio showreel.",
    summary: "Comprehensive 10-stage Video Editing curriculum from timeline fundamentals and cutting mechanics to color grading, sound design, and master delivery.",
    experienceLevel: "All Levels",
    estimatedDuration: "10 Stages · ~150 Study Hours · 10–14 Weeks",
    version: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    goal: "Complete Video Editing Roadmap",
    targetRole: "Professional Video Editor & Narrative Storyteller",
    trackKey: "video_editing_mastery",
    dailyStudyHours: 2.0,
    totalStudyHours: 150,
    overallProgress: 0,
    currentNodeId: nodes[0].id,
    pointerLevel: 1,
    nodes,
    stages,
    curriculumBlueprint: VIDEO_EDITING_BLUEPRINT,
    lastUpdated: now,
  };
}

export function buildCompleteDSARoadmap(conversationId?: string, userId?: string): UniversalRoadmap {
  const roadmapId = `rm_dsa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const stages: ProgressiveProjectStage[] = DSA_BLUEPRINT.stages.map((s) => ({
    stage: s.stage,
    skillFocus: s.skillFocus,
    projectTitle: s.projectTitle,
    deliverables: s.deliverables.join(", "),
    complexity: s.stage <= 4 ? "Beginner" : s.stage <= 9 ? "Intermediate" : s.stage <= 12 ? "Advanced" : "Production",
    status: s.stage === 1 ? "ACTIVE" : "UPCOMING",
  }));

  const nodes: RoadmapNode[] = DSA_BLUEPRINT.stages.map((s) => {
    const deep = buildDSAStageContent(s.stage);
    return {
      id: `dsa_node_${s.stage}`,
      level: s.stage,
      title: s.title,
      skill: s.skillFocus,
      category: s.stage <= 4 ? "Linear Data Structures" : s.stage <= 8 ? "Trees, Heaps & Recursion" : s.stage <= 11 ? "Graphs & Advanced Structures" : "Dynamic Programming & Capstone",
      concept: s.objective,
      state: s.stage === 1 ? "IN_PROGRESS" : "AVAILABLE",
      whyLearnThis: `Mastering ${s.skillFocus} develops foundational problem-solving intuition and algorithmic efficiency required for elite engineering.`,
      prerequisites: s.prerequisites,
      prerequisiteChecks: s.prerequisites.map((p) => `Verified understanding of ${p}`),
      task: {
        title: s.projectTitle,
        description: `Implement the milestone deliverable for Stage ${s.stage}: ${s.objective}`,
        deliverables: s.deliverables,
      },
      miniProject: {
        title: s.projectTitle,
        description: s.deliverables.join("; "),
        techStack: ["Algorithms", "Time/Space Complexity", "Data Structures"],
        difficulty: s.stage <= 4 ? "Beginner" : s.stage <= 9 ? "Intermediate" : s.stage <= 12 ? "Advanced" : "Production",
      },
      learningObjectives: [s.objective, ...s.keyCompetencies],
      topicChecklist: deep.topics.map((t) => ({ id: t.id, title: t.title, completed: false })),
      topics: deep.topics,
      commonMistakesAndTroubleshooting: deep.commonMistakesAndTroubleshooting,
      knowledgeCheck: deep.knowledgeCheck,
      completionCriteria: deep.completionCriteria,
      practicalExercises: deep.practicalExercises?.map((ex) => ({
        id: ex.id,
        title: ex.title,
        prompt: ex.prompt,
        starterCode: ex.starterCode,
        instructions: ex.instructions,
        expectedOutcome: ex.expectedOutcome,
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
    title: "Data Structures and Algorithms Roadmap",
    domain: "Computer Science & Software Engineering",
    subject: "Data Structures and Algorithms",
    roadmapType: "LEARNING",
    userObjective: "Master Data Structures and Algorithms from asymptotic complexity and linear structures to graphs, backtracking, and dynamic programming.",
    summary: "Rigorous 14-stage Data Structures and Algorithms curriculum with complexity proofs, patterns, and interview-grade problem sets.",
    experienceLevel: "All Levels",
    estimatedDuration: "14 Stages · ~180 Study Hours · 12–16 Weeks",
    version: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    goal: "Data Structures and Algorithms Roadmap",
    targetRole: "Master of Data Structures, Algorithms & Competitive Programming",
    trackKey: "dsa_mastery",
    dailyStudyHours: 2.0,
    totalStudyHours: 180,
    overallProgress: 0,
    currentNodeId: nodes[0].id,
    pointerLevel: 1,
    nodes,
    stages,
    curriculumBlueprint: DSA_BLUEPRINT,
    lastUpdated: now,
  };
}

// ============================================================================
// ============================================================================
// PART 7: UNIVERSAL DEEP ROADMAP GENERATOR (ANY SUBJECT / DOMAIN)
// ============================================================================

interface DomainTopicTemplate {
  title: string;
  subtopics: string[];
  explanation: string;
  keySyntaxOrApis: string[];
  example: { title: string; description: string; codeOrWalkthrough: string };
  exercise: { title: string; prompt: string; expectedOutcome: string };
  troubleshooting: string[];
}

function buildDeepTopicsForDomainStage(
  safeSubj: string,
  domainType: "web" | "backend" | "ai" | "devops" | "mobile" | "film" | "general",
  stageNum: number
): DeepTopicItem[] {
  let templates: DomainTopicTemplate[] = [];

  if (domainType === "web") {
    if (stageNum === 1) {
      templates = [
        {
          title: "Semantic Document Outline & HTML5 Living Standard Elements",
          subtopics: [
            "Document outline & semantic landmarks: <header>, <nav>, <main>, <article>, <section>, <footer>, <aside>",
            "Heading rank semantics (h1–h6) & accessibility tree exposure",
            "Accessible landmark roles & ARIA banner, navigation, main, and contentinfo",
            "Text formatting vs semantic tags: <em>, <strong>, <mark>, <time>, <code>, <kbd>",
            "Embedded responsive media: <img>, <picture>, <figure>, <figcaption> with srcset and sizes",
          ],
          explanation:
            "Semantic HTML establishes the structural foundation of the web by providing content with explicit meaning rather than generic division tags. When browsers parse semantic elements, they build an Accessibility Tree parallel to the Document Object Model (DOM), enabling assistive technologies to navigate documents predictably while drastically improving search engine indexing and machine readability.",
          keySyntaxOrApis: [
            '<header role="banner"><nav aria-label="Primary">',
            '<main id="main-content"><article aria-labelledby="heading-1">',
            '<time datetime="2026-10-11">October 11, 2026</time>',
            '<picture><source srcset="img.webp" type="image/webp"><img src="img.jpg" alt="Diagram" loading="lazy"></picture>',
          ],
          example: {
            title: "Accessible Semantic Article Outline",
            description: "Demonstrating landmark separation, accessible heading hierarchy, and responsive media tags.",
            codeOrWalkthrough:
              '<!DOCTYPE html>\n<html lang="en">\n<head><meta charset="UTF-8"><title>Semantic Document</title></head>\n<body>\n  <header>\n    <nav aria-label="Main navigation"><a href="/">Home</a></nav>\n  </header>\n  <main id="content">\n    <article>\n      <header><h1>Modern Web Architecture</h1><p>Published <time datetime="2026-10-11">Oct 11, 2026</time></p></header>\n      <section aria-labelledby="sec-1"><h2 id="sec-1">Semantic Foundations</h2><p>Semantic tags improve accessibility tree navigation.</p></section>\n    </article>\n  </main>\n  <footer><p>&copy; 2026 OmniCraft</p></footer>\n</body>\n</html>',
          },
          exercise: {
            title: "Semantic Outline Refactoring Lab",
            prompt: "Refactor a legacy div-soup layout into an accessible semantic outline with zero validator errors.",
            expectedOutcome: "W3C validator reports 0 errors and accessibility audit confirms 100% landmark coverage.",
          },
          troubleshooting: [
            "Do not skip heading levels (e.g., from <h1> directly to <h3>); maintain sequential hierarchy.",
            "Never place more than one visible <main> landmark on a page.",
          ],
        },
        {
          title: "HTML Forms, Input Controls, Accessibility & Constraint Validation",
          subtopics: [
            "Form element configuration: action, method, enctype (multipart/form-data), novalidate",
            "Standard input types: text, email, password, number, tel, date, search, file, url",
            "Native constraint validation attributes: required, pattern, minlength, maxlength, min, max, step",
            "Grouped controls using <fieldset> and <legend> for radio groups and checkbox collections",
            "Accessible error feedback with aria-invalid, aria-describedby, and live regions",
            "Form submission lifecycle, FormData API handling, and preventing default synchronous reloads",
          ],
          explanation:
            "Forms are the primary interactive interface for collecting user input. Relying on native HTML5 inputs and the Constraint Validation API ensures accessible, keyboard-operable, and mobile-responsive controls with zero initial JavaScript overhead. Pairing inputs with explicit label elements and fieldset groupings guarantees that screen readers announce required states and validation constraints accurately.",
          keySyntaxOrApis: [
            "<fieldset><legend>Subscription Options</legend>",
            '<label for="user-email">Email Address:</label><input type="email" id="user-email" required>',
            '<input type="file" accept="image/*" multiple>',
            "const data = new FormData(event.currentTarget);",
            'element.setCustomValidity("Please enter a valid format");',
          ],
          example: {
            title: "Accessible Registration Form with Constraint Validation",
            description: "Production-ready form using fieldsets, explicit labels, and native error messages.",
            codeOrWalkthrough:
              '<form id="signup-form" novalidate>\n  <fieldset>\n    <legend>Account Credentials</legend>\n    <div>\n      <label for="email">Email Address:</label>\n      <input type="email" id="email" name="email" required aria-describedby="email-hint" />\n      <small id="email-hint">We will send your verification link here.</small>\n    </div>\n    <div>\n      <label for="password">Password (8+ chars):</label>\n      <input type="password" id="password" name="password" minlength="8" required />\n    </div>\n  </fieldset>\n  <button type="submit">Create Account</button>\n</form>',
          },
          exercise: {
            title: "Accessible Multi-Field Form with Native Validation",
            prompt: "Build an accessible registration form with email, password, radio plan selection in fieldsets, and file attachment.",
            expectedOutcome: "Form enforces native constraints, surfaces accessible inline errors, and serializes into FormData cleanly.",
          },
          troubleshooting: [
            'Always link <label for="id"> with matching input id to ensure screen readers focus inputs correctly.',
            "Wrap related radio buttons or checkboxes in <fieldset> with a descriptive <legend>.",
          ],
        },
        {
          title: "Web Accessibility (WCAG 2.2 AA) & Screen Reader Compatibility",
          subtopics: [
            "The four WCAG core principles: Perceivable, Operable, Understandable, Robust (POUR)",
            "Keyboard navigation, focus indicators (:focus-visible), and logical tabIndex sequencing",
            "ARIA roles, states, and properties (role='dialog', aria-expanded, aria-controls, aria-hidden)",
            "Color contrast compliance (minimum 4.5:1 for normal text, 3:1 for large text)",
            "Screen reader live regions (aria-live='polite' vs 'assertive') for asynchronous dynamic updates",
          ],
          explanation:
            "Accessibility is not an optional enhancement but a core requirement of modern web development. Writing accessible code ensures that individuals with visual, motor, auditory, and cognitive disabilities can navigate, understand, and interact with web experiences seamlessly.",
          keySyntaxOrApis: [
            ":focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }",
            '<button aria-expanded="false" aria-controls="menu-drawer">Menu</button>',
            '<div role="status" aria-live="polite">Saving changes...</div>',
            '<span class="sr-only">Visually hidden text for screen readers</span>',
          ],
          example: {
            title: "Accessible Toggle Button with ARIA Live Region",
            description: "Implementation of an accessible accordion toggle with dynamic live region status.",
            codeOrWalkthrough:
              '<button id="toggle-btn" aria-expanded="false" aria-controls="faq-1">\n  What is WCAG 2.2?\n</button>\n<div id="faq-1" hidden>\n  <p>WCAG 2.2 provides updated accessibility success criteria for digital accessibility.</p>\n</div>\n<div role="status" aria-live="polite" id="status-region"></div>',
          },
          exercise: {
            title: "Keyboard & Screen Reader Accessibility Audit",
            prompt: "Audit an interactive modal or navigation menu using keyboard-only navigation and axe-core.",
            expectedOutcome: "Zero axe-core critical violations and full keyboard focus trapping inside open modal dialogs.",
          },
          troubleshooting: [
            "Never use outline: none without providing an alternative high-contrast :focus-visible style.",
            "Avoid overriding native semantic element roles with redundant ARIA (e.g. do not add role='button' to a <button>).",
          ],
        },
      ];
    } else if (stageNum === 2) {
      templates = [
        {
          title: "CSS Box Model, Sizing Models & Display Formatting Contexts",
          subtopics: [
            "Box model geometry: content-box vs border-box sizing calculations",
            "Margin collapsing mechanics, negative margins, and padding constraints",
            "Display formatting contexts: block, inline, inline-block, none, and contents",
            "Overflow handling: visible, hidden, scroll, auto, and clip paths",
            "Intrinsic sizing with min-content, max-content, and fit-content",
          ],
          explanation:
            "The CSS Box Model is the fundamental geometric layout engine of the browser. Every element on the page generates a rectangular box consisting of content, padding, border, and margin areas. Switching to box-sizing: border-box ensures intuitive layout math by including padding and borders within declared width and height values.",
          keySyntaxOrApis: [
            "*, *::before, *::after { box-sizing: border-box; }",
            "width: fit-content; max-width: 100%;",
            "overflow-x: hidden; overflow-y: auto;",
            "margin-block: auto; margin-inline: 1rem;",
          ],
          example: {
            title: "Modern CSS Reset & Intrinsic Sizing Container",
            description: "Demonstrating universal border-box reset, margin collapsing avoidance, and fit-content sizing.",
            codeOrWalkthrough:
              "*, *::before, *::after {\n  box-sizing: border-box;\n  margin: 0;\n  padding: 0;\n}\n.container {\n  width: min(100% - 2rem, 72rem);\n  margin-inline: auto;\n  padding-block: 2rem;\n}",
          },
          exercise: {
            title: "Box Model Layout & Sizing Lab",
            prompt: "Construct a responsive card component that maintains strict internal padding, border radiuses, and zero horizontal scroll overflow.",
            expectedOutcome: "Pixel-accurate rendering matching design specifications across all screen widths with zero clipping.",
          },
          troubleshooting: [
            "Vertical margins collapse between adjacent block elements; use gap or padding-block to prevent unexpected jumps.",
            "Inline elements ignore top and bottom margins; change display to inline-block or block when vertical spacing is required.",
          ],
        },
        {
          title: "CSS Selectors, Specificity Calculations, Cascade Layers & Inheritance",
          subtopics: [
            "Specificity hierarchy calculation: (inline, ID, class/attribute/pseudo-class, element/pseudo-element)",
            "Modern relational pseudo-classes: :is(), :where(), :has(), and :not()",
            "Cascade layers with @layer for architecture isolation and reset containment",
            "CSS Custom Properties (Variables): declaration, scope inheritance, fallbacks, and theme switching",
            "Property inheritance rules and resetting with inherit, initial, unset, and revert",
          ],
          explanation:
            "Mastering CSS specificity and the cascade allows developers to author scalable, predictable style architectures without resorting to destructive !important overrides. With modern CSS features like @layer and the relational :has() selector, style rules can express sophisticated parent-child interactions directly in stylesheets.",
          keySyntaxOrApis: [
            "@layer reset, base, components, utilities;",
            ":root { --brand-color: #06b6d4; --font-sans: system-ui, sans-serif; }",
            ".card:has(input:checked) { border-color: var(--brand-color); }",
            ":where(.btn, .link) { color: inherit; }",
          ],
          example: {
            title: "Cascade Layers & Relational Selector Theme Architecture",
            description: "Using @layer and :has() to build self-contained, specificity-controlled components.",
            codeOrWalkthrough:
              "@layer base, components;\n@layer base {\n  body { color: #1e293b; font-family: system-ui; }\n}\n@layer components {\n  .option-card {\n    border: 1px solid #cbd5e1;\n    padding: 1rem;\n    transition: border-color 0.2s;\n  }\n  .option-card:has(input:checked) {\n    border-color: #06b6d4;\n    background-color: #f0fdfa;\n  }\n}",
          },
          exercise: {
            title: "Specificity Refactoring & Cascade Architecture Lab",
            prompt: "Refactor a tangled stylesheet with 15 !important tags into a structured 4-layer @layer architecture.",
            expectedOutcome: "Zero !important overrides, clean inheritance, and instant theme toggling via CSS custom properties.",
          },
          troubleshooting: [
            "The :where() pseudo-class always has 0-0-0 specificity, making it ideal for low-priority default styles.",
            "Properties declared in unlayered CSS always override layered CSS regardless of layer order.",
          ],
        },
        {
          title: "Modern Layouts with Flexbox & CSS Grid Systems",
          subtopics: [
            "Flexbox main axis vs cross axis alignment (justify-content, align-items, align-content, flex-wrap)",
            "Flex item sizing mechanics: flex-grow, flex-shrink, flex-basis shorthand",
            "CSS Grid track definitions: fr units, repeat(), minmax(), and auto-fit vs auto-fill",
            "Grid template areas and explicit line-based placement (grid-column, grid-row)",
            "Responsive fluid grids without media queries using repeat(auto-fit, minmax(280px, 1fr))",
          ],
          explanation:
            "CSS Grid and Flexbox are complementary layout paradigms. Flexbox excels at one-dimensional alignment along a single axis (such as toolbars, navigation bars, and pill buttons), whereas CSS Grid provides true two-dimensional control over rows and columns simultaneously. Combining them eliminates legacy float hacks and rigid fixed-pixel grids.",
          keySyntaxOrApis: [
            "display: flex; justify-content: space-between; align-items: center; gap: 1rem;",
            "display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;",
            'grid-template-areas: "header header" "sidebar main" "footer footer";',
            "flex: 1 1 auto; align-self: stretch;",
          ],
          example: {
            title: "Responsive Dashboard Layout using Combined Grid & Flexbox",
            description: "Creating a production dashboard shell with responsive sidebar grid and flexible toolbar.",
            codeOrWalkthrough:
              '.dashboard-grid {\n  display: grid;\n  grid-template-columns: 260px 1fr;\n  min-height: 100vh;\n}\n.toolbar {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  padding: 1rem;\n  border-bottom: 1px solid #e2e8f0;\n}\n@media (max-width: 768px) {\n  .dashboard-grid { grid-template-columns: 1fr; }\n}',
          },
          exercise: {
            title: "Responsive Multi-Card Catalog Layout",
            prompt: "Build an auto-fitting product card grid that wraps smoothly between 1 and 4 columns without using media queries.",
            expectedOutcome: "Grid adapts smoothly across 320px, 768px, and 1440px viewports with consistent gap spacing and card heights.",
          },
          troubleshooting: [
            "If Grid items stretch beyond container width, ensure min-width: 0 is set on flex/grid children.",
            "Use auto-fill when you want empty columns to persist; use auto-fit to collapse empty tracks and stretch existing items.",
          ],
        },
      ];
    } else {
      templates = [
        {
          title: `Stage ${stageNum} ${safeSubj} Core Fundamentals & Toolchain`,
          subtopics: [
            `Foundational mental models and architectural taxonomy in ${safeSubj}`,
            `Toolchain setup, linting configs, and build pipeline automation`,
            `Syntax primitives, type safety, and standard object lifecycles`,
            `Input validation, defensive assertions, and error domain modeling`,
            `Diagnostic debugging tools and development server telemetry`,
          ],
          explanation:
            `Foundations in ${safeSubj} establish the critical patterns needed for long-term scalability. Mastering these core building blocks prevents compounding architectural debt.`,
          keySyntaxOrApis: [
            `const runtime = initialize${safeSubj.replace(/[^a-zA-Z]/g, "")}();`,
            `runtime.configure({ strictMode: true });`,
          ],
          example: {
            title: `${safeSubj} Core Setup Walkthrough`,
            description: `Configuring the foundational module in ${safeSubj}.`,
            codeOrWalkthrough: `// Core setup for ${safeSubj}\nexport function initCore() {\n  return { ready: true, stage: ${stageNum} };\n}`,
          },
          exercise: {
            title: `Foundations Lab`,
            prompt: `Configure and verify the core module with zero runtime warnings.`,
            expectedOutcome: `Core module initializes and passes all unit assertions.`,
          },
          troubleshooting: [`Verify dependency versions match compiler expectations.`],
        },
        {
          title: `Stage ${stageNum} ${safeSubj} Advanced Architecture & Systems Execution`,
          subtopics: [
            `Core engineering patterns and modular abstractions in ${safeSubj}`,
            `State management, transactional safety, and data flow synchronization`,
            `Integration with backend services, persistence engines, and external APIs`,
            `Automated testing, security scanning, and performance profiling`,
            `Production deployment workflows, monitoring instrumentation, and maintenance`,
          ],
          explanation:
            `Advanced execution in ${safeSubj} requires moving beyond basic syntax to understand architectural boundaries, concurrency models, error domains, and operational durability. Clean interface segregation and automated test coverage ensure systems scale predictably under high transaction volumes.`,
          keySyntaxOrApis: [
            `interface ${safeSubj.replace(/[^a-zA-Z]/g, "")}Service { execute(): Promise<Result>; }`,
            `benchmark.run({ iterations: 10000 });`,
            `telemetry.recordSpan("${safeSubj.toLowerCase()}_operation");`,
          ],
          example: {
            title: `${safeSubj} Modular Architecture Pipeline`,
            description: `Demonstrating interface segregation, defensive error handling, and structured telemetry.`,
            codeOrWalkthrough:
              `export class ${safeSubj.replace(/[^a-zA-Z]/g, "")}Pipeline {\n  async process(input: unknown) {\n    if (!input) throw new Error("Invalid payload");\n    return { status: "processed", timestamp: new Date().toISOString() };\n  }\n}`,
          },
          exercise: {
            title: `${safeSubj} Stage ${stageNum} Production Lab`,
            prompt: `Implement a modular service applying the core architectural patterns of Stage ${stageNum}.`,
            expectedOutcome: `Validated working implementation passing automated unit tests with zero unhandled exceptions.`,
          },
          troubleshooting: [
            `Ensure all asynchronous operations have explicit timeouts and cancellation tokens.`,
            `Monitor memory allocations under sustained load to detect resource leaks early.`,
          ],
        },
        {
          title: `Stage ${stageNum} ${safeSubj} Reliability, Testing & Production Hardening`,
          subtopics: [
            `Automated test suites: unit, integration, and fuzz testing`,
            `Benchmarking and latency profiling under sustained throughput`,
            `Security vulnerability scanning and dependency audits`,
            `Observability: structured metrics, distributed tracing, and alerts`,
            `Production deployment runbooks and rollback strategies`,
          ],
          explanation:
            `Production readiness in ${safeSubj} separates prototypes from resilient enterprise software. Automated test coverage, defensive boundaries, and structured telemetry guarantee operational reliability.`,
          keySyntaxOrApis: [
            `test("validates invariants", () => { expect(result).toBeValid(); });`,
            `metrics.histogram("latency_ms").observe(duration);`,
          ],
          example: {
            title: `${safeSubj} Automated Testing Harness`,
            description: `Comprehensive integration test suite covering success and failure modes.`,
            codeOrWalkthrough: `// Integration test for ${safeSubj}\nexport async function runIntegrationTest() {\n  const res = await service.execute();\n  if (!res.ok) throw new Error("Assertion failed");\n  return true;\n}`,
          },
          exercise: {
            title: `Hardening & Verification Lab`,
            prompt: `Implement a test harness verifying service behavior under fault injection and network latency.`,
            expectedOutcome: `Test harness validates 100% of failure recovery paths with zero unhandled panics.`,
          },
          troubleshooting: [`Isolate state between test runs to avoid flaky test cascades.`],
        },
      ];
    }
  } else if (domainType === "backend") {
    templates = [
      {
        title: `Stage ${stageNum} ${safeSubj} Runtime, Memory & API Systems`,
        subtopics: [
          `Runtime execution model, memory layout, and stack/heap allocation`,
          `Type safety, struct definitions, interfaces, and generic abstractions`,
          `High-throughput REST, gRPC, and asynchronous network protocols`,
          `Database persistence, connection pooling, and ACID transaction boundaries`,
          `Benchmarking, CPU/memory profiling, and low-latency optimization`,
        ],
        explanation:
          `Building resilient backend systems with ${safeSubj} requires an understanding of socket lifecycles, memory safety, thread pools, and non-blocking I/O. Proper connection pooling and transactional boundaries prevent cascading service failures under peak load.`,
        keySyntaxOrApis: [
          `async function handleRequest(ctx: Context): Promise<Response>`,
          `pool.acquireConnection().then(conn => conn.query())`,
          `metrics.counter("${safeSubj.toLowerCase()}_requests_total").inc()`,
        ],
        example: {
          title: `${safeSubj} Resilient API Service Handler`,
          description: `Production handler with timeout protection, schema validation, and database transaction.`,
          codeOrWalkthrough:
            'async function processOrder(orderId: string) {\n  const client = await pool.connect();\n  try {\n    await client.query("BEGIN");\n    const res = await client.query("SELECT * FROM orders WHERE id = $1", [orderId]);\n    await client.query("COMMIT");\n    return res.rows[0];\n  } catch (err) {\n    await client.query("ROLLBACK");\n    throw err;\n  } finally {\n    client.release();\n  }\n}',
        },
        exercise: {
          title: `Concurrent Data Service Implementation`,
          prompt: `Implement a high-throughput endpoint handling concurrent reads and writes with transaction guarantees.`,
          expectedOutcome: `Service processes 1,000 concurrent requests without race conditions or connection leaks.`,
        },
        troubleshooting: [
          `Always release acquired database connections in a finally block to prevent connection starvation.`,
          `Set explicit connection timeouts and circuit breakers on external service calls.`,
        ],
      },
      {
        title: `Stage ${stageNum} ${safeSubj} Data Persistence, Transactions & Indexing`,
        subtopics: [
          `Relational vs document data modeling paradigms for ${safeSubj}`,
          `Connection pool tuning: max connections, idle timeouts, and queue bounds`,
          `Query optimization, B-tree indexes, execution plans, and EXPLAIN ANALYZE`,
          `Isolation levels (Read Committed, Repeatable Read, Serializable) and deadlocks`,
          `Data migration automation and zero-downtime schema evolution`,
        ],
        explanation:
          `Persistence architecture determines the scalability ceiling of ${safeSubj} backends. Selecting appropriate isolation levels, properly indexing query filters, and avoiding N+1 query patterns are required for sub-millisecond query performance.`,
        keySyntaxOrApis: [
          `CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);`,
          `tx = db.BeginTx(ctx, &sql.TxOptions{Isolation: sql.LevelRepeatableRead})`,
        ],
        example: {
          title: `Optimized Database Transaction Pipeline`,
          description: `Demonstrating connection reuse, prepared statements, and transaction commit.`,
          codeOrWalkthrough: `// Database transaction pattern in ${safeSubj}\nasync function runTransaction(db: any) {\n  const tx = await db.beginTransaction();\n  try {\n    await tx.query("UPDATE accounts SET balance = balance - 100 WHERE id = 1");\n    await tx.query("UPDATE accounts SET balance = balance + 100 WHERE id = 2");\n    await tx.commit();\n  } catch (e) {\n    await tx.rollback();\n    throw e;\n  }\n}`,
        },
        exercise: {
          title: `Zero-Downtime Migration & Persistence Lab`,
          prompt: `Design and execute a non-blocking schema migration with indexing and transactional rollback protection.`,
          expectedOutcome: `Migration executes cleanly with zero table locks under simulated traffic.`,
        },
        troubleshooting: [`Avoid running unindexed updates inside long-running transactions to prevent table locks.`],
      },
      {
        title: `Stage ${stageNum} ${safeSubj} High-Concurrency, Async I/O & Load Balancing`,
        subtopics: [
          `Event loop mechanics vs OS thread worker models in ${safeSubj}`,
          `Concurrency primitives: mutexes, channels, semaphores, and atomics`,
          `Distributed rate limiting, token buckets, and sliding window algorithms`,
          `gRPC streaming protocols, protobuf contracts, and HTTP/2 multiplexing`,
          `Automated load shedding, graceful degradation, and health checks`,
        ],
        explanation:
          `Under heavy traffic, systems must gracefully shed load rather than crash. Concurrency primitives, non-blocking I/O channels, and backpressure mechanisms ensure ${safeSubj} services maintain high availability.`,
        keySyntaxOrApis: [
          `rateLimiter.allow(userId)`,
          `grpc.NewServer(grpc.KeepaliveParams(keepalive.ServerParameters{...}))`,
        ],
        example: {
          title: `Concurrent Worker Pool with Backpressure`,
          description: `Fixed worker pool processing tasks with bounded queue and graceful shutdown.`,
          codeOrWalkthrough: `// Worker pool pattern\nclass WorkerPool {\n  constructor(private size: number) {}\n  async process(jobs: any[]) {\n    const results = await Promise.all(jobs.slice(0, this.size).map(j => j.run()));\n    return results;\n  }\n}`,
        },
        exercise: {
          title: `High-Throughput Concurrency Benchmark`,
          prompt: `Implement a bounded worker queue handling 5,000 requests/sec with graceful queue shedding.`,
          expectedOutcome: `Service achieves 99.9% uptime with p99 latency under 50ms under peak load.`,
        },
        troubleshooting: [`Always bound concurrency queues to prevent unbounded memory growth under sudden spikes.`],
      },
    ];
  } else if (domainType === "ai") {
    templates = [
      {
        title: `Stage ${stageNum} ${safeSubj} Mathematics, Models & Pipeline Architecture`,
        subtopics: [
          `Numerical computing, matrix calculus, and tensor operations`,
          `Feature engineering, normalization, and statistical validation`,
          `Model architectures, gradient backpropagation, and loss optimization`,
          `Evaluation metrics: Precision, Recall, F1, ROC-AUC, and perplexity`,
          `Model serialization, inference latency optimization, and production serving`,
        ],
        explanation:
          `Applied machine learning and AI in ${safeSubj} require disciplined mathematical foundations combined with efficient vectorized pipelines. Preventing data leakage during preprocessing and monitoring prediction drift in production ensure models maintain real-world efficacy.`,
        keySyntaxOrApis: [
          `import numpy as np; import torch; import torch.nn as nn`,
          `optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4)`,
          `loss = criterion(predictions, targets); loss.backward()`,
        ],
        example: {
          title: `Vectorized Pipeline & Inference Script`,
          description: `Demonstrating batch tensor transformations and GPU-accelerated inference.`,
          codeOrWalkthrough:
            `import torch\nclass Model(torch.nn.Module):\n    def __init__(self):\n        super().__init__()\n        self.linear = torch.nn.Linear(128, 2)\n    def forward(self, x):\n        return self.linear(x)\nmodel = Model()\nx = torch.randn(32, 128)\noutput = model(x)`,
        },
        exercise: {
          title: `Model Training & Validation Benchmarking`,
          prompt: `Train and evaluate a model pipeline with stratified k-fold cross-validation and logged evaluation metrics.`,
          expectedOutcome: `Model achieves target accuracy/F1 threshold with zero data leakage across train and test splits.`,
        },
        troubleshooting: [
          `Never fit feature scalers on the entire dataset; fit only on training splits to prevent data leakage.`,
          `Check for exploding or vanishing gradients by logging gradient norms during training epochs.`,
        ],
      },
      {
        title: `Stage ${stageNum} ${safeSubj} Deep Neural Networks & Transformer Architectures`,
        subtopics: [
          `Feedforward networks, backpropagation calculus, and activation dynamics`,
          `Attention mechanisms: self-attention, multi-head attention, and positional encodings`,
          `Transfer learning and fine-tuning pretrained foundations models (LoRA, QLoRA)`,
          `Vector embeddings, semantic search, and approximate nearest neighbor (ANN) indexes`,
          `Retrieval-Augmented Generation (RAG) pipelines with context reranking`,
        ],
        explanation:
          `Modern AI systems rely heavily on attention-based architectures and semantic embedding spaces. Fine-tuning models efficiently with parameter-efficient techniques and orchestrating robust RAG retrieval loops produce scalable, hallucination-resistant systems.`,
        keySyntaxOrApis: [
          `embeddings = embedder.encode(documents, normalize_embeddings=True)`,
          `qlora_config = LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj", "v_proj"])`,
        ],
        example: {
          title: `Semantic Search & RAG Context Assembly`,
          description: `Computing cosine similarity over dense vector embeddings.`,
          codeOrWalkthrough: `import numpy as np\ndef cosine_similarity(a, b):\n    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))\nquery_vec = np.random.randn(768)\ndoc_vec = np.random.randn(768)\nscore = cosine_similarity(query_vec, doc_vec)`,
        },
        exercise: {
          title: `Dense Retrieval & RAG Pipeline Lab`,
          prompt: `Build an embedding pipeline that chunks text, generates vector embeddings, and performs top-k semantic search.`,
          expectedOutcome: `Pipeline retrieves relevant context with mean reciprocal rank (MRR) > 0.85.`,
        },
        troubleshooting: [`Always normalize vector embeddings before computing dot-product similarities.`],
      },
      {
        title: `Stage ${stageNum} ${safeSubj} MLOps, Model Serving & Evaluation Rigor`,
        subtopics: [
          `Model quantization (INT8, FP4) and hardware inference engines (ONNX, TensorRT)`,
          `FastAPI / vLLM high-throughput model serving and continuous batching`,
          `Data drift detection, concept drift monitoring, and automated retraining triggers`,
          `LLM evaluation frameworks, ground truth benchmarks, and automated rubrics`,
          `Safety guardrails, prompt injection defenses, and compliance validation`,
        ],
        explanation:
          `Deploying AI models to production demands rigorous observability and latency management. Quantization reduces memory footprint while continuous batching maximizes GPU utilization.`,
        keySyntaxOrApis: [
          `vllm_engine.generate(prompts, sampling_params)`,
          `drift_detector.compute_drift(baseline_distribution, live_distribution)`,
        ],
        example: {
          title: `High-Throughput Model Inference Endpoint`,
          description: `FastAPI serving wrapper with input validation and latency metrics.`,
          codeOrWalkthrough: `from fastapi import FastAPI\napp = FastAPI()\n@app.post("/predict")\nasync def predict(data: dict):\n    # Run model inference\n    return {"prediction": [0.92, 0.08], "latency_ms": 14}`,
        },
        exercise: {
          title: `Production MLOps Deployment Lab`,
          prompt: `Deploy a quantized model container with health endpoints and automated latency logging.`,
          expectedOutcome: `Container serves 100 requests/sec with p95 latency under 100ms.`,
        },
        troubleshooting: [`Monitor GPU memory usage to prevent Out Of Memory (OOM) crashes under concurrency.`],
      },
    ];
  } else {
    templates = [
      {
        title: `Core Principles & Technical Foundations of ${safeSubj} (Stage ${stageNum})`,
        subtopics: [
          `Mental models, fundamental vocabulary, and architectural taxonomy in ${safeSubj}`,
          `Toolchain configuration, development workspace setup, and diagnostic tooling`,
          `Standard operations, data flow mechanics, and idiomatic conventions`,
          `Error handling boundaries, defensive validation, and edge case resilience`,
          `Applied real-world projects, documentation standards, and portfolio evidence`,
        ],
        explanation:
          `Achieving mastery in ${safeSubj} at Stage ${stageNum} requires developing robust mental models of the underlying discipline. Understanding how foundational building blocks interact allows practitioners to construct scalable, maintainable solutions while avoiding common industry anti-patterns.`,
        keySyntaxOrApis: [
          `toolchain.initialize("${safeSubj.toLowerCase()}");`,
          `pipeline.execute({ stage: ${stageNum}, strictMode: true });`,
          `validateOutcome(result);`,
        ],
        example: {
          title: `${safeSubj} Stage ${stageNum} Practical Demonstration`,
          description: `Step-by-step implementation walkthrough for Stage ${stageNum} deliverables.`,
          codeOrWalkthrough:
            `// ${safeSubj} Stage ${stageNum} Walkthrough\nfunction runStage${stageNum}() {\n  console.log("Executing verified Stage ${stageNum} pipeline for ${safeSubj}");\n  return { success: true, level: ${stageNum} };\n}`,
        },
        exercise: {
          title: `${safeSubj} Stage ${stageNum} Hands-On Lab`,
          prompt: `Complete the applied practical challenge demonstrating Stage ${stageNum} competencies in ${safeSubj}.`,
          expectedOutcome: `Verified implementation artifact passing all functional requirements with 0 errors.`,
        },
        troubleshooting: [
          `Ensure toolchain versions match official release requirements before executing builds.`,
          `Check input parameters and assertions when unexpected behavior or warnings arise.`,
        ],
      },
      {
        title: `Intermediate Workflows, Patterns & Integration in ${safeSubj}`,
        subtopics: [
          `Domain-specific design patterns and modular composition in ${safeSubj}`,
          `State synchronization, event handling, and dependency orchestration`,
          `Defensive input checking, type guards, and automated validation rules`,
          `Integration with external ecosystems, standards, and third-party tools`,
          `Performance benchmarking and continuous automated quality feedback`,
        ],
        explanation:
          `Intermediate mastery in ${safeSubj} focuses on composing individual operations into coherent, modular workflows. Designing clean abstractions and testing edge cases ensures reliability across different execution environments.`,
        keySyntaxOrApis: [
          `orchestrator.dispatch("${safeSubj.toLowerCase()}_event");`,
          `validateContract(payload);`,
        ],
        example: {
          title: `${safeSubj} Workflow Orchestration Pattern`,
          description: `Modular pipeline dispatching tasks with error recovery.`,
          codeOrWalkthrough: `// Workflow orchestration in ${safeSubj}\nexport class WorkflowManager {\n  async runStep(step: number) {\n    return { step, status: "complete" };\n  }\n}`,
        },
        exercise: {
          title: `Workflow Composition Lab`,
          prompt: `Implement a multi-step pipeline connecting 3 distinct operations with structured error handling.`,
          expectedOutcome: `Pipeline executes end-to-end and cleanly recovers from simulated faults.`,
        },
        troubleshooting: [`Always validate contract boundaries between decoupled modules.`],
      },
      {
        title: `Advanced Architecture, Verification & Production Mastery in ${safeSubj}`,
        subtopics: [
          `Deep-dive optimization and high-reliability engineering in ${safeSubj}`,
          `Enterprise compliance, accessibility, or security hardening standards`,
          `Automated testing, continuous verification, and regression prevention`,
          `Scalability profiling, resource management, and failure recovery`,
          `Public capstone release, case study documentation, and peer evaluation`,
        ],
        explanation:
          `Advanced practitioners in ${safeSubj} deliver verified, enterprise-grade deliverables that satisfy strict performance and reliability criteria. Thorough documentation and automated verification prove genuine domain mastery.`,
        keySyntaxOrApis: [
          `telemetry.recordBenchmark("${safeSubj.toLowerCase()}_capstone");`,
          `verifier.assertProductionReady();`,
        ],
        example: {
          title: `Production Verification Harness for ${safeSubj}`,
          description: `Automated test harness validating all stage completion criteria.`,
          codeOrWalkthrough: `// Production verifier\nexport function verifyProductionReady() {\n  return { passed: true, score: 95 };\n}`,
        },
        exercise: {
          title: `Capstone Architecture & Portfolio Release`,
          prompt: `Build and document the complete capstone deliverable adhering to all professional standards.`,
          expectedOutcome: `Deliverable satisfies 100% of rubric criteria and passes automated validation.`,
        },
        troubleshooting: [`Review industry benchmark rubrics before finalizing project deliverables.`],
      },
    ];
  }

  return templates.map((tmpl, idx) => ({
    id: `top_${stageNum}_${idx + 1}`,
    title: tmpl.title,
    completed: false,
    subtopics: tmpl.subtopics,
    explanation: tmpl.explanation,
    keySyntaxOrApis: tmpl.keySyntaxOrApis,
    example: tmpl.example,
    exercise: tmpl.exercise,
    troubleshooting: tmpl.troubleshooting,
  }));
}

export function buildUniversalDynamicRoadmap(
  subject: string,
  domain: string = "Professional Discipline",
  conversationId?: string,
  userId?: string
): UniversalRoadmap {
  const cleaned = cleanAndExtractGoalSubject(subject);
  const safeSubj =
    !cleaned.isAmbiguous && cleaned.subject && cleaned.subject.length > 1
      ? cleaned.subject
      : subject && !/^(?:i\s+need|i\s+want|as\s+a)/i.test(subject.trim())
      ? subject.trim()
      : "Software Engineering";
  const roadmapId = `rm_${safeSubj.toLowerCase().replace(/[^a-z0-9]/g, "_")}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  const lowerSubj = safeSubj.toLowerCase();
  const lowerDomain = (domain || "").toLowerCase();

  const isWebFrontend =
    /\b(?:frontend|front[\s\-]?end|html|css|javascript|typescript|react|vue|angular|svelte|next|web\s*dev|tailwind)\b/i.test(lowerSubj) ||
    /\b(?:web)\b/i.test(lowerDomain);

  const isSystemsBackend =
    (/\b(?:backend|rust|go|golang|c\+\+|c#|\.net|microservice|database|postgres|sql|server|java|spring)\b/i.test(lowerSubj) ||
     /\b(?:backend|systems)\b/i.test(lowerDomain)) &&
    !isWebFrontend;

  const isAIOrData =
    /\b(?:ai|artificial\s*intelligence|machine\s*learning|deep\s*learning|data\s*science|pytorch|tensorflow|nlp|llm|computer\s*vision|data\s*engineering)\b/i.test(lowerSubj) ||
    /\b(?:data|ai)\b/i.test(lowerDomain);

  const isDevOpsOrCloud =
    /\b(?:devops|docker|kubernetes|k8s|cloud|aws|azure|gcp|terraform|linux|ci[\s/-]?cd|security|cybersecurity|pentest)\b/i.test(lowerSubj) ||
    /\b(?:cloud|infrastructure|security)\b/i.test(lowerDomain);

  const isMobile =
    /\b(?:mobile|ios|android|swift|kotlin|react\s*native|flutter)\b/i.test(lowerSubj) ||
    /\b(?:mobile)\b/i.test(lowerDomain);

  const isFilmmaking =
    /\b(?:film|cinema|movie|screenplay|directing|acting|cinematography|sound\s*design|video\s*editing)\b/i.test(lowerSubj) ||
    /\b(?:film)\b/i.test(lowerDomain);

  const domainType = isWebFrontend
    ? "web"
    : isSystemsBackend
    ? "backend"
    : isAIOrData
    ? "ai"
    : isDevOpsOrCloud
    ? "devops"
    : isMobile
    ? "mobile"
    : isFilmmaking
    ? "film"
    : "general";

  const stageTitles = isWebFrontend
    ? [
        "Semantic HTML5, Living Standards & Web Accessibility (WCAG 2.2 AA)",
        "Modern CSS Architecture, Box Model, Flexbox & CSS Grid Systems",
        "Modern JavaScript DOM, Event Propagation, Promises & Asynchronous APIs",
        "Component Architecture, Reactive State & Modern Frameworks",
        "Web Performance Optimization, Core Web Vitals & Security Hardening",
        "Full-Scale Production Web Capstone & Edge Cloud Deployment",
      ]
    : isSystemsBackend
    ? [
        `${safeSubj} Toolchain Setup, Memory Layout & Foundational Syntax`,
        `Core ${safeSubj} Data Structures, Error Handling & Control Flow`,
        `${safeSubj} Modular Architecture, REST/gRPC APIs & Database Persistence`,
        `High-Performance ${safeSubj} Concurrency, Memory Profiling & Optimization`,
        `${safeSubj} Automated Testing, Security Hardening & CI/CD Pipelines`,
        `Production ${safeSubj} Microservice Capstone & Cloud Deployment`,
      ]
    : isAIOrData
    ? [
        `${safeSubj} Toolchain Setup, Vectorized Math & Data Foundations`,
        `Exploratory Data Analysis, Feature Engineering & Statistics`,
        `Supervised & Unsupervised Machine Learning Algorithms`,
        `Deep Learning Foundations, PyTorch Tensors & Neural Architectures`,
        `Transformers, Large Language Models & Vector Search (RAG)`,
        `Production MLOps, Model Serving & Deployment Capstone`,
      ]
    : [
        `${safeSubj} Foundations, Toolchain Setup & Core Mental Models`,
        `Core ${safeSubj} Mechanics, Idiomatic Workflows & Standard Operations`,
        `Intermediate ${safeSubj} Architecture, Modular Design & Integration`,
        `Advanced ${safeSubj} Systems, Deep-Dive Techniques & Optimization`,
        `${safeSubj} Reliability, Quality Standards & Automated Verification`,
        `Production ${safeSubj} Capstone, Public Portfolio Release & Enterprise Evaluation`,
      ];

  const stages: ProgressiveProjectStage[] = stageTitles.map((title, idx) => ({
    stage: idx + 1,
    skillFocus: title,
    projectTitle: `${title.split(",")[0].split("&")[0].trim()} Project`,
    deliverables: `Verified Stage ${idx + 1} project deliverables, automated test suite, and case study`,
    complexity: idx === 0 ? "Beginner" : idx <= 2 ? "Intermediate" : idx <= 4 ? "Advanced" : "Production",
    status: idx === 0 ? "ACTIVE" : "UPCOMING",
  }));

  const nodes: RoadmapNode[] = stageTitles.map((title, idx) => {
    const level = idx + 1;
    const topics = buildDeepTopicsForDomainStage(safeSubj, domainType, level);
    const topicChecklist = topics.map((t) => ({ id: t.id, title: t.title, completed: false }));

    return {
      id: `dyn_node_${level}`,
      level,
      title,
      skill: title.split(":")[0].trim(),
      category: idx === 0 ? "Foundations" : idx <= 2 ? "Core Mechanics" : idx <= 4 ? "Advanced Systems" : "Capstone",
      concept: `Mastering in-depth principles, practical execution, and industry standards for ${title}.`,
      state: idx === 0 ? "IN_PROGRESS" : "LOCKED",
      whyLearnThis: `Stage ${level} delivers essential competencies in ${safeSubj} required to build robust, scalable real-world solutions.`,
      prerequisites: level === 1 ? ["Commitment to deliberate practice"] : [`Stage ${level - 1} Completion`],
      task: {
        title: `Execute Stage ${level} Deliverables`,
        description: `Implement the hands-on requirements, write automated tests, and complete the stage project for ${title}.`,
        deliverables: [
          `Verified Stage ${level} code or project artifact`,
          `Passing automated tests or validation checklist`,
          `Technical case study documentation`,
        ],
      },
      miniProject: {
        title: `${title.split("&")[0].split(",")[0].trim()} Milestone Lab`,
        description: `Practical application project demonstrating real-world mastery of Stage ${level} competencies.`,
        techStack: [safeSubj, "Automated Testing", "Git"],
        difficulty: level <= 2 ? "Beginner" : level <= 4 ? "Intermediate" : "Advanced",
        requirements: [
          `Satisfy all functional requirements with zero errors`,
          `Implement proper error handling and edge case validation`,
          `Document setup and architectural decisions clearly`,
        ],
      },
      learningObjectives: [
        `Understand core principles and mental models of ${title}`,
        `Write clean, idiomatic, and maintainable implementations`,
        `Identify and resolve common failure modes and anti-patterns`,
        `Deliver verifiable portfolio evidence demonstrating mastery`,
      ],
      topics,
      topicChecklist,
      practicalExercises: [
        {
          id: `ex_${level}_1`,
          title: `Hands-On Implementation Challenge`,
          prompt: `Implement a modular component or service applying the core topics of Stage ${level}.`,
          instructions: [
            `Review the stage topics, subtopics, and syntax demonstrations.`,
            `Implement the core algorithms or architecture in your workspace.`,
            `Test against boundary values and invalid inputs.`,
          ],
          expectedOutcome: `Working verified solution satisfying all requirements with 0 runtime errors.`,
          starterCode: `// Stage ${level}: ${title}\nfunction runChallenge() {\n  // Implement solution\n  return true;\n}`,
        },
        {
          id: `ex_${level}_2`,
          title: `Debugging & Refactoring Lab`,
          prompt: `Analyze an intentionally buggy implementation, identify anti-patterns, and refactor it into an idiomatic solution.`,
          instructions: [
            `Inspect failure modes and review common mistakes listed in this stage.`,
            `Refactor the implementation to use defensive guard clauses and proper typing.`,
          ],
          expectedOutcome: `Refactored solution passes 100% of validation assertions.`,
        },
      ],
      commonMistakesAndTroubleshooting: [
        {
          mistake: `Skipping defensive input validation and edge cases in Stage ${level}`,
          consequence: "Unexpected runtime exceptions, corrupted state, or security vulnerabilities.",
          solutionOrFix: "Add strict input bounds checking, schema validation, and guard clauses upfront.",
        },
        {
          mistake: `Ignoring automated testing until final integration`,
          consequence: "Regressions multiply and debugging becomes exponentially slower.",
          solutionOrFix: "Write automated assertions alongside implementation for rapid feedback.",
        },
        {
          mistake: `Violating single-responsibility principles in component/service design`,
          consequence: "Tight coupling makes refactoring and testing extremely difficult.",
          solutionOrFix: "Decompose monoliths into focused, modular functions with clear contracts.",
        },
      ],
      knowledgeCheck: [
        {
          question: `What are the primary architectural principles and tradeoffs introduced in Stage ${level}?`,
          answerOrExplanation: `Stage ${level} establishes modularity, type safety, and clean separation of concerns, balancing implementation velocity with long-term maintainability.`,
          solutionRubric: "Demonstrates clear grasp of architectural tradeoffs, edge cases, and design rationale.",
        },
        {
          question: `How do you systematically troubleshoot unexpected failures when executing Stage ${level} tasks?`,
          answerOrExplanation: "Inspect diagnostic logs, isolate components in test harnesses, verify environment configurations, and validate inputs against expected schemas.",
          solutionRubric: "Articulates a structured scientific debugging methodology rather than trial and error.",
        },
        {
          question: `What criteria distinguish production-ready work from an MVP prototype in Stage ${level}?`,
          answerOrExplanation: "Production readiness requires automated test coverage, defensive error handling, accessibility compliance, performance profiling, and comprehensive documentation.",
          solutionRubric: "Mentions observability, testing, error recovery, and security considerations.",
        },
      ],
      completionCriteria: [
        `All Stage ${level} topic checklists verified and thoroughly understood`,
        `Milestone project implemented and passing all functional test cases`,
        `Code adheres to ecosystem best practices with 0 unhandled warnings`,
        `Self-assessment knowledge check answered accurately`,
      ],
      assessment: {
        criterion: `Clean execution of Stage ${level} deliverables with zero runtime errors and verified test coverage.`,
        passingScore: 85,
      },
      estimatedStudyHours: 20 + level * 2,
      estimatedStudyTime: `${Math.round(1.5 + level * 0.3)} weeks`,
      freeResources: [
        {
          title: `Official ${safeSubj} Documentation & Reference Manual`,
          url: `https://developer.mozilla.org/en-US/`,
          platform: "Official Documentation",
          type: "docs",
          isFree: true,
        },
        {
          title: `${safeSubj} Best Practices & Architecture Guide`,
          url: `https://github.com/`,
          platform: "Open Source Guide",
          type: "tutorial",
          isFree: true,
        },
      ],
    };
  });

  return {
    id: roadmapId,
    ownerId: userId || "current_user",
    conversationId,
    title: `${safeSubj} Mastery Roadmap`,
    domain: domain || "Professional Discipline",
    subject: safeSubj,
    summary: `Comprehensive ${stageTitles.length}-stage progressive curriculum for ${safeSubj} covering foundational principles to production capstone deployment.`,
    roadmapType: "LEARNING",
    userObjective: `Master ${safeSubj} from basic syntax to advanced production-grade capstone deployment.`,
    experienceLevel: "All Levels",
    estimatedDuration: `${stageTitles.length} Stages · ~160 Study Hours · 12–16 Weeks at 2h/day`,
    version: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    goal: `${safeSubj} Mastery Roadmap`,
    targetRole: `${safeSubj} Specialist`,
    trackKey: `${safeSubj.toLowerCase().replace(/[^a-z0-9]/g, "_")}_mastery`,
    dailyStudyHours: 2.0,
    totalStudyHours: 160,
    overallProgress: 0,
    currentNodeId: "dyn_node_1",
    pointerLevel: 1,
    nodes,
    stages,
    lastUpdated: now,
  };
}

/**
 * Universal Roadmap Generator Factory
 */
/**
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

  const blueprintStage = roadmap.curriculumBlueprint?.stages?.find((s: any) => s.stage === stageNumber) || {
    stage: stageNumber,
    title: targetNode.title,
    skillFocus: targetNode.skill || targetNode.title,
    objective: targetNode.concept || `Master Stage ${stageNumber}`,
    prerequisites: targetNode.prerequisites || [],
    keyCompetencies: targetNode.learningObjectives || [],
    projectTitle: targetNode.miniProject?.title || `${targetNode.title} Project`,
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
    if (
      lower.includes("video edit") ||
      lower.includes("video-edit") ||
      cleanLower.includes("video edit") ||
      cleanLower.includes("video-edit")
    ) {
      raw = buildCompleteVideoEditingRoadmap(conversationId, userId);
    } else if (
      lower.includes("dsa") ||
      cleanLower.includes("dsa") ||
      lower.includes("data structure") ||
      cleanLower.includes("data structure") ||
      cleanLower.includes("algorithm")
    ) {
      raw = buildCompleteDSARoadmap(conversationId, userId);
    } else if (lower.includes("film") || lower.includes("cinema") || lower.includes("movie") || cleanLower.includes("film")) {
      raw = buildCompleteFilmmakingRoadmap(conversationId, userId);
    } else if ((lower.includes("java") || cleanLower.includes("java")) && !lower.includes("javascript") && !cleanLower.includes("javascript")) {
      raw = buildCompleteJavaRoadmap(conversationId, userId);
    } else if (lower.includes("python") || cleanLower.includes("python")) {
      raw = buildCompletePythonRoadmap(conversationId, userId);
    } else if (lower.includes("frontend") || lower.includes("html") || lower.includes("css") || cleanLower.includes("frontend")) {
      raw = buildCompleteFrontendRoadmap(conversationId, userId);
    } else if (
      /\b(?:machine\s*learning|deep\s*learning|data\s*science|artificial\s*intelligence|pytorch|tensorflow)\b/i.test(cleanLower) ||
      /\b(?:machine\s*learning|deep\s*learning|data\s*science)\b/i.test(lower) ||
      /\bai\b/i.test(cleanLower)
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

  // Ensure title and goal are strictly canonical without prompt fragments
  const canonicalTitle = getCanonicalRoadmapTitle(safeSubject, raw.roadmapType, prompt);
  raw.title = canonicalTitle;
  raw.goal = canonicalTitle;

  const { repairedRoadmap } = validateRoadmapCompleteness(raw, safeSubject);
  return repairedRoadmap;
}
