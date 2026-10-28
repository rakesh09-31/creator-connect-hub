import urllib.request
import json
import time

tests = [
    {'name': 'default', 'payload': {'model': 'qwen3:4b', 'messages': [{'role': 'user', 'content': 'What is 2+2? Answer in one word.'}], 'stream': False}},
    {'name': 'think: False root', 'payload': {'model': 'qwen3:4b', 'messages': [{'role': 'user', 'content': 'What is 2+2? Answer in one word.'}], 'think': False, 'stream': False}},
    {'name': 'thinking: False root', 'payload': {'model': 'qwen3:4b', 'messages': [{'role': 'user', 'content': 'What is 2+2? Answer in one word.'}], 'thinking': False, 'stream': False}},
    {'name': 'options.think: False', 'payload': {'model': 'qwen3:4b', 'messages': [{'role': 'user', 'content': 'What is 2+2? Answer in one word.'}], 'options': {'think': False}, 'stream': False}},
    {'name': 'options.num_predict: 200', 'payload': {'model': 'qwen3:4b', 'messages': [{'role': 'user', 'content': 'What is 2+2? Answer in one word.'}], 'options': {'num_predict': 200}, 'stream': False}},
]

for test in tests:
    t0 = time.time()
    req = urllib.request.Request(
        'http://127.0.0.1:11434/api/chat',
        data=json.dumps(test['payload']).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    try:
        with urllib.request.urlopen(req, timeout=40) as r:
            res = json.loads(r.read().decode('utf-8'))
            dt = time.time() - t0
            msg = res.get('message', {})
            content = msg.get('content', '')
            thinking = msg.get('thinking', '')
            eval_count = res.get('eval_count')
            eval_dur = res.get('eval_duration', 0) / 1e9
            prompt_eval_dur = res.get('prompt_eval_duration', 0) / 1e9
            print(f"{test['name']}: {dt:.2f}s (prompt_eval: {prompt_eval_dur:.2f}s, eval: {eval_dur:.2f}s, tokens: {eval_count})")
            if thinking:
                print(f"   thinking len: {len(thinking)}")
            print(f"   content: {content[:60]}")
    except Exception as e:
        print(f"{test['name']}: ERROR {e}")
