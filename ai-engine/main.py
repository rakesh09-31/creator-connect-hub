
import os
import re
import time
import json
import logging
from typing import List, Optional, Dict, Any, Union
import httpx

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# --------------------------------------------------
# LOGGING SETUP
# --------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger("omniforge-ai")

# --------------------------------------------------
# CONFIGURATION
# --------------------------------------------------

APP_NAME = "OmniCraft Local AI Engine"
OLLAMA_URL = "http://127.0.0.1:11434/api/chat"
MODEL_NAME = "qwen3:4b"
DEFAULT_NUM_PREDICT = int(os.environ.get("LOCAL_AI_NUM_PREDICT", "2500"))
REQUEST_TIMEOUT = float(os.environ.get("LOCAL_AI_TIMEOUT", "90.0"))

# --------------------------------------------------
# FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title=APP_NAME,
    description="Local AI backend powered by Ollama and Qwen3",
    version="1.1.0"
)

# --------------------------------------------------
# CORS CONFIGURATION
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",
        "http://localhost:8080",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:8081",
        "http://127.0.0.1:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://192.168.1.70:8081",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_private_network=True,
)

# --------------------------------------------------
# REQUEST SCHEMA
# --------------------------------------------------

class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str = Field(
        ...,
        min_length=1,
        max_length=10000
    )
    history: Optional[List[ChatMessage]] = None
    project_context: Optional[Dict[str, Any]] = None
    stream: Optional[bool] = False
    num_predict: Optional[int] = None


# --------------------------------------------------
# SYSTEM PROMPT
# --------------------------------------------------

SYSTEM_PROMPT = """You are OmniForge AI, a truthful, context-aware Creative Project Partner and Production Architect on OmniCraft.

CORE PRINCIPLES & STRICT TRUTH GROUNDING:
1. TRUTHFULNESS & NO HALLUCINATIONS:
   - OmniCraft is a collaborative networking platform for creative talent to connect, showcase portfolios, collaborate in squads, propose Skill Swaps, and find project collaborators.
   - NEVER invent or claim non-existent platform features, software, or tiers:
     * OmniCraft does NOT have native video editing, rendering, color grading, LUTs, or proprietary editing software. Industry tools like DaVinci Resolve, Adobe Premiere Pro, Final Cut Pro, or Avid must be referred to as standard external industry software, NEVER as native OmniCraft tools.
     * OmniCraft does NOT have an "OmniCraft Studio", "OmniCraft Marketplace", "OmniCraft Pro Colorist", or "OmniCraft Story Colorist".
     * NEVER claim creators have specific ratings, portfolios, platform experience, or availability percentages unless retrieved from actual database records.
     * NEVER cite fabricated statistics, percentages, or research findings without verifiable sources.
   - If a feature does not exist on OmniCraft, provide general creative/industry advice and clearly identify it as general advice.

2. VIDEO EDITOR & CREATIVE ROLE ADVICE:
   - When a user asks about finding a role (e.g. "I need a video editor can you suggest" or "What skills should a video editor have?"):
     * Explain what skills to look for: storytelling & dramatic pacing, visual continuity & match-cutting, color correction & exposure balance, audio synchronization & dialogue cleaning, and industry editing software proficiency (DaVinci Resolve, Premiere Pro, Final Cut Pro).
     * If the project type is unspecified, politely ask what type of video they are creating (short film, commercial, YouTube, documentary).
     * Offer to search for registered creators on OmniCraft.
     * Do NOT invent specific editor names, fake creator profiles, or pretend to have searched the database.
     * For a simple video editor request, do NOT generate a full film crew (e.g., Colorist, Sound Designer, Producer) unless the user asks for full production or film roles.

3. CONTEXTUAL PROJECT BLUEPRINTS:
   - When the user describes a real project (such as a short film about a village girl who becomes a singer), provide an authentic creative roadmap and explain essential versus optional roles relevant to that specific concept.

4. CREATOR SEARCH & DATABASE INTEGRATION:
   - OmniCraft HAS an integrated creator directory with verified talent profiles (Actors, Singers, Directors, Cinematographers, Video Editors, Colorists, Sound Designers, etc.).
   - NEVER state that you cannot access the database or that OmniCraft has no built-in search function. OmniForge automatically executes database creator discovery for search requests.
   - When project context is already established (e.g. a short film about a village girl who becomes a singer), do NOT re-ask questions about the genre, story premise, or character tone. Leverage the existing project context directly.

5. SEPARATION OF CONVERSATION & STRUCTURED CARDS:
   - Provide natural, readable advice in your response text.
   - Do not output repetitive role card blocks in the text body (role cards will be rendered cleanly below the answer).
   - Never output internal thinking tokens, tags, or prompts."""

GREETING_PATTERN = re.compile(
    r"^\s*(?:hi|hlo|hello|hey|heyy+|greetings|good\s+(?:morning|afternoon|evening|day)|sup|yo|namaste|vanakkam)[\s!.,?]*$",
    re.IGNORECASE
)

INSTRUCTION_PROBE_PATTERN = re.compile(
    r"\b(reveal|show|print|display|tell|leak|repeat|ignore\s+all\s+previous|what\s+are\s+your)\b.*\b(system\s*prompt|hidden\s*instructions?|internal\s*instructions?|developer\s*instructions?|prompt\s*template)\b",
    re.IGNORECASE
)

FEATURE_EXPLANATION_PATTERN = re.compile(
    r"\b(what is|how does|explain|tell me about|how to use|how do i swap|can you explain)\b.*\b(skill swap|omniforge|squad|collaboration workspace|platform|creator connect)\b",
    re.IGNORECASE
)

ROLE_OR_CONCEPT_PATTERN = re.compile(
    r"^(?:what does a|what does an|what is a|what is an|what is the role of|explain the role of|difference between|compare|duties of|responsibilities of)\b",
    re.IGNORECASE
)

ROLE_VERSUS_PATTERN = re.compile(
    r"\b(?:versus|vs\.?|compared to|difference between)\b",
    re.IGNORECASE
)

ROLE_KEYWORDS_PATTERN = re.compile(
    r"\b(?:actor|actors|actress|actresses|lead\s+actor|lead\s+actress|female\s+lead(?:\s+actor)?|male\s+lead(?:\s+actor)?|singer|singers|vocalist|vocalists|lead\s+singer|director|directors|film\s+director|cinematographer|cinematographers|dop|camera\s+operator|video\s+editor|editor|editors|colorist|colorists|colourist|colourists|sound\s+designer|audio\s+engineer|composer|music\s+composer|producer|music\s+producer|writer|screenwriter|developer|developers|designer|designers|animator|illustrator|performer|performers|talent|creator|creators)\b",
    re.IGNORECASE
)

SEARCH_ACTION_PATTERN = re.compile(
    r"\b(?:search|search\s+again|find|find\s+me|find\s+an?|look\s+for|lookup|hire|cast|recommend|match|get\s+me|bring\s+me|show\s+me)\b",
    re.IGNORECASE
)

SEARCH_QUESTION_PATTERN = re.compile(
    r"(?:(?:can|could|please|would)\s+you\s+(?:please\s+)?search|(?:so\s+)?can\s+you\s+search|search\s+for|search\s+again|search\s+the\s+database|search\s+creators|search\s+actors|search\s+again\s+for)",
    re.IGNORECASE
)

