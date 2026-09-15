import { ROLES, type RoleDef } from "./skill-hierarchy.ts";

export interface CreatorMatchProfile {
  id: string;
  username: string;
  full_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  portfolio_url?: string | null;
  roles: string[];
  skills: string[];
  specialties: string[];
  learningSkills?: string[];
  experienceLevel?: string | null;
  experienceYears?: number | null;
}

export interface JobMatchRequirements {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  skillsRequired: string[];
  rolesRequired?: string[];
  experienceLevel?: string | null;
  location?: string | null;
  budget?: string | null;
  deadline?: string | null;
  createdAt?: string;
}

export interface SkillMatchDetail {
  skill: string;
  matched: boolean;
  isExact: boolean;
  isSemantic: boolean;
  isLearning: boolean;
  matchedWith?: string;
}

export interface JobMatchResult {
  jobId: string;
  matchScore: number; // 0 - 100
  tier: "top" | "relevant" | "other";
  tierLabel: string;
  allRequiredSkills: string[];
  exactMatchedSkills: string[];
  semanticMatchedSkills: string[];
  learningMatchedSkills: string[];
  yourMatchingSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchedRoles: string[];
  matchedSpecialties: string[];
  isRoleMatch: boolean;
  searchMatchScore: number;
  requiredSkillMatchRatio: number;
  skillDetails: SkillMatchDetail[];
}

export interface CreatorMatchResult {
  creatorId: string;
  matchScore: number; // 0 - 100
  tier: "top" | "relevant" | "other";
  tierLabel: string;
  requiredSkills: string[];
  exactMatchedSkills: string[];
  creatorMatchingSkills: string[];
  matchedSkills: string[];
  missingSkills: string[];
  matchedRoles: string[];
  matchedSpecialties: string[];
  isRoleMatch: boolean;
  searchMatchScore: number;
  requiredSkillMatchRatio: number;
  skillDetails: SkillMatchDetail[];
}

// Normalized string helper
export function normalize(str: string): string {
  return (str || "")
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");
}

// Built-in semantic relationship cluster map
const SEMANTIC_CLUSTERS: Record<string, string[]> = {};

function initializeSemanticClusters() {
  if (Object.keys(SEMANTIC_CLUSTERS).length > 0) return;

  // High-frequency curated creative clusters
  const clusters: Record<string, string[]> = {
    video: [
      "video editor", "video editing", "premiere pro", "adobe premiere pro",
      "after effects", "adobe after effects", "motion graphics", "motion designer",
      "davinci resolve", "final cut pro", "capcut", "color grading", "sound design",
      "b roll", "timeline editing", "reels", "shorts", "youtube editor", "vfx",
      "videographer", "videography", "visual effects", "video production", "reel editor"
    ],
    photo: [
      "photo editor", "photo editing", "photographer", "photography",
      "photoshop", "adobe photoshop", "lightroom", "adobe lightroom",
      "retouching", "color correction", "portrait retouching", "frequency separation",
      "raw processing", "fashion photography", "commercial photography"
    ],
    graphic: [
      "graphic designer", "graphic design", "illustrator", "adobe illustrator",
      "photoshop", "figma", "canva", "branding", "logo design", "typography",
      "vector illustration", "thumbnail", "thumbnail designer", "poster design",
      "brand identity", "vector art"
    ],
    uiux: [
      "ui ux designer", "ui designer", "ux designer", "product designer",
      "figma", "wireframing", "prototyping", "design systems", "mobile app design",
      "web design", "framer", "user experience", "user interface"
    ],
    web: [
      "web developer", "frontend developer", "full stack developer", "software engineer",
      "react", "react.js", "next.js", "javascript", "typescript", "tailwind",
      "html", "css", "node.js", "web development"
    ],
    acting: [
      "actor", "acting", "drama", "theatre", "performing arts", "voice actor",
      "voiceover", "voice artist", "voice acting", "screenplay", "character"
    ],
    audio: [
      "audio engineer", "music producer", "sound design", "sound designer",
      "audio editing", "fl studio", "ableton", "logic pro", "pro tools",
      "audio mixing", "mastering", "podcast editor"
    ],
    marketing: [
      "social media manager", "content creator", "copywriting", "copywriter",
      "content strategist", "seo", "digital marketing", "growth marketing", "growth"
    ]
  };

  Object.entries(clusters).forEach(([key, list]) => {
    const normList = Array.from(new Set(list.map(normalize).filter(Boolean)));
    SEMANTIC_CLUSTERS[key] = normList;
    normList.forEach((term) => {
      if (!SEMANTIC_CLUSTERS[term]) {
        SEMANTIC_CLUSTERS[term] = normList;
      }
    });
  });

  // Supplement from ROLES definition
  try {
    ROLES.forEach((r: RoleDef) => {
      const roleKey = normalize(r.name);
      const related: string[] = [roleKey];
      r.skills.forEach((s) => {
        related.push(normalize(s.name));
        s.software.forEach((sw) => related.push(normalize(sw.name)));
        s.specialties.forEach((sp) => related.push(normalize(sp)));
        s.subSkillGroups.forEach((g) => g.items.forEach((item) => related.push(normalize(item))));
      });

      const uniqueTerms = Array.from(new Set(related.filter(Boolean)));
      if (!SEMANTIC_CLUSTERS[roleKey]) {
        SEMANTIC_CLUSTERS[roleKey] = uniqueTerms;
      } else {
        SEMANTIC_CLUSTERS[roleKey] = Array.from(new Set([...SEMANTIC_CLUSTERS[roleKey], ...uniqueTerms]));
      }

      uniqueTerms.forEach((t) => {
        if (!SEMANTIC_CLUSTERS[t]) {
          SEMANTIC_CLUSTERS[t] = uniqueTerms;
        }
      });
    });
  } catch {
    // fallback if skill-hierarchy is unavailable
  }
}

