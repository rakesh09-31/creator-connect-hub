/**
 * OmniForge AI Production Server Routes
 *
 * Implements high-performance, serverless-compatible endpoints for:
 * - GET/OPTIONS /health & /api/health
 * - POST/OPTIONS /chat & /api/chat
 *
 * Features:
 * - Live Groq cloud LLM provider integration (qwen/qwen3.8-27b)
 * - Server-side secret protection (never exposes API keys)
 * - Progressive SSE streaming compatible with browser fetch and Android WebView
 * - Autonomous project blueprint and Supabase creator matching execution
 * - Production CORS handling and request validation
 * - In-memory rate limiting and timeout management
 */

import { getServerConfig } from "../../config.server";
import {
  getActiveLLMProvider,
  executeLLMChatCompletion,
  executeLLMStreamingChatCompletion,
  inspectLLMProviderConfiguration,
  sanitizeErrorMessage,
  LLMMessage,
} from "./llm-provider.server";
import { orchestrateOmniForgeConversation } from "./orchestrator.server";

// Simple in-memory sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  record.count++;
  return true;
}

// Clean up old rate limit entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap.entries()) {
      if (now > val.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

const SYSTEM_PROMPT_CONVERSATIONAL = `You are OmniForge AI, an elite conversational AI assistant and creative project architect integrated into the OmniCraft platform.

Capabilities & Guidelines:
1. GREETINGS & INTRODUCTIONS: Respond warmly and introduce yourself as OmniForge AI, the creative project and collaboration assistant inside OmniCraft.
2. GENERAL KNOWLEDGE & CONCEPTS: Answer general programming, technical, educational, and scientific questions directly, insightfully, and with structured bullet points or runnable code where helpful.
3. ACADEMIC & TECHNICAL TERMINOLOGY:
   - "CN" = Computer Networks
   - "OS" = Operating Systems
   - "DBMS" = Database Management Systems
   - "DSA" = Data Structures and Algorithms
   Provide complete, high-yield answers for viva, exam, or lab questions when asked.
4. PROJECT BUILDING & SQUADS: When users discuss ideas for films, music, apps, or creative ventures, help outline project stages, required roles, and suggest creating an execution blueprint or assembling an OmniCraft squad.
5. NO INTERNAL TOKENS: Never output internal deliberation tags, raw chain-of-thought tokens, or system commentary. Deliver clean Markdown.`;

/**
 * Builds standard CORS headers for AI responses.
 */
function buildCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, HEAD",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept, X-Requested-With, Cache-Control",
    "Access-Control-Max-Age": "86400",
  };
}

/**
 * Determines whether a query is explicitly requesting project architecture or creator matchmaking.
 */
function isProjectOrMatchingQuery(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("want to build") ||
    lower.includes("build a project") ||
    lower.includes("create a project") ||
    lower.includes("make a project") ||
    lower.includes("execution plan") ||
    lower.includes("project blueprint") ||
    lower.includes("short film about") ||
    lower.includes("find creators") ||
    lower.includes("find actors") ||
    lower.includes("find an actor") ||
    lower.includes("hire squad") ||
    lower.includes("build squad") ||
    lower.includes("film team") ||
    lower.includes("ecommerce website") ||
    lower.includes("e-commerce website")
  );
}

/**
 * Handles incoming HTTP requests for AI endpoints.
 * Returns a standard Web Response if handled, or null if unhandled.
 */
