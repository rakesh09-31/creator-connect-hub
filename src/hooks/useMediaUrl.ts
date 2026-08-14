import { useEffect, useState } from "react";
import { getMediaUrl, type StorageFeature } from "@/lib/storage";

const localCache = new Map<string, string>();

/**
 * A custom React hook to resolve raw storage paths or legacy signed URLs
 * into playable/displayable URLs asynchronously.
 */
export function useMediaUrl(
  feature: StorageFeature,
  pathOrUrl: string | null | undefined
) {
  const cacheKey = pathOrUrl ? `${feature}:${pathOrUrl}` : "";
  const initialUrl = cacheKey ? localCache.get(cacheKey) : "";

  const [resolvedUrl, setResolvedUrl] = useState<string>(
    initialUrl ||
      (pathOrUrl &&
      (pathOrUrl.startsWith("http://") ||
        pathOrUrl.startsWith("https://") ||
        pathOrUrl.startsWith("blob:")) &&
      !pathOrUrl.includes("/storage/v1/object/") // If it has Supabase object URL pattern, let's resolve it asynchronously
        ? pathOrUrl
        : "")
  );
  const [loading, setLoading] = useState<boolean>(!resolvedUrl && !!pathOrUrl);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!pathOrUrl) {
      setResolvedUrl("");
      setLoading(false);
      return;
    }

    const cached = localCache.get(cacheKey);
    if (cached) {
      setResolvedUrl(cached);
      setLoading(false);
      return;
    }

    // If it's a non-Supabase external URL, we can resolve immediately
    if (
      (pathOrUrl.startsWith("http://") ||
        pathOrUrl.startsWith("https://") ||
        pathOrUrl.startsWith("blob:") ||
        pathOrUrl.startsWith("data:")) &&
      !pathOrUrl.includes("/storage/v1/object/")
    ) {
      localCache.set(cacheKey, pathOrUrl);
      setResolvedUrl(pathOrUrl);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    getMediaUrl(feature, pathOrUrl)
      .then((url) => {
        if (!active) return;
        if (url) {
          localCache.set(cacheKey, url);
          setResolvedUrl(url);
        } else {
          setError(new Error("Could not resolve media URL."));
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [feature, pathOrUrl, cacheKey]);

  return { resolvedUrl, loading, error };
}
