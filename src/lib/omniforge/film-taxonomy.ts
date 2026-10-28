/**
 * OmniForge Film Role Taxonomy & Team Planning Architecture
 *
 * Provides a comprehensive, industry-grounded taxonomy of film production roles,
 * categorized by production department and necessity level (REQUIRED, LIKELY REQUIRED,
 * OPTIONAL / PROJECT-DEPENDENT).
 *
 * Adheres to strict ground rules:
 * - If the user is the Director, the Director role is marked as covered by the user
 *   and strictly excluded from hiring lists.
 * - Hero/Heroine are mapped to Lead Actor / Lead Actress.
 * - Singers and Dancers are appropriately distinguished.
 * - No fake command syntax or fabricated database results are ever emitted.
 */

export interface FilmRoleItem {
  name: string;
  category: "CORE CREATIVE" | "CAST" | "ACTION & STUNTS" | "MUSIC & PERFORMANCE" | "CAMERA & PRODUCTION DESIGN" | "SOUND" | "POST-PRODUCTION" | "MARKETING & DISTRIBUTION" | "PRODUCTION SUPPORT";
  necessity: "REQUIRED" | "LIKELY REQUIRED" | "OPTIONAL / DEPENDS ON PROJECT";
  description: string;
  searchQueryRole: string; // The canonical role name to search in Supabase
  skills: string[];
}

/**
 * SECTION 1: ONE CANONICAL ROLE TAXONOMY
 * Single source of truth for cinematic roles across OmniForge.
 */
export const CINEMATIC_ROLES = {
  CAST: [
    "Lead Actor",
    "Lead Actress",
    "Supporting Actor",
    "Supporting Actress",
    "Character Actor",
    "Comic Actor",
  ],
  CAMERA: [
    "Cinematographer",
    "Camera Operator",
    "Gaffer",
  ],
  PRODUCTION: [
    "Producer",
    "Assistant Director",
    "Production Manager",
    "Production Designer",
    "Art Director",
    "Location Manager",
  ],
  PERFORMANCE: [
    "Dancer",
    "Choreographer",
    "Fight Master",
    "Stunt Coordinator",
  ],
  MUSIC_SOUND: [
    "Lead Singer",
    "Music Composer",
    "Music Director",
    "Sound Designer",
    "Sound Engineer",
    "Production Sound",
    "Sound Editor",
  ],
  POST_PRODUCTION: [
    "Video Editor",
    "Film Editor",
    "Colorist",
    "VFX Artist",
    "Motion Graphics Artist",
  ],
  WRITING: [
    "Screenwriter",
    "Dialogue Writer",
    "Script Supervisor",
  ],
  ART_DEPARTMENT: [
    "Costume Designer",
    "Makeup Artist",
    "Hair Stylist",
  ],
} as const;

export type CinematicDepartment = keyof typeof CINEMATIC_ROLES;
export type CanonicalCinematicRole = typeof CINEMATIC_ROLES[CinematicDepartment][number] | "Film Director";

export const ALL_CANONICAL_CINEMATIC_ROLES: string[] = [
  ...Object.values(CINEMATIC_ROLES).flat(),
  "Film Director",
];

export const DEPARTMENT_DISPLAY_NAMES: Record<CinematicDepartment, string> = {
  CAST: "CAST & ACTING",
  CAMERA: "CAMERA & VISUALS",
  PRODUCTION: "PRODUCTION & DIRECTION",
  PERFORMANCE: "ACTION & PERFORMANCE",
  MUSIC_SOUND: "MUSIC & SOUND",
  POST_PRODUCTION: "POST-PRODUCTION",
  WRITING: "WRITING & STORY",
  ART_DEPARTMENT: "ART & STYLING",
};

/**
 * SECTION 2: SEPARATE ROLE ALIAS FROM ROLE IDENTITY
 * Explicit signal-to-identity mappings for cinematic roles.
 */
