import { useEffect, useRef, useState } from "react";
import { Loader2, Play, AlertTriangle } from "lucide-react";
import { useMediaUrl } from "@/hooks/useMediaUrl";
import type { StorageFeature } from "@/lib/storage";
import { getScrollParent, isElementNearViewport } from "@/lib/utils";

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
  priority = false,
  onInvalid,
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
  priority?: boolean;
  onInvalid?: () => void;
  onClick?: () => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(priority);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);

  const { resolvedUrl: resolvedVideoUrl, loading: videoLoading, error: videoError } = useMediaUrl(feature, src, {
    enabled: visible || priority,
  });
  const { resolvedUrl: resolvedPosterUrl, error: posterError } = useMediaUrl("thumbnail", poster, {
    enabled: true,
  });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;

    if (priority) {
      setVisible(true);
    }

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const scrollParent = getScrollParent(el);

    // Initial check: if already in or near viewport, mark visible immediately
    if (isElementNearViewport(el, scrollParent, 400)) {
      setVisible(true);
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
      { root: scrollParent, rootMargin: "400px", threshold: [0, 0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [autoPlayInView, priority]);

  const isFailed = failed || !!videoError || (!videoLoading && !resolvedVideoUrl && !!src && (visible || priority));
  const isLoading = loading || (videoLoading && !isFailed);

  useEffect(() => {
    if (isFailed && onInvalid) {
      onInvalid();
    }
  }, [isFailed, onInvalid]);

  if (isFailed && onInvalid) {
    return null;
  }

  return (
    <div ref={wrapRef} className={`relative bg-black min-h-[220px] ${className}`} onClick={onClick}>
      {visible && resolvedVideoUrl && !isFailed ? (
        <video
          ref={videoRef}
          src={resolvedVideoUrl}
          poster={(!posterFailed && !posterError && resolvedPosterUrl) ? resolvedPosterUrl : undefined}
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
        <div className="w-full h-full min-h-[220px] flex items-center justify-center bg-black/60">
          {!posterFailed && !posterError && resolvedPosterUrl ? (
            <img
              src={resolvedPosterUrl}
              alt=""
              className={`w-full h-full ${objectFit === "cover" ? "object-cover" : "object-contain"}`}
              loading={visible || priority ? "eager" : "lazy"}
              onError={() => setPosterFailed(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
              <Play className="w-8 h-8 text-white/40" />
            </div>
          )}
        </div>
      )}

      {isLoading && !isFailed && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/30">
          <Loader2 className="w-6 h-6 text-white/80 animate-spin" />
        </div>
      )}
      {isFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 text-white text-xs px-4 text-center">
          <AlertTriangle className="w-6 h-6 text-amber-400" />
          <span className="font-medium text-white/90">Video unavailable</span>
          <span className="text-[11px] text-white/60 max-w-xs">This video could not be played or is no longer accessible.</span>
        </div>
      )}
    </div>
  );
}
