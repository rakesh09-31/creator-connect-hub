import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, ensureProfile } from "@/lib/auth";
import { StoryViewer, type Story, type StoryGroup } from "@/components/StoryViewer";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import { Grid3x3, Briefcase, Image as ImageIcon, MessageCircle, Play, MapPin, Users, Plus, X, ArrowLeft, RefreshCw, Award, CheckCircle2 } from "lucide-react";
import { ClientProjectsPanel, PortfolioPanel, PostMediaViewer, isVideoMedia } from "./_app.profile";
import { VideoViewer, type VideoItem } from "@/components/VideoViewer";
import { VideoPlayer } from "@/components/VideoPlayer";
import { getReadableErrorMessage } from "@/lib/errors";
import { filterValidMediaItems, isCandidateMediaUrl } from "@/lib/storage";

export const Route = createFileRoute("/_authenticated/_app/user/$username")({
  component: UserProfilePage,
});

function UserProfilePage() {
  const { username } = Route.useParams();
  return <UserProfileView identifier={username} />;
}

export function UserProfileView({ identifier }: { identifier: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [following, setFollowing] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0, squads: 0 });
  const [squads, setSquads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [storyOpen, setStoryOpen] = useState(false);
  const [tab, setTab] = useState<"posts" | "portfolio" | "squads" | "projects" | "videos">("posts");
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [videoIndex, setVideoIndex] = useState<number | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    if (lightboxOpen) {
      document.body.style.overflow = "hidden";
      const handleEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxOpen(false); };
      window.addEventListener("keydown", handleEsc);
      return () => {
        document.body.style.overflow = "auto";
        window.removeEventListener("keydown", handleEsc);
      };
    }
  }, [lightboxOpen]);

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
    let active = true;
    setLoading(true);
    setLoadError(null);
    setProfile(null);
    setPosts([]);
    setSquads([]);
    setSpecialties([]);
    setRoles([]);
    setSkills([]);
    setCounts({ followers: 0, following: 0, squads: 0 });
    setActiveStories([]);

    (async () => {
      try {
        if (!identifier) {
          if (active) {
            setLoading(false);
            setLoadError("Invalid profile identifier.");
          }
          return;
        }

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        let q = supabase.from("profiles").select("*");
        if (isUuid) {
          q = q.or(`id.eq.${identifier},username.eq.${identifier}`);
        } else {
          q = q.eq("username", identifier);
        }

        let { data: p, error: pErr } = await q.maybeSingle();

        // Fallback in case alphanumeric identifier matches a profile id
        if (!p && !isUuid) {
          const { data: fallback } = await supabase.from("profiles").select("*").eq("id", identifier).maybeSingle();
          p = fallback;
        }

        if (pErr) {
          console.error("Profile query error:", pErr);
          if (active) {
            setLoadError(getReadableErrorMessage(pErr, "Failed to load profile."));
            setLoading(false);
          }
          return;
        }

        if (!p) {
          if (active) {
            setProfile(null);
            setLoading(false);
          }
          return;
        }

        if (!active) return;
        setProfile(p);

        const isClient = p.role === "client" || p.account_type === "client";
        const [
          { data: postsData },
          { data: specRows },
          { data: rRows },
          { data: skillRows },
          { data: mems },
          { data: storyRows }
        ] = await Promise.all([
          supabase.from("posts").select("*").eq("author_id", p.id).order("created_at", { ascending: false }),
          supabase.from("creator_specialties").select("specialty").eq("user_id", p.id),
          isClient
            ? supabase.from("client_roles").select("role_id, professional_roles(id, name)").eq("client_id", p.id)
            : supabase.from("creator_roles").select("role_id, professional_roles(id, name)").eq("creator_id", p.id),
          supabase.from("creator_skills").select("skill_id, skills(id, name)").eq("creator_id", p.id),
          supabase.from("squad_members").select("squad_id, squads:squad_id(id, name, description, specialty, avatar_url)").eq("user_id", p.id),
          supabase.from("stories").select("*").eq("user_id", p.id).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: true }),
        ]);

        const validPosts = await filterValidMediaItems(postsData ?? []);
        if (!active) return;
        setPosts(validPosts);
        setSpecialties((specRows ?? []).map((x: any) => x.specialty).filter(Boolean));
        setRoles((rRows ?? []).map((x: any) => x.professional_roles).filter(Boolean));
        setSkills((skillRows ?? []).map((x: any) => x.skills).filter(Boolean));

        const sq = (mems ?? []).map((m: any) => m.squads).filter(Boolean);
        setSquads(sq);
        setCounts((prev) => ({ ...prev, squads: sq.length }));
        setActiveStories((storyRows ?? []) as Story[]);
        await refreshFollow(p.id);

        if (isClient) setTab("projects");
        else setTab("portfolio");
      } catch (err: any) {
        console.error("Profile view unexpected load error:", err);
        if (active) setLoadError(getReadableErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [identifier, user?.id, reloadTrigger]);

  const toggleFollow = async () => {
    if (!user || !profile) {
      toast.error("Sign in to follow creators");
      return;
    }
    try {
      await ensureProfile(user);
      if (following) {
        setFollowing(false);
        setCounts((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
        const { error } = await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", profile.id);
        if (error) {
          setFollowing(true);
          setCounts((prev) => ({ ...prev, followers: prev.followers + 1 }));
          toast.error(getReadableErrorMessage(error, "Failed to unfollow"));
        }
      } else {
        setFollowing(true);
        setCounts((prev) => ({ ...prev, followers: prev.followers + 1 }));
        const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: profile.id });
        if (error && error.code !== "23505") {
          setFollowing(false);
          setCounts((prev) => ({ ...prev, followers: Math.max(0, prev.followers - 1) }));
          toast.error(getReadableErrorMessage(error, "Failed to follow"));
        }
      }
      refreshFollow(profile.id);
    } catch (err) {
      toast.error(getReadableErrorMessage(err, "Action could not be completed"));
    }
  };

  const handleMessage = async () => {
    if (!user || !profile) {
      toast.error("Sign in to message");
      return;
    }
    try {
      await ensureProfile(user);
      const { data, error } = await supabase.rpc("get_or_create_dm", { _other: profile.id });
      if (error) throw error;
      if (data) {
        navigate({ to: "/messages", search: { c: data } as any });
      }
    } catch (err: any) {
      toast.error(getReadableErrorMessage(err, "Could not open conversation"));
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm animate-pulse flex flex-col sm:flex-row gap-5">
          <div className="w-24 h-24 rounded-full bg-muted shrink-0" />
          <div className="flex-1 space-y-3 pt-2">
            <div className="h-6 w-48 bg-muted rounded-md" />
            <div className="h-4 w-28 bg-muted rounded-md" />
            <div className="h-4 w-72 bg-muted/60 rounded-md" />
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
          <X className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Unable to load profile</h2>
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => setReloadTrigger((n) => n + 1)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Retry
          </button>
          <button
            onClick={() => navigate({ to: "/home" })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border text-foreground font-semibold rounded-xl text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-muted text-muted-foreground flex items-center justify-center mx-auto">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Profile not found</h2>
        <p className="text-sm text-muted-foreground">The creator or user you are looking for does not exist or has been removed.</p>
        <div className="pt-2 flex justify-center gap-3">
          <button
            onClick={() => navigate({ to: "/home" })}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-xl text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isCreator = profile.role === "creator" || profile.account_type === "creator";
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
            onDoubleClick={() => setLightboxOpen(true)}
            className={`w-24 h-24 rounded-full p-[3px] flex-shrink-0 bg-surface ${activeStories.length > 0 ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-brand cursor-pointer" : "border-2 border-border cursor-pointer"}`}
            title={activeStories.length > 0 ? "View active stories" : "Double-click to view photo"}
          >
            <span className="w-full h-full rounded-full bg-surface p-[2px] flex items-center justify-center text-3xl font-semibold overflow-hidden">
              {profile.avatar_url
                ? <ProfileAvatar url={profile.avatar_url} className="w-full h-full rounded-full object-cover" />
                : (profile.username || "?").slice(0, 1).toUpperCase()}
            </span>
          </button>
          
          <div className="flex-1 min-w-0 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight truncate">{profile.full_name || profile.username}</h1>
              {profile.verified && <CheckCircle2 className="w-5 h-5 text-brand fill-brand/20 shrink-0" />}
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${
                isCreator ? "bg-brand-soft text-brand" : "bg-primary/10 text-primary"
              }`}>
                {profile.role ?? "creator"}
              </span>

              {/* Experience level & years */}
              {profile.experience_level && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded bg-muted text-foreground/85">
                  <Award className="w-3 h-3 text-brand" />
                  {profile.experience_level}
                  {profile.experience_years ? ` · ${profile.experience_years} yrs exp` : ""}
                </span>
              )}

              {profile.location && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" /> {profile.location}
                </span>
              )}
            </div>

            {/* Professional Roles Tags */}
            {roles.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {roles.map((r) => (
                  <span key={r.id} className="text-xs font-medium px-2 py-0.5 rounded-md bg-surface border border-border text-foreground/80">
                    {r.name}
                  </span>
                ))}
              </div>
            )}

            {profile.bio && <p className="mt-3 text-sm text-foreground/90 leading-relaxed max-w-2xl">{profile.bio}</p>}
          </div>

          {!isSelf ? (
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
          ) : (
            <div className="mt-4 sm:mt-0">
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-4 py-2 bg-surface border border-border text-foreground font-semibold rounded-xl text-sm hover:bg-muted transition"
              >
                My Profile
              </Link>
            </div>
          )}
        </div>

        {/* Stats Strip */}
        <div className={`grid ${isCreator ? "grid-cols-4" : "grid-cols-3"} gap-2 mt-8 pt-5 border-t border-border`}>
          <Link to="/connections/$username" params={{ username: profile.username }} search={{ tab: "followers" } as any} className="text-center block hover:opacity-80 transition cursor-pointer">
            <div className="text-xl font-semibold tracking-tight">{counts.followers}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Followers</div>
          </Link>
          <Link to="/connections/$username" params={{ username: profile.username }} search={{ tab: "following" } as any} className="text-center block hover:opacity-80 transition cursor-pointer">
            <div className="text-xl font-semibold tracking-tight">{counts.following}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Following</div>
          </Link>
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

      {/* Specialties & Skills Section */}
      {(specialties.length > 0 || skills.length > 0) && (
        <div className="mt-6 space-y-4">
          {specialties.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Specialties</h2>
              <div className="flex flex-wrap gap-2">
                {specialties.map((s) => (
                  <span key={s} className="bg-surface border border-border px-3 py-1.5 rounded-full text-xs font-semibold text-foreground/80 shadow-sm">{s}</span>
                ))}
              </div>
            </div>
          )}

          {skills.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Skills & Capabilities</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map((sk) => (
                  <span key={sk.id} className="bg-brand-soft border border-brand/20 text-brand px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm">{sk.name}</span>
                ))}
              </div>
            </div>
          )}
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
        {tab === "portfolio" && isCreator && <PortfolioPanel userId={profile.id} isSelf={isSelf} />}
        {tab === "projects" && !isCreator && <ClientProjectsPanel userId={profile.id} isSelf={isSelf} />}
        
        {tab === "videos" && isCreator && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {myVideos.length === 0 ? (
              <div className="col-span-full text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-2xl">No videos uploaded yet.</div>
            ) : (
              myVideos.map((v, i) => (
                <button key={v.id} onClick={() => setVideoIndex(i)} className="relative aspect-[9/16] bg-muted rounded-xl overflow-hidden group text-left">
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
                <UserPostItem
                  key={p.id}
                  post={p}
                  isVideo={isVideoMedia(p)}
                  onSelect={setSelectedPost}
                  onInvalid={(id) => setPosts((prev) => prev.filter((post) => post.id !== id))}
                />
              ))
            )}
          </div>
        )}

        {tab === "squads" && isCreator && (
          <div className="space-y-2">
            {squads.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm border border-dashed border-border rounded-2xl">
                Not a member of any squads yet.
              </div>
            ) : (
              squads.map((s) => (
                <Link key={s.id} to="/squads/$squadId" params={{ squadId: s.id }} className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-brand/40 hover:shadow-sm transition">
                  <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                    {s.name.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{s.name}</p>
                    {s.specialty && <p className="text-xs text-muted-foreground truncate">{s.specialty}</p>}
                  </div>
                </Link>
              ))
            )}
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

      {lightboxOpen && profile && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setLightboxOpen(false)}>
           <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/20 rounded-full transition">
             <X className="w-6 h-6" />
           </button>
           <div onClick={(e) => e.stopPropagation()} className="relative max-w-full max-h-full flex items-center justify-center">
             {profile.avatar_url ? (
               <img src={profile.avatar_url} alt="Profile" className="max-w-full max-h-full object-contain shadow-2xl" />
             ) : (
               <div className="w-64 h-64 sm:w-96 sm:h-96 rounded-full bg-surface text-foreground flex items-center justify-center text-7xl font-bold shadow-2xl border-4 border-border">
                 {(profile.username || "?").slice(0, 1).toUpperCase()}
               </div>
             )}
           </div>
        </div>
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

function UserPostItem({
  post,
  isVideo,
  onSelect,
  onInvalid,
}: {
  post: any;
  isVideo: boolean;
  onSelect: (p: any) => void;
  onInvalid?: (id: string) => void;
}) {
  const isCandidate = isCandidateMediaUrl(post.media_url);
  const [mediaError, setMediaError] = useState(false);
  const { resolvedUrl, loading, error } = useMediaUrl(
    isVideo ? "reel" : "post",
    isCandidate ? post.media_url : null
  );

  const isUnavailable = !isCandidate || mediaError || (error && !resolvedUrl) || (!resolvedUrl && !loading);

  useEffect(() => {
    if (isUnavailable) {
      onInvalid?.(post.id);
    }
  }, [isUnavailable, post.id, onInvalid]);

  if (isUnavailable) {
    return null;
  }

  return (
    <button onClick={() => onSelect(post)} className="relative aspect-square bg-muted overflow-hidden group rounded-md md:rounded-xl text-left">
      {isVideo ? (
        <VideoPlayer
          src={post.media_url}
          poster={post.thumbnail_url}
          controls={false}
          className="w-full h-full object-cover"
          feature="reel"
          onInvalid={() => {
            setMediaError(true);
            onInvalid?.(post.id);
          }}
        />
      ) : resolvedUrl ? (
        <img
          src={resolvedUrl}
          className="w-full h-full object-cover transition group-hover:scale-105"
          alt={post.caption || "Post"}
          onError={() => {
            setMediaError(true);
            onInvalid?.(post.id);
          }}
        />
      ) : (
        <div className="w-full h-full bg-muted animate-pulse" />
      )}
      {isVideo && (
        <div className="absolute top-2 right-2">
          <Play className="w-4 h-4 text-white drop-shadow-md" />
        </div>
      )}
    </button>
  );
}
