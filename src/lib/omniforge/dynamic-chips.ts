/**
 * Dynamic Follow-Up Chips Generator
 *
 * Replaces static/global chips with context-aware dynamic suggestions.
 * Strictly prevents educational/academic chips from leaking into general questions or project conversations.
 */

import { OmniForgeProject } from "./types";

export interface ChipGenerationParams {
  intent: string;
  userQuery: string;
  activeProject?: OmniForgeProject | null;
  resultCount?: number;
  initialChips?: string[];
  isStoryTurn?: boolean;
  isProjectTurn?: boolean;
}

export function generateDynamicFollowUpChips(params: ChipGenerationParams): string[] {
  const { intent, userQuery, activeProject, resultCount, initialChips, isStoryTurn, isProjectTurn } = params;
  const lower = userQuery.toLowerCase().trim();

  // 1. CREATOR SEARCH & TALENT MATCHING
  if (intent === "CREATOR_SEARCH" || intent === "MULTI_ROLE_SEARCH" || lower.startsWith("find ")) {
    if (resultCount !== undefined && resultCount === 0) {
      return [
        "Publish Client Job",
        "Open Collaboration Call",
        "Skill-for-Service Swap",
        "Add Manually by Username",
      ];
    }
    return [
      "Show More Creators",
      "Refine Search",
      "Search Another Role",
      "Select Creator",
      "View Profile",
    ];
  }

  // 2. STORY DEVELOPMENT & SCREENPLAY
  if (
    isStoryTurn ||
    intent === "STORY_GENERATION" ||
    intent === "STORY_MODIFICATION" ||
    intent === "STORY_ANALYSIS" ||
    /\b(?:story|screenplay|script|villain|shot\s*list|scene|logline|synopsis)\b/i.test(lower)
  ) {
    if (lower.includes("screenplay") || lower.includes("script")) {
      return [
        "Create Shot List",
        "Plan Production Schedule",
        "Find Cast & Crew",
        "Make It More Emotional",
      ];
    }
    if (lower.includes("shot list") || lower.includes("shotlist")) {
      return [
        "Plan Shooting Schedule",
        "Essential Equipment",
        "Find Cinematographers",
        "Convert to Screenplay",
      ];
    }
    return [
      "Make It More Emotional",
      "Find Plot Holes",
      "Convert to Screenplay",
      "Create Shot List",
    ];
  }

  // 3. PROJECT PLANNING & EXECUTION
  if (
    isProjectTurn ||
    intent === "PROJECT_CREATE" ||
    intent === "PROJECT_CREATION" ||
    intent === "PROJECT_PLANNING" ||
    intent === "PROJECT_ANALYSIS" ||
    intent === "PROJECT_MODIFICATION" ||
    intent === "PROJECT_STATUS" ||
    intent === "MISSING_ROLES" ||
    intent === "TEAM_FORMATION"
  ) {
    const isEvent = Boolean(
      activeProject?.domain === "Events" ||
      lower.includes("festival") ||
      lower.includes("cultural")
    );

    if (isEvent) {
      return [
        "Find Performers",
        "Analyze Missing Roles",
        "Create Tasks",
        "Find Sponsors",
      ];
    }

    return [
      "Analyze Missing Roles",
      "Create Tasks",
      "Find Creators",
      "Review Project Plan",
    ];
  }

  // 4. GENUINE ACADEMIC / EXAM PREPARATION
  // ONLY triggered when the user explicitly mentions viva, exam, semester, or marks
  const isGenuineExamQuery = /\b(?:viva|exam|semester|5-mark|10-mark|important\s+questions)\b/i.test(lower);
  if (isGenuineExamQuery) {
    return [
      "Explain in Detail",
      "Give Examples",
      "Give 5-Mark Answer",
    ];
  }

  // 5. PROGRAMMING & TECHNICAL CODE QUERIES
  const isCodingQuery =
    /\b(?:code|program|python|javascript|typescript|c\+\+|java|binary\s*search|algorithm|sql|nosql|api|docker|git|react)\b/i.test(lower);
  if (isCodingQuery) {
    return [
      "Give Code Example",
      "Explain Step by Step",
      "Alternative Approaches",
    ];
  }

  // 6. HOW-TO WORKFLOW QUESTIONS
  if (intent === "HOW_TO" || lower.startsWith("how to") || lower.startsWith("how can i")) {
    if (lower.includes("python") || lower.includes("learn") || lower.includes("study")) {
      return [
        "Give Code Example",
        "Explain Further",
        "Recommend Projects",
      ];
    }
    if (lower.includes("performer") || lower.includes("creator") || lower.includes("hire")) {
      return [
        "Find Creators",
        "Show Hiring Steps",
        "Explain Creator Matching",
      ];
    }
    return [
      "Explain Further",
      "Give Examples",
      "Simplify This",
    ];
  }

  // 7. GENERAL KNOWLEDGE, DEFINITION & NORMAL CONVERSATION (Default)
  // Clean dynamic suggestions matching Requirement 9:
  return [
    "Explain Further",
    "Give Examples",
    "Simplify This",
  ];
}
