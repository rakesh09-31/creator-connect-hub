/**
 * Crew Requirement Intelligence
 *
 * Implements project-specific crew planning, requirement level inference,
 * explicit user requirement overrides, and dynamic coverage calculations.
 */

import { OmniForgeProject } from "./types";
import { isRoleMatch, getCanonicalRole } from "./film-taxonomy";

export type RoleRequirementLevel =
  | "CORE"
  | "PROJECT_REQUIRED"
  | "PROJECT_DEPENDENT"
  | "OPTIONAL"
  | "NOT_REQUIRED";

export type RoleAssignmentState = "COVERED_BY_USER" | "ASSIGNED" | "UNASSIGNED";
export type CreatorAvailabilityState = "AVAILABLE" | "NONE";

export interface RoleRequirementInfo {
  role: string;
  department: string;
  requirementLevel: RoleRequirementLevel;
  requirementReason: string;
  assignmentStatus: RoleAssignmentState;
  candidateCount: number;
}

export type FilmGenre =
  | "documentary"
  | "action"
  | "musical"
  | "romance"
  | "horror"
  | "generic_short_film";

/**
 * Detects project film genre from user context, project title, and genre.
 * Avoids assuming musical, action, or documentary for a generic "short film".
 */
export function detectFilmGenre(
  contextText?: string,
  projectGenre?: string,
  projectTitle?: string
): FilmGenre {
  const combined = `${contextText || ""} ${projectGenre || ""} ${projectTitle || ""}`.toLowerCase();

  // Documentary check
  if (/\b(?:documentary|docu|non[- ]fiction|archive|artisan\s+documentary)\b/i.test(combined)) {
    return "documentary";
  }

  // Musical / Dance film check
  if (
    /\b(?:musical|romantic\s+musical|musical\s+romance|dance\s+film|songs?\s+and\s+dance|music\s+video)\b/i.test(
      combined
    )
  ) {
    return "musical";
  }

  // Action film check
  if (
    /\b(?:action\s+comedy\s+thriller|action\s+thriller|action\s+short\s+film|action\s+film|action\s+movie|stunt|combat|martial\s+arts|fight\s+master)\b/i.test(
      combined
    )
  ) {
    return "action";
  }

  // Horror film check
  if (/\b(?:horror|spooky|supernatural|ghost|slasher|psychological\s+horror)\b/i.test(combined)) {
    return "horror";
  }

  // Romance check
  if (/\b(?:romance|romantic\s+short\s+film|romantic\s+drama|love\s+story)\b/i.test(combined)) {
    return "romance";
  }

  // Default: generic short film / narrative drama
  return "generic_short_film";
}

/**
 * Parses explicit user requirement commands that modify project requirements.
 * E.g. "I need dancers for my film" -> activates Dancer as PROJECT_REQUIRED.
 * E.g. "Find all dancers" -> null (search queries must NOT modify requirements).
 */
