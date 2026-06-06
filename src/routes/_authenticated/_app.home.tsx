import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Briefcase, Plus, UserPlus, ArrowRight } from "lucide-react";
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


// Round-robin shuffle so consecutive posts come from different creators.
function diversifyByAuthor(items: Post[]): Post[] {
  const buckets = new Map<string, Post[]>();
  for (const p of items) {
    const arr = buckets.get(p.author_id) ?? [];
    arr.push(p);
    buckets.set(p.author_id, arr);
  }
  const out: Post[] = [];
  let lastAuthor = "";
  while (out.length < items.length) {
    let progressed = false;
    // sort keys by remaining count desc each pass for balanced spread
    const keys = Array.from(buckets.keys())
      .filter((k) => (buckets.get(k) ?? []).length > 0)
      .sort((a, b) => (buckets.get(b)?.length ?? 0) - (buckets.get(a)?.length ?? 0));
    for (const k of keys) {
      if (k === lastAuthor && keys.length > 1) continue;
      const arr = buckets.get(k)!;
      out.push(arr.shift()!);
      lastAuthor = k;
      progressed = true;
      break;
    }
    if (!progressed) {
      // Only one author left
      for (const k of keys) {
        const arr = buckets.get(k)!;
        while (arr.length) out.push(arr.shift()!);
      }
    }
  }
  return out;
}

