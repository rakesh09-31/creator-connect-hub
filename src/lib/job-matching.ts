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
  specialtiesRequired?: string[];
  experienceLevel?: string | null;
  location?: string | null;
  budget?: string | null;
  deadline?: string | null;
  createdAt?: string;
}

export type MatchStatus = "direct" | "related" | "missing";

export interface RequirementEvidence {
  requirement: string;
  type: "role" | "skill" | "specialty" | "experience";
  status: MatchStatus;
  evidenceSource: string;
  evidenceField?: "role" | "skill" | "specialty" | "bio" | "experience";
  matchedWith?: string;
  strength: number; // 0 to 1.0
}

export interface SkillMatchDetail {
  skill: string;
  matched: boolean;
  isExact: boolean;
  isSemantic: boolean;
  isLearning: boolean;
  matchedWith?: string;
  evidenceSource?: string;
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
  allRequiredSpecialties: string[];
  matchedSpecialties: string[];
  missingSpecialties: string[];
  matchedRoles: string[];
  missingRoles: string[];
  isRoleMatch: boolean;
  isExperienceMatch: boolean;
  experienceLabel: string;
  searchMatchScore: number;
  requiredSkillMatchRatio: number;
  skillDetails: SkillMatchDetail[];
  evidenceDetails: RequirementEvidence[];
  matchedRequirements: RequirementEvidence[];
  relatedRequirements: RequirementEvidence[];
  missingRequirements: RequirementEvidence[];
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
  matchedSpecialties: string[];
  missingSpecialties: string[];
  matchedRoles: string[];
  isRoleMatch: boolean;
  isExperienceMatch: boolean;
  experienceLabel: string;
  searchMatchScore: number;
  requiredSkillMatchRatio: number;
  skillDetails: SkillMatchDetail[];
  evidenceDetails: RequirementEvidence[];
  matchedRequirements: RequirementEvidence[];
  relatedRequirements: RequirementEvidence[];
  missingRequirements: RequirementEvidence[];
}

// Normalized string helper: case-insensitive, trimmed, alphanumeric tokens, singularization
export function normalize(str: string): string {
  if (!str) return "";
  let s = str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ");

  // Normalization for common plurals to singular roots
  const knownPlurals: Record<string, string> = {
    actors: "actor",
    dancers: "dancer",
    singers: "singer",
    photographers: "photographer",
    editors: "editor",
    writers: "writer",
    directors: "director",
    animators: "animator",
    designers: "designer",
    cinematographers: "cinematographer",
    commercials: "commercial",
    skills: "skill",
    specialties: "specialty",
    performances: "performance",
    videos: "video",
    photos: "photo",
  };

  if (knownPlurals[s]) return knownPlurals[s];
  return s;
}

/**
 * Controlled canonical bidirectional relationships between professional roles and capabilities.
 * If a creator has this role, they have canonical support for these capabilities and vice versa.
 */
export const CANONICAL_ROLE_CAPABILITY_MAP: Record<string, string[]> = {
  actor: [
    "acting",
    "screen performance",
    "theatre acting",
    "method acting",
    "stage acting",
    "film acting",
    "character portrayal",
    "dramatic acting",
    "actor",
  ],
  dancer: [
    "dance",
    "choreography",
    "stage performance",
    "contemporary dance",
    "hip hop",
    "ballet",
    "dancer",
  ],
  singer: [
    "singing",
    "vocal performance",
    "vocalist",
    "vocals",
    "playback singing",
    "voice modulation",
    "singer",
  ],
  photographer: [
    "photography",
    "photoshoot",
    "photo capture",
    "portrait photography",
    "commercial photography",
    "photographer",
  ],
  "video editor": [
    "video editing",
    "timeline editing",
    "cut editing",
    "video assembly",
    "post production",
    "video editor",
  ],
  editor: [
    "video editing",
    "editing",
    "timeline editing",
    "post production",
    "editor",
  ],
  writer: [
    "writing",
    "copywriting",
    "screenwriting",
    "scriptwriting",
    "creative writing",
    "content writing",
    "storytelling",
    "writer",
  ],
  director: [
    "directing",
    "film directing",
    "video directing",
    "creative direction",
    "director",
  ],
  animator: [
    "animation",
    "2d animation",
    "3d animation",
    "character animation",
    "motion design",
    "animator",
  ],
  designer: [
    "design",
    "graphic design",
    "visual design",
    "ui ux",
    "brand identity",
    "branding design",
    "designer",
  ],
  cinematographer: [
    "cinematography",
    "camera operator",
    "director of photography",
    "dop",
    "lighting cinematography",
    "cinematographer",
  ],
  "voice artist": [
    "voice acting",
    "voiceover",
    "voice actor",
    "narration",
    "dubbing",
    "audiobook narration",
    "voice artist",
  ],
  "voice actor": [
    "voice acting",
    "voiceover",
    "voice artist",
    "narration",
    "dubbing",
    "audiobook narration",
    "voice actor",
  ],
  "content creator": [
    "content creation",
    "vlogging",
    "reels creation",
    "video production",
    "influencer content",
    "content creator",
  ],
};

