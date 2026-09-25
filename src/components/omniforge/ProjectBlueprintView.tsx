import React, { useState } from "react";
import {
  Sparkles,
  Layers,
  Clock,
  Target,
  Users,
  CheckCircle2,
  GitBranch,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  FileText,
  Zap,
  ListOrdered,
  Workflow,
  Check,
} from "lucide-react";
import { OmniForgeProject } from "@/lib/omniforge/types";

interface ProjectBlueprintViewProps {
  project: OmniForgeProject;
  onProceedToTeam: () => void;
  onModifyPlan?: () => void;
}

export function ProjectBlueprintView({
  project,
  onProceedToTeam,
  onModifyPlan,
}: ProjectBlueprintViewProps) {
  const phases = project?.phases || [];
  const roles = project?.roles || [];
  const deliverables = project?.deliverables || [];
  const requirements = project?.requirements || [];
  const workflowStages = project?.workflowStages || [];
  const parallelWorkstreams = project?.parallelWorkstreams || [];

  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
    [phases[0]?.id || ""]: true,
    [phases[1]?.id || ""]: true,
    [phases[2]?.id || ""]: true,
  });

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => ({ ...prev, [phaseId]: !prev[phaseId] }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-destructive/15 text-destructive border-destructive/30";
      case "high":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "medium":
        return "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface/60 backdrop-blur-md rounded-2xl border border-border/70 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/60 bg-surface/80 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-brand-soft text-brand">
              {project.domain}
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-surface-muted text-muted-foreground border border-border/60">
              Complexity: {project.complexity}
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-surface-muted text-muted-foreground border border-border/60 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {project.estimatedTotalDuration}
            </span>
          </div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">{project.title}</h1>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">{project.goal}</p>
        </div>

        <button
          onClick={onProceedToTeam}
          className="px-4 py-2.5 rounded-xl bg-gradient-brand text-white font-semibold text-xs flex items-center gap-2 shadow-brand hover:opacity-95 transition shrink-0"
        >
          <span>Find & Assemble Team</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Blueprint Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Core Specs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-surface border border-border/70 shadow-sm space-y-1">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-brand" />
              Target Audience
            </div>
            <p className="text-xs text-foreground font-medium">{project.targetAudience}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface border border-border/70 shadow-sm space-y-1">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-brand-2" />
              Phases & Tasks
            </div>
            <p className="text-xs text-foreground font-medium">
              {phases.length} Major Stages • {phases.reduce((acc, p) => acc + (p?.tasks?.length || 0), 0)} Tasks
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface border border-border/70 shadow-sm space-y-1">
            <div className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-3" />
              Required Roles
            </div>
            <p className="text-xs text-foreground font-medium">{roles.length} Capability Areas</p>
          </div>
        </div>

        {/* Visual Workflow Bar */}
        {(workflowStages.length > 0) && (
          <div className="p-4 rounded-xl bg-surface border border-border/70 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Workflow className="w-3.5 h-3.5 text-brand" />
              How the Work Flows
            </h3>
            <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs font-medium">
              {workflowStages.map((stage, i) => (
                <React.Fragment key={i}>
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-muted/70 border border-border/60 text-foreground whitespace-nowrap shrink-0 shadow-2xs">
                    <span className="w-5 h-5 rounded-full bg-brand-soft text-brand text-[10px] font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span>{stage}</span>
                  </div>
                  {i < workflowStages.length - 1 && (
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* What is Required (Separated from Phases) */}
        {(requirements.length > 0) && (
          <div className="p-4 rounded-xl bg-surface border border-border/70 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ListOrdered className="w-3.5 h-3.5 text-brand" />
              What is Required for this Project ({requirements.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {requirements.map((req, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-surface-muted/40 border border-border/50 flex items-center gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span className="text-foreground font-medium">{req}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Expected Deliverables */}
        <div className="p-4 rounded-xl bg-surface border border-border/70 shadow-sm space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-brand" />
            Key Project Deliverables ({deliverables.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {deliverables.map((del) => (
              <div key={del.id} className="p-2.5 rounded-lg bg-surface-muted/50 border border-border/50 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <h4 className="text-xs font-semibold text-foreground truncate">{del.title}</h4>
                  <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{del.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Parallel Workstreams Highlight */}
        {parallelWorkstreams.length > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-brand-soft/80 to-surface border border-brand/20 space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-brand flex items-center justify-center text-white text-xs font-bold">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <h3 className="text-xs font-bold text-foreground">Parallel Execution Tracks Identified</h3>
            </div>
            {parallelWorkstreams.map((pw) => (
              <div key={pw.id} className="text-xs text-muted-foreground leading-relaxed pl-8">
                <span className="font-semibold text-foreground">{pw.streamName}:</span> {pw.efficiencyNote}
              </div>
            ))}
          </div>
        )}

        {/* Phases & Tasks Decomposition */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-brand" />
              Project Stages & Tasks ({phases.length} Stages)
            </h3>
            <span className="text-[11px] text-muted-foreground">Click stages to expand/collapse</span>
          </div>

          <div className="space-y-3">
            {phases.map((phase) => {
              const isExpanded = !!expandedPhases[phase?.id || ""];
              const phaseTasks = phase?.tasks || [];
              return (
                <div
                  key={phase.id}
                  className="rounded-xl bg-surface border border-border/80 overflow-hidden shadow-sm transition"
                >
                  <button
                    onClick={() => togglePhase(phase.id)}
                    className="w-full px-4 py-3.5 bg-surface hover:bg-surface-muted/60 flex items-center justify-between text-left transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-brand-soft text-brand font-bold text-xs flex items-center justify-center">
                        {phase.order}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">Stage {phase.order}: {phase.name}</h4>
                        <p className="text-[11px] text-muted-foreground">{phase.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-[11px] font-medium hidden sm:inline">
                        {phaseTasks.length} tasks
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-1 border-t border-border/40 space-y-3">
                      {/* Phase Purpose & Why */}
                      {phase.purpose && (
                        <div className="p-2.5 rounded-lg bg-surface-muted/50 border border-border/40 text-[11px] text-muted-foreground">
                          <span className="font-semibold text-foreground">Purpose:</span> {phase.purpose}
                        </div>
                      )}

                      <div className="space-y-2">
                        <div className="text-[11px] font-semibold text-muted-foreground">Work Items:</div>
                        {phaseTasks.map((task) => (
                          <div
                            key={task.id}
                            className="p-3 rounded-lg bg-surface-muted/40 border border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-muted transition"
                          >
                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-foreground">{task.title}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${getPriorityColor(task.priority)}`}>
                                  {task.priority.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-md bg-surface border border-border/60">
                                  {task.estimatedDuration}
                                </span>
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-normal">{task.description}</p>
                              <div className="flex items-center gap-2 pt-1 flex-wrap">
                                <span className="text-[10px] text-brand font-semibold">
                                  Required Role: {task.requiredRole}
                                </span>
                                {(task.dependencies || []).length > 0 && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                                    Prerequisites: {(task.dependencies || []).join(", ")}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                              {(task.requiredSkills || []).slice(0, 2).map((sk, idx) => (
                                <span
                                  key={idx}
                                  className="text-[10px] px-2 py-0.5 rounded bg-surface border border-border/60 text-muted-foreground font-medium"
                                >
                                  {sk}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

