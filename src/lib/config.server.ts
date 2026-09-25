import process from "node:process";
import fs from "node:fs";
import path from "node:path";

// Server-only config. The .server.ts suffix prevents Vite from bundling
// this file into the client — values here never reach the browser.

function loadLocalEnvFilesOnce() {
  if (typeof process === "undefined" || !process.cwd) return;
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    try {
      const fullPath = path.resolve(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx > 0) {
            const key = trimmed.slice(0, eqIdx).trim();
            let val = trimmed.slice(eqIdx + 1).trim();
            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) {
              process.env[key] = val;
            }
          }
        }
      }
    } catch {
      // Safe no-op in virtualized / edge environments
    }
  }
}

// Call on module load
loadLocalEnvFilesOnce();

export function getServerConfig() {
  loadLocalEnvFilesOnce();
  return {
    nodeEnv: process.env.NODE_ENV,
    // Supabase server secret
    supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY,
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
    
    // External LLM Provider Configurations (Server-Only, never bundled to client)
    openaiApiKey: process.env.OPENAI_API_KEY,
    openaiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1",
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
    
    groqApiKey: process.env.GROQ_API_KEY,
    groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
    
    geminiApiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    geminiModel: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    
    anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    anthropicModel: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",

    openRouterApiKey: process.env.OPENROUTER_API_KEY,
    openRouterModel: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct",
  };
}

export type ServerConfig = ReturnType<typeof getServerConfig>;

