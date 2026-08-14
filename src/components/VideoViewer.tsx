import { useCallback, useEffect, useRef, useState } from "react";
import { X, ChevronUp, ChevronDown, Volume2, VolumeX, Play, Pause, Loader2, AlertTriangle, Trash2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import { useViewTracking } from "@/hooks/useViewTracking";
import { ShareVideoDialog } from "./ShareVideoDialog";

export type VideoItem = {
  id: string;
  url: string;
  poster?: string | null;
  title?: string | null;
  authorName?: string | null;
  /** true when the signed-in user owns this video */
  canDelete?: boolean;
};

/**
 * Fullscreen Reels-style player used by Profile, Portfolio, Projects and Posts.
 * Only ONE <video> element exists, so switching always stops the previous clip.
 */
export function VideoViewer({
  items,
  startIndex = 0,
  onClose,
  onDelete,
}: {
  items: VideoItem[];
  startIndex?: number;
  onClose: () => void;
  onDelete?: (item: VideoItem) => void | Promise<void>;
}) {
  const [index, setIndex] = useState(startIndex);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shareOpen, setShareOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchY = useRef<number | null>(null);

  const item = items[index];

  const { resolvedUrl: resolvedVideoUrl, loading: videoLoading, error: videoError } = useMediaUrl("post", item?.url);
  const { resolvedUrl: resolvedPosterUrl } = useMediaUrl("thumbnail", item?.poster);

  const isFailed = failed || !!videoError;
  const isLoading = loading || videoLoading;

  // Track video view
  useViewTracking(item?.id, playing && !isLoading && !isFailed);

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => {
        const nextIndex = i + delta;
        if (nextIndex < 0 || nextIndex >= items.length) return i;
        return nextIndex;
      });
    },
    [items.length],
  );

  // reset per-clip state; the single <video> element guarantees the previous stops.
  useEffect(() => {
    setLoading(true);
    setFailed(false);
    setProgress(0);
    setPlaying(false);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown" || e.key === "ArrowRight") go(1);
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") go(-1);
      if (e.key === " ") {
        e.preventDefault();
        togglePlay();
      }
      if (e.key.toLowerCase() === "m") setMuted((m) => !m);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      const p = v.play();
      if (p !== undefined) {
        p.then(() => setPlaying(true)).catch(() => setPlaying(false));
      }
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const shareVideo = () => setShareOpen(true);

  if (!item) return null;

  return (
    <div
      className="fixed inset-0 z-[95] bg-black flex items-center justify-center"
      onTouchStart={(e) => (touchY.current = e.touches[0]?.clientY ?? null)}
      onTouchEnd={(e) => {
        const start = touchY.current;
        const end = e.changedTouches[0]?.clientY ?? null;
        touchY.current = null;
        if (start == null || end == null) return;
        if (start - end > 60) go(1);
        if (end - start > 60) go(-1);
      }}
    >
      <div className="relative w-full h-full sm:max-w-[460px] sm:h-[94vh] sm:rounded-2xl overflow-hidden bg-black">
        <div className="absolute top-0 left-0 right-0 z-20 h-1 bg-white/20">
          <div className="h-full bg-white transition-[width] duration-150" style={{ width: `${progress}%` }} />
        </div>

        {resolvedVideoUrl && (
          <video
            key={item.id}
            ref={videoRef}
            src={resolvedVideoUrl}
            poster={resolvedPosterUrl ?? undefined}
            className="w-full h-full object-contain"
            autoPlay
            muted={muted}
            playsInline
            preload="metadata"
            onClick={togglePlay}
            onLoadedMetadata={() => setLoading(false)}
            onCanPlay={(e) => {
              setLoading(false);
              const p = e.currentTarget.play();
              if (p !== undefined) {
                p.then(() => setPlaying(true)).catch(() => setPlaying(false));
              }
            }}
            onWaiting={() => setLoading(true)}
            onPlaying={() => {
              setLoading(false);
              setPlaying(true);
            }}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration) setProgress((v.currentTime / v.duration) * 100);
            }}
            onEnded={() => (index + 1 < items.length ? go(1) : setPlaying(false))}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        )}

        {isLoading && !isFailed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Loader2 className="w-8 h-8 text-white/80 animate-spin" />
          </div>
        )}
        {isFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white bg-black/80 px-6 text-center">
            <AlertTriangle className="w-7 h-7" />
            <p className="text-sm">This video failed to load. It may have been removed.</p>
          </div>
        )}

        {/* Big Play Overlay for autoplay blocked */}
        {!playing && !isLoading && !isFailed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}

        {/* top bar */}
        <div className="absolute top-4 left-3 right-3 z-20 flex items-center gap-2">
          <div className="min-w-0">
            {item.authorName && <p className="text-white text-sm font-semibold truncate">{item.authorName}</p>}
            {item.title && <p className="text-white/70 text-xs truncate">{item.title}</p>}
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="text-white/70 text-[11px]">{index + 1}/{items.length}</span>
            {item.canDelete && onDelete && (
              <button
                onClick={() => {
                  if (confirm("Delete this video? This removes it from your profile and storage.")) void onDelete(item);
                }}
                className="p-2 rounded-full text-white hover:bg-white/15"
                aria-label="Delete video"
              >
                <Trash2 className="w-4.5 h-4.5" />
              </button>
            )}
            <button onClick={shareVideo} className="p-2 rounded-full text-white hover:bg-white/15" aria-label="Share video">
              <Share2 className="w-5 h-5" />
            </button>
            <button onClick={() => setMuted((m) => !m)} className="p-2 rounded-full text-white hover:bg-white/15" aria-label="Toggle sound">
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <button onClick={togglePlay} className="p-2 rounded-full text-white hover:bg-white/15" aria-label="Play or pause">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="p-2 rounded-full text-white hover:bg-white/15" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {index > 0 && (
          <button onClick={() => go(-1)} className="absolute left-1/2 -translate-x-1/2 top-14 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous video">
            <ChevronUp className="w-5 h-5" />
          </button>
        )}
        {index + 1 < items.length && (
          <button onClick={() => go(1)} className="absolute left-1/2 -translate-x-1/2 bottom-6 z-20 p-2 rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next video">
            <ChevronDown className="w-5 h-5" />
          </button>
        )}
      </div>

      {shareOpen && (
        <ShareVideoDialog
          item={item}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}
