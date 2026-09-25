import { OmniForgeProject, ChatMessage, ConversationState } from "./types";

const LOCAL_PROJECTS_KEY = "omnicraft_omniforge_projects";
const LOCAL_ACTIVE_PROJECT_KEY = "omnicraft_omniforge_active_id";
const LOCAL_CHAT_HISTORY_KEY = "omnicraft_omniforge_chat_history";
const LOCAL_DRAFT_CHAT_KEY = "omnicraft_omniforge_draft_chat";
const LOCAL_DRAFT_STATE_KEY = "omnicraft_omniforge_draft_state";

export function loadProjectsFromStorage(): OmniForgeProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_PROJECTS_KEY);
    return raw ? JSON.parse(raw) : [];
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
    localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(existing));
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

export function saveChatHistoryToStorage(projectId: string, messages: ChatMessage[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${LOCAL_CHAT_HISTORY_KEY}_${projectId}`, JSON.stringify(messages));
  } catch (err) {
    console.error("Failed to save chat history:", err);
  }
}

export function loadChatHistoryFromStorage(projectId: string): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_CHAT_HISTORY_KEY}_${projectId}`);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error("Failed to load chat history:", err);
    return [];
  }
}

export function saveActiveDraftSession(messages: ChatMessage[], state: ConversationState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_DRAFT_CHAT_KEY, JSON.stringify(messages));
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
      messages: rawMsgs ? JSON.parse(rawMsgs) : [],
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
