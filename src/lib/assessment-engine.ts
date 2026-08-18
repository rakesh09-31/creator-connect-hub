/**
 * OmniCraft – Adaptive Assessment Scoring Engine (v3)
 *
 * Computes multi-competency metrics:
 * - Theory Score (20%)
 * - Technical Score (20%)
 * - Scenario Score (20%)
 * - Practical Score (20%)
 * - Software Score (10%)
 * - Troubleshooting Score (10%)
 * - Decision Making Score
 * - Communication Score
 * - Overall Composite Score
 * - Declared vs Demonstrated Level Comparison
 * - Strengths, Weaknesses, Recommended Practice & AI Feedback
 */

import { BankQuestion, CompetencyTag, QuestionDifficulty } from "./question-bank";
export type { QuestionDifficulty };

export type AnswerRecord = {
  question: BankQuestion;
  answer: string;
  is_correct?: boolean;
  score: number; // 0–100
  quality: "excellent" | "strong" | "partial" | "weak" | "no_evidence";
  competency: CompetencyTag;
  conceptsMatched?: string[];
  conceptsMissed?: string[];
  feedback?: string;
};

export type StageScore = {
  stage: 2 | 3;
  overall: number;
  by_competency: Record<string, number>;
  answers: AnswerRecord[];
  questions_answered: number;
  questions_total: number;
};

export type CreatorSkillProfile = {
  role: string;
  skills: string[];
  subSkills: string[];
  software: string[];
  specialties: string[];
  declaredLevel: QuestionDifficulty;
  experienceDuration?: string;
  primarySkill: string;
};

export type AssessmentResult = {
  declared_level: string;
  demonstrated_level: string;
  stage2_score: number;
  stage3_score: number;
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
  problem_solving_score: number;
  verification_confidence: "high" | "medium" | "low" | "insufficient";
  verification_status: "verified" | "partially_verified" | "not_verified" | "insufficient_evidence";
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  ai_feedback: string;
  stage_comparison: string;
  summary: string;
};

// ============================================================================
// INDIVIDUAL ANSWER SCORING
// ============================================================================

export function scoreObjectiveAnswer(question: BankQuestion, answer: string): AnswerRecord {
  const normalizedAnswer = answer.trim().toLowerCase();
  const correctAnswer = (question.correctAnswer || "").trim().toLowerCase();
  const acceptable = (question.acceptableAnswers || []).map(a => a.trim().toLowerCase());

  const is_correct =
    normalizedAnswer === correctAnswer ||
    acceptable.includes(normalizedAnswer) ||
    (correctAnswer.length > 5 && normalizedAnswer.startsWith(correctAnswer.slice(0, 5)));

  return {
    question,
    answer,
    is_correct,
    score: is_correct ? 100 : 0,
    quality: is_correct ? "excellent" : "no_evidence",
    competency: question.competency,
    feedback: is_correct
      ? "Correct technical identification."
      : `Incorrect. Expected concept: ${question.correctAnswer || "technical standard"}.`
  };
}

export function scoreMatchingAnswer(question: BankQuestion, selectedPairs: Record<string, string>): AnswerRecord {
  if (!question.matchingPairs || question.matchingPairs.length === 0) {
    return {
      question,
      answer: "",
      score: 0,
      quality: "no_evidence",
      competency: question.competency
    };
  }

  let correctCount = 0;
  for (const pair of question.matchingPairs) {
    const userMatch = selectedPairs[pair.left]?.trim().toLowerCase();
    const expected = pair.right.trim().toLowerCase();
    if (userMatch === expected) {
      correctCount++;
    }
  }

  const score = Math.round((correctCount / question.matchingPairs.length) * 100);
  const quality =
    score === 100 ? "excellent" :
    score >= 75 ? "strong" :
    score >= 50 ? "partial" :
    score > 0 ? "weak" : "no_evidence";

  return {
    question,
    answer: JSON.stringify(selectedPairs),
    is_correct: score === 100,
    score,
    quality,
    competency: question.competency,
    feedback: `Matched ${correctCount} of ${question.matchingPairs.length} correctly.`
  };
}