initializeSemanticClusters();

/**
 * Checks whether skillA and skillB are exact matches or closely semantically related.
 */
export function areSkillsRelated(
  skillA: string,
  skillB: string
): { matched: boolean; exact: boolean; semantic: boolean } {
  const normA = normalize(skillA);
  const normB = normalize(skillB);

  if (!normA || !normB) return { matched: false, exact: false, semantic: false };

  // Exact match
  if (normA === normB) {
    return { matched: true, exact: true, semantic: false };
  }

  // Direct substring match (e.g. "Premiere Pro" vs "Adobe Premiere Pro" or "Video Editor" vs "Video Editing")
  if (
    (normA.length > 3 && normB.includes(normA)) ||
    (normB.length > 3 && normA.includes(normB))
  ) {
    return { matched: true, exact: true, semantic: false };
  }

  // Semantic Cluster check
  const clusterA = SEMANTIC_CLUSTERS[normA];
  if (clusterA && clusterA.includes(normB)) {
    return { matched: true, exact: false, semantic: true };
  }

  for (const cluster of Object.values(SEMANTIC_CLUSTERS)) {
    const hasA = cluster.some((item) => item === normA || (item.length > 3 && (normA.includes(item) || item.includes(normA))));
    const hasB = cluster.some((item) => item === normB || (item.length > 3 && (normB.includes(item) || item.includes(normB))));
    if (hasA && hasB) {
      return { matched: true, exact: false, semantic: true };
    }
  }

  return { matched: false, exact: false, semantic: false };
}

/**
 * Extracts skills from text if no explicit skills list is given.
 */
