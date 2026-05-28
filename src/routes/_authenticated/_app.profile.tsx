import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Settings, Grid3x3, Bookmark } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Omnicraft" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [tab, setTab] = useState<"posts" | "saved">("posts");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from("posts").select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
        supabase.from("creator_specialties").select("specialty").eq("user_id", user.id),
      ]);
      setPosts(p ?? []);
      setSpecialties((s ?? []).map((x: any) => x.specialty));
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
          <div className="w-24 h-24 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-4xl font-bold border-4 border-white/40">
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

        <div className="grid grid-cols-3 gap-4 mt-6">
          <Stat label="Posts" value={posts.length} />
          <Stat label="Followers" value={0} />
          <Stat label="Following" value={0} />
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
          <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark className="w-5 h-5" />} label="Saved" />
        </div>

        {tab === "posts" ? (
          posts.length === 0 ? (
            <div className="text-center text-gray-500 py-16">No posts yet</div>
          ) : (
            <div className="grid grid-cols-3 gap-1 mt-1">
              {posts.map((p) => (
                <div key={p.id} className="aspect-square bg-gray-100 overflow-hidden">
                  {p.media_url ? <img src={p.media_url} className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center p-3 text-xs text-gray-600 text-center">{p.caption}</div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center text-gray-500 py-16">Nothing saved yet</div>
        )}
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
