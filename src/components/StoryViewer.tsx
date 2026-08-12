import { useEffect, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import { deleteByUrl } from "@/lib/storage";
import { toast } from "sonner";

export type Story = {
  id: string;
  user_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string | null;
  expires_at: string | null;
  thumbnail_url?: string | null;
};

export type StoryGroup = {
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl: string | null;
  stories: Story[];
};

const IMAGE_MS = 5000;

function timeAgo(iso: string | null) {
  if (!iso) return "";
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 3600) return `${Math.max(1, Math.floor(d / 60))}m`;
  return `${Math.floor(d / 3600)}h`;
}

/** Fullscreen, auto-advancing story player across multiple users. */
export function StoryViewer({
  groups,
  startIndex = 0,
  viewerId,
  onClose,
  onDeleteStory,
}: {
  groups: StoryGroup[];
  startIndex?: number;
  viewerId?: string;
  onClose: () => void;
  /** Called after a story is deleted; pass to enable delete button for owner */
  onDeleteStory?: (storyId: string) => void;
}) {
  const [gi, setGi] = useState(startIndex);
  const [si, setSi] = useState(0);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const timer = useRef<number | null>(null);

  const group = groups[gi];
  const story = group?.stories[si];

  const { resolvedUrl: resolvedMediaUrl } = useMediaUrl("story", story?.media_url);
  const { resolvedUrl: resolvedPosterUrl } = useMediaUrl("thumbnail", story?.thumbnail_url);

  const isOwner = viewerId && story && viewerId === story.user_id;

  const next = () => {
    setProgress(0);
    if (!group) return onClose();
    if (si + 1 < group.stories.length) return setSi(si + 1);
    if (gi + 1 < groups.length) {
      setGi(gi + 1);
      setSi(0);
      return;
    }
    onClose();
  };

  const prev = () => {
    setProgress(0);
    if (si > 0) return setSi(si - 1);
    if (gi > 0) {
      const g = groups[gi - 1];
      setGi(gi - 1);
      setSi(Math.max(0, g.stories.length - 1));
    }
  };

  const handleDeleteStory = async () => {
    if (!story || !isOwner || deleting) return;
    if (!confirm("Delete this story? This cannot be undone.")) return;
    setDeleting(true);
    try {
      // 1. Delete DB record first
      const { error: dbErr } = await supabase.from("stories").delete().eq("id", story.id).eq("user_id", viewerId!);
      if (dbErr) {
        toast.error(`Could not delete story: ${dbErr.message}`);
        setDeleting(false);
        return;
      }
      // 2. Delete storage objects (best-effort; don't fail if already gone)
      try {
        if (story.media_url) await deleteByUrl(story.media_url);
      } catch (storageErr: any) {
        toast.warning(`Story removed from your profile, but the media file could not be cleaned up: ${storageErr?.message ?? "unknown error"}`);
      }
      toast.success("Story deleted");
      onDeleteStory?.(story.id);
      // Advance to next or close if no more stories
      const remaining = group.stories.filter((s) => s.id !== story.id);
      if (remaining.length === 0) {
        onClose();
      } else {
        setSi(Math.min(si, remaining.length - 1));
      }
    } finally {
      setDeleting(false);
    }
  };

  // Auto-advance images; videos advance on `ended`.
  useEffect(() => {
    if (!story) return;
    if (story.media_type === "video") return;
    const started = Date.now();
    timer.current = window.setInterval(() => {
      const pct = ((Date.now() - started) / IMAGE_MS) * 100;
      if (pct >= 100) next();
      else setProgress(pct);
    }, 50);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id]);

  // Record a view once per story.
  useEffect(() => {
    if (!story || !viewerId || viewerId === story.user_id) return;
    void supabase
      .from("story_views")
      .insert({ story_id: story.id, viewer_id: viewerId })
      .then(({ error }) => {
        if (error && error.code !== "23505") console.error("Story view recording failed:", error);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story?.id, viewerId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!group || !story) return null;

  return (
    <div className="fixed inset-0 z-[90] bg-black flex items-center justify-center">
      <div className="relative w-full h-full sm:max-w-[440px] sm:h-[92vh] sm:rounded-2xl overflow-hidden bg-black">
        {/* segment progress */}
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden">
              <div
                className="h-full bg-white transition-[width] duration-75"
                style={{ width: i < si ? "100%" : i === si ? `${progress}%` : "0%" }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-7 left-3 right-3 z-20 flex items-center gap-2.5 pt-1">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center text-white text-xs font-bold">
            {group.avatarUrl ? (
              <img src={group.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              group.username.slice(0, 1).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate">{group.fullName || group.username}</p>
            <p className="text-white/60 text-[11px]">{timeAgo(story.created_at)}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {isOwner && onDeleteStory && (
              <button
                onClick={handleDeleteStory}
                disabled={deleting}
                className="p-1.5 rounded-full text-white hover:bg-red-500/70 transition disabled:opacity-50"
                aria-label="Delete story"
                title="Delete this story"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-full text-white hover:bg-white/15" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {story.media_type === "video" ? (
          resolvedMediaUrl ? (
            <video
              key={story.id}
              src={resolvedMediaUrl}
              poster={resolvedPosterUrl ?? undefined}
              className="w-full h-full object-contain"
              autoPlay
              muted
              preload="auto"
              playsInline
              controls={false}
              onTimeUpdate={(e) => {
                const v = e.currentTarget;
                if (v.duration) setProgress((v.currentTime / v.duration) * 100);
              }}
              onEnded={next}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <span className="text-white/50 text-sm animate-pulse">Loading video...</span>
            </div>
          )
        ) : (
          resolvedMediaUrl ? (
            <img key={story.id} src={resolvedMediaUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-black">
              <span className="text-white/50 text-sm animate-pulse">Loading image...</span>
            </div>
          )
        )}

        {story.caption && (
          <p className="absolute bottom-16 left-4 right-4 z-20 text-white text-sm bg-black/40 backdrop-blur-sm rounded-xl px-3 py-2">
            {story.caption}
          </p>
        )}

        {/* tap zones */}
        <button onClick={prev} className="absolute inset-y-0 left-0 w-1/3 z-10" aria-label="Previous" />
        <button onClick={next} className="absolute inset-y-0 right-0 w-2/3 z-10" aria-label="Next" />

        <button onClick={prev} className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={next} className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
