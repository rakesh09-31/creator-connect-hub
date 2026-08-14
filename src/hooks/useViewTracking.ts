import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

const viewedSessions = new Set<string>();

/**
 * Tracks and records video views.
 * If the video is playing for at least 2 seconds, it inserts a view record.
 */
export function useViewTracking(postId: string | undefined, isPlaying: boolean) {
  const { user } = useAuth();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!postId || !isPlaying || !user) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const sessionKey = `${user.id}:${postId}`;
    if (viewedSessions.has(sessionKey)) {
      return; // Already viewed in this session
    }

    timerRef.current = setTimeout(async () => {
      viewedSessions.add(sessionKey);
      try {
        // Record the view on Supabase. Ignores duplicates via ON CONFLICT (unique constraint).
        const { error } = await (supabase.from as any)("post_views").insert({
          post_id: postId,
          viewer_id: user.id,
        });
        if (error && error.code !== "23505") {
          console.error("Failed to record view:", error.message);
        }
      } catch (err) {
        console.error("View tracking error:", err);
      }
    }, 2000); // 2 seconds threshold

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [postId, isPlaying, user]);
}