export const CANONICAL_ROLE_ALIASES: Record<string, string[]> = {
  "Lead Actor": [
    "lead actor", "actor", "male actor", "film actor", "lead actor (hero)",
    "hero", "male lead", "screen actor", "theatre actor"
  ],
  "Lead Actress": [
    "lead actress", "actress", "female actor", "female actress", "lead actress (heroine)",
    "heroine", "female lead", "film actress", "theatre actress", "screen actress"
  ],
  "Supporting Actor": [
    "supporting actor", "supporting actors", "secondary actor", "male supporting actor"
  ],
  "Supporting Actress": [
    "supporting actress", "supporting actresses", "secondary actress", "female supporting actor"
  ],
  "Character Actor": [
    "character actor", "character actress", "character artist", "ensemble actor"
  ],
  "Comic Actor": [
    "comic actor", "comedy actor", "comedian", "comedy performer", "comic role"
  ],
  "Cinematographer": [
    "cinematographer", "director of photography", "dop", "camera cinematography",
    "director of photography (cinematographer)"
  ],
  "Camera Operator": [
    "camera operator", "camera assistant", "camera crew", "focus puller", "1st ac",
    "camera operator / 1st ac (focus puller)"
  ],
  "Gaffer": [
    "gaffer", "chief lighting technician", "lighting master", "head gaffer", "stage/lighting technician"
  ],
  "Producer": [
    "producer", "line producer", "film producer", "executive producer", "producer / line producer"
  ],
  "Assistant Director": [
    "assistant director", "1st ad", "first assistant director", "assistant director (1st ad)", "ad"
  ],
  "Production Manager": [
    "production manager", "production coordinator", "production manager / location manager"
  ],
  "Production Designer": [
    "production designer", "scenic designer", "production designer / art director"
  ],
  "Art Director": [
    "art director", "set decorator", "art department lead"
  ],
  "Location Manager": [
    "location manager", "location scout"
  ],
  "Dancer": [
    "dancer", "dance performer", "lead dancer", "troupe dancer", "dancers", "dance troupe"
  ],
  "Choreographer": [
    "choreographer", "dance choreographer", "choreographers", "dance master", "dance direction"
  ],
  "Fight Master": [
    "fight master", "action choreographer", "fight director", "action master",
    "fight master / stunt coordinator"
  ],
  "Stunt Coordinator": [
    "stunt coordinator", "stunt director", "stunt performer", "stunts", "stunt performers / team"
  ],
  "Lead Singer": [
    "lead singer", "playback singer", "singer", "vocalist", "playback singers / vocalists",
    "playback vocal", "lead vocalist"
  ],
  "Music Composer": [
    "composer", "music composer", "film composer", "song composer", "music director / composer"
  ],
  "Music Director": [
    "music director", "music supervisor", "score director"
  ],
  "Sound Designer": [
    "sound designer", "sound design", "foley artist", "sound designer & foley artist"
  ],
  "Sound Engineer": [
    "sound engineer", "audio engineer", "sound recordist", "production sound mixer / boom operator",
    "audio recordist", "production sound mixer"
  ],
  "Production Sound": [
    "production sound", "sound recordist", "boom operator", "location sound mixer"
  ],
  "Sound Editor": [
    "sound editor", "dialogue editor", "foley editor"
  ],
  "Video Editor": [
    "video editor", "film editor", "offline editor", "assembly editor", "editor", "video editing"
  ],
  "Film Editor": [
    "film editor", "lead film editor", "picture editor"
  ],
  "Colorist": [
    "colorist", "color grader", "di colorist", "finishing colorist", "colorist / color grader"
  ],
  "VFX Artist": [
    "vfx artist", "visual effects artist", "compositor", "cgi artist", "vfx artist / compositor"
  ],
  "Motion Graphics Artist": [
    "motion graphics artist", "motion designer", "title designer", "motion graphics"
  ],
  "Screenwriter": [
    "screenwriter", "scriptwriter", "writer", "screenplay writer", "screenwriter / writer"
  ],
  "Dialogue Writer": [
    "dialogue writer", "dialogue", "punchline writer"
  ],
  "Script Supervisor": [
    "script supervisor", "continuity supervisor", "continuity"
  ],
  "Costume Designer": [
    "costume designer", "wardrobe stylist", "wardrobe designer", "costume designer / wardrobe stylist"
  ],
  "Makeup Artist": [
    "makeup artist", "sfx makeup", "prosthetics artist", "makeup artist & hair stylist"
  ],
  "Hair Stylist": [
    "hair stylist", "hair designer"
  ],
  "Film Director": [
    "director", "film director"
  ],
};

