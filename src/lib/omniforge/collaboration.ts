import { supabase } from "@/integrations/supabase/client";
import { OmniForgeProject } from "./types";

export interface SquadTask {
  id: string;
  squad_id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  assignee?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface SquadInvitation {
  id: string;
  squad_id: string;
  inviter_id: string;
  invitee_id: string;
  role: string;
  status: "pending" | "accepted" | "declined" | "rejected" | "cancelled";
  project_name?: string | null;
  brief?: string | null;
  budget?: string | null;
  timeline?: string | null;
  created_at: string;
  updated_at: string;
  invitee?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  inviter?: {
    id: string;
    username: string;
    full_name: string | null;
  } | null;
}

export interface SquadMember {
  id: string;
  squad_id: string;
  user_id: string;
  role: string;
  created_at: string;
  user?: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export interface ProjectSquadDetails {
  id: string;
  name: string;
  description: string | null;
  specialty: string | null;
  owner_id: string;
  budget: string | null;
  timeline: string | null;
  project_brief: string | null;
  created_at: string;
  updated_at: string;
  members: SquadMember[];
  invitations: SquadInvitation[];
  tasks: SquadTask[];
}

/**
 * Retrieves existing squad for a project or creates an active collaboration squad.
 */
export async function getOrCreateProjectSquad(
  project: OmniForgeProject,
  ownerId: string
): Promise<{ success: boolean; squadId?: string; error?: string }> {
  try {
    const squadName = (project.title || "Project Squad").slice(0, 48);
    const description = (project.description || project.storyPremise || `OmniForge Project Squad`).slice(0, 240);
    const brief = (project.description || project.storyPremise || "").slice(0, 500);

    // 1. Check if user already owns a squad with this name or check project.squadId
    const { data: existingSquads } = await supabase
      .from("squads")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("name", squadName)
      .limit(1);

    if (existingSquads && existingSquads.length > 0) {
      const squadId = existingSquads[0].id;
      // Ensure owner is admin member
      await supabase.from("squad_members").upsert(
        { squad_id: squadId, user_id: ownerId, role: "owner" },
        { onConflict: "squad_id,user_id" }
      );
      return { success: true, squadId };
    }

    // 2. Create new Squad
    const { data: newSquad, error: createErr } = await (supabase as any)
      .from("squads")
      .insert({
        name: squadName,
        description,
        specialty: project.domain || "Creative",
        owner_id: ownerId,
        budget: project.budget || null,
        timeline: project.estimatedTotalDuration || null,
        project_brief: brief || null,
      })
      .select("id")
      .single();

    if (createErr || !newSquad) {
      return { success: false, error: createErr?.message || "Failed to create squad record" };
    }

    const squadId = newSquad.id;

    // 3. Ensure owner is added as owner/admin in squad_members
    await supabase.from("squad_members").upsert(
      { squad_id: squadId, user_id: ownerId, role: "owner" },
      { onConflict: "squad_id,user_id" }
    );

    return { success: true, squadId };
  } catch (err: any) {
    return { success: false, error: err?.message || "Failed to initialize project squad" };
  }
}

/**
 * Sends a real creator invitation to a project squad.
 * Prevents duplicate invitations and notifies the invitee.
 */
export async function sendCreatorInvitation(params: {
  squadId: string;
  inviterId: string;
  inviteeId: string;
  role: string;
  projectName?: string;
  brief?: string;
  budget?: string;
  timeline?: string;
}): Promise<{ success: boolean; invitation?: SquadInvitation; error?: string }> {
  try {
    const { squadId, inviterId, inviteeId, role, projectName, brief, budget, timeline } = params;

    if (inviterId === inviteeId) {
      return { success: false, error: "Cannot invite yourself to your own project." };
    }

    // Verify and resolve inviter profile ID to satisfy foreign keys
    let resolvedInviterId = inviterId;
    const { data: inviterProf } = await supabase
      .from("profiles")
      .select("id")
      .or(`id.eq.${inviterId},auth_user_id.eq.${inviterId}`)
      .limit(1)
      .maybeSingle();

    if (inviterProf?.id) {
      resolvedInviterId = inviterProf.id;
    }

    // Verify and resolve invitee profile ID from directory
    let resolvedInviteeId = inviteeId;
    const { data: inviteeProf } = await supabase
      .from("profiles")
      .select("id")
      .or(`id.eq.${inviteeId},auth_user_id.eq.${inviteeId}`)
      .limit(1)
      .maybeSingle();

    if (inviteeProf?.id) {
      resolvedInviteeId = inviteeProf.id;
    } else {
      return {
        success: false,
        error: "This creator profile could not be found in the OmniCraft directory.",
      };
    }

    // 1. Check for existing invitation to prevent duplicates
    const { data: existing } = await (supabase as any)
      .from("squad_invitations")
      .select("*")
      .eq("squad_id", squadId)
      .eq("invitee_id", resolvedInviteeId)
      .maybeSingle();

    if (existing) {
      if (existing.status === "pending") {
        return { success: false, error: "An active pending invitation has already been sent to this creator." };
      }
      if (existing.status === "accepted") {
        return { success: false, error: "This creator is already an accepted member of the squad." };
      }

      // Re-activate if declined or cancelled
      const { data: updated, error: updateErr } = await (supabase as any)
        .from("squad_invitations")
        .update({
          status: "pending",
          role,
          project_name: projectName || null,
          brief: brief || null,
          budget: budget || null,
          timeline: timeline || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*, invitee:invitee_id(id, username, full_name, avatar_url), inviter:inviter_id(id, username, full_name)")
        .single();

      if (updateErr) {
        return { success: false, error: updateErr.message };
      }

      // Dispatch notification
      await dispatchNotification({
        userId: resolvedInviteeId,
        actorId: resolvedInviterId,
        type: "squad_invitation",
        squadId,
        data: {
          squad_id: squadId,
          project_name: projectName,
          role,
          brief,
          budget,
          timeline,
        },
      });

      return { success: true, invitation: updated };
    }

    // 2. Insert new invitation
    const { data: inserted, error: insertErr } = await (supabase as any)
      .from("squad_invitations")
      .insert({
        squad_id: squadId,
        inviter_id: resolvedInviterId,
        invitee_id: resolvedInviteeId,
        role: role || "member",
        status: "pending",
        project_name: projectName || null,
        brief: brief || null,
        budget: budget || null,
        timeline: timeline || null,
      })
      .select("*, invitee:invitee_id(id, username, full_name, avatar_url), inviter:inviter_id(id, username, full_name)")
      .single();

    if (insertErr || !inserted) {
      const isInviteeProfileErr =
        insertErr?.message?.includes("squad_invitations_invitee_id_profiles_fkey") ||
        (insertErr?.code === "23503" &&
          (insertErr?.details?.includes("invitee_id") || insertErr?.message?.includes("invitee_id")));

      if (isInviteeProfileErr) {
        return {
          success: false,
          error: "This creator profile could not be found in the OmniCraft directory.",
        };
      }
      if (
        insertErr?.code === "23505" ||
        insertErr?.message?.includes("duplicate key") ||
        insertErr?.message?.includes("unique constraint") ||
        insertErr?.message?.includes("squad_invitations_squad_id_invitee_id_key")
      ) {
        return {
          success: false,
          error: "An active invitation has already been sent to this creator for this project.",
        };
      }
      return { success: false, error: insertErr?.message || "Failed to create invitation record." };
    }

    // 3. Dispatch in-app notification to invitee
    await dispatchNotification({
      userId: inviteeId,
      actorId: inviterId,
      type: "squad_invitation",
      squadId,
      data: {
        squad_id: squadId,
        project_name: projectName,
        role,
        brief,
        budget,
        timeline,
      },
    });

    return { success: true, invitation: inserted };
  } catch (err: any) {
    return { success: false, error: err?.message || "Unexpected error sending invitation." };
  }
}

/**
 * Cancels a pending invitation by the project owner.
 */
export async function cancelCreatorInvitation(
  invitationId: string,
  inviterId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from("squad_invitations")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", invitationId)
      .eq("inviter_id", inviterId);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Could not cancel invitation." };
  }
}

/**
 * Accepts an invitation by the invited creator.
 */
export async function acceptCreatorInvitation(
  invitationId: string,
  inviteeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Try robust SQL RPC first
    const { error: rpcErr } = await (supabase as any).rpc("accept_squad_invitation", {
      p_invitation_id: invitationId,
    });

    if (!rpcErr) {
      return { success: true };
    }

    // 2. Direct fallback: resolve profile IDs
    const { data: inv, error: fetchErr } = await (supabase as any)
      .from("squad_invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (fetchErr || !inv) {
      return { success: false, error: "Invitation not found." };
    }

    const targetProfileId = inv.invitee_id;

    // Add to squad_members
    const { error: memErr } = await supabase.from("squad_members").upsert(
      {
        squad_id: inv.squad_id,
        user_id: targetProfileId,
        role: inv.role || "member",
      },
      { onConflict: "squad_id,user_id" }
    );

    if (memErr) {
      return { success: false, error: memErr.message };
    }

    // Update status to accepted
    await (supabase as any)
      .from("squad_invitations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", invitationId);

    // Notify project owner
    await dispatchNotification({
      userId: inv.inviter_id,
      actorId: targetProfileId,
      type: "squad_invitation_accepted",
      squadId: inv.squad_id,
      data: {
        squad_id: inv.squad_id,
        role: inv.role,
        project_name: inv.project_name,
      },
    });

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Could not accept invitation." };
  }
}

/**
 * Declines an invitation by the invited creator.
 */
export async function declineCreatorInvitation(
  invitationId: string,
  inviteeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Try robust SQL RPC first
    const { error: rpcErr } = await (supabase as any).rpc("reject_squad_invitation", {
      p_invitation_id: invitationId,
    });

    if (!rpcErr) {
      return { success: true };
    }

    const { data: inv } = await (supabase as any)
      .from("squad_invitations")
      .select("inviter_id, squad_id, role, project_name, invitee_id")
      .eq("id", invitationId)
      .single();

    const { error } = await (supabase as any)
      .from("squad_invitations")
      .update({ status: "declined", updated_at: new Date().toISOString() })
      .eq("id", invitationId);

    if (error) {
      return { success: false, error: error.message };
    }

    if (inv) {
      await dispatchNotification({
        userId: inv.inviter_id,
        actorId: inv.invitee_id,
        type: "squad_invitation_declined",
        squadId: inv.squad_id,
        data: {
          squad_id: inv.squad_id,
          role: inv.role,
          project_name: inv.project_name,
        },
      });
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Could not decline invitation." };
  }
}

/**
 * Fetches all invitations for a squad with invitee profile details.
 */
export async function fetchSquadInvitations(squadId: string): Promise<SquadInvitation[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("squad_invitations")
      .select("*, invitee:invitee_id(id, username, full_name, avatar_url), inviter:inviter_id(id, username, full_name)")
      .eq("squad_id", squadId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as SquadInvitation[];
  } catch {
    return [];
  }
}

/**
 * Fetches accepted squad members with full profile details.
 */
export async function fetchSquadMembers(squadId: string): Promise<SquadMember[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("squad_members")
      .select("*, user:user_id(id, username, full_name, avatar_url)")
      .eq("squad_id", squadId);

    if (error || !data) return [];
    return data as SquadMember[];
  } catch {
    return [];
  }
}

/**
 * Fetches persistent tasks for a squad workspace.
 */
export async function fetchSquadTasks(squadId: string): Promise<SquadTask[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("squad_tasks")
      .select("*, assignee:assigned_to(id, username, full_name, avatar_url)")
      .eq("squad_id", squadId)
      .order("created_at", { ascending: true });

    if (error || !data) return [];
    return data as SquadTask[];
  } catch {
    return [];
  }
}

