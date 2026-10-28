import React, { useState, useEffect } from "react";
import {
  Trophy,
  CheckCircle2,
  Lock,
  Play,
  Sparkles,
  ArrowRight,
  Code2,
  Layers,
  Database,
  Cpu,
  Shield,
  Rocket,
  Check,
  ChevronRight,
  ChevronDown,
  Info,
  SkipForward,
  ExternalLink,
  Clock,
  BookOpen,
  Target,
  CheckSquare,
  Square,
  Flame,
  AlertTriangle,
  HelpCircle,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  ListChecks,
  Wrench,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import {
  VisualRoadmapData,
  RoadmapNode,
  RoadmapNodeState,
  calculateDynamicTimeline,
  DeepTopicItem,
  RoadmapTroubleshootingItem,
  RoadmapKnowledgeCheckItem,
  RoadmapActionableTask,
} from "@/lib/omniforge/user-intelligence";
import { SavedRoadmapItem } from "@/lib/omniforge/types";

interface VisualRoadmapJourneyProps {
  roadmap: VisualRoadmapData;
  savedRoadmaps?: Record<string, VisualRoadmapData>;
  savedRoadmapsList?: SavedRoadmapItem[];
  onSelectRoadmapItem?: (id: string) => void;
  onCompleteTask: (nodeId: string) => void;
  onSkipTask: (nodeId: string) => void;
  onStartProject: (stageNumber: number) => void;
  onSelectTrack?: (trackKey: string) => void;
  onUpdateStudyPace?: (dailyHours: number) => void;
  onToggleTopicChecklist?: (nodeId: string, topicIndex: number) => void;
  isSidebarOpen?: boolean;
  onToggleSidebar?: () => void;
  onCreateRoadmapAction?: () => void;
}

export function VisualRoadmapJourney({
  roadmap,
  savedRoadmaps,
  savedRoadmapsList,
  onSelectRoadmapItem,
  onCompleteTask,
  onSkipTask,
  onStartProject,
  onSelectTrack,
  onUpdateStudyPace,
  onToggleTopicChecklist,
  isSidebarOpen,
  onToggleSidebar,
  onCreateRoadmapAction,
}: VisualRoadmapJourneyProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(roadmap.currentNodeId);
  const [activeTab, setActiveTab] = useState<"journey" | "stages" | "pacing">("journey");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    // Default the active node to expanded
    return { [roadmap.currentNodeId]: true };
  });

  // State for expandable stage detail sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    topics: true,
    project: true,
    troubleshooting: true,
    assessments: true,
    criteria: false,
    resources: false,
  });
  const [expandedTopicIds, setExpandedTopicIds] = useState<Record<string, boolean>>({});
  const [revealedAssessments, setRevealedAssessments] = useState<Record<number, boolean>>({});
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleTopic = (topicId: string) => {
    setExpandedTopicIds((prev) => ({ ...prev, [topicId]: !prev[topicId] }));
  };

  const toggleAssessment = (index: number) => {
    setRevealedAssessments((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleCopySnippet = (id: string, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  // Reset selected node and expanded map when roadmap changes to prevent stale node bleed
  useEffect(() => {
    setSelectedNodeId(roadmap.currentNodeId || roadmap.nodes[0]?.id || null);
    setExpandedNodes({ [roadmap.currentNodeId || roadmap.nodes[0]?.id || ""]: true });
  }, [roadmap.id, roadmap.currentNodeId]);

  const selectedNode =
    roadmap.nodes.find((n) => n.id === selectedNodeId) ||
    roadmap.nodes.find((n) => n.id === roadmap.currentNodeId) ||
    roadmap.nodes[0];

  const currentDailyHours = roadmap.dailyStudyHours || 1.5;
  const currentTotalHours = roadmap.totalStudyHours || (roadmap.nodes.length === 12 ? 212 : 168);
  const activeTimeline = calculateDynamicTimeline(selectedNode?.estimatedStudyHours || 16, currentDailyHours);
  const trackTimeline = calculateDynamicTimeline(currentTotalHours, currentDailyHours);

  const toggleNodeExpanded = (nodeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const getNodeIcon = (skill: string) => {
    const s = skill.toLowerCase();
    if (s.includes("html") || s.includes("css")) return <Code2 className="w-3.5 h-3.5" />;
    if (s.includes("react")) return <Layers className="w-3.5 h-3.5" />;
    if (s.includes("javascript")) return <Code2 className="w-3.5 h-3.5" />;
    if (s.includes("typescript")) return <Code2 className="w-3.5 h-3.5" />;
    if (s.includes("node") || s.includes("backend")) return <Cpu className="w-3.5 h-3.5" />;
    if (s.includes("sql") || s.includes("database")) return <Database className="w-3.5 h-3.5" />;
    if (s.includes("security") || s.includes("auth") || s.includes("test")) return <Shield className="w-3.5 h-3.5" />;
    if (s.includes("full stack") || s.includes("production") || s.includes("deploy")) return <Rocket className="w-3.5 h-3.5" />;
    return <Sparkles className="w-3.5 h-3.5" />;
  };

  if (
    !roadmap ||
    !roadmap.nodes ||
    roadmap.nodes.length === 0 ||
    (savedRoadmapsList && savedRoadmapsList.length === 0)
  ) {
    return (
      <div className="relative flex flex-col items-center justify-center h-full min-h-[420px] p-8 text-center bg-surface/70 backdrop-blur-md rounded-2xl border border-border/70 shadow-sm space-y-4">
        {onToggleSidebar && !isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="absolute top-4 left-4 p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted border border-border/60 transition flex items-center gap-1.5 text-xs font-semibold"
            title="Open roadmaps sidebar"
            aria-label="Open roadmaps sidebar"
          >
            <PanelLeftOpen className="w-4 h-4 text-brand" />
            <span className="hidden sm:inline">Roadmaps Sidebar</span>
          </button>
        )}
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500 mb-2">
          <Layers className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-foreground">No Saved Roadmaps Available</h3>
        <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
          All saved roadmaps have been removed or none have been generated yet. Ask OmniForge in chat to create a structured curriculum or project roadmap for any subject.
        </p>
        <button
          onClick={onCreateRoadmapAction}
          className="px-4 py-2.5 rounded-xl bg-brand text-white font-bold text-xs shadow-md hover:opacity-95 transition flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Create a Roadmap in Chat</span>
        </button>
      </div>
    );
  }

  const completedCount = roadmap.nodes.filter((n) => n.state === "COMPLETED" || n.state === "PASSED").length;
  const progressPercent = Math.round((completedCount / roadmap.nodes.length) * 100);

  const currentTrackKey = roadmap.trackKey || (roadmap.nodes.length === 12 ? "html_frontend" : "full_stack");

  return (
    <div className="flex flex-col h-full bg-surface/70 backdrop-blur-md rounded-2xl border border-border/70 overflow-hidden shadow-sm">
      {/* Dynamic Saved Roadmaps / Tracks Bar */}
      {savedRoadmapsList && savedRoadmapsList.length > 1 ? (
        <div className="px-4 py-2 bg-surface-muted/40 border-b border-border/50 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Layers className="w-3.5 h-3.5 text-brand" />
            <span>Saved Roadmaps:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {savedRoadmapsList.map((r) => {
              const isSelected = r.id === roadmap.id || (r.roadmapData && r.roadmapData.id === roadmap.id);
              const stageCount = r.totalStages || r.roadmapData?.stages?.length || 6;
              const shortTitle = r.title.replace(/\s+(?:Mastery\s+)?Roadmap\s*$/i, "");
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    if (onSelectRoadmapItem) onSelectRoadmapItem(r.id);
                    else if (onSelectTrack && r.roadmapData?.trackKey) onSelectTrack(r.roadmapData.trackKey);
                  }}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    isSelected
                      ? "bg-brand text-white shadow-xs"
                      : "bg-surface hover:bg-surface-muted text-muted-foreground hover:text-foreground border border-border/60"
                  }`}
                  title={r.title}
                >
                  <span className="truncate max-w-[130px]">{shortTitle}</span> ({stageCount})
                </button>
              );
            })}
          </div>
        </div>
      ) : onSelectTrack && savedRoadmaps && Object.keys(savedRoadmaps).length > 1 ? (
        <div className="px-4 py-2 bg-surface-muted/40 border-b border-border/50 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
            <Layers className="w-3.5 h-3.5 text-brand" />
            <span>Active Tracks:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {Object.entries(savedRoadmaps).map(([k, rm]) => {
              const isSelected = currentTrackKey === k || rm.id === roadmap.id;
              const shortTitle = ((rm as any).title || rm.goal || k).replace(/\s+(?:Mastery\s+)?Roadmap\s*$/i, "");
              return (
                <button
                  key={k}
                  onClick={() => onSelectTrack(k)}
                  className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    isSelected
                      ? "bg-brand text-white shadow-xs"
                      : "bg-surface hover:bg-surface-muted text-muted-foreground hover:text-foreground border border-border/60"
                  }`}
                >
                  <span className="truncate max-w-[130px]">{shortTitle}</span> ({rm.nodes.length})
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Top Header */}
      <div className="p-4 border-b border-border/60 bg-surface/80 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted border border-border/60 transition flex items-center gap-1.5 text-xs font-semibold shrink-0"
              title={isSidebarOpen ? "Close roadmaps sidebar" : "Open roadmaps sidebar"}
              aria-label={isSidebarOpen ? "Close roadmaps sidebar" : "Open roadmaps sidebar"}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="w-4 h-4 text-brand" />
              ) : (
                <PanelLeftOpen className="w-4 h-4 text-brand" />
              )}
              <span className="hidden sm:inline">
                {isSidebarOpen ? "Close Sidebar" : "Roadmaps"}
              </span>
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                AI Career Journey
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {progressPercent}% Mastered
              </span>
              <span className="text-[10px] font-medium text-muted-foreground">
                {completedCount}/{roadmap.nodes.length} Stages
              </span>
            </div>
            <h3 className="text-sm font-bold text-foreground truncate">{roadmap.goal}</h3>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex p-0.5 rounded-xl bg-surface-muted/60 border border-border/60 shrink-0">
          <button
            onClick={() => setActiveTab("journey")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === "journey"
                ? "bg-surface text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Path
          </button>
          <button
            onClick={() => setActiveTab("stages")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === "stages"
                ? "bg-surface text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {roadmap.nodes.length} Stages
          </button>
          <button
            onClick={() => setActiveTab("pacing")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
              activeTab === "pacing"
                ? "bg-surface text-foreground shadow-xs border border-border/80"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Pacing
          </button>
        </div>
      </div>

      {/* Progress & Study Pace Header */}
      <div className="px-4 py-2.5 bg-surface-muted/30 border-b border-border/50 space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-medium">
          <span className="text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3 text-brand" />
            Milestone {roadmap.pointerLevel} of {roadmap.nodes.length}
          </span>
          <span className="text-brand font-bold">
            Pacing: {currentDailyHours}h/day ({trackTimeline})
          </span>
        </div>
        <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden border border-border/60">
          <div
            className="h-full bg-gradient-brand transition-all duration-700 ease-out rounded-full"
            style={{ width: `${Math.max(progressPercent, 5)}%` }}
          />
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: VISUAL JOURNEY PATH */}
        {activeTab === "journey" && (
          <div className="space-y-4">
            {/* Visual Timeline Path */}
            <div className="relative pl-6 space-y-3 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-emerald-500 before:via-amber-500 before:to-muted-foreground/30">
              {roadmap.nodes.map((node) => {
                const isSelected = node.id === selectedNode.id;
                const isCurrent = node.id === roadmap.currentNodeId;
                const isCompleted = node.state === "COMPLETED" || node.state === "PASSED";
                const isLocked = node.state === "LOCKED";
                const isInProgress = node.state === "IN_PROGRESS" || isCurrent;
                const isExpanded = Boolean(expandedNodes[node.id]);

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`relative p-3 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? "bg-brand-soft/25 border-brand shadow-xs ring-1 ring-brand/30"
                        : isCurrent
                        ? "bg-amber-500/10 border-amber-500/40 hover:bg-amber-500/15 ring-1 ring-amber-500/30"
                        : isCompleted
                        ? "bg-surface border-emerald-500/30 hover:border-emerald-500/50"
                        : "bg-surface-muted/30 border-border/60 hover:bg-surface-muted/50"
                    } ${isLocked ? "opacity-60" : ""}`}
                  >
                    {/* Node Dot / Moving Avatar Pointer on timeline */}
                    <div
                      className={`absolute -left-[27px] top-4 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-transform ${
                        isCurrent
                          ? "bg-brand text-white border-white shadow-brand scale-110 animate-bounce"
                          : isCompleted
                          ? "bg-emerald-500 text-white border-background"
                          : isLocked
                          ? "bg-surface-muted text-muted-foreground border-border"
                          : "bg-amber-500 text-white border-background"
                      }`}
                      title={isCurrent ? "You are here!" : node.title}
                    >
                      {isCompleted ? (
                        <Check className="w-3 h-3 stroke-[3]" />
                      ) : isLocked ? (
                        <Lock className="w-2.5 h-2.5" />
                      ) : isCurrent ? (
                        <span className="text-[10px] font-bold">●</span>
                      ) : (
                        <span className="text-[9px] font-bold">{node.level}</span>
                      )}
                    </div>

                    {/* Node Header Row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-surface border border-border/60 text-muted-foreground">
                            Lvl {node.level}
                          </span>
                          <span className="text-xs font-bold text-foreground truncate">{node.title}</span>
                          {isCurrent && (
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full bg-brand text-white shadow-xs animate-pulse">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {node.task?.title || node.concept}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-1.5">
                        {isCompleted && (
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                            ✓ Done
                          </span>
                        )}
                        {isInProgress && !isCompleted && (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            In Progress
                          </span>
                        )}
                        {isLocked && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        )}
                        <button
                          onClick={(e) => toggleNodeExpanded(node.id, e)}
                          className="p-1 rounded hover:bg-surface-muted text-muted-foreground hover:text-foreground transition"
                          title={isExpanded ? "Collapse Stage" : "Expand Stage"}
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Topic Checklist inside the card */}
                    {isExpanded && node.topicChecklist && node.topicChecklist.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-border/50 space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                          <span>Topic Checklist ({node.topicChecklist.filter((t) => t.completed).length}/{node.topicChecklist.length})</span>
                          <span className="text-brand lowercase">{node.estimatedStudyTime || "12-16h"}</span>
                        </div>
                        <div className="space-y-1">
                          {node.topicChecklist.map((topic, tIdx) => (
                            <div
                              key={tIdx}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onToggleTopicChecklist) {
                                  onToggleTopicChecklist(node.id, tIdx);
                                }
                              }}
                              className={`flex items-start gap-1.5 p-1 rounded hover:bg-surface-muted/60 transition cursor-pointer text-xs ${
                                topic.completed ? "text-muted-foreground" : "text-foreground font-medium"
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {topic.completed ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-muted-foreground" />
                                )}
                              </div>
                              <span className={`text-[11px] leading-tight ${topic.completed ? "line-through opacity-75" : ""}`}>
                                {topic.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Node Detailed Inspector */}
            {selectedNode && (() => {
              const stageTopics: DeepTopicItem[] =
                selectedNode.topics && selectedNode.topics.length > 0
                  ? selectedNode.topics
                  : (selectedNode.topicChecklist || []).map((tc, idx) => ({
                      id: tc.id || `topic_${idx + 1}`,
                      title: tc.title,
                      completed: Boolean(tc.completed),
                      subtopics: [
                        `Core principles & mental models of ${tc.title}`,
                        `Standard APIs, methods, and syntax conventions`,
                        `Edge cases, input validation, and performance tradeoffs`,
                        `Hands-on implementation and verifiable outcome criteria`,
                      ],
                      explanation: `${tc.title} is an essential cornerstone of ${selectedNode.skill || "this milestone"}. Mastering this topic gives you the foundational capability to write robust, maintainable code adhering to industry standards.`,
                      keySyntaxOrApis: [tc.title.split(" ")[0]],
                      example: {
                        title: `${tc.title} Worked Example`,
                        description: `Production walkthrough demonstrating standard implementation patterns.`,
                        codeOrWalkthrough: `// Verified pattern for: ${tc.title}\nfunction executePattern() {\n  // Applied implementation\n  return true;\n}`,
                      },
                      exercise: {
                        title: `${tc.title} Practice Challenge`,
                        prompt: `Implement a modular solution applying the principles of ${tc.title}.`,
                        instructions: [
                          `Review the concept explanation and worked example.`,
                          `Implement the solution satisfying boundary constraints.`,
                          `Verify against edge case inputs.`,
                        ],
                        expectedOutcome: `Working code passing all functional checks with zero unhandled exceptions.`,
                      },
                      troubleshooting: [
                        `Verify all prerequisite environment variables or dependencies are active.`,
                        `Check for common type mismatches or unhandled null/undefined values.`,
                      ],
                    }));

              const commonMistakes: RoadmapTroubleshootingItem[] =
                selectedNode.commonMistakesAndTroubleshooting && selectedNode.commonMistakesAndTroubleshooting.length > 0
                  ? selectedNode.commonMistakesAndTroubleshooting
                  : [
                      {
                        mistake: `Skipping defensive input validation and edge cases in Level ${selectedNode.level}`,
                        consequence: "Unexpected runtime exceptions, corrupted state, or security vulnerabilities.",
                        solutionOrFix: "Add strict input bounds checking, schema validation, and guard clauses upfront.",
                      },
                      {
                        mistake: `Ignoring automated testing until final integration`,
                        consequence: "Regressions multiply and debugging becomes exponentially slower.",
                        solutionOrFix: "Write automated assertions alongside implementation for rapid feedback.",
                      },
                    ];

              const knowledgeCheck: RoadmapKnowledgeCheckItem[] =
                selectedNode.knowledgeCheck && selectedNode.knowledgeCheck.length > 0
                  ? selectedNode.knowledgeCheck
                  : [
                      {
                        question: `What are the primary architectural principles and tradeoffs introduced in Level ${selectedNode.level}?`,
                        answerOrExplanation: `Level ${selectedNode.level} establishes modularity, type safety, and clean separation of concerns, balancing implementation velocity with long-term maintainability.`,
                        solutionRubric: "Demonstrates clear grasp of architectural tradeoffs, edge cases, and design rationale.",
                      },
                      {
                        question: `How do you systematically troubleshoot unexpected failures when executing Level ${selectedNode.level} tasks?`,
                        answerOrExplanation: "Inspect diagnostic logs, isolate components in test harnesses, verify environment configurations, and validate inputs against expected schemas.",
                        solutionRubric: "Articulates a structured scientific debugging methodology rather than trial and error.",
                      },
                    ];

              const completionCriteria: string[] =
                selectedNode.completionCriteria && selectedNode.completionCriteria.length > 0
                  ? selectedNode.completionCriteria
                  : [
                      `All Level ${selectedNode.level} topics and subtopics verified`,
                      `Milestone project implemented and passing all tests`,
                      `Code adheres to industry standards with 0 runtime errors`,
                      `Self-assessment knowledge check answered accurately`,
                    ];

              return (
                <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-sm space-y-4 mt-2">
                  {/* Stage Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-border/50 flex-wrap gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-brand-soft text-brand flex items-center justify-center shadow-xs">
                        {getNodeIcon(selectedNode.skill)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface border border-border/60 text-muted-foreground">
                            Stage {selectedNode.level}
                          </span>
                          <h4 className="text-sm font-bold text-foreground">
                            {selectedNode.title}
                          </h4>
                        </div>
                        <span className="text-[11px] text-muted-foreground font-medium">{selectedNode.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                          selectedNode.state === "COMPLETED" || selectedNode.state === "PASSED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : selectedNode.state === "IN_PROGRESS"
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse"
                            : selectedNode.state === "LOCKED"
                            ? "bg-surface-muted text-muted-foreground border-border/60"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {selectedNode.state.replace("_", " ")}
                      </span>
                      <button
                        onClick={() => {
                          const allOpen = Object.values(expandedSections).every(Boolean);
                          setExpandedSections({
                            overview: !allOpen,
                            topics: !allOpen,
                            project: !allOpen,
                            troubleshooting: !allOpen,
                            assessments: !allOpen,
                            criteria: !allOpen,
                            resources: !allOpen,
                          });
                        }}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-surface hover:bg-surface-muted border border-border/60 text-muted-foreground hover:text-foreground transition font-medium"
                      >
                        {Object.values(expandedSections).every(Boolean) ? "Collapse All" : "Expand All"}
                      </button>
                    </div>
                  </div>

                  {/* 1. OVERVIEW & OBJECTIVES (Collapsible) */}
                  <div className="rounded-xl border border-border/70 bg-surface overflow-hidden shadow-2xs">
                    <button
                      onClick={() => toggleSection("overview")}
                      className="w-full p-2.5 bg-surface-muted/30 hover:bg-surface-muted/50 transition flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-brand" />
                        <span className="text-xs font-bold text-foreground">Stage Overview, Objectives & Prerequisites</span>
                      </div>
                      {expandedSections.overview ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                    {expandedSections.overview && (
                      <div className="p-3 space-y-2.5 text-xs">
                        {/* Prerequisites & Unlocks */}
                        <div className="flex items-center justify-between text-[11px] bg-surface-muted/40 p-2 rounded-lg border border-border/50 flex-wrap gap-2">
                          <span className="text-muted-foreground">
                            <strong>Prerequisites:</strong>{" "}
                            {selectedNode.prerequisites && selectedNode.prerequisites.length > 0
                              ? selectedNode.prerequisites.join(", ")
                              : selectedNode.level === 1
                              ? "None (Foundational)"
                              : `Stage ${selectedNode.level - 1}`}
                          </span>
                          <span className="text-brand font-medium">
                            <strong>Unlocks:</strong>{" "}
                            {typeof selectedNode.nextMilestoneUnlocked === "object"
                              ? `Stage ${selectedNode.nextMilestoneUnlocked.stage}: ${selectedNode.nextMilestoneUnlocked.title}`
                              : selectedNode.nextMilestoneUnlocked || `Level ${selectedNode.level + 1}`}
                          </span>
                        </div>

                        {/* Concept & Why Learn This */}
                        <div className="space-y-1">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                            Core Conceptual Focus
                          </span>
                          <p className="text-xs text-foreground leading-relaxed">{selectedNode.concept}</p>
                          {selectedNode.whyLearnThis && (
                            <p className="text-[11px] text-muted-foreground italic pt-0.5">
                              Why this matters: {selectedNode.whyLearnThis}
                            </p>
                          )}
                        </div>

                        {/* Learning Objectives */}
                        {selectedNode.learningObjectives && selectedNode.learningObjectives.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-border/40">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                              Verifiable Learning Objectives
                            </span>
                            <ul className="space-y-1 pl-1">
                              {selectedNode.learningObjectives.map((obj, i) => (
                                <li key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                                  <Check className="w-3 h-3 text-brand mt-0.5 shrink-0" />
                                  <span>{obj}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 2. TOPICS & SUBTOPICS HIERARCHY (Collapsible, open by default) */}
                  <div className="rounded-xl border border-border/70 bg-surface overflow-hidden shadow-2xs">
                    <button
                      onClick={() => toggleSection("topics")}
                      className="w-full p-2.5 bg-surface-muted/30 hover:bg-surface-muted/50 transition flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-3.5 h-3.5 text-brand" />
                        <span className="text-xs font-bold text-foreground">
                          Comprehensive Topics & Subtopics ({stageTopics.length})
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                          {stageTopics.filter((t) => t.completed).length}/{stageTopics.length} Mastered
                        </span>
                      </div>
                      {expandedSections.topics ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>

                    {expandedSections.topics && (
                      <div className="p-3 space-y-3 divide-y divide-border/40">
                        {stageTopics.map((topic, tIdx) => {
                          const isTopicExpanded = expandedTopicIds[topic.id] !== false;
                          return (
                            <div key={topic.id} className={tIdx > 0 ? "pt-3" : ""}>
                              {/* Topic Header Row */}
                              <div
                                onClick={() => toggleTopic(topic.id)}
                                className="flex items-start justify-between gap-2 p-2.5 rounded-lg bg-surface-muted/20 hover:bg-surface-muted/40 cursor-pointer transition border border-border/40"
                              >
                                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (onToggleTopicChecklist) {
                                        onToggleTopicChecklist(selectedNode.id, tIdx);
                                      }
                                    }}
                                    className="mt-0.5 shrink-0 text-muted-foreground hover:text-brand transition"
                                    title={topic.completed ? "Mark incomplete" : "Mark completed"}
                                  >
                                    {topic.completed ? (
                                      <CheckSquare className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                      <Square className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </button>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface border border-border/60 text-muted-foreground">
                                        Topic {tIdx + 1}
                                      </span>
                                      <span className={`text-xs font-bold text-foreground truncate ${topic.completed ? "line-through opacity-75" : ""}`}>
                                        {topic.title}
                                      </span>
                                    </div>
                                    {topic.subtopics && topic.subtopics.length > 0 && (
                                      <div className="text-[10px] text-muted-foreground mt-0.5">
                                        {topic.subtopics.length} subtopics covered
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-1.5">
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-border/50 text-muted-foreground">
                                    {isTopicExpanded ? "Hide" : "Expand"}
                                  </span>
                                  {isTopicExpanded ? (
                                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                                  )}
                                </div>
                              </div>

                              {/* Topic Details */}
                              {isTopicExpanded && (
                                <div className="mt-2.5 pl-6 pr-2 space-y-3 text-xs">
                                  {/* Subtopics List */}
                                  {topic.subtopics && topic.subtopics.length > 0 && (
                                    <div className="space-y-1.5">
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block flex items-center gap-1">
                                        <ListChecks className="w-3 h-3 text-brand" />
                                        Subtopics Breakdown
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {topic.subtopics.map((sub, sIdx) => (
                                          <span
                                            key={sIdx}
                                            className="text-[11px] px-2 py-0.5 rounded-md bg-surface border border-border/70 text-foreground font-medium shadow-2xs"
                                          >
                                            • {sub}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Concept Explanation */}
                                  <div className="p-2.5 rounded-lg bg-surface-muted/30 border border-border/50 space-y-1">
                                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block flex items-center gap-1">
                                      <BookOpen className="w-3 h-3 text-brand" />
                                      Concept Explanation
                                    </span>
                                    <p className="text-xs text-foreground leading-relaxed">
                                      {topic.explanation}
                                    </p>
                                  </div>

                                  {/* Key Syntax / APIs */}
                                  {topic.keySyntaxOrApis && topic.keySyntaxOrApis.length > 0 && (
                                    <div className="space-y-1">
                                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block flex items-center gap-1">
                                        <Code2 className="w-3 h-3 text-brand" />
                                        Important Syntax & APIs
                                      </span>
                                      <div className="flex flex-wrap gap-1 font-mono text-[10px]">
                                        {topic.keySyntaxOrApis.map((api, aIdx) => (
                                          <span
                                            key={aIdx}
                                            className="px-2 py-0.5 rounded bg-surface border border-border/70 text-brand font-semibold shadow-2xs"
                                          >
                                            {api}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Worked Example */}
                                  {topic.example && (
                                    <div className="p-2.5 rounded-lg bg-surface-muted/40 border border-border/60 space-y-1.5">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] uppercase font-bold text-brand tracking-wider flex items-center gap-1">
                                          <Terminal className="w-3 h-3 text-brand" />
                                          Worked Example: {topic.example.title}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleCopySnippet(`ex_${topic.id}`, topic.example?.codeOrWalkthrough || "")}
                                          className="text-[10px] flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface hover:bg-surface-muted text-muted-foreground border border-border/50 transition"
                                        >
                                          {copiedSnippetId === `ex_${topic.id}` ? (
                                            <>
                                              <CheckCheck className="w-3 h-3 text-emerald-500" />
                                              <span>Copied</span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3 h-3" />
                                              <span>Copy</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                      <p className="text-[11px] text-muted-foreground">{topic.example.description}</p>
                                      <pre className="p-2 rounded bg-background/90 text-foreground font-mono text-[11px] overflow-x-auto border border-border/70 leading-relaxed">
                                        <code>{topic.example.codeOrWalkthrough}</code>
                                      </pre>
                                    </div>
                                  )}

                                  {/* Practical Exercise */}
                                  {topic.exercise && (
                                    <div className="p-2.5 rounded-lg bg-surface-muted/30 border border-border/50 space-y-1.5">
                                      <div className="flex items-center justify-between flex-wrap gap-1">
                                        <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                                          <Wrench className="w-3 h-3" />
                                          Practical Exercise: {topic.exercise.title}
                                        </span>
                                        {topic.exercise.expectedOutcome && (
                                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium">
                                            Outcome: {topic.exercise.expectedOutcome}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-foreground font-medium">{topic.exercise.prompt}</p>
                                      {topic.exercise.instructions && topic.exercise.instructions.length > 0 && (
                                        <ul className="space-y-0.5 pl-1 pt-1">
                                          {topic.exercise.instructions.map((inst, inIdx) => (
                                            <li key={inIdx} className="text-[11px] text-muted-foreground flex items-start gap-1">
                                              <span className="text-brand font-bold">•</span>
                                              <span>{inst}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                      {topic.exercise.starterCode && (
                                        <div className="pt-1">
                                          <pre className="p-2 rounded bg-background/80 text-foreground font-mono text-[10px] overflow-x-auto border border-border/60">
                                            <code>{topic.exercise.starterCode}</code>
                                          </pre>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* Topic Troubleshooting */}
                                  {topic.troubleshooting && topic.troubleshooting.length > 0 && (
                                    <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 space-y-1 text-[11px]">
                                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-400 tracking-wider flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Common Gotchas & Debugging
                                      </span>
                                      <ul className="space-y-0.5">
                                        {topic.troubleshooting.map((tip, tipIdx) => (
                                          <li key={tipIdx} className="text-amber-900 dark:text-amber-200">
                                            • {tip}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 3. MILESTONE PROJECT & TASKS (Collapsible) */}
                  <div className="rounded-xl border border-border/70 bg-surface overflow-hidden shadow-2xs">
                    <button
                      onClick={() => toggleSection("project")}
                      className="w-full p-2.5 bg-surface-muted/30 hover:bg-surface-muted/50 transition flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-brand" />
                        <span className="text-xs font-bold text-foreground">
                          Milestone Project & Deliverables: {selectedNode.miniProject?.title}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground">
                          {selectedNode.miniProject?.difficulty || "Core"}
                        </span>
                      </div>
                      {expandedSections.project ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>

                    {expandedSections.project && (
                      <div className="p-3 space-y-2.5 text-xs">
                        <p className="text-[11px] text-muted-foreground">{selectedNode.task?.description || selectedNode.miniProject?.description}</p>

                        {/* Deliverables */}
                        {selectedNode.task?.deliverables && selectedNode.task.deliverables.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                              Deliverables Checklist
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {selectedNode.task.deliverables.map((d, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border/70 text-foreground font-medium shadow-2xs"
                                >
                                  ✓ {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actionable Tasks (Execution roadmaps) */}
                        {selectedNode.actionableTasks && selectedNode.actionableTasks.length > 0 && (
                          <div className="space-y-1.5 pt-1 border-t border-border/40">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                              Actionable Tasks & Role Responsibilities
                            </span>
                            <div className="space-y-1.5">
                              {selectedNode.actionableTasks.map((task) => (
                                <div key={task.id} className="p-2 rounded-lg bg-surface-muted/30 border border-border/40 text-[11px] space-y-1">
                                  <div className="flex items-center justify-between font-bold text-foreground">
                                    <span>{task.title}</span>
                                    {task.role && <span className="text-[10px] font-semibold text-brand">Role: {task.role}</span>}
                                  </div>
                                  <p className="text-muted-foreground">{task.description}</p>
                                  {task.deliverable && (
                                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                      Deliverable: {task.deliverable}
                                    </div>
                                  )}
                                  {task.risks && (
                                    <div className="text-[10px] text-amber-600 dark:text-amber-400">
                                      Risks: {task.risks}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 4. COMMON MISTAKES & TROUBLESHOOTING (Collapsible) */}
                  <div className="rounded-xl border border-border/70 bg-surface overflow-hidden shadow-2xs">
                    <button
                      onClick={() => toggleSection("troubleshooting")}
                      className="w-full p-2.5 bg-surface-muted/30 hover:bg-surface-muted/50 transition flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-xs font-bold text-foreground">
                          Common Mistakes & Troubleshooting Guidance ({commonMistakes.length})
                        </span>
                      </div>
                      {expandedSections.troubleshooting ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>

                    {expandedSections.troubleshooting && (
                      <div className="p-3 space-y-2 text-xs">
                        {commonMistakes.map((item, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-surface-muted/20 border border-border/50 space-y-1">
                            <div className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 text-[11px]">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              <span>Mistake: {item.mistake}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground pl-4">
                              <strong>Consequence:</strong> {item.consequence}
                            </p>
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 pl-4 font-medium">
                              <strong>Solution:</strong> {item.solutionOrFix}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5. KNOWLEDGE CHECK & ASSESSMENTS (Collapsible) */}
                  <div className="rounded-xl border border-border/70 bg-surface overflow-hidden shadow-2xs">
                    <button
                      onClick={() => toggleSection("assessments")}
                      className="w-full p-2.5 bg-surface-muted/30 hover:bg-surface-muted/50 transition flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-3.5 h-3.5 text-brand" />
                        <span className="text-xs font-bold text-foreground">
                          Knowledge Check & Self-Assessment ({knowledgeCheck.length})
                        </span>
                      </div>
                      {expandedSections.assessments ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>

                    {expandedSections.assessments && (
                      <div className="p-3 space-y-2.5 text-xs">
                        {knowledgeCheck.map((item, idx) => {
                          const isRevealed = Boolean(revealedAssessments[idx]);
                          return (
                            <div key={idx} className="p-2.5 rounded-lg bg-surface-muted/30 border border-border/50 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="font-bold text-foreground text-[11px] flex-1">
                                  Q{idx + 1}: {item.question}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleAssessment(idx)}
                                  className="text-[10px] px-2 py-0.5 rounded bg-surface hover:bg-surface-muted border border-border/60 text-brand font-semibold transition shrink-0 flex items-center gap-1"
                                >
                                  {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                  {isRevealed ? "Hide Answer" : "Reveal Answer & Rubric"}
                                </button>
                              </div>

                              {item.options && item.options.length > 0 && (
                                <div className="space-y-1 pl-1">
                                  {item.options.map((opt, oIdx) => (
                                    <div key={oIdx} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                                      <span className="w-3.5 h-3.5 rounded-full border border-border flex items-center justify-center text-[9px] font-bold">
                                        {String.fromCharCode(65 + oIdx)}
                                      </span>
                                      <span>{opt}</span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {isRevealed && (
                                <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[11px] space-y-1 transition animate-fadeIn">
                                  <div className="font-bold text-emerald-700 dark:text-emerald-400">
                                    Model Answer:
                                  </div>
                                  <p className="text-foreground leading-relaxed">
                                    {item.answerOrExplanation}
                                  </p>
                                  {item.solutionRubric && (
                                    <div className="text-[10px] text-muted-foreground pt-1 border-t border-emerald-500/20">
                                      <strong>Grading Rubric:</strong> {item.solutionRubric}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 6. COMPLETION REQUIREMENTS (Collapsible) */}
                  <div className="rounded-xl border border-border/70 bg-surface overflow-hidden shadow-2xs">
                    <button
                      onClick={() => toggleSection("criteria")}
                      className="w-full p-2.5 bg-surface-muted/30 hover:bg-surface-muted/50 transition flex items-center justify-between text-left"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-bold text-foreground">
                          Verifiable Completion Requirements & Rubric
                        </span>
                      </div>
                      {expandedSections.criteria ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>

                    {expandedSections.criteria && (
                      <div className="p-3 space-y-2 text-xs">
                        <ul className="space-y-1 pl-1">
                          {completionCriteria.map((c, i) => (
                            <li key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                              <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{c}</span>
                            </li>
                          ))}
                        </ul>
                        {selectedNode.assessment && (
                          <div className="mt-2 p-2 rounded bg-surface-muted/30 border border-border/40 text-[11px] text-muted-foreground">
                            <strong>Assessment Threshold:</strong> Pass score {selectedNode.assessment.passingScore || 80}% · {selectedNode.assessment.criterion}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 7. RECOMMENDED FREE RESOURCES (Collapsible) */}
                  {selectedNode.freeResources && selectedNode.freeResources.length > 0 && (
                    <div className="rounded-xl border border-border/70 bg-surface overflow-hidden shadow-2xs">
                      <button
                        onClick={() => toggleSection("resources")}
                        className="w-full p-2.5 bg-surface-muted/30 hover:bg-surface-muted/50 transition flex items-center justify-between text-left"
                      >
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-3.5 h-3.5 text-brand" />
                          <span className="text-xs font-bold text-foreground">
                            Recommended Documentation & Resources ({selectedNode.freeResources.length})
                          </span>
                        </div>
                        {expandedSections.resources ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                      </button>

                      {expandedSections.resources && (
                        <div className="p-3 space-y-1.5 text-xs">
                          {selectedNode.freeResources.map((res, i) => (
                            <a
                              key={i}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 rounded-lg bg-surface hover:bg-surface-muted border border-border/60 transition group text-[11px]"
                            >
                              <span className="font-medium text-foreground group-hover:text-brand transition flex items-center gap-1.5 truncate">
                                <BookOpen className="w-3 h-3 text-brand" />
                                {res.title}
                              </span>
                              <span className="text-[10px] text-muted-foreground flex items-center gap-1 shrink-0">
                                {res.platform}
                                <ExternalLink className="w-2.5 h-2.5" />
                              </span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Estimated study time notice */}
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground bg-surface-muted/30 p-2 rounded-lg border border-border/40">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      Estimated Effort: {selectedNode.estimatedStudyTime || "12-16 hours"}
                    </span>
                    <span>Self-paced progression with persistent progress tracking</span>
                  </div>

                  {/* Interactive Action Buttons */}
                  <div className="pt-2 flex flex-col gap-2">
                    {selectedNode.state !== "COMPLETED" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onStartProject(selectedNode.level)}
                          className="flex-1 px-3 py-2 rounded-lg bg-gradient-brand text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-brand hover:opacity-95 transition"
                        >
                          <Code2 className="w-3.5 h-3.5" />
                          {selectedNode.state === "REVISION_REQUIRED"
                            ? "Revise & Resubmit Project"
                            : selectedNode.state === "PASSED"
                            ? "View Passed Project"
                            : "Work on Project & Submit"}
                        </button>

                        <button
                          onClick={() => onCompleteTask(selectedNode.id)}
                          className="px-3 py-2 rounded-lg bg-surface hover:bg-surface-muted border border-border text-xs font-semibold text-foreground transition flex items-center gap-1"
                          title="Verify and advance milestone"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                          Complete Stage
                        </button>

                        <button
                          onClick={() => onSkipTask(selectedNode.id)}
                          className="px-2.5 py-2 rounded-lg bg-surface hover:bg-surface-muted border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition flex items-center gap-1"
                          title="Skip and advance pointer"
                        >
                          <SkipForward className="w-3 h-3" />
                          Skip
                        </button>
                      </div>
                    )}

                    {selectedNode.state === "COMPLETED" && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 py-2 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-lg border border-emerald-500/20 flex items-center justify-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Competency Verified & Completed
                        </div>
                        <button
                          onClick={() => onStartProject(selectedNode.level)}
                          className="px-3 py-2 rounded-lg bg-surface hover:bg-surface-muted border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition"
                        >
                          View Project
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 2: PROGRESSIVE STAGES VIEW */}
        {activeTab === "stages" && (
          <div className="space-y-2.5">
            <p className="text-xs text-muted-foreground leading-relaxed pb-1">
              Curriculum progression covering all {roadmap.nodes.length} stages. Each milestone builds directly on prerequisite foundations:
            </p>
            {roadmap.stages.map((stg) => (
              <div
                key={stg.stage}
                onClick={() => {
                  const targetNode = roadmap.nodes.find((n) => n.level === stg.stage);
                  if (targetNode) {
                    setSelectedNodeId(targetNode.id);
                    setActiveTab("journey");
                  }
                }}
                className={`p-3 rounded-xl border transition flex items-start justify-between gap-3 cursor-pointer ${
                  stg.status === "COMPLETED"
                    ? "bg-surface border-emerald-500/30 hover:border-emerald-500/50"
                    : stg.status === "ACTIVE"
                    ? "bg-brand-soft/20 border-brand shadow-xs"
                    : "bg-surface-muted/30 border-border/60 hover:bg-surface-muted/50"
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-surface border border-border text-muted-foreground">
                      Stage {stg.stage}
                    </span>
                    <span className="text-xs font-bold text-foreground truncate">{stg.projectTitle}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">{stg.deliverables}</div>
                  <div className="text-[10px] text-brand font-semibold">Skill: {stg.skillFocus}</div>
                </div>

                <div className="shrink-0 text-right space-y-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-surface border border-border text-muted-foreground block">
                    {stg.complexity}
                  </span>
                  {stg.status === "ACTIVE" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartProject(stg.stage);
                      }}
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand text-white shadow-xs hover:opacity-90 transition block ml-auto"
                    >
                      Active
                    </button>
                  )}
                  {stg.status === "COMPLETED" && (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                      ✓ Done
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: STUDY PACING SELECTOR */}
        {activeTab === "pacing" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-surface border border-border/80 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand" />
                <h4 className="text-xs font-bold text-foreground">Adjust Daily Study Commitment</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                Set how much time you dedicate each day. OmniForge uses realistic pacing calculations, not arbitrary guarantees, to project your milestone timelines.
              </p>

              <div className="grid grid-cols-5 gap-2 pt-1">
                {[0.5, 1.0, 1.5, 2.0, 3.0].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => onUpdateStudyPace && onUpdateStudyPace(hours)}
                    className={`py-2 px-1 rounded-xl text-center border transition ${
                      Math.abs(currentDailyHours - hours) < 0.1
                        ? "bg-brand text-white font-bold border-brand shadow-brand"
                        : "bg-surface hover:bg-surface-muted text-foreground border-border/70"
                    }`}
                  >
                    <div className="text-xs font-bold">{hours}h</div>
                    <div className="text-[9px] opacity-80">/day</div>
                  </button>
                ))}
              </div>

              {/* Dynamic Projection Breakdown */}
              <div className="mt-3 p-3 rounded-lg bg-surface-muted/40 border border-border/50 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Milestone ({selectedNode?.title}):</span>
                  <span className="font-bold text-foreground">{activeTimeline}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Full Curriculum Track ({roadmap.nodes.length} Stages):</span>
                  <span className="font-bold text-brand">{trackTimeline}</span>
                </div>
                <div className="text-[10px] text-muted-foreground pt-1 border-t border-border/40">
                  Total track curriculum: ~{currentTotalHours} study hours
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
