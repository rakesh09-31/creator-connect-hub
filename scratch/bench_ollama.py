import urllib.request
import json
import time

def run_test(name, payload):
    t0 = time.time()
    req = urllib.request.Request(
        "http://127.0.0.1:11434/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    first_token_time = None
    think_chars = 0
    content_chars = 0
    full_content = []

    with urllib.request.urlopen(req, timeout=120) as resp:
        for line in resp:
            if not line:
                continue
            chunk = json.loads(line.decode("utf-8"))
            msg = chunk.get("message", {})
            c = msg.get("content", "")
            th = msg.get("thinking", "")
            if th:
                think_chars += len(th)
            if c:
                if first_token_time is None:
                    first_token_time = time.time()
                content_chars += len(c)
                full_content.append(c)
            if chunk.get("done"):
                total_time = time.time() - t0
                ttft = (first_token_time - t0) if first_token_time else total_time
                eval_count = chunk.get("eval_count", 0)
                eval_dur = chunk.get("eval_duration", 0) / 1e9
                print(f"[{name}]")
                print(f"  Total: {total_time:.2f}s | TTFT: {ttft:.2f}s | Tokens: {eval_count} ({eval_count/eval_dur:.1f} t/s if eval_dur>0 else 0)")
                print(f"  Think chars: {think_chars} | Content chars: {content_chars}")
                print(f"  Preview: {''.join(full_content)[:120]!r}")
                print()

# Test 1: Simple question baseline
run_test("1. Baseline - What is the capital of France?", {
    "model": "qwen3:4b",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the capital of France?"}
    ],
    "stream": True,
    "options": {"num_predict": 500}
})

# Test 2: With think: False
run_test("2. think: False - What is the capital of France?", {
    "model": "qwen3:4b",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant."},
        {"role": "user", "content": "What is the capital of France?"}
    ],
    "think": False,
    "stream": True,
    "options": {"num_predict": 500}
})

# Test 3: System prompt instructing direct answer without deliberation
run_test("3. System prompt + think: False", {
    "model": "qwen3:4b",
    "messages": [
        {"role": "system", "content": "You are a helpful assistant. Directly provide the final answer immediately without internal reasoning or preamble."},
        {"role": "user", "content": "What is the capital of France?"}
    ],
    "think": False,
    "stream": True,
    "options": {"num_predict": 500}
})
