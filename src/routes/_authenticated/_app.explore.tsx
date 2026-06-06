import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Search, Play, Image as ImageIcon, Briefcase, MapPin, Hash, Sparkles, Users, Film, Grid3x3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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
  | { kind: "post"; id: string; media_url: string; post_type: string; caption: string | null; author_id: string; author?: Profile }
  | { kind: "portfolio"; id: string; media_url: string; title: string; user_id: string; author?: Profile };
type Job = {
  id: string; title: string; category: string | null; budget: string | null;
  location: string | null; client_id: string;
};

const CATEGORIES = [
  "All", "Dancer", "Singer", "Actor", "Model", "Photographer", "Videographer",
  "Graphic Designer", "Makeup Artist", "Influencer", "Content Creator",
  "Musician", "Editor", "Event Host",
];
type ResultTab = "all" | "reels" | "posts" | "creators" | "jobs" | "portfolios";

function ExplorePage() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [resultTab, setResultTab] = useState<ResultTab>("all");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial feed: posts + portfolios, optionally filtered by category specialty
  useEffect(() => {
    (async () => {
      setLoading(true);

      // If a category is chosen, narrow author_ids by specialty
      let allowedAuthors: Set<string> | null = null;
      if (category !== "All") {
        const { data: specs } = await supabase
          .from("creator_specialties").select("user_id")
          .ilike("specialty", `%${category}%`).limit(500);
        allowedAuthors = new Set((specs ?? []).map((s: any) => s.user_id));
        if (allowedAuthors.size === 0) {
          setTiles([]); setLoading(false); return;
        }
      }

      const postsQ = supabase.from("posts").select("*")
        .not("media_url", "is", null)
        .order("created_at", { ascending: false }).limit(120);
      const portsQ = supabase.from("portfolios").select("*")
        .not("media_url", "is", null)
        .order("created_at", { ascending: false }).limit(60);

      const [{ data: posts }, { data: ports }] = await Promise.all([
        allowedAuthors ? postsQ.in("author_id", Array.from(allowedAuthors)) : postsQ,
        allowedAuthors ? portsQ.in("user_id", Array.from(allowedAuthors)) : portsQ,
      ]);

      const authorIds = new Set<string>();
      (posts ?? []).forEach((p: any) => authorIds.add(p.author_id));
      (ports ?? []).forEach((p: any) => authorIds.add(p.user_id));
      let profMap = new Map<string, Profile>();
      if (authorIds.size) {
        const { data: profs } = await supabase
          .from("profiles").select("id, username, full_name, avatar_url, bio, role")
          .in("id", Array.from(authorIds));
        profMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
      }
      const postTiles: Tile[] = (posts ?? []).map((p: any) => ({
        kind: "post", id: p.id, media_url: p.media_url, post_type: p.post_type,
        caption: p.caption, author_id: p.author_id, author: profMap.get(p.author_id),
      }));
      const portTiles: Tile[] = (ports ?? []).map((p: any) => ({
        kind: "portfolio", id: p.id, media_url: p.media_url, title: p.title,
        user_id: p.user_id, author: profMap.get(p.user_id),
      }));
      const mixed: Tile[] = [];
      const maxLen = Math.max(postTiles.length, portTiles.length);
      for (let i = 0; i < maxLen; i++) {
        if (postTiles[i]) mixed.push(postTiles[i]);
        if (i % 3 === 0 && portTiles[i / 3 | 0]) mixed.push(portTiles[i / 3 | 0]);
      }
      setTiles(mixed);
      setLoading(false);
    })();
  }, [category]);

  // Search across people + jobs
  useEffect(() => {
    const term = q.trim();
    if (!term) { setPeople([]); setJobs([]); return; }
    const t = term.replace(/^#/, "");
    (async () => {
      const [{ data: profs }, { data: js }, { data: specs }] = await Promise.all([
        supabase.from("profiles")
          .select("id, username, full_name, avatar_url, bio, role, location")
          .or(`username.ilike.%${t}%,full_name.ilike.%${t}%,bio.ilike.%${t}%,location.ilike.%${t}%`)
          .limit(20),
        supabase.from("jobs").select("id, title, category, budget, location, client_id")
          .or(`title.ilike.%${t}%,description.ilike.%${t}%,category.ilike.%${t}%,location.ilike.%${t}%`)
          .eq("status", "open").limit(20),
        supabase.from("creator_specialties").select("user_id").ilike("specialty", `%${t}%`).limit(50),
      ]);
      const specIds = new Set((specs ?? []).map((s: any) => s.user_id));
      let extra: any[] = [];
      if (specIds.size) {
        const { data } = await supabase.from("profiles")
          .select("id, username, full_name, avatar_url, bio, role, location")
          .in("id", Array.from(specIds)).limit(20);
        extra = data ?? [];
      }
      const merged = new Map<string, Profile>();
      [...(profs ?? []), ...extra].forEach((p: any) => merged.set(p.id, p));
      setPeople(Array.from(merged.values()));
      setJobs((js ?? []) as Job[]);
    })();
  }, [q]);

  const matchedTiles = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/^#/, "");
    if (!term) return tiles;
    return tiles.filter((t) => {
      const text = t.kind === "post" ? (t.caption ?? "") : t.title;
      return (
        text.toLowerCase().includes(term) ||
        t.author?.username?.toLowerCase().includes(term) ||
        t.author?.full_name?.toLowerCase().includes(term)
      );
    });
  }, [tiles, q]);

  const reelTiles = matchedTiles.filter((t) => t.kind === "post" && (t.post_type === "video" || t.post_type === "reel"));
  const postTiles = matchedTiles.filter((t) => t.kind === "post" && t.post_type !== "video" && t.post_type !== "reel");
  const portTiles = matchedTiles.filter((t) => t.kind === "portfolio");

  const counts = {
    all: matchedTiles.length + people.length + jobs.length,
    reels: reelTiles.length,
    posts: postTiles.length,
    creators: people.length,
    jobs: jobs.length,
    portfolios: portTiles.length,
  };

  const showSection = (k: ResultTab) => resultTab === "all" || resultTab === k;

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 space-y-5">
      {/* Search */}
      <div className="sticky top-0 z-30 -mx-3 sm:-mx-4 px-3 sm:px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search creators, reels, posts, jobs, portfolios…"
            className="w-full pl-11 pr-4 h-12 rounded-full bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring text-sm"
          />
        </div>

        {/* Category filters */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-semibold transition ${
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground/70 hover:bg-muted/70"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Result tabs */}
        <div className="mt-2 flex gap-1 overflow-x-auto">
          {(["all", "reels", "posts", "creators", "jobs", "portfolios"] as ResultTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setResultTab(t)}
              className={`shrink-0 px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition ${
                resultTab === t ? "bg-brand-soft text-brand" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t} {counts[t] > 0 && <span className="ml-1 opacity-70">{counts[t]}</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Reels grid */}
      {showSection("reels") && reelTiles.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Film className="w-3 h-3" /> Reels ({reelTiles.length})</h2>
          <div className="grid grid-cols-3 gap-1">
            {reelTiles.slice(0, resultTab === "reels" ? 999 : 9).map((t) => (
              <ExploreTile key={`r-${t.id}`} tile={t} onReelClick={(id) => navigate({ to: "/reels", search: { start: id } })} />
            ))}
          </div>
        </section>
      )}

      {/* Creators */}
      {showSection("creators") && people.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Users className="w-3 h-3" /> Creators ({people.length})</h2>
          <div className="space-y-2">
            {people.map((p) => (
              <Link key={p.id} to="/user/$username" params={{ username: p.username }}
                className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl hover:border-brand/40 transition">
                <div className="w-11 h-11 rounded-full bg-muted overflow-hidden flex items-center justify-center font-semibold">
                  {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : p.username.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm truncate">{p.full_name || p.username}</p>
                    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${p.role === "creator" ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"}`}>{p.role ?? "user"}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">@{p.username}{p.location ? ` · ${p.location}` : ""}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Jobs */}
      {showSection("jobs") && jobs.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Briefcase className="w-3 h-3" /> Jobs ({jobs.length})</h2>
          <div className="space-y-2">
            {jobs.map((j) => (
              <Link key={j.id} to="/jobs"
                className="flex items-center justify-between gap-3 p-3 bg-surface border border-border rounded-xl hover:border-brand/40 transition">
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{j.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{j.category} · {j.location ?? "Remote"}</p>
                </div>
                {j.budget && <span className="text-xs font-semibold text-brand shrink-0">{j.budget}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Posts */}
      {showSection("posts") && postTiles.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Grid3x3 className="w-3 h-3" /> Posts ({postTiles.length})</h2>
          <div className="grid grid-cols-3 gap-1">
            {postTiles.map((t) => <ExploreTile key={`p-${t.id}`} tile={t} />)}
          </div>
        </section>
      )}

      {/* Portfolios */}
      {showSection("portfolios") && portTiles.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><ImageIcon className="w-3 h-3" /> Portfolios ({portTiles.length})</h2>
          <div className="grid grid-cols-3 gap-1">
            {portTiles.map((t) => <ExploreTile key={`pf-${t.id}`} tile={t} />)}
          </div>
        </section>
      )}

      {loading && (
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="aspect-square bg-muted animate-pulse rounded-sm" />
          ))}
        </div>
      )}
      {!loading && counts.all === 0 && (
        <div className="text-center text-muted-foreground py-16 bg-surface border border-border rounded-2xl text-sm">
          Nothing here yet — try another search or category
        </div>
      )}
    </div>
  );
}

function ExploreTile({ tile, onReelClick }: { tile: Tile; onReelClick?: (id: string) => void }) {
  const username = tile.author?.username ?? "";
  const isVideo = tile.kind === "post" && (tile.post_type === "video" || tile.post_type === "reel");

  if (isVideo && onReelClick) {
    return (
      <button onClick={() => onReelClick(tile.id)}
        className="relative aspect-square bg-muted overflow-hidden rounded-sm group text-left">
        <video src={tile.media_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
        <div className="absolute top-1.5 right-1.5 text-white drop-shadow"><Play className="w-4 h-4 fill-white" /></div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition">
          <p className="text-[10px] text-white font-semibold truncate">@{username}</p>
        </div>
      </button>
    );
  }

  return (
    <Link to="/user/$username" params={{ username }}
      className="relative aspect-square bg-muted overflow-hidden rounded-sm group">
      {isVideo ? (
        <>
          <video src={tile.media_url} className="w-full h-full object-cover" muted playsInline preload="metadata" />
          <div className="absolute top-1.5 right-1.5 text-white drop-shadow"><Play className="w-4 h-4 fill-white" /></div>
        </>
      ) : (
        <img src={tile.media_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
      )}
      {tile.kind === "portfolio" && (
        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-bold uppercase flex items-center gap-1">
          <ImageIcon className="w-2.5 h-2.5" /> Portfolio
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition">
        <p className="text-[10px] text-white font-semibold truncate">@{username}</p>
      </div>
    </Link>
  );
}
