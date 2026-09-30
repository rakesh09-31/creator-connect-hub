/**
 * OmniForge Intent Classification & UI Action Orchestrator
 *
 * Provides explicit, typed intent classification and gates all side effects
 * (project creation, roadmap generation, Supabase creator matching, and missing-role cards).
 */

import { ChatMessage, OmniForgeProject } from "./types";

export type UserIntent =
  | "GREETING"
  | "GENERAL_QUESTION"
  | "FEATURE_EXPLANATION"
  | "ROLE_OR_CONCEPT_EXPLANATION"
  | "CREATIVE_ADVICE"
  | "PROJECT_CREATION"
  | "PROJECT_MODIFICATION"
  | "CREATOR_SEARCH"
  | "COLLABORATION_ACTION"
  | "INVITATION_OR_COLLABORATION_ACTION";

export type ProjectActionType = "NONE" | "CREATE_PROJECT" | "UPDATE_PROJECT";
export type MatchingActionType = "NONE" | "MATCH_ROLES" | "SEARCH_CREATORS";

export interface IntentActionResult {
  intent: UserIntent;
  confidence: number;
  project_action: ProjectActionType;
  matching_action: MatchingActionType;
  targetRole?: string;
  skills?: string[];
  extractedRoles?: string[];
  projectData?: {
    title?: string;
    domain?: string;
    type?: string;
    story_premise?: string;
    budget?: string;
    team_size?: string;
    roles?: string[];
  };
  explanation?: string;
}

const GREETING_REGEX = /^\s*(?:hi|hlo|hello|hey|heyy+|greetings|good\s+(?:morning|afternoon|evening|day)|sup|yo|namaste|vanakkam)[\s!.,?]*$/i;

const FOLLOWUP_REGEX = /^(?:please\s+)?(?:respond|answer|reply)(?:\s+to)?(?:\s+the)?(?:\s+(?:above|previous|last))?(?:\s+(?:question|prompt|message|query))?[\s.?!]*$/i;

const FEATURE_EXPLANATION_REGEX = /\b(what is|how does|explain|tell me about|how to use|how do i swap|can you explain)\b.*\b(skill swap|omniforge|squad|collaboration workspace|platform|creator connect)\b/i;

const ROLE_OR_CONCEPT_REGEX = /^(?:what does a|what does an|what is a|what is an|what is the role of|explain the role of|difference between|compare|duties of|responsibilities of)\b/i;

const ROLE_VERSUS_REGEX = /\b(?:versus|vs\.?|compared to|difference between)\b/i;

const CREATIVE_ADVICE_REGEX = /\b(?:i\s+need\s+(?:a\s+|an\s+)?(?:video\s+editor|editor|director|cinematographer|singer|developer|designer)|can\s+you\s+suggest|suggest\s+(?:them|someone|one|candidates|talent|skills)?\s+with\s+(?:better\s+)?skills|skills\s+(?:to\s+look\s+for|needed|required)|what\s+skills\s+(?:should|to|do\s+i)|how\s+(?:do\s+i|to)\s+(?:choose|pick|evaluate|hire)\s+(?:a|an)?\s*(?:video\s+editor|editor|director|cinematographer|actor|sound\s+designer|developer|designer)|advice\s+on|best\s+practices\s+for|what\s+makes\s+a\s+good)\b/i;

const CREATOR_SEARCH_REGEX = /\b(?:find\s+(?:me\s+)?(?:a\s+|an\s+|the\s+)?(?:creator|creators|actor|actors|actress|singer|singers|vocalist|director|directors|cinematographer|cinematographers|dop|video\s+editor|editor|editors|colorist|colorists|developer|developers|designer|designers|sound\s+designer|composer|musician|photographer)|who\s+(?:can|should\s+i|to)\s+(?:hire|cast|get|work\s+with|collaborate\s+with)|recommend\s+(?:a\s+|an\s+|some\s+)?(?:creator|creators|actor|actors|singer|editor|video\s+editor|colorist|director|cinematographer|developer|designer)|search\s+for\s+(?:creators|actors|singers|editors|video\s+editors|colorists|directors|talent)|suggest\s+(?:best\s+)?(?:candidates|creators|actors|singers|editors|colorists))\b/i;

