import { classifyUserIntent } from '../src/lib/omniforge/intent';

const p1 = "iam a client ,a director so i need to make a short film so find all the required creators for an short film";
const p2 = "iam a director butt i need all the creators required for film";
const p3 = "I am a director. Find creators for my short film.";
const p4 = "I am a client and director. Find everyone required for my film.";
const p5 = "I am the director. Find all creators required for a short film.";
const p6 = "I need a director for my short film.";
const p7 = "Find a director.";
const p8 = "I am a video editor. Find clients who need video editors.";
const p9 = "I am a director. Find clients.";
const p10 = "Find all creators required for my action short film.";

console.log("--- P1 ---");
console.log(classifyUserIntent(p1));

console.log("\n--- P2 ---");
console.log(classifyUserIntent(p2));

console.log("\n--- P3 ---");
console.log(classifyUserIntent(p3));

console.log("\n--- P4 ---");
console.log(classifyUserIntent(p4));

console.log("\n--- P5 ---");
console.log(classifyUserIntent(p5));

console.log("\n--- P6 ---");
console.log(classifyUserIntent(p6));

console.log("\n--- P7 ---");
console.log(classifyUserIntent(p7));

console.log("\n--- P8 ---");
console.log(classifyUserIntent(p8));

console.log("\n--- P9 ---");
console.log(classifyUserIntent(p9));

console.log("\n--- P10 ---");
console.log(classifyUserIntent(p10));
