/**
 * OmniForge Master Roadmap Intelligence Engine - Curriculum Architecture Types
 *
 * Defines contracts for:
 * 1. Two-Level Generation (Level A Blueprint & Level B Stage Content)
 * 2. Learning vs. Execution Roadmap Duality
 * 3. Centralized Quality Gate Validation Contracts
 */

import {
  DeepTopicItem,
  RoadmapTroubleshootingItem,
  RoadmapKnowledgeCheckItem,
  RoadmapActionableTask,
  RoadmapNode,
  ProgressiveProjectStage,
} from "../user-intelligence";

export type RoadmapType = "LEARNING" | "EXECUTION";
export type ExperienceLevel = "Beginner" | "Intermediate" | "Advanced" | "All Levels";

export interface BlueprintStageDefinition {
  stage: number;
  title: string;
  skillFocus: string;
  objective: string;
  prerequisites: string[];
  prerequisiteChecks?: string[];
  keyCompetencies: string[];
  projectTitle: string;
  deliverables: string[];
  definitionOfDone: string[];
  acceptanceCriteria?: string[];
  testingAndVerification?: string[];
  requiredToolsAndResources?: string[];
  evidenceRequired?: string[];
  estimatedStudyHours: number;
  recommendedPacing: string;
  isExpanded?: boolean;
}

export interface CurriculumBlueprint {
  subject: string;
  domain: string;
  roadmapType: RoadmapType;
  experienceLevel: ExperienceLevel;
  targetOutcome: string;
  estimatedEffort: string;
  prerequisiteRelationships?: Record<number, number[]>;
  stages: BlueprintStageDefinition[];
}

export interface StageContentDetail {
  topics: DeepTopicItem[];
  commonMistakesAndTroubleshooting: RoadmapTroubleshootingItem[];
  knowledgeCheck: RoadmapKnowledgeCheckItem[];
  completionCriteria: string[];
  actionableTasks?: RoadmapActionableTask[];
  freeResources: Array<{
    title: string;
    url: string;
    platform: string;
    type: "docs" | "tutorial" | "video" | "interactive";
    isFree: boolean;
  }>;
  practicalExercises?: Array<{
    id: string;
    title: string;
    prompt: string;
    starterCode?: string;
    hints?: string[];
    instructions?: string[];
    expectedOutcome?: string;
  }>;
  risksAndMitigations?: Array<{ risk: string; mitigation: string }>;
  validationProcedures?: string[];
  definitionOfDone?: string[];
  acceptanceCriteria?: string[];
  testingAndVerification?: string[];
  evidenceRequired?: string[];
}

export interface QualityGateValidationResult {
  isValid: boolean;
  issues: string[];
  repairedRoadmap: any;
  qualityMetrics: {
    stageCount: number;
    totalTopics: number;
    averageSubtopicsPerTopic: number;
    hasCycles: boolean;
    hasEmptyExplanations: boolean;
    hasExecutableExamples: boolean;
    isExecutionValid: boolean;
  };
}