/**
 * Normalizes role string by lowercasing and trimming annotations.
 */
export function normalizeRoleKey(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s*\/\s*.*$/, "")
    .trim();
}

/**
 * Resolves any arbitrary role string or alias to its single canonical role identity.
 */
export function getCanonicalRole(roleName: string): string | undefined {
  if (!roleName) return undefined;
  const trimmed = roleName.trim();
  const lower = trimmed.toLowerCase();

  // 1. Direct exact canonical match
  const directCanon = ALL_CANONICAL_CINEMATIC_ROLES.find(
    (c) => c.toLowerCase() === lower
  );
  if (directCanon) return directCanon;

  // 2. Direct exact alias match
  for (const [canon, aliases] of Object.entries(CANONICAL_ROLE_ALIASES)) {
    if (aliases.some((a) => a.toLowerCase() === lower)) {
      return canon;
    }
  }

  // 3. Normalized string match
  const norm = normalizeRoleKey(trimmed);
  const normCanon = ALL_CANONICAL_CINEMATIC_ROLES.find(
    (c) => normalizeRoleKey(c) === norm
  );
  if (normCanon) return normCanon;

  for (const [canon, aliases] of Object.entries(CANONICAL_ROLE_ALIASES)) {
    if (aliases.some((a) => normalizeRoleKey(a) === norm)) {
      return canon;
    }
  }

  // 4. Word-boundary alias match (e.g. "Focus Puller" matching "Camera Operator")
  for (const [canon, aliases] of Object.entries(CANONICAL_ROLE_ALIASES)) {
    for (const a of aliases) {
      const aLower = a.toLowerCase();
      if (lower === aLower) return canon;
      if (a.length >= 4) {
        const escaped = aLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`(^|\\b)${escaped}(\\b|$)`, "i").test(lower)) {
          return canon;
        }
      }
    }
  }

  return undefined;
}

/**
 * Checks if two role names refer to the exact same canonical role identity.
 * Prevents cross-role false positives (e.g. Lead Actor matching Supporting Actor).
 */
export function isRoleMatch(roleA: string, roleB: string): boolean {
  if (!roleA || !roleB) return false;
  const canonA = getCanonicalRole(roleA);
  const canonB = getCanonicalRole(roleB);
  if (canonA && canonB) {
    return canonA === canonB;
  }
  return normalizeRoleKey(roleA) === normalizeRoleKey(roleB);
}

/**
 * Returns the production department name for any role name.
 */
export function getRoleDepartment(roleName: string): string {
  const canon = getCanonicalRole(roleName);
  const target = canon || roleName;
  for (const [dept, roles] of Object.entries(CINEMATIC_ROLES)) {
    if ((roles as readonly string[]).includes(target)) {
      return DEPARTMENT_DISPLAY_NAMES[dept as CinematicDepartment];
    }
  }
  const norm = normalizeRoleKey(target);
  if (norm.includes("director")) return "PRODUCTION & DIRECTION";
  if (norm.includes("actor") || norm.includes("actress") || norm.includes("cast")) return "CAST & ACTING";
  if (norm.includes("camera") || norm.includes("cinematograph") || norm.includes("gaffer")) return "CAMERA & VISUALS";
  if (norm.includes("dance") || norm.includes("stunt") || norm.includes("fight")) return "ACTION & PERFORMANCE";
  if (norm.includes("music") || norm.includes("singer") || norm.includes("sound") || norm.includes("audio")) return "MUSIC & SOUND";
  if (norm.includes("edit") || norm.includes("color") || norm.includes("vfx")) return "POST-PRODUCTION";
  if (norm.includes("writ") || norm.includes("script")) return "WRITING & STORY";
  if (norm.includes("costume") || norm.includes("makeup") || norm.includes("hair") || norm.includes("art")) return "ART & STYLING";
  return "PRODUCTION & DIRECTION";
}

