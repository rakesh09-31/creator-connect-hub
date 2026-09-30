/**
 * Local AI Backend Client
 * Connects directly to the local FastAPI inference engine running at http://127.0.0.1:8001.
 *
 * NOTE: This backend runs locally on the user's computer via Ollama (qwen3:4b).
 * It will not work for external users or production deployments without a separately
 * configured inference server.
 */

export const LOCAL_AI_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_LOCAL_AI_URL) ||
  "http://127.0.0.1:8001";

import { UserIntent, ProjectActionType, MatchingActionType, SuggestedRole } from "@/lib/omniforge/types";

export interface LocalAIChatResponse {
  success: boolean;
  intent?: UserIntent;
  project_action?: ProjectActionType;
  matching_action?: MatchingActionType;
  project_data?: any;
  model: string;
  provider: string;
  answer: string;
  response?: string;
  suggested_roles?: SuggestedRole[];
  metrics?: {
    ttft_ms?: number;
    total_ms?: number;
    tokens?: number;
    prompt_eval_count?: number;
  };
}

export interface SendChatOptions {
  history?: LocalAIChatHistoryItem[];
  projectContext?: LocalAIProjectContext;
  timeoutMs?: number;
  numPredict?: number;
  onToken?: (token: string, accumulated: string) => void;
}

export interface LocalAIHealthResponse {
  status: "running" | "error" | "offline";
  provider?: string;
  model?: string;
  ollama_connected?: boolean;
  model_available?: boolean;
  error?: string;
}

/**
 * Checks the status and availability of the local FastAPI backend and Ollama model.
 */
export async function checkLocalAIHealth(
  timeoutMs: number = 4000
): Promise<LocalAIHealthResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${LOCAL_AI_BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      let data: any;
      try {
        data = await res.json();
      } catch (jsonErr: any) {
        return {
          status: "error",
          error: `Failed to parse JSON response from ${LOCAL_AI_BASE_URL}/health: ${jsonErr.message}`,
        };
      }
      return {
        status: "running",
        provider: data.provider || "local-ollama",
        model: data.model || "qwen3:4b",
        ollama_connected: data.ollama_connected ?? true,
        model_available: data.model_available ?? true,
      };
    } else {
      // Fallback check on root /
      const rootRes = await fetch(`${LOCAL_AI_BASE_URL}/`, {
        method: "GET",
        signal: controller.signal,
      });
      if (rootRes.ok) {
        let rootData: any;
        try {
          rootData = await rootRes.json();
        } catch {
          rootData = {};
        }
        return {
          status: "running",
          provider: rootData.provider || "local-ollama",
          model: rootData.model || "qwen3:4b",
          ollama_connected: true,
          model_available: true,
        };
      }
      return {
        status: "error",
        error: `HTTP ${res.status}: Server returned an error`,
      };
    }
  } catch (err: any) {
    clearTimeout(timer);
    const detail = err?.message || String(err);
    return {
      status: "offline",
      error:
        err.name === "AbortError"
          ? `Connection to ${LOCAL_AI_BASE_URL} timed out after ${timeoutMs}ms.`
          : `Local AI server unreachable at ${LOCAL_AI_BASE_URL} (${detail}).`,
    };
  }
}

/**
 * Cleans AI response text on the frontend as an extra layer of protection,
 * ensuring no thinking traces, deliberation tags, or reasoning delimiters ever leak to the UI.
 */
