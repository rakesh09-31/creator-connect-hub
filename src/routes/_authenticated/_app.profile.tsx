import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Grid3x3, Bookmark, Users, Plus, ExternalLink, Pencil, X, Briefcase, MapPin, Clock, Image as ImageIcon, Trash2, Play, Info, ChevronLeft, ChevronRight, Github, Globe, Wrench, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { uploadFile, uploadVideo, optimizeImage, deleteMediaByUrl, deleteFile, deleteByUrl } from "@/lib/storage";
import { VideoPlayer } from "@/components/VideoPlayer";
import { VideoViewer, type VideoItem } from "@/components/VideoViewer";
import { StoryViewer, type Story, type StoryGroup } from "@/components/StoryViewer";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import { ProfileAvatar } from "@/components/ProfileAvatar";
import ProfileSkillSwapsPanel from "@/components/skill-swap/ProfileSkillSwapsPanel";

export const Route = createFileRoute("/_authenticated/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Omnicraft" }] }),
  component: ProfilePage,
});

type Squad = { id: string; name: string; description: string | null; specialty: string | null; avatar_url: string | null };

function ProfilePage() {
  const { profile, user, refresh } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [roles, setRoles] = useState<{id: string, name: string}[]>([]);
  const [skills, setSkills] = useState<{id: string, name: string}[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [tab, setTab] = useState<"posts" | "portfolio" | "squads" | "projects" | "saved" | "skill_swaps">("posts");
  const [editOpen, setEditOpen] = useState(false);
  const [postsLoading, setPostsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [activeStories, setActiveStories] = useState<Story[]>([]);
  const [storyOpen, setStoryOpen] = useState(false);
  const [videoIndex, setVideoIndex] = useState<number | null>(null);

  const { resolvedUrl: resolvedAvatar } = useMediaUrl("profileImage", profile?.avatar_url);

  /** Videos owned by me, in grid order — powers the reels-style viewer. */
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
          canDelete: true,
        })),
    [posts, profile],
  );

  /** Owner-only delete: DB row first, then the storage object + poster. */
  const deleteVideo = async (item: VideoItem) => {
    if (!user) return;
    const post = posts.find((p) => p.id === item.id);
    const { error } = await supabase.from("posts").delete().eq("id", item.id).eq("author_id", user.id);
    if (error) {
      toast.error(`Could not delete: ${error.message}`);
      return;
    }
    try {
      await deleteMediaByUrl(post?.media_url, post?.thumbnail_url);
    } catch (err: any) {
      toast.warning(`Post removed, but the stored file could not be deleted: ${err?.message ?? "unknown error"}`);
    }
    setPosts((prev) => prev.filter((p) => p.id !== item.id));
    setVideoIndex(null);
    toast.success("Video deleted");
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      setPostsLoading(true);
      const isClient = profile?.role === "client" || profile?.account_type === "client";
      const [{ data: p }, { data: r }, { data: s }, { data: mems }, { count: fc }, { count: gc }, { data: storyRows }] = await Promise.all([
        supabase.from("posts").select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
        isClient 
          ? supabase.from("client_roles").select("role_id, professional_roles(id, name)").eq("client_id", user.id)
          : supabase.from("creator_roles").select("role_id, professional_roles(id, name)").eq("creator_id", user.id),
        supabase.from("creator_skills").select("skill_id, skills(id, name)").eq("creator_id", user.id),
        supabase.from("squad_members").select("squad_id, squads:squad_id(id, name, description, specialty, avatar_url)").eq("user_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
        supabase.from("stories").select("*").eq("user_id", user.id).gt("expires_at", new Date().toISOString()).order("created_at", { ascending: true }),
      ]);
      setPosts(p ?? []);
      setRoles((r ?? []).map((x: any) => x.professional_roles).filter(Boolean));
      setSkills((s ?? []).map((x: any) => x.skills).filter(Boolean));
      const sq = (mems ?? []).map((m: any) => m.squads).filter(Boolean);
      setSquads(sq as Squad[]);
      setCounts({ followers: fc ?? 0, following: gc ?? 0 });
      setActiveStories((storyRows ?? []) as any as Story[]);
      setPostsLoading(false);
    })();
  }, [user, profile]);

  if (!profile) return null;
  const isCreator = profile.role === "creator";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <button
            type="button"
            onClick={() => activeStories.length > 0 && setStoryOpen(true)}
            className={`w-20 h-20 rounded-full p-[3px] flex-shrink-0 ${activeStories.length > 0 ? "bg-gradient-to-tr from-amber-400 via-rose-500 to-brand cursor-pointer" : "bg-border cursor-default"}`}
            aria-label={activeStories.length > 0 ? "View active story" : "No active story"}
          >
            <span className="w-full h-full rounded-full bg-surface p-[2px] flex items-center justify-center text-2xl font-semibold overflow-hidden">
              {resolvedAvatar
                ? <img src={resolvedAvatar} className="w-full h-full rounded-full object-cover" alt="" />
                : profile.username.slice(0, 1).toUpperCase()}
            </span>
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight truncate">{profile.full_name || profile.username}</h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
              <button onClick={() => setEditOpen(true)} className="p-2 hover:bg-muted rounded-md text-muted-foreground transition" aria-label="Edit profile">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${
                isCreator ? "bg-brand-soft text-brand" : "bg-muted text-foreground/70"
              }`}>
                {profile.role ?? "creator"}
              </span>
            </div>
            {profile.bio && <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{profile.bio}</p>}
            {profile.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Portfolio
              </a>
            )}
          </div>
        </div>

        <div className={`grid ${isCreator ? "grid-cols-4" : "grid-cols-3"} gap-2 mt-6 pt-5 border-t border-border`}>
          <Stat label="Posts" value={posts.length} />
          {isCreator && <Stat label="Squads" value={squads.length} />}
          <Stat label="Followers" value={counts.followers} to={`/connections/${profile.username}?tab=followers`} />
          <Stat label="Following" value={counts.following} to={`/connections/${profile.username}?tab=following`} />
        </div>
      </div>

      {(roles.length > 0 || skills.length > 0) && (
        <div className="mt-5 space-y-4">
          {roles.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Roles</h2>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r) => (
                  <span key={r.id} className="bg-surface border border-border px-2.5 py-1 rounded-md text-xs font-medium text-foreground/80">{r.name}</span>
                ))}
              </div>
            </div>
          )}
          {skills.length > 0 && isCreator && (
            <div>
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span key={skill.id} className="bg-surface border border-border px-2.5 py-1 rounded-md text-xs font-medium text-foreground/80">{skill.name}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-6 border-b border-border overflow-x-auto">
        <div className="flex min-w-max">
          <TabBtn active={tab === "posts"} onClick={() => setTab("posts")} icon={<Grid3x3 className="w-4 h-4" />} label="Posts" />
          <TabBtn active={tab === "portfolio"} onClick={() => setTab("portfolio")} icon={<ImageIcon className="w-4 h-4" />} label="Portfolio" />
          {isCreator && (
            <>
              <TabBtn active={tab === "squads"} onClick={() => setTab("squads")} icon={<Users className="w-4 h-4" />} label="Squads" />
              <TabBtn active={tab === "skill_swaps"} onClick={() => setTab("skill_swaps")} icon={<Wrench className="w-4 h-4" />} label="Skill Swaps" />
            </>
          )}
          {!isCreator && (
            <TabBtn active={tab === "projects"} onClick={() => setTab("projects")} icon={<Briefcase className="w-4 h-4" />} label="Projects" />
          )}
          <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark className="w-4 h-4" />} label="Saved" />
        </div>
      </div>

      {tab === "portfolio" && <PortfolioPanel userId={user?.id ?? ""} isSelf />}

      {tab === "posts" && (
        <div className="mt-4">
          {postsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-3xl bg-surface border border-border" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 text-sm bg-surface border border-border rounded-2xl">No posts yet</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {posts.map((p) => (
                <ProfilePostTile
                  key={p.id}
                  post={p}
                  isVideoMedia={isVideoMedia}
                  setVideoIndex={setVideoIndex}
                  myVideos={myVideos}
                  setSelectedPost={setSelectedPost}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "squads" && isCreator && (
        <div className="mt-4 space-y-2">
          <Link to="/squads" className="flex items-center justify-between p-4 rounded-xl bg-surface border border-dashed border-border hover:border-brand/50 transition">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center"><Plus className="w-4 h-4" /></div>
              <div>
                <p className="font-semibold text-sm">Create or join a squad</p>
                <p className="text-xs text-muted-foreground">Team up to apply for bigger projects</p>
              </div>
            </div>
          </Link>
          {squads.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 text-sm">You're not in any squads yet</div>
          ) : (
            squads.map((s) => (
              <Link key={s.id} to="/squads/$squadId" params={{ squadId: s.id }} className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-brand/40 hover:shadow-sm transition">
                <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold">
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

      {tab === "skill_swaps" && isCreator && <ProfileSkillSwapsPanel />}

      {tab === "projects" && !isCreator && <ClientProjectsPanel userId={user?.id ?? ""} isSelf />}

      {tab === "saved" && <SavedPanel />}

      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); refresh(); }} initialRoles={roles} initialSkills={skills} />}
      {selectedPost && (
        <PostMediaViewer
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onDelete={(postId) => {
            setPosts((prev) => prev.filter((p) => p.id !== postId));
            setSelectedPost(null);
          }}
        />
      )}
      {videoIndex !== null && myVideos[videoIndex] && (
        <VideoViewer
          items={myVideos}
          startIndex={videoIndex}
          onClose={() => setVideoIndex(null)}
          onDelete={deleteVideo}
        />
      )}
      {storyOpen && activeStories.length > 0 && user && (
        <StoryViewer
          groups={[{ userId: user.id, username: profile.username, fullName: profile.full_name, avatarUrl: profile.avatar_url, stories: activeStories } satisfies StoryGroup]}
          viewerId={user.id}
          onClose={() => setStoryOpen(false)}
          onDeleteStory={(storyId) => {
            setActiveStories((prev) => prev.filter((s) => s.id !== storyId));
            if (activeStories.length <= 1) setStoryOpen(false);
          }}
        />
      )}
    </div>
  );
}

function EditProfileModal({ 
  onClose, onSaved, initialRoles, initialSkills 
}: { 
  onClose: () => void; onSaved: () => void;
  initialRoles: {id: string, name: string}[];
  initialSkills: {id: string, name: string}[];
}) {
  const { profile, user } = useAuth();
  const isClient = profile?.role === "client" || profile?.account_type === "client";
  
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    bio: profile?.bio ?? "",
    portfolio_url: profile?.portfolio_url ?? "",
    avatar_url: profile?.avatar_url ?? "",
    cover_url: (profile as any)?.cover_url ?? "",
    resume_url: (profile as any)?.resume_url ?? "",
  });
  
  const [roles, setRoles] = useState(initialRoles);
  const [skills, setSkills] = useState(initialSkills);
  const [roleInput, setRoleInput] = useState("");
  const [skillInput, setSkillInput] = useState("");
  
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<null | { field: string; pct: number }>(null);

  const handleAddRole = async () => {
    if (!roleInput.trim() || !user) return;
    const name = roleInput.trim();
    const { data: existing } = await supabase.from("professional_roles").select("id, name").ilike("name", name).limit(1).maybeSingle();
    if (existing) {
      if (!roles.find(r => r.id === existing.id)) setRoles([...roles, existing]);
    } else {
      const { data, error } = await supabase.from("professional_roles").insert({ name, role_type: isClient ? "client" : "creator", is_custom: true, created_by: user.id }).select("id, name").single();
      if (error) toast.error(error.message);
      else if (data) setRoles([...roles, data]);
    }
    setRoleInput("");
  };

  const handleAddSkill = async () => {
    if (!skillInput.trim() || !user) return;
    const name = skillInput.trim();
    const { data: existing } = await supabase.from("skills").select("id, name").ilike("name", name).limit(1).maybeSingle();
    if (existing) {
      if (!skills.find(s => s.id === existing.id)) setSkills([...skills, existing]);
    } else {
      const { data, error } = await supabase.from("skills").insert({ name, is_custom: true, created_by: user.id }).select("id, name").single();
      if (error) toast.error(error.message);
      else if (data) setSkills([...skills, data]);
    }
    setSkillInput("");
  };

  const pickAndUpload = async (
    field: "avatar_url" | "cover_url" | "resume_url",
    feature: "profileImage" | "coverImage" | "resume",
    file: File | null,
  ) => {
    if (!file || !user) return;
    try {
      setUploading({ field, pct: 0 });
      const prepared = feature === "resume" ? file : await optimizeImage(file);
      const { url } = await uploadFile({
        feature,
        file: prepared,
        userId: user.id,
        entityType: "profile",
        entityId: user.id,
        onProgress: (pct) => setUploading({ field, pct }),
      });
      setForm((f) => ({ ...f, [field]: url }));
      toast.success("Uploaded");
    } catch (err: any) {
      toast.error(err?.message ?? "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim() || null,
      bio: form.bio.trim() || null,
      portfolio_url: form.portfolio_url.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      cover_url: form.cover_url.trim() || null,
      resume_url: form.resume_url.trim() || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    
    try {
      if (isClient) {
        await supabase.from("client_roles").delete().eq("client_id", user.id);
        if (roles.length > 0) {
          await supabase.from("client_roles").insert(roles.map(r => ({ client_id: user.id, role_id: r.id })) as any);
        }
      } else {
        await supabase.from("creator_roles").delete().eq("creator_id", user.id);
        if (roles.length > 0) {
          await supabase.from("creator_roles").insert(roles.map(r => ({ creator_id: user.id, role_id: r.id })) as any);
        }
      }
      
      if (!isClient) {
        await supabase.from("creator_skills").delete().eq("creator_id", user.id);
        if (skills.length > 0) {
          await supabase.from("creator_skills").insert(skills.map(s => ({ creator_id: user.id, skill_id: s.id })));
        }
      }
      toast.success("Profile updated");
      onSaved();
    } catch (e: any) {
      toast.error(e.message || "Failed to update roles/skills");
    }
  };

  const uploadingField = uploading?.field;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Full name">
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
          </Field>
          <Field label="Bio">
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none" />
          </Field>
          <Field label="Portfolio URL">
            <input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://…" className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
          </Field>
          
          <Field label="Roles">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {roles.map(r => (
                <span key={r.id} className="inline-flex items-center gap-1 bg-surface border border-border px-2.5 py-1 rounded-md text-xs font-medium">
                  {r.name}
                  <button type="button" onClick={() => setRoles(roles.filter(x => x.id !== r.id))} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={roleInput} onChange={e => setRoleInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddRole(); } }} placeholder="Add a role..." className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
              <button type="button" onClick={handleAddRole} className="px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-muted/80 transition">Add</button>
            </div>
          </Field>
          
          {!isClient && (
            <Field label="Skills">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {skills.map(s => (
                  <span key={s.id} className="inline-flex items-center gap-1 bg-surface border border-border px-2.5 py-1 rounded-md text-xs font-medium">
                    {s.name}
                    <button type="button" onClick={() => setSkills(skills.filter(x => x.id !== s.id))} className="hover:text-destructive"><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddSkill(); } }} placeholder="Add a skill..." className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
                <button type="button" onClick={handleAddSkill} className="px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-semibold hover:bg-muted/80 transition">Add</button>
              </div>
            </Field>
          )}

          <Field label="Profile photo">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-muted overflow-hidden shrink-0">
                {form.avatar_url && <img src={form.avatar_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <input type="file" accept="image/*" onChange={(e) => pickAndUpload("avatar_url", "profileImage", e.target.files?.[0] ?? null)} className="flex-1 text-xs" />
            </div>
            {uploadingField === "avatar_url" && <p className="mt-1 text-xs text-muted-foreground">Uploading… {uploading?.pct}%</p>}
          </Field>

          <Field label="Cover photo">
            <div className="space-y-2">
              {form.cover_url && <img src={form.cover_url} alt="" className="h-24 w-full rounded-xl object-cover" />}
              <input type="file" accept="image/*" onChange={(e) => pickAndUpload("cover_url", "coverImage", e.target.files?.[0] ?? null)} className="w-full text-xs" />
            </div>
            {uploadingField === "cover_url" && <p className="mt-1 text-xs text-muted-foreground">Uploading… {uploading?.pct}%</p>}
          </Field>

          <Field label="Resume (private — PDF or Word)">
            <input type="file" accept=".pdf,.doc,.docx,application/pdf" onChange={(e) => pickAndUpload("resume_url", "resume", e.target.files?.[0] ?? null)} className="w-full text-xs" />
            {form.resume_url && <p className="mt-1 text-xs text-muted-foreground">Resume uploaded ✓ (visible only to you and recruiters you share it with)</p>}
            {uploadingField === "resume_url" && <p className="mt-1 text-xs text-muted-foreground">Uploading… {uploading?.pct}%</p>}
          </Field>

          <button disabled={busy || !!uploading} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value, to }: { label: string; value: number; to?: string }) {
  const inner = (
    <>
      <div className="text-xl font-semibold tracking-tight">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{label}</div>
    </>
  );
  if (to) return <Link to={to as any} className="text-center block hover:opacity-80 transition">{inner}</Link>;
  return <div className="text-center">{inner}</div>;
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
        active ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}

export function isVideoMedia(post: any) {
  if (!post?.media_url) return false;
  if (post.post_type === "video" || post.post_type === "reel") return true;
  return /\.(mp4|mov|webm|m3u8|avi)(\?.*)?$/i.test(post.media_url);
}

export function PostMediaViewer({ post, onClose, onDelete }: { post: any; onClose: () => void; onDelete?: (postId: string) => void }) {
  const isVideo = isVideoMedia(post);
  const { resolvedUrl } = useMediaUrl(isVideo ? "reel" : "post", post.media_url);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const isOwner = user?.id === post.author_id;

  const handleDelete = async () => {
    if (!isOwner || !onDelete || deleting) return;
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setDeleting(true);
    try {
      const { error: dbErr } = await supabase.from("posts").delete().eq("id", post.id).eq("author_id", user!.id);
      if (dbErr) {
        toast.error(`Could not delete post: ${dbErr.message}`);
        setDeleting(false);
        return;
      }
      // Storage cleanup — best effort
      try {
        await deleteMediaByUrl(post.media_url, post.thumbnail_url);
      } catch (storageErr: any) {
        toast.warning(`Post removed, but media file could not be cleaned up: ${storageErr?.message ?? "unknown"}`);
      }
      toast.success("Post deleted");
      onDelete(post.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/95 backdrop-blur-sm" onClick={onClose}>
      <div className="flex items-center justify-between p-4 text-white">
        <div>
          <p className="text-sm font-semibold">{post.caption || "Media"}</p>
          <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">{isVideo ? "Video" : "Image"}</p>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              disabled={deleting}
              className="rounded-full bg-red-500/20 hover:bg-red-500/40 px-3 py-2 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />{deleting ? "Deleting..." : "Delete"}
            </button>
          )}
          <button onClick={onClose} className="rounded-full bg-white/10 p-2 hover:bg-white/20"><X className="w-5 h-5" /></button>
        </div>
      </div>
      <div className="flex h-[calc(100vh-72px)] items-center justify-center px-4 py-2" onClick={(e) => e.stopPropagation()}>
        {isVideo ? (
          resolvedUrl ? <video src={resolvedUrl} controls autoPlay playsInline className="max-h-full max-w-full rounded-3xl" /> : <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
        ) : (
          resolvedUrl ? <img src={resolvedUrl} alt={post.caption || "Post media"} className="max-h-full max-w-full rounded-3xl object-contain" /> : <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
        )}
      </div>
    </div>
  );
}

/* ---------------------- Client projects panel ---------------------- */

type ClientJob = {
  id: string; title: string; description: string; category: string | null;
  location: string | null; budget: string | null; status: string; created_at: string;
};

type Applicant = {
  id: string; job_id: string; status: string; message: string | null;
  applicant_id: string | null; squad_id: string | null;
  applicant?: { username: string; full_name: string | null; avatar_url: string | null };
  squad?: { name: string; specialty: string | null };
};

export function ClientProjectsPanel({ userId, isSelf }: { userId: string; isSelf?: boolean }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ClientJob[]>([]);
  const [appsByJob, setAppsByJob] = useState<Record<string, Applicant[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      setLoading(true);
      const { data: js } = await supabase
        .from("jobs").select("*")
        .eq("client_id", userId)
        .order("created_at", { ascending: false });
      const jobList = (js ?? []) as ClientJob[];
      setJobs(jobList);

      if (jobList.length === 0) { setLoading(false); return; }

      const jobIds = jobList.map((j) => j.id);
      const { data: apps } = await supabase
        .from("job_applications").select("*")
        .in("job_id", jobIds);
      const appList = (apps ?? []) as Applicant[];

      const userIds = Array.from(new Set(appList.map((a) => a.applicant_id).filter(Boolean) as string[]));
      const squadIds = Array.from(new Set(appList.map((a) => a.squad_id).filter(Boolean) as string[]));

      let userMap = new Map<string, any>();
      let squadMap = new Map<string, any>();
      if (userIds.length) {
        const { data: us } = await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", userIds);
        userMap = new Map((us ?? []).map((u: any) => [u.id, u]));
      }
      if (squadIds.length) {
        const { data: sq } = await supabase.from("squads").select("id, name, specialty").in("id", squadIds);
        squadMap = new Map((sq ?? []).map((s: any) => [s.id, s]));
      }

      const grouped: Record<string, Applicant[]> = {};
      appList.forEach((a) => {
        if (a.applicant_id) a.applicant = userMap.get(a.applicant_id);
        if (a.squad_id) a.squad = squadMap.get(a.squad_id);
        (grouped[a.job_id] ||= []).push(a);
      });
      setAppsByJob(grouped);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="text-center text-muted-foreground py-16 text-sm">Loading projects…</div>;
  if (jobs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 text-sm">
        <Briefcase className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
        No projects posted yet. Post a brief from the Jobs tab.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {jobs.map((j) => {
        const apps = appsByJob[j.id] ?? [];
        return (
          <div key={j.id} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base">{j.title}</h3>
                <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">{j.description}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                  {j.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {j.location}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(j.created_at).toLocaleDateString()}</span>
                  {j.category && <span className="px-2 py-0.5 bg-muted rounded-full font-semibold text-foreground/70">{j.category}</span>}
                </div>
              </div>
              <div className="text-right">
                {j.budget && <div className="text-sm font-semibold text-brand">{j.budget}</div>}
                <span className={`mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  j.status === "open" ? "bg-brand-soft text-brand" : "bg-muted text-foreground/70"
                }`}>{j.status}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Working on this · {apps.length}
              </p>
              {apps.length === 0 ? (
                <p className="text-xs text-muted-foreground">No creators or squads have applied yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {apps.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                      {a.squad ? (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-brand text-primary-foreground flex items-center justify-center font-semibold text-xs">
                            {a.squad.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{a.squad.name} <span className="text-[10px] text-muted-foreground font-normal">· squad</span></p>
                            {a.squad.specialty && <p className="text-[11px] text-muted-foreground">{a.squad.specialty}</p>}
                          </div>
                        </>
                      ) : a.applicant ? (
                        <>
                          <Link to="/user/$username" params={{ username: a.applicant.username }} className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold">
                            {a.applicant.avatar_url
                              ? <ProfileAvatar url={a.applicant.avatar_url} className="w-full h-full object-cover" />
                              : a.applicant.username.slice(0, 1).toUpperCase()}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link to="/user/$username" params={{ username: a.applicant.username }} className="text-sm font-semibold truncate hover:text-brand">
                              @{a.applicant.username}
                            </Link>
                            {a.applicant.full_name && <p className="text-[11px] text-muted-foreground truncate">{a.applicant.full_name}</p>}
                          </div>
                        </>
                      ) : null}
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        a.status === "accepted" ? "bg-brand-soft text-brand" :
                        a.status === "rejected" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-foreground/70"
                      }`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------- Portfolio website builder ---------------------- */

