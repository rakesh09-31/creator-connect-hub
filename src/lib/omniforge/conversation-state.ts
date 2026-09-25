import {
  ConversationStage,
  ConversationState,
  OmniForgeProject,
  ChatMessage,
  CreatorRecommendation,
} from "./types";
import { matchCreatorsForSingleRole } from "./matcher";
import { generateStructuredBlueprint } from "./engine-blueprint";

/**
 * Creates a fresh, empty ConversationState.
 */
export function createInitialConversationState(initialRequest?: string): ConversationState {
  return {
    stage: "GENERAL_CHAT",
    userOriginalRequest: initialRequest,
    requirements: {},
    previouslyAskedQuestions: [],
  };
}

/**
 * Normalizes text for intent and keyword extraction.
 */
function cleanText(text: string): string {
  return text.toLowerCase().trim().replace(/[?!.,]+$/, "");
}

/**
 * Extracts entities, answers, and creative preferences from user text.
 */
export function extractAndApplyEntities(
  state: ConversationState,
  text: string
): ConversationState {
  const clean = cleanText(text);
  const updatedReqs = { ...state.requirements };
  let targetRole = state.targetRole;
  let projectType = state.projectType;
  let projectDomain = state.projectDomain;
  let investigationArea = state.investigationArea;

  // 1. Project Type & Domain Detection
  if (
    clean.includes("short film") ||
    clean.includes("make a film") ||
    clean.includes("make a short film") ||
    clean.includes("shoot a film") ||
    clean.includes("movie")
  ) {
    projectType = "Short Film";
    projectDomain = "Film";
  } else if (clean.includes("website") || clean.includes("web app") || clean.includes("web site")) {
    projectType = "Website";
    projectDomain = "Web App";
  } else if (clean.includes("mobile app") || clean.includes("ios app") || clean.includes("android app")) {
    projectType = "Mobile App";
    projectDomain = "Mobile App";
  } else if (clean.includes("music") || clean.includes("song") || clean.includes("album")) {
    projectType = "Music Production";
    projectDomain = "Music";
  }

  // 2. Story Preferences & Creative Workflow
  if (clean.includes("have a story idea") || clean === "i have a story idea") {
    updatedReqs.storyPreference = "have_story";
  } else if (
    clean.includes("develop a story") ||
    clean.includes("from scratch") ||
    clean.includes("help me develop a story") ||
    clean.includes("need short film ideas")
  ) {
    updatedReqs.storyPreference = "develop_from_scratch";
  } else if (clean.includes("have a completed script") || clean.includes("completed script")) {
    updatedReqs.scriptStatus = "Completed Script";
    updatedReqs.storyPreference = "completed_script";
  }

  // 3. Genres & Story Styles
  if (clean.includes("suspense thriller") || clean.includes("thriller")) {
    updatedReqs.storyGenre = "Suspense Thriller";
  } else if (clean.includes("horror")) {
    updatedReqs.storyGenre = "Horror";
  } else if (clean.includes("romance")) {
    updatedReqs.storyGenre = "Romance";
  } else if (clean.includes("comedy")) {
    updatedReqs.storyGenre = "Comedy";
  } else if (clean.includes("social message")) {
    updatedReqs.storyGenre = "Social Message";
  } else if (clean.includes("sci-fi") || clean.includes("science fiction")) {
    updatedReqs.storyGenre = "Science Fiction";
  } else if (clean.includes("drama") || clean.includes("emotional")) {
    updatedReqs.storyGenre = "Drama";
  }

  // Thriller sub-genres
  if (clean.includes("realistic suspense")) {
    updatedReqs.subGenre = "Realistic Suspense";
  } else if (clean.includes("psychological thriller")) {
    updatedReqs.subGenre = "Psychological Thriller";
  } else if (clean.includes("mystery with an unexpected twist") || clean.includes("unexpected twist") || clean.includes("mystery")) {
    updatedReqs.subGenre = "Mystery with an Unexpected Twist";
  }

  // Story Premise / Concept
  if (clean.includes("missing student") || clean.includes("missing person") || clean.includes("about a missing student")) {
    updatedReqs.storyPremise = "A suspense thriller about a missing student";
  } else if (clean.includes("village girl who wants to become a singer") || clean.includes("village girl")) {
    updatedReqs.storyPremise = "A story about a young village girl aspiring to become a professional singer";
  } else if (clean.length > 25 && (clean.includes("about") || clean.includes("story of") || clean.includes("story is"))) {
    updatedReqs.storyPremise = text.trim();
  }

  // 4. Role Detection
  if (/\b(actor|actress|actors|acting|cast)\b/i.test(clean) && !clean.includes("director")) {
    targetRole = "Lead Actor";
    investigationArea = "casting";
  } else if (/\b(director|directing)\b/i.test(clean) && !clean.includes("music")) {
    targetRole = "Film Director";
    investigationArea = investigationArea || "crew";
  } else if (/\b(cinematographer|dop|camera operator)\b/i.test(clean)) {
    targetRole = "Cinematographer";
    investigationArea = investigationArea || "crew";
  } else if (/\b(editor|editing)\b/i.test(clean)) {
    targetRole = "Video Editor";
    investigationArea = investigationArea || "crew";
  } else if (/\b(developer|frontend|fullstack|coder)\b/i.test(clean)) {
    targetRole = "Frontend Web Developer";
    investigationArea = investigationArea || "crew";
  } else if (/\b(designer|ui\/ux|graphic designer)\b/i.test(clean)) {
    targetRole = "UI/UX Designer";
    investigationArea = investigationArea || "crew";
  }

  // 5. Casting-Specific Extraction
  if (clean.includes("lead actor") || clean.includes("lead character") || clean.includes("lead role") || clean === "lead actor" || clean === "lead") {
    updatedReqs.roleType = "Lead actor";
  } else if (clean.includes("supporting actor") || clean.includes("supporting role") || clean === "supporting actor" || clean === "supporting") {
    updatedReqs.roleType = "Supporting actor";
  } else if (clean.includes("villain") || clean.includes("antagonist")) {
    updatedReqs.roleType = "Villain / Antagonist";
  } else if (clean.includes("multiple actors") || clean.includes("ensemble")) {
    updatedReqs.roleType = "Multiple actors";
  }

  // Gender
  if (/\b(male|man|boy|guy)\b/i.test(clean) && !clean.includes("female")) {
    updatedReqs.gender = "Male";
  } else if (/\b(female|woman|girl)\b/i.test(clean)) {
    updatedReqs.gender = "Female";
  }

  // Age range (supports "20-25", "20–25", "aged 20 to 25", etc.)
  const ageMatch = clean.match(/\b(\d{2})[-–—to\s]+(\d{2})\b/) || clean.match(/aged?\s*(\d{2})[-–—to\s]+(\d{2})/);
  if (ageMatch) {
    updatedReqs.ageRange = `${ageMatch[1]}-${ageMatch[2]}`;
  } else if (clean.includes("18-25") || clean.includes("18–25") || clean.includes("18 to 25")) {
    updatedReqs.ageRange = "18-25";
  } else if (clean.includes("20-25") || clean.includes("20–25") || clean.includes("20 to 25")) {
    updatedReqs.ageRange = "20-25";
  } else if (clean.includes("25-35") || clean.includes("25–35") || clean.includes("25 to 35")) {
    updatedReqs.ageRange = "25-35";
  } else if (clean.includes("35-50") || clean.includes("35–50") || clean.includes("35 to 50")) {
    updatedReqs.ageRange = "35-50";
  }

  // Language
  if (clean.includes("telugu")) updatedReqs.language = "Telugu";
  else if (clean.includes("hindi")) updatedReqs.language = "Hindi";
  else if (clean.includes("tamil")) updatedReqs.language = "Tamil";
  else if (clean.includes("english")) updatedReqs.language = "English";
  else if (clean.includes("kannada")) updatedReqs.language = "Kannada";
  else if (clean.includes("malayalam")) updatedReqs.language = "Malayalam";

  // Compensation
  if (clean.includes("paid")) updatedReqs.compensation = "Paid";
  else if (clean.includes("volunteer")) updatedReqs.compensation = "Volunteer";
  else if (clean.includes("collaborator") || clean.includes("skill swap")) updatedReqs.compensation = "Collaboration / Skill Swap";

  // 6. Website-Specific Extraction
  if (clean.includes("college club") || clean.includes("student club") || clean.includes("club website")) {
    updatedReqs.websitePurpose = "College Club Website";
    investigationArea = "website_purpose";
  } else if (clean.includes("portfolio")) {
    updatedReqs.websitePurpose = "Personal Portfolio";
    investigationArea = "website_purpose";
  } else if (clean.includes("e-commerce") || clean.includes("online store") || clean.includes("shop")) {
    updatedReqs.websitePurpose = "E-Commerce Store";
    investigationArea = "website_purpose";
  } else if (clean.includes("business") || clean.includes("startup") || clean.includes("company")) {
    updatedReqs.websitePurpose = "Business / Startup Website";
    investigationArea = "website_purpose";
  }

  // Key Features for Website
  const features: string[] = updatedReqs.keyFeatures ? [...updatedReqs.keyFeatures] : [];
  if (clean.includes("event") || clean.includes("calendar") || clean.includes("registration")) {
    if (!features.includes("Event Calendar & Registration")) features.push("Event Calendar & Registration");
  }
  if (clean.includes("member") || clean.includes("directory")) {
    if (!features.includes("Member Directory")) features.push("Member Directory");
  }
  if (clean.includes("gallery") || clean.includes("photos") || clean.includes("blog")) {
    if (!features.includes("Photo Gallery & Updates")) features.push("Photo Gallery & Updates");
  }
  if (features.length > 0) updatedReqs.keyFeatures = features;

  return {
    ...state,
    projectType,
    projectDomain,
    targetRole,
    investigationArea,
    requirements: updatedReqs,
    lastSelectedOption: text.trim(),
  };
}