const ROLE_KEYWORDS_REGEX = /\b(?:actor|actors|actress|actresses|lead\s+actor|lead\s+actress|female\s+lead(?:\s+actor)?|male\s+lead(?:\s+actor)?|singer|singers|vocalist|vocalists|lead\s+singer|director|directors|film\s+director|cinematographer|cinematographers|dop|camera\s+operator|video\s+editor|editor|editors|colorist|colorists|colourist|colourists|sound\s+designer|audio\s+engineer|composer|music\s+composer|producer|music\s+producer|writer|screenwriter|developer|developers|designer|designers|animator|illustrator|performer|performers|talent|creator|creators)\b/i;

const SEARCH_ACTION_REGEX = /\b(?:search|search\s+again|find|find\s+me|find\s+an?|look\s+for|lookup|hire|cast|recommend|match|get\s+me|bring\s+me|show\s+me)\b/i;

const SEARCH_QUESTION_REGEX = /(?:(?:can|could|please|would)\s+you\s+(?:please\s+)?search|(?:so\s+)?can\s+you\s+search|search\s+for|search\s+again|search\s+the\s+database|search\s+creators|search\s+actors|search\s+again\s+for)/i;

export function isCreatorSearchQuery(text: string): boolean {
  const clean = text.trim();
  if (/^(?:how\s+to|what\s+is|what\s+does|why\s+do|explain\s+how)\b/i.test(clean)) {
    return false;
  }
  const hasRole = ROLE_KEYWORDS_REGEX.test(clean);
  const hasAction = SEARCH_ACTION_REGEX.test(clean);
  const hasQuestion = SEARCH_QUESTION_REGEX.test(clean);
  if (hasRole && (hasAction || hasQuestion)) {
    return true;
  }
  return CREATOR_SEARCH_REGEX.test(clean);
}

const INVITATION_ACTION_REGEX = /\b(?:invite|add\s+to\s+squad|add\s+to\s+team|send\s+invitation|propose\s+skill\s+swap)\b/i;

const PROJECT_MODIFICATION_REGEX = /\b(?:change\s+the\s+budget|update\s+the\s+budget|increase\s+budget|decrease\s+budget|change\s+budget|update\s+timeline|change\s+timeline|change\s+duration|update\s+duration|add\s+(?:a\s+|an\s+)?[\w\s]+\s+to\s+(?:my|the)\s+project|remove\s+(?:the\s+)?[\w\s]+\s+role|change\s+title|update\s+title|rename\s+project)\b/i;

