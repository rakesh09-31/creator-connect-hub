import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the single direct conversation shared by the signed-in user and
 * `targetUserId`. The database RPC is the sole authority for deduplication,
 * so every Message entry point follows the exact same path.
 */
export async function openOrCreateConversation(targetUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc("get_or_create_dm", { _other: targetUserId });
  if (error) throw error;
  if (!data) throw new Error("Unable to open this conversation");
  return data;
}
