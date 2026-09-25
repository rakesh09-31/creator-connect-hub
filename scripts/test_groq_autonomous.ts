import fs from "fs";

async function main() {
  const env = fs.readFileSync(".env.local", "utf-8");
  let key = "";
  for (const line of env.split("\n")) {
    if (line.startsWith("GROQ_API_KEY=")) {
      key = line.split("=")[1].trim().replace(/["']/g, "");
    }
  }

  console.log("Waiting 3 seconds for token bucket to reset...");
  await new Promise((r) => setTimeout(r, 3000));

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "system",
          content: "You are OmniForge AI. If the user asks for a complete plan and actors for a short film about a missing student, provide an autonomous structured production report.",
        },
        {
          role: "user",
          content: "Just make the complete plan for making a short film about a missing student and find the actors.",
        },
      ],
      max_tokens: 500,
    }),
  });

  const data = await res.json();
  console.log("Status:", res.status);
  if (data.choices) {
    console.log("Output:\n", data.choices[0]?.message?.content);
  } else {
    console.log("Error:", data);
  }
}

main().catch(console.error);
