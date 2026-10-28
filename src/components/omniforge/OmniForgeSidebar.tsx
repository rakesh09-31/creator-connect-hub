import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Plus,
  GitBranch,
  FolderOpen,
  Trash2,
  Edit2,
  Check,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Layers,
  Clock,
  MoreVertical,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { OmniForgeConversation, SavedRoadmapItem, OmniForgeProject } from "@/lib/omniforge/types";

interface OmniForgeSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  conversations: OmniForgeConversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  roadmaps: SavedRoadmapItem[];
  activeRoadmapId?: string | null;
  onSelectRoadmap: (roadmap: SavedRoadmapItem) => void;
  onDeleteRoadmap: (id: string) => void;
  onRenameRoadmap: (id: string, newTitle: string) => void;
  projects?: OmniForgeProject[];
  activeProjectId?: string | null;
  onSelectProject?: (project: OmniForgeProject) => void;
  onResumeUploadClick: () => void;
  resumeParsed?: boolean;
  initialSection?: "chats" | "roadmaps" | "projects";
}

function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return new Date(isoString).toLocaleDateString([], { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function OmniForgeSidebar({
  isOpen,
  onToggle,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  roadmaps,
  activeRoadmapId,
  onSelectRoadmap,
  onDeleteRoadmap,
  onRenameRoadmap,
  projects = [],
  activeProjectId,
  onSelectProject,
  onResumeUploadClick,
  resumeParsed = false,
  initialSection,
}: OmniForgeSidebarProps) {
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingConvTitle, setEditingConvTitle] = useState("");
  const [editingRoadmapId, setEditingRoadmapId] = useState<string | null>(null);
  const [editingRoadmapTitle, setEditingRoadmapTitle] = useState("");
  const [activeSection, setActiveSection] = useState<"chats" | "roadmaps" | "projects">(
    initialSection || "chats"
  );
  const [roadmapMenuOpenId, setRoadmapMenuOpenId] = useState<string | null>(null);
  const [roadmapToDelete, setRoadmapToDelete] = useState<SavedRoadmapItem | null>(null);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    const handleGlobalClick = () => {
      setRoadmapMenuOpenId(null);
    };
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setRoadmapMenuOpenId(null);
        setRoadmapToDelete(null);
      }
    };
    window.addEventListener("click", handleGlobalClick);
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const startRenameConv = (conv: OmniForgeConversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(conv.id);
    setEditingConvTitle(conv.title);
  };

  const confirmRenameConv = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingConvTitle.trim()) {
      onRenameConversation(convId, editingConvTitle.trim());
    }
    setEditingConvId(null);
  };

  const cancelRenameConv = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConvId(null);
  };

  const startRenameRoadmap = (rm: SavedRoadmapItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoadmapId(rm.id);
    setEditingRoadmapTitle(rm.title);
  };

  const confirmRenameRoadmap = (rmId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingRoadmapTitle.trim()) {
      onRenameRoadmap(rmId, editingRoadmapTitle.trim());
    }
    setEditingRoadmapId(null);
  };

  const cancelRenameRoadmap = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingRoadmapId(null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        onClick={onToggle}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden animate-fade-in"
        aria-hidden="true"
      />

      <aside
        className="fixed md:static inset-y-0 left-0 z-50 md:z-20 w-[min(320px,100vw)] sm:w-[320px] md:w-[340px] md:min-w-[340px] md:max-w-[340px] shrink-0 h-full bg-surface border-r border-border/80 shadow-2xl md:shadow-none flex flex-col transition-all duration-200 overflow-hidden roadmaps-sidebar"
        aria-label="Roadmaps and conversations sidebar"
      >
        {/* Sidebar Header: New Chat & Close */}
        <div className="p-3.5 border-b border-border/60 flex items-center justify-between gap-2 shrink-0">
          <button
            onClick={() => {
              onNewChat();
              if (typeof window !== "undefined" && window.innerWidth < 768) {
                onToggle();
              }
            }}
            className="flex-1 py-2 px-3 rounded-xl bg-brand text-white text-xs font-bold shadow-xs hover:opacity-95 transition flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Chat</span>
          </button>
          <button
            onClick={onToggle}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-surface-muted transition shrink-0"
            title="Close roadmaps sidebar"
            aria-label="Close roadmaps sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

      {/* Navigation Sub-Tabs: Chats, Roadmaps, Projects */}
      <div className="p-2 border-b border-border/40 grid grid-cols-3 gap-1 bg-surface-muted/50">
        <button
          onClick={() => setActiveSection("chats")}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5 ${
            activeSection === "chats"
              ? "bg-surface text-foreground shadow-xs border border-border/70"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-3 h-3 text-brand" />
          <span>Chats</span>
          <span className="text-[10px] text-muted-foreground">({conversations.length})</span>
        </button>
        <button
          onClick={() => setActiveSection("roadmaps")}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5 ${
            activeSection === "roadmaps"
              ? "bg-surface text-foreground shadow-xs border border-border/70"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <GitBranch className="w-3 h-3 text-cyan-500" />
          <span>Roadmaps</span>
          <span className="text-[10px] text-muted-foreground">({roadmaps.length})</span>
        </button>
        <button
          onClick={() => setActiveSection("projects")}
          className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5 ${
            activeSection === "projects"
              ? "bg-surface text-foreground shadow-xs border border-border/70"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FolderOpen className="w-3 h-3 text-amber-500" />
          <span>Projects</span>
          <span className="text-[10px] text-muted-foreground">({projects.length})</span>
        </button>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {activeSection === "chats" && (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Recent Conversations</span>
            </div>
            {conversations.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground space-y-2">
                <MessageSquare className="w-6 h-6 mx-auto opacity-30" />
                <p>No recent chats yet.</p>
                <p className="text-[11px]">Start a conversation to see your history here.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = activeConversationId === conv.id;
                const isEditing = editingConvId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => !isEditing && onSelectConversation(conv.id)}
                    className={`group relative p-2.5 rounded-xl border text-left transition cursor-pointer flex items-center justify-between gap-2 ${
                      isActive
                        ? "bg-brand-soft/20 border-brand text-foreground shadow-xs"
                        : "bg-surface hover:bg-surface-muted border-border/50 text-foreground/90"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingConvTitle}
                            onChange={(e) => setEditingConvTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmRenameConv(conv.id, e as any);
                              if (e.key === "Escape") cancelRenameConv(e as any);
                            }}
                            autoFocus
                            className="w-full text-xs px-2 py-1 bg-surface border border-brand rounded-lg text-foreground focus:outline-none"
                          />
                          <button
                            onClick={(e) => confirmRenameConv(conv.id, e)}
                            className="p-1 text-emerald-500 hover:text-emerald-600"
                            title="Save"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={cancelRenameConv}
                            className="p-1 text-muted-foreground hover:text-foreground"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="text-xs font-semibold truncate flex items-center gap-1.5">
                            <span className="truncate">{conv.title}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{formatRelativeTime(conv.updatedAt)}</span>
                            <span>•</span>
                            <span>{conv.messages?.length || 0} msgs</span>
                          </div>
                        </>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition shrink-0">
                        <button
                          onClick={(e) => startRenameConv(conv, e)}
                          className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteConversation(conv.id);
                          }}
                          className="p-1 text-muted-foreground hover:text-rose-500 rounded-md hover:bg-surface"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeSection === "roadmaps" && (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Saved Roadmaps ({roadmaps.length})</span>
            </div>
            {roadmaps.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground space-y-2">
                <GitBranch className="w-6 h-6 mx-auto opacity-30 text-cyan-500" />
                <p>No saved roadmaps yet.</p>
                <p className="text-[11px]">Ask OmniForge to create a learning roadmap.</p>
              </div>
            ) : (
              roadmaps.map((rm) => {
                const isActive = activeRoadmapId === rm.id;
                const isEditing = editingRoadmapId === rm.id;

                return (
                  <div
                    key={rm.id}
                    onClick={() => {
                      if (!isEditing) {
                        onSelectRoadmap(rm);
                        if (typeof window !== "undefined" && window.innerWidth < 768) {
                          onToggle();
                        }
                      }
                    }}
                    className={`group relative p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1.5 ${
                      isActive
                        ? "bg-cyan-500/10 border-cyan-500 text-foreground shadow-xs"
                        : "bg-surface hover:bg-surface-muted border-border/50 text-foreground/90"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editingRoadmapTitle}
                              onChange={(e) => setEditingRoadmapTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") confirmRenameRoadmap(rm.id, e as any);
                                if (e.key === "Escape") cancelRenameRoadmap(e as any);
                              }}
                              autoFocus
                              className="w-full text-xs px-2 py-1 bg-surface border border-cyan-500 rounded-lg text-foreground focus:outline-none"
                            />
                            <button
                              onClick={(e) => confirmRenameRoadmap(rm.id, e)}
                              className="p-1 text-emerald-500 hover:text-emerald-600"
                              title="Save"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={cancelRenameRoadmap}
                              className="p-1 text-muted-foreground hover:text-foreground"
                              title="Cancel"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="text-xs font-bold text-foreground truncate">{rm.title}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center justify-between gap-1">
                              <span className="truncate">🎯 {rm.subject || rm.targetSkillOrOutcome || "Core Skills"}</span>
                              <span className="shrink-0 text-[9px] opacity-75">{formatRelativeTime(rm.updatedAt)}</span>
                            </div>
                            {(rm.summary || rm.roadmapData?.summary) && (
                              <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1 leading-snug">
                                {rm.summary || rm.roadmapData?.summary}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="relative flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoadmapMenuOpenId((prev) => (prev === rm.id ? null : rm.id));
                            }}
                            className="p-1 text-muted-foreground hover:text-foreground rounded-md hover:bg-surface-muted transition"
                            title="Roadmap options"
                            aria-label={`Options for ${rm.title}`}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setRoadmapToDelete(rm);
                            }}
                            className="p-1 text-muted-foreground hover:text-rose-500 rounded-md hover:bg-surface-muted transition opacity-70 group-hover:opacity-100"
                            title="Delete roadmap"
                            aria-label={`Delete ${rm.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {roadmapMenuOpenId === rm.id && (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-0 top-7 z-30 w-36 rounded-xl bg-surface border border-border shadow-lg p-1 space-y-0.5 text-xs animate-in fade-in-50 zoom-in-95"
                            >
                              <button
                                onClick={() => {
                                  setRoadmapMenuOpenId(null);
                                  onSelectRoadmap(rm);
                                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                                    onToggle();
                                  }
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg text-left text-foreground hover:bg-surface-muted transition flex items-center gap-2 font-medium"
                              >
                                <GitBranch className="w-3.5 h-3.5 text-cyan-500" />
                                <span>Open roadmap</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  setRoadmapMenuOpenId(null);
                                  startRenameRoadmap(rm, e);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg text-left text-foreground hover:bg-surface-muted transition flex items-center gap-2 font-medium"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRoadmapMenuOpenId(null);
                                  setRoadmapToDelete(rm);
                                }}
                                className="w-full px-2.5 py-1.5 rounded-lg text-left text-rose-500 hover:bg-rose-500/10 transition flex items-center gap-2 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete roadmap</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {!isEditing && (
                      <div className="space-y-1 pt-1.5 border-t border-border/40">
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium">
                            <GitBranch className="w-3 h-3 text-cyan-500" />
                            {rm.completedStages || 0}/{rm.totalStages || 6} Stages
                          </span>
                          <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                            {rm.progressPercent || 0}% Complete
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                            style={{ width: `${Math.max(4, rm.progressPercent || 0)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeSection === "projects" && (
          <div className="space-y-1">
            <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Saved Projects ({projects.length})</span>
            </div>
            {projects.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground space-y-2">
                <FolderOpen className="w-6 h-6 mx-auto opacity-30 text-amber-500" />
                <p>No active projects yet.</p>
                <p className="text-[11px]">Tell OmniForge what you want to build.</p>
              </div>
            ) : (
              projects.map((proj) => {
                const isActive = activeProjectId === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => onSelectProject && onSelectProject(proj)}
                    className={`group p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-1 ${
                      isActive
                        ? "bg-amber-500/10 border-amber-500 text-foreground shadow-xs"
                        : "bg-surface hover:bg-surface-muted border-border/50 text-foreground/90"
                    }`}
                  >
                    <div className="text-xs font-bold text-foreground truncate">{proj.title}</div>
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                      <span>{proj.domain}</span>
                      <span>•</span>
                      <span>{proj.phases?.length || 0} Phases</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Sidebar Footer: Resume Calibration & User Status */}
      <div className="p-3 border-t border-border/60 bg-surface-muted/30 space-y-2">
        <button
          onClick={onResumeUploadClick}
          className={`w-full p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition shadow-xs ${
            resumeParsed
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15"
              : "bg-surface hover:bg-surface-muted border-border text-foreground"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileText className={`w-4 h-4 shrink-0 ${resumeParsed ? "text-emerald-500" : "text-brand"}`} />
            <div className="min-w-0 text-left">
              <div className="truncate font-bold">
                {resumeParsed ? "Resume Verified ✓" : "Upload Resume"}
              </div>
              <div className="text-[10px] text-muted-foreground truncate">
                {resumeParsed ? "Competency calibrated" : "Extract verified skills"}
              </div>
            </div>
          </div>
          {resumeParsed ? (
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          ) : (
            <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )}
        </button>
      </div>
    </aside>

      {/* Delete Confirmation Dialog */}
      {roadmapToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-roadmap-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setRoadmapToDelete(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-surface border border-border shadow-2xl p-5 space-y-4 animate-in fade-in-50 zoom-in-95"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 id="delete-roadmap-dialog-title" className="text-sm font-bold text-foreground">
                  Delete this roadmap?
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This will permanently remove this saved roadmap and its associated roadmap-specific progress. This action cannot be undone.
                </p>
                <div className="mt-2 p-2 rounded-lg bg-surface-muted/60 border border-border/40 text-[11px] font-semibold text-foreground truncate">
                  {roadmapToDelete.title}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <button
                type="button"
                onClick={() => setRoadmapToDelete(null)}
                className="px-3.5 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-muted text-xs font-semibold text-foreground transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = roadmapToDelete.id;
                  setRoadmapToDelete(null);
                  onDeleteRoadmap(id);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition"
              >
                Delete roadmap
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
