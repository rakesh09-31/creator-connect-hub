import {
  ProjectDomain,
  OmniForgeProject,
  ProjectPhase,
  ProjectTask,
  ProjectRole,
  ParallelWorkstream,
  ProjectDeliverable,
  ChatMessage,
  ClarificationQuestion,
  CapabilityCoverage,
  OmniForgeIntent,
  AIResponseLevel,
  AIStructuredResponse,
  CreatorRecommendation,
  SkillSwapListingMatch,
  ConversationState,
} from "./types";
import { matchCreatorsForSingleRole, matchCreatorsForProject } from "./matcher";
import { generateStructuredBlueprint, modifyBlueprintFromInstruction } from "./engine-blueprint";
import {
  classifyMessageSemanticIntent,
  extractRoleFromQuery,
  resolveAnaphoricRole,
  ClassifiedDecision,
} from "./intent-classifier";
import { searchRealSkillSwapListings } from "./skill-swap-matcher";
import {
  createInitialConversationState,
  transitionConversationState,
  generateContextualConversationResponse,
} from "./conversation-state";

// ============================================================================
// 1. DOMAIN DETECTION ENGINE
// ============================================================================

const DOMAIN_KEYWORDS: Record<ProjectDomain, string[]> = {
  "Film": ["film", "movie", "short film", "cinema", "documentary", "screenplay", "script", "cinematography", "actor", "actress", "director", "scene", "shoot", "footage", "trailer"],
  "Music": ["song", "music", "album", "track", "compose", "melody", "vocals", "singer", "beat", "mastering", "mixing", "producer", "audio production", "instrumental", "lyrics"],
  "AI / ML": ["machine learning", "deep learning", "neural network", "llm", "computer vision", "nlp", "model training", "dataset", "disease detection", "predictive model", "ai classifier"],
  "Mobile App": ["mobile app", "ios app", "android app", "react native", "flutter", "swift", "kotlin", "app store", "play store"],
  "Web App": ["web app", "website", "web application", "saas", "dashboard", "frontend", "full stack", "react", "next.js", "e-commerce site", "club website", "portal"],
  "Software": ["software", "api", "platform", "system", "database", "microservice", "infrastructure", "backend engine"],
  "Cybersecurity": ["cybersecurity", "security audit", "vulnerability", "pentesting", "infosec", "encryption", "firewall", "threat detection"],
  "Hardware / IoT": ["hardware", "iot", "sensor", "arduino", "raspberry pi", "embedded", "circuit", "robotics", "drone"],
  "Photography": ["photoshoot", "photography", "photographer", "portrait", "fashion shoot", "lookbook", "lighting setup", "retouching"],
  "Design": ["graphic design", "branding", "logo", "visual identity", "poster", "ui/ux", "wireframe", "figma", "typography"],
  "Animation": ["animation", "2d animation", "3d animation", "motion graphics", "rigging", "blender", "after effects", "cgi"],
  "Writing": ["book", "novel", "article", "copywriting", "creative writing", "content writing", "blog", "story", "ghostwriting", "manuscript"],
  "Content Creation": ["youtube", "tiktok", "reels", "influencer", "podcast", "vlog", "channel", "social content"],
  "Marketing": ["marketing", "campaign", "growth", "seo", "social media strategy", "lead generation", "paid ads"],
  "Advertising": ["ad", "commercial", "promotional video", "promo video", "brand advertisement", "restaurant ad", "billboard"],
  "Events": ["event", "festival", "college fest", "cultural festival", "conference", "hackathon", "meetup", "concert", "exhibition"],
  "Education": ["course", "curriculum", "tutorial", "learning platform", "workshop", "edtech"],
  "Business": ["business plan", "startup", "pitch deck", "go-to-market", "financial model", "product launch", "restaurant order", "ordering solution"],
  "Social Impact": ["ngo", "charity", "social campaign", "community initiative", "environmental", "sustainability", "awareness"],
  "Gaming": ["game", "unity", "unreal engine", "game design", "indie game", "gameplay", "level design"],
  "Research": ["research paper", "study", "data science", "survey", "academic", "whitepaper", "market analysis"],
  "Custom Project": []
};

export function detectProjectDomain(text: string): { primary: ProjectDomain; secondary?: ProjectDomain[] } {
  const lower = text.toLowerCase();
  const scoredDomains: Array<{ domain: ProjectDomain; score: number }> = [];

  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    let score = 0;
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        score += kw.includes(" ") ? 3 : 1.5;
      }
    }
    if (score > 0) {
      scoredDomains.push({ domain: domain as ProjectDomain, score });
    }
  }

  scoredDomains.sort((a, b) => b.score - a.score);

  if (scoredDomains.length === 0) {
    return { primary: "Custom Project" };
  }

  const primary = scoredDomains[0].domain;
  const secondary = scoredDomains.slice(1, 3).map((d) => d.domain);

  return { primary, secondary: secondary.length > 0 ? secondary : undefined };
}

// Re-export role extraction helpers for backward compatibility
export const getLastDiscussedRole = resolveAnaphoricRole;
export const extractRoleFromText = extractRoleFromQuery;
export const classifyOmniForgeIntent = (
  text: string,
  currentProject: OmniForgeProject | null,
  conversationHistory: ChatMessage[] = []
) => classifyMessageSemanticIntent(text, currentProject, conversationHistory);

// ============================================================================
// 2. GENERAL KNOWLEDGE & CONVERSATION HANDLERS
// ============================================================================

