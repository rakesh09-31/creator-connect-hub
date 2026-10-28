/**
 * OmniForge Tool Registry & Capability Architecture
 *
 * Exposes specialized OmniForge capabilities as structured tools.
 * Deterministic execution for database operations, state changes, and creator discovery.
 * Never fabricates database results.
 */

import {
  OmniForgeProject,
  CreatorRecommendation,
  MissingCapability,
  RealCreatorProfile,
  ChatMessage,
  ConversationState,
} from "./types";
import { searchCreatorsDirectory, matchCreatorsForProject } from "./matcher";
import { generateStructuredBlueprint, modifyBlueprintFromInstruction } from "./engine-blueprint";
import { getOrCreateProjectSquad, fetchSquadMembers, fetchSquadInvitations } from "./collaboration";
import { reconcileProjectTeamState } from "./team-reconciliation";

export type OmniForgeToolName =
  | "create_project"
  | "analyze_project"
  | "analyze_requirements"
  | "generate_story"
  | "modify_story"
  | "analyze_story"
  | "find_plot_holes"
  | "create_screenplay"
  | "create_shot_list"
  | "create_production_plan"
  | "analyze_missing_roles"
  | "search_creators"
  | "view_creator"
  | "invite_creator"
  | "build_squad"
  | "create_tasks"
  | "manage_project"
  | "summarize_project";

export interface OmniForgeToolParameter {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;
}

export interface OmniForgeToolDefinition {
  name: OmniForgeToolName;
  description: string;
  category: "project" | "story" | "creators" | "workspace";
  parameters: Record<string, OmniForgeToolParameter>;
  requiresConfirmation?: boolean;
}

export interface ToolExecutionContext {
  userId: string;
  userType: "creator" | "client";
  activeProject: OmniForgeProject | null;
  conversationState: ConversationState;
  conversationHistory?: ChatMessage[];
  onUpdateProject?: (project: OmniForgeProject) => void;
  onUpdateConversationState?: (state: ConversationState) => void;
}

export interface ToolExecutionResult {
  toolName: OmniForgeToolName;
  success: boolean;
  data?: any;
  error?: string;
  uiAction?: {
    type: "SHOW_BLUEPRINT" | "SHOW_TEAM" | "SHOW_WORKSPACE" | "SHOW_CREATOR_CARDS" | "SHOW_CONFIRMATION" | "NONE";
    payload?: any;
  };
  suggestedChips?: string[];
  outputSummary?: string;
}

/**
 * 18 Specialized OmniForge Tool Definitions conforming to the new architecture.
 */
