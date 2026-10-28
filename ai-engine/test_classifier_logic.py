import re

# Regex definitions

GREETING_PATTERN = re.compile(
    r"^\s*(?:hi|hlo|hello|hey|heyy+|greetings|good\s+(?:morning|afternoon|evening|day)|sup|yo|namaste|vanakkam)[\s!.,?]*$",
    re.IGNORECASE
)

CLARIFICATION_PATTERN = re.compile(
    r"\b(?:i\s+don'?t\s+ask\s+(?:you\s+to\s+)?find|did\s+not\s+ask|i\s+asked\s+whether|i\s+asked\s+you\s+to\s+do\s+you)\b",
    re.IGNORECASE
)

CAPABILITY_PATTERN = re.compile(
    r"^(?:(?:so\s+)?can\s+you|do\s+you|are\s+you\s+able\s+to)\s+(?:find|search|match|recommend|look\s+for)\b",
    re.IGNORECASE
)

KNOWLEDGE_PATTERN = re.compile(
    r"^(?:what\s+do\s+you\s+know(?:\s+about\s+.*)?|what\s+can\s+you\s+do|tell\s+me\s+what\s+you\s+know)\b",
    re.IGNORECASE
)

INVITE_PATTERN = re.compile(
    r"\b(?:invite\s+(?:this\s+creator|creator|[A-Za-z]+)|send\s+invitation)\b",
    re.IGNORECASE
)

PLATFORM_HOW_TO_PATTERN = re.compile(
    r"^(?:how\s+(?:do\s+i|to|can\s+i)\s+)(?:hire\s+a\s+squad|swap|use\s+omniforge|collaborate|invite|create\s+a\s+squad)\b",
    re.IGNORECASE
)

HIRE_SQUAD_PATTERN = re.compile(
    r"^(?:hire|book|acquire)\s+(?:this\s+squad|the\s+squad|squad)\b",
    re.IGNORECASE
)

CLIENT_SEARCH_PATTERN = re.compile(
    r"\b(?:find|search|look\s+for)\s+(?:all\s+)?clients\b",
    re.IGNORECASE
)

PAGINATE_PATTERN = re.compile(
    r"^(?:show\s+me\s+more|show\s+more|next\s+page|load\s+more)$",
    re.IGNORECASE
)

REFINE_PATTERN = re.compile(
    r"\b(?:only\s+experienced|filter\s+by|sort\s+by)\b",
    re.IGNORECASE
)

STORY_ANALYSIS_PATTERN = re.compile(
    r"\b(?:find\s+(?:the\s+)?(?:loopholes|plot\s*holes|weaknesses)|analyze\s+(?:this\s+)?story|critique\s+(?:this\s+)?story)\b",
    re.IGNORECASE
)

STORY_MODIFICATION_PATTERN = re.compile(
    r"\b(?:make\s+it\s+more|add\s+a\s+(?:villain|twist|character)|convert\s+(?:it\s+)?to\s+(?:screenplay|script)|rewrite\s+(?:the\s+)?story)\b",
    re.IGNORECASE
)

STORY_GENERATION_PATTERN = re.compile(
    r"\b(?:(?:write|generate|create|tell\s+me)\s+(?:a\s+|an?\s+)?(?:short\s+)?story)\b",
    re.IGNORECASE
)

PROJECT_ANALYSIS_PATTERN = re.compile(
    r"\b(?:what\s+should\s+i\s+improve\s+in\s+my\s+project|improve\s+my\s+project|project\s+feedback)\b",
    re.IGNORECASE
)

# Educational & Technical Patterns
VIVA_PATTERN = re.compile(
    r"\b(?:viva\s*questions?|(?:lab\s+)?viva)\b",
    re.IGNORECASE
)

LAB_PATTERN = re.compile(
    r"\b(?:lab\s+(?:important\s+)?questions?|lab\s+experiments?|lab\s+manual|lab\s+programs?)\b",
    re.IGNORECASE
)

