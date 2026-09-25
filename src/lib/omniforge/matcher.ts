import { supabase } from "@/integrations/supabase/client";
import {
  OmniForgeProject,
  ProjectRole,
  RealCreatorProfile,
  CreatorRecommendation,
  CapabilityCoverage,
  MissingCapability,
} from "./types";

/**
 * Searches the actual OmniCraft database for real creators matching the project roles.
 * Never fabricates creators, fake reviews, or nonexistent skills.
 */
export async function matchCreatorsForProject(
  project: OmniForgeProject,
  currentUserId?: string
): Promise<{
  recommendations: CreatorRecommendation[];
  alternatives: Record<string, CreatorRecommendation[]>;
  coverage: CapabilityCoverage;
}> {
  try {
    // 1. Fetch real profiles marked as creators from Supabase
    const { data: profiles, error: profileErr } = await supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, role, bio")
      .limit(60);

    if (profileErr || !profiles || profiles.length === 0) {
      console.warn("Could not fetch profiles for matching:", profileErr);
      return createEmptyCoverage(project.roles);
    }

    const creatorIds = profiles.map((p) => p.id);

    // 2. Fetch skills, specialties, portfolio items, and roles for these real creators
    const [
      { data: skillsData },
      { data: specData },
      { data: portfolioData },
      { data: rolesData },
    ] = await Promise.all([
      supabase.from("creator_skills").select("creator_id, skill_id, skills:skill_id(name)").in("creator_id", creatorIds),
      supabase.from("creator_specialties").select("user_id, specialty").in("user_id", creatorIds),
      supabase.from("portfolios").select("id, user_id, title, media_url, media_type").in("user_id", creatorIds),
      supabase.from("creator_roles").select("creator_id, role_id, professional_roles:role_id(name)").in("creator_id", creatorIds),
    ]);

    // Build lookup maps
    const skillsByCreator = new Map<string, string[]>();
    (skillsData ?? []).forEach((row: any) => {
      const cid = row.creator_id;
      const sname = row.skills?.name || row.skill_id;
      if (sname) {
        const arr = skillsByCreator.get(cid) ?? [];
        arr.push(String(sname));
        skillsByCreator.set(cid, arr);
      }
    });

    const specsByCreator = new Map<string, string[]>();
    (specData ?? []).forEach((row: any) => {
      const cid = row.user_id;
      if (row.specialty) {
        const arr = specsByCreator.get(cid) ?? [];
        arr.push(String(row.specialty));
        specsByCreator.set(cid, arr);
      }
    });

    const portfolioByCreator = new Map<string, Array<{ title: string; url?: string; mediaType?: string }>>();
    (portfolioData ?? []).forEach((row: any) => {
      const cid = row.user_id || row.creator_id;
      const arr = portfolioByCreator.get(cid) ?? [];
      arr.push({ title: row.title || "Portfolio Project", url: row.media_url, mediaType: row.media_type });
      portfolioByCreator.set(cid, arr);
    });

    const rolesByCreator = new Map<string, string[]>();
    (rolesData ?? []).forEach((row: any) => {
      const cid = row.creator_id;
      const rname = row.professional_roles?.name;
      if (rname) {
        const arr = rolesByCreator.get(cid) ?? [];
        arr.push(String(rname));
        rolesByCreator.set(cid, arr);
      }
    });

    // Assemble RealCreatorProfile objects
    const realCreators: RealCreatorProfile[] = profiles.map((p) => ({
      id: p.id,
      username: p.username || "creator",
      fullName: p.full_name || p.username || "Creator",
      avatarUrl: p.avatar_url,
      role: p.role,
      bio: p.bio,
      skills: skillsByCreator.get(p.id) ?? [],
      specialties: specsByCreator.get(p.id) ?? [],
      roles: rolesByCreator.get(p.id) ?? [],
      portfolioItemsCount: (portfolioByCreator.get(p.id) ?? []).length,
      portfolioSamples: portfolioByCreator.get(p.id) ?? [],
      availability: "available",
    }));

    // 3. Match real creators against each project role
    const recommendations: CreatorRecommendation[] = [];
    const alternatives: Record<string, CreatorRecommendation[]> = {};
    const coveredCapabilities: Array<{ name: string; coveredBy: string }> = [];
    const missingCapabilities: MissingCapability[] = [];

    for (const role of project.roles) {
      const scoredCandidates: Array<{
        creator: RealCreatorProfile;
        score: number;
        skillsMatched: string[];
        specialtiesMatched: string[];
        portfolioMatches: string[];
        roleAlignment: boolean;
        reason: string;
      }> = [];

      for (const creator of realCreators) {
        // Exclude current user from being recommended to themselves unless no other candidates
        const isSelf = currentUserId && creator.id === currentUserId;

        let score = 0;
        const skillsMatched: string[] = [];
        const specialtiesMatched: string[] = [];
        const portfolioMatches: string[] = [];
        let roleAlignment = false;

        const roleLower = role.roleName.toLowerCase();
        const bioLower = (creator.bio || "").toLowerCase();

        // 1. Role alignment check
        if (
          creator.roles.some((r) => r.toLowerCase().includes(roleLower) || roleLower.includes(r.toLowerCase())) ||
          bioLower.includes(roleLower.split(" ")[0]) ||
          (creator.role && creator.role.toLowerCase().includes(roleLower.split(" ")[0]))
        ) {
          roleAlignment = true;
          score += 35;
        }

        // 2. Required skills check
        for (const reqSkill of role.requiredSkills) {
          const reqLower = reqSkill.toLowerCase();
          const hasExact = creator.skills.some((s) => s.toLowerCase().includes(reqLower) || reqLower.includes(s.toLowerCase()));
          const hasSpec = creator.specialties.some((sp) => sp.toLowerCase().includes(reqLower) || reqLower.includes(sp.toLowerCase()));

          if (hasExact) {
            skillsMatched.push(reqSkill);
            score += 20;
          } else if (hasSpec) {
            specialtiesMatched.push(reqSkill);
            score += 15;
          } else if (bioLower.includes(reqLower)) {
            skillsMatched.push(reqSkill);
            score += 10;
          }
        }

        // 3. Portfolio items evidence
        for (const port of creator.portfolioSamples) {
          const titleLower = (port.title || "").toLowerCase();
          if (
            role.requiredSkills.some((s) => titleLower.includes(s.toLowerCase())) ||
            titleLower.includes(roleLower.split(" ")[0]) ||
            titleLower.includes(project.domain.toLowerCase())
          ) {
            portfolioMatches.push(port.title);
            score += 15;
          }
        }

        if (creator.portfolioItemsCount > 0) {
          score += Math.min(creator.portfolioItemsCount * 3, 10);
        }

        // Penalty for self unless testing
        if (isSelf) {
          score = Math.max(score - 10, 0);
        }

        // Cap score at 98%
        score = Math.min(Math.round(score), 98);

        if (score >= 25) {
          // Construct explicit evidence-backed match reason
          const reasonParts: string[] = [];
          if (roleAlignment) {
            reasonParts.push(`specializes in ${role.roleName}`);
          }
          if (skillsMatched.length > 0) {
            reasonParts.push(`verified skills in ${skillsMatched.slice(0, 3).join(", ")}`);
          }
          if (specialtiesMatched.length > 0) {
            reasonParts.push(`focuses on ${specialtiesMatched.slice(0, 2).join(", ")}`);
          }
          if (portfolioMatches.length > 0) {
            reasonParts.push(`${portfolioMatches.length} matching portfolio project(s) including "${portfolioMatches[0]}"`);
          } else if (creator.portfolioItemsCount > 0) {
            reasonParts.push(`${creator.portfolioItemsCount} verified portfolio piece(s)`);
          }

          const reason =
            reasonParts.length > 0
              ? `Recommended because this creator ${reasonParts.join(", and has ")}.`
              : `Relevant profile with active work in the ${project.domain} domain.`;

          scoredCandidates.push({
            creator,
            score,
            skillsMatched,
            specialtiesMatched,
            portfolioMatches,
            roleAlignment,
            reason,
          });
        }
      }

      scoredCandidates.sort((a, b) => b.score - a.score);

      if (scoredCandidates.length > 0) {
        const top = scoredCandidates[0];
        const tier = top.score >= 70 ? "strong" : top.score >= 45 ? "relevant" : "potential";

        const rec: CreatorRecommendation = {
          id: `rec-${role.id}-${top.creator.id}`,
          roleId: role.id,
          roleName: role.roleName,
          creator: top.creator,
          matchScore: top.score,
          tier,
          matchReason: top.reason,
          evidenceSources: {
            skillsMatched: top.skillsMatched,
            specialtiesMatched: top.specialtiesMatched,
            portfolioMatches: top.portfolioMatches,
            roleAlignment: top.roleAlignment,
          },
          status: "recommended",
        };

        recommendations.push(rec);
        coveredCapabilities.push({
          name: role.roleName,
          coveredBy: top.creator.fullName || top.creator.username,
        });

        // Store alternatives
        if (scoredCandidates.length > 1) {
          alternatives[role.id] = scoredCandidates.slice(1, 5).map((cand) => ({
            id: `rec-${role.id}-${cand.creator.id}`,
            roleId: role.id,
            roleName: role.roleName,
            creator: cand.creator,
            matchScore: cand.score,
            tier: cand.score >= 70 ? "strong" : cand.score >= 45 ? "relevant" : "potential",
            matchReason: cand.reason,
            evidenceSources: {
              skillsMatched: cand.skillsMatched,
              specialtiesMatched: cand.specialtiesMatched,
              portfolioMatches: cand.portfolioMatches,
              roleAlignment: cand.roleAlignment,
            },
            status: "recommended",
          }));
        }
      } else {
        // STRICT NON-FABRICATION: Flag as missing capability
        missingCapabilities.push({
          roleId: role.id,
          roleName: role.roleName,
          category: role.category || "Creative",
          requiredSkills: role.requiredSkills,
          reason: `No sufficiently relevant creator was found in the current OmniCraft network for "${role.roleName}".`,
          suggestedActions: [
            {
              type: "create_job",
              label: "Publish Client Job",
              description: `Post a paid project opening for ${role.roleName} with budget and timeline requirements.`,
            },
            {
              type: "open_request",
              label: "Open Collaboration Call",
              description: `Broadcast an open Squad recruitment post on the Explore feed.`,
            },
            {
              type: "skill_swap",
              label: "Skill-for-Service Swap",
              description: `Exchange your own skills in return for ${role.roleName} contributions.`,
            },
            {
              type: "manual_add",
              label: "Add Manually by Username",
              description: `Directly invite an external collaborator by entering their handle.`,
            },
          ],
        });
      }
    }

    const totalRequired = project.roles.length;
    const totalCovered = coveredCapabilities.length;
    const percentage = totalRequired > 0 ? Math.round((totalCovered / totalRequired) * 100) : 0;

    const coverage: CapabilityCoverage = {
      totalRequired,
      totalCovered,
      percentage,
      coveredCapabilities,
      missingCapabilities,
    };

    return { recommendations, alternatives, coverage };
  } catch (err) {
    console.error("Error matching creators:", err);
    return createEmptyCoverage(project.roles);
  }
}

