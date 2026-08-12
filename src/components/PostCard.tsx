import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Send, X } from "lucide-react";
import { toast } from "sonner";
import { VideoPlayer } from "@/components/VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import { ProfileAvatar } from "@/components/ProfileAvatar";

type Profile = { id: string; username: string; full_name: string | null; avatar_url: string | null; role: string | null };
export type PostLike = {
  id: string; caption: string | null; media_url: string | null; post_type: string;
  created_at: string; author_id: string; author?: Profile;
};

export function PostCard({ post }: { post: PostLike }) {
  const { user } = useAuth();
  const author = post.author;
  const initial = (author?.username || "?").slice(0, 1).toUpperCase();
  const isVideo = post.post_type === "video" || post.post_type === "reel";
  const imageFeature = isVideo ? "reel" as const : "post" as const;
  const { resolvedUrl: resolvedMediaUrl } = useMediaUrl(imageFeature, post.media_url);

  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [saved, setSaved] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  const lastTapRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ count: lc }, { count: cc }] = await Promise.all([
        supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("post_id", post.id),
        supabase.from("post_comments").select("*", { count: "exact", head: true }).eq("post_id", post.id),
      ]);
      if (cancelled) return;
      setLikes(lc ?? 0); setCommentCount(cc ?? 0);
      if (user) {
        const [{ data: l }, { data: s }] = await Promise.all([
          supabase.from("post_likes").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle(),
          supabase.from("post_saves").select("id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle(),
        ]);
        if (cancelled) return;
        setLiked(!!l); setSaved(!!s);
      }
    })();
    return () => { cancelled = true; };
  }, [post.id, user]);

  const doLike = async () => {
    if (!user) { toast.error("Sign in to like"); return; }
    // optimistic
    setLiked(true); setLikes((n) => n + (liked ? 0 : 1));
    if (!liked) {
      const { error } = await supabase.from("post_likes").insert({ post_id: post.id, user_id: user.id });
      if (error) { setLiked(false); setLikes((n) => Math.max(0, n - 1)); }
    }
  };
  const toggleLike = async () => {
    if (!user) { toast.error("Sign in to like"); return; }
    if (liked) {
      setLiked(false); setLikes((n) => Math.max(0, n - 1));
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      await doLike();
    }
  };
  const toggleSave = async () => {
    if (!user) { toast.error("Sign in to save"); return; }
    if (saved) {
      setSaved(false);
      await supabase.from("post_saves").delete().eq("post_id", post.id).eq("user_id", user.id);
    } else {
      setSaved(true);
      const { error } = await supabase.from("post_saves").insert({ post_id: post.id, user_id: user.id });
      if (error) setSaved(false);
    }
  };
  const share = async () => {
    const url = `${window.location.origin}${isVideo ? `/reels?start=${post.id}` : `/user/${author?.username ?? ""}`}`;
    try {
      if (navigator.share) await navigator.share({ url, title: post.caption ?? "Post" });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch {}
  };
  const onMediaTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setHeartBurst(true);
      setTimeout(() => setHeartBurst(false), 700);
      doLike();
    }
    lastTapRef.current = now;
  };

  return (
    <article className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
      <header className="flex items-center justify-between p-4">
        <Link to="/user/$username" params={{ username: author?.username ?? "" }} className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-sm shrink-0 overflow-hidden">
            {author?.avatar_url ? <ProfileAvatar url={author.avatar_url} className="w-full h-full object-cover" /> : initial}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{author?.full_name || author?.username || "User"}</p>
            <p className="text-[11px] text-muted-foreground capitalize">@{author?.username} · {author?.role ?? "creator"}</p>
          </div>
        </Link>
        <button className="p-1.5 hover:bg-muted rounded-md text-muted-foreground">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </header>

      {post.media_url && (
        <div className="bg-black relative select-none" onClick={onMediaTap}>
          {isVideo ? (
            <VideoPlayer src={post.media_url} poster={(post as any).thumbnail_url} className="w-full max-h-[600px]" objectFit="contain" feature={imageFeature} />
          ) : (
            resolvedMediaUrl ? <img src={resolvedMediaUrl} alt="" className="w-full max-h-[600px] object-cover" loading="lazy" /> : <div className="w-full h-64 bg-muted animate-pulse" />
          )}
          {heartBurst && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Heart className="w-24 h-24 text-white fill-rose-500 drop-shadow-lg animate-ping-once" />
            </div>
          )}
        </div>
      )}

      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={toggleLike} className="text-foreground active:scale-90 transition">
              <Heart className={`w-[22px] h-[22px] ${liked ? "fill-rose-500 text-rose-500" : ""}`} />
            </button>
            <button onClick={() => setShowComments(true)} className="text-foreground"><MessageCircle className="w-[22px] h-[22px]" /></button>
            <button onClick={share} className="text-foreground"><Share2 className="w-[22px] h-[22px]" /></button>
          </div>
          <button onClick={toggleSave} className="text-foreground">
            <Bookmark className={`w-[22px] h-[22px] ${saved ? "fill-amber-400 text-amber-400" : ""}`} />
          </button>
        </div>
        {likes > 0 && <p className="text-sm font-semibold mb-1">{likes.toLocaleString()} {likes === 1 ? "like" : "likes"}</p>}
        {post.caption && (
          <p className="text-sm leading-relaxed">
            <span className="font-semibold mr-1.5">{author?.username}</span>
            {post.caption}
          </p>
        )}
        {commentCount > 0 && (
          <button onClick={() => setShowComments(true)} className="text-[12px] text-muted-foreground mt-1">
            View all {commentCount} comments
          </button>
        )}
        <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-wider">
          {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      </div>

      {showComments && (
        <CommentsSheet postId={post.id} onClose={() => setShowComments(false)} onCountChange={setCommentCount} />
      )}
    </article>
  );
}

type Comment = { id: string; body: string; user_id: string; created_at: string; author?: Profile };

export function CommentsSheet({ postId, onClose, onCountChange }: { postId: string; onClose: () => void; onCountChange?: (n: number) => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("post_comments").select("*").eq("post_id", postId)
      .order("created_at", { ascending: false }).limit(200);
    const list = (data ?? []) as Comment[];
    const ids = Array.from(new Set(list.map((c) => c.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles").select("id, username, full_name, avatar_url, role").in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      list.forEach((c) => (c.author = map.get(c.user_id)));
    }
    setItems(list);
    onCountChange?.(list.length);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel(`comments:${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const body = text.trim().slice(0, 500);
    setText("");
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, body });
    if (error) { toast.error(error.message); setText(body); return; }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative w-full h-[70vh] bg-background rounded-t-3xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="font-semibold">Comments</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <p className="text-center text-sm text-muted-foreground py-8">Loading…</p>
          ) : items.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Be the first to comment.</p>
          ) : items.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-sm font-semibold overflow-hidden shrink-0">
                {c.author?.avatar_url
                  ? <ProfileAvatar url={c.author.avatar_url} className="w-full h-full object-cover" />
                  : (c.author?.username ?? "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm"><span className="font-semibold mr-1.5">@{c.author?.username ?? "user"}</span>{c.body}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(c.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={submit} className="border-t border-border p-3 flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            maxLength={500}
            className="flex-1 px-4 h-11 rounded-full bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
