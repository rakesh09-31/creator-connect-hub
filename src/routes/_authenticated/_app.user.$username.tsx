import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_app/user/$username")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      setProfile(p);
      if (p) {
        const [{ data: posts }, { data: s }] = await Promise.all([
          supabase.from("posts").select("*").eq("author_id", p.id).order("created_at", { ascending: false }),
          supabase.from("creator_specialties").select("specialty").eq("user_id", p.id),
        ]);
        setPosts(posts ?? []);
        setSpecialties((s ?? []).map((x: any) => x.specialty));
      }
      setLoading(false);
    })();
  }, [username]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!profile) return <div className="text-center py-12 text-gray-500">User not found</div>;

  const isCreator = profile.role === "creator";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className={`rounded-3xl p-8 text-white shadow-lg ${isCreator
        ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
        : "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"}`}>
        <div className="flex items-start gap-5">
          <div className="w-24 h-24 rounded-full bg-white/30 flex items-center justify-center text-4xl font-bold border-4 border-white/40">
            {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" /> : profile.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
            <p className="text-white/80">@{profile.username}</p>
            <p className="mt-2 text-sm capitalize bg-white/20 inline-block px-3 py-1 rounded-full">{profile.role ?? "creator"}</p>
            {profile.bio && <p className="mt-3 text-sm text-white/90">{profile.bio}</p>}
            <button className="mt-4 px-5 py-2 bg-white text-gray-900 rounded-xl font-semibold text-sm">Follow</button>
          </div>
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {specialties.map((s) => (
            <span key={s} className="bg-white border border-gray-200 px-3 py-1 rounded-full text-sm font-semibold text-gray-700">{s}</span>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1 mt-6">
        {posts.map((p) => (
          <div key={p.id} className="aspect-square bg-gray-100">
            {p.media_url ? <img src={p.media_url} className="w-full h-full object-cover" /> : (
              <div className="w-full h-full flex items-center justify-center p-3 text-xs text-gray-600 text-center">{p.caption}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
