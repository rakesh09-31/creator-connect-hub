/**
 * OmniForge AI Orchestrator
 *
 * Central intelligence coordinator for OmniForge.
 * Core Principle: Intent classification GUIDES the AI, it does NOT limit what the AI can answer.
 * The user can ask ANY reasonable question (general knowledge, definitions, explanations,
 * programming, how-to, advice, creative requests) and OmniForge provides a useful, complete response.
 *
 * Architecture Flow:
 * USER MESSAGE
 *    ↓
 * AI UNDERSTANDING & CONTEXT SCOPING (5 Layers: Conversation, Project, Story, User, Tool)
 *    ↓
 * DETERMINISTIC TOOL / FAST-PATH CHECK
 *    ↓
 * LOCAL AI (QWEN) GENERATION & STREAMING (With Narrative / Code / General Prompt Scoping)
 *    ↓
 * DYNAMIC FOLLOW-UP CHIP GENERATION (Never leaks unrelated academic/project chips)
 *    ↓
 * UNIFIED ORCHESTRATOR RESULT
 */

import {
  OmniForgeProject,
  ChatMessage,
  ConversationState,
  CreatorRecommendation,
} from "./types";
import {
  resolveContextLayers,
  isQueryProjectRelated,
  isQueryStoryRelated,
} from "./context-manager";
import {
  executeOmniForgeTool,
  OmniForgeToolName,
  ToolExecutionResult,
} from "./tools";
import { generateDynamicFollowUpChips } from "./dynamic-chips";
import { classifyUserIntent, isDeterministicIntent } from "./intent";
import { sendLocalAIChatMessage, LocalAIChatResponse, validateLocalAIResponse } from "../api/local-ai";
import { transitionConversationState } from "./conversation-state";
import {
  retrieveKnowledge,
  RetrievedKnowledgeResult,
  ResponseSource,
} from "./rag";

export interface OrchestratorParams {
  userMessage: string;
  activeProject: OmniForgeProject | null;
  conversationHistory: ChatMessage[];
  conversationState: ConversationState;
  userId: string;
  userType: "creator" | "client";
  onToken?: (token: string, accumulated: string) => void;
  onUpdateProject?: (project: OmniForgeProject) => void;
  signal?: AbortSignal;
}

export interface OrchestratorResult {
  success: boolean;
  intent: string;
  response: string;
  executionMode: "FAST" | "AI" | "TOOL" | "RAG" | "HYBRID";
  toolExecution?: ToolExecutionResult;
  suggestedChips: string[];
  matchedCards?: CreatorRecommendation[];
  updatedProject?: OmniForgeProject;
  activeStory?: string;
  conversationState: ConversationState;
  ragResult?: RetrievedKnowledgeResult;
  responseSource?: ResponseSource;
  telemetry: {
    intentDetectionMs: number;
    contextBuildMs: number;
    executionMs: number;
    totalMs: number;
    provider: string;
    model: string;
    intent_detection_ms?: number;
    database_ms?: number;
    embedding_ms?: number;
    retrieval_ms?: number;
    ollama_ms?: number;
    response_composition_ms?: number;
    execution_mode?: string;
    database_used?: boolean;
    rag_used?: boolean;
    llm_used?: boolean;
    responseSource?: ResponseSource;
  };
}

/**
 * Detects if the user query requires an OmniForge tool action.
 */
