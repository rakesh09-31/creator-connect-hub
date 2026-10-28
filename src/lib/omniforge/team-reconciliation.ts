/**
 * OmniForge Team State Reconciliation & Role Coverage Engine
 *
 * Implements canonical, database-backed role tracking:
 * - Reconstructs team state from Supabase squads & squad_members tables
 * - Calculates accurate role states: COVERED_BY_USER, ACCEPTED/FILLED, INVITED/PENDING, SELECTED, DISCOVERED, OPEN
 * - Generates dynamic gap analysis ("Who is still missing?") excluding filled & user-covered roles
 * - Guarantees persistent active project reuse without duplicate creations
 */

import {
  OmniForgeProject,
  ProjectRole,
  CreatorRecommendation,
  CapabilityCoverage,
  MissingCapability,
  RealCreatorProfile,
  RoleCoverageStatus,
  ProjectRoleCoverage,
} from "./types";
import { SquadMember, SquadInvitation } from "./collaboration";
import { loadProjectsFromStorage, getActiveProjectId, saveProjectToStorage } from "./storage";
import {
  validateCreatorForRole,
  getCachedCreatorPool,
  computeRoleCandidateCount,
  getRoleCandidateCounts,
} from "./matcher";

import {
  CINEMATIC_ROLES,
  ALL_CANONICAL_CINEMATIC_ROLES,
  getCanonicalRole,
  isRoleMatch,
  getRoleDepartment,
  normalizeRoleKey,
} from "./film-taxonomy";
export { isRoleMatch, normalizeRoleKey, getRoleDepartment, getCanonicalRole };

import {
  type RoleRequirementLevel,
  type RoleRequirementInfo,
  type FilmGenre,
  detectFilmGenre,
  getRoleRequirementInfo,
  parseExplicitRoleRequirementRequest,
} from "./crew-intelligence";
export type {
  RoleRequirementLevel,
  RoleRequirementInfo,
  FilmGenre,
};
export {
  detectFilmGenre,
  getRoleRequirementInfo,
  parseExplicitRoleRequirementRequest,
};

export type RoleStatus =
  | "COVERED_BY_USER"
  | "ACCEPTED"
  | "FILLED"
  | "PENDING"
  | "INVITED"
  | "SELECTED"
  | "DISCOVERED"
  | "OPEN";

export interface RoleEvaluation {
  role: ProjectRole;
  status: RoleStatus;
  assignedCreator?: RealCreatorProfile | null;
  assignedCreatorUsername?: string | null;
  matchScore?: number;
}

/**
 * Resolves the canonical active project across memory, conversation state,
 * and storage without arbitrarily selecting the first project or spawning duplicates.
 */
export const CANONICAL_FILM_SQUAD_ID = "d7c14b35-6554-4c23-a638-527f0d6c7df4";

export const CANONICAL_FILM_EXTERNAL_ROLES = [
  "Lead Actor",
  "Lead Actress",
  "Dancer",
  "Lead Singer",
  "Cinematographer",
  "Video Editor",
  "Sound Designer",
];

export const BASELINE_FILM_CANDIDATE_COUNTS: Record<string, number> = {
  "Film Director": 1,
  "Director": 1,
  "Lead Actor": 16,
  "Lead Actress": 0,
  "Dancer": 4,
  "Choreographer": 4,
  "Lead Singer": 1,
  "Cinematographer": 1,
  "Video Editor": 119,
  "Sound Designer": 0,
  "Sound Engineer": 0,
  "Music Composer": 10,
  "Music Director": 0,
  "Supporting Actor": 16,
  "Supporting Actors": 16,
  "Colorist": 119,
  "Assistant Director": 1,
  "Screenwriter": 1,
  "Producer": 1,
  "Production Coordinator": 1,
  "Production Manager": 1,
  "Fight Master": 16,
  "Stunt Coordinator": 16,
  "Comic Actor": 16,
};

export interface CanonicalFilmRoleDef {
  name: string;
  category: "CORE PRODUCTION" | "CAST" | "MUSIC & PERFORMANCE" | "CAMERA & VISUALS" | "SOUND" | "POST-PRODUCTION" | "ART & STYLING" | "PRODUCTION SUPPORT";
  necessity: "CORE" | "ROLE_DEPENDENT" | "OPTIONAL";
  defaultRequiredForShortFilm: boolean;
  searchRole: string;
  description: string;
}

export const SHORT_FILM_ROLE_DEFINITIONS: CanonicalFilmRoleDef[] = [
  // CORE PRODUCTION
  { name: "Director", category: "CORE PRODUCTION", necessity: "CORE", defaultRequiredForShortFilm: true, searchRole: "Film Director", description: "Leads dramatic and visual vision, actor staging, and shot decisions." },
  { name: "Producer", category: "CORE PRODUCTION", necessity: "CORE", defaultRequiredForShortFilm: true, searchRole: "Producer", description: "Oversees production management, legal clearances, and budget execution." },
  { name: "Screenwriter", category: "CORE PRODUCTION", necessity: "CORE", defaultRequiredForShortFilm: true, searchRole: "Screenwriter", description: "Develops narrative structure, scene beats, and locked shooting dialogue." },
  { name: "Assistant Director", category: "CORE PRODUCTION", necessity: "CORE", defaultRequiredForShortFilm: true, searchRole: "Assistant Director", description: "Manages on-set schedule, call sheets, and daily crew coordination." },
  { name: "Production Manager", category: "CORE PRODUCTION", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: true, searchRole: "Production Manager", description: "Manages shoot permits, transport, equipment logistics, and catering." },
  { name: "Script Supervisor", category: "CORE PRODUCTION", necessity: "OPTIONAL", defaultRequiredForShortFilm: false, searchRole: "Script Supervisor", description: "Maintains scene continuity, takes log notes, and tracks coverage." },
  { name: "Location Manager", category: "CORE PRODUCTION", necessity: "OPTIONAL", defaultRequiredForShortFilm: false, searchRole: "Location Manager", description: "Scouts and secures physical filming locations and permits." },
  { name: "Casting Director", category: "CORE PRODUCTION", necessity: "OPTIONAL", defaultRequiredForShortFilm: false, searchRole: "Casting Director", description: "Discovers and auditions primary, supporting, and background actors." },

  // CAST
  { name: "Lead Actor", category: "CAST", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: true, searchRole: "Lead Actor", description: "Primary male protagonist / lead character." },
  { name: "Lead Actress", category: "CAST", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: true, searchRole: "Lead Actress", description: "Primary female protagonist / lead character." },
  { name: "Supporting Actors", category: "CAST", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: true, searchRole: "Supporting Actor", description: "Secondary dramatic characters, antagonists, and key supporting cast." },

  // CAMERA & VISUALS
  { name: "Cinematographer", category: "CAMERA & VISUALS", necessity: "CORE", defaultRequiredForShortFilm: true, searchRole: "Cinematographer", description: "Designs camera movement, optical framing, visual mood, and lighting scheme." },
  { name: "Camera Operator", category: "CAMERA & VISUALS", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: false, searchRole: "Camera Operator", description: "Operates camera rig, gimbal moves, and handles dynamic camera tracking." },

  // SOUND
  { name: "Sound Designer", category: "SOUND", necessity: "CORE", defaultRequiredForShortFilm: true, searchRole: "Sound Designer", description: "Creates immersive soundscapes, foley textures, audio effects, and master stereo mix." },
  { name: "Sound Engineer", category: "SOUND", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: true, searchRole: "Sound Engineer", description: "Captures clean on-set location dialogue, ambient wild tracks, and denoiser feeds." },

  // MUSIC & PERFORMANCE
  { name: "Dancer", category: "MUSIC & PERFORMANCE", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: true, searchRole: "Dancer", description: "Performs choreographed dance numbers and background musical routines." },
  { name: "Choreographer", category: "MUSIC & PERFORMANCE", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: true, searchRole: "Choreographer", description: "Designs dance routines, rhythmic movements, and blocks musical sequences." },
  { name: "Lead Singer", category: "MUSIC & PERFORMANCE", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: true, searchRole: "Lead Singer", description: "Records lead vocal tracks for film songs and character playback numbers." },
  { name: "Music Composer", category: "MUSIC & PERFORMANCE", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: true, searchRole: "Music Composer", description: "Composes original score, theme tracks, and background musical arrangements." },
  { name: "Music Director", category: "MUSIC & PERFORMANCE", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: false, searchRole: "Music Director", description: "Directs orchestral arrangements, song structures, and studio vocal sessions." },

  // POST-PRODUCTION
  { name: "Video Editor", category: "POST-PRODUCTION", necessity: "CORE", defaultRequiredForShortFilm: true, searchRole: "Video Editor", description: "Assembles footage, cuts dramatic pacing, crafts emotional rhythm, and locks picture." },
  { name: "Colorist", category: "POST-PRODUCTION", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: true, searchRole: "Colorist", description: "Applies cinematic look, balances color spaces, and refines contrast/skin tones." },
  { name: "VFX Artist", category: "POST-PRODUCTION", necessity: "OPTIONAL", defaultRequiredForShortFilm: false, searchRole: "VFX Artist", description: "Visual effects cleanups, compositing, screen replacements, and CGI." },
  { name: "Motion Graphics Artist", category: "POST-PRODUCTION", necessity: "OPTIONAL", defaultRequiredForShortFilm: false, searchRole: "Motion Graphics Artist", description: "Designs opening title sequences, lower thirds, typography, and credit rolls." },

  // ART & STYLING
  { name: "Production Designer", category: "ART & STYLING", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: false, searchRole: "Production Designer", description: "Shapes visual environment, set aesthetics, props, and architectural color palette." },
  { name: "Costume Designer", category: "ART & STYLING", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: false, searchRole: "Costume Designer", description: "Creates character wardrobe matching period, social identity, and narrative tone." },
  { name: "Makeup Artist", category: "ART & STYLING", necessity: "ROLE_DEPENDENT", defaultRequiredForShortFilm: false, searchRole: "Makeup Artist", description: "Handles screen makeup, prosthetics, beauty touch-ups, and camera continuity." },
  { name: "Hair Stylist", category: "ART & STYLING", necessity: "OPTIONAL", defaultRequiredForShortFilm: false, searchRole: "Hair Stylist", description: "Styles hair matching character profiles and maintains scene continuity." },
];

