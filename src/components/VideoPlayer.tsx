import { useEffect, useRef, useState } from "react";
import { Loader2, Play, AlertTriangle } from "lucide-react";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import type { StorageFeature } from "@/lib/storage";

/**
 * Bandwidth-friendly HTML5 video.
 *
 * - never sets `src` until the element is (near) the viewport, so a page of
 *   20 videos does not fire 20 downloads
 * - `preload="metadata"` -> the browser fetches only the moov atom, then
 *   streams via range requests when the user hits play
 * - poster/thumbnail is shown while nothing is loaded
 */
export function VideoPlayer({
  src,
  poster,
  className = "",
  controls = true,
  muted = false,
  loop = false,
  autoPlayInView = false,
  objectFit = "cover",
  feature = "post",
  onClick,
}: {
  src: string;
  poster?: string | null;
  className?: string;
  controls?: boolean;
  muted?: boolean;
  loop?: boolean;
  /** play automatically (muted) while visible, pause when scrolled away */
  autoPlayInView?: boolean;
  objectFit?: "cover" | "contain";
  feature?: StorageFeature;
  onClick?: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const { resolvedUrl: resolvedVideoUrl, loading: videoLoading, error: videoError } = useMediaUrl(feature, src);
  const { resolvedUrl: resolvedPosterUrl } = useMediaUrl("thumbnail", poster);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
        const v = videoRef.current;
        if (!v) return;
        if (autoPlayInView) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) void v.play().catch(() => undefined);
          else v.pause();
        } else if (!entry.isIntersecting) {
          v.pause();
        }
      },
      { rootMargin: "300px", threshold: [0, 0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoPlayInView]);

  const isFailed = failed || !!videoError;
  const isLoading = loading || videoLoading;

  return (
    <div ref={wrapRef} className={`relative bg-black ${className}`} onClick={onClick}>
      {visible && resolvedVideoUrl ? (
        <video
          ref={videoRef}
          src={resolvedVideoUrl}
          poster={resolvedPosterUrl ?? undefined}
          className={`w-full h-full ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
          preload="metadata"
          playsInline
          muted={muted}
          loop={loop}
          controls={controls}
          onLoadStart={() => setLoading(true)}
          onLoadedMetadata={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setFailed(true);
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          {resolvedPosterUrl ? (
            <img src={resolvedPosterUrl} alt="" className={`w-full h-full ${objectFit === "cover" ? "object-cover" : "object-contain"}`} loading="lazy" />
          ) : (
            <Play className="w-8 h-8 text-white/50" />
          )}
        </div>
      )}

      {isLoading && !isFailed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Loader2 className="w-6 h-6 text-white/80 animate-spin" />
        </div>
      )}
      {isFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 text-white text-xs px-3 text-center">
          <AlertTriangle className="w-5 h-5" />
          This video could not be loaded.
        </div>
      )}
    </div>
  );
}