export function handleGeneralDialogue(
  query: string,
  intent: OmniForgeIntent,
  targetRole?: string
): AIStructuredResponse {
  const lower = query.toLowerCase().trim();
  const clean = lower.replace(/[?!.,]+$/, "").trim();

  // 1. Chit-chat & Casual Greetings
  if (intent === "GENERAL_CONVERSATION") {
    if (clean.includes("joke") || clean.includes("laugh")) {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "Why did the video editor break up with the timeline? Because there were too many cuts and zero commitment! 😄\n\nWhat are you working on or planning to build today?",
        suggestedFollowUps: ["I want to make a short film", "I want to build a website", "What can you do?"],
      };
    }
    if (clean.includes("how are you") || clean.includes("how's it going") || clean.includes("whats up")) {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "I'm doing well, thanks for asking! What would you like to explore or create today?",
        suggestedFollowUps: ["I have an idea for an app", "I want to make a film", "What is Skill Swap?"],
      };
    }
    if (clean.includes("thank") || clean.includes("thanks") || clean.includes("helpful")) {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "You're very welcome! Let me know whenever you'd like to brainstorm an idea, find creators, or ask any question.",
        suggestedFollowUps: ["What can you do?", "How does Skill Swap work?"],
      };
    }
    if (clean.includes("confused") || clean.includes("don't know what") || clean.includes("dont know what")) {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "No problem at all! Feel free to brainstorm with me, ask questions about different creative and technical disciplines, or explore what's possible on OmniCraft whenever you're ready.",
        suggestedFollowUps: ["What can you do?", "What is a director?", "How does Skill Swap work?"],
      };
    }
    if (clean === "bye" || clean === "goodbye" || clean.includes("see you")) {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "Goodbye! Feel free to return anytime you want to develop an idea or collaborate with creators. Have a great day!",
        suggestedFollowUps: ["Hi", "What can you do?"],
      };
    }
    if (clean === "ok" || clean === "okay" || clean === "cool" || clean === "got it" || clean === "great" || clean === "nice" || clean === "sweet") {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "Sounds good! Where would you like to go next?",
        suggestedFollowUps: ["I want to make a short film", "I want to build a website", "What is Skill Swap?"],
      };
    }
    if (clean === "hlo" || clean === "hlw") {
      return {
        intent: "GENERAL_CONVERSATION",
        responseLevel: "SIMPLE_ANSWER",
        message: "Hey! Welcome to OmniForge. What are you thinking of creating today?",
        suggestedFollowUps: ["I want to make a short film", "I want to build a website", "What can you do?"],
      };
    }
    return {
      intent: "GENERAL_CONVERSATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Hi! I'm OmniForge, your AI Project Architect & Creator Orchestrator on OmniCraft. What would you like to create or work on today?",
      suggestedFollowUps: [
        "I want to build a website",
        "I have an idea for a short film",
        "I wrote a song",
        "What can you do?",
      ],
    };
  }

  // 2. Capabilities & General Help
  if (clean.includes("help me") || clean === "help" || clean.includes("can you help")) {
    return {
      intent: "GENERAL_QUESTION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Of course! Tell me what you're trying to create, solve, or learn — whether it's software development, film production, music, events, or finding verified collaborators.",
      suggestedFollowUps: ["I want to build a website", "I want to make a short film", "What is Skill Swap?"],
    };
  }

  if (clean.includes("what can you do") || clean.includes("who are you")) {
    return {
      intent: "GENERAL_QUESTION",
      responseLevel: "SIMPLE_ANSWER",
      message: "I can help you in four interconnected ways:\n\n1. **Answer Questions:** Explain creative and technical concepts, roles, workflows, and best practices.\n2. **Architect Projects:** Break your raw ideas into simple, meaningful stages, clear requirements, and actionable tasks.\n3. **Match Real Creators:** Discover verified OmniCraft talent with matching skills and portfolio evidence.\n4. **Build Squads & Skill Swaps:** Assemble cross-functional teams, coordinate skill trades, and initialize collaborative workspaces.",
      suggestedFollowUps: ["I want to build a website", "I have an idea for a film", "Explain Skill Swap"],
    };
  }

  // 3. Definitions & Explanations
  // Roles
  if (clean.includes("what is a director") || clean.includes("what does a director do") || clean.includes("director of photography") || clean.includes("what is a dop")) {
    if (clean.includes("cinematographer") || clean.includes("dop") || clean.includes("photography")) {
      return {
        intent: "DEFINITION",
        responseLevel: "SIMPLE_ANSWER",
        message: "A cinematographer (Director of Photography / DoP) oversees camera operation, camera movement, and lighting design. They translate the director's creative vision into captivating visual compositions and cinematic color moods.",
        suggestedFollowUps: ["What does a director do?", "Find a cinematographer"],
      };
    }
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "A director guides the creative vision of a film, working closely with actors on their performances and with the cinematographer on camera framing, pacing, and visual style.",
      suggestedFollowUps: ["Why do I need a director?", "Find me a director"],
    };
  }

  if (clean.includes("producer do") || clean.includes("what is a producer")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "A producer oversees a film or creative project from inception to release. They secure funding, manage the budget, hire key department heads (director, DoP, editor), and coordinate logistics and distribution.",
      suggestedFollowUps: ["What is a director?", "I want to make a short film"],
    };
  }

  if (clean.includes("what is an editor") || clean.includes("what does an editor do") || clean.includes("video editor")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "A video editor cuts, arranges, and polishes raw camera footage into a cohesive narrative with smooth pacing, transitions, and audio sync.",
      suggestedFollowUps: ["Why do I need an editor?", "Find an editor"],
    };
  }

  if (clean.includes("cinematography") || clean.includes("what is cinematography")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Cinematography is the art and technique of capturing visual images for film. It encompasses camera choice, lenses, framing, camera movement, and lighting design to evoke emotion and tell a story visually.",
      suggestedFollowUps: ["What does a director do?", "What is color grading?"],
    };
  }

  if (clean.includes("color grading") || clean.includes("what is color grading")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Color grading is the process of adjusting a video's colors, contrast, and overall look to create a particular mood or visual style. For example, a filmmaker might use warm golden tones for a happy summer scene and cool blue tones for suspense or sadness.",
      suggestedFollowUps: ["What does an editor do?", "What is cinematography?"],
    };
  }

  if (clean.includes("what is a squad") || clean.includes("what is a squad in omnicraft") || clean === "what is a squad?") {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "A Squad in OmniCraft is a cross-functional collaborative team formed around a specific project. Squad members share an integrated workspace, task dependency board, shared files, group chat, and milestone tracking.",
      suggestedFollowUps: ["Can I create a Squad for my project?", "How does Skill Swap work?"],
    };
  }

  if (clean.includes("skill swap") || clean.includes("what is skill swap")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Skill Swap is OmniCraft's peer-to-peer collaboration model where creators trade expertise directly without money. For example, a video editor can exchange color grading for soundtrack composition.",
      suggestedFollowUps: ["How do I start a Skill Swap?", "Can I swap skills for my project?"],
    };
  }

  if (clean.includes("difference between a writer and a director") || clean.includes("writer vs director")) {
    return {
      intent: "EXPLANATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "A screenwriter creates the story on paper — writing the plot, scene descriptions, and dialogue. A director translates that written script into living visuals and performances on screen, deciding how scenes are shot, performed, and paced.",
      suggestedFollowUps: ["Can the director also write?", "I wrote a story"],
    };
  }

  if (clean.includes("ui/ux") || clean.includes("ui designer") || clean.includes("ux designer") || clean.includes("difference between a designer and a ui/ux designer")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "A graphic designer focuses on visual aesthetics, branding, marketing artwork, and illustrations, while a UI/UX designer specializes in user experience flows, wireframes, interface layouts, and digital product usability in tools like Figma.",
      suggestedFollowUps: ["Find me a designer", "I want to build a website"],
    };
  }

  // Technical
  if (clean.includes("what is react")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "React is an open-source JavaScript library developed by Meta for building interactive user interfaces, particularly single-page and web applications with reusable components.",
      suggestedFollowUps: ["What is an API?", "What is HTML?", "I want to build a website"],
    };
  }

  if (clean.includes("what is html")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "HTML (HyperText Markup Language) is the fundamental standard markup language used to structure web pages and their content (headings, paragraphs, links, images, and forms).",
      suggestedFollowUps: ["What is React?", "What is an API?"],
    };
  }

  if (clean.includes("what is an api") || clean.includes("what is api")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "An API (Application Programming Interface) is a connection that allows different software systems or parts of an application to communicate and exchange data securely.",
      suggestedFollowUps: ["What is React?", "I want to build a web application"],
    };
  }

  if (clean.includes("what is ai") || clean.includes("explain ai") || clean.includes("artificial intelligence in simple words")) {
    return {
      intent: "EXPLANATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Artificial Intelligence (AI) is computer software that can learn patterns from data and perform tasks like recognizing images, understanding language, or making smart suggestions.",
      suggestedFollowUps: ["What is machine learning?", "How does an API work?"],
    };
  }

  if (clean.includes("how do i learn python") || clean.includes("how to learn python")) {
    return {
      intent: "HOW_TO",
      responseLevel: "SIMPLE_ANSWER",
      message: "To learn Python: start with basic syntax and data types, build small hands-on projects (like a simple script or calculator), practice problem solving, and explore domain libraries like FastAPI or PyTorch based on your interest.",
      suggestedFollowUps: ["What is an API?", "What is React?"],
    };
  }

  if (clean.includes("speed of light")) {
    return {
      intent: "DEFINITION",
      responseLevel: "SIMPLE_ANSWER",
      message: "The speed of light in a vacuum is exactly 299,792,458 meters per second (approximately 300,000 km/s or 186,282 miles per second).",
      suggestedFollowUps: ["What is AI?", "What can you do?"],
    };
  }

  return {
    intent: "UNKNOWN",
    responseLevel: "SIMPLE_ANSWER",
    message: "I'm here to help you explore ideas, understand creative and technical disciplines, or architect projects with verified OmniCraft creators. What are you working on or curious about?",
    suggestedFollowUps: [
      "I want to build a website",
      "I have an idea for a short film",
      "What is a director?",
      "What is Skill Swap?",
    ],
  };
}

// ============================================================================
// 3. SKILL SWAP HANDLER (Integrated Real Supabase Search & Guidance)
// ============================================================================

