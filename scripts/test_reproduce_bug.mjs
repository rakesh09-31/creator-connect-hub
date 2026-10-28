import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

async function reproduce() {
  console.log("--- 1. Testing lookup of Vinay ---");
  const creatorIdentifier = "vinay";
  const { data: creatorProf, error: pErr } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, role, bio")
    .or(`username.ilike.${creatorIdentifier},full_name.ilike.${creatorIdentifier}`)
    .limit(1)
    .maybeSingle();

  console.log("creatorProf:", creatorProf, "pErr:", pErr);

  console.log("\n--- 2. Testing squad creation/retrieval ---");
  // Let's see what happens when we do getOrCreateProjectSquad or direct queries
  const { data: ownerProf } = await supabase
    .from("profiles")
    .select("id, auth_user_id, username")
    .limit(1)
    .maybeSingle();
  console.log("ownerProf:", ownerProf);

  const ownerId = ownerProf.id;
  const squadName = "Romantic Musical Film";

  // Check if squad exists or insert
  let { data: squad } = await supabase
    .from("squads")
    .select("id, name, owner_id")
    .eq("name", squadName)
    .limit(1)
    .maybeSingle();

  if (!squad) {
    const { data: newSquad, error: sqErr } = await supabase
      .from("squads")
      .insert({
        name: squadName,
        description: "OmniForge Film Squad",
        specialty: "Film",
        owner_id: ownerId,
      })
      .select("id, name, owner_id")
      .single();
    console.log("Created squad:", newSquad, "sqErr:", sqErr);
    squad = newSquad;
  } else {
    console.log("Found existing squad:", squad);
  }

  if (!squad) {
    console.error("Could not find or create squad!");
    return;
  }

  console.log("\n--- 3. Testing upsert to squad_members for Vinay ---");
  const assignedRole = "Cinematographer";
  const { data: smData, error: smErr } = await supabase.from("squad_members").upsert(
    {
      squad_id: squad.id,
      user_id: creatorProf.id,
      role: assignedRole,
    },
    { onConflict: "squad_id,user_id" }
  ).select();
  console.log("squad_members upsert result:", smData, "error:", smErr);

  console.log("\n--- 4. Testing upsert to squad_invitations for Vinay ---");
  const { data: siData, error: siErr } = await supabase.from("squad_invitations").upsert(
    {
      squad_id: squad.id,
      inviter_id: ownerId,
      invitee_id: creatorProf.id,
      role: assignedRole,
      status: "accepted",
      project_name: squadName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "squad_id,invitee_id" }
  ).select();
  console.log("squad_invitations upsert result:", siData, "error:", siErr);

  console.log("\n--- 5. Testing fetchSquadMembers and fetchSquadInvitations ---");
  const { data: dbMembers, error: fsmErr } = await supabase
    .from("squad_members")
    .select("*, user:user_id(id, username, full_name, avatar_url)")
    .eq("squad_id", squad.id);
  console.log("fetchSquadMembers result count:", dbMembers?.length, "error:", fsmErr);
  console.log("dbMembers:", JSON.stringify(dbMembers, null, 2));

  const { data: dbInvs, error: fsiErr } = await supabase
    .from("squad_invitations")
    .select("*, invitee:invitee_id(id, username, full_name, avatar_url), inviter:inviter_id(id, username, full_name)")
    .eq("squad_id", squad.id);
  console.log("fetchSquadInvitations result count:", dbInvs?.length, "error:", fsiErr);
}

reproduce();
