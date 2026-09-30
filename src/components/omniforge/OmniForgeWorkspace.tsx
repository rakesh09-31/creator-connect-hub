import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Layers,
  Users,
  CheckCircle2,
  Clock,
  Send,
  Bot,
  User,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  FileText,
  ListTodo,
  GitBranch,
  RefreshCw,
  Trophy,
  Trash2,
  X,
  PlusCircle,
  Check,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { OmniForgeProject, ProjectTask, TaskStatus, CreatorRecommendation } from "@/lib/omniforge/types";
import { processWorkspaceAssistantQuery } from "@/lib/omniforge/engine";
import { omniforgeChatServerFn } from "@/lib/api/omniforge.functions";
import {
  SquadTask,
  SquadInvitation,
  SquadMember,
  fetchSquadTasks,
  fetchSquadMembers,
  createSquadTask,
  updateSquadTaskStatus,
  deleteSquadTask,
  cancelCreatorInvitation,
} from "@/lib/omniforge/collaboration";
import { CreatorAvatar } from "./CreatorAvatar";
import { ProjectVisualGraph } from "./ProjectVisualGraph";
import { ChatMarkdown } from "./ChatMarkdown";

interface OmniForgeWorkspaceProps {
  project: OmniForgeProject;
  squadId?: string | null;
  currentUserId?: string;
  invitations?: SquadInvitation[];
  onRefreshInvitations?: () => void;
  onUpdateTaskStatus: (taskId: string, status: TaskStatus) => void;
  onUpdateProject: (updated: OmniForgeProject) => void;
  onLaunchSquad: () => void;
  isConvertingSquad: boolean;
}