type PortfolioItem = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  portfolio_url: string | null;
  technologies: string[] | null;
  thumbnail_url: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
  updated_at: string;
};

type Service = { title: string; description: string; price?: string };
type Testimonial = { name: string; role?: string; quote: string };

function isValidPortfolioUrl(value: string) {
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && !!url.hostname;
  } catch {
    return false;
  }
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function PortfolioPanel({ userId, isSelf }: { userId: string; isSelf?: boolean }) {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<PortfolioItem | null>(null);
  const [videoIndex, setVideoIndex] = useState<number | null>(null);

  const videos: VideoItem[] = items
    .filter((i) => i.media_type === "video" && i.media_url)
    .map((i) => ({ id: i.id, url: i.media_url as string, poster: i.thumbnail_url, title: i.title, canDelete: !!isSelf }));

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from("portfolios").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setItems(
      (data ?? []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        title: row.title,
        description: row.description,
        portfolio_url: row.project_link ?? row.website_url ?? null,
        technologies: row.tech ?? [],
        thumbnail_url: row.cover_url ?? (row.media_type === "video" ? null : row.media_url) ?? null,
        media_url: row.media_url ?? null,
        media_type: row.media_type ?? null,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
    );
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);

  const remove = async (item: PortfolioItem) => {
    if (!confirm("Delete Portfolio?")) return;
    const { error } = await supabase.from("portfolios").delete().eq("id", item.id).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    try {
      if (item.media_url) await deleteByUrl(item.media_url);
      if (item.thumbnail_url) await deleteByUrl(item.thumbnail_url);
    } catch (err: any) {
      toast.warning(`Removed, but the stored file could not be deleted: ${err?.message ?? "unknown error"}`);
    }
    toast.success("Portfolio removed");
    setVideoIndex(null);
    load();
  };

  const removeById = async (id: string) => {
    const target = items.find((i) => i.id === id);
    if (target) await remove(target);
  };

  return (
    <div className="mt-4 space-y-5">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-background to-surface/80 p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Portfolio</h2>
            <p className="mt-1 text-sm text-muted-foreground">Showcase your work for brands and clients.</p>
          </div>
          {isSelf && (
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              <Plus className="w-4 h-4" /> Add Portfolio URL
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl border border-border bg-surface" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-surface/70 p-12 text-center text-sm text-muted-foreground">
          <ImageIcon className="mx-auto mb-3 h-10 w-10" />
          {isSelf ? "Add your first portfolio project to start building your professional portfolio." : "No portfolio projects yet."}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <ProfilePortfolioTile
              key={item.id}
              item={item}
              setVideoIndex={setVideoIndex}
              videos={videos}
              isSelf={isSelf}
              onEdit={setEditing}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      {videoIndex !== null && videos[videoIndex] && (
        <VideoViewer
          items={videos}
          startIndex={videoIndex}
          onClose={() => setVideoIndex(null)}
          onDelete={(v) => removeById(v.id)}
        />
      )}
      {showAdd && <PortfolioModal userId={userId} onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load(); }} />}
      {editing && <PortfolioModal item={editing} userId={userId} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />}
    </div>
  );
}

