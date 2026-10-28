import httpx
import json

queries = [
    ("1. CN LAB QUESTIONS", "give the answers for cn lab important questions", ["LAB_QUESTION", "EDUCATIONAL_QUESTION"]),
    ("2. WHAT IS TCP?", "what is TCP?", ["DEFINITION", "TECHNICAL_QUESTION", "GENERAL_QUESTION"]),
    ("3. EXPLAIN OSI MODEL", "explain OSI model", ["EXPLANATION", "EDUCATIONAL_QUESTION"]),
    ("4. CN LAB VIVA", "give CN lab viva questions", ["VIVA_QUESTION", "LAB_QUESTION"]),
    ("5. 5 MARK ANSWERS", "give 5 mark answers for TCP and UDP", ["EXAM_PREPARATION", "EDUCATIONAL_QUESTION"]),
    ("6. SOCKET PROGRAMMING", "write a socket programming program in python", ["PROGRAMMING_QUESTION"]),
    ("7. SUBNETTING", "what is subnetting?", ["DEFINITION", "TECHNICAL_QUESTION"]),
    ("8. STEP BY STEP (with history)", "explain this step by step", ["EXPLANATION", "EDUCATIONAL_QUESTION"]),
    ("9. CREATOR SEARCH", "find all video editors", ["CREATOR_SEARCH"]),
    ("10. INVITE CREATOR", "invite this creator", ["INVITE_CREATOR"]),
    ("11. STORY GENERATION", "generate a story about a village girl", ["STORY_GENERATION"]),
]

history_for_step_by_step = [
    {"role": "user", "content": "what is subnetting?"},
    {"role": "assistant", "content": "Subnetting is the practice of dividing a single large network into smaller sub-networks (subnets) using subnet masks (CIDR)."}
]

print("=== VERIFYING SECTION 10 TEST QUERIES ===")
for title, q, valid_intents in queries:
    hist = history_for_step_by_step if "step by step" in q else []
    try:
        r = httpx.post("http://127.0.0.1:8001/chat", json={"message": q, "history": hist}, timeout=45.0)
        data = r.json()
        intent = data.get("intent")
        chips = data.get("suggested_chips", [])
        answer = data.get("answer", "")
        matching_action = data.get("matching_action")
        
        # Check restrictions
        has_restriction = any(x in answer.lower() for x in ["not sure what", "standard term in our system", "feature doesn't exist in omnicraft", "built-in labs"])
        
        status = "PASS" if intent in valid_intents and not has_restriction else "FAIL"
        print(f"\n[{status}] {title}: '{q}'")
        print(f"  -> intent: {intent} (action: {matching_action})")
        print(f"  -> chips: {chips[:3]}...")
        print(f"  -> preview: {answer[:180].replace(chr(10), ' ')}...")
        if has_restriction:
            print("  -> ERROR: Contains forbidden restriction text!")
    except Exception as e:
        print(f"\n[FAIL] {title}: Exception {e}")
