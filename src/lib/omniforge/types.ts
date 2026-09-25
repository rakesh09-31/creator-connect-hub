export type ProjectDomain =
  | "Film"
  | "Music"
  | "Software"
  | "AI / ML"
  | "Cybersecurity"
  | "Mobile App"
  | "Web App"
  | "Hardware / IoT"
  | "Research"
  | "Photography"
  | "Design"
  | "Animation"
  | "Writing"
  | "Content Creation"
  | "Marketing"
  | "Advertising"
  | "Events"
  | "Education"
  | "Business"
  | "Social Impact"
  | "Gaming"
  | "Custom Project";

export type ProjectStage =
  | "idea"
  | "discovery"
  | "planning"
  | "Planning"
  | "team_building"
  | "team_ready"
  | "in_progress"
  | "completed";

export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type TaskStatus = "pending" | "to_do" | "in_progress" | "review" | "completed";

export type RecommendationStatus = "recommended" | "selected" | "invited" | "accepted" | "declined" | "replaced";

export type RightPanelState =
  | "welcome"
  | "general_context"
  | "planning"
  | "blueprint"
  | "team"
  | "workspace";

export interface SkillSwapListingMatch {
  id: string;
  userId: string;
  creatorName: string;
  creatorAvatar?: string | null;
  title: string;
  description: string;
  category?: string;
  teachSkills: string[];
  learnSkills: string[];
  matchScore?: number;
  matchReason?: string;
}

export interface ProjectDeliverable {
  id: string;
  title: string;
  description: string;
  isKey: boolean;
  completed?: boolean;
}

export interface ProjectTask {
  id: string;
  phaseId: string;
  title: string;
  description: string;
  requiredRole: string;
  requiredSkills: string[];
  dependencies: string[]; // task IDs that must finish before this task
  parallelWith?: string[]; // task IDs that can execute concurrently
  estimatedDuration: string; // e.g. "4 days", "2 weeks"
  priority: TaskPriority;
  status: TaskStatus;
  assignedCreatorId?: string | null;
  assignedCreatorName?: string | null;
  assignedCreatorAvatar?: string | null;
  workstream?: string;
  order: number;
}

export interface ProjectPhase {
  id: string;
  name: string;
  description: string;
  purpose?: string;
  sourceReason?: string;
  order: number;
  workstreams: string[];
  tasks: ProjectTask[];
}

export interface ProjectRole {
  id: string;
  roleName: string;
  category?: "Creative" | "Technical" | "Business" | "Communication" | "Custom";
  description: string;
  requiredCapabilities?: string[]; // High-level abilities (e.g. Visual Storytelling, Actor Direction)
  requiredSkills: string[]; // Concrete tools / skills (e.g. Premiere Pro, Color Grading)
  estimatedHeadcount?: number;
  isFilled?: boolean;
  isEssential?: boolean;
  assignedCreatorId?: string | null;
}

export interface ParallelWorkstream {
  id: string;
  phaseName: string;
  streamName: string;
  taskIds: string[];
  simultaneousWith: string[];
  efficiencyNote: string;
}

export interface RealCreatorProfile {
  id: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string | null;
  bio?: string | null;
  skills: string[];
  specialties: string[];
  roles: string[];
  portfolioItemsCount: number;
  portfolioSamples: Array<{ title: string; url?: string; mediaType?: string }>;
  verifiedAssessmentsCount?: number;
  availability?: "available" | "busy" | "unknown";
}

export interface CreatorRecommendation {
  id: string;
  roleId: string;
  roleName: string;
  creator: RealCreatorProfile;
  matchScore: number; // 0-100
  tier: "strong" | "relevant" | "potential";
  matchReason: string; // Evidence-backed justification referencing actual portfolio/skills
  evidenceSources: {
    skillsMatched: string[];
    specialtiesMatched: string[];
    portfolioMatches: string[];
    roleAlignment: boolean;
  };
  status: RecommendationStatus;
  invitationId?: string;
}

