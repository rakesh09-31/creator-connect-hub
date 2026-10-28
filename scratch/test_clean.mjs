import { cleanAiResponseText } from "../src/lib/api/local-ai.ts";

const sampleResponse = `Artificial intelligence (AI) refers to the capability of machines to simulate human intelligence processes such as learning, problem-solving, decision-making, and adapting to new information. At its core, AI involves creating algorithms and models that enable computers to analyze data, identify patterns, and make predictions or actions without being explicitly programmed for every scenario.

### Key Aspects:
- **Narrow AI (Current State)**: Specialized in specific tasks (e.g., image recognition, natural language processing like virtual assistants, recommendation engines).
- **General AI (AGI - Theoretical)**: Hypothetical systems with human-like cognitive abilities across all domains.
- **Machine Learning (ML)**: A primary subset of AI where systems improve performance through experience and data exposure.
- **Deep Learning**: A specialized ML branch using multi-layered neural networks inspired by the human brain.

### Real-World Examples:
1. **Search Engines & Recommendations**: Algorithms optimizing search results or content feeds.
2. **Autonomous Systems**: Self-driving vehicles processing sensor inputs in real-time.
3. **Natural Language Processing**: Language translation and conversational assistants.
4. **Healthcare**: Diagnostic imaging analysis and drug discovery acceleration.`;

console.log("Raw response length:", sampleResponse.length);
const cleaned = cleanAiResponseText(sampleResponse);
console.log("Cleaned response length:", cleaned.length);
console.log("Cleaned output preview:", JSON.stringify(cleaned.slice(0, 100)));
console.log("Is cleaned empty?", cleaned === "");
