import { useEffect, useState, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, Plus, UserPlus, ArrowRight } from "lucide-react";
import { PostCard } from "@/components/PostCard";
import { StoryViewer, type Story, type StoryGroup } from "@/components/StoryViewer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import { toast } from "sonner";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [maxVisibleSlots, setMaxVisibleSlots] = useState(6);
  const [suggestedProfiles, setSuggestedProfiles] = useState<Profile[]>([]);
  const [usersWithActiveStories, setUsersWithActiveStories] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // 80px width + 12px gap = 92px
        const slots = Math.max(1, Math.floor(entry.contentRect.width / 92));
        setMaxVisibleSlots(slots);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

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

      // Fetch a few random suggestions, just in case feed is empty
      const excludeIds = [...followIds, user.id];
      let query = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, role")
        .limit(20);
      
      if (excludeIds.length > 0) {
        query = query.not("id", "in", `(${excludeIds.join(",")})`);
      }
      
      const { data: suggestions } = await query;
      
      const unfollowed = ((suggestions as Profile[]) ?? []);
      setSuggestedProfiles(unfollowed);

      setLoading(false);
    })();
  }, [user]);

  // ---- Active stories (mine + people I follow), newest last inside each group
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const loadStories = async () => {
      // 1. Omnicraft Daily Story
      const { data: adminProf } = await supabase.from("profiles").select("*").eq("role", "admin").maybeSingle();
      const adminId = adminProf?.id;

      if (adminId) {
        const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
        const dailyId = `00000000-0000-4000-8000-${todayStr.replace(/-/g, "").padEnd(12, "0")}`;
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
        const messages = [
          "Welcome to Omnicraft — where creators connect, collaborate and grow.",
          "Discover new creators and build your creative network on Omnicraft.",
          "Create. Connect. Collaborate. That's Omnicraft.",
          "Find your next creative opportunity on Omnicraft.",
          "Your next collaboration could start today.",
          "Explore creators. Share your work. Grow your network.",
          "Omnicraft — bringing creators and opportunities together."
        ];
        const msg = messages[dayOfYear % messages.length];
        const blankImg = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const nextDay = new Date();
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);
        nextDay.setUTCHours(0, 0, 0, 0);

        await supabase.from("stories").upsert({
          id: dailyId,
          user_id: adminId,
          media_type: "text",
          media_url: blankImg,
          caption: msg,
          expires_at: nextDay.toISOString(),
        }, { onConflict: "id" }).maybeSingle();
      }

      // 2. Fetch Stories
      const baseIds = Array.from(new Set([user.id, ...following.map((p) => p.id)]));
      const candidateIds = Array.from(new Set([
        ...posts.map((p) => p.author_id),
        ...suggestedProfiles.map((p) => p.id)
      ])).filter((id): id is string => !!id && !baseIds.includes(id));

      const ids = Array.from(new Set([...baseIds, ...candidateIds, adminId].filter((id): id is string => !!id)));

      const { data, error } = await supabase
        .from("stories")
        .select("*")
        .in("user_id", ids)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Active stories query failed:", error);
        return;
      }
      if (cancelled) return;
      const byUser = new Map<string, Story[]>();
      ((data ?? []) as Story[]).forEach((s) => {
        const arr = byUser.get(s.user_id) ?? [];
        arr.push(s);
        byUser.set(s.user_id, arr);
      });
      const profileFor = (id: string) => {
        if (id === user.id) return { username: profile?.username ?? "you", full_name: profile?.full_name ?? null, avatar_url: profile?.avatar_url ?? null };
        if (adminId && id === adminId) return { username: adminProf?.username ?? "Omnicraft", full_name: adminProf?.full_name ?? "Omnicraft Official", avatar_url: adminProf?.avatar_url ?? null };
        return following.find((p) => p.id === id);
      };

      setUsersWithActiveStories(new Set(Array.from(byUser.keys())));

      const activeIdsForRow = new Set([...baseIds, adminId].filter((id): id is string => !!id));
      const groups: StoryGroup[] = Array.from(activeIdsForRow)
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
    };

    void loadStories();

    const channel = supabase.channel("stories_row_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "stories" }, () => {
        void loadStories();
      })
      .subscribe();

    return () => { 
      cancelled = true; 
      void supabase.removeChannel(channel);
    };
  }, [user, following, profile?.username, profile?.full_name, profile?.avatar_url, posts, suggestedProfiles]);

  const groupIndexFor = (userId: string) => storyGroups.findIndex((g) => g.userId === userId);
  const openStories = (userId: string) => {
    const idx = groupIndexFor(userId);
    if (idx >= 0) setViewerIndex(idx);
  };

  const handleFollow = async (target: Profile) => {
    if (!user) return;
    const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: target.id });
    if (!error) {
      setFollowing((prev) => [...prev, target]);
      toast.success(`Following @${target.username}`);
    } else {
      toast.error("Failed to follow user");
    }
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
        <div ref={containerRef} className="flex items-center gap-3 overflow-x-auto pb-2 px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <StoryItem
            label="Your story"
            username={profile?.username ?? ""}
            avatarUrl={profile?.avatar_url ?? null}
            you
            hasStory={groupIndexFor(user?.id ?? "") >= 0}
            previewStory={storyGroups.find((g) => g.userId === user?.id)?.stories.slice(-1)[0]}
            onOpen={groupIndexFor(user?.id ?? "") >= 0 ? () => openStories(user!.id) : undefined}
            linkTo={groupIndexFor(user?.id ?? "") >= 0 ? undefined : "/create?type=story"}
          />
          {(() => {
            // Find admin group
            const adminGroup = storyGroups.find((g) => g.fullName === "Omnicraft Official" || g.username === "Omnicraft");
            const adminId = adminGroup?.userId;

            // 1. Other Active Stories
            const otherActive = [...storyGroups]
              .filter((g) => g.userId !== user?.id)
              .sort((a, b) => {
                // Admin always first
                if (adminId && a.userId === adminId) return -1;
                if (adminId && b.userId === adminId) return 1;
                const latestA = new Date(a.stories[a.stories.length - 1].created_at || 0).getTime();
                const latestB = new Date(b.stories[b.stories.length - 1].created_at || 0).getTime();
                return latestB - latestA;
              });

            // 2. Fallbacks
            const followIds = new Set(following.map((p) => p.id));
            const suggestedNoStory = Array.from(
              new Map(
                [
                  ...posts.map((p) => p.author).filter(Boolean),
                  ...suggestedProfiles
                ]
                  .filter((p) => p && p.id !== user?.id && !followIds.has(p.id) && !usersWithActiveStories.has(p.id))
                  .map((p) => [p!.id, p!])
              ).values()
            );

            // 3. Apply limits
            const activeSlots = otherActive;
            
            const renderedElements = [];
            
            // Render active
            for (const g of activeSlots) {
              renderedElements.push(
                <StoryItem
                  key={g.userId}
                  label={g.fullName || g.username}
                  username={g.username}
                  avatarUrl={g.avatarUrl}
                  hasStory={true}
                  previewStory={g.stories[g.stories.length - 1]}
                  onOpen={() => openStories(g.userId)}
                />
              );
            }

            // Calculate available slots in viewport
            // maxVisibleSlots - 1 (for "Your story") - activeSlots.length
            const availableViewportSlots = Math.max(0, maxVisibleSlots - 1 - activeSlots.length);
            
            if (availableViewportSlots > 0) {
              // Rule 7, 8: Use up to 3 "+" suggestions only when there are available spaces
              const fallbacksToAdd = Math.min(availableViewportSlots, 3);
              let added = 0;

              for (const p of suggestedNoStory) {
                if (added >= fallbacksToAdd) break;
                renderedElements.push(
                  <StoryItem
                    key={p.id}
                    label={p.full_name || p.username}
                    username={p.username}
                    avatarUrl={p.avatar_url}
                    suggested
                    onFollow={() => handleFollow(p)}
                  />
                );
                added++;
              }
            }

            return renderedElements;
          })()}
        </div>

      </section>

      {/* Recommendations */}
      {user && isCreator && <RecommendedJobs userId={user.id} />}
      {user && profile?.role === 'client' && <RecommendedCreators userId={user.id} />}
      
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
          {posts.map((p) => (
            <PostCard 
              key={p.id} 
              post={p} 
              onDelete={(id) => setPosts(prev => prev.filter(post => post.id !== id))} 
            />
          ))}
        </div>
      )}

      {viewerIndex !== null && storyGroups.length > 0 && (
        <StoryViewer
          groups={storyGroups}
          startIndex={viewerIndex}
          viewerId={user?.id}
          onClose={() => setViewerIndex(null)}
          onDeleteStory={(storyId) => {
            setStoryGroups((prev) =>
              prev
                .map((g) => ({ ...g, stories: g.stories.filter((s) => s.id !== storyId) }))
                .filter((g) => g.stories.length > 0)
            );
          }}
        />
      )}
    </div>
  );
}