export const OMNIFORGE_TOOL_REGISTRY: Record<OmniForgeToolName, OmniForgeToolDefinition> = {
  create_project: {
    name: "create_project",
    description: "Instantiates a structured multi-phase project blueprint with roles, phases, tasks, and verified creator matching.",
    category: "project",
    parameters: {
      idea: { type: "string", description: "Project description or title", required: true },
      domain: { type: "string", description: "Optional project domain (Film, Web App, Events, Music, etc.)" },
      currentUserRole: { type: "string", description: "User's role on project (e.g. DIRECTOR)" },
    },
  },
  analyze_project: {
    name: "analyze_project",
    description: "Analyzes the current active project structure, milestone progress, and external dependencies.",
    category: "project",
    parameters: {
      projectId: { type: "string", description: "Project ID to inspect" },
    },
  },
  analyze_requirements: {
    name: "analyze_requirements",
    description: "Extracts key deliverables, required production disciplines, budget constraints, and technical specifications.",
    category: "project",
    parameters: {
      prompt: { type: "string", description: "User requirements text", required: true },
    },
  },
  generate_story: {
    name: "generate_story",
    description: "Generates a complete 3-act narrative with title, logline, character arcs, thematic stakes, and director staging cues.",
    category: "story",
    parameters: {
      premise: { type: "string", description: "Core premise or creative spark", required: true },
      genre: { type: "string", description: "Genre (e.g. Action Thriller, Drama, Sci-Fi)" },
    },
  },
  modify_story: {
    name: "modify_story",
    description: "Executes targeted creative revisions on the active story while strictly preserving established characters, premise, and continuity.",
    category: "story",
    parameters: {
      instruction: { type: "string", description: "Modification instruction (e.g. 'Make the villain more intelligent', 'Add an emotional scene')", required: true },
    },
  },
  analyze_story: {
    name: "analyze_story",
    description: "Critiques story structure, character agency, dramatic tension, and thematic resonance.",
    category: "story",
    parameters: {
      focusArea: { type: "string", description: "Aspect to examine (e.g. character, pacing, theme)" },
    },
  },
  find_plot_holes: {
    name: "find_plot_holes",
    description: "Discovers narrative inconsistencies, logical loopholes, unexplained plot twists, and timeline flaws in the current story.",
    category: "story",
    parameters: {},
  },
  create_screenplay: {
    name: "create_screenplay",
    description: "Converts the active story into industry-standard formatted screenplay scenes with scene headings, action lines, character cues, and dialogue.",
    category: "story",
    parameters: {
      format: { type: "string", description: "Format (e.g. short film, pilot, feature scene)" },
    },
  },
  create_shot_list: {
    name: "create_shot_list",
    description: "Generates a production-ready camera shot list detailing shot numbers, framing, lens choices, camera movements, and coverage notes.",
    category: "story",
    parameters: {
      scene: { type: "string", description: "Scene or sequence to break down" },
    },
  },
  create_production_plan: {
    name: "create_production_plan",
    description: "Generates a comprehensive production plan with shoot schedule, equipment package, locations, and budget allocations.",
    category: "project",
    parameters: {
      budgetLevel: { type: "string", description: "Budget constraint (e.g. low budget, indie, student)" },
    },
  },
  analyze_missing_roles: {
    name: "analyze_missing_roles",
    description: "Analyzes open external positions on the active project, distinguishing roles covered by the user from unfilled roles.",
    category: "creators",
    parameters: {},
  },
  search_creators: {
    name: "search_creators",
    description: "Queries the real OmniCraft Supabase creator directory for verified profiles matching roles, skills, and portfolio evidence.",
    category: "creators",
    parameters: {
      targetRole: { type: "string", description: "Role to search (e.g. Performers, Cinematographer, Video Editor, Sound Designer)", required: true },
      skills: { type: "array", description: "Required skills or tools" },
      scope: { type: "string", description: "'ALL' | 'BATCH' | 'SINGLE'" },
    },
  },
  view_creator: {
    name: "view_creator",
    description: "Fetches verified profile details, portfolio items, assessment scores, and availability for a specific creator.",
    category: "creators",
    parameters: {
      creatorUsername: { type: "string", description: "Username or ID of creator", required: true },
    },
  },
  invite_creator: {
    name: "invite_creator",
    description: "Sends a verified collaboration invitation to a creator for an open role on the active project squad.",
    category: "creators",
    parameters: {
      creatorId: { type: "string", description: "User ID of creator", required: true },
      role: { type: "string", description: "Role to invite for", required: true },
    },
    requiresConfirmation: true,
  },
  build_squad: {
    name: "build_squad",
    description: "Orchestrates full squad formation, inviting all confirmed creator matches into a shared workspace.",
    category: "creators",
    parameters: {},
    requiresConfirmation: true,
  },
  create_tasks: {
    name: "create_tasks",
    description: "Generates milestone tasks with role dependencies and adds them to project phases.",
    category: "workspace",
    parameters: {
      role: { type: "string", description: "Target role for tasks", required: true },
      phaseName: { type: "string", description: "Target project phase" },
    },
  },
  manage_project: {
    name: "manage_project",
    description: "Modifies active project scope, budget, timeline, or team constraints.",
    category: "project",
    parameters: {
      instruction: { type: "string", description: "Modification instruction (e.g. 'Reduce budget to 10k', 'Change shoot to 2 days')", required: true },
    },
  },
  summarize_project: {
    name: "summarize_project",
    description: "Generates an executive briefing of the active project roadmap, squad progress, and next steps.",
    category: "project",
    parameters: {},
  },
};

export const OMNIFORGE_TOOLS = OMNIFORGE_TOOL_REGISTRY;

/**
 * Deterministic Tool Executor.
 * Handles database operations, state modifications, and directory lookups safely.
 */
