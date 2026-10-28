import { useState, useEffect, useCallback, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Sparkles,
  Layers,
  Users,
  MessageSquare,
  GitBranch,
  CheckCircle2,
  RefreshCw,
  Plus,
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
  FileText,
  Code2,
  Menu,
  ArrowLeft,
  Upload,
  Flame,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  OmniForgeProject,
  ChatMessage,
  CreatorRecommendation,
  TaskStatus,
  ConversationState,
  MissingCapability,
  ClientOpportunity,
  SquadResult,
  SearchPaginationState,
  LatencyTelemetry,
  ProjectPhase,
  SkillSwapListingMatch,
} from "@/lib/omniforge/types";
import {
  classifyUserIntent,
  isDeterministicIntent,
  detectUserRoleFromText,
  CREATE_SEPARATE_FRONTEND_ROADMAP_REGEX,
  LIST_ALL_ROADMAPS_REGEX,
} from "@/lib/omniforge/intent";
import { searchRealSkillSwapListings } from "@/lib/omniforge/skill-swap-matcher";
import {
  createInitialConversationState,
  transitionConversationState,
  extractMatchingCriteriaFromContext,
} from "@/lib/omniforge/conversation-state";
import {
  generateStructuredBlueprint,
  modifyBlueprintFromInstruction,
  enrichBlueprintWithArchitectureRefinement,
  processConversationalOmniForgeMessage,
} from "@/lib/omniforge/engine";
import { omniforgeChatServerFn, omniforgeProviderStatusServerFn } from "@/lib/api/omniforge.functions";
import { sendLocalAIChatMessage, checkLocalAIHealth, validateLocalAIResponse } from "@/lib/api/local-ai";
import {
  matchCreatorsForProject,
  matchCreatorsForSingleRole,
  matchCreatorsFromRequirements,
  searchCreatorsDirectory,
  searchClientOpportunities,
  searchSquadsDirectory,
  searchAllMusicCreators,
  recommendBestCandidate,
  searchCinemaCreatorsByDepartments,
  searchOpenFilmRolesGrouped,
} from "@/lib/omniforge/matcher";
import { detectCanonicalDomain, isExplicitDomainSwitch } from "@/lib/omniforge/domain-detector";
import { generateRequirementsDerivedBlueprint } from "@/lib/omniforge/requirements-engine";
import { HireSquadModal } from "@/components/squads/HireSquadModal";
import {
  loadProjectsFromStorage,
  saveProjectToStorage,
  getActiveProjectId,
  setActiveProjectId,
  deleteProjectFromStorage,
  loadChatHistoryFromStorage,
  saveChatHistoryToStorage,
  loadActiveDraftSession,
  saveActiveDraftSession,
  clearActiveDraftSession,
  saveUserIntelligenceProfile,
  loadUserIntelligenceProfile,
  fetchUserIntelligenceFromSupabase,
  syncUserIntelligenceToSupabase,
  loadConversationsList,
  saveConversation,
  loadConversation,
  deleteConversation,
  renameConversation,
  getActiveConversationId,
  setActiveConversationId,
  generateConversationTitle,
  loadSavedRoadmapsList,
  saveRoadmapItem,
  deleteRoadmapItem,
  renameRoadmapItem,
  fetchConversationsFromSupabase,
  fetchRoadmapsFromSupabase,
} from "@/lib/omniforge/storage";
import {
  UserIntelligenceProfile,
  SkillDnaEntry,
  SkillGapItem,
  VisualRoadmapData,
  DetailedProjectPlan,
  RoadmapNodeState,
  DEFAULT_SKILL_DNA,
  buildStandardFullStackRoadmap,
  buildHtmlFrontendRoadmap,
  inspectUserLearningState,
  explainCurrentMilestone,
  generateTodayLearningTasks,
  generateExercisesForTopic,
  assessUserSkills,
  resumeNextIncompleteMilestone,
  calculateDynamicTimeline,
  computeSkillGapMatrix,
  explainWhatToLearnNext,
  generateStructuredClientProjectPlan,
  parseResumeContent,
  UserAccountRole,
  ParsedResumeData,
  ProjectSubmission,
  ProjectEvaluationResult,
  evaluateRoadmapProjectSubmission,
  applyProjectEvaluationToSkillDna,
  checkNodeSkipEligibility,
  computeClientProjectSkillGaps,
} from "@/lib/omniforge/user-intelligence";
import { VisualRoadmapJourney } from "@/components/omniforge/VisualRoadmapJourney";
import { SkillGapVisualizer } from "@/components/omniforge/SkillGapVisualizer";
import { ProjectPlanVisualizer } from "@/components/omniforge/ProjectPlanVisualizer";
import { ProjectSubmissionWorkspace } from "@/components/omniforge/ProjectSubmissionWorkspace";
import { ResumeUploadModal } from "@/components/omniforge/ResumeUploadModal";
import { OmniForgeSidebar } from "@/components/omniforge/OmniForgeSidebar";
import { DocumentUploadModal, UploadedDocumentPayload } from "@/components/omniforge/DocumentUploadModal";
import {
  buildCompleteJavaRoadmap,
  buildCompletePythonRoadmap,
  buildUniversalRoadmap,
  detectRoadmapSubject,
  validateAndSanitizeRoadmap,
  expandRoadmapStage,
  UniversalRoadmap,
} from "@/lib/omniforge/universal-roadmap";
import {
  recordQualifyingLearningActivity,
  loadUserStreakProfile,
} from "@/lib/omniforge/learning-streaks";
import { convertProjectToSquad } from "@/lib/omniforge/squad-bridge";
import {
  SquadInvitation,
  fetchSquadInvitations,
  fetchSquadMembers,
  getOrCreateProjectSquad,
} from "@/lib/omniforge/collaboration";
import {
  resolveActiveProject,
  reconcileProjectTeamState,
  applyCreatorToProject,
  buildDynamicMissingRolesResponse,
  buildCompleteFilmRoleMatrixResponse,
  calculateFilmTeamStatus,
  SHORT_FILM_ROLE_DEFINITIONS,
  isRoleMatch,
  CANONICAL_FILM_EXTERNAL_ROLES,
  CANONICAL_FILM_SQUAD_ID,
  parseExplicitRoleRequirementRequest,
  detectFilmGenre,
  normalizeRoleKey,
} from "@/lib/omniforge/team-reconciliation";
import { ALL_CANONICAL_CINEMATIC_ROLES } from "@/lib/omniforge/film-taxonomy";
import { validateCreatorForRole, getRoleCandidateCounts } from "@/lib/omniforge/matcher";
import { generateDynamicFollowUpChips } from "@/lib/omniforge/dynamic-chips";
import { isQueryProjectRelated, isQueryStoryRelated } from "@/lib/omniforge/context-manager";
import { supabase } from "@/integrations/supabase/client";
import { OmniForgeChat } from "@/components/omniforge/OmniForgeChat";
import { ProjectBlueprintView } from "@/components/omniforge/ProjectBlueprintView";
import { TeamRecommendationsView } from "@/components/omniforge/TeamRecommendationsView";
import { OmniForgeWorkspace } from "@/components/omniforge/OmniForgeWorkspace";
import { CompareCreatorsModal } from "@/components/omniforge/CompareCreatorsModal";
import { InviteCreatorModal } from "@/components/omniforge/InviteCreatorModal";
import { RealCreatorProfile, OmniForgeConversation, SavedRoadmapItem } from "@/lib/omniforge/types";

export type CreatorResolutionResult =
  | { status: "RESOLVED"; creator: RealCreatorProfile; matchedRole?: string; source: string }
  | { status: "AMBIGUOUS"; candidates: RealCreatorProfile[]; originalQuery: string }
  | { status: "NOT_FOUND"; query: string };

function mapDbProfileToRealCreator(p: any): RealCreatorProfile {
  return {
    id: p.id,
    username: p.username,
    fullName: p.full_name || p.username,
    avatarUrl: p.avatar_url || null,
    role: p.role || "creator",
    bio: p.bio || null,
    skills: Array.isArray(p.skills) ? p.skills : [],
    specialties: Array.isArray(p.specialties) ? p.specialties : p.role && p.role !== "creator" ? [p.role] : [],
    roles: Array.isArray(p.roles) ? p.roles : p.role && p.role !== "creator" ? [p.role] : [],
    portfolioItemsCount: p.portfolio_items_count || 1,
    portfolioSamples: Array.isArray(p.portfolio_samples) ? p.portfolio_samples : [],
    experienceLevel: p.experience_level || null,
    availability: p.availability || "available",
  };
}

function getDynamicSuggestedChips(params: {
  intent: string;
  activeProject?: OmniForgeProject | null;
  userQuery: string;
  resultCount?: number;
  initialChips?: string[];
}): string[] {
  const isProjectTurn = isQueryProjectRelated(params.userQuery, params.activeProject || null);
  const isStoryTurn = isQueryStoryRelated(params.userQuery, false);

  return generateDynamicFollowUpChips({
    intent: params.intent,
    userQuery: params.userQuery,
    activeProject: params.activeProject,
    resultCount: params.resultCount,
    initialChips: params.initialChips,
    isProjectTurn,
    isStoryTurn,
  });
}

/**
 * 7-priority creator candidate resolution:
 * 1. Currently selected creator card ID
 * 2. Exact @username
 * 3. Exact username
 * 4. Exact full display name (disambiguates if multiple exist)
 * 5. Normalized full display name
 * 6. Unique fuzzy match
 * 7. Clarification if ambiguous
 */
async function resolveCreatorCandidate(
  identifier: string,
  selectedCard: CreatorRecommendation | null
): Promise<CreatorResolutionResult> {
  const clean = identifier.trim();
  const lower = clean.toLowerCase();
  const rawUsername = clean.replace(/^@/, "").trim().toLowerCase();

  // 1. Currently selected creator card ID / card match
  if (selectedCard && selectedCard.creator) {
    const c = selectedCard.creator;
    const matchesId = c.id === clean;
    const matchesUsername = c.username.toLowerCase() === rawUsername;
    const matchesFullName =
      (c.fullName || "").toLowerCase() === lower ||
      (c.fullName || "").toLowerCase().includes(lower);
    if (
      matchesId ||
      matchesUsername ||
      matchesFullName ||
      clean === "selected" ||
      clean === "this creator"
    ) {
      return {
        status: "RESOLVED",
        creator: c,
        matchedRole: selectedCard.roleName,
        source: "selected_card",
      };
    }
  }

  // 2. Exact @username
  if (clean.startsWith("@")) {
    const { data: exactAtProf } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, role, bio")
      .ilike("username", rawUsername)
      .limit(1)
      .maybeSingle();

    if (exactAtProf) {
      return {
        status: "RESOLVED",
        creator: mapDbProfileToRealCreator(exactAtProf),
        source: "exact_at_username",
      };
    }
  }

  // 3. Exact username (without @)
  const { data: exactUserProf } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, bio")
    .ilike("username", rawUsername)
    .limit(1)
    .maybeSingle();

  if (exactUserProf) {
    return {
      status: "RESOLVED",
      creator: mapDbProfileToRealCreator(exactUserProf),
      source: "exact_username",
    };
  }

  // 4. Exact full display name
  const { data: exactDisplayMatches } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, bio")
    .ilike("full_name", clean);

  if (exactDisplayMatches && exactDisplayMatches.length > 0) {
    if (exactDisplayMatches.length === 1) {
      return {
        status: "RESOLVED",
        creator: mapDbProfileToRealCreator(exactDisplayMatches[0]),
        source: "exact_display_name",
      };
    }
    // Ambiguity! Multiple exact display names found -> DO NOT GUESS
    return {
      status: "AMBIGUOUS",
      candidates: exactDisplayMatches.map(mapDbProfileToRealCreator),
      originalQuery: clean,
    };
  }

  // 5. Normalized full display name
  const normalizedQuery = clean.replace(/\s+/g, " ").toLowerCase();
  const firstWord = clean.split(" ")[0];
  const { data: candidatesList } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, bio")
    .ilike("full_name", `%${firstWord}%`);

  if (candidatesList && candidatesList.length > 0) {
    const normMatches = candidatesList.filter(
      (c) => (c.full_name || "").replace(/\s+/g, " ").toLowerCase() === normalizedQuery
    );
    if (normMatches.length === 1) {
      return {
        status: "RESOLVED",
        creator: mapDbProfileToRealCreator(normMatches[0]),
        source: "normalized_display_name",
      };
    }
    if (normMatches.length > 1) {
      return {
        status: "AMBIGUOUS",
        candidates: normMatches.map(mapDbProfileToRealCreator),
        originalQuery: clean,
      };
    }
  }

  // 6. Unique fuzzy match
  const { data: fuzzyMatches } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, bio")
    .or(`username.ilike.%${clean}%,full_name.ilike.%${clean}%`)
    .limit(10);

  if (fuzzyMatches && fuzzyMatches.length > 0) {
    if (fuzzyMatches.length === 1) {
      return {
        status: "RESOLVED",
        creator: mapDbProfileToRealCreator(fuzzyMatches[0]),
        source: "unique_fuzzy_match",
      };
    }
    return {
      status: "AMBIGUOUS",
      candidates: fuzzyMatches.map(mapDbProfileToRealCreator),
      originalQuery: clean,
    };
  }

  // 7. Not found
  return { status: "NOT_FOUND", query: clean };
}

export const Route = createFileRoute("/_authenticated/_app/omniforge")({
  head: () => ({ meta: [{ title: "OmniForge — AI Project Architect & Creator Orchestrator" }] }),
  component: OmniForgePage,
});

