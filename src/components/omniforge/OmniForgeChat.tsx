import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  ArrowUp,
  RefreshCw,
  Film,
  Cpu,
  Store,
  Music,
  PartyPopper,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  Bot,
  User,
  Zap,
  Users,
  Search,
  Check,
  X,
  Layers,
  Scale,
  Award,
  Calendar,
  AlertCircle,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Briefcase,
  Square,
  FileText,
  GitBranch,
  BookOpen,
  Compass,
} from "lucide-react";
import {
  ChatMessage,
  ClarificationQuestion,
  OmniForgeProject,
  CreatorRecommendation,
  ClientOpportunity,
  SquadResult,
} from "@/lib/omniforge/types";
import { CreatorAvatar } from "./CreatorAvatar";
import { ChatMarkdown } from "./ChatMarkdown";
import { cleanAiResponseText } from "@/lib/api/local-ai";
import { ArrowLeftRight, Repeat } from "lucide-react";

export interface OmniForgeChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onRetry?: (prompt: string) => void;
  onGenerateBlueprint?: () => void;
  onStartOver?: () => void;
  isLoading: boolean;
  userType?: "creator" | "client";
  activeProject?: OmniForgeProject | null;
  onFindCreatorsForRole?: (roleName: string) => void;
  onSelectCreator?: (creator: CreatorRecommendation) => void;
  onInviteCreator?: (creator: CreatorRecommendation) => void;
  onHireSquad?: (squad: SquadResult) => void;
  invitations?: Array<{
    id: string;
    invitee_id: string;
    status: string;
    role?: string | null;
  }>;
  onConfirmAction?: (actionType: string, payload?: any) => void;
  onOpenCompareModal?: (roleName: string) => void;
  onCancel?: () => void;
  onResumeUploadClick?: () => void;
  onOpenRoadmapFullView?: (roadmap?: any) => void;
  onOpenProjectPlanFullView?: (plan?: any) => void;
  onOpenSkillAnalysisFullView?: () => void;
}

const NEUTRAL_SUGGESTION_CHIPS = [
  { label: "Learn something new", prompt: "Teach me something new about web engineering and modern architectures" },
  { label: "Create a project", prompt: "I want to create a new project plan" },
  { label: "Generate a roadmap", prompt: "I want an HTML and frontend roadmap" },
  { label: "Find creators", prompt: "Find all video editors" },
  { label: "Ask anything", prompt: "What can you help me with on OmniForge?" },
];

