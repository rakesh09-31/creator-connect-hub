/**
 * OmniForge Context Management System
 *
 * Implements 5 isolated context layers:
 * Layer A: Conversation context (recent messages)
 * Layer B: Current project context (strictly isolated; never hijacks unrelated queries)
 * Layer C: Current story context (persists narrative continuity across multi-turn story development)
 * Layer D: User context (user role, account type)
 * Layer E: Tool/Database context (candidate records, search results)
 */

import { OmniForgeProject, ChatMessage, ConversationState } from "./types";

export interface ContextLayers {
  conversation: Array<{ role: "user" | "assistant"; content: string }>;
  project: {
    id: string;
    title: string;
    domain: string;
    type?: string;
    storyPremise?: string;
    roles: Array<{ name: string; isFilled: boolean }>;
    missingRoles: string[];
    coveredRoles: string[];
    currentUserRole?: string;
    activePhase?: string;
  } | null;
  story: {
    activeStory?: string;
    genre?: string;
    premise?: string;
    isDirectorPerspective: boolean;
  } | null;
  user: {
    userId: string;
    userType: "creator" | "client";
    role?: string;
  };
  tool: {
    lastSearchRole?: string;
    lastResultCount?: number;
  } | null;
}

/**
 * Checks whether the user's message is specifically asking about or referencing the project.
 * If the user asks a general knowledge/definition/programming question, this returns FALSE,
 * preventing the active project from hijacking the AI prompt.
 */
export function isQueryProjectRelated(query: string, activeProject: OmniForgeProject | null): boolean {
  if (!activeProject) return false;
  const clean = query.toLowerCase().trim();

  // If the query is an obvious general definition or explanation, NEVER treat as project context
  if (
    /^(?:what\s+is\s+(?:the\s+meaning\s+of\s+)?|what\s+does\s+|define\s+|meaning\s+of\s+|explain\s+(?!this\s+project|my\s+project|the\s+project|our\s+project))\b/i.test(clean) &&
    !/\b(?:project|film|movie|festival|event|squad|team|missing|budget|timeline|schedule|tasks?)\b/i.test(clean)
  ) {
    return false;
  }

  // Explicit project references
  const explicitProjectPatterns = [
    /\b(?:my|this|our|the)\s+project\b/i,
    /\b(?:my|this|our|the)\s+(?:film|movie|festival|event|app|website|squad|team)\b/i,
    /\b(?:project\s+plan|project\s+requirements|project\s+budget|project\s+timeline)\b/i,
    /\b(?:who\s+(?:is|are)\s+(?:still\s+)?missing|what\s+roles?\s+(?:are|is)\s+(?:still\s+)?missing|missing\s+roles?|roles?\s+(?:are|is)\s+missing|open\s+positions?)\b/i,
    /\b(?:who\s+all\s+do\s+i\s+need|who\s+do\s+i\s+need\s+for|roles?\s+needed|roles?\s+required)\b/i,
    /\b(?:next\s+step|what\s+should\s+we\s+do\s+(?:next|first|now)|what\s+is\s+next|what\s+is\s+pending)\b/i,
    /\b(?:create\s+tasks|assign\s+tasks|tasks\s+for)\b/i,
    /\b(?:review\s+(?:the\s+)?plan|show\s+(?:the\s+)?plan|show\s+(?:the\s+)?blueprint)\b/i,
    /\b(?:build\s+(?:my\s+|the\s+)?(?:film\s+)?squad|orchestrate\s+team)\b/i,
  ];

  if (explicitProjectPatterns.some((p) => p.test(clean))) {
    return true;
  }

  // Check if query mentions the exact project title
  if (activeProject.title && clean.includes(activeProject.title.toLowerCase())) {
    return true;
  }

  return false;
}

/**
 * Checks whether the user's message is asking for creative story writing, continuation,
 * analysis, or adaptation.
 */
