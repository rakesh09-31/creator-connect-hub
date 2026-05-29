import { supabase } from "@/integrations/supabase/client";

export async function uploadMedia(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() || (file.type.startsWith("video/") ? "mp4" : "jpg");
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}
