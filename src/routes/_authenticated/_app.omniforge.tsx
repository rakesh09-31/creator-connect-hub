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
} from "@/lib/omniforge/types";
import { classifyUserIntent } from "@/lib/omniforge/intent";
import {
  createInitialConversationState,
  transitionConversationState,
  extractMatchingCriteriaFromContext,
} from "@/lib/omniforge/conversation-state";
import {
  generateStructuredBlueprint,
  modifyBlueprintFromInstruction,
  processConversationalOmniForgeMessage,
} from "@/lib/omniforge/engine";
import { omniforgeChatServerFn, omniforgeProviderStatusServerFn } from "@/lib/api/omniforge.functions";
import { sendLocalAIChatMessage, checkLocalAIHealth } from "@/lib/api/local-ai";
import { matchCreatorsForProject, matchCreatorsForSingleRole, matchCreatorsFromRequirements } from "@/lib/omniforge/matcher";
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
} from "@/lib/omniforge/storage";
import { convertProjectToSquad } from "@/lib/omniforge/squad-bridge";
import { SquadInvitation, fetchSquadInvitations } from "@/lib/omniforge/collaboration";
import { OmniForgeChat } from "@/components/omniforge/OmniForgeChat";
import { ProjectBlueprintView } from "@/components/omniforge/ProjectBlueprintView";
import { TeamRecommendationsView } from "@/components/omniforge/TeamRecommendationsView";
import { OmniForgeWorkspace } from "@/components/omniforge/OmniForgeWorkspace";
import { CompareCreatorsModal } from "@/components/omniforge/CompareCreatorsModal";
import { InviteCreatorModal } from "@/components/omniforge/InviteCreatorModal";

export const Route = createFileRoute("/_authenticated/_app/omniforge")({
  head: () => ({ meta: [{ title: "OmniForge — AI Project Architect & Creator Orchestrator" }] }),
  component: OmniForgePage,
});