function HomePage() {
  const { profile, user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [following, setFollowing] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);

      // Determine the viewer's interests: creator specialties OR client field
      const [{ data: me }, { data: mySpecs }] = await Promise.all([
        supabase.from("profiles").select("role, client_field").eq("id", user.id).maybeSingle(),
        supabase.from("creator_specialties").select("specialty").eq("user_id", user.id),
      ]);
      const myRole = (me as any)?.role as string | null;
      const interests: string[] = [];
      if (myRole === "creator") {
        (mySpecs ?? []).forEach((s: any) => interests.push(String(s.specialty).toLowerCase()));
      } else if (myRole === "client" && (me as any)?.client_field) {
        interests.push(String((me as any).client_field).toLowerCase());
      }

      // Who I follow
      const { data: f } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
      const followIds = (f ?? []).map((x: any) => x.following_id);
      let followProfiles: Profile[] = [];
      if (followIds.length) {
        const { data: profs } = await supabase
          .from("profiles").select("id, username, full_name, avatar_url, role").in("id", followIds);
        followProfiles = (profs ?? []) as Profile[];
      }
      setFollowing(followProfiles);

      // Find creators whose specialties match my interests
      let relevantCreatorIds: string[] = [];
      if (interests.length) {
        const orFilter = interests.map((i) => `specialty.ilike.%${i}%`).join(",");
        const { data: matchSpecs } = await supabase
          .from("creator_specialties").select("user_id").or(orFilter).limit(120);
        relevantCreatorIds = Array.from(new Set((matchSpecs ?? []).map((s: any) => s.user_id)));
      }

      const candidateIds = Array.from(new Set([...followIds, ...relevantCreatorIds, user.id]));
      const { data: postRows } = await supabase
        .from("posts").select("*")
        .in("author_id", candidateIds.length ? candidateIds : [user.id])
        .order("created_at", { ascending: false })
        .limit(60);
      let list = (postRows ?? []) as Post[];

      // Strict role-based fallback: only show posts from creators whose specialty
      // matches the viewer's interests. Never show unrelated content.
      if (list.length === 0 && interests.length) {
        const orFilter = interests.map((i) => `specialty.ilike.%${i}%`).join(",");
        const { data: matchSpecs } = await supabase
          .from("creator_specialties").select("user_id").or(orFilter).limit(200);
        const ids = Array.from(new Set((matchSpecs ?? []).map((s: any) => s.user_id)));
        if (ids.length) {
          const { data: any2 } = await supabase
            .from("posts").select("*").in("author_id", ids)
            .order("created_at", { ascending: false }).limit(30);
          list = (any2 ?? []) as Post[];
        }
      }

      // Rank: followed first, then interest-matched, then the rest
      const followSet = new Set(followIds);
      const matchSet = new Set(relevantCreatorIds);
      list.sort((a, b) => {
        const score = (p: Post) =>
          (followSet.has(p.author_id) ? 2 : 0) + (matchSet.has(p.author_id) ? 1 : 0);
        return score(b) - score(a);
      });

      // Diversity: avoid consecutive posts from the same creator, mix fields.
      list = diversifyByAuthor(list);

      const allAuthorIds = Array.from(new Set(list.map((p) => p.author_id)));
      if (allAuthorIds.length) {
        const { data: ap } = await supabase
          .from("profiles").select("id, username, full_name, avatar_url, role").in("id", allAuthorIds);
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
      {/* Vibrant welcome */}
      <section className="relative overflow-hidden rounded-3xl p-6 shadow-brand bg-gradient-brand text-white">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-white/80 font-semibold">
              {isCreator ? "Creator workspace" : "Client workspace"}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 truncate">
              Welcome back, {profile?.full_name || profile?.username} ✨
            </h1>
            <p className="text-sm text-white/85 mt-1">
              {isCreator ? "Share your latest work and discover new briefs." : "Find specialists and post your next project."}
            </p>
          </div>
          <Link
            to={isCreator ? "/create" : "/jobs"}
            className="shrink-0 inline-flex items-center gap-1.5 bg-white text-primary hover:bg-white/90 rounded-xl px-4 py-2.5 text-sm font-bold transition shadow-lg"
          >
            {isCreator ? <><Plus className="w-4 h-4" /> New post</> : <><Briefcase className="w-4 h-4" /> Post a brief</>}
          </Link>
        </div>
      </section>

      {/* Stories strip - vibrant attractive theme */}
      <section className="relative overflow-hidden rounded-3xl p-5 shadow-lg border border-white/40"
        style={{
          background: "linear-gradient(135deg, #fef3c7 0%, #fce7f3 35%, #ddd6fe 70%, #bae6fd 100%)"
        }}>
        <div className="absolute -top-16 -right-10 w-48 h-48 rounded-full bg-fuchsia-300/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-10 w-48 h-48 rounded-full bg-sky-300/40 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-700">✨ Your network</h2>
          <Link to="/explore" className="text-xs font-bold text-fuchsia-700 inline-flex items-center gap-0.5 hover:underline">
            Discover <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="relative flex gap-4 overflow-x-auto pb-1">
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
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-slate-500/60 flex items-center justify-center text-slate-700 bg-white/50">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-[11px] text-slate-700 font-semibold">Find people</span>
            </Link>
          )}
        </div>
      </section>


      {/* Feed */}
      {loading ? (
        <div className="text-center text-muted-foreground py-12 text-sm">Loading your feed…</div>
      ) : posts.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center border border-border shadow-sm">
          <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-brand-soft flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-brand" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Your feed is quiet</h3>
          <p className="text-sm text-muted-foreground mb-4">Follow creators and clients to see their latest work here.</p>
          <Link to="/explore" className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold">
            Discover people <ArrowRight className="w-4 h-4" />
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
      <div className={`relative w-14 h-14 rounded-full p-[2px] ${you ? "bg-muted" : "bg-gradient-to-tr from-brand to-primary"}`}>
        <div className="w-full h-full rounded-full bg-surface p-[2px]">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-foreground text-sm font-semibold">
              {initial}
            </div>
          )}
        </div>
        {you && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand border-2 border-surface flex items-center justify-center">
            <Plus className="w-2.5 h-2.5 text-brand-foreground" />
          </div>
        )}
      </div>
      <span className="text-[11px] text-foreground/80 max-w-[80px] truncate font-medium">{label}</span>
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
    <article className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
      <header className="flex items-center justify-between p-4">
        <Link to="/user/$username" params={{ username: author?.username ?? "" }} className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-foreground font-semibold text-sm shrink-0 overflow-hidden">
            {author?.avatar_url ? <img src={author.avatar_url} className="w-full h-full object-cover" /> : initial}
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
          <div className="flex items-center gap-4">
            <button onClick={() => setLiked(!liked)} className="text-foreground">
              <Heart className={`w-[22px] h-[22px] ${liked ? "fill-destructive text-destructive" : ""}`} />
            </button>
            <button className="text-foreground"><MessageCircle className="w-[22px] h-[22px]" /></button>
            <button className="text-foreground"><Share2 className="w-[22px] h-[22px]" /></button>
          </div>
          <button className="text-foreground"><Bookmark className="w-[22px] h-[22px]" /></button>
        </div>
        {post.caption && (
          <p className="text-sm leading-relaxed">
            <span className="font-semibold mr-1.5">{author?.username}</span>
            {post.caption}
          </p>
        )}
        <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-wider">
          {new Date(post.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
        </p>
      </div>
    </article>
  );
}
