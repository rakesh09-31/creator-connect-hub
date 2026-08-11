import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { PostCard, type PostLike } from "@/components/PostCard";
import { supabase } from "@/integrations/supabase/client";

/**
 * Instagram-style Explore post viewer: fullscreen overlay showing a vertical
 * feed of posts starting from the tapped post. Swipe / scroll to continue.
 */
export function PostViewer({ startId, onClose }: { startId: string; onClose: () => void }) {
  const [posts, setPosts] = useState<PostLike[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Load the starting post + surrounding recent posts (image + video mixed).
      const [{ data: startPost }, { data: recent }] = await Promise.all([
        supabase.from("posts").select("*").eq("id", startId).maybeSingle(),
        supabase.from("posts").select("*").not("media_url", "is", null)
          .order("created_at", { ascending: false }).limit(60),
      ]);
      const seen = new Set<string>();
      const list: PostLike[] = [];
      if (startPost) { list.push(startPost as PostLike); seen.add((startPost as any).id); }
      (recent ?? []).forEach((p: any) => {
        if (!seen.has(p.id)) { list.push(p as PostLike); seen.add(p.id); }
      });
      // Attach authors
      const ids = Array.from(new Set(list.map((p) => p.author_id)));
      if (ids.length) {
        const { data: profs } = await supabase.from("profiles")
          .select("id, username, full_name, avatar_url, role").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        list.forEach((p) => (p.author = map.get(p.author_id)));
      }
      setPosts(list);
      setLoading(false);
    })();
  }, [startId]);

  useEffect(() => {
    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Ensure starting post is visible (in case initial paint scrolls somewhere else)
  useEffect(() => {
    if (loading || startedRef.current) return;
    startedRef.current = true;
    const el = scrollerRef.current?.querySelector(`[data-pid="${startId}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "start" });
  }, [loading, startId]);

  return (
    <div className="fixed inset-0 z-[70] bg-background flex flex-col animate-fade-in">
      <div className="flex items-center justify-between px-4 h-14 border-b border-border bg-surface/90 backdrop-blur">
        <h3 className="text-sm font-semibold">Posts</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-muted"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div ref={scrollerRef} className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="max-w-2xl mx-auto p-4 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-surface border border-border overflow-hidden">
                <div className="h-14 bg-muted animate-pulse" />
                <div className="aspect-square bg-muted animate-pulse" />
                <div className="h-16 bg-muted/50 animate-pulse" />
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-2 sm:px-4 py-3 space-y-3">
            {posts.map((p) => (
              <div key={p.id} data-pid={p.id}>
                <PostCard post={p} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