export interface MissingCapability {
  roleId: string;
  roleName: string;
  category: string;
  requiredSkills: string[];
  reason: string;
  suggestedActions: Array<{
    type: "create_job" | "open_request" | "skill_swap" | "manual_add";
    label: string;
    description: string;
  }>;
}

export interface CapabilityCoverage {
  totalRequired: number;
  totalCovered: number;
  percentage: number;
  coveredCapabilities: Array<{ name: string; coveredBy: string }>;
  missingCapabilities: MissingCapability[];
}

export interface OmniForgeProject {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  domain: ProjectDomain;
  secondaryDomains?: ProjectDomain[];
  userType: "creator" | "client";
  stage: ProjectStage;
  goal: string;
  targetAudience: string;
  expectedFinalOutcome: string;
  complexity: "Simple" | "Moderate" | "Complex" | "Enterprise";
  estimatedTotalDuration: string;
  requirements?: string[];
  workflowStages?: string[];
  deliverables: ProjectDeliverable[];
  phases: ProjectPhase[];
  roles: ProjectRole[];
  parallelWorkstreams: ParallelWorkstream[];
  recommendations: CreatorRecommendation[];
  alternativeCandidates?: Record<string, CreatorRecommendation[]>; // roleId -> alternatives
  coverage: CapabilityCoverage;
  squadId?: string | null;
  conversationId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClarificationQuestion {
  id: string;
  question: string;
  fieldTarget: string;
  options?: string[];
  allowCustomInput?: boolean;
}

export type OmniForgeIntent =
  | "GENERAL_CONVERSATION"
  | "GENERAL_QUESTION"
  | "DEFINITION"
  | "EXPLANATION"
  | "HOW_TO"
  | "SIMPLE_QUESTION"
  | "GENERAL_PROJECT_QUESTION"
  | "PROJECT_IDEA"
  | "PROJECT_CREATION"
  | "PROJECT_PLANNING"
  | "PROJECT_MODIFICATION"
  | "PROJECT_STATUS"
  | "PROJECT_EXECUTION"
  | "PROJECT_PROBLEM"
  | "PROJECT_BLOCKER"
  | "REQUIREMENT_QUESTION"
  | "PHASE_QUESTION"
  | "TASK_QUESTION"
  | "ROLE_QUESTION"
  | "SKILL_QUESTION"
  | "CREATOR_SEARCH"
  | "CREATOR_DISCOVERY"
  | "CREATOR_QUESTION"
  | "CREATOR_COMPARISON"
  | "CREATOR_REPLACEMENT"
  | "TEAM_FORMATION"
  | "TEAM_REQUEST"
  | "SQUAD_REQUEST"
  | "SKILL_SWAP_REQUEST"
  | "SKILL_SWAP_QUESTION"
  | "SKILL_SWAP_SEARCH"
  | "TIMELINE_QUESTION"
  | "DEPENDENCY_QUESTION"
  | "BUDGET_QUESTION"
  | "RESOURCE_QUESTION"
  | "CLARIFICATION"
  | "UNKNOWN";

export type ConversationStage =
  | "GENERAL_CHAT"
  | "INTENT_IDENTIFICATION"
  | "PROJECT_DISCOVERY"
  | "REQUIREMENTS_INVESTIGATION"
  | "CREATOR_MATCHING"
  | "PROJECT_BLUEPRINT"
  | "COMPLETED";

export interface ConversationState {
  stage: ConversationStage;
  userOriginalRequest?: string;
  projectType?: string;
  projectDomain?: ProjectDomain;
  projectDescription?: string;
  targetRole?: string;
  requirements: {
    roleType?: string;
    gender?: string;
    ageRange?: string;
    language?: string;
    actingStyle?: string;
    shootingLocation?: string;
    compensation?: string;
    storyGenre?: string;
    storyPremise?: string;
    scriptStatus?: string;
    duration?: string;
    budget?: string;
    crewNeeded?: string[];
    websitePurpose?: string;
    targetAudience?: string;
    keyFeatures?: string[];
    [key: string]: any;
  };
  previouslyAskedQuestions: string[];
  investigationArea?: "casting" | "story" | "production" | "crew" | "website_purpose" | "features" | "general";
  matchedCreators?: CreatorRecommendation[];
  lastSelectedOption?: string;
}

export type AIResponseLevel =
  | "SIMPLE_ANSWER"
  | "CONTEXTUAL_ANSWER"
  | "PROJECT_ANALYSIS"
  | "PROJECT_MODIFICATION"
  | "CREATOR_DISCOVERY"
  | "CONFIRMATION_REQUIRED";

export interface AIStructuredResponse {
  intent: OmniForgeIntent;
  targetRole?: string;
  responseLevel: AIResponseLevel;
  message: string;
  conversationState?: ConversationState;
  projectAction?: {
    type:
      | "CREATE_BLUEPRINT"
      | "UPDATE_ROLE"
      | "REMOVE_ROLE"
      | "ADD_ROLE"
      | "UPDATE_TASK"
      | "UPDATE_STAGE"
      | "REPLACE_CREATOR"
      | "ADD_CREATOR"
      | "CREATE_SQUAD";
    payload?: any;
  } | null;
  uiAction?: {
    type:
      | "SHOW_BLUEPRINT"
      | "SHOW_ROLE_CARD"
      | "SHOW_CREATOR_RECOMMENDATIONS"
      | "SHOW_CREATOR_COMPARISON"
      | "SHOW_SKILL_SWAP_MATCHES"
      | "SHOW_PROJECT_UPDATE"
      | "SHOW_CONFIRMATION"
      | "SHOW_TASK_STATUS"
      | "SHOW_NONE";
    roleId?: string;
    roleName?: string;
    creators?: CreatorRecommendation[];
    comparisonData?: {
      roleName: string;
      candidates: CreatorRecommendation[];
      analysis: string;
    };
    updateSummary?: { title: string; detail: string; actionType: string };
    confirmationPrompt?: {
      title: string;
      message: string;
      actionType: "create_squad" | "remove_role" | "publish_job" | "reschedule_tasks";
      payload?: any;
    };
  } | null;
  roleCard?: {
    roleId?: string;
    roleName: string;
    category: string;
    purpose: string;
    skills: string[];
  };
  creatorCards?: CreatorRecommendation[];
  skillSwapCards?: SkillSwapListingMatch[];
  updateCard?: {
    title: string;
    detail: string;
    actionType: string;
  };
  confirmationCard?: {
    title: string;
    message: string;
    actionType: "create_squad" | "remove_role" | "publish_job" | "reschedule_tasks";
    payload?: any;
  };
  comparisonCard?: {
    roleName: string;
    candidates: CreatorRecommendation[];
    analysis: string;
  };
  clarifications?: ClarificationQuestion[];
  entities?: Array<{ type: string; value: string }>;
  requiresConfirmation?: boolean;
  updatedProject?: OmniForgeProject | null;
  suggestedFollowUps?: string[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  timestamp: string;
  intent?: OmniForgeIntent;
  responseLevel?: AIResponseLevel;
  sourceMeta?: {
    provider: string;
    model: string;
    isRealLLM: boolean;
    fallbackUsed?: boolean;
    status?: string;
    statusMessage?: string;
  };
  clarifications?: ClarificationQuestion[];
  blueprintPreview?: Partial<OmniForgeProject>;
  actionPrompt?: {
    type: "generate_blueprint" | "review_team" | "create_squad" | "refine_blueprint";
    label: string;
  };
  roleCard?: {
    roleId?: string;
    roleName: string;
    category: string;
    purpose: string;
    skills: string[];
  };
  creatorCards?: CreatorRecommendation[];
  skillSwapCards?: SkillSwapListingMatch[];
  updateCard?: {
    title: string;
    detail: string;
    actionType: string;
  };
  confirmationCard?: {
    title: string;
    message: string;
    actionType: "create_squad" | "remove_role" | "publish_job" | "reschedule_tasks";
    payload?: any;
  };
  comparisonCard?: {
    roleName: string;
    candidates: CreatorRecommendation[];
    analysis: string;
  };
  suggestedFollowUps?: string[];
  conversationState?: ConversationState;
  isThinking?: boolean;
}
