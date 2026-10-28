import httpx
import json
import asyncio
import re

async def main():
    url = "http://127.0.0.1:8001/chat"
    payload = {
        "message": "What is artificial intelligence?",
        "stream": True
    }
    print(f"Connecting to {url} with stream=True...")
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream("POST", url, json=payload) as resp:
            print(f"Status: {resp.status_code}")
            print(f"Headers: {dict(resp.headers)}")
            event_count = 0
            accumulated_token = ""
            async for line in resp.aiter_lines():
                if not line or not line.startswith("data: "):
                    continue
                event_count += 1
                data_str = line[6:]
                try:
                    event = json.loads(data_str)
                    token = event.get("token")
                    acc = event.get("accumulated")
                    done = event.get("done")
                    if token:
                        accumulated_token += token
                        print(f"Event {event_count}: Token={repr(token[:30])} AccLen={len(acc) if acc else 0}")
                    if done:
                        print(f"DONE Event: response length={len(event.get('response', ''))}")
                        print(f"Response: {repr(event.get('response', '')[:200])}")
                        print(f"Telemetry: {event.get('telemetry')}")
                except Exception as e:
                    print(f"Error parsing line: {e}")
            print(f"Total events: {event_count}, Total accumulated token len: {len(accumulated_token)}")

asyncio.run(main())
