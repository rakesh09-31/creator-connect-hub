export * from "./intent";

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
  category?: "Creative" | "Technical" | "Business" | "Communication" | "Custom" | "Performance" | "Production" | string;
  description: string;
  requiredCapabilities?: string[]; // High-level abilities (e.g. Visual Storytelling, Actor Direction)
  requiredSkills: string[]; // Concrete tools / skills (e.g. Premiere Pro, Color Grading)
  estimatedHeadcount?: number;
  isFilled?: boolean;
  isEssential?: boolean;
  assignedCreatorId?: string | null;
  assignedCreatorName?: string | null;
  department?: string;
  coverageStatus?: RoleCoverageStatus;
  candidateCount?: number;
  requiredOrOptional?: "REQUIRED" | "LIKELY" | "OPTIONAL" | string;
  whyRequired?: string;
  responsibilities?: string[];
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
  full_name?: string | null;
  avatarUrl: string | null;
  avatar_url?: string | null;
  role: string | null;
  bio?: string | null;
  portfolioUrl?: string | null;
  website?: string | null;
  experienceLevel?: string | null;
  skills: string[];
  specialties: string[];
  roles: string[];
  portfolioItemsCount: number;
  portfolioSamples: Array<{
    title: string;
    url?: string;
    mediaType?: string;
    description?: string;
    tech?: string[];
    projectLink?: string;
  }>;
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
  invitationStatus?: "pending" | "accepted" | "declined" | "rejected" | "cancelled";
}

export type RoleCoverageStatus =
  | "COVERED_BY_USER"
  | "ASSIGNED"
  | "OPEN_WITH_CANDIDATES"
  | "NO_CANDIDATES"
  | "OPTIONAL";

export interface ProjectRoleCoverage {
  roleId: string;
  roleName: string;
  department: string;
  requirement: "REQUIRED" | "LIKELY" | "OPTIONAL";
  status: RoleCoverageStatus;
  assignedCreatorId?: string;
  assignedCreatorName?: string;
  candidateCount: number;
}

export interface MissingCapability {
  roleId: string;
  roleName: string;
  category: string;
  requiredSkills: string[];
  reason: string;
  candidateCount?: number;
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
  roleCoverages?: ProjectRoleCoverage[];
}

export type CapabilityLevel = "REQUIRED" | "LIKELY" | "OPTIONAL";
export type CapabilityType = "technical" | "domain" | "operational" | "field";

export interface DerivedCapability {
  id: string;
  name: string;
  description: string;
  type: CapabilityType;
  level: CapabilityLevel;
  whyRequired?: string;
}

export interface DerivedRole {
  roleName: string;
  capability: string;
  responsibilities: string[];
  whyRequired: string;
  requiredOrOptional: CapabilityLevel;
  relatedTasks: string[];
  category: "Creative" | "Technical" | "Business" | "Communication" | "Custom";
  requiredSkills: string[];
}

export interface StructuredRequirements {
  projectGoal: string;
  domain: ProjectDomain;
  targetUsers: string;
  problem: string;
  coreFeatures: string[];
  technicalRequirements: string[];
  domainRequirements: string[];
  deploymentRequirements: string[];
  operationalRequirements: string[];
  constraints: string[];
  expectedDeliverables: string[];
}

export type CanonicalDomain =
  | "FILM"
  | "MUSIC_BAND"
  | "EVENT"
  | "STARTUP"
  | "SOFTWARE"
  | "EDUCATION"
  | "SPORTS"
  | "CONTENT_CREATION"
  | "OTHER";