/**
 * Creates a new persistent task in the squad workspace.
 */
export async function createSquadTask(params: {
  squadId: string;
  title: string;
  description?: string;
  assignedTo?: string | null;
  priority?: "low" | "medium" | "high" | "urgent";
  dueDate?: string | null;
  createdBy?: string;
}): Promise<{ success: boolean; task?: SquadTask; error?: string }> {
  try {
    const { data, error } = await (supabase as any)
      .from("squad_tasks")
      .insert({
        squad_id: params.squadId,
        title: params.title,
        description: params.description || null,
        assigned_to: params.assignedTo || null,
        priority: params.priority || "medium",
        status: "todo",
        due_date: params.dueDate || null,
        created_by: params.createdBy || null,
      })
      .select("*, assignee:assigned_to(id, username, full_name, avatar_url)")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message || "Failed to create task" };
    }
    return { success: true, task: data as SquadTask };
  } catch (err: any) {
    return { success: false, error: err?.message || "Unexpected task creation error" };
  }
}

/**
 * Updates task status in the workspace.
 */
export async function updateSquadTaskStatus(
  taskId: string,
  status: "todo" | "in_progress" | "done"
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any)
      .from("squad_tasks")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", taskId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Could not update task status" };
  }
}

/**
 * Deletes a workspace task.
 */
export async function deleteSquadTask(taskId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await (supabase as any).from("squad_tasks").delete().eq("id", taskId);
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || "Could not delete task" };
  }
}

/**
 * Helper to dispatch an in-app notification.
 */
async function dispatchNotification(params: {
  userId: string;
  actorId: string;
  type: string;
  squadId: string;
  data: Record<string, any>;
}) {
  try {
    await supabase.from("notifications").insert({
      user_id: params.userId,
      actor_id: params.actorId,
      type: params.type,
      entity_type: "squad",
      entity_id: params.squadId,
      data: params.data,
      read: false,
    });
  } catch (e) {
    console.warn("Could not insert notification:", e);
  }
}
