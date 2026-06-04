import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, ArrowLeft, Bookmark, Send, X, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/reels")({
  head: () => ({ meta: [{ title: "Reels — Omnicraft" }] }),
  validateSearch: (s: Record<string, unknown>) => ({ start: typeof s.start === "string" ? s.start : undefined }),
  component: ReelsPage,
});

type Profile = { id: string; username: string; full_name: string | null; avatar_url: string | null; role: string | null };
type Reel = {
  id: string; caption: string | null; media_url: string | null; post_type: string;
  created_at: string; author_id: string; author?: Profile;
};

function ReelsPage() {
  const { start } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [muted, setMuted] = useState(true);
  const [activeComments, setActiveComments] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);

      // Pull viewer's interests for ranking
      let interests: string[] = [];
      if (user) {
        const [{ data: me }, { data: mySpecs }] = await Promise.all([
          supabase.from("profiles").select("role, client_field").eq("id", user.id).maybeSingle(),
          supabase.from("creator_specialties").select("specialty").eq("user_id", user.id),
        ]);
        if ((me as any)?.role === "creator") {
          (mySpecs ?? []).forEach((s: any) => interests.push(String(s.specialty).toLowerCase()));
        } else if ((me as any)?.role === "client" && (me as any)?.client_field) {
          interests.push(String((me as any).client_field).toLowerCase());
        }
      }

      const { data } = await supabase
        .from("posts").select("*")
        .in("post_type", ["video", "reel"])
        .order("created_at", { ascending: false })
        .limit(120);
      let list = (data ?? []) as Reel[];

      if (start && !list.find((r) => r.id === start)) {
        const { data: one } = await supabase.from("posts").select("*").eq("id", start).maybeSingle();
        if (one) list = [one as Reel, ...list];
      } else if (start) {
        list = [list.find((r) => r.id === start)!, ...list.filter((r) => r.id !== start)];
      }

      // Attach authors
      const ids = Array.from(new Set(list.map((r) => r.author_id)));
      let creatorMatchSet = new Set<string>();
      if (ids.length) {
        const { data: profs } = await supabase
          .from("profiles").select("id, username, full_name, avatar_url, role").in("id", ids);
        const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
        list.forEach((r) => (r.author = map.get(r.author_id)));

        if (interests.length) {
          const orFilter = interests.map((i) => `specialty.ilike.%${i}%`).join(",");
          const { data: matchSpecs } = await supabase
            .from("creator_specialties").select("user_id").in("user_id", ids).or(orFilter);
          (matchSpecs ?? []).forEach((s: any) => creatorMatchSet.add(s.user_id));
        }
      }

      // Rank by interest match (keep start pinned at index 0)
      if (creatorMatchSet.size) {
        const pinned = start ? list[0] : null;
        const rest = (start ? list.slice(1) : list).sort((a, b) => {
          const sa = creatorMatchSet.has(a.author_id) ? 1 : 0;
          const sb = creatorMatchSet.has(b.author_id) ? 1 : 0;
          return sb - sa;
        });
        list = pinned ? [pinned, ...rest] : rest;
      }

      setReels(list);
      setLoading(false);
    })();
  }, [start, user]);

  if (loading) {
    return <div className="h-[calc(100vh-8rem)] flex items-center justify-center text-white/70 text-sm bg-black">Loading reels…</div>;
  }
  if (reels.length === 0) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-white/70 text-sm bg-black gap-3">
        <p>No reels yet.</p>
        <button onClick={() => navigate({ to: "/create" })} className="px-4 py-2 rounded-full bg-white text-black text-sm font-semibold">Upload one</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-black">
      <div className="absolute top-4 left-4 right-4 z-50 flex items-center justify-between">
        <button
          onClick={() => navigate({ to: "/explore" })}
          className="p-2 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/70"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => setMuted((m) => !m)}
          className="p-2 rounded-full bg-black/50 backdrop-blur text-white hover:bg-black/70"
          aria-label={muted ? "Unmute" : "Mute"}
        >
          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
      </div>

      <div
        className="h-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth"
        style={{ scrollbarWidth: "none" }}
      >
        {reels.map((r) => (
          <ReelItem
            key={r.id}
            reel={r}
            muted={muted}
            onOpenComments={() => setActiveComments(r.id)}
          />
        ))}
      </div>

      {activeComments && (
        <CommentsSheet
          postId={activeComments}
          onClose={() => setActiveComments(null)}
        />
      )}
    </div>
  );
}

