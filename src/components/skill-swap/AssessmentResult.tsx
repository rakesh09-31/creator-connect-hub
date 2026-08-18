/**
 * OmniCraft – Assessment Result (Step 4)
 *
 * Full verification report showing:
 * - Declared vs Demonstrated level comparison
 * - Stage 2 + Stage 3 breakdown
 * - Competency scores with progress bars
 * - Verification confidence
 * - Strengths, Weaknesses, Recommendations
 * - Stage comparison analysis
 */

import { Sparkles, ShieldCheck, AlertCircle, TrendingUp, TrendingDown, Minus, Save, Check } from "lucide-react";
import { CreatorSkillProfile } from "@/lib/assessment-engine";
import type { AIResult } from "./AIVoiceVerification";
import type { MockResult } from "./MockAssessment";

type Props = {
  profile: CreatorSkillProfile;
  voiceResult: AIResult | null;
  mockResult: MockResult | null;
  busy: boolean;
  onBack: () => void;
  onPublish: () => void;
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-emerald-600 bg-emerald-500/10 border-emerald-500/30",
  medium: "text-amber-600 bg-amber-500/10 border-amber-500/30",
  low: "text-orange-600 bg-orange-500/10 border-orange-500/30",
  insufficient: "text-rose-600 bg-rose-500/10 border-rose-500/30",
};

const LEVEL_ORDER = ["Beginner", "Intermediate", "Advanced", "Expert"];

function getLevelComparison(declared: string, demonstrated: string) {
  const di = LEVEL_ORDER.indexOf(declared);
  const demi = LEVEL_ORDER.indexOf(demonstrated);
  if (di === demi) return "match";
  if (demi > di) return "above";
  return "below";
}

