import { supabase } from "@/integrations/supabase/client";
import { OmniForgeProject } from "./types";

export interface SquadConversionResult {
  success: boolean;
  squadId?: string;
  squadName?: string;
  invitedCount: number;
  error?: string;
}

/**
 * Converts an approved OmniForge project team blueprint into an active OmniCraft Squad.
 * Reuses existing `squads`, `squad_members`, `squad_invitations`, and `conversations`.
 */
export async function convertProjectToSquad(
  project: OmniForgeProject,
  ownerId: string
): Promise<SquadConversionResult> {
  try {
    const squadName = project.title.slice(0, 48);
    const description = `OmniForge Project Squad: ${project.description.slice(0, 200)}`;
    const specialty = project.domain;

    // 1. Create Squad in existing public.squads table
    const { data: squad, error: squadErr } = await supabase
      .from("squads")
      .insert({
        name: squadName,
        description,
        specialty,
        owner_id: ownerId,
      })
      .select()
      .single();

    if (squadErr || !squad) {
      console.error("Failed to create squad:", squadErr);
      return { success: false, error: squadErr?.message || "Could not create squad record", invitedCount: 0 };
    }

    const squadId = squad.id;

    // 2. Ensure owner is added as admin member in public.squad_members
    await supabase.from("squad_members").upsert(
      {
        squad_id: squadId,
        user_id: ownerId,
        role: "admin",
      },
      { onConflict: "squad_id,user_id" }
    );

    // 3. Send invitations to all selected creators
    let invitedCount = 0;
    const selectedRecs = project.recommendations.filter(
      (r) => (r.status === "recommended" || r.status === "selected" || r.status === "invited") && r.creator.id !== ownerId
    );

    for (const rec of selectedRecs) {
      try {
        const { error: invErr } = await (supabase as any).from("squad_invitations").insert({
          squad_id: squadId,
          inviter_id: ownerId,
          invitee_id: rec.creator.id,
          status: "pending",
        });
        if (!invErr) {
          invitedCount++;
          rec.status = "invited";
        }
      } catch (e) {
        console.warn(`Could not send squad invite to ${rec.creator.username}:`, e);
      }
    }

    // 4. Create or initialize squad conversation if RPC is available
    try {
      await (supabase as any).rpc("get_or_create_squad_conversation", { _squad_id: squadId });
    } catch (e) {
      // Non-blocking fallback
      console.warn("Squad chat conversation RPC:", e);
    }

    return {
      success: true,
      squadId,
      squadName,
      invitedCount,
    };
  } catch (err: any) {
    console.error("Squad conversion failed:", err);
    return {
      success: false,
      error: err?.message || "Unexpected error converting project to squad",
      invitedCount: 0,
    };
  }
}
