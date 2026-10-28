import urllib.request
import json
import time

def test(name, payload):
    t0 = time.time()
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
                print(f"Preview: {''.join(full_content)[:100]!r}\n")

test("Default (thinking on)", {
    "model": "qwen3:4b",
    "messages": [
        {"role": "user", "content": "What is the capital of Italy?"}
    ],
    "stream": True,
    "options": {"num_predict": 200}
})

test("Assistant message priming </think>", {
    "model": "qwen3:4b",
    "messages": [
        {"role": "user", "content": "What is the capital of Italy?"},
        {"role": "assistant", "content": "</think>\nThe capital of Italy is"}
    ],
    "stream": True,
    "options": {"num_predict": 200}
})
