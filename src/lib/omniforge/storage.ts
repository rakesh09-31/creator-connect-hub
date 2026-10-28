import {
  OmniForgeProject,
  ChatMessage,
  ConversationState,
  OmniForgeConversation,
  SavedRoadmapItem,
} from "./types";
import { supabase } from "@/integrations/supabase/client";
import { validateAndSanitizeRoadmap, cleanAndExtractGoalSubject } from "./universal-roadmap";

const LOCAL_PROJECTS_KEY = "omnicraft_omniforge_projects";
const LOCAL_ACTIVE_PROJECT_KEY = "omnicraft_omniforge_active_id";
const LOCAL_CHAT_HISTORY_KEY = "omnicraft_omniforge_chat_history";
const LOCAL_DRAFT_CHAT_KEY = "omnicraft_omniforge_draft_chat";
const LOCAL_DRAFT_STATE_KEY = "omnicraft_omniforge_draft_state";
const LOCAL_CONVERSATIONS_KEY = "omnicraft_omniforge_conversations";
const LOCAL_ACTIVE_CONV_ID_KEY = "omnicraft_omniforge_active_conv_id";
const LOCAL_SAVED_ROADMAPS_KEY = "omnicraft_omniforge_saved_roadmaps";

/**
 * Deduplicates and cleans stored projects.
 * Prunes obsolete duplicate "Complete Film Production" records created by legacy flows
 * while preserving the canonical active "Romantic Musical Film" project.
 */
export function sanitizeAndDeduplicateProjects(projects: OmniForgeProject[]): OmniForgeProject[] {
  if (!Array.isArray(projects) || projects.length === 0) return [];

  const seenIds = new Set<string>();
  const seenTitles = new Set<string>();
  const sanitized: OmniForgeProject[] = [];

  for (const proj of projects) {
    if (!proj || !proj.id) continue;
    if (seenIds.has(proj.id)) continue;

    const normTitle = (proj.title || "").trim().toLowerCase();

    // Prune obsolete duplicate "Complete Film Production" records
    if (
      normTitle === "complete film production" ||
      normTitle.includes("complete film production")
    ) {
      continue;
    }

    const isRomantic =
      proj.title === "Romantic Musical Film" ||
      (proj.squadId === "d7c14b35-6554-4c23-a638-527f0d6c7df4" &&
       !normTitle.includes("action") &&
       !normTitle.includes("band")) ||
      (normTitle.includes("musical") && normTitle.includes("romantic"));

    if (isRomantic) {
      proj.title = "Romantic Musical Film";
      proj.squadId = "d7c14b35-6554-4c23-a638-527f0d6c7df4";
      proj.currentUserRole = "DIRECTOR";
    }

    // Deduplicate by title to remove redundant auto-generated drafts
    if (normTitle && seenTitles.has(normTitle)) {
      continue;
    }

    if (normTitle) {
      seenTitles.add(normTitle);
    }
    seenIds.add(proj.id);
    sanitized.push(proj);
  }

  return sanitized;
}


export function loadProjectsFromStorage(): OmniForgeProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeAndDeduplicateProjects(parsed);
    if (sanitized.length !== parsed.length) {
      localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(sanitized));
    }
    return sanitized;
  } catch (err) {
    console.error("Failed to load OmniForge projects from storage:", err);
    return [];
  }
}

export function saveProjectToStorage(project: OmniForgeProject): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadProjectsFromStorage();
    const idx = existing.findIndex((p) => p.id === project.id);
    const updated = { ...project, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      existing[idx] = updated;
    } else {
      existing.unshift(updated);
    }
    const sanitized = sanitizeAndDeduplicateProjects(existing);
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(sanitized));
    localStorage.setItem(LOCAL_ACTIVE_PROJECT_KEY, project.id);
  } catch (err) {
    console.error("Failed to save OmniForge project to storage:", err);
  }
}

export function getActiveProjectId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_ACTIVE_PROJECT_KEY);
}

export function setActiveProjectId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(LOCAL_ACTIVE_PROJECT_KEY, id);
  } else {
    localStorage.removeItem(LOCAL_ACTIVE_PROJECT_KEY);
  }
}

