/**
 * OmniCraft – AI Technical Voice Assessment (Stage 2)
 *
 * Implements strict Technical Skill Examiner rules:
 * - Direct technical questions derived from Selected Role, Skill, Sub-skills, Software, and Specialties
 * - Live speech-to-text recognition (Web Speech API) with text fallback
 * - "I don't know" / skip records no_evidence and 0 score (NEVER inflates skill level)
 * - Multi-competency coverage (Knowledge, Technical, Software, Troubleshooting, Scenarios)
 */

import { useState, useRef, useEffect } from "react";
import { Mic, Square, RefreshCcw, ChevronRight, CheckCircle, AlertTriangle, Sparkles } from "lucide-react";
import { CreatorSkillProfile, scoreAnswer, calculateStageScore, StageScore, AnswerRecord } from "@/lib/assessment-engine";
import { generateTechnicalQuestionsForProfile, BankQuestion } from "@/lib/question-bank";

export type AIResult = {
  overall_score: number;
  technical_score: number;
  practical_score: number;
  problem_solving_score: number;
  knowledge_score: number;
  communication_score: number;
  verified_level: string;
  strengths: string;
  weaknesses: string;
  ai_summary: string;
  status: "verified" | "failed";
  stage_score: StageScore;
};

type Props = {
  profile: CreatorSkillProfile;
  onComplete: (result: AIResult) => void;
  onCancel: () => void;
};

type InterviewStep = "intro" | "interview" | "evaluating" | "result";

const COMPETENCY_LABELS: Record<string, string> = {
  basic_knowledge: "A: Core Terminology & Concepts",
  technical_skill: "B: Technical Execution & Methods",
  software_knowledge: "C: Software Workflow",
  troubleshooting: "D: Diagnostics & Troubleshooting",
  scenario_reasoning: "E: Client & Performance Scenarios",
  practical_execution: "F: Practical Implementation",
};

