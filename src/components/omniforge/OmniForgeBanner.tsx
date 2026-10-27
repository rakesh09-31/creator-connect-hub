import React from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, ArrowRight, GitBranch, Users, Lightbulb } from "lucide-react";

interface OmniForgeBannerProps {
  className?: string;
}

export function OmniForgeBanner({ className = "" }: OmniForgeBannerProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-surface via-surface/90 to-brand-soft/30 border border-brand/20 p-3.5 sm:p-6 md:p-8 shadow-sm hover:shadow-brand/20 transition-all duration-300 ${className}`}
    >
      {/* Ambient background glow */}
      <div className="absolute -top-12 -right-12 w-48 sm:w-56 h-48 sm:h-56 rounded-full bg-brand/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 sm:w-56 h-48 sm:h-56 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
        <div className="space-y-1.5 sm:space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-brand-soft border border-brand/30 text-brand text-[10px] sm:text-xs font-bold shadow-xs">
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse-slow" />
            <span>OMNIFORGE AI ARCHITECT</span>
          </div>

          <h2 className="text-base sm:text-2xl font-extrabold text-foreground tracking-tight leading-snug">
            <span className="sm:hidden">Build with AI</span>
            <span className="hidden sm:inline">Turn Your Idea Into Reality</span>
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            <span className="sm:hidden">
              Transform ideas into executable project blueprints and assemble creator teams instantly.
            </span>
            <span className="hidden sm:inline">
              Tell us what you want to create. Our AI will transform your idea into an executable project blueprint,
              identify required technical & creative capabilities, and assemble the ideal creator team from the OmniCraft
              network.
            </span>
          </p>

          <div className="hidden sm:flex flex-wrap items-center gap-4 pt-1 text-[11px] font-semibold text-muted-foreground">
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

        <div className="shrink-0 flex items-center">
          <Link
            to="/omniforge"
            className="w-full sm:w-auto px-4 py-2 sm:px-6 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-brand text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-brand hover:scale-[1.02] active:scale-[0.98] transition cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Build with AI</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