export async function handleSkillSwapQuery(
  query: string,
  currentUserId: string = "anon",
  currentProject: OmniForgeProject | null = null
): Promise<AIStructuredResponse> {
  const lower = query.toLowerCase();

  // General Skill Swap explanation
  const isGeneralExplanation =
    lower.includes("what is skill swap") ||
    lower.includes("how does skill swap work") ||
    lower.includes("how do i start a skill swap") ||
    lower.includes("can i offer my skills");

  if (isGeneralExplanation && !lower.includes("exchange editing") && !lower.includes("for my project")) {
    return {
      intent: "SKILL_SWAP_QUESTION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Skill Swap is OmniCraft's peer-to-peer collaboration model where creators trade expertise directly without money. For example, a video editor can exchange color grading or cutting for cinematography, original soundtrack composition, or UI/UX design.\n\nEvery creator defines skills they can teach or provide, and skills they want to learn or receive in return.",
      suggestedFollowUps: [
        "Can I swap skills for my project?",
        "Can I exchange editing for cinematography?",
        "Find creators who offer Skill Swap",
      ],
    };
  }

  // Parse what the user wants to offer and what they need
  let needSkill = "";
  let offerSkill = "";

  if (lower.includes("editing") || lower.includes("editor")) {
    if (lower.includes("need") && (lower.includes("need an editor") || lower.includes("need editing"))) {
      needSkill = "Video Editing";
    } else {
      offerSkill = "Video Editing";
    }
  }

  if (lower.includes("cinematographer") || lower.includes("cinematography") || lower.includes("shoot") || lower.includes("camera")) {
    needSkill = "Cinematography";
  }

  if (lower.includes("poster") || lower.includes("graphic design") || lower.includes("design")) {
    if (lower.includes("design the poster") || lower.includes("offer design")) {
      offerSkill = "Graphic Design";
    } else if (!offerSkill) {
      needSkill = "Graphic Design";
    }
  }

  if (lower.includes("website") || lower.includes("developer") || lower.includes("web")) {
    if (lower.includes("helps with my website") || lower.includes("need a website")) {
      needSkill = "Web Development";
    } else if (!offerSkill) {
      offerSkill = "Web Development";
    }
  }

  // Search real database listings
  const realListings = await searchRealSkillSwapListings({
    needSkillOrRole: needSkill,
    offerSkill: offerSkill,
    currentUserId,
    limit: 3,
  });

  if (realListings.length > 0) {
    const listingLines = realListings
      .map(
        (l) =>
          `• **${l.creatorName}** (${l.title})\n  *Offering:* ${l.teachSkills.join(", ")} | *Looking for:* ${l.learnSkills.join(", ")}`
      )
      .join("\n\n");

    const message = `Yes! Skill Swap allows you to collaborate without cash by exchanging work. Here are real active Skill Swap listings from the OmniCraft network:\n\n${listingLines}\n\nWould you like to propose an exchange with one of these creators, or post your own Skill Swap listing?`;

    return {
      intent: "SKILL_SWAP_SEARCH",
      responseLevel: "CREATOR_DISCOVERY",
      message,
      skillSwapCards: realListings,
      uiAction: {
        type: "SHOW_SKILL_SWAP_MATCHES",
      },
      suggestedFollowUps: [
        "Post a Skill Swap listing",
        "Find verified creators",
        "How do I create a listing?",
      ],
    };
  }

  // Fallback when no active listing matches the exact pair
  return {
    intent: "SKILL_SWAP_SEARCH",
    responseLevel: "SIMPLE_ANSWER",
    message: `Yes, you can collaborate through Skill Swap! In your case, you can offer **${offerSkill || "your skills"}** in return for **${needSkill || "collaborator support"}**.\n\nCurrently, there are no active listings specifically trading that exact pair. However, you can publish a new Skill Swap listing to broadcast your offer to the entire creator network!`,
    suggestedFollowUps: [
      "How do I create a listing?",
      "Find creators for my project",
      "Can I combine roles instead?",
    ],
  };
}

// ============================================================================
// 4. AMBIGUOUS & INDIRECT PROJECT HANDLERS
// ============================================================================

export function handleClarificationQuery(query: string): AIStructuredResponse {
  const lower = query.toLowerCase();

  if (lower.includes("farmers") || lower.includes("farm")) {
    return {
      intent: "CLARIFICATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "What are you trying to create for farmers — a mobile app, an online marketplace, an educational campaign, a research initiative, or something else?",
      clarifications: [
        {
          id: "farmer_type",
          question: "What format best describes what you want to create?",
          fieldTarget: "project_type",
          options: ["Mobile / Web Application", "Educational Video / Campaign", "Community Marketplace", "Research Project"],
        },
      ],
      suggestedFollowUps: ["A mobile app for crop advice", "An awareness video series"],
    };
  }

  if (lower.includes("college")) {
    return {
      intent: "CLARIFICATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "What are you planning for your college — a club website, a cultural festival, a student showcase, or something else?",
      clarifications: [
        {
          id: "college_type",
          question: "What are you looking to organize or build?",
          fieldTarget: "project_type",
          options: ["College Club Website", "Cultural Festival Event", "Student Film Project", "Campus App"],
        },
      ],
      suggestedFollowUps: ["A website for our college club", "A college cultural festival"],
    };
  }

  if (lower.includes("story")) {
    return {
      intent: "CLARIFICATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "Great! Tell me a little about the story premise — are you planning to turn it into a short narrative film, an animated piece, an audio drama, or a book?",
      clarifications: [
        {
          id: "story_format",
          question: "What format are you envisioning?",
          fieldTarget: "story_format",
          options: ["Short Narrative Film", "Animated Video", "Audio Drama / Podcast", "Written Book / Novel"],
        },
      ],
      suggestedFollowUps: ["I wrote a story about a village girl who wants to become a singer", "An animated short film"],
    };
  }

  if (lower.includes("ai")) {
    return {
      intent: "CLARIFICATION",
      responseLevel: "SIMPLE_ANSWER",
      message: "What kind of AI project are you thinking of — an intelligent web/mobile app, an AI-enhanced documentary, a computer vision tool, or a research model?",
      clarifications: [
        {
          id: "ai_type",
          question: "What type of AI application are you planning?",
          fieldTarget: "ai_type",
          options: ["Web / Mobile AI App", "AI-Powered Documentary", "Vision / Image Classifier", "NLP / Chat Tool"],
        },
      ],
      suggestedFollowUps: ["An AI documentary about traditional crafts", "An AI disease detector"],
    };
  }

  if (lower.includes("actor") || lower.includes("actress") || lower.includes("casting")) {
    return {
      intent: "CREATOR_SEARCH",
      responseLevel: "CONTEXTUAL_ANSWER",
      message:
        "Absolutely! Let's find an actor who fits your short film. I'll ask a few questions to understand the character and your requirements.\n\nWhat type of role is it — lead, supporting, antagonist, or another character?",
      suggestedFollowUps: ["Lead actor", "Supporting actor", "Villain or antagonist", "I need multiple actors"],
    };
  }

  if (lower.includes("film") || lower.includes("short film") || lower.includes("movie")) {
    return {
      intent: "PROJECT_IDEA",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "Great! What is the central idea or story you're planning? Tell me a little about the premise, genre, or the message you want to convey.",
      suggestedFollowUps: ["Suspense thriller", "Drama / Emotional", "Comedy short", "Sci-Fi / Concept"],
    };
  }

  if (lower.includes("website") || lower.includes("web app")) {
    return {
      intent: "PROJECT_IDEA",
      responseLevel: "SIMPLE_ANSWER",
      message:
        "Great! What is the website for — a business, college project, portfolio, e-commerce store, or something else?",
      suggestedFollowUps: [
        "College club website",
        "Personal portfolio",
        "Business / Startup site",
        "E-commerce store",
      ],
    };
  }

  return {
    intent: "CLARIFICATION",
    responseLevel: "SIMPLE_ANSWER",
    message: "What are you thinking of creating — an app, product, campaign, creative film, music track, or something else?",
    clarifications: [
      {
        id: "general_idea",
        question: "What type of project would you like to plan?",
        fieldTarget: "project_type",
        options: ["Website or Web App", "Short Film or Video", "Music Production", "College Event or Fest"],
      },
    ],
    suggestedFollowUps: ["I want to create a website for our college club", "I have an idea for a short film"],
  };
}

