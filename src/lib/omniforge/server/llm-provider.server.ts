import { getServerConfig, ServerConfig } from "../../config.server";

export type LLMProviderName = "ollama" | "groq" | "openai" | "gemini" | "anthropic" | "openrouter" | "none";

export interface LLMMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: LLMToolCall[];
}

export interface LLMToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
      enum?: string[];
      items?: { type: string };
    }>;
    required?: string[];
  };
}

export interface LLMToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface LLMExecutionResult {
  success: boolean;
  text: string;
  toolCalls?: LLMToolCall[];
  provider: LLMProviderName;
  model: string;
  tokensUsed?: number;
  latencyMs: number;
  error?: string;
}

/**
 * Strips API keys, Bearer tokens, and secrets from error messages before logging or returning.
 */
export function sanitizeErrorMessage(raw: string): string {
  if (!raw) return "Unknown provider error";
  return raw
    .replace(/Bearer\s+[A-Za-z0-9_\-\.]+/gi, "Bearer [REDACTED]")
    .replace(/gsk_[A-Za-z0-9]+/gi, "gsk_[REDACTED]")
    .replace(/sk-[A-Za-z0-9]+/gi, "sk-[REDACTED]")
    .replace(/key=[A-Za-z0-9_\-]+/gi, "key=[REDACTED]");
}

/**
 * Cleans thinking delimiters (<think>...</think>) from Qwen/reasoning models.
 */
export function cleanThinkingTags(raw: string): string {
  if (!raw) return "";
  return raw
    .replace(/<(?:think|thought|reasoning|deliberation)>[\s\S]*?<\/\1>/gi, "")
    .replace(/\[(?:think|thought|reasoning|deliberation)\][\s\S]*?\[\/\1\]/gi, "")
    .trim();
}

/**
 * Detects the active LLM provider based on available environment variables.
 * Ollama is the primary/default provider for OmniForge AI.
 */
export function getActiveLLMProvider(config: ServerConfig): {
  provider: LLMProviderName;
  model: string;
  apiKey?: string;
  baseUrl?: string;
} {
  // 1. Primary intended provider: Ollama
  if (config.ollamaBaseUrl) {
    return {
      provider: "ollama",
      model: config.ollamaModel || "qwen3:4b",
      baseUrl: config.ollamaBaseUrl,
    };
  }

  // 2. Secondary fallback options if configured
  if (config.groqApiKey) {
    return {
      provider: "groq",
      model: config.groqModel || "qwen/qwen3.8-27b",
      apiKey: config.groqApiKey,
      baseUrl: "https://api.groq.com/openai/v1",
    };
  }

  if (config.openaiApiKey) {
    return {
      provider: "openai",
      model: config.openaiModel || "gpt-4o-mini",
      apiKey: config.openaiApiKey,
      baseUrl: config.openaiBaseUrl || "https://api.openai.com/v1",
    };
  }

  if (config.geminiApiKey) {
    return {
      provider: "gemini",
      model: config.geminiModel || "gemini-2.0-flash",
      apiKey: config.geminiApiKey,
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    };
  }

  if (config.openRouterApiKey) {
    return {
      provider: "openrouter",
      model: config.openRouterModel || "meta-llama/llama-3.3-70b-instruct",
      apiKey: config.openRouterApiKey,
      baseUrl: "https://openrouter.ai/api/v1",
    };
  }

  if (config.anthropicApiKey) {
    return {
      provider: "anthropic",
      model: config.anthropicModel || "claude-3-5-sonnet-20241022",
      apiKey: config.anthropicApiKey,
      baseUrl: "https://api.anthropic.com/v1",
    };
  }

  // Default to Ollama unconfigured status
  return {
    provider: "ollama",
    model: config.ollamaModel || "qwen3:4b",
  };
}

/**
 * Checks the reachability and model availability of an Ollama server instance.
 */