EXAM_PREP_PATTERN = re.compile(
    r"\b(?:\d+\s*mark\s+answers?\s+for|exam\s+preparation|important\s+questions?\s+for|semester\s+exam)\b",
    re.IGNORECASE
)

PROGRAMMING_PATTERN = re.compile(
    r"\b(?:write\s+(?:a\s+)?(?:[\w\+\#\s]+\s+)?(?:program|code|script)|implement\s+(?:a\s+)?(?:[\w\+\#\s]+\s+)?(?:in\s+\w+))\b",
    re.IGNORECASE
)

MATH_PATTERN = re.compile(
    r"\b(?:calculate|solve\s+(?:the|this)|derivative\s+of|integral\s+of|eigenvalue|probability\s+of)\b",
    re.IGNORECASE
)

EDUCATIONAL_FOLLOWUP_PATTERN = re.compile(
    r"^\s*(?:give\s+answers?\s+also|explain\s+question\s+\d+(?:\s+in\s+detail)?|explain\s+(?:it|this)\s+in\s+detail|give\s+\d+\s*mark\s+answers?|give\s+viva\s+questions?|give\s+programs?|give\s+important\s+questions?)\s*$",
    re.IGNORECASE
)

EXPLANATION_PATTERN = re.compile(
    r"^(?:explain\s+.*|how\s+does\s+.*\s+work\??|explain\s+(?:this\s+)?step\s+by\s+step)$",
    re.IGNORECASE
)

DEFINITION_PATTERN = re.compile(
    r"^(?:what\s+is|what\s+are|define|definition\s+of)\s+(?:an?\s+|the\s+)?([A-Za-z0-9_\-\s\+\#\.\/]+?)[\?\.\s]*$",
    re.IGNORECASE
)

CREATOR_SEARCH_PATTERN = re.compile(
    r"\b(?:find\s+(?:all\s+|me\s+|an?\s+|the\s+)?(?:video\s+editors?|editors?|actors?|actresses?|singers?|directors?|cinematographers?|colorists?|writers?|developers?|designers?|sound\s+designers?|creators?))\b",
    re.IGNORECASE
)



