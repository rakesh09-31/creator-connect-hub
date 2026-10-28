import fs from "fs";
import path from "path";

const targetPath = path.resolve("src/lib/omniforge/universal-roadmap.ts");
const patchPath = path.resolve("scripts/deep_generator_code.txt");

const content = fs.readFileSync(targetPath, "utf-8");
const replacement = fs.readFileSync(patchPath, "utf-8");

const startMarker = "// PART 7: UNIVERSAL DYNAMIC ROADMAP GENERATOR (ANY SUBJECT / DOMAIN)";
const endMarker = "/**\n * Universal Roadmap Generator Factory\n */";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error("Markers not found! startIndex:", startIndex, "endIndex:", endIndex);
  process.exit(1);
}

const updatedContent = content.substring(0, startIndex) + replacement + "\n" + content.substring(endIndex);
fs.writeFileSync(targetPath, updatedContent, "utf-8");
console.log("Successfully applied deep generator patch to universal-roadmap.ts");
