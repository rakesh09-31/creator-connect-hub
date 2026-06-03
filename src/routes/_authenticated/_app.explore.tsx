import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Heart, MessageCircle, Share2, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_app/explore")({
  head: () => ({ meta: [{ title: "Search — Omnicraft" }] }),
  component: ExplorePage,
});

type Profile = {
  id: string; username: string; full_name: string | null;
  avatar_url: string | null; bio: string | null; role: string | null;
};

type Reel = {
  id: string; caption: string | null; media_url: string | null;
  post_type: string; created_at: string; author_id: string; author?: Profile;
};

function ExplorePage() {
  const [q, setQ] = useState("");
  const [people, setPeople] = useState<Profile[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  // Load all reels for the feed
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("posts").select("*")
        .in("post_type", ["video", "reel"])
        .order("created_at", { ascending: false })
        .limit(60);
      const list = (data ?? []) as Reel[];
      const ids = Array.from(new Set(list.map((p) => p.author_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles").select("id, username, full_name, avatar_url, bio, role")
          .in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        list.forEach((p) => (p.author = map.get(p.author_id)));
      }
      setReels(list);
      setLoading(false);
    })();
  }, []);

  // Search for accounts when query changes
  useEffect(() => {
    const term = q.trim();
    if (!term) { setPeople([]); return; }
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, role")
        .or(`username.ilike.%${term}%,full_name.ilike.%${term}%,bio.ilike.%${term}%`)
        .limit(20);
      setPeople((data ?? []) as Profile[]);
    })();
  }, [q]);

  const matchedReels = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return reels;
    return reels.filter(
      (r) =>
        r.caption?.toLowerCase().includes(term) ||
        r.author?.username?.toLowerCase().includes(term) ||
        r.author?.full_name?.toLowerCase().includes(term),
    );
  }, [reels, q]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      {/* Search bar */}
      <div className="sticky top-0 z-30 -mx-4 px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search accounts and reels…"
            className="w-full pl-11 pr-4 h-12 rounded-full bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring text-sm"
          />
        </div>
      </div>

      {/* Account results (only when searching) */}
      {q.trim() && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            Accounts ({people.length})
          </h2>
          {people.length === 0 ? (
            <div className="text-center text-muted-foreground py-6 bg-surface border border-border rounded-xl text-sm">
              No accounts match
            </div>
          ) : (
            <div className="space-y-2">
              {people.map((p) => (
                <Link
                  key={p.id}
                  to="/user/$username"
                  params={{ username: p.username }}
                  className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl hover:border-brand/40 transition"
                >
                  <div className="w-11 h-11 rounded-full bg-muted overflow-hidden flex items-center justify-center font-semibold">
                    {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : p.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm truncate">{p.full_name || p.username}</p>
                      <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        p.role === "creator" ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"
                      }`}>{p.role ?? "user"}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate">@{p.username}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Reels feed — vertical scrolling auto-play */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {q.trim() ? "Reels" : "Reels for you"}
        </h2>
        {loading ? (
          <div className="text-center text-muted-foreground py-16 text-sm">Loading reels…</div>
        ) : matchedReels.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 bg-surface border border-border rounded-2xl text-sm">
            <Play className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            No reels yet
          </div>
        ) : (
          <div className="space-y-4">
            {matchedReels.map((r) => <ReelCard key={r.id} reel={r} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function ReelCard({ reel }: { reel: Reel }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [liked, setLiked] = useState(false);
  const isVideo = reel.post_type === "video" || reel.post_type === "reel";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <article className="bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
      <header className="flex items-center gap-3 p-3">
        <Link to="/user/$username" params={{ username: reel.author?.username ?? "" }} className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center font-semibold text-sm">
            {reel.author?.avatar_url
              ? <img src={reel.author.avatar_url} className="w-full h-full object-cover" />
              : (reel.author?.username ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">@{reel.author?.username ?? "user"}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{reel.author?.role ?? "creator"}</p>
          </div>
        </Link>
      </header>
      <div className="bg-black flex items-center justify-center">
        {reel.media_url && isVideo ? (
          <video
            ref={ref}
            src={reel.media_url}
            className="w-full max-h-[70vh] object-contain"
            loop
            muted
            playsInline
          />
        ) : reel.media_url ? (
          <img src={reel.media_url} className="w-full max-h-[70vh] object-contain" alt="" />
        ) : (
          <div className="p-10 text-white text-center">{reel.caption}</div>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => setLiked(!liked)}>
            <Heart className={`w-6 h-6 ${liked ? "fill-destructive text-destructive" : ""}`} />
          </button>
          <button><MessageCircle className="w-6 h-6" /></button>
          <button><Share2 className="w-6 h-6" /></button>
        </div>
        {reel.caption && (
          <p className="text-sm leading-relaxed">
            <span className="font-semibold mr-1.5">{reel.author?.username}</span>
            {reel.caption}
          </p>
        )}
      </div>
    </article>
  );
}
