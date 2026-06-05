import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Play, Image as ImageIcon, Briefcase, MapPin, Hash, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_app/explore")({
  head: () => ({ meta: [{ title: "Explore — Omnicraft" }] }),
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

const HASHTAGS = ["#dance", "#photography", "#editing", "#design", "#branding", "#motion", "#music", "#portrait", "#reels", "#choreography"];
const LOCATIONS = ["Mumbai", "Delhi", "Bangalore", "Remote", "Hyderabad", "Chennai", "Pune"];

function ExplorePage() {
  const [q, setQ] = useState("");
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [people, setPeople] = useState<Profile[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial explore feed: blend posts + portfolios so the page is always full
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: posts }, { data: ports }] = await Promise.all([
        supabase.from("posts").select("*").not("media_url", "is", null).order("created_at", { ascending: false }).limit(80),
        supabase.from("portfolios").select("*").not("media_url", "is", null).order("created_at", { ascending: false }).limit(40),
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
      // Interleave for visual variety
      const mixed: Tile[] = [];
      const maxLen = Math.max(postTiles.length, portTiles.length);
      for (let i = 0; i < maxLen; i++) {
        if (postTiles[i]) mixed.push(postTiles[i]);
        if (i % 3 === 0 && portTiles[i / 3 | 0]) mixed.push(portTiles[i / 3 | 0]);
      }
      setTiles(mixed);
      setLoading(false);
    })();
  }, []);

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

  const visibleTiles = useMemo(() => {
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

  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 space-y-5">
      {/* Search */}
      <div className="sticky top-0 z-30 -mx-3 sm:-mx-4 px-3 sm:px-4 py-3 bg-background/95 backdrop-blur border-b border-border">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search creators, clients, skills, jobs, #hashtags, locations…"
            className="w-full pl-11 pr-4 h-12 rounded-full bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring text-sm"
          />
        </div>
        {!q.trim() && (
          <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
            {HASHTAGS.map((h) => (
              <button key={h} onClick={() => setQ(h)} className="shrink-0 px-3 py-1 rounded-full bg-brand-soft text-brand text-[11px] font-semibold hover:opacity-80">
                {h}
              </button>
            ))}
            {LOCATIONS.map((l) => (
              <button key={l} onClick={() => setQ(l)} className="shrink-0 px-3 py-1 rounded-full bg-muted text-foreground/70 text-[11px] font-semibold hover:bg-muted/70 inline-flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {l}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Search results: people + jobs */}
      {q.trim() && (
        <>
          {people.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> People ({people.length})</h2>
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
          {jobs.length > 0 && (
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
        </>
      )}

      {/* Instagram-style explore grid */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
          <Hash className="w-3 h-3" /> {q.trim() ? "Matching content" : "Discover"}
        </h2>
        {loading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-sm" />
            ))}
          </div>
        ) : visibleTiles.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 bg-surface border border-border rounded-2xl text-sm">
            Nothing here yet — try another search
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1">
            {visibleTiles.map((t) => <ExploreTile key={`${t.kind}-${t.id}`} tile={t} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function ExploreTile({ tile }: { tile: Tile }) {
  const username = tile.author?.username ?? "";
  const isVideo = tile.kind === "post" && (tile.post_type === "video" || tile.post_type === "reel");
  const linkTo = isVideo ? "/reels" : "/user/$username";
  const params = isVideo ? undefined : { username };
  return (
    <Link to={linkTo as any} params={params as any}
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