export function isQueryStoryRelated(query: string, hasActiveStory: boolean): boolean {
  const clean = query.toLowerCase().trim();

  // Multi-turn continuity commands that require existing story context
  const storyContinuityPatterns = [
    /\b(?:generate\s+(?:the\s+)?story|write\s+(?:the\s+)?story)\b/i,
    /\b(?:make\s+(?:it|the\s+story|this\s+story|the\s+villain|the\s+ending)\s+more\s+\w+)\b/i,
    /\b(?:add\s+(?:an?\s+)?(?:emotional\s+scene|villain|twist|character|conflict))\b/i,
    /\b(?:find\s+plot\s*holes?|critique\s+(?:this|the)?\s*story|story\s+weaknesses?)\b/i,
    /\b(?:(?:convert|turn|adapt)\s+(?:it\s+)?(?:into|to|in\s+to)\s+(?:a\s+)?screenplay|convert\s+(?:it\s+)?to\s+screenplay)\b/i,
    /\b(?:create\s+(?:a\s+)?shot\s*list|make\s+(?:a\s+)?shot\s*list)\b/i,
    /\b(?:make\s+this\s+possible\s+on\s+a\s+low\s+budget|low\s+budget\s+adaptation)\b/i,
    /\b(?:expand\s+(?:the\s+)?story|continue\s+(?:the\s+)?story|shorten\s+(?:the\s+)?story)\b/i,
  ];

  if (storyContinuityPatterns.some((p) => p.test(clean))) {
    return true;
  }

  // Direct story ideation or screenwriting requests
  if (
    /\b(?:direct\s+an?\s+action\s+thriller|direct\s+a\s+short\s+film|write\s+a\s+screenplay|write\s+a\s+script|story\s+about)\b/i.test(clean)
  ) {
    return true;
  }

  // If an active story exists and the prompt is a short refinement directive
  if (hasActiveStory && clean.length < 50 && /\b(?:more\s+\w+|scene|dialogue|character|plot|ending|twist|pacing)\b/i.test(clean)) {
    return true;
  }

  return false;
}

/**
 * Resolves the 5 isolated context layers for a user turn.
 */
export function resolveContextLayers(params: {
  query: string;
  conversationHistory: ChatMessage[];
  activeProject: OmniForgeProject | null;
  conversationState: ConversationState;
  userId: string;
  userType: "creator" | "client";
}): ContextLayers {
  const { query, conversationHistory, activeProject, conversationState, userId, userType } = params;

  // Layer A: Conversation context (compact last 6 turns)
  const conversation = conversationHistory
    .filter((m) => !m.isError && m.text)
    .slice(-6)
    .map((m) => ({
      role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
      content: m.text,
    }));

  // Layer B: Project context (only attached when query is project-related)
  const isProjectTurn = isQueryProjectRelated(query, activeProject);
  let projectContext: ContextLayers["project"] = null;

  if (isProjectTurn && activeProject) {
    const missing = activeProject.coverage?.missingCapabilities?.map((m) => m.roleName) || [];
    const covered = activeProject.coverage?.coveredCapabilities?.map((c) => c.name) || [];
    const roles = activeProject.roles?.map((r) => ({ name: r.roleName, isFilled: Boolean(r.isFilled) })) || [];
    const activePhase = activeProject.phases?.[0]?.name;

    projectContext = {
      id: activeProject.id,
      title: activeProject.title,
      domain: activeProject.domain,
      type: activeProject.projectType || activeProject.type,
      storyPremise: activeProject.storyPremise,
      roles,
      missingRoles: missing,
      coveredRoles: covered,
      currentUserRole: activeProject.currentUserRole || conversationState.currentUserRole,
      activePhase,
    };
  }

  // Layer C: Story context (persists narrative continuity across story development)
  const activeStory = conversationState.activeStory || activeProject?.storyPremise;
  const isStoryTurn = isQueryStoryRelated(query, Boolean(activeStory));
  let storyContext: ContextLayers["story"] = null;

  if (isStoryTurn) {
    const isDirector =
      conversationState.currentUserRole === "DIRECTOR" ||
      activeProject?.currentUserRole === "DIRECTOR" ||
      /\b(?:director|directing|direct\s+an?)\b/i.test(query);

    storyContext = {
      activeStory: activeStory || undefined,
      genre: conversationState.requirements?.storyGenre,
      premise: conversationState.requirements?.storyPremise || activeProject?.storyPremise,
      isDirectorPerspective: isDirector,
    };
  }

  // Layer D: User context
  const user = {
    userId,
    userType,
    role: conversationState.currentUserRole || activeProject?.currentUserRole,
  };

  // Layer E: Tool context
  let toolContext: ContextLayers["tool"] = null;
  if (conversationState.targetRole) {
    toolContext = {
      lastSearchRole: conversationState.targetRole,
      lastResultCount: conversationState.matchedCreators?.length,
    };
  }

  return {
    conversation,
    project: projectContext,
    story: storyContext,
    user,
    tool: toolContext,
  };
}