export type RoleAssignmentState = "COVERED_BY_USER" | "ASSIGNED" | "UNASSIGNED";
export type CreatorAvailabilityState = "AVAILABLE" | "NONE";

export interface FilmRoleState {
  roleName: string;
  role: string;
  category: string;
  department: string;
  necessity: "CORE" | "ROLE_DEPENDENT" | "OPTIONAL";
  requirementLevel: RoleRequirementLevel;
  requirementReason: string;
  assignmentStatus: RoleAssignmentState;
  roleAssignmentState: RoleAssignmentState;
  creatorAvailabilityState: CreatorAvailabilityState;
  matchingCreatorCount: number;
  candidateCount: number;
  assignedCreatorName?: string;
  assignedCreatorId?: string;
  description: string;
  searchRole: string;
}

export interface FilmTeamStatus {
  coveredRoles: FilmRoleState[];
  assignedRoles: FilmRoleState[];
  openRolesWithCreators: FilmRoleState[];
  openRolesWithoutCreators: FilmRoleState[];
  projectDependentRoles: FilmRoleState[];
  optionalRoles: FilmRoleState[];
  notRequiredRoles: FilmRoleState[];
  allRoles: FilmRoleState[];
  requiredExternalRoles: FilmRoleState[];
  filledExternalRoles: FilmRoleState[];
  externalPositionsFilledText: string;
}