// Defined related/partial capability pairs (0.65 evidence strength)
export const RELATED_CAPABILITY_MAP: Record<string, string[]> = {
  "video editing": ["video production", "post production", "youtube editing", "color grading", "sound design"],
  "video production": ["video editing", "cinematography", "directing"],
  "cinematography": ["photography", "camera operator", "lighting"],
  "photography": ["cinematography", "photo editing"],
  "voice acting": ["acting", "narration", "voiceover"],
  "acting": ["voice acting", "screen performance", "dialogue delivery", "film acting", "theatre"],
  "film acting": ["acting", "actor", "screen performance", "theatre"],
  "graphic design": ["ui ux", "illustration", "motion graphics", "brand identity"],
  "directing": ["storytelling", "video production", "cinematography"],
};

// Built-in semantic relationship cluster map for synonyms and software tools
const SEMANTIC_CLUSTERS: Record<string, string[]> = {
  video_editing: ["video editor", "video editing", "timeline editing", "video assembly", "cut editing"],
  premiere: ["premiere pro", "adobe premiere pro", "premiere", "adobe premiere"],
  after_effects: ["after effects", "adobe after effects"],
  davinci: ["davinci resolve", "davinci", "resolve"],
  final_cut: ["final cut pro", "final cut", "fcp", "fcpx"],
  capcut: ["capcut", "capcut editor"],
  color_grading: ["color grading", "color correction", "lut grading", "colorist"],
  sound_design: ["sound design", "audio design", "foley", "audio editing"],
  motion_graphics: ["motion graphics", "motion designer", "motion design", "mograph"],
  youtube_editing: ["youtube editing", "youtube editor", "youtube video editing"],
  short_form: ["short form content", "shorts editing", "reels editing", "tiktok editing", "vertical video"],
  photoshop: ["photoshop", "adobe photoshop"],
  lightroom: ["lightroom", "adobe lightroom"],
  illustrator: ["illustrator", "adobe illustrator"],
  figma: ["figma", "figma design"],
  acting: ["actor", "acting", "screen performance", "theatre acting", "method acting", "film acting"],
  voice_acting: ["voice actor", "voice acting", "voiceover", "voice artist", "narration", "dubbing"],
  photography: ["photographer", "photography", "photoshoot"],
  photo_editing: ["photo editor", "photo editing", "retouching", "portrait retouching"],
  graphic_design: ["graphic designer", "graphic design", "visual designer"],
  uiux: ["ui ux designer", "ui designer", "ux designer", "product designer"],
  web_dev: ["web developer", "frontend developer", "full stack developer", "software engineer"],
  dance: ["dancer", "dance", "choreographer", "choreography"],
  singing: ["singer", "singing", "vocalist", "vocals"],
  writing: ["writer", "writing", "copywriting", "copywriter", "screenwriting", "scriptwriter"],
};

/**
 * Checks whether itemA and itemB are exact matches or semantically related.
 */
