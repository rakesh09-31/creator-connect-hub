/**
 * OmniCraft – Mock Assessment (Stage 3)
 *
 * Multi-format technical assessment:
 * - Formats: Multiple Choice, True/False, Fill in the Blank, Matching, Short Answer, Scenario, Practical Reasoning
 * - Plausible professional distractors for MCQs
 * - Strict concept matching and realistic client constraint scenarios
 */

import { useState } from "react";
import { ChevronRight, RefreshCcw, CheckCircle, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { CreatorSkillProfile, scoreAnswer, scoreMatchingAnswer, calculateStageScore, StageScore, AnswerRecord } from "@/lib/assessment-engine";
import { generateTechnicalQuestionsForProfile, BankQuestion } from "@/lib/question-bank";
import type { AIResult } from "./AIVoiceVerification";

export type MockResult = {
  overall_score: number;
  theory_score: number;
  technical_score: number;
  scenario_score: number;
  practical_score: number;
  software_score: number;
  troubleshooting_score: number;
  decision_making_score: number;
  communication_score: number;
  knowledge_score: number;
  demonstrated_level: string;
  verification_confidence: "high" | "medium" | "low" | "insufficient";
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  stage_score: StageScore;
};

type Props = {
  profile: CreatorSkillProfile;
  stage2Result: AIResult | null;
  onComplete: (result: MockResult) => void;
  onCancel: () => void;
};

type MockStep = "intro" | "quiz" | "evaluating" | "result";

export default function MockAssessment({ profile, stage2Result, onComplete, onCancel }: Props) {
  const [mockStep, setMockStep] = useState<MockStep>("intro");
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [matchingSelections, setMatchingSelections] = useState<Record<string, string>>({});
  const [evalProgress, setEvalProgress] = useState(0);
  const [stageScore, setStageScore] = useState<StageScore | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAnswerRecord, setLastAnswerRecord] = useState<AnswerRecord | null>(null);

  const startAssessment = () => {
    const generated = generateTechnicalQuestionsForProfile(
      profile.role,
      profile.primarySkill,
      profile.subSkills,
      profile.software,
      profile.specialties,
      profile.declaredLevel,
      6
    );
    setQuestions(generated);
    setMockStep("quiz");
    setCurrentIdx(0);
    setAnswers([]);
    setCurrentAnswer("");
    setMatchingSelections({});
  };

  const submitAnswer = () => {
    const q = questions[currentIdx];
    if (!q) return;

    let record: AnswerRecord;
    if (q.type === "matching") {
      record = scoreMatchingAnswer(q, matchingSelections);
    } else {
      record = scoreAnswer(q, currentAnswer || "");
    }

    setLastAnswerRecord(record);
    setShowFeedback(true);

    const newAnswers = [...answers, record];
    setAnswers(newAnswers);

    // Auto-advance for objective types after brief feedback preview
    if (["multiple_choice", "true_false", "fill_blank"].includes(q.type)) {
      setTimeout(() => {
        advanceQuestion(newAnswers);
      }, 1400);
    }
  };

  const advanceQuestion = (currentAnswers: AnswerRecord[]) => {
    setCurrentAnswer("");
    setMatchingSelections({});
    setShowFeedback(false);
    setLastAnswerRecord(null);

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setMockStep("evaluating");
      simulateEvaluation(currentAnswers);
    }
  };

  const skipQuestion = () => {
    const q = questions[currentIdx];
    if (!q) return;
    const record = scoreAnswer(q, "I don't know");
    const newAnswers = [...answers, record];
    setAnswers(newAnswers);
    advanceQuestion(newAnswers);
  };

  const simulateEvaluation = (finalAnswers: AnswerRecord[]) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 8;
      setEvalProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        const score = calculateStageScore(finalAnswers, 3);
        setStageScore(score);
        setMockStep("result");
      }
    }, 100);
  };

  const finishMock = () => {
    if (!stageScore) return;

    const overall = stageScore.overall;
    const demonstrated_level =
      overall >= 88 ? "Expert" :
      overall >= 72 ? "Advanced" :
      overall >= 50 ? "Intermediate" :
      "Beginner";

    const combinedOverall = stage2Result
      ? Math.round(stage2Result.overall_score * 0.4 + overall * 0.6)
      : overall;

    const totalAnswered = (stage2Result ? 6 : 0) + stageScore.questions_answered;
    let confidence: MockResult["verification_confidence"] = "insufficient";
    if (totalAnswered < 4) confidence = "insufficient";
    else if (totalAnswered < 8) confidence = "low";
    else if (totalAnswered < 12) confidence = "medium";
    else confidence = "high";

    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];

    for (const [comp, score] of Object.entries(stageScore.by_competency)) {
      const label = comp.replace(/_/g, " ");
      if (score >= 70) strengths.push(`Strong ${label}`);
      else if (score < 45) {
        weaknesses.push(`Needs review of ${label}`);
        recommendations.push(`Deepen practice in ${label}`);
      }
    }

    if (strengths.length === 0) strengths.push(`Completed ${profile.primarySkill} technical mock assessment.`);
    if (weaknesses.length === 0) weaknesses.push("Continue practicing high-complexity scenarios.");
    if (recommendations.length === 0) recommendations.push(`Explore advanced masterclasses in ${profile.primarySkill}.`);

    onComplete({
      overall_score: combinedOverall,
      theory_score: stageScore.by_competency["theory"] || 0,
      technical_score: stageScore.by_competency["technical_skill"] || 0,
      scenario_score: stageScore.by_competency["scenario_reasoning"] || 0,
      practical_score: stageScore.by_competency["practical_execution"] || 0,
      software_score: stageScore.by_competency["software_knowledge"] || 0,
      troubleshooting_score: stageScore.by_competency["troubleshooting"] || 0,
      decision_making_score: stageScore.by_competency["decision_making"] || 0,
      communication_score: stage2Result ? Math.min(100, stage2Result.overall_score + 5) : 0,
      knowledge_score: stageScore.by_competency["theory"] || 0,
      demonstrated_level,
      verification_confidence: confidence,
      strengths,
      weaknesses,
      recommendations,
      stage_score: stageScore,
    });
  };

  const currentQuestion = questions[currentIdx];
  const progress = questions.length > 0 ? Math.round((currentIdx / questions.length) * 100) : 0;

  return (
    <div className="space-y-5 py-2">
      {/* ── INTRO ── */}
      {mockStep === "intro" && (
        <div className="text-center space-y-5">
          <div className="w-16 h-16 bg-brand-soft rounded-full flex items-center justify-center mx-auto">
            <span className="text-2xl font-black text-brand">3</span>
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Stage 3: Interactive Mock Assessment</h3>
            <p className="text-sm text-muted-foreground mt-2 px-4 leading-relaxed">
              Multi-format written examination for <strong>{profile.primarySkill}</strong>. Includes technical MCQs, fill-in-blanks, matching, and real client scenario problems.
            </p>
          </div>

          {stage2Result && (
            <div className="bg-surface border border-border rounded-xl p-4 text-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Stage 2 Technical Exam Result</p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-3xl font-black">{stage2Result.overall_score}%</p>
                <p className="text-xs text-muted-foreground text-left">
                  Stage 3 (60% weight) will be combined with Stage 2 (40% weight) to calculate your final demonstrated level.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-muted text-foreground/80">
              Back
            </button>
            <button onClick={startAssessment} className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground">
              Begin Stage 3 Exam
            </button>
          </div>
        </div>
      )}

      {/* ── QUIZ ── */}
      {mockStep === "quiz" && currentQuestion && (
        <div className="space-y-4">
          {/* Progress header */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span className="capitalize">{currentQuestion.competency.replace(/_/g, " ")}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-brand h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Badges */}
          <div className="flex gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-soft text-brand border border-brand/20">
              {currentQuestion.type.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border capitalize">
              {currentQuestion.difficulty}
            </span>
          </div>

          {/* Question Text */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <p className="text-foreground/90 text-sm font-medium leading-relaxed">{currentQuestion.question}</p>
          </div>

          {/* Multiple Choice */}
          {currentQuestion.type === "multiple_choice" && currentQuestion.options && !showFeedback && (
            <div className="space-y-2">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentAnswer(opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border font-medium transition-all ${
                    currentAnswer === opt
                      ? "bg-primary/10 border-primary text-primary font-bold"
                      : "bg-background border-border text-foreground/80 hover:border-primary/40"
                  }`}
                >
                  <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* MCQ Feedback */}
          {currentQuestion.type === "multiple_choice" && showFeedback && lastAnswerRecord && (
            <div className={`rounded-xl p-4 border ${
              lastAnswerRecord.is_correct
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                : "bg-rose-500/10 border-rose-500/30 text-rose-700"
            }`}>
              <p className="font-bold text-sm">
                {lastAnswerRecord.is_correct ? "✓ Correct Technical Concept" : "✗ Incorrect"}
              </p>
              {!lastAnswerRecord.is_correct && (
                <p className="text-xs mt-1 opacity-80">Correct answer: {currentQuestion.correctAnswer}</p>
              )}
            </div>
          )}

          {/* True / False */}
          {currentQuestion.type === "true_false" && !showFeedback && (
            <div className="flex gap-3">
              {["True", "False"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCurrentAnswer(v)}
                  className={`flex-1 py-4 rounded-xl font-bold text-sm border transition-all ${
                    currentAnswer === v
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-background border-border text-foreground/80 hover:border-primary/40"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          )}

          {/* Fill in the Blank */}
          {currentQuestion.type === "fill_blank" && (
            <div className="space-y-3">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && currentAnswer.trim() && submitAnswer()}
                placeholder="Type the exact technical term or ratio..."
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              {showFeedback && lastAnswerRecord && (
                <div className={`rounded-xl p-3 border text-xs font-semibold ${
                  lastAnswerRecord.is_correct
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-700"
                }`}>
                  {lastAnswerRecord.is_correct ? "✓ Correct!" : `✗ Standard technical term: ${currentQuestion.correctAnswer}`}
                </div>
              )}
            </div>
          )}

          {/* Matching */}
          {currentQuestion.type === "matching" && currentQuestion.matchingPairs && (
            <div className="space-y-2">
              {currentQuestion.matchingPairs.map((pair) => (
                <div key={pair.left} className="flex items-center gap-2">
                  <div className="flex-1 bg-surface border border-border rounded-lg px-3 py-2 text-xs font-semibold">
                    {pair.left}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <select
                    value={matchingSelections[pair.left] || ""}
                    onChange={(e) => setMatchingSelections({ ...matchingSelections, [pair.left]: e.target.value })}
                    className="flex-1 bg-background border border-border rounded-lg px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
                  >
                    <option value="">Select matching function...</option>
                    {currentQuestion.matchingPairs!.map((p) => (
                      <option key={p.right} value={p.right}>{p.right}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Short Answer / Scenario / Practical */}
          {["short_answer", "scenario", "practical_reasoning", "voice"].includes(currentQuestion.type) && (
            <div className="space-y-2">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Detail your exact technical workflow, step-by-step procedures, and parameter choices..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
              <p className="text-[10px] text-muted-foreground">
                {currentAnswer.length} characters · Include specific tool names and procedural logic.
              </p>
            </div>
          )}

          {/* Action buttons */}
          {!showFeedback && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={skipQuestion}
                className="px-4 py-2.5 text-sm bg-muted text-foreground/60 rounded-xl font-semibold hover:text-foreground"
              >
                Skip
              </button>
              <button
                type="button"
                onClick={submitAnswer}
                disabled={
                  !currentAnswer.trim() &&
                  currentQuestion.type !== "matching" &&
                  !["true_false"].includes(currentQuestion.type)
                }
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {currentIdx + 1 === questions.length ? "Submit Exam" : "Submit Answer"}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Open answer advance button */}
          {showFeedback && ["short_answer", "scenario", "practical_reasoning", "voice", "matching"].includes(currentQuestion.type) && (
            <button
              type="button"
              onClick={() => advanceQuestion(answers)}
              className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
            >
              {currentIdx + 1 === questions.length ? "Calculate Final Results" : "Next Question"}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* ── EVALUATING ── */}
      {mockStep === "evaluating" && (
        <div className="text-center space-y-6 py-8">
          <RefreshCcw className="w-12 h-12 text-brand animate-spin mx-auto opacity-80" />
          <div>
            <h3 className="text-lg font-bold">Aggregating Cross-Stage Evidence...</h3>
            <p className="text-sm text-muted-foreground mt-2">Computing demonstrated proficiency level and confidence score.</p>
          </div>
          <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-brand h-full transition-all duration-200" style={{ width: `${evalProgress}%` }} />
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {mockStep === "result" && stageScore && (
        <div className="space-y-5">
          <div className="text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              stageScore.overall >= 65 ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-amber-500/15 text-amber-600 border border-amber-500/30"
            }`}>
              {stageScore.overall >= 65 ? <CheckCircle className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>
            <h3 className="text-lg font-bold">Stage 3 Mock Complete</h3>
            <p className="text-xs text-muted-foreground mt-1">Written assessment finished. Ready to generate full verification report.</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {stage2Result && (
              <div className="bg-surface border border-border rounded-xl p-3 text-center">
                <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Stage 2 (Voice)</p>
                <p className="text-xl font-black">{stage2Result.overall_score}%</p>
              </div>
            )}
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Stage 3 (Mock)</p>
              <p className="text-xl font-black">{stageScore.overall}%</p>
            </div>
            <div className="bg-brand-soft/20 border border-brand/20 rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-brand mb-1">Combined</p>
              <p className="text-xl font-black text-brand">
                {stage2Result
                  ? Math.round(stage2Result.overall_score * 0.4 + stageScore.overall * 0.6)
                  : stageScore.overall}%
              </p>
            </div>
          </div>

          <button onClick={finishMock} className="w-full py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground flex items-center justify-center gap-2">
            Generate Full Skill Verification Report <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