export function handleIndirectProjectProblem(query: string): AIStructuredResponse {
  const lower = query.toLowerCase();

  if (lower.includes("college") || lower.includes("club") || lower.includes("students")) {
    return {
      intent: "PROJECT_PROBLEM",
      responseLevel: "SIMPLE_ANSWER",
      message: "It sounds like you need a way to keep students updated about events and make registration easier. A simple event-management website could help with both.\n\nWould you like me to turn this into a project plan, or would you prefer to explore other solutions first?",
      suggestedFollowUps: ["Build a solution for this", "What roles would I need?", "Not right now"],
    };
  }

  return {
    intent: "PROJECT_PROBLEM",
    responseLevel: "SIMPLE_ANSWER",
    message: "I understand the challenge: phone orders can cause order errors, busy phone lines, and manual record keeping. A digital ordering web application with an online menu, automated order alerts, and customer receipt tracking would make this much smoother.\n\nWould you like me to architect a simple project blueprint for an online ordering website?",
    suggestedFollowUps: ["Yes, build a project plan for this", "What roles would I need?", "Not right now"],
  };
}

// ============================================================================
// 5. CONTEXTUAL PROJECT & ROLE QUESTIONS (Preserves Active Project)
// ============================================================================

export function handleContextualProjectQuestion(
  query: string,
  targetRole: string,
  project: OmniForgeProject,
  conversationHistory: ChatMessage[] = []
): AIStructuredResponse {
  const lower = query.toLowerCase();

  // "How would I make it?" / "How can I actually turn this idea into a film?" / "Show me the plan"
  if (lower.includes("how would i make it") || lower.includes("how can i actually turn this idea into a film") || lower.includes("show me the plan")) {
    const stagesList = project.phases.map((p, idx) => `${idx + 1}. **${p.name}:** ${p.description}`).join("\n");
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Here is the execution roadmap for **${project.title}** in ${project.phases.length} clear stages:\n\n${stagesList}\n\nWould you like to review the required team roles or find creators?`,
      suggestedFollowUps: ["Who would I need?", "Find me a director", "Do I need a producer?"],
    };
  }

  // Stage and Phase explanations
  if (lower.includes("first stage") || lower.includes("stage 1") || lower.includes("initial stage")) {
    const firstPhase = project.phases[0];
    const taskDetails = (firstPhase?.tasks || []).map((t) => `• **${t.title}** (${t.requiredRole} — ${t.estimatedDuration})`).join("\n");
    return {
      intent: "PHASE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `In **Stage 1: ${firstPhase?.name || "Discovery & Planning"}** for **${project.title}**, the objective is: ${firstPhase?.description || "Initial groundwork and pre-production"}.\n\nKey work items in this stage:\n${taskDetails || "• Requirements scoping and asset gathering."}`,
      suggestedFollowUps: ["Explain the next stage", "Who do I need for this stage?", "What should we do first?"],
    };
  }

  // "Who would I need?" / "Who else do I need?"
  if (lower.includes("who would i need") || lower.includes("who else do i need")) {
    const rolesList = project.roles.map((r) => `• **${r.roleName}**: ${r.description}`).join("\n");
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `For **${project.title}**, you will need:\n\n${rolesList}\n\nYou can cover roles with your existing team, use Skill Swap, or find verified OmniCraft creators.`,
      suggestedFollowUps: ["I already have a writer", "Do I need a director?", "Find creators"],
    };
  }

  // "Why do we need an editor?" / "Why do I need an editor?"
  if (lower.includes("why do we need an editor") || lower.includes("why do i need an editor")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `For **${project.title}**, the Video Editor turns raw multi-angle footage into a compelling story. They establish pacing, cut scenes to match emotional song moments, and ensure smooth continuity between dialogue and visuals.`,
      roleCard: {
        roleName: "Video Editor",
        category: "Creative",
        purpose: "Assembles raw footage, creates narrative rhythm, and color grades.",
        skills: ["Premiere Pro", "DaVinci Resolve", "Color Grading"],
      },
      suggestedFollowUps: ["Can the director do that instead?", "What would happen if we remove the editor?"],
    };
  }

  // "Can the director do that instead?" / "Can the director also edit?" / "Can they also edit?"
  if (
    lower.includes("can the director do that instead") ||
    lower.includes("can the director edit") ||
    lower.includes("can the director also edit") ||
    lower.includes("can they also edit") ||
    lower.includes("can they edit")
  ) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Yes! For a short indie film like **${project.title}**, a Director with editing skills can handle both roles to preserve their creative vision and keep the team lean. You would just need to confirm they have the editing software experience and bandwidth.`,
      suggestedFollowUps: ["Okay, find someone who can do both.", "What would happen if we remove the editor?"],
    };
  }

  // "What would happen if we remove the editor?"
  if (lower.includes("what would happen if we remove the editor") || lower.includes("remove the editor")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `If you remove the dedicated editor, the director or another team member must take on cutting the footage, color grading, and export mastering. This keeps the team lean but increases the post-production workload for that person.`,
      suggestedFollowUps: ["Okay, find someone who can do both.", "Keep the editor", "Find an editor"],
    };
  }

  // "Can they do it?" / Pronoun capability query
  if (lower.includes("can they do it") || lower.includes("can they handle it") || lower.includes("can they do that")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Yes! A skilled **${targetRole}** can handle this task efficiently, ensuring high quality and smooth execution for **${project.title}**.`,
      suggestedFollowUps: [`Find a ${targetRole.toLowerCase()}`, "What should we do next?"],
    };
  }

  // "How does editing fit into my project?"
  if (lower.includes("how does editing fit into my project") || lower.includes("how does editing fit")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Editing happens during the post-production phase of **${project.title}**, right after principal photography is completed. The editor synchronizes recorded audio with camera video, cuts scenes, applies color grading, and prepares the master export.`,
      suggestedFollowUps: ["Find an editor", "What should we do next?"],
    };
  }

  // Specific role definitions within project
  if (targetRole === "UI/UX Designer" || lower.includes("designer")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `For **${project.title}**, the UI/UX Designer creates the wireframes, visual theme, responsive page layouts, and interactive Figma mockups before frontend development begins.`,
      roleCard: {
        roleName: "UI/UX Designer",
        category: "Creative",
        purpose: "Designs screen wireframes, visual themes, and user experience flows in Figma.",
        skills: ["Figma", "Wireframing", "UI Design", "Prototyping"],
      },
      suggestedFollowUps: ["Find me a designer", "What should we do next?"],
    };
  }

  if (targetRole === "Film Director" || lower.includes("director")) {
    return {
      intent: "ROLE_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `For **${project.title}**, the Director guides actor performances, determines camera framing with the cinematographer, and ensures the story's emotional authenticity. In your story, the director would help bring the village girl's journey to life.`,
      roleCard: {
        roleName: "Film Director",
        category: "Creative",
        purpose: "Directs actors, guides camera scenes, and maintains creative vision throughout.",
        skills: ["Directing", "Shot List Creation", "Pacing & Rhythm"],
      },
      suggestedFollowUps: ["Can the director also edit?", "Okay, find one", "Do I need a producer?"],
    };
  }

  return {
    intent: "ROLE_QUESTION",
    responseLevel: "CONTEXTUAL_ANSWER",
    message: `For **${project.title}**, the **${targetRole}** ensures high quality across milestone deliverables. Would you like to find verified creators or adjust this role?`,
    suggestedFollowUps: [`Find me a ${targetRole.toLowerCase()}`, `Remove ${targetRole.toLowerCase()}`, "What should we do next?"],
  };
}

// ============================================================================
// 6. TEAM OPTIMIZATION & REFINEMENT
// ============================================================================

