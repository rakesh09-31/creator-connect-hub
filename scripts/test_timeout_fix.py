import httpx
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8001"

print("=" * 70)
print("OMNIFORGE LOCAL AI INFERENCE & TIMEOUT VERIFICATION TEST")
print("=" * 70)

# 1. Health Check
print("\n[Step 1] Health Check: GET /health")
t0 = time.time()
r = httpx.get(f"{BASE_URL}/health", timeout=10.0)
t1 = time.time()
print(f"Health Status: {r.status_code} in {(t1 - t0)*1000:.1f}ms")
health_data = r.json()
print("Health payload:", json.dumps(health_data, indent=2))
assert health_data.get("status") == "running"
assert health_data.get("ollama_connected") is True

# 2. Short Prompt Test
print("\n[Step 2] Short Prompt Test (Non-streaming)")
short_payload = {
    "message": "What is a 2-sentence definition of a short film?",
    "stream": False,
    "num_predict": 350
}
t0 = time.time()
r = httpx.post(f"{BASE_URL}/chat", json=short_payload, timeout=30.0)
t1 = time.time()
short_data = r.json()
print(f"Status: {r.status_code} | Total client time: {(t1 - t0)*1000:.1f}ms")
print("Metrics from backend:", short_data.get("metrics"))
short_ans = short_data.get("answer", "")
print("Answer:\n", short_ans[:300])
assert "<think>" not in short_ans, "Reasoning tag leak detected!"
assert "</think>" not in short_ans, "Reasoning tag leak detected!"

# 3. Multi-turn Village Girl Singer Film Request
print("\n[Step 3] Multi-turn Village Girl Singer Film Request (Turn 1 -> Turn 2)")
# Turn 1: User establishes the idea
turn1_msg = "I want to make a short film about a village girl who wants to become a singer."
project_context = {
    "title": "A village girl who wants to become a singer",
    "type": "Short Film",
    "domain": "Film & Video",
    "story_premise": "A village girl who wants to become a singer",
    "budget": "₹10,000",
    "team_size": "5 people"
}
t0 = time.time()
r1 = httpx.post(f"{BASE_URL}/chat", json={"message": turn1_msg, "project_context": project_context, "num_predict": 400}, timeout=45.0)
t1 = time.time()
data1 = r1.json()
ans1 = data1.get("answer", "")
print(f"Turn 1 completed in {(t1 - t0)*1000:.1f}ms | TTFT: {data1.get('metrics', {}).get('ttft_ms')}ms")

# Turn 2: User asks for shooting plan, budget breakdown (₹10,000), and 5 team member responsibilities
turn2_msg = "Can you provide a complete shooting schedule, a breakdown for our ₹10,000 budget, and responsibilities for our 5 team members?"
turn2_history = [
    {"role": "user", "content": turn1_msg},
    {"role": "assistant", "content": ans1[:400]}
]

t0 = time.time()
r2 = httpx.post(
    f"{BASE_URL}/chat",
    json={
        "message": turn2_msg,
        "history": turn2_history,
        "project_context": project_context,
        "stream": False,
        "num_predict": 1100
    },
    timeout=75.0
)
t2 = time.time()
data2 = r2.json()
ans2 = data2.get("answer", "")
metrics2 = data2.get("metrics", {})
print(f"Turn 2 completed in {(t2 - t0)*1000:.1f}ms | TTFT: {metrics2.get('ttft_ms')}ms | Total Backend: {metrics2.get('total_ms')}ms")
print(f"Tokens: {metrics2.get('tokens')} | Prompt Eval Tokens: {metrics2.get('prompt_eval_count')}")

assert "<think>" not in ans2, "Reasoning tag leak in Turn 2!"
assert "</think>" not in ans2, "Reasoning tag leak in Turn 2!"
assert "₹10,000" in ans2 or "10,000" in ans2 or "₹2,000" in ans2, "Budget missing in Turn 2!"
assert "5" in ans2 or "Person 1" in ans2 or "Director" in ans2, "Team assignments missing in Turn 2!"

print("\n--- Turn 2 Answer Quality Sample ---")
print(ans2[:800])
print("...")

# 4. Turn 3: Progressive SSE Streaming Test
print("\n[Step 4] Turn 3: Progressive SSE Streaming Test")
turn3_msg = "What equipment should the 5 team members prioritize for the village shoot?"
turn3_history = [
    {"role": "user", "content": turn2_msg},
    {"role": "assistant", "content": ans2[:400]}
]

stream_payload = {
    "message": turn3_msg,
    "history": turn3_history,
    "project_context": project_context,
    "stream": True,
    "num_predict": 400
}

t0 = time.time()
ttft = None
stream_tokens = []
final_stream_data = None

with httpx.Client(timeout=60.0) as client:
    with client.stream("POST", f"{BASE_URL}/chat", json=stream_payload) as stream_res:
        assert stream_res.status_code == 200
        assert "text/event-stream" in stream_res.headers.get("content-type", "")
        for line in stream_res.iter_lines():
            if not line or not line.startswith("data: "):
                continue
            event = json.loads(line[6:])
            if event.get("token"):
                if ttft is None:
                    ttft = (time.time() - t0) * 1000
                    print(f"Streaming TTFT: {ttft:.1f}ms")
                stream_tokens.append(event["token"])
            if event.get("done"):
                final_stream_data = event
                break

t3 = time.time()
total_stream_ms = (t3 - t0) * 1000
print(f"Streaming completed in {total_stream_ms:.1f}ms, received {len(stream_tokens)} tokens")
print("Streaming final metrics:", final_stream_data.get("metrics") if final_stream_data else None)

assert ttft is not None and ttft < 10000.0, f"TTFT too slow: {ttft}ms"
assert final_stream_data is not None, "Missing SSE done event!"
stream_ans = final_stream_data.get("answer", "")
assert "<think>" not in stream_ans, "Reasoning tag leak in streaming!"
assert "</think>" not in stream_ans, "Reasoning tag leak in streaming!"

print("\n" + "=" * 70)
print("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!")
print("=" * 70)
