import { supabase } from '../src/integrations/supabase/client';
import { evaluateRoleMatchEvidence, RealCreatorProfile } from '../src/lib/omniforge/matcher';

export async function fetchCreatorDirectoryPool(currentUserId?: string): Promise<RealCreatorProfile[]> {
  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, bio, portfolio_url, website, experience_level, availability, account_type")
    .limit(500);

  if (profileErr || !profiles || profiles.length === 0) {
    return [];
  }

  const creatorIds = profiles.map((p) => p.id);

  const [
    { data: skillsData },
    { data: specData },
    { data: portfolioData },
    { data: portfolioItemsData },
    { data: rolesData },
  ] = await Promise.all([
    supabase.from("creator_skills").select("creator_id, skill_id, skills:skill_id(name)").in("creator_id", creatorIds),
    supabase.from("creator_specialties").select("user_id, specialty").in("user_id", creatorIds),
    supabase.from("portfolios").select("id, user_id, title, description, media_url, media_type, project_link").in("user_id", creatorIds),
    (supabase as any).from("portfolio_items").select("id, user_id, title, description, media_url, media_type, url, tech").in("user_id", creatorIds),
    supabase.from("creator_roles").select("creator_id, role_id, professional_roles:role_id(name)").in("creator_id", creatorIds),
  ]);

  const skillsByCreator = new Map<string, string[]>();
  (skillsData ?? []).forEach((row: any) => {
    const cid = row.creator_id;
    const sname = row.skills?.name || row.skill_id;
    if (sname) {
      const arr = skillsByCreator.get(cid) ?? [];
      if (!arr.includes(String(sname))) arr.push(String(sname));
      skillsByCreator.set(cid, arr);
    }
  });

  const specsByCreator = new Map<string, string[]>();
  (specData ?? []).forEach((row: any) => {
    const cid = row.user_id;
    if (row.specialty) {
      const arr = specsByCreator.get(cid) ?? [];
      if (!arr.includes(String(row.specialty))) arr.push(String(row.specialty));
      specsByCreator.set(cid, arr);
    }
  });

  const portfolioByCreator = new Map<string, Array<{ title: string; url?: string; mediaType?: string; description?: string }>>();
  (portfolioData ?? []).forEach((row: any) => {
    const cid = row.user_id || row.creator_id;
    const arr = portfolioByCreator.get(cid) ?? [];
    arr.push({
      title: row.title || "Portfolio Project",
      url: row.project_link || row.media_url,
      mediaType: row.media_type,
      description: row.description,
    });
    portfolioByCreator.set(cid, arr);
  });

  (portfolioItemsData ?? []).forEach((row: any) => {
    const cid = row.user_id;
    const arr = portfolioByCreator.get(cid) ?? [];
    arr.push({
      title: row.title || "Showcase Item",
      url: row.url || row.media_url,
      mediaType: row.media_type,
      description: row.description,
    });
    portfolioByCreator.set(cid, arr);
  });

  const rolesByCreator = new Map<string, string[]>();
  (rolesData ?? []).forEach((row: any) => {
    const cid = row.creator_id;
    const rname = row.professional_roles?.name;
    if (rname) {
      const arr = rolesByCreator.get(cid) ?? [];
      if (!arr.includes(String(rname))) arr.push(String(rname));
      rolesByCreator.set(cid, arr);
    }
  });

  return profiles
    .filter((p) => !currentUserId || p.id !== currentUserId)
    .map((p) => ({
      id: p.id,
      username: p.username || "creator",
      fullName: p.full_name || p.username || "Creative Professional",
      avatarUrl: p.avatar_url,
      role: p.role,
      bio: p.bio,
      portfolioUrl: p.portfolio_url,
      website: p.website,
      experienceLevel: p.experience_level,
      skills: skillsByCreator.get(p.id) || [],
      specialties: specsByCreator.get(p.id) || [],
      roles: rolesByCreator.get(p.id) || [],
      portfolioItemsCount: (portfolioByCreator.get(p.id) || []).length,
      portfolioSamples: portfolioByCreator.get(p.id) || [],
      availability: (p.availability as any) || "available",
    }));
}

export function computeRoleCandidateCount(pool: RealCreatorProfile[], roleName: string): number {
  let count = 0;
  for (const creator of pool) {
    const ev = evaluateRoleMatchEvidence(creator, roleName);
    if (ev.score > 0) count++;
  }
  return count;
}

async function testFastCounts() {
  const t0 = performance.now();
  const pool = await fetchCreatorDirectoryPool();
  console.log(`Fetched pool of ${pool.length} creators in ${Math.round(performance.now() - t0)}ms`);

  const roles = [
    "Lead Actor",
    "Lead Actress",
    "Dancer",
    "Choreographer",
    "Lead Singer",
    "Cinematographer",
    "Video Editor",
    "Sound Designer",
  ];

  for (const r of roles) {
    const count = computeRoleCandidateCount(pool, r);
    console.log(`${r}: count = ${count}`);
  }
}

testFastCounts().catch(console.error);
