import fs from "fs";

async function main() {
  const env = fs.readFileSync(".env.local", "utf-8");
  let key = "";
  for (const line of env.split("\n")) {
    if (line.startsWith("GROQ_API_KEY=")) {
      key = line.split("=")[1].trim().replace(/["']/g, "");
    }
  }
  const res = await fetch("https://api.groq.com/openai/v1/models", {
    headers: { Authorization: "Bearer " + key },
  });
  const data = await res.json();
  console.log("Available models:", data.data?.map((m: any) => m.id));
}

main().catch(console.error);
