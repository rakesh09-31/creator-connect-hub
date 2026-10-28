import { supabase } from "../src/integrations/supabase/client";

async function check() {
  const { data: prof } = await supabase.from("profiles").select("*").eq("username", "creator_1787749078759").single();
  console.log("Profile:", prof);

  const { data: roles } = await supabase.from("creator_professional_roles").select("*, professional_roles(*)").eq("creator_id", prof?.id);
  console.log("Roles:", roles);

  const { data: skills } = await supabase.from("creator_skills").select("*").eq("creator_id", prof?.id);
  console.log("Skills:", skills);

  const { data: portfolio } = await supabase.from("portfolio_items").select("*").eq("user_id", prof?.id);
  console.log("Portfolio:", portfolio);
}

check();
