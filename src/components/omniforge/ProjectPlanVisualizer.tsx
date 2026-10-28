import React, { useState } from "react";
import {
  Layers,
  CheckCircle2,
  Clock,
  Users,
  Shield,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Cpu,
  Database,
  Code2,
  Terminal,
  ExternalLink,
  Sparkles,
  ArrowRight,
  GitBranch,
} from "lucide-react";
import {
  DetailedProjectPlan,
  ProjectPlanPhase,
} from "@/lib/omniforge/user-intelligence";

interface ProjectPlanVisualizerProps {
  plan: DetailedProjectPlan;
  onFindTeamMembers?: (role: string) => void;
  onModifyPlan?: () => void;
}

export function ProjectPlanVisualizer({
  plan,
  onFindTeamMembers,
  onModifyPlan,
}: ProjectPlanVisualizerProps) {
  const [expandedPhaseId, setExpandedPhaseId] = useState<string | null>(plan.phases[0]?.id || null);

  const togglePhase = (id: string) => {
    setExpandedPhaseId(expandedPhaseId === id ? null : id);
  };

  return (
    <div className="flex flex-col h-full bg-surface/70 backdrop-blur-md rounded-2xl border border-border/70 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/60 bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-soft text-brand">
              AI Project Architecture
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-surface-muted text-muted-foreground border border-border/60">
              {plan.timeline}
            </span>
          </div>
          <h2 className="text-base font-bold text-foreground tracking-tight">{plan.title}</h2>
        </div>

        <div className="flex items-center gap-2">
          {onModifyPlan && (
            <button
              onClick={onModifyPlan}
              className="px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-muted border border-border text-xs font-semibold text-foreground transition"
            >
              Modify Plan
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Overview & Objectives */}
        <div className="p-4 rounded-xl bg-surface border border-border/70 shadow-xs space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{plan.overview}</p>

          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
              Strategic Objectives
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {plan.objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-foreground bg-surface-muted/30 p-2 rounded-lg border border-border/40">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{obj}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tech Stack Matrix */}
        <div className="p-4 rounded-xl bg-surface border border-border/70 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-brand" />
            Recommended Production Tech Stack
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 rounded-lg bg-surface-muted/40 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Frontend</span>
              <div className="flex flex-wrap gap-1">
                {plan.techStack.frontend.map((t, idx) => (
                  <span key={idx} className="text-[11px] font-semibold text-foreground px-1.5 py-0.5 rounded bg-surface border border-border/60">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-muted/40 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Backend</span>
              <div className="flex flex-wrap gap-1">
                {plan.techStack.backend.map((t, idx) => (
                  <span key={idx} className="text-[11px] font-semibold text-foreground px-1.5 py-0.5 rounded bg-surface border border-border/60">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-muted/40 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Database</span>
              <div className="flex flex-wrap gap-1">
                {plan.techStack.database.map((t, idx) => (
                  <span key={idx} className="text-[11px] font-semibold text-foreground px-1.5 py-0.5 rounded bg-surface border border-border/60">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {plan.techStack.aiFeatures && plan.techStack.aiFeatures.length > 0 && (
              <div className="p-2.5 rounded-lg bg-surface-muted/40 border border-border/40 space-y-1">
                <span className="text-[10px] font-bold text-brand uppercase">AI Features</span>
                <div className="flex flex-wrap gap-1">
                  {plan.techStack.aiFeatures.map((t, idx) => (
                    <span key={idx} className="text-[11px] font-semibold text-brand px-1.5 py-0.5 rounded bg-brand-soft border border-brand/30">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="p-2.5 rounded-lg bg-surface-muted/40 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Security</span>
              <div className="flex flex-wrap gap-1">
                {plan.techStack.security.map((t, idx) => (
                  <span key={idx} className="text-[11px] font-semibold text-foreground px-1.5 py-0.5 rounded bg-surface border border-border/60">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-muted/40 border border-border/40 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">DevOps / Cloud</span>
              <div className="flex flex-wrap gap-1">
                {plan.techStack.devops.map((t, idx) => (
                  <span key={idx} className="text-[11px] font-semibold text-foreground px-1.5 py-0.5 rounded bg-surface border border-border/60">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Phased Breakdown & Task Decomposition (Section 15) */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand" />
            Project Phases & Task Decomposition ({plan.phases.length} Phases)
          </h3>

          <div className="space-y-2.5">
            {plan.phases.map((phase, pIdx) => {
              const isExpanded = phase.id === expandedPhaseId;
              return (
                <div key={phase.id} className="rounded-xl bg-surface border border-border/80 overflow-hidden shadow-xs">
                  <div
                    onClick={() => togglePhase(phase.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-surface-muted/40 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-lg bg-brand-soft text-brand font-bold text-xs flex items-center justify-center">
                        {pIdx + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{phase.name}</h4>
                        <span className="text-[10px] text-muted-foreground">{phase.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {phase.modules.reduce((acc, m) => acc + m.tasks.length, 0)} Tasks
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 pt-0 border-t border-border/50 space-y-3 bg-surface-muted/15">
                      {phase.modules.map((mod) => (
                        <div key={mod.id} className="p-3 rounded-lg bg-surface border border-border/60 space-y-2 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{mod.name}</span>
                            <div className="flex gap-1">
                              {mod.features.map((f, i) => (
                                <span key={i} className="text-[9px] px-1.5 py-0.2 rounded bg-surface-muted text-muted-foreground border border-border/50">
                                  {f}
                                </span>
                              ))}
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground">{mod.description}</p>

                          {/* Task Breakdown */}
                          <div className="space-y-2 pt-1">
                            {mod.tasks.map((task) => (
                              <div key={task.id} className="p-2.5 rounded bg-surface-muted/30 border border-border/40 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-semibold text-foreground">{task.title}</span>
                                  <span className="text-[10px] font-bold text-brand">{task.requiredRole}</span>
                                </div>
                                <p className="text-[11px] text-muted-foreground">{task.description}</p>

                                {/* Subtasks list */}
                                {task.subtasks && task.subtasks.length > 0 && (
                                  <div className="space-y-1 pt-1 border-t border-border/30">
                                    <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">
                                      Subtasks ({task.subtasks.length}):
                                    </span>
                                    {task.subtasks.map((st) => (
                                      <div key={st.id} className="flex items-center justify-between text-[11px] text-muted-foreground pl-2">
                                        <span>• {st.title}</span>
                                        <span className="text-[10px] font-mono">{st.estimatedHours}h</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Team Requirements & Matching */}
        <div className="p-4 rounded-xl bg-surface border border-border/70 shadow-xs space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-brand" />
            Required Production Squad ({plan.teamRequirements.length} Roles)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {plan.teamRequirements.map((tr, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-surface-muted/30 border border-border/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{tr.role}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-brand-soft text-brand">
                    {tr.count} Member{tr.count > 1 ? "s" : ""}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{tr.responsibilities}</p>
                {onFindTeamMembers && (
                  <button
                    onClick={() => onFindTeamMembers(tr.role)}
                    className="text-[11px] font-semibold text-brand hover:underline flex items-center gap-1 pt-1"
                  >
                    Find {tr.role}s in Directory <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Risks & Mitigations */}
        <div className="p-4 rounded-xl bg-surface border border-border/70 shadow-xs space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Risks & Mitigations
          </h3>

          <div className="space-y-2">
            {plan.risksAndMitigations.map((rm, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-surface-muted/30 border border-border/40 text-xs space-y-1">
                <div className="font-semibold text-rose-600 dark:text-rose-400">⚠️ Risk: {rm.risk}</div>
                <div className="text-muted-foreground">🛡️ Mitigation: {rm.mitigation}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