export function areSkillsRelated(
  itemA: string,
  itemB: string
): { matched: boolean; exact: boolean; semantic: boolean } {
  const normA = normalize(itemA);
  const normB = normalize(itemB);

  if (!normA || !normB) return { matched: false, exact: false, semantic: false };

  if (normA === normB) {
    return { matched: true, exact: true, semantic: false };
  }

  // Token / Substring exact match for multi-word phrases
  if (
    (normA.length > 3 && normB.includes(normA)) ||
    (normB.length > 3 && normA.includes(normB))
  ) {
    return { matched: true, exact: true, semantic: false };
  }

  // Check canonical role-capability map
  for (const [roleKey, capabilities] of Object.entries(CANONICAL_ROLE_CAPABILITY_MAP)) {
    const normKey = normalize(roleKey);
    const normCaps = capabilities.map(normalize);
    const hasA = normA === normKey || normCaps.includes(normA);
    const hasB = normB === normKey || normCaps.includes(normB);
    if (hasA && hasB) {
      return { matched: true, exact: true, semantic: false };
    }
  }

  // Check semantic clusters
  for (const cluster of Object.values(SEMANTIC_CLUSTERS)) {
    const normCluster = cluster.map(normalize);
    const hasA = normCluster.some((item) => item === normA || (item.length > 3 && (normA.includes(item) || item.includes(normA))));
    const hasB = normCluster.some((item) => item === normB || (item.length > 3 && (normB.includes(item) || item.includes(normB))));
    if (hasA && hasB) {
      return { matched: true, exact: false, semantic: true };
    }
  }

  // Check related capability map
  for (const [capKey, relatedList] of Object.entries(RELATED_CAPABILITY_MAP)) {
    const normKey = normalize(capKey);
    const normRelated = relatedList.map(normalize);
    const hasA = normA === normKey || normRelated.includes(normA);
    const hasB = normB === normKey || normRelated.includes(normB);
    if (hasA && hasB) {
      return { matched: true, exact: false, semantic: true };
    }
  }

  return { matched: false, exact: false, semantic: false };
}

/**
 * Cross-Field Evidence Search for ANY Job Requirement.
 * Searches: Roles, Skills, Specialties, Learning Skills, Bio, and Experience.
 * Determines the strongest available evidence source and returns structured analysis.
 */
