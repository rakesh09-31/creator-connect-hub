import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Heart, MessageCircle, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_app/explore")({
  head: () => ({ meta: [{ title: "Explore — Omnicraft" }] }),
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
  const [tab, setTab] = useState<"reels" | "feed" | "people">("reels");
  const [people, setPeople] = useState<Profile[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [feed, setFeed] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: reelRows }, { data: feedRows }] = await Promise.all([
        supabase.from("posts").select("*").in("post_type", ["video", "reel"]).order("created_at", { ascending: false }).limit(60),
        supabase.from("posts").select("*").eq("post_type", "photo").order("created_at", { ascending: false }).limit(60),
      ]);
      const reelList = (reelRows ?? []) as Reel[];
      const feedList = (feedRows ?? []) as Reel[];
      const ids = Array.from(new Set([...reelList, ...feedList].map((p) => p.author_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles").select("id, username, full_name, avatar_url, bio, role")
          .in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        reelList.forEach((p) => (p.author = map.get(p.author_id)));
        feedList.forEach((p) => (p.author = map.get(p.author_id)));
      }
      setReels(reelList);
      setFeed(feedList);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const term = q.trim();
      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, role")
        .limit(48);
      if (term) {
        query = query.or(`username.ilike.%${term}%,full_name.ilike.%${term}%,bio.ilike.%${term}%`);
      }
      const { data } = await query;
      setPeople((data ?? []) as Profile[]);
    })();
  }, [q]);

  const filterPosts = (list: Reel[]) => {
    const term = q.trim().toLowerCase();
    if (!term) return list;
    return list.filter(
      (r) =>
        r.caption?.toLowerCase().includes(term) ||
        r.author?.username?.toLowerCase().includes(term) ||
        r.author?.full_name?.toLowerCase().includes(term),
    );
  };

  const filteredReels = useMemo(() => filterPosts(reels), [reels, q]);
  const filteredFeed = useMemo(() => filterPosts(feed), [feed, q]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <header>
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Explore</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">Reels, feed & people</h1>
        <p className="text-sm text-muted-foreground mt-1">Search across the network — reels, photo posts, and creators.</p>
      </header>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reels, posts, creators, clients…"
          className="w-full pl-11 pr-4 h-12 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring text-sm"
        />
      </div>

      <div className="flex gap-1 border-b border-border">
        <TabBtn active={tab === "reels"} onClick={() => setTab("reels")}>Reels</TabBtn>
        <TabBtn active={tab === "feed"} onClick={() => setTab("feed")}>Feed</TabBtn>
        <TabBtn active={tab === "people"} onClick={() => setTab("people")}>People</TabBtn>
      </div>

      {tab === "reels" && <ReelsGrid reels={filteredReels} loading={loading} />}
      {tab === "feed" && <FeedGrid posts={filteredFeed} loading={loading} />}
      {tab === "people" && <PeopleGrid people={people} />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
        active ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ReelsGrid({ reels, loading }: { reels: Reel[]; loading: boolean }) {
  if (loading) return <div className="text-center text-muted-foreground py-16 text-sm">Loading…</div>;
  if (reels.length === 0) {
    return (
      <div className="text-center py-16 bg-surface border border-border rounded-2xl">
        <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-brand-soft flex items-center justify-center">
          <Play className="w-5 h-5 text-brand fill-brand" />
        </div>
        <p className="text-sm text-muted-foreground">No reels yet — be the first to post one.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {reels.map((r) => {
        const isVideo = r.post_type === "video" || r.post_type === "reel";
        return (
          <Link
            key={r.id}
            to="/reels"
            search={{ start: r.id }}
            className="group relative aspect-[9/16] rounded-xl overflow-hidden bg-muted border border-border hover:border-brand/40 transition"
          >
            {r.media_url ? (
              isVideo ? (
                <video src={r.media_url} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline />
              ) : (
                <img src={r.media_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              )
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-brand flex items-center justify-center">
                <p className="text-primary-foreground font-medium text-center text-sm p-4 line-clamp-4">
                  {r.caption || "Untitled"}
                </p>
              </div>
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

            {isVideo && (
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-1.5 py-0.5 rounded-md flex items-center gap-1">
                <Play className="w-2.5 h-2.5 text-white fill-white" />
                <span className="text-[9px] text-white font-semibold tracking-wide">REEL</span>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-[10px] font-bold ring-1 ring-white/30">
                  {(r.author?.username ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <span className="text-xs font-semibold truncate">@{r.author?.username ?? "user"}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] opacity-90">
                <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> 0</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> 0</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function PeopleGrid({ people }: { people: Profile[] }) {
  if (people.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 bg-surface border border-border rounded-2xl text-sm">
        No people found
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {people.map((c) => {
        const isCreator = c.role === "creator";
        return (
          <Link
            key={c.id}
            to="/user/$username"
            params={{ username: c.username }}
            className="bg-surface border border-border rounded-xl p-4 hover:border-brand/40 hover:shadow-sm transition flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-full bg-muted shrink-0 overflow-hidden flex items-center justify-center text-foreground font-semibold">
              {c.avatar_url
                ? <img src={c.avatar_url} className="w-full h-full object-cover" />
                : c.username.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm truncate">{c.full_name || c.username}</p>
                <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  isCreator ? "bg-brand-soft text-brand" : "bg-muted text-muted-foreground"
                }`}>
                  {c.role ?? "user"}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">@{c.username}</p>
              {c.bio && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{c.bio}</p>}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