export const COMPLETE_FILM_ROLE_TAXONOMY: FilmRoleItem[] = [
  // CORE CREATIVE
  {
    name: "Director",
    category: "CORE CREATIVE",
    necessity: "REQUIRED",
    description: "Leads dramatic and artistic vision, staging, and actor performances.",
    searchQueryRole: "Film Director",
    skills: ["Directing", "Visual Storytelling", "Actor Guidance"],
  },
  {
    name: "Screenwriter",
    category: "CORE CREATIVE",
    necessity: "REQUIRED",
    description: "Develops narrative structure, scene beats, and locked shooting dialogue.",
    searchQueryRole: "Screenwriter",
    skills: ["Screenwriting", "Dialogue", "Scene Breakdown"],
  },
  {
    name: "Dialogue Writer",
    category: "CORE CREATIVE",
    necessity: "LIKELY REQUIRED",
    description: "Specializes in comedic timing, punchlines, and dramatic dialogue exchanges.",
    searchQueryRole: "Dialogue Writer",
    skills: ["Dialogue Writing", "Punchlines", "Comic Timing"],
  },
  {
    name: "Assistant Director",
    category: "CORE CREATIVE",
    necessity: "LIKELY REQUIRED",
    description: "Manages shooting schedule, call sheets, on-set logistics, and crew coordination.",
    searchQueryRole: "Assistant Director",
    skills: ["On-Set Coordination", "Call Sheets", "Schedule Management"],
  },
  {
    name: "Script Supervisor",
    category: "CORE CREATIVE",
    necessity: "OPTIONAL / DEPENDS ON PROJECT",
    description: "Maintains scene continuity, takes log notes, and tracks coverage for the editor.",
    searchQueryRole: "Script Supervisor",
    skills: ["Continuity", "Scene Logging"],
  },
  {
    name: "Producer",
    category: "CORE CREATIVE",
    necessity: "REQUIRED",
    description: "Oversees production financing, legal clearances, vendor agreements, and day-to-day budget.",
    searchQueryRole: "Producer",
    skills: ["Line Producing", "Budgeting", "Production Management"],
  },

  // CAST
  {
    name: "Lead Actor",
    category: "CAST",
    necessity: "REQUIRED",
    description: "Portrays the primary male protagonist / lead character.",
    searchQueryRole: "Lead Actor",
    skills: ["Screen Acting", "Dramatic Performance", "Method Acting"],
  },
  {
    name: "Lead Actress",
    category: "CAST",
    necessity: "REQUIRED",
    description: "Portrays the primary female protagonist / lead character.",
    searchQueryRole: "Lead Actress",
    skills: ["Screen Acting", "Dramatic Performance", "Character Expression"],
  },
  {
    name: "Supporting Actor",
    category: "CAST",
    necessity: "LIKELY REQUIRED",
    description: "Secondary dramatic characters, antagonists, friends, and family roles.",
    searchQueryRole: "Supporting Actor",
    skills: ["Acting", "Dialogue Delivery", "Ensemble Presence"],
  },
  {
    name: "Supporting Actress",
    category: "CAST",
    necessity: "LIKELY REQUIRED",
    description: "Secondary female dramatic characters and key supporting roles.",
    searchQueryRole: "Supporting Actress",
    skills: ["Acting", "Dialogue Delivery", "Character Expression"],
  },
  {
    name: "Character Actor",
    category: "CAST",
    necessity: "OPTIONAL / DEPENDS ON PROJECT",
    description: "Atmospheric talent, specialty character parts, and ensemble roles.",
    searchQueryRole: "Character Actor",
    skills: ["Acting", "Character Acting"],
  },
  {
    name: "Comic Actor",
    category: "CAST",
    necessity: "LIKELY REQUIRED",
    description: "Delivers situational comedy, comic timing, and humorous relief scenes.",
    searchQueryRole: "Comic Actor",
    skills: ["Comic Timing", "Improvisation", "Character Acting"],
  },

  // ACTION & STUNTS
  {
    name: "Fight Master",
    category: "ACTION & STUNTS",
    necessity: "REQUIRED",
    description: "Designs, choreographs, and directs action set-pieces, combat scenes, and stunt safety.",
    searchQueryRole: "Fight Master",
    skills: ["Fight Choreography", "Stunt Direction", "Action Stunts", "Wire Work"],
  },
  {
    name: "Stunt Coordinator",
    category: "ACTION & STUNTS",
    necessity: "LIKELY REQUIRED",
    description: "Executes physical stunts, falls, high-impact martial arts, and vehicle choreography.",
    searchQueryRole: "Stunt Coordinator",
    skills: ["Action Stunts", "Martial Arts", "High Falls", "Combat"],
  },

  // MUSIC & PERFORMANCE
  {
    name: "Music Composer",
    category: "MUSIC & PERFORMANCE",
    necessity: "LIKELY REQUIRED",
    description: "Composes original thematic background score and song arrangements.",
    searchQueryRole: "Music Composer",
    skills: ["Music Composition", "Film Scoring", "Audio Arranging"],
  },
  {
    name: "Music Director",
    category: "MUSIC & PERFORMANCE",
    necessity: "LIKELY REQUIRED",
    description: "Directs orchestral sessions, studio recording, and album production.",
    searchQueryRole: "Music Director",
    skills: ["Music Production", "Song Arrangement", "Recording Direction"],
  },
  {
    name: "Lead Singer",
    category: "MUSIC & PERFORMANCE",
    necessity: "OPTIONAL / DEPENDS ON PROJECT",
    description: "Records lead vocal tracks for film songs and character playback numbers.",
    searchQueryRole: "Lead Singer",
    skills: ["Singing", "Playback Vocals", "Pitch Accuracy"],
  },
  {
    name: "Choreographer",
    category: "MUSIC & PERFORMANCE",
    necessity: "OPTIONAL / DEPENDS ON PROJECT",
    description: "Designs dance routines, rhythmic movements, and blocks musical sequences.",
    searchQueryRole: "Choreographer",
    skills: ["Choreography", "Dance Movement", "Rhythm Direction"],
  },
  {
    name: "Dancer",
    category: "MUSIC & PERFORMANCE",
    necessity: "OPTIONAL / DEPENDS ON PROJECT",
    description: "Performs choreographed dance numbers and background rhythmic sequences.",
    searchQueryRole: "Dancer",
    skills: ["Dancing", "Choreography Execution", "Stage Movement"],
  },

  // CAMERA & PRODUCTION DESIGN
  {
    name: "Cinematographer",
    category: "CAMERA & PRODUCTION DESIGN",
    necessity: "REQUIRED",
    description: "Designs camera movement, optical lenses, framing, and dramatic lighting scheme.",
    searchQueryRole: "Cinematographer",
    skills: ["Cinematography", "Lighting Design", "Camera Framing"],
  },
  {
    name: "Camera Operator",
    category: "CAMERA & PRODUCTION DESIGN",
    necessity: "LIKELY REQUIRED",
    description: "Maintains critical focus during dynamic camera moves and operates camera rig.",
    searchQueryRole: "Camera Operator",
    skills: ["Focus Pulling", "Gimbal Operation", "Camera Rigging"],
  },
  {
    name: "Gaffer",
    category: "CAMERA & PRODUCTION DESIGN",
    necessity: "LIKELY REQUIRED",
    description: "Chief lighting technician executing set lighting setups and electrical rigging.",
    searchQueryRole: "Gaffer",
    skills: ["Lighting Setup", "Electrical Rigging", "Lighting Design"],
  },
  {
    name: "Production Designer",
    category: "CAMERA & PRODUCTION DESIGN",
    necessity: "LIKELY REQUIRED",
    description: "Shapes visual environment, set aesthetics, props, and architectural color palette.",
    searchQueryRole: "Production Designer",
    skills: ["Production Design", "Set Decoration", "Visual Aesthetics"],
  },
  {
    name: "Art Director",
    category: "CAMERA & PRODUCTION DESIGN",
    necessity: "LIKELY REQUIRED",
    description: "Oversees set construction, graphic props, and physical scenic art.",
    searchQueryRole: "Art Director",
    skills: ["Art Direction", "Set Dressing", "Prop Design"],
  },
  {
    name: "Costume Designer",
    category: "CAMERA & PRODUCTION DESIGN",
    necessity: "LIKELY REQUIRED",
    description: "Creates and sources authentic character attire matching period and narrative tone.",
    searchQueryRole: "Costume Designer",
    skills: ["Costume Design", "Styling", "Wardrobe Management"],
  },
  {
    name: "Makeup Artist",
    category: "CAMERA & PRODUCTION DESIGN",
    necessity: "LIKELY REQUIRED",
    description: "Handles character beauty, hair styling, prosthetics, and on-camera continuity.",
    searchQueryRole: "Makeup Artist",
    skills: ["Screen Makeup", "Prosthetics", "Beauty"],
  },
  {
    name: "Hair Stylist",
    category: "CAMERA & PRODUCTION DESIGN",
    necessity: "OPTIONAL / DEPENDS ON PROJECT",
    description: "Maintains character hair styling and period wig continuity.",
    searchQueryRole: "Hair Stylist",
    skills: ["Hair Styling", "Wig Maintenance"],
  },

  // SOUND
  {
    name: "Sound Designer",
    category: "SOUND",
    necessity: "REQUIRED",
    description: "Creates immersive soundscapes, foley textures, audio effects, and 5.1/stereo mix.",
    searchQueryRole: "Sound Designer",
    skills: ["Sound Design", "Foley", "Audio Mixing", "DAW"],
  },
  {
    name: "Sound Engineer",
    category: "SOUND",
    necessity: "REQUIRED",
    description: "Captures clean production dialogue, ambient wild tracks, and location audio.",
    searchQueryRole: "Sound Engineer",
    skills: ["Location Sound Recording", "Boom Operation", "Audio Denoising"],
  },
  {
    name: "Production Sound",
    category: "SOUND",
    necessity: "LIKELY REQUIRED",
    description: "Boom microphone operation and on-set multi-track location sound mixing.",
    searchQueryRole: "Production Sound",
    skills: ["Boom Operation", "Sound Recordist", "Wild Tracks"],
  },
  {
    name: "Sound Editor",
    category: "SOUND",
    necessity: "OPTIONAL / DEPENDS ON PROJECT",
    description: "Edits dialogue tracks, removes background artifacts, and prepares audio for mix.",
    searchQueryRole: "Sound Editor",
    skills: ["Dialogue Editing", "Audio Cleanup"],
  },

  // POST-PRODUCTION
  {
    name: "Video Editor",
    category: "POST-PRODUCTION",
    necessity: "REQUIRED",
    description: "Assembles footage, cuts dramatic pacing, crafts emotional rhythm, and locks picture.",
    searchQueryRole: "Video Editor",
    skills: ["Premiere Pro", "DaVinci Resolve", "Story Pacing", "NLE"],
  },
  {
    name: "Film Editor",
    category: "POST-PRODUCTION",
    necessity: "REQUIRED",
    description: "Lead editor handling assembly, pacing, and editorial rhythm for narrative film.",
    searchQueryRole: "Film Editor",
    skills: ["Feature Editing", "Dramatic Pacing", "Assembly Cut"],
  },
  {
    name: "Colorist",
    category: "POST-PRODUCTION",
    necessity: "LIKELY REQUIRED",
    description: "Applies cinematic look, balances color spaces, and refines contrast/skin tones.",
    searchQueryRole: "Colorist",
    skills: ["Color Grading", "DaVinci Resolve", "Look Development"],
  },
  {
    name: "VFX Artist",
    category: "POST-PRODUCTION",
    necessity: "OPTIONAL / DEPENDS ON PROJECT",
    description: "Handles cleanups, screen replacements, green-screen compositing, and visual CGI.",
    searchQueryRole: "VFX Artist",
    skills: ["Visual Effects", "Compositing", "After Effects", "Blender"],
  },
  {
    name: "Motion Graphics Artist",
    category: "POST-PRODUCTION",
    necessity: "OPTIONAL / DEPENDS ON PROJECT",
    description: "Designs theatrical title cards, graphic lower-thirds, and visual text.",
    searchQueryRole: "Motion Graphics Artist",
    skills: ["Motion Graphics", "Typography", "After Effects"],
  },

  // PRODUCTION SUPPORT & MARKETING
  {
    name: "Production Manager",
    category: "PRODUCTION SUPPORT",
    necessity: "LIKELY REQUIRED",
    description: "Secures shooting permits, manages transport, accommodation, and crew logistics.",
    searchQueryRole: "Production Manager",
    skills: ["Location Scouting", "Permits", "Logistics"],
  },
  {
    name: "Location Manager",
    category: "PRODUCTION SUPPORT",
    necessity: "LIKELY REQUIRED",
    description: "Scouts, clears, and manages physical locations for shooting days.",
    searchQueryRole: "Location Manager",
    skills: ["Location Scouting", "Permit Clearances"],
  },
];

