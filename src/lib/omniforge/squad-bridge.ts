import { supabase } from "@/integrations/supabase/client";
import { OmniForgeProject } from "./types";
import { getOrCreateProjectSquad } from "./collaboration";

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

    // 1. Get or create Squad using atomic workspace helper
    const squadRes = await getOrCreateProjectSquad(project, ownerId);
    if (!squadRes.success || !squadRes.squadId) {
      console.error("Failed to create squad:", squadRes.error);
      return {
        success: false,
        error: squadRes.error || "Could not create squad record",
        invitedCount: 0,
      };
    }

    const squadId = squadRes.squadId;

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