const PROJECT_CREATION_REGEX = /\b(?:i\s+want\s+to\s+(?:make|build|create|shoot|produce|develop)|let'?s\s+(?:make|build|create|shoot|produce|develop|plan)|create\s+a\s+(?:short\s+film|film|movie|web\s*app|website|mobile\s*app|app|music\s*video|album|song|project)\s+plan|plan\s+(?:a\s+|my\s+)?(?:short\s+film|film|movie|web\s*app|website|mobile\s*app|app|project|production)|have\s+(?:a\s+|an\s+)?(?:story|idea|concept)\s+(?:about|called|for\s+a)|story\s+about\s+a\s+(?:young\s+)?(?:village\s+girl|girl|boy|person|student|astronaut|detective)|my\s+project\s+is\s+(?:about|a)|developing\s+a\s+(?:short\s+film|web\s*app|mobile\s*app|music\s*video))\b/i;


/**
 * Classifies the user's intent into explicit categories and determines
 * the authorized project and creator-matching actions.
 *
 * Default actions are strictly "NONE".
 */
export function classifyUserIntent(
  userText: string,
  context?: {
    hasActiveProject?: boolean;
    activeProject?: OmniForgeProject | null;
    conversationHistory?: ChatMessage[];
  }
): IntentActionResult {
  const clean = userText.trim();
  const lower = clean.toLowerCase();

  // 0. Follow-up Context Resolution (e.g. "please respond to the above question")
  if (FOLLOWUP_REGEX.test(clean) && context?.conversationHistory && context.conversationHistory.length > 0) {
    const priorUserMsgs = context.conversationHistory.filter(
      (m) => m.sender === "user" && !FOLLOWUP_REGEX.test(m.text.trim())
    );
    if (priorUserMsgs.length > 0) {
      const lastUserMsg = priorUserMsgs[priorUserMsgs.length - 1];
      return classifyUserIntent(lastUserMsg.text, {
        ...context,
        conversationHistory: context.conversationHistory.slice(0, -1),
      });
    }
  }

  // 1. GREETING
  if (GREETING_REGEX.test(clean)) {
    return {
      intent: "GREETING",
      confidence: 0.99,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Standard conversational greeting.",
    };
  }

  // 2. FEATURE_EXPLANATION (Platform capabilities like Skill Swap)
  if (FEATURE_EXPLANATION_REGEX.test(clean)) {
    return {
      intent: "FEATURE_EXPLANATION",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Question inquiring about platform features or mechanics.",
    };
  }

  // 3. ROLE_OR_CONCEPT_EXPLANATION
  // Checks for questions about role definitions or comparisons (e.g. "What does a director do versus a cinematographer?")
  const isDefinitional = ROLE_OR_CONCEPT_REGEX.test(clean);
  const isComparison = ROLE_VERSUS_REGEX.test(clean) && !lower.includes("my project") && !lower.includes("for my film");
  const hasEducationalKeywords =
    lower.includes("director") ||
    lower.includes("cinematographer") ||
    lower.includes("sound designer") ||
    lower.includes("editor") ||
    lower.includes("producer") ||
    lower.includes("color grading") ||
    lower.includes("dop") ||
    lower.includes("gaffer") ||
    lower.includes("screenwriter");

  if ((isDefinitional && hasEducationalKeywords) || (isComparison && hasEducationalKeywords)) {
    // Confirm user is not saying "I want to hire a director versus a cinematographer for my project"
    if (!lower.includes("hire") && !lower.includes("find me") && !lower.includes("my project") && !lower.includes("for my film")) {
      return {
        intent: "ROLE_OR_CONCEPT_EXPLANATION",
        confidence: 0.95,
        project_action: "NONE",
        matching_action: "NONE",
        explanation: "Educational explanation of creative roles or technical concepts.",
      };
    }
  }

  // 4. CREATOR_SEARCH (Explicit request to find/match/recommend creators)
  if (isCreatorSearchQuery(clean)) {
    // Extract target role if specified in query
    let targetRole: string | undefined;
    if (/\b(?:female\s+lead(?:\s+actor)?|lead\s+actress|actress|actresses)\b/i.test(clean)) targetRole = "Lead Actress";
    else if (/\b(?:actor|actors|lead\s+actor|male\s+lead|acting|performer|performers)\b/i.test(clean)) targetRole = "Lead Actor";
    else if (/\b(?:colorist|colorists|colourist|colourists)\b/i.test(clean)) targetRole = "Colorist";
    else if (/\b(?:video\s+editor|editor|editors)\b/i.test(clean)) targetRole = "Video Editor";
    else if (/\b(?:singer|vocalist|lead\s+singer|singers)\b/i.test(clean)) targetRole = "Lead Singer";
    else if (/\b(?:director|film\s+director|directors)\b/i.test(clean)) targetRole = "Film Director";
    else if (/\b(?:cinematographer|cinematographers|dop|camera\s+operator)\b/i.test(clean)) targetRole = "Cinematographer";
    else if (/\b(?:sound\s+designer|audio\s+engineer|boom\s+operator|sound\s+recordist)\b/i.test(clean)) targetRole = "Sound Designer";
    else if (/\b(?:developer|frontend|web\s+developer)\b/i.test(clean)) targetRole = "Frontend Web Developer";
    else if (/\b(?:designer|ui\/ux\s+designer)\b/i.test(clean)) targetRole = "UI/UX Designer";
    else if (context?.activeProject?.roles && context.activeProject.roles.length > 0) {
      targetRole = context.activeProject.roles[0].roleName;
    }

    const extractedSkills: string[] = [];
    if (/\b(?:sing|singing|singer|vocal|vocals)\b/i.test(clean)) extractedSkills.push("Singing");
    if (/\b(?:dance|dancing|dancer)\b/i.test(clean)) extractedSkills.push("Dancing");
    if (/\b(?:acting|dramatic|theatre|theater)\b/i.test(clean)) extractedSkills.push("Acting");

    return {
      intent: "CREATOR_SEARCH",
      confidence: 0.98,
      project_action: "NONE",
      matching_action: "SEARCH_CREATORS",
      targetRole: targetRole || "Lead Actor",
      skills: extractedSkills,
      explanation: "Explicit search request for verified creators or talent.",
    };
  }

  // 5. CREATIVE_ADVICE (Role skill breakdown, advice on finding or evaluating talent without search)
  if (CREATIVE_ADVICE_REGEX.test(clean) || (lower.includes("video editor") && lower.includes("skill"))) {
    return {
      intent: "CREATIVE_ADVICE",
      confidence: 0.95,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "Creative advice on skills, roles, and project execution guidance.",
    };
  }

  // 6. COLLABORATION_ACTION / INVITATION
  if (INVITATION_ACTION_REGEX.test(clean)) {
    return {
      intent: "COLLABORATION_ACTION",
      confidence: 0.92,
      project_action: "NONE",
      matching_action: "NONE",
      explanation: "User is inviting a collaborator or adjusting squad membership.",
    };
  }

  // 6. PROJECT_MODIFICATION
  if (context?.hasActiveProject && PROJECT_MODIFICATION_REGEX.test(clean)) {
    return {
      intent: "PROJECT_MODIFICATION",
      confidence: 0.90,
      project_action: "UPDATE_PROJECT",
      matching_action: "NONE",
      explanation: "Instruction to modify an existing established project.",
    };
  }

  // 7. PROJECT_CREATION (Genuine proposal to create or plan a new project)
  if (PROJECT_CREATION_REGEX.test(clean)) {
    // Extract domain & roles from the actual brief
    let domain = "Film & Video";
    let type = "Short Film";
    let extractedRoles = ["Director", "Cinematographer", "Video Editor", "Sound Designer", "Lead Actor"];

    if (/\b(?:web\s*app|website|web\s*site|web\s*portal)\b/i.test(clean)) {
      domain = "Software & Tech";
      type = "Web Application";
      extractedRoles = ["Frontend Developer", "Backend Developer", "UI/UX Designer", "Product Manager"];
    } else if (/\b(?:mobile\s*app|ios\s*app|android\s*app)\b/i.test(clean)) {
      domain = "Software & Tech";
      type = "Mobile Application";
      extractedRoles = ["Mobile Developer", "UI/UX Designer", "Backend Developer", "QA Engineer"];
    } else if (/\b(?:music\s*video|album|song|music\s*production)\b/i.test(clean)) {
      domain = "Music & Audio";
      type = "Music Production";
      extractedRoles = ["Music Producer", "Sound Engineer", "Lead Singer", "Mixing / Mastering Engineer"];
    }

    if (lower.includes("village girl") && lower.includes("singer")) {
      extractedRoles = ["Lead Singer", "Film Director", "Cinematographer", "Sound Recordist", "Video Editor"];
    }

    // Extract budget if mentioned
    let budget: string | undefined;
    const budgetMatch = clean.match(/(?:₹|rs\.?|inr|\$)\s*([\d,]+(?:\s*(?:k|lakh|lakhs|thousand))?)/i) ||
                        clean.match(/\b(\d{1,2}(?:,\d{3})+|\d+k|\d+\s*lakh)\s*(?:budget|inr|rupees)?\b/i);
    if (budgetMatch) {
      budget = budgetMatch[0].includes("₹") ? budgetMatch[0] : `₹${budgetMatch[1] || budgetMatch[0]}`;
    }

    return {
      intent: "PROJECT_CREATION",
      confidence: 0.95,
      project_action: "CREATE_PROJECT",
      matching_action: "MATCH_ROLES",
      extractedRoles,
      projectData: {
        domain,
        type,
        story_premise: clean,
        budget,
        roles: extractedRoles,
      },
      explanation: "Genuine project creation intent detected with story or project brief.",
    };
  }

  // 8. Explicit Blueprint request when project discussion is established
  if (
    context?.hasActiveProject &&
    /\b(?:show\s+(?:me\s+)?(?:the\s+)?plan|generate\s+blueprint|view\s+in\s+blueprint|show\s+roadmap)\b/i.test(clean)
  ) {
    return {
      intent: "PROJECT_MODIFICATION",
      confidence: 0.92,
      project_action: "UPDATE_PROJECT",
      matching_action: "MATCH_ROLES",
      explanation: "User requested blueprint view for active project.",
    };
  }

  // 9. GENERAL_QUESTION (Default conversational inquiry)
  return {
    intent: "GENERAL_QUESTION",
    confidence: 0.70,
    project_action: "NONE",
    matching_action: "NONE",
    explanation: "General conversational question without project initiation or creator search.",
  };
}
