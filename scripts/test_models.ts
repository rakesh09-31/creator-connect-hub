import fs from "fs";

async function main() {
  const env = fs.readFileSync(".env.local", "utf-8");
  let key = "";
  for (const line of env.split("\n")) {
    if (line.startsWith("GROQ_API_KEY=")) {
      key = line.split("=")[1].trim().replace(/["']/g, "");
    }
  }
  const models = ["qwen/qwen3.8-27b", "openai/gpt-oss-120b", "openai/gpt-oss-20b"];
  for (const model of models) {
    console.log(`\nTesting model: ${model}`);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + key,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: "Hi, who are you in 1 sentence?" }],
        max_tokens: 50,
      }),
    });
    const data = await res.json();
    console.log(`Status: ${res.status}`);
    if (data.choices) {
      console.log(`Output: ${data.choices[0]?.message?.content}`);
    } else {
      console.log(`Error:`, data.error?.message || data);
    }
  }
}

main().catch(console.error);