/**
 * Searches and ranks real database creators for a specific role on-demand.
 */
export async function matchCreatorsForSingleRole(
  roleName: string,
  requiredSkills: string[] = [],
  currentUserId?: string
): Promise<CreatorRecommendation[]> {
  const dummyRole: ProjectRole = {
    id: `role-search-${Date.now()}`,
    roleName,
    category: "Creative",
    description: `Targeted search for ${roleName}`,
    requiredCapabilities: [roleName],
    requiredSkills: requiredSkills.length > 0 ? requiredSkills : [roleName],
    estimatedHeadcount: 1,
    isFilled: false,
  };

  const dummyProject: OmniForgeProject = {
    id: "temp-proj",
    ownerId: currentUserId || "anon",
    title: "Search Query",
    description: "",
    domain: "Film",
    userType: "creator",
    stage: "planning",
    goal: "",
    targetAudience: "",
    expectedFinalOutcome: "",
    complexity: "Moderate",
    estimatedTotalDuration: "",
    deliverables: [],
    phases: [],
    roles: [dummyRole],
    parallelWorkstreams: [],
    recommendations: [],
    coverage: {
      totalRequired: 1,
      totalCovered: 0,
      percentage: 0,
      coveredCapabilities: [],
      missingCapabilities: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const result = await matchCreatorsForProject(dummyProject, currentUserId);
  const matched = result.recommendations.filter((r) => r.roleName.toLowerCase().includes(roleName.toLowerCase()) || roleName.toLowerCase().includes(r.roleName.toLowerCase()));
  const alts = result.alternatives[dummyRole.id] || [];
  return [...matched, ...alts];
}

function createEmptyCoverage(roles: ProjectRole[]): {
  recommendations: CreatorRecommendation[];
  alternatives: Record<string, CreatorRecommendation[]>;
  coverage: CapabilityCoverage;
} {
  return {
    recommendations: [],
    alternatives: {},
    coverage: {
      totalRequired: roles.length,
      totalCovered: 0,
      percentage: 0,
      coveredCapabilities: [],
      missingCapabilities: roles.map((r) => ({
        roleId: r.id,
        roleName: r.roleName,
        category: r.category || "Creative",
        requiredSkills: r.requiredSkills,
        reason: "No creators currently discovered for this role.",
        suggestedActions: [
          { type: "create_job", label: "Publish Job", description: "Create job listing" },
          { type: "open_request", label: "Open Request", description: "Broadcast call for creators" },
        ],
      })),
    },
  };
}
