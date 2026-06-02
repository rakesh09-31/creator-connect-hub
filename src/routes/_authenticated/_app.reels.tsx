import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_app/reels")({
  head: () => ({ meta: [{ title: "Reels — Omnicraft" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ start: typeof s.start === "string" ? s.start : undefined }),
  component: ReelsPage,
});

type Profile = { id: string; username: string; full_name: string | null; avatar_url: string | null; role: string | null };
type Reel = {
  id: string; caption: string | null; media_url: string | null; post_type: string;
  created_at: string; author_id: string; author?: Profile;
};

function ReelsPage() {
  const { start } = Route.useSearch();
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Fetch all video/reel posts
      const { data } = await supabase
        .from("posts").select("*")
        .in("post_type", ["video", "reel"])
        .order("created_at", { ascending: false })
        .limit(80);
      let list = (data ?? []) as Reel[];

      // If a starting reel is given but not in list (e.g. photo), prepend it
      if (start && !list.find((r) => r.id === start)) {
        const { data: one } = await supabase.from("posts").select("*").eq("id", start).maybeSingle();
        if (one) list = [one as Reel, ...list];
      } else if (start) {
        // Move starting reel to top
        list = [list.find((r) => r.id === start)!, ...list.filter((r) => r.id !== start)];
      }

      const ids = Array.from(new Set(list.map((r) => r.author_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles").select("id, username, full_name, avatar_url, role").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        list.forEach((r) => (r.author = map.get(r.author_id)));
      }
      setReels(list);
      setLoading(false);
    })();
  }, [start]);

  if (loading) {
    return <div className="h-[calc(100vh-8rem)] flex items-center justify-center text-muted-foreground text-sm">Loading reels…</div>;
  }
  if (reels.length === 0) {
    return <div className="h-[calc(100vh-8rem)] flex items-center justify-center text-muted-foreground text-sm">No reels yet.</div>;
  }

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <button
        onClick={() => navigate({ to: "/explore" })}
        className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/70"
        aria-label="Back"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div
        ref={containerRef}
        className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {reels.map((r) => (
          <ReelItem key={r.id} reel={r} />
        ))}
      </div>
    </div>
  );
}

function ReelItem({ reel }: { reel: Reel }) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isVideo = reel.post_type === "video" || reel.post_type === "reel";

  return (
    <div className="h-screen w-full snap-start relative flex items-center justify-center bg-black">
      {reel.media_url && isVideo ? (
        <video
          ref={ref}
          src={reel.media_url}
          className="max-h-full max-w-full object-contain"
          loop
          muted
          playsInline
        />
      ) : reel.media_url ? (
        <img src={reel.media_url} className="max-h-full max-w-full object-contain" alt="" />
      ) : (
        <div className="text-white text-center p-8 max-w-md">{reel.caption}</div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6 pb-24 bg-gradient-to-t from-black/80 to-transparent text-white">
        <Link
          to="/user/$username"
          params={{ username: reel.author?.username ?? "" }}
          className="flex items-center gap-3 mb-3 hover:opacity-80"
        >
          <div className="w-10 h-10 rounded-full bg-white/20 ring-2 ring-white/40 overflow-hidden flex items-center justify-center font-bold">
            {reel.author?.avatar_url
              ? <img src={reel.author.avatar_url} className="w-full h-full object-cover" />
              : (reel.author?.username ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-sm">@{reel.author?.username ?? "user"}</p>
            <p className="text-xs text-white/70">{reel.author?.full_name}</p>
          </div>
        </Link>
        {reel.caption && <p className="text-sm leading-relaxed line-clamp-3 max-w-md">{reel.caption}</p>}
      </div>

      <div className="absolute right-4 bottom-32 flex flex-col gap-5 text-white">
        <ActionBtn icon={<Heart className="w-6 h-6" />} label="0" />
        <ActionBtn icon={<MessageCircle className="w-6 h-6" />} label="0" />
        <ActionBtn icon={<Share2 className="w-6 h-6" />} label="" />
      </div>
    </div>
  );
}

function ActionBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button className="flex flex-col items-center gap-1">
      <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20">
        {icon}
      </div>
      {label && <span className="text-xs font-semibold">{label}</span>}
    </button>
  );
}
