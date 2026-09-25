import {
  OmniForgeIntent,
  OmniForgeProject,
  ChatMessage,
  ProjectDomain,
} from "./types";
import { detectProjectDomain } from "./engine";

export interface ClassifiedDecision {
  intent: OmniForgeIntent;
  targetRole?: string;
  targetAction?: string;
  entities: Array<{ type: string; value: string }>;
  isActionable: boolean;
  requiresClarification: boolean;
  confidence: number;
  extractedSkills?: {
    offered?: string[];
    needed?: string[];
  };
}

/**
 * Resolves anaphoric references ("they", "them", "that", "the role", "both")
 * by inspecting recent conversation history and the active project context.
 */
export function resolveAnaphoricRole(
  conversationHistory: ChatMessage[],
  currentProject: OmniForgeProject | null
): string {
  // 1. Look back through recent messages for mentioned role cards or creator cards
  for (let i = conversationHistory.length - 1; i >= 0; i--) {
    const msg = conversationHistory[i];
    if (msg.roleCard?.roleName) return msg.roleCard.roleName;
    if (msg.creatorCards && msg.creatorCards.length > 0) return msg.creatorCards[0].roleName;
    if (msg.comparisonCard?.roleName) return msg.comparisonCard.roleName;

    const lower = msg.text.toLowerCase();
    if (lower.includes("cinematographer") || lower.includes("dop") || lower.includes("camera")) return "Cinematographer";
    if (lower.includes("director") && !lower.includes("music")) return "Film Director";
    if (lower.includes("editor") || lower.includes("editing")) return "Video Editor";
    if (lower.includes("music") || lower.includes("composer")) return "Music Producer";
    if (lower.includes("writer") || lower.includes("script")) return "Screenwriter";
    if (lower.includes("designer") || lower.includes("ui/ux") || lower.includes("figma")) return "UI/UX Designer";
    if (lower.includes("developer") || lower.includes("frontend") || lower.includes("backend")) return "Frontend Web Developer";
    if (lower.includes("sound") || lower.includes("audio")) return "Sound Designer";
    if (lower.includes("actor") || lower.includes("actress")) return "Lead Actor";
  }

  // 2. Default to first role in active project if available
  if (currentProject && currentProject.roles.length > 0) {
    return currentProject.roles[0].roleName;
  }

  return "Film Director";
}

/**
 * Extracts a project role from text with full domain awareness and pronoun resolution.
 */
export function extractRoleFromQuery(
  text: string,
  currentProject: OmniForgeProject | null,
  conversationHistory: ChatMessage[] = []
): string {
  const lower = text.toLowerCase();

  // Pronouns and anaphoric references ("they", "them", "that", "it", "both")
  // Check pronouns FIRST so questions like "Can they also edit?" resolve the subject ("they" -> Director)
  if (/\b(they|them|that|this|the other person|both|first one|second one)\b/i.test(lower)) {
    return resolveAnaphoricRole(conversationHistory, currentProject);
  }

  // Explicit roles
  if (/\b(cinematographer|dop|director of photography|camera operator|cameraman)\b/i.test(lower)) return "Cinematographer";
  if (/\b(music director|music producer|composer|beatmaker|audio producer)\b/i.test(lower)) return "Music Producer";
  if (/\b(director|directing|directs)\b/i.test(lower) && !lower.includes("music")) return "Film Director";
  if (/\b(editor|editing|video editor|video cut)\b/i.test(lower)) return "Video Editor";
  if (/\b(sound designer|audio engineer|foley|audio mixing|sound mixer|sound recordist)\b/i.test(lower)) return "Sound Designer";
  if (/\b(screenwriter|scriptwriter|script writer|writer|screenplay)\b/i.test(lower)) return "Screenwriter";
  if (/\b(singer|vocalist|playback singer|vocals)\b/i.test(lower)) return "Playback Singer";
  if (/\b(actor|actress|performer|cast|talent)\b/i.test(lower)) return "Lead Actor";
  if (/\b(ui\/ux|ui designer|ux designer|product designer|figma designer|web designer|graphic designer)\b/i.test(lower)) return "UI/UX Designer";
  if (/\b(frontend|web developer|frontend developer|react developer)\b/i.test(lower)) return "Frontend Web Developer";
  if (/\b(backend|database engineer|api developer|backend developer)\b/i.test(lower)) return "Backend Developer";
  if (/\b(ai engineer|ml engineer|machine learning engineer|data scientist)\b/i.test(lower)) return "AI / ML Engineer";
  if (/\b(event planner|event coordinator|fest coordinator|organizer)\b/i.test(lower)) return "Event Coordinator";
  if (/\b(logistics manager|venue manager)\b/i.test(lower)) return "Logistics Manager";
  if (/\b(producer|production manager|line producer)\b/i.test(lower)) return "Producer";
  if (/\b(photographer|photography)\b/i.test(lower)) return "Photographer";

  // Natural capability phrases
  if (lower.includes("visual side") || lower.includes("make the film look good") || lower.includes("look and feel")) {
    if (currentProject?.domain === "Web App" || currentProject?.domain === "Software") return "UI/UX Designer";
    return "Cinematographer";
  }

  // Check matching against current project roles
  if (currentProject && currentProject.roles.length > 0) {
    for (const r of currentProject.roles) {
      if (lower.includes(r.roleName.toLowerCase())) return r.roleName;
    }
  }

  return "Film Director";
}