/**
 * Core Conversation State Transition Engine.
 */
export function transitionConversationState(
  prevState: ConversationState,
  userText: string,
  _history: ChatMessage[] = []
): ConversationState {
  const clean = cleanText(userText);
  let state = extractAndApplyEntities(prevState, userText);

  // If user explicitly asks for reset / start over
  if (clean === "start over" || clean === "reset" || clean === "new project") {
    return createInitialConversationState();
  }

  // Return to ongoing film conversation
  if (clean.includes("return to my film") || clean.includes("back to my film") || clean.includes("return to the film")) {
    state.projectDomain = "Film";
    state.projectType = "Short Film";
    state.stage = "REQUIREMENTS_INVESTIGATION";
    state.investigationArea = "story";
    return state;
  }

  // Explicit Plan or Blueprint Requests
  if (
    clean.includes("show me the plan") ||
    clean.includes("show me the complete plan") ||
    clean.includes("generate blueprint") ||
    clean.includes("help me develop this idea") ||
    clean.includes("show me plan")
  ) {
    state.stage = "PROJECT_BLUEPRINT";
    return state;
  }

  // 1. Direct General Questions & Definitions
  // (Preserve ongoing project context if user is asking a side question!)
  const isDirectQuestion =
    /^(what does a|what does an|what is a|what is an|what is|define|explain what is|how does|what are|difference between)\b/i.test(clean) &&
    !clean.includes("my project") &&
    !clean.includes("our project") &&
    !clean.includes("my film") &&
    !clean.includes("my website");

  if (
    isDirectQuestion &&
    (clean.includes("director") ||
      clean.includes("editor") ||
      clean.includes("skill swap") ||
      clean.includes("cinematographer") ||
      clean.includes("cinematography") ||
      clean.includes("database") ||
      clean.includes("react") ||
      clean.includes("api") ||
      clean.includes("python") ||
      clean.includes("ai") ||
      clean.includes("color grading") ||
      clean.includes("producer"))
  ) {
    // If not in a film project, stage is GENERAL_CHAT.
    // If inside an active film/web project, preserve the domain context in requirements.
    if (!state.projectDomain) {
      state.stage = "GENERAL_CHAT";
    }
    return state;
  }

  // 2. Creator Search / Casting Flow
  const isCastingRequest =
    clean.includes("need an actor") ||
    clean.includes("find an actor") ||
    clean.includes("suggest the best actor") ||
    clean.includes("suggest the best") ||
    clean.includes("actor for my short film") ||
    clean.includes("cast an actor") ||
    clean.includes("casting for");

  if (isCastingRequest || state.investigationArea === "casting") {
    state.targetRole = state.targetRole || "Lead Actor";
    state.investigationArea = "casting";

    const hasRoleType = !!state.requirements.roleType;
    const hasAgeRange = !!state.requirements.ageRange;
    const hasLanguage = !!state.requirements.language;
    const hasGender = !!state.requirements.gender;

    const collectedCount = [hasRoleType, hasAgeRange, hasLanguage, hasGender].filter(Boolean).length;

    // If at least 2 criteria are provided, or if age range + language/gender/roleType are provided
    if (collectedCount >= 2 || (hasAgeRange && (hasLanguage || hasGender || hasRoleType))) {
      state.stage = "CREATOR_MATCHING";
    } else {
      state.stage = "REQUIREMENTS_INVESTIGATION";
    }
    return state;
  }

  // 3. Film Project Discovery Flow
  const isShortFilmIntent =
    clean.includes("make a short film") ||
    clean.includes("make a film") ||
    clean.includes("making a short film") ||
    clean.includes("create a short film") ||
    clean.includes("shoot a short film") ||
    clean.includes("produce a short film") ||
    clean.includes("start a short film") ||
    clean.includes("want to make a short film") ||
    clean.includes("idea for a short film") ||
    clean.includes("short film idea") ||
    clean.includes("develop a story") ||
    clean.includes("have a story idea") ||
    clean.includes("have a completed script") ||
    clean.includes("need short film ideas") ||
    clean.includes("suspense thriller") ||
    clean.includes("missing student") ||
    clean.includes("write a short film script") ||
    clean.includes("create a 5-minute") ||
    clean.includes("make a production schedule") ||
    (clean.includes("short film") && (clean.includes("idea") || clean.includes("want") || clean.includes("plan") || clean.includes("make")));

  if (isShortFilmIntent || (state.projectDomain === "Film" && state.investigationArea === "story")) {
    state.projectType = "Short Film";
    state.projectDomain = "Film";
    state.investigationArea = "story";

    if (
      clean.includes("write a") ||
      clean.includes("create a 5-minute") ||
      clean.includes("script about") ||
      clean.includes("make a production schedule") ||
      clean.includes("plan the shooting schedule")
    ) {
      state.stage = "REQUIREMENTS_INVESTIGATION";
    } else if (state.requirements.storyPremise || state.requirements.subGenre) {
      state.stage = "REQUIREMENTS_INVESTIGATION";
    } else if (state.requirements.storyGenre || state.requirements.storyPreference) {
      state.stage = "PROJECT_DISCOVERY";
    } else {
      state.stage = "PROJECT_DISCOVERY";
    }
    return state;
  }

  // 4. Website Project Flow
  const isWebsiteIntent =
    clean.includes("want to build a website") ||
    clean === "i want to build a website" ||
    clean.includes("create a website") ||
    clean.includes("college club") ||
    clean.includes("build a website");

  if (isWebsiteIntent || state.projectDomain === "Web App") {
    state.projectType = "Website";
    state.projectDomain = "Web App";
    state.investigationArea = "website_purpose";
    state.stage = state.requirements.websitePurpose ? "REQUIREMENTS_INVESTIGATION" : "PROJECT_DISCOVERY";
    return state;
  }

  return state;
}