export function extractSkillsFromText(text: string): string[] {
  const norm = normalize(text);
  const found: string[] = [];

  const commonKeywords = [
    "video editing", "video editor", "premiere pro", "after effects", "davinci resolve",
    "motion graphics", "graphic design", "illustrator", "photoshop", "ui ux", "figma",
    "web developer", "react", "actor", "acting", "color grading", "sound design",
    "photography", "photo editing", "copywriting"
  ];

  commonKeywords.forEach((kw) => {
    if (norm.includes(kw)) {
      found.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  });

  return Array.from(new Set(found));
}

/**
 * Calculates relevance score for a Creator discovering Briefs.
 * HIGHEST PRIORITY: Required skills match.
 * Creator with 3/3 required skills MUST rank above 2/3, which ranks above 0/3.
 */
export function calculateJobMatchScore(
  creator: CreatorMatchProfile,
  job: JobMatchRequirements,
  searchQuery?: string
): JobMatchResult {
  const allRequiredSkills =
    job.skillsRequired && job.skillsRequired.length > 0
      ? job.skillsRequired
      : extractSkillsFromText(`${job.title} ${job.description} ${job.category || ""}`);

  const creatorVerifiedSkills = creator.skills || [];
  const creatorSpecialties = creator.specialties || [];
  const creatorLearningSkills = creator.learningSkills || [];
  const creatorRoles = creator.roles || [];

  const creatorAllSkills = Array.from(new Set([...creatorVerifiedSkills, ...creatorSpecialties]));

  const exactMatchedSkills: string[] = [];
  const semanticMatchedSkills: string[] = [];
  const learningMatchedSkills: string[] = [];
  const yourMatchingSkills: string[] = [];
  const missingSkills: string[] = [];
  const skillDetails: SkillMatchDetail[] = [];

  let requiredSkillWeightSum = 0;
  let exactCount = 0;

  if (allRequiredSkills.length > 0) {
    allRequiredSkills.forEach((reqSkill) => {
      let matched = false;
      let isExact = false;
      let isSemantic = false;
      let isLearning = false;
      let matchedSkillName = "";

      // 1. Check verified skills and specialties for exact or semantic match
      for (const cSkill of creatorAllSkills) {
        const relation = areSkillsRelated(cSkill, reqSkill);
        if (relation.matched) {
          matched = true;
          matchedSkillName = cSkill;
          if (relation.exact) {
            isExact = true;
            isSemantic = false;
            break; // Stop at exact match
          } else {
            isSemantic = true;
          }
        }
      }

      // 2. If not matched in verified skills, check learning skills (partial credit)
      if (!matched) {
        for (const lSkill of creatorLearningSkills) {
          const relation = areSkillsRelated(lSkill, reqSkill);
          if (relation.matched) {
            matched = true;
            isLearning = true;
            matchedSkillName = `${lSkill} (Learning)`;
            break;
          }
        }
      }

      if (isExact) {
        exactCount++;
        requiredSkillWeightSum += 1.0;
        exactMatchedSkills.push(reqSkill);
        yourMatchingSkills.push(matchedSkillName || reqSkill);
      } else if (isSemantic) {
        requiredSkillWeightSum += 0.65;
        semanticMatchedSkills.push(reqSkill);
        yourMatchingSkills.push(`${matchedSkillName} (Related)`);
      } else if (isLearning) {
        requiredSkillWeightSum += 0.35;
        learningMatchedSkills.push(reqSkill);
        yourMatchingSkills.push(matchedSkillName);
      } else {
        missingSkills.push(reqSkill);
      }

      skillDetails.push({
        skill: reqSkill,
        matched,
        isExact,
        isSemantic,
        isLearning,
        matchedWith: matchedSkillName || undefined,
      });
    });
  }

  // 1. Calculate Required Skills Points (Max 60 points)
  // Required skills are the heaviest factor!
  let skillPoints = 0;
  const totalRequired = allRequiredSkills.length;
  const requiredSkillMatchRatio =
    totalRequired > 0 ? requiredSkillWeightSum / totalRequired : 0;

  if (totalRequired > 0) {
    // Proportional base points: up to 45
    skillPoints = requiredSkillMatchRatio * 45;

    // Strict Completion Bonuses to guarantee 3/3 > 2/3 > 1/3 > 0/3
    if (exactCount === totalRequired) {
      skillPoints += 15; // 100% full match bonus -> 60 total skill points
    } else if (exactCount >= 2 && exactCount >= Math.ceil(totalRequired * 0.6)) {
      skillPoints += 8; // majority match bonus
    } else if (exactCount >= 1) {
      skillPoints += 3;
    }
  } else {
    // If brief specifies no skills at all: neutral 25 points
    skillPoints = 25;
  }

  // 2. Roles Match Analysis (Max 20 points)
  let rolePoints = 0;
  let isRoleMatch = false;
  const matchedRoles: string[] = [];
  const jobRoleHays = [
    job.title,
    job.category || "",
    ...(job.rolesRequired || []),
  ].filter(Boolean);

  for (const cRole of creatorRoles) {
    for (const jRole of jobRoleHays) {
      const relation = areSkillsRelated(cRole, jRole);
      if (relation.matched) {
        isRoleMatch = true;
        matchedRoles.push(cRole);
        rolePoints = Math.max(rolePoints, relation.exact ? 20 : 12);
      }
    }
  }

  // 3. Specialties & Category Match Analysis (Max 10 points)
  let specialtyPoints = 0;
  const matchedSpecialties: string[] = [];
  const jobCategory = normalize(job.category || "");
  const jobText = normalize(`${job.title} ${job.description}`);

  creatorSpecialties.forEach((spec) => {
    const normSpec = normalize(spec);
    if (!normSpec) return;

    if (jobCategory && (jobCategory.includes(normSpec) || normSpec.includes(jobCategory))) {
      specialtyPoints = Math.max(specialtyPoints, 10);
      matchedSpecialties.push(spec);
    } else if (jobText.includes(normSpec)) {
      specialtyPoints = Math.max(specialtyPoints, 7);
      matchedSpecialties.push(spec);
    }
  });

  // 4. Experience Level Match (Max 10 points)
  let expPoints = 5;
  if (job.experienceLevel && creator.experienceLevel) {
    const jobLvl = normalize(job.experienceLevel);
    const userLvl = normalize(creator.experienceLevel);
    if (jobLvl === userLvl) {
      expPoints = 10;
    } else if (userLvl === "senior") {
      expPoints = 10; // Senior can perform intermediate or entry
    } else if (userLvl === "intermediate" && jobLvl === "entry") {
      expPoints = 8;
    } else {
      expPoints = 3;
    }
  }

  // 5. Search Keyword Relevance Boost (Max 20 points)
  let searchMatchScore = 0;
  if (searchQuery && searchQuery.trim()) {
    const qNorm = normalize(searchQuery);
    const jobContent = normalize(
      `${job.title} ${job.category || ""} ${(job.skillsRequired || []).join(" ")} ${(job.rolesRequired || []).join(" ")} ${job.description}`
    );

    if (jobContent.includes(qNorm)) {
      searchMatchScore = 20;
    } else {
      // Check semantic cluster for search query
      const relatedKeywords = SEMANTIC_CLUSTERS[qNorm] || [];
      const hasSemantic = relatedKeywords.some((kw) => kw.length > 2 && jobContent.includes(kw));
      if (hasSemantic) {
        searchMatchScore = 12;
      }
    }
  }

  // Calculate Total Score
  const rawScore = skillPoints + rolePoints + specialtyPoints + expPoints + searchMatchScore;
  let totalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  // If the brief had required skills, and creator has 0 required skills AND no role match,
  // cap total score to avoid false positive high scores
  if (totalRequired > 0 && exactCount === 0 && semanticMatchedSkills.length === 0 && !isRoleMatch) {
    totalScore = Math.min(25, totalScore);
  }

  // Tier Classification
  let tier: "top" | "relevant" | "other" = "other";
  let tierLabel = `${totalScore}% Match`;

  if (totalScore >= 70 && (exactCount >= 1 || isRoleMatch || totalRequired === 0)) {
    tier = "top";
    tierLabel = `${totalScore}% Match • Top Match`;
  } else if (totalScore >= 35) {
    tier = "relevant";
    tierLabel = `${totalScore}% Match • Partial Match`;
  } else {
    tier = "other";
    tierLabel = `${totalScore}% Match`;
  }

  return {
    jobId: job.id,
    matchScore: totalScore,
    tier,
    tierLabel,
    allRequiredSkills,
    exactMatchedSkills: Array.from(new Set(exactMatchedSkills)),
    semanticMatchedSkills: Array.from(new Set(semanticMatchedSkills)),
    learningMatchedSkills: Array.from(new Set(learningMatchedSkills)),
    yourMatchingSkills: Array.from(new Set(yourMatchingSkills)),
    matchedSkills: Array.from(new Set(yourMatchingSkills)),
    missingSkills: Array.from(new Set(missingSkills)),
    matchedRoles: Array.from(new Set(matchedRoles)),
    matchedSpecialties: Array.from(new Set(matchedSpecialties)),
    isRoleMatch,
    searchMatchScore,
    requiredSkillMatchRatio,
    skillDetails,
  };
}

/**
 * Calculates relevance score for a Client discovering Creators for a Brief.
 * Required skills must have higher priority than optional/general skills.
 * 3/3 required skills > 2/3 required skills > 0/3 required skills.
 */
export function calculateCreatorMatchForBrief(
  brief: JobMatchRequirements,
  creator: CreatorMatchProfile,
  searchQuery?: string
): CreatorMatchResult {
  const jobResult = calculateJobMatchScore(creator, brief, searchQuery);

  return {
    creatorId: creator.id,
    matchScore: jobResult.matchScore,
    tier: jobResult.tier,
    tierLabel: jobResult.tierLabel,
    requiredSkills: jobResult.allRequiredSkills,
    exactMatchedSkills: jobResult.exactMatchedSkills,
    creatorMatchingSkills: jobResult.yourMatchingSkills,
    matchedSkills: jobResult.matchedSkills,
    missingSkills: jobResult.missingSkills,
    matchedRoles: jobResult.matchedRoles,
    matchedSpecialties: jobResult.matchedSpecialties,
    isRoleMatch: jobResult.isRoleMatch,
    searchMatchScore: jobResult.searchMatchScore,
    requiredSkillMatchRatio: jobResult.requiredSkillMatchRatio,
    skillDetails: jobResult.skillDetails,
  };
}
