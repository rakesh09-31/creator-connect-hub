import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function testAuthUpsert() {
  const { data: signinData, error: signInErr } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });

  const authUserId = signinData.user.id;
  console.log("Logged in user auth id:", authUserId);

  const creatorIdentifier = "vinay";
  const { data: creatorProf, error: vErr } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, bio")
    .or(`username.ilike.${creatorIdentifier},full_name.ilike.${creatorIdentifier}`)
    .limit(1)
    .maybeSingle();

  console.log("creatorProf for 'vinay':", creatorProf);

  const { data: userProf } = await supabase
    .from("profiles")
    .select("id, auth_user_id, username")
    .or(`id.eq.${authUserId},auth_user_id.eq.${authUserId}`)
    .maybeSingle();

  console.log("userProf:", userProf);

  // Get squad
  let { data: squad } = await supabase
    .from("squads")
    .select("id, name, owner_id")
    .eq("owner_id", userProf.id)
    .eq("name", "Romantic Musical Film")
    .maybeSingle();

  console.log("squad:", squad);

  const { data: smData, error: smErr } = await supabase
    .from("squad_members")
    .upsert(
      {
        squad_id: squad.id,
        user_id: creatorProf.id,
        role: "Cinematographer",
      },
      { onConflict: "squad_id,user_id" }
    )
    .select();

  console.log("squad_members upsert result:", smData, "error:", smErr);
}

testAuthUpsert();
