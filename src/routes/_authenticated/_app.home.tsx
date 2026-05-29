import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Briefcase, Plus, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/home")({
  head: () => ({ meta: [{ title: "Home — Omnicraft" }] }),
  component: HomePage,
});

type Profile = { id: string; username: string; full_name: string | null; avatar_url: string | null; role: string | null };
type Post = {
  id: string; caption: string | null; media_url: string | null; post_type: string;
  created_at: string; author_id: string; author?: Profile;
};

function HomePage() {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // who I follow
      const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const followIds = (f ?? []).map((x: any) => x.following_id);

      let followProfiles: Profile[] = [];
      if (followIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, role")
          .in("id", followIds);
        followProfiles = (profs ?? []) as Profile[];
      }
      setFollowing(followProfiles);

      // feed: posts from followed + self
      const feedIds = [...followIds, user.id];
      const { data: postRows } = await supabase
        .from("posts").select("*")
        .in("author_id", feedIds)
        .order("created_at", { ascending: false })
        .limit(30);
      const list = (postRows ?? []) as Post[];
      const allAuthorIds = Array.from(new Set(list.map((p) => p.author_id)));
      if (allAuthorIds.length) {
        const { data: ap } = await supabase
          .from("profiles").select("id, username, full_name, avatar_url, role")
          .in("id", allAuthorIds);
        const map = new Map((ap ?? []).map((p: any) => [p.id, p]));
        list.forEach((p) => (p.author = map.get(p.author_id)));
      }
      setPosts(list);
      setLoading(false);
    })();
  }, [user]);

  const isCreator = profile?.role === "creator";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Hero with name */}
      <div className={`relative overflow-hidden rounded-3xl p-6 text-white shadow-2xl ${isCreator
        ? "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500"
        : "bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-pink-500"}`}>
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/20 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-yellow-300/30 rounded-full blur-2xl" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 font-medium">✨ Welcome back,</p>
            <h2 className="text-3xl font-black tracking-tight drop-shadow">{profile?.full_name || profile?.username}</h2>
            <p className="text-sm opacity-90 mt-1">{isCreator ? "Share your craft with the world" : "Find your perfect creator"}</p>
          </div>
          <Link to={isCreator ? "/create" : "/jobs"} className="bg-white text-gray-900 hover:scale-105 transition-transform rounded-2xl px-5 py-3 font-bold flex items-center gap-2 shadow-lg">
            {isCreator ? <><Plus className="w-5 h-5" /> Post</> : <><Briefcase className="w-5 h-5" /> Hire</>}
          </Link>
        </div>
      </div>

      {/* Stories: me + people I follow */}
      <div className="bg-white/80 backdrop-blur rounded-2xl p-4 border border-white shadow-sm">
        <div className="flex gap-4 overflow-x-auto pb-1">
          <StoryItem
            label="Your story"
            username={profile?.username ?? ""}
            avatarUrl={profile?.avatar_url ?? null}
            you
            linkTo="/create"
          />
          {following.map((p) => (
            <StoryItem
              key={p.id}
              label={p.full_name || p.username}
              username={p.username}
              avatarUrl={p.avatar_url}
            />
          ))}
          {following.length === 0 && (
            <Link to="/explore" className="flex-shrink-0 flex flex-col items-center gap-1.5 text-center w-20">
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                <UserPlus className="w-6 h-6" />
              </div>
              <span className="text-xs text-gray-600 font-medium">Find people</span>
            </Link>
          )}
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading feed...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">Your feed is empty</h3>
          <p className="text-gray-600 mb-4">Follow creators and clients to see their posts here.</p>
          <Link to="/explore" className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold">
            Discover people
          </Link>
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}

function StoryItem({ label, username, avatarUrl, you, linkTo }: {
  label: string; username: string; avatarUrl: string | null; you?: boolean; linkTo?: string;
}) {
  const initial = (username || "?").slice(0, 1).toUpperCase();
  const inner = (
    <div className="flex-shrink-0 flex flex-col items-center gap-1.5 text-center w-20">
      <div className={`relative w-16 h-16 rounded-full p-0.5 ${you ? "bg-gradient-to-tr from-gray-300 to-gray-400" : "bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-orange-400"}`}>
        <div className="w-full h-full rounded-full bg-white p-0.5">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {initial}
            </div>
          )}
        </div>
        {you && (
          <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
            <Plus className="w-3 h-3 text-white" />
          </div>
        )}
      </div>
      <span className="text-xs text-gray-800 max-w-[80px] truncate font-medium">{label}</span>
    </div>
  );
  if (linkTo) return <Link to={linkTo}>{inner}</Link>;
  return <Link to="/user/$username" params={{ username }}>{inner}</Link>;
}

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const author = post.author;
  const initial = (author?.username || "?").slice(0, 1).toUpperCase();
  const isVideo = post.post_type === "video" || post.post_type === "reel";
  return (
    <article className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <header className="flex items-center justify-between p-4">
        <Link to="/user/$username" params={{ username: author?.username ?? "" }} className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">
            {author?.avatar_url ? <img src={author.avatar_url} className="w-full h-full rounded-full object-cover" /> : initial}
          </div>
          <div>
            <p className="font-semibold text-sm">{author?.full_name || author?.username || "User"}</p>
            <p className="text-xs text-gray-500 capitalize">{author?.role ?? "creator"}</p>
          </div>
        </Link>
        <button className="p-1.5 hover:bg-gray-100 rounded-full"><MoreHorizontal className="w-5 h-5 text-gray-600" /></button>
      </header>

      {post.media_url && (
        <div className="bg-black">
          {isVideo ? (
            <video src={post.media_url} className="w-full max-h-[600px] object-contain" controls playsInline />
          ) : (
            <img src={post.media_url} alt="" className="w-full max-h-[600px] object-cover" />
          )}
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <button onClick={() => setLiked(!liked)}>
              <Heart className={`w-6 h-6 ${liked ? "fill-red-500 text-red-500" : "text-gray-700"}`} />
            </button>
            <button><MessageCircle className="w-6 h-6 text-gray-700" /></button>
            <button><Share2 className="w-6 h-6 text-gray-700" /></button>
          </div>
          <button><Bookmark className="w-6 h-6 text-gray-700" /></button>
        </div>
        {post.caption && (
          <p className="text-sm">
            <span className="font-semibold mr-2">{author?.username}</span>
            {post.caption}
          </p>
        )}
        <p className="text-xs text-gray-400 mt-2 uppercase">{new Date(post.created_at).toLocaleDateString()}</p>
      </div>
    </article>
  );
}