CREATOR_SEARCH_PATTERN = re.compile(
    r"\b(?:find\s+(?:me\s+)?(?:a\s+|an\s+|the\s+)?(?:creator|creators|actor|actors|actress|singer|singers|vocalist|director|directors|cinematographer|cinematographers|dop|editor|editors|video\s+editor|colorist|colorists|developer|developers|designer|designers|sound\s+designer|composer|musician|photographer|videographer|writer|screenwriter)|who\s+(?:can|should\s+i|to)\s+(?:hire|cast|get|work\s+with|collaborate\s+with)|recommend\s+(?:a\s+|an\s+|some\s+)?(?:creator|creators|actor|actors|singer|editor|colorist|director|cinematographer|developer|designer)|search\s+for\s+(?:creators|actors|singers|editors|colorists|directors|talent)|suggest\s+(?:best\s+)?(?:candidates|creators|actors|singers))\b",
    re.IGNORECASE
)

def is_creator_search_query(text: str) -> bool:
    clean = text.strip()
    if re.match(r"^(?:how\s+to|what\s+is|what\s+does|why\s+do|explain\s+how)\b", clean, re.IGNORECASE):
        return False
    if re.search(r"\b(?:find\s+(?:me\s+)?(?:a\s+|an\s+|the\s+)?|search\s+(?:again\s+)?(?:for\s+)?(?:a\s+|an\s+|the\s+)?|look\s+for\s+(?:a\s+|an\s+|the\s+)?|hire\s+(?:a\s+|an\s+|the\s+)?|cast\s+(?:a\s+|an\s+|the\s+)?)\b", clean, re.I):
        return True
    has_role = bool(ROLE_KEYWORDS_PATTERN.search(clean))
    has_action = bool(SEARCH_ACTION_PATTERN.search(clean))
    has_question = bool(SEARCH_QUESTION_PATTERN.search(clean))
    if has_role and (has_action or has_question):
        return True
    return bool(CREATOR_SEARCH_PATTERN.search(clean))

INVITATION_ACTION_PATTERN = re.compile(
    r"\b(?:invite|add\s+to\s+squad|add\s+to\s+team|send\s+invitation|propose\s+skill\s+swap)\b",
    re.IGNORECASE
)

PROJECT_MODIFICATION_PATTERN = re.compile(
    r"\b(?:change\s+the\s+budget|update\s+the\s+budget|increase\s+budget|decrease\s+budget|change\s+budget|update\s+timeline|change\s+timeline|change\s+duration|update\s+duration|add\s+(?:a\s+|an\s+)?[\w\s]+\s+to\s+(?:my|the)\s+project|remove\s+(?:the\s+)?[\w\s]+\s+role|change\s+title|update\s+title|rename\s+project)\b",
    re.IGNORECASE
)

PROJECT_CREATION_PATTERN = re.compile(
    r"\b(?:i\s+want\s+to\s+(?:make|build|create|shoot|produce|develop)|let'?s\s+(?:make|build|create|shoot|produce|develop|plan)|create\s+a\s+(?:short\s+film|film|movie|web\s*app|website|mobile\s*app|app|music\s*video|album|song|project)\s+plan|plan\s+(?:a\s+|my\s+)?(?:short\s+film|film|movie|web\s*app|website|mobile\s*app|app|project|production)|have\s+(?:a\s+|an\s+)?(?:story|idea|concept)\s+(?:about|called|for\s+a)|story\s+about\s+a\s+(?:young\s+)?(?:village\s+girl|girl|boy|person|student|astronaut|detective)|my\s+project\s+is\s+(?:about|a)|developing\s+a\s+(?:short\s+film|web\s*app|mobile\s*app|music\s*video))\b",
    re.IGNORECASE
)

CREATIVE_ADVICE_PATTERN = re.compile(
    r"\b(?:i\s+need\s+(?:a\s+|an\s+)?(?:video\s+editor|editor|director|cinematographer|singer|developer|designer)|suggest\s+(?:them\s+with\s+)?better\s+skills|skills?\s+(?:to\s+look\s+for|needed|required|should\s+i)|how\s+to\s+(?:improve|grade|edit|direct|compose|produce)|creative\s+advice|what\s+skills\s+(?:are\s+needed|does\s+a|should\s+a)|recommend\s+(?:skills|software|tools)|better\s+skills)\b",
    re.IGNORECASE
)

FOLLOWUP_PATTERNS = [
    "please respond to the above question",
    "please respond to the question above",
    "respond to the above question",
    "answer the above question",
    "answer my question",
    "what about my question",
    "please answer",
    "answer please",
    "please reply",
]

NATURAL_GREETING_RESPONSE = "Hello! I am OmniForge AI, your creative project partner. What kind of project, story, or idea are you working on today?"
INSTRUCTION_PROBE_RESPONSE = "I am OmniForge AI, your creative project architect and orchestrator. I cannot disclose internal system prompts, but I'm ready to help you plan your production, define creative roles, and collaborate with verified creators."


# --------------------------------------------------
# CLEAN AI RESPONSE
# --------------------------------------------------