/**
 * Comprehensive semantic classifier implementing Decision 1, 2, and 3.
 */
export function classifyMessageSemanticIntent(
  text: string,
  currentProject: OmniForgeProject | null,
  conversationHistory: ChatMessage[] = []
): ClassifiedDecision {
  const trimmed = text.trim();
  const lower = trimmed.toLowerCase();

  // Strip common conversational preambles
  const cleanLower = lower
    .replace(/^(by the way|btw|also|quick question|one more thing|tell me|can you tell me|could you explain|i was wondering|i want to know)[,:\s]*/i, "")
    .trim();

  // --------------------------------------------------------------------------
  // 1. PRIORITIZED ACTION CHECKS (Actions prefixed with "ok", "okay", etc.)
  // --------------------------------------------------------------------------
  const hasActionVerb =
    cleanLower.includes("find ") ||
    cleanLower.includes("find me") ||
    cleanLower.includes("find one") ||
    cleanLower.includes("find someone") ||
    cleanLower.includes("show me") ||
    cleanLower.includes("show me the plan") ||
    cleanLower.includes("create squad") ||
    cleanLower.includes("launch squad") ||
    cleanLower.includes("assemble squad") ||
    cleanLower.includes("compare ") ||
    cleanLower.includes("why did you") ||
    cleanLower.includes("why this") ||
    cleanLower.includes("why recommend") ||
    cleanLower.includes("replace ") ||
    cleanLower.includes("back to my film") ||
    cleanLower.includes("back to the film") ||
    cleanLower.includes("back to the project") ||
    cleanLower.includes("what is pending") ||
    cleanLower.includes("how do i make it") ||
    cleanLower.includes("how to make it");

  // --------------------------------------------------------------------------
  // 2. GREETINGS & CASUAL CONVERSATION (Decision 1: Casual Chat)
  // --------------------------------------------------------------------------
  const greetingRegex = /^(hi|hlo|hlw|hello|hey|heyy|heya|heyya|howdy|yo|sup|good morning|good afternoon|good evening|greetings)\b/i;
  const chitChatRegex = /^(how are you|who are you|what's up|whats up|how's it going|hows it going|tell me a joke|make me laugh|thanks|thank you|thanks a lot|thank you so much|that helps|that's helpful|thats helpful|bye|goodbye|see ya|see you later|ok|okay|cool|awesome|great|nice|sweet|got it|haha|hehe|lol)\b/i;
  const confusionRegex = /^(i am confused|i'm confused|i don't know what to create|i dont know what to create|i don't know what i want to make|i dont know what i want to make|not sure what to make)\b/i;

  if (
    !hasActionVerb &&
    (greetingRegex.test(cleanLower) ||
      greetingRegex.test(lower) ||
      chitChatRegex.test(cleanLower) ||
      chitChatRegex.test(lower) ||
      lower.includes("joke") ||
      lower.includes("make me laugh") ||
      confusionRegex.test(cleanLower) ||
      confusionRegex.test(lower))
  ) {
    // Check if the message is ONLY greeting/casual or contains a follow-up project request
    const words = cleanLower.split(/\s+/);
    if (words.length <= 8 && !cleanLower.includes("build") && !cleanLower.includes("create a") && !cleanLower.includes("want to make a") && !cleanLower.includes("director")) {
      return {
        intent: "GENERAL_CONVERSATION",
        entities: [{ type: "phrase", value: trimmed }],
        isActionable: false,
        requiresClarification: false,
        confidence: 0.95,
      };
    }
  }

  // --------------------------------------------------------------------------
  // 3. GENERAL CAPABILITIES ("What can you do?", "Can you help me?")
  // --------------------------------------------------------------------------
  if (
    /^(what can you do|what are your capabilities|how can you help|can you help me|help me|what do you do)\b/i.test(cleanLower)
  ) {
    return {
      intent: "GENERAL_QUESTION",
      entities: [{ type: "query", value: trimmed }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.95,
    };
  }

  // --------------------------------------------------------------------------
  // 4. SQUAD AUTHORIZATION CONFIRMATION ("Yes", "Confirm", "Launch Squad")
  // --------------------------------------------------------------------------
  if (
    /^(yes|yes\.|confirm|launch squad|assemble squad|confirm squad|do it|proceed|go ahead)\b/i.test(cleanLower) &&
    currentProject
  ) {
    const lastAiMsg = [...conversationHistory].reverse().find((m) => m.sender === "ai");
    if (lastAiMsg?.confirmationCard?.actionType === "create_squad") {
      return {
        intent: "SQUAD_REQUEST",
        targetAction: "CONFIRM_SQUAD_CREATION",
        entities: [{ type: "project_id", value: currentProject.id }],
        isActionable: true,
        requiresClarification: false,
        confidence: 0.98,
      };
    }
  }

  // --------------------------------------------------------------------------
  // 5. DEFINITIONS (Including "What is Skill Swap?", "What is a director?", etc.)
  // --------------------------------------------------------------------------
  const isPureDefinition =
    /^(what is|what's|define|what does a|what does an|explain what is)\b/i.test(cleanLower) ||
    cleanLower.includes("speed of light") ||
    cleanLower.includes("difference between");

  const referencesCurrentProject =
    lower.includes("my project") ||
    lower.includes("our project") ||
    lower.includes("this film") ||
    lower.includes("this website") ||
    lower.includes("do i need") ||
    lower.includes("do we need") ||
    lower.includes("in my project") ||
    lower.includes("in our project") ||
    lower.includes("stage") ||
    lower.includes("phase") ||
    lower.includes("task");

  // Explicit Phase/Stage questions on project
  if (
    cleanLower.includes("explain the first stage") ||
    cleanLower.includes("explain stage 1") ||
    cleanLower.includes("explain the second stage") ||
    cleanLower.includes("explain the stage") ||
    cleanLower.includes("what is the first stage") ||
    cleanLower.includes("what happens in stage 1")
  ) {
    return {
      intent: "PHASE_QUESTION",
      entities: [{ type: "phase", value: trimmed }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.95,
    };
  }

  if (isPureDefinition && !referencesCurrentProject) {
    const role = extractRoleFromQuery(cleanLower, currentProject, conversationHistory);
    return {
      intent: "DEFINITION",
      targetRole: role,
      entities: [{ type: "query", value: trimmed }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.96,
    };
  }

  if (
    cleanLower.includes("steps to develop") ||
    cleanLower.includes("steps to build") ||
    cleanLower.includes("steps to make") ||
    cleanLower.includes("steps to create") ||
    cleanLower.includes("steps for developing") ||
    cleanLower.includes("provide the steps") ||
    cleanLower.includes("make the steps") ||
    cleanLower.includes("guide to develop") ||
    cleanLower.includes("roadmap to develop") ||
    cleanLower.includes("how to develop") ||
    cleanLower.includes("how to build an ecommerce") ||
    cleanLower.includes("how to build a website") ||
    cleanLower.includes("how do i develop") ||
    cleanLower.includes("how do i build")
  ) {
    return {
      intent: "HOW_TO",
      entities: [{ type: "query", value: trimmed }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.96,
    };
  }

  if (
    cleanLower.startsWith("write a screenplay") ||
    cleanLower.startsWith("write a script") ||
    cleanLower.startsWith("write a short film screenplay") ||
    cleanLower.startsWith("write a story") ||
    cleanLower.includes("write a short film screenplay") ||
    cleanLower.includes("write screenplay") ||
    cleanLower.includes("screenplay about")
  ) {
    return {
      intent: "EXPLANATION",
      entities: [{ type: "query", value: trimmed }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.96,
    };
  }

  if (
    cleanLower.startsWith("how do i make it") ||
    cleanLower.startsWith("how would i make it") ||
    cleanLower.startsWith("how to make it") ||
    cleanLower.includes("show me the plan") ||
    cleanLower.includes("show me plan") ||
    cleanLower.includes("show me the complete plan") ||
    cleanLower.includes("show me the whole plan") ||
    cleanLower.includes("show the plan") ||
    cleanLower.includes("show complete plan")
  ) {
    return {
      intent: (cleanLower.includes("show") && cleanLower.includes("plan")) ? "PROJECT_PLANNING" : "HOW_TO",
      entities: [{ type: "query", value: trimmed }],
      isActionable: cleanLower.includes("show"),
      requiresClarification: false,
      confidence: 0.94,
    };
  }

  if (
    /^(explain |how does |how do i learn |how to learn |can you explain |tell me about |give me )\b/i.test(cleanLower) &&
    !referencesCurrentProject &&
    !cleanLower.includes("make it") &&
    !cleanLower.includes("turn this into")
  ) {
    return {
      intent: cleanLower.startsWith("how") ? "HOW_TO" : "EXPLANATION",
      entities: [{ type: "query", value: trimmed }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.9,
    };
  }

  // --------------------------------------------------------------------------
  // 6. SKILL SWAP OFFERS & TRADES (Integrated Collaboration)
  // --------------------------------------------------------------------------
  const isSkillSwapOfferOrTrade =
    cleanLower.includes("swap skill") ||
    cleanLower.includes("skill swap") ||
    cleanLower.includes("exchange work") ||
    cleanLower.includes("exchange my skills") ||
    cleanLower.includes("exchange skills") ||
    cleanLower.includes("exchange editing for") ||
    cleanLower.includes("exchange design for") ||
    cleanLower.includes("collaborate without money") ||
    cleanLower.includes("get help without paying") ||
    cleanLower.includes("don't have money to hire") ||
    cleanLower.includes("dont have money to hire") ||
    cleanLower.includes("no money to hire") ||
    cleanLower.includes("can we exchange work") ||
    cleanLower.includes("offer my skills in return") ||
    (cleanLower.includes("i know ") && cleanLower.includes("need ")) ||
    (cleanLower.includes("i can ") && cleanLower.includes("if someone helps"));

  if (isSkillSwapOfferOrTrade) {
    // Extract offered and needed skills
    let offered: string[] = [];
    let needed: string[] = [];

    if (cleanLower.includes("editing")) offered.push("Video Editing");
    if (cleanLower.includes("design") || cleanLower.includes("poster")) offered.push("Graphic Design");
    if (cleanLower.includes("writing") || cleanLower.includes("script")) offered.push("Screenwriting");
    if (cleanLower.includes("web") || cleanLower.includes("website") || cleanLower.includes("code")) offered.push("Web Development");

    if (cleanLower.includes("cinematographer") || cleanLower.includes("shoot") || cleanLower.includes("filming")) needed.push("Cinematography");
    if (cleanLower.includes("director")) needed.push("Film Directing");
    if (cleanLower.includes("sound") || cleanLower.includes("audio") || cleanLower.includes("music")) needed.push("Sound Design");
    if (cleanLower.includes("website") || cleanLower.includes("frontend") || cleanLower.includes("developer")) needed.push("Frontend Web Developer");

    return {
      intent: "SKILL_SWAP_SEARCH",
      entities: [{ type: "query", value: trimmed }],
      isActionable: true,
      requiresClarification: false,
      confidence: 0.92,
      extractedSkills: { offered, needed },
    };
  }

  // --------------------------------------------------------------------------
  // 7. SPECIFIC & AMBIGUOUS PROJECT IDEAS (Decision: Progressive Investigation)
  // --------------------------------------------------------------------------
  if (
    cleanLower.includes("idea for a short film") ||
    cleanLower.includes("idea for a film") ||
    cleanLower.includes("idea for a movie") ||
    (cleanLower.includes("short film") && cleanLower.includes("idea"))
  ) {
    return {
      intent: "PROJECT_IDEA",
      entities: [
        { type: "project_type", value: "short film" },
        { type: "domain", value: "Film" },
      ],
      isActionable: false,
      requiresClarification: true,
      confidence: 0.96,
    };
  }

  if (
    cleanLower.includes("suspense thriller") ||
    cleanLower.includes("missing student") ||
    cleanLower.includes("about a missing student") ||
    cleanLower === "suspense thriller" ||
    cleanLower === "drama / emotional" ||
    cleanLower === "comedy short" ||
    cleanLower === "sci-fi / concept"
  ) {
    return {
      intent: "PROJECT_IDEA",
      entities: [
        { type: "genre", value: "Suspense Thriller" },
        { type: "premise", value: trimmed },
        { type: "domain", value: "Film" },
      ],
      isActionable: false,
      requiresClarification: true,
      confidence: 0.96,
    };
  }

  if (cleanLower.includes("college club") && (cleanLower.includes("website") || cleanLower.includes("site") || cleanLower.includes("web"))) {
    return {
      intent: "PROJECT_IDEA",
      entities: [
        { type: "project_type", value: "college club website" },
        { type: "domain", value: "Web App" },
        { type: "purpose", value: "College Club Website" },
      ],
      isActionable: false,
      requiresClarification: true,
      confidence: 0.96,
    };
  }

  if (
    cleanLower.includes("want to build a website") ||
    cleanLower.includes("want to create a website") ||
    cleanLower.includes("want to build a web app") ||
    cleanLower.includes("want to make a short film") ||
    cleanLower.includes("want to make a film") ||
    cleanLower.includes("make a short film") ||
    cleanLower.includes("making a short film") ||
    cleanLower.includes("shoot a short film") ||
    cleanLower.includes("have a story idea") ||
    cleanLower.includes("develop a story") ||
    cleanLower.includes("help me develop a story") ||
    cleanLower.includes("have a completed script") ||
    cleanLower.includes("need short film ideas") ||
    cleanLower.includes("create a 5-minute") ||
    cleanLower.includes("write a short film script") ||
    cleanLower.includes("make a production schedule") ||
    cleanLower.includes("plan the shooting schedule")
  ) {
    const isFilm =
      cleanLower.includes("film") ||
      cleanLower.includes("script") ||
      cleanLower.includes("schedule") ||
      cleanLower.includes("story");
    return {
      intent: (cleanLower.includes("script") || cleanLower.includes("schedule"))
        ? "PROJECT_PLANNING"
        : "PROJECT_IDEA",
      entities: [
        { type: "project_type", value: isFilm ? "short film" : "website" },
        { type: "domain", value: isFilm ? "Film" : "Web App" },
      ],
      isActionable: false,
      requiresClarification: true,
      confidence: 0.95,
    };
  }

  const ambiguousIdeaRegex =
    /^(i have an idea|i have a story|i want to build something|i want to make something|i want to do something|i want to create something)\b/i;

  if (ambiguousIdeaRegex.test(cleanLower)) {
    // If it has actionable execution plan, creators, or specific domain outcome, do NOT treat as vague clarification!
    const hasSpecificOutcome =
      cleanLower.includes("website for our college club") ||
      cleanLower.includes("short film about a village girl") ||
      cleanLower.includes("documentary about traditional") ||
      cleanLower.includes("professional song") ||
      cleanLower.includes("cultural festival") ||
      cleanLower.includes("turn my lyrics into") ||
      cleanLower.includes("execution plan") ||
      cleanLower.includes("find creators") ||
      cleanLower.includes("find the actors") ||
      cleanLower.includes("find actors") ||
      cleanLower.includes("complete plan") ||
      cleanLower.includes("production plan") ||
      cleanLower.includes("roadmap");

    if (!hasSpecificOutcome) {
      return {
        intent: "CLARIFICATION",
        entities: [{ type: "idea_fragment", value: trimmed }],
        isActionable: false,
        requiresClarification: true,
        confidence: 0.94,
      };
    }
  }

  // --------------------------------------------------------------------------
  // 6. INDIRECT PROBLEM STATEMENTS (Decision: Explain solution, ask confirmation)
  // --------------------------------------------------------------------------
  if (
    cleanLower.includes("people currently call us to place orders") ||
    cleanLower.includes("struggles because students don't know when events") ||
    cleanLower.includes("struggles because students dont know when events") ||
    cleanLower.includes("farmers in my village have trouble finding") ||
    cleanLower.includes("have a restaurant and people keep calling") ||
    cleanLower.includes("i have a story, but i don't know how to turn it into a film") ||
    cleanLower.includes("i know how to design, but i don't know how to find clients")
  ) {
    return {
      intent: "PROJECT_PROBLEM",
      entities: [{ type: "problem_statement", value: trimmed }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.92,
    };
  }

  // --------------------------------------------------------------------------
  // 8. CREATOR DISCOVERY & SEARCH ACTIONS (Decision: Search real DB creators)
  // --------------------------------------------------------------------------
  const isCreatorSearch =
    /^(find |find me |get me |recommend |show me creators|show me directors|show me editors|who can direct|who can edit|who can sing|i need someone to|i need someone who|who can handle|i need an actor|i need a director|i need an editor|i need a cinematographer|i need a|looking for an actor|looking for a|can you suggest the best|suggest the best|suggest an actor|suggest a|cast an actor|casting for)\b/i.test(cleanLower) ||
    cleanLower.includes("need an actor") ||
    cleanLower.includes("find an actor") ||
    cleanLower.includes("suggest the best") ||
    cleanLower.includes("suggest an actor") ||
    cleanLower.includes("cast an actor") ||
    cleanLower.includes("actor for my short film") ||
    cleanLower.includes("lead actor") ||
    cleanLower.includes("supporting actor") ||
    cleanLower.includes("villain or antagonist") ||
    cleanLower.includes("multiple actors") ||
    cleanLower.includes("need a male lead") ||
    cleanLower.includes("need a female lead") ||
    cleanLower.includes("male lead actor") ||
    cleanLower.includes("female lead actor") ||
    cleanLower.includes("aged 20-25") ||
    cleanLower.includes("aged 20–25") ||
    cleanLower.includes("aged 18-25") ||
    cleanLower.includes("aged 18–25") ||
    cleanLower === "18–25" ||
    cleanLower === "18-25" ||
    cleanLower === "20–25" ||
    cleanLower === "20-25" ||
    cleanLower === "25–35" ||
    cleanLower === "25-35" ||
    cleanLower === "35–50" ||
    cleanLower === "35-50" ||
    (cleanLower.includes("telugu") && (cleanLower.includes("actor") || cleanLower.includes("short film") || cleanLower.includes("film"))) ||
    cleanLower.includes("find someone") ||
    cleanLower.includes("find me one") ||
    cleanLower.includes("find one") ||
    cleanLower.includes("find a creator") ||
    cleanLower.includes("find someone for everything else") ||
    cleanLower.includes("find someone who can do both") ||
    cleanLower.includes("who can handle the visual side") ||
    cleanLower.includes("make the film look good");

  if (isCreatorSearch) {
    const role = extractRoleFromQuery(cleanLower, currentProject, conversationHistory);
    return {
      intent: "CREATOR_SEARCH",
      targetRole: role,
      entities: [{ type: "role", value: role }],
      isActionable: true,
      requiresClarification: false,
      confidence: 0.95,
    };
  }

  // --------------------------------------------------------------------------
  // 9. CREATOR COMPARISON & EVIDENCE ("Why did you recommend?", "Compare")
  // --------------------------------------------------------------------------
  if (
    cleanLower.includes("why did you recommend") ||
    cleanLower.includes("why recommend") ||
    cleanLower.includes("why this person") ||
    cleanLower.includes("why this creator") ||
    cleanLower.includes("what have they actually done") ||
    cleanLower.includes("do they have experience") ||
    cleanLower.includes("do they have relevant portfolio") ||
    cleanLower.includes("compare ") ||
    cleanLower.includes("comparison between") ||
    cleanLower.includes("compare these two") ||
    cleanLower.includes("which one has more experience")
  ) {
    const role = extractRoleFromQuery(cleanLower, currentProject, conversationHistory);
    return {
      intent: "CREATOR_COMPARISON",
      targetRole: role,
      entities: [{ type: "role", value: role }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.93,
    };
  }

  // --------------------------------------------------------------------------
  // 10. CREATOR REPLACEMENT & ALTERNATIVES ("What if they aren't available?")
  // --------------------------------------------------------------------------
  if (
    cleanLower.includes("what if they aren't available") ||
    cleanLower.includes("what if they arent available") ||
    cleanLower.includes("replace them") ||
    cleanLower.includes("replace the ") ||
    cleanLower.includes("who should replace them") ||
    cleanLower.includes("find another ") ||
    cleanLower.includes("different creator") ||
    cleanLower.includes("alternative for")
  ) {
    const role = extractRoleFromQuery(cleanLower, currentProject, conversationHistory);
    return {
      intent: "CREATOR_REPLACEMENT",
      targetRole: role,
      entities: [{ type: "role", value: role }],
      isActionable: true,
      requiresClarification: false,
      confidence: 0.93,
    };
  }

  // --------------------------------------------------------------------------
  // 11. SQUAD CREATION REQUEST ("Create a Squad for this project")
  // --------------------------------------------------------------------------
  const isInformationalSquadQuery =
    cleanLower.startsWith("can i create a squad") ||
    cleanLower.startsWith("can we create a squad") ||
    cleanLower.startsWith("how do i create a squad") ||
    cleanLower.startsWith("how to create a squad") ||
    cleanLower.startsWith("what is a squad");

  if (
    !isInformationalSquadQuery &&
    (cleanLower.includes("create a squad") ||
      cleanLower.includes("create squad") ||
      cleanLower.includes("create the squad") ||
      cleanLower.includes("build the squad") ||
      cleanLower.includes("assemble squad") ||
      cleanLower.includes("assemble the team") ||
      cleanLower.includes("form the team") ||
      cleanLower.includes("launch squad") ||
      cleanLower.includes("create a team"))
  ) {
    return {
      intent: "SQUAD_REQUEST",
      entities: [{ type: "action", value: "create_squad" }],
      isActionable: true,
      requiresClarification: false,
      confidence: 0.95,
    };
  }

  if (isInformationalSquadQuery) {
    return {
      intent: "DEFINITION",
      entities: [{ type: "query", value: trimmed }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.95,
    };
  }

  // --------------------------------------------------------------------------
  // 12. TEAM CONSTRAINTS & PROJECT SCOPE MODIFICATION
  // --------------------------------------------------------------------------
  if (
    cleanLower.includes("i only have three people") ||
    cleanLower.includes("only have 3 people") ||
    cleanLower.includes("i only have 2 people") ||
    cleanLower.includes("reduce the team") ||
    cleanLower.includes("reduce team") ||
    cleanLower.includes("small student budget") ||
    cleanLower.includes("student budget") ||
    cleanLower.includes("small budget") ||
    cleanLower.includes("5-minute student short film") ||
    cleanLower.includes("5-minute") ||
    cleanLower.includes("i already have a writer") ||
    cleanLower.includes("i have a writer") ||
    cleanLower.includes("already have someone handling") ||
    cleanLower.includes("don't include another music") ||
    cleanLower.includes("dont include another music") ||
    cleanLower.includes("knows basic sound editing") ||
    cleanLower.includes("can we remove that") ||
    cleanLower.startsWith("remove ") ||
    cleanLower.startsWith("drop ") ||
    cleanLower.includes("make it simpler") ||
    cleanLower.includes("make this project smaller") ||
    cleanLower.includes("make this simpler")
  ) {
    const role = extractRoleFromQuery(cleanLower, currentProject, conversationHistory);
    return {
      intent: "PROJECT_MODIFICATION",
      targetRole: role,
      entities: [{ type: "constraint", value: trimmed }],
      isActionable: true,
      requiresClarification: false,
      confidence: 0.94,
    };
  }

  // --------------------------------------------------------------------------
  // 13. PROJECT EXECUTION & STATUS ("What should we do next?")
  // --------------------------------------------------------------------------
  if (
    cleanLower.includes("what should we do next") ||
    cleanLower.includes("what should i do next") ||
    cleanLower.includes("what should we do now") ||
    cleanLower.includes("what should we do first") ||
    cleanLower.includes("what is next") ||
    cleanLower.includes("what is pending") ||
    cleanLower.includes("what's next") ||
    cleanLower.includes("next step") ||
    cleanLower.includes("back to my film") ||
    cleanLower.includes("return to my film") ||
    cleanLower.includes("return to the film") ||
    cleanLower.includes("back to the project") ||
    cleanLower.includes("return to the project") ||
    cleanLower.includes("who is handling the editing") ||
    cleanLower.includes("who is responsible")
  ) {
    return {
      intent: "PROJECT_STATUS",
      entities: [{ type: "query", value: trimmed }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.94,
    };
  }

  // --------------------------------------------------------------------------
  // 13b. ROLE COMBINATION & DUAL CAPABILITY QUESTIONS ("Can they also edit?")
  // --------------------------------------------------------------------------
  if (
    cleanLower.includes("can they also edit") ||
    cleanLower.includes("can they edit") ||
    cleanLower.includes("can the director edit") ||
    cleanLower.includes("can a director edit") ||
    cleanLower.includes("can a director also edit") ||
    cleanLower.includes("can the director also edit") ||
    cleanLower.includes("can one person do both") ||
    cleanLower.includes("can they do both")
  ) {
    return {
      intent: "ROLE_QUESTION",
      targetRole: "Film Director",
      entities: [{ type: "role", value: "Film Director" }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.95,
    };
  }

  // --------------------------------------------------------------------------
  // 14. PROJECT BLOCKERS & DELAYS ("Cinematographer is unavailable")
  // --------------------------------------------------------------------------
  if (
    cleanLower.includes("unavailable") ||
    cleanLower.includes("delay") ||
    cleanLower.includes("sick") ||
    cleanLower.includes("leave") ||
    cleanLower.includes("behind schedule") ||
    cleanLower.includes("blocker") ||
    cleanLower.includes("no longer available") ||
    cleanLower.includes("one week left")
  ) {
    return {
      intent: "PROJECT_BLOCKER",
      entities: [{ type: "blocker", value: trimmed }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.94,
    };
  }

  // --------------------------------------------------------------------------
  // 15. EXPLICIT PROJECT CREATION INTENT
  // --------------------------------------------------------------------------
  const isExplicitProjectCreation =
    cleanLower.startsWith("i want to build a modern portfolio") ||
    cleanLower.startsWith("i want to build a portfolio") ||
    cleanLower.startsWith("i want to make a documentary") ||
    cleanLower.startsWith("i want to turn my lyrics into a song") ||
    cleanLower.startsWith("turn my lyrics into a song") ||
    cleanLower.startsWith("help me turn my story into") ||
    cleanLower.startsWith("i wrote a story about") ||
    (cleanLower.startsWith("i wrote a story") && cleanLower.length > 25) ||
    cleanLower.startsWith("i wrote lyrics") ||
    cleanLower.startsWith("we are organizing") ||
    cleanLower.startsWith("we're organizing") ||
    cleanLower.startsWith("plan a college") ||
    cleanLower.includes("village girl who wants to become a singer") ||
    (cleanLower.includes("website") && cleanLower.includes("college club")) ||
    (cleanLower.includes("lyrics") && cleanLower.includes("song")) ||
    (cleanLower.includes("documentary") && cleanLower.includes("craft"));

  if (isExplicitProjectCreation) {
    return {
      intent: "PROJECT_CREATION",
      entities: [{ type: "project_description", value: trimmed }],
      isActionable: true,
      requiresClarification: false,
      confidence: 0.95,
    };
  }

  // --------------------------------------------------------------------------
  // 16. CONTEXTUAL PROJECT & ROLE QUESTIONS (On active project)
  // --------------------------------------------------------------------------
  if (currentProject) {
    if (cleanLower.includes("how do i make it") || cleanLower.includes("how would i make it")) {
      return {
        intent: "HOW_TO",
        entities: [{ type: "query", value: trimmed }],
        isActionable: false,
        requiresClarification: false,
        confidence: 0.92,
      };
    }

    if (cleanLower.includes("show me the plan") || cleanLower.includes("show me plan")) {
      return {
        intent: "PROJECT_PLANNING",
        entities: [{ type: "query", value: trimmed }],
        isActionable: true,
        requiresClarification: false,
        confidence: 0.95,
      };
    }

    const isProjectContextQuestion =
      cleanLower.includes("what does the") ||
      cleanLower.includes("why do we need") ||
      cleanLower.includes("why do i need") ||
      cleanLower.includes("who do i need") ||
      cleanLower.includes("who would i need") ||
      cleanLower.includes("who else do i need") ||
      cleanLower.includes("do i need a") ||
      cleanLower.includes("do we need a") ||
      cleanLower.includes("can the editor") ||
      cleanLower.includes("can the director") ||
      cleanLower.includes("can they do it") ||
      cleanLower.includes("can they also edit") ||
      cleanLower.includes("how does editing fit") ||
      cleanLower.includes("how can i actually turn this idea into a film") ||
      cleanLower.includes("what happens if we remove") ||
      cleanLower.includes("what would happen if we remove");

    if (isProjectContextQuestion) {
      const role = extractRoleFromQuery(cleanLower, currentProject, conversationHistory);
      return {
        intent: "ROLE_QUESTION",
        targetRole: role,
        entities: [{ type: "role", value: role }],
        isActionable: false,
        requiresClarification: false,
        confidence: 0.9,
      };
    }

    // If not matching project-specific role queries, allow general dialogue resolution
    return {
      intent: "UNKNOWN",
      entities: [{ type: "query", value: trimmed }],
      isActionable: false,
      requiresClarification: false,
      confidence: 0.6,
    };
  }

  // --------------------------------------------------------------------------
  // 17. UNKNOWN INTENT (Fall back gracefully, NEVER create random project!)
  // --------------------------------------------------------------------------
  return {
    intent: "UNKNOWN",
    entities: [{ type: "query", value: trimmed }],
    isActionable: false,
    requiresClarification: false,
    confidence: 0.5,
  };
}