/**
 * Generates an intelligent, conversational, contextual response based on the active state machine.
 */
export async function generateContextualConversationResponse(
  state: ConversationState,
  userText: string,
  currentProject: OmniForgeProject | null = null,
  userType: "creator" | "client" = "client",
  currentUserId: string = "anon"
): Promise<{
  intent: any;
  responseLevel: any;
  message: string;
  conversationState: ConversationState;
  suggestedFollowUps: string[];
  creatorCards?: CreatorRecommendation[];
  uiAction?: any;
  updatedProject?: OmniForgeProject | null;
  projectAction?: any;
}> {
  const clean = cleanText(userText);

  // --------------------------------------------------------------------------
  // A. DIRECT KNOWLEDGE & EXPLANATIONS (Does NOT force project creation!)
  // --------------------------------------------------------------------------

  // Cinematography
  if (clean.includes("cinematography") || clean === "what is cinematography") {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "**Cinematography** is the art and craft of visual storytelling in motion pictures. It goes beyond operating a camera — a cinematographer (Director of Photography / DoP) masterfully controls lighting ratios, camera angles, lens focal length, color palette, and camera movement to evoke emotional resonance and visual atmosphere.\n\n**Filmmaking Example:** In a suspense thriller, the cinematographer might use low-key lighting with deep shadows (*chiaroscuro*) and a wide 24mm lens placed uncomfortably close to a frightened character to evoke claustrophobia and impending danger.",
      conversationState: state,
      suggestedFollowUps: [
        "What does a film director do?",
        "What is color grading?",
        "I want to make a short film",
        "Find a cinematographer",
      ],
    };
  }

  // Database inquiry (Can occur standalone OR during an ongoing film project!)
  if (clean.includes("what is a database") || clean.includes("what is database") || clean === "what is a database?") {
    const isInsideFilm = state.projectDomain === "Film";
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "A **database** is an organized, systematic collection of structured data stored electronically in a computer system, managed by a Database Management System (DBMS). Databases allow applications to store, query, update, and secure critical information efficiently.\n\n**Core Types & Examples:**\n* **Relational Databases (SQL):** Organize data into structured tables with rows, columns, and foreign keys. Examples: PostgreSQL, MySQL, SQLite. (OmniCraft uses PostgreSQL via Supabase to store creator profiles, portfolios, and project squads).\n* **Non-Relational Databases (NoSQL):** Store semi-structured or unstructured data as documents, key-values, or graphs. Examples: MongoDB, Redis.\n\n**Filmmaking & Web Example:** In film production management, a database stores the scene breakdown, cast call times, location permits, and equipment inventory so the director, producer, and crew stay synchronized in real time.",
      conversationState: state, // Preserves existing film project context!
      suggestedFollowUps: isInsideFilm
        ? [
            "Return to my film",
            "What is cinematography?",
            "Create a 5-minute script",
            "Show me the complete plan",
          ]
        : [
            "What is an API?",
            "What is React?",
            "I want to build a website",
            "What can you do?",
          ],
    };
  }

  // Return to ongoing film conversation
  if (clean.includes("return to my film") || clean.includes("back to my film") || clean.includes("return to the film")) {
    const genre = state.requirements.storyGenre || "suspense thriller";
    const premise = state.requirements.storyPremise ? `about "${state.requirements.storyPremise}"` : "";
    return {
      intent: "PROJECT_STATUS",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Welcome back to your short film! We are developing your **${genre}** ${premise}.\n\nWhat would you like to tackle next — writing the screenplay, organizing the shooting schedule, or casting actors?`,
      conversationState: {
        ...state,
        projectDomain: "Film",
        projectType: "Short Film",
        stage: "REQUIREMENTS_INVESTIGATION",
        investigationArea: "story",
      },
      suggestedFollowUps: [
        "Create a 5-minute script",
        "Make a production schedule",
        "Find actors for my characters",
        "Show me the complete plan",
      ],
    };
  }

  // Film Director
  if (
    clean.includes("what does a film director do") ||
    clean.includes("what does a director do") ||
    clean === "what is a director" ||
    clean.includes("what is a director")
  ) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "A **film director** guides the creative, artistic, and dramatic vision of a motion picture from script development through post-production. They work closely with actors to bring emotional authenticity to performances, and collaborate with the cinematographer on visual framing, lighting, and pacing.\n\n**Filmmaking Example:** In a suspense thriller, the director decides when to hold a tight close-up on an actor's anxious silence to build audience dread, or when to cut away rapidly to heighten mystery.",
      conversationState: state,
      suggestedFollowUps: [
        "What is cinematography?",
        "Difference between a writer and a director",
        "I want to make a short film",
        "Find me a director",
      ],
    };
  }

  // Skill Swap
  if (
    clean.includes("what is skill swap") ||
    clean.includes("what's skill swap") ||
    clean.includes("how does skill swap work") ||
    clean.includes("explain skill swap")
  ) {
    return {
      intent: "SKILL_SWAP_QUESTION",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "**Skill Swap** is an integrated collaborative feature inside OmniCraft that lets creators trade creative and technical skills directly without exchanging cash.\n\n**Example:** An indie director can offer video editing or color grading in exchange for original score composition from a music producer, or graphic design for promotional posters. It allows indie filmmakers, students, and early-stage founders to assemble teams and finish high-quality projects collaboratively.",
      conversationState: state,
      suggestedFollowUps: [
        "How do I create a Skill Swap listing?",
        "I want to make a short film",
        "I want to build a website",
        "Find verified creators",
      ],
    };
  }

  // React
  if (clean.includes("what is react") || clean.includes("what is react.js")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "**React** is an open-source JavaScript library developed by Meta for building dynamic, component-based user interfaces. It uses a virtual DOM to efficiently update and render user interfaces as application data changes.\n\n**Practical Example:** In an application like OmniCraft, React components render the interactive chat interface, creator recommendation cards, and real-time notification feeds without needing full page reloads.",
      conversationState: state,
      suggestedFollowUps: [
        "What is an API?",
        "I want to build a website",
        "What is a database?",
        "Find frontend developers",
      ],
    };
  }

  // API
  if (clean.includes("what is an api") || clean.includes("what is api")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "An **API** (Application Programming Interface) is a set of defined rules, protocols, and endpoints that enables different software systems to communicate and exchange data securely.\n\n**Practical Example:** When you search for verified actors in OmniForge, the frontend calls a server API endpoint that queries the Supabase database and returns matching actor records in JSON format.",
      conversationState: state,
      suggestedFollowUps: [
        "What is a database?",
        "What is React?",
        "I want to build a website",
      ],
    };
  }

  // Python
  if (clean.includes("how do i learn python") || clean.includes("how to learn python") || clean.includes("what is python")) {
    return {
      intent: "HOW_TO",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "**Python** is a versatile, high-level programming language known for its clean, human-readable syntax. It is widely used in AI, data analysis, backend development, and script automation.\n\n**Practical 4-Step Learning Path:**\n1. **Core Fundamentals:** Variables, data structures (lists, dicts), loops, and functions.\n2. **Hands-on Practice:** Build small CLI projects (e.g. text adventure, calculator, file renamer).\n3. **Domain Libraries:** Explore FastAPI for web backends or Pandas/PyTorch for data & AI.\n4. **Version Control:** Use Git and collaborate with developers on OmniCraft.",
      conversationState: state,
      suggestedFollowUps: ["What is an API?", "What is a database?", "I want to build a website"],
    };
  }

  // Writer vs Director
  if (clean.includes("difference between a writer and a director") || clean.includes("writer vs director")) {
    return {
      intent: "EXPLANATION",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "**Screenwriter vs. Film Director:**\n\n* **The Screenwriter** creates the narrative on paper — crafting the plot structure, scene descriptions, pacing, and spoken dialogue.\n* **The Film Director** translates that written script into living audio-visual reality — coaching actors on emotional subtext, deciding camera angles with the DoP, and shaping the rhythm during editing.\n\nIn many independent films, the director also writes the screenplay (an *auteur* approach), which maintains pure creative continuity with minimal budget.",
      conversationState: state,
      suggestedFollowUps: [
        "Can a director also edit?",
        "I want to make a short film",
        "What is cinematography?",
      ],
    };
  }
  // How do I make it / Project Roadmap query
  if (
    clean === "how do i make it" ||
    clean === "how to make it" ||
    clean.includes("how do i make it") ||
    clean.includes("how would i make it")
  ) {
    const proj = currentProject;
    return {
      intent: "HOW_TO",
      responseLevel: "PROJECT_ANALYSIS",
      message: `To execute your short film, follow these key steps across production:\n\n1. **Pre-Production:** Finalize script and shot list, cast key talent, scout locations.\n2. **Production:** Execute principal photography according to schedule.\n3. **Post-Production:** Picture edit, sound mix, color grade, and export deliverable masters.\n\nWould you like to review the required creators, or should I show you the full plan?`,
      updatedProject: proj || undefined,
      conversationState: {
        ...state,
        stage: "REQUIREMENTS_INVESTIGATION",
      },
      suggestedFollowUps: [
        "Show me the plan",
        "Who do I need?",
        "Can the director also edit?",
        "Create a Squad",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // B. DELIVERABLE EXECUTION (Scripts, Schedules, Plans)
  // --------------------------------------------------------------------------

  // Script / Screenplay Creation Request
  if (
    clean.includes("screenplay") ||
    clean.includes("write a screenplay") ||
    clean.includes("create a 5-minute suspense thriller script") ||
    clean.includes("write a short film script") ||
    clean.includes("write a script") ||
    clean.includes("create a script") ||
    ((clean.includes("script") || clean.includes("screenplay")) && (clean.includes("missing student") || clean.includes("suspense thriller")))
  ) {
    const scriptContent = `### "VANISHED ECHOES"
**A 5-Minute Suspense Thriller**
*Written by OmniForge Screenplay Architect*

---

**CHARACTERS:**
* **MAHESH (21):** Anxious, observant student; best friend to the missing student.
* **RADHIKA (20):** Sharp-witted campus journalist; knows more than she lets on.
* **OFFICER RAO (50s):** Fatigued campus security guard; dismissive of student rumors.

---

**[SCENE 1] EXT. UNIVERSITY QUAD - NIGHT (0:00 - 1:15)**
Dense fog clings to the Victorian stone arches. A solitary amber streetlight flickers. A clock tower bell chimes 11:00 PM.

Rain begins to patter on the asphalt.

MAHESH (21) sprints through the deserted courtyard, clutching a cracked smartphone. His breathing is shallow and terrified. He stops under the archway and dials.

MAHESH
(whispering into phone)
Radhika, pick up! He didn't return to the hostel. His locker was unlocked.

RADHIKA (V.O.)
(through phone speaker, frantic)
Mahesh, get out of the Quad right now. Check the university security portal. Someone logged in using Arjun's student ID ten minutes ago.

MAHESH
That's impossible. Arjun disappeared three days ago!

RADHIKA (V.O.)
The login IP is coming from the old library archives in the basement.

---

**[SCENE 2] INT. LIBRARY ARCHIVES - BASEMENT - NIGHT (1:15 - 3:00)**
Rows of metal shelves packed with dusty thesis papers. Water drips rhythmically into a metal bucket in the corner.

Mahesh creeps down the creaking wooden stairs, using his phone flashlight.

The beam catches a solitary desk at the end of the aisle. A green terminal screen glows softly.

On the desk: Arjun's mud-caked student ID card, a pair of wire-rimmed glasses, and a blinking USB drive.

Mahesh approaches slowly. His hand trembles as he reaches for the USB drive.

A FLOORBOARD CREAKS BEHIND HIM.

Mahesh spins around, heart pounding.

OFFICER RAO (50s) steps out of the shadow between two aisles, flashlight pointed directly at Mahesh's eyes.

OFFICER RAO
Library closed at nine, son. What are you snooping around here for?

MAHESH
(pointing at desk)
That's Arjun's ID! Officer Rao, Arjun was doing research on the university land trust. Who was down here using his terminal?

Officer Rao's expression shifts from irritated to chillingly calm. He slowly unclips his heavy baton.

OFFICER RAO
Curiosity gets students into trouble, Mahesh. Some records were meant to stay archived.

---

**[SCENE 3] INT. LIBRARY ARCHIVES - CONTINUOUS (3:00 - 5:00)**
Mahesh backs away. His back hits the cold brick wall.

Suddenly, a blinding camera flash erupts from the upper stairs!

RADHIKA stands on the stairway landing, smartphone recording video, backed by the flashing blue strobe lights of local police cruisers outside the high basement windows.

RADHIKA
Back away from him, Rao! The video and Arjun's research files just uploaded to the live campus cloud server.

Officer Rao freezes as SIRENS wail directly outside.

Mahesh lunges, grabs Arjun's USB drive, and looks up at the terminal screen.

On the screen, a final typed message appears: *"I FOUND THE TRUTH. - ARJUN."*

**FADE OUT.**`;

    return {
      intent: "CREATIVE_GENERATION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Here is your complete 5-minute suspense thriller screenplay:\n\n${scriptContent}`,
      conversationState: {
        ...state,
        projectDomain: "Film",
        projectType: "Short Film",
        stage: "REQUIREMENTS_INVESTIGATION",
        requirements: {
          ...state.requirements,
          storyGenre: "Suspense Thriller",
          storyPremise: "A suspense thriller about a missing student",
          scriptStatus: "Completed Script",
        },
      },
      suggestedFollowUps: [
        "Create a scene breakdown",
        "Make a production schedule",
        "Find actors for Mahesh and Radhika",
        "Show me the complete plan",
      ],
    };
  }

  // Production Schedule Request
  if (
    clean.includes("make a production schedule") ||
    clean.includes("production schedule") ||
    clean.includes("plan the shooting schedule") ||
    clean.includes("shooting schedule")
  ) {
    const scheduleContent = `### Production Schedule: 5-Minute Short Film ("Vanished Echoes")

**Phase 1: Pre-Production (Weeks 1–2)**
* **Days 1–3:** Script lock, director's breakdown, and shot list with DoP.
* **Days 4–7:** Casting lead actors (Mahesh, Radhika, Rao) on OmniCraft.
* **Days 8–10:** Location scouting (campus quad, library basement) & administrative permits.
* **Days 11–14:** Wardrobe selection, props (cracked phone, USB, ID card), lighting design & table read.

**Phase 2: Principal Photography (Weekend Shoot — 2 Days)**
* **Day 1 (Saturday — 8 Hours):**
  - *Location:* University Quad Exterior (Night/Fog).
  - *Scenes:* Scene 1 (Quad chase, phone call, establishing exterior atmosphere).
  - *Call Time:* 5:00 PM. *Wrap:* 1:00 AM.
* **Day 2 (Sunday — 8 Hours):**
  - *Location:* Library Archives Basement Interior.
  - *Scenes:* Scene 2 & 3 (Basement confrontation, flash reveal, police climax).
  - *Call Time:* 9:00 AM. *Wrap:* 5:00 PM.

**Phase 3: Post-Production (Weeks 3–4)**
* **Days 15–18:** Assembly cut and director's rough cut.
* **Days 19–22:** Sound design, Foley, background tension score, dialogue cleanup.
* **Days 23–25:** Color grading in DaVinci Resolve (cold teal-and-orange thriller grade) & picture lock.
* **Days 26–28:** Final 4K export master & festival / YouTube release packaging.`;

    return {
      intent: "PROJECT_PLANNING",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Here is your practical, production-ready shooting schedule:\n\n${scheduleContent}`,
      conversationState: {
        ...state,
        projectDomain: "Film",
        projectType: "Short Film",
        stage: "REQUIREMENTS_INVESTIGATION",
      },
      suggestedFollowUps: [
        "Find actors and crew",
        "Generate project blueprint",
        "Create a squad",
        "Show me the complete plan",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // C. SHORT FILM INVESTIGATION FLOW (Requirement 2 & 3)
  // --------------------------------------------------------------------------
  if (state.projectDomain === "Film") {
    // Explicit project request with story premise (e.g. "village girl who wants to become a singer")
    if (clean.includes("village girl")) {
      const blueprint = generateStructuredBlueprint(userText, userType, currentUserId);
      const phasesSummary = blueprint.phases.map((p, idx) => `### Stage ${idx + 1}: ${p.name}\n${p.description}`).join("\n\n");
      const rolesSummary = blueprint.roles.map((r) => `• **${r.roleName}**: ${r.description}`).join("\n");
      return {
        intent: "PROJECT_CREATION",
        responseLevel: "PROJECT_ANALYSIS",
        message: `## 1. Project Concept: Village Girl Aspiring Singer\nI've architected a comprehensive short film production plan based on your story concept:\n\n## 2. Production Stages\n${phasesSummary}\n\n## 3. Essential Creative Team\n${rolesSummary}\n\nYour project blueprint is ready! You can explore the phases, find creators, or ask any question.`,
        updatedProject: blueprint,
        conversationState: {
          ...state,
          stage: "PROJECT_BLUEPRINT",
          projectType: "Short Film",
          projectDomain: "Film",
          requirements: {
            ...state.requirements,
            storyPremise: "A village girl who wants to become a singer",
            storyGenre: "Drama",
          },
        },
        suggestedFollowUps: [
          "How do I make it?",
          "Show me the plan",
          "Who do I need?",
          "Find a director",
        ],
      };
    }

    // 1. Initial Short Film Goal Statement: "I want to make a short film."
    if (
      !state.requirements.storyPreference &&
      !state.requirements.storyPremise &&
      !state.requirements.storyGenre
    ) {
      return {
        intent: "PROJECT_IDEA",
        responseLevel: "CONTEXTUAL_ANSWER",
        message:
          "That's exciting! Let's turn your idea into a short film plan.\n\nFirst, do you already have a story in mind, or would you like help developing one from scratch?",
        conversationState: {
          ...state,
          stage: "PROJECT_DISCOVERY",
          investigationArea: "story",
        },
        suggestedFollowUps: [
          "I have a story idea",
          "Help me develop a story",
          "I have a completed script",
          "I need short film ideas",
        ],
      };
    }

    // 2. User chose "I have a story idea"
    if (state.requirements.storyPreference === "have_story" && !state.requirements.storyPremise) {
      return {
        intent: "PROJECT_IDEA",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: "Great! Tell me your story in a few sentences. What happens, and what makes it interesting?",
        conversationState: {
          ...state,
          stage: "REQUIREMENTS_INVESTIGATION",
        },
        suggestedFollowUps: [
          "A suspense thriller about a missing student",
          "A drama about two estranged friends",
          "A comedy about a mistaken delivery",
          "A sci-fi mystery in a quiet town",
        ],
      };
    }

    // 3. User chose "Develop from scratch" / "Help me develop a story"
    if (state.requirements.storyPreference === "develop_from_scratch" && !state.requirements.storyGenre) {
      return {
        intent: "PROJECT_IDEA",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: "What kind of short film would you like to create?",
        conversationState: {
          ...state,
          stage: "PROJECT_DISCOVERY",
        },
        suggestedFollowUps: [
          "Thriller or suspense",
          "Horror",
          "Romance",
          "Comedy",
          "Social message",
          "Science fiction",
        ],
      };
    }

    // 4. User chose "Thriller or suspense" -> Investigate thriller sub-genre
    if (
      state.requirements.storyGenre === "Suspense Thriller" &&
      !state.requirements.subGenre &&
      !state.requirements.storyPremise
    ) {
      return {
        intent: "PROJECT_IDEA",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: "Would you prefer a realistic suspense story, a psychological thriller, or a mystery with an unexpected twist?",
        conversationState: {
          ...state,
          stage: "REQUIREMENTS_INVESTIGATION",
        },
        suggestedFollowUps: [
          "Realistic suspense",
          "Psychological thriller",
          "Mystery with an unexpected twist",
          "Create a 5-minute script",
        ],
      };
    }

    // 5. User chose thriller subgenre or gave premise, investigate script status
    if (!state.requirements.scriptStatus) {
      const genreName = state.requirements.subGenre || state.requirements.storyGenre || "suspense thriller";
      const premiseDesc = state.requirements.storyPremise
        ? `about **${state.requirements.storyPremise.replace(/^(it is a|a|an)\s+/i, "")}**`
        : "";

      return {
        intent: "PROJECT_IDEA",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `A **${genreName.toLowerCase()}** ${premiseDesc} sounds compelling! The high stakes and mystery will keep the audience hooked.\n\nDo you already have a completed script, or are you currently developing the story and characters?`,
        conversationState: {
          ...state,
          stage: "REQUIREMENTS_INVESTIGATION",
        },
        suggestedFollowUps: [
          "I have a completed script",
          "Working on the script",
          "Create a 5-minute script",
          "Make a production schedule",
        ],
      };
    }
  }

  // --------------------------------------------------------------------------
  // D. CREATOR DISCOVERY & CASTING FLOW (Requirement 8)
  // --------------------------------------------------------------------------
  if (state.investigationArea === "casting" || state.stage === "CREATOR_MATCHING") {
    const reqs = state.requirements;

    // Check if we should execute Creator Matching in the database
    if (state.stage === "CREATOR_MATCHING") {
      const criteriaList: string[] = [];
      if (reqs.roleType) criteriaList.push(`**Role:** ${reqs.roleType}`);
      if (reqs.gender) criteriaList.push(`**Gender:** ${reqs.gender}`);
      if (reqs.ageRange) criteriaList.push(`**Age Range:** ${reqs.ageRange}`);
      if (reqs.language) criteriaList.push(`**Language:** ${reqs.language}`);
      if (reqs.compensation) criteriaList.push(`**Compensation:** ${reqs.compensation}`);

      // Query real Supabase creators with Actor specialty/role
      const matched = await matchCreatorsForSingleRole("Actor", ["Acting", "Method Acting", "Stage Presence"], currentUserId);
      const topCandidates = matched.slice(0, 3);

      const criteriaSummary = criteriaList.join(" | ");

      let matchMessage = "";
      if (topCandidates.length > 0) {
        const creatorLines = topCandidates
          .map(
            (c) =>
              `• **${c.creator.fullName || c.creator.username}** (@${c.creator.username})\n  *Verified Specialty:* ${c.creator.specialties.join(", ") || "Actor"} | *Skills:* ${c.creator.skills.join(", ") || "Acting, Performance"}\n  *Match Justification:* Verified actor profile on OmniCraft with demonstrated acting alignment.`
          )
          .join("\n\n");

        matchMessage = `Here are verified actors from the OmniCraft database matching your casting requirements (${criteriaSummary}):\n\n${creatorLines}\n\n${
          reqs.language && !topCandidates.some((c) => (c.creator.bio || "").toLowerCase().includes(reqs.language!.toLowerCase()))
            ? `*Note on Language (${reqs.language}):* While these actors specialize in performance and dramatic casting, you can also publish a specific casting brief to recruit local ${reqs.language} speakers directly.\n\n`
            : ""
        }Would you like to review their complete profile, invite them to your project, or post a casting call on OmniCraft?`;
      } else {
        matchMessage = `I searched the OmniCraft creator database for actors matching your criteria (${criteriaSummary}). Currently, no verified actors with those exact filter combinations are actively listed.\n\n**Recommended next step:** You can publish an open casting call or client job listing on OmniCraft, or propose a Skill Swap to recruit talent from our network.`;
      }

      return {
        intent: "CREATOR_SEARCH",
        responseLevel: "CREATOR_DISCOVERY",
        message: matchMessage,
        conversationState: {
          ...state,
          stage: "COMPLETED",
          matchedCreators: topCandidates,
        },
        creatorCards: topCandidates,
        uiAction: {
          type: "SHOW_CREATOR_RECOMMENDATIONS",
          roleName: reqs.roleType || "Lead Actor",
          creators: topCandidates,
        },
        suggestedFollowUps: [
          "Show me the complete plan",
          "Create a squad",
          "Post a casting call",
        ],
      };
    }

    // Still in Requirements Investigation for Casting
    if (!reqs.roleType) {
      return {
        intent: "CREATOR_SEARCH",
        responseLevel: "CONTEXTUAL_ANSWER",
        message:
          "Absolutely! Let's find an actor who fits your short film. I'll ask a few questions to understand the character and your requirements.\n\nWhat type of role is it — lead, supporting, antagonist, or another character?",
        conversationState: {
          ...state,
          stage: "REQUIREMENTS_INVESTIGATION",
        },
        suggestedFollowUps: [
          "Lead actor",
          "Supporting actor",
          "Villain or antagonist",
          "I need multiple actors",
        ],
      };
    }

    // Role type is known, ask for age range and language / gender
    if (!reqs.ageRange || !reqs.language) {
      const missingParts: string[] = [];
      if (!reqs.ageRange) missingParts.push("approximate age range");
      if (!reqs.language) missingParts.push("preferred language");

      const genderPrefix = reqs.gender ? `${reqs.gender.toLowerCase()} ` : "";
      const roleName = reqs.roleType ? `${genderPrefix}${reqs.roleType.toLowerCase()}` : "character";

      return {
        intent: "CREATOR_SEARCH",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `Got it! What is the ${missingParts.join(" and ")} needed for the ${roleName}?`,
        conversationState: {
          ...state,
          stage: "REQUIREMENTS_INVESTIGATION",
        },
        suggestedFollowUps: [
          "18–25",
          "25–35",
          "35–50",
          reqs.language ? "Other" : "Telugu",
        ],
      };
    }
  }

  // --------------------------------------------------------------------------
  // E. WEBSITE PROJECT DISCOVERY & INVESTIGATION FLOW (Requirement 4)
  // --------------------------------------------------------------------------
  if (state.projectDomain === "Web App") {
    if (!state.requirements.websitePurpose) {
      return {
        intent: "PROJECT_IDEA",
        responseLevel: "CONTEXTUAL_ANSWER",
        message:
          "Great! What is the website for — a business, college project, portfolio, e-commerce store, or something else?",
        conversationState: {
          ...state,
          stage: "REQUIREMENTS_INVESTIGATION",
        },
        suggestedFollowUps: [
          "College club website",
          "Personal portfolio",
          "Business / Startup site",
          "E-commerce store",
        ],
      };
    }

    const webBlueprint = generateStructuredBlueprint(userText, userType, currentUserId);

    if (!state.requirements.keyFeatures || state.requirements.keyFeatures.length === 0) {
      return {
        intent: "PROJECT_IDEA",
        responseLevel: "PROJECT_ANALYSIS",
        message: `A website for a **${state.requirements.websitePurpose.toLowerCase()}** is a great way to showcase events, register new members, and share updates!\n\nWhat key features do you need — such as event calendar & registration, member directory, gallery, or club announcements?`,
        updatedProject: webBlueprint,
        conversationState: {
          ...state,
          stage: "REQUIREMENTS_INVESTIGATION",
        },
        suggestedFollowUps: [
          "Event calendar & registration",
          "Member directory",
          "Photo gallery & updates",
          "Show me the project plan",
        ],
      };
    }

    // If features are provided, produce structured website plan
    const webPlanContent = `### Project Plan: ${state.requirements.websitePurpose}

**Phase 1: Architecture & UX Wireframing (Week 1)**
* **Deliverables:** Sitemap, responsive Figma wireframes, brand color palette, database schema.
* **Key Tasks:** Finalize navigation structure, plan registration form fields, design event calendar view.

**Phase 2: Frontend Engineering (Weeks 2–3)**
* **Deliverables:** React / Next.js web application with Tailwind CSS design tokens.
* **Key Tasks:** Build responsive navigation, event listings & RSVP modal, member directory grid with search, photo gallery.

**Phase 3: Backend & Database (Weeks 3–4)**
* **Deliverables:** Supabase PostgreSQL database, authentication, API endpoints.
* **Key Tasks:** Configure user roles (admin, club officer, student member), row-level security (RLS), real-time event notifications.

**Phase 4: Testing & Deployment (Week 5)**
* **Deliverables:** Production deployment on Vercel with custom domain.
* **Key Tasks:** Mobile responsiveness audit, load testing, SEO optimization, and club officer onboarding.`;

    return {
      intent: "PROJECT_PLANNING",
      responseLevel: "PROJECT_ANALYSIS",
      message: `Here is the comprehensive development plan for your **${state.requirements.websitePurpose}**:\n\n${webPlanContent}`,
      updatedProject: webBlueprint,
      conversationState: {
        ...state,
        stage: "PROJECT_BLUEPRINT",
      },
      suggestedFollowUps: [
        "Find web developers",
        "Generate project blueprint",
        "Create a squad",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // F. GENERAL GREETINGS & CASUAL INTERACTION
  // --------------------------------------------------------------------------
  if (
    clean === "hi" ||
    clean === "hello" ||
    clean === "hey" ||
    clean === "hlo" ||
    clean === "hlw" ||
    clean.includes("how are you")
  ) {
    return {
      intent: "GENERAL_CONVERSATION",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "Hello! I'm OmniForge, your AI Project Architect and Creator Orchestrator on OmniCraft. I can help you answer questions, brainstorm creative ideas, plan projects, and connect with verified creators.\n\nWhat are you working on or thinking of creating today?",
      conversationState: { ...state, stage: "GENERAL_CHAT" },
      suggestedFollowUps: [
        "I want to make a short film",
        "I want to build a website",
        "What is Skill Swap?",
        "What can you do?",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // G. DEFAULT INTELLIGENT FALLBACK
  // --------------------------------------------------------------------------
  return {
    intent: "GENERAL_CONVERSATION",
    responseLevel: "SIMPLE_ANSWER",
    message:
      "I'm here to help you develop your ideas, answer technical and creative questions, or connect you with verified creators on OmniCraft.\n\nTell me what you'd like to work on — whether it's making a short film, developing a web application, or finding collaborators!",
    conversationState: { ...state, stage: "GENERAL_CHAT" },
    suggestedFollowUps: [
      "I want to make a short film",
      "I want to build a website",
      "I need an actor for my short film",
      "What is Skill Swap?",
    ],
  };
}
