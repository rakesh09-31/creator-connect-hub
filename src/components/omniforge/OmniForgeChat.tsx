import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
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
} from "lucide-react";
import {
  ChatMessage,
  ClarificationQuestion,
  OmniForgeProject,
  CreatorRecommendation,
} from "@/lib/omniforge/types";
import { CreatorAvatar } from "./CreatorAvatar";
import { ChatMarkdown } from "./ChatMarkdown";
import { ArrowLeftRight, Repeat } from "lucide-react";

interface OmniForgeChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onGenerateBlueprint: () => void;
  onStartOver: () => void;
  isLoading: boolean;
  userType: "creator" | "client";
  activeProject: OmniForgeProject | null;
  onFindCreatorsForRole?: (roleName: string) => void;
  onSelectCreator?: (creator: CreatorRecommendation) => void;
  onConfirmAction?: (actionType: string, payload?: any) => void;
  onOpenCompareModal?: (roleName: string) => void;
}

const STARTER_PROMPTS = [
  {
    icon: Film,
    title: "Short Film Idea",
    category: "Creative",
    prompt: "I am a writer. I have a story about a young village girl who wants to become a singer, but I don't know how to make it into a film.",
  },
  {
    icon: Cpu,
    title: "AI Agriculture App",
    category: "Technical",
    prompt: "I want to build an AI-powered crop disease detection application from leaf photos for farmers.",
  },
  {
    icon: Store,
    title: "Restaurant Promo Video",
    category: "Client / Commercial",
    prompt: "I want to create a high-impact promotional video campaign for my new restaurant with food photography.",
  },
  {
    icon: Music,
    title: "Music Production",
    category: "Creative",
    prompt: "I wrote an original acoustic song but need help producing, vocal recording, mixing, and mastering it.",
  },
  {
    icon: PartyPopper,
    title: "College Cultural Fest",
    category: "Events",
    prompt: "I want to organize a college cultural festival with live performances, stage lighting, sound, and sponsorships.",
  },
];