export function cleanAiResponseText(rawText: string): string {
  if (!rawText) return "";
  let text = rawText.trim();

  // 1. Remove complete <think>...</think>, <thought>...</thought>, etc.
  text = text.replace(/<(think|thought|reasoning|deliberation)>[\s\S]*?<\/\1>/gi, "");
  text = text.replace(/\[(think|thought|reasoning|deliberation)\][\s\S]*?\[\/\1\]/gi, "");

  // 2. Unmatched closing tags: keep text after the last closing tag
  const closingMatches = Array.from(text.matchAll(/<\/(?:think|thought|reasoning|deliberation)>|\[\/(?:think|thought|reasoning|deliberation)\]/gi));
  if (closingMatches.length > 0) {
    const lastMatch = closingMatches[closingMatches.length - 1];
    if (lastMatch.index !== undefined) {
      text = text.slice(lastMatch.index + lastMatch[0].length);
    }
  }

  // 3. Unclosed opening tags at beginning (still inside thinking block)
  if (/^<(?:think|thought|reasoning|deliberation)>/i.test(text)) {
    return "";
  }

  // 4. Remove stray tags
  text = text.replace(/<\/?(?:think|thought|reasoning|deliberation)>/gi, "");
  text = text.replace(/\[\/?(?:think|thought|reasoning|deliberation)\]/gi, "");

  // 5. Remove 'Final answer...' or '...Time to write' markers
  const timeToWriteMatch = text.match(/\.\.\.Time to write\.?/i);
  if (timeToWriteMatch && timeToWriteMatch.index !== undefined) {
    text = text.slice(timeToWriteMatch.index + timeToWriteMatch[0].length);
  }

  const finalMarkerMatch = text.match(/Final answer[^\n]*\n+/i);
  if (finalMarkerMatch && finalMarkerMatch.index !== undefined) {
    text = text.slice(finalMarkerMatch.index + finalMarkerMatch[0].length);
  }

  // 6. Remove stream-of-consciousness thought preambles
  const thoughtPreambleMatch = text.match(
    /^(?:We are given|We are to|We are in|The user is asking|The user asked|The user wants|The user said|The critical instructions say|Let me re-read|Let me check|Let me analyze|Let me think|Let's see|Let's think|Hmm|Okay|Alright|First, let's|First, I need to)[\s\S]*?(?=(?:\n\s*|\.\s+)(?:#{1,6}\s|[-*]{3,}|[*_]{1,3}|["'“”‘]|[-*•]\s|\d+\.\s|Here[’']s|Hello|Hi|Hey|Skill Swap|Certainly|Sure|[A-Za-z0-9]))/i
  );
  if (thoughtPreambleMatch) {
    text = text.slice(thoughtPreambleMatch[0].length);
  } else if (/^(?:We are given|We are to|We are in|The user is asking|The user asked|The user wants|The user said|The critical instructions say|Let me re-read|Let me check|Let me analyze|Let me think|Let's see|Let's think)/i.test(text)) {
    const paragraphs = text.split(/\n\s*\n/);
    if (paragraphs.length > 1) {
      const remaining = paragraphs
        .filter((p) => !/^(?:We are given|We are to|We are in|The user is asking|The user asked|The user wants|The user said|The critical instructions say|Let me re-read|Let me check|Let me analyze|Let me think|Let's see|Let's think)/i.test(p.trim()))
        .join("\n\n");
      if (remaining.trim()) {
        text = remaining;
      }
    }
  }

  // 7. Strip meta-narrative reasoning prefixes
  text = text.replace(/^(?:In this response|I will now answer|I should now|My goal is to|As requested, here)[^.\n]*[.\n]\s*/i, "");

  // 8. Clean any stray brainstorming asterisk notes
  text = text.replace(/\*(?:Brainstorming|mental note|Lightbulb|checks mental list|self-reminder|finally|Final check)[^*]*\*/gi, "");

  return text.trim();
}

export interface LocalAIChatHistoryItem {
  role: "user" | "assistant";
  content: string;
}

export interface LocalAIProjectContext {
  title?: string;
  domain?: string;
  type?: string;
  story_premise?: string;
  budget?: string;
  team_size?: string | number;
  roles?: string[];
  [key: string]: any;
}

/**
 * Sends a chat message to POST http://127.0.0.1:8001/chat
 *
 * Supports both progressive SSE streaming (when options.onToken or onToken callback is provided)
 * and standard non-streaming JSON responses.
 *
 * Payload: {"message": "user message", "history": [...], "project_context": {...}, "stream": boolean, "num_predict": number}
 * Response: {"success": true, "model": "qwen3:4b", "provider": "local-ollama", "answer": "...", "metrics": {...}}
 */
export async function sendLocalAIChatMessage(
  message: string,
  historyOrOptions?: LocalAIChatHistoryItem[] | number | SendChatOptions,
  projectContext?: LocalAIProjectContext,
  timeoutMs: number = 120000,
  onTokenCallback?: (token: string, accumulated: string) => void
): Promise<LocalAIChatResponse> {
  const trimmed = message.trim();
  if (!trimmed) {
    throw new Error("Message cannot be empty.");
  }

  let history: LocalAIChatHistoryItem[] | undefined;
  let effectiveContext = projectContext;
  let effectiveTimeout = timeoutMs;
  let numPredict: number | undefined;
  let onToken = onTokenCallback;

  if (typeof historyOrOptions === "number") {
    effectiveTimeout = historyOrOptions;
  } else if (Array.isArray(historyOrOptions)) {
    history = historyOrOptions;
  } else if (historyOrOptions && typeof historyOrOptions === "object") {
    const opts = historyOrOptions as SendChatOptions;
    history = opts.history;
    if (opts.projectContext) effectiveContext = opts.projectContext;
    if (typeof opts.timeoutMs === "number") effectiveTimeout = opts.timeoutMs;
    if (typeof opts.numPredict === "number") numPredict = opts.numPredict;
    if (opts.onToken) onToken = opts.onToken;
  }

  const isStreaming = typeof onToken === "function";
  const controller = new AbortController();
  const safeTimeout = typeof effectiveTimeout === "number" && !isNaN(effectiveTimeout) && effectiveTimeout > 0 ? effectiveTimeout : 120000;
  const timer = setTimeout(() => controller.abort(), safeTimeout);

  try {
    const payload: {
      message: string;
      history?: LocalAIChatHistoryItem[];
      project_context?: LocalAIProjectContext;
      stream: boolean;
      num_predict?: number;
    } = {
      message: trimmed,
      stream: isStreaming,
    };

    if (history && history.length > 0) {
      payload.history = history;
    }

    if (effectiveContext && Object.keys(effectiveContext).length > 0) {
      payload.project_context = effectiveContext;
    }

    if (typeof numPredict === "number") {
      payload.num_predict = numPredict;
    }

    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.log("[LocalAI Diagnostics] Pre-fetch init:", {
        url: `${LOCAL_AI_BASE_URL}/chat`,
        stage: "init",
        stream: isStreaming,
        messageLength: trimmed.length,
        hasHistory: Boolean(history && history.length > 0),
        historyCount: history ? history.length : 0,
        hasContext: Boolean(effectiveContext && Object.keys(effectiveContext).length > 0),
        timeoutMs: safeTimeout,
      });
    }

    const res = await fetch(`${LOCAL_AI_BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: isStreaming ? "text/event-stream, application/json" : "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.log("[LocalAI Diagnostics] Post-fetch response received:", {
        url: `${LOCAL_AI_BASE_URL}/chat`,
        stage: "response",
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        contentType: res.headers.get("content-type"),
        corsOrigin: res.headers.get("access-control-allow-origin"),
      });
    }

    if (!res.ok) {
      clearTimeout(timer);
      let errorDetail = `HTTP ${res.status}: Server responded with status ${res.status}`;
      try {
        const errJson = await res.json();
        if (errJson.detail) {
          errorDetail =
            typeof errJson.detail === "string"
              ? errJson.detail
              : errJson.detail.message || JSON.stringify(errJson.detail);
        }
      } catch {
        const text = await res.text();
        if (text) errorDetail = `HTTP ${res.status}: ${text}`;
      }
      throw new Error(`[HTTPError ${res.status}] ${errorDetail}`);
    }

    // Handle progressive streaming
    if (isStreaming && res.body) {
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      let accumulatedText = "";
      let finalModel = "qwen3:4b";
      let finalProvider = "local-ollama";
      let finalIntent: UserIntent | undefined;
      let finalProjectAction: ProjectActionType | undefined;
      let finalMatchingAction: MatchingActionType | undefined;
      let finalProjectData: any | undefined;
      let finalSuggestedRoles: SuggestedRole[] | undefined;
      let metrics: LocalAIChatResponse["metrics"] | undefined;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine.startsWith("data: ")) continue;
            const jsonStr = trimmedLine.slice(6).trim();
            if (!jsonStr) continue;

            let event: any;
            try {
              event = JSON.parse(jsonStr);
            } catch (parseErr: any) {
              console.warn("[LocalAI Diagnostics] SSE chunk parse warning:", parseErr.message);
              continue;
            }

            if (event.error) {
              throw new Error(`[BackendStreamError] ${event.error}`);
            }
            if (event.token) {
              const cleanedAccumulated = cleanAiResponseText(event.accumulated || accumulatedText + event.token);
              if (cleanedAccumulated) {
                accumulatedText = cleanedAccumulated;
                if (onToken) {
                  onToken(event.token, cleanedAccumulated);
                }
              }
            }
            if (event.done) {
              if (event.response) {
                accumulatedText = cleanAiResponseText(event.response);
              } else if (event.answer) {
                accumulatedText = cleanAiResponseText(event.answer);
              }
              if (event.intent) finalIntent = event.intent;
              if (event.project_action) finalProjectAction = event.project_action;
              if (event.matching_action) finalMatchingAction = event.matching_action;
              if (event.project_data) finalProjectData = event.project_data;
              if (event.suggested_roles) finalSuggestedRoles = event.suggested_roles;
              if (event.metrics) {
                metrics = event.metrics;
              }
              if (event.model) finalModel = event.model;
              if (event.provider) finalProvider = event.provider;
            }
          }
        }
      } finally {
        reader.releaseLock();
        clearTimeout(timer);
      }

      let cleanedAnswer = cleanAiResponseText(accumulatedText).trim();

      // If streaming yielded no usable answer, attempt a bounded non-streaming fallback
      if (!cleanedAnswer) {
        console.warn("[LocalAI] Streaming produced no text. Attempting non-streaming fallback...");
        try {
          const fbRes = await fetch(`${LOCAL_AI_BASE_URL}/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({ ...payload, stream: false }),
          });
          if (fbRes.ok) {
            const fbData = await fbRes.json();
            const fbText = cleanAiResponseText(fbData.response || fbData.answer || "").trim();
            if (fbText) {
              cleanedAnswer = fbText;
              if (fbData.intent) finalIntent = fbData.intent;
              if (fbData.project_action) finalProjectAction = fbData.project_action;
              if (fbData.matching_action) finalMatchingAction = fbData.matching_action;
              if (fbData.project_data) finalProjectData = fbData.project_data;
              if (fbData.suggested_roles) finalSuggestedRoles = fbData.suggested_roles;
              if (fbData.metrics) metrics = fbData.metrics;
            }
          }
        } catch (fbErr: any) {
          console.warn("[LocalAI] Non-streaming fallback error:", fbErr?.message);
        }
      }

      if (!cleanedAnswer) {
        throw new Error(
          "Local AI produced an empty response. Please verify that Ollama is responding and click Retry."
        );
      }

      return {
        success: true,
        intent: finalIntent,
        project_action: finalProjectAction,
        matching_action: finalMatchingAction,
        project_data: finalProjectData,
        model: finalModel,
        provider: finalProvider,
        answer: cleanedAnswer,
        response: cleanedAnswer,
        suggested_roles: finalSuggestedRoles,
        metrics,
      };
    }

    // Standard JSON response
    clearTimeout(timer);
    let data: any;
    try {
      data = await res.json();
    } catch (parseErr: any) {
      throw new Error(`[JSONParseError] Failed to parse backend JSON response: ${parseErr.message}`);
    }

    const rawAnswer = data.response || data.answer || "";
    const cleanedAnswer = cleanAiResponseText(rawAnswer).trim();

    if (!data.success && !cleanedAnswer) {
      throw new Error(`[AIResponseError] ${data.detail || data.error || "Local AI did not return a valid response."}`);
    }

    if (!cleanedAnswer) {
      throw new Error(
        "Local AI produced an empty response. Please verify that Ollama is responding and click Retry."
      );
    }

    return {
      success: true,
      intent: data.intent,
      project_action: data.project_action,
      matching_action: data.matching_action,
      project_data: data.project_data,
      model: data.model || "qwen3:4b",
      provider: data.provider || "local-ollama",
      answer: cleanedAnswer,
      response: cleanedAnswer,
      suggested_roles: data.suggested_roles,
      metrics: data.metrics,
    };
  } catch (err: any) {
    clearTimeout(timer);

    if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
      console.error("[LocalAI Diagnostics] Chat request failed:", {
        url: `${LOCAL_AI_BASE_URL}/chat`,
        errorName: err?.name,
        errorMessage: err?.message,
      });
    }

    if (err.name === "AbortError") {
      const timeoutSec = Math.round(safeTimeout / 1000);
      throw new Error(
        `Request timed out after ${timeoutSec}s. The local AI took too long to generate a response. Click Retry to try again.`
      );
    }

    // Specific network failure
    if (err instanceof TypeError && err.message && err.message.includes("Failed to fetch")) {
      throw new Error(
        `Network error: Failed to fetch from ${LOCAL_AI_BASE_URL}/chat. Check that the FastAPI server is running at ${LOCAL_AI_BASE_URL} and Private Network Access / CORS is allowed.`
      );
    }

    throw err;
  }
}

