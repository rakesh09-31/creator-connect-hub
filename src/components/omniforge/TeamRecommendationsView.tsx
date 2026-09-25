import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Eye,
  ArrowRight,
  Briefcase,
  Layers,
  Sparkles,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Plus,
  ArrowLeftRight,
  Check,
} from "lucide-react";
import {
  OmniForgeProject,
  CreatorRecommendation,
  MissingCapability,
} from "@/lib/omniforge/types";
import { CreatorAvatar } from "./CreatorAvatar";

interface TeamRecommendationsViewProps {
  project: OmniForgeProject;
  onInviteCreator: (recId: string) => void;
  onReplaceCreator: (roleId: string) => void;
  onCompareCandidates: (roleId: string) => void;
  onLaunchSquad: () => void;
  onBackToBlueprint: () => void;
  isConvertingSquad: boolean;
}

export function TeamRecommendationsView({
  project,
  onInviteCreator,
  onReplaceCreator,
  onCompareCandidates,
  onLaunchSquad,
  onBackToBlueprint,
  isConvertingSquad,
}: TeamRecommendationsViewProps) {
  const coverage = project.coverage;
  const recommendations = project.recommendations;
  const missingCaps = coverage.missingCapabilities;

  const [invitedMap, setInvitedMap] = useState<Record<string, boolean>>({});

  const handleInvite = (recId: string) => {
    setInvitedMap((prev) => ({ ...prev, [recId]: true }));
    onInviteCreator(recId);
  };

  return (
    <div className="flex flex-col h-full bg-surface/60 backdrop-blur-md rounded-2xl border border-border/70 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/60 bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-brand-soft text-brand">
              Team Orchestration
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-surface-muted text-muted-foreground border border-border/60">
              {coverage.totalCovered} of {coverage.totalRequired} Roles Discovered
            </span>
          </div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Recommended Project Team</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Verified creators matched against required project capabilities with verifiable portfolio proof.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onBackToBlueprint}
            className="px-3 py-2 rounded-xl bg-surface hover:bg-surface-muted border border-border text-xs font-semibold text-foreground transition"
          >
            Review Blueprint
          </button>
          <button
            onClick={onLaunchSquad}
            disabled={isConvertingSquad || recommendations.length === 0}
            className="px-4 py-2 rounded-xl bg-gradient-brand text-white font-semibold text-xs flex items-center gap-2 shadow-brand hover:opacity-95 transition disabled:opacity-50"
          >
            {isConvertingSquad ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Creating Squad...</span>
              </>
            ) : (
              <>
                <Users className="w-3.5 h-3.5" />
                <span>Create Squad & Workspace</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Capability Coverage Card */}
        <div className="p-5 rounded-2xl bg-surface border border-border/70 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-bold text-foreground">Project Capability Coverage</h3>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {coverage.totalCovered} of {coverage.totalRequired} capabilities matched with real OmniCraft creators.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-brand tracking-tight">{coverage.percentage}%</span>
              <span className="text-xs text-muted-foreground block">Coverage Score</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2.5 bg-surface-muted rounded-full overflow-hidden border border-border/60">
            <div
              className="h-full bg-gradient-brand transition-all duration-700 ease-out rounded-full"
              style={{ width: `${Math.max(coverage.percentage, 5)}%` }}
            />
          </div>

          {/* Covered vs Missing tags */}
          <div className="flex flex-wrap gap-2 pt-1">
            {coverage.coveredCapabilities.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 border border-success/20 text-success text-[11px] font-medium"
              >
                <Check className="w-3 h-3" />
                <span>
                  {item.name} <strong className="font-semibold text-foreground">({item.coveredBy})</strong>
                </span>
              </span>
            ))}
            {missingCaps.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[11px] font-medium"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>{item.roleName} (Missing)</span>
              </span>
            ))}
          </div>
        </div>

        {/* Recommended Creator Cards */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand" />
            Matched Candidates ({recommendations.length})
          </h3>

          <div className="grid grid-cols-1 gap-3.5">
            {recommendations.map((rec) => {
              const isInvited = !!invitedMap[rec.id] || rec.status === "invited";
              const hasAlternatives =
                project.alternativeCandidates && (project.alternativeCandidates[rec.roleId]?.length ?? 0) > 0;

              return (
                <div
                  key={rec.id}
                  className="p-5 rounded-2xl bg-surface border border-border/80 shadow-sm hover:border-brand/40 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    {/* Creator Profile Row */}
                    <div className="flex items-start gap-3.5 min-w-0">
                      <CreatorAvatar
                        url={rec.creator.avatarUrl}
                        name={rec.creator.fullName || rec.creator.username}
                        size="lg"
                        className="ring-2 ring-border/60 shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-foreground truncate">
                            {rec.creator.fullName || rec.creator.username}
                          </h4>
                          <span className="text-xs text-muted-foreground">@{rec.creator.username}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                            Role: {rec.roleName}
                          </span>
                        </div>
                        {rec.creator.bio && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{rec.creator.bio}</p>
                        )}
                        <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                          {rec.creator.skills.slice(0, 3).map((sk, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-surface-muted border border-border/60 text-muted-foreground font-medium"
                            >
                              {sk}
                            </span>
                          ))}
                          {rec.creator.portfolioItemsCount > 0 && (
                            <span className="text-[10px] text-brand font-medium">
                              • {rec.creator.portfolioItemsCount} Portfolio piece(s)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0">
                      <div className="px-3 py-1.5 rounded-xl bg-gradient-brand text-white text-xs font-bold shadow-brand">
                        {rec.matchScore}% Match
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium capitalize">
                        {rec.tier} Match Tier
                      </span>
                    </div>
                  </div>

                  {/* Why this creator? Justification Card */}
                  <div className="p-3.5 rounded-xl bg-surface-muted/50 border border-border/60 space-y-1">
                    <div className="text-[11px] font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-brand" />
                      Why this creator was selected:
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{rec.matchReason}</p>
                  </div>

                  {/* Candidate Actions */}
                  <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Link
                        to="/user/$username"
                        params={{ username: rec.creator.username }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-muted border border-border text-foreground font-semibold flex items-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Profile</span>
                      </Link>

                      {hasAlternatives && (
                        <button
                          onClick={() => onCompareCandidates(rec.roleId)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-muted border border-border text-foreground font-semibold flex items-center gap-1.5 transition"
                        >
                          <ArrowLeftRight className="w-3.5 h-3.5" />
                          <span>Compare Alternatives</span>
                        </button>
                      )}

                      <button
                        onClick={() => onReplaceCreator(rec.roleId)}
                        className="text-xs px-2.5 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition"
                      >
                        Replace
                      </button>
                    </div>

                    <button
                      onClick={() => handleInvite(rec.id)}
                      disabled={isInvited}
                      className={`text-xs px-4 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 transition ${
                        isInvited
                          ? "bg-success/15 text-success border border-success/30 cursor-default"
                          : "bg-primary text-primary-foreground hover:opacity-90 shadow-sm"
                      }`}
                    >
                      {isInvited ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Invited</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Invite to Squad</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Missing Capabilities Section (Strict Non-Fabrication) */}
        {missingCaps.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Missing Capabilities Detected ({missingCaps.length})
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">
              OmniCraft does not fabricate fake creators. We detected required roles that currently have no suitable match in
              the network:
            </p>

            <div className="grid grid-cols-1 gap-3">
              {missingCaps.map((item) => (
                <div
                  key={item.roleId}
                  className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-foreground">Role: {item.roleName}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold">
                          Unfilled Slot
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{item.reason}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {item.suggestedActions.map((act, i) => (
                      <Link
                        key={i}
                        to={act.type === "create_job" ? "/jobs" : "/explore"}
                        className="text-xs px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-muted border border-border text-foreground font-semibold flex items-center gap-1.5 transition"
                      >
                        <Plus className="w-3 h-3 text-brand" />
                        <span>{act.label}</span>
                      </Link>
                    ))}
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