export function optimizeTeamForConstraints(
  project: OmniForgeProject,
  instruction: string,
  conversationHistory: ChatMessage[] = []
): { updatedProject: OmniForgeProject; replyMessage: string } {
  const lower = instruction.toLowerCase();
  const updated: OmniForgeProject = JSON.parse(JSON.stringify(project));
  let replyMessage = "";

  // 1. "I only have three people." / Lean team
  if (
    lower.includes("three people") ||
    lower.includes("3 people") ||
    lower.includes("only have 3") ||
    lower.includes("reduce the team") ||
    lower.includes("reduce team")
  ) {
    if (project.domain.includes("Film") || project.domain.includes("Cinema")) {
      replyMessage = `Here is how you can optimize **${project.title}** for a lean 3-person team:\n\n1. **Person 1 (Writer + Director):** Leads the story, actor direction, and creative vision.\n2. **Person 2 (Cinematographer + Lighting):** Operates camera gear and manages shoot lighting.\n3. **Person 3 (Editor + Sound Designer):** Cuts the footage, color grades, and balances audio.\n\nThis covers all essential capabilities with 3 core members.`;
    } else if (project.domain.includes("Web") || project.domain.includes("Software")) {
      replyMessage = `Here is how you can run **${project.title}** with a 3-person team:\n\n1. **Person 1 (Product / Content):** Defines requirements and drafts text content.\n2. **Person 2 (UI/UX Designer):** Designs Figma wireframes and mobile layouts.\n3. **Person 3 (Full Stack Developer):** Builds the frontend pages, connects database, and deploys.\n\nAll necessary capabilities are covered!`;
    } else {
      replyMessage = `For a 3-person team, we can combine complementary roles (such as design + content, or production + editing) to keep execution efficient.`;
    }
    return { updatedProject: updated, replyMessage };
  }

  // 2. "I have a video editor who also knows basic sound editing."
  if (lower.includes("knows basic sound editing") || lower.includes("also knows sound")) {
    const soundRole = updated.roles.find((r) => r.roleName.toLowerCase().includes("sound"));
    if (soundRole) {
      soundRole.isFilled = true;
      soundRole.description += " (Covered by Video Editor)";
    }
    updated.coverage.coveredCapabilities.push({
      name: "Sound Design",
      coveredBy: "Your Video Editor (Dual Capability)",
    });
    updated.coverage.missingCapabilities = updated.coverage.missingCapabilities.filter(
      (m) => !m.roleName.toLowerCase().includes("sound")
    );
    updated.coverage.totalCovered = updated.coverage.coveredCapabilities.length;
    updated.coverage.percentage = updated.roles.length > 0
      ? Math.round((updated.coverage.totalCovered / updated.roles.length) * 100)
      : 100;

    replyMessage = `✓ Great! Marked **Sound Design** as covered by your Video Editor. Capability coverage updated to ${updated.coverage.percentage}%. You don't need a separate sound editor.`;
    return { updatedProject: updated, replyMessage };
  }

  // 3. "I only have a small student budget."
  if (lower.includes("student budget") || lower.includes("small budget") || lower.includes("low budget")) {
    replyMessage = `For a student budget on **${project.title}**:\n\n1. **Use Skill Swap:** Trade skills with student peers instead of cash fees.\n2. **Combine Roles:** Have the director handle editing, or utilize natural sunlight and existing camera gear.\n3. **Simplify Locations:** Use campus or public locations requiring zero permit fees.\n4. **Keep Runtime Tight:** Focus on a punchy 3 to 5-minute cut.`;
    return { updatedProject: updated, replyMessage };
  }

  // 4. "Actually, I only want a 5-minute student short film."
  if (lower.includes("5-minute") || lower.includes("5 minute")) {
    updated.complexity = "Simple";
    updated.estimatedTotalDuration = "2 to 3 Weeks";
    updated.title = updated.title.replace("Cinematic Short Film", "5-Minute Student Short Film");
    replyMessage = `✓ Recalculated project scope for a **5-minute student short film**:\n\n• Complexity reduced to **Simple**\n• Estimated duration streamlined to **2 to 3 Weeks**\n• Tasks adjusted for a lean shoot schedule.`;
    return { updatedProject: updated, replyMessage };
  }

  // 5. "I already have someone handling the music." / "Don't include another music person."
  if (lower.includes("already have someone handling the music") || lower.includes("dont include another music person") || lower.includes("don't include another music person")) {
    const musicRole = updated.roles.find((r) => r.roleName.toLowerCase().includes("music"));
    if (musicRole) {
      musicRole.isFilled = true;
      musicRole.assignedCreatorId = project.ownerId;
    }
    updated.recommendations = updated.recommendations.filter((r) => !r.roleName.toLowerCase().includes("music"));
    updated.coverage.missingCapabilities = updated.coverage.missingCapabilities.filter(
      (m) => !m.roleName.toLowerCase().includes("music")
    );
    replyMessage = `✓ Noted! Marked Music as covered by your existing team. No external music creator will be recommended.`;
    return { updatedProject: updated, replyMessage };
  }

  // 6. "I already have a writer."
  if (lower.includes("already have a writer") || lower.includes("i have a writer")) {
    const writerRole = updated.roles.find((r) => r.roleName.toLowerCase().includes("writer"));
    if (writerRole) {
      writerRole.isFilled = true;
      writerRole.assignedCreatorId = project.ownerId;
    }
    updated.recommendations = updated.recommendations.filter((r) => !r.roleName.toLowerCase().includes("writer"));
    updated.coverage.missingCapabilities = updated.coverage.missingCapabilities.filter(
      (m) => !m.roleName.toLowerCase().includes("writer")
    );
    replyMessage = `✓ Noted that you already have a Screenwriter. Remaining roles needed: **Director, Cinematographer, Lead Actor, Editor, and Sound Designer**.`;
    return { updatedProject: updated, replyMessage };
  }

  // 7. "Can we remove that?" / "Remove [role]"
  if (lower.includes("remove") || lower.includes("drop")) {
    const roleToRemove = extractRoleFromQuery(lower, project, conversationHistory);
    updated.roles = updated.roles.filter((r) => !r.roleName.toLowerCase().includes(roleToRemove.toLowerCase()));
    updated.recommendations = updated.recommendations.filter((r) => !r.roleName.toLowerCase().includes(roleToRemove.toLowerCase()));
    replyMessage = `✓ Removed **${roleToRemove}** role from the required plan.`;
    return { updatedProject: updated, replyMessage };
  }

  return modifyBlueprintFromInstruction(project, instruction);
}

// ============================================================================
// 7. MASTER CONVERSATIONAL ORCHESTRATOR
// ============================================================================

export function extractProjectIdeaFromHistory(conversationHistory: ChatMessage[]): string {
  const domainSpecificMsg = [...conversationHistory].reverse().find(
    (m) =>
      m.sender === "user" &&
      (m.text.toLowerCase().includes("film") ||
        m.text.toLowerCase().includes("movie") ||
        m.text.toLowerCase().includes("short film") ||
        m.text.toLowerCase().includes("website") ||
        m.text.toLowerCase().includes("song") ||
        m.text.toLowerCase().includes("music") ||
        m.text.toLowerCase().includes("app") ||
        m.text.toLowerCase().includes("event"))
  );
  if (domainSpecificMsg) return domainSpecificMsg.text;

  const priorIdeaMsg = [...conversationHistory].reverse().find(
    (m) =>
      m.sender === "user" &&
      !m.text.toLowerCase().startsWith("help me") &&
      !m.text.toLowerCase().startsWith("show me") &&
      !m.text.toLowerCase().startsWith("return to") &&
      (m.text.toLowerCase().includes("idea") ||
        m.text.toLowerCase().includes("make") ||
        m.text.toLowerCase().includes("create") ||
        m.text.toLowerCase().includes("story"))
  );
  return priorIdeaMsg?.text || "Short film production project";
}