export function parseExplicitRoleRequirementRequest(
  text: string
): { roleName: string; level: RoleRequirementLevel; reason: string } | null {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Guard: Pure search queries must NOT change requirements
  if (
    /^\s*(?:find|search(?:\s+for)?|show(?:\s+me)?|get(?:\s+me)?|list|browse|who\s+are)\b/i.test(
      lower
    )
  ) {
    return null;
  }

  // Explicit requirement commands
  if (/\b(?:i\s+need|i\s+want|require|must\s+have|add)\s+(?:a\s+|some\s+|the\s+)?dancers?\b/i.test(lower)) {
    return {
      roleName: "Dancer",
      level: "PROJECT_REQUIRED",
      reason: "Explicitly requested by user for this film.",
    };
  }

  if (
    /\b(?:i\s+want\s+a\s+song\s+with\s+a\s+(?:lead\s+)?singer|i\s+need\s+(?:a\s+)?(?:lead\s+)?singer|require\s+(?:a\s+)?(?:lead\s+)?singer)\b/i.test(
      lower
    )
  ) {
    return {
      roleName: "Lead Singer",
      level: "PROJECT_REQUIRED",
      reason: "Explicitly requested by user for this film.",
    };
  }

  if (/\b(?:i\s+need|i\s+want|require|add)\s+(?:a\s+)?choreographer\b/i.test(lower)) {
    return {
      roleName: "Choreographer",
      level: "PROJECT_REQUIRED",
      reason: "Explicitly requested by user for this film.",
    };
  }

  if (/\b(?:i\s+need|i\s+want|require|add)\s+(?:a\s+)?(?:music\s+)?composer\b/i.test(lower)) {
    return {
      roleName: "Music Composer",
      level: "PROJECT_REQUIRED",
      reason: "Explicitly requested by user for this film.",
    };
  }

  if (/\b(?:i\s+need|i\s+want|require|add)\s+(?:a\s+)?(?:fight\s+master|action\s+choreographer)\b/i.test(lower)) {
    return {
      roleName: "Fight Master",
      level: "PROJECT_REQUIRED",
      reason: "Explicitly requested by user for this film.",
    };
  }

  if (/\b(?:i\s+need|i\s+want|require|add)\s+(?:a\s+)?stunt\s+coordinator\b/i.test(lower)) {
    return {
      roleName: "Stunt Coordinator",
      level: "PROJECT_REQUIRED",
      reason: "Explicitly requested by user for this film.",
    };
  }

  if (/\b(?:i\s+need|i\s+want|require|add)\s+(?:a\s+)?(?:camera\s+operator|b-cam)\b/i.test(lower)) {
    return {
      roleName: "Camera Operator",
      level: "PROJECT_REQUIRED",
      reason: "Explicitly requested by user for this film.",
    };
  }

  if (/\b(?:i\s+need|i\s+want|require|add)\s+(?:a\s+)?(?:makeup\s+artist|prosthetics)\b/i.test(lower)) {
    return {
      roleName: "Makeup Artist",
      level: "PROJECT_REQUIRED",
      reason: "Explicitly requested by user for this film.",
    };
  }

  if (/\b(?:i\s+need|i\s+want|require|add)\s+(?:a\s+)?(?:vfx\s+artist|visual\s+effects)\b/i.test(lower)) {
    return {
      roleName: "VFX Artist",
      level: "PROJECT_REQUIRED",
      reason: "Explicitly requested by user for this film.",
    };
  }

  return null;
}

/**
 * Returns the requirement level and justification for a canonical role given
 * the detected project genre and any stored project-level overrides.
 */