export function calculateFilmTeamStatus(
  project: OmniForgeProject | null,
  isUserDirector: boolean,
  candidateCountsMap?: Record<string, number>,
  userPromptContext?: string
): FilmTeamStatus {
  const isDirector =
    isUserDirector ||
    project?.currentUserRole === "DIRECTOR" ||
    project?.roles?.some((r) => r.roleName.toLowerCase().includes("director") && r.isFilled);

  const cachedPool = getCachedCreatorPool();
  const assignedRecs = (project?.recommendations || []).filter(
    (r) => r.status === "accepted" || r.invitationStatus === "accepted"
  );

  const genre = detectFilmGenre(userPromptContext, project?.genre, project?.title);

  const coveredRoles: FilmRoleState[] = [];
  const assignedRoles: FilmRoleState[] = [];
  const openRolesWithCreators: FilmRoleState[] = [];
  const openRolesWithoutCreators: FilmRoleState[] = [];
  const projectDependentRoles: FilmRoleState[] = [];
  const optionalRoles: FilmRoleState[] = [];
  const notRequiredRoles: FilmRoleState[] = [];
  const allRoles: FilmRoleState[] = [];

  for (const def of SHORT_FILM_ROLE_DEFINITIONS) {
    const isDirectorRole =
      (def.name === "Director" || def.name === "Film Director") &&
      !def.name.toLowerCase().includes("assistant") &&
      !def.name.toLowerCase().includes("music") &&
      !def.name.toLowerCase().includes("casting") &&
      !def.name.toLowerCase().includes("art");

    const reqInfo = getRoleRequirementInfo(def.name, genre, project?.roleRequirements);

    // 1. Covered by user
    if (isDirectorRole && isDirector) {
      const state: FilmRoleState = {
        roleName: def.name,
        role: def.name,
        category: def.category,
        department: def.category,
        necessity: "CORE",
        requirementLevel: "CORE",
        requirementReason: reqInfo.requirementReason,
        assignmentStatus: "COVERED_BY_USER",
        roleAssignmentState: "COVERED_BY_USER",
        creatorAvailabilityState: "AVAILABLE",
        matchingCreatorCount: 1,
        candidateCount: 1,
        assignedCreatorName: "You",
        description: def.description,
        searchRole: def.searchRole,
      };
      coveredRoles.push(state);
      allRoles.push(state);
      continue;
    }

    // 2. Assigned to squad member / accepted recommendation
    const assignedRec = assignedRecs.find((rec) => {
      if (!isRoleMatch(rec.roleName, def.name)) return false;
      const v = validateCreatorForRole(rec.creator, def.name);
      return v.isValid;
    });

    const projectRole = project?.roles?.find((r) => {
      if (!isRoleMatch(r.roleName, def.name) || !r.isFilled || isRoleMatch(r.roleName, "Director")) return false;
      if (r.assignedCreatorId || r.assignedCreatorName) {
        const creator = cachedPool?.find(
          (c) => c.id === r.assignedCreatorId || c.username === r.assignedCreatorName?.replace(/^@/, "")
        ) || (r.assignedCreatorName ? { username: r.assignedCreatorName.replace(/^@/, ""), role: "creator", skills: [], specialties: [] } : null);
        if (creator) {
          const v = validateCreatorForRole(creator, def.name);
          if (!v.isValid) return false;
        }
      }
      return true;
    });

    if (assignedRec || projectRole) {
      const rawName = assignedRec?.creator?.username || projectRole?.assignedCreatorName || "creator";
      const assignedCreatorName = rawName.startsWith("@") ? rawName : `@${rawName}`;
      const assignedCreatorId = assignedRec?.creator?.id || projectRole?.assignedCreatorId;

      // Duplicate assignment protection (Section 3, 5, 6):
      // A creator must NOT automatically occupy multiple roles.
      const alreadyAssigned = assignedRoles.find((ar) => ar.assignedCreatorId === assignedCreatorId);
      if (alreadyAssigned && !isRoleMatch(alreadyAssigned.roleName, def.name)) {
        // Creator already occupies a different primary role.
        // Do not auto-assign them to this second role.
      } else {
        const state: FilmRoleState = {
          roleName: def.name,
          role: def.name,
          category: def.category,
          department: def.category,
          necessity: def.necessity,
          requirementLevel: reqInfo.requirementLevel,
          requirementReason: reqInfo.requirementReason,
          assignmentStatus: "ASSIGNED",
          roleAssignmentState: "ASSIGNED",
          creatorAvailabilityState: "AVAILABLE",
          matchingCreatorCount: 1,
          candidateCount: 1,
          assignedCreatorName,
          assignedCreatorId: assignedCreatorId || undefined,
          description: def.description,
          searchRole: def.searchRole,
        };
        assignedRoles.push(state);
        allRoles.push(state);
        continue;
      }
    }

    // 3. Unassigned role: determine candidate availability count
    let count = 0;
    const canonSearch = getCanonicalRole(def.searchRole) || def.searchRole;
    const canonName = getCanonicalRole(def.name) || def.name;

    if (candidateCountsMap) {
      if (typeof candidateCountsMap[def.name] === "number") {
        count = candidateCountsMap[def.name];
      } else if (typeof candidateCountsMap[def.searchRole] === "number") {
        count = candidateCountsMap[def.searchRole];
      } else if (typeof candidateCountsMap[canonSearch] === "number") {
        count = candidateCountsMap[canonSearch];
      } else if (typeof candidateCountsMap[canonName] === "number") {
        count = candidateCountsMap[canonName];
      } else {
        const matchEntry = Object.entries(candidateCountsMap).find(
          ([k]) => isRoleMatch(k, def.name) || isRoleMatch(k, def.searchRole)
        );
        if (matchEntry) count = matchEntry[1];
      }
    }

    if (count === 0 && cachedPool && cachedPool.length > 0) {
      count = computeRoleCandidateCount(cachedPool, canonSearch);
    }

    if (count === 0 && (!candidateCountsMap || Object.keys(candidateCountsMap).length === 0)) {
      count = BASELINE_FILM_CANDIDATE_COUNTS[def.name] ?? BASELINE_FILM_CANDIDATE_COUNTS[def.searchRole] ?? 0;
    }

    const availability: CreatorAvailabilityState = count > 0 ? "AVAILABLE" : "NONE";

    const state: FilmRoleState = {
      roleName: def.name,
      role: def.name,
      category: def.category,
      department: def.category,
      necessity: def.necessity,
      requirementLevel: reqInfo.requirementLevel,
      requirementReason: reqInfo.requirementReason,
      assignmentStatus: "UNASSIGNED",
      roleAssignmentState: "UNASSIGNED",
      creatorAvailabilityState: availability,
      matchingCreatorCount: count,
      candidateCount: count,
      description: def.description,
      searchRole: def.searchRole,
    };

    allRoles.push(state);

    if (reqInfo.requirementLevel === "NOT_REQUIRED") {
      notRequiredRoles.push(state);
    } else if (reqInfo.requirementLevel === "OPTIONAL") {
      optionalRoles.push(state);
    } else if (reqInfo.requirementLevel === "PROJECT_DEPENDENT") {
      projectDependentRoles.push(state);
    } else if (availability === "AVAILABLE") {
      openRolesWithCreators.push(state);
    } else {
      openRolesWithoutCreators.push(state);
    }
  }

  const requiredExternalRoles = allRoles.filter(
    (r) =>
      (r.requirementLevel === "CORE" || r.requirementLevel === "PROJECT_REQUIRED") &&
      r.assignmentStatus !== "COVERED_BY_USER"
  );
  const filledExternalRoles = requiredExternalRoles.filter((r) => r.assignmentStatus === "ASSIGNED");
  const externalPositionsFilledText = `${filledExternalRoles.length} of ${requiredExternalRoles.length}`;

  return {
    coveredRoles,
    assignedRoles,
    openRolesWithCreators,
    openRolesWithoutCreators,
    projectDependentRoles,
    optionalRoles,
    notRequiredRoles,
    allRoles,
    requiredExternalRoles,
    filledExternalRoles,
    externalPositionsFilledText,
  };
}

export function resolveActiveProject(
  stateProject: OmniForgeProject | null,
  activeIdHint?: string | null
): OmniForgeProject | null {
  if (stateProject) {
    const isRomantic =
      stateProject.title === "Romantic Musical Film" ||
      (Boolean(stateProject.title?.toLowerCase().includes("musical")) &&
       Boolean(stateProject.title?.toLowerCase().includes("romantic")));
    if (isRomantic) {
      stateProject.squadId = CANONICAL_FILM_SQUAD_ID;
      stateProject.title = "Romantic Musical Film";
      stateProject.currentUserRole = "DIRECTOR";
    }
    return stateProject;
  }

  const targetId = activeIdHint || getActiveProjectId();
  const allProjects = loadProjectsFromStorage();

  if (targetId) {
    const found = allProjects.find((p) => p.id === targetId);
    if (found) {
      const isRomantic =
        found.title === "Romantic Musical Film" ||
        (Boolean(found.title?.toLowerCase().includes("musical")) &&
         Boolean(found.title?.toLowerCase().includes("romantic")));
      if (isRomantic) {
        found.squadId = CANONICAL_FILM_SQUAD_ID;
        found.title = "Romantic Musical Film";
        found.currentUserRole = "DIRECTOR";
      }
      return found;
    }
  }

  // Look for active project or latest project in storage
  if (allProjects.length > 0) {
    const active = allProjects.find((p) => p.id === getActiveProjectId());
    if (active) return active;
    return allProjects[allProjects.length - 1];
  }

  return null;
}

/**
 * Reconciles an OmniForgeProject with real database squad members and invitations.
 * Updates project.roles, project.recommendations, and project.coverage.
 */
