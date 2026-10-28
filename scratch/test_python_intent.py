import sys
sys.path.append("ai-engine")
from main import classify_user_intent

queries = [
    "Search the best video editor for my YouTube channel",
    "Find the best video editor for my YouTube channel",
    "Search for a video editor",
    "I need a video editor for my YouTube channel",
    "Can you find me a good editor?",
    "Find someone who can edit my YouTube videos",
    "I need an editor for my channel",
    "Show me video editors",
    "Who can edit my videos?",
    "Find a cinematographer for my short film",
    "I need a sound engineer",
    "Find performers for my festival",
    # HOW_TO queries:
    "How can I find a good YouTube video editor?",
    "Where can I hire a video editor?",
    "What should I look for in a YouTube editor?",
    "How do I recruit an editor?",
    "What skills should a YouTube editor have?",
    # Definition query:
    "What is a video editor?"
]

print("==================================================")
print("TESTING PYTHON BACKEND INTENT CLASSIFICATION")
print("==================================================")

for q in queries:
    res = classify_user_intent(q)
    print(f"\nQuery: \"{q}\"")
    print(f"  intent: {res['intent']} | target_role: {res.get('target_role')}")