export function OmniForgeWorkspace({
  project,
  squadId,
  currentUserId,
  invitations,
  onRefreshInvitations,
  onUpdateTaskStatus,
  onUpdateProject,
  onLaunchSquad,
  isConvertingSquad,
}: OmniForgeWorkspaceProps) {
  const effectiveSquadId = project.squadId || squadId;
  const [activeTab, setActiveTab] = useState<"overview" | "roadmap" | "tasks" | "team" | "assistant">("overview");

  // Persistent Squad Tasks State
  const [persistentTasks, setPersistentTasks] = useState<SquadTask[]>([]);
  const [squadMembers, setSquadMembers] = useState<SquadMember[]>([]);
  const [isLoadingPersistent, setIsLoadingPersistent] = useState(false);
  const [taskViewMode, setTaskViewMode] = useState<"squad" | "blueprint">("squad");

  // Add Task Modal State
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState<string>("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Assistant State
  const [assistantInput, setAssistantInput] = useState("");
  const [assistantMessages, setAssistantMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: `Hello! I'm your OmniForge AI Assistant for **${project.title}**. Ask me anything—from development roadmaps, technical architecture, and coding steps, to milestone tracking, task prioritization, or team roles.`,
    },
  ]);
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

  // Load persistent squad tasks and members whenever squadId changes
  const loadSquadData = useCallback(async () => {
    if (!effectiveSquadId) return;
    setIsLoadingPersistent(true);
    try {
      const [tasks, members] = await Promise.all([
        fetchSquadTasks(effectiveSquadId),
        fetchSquadMembers(effectiveSquadId),
      ]);
      setPersistentTasks(tasks);
      setSquadMembers(members);
    } catch (e) {
      console.error("[OmniForge] Error loading squad data:", e);
    } finally {
      setIsLoadingPersistent(false);
    }
  }, [effectiveSquadId]);

  useEffect(() => {
    loadSquadData();
  }, [loadSquadData]);

  // Compute stats
  const allTasks = (project.phases || []).flatMap((p) => p.tasks || []);
  const completedTasks = allTasks.filter((t) => t.status === "completed");
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress");
  const progressPercent = allTasks.length > 0 ? Math.round((completedTasks.length / allTasks.length) * 100) : 0;

  const persistentCompleted = persistentTasks.filter((t) => t.status === "done").length;
  const persistentInProgress = persistentTasks.filter((t) => t.status === "in_progress").length;

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!effectiveSquadId) {
      toast.error("A live squad must be linked to create persistent tasks.");
      return;
    }
    if (!newTaskTitle.trim()) {
      toast.error("Please enter a task title.");
      return;
    }

    setIsSubmittingTask(true);
    try {
      const res = await createSquadTask({
        squadId: effectiveSquadId,
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim() || undefined,
        assignedTo: newTaskAssignee || null,
        priority: newTaskPriority,
        dueDate: newTaskDueDate ? new Date(newTaskDueDate).toISOString() : undefined,
        createdBy: currentUserId,
      });

      if (res.success && res.task) {
        setPersistentTasks((prev) => [...prev, res.task!]);
        toast.success(`Task "${res.task.title}" created!`);
        setIsAddTaskOpen(false);
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskAssignee("");
        setNewTaskDueDate("");
      } else {
        toast.error(res.error || "Failed to create task");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error creating task");
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const handleUpdatePersistentStatus = async (taskId: string, status: "todo" | "in_progress" | "done") => {
    // Optimistic update
    setPersistentTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t))
    );

    const res = await updateSquadTaskStatus(taskId, status);
    if (!res.success) {
      toast.error(res.error || "Failed to update task status");
      loadSquadData(); // revert
    } else {
      toast.success(`Task updated to ${status.replace("_", " ")}`);
    }
  };

  const handleDeletePersistentTask = async (taskId: string) => {
    const res = await deleteSquadTask(taskId);
    if (res.success) {
      setPersistentTasks((prev) => prev.filter((t) => t.id !== taskId));
      toast.success("Task deleted");
    } else {
      toast.error(res.error || "Could not delete task");
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    if (!currentUserId) return;
    const res = await cancelCreatorInvitation(invitationId, currentUserId);
    if (res.success) {
      toast.success("Invitation cancelled");
      if (onRefreshInvitations) onRefreshInvitations();
    } else {
      toast.error(res.error || "Could not cancel invitation");
    }
  };

  const handleSendAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantInput.trim() || isAssistantThinking) return;

    const userMsg = assistantInput.trim();
    const updatedHistory = [...assistantMessages, { sender: "user" as const, text: userMsg }];
    setAssistantMessages(updatedHistory);
    setAssistantInput("");
    setIsAssistantThinking(true);

    try {
      const serverRes = await omniforgeChatServerFn({
        data: {
          text: userMsg,
          activeProject: project,
          conversationHistory: updatedHistory.map((m, idx) => ({
            id: `msg-ws-${idx}`,
            sender: m.sender,
            text: m.text,
            timestamp: new Date().toISOString(),
          })),
          userType: "creator",
          userId: currentUserId || "workspace-user",
        },
      });

      if (serverRes?.success && serverRes.response?.message) {
        setAssistantMessages((prev) => [...prev, { sender: "ai", text: serverRes.response.message }]);
      } else {
        const { reply } = processWorkspaceAssistantQuery(userMsg, project);
        setAssistantMessages((prev) => [...prev, { sender: "ai", text: reply }]);
      }
    } catch {
      const { reply } = processWorkspaceAssistantQuery(userMsg, project);
      setAssistantMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  const handleToggleDeliverable = (delId: string) => {
    const updatedDeliverables = project.deliverables.map((d) =>
      d.id === delId ? { ...d, completed: !d.completed } : d
    );
    onUpdateProject({ ...project, deliverables: updatedDeliverables });
  };

  return (
    <div className="flex flex-col h-full bg-surface/60 backdrop-blur-md rounded-2xl border border-border/70 overflow-hidden shadow-sm">
      {/* Workspace Header */}
      <div className="px-6 py-4 border-b border-border/60 bg-surface/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-brand-soft text-brand">
              Active Project Workspace
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-surface-muted text-muted-foreground border border-border/60">
              {project.domain}
            </span>
            {effectiveSquadId ? (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-success/15 text-success flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Live Squad Linked
              </span>
            ) : (
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                Blueprint Stage
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{project.title}</h1>
        </div>

        <div className="flex items-center gap-3">
          {effectiveSquadId ? (
            <Link
              to="/squads/$squadId"
              params={{ squadId: effectiveSquadId }}
              className="px-4 py-2 rounded-xl bg-gradient-brand text-white font-semibold text-xs flex items-center gap-2 shadow-brand hover:opacity-95 transition"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Open Connected Squad</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          ) : (
            <button
              onClick={onLaunchSquad}
              disabled={isConvertingSquad}
              className="px-4 py-2 rounded-xl bg-gradient-brand text-white font-semibold text-xs flex items-center gap-2 shadow-brand hover:opacity-95 transition"
            >
              {isConvertingSquad ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <Users className="w-3.5 h-3.5" />
                  <span>Convert to Live Squad</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="px-6 border-b border-border/60 bg-surface/50 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "overview"
              ? "border-brand text-brand font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("roadmap")}
          className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "roadmap"
              ? "border-brand text-brand font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <GitBranch className="w-3.5 h-3.5" />
          <span>Roadmap & Pipeline</span>
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "tasks"
              ? "border-brand text-brand font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span>
            Task Board {effectiveSquadId ? `(${persistentTasks.length} Live)` : `(${allTasks.length})`}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("team")}
          className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "team"
              ? "border-brand text-brand font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>
            Team Roster {squadMembers.length > 0 ? `(${squadMembers.length} Members)` : `(${project.recommendations.length})`}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("assistant")}
          className={`py-3 px-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === "assistant"
              ? "border-brand text-brand font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Project Assistant</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6 max-w-5xl">
            {/* Progress Bar */}
            <div className="p-5 rounded-2xl bg-surface border border-border/70 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Project Execution Progress</h3>
                  <p className="text-xs text-muted-foreground">
                    {effectiveSquadId ? (
                      <>
                        {persistentCompleted} of {persistentTasks.length} squad tasks done • {persistentInProgress} active
                      </>
                    ) : (
                      <>
                        {completedTasks.length} of {allTasks.length} tasks completed • {inProgressTasks.length} active
                      </>
                    )}
                  </p>
                </div>
                <span className="text-xl font-extrabold text-brand">
                  {effectiveSquadId && persistentTasks.length > 0
                    ? Math.round((persistentCompleted / persistentTasks.length) * 100)
                    : progressPercent}
                  %
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden border border-border/60">
                <div
                  className="h-full bg-gradient-brand transition-all duration-500 rounded-full"
                  style={{
                    width: `${
                      effectiveSquadId && persistentTasks.length > 0
                        ? Math.round((persistentCompleted / persistentTasks.length) * 100)
                        : progressPercent
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Visual Pipeline Graph */}
            <ProjectVisualGraph project={project} />

            {/* Deliverables Checklist */}
            <div className="p-5 rounded-2xl bg-surface border border-border/70 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <Trophy className="w-4 h-4 text-brand" />
                    Final Output Deliverables
                  </h3>
                  <p className="text-xs text-muted-foreground">Check off items as the team completes each milestone.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {project.deliverables.map((del) => (
                  <button
                    key={del.id}
                    onClick={() => handleToggleDeliverable(del.id)}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition ${
                      del.completed
                        ? "bg-success/10 border-success/30 text-success"
                        : "bg-surface-muted/50 border-border/60 hover:border-brand/40"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 mt-0.5 ${del.completed ? "text-success" : "text-muted-foreground"}`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground">{del.title}</div>
                      <div className="text-[11px] text-muted-foreground leading-tight mt-0.5">{del.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ROADMAP TAB */}
        {activeTab === "roadmap" && (
          <div className="space-y-6 max-w-5xl">
            <ProjectVisualGraph project={project} />

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-brand" />
                Phase Milestones & Tasks Breakdown
              </h3>

              <div className="space-y-3">
                {project.phases.map((ph, idx) => (
                  <div key={ph.id} className="p-4 rounded-xl bg-surface border border-border/80 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-brand-soft text-brand font-bold text-xs flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-foreground">{ph.name}</h4>
                          <p className="text-[11px] text-muted-foreground">{ph.description}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">{(ph.tasks || []).length} tasks</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {(ph.tasks || []).map((task) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-lg bg-surface-muted/50 border border-border/40 flex items-start justify-between gap-2"
                        >
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-foreground">{task.title}</span>
                            <div className="text-[10px] text-brand font-medium">Role: {task.requiredRole}</div>
                            {(task.dependencies || []).length > 0 && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400">
                                Depends on: {(task.dependencies || []).join(", ")}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground shrink-0">{task.estimatedDuration}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TASKS TAB */}
        {activeTab === "tasks" && (
          <div className="space-y-4 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-foreground">Interactive Task Board</h3>
                <p className="text-xs text-muted-foreground">
                  Manage persistent team tasks stored in Supabase database with real-time updates.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {effectiveSquadId && (
                  <div className="flex rounded-xl bg-surface-muted p-1 border border-border/60 text-[11px] font-semibold">
                    <button
                      onClick={() => setTaskViewMode("squad")}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        taskViewMode === "squad"
                          ? "bg-surface text-foreground shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Squad Tasks ({persistentTasks.length})
                    </button>
                    <button
                      onClick={() => setTaskViewMode("blueprint")}
                      className={`px-2.5 py-1 rounded-lg transition ${
                        taskViewMode === "blueprint"
                          ? "bg-surface text-foreground shadow-xs border border-border"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Blueprint Tasks ({allTasks.length})
                    </button>
                  </div>
                )}

                {effectiveSquadId && (
                  <button
                    onClick={() => setIsAddTaskOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-brand text-white font-semibold text-xs flex items-center gap-1.5 shadow-brand hover:opacity-95 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Squad Task</span>
                  </button>
                )}
              </div>
            </div>

            {/* Persistent Squad Tasks View */}
            {taskViewMode === "squad" && effectiveSquadId ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(["todo", "in_progress", "done"] as const).map((colStatus) => {
                  const colTasks = persistentTasks.filter((t) => t.status === colStatus);
                  const colLabels: Record<"todo" | "in_progress" | "done", { label: string; color: string }> = {
                    todo: { label: "To Do", color: "bg-surface text-foreground" },
                    in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                    done: { label: "Completed", color: "bg-success/10 text-success" },
                  };

                  return (
                    <div key={colStatus} className="p-3.5 rounded-xl bg-surface border border-border/80 space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {colLabels[colStatus].label}
                        </span>
                        <span className="text-xs font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-full">
                          {colTasks.length}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {colTasks.length === 0 && (
                          <div className="p-4 rounded-xl border border-dashed border-border/60 text-center text-xs text-muted-foreground">
                            No tasks in this column
                          </div>
                        )}

                        {colTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-3.5 rounded-xl bg-surface-muted/60 border border-border/50 hover:border-brand/40 transition space-y-2 shadow-xs group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="text-xs font-bold text-foreground leading-snug">{task.title}</div>
                              <button
                                onClick={() => handleDeletePersistentTask(task.id)}
                                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-500 p-1 transition"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>

                            {task.description && (
                              <div className="text-[11px] text-muted-foreground leading-relaxed">
                                {task.description}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-border/40">
                              <div className="flex items-center gap-1.5">
                                {task.assignee ? (
                                  <span className="font-semibold text-brand flex items-center gap-1">
                                    <User className="w-3 h-3" />
                                    {task.assignee.full_name || task.assignee.username}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic">Unassigned</span>
                                )}
                              </div>
                              <span
                                className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider ${
                                  task.priority === "urgent"
                                    ? "bg-rose-500/15 text-rose-500"
                                    : task.priority === "high"
                                    ? "bg-amber-500/15 text-amber-500"
                                    : "bg-surface text-muted-foreground"
                                }`}
                              >
                                {task.priority}
                              </span>
                            </div>

                            {/* Status Cycler Buttons */}
                            <div className="flex gap-1 pt-1">
                              {(["todo", "in_progress", "done"] as const).map((st) => (
                                <button
                                  key={st}
                                  onClick={() => handleUpdatePersistentStatus(task.id, st)}
                                  className={`text-[9px] uppercase px-2 py-0.5 rounded transition ${
                                    task.status === st
                                      ? "bg-brand text-white font-bold"
                                      : "bg-surface hover:bg-surface-muted text-muted-foreground"
                                  }`}
                                >
                                  {st === "in_progress" ? "In Prog" : st}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Blueprint Tasks Board */
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {(["to_do", "in_progress", "review", "completed"] as TaskStatus[]).map((colStatus) => {
                  const colTasks = allTasks.filter((t) => t.status === colStatus);
                  const colLabels: Record<TaskStatus, { label: string; color: string }> = {
                    to_do: { label: "To Do", color: "bg-surface text-foreground" },
                    in_progress: { label: "In Progress", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
                    review: { label: "Under Review", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
                    completed: { label: "Completed", color: "bg-success/10 text-success" },
                    pending: { label: "Pending", color: "bg-muted text-muted-foreground" },
                  };

                  return (
                    <div key={colStatus} className="p-3 rounded-xl bg-surface border border-border/80 space-y-3">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {colLabels[colStatus].label}
                        </span>
                        <span className="text-xs font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-full">
                          {colTasks.length}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {colTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 rounded-lg bg-surface-muted/60 border border-border/50 hover:border-brand/40 transition space-y-2 shadow-xs"
                          >
                            <div className="text-xs font-bold text-foreground leading-snug">{task.title}</div>
                            <div className="text-[10px] text-muted-foreground line-clamp-2">{task.description}</div>
                            <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/40">
                              <span className="text-brand font-semibold">{task.requiredRole}</span>
                              <span className="text-muted-foreground">{task.estimatedDuration}</span>
                            </div>

                            {/* Quick status cycler */}
                            <div className="flex gap-1 pt-1">
                              {(["to_do", "in_progress", "review", "completed"] as TaskStatus[]).map((st) => (
                                <button
                                  key={st}
                                  onClick={() => onUpdateTaskStatus(task.id, st)}
                                  className={`text-[9px] uppercase px-1.5 py-0.5 rounded transition ${
                                    task.status === st
                                      ? "bg-brand text-white font-bold"
                                      : "bg-surface hover:bg-surface-muted text-muted-foreground"
                                  }`}
                                >
                                  {st === "in_progress" ? "Prog" : st}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === "team" && (
          <div className="space-y-6 max-w-5xl">
            {/* Squad Project Specs Overview */}
            <div className="p-5 rounded-2xl bg-surface border border-border/80 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-brand" />
                  <h3 className="text-sm font-bold text-foreground">Project Specs & Brief</h3>
                </div>
                {effectiveSquadId && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                    Squad ID: {effectiveSquadId.slice(0, 8)}...
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {project.description || project.storyPremise || "Collaborative creative project brief."}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-2.5 rounded-xl bg-surface-muted/50 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block font-medium">Budget</span>
                  <span className="text-xs font-bold text-foreground">{project.budget || "₹15,000"}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-muted/50 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block font-medium">Timeline</span>
                  <span className="text-xs font-bold text-foreground">{project.estimatedTotalDuration || "2 weeks"}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-muted/50 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block font-medium">Domain</span>
                  <span className="text-xs font-bold text-foreground">{project.domain || "Film & Video"}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-surface-muted/50 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block font-medium">Live Members</span>
                  <span className="text-xs font-bold text-foreground">{squadMembers.length || 1}</span>
                </div>
              </div>
            </div>

            {/* Live Accepted Squad Members */}
            {squadMembers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Accepted Squad Members ({squadMembers.length})
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {squadMembers.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 rounded-xl bg-surface border border-border/80 shadow-sm flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <CreatorAvatar
                          url={member.user?.avatar_url || null}
                          name={member.user?.full_name || member.user?.username || "Squad Member"}
                          size="md"
                          className="ring-1 ring-border/60"
                        />
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-foreground truncate">
                              {member.user?.full_name || member.user?.username || "Squad Member"}
                            </span>
                            {member.user?.username && (
                              <span className="text-[10px] text-muted-foreground">@{member.user.username}</span>
                            )}
                          </div>
                          <div className="text-[11px] text-brand font-semibold capitalize">{member.role}</div>
                          <div className="text-[10px] text-muted-foreground">
                            Joined: {new Date(member.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      {member.user?.username && (
                        <Link
                          to="/user/$username"
                          params={{ username: member.user.username }}
                          className="p-2 rounded-lg bg-surface hover:bg-surface-muted border border-border text-foreground shrink-0"
                          title="View Profile"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sent Creator Invitations */}
            {invitations && invitations.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Sent Project Invitations ({invitations.length})
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {invitations.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-4 rounded-xl bg-surface border border-border/80 shadow-sm flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-foreground">
                            {inv.invitee?.full_name || inv.invitee?.username || "Creator"}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                              inv.status === "pending"
                                ? "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                                : inv.status === "accepted"
                                ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-500 border border-rose-500/30"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-brand font-semibold">Role: {inv.role}</div>
                        {inv.brief && (
                          <div className="text-[10px] text-muted-foreground line-clamp-1">{inv.brief}</div>
                        )}
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                          {inv.budget && <span>Budget: {inv.budget}</span>}
                          {inv.timeline && <span>• {inv.timeline}</span>}
                        </div>
                      </div>

                      {inv.status === "pending" && (
                        <button
                          onClick={() => handleCancelInvite(inv.id)}
                          className="px-2.5 py-1 rounded-lg bg-surface hover:bg-rose-500/10 border border-border text-rose-500 text-[10px] font-semibold transition shrink-0"
                        >
                          Cancel Invite
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Blueprint Recommendations Roster */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand" />
                Blueprint Candidate Roster ({project.recommendations.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {project.recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-4 rounded-xl bg-surface border border-border/80 shadow-sm flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <CreatorAvatar
                        url={rec.creator.avatarUrl}
                        name={rec.creator.fullName || rec.creator.username}
                        size="md"
                        className="ring-1 ring-border/60"
                      />
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-foreground truncate">
                            {rec.creator.fullName || rec.creator.username}
                          </span>
                          <span className="text-[10px] text-muted-foreground">@{rec.creator.username}</span>
                        </div>
                        <div className="text-[11px] text-brand font-semibold">{rec.roleName}</div>
                        <div className="text-[10px] text-muted-foreground pt-1">{rec.matchReason}</div>
                      </div>
                    </div>

                    <Link
                      to="/user/$username"
                      params={{ username: rec.creator.username }}
                      className="p-2 rounded-lg bg-surface hover:bg-surface-muted border border-border text-foreground shrink-0"
                      title="View Profile"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ASSISTANT TAB */}
        {activeTab === "assistant" && (
          <div className="space-y-4 max-w-3xl mx-auto flex flex-col h-[520px]">
            <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-surface rounded-2xl border border-border/70 shadow-sm">
              {assistantMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
                >
                  {msg.sender === "ai" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-brand flex items-center justify-center text-white shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-foreground font-medium rounded-tr-xs"
                        : "bg-surface-muted border border-border/60 text-foreground rounded-tl-xs"
                    }`}
                  >
                    {msg.sender === "user" ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <ChatMarkdown content={msg.text} />
                    )}
                  </div>
                </div>
              ))}

              {isAssistantThinking && (
                <div className="flex gap-2.5 items-center text-xs text-brand animate-fade-up">
                  <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                  <span>OmniForge AI is thinking...</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap gap-2">
              {[
                "Can you provide the steps to develop the ecommerce website?",
                "What should we do next?",
                "How do we optimize our timeline?",
                "What is React?",
              ].map((qp, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setAssistantInput(qp);
                  }}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-muted border border-border/60 text-muted-foreground font-medium transition"
                >
                  {qp}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendAssistant} className="flex gap-2">
              <input
                type="text"
                value={assistantInput}
                onChange={(e) => setAssistantInput(e.target.value)}
                placeholder="Ask about project progress, delays, replacement creators..."
                className="flex-1 bg-surface px-4 py-2.5 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 text-foreground"
              />
              <button
                type="submit"
                disabled={!assistantInput.trim() || isAssistantThinking}
                className="px-4 py-2.5 rounded-xl bg-gradient-brand text-white font-semibold text-xs flex items-center gap-1.5 shadow-brand disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Add Squad Task Modal */}
      {isAddTaskOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-bold text-foreground">Create Squad Task</h3>
              </div>
              <button
                onClick={() => setIsAddTaskOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Task Title *</label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Color grade outdoor scene footage"
                  className="w-full bg-surface-muted px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 text-foreground"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Description</label>
                <textarea
                  rows={2}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Deliverable specifications, notes, or references..."
                  className="w-full bg-surface-muted px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">Assignee</label>
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="w-full bg-surface-muted px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 text-foreground"
                  >
                    <option value="">Unassigned</option>
                    {squadMembers.map((m) => (
                      <option key={m.id} value={m.user_id}>
                        {m.user?.full_name || m.user?.username || m.role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-foreground">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full bg-surface-muted px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 text-foreground"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground">Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full bg-surface-muted px-3 py-2 rounded-xl border border-border text-xs focus:outline-none focus:ring-2 focus:ring-brand/40 text-foreground"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => setIsAddTaskOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-border text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTask || !newTaskTitle.trim()}
                  className="px-4 py-1.5 rounded-xl bg-gradient-brand text-white text-xs font-semibold shadow-brand hover:opacity-95 transition disabled:opacity-50"
                >
                  {isSubmittingTask ? "Saving..." : "Save Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
