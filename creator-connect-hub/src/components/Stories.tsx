import { useEffect, useRef, useState } from "react";
import { Camera, FileUp, Image as ImageIcon, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { removeStoryMedia, STORIES_BUCKET, uploadStoryMedia, validateStoryFile } from "@/lib/uploadMedia";
import { openOrCreateConversation } from "@/lib/messaging";
import { useNavigate } from "@tanstack/react-router";

export type StoryProfile = { id: string; username: string; full_name: string | null; avatar_url: string | null };
export type Story = { id: string; user_id: string; media_url: string; bucket_name: string; media_type: "image" | "video"; caption: string | null; created_at: string; expires_at: string; view_count: number; reply_count: number; is_highlight: boolean };
export type StoryGroup = { profile: StoryProfile; stories: Story[]; viewed: boolean };
const db = supabase as any;

export function StoryAvatar({ profile, active, viewed, onClick, add }: { profile: Pick<StoryProfile, "username" | "avatar_url">; active?: boolean; viewed?: boolean; onClick?: () => void; add?: boolean }) {
  const initial = profile.username?.slice(0, 1).toUpperCase() || "?";
  return <button type="button" onClick={onClick} className="relative shrink-0 rounded-full p-[2px] text-left disabled:cursor-default" disabled={!onClick} aria-label={add ? "Add story" : `View ${profile.username}'s story`}>
    <span className={`block h-15 w-15 rounded-full p-[2px] ${active ? "bg-gradient-to-tr from-fuchsia-600 via-orange-500 to-amber-400" : viewed ? "bg-muted-foreground/50" : "bg-border"}`}>
      <span className="block h-full w-full rounded-full bg-surface p-[2px]">
        {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full rounded-full object-cover" /> : <span className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-bold">{initial}</span>}
      </span>
    </span>
    {add && <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-brand text-xs font-bold text-white">+</span>}
  </button>;
}

export function StoryStrip({ onCompose }: { onCompose: () => void }) {
  const { user, profile } = useAuth();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [viewer, setViewer] = useState<number | null>(null);
  useEffect(() => {
    if (!user) return;
    let alive = true;
    const load = async () => {
      const { data: stories } = await db.from("stories").select("*").gt("expires_at", new Date().toISOString()).is("deleted_at", null).order("created_at", { ascending: true });
      if (!alive) return;
      // Visibility (public, followers-only, and blocked users) is enforced by
      // the Stories RLS policy. Do not infer it from Posts or client filters.
      const visible = (stories ?? []) as Story[];
      const ids = [...new Set(visible.map((s: Story) => s.user_id))];
      const [{ data: profiles }, { data: seen }] = await Promise.all([
        ids.length ? db.from("profiles").select("id, username, full_name, avatar_url").in("id", ids) : Promise.resolve({ data: [] }),
        visible.length ? db.from("story_views").select("story_id").eq("viewer_id", user.id).in("story_id", visible.map((s: Story) => s.id)) : Promise.resolve({ data: [] }),
      ]);
      const profileMap = new Map((profiles ?? []).map((p: StoryProfile) => [p.id, p])); const viewed = new Set((seen ?? []).map((v: any) => v.story_id));
      const map = new Map<string, StoryGroup>();
      visible.forEach((story: Story) => { const p = profileMap.get(story.user_id); if (!p) return; const g = map.get(story.user_id) ?? { profile: p, stories: [], viewed: true }; g.stories.push(story); g.viewed &&= viewed.has(story.id); map.set(story.user_id, g); });
      setGroups([...map.values()].sort((a, b) => Number(b.profile.id === user.id) - Number(a.profile.id === user.id)));
    };
    void load();
    const channel = db.channel(`stories-strip-${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "stories" }, load).subscribe();
    return () => { alive = false; db.removeChannel(channel); };
  }, [user]);
  if (!profile) return null;
  return <><div className="flex gap-4 overflow-x-auto pb-1">
    <div className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-center"><StoryAvatar profile={profile} add active={groups.some((g) => g.profile.id === user?.id)} onClick={() => groups.findIndex((g) => g.profile.id === user?.id) >= 0 ? setViewer(groups.findIndex((g) => g.profile.id === user?.id)) : onCompose()} /><span className="max-w-20 truncate text-[11px] font-medium">Your story</span></div>
    {groups.filter((g) => g.profile.id !== user?.id).map((g, i) => <div key={g.profile.id} className="flex w-20 shrink-0 flex-col items-center gap-1.5 text-center"><StoryAvatar profile={g.profile} active={!g.viewed} viewed={g.viewed} onClick={() => setViewer(groups.indexOf(g))} /><span className="max-w-20 truncate text-[11px] font-medium">{g.profile.full_name || g.profile.username}</span></div>)}
  </div>{viewer !== null && <StoryViewer groups={groups} startGroup={viewer} onClose={() => setViewer(null)} />}</>;
}

/** Profile header entry point: opens the owner's currently active stories. */
export function ProfileStoryButton({ profile, className, onAdd }: { profile: StoryProfile; className?: string; onAdd?: () => void }) {
  const { user } = useAuth(); const [group, setGroup] = useState<StoryGroup | null>(null); const [open, setOpen] = useState(false);
  useEffect(() => { let alive = true; (async () => { const { data } = await db.from("stories").select("*").eq("user_id", profile.id).gt("expires_at", new Date().toISOString()).is("deleted_at", null).order("created_at"); if (!alive) return; const stories = (data ?? []) as Story[]; if (!stories.length) return setGroup(null); const { data: views } = user ? await db.from("story_views").select("story_id").eq("viewer_id", user.id).in("story_id", stories.map(s => s.id)) : { data: [] }; setGroup({ profile, stories, viewed: stories.every(s => (views ?? []).some((v: any) => v.story_id === s.id)) }); })(); return () => { alive = false; }; }, [profile.id, user?.id]);
  const self = user?.id === profile.id;
  return <>{<span className={className}><StoryAvatar profile={profile} active={!!group && !group.viewed} viewed={group?.viewed} add={self && !group} onClick={() => group ? setOpen(true) : self ? onAdd?.() : undefined} /></span>}{open && group && <StoryViewer groups={[group]} startGroup={0} onClose={() => setOpen(false)} />}</>;
}

export function StoryComposer({ onClose, onShared }: { onClose: () => void; onShared?: () => void }) {
  const { user } = useAuth(); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(""); const [caption, setCaption] = useState(""); const [busy, setBusy] = useState(false);
  const gallery = useRef<HTMLInputElement>(null); const camera = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);
  const choose = (f?: File) => { if (!f) return; try { validateStoryFile(f); } catch (error: any) { toast.error(error.message); return; } if (preview) URL.revokeObjectURL(preview); setFile(f); setPreview(URL.createObjectURL(f)); };
  const share = async () => { if (!user || !file) return toast.error("You must be signed in to upload a story."); setBusy(true); let upload: Awaited<ReturnType<typeof uploadStoryMedia>> | null = null; try { upload = await uploadStoryMedia(file, user.id); const { data, error } = await db.from("stories").insert({ user_id: user.id, created_by: user.id, media_url: upload.mediaUrl, bucket_name: STORIES_BUCKET, media_type: upload.mediaType, caption: caption.trim() || null }).select("id").single(); if (error || !data) { console.error("[Stories] Story database insert failed", error); await removeStoryMedia(upload.path); throw new Error("Unable to save your story. Please try again."); } toast.success("Story shared"); onShared?.(); onClose(); } catch (e: any) { console.error("[Stories] Story upload failed", e); toast.error(e.message || "Unable to upload your story. Please try again."); } finally { setBusy(false); } };
  return <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}><div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-t-3xl bg-background p-5 shadow-2xl sm:rounded-3xl">
    <div className="mb-4 flex items-center justify-between"><div><h2 className="text-lg font-bold">Add to your story</h2><p className="text-sm text-muted-foreground">Visible for 24 hours</p></div><button onClick={onClose} className="rounded-full p-2 hover:bg-muted"><X className="h-5 w-5" /></button></div>
    {!file ? <div className="grid grid-cols-3 gap-3"><button onClick={() => gallery.current?.click()} className="rounded-2xl border border-border p-5 text-center hover:bg-muted"><ImageIcon className="mx-auto mb-2 h-6 w-6 text-brand" /><span className="text-sm font-semibold">Gallery</span></button><button onClick={() => gallery.current?.click()} className="rounded-2xl border border-border p-5 text-center hover:bg-muted"><FileUp className="mx-auto mb-2 h-6 w-6 text-brand" /><span className="text-sm font-semibold">Files</span></button><button onClick={() => camera.current?.click()} className="rounded-2xl border border-border p-5 text-center hover:bg-muted"><Camera className="mx-auto mb-2 h-6 w-6 text-brand" /><span className="text-sm font-semibold">Camera</span></button></div> : <><div className="relative aspect-[9/14] max-h-[52vh] overflow-hidden rounded-2xl bg-black">{file.type.startsWith("video/") ? <video src={preview} controls className="h-full w-full object-contain" /> : <img src={preview} alt="Story preview" className="h-full w-full object-contain" />}<button onClick={() => { setFile(null); setPreview(""); }} className="absolute right-2 top-2 rounded-full bg-black/60 p-2 text-white"><X className="h-4 w-4" /></button></div><textarea value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={500} placeholder="Add a caption…" className="mt-3 w-full resize-none rounded-2xl border border-border bg-surface p-3 text-sm" rows={2} /><button disabled={busy} onClick={share} className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-60"><Send className="h-4 w-4" />{busy ? "Sharing…" : "Share story"}</button></>}
    <input ref={gallery} type="file" accept="image/*,video/mp4,video/quicktime" className="hidden" onChange={(e) => choose(e.target.files?.[0])} /><input ref={camera} type="file" accept="image/*,video/*" capture="environment" className="hidden" onChange={(e) => choose(e.target.files?.[0])} />
  </div></div>;
}

export function StoryViewer({ groups, startGroup, onClose }: { groups: StoryGroup[]; startGroup: number; onClose: () => void }) {
  const { user } = useAuth(); const navigate = useNavigate(); const [groupIndex, setGroupIndex] = useState(startGroup); const [storyIndex, setStoryIndex] = useState(0); const [paused, setPaused] = useState(false); const [progress, setProgress] = useState(0); const video = useRef<HTMLVideoElement>(null); const started = useRef(0);
  const group = groups[groupIndex]; const story = group?.stories[storyIndex];
  const next = () => { if (storyIndex < group.stories.length - 1) { setStoryIndex((x) => x + 1); return; } if (groupIndex < groups.length - 1) { setGroupIndex((x) => x + 1); setStoryIndex(0); return; } onClose(); };
  const prev = () => { if (storyIndex > 0) setStoryIndex((x) => x - 1); else if (groupIndex > 0) { setGroupIndex((x) => x - 1); setStoryIndex(groups[groupIndex - 1].stories.length - 1); } };
  useEffect(() => { if (!story || !user) return; setProgress(0); started.current = Date.now(); if (story.user_id !== user.id) void db.from("story_views").upsert({ story_id: story.id, viewer_id: user.id }, { onConflict: "story_id,viewer_id", ignoreDuplicates: true }); }, [story?.id, user]);
  useEffect(() => { if (!story || story.media_type === "video" || paused) return; const timer = window.setInterval(() => { const p = Math.min(100, ((Date.now() - started.current) / 5000) * 100); setProgress(p); if (p >= 100) next(); }, 60); return () => clearInterval(timer); }, [story?.id, paused]);
  if (!story) return null;
  const reply = async () => { if (!user || story.user_id === user.id) return; try { const id = await openOrCreateConversation(story.user_id); onClose(); navigate({ to: "/messages", search: { c: id } }); } catch { toast.error("Could not open messages"); } };
  const remove = async () => { if (!confirm("Delete this story?")) return; const { error } = await db.from("stories").update({ deleted_at: new Date().toISOString() }).eq("id", story.id); if (error) return toast.error(error.message); toast.success("Story deleted"); onClose(); };
  const elapsed = Math.max(0, Date.now() - new Date(story.created_at).getTime()); const time = elapsed < 3600000 ? `${Math.max(1, Math.floor(elapsed / 60000))}m` : `${Math.floor(elapsed / 3600000)}h`;
  return <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black" onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)}><div className="relative h-full w-full max-w-md overflow-hidden bg-zinc-950" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); e.clientX - r.left < r.width / 3 ? prev() : next(); }}>
    <div className="absolute inset-x-3 top-3 z-10 flex gap-1">{group.stories.map((s, i) => <span key={s.id} className="h-1 flex-1 overflow-hidden rounded bg-white/35"><span className="block h-full bg-white" style={{ width: i < storyIndex ? "100%" : i === storyIndex ? `${progress}%` : "0%" }} /></span>)}</div>
    <div className="absolute inset-x-4 top-7 z-10 flex items-center gap-2 text-white"><StoryAvatar profile={group.profile} active /><span className="text-sm font-bold">{group.profile.username}</span><span className="text-xs text-white/70">{time}</span><button className="ml-auto p-2" onClick={(e) => { e.stopPropagation(); onClose(); }}><X /></button></div>
    {story.media_type === "video" ? <video ref={video} src={story.media_url} autoPlay={!paused} playsInline onTimeUpdate={(e) => setProgress((e.currentTarget.currentTime / (e.currentTarget.duration || 1)) * 100)} onEnded={next} className="h-full w-full object-contain" /> : <img src={story.media_url} alt="Story" className="h-full w-full object-contain" />}
    {story.caption && <p className="absolute inset-x-5 bottom-20 z-10 rounded-xl bg-black/35 p-3 text-sm text-white backdrop-blur">{story.caption}</p>}
    <div className="absolute inset-x-4 bottom-5 z-10 flex items-center gap-2">{story.user_id === user?.id && <span className="rounded-full bg-black/35 px-3 py-2 text-xs text-white">{story.view_count || 0} views</span>}{story.user_id === user?.id ? <button onClick={(e) => { e.stopPropagation(); void remove(); }} className="ml-auto rounded-full bg-white/15 p-3 text-white"><Trash2 className="h-5 w-5" /></button> : <button onClick={(e) => { e.stopPropagation(); void reply(); }} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 py-3 text-sm font-bold text-black"><Send className="h-4 w-4" />Reply</button>}</div>
  </div></div>;
}