export function scoreOpenAnswer(question: BankQuestion, answer: string): AnswerRecord {
  const cleanAnswer = answer.trim();
  const lowerAnswer = cleanAnswer.toLowerCase();

  // Strict "I don't know" detection - NEVER inflates score
  const noEvidencePhrases = [
    "i don't know", "i dont know", "dont know", "not sure", "no idea",
    "i'm not sure", "skip", "pass", "n/a", "i have no idea", "cant answer",
    "cannot answer", "idk", "no clue", "never heard of it"
  ];

  const isNoEvidence =
    noEvidencePhrases.some(phrase => lowerAnswer.includes(phrase)) ||
    cleanAnswer.length < 8;

  if (isNoEvidence) {
    return {
      question,
      answer: cleanAnswer,
      is_correct: false,
      score: 0,
      quality: "no_evidence",
      competency: question.competency,
      conceptsMatched: [],
      conceptsMissed: question.expectedConcepts,
      feedback: "No technical evidence provided for this question."
    };
  }

  // Semantic concept matching
  const expected = question.expectedConcepts || [];
  const matched: string[] = [];
  const missed: string[] = [];

  for (const concept of expected) {
    const conceptTerms = concept
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(w => w.length > 3);

    const matchesAny = conceptTerms.some(term => lowerAnswer.includes(term));
    if (matchesAny) {
      matched.push(concept);
    } else {
      missed.push(concept);
    }
  }

  let score = 0;
  if (expected.length > 0) {
    const ratio = matched.length / expected.length;
    score = Math.round(ratio * 100);
    if (score < 40 && cleanAnswer.split(/\s+/).length > 25) {
      score = 35;
    }
  } else {
    const wordCount = cleanAnswer.split(/\s+/).length;
    score = wordCount >= 40 ? 75 : wordCount >= 20 ? 55 : 30;
  }

  score = Math.min(100, Math.max(0, score));

  const quality =
    score >= 85 ? "excellent" :
    score >= 70 ? "strong" :
    score >= 45 ? "partial" :
    score > 0 ? "weak" : "no_evidence";

  return {
    question,
    answer: cleanAnswer,
    score,
    quality,
    competency: question.competency,
    conceptsMatched: matched,
    conceptsMissed: missed,
    feedback:
      quality === "excellent" ? "Comprehensive technical understanding demonstrated." :
      quality === "strong" ? "Good technical reasoning with minor gaps." :
      quality === "partial" ? "Partial knowledge shown; key procedural concepts missing." :
      "Incomplete technical depth."
  };
}

export function scoreAnswer(
  question: BankQuestion,
  answer: string,
  matchingPairs?: Record<string, string>
): AnswerRecord {
  switch (question.type) {
    case "multiple_choice":
    case "true_false":
    case "fill_blank":
      return scoreObjectiveAnswer(question, answer);
    case "matching":
      return scoreMatchingAnswer(question, matchingPairs || {});
    default:
      return scoreOpenAnswer(question, answer);
  }
}

// ============================================================================
// STAGE SCORE CALCULATION
// ============================================================================

export function calculateStageScore(answers: AnswerRecord[], stage: 2 | 3): StageScore {
  const competencies = [...new Set(answers.map(a => a.competency))];
  const by_competency: Record<string, number> = {};

  for (const comp of competencies) {
    const compAnswers = answers.filter(a => a.competency === comp);
    const totalScore = compAnswers.reduce((sum, a) => sum + a.score, 0);
    by_competency[comp] = compAnswers.length > 0 ? Math.round(totalScore / compAnswers.length) : 0;
  }

  const overall =
    answers.length > 0
      ? Math.round(answers.reduce((sum, a) => sum + a.score, 0) / answers.length)
      : 0;

  const validAnswers = answers.filter(a => a.quality !== "no_evidence" && a.answer.trim().length > 3);

  return {
    stage,
    overall,
    by_competency,
    answers,
    questions_answered: validAnswers.length,
    questions_total: answers.length,
  };
}