/**
 * Builds the structured role planning response text, respecting the user's director status
 * and project context (songs/dance, genre, etc.).
 */
export function buildFilmRolePlanningResponse(options: {
  isUserDirector: boolean;
  hasMusicDanceRequest?: boolean;
  userPrompt?: string;
}): {
  responseText: string;
  suggestedChips: string[];
  plannedRoles: FilmRoleItem[];
} {
  const isDirector = options.isUserDirector;
  const promptLower = (options.userPrompt || "").toLowerCase();
  const hasMusicDance =
    options.hasMusicDanceRequest ||
    promptLower.includes("dancer") ||
    promptLower.includes("singer") ||
    promptLower.includes("song") ||
    promptLower.includes("music") ||
    promptLower.includes("musical");

  const rolesToInclude = COMPLETE_FILM_ROLE_TAXONOMY.filter((role) => {
    // Exclude director from hiring list if user is the director
    if (isDirector && role.name === "Director") {
      return false;
    }
    return true;
  });

  let response = `### 🎬 Film Production Role Architecture\n\n`;

  if (isDirector) {
    response += `**YOUR ROLE:**\n`;
    response += `✓ **Director — You** *(Covered by you — no external director recommended or hired)*\n\n`;
    response += `Since you are directing the project, here is the complete breakdown of all the other creative, cast, camera, sound, and post-production roles you need to make a complete film:\n\n`;
  } else {
    response += `Here is the complete breakdown of production roles needed to make a complete film:\n\n`;
  }

  // 1. CORE CREATIVE
  const coreRoles = rolesToInclude.filter((r) => r.category === "CORE CREATIVE");
  response += `#### 1. CORE CREATIVE & PRODUCTION\n`;
  coreRoles.forEach((r, idx) => {
    response += `• **${r.name}** \`[${r.necessity}]\` — ${r.description}\n`;
  });
  response += `\n`;

  // 2. CAST
  const castRoles = rolesToInclude.filter((r) => r.category === "CAST");
  response += `#### 2. CAST & TALENT\n`;
  castRoles.forEach((r) => {
    response += `• **${r.name}** \`[${r.necessity}]\` — ${r.description}\n`;
  });
  response += `\n`;

  // 3. ACTION & STUNTS
  const actionRoles = rolesToInclude.filter((r) => r.category === "ACTION & STUNTS");
  if (actionRoles.length > 0) {
    response += `#### 3. ACTION & STUNTS\n`;
    actionRoles.forEach((r) => {
      response += `• **${r.name}** \`[${r.necessity}]\` — ${r.description}\n`;
    });
    response += `\n`;
  }

  // 4. MUSIC & PERFORMANCE
  const musicRoles = rolesToInclude.filter((r) => r.category === "MUSIC & PERFORMANCE");
  response += `#### 4. MUSIC & PERFORMANCE\n`;
  musicRoles.forEach((r) => {
    const necessityTag = hasMusicDance && (r.name.includes("Singer") || r.name.includes("Dancer") || r.name.includes("Choreographer"))
      ? "REQUIRED (Requested for this film)"
      : r.necessity;
    const displayName = r.name === "Dancers" ? "Dancers / Dance Troupe" : r.name;
    response += `• **${displayName}** \`[${necessityTag}]\` — ${r.description}\n`;
  });
  response += `\n`;

  // 4. CAMERA & PRODUCTION DESIGN
  const cameraRoles = rolesToInclude.filter((r) => r.category === "CAMERA & PRODUCTION DESIGN");
  response += `#### 4. CAMERA & PRODUCTION DESIGN\n`;
  cameraRoles.forEach((r) => {
    response += `• **${r.name}** \`[${r.necessity}]\` — ${r.description}\n`;
  });
  response += `\n`;

  // 5. SOUND
  const soundRoles = rolesToInclude.filter((r) => r.category === "SOUND");
  response += `#### 5. SOUND\n`;
  soundRoles.forEach((r) => {
    response += `• **${r.name}** \`[${r.necessity}]\` — ${r.description}\n`;
  });
  response += `\n`;

  // 6. POST-PRODUCTION & FINISHING
  const postRoles = rolesToInclude.filter((r) => r.category === "POST-PRODUCTION");
  response += `#### 6. POST-PRODUCTION & FINISHING\n`;
  postRoles.forEach((r) => {
    response += `• **${r.name}** \`[${r.necessity}]\` — ${r.description}\n`;
  });
  response += `\n`;

  // 7. PRODUCTION SUPPORT
  const supportRoles = rolesToInclude.filter((r) => r.category === "PRODUCTION SUPPORT" || r.category === "MARKETING & DISTRIBUTION");
  response += `#### 7. PRODUCTION SUPPORT & MARKETING\n`;
  supportRoles.forEach((r) => {
    response += `• **${r.name}** \`[${r.necessity}]\` — ${r.description}\n`;
  });
  response += `\n`;

  response += `---\n\n`;
  response += `### Next Steps — How would you like to proceed?\n\n`;
  response += `Would you like me to:\n`;
  response += `• **Start with the hero and heroine** *(Lead Actor & Lead Actress)*\n`;
  response += `• **Find all required roles** across the OmniCraft creator directory\n`;
  response += `• **Build the complete film squad** to track tasks and milestones\n`;
  response += `• **Find creators role-by-role?**\n`;

  const chips = [
    "Start with Hero & Heroine",
    "Find All Required Roles",
    "Build Complete Film Squad",
    "Find Dancers",
    "Find Singers",
  ];

  return {
    responseText: response,
    suggestedChips: chips,
    plannedRoles: rolesToInclude,
  };
}