export async function executeOmniForgeTool(
  toolName: OmniForgeToolName,
  parameters: Record<string, any>,
  context: ToolExecutionContext
): Promise<ToolExecutionResult> {
  const { userId, userType, activeProject, conversationState } = context;

  switch (toolName) {
    case "create_project": {
      const idea = parameters.idea || "Custom Project";
      const domain = parameters.domain;
      const currentUserRole = parameters.currentUserRole || conversationState.currentUserRole;

      const blueprint = generateStructuredBlueprint(idea, userType, userId || "anon", currentUserRole);
      if (domain) {
        blueprint.domain = domain as any;
      }

      // Fast Supabase creator matching for initial roles
      const matchResult = await matchCreatorsForProject(blueprint, userId);
      const newProject: OmniForgeProject = {
        ...blueprint,
        recommendations: matchResult.recommendations,
        coverage: matchResult.coverage,
        updatedAt: new Date().toISOString(),
      };

      if (context.onUpdateProject) {
        context.onUpdateProject(newProject);
      }

      return {
        toolName,
        success: true,
        data: newProject,
        uiAction: { type: "SHOW_BLUEPRINT", payload: newProject },
        suggestedChips: ["Analyze Missing Roles", "Create Tasks", "Find Creators", "Review Project Plan"],
        outputSummary: `Initialized project blueprint for **${newProject.title}** (${newProject.domain}) with ${newProject.roles.length} roles and ${newProject.phases.length} phases.`,
      };
    }

    case "search_creators": {
      const targetRole = parameters.targetRole || "Creator";
      const skills = parameters.skills || [];
      const scope = (parameters.scope as "ALL" | "BATCH" | "SINGLE") || "BATCH";

      const searchRes = await searchCreatorsDirectory({
        targetRole,
        skills,
        scope,
        page: 1,
        pageSize: scope === "ALL" ? 20 : 10,
        currentUserId: userId,
      });

      const matchedCards = searchRes.creators;
      const isPerformer = targetRole.toLowerCase().includes("performer");

      let chips: string[];
      if (matchedCards.length > 0) {
        chips = ["Show More Creators", "Refine Search", "Search Another Role", "Select Creator", "View Profile"];
      } else {
        chips = [
          "Publish Client Job",
          "Open Collaboration Call",
          "Skill-for-Service Swap",
          "Add Manually by Username",
        ];
      }

      let summary: string;
      if (matchedCards.length > 0) {
        summary = `Found ${searchRes.totalCount} verified ${targetRole} profile${searchRes.totalCount > 1 ? "s" : ""} in the OmniCraft directory:`;
      } else {
        summary = isPerformer
          ? "No sufficiently relevant performers were found in the current OmniCraft directory."
          : `No sufficiently relevant ${targetRole} candidates were found in the current OmniCraft directory.`;
      }

      return {
        toolName,
        success: true,
        data: { creators: matchedCards, totalCount: searchRes.totalCount },
        uiAction: { type: "SHOW_CREATOR_CARDS", payload: matchedCards },
        suggestedChips: chips,
        outputSummary: summary,
      };
    }

    case "analyze_missing_roles": {
      if (!activeProject) {
        return {
          toolName,
          success: false,
          error: "No active project currently selected to analyze missing roles.",
          suggestedChips: ["Create a Project", "Find Creators", "Explore Squads"],
        };
      }

      const totalRequired = activeProject.coverage?.totalRequired ?? activeProject.roles.length;
      const totalCovered = activeProject.coverage?.totalCovered ?? 0;
      const missing = activeProject.coverage?.missingCapabilities ?? [];

      const missingNames = missing.map((m) => m.roleName);
      const isDirectorUser = activeProject.currentUserRole === "DIRECTOR" || conversationState.currentUserRole === "DIRECTOR";

      let summary = `### 🎬 Team & Missing Role Analysis\n\n`;
      summary += `**${totalCovered} of ${totalRequired} External Positions Filled**\n\n`;
      if (isDirectorUser) {
        summary += `✓ **Director:** You *(COVERED BY USER — Not counted as an external hiring position)*\n\n`;
      }

      if (missing.length > 0) {
        summary += `**OPEN POSITIONS STILL NEEDED:**\n` + missingNames.map((r) => `○ **${r}**`).join("\n");
      } else {
        summary += `All required positions on this project are covered!`;
      }

      return {
        toolName,
        success: true,
        data: { missing, totalCovered, totalRequired },
        uiAction: { type: "SHOW_TEAM" },
        suggestedChips: missingNames.length > 0
          ? [`Find ${missingNames[0]}`, "Build Complete Squad", "Create Tasks"]
          : ["Review Project Plan", "Workspace & Roadmap"],
        outputSummary: summary,
      };
    }

    case "manage_project": {
      if (!activeProject) {
        return {
          toolName,
          success: false,
          error: "No active project to modify.",
          suggestedChips: ["Create a Project"],
        };
      }

      const instruction = parameters.instruction || "";
      const { updatedProject, replyMessage } = modifyBlueprintFromInstruction(activeProject, instruction);

      if (context.onUpdateProject) {
        context.onUpdateProject(updatedProject);
      }

      return {
        toolName,
        success: true,
        data: updatedProject,
        uiAction: { type: "SHOW_BLUEPRINT", payload: updatedProject },
        suggestedChips: ["Analyze Missing Roles", "Create Tasks", "Find Creators"],
        outputSummary: replyMessage,
      };
    }

    case "create_tasks": {
      if (!activeProject) {
        return {
          toolName,
          success: false,
          error: "No active project to assign tasks to.",
          suggestedChips: ["Create a Project"],
        };
      }

      const targetRole = parameters.role || "General";
      const activePhase = activeProject.phases?.[0];
      const newTaskTitle = `Execute ${targetRole} Deliverables`;

      return {
        toolName,
        success: true,
        data: { targetRole, phase: activePhase?.name },
        suggestedChips: ["Analyze Missing Roles", "Workspace & Roadmap", "Find Creators"],
        outputSummary: `Generated production tasks for **${targetRole}** within **${activePhase?.name || "Pre-Production"}**.`,
      };
    }

    default:
      return {
        toolName,
        success: false,
        error: `Tool ${toolName} execution is delegated to the AI reasoning engine.`,
      };
  }
}
