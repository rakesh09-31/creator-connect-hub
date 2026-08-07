import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StoryViewer, type Story, type StoryGroup } from "@/components/StoryViewer";

export const Route = createFileRoute("/_authenticated/_app/user/$username")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [following, setFollowing] = useState(false);
  const [followCount, setFollowCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [storyOpen, setStoryOpen] = useState(false);

  const refreshFollow = async (targetId: string) => {
    if (!user) return;
    const [{ data: rel }, { count }] = await Promise.all([
      supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", targetId).maybeSingle(),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", targetId),
    ]);
    setFollowing(!!rel);
    setFollowCount(count ?? 0);
  };

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      setProfile(p);
      if (p) {
        const [{ data: postsData }, { data: s }, { data: storyRows }] = await Promise.all([
          supabase.from("posts").select("*").eq("author_id", p.id).order("created_at", { ascending: false }),
          supabase.from("creator_specialties").select("specialty").eq("user_id", p.id),
          supabase.from("stories").select("*").eq("user_id", p.id).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: true }),
        ]);
        setPosts(postsData ?? []);
        setSpecialties((s ?? []).map((x: any) => x.specialty));
        setActiveStories((storyRows ?? []) as Story[]);
        await refreshFollow(p.id);
      }
      setLoading(false);
    })();
  }, [username, user]);

  const toggleFollow = async () => {
    if (!user || !profile) return;
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
      if (error) { toast.error(error.message); return; }
    }
    refreshFollow(profile.id);
  };

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!profile) return <div className="text-center py-12 text-gray-500">User not found</div>;

  const isCreator = profile.role === "creator";
  const isSelf = user?.id === profile.id;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className={`rounded-3xl p-8 text-white shadow-lg ${isCreator
        ? "bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600"
        : "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"}`}>
        <div className="flex items-start gap-5">
          <button
            type="button"
            onClick={() => activeStories.length > 0 && setStoryOpen(true)}
            className={`w-24 h-24 rounded-full p-1 flex-shrink-0 ${activeStories.length > 0 ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-white cursor-pointer" : "bg-white/40 cursor-default"}`}
            aria-label={activeStories.length > 0 ? `View ${profile.username}'s story` : "No active story"}
          >
            <span className="w-full h-full rounded-full bg-surface p-[2px] flex items-center justify-center text-4xl font-bold overflow-hidden">
              {profile.avatar_url ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" alt="" /> : profile.username.slice(0, 1).toUpperCase()}
            </span>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
            <p className="text-white/80">@{profile.username}</p>
            <p className="mt-2 text-sm capitalize bg-white/20 inline-block px-3 py-1 rounded-full">{profile.role ?? "creator"}</p>
            {profile.bio && <p className="mt-3 text-sm text-white/90">{profile.bio}</p>}
            {profile.portfolio_url && (
              <a href={profile.portfolio_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-white/95 bg-white/15 px-2.5 py-1 rounded-full hover:bg-white/25">
                Portfolio ↗
              </a>
            )}
            <Link to="/connections/$username" params={{ username: profile.username }} search={{ tab: "followers" as const }} className="mt-2 inline-block text-xs text-white/80 hover:text-white underline-offset-2 hover:underline">
              {followCount.toLocaleString()} {followCount === 1 ? "follower" : "followers"}
            </Link>
            {!isSelf && (
              <button onClick={toggleFollow} className={`mt-4 px-5 py-2 rounded-xl font-semibold text-sm ${following ? "bg-white/20 text-white" : "bg-white text-gray-900"}`}>
                {following ? "Following" : "Follow"}
              </button>
            )}
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
        {posts.map((p) => {
          const isVid = p.post_type === "video" || p.post_type === "reel";
          return (
            <div key={p.id} className="aspect-square bg-gray-100 overflow-hidden">
              {p.media_url ? (
                isVid ? <video src={p.media_url} className="w-full h-full object-cover" muted /> : <img src={p.media_url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-3 text-xs text-gray-600 text-center">{p.caption}</div>
              )}
            </div>
          );
        })}
      </div>
      {storyOpen && activeStories.length > 0 && (
        <StoryViewer
          groups={[{ userId: profile.id, username: profile.username, fullName: profile.full_name, avatarUrl: profile.avatar_url, stories: activeStories } satisfies StoryGroup]}
          viewerId={user?.id}
          onClose={() => setStoryOpen(false)}
        />
      )}
    </div>
  );
}
