import urllib.request
import json

cases = [
    "so can you find the creators and clients",
    "i dont ask find the person i asked you to do you find or not",
    "find the all the video editors in omnicraft",
    "find an actor for my short film",
    "write a story about a village girl becoming a singer",
    "how do I hire a squad?",
    "hire this squad",
    "find clients looking for video editors",
    "show me more",
    "invite Ramu"
]

for q in cases:
    req = urllib.request.Request(
        "http://127.0.0.1:8001/chat",
        data=json.dumps({"message": q, "stream": False}).encode(),
        headers={"Content-Type": "application/json"}
    )
    res = urllib.request.urlopen(req)
    data = json.loads(res.read().decode())
    print(f"'{q}'\n  -> intent={data.get('intent')} | matching_action={data.get('matching_action')} | role={data.get('target_role')} | scope={data.get('scope')} | chips={data.get('suggested_chips')}\n")
