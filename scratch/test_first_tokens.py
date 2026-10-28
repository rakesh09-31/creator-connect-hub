import httpx
import json
import asyncio

async def test_first_tokens():
    url = "http://127.0.0.1:8001/chat"
    payload = {
        "message": "What is artificial intelligence?",
        "stream": True
    }
    print("Sending request...")
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", url, json=payload) as resp:
            idx = 0
            async for line in resp.aiter_lines():
                if not line or not line.startswith("data: "):
                    continue
                idx += 1
                try:
                    data = json.loads(line[6:])
                    token = data.get("token")
                    acc = data.get("accumulated")
                    done = data.get("done")
                    if idx <= 15 or done:
                        print(f"#{idx}: token={repr(token)} acc={repr(acc[:50] if acc else None)} done={done}")
                except Exception as e:
                    print(f"#{idx} err: {e}")

asyncio.run(test_first_tokens())