function PortfolioModal({ item, userId, onClose, onSaved }: { item?: PortfolioItem; userId: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [portfolioUrl, setPortfolioUrl] = useState(item?.portfolio_url ?? "");
  const [technologies, setTechnologies] = useState((item?.technologies ?? []).join(", "));
  const [thumbnailUrl, setThumbnailUrl] = useState(item?.thumbnail_url ?? "");
  const [busy, setBusy] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [videoUrl, setVideoUrl] = useState(item?.media_type === "video" ? item?.media_url ?? "" : "");

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || uploadingThumbnail) return; // guards duplicate uploads
    setUploadingThumbnail(true);
    setUploadPct(0);
    try {
      if (file.type.startsWith("video/")) {
        const res = await uploadVideo({ feature: "portfolioVideo", file, userId, entityType: "portfolio", onProgress: setUploadPct });
        setVideoUrl(res.path);
        if (res.thumbnailPath) setThumbnailUrl(res.thumbnailPath);
        toast.success("Video uploaded");
      } else {
        const prepared = await optimizeImage(file);
        const { path } = await uploadFile({ feature: "portfolioImage", file: prepared, userId, onProgress: setUploadPct });
        setThumbnailUrl(path);
        setVideoUrl("");
        toast.success("Thumbnail uploaded");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Unable to upload file");
    } finally {
      setUploadingThumbnail(false);
      setUploadPct(0);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    const trimmedUrl = portfolioUrl.trim();
    if (!trimmedTitle) { toast.error("Portfolio title is required"); return; }
    if (!trimmedUrl) { toast.error("Portfolio URL is required"); return; }
    if (!isValidPortfolioUrl(trimmedUrl)) { toast.error("Please enter a valid URL."); return; }

    setBusy(true);
    const techList = technologies.split(",").map((x) => x.trim()).filter(Boolean);
    const { data: existing } = await supabase.from("portfolios").select("id").eq("user_id", userId).eq("project_link", trimmedUrl).maybeSingle();
    if (existing && existing.id !== item?.id) {
      setBusy(false);
      toast.error("A portfolio with this URL already exists for this profile.");
      return;
    }

    const payload = {
      user_id: userId,
      title: trimmedTitle,
      description: description.trim() || null,
      project_link: trimmedUrl,
      tech: techList,
      cover_url: thumbnailUrl || null,
      media_url: videoUrl || thumbnailUrl || null,
      media_type: videoUrl ? "video" : "image",
      updated_at: new Date().toISOString(),
    };

    const { error } = item
      ? await supabase.from("portfolios").update(payload).eq("id", item.id)
      : await supabase.from("portfolios").insert(payload);

    setBusy(false);
    if (error) {
      if (!item) {
        if (videoUrl) {
          await deleteFile("portfolioVideo", videoUrl).catch(() => undefined);
        }
        if (thumbnailUrl) {
          const isVid = videoUrl;
          await deleteFile(isVid ? "thumbnail" : "portfolioImage", thumbnailUrl).catch(() => undefined);
        }
      }
      toast.error(error.message);
      return;
    }
    toast.success(item ? "Portfolio updated" : "Portfolio saved");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-t-[24px] border border-border bg-background p-6 shadow-2xl sm:rounded-[24px]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{item ? "Edit portfolio" : "Add portfolio URL"}</h2>
            <p className="text-sm text-muted-foreground">Share a polished project link with a thumbnail and description.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={save} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Portfolio Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm" placeholder="Restaurant Website" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Portfolio URL *</label>
            <input value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)} className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm" placeholder="https://github.com/username/project" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full resize-none rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm" placeholder="Describe the project and the impact." />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Technology Used</label>
            <input value={technologies} onChange={(e) => setTechnologies(e.target.value)} className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-sm" placeholder="React, Supabase, Tailwind" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Thumbnail Image (optional)</label>
            <input type="file" accept="image/*,video/*" onChange={handleUpload} disabled={uploadingThumbnail} className="w-full rounded-2xl border border-dashed border-border bg-surface px-3 py-2.5 text-sm" />
            {uploadingThumbnail && <p className="mt-1 text-xs text-muted-foreground">Uploading… {uploadPct}%</p>}
            {uploadingThumbnail && <p className="mt-2 text-xs text-muted-foreground">Uploading thumbnail…</p>}
            {thumbnailUrl && <img src={thumbnailUrl} className="mt-3 h-32 w-full rounded-2xl object-cover" alt="Portfolio thumbnail" />}
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-border px-3 py-2.5 text-sm font-semibold text-foreground/80">Cancel</button>
            <button type="submit" disabled={busy || uploadingThumbnail} className="flex-1 rounded-2xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60">
              {busy ? "Saving…" : item ? "Save changes" : "Save Portfolio"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function SavedPanel() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"posts" | "portfolio">("posts");

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: saves } = await supabase.from("post_saves").select("post_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false });
      const ids = (saves ?? []).map((s: any) => s.post_id);
      if (ids.length) {
        const { data: ps } = await supabase.from("posts").select("*").in("id", ids);
        setPosts(ps ?? []);
      } else setPosts([]);
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="mt-4">
      <div className="mb-3 flex gap-2">
        {(["posts", "portfolio"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
            filter === f ? "bg-brand text-white" : "bg-surface border border-border text-muted-foreground hover:text-foreground"
          }`}>{f}</button>
        ))}
      </div>
      {loading ? (
        <div className="text-center text-muted-foreground py-12 text-sm">Loading…</div>
      ) : filter === "portfolio" ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          <Bookmark className="mx-auto mb-2 h-10 w-10" />
          Saved portfolios will appear here
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-sm text-muted-foreground">
          <Bookmark className="mx-auto mb-2 h-10 w-10" />
          Nothing saved yet
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p) => (
            <ProfileSavedTile key={p.id} post={p} isVideoMedia={isVideoMedia} />
          ))}
        </div>
      )}
    </div>
  );
}

// Customize portfolio modal removed in favor of the new portfolio card workflow.

function ProfilePostTile({ post, isVideoMedia, setVideoIndex, myVideos, setSelectedPost }: { post: any, isVideoMedia: any, setVideoIndex: any, myVideos: any[], setSelectedPost: any }) {
  const isVid = isVideoMedia(post);
  const { resolvedUrl } = useMediaUrl(isVid ? "reel" : "post", post.media_url);

  return (
    <button onClick={() => (isVid ? setVideoIndex(myVideos.findIndex((v) => v.id === post.id)) : setSelectedPost(post))} className="group relative overflow-hidden rounded-3xl border border-border bg-surface text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="aspect-[4/5] bg-muted">
        {post.media_url ? (
          isVid ? (
            <VideoPlayer src={post.media_url} poster={post.thumbnail_url} controls={false} className="h-full w-full" feature="reel" />
          ) : (
            resolvedUrl ? <img src={resolvedUrl} className="h-full w-full object-cover" alt={post.caption || "Post media"} /> : <div className="w-full h-full bg-muted animate-pulse" />
          )
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">{post.caption || "Media preview"}</div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-3 py-3 text-white">
        <span className="text-xs font-semibold uppercase tracking-[0.2em]">{isVid ? "Video" : "Image"}</span>
        <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] backdrop-blur">Open</span>
      </div>
    </button>
  );
}

function SelectedPostModalInner({ post, isVideoMedia }: { post: any, isVideoMedia: any }) {
  const isVid = isVideoMedia(post);
  const { resolvedUrl } = useMediaUrl(isVid ? "reel" : "post", post.media_url);

  if (!post.media_url) {
    return <div className="bg-surface border border-border p-6 rounded-3xl text-sm max-w-md">{post.caption}</div>;
  }

  if (isVid) {
    return (
      resolvedUrl ? (
        <video src={resolvedUrl} controls autoPlay playsInline className="max-h-full max-w-full rounded-3xl" />
      ) : (
        <div className="w-96 h-96 flex items-center justify-center bg-black rounded-3xl">
          <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
        </div>
      )
    );
  }

  return (
    resolvedUrl ? (
      <img src={resolvedUrl} alt={post.caption || "Post media"} className="max-h-full max-w-full rounded-3xl object-contain" />
    ) : (
      <div className="w-96 h-96 flex items-center justify-center bg-black rounded-3xl">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    )
  );
}

export function ProfilePortfolioTile({ item, setVideoIndex, videos, isSelf, onEdit, onDelete }: { item: any, setVideoIndex: any, videos: any[], isSelf: boolean | undefined, onEdit: any, onDelete: any }) {
  const isVid = item.media_type === "video" && item.media_url;
  const { resolvedUrl: resolvedThumbUrl } = useMediaUrl(isVid ? "thumbnail" : "portfolioImage", item.thumbnail_url);

  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border bg-surface/80 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <button
        onClick={() =>
          isVid
            ? setVideoIndex(videos.findIndex((v) => v.id === item.id))
            : item.portfolio_url && window.open(item.portfolio_url, "_blank", "noopener,noreferrer")
        }
        className="block w-full text-left"
      >
        <div className="relative h-40 overflow-hidden bg-muted">
          {isVid ? (
            <VideoPlayer src={item.media_url} poster={item.thumbnail_url} controls={false} className="h-full w-full" feature="portfolioVideo" />
          ) : resolvedThumbUrl ? (
            <img src={resolvedThumbUrl} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" alt={item.title} />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand/15 to-primary/10 p-4 text-center text-sm font-semibold text-foreground/70">
              {item.title}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-base font-semibold tracking-tight">{item.title}</h3>
            {item.portfolio_url && <span className="rounded-full bg-brand-soft px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-brand">Live</span>}
          </div>
          <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{item.description || "A polished portfolio entry with a live link and project summary."}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            {item.portfolio_url ? getDomain(item.portfolio_url) : "Portfolio link"}
          </div>
          {item.technologies && item.technologies.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {item.technologies.slice(0, 3).map((tech: string) => (
                <span key={tech} className="rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground/70">{tech}</span>
              ))}
            </div>
          )}
        </div>
      </button>
      {isSelf && (
        <div className="flex items-center gap-2 border-t border-border px-4 py-3">
          <button onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="flex-1 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground/80 transition hover:bg-muted">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(item); }} className="flex-1 rounded-xl bg-destructive/10 px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/20">Delete</button>
        </div>
      )}
    </div>
  );
}



function ProfileSavedTile({ post, isVideoMedia }: { post: any, isVideoMedia: any }) {
  const isVid = isVideoMedia(post);
  const { resolvedUrl } = useMediaUrl(isVid ? "reel" : "post", post.media_url);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-surface">
      <div className="aspect-[4/5] bg-muted">
        {post.media_url ? (
          isVid ? (
            <VideoPlayer src={post.media_url} poster={post.thumbnail_url} controls={false} className="h-full w-full" feature="reel" />
          ) : (
            resolvedUrl ? <img src={resolvedUrl} className="h-full w-full object-cover" alt={post.caption || "Saved media"} /> : <div className="w-full h-full bg-muted animate-pulse" />
          )
        ) : (
          <div className="flex h-full items-center justify-center p-4 text-center text-sm text-muted-foreground">{post.caption || "Saved media"}</div>
        )}
      </div>
    </div>
  );
}