export function OmniForgeChat({
  messages,
  onSendMessage,
  onGenerateBlueprint,
  onStartOver,
  isLoading,
  userType,
  activeProject,
  onFindCreatorsForRole,
  onSelectCreator,
  onConfirmAction,
  onOpenCompareModal,
}: OmniForgeChatProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handlePromptClick = (p: string) => {
    onSendMessage(p);
  };

  const handleOptionSelect = (_q: ClarificationQuestion, option: string) => {
    onSendMessage(option);
  };

  return (
    <div className="flex flex-col h-full bg-surface/60 backdrop-blur-md rounded-2xl border border-border/70 overflow-hidden shadow-sm">
      {/* Chat Header */}
      <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between bg-surface/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand">
            <Sparkles className="w-5 h-5 text-white animate-pulse-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground">OmniForge Partner</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                {userType === "creator" ? "Creator Mode" : "Client Mode"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {activeProject ? `Project: ${activeProject.title}` : "AI Project Architect & Creator Orchestrator"}
            </p>
          </div>
        </div>
        <button
          onClick={onStartOver}
          className="text-xs flex items-center gap-1 text-muted-foreground hover:text-foreground px-2.5 py-1.5 rounded-lg hover:bg-muted transition"
          title="Start fresh conversation"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Start Over</span>
        </button>
      </div>

      {/* Message History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="py-6 space-y-6">
            <div className="text-center max-w-md mx-auto space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-brand-soft mx-auto flex items-center justify-center text-brand mb-3">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold">What are you looking to create?</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Describe any story, product, campaign, or technical concept in simple words. OmniForge will formulate the
                milestones, required roles, and discover verified creators.
              </p>
            </div>

            {/* Starter Prompts */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground px-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand" />
                Example starting points:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {STARTER_PROMPTS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handlePromptClick(item.prompt)}
                      className="text-left p-3 rounded-xl bg-surface hover:bg-surface-muted border border-border/60 hover:border-brand/50 transition flex items-start gap-2.5 group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-brand-soft group-hover:text-brand transition">
                        <Icon className="w-4 h-4 text-foreground/80 group-hover:text-brand" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-foreground truncate">{item.title}</span>
                          <span className="text-[9px] uppercase px-1.5 py-0.2 text-muted-foreground font-medium">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{item.prompt}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          (() => {
            const latestAIMsgId = [...messages].reverse().find((m) => m.sender === "ai")?.id;
            return messages.map((msg) => {
              const isUser = msg.sender === "user";
              const isLatestAIMessage = !isUser && msg.id === latestAIMsgId;
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fade-up`}>
                  {!isUser && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-3 ${
                    isUser
                      ? "bg-primary text-primary-foreground font-medium rounded-tr-sm shadow-sm"
                      : "bg-surface border border-border/80 text-foreground rounded-tl-sm shadow-sm"
                  }`}
                >
                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    <ChatMarkdown content={msg.text} />
                  )}

                  {/* 1. Contextual Skill Swap Cards */}
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
                            className="p-3 rounded-xl bg-surface-muted/70 border border-border/70 flex flex-col gap-2 hover:border-brand/40 transition"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2.5 min-w-0">
                                <CreatorAvatar
                                  url={listing.creatorAvatar}
                                  name={listing.creatorName}
                                  size="sm"
                                />
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-foreground truncate">
                                      {listing.creatorName}
                                    </span>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold flex items-center gap-1">
                                      <ArrowLeftRight className="w-2.5 h-2.5" />
                                      Skill Swap
                                    </span>
                                  </div>
                                  <p className="text-[11px] font-medium text-foreground mt-0.5 line-clamp-1">{listing.title}</p>
                                  {listing.matchReason && (
                                    <p className="text-[10px] text-muted-foreground line-clamp-1">{listing.matchReason}</p>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={() => onSendMessage(`Propose skill swap to ${listing.creatorName}`)}
                                className="px-2.5 py-1 rounded-lg bg-brand text-white text-[11px] font-semibold hover:opacity-90 transition shrink-0"
                              >
                                Propose Swap
                              </button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/40 text-[10px]">
                              <div>
                                <span className="font-semibold text-emerald-600 block mb-0.5">Teaches:</span>
                                <div className="flex flex-wrap gap-1">
                                  {listing.teachSkills.map((s, i) => (
                                    <span key={i} className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div>
                                <span className="font-semibold text-brand block mb-0.5">Wants to Learn:</span>
                                <div className="flex flex-wrap gap-1">
                                  {listing.learnSkills.map((s, i) => (
                                    <span key={i} className="px-1.5 py-0.2 rounded bg-brand-soft text-brand border border-brand/20">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 1. Contextual Role Card */}
                  {msg.roleCard && (
                    <div className="p-3 rounded-xl bg-surface-muted border border-border/70 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-foreground flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-brand" />
                          {msg.roleCard.roleName}
                        </span>
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-md bg-brand-soft text-brand">
                          {msg.roleCard.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{msg.roleCard.purpose}</p>
                      <div className="flex flex-wrap gap-1">
                        {msg.roleCard.skills.map((s, idx) => (
                          <span key={idx} className="text-[10px] px-2 py-0.5 rounded-md bg-surface border border-border">
                            {s}
                          </span>
                        ))}
                      </div>
                      <div className="pt-2 flex items-center gap-2 border-t border-border/50">
                        <button
                          onClick={() => onSendMessage(`Find me a ${msg.roleCard?.roleName}`)}
                          className="px-2.5 py-1 rounded-lg bg-brand text-white font-medium text-[11px] flex items-center gap-1 hover:opacity-90 transition"
                        >
                          <Search className="w-3 h-3" />
                          Find Creators
                        </button>
                        <button
                          onClick={onGenerateBlueprint}
                          className="px-2.5 py-1 rounded-lg bg-surface hover:bg-muted border border-border text-foreground font-medium text-[11px] flex items-center gap-1 transition"
                        >
                          View in Blueprint
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. Contextual Creator Cards */}
                  {msg.creatorCards && msg.creatorCards.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-border/50">
                      <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-brand" />
                        Matched Verified Creators:
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        {msg.creatorCards.map((cand) => (
                          <div
                            key={cand.id}
                            className="p-3 rounded-xl bg-surface-muted/70 border border-border/70 flex items-start justify-between gap-3 hover:border-brand/40 transition"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <CreatorAvatar
                                url={cand.creator.avatarUrl}
                                name={cand.creator.fullName || cand.creator.username}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs text-foreground truncate">
                                    {cand.creator.fullName || cand.creator.username}
                                  </span>
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-semibold">
                                    {cand.matchScore}% Match
                                  </span>
                                </div>
                                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{cand.matchReason}</p>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {cand.creator.skills.slice(0, 3).map((s, i) => (
                                    <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-surface border border-border text-muted-foreground">
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0">
                              <button
                                onClick={() => {
                                  if (onSelectCreator) onSelectCreator(cand);
                                  onSendMessage(`Add ${cand.creator.fullName || cand.creator.username} to team`);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-brand text-white text-[11px] font-semibold hover:opacity-90 transition"
                              >
                                Select
                              </button>
                              <button
                                onClick={() => onSendMessage(`Why did you recommend ${cand.creator.fullName || cand.creator.username}?`)}
                                className="px-2.5 py-1 rounded-lg bg-surface border border-border text-muted-foreground hover:text-foreground text-[10px] transition text-center"
                              >
                                Why Match?
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Project Update Card */}
                  {msg.updateCard && (
                    <div className="p-3 rounded-xl bg-brand-soft/20 border border-brand/30 space-y-1">
                      <div className="flex items-center gap-1.5 text-brand font-bold text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{msg.updateCard.title}</span>
                      </div>
                      <p className="text-[11px] text-foreground">{msg.updateCard.detail}</p>
                    </div>
                  )}

                  {/* 4. Confirmation Card */}
                  {msg.confirmationCard && (
                    <div className="p-3 rounded-xl bg-surface-muted border border-border space-y-2">
                      <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                        <Award className="w-3.5 h-3.5 text-brand" />
                        <span>{msg.confirmationCard.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{msg.confirmationCard.message}</p>
                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (onConfirmAction) {
                              onConfirmAction(msg.confirmationCard!.actionType, msg.confirmationCard!.payload);
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-[11px] flex items-center gap-1 shadow-sm hover:bg-emerald-500 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Confirm & Launch
                        </button>
                        <button
                          onClick={() => onSendMessage("Not now, keep reviewing")}
                          className="px-3 py-1.5 rounded-lg bg-surface border border-border text-muted-foreground hover:text-foreground text-[11px] transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 5. Creator Comparison Card */}
                  {msg.comparisonCard && (
                    <div className="p-3 rounded-xl bg-surface-muted border border-border space-y-2">
                      <div className="flex items-center gap-1.5 text-foreground font-bold text-xs">
                        <Scale className="w-3.5 h-3.5 text-brand" />
                        <span>Candidate Comparison: {msg.comparisonCard.roleName}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground whitespace-pre-wrap">{msg.comparisonCard.analysis}</p>
                    </div>
                  )}

                  {/* 6. Clarification questions */}
                  {msg.clarifications && msg.clarifications.length > 0 && (
                    <div className="mt-3 space-y-3 pt-3 border-t border-border/40">
                      {msg.clarifications.map((q) => (
                        <div key={q.id} className="p-2.5 rounded-xl bg-surface-muted/60 border border-border/40 space-y-2">
                          <div className="flex items-start gap-1.5 text-foreground font-semibold text-xs">
                            <HelpCircle className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
                            <span>{q.question}</span>
                          </div>
                          {isLatestAIMessage && q.options && (
                            <div className="flex flex-wrap gap-1.5">
                              {q.options.map((opt: string, i: number) => (
                                <button
                                  key={i}
                                  onClick={() => handleOptionSelect(q, opt)}
                                  className="text-[11px] px-2.5 py-1 rounded-lg bg-surface hover:bg-brand hover:text-white border border-border/60 transition font-medium"
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 7. Action prompt */}
                  {msg.actionPrompt && (
                    <div className="mt-3 pt-2.5 border-t border-border/40">
                      <button
                        onClick={onGenerateBlueprint}
                        className="w-full py-2 px-3 rounded-xl bg-gradient-brand text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-brand hover:opacity-95 transition"
                      >
                        <Sparkles className="w-4 h-4" />
                        {msg.actionPrompt.label}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* 8. Suggested Follow-Up Action Pills */}
                  {isLatestAIMessage && msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                    <div className="pt-2 border-t border-border/30 space-y-1.5">
                      <span className="text-[10px] text-muted-foreground font-semibold">Suggested next questions:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((promptText, idx) => (
                          <button
                            key={idx}
                            onClick={() => onSendMessage(promptText)}
                            className="text-[11px] px-2.5 py-1 rounded-full bg-surface hover:bg-brand-soft hover:text-brand border border-border/60 text-foreground transition flex items-center gap-1 shadow-xs hover:border-brand/50"
                          >
                            <Sparkles className="w-3 h-3 text-brand" />
                            {promptText}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                {isUser && (
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-foreground shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          });
        })()
      )}

        {isLoading && (
          <div className="flex gap-3 items-start animate-fade-up">
            <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-surface border border-border/80 rounded-2xl rounded-tl-sm px-4 py-3 space-y-2 max-w-xs shadow-sm">
              <div className="flex items-center gap-2 text-xs font-semibold text-brand">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Thinking & analyzing context...</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Evaluating project intent, matching real verified talent, and generating contextual response.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-border/60 bg-surface/90 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            userType === "creator"
              ? "Ask a question, find creators, or tell OmniForge what to build..."
              : "Describe your business requirements or ask about team composition..."
          }
          className="flex-1 bg-surface-muted px-4 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 text-foreground placeholder:text-muted-foreground"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 rounded-xl bg-gradient-brand text-white font-semibold text-xs flex items-center gap-1.5 shadow-brand disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-95 transition"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