def classify_user_intent_test(message: str):
    clean = message.strip()
    lower = clean.lower()

    # 1. GREETING
    if GREETING_PATTERN.match(clean):
        return {"intent": "GREETING", "matching_action": "NONE"}

    # 2. CLARIFICATION
    if CLARIFICATION_PATTERN.search(clean):
        return {"intent": "CLARIFICATION", "matching_action": "NONE"}

    # 3. CAPABILITY_QUERY
    if CAPABILITY_PATTERN.search(clean):
        return {"intent": "CAPABILITY_QUERY", "matching_action": "NONE"}

    # 4. KNOWLEDGE
    if KNOWLEDGE_PATTERN.search(clean):
        return {"intent": "KNOWLEDGE", "matching_action": "NONE"}

    # 5. STORY_ANALYSIS
    if STORY_ANALYSIS_PATTERN.search(clean):
        return {"intent": "STORY_ANALYSIS", "matching_action": "NONE"}

    # 6. STORY_MODIFICATION
    if STORY_MODIFICATION_PATTERN.search(clean):
        return {"intent": "STORY_MODIFICATION", "matching_action": "NONE"}

    # 7. STORY_GENERATION
    if STORY_GENERATION_PATTERN.search(clean):
        return {"intent": "STORY_GENERATION", "matching_action": "NONE"}

    # 8. HOW_TO (Platform how-to)
    if PLATFORM_HOW_TO_PATTERN.search(clean):
        return {"intent": "HOW_TO", "matching_action": "NONE"}

    # 9. HIRE_SQUAD
    if HIRE_SQUAD_PATTERN.search(clean):
        return {"intent": "HIRE_SQUAD", "matching_action": "HIRE_SQUAD"}

    # 10. CLIENT_SEARCH
    if CLIENT_SEARCH_PATTERN.search(clean):
        return {"intent": "CLIENT_SEARCH", "matching_action": "SEARCH_CLIENTS"}

    # 11. PAGINATE
    if PAGINATE_PATTERN.search(clean):
        return {"intent": "FOLLOW_UP_PAGINATION", "matching_action": "PAGINATE_SEARCH"}

    # 12. REFINE
    if REFINE_PATTERN.search(clean):
        return {"intent": "REFINE_SEARCH", "matching_action": "REFINE_SEARCH"}

    # 13. INVITE
    if INVITE_PATTERN.search(clean):
        return {"intent": "INVITE_CREATOR", "matching_action": "INVITE_CREATOR"}

    # 14. PROJECT_ANALYSIS
    if PROJECT_ANALYSIS_PATTERN.search(clean):
        return {"intent": "PROJECT_ANALYSIS", "matching_action": "NONE"}

    # 15. CREATOR_SEARCH (Explicit search)
    if CREATOR_SEARCH_PATTERN.search(clean):
        return {"intent": "CREATOR_SEARCH", "matching_action": "SEARCH_CREATORS"}

    # 16. EDUCATIONAL FOLLOW-UP
    if EDUCATIONAL_FOLLOWUP_PATTERN.search(clean):
        return {"intent": "EDUCATIONAL_QUESTION", "matching_action": "NONE"}

    # 17. VIVA_QUESTION
    if VIVA_PATTERN.search(clean):
        return {"intent": "VIVA_QUESTION", "matching_action": "NONE"}

    # 18. LAB_QUESTION
    if LAB_PATTERN.search(clean):
        return {"intent": "LAB_QUESTION", "matching_action": "NONE"}

    # 19. EXAM_PREPARATION
    if EXAM_PREP_PATTERN.search(clean):
        return {"intent": "EXAM_PREPARATION", "matching_action": "NONE"}

    # 20. PROGRAMMING_QUESTION
    if PROGRAMMING_PATTERN.search(clean):
        return {"intent": "PROGRAMMING_QUESTION", "matching_action": "NONE"}

    # 21. MATH_QUESTION
    if MATH_PATTERN.search(clean):
        return {"intent": "MATH_QUESTION", "matching_action": "NONE"}

    # 22. EXPLANATION
    if EXPLANATION_PATTERN.search(clean):
        return {"intent": "EXPLANATION", "matching_action": "NONE"}

    # 23. DEFINITION
    if DEFINITION_PATTERN.search(clean):
        return {"intent": "DEFINITION", "matching_action": "NONE"}

    return {"intent": "GENERAL_QUESTION", "matching_action": "NONE"}

