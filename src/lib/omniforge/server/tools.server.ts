import { supabase } from "@/integrations/supabase/client";
import {
  OmniForgeProject,
  ProjectTask,
  TaskStatus,
  CreatorRecommendation,
  RealCreatorProfile,
} from "../types";
import { LLMToolDefinition } from "./llm-provider.server";
import { matchCreatorsForSingleRole, matchCreatorsForProject } from "../matcher";
import { searchRealSkillSwapListings } from "../skill-swap-matcher";
import { generateStructuredBlueprint, modifyBlueprintFromInstruction } from "../engine-blueprint";
import { convertProjectToSquad } from "../squad-bridge";

export interface ToolExecutionContext {
  authenticatedUserId: string;
  userType: "creator" | "client";
  activeProject: OmniForgeProject | null;
  onUpdateActiveProject?: (project: OmniForgeProject) => void;
}

export interface ToolResult {
  toolName: string;
  success: boolean;
  data?: any;
  error?: string;
  requiresUserConfirmation?: boolean;
  confirmationDetails?: {
    action: string;
    description: string;
    payload: any;
  };
}

/**
 * The 15 canonical OmniForge LLM Tool Definitions conforming to Phase 4.
 */
export const OMNIFORGE_TOOL_DEFINITIONS: LLMToolDefinition[] = [
  {
    name: "GetActiveProject",
    description: "Retrieves the currently loaded active project details, phases, tasks, and team structure.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "GetProjectRequirements",
    description: "Retrieves the comprehensive list of deliverables, prerequisites, and requirements for the active project.",
    parameters: {
      type: "object",
      properties: {
        projectId: { type: "string", description: "Optional project ID. If omitted, uses active project." },
      },
    },
  },
  {
    name: "GenerateProjectBlueprint",
    description: "Generates a structured multi-phase project blueprint from an idea, including stages, tasks, dependencies, and roles.",
    parameters: {
      type: "object",
      properties: {
        idea: { type: "string", description: "Detailed description of the project idea, goals, or requirements." },
        domain: { type: "string", description: "Domain (e.g. Film, Web App, Music, Mobile App, Event)." },
      },
      required: ["idea"],
    },
  },
  {
    name: "UpdateProjectRequirements",
    description: "Updates or modifies project scope, constraints, phases, or team requirements (e.g. reducing team size, removing roles).",
    parameters: {
      type: "object",
      properties: {
        instruction: { type: "string", description: "Modification instruction (e.g. 'I only have 3 people', 'remove the editor')." },
      },
      required: ["instruction"],
    },
  },
  {
    name: "SearchCreators",
    description: "Searches verified real creators in the OmniCraft database matching specified roles, skills, or dual capabilities.",
    parameters: {
      type: "object",
      properties: {
        roleName: { type: "string", description: "Name of the role (e.g. 'Film Director', 'Video Editor', 'Cinematographer', 'UI/UX Designer')." },
        requiredSkills: { type: "string", description: "Comma-separated list of required concrete skills or tools." },
      },
      required: ["roleName"],
    },
  },
  {
    name: "GetCreatorPortfolio",
    description: "Fetches verified portfolio items, case studies, and work samples for a specific creator ID.",
    parameters: {
      type: "object",
      properties: {
        creatorId: { type: "string", description: "UUID of the creator profile to inspect." },
      },
      required: ["creatorId"],
    },
  },
  {
    name: "SearchSkillSwapListings",
    description: "Searches active non-monetary skill exchange listings where creators trade skills (e.g. video editing for web development).",
    parameters: {
      type: "object",
      properties: {
        offeredSkill: { type: "string", description: "Skill the user offers (e.g. 'Video Editing')." },
        neededSkill: { type: "string", description: "Skill the user needs (e.g. 'Cinematography', 'Music Production')." },
      },
    },
  },
  {
    name: "SearchExistingSquads",
    description: "Searches existing active squads and collaborative teams in OmniCraft.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Keyword or specialty to search squads for." },
      },
    },
  },
  {
    name: "CreateCollaborationRequest",
    description: "Creates an official collaboration inquiry or client job request to invite an external or specific creator.",
    parameters: {
      type: "object",
      properties: {
        creatorId: { type: "string", description: "UUID of the recipient creator." },
        message: { type: "string", description: "Message detailing project role and scope." },
      },
      required: ["creatorId", "message"],
    },
  },
  {
    name: "CreateSquad",
    description: "Proposes initializing an official Squad workspace on OmniCraft from the project blueprint. Requires user confirmation.",
    parameters: {
      type: "object",
      properties: {
        squadName: { type: "string", description: "Proposed title of the squad." },
        confirmed: { type: "string", description: "Set to 'true' only if user explicitly confirmed creation.", enum: ["true", "false"] },
      },
      required: ["squadName"],
    },
  },
  {
    name: "InviteSquadMembers",
    description: "Dispatches pending squad invitations to recommended creators for the active squad. Requires user confirmation.",
    parameters: {
      type: "object",
      properties: {
        squadId: { type: "string", description: "UUID of the squad to invite members into." },
        creatorIds: { type: "string", description: "Comma-separated UUIDs of creators to invite." },
      },
      required: ["squadId", "creatorIds"],
    },
  },
  {
    name: "GetProjectTasks",
    description: "Lists all tasks for the active project broken down by phase, status, assigned creator, and dependencies.",
    parameters: {
      type: "object",
      properties: {
        statusFilter: { type: "string", description: "Optional filter by task status: to_do, in_progress, completed.", enum: ["to_do", "in_progress", "completed", "all"] },
      },
    },
  },
  {
    name: "GetProjectProgress",
    description: "Calculates overall completion percentage, critical path progress, and pending milestones.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "UpdateTaskStatus",
    description: "Updates the workflow status of an individual project task (e.g. to_do -> in_progress -> completed).",
    parameters: {
      type: "object",
      properties: {
        taskId: { type: "string", description: "ID of the task to update." },
        newStatus: { type: "string", description: "Target status", enum: ["to_do", "in_progress", "review", "completed"] },
      },
      required: ["taskId", "newStatus"],
    },
  },
  {
    name: "GetMissingCapabilities",
    description: "Identifies unfilled project roles, missing skills on the team, and suggests alternative actions (Job, Skill Swap).",
    parameters: {
      type: "object",
      properties: {},
    },
  },
];