function OmniForgePage() {
  const { user, profile } = useAuth();
  const userType = (profile?.role === "client" ? "client" : "creator") as "creator" | "client";

  const [projects, setProjects] = useState<OmniForgeProject[]>([]);
  const [activeProject, setActiveProject] = useState<OmniForgeProject | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"chat" | "blueprint" | "team" | "workspace">("chat");
  const [conversationState, setConversationState] = useState<ConversationState>(() => createInitialConversationState());
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

  // Load existing projects from storage and check provider status on mount
  useEffect(() => {
    const loaded = loadProjectsFromStorage();
    setProjects(loaded);

    const activeId = getActiveProjectId();
    if (activeId) {
      const found = loaded.find((p) => p.id === activeId);
      if (found) {
        setActiveProject(found);
        setViewMode(found.stage === "in_progress" || found.stage === "team_ready" ? "workspace" : "blueprint");
        if (found.squadId) {
          setActiveSquadId(found.squadId);
          fetchSquadInvitations(found.squadId).then(setInvitations);
        }
        const history = loadChatHistoryFromStorage(found.id);
        if (history.length > 0) {
          setMessages(history);
          const lastAiWithState = [...history].reverse().find((m) => m.conversationState);
          if (lastAiWithState?.conversationState) {
            setConversationState(lastAiWithState.conversationState);
          }
        }
      }
    } else {
      // Restore draft conversation and state across page refresh (TEST G)
      const draft = loadActiveDraftSession();
      if (draft.messages.length > 0) {
        setMessages(draft.messages);
        if (draft.state) {
          setConversationState(draft.state);
        }
      }
    }

    // Inspect local AI health on mount (FastAPI running at http://127.0.0.1:8001)
    checkLocalAIHealth()
      .then((health) => {
        if (health.status === "running") {
          setIntelligenceInfo({
            provider: health.provider || "local-ollama",
            model: health.model || "qwen3:4b",
            isRealLLM: true,
            status: "live_verified",
            statusMessage: `Local AI Active • Ollama (${health.model || "qwen3:4b"}) at 127.0.0.1:8001`,
          });
        } else {
          setIntelligenceInfo({
            provider: "local-ollama",
            model: "qwen3:4b",
            isRealLLM: false,
            status: "provider_error",
            statusMessage: health.error || "Local AI engine at http://127.0.0.1:8001 is offline.",
          });
        }
      })
      .catch((err) => {
        console.warn("[OmniForge] Could not check local AI health:", err);
      });
  }, []);

  // Save changes to active project
  const updateActiveProject = useCallback((updated: OmniForgeProject) => {
    setActiveProject(updated);
    saveProjectToStorage(updated);
    setProjects(loadProjectsFromStorage());
  }, []);

  // Handle incoming user chat message with local AI backend (POST http://127.0.0.1:8001/chat)
  const isSubmittingRef = useRef(false);

  const handleSendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // SECTION 5: DUPLICATE MESSAGE / RESPONSE CHECK
    // Prevent concurrent submissions, rapid-fire clicks, or duplicate Enter presses
    if (isSubmittingRef.current || isLoading) {
      console.warn("[OmniForge] Message submission ignored: a request is already being processed.");
      return;
    }
    isSubmittingRef.current = true;
    setIsLoading(true);

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: "user",
      text: trimmed,
      timestamp: new Date().toISOString(),
    };

    // Filter out previous error messages if user is retrying
    const baseMessages = messages.filter((m) => !m.isError || m.failedPrompt !== trimmed);
    const newMessages = [...baseMessages, userMsg];
    setMessages(newMessages);

    const streamMsgId = `msg-${Date.now()}-ai`;

    try {
      // 1. EXPLICIT INTENT CLASSIFICATION
      const intentResult = classifyUserIntent(trimmed, {
        hasActiveProject: Boolean(activeProject),
        activeProject,
        conversationHistory: baseMessages,
      });

      // 2. State transition (gated: ignores greetings/questions without active project)
      const updatedState = transitionConversationState(conversationState, trimmed, baseMessages);
      setConversationState(updatedState);

      // Build conversation history (last 8 turns)
      const historyPayload = baseMessages
        .filter((m) => !m.isError && m.text)
        .slice(-8)
        .map((m) => ({
          role: (m.sender === "user" ? "user" : "assistant") as "user" | "assistant",
          content: m.text,
        }));

      // 4. PRESERVE CONTEXT CORRECTLY
      // Only include projectContext if discussing an active project or during explicit project creation
      const hasRealContext = Boolean(
        activeProject?.title ||
        (intentResult.intent === "PROJECT_CREATION" && (updatedState.requirements.storyPremise || intentResult.projectData?.story_premise))
      );

      const projectContext = hasRealContext ? {
        title:
          activeProject?.title ||
          (updatedState.requirements.storyPremise
            ? `${updatedState.projectType || "Project"}: ${updatedState.requirements.storyPremise}`
            : intentResult.projectData?.title),
        domain: activeProject?.domain || updatedState.projectDomain || intentResult.projectData?.domain,
        type: activeProject ? undefined : (updatedState.projectType || intentResult.projectData?.type),
        story_premise: activeProject?.title || updatedState.requirements.storyPremise || intentResult.projectData?.story_premise,
        budget: activeProject?.budget || updatedState.requirements.budget || intentResult.projectData?.budget,
        team_size: (activeProject?.roles?.length ? `${activeProject.roles.length} members` : undefined) || updatedState.requirements.teamSize || updatedState.requirements.crewSize,
        roles: activeProject?.roles?.map((r) => r.roleName) || intentResult.projectData?.roles,
      } : undefined;

      // Progressive streaming call to local AI backend
      const localResult = await sendLocalAIChatMessage(
        trimmed,
        historyPayload,
        projectContext,
        120000,
        (_token, accumulated) => {
          setMessages((prev) => {
            const existingIdx = prev.findIndex((m) => m.id === streamMsgId);
            const streamingMsg: ChatMessage = {
              id: streamMsgId,
              sender: "ai",
              text: accumulated,
              timestamp: new Date().toISOString(),
              sourceMeta: {
                provider: "local-ollama",
                model: "qwen3:4b",
                isRealLLM: true,
                status: "live_verified",
                statusMessage: "Local AI: local-ollama (qwen3:4b)",
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
        }
      );

      // Determine final authorized intent and actions
      const finalIntent = localResult.intent || intentResult.intent;
      const finalProjectAction = localResult.project_action || intentResult.project_action;
      const finalMatchingAction = localResult.matching_action || intentResult.matching_action;

      let matchedCards: CreatorRecommendation[] = [];
      let missingCaps: MissingCapability[] = [];
      let matchStatus: "idle" | "matched" | "empty" | "error" = "idle";
      let searchTargetRole: string | undefined = undefined;

      // 2. GATE ALL SIDE EFFECTS
      // Execute project creation / roadmap generation ONLY for PROJECT_CREATION intent
      if (finalProjectAction === "CREATE_PROJECT" || finalIntent === "PROJECT_CREATION") {
        try {
          const blueprint = generateStructuredBlueprint(trimmed, userType, user?.id || "anon");
          const matchResult = await matchCreatorsForProject(blueprint, user?.id);

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
          setViewMode("blueprint");
        } catch (bpErr) {
          console.error("[OmniForge] Error generating project blueprint:", bpErr);
        }
      } else if (finalMatchingAction === "SEARCH_CREATORS" || finalIntent === "CREATOR_SEARCH") {
        // Execute creator search ONLY for explicit CREATOR_SEARCH intent
        try {
          const matchingCriteria = extractMatchingCriteriaFromContext(updatedState, [...baseMessages, userMsg]);

          // Determine the targeted role: prefer explicit targetRole from intent or message, else fallback
          searchTargetRole =
            intentResult.targetRole ||
            (localResult as any)?.target_role ||
            matchingCriteria.targetRole;

          if (!searchTargetRole || searchTargetRole === "Creative") {
            if (/\b(?:female\s+lead(?:\s+actor)?|lead\s+actress|actress|actresses)\b/i.test(trimmed)) {
              searchTargetRole = "Lead Actress";
            } else if (/\b(?:actor|actors|lead\s+actor|male\s+lead|acting|performer)\b/i.test(trimmed)) {
              searchTargetRole = "Lead Actor";
            } else if (/\b(?:singer|vocalist|lead\s+singer|singers)\b/i.test(trimmed)) {
              searchTargetRole = "Lead Singer";
            } else if (/\b(?:colorist|colorists)\b/i.test(trimmed)) {
              searchTargetRole = "Colorist";
            } else if (/\b(?:video\s+editor|editor|editors)\b/i.test(trimmed)) {
              searchTargetRole = "Video Editor";
            } else {
              searchTargetRole = "Lead Actor";
            }
          }

          // Extract additional skills from query (e.g. singing, dancing, acting)
          const searchSkills = [...(intentResult.skills || matchingCriteria.skills || [])];
          if (/\b(?:sing|singing|singer|vocal|vocals)\b/i.test(trimmed) && !searchSkills.includes("Singing")) {
            searchSkills.push("Singing");
          }
          if (/\b(?:dance|dancing|dancer)\b/i.test(trimmed) && !searchSkills.includes("Dancing")) {
            searchSkills.push("Dancing");
          }
          if (/\b(?:acting|drama|theatre)\b/i.test(trimmed) && !searchSkills.includes("Acting")) {
            searchSkills.push("Acting");
          }

          const matchResult = await matchCreatorsFromRequirements(
            {
              roles: [searchTargetRole],
              targetRole: searchTargetRole,
              skills: searchSkills,
              domain: activeProject?.domain || matchingCriteria.domain || "Film",
              projectType: activeProject?.title || matchingCriteria.projectType || "Short Film",
              budget: activeProject?.budget || matchingCriteria.budget,
              duration: matchingCriteria.duration,
            },
            profile?.id || user?.id
          );

          matchedCards = matchResult.recommendations;
          missingCaps = matchResult.coverage.missingCapabilities;
          matchStatus = matchedCards.length > 0 ? "matched" : "empty";

          if (activeProject && matchedCards.length > 0) {
            const otherRoleRecs = (activeProject.recommendations || []).filter(
              (r) =>
                r.roleName.toLowerCase() !== searchTargetRole!.toLowerCase() &&
                !(searchTargetRole!.toLowerCase().includes("actor") && r.roleName.toLowerCase().includes("actor"))
            );
            const updatedProj: OmniForgeProject = {
              ...activeProject,
              recommendations: [...matchedCards, ...otherRoleRecs],
              coverage: matchResult.coverage,
              updatedAt: new Date().toISOString(),
            };
            updateActiveProject(updatedProj);
          }
        } catch (searchErr) {
          console.error("[OmniForge] Creator search error:", searchErr);
          matchStatus = "error";
        }
      } else if (finalProjectAction === "UPDATE_PROJECT" && activeProject) {
        // Modify existing project when explicitly requested
        const modified = modifyBlueprintFromInstruction(activeProject, trimmed);
        updateActiveProject(modified.updatedProject);
      }

      // Determine natural response text based on actual database search results
      let finalResponseText = localResult.answer;
      if (finalMatchingAction === "SEARCH_CREATORS" || finalIntent === "CREATOR_SEARCH") {
        const roleName = searchTargetRole || intentResult.targetRole || "creator";
        if (matchedCards.length > 0) {
          finalResponseText = `Found ${matchedCards.length} verified ${roleName} profile${matchedCards.length > 1 ? "s" : ""} in the OmniCraft directory matching your requirements:`;
        } else {
          finalResponseText = `No registered creators currently match the "${roleName}" specialty in the OmniCraft database. You can post a client job listing on the platform or propose a Skill Swap to attract creative talent.`;
        }
      }

      // Build final assistant chat message
      const aiMsg: ChatMessage = {
        id: streamMsgId,
        sender: "ai",
        text: finalResponseText,
        timestamp: new Date().toISOString(),
        userIntent: finalIntent,
        projectAction: finalProjectAction,
        matchingAction: finalMatchingAction,
        suggestedRoles:
          finalMatchingAction === "SEARCH_CREATORS" || finalIntent === "CREATOR_SEARCH"
            ? undefined
            : (localResult.suggested_roles && localResult.suggested_roles.length > 0
                ? localResult.suggested_roles
                : undefined),
        creatorCards: matchedCards.length > 0 ? matchedCards : undefined,
        missingCapabilities: missingCaps.length > 0 ? missingCaps : undefined,
        matchingStatus: matchStatus !== "idle" ? matchStatus : undefined,
        sourceMeta: {
          provider: localResult.provider || "local-ollama",
          model: localResult.model || "qwen3:4b",
          isRealLLM: true,
          status: "live_verified",
          statusMessage: `Local AI: ${localResult.provider} (${localResult.model})`,
        },
        conversationState: updatedState,
      };

      // Functional state update prevents stale closure overwriting or duplicate messages
      setMessages((prev) => {
        const withoutStream = prev.filter((m) => m.id !== streamMsgId);
        const finalMsgs = [...withoutStream, aiMsg];
        if (activeProject) {
          saveChatHistoryToStorage(activeProject.id, finalMsgs);
        } else {
          saveActiveDraftSession(finalMsgs, updatedState);
        }
        return finalMsgs;
      });

      setIntelligenceInfo({
        provider: localResult.provider || "local-ollama",
        model: localResult.model || "qwen3:4b",
        isRealLLM: true,
        status: "live_verified",
        statusMessage: `Local AI Active • ${localResult.provider.toUpperCase()} (${localResult.model})`,
      });
    } catch (err: any) {
      console.error("Local AI Chat error:", err);
      const errorMessage =
        err?.message || "Failed to communicate with local AI engine at http://127.0.0.1:8001.";

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

      setMessages((prev) => {
        const withoutStream = prev.filter((m) => m.id !== streamMsgId);
        const finalMsgs = [...withoutStream, errorMsg];
        if (activeProject) {
          saveChatHistoryToStorage(activeProject.id, finalMsgs);
        } else {
          saveActiveDraftSession(finalMsgs, conversationState);
        }
        return finalMsgs;
      });

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      isSubmittingRef.current = false;
    }
  };

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

  const handleSelectCandidate = (cand: CreatorRecommendation) => {
    if (!activeProject || !compareRoleId) return;
    const updatedRecs = activeProject.recommendations.map((r) =>
      r.roleId === compareRoleId ? cand : r
    );
    updateActiveProject({ ...activeProject, recommendations: updatedRecs });
    toast.success(`Selected ${cand.creator.fullName || cand.creator.username} for ${cand.roleName}`);
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      {/* Top Bar / Navigation Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border/80 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-foreground">OmniForge</h1>
              <span className="text-xs text-muted-foreground">— Turn Your Idea Into Reality</span>
              <span
                title={intelligenceInfo.statusMessage || (intelligenceInfo.isRealLLM ? "Live cloud LLM inference" : "Deterministic semantic engine")}
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1 border transition-all ${
                  intelligenceInfo.status === "live_verified" || intelligenceInfo.isRealLLM
                    ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30 shadow-xs"
                    : intelligenceInfo.status === "configured_untested"
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                    : intelligenceInfo.status === "provider_error"
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                    : "bg-brand-soft text-brand border-brand/30"
                }`}
              >
                <Zap className="w-2.5 h-2.5" />
                {intelligenceInfo.status === "live_verified" || intelligenceInfo.isRealLLM
                  ? `Live LLM: ${intelligenceInfo.provider.toUpperCase()} (${intelligenceInfo.model})`
                  : intelligenceInfo.status === "configured_untested"
                  ? `LLM Configured: ${intelligenceInfo.provider.toUpperCase()} (Ready)`
                  : intelligenceInfo.status === "provider_error"
                  ? `Provider Error (${intelligenceInfo.provider.toUpperCase()}) • Fallback Active`
                  : `Orchestrator: Hybrid (Local Fallback)`}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              AI Project Architect, Dependency Engine & Creator Orchestrator
            </p>
          </div>
        </div>

        {/* View Switcher Chips */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-surface-muted border border-border/60 overflow-x-auto">
          <button
            onClick={() => setViewMode("chat")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              viewMode === "chat"
                ? "bg-surface text-foreground shadow-xs border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-brand" />
            <span>AI Chat</span>
          </button>

          {activeProject && (
            <>
              <button
                onClick={() => setViewMode("blueprint")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === "blueprint"
                    ? "bg-surface text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-brand-2" />
                <span>Blueprint</span>
              </button>

              <button
                onClick={() => setViewMode("team")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === "team"
                    ? "bg-surface text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="w-3.5 h-3.5 text-brand-3" />
                <span>Creator Team</span>
              </button>

              <button
                onClick={() => setViewMode("workspace")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                  viewMode === "workspace"
                    ? "bg-surface text-foreground shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GitBranch className="w-3.5 h-3.5 text-brand" />
                <span>Workspace & Roadmap</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[640px]">
        {/* Left / Secondary Pane: Projects List & Chat Drawer */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Chat Interface */}
          <div className="h-[640px]">
            <OmniForgeChat
              messages={messages}
              onSendMessage={handleSendMessage}
              onRetry={handleSendMessage}
              onGenerateBlueprint={() => setViewMode("blueprint")}
              onStartOver={handleStartOver}
              isLoading={isLoading}
              userType={userType}
              activeProject={activeProject}
              onFindCreatorsForRole={handleFindCreatorsForRole}
              onSelectCreator={handleSelectCandidate}
              onInviteCreator={handleOpenInviteModal}
              invitations={invitations}
              onConfirmAction={handleConfirmAction}
              onOpenCompareModal={handleOpenCompare}
            />
          </div>

          {/* Saved Projects History Drawer */}
          {projects.length > 0 && (
            <div className="p-4 rounded-2xl bg-surface border border-border/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <span className="flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-brand" />
                  Your AI Projects ({projects.length})
                </span>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    className={`w-full p-2.5 rounded-xl text-left border transition flex items-center justify-between gap-2 ${
                      activeProject?.id === proj.id
                        ? "bg-brand-soft/20 border-brand"
                        : "bg-surface-muted/40 border-border/60 hover:bg-surface-muted"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{proj.title}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <span>{proj.domain}</span>
                        <span>•</span>
                        <span>{proj.phases.length} Phases</span>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right / Primary Pane: Blueprint / Team / Workspace View */}
        <div className="lg:col-span-8 min-h-[640px] flex flex-col">
          {/* State 1: No active project & no chat messages (Discovery / Starter) */}
          {!activeProject && messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-surface/50 border border-border/70 rounded-2xl text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-brand-soft flex items-center justify-center text-brand shadow-brand animate-pulse-slow">
                <Sparkles className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-2">
                <h3 className="text-lg font-bold text-foreground">Tell OmniForge What You Want to Create</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Start with any idea in the AI chat on the left. OmniForge will automatically build your complete
                  deliverable list, task dependencies, and search verified OmniCraft creators for every required role.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] font-semibold text-muted-foreground">
                <span className="p-2 rounded-lg bg-surface border border-border">Film & Cinema</span>
                <span className="p-2 rounded-lg bg-surface border border-border">AI & Software</span>
                <span className="p-2 rounded-lg bg-surface border border-border">Client Video Ads</span>
                <span className="p-2 rounded-lg bg-surface border border-border">Events & Music</span>
              </div>
            </div>
          )}

          {/* State 2: General conversation active with no project yet created */}
          {!activeProject && messages.length > 0 && (
            <div className="flex-1 flex flex-col justify-between p-6 bg-surface/60 border border-border/70 rounded-2xl space-y-6 shadow-sm">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-brand" />
                    <h3 className="text-sm font-bold text-foreground">Active Creative Consultation</h3>
                  </div>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                    Conversational Mode
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-surface border border-border/70 space-y-1">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-brand" />
                      Q&A & Guidance
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Ask about roles (directors, cinematographers, developers), creative techniques, or project advice.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface border border-border/70 space-y-1">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-brand-2" />
                      Idea to Blueprint
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      When ready, describe your vision or type "show me the plan" to turn your idea into structured milestones.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface border border-border/70 space-y-1">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-brand-3" />
                      Skill Swap & Talent
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Collaborate through Skill Swap exchange or recruit verified OmniCraft creators without upfront budget.
                    </p>
                  </div>
                </div>
              </div>

              {/* Help & Fast Action Prompts */}
              <div className="p-4 rounded-xl bg-brand-soft/20 border border-brand/30 space-y-2">
                <span className="text-xs font-bold text-brand flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Try asking OmniForge:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSendMessage("What is Skill Swap and how does it work?")}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-muted text-foreground text-xs font-medium border border-border/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    "What is Skill Swap?"
                  </button>
                  <button
                    onClick={() => handleSendMessage("What does a director do versus a cinematographer?")}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-muted text-foreground text-xs font-medium border border-border/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    "Director vs Cinematographer"
                  </button>
                  <button
                    onClick={() => handleSendMessage("I want to make a short film about a village girl who wants to become a singer")}
                    disabled={isLoading}
                    className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-muted text-foreground text-xs font-medium border border-border/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    "Plan a short film"
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* State 3 & 4: Blueprint View (active project present) */}
          {(viewMode === "blueprint" || (viewMode === "chat" && activeProject)) && activeProject && (
            <ProjectBlueprintView
              project={activeProject}
              onProceedToTeam={() => setViewMode("team")}
              onModifyPlan={() => setViewMode("chat")}
            />
          )}

          {/* State 5: Creator Team Discovery & Matching */}
          {viewMode === "team" && activeProject && (
            <TeamRecommendationsView
              project={activeProject}
              invitations={invitations}
              onInviteCandidate={handleOpenInviteModal}
              onInviteCreator={handleInviteCreator}
              onReplaceCreator={handleOpenCompare}
              onCompareCandidates={handleOpenCompare}
              onLaunchSquad={handleLaunchSquad}
              onBackToBlueprint={() => setViewMode("blueprint")}
              isConvertingSquad={isConvertingSquad}
            />
          )}

          {/* State 6: Project Execution Workspace & Roadmap */}
          {viewMode === "workspace" && activeProject && (
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
          )}
        </div>
      </div>

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
    </div>
  );
}
