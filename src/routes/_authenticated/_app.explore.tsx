import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PostViewer } from "@/components/PostViewer";

export const Route = createFileRoute("/_authenticated/_app/explore")({
  head: () => ({ meta: [{ title: "Search — Omnicraft" }] }),
  component: ExplorePage,
});

type Profile = {
  id: string; username: string; full_name: string | null;
  avatar_url: string | null; bio: string | null; role: string | null;
  location?: string | null;
};
type Tile =
  | { kind: "post"; id: string; media_url: string; post_type: string; caption: string | null; author_id: string; author?: Profile; created_at: string }
  | { kind: "portfolio"; id: string; media_url: string; title: string; user_id: string; author?: Profile; created_at: string };

// Instagram-style masonry pattern: some tiles are 2x2 (span two cols/rows) among 3-col grid.
function tallIndex(i: number) {
  // Every 7th slot is a big tile
  return i % 7 === 2;
}

function ExplorePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewerPostId, setViewerPostId] = useState<string | null>(null);

  // Initial unified discovery feed
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: posts }, { data: ports }] = await Promise.all([
        supabase.from("posts").select("*").not("media_url", "is", null)
          .order("created_at", { ascending: false }).limit(180),
        supabase.from("portfolios").select("*").not("media_url", "is", null)
          .order("created_at", { ascending: false }).limit(60),
      ]);
      const authorIds = new Set<string>();
      (posts ?? []).forEach((p: any) => authorIds.add(p.author_id));
      (ports ?? []).forEach((p: any) => authorIds.add(p.user_id));
      let profMap = new Map<string, Profile>();
      if (authorIds.size) {
        const { data: profs } = await supabase.from("profiles")
          .select("id, username, full_name, avatar_url, bio, role, location")
          .in("id", Array.from(authorIds));
        profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      }
      const postTiles: Tile[] = (posts ?? []).map((p: any) => ({
        kind: "post", id: p.id, media_url: p.media_url, post_type: p.post_type,
        caption: p.caption, author_id: p.author_id, author: profMap.get(p.author_id),
        created_at: p.created_at,
      }));
      const portTiles: Tile[] = (ports ?? []).map((p: any) => ({
        kind: "portfolio", id: p.id, media_url: p.media_url, title: p.title,
        user_id: p.user_id, author: profMap.get(p.user_id), created_at: p.created_at,
      }));
      // Interleave posts & portfolios, then shuffle lightly for a natural mix
      const mixed: Tile[] = [];
      let pi = 0, fi = 0;
      while (pi < postTiles.length || fi < portTiles.length) {
        for (let k = 0; k < 4 && pi < postTiles.length; k++) mixed.push(postTiles[pi++]);
        if (fi < portTiles.length) mixed.push(portTiles[fi++]);
      }
      setTiles(mixed);
      setLoading(false);
    })();
  }, []);

  // Unified search across creators + tiles + jobs + hashtags
  useEffect(() => {
    const term = q.trim();
    if (!term) { setPeople([]); return; }
    const t = term.replace(/^[@#]/, "");
    (async () => {
      const [{ data: profs }, { data: specs }] = await Promise.all([
        supabase.from("profiles")
          .select("id, username, full_name, avatar_url, bio, role, location")
          .or(`username.ilike.%${t}%,full_name.ilike.%${t}%,bio.ilike.%${t}%,location.ilike.%${t}%`)
          .limit(24),
        supabase.from("creator_specialties").select("user_id").ilike("specialty", `%${t}%`).limit(60),
      ]);
      const specIds = new Set((specs ?? []).map((s: any) => s.user_id));
      let extra: any[] = [];
      if (specIds.size) {
        const { data } = await supabase.from("profiles")
          .select("id, username, full_name, avatar_url, bio, role, location")
          .in("id", Array.from(specIds)).limit(24);
        extra = data ?? [];
      }
      const merged = new Map<string, Profile>();
      [...(profs ?? []), ...extra].forEach((p: any) => merged.set(p.id, p));
      setPeople(Array.from(merged.values()).slice(0, 12));
    })();
  }, [q]);

  const filteredTiles = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/^[@#]/, "");
    if (!term) return tiles;
    return tiles.filter((t) => {
      const text = t.kind === "post" ? (t.caption ?? "") : t.title;
      return (
        text.toLowerCase().includes(term) ||
        t.author?.username?.toLowerCase().includes(term) ||
        t.author?.full_name?.toLowerCase().includes(term) ||
        t.author?.location?.toLowerCase().includes(term)
      );
    });
  }, [tiles, q]);

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 space-y-4">
      {/* Search bar */}
      <div className="sticky top-0 z-30 -mx-3 sm:-mx-4 px-3 sm:px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search accounts, reels, posts, hashtags…"
            className="w-full pl-11 pr-4 h-12 rounded-full bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring text-sm"
          />
        </div>
      </div>

      {/* People results (top strip when searching) */}
      {q.trim() && people.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {people.map((p) => (
            <Link key={p.id} to="/user/$username" params={{ username: p.username }}
              className="shrink-0 w-24 flex flex-col items-center text-center gap-1">
              <div className="w-16 h-16 rounded-full bg-muted overflow-hidden flex items-center justify-center font-bold ring-2 ring-brand/30">
                {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : p.username.slice(0, 1).toUpperCase()}
              </div>
              <p className="text-[11px] font-semibold truncate w-full">@{p.username}</p>
              <p className="text-[10px] text-muted-foreground capitalize truncate w-full">{p.role ?? "creator"}</p>
            </Link>
          ))}
        </div>
      )}

      {/* Unified masonry grid — reels, posts, portfolios all mixed */}
      {loading ? (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-sm" />
          ))}
        </div>
      ) : filteredTiles.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 bg-surface border border-border rounded-2xl text-sm">
          No results — try another search
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 auto-rows-[minmax(0,1fr)]">
          {filteredTiles.map((t, i) => {
            const big = tallIndex(i);
            return (
              <ExploreTile
                key={`${t.kind}-${t.id}`}
                tile={t}
                big={big}
                onReelClick={(id) => navigate({ to: "/reels", search: { start: id } })}
                onPostClick={(id) => setViewerPostId(id)}
              />
            );
          })}
        </div>
      )}
      {viewerPostId && (
        <PostViewer startId={viewerPostId} onClose={() => setViewerPostId(null)} />
      )}
    </div>
  );
}

