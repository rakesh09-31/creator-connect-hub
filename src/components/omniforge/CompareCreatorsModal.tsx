import React from "react";
import { X, CheckCircle2, ShieldCheck, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { CreatorRecommendation } from "@/lib/omniforge/types";
import { CreatorAvatar } from "./CreatorAvatar";
import { Link } from "@tanstack/react-router";

interface CompareCreatorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  roleName: string;
  currentRecommendation: CreatorRecommendation | null;
  alternatives: CreatorRecommendation[];
  onSelectCandidate: (candidate: CreatorRecommendation) => void;
}

export function CompareCreatorsModal({
  isOpen,
  onClose,
  roleName,
  currentRecommendation,
  alternatives,
  onSelectCandidate,
}: CompareCreatorsModalProps) {
  if (!isOpen) return null;

  const allCandidates = currentRecommendation
    ? [currentRecommendation, ...alternatives.filter((a) => a.creator.id !== currentRecommendation.creator.id)]
    : alternatives;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-up">
      <div className="bg-surface border border-border/80 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border/60 flex items-center justify-between bg-surface/90">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                Comparison Studio
              </span>
              <h3 className="text-base font-bold text-foreground">Compare Creators for {roleName}</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Compare matched candidates based on skills, verified evidence, and portfolio work.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Candidates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCandidates.map((cand, idx) => {
              const isCurrent = currentRecommendation && cand.creator.id === currentRecommendation.creator.id;

              return (
                <div
                  key={cand.id}
                  className={`p-5 rounded-xl border flex flex-col justify-between space-y-4 transition ${
                    isCurrent
                      ? "bg-brand-soft/20 border-brand ring-1 ring-brand"
                      : "bg-surface border-border/70 hover:border-border"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <CreatorAvatar
                          url={cand.creator.avatarUrl}
                          name={cand.creator.fullName || cand.creator.username}
                          size="md"
                          className="ring-1 ring-border/60"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-foreground truncate">
                            {cand.creator.fullName || cand.creator.username}
                          </h4>
                          <span className="text-[11px] text-muted-foreground">@{cand.creator.username}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-bold text-brand">{cand.matchScore}%</span>
                        <span className="text-[9px] text-muted-foreground block uppercase font-medium">Match</span>
                      </div>
                    </div>

                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-brand bg-brand-soft px-2 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3" /> Current Selection
                      </span>
                    )}

                    {cand.creator.bio && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {cand.creator.bio}
                      </p>
                    )}

                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                        Matched Evidence:
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed bg-surface-muted/60 p-2.5 rounded-lg border border-border/40">
                        {cand.matchReason}
                      </p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="text-[10px] font-bold text-foreground uppercase tracking-wider">Top Skills:</div>
                      <div className="flex flex-wrap gap-1">
                        {cand.creator.skills.slice(0, 4).map((sk, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-surface-muted border border-border/60 text-muted-foreground"
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                    <Link
                      to="/user/$username"
                      params={{ username: cand.creator.username }}
                      className="text-xs text-muted-foreground hover:text-foreground font-semibold flex items-center gap-1"
                    >
                      Profile <ExternalLink className="w-3 h-3" />
                    </Link>

                    {!isCurrent && (
                      <button
                        onClick={() => {
                          onSelectCandidate(cand);
                          onClose();
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-semibold hover:opacity-90 transition flex items-center gap-1"
                      >
                        <span>Select Candidate</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
