import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { StoryViewer, type Story, type StoryGroup } from "@/components/StoryViewer";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Grid3x3, Briefcase, Image as ImageIcon, MessageCircle, Play, MapPin, Users, Plus } from "lucide-react";
import { ClientProjectsPanel, PortfolioPanel, PostMediaViewer, isVideoMedia } from "./_app.profile";
import { VideoViewer, type VideoItem } from "@/components/VideoViewer";
import { VideoPlayer } from "@/components/VideoPlayer";

export const Route = createFileRoute("/_authenticated/_app/user/$username")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [following, setFollowing] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0, squads: 0 });
  const [loading, setLoading] = useState(true);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [storyOpen, setStoryOpen] = useState(false);
  const [tab, setTab] = useState<"posts" | "portfolio" | "squads" | "projects" | "videos">("posts");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [videoIndex, setVideoIndex] = useState<number | null>(null);

  const { resolvedUrl: resolvedAvatar } = useMediaUrl("profileImage", profile?.avatar_url);

  const myVideos: VideoItem[] = useMemo(
    () =>
      posts
        .filter((p) => isVideoMedia(p))
        .map((p) => ({
          id: p.id,
          url: p.media_url as string,
          poster: p.thumbnail_url ?? null,
          title: p.caption ?? null,
          authorName: profile?.full_name || profile?.username || null,
          canDelete: false,
        })),
    [posts, profile],
  );

  const refreshFollow = async (targetId: string) => {
    if (!user) return;
    const [{ data: rel }, { count: fc }, { count: gc }] = await Promise.all([
      supabase.from("follows").select("id").eq("follower_id", user.id).eq("following_id", targetId).maybeSingle(),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", targetId),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", targetId),
    ]);
    setFollowing(!!rel);
    setCounts((prev) => ({ ...prev, followers: fc ?? 0, following: gc ?? 0 }));
  };

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from("profiles").select("*").eq("username", username).maybeSingle();
      setProfile(p);
      if (p) {
        const [{ data: postsData }, { data: s }, { count: sqCount }, { data: storyRows }] = await Promise.all([
          supabase.from("posts").select("*").eq("author_id", p.id).order("created_at", { ascending: false }),
          supabase.from("creator_specialties").select("specialty").eq("user_id", p.id),
          supabase.from("squad_members").select("*", { count: "exact", head: true }).eq("user_id", p.id),
          supabase.from("stories").select("*").eq("user_id", p.id).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: true }),
        ]);
        setPosts(postsData ?? []);
        setSpecialties((s ?? []).map((x: any) => x.specialty));
        setCounts((prev) => ({ ...prev, squads: sqCount ?? 0 }));
        setActiveStories((storyRows ?? []) as Story[]);
        await refreshFollow(p.id);
        
        // Auto-select tab based on role
        if (p.role === "client") setTab("projects");
        else setTab("portfolio");
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

  const handleMessage = async () => {
    if (!user || !profile) return;
    try {
      const { data, error } = await supabase.rpc("get_or_create_dm", { _other: profile.id });
      if (error) throw error;
      if (data) {
        navigate({ to: `/messages/$conversationId`, params: { conversationId: data } });
      }
    } catch (err: any) {
      toast.error(`Could not open conversation: ${err.message}`);
    }
  };

  if (loading) return <div className="text-center py-12 text-muted-foreground">Loading profile...</div>;
  if (!profile) return <div className="text-center py-12 text-muted-foreground">User not found.</div>;

  const isCreator = profile.role === "creator";
  const isSelf = user?.id === profile.id;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Profile Header */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {profile.cover_url && (
          <div className="absolute inset-0 h-32 w-full">
            <ProfileAvatar url={profile.cover_url} className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-surface" />
          </div>
        )}
        <div className="relative flex flex-col sm:flex-row items-start sm:items-end gap-5 pt-12">
          <button
            type="button"
            onClick={() => activeStories.length > 0 && setStoryOpen(true)}
            className={`w-24 h-24 rounded-full p-[3px] flex-shrink-0 bg-surface ${activeStories.length > 0 ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-brand cursor-pointer" : "border-2 border-border cursor-default"}`}
          >
            <span className="w-full h-full rounded-full bg-surface p-[2px] flex items-center justify-center text-3xl font-semibold overflow-hidden">
              {profile.avatar_url
                ? <ProfileAvatar url={profile.avatar_url} className="w-full h-full rounded-full object-cover" />
                : profile.username.slice(0, 1).toUpperCase()}
            </span>
          </button>
          
          <div className="flex-1 min-w-0 pb-1">
            <h1 className="text-2xl font-bold tracking-tight truncate">{profile.full_name || profile.username}</h1>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${
                isCreator ? "bg-brand-soft text-brand" : "bg-primary/10 text-primary"
              }`}>
                {profile.role ?? "creator"}
              </span>
              {profile.location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {profile.location}
                </span>
              )}
            </div>
            {profile.bio && <p className="mt-3 text-sm text-foreground/90 leading-relaxed max-w-2xl">{profile.bio}</p>}
          </div>

          {!isSelf && (
            <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
              <button 
                onClick={handleMessage} 
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm transition hover:opacity-90"
              >
                <MessageCircle className="w-4 h-4" /> Message
              </button>
              <button 
                onClick={toggleFollow} 
                className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 font-semibold rounded-xl text-sm border transition ${following ? "bg-muted border-transparent text-foreground" : "bg-transparent border-border text-foreground hover:bg-muted"}`}
              >
                {following ? "Following" : "Follow"}
              </button>
            </div>
          )}
        </div>

        {/* Stats Strip */}
        <div className={`grid ${isCreator ? "grid-cols-4" : "grid-cols-3"} gap-2 mt-8 pt-5 border-t border-border`}>
          <div className="text-center">
            <div className="text-xl font-semibold tracking-tight">{counts.followers}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold tracking-tight">{counts.following}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Following</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-semibold tracking-tight">{posts.length}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Posts</div>
          </div>
          {isCreator && (
            <div className="text-center">
              <div className="text-xl font-semibold tracking-tight">{counts.squads}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Squads</div>
            </div>
          )}
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Skills & Expertise</h2>
          <div className="flex flex-wrap gap-2">
            {specialties.map((s) => (
              <span key={s} className="bg-surface border border-border px-3 py-1.5 rounded-full text-xs font-semibold text-foreground/80 shadow-sm">{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mt-8 border-b border-border overflow-x-auto scrollbar-hide">
        <div className="flex min-w-max gap-4">
          {isCreator && <TabBtn active={tab === "portfolio"} onClick={() => setTab("portfolio")} icon={<ImageIcon className="w-4 h-4" />} label="Portfolio" />}
          {!isCreator && <TabBtn active={tab === "projects"} onClick={() => setTab("projects")} icon={<Briefcase className="w-4 h-4" />} label="Projects" />}
          {isCreator && <TabBtn active={tab === "videos"} onClick={() => setTab("videos")} icon={<Play className="w-4 h-4" />} label="Videos" />}
          <TabBtn active={tab === "posts"} onClick={() => setTab("posts")} icon={<Grid3x3 className="w-4 h-4" />} label="Posts" />
          {isCreator && <TabBtn active={tab === "squads"} onClick={() => setTab("squads")} icon={<Users className="w-4 h-4" />} label="Squads" />}
        </div>
      </div>

      {/* Content Areas */}
      <div className="mt-6 min-h-[400px]">
        {tab === "portfolio" && isCreator && <PortfolioPanel userId={profile.id} isSelf={false} />}
        {tab === "projects" && !isCreator && <ClientProjectsPanel userId={profile.id} isSelf={false} />}
        
        {tab === "videos" && isCreator && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {myVideos.length === 0 ? (
              <div className="col-span-full text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-2xl">No videos uploaded yet.</div>
            ) : (
              myVideos.map((v, i) => (
                <button key={v.id} onClick={() => setVideoIndex(i)} className="relative aspect-[9/16] bg-muted rounded-xl overflow-hidden group">
                  <VideoPlayer src={v.url} poster={v.poster || undefined} controls={false} className="w-full h-full object-cover" feature="reel" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                    <Play className="w-10 h-10 text-white drop-shadow-md" />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white drop-shadow-md text-xs font-semibold">
                    <span className="truncate pr-2">{v.title || "Video"}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {tab === "posts" && (
          <div className="grid grid-cols-3 gap-1 md:gap-3">
            {posts.length === 0 ? (
              <div className="col-span-full text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-2xl">No posts yet.</div>
            ) : (
              posts.map((p) => (
                <button key={p.id} onClick={() => setSelectedPost(p)} className="relative aspect-square bg-muted overflow-hidden group rounded-md md:rounded-xl">
                  {p.media_url ? (
                    isVideoMedia(p) ? (
                      <VideoPlayer src={p.media_url} poster={p.thumbnail_url} controls={false} className="w-full h-full object-cover" feature="reel" />
                    ) : (
                      <ProfileAvatar url={p.media_url} className="w-full h-full object-cover transition group-hover:scale-105" />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 text-xs text-muted-foreground text-center bg-surface border border-border">
                      {p.caption || "Text post"}
                    </div>
                  )}
                  {isVideoMedia(p) && (
                    <div className="absolute top-2 right-2">
                      <Play className="w-4 h-4 text-white drop-shadow-md" />
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        )}

        {tab === "squads" && isCreator && (
          <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-2xl">
            Squad visibility coming soon.
          </div>
        )}
      </div>

      {selectedPost && <PostMediaViewer post={selectedPost} onClose={() => setSelectedPost(null)} />}
      
      {videoIndex !== null && myVideos[videoIndex] && (
        <VideoViewer
          items={myVideos}
          startIndex={videoIndex}
          onClose={() => setVideoIndex(null)}
          onDelete={() => {}}
        />
      )}
      
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

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 pb-3 px-1 text-sm font-semibold border-b-2 transition-colors ${
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}
