import React, { useState } from "react";
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  FileText,
  HelpCircle,
  Target,
  BarChart3,
  Layers,
} from "lucide-react";
import {
  SkillDnaEntry,
  SkillGapItem,
} from "@/lib/omniforge/user-intelligence";

interface SkillGapVisualizerProps {
  skillDna: Record<string, SkillDnaEntry>;
  skillGaps: SkillGapItem[];
  careerGoal: string;
  onUploadResumeClick: () => void;
  onAskWhatToLearnNext: () => void;
}

export function SkillGapVisualizer({
  skillDna,
  skillGaps,
  careerGoal,
  onUploadResumeClick,
  onAskWhatToLearnNext,
}: SkillGapVisualizerProps) {
  const [activeTab, setActiveTab] = useState<"dna" | "gaps">("gaps");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const entries = Object.values(skillDna);

  return (
    <div className="flex flex-col h-full bg-surface/70 backdrop-blur-md rounded-2xl border border-border/70 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-border/60 bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-soft text-brand">
              Competency Intelligence
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-surface-muted text-muted-foreground border border-border/60">
              Target: {careerGoal}
            </span>
          </div>
          <h3 className="text-sm font-bold text-foreground">Verified Skill DNA & Gap Matrix</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab buttons */}
          <div className="flex p-0.5 rounded-xl bg-surface-muted/60 border border-border/60">
            <button
              onClick={() => setActiveTab("gaps")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === "gaps"
                  ? "bg-surface text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Skill Gaps ({skillGaps.length})
            </button>
            <button
              onClick={() => setActiveTab("dna")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                activeTab === "dna"
                  ? "bg-surface text-foreground shadow-xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Skill DNA ({entries.length})
            </button>
          </div>

          <button
            onClick={onUploadResumeClick}
            className="px-2.5 py-1.5 rounded-xl bg-surface hover:bg-surface-muted border border-border text-xs font-semibold text-foreground transition flex items-center gap-1.5 shrink-0"
          >
            <FileText className="w-3.5 h-3.5 text-brand" />
            <span>Upload Resume</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "gaps" ? (
          /* SKILL GAP MATRIX (Section 6 & 12) */
          <div className="space-y-3.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground pb-1">
              <span>Comparing your verified skills with standard requirements for <strong>{careerGoal}</strong>:</span>
              <button
                onClick={onAskWhatToLearnNext}
                className="text-brand font-semibold text-xs hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                What to learn next?
              </button>
            </div>

            <div className="space-y-2.5">
              {skillGaps.map((item) => {
                const isSatisfied = item.status === "SATISFIED";
                return (
                  <div
                    key={item.skill}
                    className={`p-3.5 rounded-xl border transition space-y-2 ${
                      isSatisfied
                        ? "bg-surface border-emerald-500/30"
                        : item.status === "LARGE_GAP"
                        ? "bg-rose-500/5 border-rose-500/30"
                        : "bg-amber-500/5 border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{item.skill}</span>
                        <span
                          className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded-full border ${
                            item.priority === "CRITICAL"
                              ? "bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
                              : item.priority === "HIGH"
                              ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                              : "bg-surface-muted text-muted-foreground border-border/60"
                          }`}
                        >
                          {item.priority}
                        </span>
                      </div>

                      <div className="text-right flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground text-[11px]">
                          Current: <strong className="text-foreground">{item.current}%</strong> / Required: <strong>{item.required}%</strong>
                        </span>
                        {isSatisfied ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Met
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-bold text-xs">
                            Gap: -{item.gap}%
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Visual Comparison Progress Bar */}
                    <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden border border-border/50 relative">
                      {/* Target Indicator */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-foreground/60 z-10"
                        style={{ left: `${item.required}%` }}
                        title={`Target: ${item.required}%`}
                      />
                      {/* Current Progress */}
                      <div
                        className={`h-full transition-all duration-700 ease-out rounded-full ${
                          isSatisfied
                            ? "bg-emerald-500"
                            : item.status === "LARGE_GAP"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${Math.max(item.current, 4)}%` }}
                      />
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {item.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* SKILL DNA VIEW (Section 5) */
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground leading-relaxed pb-1">
              Every percentage is derived from verifiable evidence (projects, resumes, assessments). Scores are never arbitrary:
            </p>

            <div className="grid grid-cols-1 gap-2.5">
              {entries.map((entry) => (
                <div
                  key={entry.skillName}
                  onClick={() => setSelectedSkill(selectedSkill === entry.skillName ? null : entry.skillName)}
                  className="p-3 rounded-xl bg-surface border border-border/80 shadow-xs hover:border-brand/40 transition cursor-pointer space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{entry.skillName}</span>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-brand-soft text-brand">
                        {entry.category}
                      </span>
                      <span
                        className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                          entry.confidence === "HIGH"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                            : "bg-surface-muted text-muted-foreground border-border/60"
                        }`}
                      >
                        {entry.confidence} CONFIDENCE
                      </span>
                    </div>

                    <span className="text-xs font-extrabold text-brand">{entry.proficiency}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-surface-muted rounded-full overflow-hidden border border-border/50">
                    <div
                      className="h-full bg-gradient-brand rounded-full transition-all duration-500"
                      style={{ width: `${entry.proficiency}%` }}
                    />
                  </div>

                  {/* Evidence explanation & Itemized List */}
                  <div className="text-[11px] text-muted-foreground bg-surface-muted/40 p-2.5 rounded-lg border border-border/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-foreground font-semibold">Evidence: </strong>
                        {entry.evidence}
                      </div>
                      {entry.lastVerified && (
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          Verified: {entry.lastVerified}
                        </span>
                      )}
                    </div>

                    {/* Itemized Evidence Entries */}
                    {entry.evidenceList && entry.evidenceList.length > 0 && (
                      <div className="pt-1.5 border-t border-border/40 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                          Verified Artifacts & Projects ({entry.evidenceList.length})
                        </span>
                        <div className="space-y-1">
                          {entry.evidenceList.map((ev) => (
                            <div
                              key={ev.id}
                              className="p-1.5 rounded bg-surface border border-border/50 text-[10px] flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span className="font-semibold text-foreground truncate">{ev.title}</span>
                                <span className="text-muted-foreground truncate hidden sm:inline">
                                  — {ev.description}
                                </span>
                              </div>
                              <div className="shrink-0 flex items-center gap-1.5 text-muted-foreground">
                                {ev.score && (
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    {ev.score}/100
                                  </span>
                                )}
                                <span>{ev.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