/**
 * Builds the LLM system prompt and scoped payload based on active context layers.
 */
export function buildScopedAIPayload(layers: ContextLayers, query: string): {
  systemPrompt: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  projectContextPayload?: Record<string, any>;
} {
  // If this is a Story Development turn
  if (layers.story) {
    let storyPrompt = `You are OmniForge AI, an award-winning creative screenwriter and narrative architect.
Your mission is to develop, expand, or adapt stories with exceptional visual storytelling, cinematic tension, and character depth.`;

    if (layers.story.isDirectorPerspective) {
      storyPrompt += `\n\nDIRECTOR PERSPECTIVE: The user is the Film Director. Address them with director staging notes, visual cues, camera atmosphere, and lighting dynamics.`;
    }

    if (layers.story.activeStory) {
      storyPrompt += `\n\nACTIVE STORY CONTINUITY:
The user is refining an established story. Preserve the core characters, setting, and world-building while executing the user's specific creative direction:
"""
${layers.story.activeStory}
"""`;
    }

    return {
      systemPrompt: storyPrompt,
      history: layers.conversation,
      projectContextPayload: layers.story.activeStory ? { active_story: layers.story.activeStory } : undefined,
    };
  }

  // If this is an Active Project turn
  if (layers.project) {
    const p = layers.project;
    const projectPrompt = `You are OmniForge AI, the intelligent project architect for "${p.title}" (${p.domain}).
Current Project State:
- Title: ${p.title}
- Domain: ${p.domain}
- Covered Roles: ${p.coveredRoles.join(", ") || "None"}
- Open / Missing Roles: ${p.missingRoles.join(", ") || "All roles filled"}
${p.currentUserRole ? `- User Role: ${p.currentUserRole}` : ""}

Provide strategic, professional project guidance directly addressing the user's inquiry.`;

    return {
      systemPrompt: projectPrompt,
      history: layers.conversation,
      projectContextPayload: {
        title: p.title,
        domain: p.domain,
        missing_roles: p.missingRoles,
        covered_roles: p.coveredRoles,
      },
    };
  }

  // Default: General AI Conversation (ChatGPT-like intelligence with ZERO project hijacking)
  const generalPrompt = `You are OmniForge AI, an intelligent, versatile, and highly capable general-purpose AI assistant integrated into the OmniCraft platform.

You can answer ANY user inquiry comprehensively and directly, including:
- General knowledge & concept definitions
- Programming & technical questions (provide clean, working code with explanations)
- How-to guidance & step-by-step learning paths
- Brainstorming, startup ideas, and business advice
- Educational & exam-preparation questions
- Thoughtful comparisons and analytical breakdowns
- Normal, engaging conversation

CRITICAL PRINCIPLES:
1. Answer what the user actually asks with clarity, depth, and precision.
2. Never assume an unrelated question is about a film, project, or database entity.
3. If an explanation or code snippet is helpful, provide it directly without being asked.
4. Keep the tone helpful, modern, and inspiring.`;

  return {
    systemPrompt: generalPrompt,
    history: layers.conversation,
    projectContextPayload: undefined, // Zero project context injected!
  };
}
