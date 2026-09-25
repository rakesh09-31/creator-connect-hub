import {
  OmniForgeProject,
  ChatMessage,
  AIStructuredResponse,
} from "../types";
import { getServerConfig } from "../../config.server";
import {
  getActiveLLMProvider,
  executeLLMChatCompletion,
  LLMMessage,
} from "./llm-provider.server";
import {
  OMNIFORGE_TOOL_DEFINITIONS,
  executeServerTool,
  ToolExecutionContext,
} from "./tools.server";
import { processConversationalOmniForgeMessage } from "../engine";

export interface OrchestratorParams {
  text: string;
  activeProject: OmniForgeProject | null;
  conversationHistory: ChatMessage[];
  userType: "creator" | "client";
  userId: string;
}

export type OmniForgeProviderStatus =
  | "no_provider"
  | "configured_untested"
  | "live_verified"
  | "provider_error"
  | "fallback_active";

export interface OrchestrationResult {
  structuredResponse: AIStructuredResponse;
  meta: {
    provider: string;
    model: string;
    isRealLLM: boolean;
    latencyMs: number;
    tokensUsed?: number;
    toolCallsExecuted?: string[];
    fallbackUsed?: boolean;
    error?: string;
    status: OmniForgeProviderStatus;
    statusMessage?: string;
  };
}

const SYSTEM_PROMPT = `You are OmniForge AI — a senior creative architect, technical director, and verified talent orchestrator built natively inside the OmniCraft collaborative platform.

Your mission: Empower creators and clients to clarify ideas, design realistic production blueprints, match verified creators, assemble squads, and execute cross-functional projects.

CORE GUIDELINES:
1. GREETINGS & CASUAL TALK ("Hi", "Hlo", "How are you?"):
   - Respond naturally, warmly, and concisely.
   - NEVER generate a blueprint, task list, or creator cards for a simple greeting.
2. GENERAL KNOWLEDGE ("What is a director?", "What is React?", "What is Skill Swap?"):
   - Explain the concept clearly and helpfully.
   - Do not generate project plans unless explicitly requested.
3. CLARIFICATION ("I have an idea for a short film"):
   - Do NOT ask what type of project they want if they already stated it (e.g. film).
   - Ask an engaging, focused question about their premise, genre, or key characters.
4. PROJECT PLANNING ("Help me develop this idea", "Show me the complete plan"):
   - Call the 'GenerateProjectBlueprint' tool to establish structured stages, requirements, deliverables, and roles.
5. CREATOR DISCOVERY ("Find me a director", "Who can direct?"):
   - Call 'SearchCreators' tool with the exact role and required capabilities.
6. FOLLOW-UPS & ROLE QUESTIONS ("Can they also edit?", "Why do I need a director?"):
   - Answer contextually based on the active project and team lean principles.
7. SQUAD FORMATION ("Create a squad", "Assemble the team"):
   - Call 'CreateSquad' tool. Note that user confirmation is required before any persistent database creation.
8. MULTI-PROJECT & CONTEXT RETENTION:
   - When user asks an unrelated question ("What is React?"), answer it without erasing the active project.
   - When user says "Return to my film. What is pending?", retrieve active tasks and report status.
9. REAL DATA INTEGRITY:
   - Never fabricate fake creators, portfolio items, or match scores. Always rely on actual tool output.`;

/**
 * Main Unified Conversational Orchestrator.
 * Tries the real LLM provider first. If configured, executes tools and synthesizes responses.
 * If not configured or if provider errors, transparently falls back to our robust semantic engine.
 */