function ExploreTile({ tile, big, onReelClick, onPostClick }: {
  tile: Tile; big?: boolean;
  onReelClick?: (id: string) => void;
  onPostClick?: (id: string) => void;
}) {
  const username = tile.author?.username ?? "";
  const isVideo = tile.kind === "post" && (tile.post_type === "video" || tile.post_type === "reel");
  const spanCls = big ? "col-span-2 row-span-2" : "";

  if (isVideo && onReelClick) {
    return (
      <button onClick={() => onReelClick(tile.id)}
        className={`relative aspect-square bg-muted overflow-hidden rounded-sm group text-left ${spanCls}`}>
        <video src={tile.media_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
        <div className="absolute top-1.5 right-1.5 text-white drop-shadow"><Play className="w-4 h-4 fill-white" /></div>
      </button>
    );
  }

  // Image posts open the in-app PostViewer (Instagram Explore behavior)
  if (tile.kind === "post" && onPostClick) {
    return (
      <button onClick={() => onPostClick(tile.id)}
        className={`relative aspect-square bg-muted overflow-hidden rounded-sm group text-left ${spanCls}`}>
        <img src={tile.media_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" loading="lazy" />
      </button>
    );
  }

  // Portfolio tiles still route to the creator profile
  return (
    <Link to="/user/$username" params={{ username }}
      className={`relative aspect-square bg-muted overflow-hidden rounded-sm group ${spanCls}`}>
      <img src={tile.media_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" loading="lazy" />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition">
        <p className="text-[10px] text-white font-semibold truncate">@{username}</p>
      </div>
    </Link>
  );
}
