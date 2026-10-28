import urllib.request
import json
import time

def call_ai_engine(message, stream=True):
    t0 = time.time()
    payload = {
        "message": message,
        "stream": stream,
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8001/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    first_token_time = None
    chunks = 0
    full_text = []
    done_data = None

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            for line in resp:
                line_str = line.decode("utf-8").strip()
                if not line_str.startswith("data: "):
                    continue
                data_json = json.loads(line_str[6:])
                if "token" in data_json:
                    if first_token_time is None:
                        first_token_time = time.time()
                    chunks += 1
                if data_json.get("done"):
                    done_data = data_json
                    break
        total_time = time.time() - t0
        ttft = (first_token_time - t0) if first_token_time else total_time
        print(f"Query: {message!r}")
        print(f"  Total time: {total_time:.2f}s | TTFT: {ttft:.2f}s | Chunks: {chunks}")
        if done_data:
            print(f"  Intent: {done_data.get('intent')} | Success: {done_data.get('success')}")
            resp_preview = done_data.get('response', '')[:120].replace('\n', ' ')
            print(f"  Response: {resp_preview!r}")
        print()
    except Exception as e:
        print(f"Query: {message!r} -> ERROR: {e}\n")

if __name__ == "__main__":
    print("Testing ai-engine at http://127.0.0.1:8001/chat...\n", flush=True)
    call_ai_engine("hello")
    call_ai_engine("What is photosynthesis?")
    call_ai_engine("Generate a complete frontend learning roadmap")
