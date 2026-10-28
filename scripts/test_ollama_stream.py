import urllib.request
import json
import time
import sys

payload = {
    "model": "qwen3:4b",
    "messages": [
        {"role": "user", "content": "What is 2+2? Answer in one word."}
    ],
    "think": False,
    "stream": True,
    "options": {
        "temperature": 0.1,
        "num_predict": 100
    }
}

print("Initiating streaming request to Ollama...", flush=True)
t0 = time.time()
req = urllib.request.Request(
    "http://127.0.0.1:11434/api/chat",
    data=json.dumps(payload).encode("utf-8"),
    headers={"Content-Type": "application/json"}
)

first_token_time = None
total_tokens = 0
think_tokens = 0
in_think = False

with urllib.request.urlopen(req, timeout=120) as resp:
    for line in resp:
        if not line:
            continue
        print("RAW:", line.decode("utf-8").strip())
        chunk = json.loads(line.decode("utf-8"))
        msg = chunk.get("message", {})
        content = msg.get("content", "")
        if content:
            total_tokens += 1
            if first_token_time is None:
                first_token_time = time.time()
                print(f"\n[First token received in {first_token_time - t0:.2f}s]\n", flush=True)
            if "<think>" in content:
                in_think = True
            if in_think:
                think_tokens += 1
            if "</think>" in content:
                in_think = False
            sys.stdout.write(content)
            sys.stdout.flush()
        if chunk.get("done"):
            print(f"\n\n[Done! Total time: {time.time() - t0:.2f}s, Total tokens: {total_tokens}, Think tokens: {think_tokens}]", flush=True)
            break
