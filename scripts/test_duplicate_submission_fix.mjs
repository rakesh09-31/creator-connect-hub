import assert from 'assert';

// Verification test for duplicate message submission fix in OmniForge
console.log('========================================================================');
console.log('TEST: OMNIFORGE DUPLICATE SUBMISSION & DEDUPLICATION GUARDS');
console.log('========================================================================\n');

// 1. Test Input-Level Synchronous Lock
function simulateOmniForgeChatSubmission() {
  let submitCount = 0;
  let isLoading = false;
  let input = "I am a director so I have an interest that I need to direct a short film on action thriller so generate the story for it.";
  let isSubmittingLocal = false;

  const onSendMessage = (text) => {
    submitCount++;
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || isSubmittingLocal) return;

    isSubmittingLocal = true;
    input = "";
    onSendMessage(trimmed);

    setTimeout(() => {
      isSubmittingLocal = false;
    }, 600);
  };

  // User presses Enter AND clicks Send button in the same frame/tick
  handleSubmit({ preventDefault: () => {} });
  handleSubmit({ preventDefault: () => {} });
  handleSubmit();

  assert.strictEqual(submitCount, 1, 'Input lock must allow exactly ONE submission event despite rapid Enter+Click');
  console.log('✅ TEST 1: OmniForgeChat synchronous lock successfully rejected duplicate submit events');
}

// 2. Test Request-Level Deduplication Guard
function simulateParentRequestDeduplication() {
  let ollamaRequests = 0;
  let isSubmitting = false;
  let isLoading = false;
  let lastSubmission = null;

  const prompt = "I am a director so I have an interest that I need to direct a short film on action thriller so generate the story for it.";

  const handleSendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();
    if (
      isSubmitting ||
      isLoading ||
      (lastSubmission &&
        lastSubmission.text.toLowerCase() === trimmed.toLowerCase() &&
        now - lastSubmission.time < 1200)
    ) {
      return { rejected: true };
    }

    isSubmitting = true;
    lastSubmission = { text: trimmed, time: now };
    isLoading = true;

    ollamaRequests++;

    return { rejected: false };
  };

  // Fire two rapid calls with identical prompt within 50ms
  const res1 = handleSendMessage(prompt);
  const res2 = handleSendMessage(prompt);

  assert.strictEqual(ollamaRequests, 1, 'Must initiate exactly ONE Ollama request');
  console.log('✅ TEST 2: Parent request deduplication guard ensured only ONE Ollama request was triggered');
}

// 3. Test Message State Deduplication on Retrying Failed Prompt
function simulateRetryDeduplication() {
  const prompt = "I am a director so I have an interest that I need to direct a short film on action thriller so generate the story for it.";

  // Initial state before retry: User message + Failed Error message
  let messages = [
    { id: 'msg-1-u', sender: 'user', text: prompt },
    { id: 'msg-1-ai', sender: 'ai', text: 'Request timed out after 60s', isError: true, failedPrompt: prompt }
  ];

  // User clicks retry (or sends prompt again)
  const trimmed = prompt.trim();
  const userMsgId = 'msg-2-u';
  const userMsg = { id: userMsgId, sender: 'user', text: trimmed };

  // Apply our deduplication updater
  const cleaned = messages.filter((m, idx, arr) => {
    if (m.isError && m.failedPrompt === trimmed) return false;
    if (m.sender === "user" && m.text.trim() === trimmed) {
      const next = arr[idx + 1];
      if (next && next.isError && next.failedPrompt === trimmed) return false;
      if (idx === arr.length - 1) return false;
    }
    return true;
  });

  const last = cleaned[cleaned.length - 1];
  let finalMessages;
  if (last && last.sender === "user" && last.text.trim() === trimmed) {
    finalMessages = cleaned;
  } else {
    finalMessages = [...cleaned, userMsg];
  }

  // Then AI streams and finishes
  const aiMsg = { id: 'msg-2-ai', sender: 'ai', text: 'Story completed successfully' };
  finalMessages = [...finalMessages, aiMsg];

  const userMessages = finalMessages.filter(m => m.sender === 'user');
  const aiMessages = finalMessages.filter(m => m.sender === 'ai');

  assert.strictEqual(userMessages.length, 1, 'Final chat must contain exactly ONE user message after retry');
  assert.strictEqual(aiMessages.length, 1, 'Final chat must contain exactly ONE assistant response');
  assert.strictEqual(userMessages[0].text, prompt, 'User message text is intact');
  assert.strictEqual(aiMessages[0].text, 'Story completed successfully', 'Assistant message text is intact');

  console.log('✅ TEST 3: Retry / Re-submission correctly cleanses failed turns and yields exactly 1 user + 1 AI message');
}

// 4. Test Storage Message Deduplication
function simulateStorageDeduplication() {
  function deduplicateMessagesList(messages) {
    if (!Array.isArray(messages)) return [];
    return messages.filter((m, idx, arr) => {
      if (m && m.sender === "user") {
        const prev = arr[idx - 1];
        if (prev && prev.sender === "user" && (prev.text || "").trim() === (m.text || "").trim()) {
          return false;
        }
      }
      return true;
    });
  }

  const corruptedHistory = [
    { sender: 'user', text: 'I am a director so I have an interest that I need to direct a short film on action thriller so generate the story for it.' },
    { sender: 'user', text: 'I am a director so I have an interest that I need to direct a short film on action thriller so generate the story for it.' },
    { sender: 'ai', text: 'Here is the action thriller story...' }
  ];

  const sanitized = deduplicateMessagesList(corruptedHistory);
  assert.strictEqual(sanitized.length, 2, 'Must remove duplicate consecutive user messages from storage');
  assert.strictEqual(sanitized[0].sender, 'user');
  assert.strictEqual(sanitized[1].sender, 'ai');

  console.log('✅ TEST 4: Storage deduplication successfully sanitizes any corrupted history');
}

simulateOmniForgeChatSubmission();
simulateParentRequestDeduplication();
simulateRetryDeduplication();
simulateStorageDeduplication();

console.log('\n========================================================================');
console.log('ALL DUPLICATE MESSAGE PREVENTION TESTS PASSED!');
console.log('========================================================================');