export async function orchestrateOmniForgeConversation(
  params: OrchestratorParams
): Promise<OrchestrationResult> {
  const config = getServerConfig();
  const activeProvider = getActiveLLMProvider(config);
  const startTime = Date.now();

  let llmFailureReason: string | undefined = undefined;

  // If a real LLM provider is configured with an API key, invoke the LLM pipeline
  if (activeProvider.provider !== "none" && activeProvider.apiKey) {
    try {
      const llmMessages: LLMMessage[] = [
        { role: "system", content: SYSTEM_PROMPT },
      ];

      // Add recent relevant conversation history (up to last 10 messages)
      const recentHistory = (params.conversationHistory || []).slice(-10);
      for (const msg of recentHistory) {
        llmMessages.push({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        });
      }

      // Add active project context prompt if present
      if (params.activeProject) {
        llmMessages.push({
          role: "system",
          content: `[Active Project Context] Title: "${params.activeProject.title}", Domain: "${params.activeProject.domain}", Stages: ${params.activeProject.phases?.length || 0}, Roles: ${(params.activeProject.roles || []).map((r) => r.roleName).join(", ")}.`,
        });
      }

      // Add current message
      llmMessages.push({ role: "user", content: params.text });

      // Call LLM with tools
      const llmResult = await executeLLMChatCompletion({
        messages: llmMessages,
        tools: OMNIFORGE_TOOL_DEFINITIONS,
        temperature: 0.4,
        maxTokens: 1500,
      });

      if (llmResult.success) {
        let updatedProject = params.activeProject;
        const toolCallsExecuted: string[] = [];
        const toolOutputs: Record<string, any> = {};

        // Execute any requested tool calls
        if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
          const toolCtx: ToolExecutionContext = {
            authenticatedUserId: params.userId,
            userType: params.userType,
            activeProject: params.activeProject,
            onUpdateActiveProject: (proj) => {
              updatedProject = proj;
            },
          };

          for (const tc of llmResult.toolCalls) {
            toolCallsExecuted.push(tc.name);
            const res = await executeServerTool(tc.name, tc.arguments, toolCtx);
            toolOutputs[tc.name] = res;

            if (res.data?.blueprint) {
              updatedProject = res.data.blueprint;
            } else if (res.data?.updatedProject) {
              updatedProject = res.data.updatedProject;
            }
          }

          // Second pass: Send tool results back to LLM for final synthesis
          const followUpMessages: LLMMessage[] = [
            ...llmMessages,
            {
              role: "assistant",
              content: llmResult.text || "Executing required project actions...",
            },
            ...llmResult.toolCalls.map((tc) => ({
              role: "tool" as const,
              content: JSON.stringify(toolOutputs[tc.name] || {}),
              toolCallId: tc.id,
            })),
          ];

          const secondPass = await executeLLMChatCompletion({
            messages: followUpMessages,
            temperature: 0.3,
            maxTokens: 1000,
          });

          const finalText = secondPass.success ? secondPass.text : llmResult.text;

          // Assemble structured response from tool data + synthesized text
          const structured = mapToolResultsToStructuredResponse(
            finalText,
            toolOutputs,
            updatedProject
          );

          return {
            structuredResponse: structured,
            meta: {
              provider: activeProvider.provider,
              model: activeProvider.model,
              isRealLLM: true,
              latencyMs: Date.now() - startTime,
              tokensUsed: (llmResult.tokensUsed || 0) + (secondPass.tokensUsed || 0),
              toolCallsExecuted,
              status: "live_verified",
              statusMessage: `Live cloud LLM inference verified via ${activeProvider.provider} (${activeProvider.model})`,
            },
          };
        }

        // Direct conversational answer without tools (greetings, explanations)
        return {
          structuredResponse: {
            intent: "GENERAL_CONVERSATION",
            responseLevel: "SIMPLE_ANSWER",
            message: llmResult.text,
            updatedProject: params.activeProject || undefined,
            suggestedFollowUps: generateNaturalFollowUps(params.text, params.activeProject),
          },
          meta: {
            provider: activeProvider.provider,
            model: activeProvider.model,
            isRealLLM: true,
            latencyMs: Date.now() - startTime,
            tokensUsed: llmResult.tokensUsed,
            status: "live_verified",
            statusMessage: `Live cloud LLM inference verified via ${activeProvider.provider} (${activeProvider.model})`,
          },
        };
      } else {
        llmFailureReason = llmResult.error || "PROVIDER_UNSUCCESSFUL";
        console.warn(`[Orchestrator] Provider ${activeProvider.provider} returned error: ${llmFailureReason}. Engaging local semantic fallback.`);
      }
    } catch (llmErr: any) {
      llmFailureReason = llmErr.message || "PROVIDER_EXCEPTION";
      console.warn("[Orchestrator] Real LLM request failed, falling back to local semantic engine:", llmFailureReason);
    }
  }

  // Fallback: Robust local semantic orchestrator (used when no API key configured or upon provider error)
  const fallbackResponse = await processConversationalOmniForgeMessage(
    params.text,
    params.activeProject,
    params.conversationHistory,
    params.userType,
    params.userId
  );

  const status: OmniForgeProviderStatus =
    activeProvider.provider === "none"
      ? "no_provider"
      : llmFailureReason
      ? "provider_error"
      : "fallback_active";

  const statusMessage =
    activeProvider.provider === "none"
      ? "No external LLM provider configured. Deterministic semantic orchestrator active."
      : llmFailureReason
      ? `External provider ${activeProvider.provider} error: ${llmFailureReason}. Deterministic fallback active.`
      : "Deterministic semantic fallback active.";

  return {
    structuredResponse: fallbackResponse,
    meta: {
      provider: activeProvider.provider !== "none" ? activeProvider.provider : "local-semantic",
      model: activeProvider.provider !== "none" ? activeProvider.model : "hybrid-orchestrator",
      isRealLLM: false,
      latencyMs: Date.now() - startTime,
      fallbackUsed: true,
      error: llmFailureReason || (activeProvider.provider === "none" ? "NO_EXTERNAL_KEY_CONFIGURED" : undefined),
      status,
      statusMessage,
    },
  };
}

