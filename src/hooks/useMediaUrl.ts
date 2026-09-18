import { useEffect, useState } from "react";
import { getMediaUrl, cleanPathOrUrl, type StorageFeature } from "@/lib/storage";

const localCache = new Map<string, string>();

/**
 * A custom React hook to resolve raw storage paths or legacy signed URLs
 * into playable/displayable URLs asynchronously.
 */
export function useMediaUrl(
  feature: StorageFeature,
  rawPathOrUrl: string | null | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;
  const pathOrUrl = cleanPathOrUrl(rawPathOrUrl);
  const cacheKey = pathOrUrl ? `${feature}:${pathOrUrl}` : "";
  const initialUrl = cacheKey ? localCache.get(cacheKey) : "";

  const isImmediateExternal =
    !!pathOrUrl &&
    (pathOrUrl.startsWith("http://") ||
      pathOrUrl.startsWith("https://") ||
      pathOrUrl.startsWith("blob:") ||
      pathOrUrl.startsWith("data:")) &&
    !pathOrUrl.includes("/storage/v1/object/");

  const [resolvedUrl, setResolvedUrl] = useState<string>(
    initialUrl || (isImmediateExternal ? pathOrUrl : "")
  );
  const [loading, setLoading] = useState<boolean>(!resolvedUrl && !!pathOrUrl && enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!pathOrUrl) {
      setResolvedUrl("");
      setLoading(false);
      setError(null);
      return;
    }

    const cached = localCache.get(cacheKey);
    if (cached) {
      setResolvedUrl(cached);
      setLoading(false);
      return;
    }

    // If it's a non-Supabase external URL, we can resolve immediately
    if (isImmediateExternal) {
      localCache.set(cacheKey, pathOrUrl);
      setResolvedUrl(pathOrUrl);
      setLoading(false);
      return;
    }

    if (!enabled) {
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
  }, [feature, pathOrUrl, cacheKey, isImmediateExternal, enabled]);

  return { resolvedUrl, loading, error };
}