function StoryPreviewThumbnail({ story, avatarUrl, initial }: { story?: Story, avatarUrl: string | null, initial: string }) {
  const isVideo = story?.media_type === "video";
  const path = isVideo && story?.thumbnail_url ? story.thumbnail_url : story?.media_url;
  const { resolvedUrl } = useMediaUrl("story", path);

  if (story && !resolvedUrl) {
    return <div className="w-full h-full rounded-full bg-muted animate-pulse" />;
  }

  if (story && resolvedUrl) {
    if (isVideo && !story.thumbnail_url) {
      return (
        <video src={resolvedUrl} className="w-full h-full rounded-full object-cover" preload="metadata" muted playsInline />
      );
    }
    return <img src={resolvedUrl} alt="Story preview" className="w-full h-full rounded-full object-cover" />;
  }

  if (avatarUrl) {
    return <ProfileAvatar url={avatarUrl} className="w-full h-full rounded-full object-cover" />;
  }

  return (
    <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-foreground text-sm font-semibold">
      {initial}
    </div>
  );
}

function StoryItem({ label, username, avatarUrl, you, linkTo, hasStory, previewStory, suggested, onFollow, onOpen }: {
  label: string; username: string; avatarUrl: string | null; you?: boolean;
  linkTo?: string; hasStory?: boolean; previewStory?: Story; suggested?: boolean; onFollow?: () => void; onOpen?: () => void;
}) {
  const initial = (username || "?").slice(0, 1).toUpperCase();
  const ring = hasStory
    ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-brand"
    : you
      ? "bg-muted"
      : "bg-transparent";
  const inner = (
    <div className="flex-shrink-0 flex flex-col items-center gap-1.5 text-center w-20">
      <div className={`relative w-14 h-14 rounded-full p-[2px] ${ring}`}>
        <div className="w-full h-full rounded-full bg-surface p-[2px]">
          <StoryPreviewThumbnail story={previewStory} avatarUrl={avatarUrl} initial={initial} />
        </div>
        {you && !hasStory && (
          <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-brand border-2 border-surface flex items-center justify-center">
            <Plus className="w-2.5 h-2.5 text-brand-foreground" />
          </div>
        )}
        {suggested && !hasStory && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFollow?.();
            }}
            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-brand border-2 border-surface flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
          >
            <Plus className="w-3 h-3 text-brand-foreground" strokeWidth={3} />
          </button>
        )}
      </div>
      <span className="text-[11px] text-foreground/80 max-w-[80px] truncate font-medium">{label}</span>
    </div>
  );
  if (onOpen) return <button type="button" onClick={onOpen}>{inner}</button>;
  if (linkTo) return <Link to={linkTo}>{inner}</Link>;
  return <Link to="/user/$username" params={{ username }}>{inner}</Link>;

}



