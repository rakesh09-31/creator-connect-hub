import { getServerConfig, ServerConfig } from "../../config.server";

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
  provider: "openai" | "groq" | "gemini" | "anthropic" | "openrouter" | "none";
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
 * Detects the active LLM provider based on available environment variables.
 */
export function getActiveLLMProvider(config: ServerConfig): {
  provider: "groq" | "openai" | "gemini" | "anthropic" | "openrouter" | "none";
  model: string;
  apiKey?: string;
  baseUrl?: string;
} {
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

  return {
    provider: "none",
    model: "none",
  };
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
  const timeoutMs = params.timeoutMs || 25000;

  if (active.provider === "none" || !active.apiKey) {
    return {
      success: false,
      text: "",
      provider: "none",
      model: "none",
      latencyMs: Date.now() - startTime,
      error: "NO_LLM_KEY_CONFIGURED",
    };
  }

  try {
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

    // Function declarations for Gemini
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
  provider: "groq" | "openai" | "gemini" | "anthropic" | "openrouter" | "none";
  model: string;
  hasKey: boolean;
  status: "no_provider" | "configured_untested";
  statusMessage: string;
} {
  const cfg = getServerConfig();
  const active = getActiveLLMProvider(cfg);
  const hasKey = active.provider !== "none" && !!active.apiKey;
  return {
    provider: active.provider,
    model: active.model,
    hasKey,
    status: hasKey ? "configured_untested" : "no_provider",
    statusMessage: hasKey
      ? `External provider ${active.provider} (${active.model}) configured in environment. Ready for live request.`
      : "No external LLM provider configured. Deterministic semantic orchestrator active.",
  };
}