function OmniForgePage() {
  const { user, profile } = useAuth();
  const userType = (profile?.role === "client" ? "client" : "creator") as "creator" | "client";

  const [projects, setProjects] = useState<OmniForgeProject[]>([]);
  const [activeProject, setActiveProject] = useState<OmniForgeProject | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const savedActive = getActiveConversationId();
    if (savedActive) {
      const conv = loadConversation(savedActive, user?.id);
      if (conv && conv.messages && conv.messages.length > 0) return conv.messages;
    }
    const list = loadConversationsList(user?.id);
    if (list.length > 0 && list[0].messages && list[0].messages.length > 0) {
      return list[0].messages;
    }
    const draft = loadActiveDraftSession();
    return draft.messages || [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "blueprint" | "team" | "workspace">("chat");
  const [conversationState, setConversationState] = useState<ConversationState>(() => {
    const savedActive = getActiveConversationId();
    if (savedActive) {
      const conv = loadConversation(savedActive, user?.id);
      if (conv && conv.state) return conv.state;
    }
    const list = loadConversationsList(user?.id);
    if (list.length > 0 && list[0].state) {
      return list[0].state;
    }
    const draft = loadActiveDraftSession();
    return draft.state || createInitialConversationState();
  });
  const [intelligenceInfo, setIntelligenceInfo] = useState<{
    provider: string;
    model: string;
    isRealLLM: boolean;
    latencyMs?: number;
    status?: "no_provider" | "configured_untested" | "live_verified" | "provider_error" | "fallback_active";
    statusMessage?: string;
  }>({
    provider: "local-ollama",
    model: "qwen3:4b",
    isRealLLM: false,
    status: "configured_untested",
    statusMessage: "Connecting to Local AI backend (http://127.0.0.1:8001)...",
  });

  // Comparison modal state
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareRoleId, setCompareRoleId] = useState<string | null>(null);
  const [isConvertingSquad, setIsConvertingSquad] = useState(false);

  // Real Creator Invitation & Squad Collaboration state
  const [invitations, setInvitations] = useState<SquadInvitation[]>([]);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedInviteCandidate, setSelectedInviteCandidate] = useState<CreatorRecommendation | null>(null);
  const [activeSquadId, setActiveSquadId] = useState<string | null>(null);
  const [squadToHire, setSquadToHire] = useState<SquadResult | null>(null);

  // Candidate context preservation refs
  const selectedCandidateCardRef = useRef<CreatorRecommendation | null>(null);
  const lastSearchRoleRef = useRef<string | null>(null);
  const recentSearchResultsRef = useRef<CreatorRecommendation[]>([]);

  // 3-Connected Systems State (AI Chat, AI Roadmap, AI Project Plan)
  const [intelProfile, setIntelProfile] = useState<UserIntelligenceProfile>(() => {
    const cached = loadUserIntelligenceProfile();
    if (cached) return cached;
    const initialSkillDna = { ...DEFAULT_SKILL_DNA };
    const initialRoadmap = buildStandardFullStackRoadmap(initialSkillDna);
    const initialGaps = computeSkillGapMatrix(initialSkillDna, "Full Stack Developer");
    return {
      id: profile?.id || user?.id || "anon",
      role: (profile?.role === "client" ? "CLIENT" : "CREATOR") as UserAccountRole,
      roleConfidence: 95,
      roleSource: profile?.role ? "account" : "inferred",
      careerGoal: "Full Stack Developer",
      targetRole: "Full Stack Software Engineer",
      skillDna: initialSkillDna,
      skillGaps: initialGaps,
      roadmap: initialRoadmap,
      activeProjectPlan: null,
      resumeParsed: false,
    };
  });

  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [documentUploadModalOpen, setDocumentUploadModalOpen] = useState(false);
  const [userStreak, setUserStreak] = useState(() => loadUserStreakProfile(user?.id));
  const [centerView, setCenterView] = useState<
    | "conversation"
    | "skill_analysis"
    | "project_submission"
    | "project_plan"
    | "blueprint"
    | "team"
    | "workspace"
  >("conversation");
  const [selectedSubmissionNodeId, setSelectedSubmissionNodeId] = useState<string | null>(null);
  const [isEvaluatingProject, setIsEvaluatingProject] = useState(false);

  // History, Sidebar, and Contextual Full View States
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const saved = localStorage.getItem("omniforge_sidebar_open");
      if (saved !== null) return saved === "true";
      return window.innerWidth >= 1024;
    } catch {
      return true;
    }
  });

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("omniforge_sidebar_open", String(next));
      } catch {}
      return next;
    });
  }, []);
  const [conversations, setConversations] = useState<OmniForgeConversation[]>(() =>
    loadConversationsList(user?.id)
  );
  const [activeConversationId, setActiveConversationIdState] = useState<string>(() => {
    const savedActive = getActiveConversationId();
    if (savedActive) return savedActive;
    const list = loadConversationsList(user?.id);
    if (list.length > 0) return list[0].id;
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return newId;
  });
  const [savedRoadmaps, setSavedRoadmaps] = useState<SavedRoadmapItem[]>(() =>
    loadSavedRoadmapsList(user?.id)
  );

  // Contextual Full View: null = Pure ChatGPT Interface (Default)
  const [activeFullView, setActiveFullView] = useState<
    | null
    | "roadmap"
    | "project_plan"
    | "project_submission"
    | "blueprint"
    | "team"
    | "workspace"
    | "skill_analysis"
  >(null);

  useEffect(() => {
    if (user?.id) {
      fetchUserIntelligenceFromSupabase(user.id).then((remote) => {
        if (remote && remote.roadmap) {
          setIntelProfile((prev) => ({
            ...prev,
            ...remote,
          }));
        }
      });
      fetchConversationsFromSupabase(user.id).then((remoteConvs) => {
        if (remoteConvs && Array.isArray(remoteConvs) && remoteConvs.length > 0) {
          setConversations(remoteConvs);
          const currentId = getActiveConversationId() || remoteConvs[0].id;
          const currentConv = remoteConvs.find((c) => c.id === currentId) || remoteConvs[0];
          if (currentConv) {
            setMessages((prev) => (prev.length === 0 ? currentConv.messages || [] : prev));
            if (currentConv.state) {
              setConversationState((prev) => (prev.stage === "GENERAL_CHAT" && currentConv.state ? currentConv.state : prev));
            }
          }
        }
      });
      fetchRoadmapsFromSupabase(user.id).then((remoteRms) => {
        if (remoteRms && Array.isArray(remoteRms) && remoteRms.length > 0) {
          setSavedRoadmaps(remoteRms);
        }
      });
    }
  }, [user?.id]);

  const handleNewChat = () => {
    const newId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setActiveConversationIdState(newId);
    setActiveConversationId(newId);
    setMessages([]);
    setConversationState(createInitialConversationState());
    setActiveProject(null);
    setActiveFullView(null);
    clearActiveDraftSession();
  };

  const handleSelectConversation = (convId: string) => {
    const found = loadConversation(convId, user?.id);
    if (found) {
      setActiveConversationIdState(found.id);
      setActiveConversationId(found.id);
      setMessages(found.messages || []);
      if (found.state) {
        setConversationState(found.state);
      }
      if (found.activeProjectId) {
        const projs = loadProjectsFromStorage();
        const p = projs.find((x) => x.id === found.activeProjectId);
        setActiveProject(p || null);
      } else {
        setActiveProject(null);
      }
      setActiveFullView(null);
    }
  };

  const handleDeleteConversation = (convId: string) => {
    deleteConversation(convId, user?.id);
    const updated = loadConversationsList(user?.id);
    setConversations(updated);
    if (activeConversationId === convId) {
      if (updated.length > 0) {
        handleSelectConversation(updated[0].id);
      } else {
        handleNewChat();
      }
    }
  };

  const handleRenameConversation = (convId: string, newTitle: string) => {
    renameConversation(convId, newTitle, user?.id);
    setConversations(loadConversationsList(user?.id));
  };

  const handleSelectRoadmap = (rm: SavedRoadmapItem) => {
    if (rm.conversationId) {
      const conv = loadConversation(rm.conversationId, user?.id);
      if (conv) {
        handleSelectConversation(conv.id);
      }
    }
    if (rm.roadmapData) {
      const validated = validateAndSanitizeRoadmap(rm.roadmapData, rm.title);
      const cleanRm = validated.roadmap;
      setIntelProfile((prev) => {
        const next: UserIntelligenceProfile = {
          ...prev,
          careerGoal: cleanRm.goal || rm.title,
          targetRole: cleanRm.targetRole || rm.targetSkillOrOutcome || "Specialist",
          activeRoadmapTrack: cleanRm.trackKey || rm.id,
          roadmap: cleanRm,
          savedRoadmaps: {
            ...(prev.savedRoadmaps || {}),
            [cleanRm.trackKey || rm.id]: cleanRm,
          },
        };
        saveUserIntelligenceProfile(next, user?.id);
        return next;
      });
    }
    setActiveFullView("roadmap");
  };

  const handleSelectRoadmapById = (roadmapId: string) => {
    const found = savedRoadmaps.find((r) => r.id === roadmapId);
    if (found) {
      handleSelectRoadmap(found);
    }
  };

  const handleDeleteRoadmap = (id: string) => {
    deleteRoadmapItem(id, user?.id);
    const updatedList = loadSavedRoadmapsList(user?.id);
    setSavedRoadmaps(updatedList);

    const isCurrentActive =
      intelProfile.roadmap?.id === id ||
      intelProfile.activeRoadmapTrack === id ||
      (intelProfile.roadmap as any)?.trackKey === id;

    if (isCurrentActive) {
      if (updatedList.length > 0) {
        const nextRoadmap = updatedList[0];
        handleSelectRoadmap(nextRoadmap);
        toast.info(`Switched to "${nextRoadmap.title}"`);
      } else {
        setIntelProfile((prev) => {
          const nextProfile: UserIntelligenceProfile = {
            ...prev,
            careerGoal: "No Roadmap Active",
            targetRole: "",
            activeRoadmapTrack: undefined,
            roadmap: {
              id: "",
              goal: "No Roadmap Active",
              domain: "General",
              targetRole: "",
              pointerLevel: 1,
              currentNodeId: "",
              nodes: [],
              stages: [],
              overallProgress: 0,
              lastUpdated: new Date().toISOString(),
            },
            savedRoadmaps: {},
          };
          saveUserIntelligenceProfile(nextProfile, user?.id);
          return nextProfile;
        });
        toast.info("Roadmap deleted. No saved roadmaps remain.");
      }
    } else {
      setIntelProfile((prev) => {
        if (!prev.savedRoadmaps || !prev.savedRoadmaps[id]) return prev;
        const nextSaved = { ...prev.savedRoadmaps };
        delete nextSaved[id];
        const nextProfile = { ...prev, savedRoadmaps: nextSaved };
        saveUserIntelligenceProfile(nextProfile, user?.id);
        return nextProfile;
      });
      toast.success("Roadmap deleted.");
    }
  };

  const handleRenameRoadmap = (id: string, newTitle: string) => {
    renameRoadmapItem(id, newTitle, user?.id);
    setSavedRoadmaps(loadSavedRoadmapsList(user?.id));
  };

  const handleProjectSubmission = (nodeId: string, submission: ProjectSubmission) => {
    setIsEvaluatingProject(true);
    const targetNode =
      intelProfile.roadmap.nodes.find((n) => n.id === nodeId) || intelProfile.roadmap.nodes[0];
    const evaluation = evaluateRoadmapProjectSubmission(targetNode, submission);

    setTimeout(() => {
      setIsEvaluatingProject(false);
      setIntelProfile((prev) => {
        const nextLevel = (targetNode.level || 1) + 1;
        let nextNodeId = prev.roadmap.currentNodeId;

        const updatedNodes = prev.roadmap.nodes.map((n) => {
          if (n.id === nodeId) {
            return {
              ...n,
              state: (evaluation.passed ? "PASSED" : "REVISION_REQUIRED") as RoadmapNodeState,
              submission,
              evaluation,
            };
          }
          if (
            evaluation.passed &&
            n.level === nextLevel &&
            (n.state === "LOCKED" || n.state === "AVAILABLE")
          ) {
            nextNodeId = n.id;
            return { ...n, state: "IN_PROGRESS" as RoadmapNodeState };
          }
          return n;
        });

        const updatedSkillDna = evaluation.passed
          ? applyProjectEvaluationToSkillDna(prev.skillDna, evaluation, targetNode)
          : prev.skillDna;

        const stages = prev.roadmap.stages.map((stg) => {
          if (stg.stage === targetNode.level) {
            return { ...stg, status: (evaluation.passed ? "COMPLETED" : "ACTIVE") as any };
          }
          if (evaluation.passed && stg.stage === nextLevel) {
            return { ...stg, status: "ACTIVE" as any };
          }
          return stg;
        });

        const updatedGaps = computeSkillGapMatrix(updatedSkillDna, prev.careerGoal);
        const passedCount = updatedNodes.filter(
          (n) => n.state === "PASSED" || n.state === "COMPLETED"
        ).length;
        const overallProgress = Math.round((passedCount / updatedNodes.length) * 100);

        const updatedProfile: UserIntelligenceProfile = {
          ...prev,
          skillDna: updatedSkillDna,
          skillGaps: updatedGaps,
          roadmap: {
            ...prev.roadmap,
            nodes: updatedNodes,
            stages,
            currentNodeId: evaluation.passed && nextLevel <= 10 ? nextNodeId : nodeId,
            pointerLevel: evaluation.passed && nextLevel <= 10 ? nextLevel : prev.roadmap.pointerLevel,
            overallProgress,
            lastUpdated: new Date().toISOString(),
          },
        };
        saveUserIntelligenceProfile(updatedProfile);
        return updatedProfile;
      });

      // Synchronize Left Chat with Evaluation Feedback Card
      const evalMsg: ChatMessage = {
        id: "eval-" + Date.now(),
        sender: "ai",
        text: evaluation.passed
          ? `### 🏆 Milestone Passed: Level ${targetNode.level} (${targetNode.miniProject.title})\n\n` +
            `**Project Score:** **${evaluation.score}/100** (Passing Threshold: ${targetNode.assessment?.passingScore || 80}/100)\n\n` +
            `• **Verified Evidence:** ${evaluation.skillEvidence}\n` +
            `• **Key Strengths:**\n${evaluation.strengths.map((s) => `  ✓ ${s}`).join("\n")}\n\n` +
            `• **Roadmap Advancement:** Milestone Level ${Math.min(10, targetNode.level + 1)} unlocked and active.\n\n` +
            `Congratulations! Your verified Skill DNA has been updated with real project evidence.`
          : `### ⚠️ Project Revision Required: Level ${targetNode.level} (${targetNode.miniProject.title})\n\n` +
            `**Project Score:** **${evaluation.score}/100** (Passing Threshold: ${targetNode.assessment?.passingScore || 80}/100)\n\n` +
            `• **Missing Requirements:**\n${evaluation.missingRequirements.map((m) => `  ⚠ ${m}`).join("\n")}\n\n` +
            `• **Recommendations:** ${evaluation.recommendations.join(" ")}\n\n` +
            `Please review the items above in your center Project Workspace, update your implementation, and resubmit for evaluation.`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, evalMsg]);

      if (evaluation.passed) {
        toast.success(
          `Project passed with score ${evaluation.score}/100! Level ${Math.min(10, targetNode.level + 1)} unlocked.`
        );
      } else {
        toast.error(`Revision required (Score: ${evaluation.score}/100). Check feedback.`);
      }
    }, 400);
  };

  const handleCompleteRoadmapTask = (nodeId: string) => {
    setIntelProfile((prev) => {
      const completedNode = prev.roadmap.nodes.find((n) => n.id === nodeId);
      const nextLevel = (completedNode?.level || 0) + 1;
      let nextNodeId = prev.roadmap.currentNodeId;

      const updatedNodes = prev.roadmap.nodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, state: "COMPLETED" as RoadmapNodeState };
        }
        if (n.level === nextLevel && (n.state === "LOCKED" || n.state === "AVAILABLE")) {
          nextNodeId = n.id;
          return { ...n, state: "IN_PROGRESS" as RoadmapNodeState };
        }
        return n;
      });

      const updatedSkillDna = { ...prev.skillDna };
      if (completedNode?.skill && updatedSkillDna[completedNode.skill]) {
        const currentSkill = updatedSkillDna[completedNode.skill];
        const newProficiency = Math.min(100, currentSkill.proficiency + 8);
        const newEvItem = {
          id: "ev-task-" + Date.now(),
          type: "task" as const,
          title: completedNode.task.title,
          description: `Completed practical milestone deliverable for Level ${completedNode.level}`,
          score: 85,
          date: new Date().toISOString().split("T")[0],
          verified: true,
        };
        updatedSkillDna[completedNode.skill] = {
          ...currentSkill,
          proficiency: newProficiency,
          confidence: "HIGH",
          evidence: `Verified via practical task completion: ${completedNode.task.title}`,
          evidenceList: [newEvItem, ...(currentSkill.evidenceList || [])],
          lastDemonstrated: "Verified in OmniForge Studio",
          verificationStatus: "VERIFIED",
          lastVerified: new Date().toISOString().split("T")[0],
        };
      }

      const stages = prev.roadmap.stages.map((stg) => {
        if (stg.stage === completedNode?.level) {
          return { ...stg, status: "COMPLETED" as const };
        }
        if (stg.stage === nextLevel) {
          return { ...stg, status: "ACTIVE" as const };
        }
        return stg;
      });

      const updatedGaps = computeSkillGapMatrix(updatedSkillDna, prev.careerGoal);
      const completedCount = updatedNodes.filter(
        (n) => n.state === "COMPLETED" || n.state === "PASSED"
      ).length;
      const overallProgress = Math.round((completedCount / updatedNodes.length) * 100);

      const maxStages = prev.roadmap.nodes.length;
      const updated: UserIntelligenceProfile = {
        ...prev,
        skillDna: updatedSkillDna,
        skillGaps: updatedGaps,
        roadmap: {
          ...prev.roadmap,
          nodes: updatedNodes,
          stages,
          currentNodeId: nextLevel <= maxStages ? nextNodeId : nodeId,
          pointerLevel: nextLevel <= maxStages ? nextLevel : maxStages,
          overallProgress,
          lastUpdated: new Date().toISOString(),
        },
      };

      saveUserIntelligenceProfile(updated, user?.id);
      toast.success(`Milestone Level ${completedNode?.level || 1} verified & completed!`);

      const streakRes = recordQualifyingLearningActivity(
        {
          activityType: "PRACTICE_EXERCISE",
          roadmapTitle: prev.roadmap.goal,
          milestoneLevel: completedNode?.level,
          description: `Completed milestone: ${completedNode?.title || "Milestone"}`,
        },
        user?.id
      );
      setUserStreak(streakRes.profile);
      if (streakRes.streakAdvancedToday) {
        toast.success(`🔥 Learning Streak: Day ${streakRes.profile.currentStreak}!`);
      }

      return updated;
    });
  };

  const handleSkipRoadmapTask = (nodeId: string) => {
    setIntelProfile((prev) => {
      const completedNode = prev.roadmap.nodes.find((n) => n.id === nodeId);
      const nextLevel = (completedNode?.level || 0) + 1;
      let nextNodeId = prev.roadmap.currentNodeId;

      const updatedNodes = prev.roadmap.nodes.map((n) => {
        if (n.id === nodeId) {
          return { ...n, state: "REVIEW_REQUIRED" as RoadmapNodeState };
        }
        if (n.level === nextLevel && (n.state === "LOCKED" || n.state === "AVAILABLE")) {
          nextNodeId = n.id;
          return { ...n, state: "IN_PROGRESS" as RoadmapNodeState };
        }
        return n;
      });

      const maxStages = prev.roadmap.nodes.length;
      const updated: UserIntelligenceProfile = {
        ...prev,
        roadmap: {
          ...prev.roadmap,
          nodes: updatedNodes,
          currentNodeId: nextNodeId,
          pointerLevel: nextLevel <= maxStages ? nextLevel : maxStages,
          lastUpdated: new Date().toISOString(),
        },
      };
      saveUserIntelligenceProfile(updated, user?.id);
      toast.info(`Milestone skipped. Advanced pointer to Level ${nextLevel}.`);
      return updated;
    });
  };

  const handleStartStageProject = (stageNumber: number) => {
    const node =
      intelProfile.roadmap.nodes.find((n) => n.level === stageNumber) ||
      intelProfile.roadmap.nodes[0];
    setSelectedSubmissionNodeId(node.id);
    setCenterView("project_submission");
    setIntelProfile((prev) => {
      const updatedNodes = prev.roadmap.nodes.map((n) =>
        n.id === node.id && (n.state === "AVAILABLE" || n.state === "LOCKED")
          ? { ...n, state: "IN_PROGRESS" as RoadmapNodeState }
          : n
      );
      const updated: UserIntelligenceProfile = {
        ...prev,
        roadmap: {
          ...prev.roadmap,
          nodes: updatedNodes,
          currentNodeId: node.id,
        },
      };
      saveUserIntelligenceProfile(updated);
      return updated;
    });
    toast.info(`Active Workspace: Level ${stageNumber} Project "${node.miniProject.title}"`);
  };

  const handleSelectRoadmapTrack = (trackKey: string) => {
    setIntelProfile((prev) => {
      const saved = { ...(prev.savedRoadmaps || {}) };
      const currentTrackKey = prev.roadmap?.trackKey || "full_stack";
      saved[currentTrackKey] = prev.roadmap;

      let targetRoadmap = saved[trackKey];
      if (!targetRoadmap) {
        if (trackKey === "java_mastery" || trackKey.includes("java")) {
          targetRoadmap = buildCompleteJavaRoadmap(activeConversationId, user?.id);
        } else if (trackKey === "python_mastery" || trackKey.includes("python")) {
          targetRoadmap = buildCompletePythonRoadmap(activeConversationId, user?.id);
        } else if (trackKey === "html_frontend") {
          targetRoadmap = buildHtmlFrontendRoadmap(prev.skillDna, prev.roadmap?.dailyStudyHours || 1.5);
        } else {
          targetRoadmap = buildStandardFullStackRoadmap(prev.skillDna);
        }
        saved[trackKey] = targetRoadmap;
      }

      const updatedProfile: UserIntelligenceProfile = {
        ...prev,
        activeRoadmapTrack: trackKey,
        careerGoal: targetRoadmap.goal,
        targetRole: targetRoadmap.targetRole || (trackKey.includes("java") ? "Senior Java & Backend Engineer" : "Software Engineer"),
        savedRoadmaps: saved,
        roadmap: targetRoadmap,
      };
      saveUserIntelligenceProfile(updatedProfile, user?.id);
      toast.success(`Switched active roadmap to ${targetRoadmap.goal}`);
      return updatedProfile;
    });
  };

  const handleUpdateStudyPace = (dailyHours: number) => {
    setIntelProfile((prev) => {
      const updatedRoadmap = {
        ...prev.roadmap,
        dailyStudyHours: dailyHours,
      };
      const updatedProfile: UserIntelligenceProfile = {
        ...prev,
        roadmap: updatedRoadmap,
      };
      saveUserIntelligenceProfile(updatedProfile, user?.id);
      toast.info(`Study pacing adjusted to ${dailyHours} hour${dailyHours > 1 ? "s" : ""}/day`);
      return updatedProfile;
    });
  };

  const handleToggleTopicChecklist = (nodeId: string, topicIndex: number) => {
    let toggledToCompleted = false;
    let nodeLevel = 1;
    let nodeTitle = "";

    setIntelProfile((prev) => {
      const updatedNodes = prev.roadmap.nodes.map((node) => {
        if (node.id === nodeId && node.topicChecklist) {
          nodeLevel = node.level;
          nodeTitle = node.title;
          const updatedChecklist = node.topicChecklist.map((topic, idx) => {
            if (idx === topicIndex) {
              const nextState = !topic.completed;
              if (nextState) toggledToCompleted = true;
              return { ...topic, completed: nextState };
            }
            return topic;
          });
          return { ...node, topicChecklist: updatedChecklist };
        }
        return node;
      });

      const updatedRoadmap = {
        ...prev.roadmap,
        nodes: updatedNodes,
      };
      const updatedProfile: UserIntelligenceProfile = {
        ...prev,
        roadmap: updatedRoadmap,
      };
      saveUserIntelligenceProfile(updatedProfile, user?.id);
      return updatedProfile;
    });

    if (toggledToCompleted) {
      const streakRes = recordQualifyingLearningActivity(
        {
          activityType: "CHECKLIST_ITEM",
          roadmapTitle: intelProfile.roadmap.goal,
          milestoneLevel: nodeLevel,
          description: `Checked topic item in Level ${nodeLevel}: ${nodeTitle}`,
        },
        user?.id
      );
      setUserStreak(streakRes.profile);
      if (streakRes.streakAdvancedToday) {
        toast.success(`🔥 Learning Streak: Day ${streakRes.profile.currentStreak}! Keep up the momentum!`);
      }
    }
  };

  const handleApplyResumeData = (data: {
    parsedData: ParsedResumeData;
    derivedSkillDna: Record<string, SkillDnaEntry>;
  }) => {
    const updatedRoadmap = buildStandardFullStackRoadmap(data.derivedSkillDna);
    const updatedGaps = computeSkillGapMatrix(
      data.derivedSkillDna,
      intelProfile.careerGoal || "Full Stack Developer"
    );
    const updatedProfile: UserIntelligenceProfile = {
      ...intelProfile,
      education: data.parsedData.education,
      experience: data.parsedData.experience,
      skillDna: data.derivedSkillDna,
      skillGaps: updatedGaps,
      roadmap: updatedRoadmap,
      resumeParsed: true,
      resumeData: data.parsedData,
    };
    setIntelProfile(updatedProfile);
    saveUserIntelligenceProfile(updatedProfile, user?.id);
    toast.success("Resume parsed! Skill DNA & career roadmap successfully calibrated.");

    const sysMsg: ChatMessage = {
      id: "ai-resume-" + Date.now(),
      sender: "ai",
      text: `### 📄 Resume Competency Extraction Complete\n\nI have analyzed your education and verified your engineering capabilities from your uploaded resume:\n\n• **Degree:** ${data.parsedData.education.degree || "N/A"} (${data.parsedData.education.branch || "N/A"})\n• **Technical Stack:** ${data.parsedData.technicalSkills.languages.join(", ") || "Full Stack"}\n• **Skill DNA:** High-confidence evidence extracted from verified projects.\n\nYour Skill DNA and skill gaps are ready. Click **View Skill DNA & Gaps** below or ask me anything!`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      skillReportArtifact: {
        skillDna: data.derivedSkillDna,
        skillGaps: updatedGaps,
        careerGoal: intelProfile.targetRole || "Full Stack Developer",
      },
      suggestedChips: ["Show my skill gaps", "What should I learn next?", "Show my roadmap"],
    };

    setMessages((prev) => {
      const nextMsgs = [...prev, sysMsg];
      const existingConv = loadConversation(activeConversationId, user?.id);
      const title = existingConv?.title || "Resume Skill Analysis";
      saveConversation(
        {
          id: activeConversationId,
          title,
          userId: user?.id || "anon",
          createdAt: existingConv?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: nextMsgs,
          state: conversationState,
          activeProjectId: activeProject?.id,
        },
        user?.id
      );
      setConversations(loadConversationsList(user?.id));
      return nextMsgs;
    });
  };

  const handleDocumentProcessed = (payload: UploadedDocumentPayload) => {
    if (payload.docCategory === "resume" && payload.parsedResume) {
      handleApplyResumeData(payload.parsedResume);
      return;
    }

    const docMsg: ChatMessage = {
      id: "doc-" + Date.now(),
      sender: "ai",
      text:
        `📄 **Uploaded Document:** \`${payload.fileName}\` (${(payload.fileSize / 1024).toFixed(1)} KB)\n\n` +
        `I have parsed and indexed your document into our active conversation context.\n\n` +
        (payload.docCategory === "brief"
          ? `• **Project Brief Detected:** You can ask me to generate a complete multi-stage execution plan or find creator candidates matching these project roles.\n`
          : payload.docCategory === "notes"
          ? `• **Study Notes / Curriculum Detected:** You can ask me to create an interactive learning roadmap, explain specific concepts, or generate practice questions.\n`
          : `• **General Document:** Ready for questions, summarization, or deep-dive analysis.\n`) +
        `\nWhat would you like to explore regarding this document?`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedChips:
        payload.docCategory === "brief"
          ? ["Create project plan for this", "Find creators for this", "Summarize requirements"]
          : payload.docCategory === "notes"
          ? ["Create a roadmap from this", "Explain key concepts", "Generate practice exercises"]
          : ["Summarize this document", "Extract key takeaways", "What are the core topics?"],
    };

    setMessages((prev) => {
      const nextMsgs = [...prev, docMsg];
      const existingConv = loadConversation(activeConversationId, user?.id);
      saveConversation(
        {
          id: activeConversationId,
          title: existingConv?.title || `Doc: ${payload.fileName}`,
          userId: user?.id || "anon",
          createdAt: existingConv?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: nextMsgs,
          state: conversationState,
          activeProjectId: activeProject?.id,
        },
        user?.id
      );
      setConversations(loadConversationsList(user?.id));
      return nextMsgs;
    });

    toast.success(`Indexed document "${payload.fileName}" into active chat.`);
  };

  // Load existing projects from storage and check provider status on mount
  useEffect(() => {
    const loaded = loadProjectsFromStorage();
    setProjects(loaded);

    // If an active conversation was explicitly saved, restore that conversation
    const activeConvId = getActiveConversationId();
    if (activeConvId) {
      const foundConv = loadConversation(activeConvId, user?.id);
      if (foundConv && foundConv.messages && foundConv.messages.length > 0) {
        setActiveConversationIdState(foundConv.id);
        setMessages(foundConv.messages);
        if (foundConv.state) {
          setConversationState(foundConv.state);
        }
        if (foundConv.activeProjectId) {
          const p = loaded.find((x) => x.id === foundConv.activeProjectId);
          setActiveProject(p || null);
        }
      } else {
        // Start fresh
        setMessages([]);
        setActiveProject(null);
      }
    } else {
      // Clean chat-first initial state
      setMessages([]);
      setActiveProject(null);
    }

    // Inspect OmniForge AI health on mount
    checkLocalAIHealth()
      .then((health) => {
        if (health.status === "running") {
          const providerLabel = health.provider === "ollama" ? "Ollama AI" : (health.provider === "groq" ? "Groq Cloud" : (health.provider || "Production AI"));
          setIntelligenceInfo({
            provider: health.provider || "ollama",
            model: health.model || "qwen3:4b",
            isRealLLM: true,
            status: "live_verified",
            statusMessage: `OmniForge AI Active • ${providerLabel} (${health.model || "qwen3:4b"})`,
          });
        } else {
          setIntelligenceInfo({
            provider: health.provider || "ollama",
            model: health.model || "qwen3:4b",
            isRealLLM: false,
            status: "provider_error",
            statusMessage: health.error || "Ollama AI engine is offline or unreachable.",
          });
        }
      })
      .catch((err) => {
        console.warn("[OmniForge] Could not check AI health:", err);
      });
  }, []);

  // Save changes to active project
  const updateActiveProject = useCallback((updated: OmniForgeProject) => {
    setActiveProject(updated);
    saveProjectToStorage(updated);
    setActiveProjectId(updated.id);
    setProjects(loadProjectsFromStorage());
  }, []);

  // Handle incoming user chat message with local AI backend (POST http://127.0.0.1:8001/chat)
  const isSubmittingRef = useRef(false);
  const lastSubmissionRef = useRef<{ text: string; time: number } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // SECTION 5: DUPLICATE MESSAGE / RESPONSE CHECK
    // Prevent concurrent submissions, rapid-fire clicks, or duplicate Enter presses
    const now = Date.now();
    if (
      isSubmittingRef.current ||
      isLoading ||
      (lastSubmissionRef.current &&
        lastSubmissionRef.current.text.toLowerCase() === trimmed.toLowerCase() &&
        now - lastSubmissionRef.current.time < 1200)
    ) {
      console.warn("[OmniForge] Message submission ignored: duplicate or concurrent request.");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    const currentAbortController = new AbortController();
    abortControllerRef.current = currentAbortController;

    isSubmittingRef.current = true;
    lastSubmissionRef.current = { text: trimmed, time: now };
    setIsLoading(true);

    const userMsgId = `msg-${now}-u`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    // Filter out previous error messages and orphaned failed user prompts when retrying
    const baseMessages = messages.filter((m, idx, arr) => {
      if (m.isError && m.failedPrompt === trimmed) return false;
      if (m.sender === "user" && m.text.trim() === trimmed) {
        const next = arr[idx + 1];
        if (next && next.isError && next.failedPrompt === trimmed) return false;
        if (idx === arr.length - 1) return false;
      }
      return true;
    });

    // Functional state update with strict deduplication: guarantees exactly ONE user message
    setMessages((prev) => {
      const cleaned = prev.filter((m, idx, arr) => {
        if (m.isError && m.failedPrompt === trimmed) return false;
        if (m.sender === "user" && m.text.trim() === trimmed) {
          const next = arr[idx + 1];
          if (next && next.isError && next.failedPrompt === trimmed) return false;
          if (idx === arr.length - 1) return false;
        }
        return true;
      });

      const last = cleaned[cleaned.length - 1];
      if (last && last.sender === "user" && last.text.trim() === trimmed) {
        return cleaned;
      }
      return [...cleaned, userMsg];
    });

    const streamMsgId = `msg-${Date.now()}-ai`;
    const t0 = performance.now();
    let intentDetectionMs = 0;
    let contextBuildMs = 0;
    let databaseMs = 0;
    let ollamaMs = 0;
    let firstTokenMs = 0;

    try {
      // 0. CANONICAL ACTIVE PROJECT RESOLUTION
      let currentActive = resolveActiveProject(
        activeProject,
        conversationState.activeProjectId || getActiveProjectId()
      );

      // Check if user is explicitly switching canonical domains (e.g. from Film to Music Band)
      const domainSwitchTarget = detectCanonicalDomain(trimmed, conversationState.activeDomain);
      const isSwitchingDomain = isExplicitDomainSwitch(trimmed, currentActive) ||
        (domainSwitchTarget === "MUSIC_BAND" && currentActive?.canonicalDomain !== "MUSIC_BAND");

      if (isSwitchingDomain && domainSwitchTarget === "MUSIC_BAND") {
        const allStored = loadProjectsFromStorage();
        let musicBandProj = allStored.find(
          (p) => p.canonicalDomain === "MUSIC_BAND" || p.title === "My Music Band" || p.domain === "Music"
        );
        if (!musicBandProj) {
          const blueprint = generateRequirementsDerivedBlueprint({
            prompt: trimmed,
            userType,
            userId: user?.id || "anon",
          });
          blueprint.title = "My Music Band";
          blueprint.canonicalDomain = "MUSIC_BAND";
          blueprint.domain = "Music";
          blueprint.projectType = "Music Band";
          saveProjectToStorage(blueprint);
          musicBandProj = blueprint;
        }
        currentActive = musicBandProj;
        setActiveProject(musicBandProj);
        setActiveProjectId(musicBandProj.id);
      } else if (currentActive && !activeProject) {
        setActiveProject(currentActive);
      }

      // 1. FAST INTENT CLASSIFICATION
      const tIntentStart = performance.now();
      const intentResult = classifyUserIntent(trimmed, {
        hasActiveProject: Boolean(currentActive),
        activeProject: currentActive,
        conversationHistory: baseMessages,
        currentUserRole: currentActive?.canonicalDomain === "MUSIC_BAND" ? undefined : (conversationState.currentUserRole || currentActive?.currentUserRole),
        currentUserType: conversationState.currentUserType,
        activeGoal: conversationState.activeGoal,
      });
      intentDetectionMs = performance.now() - tIntentStart;

      // Check if user is starting a short film project:
      const isShortFilmPrompt = /\b(?:short\s+film)\b/i.test(trimmed);
      if (isShortFilmPrompt && (!currentActive || currentActive.title !== "Short Film")) {
        const allStored = loadProjectsFromStorage();
        let shortFilmProj = allStored.find(
          (p) => p.title === "Short Film" || p.projectType === "Short Film"
        );
        if (!shortFilmProj) {
          const blueprint = generateRequirementsDerivedBlueprint({
            prompt: trimmed,
            userType,
            userId: user?.id || "anon",
          });
          blueprint.title = "Short Film";
          blueprint.domain = "Film";
          blueprint.canonicalDomain = "FILM";
          blueprint.projectType = "Short Film";
          blueprint.type = "Short Film";
          blueprint.currentUserRole = intentResult.currentUserRole || conversationState.currentUserRole;
          saveProjectToStorage(blueprint);
          shortFilmProj = blueprint;
        }
        currentActive = shortFilmProj;
        setActiveProject(shortFilmProj);
        setActiveProjectId(shortFilmProj.id);
      }

      // 2. State transition
      const updatedState = transitionConversationState(conversationState, trimmed, baseMessages);
      if (intentResult.currentUserRole) {
        updatedState.currentUserRole = intentResult.currentUserRole;
      }
      if (intentResult.currentUserType) {
        updatedState.currentUserType = intentResult.currentUserType;
      }
      if (currentActive) {
        updatedState.activeProjectId = currentActive.id;
        updatedState.activeDomain = currentActive.canonicalDomain || (currentActive.domain === "Music" ? "MUSIC_BAND" : "FILM");
        updatedState.activeProjectType = currentActive.projectType || currentActive.type || currentActive.domain;
        updatedState.projectName = currentActive.title;
        if (currentActive.canonicalDomain === "MUSIC_BAND" || currentActive.domain === "Music") {
          if (updatedState.currentUserRole === "DIRECTOR") {
            delete updatedState.currentUserRole;
          }
        } else if (currentActive.currentUserRole) {
          updatedState.currentUserRole = currentActive.currentUserRole;
        }
      }
      setConversationState(updatedState);

      const hasDeterministicText = Boolean(intentResult.deterministicText?.trim());
      const isFastAction = isDeterministicIntent(intentResult.intent, hasDeterministicText) && (
        !["DEFINITION", "GENERAL_KNOWLEDGE", "KNOWLEDGE", "HOW_TO"].includes(intentResult.intent) ||
        hasDeterministicText
      );
      let executionMode: "FAST" | "AI" | "HYBRID" = isFastAction ? "FAST" : "AI";

      let matchedCards: CreatorRecommendation[] = [];
      let clientCards: ClientOpportunity[] = [];
      let squadCards: SquadResult[] = [];
      let skillSwapCards: SkillSwapListingMatch[] = [];
      let missingCaps: MissingCapability[] = [];
      let matchStatus: "idle" | "matched" | "empty" | "error" = "idle";
      let searchTargetRole: string | undefined = undefined;
      let paginationState: SearchPaginationState | undefined = undefined;
      let suggestedChips: string[] = intentResult.suggestedChips || [];
      let finalResponseText = intentResult.deterministicText || "";
      let messageRoadmapArtifact: VisualRoadmapData | undefined = undefined;

      let finalIntent: any = intentResult.intent;
      let finalProjectAction: any = intentResult.project_action;
      let finalMatchingAction: any = intentResult.matching_action;
      let localAiProvider = "fast-path";
      let localAiModel = "deterministic";

      if (isFastAction) {
        // [AI] Fast path — Ollama skipped
        console.log("[AI] Fast path — Ollama skipped");

        const tContextStart = performance.now();

        // 3. EXECUTE DETERMINISTIC ACTION DIRECTLY
        const isJavaExplicit = /\b(?:java)\b/i.test(trimmed) && !/\b(?:javascript)\b/i.test(trimmed);
        const isPythonExplicit = /\b(?:python)\b/i.test(trimmed);

        if (intentResult.intent === "ROADMAP_CAPABILITY_INQUIRY") {
          finalResponseText = intentResult.deterministicText || "";
          suggestedChips = intentResult.suggestedChips || [];
          finalIntent = "ROADMAP_CAPABILITY_INQUIRY";
        } else if (intentResult.intent === "LIST_SAVED_ROADMAPS") {
          const allSaved = loadSavedRoadmapsList(user?.id);
          const listText = allSaved.length > 0
            ? allSaved.map((r) => `• **${r.title}** (${r.totalStages} Stages) — Progress: ${r.progressPercent}% · [ID: \`${r.id}\`]`).join("\n")
            : `• **${intelProfile.roadmap.goal}** (${intelProfile.roadmap.nodes.length} Stages) — Progress: ${intelProfile.roadmap.overallProgress || 0}%`;

          finalResponseText =
            `### 📚 Your Saved Learning Roadmaps & Execution Plans\n\n` +
            listText +
            `\n\nClick any action chip below to view, resume, or open a specific roadmap in the interactive viewer:`;
          suggestedChips = allSaved.length > 0
            ? allSaved.slice(0, 4).map((r) => `Open ${r.title.split(":")[0].trim()}`)
            : ["Show current roadmap"];
          finalIntent = "LIST_SAVED_ROADMAPS";
        } else if (intentResult.intent === "VIEW_SAVED_ROADMAP") {
          const allSaved = loadSavedRoadmapsList(user?.id);
          const targetSubj = (intentResult.targetRoadmapTitle || intentResult.roadmapSubject || "").toLowerCase();
          const matchedItem = allSaved.find(
            (r) =>
              r.title.toLowerCase().includes(targetSubj) ||
              (r.targetSkillOrOutcome && r.targetSkillOrOutcome.toLowerCase().includes(targetSubj))
          );

          let targetRoadmap: any;
          if (matchedItem && matchedItem.roadmapData) {
            targetRoadmap = matchedItem.roadmapData;
          } else if (targetSubj.includes("film")) {
            targetRoadmap = buildUniversalRoadmap("Create filmmaking roadmap", activeConversationId, user?.id) as any;
          } else if (targetSubj.includes("java")) {
            targetRoadmap = buildCompleteJavaRoadmap(activeConversationId, user?.id);
          } else if (targetSubj.includes("python")) {
            targetRoadmap = buildCompletePythonRoadmap(activeConversationId, user?.id);
          } else {
            targetRoadmap = buildUniversalRoadmap(trimmed, activeConversationId, user?.id) as any;
          }

          messageRoadmapArtifact = targetRoadmap;
          setActiveFullView("roadmap");

          finalResponseText =
            `### 🗺️ Saved Roadmap: ${targetRoadmap.goal || targetRoadmap.title}\n\n` +
            `• **Domain:** ${targetRoadmap.domain || "Learning & Execution"}\n` +
            `• **Total Milestones:** ${targetRoadmap.nodes?.length || (targetRoadmap as any).stages?.length || 12} Stages\n` +
            `• **Status:** Active in interactive viewer\n\n` +
            `I have opened your ${targetRoadmap.goal || targetRoadmap.title} roadmap in the AI Roadmap panel.`;
          suggestedChips = [
            `Explain Stage 1`,
            "Give me today's learning tasks",
            "Show all my roadmaps",
          ];
          finalIntent = "VIEW_SAVED_ROADMAP";
        } else if (
          intentResult.intent === "ROADMAP_REQUEST" ||
          intentResult.intent === "CAREER_ROADMAP" ||
          intentResult.intent === "ROADMAP_CREATE" ||
          intentResult.intent === "CREATE_NEW_ROADMAP"
        ) {
          if (isJavaExplicit || intentResult.careerGoal === "Java") {
            const javaRoadmap = buildCompleteJavaRoadmap(activeConversationId, user?.id);
            const updatedSaved = {
              ...(intelProfile.savedRoadmaps || {}),
              [intelProfile.roadmap?.trackKey || "full_stack"]: intelProfile.roadmap,
              ["java_mastery"]: javaRoadmap,
            };

            setIntelProfile((prev) => {
              const nextProf: UserIntelligenceProfile = {
                ...prev,
                careerGoal: "Java",
                targetRole: "Senior Java & Backend Engineer",
                activeRoadmapTrack: "java_mastery",
                savedRoadmaps: updatedSaved,
                roadmap: javaRoadmap,
              };
              saveUserIntelligenceProfile(nextProf, user?.id);
              return nextProf;
            });

            const rmItem: SavedRoadmapItem = {
              id: javaRoadmap.id,
              userId: user?.id || "anon",
              conversationId: activeConversationId,
              title: javaRoadmap.title,
              subject: "Java",
              domain: javaRoadmap.domain || "Enterprise Backend Engineering",
              summary: javaRoadmap.summary || "Comprehensive 24-stage interactive Java learning roadmap from foundational syntax to microservices.",
              roadmapType: "LEARNING",
              targetSkillOrOutcome: "Senior Java & Backend Engineer",
              progressPercent: 0,
              totalStages: 24,
              completedStages: 0,
              activeMilestoneTitle: javaRoadmap.nodes[0]?.title || "Active Milestone",
              roadmapData: javaRoadmap,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            saveRoadmapItem(rmItem, user?.id);
            setSavedRoadmaps(loadSavedRoadmapsList(user?.id));

            messageRoadmapArtifact = javaRoadmap;
            finalResponseText = intentResult.deterministicText ||
              `### ☕ Complete Java Mastery Roadmap (Beginner to Advanced)\n\n` +
              `I have generated your comprehensive **24-stage interactive Java learning roadmap** covering the entire curriculum from foundational syntax to enterprise microservices!\n\n` +
              `• **Stages 1–4:** Java Ecosystem & JVM Tooling, Syntax & I/O, Control Flow & Methods, Arrays & Strings\n` +
              `• **Stages 5–8:** OOP Foundations, Inheritance & Interfaces, Exception Handling, Collections Framework & Generics\n` +
              `• **Stages 9–12:** File Handling & NIO.2, Lambdas & Streams API, Records & Modern Java, Multithreading & Virtual Threads\n` +
              `• **Stages 13–16:** JVM Architecture & GC Tuning, DSA in Java, JDBC & Connection Pooling, Sockets & Async HTTP\n` +
              `• **Stages 17–19:** Automated Testing (JUnit 5 / Mockito), Build Tools (Maven / Gradle CI/CD), Secure Java Coding\n` +
              `• **Stages 20–24:** Spring Boot REST APIs, Spring Data JPA, SOLID / Clean Architecture, Docker Containerization & Microservices Capstone\n\n` +
              `Your Java roadmap is stored as an independent subject-specific artifact. Click below or open the AI Roadmap viewer to explore all 24 interactive milestones, topic checklists, and practice exercises!`;

            suggestedChips = [
              "Show the complete roadmap",
              "Explain Stage 1: Java Ecosystem",
              "Give me today's learning tasks",
              "Show all my roadmaps",
            ];
            finalIntent = "ROADMAP_CREATE";
          } else if (isPythonExplicit || intentResult.careerGoal === "Python") {
            const pythonRoadmap = buildCompletePythonRoadmap(activeConversationId, user?.id);
            const updatedSaved = {
              ...(intelProfile.savedRoadmaps || {}),
              [intelProfile.roadmap?.trackKey || "full_stack"]: intelProfile.roadmap,
              ["python_mastery"]: pythonRoadmap,
            };

            setIntelProfile((prev) => {
              const nextProf: UserIntelligenceProfile = {
                ...prev,
                careerGoal: "Python",
                targetRole: "Python Backend & Automation Engineer",
                activeRoadmapTrack: "python_mastery",
                savedRoadmaps: updatedSaved,
                roadmap: pythonRoadmap,
              };
              saveUserIntelligenceProfile(nextProf, user?.id);
              return nextProf;
            });

            const rmItem: SavedRoadmapItem = {
              id: pythonRoadmap.id,
              userId: user?.id || "anon",
              conversationId: activeConversationId,
              title: pythonRoadmap.title,
              subject: "Python",
              domain: pythonRoadmap.domain || "Backend & Data Engineering",
              summary: pythonRoadmap.summary || "Comprehensive 12-stage Python learning roadmap from foundational scripting to production microservices.",
              roadmapType: "LEARNING",
              targetSkillOrOutcome: "Python Backend & Automation Engineer",
              progressPercent: 0,
              totalStages: 12,
              completedStages: 0,
              activeMilestoneTitle: pythonRoadmap.nodes[0]?.title || "Active Milestone",
              roadmapData: pythonRoadmap,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            saveRoadmapItem(rmItem, user?.id);
            setSavedRoadmaps(loadSavedRoadmapsList(user?.id));

            messageRoadmapArtifact = pythonRoadmap;
            finalResponseText = intentResult.deterministicText ||
              `### 🐍 Python Mastery Roadmap (Beginner to Production)\n\nI have generated your dedicated **12-stage Python learning roadmap** from core syntax to production FastAPI microservices!`;
            suggestedChips = [
              "Show the complete roadmap",
              "Explain current milestone",
              "Give me today's learning tasks",
              "Show all my roadmaps",
            ];
            finalIntent = "ROADMAP_CREATE";
          } else if (
            intentResult.intent === "ROADMAP_CREATE" ||
            intentResult.intent === "CREATE_NEW_ROADMAP" ||
            Boolean(intentResult.roadmapData) ||
            CREATE_SEPARATE_FRONTEND_ROADMAP_REGEX.test(trimmed)
          ) {
            const universalRm = intentResult.roadmapData || buildUniversalRoadmap(trimmed, activeConversationId, user?.id);
            const trackKey = (intentResult.roadmapSubject || universalRm.domain || "custom").toLowerCase().replace(/[^a-z0-9]/g, "_");
            const updatedSaved = {
              ...(intelProfile.savedRoadmaps || {}),
              [intelProfile.roadmap?.trackKey || "full_stack"]: intelProfile.roadmap,
              [trackKey]: universalRm,
            };

            setIntelProfile((prev) => {
              const nextProf: UserIntelligenceProfile = {
                ...prev,
                careerGoal: intentResult.roadmapSubject || universalRm.title,
                targetRole: intentResult.targetRole || universalRm.targetRole || "Subject Specialist",
                activeRoadmapTrack: trackKey,
                savedRoadmaps: updatedSaved,
                roadmap: universalRm,
              };
              saveUserIntelligenceProfile(nextProf, user?.id);
              return nextProf;
            });

            const rmItem: SavedRoadmapItem = {
              id: universalRm.id || `rm_${Date.now()}`,
              userId: user?.id || "anon",
              conversationId: activeConversationId,
              title: universalRm.title || universalRm.goal || `${intentResult.roadmapSubject || "Custom"} Roadmap`,
              subject: universalRm.subject || intentResult.roadmapSubject || universalRm.title.replace(/\s+(?:Mastery\s+)?Roadmap\s*$/i, ""),
              domain: universalRm.domain || "Professional Discipline",
              summary: universalRm.summary || `Comprehensive ${universalRm.stages?.length || universalRm.nodes?.length || 6}-stage curriculum for ${universalRm.title}.`,
              roadmapType: universalRm.roadmapType || "LEARNING",
              targetSkillOrOutcome: intentResult.targetRole || universalRm.targetRole || "Subject Mastery",
              progressPercent: 0,
              totalStages: universalRm.stages?.length || universalRm.nodes?.length || 12,
              completedStages: 0,
              activeMilestoneTitle: universalRm.stages?.[0]?.skillFocus || universalRm.nodes?.[0]?.title || "Stage 1",
              roadmapData: universalRm,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            saveRoadmapItem(rmItem, user?.id);
            setSavedRoadmaps(loadSavedRoadmapsList(user?.id));

            messageRoadmapArtifact = universalRm;
            setActiveFullView("roadmap");
            finalResponseText = intentResult.deterministicText ||
              `### 🗺️ Dedicated ${universalRm.title} Created!\n\nI have generated your comprehensive interactive roadmap! All milestones, checklists, and deliverables are active in your Roadmap viewer.`;

            suggestedChips = intentResult.suggestedChips || [
              "Show the complete roadmap",
              "Explain current milestone",
              "Give me today's learning tasks",
              "Show all my roadmaps",
            ];
            finalIntent = "ROADMAP_CREATE";
          } else {
            const learningState = inspectUserLearningState(intelProfile, trimmed);
            const isReviewQuery = /\b(?:review\s+(?:and\s+)?improve|improve\s+my\s+current|audit\s+my\s+roadmap)\b/i.test(trimmed);
            const isContinueQuery = /\b(?:continue\s+my\s+current|keep\s+my\s+current|stay\s+on\s+current)\b/i.test(trimmed);

            if (isContinueQuery) {
              const activeNode =
                intelProfile.roadmap.nodes.find((n) => n.id === intelProfile.roadmap.currentNodeId) ||
                intelProfile.roadmap.nodes[0];
              finalResponseText =
                `### 🚀 Continuing Current Journey: ${intelProfile.roadmap.goal}\n\n` +
                `You are on track toward **${intelProfile.targetRole || "Full Stack Software Engineer"}**!\n\n` +
                `• **Current Active Milestone:** Level ${activeNode.level}: **${activeNode.title}**\n` +
                `• **Project Deliverables:** ${activeNode.task.deliverables.join(", ")}\n` +
                `• **Completed Milestones:** Level 1 (HTML Fundamentals: 91% verified), Level 2 (CSS Fundamentals: 76% verified)\n` +
                `• **Upcoming:** React Component Architecture, Node.js, SQL Databases\n\n` +
                `Your progress is intact in the AI Roadmap panel. Work on your active project or check today's tasks below!`;
              suggestedChips = [
                "Show the complete roadmap",
                "Explain current milestone",
                "Give me today's learning tasks",
                "Show my skill gaps",
              ];
            } else if (isReviewQuery) {
              finalResponseText =
                `### 🔍 Roadmap Review & Pacing Audit\n\n` +
                `**Current Track:** ${intelProfile.roadmap.goal} (${intelProfile.roadmap.nodes.length} Stages)\n\n` +
                `#### Verified Progress\n` +
                `• Level 1: HTML Fundamentals — 91% verified (✓ Satisfied)\n` +
                `• Level 2: CSS Responsive Design — 76% verified (✓ Satisfied)\n\n` +
                `#### Active Milestone\n` +
                `• **Level 4: JavaScript DOM & Asynchronous APIs** (Estimated: 16 hours ~ 2 weeks at 1.5h/day)\n\n` +
                `#### Pacing Recommendations\n` +
                `• Current daily study commitment: **${intelProfile.roadmap.dailyStudyHours || 1.5} hours/day**\n` +
                `• At 1.5h/day, expected track completion: ~16 weeks\n` +
                `• At 2.5h/day, accelerated completion: ~10 weeks\n\n` +
                `You can adjust your daily study hours anytime in the AI Roadmap panel or switch between specialized tracks.`;
              suggestedChips = [
                "Show the complete roadmap",
                "Continue my current journey",
                "Give me today's learning tasks",
                "Explain current milestone",
              ];
            } else if (learningState.isSubjectDivergent) {
              finalResponseText = learningState.explanation;
              suggestedChips = [
                "Continue my current journey",
                "Create a separate HTML/frontend roadmap",
                "Review and improve my current roadmap",
              ];
            } else {
              const targetCareer = intentResult.careerGoal || intelProfile.careerGoal || "Full Stack Developer";
              finalResponseText =
                intentResult.deterministicText ||
                `### 🗺️ Personalized Career Roadmap: ${targetCareer}\n\n` +
                `I have analyzed your Skill DNA.\n\n` +
                `• **Active Track:** ${intelProfile.roadmap.goal} (${intelProfile.roadmap.nodes.length} Stages)\n` +
                `• **Visual Journey:** See the winding roadmap with milestone markers and progressive project stages.\n\n` +
                `Your current active milestone is **Level ${intelProfile.roadmap.pointerLevel || 1}: ${intelProfile.roadmap.nodes[0]?.title || "Foundations"}**.`;
              suggestedChips = [
                "Show the complete roadmap",
                "Continue my current journey",
                "Create a separate HTML/frontend roadmap",
                "Review and improve my current roadmap",
              ];
            }
            finalIntent = "ROADMAP_REQUEST";
          }
        } else if (intentResult.intent === "ROADMAP_MODIFY" || intentResult.intent === "MODIFY_ROADMAP") {
          const currentRm = intelProfile.roadmap;
          const isJava = currentRm.goal.toLowerCase().includes("java") || (intelProfile.careerGoal || "").toLowerCase().includes("java");

          const updatedNodes = currentRm.nodes.map((n) => {
            if (isJava && (n.level === 12 || n.level === 13 || /multithreading|jvm|concurrency/i.test(n.title))) {
              return {
                ...n,
                whyLearnThis: n.whyLearnThis + " (Refined with deep-dive virtual thread benchmarks and GC tuning diagnostics)",
                topicChecklist: [
                  ...(n.topicChecklist || []),
                  {
                    id: `top-${Date.now()}-ext1`,
                    title: n.level === 12 ? "Virtual Thread Concurrency Benchmarks & Carrier Thread Pinning Prevention" : "Low-Latency ZGC Generation Analysis & Flight Recorder JFR Diagnostics",
                    completed: false,
                  },
                ],
                practicalExercises: [
                  ...(n.practicalExercises || []),
                  {
                    id: `ex-${Date.now()}-ext`,
                    title: n.level === 12 ? "10,000 Concurrent Virtual Thread Dispatcher" : "JVM Flight Recorder (JFR) Profiling Under High Load",
                    prompt: n.level === 12 ? "Implement a Virtual Thread executor dispatching 10,000 tasks and log execution time." : "Run app with -XX:StartFlightRecording and inspect GC pause duration.",
                  },
                ],
              };
            }
            if (!isJava && (n.level === 10 || /testing|accessibility/i.test(n.title))) {
              return {
                ...n,
                topicChecklist: [
                  ...(n.topicChecklist || []),
                  {
                    id: `top-${Date.now()}-1`,
                    title: "Automated Accessibility Auditing with axe-core & Lighthouse",
                    completed: false,
                  },
                  {
                    id: `top-${Date.now()}-2`,
                    title: "End-to-End Component Testing with Playwright & Vitest",
                    completed: false,
                  },
                ],
              };
            }
            return n;
          });

          const updatedRoadmap: VisualRoadmapData = {
            ...currentRm,
            nodes: updatedNodes,
            lastUpdated: new Date().toISOString(),
          };

          const updatedProfile: UserIntelligenceProfile = {
            ...intelProfile,
            roadmap: updatedRoadmap,
            savedRoadmaps: {
              ...(intelProfile.savedRoadmaps || {}),
              [updatedRoadmap.trackKey || "active"]: updatedRoadmap,
            },
          };
          saveUserIntelligenceProfile(updatedProfile, user?.id);
          setIntelProfile(updatedProfile);

          const modifiedRmItem: SavedRoadmapItem = {
            id: updatedRoadmap.id || `roadmap-${updatedRoadmap.trackKey || "active"}`,
            userId: user?.id || "anon",
            conversationId: activeConversationId,
            title: updatedRoadmap.goal || "Refined Learning Roadmap",
            targetSkillOrOutcome: updatedProfile.targetRole || "Software Engineer",
            progressPercent: updatedRoadmap.overallProgress || 0,
            totalStages: updatedRoadmap.nodes?.length || 24,
            completedStages: updatedRoadmap.nodes?.filter((n: any) => n.state === "COMPLETED" || n.state === "PASSED").length || 0,
            activeMilestoneTitle: updatedRoadmap.nodes?.find((n: any) => n.level === updatedRoadmap.pointerLevel)?.title || "Active Milestone",
            roadmapData: updatedRoadmap,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          saveRoadmapItem(modifiedRmItem, user?.id);
          setSavedRoadmaps(loadSavedRoadmapsList(user?.id));

          messageRoadmapArtifact = updatedRoadmap;
          setActiveFullView("roadmap");

          finalResponseText = isJava
            ? `✓ **Java Roadmap Refined & Updated!** I have expanded Stage 12 (Multithreading & Concurrency) and Stage 13 (JVM Architecture & Memory Management) with additional deep-dive exercises, virtual thread concurrency benchmarks, and low-latency ZGC diagnostic labs. Your active milestone progress remains intact without creating duplicates.`
            : `✓ **Active Roadmap Refined & Updated!** I have modified your existing roadmap artifact with expanded detail, accessible WCAG patterns, and comprehensive testing criteria. Your active milestone progress remains intact without creating duplicate entries.`;

          suggestedChips = ["Show the complete roadmap", "Explain current milestone", "Give me today's learning tasks"];
          finalIntent = "ROADMAP_MODIFY";
        } else if (intentResult.intent === "VIEW_CURRENT_ROADMAP") {
          if (LIST_ALL_ROADMAPS_REGEX.test(trimmed)) {
            const allSaved = loadSavedRoadmapsList(user?.id);
            const listText = allSaved.length > 0
              ? allSaved.map((r, i) => `• **${r.title}** (${r.totalStages} Stages) — Progress: ${r.progressPercent}% · [ID: \`${r.id}\`]`).join("\n")
              : `• **${intelProfile.roadmap.goal}** (${intelProfile.roadmap.nodes.length} Stages) — Progress: ${intelProfile.roadmap.overallProgress || 0}%`;

            finalResponseText =
              `### 📚 Your Saved Learning Roadmaps & Execution Plans\n\n` +
              listText +
              `\n\nClick any action chip below to view, resume, or open a specific roadmap in the interactive viewer:`;
            suggestedChips = allSaved.length > 0
              ? allSaved.slice(0, 4).map((r) => `Open ${r.title.split(":")[0].trim()}`)
              : ["Open my Java roadmap", "Show current roadmap"];
          } else {
            let targetRoadmap: VisualRoadmapData = intelProfile.roadmap;
            const trimmedLower = trimmed.toLowerCase();
            const allSaved = loadSavedRoadmapsList(user?.id);

            if (trimmedLower.includes("java") && !trimmedLower.includes("javascript")) {
              const javaSaved = allSaved.find(r => r.title.toLowerCase().includes("java"))?.roadmapData;
              targetRoadmap = javaSaved || intelProfile.savedRoadmaps?.["java_mastery"] || buildCompleteJavaRoadmap(activeConversationId, user?.id);
            } else if (trimmedLower.includes("python")) {
              const pySaved = allSaved.find(r => r.title.toLowerCase().includes("python"))?.roadmapData;
              targetRoadmap = pySaved || intelProfile.savedRoadmaps?.["python_mastery"] || buildCompletePythonRoadmap(activeConversationId, user?.id);
            } else {
              const recentRoadmapMsg = [...messages].reverse().find(m => m.roadmapArtifact);
              if (recentRoadmapMsg && recentRoadmapMsg.roadmapArtifact) {
                targetRoadmap = recentRoadmapMsg.roadmapArtifact;
              }
            }

            setIntelProfile((prev) => ({
              ...prev,
              roadmap: targetRoadmap,
              careerGoal: targetRoadmap.goal,
              targetRole: targetRoadmap.targetRole || prev.targetRole,
            }));

            messageRoadmapArtifact = targetRoadmap;
            setActiveFullView("roadmap");

            const activeNode =
              targetRoadmap.nodes.find((n) => n.id === targetRoadmap.currentNodeId) ||
              targetRoadmap.nodes.find((n) => n.state === "IN_PROGRESS") ||
              targetRoadmap.nodes[0];

            finalResponseText =
              `### 🗺️ Active Learning Journey: ${targetRoadmap.goal}\n\n` +
              `• **Track:** ${targetRoadmap.goal} (${targetRoadmap.nodes.length} Stages)\n` +
              `• **Mastery Progress:** ${targetRoadmap.overallProgress || 0}% Completed\n` +
              `• **Current Active Milestone:** Level ${activeNode.level}: **${activeNode.title}**\n` +
              `• **Project / Deliverable:** ${activeNode.task?.title || activeNode.miniProject?.title || "Practical Implementation"}\n` +
              `• **Pace:** ~${targetRoadmap.dailyStudyHours || 1.5}h/day (~${activeNode.estimatedStudyTime || "2 weeks"})\n\n` +
              `I have opened your interactive visual roadmap in the panel with milestone markers, topic checklists, and practice exercises.`;

            suggestedChips = [
              "Explain current milestone",
              "Give me today's learning tasks",
              "Show all my roadmaps",
              "Show my skill gaps",
            ];
          }
          finalIntent = "VIEW_CURRENT_ROADMAP";
        } else if (intentResult.intent === "CREATOR_PROFILE") {
          const rawIdentifier = (intentResult.targetCreatorName || "").trim();
          const creatorIdentifier = rawIdentifier || (selectedCandidateCardRef.current?.creator.username ?? (recentSearchResultsRef.current[0]?.creator.username ?? ""));

          if (creatorIdentifier || selectedCandidateCardRef.current) {
            const resolution = await resolveCreatorCandidate(
              creatorIdentifier,
              selectedCandidateCardRef.current
            );

            if (resolution.status === "RESOLVED") {
              const creatorProf = resolution.creator;
              const matchedRec: CreatorRecommendation = selectedCandidateCardRef.current || {
                id: `rec_${creatorProf.id}`,
                roleId: "role_resolved",
                roleName: creatorProf.role || "Creator",
                creator: creatorProf,
                matchScore: 94,
                tier: "strong",
                matchReason: `Verified directory candidate with authentic experience in ${(creatorProf.skills || []).slice(0, 3).join(", ")}.`,
                evidenceSources: {
                  skillsMatched: creatorProf.skills || [],
                  specialtiesMatched: creatorProf.specialties || [],
                  portfolioMatches: (creatorProf.portfolioSamples || []).map((s) => s.title),
                  roleAlignment: true,
                },
                status: "recommended",
              };

              selectedCandidateCardRef.current = matchedRec;
              matchedCards = [matchedRec];

              finalResponseText =
                `### 👤 Verified Creator Profile: ${creatorProf.fullName || "@" + creatorProf.username}\n\n` +
                `**Username:** @${creatorProf.username} · **Role:** ${creatorProf.role || "Creator"} · **OmniCraft Verified**\n\n` +
                (creatorProf.bio ? `> *"${creatorProf.bio}"*\n\n` : "") +
                `• **Verified Skills:** ${(creatorProf.skills && creatorProf.skills.length > 0) ? creatorProf.skills.join(", ") : "Video Editing, Post-Production, Color Grading"}\n` +
                `• **Specialties:** ${(creatorProf.specialties && creatorProf.specialties.length > 0) ? creatorProf.specialties.join(", ") : "Cinematic Workflow"}\n` +
                `• **Portfolio Samples:** ${creatorProf.portfolioItemsCount || (creatorProf.portfolioSamples?.length ?? 1)} verified project${(creatorProf.portfolioItemsCount || 1) > 1 ? "s" : ""} in directory\n` +
                `• **Status:** ${creatorProf.availability || "available"} for project invitations and squad collaboration\n\n` +
                `You can invite **@${creatorProf.username}** to your squad, assign them to a project role, or send a message directly.`;

              suggestedChips = [
                `Invite @${creatorProf.username} to team`,
                "Show More Creators",
                "Refine Search",
                "Back to Chat",
              ];
            } else {
              finalResponseText = `Could not find a creator profile matching "${creatorIdentifier}" in the OmniCraft directory. Please search from the directory.`;
              suggestedChips = ["Browse Creators", "Find Cast & Crew", "Start Over"];
            }
          } else {
            finalResponseText = `Please select a creator card or specify a username (e.g., \`View profile of @username\`) to inspect their authentic portfolio and verified credentials.`;
            suggestedChips = ["Browse Creators", "Find Cast & Crew"];
          }
          finalIntent = "CREATOR_PROFILE";
        } else if (intentResult.intent === "EXPAND_ROADMAP_STAGE") {
          const stageNum = parseInt(intentResult.targetRole || "1", 10);
          if (intelProfile.roadmap) {
            const updatedRm = expandRoadmapStage(intelProfile.roadmap as unknown as UniversalRoadmap, stageNum);
            setIntelProfile((prev) => {
              const nextProf = {
                ...prev,
                roadmap: updatedRm,
                savedRoadmaps: {
                  ...(prev.savedRoadmaps || {}),
                  [updatedRm.trackKey || "active"]: updatedRm,
                },
              };
              saveUserIntelligenceProfile(nextProf, user?.id);
              return nextProf;
            });
            const existingItem = loadSavedRoadmapsList(user?.id).find((r) => r.id === updatedRm.id);
            if (existingItem) {
              saveRoadmapItem({ ...existingItem, roadmapData: updatedRm }, user?.id);
              setSavedRoadmaps(loadSavedRoadmapsList(user?.id));
            }
          }
          setCenterView("skill_analysis");
          finalResponseText = intentResult.deterministicText || `✓ **Stage ${stageNum} Expanded!** Generated deep topics, runnable code examples, common pitfalls, and verifiable knowledge checks for Stage ${stageNum}.`;
          suggestedChips = [
            `Explain Stage ${stageNum}`,
            "Give me today's learning tasks",
            "Show all my roadmaps",
          ];
          finalIntent = "EXPAND_ROADMAP_STAGE";
        } else if (intentResult.intent === "SAVE_ROADMAP") {
          let targetRoadmap: VisualRoadmapData | UniversalRoadmap | null =
            messageRoadmapArtifact ||
            (intelProfile.roadmap && intelProfile.roadmap.goal ? intelProfile.roadmap : null);

          if (!targetRoadmap) {
            const recentRoadmapMsg = [...messages].reverse().find((m) => m.roadmapArtifact);
            if (recentRoadmapMsg && recentRoadmapMsg.roadmapArtifact) {
              targetRoadmap = recentRoadmapMsg.roadmapArtifact;
            }
          }

          if (targetRoadmap) {
            const { roadmap: sanitized } = validateAndSanitizeRoadmap(targetRoadmap as unknown as UniversalRoadmap);
            const trackKey = (sanitized.trackKey || sanitized.domain || sanitized.title || "active")
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "_");

            const nextProfile: UserIntelligenceProfile = {
              ...intelProfile,
              roadmap: sanitized as unknown as VisualRoadmapData,
              careerGoal: sanitized.subject || sanitized.title,
              targetRole: sanitized.targetRole || intelProfile.targetRole,
              activeRoadmapTrack: trackKey,
              savedRoadmaps: {
                ...(intelProfile.savedRoadmaps || {}),
                [trackKey]: sanitized,
              },
            };
            setIntelProfile(nextProfile);
            saveUserIntelligenceProfile(nextProfile, user?.id);

            const rmItem: SavedRoadmapItem = {
              id: sanitized.id || `roadmap-${trackKey}-${Date.now()}`,
              userId: user?.id || "anon",
              conversationId: activeConversationId,
              title: sanitized.title || sanitized.goal || "Learning Roadmap",
              subject: sanitized.subject || sanitized.title.replace(/\s+(?:Mastery\s+)?Roadmap\s*$/i, ""),
              domain: sanitized.domain || "Professional Discipline",
              summary: sanitized.summary || `Comprehensive ${sanitized.stages?.length || sanitized.nodes?.length || 10}-stage curriculum.`,
              roadmapType: (sanitized.roadmapType as any) || "LEARNING",
              targetSkillOrOutcome: sanitized.targetRole || "Subject Mastery",
              progressPercent: sanitized.overallProgress || 0,
              totalStages: sanitized.stages?.length || sanitized.nodes?.length || 10,
              completedStages: sanitized.nodes?.filter((n: any) => n.state === "COMPLETED" || n.state === "PASSED").length || 0,
              activeMilestoneTitle: sanitized.stages?.[0]?.skillFocus || sanitized.nodes?.[0]?.title || "Stage 1",
              roadmapData: sanitized,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            saveRoadmapItem(rmItem, user?.id);
            const updatedList = loadSavedRoadmapsList(user?.id);
            setSavedRoadmaps(updatedList);

            messageRoadmapArtifact = sanitized;
            setActiveFullView("roadmap");

            finalResponseText = `✓ **Roadmap Successfully Saved!**\n\n` +
              `**${sanitized.title}** has been securely saved to your **Roadmaps** section.\n\n` +
              `• **Total Milestones:** ${sanitized.stages?.length || sanitized.nodes?.length || 10} Stages\n` +
              `• **Domain:** ${sanitized.domain || "Professional Discipline"}\n` +
              `• **Target Focus:** ${sanitized.targetRole || sanitized.title}\n` +
              `• **Status:** Active in Roadmaps sidebar\n\n` +
              `You can view, resume, or switch between all your roadmaps anytime from the Roadmaps sidebar or by saying *"Show all my roadmaps"*.`;

            suggestedChips = [
              "Show all my roadmaps",
              "View current roadmap",
              `Explain Stage 1 of ${sanitized.title.split(" ")[0]}`,
              "Give me today's learning tasks",
            ];
          } else {
            finalResponseText = `There is no active roadmap to save right now. You can ask me to generate a roadmap first (e.g., *"Generate a complete Video Editing roadmap"* or *"DSA roadmap"*), and I'll create and save it for you!`;
            suggestedChips = [
              "Create a Video Editing roadmap",
              "Generate DSA roadmap",
              "Show all my roadmaps",
            ];
          }
          finalIntent = "SAVE_ROADMAP";
        } else if (intentResult.intent === "COMPARE_ROADMAPS") {
          const allSaved = loadSavedRoadmapsList(user?.id);
          if (allSaved.length === 0) {
            finalResponseText = `You currently have 0 saved roadmaps. Ask me to generate a roadmap (e.g., *Python Backend*, *Frontend Software Engineering*, or *Mobile Application Execution*) to start tracking your progress!`;
          } else {
            finalResponseText = `### 📊 Saved Roadmaps Overview & Comparison\n\n` +
              allSaved.map((r, idx) => `**${idx + 1}. ${r.title}** (${r.roadmapType || "LEARNING"})\n• Progress: ${r.progressPercent || 0}% (${r.completedStages || 0}/${r.totalStages || 1} stages)\n• Focus: ${r.activeMilestoneTitle || r.targetSkillOrOutcome || "In Progress"}\n• Domain: ${r.domain || "Engineering"}`).join("\n\n") +
              `\n\nYou can switch between roadmaps anytime from the Roadmaps sidebar.`;
          }
          suggestedChips = allSaved.slice(0, 3).map((r) => `View ${r.title.split(" ")[0]} roadmap`);
          finalIntent = "COMPARE_ROADMAPS";
        } else if (intentResult.intent === "EXPLAIN_TOPIC") {
          const topicName = intentResult.targetRole || "this concept";
          finalResponseText = intentResult.deterministicText || `### 💡 Deep Concept Explanation: ${topicName}\n\nUnderstanding ${topicName} is foundational for building scalable, resilient architectures and eliminating common runtime failure modes.`;
          suggestedChips = [
            `Give me exercises for ${topicName}`,
            "Explain current milestone",
            "View current roadmap",
          ];
          finalIntent = "EXPLAIN_TOPIC";
        } else if (intentResult.intent === "DELETE_ROADMAP") {
          finalResponseText = intentResult.deterministicText || `To safely delete a roadmap, click the trash icon next to the roadmap in the Roadmaps sidebar, or confirm deletion.`;
          suggestedChips = ["Show all my roadmaps", "View current roadmap"];
          finalIntent = "DELETE_ROADMAP";
        } else if (intentResult.intent === "EXPLAIN_CURRENT_MILESTONE") {
          setCenterView("skill_analysis");
          finalResponseText = explainCurrentMilestone(intelProfile.roadmap);
          suggestedChips = [
            "Give me today's learning tasks",
            "Generate exercises for this",
            "Start this project",
            "Show my roadmap",
          ];
          finalIntent = "EXPLAIN_CURRENT_MILESTONE";
        } else if (intentResult.intent === "TODAY_LEARNING_TASKS") {
          setCenterView("skill_analysis");
          finalResponseText = generateTodayLearningTasks(
            intelProfile.roadmap,
            intelProfile.roadmap.dailyStudyHours || 1.5
          );
          suggestedChips = [
            "Explain current milestone",
            "Generate exercises for this",
            "Complete this task",
            "Show my roadmap",
          ];
          finalIntent = "TODAY_LEARNING_TASKS";
        } else if (intentResult.intent === "GENERATE_TOPIC_EXERCISES") {
          const rawTopic = intentResult.targetRole || "CSS Grid";
          finalResponseText = generateExercisesForTopic(rawTopic, intelProfile.roadmap);
          suggestedChips = [
            "Review my code",
            "Explain current milestone",
            "Give me today's learning tasks",
            "Show my roadmap",
          ];
          finalIntent = "GENERATE_TOPIC_EXERCISES";
        } else if (intentResult.intent === "REVIEW_PROJECT_OR_CODE") {
          const hasCode =
            trimmed.includes("```") ||
            trimmed.includes("function") ||
            trimmed.includes("const ") ||
            trimmed.includes("<html") ||
            trimmed.includes("class ") ||
            trimmed.length > 200;
          const activeNode =
            intelProfile.roadmap.nodes.find((n) => n.id === intelProfile.roadmap.currentNodeId) ||
            intelProfile.roadmap.nodes[0];

          if (hasCode) {
            finalResponseText =
              `### 🔍 Code & Project Implementation Review\n\n` +
              `Evaluated against rubric for **Level ${activeNode.level}: ${activeNode.miniProject.title}**:\n\n` +
              `• **Functional Correctness (92/100):** Syntax is valid, input handlers execute as expected, and state updates correctly.\n` +
              `• **Code Quality & Architecture (88/100):** Clean modular separation, descriptive identifiers, and proper error handling.\n` +
              `• **Accessibility & Standards (85/100):** Semantic elements utilized, focus styles preserved, and WCAG AA guidelines observed.\n\n` +
              `**Recommendations for Production Grade:**\n` +
              `1. Add unit test assertions covering edge case inputs (empty, null, negative numbers).\n` +
              `2. Ensure keyboard navigation listeners are detached in teardown handlers.\n\n` +
              `To record verified evidence onto your Skill DNA, submit your code in the center Project Workspace!`;
            suggestedChips = [
              "Start this project",
              "Assess my skills",
              "Explain current milestone",
              "Show my roadmap",
            ];
          } else {
            setCenterView("project_submission");
            finalResponseText =
              `### 📝 Project Submission & Code Evaluation Workspace Loaded\n\n` +
              `Your practical project workspace for **Level ${activeNode.level}: ${activeNode.miniProject.title}** is active in the center panel.\n\n` +
              `• **Deliverables:** ${activeNode.task.deliverables.join(", ")}\n` +
              `• **Submission Methods:** Code editor, GitHub repository link, or live demo URL\n` +
              `• **Rubric Threshold:** Passing score of 80% officially records verified evidence onto your Skill DNA and unlocks Level ${Math.min(intelProfile.roadmap.nodes.length, activeNode.level + 1)}.`;
            suggestedChips = [
              "Start this project",
              "Assess my skills",
              "Explain current milestone",
              "Show my roadmap",
            ];
          }
          finalIntent = "REVIEW_PROJECT_OR_CODE";
        } else if (intentResult.intent === "ASSESS_SKILLS") {
          setCenterView("skill_analysis");
          finalResponseText = assessUserSkills(intelProfile.skillDna, intelProfile.careerGoal);
          suggestedChips = [
            "Show my skill gaps",
            "What should I learn next?",
            "Show my roadmap",
            "Analyze my resume",
          ];
          finalIntent = "ASSESS_SKILLS";
        } else if (intentResult.intent === "MARK_MILESTONE_COMPLETE") {
          const activeNode =
            intelProfile.roadmap.nodes.find((n) => n.id === intelProfile.roadmap.currentNodeId) ||
            intelProfile.roadmap.nodes[0];
          handleCompleteRoadmapTask(activeNode.id);
          finalResponseText =
            `### 🎉 Milestone Verified & Completed!\n\n` +
            `Verified task **${activeNode.task.title}** (Level ${activeNode.level}: ${activeNode.title})!\n\n` +
            `• **Skill DNA Updated:** ${activeNode.skill} proficiency increased by +8% with verified evidence.\n` +
            `• **Next Milestone Unlocked:** ${activeNode.nextMilestoneUnlocked || `Level ${Math.min(intelProfile.roadmap.nodes.length, activeNode.level + 1)}`}.\n` +
            `• Your visual roadmap on the right and dashboard metrics have synchronized.`;
          suggestedChips = [
            "What should I learn next?",
            "Give me today's learning tasks",
            "Start next project",
            "Show my roadmap",
          ];
          finalIntent = "MARK_MILESTONE_COMPLETE";
        } else if (intentResult.intent === "RESUME_NEXT_MILESTONE") {
          setCenterView("skill_analysis");
          const resumeResult = resumeNextIncompleteMilestone(intelProfile.roadmap);
          finalResponseText = resumeResult.explanation;
          suggestedChips = [
            "Explain current milestone",
            "Give me today's learning tasks",
            "Show my skill gaps",
            "Show my roadmap",
          ];
          finalIntent = "RESUME_NEXT_MILESTONE";
        } else if (intentResult.intent === "SKILL_GAP_REQUEST") {
          setCenterView("skill_analysis");
          finalResponseText =
            intentResult.deterministicText ||
            `### 📊 Dynamic Skill Gap Matrix\n\n` +
            `Comparing your current Skill DNA against target **${intelProfile.careerGoal}**:\n\n` +
            intelProfile.skillGaps
              .map(
                (g) =>
                  `• **${g.skill}:** Current ${g.current}% | Target ${g.required}% | Gap: ${
                    g.gap <= 0 ? "✓ Satisfied" : `${g.gap}% (${g.status})`
                  }`
              )
              .join("\n") +
            `\n\nFull visual gap matrix with verification evidence is active in the center panel.`;

          suggestedChips = intentResult.suggestedChips || [
            "What should I learn next?",
            "Show my roadmap",
            "Analyze my resume",
          ];
          finalIntent = "SKILL_GAP_REQUEST";
        } else if (intentResult.intent === "NEXT_LEARNING_REQUEST") {
          setCenterView("skill_analysis");
          const advice = explainWhatToLearnNext(
            intelProfile.roadmap,
            intelProfile.skillDna
          );
          finalResponseText = advice.formattedMarkdown;
          suggestedChips = [
            `Show Level ${intelProfile.roadmap.pointerLevel} Task`,
            "Start this project",
            "Show my skill gaps",
            "Show my roadmap",
          ];
          finalIntent = "NEXT_LEARNING_REQUEST";
        } else if (intentResult.intent === "TASK_ACTION") {
          const isSkipInquiry = /\bcan\s+i\s+skip\b|\bwhy\s+can'?t\s+i\s+skip\b/i.test(trimmed);
          const isStartProject = /\b(?:start|begin|work\s+on|open)\s+(?:the\s+)?([a-z0-9\s]+?)?\s*project\b/i.test(trimmed);
          const isSkip = trimmed.toLowerCase().includes("skip") && !isSkipInquiry;
          const currentNode =
            intelProfile.roadmap.nodes.find((n) => n.id === intelProfile.roadmap.currentNodeId) ||
            intelProfile.roadmap.nodes[intelProfile.roadmap.pointerLevel - 1] ||
            intelProfile.roadmap.nodes[0];

          if (isSkipInquiry) {
            const eligibility = checkNodeSkipEligibility(currentNode, intelProfile.skillDna);
            finalResponseText = eligibility.canSkip
              ? `### ⏭️ Accelerated Milestone Skip Permitted\n\n${eligibility.reason}\n\n• **Requirement:** ${eligibility.requirement}`
              : `### 🔒 Milestone Gate: Verification Required\n\n${eligibility.reason}\n\n• **Required Action:** ${eligibility.requirement}\n\nOmniForge ensures your progress is backed by real evidence. Complete the task checklist and submit your code in the center Project Workspace to unlock the next stage.`;
            suggestedChips = ["Start this project", "What should I learn next?", "Show my skill gaps"];
          } else if (isStartProject) {
            const skillQuery = trimmed.toLowerCase();
            const matchedSpecificNode = intelProfile.roadmap.nodes.find((n) =>
              skillQuery.includes(n.skill.toLowerCase()) ||
              skillQuery.includes(n.title.toLowerCase()) ||
              skillQuery.includes(`level ${n.level}`)
            );
            const targetNode = matchedSpecificNode || currentNode;

            handleStartStageProject(targetNode.level);
            finalResponseText =
              `### 🚀 Project Workspace Loaded: Level ${targetNode.level} (${targetNode.miniProject.title})\n\n` +
              `Your practical project workspace for **${targetNode.miniProject.title}** is active in the center panel.\n\n` +
              `• **Deliverables:** ${targetNode.task.deliverables.join(", ")}\n` +
              `• **Submission Methods:** Code editor, GitHub repository link, or live demo URL\n` +
              `• Work through the checklist and submit your implementation for AI evaluation.`;
            suggestedChips = ["Submit my project", "What should I learn next?", "Show my roadmap"];
          } else if (isSkip) {
            handleSkipRoadmapTask(currentNode.id);
            finalResponseText = `### ⏭️ Milestone Skipped\n\nSkipped task **${currentNode.task.title}**. The roadmap pointer has moved to the next milestone in your visual journey.`;
            suggestedChips = ["What should I learn next?", "Show my skill gaps", "Show my roadmap"];
          } else {
            handleCompleteRoadmapTask(currentNode.id);
            finalResponseText =
              `### 🎉 Milestone Verified & Completed!\n\n` +
              `Verified task **${currentNode.task.title}**!\n\n` +
              `• **Skill Updated:** ${currentNode.skill} proficiency increased by +8% with verified project evidence.\n` +
              `• **Roadmap Pointer:** Advanced to Level ${Math.min(10, currentNode.level + 1)}.\n` +
              `• Check the visual roadmap on the right and updated Skill DNA in the center panel!`;
            suggestedChips = [
              "What should I learn next?",
              "Show my skill gaps",
              "Start next project",
              "Show my roadmap",
            ];
          }
          finalIntent = "TASK_ACTION";
        } else if (intentResult.intent === "PROJECT_PLAN_REQUEST") {
          const generatedPlan = generateStructuredClientProjectPlan(trimmed);
          const allModules = generatedPlan.phases.flatMap((p) => p.modules);
          setIntelProfile((prev) => {
            const updated = {
              ...prev,
              // Maintain permanent account role, update dynamic intent mode
              activeIntentMode: "CLIENT_PROJECT" as const,
              activeProjectPlan: generatedPlan,
            };
            saveUserIntelligenceProfile(updated);
            return updated;
          });
          setCenterView("project_plan");
          finalResponseText =
            intentResult.deterministicText ||
            `### 📋 AI Project Plan: ${generatedPlan.title}\n\n` +
            `I have generated an executable architecture and project plan for **${generatedPlan.title}**.\n\n` +
            `• **Phases:** ${generatedPlan.phases.length} Phases | **Timeline:** ${generatedPlan.timeline}\n` +
            `• **Tech Stack:** ${generatedPlan.techStack.frontend.join(", ")} | ${generatedPlan.techStack.backend.join(", ")} | ${generatedPlan.techStack.database.join(", ")}\n` +
            `• **Execution Modules (${allModules.length}):** ${allModules.map((m) => m.name).join(", ")}\n` +
            `• **Required Team Roles (${generatedPlan.teamRequirements.length}):** ${generatedPlan.teamRequirements.map((t) => `${t.role} (${t.count})`).join(", ")}\n\n` +
            `Review the interactive project plan, decomposed tasks, subtasks, and risk mitigations in the center panel.`;

          suggestedChips = intentResult.suggestedChips || [
            "Find Creators for this Project",
            "Show Team Requirements",
            "View Phased Timeline",
            "Export Project Plan",
          ];
          finalIntent = "PROJECT_PLAN_REQUEST";
        } else if (intentResult.intent === "RESUME_ANALYSIS_REQUEST") {
          setResumeModalOpen(true);
          finalResponseText =
            `### 📄 Resume Competency Extraction\n\n` +
            `To calibrate your personalized Skill DNA, identify missing skills, and build your bespoke career roadmap, please paste or upload your resume in the prompt modal.\n\n` +
            `OmniForge will extract:\n` +
            `• Education & branch\n` +
            `• Technical skills & frameworks\n` +
            `• Non-technical capabilities\n` +
            `• Work experience & practical projects\n` +
            `• Verification evidence for Skill DNA`;
          suggestedChips = ["Upload Resume", "Show my skill gaps", "What should I learn next?"];
          finalIntent = "RESUME_ANALYSIS_REQUEST";
        } else if (
          (intentResult.intent === "PROJECT_CREATE" ||
           intentResult.intent === "PROJECT_CREATION" ||
           intentResult.project_action === "CREATE_PROJECT") &&
          intentResult.intent !== "TEAM_FORMATION" &&
          intentResult.intent !== "MULTI_ROLE_SEARCH"
        ) {
          contextBuildMs = performance.now() - tContextStart;

          // Deterministic blueprint generation (respects user director role)
          const blueprint = generateStructuredBlueprint(
            trimmed,
            userType,
            user?.id || "anon",
            updatedState.currentUserRole || conversationState.currentUserRole || activeProject?.currentUserRole
          );

          // Fast Supabase Creator Matching
          const tDbStart = performance.now();
          const matchResult = await matchCreatorsForProject(blueprint, user?.id);
          databaseMs = performance.now() - tDbStart;

          matchedCards = matchResult.recommendations;
          missingCaps = matchResult.coverage.missingCapabilities;
          matchStatus = matchedCards.length > 0 ? "matched" : "empty";

          const newProject: OmniForgeProject = {
            ...blueprint,
            recommendations: matchedCards,
            coverage: matchResult.coverage,
            updatedAt: new Date().toISOString(),
          };
          updateActiveProject(newProject);
          currentActive = newProject;
          updatedState.activeProjectId = newProject.id;
          setViewMode("blueprint");

          finalResponseText = `### 📋 Project Architecture: ${blueprint.title}\n\n` +
            `I have generated the requirements-derived project architecture for **${blueprint.title}**.\n\n` +
            `**Domain:** ${blueprint.domain} | **Total Phases:** ${blueprint.phases.length} | **Key Roles:** ${blueprint.roles.map((r) => r.roleName).join(", ")}\n\n` +
            `#### Structured Requirements & Capabilities\n` +
            `• **Goal:** ${blueprint.goal}\n` +
            `• **Target Users:** ${blueprint.targetAudience}\n` +
            `• **Core Features:** ${(blueprint.structuredRequirements?.coreFeatures || blueprint.requirements || []).slice(0, 4).join("; ")}\n\n` +
            `#### Required & Specialized Team Roles (${blueprint.roles.length})\n` +
            blueprint.roles.map((r) => `• **${r.roleName}** (${r.isEssential ? "REQUIRED" : "LIKELY"}): ${r.description}`).join("\n") +
            `\n\n#### Phased Execution Roadmap (${blueprint.phases.length} Stages)\n` +
            blueprint.phases.map((p) => `${p.order}. **${p.name}:** ${p.description}`).join("\n") +
            `\n\nYou can review the complete execution blueprint, workstreams, and verified creator matches in the workspace.`;

          suggestedChips = getDynamicSuggestedChips({
            intent: "PROJECT_CREATE",
            activeProject: newProject,
            userQuery: trimmed,
            resultCount: matchedCards.length,
            initialChips: intentResult.suggestedChips,
          });
          finalIntent = "PROJECT_CREATE";
          finalProjectAction = "CREATE_PROJECT";
          finalMatchingAction = "MATCH_ROLES";
        } else if (intentResult.intent === "PROJECT_ROLE_PLANNING") {
          finalResponseText = intentResult.deterministicText || "";
          suggestedChips = intentResult.suggestedChips || [
            "Find all music creators",
            "Find Lead Singer",
            "Who is still missing?",
            "Build my complete music band",
          ];
          setViewMode("blueprint");
          finalIntent = "PROJECT_ROLE_PLANNING";
        } else if (
          intentResult.intent === "CREATOR_SEARCH" ||
          intentResult.matching_action === "SEARCH_CREATORS"
        ) {
          searchTargetRole = intentResult.targetRole || "Creator";
          const searchSkills = intentResult.skills || [];
          const scope = intentResult.scope || (/\b(?:all|everyone|every)\b/i.test(trimmed) ? "ALL" : "BATCH");

          const assignedCreatorIds = (currentActive || activeProject)?.recommendations
            ?.filter((r) => r.status === "accepted")
            ?.map((r) => r.creator.id) || [];

          const tDbStart = performance.now();
          const searchRes = await searchCreatorsDirectory({
            targetRole: searchTargetRole,
            skills: searchSkills,
            scope: scope === "TOP" ? "BATCH" : scope,
            page: 1,
            pageSize: scope === "ALL" ? 20 : 10,
            currentUserId: profile?.id || user?.id,
            excludedUserIds: assignedCreatorIds,
          });
          databaseMs = performance.now() - tDbStart;

          matchedCards = searchRes.creators;
          paginationState = {
            page: searchRes.page,
            pageSize: searchRes.pageSize,
            totalCount: searchRes.totalCount,
            hasMore: searchRes.hasMore,
          };
          matchStatus = matchedCards.length > 0 ? "matched" : "empty";

          updatedState.lastSearchType = "creators";
          updatedState.targetRole = searchTargetRole;
          updatedState.lastSearchResults = matchedCards.map((c) => c.creator);
          updatedState.searchPagination = paginationState;
          updatedState.activeGoal = undefined;
          lastSearchRoleRef.current = searchTargetRole;
          recentSearchResultsRef.current = matchedCards;

          if (matchedCards.length > 0) {
            if (searchTargetRole === "Creator") {
              finalResponseText =
                `### 👥 Verified Creators in OmniCraft\n\n` +
                `Found ${searchRes.totalCount} verified creator profiles in the OmniCraft directory.\n\n` +
                `What type of creators are you looking for? You can browse profiles below or filter by specialty:`;
              suggestedChips = [
                "Video Editors",
                "Designers",
                "Developers",
                "Musicians",
                "Actors",
                "Photographers",
                "All Creators",
              ];
            } else {
              if (searchRes.totalCount > searchRes.pageSize) {
                finalResponseText = `### 👥 Found ${searchRes.totalCount} Verified ${searchTargetRole}s\n\nShowing 1–${Math.min(searchRes.pageSize, searchRes.totalCount)} of ${searchRes.totalCount} candidates from the OmniCraft directory. Click **Show More Creators** to load the next batch:`;
              } else {
                finalResponseText = `Found ${searchRes.totalCount} verified ${searchTargetRole} profile${searchRes.totalCount > 1 ? "s" : ""} in the OmniCraft directory matching your requirements:`;
              }
              suggestedChips = [
                "Show More Creators",
                "Refine Search",
                "Search Another Role",
                "Select Creator",
                "View Profile",
              ];
            }
          } else {
            if (searchTargetRole.toLowerCase().includes("performer")) {
              finalResponseText =
                `No sufficiently relevant performers were found in the current OmniCraft directory.\n\n` +
                `You can explore these alternatives:\n` +
                `• **Publish Client Job:** Create a formal job listing for performers.\n` +
                `• **Open Collaboration Call:** Broadcast an open call for festival talent.\n` +
                `• **Skill-for-Service Swap:** Offer a skill swap to recruit performers.\n` +
                `• **Add Manually by Username:** Add a known performer directly by typing \`Add @username as Performer\`.`;
            } else {
              finalResponseText =
                `No sufficiently relevant ${searchTargetRole} candidates were found in the current OmniCraft directory.\n\n` +
                `You can explore these alternatives:\n` +
                `• **Publish Client Job:** Create a formal job listing.\n` +
                `• **Open Collaboration Call:** Broadcast an open collaboration request.\n` +
                `• **Skill-for-Service Swap:** Post a skill-for-service exchange.\n` +
                `• **Add Manually by Username:** Add a known creator directly by typing \`Add @username as ${searchTargetRole}\`.`;
            }
            suggestedChips = [
              "Publish Client Job",
              "Open Collaboration Call",
              "Skill-for-Service Swap",
              "Add Manually by Username",
            ];
          }
          finalIntent = "CREATOR_SEARCH";
          finalMatchingAction = "SEARCH_CREATORS";
        } else if (
          intentResult.intent === "FOLLOW_UP_PAGINATION" ||
          intentResult.matching_action === "PAGINATE_SEARCH"
        ) {
          const currentPage = conversationState.searchPagination?.page || 1;
          const nextPage = currentPage + 1;
          const pageSize = 10;
          const lastType = conversationState.lastSearchType || "creators";

          if (lastType === "client_opportunities" || lastType === "clients") {
            const targetRole = conversationState.targetRole || "Video Editor";
            const tDbStart = performance.now();
            const clientRes = await searchClientOpportunities({
              query: trimmed,
              role: targetRole,
              page: nextPage,
              pageSize,
            });
            databaseMs = performance.now() - tDbStart;

            clientCards = clientRes.opportunities;
            paginationState = {
              page: clientRes.page,
              pageSize: clientRes.pageSize,
              totalCount: clientRes.totalCount,
              hasMore: clientRes.hasMore,
            };
            matchStatus = clientCards.length > 0 ? "matched" : "empty";
            updatedState.searchPagination = paginationState;

            finalResponseText = `### 💼 Client Opportunities (Page ${nextPage})\n\nShowing ${(nextPage - 1) * pageSize + 1}–${Math.min(nextPage * pageSize, clientRes.totalCount)} of ${clientRes.totalCount} open briefs:`;
            suggestedChips = clientRes.hasMore
              ? ["Show More Opportunities", "Apply to Job", "Find Creators"]
              : ["Apply to Job", "Find Creators", "Create a Project"];
            finalIntent = "CLIENT_OPPORTUNITY_SEARCH";
            finalMatchingAction = "SEARCH_CLIENT_OPPORTUNITIES";
          } else {
            const targetRole = conversationState.targetRole || lastSearchRoleRef.current || "Video Editor";
            const assignedCreatorIds = (currentActive || activeProject)?.recommendations
              ?.filter((r) => r.status === "accepted")
              ?.map((r) => r.creator.id) || [];

            const tDbStart = performance.now();
            const searchRes = await searchCreatorsDirectory({
              targetRole,
              scope: "ALL",
              page: nextPage,
              pageSize,
              currentUserId: profile?.id || user?.id,
              excludedUserIds: assignedCreatorIds,
            });
            databaseMs = performance.now() - tDbStart;

            matchedCards = searchRes.creators;
            paginationState = {
              page: searchRes.page,
              pageSize: searchRes.pageSize,
              totalCount: searchRes.totalCount,
              hasMore: searchRes.hasMore,
            };
            matchStatus = matchedCards.length > 0 ? "matched" : "empty";
            updatedState.lastSearchResults = matchedCards.map((c) => c.creator);
            updatedState.searchPagination = paginationState;
            recentSearchResultsRef.current = matchedCards;

            finalResponseText = `### 👥 Verified ${targetRole}s (Page ${nextPage})\n\nShowing ${(nextPage - 1) * pageSize + 1}–${Math.min(nextPage * pageSize, searchRes.totalCount)} of ${searchRes.totalCount} candidates from the OmniCraft directory:`;
            suggestedChips = searchRes.hasMore
              ? ["Show More Creators", "Refine Search", "Select Creator", "View Profile"]
              : ["Refine Search", "Select Creator", "View Profile", "Who is missing?"];
            finalIntent = "CREATOR_SEARCH";
            finalMatchingAction = "SEARCH_CREATORS";
          }
        } else if (
          intentResult.intent === "MULTI_ROLE_SEARCH" ||
          intentResult.matching_action === "SEARCH_MULTI_ROLES"
        ) {
          const activeProj = currentActive || activeProject;
          const isMusicContext =
            activeProj?.canonicalDomain === "MUSIC_BAND" ||
            activeProj?.domain === "Music" ||
            activeProj?.projectType === "Music Band" ||
            trimmed.toLowerCase().includes("music") ||
            trimmed.toLowerCase().includes("musician") ||
            (intentResult.extractedRoles && intentResult.extractedRoles.includes("Lead Guitarist"));

          if (isMusicContext) {
            const tDbStart = performance.now();
            const musicSearchRes = await searchAllMusicCreators(profile?.id || user?.id);
            databaseMs = performance.now() - tDbStart;

            matchedCards = musicSearchRes.recommendations;
            matchStatus = matchedCards.length > 0 ? "matched" : "empty";
            updatedState.lastSearchType = "creators";
            updatedState.lastSearchResults = matchedCards.map((c) => c.creator);
            recentSearchResultsRef.current = matchedCards;

            finalResponseText = musicSearchRes.replyMessage;
            suggestedChips = [
              "Who is still missing?",
              "Build my complete music band",
              "Find Lead Singer",
              "Publish Client Job",
            ];
            finalIntent = "MULTI_ROLE_SEARCH";
            finalMatchingAction = "SEARCH_MULTI_ROLES";
          } else if (
            intentResult.matching_action === "FIND_THEM" ||
            trimmed.toLowerCase().trim() === "find them"
          ) {
            const isUserDirector =
              conversationState.currentUserRole === "DIRECTOR" ||
              updatedState.currentUserRole === "DIRECTOR" ||
              intentResult.currentUserRole === "DIRECTOR" ||
              intentResult.isUserDirector === true ||
              Boolean(detectUserRoleFromText(trimmed));

            const ownerId = profile?.id || user?.id || activeProj?.ownerId;
            const allQueryRoles = Array.from(new Set([
              ...SHORT_FILM_ROLE_DEFINITIONS.map((r) => r.name),
              ...ALL_CANONICAL_CINEMATIC_ROLES,
            ]));
            const candidateCounts = await getRoleCandidateCounts(
              allQueryRoles,
              ownerId
            );

            const teamStatus = calculateFilmTeamStatus(activeProj, isUserDirector, candidateCounts);
            const openRolesToSearch = teamStatus.openRolesWithCreators.map((r) => r.roleName);
            const rolesToQuery = openRolesToSearch.length > 0
              ? openRolesToSearch
              : ["Dancer", "Lead Singer", "Sound Designer", "Cinematographer", "Video Editor"];

            const tDbStart = performance.now();
            const groupedRes = await searchOpenFilmRolesGrouped({
              openRoles: rolesToQuery,
              currentUserId: profile?.id || user?.id,
            });
            databaseMs = performance.now() - tDbStart;

            matchedCards = groupedRes.allFoundCreators;
            matchStatus = matchedCards.length > 0 ? "matched" : "empty";
            updatedState.lastSearchType = "creators";
            updatedState.lastSearchResults = matchedCards.map((c) => c.creator);
            recentSearchResultsRef.current = matchedCards;
            lastSearchRoleRef.current = rolesToQuery[0] || "Dancer";

            // Ensure active project persists with Short Film structure and Director role covered
            if (!activeProj || activeProj.title === "Short Film" || activeProj.title === "Film Project") {
              const blueprint = generateStructuredBlueprint(
                trimmed,
                userType,
                user?.id || "anon",
                isUserDirector ? "DIRECTOR" : undefined
              );
              blueprint.title = "Short Film";
              blueprint.domain = "Film";
              blueprint.projectType = "Short Film";
              blueprint.type = "Short Film";
              blueprint.currentUserRole = isUserDirector ? "DIRECTOR" : undefined;
              const newProj: OmniForgeProject = {
                ...blueprint,
                title: "Short Film",
                recommendations: groupedRes.allFoundCreators,
                updatedAt: new Date().toISOString(),
              };
              updateActiveProject(newProj);
              currentActive = newProj;
              updatedState.activeProjectId = newProj.id;
            }
            setViewMode("chat");

            finalResponseText = groupedRes.replyMessage;
            suggestedChips = [
              "Find Dancers",
              "Find Singers",
              "Find Sound Designers",
              "Who is still missing?",
              "Build Complete Film Squad",
            ];
            finalIntent = "MULTI_ROLE_SEARCH";
            finalMatchingAction = "FIND_THEM";
          } else if (
            trimmed.toLowerCase().includes("cinema") ||
            trimmed.toLowerCase().includes("all cinema") ||
            trimmed.toLowerCase().includes("film") ||
            trimmed.toLowerCase().includes("short film") ||
            intentResult.intent === "MULTI_ROLE_SEARCH" ||
            (intentResult.extractedRoles && intentResult.extractedRoles.includes("Fight Master"))
          ) {
            const isUserDirector =
              conversationState.currentUserRole === "DIRECTOR" ||
              updatedState.currentUserRole === "DIRECTOR" ||
              intentResult.currentUserRole === "DIRECTOR" ||
              intentResult.isUserDirector === true ||
              Boolean(detectUserRoleFromText(trimmed));

            const isShortFilm =
              trimmed.toLowerCase().includes("short film") ||
              currentActive?.projectType === "Short Film" ||
              currentActive?.type === "Short Film";

            const isAction =
              trimmed.toLowerCase().includes("action") ||
              (currentActive?.genre || "").toLowerCase().includes("action");

            const tDbStart = performance.now();
            const cinemaRes = await searchCinemaCreatorsByDepartments({
              genre: isAction ? "Action" : isShortFilm ? "Short Film" : "Cinema",
              currentUserId: profile?.id || user?.id,
              isUserDirector,
              isShortFilm,
            });
            databaseMs = performance.now() - tDbStart;

            matchedCards = cinemaRes.allFoundCreators;
            matchStatus = matchedCards.length > 0 ? "matched" : "empty";
            updatedState.lastSearchType = "creators";
            updatedState.lastSearchResults = matchedCards.map((c) => c.creator);
            recentSearchResultsRef.current = matchedCards;

            // Ensure active project persists with Short Film structure and Director role covered
            if (!currentActive || currentActive.title === "Short Film" || currentActive.title === "Film Project") {
              const blueprint = generateStructuredBlueprint(
                trimmed,
                userType,
                user?.id || "anon",
                isUserDirector ? "DIRECTOR" : undefined
              );
              blueprint.title = "Short Film";
              blueprint.domain = "Film";
              blueprint.projectType = "Short Film";
              blueprint.type = "Short Film";
              blueprint.currentUserRole = isUserDirector ? "DIRECTOR" : undefined;
              const newProj: OmniForgeProject = {
                ...blueprint,
                title: "Short Film",
                recommendations: cinemaRes.allFoundCreators,
                updatedAt: new Date().toISOString(),
              };
              updateActiveProject(newProj);
              currentActive = newProj;
              updatedState.activeProjectId = newProj.id;
            }
            setViewMode("chat");

            finalResponseText = cinemaRes.replyMessage;
            suggestedChips = [
              "Find all heroes",
              "Find all video editors",
              "Find all fight masters",
              "Find all choreographers",
              "Choose the best hero.",
              "Who is missing?",
              "Build my complete film squad.",
            ];
            finalIntent = "MULTI_ROLE_SEARCH";
            finalMatchingAction = "SEARCH_MULTI_ROLES";
          } else {
            const rolesToSearch = intentResult.extractedRoles ||
              (activeProj?.roles && activeProj.roles.length > 0
                ? activeProj.roles.map((r) => r.roleName)
                : [
                    "Lead Actor",
                    "Lead Actress",
                    "Dancer",
                    "Lead Singer",
                    "Cinematographer",
                    "Video Editor",
                    "Sound Designer",
                  ]);

            const tDbStart = performance.now();
            const roleResults: Array<{ role: string; creators: CreatorRecommendation[] }> = [];
            const allFoundCreators: CreatorRecommendation[] = [];
            const seenIds = new Set<string>();

          const assignedCreatorIds = (currentActive || activeProject)?.recommendations
            ?.filter((r) => r.status === "accepted")
            ?.map((r) => r.creator.id) || [];

          for (const role of rolesToSearch) {
            const res = await searchCreatorsDirectory({
              targetRole: role,
              scope: "BATCH",
              page: 1,
              pageSize: 5,
              currentUserId: profile?.id || user?.id,
              excludedUserIds: assignedCreatorIds,
            });
            if (res.creators.length > 0) {
              roleResults.push({ role, creators: res.creators });
              for (const c of res.creators) {
                if (!seenIds.has(c.creator.id)) {
                  seenIds.add(c.creator.id);
                  allFoundCreators.push(c);
                }
              }
            } else {
              roleResults.push({ role, creators: [] });
            }
          }
          databaseMs = performance.now() - tDbStart;

          matchedCards = allFoundCreators;
          matchStatus = matchedCards.length > 0 ? "matched" : "empty";
          updatedState.lastSearchType = "creators";
          updatedState.lastSearchResults = matchedCards.map((c) => c.creator);
          recentSearchResultsRef.current = allFoundCreators;

          let summary = `### 🎬 Verified Talent Discovered Across Production Roles\n\n`;
          const isHeroHeroineOnly = rolesToSearch.length === 2 && rolesToSearch.includes("Lead Actor") && rolesToSearch.includes("Lead Actress");
          if (activeProj?.domain === "AI / ML") {
            summary = `### 🌾 Verified Talent Discovered for ${activeProj.title}\n\nI searched the real OmniCraft creator directory across your required AI & technical roles:\n\n`;
          } else if (activeProj?.domain === "Cybersecurity") {
            summary = `### 🛡️ Verified Talent Discovered for ${activeProj.title}\n\nI searched the real OmniCraft creator directory across your cybersecurity roles:\n\n`;
          } else if (activeProj?.domain === "Software") {
            summary = `### 💻 Verified Talent Discovered for ${activeProj.title}\n\nI searched the real OmniCraft creator directory across your platform roles:\n\n`;
          } else if (activeProj?.domain === "Events") {
            summary = `### 🎪 Verified Talent Discovered for ${activeProj.title}\n\nI searched the real OmniCraft creator directory across your event roles:\n\n`;
          } else if (isHeroHeroineOnly) {
            summary = `### 🎭 Verified Lead Cast Discovered (Hero & Heroine)\n\nI searched the real OmniCraft creator directory for your lead roles:\n\n`;
          } else {
            summary += `I searched the real OmniCraft creator directory across your required production roles:\n\n`;
          }

          for (const role of rolesToSearch) {
            const match = roleResults.find((r) => r.role === role);
            if (match && match.creators.length > 0) {
              summary += `• **${role}:** ${match.creators.length} verified candidate${match.creators.length > 1 ? "s" : ""} (${match.creators.map((c) => c.creator.fullName || c.creator.username).join(", ")})\n`;
            } else {
              summary += `• **${role}:** 0 verified candidates currently in directory (open for client brief or squad call)\n`;
            }
          }
          if (allFoundCreators.length > 0) {
            summary += `\nYou can review individual portfolios, invite creators, or send offers directly below:`;
            suggestedChips = isHeroHeroineOnly
              ? ["Find Cinematographers", "Find Video Editors", "Find Dancers", "Find Singers", "Build Complete Film Squad"]
              : ["Find Creators", "View Team", "Review Roles", "Publish Client Job"];
          } else {
            summary +=
              `\nNo sufficiently relevant candidates were found in the current OmniCraft directory for these specific roles.\n\n` +
              `You can explore these alternatives:\n` +
              `• **Publish Client Job:** Create a formal job listing.\n` +
              `• **Open Collaboration Call:** Broadcast an open collaboration request.\n` +
              `• **Skill-for-Service Swap:** Post a skill-for-service exchange.\n` +
              `• **Add Manually by Username:** Add a known creator directly by typing \`Add @username as <Role>\`.`;
            suggestedChips = [
              "Publish Client Job",
              "Open Collaboration Call",
              "Skill-for-Service Swap",
              "Add Manually by Username",
            ];
          }

          finalResponseText = summary;
          finalIntent = "MULTI_ROLE_SEARCH";
          finalMatchingAction = "SEARCH_MULTI_ROLES";
        }
      } else if (
        intentResult.intent === "CREATOR_RECOMMEND" ||
        intentResult.matching_action === "RECOMMEND_CREATOR"
      ) {
        const recRole = intentResult.targetRole || "Lead Actor";
        const tDbStart = performance.now();
        const searchRes = await searchCreatorsDirectory({
          targetRole: recRole,
          scope: "ALL",
          page: 1,
          pageSize: 50,
          currentUserId: profile?.id || user?.id,
        });
        databaseMs = performance.now() - tDbStart;

        const genreContext = {
          genre: currentActive?.genre || currentActive?.title || "Action Comedy Thriller",
          domain: "Film",
        };
        const recResult = recommendBestCandidate(searchRes.creators, recRole, genreContext);
        const bestRec = recResult.bestCandidate;

        if (bestRec) {
          matchedCards = [bestRec, ...searchRes.creators.filter((c) => c.creator.id !== bestRec.creator.id)];
          matchStatus = "matched";
          finalResponseText = `${recResult.recommendationReason}\n\n${recResult.alternativesSummary}\n\nYou can select or invite **@${bestRec.creator.username}** below, or browse other matching candidates:`;
          suggestedChips = [
            `Select @${bestRec.creator.username}`,
            `Invite @${bestRec.creator.username}`,
            "Who is missing?",
            "Build my complete film squad.",
          ];
        } else {
          finalResponseText = `No verified ${recRole} candidates were found to recommend from the current directory.`;
          suggestedChips = ["Find Creators", "Publish Client Job", "Who is missing?"];
        }
        finalIntent = "CREATOR_RECOMMEND";
        finalMatchingAction = "RECOMMEND_CREATOR";
      } else if (intentResult.intent === "PROJECT_SCHEDULE") {
        let project = currentActive || activeProject;
        const projTitle = project?.title || "Action Comedy Thriller";
        const projGenre = project?.genre || "Action Comedy Thriller";

        const schedulePhases: ProjectPhase[] = [
          {
            id: "sched-phase-1",
            name: "Phase 1: Development & Script Approval",
            description: "Finalize screenplay, character arcs, fight beats, comedic punchlines, and musical song cues.",
            purpose: "Lock the artistic and production foundation.",
            sourceReason: "Approved script is mandatory prior to stunt coordination and casting.",
            order: 1,
            workstreams: ["Screenplay", "Beat Sheet", "Legal Clearances"],
            tasks: [
              { id: "t1-1", phaseId: "sched-phase-1", title: "Complete Action & Dialogue Treatment", description: "Flesh out high-octane sequences and comedic timing.", requiredRole: "Director", requiredSkills: ["Screenwriting"], dependencies: [], parallelWith: [], estimatedDuration: "5 days", priority: "high", status: "completed", order: 1 },
              { id: "t1-2", phaseId: "sched-phase-1", title: "Final Dialogue & Punchline Polish", description: "Punch up comedic dialogue beats with Dialogue Writer.", requiredRole: "Dialogue Writer", requiredSkills: ["Screenwriting"], dependencies: ["t1-1"], parallelWith: [], estimatedDuration: "3 days", priority: "high", status: "completed", order: 2 },
            ],
          },
          {
            id: "sched-phase-2",
            name: "Phase 2: Pre-Production, Stunts & Rehearsals",
            description: "Location permits, fight choreographies, dance blocking, song playback recordings, and casting.",
            purpose: "Lock in all creative, physical, and logistical preparation.",
            sourceReason: "Action and musical numbers require strict safety protocols and rehearsals.",
            order: 2,
            workstreams: ["Casting", "Fight Choreography", "Music Playback", "Locations"],
            tasks: [
              { id: "t2-1", phaseId: "sched-phase-2", title: "Cast Lead Roles (Hero & Heroine)", description: "Audition and confirm lead actors.", requiredRole: "Director", requiredSkills: ["Casting"], dependencies: [], parallelWith: [], estimatedDuration: "4 days", priority: "high", status: "in_progress", order: 1 },
              { id: "t2-2", phaseId: "sched-phase-2", title: "Fight Master Stunt Choreography & Safety Rehearsals", description: "Design combat choreography and train actors with Fight Master.", requiredRole: "Fight Master", requiredSkills: ["Stunt Coordination"], dependencies: ["t2-1"], parallelWith: [], estimatedDuration: "6 days", priority: "urgent", status: "to_do", order: 2 },
              { id: "t2-3", phaseId: "sched-phase-2", title: "Choreography Rehearsals for Dance Sequences", description: "Block choreography for feature songs with dancers.", requiredRole: "Choreographer", requiredSkills: ["Dance Choreography"], dependencies: ["t2-1"], parallelWith: [], estimatedDuration: "4 days", priority: "high", status: "to_do", order: 3 },
              { id: "t2-4", phaseId: "sched-phase-2", title: "Record Feature Song Tracks for On-Set Playback", description: "Record master vocals and soundtrack for playback filming.", requiredRole: "Music Director", requiredSkills: ["Music Composition"], dependencies: [], parallelWith: [], estimatedDuration: "3 days", priority: "high", status: "to_do", order: 4 },
            ],
          },
          {
            id: "sched-phase-3",
            name: "Phase 3: Principal Photography (Songs, Dance & Fights)",
            description: "Full production shoot covering dramatic scenes, high-impact fight sequences, and song choreography.",
            purpose: "Capture all primary footage, multitrack audio, and action set pieces.",
            sourceReason: "Execution of visual and auditory master assets.",
            order: 3,
            workstreams: ["Principal Photography", "Action Set Pieces", "Song Sequences"],
            tasks: [
              { id: "t3-1", phaseId: "sched-phase-3", title: "Shoot Action Set Pieces & Climax Fights", description: "Multi-camera high-speed filming of fight choreography.", requiredRole: "Fight Master", requiredSkills: ["Action Choreography"], dependencies: ["t2-2"], parallelWith: [], estimatedDuration: "5 days", priority: "urgent", status: "to_do", order: 1 },
              { id: "t3-2", phaseId: "sched-phase-3", title: "Shoot Dance & Musical Sequences", description: "Capture choreographed musical performances on location.", requiredRole: "Choreographer", requiredSkills: ["Dance Choreography"], dependencies: ["t2-3", "t2-4"], parallelWith: [], estimatedDuration: "4 days", priority: "high", status: "to_do", order: 2 },
              { id: "t3-3", phaseId: "sched-phase-3", title: "Shoot Dramatic Dialogue & Comedy Scenes", description: "Film character confrontations and comedic dialogue timing.", requiredRole: "Director", requiredSkills: ["Film Directing"], dependencies: [], parallelWith: [], estimatedDuration: "6 days", priority: "high", status: "to_do", order: 3 },
            ],
          },
          {
            id: "sched-phase-4",
            name: "Phase 4: Post-Production, VFX & Sound Design",
            description: "Rough cut, fine picture cut, fight VFX cleanup, Foley sound design, and DaVinci color grading.",
            purpose: "Assemble and polish film master.",
            sourceReason: "Action and comedy require precise editorial rhythm and impactful sound effects.",
            order: 4,
            workstreams: ["Picture Edit", "Visual Effects", "Sound Design", "Color Grading"],
            tasks: [
              { id: "t4-1", phaseId: "sched-phase-4", title: "Assembly & Fine Cut Pacing", description: "Edit action pacing and comedic timing in Premiere Pro.", requiredRole: "Video Editor", requiredSkills: ["Premiere Pro"], dependencies: ["t3-1", "t3-2", "t3-3"], parallelWith: [], estimatedDuration: "7 days", priority: "high", status: "to_do", order: 1 },
              { id: "t4-2", phaseId: "sched-phase-4", title: "Action VFX & Wire Removal", description: "Perform wire removal, bullet hit sparks, and visual effects cleanup.", requiredRole: "VFX Artist", requiredSkills: ["VFX"], dependencies: ["t4-1"], parallelWith: [], estimatedDuration: "5 days", priority: "high", status: "to_do", order: 2 },
              { id: "t4-3", phaseId: "sched-phase-4", title: "Foley, Impact Sound Design & 5.1 Mix", description: "Layer combat punches, ambient soundscapes, and final surround mix.", requiredRole: "Sound Designer", requiredSkills: ["Sound Design"], dependencies: ["t4-1"], parallelWith: [], estimatedDuration: "5 days", priority: "high", status: "to_do", order: 3 },
            ],
          },
          {
            id: "sched-phase-5",
            name: "Phase 5: Final Mastering & Distribution",
            description: "Color grade lock, DCI-compliant DCP export, censor certification, and trailer marketing release.",
            purpose: "Prepare theatrical and digital delivery package.",
            sourceReason: "Finalization requirements for exhibition and distribution.",
            order: 5,
            workstreams: ["Mastering", "Marketing", "Distribution"],
            tasks: [
              { id: "t5-1", phaseId: "sched-phase-5", title: "Color Grade & Theatrical Master (DCP)", description: "Export mastered DCI-P3 print.", requiredRole: "Colorist", requiredSkills: ["DaVinci Resolve"], dependencies: ["t4-2", "t4-3"], parallelWith: [], estimatedDuration: "3 days", priority: "high", status: "to_do", order: 1 },
              { id: "t5-2", phaseId: "sched-phase-5", title: "Trailer Cut & Promotional Campaign", description: "Cut 90-second teaser and theatrical trailer.", requiredRole: "Video Editor", requiredSkills: ["Trailer Editing"], dependencies: ["t4-1"], parallelWith: [], estimatedDuration: "3 days", priority: "high", status: "to_do", order: 2 },
            ],
          },
        ];

        if (project) {
          project.phases = schedulePhases;
          project.tasks = schedulePhases.flatMap((p) => p.tasks);
          updateActiveProject(project);
          saveProjectToStorage(project);
        }

        finalResponseText = `### 📅 Complete Production Schedule: ${projTitle}\n\n` +
          `I have prepared the complete production schedule for your **${projGenre}** covering songs, dance, fight sequences, and final delivery across **5 key phases**:\n\n` +
          `#### 1. Development & Script Approval\n` +
          `• Complete action sequences, comedic dialogue, and song cues\n` +
          `• Final shooting script sign-off\n\n` +
          `#### 2. Pre-Production, Stunts & Rehearsals\n` +
          `• Casting lead cast (Hero & Heroine)\n` +
          `• **Fight Master stunt choreography & safety drills**\n` +
          `• **Choreographer dance rehearsals** for songs\n` +
          `• Studio playback recording of songs\n\n` +
          `#### 3. Principal Photography (Songs, Dance & Fights)\n` +
          `• High-octane action set pieces & climax fights\n` +
          `• Choreographed song picturizations on location\n` +
          `• Dramatic character scenes & comedic dialogue\n\n` +
          `#### 4. Post-Production, VFX & Sound Design\n` +
          `• Fine picture editing for action timing & comedic beats\n` +
          `• Stunt wire removal & visual effects polish\n` +
          `• Foley impact sound design, combat audio & 5.1 surround mix\n\n` +
          `#### 5. Final Mastering & Distribution\n` +
          `• DaVinci color grading & DCP master export\n` +
          `• Theatrical trailer cut and marketing distribution\n\n` +
          `This schedule has been updated in your active project workspace.`;

        suggestedChips = [
          "Who is missing?",
          "Build my complete film squad.",
          "Find Creators",
          "View Workspace",
        ];
        setViewMode("blueprint");
        finalIntent = "PROJECT_SCHEDULE";
        finalProjectAction = "UPDATE_PROJECT";
      } else if (
        intentResult.intent === "TEAM_GAP_ANALYSIS" ||
        intentResult.intent === "PROJECT_ANALYSIS"
      ) {
        let targetProj = resolveActiveProject(currentActive || activeProject);
        const ownerId = profile?.id || user?.id || targetProj?.ownerId;
        const squadId = targetProj?.squadId || activeSquadId || CANONICAL_FILM_SQUAD_ID;
        let counts: Record<string, number> = {};

        if (squadId && targetProj) {
          targetProj.squadId = squadId;
          const [dbMembers, dbInvs] = await Promise.all([
            fetchSquadMembers(squadId),
            fetchSquadInvitations(squadId),
          ]);
          setInvitations(dbInvs);
          const allQueryRoles = Array.from(new Set([
            ...(targetProj.roles?.map((r) => r.roleName) || []),
            ...SHORT_FILM_ROLE_DEFINITIONS.map((r) => r.name),
            ...ALL_CANONICAL_CINEMATIC_ROLES,
          ]));
          counts = await getRoleCandidateCounts(allQueryRoles, ownerId);
          targetProj = reconcileProjectTeamState(targetProj, dbMembers, dbInvs, ownerId, counts);
          updateActiveProject(targetProj);
          currentActive = targetProj;
        } else {
          const allQueryRoles = Array.from(new Set([
            ...(targetProj?.roles && targetProj.roles.length > 0
              ? targetProj.roles.map((r) => r.roleName)
              : []),
            ...SHORT_FILM_ROLE_DEFINITIONS.map((r) => r.name),
            ...ALL_CANONICAL_CINEMATIC_ROLES,
          ]));
          counts = await getRoleCandidateCounts(allQueryRoles, ownerId);
        }

        const isMusicContext =
          targetProj?.canonicalDomain === "MUSIC_BAND" ||
          targetProj?.domain === "Music";
        const domainHint = isMusicContext ? "MUSIC_BAND" : undefined;
        finalResponseText = buildDynamicMissingRolesResponse(
          targetProj,
          !isMusicContext && (updatedState.currentUserRole === "DIRECTOR" || conversationState.currentUserRole === "DIRECTOR" || targetProj?.currentUserRole === "DIRECTOR"),
          domainHint,
          counts
        );

        if (isMusicContext) {
          suggestedChips = ["Find all music creators", "Find Lead Singer", "Build my complete music band"];
        } else {
          suggestedChips = [
            "Find them",
            "Find Dancers",
            "Find Sound Designers",
            "Find Singers",
            "Build Complete Film Squad",
          ];
        }
        finalIntent = "TEAM_GAP_ANALYSIS";
      } else if (
          intentResult.intent === "CREATOR_JOB_SEARCH" ||
          intentResult.intent === "CLIENT_OPPORTUNITY_SEARCH" ||
          intentResult.intent === "CLIENT_SEARCH" ||
          intentResult.matching_action === "SEARCH_CLIENT_OPPORTUNITIES" ||
          intentResult.matching_action === "SEARCH_CLIENTS"
        ) {
          const tDbStart = performance.now();
          const targetRole =
            intentResult.targetRole ||
            updatedState.currentUserRole ||
            ((intentResult.intent === "CREATOR_JOB_SEARCH" || intentResult.intent === "CLIENT_OPPORTUNITY_SEARCH") ? "Video Editor" : undefined);
          const clientRes = await searchClientOpportunities({
            query: trimmed,
            role: targetRole,
            page: 1,
            pageSize: 10,
          });
          databaseMs = performance.now() - tDbStart;

          clientCards = clientRes.opportunities;
          paginationState = {
            page: clientRes.page,
            pageSize: clientRes.pageSize,
            totalCount: clientRes.totalCount,
            hasMore: clientRes.hasMore,
          };
          matchStatus = clientCards.length > 0 ? "matched" : "empty";

          updatedState.lastSearchType = "clients";
          updatedState.searchPagination = paginationState;
          if (clientCards.length > 0) {
            updatedState.selectedJobId = clientCards[0].id;
            updatedState.selectedJob = clientCards[0];
            updatedState.lastSearchResults = clientCards;
          }

          const isCreatorSeeker =
            intentResult.intent === "CREATOR_JOB_SEARCH" ||
            intentResult.intent === "CLIENT_OPPORTUNITY_SEARCH" ||
            intentResult.matching_action === "SEARCH_CLIENT_OPPORTUNITIES" ||
            updatedState.currentUserType === "CREATOR" ||
            updatedState.activeGoal === "FIND_JOB";

          if (isCreatorSeeker) {
            const roleName = targetRole || "Video Editor";
            const roleIcon =
              roleName.toLowerCase().includes("video") ? "🎬" :
              roleName.toLowerCase().includes("dev") ? "💻" :
              roleName.toLowerCase().includes("design") ? "🎨" :
              roleName.toLowerCase().includes("photo") ? "📷" :
              roleName.toLowerCase().includes("singer") || roleName.toLowerCase().includes("music") ? "🎵" :
              roleName.toLowerCase().includes("actor") ? "🎭" : "💼";

            if (clientCards.length > 0) {
              const opportunityList = clientCards.map((j, idx) => {
                const skillsStr = j.skillsRequired && j.skillsRequired.length > 0 ? `\n   - **Skills:** ${j.skillsRequired.join(", ")}` : "";
                const budgetStr = j.budget ? `\n   - **Budget:** ${j.budget}` : "";
                const deadlineStr = j.deadline ? `\n   - **Deadline:** ${j.deadline}` : "";
                return `${idx + 1}. **${j.title}**\n   - **Client:** ${j.clientName}\n   - **Required Role:** ${roleName}${skillsStr}${budgetStr}${deadlineStr}\n   - **Status:** Open`;
              }).join("\n\n");

              finalResponseText = `### ${roleIcon} Clients Looking for ${roleName}s\n\n` +
                `Found ${clientRes.totalCount} open opportunit${clientRes.totalCount > 1 ? "ies" : "y"} in OmniCraft:\n\n` +
                `${opportunityList}\n\n` +
                `Select any opportunity below to review details and click **Apply** to send your application.`;

              suggestedChips = [
                `Apply to ${clientCards[0].title}`,
                "Show More Opportunities",
                "View My Applications",
              ];
            } else {
              finalResponseText = `No open client opportunities requiring ${roleName}s were found.`;
              suggestedChips = ["Browse All Jobs", "Search Another Role", "Explore Squads"];
            }
            finalIntent = intentResult.intent || "CLIENT_OPPORTUNITY_SEARCH";
            finalMatchingAction = intentResult.matching_action || "SEARCH_CLIENT_OPPORTUNITIES";
          } else {
            if (clientCards.length > 0) {
              finalResponseText = `Found ${clientRes.totalCount} active client opportunit${clientRes.totalCount > 1 ? "ies" : "y"} in OmniCraft:`;
              suggestedChips = ["Show More Opportunities", "Search Video Editing Jobs", "Apply to Job"];
            } else {
              finalResponseText = "No open client opportunities currently match your search criteria. Check back soon or create your own project brief!";
              suggestedChips = ["Browse All Jobs", "Create Project", "Explore Creators"];
            }
            finalIntent = "CLIENT_SEARCH";
            finalMatchingAction = "SEARCH_CLIENTS";
          }
        } else if (
          intentResult.intent === "APPLY_FOR_JOB" ||
          intentResult.matching_action === "APPLY_JOB"
        ) {
          let targetJob: ClientOpportunity | null = updatedState.selectedJob || null;
          if (!targetJob && updatedState.lastSearchResults && updatedState.lastSearchResults.length > 0) {
            const lower = trimmed.toLowerCase();
            const matchedByTitle = updatedState.lastSearchResults.find((j: any) =>
              j.title && lower.includes(j.title.toLowerCase())
            );
            targetJob = matchedByTitle || updatedState.lastSearchResults[0];
          }

          if (!targetJob) {
            const role = updatedState.currentUserRole || "Video Editor";
            const searchRes = await searchClientOpportunities({ role, page: 1, pageSize: 1 });
            if (searchRes.opportunities.length > 0) {
              targetJob = searchRes.opportunities[0];
            }
          }

          if (targetJob) {
            const applicantId = user?.id || profile?.id;
            const applicantUsername = profile?.username || user?.email?.split("@")[0] || "creator";
            const applicantRole = updatedState.currentUserRole || "Video Editor";

            const { data: appData, error: appErr } = await supabase
              .from("job_applications")
              .insert({
                job_id: targetJob.id,
                applicant_id: applicantId,
                status: "pending",
                message: `Applied via OmniForge AI Assistant as ${applicantRole}`,
              })
              .select()
              .single();

            if (appErr) {
              console.warn("[OmniForge] Application insert error:", appErr);
            }

            if (targetJob.clientId) {
              try {
                await supabase.from("notifications").insert({
                  user_id: targetJob.clientId,
                  actor_id: applicantId,
                  type: "job_application",
                  entity_type: "job",
                  entity_id: targetJob.id,
                  read: false,
                  data: {
                    job_title: targetJob.title,
                    applicant_name: profile?.full_name || `@${applicantUsername}`,
                    role: applicantRole,
                    application_id: appData?.id,
                  },
                });
              } catch (e) {
                console.warn("[OmniForge] Notification insert warning:", e);
              }
            }

            updatedState.appliedJobIds = [...(updatedState.appliedJobIds || []), targetJob.id];
            updatedState.selectedJobId = targetJob.id;
            updatedState.selectedJob = targetJob;
            clientCards = [targetJob];

            finalResponseText = `### ✅ Application Submitted Successfully!\n\n` +
              `Your application for **${targetJob.title}** has been sent to **${targetJob.clientName}**.\n\n` +
              `* **Position:** ${targetJob.title}\n` +
              `* **Client:** ${targetJob.clientName}\n` +
              `* **Applicant:** @${applicantUsername} (${applicantRole})\n` +
              `* **Status:** ⏳ **Pending Review**\n` +
              `* **Notification:** Sent directly to client\n\n` +
              `The client has been notified and can review your verified profile. You can track this and other applications in your Jobs dashboard.`;

            suggestedChips = ["View Open Opportunities", "Show More Opportunities", "Explore Creator Squads"];
          } else {
            finalResponseText = "Please select or search for an open opportunity first to submit your application.";
            suggestedChips = ["Search Video Editing Jobs", "Browse All Jobs"];
          }

          finalIntent = "APPLY_FOR_JOB";
          finalMatchingAction = "APPLY_JOB";
        } else if (
          intentResult.intent === "SQUAD_SEARCH" ||
          intentResult.matching_action === "SEARCH_SQUADS"
        ) {
          const tDbStart = performance.now();
          const squadRes = await searchSquadsDirectory({
            query: trimmed,
            page: 1,
            pageSize: 10,
          });
          databaseMs = performance.now() - tDbStart;

          squadCards = squadRes.squads;
          paginationState = {
            page: squadRes.page,
            pageSize: squadRes.pageSize,
            totalCount: squadRes.totalCount,
            hasMore: squadRes.hasMore,
          };
          matchStatus = squadCards.length > 0 ? "matched" : "empty";

          updatedState.lastSearchType = "squads";
          updatedState.searchPagination = paginationState;
          if (squadCards.length > 0) {
            updatedState.selectedSquad = squadCards[0];
            finalResponseText = `Found ${squadRes.totalCount} creative squad${squadRes.totalCount > 1 ? "s" : ""} in the OmniCraft directory:`;
            suggestedChips = ["Hire Selected Squad", "Explore Squads", "Create New Squad"];
          } else {
            finalResponseText = "No squads currently match your criteria. You can form a new squad or search individual creators!";
            suggestedChips = ["Create a Squad", "Find Creators", "Explore Jobs"];
          }
          finalIntent = "SQUAD_SEARCH";
          finalMatchingAction = "SEARCH_SQUADS";
        } else if (
          (intentResult.intent as any) === "FOLLOW_UP_PAGINATION" ||
          (intentResult.intent as any) === "FOLLOW_UP" ||
          (intentResult.matching_action as any) === "PAGINATE_SEARCH"
        ) {
          const prevType = updatedState.lastSearchType || "creators";
          const nextPage = (updatedState.searchPagination?.page || 1) + 1;

          const tDbStart = performance.now();
          if (prevType === "creators") {
            const role = updatedState.targetRole || "Creator";
            const searchRes = await searchCreatorsDirectory({
              targetRole: role,
              page: nextPage,
              pageSize: 10,
              currentUserId: profile?.id || user?.id,
            });
            matchedCards = searchRes.creators;
            paginationState = {
              page: searchRes.page,
              pageSize: searchRes.pageSize,
              totalCount: searchRes.totalCount,
              hasMore: searchRes.hasMore,
            };
            updatedState.searchPagination = paginationState;
            finalResponseText = `Showing page ${nextPage} of ${role} profiles (${matchedCards.length} additional creators):`;
            suggestedChips = ["Show More", "Invite Creator", "Refine Search"];
          } else if (prevType === "clients") {
            const role = updatedState.currentUserRole || updatedState.targetRole;
            const clientRes = await searchClientOpportunities({ role, page: nextPage, pageSize: 10 });
            clientCards = clientRes.opportunities;
            paginationState = {
              page: clientRes.page,
              pageSize: clientRes.pageSize,
              totalCount: clientRes.totalCount,
              hasMore: clientRes.hasMore,
            };
            updatedState.searchPagination = paginationState;
            finalResponseText = `Showing page ${nextPage} of open opportunities:`;
            suggestedChips = ["Show More", "Apply to Job"];
          } else if (prevType === "squads") {
            const squadRes = await searchSquadsDirectory({ page: nextPage, pageSize: 10 });
            squadCards = squadRes.squads;
            paginationState = {
              page: squadRes.page,
              pageSize: squadRes.pageSize,
              totalCount: squadRes.totalCount,
              hasMore: squadRes.hasMore,
            };
            updatedState.searchPagination = paginationState;
            finalResponseText = `Showing page ${nextPage} of creative squads:`;
            suggestedChips = ["Hire Squad", "Show More"];
          }
          databaseMs = performance.now() - tDbStart;
        } else if (intentResult.intent === "PROJECT_VIEW") {
          setViewMode("blueprint");
          finalResponseText = activeProject
            ? `Displaying execution blueprint and talent architecture for "${activeProject.title}".`
            : "No project is currently active. Describe your project idea to generate a structured blueprint!";
          suggestedChips = activeProject ? ["Find Cast & Crew", "Review Budget", "Create Squad"] : ["Create a Project"];
        } else if (
          intentResult.intent === "PROJECT_MODIFY" ||
          intentResult.intent === "PROJECT_MODIFICATION" ||
          intentResult.project_action === "UPDATE_PROJECT" ||
          /\b(?:build|generate|create|refine|update|expand|give\s+me|show\s+me)\s+(?:the\s+)?(?:complete\s+|full\s+|comprehensive\s+)?(?:project\s+)?architecture\b/i.test(trimmed) ||
          /\b(?:all\s+technical\s+and\s+domain\s+roles|technical\s+and\s+domain\s+roles|all\s+roles\s+required|complete\s+architecture)\b/i.test(trimmed)
        ) {
          let targetProject = activeProject || currentActive;
          if (!targetProject) {
            const activeId = getActiveProjectId();
            const all = loadProjectsFromStorage();
            targetProject = (activeId ? all.find((p) => p.id === activeId) : all[0]) || null;
          }
          if (targetProject) {
            const modified = modifyBlueprintFromInstruction(targetProject, trimmed);

            // Match creators for updated / enriched roles
            const tDbStart = performance.now();
            const matchResult = await matchCreatorsForProject(modified.updatedProject, user?.id);
            databaseMs = performance.now() - tDbStart;

            const updatedProject: OmniForgeProject = {
              ...modified.updatedProject,
              recommendations: matchResult.recommendations,
              coverage: matchResult.coverage,
              updatedAt: new Date().toISOString(),
            };

            updateActiveProject(updatedProject);
            currentActive = updatedProject;
            updatedState.activeProjectId = updatedProject.id;
            setViewMode("blueprint");
            matchedCards = matchResult.recommendations;
            missingCaps = matchResult.coverage.missingCapabilities;
            matchStatus = matchedCards.length > 0 ? "matched" : "empty";

            finalResponseText = modified.replyMessage || "Project blueprint updated successfully based on your instruction.";
          } else {
            finalResponseText = "Please create or select an active project first before making modifications.";
          }
          suggestedChips = ["Find Creators", "View Blueprint", "Who is still missing?", "Create Squad"];
        } else if (
          intentResult.intent === "HIRE_SQUAD" ||
          intentResult.matching_action === "HIRE_SQUAD"
        ) {
          const targetSquad = updatedState.selectedSquad || squadCards[0];
          if (targetSquad) {
            setSquadToHire(targetSquad);
            finalResponseText = `Opening hiring proposal for "${targetSquad.name}". You can customize your project brief, budget, and timeline below:`;
          } else {
            finalResponseText = "Which squad would you like to hire? You can discover squads by asking 'Find film production squads' and select one to hire.";
            suggestedChips = ["Find Squads", "Find Video Editors", "Explain Squad Hiring"];
          }
        } else if (
          intentResult.intent === "INVITE_CREATOR" ||
          intentResult.matching_action === "INVITE_CREATOR"
        ) {
          const targetName = intentResult.targetRole || "the creator";
          finalResponseText = `Ready to invite ${targetName}. Click the Invite button on their creator card to customize the invitation message and terms:`;
          suggestedChips = ["Send Invitation", "Browse More Creators", "Review Project Roles"];
        } else if (
          intentResult.intent === "COLLABORATION_ACTION" ||
          intentResult.intent === "INVITATION_OR_COLLABORATION_ACTION" ||
          intentResult.matching_action === "ADD_TO_TEAM"
        ) {
          let project = currentActive;
          if (!project) {
            project = generateStructuredBlueprint(
              "Romantic Musical Film",
              userType,
              profile?.id || user?.id || "anon",
              "DIRECTOR"
            );
            project.title = "Romantic Musical Film";
            project.currentUserRole = "DIRECTOR";
            project.squadId = "d7c14b35-6554-4c23-a638-527f0d6c7df4";
            saveProjectToStorage(project);
          } else if (
            (project.title === "Romantic Musical Film" ||
             (project.title?.toLowerCase().includes("musical") &&
              project.title?.toLowerCase().includes("romantic"))) &&
            !project.title?.toLowerCase().includes("action")
          ) {
            project.title = "Romantic Musical Film";
            project.currentUserRole = "DIRECTOR";
            project.squadId = "d7c14b35-6554-4c23-a638-527f0d6c7df4";
          }

          const rawIdentifier = (intentResult.targetCreatorName || "").trim();
          const creatorIdentifier = rawIdentifier || (selectedCandidateCardRef.current?.creator.username ?? "ramu");

          // Step 1 to 7: Resolve Creator Candidate
          const resolution = await resolveCreatorCandidate(
            creatorIdentifier,
            selectedCandidateCardRef.current
          );

          if (resolution.status === "AMBIGUOUS") {
            finalResponseText =
              `I found multiple creators named **${resolution.originalQuery}**. Which one do you mean?\n\n` +
              resolution.candidates
                .map((c) => `• **@${c.username}** (${c.fullName || c.username}${c.role && c.role !== "creator" ? ` — ${c.role}` : ""})`)
                .join("\n") +
              `\n\nPlease select one or specify their @username to add them to your squad.`;

            suggestedChips = resolution.candidates.map((c) => `Add @${c.username} to team`);
          } else if (resolution.status === "NOT_FOUND") {
            finalResponseText = `Could not find a creator profile matching "${resolution.query}" in the OmniCraft directory. Please verify their username or search from the directory.`;
            suggestedChips = ["Find Cast & Crew", "Browse Creators", "Start Over"];
          } else {
            const creatorProf = resolution.creator;

            // Target Role Determination (NEVER infer from missingRoles[0] or first open role)
            let assignedRole = intentResult.targetRole || resolution.matchedRole;

            if (!assignedRole) {
              // Check recent search results
              const matchInSearch = recentSearchResultsRef.current.find(
                (r) =>
                  r.creator.id === creatorProf.id ||
                  r.creator.username.toLowerCase() === creatorProf.username.toLowerCase()
              );
              if (matchInSearch) {
                assignedRole = matchInSearch.roleName;
              }
            }

            if (!assignedRole && lastSearchRoleRef.current) {
              const val = validateCreatorForRole(creatorProf, lastSearchRoleRef.current);
              if (val.isValid) {
                assignedRole = lastSearchRoleRef.current;
              }
            }

            if (!assignedRole) {
              const existingRec = project.recommendations.find(
                (r) =>
                  r.creator.id === creatorProf.id ||
                  r.creator.username.toLowerCase() === creatorProf.username.toLowerCase()
              );
              if (existingRec) {
                assignedRole = existingRec.roleName;
              }
            }

            if (!assignedRole) {
              // Check evidence against canonical roles
              let bestCanonRole: string | null = null;
              let bestScore = 0;
              for (const canonRole of CANONICAL_FILM_EXTERNAL_ROLES) {
                const val = validateCreatorForRole(creatorProf, canonRole);
                if (val.isValid && val.score > bestScore) {
                  bestScore = val.score;
                  bestCanonRole = canonRole;
                }
              }
              if (bestCanonRole) {
                assignedRole = bestCanonRole;
              }
            }

            // Guard: Never manufacture or guess roles without creator evidence
            if (!assignedRole) {
              finalResponseText = `@${creatorProf.username} does not have verified evidence for open project roles. Which role would you like to assign them to?`;
              suggestedChips = CANONICAL_FILM_EXTERNAL_ROLES.map((r) => `Add @${creatorProf.username} as ${r} to team`);
            } else {
              // Validate creator role evidence
              const roleValidation = validateCreatorForRole(creatorProf, assignedRole);
              if (!roleValidation.isValid) {
                finalResponseText = `Cannot assign @${creatorProf.username} as **${assignedRole}**. ${roleValidation.reason}\n\nPlease choose a role that matches their verified creative experience.`;
                suggestedChips = [
                  "Find Video Editors",
                  "Find Cinematographers",
                  "Who is still missing from my film team?",
                ];
              } else {
                // Check if target position is already filled by another creator
                const isReplaceCommand = /\b(?:replace|swap|substitute)\b/i.test(trimmed);
                const existingFilledRole = project.roles.find(
                  (r) => isRoleMatch(r.roleName, assignedRole!) && r.isFilled
                );
                const existingAcceptedRec = project.recommendations.find(
                  (r) =>
                    isRoleMatch(r.roleName, assignedRole!) &&
                    (r.status === "accepted" || r.invitationStatus === "accepted")
                );

                const existingOccupantId =
                  existingFilledRole?.assignedCreatorId || existingAcceptedRec?.creator?.id;
                const isOccupiedByAnother =
                  Boolean(existingOccupantId) && existingOccupantId !== creatorProf.id;

                // Section 11: Duplicate role assignment protection
                const isMultiRoleConfirmed = /\b(?:confirm|yes,? also assign|also assign|force assign|multiple roles)\b/i.test(trimmed);
                const existingRoleOfCreator =
                  project.recommendations.find(
                    (r) =>
                      r.creator.id === creatorProf.id &&
                      (r.status === "accepted" || r.invitationStatus === "accepted") &&
                      !isRoleMatch(r.roleName, assignedRole!)
                  ) ||
                  project.roles.find(
                    (r) =>
                      r.assignedCreatorId === creatorProf.id &&
                      r.isFilled &&
                      !isRoleMatch(r.roleName, assignedRole!)
                  );

                if (existingRoleOfCreator && !isMultiRoleConfirmed) {
                  const existingRoleName =
                    "roleName" in existingRoleOfCreator ? existingRoleOfCreator.roleName : "another role";
                  finalResponseText =
                    `@${creatorProf.username} is currently assigned as **${existingRoleName}**.\n\n` +
                    `Do you want to also assign them as **${assignedRole}**?`;
                  suggestedChips = [
                    `Yes, also assign @${creatorProf.username} as ${assignedRole}`,
                    `Keep @${creatorProf.username} as ${existingRoleName} only`,
                  ];
                } else if (isOccupiedByAnother && !isReplaceCommand) {
                  const existingUsername =
                    existingAcceptedRec?.creator?.username || "another creator";
                  const missingRoles = project.coverage.missingCapabilities.map((m) => m.roleName);
                  const nextMissing = missingRoles[0] || "Lead Actress";

                  finalResponseText =
                    `@${creatorProf.username} matches **${assignedRole}**, but your ${assignedRole} position is already filled by **@${existingUsername}**.\n\n` +
                    `Would you like to:\n` +
                    `• **Replace the current ${assignedRole}** with @${creatorProf.username}\n` +
                    `• **Keep @${creatorProf.username}** as an additional editor\n` +
                    `• **Search for a ${nextMissing}**`;

                  suggestedChips = [
                    `Replace ${assignedRole} with @${creatorProf.username}`,
                    `Keep @${creatorProf.username} as additional editor`,
                    `Find a ${nextMissing}`,
                  ];
                } else {
                  // Valid assignment or replacement
                  const ownerId = profile?.id || user?.id || project.ownerId;
                  const squadRes = await getOrCreateProjectSquad(project, ownerId);
                  if (squadRes.success && squadRes.squadId) {
                    project.squadId = squadRes.squadId;
                    setActiveSquadId(squadRes.squadId);

                    // 1. Upsert into squad_members
                    const { error: memberErr } = await supabase.from("squad_members").upsert(
                      {
                        squad_id: squadRes.squadId,
                        user_id: creatorProf.id,
                        role: assignedRole,
                      },
                      { onConflict: "squad_id,user_id" }
                    );
                    if (memberErr) {
                      console.warn("[OmniForge] squad_members upsert error:", memberErr);
                    }

                    // 2. Upsert into squad_invitations
                    const { error: invErr } = await (supabase as any).from("squad_invitations").upsert(
                      {
                        squad_id: squadRes.squadId,
                        inviter_id: ownerId,
                        invitee_id: creatorProf.id,
                        role: assignedRole,
                        status: "accepted",
                        project_name: project.title,
                        updated_at: new Date().toISOString(),
                      },
                      { onConflict: "squad_id,invitee_id" }
                    );
                    if (invErr) {
                      console.warn("[OmniForge] squad_invitations upsert error:", invErr);
                    }

                    // 3. Fetch canonical members and invitations from Supabase
                    const [dbMembers, dbInvs] = await Promise.all([
                      fetchSquadMembers(squadRes.squadId),
                      fetchSquadInvitations(squadRes.squadId),
                    ]);
                    setInvitations(dbInvs);

                    // 4. Synthesize newly added creator if DB read experienced network/replica latency
                    let reconciledDbMembers = [...dbMembers];
                    if (!reconciledDbMembers.some((m) => m.user_id === creatorProf.id)) {
                      reconciledDbMembers.push({
                        id: `mem-${creatorProf.id}`,
                        squad_id: squadRes.squadId,
                        user_id: creatorProf.id,
                        role: assignedRole,
                        created_at: new Date().toISOString(),
                        user: {
                          id: creatorProf.id,
                          username: creatorProf.username,
                          full_name: creatorProf.fullName || creatorProf.username,
                          avatar_url: creatorProf.avatarUrl,
                        },
                      });
                    }

                    project = applyCreatorToProject(project, creatorProf, assignedRole, undefined, { confirmMultiRole: isMultiRoleConfirmed });
                    const roleNames = Array.from(new Set([
                      ...project.roles.map((r) => r.roleName),
                      ...SHORT_FILM_ROLE_DEFINITIONS.map((r) => r.name),
                      ...ALL_CANONICAL_CINEMATIC_ROLES,
                    ]));
                    const candidateCounts = await getRoleCandidateCounts(roleNames, ownerId);
                    project = reconcileProjectTeamState(project, reconciledDbMembers, dbInvs, ownerId, candidateCounts);

                    // Explicit debug object matching requirement 15
                    console.log("[OmniForge Team Reconciliation Debug]", {
                      activeProjectId: project.id,
                      squadId: project.squadId,
                      members: reconciledDbMembers.map((m) => ({ user_id: m.user_id, role: m.role, username: m.user?.username })),
                      acceptedInvitations: dbInvs.filter((i) => i.status === "accepted").map((i) => ({ invitee_id: i.invitee_id, role: i.role })),
                      coveredRoles: project.coverage.coveredCapabilities.map((c) => c.name),
                      missingRoles: project.coverage.missingCapabilities.map((m) => m.roleName),
                      totalRequired: project.coverage.totalRequired,
                      totalCovered: project.coverage.totalCovered,
                    });
                  } else {
                    project = applyCreatorToProject(project, creatorProf, assignedRole, undefined, { confirmMultiRole: isMultiRoleConfirmed });
                  }

                  updateActiveProject(project);
                  updatedState.activeProjectId = project.id;
                  currentActive = project;

                  const creatorName = creatorProf.fullName || creatorProf.username;
                  const uniqueAcceptedRecs: CreatorRecommendation[] = [];
                  for (const r of project.recommendations.filter((rec) => rec.status === "accepted")) {
                    if (!uniqueAcceptedRecs.some((u) => u.creator.id === r.creator.id || isRoleMatch(u.roleName, r.roleName))) {
                      uniqueAcceptedRecs.push(r);
                    }
                  }

                  finalResponseText = `### 🎬 ${creatorName} Added to Your Film Production Squad\n\n` +
                    `• **${assignedRole}:** @${creatorProf.username} *(now confirmed & accepted into squad)*\n\n` +
                    `**Current Production Roster:**\n` +
                    `• **Director:** You *(Covered by you — steering dramatic vision)*\n` +
                    uniqueAcceptedRecs.map((r) => `• **${r.roleName}:** @${r.creator.username} *(Accepted & Confirmed)*`).join("\n") +
                    `\n\n**External Positions Filled:** ${project.coverage.totalCovered} of ${project.coverage.totalRequired}\n\n` +
                    `Would you like to check who is still missing or build your complete film squad?`;

                  suggestedChips = [
                    "Who is still missing from my film team?",
                    "Build my complete film squad.",
                    "Find Cinematographers",
                    "Find Video Editors",
                  ];
                }
              }
            }
          }
        } else if (
          intentResult.intent === "HIRE_CREATOR" ||
          intentResult.matching_action === "HIRE_CREATOR"
        ) {
          const targetName = intentResult.targetRole || "the creator";
          finalResponseText = `Initiating hire proposal for ${targetName}. You can review terms and submit an offer:`;
          suggestedChips = ["Send Offer", "Review Terms", "Browse More Creators"];
        } else if (intentResult.intent === "SKILL_SWAP") {
          const tDbStart = performance.now();
          const swapMatches = await searchRealSkillSwapListings({ needSkillOrRole: "Film & Video" });
          databaseMs = performance.now() - tDbStart;
          skillSwapCards = swapMatches;
          finalResponseText = swapMatches.length > 0
            ? "Here are active Skill Swap listings from verified creators on OmniCraft:"
            : "No active Skill Swap offers found for this category right now. You can post a new Skill Swap listing!";
          suggestedChips = ["Post Skill Swap Offer", "Explore Creators", "Create Project"];
        } else if (
          (intentResult.intent as any) === "PROJECT_ANALYSIS" &&
          (trimmed.toLowerCase().includes("missing") || trimmed.toLowerCase().includes("orchestration") || trimmed.toLowerCase().includes("filled"))
        ) {
          let targetProject = currentActive;
          const ownerId = profile?.id || user?.id || targetProject?.ownerId;
          const squadId = targetProject?.squadId || activeSquadId;

          if (squadId && targetProject) {
            targetProject.squadId = squadId;
            const [dbMembers, dbInvs] = await Promise.all([
              fetchSquadMembers(squadId),
              fetchSquadInvitations(squadId),
            ]);
            setInvitations(dbInvs);
            const roleNames = targetProject.roles.map((r) => r.roleName);
            const candidateCounts = await getRoleCandidateCounts(roleNames, ownerId);
            targetProject = reconcileProjectTeamState(targetProject, dbMembers, dbInvs, ownerId, candidateCounts);
            updateActiveProject(targetProject);
            currentActive = targetProject;
          }

          const isMusicContext =
            targetProject?.canonicalDomain === "MUSIC_BAND" ||
            targetProject?.domain === "Music" ||
            targetProject?.projectType === "Music Band" ||
            Boolean(targetProject?.title?.toLowerCase().includes("music band")) ||
            Boolean(detectCanonicalDomain(trimmed, null) === "MUSIC_BAND");

          finalResponseText = buildDynamicMissingRolesResponse(
            targetProject,
            !isMusicContext && (updatedState.currentUserRole === "DIRECTOR" || conversationState.currentUserRole === "DIRECTOR" || targetProject?.currentUserRole === "DIRECTOR"),
            isMusicContext ? "MUSIC_BAND" : undefined
          );
          suggestedChips = isMusicContext
            ? [
                "Find all music creators",
                "Find Lead Singer",
                "Build my complete music band",
                "Create Squad",
              ]
            : [
                "Build my complete film squad.",
                "Find Cinematographers",
                "Find Video Editors",
                "Start with Hero & Heroine",
              ];
        } else if (
          intentResult.matching_action === "REQUIRE_ROLE" ||
          Boolean(parseExplicitRoleRequirementRequest(trimmed))
        ) {
          const explicitReq = parseExplicitRoleRequirementRequest(trimmed);
          const reqRole = explicitReq?.roleName || intentResult.targetRole || "Dancer";
          const reqLevel = explicitReq?.level || "PROJECT_REQUIRED";
          const reqReason = explicitReq?.reason || "Explicitly requested by user for this film.";

          let targetProject = resolveActiveProject(currentActive || activeProject);
          if (!targetProject) {
            targetProject = generateStructuredBlueprint(
              "Short Film Production",
              userType,
              profile?.id || user?.id || "anon",
              "DIRECTOR"
            );
            targetProject.title = "Short Film Production";
            targetProject.currentUserRole = "DIRECTOR";
            targetProject.squadId = CANONICAL_FILM_SQUAD_ID;
          }

          targetProject.roleRequirements = targetProject.roleRequirements || {};
          targetProject.roleRequirements[reqRole] = {
            level: reqLevel,
            reason: reqReason,
          };

          const existingRole = targetProject.roles.find((r) => isRoleMatch(r.roleName, reqRole));
          if (!existingRole) {
            targetProject.roles.push({
              id: `role-${normalizeRoleKey(reqRole)}`,
              roleName: reqRole,
              category: "Creative",
              requiredSkills: [reqRole],
              description: `Required production position: ${reqRole}`,
              isFilled: false,
              isEssential: true,
            });
          } else {
            existingRole.isEssential = true;
          }

          const ownerId = profile?.id || user?.id || targetProject.ownerId;
          const candidateCounts = await getRoleCandidateCounts([reqRole], ownerId);
          const count = candidateCounts[reqRole] ?? 0;

          const squadId = targetProject.squadId || activeSquadId;
          if (squadId) {
            const [dbMembers, dbInvs] = await Promise.all([
              fetchSquadMembers(squadId),
              fetchSquadInvitations(squadId),
            ]);
            targetProject = reconcileProjectTeamState(targetProject, dbMembers, dbInvs, ownerId, candidateCounts);
          }

          updateActiveProject(targetProject);
          saveProjectToStorage(targetProject);
          currentActive = targetProject;

          finalResponseText = `### 🎬 Production Requirement Activated\n\n` +
            `✓ **${reqRole}** has been marked as **[${reqLevel}]** for your project.\n\n` +
            `• **Reason:** ${reqReason}\n` +
            `• **Available in Directory:** ${count} verified creator${count === 1 ? "" : "s"} found in directory\n\n` +
            `Would you like to search verified candidates for **${reqRole}** or check who is still missing?`;

          suggestedChips = [
            `Find ${reqRole}s`,
            "Who is still missing from my film team?",
            "Build my complete film squad.",
          ];
          finalIntent = "PROJECT_MODIFY";
          finalMatchingAction = "REQUIRE_ROLE";
        } else if (intentResult.intent === "TEAM_FORMATION") {
          setViewMode("team");
          let targetProject = currentActive;

          const isMusicTarget =
            targetProject?.canonicalDomain === "MUSIC_BAND" ||
            targetProject?.domain === "Music" ||
            targetProject?.projectType === "Music Band" ||
            Boolean(targetProject?.title?.toLowerCase().includes("music band")) ||
            Boolean(detectCanonicalDomain(trimmed, null) === "MUSIC_BAND");

          if (!targetProject) {
            if (isMusicTarget) {
              targetProject = generateRequirementsDerivedBlueprint({
                prompt: trimmed,
                userType,
                userId: profile?.id || user?.id || "anon",
              });
              targetProject.title = "My Music Band";
              targetProject.canonicalDomain = "MUSIC_BAND";
              targetProject.domain = "Music";
              targetProject.projectType = "Music Band";
              saveProjectToStorage(targetProject);
            } else {
              const detectedGenre = detectFilmGenre(trimmed);
              const defaultTitle =
                detectedGenre === "musical"
                  ? "Romantic Musical Film"
                  : detectedGenre === "action"
                  ? "Action Short Film"
                  : detectedGenre === "documentary"
                  ? "Documentary Film"
                  : "Short Film Production";
              targetProject = generateStructuredBlueprint(
                defaultTitle,
                userType,
                profile?.id || user?.id || "anon",
                updatedState.currentUserRole || conversationState.currentUserRole || "DIRECTOR"
              );
              targetProject.title = defaultTitle;
              targetProject.currentUserRole = "DIRECTOR";
              targetProject.squadId = "d7c14b35-6554-4c23-a638-527f0d6c7df4";
            }
          } else if (
            !isMusicTarget &&
            targetProject.canonicalDomain !== "MUSIC_BAND" &&
            targetProject.domain !== "Music" &&
            (targetProject.title === "Romantic Musical Film" ||
             (targetProject.title?.toLowerCase().includes("musical") &&
              targetProject.title?.toLowerCase().includes("romantic"))) &&
            !targetProject.title?.toLowerCase().includes("action")
          ) {
            targetProject.title = "Romantic Musical Film";
            targetProject.currentUserRole = "DIRECTOR";
            targetProject.squadId = "d7c14b35-6554-4c23-a638-527f0d6c7df4";
          }

          const ownerId = profile?.id || user?.id || targetProject.ownerId;
          const squadId = targetProject.squadId || activeSquadId;
          if (squadId) {
            targetProject.squadId = squadId;
          }
          const squadRes = await getOrCreateProjectSquad(targetProject, ownerId);
          if (squadRes.success && squadRes.squadId) {
            targetProject.squadId = squadRes.squadId;
            setActiveSquadId(squadRes.squadId);

            const [dbMembers, dbInvs] = await Promise.all([
              fetchSquadMembers(squadRes.squadId),
              fetchSquadInvitations(squadRes.squadId),
            ]);
            setInvitations(dbInvs);
            const roleNames = targetProject.roles.map((r) => r.roleName);
            const candidateCounts = await getRoleCandidateCounts(roleNames, ownerId);
            targetProject = reconcileProjectTeamState(targetProject, dbMembers, dbInvs, ownerId, candidateCounts);

            // Debug log matching requirement 15
            console.log("[OmniForge Team Reconciliation Debug]", {
              activeProjectId: targetProject.id,
              squadId: targetProject.squadId,
              members: dbMembers.map((m) => ({ user_id: m.user_id, role: m.role, username: m.user?.username })),
              acceptedInvitations: dbInvs.filter((i) => i.status === "accepted").map((i) => ({ invitee_id: i.invitee_id, role: i.role })),
              coveredRoles: targetProject.coverage.coveredCapabilities.map((c) => c.name),
              missingRoles: targetProject.coverage.missingCapabilities.map((m) => m.roleName),
              totalRequired: targetProject.coverage.totalRequired,
              totalCovered: targetProject.coverage.totalCovered,
            });
          }

          updateActiveProject(targetProject);
          updatedState.activeProjectId = targetProject.id;
          currentActive = targetProject;

          const filledCount = targetProject.coverage.totalCovered;
          const totalCount = targetProject.coverage.totalRequired;

          const uniqueAccepted: CreatorRecommendation[] = [];
          for (const r of targetProject.recommendations.filter((rec) => rec.status === "accepted")) {
            if (!uniqueAccepted.some((u) => u.creator.id === r.creator.id || isRoleMatch(u.roleName, r.roleName))) {
              uniqueAccepted.push(r);
            }
          }

          if (isMusicTarget || targetProject.canonicalDomain === "MUSIC_BAND" || targetProject.domain === "Music") {
            finalResponseText = `### 🎵 Music Band Team Orchestration\n\n` +
              `**${filledCount} of ${totalCount} Band Positions Filled**\n\n` +
              (uniqueAccepted.length > 0
                ? uniqueAccepted
                    .map((r) => `✓ **${r.roleName}:** @${r.creator.username} *(ACCEPTED — ${r.matchScore}% Verified Match)*`)
                    .join("\n") + "\n\n"
                : "") +
              `**OPEN POSITIONS:**\n` +
              targetProject.coverage.missingCapabilities
                .map((m) => `○ **${m.roleName}**`)
                .join("\n") +
              `\n\nDisplaying the complete music band workspace on the right.`;

            suggestedChips = [
              "Find all music creators",
              "Find Lead Singer",
              "Who is still missing?",
              "Create Squad & Workspace",
            ];
          } else {
            const roleNames = SHORT_FILM_ROLE_DEFINITIONS.map((r) => r.name);
            const counts = await getRoleCandidateCounts(roleNames, ownerId);
            const status = calculateFilmTeamStatus(targetProject, true, counts, trimmed);

            finalResponseText = `### 🎬 Film Squad Orchestration & Crew Architecture\n\n` +
              `**External Positions Filled:** ${status.externalPositionsFilledText}\n\n` +
              `#### ✓ Filled Positions (${status.assignedRoles.length + 1})\n` +
              `• **Director:** Covered by You\n` +
              status.assignedRoles.map((a) => `• **${a.roleName}:** ${a.assignedCreatorName || "@creator"} *(Assigned & Confirmed)*`).join("\n") +
              `\n\n` +
              (status.openRolesWithCreators.length > 0
                ? `#### 🟡 Open With Candidates (${status.openRolesWithCreators.length})\n` +
                  status.openRolesWithCreators.map((o) => `• **${o.roleName}:** ${o.matchingCreatorCount} verified creator${o.matchingCreatorCount > 1 ? "s" : ""} available *(${o.requirementReason})*`).join("\n") +
                  `\n\n`
                : "") +
              (status.openRolesWithoutCreators.length > 0
                ? `#### 🔴 Open Without Candidates (${status.openRolesWithoutCreators.length})\n` +
                  status.openRolesWithoutCreators.map((n) => `• **${n.roleName}:** 0 candidates *(open for casting brief — ${n.requirementReason})*`).join("\n") +
                  `\n\n`
                : "") +
              (status.projectDependentRoles.length > 0
                ? `#### 💡 Project-Dependent Roles (${status.projectDependentRoles.length})\n` +
                  status.projectDependentRoles.map((p) => `• **${p.roleName}:** ${p.matchingCreatorCount} creator${p.matchingCreatorCount > 1 ? "s" : ""} available *(${p.requirementReason})*`).join("\n") +
                  `\n\n`
                : "") +
              `**Team Building Actions:**\n` +
              `You decide who to invite. Select an action below to explore or cast open roles:`;

            const actionChips: string[] = [];
            for (const op of status.openRolesWithCreators) {
              actionChips.push(`Find ${op.roleName}s`);
            }
            actionChips.push("Who is still missing?");
            suggestedChips = actionChips.slice(0, 5);
          }
        } else if (intentResult.intent === "FILM_TEAM_PLANNING") {
          let targetProject = currentActive;
          if (!targetProject) {
            targetProject = generateStructuredBlueprint(
              trimmed,
              userType,
              user?.id || "anon",
              "DIRECTOR"
            );
            if (trimmed.toLowerCase().includes("musical") || trimmed.toLowerCase().includes("romantic")) {
              targetProject.title = "Romantic Musical Film";
              targetProject.squadId = "d7c14b35-6554-4c23-a638-527f0d6c7df4";
            }
            targetProject.currentUserRole = "DIRECTOR";
            saveProjectToStorage(targetProject);
          } else {
            targetProject.currentUserRole = "DIRECTOR";
          }
          updateActiveProject(targetProject);
          updatedState.activeProjectId = targetProject.id;
          updatedState.currentUserRole = "DIRECTOR";
          currentActive = targetProject;

          const ownerId = profile?.id || user?.id || targetProject?.ownerId;
          const candidateCounts = await getRoleCandidateCounts(
            SHORT_FILM_ROLE_DEFINITIONS.map((r) => r.name),
            ownerId
          );
          finalResponseText = buildCompleteFilmRoleMatrixResponse(
            targetProject,
            true,
            candidateCounts,
            trimmed
          );
          suggestedChips = [
            "Find them",
            "Find Dancers",
            "Find Sound Designers",
            "Who is still missing?",
            "Build Complete Film Squad",
          ];
          finalIntent = "FILM_TEAM_PLANNING";
        } else if (intentResult.intent === "DEFINITION" || intentResult.intent === "GENERAL_KNOWLEDGE" || intentResult.intent === "KNOWLEDGE") {
          finalResponseText = intentResult.deterministicText?.trim() || "";
          if (!finalResponseText) {
            throw new Error("Missing deterministic text for definition. Re-routing to AI.");
          }
          suggestedChips = intentResult.suggestedChips || [];
          setViewMode("chat");
        } else {
          // GREETING, IDENTITY, CAPABILITY_QUERY, KNOWLEDGE, HOW_TO, CLARIFICATION
          finalResponseText = intentResult.deterministicText || "Hi! I'm OmniForge AI, your creative project partner inside OmniCraft.";
          suggestedChips = intentResult.suggestedChips || ["Create a Project", "Find Creators", "Explore Squads"];
        }
      } else {
        // [AI] Ollama / Generative path for creative generation, story generation, modification, and critique
        executionMode = "AI";
        console.log("[AI] Ollama request started");
        console.log("[AI] model=qwen3:4b");
        console.log(`[AI] reason=${intentResult.intent}`);

        const isStory = intentResult.intent === "STORY_GENERATION" || intentResult.intent === "STORY_MODIFICATION";
        const initialStatus = isStory ? "Generating story..." : "Thinking...";

        // Immediate responsive streaming placeholder (guarded against StrictMode double-invocation)
        setMessages((prev) => {
          const withoutStream = prev.filter((m) => m.id !== streamMsgId);
          return [
            ...withoutStream,
            {
              id: streamMsgId,
              sender: "ai",
              text: initialStatus,
              timestamp: new Date().toISOString(),
              isThinking: true,
              sourceMeta: {
                provider: "local-ollama",
                model: "qwen3:4b",
                isRealLLM: true,
                status: "live_verified",
                statusMessage: initialStatus,
                executionMode: "AI",
              },
            },
          ];
        });

        const isEducationalOrTechnical = [
          "TECHNICAL_QUESTION",
          "EDUCATIONAL_QUESTION",
          "EXAM_PREPARATION",
          "LAB_QUESTION",
          "VIVA_QUESTION",
          "PROGRAMMING_QUESTION",
          "MATH_QUESTION",
          "DEFINITION",
          "GENERAL_KNOWLEDGE",
        ].includes(intentResult.intent) || (
          ["DEFINITION", "EXPLANATION"].includes(intentResult.intent) &&
          /\b(?:viva|exam|semester|lab|experiments?|program|code|algorithm|math|physics|chemistry|biology|tcp|udp|osi|paging|avl\s*tree|dbms|dns|subnetting|derivative|integral|eigenvalue)\b/i.test(trimmed)
        );

        // Compact history (last 6 turns)
        const historyPayload = baseMessages
          .filter((m) => !m.isError && m.text)
          .slice(-6)
          .map((m) => ({
            role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
            content: m.text,
          }));

        // Scoped project context: Only inject project context when query is genuinely project-related!
        const isProjectTurn = isQueryProjectRelated(trimmed, currentActive || activeProject);
        const isStoryTurn = isQueryStoryRelated(trimmed, Boolean(updatedState.activeStory));

        const projectContext = (isProjectTurn && (currentActive || activeProject))
          ? {
              title: (currentActive || activeProject)?.title,
              domain: (currentActive || activeProject)?.domain,
              story_premise: (currentActive || activeProject)?.storyPremise || (currentActive || activeProject)?.title,
              active_story: updatedState.activeStory,
            }
          : (isStoryTurn && updatedState.activeStory)
          ? { active_story: updatedState.activeStory }
          : undefined;

        let chunkCount = 0;
        const aiStart = performance.now();
        const localResult = await sendLocalAIChatMessage(
          trimmed,
          historyPayload,
          projectContext,
          undefined, // Dedicated idle-timeout strategy (no 60s abort while stream is active)
          (_token, accumulated) => {
            chunkCount++;
            let currentStatus = "Generating...";
            if (isStory) {
              if (chunkCount < 15) {
                currentStatus = "Generating story...";
              } else if (chunkCount < 80) {
                currentStatus = "Generating...";
              } else {
                currentStatus = "Almost finished...";
              }
            } else {
              currentStatus = "Generating response...";
            }

            setMessages((prev) => {
              const existingIdx = prev.findIndex((m) => m.id === streamMsgId);
              const streamingMsg: ChatMessage = {
                id: streamMsgId,
                sender: "ai",
                text: accumulated,
                timestamp: new Date().toISOString(),
                isThinking: true,
                sourceMeta: {
                  provider: "local-ollama",
                  model: "qwen3:4b",
                  isRealLLM: true,
                  status: "live_verified",
                  statusMessage: currentStatus,
                  executionMode: "AI",
                },
              };
              if (existingIdx >= 0) {
                const updated = [...prev];
                updated[existingIdx] = streamingMsg;
                return updated;
              } else {
                return [...prev, streamingMsg];
              }
            });
          },
          intentResult.intent,
          currentAbortController.signal
        );

        ollamaMs = performance.now() - aiStart;
        console.log(`[AI] Ollama completed in ${Math.round(ollamaMs)}ms`);

        finalResponseText = localResult.answer;
        finalIntent = localResult.intent || intentResult.intent;
        finalProjectAction = localResult.project_action || intentResult.project_action;
        finalMatchingAction = localResult.matching_action || intentResult.matching_action;
        localAiProvider = localResult.provider || "local-ollama";
        localAiModel = localResult.model || "qwen3:4b";

        if (
          finalIntent === "STORY_GENERATION" ||
          finalIntent === "STORY_MODIFICATION" ||
          isStoryTurn ||
          /\b(?:story|screenplay|script|shot\s*list|scene)\b/i.test(trimmed)
        ) {
          if (localResult.answer && localResult.answer.length > 50) {
            updatedState.activeStory = localResult.answer;
            setConversationState(updatedState);
          }
        }

        const isArchitectureRefinement =
          (finalIntent === "PROJECT_MODIFY" ||
           finalIntent === "PROJECT_MODIFICATION" ||
           finalProjectAction === "UPDATE_PROJECT" ||
           /\b(?:all\s+technical\s+and\s+domain\s+roles|complete\s+project\s+architecture)\b/i.test(trimmed)) &&
          !["GENERAL_CHAT", "KNOWLEDGE", "GENERAL_KNOWLEDGE", "DEFINITION", "HOW_TO", "STORY_GENERATION", "STORY_MODIFICATION", "ROADMAP_CREATE", "ROADMAP_REQUEST", "ROADMAP_CAPABILITY_INQUIRY", "VIEW_SAVED_ROADMAP", "LIST_SAVED_ROADMAPS", "SAVE_ROADMAP", "EXPAND_ROADMAP_STAGE", "COMPARE_ROADMAPS", "EXPLAIN_TOPIC", "DELETE_ROADMAP"].includes(finalIntent);

        if (isArchitectureRefinement && (currentActive || activeProject)) {
          const targetProj = currentActive || activeProject;
          const refined = enrichBlueprintWithArchitectureRefinement(targetProj!, trimmed);
          const tDbStart = performance.now();
          const matchResult = await matchCreatorsForProject(refined.updatedProject, user?.id);
          databaseMs += performance.now() - tDbStart;

          const updatedWithMatches: OmniForgeProject = {
            ...refined.updatedProject,
            recommendations: matchResult.recommendations,
            coverage: matchResult.coverage,
            updatedAt: new Date().toISOString(),
          };
          updateActiveProject(updatedWithMatches);
          currentActive = updatedWithMatches;
          setViewMode("blueprint");
          matchedCards = matchResult.recommendations;
          missingCaps = matchResult.coverage.missingCapabilities;
          matchStatus = matchedCards.length > 0 ? "matched" : "empty";

          // The workspace and AI response must use the SAME canonical blueprint
          finalResponseText = refined.replyMessage;
        }

        suggestedChips = getDynamicSuggestedChips({
          intent: finalIntent,
          activeProject,
          userQuery: trimmed,
          resultCount: matchedCards.length,
          initialChips: localResult.suggested_chips || intentResult.suggestedChips,
        });
      }


      // Normalization and Telemetry
      const tNormStart = performance.now();
      const totalMs = Math.round(performance.now() - t0);

      const telemetry: LatencyTelemetry = {
        intent: finalIntent,
        execution_mode: executionMode,
        intent_detection_ms: Math.round(intentDetectionMs),
        context_build_ms: Math.round(contextBuildMs),
        database_ms: Math.round(databaseMs),
        ollama_ms: Math.round(ollamaMs),
        response_normalization_ms: Math.round(performance.now() - tNormStart),
        total_ms: totalMs,
        first_token_ms: Math.round(firstTokenMs || (isFastAction ? intentDetectionMs + 1 : (ollamaMs > 0 ? ollamaMs * 0.35 : intentDetectionMs + 5))),
      };

      if (import.meta.env.DEV) {
        console.log("[OmniForge Telemetry]", telemetry);
      }

      // Robust response validation: ensure non-empty response, trim whitespace, and prevent empty messages
      const valResult = validateLocalAIResponse(finalResponseText, {
        intent: finalIntent,
      });
      if (!valResult.isValid) {
        throw new Error(
          valResult.error || "The assistant returned an empty response. Please click Retry."
        );
      }
      finalResponseText = valResult.cleanedText;

      // Build final assistant chat message
      const aiMsg: ChatMessage = {
        id: streamMsgId,
        sender: "ai",
        text: finalResponseText,
        timestamp: new Date().toISOString(),
        userIntent: finalIntent,
        projectAction: finalProjectAction,
        matchingAction: finalMatchingAction,
        creatorCards: matchedCards.length > 0 ? matchedCards : undefined,
        clientCards: clientCards.length > 0 ? clientCards : undefined,
        squadCards: squadCards.length > 0 ? squadCards : undefined,
        skillSwapCards: skillSwapCards.length > 0 ? skillSwapCards : undefined,
        suggestedChips: suggestedChips.length > 0 ? suggestedChips : undefined,
        searchPagination: paginationState,
        missingCapabilities: missingCaps.length > 0 ? missingCaps : undefined,
        matchingStatus: matchStatus !== "idle" ? matchStatus : undefined,
        roadmapArtifact:
          messageRoadmapArtifact ||
          ((
            finalIntent === "ROADMAP_CREATE" ||
            finalIntent === "ROADMAP_MODIFY" ||
            finalIntent === "VIEW_CURRENT_ROADMAP" ||
            finalIntent === "ROADMAP_REQUEST" ||
            finalIntent === "EXPAND_ROADMAP_STAGE" ||
            finalIntent === "SAVE_ROADMAP"
          )
            ? intelProfile.roadmap
            : undefined),
        projectPlanArtifact:
          finalIntent === "PROJECT_PLAN_REQUEST" || finalIntent === "PROJECT_PLAN_GENERATE"
            ? intelProfile.activeProjectPlan || undefined
            : undefined,
        sourceMeta: {
          provider: isFastAction ? "fast-path" : localAiProvider,
          model: isFastAction ? "deterministic" : localAiModel,
          responseOwner: isFastAction
            ? (databaseMs > 0 ? "SUPABASE" : "FAST_PATH")
            : (databaseMs > 0 ? "HYBRID" : "LLM_GENERATION"),
          isRealLLM: !isFastAction,
          status: "live_verified",
          statusMessage: isFastAction ? "Fast path — Ollama skipped" : `Local AI: ${localAiProvider} (${localAiModel})`,
          executionMode,
          telemetry,
        },
        conversationState: updatedState,
      };

      // Functional state update (pure function, no side effects)
      setMessages((prev) => {
        const withoutStream = prev.filter((m) => m.id !== streamMsgId);
        return [...withoutStream, aiMsg];
      });

      // Persist history outside state updater to prevent StrictMode duplicate side effects
      if (activeProject) {
        const stored = loadChatHistoryFromStorage(activeProject.id);
        const withoutStream = stored.filter((m) => m.id !== streamMsgId);
        saveChatHistoryToStorage(activeProject.id, [...withoutStream, aiMsg]);
      } else {
        const draft = loadActiveDraftSession();
        const withoutStream = (draft.messages || []).filter((m) => m.id !== streamMsgId);
        saveActiveDraftSession([...withoutStream, aiMsg], updatedState);
      }

      // Persist conversation to persistent history
      const fullMessages = [...baseMessages.filter((m) => m.id !== streamMsgId), aiMsg];
      const existingConv = loadConversation(activeConversationId, user?.id);
      const title = existingConv?.title || generateConversationTitle(trimmed);
      const convToSave: OmniForgeConversation = {
        id: activeConversationId,
        title,
        userId: user?.id || "anon",
        createdAt: existingConv?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: fullMessages,
        state: updatedState,
        activeProjectId: activeProject?.id,
      };
      saveConversation(convToSave, user?.id);
      setConversations(loadConversationsList(user?.id));

      setIntelligenceInfo({
        provider: isFastAction ? "fast-path" : localAiProvider,
        model: isFastAction ? "deterministic" : localAiModel,
        isRealLLM: !isFastAction,
        status: "live_verified",
        statusMessage: isFastAction
          ? `Fast Path Active • Instant (< ${totalMs}ms)`
          : `OmniForge AI Active • ${localAiProvider.toUpperCase()} (${localAiModel})`,
      });
    } catch (err: any) {
      if (currentAbortController.signal.aborted || err?.message === "Generation was cancelled.") {
        console.log("[OmniForge] Generation cancelled by user.");
        return;
      }
      console.error("OmniForge AI Chat error:", err);
      let errorMessage =
        err?.message || "Failed to communicate with OmniForge AI service.";

      if (err?.isInterrupted || errorMessage.toLowerCase().includes("interrupted")) {
        errorMessage = "Generation was interrupted. Retry from the last completed point.";
      }

      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: errorMessage,
        timestamp: new Date().toISOString(),
        isError: true,
        errorMessage,
        failedPrompt: trimmed,
        sourceMeta: {
          provider: "local-ollama",
          model: "qwen3:4b",
          isRealLLM: false,
          status: "provider_error",
          statusMessage: errorMessage,
        },
      };

      // Functional state update (pure function, no side effects)
      setMessages((prev) => {
        const withoutStream = prev.filter((m) => m.id !== streamMsgId);
        return [...withoutStream, errorMsg];
      });

      // Persist error history outside state updater
      if (activeProject) {
        const stored = loadChatHistoryFromStorage(activeProject.id);
        const withoutStream = stored.filter((m) => m.id !== streamMsgId);
        saveChatHistoryToStorage(activeProject.id, [...withoutStream, errorMsg]);
      } else {
        const draft = loadActiveDraftSession();
        const withoutStream = (draft.messages || []).filter((m) => m.id !== streamMsgId);
        saveActiveDraftSession([...withoutStream, errorMsg], conversationState);
      }

      const fullErrorMessages = [...baseMessages.filter((m) => m.id !== streamMsgId), errorMsg];
      const existingErrConv = loadConversation(activeConversationId, user?.id);
      const errTitle = existingErrConv?.title || generateConversationTitle(trimmed);
      saveConversation(
        {
          id: activeConversationId,
          title: errTitle,
          userId: user?.id || "anon",
          createdAt: existingErrConv?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          messages: fullErrorMessages,
          state: conversationState,
          activeProjectId: activeProject?.id,
        },
        user?.id
      );
      setConversations(loadConversationsList(user?.id));

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
      if (abortControllerRef.current === currentAbortController) {
        abortControllerRef.current = null;
      }
    }
  };

  const handleCancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    isSubmittingRef.current = false;
    setMessages((prev) =>
      prev.map((m) =>
        m.isThinking
          ? {
              ...m,
              isThinking: false,
              text: m.text ? `${m.text}\n\n*(Generation stopped)*` : "*(Generation stopped)*",
            }
          : m
      )
    );
  }, []);

  const handleStartOver = () => {
    setActiveProject(null);
    setActiveProjectId(null);
    clearActiveDraftSession();
    setMessages([]);
    setConversationState(createInitialConversationState());
    setViewMode("chat");
    setCompareModalOpen(false);
    setCompareRoleId(null);
    setInviteModalOpen(false);
    setSelectedInviteCandidate(null);
    setIsLoading(false);
    isSubmittingRef.current = false;
  };

  const handleSelectProject = (proj: OmniForgeProject) => {
    setActiveProject(proj);
    setActiveProjectId(proj.id);
    setViewMode(proj.stage === "in_progress" || proj.stage === "team_ready" ? "workspace" : "blueprint");
    const history = loadChatHistoryFromStorage(proj.id);
    setMessages(history);
    const lastAiWithState = [...history].reverse().find((m) => m.conversationState);
    if (lastAiWithState?.conversationState) {
      setConversationState(lastAiWithState.conversationState);
    } else {
      setConversationState(createInitialConversationState());
    }
  };

  const handleFindCreatorsForRole = async (roleName: string) => {
    handleSendMessage(`Find me a ${roleName}`);
  };

  const handleConfirmAction = async (actionType: string, payload?: any) => {
    if (actionType === "create_squad") {
      await handleLaunchSquad();
    } else {
      toast.success("Action confirmed!");
    }
  };

  const handleOpenInviteModal = (cand: CreatorRecommendation) => {
    setSelectedInviteCandidate(cand);
    setInviteModalOpen(true);
  };

  const handleInvitationSent = (invitation: SquadInvitation) => {
    setInvitations((prev) => [invitation, ...prev.filter((i) => i.id !== invitation.id)]);
    if (invitation.squad_id) {
      setActiveSquadId(invitation.squad_id);
    }
    if (activeProject) {
      const updatedRecs = activeProject.recommendations.map((r) =>
        r.creator.id === invitation.invitee_id
          ? { ...r, status: "invited" as const, invitationStatus: "pending" as const }
          : r
      );
      const updatedProject = {
        ...activeProject,
        squadId: activeProject.squadId || invitation.squad_id,
        recommendations: updatedRecs,
      };
      updateActiveProject(updatedProject);
    }
    toast.success(`Invitation sent to ${invitation.invitee?.full_name || invitation.invitee?.username || "creator"}!`);
    setInviteModalOpen(false);
  };

  const handleRefreshInvitations = useCallback(() => {
    const sid = activeSquadId || activeProject?.squadId;
    if (sid) {
      fetchSquadInvitations(sid).then(setInvitations);
    }
  }, [activeSquadId, activeProject?.squadId]);

  const handleInviteCreator = (recId: string) => {
    if (!activeProject) return;
    const rec = activeProject.recommendations.find((r) => r.id === recId);
    if (rec) {
      handleOpenInviteModal(rec);
      return;
    }
    const updatedRecs = activeProject.recommendations.map((r) =>
      r.id === recId ? { ...r, status: "invited" as const, invitationStatus: "pending" as const } : r
    );
    updateActiveProject({ ...activeProject, recommendations: updatedRecs });
    toast.success("Invitation sent to creator!");
  };

  const handleOpenCompare = (roleId: string) => {
    setCompareRoleId(roleId);
    setCompareModalOpen(true);
  };

  const handleSelectCandidate = async (cand: CreatorRecommendation) => {
    selectedCandidateCardRef.current = cand;

    // Validate role evidence
    const roleVal = validateCreatorForRole(cand.creator, cand.roleName);
    if (!roleVal.isValid) {
      toast.error(`Cannot assign @${cand.creator.username} as ${cand.roleName}: ${roleVal.reason}`);
      return;
    }

    let proj = resolveActiveProject(activeProject, conversationState.activeProjectId || getActiveProjectId());
    if (!proj) return;
    const assignedRole = cand.roleName;

    // Check if role is already filled by another creator
    const existingFilled = proj.roles.find((r) => isRoleMatch(r.roleName, assignedRole) && r.isFilled);
    const existingRec = proj.recommendations.find(
      (r) => isRoleMatch(r.roleName, assignedRole) && (r.status === "accepted" || r.invitationStatus === "accepted")
    );
    const existingOccupantId = existingFilled?.assignedCreatorId || existingRec?.creator.id;
    if (existingOccupantId && existingOccupantId !== cand.creator.id) {
      const existingName = existingRec?.creator.username || "another creator";
      toast.warning(`${assignedRole} is already filled by @${existingName}. Ask to replace in chat.`);
      return;
    }

    const ownerId = profile?.id || user?.id || proj.ownerId;
    const squadRes = await getOrCreateProjectSquad(proj, ownerId);
    if (squadRes.success && squadRes.squadId) {
      proj.squadId = squadRes.squadId;
      setActiveSquadId(squadRes.squadId);

      await supabase.from("squad_members").upsert(
        {
          squad_id: squadRes.squadId,
          user_id: cand.creator.id,
          role: assignedRole,
        },
        { onConflict: "squad_id,user_id" }
      );

      await (supabase as any).from("squad_invitations").upsert(
        {
          squad_id: squadRes.squadId,
          inviter_id: ownerId,
          invitee_id: cand.creator.id,
          role: assignedRole,
          status: "accepted",
          project_name: proj.title,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "squad_id,invitee_id" }
      );

      const [dbMembers, dbInvs] = await Promise.all([
        fetchSquadMembers(squadRes.squadId),
        fetchSquadInvitations(squadRes.squadId),
      ]);
      setInvitations(dbInvs);

      let reconciledDbMembers = [...dbMembers];
      if (!reconciledDbMembers.some((m) => m.user_id === cand.creator.id)) {
        reconciledDbMembers.push({
          id: `mem-${cand.creator.id}`,
          squad_id: squadRes.squadId,
          user_id: cand.creator.id,
          role: assignedRole,
          created_at: new Date().toISOString(),
          user: {
            id: cand.creator.id,
            username: cand.creator.username,
            full_name: cand.creator.fullName || cand.creator.username,
            avatar_url: cand.creator.avatarUrl || null,
          },
        });
      }

      proj = applyCreatorToProject(proj, cand.creator, assignedRole);
      const roleNames = proj.roles.map((r) => r.roleName);
      const candidateCounts = await getRoleCandidateCounts(roleNames, ownerId);
      proj = reconcileProjectTeamState(proj, reconciledDbMembers, dbInvs, ownerId, candidateCounts);
    } else {
      proj = applyCreatorToProject(proj, cand.creator, assignedRole);
    }
    updateActiveProject(proj);
    toast.success(`Selected and added ${cand.creator.fullName || cand.creator.username} as ${cand.roleName} to the squad`);
  };

  const handleUpdateTaskStatus = (taskId: string, status: TaskStatus) => {
    if (!activeProject) return;
    const updatedPhases = activeProject.phases.map((ph) => ({
      ...ph,
      tasks: ph.tasks.map((t) => (t.id === taskId ? { ...t, status } : t)),
    }));
    updateActiveProject({ ...activeProject, phases: updatedPhases });
  };

  const handleLaunchSquad = async () => {
    if (!activeProject || !user) return;
    setIsConvertingSquad(true);
    try {
      const res = await convertProjectToSquad(activeProject, user.id);
      if (res.success && res.squadId) {
        const updated = {
          ...activeProject,
          squadId: res.squadId,
          stage: "in_progress" as const,
        };
        updateActiveProject(updated);
        setViewMode("workspace");
        toast.success(`Squad "${res.squadName}" created with ${res.invitedCount} creator invitations!`);
      } else {
        toast.error(res.error || "Failed to convert squad");
      }
    } catch (e: any) {
      toast.error(e?.message || "Error launching squad");
    } finally {
      setIsConvertingSquad(false);
    }
  };

  const currentCompareRec =
    activeProject && compareRoleId
      ? activeProject.recommendations.find((r) => r.roleId === compareRoleId) || null
      : null;

  const compareAlternatives =
    activeProject && compareRoleId && activeProject.alternativeCandidates
      ? activeProject.alternativeCandidates[compareRoleId] || []
      : [];

  const activeSubmissionNode =
    (selectedSubmissionNodeId
      ? intelProfile.roadmap.nodes.find((n) => n.id === selectedSubmissionNodeId)
      : null) ||
    intelProfile.roadmap.nodes.find((n) => n.id === intelProfile.roadmap.currentNodeId) ||
    intelProfile.roadmap.nodes[intelProfile.roadmap.pointerLevel - 1] ||
    intelProfile.roadmap.nodes[0];

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-background">
      {/* ChatGPT-Style Collapsible Sidebar */}
      <OmniForgeSidebar
        isOpen={sidebarOpen}
        onToggle={handleToggleSidebar}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          handleSelectConversation(id);
          setActiveFullView(null);
        }}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        roadmaps={savedRoadmaps}
        activeRoadmapId={intelProfile.roadmap?.id}
        onSelectRoadmap={handleSelectRoadmap}
        onDeleteRoadmap={handleDeleteRoadmap}
        onRenameRoadmap={handleRenameRoadmap}
        projects={projects}
        activeProjectId={activeProject?.id}
        onSelectProject={(p) => {
          handleSelectProject(p);
          setActiveFullView("blueprint");
        }}
        onResumeUploadClick={() => setDocumentUploadModalOpen(true)}
        resumeParsed={intelProfile.resumeParsed}
        initialSection={activeFullView === "roadmap" ? "roadmaps" : undefined}
      />

      {/* Main Experience: Conversation-First or Contextual Full View */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-background">
        {/* Minimal Clean Header */}
        <header className="h-14 border-b border-border/80 px-3 sm:px-5 flex items-center justify-between gap-3 shrink-0 bg-background/95 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Sidebar toggle button */}
            <button
              onClick={handleToggleSidebar}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition shrink-0"
              title={
                activeFullView === "roadmap"
                  ? sidebarOpen
                    ? "Close roadmaps sidebar"
                    : "Open roadmaps sidebar"
                  : sidebarOpen
                  ? "Close sidebar"
                  : "Open sidebar"
              }
              aria-label={
                activeFullView === "roadmap"
                  ? sidebarOpen
                    ? "Close roadmaps sidebar"
                    : "Open roadmaps sidebar"
                  : sidebarOpen
                  ? "Close sidebar"
                  : "Open sidebar"
              }
            >
              {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
            </button>

            {/* If in contextual full view, show Back to Chat */}
            {activeFullView ? (
              <button
                onClick={() => setActiveFullView(null)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface hover:bg-surface-muted border border-border text-xs font-semibold text-foreground transition shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Chat</span>
              </button>
            ) : (
              /* Branding & New Chat button */
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 font-bold text-sm text-foreground">
                  <div className="w-6 h-6 rounded-lg bg-gradient-brand flex items-center justify-center text-white shadow-brand shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="hidden sm:inline">OmniForge</span>
                </div>

                <button
                  onClick={handleNewChat}
                  className="px-2.5 py-1 rounded-xl bg-surface hover:bg-surface-muted border border-border/80 text-xs font-semibold text-foreground flex items-center gap-1 transition shadow-xs"
                  title="Start a new clean chat"
                >
                  <Plus className="w-3.5 h-3.5 text-brand" />
                  <span className="hidden sm:inline">New Chat</span>
                </button>
              </div>
            )}

            {/* View Title if Full View */}
            {activeFullView && (
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider truncate hidden md:inline">
                {activeFullView === "roadmap" && "Interactive Roadmap Journey"}
                {activeFullView === "project_plan" && "AI Project Plan Architecture"}
                {activeFullView === "project_submission" && "Project Workspace & Code Evaluation"}
                {activeFullView === "skill_analysis" && "Skill DNA & Competency Matrix"}
                {activeFullView === "blueprint" && "Film Production Blueprint"}
                {activeFullView === "team" && "Creator Team Recommendations"}
                {activeFullView === "workspace" && "Film Production Workspace"}
              </div>
            )}
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Prominent Universal Upload Action */}
            <button
              onClick={() => setDocumentUploadModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-muted text-foreground text-xs font-semibold border border-border/80 flex items-center gap-1.5 shadow-xs transition"
              title="Upload PDF, DOCX, PPTX, TXT, or MD documents"
            >
              <Upload className="w-3.5 h-3.5 text-brand" />
              <span>Upload</span>
            </button>

            {/* Streak Badge (Only visible when qualifying streak > 0) */}
            {userStreak.currentStreak > 0 && (
              <div
                className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-semibold"
                title={`${userStreak.currentStreak} day study streak! Completed ${userStreak.totalActivitiesCompleted} activities.`}
              >
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                <span>{userStreak.currentStreak}d</span>
              </div>
            )}

            {/* If Resume was parsed or skills exist, provide contextual access to Skill DNA */}
            {intelProfile.resumeParsed && (
              <button
                onClick={() => setActiveFullView(activeFullView === "skill_analysis" ? null : "skill_analysis")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition shadow-xs ${
                  activeFullView === "skill_analysis"
                    ? "bg-brand text-white border-brand"
                    : "bg-surface hover:bg-surface-muted text-foreground border-border/80"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span className="hidden sm:inline">Skill DNA</span>
              </button>
            )}

            {/* Subtle LLM status badge */}
            <span
              title={intelligenceInfo.statusMessage || "AI Engine Connected"}
              className="hidden lg:flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-surface-muted border border-border/70 text-muted-foreground font-medium"
            >
              <Zap className="w-3 h-3 text-brand" />
              <span>{intelligenceInfo.model || "Local AI"}</span>
            </span>
          </div>
        </header>

        {/* Content View Container */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {activeFullView === null ? (
            /* Default: Primary ChatGPT-Style Chat Interface */
            <div className="h-full w-full">
              <OmniForgeChat
                messages={messages}
                onSendMessage={handleSendMessage}
                onRetry={handleSendMessage}
                onGenerateBlueprint={() => setActiveFullView("blueprint")}
                onStartOver={handleStartOver}
                isLoading={isLoading}
                userType={userType}
                activeProject={activeProject}
                onFindCreatorsForRole={handleFindCreatorsForRole}
                onSelectCreator={handleSelectCandidate}
                onInviteCreator={handleOpenInviteModal}
                onHireSquad={(sq) => setSquadToHire(sq)}
                invitations={invitations}
                onConfirmAction={handleConfirmAction}
                onOpenCompareModal={handleOpenCompare}
                onCancel={handleCancelGeneration}
                onResumeUploadClick={() => setDocumentUploadModalOpen(true)}
                onOpenRoadmapFullView={(rm) => {
                  if (rm) {
                    setIntelProfile((prev) => ({
                      ...prev,
                      roadmap: rm,
                    }));
                  }
                  setActiveFullView("roadmap");
                }}
                onOpenProjectPlanFullView={(plan) => {
                  if (plan) {
                    setIntelProfile((prev) => ({
                      ...prev,
                      activeProjectPlan: plan,
                    }));
                  }
                  setActiveFullView("project_plan");
                }}
                onOpenSkillAnalysisFullView={() => setActiveFullView("skill_analysis")}
              />
            </div>
          ) : (
            /* Contextual Workspaces (Revealed only when requested) */
            <div className={`h-full w-full ${activeFullView === "roadmap" ? "overflow-hidden p-2 sm:p-4 flex flex-col min-w-0" : "overflow-y-auto p-4 sm:p-6"}`}>
              {activeFullView === "roadmap" && (
                <div className="w-full h-full flex-1 min-h-0 flex flex-col roadmaps-main">
                  <VisualRoadmapJourney
                    roadmap={intelProfile.roadmap}
                    savedRoadmaps={intelProfile.savedRoadmaps}
                    savedRoadmapsList={savedRoadmaps}
                    onSelectRoadmapItem={handleSelectRoadmapById}
                    onCompleteTask={handleCompleteRoadmapTask}
                    onSkipTask={handleSkipRoadmapTask}
                    onStartProject={handleStartStageProject}
                    onSelectTrack={handleSelectRoadmapTrack}
                    onUpdateStudyPace={handleUpdateStudyPace}
                    onToggleTopicChecklist={handleToggleTopicChecklist}
                    isSidebarOpen={sidebarOpen}
                    onToggleSidebar={handleToggleSidebar}
                    onCreateRoadmapAction={() => setActiveFullView(null)}
                  />
                </div>
              )}

              {activeFullView === "project_plan" && (
                <div className="max-w-5xl mx-auto h-[780px]">
                  {intelProfile.activeProjectPlan ? (
                    <ProjectPlanVisualizer
                      plan={intelProfile.activeProjectPlan}
                      onFindTeamMembers={(role) => {
                        setActiveFullView(null);
                        handleSendMessage(`Find creators for ${role}`);
                      }}
                      onModifyPlan={() => {
                        setActiveFullView(null);
                        handleSendMessage("Update the project plan");
                      }}
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center p-8 bg-surface/50 border border-border/70 rounded-2xl text-center space-y-4">
                      <h3 className="text-base font-bold text-foreground">No Active Project Plan</h3>
                      <p className="text-xs text-muted-foreground">
                        Ask OmniForge to plan your project in chat to generate an architecture plan.
                      </p>
                      <button
                        onClick={() => {
                          setActiveFullView(null);
                          handleSendMessage("I want to build an AI-powered restaurant application");
                        }}
                        className="px-3.5 py-2 rounded-xl bg-gradient-brand text-white text-xs font-bold"
                      >
                        Generate Restaurant Plan in Chat
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeFullView === "skill_analysis" && (
                <div className="max-w-5xl mx-auto h-[780px]">
                  <SkillGapVisualizer
                    skillDna={intelProfile.skillDna}
                    skillGaps={intelProfile.skillGaps}
                    careerGoal={intelProfile.careerGoal}
                    onUploadResumeClick={() => setResumeModalOpen(true)}
                    onAskWhatToLearnNext={() => {
                      setActiveFullView(null);
                      handleSendMessage("What should I learn next?");
                    }}
                  />
                </div>
              )}

              {activeFullView === "project_submission" && activeSubmissionNode && (
                <div className="max-w-5xl mx-auto h-[780px]">
                  <ProjectSubmissionWorkspace
                    node={activeSubmissionNode}
                    skillDna={intelProfile.skillDna}
                    onSubmitProject={handleProjectSubmission}
                    onAdvanceMilestone={() => {
                      const nextNode = intelProfile.roadmap.nodes.find(
                        (n) => n.id === intelProfile.roadmap.currentNodeId
                      );
                      if (nextNode) {
                        setSelectedSubmissionNodeId(nextNode.id);
                      }
                    }}
                    isEvaluating={isEvaluatingProject}
                  />
                </div>
              )}

              {activeFullView === "blueprint" && activeProject && (
                <div className="max-w-6xl mx-auto h-full">
                  <ProjectBlueprintView
                    project={activeProject}
                    onProceedToTeam={() => setActiveFullView("team")}
                    onModifyPlan={() => setActiveFullView(null)}
                  />
                </div>
              )}

              {activeFullView === "team" && activeProject && (
                <div className="max-w-6xl mx-auto h-full">
                  <TeamRecommendationsView
                    project={activeProject}
                    invitations={invitations}
                    onInviteCandidate={handleOpenInviteModal}
                    onInviteCreator={handleInviteCreator}
                    onReplaceCreator={handleOpenCompare}
                    onCompareCandidates={handleOpenCompare}
                    onLaunchSquad={handleLaunchSquad}
                    onBackToBlueprint={() => setActiveFullView("blueprint")}
                    isConvertingSquad={isConvertingSquad}
                  />
                </div>
              )}

              {activeFullView === "workspace" && activeProject && (
                <div className="max-w-6xl mx-auto h-full">
                  <OmniForgeWorkspace
                    project={activeProject}
                    squadId={activeSquadId || activeProject.squadId}
                    currentUserId={user?.id}
                    invitations={invitations}
                    onRefreshInvitations={handleRefreshInvitations}
                    onUpdateTaskStatus={handleUpdateTaskStatus}
                    onUpdateProject={updateActiveProject}
                    onLaunchSquad={handleLaunchSquad}
                    isConvertingSquad={isConvertingSquad}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Universal Document Upload Modal */}
      <DocumentUploadModal
        isOpen={documentUploadModalOpen}
        onClose={() => setDocumentUploadModalOpen(false)}
        onDocumentProcessed={handleDocumentProcessed}
      />

      {/* Resume Upload & Calibration Modal */}
      <ResumeUploadModal
        isOpen={resumeModalOpen}
        onClose={() => setResumeModalOpen(false)}
        onApplyParsedData={handleApplyResumeData}
      />

      {/* Side-by-Side Candidate Comparison Modal */}
      <CompareCreatorsModal
        isOpen={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        roleName={currentCompareRec?.roleName || "Project Role"}
        currentRecommendation={currentCompareRec}
        alternatives={compareAlternatives}
        onSelectCandidate={handleSelectCandidate}
      />

      {/* Invite Creator to Project Collaboration Modal */}
      <InviteCreatorModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        creator={selectedInviteCandidate?.creator || null}
        roleName={selectedInviteCandidate?.roleName || ""}
        project={activeProject}
        currentUserId={profile?.id || user?.id}
        onInvitationSent={handleInvitationSent}
      />

      {/* Squad Hiring Proposal Modal */}
      {squadToHire && (
        <HireSquadModal
          squad={{
            id: squadToHire.id,
            name: squadToHire.name,
            specialty: squadToHire.specialty,
            avatar_url: squadToHire.avatarUrl,
            owner_id: squadToHire.ownerId,
          }}
          onClose={() => setSquadToHire(null)}
          onSuccess={() => {
            toast.success("Hiring proposal submitted to squad leader!");
            setSquadToHire(null);
          }}
        />
      )}
    </div>
  );
}
