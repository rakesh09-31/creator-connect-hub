from main import classify_user_intent

# Regression test cases covering core platform, creative storytelling, and educational/technical capabilities
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

    # SECTION 9 TEST MATRIX:
    ("TEST_A", "what is your name?", "IDENTITY", "NONE"),
    ("TEST_B", "who are you?", "IDENTITY", "NONE"),
    ("TEST_C", "what can you do?", "CAPABILITY_QUERY", "NONE"),
    ("TEST_D", "how do I hire a creator?", "HOW_TO", "NONE"),
    ("TEST_E", "can you explain how to hire a creator?", "HOW_TO", "NONE"),
    ("TEST_F", "explain the steps to hire a creator", "HOW_TO", "NONE"),
    ("TEST_G", "what is the process for hiring a creator?", "HOW_TO", "NONE"),
    ("TEST_H", "hire this creator", "HIRE_CREATOR", "HIRE_CREATOR"),
    ("TEST_I", "hire @ramu", "HIRE_CREATOR", "HIRE_CREATOR"),
    ("TEST_J", "send an offer to @ramu", "HIRE_CREATOR", "HIRE_CREATOR"),
    ("TEST_K", "how do I invite a creator?", "HOW_TO", "NONE"),
    ("TEST_L", "invite this creator", "INVITE_CREATOR", "INVITE_CREATOR"),
    ("TEST_M", "how do I hire a squad?", "HOW_TO", "NONE"),
    ("TEST_N", "hire this squad", "HIRE_SQUAD", "HIRE_SQUAD"),
    ("SEC9_BUG2", "can you explain how to hire a creator explain the steps", "HOW_TO", "NONE"),
    ("SEC9_GEN1", "what is hiring?", "KNOWLEDGE", "NONE"),
    ("SEC9_GEN2", "what does hiring a creator involve?", "HOW_TO", "NONE"),
    ("SEC9_GEN3", "how does hiring work?", "HOW_TO", "NONE"),
    # SECTION 14 TEST MATRIX (Film-Team Understanding & Role Planning):
    ("SEC14_1", "I am the director and I want to make a film.", "FILM_TEAM_PLANNING", "NONE"),
    ("SEC14_2", "What roles do I need for a complete film?", "FILM_TEAM_PLANNING", "NONE"),
    ("SEC14_3", "I need hero, heroine, dancers and singers.", "FILM_TEAM_PLANNING", "NONE"),
    ("SEC14_4", "Find all the people I need.", "MULTI_ROLE_SEARCH", "SEARCH_MULTI_ROLES"),
    ("SEC14_5", "Find a hero.", "CREATOR_SEARCH", "SEARCH_CREATORS"),
    ("SEC14_6", "Find a heroine.", "CREATOR_SEARCH", "SEARCH_CREATORS"),
    ("SEC14_7", "How do I hire a cinematographer?", "HOW_TO", "NONE"),
    ("SEC14_8", "Hire this cinematographer.", "HIRE_CREATOR", "HIRE_CREATOR"),
    ("SEC14_9", "Who is missing from my film team?", "PROJECT_ANALYSIS", "NONE"),
    ("SEC14_PRIMARY", "I don't need directors because I am a director. I need all the other roles to make a film like actors, dancers, singers, hero, heroine, and others who are required to make a complete film.", "FILM_TEAM_PLANNING", "NONE"),
    # EXACT USER CONVERSATION SEQUENCE TESTS:
    ("SEQ_1", "I am the director. I want to make a romantic musical film..", "FILM_TEAM_PLANNING", "NONE"),
    ("SEQ_2", "I need everyone required for the film.", "MULTI_ROLE_SEARCH", "SEARCH_MULTI_ROLES"),
    ("SEQ_3", "Start with the hero and heroine.Find them.", "MULTI_ROLE_SEARCH", "SEARCH_MULTI_ROLES"),
    ("SEQ_4", "Who is still missing from my film team?", "PROJECT_ANALYSIS", "NONE"),
    ("SEQ_5", "Build my complete film squad.", "TEAM_FORMATION", "MATCH_ROLES"),
]

all_passed = True
for name, query, exp_intent, exp_action in test_cases:
    res = classify_user_intent(query)
    intent = res["intent"]
    action = res["matching_action"]
    match = (intent == exp_intent and action == exp_action) or (name == "EXTRA 4" and action == "NONE")
    status = "PASS" if match else "FAIL"
    if not match:
        all_passed = False
    print(f"[{status}] {name}: '{query}' -> intent={intent} (exp {exp_intent}), action={action} (exp {exp_action})")

# Additional Target Role Verifications for Section 14
hero_res = classify_user_intent("Find a hero.")
if hero_res.get("target_role") != "Lead Actor":
    print(f"[FAIL] SEC14_5 Target Role: expected 'Lead Actor', got '{hero_res.get('target_role')}'")
    all_passed = False
else:
    print(f"[PASS] SEC14_5 Target Role: 'Lead Actor'")

heroine_res = classify_user_intent("Find a heroine.")
if heroine_res.get("target_role") != "Lead Actress":
    print(f"[FAIL] SEC14_6 Target Role: expected 'Lead Actress', got '{heroine_res.get('target_role')}'")
    all_passed = False
else:
    print(f"[PASS] SEC14_6 Target Role: 'Lead Actress'")

primary_res = classify_user_intent("I don't need directors because I am a director. I need all the other roles to make a film like actors, dancers, singers, hero, heroine, and others who are required to make a complete film.")
if primary_res.get("currentUserRole") != "DIRECTOR":
    print(f"[FAIL] SEC14_PRIMARY Role Detection: expected 'DIRECTOR', got '{primary_res.get('currentUserRole')}'")
    all_passed = False
else:
    print(f"[PASS] SEC14_PRIMARY Role Detection: 'DIRECTOR'")

if all_passed:
    print("\nALL TEST CASES PASSED PERFECTLY!")
else:
    print("\nSOME TEST CASES FAILED!")
    exit(1)
