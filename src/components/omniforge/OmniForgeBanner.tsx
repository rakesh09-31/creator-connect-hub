import React from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, Zap, GitBranch, Users, Lightbulb } from "lucide-react";

interface OmniForgeBannerProps {
  className?: string;
}

export function OmniForgeBanner({ className = "" }: OmniForgeBannerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-surface via-surface/90 to-brand-soft/30 border border-brand/20 p-6 sm:p-8 shadow-sm hover:shadow-brand/20 transition-all duration-300 ${className}`}
    >
      {/* Ambient background glow */}
      <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-brand/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-56 h-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-soft border border-brand/30 text-brand text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 animate-pulse-slow" />
            <span>OMNIFORGE AI ARCHITECT</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight leading-snug">
            Turn Your Idea Into Reality
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Tell us what you want to create. Our AI will transform your idea into an executable project blueprint,
            identify required technical & creative capabilities, and assemble the ideal creator team from the OmniCraft
            network.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-brand" />
              Idea to Blueprint
            </span>
            <span className="flex items-center gap-1.5">
              <GitBranch className="w-3.5 h-3.5 text-brand-2" />
              Task Dependencies
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-brand-3" />
              Real Creator Matching
            </span>
          </div>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            to="/omniforge"
            className="px-6 py-3.5 rounded-2xl bg-gradient-brand text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-brand hover:scale-[1.02] active:scale-[0.98] transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>Build My Idea with AI</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