export function findRequirementEvidence(
  reqItem: string,
  reqType: "role" | "skill" | "specialty",
  creator: CreatorMatchProfile
): RequirementEvidence {
  const normReq = normalize(reqItem);
  if (!normReq) {
    return {
      requirement: reqItem,
      type: reqType,
      status: "missing",
      evidenceSource: "No requirement specified",
      strength: 0,
    };
  }

  const cRoles = creator.roles || [];
  const cSkills = creator.skills || [];
  const cSpecs = creator.specialties || [];
  const cLearning = creator.learningSkills || [];
  const bioText = normalize(creator.bio || "");

  // 1. Check EXACT MATCH in Primary Field
  if (reqType === "skill") {
    for (const s of cSkills) {
      const rel = areSkillsRelated(s, reqItem);
      if (rel.matched && rel.exact) {
        return {
          requirement: reqItem,
          type: "skill",
          status: "direct",
          evidenceSource: `Skill → ${s}`,
          evidenceField: "skill",
          matchedWith: s,
          strength: 1.0,
        };
      }
    }
  } else if (reqType === "role") {
    for (const r of cRoles) {
      const rel = areSkillsRelated(r, reqItem);
      if (rel.matched && rel.exact) {
        return {
          requirement: reqItem,
          type: "role",
          status: "direct",
          evidenceSource: `Professional Role → ${r}`,
          evidenceField: "role",
          matchedWith: r,
          strength: 1.0,
        };
      }
    }
  } else if (reqType === "specialty") {
    for (const sp of cSpecs) {
      const rel = areSkillsRelated(sp, reqItem);
      if (rel.matched && rel.exact) {
        return {
          requirement: reqItem,
          type: "specialty",
          status: "direct",
          evidenceSource: `Specialty → ${sp}`,
          evidenceField: "specialty",
          matchedWith: sp,
          strength: 1.0,
        };
      }
    }
  }

  // 2. Check ROLE-CAPABILITY CANONICAL CROSS-FIELD MATCH (Strong Evidence)
  // E.g., Requirement: Skill "Acting" ↔ Creator Role: "Actor"
  for (const r of cRoles) {
    const normRole = normalize(r);
    // Check canonical role capability map
    const caps = CANONICAL_ROLE_CAPABILITY_MAP[normRole];
    if (caps && caps.some((c) => normalize(c) === normReq || normReq.includes(normalize(c)) || normalize(c).includes(normReq))) {
      return {
        requirement: reqItem,
        type: reqType,
        status: "direct",
        evidenceSource: `Professional Role → ${r}`,
        evidenceField: "role",
        matchedWith: r,
        strength: 1.0,
      };
    }
    // Also check generic relationship
    const rel = areSkillsRelated(r, reqItem);
    if (rel.matched) {
      return {
        requirement: reqItem,
        type: reqType,
        status: rel.exact ? "direct" : "related",
        evidenceSource: `Professional Role → ${r}`,
        evidenceField: "role",
        matchedWith: r,
        strength: rel.exact ? 1.0 : 0.75,
      };
    }
  }

  // 3. Check CROSS-FIELD SPECIALTIES
  // E.g., Requirement: Skill "Film Acting" ↔ Creator Specialty: "Film Acting"
  for (const sp of cSpecs) {
    const rel = areSkillsRelated(sp, reqItem);
    if (rel.matched) {
      return {
        requirement: reqItem,
        type: reqType,
        status: rel.exact ? "direct" : "related",
        evidenceSource: `Specialty → ${sp}`,
        evidenceField: "specialty",
        matchedWith: sp,
        strength: rel.exact ? 0.95 : 0.7,
      };
    }
  }

  // 4. Check CROSS-FIELD SKILLS
  // E.g., Requirement: Specialty "Video Editing" ↔ Creator Skill: "Video Editing"
  for (const s of cSkills) {
    const rel = areSkillsRelated(s, reqItem);
    if (rel.matched) {
      return {
        requirement: reqItem,
        type: reqType,
        status: rel.exact ? "direct" : "related",
        evidenceSource: `Skill → ${s}`,
        evidenceField: "skill",
        matchedWith: s,
        strength: rel.exact ? 0.95 : 0.7,
      };
    }
  }

  // 5. Check LEARNING SKILLS (Partial match)
  for (const l of cLearning) {
    const rel = areSkillsRelated(l, reqItem);
    if (rel.matched) {
      return {
        requirement: reqItem,
        type: reqType,
        status: "related",
        evidenceSource: `Learning Skill → ${l}`,
        evidenceField: "skill",
        matchedWith: l,
        strength: 0.4,
      };
    }
  }

  // 6. Check BIO / EXPERIENCE PROFILE EVIDENCE
  if (bioText && normReq.length > 3 && bioText.includes(normReq)) {
    return {
      requirement: reqItem,
      type: reqType,
      status: "related",
      evidenceSource: `Profile Bio / Professional Evidence`,
      evidenceField: "bio",
      matchedWith: reqItem,
      strength: 0.5,
    };
  }

  // 7. TRULY MISSING: Only after searching complete creator profile
  return {
    requirement: reqItem,
    type: reqType,
    status: "missing",
    evidenceSource: `Missing across all profile fields`,
    strength: 0.0,
  };
}

/**
 * Extracts skills or specialties from text when not explicitly provided.
 */
export function extractSkillsFromText(text: string): string[] {
  const norm = normalize(text);
  const found: string[] = [];

  const commonKeywords = [
    "video editing", "video editor", "premiere pro", "after effects", "davinci resolve",
    "motion graphics", "graphic design", "illustrator", "photoshop", "ui ux", "figma",
    "web developer", "react", "actor", "acting", "color grading", "sound design",
    "photography", "photo editing", "copywriting", "youtube editing", "short form content",
    "film acting", "voice acting"
  ];

  commonKeywords.forEach((kw) => {
    if (norm.includes(kw)) {
      found.push(kw.charAt(0).toUpperCase() + kw.slice(1));
    }
  });

  return Array.from(new Set(found));
}

/**
 * Extracts required specialties from a Job.
 */
