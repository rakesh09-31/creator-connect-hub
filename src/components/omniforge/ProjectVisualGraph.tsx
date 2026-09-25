import React from "react";
import {
  Lightbulb,
  Layers,
  Zap,
  CheckCircle2,
  Users,
  Trophy,
  ArrowRight,
  GitBranch,
  Clock,
  Sparkles,
} from "lucide-react";
import { OmniForgeProject } from "@/lib/omniforge/types";

interface ProjectVisualGraphProps {
  project: OmniForgeProject;
}

export function ProjectVisualGraph({ project }: ProjectVisualGraphProps) {
  return (
    <div className="p-6 rounded-2xl bg-surface border border-border/80 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-brand" />
            End-to-End Visual Execution Pipeline
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Hierarchical flow from initial concept to tasks, talent roles, and final verified delivery.
          </p>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-brand-soft text-brand">
          Dynamic Graph
        </span>
      </div>

      {/* Main Visual Steps */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {/* Step 1: Idea */}
        <div className="p-4 rounded-xl bg-surface-muted/60 border border-border/70 flex flex-col justify-between space-y-2 relative group hover:border-brand/50 transition">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Step 1</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Idea & Domain</h4>
            <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{project.domain}</p>
          </div>
          <div className="text-[10px] text-brand font-semibold">{project.complexity} Scope</div>
        </div>

        {/* Step 2: Phases */}
        <div className="p-4 rounded-xl bg-surface-muted/60 border border-border/70 flex flex-col justify-between space-y-2 relative group hover:border-brand/50 transition">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Step 2</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Phases</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">{project.phases.length} Execution Phases</p>
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
            {project.estimatedTotalDuration}
          </div>
        </div>

        {/* Step 3: Tasks & Parallel Tracks */}
        <div className="p-4 rounded-xl bg-surface-muted/60 border border-border/70 flex flex-col justify-between space-y-2 relative group hover:border-brand/50 transition">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Step 3</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Tasks & Tracks</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {(project.phases || []).reduce((acc, p) => acc + (p.tasks || []).length, 0)} Tasks
            </p>
          </div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
            {(project.parallelWorkstreams || []).length} Parallel Workstreams
          </div>
        </div>

        {/* Step 4: Creators & Squad */}
        <div className="p-4 rounded-xl bg-surface-muted/60 border border-border/70 flex flex-col justify-between space-y-2 relative group hover:border-brand/50 transition">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Step 4</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Creator Team</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">{(project.roles || []).length} Specialized Roles</p>
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
            {project.coverage?.percentage || 0}% Coverage
          </div>
        </div>

        {/* Step 5: Final Deliverable */}
        <div className="p-4 rounded-xl bg-surface-muted/60 border border-border/70 flex flex-col justify-between space-y-2 relative group hover:border-brand/50 transition">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 rounded-lg bg-success/15 text-success flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">Step 5</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-foreground">Final Deliverable</h4>
            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
              {(project.deliverables || [])[0]?.title || "Project Release"}
            </p>
          </div>
          <div className="text-[10px] text-success font-semibold">Release Ready</div>
        </div>
      </div>

      {/* Phase-by-Phase Interactive Dependency Track */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Phased Dependency Timeline
        </h4>
        <div className="space-y-2">
          {(project.phases || []).map((ph, idx) => (
            <div
              key={ph.id}
              className="p-3.5 rounded-xl bg-surface-muted/40 border border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-md bg-brand-soft text-brand font-bold text-xs flex items-center justify-center shrink-0">
                  P{idx + 1}
                </div>
                <div>
                  <h5 className="text-xs font-bold text-foreground">{ph.name}</h5>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5 flex-wrap">
                    {(ph.tasks || []).map((t) => (
                      <span key={t.id} className="px-2 py-0.5 rounded bg-surface border border-border/60">
                        {t.title}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0 font-medium">
                <Clock className="w-3.5 h-3.5 text-brand" />
                <span>{(ph.tasks || []).length} tasks</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