export interface OmniForgeProject {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  domain: ProjectDomain;
  canonicalDomain?: CanonicalDomain;
  projectType?: string;
  type?: string;
  genre?: string;
  teamSize?: number;
  secondaryDomains?: ProjectDomain[];
  userType: "creator" | "client";
  stage: ProjectStage;
  goal: string;
  targetAudience: string;
  expectedFinalOutcome: string;
  complexity: "Simple" | "Moderate" | "Complex" | "Enterprise";
  estimatedTotalDuration: string;
  requirements?: string[];
  structuredRequirements?: StructuredRequirements;
  capabilities?: DerivedCapability[];
  derivedRoles?: DerivedRole[];
  workflowStages?: string[];
  deliverables: ProjectDeliverable[];
  phases: ProjectPhase[];
  roles: ProjectRole[];
  tasks?: ProjectTask[];
  parallelWorkstreams: ParallelWorkstream[];
  recommendations: CreatorRecommendation[];
  alternativeCandidates?: Record<string, CreatorRecommendation[]>; // roleId -> alternatives
  coverage: CapabilityCoverage;
  roleCoverages?: ProjectRoleCoverage[];
  squadId?: string | null;
  conversationId?: string | null;
  budget?: string;
  storyPremise?: string;
  currentUserRole?: string;
  roleRequirements?: Record<string, { level: any; reason?: string }>;
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
  | "GREETING"
  | "GENERAL_CONVERSATION"
  | "GENERAL_QUESTION"
  | "GENERAL_KNOWLEDGE"
  | "IDENTITY"
  | "CAPABILITY_QUERY"
  | "DEFINITION"
  | "EXPLANATION"
  | "HOW_TO"
  | "SIMPLE_QUESTION"
  | "CREATIVE_GENERATION"
  | "STORY_GENERATION"
  | "STORY_MODIFICATION"
  | "SCREENPLAY_GENERATION"
  | "CREATIVE_ANALYSIS"
  | "CRITIQUE"
  | "FEEDBACK"
  | "GENERAL_PROJECT_QUESTION"
  | "PROJECT_IDEA"
  | "PROJECT_CREATE"
  | "PROJECT_CREATION"
  | "PROJECT_PLANNING"
  | "PROJECT_VIEW"
  | "PROJECT_MODIFICATION"
  | "PROJECT_MODIFY"
  | "PROJECT_ARCHITECTURE"
  | "PROJECT_SCHEDULE"
  | "PROJECT_STATUS"
  | "PROJECT_EXECUTION"
  | "PROJECT_ANALYSIS"
  | "PROJECT_PROBLEM"
  | "PROJECT_BLOCKER"
  | "REQUIREMENT_QUESTION"
  | "PHASE_QUESTION"
  | "TASK_QUESTION"
  | "ROLE_QUESTION"
  | "SKILL_QUESTION"
  | "CREATOR_SEARCH"
  | "CREATOR_SEARCH_ALL"
  | "CREATOR_RECOMMEND"
  | "CREATOR_PROFILE"
  | "CREATOR_JOB_SEARCH"
  | "CLIENT_SEARCH"
  | "CLIENT_OPPORTUNITY_SEARCH"
  | "CLIENT_PROFILE"
  | "JOB_SEARCH"
  | "JOB_DETAILS"
  | "JOB_APPLICATION"
  | "APPLY_FOR_JOB"
  | "CREATOR_DISCOVERY"
  | "CREATOR_QUESTION"
  | "CREATOR_COMPARISON"
  | "CREATOR_COMPARE"
  | "CREATOR_REPLACEMENT"
  | "TEAM_FORMATION"
  | "TEAM_GAP_ANALYSIS"
  | "TEAM_REQUEST"
  | "SQUAD_SEARCH"
  | "SQUAD_CREATE"
  | "SQUAD_VIEW"
  | "SQUAD_REQUEST"
  | "INVITE_CREATOR"
  | "HIRE_CREATOR"
  | "HIRE_SQUAD"
  | "SKILL_ANALYSIS"
  | "SKILL_GAP"
  | "SKILL_SWAP"
  | "SKILL_SWAP_REQUEST"
  | "SKILL_SWAP_QUESTION"
  | "SKILL_SWAP_SEARCH"
  | "TIMELINE_QUESTION"
  | "DEPENDENCY_QUESTION"
  | "TECHNICAL_QUESTION"
  | "EDUCATIONAL_QUESTION"
  | "EXAM_PREPARATION"
  | "LAB_QUESTION"
  | "VIVA_QUESTION"
  | "PROGRAMMING_QUESTION"
  | "MATH_QUESTION"
  | "ROADMAP_CAPABILITY_INQUIRY"
  | "CREATE_NEW_ROADMAP"
  | "VIEW_SAVED_ROADMAP"
  | "VIEW_CURRENT_ROADMAP"
  | "SAVE_ROADMAP"
  | "EXPAND_ROADMAP_STAGE"
  | "COMPARE_ROADMAPS"
  | "EXPLAIN_TOPIC"
  | "MODIFY_ROADMAP"
  | "ROADMAP_MODIFY"
  | "CONTINUE_ROADMAP"
  | "LIST_SAVED_ROADMAPS"
  | "DELETE_ROADMAP"
  | "ROADMAP_REQUEST"
  | "ROADMAP_CREATE"
  | "CLARIFICATION"
  | "FOLLOW_UP"
  | "UNKNOWN";


export type ConversationStage =
  | "GENERAL_CHAT"
  | "INTENT_IDENTIFICATION"
  | "PROJECT_DISCOVERY"
  | "REQUIREMENTS_INVESTIGATION"
  | "CREATOR_MATCHING"
  | "PROJECT_BLUEPRINT"
  | "COMPLETED";

export interface ClientOpportunity {
  id: string;
  clientId?: string;
  title: string;
  description: string;
  category: string | null;
  budget: string | null;
  duration: string | null;
  deadline: string | null;
  skillsRequired: string[];
  clientName: string;
  clientUsername?: string;
  clientAvatar?: string | null;
  createdAt: string;
}

export interface SquadResult {
  id: string;
  name: string;
  description: string | null;
  specialty: string | null;
  avatarUrl: string | null;
  ownerId: string;
  ownerUsername?: string;
  ownerFullName?: string | null;
  memberCount: number;
}

export interface SearchPaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

export interface ConversationState {
  stage: ConversationStage;
  userOriginalRequest?: string;
  projectType?: string;
  projectDomain?: ProjectDomain;
  activeDomain?: CanonicalDomain;
  activeProjectId?: string;
  activeProjectType?: string;
  projectName?: string;
  projectDescription?: string;
  targetRole?: string;
  currentUserRole?: string;
  currentUserType?: "CREATOR" | "CLIENT";
  activeGoal?: "FIND_JOB" | "HIRE_TALENT" | "BUILD_PROJECT";
  selectedJobId?: string | null;
  selectedJob?: ClientOpportunity | null;
  appliedJobIds?: string[];
  activeStory?: string;
  lastSearchType?: "creators" | "clients" | "client_opportunities" | "squads" | null;
  lastSearchQuery?: Record<string, any>;
  lastSearchResults?: any[];
  searchPagination?: SearchPaginationState;
  selectedSquad?: SquadResult | null;
  selectedCreator?: CreatorRecommendation | null;
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
  investigationArea?: "casting" | "story" | "production" | "crew" | "website_purpose" | "features" | "general" | "performance";
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

export interface SuggestedRole {
  role: string;
  reason: string;
  skills: string[];
  priority: "essential" | "optional";
}

export interface LatencyTelemetry {
  intent: string;
  execution_mode: "FAST" | "AI" | "HYBRID";
  intent_detection_ms: number;
  context_build_ms: number;
  database_ms: number;
  ollama_ms: number;
  response_normalization_ms: number;
  total_ms: number;
  first_token_ms?: number;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai" | "system";
  text: string;
  timestamp: string;
  intent?: OmniForgeIntent;
  userIntent?: import("./intent").UserIntent;
  projectAction?: import("./intent").ProjectActionType;
  matchingAction?: import("./intent").MatchingActionType;
  responseLevel?: AIResponseLevel;
  sourceMeta?: {
    provider: string;
    model: string;
    isRealLLM: boolean;
    fallbackUsed?: boolean;
    status?: string;
    statusMessage?: string;
    telemetry?: LatencyTelemetry;
    executionMode?: "FAST" | "AI" | "HYBRID" | "TOOL" | "RAG";
    responseOwner?: "FAST_PATH" | "SUPABASE" | "RAG_OLLAMA" | "LLM_GENERATION" | "HYBRID";
  };
  clarifications?: ClarificationQuestion[];
  blueprintPreview?: Partial<OmniForgeProject>;
  actionPrompt?: {
    type: "generate_blueprint" | "review_team" | "create_squad" | "refine_blueprint";
    label: string;
  };
  suggestedRoles?: SuggestedRole[];
  roleCard?: {
    roleId?: string;
    roleName: string;
    category: string;
    purpose: string;
    skills: string[];
  };
  creatorCards?: CreatorRecommendation[];
  clientCards?: ClientOpportunity[];
  squadCards?: SquadResult[];
  suggestedChips?: string[];
  searchPagination?: SearchPaginationState;
  missingCapabilities?: MissingCapability[];
  matchingStatus?: "idle" | "loading" | "matched" | "empty" | "error";
  matchingError?: string;
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
  isError?: boolean;
  errorMessage?: string;
  failedPrompt?: string;
  roadmapArtifact?: any;
  projectPlanArtifact?: any;
  skillReportArtifact?: {
    skillDna: Record<string, any>;
    skillGaps: any[];
    careerGoal: string;
  };
}

export interface OmniForgeConversation {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  state?: ConversationState;
  activeProjectId?: string | null;
  activeRoadmapId?: string | null;
  activeArtifact?: {
    type: "roadmap" | "project_plan" | "blueprint" | "skill_assessment";
    data: any;
  } | null;
}

export interface SavedRoadmapItem {
  id: string;
  userId: string;
  conversationId?: string;
  title: string;
  subject?: string;
  domain?: string;
  summary?: string;
  targetSkillOrOutcome: string;
  progressPercent: number;
  totalStages: number;
  completedStages: number;
  activeMilestoneTitle: string;
  roadmapData: any;
  roadmapType?: "LEARNING" | "EXECUTION";
  createdAt: string;
  updatedAt: string;
}