export async function handleAIRoute(request: Request): Promise<Response | null> {
  let url: URL;
  try {
    url = new URL(request.url);
  } catch {
    return null;
  }

  const pathname = url.pathname.replace(/\/+$/, "") || "/";
  const corsHeaders = buildCorsHeaders(request);

  // Check if route matches AI endpoints
  const isHealth = pathname === "/health" || pathname === "/api/health";
  const isChat = pathname === "/chat" || pathname === "/api/chat";

  if (!isHealth && !isChat) {
    return null;
  }

  // 1. CORS Preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Rate limit check
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "client-default";

  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({ error: "Too many requests. Please wait a moment." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }

  // 2. Health Endpoint
  if (isHealth) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const providerInfo = inspectLLMProviderConfiguration();
    const isReady = providerInfo.hasKey;

    const healthData = {
      status: isReady ? "running" : "degraded",
      application: "OmniForge AI Production Engine",
      provider: providerInfo.provider,
      model: providerInfo.model,
      has_key: providerInfo.hasKey,
      ollama_connected: false,
      model_available: providerInfo.hasKey,
      status_message: providerInfo.statusMessage,
      version: "2.0.0",
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(healthData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        ...corsHeaders,
      },
    });
  }

  // 3. Chat Endpoint
  if (isChat) {
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
        status: 405,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let body: any;
    try {
      body = await request.json();
    } catch (parseErr: any) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON payload in request body." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message cannot be empty." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const config = getServerConfig();
    const activeProvider = getActiveLLMProvider(config);
    const isStream = Boolean(body?.stream);

    // Fail immediately if no provider credentials configured (Requirement 7: Never silently return mock responses)
    if (activeProvider.provider === "none" || !activeProvider.apiKey) {
      const errMsg = "No live LLM API key configured in server environment (e.g. GROQ_API_KEY).";
      if (isStream) {
        return new Response(
          `data: ${JSON.stringify({ error: errMsg })}\n\n`,
          {
            status: 503,
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache",
              ...corsHeaders,
            },
          }
        );
      }
      return new Response(
        JSON.stringify({
          success: false,
          error: errMsg,
          provider: "none",
          model: "none",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Branch A: Project Blueprint Creation or Autonomous Creator Matching
    if (isProjectOrMatchingQuery(message)) {
      try {
        const orchResult = await orchestrateOmniForgeConversation({
          text: message,
          activeProject: body.project_context || null,
          conversationHistory: Array.isArray(body.history)
            ? body.history.map((h: any, idx: number) => ({
                id: `hist-${idx}`,
                sender: h.role === "assistant" ? "ai" : "user",
                text: h.content || "",
                timestamp: new Date().toISOString(),
              }))
            : [],
          userType: "creator",
          userId: "prod-user",
        });

        const fullAnswer = orchResult.structuredResponse.message;
        const chips = orchResult.structuredResponse.suggestedFollowUps || [
          "Create a squad",
          "Find more creators",
          "What should we do first?",
        ];
        const updatedProject = orchResult.structuredResponse.updatedProject || null;

        if (isStream) {
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              try {
                // Stream synthesized report in readable word chunks
                const words = fullAnswer.split(" ");
                let acc = "";
                for (let i = 0; i < words.length; i += 3) {
                  const chunk = words.slice(i, i + 3).join(" ") + (i + 3 < words.length ? " " : "");
                  acc += chunk;
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ token: chunk, accumulated: acc })}\n\n`)
                  );
                  // Brief pause to simulate smooth streaming for synthesized tools
                  await new Promise((r) => setTimeout(r, 8));
                }

                // Final done event
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({
                      done: true,
                      success: true,
                      response: fullAnswer,
                      answer: fullAnswer,
                      intent: orchResult.structuredResponse.intent || "PROJECT_CREATION",
                      project_action: updatedProject ? "UPDATE_PROJECT" : "NONE",
                      matching_action: orchResult.structuredResponse.matchedCards?.length
                        ? "SEARCH_CREATORS"
                        : "NONE",
                      project_data: updatedProject,
                      suggested_chips: chips,
                      provider: orchResult.meta.provider,
                      model: orchResult.meta.model,
                      metrics: { total_ms: orchResult.meta.latencyMs, tokens: fullAnswer.length / 4 },
                    })}\n\n`
                  )
                );
              } catch (streamErr: any) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ error: sanitizeErrorMessage(streamErr.message) })}\n\n`)
                );
              } finally {
                controller.close();
              }
            },
          });

          return new Response(stream, {
            status: 200,
            headers: {
              "Content-Type": "text/event-stream; charset=utf-8",
              "Cache-Control": "no-cache, no-transform",
              Connection: "keep-alive",
              "X-Accel-Buffering": "no",
              ...corsHeaders,
            },
          });
        }

        // Non-streaming response
        return new Response(
          JSON.stringify({
            success: true,
            response: fullAnswer,
            answer: fullAnswer,
            intent: orchResult.structuredResponse.intent || "PROJECT_CREATION",
            project_action: updatedProject ? "UPDATE_PROJECT" : "NONE",
            matching_action: orchResult.structuredResponse.matchedCards?.length ? "SEARCH_CREATORS" : "NONE",
            project_data: updatedProject,
            suggested_chips: chips,
            provider: orchResult.meta.provider,
            model: orchResult.meta.model,
            metrics: { total_ms: orchResult.meta.latencyMs, tokens: fullAnswer.length / 4 },
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } catch (orchErr: any) {
        const sanitized = sanitizeErrorMessage(orchErr.message || "Failed to process project request");
        if (isStream) {
          return new Response(`data: ${JSON.stringify({ error: sanitized })}\n\n`, {
            status: 502,
            headers: { "Content-Type": "text/event-stream; charset=utf-8", ...corsHeaders },
          });
        }
        return new Response(JSON.stringify({ success: false, error: sanitized }), {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        });
      }
    }

    // Branch B: Live Conversational / Q&A / Greeting / Coding Flow
    const conversationMessages: LLMMessage[] = [
      { role: "system", content: SYSTEM_PROMPT_CONVERSATIONAL },
    ];

    if (Array.isArray(body?.history)) {
      const recent = body.history.slice(-8);
      for (const h of recent) {
        if (h.content) {
          conversationMessages.push({
            role: h.role === "assistant" ? "assistant" : "user",
            content: h.content,
          });
        }
      }
    }

    conversationMessages.push({ role: "user", content: message });

    // Streaming path
    if (isStream) {
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          try {
            let accumulatedText = "";
            const streamResult = await executeLLMStreamingChatCompletion({
              messages: conversationMessages,
              temperature: 0.4,
              maxTokens: 2048,
              timeoutMs: 40000,
              signal: request.signal,
              onDelta: (delta, acc) => {
                accumulatedText = acc;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ token: delta, accumulated: acc })}\n\n`)
                );
              },
            });

            if (!streamResult.success) {
              const sanitized = sanitizeErrorMessage(streamResult.error || "Inference failed");
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ error: sanitized })}\n\n`)
              );
            } else {
              const suggestedChips = [
                "I want to build a project",
                "Find creators on OmniCraft",
                "Explore collaborative squads",
              ];
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    done: true,
                    success: true,
                    response: accumulatedText,
                    answer: accumulatedText,
                    intent: "GENERAL_CONVERSATION",
                    project_action: "NONE",
                    matching_action: "NONE",
                    suggested_chips: suggestedChips,
                    provider: streamResult.provider,
                    model: streamResult.model,
                    metrics: { total_ms: streamResult.latencyMs, tokens: accumulatedText.length / 4 },
                  })}\n\n`
                )
              );
            }
          } catch (streamErr: any) {
            const sanitized = sanitizeErrorMessage(streamErr.message || "Streaming failed");
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: sanitized })}\n\n`)
            );
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        status: 200,
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
          "X-Accel-Buffering": "no",
          ...corsHeaders,
        },
      });
    }

    // Non-streaming conversational path
    try {
      const completionResult = await executeLLMChatCompletion({
        messages: conversationMessages,
        temperature: 0.4,
        maxTokens: 2048,
        timeoutMs: 40000,
      });

      if (!completionResult.success) {
        const sanitized = sanitizeErrorMessage(completionResult.error || "Inference failed");
        return new Response(
          JSON.stringify({ success: false, error: sanitized, provider: activeProvider.provider }),
          {
            status: 502,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const suggestedChips = [
        "I want to build a project",
        "Find creators on OmniCraft",
        "Explore collaborative squads",
      ];

      return new Response(
        JSON.stringify({
          success: true,
          response: completionResult.text,
          answer: completionResult.text,
          intent: "GENERAL_CONVERSATION",
          project_action: "NONE",
          matching_action: "NONE",
          suggested_chips: suggestedChips,
          provider: completionResult.provider,
          model: completionResult.model,
          metrics: { total_ms: completionResult.latencyMs, tokens: completionResult.tokensUsed },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    } catch (llmErr: any) {
      const sanitized = sanitizeErrorMessage(llmErr.message || "Failed to process chat message");
      return new Response(
        JSON.stringify({ success: false, error: sanitized, provider: activeProvider.provider }),
        {
          status: 502,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }
  }

  return null;
}
