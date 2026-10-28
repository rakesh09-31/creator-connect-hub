/**
 * OmniForge Intent Classification & UI Action Orchestrator
 *
 * Provides explicit, typed intent classification and gates all side effects
 * (project creation, roadmap generation, Supabase creator matching, and missing-role cards).
 */

import { ChatMessage, OmniForgeProject } from "./types";
import { buildFilmRolePlanningResponse, COMPLETE_FILM_ROLE_TAXONOMY } from "./film-taxonomy";
import {
  buildDynamicMissingRolesResponse,
  buildCompleteFilmRoleMatrixResponse,
  isRoleMatch,
  SHORT_FILM_ROLE_DEFINITIONS,
  parseExplicitRoleRequirementRequest,
} from "./team-reconciliation";
import { buildMusicBandTeamArchitectureResponse } from "./requirements-engine";
import { detectCanonicalDomain } from "./domain-detector";
import { detectRoadmapSubject, buildUniversalRoadmap } from "./universal-roadmap";

export type UserIntent =
  | "GREETING"
  | "IDENTITY"
  | "CHAT"
  | "KNOWLEDGE"
  | "GENERAL_KNOWLEDGE"
  | "CAPABILITY_QUERY"
  | "FEATURE_EXPLANATION"
  | "ROLE_OR_CONCEPT_EXPLANATION"
  | "HOW_TO"
  | "CLARIFICATION"
  | "CREATIVE_ADVICE"
  | "CREATIVE_GENERATION"
  | "STORY_GENERATION"
  | "STORY_MODIFICATION"
  | "STORY_ANALYSIS"
  | "SCREENPLAY_GENERATION"
  | "CREATIVE_ANALYSIS"
  | "FEEDBACK"
  | "CRITIQUE"
  | "FILM_TEAM_PLANNING"
  | "PROJECT_ROLE_PLANNING"
  | "MULTI_ROLE_SEARCH"
  | "PROJECT_CREATION"
  | "PROJECT_CREATE"
  | "PROJECT_VIEW"
  | "PROJECT_MODIFICATION"
  | "PROJECT_MODIFY"
  | "PROJECT_ARCHITECTURE"
  | "PROJECT_SCHEDULE"
  | "PROJECT_ANALYSIS"
  | "TEAM_GAP_ANALYSIS"
  | "CREATOR_SEARCH"
  | "CREATOR_SEARCH_ALL"
  | "CREATOR_RECOMMEND"
  | "CREATOR_PROFILE"
  | "CREATOR_COMPARE"
  | "CREATOR_JOB_SEARCH"
  | "CLIENT_OPPORTUNITY_SEARCH"
  | "CLIENT_PROFILE"
  | "JOB_SEARCH"
  | "JOB_DETAILS"
  | "JOB_APPLICATION"
  | "APPLY_FOR_JOB"
  | "CLIENT_SEARCH"
  | "SQUAD_SEARCH"
  | "SQUAD_CREATE"
  | "SQUAD_VIEW"
  | "HIRE_SQUAD"
  | "INVITE_CREATOR"
  | "HIRE_CREATOR"
  | "SKILL_ANALYSIS"
  | "EXPAND_ROADMAP_STAGE"
  | "COMPARE_ROADMAPS"
  | "EXPLAIN_TOPIC"
  | "LEARNING_ROADMAP_REQUEST"
  | "PROJECT_EXECUTION_ROADMAP_REQUEST"
  | "ROADMAP_REQUEST"
  | "CAREER_ROADMAP"
  | "ROADMAP_CREATE"
  | "CREATE_NEW_ROADMAP"
  | "SAVE_ROADMAP"
  | "ROADMAP_CAPABILITY_INQUIRY"
  | "VIEW_SAVED_ROADMAP"
  | "VIEW_CURRENT_ROADMAP"
  | "MODIFY_ROADMAP"
  | "ROADMAP_MODIFY"
  | "CONTINUE_ROADMAP"
  | "LIST_SAVED_ROADMAPS"
  | "DELETE_ROADMAP"
  | "EXPLAIN_CURRENT_MILESTONE"
  | "TODAY_LEARNING_TASKS"
  | "GENERATE_TOPIC_EXERCISES"
  | "REVIEW_PROJECT_OR_CODE"
  | "ASSESS_SKILLS"
  | "MARK_MILESTONE_COMPLETE"
  | "RESUME_NEXT_MILESTONE"
  | "SKILL_GAP_REQUEST"
  | "NEXT_LEARNING_REQUEST"
  | "TASK_ACTION"
  | "RESUME_ANALYSIS_REQUEST"
  | "PROJECT_PLAN_REQUEST"
  | "PROGRESS_INQUIRY"
  | "CONCEPT_EXPLANATION"
  | "SKILL_SWAP"
  | "TEAM_FORMATION"
  | "FOLLOW_UP"
  | "FOLLOW_UP_PAGINATION"
  | "REFINE_SEARCH"
  | "COLLABORATION_ACTION"
  | "INVITATION_OR_COLLABORATION_ACTION"
  | "GENERAL_QUESTION"
  | "TECHNICAL_QUESTION"
  | "EDUCATIONAL_QUESTION"
  | "EXAM_PREPARATION"
  | "LAB_QUESTION"
  | "VIVA_QUESTION"
  | "PROGRAMMING_QUESTION"
  | "MATH_QUESTION"
  | "DEFINITION"
  | "EXPLANATION"
  | "UNKNOWN";

export type ProjectActionType = "NONE" | "CREATE_PROJECT" | "UPDATE_PROJECT" | "VIEW_PROJECT";
export type MatchingActionType =
  | "NONE"
  | "MATCH_ROLES"
  | "SEARCH_CREATORS"
  | "SEARCH_CINEMA_CREATORS"
  | "SEARCH_MULTI_ROLES"
  | "SEARCH_CLIENTS"
  | "SEARCH_CLIENT_OPPORTUNITIES"
  | "SEARCH_SQUADS"
  | "PAGINATE_SEARCH"
  | "REFINE_SEARCH"
  | "HIRE_SQUAD"
  | "HIRE_CREATOR"
  | "INVITE_CREATOR"
  | "RECOMMEND_CREATOR"
  | "FIND_THEM"
  | "SKILL_SWAP"
  | "APPLY_JOB"
  | "REQUIRE_ROLE"
  | "ADD_TO_TEAM";

export interface IntentActionResult {
  intent: UserIntent;
  confidence: number;
  project_action: ProjectActionType;
  matching_action: MatchingActionType;
  searchEntity?: "CREATORS" | "CLIENT_OPPORTUNITIES" | "SQUADS" | "JOBS" | "TALENT";
  targetRole?: string;
  targetName?: string;
  targetCreatorName?: string;
  targetJobTitle?: string;
  currentUserRole?: string;
  currentUserType?: "CREATOR" | "CLIENT";
  isUserDirector?: boolean;
  directorCoverage?: "COVERED_BY_USER" | "NEED_HIRE" | string;
  activeGoal?: "FIND_JOB" | "HIRE_TALENT" | "BUILD_PROJECT";
  scope?: "ALL" | "BATCH" | "SINGLE" | "TOP";
  limit?: number;
  skills?: string[];
  extractedRoles?: string[];
  projectData?: {
    title?: string;
    domain?: string;
    type?: string;
    genre?: string;
    story_premise?: string;
    budget?: string;
    team_size?: string;
    roles?: string[];
    requirements?: string[];
  };
  explanation?: string;
  deterministicText?: string;
  suggestedChips?: string[];
  careerGoal?: string;
  targetRoadmapId?: string;
  targetRoadmapTitle?: string;
  roadmapSubject?: string;
  roadmapDomain?: string;
  roadmapData?: any;
  requiresDatabase?: boolean;
  requiresKnowledge?: boolean;
  requiresLLM?: boolean;
  requiresAction?: boolean;
}

/**
 * Derives architectural hybrid routing flags:
 * requiresDatabase = live application truth (profiles, creators, squads, jobs, applications)
 * requiresKnowledge = authoritative RAG retrieval (film, architecture, engineering concepts)
 * requiresLLM = Qwen3:4B reasoning, generation, story writing, creative synthesis
 * requiresAction = state-mutating actions (inviting, hiring, applying, completing tasks)
 */
export function deriveHybridFlags(
  intent: UserIntent,
  query: string,
  extra?: { matching_action?: MatchingActionType; project_action?: ProjectActionType; hasDeterministicText?: boolean }
): {
  requiresDatabase: boolean;
  requiresKnowledge: boolean;
  requiresLLM: boolean;
  requiresAction: boolean;
} {
  const clean = query.trim();
  const lower = clean.toLowerCase();

  // 1. Actions mutating state
  const isAction = [
    "INVITE_CREATOR",
    "HIRE_CREATOR",
    "HIRE_SQUAD",
    "SQUAD_CREATE",
    "TASK_ACTION",
    "APPLY_FOR_JOB",
    "JOB_APPLICATION",
    "PROJECT_CREATE",
    "PROJECT_CREATION",
    "PROJECT_MODIFY",
    "PROJECT_MODIFICATION",
  ].includes(intent);

  // 2. Database requirements (Supabase authoritative truth: creators, squads, jobs, applications, members)
  const isDatabase =
    isAction ||
    [
      "CREATOR_SEARCH",
      "CREATOR_SEARCH_ALL",
      "CREATOR_RECOMMEND",
      "CREATOR_PROFILE",
      "CREATOR_COMPARE",
      "CREATOR_JOB_SEARCH",
      "CLIENT_OPPORTUNITY_SEARCH",
      "CLIENT_SEARCH",
      "SQUAD_SEARCH",
      "SQUAD_VIEW",
      "TEAM_GAP_ANALYSIS",
      "FILM_TEAM_PLANNING",
      "PROJECT_ROLE_PLANNING",
      "MULTI_ROLE_SEARCH",
      "SKILL_ANALYSIS",
      "SKILL_GAP",
      "SKILL_GAP_REQUEST",
    ].includes(intent) ||
    (extra?.matching_action && extra.matching_action !== "NONE") ||
    /\b(?:find|search(?:\s+for)?|show(?:\s+me)?|list|get\s+me)\s+(?:all\s+)?(?:the\s+)?(?:available\s+)?(?:creators|video\s+editors|actors|dancers|cinematographers|clients|squads)\b/i.test(lower) ||
    /\b(?:who\s+(?:is|are)\s+(?:still\s+)?missing|missing\s+roles?|who\s+is\s+in\s+my\s+squad|show\s+my\s+squad)\b/i.test(lower);

  // 3. Authoritative Knowledge retrieval (RAG)
  // Only invoke RAG for domain knowledge (film production, OmniCraft platform, creative workflows)
  // Pure general knowledge, science, programming, math, and definitions do NOT require RAG.
  const isDomainTopic = /\b(?:film|cinema|short\s+film|movie|screenplay|scene|shot|lighting|camera|lens|cinematograph|sound|audio|vfx|color|editing|omniforge|omnicraft|squad|creator|portfolio|hire|crew|cast|director|producer|actor|workflow)\b/i.test(lower);

  const isKnowledge =
    [
      "KNOWLEDGE",
      "ROLE_OR_CONCEPT_EXPLANATION",
      "FEATURE_EXPLANATION",
      "PROJECT_ARCHITECTURE",
    ].includes(intent) ||
    (
      isDomainTopic &&
      (
        ["CONCEPT_EXPLANATION", "EXPLANATION", "DEFINITION"].includes(intent) ||
        /\b(?:what\s+does\s+.*\s+do|define|explain|how\s+does\s+.*\s+work|workflow|fundamentals|principles|best\s+practices|why\s+is|architecture)\b/i.test(lower)
      )
    );

  // 4. Qwen reasoning / LLM generation
  // Pure fast-path intents skip LLM unless generative reasoning is required
  const isFastPath = isDeterministicIntent(intent, extra?.hasDeterministicText);
  const isLLM =
    !isFastPath &&
    (
      isKnowledge ||
      [
        "STORY_GENERATION",
        "STORY_MODIFICATION",
        "STORY_ANALYSIS",
        "SCREENPLAY_GENERATION",
        "CREATIVE_GENERATION",
        "CREATIVE_ADVICE",
        "CREATIVE_ANALYSIS",
        "CRITIQUE",
        "FEEDBACK",
        "PROJECT_ARCHITECTURE",
        "GENERAL_QUESTION",
        "TECHNICAL_QUESTION",
        "EDUCATIONAL_QUESTION",
        "EXAM_PREPARATION",
        "LAB_QUESTION",
        "VIVA_QUESTION",
        "PROGRAMMING_QUESTION",
        "MATH_QUESTION",
        "DEFINITION",
        "EXPLANATION",
        "NEXT_LEARNING_REQUEST",
      ].includes(intent)
    );

  return {
    requiresDatabase: Boolean(isDatabase),
    requiresKnowledge: Boolean(isKnowledge),
    requiresLLM: Boolean(isLLM),
    requiresAction: Boolean(isAction),
  };
}

/**
 * Returns true if the detected intent should be handled via the instant
 * deterministic fast path without invoking local Ollama / Qwen.
 */
export function isDeterministicIntent(intent: UserIntent, hasDeterministicText?: boolean): boolean {
  if (hasDeterministicText) return true;
  // Note: DEFINITION, GENERAL_KNOWLEDGE, KNOWLEDGE, and HOW_TO are purely generative
  // and MUST NOT be fast-pathed unless explicit deterministic text was produced.
  return [
    "GREETING",
    "IDENTITY",
    "CAPABILITY_QUERY",
    "FILM_TEAM_PLANNING",
    "PROJECT_ROLE_PLANNING",
    "PROJECT_ANALYSIS",
    "PROJECT_SCHEDULE",
    "PROJECT_ARCHITECTURE",
    "TEAM_GAP_ANALYSIS",
    "MULTI_ROLE_SEARCH",
    "CREATOR_SEARCH",
    "CREATOR_SEARCH_ALL",
    "CREATOR_RECOMMEND",
    "CREATOR_PROFILE",
    "CREATOR_COMPARE",
    "CREATOR_JOB_SEARCH",
    "CLIENT_OPPORTUNITY_SEARCH",
    "APPLY_FOR_JOB",
    "CLIENT_SEARCH",
    "SQUAD_SEARCH",
    "PROJECT_CREATE",
    "PROJECT_CREATION",
    "PROJECT_VIEW",
    "PROJECT_MODIFY",
    "PROJECT_MODIFICATION",
    "INVITE_CREATOR",
    "HIRE_CREATOR",
    "HIRE_SQUAD",
    "SKILL_SWAP",
    "SKILL_ANALYSIS",
    "SKILL_GAP",
    "ROADMAP_REQUEST",
    "CAREER_ROADMAP",
    "ROADMAP_CREATE",
    "CREATE_NEW_ROADMAP",
    "SAVE_ROADMAP",
    "ROADMAP_MODIFY",
    "MODIFY_ROADMAP",
    "CONTINUE_ROADMAP",
    "VIEW_CURRENT_ROADMAP",
    "VIEW_SAVED_ROADMAP",
    "LIST_SAVED_ROADMAPS",
    "DELETE_ROADMAP",
    "COMPARE_ROADMAPS",
    "EXPAND_ROADMAP_STAGE",
    "EXPLAIN_TOPIC",
    "ROADMAP_CAPABILITY_INQUIRY",
    "EXPLAIN_CURRENT_MILESTONE",
    "TODAY_LEARNING_TASKS",
    "GENERATE_TOPIC_EXERCISES",
    "REVIEW_PROJECT_OR_CODE",
    "ASSESS_SKILLS",
    "MARK_MILESTONE_COMPLETE",
    "RESUME_NEXT_MILESTONE",
    "SKILL_GAP_REQUEST",
    "NEXT_LEARNING_REQUEST",
    "TASK_ACTION",
    "RESUME_ANALYSIS_REQUEST",
    "PROJECT_PLAN_REQUEST",
    "PROGRESS_INQUIRY",
    "CONCEPT_EXPLANATION",
    "TEAM_FORMATION",
    "FOLLOW_UP",
    "FOLLOW_UP_PAGINATION",
    "REFINE_SEARCH",
    "CLARIFICATION",
    "COLLABORATION_ACTION",
  ].includes(intent);
}

const GREETING_REGEX = /^\s*(?:hi|hlo|hello|hey|heyy+|greetings|good\s+(?:morning|afternoon|evening|day)|sup|yo|namaste|vanakkam)[\s!.,?]*$/i;

const CLARIFICATION_NEGATION_REGEX = /\b(?:i\s+did(?:n['’]t| not)\s+ask|i\s+do(?:n['’]t| not)\s+ask|i\s+asked\s+(?:whether|if|you\s+to\s+do)|didn['’]t\s+ask\s+you\s+to|not\s+asking\s+(?:you\s+)?to\s+find|stop\s+searching|don['’]t\s+search|did\s+i\s+ask\s+you\s+to|i\s+am\s+not\s+asking\s+to\s+find)\b/i;

