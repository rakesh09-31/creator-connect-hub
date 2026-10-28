import { searchClientOpportunities } from "../src/lib/omniforge/matcher";

async function run() {
  const res = await searchClientOpportunities({ role: "Video Editor", page: 1, pageSize: 10 });
  console.log("EXACT_COUNT_REPORTED=" + res.totalCount);
  console.log("PAGE_SIZE_RETURNED=" + res.opportunities.length);

  for (let i = 0; i < res.opportunities.length; i++) {
    const o = res.opportunities[i];
    console.log(`OPPORTUNITY_${i + 1}:`);
    console.log(`  id: ${o.id}`);
    console.log(`  title: ${o.title}`);
    console.log(`  clientName: ${o.clientName}`);
    console.log(`  category: ${o.category}`);
    console.log(`  budget: ${o.budget}`);
    console.log(`  skillsRequired: ${JSON.stringify(o.skillsRequired)}`);
    console.log(`  description: ${o.description}`);
  }
}

run().catch(console.error);