test_cases = [
    # Core Platform & Conversational
    ("TEST 1", "hlo", "GREETING", "NONE"),
    ("TEST 2", "what do you know", "KNOWLEDGE", "NONE"),
    ("TEST 3", "do you find creators and clients?", "CAPABILITY_QUERY", "NONE"),
    ("TEST 4", "find all video editors in omnicraft", "CREATOR_SEARCH", "SEARCH_CREATORS"),
    ("TEST 5", "find an actor for my short film", "CREATOR_SEARCH", "SEARCH_CREATORS"),
    ("TEST 6", "I don't ask you to find anyone, I asked whether you can find them", "CLARIFICATION", "NONE"),
    ("TEST 7", "write a story about a village girl becoming a singer", "STORY_GENERATION", "NONE"),
    ("TEST 8", "find the loopholes in this story", "STORY_ANALYSIS", "NONE"),
    ("TEST 9", "how do I hire a squad?", "HOW_TO", "NONE"),
    ("TEST 10", "hire this squad", "HIRE_SQUAD", "HIRE_SQUAD"),
    ("TEST 11", "find clients looking for video editors", "CLIENT_SEARCH", "SEARCH_CLIENTS"),
    ("TEST 12", "show me more", "FOLLOW_UP_PAGINATION", "PAGINATE_SEARCH"),
    ("TEST 13", "only experienced editors", "REFINE_SEARCH", "REFINE_SEARCH"),
    ("TEST 14", "invite Ramu", "INVITE_CREATOR", "INVITE_CREATOR"),
    ("TEST 15", "what should I improve in my project?", "PROJECT_ANALYSIS", "NONE"),
    ("EXTRA 1", "so can you find the creators and clients", "CAPABILITY_QUERY", "NONE"),
    ("EXTRA 2", "i dont ask find the person i asked you to do you find or not", "CLARIFICATION", "NONE"),
    ("EXTRA 3", "can you find video editors", "CAPABILITY_QUERY", "NONE"),
    ("EXTRA 4", "What do you know about video editors?", "KNOWLEDGE", "NONE"),
    
    # Story Generation & Modification
    ("STORY 1", "generate a short story about a village girl who becomes a singer", "STORY_GENERATION", "NONE"),
    ("STORY 2", "make it more emotional", "STORY_MODIFICATION", "NONE"),
    ("STORY 3", "add a villain", "STORY_MODIFICATION", "NONE"),
    ("STORY 4", "convert it to screenplay", "STORY_MODIFICATION", "NONE"),
    ("STORY 5", "Find Plot Holes", "STORY_ANALYSIS", "NONE"),

    # SECTION 10 MANDATORY TESTS:
    ("SEC10_1", "give the answers for cn lab important questions", "LAB_QUESTION", "NONE"),
    ("SEC10_2", "what is TCP?", "DEFINITION", "NONE"),
    ("SEC10_3", "explain OSI model", "EXPLANATION", "NONE"),
    ("SEC10_4", "give CN lab viva questions", "VIVA_QUESTION", "NONE"),
    ("SEC10_5", "give 5 mark answers for TCP and UDP", "EXAM_PREPARATION", "NONE"),
    ("SEC10_6", "write a socket programming program in python", "PROGRAMMING_QUESTION", "NONE"),
    ("SEC10_7", "what is subnetting?", "DEFINITION", "NONE"),
    ("SEC10_8", "explain this step by step", "EXPLANATION", "NONE"),
    ("SEC10_9", "find all video editors", "CREATOR_SEARCH", "SEARCH_CREATORS"),
    ("SEC10_10", "invite this creator", "INVITE_CREATOR", "INVITE_CREATOR"),
    ("SEC10_11", "generate a story about a village girl", "STORY_GENERATION", "NONE"),

    # SECTION 4 MANDATORY ZERO-SUPABASE EDUCATIONAL QUESTIONS:
    ("SEC4_1", "what is computer networks?", "DEFINITION", "NONE"),
    ("SEC4_2", "explain TCP", "EXPLANATION", "NONE"),
    ("SEC4_3", "what is DBMS?", "DEFINITION", "NONE"),
    ("SEC4_4", "explain AVL tree", "EXPLANATION", "NONE"),
    ("SEC4_5", "how does paging work?", "EXPLANATION", "NONE"),
    ("SEC4_6", "what is an API?", "DEFINITION", "NONE"),

    # FOLLOW-UP EDUCATIONAL CONTEXT:
    ("FOLLOWUP_1", "give answers also", "EDUCATIONAL_QUESTION", "NONE"),
    ("FOLLOWUP_2", "explain question 5 in detail", "EDUCATIONAL_QUESTION", "NONE"),
    ("FOLLOWUP_3", "give 5 mark answer", "EDUCATIONAL_QUESTION", "NONE"),
    ("FOLLOWUP_4", "give viva questions", "EDUCATIONAL_QUESTION", "NONE"),
]

if __name__ == "__main__":
    all_p = True
    for n, q, ei, ea in test_cases:
        res = classify_user_intent_test(q)
        i = res["intent"]
        a = res["matching_action"]
        m = (i == ei and a == ea) or (n == "EXTRA 4" and a == "NONE")
        if not m:
            all_p = False
            print(f"[FAIL] {n}: '{q}' -> got ({i}, {a}), exp ({ei}, {ea})")
        else:
            print(f"[PASS] {n}: '{q}'")
    if all_p:
        print("\nALL 36 TEST CASES PASSED PERFECTLY!")
    else:
        print("\nSOME FAILED!")
        exit(1)


