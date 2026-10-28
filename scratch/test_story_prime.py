import urllib.request
import json
import time

def test_story(name, messages):
    t0 = time.time()
    payload = {
        "model": "qwen3:4b",
        "messages": messages,
        "stream": True,
        "options": {"num_predict": 400, "temperature": 0.7}
    }
    req = urllib.request.Request(
        "http://127.0.0.1:11434/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    first_token_time = None
    chunks = 0
    full_content = []
    think_tokens = 0
    with urllib.request.urlopen(req, timeout=60) as resp:
        for line in resp:
            if not line: continue
            data = json.loads(line.decode("utf-8"))
            msg = data.get("message", {})
            c = msg.get("content", "")
            th = msg.get("thinking", "")
            if th: think_tokens += 1
            if c:
                if first_token_time is None: first_token_time = time.time()
                full_content.append(c)
                chunks += 1
            if data.get("done"):
                dt = time.time() - t0
                ttft = (first_token_time - t0) if first_token_time else dt
                print(f"[{name}] Total: {dt:.2f}s | TTFT: {ttft:.2f}s | Think tokens: {think_tokens} | Content tokens: {chunks}")
                print(f"Preview: {''.join(full_content)[:120]!r}\n")

test_story("Story with priming </think>", [
    {"role": "system", "content": "You are a creative screenwriter."},
    {"role": "user", "content": "Write a short opening scene for a sci-fi thriller about a missing satellite."},
    {"role": "assistant", "content": "</think>\n"}
])