/**
 * Browser-accessible connection test helper for diagnostics.
 * Call from console via: window.__testLocalAIConnection()
 */
export async function testLocalAIConnection(): Promise<{
  health: any;
  chatOptionsPreflight: any;
  chatPost: any;
}> {
  console.log("=== [LocalAI Diagnostic Test Starting] ===");
  const results: any = {};

  // 1. Health check
  try {
    console.log("[Test 1/3] Testing GET /health ...");
    const hRes = await fetch(`${LOCAL_AI_BASE_URL}/health`);
    results.health = {
      status: hRes.status,
      ok: hRes.ok,
      data: await hRes.json(),
    };
    console.log("[Test 1/3 Passed] Health result:", results.health);
  } catch (err: any) {
    results.health = { error: err.name, message: err.message };
    console.error("[Test 1/3 Failed] Health error:", results.health);
  }

  // 2. OPTIONS preflight check
  try {
    console.log("[Test 2/3] Testing OPTIONS /chat preflight ...");
    const oRes = await fetch(`${LOCAL_AI_BASE_URL}/chat`, {
      method: "OPTIONS",
      headers: {
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
      },
    });
    results.chatOptionsPreflight = {
      status: oRes.status,
      ok: oRes.ok,
      allowOrigin: oRes.headers.get("access-control-allow-origin"),
      allowMethods: oRes.headers.get("access-control-allow-methods"),
      allowPNA: oRes.headers.get("access-control-allow-private-network"),
    };
    console.log("[Test 2/3 Passed] Preflight result:", results.chatOptionsPreflight);
  } catch (err: any) {
    results.chatOptionsPreflight = { error: err.name, message: err.message };
    console.error("[Test 2/3 Failed] Preflight error:", results.chatOptionsPreflight);
  }

  // 3. Streaming chat test
  try {
    console.log("[Test 3/3] Testing POST /chat with streaming ...");
    let tokenCount = 0;
    const chatRes = await sendLocalAIChatMessage(
      "Ping from browser diagnostic test.",
      undefined,
      undefined,
      15000,
      (token) => {
        tokenCount++;
      }
    );
    results.chatPost = {
      success: true,
      answerLength: chatRes.answer.length,
      answerPreview: chatRes.answer.slice(0, 100),
      tokenCount,
      metrics: chatRes.metrics,
    };
    console.log("[Test 3/3 Passed] Chat result:", results.chatPost);
  } catch (err: any) {
    results.chatPost = { error: err.name, message: err.message };
    console.error("[Test 3/3 Failed] Chat error:", results.chatPost);
  }

  console.log("=== [LocalAI Diagnostic Test Summary] ===", results);
  return results;
}

// Register global helper in browser window
if (typeof window !== "undefined") {
  (window as any).__testLocalAIConnection = testLocalAIConnection;
}