function ReelItem({ reel, muted, onOpenComments }: { reel: Reel; muted: boolean; onOpenComments: () => void }) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [following, setFollowing] = useState(false);

  const isVideo = reel.post_type === "video" || reel.post_type === "reel";
  const isOwn = user?.id === reel.author_id;

  // Counts and viewer state
  useEffect(() => {
    (async () => {
      const [{ count: likeC }, { count: commentC }] = await Promise.all([
        supabase.from("post_likes").select("*", { count: "exact", head: true }).eq("post_id", reel.id),
        supabase.from("post_comments").select("*", { count: "exact", head: true }).eq("post_id", reel.id),
      ]);
      setLikes(likeC ?? 0);
      setCommentCount(commentC ?? 0);

      if (user) {
        const [{ data: l }, { data: s }, { data: fol }] = await Promise.all([
          supabase.from("post_likes").select("id").eq("post_id", reel.id).eq("user_id", user.id).maybeSingle(),
          supabase.from("post_saves").select("id").eq("post_id", reel.id).eq("user_id", user.id).maybeSingle(),
          isOwn ? Promise.resolve({ data: null }) :
            supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", reel.author_id).maybeSingle(),
        ]);
        setLiked(!!l); setSaved(!!s); setFollowing(!!fol);
      }
    })();
  }, [reel.id, user]);

  // Mute toggle
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  // Auto play/pause on intersection
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { el.play().catch(() => {}); } else { el.pause(); }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const toggleLike = async () => {
    if (!user) { toast.error("Sign in to like"); return; }
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", reel.id).eq("user_id", user.id);
      setLiked(false); setLikes((n) => Math.max(0, n - 1));
    } else {
      const { error } = await supabase.from("post_likes").insert({ post_id: reel.id, user_id: user.id });
      if (!error) { setLiked(true); setLikes((n) => n + 1); }
    }
  };

  const toggleSave = async () => {
    if (!user) { toast.error("Sign in to save"); return; }
    if (saved) {
      await supabase.from("post_saves").delete().eq("post_id", reel.id).eq("user_id", user.id);
      setSaved(false);
    } else {
      const { error } = await supabase.from("post_saves").insert({ post_id: reel.id, user_id: user.id });
      if (!error) setSaved(true);
    }
  };

  const toggleFollow = async () => {
    if (!user || isOwn) return;
    if (following) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", reel.author_id);
      setFollowing(false);
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: reel.author_id });
      if (!error) { setFollowing(true); toast.success(`Following @${reel.author?.username}`); }
    }
  };

  const share = async () => {
    const url = `${window.location.origin}/reels?start=${reel.id}`;
    try {
      if (navigator.share) await navigator.share({ url, title: reel.caption ?? "Reel" });
      else { await navigator.clipboard.writeText(url); toast.success("Link copied"); }
    } catch {}
  };

  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    v.paused ? v.play() : v.pause();
  };

  return (
    <div className="h-screen w-full snap-start relative flex items-center justify-center bg-black">
      {reel.media_url && isVideo ? (
        <video
          ref={videoRef}
          src={reel.media_url}
          className="max-h-full max-w-full object-contain cursor-pointer"
          loop muted playsInline
          onClick={togglePlay}
        />
      ) : reel.media_url ? (
        <img src={reel.media_url} className="max-h-full max-w-full object-contain" alt="" />
      ) : (
        <div className="text-white text-center p-8 max-w-md">{reel.caption}</div>
      )}

      {/* Bottom-left: author + caption */}
      <div className="absolute bottom-0 left-0 right-20 p-6 pb-24 bg-gradient-to-t from-black/90 via-black/50 to-transparent text-white">
        <div className="flex items-center gap-3 mb-3">
          <Link to="/user/$username" params={{ username: reel.author?.username ?? "" }} className="flex items-center gap-3 hover:opacity-80">
            <div className="w-11 h-11 rounded-full bg-white/20 ring-2 ring-white/60 overflow-hidden flex items-center justify-center font-bold">
              {reel.author?.avatar_url
                ? <img src={reel.author.avatar_url} className="w-full h-full object-cover" />
                : (reel.author?.username ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-sm">@{reel.author?.username ?? "user"}</p>
              <p className="text-[11px] text-white/70 capitalize">{reel.author?.role ?? "creator"}</p>
            </div>
          </Link>
          {!isOwn && (
            <button
              onClick={toggleFollow}
              className={`ml-2 px-3 py-1 rounded-full text-xs font-bold border ${
                following ? "bg-white/15 border-white/30 text-white" : "bg-white text-black border-white"
              }`}
            >
              {following ? "Following" : "Follow"}
            </button>
          )}
        </div>
        {reel.caption && <p className="text-sm leading-relaxed line-clamp-3 max-w-md">{reel.caption}</p>}
      </div>

      {/* Right rail: actions */}
      <div className="absolute right-3 bottom-32 flex flex-col gap-5 text-white">
        <ActionBtn icon={<Heart className={`w-7 h-7 ${liked ? "fill-rose-500 text-rose-500" : ""}`} />} label={formatCount(likes)} onClick={toggleLike} />
        <ActionBtn icon={<MessageCircle className="w-7 h-7" />} label={formatCount(commentCount)} onClick={onOpenComments} />
        <ActionBtn icon={<Bookmark className={`w-7 h-7 ${saved ? "fill-amber-400 text-amber-400" : ""}`} />} label="" onClick={toggleSave} />
        <ActionBtn icon={<Share2 className="w-7 h-7" />} label="" onClick={share} />
      </div>
    </div>
  );
}

function ActionBtn({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 active:scale-95 transition">
      <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur flex items-center justify-center hover:bg-white/20">
        {icon}
      </div>
      {label && <span className="text-xs font-semibold drop-shadow">{label}</span>}
    </button>
  );
}

function formatCount(n: number) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

type Comment = { id: string; body: string; user_id: string; created_at: string; author?: Profile };

function CommentsSheet({ postId, onClose }: { postId: string; onClose: () => void }) {
  const { user } = useAuth();
  const [items, setItems] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase
      .from("post_comments").select("*").eq("post_id", postId)
      .order("created_at", { ascending: false }).limit(100);
    const list = (data ?? []) as Comment[];
    const ids = Array.from(new Set(list.map((c) => c.user_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles").select("id, username, full_name, avatar_url, role").in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      list.forEach((c) => (c.author = map.get(c.user_id)));
    }
    setItems(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, [postId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !text.trim()) return;
    const body = text.trim().slice(0, 500);
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, user_id: user.id, body });
    if (error) { toast.error(error.message); return; }
    setText("");
    load();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full h-[70vh] bg-background rounded-t-3xl flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
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
                  ? <img src={c.author.avatar_url} className="w-full h-full object-cover" />
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
