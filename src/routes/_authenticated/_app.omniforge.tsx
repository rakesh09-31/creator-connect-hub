import { useState, useEffect, useCallback } from "react";
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
} from "@/lib/omniforge/types";
import { createInitialConversationState } from "@/lib/omniforge/conversation-state";
import {
  generateStructuredBlueprint,
  modifyBlueprintFromInstruction,
  processConversationalOmniForgeMessage,
} from "@/lib/omniforge/engine";
import { omniforgeChatServerFn, omniforgeProviderStatusServerFn } from "@/lib/api/omniforge.functions";
import { matchCreatorsForProject, matchCreatorsForSingleRole } from "@/lib/omniforge/matcher";
import {
  loadProjectsFromStorage,
  saveProjectToStorage,
  getActiveProjectId,
  setActiveProjectId,
  deleteProjectFromStorage,
  loadChatHistoryFromStorage,
  saveChatHistoryToStorage,
} from "@/lib/omniforge/storage";
import { convertProjectToSquad } from "@/lib/omniforge/squad-bridge";
import { OmniForgeChat } from "@/components/omniforge/OmniForgeChat";
import { ProjectBlueprintView } from "@/components/omniforge/ProjectBlueprintView";
import { TeamRecommendationsView } from "@/components/omniforge/TeamRecommendationsView";
import { OmniForgeWorkspace } from "@/components/omniforge/OmniForgeWorkspace";
import { CompareCreatorsModal } from "@/components/omniforge/CompareCreatorsModal";

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
    provider: "local-semantic",
    model: "hybrid-orchestrator",
    isRealLLM: false,
    status: "no_provider",
    statusMessage: "Deterministic semantic orchestrator active.",
  });

  // Comparison modal state
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  const [compareRoleId, setCompareRoleId] = useState<string | null>(null);
  const [isConvertingSquad, setIsConvertingSquad] = useState(false);

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
        const history = loadChatHistoryFromStorage(found.id);
        if (history.length > 0) {
          setMessages(history);
          const lastAiWithState = [...history].reverse().find((m) => m.conversationState);
          if (lastAiWithState?.conversationState) {
            setConversationState(lastAiWithState.conversationState);
          }
        }
      }
    }

    // Inspect server-side LLM provider availability safely
    omniforgeProviderStatusServerFn()
      .then((res) => {
        if (res && res.success) {
          setIntelligenceInfo((prev) => ({
            ...prev,
            provider: res.provider,
            model: res.model,
            isRealLLM: false,
            status: res.status,
            statusMessage: res.statusMessage,
          }));
        }
      })
      .catch((err) => {
        console.warn("[OmniForge] Could not fetch provider status:", err);
      });
  }, []);

  // Save changes to active project
  const updateActiveProject = useCallback((updated: OmniForgeProject) => {
    setActiveProject(updated);
    saveProjectToStorage(updated);
    setProjects(loadProjectsFromStorage());
  }, []);

  // Handle incoming user chat message with the conversational pipeline
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      let response: any;
      try {
        // 1. Invoke Server Function executing LLM + Backend Tools
        const serverResult = await omniforgeChatServerFn({
          data: {
            text,
            activeProject,
            conversationHistory: newMessages,
            conversationState,
            userType,
            userId: user?.id || "anon",
          },
        });

        if (serverResult.success && serverResult.response) {
          response = serverResult.response;
          if (response.conversationState) {
            setConversationState(response.conversationState);
          }
          if (serverResult.meta) {
            setIntelligenceInfo(serverResult.meta);
          }
        } else {
          throw new Error(serverResult.error || "Server function fallback needed");
        }
      } catch (rpcErr) {
        // Fallback: local conversational orchestrator
        response = await processConversationalOmniForgeMessage(
          text,
          activeProject,
          newMessages,
          userType,
          user?.id || "anon",
          conversationState
        );
        if (response.conversationState) {
          setConversationState(response.conversationState);
        }
      }

      let currentActive = activeProject;

      // Handle Project Creation or Context Recovery (Full Blueprint Analysis)
      if (response.updatedProject && (!currentActive || response.responseLevel === "PROJECT_ANALYSIS")) {
        const blueprint = response.updatedProject;
        // Perform real Supabase creator matching if needed
        if (!blueprint.recommendations || blueprint.recommendations.length === 0) {
          const matchResult = await matchCreatorsForProject(blueprint, user?.id);
          blueprint.recommendations = matchResult.recommendations;
          blueprint.alternativeCandidates = matchResult.alternatives;
          blueprint.coverage = matchResult.coverage;
        }

        updateActiveProject(blueprint);
        currentActive = blueprint;
        setViewMode("blueprint");
        if (response.responseLevel === "PROJECT_ANALYSIS") {
          toast.success("OmniForge Blueprint Generated!");
        }
      }
      // Handle Project Modification
      else if (response.responseLevel === "PROJECT_MODIFICATION" && response.updatedProject) {
        updateActiveProject(response.updatedProject);
        currentActive = response.updatedProject;
        toast.success("Project Scope Updated!");
      }

      // Handle direct squad creation on confirmed action
      if (response.projectAction?.type === "CREATE_SQUAD") {
        setTimeout(() => {
          handleLaunchSquad();
        }, 300);
      }

      // Assemble AI chat message
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: response.message,
        timestamp: new Date().toISOString(),
        intent: response.intent,
        responseLevel: response.responseLevel,
        clarifications: response.clarifications,
        roleCard: response.roleCard,
        creatorCards: response.creatorCards,
        skillSwapCards: response.skillSwapCards,
        updateCard: response.updateCard,
        confirmationCard: response.confirmationCard,
        comparisonCard: response.comparisonCard,
        suggestedFollowUps: response.suggestedFollowUps,
        conversationState: response.conversationState || conversationState,
        actionPrompt:
          response.uiAction?.type === "SHOW_BLUEPRINT"
            ? {
                type: "generate_blueprint",
                label: "Inspect Project Blueprint & Team",
              }
            : undefined,
      };

      const finalMessages = [...newMessages, aiMsg];
      setMessages(finalMessages);

      if (currentActive) {
        saveChatHistoryToStorage(currentActive.id, finalMessages);
      }
    } catch (err) {
      console.error("Error processing conversational message:", err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: "I encountered a minor issue processing that request. Please try asking again or rephrase your thought!",
        timestamp: new Date().toISOString(),
      };
      setMessages([...newMessages, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartOver = () => {
    setActiveProject(null);
    setActiveProjectId(null);
    setMessages([]);
    setConversationState(createInitialConversationState());
    setViewMode("chat");
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

  const handleInviteCreator = (recId: string) => {
    if (!activeProject) return;
    const updatedRecs = activeProject.recommendations.map((r) =>
      r.id === recId ? { ...r, status: "invited" as const } : r
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
              onGenerateBlueprint={() => setViewMode("blueprint")}
              onStartOver={handleStartOver}
              isLoading={isLoading}
              userType={userType}
              activeProject={activeProject}
              onFindCreatorsForRole={handleFindCreatorsForRole}
              onSelectCreator={handleSelectCandidate}
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
                    className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-muted text-foreground text-xs font-medium border border-border/60 transition"
                  >
                    "What is Skill Swap?"
                  </button>
                  <button
                    onClick={() => handleSendMessage("What does a director do versus a cinematographer?")}
                    className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-muted text-foreground text-xs font-medium border border-border/60 transition"
                  >
                    "Director vs Cinematographer"
                  </button>
                  <button
                    onClick={() => handleSendMessage("I want to make a short film about a village girl who wants to become a singer")}
                    className="px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-muted text-foreground text-xs font-medium border border-border/60 transition"
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
    </div>
  );
}
