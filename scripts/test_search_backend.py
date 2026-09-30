import urllib.request
import json

queries = [
    ("A. Create Project", "I want to create a short film about a village girl who becomes a singer.", None),
    ("B. Search Actor", "I need an actor for the short film so can you search?", {
        "title": "Short Film: A village girl who becomes a singer",
        "domain": "Film",
        "type": "Short Film",
        "story_premise": "A village girl who becomes a singer"
    }),
    ("C. Actor who can sing", "Find an actor who can also sing.", {
        "title": "Short Film: A village girl who becomes a singer",
        "domain": "Film",
        "type": "Short Film",
        "story_premise": "A village girl who becomes a singer"
    }),
    ("D. Search again", "Search again for actors.", {
        "title": "Short Film: A village girl who becomes a singer",
        "domain": "Film",
        "type": "Short Film",
        "story_premise": "A village girl who becomes a singer"
    }),
    ("E. No-match role", "Find an Underwater Stunt Coordinator", None)
]

for label, q, ctx in queries:
    print("=" * 60)
    print(f"TEST: {label}")
    print(f"QUERY: {q}")
    req_data = {
        "message": q,
        "stream": False,
        "project_context": ctx
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8001/chat",
        data=json.dumps(req_data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode("utf-8"))
            print(f"INTENT: {data.get('intent')}")
            print(f"MATCHING_ACTION: {data.get('matching_action')}")
            print(f"TARGET_ROLE: {data.get('target_role')}")
            print(f"SUGGESTED_ROLES: {[r.get('role') for r in data.get('suggested_roles', [])]}")
            print(f"RESPONSE: {data.get('response', '')}")
    except Exception as e:
        print(f"ERROR: {e}")