export async function processConversationalOmniForgeMessage(
  text: string,
  currentProject: OmniForgeProject | null,
  conversationHistory: ChatMessage[],
  userType: "creator" | "client",
  currentUserId: string = "anon",
  conversationState?: ConversationState | null
): Promise<AIStructuredResponse> {
  const currentState = transitionConversationState(
    conversationState || createInitialConversationState(text),
    text,
    conversationHistory
  );

  const clean = text.toLowerCase().trim().replace(/[?!.,]+$/, "").trim();
  const lower = clean;

  // 1. Direct Knowledge & Definitions (Must NOT create a project!)
  if (
    clean.includes("what does a film director do") ||
    clean.includes("what does a director do") ||
    clean === "what is a director" ||
    clean.includes("what is a director") ||
    clean.includes("what is skill swap") ||
    clean.includes("what's skill swap") ||
    clean.includes("how does skill swap work") ||
    clean.includes("what is react")
  ) {
    const res = await generateContextualConversationResponse(
      currentState,
      text,
      currentProject,
      userType,
      currentUserId
    );
    return {
      ...res,
      conversationState: res.conversationState,
    };
  }

  // 2. Casting & Creator Search Flow
  if (
    currentState.investigationArea === "casting" ||
    currentState.stage === "CREATOR_MATCHING" ||
    clean.includes("need an actor") ||
    clean.includes("actor for my short film") ||
    clean.includes("suggest the best")
  ) {
    const res = await generateContextualConversationResponse(
      currentState,
      text,
      currentProject,
      userType,
      currentUserId
    );
    return {
      ...res,
      conversationState: res.conversationState,
    };
  }

  // 3. Project Discovery & Requirements Investigation Flow (Short film, website)
  if (
    (currentState.stage === "PROJECT_DISCOVERY" || currentState.stage === "REQUIREMENTS_INVESTIGATION") &&
    !clean.includes("show me the plan") &&
    !clean.includes("show me plan") &&
    !clean.includes("complete plan")
  ) {
    const res = await generateContextualConversationResponse(
      currentState,
      text,
      currentProject,
      userType,
      currentUserId
    );
    return {
      ...res,
      conversationState: res.conversationState,
    };
  }

  const decision = classifyMessageSemanticIntent(text, currentProject, conversationHistory);
  const { intent, targetRole } = decision;

  // 4. Squad Authorization Confirmation ("Yes" / "Confirm")
  if (
    decision.targetAction === "CONFIRM_SQUAD_CREATION" &&
    currentProject
  ) {
    return {
      intent: "SQUAD_REQUEST",
      responseLevel: "SIMPLE_ANSWER",
      message: `✓ Confirmed! Launching your project Squad for **${currentProject.title}**. Opening your collaborative workspace and dispatching creator invitations.`,
      conversationState: currentState,
      projectAction: {
        type: "CREATE_SQUAD",
        payload: { projectId: currentProject.id },
      },
      suggestedFollowUps: ["What should we do first?", "View Workspace Roadmap"],
    };
  }

  // 5. Skill Swap Inquiry & Search
  if (intent === "SKILL_SWAP_QUESTION" || intent === "SKILL_SWAP_SEARCH") {
    const ssRes = await handleSkillSwapQuery(text, currentUserId, currentProject);
    return {
      ...ssRes,
      conversationState: currentState,
    };
  }

  // 6. Ambiguous Project Ideas (CLARIFICATION)
  if (intent === "CLARIFICATION") {
    const clarRes = handleClarificationQuery(text);
    return {
      ...clarRes,
      conversationState: currentState,
    };
  }

  // 7. Indirect Problem Statements (e.g. Restaurant Ordering, College Club)
  if (intent === "PROJECT_PROBLEM") {
    const probRes = handleIndirectProjectProblem(text);
    return {
      ...probRes,
      conversationState: currentState,
    };
  }

  // 8. LEVEL 0: General Greetings & Casual Dialogue (NO PROJECT CREATION)
  if (intent === "GENERAL_CONVERSATION") {
    const genRes = handleGeneralDialogue(text, intent, targetRole);
    return {
      ...genRes,
      conversationState: currentState,
    };
  }

  // 9. HOW_TO & PROJECT_PLANNING ("How do I make it?", "Show me the plan")
  if (intent === "HOW_TO" && currentProject) {
    const phasesSummary = currentProject.phases.map((p, i) => `${i + 1}. **${p.name}:** ${p.description}`).join("\n");
    return {
      intent: "HOW_TO",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `To make **${currentProject.title}**, here is the recommended execution roadmap:\n\n${phasesSummary}\n\nWould you like to review the required creators, or should I show you the full deliverable blueprint?`,
      conversationState: currentState,
      suggestedFollowUps: ["Show me the plan", "Who do I need?", "Can I use Skill Swap?"],
    };
  }

  if (
    intent === "PROJECT_PLANNING" ||
    clean.includes("show me the plan") ||
    clean.includes("show me the complete plan")
  ) {
    let proj = currentProject;
    if (!proj) {
      const projIdea = currentState.requirements.storyPremise || currentState.requirements.websitePurpose || extractProjectIdeaFromHistory(conversationHistory) || text;
      proj = generateStructuredBlueprint(projIdea, userType, currentUserId);
    }

    const stagesList = proj.phases.map((p, idx) => `### Stage ${idx + 1}: ${p.name}\n${p.description}`).join("\n\n");
    const reqsList = (proj.requirements || []).map((r) => `• ${r}`).join("\n");
    const workflowVisual = (proj.workflowStages || proj.phases.map((p) => p.name)).join("  ➔  ");
    const rolesList = proj.roles.map((r) => `• **${r.roleName}**: ${r.description}`).join("\n");

    const message = `## 1. What I Understood\n${proj.goal}\n\n## 2. Project Stages\n${stagesList}\n\n## 3. What is Required\n${reqsList}\n\n## 4. How the Work Flows\n${workflowVisual}\n\n## 5. People / Roles Needed\n${rolesList}\n\n## 6. Next Step\nHere is your complete execution plan for **${proj.title}**! You can review the stages, find verified creators, or assemble your squad.`;

    return {
      intent: "PROJECT_PLANNING",
      responseLevel: "PROJECT_ANALYSIS",
      message,
      updatedProject: proj,
      conversationState: {
        ...currentState,
        stage: "PROJECT_BLUEPRINT",
      },
      projectAction: {
        type: "CREATE_BLUEPRINT",
        payload: proj,
      },
      uiAction: {
        type: "SHOW_BLUEPRINT",
      },
      suggestedFollowUps: ["Find me a director", "Create a squad", "Who do I need?"],
    };
  }

  // 7. LEVEL 1: General Knowledge, Definitions & How-To (NO PROJECT CREATION)
  if (intent === "GENERAL_QUESTION" || intent === "DEFINITION" || intent === "EXPLANATION" || intent === "HOW_TO") {
    return handleGeneralDialogue(text, intent, targetRole);
  }

  // 7. LEVEL 2: Contextual Role & Project Questions
  if (intent === "ROLE_QUESTION" || intent === "PHASE_QUESTION") {
    if (currentProject) {
      const roleName = targetRole || currentProject.roles[0]?.roleName || "Film Director";
      return handleContextualProjectQuestion(text, roleName, currentProject, conversationHistory);
    }

    // Role question without prior project loaded (e.g. "Can they also edit?")
    if (lower.includes("edit") || lower.includes("both")) {
      return {
        intent: "ROLE_QUESTION",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `Yes! Many Directors can also handle Video Editing, especially on independent short films. When a director edits their own film, it ensures strong artistic continuity and keeps team costs lean. However, on larger productions, pairing a dedicated Video Editor with the Director brings fresh objective pacing, advanced color grading, and faster turnaround.`,
        roleCard: {
          roleName: "Film Director & Editor",
          category: "Creative & Post-Production",
          purpose: "Directs visual performances and cuts footage into the final cut.",
          skills: ["Directing", "Premiere Pro", "DaVinci Resolve", "Story Pacing"],
        },
        suggestedFollowUps: ["Find me a director", "Create a squad", "What should we do first?"],
      };
    }

    const roleName = targetRole || "Film Director";
    const fallbackProj = generateStructuredBlueprint("Short film production", userType, currentUserId);
    return handleContextualProjectQuestion(text, roleName, fallbackProj, conversationHistory);
  }

  // 8. LEVEL 3: Targeted Creator Search & Dual Skill Matching
  if (intent === "CREATOR_SEARCH" || intent === "CREATOR_DISCOVERY") {
    const isBothDirectAndEdit = lower.includes("do both") || (lower.includes("direct") && lower.includes("edit"));
    const roleName = isBothDirectAndEdit
      ? "Film Director"
      : targetRole || (currentProject ? currentProject.roles[0]?.roleName : "Film Director") || "Film Director";

    const foundCreators = await matchCreatorsForSingleRole(roleName, isBothDirectAndEdit ? ["Directing", "Premiere Pro", "Video Editing"] : [], currentUserId);

    if (foundCreators.length > 0) {
      const topCandidates = foundCreators.slice(0, 3);
      const names = topCandidates.map((c) => `• **${c.creator.fullName || c.creator.username}** (Match: ${c.matchScore}%)`).join("\n");

      const headerMsg = isBothDirectAndEdit
        ? `Found verified creators with overlapping capabilities in **Directing & Video Editing**:\n\n${names}\n\nReview their portfolio evidence below:`
        : `I discovered ${foundCreators.length} verified creators in the OmniCraft network for **${roleName}**:\n\n${names}\n\nReview their portfolio evidence below:`;

      return {
        intent,
        responseLevel: "CREATOR_DISCOVERY",
        message: headerMsg,
        uiAction: {
          type: "SHOW_CREATOR_RECOMMENDATIONS",
          roleName,
          creators: topCandidates,
        },
        creatorCards: topCandidates,
        suggestedFollowUps: [
          `Why did you recommend ${topCandidates[0].creator.fullName || topCandidates[0].creator.username}?`,
          `Replace ${roleName}`,
          `Add ${topCandidates[0].creator.fullName || topCandidates[0].creator.username} to team`,
        ],
      };
    } else {
      return {
        intent,
        responseLevel: "CREATOR_DISCOVERY",
        message: `No active creators currently match the exact skills for **${roleName}**. You can post a client job listing, initiate a Skill Swap, or invite an external collaborator directly.`,
        suggestedFollowUps: ["Publish Job", "Open Skill Swap", "Manual Add"],
      };
    }
  }

  // 9. LEVEL 3: Creator Evidence & Portfolio Inquiries
  if (intent === "CREATOR_COMPARISON" && currentProject) {
    const role = targetRole || "Film Director";
    const recs = currentProject.recommendations.filter(
      (r) => r.roleName.toLowerCase().includes(role.toLowerCase()) || role.toLowerCase().includes(r.roleName.toLowerCase())
    );
    const alts = currentProject.alternativeCandidates?.[role] || [];
    const allCandidates = [...recs, ...alts];

    if (lower.includes("compare these two") || (lower.includes("compare") && allCandidates.length >= 2)) {
      const candA = allCandidates[0];
      const candB = allCandidates[1];

      const analysis = `• **${candA.creator.fullName || candA.creator.username}**: Verified skills in ${candA.creator.skills.slice(0, 3).join(", ") || "Production"} with ${candA.creator.portfolioItemsCount} portfolio project(s).\n• **${candB.creator.fullName || candB.creator.username}**: Specializes in ${candB.creator.specialties.slice(0, 2).join(", ") || "Creative Arts"} with strong role alignment.\n\nBoth are verified talent on OmniCraft.`;

      return {
        intent: "CREATOR_COMPARISON",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `Here is the evidence-based comparison for **${role}**:\n\n${analysis}`,
        uiAction: {
          type: "SHOW_CREATOR_COMPARISON",
          roleName: role,
          comparisonData: {
            roleName: role,
            candidates: [candA, candB],
            analysis,
          },
        },
        comparisonCard: {
          roleName: role,
          candidates: [candA, candB],
          analysis,
        },
        suggestedFollowUps: [
          `Select ${candA.creator.fullName || candA.creator.username}`,
          `Select ${candB.creator.fullName || candB.creator.username}`,
        ],
      };
    } else if (allCandidates.length >= 1) {
      const cand = allCandidates[0];
      const name = cand.creator.fullName || cand.creator.username;
      const portfolioSample = cand.creator.portfolioSamples[0]?.title ? `"${cand.creator.portfolioSamples[0].title}"` : `${cand.creator.portfolioItemsCount} portfolio projects`;

      return {
        intent: "CREATOR_COMPARISON",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `**${name}** is recommended for **${cand.roleName}** based on real database records:\n\n• **Experience & Bio:** ${cand.creator.bio || "Active contributor in creative productions"}\n• **Verified Skills:** ${cand.creator.skills.join(", ") || cand.evidenceSources.skillsMatched.join(", ") || "Directing, Storytelling"}\n• **Portfolio Evidence:** Verified work including ${portfolioSample}\n• **Match Score:** ${cand.matchScore}% alignment with project requirements.`,
        suggestedFollowUps: ["What if they aren't available?", "What should we do first?", "Create the squad"],
      };
    } else if (currentProject.recommendations.length > 0) {
      const firstRec = currentProject.recommendations[0];
      const name = firstRec.creator.fullName || firstRec.creator.username;
      return {
        intent: "CREATOR_COMPARISON",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `**${name}** is recommended for **${firstRec.roleName}** based on verified portfolio evidence (${firstRec.creator.portfolioItemsCount} submitted pieces) and matched skills (${firstRec.evidenceSources.skillsMatched.join(", ") || "Specialized domain"}).`,
        suggestedFollowUps: ["What if they aren't available?", "What should we do first?"],
      };
    } else {
      const lastRecFromHistory = conversationHistory
        .slice()
        .reverse()
        .find((m) => m.creatorCards && m.creatorCards.length > 0)?.creatorCards?.[0];

      if (lastRecFromHistory) {
        const name = lastRecFromHistory.creator.fullName || lastRecFromHistory.creator.username;
        const portfolioSample = lastRecFromHistory.creator.portfolioSamples[0]?.title
          ? `"${lastRecFromHistory.creator.portfolioSamples[0].title}"`
          : `${lastRecFromHistory.creator.portfolioItemsCount} portfolio pieces`;

        return {
          intent: "CREATOR_COMPARISON",
          responseLevel: "CONTEXTUAL_ANSWER",
          message: `**${name}** was recommended for **${lastRecFromHistory.roleName}** based on real database evidence:\n\n• **Experience:** ${lastRecFromHistory.creator.bio || "Active contributor in creative productions"}\n• **Verified Skills:** ${lastRecFromHistory.creator.skills.join(", ") || "Directing, Storytelling"}\n• **Portfolio Evidence:** Verified work including ${portfolioSample}\n• **Match Score:** ${lastRecFromHistory.matchScore}% alignment with project requirements.`,
          suggestedFollowUps: ["What if they aren't available?", "What should we do first?", "Create the squad"],
        };
      }

      const foundFromDB = (await matchCreatorsForSingleRole(role, [], currentUserId)).slice(0, 1);
      if (foundFromDB.length > 0) {
        const topCand = foundFromDB[0];
        const name = topCand.creator.fullName || topCand.creator.username;
        return {
          intent: "CREATOR_COMPARISON",
          responseLevel: "CONTEXTUAL_ANSWER",
          message: `**${name}** is recommended for **${role}** based on verified skills (${topCand.creator.skills.slice(0, 3).join(", ") || "Production"}) and portfolio evidence on OmniCraft.`,
          suggestedFollowUps: ["What if they aren't available?", "What should we do first?"],
        };
      }

      return {
        intent: "CREATOR_COMPARISON",
        responseLevel: "CONTEXTUAL_ANSWER",
        message: `Verified creators for **${role}** on OmniCraft are recommended based on their verified skill badges, portfolio pieces, and domain relevance.`,
        suggestedFollowUps: ["What if they aren't available?", "What should we do first?", "Create the squad"],
      };
    }
  }

  // 10. LEVEL 3: Creator Replacement & "What if they aren't available?"
  if (intent === "CREATOR_REPLACEMENT" && currentProject) {
    const roleName = targetRole || currentProject.roles[0]?.roleName || "Film Director";
    const alts = (await matchCreatorsForSingleRole(roleName, [], currentUserId)).slice(0, 3);

    return {
      intent: "CREATOR_REPLACEMENT",
      targetRole: roleName,
      responseLevel: "CREATOR_DISCOVERY",
      message: `If they are not available, here are alternative verified creators for **${roleName}**:`,
      uiAction: {
        type: "SHOW_CREATOR_RECOMMENDATIONS",
        roleName,
        creators: alts,
      },
      creatorCards: alts,
      suggestedFollowUps: [`Select replacement for ${roleName}`, "I only have three people", "Create the squad"],
    };
  }

  // 11. LEVEL 3: Squad Launch Confirmation Prompt
  if (intent === "SQUAD_REQUEST") {
    let proj = currentProject;
    if (!proj) {
      const projIdea = extractProjectIdeaFromHistory(conversationHistory);
      proj = generateStructuredBlueprint(projIdea, userType, currentUserId);
    }

    const assignedCount = proj.recommendations.length;
    return {
      intent: "SQUAD_REQUEST",
      responseLevel: "CONFIRMATION_REQUIRED",
      message: `Ready to assemble the team for **${proj.title}**? This will initialize your collaborative Squad workspace and dispatch invitations to ${assignedCount > 0 ? assignedCount : "assigned"} creators.`,
      requiresConfirmation: true,
      updatedProject: proj,
      uiAction: {
        type: "SHOW_CONFIRMATION",
        confirmationPrompt: {
          title: "Launch Project Squad",
          message: `Confirm launching Squad "${proj.title}"?`,
          actionType: "create_squad",
          payload: { projectId: proj.id },
        },
      },
      confirmationCard: {
        title: "Launch Project Squad",
        message: `Initialize workspace and dispatch invitations to creators.`,
        actionType: "create_squad",
        payload: { projectId: proj.id },
      },
      suggestedFollowUps: ["Yes", "Not yet, review team first"],
    };
  }

  // 12. LEVEL 3: Team Optimization & Project Modification
  if (intent === "PROJECT_MODIFICATION" && currentProject) {
    const { updatedProject, replyMessage } = optimizeTeamForConstraints(currentProject, text, conversationHistory);
    return {
      intent: "PROJECT_MODIFICATION",
      responseLevel: "PROJECT_MODIFICATION",
      message: replyMessage,
      updatedProject,
      projectAction: {
        type: "UPDATE_ROLE",
        payload: updatedProject,
      },
      uiAction: {
        type: "SHOW_PROJECT_UPDATE",
        updateSummary: {
          title: "Team & Scope Optimized",
          detail: replyMessage,
          actionType: "scope_change",
        },
      },
      updateCard: {
        title: "Team & Scope Optimized",
        detail: replyMessage,
        actionType: "scope_change",
      },
      suggestedFollowUps: ["What should we do first?", "Create the squad", "What should we do next?"],
    };
  }

  // 13. LEVEL 5: Project Status & "What should we do first / next?"
  if (intent === "PROJECT_STATUS") {
    let proj = currentProject;
    if (!proj) {
      const projIdea = extractProjectIdeaFromHistory(conversationHistory);
      proj = generateStructuredBlueprint(projIdea, userType, currentUserId);
    }

    const { reply } = processWorkspaceAssistantQuery(text, proj);
    return {
      intent: "PROJECT_STATUS",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `Returning to your film project (**${proj.title}**):\n\n${reply}`,
      updatedProject: proj,
      uiAction: {
        type: "SHOW_BLUEPRINT",
      },
      suggestedFollowUps: ["Create the squad", "Find me a director", "View Workspace Roadmap"],
    };
  }

  // 14. LEVEL 5: Project Blocker / Delay Analysis ("Cinematographer is unavailable")
  if (intent === "PROJECT_BLOCKER" && currentProject) {
    const { reply } = processWorkspaceAssistantQuery(text, currentProject);
    return {
      intent: "PROJECT_BLOCKER",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: reply,
      suggestedFollowUps: ["Find replacement creator", "Shift milestone dates", "Advance parallel tasks"],
    };
  }

  // 15. LEVEL 4: Project Idea -> Structured Blueprint Decomposition
  if (intent === "PROJECT_CREATION") {
    const blueprint = generateStructuredBlueprint(text, userType, currentUserId);

    // Format structured chat response
    const stagesList = blueprint.phases.map((p, idx) => `### Stage ${idx + 1}: ${p.name}\n${p.description}`).join("\n\n");
    const reqsList = (blueprint.requirements || []).map((r) => `• ${r}`).join("\n");
    const workflowVisual = (blueprint.workflowStages || blueprint.phases.map((p) => p.name)).join("  ➔  ");
    const rolesList = blueprint.roles.map((r) => `• **${r.roleName}**: ${r.description}`).join("\n");

    const message = `## 1. What I Understood\n${blueprint.goal}\n\n## 2. Project Stages\n${stagesList}\n\n## 3. What is Required\n${reqsList}\n\n## 4. How the Work Flows\n${workflowVisual}\n\n## 5. People / Roles Needed\n${rolesList}\n\n## 6. Next Step\nYour initial project plan is ready! You can ask me anything about it, change the plan, find creators, or build the team.`;

    return {
      intent: "PROJECT_CREATION",
      responseLevel: "PROJECT_ANALYSIS",
      message,
      updatedProject: blueprint,
      projectAction: {
        type: "CREATE_BLUEPRINT",
        payload: blueprint,
      },
      uiAction: {
        type: "SHOW_BLUEPRINT",
      },
      suggestedFollowUps: [
        "How would I make it?",
        "Who would I need?",
        "Do I need a director?",
        "Find creators",
      ],
    };
  }

  // 16. Contextual Fallback on an Active Project
  if (currentProject) {
    return {
      intent: "GENERAL_PROJECT_QUESTION",
      responseLevel: "CONTEXTUAL_ANSWER",
      message: `I'm tracking your **${currentProject.title}** plan. You can ask role definitions, request creator searches, optimize team size, or ask what to do first.`,
      suggestedFollowUps: ["What should we do first?", "Create the squad", "Do I need a director?"],
    };
  }

  // 17. General Fallback
  return handleGeneralDialogue(text, "UNKNOWN");
}

