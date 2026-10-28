import { classifyUserIntent, isCreatorSearchQuery } from "../src/lib/omniforge/intent.ts";

const query = "Search the best video editor for my YouTube channel";
console.log("Query:", query);
console.log("isCreatorSearchQuery:", isCreatorSearchQuery(query));
const res = classifyUserIntent(query);
console.log("Intent Result:", JSON.stringify(res, null, 2));
