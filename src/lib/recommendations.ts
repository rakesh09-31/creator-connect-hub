import { supabase } from "@/integrations/supabase/client";
import {
  calculateJobMatchScore,
  CreatorMatchProfile,
  JobMatchRequirements,
} from "./job-matching";

export interface RecommendedBrief {
  id: string;
  title: string;
  description: string;
  budget?: string | null;
  company_name?: string | null;
  category?: string | null;
  skills_required?: string[] | null;
  match_score: number;
  matched_skills: string[];
  created_at?: string;
}

/**
 * Retrieves skill-based recommended briefs for an authenticated creator.
 *
 * Requirements:
 * 1. Checks authenticated creator's profile, roles, skills, specialties.
 * 2. If creator has empty skills/roles, returns 0 briefs (no arbitrary recommendations).
 * 3. Uses PostgreSQL RPC get_recommended_jobs_for_creator with strict relevance filtering.
 * 4. Only returns briefs with genuine compatibility and match_score >= 50%.
 * 5. Returns matched skills for each brief so the UI can display proof of relevance.
 */
export async function getRecommendedBriefsForCreator(
  userId: string,
  limit = 10
): Promise<RecommendedBrief[]> {
  if (!userId) return [];

  try {
    // 1. Load creator profile and capabilities
    const [profileRes, rolesRes, skillsRes, specsRes] = await Promise.all([
      supabase.from("profiles").select("id, role, experience_level, bio").eq("id", userId).maybeSingle(),
      supabase.from("creator_roles").select("role_id, professional_roles(name)").eq("creator_id", userId),
      supabase.from("creator_skills").select("skill_id, skills(name)").eq("creator_id", userId),
      supabase.from("creator_specialties").select("specialty").eq("user_id", userId),
    ]);

    const myRoles = (rolesRes.data ?? [])
      .map((r: any) => r.professional_roles?.name)
      .filter(Boolean);
    const mySkills = (skillsRes.data ?? [])
      .map((s: any) => s.skills?.name)
      .filter(Boolean);
    const mySpecialties = (specsRes.data ?? [])
      .map((s: any) => s.specialty)
      .filter(Boolean);

    // Strict Rule: If creator has NO roles, NO skills, and NO specialties,
    // do NOT show arbitrary recommendations. Return empty immediately.
    if (myRoles.length === 0 && mySkills.length === 0 && mySpecialties.length === 0) {
      return [];
    }

    // 2. Call backend recommendation RPC
    const { data: recs, error: rpcError } = await (supabase.rpc as any)(
      "get_recommended_jobs_for_creator",
      { p_creator_id: userId, p_limit: limit }
    );

    if (!rpcError && Array.isArray(recs)) {
      if (recs.length === 0) {
        return [];
      }

      const jobIds = recs.map((r: any) => r.job_id);
      const { data: jobDetails } = await supabase.from("jobs").select("*").in("id", jobIds);
      const jobMap = new Map((jobDetails ?? []).map((j: any) => [j.id, j]));

      return recs
        .map((rec: any) => {
          const detail = jobMap.get(rec.job_id) || {};
          const score = Math.round(Number(rec.matching_score ?? rec.match_score ?? 0));
          const matchedSkills = Array.isArray(rec.matched_skills)
            ? rec.matched_skills.filter(Boolean)
            : [];

          return {
            id: rec.job_id,
            title: rec.title || detail.title || "Untitled Brief",
            description: rec.description || detail.description || "",
            budget: rec.budget || detail.budget || null,
            company_name: rec.company_name || detail.company_name || null,
            category: detail.category || null,
            skills_required: detail.skills_required || null,
            match_score: score,
            matched_skills: matchedSkills,
            created_at: detail.created_at,
          };
        })
        .filter((b) => b.match_score >= 50 && (b.matched_skills.length > 0 || myRoles.length > 0))
        .sort((a, b) => b.match_score - a.match_score);
    }

    // 3. Fallback: Client-side strict calculation if RPC encountered an error
    console.warn("[recommendations] RPC fallback to client-side matching engine:", rpcError);
    const { data: rawJobs } = await supabase
      .from("jobs")
      .select("*, job_roles(professional_roles(name)), job_skills(skills(name))")
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(30);

    if (!rawJobs || rawJobs.length === 0) return [];

    const creatorProfile: CreatorMatchProfile = {
      id: userId,
      username: (profileRes.data as any)?.username || "",
      roles: myRoles,
      skills: mySkills,
      specialties: mySpecialties,
      experienceLevel: (profileRes.data as any)?.experience_level || undefined,
      bio: (profileRes.data as any)?.bio || undefined,
    };

    const evaluated: RecommendedBrief[] = [];

    for (const job of rawJobs) {
      const joinedRoles: string[] = (job.job_roles ?? [])
        .map((jr: any) => jr.professional_roles?.name)
        .filter(Boolean);
      const joinedSkills: string[] = (job.job_skills ?? [])
        .map((js: any) => js.skills?.name)
        .filter(Boolean);

      const combinedSkills = Array.from(new Set([...(job.skills_required ?? []), ...joinedSkills]));

      const req: JobMatchRequirements = {
        id: job.id,
        title: job.title,
        description: job.description,
        category: job.category ?? undefined,
        skillsRequired: combinedSkills,
        rolesRequired: joinedRoles,
        specialtiesRequired: job.specialties_required ?? [],
        experienceLevel: job.experience_level ?? undefined,
      };

      const match = calculateJobMatchScore(creatorProfile, req);

      if (match.matchScore >= 50 && (match.matchedSkills.length > 0 || match.isRoleMatch)) {
        evaluated.push({
          id: job.id,
          title: job.title,
          description: job.description,
          budget: job.budget || null,
          company_name: job.company_name || null,
          category: job.category || null,
          skills_required: combinedSkills,
          match_score: match.matchScore,
          matched_skills: match.matchedSkills,
          created_at: job.created_at,
        });
      }
    }

    return evaluated.sort((a, b) => b.match_score - a.match_score).slice(0, limit);
  } catch (error) {
    console.error("[recommendations] Error retrieving recommended briefs:", error);
    return [];
  }
}