export function getRoleRequirementInfo(
  roleName: string,
  genre: FilmGenre,
  projectOverrides?: Record<string, { level: RoleRequirementLevel; reason?: string }>
): { requirementLevel: RoleRequirementLevel; requirementReason: string } {
  // 1. Check explicit project overrides first
  if (projectOverrides) {
    for (const [key, ov] of Object.entries(projectOverrides)) {
      if (isRoleMatch(key, roleName)) {
        return {
          requirementLevel: ov.level,
          requirementReason: ov.reason || "Explicit project requirement override.",
        };
      }
    }
  }

  // 2. Derive based on canonical role and project genre
  const canon = getCanonicalRole(roleName) || roleName;
  const lower = canon.toLowerCase();

  // CORE PRODUCTION
  if (lower === "director" || lower === "film director") {
    return {
      requirementLevel: "CORE",
      requirementReason: "Directs dramatic and visual execution, staging, and performances.",
    };
  }

  if (lower === "producer") {
    return {
      requirementLevel: "CORE",
      requirementReason: "Oversees production management, budget execution, and legal clearances.",
    };
  }

  if (lower === "screenwriter") {
    if (genre === "documentary") {
      return {
        requirementLevel: "NOT_REQUIRED",
        requirementReason: "Documentaries rely on real-world subject interviews rather than scripted dialogue.",
      };
    }
    return {
      requirementLevel: "CORE",
      requirementReason: "Develops narrative structure, scene beats, and locked shooting dialogue.",
    };
  }

  if (lower === "cinematographer") {
    return {
      requirementLevel: "CORE",
      requirementReason: "Designs camera movement, optical framing, visual mood, and lighting scheme.",
    };
  }

  if (lower === "video editor") {
    return {
      requirementLevel: "CORE",
      requirementReason: "Assembles footage, cuts dramatic pacing, crafts emotional rhythm, and locks picture.",
    };
  }

  if (lower === "sound designer") {
    return {
      requirementLevel: "CORE",
      requirementReason: "Creates immersive soundscapes, foley textures, audio effects, and master stereo mix.",
    };
  }

  if (lower === "sound engineer") {
    return {
      requirementLevel: "CORE",
      requirementReason: "Captures clean on-set location dialogue, ambient wild tracks, and denoiser feeds.",
    };
  }

  // CAST & TALENT
  if (lower === "lead actor") {
    if (genre === "documentary") {
      return {
        requirementLevel: "NOT_REQUIRED",
        requirementReason: "Documentary format captures real-world people, not scripted dramatic actors.",
      };
    }
    return {
      requirementLevel: "PROJECT_REQUIRED",
      requirementReason: "Primary protagonist / lead character required for narrative storytelling.",
    };
  }

  if (lower === "lead actress") {
    if (genre === "documentary") {
      return {
        requirementLevel: "NOT_REQUIRED",
        requirementReason: "Documentary format captures real-world people, not scripted dramatic actors.",
      };
    }
    if (genre === "romance" || genre === "musical") {
      return {
        requirementLevel: "PROJECT_REQUIRED",
        requirementReason: "Primary female lead / heroine essential for romantic narrative.",
      };
    }
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required if the narrative script features a co-lead female protagonist.",
    };
  }

  if (lower.includes("supporting actor")) {
    if (genre === "documentary") {
      return {
        requirementLevel: "NOT_REQUIRED",
        requirementReason: "Documentary format does not feature dramatic supporting actors.",
      };
    }
    return {
      requirementLevel: "PROJECT_REQUIRED",
      requirementReason: "Secondary dramatic characters, antagonists, and key supporting cast.",
    };
  }

  // MUSIC & PERFORMANCE
  if (lower === "dancer") {
    if (genre === "documentary") {
      return {
        requirementLevel: "NOT_REQUIRED",
        requirementReason: "Documentary format does not feature choreographed dancers.",
      };
    }
    if (genre === "musical") {
      return {
        requirementLevel: "PROJECT_REQUIRED",
        requirementReason: "Essential for choreographed dance sequences in musical production.",
      };
    }
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required only if the film contains dance sequences.",
    };
  }

  if (lower === "choreographer") {
    if (genre === "documentary") {
      return {
        requirementLevel: "NOT_REQUIRED",
        requirementReason: "Not required for non-choreographed documentary production.",
      };
    }
    if (genre === "musical") {
      return {
        requirementLevel: "PROJECT_REQUIRED",
        requirementReason: "Designs dance routines, rhythmic movements, and blocks musical sequences.",
      };
    }
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required only if the film features choreographed dance sequences or movement blocking.",
    };
  }

  if (lower === "lead singer") {
    if (genre === "documentary") {
      return {
        requirementLevel: "NOT_REQUIRED",
        requirementReason: "Documentary format does not require playback singers.",
      };
    }
    if (genre === "musical") {
      return {
        requirementLevel: "PROJECT_REQUIRED",
        requirementReason: "Records lead vocal tracks for film songs and character playback numbers.",
      };
    }
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required only if the film includes original character playback songs.",
    };
  }

  if (lower === "music composer") {
    if (genre === "musical") {
      return {
        requirementLevel: "PROJECT_REQUIRED",
        requirementReason: "Composes original songs, feature score, and background musical soundtrack.",
      };
    }
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required if original cinematic background score is commissioned.",
    };
  }

  if (lower === "music director") {
    if (genre === "musical") {
      return {
        requirementLevel: "PROJECT_REQUIRED",
        requirementReason: "Directs orchestral arrangements, song structures, and studio vocal sessions.",
      };
    }
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required if complex studio arrangements and vocal tracking are needed.",
    };
  }

  // ACTION & STUNTS
  if (lower === "fight master") {
    if (genre === "documentary") {
      return {
        requirementLevel: "NOT_REQUIRED",
        requirementReason: "Documentary format does not require combat choreography.",
      };
    }
    if (genre === "action") {
      return {
        requirementLevel: "PROJECT_REQUIRED",
        requirementReason: "Designs combat choreography, martial arts set pieces, and action beats.",
      };
    }
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required only if the film contains specialized combat or fight choreography.",
    };
  }

  if (lower === "stunt coordinator") {
    if (genre === "documentary") {
      return {
        requirementLevel: "NOT_REQUIRED",
        requirementReason: "Documentary format does not require physical stunt rigging.",
      };
    }
    if (genre === "action") {
      return {
        requirementLevel: "PROJECT_REQUIRED",
        requirementReason: "Manages on-set stunt safety protocols, rigging, and physical stunts.",
      };
    }
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required only if the film contains physical stunts, wire work, or safety-critical action.",
    };
  }

  // CAMERA & VISUALS
  if (lower === "camera operator") {
    if (genre === "action") {
      return {
        requirementLevel: "PROJECT_REQUIRED",
        requirementReason: "Essential for dynamic multi-camera tracking and gimbal action coverage.",
      };
    }
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required if dedicated camera operator is needed alongside Cinematographer (e.g. B-cam, gimbal tracking).",
    };
  }

  // POST-PRODUCTION & ART
  if (lower === "colorist") {
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required if dedicated post-production color grading suite is contracted.",
    };
  }

  if (lower === "vfx artist") {
    if (genre === "horror" || genre === "action") {
      return {
        requirementLevel: "PROJECT_REQUIRED",
        requirementReason: "Handles digital effects, wire removal, cleanup, and supernatural/action elements.",
      };
    }
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required only if digital visual effects, screen replacements, or CGI cleanup are needed.",
    };
  }

  if (lower === "makeup artist") {
    if (genre === "horror") {
      return {
        requirementLevel: "PROJECT_REQUIRED",
        requirementReason: "Essential for horror SFX makeup, wound styling, and prosthetics.",
      };
    }
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required if on-camera character styling or prosthetics are required.",
    };
  }

  if (lower === "production designer") {
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required if custom set construction or period art direction is needed.",
    };
  }

  if (lower === "costume designer") {
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required if specialized character wardrobe, period costumes, or uniforms are needed.",
    };
  }

  if (lower === "assistant director") {
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Recommended for managing set logistics, call sheets, and shooting schedule.",
    };
  }

  if (lower === "production manager") {
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required if multi-location logistics, permits, and crew travel coordination are needed.",
    };
  }

  if (lower === "script supervisor") {
    return {
      requirementLevel: "PROJECT_DEPENDENT",
      requirementReason: "Required if multi-day continuity and line tracking on set are needed.",
    };
  }

  // OPTIONAL
  if (lower === "motion graphics artist" || lower.includes("motion graphics")) {
    return {
      requirementLevel: "OPTIONAL",
      requirementReason: "Designs opening title sequences, lower thirds, typography, and credit rolls.",
    };
  }

  if (lower === "hair stylist") {
    return {
      requirementLevel: "OPTIONAL",
      requirementReason: "Styles hair matching character profiles and maintains scene continuity.",
    };
  }

  if (lower === "location manager") {
    return {
      requirementLevel: "OPTIONAL",
      requirementReason: "Scouts and secures physical filming locations and permits.",
    };
  }

  if (lower === "casting director") {
    return {
      requirementLevel: "OPTIONAL",
      requirementReason: "Discovers and auditions primary, supporting, and background actors.",
    };
  }

  // Default fallback for any other specialized role
  return {
    requirementLevel: "PROJECT_DEPENDENT",
    requirementReason: `Specialized cinematic position for ${roleName}.`,
  };
}
