import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { orchestrateOmniForgeConversation } from "../omniforge/server/orchestrator.server";
import { inspectLLMProviderConfiguration } from "../omniforge/server/llm-provider.server";
import { ChatMessage, OmniForgeProject } from "../omniforge/types";

/**
 * Validated Input Schema for OmniForge Chat Server Function
 */
const OmniForgeChatInputSchema = z.object({
  text: z.string().min(1, "Message text is required"),
  activeProject: z.any().optional().nullable(),
  conversationHistory: z.array(z.any()).optional().default([]),
  conversationState: z.any().optional().nullable(),
  userType: z.enum(["creator", "client"]).default("creator"),
  userId: z.string().optional().default("anon"),
});

/**
 * Server Function: Returns the current LLM provider configuration status
 * without exposing API keys or secrets to the client.
 */
export const omniforgeProviderStatusServerFn = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const info = inspectLLMProviderConfiguration();
      return {
        success: true,
        provider: info.provider,
        model: info.model,
        hasKey: info.hasKey,
        status: info.status,
        statusMessage: info.statusMessage,
      };
    } catch (err: any) {
      return {
        success: false,
        provider: "none",
        model: "none",
        hasKey: false,
        status: "no_provider" as const,
        statusMessage: "Could not inspect provider configuration.",
      };
    }
  });

/**
 * Server Function: Handles OmniForge Chat execution server-side with LLM + Tool calling.
 */
export const omniforgeChatServerFn = createServerFn({ method: "POST" })
  .validator(OmniForgeChatInputSchema)
  .handler(async ({ data }) => {
    try {
      const activeProject = (data.activeProject as OmniForgeProject) || null;
      const conversationHistory = (data.conversationHistory as ChatMessage[]) || [];
      const conversationState = data.conversationState || null;

      const result = await orchestrateOmniForgeConversation({
        text: data.text,
        activeProject,
        conversationHistory,
        conversationState,
        userType: data.userType,
        userId: data.userId,
      });

      return {
        success: true,
        response: result.structuredResponse,
        meta: result.meta,
      };
    } catch (err: any) {
      console.error("[OmniForge ServerFn Error]:", err);
      return {
        success: false,
        error: err.message || "Failed to process chat message on server",
        meta: {
          provider: "error",
          model: "none",
          isRealLLM: false,
          latencyMs: 0,
          status: "provider_error" as const,
          statusMessage: err.message || "Server function error",
        },
      };
    }
  });