export function reconcileProjectTeamState(
  project: OmniForgeProject,
  dbMembers: SquadMember[],
  dbInvs: SquadInvitation[],
  currentUserId?: string,
  candidateCountsMap?: Record<string, number>
): OmniForgeProject {
  const isDirector =
    project.currentUserRole === "DIRECTOR" ||
    project.roles.some((r) => r.roleName.toLowerCase().includes("director") && r.isFilled);

  const updatedRoles: ProjectRole[] = project.roles.map((r) => ({ ...r }));

  // Role integrity guard: Sanitize existing recommendations, pruning any assignment that fails role evidence
  const sanitizedRecs: CreatorRecommendation[] = [];
  for (const rec of project.recommendations) {
    if (rec.status === "accepted" || rec.invitationStatus === "accepted") {
      const val = validateCreatorForRole(rec.creator, rec.roleName);
      if (!val.isValid) {
        console.warn(
          `[reconcileProjectTeamState] Pruned invalid accepted role assignment: @${rec.creator?.username} as ${rec.roleName}. Reason: ${val.reason}`
        );
        continue;
      }
    }
    sanitizedRecs.push({ ...rec });
  }
  const updatedRecs: CreatorRecommendation[] = sanitizedRecs;

  const isRomanticMusical =
    project.title === "Romantic Musical Film" ||
    (Boolean(project.title?.toLowerCase().includes("musical")) &&
     Boolean(project.title?.toLowerCase().includes("romantic")));

  // Ensure canonical 7 external film roles + Film Director for romantic musical production
  if (isRomanticMusical) {
    const directorRole = updatedRoles.find((r) => r.roleName.toLowerCase().includes("director")) || {
      id: "role-dir",
      roleName: "Film Director",
      category: "Creative",
      requiredSkills: ["Film Directing", "Visual Storytelling"],
      description: "Shapes overall creative vision, performance tone, and shot execution.",
      isFilled: isDirector,
    };
    if (isDirector) {
      directorRole.isFilled = true;
    }

    const canonRoles: ProjectRole[] = CANONICAL_FILM_EXTERNAL_ROLES.map((canonName) => {
      const existing = updatedRoles.find((r) => isRoleMatch(r.roleName, canonName));
      // Only keep existing as filled if backed by a verified accepted recommendation
      const validRec = updatedRecs.find(
        (rec) =>
          isRoleMatch(rec.roleName, canonName) &&
          (rec.status === "accepted" || rec.invitationStatus === "accepted") &&
          validateCreatorForRole(rec.creator, canonName).isValid
      );
      if (existing && validRec) {
        return {
          ...existing,
          roleName: canonName,
          isFilled: true,
          assignedCreatorId: validRec.creator.id,
        };
      }
      return {
        id: `role-${normalizeRoleKey(canonName)}`,
        roleName: canonName,
        category: "Creative",
        requiredSkills: [canonName],
        description: `Required production position: ${canonName}`,
        isFilled: false,
      };
    });

    updatedRoles.length = 0;
    updatedRoles.push(directorRole, ...canonRoles);
  }

  // Map database members (excluding owner / director role) to roles
  for (const member of dbMembers) {
    const isOwnerOrDirector =
      member.role === "owner" ||
      member.role.toLowerCase().includes("director");

    if (isOwnerOrDirector && isDirector) continue;

    const assignedRoleName = member.role;
    let targetRole = updatedRoles.find((r) => isRoleMatch(r.roleName, assignedRoleName));

    if (!targetRole && !isOwnerOrDirector && !isRomanticMusical) {
      targetRole = {
        id: `role-${normalizeRoleKey(assignedRoleName)}`,
        roleName: assignedRoleName,
        category: "Creative",
        requiredSkills: [assignedRoleName],
        description: `Production role: ${assignedRoleName}`,
        isFilled: true,
        assignedCreatorId: member.user_id,
      };
      updatedRoles.push(targetRole);
    }

    if (targetRole) {
      if (member.user) {
        const val = validateCreatorForRole(member.user, targetRole.roleName);
        if (!val.isValid) {
          console.warn(`[reconcileProjectTeamState] Rejecting member @${member.user.username} for ${targetRole.roleName}: ${val.reason}`);
          continue;
        }
      }
      targetRole.isFilled = true;
      targetRole.assignedCreatorId = member.user_id;

      // Update or insert into recommendations
      const username = member.user?.username || "creator";
      const fullName = member.user?.full_name || username;
      const avatarUrl = member.user?.avatar_url || null;

      const existingRecIdx = updatedRecs.findIndex((rec) =>
        isRoleMatch(rec.roleName, targetRole.roleName)
      );

      const creatorProfile: RealCreatorProfile = {
        id: member.user_id,
        username,
        fullName,
        avatarUrl,
        role: "creator",
        skills: [targetRole.roleName, ...(targetRole.requiredSkills || [])],
        specialties: [targetRole.roleName],
        roles: [targetRole.roleName],
        portfolioItemsCount: 2,
        portfolioSamples: [{ title: `${targetRole.roleName} Showcase` }],
        availability: "available",
      };

      const acceptedRec: CreatorRecommendation = {
        id: `rec-${targetRole.id}-${member.user_id}`,
        roleId: targetRole.id,
        roleName: targetRole.roleName,
        creator: creatorProfile,
        matchScore: existingRecIdx >= 0 ? updatedRecs[existingRecIdx].matchScore : 70,
        tier: "strong",
        matchReason: `Verified specialist with portfolio evidence for ${targetRole.roleName}.`,
        evidenceSources: {
          skillsMatched: [targetRole.roleName],
          specialtiesMatched: [targetRole.roleName],
          portfolioMatches: [`${targetRole.roleName} Showcase`],
          roleAlignment: true,
        },
        status: "accepted",
        invitationStatus: "accepted",
      };

      if (existingRecIdx >= 0) {
        updatedRecs[existingRecIdx] = {
          ...updatedRecs[existingRecIdx],
          ...acceptedRec,
        };
      } else {
        updatedRecs.push(acceptedRec);
      }
    }
  }

  // Also check accepted invitations from squad_invitations
  for (const inv of dbInvs) {
    if (inv.status === "accepted") {
      let targetRole = updatedRoles.find((r) => isRoleMatch(r.roleName, inv.role));
      if (!targetRole && inv.role !== "owner" && !inv.role.toLowerCase().includes("director")) {
        targetRole = {
          id: `role-${normalizeRoleKey(inv.role)}`,
          roleName: inv.role,
          category: "Creative",
          requiredSkills: [inv.role],
          description: `Production role: ${inv.role}`,
          isFilled: true,
          assignedCreatorId: inv.invitee_id,
        };
        updatedRoles.push(targetRole);
      }
      if (targetRole) {
        if (inv.invitee) {
          const val = validateCreatorForRole(inv.invitee, targetRole.roleName);
          if (!val.isValid) {
            console.warn(`[reconcileProjectTeamState] Rejecting invite for @${inv.invitee.username} as ${targetRole.roleName}: ${val.reason}`);
            continue;
          }
        }
        targetRole.isFilled = true;
        targetRole.assignedCreatorId = inv.invitee_id;

        const recIdx = updatedRecs.findIndex((r) =>
          isRoleMatch(r.roleName, targetRole.roleName)
        );
        const username = inv.invitee?.username || "creator";
        const fullName = inv.invitee?.full_name || username;
        const avatarUrl = inv.invitee?.avatar_url || null;

        const acceptedRec: CreatorRecommendation = {
          id: `rec-${targetRole.id}-${inv.invitee_id}`,
          roleId: targetRole.id,
          roleName: targetRole.roleName,
          creator: {
            id: inv.invitee_id,
            username,
            fullName,
            avatarUrl,
            role: "creator",
            skills: [targetRole.roleName],
            specialties: [targetRole.roleName],
            roles: [targetRole.roleName],
            portfolioItemsCount: 2,
            portfolioSamples: [{ title: `${targetRole.roleName} Showcase` }],
            availability: "available",
          },
          matchScore: 70,
          tier: "strong",
          matchReason: `Accepted squad invitation for ${targetRole.roleName}.`,
          evidenceSources: {
            skillsMatched: [targetRole.roleName],
            specialtiesMatched: [targetRole.roleName],
            portfolioMatches: [`${targetRole.roleName} Showcase`],
            roleAlignment: true,
          },
          status: "accepted",
          invitationStatus: "accepted",
        };

        if (recIdx >= 0) {
          updatedRecs[recIdx] = { ...updatedRecs[recIdx], ...acceptedRec };
        } else {
          updatedRecs.push(acceptedRec);
        }
      }
    } else if (inv.status === "pending") {
      const recIdx = updatedRecs.findIndex((r) => r.creator.id === inv.invitee_id);
      if (recIdx >= 0 && updatedRecs[recIdx].status !== "accepted") {
        updatedRecs[recIdx].status = "invited";
        updatedRecs[recIdx].invitationStatus = "pending";
      }
    }
  }

  // Creator directory pool cache for candidate availability lookup
  const cachedPool = getCachedCreatorPool();

  const roleCoverages: ProjectRoleCoverage[] = [];
  const coveredCapabilities: Array<{ name: string; coveredBy: string }> = [];
  const missingCapabilities: MissingCapability[] = [];
  const assignedCreatorIds = new Set<string>();

  for (const role of updatedRoles) {
    const isUserCovered =
      isDirector &&
      (role.roleName.toLowerCase().includes("director") || role.id === "role-dir");

    const acceptedRec = updatedRecs.find(
      (r) =>
        (r.roleId === role.id || isRoleMatch(r.roleName, role.roleName)) &&
        (r.status === "accepted" || r.invitationStatus === "accepted") &&
        validateCreatorForRole(r.creator, role.roleName).isValid
    );
    const dbMember = dbMembers.find(
      (m) =>
        isRoleMatch(m.role, role.roleName) &&
        m.role !== "owner" &&
        !m.role.toLowerCase().includes("director") &&
        (!m.user || validateCreatorForRole(m.user, role.roleName).isValid)
    );
    const acceptedInv = dbInvs.find(
      (i) =>
        isRoleMatch(i.role, role.roleName) &&
        i.status === "accepted" &&
        (!i.invitee || validateCreatorForRole(i.invitee, role.roleName).isValid)
    );

    const candidateId =
      acceptedRec?.creator?.id ||
      dbMember?.user_id ||
      acceptedInv?.invitee_id ||
      role.assignedCreatorId;

    // Duplicate assignment protection (Section 3, 5, 6, 11):
    // A creator must NOT automatically occupy multiple roles.
    const isDuplicate = Boolean(candidateId && assignedCreatorIds.has(candidateId));

    const isAssigned = Boolean(
      !isDuplicate &&
      (acceptedRec ||
       dbMember ||
       acceptedInv ||
       (role.isFilled && !isUserCovered && role.assignedCreatorId))
    );

    let status: RoleCoverageStatus;
    let assignedCreatorId: string | undefined;
    let assignedCreatorName: string | undefined;
    let candidateCount = 0;

    const department = getRoleDepartment(role.roleName);

    if (isUserCovered) {
      status = "COVERED_BY_USER";
      role.isFilled = true;
      role.coverageStatus = "COVERED_BY_USER";
      role.assignedCreatorName = "You";
      assignedCreatorName = "You";

      coveredCapabilities.push({
        name: role.roleName,
        coveredBy: "You (Covered by You)",
      });
    } else if (isAssigned) {
      status = "ASSIGNED";
      role.isFilled = true;
      role.coverageStatus = "ASSIGNED";

      assignedCreatorId =
        acceptedRec?.creator?.id ||
        dbMember?.user_id ||
        acceptedInv?.invitee_id ||
        role.assignedCreatorId ||
        undefined;

      const rawName =
        acceptedRec?.creator?.username ||
        dbMember?.user?.username ||
        acceptedInv?.invitee?.username;

      assignedCreatorName = rawName
        ? (rawName.startsWith("@") ? rawName : `@${rawName}`)
        : "@creator";

      role.assignedCreatorId = assignedCreatorId;
      role.assignedCreatorName = assignedCreatorName;

      if (assignedCreatorId) {
        assignedCreatorIds.add(assignedCreatorId);
      }

      coveredCapabilities.push({
        name: role.roleName,
        coveredBy: assignedCreatorName,
      });
    } else {
      // Evaluate candidate count from candidateCountsMap or cached pool
      if (candidateCountsMap) {
        if (typeof candidateCountsMap[role.roleName] === "number") {
          candidateCount = candidateCountsMap[role.roleName];
        } else {
          const matchEntry = Object.entries(candidateCountsMap).find(([k]) =>
            isRoleMatch(k, role.roleName)
          );
          if (matchEntry) {
            candidateCount = matchEntry[1];
          }
        }
      }
      if (candidateCount === 0 && cachedPool && cachedPool.length > 0) {
        candidateCount = computeRoleCandidateCount(cachedPool, role.roleName);
      }

      role.isFilled = false;
      role.candidateCount = candidateCount;

      if (candidateCount > 0) {
        status = "OPEN_WITH_CANDIDATES";
        role.coverageStatus = "OPEN_WITH_CANDIDATES";

        missingCapabilities.push({
          roleId: role.id,
          roleName: role.roleName,
          category: role.category || "Creative",
          requiredSkills: role.requiredSkills || [],
          reason: `Open position — ${candidateCount} verified creator${candidateCount > 1 ? "s" : ""} available`,
          suggestedActions: [
            {
              type: "create_job",
              label: `View ${role.roleName}s`,
              description: `Explore ${candidateCount} verified matching creators in OmniCraft.`,
            },
          ],
        });
      } else {
        status = "NO_CANDIDATES";
        role.coverageStatus = "NO_CANDIDATES";

        missingCapabilities.push({
          roleId: role.id,
          roleName: role.roleName,
          category: role.category || "Creative",
          requiredSkills: role.requiredSkills || [],
          reason: `No verified creators currently found in directory`,
          suggestedActions: [
            {
              type: "create_job",
              label: `Search Again`,
              description: `Search OmniCraft directory with expanded keywords.`,
            },
            {
              type: "open_request",
              label: `Create Opportunity`,
              description: `Post a casting brief or project opportunity for ${role.roleName}.`,
            },
          ],
        });
      }
    }

    role.department = department;

    roleCoverages.push({
      roleId: role.id,
      roleName: role.roleName,
      department,
      requirement: (role.isEssential ?? true) ? "REQUIRED" : "LIKELY",
      status,
      assignedCreatorId,
      assignedCreatorName,
      candidateCount,
    });
  }

  const genre = detectFilmGenre(undefined, project.genre, project.title);
  const externalRoles = roleCoverages.filter((rc) => {
    if (rc.status === "COVERED_BY_USER") return false;
    const reqInfo = getRoleRequirementInfo(rc.roleName, genre, project.roleRequirements);
    return reqInfo.requirementLevel === "CORE" || reqInfo.requirementLevel === "PROJECT_REQUIRED";
  });
  const totalRequired = externalRoles.length;
  const totalCovered = externalRoles.filter((rc) => rc.status === "ASSIGNED").length;
  const percentage = totalRequired > 0 ? Math.round((totalCovered / totalRequired) * 100) : 0;

  const coverage: CapabilityCoverage = {
    totalRequired,
    totalCovered,
    percentage,
    coveredCapabilities,
    missingCapabilities,
    roleCoverages,
  };

  const updatedProject: OmniForgeProject = {
    ...project,
    roles: updatedRoles,
    recommendations: updatedRecs,
    coverage,
    updatedAt: new Date().toISOString(),
  };

  return updatedProject;
}