export default function AssessmentResult({ profile, voiceResult, mockResult, busy, onBack, onPublish }: Props) {
  const demonstratedLevel = mockResult?.demonstrated_level || voiceResult?.verified_level || profile.declaredLevel;
  const overallScore = mockResult?.overall_score ?? voiceResult?.overall_score ?? 0;
  const stage2Score = voiceResult?.overall_score ?? 0;
  const stage3Score = mockResult?.stage_score?.overall ?? 0;
  const confidence = mockResult?.verification_confidence ?? "low";
  const strengths = mockResult?.strengths ?? (voiceResult?.strengths ? [voiceResult.strengths] : []);
  const weaknesses = mockResult?.weaknesses ?? (voiceResult?.weaknesses ? [voiceResult.weaknesses] : []);
  const recommendations = mockResult?.recommendations ?? [];
  const comparison = getLevelComparison(profile.declaredLevel, demonstratedLevel);

  const scenarioScore = mockResult?.scenario_score ?? voiceResult?.problem_solving_score ?? 0;
  const softwareScore = mockResult?.software_score ?? voiceResult?.technical_score ?? 0;
  const practicalScore = mockResult?.practical_score ?? voiceResult?.practical_score ?? 0;
  const knowledgeScore = mockResult?.knowledge_score ?? mockResult?.theory_score ?? voiceResult?.knowledge_score ?? 0;
  const technicalScore = mockResult?.technical_score ?? voiceResult?.technical_score ?? 0;
  const troubleshootingScore = mockResult?.troubleshooting_score ?? 0;
  const decisionMakingScore = mockResult?.decision_making_score ?? 0;
  const communicationScore = mockResult?.communication_score ?? (voiceResult ? Math.min(100, voiceResult.overall_score + 5) : 0);

  const verificationStatus =
    confidence === "insufficient" ? "insufficient_evidence" :
    overallScore >= 65 ? "verified" :
    overallScore >= 45 ? "partially_verified" :
    "not_verified";

  const CompetencyBar = ({ label, score }: { label: string; score: number }) => (
    <div>
      <div className="flex justify-between text-xs text-foreground/80 mb-1">
        <span>{label}</span>
        <span className="font-bold">{score}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${
            score >= 70 ? "bg-emerald-500" : score >= 45 ? "bg-amber-500" : "bg-rose-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* ── HEADER ── */}
      <div className="text-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 border ${
          verificationStatus === "verified"
            ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30"
            : verificationStatus === "partially_verified"
            ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
            : "bg-muted text-muted-foreground border-border"
        }`}>
          <ShieldCheck className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold tracking-tight">
          {verificationStatus === "verified" ? "AI Verified" :
           verificationStatus === "partially_verified" ? "Partially Verified" :
           verificationStatus === "insufficient_evidence" ? "Insufficient Evidence" :
           "Not Verified"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">{profile.primarySkill} · {profile.role}</p>
      </div>

      {/* ── DECLARED vs DEMONSTRATED ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface border border-border rounded-xl p-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Declared</p>
          <p className="text-xl font-black">{profile.declaredLevel}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Self-assessed</p>
        </div>
        <div className={`rounded-xl p-4 text-center border ${
          comparison === "match" ? "bg-emerald-500/10 border-emerald-500/30" :
          comparison === "above" ? "bg-blue-500/10 border-blue-500/30" :
          "bg-rose-500/10 border-rose-500/30"
        }`}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Demonstrated</p>
          <p className={`text-xl font-black ${
            comparison === "match" ? "text-emerald-600" :
            comparison === "above" ? "text-blue-600" :
            "text-rose-600"
          }`}>{demonstratedLevel}</p>
          <div className="flex items-center justify-center gap-1 mt-1">
            {comparison === "match" && <Check className="w-3 h-3 text-emerald-600" />}
            {comparison === "above" && <TrendingUp className="w-3 h-3 text-blue-600" />}
            {comparison === "below" && <TrendingDown className="w-3 h-3 text-rose-600" />}
            <p className="text-[10px] font-semibold text-foreground/80">
              {comparison === "match" ? "✓ Level Consistent" :
               comparison === "above" ? "✓ Performance exceeds declared level" :
               "⚠ Skill level appears lower than declared"}
            </p>
          </div>
        </div>
      </div>

      {/* ── OVERALL SCORE ── */}
      <div className="bg-brand-soft/20 border border-brand/20 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-brand flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-end gap-2">
              <p className="text-4xl font-black">{overallScore}%</p>
              <p className="text-sm text-muted-foreground pb-1">overall composite score</p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  overallScore >= 70 ? "bg-emerald-500" : overallScore >= 45 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${overallScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── STAGE BREAKDOWN ── */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Stage Breakdown</p>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Stage 2 – Voice Exam</p>
            <p className="text-2xl font-black">{stage2Score}%</p>
            <p className="text-[10px] text-muted-foreground">Technical Interview (40%)</p>
          </div>
          <div className="bg-surface border border-border rounded-xl p-3 text-center">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Stage 3 – Mock Tasks</p>
            <p className="text-2xl font-black">{stage3Score}%</p>
            <p className="text-[10px] text-muted-foreground">Practical Exam (60%)</p>
          </div>
        </div>
      </div>

      {/* ── COMPETENCY BREAKDOWN ── */}
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">8-Dimension Competency Scores</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
          <CompetencyBar label="Theory & Fundamentals (20%)" score={knowledgeScore} />
          <CompetencyBar label="Technical Knowledge (20%)" score={technicalScore} />
          <CompetencyBar label="Scenario Reasoning (20%)" score={scenarioScore} />
          <CompetencyBar label="Practical Execution (20%)" score={practicalScore} />
          <CompetencyBar label="Software & Tools (10%)" score={softwareScore} />
          <CompetencyBar label="Troubleshooting (10%)" score={troubleshootingScore} />
          {decisionMakingScore > 0 && <CompetencyBar label="Decision Making" score={decisionMakingScore} />}
          {communicationScore > 0 && <CompetencyBar label="Communication & Voice" score={communicationScore} />}
        </div>
      </div>

      {/* ── VERIFICATION CONFIDENCE ── */}
      <div className={`rounded-xl p-3 border text-center ${CONFIDENCE_COLORS[confidence]}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest mb-1">Verification Confidence</p>
        <p className="text-lg font-black capitalize">{confidence}</p>
        <p className="text-[10px] mt-0.5 opacity-80">
          {confidence === "high" ? "Strong evidence across all competency areas" :
           confidence === "medium" ? "Reasonable evidence — some areas less tested" :
           confidence === "low" ? "Limited evidence — more assessment recommended" :
           "Insufficient evidence to assign a reliable level"}
        </p>
      </div>

      {/* ── STRENGTHS ── */}
      {strengths.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700">Strengths</p>
          <ul className="space-y-1">
            {strengths.map((s, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                <span className="text-emerald-500 mt-0.5 flex-shrink-0">✓</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── WEAKNESSES ── */}
      {weaknesses.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-700">Areas to Improve</p>
          <ul className="space-y-1">
            {weaknesses.map((w, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                <span className="text-amber-500 mt-0.5 flex-shrink-0">→</span>
                {w}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── RECOMMENDATIONS ── */}
      {recommendations.length > 0 && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Recommended Learning</p>
          <ul className="space-y-1">
            {recommendations.map((r, i) => (
              <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
                <span className="text-brand mt-0.5 flex-shrink-0">📚</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── LEVEL PATH ── */}
      {demonstratedLevel !== "Expert" && (
        <div className="bg-surface border border-border rounded-xl p-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next Level Path</p>
          <p className="text-xs text-foreground/80">
            Current demonstrated: <strong>{demonstratedLevel}</strong> · Next target: <strong>{LEVEL_ORDER[LEVEL_ORDER.indexOf(demonstratedLevel) + 1] || "Expert"}</strong>
          </p>
          <div className="flex items-center gap-1">
            {LEVEL_ORDER.map((l, i) => (
              <div key={l} className="flex items-center gap-1">
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  l === demonstratedLevel ? "bg-primary text-primary-foreground" :
                  LEVEL_ORDER.indexOf(l) < LEVEL_ORDER.indexOf(demonstratedLevel) ? "bg-emerald-500 text-white" :
                  "bg-muted text-muted-foreground"
                }`}>{l}</div>
                {i < LEVEL_ORDER.length - 1 && <div className="w-3 h-0.5 bg-border" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PUBLIC VISIBILITY NOTE ── */}
      <div className="flex items-start gap-2 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-amber-700 text-xs">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          Your <strong>scores and verified level</strong> will be visible on your public listing. 
          <strong> Individual questions and answers remain private.</strong>
        </p>
      </div>

      {/* ── ACTIONS ── */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-3 bg-muted text-foreground/80 rounded-xl font-semibold text-sm hover:bg-muted-foreground/20"
        >
          Edit Details
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onPublish}
          className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {busy ? "Publishing..." : "Publish Skill Swap"}
        </button>
      </div>
    </div>
  );
}