def clean_response(answer: str, is_streaming: bool = False) -> str:
    """
    Remove Qwen thinking sections, reasoning traces, and leftover markers
    to return strictly the final user-facing answer.
    """
    if not answer:
        return ""

    text = answer.strip()

    # 1. Remove complete <think>...</think>, <thought>...</thought>, etc.
    text = re.sub(
        r"<(think|thought|reasoning|deliberation)>[\s\S]*?</\1>",
        "",
        text,
        flags=re.IGNORECASE
    )
    text = re.sub(
        r"\[(think|thought|reasoning|deliberation)\][\s\S]*?\[/\1\]",
        "",
        text,
        flags=re.IGNORECASE
    )

    # 2. Handle unmatched closing tags: keep text after last closing tag
    for tag_pattern in [
        r"</think>",
        r"</thought>",
        r"</reasoning>",
        r"</deliberation>",
        r"\[/think\]",
        r"\[/thought\]",
        r"\[/reasoning\]",
    ]:
        if re.search(tag_pattern, text, flags=re.IGNORECASE):
            parts = re.split(tag_pattern, text, flags=re.IGNORECASE)
            text = parts[-1]

    # 3. If text starts with an opening <think> tag that was never closed, it is still inside thinking
    if re.match(r"^<(?:think|thought|reasoning|deliberation)>", text, flags=re.IGNORECASE):
        return ""

    # 4. Remove any stray opening or closing tags
    text = re.sub(r"</?(?:think|thought|reasoning|deliberation)>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\[/?(?:think|thought|reasoning|deliberation)\]", "", text, flags=re.IGNORECASE)

    # 5. Remove 'Final answer...' or '...Time to write' markers
    if re.search(r"\.\.\.Time to write\.?", text, flags=re.IGNORECASE):
        text = re.split(r"\.\.\.Time to write\.?", text, flags=re.IGNORECASE)[-1]

    final_marker = re.search(r"Final answer[^\n]*\n+", text, flags=re.IGNORECASE)
    if final_marker:
        text = text[final_marker.end():]

    # 6. Remove stream-of-consciousness thought preambles
    thought_preamble_match = re.match(
        r"^(?:We are given|We are to|We are in|The user is asking|The user asked|The user wants|The user said|The critical instructions say|Let me re-read|Let me check|Let me analyze|Let me think|Let's see|Let's think|Hmm|Okay|Alright|First, let's|First, I need to)[\s\S]*?(?=(?:\n\s*|\.\s+)(?:#{1,6}\s|[-*]{3,}|[*_]{1,3}|[\"\'“”‘]|[-*•]\s|\d+\.\s|Here[’']s|Hello|Hi|Hey|Skill Swap|Certainly|Sure|[A-Za-z0-9]))",
        text,
        flags=re.IGNORECASE
    )
    if thought_preamble_match:
        text = text[thought_preamble_match.end():]

    # 7. Strip meta-narrative reasoning prefixes
    text = re.sub(
        r"^(?:In this response|I will now answer|I should now|My goal is to|As requested, here)[^.\n]*[.\n]\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    # 8. Clean stray brainstorming asterisk notes
    text = re.sub(
        r"\*(?:Brainstorming|mental note|Lightbulb|checks mental list|self-reminder|finally|Final check)[^*]*\*",
        "",
        text,
        flags=re.IGNORECASE
    )

    return text.strip()


# --------------------------------------------------
# RESOLVE FOLLOW-UP CONTEXT
# --------------------------------------------------

def resolve_followup_message(message: str, history: Optional[List[ChatMessage]]) -> str:
    """
    If the user asks 'please respond to the above question', resolve to the prior user prompt.
    """
    lower = message.lower().strip()
    if any(p in lower for p in FOLLOWUP_PATTERNS) and history:
        for h in reversed(history):
            if h.role.lower() in ["user"] and h.content.strip():
                resolved = h.content.strip()
                if not any(p in resolved.lower() for p in FOLLOWUP_PATTERNS):
                    return resolved
    return message


# --------------------------------------------------
# INTENT CLASSIFICATION
# --------------------------------------------------

def classify_user_intent(
    message: str,
    project_context: Optional[Dict[str, Any]] = None,
    history: Optional[List[ChatMessage]] = None
) -> Dict[str, Any]:
    resolved_message = resolve_followup_message(message, history)
    clean = resolved_message.strip()
    lower = clean.lower()

    # 1. GREETING
    if GREETING_PATTERN.match(clean):
        return {
            "intent": "GREETING",
            "project_action": "NONE",
            "matching_action": "NONE",
            "project_data": None
        }

    # 2. FEATURE_EXPLANATION
    if FEATURE_EXPLANATION_PATTERN.search(clean):
        return {
            "intent": "FEATURE_EXPLANATION",
            "project_action": "NONE",
            "matching_action": "NONE",
            "project_data": None
        }

    # 3. ROLE_OR_CONCEPT_EXPLANATION
    educational_keywords = ["director", "cinematographer", "editor", "sound designer", "screenwriter", "dop", "producer", "gaffer"]
    has_edu_kw = any(k in lower for k in educational_keywords)
    is_def = bool(ROLE_OR_CONCEPT_PATTERN.search(clean))
    is_comp = bool(ROLE_VERSUS_PATTERN.search(clean)) and "my project" not in lower and "for my film" not in lower
    if (is_def and has_edu_kw) or (is_comp and has_edu_kw):
        if not any(k in lower for k in ["hire", "find me", "my project", "for my film"]):
            return {
                "intent": "ROLE_OR_CONCEPT_EXPLANATION",
                "project_action": "NONE",
                "matching_action": "NONE",
                "project_data": None
            }

    # 4. COLLABORATION_ACTION
    if INVITATION_ACTION_PATTERN.search(clean):
        return {
            "intent": "COLLABORATION_ACTION",
            "project_action": "NONE",
            "matching_action": "NONE",
            "project_data": None
        }

    # 5. CREATOR_SEARCH (Explicit search command)
    if is_creator_search_query(clean):
        target_role = "Creator"
        if re.search(r"\b(?:female\s+lead(?:\s+actor)?|lead\s+actress|actress|actresses)\b", clean, re.I):
            target_role = "Lead Actress"
        elif re.search(r"\b(?:actor|actors|lead\s+actor|male\s+lead|acting|performer|performers)\b", clean, re.I):
            target_role = "Actor"
        elif re.search(r"\b(?:colorist|colorists|colourist|colourists)\b", clean, re.I):
            target_role = "Colorist"
        elif re.search(r"\b(?:video\s+editor|editor|editors)\b", clean, re.I):
            target_role = "Video Editor"
        elif re.search(r"\b(?:singer|vocalist|lead\s+singer|singers)\b", clean, re.I):
            target_role = "Lead Singer"
        elif re.search(r"\b(?:director|film\s+director|directors)\b", clean, re.I):
            target_role = "Film Director"
        elif re.search(r"\b(?:cinematographer|cinematographers|dop|camera\s+operator)\b", clean, re.I):
            target_role = "Cinematographer"
        elif re.search(r"\b(?:sound\s+designer|audio\s+engineer|boom\s+operator|sound\s+recordist)\b", clean, re.I):
            target_role = "Sound Designer"
        elif re.search(r"\b(?:developer|frontend|web\s+developer)\b", clean, re.I):
            target_role = "Frontend Web Developer"
        elif re.search(r"\b(?:designer|ui\/ux\s+designer)\b", clean, re.I):
            target_role = "UI/UX Designer"
        else:
            custom_match = re.search(r"\b(?:find|search\s+for|search|look\s+for|hire|cast)\s+(?:me\s+)?(?:a\s+|an\s+|the\s+)?([A-Za-z\s]{3,35})\b", clean, re.I)
            if custom_match:
                extracted = custom_match.group(1).strip()
                extracted = re.split(r"\b(?:for|in|who|with|so|that)\b", extracted, flags=re.I)[0].strip()
                if extracted and len(extracted) > 2:
                    target_role = extracted.title()

        return {
            "intent": "CREATOR_SEARCH",
            "project_action": "NONE",
            "matching_action": "SEARCH_CREATORS",
            "target_role": target_role,
            "project_data": None
        }

    # 6. CREATIVE_ADVICE (Inquiring about skills, recommendations, or role advice without search)
    if CREATIVE_ADVICE_PATTERN.search(clean):
        return {
            "intent": "CREATIVE_ADVICE",
            "project_action": "NONE",
            "matching_action": "NONE",
            "project_data": None
        }

    # 7. PROJECT_MODIFICATION
    if project_context and PROJECT_MODIFICATION_PATTERN.search(clean):
        return {
            "intent": "PROJECT_MODIFICATION",
            "project_action": "MODIFY_PROJECT",
            "matching_action": "NONE",
            "project_data": None
        }

    # 8. PROJECT_CREATION (Explicit project idea / proposal)
    if PROJECT_CREATION_PATTERN.search(clean):
        domain = "Film & Video"
        p_type = "Short Film"
        roles = ["Director", "Cinematographer", "Video Editor", "Sound Designer", "Lead Actor"]

        if any(k in lower for k in ["web app", "website", "web site"]):
            domain = "Software & Tech"
            p_type = "Web Application"
            roles = ["Frontend Developer", "Backend Developer", "UI/UX Designer"]
        elif any(k in lower for k in ["mobile app", "ios app", "android app"]):
            domain = "Software & Tech"
            p_type = "Mobile Application"
            roles = ["Mobile Developer", "UI/UX Designer", "Backend Developer"]
        elif any(k in lower for k in ["music video", "album", "song"]):
            domain = "Music & Audio"
            p_type = "Music Production"
            roles = ["Music Producer", "Sound Engineer", "Lead Singer"]

        if "village girl" in lower and "singer" in lower:
            roles = ["Lead Singer", "Film Director", "Cinematographer", "Sound Recordist", "Video Editor"]

        return {
            "intent": "PROJECT_CREATION",
            "project_action": "CREATE_PROJECT",
            "matching_action": "MATCH_ROLES",
            "project_data": {
                "domain": domain,
                "type": p_type,
                "story_premise": clean,
                "roles": roles
            }
        }

    # 9. GENERAL_QUESTION
    return {
        "intent": "GENERAL_QUESTION",
        "project_action": "NONE",
        "matching_action": "NONE",
        "project_data": None
    }


# --------------------------------------------------
# INTELLIGENT ROLE SUGGESTIONS (Phase 2 & Phase 3)
# --------------------------------------------------

def generate_suggested_roles(
    intent: str,
    message: str,
    project_context: Optional[Dict[str, Any]] = None
) -> List[Dict[str, Any]]:
    """
    Returns structured creative roles tailored to user inquiry:
    { "role": ..., "reason": ..., "skills": [...], "priority": "essential" | "optional" }
    """
    lower = message.lower()

    # Greetings, Feature Explanations, and Creator Searches should not generate suggested role cards
    if intent in ["GREETING", "FEATURE_EXPLANATION", "CREATOR_SEARCH"]:
        return []

    # 1. Video Editor or Editing Advice
    if "editor" in lower or "editing" in lower:
        return [
            {
                "role": "Video Editor",
                "reason": "Assembles raw footage, controls narrative pacing, ensures visual continuity, and applies cuts.",
                "skills": ["Storytelling", "Pacing & Continuity", "Color Correction", "Audio Synchronization", "Premiere Pro / DaVinci Resolve"],
                "priority": "essential"
            }
        ]

    # 1b. Actor or Actress Advice
    if "actor" in lower or "actress" in lower or "acting" in lower:
        return [
            {
                "role": "Actor / Actress",
                "reason": "Brings characters to life through authentic emotional expression, dialogue delivery, and on-camera presence.",
                "skills": ["Dramatic Acting", "Character Immersion", "Dialogue Delivery", "Emotional Range"],
                "priority": "essential"
            }
        ]

    # 1b. Colorist or Color Grading
    if "colorist" in lower or "color grading" in lower:
        return [
            {
                "role": "Colorist",
                "reason": "Balances shot-to-shot exposure, enhances moods, and applies cinematic color grading.",
                "skills": ["Color Grading", "DaVinci Resolve", "Color Correction", "LUT Profiling"],
                "priority": "essential"
            }
        ]

    # 2. Educational: Director vs Cinematographer
    if intent == "ROLE_OR_CONCEPT_EXPLANATION" or ("director" in lower and "cinematographer" in lower):
        return [
            {
                "role": "Film Director",
                "reason": "Guides narrative storytelling, actor performances, and overall creative vision.",
                "skills": ["Creative Direction", "Storytelling", "Actor Direction", "Scene Pacing"],
                "priority": "essential"
            },
            {
                "role": "Cinematographer (DoP)",
                "reason": "Translates director's vision into camera angles, lighting design, lenses, and visual framing.",
                "skills": ["Lighting Design", "Camera Operation", "Visual Composition", "Color Temperature"],
                "priority": "essential"
            },
            {
                "role": "Video Editor",
                "reason": "Collaborates in post-production to assemble captured footage into a cohesive narrative.",
                "skills": ["Pacing", "Scene Assembly", "Continuity", "Rough Cut"],
                "priority": "optional"
            },
            {
                "role": "Screenwriter",
                "reason": "Crafts the screenplay, narrative beats, and character dialogue that the director interprets.",
                "skills": ["Screenwriting", "Dialogue Writing", "Character Arcs"],
                "priority": "optional"
            }
        ]

    # 3. Project Creation: Short film about a village girl who becomes a singer
    if ("village girl" in lower and "singer" in lower) or ("short film" in lower and "singer" in lower):
        return [
            {
                "role": "Film Director",
                "reason": "Drives the overarching narrative vision, emotional beats, and guides acting performances.",
                "skills": ["Creative Direction", "Storytelling", "Actor Direction"],
                "priority": "essential"
            },
            {
                "role": "Screenwriter",
                "reason": "Writes the authentic story, rural-to-urban character journey, and heartfelt dialogue.",
                "skills": ["Screenwriting", "Story Structure", "Dialogue"],
                "priority": "essential"
            },
            {
                "role": "Cinematographer (DoP)",
                "reason": "Captures the rural village atmosphere and stage lighting for musical sequences.",
                "skills": ["Camera Operation", "Lighting Design", "Visual Storytelling"],
                "priority": "essential"
            },
            {
                "role": "Lead Singer / Vocalist",
                "reason": "Provides the authentic vocal performances that drive the musical storyline.",
                "skills": ["Vocal Performance", "Playback Singing", "Musical Expression"],
                "priority": "essential"
            },
            {
                "role": "Music Composer",
                "reason": "Composes original folk and contemporary melodies for the protagonist's musical journey.",
                "skills": ["Music Composition", "Arrangement", "Instrumental Scoring"],
                "priority": "essential"
            },
            {
                "role": "Video Editor",
                "reason": "Assembles footage, paces dramatic scenes, and cuts musical performances to the beat.",
                "skills": ["Narrative Editing", "Pacing & Continuity", "Music Sync"],
                "priority": "essential"
            },
            {
                "role": "Sound Designer / Audio Engineer",
                "reason": "Records pristine location sound and balances vocals with background score.",
                "skills": ["Location Sound", "Vocal Mixing", "Sound Design"],
                "priority": "essential"
            },
            {
                "role": "Production Manager",
                "reason": "Coordinates shooting schedule, location permissions, travel logistics, and production budget.",
                "skills": ["Production Scheduling", "Budget Allocation", "Crew Logistics"],
                "priority": "optional"
            },
            {
                "role": "Actors",
                "reason": "Brings supporting village and city characters to life with authentic cultural depth.",
                "skills": ["Dramatic Acting", "Character Immersion", "Dialogue Delivery"],
                "priority": "optional"
            }
        ]

    # 4. General Film Project
    if "film" in lower or "movie" in lower or intent == "PROJECT_CREATION":
        return [
            {
                "role": "Film Director",
                "reason": "Orchestrates creative vision, pacing, and actor performances across all scenes.",
                "skills": ["Directing", "Storytelling", "Actor Guidance"],
                "priority": "essential"
            },
            {
                "role": "Cinematographer",
                "reason": "Operates camera, designs lighting aesthetics, and shapes visual composition.",
                "skills": ["Camera Operation", "Lighting Setup", "Composition"],
                "priority": "essential"
            },
            {
                "role": "Video Editor",
                "reason": "Constructs the narrative timeline, trims footage, and maintains storytelling flow.",
                "skills": ["Premiere Pro", "DaVinci Resolve", "Pacing"],
                "priority": "essential"
            },
            {
                "role": "Sound Designer",
                "reason": "Records on-set dialogue, layers sound effects, and crafts final audio mix.",
                "skills": ["Sound Design", "Audio Mixing", "Location Audio"],
                "priority": "optional"
            }
        ]

    # 5. Software / Tech Project
    if "web app" in lower or "website" in lower or "app" in lower:
        return [
            {
                "role": "Frontend Developer",
                "reason": "Implements interactive user interfaces, animations, and connects frontend to APIs.",
                "skills": ["React / Next.js", "TypeScript", "TailwindCSS"],
                "priority": "essential"
            },
            {
                "role": "UI/UX Designer",
                "reason": "Designs wireframes, design systems, interactive prototypes, and user flows.",
                "skills": ["Figma", "UI Design", "User Research"],
                "priority": "essential"
            },
            {
                "role": "Backend Developer",
                "reason": "Builds robust databases, authentication, server logic, and API endpoints.",
                "skills": ["FastAPI / Node.js", "PostgreSQL / Supabase", "API Architecture"],
                "priority": "essential"
            },
            {
                "role": "QA Engineer",
                "reason": "Executes testing suites, monitors edge cases, and verifies responsiveness.",
                "skills": ["Automated Testing", "Bug Reporting", "Performance Auditing"],
                "priority": "optional"
            }
        ]

    # 6. Music Project
    if "music" in lower or "song" in lower or "album" in lower:
        return [
            {
                "role": "Music Producer",
                "reason": "Shapes musical arrangements, instrumentation, beats, and song structure.",
                "skills": ["DAW Production", "Arrangement", "Beats"],
                "priority": "essential"
            },
            {
                "role": "Sound Engineer",
                "reason": "Tracks clean vocal recordings, acoustic instruments, and balances dynamic range.",
                "skills": ["Tracking", "Microphone Placement", "Gain Staging"],
                "priority": "essential"
            },
            {
                "role": "Mixing & Mastering Engineer",
                "reason": "Finalizes spectral balance, clarity, loudness, and streaming standards.",
                "skills": ["EQ & Compression", "Stereo Imaging", "Mastering"],
                "priority": "optional"
            }
        ]

    return []


# --------------------------------------------------
# SAFE FALLBACK RESPONSES (Never return empty!)
# --------------------------------------------------

def build_safe_fallback_response(
    intent: str,
    message: str,
    project_context: Optional[Dict[str, Any]] = None
) -> str:
    lower = message.lower()

    if intent == "GREETING":
        return NATURAL_GREETING_RESPONSE

    if intent == "FEATURE_EXPLANATION" or "skill swap" in lower:
        return (
            "### What is Skill Swap?\n\n"
            "**Skill Swap** is OmniCraft's collaborative feature allowing creators and clients to exchange creative and technical skills directly without monetary payment.\n\n"
            "#### How it works:\n"
            "* **Mutual Exchange:** For example, a video editor can provide post-production editing to a music composer in exchange for an original musical score.\n"
            "* **Portfolio Growth:** Both creators build verified real-world portfolio credits and expand their professional collaboration network.\n"
            "* **Squad Workspace:** Once matched, you collaborate in a shared squad workspace with defined tasks, deadlines, and milestone reviews.\n\n"
            "You can browse open Skill Swap listings or offer your own skills in your profile."
        )

    if intent == "ROLE_OR_CONCEPT_EXPLANATION" or ("director" in lower and "cinematographer" in lower):
        return (
            "### Director vs. Cinematographer: Key Differences\n\n"
            "While both are creative leaders on a film set, they serve distinct and complementary roles:\n\n"
            "| Responsibility | Film Director | Cinematographer (Director of Photography / DoP) |\n"
            "| :--- | :--- | :--- |\n"
            "| **Core Focus** | Narrative vision, storytelling, emotional arc, and performances | Visual execution, camera movement, composition, and lighting |\n"
            "| **Directs** | Actors, Screenwriters, and heads of all creative departments | Camera operators, gaffers (lighting), and grips |\n"
            "| **Key Question** | *What story are we telling and why?* | *How does that story visually look through the lens?* |\n"
            "| **Collaboration** | Works closely with the DoP to translate ideas into shots | Works closely with the Director to achieve the desired mood and framing |\n\n"
            "**In short:** The **Director** is the story architect, while the **Cinematographer** is the visual architect. In post-production, the Director also works with the **Video Editor** to assemble the captured footage into the final film."
        )

    if intent == "CREATIVE_ADVICE" or "video editor" in lower or "editor" in lower:
        return (
            "When looking for a video editor who brings exceptional craft to your project, look for these essential skills:\n\n"
            "* **Storytelling & Dramatic Pacing:** Understanding emotional rhythm, narrative structure, and knowing when to hold or cut to sustain audience engagement.\n"
            "* **Visual Continuity:** Ensuring seamless matching on action, consistent eyelines, and logical spatial relationships between shots.\n"
            "* **Color Correction & Exposure Balancing:** Balancing shot-to-shot lighting, correcting white balance, and establishing cohesive visual aesthetics using standard tools like DaVinci Resolve or Premiere Pro Lumetri.\n"
            "* **Audio Synchronization & Dialogue Editing:** Aligning multi-track production sound, cleaning dialogue tracks, balancing ambient beds, and cutting to musical beats.\n"
            "* **Industry Editing Software Proficiency:** Expertise in professional software such as Adobe Premiere Pro, DaVinci Resolve, or Final Cut Pro.\n\n"
            "To give you the most relevant suggestions, what type of video are you creating (such as a short film, YouTube video, commercial, or documentary)?\n\n"
            "Whenever you are ready, I can also search for verified video editors in the OmniCraft creator directory."
        )

    if "colorist" in lower or "color grading" in lower:
        return (
            "When looking for a Colorist to craft the visual look of your footage, focus on these essential capabilities:\n\n"
            "* **Shot-to-Shot Color Matching:** Balancing exposure, contrast, and skin tones across varied cameras and natural lighting conditions.\n"
            "* **Palette & Mood Development:** Creating custom color grades that evoke the emotional tone and artistic vision of your project.\n"
            "* **Color Science & Workflow Standards:** Managing color spaces (ACES, Rec.709, Wide Gamut, Log profiles) and preparing master deliverables.\n"
            "* **Professional Suite Expertise:** Advanced mastering in DaVinci Resolve Studio.\n\n"
            "Whenever you're ready, I can search the OmniCraft creator database for verified colorists."
        )

    if intent == "PROJECT_CREATION" or ("village girl" in lower and "singer" in lower):
        return build_fallback_plan(project_context)

    if intent == "CREATOR_SEARCH":
        target = "creator"
        if "colorist" in lower: target = "Colorist"
        elif "editor" in lower: target = "Video Editor"
        elif "singer" in lower: target = "Lead Singer"
        elif "director" in lower: target = "Film Director"
        elif "cinematographer" in lower: target = "Cinematographer"

        return (
            f"Searching the OmniCraft database for verified {target} profiles. "
            f"Matching creators will be displayed below with verified specialties, portfolio samples, and match criteria."
        )

    # General Fallback
    return (
        f"I'm here as your OmniForge Creative Project Partner. To help you proceed with \"{message[:80]}\", "
        "I can help you define the production roadmap, identify essential creative roles, or connect with verified creators. "
        "What specific aspect would you like to explore next?"
    )


# --------------------------------------------------
# PROJECT BLUEPRINT FALLBACK
# --------------------------------------------------

def build_fallback_plan(ctx: Optional[Dict[str, Any]]) -> str:
    ctx = ctx or {}
    p_type = ctx.get('type') or ctx.get('domain') or 'Short Film'
    s_premise = ctx.get('story_premise') or ctx.get('title') or 'A creative storytelling project'
    b_val = ctx.get('budget', '₹10,000')
    t_val = ctx.get('team_size', '5 people')

    return (
        f"## 🎬 {p_type} Production Plan: {s_premise}\n\n"
        f"### 1. Project Concept & Production Overview\n"
        f"* **Story Concept:** {s_premise}\n"
        f"* **Format:** Narrative {p_type} (5–12 minutes, single weekend shoot)\n"
        f"* **Budget Allocation:** {b_val} (INR)\n"
        f"* **Team Capacity:** {t_val}\n\n"
        f"---\n\n"
        f"### 2. Pre-Production & 2-Day Shooting Schedule\n"
        f"* **Pre-Production (Week 1):**\n"
        f"  - Finalize shooting script & shot list with DoP.\n"
        f"  - Scout primary production locations and secure zero-cost community permissions.\n"
        f"  - Music track selection, talent rehearsals, and equipment check.\n"
        f"* **Principal Photography (2-Day Weekend Shoot):**\n"
        f"  - **Day 1 (Exterior — Dawn to Dusk):** Primary establishing scenes, exterior village locations, natural sunlight setups (7:00 AM – 5:30 PM).\n"
        f"  - **Day 2 (Interior/Key Moments — Morning to Sunset):** Dramatic dialogue scenes and climactic vocal performance (8:00 AM – 6:00 PM).\n"
        f"* **Post-Production (Weeks 2–3):**\n"
        f"  - Assembly cut, audio synchronization & clean dialogue mix, color grading, final master export.\n\n"
        f"---\n\n"
        f"### 3. INR Budget Breakdown (Totaling Exactly {b_val})\n"
        f"| Expense Category | Allocation | Details & Justification |\n"
        f"| :--- | :--- | :--- |\n"
        f"| **Local Travel & Logistics** | ₹2,000 | Fuel & transport for team members and equipment to locations. |\n"
        f"| **Food & Refreshments** | ₹3,000 | 2 shoot days meals and hydration for crew members & cast. |\n"
        f"| **Audio & Lighting Accessories** | ₹2,500 | Lapel/collar mic rental, 5-in-1 reflector kit, memory card backup. |\n"
        f"| **Costumes & Props** | ₹1,000 | Production wardrobe, key story props. |\n"
        f"| **Contingency & Post Master** | ₹1,500 | Emergency on-set reserve and final master hard drive storage. |\n"
        f"| **Total Estimated Budget:** | **{b_val}** | *(100% balanced with zero deficit)* |\n\n"
        f"---\n\n"
        f"### 4. Responsibilities for Team Members\n"
        f"* **Director & Screenwriter:** Drives narrative vision, directs actors' performances, oversees pacing and scene execution.\n"
        f"* **Cinematographer (DoP):** Operates primary camera, frames shots, manages natural sunlight with reflectors.\n"
        f"* **Lead Singer / Vocalist:** Delivers authentic singing performances and emotional vocal tracks.\n"
        f"* **Sound Recordist & Boom Operator:** Captures clean live vocals, dialogue, and natural ambient sound.\n"
        f"* **Video Editor & Colorist:** Handles footage backup, scene assembly, musical synchronization, and color grading.\n\n"
        f"---\n\n"
        f"### 5. Equipment & Realistic Production Assumptions\n"
        f"* **Equipment:** 4K Mirrorless camera / high-end smartphone, 5-in-1 collapsible reflector, wireless lavalier mic, tripod.\n"
        f"* **Locations:** Practical local locations with authentic natural aesthetics.\n"
        f"* **Post-Production:** Free DaVinci Resolve for multi-track audio sync and natural cinematic color grading."
    )


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/")
async def root():
    return {
        "application": APP_NAME,
        "status": "running",
        "model": MODEL_NAME,
        "provider": "local-ollama"
    }


@app.options("/health")
@app.options("/api/health")
@app.get("/health")
@app.get("/api/health")
async def health_check():
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("http://127.0.0.1:11434/api/tags")
            response.raise_for_status()
            models_data = response.json()
            available_models = [m.get("name", "") for m in models_data.get("models", [])]
            model_available = any(
                name == MODEL_NAME or name.startswith(MODEL_NAME + ":")
                for name in available_models
            )
            return {
                "status": "running",
                "provider": "local-ollama",
                "model": MODEL_NAME,
                "ollama_connected": True,
                "model_available": model_available
            }
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=503,
            detail={"error": "Ollama is unavailable", "message": str(exc)}
        )