export function deleteProjectFromStorage(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadProjectsFromStorage().filter((p) => p.id !== id);
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(existing));
    if (getActiveProjectId() === id) {
      setActiveProjectId(existing[0]?.id || null);
    }
  } catch (err) {
    console.error("Failed to delete project:", err);
  }
}

function deduplicateMessagesList(messages: ChatMessage[]): ChatMessage[] {
  if (!Array.isArray(messages)) return [];
  return messages.filter((m, idx, arr) => {
    if (m && m.sender === "user") {
      const prev = arr[idx - 1];
      if (prev && prev.sender === "user" && (prev.text || "").trim() === (m.text || "").trim()) {
        return false;
      }
    }
    return true;
  });
}

export function saveChatHistoryToStorage(projectId: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    const clean = deduplicateMessagesList(messages);
    localStorage.setItem(`${LOCAL_CHAT_HISTORY_KEY}_${projectId}`, JSON.stringify(clean));
  } catch (err) {
    console.error("Failed to save chat history:", err);
  }
}

export function loadChatHistoryFromStorage(projectId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_CHAT_HISTORY_KEY}_${projectId}`);
    return raw ? deduplicateMessagesList(JSON.parse(raw)) : [];
  } catch (err) {
    console.error("Failed to load chat history:", err);
    return [];
  }
}

export function saveActiveDraftSession(messages: ChatMessage[], state: ConversationState): void {
  if (typeof window === "undefined") return;
  try {
    const clean = deduplicateMessagesList(messages);
    localStorage.setItem(LOCAL_DRAFT_CHAT_KEY, JSON.stringify(clean));
    localStorage.setItem(LOCAL_DRAFT_STATE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Failed to save draft session:", err);
  }
}

export function loadActiveDraftSession(): { messages: ChatMessage[]; state: ConversationState | null } {
  if (typeof window === "undefined") return { messages: [], state: null };
  try {
    const rawMsgs = localStorage.getItem(LOCAL_DRAFT_CHAT_KEY);
    const rawState = localStorage.getItem(LOCAL_DRAFT_STATE_KEY);
    return {
      messages: rawMsgs ? deduplicateMessagesList(JSON.parse(rawMsgs)) : [],
      state: rawState ? JSON.parse(rawState) : null,
    };
  } catch (err) {
    console.error("Failed to load draft session:", err);
    return { messages: [], state: null };
  }
}

export function clearActiveDraftSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(LOCAL_DRAFT_CHAT_KEY);
    localStorage.removeItem(LOCAL_DRAFT_STATE_KEY);
  } catch (err) {
    console.error("Failed to clear draft session:", err);
  }
}

const LOCAL_USER_INTELLIGENCE_KEY = "omnicraft_omniforge_user_intelligence";

export async function syncUserIntelligenceToSupabase(userId: string, profile: any): Promise<void> {
  if (!userId || !profile) return;
  try {
    const { data: existingProf, error: fetchErr } = await supabase
      .from("profiles")
      .select("services")
      .eq("id", userId)
      .maybeSingle();

    if (fetchErr) {
      console.warn("[OmniForge Storage] Could not fetch profile services for sync:", fetchErr);
      return;
    }

    const currentServices = (existingProf?.services && typeof existingProf.services === "object")
      ? existingProf.services as Record<string, any>
      : {};

    const updatedServices = {
      ...currentServices,
      omniforge_intelligence: profile,
    };

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ services: updatedServices })
      .eq("id", userId);

    if (updateErr) {
      console.warn("[OmniForge Storage] Failed to sync intelligence profile to Supabase:", updateErr);
    }
  } catch (err) {
    console.warn("[OmniForge Storage] Supabase sync exception:", err);
  }
}

export async function fetchUserIntelligenceFromSupabase(userId: string): Promise<any | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("services")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data?.services) return null;
    const services = data.services as Record<string, any>;
    return services?.omniforge_intelligence || null;
  } catch (err) {
    console.warn("[OmniForge Storage] Failed to fetch intelligence profile from Supabase:", err);
    return null;
  }
}

export function saveUserIntelligenceProfile(profile: any, userId?: string): void {
  if (typeof window === "undefined" || !profile) return;
  try {
    localStorage.setItem(LOCAL_USER_INTELLIGENCE_KEY, JSON.stringify(profile));
    if (userId) {
      syncUserIntelligenceToSupabase(userId, profile).catch((e) =>
        console.warn("[OmniForge Storage] Background Supabase sync failed:", e)
      );
    }
  } catch (err) {
    console.error("Failed to save user intelligence profile:", err);
  }
}

export function loadUserIntelligenceProfile(): any | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_USER_INTELLIGENCE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Failed to load user intelligence profile:", err);
    return null;
  }
}

/**
 * Generates an intuitive, contextual title for a conversation based on the user's initial prompt.
 */
export function generateConversationTitle(initialPrompt: string): string {
  if (!initialPrompt) return "New Chat";
  const trimmed = initialPrompt.trim();
  const lower = trimmed.toLowerCase();

  if (lower.includes("html") && (lower.includes("frontend") || lower.includes("roadmap"))) {
    return "HTML & Frontend Learning Roadmap";
  }
  if (lower.includes("roadmap") && lower.includes("full stack")) {
    return "Full Stack Developer Roadmap";
  }
  if (lower.includes("roadmap")) {
    const match =
      trimmed.match(/(?:for|about|in|on)\s+([a-zA-Z0-9\s#\+\.]+?)(?:\s+roadmap|\?|$)/i) ||
      trimmed.match(/(?:a|an)\s+([a-zA-Z0-9\s#\+\.]+?)\s+roadmap/i) ||
      trimmed.match(/([a-zA-Z0-9\s#\+\.]+?)\s+roadmap/i);
    if (match && match[1]) {
      const subj = match[1].trim();
      if (subj.length > 2 && subj.length < 30) {
        return `${subj.charAt(0).toUpperCase() + subj.slice(1)} Learning Roadmap`;
      }
    }
    return "Learning Roadmap";
  }

  if (
    lower.includes("short film") ||
    (lower.includes("film") &&
      (lower.includes("team") || lower.includes("crew") || lower.includes("director") || lower.includes("story")))
  ) {
    return "Short Film Team Planning";
  }

  if (lower.includes("video editor") || lower.includes("video editors")) {
    return "Find Video Editors";
  }
  if (lower.includes("cinematographer") || lower.includes("cinematographers")) {
    return "Find Cinematographers";
  }
  if (lower.includes("sound designer") || lower.includes("sound designers")) {
    return "Find Sound Designers";
  }
  if (lower.includes("music director") || lower.includes("music directors")) {
    return "Find Music Directors";
  }

  if (lower.includes("hire") && lower.includes("@")) {
    const match = trimmed.match(/@(\w+)/);
    return match ? `Hire Creator @${match[1]}` : "Hire Creator";
  }

  if (
    lower.startsWith("what is ") ||
    lower.startsWith("explain ") ||
    lower.startsWith("how to ") ||
    lower.startsWith("teach me ")
  ) {
    const cleaned = trimmed
      .replace(/^(what is|explain|how to|teach me about|teach me)\s+/i, "")
      .replace(/\?$/, "")
      .trim();
    if (cleaned.length > 0 && cleaned.length < 35) {
      return `Explain ${cleaned.charAt(0).toUpperCase() + cleaned.slice(1)}`;
    }
  }

  if (lower.includes("agriculture") || lower.includes("crop disease")) {
    return "AI Agriculture App Planning";
  }
  if (lower.includes("restaurant")) {
    return "Restaurant Promo Campaign";
  }

  // Fallback: Take first 4-5 words
  const words = trimmed.split(/\s+/).slice(0, 5).join(" ");
  return words.length > 35 ? words.slice(0, 32) + "..." : words.charAt(0).toUpperCase() + words.slice(1);
}

// -------------------------------------------------------------
// Conversation Persistence & Isolated History
// -------------------------------------------------------------

function getConvStorageKey(userId?: string): string {
  return `${LOCAL_CONVERSATIONS_KEY}_${userId || "anon"}`;
}

export async function syncConversationsToSupabase(
  userId: string,
  conversations: OmniForgeConversation[]
): Promise<void> {
  if (!userId) return;
  try {
    const { data: existingProf, error: fetchErr } = await supabase
      .from("profiles")
      .select("services")
      .eq("id", userId)
      .maybeSingle();

    if (fetchErr) return;

    const currentServices =
      existingProf?.services && typeof existingProf.services === "object"
        ? (existingProf.services as Record<string, any>)
        : {};

    const updatedServices = {
      ...currentServices,
      omniforge_conversations: conversations,
    };

    await supabase
      .from("profiles")
      .update({ services: updatedServices as any })
      .eq("id", userId);
  } catch (err) {
    console.warn("[OmniForge Storage] Sync conversations exception:", err);
  }
}

export async function fetchConversationsFromSupabase(
  userId: string
): Promise<OmniForgeConversation[] | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("services")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data?.services) return null;
    const services = data.services as Record<string, any>;
    return (services?.omniforge_conversations as OmniForgeConversation[]) || null;
  } catch (err) {
    console.warn("[OmniForge Storage] Fetch conversations exception:", err);
    return null;
  }
}

export function loadConversationsList(userId?: string): OmniForgeConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getConvStorageKey(userId));
    if (!raw) return [];
    const list: OmniForgeConversation[] = JSON.parse(raw);
    return Array.isArray(list)
      ? list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      : [];
  } catch (err) {
    console.error("Failed to load conversations:", err);
    return [];
  }
}

export function loadConversation(id: string, userId?: string): OmniForgeConversation | null {
  const list = loadConversationsList(userId);
  return list.find((c) => c.id === id) || null;
}

export function saveConversation(conv: OmniForgeConversation, userId?: string): void {
  if (typeof window === "undefined" || !conv || !conv.id) return;
  try {
    const list = loadConversationsList(userId);
    const idx = list.findIndex((c) => c.id === conv.id);
    const updated = { ...conv, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      list.splice(idx, 1);
      list.unshift(updated);
    } else {
      list.unshift(updated);
    }
    localStorage.setItem(getConvStorageKey(userId), JSON.stringify(list));
    if (userId) {
      syncConversationsToSupabase(userId, list).catch((e) =>
        console.warn("[OmniForge Storage] Background Supabase conv sync failed:", e)
      );
    }
  } catch (err) {
    console.error("Failed to save conversation:", err);
  }
}

export function deleteConversation(id: string, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = loadConversationsList(userId).filter((c) => c.id !== id);
    localStorage.setItem(getConvStorageKey(userId), JSON.stringify(list));
    if (getActiveConversationId() === id) {
      setActiveConversationId(list[0]?.id || null);
    }
    if (userId) {
      syncConversationsToSupabase(userId, list).catch((e) =>
        console.warn("[OmniForge Storage] Background Supabase conv sync failed:", e)
      );
    }
  } catch (err) {
    console.error("Failed to delete conversation:", err);
  }
}

export function renameConversation(id: string, newTitle: string, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = loadConversationsList(userId);
    const item = list.find((c) => c.id === id);
    if (item) {
      item.title = newTitle;
      item.updatedAt = new Date().toISOString();
      localStorage.setItem(getConvStorageKey(userId), JSON.stringify(list));
      if (userId) {
        syncConversationsToSupabase(userId, list).catch((e) =>
          console.warn("[OmniForge Storage] Background Supabase conv sync failed:", e)
        );
      }
    }
  } catch (err) {
    console.error("Failed to rename conversation:", err);
  }
}

export function getActiveConversationId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LOCAL_ACTIVE_CONV_ID_KEY);
}

export function setActiveConversationId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) {
    localStorage.setItem(LOCAL_ACTIVE_CONV_ID_KEY, id);
  } else {
    localStorage.removeItem(LOCAL_ACTIVE_CONV_ID_KEY);
  }
}

// -------------------------------------------------------------
// Saved Roadmaps History Persistence
// -------------------------------------------------------------

function getRoadmapsStorageKey(userId?: string): string {
  return `${LOCAL_SAVED_ROADMAPS_KEY}_${userId || "anon"}`;
}

export async function syncRoadmapsToSupabase(
  userId: string,
  roadmaps: SavedRoadmapItem[]
): Promise<void> {
  if (!userId) return;
  try {
    const { data: existingProf, error: fetchErr } = await supabase
      .from("profiles")
      .select("services")
      .eq("id", userId)
      .maybeSingle();

    if (fetchErr) return;

    const currentServices =
      existingProf?.services && typeof existingProf.services === "object"
        ? (existingProf.services as Record<string, any>)
        : {};

    const updatedServices = {
      ...currentServices,
      omniforge_roadmaps: roadmaps,
    };

    await supabase
      .from("profiles")
      .update({ services: updatedServices as any })
      .eq("id", userId);
  } catch (err) {
    console.warn("[OmniForge Storage] Sync roadmaps exception:", err);
  }
}

export function sanitizeSavedRoadmapItem(item: SavedRoadmapItem): SavedRoadmapItem {
  if (!item || !item.id) return item;

  let title = (item.title || "").trim();
  let targetSkill = (item.targetSkillOrOutcome || "").trim();

  // Detect and repair prompt fragments like "I need as a" or "I want"
  if (!title || /\b(?:i\s+need(?:\s+as\s+a)?|i\s+want|as\s+a)\b/i.test(title)) {
    const extracted = cleanAndExtractGoalSubject(title);
    if (!extracted.isAmbiguous && extracted.subject) {
      title = `${extracted.subject} Mastery Roadmap`;
      targetSkill = `${extracted.subject} Specialist`;
    } else if (item.roadmapData && Array.isArray(item.roadmapData.nodes) && item.roadmapData.nodes.length > 0) {
      const firstSkill = item.roadmapData.nodes[0]?.skill || "";
      if (firstSkill && !/\b(?:i\s+need|as\s+a)\b/i.test(firstSkill)) {
        title = `${firstSkill} Mastery Roadmap`;
        targetSkill = `${firstSkill} Specialist`;
      } else {
        title = "Software Engineering Mastery Roadmap";
        targetSkill = "Software Engineer";
      }
    } else {
      title = "Software Engineering Mastery Roadmap";
      targetSkill = "Software Engineer";
    }
  }

  if (!targetSkill || /\b(?:i\s+need(?:\s+as\s+a)?|i\s+want|as\s+a)\b/i.test(targetSkill)) {
    targetSkill = title.replace(/\s+(?:Mastery\s+)?Roadmap\s*$/i, "") + " Specialist";
  }

  let sanitizedRoadmapData = item.roadmapData;
  if (sanitizedRoadmapData) {
    const validated = validateAndSanitizeRoadmap(sanitizedRoadmapData, title);
    sanitizedRoadmapData = validated.roadmap;
    if (sanitizedRoadmapData.title && !/\b(?:i\s+need|as\s+a)\b/i.test(sanitizedRoadmapData.title)) {
      title = sanitizedRoadmapData.title;
    }
    if (sanitizedRoadmapData.targetRole && !/\b(?:i\s+need|as\s+a)\b/i.test(sanitizedRoadmapData.targetRole)) {
      targetSkill = sanitizedRoadmapData.targetRole;
    }
  }

  const resolvedProgress = Math.max(
    typeof sanitizedRoadmapData?.overallProgress === "number" ? sanitizedRoadmapData.overallProgress : 0,
    typeof item.progressPercent === "number" ? item.progressPercent : 0
  );

  if (sanitizedRoadmapData) {
    sanitizedRoadmapData = {
      ...sanitizedRoadmapData,
      overallProgress: resolvedProgress,
    };
  }

  const summary =
    item.summary ||
    sanitizedRoadmapData?.summary ||
    `Comprehensive ${sanitizedRoadmapData?.stages?.length || sanitizedRoadmapData?.nodes?.length || item.totalStages || 6}-stage curriculum for ${title}.`;
  const subject =
    item.subject ||
    sanitizedRoadmapData?.subject ||
    title.replace(/\s+(?:Mastery\s+)?Roadmap\s*$/i, "");
  const domain = item.domain || sanitizedRoadmapData?.domain || "Professional Discipline";
  const roadmapType = item.roadmapType || sanitizedRoadmapData?.roadmapType || "LEARNING";

  return {
    ...item,
    title,
    subject,
    domain,
    summary,
    roadmapType,
    targetSkillOrOutcome: targetSkill,
    totalStages:
      sanitizedRoadmapData?.stages?.length ||
      sanitizedRoadmapData?.nodes?.length ||
      item.totalStages ||
      6,
    progressPercent: resolvedProgress,
    roadmapData: sanitizedRoadmapData,
  };
}

export async function fetchRoadmapsFromSupabase(
  userId: string
): Promise<SavedRoadmapItem[] | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("services")
      .eq("id", userId)
      .maybeSingle();

    if (error || !data?.services) return null;
    const services = data.services as Record<string, any>;
    const rawList = services?.omniforge_roadmaps as SavedRoadmapItem[] | undefined;
    if (!Array.isArray(rawList)) return null;

    const seen = new Set<string>();
    const cleaned: SavedRoadmapItem[] = [];
    for (const rawItem of rawList) {
      if (!rawItem || !rawItem.id || seen.has(rawItem.id)) continue;
      seen.add(rawItem.id);
      cleaned.push(sanitizeSavedRoadmapItem(rawItem));
    }
    return cleaned;
  } catch (err) {
    console.warn("[OmniForge Storage] Fetch roadmaps exception:", err);
    return null;
  }
}

export function loadSavedRoadmapsList(userId?: string): SavedRoadmapItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getRoadmapsStorageKey(userId));
    if (!raw) return [];
    const list: SavedRoadmapItem[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];

    const seen = new Set<string>();
    const cleaned: SavedRoadmapItem[] = [];
    for (const rawItem of list) {
      if (!rawItem || !rawItem.id || seen.has(rawItem.id)) continue;
      seen.add(rawItem.id);
      cleaned.push(sanitizeSavedRoadmapItem(rawItem));
    }

    return cleaned.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (err) {
    console.error("Failed to load saved roadmaps:", err);
    return [];
  }
}

export function findSavedRoadmapById(id: string, userId?: string): SavedRoadmapItem | null {
  const list = loadSavedRoadmapsList(userId);
  return list.find((r) => r.id === id) || null;
}

export function findSavedRoadmapBySubject(subject: string, userId?: string): SavedRoadmapItem | null {
  if (!subject) return null;
  const list = loadSavedRoadmapsList(userId);
  const norm = subject.toLowerCase().trim();
  return (
    list.find(
      (r) =>
        r.title.toLowerCase().includes(norm) ||
        (r.targetSkillOrOutcome && r.targetSkillOrOutcome.toLowerCase().includes(norm))
    ) || null
  );
}

export function saveRoadmapItem(item: SavedRoadmapItem, userId?: string): void {
  if (typeof window === "undefined" || !item || !item.id) return;
  try {
    const sanitizedItem = sanitizeSavedRoadmapItem(item);
    const list = loadSavedRoadmapsList(userId);
    // Find strictly by unique ID so distinct roadmaps never overwrite each other
    const idx = list.findIndex((r) => r.id === sanitizedItem.id);
    const updated: SavedRoadmapItem = {
      ...sanitizedItem,
      updatedAt: new Date().toISOString(),
    };
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...updated };
    } else {
      list.unshift(updated);
    }
    localStorage.setItem(getRoadmapsStorageKey(userId), JSON.stringify(list));
    if (userId) {
      syncRoadmapsToSupabase(userId, list).catch((e) =>
        console.warn("[OmniForge Storage] Background Supabase roadmaps sync failed:", e)
      );
    }
  } catch (err) {
    console.error("Failed to save roadmap item:", err);
  }
}

export function deleteRoadmapItem(id: string, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = loadSavedRoadmapsList(userId).filter((r) => r.id !== id);
    localStorage.setItem(getRoadmapsStorageKey(userId), JSON.stringify(list));
    if (userId) {
      syncRoadmapsToSupabase(userId, list).catch((e) =>
        console.warn("[OmniForge Storage] Background Supabase roadmaps sync failed:", e)
      );
    }
  } catch (err) {
    console.error("Failed to delete roadmap item:", err);
  }
}

export function renameRoadmapItem(id: string, newTitle: string, userId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const list = loadSavedRoadmapsList(userId);
    const item = list.find((r) => r.id === id);
    if (item) {
      item.title = newTitle;
      item.updatedAt = new Date().toISOString();
      localStorage.setItem(getRoadmapsStorageKey(userId), JSON.stringify(list));
      if (userId) {
        syncRoadmapsToSupabase(userId, list).catch((e) =>
          console.warn("[OmniForge Storage] Background Supabase roadmaps sync failed:", e)
        );
      }
    }
  } catch (err) {
    console.error("Failed to rename roadmap item:", err);
  }
}
