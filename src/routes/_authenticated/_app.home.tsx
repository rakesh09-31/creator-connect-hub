import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Plus, UserPlus, ArrowRight } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { StoryViewer, type Story, type StoryGroup } from "@/components/StoryViewer";
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
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

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

      // Preferred pool: followed + interest-matched
      const { data: preferredRows } = await supabase
        .from("posts").select("*")
        .in("author_id", candidateIds.length ? candidateIds : [user.id])
        .order("created_at", { ascending: false })
        .limit(40);

      // Global discovery pool: latest posts from anyone (mixed creators)
      const { data: globalRows } = await supabase
        .from("posts").select("*")
        .order("created_at", { ascending: false })
        .limit(80);

      // Merge, dedupe by id
      const seen = new Set<string>();
      let list: Post[] = [];
      for (const p of [...(preferredRows ?? []), ...(globalRows ?? [])] as Post[]) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        list.push(p);
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

  // ---- Active stories (mine + people I follow), newest last inside each group
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const ids = Array.from(new Set([user.id, ...following.map((p) => p.id)]));
      const { data } = await supabase
        .from("stories")
        .select("*")
        .in("user_id", ids)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });
      if (cancelled) return;
      const byUser = new Map<string, Story[]>();
      ((data ?? []) as Story[]).forEach((s) => {
        const arr = byUser.get(s.user_id) ?? [];
        arr.push(s);
        byUser.set(s.user_id, arr);
      });
      const profileFor = (id: string) =>
        id === user.id
          ? { username: profile?.username ?? "you", full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null }
          : following.find((p) => p.id === id);
      const groups: StoryGroup[] = ids
        .filter((id) => (byUser.get(id) ?? []).length > 0)
        .map((id) => {
          const p = profileFor(id);
          return {
            userId: id,
            username: p?.username ?? "",
            fullName: p?.full_name ?? null,
            avatarUrl: p?.avatar_url ?? null,
            stories: byUser.get(id)!,
          };
        });
      setStoryGroups(groups);
    })();
    return () => { cancelled = true; };
  }, [user, following, profile?.username, profile?.full_name, profile?.avatar_url]);

  const groupIndexFor = (userId: string) => storyGroups.findIndex((g) => g.userId === userId);
  const openStories = (userId: string) => {
    const idx = groupIndexFor(userId);
    if (idx >= 0) setViewerIndex(idx);
  };

  const isCreator = profile?.role === "creator";


  return (
    <div className="max-w-xl mx-auto px-3 sm:px-4 py-4 space-y-4">
      {/* Vibrant welcome */}
      <section className="relative overflow-hidden rounded-2xl p-5 shadow-brand bg-gradient-brand text-white">
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -left-8 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-white/80 font-semibold">
              {isCreator ? "Creator workspace" : "Client workspace"}
            </p>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight mt-1 truncate">
              Welcome back, {profile?.full_name || profile?.username} ✨
            </h1>
          </div>
          <Link
            to={isCreator ? "/create" : "/jobs"}
            className="shrink-0 inline-flex items-center gap-1.5 bg-white text-primary hover:bg-white/90 rounded-xl px-4 py-2.5 text-sm font-bold transition shadow-lg"
          >
            {isCreator ? <><Plus className="w-4 h-4" /> New post</> : <><Briefcase className="w-4 h-4" /> Post a brief</>}
          </Link>
        </div>
      </section>

      {/* Stories strip */}
      <section className="relative overflow-hidden rounded-2xl p-4 border border-border bg-surface">
        <div className="relative flex items-center justify-between mb-3 px-1">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Your network</h2>
          <Link to="/explore" className="text-xs font-bold text-brand inline-flex items-center gap-0.5 hover:underline">
            Discover <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="relative flex gap-4 overflow-x-auto pb-1">
          <StoryItem
            label="Your story"
            username={profile?.username ?? ""}
            avatarUrl={profile?.avatar_url ?? null}
            you
            hasStory={groupIndexFor(user?.id ?? "") >= 0}
            onOpen={groupIndexFor(user?.id ?? "") >= 0 ? () => openStories(user!.id) : undefined}
            linkTo={groupIndexFor(user?.id ?? "") >= 0 ? undefined : "/create?type=story"}
          />
          {[...following]
            .sort((a, b) => (groupIndexFor(b.id) >= 0 ? 1 : 0) - (groupIndexFor(a.id) >= 0 ? 1 : 0))
            .map((p) => {
              const hasStory = groupIndexFor(p.id) >= 0;
              return (
                <StoryItem
                  key={p.id}
                  label={p.full_name || p.username}
                  username={p.username}
                  avatarUrl={p.avatar_url}
                  hasStory={hasStory}
                  onOpen={hasStory ? () => openStories(p.id) : undefined}
                />
              );
            })}
          {following.length === 0 && (
            <Link to="/explore" className="flex-shrink-0 flex flex-col items-center gap-1.5 text-center w-20">
              <div className="w-14 h-14 rounded-full border-2 border-dashed border-border flex items-center justify-center text-muted-foreground bg-surface-muted">
                <UserPlus className="w-5 h-5" />
              </div>
              <span className="text-[11px] text-muted-foreground font-semibold">Find people</span>
            </Link>
          )}
        </div>

      </section>

      {/* Feed */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-surface border border-border overflow-hidden">
              <div className="h-14 bg-muted animate-pulse" />
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="h-16 bg-muted/60 animate-pulse" />
            </div>
          ))}
        </div>
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
        <div className="space-y-3">
          {posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}

      {viewerIndex !== null && storyGroups.length > 0 && (
        <StoryViewer
          groups={storyGroups}
          startIndex={viewerIndex}
          viewerId={user?.id}
          onClose={() => setViewerIndex(null)}
        />
      )}
    </div>
  );
}

function StoryItem({ label, username, avatarUrl, you, linkTo, hasStory, onOpen }: {
  label: string; username: string; avatarUrl: string | null; you?: boolean;
  linkTo?: string; hasStory?: boolean; onOpen?: () => void;
}) {
  const initial = (username || "?").slice(0, 1).toUpperCase();
  const ring = hasStory
    ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-brand"
    : you
      ? "bg-muted"
      : "bg-gradient-to-tr from-brand to-primary";
  const inner = (
    <div className="flex-shrink-0 flex flex-col items-center gap-1.5 text-center w-20">
      <div className={`relative w-14 h-14 rounded-full p-[2px] ${ring}`}>
        <div className="w-full h-full rounded-full bg-surface p-[2px]">
          {avatarUrl ? (
            <img src={avatarUrl} className="w-full h-full rounded-full object-cover" />
          ) : (
            <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-foreground text-sm font-semibold">
              {initial}
            </div>
          )}
        </div>
        {you && !hasStory && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand border-2 border-surface flex items-center justify-center">
            <Plus className="w-2.5 h-2.5 text-brand-foreground" />
          </div>
        )}
      </div>
      <span className="text-[11px] text-foreground/80 max-w-[80px] truncate font-medium">{label}</span>
    </div>
  );
  if (onOpen) return <button type="button" onClick={onOpen}>{inner}</button>;
  if (linkTo) return <Link to={linkTo}>{inner}</Link>;
  return <Link to="/user/$username" params={{ username }}>{inner}</Link>;

}