/**
 * Maps executed tool outputs into structured UI cards and actions.
 */
function mapToolResultsToStructuredResponse(
  message: string,
  toolOutputs: Record<string, any>,
  updatedProject: OmniForgeProject | null
): AIStructuredResponse {
  const baseResponse: AIStructuredResponse = {
    intent: "GENERAL_PROJECT_QUESTION",
    responseLevel: "CONTEXTUAL_ANSWER",
    message,
    updatedProject: updatedProject || undefined,
  };

  // If blueprint was generated
  if (toolOutputs["GenerateProjectBlueprint"]?.data?.blueprint) {
    const bp = toolOutputs["GenerateProjectBlueprint"].data.blueprint;
    baseResponse.intent = "PROJECT_PLANNING";
    baseResponse.responseLevel = "PROJECT_ANALYSIS";
    baseResponse.updatedProject = bp;
    baseResponse.uiAction = { type: "SHOW_BLUEPRINT" };
    baseResponse.suggestedFollowUps = ["Find me a director", "Who do I need?", "Create a squad"];
  }

  // If creator search was run
  if (toolOutputs["SearchCreators"]?.data?.creators) {
    const creators = toolOutputs["SearchCreators"].data.creators;
    baseResponse.intent = "CREATOR_SEARCH";
    baseResponse.responseLevel = "CREATOR_DISCOVERY";
    baseResponse.creatorCards = creators;
    baseResponse.suggestedFollowUps = ["Can they also edit?", "Create a squad", "What should we do first?"];
  }

  // If squad creation confirmation is required
  if (toolOutputs["CreateSquad"]?.requiresUserConfirmation) {
    const details = toolOutputs["CreateSquad"].confirmationDetails;
    baseResponse.intent = "SQUAD_REQUEST";
    baseResponse.responseLevel = "CONFIRMATION_REQUIRED";
    baseResponse.requiresConfirmation = true;
    baseResponse.confirmationCard = {
      title: "Launch Project Squad",
      message: details?.description || "Initialize team workspace and dispatch invitations.",
      actionType: "create_squad",
      payload: details?.payload,
    };
    baseResponse.suggestedFollowUps = ["Yes", "Not yet, review team first"];
  }

  return baseResponse;
}

/**
 * Generates context-appropriate follow-up chips.
 */
function generateNaturalFollowUps(userQuery: string, activeProject: OmniForgeProject | null): string[] {
  const lower = userQuery.toLowerCase();
  if (lower.includes("react") || lower.includes("code") || lower.includes("software")) {
    return ["What is an API?", "What is Next.js?", "Plan a software project"];
  }
  if (lower.includes("director") || lower.includes("film")) {
    return ["Can they also edit?", "What does a cinematographer do?", "Plan a short film"];
  }
  if (activeProject) {
    return ["What should we do first?", "Find creators", "Create the squad"];
  }
  return ["Plan a short film", "Build a website", "What is Skill Swap?"];
}