// --- Recommendation Components ---

function RecommendedJobs({ userId }: { userId: string }) {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: recs, error } = await supabase.rpc('get_recommended_jobs_for_creator', { p_creator_id: userId, p_limit: 5 });
      if (recs && recs.length > 0) {
        const jobIds = recs.map((r: any) => r.job_id);
        const { data: jobDetails } = await supabase.from("jobs").select("*").in("id", jobIds);
        if (jobDetails) {
          // Sort by match_score descending
          const sortedJobs = jobDetails.map(j => {
            const rec = recs.find((r: any) => r.job_id === j.id);
            return { ...j, match_score: rec?.match_score || 0 };
          }).sort((a, b) => b.match_score - a.match_score);
          setJobs(sortedJobs);
        }
      }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return null;
  if (jobs.length === 0) return null;

  return (
    <section className="mt-4 mb-2">
      <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1">
        ✨ Recommended Briefs for You
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
        {jobs.map(job => (
          <Link key={job.id} to="/jobs" className="min-w-[240px] p-3 rounded-xl border border-border bg-surface hover:border-brand/40 transition shrink-0 block">
            <div className="flex justify-between items-start mb-1">
              <h3 className="font-semibold text-sm truncate pr-2">{job.title}</h3>
              <span className="text-[10px] font-bold text-brand bg-brand-soft px-1.5 py-0.5 rounded">{job.match_score}% Match</span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{job.company_name || 'Anonymous'}</p>
            <div className="mt-3 flex gap-2">
              {job.budget && <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md">{job.budget}</span>}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecommendedCreators({ userId }: { userId: string }) {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobTitle, setJobTitle] = useState("");

  useEffect(() => {
    (async () => {
      // Get the latest open job for this client
      const { data: jobs } = await supabase.from("jobs").select("id, title").eq("client_id", userId).eq("status", "open").order("created_at", { ascending: false }).limit(1);
      
      if (jobs && jobs.length > 0) {
        const job = jobs[0];
        setJobTitle(job.title);
        
        const { data: recs } = await supabase.rpc('get_recommended_creators_for_job', { p_job_id: job.id, p_limit: 5 });
        if (recs && recs.length > 0) {
          const creatorIds = recs.map((r: any) => r.creator_id);
          const { data: profs } = await supabase.from("profiles").select("id, username, full_name, avatar_url, bio, account_type, experience_level").in("id", creatorIds);
          if (profs) {
            const sorted = profs.map(p => {
              const rec = recs.find((r: any) => r.creator_id === p.id);
              return { ...p, match_score: rec?.match_score || 0 };
            }).sort((a, b) => b.match_score - a.match_score);
            setCreators(sorted);
          }
        }
      }
      setLoading(false);
    })();
  }, [userId]);

  if (loading) return null;
  if (creators.length === 0) return null;

  return (
    <section className="mt-4 mb-2">
      <h2 className="text-sm font-bold text-foreground mb-3 flex items-center gap-1">
        ✨ Top Matches for: <span className="text-muted-foreground font-medium truncate max-w-[150px] inline-block align-bottom">{jobTitle}</span>
      </h2>
      <div className="flex gap-3 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
        {creators.map(c => (
          <Link key={c.id} to="/user/$username" params={{ username: c.username }} className="w-[160px] p-3 rounded-xl border border-border bg-surface hover:border-brand/40 transition shrink-0 flex flex-col items-center text-center">
            <div className="relative mb-2">
              <ProfileAvatar url={c.avatar_url} className="w-12 h-12 rounded-full" />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-surface rounded-full">
                <span className="text-[9px] font-bold text-brand bg-brand-soft px-1.5 py-0.5 rounded-full whitespace-nowrap">{c.match_score}% Match</span>
              </div>
            </div>
            <h3 className="font-semibold text-sm truncate w-full mt-1">{c.full_name || c.username}</h3>
            <p className="text-xs text-muted-foreground truncate w-full mb-2">@{c.username}</p>
            {c.experience_level && <span className="text-[10px] font-medium px-2 py-0.5 bg-muted rounded-md">{c.experience_level}</span>}
          </Link>
        ))}
      </div>
    </section>
  );
}
