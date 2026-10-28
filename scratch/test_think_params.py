import urllib.request
import json
import time

def test_payload(name, extra_body=None, extra_options=None, messages=None):
    payload = {
        "model": "qwen3:4b",
        "messages": messages or [{"role": "user", "content": "What is 2+2? Answer in one word."}],
        "stream": False,
    }
    if extra_body:
        payload.update(extra_body)
    if extra_options:
        payload["options"] = extra_options

    t0 = time.time()
    req = urllib.request.Request(
        "http://127.0.0.1:11434/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            res = json.loads(r.read().decode("utf-8"))
            dt = time.time() - t0
            msg = res.get("message", {})
            thinking = msg.get("thinking", "")
            content = msg.get("content", "")
            print(f"[{name}] Time: {dt:.2f}s | Think tokens/len: {len(thinking)} | Content: {repr(content[:60])} | Done reason: {res.get('done_reason')}")
    except Exception as e:
        print(f"[{name}] ERROR: {e}")

if __name__ == "__main__":
    test_payload("Baseline (num_predict=100)", extra_options={"num_predict": 100})
    test_payload("think=False", extra_body={"think": False}, extra_options={"num_predict": 100})
    test_payload("thinking=False", extra_body={"thinking": False}, extra_options={"num_predict": 100})
    test_payload("options.think=False", extra_options={"think": False, "num_predict": 100})
    test_payload("options.thinking=False", extra_options={"thinking": False, "num_predict": 100})
    test_payload("options.stop=['</think>']", extra_options={"stop": ["</think>"], "num_predict": 100})
    test_payload("stop=['</think>']", extra_body={"options": {"stop": ["<|im_start|>", "<|im_end|>", "</think>"], "num_predict": 100}})