export function extractSpecialtiesFromJob(job: {
  specialtiesRequired?: string[] | null;
  specialties_required?: string[] | null;
  description?: string;
  category?: string | null;
}): string[] {
  const explicit = job.specialtiesRequired || job.specialties_required;
  if (explicit && explicit.length > 0) {
    return explicit;
  }
  const desc = job.description || "";
  const metaMatch = desc.match(/<!--meta:specialties=(.*?)-->/);
  if (metaMatch) {
    try {
      const parsed = JSON.parse(metaMatch[1]);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  const textMatch = desc.match(/\[Required Specialties:\s*([^\]]+)\]/i);
  if (textMatch) {
    return textMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Deterministic AI Matching Algorithm with CROSS-FIELD SEMANTIC MATCHING:
 * Evaluates Creator (Roles, Skills, Specialties, Experience, Bio) against
 * Job (Required Roles, Required Skills, Required Specialties, Required Experience).
 *
 * Weights:
 * - Role alignment: 25%
 * - Skill/capability alignment: 40%
 * - Specialty alignment: 20%
 * - Experience alignment: 15%
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

  const allRequiredSpecialties =
    job.specialtiesRequired && job.specialtiesRequired.length > 0
      ? job.specialtiesRequired
      : extractSpecialtiesFromJob(job);

  const jobRoles =
    job.rolesRequired && job.rolesRequired.length > 0
      ? job.rolesRequired
      : [job.title, job.category || ""].filter(Boolean);

  const evidenceDetails: RequirementEvidence[] = [];
  const matchedRequirements: RequirementEvidence[] = [];
  const relatedRequirements: RequirementEvidence[] = [];
  const missingRequirements: RequirementEvidence[] = [];

  // =========================================================================
  // 1. EVALUATE ROLES (Max 25 points)
  // =========================================================================
  const matchedRoles: string[] = [];
  const missingRoles: string[] = [];
  let roleEvidenceSum = 0;
  let isRoleMatch = false;

  if (job.rolesRequired && job.rolesRequired.length > 0) {
    job.rolesRequired.forEach((reqRole) => {
      const evidence = findRequirementEvidence(reqRole, "role", creator);
      evidenceDetails.push(evidence);

      if (evidence.status === "direct") {
        matchedRoles.push(reqRole);
        matchedRequirements.push(evidence);
        roleEvidenceSum += evidence.strength;
        isRoleMatch = true;
      } else if (evidence.status === "related") {
        matchedRoles.push(`${reqRole} (Related)`);
        relatedRequirements.push(evidence);
        roleEvidenceSum += evidence.strength;
        isRoleMatch = true;
      } else {
        missingRoles.push(reqRole);
        missingRequirements.push(evidence);
      }
    });
  } else {
    // Check title/category roles against creator
    let bestStrength = 0;
    for (const jRole of jobRoles) {
      const evidence = findRequirementEvidence(jRole, "role", creator);
      if (evidence.strength > bestStrength) {
        bestStrength = evidence.strength;
        if (evidence.status !== "missing") {
          isRoleMatch = true;
          matchedRoles.push(evidence.matchedWith || jRole);
          evidenceDetails.push(evidence);
          matchedRequirements.push(evidence);
        }
      }
    }
    roleEvidenceSum = bestStrength > 0 ? bestStrength : 0.2; // neutral base if no role was specified
  }

  const roleWeightRatio =
    job.rolesRequired && job.rolesRequired.length > 0
      ? roleEvidenceSum / job.rolesRequired.length
      : isRoleMatch ? 1.0 : 0.2;

  const rolePoints = Math.min(25.0, Math.max(0, roleWeightRatio * 25.0));

  // =========================================================================
  // 2. EVALUATE SKILLS (Max 40 points)
  // =========================================================================
  const exactMatchedSkills: string[] = [];
  const semanticMatchedSkills: string[] = [];
  const learningMatchedSkills: string[] = [];
  const yourMatchingSkills: string[] = [];
  const missingSkills: string[] = [];
  const skillDetails: SkillMatchDetail[] = [];

  let skillEvidenceSum = 0;
  const totalRequiredSkills = allRequiredSkills.length;

  if (totalRequiredSkills > 0) {
    allRequiredSkills.forEach((reqSkill) => {
      const evidence = findRequirementEvidence(reqSkill, "skill", creator);
      evidenceDetails.push(evidence);

      const isExact = evidence.status === "direct";
      const isSemantic = evidence.status === "related";
      const isLearning = evidence.evidenceSource.includes("Learning");
      const matched = evidence.status !== "missing";

      if (isExact) {
        exactMatchedSkills.push(reqSkill);
        yourMatchingSkills.push(reqSkill);
        matchedRequirements.push(evidence);
        skillEvidenceSum += evidence.strength;
      } else if (isSemantic) {
        semanticMatchedSkills.push(reqSkill);
        yourMatchingSkills.push(`${reqSkill} (${evidence.evidenceSource})`);
        relatedRequirements.push(evidence);
        skillEvidenceSum += evidence.strength;
      } else if (isLearning) {
        learningMatchedSkills.push(reqSkill);
        yourMatchingSkills.push(`${reqSkill} (Learning)`);
        relatedRequirements.push(evidence);
        skillEvidenceSum += evidence.strength;
      } else {
        missingSkills.push(reqSkill);
        missingRequirements.push(evidence);
      }

      skillDetails.push({
        skill: reqSkill,
        matched,
        isExact,
        isSemantic,
        isLearning,
        matchedWith: evidence.matchedWith,
        evidenceSource: evidence.evidenceSource,
      });
    });
  }

  const requiredSkillMatchRatio =
    totalRequiredSkills > 0 ? skillEvidenceSum / totalRequiredSkills : 0.5;

  const skillPoints =
    totalRequiredSkills > 0 ? requiredSkillMatchRatio * 40.0 : 20.0;

  // =========================================================================
  // 3. EVALUATE SPECIALTIES (Max 20 points)
  // =========================================================================
  const matchedSpecialties: string[] = [];
  const missingSpecialties: string[] = [];
  let specialtyEvidenceSum = 0;
  const totalRequiredSpecialties = allRequiredSpecialties.length;

  if (totalRequiredSpecialties > 0) {
    allRequiredSpecialties.forEach((reqSpec) => {
      const evidence = findRequirementEvidence(reqSpec, "specialty", creator);
      evidenceDetails.push(evidence);

      if (evidence.status === "direct") {
        matchedSpecialties.push(reqSpec);
        matchedRequirements.push(evidence);
        specialtyEvidenceSum += evidence.strength;
      } else if (evidence.status === "related") {
        matchedSpecialties.push(`${reqSpec} (Related)`);
        relatedRequirements.push(evidence);
        specialtyEvidenceSum += evidence.strength;
      } else {
        missingSpecialties.push(reqSpec);
        missingRequirements.push(evidence);
      }
    });
  } else {
    // If job didn't specify specialties, check if creator's specialties match job text
    const jobText = normalize(`${job.title} ${job.description} ${job.category || ""}`);
    let specBonus = 0;
    (creator.specialties || []).forEach((cSpec) => {
      const normSpec = normalize(cSpec);
      if (normSpec && jobText.includes(normSpec)) {
        specBonus += 0.5;
        matchedSpecialties.push(cSpec);
      }
    });
    specialtyEvidenceSum = Math.min(1.0, 0.5 + specBonus * 0.25);
  }

  const specialtyRatio =
    totalRequiredSpecialties > 0
      ? specialtyEvidenceSum / totalRequiredSpecialties
      : specialtyEvidenceSum;

  const specialtyPoints = Math.min(20.0, Math.max(0, specialtyRatio * 20.0));

  // =========================================================================
  // 4. EVALUATE EXPERIENCE (Max 15 points)
  // =========================================================================
  let expPoints = 12.0;
  let isExperienceMatch = true;
  let experienceLabel = "Meets required experience";

  if (job.experienceLevel) {
    const jobLvl = normalize(job.experienceLevel);
    const userLvl = normalize(creator.experienceLevel || "Intermediate");

    if (jobLvl === userLvl || userLvl === "senior" || userLvl === "professional" || userLvl === "advanced") {
      expPoints = 15.0;
      isExperienceMatch = true;
      experienceLabel = "Meets required experience level";
    } else if (userLvl === "intermediate" && (jobLvl === "entry" || jobLvl === "beginner")) {
      expPoints = 15.0;
      isExperienceMatch = true;
      experienceLabel = "Exceeds entry level requirement";
    } else if (userLvl === "beginner" && (jobLvl === "intermediate" || jobLvl === "senior")) {
      expPoints = 3.0;
      isExperienceMatch = false;
      experienceLabel = `Requires ${job.experienceLevel} level`;
    } else {
      expPoints = 8.0;
      isExperienceMatch = true;
    }
  }

  // =========================================================================
  // 5. SEARCH KEYWORD RELEVANCE (Optional query boost)
  // =========================================================================
  let searchMatchScore = 0;
  if (searchQuery && searchQuery.trim()) {
    const qNorm = normalize(searchQuery);
    const jobContent = normalize(
      `${job.title} ${job.category || ""} ${(job.skillsRequired || []).join(" ")} ${(job.rolesRequired || []).join(" ")} ${job.description}`
    );
    if (jobContent.includes(qNorm)) {
      searchMatchScore = 5;
    }
  }

  // =========================================================================
  // 6. TOTAL DETERMINISTIC SCORE CALCULATION
  // =========================================================================
  let totalScore: number;

  const allSkillsDirectlySatisfied =
    totalRequiredSkills === 0 || exactMatchedSkills.length === totalRequiredSkills;
  const allSpecialtiesSatisfied =
    totalRequiredSpecialties === 0 || matchedSpecialties.length === totalRequiredSpecialties;
  const allRolesSatisfied =
    !job.rolesRequired || job.rolesRequired.length === 0 || matchedRoles.length === job.rolesRequired.length;

  // STRICT 100% Condition: Every requirement category is completely satisfied
  if (
    allSkillsDirectlySatisfied &&
    allSpecialtiesSatisfied &&
    allRolesSatisfied &&
    isExperienceMatch &&
    (totalRequiredSkills > 0 || totalRequiredSpecialties > 0 || isRoleMatch)
  ) {
    totalScore = 100;
  }
  // STRICT 0% Condition: No skills matched, no specialties matched, and no roles matched across entire profile
  else if (
    exactMatchedSkills.length === 0 &&
    semanticMatchedSkills.length === 0 &&
    matchedSpecialties.length === 0 &&
    !isRoleMatch
  ) {
    totalScore = 0;
  } else {
    const raw = rolePoints + skillPoints + specialtyPoints + expPoints + searchMatchScore;
    totalScore = Math.min(99, Math.max(0, Math.round(raw)));
  }

  // Tier Classification
  let tier: "top" | "relevant" | "other" = "other";
  let tierLabel = `${totalScore}% Match`;

  if (totalScore >= 75) {
    tier = "top";
    tierLabel = totalScore === 100 ? "100% Match • All Requirements Satisfied" : `${totalScore}% Match • Top Match`;
  } else if (totalScore >= 50) {
    tier = "relevant";
    tierLabel = `${totalScore}% Match • Relevant`;
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
    allRequiredSpecialties,
    matchedSpecialties: Array.from(new Set(matchedSpecialties)),
    missingSpecialties: Array.from(new Set(missingSpecialties)),
    matchedRoles: Array.from(new Set(matchedRoles)),
    missingRoles: Array.from(new Set(missingRoles)),
    isRoleMatch,
    isExperienceMatch,
    experienceLabel,
    searchMatchScore,
    requiredSkillMatchRatio,
    skillDetails,
    evidenceDetails,
    matchedRequirements,
    relatedRequirements,
    missingRequirements,
  };
}

/**
 * Calculates relevance score for a Client discovering Creators for a Brief.
 * Uses identical cross-field semantic matching logic.
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
    matchedSpecialties: jobResult.matchedSpecialties,
    missingSpecialties: jobResult.missingSpecialties,
    matchedRoles: jobResult.matchedRoles,
    isRoleMatch: jobResult.isRoleMatch,
    isExperienceMatch: jobResult.isExperienceMatch,
    experienceLabel: jobResult.experienceLabel,
    searchMatchScore: jobResult.searchMatchScore,
    requiredSkillMatchRatio: jobResult.requiredSkillMatchRatio,
    skillDetails: jobResult.skillDetails,
    evidenceDetails: jobResult.evidenceDetails,
    matchedRequirements: jobResult.matchedRequirements,
    relatedRequirements: jobResult.relatedRequirements,
    missingRequirements: jobResult.missingRequirements,
  };
}