const IDENTITY_REGEX = /^(?:(?:what\s+is|what['’]?s)\s+your\s+name|who\s+(?:are|r)\s+you|what\s+are\s+you|tell\s+me\s+about\s+yourself|who\s+(?:made|created)\s+you)[\s.?!]*$/i;

const CAPABILITY_QUERY_REGEX = /^(?:(?:what\s+can\s+you\s+(?:do|help(?:\s+me)?(?:\s+with)?)|what\s+are\s+your\s+capabilities|how\s+can\s+you\s+help(?:\s+me)?|what\s+do\s+you\s+do|(?:(?:so\s+)?(?:can|could|do|are|would)\s+you\s+(?:able\s+to\s+)?(?:find|search|discover|hire|look\s+up|help\s+find|match|connect))|is\s+it\s+possible\s+to\s+find|do\s+you\s+find|can\s+you\s+find))\b/i;

const HOW_TO_DETECTION_PATTERNS = [
  /\bhow\s+(?:do\s+i|can\s+i|to|should\s+i|would\s+i|does\s+one|can\s+we|do\s+we)\b/i,
  /\b(?:where\s+(?:can\s+i|do\s+i|should\s+i|could\s+i|to))\s+(?:find|hire|recruit|source|get)\b/i,
  /\bwhere\s+can\s+i\b/i,
  /\bwhat\s+are\s+(?:good\s+|the\s+best\s+|best\s+)?ways\s+to\b/i,
  /\bhow\s+should\s+i\s+(?:recruit|hire|source|find|approach|choose|select)\b/i,
  /\bwhat\s+(?:should\s+i|to)\s+look\s+for\b/i,
  /\bwhat\s+(?:skills?|qualities|criteria|qualifications)\s+should\s+.*\s+(?:have|possess|need)\b/i,
  /\bwhat\s+makes\s+a\s+good\b/i,
  /\bhow\s+do\s+i\s+recruit\b/i,
  /\bhow\s+to\s+recruit\b/i,
  /\b(?:explain\s+how|explain\s+the\s+steps|what\s+are\s+the\s+steps|steps\s+to|tell\s+me\s+how)\b/i,
  /\b(?:can\s+you\s+explain|could\s+you\s+explain|please\s+explain)\b/i,
  /\b(?:guide\s+me(?:\s+on|\s+through)?|walk\s+me\s+through)\b/i,
  /\b(?:what\s+is\s+the\s+process|what['’]?s\s+the\s+process|process\s+for|process\s+to)\b/i,
  /\bhow\s+does\s+.*\s+work\b/i,
  /\bwhat\s+does\s+.*\s+involve\b/i,
  /\bexplain\s+(?:creator\s+hiring|squad\s+hiring|hiring|invitations?|skill\s*swap)\b/i,
  /\b(?:show\s+me\s+how|teach\s+me\s+how)\b/i,
  /\bwhat\s+does\s+(?:a\s+|an\s+|the\s+)?[\w\s]+\s+do\b/i,
  /\bhow\s+(?:do\s+i|can\s+i)\s+(?:find|hire|locate|source|recruit|connect\s+with)\s+(?:an?\s+|the\s+)?(?:cinematographer|video\s+editor|actor|director|developer|designer|musician|creator)\b/i,
];

export const DETERMINISTIC_DEFINITIONS: Record<string, string> = {
  cinematographer:
    "A cinematographer (also called the Director of Photography or DoP) is the chief of the camera and lighting crew on a film or video production. They are responsible for making artistic and technical decisions regarding image capture, camera choice, lenses, framing, composition, exposure, camera movements, and lighting design to realize the director's visual vision.",
  stress:
    "Stress means a state of mental or emotional pressure or tension caused by challenging or demanding situations.",
  motivation:
    "Motivation is the internal drive, desire, or reason that stimulates, directs, and sustains goal-oriented behavior and action.",
  leadership:
    "Leadership is the ability to inspire, guide, influence, and support individuals or teams toward achieving a shared goal or vision.",
  teamwork:
    "Teamwork is the collaborative effort of a group of people working together effectively and cooperatively to achieve a common objective.",
  anxiety:
    "Anxiety is an emotion characterized by feelings of tension, worried thoughts, and physical changes in response to perceived stress or uncertainty.",
  resilience:
    "Resilience is the ability to adapt, recover, and bounce back effectively from adversity, difficult life challenges, or stress.",
  creativity:
    "Creativity is the ability to generate novel, valuable ideas, solutions, or expressions across artistic, technical, or practical domains.",
  collaboration:
    "Collaboration is the practice of individuals or teams working together toward a common purpose to achieve shared results.",
  empathy:
    "Empathy is the capacity to understand, share, and be sensitive to the feelings, thoughts, and experiences of another person.",
  discipline:
    "Discipline is the practice of training oneself to follow rules, stay focused, and maintain consistent habits to achieve personal or professional goals.",
  burnout:
    "Burnout is a state of emotional, physical, and mental exhaustion caused by excessive and prolonged stress.",
};

export function formatRoadmapConversationalOverview(roadmap: any): string {
  if (!roadmap) return "";
  const isExecution = roadmap.roadmapType === "EXECUTION";
  const icon = isExecution ? "📱" : "🎯";
  const typeName = isExecution ? "Project Execution Plan" : "Master Learning Curriculum";
  
  // 1. What the roadmap will help them achieve
  const achievement = roadmap.userObjective || `Master end-to-end capabilities and production deliverables in ${roadmap.title}.`;
  
  // 2. Proposed progression
  const stageCount = roadmap.stages?.length || 0;
  const progressionSummary = (roadmap.stages || []).slice(0, 5).map((s: any) => `• **${isExecution ? "Phase" : "Stage"} ${s.stage}:** ${s.skillFocus}`).join("\n") +
    (stageCount > 5 ? `\n• *...plus ${stageCount - 5} additional progressive ${isExecution ? "phases" : "stages"} (through Capstone launch)*` : "");

  // 3. Major projects
  const majorProjects = (roadmap.stages || []).slice(0, 4).map((s: any) => `• **${s.projectTitle}:** ${s.deliverables}`).join("\n");

  // 4. Expected completion evidence
  const completionEvidence = isExecution
    ? "• Verified acceptance criteria sign-offs\n• Automated test suite passing in CI\n• Production deployment live on target domain"
    : "• Hands-on exercises passing with zero unhandled warnings\n• Evaluated knowledge checks with rubric compliance\n• Working milestone code repositories and capstone release";

  // 5. How to begin the first stage
  const firstStage = roadmap.stages?.[0];
  const firstStageTitle = firstStage ? `${isExecution ? "Phase" : "Stage"} 1: ${firstStage.skillFocus}` : "Stage 1";
  const howToBegin = `Your roadmap is now active in the Roadmap Journey view. Start by opening **${firstStageTitle}**, reviewing the foundational topics and worked examples, and completing the Stage 1 practical milestone!`;

  return `### ${icon} ${roadmap.title} (${typeName})\n\n` +
    `**What you will achieve:**\n${achievement}\n\n` +
    `**Proposed Progression (${stageCount} ${isExecution ? "Phases" : "Stages"}):**\n${progressionSummary}\n\n` +
    `**Major Milestone Deliverables:**\n${majorProjects}\n\n` +
    `**Expected Completion Evidence:**\n${completionEvidence}\n\n` +
    `**How to Begin:**\n${howToBegin}`;
}

export const RESUME_NEXT_MILESTONE_REGEX =
  /\b(?:continue\s+my\s+current\s+journey|resume\s+my\s+current\s+journey|resume\s+(?:the\s+)?next\s+incomplete\s+milestone|continue\s+learning|resume\s+(?:my\s+)?roadmap|take\s+me\s+to\s+where\s+i\s+left\s+off|jump\s+to\s+(?:next\s+)?incomplete)\b/i;

export const EXPLAIN_CURRENT_MILESTONE_REGEX =
  /\b(?:explain\s+(?:the\s+|my\s+)?(?:current\s+|active\s+)?milestone|explain\s+milestone\s+\d+|what\s+is\s+my\s+current\s+milestone|tell\s+me\s+about\s+(?:this|the\s+current)\s+milestone|what\s+am\s+i\s+working\s+on\s+right\s+now)\b/i;

export const TODAY_LEARNING_TASKS_REGEX =
  /\b(?:give\s+me\s+today['’]?s\s+learning\s+tasks|what\s+are\s+today['’]?s\s+(?:learning\s+)?tasks|what\s+should\s+i\s+learn\s+today|today['’]?s\s+learning\s+tasks|daily\s+(?:learning\s+)?tasks?|what\s+are\s+my\s+tasks\s+for\s+today)\b/i;

export const GENERATE_TOPIC_EXERCISES_REGEX =
  /\b(?:generate|give\s+me|create|practice)\s+(?:some\s+)?(?:exercises?|challenges?|practice\s+problems?)\s+for\s+([a-z0-9\s\.\-#\+]+)\b|\bexercises?\s+for\s+([a-z0-9\s\.\-#\+]+)\b|\bpractice\s+exercises?\s+on\s+([a-z0-9\s\.\-#\+]+)\b/i;

export const REVIEW_PROJECT_OR_CODE_REGEX =
  /\b(?:review\s+(?:my\s+)?(?:project\s+or\s+code|code|project|submission|implementation|solution)|code\s+review|can\s+you\s+review\s+my\s+code|here\s+is\s+my\s+code)\b/i;

export const ASSESS_SKILLS_REGEX =
  /\b(?:assess\s+my\s+skills?|evaluate\s+my\s+skills?|skill\s+assessment|test\s+my\s+skills?|audit\s+my\s+skills?)\b/i;

export const MARK_MILESTONE_COMPLETE_REGEX =
  /\b(?:mark\s+(?:a\s+|the\s+|this\s+)?milestone\s+(?:as\s+)?complete|mark\s+milestone\s+\d+\s+(?:as\s+)?complete|mark\s+stage\s+\d+\s+complete|i\s+(?:have\s+)?finished\s+this\s+milestone|completed\s+milestone\s+evidence)\b/i;

export const ROADMAP_CAPABILITY_INQUIRY_REGEX =
  /^(?:can\s+you|could\s+you|do\s+you|are\s+you\s+able\s+to|how\s+do\s+you)\s+(?:create|make|generate|build|provide)\s+(?:a\s+|an\s+|any\s+)?roadmaps?\??$/i;

export const ROADMAP_CAPABILITY_PHRASE_REGEX =
  /\b(?:can\s+you\s+(?:create|make|generate|build|provide)\s+(?:a\s+|an\s+|any\s+)?roadmap\??|do\s+you\s+create\s+roadmaps\??|what\s+is\s+a\s+roadmap\??|how\s+do\s+roadmaps?\s+work\??)\b/i;

export const CONTINUE_ROADMAP_REGEX =
  /\b(?:continue|resume|stay\s+on|keep)\s+(?:my\s+)?(?:previous|current|saved|active)?\s*roadmap\b/i;

export const EXPAND_STAGE_REGEX =
  /\b(?:expand|detail|deep\s*dive\s*into|open\s*up)\s+(?:stage|milestone|phase)\s+(\d+)\b|\b(?:expand|detail)\s+(?:the\s+)?(\w+)\s+(?:stage|milestone|phase)\b/i;

export const COMPARE_ROADMAPS_REGEX =
  /\b(?:compare|contrast|summarize|overview\s+of)\s+(?:all\s+)?(?:of\s+)?(?:my\s+)?(?:saved\s+)?(?:roadmaps|tracks|curricula)\b|\bcompare\s+([a-zA-Z0-9\s]+?)\s+and\s+([a-zA-Z0-9\s]+?)\s+roadmaps?\b/i;

export const DELETE_ROADMAP_EXPLICIT_REGEX =
  /\b(?:delete|remove|clear)\s+(?:the\s+|my\s+)?([a-zA-Z0-9\s\-]+?)\s+roadmap\b|\bdelete\s+(?:the\s+|this\s+|current\s+)?roadmap\b/i;

export const EXPLAIN_TOPIC_REGEX =
  /\b(?:explain|clarify|elaborate\s+on|tell\s+me\s+more\s+about)\s+(?:the\s+topic\s+|topic\s+)?([a-zA-Z0-9\s\-#+._]+)\b|\bexplain\s+further\b/i;

export const SAVE_ROADMAP_REGEX =
  /\b(?:(?:add|save|persist|store|keep|put)\s+(?:this|it|the|my|active|current)?\s*(?:roadmap|curriculum|plan|journey|track)?\s*(?:to\s+(?:my\s+)?(?:saved\s+)?(?:roadmaps?|curriculums?|plans?|tracks?)\s*(?:section|list|sidebar|tab|library)?|in\s+(?:my\s+)?(?:saved\s+)?(?:roadmaps?|curriculums?|plans?|tracks?)|to\s+(?:the\s+)?roadmaps?\s+section)|save\s+(?:this|it|the|my)?\s*(?:roadmap|curriculum|plan|journey|track)?|add\s+to\s+(?:my\s+)?roadmaps?\s*(?:section)?|save\s+to\s+(?:my\s+)?roadmaps?\s*(?:section)?|bookmark\s+(?:this|it|the)?\s*(?:roadmap)?)\b/i;

export const SKILL_INQUIRY_REGEX =
  /^(?:what\s+skills?\s+(?:do\s+i\s+need|are\s+needed|are\s+required|should\s+i\s+learn)(?:\s+to\s+become|\s+for|\s+to\s+be)?\s+(?:a\s+|an\s+)?([A-Za-z0-9_\-\s\+\#\.\/]+?)|how\s+(?:do\s+i|can\s+i|to)\s+become\s+(?:a\s+|an\s+)?([A-Za-z0-9_\-\s\+\#\.\/]+?)|skills?\s+(?:needed|required)\s+for\s+(?:a\s+|an\s+)?([A-Za-z0-9_\-\s\+\#\.\/]+?))[\?\.\s]*$/i;

export const CREATE_NEW_ROADMAP_REGEX =
  /\b(?:create|generate|make|build|give\s+me|design|draft)\s+(?:a\s+|an\s+|new\s+)?(?:dedicated\s+|structured\s+|complete\s+)?(?:learning\s+|execution\s+|career\s+)?roadmaps?\s+(?:for|on|about|in)\s+([a-zA-Z0-9\s\+\#\.\-]+)/i;

export const VIEW_SAVED_ROADMAP_REGEX =
  /\b(?:view|show|display|open)\s+(?:the\s+|my\s+)?([a-zA-Z0-9\s\-]+?)\s+roadmap\b/i;

export const VIEW_CURRENT_ROADMAP_REGEX =
  /\b(?:(?:view|show|display|open)\s+(?:the\s+|my\s+)?(?:current\s+|complete\s+|active\s+)?roadmap|where\s+am\s+i\s+on\s+(?:the|my)\s+roadmap|my\s+learning\s+roadmap)\b/i;

export const LIST_ALL_ROADMAPS_REGEX =
  /\b(?:show|view|display|list|get)\s+(?:all\s+)?(?:of\s+)?(?:my\s+)?(?:saved\s+)?roadmaps\b|\bmy\s+saved\s+roadmaps\b|\ball\s+(?:my\s+)?roadmaps\b|\bwhat\s+roadmaps\s+do\s+i\s+have\b|\blist\s+my\s+roadmaps\b/i;

export const CREATOR_PROFILE_REGEX =
  /\b(?:(?:view|show|see|open|display)\s+(?:the\s+)?profile(?:\s+of)?(?:\s+@?([a-zA-Z0-9_\-]+))?|profile\s+of\s+@?([a-zA-Z0-9_\-]+)|tell\s+me\s+about\s+@?([a-zA-Z0-9_\-]+)|who\s+is\s+@?([a-zA-Z0-9_\-]+))\b/i;

export const CREATE_SEPARATE_FRONTEND_ROADMAP_REGEX =
  /\b(?:create\s+a\s+separate\s+html\/frontend\s+roadmap|create\s+separate\s+html\s+roadmap|separate\s+frontend\s+roadmap|create\s+(?:an?\s+)?html\s+(?:and\s+frontend\s+)?learning\s+roadmap|build\s+html\s+roadmap)\b/i;

export const CAREER_GOAL_ROADMAP_REGEX =
  /\b(?:i\s+want\s+to\s+(?:become|be)|my\s+goal\s+is\s+to\s+(?:become|be))\s+(?:a\s+|an\s+)?(full\s*stack\s*developer|software\s*engineer|ai\s*engineer|machine\s*learning\s*engineer|cybersecurity\s*engineer|web\s*developer|frontend\s*developer|backend\s*developer|data\s*scientist)\b/i;

export const ROADMAP_EXPLICIT_REGEX =
  /\b(?:(?:i\s+want|i\s+need|need|give\s+me|create|generate|build|make|show\s+me|provide)\s+(?:a\s+|an\s+|new\s+)?(?:[a-z0-9\s\-]+?\s+)?(?:career\s+|learning\s+|execution\s+|project\s+)?roadmaps?|(?:[a-z0-9\s\+\#\.\-]+?\s+)?(?:career\s+|learning\s+|execution\s+|project\s+)?roadmaps?\s+(?:for|on|in|about|to)\s+[a-z0-9\s\+\#\.\-]+|roadmaps?\s+(?:for|on|in|about|to)\s+[a-z0-9\s\+\#\.\-]+|[a-z0-9\s\+\#\.\-]+?\s+roadmaps?|(?:i\s+(?:want|need|wish|would\s+like)\s+to\s+learn\s+[a-zA-Z0-9\s\+\#\.\-]+))\b/i;

export const SKILL_GAPS_REGEX =
  /\b(?:show|view|what\s+are|display|check)\s+(?:my\s+)?skill\s+gaps?\b|\bskill\s+gap\s+matrix\b|\bhow\s+do\s+my\s+skills\s+compare\b/i;

export const WHAT_TO_LEARN_NEXT_REGEX =
  /\bwhat\s+(?:should|to|do)\s+i\s+learn\s+next\b|\bwhat\s+to\s+learn\s+next\b|\bwhat\s+next\b|\bwhat\s+skill\s+should\s+i\s+learn\b|\bwhat\s+should\s+i\s+do\s+now\b|\bwhat\s+to\s+do\s+now\b|\bwhat\s+now\b/i;

export const TASK_ACTION_REGEX =
  /\b(?:start|begin|open|work\s+on)\s+(?:the\s+)?(?:[a-z0-9\s\-]+?\s+)?project\b|\b(?:complete|finish|mark\s+complete|done)\s+(?:this\s+)?task\b|\btask\s+(?:is\s+)?completed\b|\b(?:can\s+i\s+)?skip\s+(?:it|this\s+(?:task|project|milestone|stage))?\b|\bwhy\s+can'?t\s+i\s+skip\b/i;

export const RESUME_ANALYSIS_REGEX =
  /\b(?:analyze|check|parse|upload|review)\s+(?:my\s+)?resume\b|\bhere\s+is\s+my\s+resume\b|\bextract\s+(?:my\s+)?skills?\b/i;

export const PROJECT_PLAN_ENGINE_REGEX =
  /\b(?:i\s+want\s+to\s+build|plan|build)\s+(?:an?\s+)?(?:ai[\s\-]?powered\s+)?(?:food\s+delivery|restaurant|dining|ecommerce|saas|delivery)\s+(?:platform|application|app)\b|\bcreate\s+(?:a\s+)?project\s+plan\b/i;

export const PROGRESS_INQUIRY_REGEX =
  /\bhow\s+close\s+am\s+i\s+to\s+becoming\b|\bshow\s+(?:my\s+)?progress\b|\bhow\s+is\s+my\s+progress\b/i;

export const WHY_LEARN_THIS_REGEX =
  /\bwhy\s+am\s+i\s+learning\s+this\b|\bwhy\s+should\s+i\s+learn\s+this\b|\bwhy\s+this\s+skill\b|\bexplain\s+this\s+concept\b/i;

export function isValidDefinitionTerm(term: string): boolean {
  const clean = term.toLowerCase().trim();
  if (!clean) return false;
  const invalidTerms = [
    "your name",
    "you",
    "yourself",
    "it",
    "this",
    "that",
    "there",
    "my project",
    "the project",
    "this project",
    "our project",
    "the plan",
    "my plan",
    "the steps",
    "next",
    "more",
    "now",
  ];
  if (invalidTerms.includes(clean)) return false;
  if (/\b(?:roles?\s+do\s+i\s+need|roles?\s+needed|people\s+i\s+need)\b/i.test(clean)) return false;
  if (/\b(?:ways\s+to|how\s+to|steps\s+to|methods\s+to|best\s+way|process\s+to)\b/i.test(clean)) return false;
  return true;
}

export function extractDefinitionTerm(cleanText: string): string | null {
  const clean = cleanText.trim().replace(/^["']|["']$/g, "");
  const lower = clean.toLowerCase();

  // Guard against identity queries ("who are you", "what is your name")
  if (IDENTITY_REGEX.test(clean)) return null;

  // Guard against platform capability queries ("what can you do")
  if (CAPABILITY_QUERY_REGEX.test(lower)) return null;

  // Guard against greetings
  if (GREETING_REGEX.test(clean)) return null;

  // Guard against procedural/how-to queries ("what are good ways to...", "what are the steps to...", "what is the process for...")
  if (/\b(?:ways\s+to|steps\s+to|how\s+to|methods\s+to|process\s+(?:for|to|of)|the\s+process)\b/i.test(lower)) return null;

  // Guard against explicit project queries
  if (
    /\b(?:my\s+project|this\s+project|the\s+project|project\s+plan|project\s+requirements|project\s+budget|project\s+timeline|our\s+project|film\s+plan|festival\s+plan|production\s+plan)\b/i.test(
      lower
    )
  ) {
    return null;
  }

  // Pattern 1: What is / What's / What are [the meaning/definition of] <term>
  const p1 = clean.match(
    /^(?:what\s+is|what['’]?s|what\s+are)\s+(?:an?\s+|the\s+)?(?:meaning\s+of\s+|definition\s+of\s+)?([A-Za-z0-9_\-\s\+\#\.\/]+?)[\?\.\s]*$/i
  );
  if (p1) {
    const term = p1[1].trim();
    if (isValidDefinitionTerm(term)) return term;
  }

  // Pattern 2: What does <term> mean?
  const p2 = clean.match(
    /^(?:what\s+does\s+)(?:the\s+word\s+|the\s+term\s+|an?\s+|the\s+)?([A-Za-z0-9_\-\s\+\#\.\/]+?)\s+mean[\?\.\s]*$/i
  );
  if (p2) {
    const term = p2[1].trim();
    if (isValidDefinitionTerm(term)) return term;
  }

  // Pattern 2b: What does <term> do?
  const p2b = clean.match(
    /^(?:what\s+does\s+)(?:an?\s+|the\s+)?([A-Za-z0-9_\-\s\+\#\.\/]+?)\s+do[\?\.\s]*$/i
  );
  if (p2b) {
    const term = p2b[1].trim();
    if (isValidDefinitionTerm(term)) return term;
  }

  // Pattern 3: What do you mean by <term>?
  const p3 = clean.match(
    /^(?:what\s+do\s+you\s+mean\s+by\s+)(?:an?\s+|the\s+)?([A-Za-z0-9_\-\s\+\#\.\/]+?)[\?\.\s]*$/i
  );
  if (p3) {
    const term = p3[1].trim();
    if (isValidDefinitionTerm(term)) return term;
  }

  // Pattern 4: Define / Definition of / Meaning of <term>
  const p4 = clean.match(
    /^(?:define|definition\s+of|meaning\s+of)\s+(?:an?\s+|the\s+)?([A-Za-z0-9_\-\s\+\#\.\/]+?)[\?\.\s]*$/i
  );
  if (p4) {
    const term = p4[1].trim();
    if (isValidDefinitionTerm(term)) return term;
  }

  // Pattern 5: <term> meaning
  const p5 = clean.match(/^([A-Za-z0-9_\-\s\+\#\.\/]+?)\s+meaning[\?\.\s]*$/i);
  if (p5) {
    const term = p5[1].trim();
    if (isValidDefinitionTerm(term)) return term;
  }

  // Pattern 6: Tell me / explain the meaning/definition of <term>
  const p6 = clean.match(
    /^(?:can\s+you\s+)?(?:tell\s+me\s+|give\s+me\s+|explain\s+)?(?:the\s+)?(?:meaning|definition)\s+of\s+(?:an?\s+|the\s+)?([A-Za-z0-9_\-\s\+\#\.\/]+?)[\?\.\s]*$/i
  );
  if (p6) {
    const term = p6[1].trim();
    if (isValidDefinitionTerm(term)) return term;
  }

  return null;
}

export function isHowToQuery(cleanText: string): boolean {
  if (extractDefinitionTerm(cleanText)) return false;
  const lower = cleanText.toLowerCase();
  return HOW_TO_DETECTION_PATTERNS.some((pattern) => pattern.test(lower));
}

const PLATFORM_KNOWLEDGE_REGEX = /^(?:what\s+is|what['’]?s|define)\s+(?:an?\s+|the\s+)?(hiring|creator\s+collaboration|collaboration|creator|creators|squad|creative\s+squad|squads|skill\s*swap|omnicraft|omniforge)[\s.?!]*$/i;

const HIRE_SQUAD_EXECUTION_REGEX = /^(?:(?:ok|okay|please)\s*,?\s*)?(?:hire|book|acquire)\s+(?:this\s+squad|the\s+squad|squad)\b/i;

const HIRE_CREATOR_EXECUTION_REGEX = /^(?:(?:ok|okay|please)\s*,?\s*)?(?:hire\s+(?:this\s+creator|creator|@[\w.-]+|([A-Za-z0-9_.-]+))|send\s+(?:an?\s+)?offer(?:\s+to\s+(?:this\s+creator|creator|@?[\w.-]+))?|hire\s+a\s+creator\s+for\s+my\s+project)\b/i;

const INVITE_CREATOR_EXECUTION_REGEX = /^(?:(?:ok|okay|please)\s*,?\s*)?(?:invite\s+(?:this\s+creator|creator|@[\w.-]+|([A-Za-z0-9_.-]+))|send\s+(?:an?\s+)?invitation(?:\s+to\s+(?:this\s+creator|creator|@?[\w.-]+))?)\b/i;

function extractHireTarget(text: string): string {
  const clean = text.trim();
  const atMatch = clean.match(/@([A-Za-z0-9_.-]+)/);
  if (atMatch) return `@${atMatch[1]}`;

  if (/\b(?:this\s+creator)\b/i.test(clean)) return "this creator";
  if (/\b(?:a\s+creator)\b/i.test(clean)) return "a creator";

  const offerToMatch = clean.match(/\bsend\s+(?:an?\s+)?offer\s+to\s+([A-Za-z0-9_.-]+)\b/i);
  if (offerToMatch && !["this", "the", "a"].includes(offerToMatch[1].toLowerCase())) {
    return offerToMatch[1].trim();
  }

  const hireMatch = clean.match(/\bhire\s+([A-Za-z0-9_.-]+)\b/i);
  if (hireMatch && !["this", "the", "a", "creator", "squad"].includes(hireMatch[1].toLowerCase())) {
    return hireMatch[1].trim();
  }

  return "the creator";
}

function extractInviteTarget(text: string): string {
  const clean = text.trim();
  const atMatch = clean.match(/@([A-Za-z0-9_.-]+)/);
  if (atMatch) return `@${atMatch[1]}`;

  if (/\b(?:this\s+creator)\b/i.test(clean)) return "this creator";

  const invToMatch = clean.match(/\bsend\s+(?:an?\s+)?invitation\s+to\s+([A-Za-z0-9_.-]+)\b/i);
  if (invToMatch && !["this", "the", "a"].includes(invToMatch[1].toLowerCase())) {
    return invToMatch[1].trim();
  }

  const invMatch = clean.match(/\binvite\s+([A-Za-z0-9_.-]+)\b/i);
  if (invMatch && !["this", "the", "a", "creator"].includes(invMatch[1].toLowerCase())) {
    return invMatch[1].trim();
  }

  return "the creator";
}

const STORY_GEN_REGEX =
  /\b(?:(?:write|generate|create|craft|tell\s+me|give\s+me|come\s+up\s+with)\s+(?:me\s+)?(?:a\s+|an\s+|the\s+)?(?:[\w\s]{0,35}\s+)?(?:story|screenplay|script|logline|synopsis|scene|dialogue|pitch|plot)|(?:direct|make|produce)\s+(?:a\s+|an\s+|the\s+)?(?:[\w\s]{0,30}\s+)?(?:short\s+film|film|movie)\s+(?:on|about|with)?\s*[\w\s]{0,30}?\s*(?:so\s+)?(?:generate|write|create|tell\s+me)\s+(?:a\s+|an\s+|the\s+)?(?:[\w\s]{0,25}\s+)?(?:story|screenplay|script)|(?:write|create)\s+(?:a\s+)?character)\b/i;

const STORY_ANALYSIS_REGEX =
  /\b(?:loopholes?|weaknesses?|plot\s*holes?|issues?|flaws?|drawbacks?|pacing\s+issues?|honest\s+feedback|critique\s+(?:this|my\s+story|the\s+story|this\s+story)|what\s+is\s+wrong\s+with\s+(?:this|the)\s+story|what\s+needs\s+improvement\s+in\s+(?:this|the)\s+story|feedback\s+on\s+(?:this|my)?\s*(?:story|script))\b/i;

const STORY_MOD_REGEX =
  /\b(?:make\s+(?:it|the\s+story|this\s+story|the\s+film|the\s+script|this)?\s*more\s+\w+|change\s+(?:the\s+)?ending|add\s+(?:a\s+)?(?:villain|antagonist|rival|conflict|twist|character)|make\s+it\s+suitable\s+for|make\s+(?:the\s+)?dialogue\s+more\s+\w+|(?:convert|turn|adapt)\s+(?:it|this|the\s+story)?\s*(?:in)?to\s+(?:a\s+)?(?:screenplay|script)|convert\s+(?:it\s+)?to\s+screenplay|make\s+(?:it|the\s+story)\s+culturally\s+authentic|rewrite\s+(?:this|it|the\s+story)|shorten\s+(?:this|it|the\s+story)|expand\s+(?:this|it|the\s+story)|improve\s+(?:the\s+)?dialogue)\b/i;

const VIVA_REGEX = /\b(?:viva\s*questions?|(?:lab\s+)?viva)\b/i;
const LAB_REGEX = /\b(?:lab\s+(?:important\s+)?questions?|lab\s+experiments?|lab\s+manual|lab\s+programs?)\b/i;
const EXAM_PREP_REGEX = /\b(?:\d+\s*mark\s+answers?\s+for|exam\s+preparation|important\s+questions?\s+for|semester\s+exam)\b/i;
const PROGRAMMING_REGEX = /\b(?:(?:write|give\s+me|generate|show\s+me)\s+(?:a\s+)?(?:[\w\+\#\s]+\s+)?(?:program|code|script)|implement\s+(?:a\s+)?(?:[\w\+\#\s]+\s+)?(?:in\s+\w+)|(?:how\s+(?:can|do)\s+i\s+)?learn\s+python|python\s+code|binary\s+search(?:\s+program|\s+code)?)\b/i;
const MATH_REGEX = /\b(?:calculate|solve\s+(?:the|this)|derivative\s+of|integral\s+of|eigenvalue|probability\s+of)\b/i;
const EDUCATIONAL_FOLLOWUP_REGEX = /^\s*(?:give\s+answers?\s+also|explain\s+question\s+\d+(?:\s+in\s+detail)?|explain\s+(?:it|this)\s+in\s+detail|give\s+\d+\s*mark\s+answers?|give\s+viva\s+questions?|give\s+programs?|give\s+important\s+questions?)\s*$/i;
const EXPLANATION_REGEX = /^(?:explain\s+.*|how\s+does\s+.*\s+work\??|explain\s+(?:this\s+)?step\s+by\s+step)$/i;
const DEFINITION_REGEX = /^(?:what\s+is|what\s+are|define|definition\s+of)\s+(?:an?\s+|the\s+)?([A-Za-z0-9_\-\s\+\#\.\/]+?)[\?\.\s]*$/i;

export function detectUserRoleFromText(text: string): string | null {
  const clean = text.trim();
  if (
    /\b(?:(?:i\s*am|iam|i['’]?m|im)\s+(?:a\s+|an\s+|the\s+)?(?:client\s*(?:,|and|&)\s*(?:a\s+)?)?(?:professional\s+)?director|i\s+don'?t\s+need\s+directors?\s+because\s+i\s+am\s+(?:the\s+|a\s+|a\s+professional\s+)?director|i['’]?m\s+(?:the\s+|a\s+|a\s+professional\s+)?director|i\s*am\s+directing|since\s+i\s*am\s+directing|i['’]?ll\s+direct|i\s+will\s+direct|directing\s+(?:the|this|a\s+|my\s+)?film|directing\s+myself|as\s+(?:a\s+|the\s+|a\s+professional\s+)?director)\b/i.test(clean)
  ) {
    return "DIRECTOR";
  }
  return null;
}

const USER_DIRECTOR_STATEMENT_REGEX =
  /^\s*(?:(?:i\s*am|iam|i['’]?m|im)\s+(?:a\s+|an\s+|the\s+)?(?:client\s*(?:,|and|&)\s*(?:a\s+)?)?director|i['’]?m\s+(?:the\s+|a\s+)?director|as\s+(?:a\s+|the\s+)?director|i\s*will\s+direct|i['’]?ll\s+direct|i\s+direct)[\s.?!]*$/i;

const HERO_HEROINE_SEARCH_REGEX = /\b(?:(?:start\s+with|find|search(?:\s+for)?|get|show\s+me)\s+(?:the\s+)?(?:hero\s+and\s+heroine|heroine\s+and\s+hero|leads?|lead\s+actors?|lead\s+cast)|(?:hero\s+and\s+heroine|heroine\s+and\s+hero))\b/i;

const FIND_THEM_REGEX =
  /^\s*(?:find\s+them|search\s+(?:for\s+)?them|show\s+them|get\s+them|find\s+the\s+missing\s+(?:roles|creators|ones)|find\s+open\s+roles|find\s+these\s+creators)\s*$/i;

const FILM_TEAM_PLANNING_REGEX =
  /\b(?:(?:what\s+roles\s+(?:do\s+i\s+need|are\s+needed|are\s+required)|who\s+(?:do\s+i\s+need|all\s+do\s+i\s+need|is\s+needed))\s*(?:for|to\s+make)?\s*(?:a\s+)?(?:complete\s+)?(?:film|movie|short\s+film|production)?|i\s+need\s+all\s+the\s+other\s+roles\s+to\s+make\s+a\s+film|i\s+need\s+(?:hero|lead\s+actor)[\s,]+(?:heroine|lead\s+actress)[\s,]+(?:dancers?|singers?)|roles\s+to\s+make\s+a\s+(?:complete\s+)?film|what\s+roles\s+do\s+i\s+need|i\s*am\s+(?:the\s+|a\s+|a\s+professional\s+)?director[.\s,;]+(?:and\s+)?(?:i\s+need\s+to\s+make|i\s+want\s+to\s+make)\s+(?:a\s+)?(?:[\w\s]{0,30}\s+)?(?:film|movie|short\s+film|production)?|i\s+don'?t\s+need\s+directors?\s+because\s+i\s+am\s+a\s+director|who\s+do\s+i\s+need\s+to\s+make\s+a\s+film|roles\s+needed\s+for\s+a\s+film|plan\s+(?:the\s+)?production\s+team\s+around\s+me|complete\s+role\s+breakdown|each\s+and\s+every\s+one|find\s+(?:all\s+(?:the\s+)?|every\s+)?creators?\s+required\s+to\s+make\s+(?:a\s+|an\s+|the\s+)?(?:short\s+)?film)\b/i;

const MULTI_ROLE_SEARCH_REGEX =
  /\b(?:find\s+(?:all\s+)?(?:the\s+)?(?:creators|people|roles|crew|team|talent|everyone|everybody)\s+(?:i\s+need|needed|required|for\s+(?:this\s+|my\s+|a\s+|an\s+)?(?:short\s+)?(?:film|movie|project))|find\s+(?:the\s+)?team|find\s+and\s+assemble\s+team|find\s+(?:all\s+roles|everyone|everybody|all\s+required\s+roles|all\s+required\s+creators|all\s+the\s+required\s+creators)|i\s+need\s+everyone(?:\s+required)?(?:\s+for\s+(?:the|a|my)?\s*(?:film|movie|project))?|find\s+everyone\s+required|search\s+all\s+roles|creators\s+required\s+for\s+(?:a\s+|an\s+|my\s+)?(?:short\s+)?film|find\s+creators\s+for\s+my\s+(?:short\s+)?film|find\s+all\s+(?:the\s+)?required\s+creators|all\s+(?:the\s+)?creators\s+required\s+for\s+(?:a\s+|an\s+|my\s+)?(?:short\s+)?film|who\s+do\s+i\s+need\s+for\s+(?:a\s+|an\s+|my\s+)?(?:short\s+)?film|build\s+(?:my\s+|the\s+)?film\s+team|find\s+my\s+complete\s+film\s+team|find\s+everyone\s+i\s+need\s+to\s+make\s+this\s+film|find\s+all\s+(?:the\s+)?people\s+required\s+for\s+the\s+film|all\s+(?:the\s+)?required\s+creators\s+for\s+(?:an?\s+|my\s+|the\s+)?(?:short\s+)?film)\b/i;

const MISSING_ROLES_REGEX = /\b(?:who\s+(?:is|are)\s+(?:still\s+)?missing(?:\s+from\s+my\s+(?:film\s+)?(?:team|squad|project))?|what\s+(?:roles?\s+are|is)\s+(?:still\s+)?missing|missing\s+(?:roles?|crew|talent|cast)|who\s+else\s+do\s+i\s+need|who\s+all\s+are\s+(?:still\s+)?missing|still\s+who\s+(?:is|are)\s+missing)\b/i;

const TEAM_ORCHESTRATION_REGEX = /\b(?:team\s+orchestration|roles?\s+filled|roles?\s+status|orchestrate\s+(?:the\s+)?team|team\s+progress|filled\s+roles?)\b/i;

const BUILD_SQUAD_REGEX = /\b(?:build\s+(?:the\s+|my\s+|a\s+)?(?:complete\s+)?(?:film\s+)?squad|create\s+(?:the\s+|my\s+|a\s+)?(?:film\s+)?squad|form\s+(?:the\s+|my\s+|a\s+)?(?:film\s+)?squad|start\s+squad\s+building)\b/i;

const ALL_CINEMA_CREATORS_SEARCH_REGEX =
  /\b(?:find|search(?:\s+for)?|list|show\s+me|get\s+me)\s+(?:all\s+)?(?:the\s+)?(?:creators?\s+(?:related\s+to\s+|in\s+)?(?:the\s+)?cinematic\s+field|cinematic\s+creators?|cinema\s+creators?|film\s+creators?|movie\s+creators?|cinema\s+roles|film\s+crew|movie\s+crew|cinema\s+talent)\b|\b(?:creators?\s+related\s+to\s+(?:the\s+)?cinematic\s+field|cinematic\s+field|cinema\s+creators\s+for\s+my)\b/i;

const CREATOR_RECOMMEND_REGEX =
  /\b(?:choose|pick|select|recommend|find|show|give\s+me)\s+(?:the\s+)?(?:best|top|strongest|highest\s+rated|ideal)\s+([a-z\s]+?)\b/i;

const PROJECT_SCHEDULE_REGEX =
  /\b(?:prepare|create|generate|make|show|give\s+me|build|plan)\s+(?:the\s+)?(?:complete\s+|full\s+)?(?:film\s+|project\s+|production\s+)?schedule\b|\b(?:schedule\s+including\s+.*(?:songs?|dance|fights?|music)|production\s+schedule|film\s+schedule)\b/i;

const ALL_MUSIC_CREATORS_SEARCH_REGEX =
  /\b(?:find\s+(?:all\s+)?(?:the\s+)?(?:music\s+creators|musicians|band\s+members|music\s+artists)|search\s+(?:all\s+)?(?:the\s+)?(?:music\s+creators|musicians|band\s+members)|list\s+(?:all\s+)?(?:music\s+creators|musicians)|find\s+musicians)\b/i;

const BUILD_BAND_REGEX =
  /\b(?:build\s+(?:the\s+|my\s+|a\s+)?(?:complete\s+)?music\s+band|create\s+(?:the\s+|my\s+|a\s+)?music\s+band|form\s+(?:the\s+|my\s+|a\s+)?(?:complete\s+)?music\s+band|build\s+(?:my\s+|the\s+)?band\s+squad|build\s+my\s+music\s+band)\b/i;

const MUSIC_BAND_PLANNING_REGEX =
  /\b(?:(?:what\s+roles\s+(?:do\s+i\s+need|are\s+needed|are\s+required)|who\s+(?:do\s+i\s+need|all\s+do\s+i\s+need|is\s+needed))\s*(?:for|to\s+make)?\s*(?:a\s+)?(?:complete\s+)?(?:music\s+)?band|roles\s+needed\s+for\s+(?:a\s+)?(?:music\s+)?band|music\s+band\s+roles|roles\s+for\s+music\s+band|talent\s+musician\s+creators|musician\s+creators\s+related\s+to\s+music|only\s+related\s+to\s+music\s+creators|creators\s+like\s+singer[, ]+piano\s+player[, ]+drum|need\s+different\s+type\s+of\s+talent\s+musician|need\s+different\s+type\s+of\s+musician|squad\s+for\s+music\s+band.*need.*creators|form\s+a\s+squad\s+for\s+music\s+band|music\s+band\s+team\s+architecture)\b/i;

export const ADD_CREATOR_TO_TEAM_REGEX =
  /^(?:please\s+)?(?:yes,?\s+)?(?:also\s+)?(?:invite(?:\s*[\/&]\s*add)?|add|assign|select|confirm|choose|pick)\s+(@?[A-Za-z0-9_.-]+(?:[\s]+[A-Za-z0-9_.-]+)*?)(?:\s+(?:as|for|to\s+role)\s+([A-Za-z\s]+?))?(?:\s+to\s+(?:the\s+|my\s+)?(?:team|squad|film\s+squad|project))?[\s.?!]*$/i;

export function extractAddCreatorInfo(text: string): { creatorName: string; roleName?: string } | null {
  const clean = text.trim();
  if (STORY_MOD_REGEX.test(clean) || STORY_GEN_REGEX.test(clean) || STORY_ANALYSIS_REGEX.test(clean)) {
    return null;
  }
  // Ironclad guard: Never classify roadmap persistence, roadmap operations, or section updates as adding a creator
  if (
    /\b(?:roadmap|roadmaps|section|curriculum|curricula|journey|milestone|stage|track|plan|save|saved)\b/i.test(clean) ||
    SAVE_ROADMAP_REGEX.test(clean)
  ) {
    return null;
  }
  const match = clean.match(ADD_CREATOR_TO_TEAM_REGEX);
  if (!match) return null;
  const rawName = (match[1] || "").trim();
  const rawRole = match[2] ? match[2].trim() : undefined;
  const cleanName = rawName.replace(/^@/, "").trim();
  const excluded = [
    "a", "an", "the", "this", "that", "these", "those",
    "creator", "creators", "squad", "team", "project", "details",
    "more", "new", "roles", "role", "everyone", "people", "all",
    "this creator", "the creator", "a creator", "this squad", "the squad",
  ];
  if (!cleanName || excluded.includes(cleanName.toLowerCase())) return null;
  return {
    creatorName: cleanName,
    roleName: rawRole,
  };
}

export interface CreatorSelfRoleInfo {
  role: string;
  canonicalRole: string;
}

export function extractCreatorSelfRole(text: string): CreatorSelfRoleInfo | null {
  const clean = text.trim();
  const withoutTrailingPunct = clean.replace(/[.,!?;:]+$/, "");

  // 0. Direct check for Director self-declarations (including compound like "client, a director", "client and director")
  if (
    /\b(?:(?:i\s*am|iam|i['’]?m|im|as)\s+(?:a\s+|an\s+|the\s+)?(?:client\s*(?:,|and|&)\s*(?:a\s+)?)?director|i\s+don'?t\s+need\s+directors?\s+because\s+i\s+am\s+(?:the\s+|a\s+)?director|i['’]?m\s+(?:the\s+|a\s+)?director|i\s*am\s+directing|since\s+i\s*am\s+directing|i['’]?ll\s+direct|i\s+will\s+direct|directing\s+(?:the|this|a\s+|my\s+)?film|directing\s+myself|as\s+(?:a\s+|the\s+)?director)\b/i.test(clean)
  ) {
    return { role: "Director", canonicalRole: "DIRECTOR" };
  }

  // 1. Direct self-declaration: "I am a video editor", "iam a video editor", "im a video editor", "as a designer"
  const selfMatch = clean.match(
    /\b(?:(?:i\s*am|iam|i['’]?m|im|as)\s+(?:a\s+|an\s+|the\s+)?)([a-z0-9\/\-\s]+?)(?=[.,!?;:]|\s+(?:and|butt?|so|looking|seeking|wanting|who|in\s+need|need|want|find|search|ready|trying|wishing|hoping|to\s+apply|$))/i
  );

  let rawRole = "";
  if (selfMatch && selfMatch[1]) {
    rawRole = selfMatch[1].trim().toLowerCase();
  } else {
    // 2. Trailing/standalone statement: "I am a video editor." or "I'm a photographer"
    const directMatch = withoutTrailingPunct.match(/\b(?:(?:i\s*am|iam|i['’]?m|im)\s+(?:a\s+|an\s+|the\s+)?)([a-z0-9\/\-\s]+)$/i);
    if (directMatch && directMatch[1]) {
      rawRole = directMatch[1].trim().toLowerCase();
    } else {
      // 3. Prefix seeking match: "looking for video editing work"
      const prefixRoleMatch = withoutTrailingPunct.match(
        /\b(?:looking\s+for\s+([a-z\s]+?)\s+(?:work|jobs?|projects?|gigs?|opportunities|clients?))\b/i
      );
      if (prefixRoleMatch && prefixRoleMatch[1]) {
        rawRole = prefixRoleMatch[1].trim().toLowerCase();
      }
    }
  }

  if (!rawRole) return null;

  // Map rawRole to Canonical Role & specialized display
  if (/\b(?:director|film\s+director|filmmaker|directing)\b/i.test(rawRole)) {
    return { role: "Director", canonicalRole: "DIRECTOR" };
  }
  if (/\b(?:video\s+edit(?:or|ing)?|video-editing|youtube\s+edit(?:or|ing)?|reels?\s+edit(?:or|ing)?|film\s+edit(?:or|ing)?|post\s*production|motion\s+graphics|short\s+film\s+editor)\b/i.test(rawRole)) {
    return { role: "Video Editor", canonicalRole: "Video Editor" };
  }
  if (/\b(?:developer|frontend|web\s+developer|backend|fullstack|software\s+developer|software\s+engineer|programmer|coder)\b/i.test(rawRole)) {
    return { role: "Developer", canonicalRole: "Frontend Web Developer" };
  }
  if (/\b(?:designer|ui\/ux|ui\s+designer|ux\s+designer|graphic\s+designer|product\s+designer)\b/i.test(rawRole)) {
    return { role: "Designer", canonicalRole: "UI/UX Designer" };
  }
  if (/\b(?:photographer|photography)\b/i.test(rawRole)) {
    return { role: "Photographer", canonicalRole: "Photographer" };
  }
  if (/\b(?:actress|heroine|female\s+lead)\b/i.test(rawRole)) {
    return { role: "Lead Actress", canonicalRole: "Lead Actress" };
  }
  if (/\b(?:actor|hero|male\s+lead)\b/i.test(rawRole)) {
    return { role: "Actor", canonicalRole: "Actor" };
  }
  if (/\b(?:singer|vocalist|lead\s+singer)\b/i.test(rawRole)) {
    return { role: "Lead Singer", canonicalRole: "Lead Singer" };
  }
  if (/\b(?:musician|guitarist|drummer|pianist|keyboard\s+player|bass\s+player|composer)\b/i.test(rawRole)) {
    return { role: "Musician", canonicalRole: "Musician" };
  }
  if (/\b(?:writer|copywriter|content\s+writer|scriptwriter|screenwriter)\b/i.test(rawRole)) {
    return { role: "Content Writer", canonicalRole: "Content Writer" };
  }
  if (/\b(?:animator|3d\s+artist|motion\s+designer|2d\s+animator)\b/i.test(rawRole)) {
    return { role: "Animator", canonicalRole: "Animator" };
  }
  if (/\b(?:cinematographer|dop|videographer|camera\s+operator)\b/i.test(rawRole)) {
    return { role: "Cinematographer", canonicalRole: "Cinematographer" };
  }
  if (/\b(?:sound\s+designer|sound\s+engineer|audio\s+engineer)\b/i.test(rawRole)) {
    return { role: "Sound Designer", canonicalRole: "Sound Designer" };
  }
  if (/\b(?:dancer|choreographer)\b/i.test(rawRole)) {
    return { role: "Dancer", canonicalRole: "Dancer" };
  }

  const capitalized = rawRole.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  return { role: capitalized, canonicalRole: capitalized };
}

export function extractOpportunityTargetRole(
  text: string,
  context?: { currentUserRole?: string }
): string {
  const clean = text.trim().replace(/[.,;!?]+$/, "");
  const lower = clean.toLowerCase();

  // 0. Direct high-precedence keyword match for canonical requested roles (supporting plurals)
  if (/\b(?:video\s+edit(?:ors?|ing)?|video-editing|youtube\s+edit(?:ors?|ing)?|reels?\s+edit(?:ors?|ing)?|film\s+edit(?:ors?|ing)?|post\s*production)\b/i.test(lower)) {
    return "Video Editor";
  }
  if (/\b(?:developers?|frontend|web\s+developers?|backend|fullstack|software\s+developers?)\b/i.test(lower)) {
    return "Frontend Web Developer";
  }
  if (/\b(?:designers?|ui\/ux|graphic\s+designers?)\b/i.test(lower)) {
    return "UI/UX Designer";
  }
  if (/\b(?:fight\s+masters?|stunt\s+coordinators?|action\s+choreographers?)\b/i.test(lower)) {
    return "Fight Master";
  }
  if (/\b(?:choreographers?)\b/i.test(lower)) {
    return "Choreographer";
  }
  if (/\b(?:dancers?)\b/i.test(lower)) {
    return "Dancer";
  }
  if (/\b(?:singers?|vocalists?)\b/i.test(lower)) {
    return "Lead Singer";
  }
  if (/\b(?:actors?|heroes|hero)\b/i.test(lower) && !/\b(?:actresses?|heroines?)\b/i.test(lower)) {
    return "Lead Actor";
  }
  if (/\b(?:actresses?|heroines?)\b/i.test(lower)) {
    return "Lead Actress";
  }
  if (/\b(?:cinematographers?|dop)\b/i.test(lower)) {
    return "Cinematographer";
  }
  if (/\b(?:sound\s+designers?|sound\s+engineers?)\b/i.test(lower)) {
    return "Sound Designer";
  }

  // 1. Check relative clause or requirements:
  // "clients who require video editors", "cretors who required a video editor", "who needs a video editor", "projects requiring video editors"
  const requireMatch =
    clean.match(
      /\b(?:clients?|projects?|jobs?|work|opportunities|(?:cretors?|creators?))\s+(?:who\s+)?(?:require|need|requiring|needing|looking\s+for|seeking|want|wanted)\s+(?:a\s+|an\s+|the\s+)?([a-z0-9\/\-\s]+?)(?=(?:\s+(?:for|in|to|and|,|\.|$)|$|[.,;!?]))/i
    ) ||
    clean.match(
      /\b(?:who\s+needs?|who\s+requires?|who\s+is\s+looking\s+for)\s+(?:a\s+|an\s+|the\s+)?([a-z0-9\/\-\s]+?)(?=(?:\s+(?:for|in|to|and|,|\.|$)|$|[.,;!?]))/i
    ) ||
    clean.match(
      /\b(?:find|search(?:\s+for)?|show\s+me|get\s+me)\s+(?:all\s+)?(?:the\s+)?(?:available\s+)?(?:clients?|projects?|jobs?|work|opportunities)\s+(?:for|requiring|needing|that\s+need)\s+(?:a\s+|an\s+|the\s+)?([a-z0-9\/\-\s]+?)(?=(?:\s+(?:for|in|to|and|,|\.|$)|$|[.,;!?]))/i
    );

  let raw = "";
  if (requireMatch && requireMatch[1]) {
    raw = requireMatch[1].trim().toLowerCase();
  }

  // 2. Check self-declaration or context: "I am a video editor looking for clients", "iam a video editor so find..."
  if (!raw || raw === "me" || raw === "us") {
    const selfRole = extractCreatorSelfRole(clean);
    if (selfRole) {
      return selfRole.canonicalRole || selfRole.role;
    }
    if (context?.currentUserRole && context.currentUserRole !== "DIRECTOR") {
      return context.currentUserRole;
    }
  }

  // 3. Normalize raw string to canonical role
  if (raw) {
    if (/\b(?:video\s+edit(?:or|ing)?|video-editing|youtube\s+edit(?:or|ing)?|reels?\s+edit(?:or|ing)?|film\s+edit(?:or|ing)?|post\s*production|motion\s+graphics|short\s+film\s+editor)\b/i.test(raw)) {
      return "Video Editor";
    }
    if (/\b(?:developer|frontend|web\s+developer|backend|fullstack|software\s+developer|software\s+engineer|programmer|coder)\b/i.test(raw)) {
      return "Frontend Web Developer";
    }
    if (/\b(?:designer|ui\/ux|ui\s+designer|ux\s+designer|graphic\s+designer|product\s+designer)\b/i.test(raw)) {
      return "UI/UX Designer";
    }
    if (/\b(?:photographer|photography)\b/i.test(raw)) {
      return "Photographer";
    }
    if (/\b(?:actress|heroine|female\s+lead)\b/i.test(raw)) {
      return "Lead Actress";
    }
    if (/\b(?:actor|hero|male\s+lead)\b/i.test(raw)) {
      return "Actor";
    }
    if (/\b(?:singer|vocalist|lead\s+singer)\b/i.test(raw)) {
      return "Lead Singer";
    }
    if (/\b(?:musician|guitarist|drummer|pianist|keyboard\s+player|bass\s+player|composer)\b/i.test(raw)) {
      return "Musician";
    }
    if (/\b(?:writer|copywriter|content\s+writer|scriptwriter|screenwriter)\b/i.test(raw)) {
      return "Content Writer";
    }
    if (/\b(?:animator|3d\s+artist|motion\s+designer|2d\s+animator)\b/i.test(raw)) {
      return "Animator";
    }
    if (/\b(?:cinematographer|dop|videographer|camera\s+operator)\b/i.test(raw)) {
      return "Cinematographer";
    }
    if (/\b(?:sound\s+designer|sound\s+engineer|audio\s+engineer)\b/i.test(raw)) {
      return "Sound Designer";
    }
    if (/\b(?:dancer|choreographer)\b/i.test(raw)) {
      return "Dancer";
    }
  }

  // 4. Fallback to context?.currentUserRole if available and not DIRECTOR
  if (context?.currentUserRole && context.currentUserRole !== "DIRECTOR") {
    return context.currentUserRole;
  }

  // 5. Look for video editing in lower text
  if (/\b(?:video\s+edit|video-edit|editing|editor|reels|film\s+edit|post\s*production)\b/i.test(lower)) {
    return "Video Editor";
  }

  return "Video Editor";
}

export function isClientOpportunitySearchQuery(
  text: string,
  context?: {
    currentUserRole?: string;
    currentUserType?: "CREATOR" | "CLIENT";
    activeGoal?: "FIND_JOB" | "HIRE_TALENT" | "BUILD_PROJECT";
    conversationHistory?: ChatMessage[];
  }
): boolean {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Guard against direct job application actions
  if (isJobApplicationQuery(clean)) return false;

  // EXPLICIT ENTITY TARGET OVERRIDE GUARD (Sections 1, 4, 7):
  // If the query explicitly targets creators/collaborators/talent WITHOUT a requirement/hiring/client/job relationship,
  // it MUST NOT be classified as client opportunity search, even if the user is a creator or previous context was job searching.
  const hasExplicitCreatorTarget =
    /\b(?:find|search(?:\s+for)?|show(?:\s+me)?|list|get\s+me)\s+(?:all\s+)?(?:the\s+)?(?:available\s+)?(?:other\s+)?(?:creators|collaborators|musicians|designers|editors|actors|photographers|developers)\b/i.test(lower) ||
    /\b(?:find\s+other\s+creators|find\s+collaborators|find\s+creators|find\s+the\s+creators|search\s+creators|show\s+creators)\b/i.test(lower);

  const hasRequirementRelationship =
    /\b(?:cretors?|creators?|clients?|people|someone|anyone)\s+(?:who\s+)?(?:require[ds]?|need(?:ed|s)?|requiring|needing|want(?:ed|s)?|hiring|are\s+hiring|looking\s+for)\s+(?:a\s+|an\s+|the\s+)?(?:video\s+editor|developer|designer|actor|singer|photographer|writer|[a-z0-9\/\-\s]+)/i.test(lower) ||
    /\b(?:who\s+needs?|who\s+requires?|who\s+required|who\s+needed|who\s+is\s+hiring)\b/i.test(lower) ||
    /\b(?:clients?|jobs?|projects?|work|opportunities|gigs?|openings?)\b/i.test(lower);

  if (hasExplicitCreatorTarget && !hasRequirementRelationship) {
    return false;
  }

  // CRITICAL GUARD: Queries seeking required creators, film teams, or roles for a film/project
  // MUST NEVER be classified as client opportunity search!
  // e.g. "find all the required creators for an short film", "all the creators required for film",
  // "find all creators required for my action short film", "find creators for my short film"
  if (
    /\b(?:creators?|talent|crew|team|roles?)\s+(?:required|needed)\s+(?:for|to\s+make)\b/i.test(lower) ||
    /\b(?:required|needed)\s+(?:creators?|talent|crew|team|roles?)\s+(?:for|to\s+make)\b/i.test(lower) ||
    /\ball\s+(?:the\s+)?(?:required\s+creators|creators\s+required)\b/i.test(lower) ||
    /\b(?:find|search(?:\s+for)?|get\s+me|need|show\s+me)\s+(?:all\s+)?(?:the\s+)?(?:required\s+creators|creators\s+required|creators\s+for\s+(?:my\s+|a\s+|an\s+)?(?:short\s+)?film)\b/i.test(lower) ||
    /\bcreators\s+required\s+for\s+film\b/i.test(lower) ||
    /\bfind\s+(?:everyone|all\s+creators|creators)\s+required\b/i.test(lower)
  ) {
    return false;
  }

  // Guard: Client looking for creators for their project (e.g. "Find video editors for my project", "Find video editors for my short film")
  if (
    /\b(?:find|search(?:\s+for)?|get\s+me)\s+(?:all\s+)?(?:the\s+)?(?:available\s+)?(?:[a-z\s]+?)\s+for\s+my\s+(?:project|short\s+film|film|startup|event|business|company|website|app)\b/i.test(lower)
  ) {
    return false;
  }

  // Guard against explicit client hiring queries ("I need a video editor", "We need photographers for my event")
  const isClientHiring =
    /\b(?:i\s+need|we\s+need|looking\s+to\s+hire|want\s+to\s+hire)\s+(?:a\s+|an\s+|the\s+)?(?:actors?|actresses?|video\s+editors?|cinematographers?|directors?|singers?|dancers?|sound\s+designers?|musicians?|artists?|designers?|developers?|photographers?|animators?|writers?)\b/i.test(lower) &&
    !/\b(?:iam\s+|im\s+|i\s*am\s+(?:a\s+|an\s+)|i['’]?m\s+(?:a\s+|an\s+)|so\s+i\s+need\s+(?:too?\s+)?apply|who\s+require|who\s+need|clients?\s+who)\b/i.test(lower);

  if (isClientHiring && !/\b(?:apply|job|work|projects?\s+for\s+me|clients?\s+who|who\s+require)\b/i.test(lower)) {
    return false;
  }

  // 1. Explicit client / project requirement searches:
  // "clients who require video editors", "clients looking for video editors", "find the cretors who required a video editor",
  // "find projects requiring video editors", "find clients who need video editors", "find projects that need video editors"
  if (
    /\b(?:clients?|projects?|jobs?|work|opportunities)\s+(?:who\s+)?(?:require[ds]?|need(?:ed|s)?|requiring|needing|looking\s+for|seeking|want(?:ed|s)?)\b/i.test(lower) ||
    /\b(?:cretors?|creators?)\s+who\s+(?:require[ds]?|need(?:ed|s)?|are\s+looking\s+for|seek(?:ing)?|want(?:ed|s)?)\s+(?:a\s+|an\s+|the\s+)?(?:video\s+editor|developer|designer|writer|editor|[a-z0-9\/\-\s]+)\b/i.test(lower)
  ) {
    return true;
  }

  // 2. Who needs / who requires:
  // "who needs a video editor", "who requires a video editor"
  if (
    /\b(?:who\s+needs?|who\s+requires?|who\s+is\s+looking\s+for)\s+(?:a\s+|an\s+|the\s+)?(?:video\s+editor|developer|designer|photographer|writer|animator|actor|singer|musician|cinematographer|sound\s+designer|[a-z0-9\/\-\s]+)\b/i.test(lower)
  ) {
    return true;
  }

  // 3. "find clients for me", "find clients who need me":
  if (/\b(?:find|search(?:\s+for)?|show\s+me|get\s+me)\s+(?:all\s+)?(?:the\s+)?clients?\s+(?:for\s+me|who\s+need\s+me)\b/i.test(lower)) {
    return true;
  }

  // 4. "find projects that need / find jobs for / find work for / find opportunities for [role]":
  if (
    /\b(?:find|search(?:\s+for)?|show\s+me|get\s+me)\s+(?:all\s+)?(?:the\s+)?(?:available\s+)?(?:clients?|projects?|jobs?|work|opportunities)\s+(?:for|requiring|needing|that\s+need)\b/i.test(lower)
  ) {
    return true;
  }

  // 5. Creator role self-declaration seeking clients / projects / work:
  // "I am a video editor looking for clients", "I am a video editor looking for projects", "I am a video editor looking for work"
  const selfRole = extractCreatorSelfRole(clean);
  if (selfRole) {
    if (
      /\b(?:looking\s+for\s+(?:clients?|projects?|work|jobs?|opportunities|gigs?)|seeking\s+(?:clients?|projects?|work|jobs?)|(?:so|and)?\s*(?:find|search)\s+(?:the\s+)?(?:clients?|projects?|jobs?|opportunities))\b/i.test(lower)
    ) {
      return true;
    }
  }

  // 6. Direct client search phrases ("find all clients", "find the clients", "client opportunities")
  if (
    /\b(?:find|search(?:\s+for)?|show\s+me|list)\s+(?:all\s+)?(?:the\s+)?clients?\b/i.test(lower) ||
    /\bclients?\s+(?:looking\s+for|hiring|seeking|with\s+projects?|who\s+require|who\s+need|requiring|needing)\b/i.test(lower) ||
    /\b(?:client\s+opportunities|active\s+client\s+briefs|client\s+jobs)\b/i.test(lower)
  ) {
    return true;
  }

  // 7. Context-driven: if user is creator looking for work, follow-ups like "find clients", "show more"
  const isContextCreator =
    context?.currentUserType === "CREATOR" ||
    context?.activeGoal === "FIND_JOB" ||
    Boolean(context?.currentUserRole && context.currentUserRole !== "DIRECTOR");

  if (isContextCreator) {
    if (
      /\b(?:find\s+(?:the\s+)?clients?|find\s+clients|show\s+more|show\s+all|find\s+more|which\s+client\s+is\s+best|which\s+one\s+is\s+best|show\s+details|what\s+is\s+the\s+budget|find\s+another\s+project)\b/i.test(lower)
    ) {
      return true;
    }
  }

  return false;
}

export function isJobApplicationQuery(text: string): boolean {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Guard against generic job seeking or role declarations:
  // e.g. "I am a video editor and I want to apply for a job", "I need to apply for a job so find...", "find jobs for me"
  if (
    /\b(?:iam\s+|im\s+|i\s*am\s+(?:a\s+|an\s+)|i['’]?m\s+(?:a\s+|an\s+)|so\s+find|find\s+(?:all|me|jobs?|projects?|creators)|looking\s+for\s+(?:work|jobs?))\b/i.test(lower)
  ) {
    return false;
  }

  // Guard against indefinite "apply for a job / work / projects" without pointing to a specific job/project
  if (/\b(?:apply\s+(?:for|to)\s+(?:a|any)\s+(?:job|project|opportunity|work))\b/i.test(lower)) {
    return false;
  }

  return (
    /\b(?:apply\s+(?:for|to)\s+(?:this|the|that|selected)\s+(?:job|project|opportunity|brief|listing|first\s+one|position))\b/i.test(lower) ||
    /\b(?:apply\s+(?:for|to)\s+(?:this|that|the\s+first\s+one))\b/i.test(lower) ||
    /\b(?:send|submit)\s+(?:my\s+)?application\b/i.test(lower) ||
    /\b(?:i\s+want\s+(?:to\s+apply\s+(?:for|to)\s+(?:this|the|that)|this\s+job|this\s+project))\b/i.test(lower) ||
    /^(?:apply|apply\s+now|apply\s+to\s+job|submit\s+application)[\s.?!]*$/i.test(lower)
  );
}

export function isCreatorJobSeekingQuery(
  text: string,
  context?: {
    currentUserRole?: string;
    currentUserType?: "CREATOR" | "CLIENT";
    activeGoal?: "FIND_JOB" | "HIRE_TALENT" | "BUILD_PROJECT";
    conversationHistory?: ChatMessage[];
  }
): boolean {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // EXPLICIT ENTITY TARGET OVERRIDE GUARD (Sections 1, 4, 7):
  const hasExplicitCreatorTarget =
    /\b(?:find|search(?:\s+for)?|show(?:\s+me)?|list|get\s+me)\s+(?:all\s+)?(?:the\s+)?(?:available\s+)?(?:other\s+)?(?:creators|collaborators|musicians|designers|editors|actors|photographers|developers)\b/i.test(lower) ||
    /\b(?:find\s+other\s+creators|find\s+collaborators|find\s+creators|find\s+the\s+creators|search\s+creators|show\s+creators)\b/i.test(lower);

  const hasRequirementRelationship =
    /\b(?:cretors?|creators?|clients?|people|someone|anyone)\s+(?:who\s+)?(?:require[ds]?|need(?:ed|s)?|requiring|needing|want(?:ed|s)?|hiring|are\s+hiring|looking\s+for)\s+(?:a\s+|an\s+|the\s+)?(?:video\s+editor|developer|designer|actor|singer|photographer|writer|[a-z0-9\/\-\s]+)/i.test(lower) ||
    /\b(?:who\s+needs?|who\s+requires?|who\s+required|who\s+needed|who\s+is\s+hiring)\b/i.test(lower) ||
    /\b(?:clients?|jobs?|projects?|work|opportunities|gigs?|openings?)\b/i.test(lower);

  if (hasExplicitCreatorTarget && !hasRequirementRelationship) {
    return false;
  }

  // Client mode expressions: "I need a video editor", "Find video editors for my short film", "I need photographers for my event"
  const isClientHiring =
    /\b(?:i\s+need|we\s+need|looking\s+to\s+hire|want\s+to\s+hire)\s+(?:a\s+|an\s+|the\s+)?(?:actors?|actresses?|video\s+editors?|cinematographers?|directors?|singers?|dancers?|sound\s+designers?|musicians?|artists?|designers?|developers?|photographers?|animators?|writers?)\b/i.test(lower) &&
    !/\b(?:iam\s+|im\s+|i\s*am\s+(?:a\s+|an\s+)|i['’]?m\s+(?:a\s+|an\s+)|so\s+i\s+need\s+(?:too?\s+)?apply)\b/i.test(lower);

  if (isClientHiring && !/\b(?:apply|job|work|projects?\s+for\s+me)\b/i.test(lower)) {
    return false;
  }

  // 1. Explicit self-role + seeking work/job/clients/projects/band:
  const selfRole = extractCreatorSelfRole(clean);
  if (selfRole) {
    if (
      /\b(?:apply\s+(?:for|to)|looking\s+for\s+(?:work|jobs?|clients?|projects?|opportunities|gigs?|a\s+band|bands?)|find\s+(?:me\s+)?(?:work|jobs?|projects?|clients?|opportunities)|need\s+(?:too?\s+)?(?:apply|work|job|find\s+work)|want\s+(?:to\s+)?(?:apply|work|jobs?|find\s+work)|seeking\s+(?:work|jobs?|opportunities|clients?))\b/i.test(lower)
    ) {
      return true;
    }
  }

  // 2. Direct job/work seeking phrases:
  if (
    /\b(?:i\s+need\s+a\s+job|i\s+want\s+to\s+find\s+work|find\s+jobs\s+for\s+me|find\s+projects\s+for\s+me|find\s+me\s+projects|find\s+me\s+jobs|i\s+want\s+to\s+apply\s+for\s+projects|looking\s+for\s+[\w\s]{0,20}\s+work|looking\s+for\s+(?:jobs?|work|gigs?|opportunities|clients))\b/i.test(lower)
  ) {
    return true;
  }

  // 3. Follow-up phrase when context is creator seeking work:
  const isContextCreatorSeeker =
    context?.currentUserType === "CREATOR" ||
    context?.activeGoal === "FIND_JOB" ||
    Boolean(context?.currentUserRole && context.currentUserRole !== "DIRECTOR");

  if (isContextCreatorSeeker) {
    if (
      /\b(?:find\s+(?:all\s+)?(?:the\s+)?(?:jobs?|projects?|opportunities|clients?)|show\s+more|show\s+all|find\s+more)\b/i.test(lower)
    ) {
      return true;
    }
  }

  return false;
}

const CLIENT_SEARCH_REGEX = /\b(?:find|search(?:\s+for)?|show\s+me|list)\s+(?:all\s+)?(?:the\s+)?clients?\b|\bclients?\s+(?:looking\s+for|hiring|seeking|with\s+projects?|who\s+require|who\s+need|requiring|needing)\b|\b(?:client\s+opportunities|active\s+client\s+briefs|client\s+jobs)\b/i;

const SQUAD_SEARCH_REGEX = /\b(?:find|search(?:\s+for)?|show\s+me|list|explore|discover)\s+(?:all\s+)?(?:the\s+)?(?:film|video|animation|design|music|creative\s+)?squads?\b|\bfind\s+(?:a\s+)?squad\s+for\b/i;

const CREATOR_ROLE_PATTERN =
  /(?:actors?|actresses?|hero|heroine|heroes|heroines|fight\s+masters?|stunt\s+coordinators?|action\s+choreographers?|action\s+directors?|comic\s+actors?|comedy\s+actors?|dialogue\s+writers?|screenwriters?|video\s+editors?|youtube\s+editors?|content\s+editors?|short-form\s+editors?|long-form\s+editors?|editors?|colorists?|cinematographers?|dops?|directors?\s+of\s+photography|camera\s+operators?|videographers?|directors?|singers?|vocalists?|dancers?|choreographers?|sound\s+designers?|sound\s+engineers?|audio\s+engineers?|audio\s+mixers?|performers?|performance|stage(?:\/|\s+)lighting\s+technicians?|lighting\s+technicians?|stage\s+technicians?|event\s+coordinators?|event\s+managers?|sponsorships?|sponsors?|business\s+developments?|musicians?|artists?|designers?|developers?|photographers?|photography|animators?|animation|3d\s+artists?|writers?|content\s+creators?|illustrators?|creators?)/i;

const FUNCTIONAL_ROLE_ACTION_PATTERN =
  /\b(?:(?:someone|anyone|somebody|people|a\s+person|talent|creator)\s+who\s+can\s+(?:edit\s+(?:my\s+)?(?:youtube\s+)?videos?|shoot\s+(?:my\s+)?(?:short\s+)?film|record\s+(?:my\s+)?vocals?|mix\s+(?:my\s+)?(?:audio|sound)|perform\s+at\s+(?:my\s+)?festival|act\s+in\s+(?:my\s+)?film))\b/i;

const WHO_CAN_ACTION_PATTERN =
  /\b(?:who\s+can\s+(?:edit\s+(?:my\s+)?(?:youtube\s+)?videos?|shoot\s+(?:my\s+)?(?:short\s+)?film|record\s+(?:my\s+)?vocals?|mix\s+(?:my\s+)?(?:audio|sound)|perform\s+at\s+(?:my\s+)?festival|act\s+in\s+(?:my\s+)?film))\b/i;

const CREATOR_SEARCH_INTENT_REGEX = new RegExp(
  `\\b(?:` +
    // 1. Direct discovery verbs: find, search, show me, list, get me, look for, discover, scout
    `(?:find|search(?:\\s+for)?|show\\s+me|list|get\\s+me|bring\\s+up|look\\s+for|discover|scout)` +
    `|` +
    // 2. Need / Want expressions: i need, we need, looking for, seeking, want to hire
    `(?:i\\s+(?:need|want)|we\\s+(?:need|want)|i['’]?m\\s+looking\\s+for|we['’]?re\\s+looking\\s+for|looking\\s+for|seeking|in\\s+need\\s+of|want\\s+to\\s+hire|need\\s+to\\s+hire|looking\\s+to\\s+hire)` +
    `|` +
    // 3. Imperative search requests: please find, please search
    `please\\s+(?:find|get|search)` +
  `)\\s+(?:all\\s+)?(?:the\\s+)?(?:available\\s+)?(?:verified\\s+)?(?:best\\s+|good\\s+|top\\s+)?(?:a\\s+|an\\s+)?(?:[\\w\\s]{0,25})?${CREATOR_ROLE_PATTERN.source}\\b`,
  "i"
);

const EXPLICIT_CREATOR_SEARCH_REGEX = CREATOR_SEARCH_INTENT_REGEX;

export function isCapabilityInquiry(text: string): boolean {
  const clean = text.trim();
  const lower = clean.toLowerCase();
  if (/\b(?:please\s+find\s+(?:them|now|all)|search\s+now|find\s+now|start\s+searching|find\s+them)\b/i.test(lower)) {
    return false;
  }
  return (
    CAPABILITY_QUERY_REGEX.test(lower) ||
    /^(?:(?:so\s+)?(?:can|could|are|would|do)\s+you\s+(?:able\s+to\s+|help\s+me\s+)?(?:find|search(?:\s+for)?|discover|hire|match|connect|source|look\s+up))\b/i.test(lower) ||
    /^(?:is\s+it\s+possible\s+to\s+(?:find|search|hire)|do\s+you\s+(?:have\s+the\s+ability\s+to|support))\b/i.test(lower)
  );
}

const FOLLOWUP_REGEX = /^(?:please\s+)?(?:respond|answer|reply)(?:\s+to)?(?:\s+the)?(?:\s+(?:above|previous|last))?(?:\s+(?:question|prompt|message|query))?[\s.?!]*$/i;

const PROJECT_VIEW_REGEX = /^(?:show\s+(?:me\s+)?(?:my\s+)?project|view\s+blueprint|show\s+(?:the\s+)?blueprint|show\s+roadmap|view\s+project|open\s+blueprint|show\s+my\s+plan)[\s.?!]*$/i;

const PROJECT_MODIFICATION_REGEX = /\b(?:change\s+the\s+budget|update\s+the\s+budget|increase\s+budget|decrease\s+budget|change\s+budget|update\s+timeline|change\s+timeline|change\s+duration|update\s+duration|add\s+(?:a\s+|an\s+)?[\w\s]+\s+to\s+(?:my|the)\s+project|remove\s+(?:the\s+)?[\w\s]+\s+role|change\s+title|update\s+title|rename\s+project)\b/i;

const PROJECT_CREATION_REGEX = /\b(?:i\s+want\s+to\s+(?:organize|host|run|make|build|create|shoot|produce|develop|plan|execute)|let'?s\s+(?:organize|host|run|make|build|create|shoot|produce|develop|plan)|organize\s+(?:a\s+|an\s+|the\s+)?(?:college\s+cultural\s+festival|cultural\s+festival|festival|event|conference|hackathon)|create\s+(?:a\s+|an\s+|the\s+)?(?:short\s+film|film|movie|web\s*app|website|mobile\s*app|app|music\s*video|album|song|project|festival|cultural\s+festival|event)\s+plan|plan\s+(?:a\s+|an\s+|my\s+)?(?:college\s+cultural\s+festival|cultural\s+festival|festival|event|short\s+film|film|movie|web\s*app|website|mobile\s*app|app|project|production)|have\s+(?:a\s+|an\s+)?(?:story|idea|concept)\s+(?:about|called|for\s+a)|my\s+project\s+is\s+(?:about|a)|developing\s+(?:a\s+)?(?:short\s+film|film|web\s*app|website|mobile\s*app|music\s*video|festival))\b/i;

export function isCreatorSearchQuery(
  text: string,
  context?: { activeProject?: OmniForgeProject | null; currentUserType?: "CREATOR" | "CLIENT"; activeGoal?: string }
): boolean {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // Guard against creator job seeking, client opportunity search, and application workflows
  if (isJobApplicationQuery(clean)) return false;
  if (isClientOpportunitySearchQuery(clean, context as any)) return false;
  if (isCreatorJobSeekingQuery(clean, context as any)) return false;

  // Guard against skill inquiries, educational questions, roadmap operations, and roadmap saves
  if (
    /\b(?:what\s+skills?\b|skills?\s+(?:do\s+i\s+need|are\s+needed|required|should\s+i\s+learn)|how\s+(?:do\s+i|can\s+i|to)\s+become|how\s+to\s+learn|learn\s+how\s+to|what\s+does\s+a\s+\w+\s+do)\b/i.test(lower) ||
    /\b(?:roadmap|roadmaps|curriculum|curricula)\b/i.test(lower) ||
    SAVE_ROADMAP_REGEX.test(clean) ||
    SKILL_INQUIRY_REGEX.test(clean)
  ) {
    return false;
  }

  // Guard against clarification, capability question, identity, how-to, or story gen
  if (extractDefinitionTerm(clean)) return false;
  if (ADD_CREATOR_TO_TEAM_REGEX.test(clean)) return false;
  if (CLARIFICATION_NEGATION_REGEX.test(lower)) return false;
  if (IDENTITY_REGEX.test(clean)) return false;
  if (isHowToQuery(clean)) return false;
  if (isCapabilityInquiry(clean)) return false;
  if (PLATFORM_KNOWLEDGE_REGEX.test(clean)) return false;
  if (FILM_TEAM_PLANNING_REGEX.test(lower)) return false;
  if (MUSIC_BAND_PLANNING_REGEX.test(lower)) return false;
  if (ALL_MUSIC_CREATORS_SEARCH_REGEX.test(lower)) return false;
  if (ALL_CINEMA_CREATORS_SEARCH_REGEX.test(clean)) return false;
  if (CREATOR_RECOMMEND_REGEX.test(clean)) return false;
  if (PROJECT_SCHEDULE_REGEX.test(clean)) return false;
  if (BUILD_BAND_REGEX.test(lower)) return false;
  if (HERO_HEROINE_SEARCH_REGEX.test(lower)) return false;
  if (MULTI_ROLE_SEARCH_REGEX.test(lower)) return false;
  if (MISSING_ROLES_REGEX.test(lower)) return false;
  if (STORY_GEN_REGEX.test(lower)) return false;
  if (STORY_MOD_REGEX.test(lower)) return false;
  if (STORY_ANALYSIS_REGEX.test(lower)) return false;
  if (CLIENT_SEARCH_REGEX.test(lower)) return false;
  if (SQUAD_SEARCH_REGEX.test(lower)) return false;
  // Guard against generic capability queries ("can you find creators?", "can you find talent?")
  if (/^(?:can\s+you\s+(?:find|search|discover|hire)\s+(?:creators|talent|squads|people)[\?\.\s]*)$/i.test(clean)) {
    return false;
  }

  // Check explicit creator search patterns and natural language requests
  if (
    CREATOR_SEARCH_INTENT_REGEX.test(lower) ||
    FUNCTIONAL_ROLE_ACTION_PATTERN.test(lower) ||
    WHO_CAN_ACTION_PATTERN.test(lower)
  ) {
    return true;
  }

  // Check against active project open capabilities (only if not in creator job-seeker mode)
  if (
    context?.currentUserType !== "CREATOR" &&
    context?.activeGoal !== "FIND_JOB" &&
    context?.activeProject?.roles &&
    context.activeProject.roles.length > 0
  ) {
    const searchPrefix = /\b(?:find|search(?:\s+for)?|show\s+me|list|get\s+me|look\s+for|(?:can|could|would)\s+you\s+(?:find|get))\b/i;
    if (searchPrefix.test(lower)) {
      for (const r of (context.activeProject.roles as any[])) {
        const name = r?.roleName || r?.role || r?.name || (typeof r === "string" ? r : "");
        if (name && lower.includes(name.toLowerCase())) {
          return true;
        }
      }
    }
  }

  return false;
}

function classifyUserIntentCore(
  userText: string,
  context?: {
    hasActiveProject?: boolean;
    activeProject?: OmniForgeProject | null;
    conversationHistory?: ChatMessage[];
    currentUserRole?: string;
    currentUserType?: "CREATOR" | "CLIENT";
    activeGoal?: "FIND_JOB" | "HIRE_TALENT" | "BUILD_PROJECT";
  }
): IntentActionResult {
  const clean = userText.trim();
  const lower = clean.toLowerCase();

  // Detect and track user director role
  const detectedRole = detectUserRoleFromText(clean);
  let isUserDirector = Boolean(
    detectedRole === "DIRECTOR" ||
    context?.currentUserRole === "DIRECTOR" ||
    context?.activeProject?.currentUserRole === "DIRECTOR"
  );
  if (!isUserDirector && context?.conversationHistory) {
    for (const m of context.conversationHistory) {
      if (m.sender === "user" && detectUserRoleFromText(m.text) === "DIRECTOR") {
        isUserDirector = true;
        break;
      }
    }
  }

  // 0. Follow-up Context Resolution (e.g. "please respond to the above question")
  if (FOLLOWUP_REGEX.test(clean) && context?.conversationHistory && context.conversationHistory.length > 0) {
    const priorUserMsgs = context.conversationHistory.filter(
      (m) => m.sender === "user" && !FOLLOWUP_REGEX.test(m.text.trim())
    );
    if (priorUserMsgs.length > 0) {
      const lastUserMsg = priorUserMsgs[priorUserMsgs.length - 1];
      return classifyUserIntent(lastUserMsg.text, {
        ...context,
        conversationHistory: context.conversationHistory.slice(0, -1),
      });
    }
  }

  // 1. CLARIFICATION & NEGATION (User clarifies intent: "I didn't ask you to search")
  if (CLARIFICATION_NEGATION_REGEX.test(lower)) {
    return {
      intent: "CLARIFICATION",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Conversational clarification regarding search capabilities.",
      deterministicText: "Understood! Yes, I can search the OmniCraft creator directory and client opportunities whenever you're ready. Let me know what you'd like to look for (for instance, 'Find all video editors' or 'Find clients for film projects').",
      suggestedChips: ["Find Video Editors", "Find Actors", "Find Clients", "Discover Squads"],
    };
  }

  // 1.5 USER SELF-ROLE DECLARATION ("I am a video editor.", "I am a photographer", "iam a developer")
  const selfRoleOnly = extractCreatorSelfRole(clean);
  const isPureSelfDeclaration =
    Boolean(selfRoleOnly) &&
    /^\s*(?:(?:i\s*am|iam|i['’]?m|im|as)\s+(?:a\s+|an\s+|the\s+)?[a-z0-9\/\-\s]+)[\s.?!]*$/i.test(clean) &&
    !/\b(?:find|search|show|get|list|look|looking|need|apply|who|want)\b/i.test(lower);

  if (isPureSelfDeclaration && selfRoleOnly) {
    return {
      intent: "IDENTITY",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserRole: selfRoleOnly.canonicalRole,
      currentUserType: "CREATOR",
      explanation: `User registered profile as ${selfRoleOnly.canonicalRole}.`,
      deterministicText: `Welcome! I've noted that you are a ${selfRoleOnly.canonicalRole}. I can help you discover client opportunities, connect with other creators or squads, or plan new projects. What would you like to explore?`,
      suggestedChips: [
        `Find clients who require ${selfRoleOnly.canonicalRole.toLowerCase()}s`,
        "Find creators",
        "Explore squads",
      ],
    };
  }

  // 2. IDENTITY (User asks: "what is your name?", "who are you?", "what are you?", "tell me about yourself")
  if (IDENTITY_REGEX.test(clean)) {
    return {
      intent: "IDENTITY",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Direct inquiry regarding assistant identity.",
      deterministicText: "I'm OmniForge AI, the AI assistant inside OmniCraft. I can help with general questions, project planning, creator/client discovery, collaboration, hiring workflows, creative writing, analysis, and more.",
      suggestedChips: ["Create a Project", "Find Creators", "Explore Squads", "How to Hire a Creator"],
    };
  }

  // 3. CAPABILITY QUERY (User asks: "what can you do?", "what can you help me with?", "Can you find video editors?")
  if (
    isCapabilityInquiry(clean) &&
    !/\b(?:please\s+find\s+(?:them|now|all)|search\s+now|find\s+now)\b/i.test(lower)
  ) {
    const roleMatch = clean.match(CREATOR_ROLE_PATTERN);
    const targetRole = roleMatch ? roleMatch[0] : null;

    let deterministicText = "I'm OmniForge AI, your AI partner inside OmniCraft. I can help you with:\n\n* **Project Planning & Blueprints:** Turn your concept into a structured production plan with milestones, budgets, and required roles.\n* **Talent & Squad Discovery:** Search verified creators across 20+ specialized roles and browse collaborative squads.\n* **Client Opportunities:** Find paid briefs and hiring requests posted by clients.\n* **Hiring & Invitations:** Guide you through proposals, invitations, terms, and squad formation.\n* **Skill Swap:** Connect with peer creators to exchange skills with zero commission.\n* **Creative & General Advice:** Screenwriting, feedback, script analysis, and answers to technical or general questions.";
    let suggestedChips = ["Create a Project", "Find Creators", "Explore Squads", "How to Hire a Creator"];

    if (targetRole) {
      const capRole = targetRole.charAt(0).toUpperCase() + targetRole.slice(1);
      deterministicText = `Yes, absolutely! I can search the OmniCraft creator directory for verified **${capRole}s**, evaluate candidate experience and portfolio evidence, and help you invite them or form a production squad.\n\nWhenever you're ready, ask me to search (for example, *"Find all ${targetRole}s"* or click the chip below).`;
      suggestedChips = [
        `Find all ${targetRole}s`,
        "Explore Squads",
        "How to Hire a Creator",
        "Create a Project",
      ];
    }

    return {
      intent: "CAPABILITY_QUERY",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      targetRole: targetRole || undefined,
      explanation: targetRole
        ? `Capability inquiry regarding searching for ${targetRole}.`
        : "Inquiry about platform and AI discovery capabilities.",
      deterministicText,
      suggestedChips,
    };
  }

  // 4. GREETING ("hello", "hi", "hey")
  if (GREETING_REGEX.test(clean)) {
    return {
      intent: "GREETING",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Standard conversational greeting.",
      deterministicText: "Hi! I'm OmniForge AI, your creative project partner inside OmniCraft. How can I help you today? We can brainstorm stories, plan your project, or discover creators, clients, and squads.",
      suggestedChips: ["Create a Project", "Find Creators", "Explore Squads", "How does OmniCraft work?"],
    };
  }

  // 4.000 SAVE ROADMAP INTENT ("add this roadmap to my Roadmaps section", "save it", "save roadmap", "add to roadmaps section")
  if (SAVE_ROADMAP_REGEX.test(clean)) {
    return {
      intent: "SAVE_ROADMAP",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "User requested saving active roadmap to the Roadmaps section.",
      deterministicText: "Saving active roadmap to your Roadmaps section...",
      suggestedChips: [
        "Show all my roadmaps",
        "View current roadmap",
        "Explain Stage 1",
        "Give me today's learning tasks",
      ],
    };
  }

  // 4.0005 SKILL INQUIRY / EDUCATIONAL CAREER QUESTIONS ("what skills do i need to become a video editor")
  const skillInquiryMatch = clean.match(SKILL_INQUIRY_REGEX);
  if (skillInquiryMatch) {
    const rawTarget = (skillInquiryMatch[1] || skillInquiryMatch[2] || skillInquiryMatch[3] || "").trim();
    const isVideoEditor = /\b(?:video\s*edit(?:or|ing)?|video-edit(?:or|ing)?)\b/i.test(rawTarget);
    const isCinematographer = /\b(?:cinematograph(?:er|y)|dop|director\s+of\s+photography)\b/i.test(rawTarget);
    const isDSA = /\b(?:dsa|data\s*structures?|algorithms?)\b/i.test(rawTarget);

    let replyText = "";
    let chips: string[] = [];

    if (isVideoEditor) {
      replyText = `### 🎬 Essential Skills for Video Editors\n\n` +
        `To become a professional **Video Editor**, you need a balanced blend of storytelling sensibility, post-production toolchain mastery, and audio/color craft:\n\n` +
        `1. **Non-Linear Editing (NLE) Toolchain:**\n` +
        `   • Industry-standard NLE mastery: Premiere Pro, DaVinci Resolve, or Final Cut Pro.\n` +
        `   • Bin organization, smart asset tagging, and 4K/6K proxy generation workflows.\n\n` +
        `2. **Narrative Pacing & Visual Storytelling:**\n` +
        `   • Cutting on action, matching eyelines, scene pacing, and emotional rhythm.\n` +
        `   • Seamless multi-camera synchronization and narrative continuity.\n\n` +
        `3. **Audio Post-Production & Sound Design:**\n` +
        `   • Dialogue cleanup, de-noising, room-tone patching, J/L cuts, and sound layering.\n` +
        `   • Loudness normalization to broadcast standards (-14 LUFS to -24 LUFS).\n\n` +
        `4. **Color Correction & Look Creation:**\n` +
        `   • Primary balancing using waveform, parade, and vectorscope monitors.\n` +
        `   • Shot-to-shot matching, skin tone isolation, and creative grade/LUT development.\n\n` +
        `5. **Motion Graphics & Delivery Pipelines:**\n` +
        `   • Lower thirds, speed ramps, optical flow retiming, and mastering export codecs.\n\n` +
        `Would you like me to generate a complete, structured **Video Editing Learning Roadmap** with 10 progressive hands-on stages?`;
      chips = [
        "Generate a complete Video Editing roadmap",
        "Find all Video Editors",
        "Explain NLE workflows",
        "Show all my roadmaps",
      ];
    } else if (isCinematographer) {
      replyText = `### 🎥 Essential Skills for Cinematographers (Directors of Photography)\n\n` +
        `A professional **Cinematographer** bridges technical camera optics with dramatic visual storytelling:\n\n` +
        `1. **Camera Operations & Sensor Science:** Shutter angle, dynamic range, dual-native ISO, and RAW formats.\n` +
        `2. **Lighting Architecture:** Three-point setups, motivated lighting, bounce ratios, and color temperature (Kelvin).\n` +
        `3. **Lenses & Optics:** Prime vs. zoom, depth of field, anamorphic vs. spherical flare characteristics.\n` +
        `4. **Composition & Camera Movement:** Eyelines, rule of thirds, gimbals, dollies, and Steadicam blocking.\n` +
        `5. **Director Collaboration:** Translating script themes into visual moodboards and shot lists.\n\n` +
        `Would you like me to generate a complete **Cinematography & Filmmaking Roadmap**?`;
      chips = [
        "Create a roadmap for filmmaking",
        "Find Cinematographers",
        "Show all my roadmaps",
      ];
    } else if (isDSA) {
      replyText = `### 💻 Essential Competencies for Data Structures & Algorithms\n\n` +
        `Mastering **DSA** requires understanding asymptotic limits, memory layouts, and algorithmic paradigms:\n\n` +
        `1. **Time & Space Complexity:** Big-O notation, amortized analysis, and Master Theorem.\n` +
        `2. **Fundamental Structures:** Dynamic arrays, two pointers, sliding window, linked lists, stacks, and queues.\n` +
        `3. **Hierarchical & Non-Linear Structures:** Binary trees, BSTs, heaps, and Union-Find (DSU).\n` +
        `4. **Graph Algorithms:** BFS, DFS, Dijkstra, Bellman-Ford, topological sort, and MST.\n` +
        `5. **Algorithmic Paradigms:** Divide-and-conquer, backtracking, and 1D/2D dynamic programming.\n\n` +
        `Would you like me to generate a complete **14-stage DSA Learning Roadmap**?`;
      chips = [
        "Generate a complete DSA roadmap",
        "Explain Big-O Complexity",
        "Show all my roadmaps",
      ];
    } else {
      const capTarget = rawTarget.charAt(0).toUpperCase() + rawTarget.slice(1);
      replyText = `### 💡 Core Competencies for ${capTarget}\n\n` +
        `Building professional expertise in **${capTarget}** requires:\n\n` +
        `1. **Foundational Principles:** Core domain mechanics, industry terminology, and mental models.\n` +
        `2. **Industry Toolchain:** Practical tool mastery, standard workflows, and execution environments.\n` +
        `3. **Hands-On Problem Solving:** Iterative projects, real-world case studies, and progressive challenges.\n` +
        `4. **Quality & Optimization:** Diagnostic troubleshooting, standards compliance, and performance tuning.\n` +
        `5. **Capstone Portfolio:** End-to-end deliverables demonstrating mastery to clients or employers.\n\n` +
        `Would you like me to generate a structured learning roadmap for **${capTarget}**?`;
      chips = [
        `Create a roadmap for ${capTarget}`,
        "Show all my roadmaps",
      ];
    }

    return {
      intent: "EXPLAIN_TOPIC",
      confidence: 0.98,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      targetRole: rawTarget,
      explanation: `Educational skill inquiry regarding ${rawTarget}.`,
      deterministicText: replyText,
      suggestedChips: chips,
    };
  }

  // 4.001 EXPAND PARTICULAR ROADMAP STAGE (Section 2 & 8)
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
      explanation: `User requested expanding Stage ${stageNum} with comprehensive deep curriculum content.`,
      deterministicText: `✓ **Stage ${stageNum} Expanded!** Generated deep topics, runnable code examples, common pitfalls, and verifiable knowledge checks for Stage ${stageNum}. Check the Stage Inspector in your Roadmap view.`,
      suggestedChips: [
        `Explain Stage ${stageNum}`,
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
      deterministicText: `Here is the comparative summary of your active and saved roadmap tracks, including completed milestones, active focus, and remaining effort.`,
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
      explanation: `User requested deletion of ${targetSubj} roadmap artifact.`,
      deterministicText: `Are you sure you want to delete your **${targetSubj}** roadmap? You can use the trash button in the Roadmaps sidebar to permanently delete it, or confirm here. This action cannot be undone.`,
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
      explanation: `User requested topic explanation for ${rawTopic}.`,
      deterministicText: `### 💡 Deep Concept Explanation: ${rawTopic}\n\n` +
        `**Core Concept & Rationale:**\nUnderstanding ${rawTopic} is foundational for building scalable, resilient architectures and eliminating common runtime failure modes.\n\n` +
        `**Key Principles:**\n• Separation of Concerns & Clean Encapsulation\n• Strict Defensive Input Validation & Boundary Checks\n• Resource Management & Memory Profiling\n\n` +
        `**Practical Code Example:**\n\`\`\`typescript\n// Practical demonstration of ${rawTopic}\nexport function executeConcept() {\n  return { topic: "${rawTopic}", verified: true };\n}\n\`\`\`\n\n` +
        `**Troubleshooting & Pitfalls:**\n• Avoid mutative state updates across asynchronous boundaries.\n• Always assert precondition invariants prior to invoking downstream procedures.`,
      suggestedChips: [
        `Give me exercises for ${rawTopic}`,
        "Explain current milestone",
        "View current roadmap",
      ],
    };
  }

  // 4.01 RESUME NEXT INCOMPLETE MILESTONE (Section 4)
  if (RESUME_NEXT_MILESTONE_REGEX.test(clean)) {
    return {
      intent: "RESUME_NEXT_MILESTONE",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "User requested to resume the next incomplete milestone in their current journey.",
      deterministicText: `Resuming your learning journey! Taking you directly to your active milestone. The roadmap pointer has focused on your current in-progress stage.`,
      suggestedChips: ["Explain current milestone", "Give me today's learning tasks", "Show my skill gaps", "Show my roadmap"],
    };
  }

  // 4.02 EXPLAIN CURRENT MILESTONE (Section 4)
  if (EXPLAIN_CURRENT_MILESTONE_REGEX.test(clean)) {
    return {
      intent: "EXPLAIN_CURRENT_MILESTONE",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "Inquiry to explain the objectives, concept rationale, and deliverables for the active milestone.",
      deterministicText: `Here is the comprehensive breakdown of your active milestone, including why you are learning it, prerequisite foundations, checklist topics, project deliverables, and the evaluation rubric.`,
      suggestedChips: ["Give me today's learning tasks", "Generate exercises for this", "Start this project", "Show my roadmap"],
    };
  }

  // 4.03 TODAY'S LEARNING TASKS (Section 4)
  if (TODAY_LEARNING_TASKS_REGEX.test(clean)) {
    return {
      intent: "TODAY_LEARNING_TASKS",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "Request for high-yield daily learning tasks structured for active milestone.",
      deterministicText: `Here is your targeted daily learning plan paced for ~1.5 hours today, covering core theory, hands-on practice, and recommended free resources.`,
      suggestedChips: ["Explain current milestone", "Generate exercises for this", "Complete this task", "Show my roadmap"],
    };
  }

  // 4.04 GENERATE EXERCISES FOR A SPECIFIC TOPIC (Section 4)
  const exerciseMatch = clean.match(GENERATE_TOPIC_EXERCISES_REGEX);
  if (exerciseMatch) {
    const rawTopic = (exerciseMatch[1] || exerciseMatch[2] || exerciseMatch[3] || "CSS Grid").trim();
    return {
      intent: "GENERATE_TOPIC_EXERCISES",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      targetRole: rawTopic,
      explanation: `User requested targeted practical coding exercises for ${rawTopic}.`,
      deterministicText: `Here are three progressive hands-on coding exercises for **${rawTopic}** ranging from foundational syntax to milestone challenge.`,
      suggestedChips: ["Review my code", "Explain current milestone", "Give me today's learning tasks", "Show my roadmap"],
    };
  }

  // 4.05 REVIEW PROJECT OR CODE (Section 4)
  if (REVIEW_PROJECT_OR_CODE_REGEX.test(clean)) {
    return {
      intent: "REVIEW_PROJECT_OR_CODE",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "Request to review project submission or code implementation against rubric.",
      deterministicText: `I will evaluate your code implementation against the active milestone requirements and rubric. Open the center Project Workspace to paste your code, repo URL, or live demo for formal AI evaluation.`,
      suggestedChips: ["Start this project", "Assess my skills", "Explain current milestone", "Show my roadmap"],
    };
  }

  // 4.06 ASSESS SKILLS (Section 4)
  if (ASSESS_SKILLS_REGEX.test(clean)) {
    return {
      intent: "ASSESS_SKILLS",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "Request for comprehensive Skill DNA assessment and competency breakdown.",
      deterministicText: `Here is your verified **Skill DNA Competency Assessment** based on authentic project submissions and evidence records.`,
      suggestedChips: ["Show my skill gaps", "What should I learn next?", "Show my roadmap", "Analyze my resume"],
    };
  }

  // 4.07 MARK MILESTONE COMPLETE (Section 4 & 7)
  if (MARK_MILESTONE_COMPLETE_REGEX.test(clean)) {
    return {
      intent: "MARK_MILESTONE_COMPLETE",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "Explicit request or evidence confirmation to mark milestone complete and record verified progress.",
      deterministicText: `✓ **Milestone Verification Confirmed!** Your verified proficiency score has been updated in your Skill DNA, and the roadmap pointer has advanced to the next milestone in your learning journey.`,
      suggestedChips: ["What should I learn next?", "Give me today's learning tasks", "Start next project", "Show my roadmap"],
    };
  }

  // 4.074 ROADMAP CAPABILITY INQUIRY ("Can you create a roadmap?", "Can you make a roadmap?")
  const isRoadmapCapability =
    /^(?:(?:so\s+)?(?:can|could|are|do|would)\s+you\s+(?:able\s+to\s+)?(?:create|make|build|generate)\s+(?:a\s+|an\s+)?(?:learning\s+|career\s+|custom\s+)?roadmaps?[\s.?!]*)$/i.test(clean) ||
    /^(?:do\s+you\s+(?:support|offer|have)\s+roadmaps?[\s.?!]*)$/i.test(clean);

  if (isRoadmapCapability) {
    return {
      intent: "ROADMAP_CAPABILITY_INQUIRY",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "General capability inquiry regarding roadmap creation capabilities.",
      deterministicText:
        "Yes! I can generate comprehensive, structured learning and execution roadmaps for any domain or goal—including software engineering (Rust, Go, Java, Python, C++, Frontend), creative disciplines (Filmmaking, Screenwriting, Cinematography), business execution, and exam preparation.\n\n" +
        "Each roadmap includes sequenced progressive milestones, detailed checklists, core concepts, practical mini-projects, and clear completion criteria.\n\n" +
        "What domain, career path, or project would you like to build a roadmap for?",
      suggestedChips: [
        "Create a roadmap for filmmaking",
        "Create a roadmap for Rust",
        "Create a roadmap for Python",
        "Show all my roadmaps",
      ],
    };
  }

  // 4.075 LIST ALL SAVED ROADMAPS
  if (LIST_ALL_ROADMAPS_REGEX.test(clean)) {
    return {
      intent: "LIST_SAVED_ROADMAPS",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "Request to view and switch between all saved roadmaps.",
      deterministicText: `### 📚 Your Saved Learning Roadmaps & Execution Plans\n\nYou have independent, subject-specific roadmaps saved in your profile. You can open any roadmap directly:`,
      suggestedChips: ["Show my filmmaking roadmap", "Open my Java roadmap", "Create a roadmap for Rust", "Show current roadmap"],
    };
  }

  // 4.076 CREATOR PROFILE VIEW (Authorized Directory Resolution)
  const creatorProfMatch = clean.match(CREATOR_PROFILE_REGEX);
  if (creatorProfMatch || clean === "view profile" || clean === "show profile" || clean === "see profile") {
    const rawTarget = creatorProfMatch ? (creatorProfMatch[1] || creatorProfMatch[2] || creatorProfMatch[3] || creatorProfMatch[4] || "").trim() : "";
    return {
      intent: "CREATOR_PROFILE",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      targetCreatorName: rawTarget,
      explanation: "Request to view authentic verified creator profile from directory.",
      suggestedChips: ["Invite to Squad", "Add to Team", "Send Message", "Show More Creators"],
    };
  }

  // 4.078 VIEW SPECIFIC SAVED ROADMAP ("Show my filmmaking roadmap", "Open my Java roadmap")
  const viewSavedMatch = clean.match(VIEW_SAVED_ROADMAP_REGEX);
  if (viewSavedMatch) {
    const rawSubject = (viewSavedMatch[1] || "").trim();
    const isGenericCurrent = /^(?:current|active|my|the)$/i.test(rawSubject);
    if (!isGenericCurrent && rawSubject.length > 0) {
      const capSubject = rawSubject.charAt(0).toUpperCase() + rawSubject.slice(1);
      return {
        intent: "VIEW_SAVED_ROADMAP",
        confidence: 0.99,
        project_action: "NONE",
        matching_action: "NONE",
        currentUserType: "CREATOR",
        targetRoadmapTitle: capSubject,
        roadmapSubject: capSubject,
        careerGoal: capSubject,
        explanation: `User requested to view saved roadmap for ${capSubject}.`,
        deterministicText: `Here is your saved **${capSubject} Roadmap**. Your milestone progress, checklists, and active stage are displayed in the interactive Roadmap viewer.`,
        suggestedChips: [
          `Explain current milestone of ${capSubject}`,
          "Give me today's learning tasks",
          "Show all my roadmaps",
        ],
      };
    }
  }

  // 4.08 VIEW CURRENT ROADMAP (Section 4)
  if (VIEW_CURRENT_ROADMAP_REGEX.test(clean)) {
    const isJavaReq = /\b(?:java)\b/i.test(clean) && !/\b(?:javascript)\b/i.test(clean);
    const isPythonReq = /\b(?:python)\b/i.test(clean);
    const requestedSubject = isJavaReq ? "Java" : isPythonReq ? "Python" : undefined;

    return {
      intent: "VIEW_CURRENT_ROADMAP",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      careerGoal: requestedSubject,
      explanation: "Request to view active learning roadmap and progress.",
      deterministicText: isJavaReq
        ? `Here is your complete **24-stage Java Mastery Roadmap**. All 24 milestones, active progress, topic checklists, and hands-on exercises are ready in the interactive viewer.`
        : isPythonReq
        ? `Here is your **Python Mastery Roadmap**. Your 12 progressive milestones are active in the interactive roadmap viewer.`
        : `Here is your active learning roadmap. Your visual path, milestone markers, and active stage are displayed in the AI Roadmap panel.`,
      suggestedChips: ["Explain current milestone", "Give me today's learning tasks", "Show my skill gaps", "What should I learn next?"],
    };
  }

  // 4.09 CREATE SEPARATE HTML/FRONTEND ROADMAP (Section 1 & 2)
  if (CREATE_SEPARATE_FRONTEND_ROADMAP_REGEX.test(clean)) {
    const frontendRoadmap = buildUniversalRoadmap("Create frontend roadmap", context?.activeProject?.id);
    return {
      intent: "ROADMAP_CREATE",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      targetRole: "HTML & Frontend Development",
      careerGoal: "HTML & Frontend Development",
      roadmapSubject: "HTML & Frontend Development",
      roadmapDomain: "Web & Frontend Engineering",
      roadmapData: frontendRoadmap,
      explanation: "User explicitly confirmed creating a dedicated 12-stage HTML & Frontend learning roadmap.",
      deterministicText: `I have generated your comprehensive 12-stage **HTML & Frontend Development** learning roadmap! Your existing Full Stack Developer journey is safely preserved, and you can switch between tracks anytime.`,
      suggestedChips: ["Explain current milestone", "Give me today's learning tasks", "Continue my current journey", "Show my skill gaps"],
    };
  }

  // 4.095 MODIFY/REFINE ACTIVE ROADMAP (Section 4: Avoid duplicate history)
  if (
    !SAVE_ROADMAP_REGEX.test(clean) &&
    !/\b(?:roadmaps?\s+section|sidebar)\b/i.test(clean) &&
    /\b(?:add\s+(?:accessibility|testing|multithreading|jvm|concurrency|[\w\s,&]+?)\s+to\s+(?:my\s+)?(?:frontend\s+|current\s+|html\s+|java\s+|python\s+|filmmaking\s+)?roadmap|make\s+(?:it|my\s+roadmap|the\s+roadmap|stage\s+\d+|the\s+second\s+stage|the\s+\w+\s+stage)\s+more\s+detailed|improve\s+(?:the\s+)?(?:\w+\s+stage|stage\s+\d+|my\s+roadmap|the\s+roadmap)|refine\s+(?:my\s+)?roadmap|update\s+(?:my\s+)?roadmap)\b/i.test(clean)
  ) {
    const stageMatch = clean.match(/\b(?:stage\s+(\d+)|the\s+(\w+)\s+stage)\b/i);
    const targetStage = stageMatch ? (stageMatch[1] || stageMatch[2]) : undefined;
    return {
      intent: "MODIFY_ROADMAP",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "User requested refinement or addition to active roadmap artifact without creating duplicates.",
      deterministicText: `✓ **Active Roadmap Refined & Updated!** I have modified ${targetStage ? `${targetStage} stage of ` : ""}your existing roadmap artifact with expanded detail, comprehensive topic checklists, and hands-on practical exercises. Your active milestone progress remains intact.`,
      suggestedChips: ["View current roadmap", "Explain current milestone", "Give me today's learning tasks"],
    };
  }

  // 4.1 CAREER GOAL & ROADMAP CREATION (Universal Dynamic Roadmaps on Demand)
  const isSubjectCorrection =
    /\b(?:not\s+(?:full\s*stack|html|frontend|web\s*dev)[\s,]+(?:i\s+(?:need|want)|give\s+me\s+)?(java|python))\b/i.test(clean) ||
    /\b(?:not\s+full\s*stack[\s,]+(?:i\s+(?:need|want)\s+)?java)\b/i.test(clean) ||
    /\b(?:i\s+(?:need|want)\s+java)\b/i.test(clean);

  const careerGoalMatch = clean.match(CAREER_GOAL_ROADMAP_REGEX);
  const isExecutionPlanQuery =
    /\b(?:plan|build|develop|architect|execute)\s+(?:a\s+|an\s+|the\s+)?(?:complete\s+|full\s+)?(?:production\s+of\s+(?:a\s+|an\s+|the\s+)?)?(?:mobile|ios|android|web|restaurant|software|system|cloud|short\s+film|film|movie|event|festival)\s*(?:application|app|platform|service|system|production|project)?\b/i.test(clean) ||
    /\bhelp\s+me\s+plan\b/i.test(clean);
  const isIncompletePrompt = /^\s*i\s+(?:need|want)\s+(?:as\s+a)?[\s.?!]*$/i.test(clean);
  const isExplicitRoadmap =
    CREATE_NEW_ROADMAP_REGEX.test(clean) ||
    ROADMAP_EXPLICIT_REGEX.test(clean) ||
    isExecutionPlanQuery ||
    isIncompletePrompt;

  if (careerGoalMatch || isExplicitRoadmap || isSubjectCorrection) {
    const { subject: detectedSubj, domain: detectedDomain, isExecutionPlan, isAmbiguous } = detectRoadmapSubject(clean);

    // If ambiguous or no subject extracted, do not fabricate or save corrupted roadmap
    if (isAmbiguous || !detectedSubj) {
      return {
        intent: "ROADMAP_CAPABILITY_INQUIRY",
        confidence: 0.95,
        project_action: "NONE",
        matching_action: "NONE",
        currentUserType: "CREATOR",
        explanation: "User requested a roadmap without specifying a concrete subject or domain.",
        deterministicText:
          `I can generate a comprehensive, interactive progressive roadmap for any technology, creative discipline, or project!\n\n` +
          `Which field or career goal would you like a roadmap for? You can choose one of the options below or specify any topic (e.g., *Frontend Development*, *Short Film Production*, *Mobile Application Development*, *Java*, *Python*, or *Rust*).`,
        suggestedChips: [
          "Frontend Development",
          "Short Film Production",
          "Mobile Application Development",
          "Java Software Engineering",
          "Python Backend",
        ],
      };
    }

    const normSubj = detectedSubj.toLowerCase();
    const isFilmmaking = normSubj.includes("film") || normSubj.includes("cinema") || normSubj.includes("movie");
    const isJava = (/\b(?:java|jvm|spring)\b/i.test(clean) && !/\b(?:javascript)\b/i.test(clean)) || (normSubj.includes("java") && !normSubj.includes("javascript"));
    const isPython = /\b(?:python|fastapi|django)\b/i.test(clean) || normSubj.includes("python");
    const isHtmlOrFrontend = (/\b(?:html|frontend|front[\s\-]?end|web\s*dev)\b/i.test(clean) && !normSubj.includes("full stack")) || normSubj.includes("frontend") || normSubj.includes("html");

    // Project Execution Plans (e.g. Mobile Application Development, System Build)
    if (isExecutionPlan || normSubj.includes("mobile") || normSubj.includes("app")) {
      const execRoadmap = buildUniversalRoadmap(clean, context?.activeProject?.id);
      return {
        intent: "ROADMAP_CREATE",
        confidence: 0.99,
        project_action: "NONE",
        matching_action: "NONE",
        currentUserType: "CREATOR",
        targetRole: execRoadmap.targetRole || `${detectedSubj} Architect`,
        careerGoal: detectedSubj,
        roadmapSubject: detectedSubj,
        roadmapDomain: detectedDomain,
        roadmapData: execRoadmap,
        explanation: `User requested a comprehensive project execution plan for ${detectedSubj}.`,
        deterministicText: formatRoadmapConversationalOverview(execRoadmap),
        suggestedChips: [
          `Explain Phase 1 of ${detectedSubj}`,
          "Review architecture blueprint",
          "Show all my roadmaps",
        ],
      };
    }

    // Filmmaking Roadmap (12 Stages)
    if (isFilmmaking) {
      const filmRoadmap = buildUniversalRoadmap(clean, context?.activeProject?.id);
      return {
        intent: "ROADMAP_CREATE",
        confidence: 0.99,
        project_action: "NONE",
        matching_action: "NONE",
        currentUserType: "CREATOR",
        targetRole: "Independent Filmmaker & Director",
        careerGoal: detectedSubj || "Short Film Production",
        roadmapSubject: detectedSubj || "Short Film Production",
        roadmapDomain: detectedDomain,
        roadmapData: filmRoadmap,
        explanation: "User requested a complete, structured filmmaking and cinema production roadmap.",
        deterministicText: formatRoadmapConversationalOverview(filmRoadmap),
        suggestedChips: [
          "Explain Stage 1: Concept Development",
          "What equipment do I need?",
          "How do I find a cinematographer?",
          "Show all my roadmaps",
        ],
      };
    }

    if (isJava) {
      const javaRoadmap = buildUniversalRoadmap(clean, context?.activeProject?.id);
      return {
        intent: "ROADMAP_CREATE",
        confidence: 0.99,
        project_action: "NONE",
        matching_action: "NONE",
        currentUserType: "CREATOR",
        targetRole: "Senior Java & Backend Engineer",
        careerGoal: detectedSubj || "Java",
        roadmapSubject: detectedSubj || "Java",
        roadmapDomain: detectedDomain,
        roadmapData: javaRoadmap,
        explanation: "User requested a complete, structured, interactive Java learning roadmap from beginner to advanced.",
        deterministicText: formatRoadmapConversationalOverview(javaRoadmap),
        suggestedChips: [
          "Show the complete roadmap",
          "Explain Stage 1: Java Ecosystem",
          "Give me today's learning tasks",
          "Show all my roadmaps",
        ],
      };
    }

    if (isPython) {
      const pyRoadmap = buildUniversalRoadmap(clean, context?.activeProject?.id);
      return {
        intent: "ROADMAP_CREATE",
        confidence: 0.99,
        project_action: "NONE",
        matching_action: "NONE",
        currentUserType: "CREATOR",
        targetRole: "Python Backend & Automation Engineer",
        careerGoal: detectedSubj || "Python",
        roadmapSubject: detectedSubj || "Python",
        roadmapDomain: detectedDomain,
        roadmapData: pyRoadmap,
        explanation: "User requested dedicated Python learning roadmap.",
        deterministicText: formatRoadmapConversationalOverview(pyRoadmap),
        suggestedChips: [
          "Show the complete roadmap",
          "Explain current milestone",
          "Give me today's learning tasks",
          "Show all my roadmaps",
        ],
      };
    }

    if (isHtmlOrFrontend) {
      const feRoadmap = buildUniversalRoadmap(clean, context?.activeProject?.id);
      return {
        intent: "ROADMAP_CREATE",
        confidence: 0.99,
        project_action: "NONE",
        matching_action: "NONE",
        currentUserType: "CREATOR",
        targetRole: "Frontend Software Engineer",
        careerGoal: detectedSubj || "Frontend Development",
        roadmapSubject: detectedSubj || "Frontend Development",
        roadmapDomain: detectedDomain,
        roadmapData: feRoadmap,
        explanation: `User requested dedicated ${detectedSubj} learning roadmap.`,
        deterministicText: formatRoadmapConversationalOverview(feRoadmap),
        suggestedChips: [
          "Explain current milestone",
          "Give me today's learning tasks",
          "Show all my roadmaps",
        ],
      };
    }

    // Universal Dynamic Roadmap for ANY other discipline (Rust, Go, C++, Cybersecurity, Marketing, etc.)
    if (detectedSubj && detectedSubj.toLowerCase() !== "full stack developer") {
      const customRoadmap = buildUniversalRoadmap(clean, context?.activeProject?.id);
      return {
        intent: "ROADMAP_CREATE",
        confidence: 0.99,
        project_action: "NONE",
        matching_action: "NONE",
        currentUserType: "CREATOR",
        targetRole: customRoadmap.targetRole || `${detectedSubj} Specialist`,
        careerGoal: detectedSubj,
        roadmapSubject: detectedSubj,
        roadmapDomain: detectedDomain,
        roadmapData: customRoadmap,
        explanation: `User requested a complete learning roadmap for ${detectedSubj}.`,
        deterministicText: formatRoadmapConversationalOverview(customRoadmap),
        suggestedChips: [
          `Explain Stage 1 of ${detectedSubj}`,
          "Give me today's learning tasks",
          "Show all my roadmaps",
        ],
      };
    }

    // Default Full Stack response only if explicitly requested Full Stack Developer
    let rawGoal = "Full Stack Developer";
    if (careerGoalMatch) {
      rawGoal = careerGoalMatch[1];
    }
    const normGoal = rawGoal.toLowerCase().includes("ai") ? "AI Engineer"
      : rawGoal.toLowerCase().includes("cyber") ? "Cybersecurity Engineer"
      : rawGoal.toLowerCase().includes("software") ? "Software Engineer"
      : "Full Stack Developer";

    return {
      intent: "ROADMAP_REQUEST",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      careerGoal: normGoal,
      explanation: `User requested personalized learning roadmap for ${normGoal}. Existing journey detected and offered context-aware choices.`,
      deterministicText:
        `I have analyzed your profile for **${normGoal}**. Based on your verified Skill DNA, you already have strong HTML/CSS fundamentals (91% / 76%), so you do not need to restart from scratch. Your personalized progressive roadmap is active in the AI Roadmap panel on the right.\n\nYour active milestone is **Level 4: JavaScript Fundamentals** (Task: Build an Interactive Financial Calculator).`,
      suggestedChips: [
        "Continue my current journey",
        "Create a separate HTML/frontend roadmap",
        "Review and improve my current roadmap",
      ],
    };
  }

  // 4.2 SKILL GAPS INQUIRY (Section 6 & 12)
  if (SKILL_GAPS_REGEX.test(clean)) {
    return {
      intent: "SKILL_GAP_REQUEST",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "Inquiry into current skill gaps against target career role.",
      deterministicText: `Here is your verified **Skill Gap Analysis** for **Full Stack Developer**:\n\n• **HTML:** 91% (Required: 80%) — ✓ Satisfied\n• **CSS:** 76% (Required: 80%) — Small Gap (-4%)\n• **JavaScript:** 63% (Required: 85%) — Medium Gap (-22%)\n• **React:** 41% (Required: 80%) — Large Gap (-39%)\n• **Node.js:** 25% (Required: 75%) — Large Gap (-50%)\n• **SQL:** 58% (Required: 70%) — Medium Gap (-12%)\n\nReview the live interactive Skill Gap Matrix in the center workspace.`,
      suggestedChips: ["What should I learn next?", "Show my roadmap", "Analyze my resume", "How close am I?"],
    };
  }

  // 4.3 WHAT SHOULD I LEARN NEXT? (Section 13)
  if (WHAT_TO_LEARN_NEXT_REGEX.test(clean)) {
    return {
      intent: "NEXT_LEARNING_REQUEST",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      currentUserType: "CREATOR",
      explanation: "Deterministic reasoned recommendation for next competency.",
      deterministicText: `**Recommendation:** Learn **JavaScript Fundamentals & DOM APIs** next.\n\n**Why:** Your HTML (91%) and CSS (76%) foundations are verified and sufficient. Advancing your JavaScript proficiency from 63% to 85% is the critical prerequisite before advancing to React components and Node.js backend services.\n\n**Next Action:** Complete the Level 4 practical task: *Build an Interactive Financial Calculator*.`,
      suggestedChips: ["Start this project", "Explain this concept", "Show my roadmap", "Show my skill gaps"],
    };
  }

  // 4.4 TASK ACTIONS (Section 10 & 24)
  if (TASK_ACTION_REGEX.test(clean)) {
    const isComplete = /\b(?:complete|finish|mark\s+complete|done)\b/i.test(clean);
    const isSkipInquiry = /\bcan\s+i\s+skip\b|\bwhy\s+can'?t\s+i\s+skip\b/i.test(clean);
    const isSkip = /\bskip\b/i.test(clean) && !isSkipInquiry;
    const isStart = /\b(?:start|begin|open|work\s+on)\b/i.test(clean);

    return {
      intent: "TASK_ACTION",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: isComplete
        ? "Roadmap task completion"
        : isSkipInquiry
        ? "Roadmap milestone skip eligibility check"
        : isSkip
        ? "Roadmap task skip"
        : "Project start",
      deterministicText: isComplete
        ? `✓ **Milestone Task Completed!** Your verified competency score has been recorded in your Skill DNA, and the roadmap pointer has advanced to the next milestone in your learning journey.`
        : isSkipInquiry
        ? `🔒 **Milestone Verification Gate:** Roadmap progression requires verified practical work or passing assessment scores. Check the center Project Workspace to see the exact criteria.`
        : isSkip
        ? `➔ **Milestone Skipped.** Marked as review-required and advanced your pointer to the next active concept in your roadmap.`
        : `🚀 **Project Initiated!** Your workspace has loaded the deliverables and tasks for this stage.`,
      suggestedChips: ["What should I learn next?", "Show my roadmap", "Show my progress", "Show my skill gaps"],
    };
  }

  // 4.5 RESUME ANALYSIS REQUEST (Section 4)
  if (RESUME_ANALYSIS_REGEX.test(clean)) {
    return {
      intent: "RESUME_ANALYSIS_REQUEST",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "User requested resume analysis and competency extraction.",
      deterministicText: `Please upload or paste your resume so I can analyze your education, projects, technologies, experience, and verified skills before fine-tuning your Skill DNA and roadmap. Click the **Upload Resume** button above to proceed.`,
      suggestedChips: ["Upload Resume", "Show my roadmap", "Show my skill gaps"],
    };
  }

  // 4.6 CLIENT PROJECT PLAN ENGINE (Section 14 & 15)
  if (PROJECT_PLAN_ENGINE_REGEX.test(clean)) {
    return {
      intent: "PROJECT_PLAN_REQUEST",
      confidence: 0.99,
      project_action: "CREATE_PROJECT",
      matching_action: "MATCH_ROLES",
      currentUserType: "CLIENT",
      explanation: "Client initiated project plan generation with task decomposition.",
      deterministicText: `### 📋 AI Project Plan & Architecture Generated\n\nI have structured a complete end-to-end production architecture for your application:\n\n• **Core Modules:** Authentication, Catalog, Payment Pipeline, AI Recommendation & Dispatch\n• **Required Roles:** Frontend Engineer, Backend Engineer, AI/ML Engineer, DevOps Engineer\n• **Estimated Timeline:** 8 Weeks across 4 Phased Milestones\n\nThe full interactive Project Plan is displayed in the center workspace. Expand any phase to inspect modules, tasks, and dependencies.`,
      suggestedChips: ["Find Frontend Engineers", "Find Backend Engineers", "Find AI Engineers", "Review Tech Stack"],
    };
  }

  // 4.7 PROGRESS & READINESS INQUIRY (Section 24)
  if (PROGRESS_INQUIRY_REGEX.test(clean)) {
    return {
      intent: "PROGRESS_INQUIRY",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Inquiry into career progress and readiness.",
      deterministicText: `📊 **Career Progress Summary:**\n\n• **Target Goal:** Full Stack Developer\n• **Overall Mastery:** 40% Completed (4 of 10 Milestones Mastered)\n• **Active Level:** Level 5 (JavaScript DOM & Asynchronous APIs)\n• **Key Strengths:** HTML (91%), CSS (76%), Python (82%), Git (72%)\n• **Next Milestone:** React Component Architecture (Level 6)`,
      suggestedChips: ["What should I learn next?", "Show my roadmap", "Show my skill gaps"],
    };
  }

  // 4.8 WHY LEARN THIS / CONCEPT EXPLANATION (Section 24)
  if (WHY_LEARN_THIS_REGEX.test(clean)) {
    return {
      intent: "CONCEPT_EXPLANATION",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Explanation of concept rationale and curriculum placement.",
      deterministicText: `**Why you are learning this:**\n\nEvery milestone in your OmniForge roadmap directly unlocks practical project capabilities. JavaScript DOM & Asynchronous APIs are required to transform static layouts into reactive, cloud-connected interfaces. Without asynchronous fetch patterns, you cannot build real-time full-stack features or integrate backend APIs in subsequent React and Node.js modules.`,
      suggestedChips: ["What should I learn next?", "Show my roadmap", "Start this project"],
    };
  }

  // 5. PRIORITY A: HOW_TO / EXPLANATION / PROCESS
  // Must be evaluated BEFORE checking action keywords so queries like "how do I hire a creator?"
  // or "can you explain how to hire a creator explain the steps" NEVER trigger actual actions.
  const isEducationalTech =
    /\b(?:paging|tcp|udp|osi|avl\s*tree|dbms|socket\s*programming|subnetting|derivative|eigenvalue)\b/i.test(lower);
  const isPlatformHowTo =
    /\b(?:hire|hiring|creator|creators|squad|squads|invite|invitation|invitations|skill\s*swap|omnicraft|omniforge|performer|performers|festival|event|recruit|source|talent|show\s+me\s+how|teach\s+me\s+how|cinematographer|video\s+editor|actor|director|producer|sound\s+designer|musician|developer|designer)\b/i.test(lower);

  if (isHowToQuery(clean) && isPlatformHowTo && !isEducationalTech) {
    let guide = "Sure. Here is the OmniCraft workflow guide:\n\n" +
      "1. **Define Your Scope:** Describe what you are building (film, web app, event, or music production).\n" +
      "2. **Match Talent:** OmniForge searches real profiles from the creator directory matching your required skills.\n" +
      "3. **Form a Squad:** Invite talent or hire pre-formed production squads into a shared collaborative workspace.\n" +
      "4. **Execute Milestones:** Track tasks, dependencies, and deliverables with integrated milestone verification.";
    let chips = ["Find Creators", "Find Squads", "Create a Project"];

    const roleMatch = clean.match(/\b(cinematographer|video\s+editor|actor|director|producer|sound\s+designer|musician|developer|designer|creator)s?\b/i);
    const roleName = roleMatch ? roleMatch[1].toLowerCase() : null;

    if (roleName && (lower.includes("find") || lower.includes("search") || lower.includes("locate") || lower.includes("source") || lower.includes("where"))) {
      const capRole = roleName.charAt(0).toUpperCase() + roleName.slice(1);
      guide = `Here are the steps to find and collaborate with a **${capRole}** in OmniCraft:\n\n` +
        `1. **Define Your Visual Scope & Requirements**\n` +
        `   Specify your project genre, aesthetic requirements, shooting dates, location, and equipment expectations.\n\n` +
        `2. **Search the Verified Creator Directory**\n` +
        `   Search for verified ${roleName}s, filter by genre, camera packages, and verified credits.\n\n` +
        `3. **Review Showreels & Technical Experience**\n` +
        `   Inspect lighting samples, color consistency, past festival selections, and equipment checklists.\n\n` +
        `4. **Send an Invitation or Direct Proposal**\n` +
        `   Send an offer detailing shooting schedule, day rates or squad equity, and required deliverables.\n\n` +
        `5. **Collaborate in Squad Workspace**\n` +
        `   Once accepted, share shot books, lighting diagrams, and call sheets directly in your shared project workspace.`;
      chips = [`Find all ${roleName}s`, "Create a Project", "How to Hire a Creator"];
    } else if (
      lower.includes("hire") ||
      lower.includes("hiring") ||
      (lower.includes("creator") && !lower.includes("squad") && !lower.includes("invite"))
    ) {
      guide = "Sure. Here are the steps to hire a creator in OmniCraft:\n\n" +
        "1. **Define your project requirements**\n" +
        "   Explain what you need, required skills, timeline, budget, and expected deliverables.\n\n" +
        "2. **Find suitable creators**\n" +
        "   Search creators by role, skills, portfolio, and project requirements.\n\n" +
        "3. **Review creator profiles**\n" +
        "   Check their skills, portfolio, experience, availability, and match information.\n\n" +
        "4. **Select a creator**\n" +
        "   Choose the creator who fits your project requirements.\n\n" +
        "5. **Send a hiring proposal**\n" +
        "   Provide the role, project details, budget, timeline, and message.\n\n" +
        "6. **Creator reviews the proposal**\n" +
        "   The creator can accept or decline the proposal.\n\n" +
        "7. **Start collaboration**\n" +
        "   After acceptance, the creator becomes part of the project/squad and collaboration can begin.\n\n" +
        "If you want, I can also walk you through the actual hiring process in OmniCraft.";
      chips = ["Show Hiring Steps", "Explain Creator Matching", "What Happens After Hiring?", "Find Creators"];
    } else if (lower.includes("squad")) {
      guide = "Sure. Here are the steps to hire a creative squad in OmniCraft:\n\n" +
        "1. **Explore Squad Directory**\n" +
        "   Browse verified production squads by specialty (Film & Video, Design, Animation, Music).\n\n" +
        "2. **Review Squad Portfolios & Capabilities**\n" +
        "   Inspect completed client projects, core team members, and collective capabilities.\n\n" +
        "3. **Select a Squad**\n" +
        "   Choose the squad whose portfolio and skill coverage fit your production requirements.\n\n" +
        "4. **Submit a Squad Proposal**\n" +
        "   Provide your project brief, deliverables, target timeline, and proposed budget.\n\n" +
        "5. **Squad Leader Review**\n" +
        "   The squad leader reviews terms, confirms member availability, and accepts or negotiates.\n\n" +
        "6. **Start Squad Collaboration**\n" +
        "   Once confirmed, access your shared squad workspace, task tracker, and milestones.";
      chips = ["Find Squads", "Show Hiring Steps", "What Happens After Hiring?", "Create a Project"];
    } else if (lower.includes("invite") || lower.includes("invitation")) {
      guide = "Sure. Here is how creator invitations work in OmniCraft:\n\n" +
        "1. **Discover Creators**\n" +
        "   Search the OmniCraft directory for talent matching your project requirements (e.g. video editors, actors, cinematographers).\n\n" +
        "2. **Inspect Profile & Match Score**\n" +
        "   Review their verified skills, portfolio links, and match score against your project.\n\n" +
        "3. **Send an Invitation**\n" +
        "   Click the **Invite** button on their creator card to specify the project role, proposed milestones, and message.\n\n" +
        "4. **Creator Reviews & Responds**\n" +
        "   The creator is notified and can review your project details to accept or decline.\n\n" +
        "5. **Start Collaboration**\n" +
        "   Once accepted, the creator is added to your project roster and squad workspace.";
      chips = ["Find Creators", "Show Hiring Steps", "What Happens After Hiring?", "Create a Project"];
    } else if (lower.includes("show me how") || lower.includes("teach me how")) {
      guide = "Here is the step-by-step walkthrough to hire a creator on OmniCraft:\n\n" +
        "1. **Search Talent:** Type `Find video editors` or `Find actors` in chat, or browse the Creators directory.\n" +
        "2. **Review Cards:** Click on any creator's card to view their verified badges, portfolio reels, and rates.\n" +
        "3. **Open Proposal:** Click **Send Offer** or **Invite** on the card to open the hiring proposal modal.\n" +
        "4. **Define Terms:** Set your project scope, deliverable milestones, deadline, and agreed compensation.\n" +
        "5. **Submit & Track:** Once submitted, the creator receives an immediate notification. You can track status in your project workspace.\n\n" +
        "Ready to hire someone? You can type `hire @ramu` or `hire this creator` to get started!";
      chips = ["Find Creators", "Explore Squads", "Create a Project"];
    } else if (lower.includes("skill swap") || lower.includes("swap")) {
      guide = "### How Skill Swap Works on OmniCraft\n\n" +
        "1. **Zero Cash Exchange:** Trade your verified creative abilities (e.g. video editing) for complementary skills (e.g. sound design or 3D animation).\n" +
        "2. **Explore Listings:** Browse available peer offers in the Skill Swap directory.\n" +
        "3. **Propose Swap:** Agree on deliverables and complete milestones mutually without platform fees.";
      chips = ["Skill Swap Directory", "Propose Skill Swap", "Find Creators"];
    } else if (lower.includes("performer") || lower.includes("festival") || lower.includes("event") || lower.includes("recruit")) {
      guide = "### How to Recruit Performers & Talent on OmniCraft\n\n" +
        "1. **Search Creator Directory:** Ask `Find Performers`, `Find Dancers`, or `Find Singers` to directly search verified creator profiles.\n" +
        "2. **Publish a Client Job:** Post a formal brief or casting call with your required skills, dates, and compensation.\n" +
        "3. **Open Collaboration Call:** Post an open call for festival talent across university circuits and local performers.\n" +
        "4. **Direct Invitation:** Send offers or invitations directly to creators via their profile cards.\n\n" +
        "Would you like to search the creator directory for performers now?";
      chips = ["Find Performers", "Find Event Coordinator", "Find Sound Engineer", "Publish Client Job"];
    }

    return {
      intent: "HOW_TO",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Educational how-to guidance explaining OmniCraft platform workflow without executing actions.",
      deterministicText: guide,
      suggestedChips: chips,
    };
  }

  // 6. PRIORITY B: KNOWLEDGE / PLATFORM DEFINITIONS
  // Protects general inquiries like "What is hiring?" or "What is creator collaboration?"
  if (PLATFORM_KNOWLEDGE_REGEX.test(clean)) {
    let defText = "### OmniCraft & OmniForge AI Overview\n\n**OmniCraft** is a creative collaboration and production platform designed for creators, clients, and squads:\n\n* **Creator Directory:** Verified creative and technical talent across 20+ specialized roles.\n* **Squads:** Pre-formed production units collaborating under verified squad leaders.\n* **Client Opportunities:** Paid project listings, creative briefs, and recruitment calls.\n* **Skill Swap:** Direct peer-to-peer capability exchange with zero platform commission.";
    let chips = ["Create a Project", "Find Creators", "Explore Squads", "Skill Swap Directory"];

    if (lower.includes("hiring") || lower.includes("hire")) {
      defText = "In OmniCraft, **hiring** is the structured process of engaging verified creators or creative squads for your project through formal proposals, agreed milestone deliverables, and verified budgets. You can discover talent, review their verified work and match score, send proposals, and collaborate seamlessly in dedicated squad workspaces.";
      chips = ["Find Creators", "How to Hire a Creator", "Explore Squads", "Create a Project"];
    } else if (lower.includes("collaboration") || lower.includes("collab")) {
      defText = "**Creator collaboration** in OmniCraft brings multidisciplinary talent—such as directors, cinematographers, editors, sound designers, and actors—together to co-produce projects, join production squads, or trade capabilities through Skill Swap.";
      chips = ["Find Creators", "Explore Squads", "Skill Swap Directory", "Create a Project"];
    } else if (lower.includes("squad")) {
      defText = "A **squad** on OmniCraft is a pre-formed collaborative production unit of complementary creators (e.g., complete film crew, animation unit, or design team) led by a verified squad leader that clients can hire as a cohesive unit.";
      chips = ["Find Squads", "Explore Film Squads", "Create Squad"];
    } else if (lower.includes("creator")) {
      defText = "**Creators** on OmniCraft are verified creative and technical professionals across 20+ specialized roles—including film directors, cinematographers, video editors, music producers, actors, and UI/UX designers.";
      chips = ["Find Creators", "Browse Directory", "Create a Project"];
    } else if (lower.includes("skill swap") || lower.includes("swap")) {
      defText = "**Skill Swap** is OmniCraft's zero-commission peer-to-peer exchange where creators trade complementary professional skills (for example, video editing in exchange for original music composition) with verified deliverables.";
      chips = ["Skill Swap Directory", "Propose Skill Swap", "Find Creators"];
    }

    return {
      intent: "KNOWLEDGE",
      confidence: 0.98,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Question about OmniForge and platform knowledge.",
      deterministicText: defText,
      suggestedChips: chips,
    };
  }

  // 6b. PRIORITY B2: GENERAL KNOWLEDGE & DEFINITIONS
  // Simple general knowledge/meaning questions (e.g. "What is stress?", "What is the meaning of stress?", "What is motivation?", "What is leadership?")
  // Must be evaluated before role/project actions so standalone knowledge questions NEVER get hijacked by active project context.
  const defTerm = extractDefinitionTerm(clean);
  if (defTerm && !PLATFORM_KNOWLEDGE_REGEX.test(clean)) {
    const normTerm = defTerm.toLowerCase().trim();
    const deterministicAns = DETERMINISTIC_DEFINITIONS[normTerm];
    const isAcademic = /\b(?:viva|exam|semester|lab|experiments?|program|code|algorithm|math|physics|chemistry|biology|tcp|udp|osi|paging|avl\s*tree|dbms|dns|subnetting|derivative|integral|eigenvalue)\b/i.test(normTerm);

    return {
      intent: "DEFINITION",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: `Direct concept definition for ${defTerm}.`,
      deterministicText: deterministicAns,
      suggestedChips: isAcademic
        ? ["Explain in Detail", "Give Examples", "Give 5-Mark Answer", "Give Viva Questions", "Give Programs"]
        : [],
    };
  }

  // 6c. CLIENT OPPORTUNITY SEARCH
  // ("iam a video editor so find the cretors who required a video editor",
  //  "sorry ,find the clients who require video editors",
  //  "I am a video editor looking for clients",
  //  "find clients who need video editors",
  //  "find projects requiring video editors",
  //  "find jobs for video editors",
  //  "who needs a video editor",
  //  "find clients for me")
  if (isClientOpportunitySearchQuery(clean, context)) {
    const targetRole = extractOpportunityTargetRole(clean, context);
    const selfRole = extractCreatorSelfRole(clean);
    const currentUserRole = selfRole?.canonicalRole || selfRole?.role || targetRole;

    return {
      intent: "CLIENT_OPPORTUNITY_SEARCH",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "SEARCH_CLIENT_OPPORTUNITIES",
      searchEntity: "CLIENT_OPPORTUNITIES",
      targetRole,
      currentUserRole,
      currentUserType: "CREATOR",
      activeGoal: "FIND_JOB",
      explanation: `Client opportunity discovery for open projects, jobs, and client briefs requiring ${targetRole}.`,
      suggestedChips: [
        "View Open Opportunities",
        "Show More Opportunities",
        "Apply to Job",
        "View My Applications",
      ],
    };
  }

  // 6d. CREATOR JOB DISCOVERY & OPPORTUNITY SEARCH
  // Priority 1 & 2: Explicit self-role declaration + seeking employment/projects/jobs
  // ("I am a video editor so I need too apply for a job so find all the creators",
  //  "I am a video editor and I want to apply for a job",
  //  "I am a developer looking for work",
  //  "I am a designer looking for clients",
  //  "I am a video editor, find me projects",
  //  "I am a photographer looking for opportunities",
  //  "I am a singer looking for a band")
  if (isCreatorJobSeekingQuery(clean, context)) {
    const selfRole = extractCreatorSelfRole(clean);
    const targetRole =
      selfRole?.canonicalRole ||
      selfRole?.role ||
      context?.currentUserRole ||
      "Video Editor";

    return {
      intent: "CREATOR_JOB_SEARCH",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "SEARCH_CLIENTS",
      searchEntity: "JOBS",
      targetRole,
      currentUserRole: targetRole,
      currentUserType: "CREATOR",
      activeGoal: "FIND_JOB",
      explanation: `Creator discovery for open client jobs and project opportunities matching ${targetRole}.`,
      suggestedChips: [
        "Apply to Job",
        "Show More Opportunities",
        "View My Applications",
        "Search Another Role",
      ],
    };
  }

  // 6d. JOB APPLICATION WORKFLOW ("apply for this job", "apply to this project", "send my application", "I want this job")
  if (isJobApplicationQuery(clean)) {
    return {
      intent: "APPLY_FOR_JOB",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "APPLY_JOB",
      currentUserType: "CREATOR",
      activeGoal: "FIND_JOB",
      currentUserRole: context?.currentUserRole || "Creator",
      explanation: "Submitting application record for selected client job or project opportunity.",
      suggestedChips: ["View Open Opportunities", "Show More Opportunities", "Explore Creator Squads"],
    };
  }

  // 6e. CLIENT / OPPORTUNITY DIRECT SEARCH ("find all clients", "client opportunities")
  if (CLIENT_SEARCH_REGEX.test(lower)) {
    return {
      intent: "CLIENT_SEARCH",
      confidence: 0.98,
      project_action: "NONE",
      matching_action: "SEARCH_CLIENTS",
      targetRole: context?.currentUserRole,
      explanation: "Searching active client opportunities and project briefs.",
      suggestedChips: ["Show More Opportunities", "Search Video Editing Jobs", "Apply to Job"],
    };
  }

  // 6f. SQUAD SEARCH ("find film squads", "find squads")
  if (SQUAD_SEARCH_REGEX.test(lower) && !BUILD_SQUAD_REGEX.test(clean)) {
    return {
      intent: "SQUAD_SEARCH",
      confidence: 0.98,
      project_action: "NONE",
      matching_action: "SEARCH_SQUADS",
      explanation: "Searching creative production squads directory.",
      suggestedChips: ["Hire Selected Squad", "Explore Squads", "Create New Squad"],
    };
  }

  // 7. PRIORITY C: ACTUAL EXECUTION REQUESTS (Direct Imperative Actions)
  // Check for Add Creator to Team action: "Add Ramu to team", "Select Ramu", etc.
  const addCreatorMatch = extractAddCreatorInfo(clean);
  if (addCreatorMatch && addCreatorMatch.creatorName) {
    return {
      intent: "COLLABORATION_ACTION",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "ADD_TO_TEAM",
      targetCreatorName: addCreatorMatch.creatorName,
      targetRole: addCreatorMatch.roleName,
      explanation: `Add ${addCreatorMatch.creatorName} to the active production squad.`,
      deterministicText: `Adding ${addCreatorMatch.creatorName} to your film production squad...`,
      suggestedChips: [
        "Who is still missing from my film team?",
        "Build my complete film squad.",
        "Find Cinematographers",
        "Find Video Editors",
      ],
    };
  }

  // Only reached when the message is an explicit command to perform an action.
  if (HIRE_SQUAD_EXECUTION_REGEX.test(clean)) {
    return {
      intent: "HIRE_SQUAD",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "HIRE_SQUAD",
      explanation: "Initiating squad hiring request.",
      suggestedChips: ["Confirm Squad Hire", "Explore Other Squads", "View Squad Details"],
    };
  }

  if (HIRE_CREATOR_EXECUTION_REGEX.test(clean) && !lower.includes("squad") && !isHowToQuery(clean)) {
    const targetName = extractHireTarget(clean);
    return {
      intent: "HIRE_CREATOR",
      confidence: 0.98,
      project_action: "NONE",
      matching_action: "HIRE_CREATOR",
      targetName,
      targetCreatorName: targetName,
      targetRole: targetName,
      explanation: `Hiring creator ${targetName}.`,
      suggestedChips: ["Send Offer", "Review Terms", "Browse More Creators"],
    };
  }

  if (INVITE_CREATOR_EXECUTION_REGEX.test(clean)) {
    const targetName = extractInviteTarget(clean);
    return {
      intent: "INVITE_CREATOR",
      confidence: 0.98,
      project_action: "NONE",
      matching_action: "INVITE_CREATOR",
      targetName,
      targetCreatorName: targetName,
      targetRole: targetName,
      explanation: `Inviting creator ${targetName} to collaborate.`,
      suggestedChips: ["Send Invitation", "Review Project Roles", "Browse More Creators"],
    };
  }

  // 8. PRIORITY D: USER DIRECTOR DECLARATION ("I am the director.")
  if (USER_DIRECTOR_STATEMENT_REGEX.test(clean)) {
    return {
      intent: "FILM_TEAM_PLANNING",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "User registered as Director for film project planning.",
      deterministicText: "Got it! I'll treat you as the director. Since you're directing, I won't include a director in the hiring list.\n\nWhat kind of film are you making (for example, short film, romantic musical, or feature film)? Tell me your vision, and I'll plan the production team around you as director.",
      suggestedChips: ["I need everyone required for the film", "What roles do I need for a complete film?", "I need hero, heroine, dancers and singers", "Build Complete Film Squad"],
    };
  }

  // 8.5 COMPLETE PROJECT ARCHITECTURE BUILD / REFINEMENT
  // ("Build the complete project architecture with all technical and domain roles required.")
  if (
    /\b(?:build|generate|create|refine|update|expand|give\s+me|show\s+me)\s+(?:the\s+)?(?:complete\s+|full\s+|comprehensive\s+)?(?:project\s+)?architecture\b/i.test(lower) ||
    /\b(?:all\s+technical\s+and\s+domain\s+roles|technical\s+and\s+domain\s+roles|all\s+roles\s+required|complete\s+architecture)\b/i.test(lower) ||
    /\b(?:complete\s+project\s+architecture|full\s+project\s+architecture|build\s+complete\s+architecture)\b/i.test(lower)
  ) {
    return {
      intent: "PROJECT_MODIFY",
      confidence: 0.99,
      project_action: "UPDATE_PROJECT",
      matching_action: "MATCH_ROLES",
      explanation: "Comprehensive project architecture generation and canonical blueprint update with all required technical and domain roles.",
      suggestedChips: ["Find Creators", "View Blueprint", "Who is still missing?", "Create Squad"],
    };
  }

  // 8.6 ALL MUSIC CREATORS DISCOVERY ("Find all music creators", "search all music creators", "find musicians")
  if (ALL_MUSIC_CREATORS_SEARCH_REGEX.test(clean)) {
    return {
      intent: "MULTI_ROLE_SEARCH",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "SEARCH_MULTI_ROLES",
      scope: "ALL",
      extractedRoles: [
        "Lead Singer",
        "Lead Guitarist",
        "Bass Guitarist",
        "Drummer",
        "Piano Player",
        "Music Producer",
        "Sound Engineer",
      ],
      explanation: "Searching real OmniCraft directory for all music creators and band talent.",
      suggestedChips: [
        "Who is still missing?",
        "Build my complete music band",
        "Find Lead Singer",
        "Publish Client Job",
      ],
    };
  }

  // 8.7 BUILD COMPLETE MUSIC BAND ("Build my complete music band", "build music band squad")
  if (BUILD_BAND_REGEX.test(clean)) {
    return {
      intent: "TEAM_FORMATION",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "MATCH_ROLES",
      explanation: "Accessing active music band team orchestration and squad workspace.",
      deterministicText: "Opening complete music band workspace and team orchestration.",
      suggestedChips: [
        "Find all music creators",
        "Find Lead Singer",
        "Who is still missing?",
        "Create Squad & Workspace",
      ],
    };
  }

  // 8.8 MUSIC BAND ROLE TAXONOMY & SQUAD PLANNING
  // ("I need to form a squad for music band ,so i need different type of talent musician creators related to music",
  // "not that i need only related to music creators like singer,piano player,drum master,and guitarist and many other")
  if (MUSIC_BAND_PLANNING_REGEX.test(clean)) {
    const textResp = buildMusicBandTeamArchitectureResponse(context?.activeProject, clean);
    return {
      intent: "PROJECT_ROLE_PLANNING",
      confidence: 0.99,
      project_action: "CREATE_PROJECT",
      matching_action: "NONE",
      explanation: "Structured music band team architecture and instrument talent taxonomy breakdown.",
      deterministicText: textResp,
      suggestedChips: [
        "Find all music creators",
        "Find Lead Singer",
        "Who is still missing?",
        "Build my complete music band",
      ],
      extractedRoles: [
        "Lead Singer / Vocalist",
        "Lead Guitarist",
        "Bass Guitarist",
        "Drummer / Percussionist",
        "Piano / Keyboard Player",
        "Music Producer",
        "Sound / Audio Engineer",
      ],
      projectData: {
        title: "My Music Band",
        domain: "Music",
        type: "Music Band",
        roles: [
          "Lead Singer / Vocalist",
          "Lead Guitarist",
          "Bass Guitarist",
          "Drummer / Percussionist",
          "Piano / Keyboard Player",
          "Music Producer",
          "Sound / Audio Engineer",
        ],
      },
    };
  }

  // 8.9 ALL CINEMA CREATORS DISCOVERY ("Find all cinema creators.", "find all creators related to cinematic field", "I am a director. Find all cinematic creators.")
  if (ALL_CINEMA_CREATORS_SEARCH_REGEX.test(clean)) {
    const isDirectorUser =
      isUserDirector ||
      detectUserRoleFromText(clean) === "DIRECTOR" ||
      context?.currentUserRole === "DIRECTOR" ||
      context?.activeProject?.currentUserRole === "DIRECTOR";

    return {
      intent: "MULTI_ROLE_SEARCH",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "SEARCH_MULTI_ROLES",
      scope: "ALL",
      currentUserRole: isDirectorUser ? "DIRECTOR" : context?.currentUserRole,
      currentUserType: isDirectorUser ? "CLIENT" : context?.currentUserType,
      isUserDirector: isDirectorUser,
      directorCoverage: isDirectorUser ? "COVERED_BY_USER" : undefined,
      extractedRoles: [
        "Lead Actor",
        "Lead Actress",
        "Cinematographer",
        "Dancer",
        "Choreographer",
        "Lead Singer",
        "Music Director",
        "Video Editor",
        "Sound Designer",
        ...(isDirectorUser ? [] : ["Film Director"]),
      ],
      explanation: isDirectorUser
        ? "Searching all cinema creators by production departments with user designated as Director."
        : "Searching all cinema creators and production departments in OmniCraft.",
      suggestedChips: [
        "Find all heroes",
        "Find all video editors",
        "Find all fight masters",
        "Find all choreographers",
        "Who is missing?",
        "Build my complete film squad.",
      ],
    };
  }

  // 8.10 CREATOR RECOMMENDATION ("Choose the best hero.", "Find the best actor.", "recommend the best hero")
  if (CREATOR_RECOMMEND_REGEX.test(clean)) {
    let recRole = "Lead Actor";
    if (/\b(?:video\s+editor|editor)\b/i.test(clean)) recRole = "Video Editor";
    else if (/\b(?:heroine|actress|lead\s+actress)\b/i.test(clean)) recRole = "Lead Actress";
    else if (/\b(?:hero|actor|lead\s+actor)\b/i.test(clean)) recRole = "Lead Actor";
    else if (/\b(?:cinematographer|dop)\b/i.test(clean)) recRole = "Cinematographer";
    else if (/\b(?:fight\s+master|stunt\s+coordinator)\b/i.test(clean)) recRole = "Fight Master";
    else if (/\b(?:choreographer)\b/i.test(clean)) recRole = "Choreographer";
    else if (/\b(?:dancer)\b/i.test(clean)) recRole = "Dancer";
    else if (/\b(?:singer|vocalist)\b/i.test(clean)) recRole = "Lead Singer";
    else if (/\b(?:sound\s+designer|sound\s+engineer)\b/i.test(clean)) recRole = "Sound Designer";

    return {
      intent: "CREATOR_RECOMMEND",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "RECOMMEND_CREATOR",
      targetRole: recRole,
      scope: "TOP",
      explanation: `Evaluating all candidates to recommend the best ${recRole} for the production.`,
      suggestedChips: [
        `Select ${recRole}`,
        `Find all ${recRole.toLowerCase()}s`,
        "Who is missing?",
        "Build my complete film squad.",
      ],
    };
  }

  // 8.11 PROJECT / FILM SCHEDULE PREPARATION ("Prepare the complete film schedule including songs, dance and fights.")
  if (PROJECT_SCHEDULE_REGEX.test(clean)) {
    return {
      intent: "PROJECT_SCHEDULE",
      confidence: 0.99,
      project_action: "UPDATE_PROJECT",
      matching_action: "NONE",
      explanation: "Preparing detailed dynamic production schedule tailored to project requirements.",
      suggestedChips: [
        "Who is missing?",
        "Build my complete film squad.",
        "Find Creators",
        "View Project Workspace",
      ],
    };
  }

  // 9. BUILD COMPLETE SQUAD ("Build the complete film squad.", "Build my complete film squad.")
  if (BUILD_SQUAD_REGEX.test(clean)) {
    const isMusicContext =
      context?.activeProject?.canonicalDomain === "MUSIC_BAND" ||
      context?.activeProject?.domain === "Music" ||
      context?.activeProject?.projectType === "Music Band" ||
      Boolean(context?.activeProject?.title?.toLowerCase().includes("music band"));

    if (isMusicContext) {
      return {
        intent: "TEAM_FORMATION",
        confidence: 0.98,
        project_action: "NONE",
        matching_action: "MATCH_ROLES",
        explanation: "Accessing active music band team orchestration and squad workspace.",
        deterministicText: "Opening complete music band workspace and team orchestration.",
        suggestedChips: [
          "Find all music creators",
          "Find Lead Singer",
          "Who is still missing?",
          "Create Squad & Workspace",
        ],
      };
    }

    return {
      intent: "TEAM_FORMATION",
      confidence: 0.98,
      project_action: "NONE",
      matching_action: "MATCH_ROLES",
      explanation: "Accessing active project team orchestration and squad workspace.",
      deterministicText: isUserDirector
        ? "Opening complete film squad workspace. Since you are directing, the squad is configured around you as Director (excluding another director from hiring)."
        : "Opening complete film squad workspace and team recommendations.",
      suggestedChips: ["View Team", "Start with Hero & Heroine", "Find Cinematographers", "Explore Squads"],
    };
  }

  // 9b. FIND THEM ("Find them", "search them", "find open roles")
  if (FIND_THEM_REGEX.test(clean)) {
    return {
      intent: "MULTI_ROLE_SEARCH",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "FIND_THEM",
      scope: "ALL",
      targetRole: "OPEN_ROLES",
      explanation: "Executing real creator searches across all open production roles with available candidates.",
      suggestedChips: ["Find Dancers", "Find Singers", "Find Sound Designers", "Who is still missing?", "Build Complete Film Squad"],
    };
  }

  // 9c. ALL CINEMA CREATORS SEARCH ("find all creators related to cinematic field")
  if (ALL_CINEMA_CREATORS_SEARCH_REGEX.test(clean)) {
    return {
      intent: "MULTI_ROLE_SEARCH",
      confidence: 0.99,
      project_action: "CREATE_PROJECT",
      matching_action: "SEARCH_CINEMA_CREATORS",
      scope: "ALL",
      isUserDirector,
      currentUserRole: isUserDirector ? "DIRECTOR" : undefined,
      explanation: "Role-aware search for creators across canonical cinematic production departments.",
      suggestedChips: ["Find Dancers", "Find Sound Designers", "Who is still missing?", "Build Complete Film Squad"],
    };
  }

  // 9d. EXPLICIT ROLE REQUIREMENT OVERRIDE ("I need dancers for my film", "I want a song with a lead singer", "I need a choreographer")
  const explicitReq = parseExplicitRoleRequirementRequest(clean);
  if (explicitReq) {
    return {
      intent: "PROJECT_MODIFY",
      confidence: 0.99,
      project_action: "UPDATE_PROJECT",
      matching_action: "REQUIRE_ROLE",
      targetRole: explicitReq.roleName,
      explanation: `Explicitly marking ${explicitReq.roleName} as required for the current project.`,
      suggestedChips: [
        `Find ${explicitReq.roleName}s`,
        "Who is still missing?",
        "Build my complete film squad.",
      ],
    };
  }

  // 10. FILM_TEAM_PLANNING (Complete film production role taxonomy & planning)
  // Must precede MISSING_ROLES so prompts asking for "find all creators required... each and every one and also who are missing"
  // trigger the complete role architecture matrix.
  if (
    FILM_TEAM_PLANNING_REGEX.test(clean) ||
    (isUserDirector && /\bi\s+want\s+to\s+make\s+(?:a\s+)?(?:[\w\s]{0,30}\s+)?(?:film|movie|short\s+film)\b/i.test(clean))
  ) {
    const isDirectorUser = isUserDirector || detectUserRoleFromText(clean) === "DIRECTOR";
    const matrixText = buildCompleteFilmRoleMatrixResponse(
      context?.activeProject || null,
      isDirectorUser,
      undefined,
      clean
    );
    return {
      intent: "FILM_TEAM_PLANNING",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: isDirectorUser
        ? "Structured film team role planning and complete matrix with user designated as Director."
        : "Structured film production role taxonomy breakdown.",
      deterministicText: matrixText,
      suggestedChips: ["Find them", "Find Dancers", "Find Sound Designers", "Who is still missing?", "Build my complete film squad."],
      extractedRoles: SHORT_FILM_ROLE_DEFINITIONS.map((r) => r.name),
    };
  }

  // 11. MISSING ROLES & TEAM ORCHESTRATION ANALYSIS ("Who is missing from my film team?", "TEAM ORCHESTRATION", "ROLES FILLED")
  if (MISSING_ROLES_REGEX.test(clean) || TEAM_ORCHESTRATION_REGEX.test(clean)) {
    const isMusicContext =
      context?.activeProject?.canonicalDomain === "MUSIC_BAND" ||
      context?.activeProject?.domain === "Music" ||
      context?.activeProject?.projectType === "Music Band" ||
      Boolean(context?.activeProject?.title?.toLowerCase().includes("music band")) ||
      Boolean(detectCanonicalDomain(clean, null) === "MUSIC_BAND");

    const domainHint = isMusicContext ? "MUSIC_BAND" : undefined;
    const missingText = buildDynamicMissingRolesResponse(
      context?.activeProject || null,
      isUserDirector && !isMusicContext,
      domainHint
    );
    return {
      intent: "TEAM_GAP_ANALYSIS",
      confidence: 0.98,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: isMusicContext
        ? "Team gap analysis identifying unassigned music band roles."
        : "Team gap analysis identifying unassigned core film production roles.",
      deterministicText: missingText,
      suggestedChips: isMusicContext
        ? ["Find all music creators", "Find Lead Singer", "Build my complete music band", "Create Squad"]
        : ["Find them", "Find Dancers", "Find Sound Designers", "Build my complete film squad."],
    };
  }

  // 12. HERO & HEROINE DISCOVERY ("Start with the hero and heroine. Find them.", "Start with the hero and heroine", "Find hero and heroine")
  if (HERO_HEROINE_SEARCH_REGEX.test(clean)) {
    return {
      intent: "MULTI_ROLE_SEARCH",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "SEARCH_MULTI_ROLES",
      scope: "BATCH",
      extractedRoles: ["Lead Actor", "Lead Actress"],
      explanation: "Searching verified Lead Actor (Hero) and Lead Actress (Heroine) profiles.",
      suggestedChips: ["Find Cinematographers", "Find Video Editors", "Find Dancers", "Find Singers", "Build Complete Film Squad"],
    };
  }

  // 13. MULTI_ROLE_SEARCH ("Find all the people I need", "Find everyone", "Find all roles", "I need everyone required for the film", "find all required creators for a short film")
  if (MULTI_ROLE_SEARCH_REGEX.test(clean)) {
    const isDirectorUser = isUserDirector || detectUserRoleFromText(clean) === "DIRECTOR" || context?.currentUserRole === "DIRECTOR";
    const isAction = lower.includes("action") || ((context?.activeProject as any)?.genre || "").toLowerCase().includes("action");
    const activeRoles = context?.activeProject?.roles?.map((r) => r.roleName);
    let rolesToSearch =
      activeRoles && activeRoles.length > 0
        ? activeRoles
        : [
            "Lead Actor",
            "Lead Actress",
            "Cinematographer",
            "Video Editor",
            "Sound Designer",
            "Music Director",
            ...(isAction ? ["Fight Master", "Stunt Coordinator"] : []),
          ];

    if (isDirectorUser) {
      rolesToSearch = rolesToSearch.filter((r) => !r.toLowerCase().includes("director") || r.toLowerCase().includes("music"));
    }

    return {
      intent: "MULTI_ROLE_SEARCH",
      confidence: 0.99,
      project_action: "CREATE_PROJECT",
      matching_action: "SEARCH_MULTI_ROLES",
      scope: "ALL",
      currentUserRole: isDirectorUser ? "DIRECTOR" : (context?.currentUserRole !== "DIRECTOR" ? context?.currentUserRole : undefined),
      currentUserType: isDirectorUser ? "CLIENT" : context?.currentUserType,
      isUserDirector: isDirectorUser,
      directorCoverage: isDirectorUser ? "COVERED_BY_USER" : undefined,
      extractedRoles: rolesToSearch,
      explanation: isDirectorUser
        ? "Multi-role talent discovery for film with Director role covered by user."
        : "Multi-role talent discovery across core production roles.",
      suggestedChips: ["Find Creators", "View Missing Roles", "Build Complete Squad"],
    };
  }

  // 12. SKILL SWAP ("skill swap", "propose skill swap")
  if (/\b(?:skill\s*swap|trade\s*skills|propose\s*skill\s*swap|find\s*skill\s*swap)\b/i.test(lower)) {
    return {
      intent: "SKILL_SWAP",
      confidence: 0.98,
      project_action: "NONE",
      matching_action: "SKILL_SWAP",
      explanation: "Searching skill swap directory.",
      suggestedChips: ["Explore Skill Swap", "Post Skill Swap Offer", "Find Creators"],
    };
  }

  // 13. TEAM FORMATION ("form a team", "build a team")
  if (/\b(?:form\s+(?:a\s+)?(?:team|squad)|build\s+(?:a\s+)?(?:team|squad)|team\s+recommendations?|who\s+do\s+i\s+need\s+for\s+my\s+team)\b/i.test(lower)) {
    return {
      intent: "TEAM_FORMATION",
      confidence: 0.96,
      project_action: "NONE",
      matching_action: "MATCH_ROLES",
      explanation: "Team formation and squad setup request.",
      suggestedChips: ["View Team", "Find Performers", "Find Sound Engineer", "Create Squad"],
    };
  }

  // 14. PAGINATION ("show more", "show more creators", "next page")
  if (/^(?:show\s+(?:me\s+)?more|show\s+more\s+creators|more|next\s+batch|next\s+page|next\s+\d+|load\s+more)[\s.?!]*$/i.test(lower)) {
    return {
      intent: "FOLLOW_UP_PAGINATION",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "PAGINATE_SEARCH",
      explanation: "Requesting next page of previous search results.",
      suggestedChips: ["Next Batch", "Refine Search", "Start Over"],
    };
  }

  // 15. REFINE SEARCH ("only experienced", "only female")
  if (/^(?:only\s+(?:experienced|senior|women|female|male|hyderabad|under\s+[\d,₹$]+))\b/i.test(lower)) {
    return {
      intent: "REFINE_SEARCH",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "REFINE_SEARCH",
      explanation: "Filtering and refining previous search results.",
      suggestedChips: ["Show More", "Invite Creator", "Reset Filters"],
    };
  }

  // 16. EXPLICIT CREATOR SEARCH ("find video editors", "find actors", "find performers")
  if (isCreatorSearchQuery(clean, context)) {
    let targetRole: string | undefined;

    // First check if user mentioned a role matching the active project (only in client/project mode)
    if (
      context?.currentUserType !== "CREATOR" &&
      context?.activeGoal !== "FIND_JOB" &&
      context?.activeProject?.roles &&
      context.activeProject.roles.length > 0
    ) {
      const matchedProjectRole = (context.activeProject.roles as any[]).find((r) => {
        const name = r?.roleName || r?.role || r?.name || (typeof r === "string" ? r : "");
        return name && (lower.includes(name.toLowerCase()) || isRoleMatch(name, clean));
      });
      if (matchedProjectRole) {
        targetRole = matchedProjectRole.roleName || matchedProjectRole.role || matchedProjectRole.name;
      }
    }

    // Extract user's self-declaration if present ("iam a video editor so find the creators")
    const selfRoleInfo = extractCreatorSelfRole(clean);
    const detectedDirector = detectUserRoleFromText(clean);
    const isUserDirector = detectedDirector === "DIRECTOR" || selfRoleInfo?.canonicalRole === "DIRECTOR" || context?.currentUserRole === "DIRECTOR";
    const isUserClient = /\b(?:(?:i\s*am|iam|i['’]?m|im|as)\s+(?:a\s+|an\s+|the\s+)?client|client\s*[,&]\s*(?:a\s+)?director)\b/i.test(clean) || (isUserDirector && !selfRoleInfo);

    const currentUserRole = isUserDirector ? "DIRECTOR" : (selfRoleInfo?.canonicalRole || context?.currentUserRole);
    const currentUserType = isUserClient ? "CLIENT" : (selfRoleInfo ? "CREATOR" : (context?.currentUserType || (isUserDirector ? "CLIENT" : undefined)));

    // Isolate search target text by stripping self-declaration prefix so self-role doesn't contaminate targetRole
    let searchTargetText = clean;
    searchTargetText = searchTargetText.replace(
      /\b(?:(?:i\s*am|iam|i['’]?m|im|as)\s+(?:a\s+|an\s+|the\s+)?(?:client\s*[,&]\s*(?:a\s+)?)?(?:director|creator|video\s+editor|editor|producer|actor|developer|designer|musician|singer)[^,.;!?]*?(?:[.,!?;:]|\s+(?:and|butt?|so|find|search|show|get|list|look|,|\.|$)))\s*/gi,
      ""
    ).trim();
    searchTargetText = searchTargetText.replace(
      /\bi\s+don'?t\s+need\s+directors?\s+because\s+i\s+am\s+(?:the\s+|a\s+)?director\b/gi,
      ""
    ).trim();

    if (!targetRole) {
      if (/\b(?:female\s+lead(?:\s+actor)?|lead\s+actress|actress|actresses|heroine|heroines)\b/i.test(searchTargetText)) targetRole = "Lead Actress";
      else if (/\b(?:lead\s+actor|male\s+lead|hero|heroes)\b/i.test(searchTargetText)) targetRole = "Lead Actor";
      else if (/\b(?:fight\s+masters?|stunt\s+coordinators?|action\s+choreographers?|action\s+directors?|stunt\s+performers?)\b/i.test(searchTargetText)) targetRole = "Fight Master";
      else if (/\b(?:comic\s+actors?|comedy\s+actors?)\b/i.test(searchTargetText)) targetRole = "Comic Actor";
      else if (/\b(?:dialogue\s+writers?)\b/i.test(searchTargetText)) targetRole = "Dialogue Writer";
      else if (/\b(?:performer|performers|performance|performing\s+artists?|live\s+performers?)\b/i.test(searchTargetText)) targetRole = "Performers";
      else if (/\b(?:actor|actors|acting)\b/i.test(searchTargetText)) targetRole = "Actor";
      else if (/\b(?:choreographer|choreographers)\b/i.test(searchTargetText)) targetRole = "Choreographer";
      else if (/\b(?:dancer|dancers|dancing)\b/i.test(searchTargetText)) targetRole = "Dancer";
      else if (/\b(?:video\s+editor|editor|editors|edit(?:ing)?\s+(?:[\w\s]{0,20})?(?:videos?|footage|content|film|reels?|shorts?)|cut(?:ting)?\s+(?:videos?|footage))\b/i.test(searchTargetText) || /\b(?:who\s+can\s+edit|edit\s+(?:my|our|the)\s+videos?)\b/i.test(searchTargetText)) targetRole = "Video Editor";
      else if (/\b(?:colorist|colorists|colourist|colourists)\b/i.test(searchTargetText)) targetRole = "Colorist";
      else if (/\b(?:singer|vocalist|lead\s+singer|singers)\b/i.test(searchTargetText)) targetRole = "Lead Singer";
      else if (/\b(?:musician|musicians|guitarist|drummer|pianist|keyboard\s+player)\b/i.test(searchTargetText)) targetRole = "Musician";
      else if (/\b(?:director|film\s+director|directors)\b/i.test(searchTargetText)) targetRole = "Film Director";
      else if (/\b(?:cinematographer|cinematographers|dop|camera\s+operator|dp|director\s+of\s+photography|shoot(?:ing)?\s+(?:my\s+)?(?:short\s+)?(?:film|movie|videos?))\b/i.test(searchTargetText)) targetRole = "Cinematographer";
      else if (/\b(?:photographer|photographers|photography)\b/i.test(searchTargetText)) targetRole = "Photographer";
      else if (/\b(?:animator|animators|animation|3d\s+artist|3d\s+artists|motion\s+designer)\b/i.test(searchTargetText)) targetRole = "Animator";
      else if (/\b(?:writer|writers|copywriter|content\s+writer|scriptwriter)\b/i.test(searchTargetText)) targetRole = "Content Writer";
      else if (/\b(?:stage(?:\/|\s+)lighting\s+technician|lighting\s+technician|stage\s+technician|gaffer)\b/i.test(searchTargetText)) targetRole = "Stage/Lighting Technician";
      else if (/\b(?:sound\s+engineer|audio\s+engineer|sound\s+recordist|audio\s+recordist|sound\s+tech(?:nician)?|mix(?:ing)?\s+(?:my\s+)?(?:sound|audio|track)|live\s+sound)\b/i.test(searchTargetText)) targetRole = "Sound Engineer";
      else if (/\b(?:sound\s+designer|boom\s+operator)\b/i.test(searchTargetText)) targetRole = "Sound Designer";
      else if (/\b(?:event\s+coordinator|event\s+planner|event\s+organizer)\b/i.test(searchTargetText)) targetRole = "Event Coordinator";
      else if (/\b(?:event\s+manager|event\s+director|event\s+operations)\b/i.test(searchTargetText)) targetRole = "Event Manager";
      else if (/\b(?:sponsorship(?:\/business\s+development)?|business\s+development|sponsors?|partnerships?)\b/i.test(searchTargetText)) targetRole = "Sponsorship/Business Development";
      else if (/\b(?:developer|frontend|web\s+developer|software\s+developer|coder)\b/i.test(searchTargetText)) targetRole = "Frontend Web Developer";
      else if (/\b(?:designer|ui\/ux\s+designer|product\s+designer)\b/i.test(searchTargetText)) targetRole = "UI/UX Designer";
      else if (/\b(?:content\s+creator|content\s+creators)\b/i.test(searchTargetText)) targetRole = "Content Creator";
      else if (/\b(?:creator|creators|collaborator|collaborators)\b/i.test(searchTargetText)) targetRole = "Creator";
      else if (
        context?.currentUserType !== "CREATOR" &&
        context?.activeGoal !== "FIND_JOB" &&
        context?.activeProject?.roles &&
        context.activeProject.roles.length > 0
      ) {
        targetRole = context.activeProject.roles[0].roleName;
      }
    }

    // HARD INVARIANT (Section 4): Never let currentUserRole become targetRole unless user explicitly asked to find an external creator for that role
    if (isUserDirector) {
      const isExplicitExternalDirectorRequest =
        /\b(?:find|search(?:\s+for)?|hire|get|need|looking\s+for|want|require)\s+(?:a\s+|an\s+|another\s+|external\s+|the\s+)?(?:directors?|film\s+directors?)\b/i.test(clean) &&
        !/\b(?:i\s*am|iam|i['’]?m|im|as|because\s+i\s+am)\s+(?:a\s+|an\s+|the\s+)?director\b/i.test(clean);

      if (!isExplicitExternalDirectorRequest) {
        if (targetRole === "Film Director" || targetRole === "Director") {
          targetRole = "Creator";
        }
      }
    }

    const isGenericCreatorSearch = !targetRole || targetRole === "Creator";
    targetRole = targetRole || "Creator";

    const scope = /\b(?:all|everyone|every|list\s+all|show\s+me\s+all|all\s+the|complete\s+list)\b/i.test(searchTargetText) ? "ALL" : "BATCH";
    const countMatch = searchTargetText.match(/\b(?:show\s+me|find|get)\s+(\d+)\s+/i);
    const limit = countMatch ? parseInt(countMatch[1], 10) : (scope === "ALL" ? 50 : 10);

    const extractedSkills: string[] = [];
    if (/\b(?:sing|singing|singer|vocal|vocals)\b/i.test(searchTargetText)) extractedSkills.push("Singing");
    if (/\b(?:dance|dancing|dancer)\b/i.test(searchTargetText)) extractedSkills.push("Dancing");
    if (/\b(?:acting|dramatic|theatre|theater)\b/i.test(searchTargetText)) extractedSkills.push("Acting");
    if (/\b(?:youtube|youtube\s+videos?|vlog|vlogging)\b/i.test(searchTargetText)) extractedSkills.push("YouTube Video Editing", "Video Editing");

    return {
      intent: "CREATOR_SEARCH",
      confidence: 0.98,
      project_action: "NONE",
      matching_action: "SEARCH_CREATORS",
      searchEntity: "CREATORS",
      targetRole,
      currentUserRole,
      currentUserType: currentUserType || "CREATOR",
      activeGoal: undefined,
      scope,
      limit,
      skills: extractedSkills,
      suggestedChips: isGenericCreatorSearch
        ? [
            "Video Editors",
            "Designers",
            "Developers",
            "Musicians",
            "Actors",
            "Photographers",
            "All Creators",
          ]
        : [
            "Show More Creators",
            "Refine Search",
            "Search Another Role",
            "Select Creator",
            "View Profile",
          ],
      explanation: isGenericCreatorSearch
        ? "Explicit request to search verified creators across the OmniCraft directory."
        : `Explicit search request for verified ${targetRole} creators.`,
    };
  }

  // 17. STORY ANALYSIS & PLOT HOLES (Requires LLM reasoning)
  if (STORY_ANALYSIS_REGEX.test(lower)) {
    return {
      intent: "STORY_ANALYSIS",
      confidence: 0.97,
      project_action: "NONE",
      matching_action: "NONE",
      suggestedChips: ["Make More Emotional", "Add a Villain", "Convert to Screenplay"],
      explanation: "Constructive feedback and loophole analysis on narrative.",
    };
  }

  // 18. STORY MODIFICATION (Requires LLM generation)
  if (STORY_MOD_REGEX.test(lower)) {
    const isScreenplay = /screenplay|script/i.test(lower);
    return {
      intent: "STORY_MODIFICATION",
      confidence: 0.96,
      project_action: "NONE",
      matching_action: "NONE",
      suggestedChips: isScreenplay
        ? ["Add Dialogue", "Extend Scene", "Make More Emotional", "Find Plot Holes"]
        : ["Make More Emotional", "Add a Villain", "Convert to Screenplay", "Find Plot Holes"],
      explanation: "Creative story revision and adaptation.",
    };
  }

  // 19. CREATIVE STORY GENERATION (Requires LLM generation)
  if (STORY_GEN_REGEX.test(lower)) {
    const isDirector = Boolean(detectUserRoleFromText(clean));
    return {
      intent: "STORY_GENERATION",
      confidence: 0.97,
      project_action: "NONE",
      matching_action: "NONE",
      suggestedChips: ["Make More Emotional", "Add a Villain", "Convert to Screenplay", "Find Plot Holes"],
      explanation: isDirector
        ? "Original creative storytelling request for film director."
        : "Original creative storytelling request.",
    };
  }

  // 20. PROJECT_MODIFICATION
  if (context?.hasActiveProject && PROJECT_MODIFICATION_REGEX.test(clean)) {
    return {
      intent: "PROJECT_MODIFICATION",
      confidence: 0.90,
      project_action: "UPDATE_PROJECT",
      matching_action: "NONE",
      explanation: "Instruction to modify an existing established project.",
    };
  }

  // 21. PROJECT_CREATION / PROJECT_CREATE (Instant deterministic blueprint & creator matching)
  if (PROJECT_CREATION_REGEX.test(clean)) {
    let domain = "Film & Video";
    let type = "Short Film";
    let title = "Custom Project";
    let extractedRoles = ["Director", "Cinematographer", "Video Editor", "Sound Designer", "Lead Actor"];
    const requirements: string[] = [];

    // College Cultural Festival / Event detection
    if (
      lower.includes("festival") ||
      lower.includes("fest") ||
      lower.includes("cultural") ||
      lower.includes("college cultural festival") ||
      lower.includes("live performances") ||
      lower.includes("stage lighting")
    ) {
      domain = "Events";
      type = "College Cultural Festival";
      title = "College Cultural Festival";
      extractedRoles = [
        "Performers",
        "Event Coordinator",
        "Stage/Lighting Technician",
        "Sound Engineer",
        "Sponsorship/Business Development",
        "Event Manager",
      ];
      if (lower.includes("live performances") || lower.includes("performance") || lower.includes("performances")) {
        requirements.push("live performances");
      }
      if (lower.includes("stage lighting") || lower.includes("lighting")) {
        requirements.push("stage lighting");
      }
      if (lower.includes("sound") || lower.includes("audio")) {
        requirements.push("sound");
      }
      if (lower.includes("sponsorships") || lower.includes("sponsorship")) {
        requirements.push("sponsorships");
      }
    } else if (/\b(?:web\s*app|website|web\s*site|web\s*portal)\b/i.test(clean)) {
      domain = "Software & Tech";
      type = "Web Application";
      title = "Web Application Project";
      extractedRoles = ["Frontend Developer", "Backend Developer", "UI/UX Designer", "Product Manager"];
    } else if (/\b(?:mobile\s*app|ios\s*app|android\s*app)\b/i.test(clean)) {
      domain = "Software & Tech";
      type = "Mobile Application";
      title = "Mobile Application Project";
      extractedRoles = ["Mobile Developer", "UI/UX Designer", "Backend Developer", "QA Engineer"];
    } else if (/\b(?:music\s*video|album|song|music\s*production)\b/i.test(clean)) {
      domain = "Music & Audio";
      type = "Music Production";
      title = "Music Production Project";
      extractedRoles = ["Music Producer", "Sound Engineer", "Lead Singer", "Mixing / Mastering Engineer"];
    } else if (lower.includes("village girl") && lower.includes("singer")) {
      title = "Short Film: A Village Singer's Dream";
      extractedRoles = ["Lead Singer", "Film Director", "Cinematographer", "Sound Recordist", "Video Editor"];
    }

    let genre: string | undefined;
    const genreMatch = clean.match(/\b(action\s+comedy\s+thriller|action\s+comedy|action\s+thriller|romantic\s+comedy|romantic\s+musical|musical\s+drama|horror\s+thriller|sci-fi|science\s+fiction)\b/i);
    if (genreMatch) {
      genre = genreMatch[1].split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
      title = `${genre} Film`;
      domain = "Film & Video";
      type = "Feature Film";
      extractedRoles = [
        "Director",
        "Producer",
        "Lead Actor",
        "Lead Actress",
        "Cinematographer",
        "Fight Master",
        "Comic Actor",
        "Dialogue Writer",
        "Music Director",
        "Video Editor",
        "Sound Designer",
      ];
      requirements.push("Fight choreographies and stunt coordination");
      requirements.push("Comedic dialogue and performance timing");
      requirements.push("Suspenseful cinematography and atmospheric pacing");
    }

    // Extract budget if mentioned
    let budget: string | undefined;
    const budgetMatch = clean.match(/(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\s*(?:k|lakh|lakhs|thousand))?)/i) ||
                        clean.match(/\b(\d{1,2}(?:,\d{3})+|\d+k|\d+\s*lakh)\s*(?:budget|inr|rupees)?\b/i);
    if (budgetMatch) {
      budget = budgetMatch[0].includes("₹") ? budgetMatch[0] : `₹${budgetMatch[1] || budgetMatch[0]}`;
    }

    return {
      intent: "PROJECT_CREATE",
      confidence: 0.98,
      project_action: "CREATE_PROJECT",
      matching_action: "MATCH_ROLES",
      targetRole: extractedRoles[0],
      extractedRoles,
      projectData: {
        title,
        domain,
        genre,
        type,
        story_premise: clean,
        budget,
        roles: extractedRoles,
        requirements: requirements.length > 0 ? requirements : undefined,
      },
      explanation: "Project creation proposal detected with structured brief.",
      suggestedChips: domain === "Events"
        ? [
            "Find Performers",
            "Find Event Coordinator",
            "Find Sound Engineer",
            "Find Lighting Technician",
            "Find Sponsors",
            "View Missing Roles",
          ]
        : [
            "Find Creators",
            "Find Clients",
            "Review Project Plan",
            "View Missing Roles",
            "Build Team",
          ],
    };
  }

  // 22. CREATIVE ADVICE (Role skills & evaluation advice)
  if (lower.includes("video editor") && lower.includes("skill")) {
    return {
      intent: "CREATIVE_ADVICE",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Creative advice on skills, roles, and project execution guidance.",
      deterministicText: "### Key Skills to Look for in a Video Editor\n\n* **NLE Proficiency:** Premiere Pro, DaVinci Resolve, or Final Cut Pro.\n* **Color Grading:** Understanding of color spaces, LUTs, and skin-tone correction.\n* **Audio Polish:** Dialogue denoising, EQ, compression, and sound effects layering.\n* **Story Pacing:** Rhythmic cutting that matches the narrative emotional arc.",
      suggestedChips: ["Find Video Editors", "Find Colorists", "Create Project"],
    };
  }

  // 23. EDUCATIONAL FOLLOW-UP
  if (EDUCATIONAL_FOLLOWUP_REGEX.test(clean)) {
    const isExplicitProject = Boolean(
      context?.activeProject &&
      /\b(?:project|film|event|festival|hiring|creator|squad|requirements|roles|budget|timeline)\b/i.test(clean)
    );
    if (isExplicitProject) {
      const isEvents = context?.activeProject?.domain === "Events";
      return {
        intent: "PROJECT_ANALYSIS",
        confidence: 0.90,
        project_action: "NONE",
        matching_action: "NONE",
        explanation: "Project detail explanation requested.",
        suggestedChips: isEvents
          ? ["Find Performers", "Find Event Coordinator", "Find Sound Engineer", "View Missing Roles"]
          : ["Find Creators", "Review Project Plan", "View Missing Roles", "Build Team"],
      };
    }
    return {
      intent: "EDUCATIONAL_QUESTION",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Contextual educational follow-up question.",
      suggestedChips: ["Give Viva Questions", "Give 5-Mark Answers", "Explain in Detail", "Give Programs", "Give Important Questions"],
    };
  }

  // 24. VIVA_QUESTION
  if (VIVA_REGEX.test(clean)) {
    return {
      intent: "VIVA_QUESTION",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Academic viva questions request.",
      suggestedChips: ["Give Detailed Answers", "Give 5-Mark Answers", "Give Important Questions", "Give Programs"],
    };
  }

  // 25. LAB_QUESTION
  if (LAB_REGEX.test(clean)) {
    return {
      intent: "LAB_QUESTION",
      confidence: 0.96,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Laboratory viva and experiments question.",
      suggestedChips: ["Give Viva Questions", "Give 5-Mark Answers", "Explain in Detail", "Give Programs", "Give Important Questions"],
    };
  }

  // 26. EXAM_PREPARATION
  if (EXAM_PREP_REGEX.test(clean)) {
    return {
      intent: "EXAM_PREPARATION",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Academic exam preparation question.",
      suggestedChips: ["Give 10-Mark Answers", "Give Viva Questions", "Explain in Detail", "Give Programs"],
    };
  }

  // 27. PROGRAMMING_QUESTION
  if (PROGRAMMING_REGEX.test(clean)) {
    return {
      intent: "PROGRAMMING_QUESTION",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Programming and coding implementation question.",
      suggestedChips: ["Explain Code Step by Step", "Optimize Code", "Give Test Cases", "Convert to Another Language"],
    };
  }

  // 28. MATH_QUESTION
  if (MATH_REGEX.test(clean)) {
    return {
      intent: "MATH_QUESTION",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Mathematical or numerical problem solving question.",
      suggestedChips: ["Show Step by Step Solution", "Explain Formula", "Give Another Example"],
    };
  }

  const isAcademic = /\b(?:viva|exam|semester|lab|experiments?|program|code|algorithm|math|physics|chemistry|biology|tcp|udp|osi|paging|avl\s*tree|dbms|dns|subnetting|derivative|integral|eigenvalue)\b/i.test(clean);

  // 29. EXPLANATION
  if (EXPLANATION_REGEX.test(clean)) {
    const isExplicitProject = Boolean(
      context?.activeProject &&
      /\b(?:my\s+project|this\s+project|the\s+project|project\s+plan|project\s+requirements|project\s+budget|project\s+timeline|our\s+project|film\s+plan|festival\s+plan|production\s+plan)\b/i.test(clean)
    );
    return {
      intent: isExplicitProject ? "PROJECT_ANALYSIS" : isAcademic ? "EXPLANATION" : "GENERAL_QUESTION",
      confidence: 0.92,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: isExplicitProject
        ? "Explanation of project architecture, requirements, or workflow."
        : "Explanation of concept.",
      suggestedChips: isExplicitProject
        ? (context?.activeProject?.domain === "Events"
            ? ["Find Performers", "Find Event Coordinator", "Find Sound Engineer", "View Missing Roles"]
            : ["Find Creators", "Review Project Plan", "View Missing Roles", "Build Team"])
        : isAcademic
        ? ["Explain in Detail", "Give Examples", "Give 5-Mark Answer", "Give Viva Questions", "Give Programs"]
        : ["Create a Project", "Find Creators", "Explore Squads", "How to Hire a Creator"],
    };
  }

  // 30. DEFINITION
  if (DEFINITION_REGEX.test(clean)) {
    const isExplicitProject = Boolean(
      context?.activeProject &&
      /\b(?:my\s+project|this\s+project|the\s+project|project\s+plan|project\s+requirements|project\s+budget|project\s+timeline|our\s+project|film\s+plan|festival\s+plan|production\s+plan)\b/i.test(clean)
    );
    const defTerm = clean.replace(/^(?:what\s+is|what\s+are|define|definition\s+of)\s+(?:an?\s+|the\s+)?/i, "").replace(/[\?\.\s]*$/, "").trim();
    const normTerm = defTerm.toLowerCase();
    const deterministicAns = DETERMINISTIC_DEFINITIONS[normTerm];

    return {
      intent: isExplicitProject ? "PROJECT_ANALYSIS" : "DEFINITION",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: isExplicitProject ? "Project architecture definition inquiry." : "Concept definition.",
      deterministicText: isExplicitProject ? undefined : deterministicAns,
      suggestedChips: isExplicitProject
        ? (context?.activeProject?.domain === "Events"
            ? ["Find Performers", "Find Event Coordinator", "Find Sound Engineer", "View Missing Roles"]
            : ["Find Creators", "Review Project Plan", "View Missing Roles", "Build Team"])
        : isAcademic
        ? ["Explain in Detail", "Give Examples", "Give 5-Mark Answer", "Give Viva Questions", "Give Programs"]
        : [],
    };
  }

  // 31. GENERAL_QUESTION
  const defaultEventChips = [
    "Find Performers",
    "Find Event Coordinator",
    "Find Sound Engineer",
    "Find Lighting Technician",
    "Find Sponsors",
    "View Missing Roles",
  ];
  const defaultProjectChips = [
    "Find Creators",
    "Find Clients",
    "Review Project Plan",
    "View Missing Roles",
    "Build Team",
  ];
  const defaultGeneralChips = [
    "Create a Project",
    "Find Creators",
    "Explore Squads",
    "How to Hire a Creator",
  ];
  const isExplicitProject = Boolean(
    context?.activeProject &&
    /\b(?:my\s+project|this\s+project|the\s+project|project\s+plan|project\s+requirements|project\s+budget|project\s+timeline|our\s+project|film\s+plan|festival\s+plan|production\s+plan)\b/i.test(clean)
  );
  const generalChips = isExplicitProject
    ? (context?.activeProject?.domain === "Events" ? defaultEventChips : defaultProjectChips)
    : isAcademic
    ? ["Explain in Detail", "Give Examples", "Give 5-Mark Answer", "Give Viva Questions", "Give Programs"]
    : defaultGeneralChips;

  return {
    intent: "GENERAL_QUESTION",
    confidence: 0.70,
    project_action: "NONE",
    matching_action: "NONE",
    explanation: "General conversational question without project initiation or creator search.",
    suggestedChips: generalChips,
  };
}

/**
 * Classifies the user's intent and attaches architectural hybrid routing flags:
 * - requiresDatabase: whether live Supabase entity queries are needed
 * - requiresKnowledge: whether authoritative RAG knowledge chunks should be retrieved
 * - requiresLLM: whether generative Qwen3:4B reasoning is needed
 * - requiresAction: whether a state-mutating action is performed
 */
export function classifyUserIntent(
  userText: string,
  context?: {
    hasActiveProject?: boolean;
    activeProject?: OmniForgeProject | null;
    conversationHistory?: ChatMessage[];
    currentUserRole?: string;
    currentUserType?: "CREATOR" | "CLIENT";
    activeGoal?: "FIND_JOB" | "HIRE_TALENT" | "BUILD_PROJECT";
  }
): IntentActionResult {
  const result = classifyUserIntentCore(userText, context);
  const hybridFlags = deriveHybridFlags(result.intent, userText, {
    matching_action: result.matching_action,
    project_action: result.project_action,
    hasDeterministicText: Boolean(result.deterministicText),
  });

  return {
    ...result,
    ...hybridFlags,
    currentUserType: result.currentUserType || (context?.currentUserType as any),
    currentUserRole: result.currentUserRole || context?.currentUserRole,
  };
}
export const classifyIntent = classifyUserIntent;
