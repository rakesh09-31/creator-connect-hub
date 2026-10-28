import sys
sys.path.insert(0, "ai-engine")
from main import classify_user_intent

query = "Search the best video editor for my YouTube channel"
print("Testing query in ai-engine/main.py:")
res = classify_user_intent(query, None, [])
print("Classified in ai-engine/main.py:")
print("Intent:", res.get("intent"))
print("project_action:", res.get("project_action"))
print("matching_action:", res.get("matching_action"))
print("target_role:", res.get("target_role"))
print("chips:", res.get("suggested_chips"))