export async function checkOllamaHealth(
  baseUrl: string,
  modelName: string,
  timeoutMs: number = 3500
): Promise<{
  connected: boolean;
  modelAvailable: boolean;
  status: "running" | "degraded" | "offline";
  statusMessage: string;
  modelsFound?: string[];
  latencyMs: number;
}> {
  const startTime = Date.now();
  if (!baseUrl) {
    return {
      connected: false,
      modelAvailable: false,
      status: "offline",
      statusMessage: "OLLAMA_BASE_URL is not configured in server environment.",
      latencyMs: 0,
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return {
        connected: false,
        modelAvailable: false,
        status: "offline",
        statusMessage: `Ollama returned HTTP ${res.status} from ${baseUrl}/api/tags.`,
        latencyMs: Date.now() - startTime,
      };
    }

    const data: any = await res.json().catch(() => ({}));
    const tagModels: string[] = Array.isArray(data?.models)
      ? data.models.map((m: any) => m.name || m.model || "")
      : [];

    const normalizedTarget = modelName.toLowerCase();
    const hasModel = tagModels.some((m) => {
      const lower = m.toLowerCase();
      return (
        lower === normalizedTarget ||
        lower === `${normalizedTarget}:latest` ||
        lower.startsWith(`${normalizedTarget}:`) ||
        normalizedTarget.startsWith(`${lower}:`)
      );
    });

    if (hasModel) {
      return {
        connected: true,
        modelAvailable: true,
        status: "running",
        statusMessage: `Ollama service active at ${baseUrl} with model '${modelName}'.`,
        modelsFound: tagModels,
        latencyMs: Date.now() - startTime,
      };
    }

    return {
      connected: true,
      modelAvailable: false,
      status: "degraded",
      statusMessage: `Ollama service reachable, but target model '${modelName}' is not loaded. Available models: [${tagModels.join(", ") || "none"}]. Run: 'ollama pull ${modelName}'`,
      modelsFound: tagModels,
      latencyMs: Date.now() - startTime,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const detail = err.name === "AbortError" ? `timed out after ${timeoutMs}ms` : (err.message || String(err));
    return {
      connected: false,
      modelAvailable: false,
      status: "offline",
      statusMessage: `Cannot connect to Ollama at ${baseUrl} (${detail}). Ensure Ollama is running and accessible.`,
      latencyMs: Date.now() - startTime,
    };
  }
}

/**
 * Executes a chat completion request to the active LLM provider.
 */
export async function executeLLMChatCompletion(params: {
  messages: LLMMessage[];
  tools?: LLMToolDefinition[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<LLMExecutionResult> {
  const config = getServerConfig();
  const active = getActiveLLMProvider(config);
  const startTime = Date.now();
  const timeoutMs = params.timeoutMs || 45000;

  const isConfigured =
    active.provider === "ollama"
      ? Boolean(active.baseUrl)
      : active.provider !== "none" && Boolean(active.apiKey);

  if (!isConfigured) {
    return {
      success: false,
      text: "",
      provider: active.provider,
      model: active.model,
      latencyMs: Date.now() - startTime,
      error: active.provider === "ollama" ? "NO_OLLAMA_BASE_URL_CONFIGURED" : "NO_LLM_KEY_CONFIGURED",
    };
  }

  try {
    if (active.provider === "ollama") {
      return await callOllamaChat(active, params, startTime, timeoutMs);
    }

    if (active.provider === "openai" || active.provider === "groq" || active.provider === "openrouter") {
      return await callOpenAICompatible(active, params, startTime, timeoutMs);
    }

    if (active.provider === "gemini") {
      return await callGeminiAPI(active, params, startTime, timeoutMs);
    }

    if (active.provider === "anthropic") {
      return await callAnthropicAPI(active, params, startTime, timeoutMs);
    }

    return {
      success: false,
      text: "",
      provider: active.provider,
      model: active.model,
      latencyMs: Date.now() - startTime,
      error: `Unsupported provider: ${active.provider}`,
    };
  } catch (err: any) {
    const sanitized = sanitizeErrorMessage(err.message || String(err));
    console.error(`[LLM Provider ${active.provider}] Error:`, sanitized);
    return {
      success: false,
      text: "",
      provider: active.provider,
      model: active.model,
      latencyMs: Date.now() - startTime,
      error: err.name === "AbortError" ? "TIMEOUT" : sanitized,
    };
  }
}

/**
 * Ollama native /api/chat non-streaming completion.
 */
async function callOllamaChat(
  active: { provider: LLMProviderName; model: string; baseUrl?: string },
  params: { messages: LLMMessage[]; tools?: LLMToolDefinition[]; temperature?: number; maxTokens?: number },
  startTime: number,
  timeoutMs: number
): Promise<LLMExecutionResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const formattedMessages = params.messages.map((m) => {
      if (m.role === "tool") {
        return {
          role: "tool",
          content: m.content,
        };
      }
      if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
        return {
          role: "assistant",
          content: m.content || "",
          tool_calls: m.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function",
            function: {
              name: tc.name,
              arguments: tc.arguments,
            },
          })),
        };
      }
      return {
        role: m.role,
        content: m.content,
      };
    });

    const payload: any = {
      model: active.model,
      messages: formattedMessages,
      stream: false,
      options: {
        temperature: params.temperature ?? 0.4,
        num_predict: params.maxTokens ?? 2048,
      },
    };

    if (params.tools && params.tools.length > 0) {
      payload.tools = params.tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
    }

    const res = await fetch(`${active.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let sanitized = "";
      try {
        const json = JSON.parse(errText);
        sanitized = json?.error || errText;
      } catch {
        sanitized = errText;
      }
      sanitized = sanitizeErrorMessage(sanitized);
      return {
        success: false,
        text: "",
        provider: active.provider,
        model: active.model,
        latencyMs: Date.now() - startTime,
        error: `HTTP ${res.status}: ${sanitized.slice(0, 300)}`,
      };
    }

    const data: any = await res.json();
    const msg = data.message;
    let text = msg?.content || "";
    text = cleanThinkingTags(text);

    const toolCalls: LLMToolCall[] = [];
    if (msg?.tool_calls && Array.isArray(msg.tool_calls)) {
      for (const tc of msg.tool_calls) {
        let parsedArgs = {};
        if (typeof tc.function?.arguments === "object" && tc.function.arguments !== null) {
          parsedArgs = tc.function.arguments;
        } else if (typeof tc.function?.arguments === "string") {
          try {
            parsedArgs = JSON.parse(tc.function.arguments);
          } catch {
            parsedArgs = {};
          }
        }
        toolCalls.push({
          id: tc.id || `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: tc.function?.name || "",
          arguments: parsedArgs,
        });
      }
    }

    const tokensUsed = (data.prompt_eval_count || 0) + (data.eval_count || 0);

    return {
      success: true,
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      provider: active.provider,
      model: data.model || active.model,
      tokensUsed: tokensUsed || undefined,
      latencyMs: Date.now() - startTime,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Ollama native /api/chat streaming completion.
 */
async function callOllamaChatStream(
  active: { provider: LLMProviderName; model: string; baseUrl?: string },
  params: {
    messages: LLMMessage[];
    temperature?: number;
    maxTokens?: number;
    onDelta: (delta: string, accumulated: string) => void;
    signal?: AbortSignal;
  },
  startTime: number,
  timeoutMs: number
): Promise<LLMExecutionResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (params.signal) {
    if (params.signal.aborted) {
      controller.abort();
    } else {
      params.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    const formattedMessages = params.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const payload: any = {
      model: active.model,
      messages: formattedMessages,
      stream: true,
      options: {
        temperature: params.temperature ?? 0.4,
        num_predict: params.maxTokens ?? 2048,
      },
    };

    const res = await fetch(`${active.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      let sanitized = "";
      try {
        const json = JSON.parse(errText);
        sanitized = json?.error || errText;
      } catch {
        sanitized = errText;
      }
      sanitized = sanitizeErrorMessage(sanitized);
      return {
        success: false,
        text: "",
        provider: active.provider,
        model: active.model,
        latencyMs: Date.now() - startTime,
        error: `HTTP ${res.status}: ${sanitized.slice(0, 300)}`,
      };
    }

    if (!res.body) {
      return {
        success: false,
        text: "",
        provider: active.provider,
        model: active.model,
        latencyMs: Date.now() - startTime,
        error: "NO_STREAM_BODY",
      };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let accumulated = "";
    let finalModel = active.model;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;

          try {
            const parsed = JSON.parse(trimmed);
            if (parsed.model) {
              finalModel = parsed.model;
            }
            const delta = parsed.message?.content || "";
            if (delta) {
              accumulated += delta;
              params.onDelta(delta, accumulated);
            }
          } catch {
            // Ignore partial NDJSON parse errors
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      success: true,
      text: accumulated,
      provider: active.provider,
      model: finalModel,
      latencyMs: Date.now() - startTime,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Executes a streaming chat completion request to the active LLM provider.
 */
export async function executeLLMStreamingChatCompletion(params: {
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  onDelta: (delta: string, accumulated: string) => void;
  signal?: AbortSignal;
}): Promise<LLMExecutionResult> {
  const config = getServerConfig();
  const active = getActiveLLMProvider(config);
  const startTime = Date.now();
  const timeoutMs = params.timeoutMs || 60000;

  const isConfigured =
    active.provider === "ollama"
      ? Boolean(active.baseUrl)
      : active.provider !== "none" && Boolean(active.apiKey);

  if (!isConfigured) {
    return {
      success: false,
      text: "",
      provider: active.provider,
      model: active.model,
      latencyMs: Date.now() - startTime,
      error: active.provider === "ollama" ? "NO_OLLAMA_BASE_URL_CONFIGURED" : "NO_LLM_KEY_CONFIGURED",
    };
  }

  try {
    if (active.provider === "ollama") {
      return await callOllamaChatStream(active, params, startTime, timeoutMs);
    }

    if (active.provider === "openai" || active.provider === "groq" || active.provider === "openrouter") {
      return await callOpenAICompatibleStream(active, params, startTime, timeoutMs);
    }

    // For gemini/anthropic, execute completion and deliver as a single delta
    const result = await executeLLMChatCompletion(params);
    if (result.success && result.text) {
      params.onDelta(result.text, result.text);
    }
    return result;
  } catch (err: any) {
    const sanitized = sanitizeErrorMessage(err.message || String(err));
    console.error(`[LLM Provider ${active.provider} Stream] Error:`, sanitized);
    return {
      success: false,
      text: "",
      provider: active.provider,
      model: active.model,
      latencyMs: Date.now() - startTime,
      error: err.name === "AbortError" ? "TIMEOUT" : sanitized,
    };
  }
}

/**
 * OpenAI, Groq, and OpenRouter compatible chat endpoint.
 */
async function callOpenAICompatible(
  active: { provider: any; model: string; apiKey?: string; baseUrl?: string },
  params: { messages: LLMMessage[]; tools?: LLMToolDefinition[]; temperature?: number; maxTokens?: number },
  startTime: number,
  timeoutMs: number
): Promise<LLMExecutionResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const payload: any = {
      model: active.model,
      messages: params.messages.map((m) => {
        if (m.role === "tool") {
          return {
            role: "tool",
            content: m.content,
            tool_call_id: m.toolCallId,
          };
        }
        if (m.role === "assistant" && m.toolCalls && m.toolCalls.length > 0) {
          return {
            role: "assistant",
            content: m.content || null,
            tool_calls: m.toolCalls.map((tc) => ({
              id: tc.id,
              type: "function",
              function: {
                name: tc.name,
                arguments: typeof tc.arguments === "string" ? tc.arguments : JSON.stringify(tc.arguments || {}),
              },
            })),
          };
        }
        return {
          role: m.role,
          content: m.content,
          name: m.name,
        };
      }),
      temperature: params.temperature ?? 0.4,
      max_tokens: params.maxTokens ?? 2048,
    };

    if (params.tools && params.tools.length > 0) {
      payload.tools = params.tools.map((t) => ({
        type: "function",
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        },
      }));
      payload.tool_choice = "auto";
    }

    const res = await fetch(`${active.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${active.apiKey}`,
        ...(active.provider === "openrouter" ? { "HTTP-Referer": "https://omnicraft.dev", "X-Title": "OmniForge" } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      let sanitized = "";
      try {
        const json = JSON.parse(errText);
        sanitized = json?.error?.message || errText;
      } catch {
        sanitized = errText;
      }
      sanitized = sanitizeErrorMessage(sanitized);
      return {
        success: false,
        text: "",
        provider: active.provider,
        model: active.model,
        latencyMs: Date.now() - startTime,
        error: `HTTP ${res.status}: ${sanitized.slice(0, 300)}`,
      };
    }

    const data: any = await res.json();
    const choice = data.choices?.[0];
    const message = choice?.message;
    const text = message?.content || "";
    const toolCalls: LLMToolCall[] = [];

    if (message?.tool_calls && Array.isArray(message.tool_calls)) {
      for (const tc of message.tool_calls) {
        let parsedArgs = {};
        try {
          parsedArgs = typeof tc.function.arguments === "string" ? JSON.parse(tc.function.arguments || "{}") : (tc.function.arguments || {});
        } catch {
          parsedArgs = {};
        }
        toolCalls.push({
          id: tc.id,
          name: tc.function.name,
          arguments: parsedArgs,
        });
      }
    }

    return {
      success: true,
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      provider: active.provider,
      model: data.model || active.model,
      tokensUsed: data.usage?.total_tokens,
      latencyMs: Date.now() - startTime,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * OpenAI, Groq, and OpenRouter streaming chat completion.
 */
async function callOpenAICompatibleStream(
  active: { provider: any; model: string; apiKey?: string; baseUrl?: string },
  params: {
    messages: LLMMessage[];
    temperature?: number;
    maxTokens?: number;
    onDelta: (delta: string, accumulated: string) => void;
    signal?: AbortSignal;
  },
  startTime: number,
  timeoutMs: number
): Promise<LLMExecutionResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  if (params.signal) {
    if (params.signal.aborted) {
      controller.abort();
    } else {
      params.signal.addEventListener("abort", () => controller.abort(), { once: true });
    }
  }

  try {
    const payload: any = {
      model: active.model,
      messages: params.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      temperature: params.temperature ?? 0.4,
      max_tokens: params.maxTokens ?? 2048,
      stream: true,
    };

    const res = await fetch(`${active.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${active.apiKey}`,
        ...(active.provider === "openrouter" ? { "HTTP-Referer": "https://omnicraft.dev", "X-Title": "OmniForge" } : {}),
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      let sanitized = "";
      try {
        const json = JSON.parse(errText);
        sanitized = json?.error?.message || errText;
      } catch {
        sanitized = errText;
      }
      sanitized = sanitizeErrorMessage(sanitized);
      return {
        success: false,
        text: "",
        provider: active.provider,
        model: active.model,
        latencyMs: Date.now() - startTime,
        error: `HTTP ${res.status}: ${sanitized.slice(0, 300)}`,
      };
    }

    if (!res.body) {
      return {
        success: false,
        text: "",
        provider: active.provider,
        model: active.model,
        latencyMs: Date.now() - startTime,
        error: "NO_STREAM_BODY",
      };
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let accumulated = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const dataStr = trimmed.slice(5).trim();
          if (!dataStr || dataStr === "[DONE]") continue;

          try {
            const parsed = JSON.parse(dataStr);
            const delta = parsed.choices?.[0]?.delta?.content || "";
            if (delta) {
              accumulated += delta;
              params.onDelta(delta, accumulated);
            }
          } catch {
            // Ignore partial SSE chunk parse error
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      success: true,
      text: accumulated,
      provider: active.provider,
      model: active.model,
      latencyMs: Date.now() - startTime,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Google Gemini API adapter.
 */
async function callGeminiAPI(
  active: { provider: any; model: string; apiKey?: string; baseUrl?: string },
  params: { messages: LLMMessage[]; tools?: LLMToolDefinition[]; temperature?: number; maxTokens?: number },
  startTime: number,
  timeoutMs: number
): Promise<LLMExecutionResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const contents: any[] = [];
    let systemInstruction = "";

    for (const m of params.messages) {
      if (m.role === "system") {
        systemInstruction += m.content + "\n";
      } else {
        contents.push({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        });
      }
    }

    const payload: any = {
      contents,
      generationConfig: {
        temperature: params.temperature ?? 0.4,
        maxOutputTokens: params.maxTokens ?? 2048,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = {
        parts: [{ text: systemInstruction.trim() }],
      };
    }

    if (params.tools && params.tools.length > 0) {
      payload.tools = [
        {
          functionDeclarations: params.tools.map((t) => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters,
          })),
        },
      ];
    }

    const url = `${active.baseUrl}/models/${active.model}:generateContent?key=${active.apiKey}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        text: "",
        provider: "gemini",
        model: active.model,
        latencyMs: Date.now() - startTime,
        error: `HTTP ${res.status}: ${errText.slice(0, 300)}`,
      };
    }

    const data: any = await res.json();
    const candidate = data.candidates?.[0];
    const parts = candidate?.content?.parts || [];
    let text = "";
    const toolCalls: LLMToolCall[] = [];

    for (const part of parts) {
      if (part.text) {
        text += part.text;
      }
      if (part.functionCall) {
        toolCalls.push({
          id: `call_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: part.functionCall.name,
          arguments: part.functionCall.args || {},
        });
      }
    }

    return {
      success: true,
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      provider: "gemini",
      model: active.model,
      tokensUsed: data.usageMetadata?.totalTokenCount,
      latencyMs: Date.now() - startTime,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Anthropic Messages API adapter.
 */
async function callAnthropicAPI(
  active: { provider: any; model: string; apiKey?: string; baseUrl?: string },
  params: { messages: LLMMessage[]; tools?: LLMToolDefinition[]; temperature?: number; maxTokens?: number },
  startTime: number,
  timeoutMs: number
): Promise<LLMExecutionResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let systemPrompt = "";
    const anthropicMessages: any[] = [];

    for (const m of params.messages) {
      if (m.role === "system") {
        systemPrompt += m.content + "\n";
      } else {
        anthropicMessages.push({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.content,
        });
      }
    }

    const payload: any = {
      model: active.model,
      messages: anthropicMessages,
      max_tokens: params.maxTokens ?? 2048,
      temperature: params.temperature ?? 0.4,
    };

    if (systemPrompt) {
      payload.system = systemPrompt.trim();
    }

    if (params.tools && params.tools.length > 0) {
      payload.tools = params.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.parameters,
      }));
    }

    const res = await fetch(`${active.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": active.apiKey!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text();
      return {
        success: false,
        text: "",
        provider: "anthropic",
        model: active.model,
        latencyMs: Date.now() - startTime,
        error: `HTTP ${res.status}: ${errText.slice(0, 300)}`,
      };
    }

    const data: any = await res.json();
    let text = "";
    const toolCalls: LLMToolCall[] = [];

    for (const item of data.content || []) {
      if (item.type === "text") {
        text += item.text;
      } else if (item.type === "tool_use") {
        toolCalls.push({
          id: item.id,
          name: item.name,
          arguments: item.input || {},
        });
      }
    }

    return {
      success: true,
      text,
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      provider: "anthropic",
      model: data.model || active.model,
      tokensUsed: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0),
      latencyMs: Date.now() - startTime,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Server-only helper to inspect current LLM provider configuration status
 * without exposing API keys or secrets to the client.
 */
export function inspectLLMProviderConfiguration(): {
  provider: LLMProviderName;
  model: string;
  hasKey: boolean;
  baseUrl?: string;
  status: "no_provider" | "configured_untested" | "running";
  statusMessage: string;
} {
  const cfg = getServerConfig();
  const active = getActiveLLMProvider(cfg);

  if (active.provider === "ollama") {
    const isConfigured = Boolean(active.baseUrl);
    return {
      provider: "ollama",
      model: active.model,
      hasKey: isConfigured,
      baseUrl: active.baseUrl,
      status: isConfigured ? "configured_untested" : "no_provider",
      statusMessage: isConfigured
        ? `Ollama inference provider configured for model '${active.model}' at '${active.baseUrl}'.`
        : "OLLAMA_BASE_URL is not configured in server environment. Please set OLLAMA_BASE_URL (and optionally OLLAMA_MODEL).",
    };
  }

  const hasKey = active.provider !== "none" && Boolean(active.apiKey);
  return {
    provider: active.provider,
    model: active.model,
    hasKey,
    baseUrl: active.baseUrl,
    status: hasKey ? "configured_untested" : "no_provider",
    statusMessage: hasKey
      ? `External provider ${active.provider} (${active.model}) configured in environment. Ready for live request.`
      : "No external LLM provider configured.",
  };
}
