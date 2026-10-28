import urllib.request
import json
import time

def test_ollama():
    print("--- 1. Testing Ollama Directly (http://127.0.0.1:11434/api/chat) ---")
    payload = {
        "model": "qwen3:4b",
        "messages": [{"role": "user", "content": "What is artificial intelligence?"}],
        "stream": False
    }
    req = urllib.request.Request(
        "http://127.0.0.1:11434/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content = data.get("message", {}).get("content", "")
            print(f"Ollama direct response in {time.time()-t0:.2f}s:")
            print(f"Model: {data.get('model')}")
            print(f"Content length: {len(content)}")
            print(f"Content preview: {repr(content[:150])}")
            return content
    except Exception as e:
        print(f"Ollama direct failed: {e}")
        return None

def test_fastapi_chat():
    print("\n--- 2. Testing FastAPI /chat (http://127.0.0.1:8001/chat) ---")
    payload = {
        "message": "What is artificial intelligence?",
        "project_context": None,
        "history": []
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8001/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        t0 = time.time()
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            answer = data.get("response", "")
            print(f"FastAPI /chat response in {time.time()-t0:.2f}s:")
            print(f"Intent: {data.get('intent')}")
            print(f"Answer length: {len(answer)}")
            print(f"Answer preview: {repr(answer[:200])}")
            print(f"Source metadata: {data.get('source_metadata')}")
            print(f"Chips: {data.get('suggested_chips')}")
            return answer
    except Exception as e:
        print(f"FastAPI /chat failed: {e}")
        return None

def test_fastapi_stream():
    print("\n--- 3. Testing FastAPI /chat/stream (http://127.0.0.1:8001/chat/stream or equivalent) ---")
    payload = {
        "message": "What is artificial intelligence?",
        "project_context": None,
        "history": []
    }
    for endpoint in ["http://127.0.0.1:8001/chat/stream", "http://127.0.0.1:8001/chat-stream", "http://127.0.0.1:8001/stream"]:
        req = urllib.request.Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"}
        )
        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                print(f"Endpoint {endpoint} status: {resp.status}")
                chunk = resp.read(200)
                print(f"First chunk: {chunk}")
        except Exception as e:
            print(f"Endpoint {endpoint}: {e}")

if __name__ == "__main__":
    test_ollama()
    test_fastapi_chat()
    test_fastapi_stream()
