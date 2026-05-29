import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Grid3x3, Bookmark, Users, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Omnicraft" }] }),
  component: ProfilePage,
});

type Squad = { id: string; name: string; description: string | null; specialty: string | null; avatar_url: string | null };

function ProfilePage() {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [tab, setTab] = useState<"posts" | "squads" | "saved">("posts");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: s }, { data: mems }, { count: fc }, { count: gc }] = await Promise.all([
        supabase.from("posts").select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
        supabase.from("creator_specialties").select("specialty").eq("user_id", user.id),
        supabase.from("squad_members").select("squad_id, squads:squad_id(id, name, description, specialty, avatar_url)").eq("user_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);
      setPosts(p ?? []);
      setSpecialties((s ?? []).map((x: any) => x.specialty));
      const sq = (mems ?? []).map((m: any) => m.squads).filter(Boolean);
      setSquads(sq as Squad[]);
      setCounts({ followers: fc ?? 0, following: gc ?? 0 });
    })();
  }, [user]);

  if (!profile) return null;
  const isCreator = profile.role === "creator";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className={`rounded-3xl p-8 text-white shadow-lg ${isCreator
        ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
        : "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"}`}>
        <div className="flex items-start gap-5">
          <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-4xl font-bold border-4 border-white/40 overflow-hidden">
            {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" /> : profile.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
                <p className="text-white/80">@{profile.username}</p>
              </div>
              <button className="p-2 hover:bg-white/20 rounded-full"><Settings className="w-5 h-5" /></button>
            </div>
            <p className="mt-2 text-sm capitalize bg-white/20 inline-block px-3 py-1 rounded-full">{profile.role ?? "creator"}</p>
            {profile.bio && <p className="mt-3 text-sm text-white/90">{profile.bio}</p>}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-6">
          <Stat label="Posts" value={posts.length} />
          <Stat label="Squads" value={squads.length} />
          <Stat label="Followers" value={counts.followers} />
          <Stat label="Following" value={counts.following} />
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Specialties</h2>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <span key={s} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm font-semibold text-gray-700">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 border-t border-gray-200">
        <div className="flex">
          <TabBtn active={tab === "posts"} onClick={() => setTab("posts")} icon={<Grid3x3 className="w-5 h-5" />} label="Posts" />
          <TabBtn active={tab === "squads"} onClick={() => setTab("squads")} icon={<Users className="w-5 h-5" />} label="Squads" />
          <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark className="w-5 h-5" />} label="Saved" />
        </div>

        {tab === "posts" && (
          posts.length === 0 ? (
            <div className="text-center text-gray-500 py-16">No posts yet</div>
          ) : (
            <div className="grid grid-cols-3 gap-1 mt-1">
              {posts.map((p) => {
                const isVid = p.post_type === "video" || p.post_type === "reel";
                return (
                  <div key={p.id} className="aspect-square bg-gray-100 overflow-hidden relative">
                    {p.media_url ? (
                      isVid
                        ? <video src={p.media_url} className="w-full h-full object-cover" muted />
                        : <img src={p.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-3 text-xs text-gray-600 text-center">{p.caption}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )
        )}

        {tab === "squads" && (
          <div className="mt-4 space-y-3">
            <Link to="/squads" className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/25 flex items-center justify-center"><Plus className="w-5 h-5" /></div>
                <div>
                  <p className="font-bold">Create or join a squad</p>
                  <p className="text-xs opacity-90">Team up to apply for bigger projects</p>
                </div>
              </div>
            </Link>
            {squads.length === 0 ? (
              <div className="text-center text-gray-500 py-10">You're not in any squads yet</div>
            ) : (
              squads.map((s) => (
                <Link key={s.id} to="/squads/$squadId" params={{ squadId: s.id }} className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
                    {s.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{s.name}</p>
                    {s.specialty && <p className="text-xs text-gray-500">{s.specialty}</p>}
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {tab === "saved" && <div className="text-center text-gray-500 py-16">Nothing saved yet</div>}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs text-white/80 uppercase tracking-wide">{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-t-2 transition ${
        active ? "border-gray-900 text-gray-900" : "border-transparent text-gray-500"
      }`}
    >
      {icon} {label}
    </button>
  );
}