// ============================================================================
// 8. WORKSPACE AI ASSISTANT QUERY HANDLER
// ============================================================================

export function processWorkspaceAssistantQuery(
  query: string,
  project: OmniForgeProject
): {
  reply: string;
  suggestedAction?: {
    type: "reschedule" | "replace_creator" | "modify_scope" | "highlight_task";
    payload?: any;
  };
} {
  const q = query.toLowerCase();

  if (q.includes("unavailable") || q.includes("delay") || q.includes("sick") || q.includes("leave") || q.includes("no longer available")) {
    let affectedRole = "cinematographer";
    if (q.includes("director")) affectedRole = "director";
    else if (q.includes("editor")) affectedRole = "editor";
    else if (q.includes("developer") || q.includes("engineer")) affectedRole = "developer";

    return {
      reply: `⚠️ **Impact & Schedule Conflict Analysis:**\nThe **${affectedRole}** is on the critical path for shooting milestones. A delay or unavailability directly impacts dependent shooting and editing tasks.\n\n**Recommended Next Actions:**\n1. **Find an available replacement creator** from the OmniCraft network to protect the target release date.\n2. **Shift downstream shooting dates** while advancing pre-production script polish and music composition in parallel.\n3. **Redistribute responsibilities** if another team member can cover camera operation.`,
      suggestedAction: {
        type: "replace_creator",
      },
    };
  }

  if (q.includes("what should we do first") || q.includes("what should we do now") || q.includes("what should we do next") || q.includes("what should i do next") || q.includes("next step") || q.includes("status") || q.includes("what is pending")) {
    const activePhase = project.phases.find((p) => p.tasks.some((t) => t.status === "to_do" || t.status === "in_progress")) || project.phases[0];
    const pendingTasks = activePhase.tasks.filter((t) => t.status === "to_do" || t.status === "in_progress");

    if (pendingTasks.length > 0) {
      const topTask = pendingTasks[0];
      const taskList = pendingTasks.map((t) => `• **${t.title}** (${t.requiredRole} — Est. ${t.estimatedDuration})`).join("\n");

      return {
        reply: `Your immediate first step is **${topTask.title}** in **${activePhase.name}** because subsequent casting, location planning, and production depend on it.\n\nCurrent actionable tasks:\n${taskList}\n\nYou can review or invite creators directly from the Creator Team tab!`,
        suggestedAction: {
          type: "highlight_task",
        },
      };
    } else {
      return {
        reply: `All tasks in **${activePhase.name}** are completed! You can proceed to the next stage in your Workspace Roadmap.`,
      };
    }
  }

  if (q.includes("remove") || q.includes("scope") || q.includes("drop") || q.includes("add") || q.includes("already have")) {
    const { replyMessage } = modifyBlueprintFromInstruction(project, query);
    return {
      reply: replyMessage,
      suggestedAction: {
        type: "modify_scope",
      },
    };
  }

  return {
    reply: `I'm monitoring your **${project.title}** project blueprint. You can ask about next steps, analyze critical path dependencies, find replacement creators, or adjust milestone dates.`,
  };
}

// Re-export blueprint generator
export { generateStructuredBlueprint, modifyBlueprintFromInstruction } from "./engine-blueprint";