export function OmniForgeChat({
  messages,
  onSendMessage,
  onGenerateBlueprint,
  onStartOver,
  isLoading,
  userType = "creator",
  activeProject,
  onFindCreatorsForRole,
  onSelectCreator,
  onInviteCreator,
  onHireSquad,
  invitations,
  onConfirmAction,
  onOpenCompareModal,
  onRetry,
  onCancel,
  onResumeUploadClick,
  onOpenRoadmapFullView,
  onOpenProjectPlanFullView,
  onOpenSkillAnalysisFullView,
}: OmniForgeChatProps) {
  const [input, setInput] = useState("");
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSubmittingLocalRef = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    if (!isLoading) {
      isSubmittingLocalRef.current = false;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const trimmed = input.trim();
    if (!trimmed || isLoading || isSubmittingLocalRef.current) return;

    isSubmittingLocalRef.current = true;
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
    onSendMessage(trimmed);

    setTimeout(() => {
      isSubmittingLocalRef.current = false;
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  };

  const handleChipClick = (prompt: string) => {
    if (isLoading) return;
    onSendMessage(prompt);
  };

  const handleOptionSelect = (_q: ClarificationQuestion, option: string) => {
    if (isLoading) return;
    onSendMessage(option);
  };

  const handleRetry = (msg: ChatMessage) => {
    if (isLoading) return;
    const promptToRetry = msg.failedPrompt || msg.text;
    if (onRetry) {
      onRetry(promptToRetry);
    } else {
      onSendMessage(promptToRetry);
    }
  };

  return (
    <div className="flex flex-col h-full bg-background relative overflow-hidden">
      {/* Scrollable Conversation Stream */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.length === 0 ? (
            /* Clean ChatGPT-Style Welcome Screen */
            <div className="py-12 sm:py-16 text-center space-y-8 animate-fade-up">
              {/* Branding Header */}
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand mx-auto flex items-center justify-center text-white shadow-brand">
                  <Sparkles className="w-7 h-7" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  OmniForge
                </h1>
                <p className="text-sm sm:text-base text-foreground/80 max-w-xl mx-auto leading-relaxed font-normal">
                  Hi! I'm OmniForge. I can answer questions, teach you new skills, create learning
                  roadmaps, develop stories and projects, discover creators and clients, and help
                  execute your work. What would you like to do?
                </p>
              </div>

              {/* Neutral Suggestion Chips */}
              <div className="space-y-3 max-w-xl mx-auto">
                <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Suggested Starters
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {NEUTRAL_SUGGESTION_CHIPS.map((chip, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleChipClick(chip.prompt)}
                      disabled={isLoading}
                      className="px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-muted border border-border/80 text-xs font-medium text-foreground hover:border-brand/40 shadow-xs transition disabled:opacity-50"
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Message Stream */
            (() => {
              const latestAIMsgId = [...messages].reverse().find((m) => m.sender === "ai")?.id;

              return messages.map((msg) => {
                const isUser = msg.sender === "user";
                const isLatestAIMessage = !isUser && msg.id === latestAIMsgId;
                const hasNoText = !isUser && !cleanAiResponseText(msg.text).trim();
                const isError =
                  msg.isError || msg.sourceMeta?.status === "provider_error" || hasNoText;

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 sm:gap-4 ${
                      isUser ? "justify-end" : "justify-start"
                    } animate-fade-up`}
                  >
                    {!isUser && (
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 mt-0.5 shadow-xs ${
                          isError ? "bg-rose-600" : "bg-gradient-brand"
                        }`}
                      >
                        {isError ? (
                          <AlertCircle className="w-4 h-4" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                      </div>
                    )}

                    <div
                      className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-xs sm:text-sm leading-relaxed space-y-3 ${
                        isUser
                          ? "bg-primary text-primary-foreground font-normal rounded-tr-xs shadow-xs"
                          : isError
                          ? "bg-rose-500/10 border border-rose-500/30 text-foreground rounded-tl-xs shadow-xs"
                          : "bg-surface border border-border/70 text-foreground rounded-tl-xs shadow-xs"
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      ) : isError ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 pb-1 border-b border-rose-500/20 text-[10px]">
                            <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/15 px-2 py-0.5 rounded-full border border-rose-500/30">
                              <AlertCircle className="w-2.5 h-2.5" />
                              Local AI Error
                            </span>
                          </div>
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                            {msg.errorMessage ||
                              (hasNoText
                                ? "The assistant returned an empty response. Please click Retry."
                                : msg.text)}
                          </p>
                          <div className="pt-1 flex items-center gap-2">
                            <button
                              onClick={() => handleRetry(msg)}
                              disabled={isLoading}
                              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[11px] flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Retry Request
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Fast path / AI Telemetry badge */}
                          {msg.sourceMeta && (
                            <div className="flex items-center gap-1.5 pb-1 border-b border-border/40 text-[10px]">
                              {msg.sourceMeta.executionMode === "FAST" ||
                              msg.sourceMeta.telemetry?.ollama_ms === 0 ? (
                                <span
                                  title={`Intent: ${msg.sourceMeta.telemetry?.intent_detection_ms ?? 0}ms | DB: ${msg.sourceMeta.telemetry?.database_ms ?? 0}ms | Total: ${msg.sourceMeta.telemetry?.total_ms ?? 0}ms`}
                                  className="flex items-center gap-1 font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20"
                                >
                                  <Zap className="w-2.5 h-2.5 text-cyan-500" />
                                  Fast Path •{" "}
                                  {msg.sourceMeta.telemetry?.total_ms
                                    ? `${msg.sourceMeta.telemetry.total_ms}ms`
                                    : "<100ms"}
                                </span>
                              ) : msg.sourceMeta.executionMode === "HYBRID" ? (
                                <span className="flex items-center gap-1 font-semibold text-purple-700 dark:text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
                                  <Layers className="w-2.5 h-2.5 text-purple-500" />
                                  Hybrid • DB: {msg.sourceMeta.telemetry?.database_ms ?? 0}ms | AI:{" "}
                                  {msg.sourceMeta.telemetry?.ollama_ms ?? 0}ms
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Local AI • Qwen3:4b
                                </span>
                              )}
                            </div>
                          )}

                          {/* Markdown Text Response */}
                          {msg.isThinking &&
                          (msg.text === "Generating story..." || msg.text === "Thinking...") ? (
                            <div className="flex items-center gap-2 text-xs text-brand font-medium py-1 animate-pulse">
                              <Sparkles className="w-3.5 h-3.5 animate-spin text-brand" />
                              <span>{msg.text}</span>
                            </div>
                          ) : (
                            <ChatMarkdown content={cleanAiResponseText(msg.text)} />
                          )}

                          {/* Embedded In-Conversation Roadmap Card */}
                          {msg.roadmapArtifact && (
                            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 space-y-3 pt-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                                  <GitBranch className="w-4 h-4 text-cyan-500" />
                                  {msg.roadmapArtifact.title || "Interactive Learning Roadmap"}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold">
                                  {msg.roadmapArtifact.overallProgress || 0}% Progress
                                </span>
                              </div>

                              <div className="text-xs text-muted-foreground">
                                Active Milestone:{" "}
                                <span className="font-semibold text-foreground">
                                  Level {msg.roadmapArtifact.pointerLevel || 1} •{" "}
                                  {msg.roadmapArtifact.nodes?.find(
                                    (n: any) => n.level === msg.roadmapArtifact.pointerLevel
                                  )?.title || "Fundamentals"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                {onOpenRoadmapFullView && (
                                  <button
                                    onClick={() => onOpenRoadmapFullView(msg.roadmapArtifact)}
                                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
                                  >
                                    <GitBranch className="w-3.5 h-3.5" />
                                    <span>Open Full Roadmap View</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => onSendMessage("Give me today's learning tasks")}
                                  className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-muted border border-border text-xs font-semibold text-foreground transition"
                                >
                                  Today's Tasks
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Embedded In-Conversation Project Plan Card */}
                          {msg.projectPlanArtifact && (
                            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3 pt-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-bold text-xs text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                  <Layers className="w-4 h-4 text-amber-500" />
                                  {msg.projectPlanArtifact.title || "Project Implementation Architecture"}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold">
                                  {msg.projectPlanArtifact.phases?.length || 0} Phases
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {msg.projectPlanArtifact.overview || "Multi-phase delivery roadmap."}
                              </p>
                              {onOpenProjectPlanFullView && (
                                <button
                                  onClick={() => onOpenProjectPlanFullView(msg.projectPlanArtifact)}
                                  className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-xs"
                                >
                                  <Layers className="w-3.5 h-3.5" />
                                  <span>Open Full Project Plan</span>
                                </button>
                              )}
                            </div>
                          )}

                          {/* Suggested Creative Roles Cards */}
                          {msg.suggestedRoles && msg.suggestedRoles.length > 0 && (
                            <div className="space-y-2 pt-3 border-t border-border/50">
                              <div className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                                  <Sparkles className="w-3.5 h-3.5 text-brand" />
                                  Suggested Roles ({msg.suggestedRoles.length})
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {msg.suggestedRoles.map((sr, idx) => (
                                  <div
                                    key={idx}
                                    className="p-3 rounded-xl bg-surface-muted/70 border border-border/70 flex flex-col justify-between gap-2 hover:border-brand/40 transition"
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-xs text-foreground">
                                          {sr.role}
                                        </span>
                                        <span
                                          className={`text-[9px] font-semibold px-1.5 py-0.2 rounded ${
                                            sr.priority === "essential"
                                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/25"
                                              : "bg-blue-500/15 text-blue-600 border border-blue-500/25"
                                          }`}
                                        >
                                          {sr.priority === "essential" ? "Essential" : "Optional"}
                                        </span>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        {sr.reason}
                                      </p>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (onFindCreatorsForRole) {
                                          onFindCreatorsForRole(sr.role);
                                        } else {
                                          onSendMessage(`Find me a ${sr.role}`);
                                        }
                                      }}
                                      className="w-full px-2 py-1 rounded-lg bg-surface hover:bg-brand-soft hover:text-brand border border-border text-foreground font-semibold text-[10px] flex items-center justify-center gap-1 transition"
                                    >
                                      <Search className="w-2.5 h-2.5 text-brand" />
                                      Find {sr.role} Creators
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Matched Verified Creators Cards */}
                          {msg.creatorCards && msg.creatorCards.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-border/50">
                              <div className="text-[11px] font-bold text-muted-foreground flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-foreground">
                                  <Users className="w-3.5 h-3.5 text-brand" />
                                  Verified Creators ({msg.creatorCards.length}):
                                </span>
                                <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
                                  <ShieldCheck className="w-3 h-3" />
                                  Real Database Records
                                </span>
                              </div>
                              <div className="grid grid-cols-1 gap-2.5">
                                {msg.creatorCards.map((cand) => (
                                  <div
                                    key={cand.id}
                                    className="p-3.5 rounded-xl bg-surface-muted/80 border border-border/70 flex flex-col gap-2 hover:border-brand/40 transition shadow-2xs"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-2.5 min-w-0">
                                        <CreatorAvatar
                                          url={cand.creator.avatarUrl}
                                          name={cand.creator.fullName || cand.creator.username}
                                          size="sm"
                                        />
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <a
                                              href={`/creator/${cand.creator.username}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="font-bold text-xs text-foreground truncate hover:text-brand hover:underline"
                                            >
                                              {cand.creator.fullName || cand.creator.username}
                                            </a>
                                            <span className="text-[10px] text-muted-foreground">
                                              @{cand.creator.username}
                                            </span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                                              {cand.matchScore}% Match
                                            </span>
                                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-surface border border-border text-muted-foreground uppercase font-medium">
                                              {cand.roleName}
                                            </span>
                                          </div>
                                          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
                                            {cand.matchReason}
                                          </p>

                                          <div className="flex flex-wrap gap-1 mt-1.5">
                                            {cand.creator.skills.slice(0, 4).map((s, i) => (
                                              <span
                                                key={i}
                                                className="text-[9px] px-1.5 py-0.5 rounded bg-surface border border-border text-muted-foreground font-medium"
                                              >
                                                {s}
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        {onInviteCreator && (
                                          <button
                                            onClick={() => onInviteCreator(cand)}
                                            className="px-2.5 py-1 rounded-lg bg-brand text-white font-semibold text-[11px] hover:opacity-90 transition"
                                          >
                                            Invite
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Skill Swap Cards */}
                          {msg.skillSwapCards && msg.skillSwapCards.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-border/50">
                              <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                                <Repeat className="w-3.5 h-3.5 text-brand" />
                                Matched Skill Swap Collaborators:
                              </div>
                              <div className="grid grid-cols-1 gap-2">
                                {msg.skillSwapCards.map((listing) => (
                                  <div
                                    key={listing.id}
                                    className="p-3 rounded-xl bg-surface-muted/70 border border-border/70 flex flex-col gap-2"
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="flex items-start gap-2 min-w-0">
                                        <CreatorAvatar
                                          url={listing.creatorAvatar}
                                          name={listing.creatorName}
                                          size="sm"
                                        />
                                        <div className="min-w-0">
                                          <div className="font-bold text-xs text-foreground truncate">
                                            {listing.creatorName}
                                          </div>
                                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                                            {listing.title}
                                          </p>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() =>
                                          onSendMessage(
                                            `Propose skill swap to ${listing.creatorName}`
                                          )
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-brand text-white text-[11px] font-semibold hover:opacity-90 transition shrink-0"
                                      >
                                        Propose Swap
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Dynamic Follow-Up Chips (Only on latest AI message) */}
                          {isLatestAIMessage &&
                            msg.suggestedChips &&
                            msg.suggestedChips.length > 0 && (
                              <div className="pt-3 border-t border-border/40 flex flex-wrap gap-1.5">
                                {msg.suggestedChips.map((chip, cIdx) => (
                                  <button
                                    key={cIdx}
                                    onClick={() => handleChipClick(chip)}
                                    disabled={isLoading}
                                    className="px-2.5 py-1 rounded-full bg-surface-muted hover:bg-brand-soft hover:text-brand border border-border/70 text-[11px] font-medium text-foreground transition disabled:opacity-50"
                                  >
                                    {chip}
                                  </button>
                                ))}
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                );
              });
            })()
          )}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex gap-3 items-start animate-fade-up">
              <div className="w-8 h-8 rounded-xl bg-gradient-brand flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="bg-surface border border-border/80 rounded-2xl rounded-tl-xs px-4 py-3 space-y-1 max-w-sm shadow-xs">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-brand">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                  {onCancel && (
                    <button
                      type="button"
                      onClick={onCancel}
                      className="px-2 py-0.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] flex items-center gap-1 border border-border"
                      title="Stop generation"
                    >
                      <Square className="w-2.5 h-2.5 fill-current" />
                      <span>Stop</span>
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Processing response and retrieving contextual knowledge...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pinned Bottom Composer (ChatGPT-Style) */}
      <div className="sticky bottom-0 w-full bg-gradient-to-t from-background via-background/95 to-transparent pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] px-3 sm:px-6 z-20">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={handleSubmit}
            className="relative rounded-2xl bg-surface border border-border shadow-md focus-within:ring-2 focus-within:ring-brand/40 focus-within:border-brand/60 transition"
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="Message OmniForge... (Enter to send, Shift+Enter for newline)"
              className="w-full bg-transparent px-4 py-3.5 pr-14 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none max-h-44"
              disabled={isLoading}
            />

            <div className="absolute right-2.5 bottom-2.5 flex items-center gap-1">
              {isLoading && onCancel ? (
                <button
                  type="button"
                  onClick={onCancel}
                  className="w-8 h-8 rounded-xl bg-destructive text-destructive-foreground flex items-center justify-center shadow-xs hover:opacity-90 transition"
                  title="Stop generating"
                  aria-label="Stop generating"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center shadow-xs disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
                  title="Send message"
                  aria-label="Send message"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          <p className="text-[10px] text-center text-muted-foreground mt-2">
            OmniForge can make mistakes. Verify critical technical recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