// ============================================================================
// FINAL RESULT & MULTI-COMPETENCY FUSION
// ============================================================================

const LEVEL_SCORE_THRESHOLDS = [
  { level: "Expert", minScore: 88, minConfidence: "medium" },
  { level: "Advanced", minScore: 72, minConfidence: "low" },
  { level: "Intermediate", minScore: 50, minConfidence: "low" },
  { level: "Beginner", minScore: 0, minConfidence: "insufficient" },
];

export function calculateFinalResult(
  stage2: StageScore,
  stage3: StageScore,
  profile: CreatorSkillProfile
): AssessmentResult {
  // Stage 3 (Mock Tasks) carries 60% weight, Stage 2 (Voice Technical) carries 40% weight
  const overall = Math.round(stage2.overall * 0.4 + stage3.overall * 0.6);

  // Individual Multi-Competency Scores
  const theory_score = averageScore([
    stage2.by_competency["theory"],
    stage3.by_competency["theory"],
  ]);
  const technical_score = averageScore([
    stage2.by_competency["technical_skill"],
    stage3.by_competency["technical_skill"],
  ]);
  const scenario_score = averageScore([
    stage2.by_competency["scenario_reasoning"],
    stage3.by_competency["scenario_reasoning"],
  ]);
  const practical_score = averageScore([
    stage2.by_competency["practical_execution"],
    stage3.by_competency["practical_execution"],
  ]);
  const software_score = averageScore([
    stage2.by_competency["software_knowledge"],
    stage3.by_competency["software_knowledge"],
  ]);
  const troubleshooting_score = averageScore([
    stage2.by_competency["troubleshooting"],
    stage3.by_competency["troubleshooting"],
  ]);
  const decision_making_score = averageScore([
    stage2.by_competency["decision_making"],
    stage3.by_competency["decision_making"],
  ]);
  const communication_score = Math.min(100, Math.round(stage2.overall * 0.9 + 10));

  // Determine Verification Confidence
  const totalAnsweredWithEvidence = stage2.questions_answered + stage3.questions_answered;
  const competenciesTested = new Set([
    ...Object.keys(stage2.by_competency),
    ...Object.keys(stage3.by_competency),
  ]).size;

  let confidence: AssessmentResult["verification_confidence"] = "insufficient";
  if (totalAnsweredWithEvidence < 3 || competenciesTested < 2) {
    confidence = "insufficient";
  } else if (totalAnsweredWithEvidence < 6 || competenciesTested < 3) {
    confidence = "low";
  } else if (totalAnsweredWithEvidence < 10 || competenciesTested < 4) {
    confidence = "medium";
  } else {
    confidence = "high";
  }

  // Demonstrated Level Determination
  let demonstratedLevel = "Beginner";
  for (const tier of LEVEL_SCORE_THRESHOLDS) {
    if (overall >= tier.minScore) {
      if (tier.level === "Expert" && (confidence === "insufficient" || confidence === "low")) {
        demonstratedLevel = "Advanced";
      } else {
        demonstratedLevel = tier.level;
      }
      break;
    }
  }

  // Verification Status
  let verification_status: AssessmentResult["verification_status"] = "insufficient_evidence";
  if (confidence === "insufficient" || totalAnsweredWithEvidence === 0) {
    verification_status = "insufficient_evidence";
  } else if (overall >= 65) {
    verification_status = "verified";
  } else if (overall >= 45) {
    verification_status = "partially_verified";
  } else {
    verification_status = "not_verified";
  }

  // Strengths, Weaknesses, and Recommendations
  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const recommendations: string[] = [];

  if (scenario_score >= 70) strengths.push("Strong real-world scenario reasoning and client brief adaptation.");
  else if (scenario_score < 45 && scenario_score > 0) {
    weaknesses.push("Struggles with multi-constraint client scenarios.");
    recommendations.push("Review real-world client case studies and workflow pacing.");
  }

  if (practical_score >= 70) strengths.push("Solid practical execution and task delivery.");
  else if (practical_score < 45 && practical_score > 0) {
    weaknesses.push("Practical workflow execution needs refinement.");
    recommendations.push(`Practice end-to-end task assembly for ${profile.primarySkill}.`);
  }

  if (software_score >= 70) strengths.push(`Proficient with ${profile.software.slice(0, 2).join(" & ") || "creative software tools"}.`);
  else if (software_score < 45 && profile.software.length > 0) {
    weaknesses.push(`Limited mastery of advanced tools in ${profile.software[0]}.`);
    recommendations.push(`Deepen non-destructive tool mastery in ${profile.software.slice(0, 2).join(" and ")}.`);
  }

  if (troubleshooting_score >= 70) strengths.push("Methodical root-cause diagnostic and troubleshooting ability.");
  else if (troubleshooting_score < 45 && troubleshooting_score > 0) {
    weaknesses.push("Needs faster diagnostic checklists for pipeline errors.");
    recommendations.push("Practice structured debugging (inspecting source files, cache, and export encoding).");
  }

  if (decision_making_score >= 70) strengths.push("Sound professional judgment when balancing technical trade-offs.");
  if (theory_score >= 70) strengths.push("Clear understanding of foundational principles and terminology.");

  if (strengths.length === 0) strengths.push(`Participated in ${profile.primarySkill} technical verification.`);
  if (weaknesses.length === 0) weaknesses.push("Maintain continuous practice with industry-standard master workflows.");
  if (recommendations.length === 0) recommendations.push(`Explore advanced masterclasses in ${profile.primarySkill}.`);

  const stageDiff = Math.abs(stage2.overall - stage3.overall);
  let stage_comparison = "";
  if (stageDiff <= 15) {
    stage_comparison = "Consistent performance across both vocal technical examination and interactive mock tasks, reflecting dependable practical skill.";
  } else if (stage2.overall > stage3.overall) {
    stage_comparison = "Stronger vocal articulation than interactive task execution. Practical task reinforcement recommended.";
  } else {
    stage_comparison = "Stronger performance on interactive tasks and troubleshooting than vocal explanations.";
  }

  const ai_feedback = `OmniCraft Assessment for ${profile.primarySkill} (${profile.declaredLevel} level): Demonstrated ${demonstratedLevel} proficiency (${overall}% composite). Strengths: ${strengths.slice(0, 2).join(", ")}.`;

  const summary = `${profile.primarySkill} Assessment: Declared ${profile.declaredLevel} | Demonstrated ${demonstratedLevel} (${overall}%). Verification Confidence: ${confidence}.`;

  return {
    declared_level: profile.declaredLevel,
    demonstrated_level: demonstratedLevel,
    stage2_score: stage2.overall,
    stage3_score: stage3.overall,
    overall_score: overall,
    theory_score: Math.round(theory_score),
    technical_score: Math.round(technical_score),
    scenario_score: Math.round(scenario_score),
    practical_score: Math.round(practical_score),
    software_score: Math.round(software_score),
    troubleshooting_score: Math.round(troubleshooting_score),
    decision_making_score: Math.round(decision_making_score),
    communication_score: Math.round(communication_score),
    knowledge_score: Math.round(theory_score),
    problem_solving_score: Math.round(scenario_score),
    verification_confidence: confidence,
    verification_status,
    strengths,
    weaknesses,
    recommendations,
    ai_feedback,
    stage_comparison,
    summary,
  };
}

function averageScore(values: (number | undefined)[]): number {
  const valid = values.filter((v): v is number => typeof v === "number" && !isNaN(v) && v > 0);
  if (valid.length === 0) return 0;
  return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}
