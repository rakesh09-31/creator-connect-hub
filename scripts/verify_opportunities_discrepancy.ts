import { searchClientOpportunities } from "../src/lib/omniforge/matcher";
import { supabase } from "../src/integrations/supabase/client";

async function verify() {
  const res = await searchClientOpportunities({ role: "Video Editor", page: 1, pageSize: 50 });
  console.log("=== searchClientOpportunities({ role: 'Video Editor' }) ===");
  console.log("Total Count reported:", res.totalCount);
  console.log("Opportunities returned array length:", res.opportunities.length);

  res.opportunities.forEach((o, idx) => {
    console.log(`\nItem ${idx + 1}:`);
    console.log(`  ID: ${o.id}`);
    console.log(`  Title: "${o.title}"`);
    console.log(`  Client: "${o.clientName}"`);
    console.log(`  Category: "${o.category}"`);
    console.log(`  Skills: ${JSON.stringify(o.skillsRequired)}`);
    console.log(`  Budget: ${o.budget}`);
    console.log(`  Description: "${o.description}"`);
  });

  // Also query all jobs in Supabase directly to see what jobs exist in total
  const { data: allJobs } = await supabase.from("jobs").select("id, title, category, skills_required, description");
  console.log("\n=== ALL JOBS IN SUPABASE (" + (allJobs?.length || 0) + " total) ===");
  allJobs?.forEach((j) => {
    console.log(`- [${j.id}] "${j.title}" (Category: ${j.category}, Skills: ${JSON.stringify(j.skills_required)})`);
  });
}

verify().catch(console.error);
