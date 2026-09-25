import { supabase } from "@/integrations/supabase/client";
import { SkillSwapListingMatch } from "./types";

export interface SkillSwapSearchOptions {
  needSkillOrRole?: string; // what the user needs (e.g. "cinematographer", "graphic design")
  offerSkill?: string; // what the user offers (e.g. "video editing", "web development")
  currentUserId?: string;
  limit?: number;
}

/**
 * Searches real active Skill Swap listings from Supabase.
 * Strictly verifies against actual database records; never invents fake listings or trades.
 */
export async function searchRealSkillSwapListings(
  options: SkillSwapSearchOptions = {}
): Promise<SkillSwapListingMatch[]> {
  try {
    const { needSkillOrRole, offerSkill, currentUserId, limit = 5 } = options;

    // 1. Fetch active listings from Supabase
    let query = (supabase as any)
      .from("skill_swap_listings")
      .select("id, user_id, title, role, description, learning_mode, availability, overall_score, skill_level, created_at")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(20);

    const { data: listings, error: lErr } = await query;
    if (lErr || !listings || listings.length === 0) {
      return [];
    }

    const listingIds = listings.map((l: any) => l.id);
    const userIds = [...new Set(listings.map((l: any) => l.user_id).filter(Boolean))];

    // 2. Fetch profiles, teach skills, and learn skills in parallel
    const [profilesRes, teachRes, learnRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", userIds as string[])
        : Promise.resolve({ data: [] }),
      listingIds.length > 0
        ? (supabase as any).from("skill_swap_listing_teach_skills").select("listing_id, skill_name, sub_skills, software, specialties").in("listing_id", listingIds)
        : Promise.resolve({ data: [] }),
      listingIds.length > 0
        ? (supabase as any).from("skill_swap_listing_learn_skills").select("listing_id, skill_name, desired_software").in("listing_id", listingIds)
        : Promise.resolve({ data: [] }),
    ]);

    const profileMap = new Map<string, { username: string; fullName: string | null; avatarUrl: string | null }>();
    (profilesRes.data || []).forEach((p: any) => {
      profileMap.set(p.id, {
        username: p.username || "creator",
        fullName: p.full_name || p.username || "Creator",
        avatarUrl: p.avatar_url || null,
      });
    });

    const teachMap = new Map<string, string[]>();
    (teachRes.data || []).forEach((t: any) => {
      const skills = teachMap.get(t.listing_id) || [];
      if (t.skill_name) skills.push(t.skill_name);
      if (Array.isArray(t.software)) skills.push(...t.software);
      teachMap.set(t.listing_id, skills);
    });

    const learnMap = new Map<string, string[]>();
    (learnRes.data || []).forEach((l: any) => {
      const skills = learnMap.get(l.listing_id) || [];
      if (l.skill_name) skills.push(l.skill_name);
      learnMap.set(l.listing_id, skills);
    });

    // 3. Assemble and rank listings against user criteria
    const needLower = (needSkillOrRole || "").toLowerCase();
    const offerLower = (offerSkill || "").toLowerCase();

    const scored: Array<{ match: SkillSwapListingMatch; score: number }> = [];

    for (const listing of listings) {
      if (currentUserId && listing.user_id === currentUserId) {
        continue; // Don't match the user with their own listing
      }

      const prof = profileMap.get(listing.user_id) || {
        username: "creator",
        fullName: "Creator",
        avatarUrl: null,
      };

      const teachSkills = teachMap.get(listing.id) || [];
      const learnSkills = learnMap.get(listing.id) || [];

      // If teachSkills is empty, extract from title or role
      if (teachSkills.length === 0 && listing.role) {
        teachSkills.push(listing.role);
      }

      let score = 50; // Base score for any active listing
      const reasonParts: string[] = [];

      const teachJoined = (teachSkills.join(" ") + " " + listing.title + " " + (listing.description || "")).toLowerCase();
      const learnJoined = (learnSkills.join(" ") + " " + listing.title + " " + (listing.description || "")).toLowerCase();

      // Check if this listing teaches what the user needs
      if (needLower) {
        const matchesNeed =
          teachJoined.includes(needLower) ||
          teachSkills.some((s) => s.toLowerCase().includes(needLower) || needLower.includes(s.toLowerCase()));

        if (matchesNeed) {
          score += 35;
          reasonParts.push(`offers ${needSkillOrRole}`);
        }
      }

      // Check if this listing wants to learn what the user offers
      if (offerLower) {
        const matchesOffer =
          learnJoined.includes(offerLower) ||
          learnSkills.some((s) => s.toLowerCase().includes(offerLower) || offerLower.includes(s.toLowerCase()));

        if (matchesOffer) {
          score += 35;
          reasonParts.push(`wants to learn ${offerSkill}`);
        }
      }

      const matchReason =
        reasonParts.length > 0
          ? `Verified match: creator ${reasonParts.join(" and ")}.`
          : `Active Skill Swap listing offering ${teachSkills.slice(0, 2).join(", ") || listing.role || "creative collaboration"}.`;

      scored.push({
        score,
        match: {
          id: listing.id,
          userId: listing.user_id,
          creatorName: prof.fullName || prof.username,
          creatorAvatar: prof.avatarUrl,
          title: listing.title,
          description: listing.description || `Offers: ${teachSkills.join(", ")} | Looking for: ${learnSkills.join(", ")}`,
          category: listing.role || "Collaboration",
          teachSkills,
          learnSkills,
          matchScore: Math.min(score, 98),
          matchReason,
        },
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit).map((s) => s.match);
  } catch (err) {
    console.error("Error searching skill swap listings:", err);
    return [];
  }
}
