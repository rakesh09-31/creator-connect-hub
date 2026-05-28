import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, Heart, MessageCircle, Play, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_app/explore")({
  head: () => ({ meta: [{ title: "Explore — Omnicraft" }] }),
  component: ExplorePage,
});

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
};

type Reel = {
  id: string;
  caption: string | null;
  media_url: string | null;
  post_type: string;
  created_at: string;
  author_id: string;
  author?: Profile;
};

function ExplorePage() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"reels" | "people">("reels");
  const [people, setPeople] = useState<Profile[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);

  // Load reels (all posts) once
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: posts } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      const list = (posts ?? []) as Reel[];
      const ids = Array.from(new Set(list.map((p) => p.author_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, bio, role")
          .in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        list.forEach((p) => (p.author = map.get(p.author_id)));
      }
      setReels(list);
      setLoading(false);
    })();
  }, []);

  // Search people whenever query changes
  useEffect(() => {
    (async () => {
      const term = q.trim();
      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, role")
        .limit(48);
      if (term) {
        query = query.or(
          `username.ilike.%${term}%,full_name.ilike.%${term}%,bio.ilike.%${term}%`,
        );
      }
      const { data } = await query;
      setPeople((data ?? []) as Profile[]);
    })();
  }, [q]);

  // Filter reels client-side by query (caption or author)
  const filteredReels = useMemo(() => {
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
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Colorful header */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-6 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-orange-400 shadow-2xl">
        <div className="absolute -top-10 -right-10 w-44 h-44 bg-yellow-300/40 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-cyan-300/40 rounded-full blur-2xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-white/90 mb-1">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-semibold uppercase tracking-wider">Discover</span>
          </div>
          <h1 className="text-3xl font-black text-white drop-shadow mb-4">
            Explore reels & people
          </h1>

          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search creators, clients, reels…"
              className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/95 backdrop-blur shadow-lg border-0 focus:outline-none focus:ring-4 focus:ring-white/40 text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white/70 backdrop-blur p-1.5 rounded-2xl shadow-sm w-fit mx-auto">
        <button
          onClick={() => setTab("reels")}
          className={`px-6 py-2 rounded-xl font-semibold text-sm transition ${
            tab === "reels"
              ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-md"
              : "text-gray-700 hover:bg-white"
          }`}
        >
          🎬 Reels
        </button>
        <button
          onClick={() => setTab("people")}
          className={`px-6 py-2 rounded-xl font-semibold text-sm transition ${
            tab === "people"
              ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md"
              : "text-gray-700 hover:bg-white"
          }`}
        >
          👥 People
        </button>
      </div>

      {tab === "reels" ? (
        <ReelsGrid reels={filteredReels} loading={loading} />
      ) : (
        <PeopleGrid people={people} />
      )}
    </div>
  );
}

function ReelsGrid({ reels, loading }: { reels: Reel[]; loading: boolean }) {
  if (loading) {
    return <div className="text-center text-gray-500 py-16">Loading reels…</div>;
  }
  if (reels.length === 0) {
    return (
      <div className="text-center py-16 bg-white/70 backdrop-blur rounded-2xl">
        <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center">
          <Play className="w-7 h-7 text-white fill-white" />
        </div>
        <p className="text-gray-600 font-medium">No reels yet — be the first to post one.</p>
      </div>
    );
  }

  const grads = [
    "from-fuchsia-500 to-pink-500",
    "from-cyan-500 to-blue-500",
    "from-amber-400 to-orange-500",
    "from-emerald-500 to-teal-500",
    "from-violet-500 to-indigo-500",
    "from-rose-500 to-red-500",
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {reels.map((r, i) => {
        const isVideo = r.post_type === "video" || r.post_type === "reel";
        return (
          <Link
            key={r.id}
            to="/user/$username"
            params={{ username: r.author?.username ?? "" }}
            className="group relative aspect-[9/16] rounded-2xl overflow-hidden shadow-lg hover:scale-[1.02] transition"
          >
            {r.media_url ? (
              isVideo ? (
                <video
                  src={r.media_url}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={r.media_url}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )
            ) : (
              <div className={`absolute inset-0 bg-gradient-to-br ${grads[i % grads.length]} flex items-center justify-center`}>
                <p className="text-white font-bold text-center p-4 line-clamp-4">
                  {r.caption || "Untitled"}
                </p>
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

            {isVideo && (
              <div className="absolute top-2 right-2 bg-black/50 backdrop-blur px-2 py-1 rounded-full flex items-center gap-1">
                <Play className="w-3 h-3 text-white fill-white" />
                <span className="text-[10px] text-white font-semibold">REEL</span>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-fuchsia-500 to-cyan-500 flex items-center justify-center text-[10px] font-bold ring-2 ring-white/50">
                  {(r.author?.username ?? "?").slice(0, 1).toUpperCase()}
                </div>
                <span className="text-xs font-semibold truncate">
                  @{r.author?.username ?? "user"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
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
      <div className="text-center text-gray-500 py-16 bg-white/70 backdrop-blur rounded-2xl">
        No people found
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {people.map((c) => {
        const isCreator = c.role === "creator";
        const grad = isCreator
          ? "from-emerald-500 via-teal-500 to-cyan-500"
          : "from-indigo-500 via-fuchsia-500 to-pink-500";
        return (
          <Link
            key={c.id}
            to="/user/$username"
            params={{ username: c.username }}
            className="bg-white/90 backdrop-blur rounded-2xl p-5 shadow-lg border border-white hover:shadow-xl hover:-translate-y-1 transition"
          >
            <div className={`w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br ${grad} p-0.5`}>
              <div className="w-full h-full rounded-full bg-white p-0.5">
                {c.avatar_url ? (
                  <img src={c.avatar_url} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <div className={`w-full h-full rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white text-2xl font-black`}>
                    {c.username.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
            <p className="text-center font-bold text-sm truncate">{c.full_name || c.username}</p>
            <p className="text-center text-xs text-gray-500 truncate">@{c.username}</p>
            <div className="flex justify-center mt-2">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white bg-gradient-to-r ${grad}`}>
                {c.role ?? "user"}
              </span>
            </div>
            {c.bio && <p className="text-center text-xs text-gray-600 mt-2 line-clamp-2">{c.bio}</p>}
          </Link>
        );
      })}
    </div>
  );
}
