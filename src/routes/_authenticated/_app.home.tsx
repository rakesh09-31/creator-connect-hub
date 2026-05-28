import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Briefcase, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/home")({
  head: () => ({ meta: [{ title: "Home — Omnicraft" }] }),
  component: HomePage,
});

type Post = {
  id: string;
  caption: string | null;
  media_url: string | null;
  post_type: string;
  created_at: string;
  author_id: string;
  author?: { username: string; full_name: string | null; avatar_url: string | null; role: string | null };
};

function HomePage() {
  const { profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(30);
      const list = (data ?? []) as Post[];
      const ids = Array.from(new Set(list.map((p) => p.author_id)));
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, role")
          .in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        list.forEach((p) => (p.author = map.get(p.author_id)));
      }
      setPosts(list);
      setLoading(false);
    })();
  }, []);

  const isCreator = profile?.role === "creator";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Role banner */}
      <div className={`rounded-2xl p-5 text-white shadow-lg ${isCreator
        ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600"
        : "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600"}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Welcome back,</p>
            <h2 className="text-2xl font-bold">{profile?.full_name || profile?.username}</h2>
          </div>
          <Link
            to={isCreator ? "/create" : "/jobs"}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl px-4 py-2 font-semibold flex items-center gap-2"
          >
            {isCreator ? <><Plus className="w-4 h-4" /> Post</> : <><Briefcase className="w-4 h-4" /> Post Project</>}
          </Link>
        </div>
      </div>

      {/* Stories strip */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-1.5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-500 p-0.5">
              <div className="w-full h-full rounded-full bg-white p-0.5">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-gray-200 to-gray-300" />
              </div>
            </div>
            <span className="text-xs text-gray-700 max-w-[64px] truncate">user{i + 1}</span>
          </div>
        ))}
      </div>

      {/* Feed */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading feed...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">No posts yet</h3>
          <p className="text-gray-600 mb-4">Be the first to share something amazing.</p>
          <Link to="/create" className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold">
            Create your first post
          </Link>
        </div>
      ) : (
        posts.map((p) => <PostCard key={p.id} post={p} />)
      )}
    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const [liked, setLiked] = useState(false);
  const author = post.author;
  const initial = (author?.username || "?").slice(0, 1).toUpperCase();
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
        <div className="aspect-square bg-gray-100">
          <img src={post.media_url} alt="" className="w-full h-full object-cover" />
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
