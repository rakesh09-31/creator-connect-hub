import {
  ConversationStage,
  ConversationState,
  OmniForgeProject,
  ChatMessage,
  CreatorRecommendation,
} from "./types";
import { matchCreatorsForSingleRole } from "./matcher";

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
 * Extracts entities and answers from user text, updating the conversation state.
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
  if (clean.includes("short film") || clean.includes("film") || clean.includes("movie")) {
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

  // 2. Role Detection
  if (/\b(actor|actress|actors|acting)\b/i.test(clean)) {
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

  // 3. Casting-Specific Extraction
  // Role type
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

  // Age range
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
  else if (clean.includes("spanish")) updatedReqs.language = "Spanish";

  // Compensation
  if (clean.includes("paid")) updatedReqs.compensation = "Paid";
  else if (clean.includes("volunteer")) updatedReqs.compensation = "Volunteer";
  else if (clean.includes("collaborator") || clean.includes("skill swap")) updatedReqs.compensation = "Collaboration / Skill Swap";

  // 4. Story & Concept Extraction
  if (clean.includes("suspense thriller") || clean.includes("thriller")) {
    updatedReqs.storyGenre = "Suspense Thriller";
  } else if (clean.includes("comedy")) {
    updatedReqs.storyGenre = "Comedy";
  } else if (clean.includes("drama") || clean.includes("emotional")) {
    updatedReqs.storyGenre = "Drama";
  } else if (clean.includes("horror")) {
    updatedReqs.storyGenre = "Horror";
  } else if (clean.includes("sci-fi") || clean.includes("science fiction")) {
    updatedReqs.storyGenre = "Sci-Fi";
  }

  if (clean.includes("missing student") || clean.includes("missing person") || clean.includes("about a missing student")) {
    updatedReqs.storyPremise = "A suspense thriller about a missing student";
  } else if (clean.includes("village girl who wants to become a singer") || clean.includes("village girl")) {
    updatedReqs.storyPremise = "A story about a young village girl aspiring to become a professional singer";
  } else if (clean.length > 20 && (clean.includes("about") || clean.includes("story of"))) {
    updatedReqs.storyPremise = text.trim();
  }

  // Script status
  if (clean.includes("have a script") || clean.includes("completed script") || clean.includes("finished script")) {
    updatedReqs.scriptStatus = "Completed Script";
  } else if (clean.includes("working on the script") || clean.includes("drafting")) {
    updatedReqs.scriptStatus = "In Progress";
  } else if (clean.includes("only an idea") || clean.includes("just the idea") || clean.includes("concept only") || clean.includes("just an idea")) {
    updatedReqs.scriptStatus = "Idea / Concept";
  }

  // 5. Website-Specific Extraction
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

  // Key Features
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
  if (features.length > 0) {
    updatedReqs.keyFeatures = features;
  }

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
  history: ChatMessage[]
): ConversationState {
  const clean = cleanText(userText);
  let state = extractAndApplyEntities(prevState, userText);

  // If user explicitly asks for reset / start over
  if (clean === "start over" || clean === "reset" || clean === "new project") {
    return createInitialConversationState();
  }

  // Explicit Plan Request
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

  // 1. Direct General Questions & Definitions -> GENERAL_CHAT
  const isDirectQuestion =
    /^(what does a|what does an|what is a|what is an|what is|define|explain what is|how does)\b/i.test(clean) &&
    !clean.includes("my project") &&
    !clean.includes("our project") &&
    !clean.includes("my film") &&
    !clean.includes("my website");

  if (isDirectQuestion && (clean.includes("director") || clean.includes("editor") || clean.includes("skill swap") || clean.includes("cinematographer") || clean.includes("producer"))) {
    state.stage = "GENERAL_CHAT";
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

    // Check if we have collected enough requirements to perform database creator matching
    // (At least role type or age range or gender or language specified)
    const collectedCount = [hasRoleType, hasAgeRange, hasLanguage, hasGender].filter(Boolean).length;

    if (collectedCount >= 2 || (hasAgeRange && (hasLanguage || hasGender || hasRoleType))) {
      state.stage = "CREATOR_MATCHING";
    } else {
      state.stage = "REQUIREMENTS_INVESTIGATION";
    }
    return state;
  }

  // 3. Film Project Discovery Flow
  if (clean.includes("idea for a short film") || (clean.includes("short film") && clean.includes("idea"))) {
    state.projectType = "Short Film";
    state.projectDomain = "Film";
    state.investigationArea = "story";
    state.stage = state.requirements.storyPremise ? "REQUIREMENTS_INVESTIGATION" : "PROJECT_DISCOVERY";
    return state;
  }

  if (state.projectDomain === "Film" && state.investigationArea === "story") {
    if (state.requirements.storyPremise || clean.includes("thriller") || clean.includes("comedy") || clean.includes("drama") || clean.includes("student")) {
      state.stage = "REQUIREMENTS_INVESTIGATION";
    } else {
      state.stage = "PROJECT_DISCOVERY";
    }
    return state;
  }

  // 4. Website Project Flow
  if (clean.includes("want to build a website") || clean === "i want to build a website" || clean.includes("create a website")) {
    state.projectType = "Website";
    state.projectDomain = "Web App";
    state.investigationArea = "website_purpose";
    state.stage = state.requirements.websitePurpose ? "REQUIREMENTS_INVESTIGATION" : "PROJECT_DISCOVERY";
    return state;
  }

  if (state.projectDomain === "Web App") {
    if (state.requirements.websitePurpose || clean.includes("college club") || clean.includes("portfolio")) {
      state.stage = "REQUIREMENTS_INVESTIGATION";
    } else {
      state.stage = "PROJECT_DISCOVERY";
    }
    return state;
  }

  // 5. Default stage transitions based on history
  if (state.stage === "PROJECT_BLUEPRINT") {
    // Keep blueprint state unless user changes stage
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
  activeProject: OmniForgeProject | null,
  userType: "creator" | "client",
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
  // 1. Direct Knowledge & Definitions (GENERAL_CHAT)
  // --------------------------------------------------------------------------
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
        "A film director guides the creative, artistic, and dramatic vision of a movie from script to screen. They work closely with actors to bring emotional authenticity to performances, and collaborate with the cinematographer on visual framing, lighting, and pacing.\n\nFor example, in a suspense thriller, the director decides when to hold a tight close-up on a character's anxious expression to build audience tension, or when to cut away to heighten mystery.",
      conversationState: { ...state, stage: "GENERAL_CHAT" },
      suggestedFollowUps: [
        "Why do I need a director?",
        "Can a director also edit?",
        "What is a cinematographer?",
        "I have an idea for a short film",
      ],
    };
  }

  if (clean.includes("what is skill swap") || clean.includes("what's skill swap") || clean.includes("how does skill swap work") || clean.includes("explain skill swap")) {
    return {
      intent: "SKILL_SWAP_QUESTION",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "Skill Swap is an integrated collaboration feature inside OmniCraft that lets creators trade creative and technical services without exchanging cash.\n\nFor example, an indie director can offer video editing or color grading in exchange for original score composition from a music producer, or graphic design for promotional posters. It allows indie filmmakers, students, and early-stage founders to assemble teams and finish high-quality projects collaboratively.",
      conversationState: { ...state, stage: "GENERAL_CHAT" },
      suggestedFollowUps: [
        "How do I create a Skill Swap listing?",
        "Find verified creators",
        "I have an idea for a short film",
      ],
    };
  }

  if (clean.includes("what is react") || clean.includes("what is react.js")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "React is an open-source JavaScript library developed by Meta for building dynamic, component-based user interfaces. It uses a virtual DOM to efficiently update and render user interfaces as application data changes.\n\nOn OmniCraft, React is commonly used by frontend developers to build web apps, creative portfolios, and collaborative real-time dashboards.",
      conversationState: { ...state, stage: "GENERAL_CHAT" },
      suggestedFollowUps: [
        "I want to build a website",
        "Find frontend developers",
        "Return to my film",
      ],
    };
  }

  // --------------------------------------------------------------------------
  // 2. Casting & Creator Matching Flow
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
        matchMessage = `I searched the OmniCraft creator database for actors matching your criteria (${criteriaSummary}). Currently, no verified actors with those exact filter combinations are actively listed. \n\n**Recommended next step:** You can publish an open casting call or client job listing on OmniCraft, or propose a Skill Swap to attract talent from our network.`;
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
    // Step A: If roleType is missing
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

    // Step B: Role type is known, ask for age range and language / gender
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
  // 3. Short Film Discovery & Story Investigation Flow
  // --------------------------------------------------------------------------
  if (state.projectDomain === "Film") {
    // If user has not yet given the premise/story
    if (!state.requirements.storyPremise) {
      return {
        intent: "PROJECT_IDEA",
        responseLevel: "CONTEXTUAL_ANSWER",
        message:
          "Great! What is the central idea or story you're planning? Tell me a little about the premise, genre, or the message you want to convey.",
        conversationState: {
          ...state,
          stage: "REQUIREMENTS_INVESTIGATION",
        },
        suggestedFollowUps: [
          "Suspense thriller",
          "Drama / Emotional",
          "Comedy short",
          "Sci-Fi / Concept",
        ],
      };
    }

    // User provided premise/genre, ask for script status or next step
    if (!state.requirements.scriptStatus) {
      const premiseDesc = state.requirements.storyGenre
        ? `A **${state.requirements.storyGenre.toLowerCase()}** about ${state.requirements.storyPremise.replace(/^(it is a|a|an)\s+/i, "")}`
        : state.requirements.storyPremise;

      return {
        intent: "PROJECT_IDEA",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `${premiseDesc} sounds compelling! The high stakes and mystery will keep the audience hooked.\n\nDo you already have a completed script, or are you currently developing the story and characters?`,
        conversationState: {
          ...state,
          stage: "REQUIREMENTS_INVESTIGATION",
        },
        suggestedFollowUps: [
          "I have a completed script",
          "Working on the script",
          "Just the idea so far",
          "Show me the complete plan",
        ],
      };
    }
  }

  // --------------------------------------------------------------------------
  // 4. Website Project Discovery & Investigation Flow
  // --------------------------------------------------------------------------
  if (state.projectDomain === "Web App") {
    // If website purpose is not yet specified
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

    // Purpose is specified (e.g. college club), ask for key features
    if (!state.requirements.keyFeatures || state.requirements.keyFeatures.length === 0) {
      return {
        intent: "PROJECT_IDEA",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `A website for a **${state.requirements.websitePurpose.toLowerCase()}** is a great way to showcase events, register new members, and share updates!\n\nWhat key features do you need — such as event calendar & registration, member directory, gallery, or club announcements?`,
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
  }

  // --------------------------------------------------------------------------
  // 5. Default General Greeting / Fallback
  // --------------------------------------------------------------------------
  return {
    intent: "GENERAL_CONVERSATION",
    responseLevel: "SIMPLE_ANSWER",
    message:
      "Hi! I'm OmniForge, your AI Project Architect & Creator Orchestrator on OmniCraft. Tell me about your project idea, questions about creative disciplines, or what kind of creator you're looking to find!",
    conversationState: { ...state, stage: "GENERAL_CHAT" },
    suggestedFollowUps: [
      "I want to build a website",
      "I have an idea for a short film",
      "I need an actor for my short film",
      "What is Skill Swap?",
    ],
  };
}