function identifyRequiredTool(
  query: string,
  intent: string,
  hasActiveProject: boolean,
  classifiedTargetRole?: string,
  classifiedSkills?: string[]
): { toolName: OmniForgeToolName; parameters: Record<string, any> } | null {
  const clean = query.trim();
  const lower = clean.toLowerCase();

  // 1. Creator search
  if (
    intent === "CREATOR_SEARCH" ||
    /^(?:find|search(?:\s+for)?|show\s+me|look\s+for|get\s+me)\s+(?:all\s+)?(?:the\s+)?(?:available\s+)?(?:verified\s+)?(?:[\w\s]{0,25})?(?:actors?|actresses?|video\s+editors?|editors?|colorists?|cinematographers?|dops?|directors?|singers?|vocalists?|dancers?|sound\s+designers?|sound\s+engineers?|performers?|lighting\s+technicians?|event\s+coordinators?)/i.test(clean)
  ) {
    let targetRole = classifiedTargetRole || "Creator";
    if (!classifiedTargetRole || classifiedTargetRole === "Creator") {
      if (/\b(?:performer|performers|performance)\b/i.test(lower)) targetRole = "Performers";
      else if (/\b(?:video\s+editor|editor|editors|edit(?:ing)?\s+(?:[\w\s]{0,20})?(?:videos?|footage|content|film|reels?|shorts?)|who\s+can\s+edit|edit\s+(?:my|our|the)\s+videos?)\b/i.test(lower)) targetRole = "Video Editor";
      else if (/\b(?:cinematographer|dop|camera|shoot(?:ing)?\s+(?:my\s+)?(?:short\s+)?(?:film|movie|videos?))\b/i.test(lower)) targetRole = "Cinematographer";
      else if (/\b(?:actor|actress|lead\s+actor|hero|heroine)\b/i.test(lower)) targetRole = "Lead Actor";
      else if (/\b(?:singer|vocalist)\b/i.test(lower)) targetRole = "Lead Singer";
      else if (/\b(?:dancer|choreographer)\b/i.test(lower)) targetRole = "Dancer";
      else if (/\b(?:sound\s+engineer|audio\s+engineer|sound\s+designer|mix(?:ing)?\s+(?:my\s+)?(?:sound|audio|track))\b/i.test(lower)) targetRole = "Sound Engineer";
      else if (/\b(?:event\s+coordinator|event\s+manager)\b/i.test(lower)) targetRole = "Event Coordinator";
      else if (/\b(?:lighting|stage\s+technician)\b/i.test(lower)) targetRole = "Stage/Lighting Technician";
    }

    const skills = classifiedSkills && classifiedSkills.length > 0 ? [...classifiedSkills] : [];
    if (skills.length === 0 && /\b(?:youtube|youtube\s+videos?|vlog|vlogging)\b/i.test(clean)) {
      skills.push("YouTube Video Editing", "Video Editing");
    }

    return {
      toolName: "search_creators",
      parameters: { targetRole, skills, scope: "BATCH" },
    };
  }

  // 2. Missing roles analysis
  if (
    intent === "MISSING_ROLES" ||
    /\b(?:who\s+(?:is|are)\s+(?:still\s+)?missing|what\s+roles?\s+(?:are|is)\s+missing|missing\s+roles?|open\s+positions?)\b/i.test(lower)
  ) {
    if (hasActiveProject) {
      return { toolName: "analyze_missing_roles", parameters: {} };
    }
  }

  // 3. Project creation from clear project brief or project architecture request
  if (
    intent === "PROJECT_CREATE" ||
    intent === "PROJECT_CREATION" ||
    intent === "PROJECT_ARCHITECTURE" ||
    /^(?:i\s+want\s+to\s+(?:make|build|create|shoot|produce|organize|plan)|let'?s\s+(?:make|build|create|shoot|produce|organize|plan))\s+(?:a\s+|an\s+)?(?:short\s+film|film|movie|cultural\s+festival|festival|event|web\s*app|website|mobile\s*app|music\s*video|ai[\s\-]?powered|crop\s+disease|application|\w+\s+app|\w+\s+application)/i.test(lower)
  ) {
    let domain: string | undefined = undefined;
    if (/\b(?:cultural\s+festival|festival|event|college\s+festival)\b/i.test(lower)) {
      domain = "Events";
    } else if (/\b(?:film|movie|short\s+film|cinema)\b/i.test(lower)) {
      domain = "Film";
    } else if (/\b(?:web\s*app|website|mobile\s*app|software|crop\s+disease|ai[\s\-]?powered|disease\s+detection)\b/i.test(lower)) {
      domain = "Software";
    }

    return {
      toolName: "create_project",
      parameters: { idea: clean, domain },
    };
  }

  // 4. Create tasks for specific role
  const taskMatch = lower.match(/(?:create|generate|assign)\s+tasks?\s+for\s+(?:the\s+)?([a-z\s]+)/i);
  if (taskMatch && hasActiveProject) {
    return {
      toolName: "create_tasks",
      parameters: { role: taskMatch[1].trim() },
    };
  }

  // 5. Manage / modify project scope
  if (
    hasActiveProject &&
    /\b(?:change\s+the\s+budget|update\s+the\s+budget|reduce\s+budget|increase\s+budget|update\s+timeline|change\s+timeline|rename\s+project)\b/i.test(lower)
  ) {
    return {
      toolName: "manage_project",
      parameters: { instruction: clean },
    };
  }

  return null;
}

/**
 * Orchestrates a user message end-to-end:
 * Scoping &rarr; Tool/Fast-path execution &rarr; AI Generation &rarr; Dynamic Follow-up Chips.
 */
export async function orchestrateOmniForgeMessage(
  params: OrchestratorParams
): Promise<OrchestratorResult> {
  const t0 = performance.now();
  const {
    userMessage,
    activeProject,
    conversationHistory,
    conversationState,
    userId,
    userType,
    onToken,
    onUpdateProject,
  } = params;

  const trimmed = userMessage.trim();

  // 1. CONTEXT SCOPING (5 Layers)
  const tContextStart = performance.now();
  const contextLayers = resolveContextLayers({
    query: trimmed,
    conversationHistory,
    activeProject,
    conversationState,
    userId,
    userType,
  });
  const contextBuildMs = performance.now() - tContextStart;

  // 2. INTENT CLASSIFICATION (Guides the AI, never limits answers)
  const tIntentStart = performance.now();
  const classifiedIntent = classifyUserIntent(trimmed, {
    hasActiveProject: Boolean(contextLayers.project),
    activeProject,
    conversationHistory,
    currentUserRole: contextLayers.user.role || conversationState.currentUserRole,
  });
  const intentDetectionMs = performance.now() - tIntentStart;

  // 3. CONVERSATION STATE ADVANCEMENT
  const updatedState = transitionConversationState(conversationState, trimmed, conversationHistory);
  if (activeProject) {
    updatedState.activeProjectId = activeProject.id;
    if (activeProject.currentUserRole) {
      updatedState.currentUserRole = activeProject.currentUserRole;
    }
  }

  // 4. CHECK FOR SPECIALIZED TOOL EXECUTION
  // Detect mixed requests that require BOTH authoritative RAG explanations AND live Supabase candidate matching:
  // e.g. "I am a director making a short film. Explain what roles I need and find the creators."
  const isMixedExplorationAndSearch =
    (/\b(?:explain\s+what\s+roles|what\s+roles\s+(?:do\s+i|are)\s+need(?:ed)?)\b/i.test(trimmed) &&
      /\b(?:find\s+(?:the\s+)?(?:creators|people|everyone|team|cast))\b/i.test(trimmed)) ||
    (Boolean(classifiedIntent.requiresKnowledge) && Boolean(classifiedIntent.requiresDatabase) && !Boolean(classifiedIntent.deterministicText));

  const requiredTool = !isMixedExplorationAndSearch
    ? identifyRequiredTool(
        trimmed,
        classifiedIntent.intent,
        Boolean(activeProject),
        classifiedIntent.targetRole,
        classifiedIntent.skills
      )
    : null;

  if (requiredTool) {
    const tExecStart = performance.now();
    const toolResult = await executeOmniForgeTool(
      requiredTool.toolName,
      requiredTool.parameters,
      {
        userId,
        userType,
        activeProject,
        conversationState: updatedState,
        onUpdateProject,
      }
    );
    const executionMs = performance.now() - tExecStart;

    const chips = generateDynamicFollowUpChips({
      intent: classifiedIntent.intent,
      userQuery: trimmed,
      activeProject: toolResult.data || activeProject,
      resultCount: toolResult.data?.creators?.length,
      initialChips: toolResult.suggestedChips,
      isProjectTurn: isQueryProjectRelated(trimmed, activeProject),
      isStoryTurn: false,
    });

    return {
      success: toolResult.success,
      intent: classifiedIntent.intent,
      response: toolResult.outputSummary || "",
      executionMode: "TOOL",
      toolExecution: toolResult,
      suggestedChips: chips,
      matchedCards: toolResult.data?.creators,
      updatedProject: toolResult.data && toolResult.data.id ? toolResult.data : undefined,
      conversationState: updatedState,
      responseSource: "SUPABASE",
      telemetry: {
        intentDetectionMs,
        contextBuildMs,
        executionMs,
        totalMs: performance.now() - t0,
        provider: "supabase-database",
        model: "supabase-truth",
        intent_detection_ms: intentDetectionMs,
        database_ms: executionMs,
        embedding_ms: 0,
        retrieval_ms: 0,
        ollama_ms: 0,
        response_composition_ms: 0,
        execution_mode: "SUPABASE",
        database_used: true,
        rag_used: false,
        llm_used: false,
        responseSource: "SUPABASE",
      },
    };
  }

  // 5. DETERMINISTIC FAST-PATHS (Greetings, Identity, Capability, Cached Definitions)
  const isFast = isDeterministicIntent(classifiedIntent.intent, Boolean(classifiedIntent.deterministicText));
  if (isFast && classifiedIntent.deterministicText) {
    const chips = generateDynamicFollowUpChips({
      intent: classifiedIntent.intent,
      userQuery: trimmed,
      activeProject,
      initialChips: classifiedIntent.suggestedChips,
      isProjectTurn: false,
      isStoryTurn: false,
    });

    return {
      success: true,
      intent: classifiedIntent.intent,
      response: classifiedIntent.deterministicText,
      executionMode: "FAST",
      suggestedChips: chips,
      conversationState: updatedState,
      responseSource: "FAST_PATH",
      telemetry: {
        intentDetectionMs,
        contextBuildMs,
        executionMs: 0,
        totalMs: performance.now() - t0,
        provider: "deterministic-fast-path",
        model: "deterministic",
        intent_detection_ms: intentDetectionMs,
        database_ms: 0,
        embedding_ms: 0,
        retrieval_ms: 0,
        ollama_ms: 0,
        response_composition_ms: 0,
        execution_mode: "FAST_PATH",
        database_used: false,
        rag_used: false,
        llm_used: false,
        responseSource: "FAST_PATH",
      },
    };
  }

  // 6. RAG KNOWLEDGE RETRIEVAL STEP
  // Triggered when authoritative domain knowledge is required (filmmaking, software engineering, architecture, etc.)
  let ragResult: RetrievedKnowledgeResult | undefined;
  let embeddingMs = 0;
  let retrievalMs = 0;

  const needsKnowledge =
    classifiedIntent.requiresKnowledge ||
    [
      "KNOWLEDGE",
      "GENERAL_KNOWLEDGE",
      "CONCEPT_EXPLANATION",
      "ROLE_OR_CONCEPT_EXPLANATION",
      "FEATURE_EXPLANATION",
      "DEFINITION",
      "EXPLANATION",
      "PROJECT_ARCHITECTURE",
      "TECHNICAL_QUESTION",
      "EDUCATIONAL_QUESTION",
      "NEXT_LEARNING_REQUEST",
    ].includes(classifiedIntent.intent) ||
    /\b(?:what\s+does\s+.*\s+do|what\s+is|what\s+are|define|explain|how\s+does\s+.*\s+work|workflow|fundamentals|principles|best\s+practices|why\s+is|architecture)\b/i.test(trimmed);

  if (needsKnowledge) {
    try {
      ragResult = await retrieveKnowledge({
        query: trimmed,
        topK: 4,
        similarityThreshold: 0.40,
        domain: activeProject?.domain,
      });
      embeddingMs = ragResult.embeddingMs;
      retrievalMs = ragResult.retrievalMs;
    } catch (ragErr) {
      console.warn("[Orchestrator] RAG retrieval error:", ragErr);
    }
  }

  // 7. HANDLE MIXED REQUESTS (RAG Knowledge + Live Supabase Matcher)
  let mixedToolResult: ToolExecutionResult | undefined;
  let mixedDatabaseMs = 0;

  if (isMixedExplorationAndSearch) {
    const tMixDbStart = performance.now();
    try {
      mixedToolResult = await executeOmniForgeTool(
        "search_creators",
        {
          targetRole: classifiedIntent.targetRole || "Creator",
          skills: classifiedIntent.skills || [],
          scope: "BATCH",
        },
        {
          userId,
          userType,
          activeProject,
          conversationState: updatedState,
          onUpdateProject,
        }
      );
    } catch (toolErr) {
      console.warn("[Orchestrator] Mixed search_creators failed:", toolErr);
    }
    mixedDatabaseMs = performance.now() - tMixDbStart;
  }

  // 8. GENERATIVE AI EXECUTION (Local Qwen reasoning engine via FastAPI / Ollama)
  const tAIStart = performance.now();

  const isStoryTurn = isQueryStoryRelated(trimmed, Boolean(updatedState.activeStory));
  const isProjectTurn = isQueryProjectRelated(trimmed, activeProject);

  // Scoped project context payload for AI: NEVER inject project context for unrelated queries!
  const scopedProjectPayload = isProjectTurn && activeProject
    ? {
        title: activeProject.title,
        domain: activeProject.domain,
        type: activeProject.projectType || activeProject.type,
        story_premise: activeProject.storyPremise || activeProject.title,
        budget: activeProject.budget,
        team_size: activeProject.teamSize || activeProject.roles?.length,
        roles: activeProject.roles?.map((r) => r.roleName),
        active_story: updatedState.activeStory,
      }
    : isStoryTurn && updatedState.activeStory
    ? {
        active_story: updatedState.activeStory,
        story_premise: activeProject?.storyPremise,
      }
    : undefined;

  let localAiResult: LocalAIChatResponse;
  try {
    localAiResult = await sendLocalAIChatMessage(
      trimmed,
      contextLayers.conversation,
      scopedProjectPayload,
      undefined,
      onToken,
      ragResult?.formattedContext
    );
  } catch (err: any) {
    // Graceful fallback to helpful AI message
    localAiResult = {
      success: false,
      model: "qwen3:4b",
      provider: "local-ollama",
      answer: `I encountered an unexpected issue connecting to the AI inference model. Please ensure the local inference backend is active at 127.0.0.1:8001.\n\n${err?.message || ""}`,
      intent: classifiedIntent.intent as any,
    };
  }

  const executionMs = performance.now() - tAIStart;
  const rawAnswer = localAiResult.answer || localAiResult.response || "";
  const valResult = validateLocalAIResponse(rawAnswer, {
    intent: localAiResult.intent || classifiedIntent.intent,
  });
  const finalAnswer = valResult.isValid ? valResult.cleanedText : rawAnswer;

  // If this was a story turn, preserve the narrative in activeStory for multi-turn continuity
  if (
    isStoryTurn ||
    classifiedIntent.intent === "STORY_GENERATION" ||
    classifiedIntent.intent === "STORY_MODIFICATION"
  ) {
    if (finalAnswer.length > 80) {
      updatedState.activeStory = finalAnswer;
    }
  }

  // 9. DYNAMIC FOLLOW-UP CHIPS GENERATION
  const dynamicChips = generateDynamicFollowUpChips({
    intent: localAiResult.intent || classifiedIntent.intent,
    userQuery: trimmed,
    activeProject: mixedToolResult?.data || activeProject,
    initialChips: mixedToolResult?.suggestedChips || localAiResult.suggested_chips,
    isStoryTurn,
    isProjectTurn,
  });

  const responseSource: ResponseSource = isMixedExplorationAndSearch
    ? "HYBRID"
    : ragResult && ragResult.totalChunks > 0
    ? "RAG_OLLAMA"
    : "OLLAMA";

  const executionMode = isMixedExplorationAndSearch
    ? "HYBRID"
    : ragResult && ragResult.totalChunks > 0
    ? "RAG"
    : "AI";

  return {
    success: localAiResult.success,
    intent: localAiResult.intent || classifiedIntent.intent,
    response: finalAnswer,
    executionMode,
    suggestedChips: dynamicChips,
    matchedCards: mixedToolResult?.data?.creators,
    toolExecution: mixedToolResult,
    ragResult,
    responseSource,
    activeStory: updatedState.activeStory,
    conversationState: updatedState,
    telemetry: {
      intentDetectionMs,
      contextBuildMs,
      executionMs,
      totalMs: performance.now() - t0,
      provider: localAiResult.provider || (ragResult?.totalChunks ? "ollama-rag" : "local-ollama"),
      model: localAiResult.model || "qwen3:4b",
      intent_detection_ms: intentDetectionMs,
      database_ms: mixedDatabaseMs,
      embedding_ms: embeddingMs,
      retrieval_ms: retrievalMs,
      ollama_ms: executionMs,
      response_composition_ms: Math.round(performance.now() - tAIStart),
      execution_mode: executionMode,
      database_used: Boolean(isMixedExplorationAndSearch && mixedToolResult),
      rag_used: Boolean(ragResult && ragResult.totalChunks > 0),
      llm_used: true,
      responseSource,
    },
  };
}