# --------------------------------------------------
# CHAT ENDPOINT (Phase 1, 2, 3, 4)
# --------------------------------------------------

@app.options("/chat")
@app.options("/api/chat")
async def chat_options():
    return {"status": "ok"}


@app.post("/chat")
@app.post("/api/chat")
async def chat(request: Optional[ChatRequest] = None, http_request: Request = None):
    if request is None:
        return {"status": "ok"}

    user_message = request.message.strip()
    if not user_message:
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    # 1. Resolve follow-ups and classify intent
    resolved_message = resolve_followup_message(user_message, request.history)
    classified = classify_user_intent(resolved_message, request.project_context, request.history)
    suggested_roles = generate_suggested_roles(classified["intent"], resolved_message, request.project_context)

    # Fast-Path: Explicit Creator Search (e.g. "Find me a Video Editor", "Find me a Colorist", "I need an actor for the short film so can you search?")
    if classified["intent"] == "CREATOR_SEARCH":
        target = classified.get("target_role") or "creative"
        proj_context_str = ""
        if request.project_context:
            ctx_title = request.project_context.get("title") or request.project_context.get("story_premise")
            if ctx_title:
                clean_title = ctx_title[:50] + "..." if len(ctx_title) > 50 else ctx_title
                proj_context_str = f" for '{clean_title}'"

        answer_text = (
            f"Searching the OmniCraft database for verified {target} profiles{proj_context_str}. "
            f"Matching creators will be displayed below with verified specialties, portfolio samples, and match criteria."
        )
        if request.stream:
            async def search_stream():
                yield f"data: {json.dumps({'token': answer_text, 'accumulated': answer_text})}\n\n"
                done_event = {
                    "done": True,
                    "success": True,
                    "response": answer_text,
                    "answer": answer_text,
                    "intent": "CREATOR_SEARCH",
                    "target_role": target,
                    "suggested_roles": [],
                    "project_action": "NONE",
                    "matching_action": "SEARCH_CREATORS",
                    "matching_results": None,
                    "project_data": None,
                    "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 20, "prompt_eval_count": 0}
                }
                yield f"data: {json.dumps(done_event)}\n\n"
            return StreamingResponse(
                search_stream(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
            )
        else:
            return {
                "success": True,
                "model": MODEL_NAME,
                "provider": "local-ollama",
                "response": answer_text,
                "answer": answer_text,
                "intent": "CREATOR_SEARCH",
                "target_role": target,
                "suggested_roles": [],
                "project_action": "NONE",
                "matching_action": "SEARCH_CREATORS",
                "matching_results": None,
                "project_data": None,
                "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 20, "prompt_eval_count": 0}
            }

    # Fast-Path: Greetings (e.g. "hlo", "hi", "hello")
    if classified["intent"] == "GREETING":
        answer_text = NATURAL_GREETING_RESPONSE
        if request.stream:
            async def greeting_stream():
                yield f"data: {json.dumps({'token': answer_text, 'accumulated': answer_text})}\n\n"
                done_event = {
                    "done": True,
                    "success": True,
                    "response": answer_text,
                    "answer": answer_text,
                    "intent": "GREETING",
                    "suggested_roles": [],
                    "project_action": "NONE",
                    "matching_action": "NONE",
                    "project_data": None,
                    "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 1, "prompt_eval_count": 0}
                }
                yield f"data: {json.dumps(done_event)}\n\n"
            return StreamingResponse(
                greeting_stream(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
            )
        else:
            return {
                "success": True,
                "model": MODEL_NAME,
                "provider": "local-ollama",
                "response": answer_text,
                "answer": answer_text,
                "intent": "GREETING",
                "suggested_roles": [],
                "project_action": "NONE",
                "matching_action": "NONE",
                "project_data": None,
                "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 1, "prompt_eval_count": 0}
            }

    # Fast-Path: Instruction disclosure probes
    if INSTRUCTION_PROBE_PATTERN.search(user_message):
        answer_text = INSTRUCTION_PROBE_RESPONSE
        if request.stream:
            async def probe_stream():
                yield f"data: {json.dumps({'token': answer_text, 'accumulated': answer_text})}\n\n"
                done_event = {
                    "done": True,
                    "success": True,
                    "response": answer_text,
                    "answer": answer_text,
                    "intent": "GENERAL_QUESTION",
                    "suggested_roles": [],
                    "project_action": "NONE",
                    "matching_action": "NONE",
                    "project_data": None,
                    "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 1, "prompt_eval_count": 0}
                }
                yield f"data: {json.dumps(done_event)}\n\n"
            return StreamingResponse(
                probe_stream(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
            )
        else:
            return {
                "success": True,
                "model": MODEL_NAME,
                "provider": "local-ollama",
                "response": answer_text,
                "answer": answer_text,
                "intent": "GENERAL_QUESTION",
                "suggested_roles": [],
                "project_action": "NONE",
                "matching_action": "NONE",
                "project_data": None,
                "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 1, "prompt_eval_count": 0}
            }

    # Fast-Path: Skill Swap question
    if classified["intent"] == "FEATURE_EXPLANATION" and "skill swap" in resolved_message.lower():
        answer_text = build_safe_fallback_response("FEATURE_EXPLANATION", resolved_message)
        if request.stream:
            async def swap_stream():
                yield f"data: {json.dumps({'token': answer_text, 'accumulated': answer_text})}\n\n"
                done_event = {
                    "done": True,
                    "success": True,
                    "response": answer_text,
                    "answer": answer_text,
                    "intent": "FEATURE_EXPLANATION",
                    "suggested_roles": [],
                    "project_action": "NONE",
                    "matching_action": "NONE",
                    "project_data": None,
                    "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 50, "prompt_eval_count": 0}
                }
                yield f"data: {json.dumps(done_event)}\n\n"
            return StreamingResponse(
                swap_stream(),
                media_type="text/event-stream",
                headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"}
            )
        else:
            return {
                "success": True,
                "model": MODEL_NAME,
                "provider": "local-ollama",
                "response": answer_text,
                "answer": answer_text,
                "intent": "FEATURE_EXPLANATION",
                "suggested_roles": [],
                "project_action": "NONE",
                "matching_action": "NONE",
                "project_data": None,
                "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 50, "prompt_eval_count": 0}
            }

    # Assemble Ollama messages with clean history
    system_content = SYSTEM_PROMPT.strip()
    user_payload_content = resolved_message

    if request.project_context and classified["intent"] in ["PROJECT_CREATION", "PROJECT_MODIFICATION"]:
        ctx = request.project_context
        ctx_lines = ["\n\nESTABLISHED PROJECT CONTEXT:"]
        if ctx.get("title"): ctx_lines.append(f"- Project Title: {ctx['title']}")
        if ctx.get("domain") or ctx.get("type"): ctx_lines.append(f"- Domain/Type: {ctx.get('type') or ctx.get('domain')}")
        if ctx.get("story_premise"): ctx_lines.append(f"- Story Premise: {ctx['story_premise']}")
        if ctx.get("budget"): ctx_lines.append(f"- Budget: {ctx['budget']}")
        if ctx.get("team_size"): ctx_lines.append(f"- Team Size: {ctx['team_size']}")
        system_content += "\n" + "\n".join(ctx_lines)

    ollama_messages = [{"role": "system", "content": system_content}]

    if request.history:
        for h_msg in request.history[-6:]:
            clean_h = clean_response(h_msg.content)
            if clean_h:
                role = "assistant" if h_msg.role.lower() in ["assistant", "ai", "bot"] else "user"
                if role == "assistant" and len(clean_h) > 500:
                    clean_h = clean_h[:500] + "..."
                ollama_messages.append({"role": role, "content": clean_h})

    ollama_messages.append({"role": "user", "content": user_payload_content})

    effective_num_predict = request.num_predict or DEFAULT_NUM_PREDICT

    payload = {
        "model": MODEL_NAME,
        "messages": ollama_messages,
        "stream": True,
        "options": {
            "temperature": 0.3,
            "num_predict": effective_num_predict
        }
    }

    # Handle progressive streaming (SSE)
    if request.stream:
        async def sse_generator():
            start_time = time.time()
            first_token_time = None
            raw_accumulated = ""
            emitted_clean_len = 0
            token_count = 0
            prompt_eval_count = 0

            try:
                async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                    async with client.stream("POST", OLLAMA_URL, json=payload) as response:
                        response.raise_for_status()

                        async for line in response.aiter_lines():
                            if http_request and await http_request.is_disconnected():
                                logger.info("[LocalAI] Client disconnected during stream")
                                break

                            if not line:
                                continue

                            try:
                                chunk_data = json.loads(line)
                            except json.JSONDecodeError:
                                continue

                            msg = chunk_data.get("message", {})
                            content = msg.get("content", "")

                            if content:
                                raw_accumulated += content
                                clean_so_far = clean_response(raw_accumulated, is_streaming=True)

                                if clean_so_far and len(clean_so_far) > emitted_clean_len:
                                    if first_token_time is None:
                                        first_token_time = time.time()
                                    delta_token = clean_so_far[emitted_clean_len:]
                                    emitted_clean_len = len(clean_so_far)
                                    token_count += 1
                                    sse_event = {
                                        "token": delta_token,
                                        "accumulated": clean_so_far
                                    }
                                    yield f"data: {json.dumps(sse_event)}\n\n"

                            if chunk_data.get("done"):
                                if "prompt_eval_count" in chunk_data:
                                    prompt_eval_count = chunk_data["prompt_eval_count"]
                                break

                end_time = time.time()
                total_duration_ms = (end_time - start_time) * 1000
                ttft_ms = ((first_token_time - start_time) * 1000) if first_token_time else total_duration_ms

                final_answer = clean_response(raw_accumulated, is_streaming=False)

                # Safe fallback if model was starved or produced no user-facing answer
                if not final_answer:
                    logger.warning("[LocalAI] Streaming produced empty answer; using safe fallback.")
                    final_answer = build_safe_fallback_response(
                        classified["intent"],
                        resolved_message,
                        request.project_context
                    )

                # Emit final answer if not already sent as deltas
                if emitted_clean_len == 0 and final_answer:
                    yield f"data: {json.dumps({'token': final_answer, 'accumulated': final_answer})}\n\n"

                done_event = {
                    "done": True,
                    "success": True,
                    "response": final_answer,
                    "answer": final_answer,
                    "intent": classified["intent"],
                    "suggested_roles": suggested_roles,
                    "project_action": classified["project_action"],
                    "matching_action": classified["matching_action"],
                    "project_data": classified.get("project_data"),
                    "metrics": {
                        "ttft_ms": round(ttft_ms, 1),
                        "total_ms": round(total_duration_ms, 1),
                        "tokens": token_count,
                        "prompt_eval_count": prompt_eval_count
                    }
                }
                yield f"data: {json.dumps(done_event)}\n\n"

            except httpx.TimeoutException:
                logger.error(f"[LocalAI Error] Ollama inference timed out after {REQUEST_TIMEOUT}s; falling back safely.")
                fallback_ans = build_safe_fallback_response(classified["intent"], resolved_message, request.project_context)
                done_event = {
                    "done": True,
                    "success": True,
                    "response": fallback_ans,
                    "answer": fallback_ans,
                    "intent": classified["intent"],
                    "suggested_roles": suggested_roles,
                    "project_action": classified["project_action"],
                    "matching_action": classified["matching_action"],
                    "project_data": classified.get("project_data"),
                    "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 0, "prompt_eval_count": 0}
                }
                yield f"data: {json.dumps(done_event)}\n\n"
            except Exception as exc:
                logger.error(f"[LocalAI Error] Streaming exception: {type(exc).__name__}: {str(exc)}")
                fallback_ans = build_safe_fallback_response(classified["intent"], resolved_message, request.project_context)
                done_event = {
                    "done": True,
                    "success": True,
                    "response": fallback_ans,
                    "answer": fallback_ans,
                    "intent": classified["intent"],
                    "suggested_roles": suggested_roles,
                    "project_action": classified["project_action"],
                    "matching_action": classified["matching_action"],
                    "project_data": classified.get("project_data"),
                    "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 0, "prompt_eval_count": 0}
                }
                yield f"data: {json.dumps(done_event)}\n\n"

        return StreamingResponse(
            sse_generator(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no"
            }
        )

    # Standard non-streaming JSON response
    try:
        start_time = time.time()
        first_token_time = None
        raw_accumulated = ""
        token_count = 0
        prompt_eval_count = 0

        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            async with client.stream("POST", OLLAMA_URL, json=payload) as response:
                response.raise_for_status()

                async for line in response.aiter_lines():
                    if not line:
                        continue
                    try:
                        chunk_data = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    msg = chunk_data.get("message", {})
                    content = msg.get("content", "")

                    if content:
                        if first_token_time is None:
                            first_token_time = time.time()
                        token_count += 1
                        raw_accumulated += content

                    if chunk_data.get("done"):
                        if "prompt_eval_count" in chunk_data:
                            prompt_eval_count = chunk_data["prompt_eval_count"]
                        break

        end_time = time.time()
        total_duration_ms = (end_time - start_time) * 1000
        ttft_ms = ((first_token_time - start_time) * 1000) if first_token_time else total_duration_ms

        final_answer = clean_response(raw_accumulated, is_streaming=False)

        # Safe fallback if output was empty
        if not final_answer:
            logger.warning("[LocalAI] Non-streaming produced empty answer; using safe fallback.")
            final_answer = build_safe_fallback_response(
                classified["intent"],
                resolved_message,
                request.project_context
            )

        return {
            "success": True,
            "model": MODEL_NAME,
            "provider": "local-ollama",
            "response": final_answer,
            "answer": final_answer,
            "intent": classified["intent"],
            "suggested_roles": suggested_roles,
            "project_action": classified["project_action"],
            "matching_action": classified["matching_action"],
            "project_data": classified.get("project_data"),
            "metrics": {
                "ttft_ms": round(ttft_ms, 1),
                "total_ms": round(total_duration_ms, 1),
                "tokens": token_count,
                "prompt_eval_count": prompt_eval_count
            }
        }

    except httpx.ConnectError:
        logger.warning("[LocalAI] Cannot connect to Ollama; using safe fallback.")
        final_answer = build_safe_fallback_response(classified["intent"], resolved_message, request.project_context)
        return {
            "success": True,
            "model": MODEL_NAME,
            "provider": "local-fallback",
            "response": final_answer,
            "answer": final_answer,
            "intent": classified["intent"],
            "suggested_roles": suggested_roles,
            "project_action": classified["project_action"],
            "matching_action": classified["matching_action"],
            "project_data": classified.get("project_data"),
            "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 0, "prompt_eval_count": 0}
        }

    except httpx.TimeoutException:
        logger.warning(f"[LocalAI] Inference timed out after {int(REQUEST_TIMEOUT)}s; using safe fallback.")
        final_answer = build_safe_fallback_response(classified["intent"], resolved_message, request.project_context)
        return {
            "success": True,
            "model": MODEL_NAME,
            "provider": "local-fallback",
            "response": final_answer,
            "answer": final_answer,
            "intent": classified["intent"],
            "suggested_roles": suggested_roles,
            "project_action": classified["project_action"],
            "matching_action": classified["matching_action"],
            "project_data": classified.get("project_data"),
            "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 0, "prompt_eval_count": 0}
        }

    except Exception as exc:
        logger.error(f"[LocalAI Error] Internal error: {str(exc)}; using safe fallback.")
        final_answer = build_safe_fallback_response(classified["intent"], resolved_message, request.project_context)
        return {
            "success": True,
            "model": MODEL_NAME,
            "provider": "local-fallback",
            "response": final_answer,
            "answer": final_answer,
            "intent": classified["intent"],
            "suggested_roles": suggested_roles,
            "project_action": classified["project_action"],
            "matching_action": classified["matching_action"],
            "project_data": classified.get("project_data"),
            "metrics": {"ttft_ms": 0.0, "total_ms": 0.0, "tokens": 0, "prompt_eval_count": 0}
        }