/**
 * Secure Server-side Tool Execution Engine.
 * Validates identity, authorizes actions, runs database queries, and guards mutations.
 */
export async function executeServerTool(
  toolName: string,
  args: Record<string, any>,
  ctx: ToolExecutionContext
): Promise<ToolResult> {
  const { authenticatedUserId, userType, activeProject } = ctx;

  switch (toolName) {
    case "GetActiveProject": {
      if (!activeProject) {
        return {
          toolName,
          success: true,
          data: { status: "no_active_project", message: "No project currently active. User can create one by describing an idea." },
        };
      }
      return {
        toolName,
        success: true,
        data: {
          id: activeProject.id,
          title: activeProject.title,
          domain: activeProject.domain,
          stage: activeProject.stage,
          goal: activeProject.goal,
          phasesCount: activeProject.phases?.length || 0,
          rolesCount: activeProject.roles?.length || 0,
          assignedCreatorsCount: activeProject.recommendations?.length || 0,
        },
      };
    }

    case "GetProjectRequirements": {
      if (!activeProject) {
        return { toolName, success: false, error: "No active project found to retrieve requirements." };
      }
      return {
        toolName,
        success: true,
        data: {
          projectTitle: activeProject.title,
          deliverables: (activeProject.deliverables || []).map((d) => ({ title: d.title, description: d.description })),
          requirements: activeProject.requirements || [],
          workflowStages: activeProject.workflowStages || [],
        },
      };
    }

    case "GenerateProjectBlueprint": {
      const idea = String(args.idea || "").trim();
      if (!idea) {
        return { toolName, success: false, error: "Project idea parameter is required." };
      }
      const blueprint = generateStructuredBlueprint(idea, userType, authenticatedUserId);
      return {
        toolName,
        success: true,
        data: {
          blueprint,
          summary: `Generated ${blueprint.phases.length} stages and ${blueprint.roles.length} roles for "${blueprint.title}".`,
        },
      };
    }

    case "UpdateProjectRequirements": {
      if (!activeProject) {
        return { toolName, success: false, error: "No active project loaded to modify." };
      }
      const instruction = String(args.instruction || "");
      const { updatedProject, replyMessage } = modifyBlueprintFromInstruction(activeProject, instruction);
      return {
        toolName,
        success: true,
        data: {
          updatedProject,
          replyMessage,
        },
      };
    }

    case "SearchCreators": {
      const roleName = String(args.roleName || "Film Director");
      const requiredSkills = args.requiredSkills ? String(args.requiredSkills).split(",").map((s) => s.trim()) : [];
      const found = await matchCreatorsForSingleRole(roleName, requiredSkills, authenticatedUserId);
      return {
        toolName,
        success: true,
        data: {
          roleName,
          matchCount: found.length,
          creators: found.slice(0, 5).map((c) => ({
            id: c.creator.id,
            name: c.creator.fullName || c.creator.username,
            matchScore: c.matchScore,
            verifiedSkills: c.creator.skills,
            portfolioCount: c.creator.portfolioItemsCount,
            matchReason: c.matchReason,
          })),
        },
      };
    }

    case "GetCreatorPortfolio": {
      const creatorId = String(args.creatorId || "").trim();
      if (!creatorId) return { toolName, success: false, error: "creatorId is required" };

      const { data: items, error } = await supabase
        .from("portfolios")
        .select("id, title, media_url, media_type, category, description, created_at")
        .eq("user_id", creatorId)
        .limit(10);

      if (error) {
        return { toolName, success: false, error: error.message };
      }

      return {
        toolName,
        success: true,
        data: {
          creatorId,
          portfolioItems: items || [],
        },
      };
    }

    case "SearchSkillSwapListings": {
      const listings = await searchRealSkillSwapListings({
        offerSkill: args.offeredSkill ? String(args.offeredSkill) : undefined,
        needSkillOrRole: args.neededSkill ? String(args.neededSkill) : undefined,
        currentUserId: authenticatedUserId,
        limit: 5,
      });
      return {
        toolName,
        success: true,
        data: {
          matchedCount: listings.length,
          listings: listings.slice(0, 5).map((l) => ({
            id: l.id,
            title: l.title,
            creatorName: l.creatorName,
            teachSkills: l.teachSkills,
            learnSkills: l.learnSkills,
            matchReason: l.matchReason,
          })),
        },
      };
    }

    case "SearchExistingSquads": {
      const query = String(args.query || "");
      let qb = supabase.from("squads").select("id, name, description, specialty, owner_id").limit(10);
      if (query) {
        qb = qb.ilike("name", `%${query}%`);
      }
      const { data: squads, error } = await qb;
      if (error) return { toolName, success: false, error: error.message };
      return {
        toolName,
        success: true,
        data: { squads: squads || [] },
      };
    }

    case "CreateSquad": {
      if (!activeProject) {
        return { toolName, success: false, error: "Cannot create squad without an active project." };
      }
      const isConfirmed = String(args.confirmed || "").toLowerCase() === "true";
      if (!isConfirmed) {
        // Return confirmation requirement
        return {
          toolName,
          success: true,
          requiresUserConfirmation: true,
          confirmationDetails: {
            action: "create_squad",
            description: `Confirm launching Squad "${activeProject.title}" with invitations to ${activeProject.recommendations?.length || 0} creators?`,
            payload: { projectId: activeProject.id },
          },
          data: { status: "confirmation_pending", message: "User confirmation requested before squad creation." },
        };
      }

      // Execute actual squad creation via squad-bridge
      const result = await convertProjectToSquad(activeProject, authenticatedUserId);
      return {
        toolName,
        success: result.success,
        data: result,
        error: result.error,
      };
    }

    case "InviteSquadMembers": {
      const squadId = String(args.squadId || "");
      const creatorIdsStr = String(args.creatorIds || "");
      const creatorIds = creatorIdsStr.split(",").map((s) => s.trim()).filter(Boolean);

      if (!squadId || creatorIds.length === 0) {
        return { toolName, success: false, error: "squadId and creatorIds are required." };
      }

      // Verify user owns or administers squad
      const { data: memberCheck } = await supabase
        .from("squad_members")
        .select("role")
        .eq("squad_id", squadId)
        .eq("user_id", authenticatedUserId)
        .maybeSingle();

      if (!memberCheck || (memberCheck.role !== "admin" && memberCheck.role !== "owner")) {
        return { toolName, success: false, error: "Unauthorized: only squad owners or admins can dispatch invitations." };
      }

      let count = 0;
      for (const cid of creatorIds) {
        const { error } = await (supabase as any).from("squad_invitations").insert({
          squad_id: squadId,
          inviter_id: authenticatedUserId,
          invitee_id: cid,
          status: "pending",
        });
        if (!error) count++;
      }

      return {
        toolName,
        success: true,
        data: { squadId, invitedCount: count },
      };
    }

    case "GetProjectTasks": {
      if (!activeProject) {
        return { toolName, success: false, error: "No active project loaded." };
      }
      const filter = args.statusFilter || "all";
      const allTasks = (activeProject.phases || []).flatMap((p) => p.tasks || []);
      const filtered = filter === "all" ? allTasks : allTasks.filter((t) => t.status === filter);
      return {
        toolName,
        success: true,
        data: {
          totalTasks: allTasks.length,
          tasks: filtered.map((t) => ({
            id: t.id,
            title: t.title,
            role: t.requiredRole,
            priority: t.priority,
            status: t.status,
            estimatedDuration: t.estimatedDuration,
            dependencies: t.dependencies || [],
          })),
        },
      };
    }

    case "GetProjectProgress": {
      if (!activeProject) {
        return { toolName, success: false, error: "No active project loaded." };
      }
      const allTasks = (activeProject.phases || []).flatMap((p) => p.tasks || []);
      const completed = allTasks.filter((t) => t.status === "completed").length;
      const percent = allTasks.length > 0 ? Math.round((completed / allTasks.length) * 100) : 0;
      return {
        toolName,
        success: true,
        data: {
          projectTitle: activeProject.title,
          totalTasks: allTasks.length,
          completedTasks: completed,
          completionPercentage: percent,
          activeStage: activeProject.stage,
        },
      };
    }

    case "UpdateTaskStatus": {
      if (!activeProject) {
        return { toolName, success: false, error: "No active project loaded." };
      }
      const taskId = String(args.taskId || "");
      const newStatus = args.newStatus as TaskStatus;

      let found = false;
      const updatedPhases = (activeProject.phases || []).map((ph) => ({
        ...ph,
        tasks: (ph.tasks || []).map((t) => {
          if (t.id === taskId) {
            found = true;
            return { ...t, status: newStatus };
          }
          return t;
        }),
      }));

      if (!found) {
        return { toolName, success: false, error: `Task with ID ${taskId} not found in project.` };
      }

      activeProject.phases = updatedPhases;
      if (ctx.onUpdateActiveProject) {
        ctx.onUpdateActiveProject(activeProject);
      }

      return {
        toolName,
        success: true,
        data: { taskId, newStatus, message: `Task status updated to ${newStatus}.` },
      };
    }

    case "GetMissingCapabilities": {
      if (!activeProject) {
        return { toolName, success: false, error: "No active project loaded." };
      }
      return {
        toolName,
        success: true,
        data: {
          coveragePercentage: activeProject.coverage?.percentage || 0,
          missingCapabilities: activeProject.coverage?.missingCapabilities || [],
        },
      };
    }

    default:
      return {
        toolName,
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
  }
}