export default function AIVoiceVerification({ profile, onComplete, onCancel }: Props) {
  const [interviewStep, setInterviewStep] = useState<InterviewStep>("intro");
  const [questions, setQuestions] = useState<BankQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [evalProgress, setEvalProgress] = useState(0);
  const [stageScore, setStageScore] = useState<StageScore | null>(null);

  // Web Speech API
  const recognitionRef = useRef<any>(null);
  const [browserSupportsSTT, setBrowserSupportsSTT] = useState(false);

  useEffect(() => {
    const hasSTT = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
    setBrowserSupportsSTT(hasSTT);
  }, []);

  const initQuestions = () => {
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
  };

  const startInterview = () => {
    initQuestions();
    setInterviewStep("interview");
    setCurrentIdx(0);
    setAnswers([]);
    setCurrentAnswer("");
  };

  const submitCurrentAnswer = () => {
    const q = questions[currentIdx];
    if (!q) return;

    const record = scoreAnswer(q, currentAnswer || "");
    const newAnswers = [...answers, record];
    setAnswers(newAnswers);
    setCurrentAnswer("");
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setInterviewStep("evaluating");
      simulateEvaluation(newAnswers);
    }
  };

  const skipQuestion = () => {
    const q = questions[currentIdx];
    if (!q) return;

    const record = scoreAnswer(q, "I don't know");
    const newAnswers = [...answers, record];
    setAnswers(newAnswers);
    setCurrentAnswer("");
    setIsRecording(false);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
    }

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setInterviewStep("evaluating");
      simulateEvaluation(newAnswers);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsRecording(false);
      return;
    }

    if (!browserSupportsSTT) {
      setIsRecording(true);
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentAnswer(transcript);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (err) {
      setIsRecording(false);
    }
  };

  const simulateEvaluation = (finalAnswers: AnswerRecord[]) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setEvalProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        const score = calculateStageScore(finalAnswers, 2);
        setStageScore(score);
        setInterviewStep("result");
      }
    }, 120);
  };

  const finishStage = () => {
    if (!stageScore) return;

    const overall = stageScore.overall;
    const knowledge = stageScore.by_competency["basic_knowledge"] || 0;
    const technical = stageScore.by_competency["technical_skill"] || 0;
    const scenario = stageScore.by_competency["scenario_reasoning"] || 0;
    const software = stageScore.by_competency["software_knowledge"] || 0;

    const verified_level =
      overall >= 88 ? "Expert" :
      overall >= 72 ? "Advanced" :
      overall >= 50 ? "Intermediate" :
      "Beginner";

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (knowledge >= 70) strengths.push(`Foundational technical vocabulary in ${profile.primarySkill}`);
    else if (knowledge < 45) weaknesses.push(`Needs review of core ${profile.primarySkill} technical definitions`);

    if (technical >= 70) strengths.push("Strong procedural execution");
    else if (technical < 45) weaknesses.push("Procedural workflow depth needs practice");

    if (scenario >= 70) strengths.push("Effective real-world scenario analysis");
    if (software >= 70) strengths.push(`Proficient with ${profile.software[0] || "primary tools"}`);

    onComplete({
      overall_score: overall,
      technical_score: technical,
      practical_score: stageScore.by_competency["practical_execution"] || 0,
      problem_solving_score: scenario,
      knowledge_score: knowledge,
      communication_score: Math.min(100, overall + 5),
      verified_level,
      strengths: strengths.join(". ") || `Completed technical voice assessment for ${profile.primarySkill}`,
      weaknesses: weaknesses.join(". ") || `Continue advancing knowledge in ${profile.primarySkill}`,
      ai_summary: `Stage 2 technical voice assessment for ${profile.primarySkill} (${profile.declaredLevel} level). Score: ${overall}%. Demonstrated proficiency: ${verified_level}.`,
      status: overall >= 50 ? "verified" : "failed",
      stage_score: stageScore,
    });
  };

  const currentQuestion = questions[currentIdx];
  const progress = questions.length > 0 ? Math.round((currentIdx / questions.length) * 100) : 0;
  const sectionLabel = currentQuestion ? (COMPETENCY_LABELS[currentQuestion.competency] || currentQuestion.competency) : "";

  return (
    <div className="space-y-5 py-2">
      {/* ── INTRO ── */}
      {interviewStep === "intro" && (
        <div className="text-center space-y-5">
          <div className="w-16 h-16 bg-brand-soft rounded-full flex items-center justify-center mx-auto">
            <Mic className="w-8 h-8 text-brand" />
          </div>
          <div>
            <h3 className="text-lg font-bold tracking-tight">Stage 2: Technical Voice Assessment</h3>
            <p className="text-sm text-muted-foreground mt-2 px-4 leading-relaxed">
              Technical examination for <strong>{profile.primarySkill}</strong> ({profile.declaredLevel} level).
              {profile.software.length > 0 && ` Software evaluated: ${profile.software.join(", ")}.`}
            </p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-4 text-sm text-left space-y-2">
            <p className="font-semibold text-xs uppercase tracking-widest text-muted-foreground mb-3">Examination Areas</p>
            {Object.values(COMPETENCY_LABELS).map((label) => (
              <div key={label} className="flex items-center gap-2 text-foreground/80 text-xs">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                {label}
              </div>
            ))}
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-700 text-left">
            <strong>Examiner Rule:</strong> Questions test technical workflows and specific mechanics. If you do not know a term, click "Skip / Don't Know" — evidence is gathered across all questions before any level is calculated.
          </div>

          <div className="flex gap-3">
            <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-muted text-foreground/80">
              Back
            </button>
            <button onClick={startInterview} className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-primary text-primary-foreground">
              Begin Technical Exam
            </button>
          </div>
        </div>
      )}

      {/* ── INTERVIEW ── */}
      {interviewStep === "interview" && currentQuestion && (
        <div className="space-y-4">
          {/* Progress Header */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span className="flex items-center gap-1.5 text-brand">
                {isRecording && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse inline-block" />}
                {sectionLabel}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Difficulty & Competency Badges */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-soft text-brand border border-brand/20">
              {currentQuestion.type.replace("_", " ")}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
              {currentQuestion.difficulty}
            </span>
            {currentQuestion.software && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {currentQuestion.software}
              </span>
            )}
          </div>

          {/* Question Text */}
          <div className="bg-brand-soft/20 border border-brand/20 rounded-xl p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-brand mb-1">Technical Examiner Prompt:</p>
            <p className="text-foreground/90 text-sm font-medium leading-relaxed">{currentQuestion.question}</p>
          </div>

          {/* Multiple Choice Options if applicable */}
          {currentQuestion.type === "multiple_choice" && currentQuestion.options && (
            <div className="space-y-2">
              {currentQuestion.options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setCurrentAnswer(opt)}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm border font-medium transition-all ${
                    currentAnswer === opt
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-surface border-border text-foreground/80 hover:border-primary/40"
                  }`}
                >
                  <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {/* Open / Voice Answer Input */}
          {currentQuestion.type !== "multiple_choice" && (
            <div className="space-y-3">
              <div className="bg-surface border border-border rounded-xl p-4 min-h-[120px]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Technical Response:</p>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder="Explain your technical procedure, tools, parameters, or diagnostic steps..."
                  rows={4}
                  className="w-full bg-transparent text-sm text-foreground/90 resize-none outline-none"
                />
              </div>

              {/* Voice recording button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center text-white transition-all shadow-md ${
                    isRecording ? "bg-rose-500 animate-pulse" : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
                >
                  {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Mic className="w-5 h-5" />}
                </button>
                <div className="text-xs text-muted-foreground">
                  {isRecording ? (
                    <span className="text-rose-500 font-semibold">Listening to technical explanation... Tap to finish.</span>
                  ) : browserSupportsSTT ? (
                    "Tap mic to speak your answer, or type directly above."
                  ) : (
                    "Type your technical response in the box above."
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={skipQuestion}
              className="px-4 py-2.5 text-sm bg-muted text-foreground/60 rounded-xl font-semibold hover:text-foreground transition"
            >
              Skip / Don't Know
            </button>
            <button
              type="button"
              onClick={submitCurrentAnswer}
              disabled={!currentAnswer.trim()}
              className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {currentIdx + 1 === questions.length ? "Finish Exam" : "Next Question"}
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Evaluation tracker */}
          {answers.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Exam Evidence Log</p>
              <div className="flex flex-wrap gap-1.5">
                {answers.map((a, i) => (
                  <div
                    key={i}
                    title={`Q${i + 1}: ${a.quality}`}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      a.quality === "excellent" ? "bg-emerald-500 text-white" :
                      a.quality === "strong" ? "bg-emerald-600 text-white" :
                      a.quality === "partial" ? "bg-amber-500 text-white" :
                      a.quality === "weak" ? "bg-orange-400 text-white" :
                      "bg-muted text-muted-foreground"
                    }`}
                  >
                    Q{i + 1}: {a.quality === "no_evidence" ? "0%" : `${a.score}%`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── EVALUATING ── */}
      {interviewStep === "evaluating" && (
        <div className="text-center space-y-6 py-8">
          <RefreshCcw className="w-12 h-12 text-brand animate-spin mx-auto opacity-80" />
          <div>
            <h3 className="text-lg font-bold tracking-tight">Compiling Technical Evaluation...</h3>
            <p className="text-sm text-muted-foreground mt-2">Scoring concepts, procedures, and diagnostic precision.</p>
          </div>
          <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2 overflow-hidden">
            <div className="bg-brand h-full transition-all duration-300" style={{ width: `${evalProgress}%` }} />
          </div>
        </div>
      )}

      {/* ── RESULT ── */}
      {interviewStep === "result" && stageScore && (
        <div className="space-y-5">
          <div className="text-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
              stageScore.overall >= 65 ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" : "bg-amber-500/15 text-amber-600 border border-amber-500/30"
            }`}>
              {stageScore.overall >= 65 ? <CheckCircle className="w-7 h-7" /> : <AlertTriangle className="w-7 h-7" />}
            </div>
            <h3 className="text-lg font-bold">Stage 2 Technical Exam Complete</h3>
            <p className="text-xs text-muted-foreground mt-1">Score: {stageScore.overall}% · Proceeding to Stage 3 Interactive Mock.</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Score</p>
              <p className="text-2xl font-black">{stageScore.overall}%</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Declared</p>
              <p className="text-sm font-bold text-foreground/80">{profile.declaredLevel}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-3 text-center">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Evidence</p>
              <p className="text-sm font-bold text-foreground/80">{stageScore.questions_answered}/{stageScore.questions_total}</p>
            </div>
          </div>

          <button onClick={finishStage} className="w-full py-3 rounded-xl font-bold text-sm bg-primary text-primary-foreground flex items-center justify-center gap-2">
            Continue to Stage 3: Mock Assessment <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