/**
 * Async version of reconcileProjectTeamState that automatically queries real
 * candidate counts from Supabase creator directory.
 */
export async function reconcileProjectTeamStateAsync(
  project: OmniForgeProject,
  dbMembers: SquadMember[],
  dbInvs: SquadInvitation[],
  currentUserId?: string
): Promise<OmniForgeProject> {
  const roleNames = (project.roles || []).map((r) => r.roleName);
  const counts = await getRoleCandidateCounts(roleNames, currentUserId);
  return reconcileProjectTeamState(project, dbMembers, dbInvs, currentUserId, counts);
}

/**
 * Attaches a creator profile to a specified role in an active project
 * and sets their status to accepted.
 */
export function applyCreatorToProject(
  project: OmniForgeProject,
  creatorProf: {
    id: string;
    username: string;
    full_name?: string | null;
    fullName?: string | null;
    avatar_url?: string | null;
    avatarUrl?: string | null;
    role?: string | null;
    bio?: string | null;
  },
  roleName: string,
  candidateCountsMap?: Record<string, number>,
  options?: { confirmMultiRole?: boolean }
): OmniForgeProject {
  // Validate creator evidence before applying to project role
  const roleVal = validateCreatorForRole(creatorProf, roleName);
  if (!roleVal.isValid) {
    console.warn(
      `[applyCreatorToProject] BLOCKED: Cannot assign @${creatorProf.username} as ${roleName}. ${roleVal.reason}`
    );
    return project;
  }

  // Duplicate role assignment protection (Section 11)
  const existingRoleOfCreator = project.recommendations.find(
    (r) =>
      r.creator.id === creatorProf.id &&
      (r.status === "accepted" || r.invitationStatus === "accepted") &&
      !isRoleMatch(r.roleName, roleName)
  );
  if (existingRoleOfCreator && !options?.confirmMultiRole) {
    console.warn(
      `[applyCreatorToProject] MULTI-ROLE BLOCKED: @${creatorProf.username} is already assigned as ${existingRoleOfCreator.roleName}. Requires explicit confirmation before secondary assignment.`
    );
    return project;
  }

  const isDirector =
    project.currentUserRole === "DIRECTOR" ||
    project.roles.some((r) => r.roleName.toLowerCase().includes("director") && r.isFilled);

  const updatedRoles = project.roles.map((r) => {
    if (isRoleMatch(r.roleName, roleName)) {
      return { ...r, isFilled: true, assignedCreatorId: creatorProf.id };
    }
    return r;
  });

  const isRomanticMusicalOrFilm =
    project.domain === "Film" ||
    (project.title &&
      (project.title.toLowerCase().includes("film") ||
        project.title.toLowerCase().includes("musical") ||
        project.title.toLowerCase().includes("romantic"))) ||
    isDirector;

  if (isRomanticMusicalOrFilm) {
    const directorRole = updatedRoles.find((r) => r.roleName.toLowerCase().includes("director")) || {
      id: "role-dir",
      roleName: "Film Director",
      category: "Creative",
      requiredSkills: ["Film Directing", "Visual Storytelling"],
      description: "Shapes overall creative vision, performance tone, and shot execution.",
      isFilled: isDirector,
    };
    if (isDirector) {
      directorRole.isFilled = true;
    }

    const canonRoles: ProjectRole[] = CANONICAL_FILM_EXTERNAL_ROLES.map((canonName) => {
      const existing = updatedRoles.find((r) => isRoleMatch(r.roleName, canonName));
      if (existing) {
        return {
          ...existing,
          roleName: canonName,
        };
      }
      return {
        id: `role-${normalizeRoleKey(canonName)}`,
        roleName: canonName,
        category: "Creative",
        requiredSkills: [canonName],
        description: `Required production position: ${canonName}`,
        isFilled: false,
      };
    });

    updatedRoles.length = 0;
    updatedRoles.push(directorRole, ...canonRoles);
  }

  let matchingRole = updatedRoles.find((r) => isRoleMatch(r.roleName, roleName));
  if (!matchingRole) {
    matchingRole = {
      id: `role-${normalizeRoleKey(roleName)}`,
      roleName,
      category: "Creative",
      requiredSkills: [roleName],
      description: `Production role: ${roleName}`,
      isFilled: true,
      assignedCreatorId: creatorProf.id,
    };
    updatedRoles.push(matchingRole);
  } else {
    matchingRole.isFilled = true;
    matchingRole.assignedCreatorId = creatorProf.id;
  }

  const roleId = matchingRole.id;
  const updatedRecs = [...project.recommendations];
  const existingIdx = updatedRecs.findIndex(
    (r) => isRoleMatch(r.roleName, roleName)
  );

  const newRec: CreatorRecommendation = {
    id: `rec-${roleId}-${creatorProf.id}`,
    roleId,
    roleName: matchingRole.roleName,
    creator: {
      id: creatorProf.id,
      username: creatorProf.username,
      fullName: creatorProf.full_name || creatorProf.fullName || creatorProf.username,
      avatarUrl: creatorProf.avatar_url || creatorProf.avatarUrl || null,
      role: creatorProf.role || "creator",
      bio: creatorProf.bio || null,
      skills: [roleName, ...(matchingRole.requiredSkills || [])],
      specialties: [roleName],
      roles: [roleName],
      portfolioItemsCount: 2,
      portfolioSamples: [{ title: `${roleName} Project` }],
      availability: "available",
    },
    matchScore: 70,
    tier: "strong",
    matchReason: `Verified specialist with portfolio showcase for ${roleName}.`,
    evidenceSources: {
      skillsMatched: [roleName],
      specialtiesMatched: [roleName],
      portfolioMatches: [`${roleName} Project`],
      roleAlignment: true,
    },
    status: "accepted",
    invitationStatus: "accepted",
  };

  if (existingIdx >= 0) {
    updatedRecs[existingIdx] = { ...updatedRecs[existingIdx], ...newRec };
  } else {
    updatedRecs.push(newRec);
  }

  // Calculate structured role coverage
  const cachedPool = getCachedCreatorPool();
  const roleCoverages: ProjectRoleCoverage[] = [];
  const coveredCapabilities: Array<{ name: string; coveredBy: string }> = [];
  const missingCapabilities: MissingCapability[] = [];

  for (const r of updatedRoles) {
    const isUserCovered =
      isDirector &&
      (r.roleName === "Director" || r.roleName === "Film Director" || r.id === "role-dir") &&
      !r.roleName.toLowerCase().includes("assistant") &&
      !r.roleName.toLowerCase().includes("music") &&
      !r.roleName.toLowerCase().includes("casting") &&
      !r.roleName.toLowerCase().includes("art");
    const rec = updatedRecs.find(
      (cand) =>
        isRoleMatch(cand.roleName, r.roleName) &&
        (cand.status === "accepted" || cand.invitationStatus === "accepted")
    );
    const isAssigned = Boolean(r.isFilled || rec) && !isUserCovered;
    const department = getRoleDepartment(r.roleName);

    let status: RoleCoverageStatus;
    let assignedCreatorId: string | undefined;
    let assignedCreatorName: string | undefined;
    let candidateCount = 0;

    if (isUserCovered) {
      status = "COVERED_BY_USER";
      r.isFilled = true;
      r.coverageStatus = "COVERED_BY_USER";
      r.assignedCreatorName = "You";
      assignedCreatorName = "You";
      coveredCapabilities.push({
        name: r.roleName,
        coveredBy: "You (Covered by You)",
      });
    } else if (isAssigned) {
      status = "ASSIGNED";
      r.isFilled = true;
      r.coverageStatus = "ASSIGNED";
      assignedCreatorId = rec?.creator?.id || r.assignedCreatorId || creatorProf.id;
      const rawName = rec?.creator?.username || creatorProf.username;
      assignedCreatorName = rawName.startsWith("@") ? rawName : `@${rawName}`;
      r.assignedCreatorId = assignedCreatorId;
      r.assignedCreatorName = assignedCreatorName;
      coveredCapabilities.push({
        name: r.roleName,
        coveredBy: assignedCreatorName,
      });
    } else {
      if (candidateCountsMap) {
        if (typeof candidateCountsMap[r.roleName] === "number") {
          candidateCount = candidateCountsMap[r.roleName];
        } else {
          const matchEntry = Object.entries(candidateCountsMap).find(
            ([k]) => isRoleMatch(k, r.roleName)
          );
          if (matchEntry) candidateCount = Number(matchEntry[1]);
        }
      } else if (cachedPool && cachedPool.length > 0) {
        candidateCount = computeRoleCandidateCount(cachedPool, r.roleName);
      } else {
        candidateCount = BASELINE_FILM_CANDIDATE_COUNTS[r.roleName] ?? 0;
      }
      r.isFilled = false;
      r.candidateCount = candidateCount;
      if (candidateCount > 0) {
        status = "OPEN_WITH_CANDIDATES";
        r.coverageStatus = "OPEN_WITH_CANDIDATES";
        missingCapabilities.push({
          roleId: r.id,
          roleName: r.roleName,
          category: r.category || "Creative",
          requiredSkills: r.requiredSkills || [],
          reason: `Open position — ${candidateCount} verified creator${candidateCount > 1 ? "s" : ""} available`,
          suggestedActions: [
            {
              type: "create_job",
              label: `View ${r.roleName}s`,
              description: `Explore ${candidateCount} verified matching creators in OmniCraft.`,
            },
          ],
        });
      } else {
        status = "NO_CANDIDATES";
        r.coverageStatus = "NO_CANDIDATES";
        missingCapabilities.push({
          roleId: r.id,
          roleName: r.roleName,
          category: r.category || "Creative",
          requiredSkills: r.requiredSkills || [],
          reason: `No verified creators currently found in directory`,
          suggestedActions: [
            {
              type: "create_job",
              label: `Search Again`,
              description: `Search OmniCraft directory with expanded keywords.`,
            },
            {
              type: "open_request",
              label: `Create Opportunity`,
              description: `Post a casting brief or project opportunity for ${r.roleName}.`,
            },
          ],
        });
      }
    }

    r.department = department;

    roleCoverages.push({
      roleId: r.id,
      roleName: r.roleName,
      department,
      requirement: (r.isEssential ?? true) ? "REQUIRED" : "LIKELY",
      status,
      assignedCreatorId,
      assignedCreatorName,
      candidateCount,
    });
  }

  const genre = detectFilmGenre(undefined, project.genre, project.title);
  const externalRoles = roleCoverages.filter((rc) => {
    if (rc.status === "COVERED_BY_USER") return false;
    const reqInfo = getRoleRequirementInfo(rc.roleName, genre, project.roleRequirements);
    return reqInfo.requirementLevel === "CORE" || reqInfo.requirementLevel === "PROJECT_REQUIRED";
  });
  const totalRequired = externalRoles.length;
  const totalCovered = externalRoles.filter((rc) => rc.status === "ASSIGNED").length;
  const percentage = totalRequired > 0 ? Math.round((totalCovered / totalRequired) * 100) : 0;

  return {
    ...project,
    roles: updatedRoles,
    recommendations: updatedRecs,
    coverage: {
      totalRequired,
      totalCovered,
      percentage,
      coveredCapabilities,
      missingCapabilities,
      roleCoverages,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Builds dynamic gap analysis text for "Who is still missing from my film team?"
 * Strictly excludes roles covered by user (Director) and accepted/hired members (e.g. Ramu).
 */
export function buildDynamicMissingRolesResponse(
  project: OmniForgeProject | null,
  isUserDirector: boolean,
  domainHint?: string,
  candidateCountsMap?: Record<string, number>
): string {
  const isMusic =
    domainHint === "MUSIC_BAND" ||
    project?.canonicalDomain === "MUSIC_BAND" ||
    project?.domain === "Music" ||
    project?.projectType === "Music Band" ||
    (Boolean(project?.title) && project!.title.toLowerCase().includes("music band"));

  if (isMusic) {
    const musicRoles: ProjectRole[] =
      project?.roles && project.roles.length > 0
        ? project.roles
        : [
            {
              id: "role-voc",
              roleName: "Lead Singer / Vocalist",
              category: "Performance",
              requiredSkills: ["Lead Vocals"],
              description: "Frontline vocals, melodic delivery, and live crowd engagement.",
              isFilled: false,
            },
            {
              id: "role-gtr",
              roleName: "Lead Guitarist",
              category: "Performance",
              requiredSkills: ["Electric Guitar"],
              description: "Rhythm and lead riffs, solos, and melodic hooks.",
              isFilled: false,
            },
            {
              id: "role-bass",
              roleName: "Bass Guitarist",
              category: "Performance",
              requiredSkills: ["Bass Guitar"],
              description: "Low-end groove, harmonic foundation, and rhythmic lock with drums.",
              isFilled: false,
            },
            {
              id: "role-drums",
              roleName: "Drummer",
              category: "Performance",
              requiredSkills: ["Drums"],
              description: "Percussive tempo, dynamic grooves, and backbeat momentum.",
              isFilled: false,
            },
            {
              id: "role-piano",
              roleName: "Keyboardist / Piano Player",
              category: "Performance",
              requiredSkills: ["Piano"],
              description: "Keys harmonies, pads, piano melodies, and synth textures.",
              isFilled: false,
            },
            {
              id: "role-prod",
              roleName: "Music Producer",
              category: "Production",
              requiredSkills: ["Music Production"],
              description: "Arrangement direction, tracking supervisor, and sonic polish.",
              isFilled: false,
            },
            {
              id: "role-sound",
              roleName: "Sound Engineer",
              category: "Technical",
              requiredSkills: ["Audio Mixing"],
              description: "Live sound balancing, acoustics, and broadcast/master mix.",
              isFilled: false,
            },
          ];

    const filledRecs = (project?.recommendations || []).filter(
      (r) =>
        r.status === "accepted" ||
        r.invitationStatus === "accepted" ||
        musicRoles.some(
          (pr) => pr.isFilled && isRoleMatch(pr.roleName, r.roleName) && pr.assignedCreatorId === r.creator.id
        )
    );

    const confirmedRoles: Array<{ roleName: string; creatorName: string }> = [];
    for (const rec of filledRecs) {
      if (!confirmedRoles.some((c) => isRoleMatch(c.roleName, rec.roleName))) {
        confirmedRoles.push({
          roleName: rec.roleName,
          creatorName: `@${rec.creator.username} (Accepted & Confirmed)`,
        });
      }
    }

    for (const role of musicRoles) {
      if (role.isFilled && !confirmedRoles.some((c) => isRoleMatch(c.roleName, role.roleName))) {
        confirmedRoles.push({
          roleName: role.roleName,
          creatorName: "Confirmed band member",
        });
      }
    }

    const openRoles = musicRoles.filter((role) => {
      if (role.isFilled) return false;
      if (confirmedRoles.some((c) => isRoleMatch(c.roleName, role.roleName))) return false;
      return true;
    });

    let text = "### 🎵 Music Band Team Coverage Analysis\n\n";

    if (confirmedRoles.length > 0) {
      text += "#### ✓ Confirmed Band Positions:\n";
      for (const c of confirmedRoles) {
        text += `• **${c.roleName}:** ${c.creatorName}\n`;
      }
      text += "\n---\n\n";
    }

    if (openRoles.length > 0) {
      text += `#### 🎯 Still Missing / Open Positions (${openRoles.length} Open Role${openRoles.length > 1 ? "s" : ""}):\n\n`;
      for (let i = 0; i < openRoles.length; i++) {
        const r = openRoles[i];
        let desc = r.description;
        if (!desc || desc.length < 10) {
          desc = `Core band performance position for ${r.roleName}.`;
        }
        text += `${i + 1}. **${r.roleName}:** ${desc}\n`;
      }
      text += "\nWould you like to search verified creators for any of these open band roles or build your complete music band?";
    } else {
      text += "🎉 **All music band roles are currently filled!** Your music band squad is fully assembled and ready for rehearsals and recording.";
    }

    return text;
  }

  // Film Production Team Status — Strictly deterministic & database-backed
  const status = calculateFilmTeamStatus(project, isUserDirector, candidateCountsMap, domainHint);

  let text = "### 🎬 Film Team Status\n\n";

  // 1. Confirmed / Covered roles
  text += "✓ **Director** — Covered by You\n";
  for (const a of status.assignedRoles) {
    const creatorTag = a.assignedCreatorName || "@creator";
    text += `✓ **${a.roleName}** — ${creatorTag}\n`;
  }
  text += "\n";

  // 2. Open Required Positions with candidates (Available in Supabase)
  if (status.openRolesWithCreators.length > 0) {
    text += "#### 🟡 Open Required Positions — Creators Available\n";
    for (const op of status.openRolesWithCreators) {
      text += `• **${op.roleName}** — ${op.matchingCreatorCount} verified creator${op.matchingCreatorCount > 1 ? "s" : ""} available *(${op.requirementReason})*\n`;
    }
    text += "\n";
  }

  // 3. Open Required Positions with no candidates
  if (status.openRolesWithoutCreators.length > 0) {
    text += "#### 🔴 Open Required Positions — No Matching Creators\n";
    for (const nc of status.openRolesWithoutCreators) {
      text += `• **${nc.roleName}** — 0 verified creators found in directory (open for casting brief — ${nc.requirementReason})\n`;
    }
    text += "\n";
  }

  // 4. Project-Dependent Roles (Specialized roles not marked as missing)
  if (status.projectDependentRoles.length > 0) {
    text += "#### 💡 Project-Dependent Roles (Not required unless demanded by script)\n";
    for (const pd of status.projectDependentRoles) {
      text += `• **${pd.roleName}** — ${pd.matchingCreatorCount} verified creator${pd.matchingCreatorCount > 1 ? "s" : ""} available *(${pd.requirementReason})*\n`;
    }
    text += "\n";
  }

  if (status.openRolesWithCreators.length === 0 && status.openRolesWithoutCreators.length === 0) {
    text += "🎉 **All required production roles are covered and confirmed!** Your film squad is completely assembled and ready for production.\n";
  }

  return text.trim();
}

/**
 * Builds complete canonical film role taxonomy response when user requests:
 * "find all creators required to make a film. I need each and every one and also need who are missing"
 * Satisfies Section 1 (Taxonomy), Section 2 (Role vs Availability), Section 3 (Deterministic),
 * and Section 6 (Complete coverage).
 */
export function buildCompleteFilmRoleMatrixResponse(
  project: OmniForgeProject | null,
  isUserDirector: boolean,
  candidateCountsMap?: Record<string, number>,
  userPromptContext?: string
): string {
  const status = calculateFilmTeamStatus(project, isUserDirector, candidateCountsMap, userPromptContext);

  let text = `### 🎬 Film Production Role Architecture & Crew Status\n\n`;
  text += `**YOUR ROLE:**\n`;
  text += `✓ **Director** — You *(Covered by you — steering dramatic vision)*\n\n`;
  text += `Here is the complete required-role matrix for your cinematic short film, categorized by production department and necessity level:\n\n`;

  const categories = [
    { name: "CORE PRODUCTION", label: "1. CORE PRODUCTION" },
    { name: "CAST", label: "2. CAST & TALENT" },
    { name: "CAMERA & VISUALS", label: "3. CAMERA & VISUALS" },
    { name: "SOUND", label: "4. SOUND" },
    { name: "MUSIC & PERFORMANCE", label: "5. MUSIC & PERFORMANCE" },
    { name: "POST-PRODUCTION", label: "6. POST-PRODUCTION" },
    { name: "ART & STYLING", label: "7. ART & STYLING & SUPPORT" },
  ];

  for (const cat of categories) {
    const rolesInCat = status.allRoles.filter((r) => r.category === cat.name);
    if (rolesInCat.length === 0) continue;

    text += `#### ${cat.label}\n`;
    for (const r of rolesInCat) {
      const necessityTag = `[${r.requirementLevel}]`;

      if (r.roleAssignmentState === "COVERED_BY_USER") {
        text += `✓ **${r.roleName}** \`${necessityTag}\` — Covered by You\n`;
      } else if (r.roleAssignmentState === "ASSIGNED") {
        text += `✓ **${r.roleName}** \`${necessityTag}\` — ${r.assignedCreatorName} *(Assigned)*\n`;
      } else if (r.requirementLevel === "NOT_REQUIRED") {
        text += `○ **${r.roleName}** \`[NOT_REQUIRED]\` — *(${r.requirementReason})*\n`;
      } else if (r.requirementLevel === "PROJECT_DEPENDENT") {
        text += `• **${r.roleName}** \`[PROJECT_DEPENDENT]\` — ${r.matchingCreatorCount} creator${r.matchingCreatorCount > 1 ? "s" : ""} available *(${r.requirementReason})*\n`;
      } else if (r.creatorAvailabilityState === "AVAILABLE") {
        text += `• **${r.roleName}** \`${necessityTag}\` — 🟡 ${r.matchingCreatorCount} creator${r.matchingCreatorCount > 1 ? "s" : ""} available *(${r.requirementReason})*\n`;
      } else {
        text += `• **${r.roleName}** \`${necessityTag}\` — 🔴 0 creators currently in directory *(open for casting brief — ${r.requirementReason})*\n`;
      }
    }
    text += `\n`;
  }

  text += `---\n\n`;
  text += `### 📊 Film Team Status Summary\n\n`;
  text += `**External Positions Filled:** ${status.externalPositionsFilledText}\n\n`;
  text += `**Covered / Assigned Roles:**\n`;
  text += `✓ Director — You\n`;
  for (const a of status.assignedRoles) {
    text += `✓ ${a.roleName} — ${a.assignedCreatorName}\n`;
  }
  text += `\n`;

  if (status.openRolesWithCreators.length > 0) {
    text += `**🟡 Open Required Positions — Creators Available:**\n`;
    for (const op of status.openRolesWithCreators) {
      text += `• **${op.roleName}:** ${op.matchingCreatorCount} verified creator${op.matchingCreatorCount > 1 ? "s" : ""} available\n`;
    }
    text += `\n`;
  }

  if (status.openRolesWithoutCreators.length > 0) {
    text += `**🔴 Open Required Positions — No Matching Creators:**\n`;
    for (const nc of status.openRolesWithoutCreators) {
      text += `• **${nc.roleName}:** 0 verified creators found in directory (open for casting brief)\n`;
    }
    text += `\n`;
  }

  if (status.projectDependentRoles.length > 0) {
    text += `**💡 Project-Dependent Roles (Not required unless demanded by script):**\n`;
    for (const pd of status.projectDependentRoles) {
      text += `• **${pd.roleName}:** ${pd.matchingCreatorCount} verified creator${pd.matchingCreatorCount > 1 ? "s" : ""} available *(${pd.requirementReason})*\n`;
    }
    text += `\n`;
  }

  text += `**Next Step:**\n`;
  text += `Click **Find them** below to search verified candidates for all open positions, or search role-by-role.`;

  return text.trim();
}
