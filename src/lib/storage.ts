import { supabase } from "@/integrations/supabase/client";

/**
 * Unified, feature-based storage service for OmniCraft.
 *
 * Every feature uploads through this module — never call
 * `supabase.storage.from("<bucket>")` directly in components.
 * Bucket names live here only, so migrating to another Supabase
 * project (or renaming a bucket) is a one-file change.
 */

export type StorageFeature =
  | "profileImage"
  | "coverImage"
  | "portfolioImage"
  | "portfolioVideo"
  | "post"
  | "story"
  | "reel"
  | "chatMedia"
  | "creatorAsset"
  | "clientAsset"
  | "document"
  | "verification"
  | "thumbnail"
  | "temp";

type BucketConfig = {
  bucket: string;
  public: boolean;
  maxBytes: number;
  mime: string[]; // prefixes ("image/") or exact types ("application/pdf")
};

const MB = 1024 * 1024;
const IMAGE = ["image/"];
const VIDEO = ["video/"];
const MEDIA = [...IMAGE, ...VIDEO];
const DOCS = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument", "image/"];

export const STORAGE_BUCKETS: Record<StorageFeature, BucketConfig> = {
  profileImage: { bucket: "profile-images", public: true, maxBytes: 8 * MB, mime: IMAGE },
  coverImage: { bucket: "cover-images", public: true, maxBytes: 12 * MB, mime: IMAGE },
  portfolioImage: { bucket: "portfolio-images", public: true, maxBytes: 15 * MB, mime: IMAGE },
  portfolioVideo: { bucket: "portfolio-videos", public: true, maxBytes: 200 * MB, mime: VIDEO },
  post: { bucket: "posts", public: true, maxBytes: 100 * MB, mime: MEDIA },
  story: { bucket: "stories", public: true, maxBytes: 100 * MB, mime: MEDIA },
  reel: { bucket: "reels", public: true, maxBytes: 300 * MB, mime: VIDEO },
  chatMedia: { bucket: "chat-media", public: false, maxBytes: 50 * MB, mime: [...MEDIA, ...DOCS] },
  creatorAsset: { bucket: "creator-assets", public: true, maxBytes: 100 * MB, mime: [...MEDIA, ...DOCS] },
  clientAsset: { bucket: "client-assets", public: true, maxBytes: 100 * MB, mime: [...MEDIA, ...DOCS] },
  document: { bucket: "documents", public: false, maxBytes: 25 * MB, mime: DOCS },
  verification: { bucket: "verification", public: false, maxBytes: 25 * MB, mime: DOCS },
  thumbnail: { bucket: "thumbnails", public: true, maxBytes: 5 * MB, mime: IMAGE },
  temp: { bucket: "temp-uploads", public: false, maxBytes: 100 * MB, mime: [...MEDIA, ...DOCS] },
};

export type UploadOptions = {
  feature: StorageFeature;
  file: File | Blob;
  userId: string;
  /** optional sub folder, e.g. a conversation id or portfolio id */
  folder?: string;
  /** overwrite an existing object at this exact path */
  path?: string;
  upsert?: boolean;
  retries?: number;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
};

export type UploadResult = {
  bucket: string;
  path: string;
  url: string;
  isPublic: boolean;
  size: number;
  mimeType: string;
};

export class StorageError extends Error {
  code: "VALIDATION" | "SIZE" | "MIME" | "UPLOAD" | "NOT_FOUND";
  constructor(code: StorageError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "StorageError";
  }
}

const extOf = (file: File | Blob) => {
  const name = (file as File).name ?? "";
  const fromName = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (fromName && fromName.length <= 5) return fromName;
  if (file.type.startsWith("video/")) return "mp4";
  if (file.type === "application/pdf") return "pdf";
  return "jpg";
};

const mimeAllowed = (type: string, allowed: string[]) =>
  allowed.some((a) => (a.endsWith("/") ? type.startsWith(a) : type === a || type.startsWith(a)));

export function validateFile(feature: StorageFeature, file: File | Blob) {
  const cfg = STORAGE_BUCKETS[feature];
  if (!cfg) throw new StorageError("VALIDATION", `Unknown storage feature: ${feature}`);
  if (!file || file.size === 0) throw new StorageError("VALIDATION", "The selected file is empty.");
  if (file.size > cfg.maxBytes)
    throw new StorageError("SIZE", `File is too large. Max ${Math.round(cfg.maxBytes / MB)}MB for this upload.`);
  const type = file.type || "";
  if (type && !mimeAllowed(type, cfg.mime))
    throw new StorageError("MIME", `Unsupported file type "${type}" for this upload.`);
  return cfg;
}

export function buildPath(feature: StorageFeature, userId: string, file: File | Blob, folder?: string) {
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const parts = [userId, folder, `${stamp}.${extOf(file)}`].filter(Boolean);
  return parts.join("/");
}

/** Upload a file to the bucket that belongs to `feature`. */
export async function uploadFile(opts: UploadOptions): Promise<UploadResult> {
  const { feature, file, userId, folder, retries = 2, onProgress, signal } = opts;
  const cfg = validateFile(feature, file);
  const path = opts.path ?? buildPath(feature, userId, file, folder);

  onProgress?.(5);
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw new StorageError("UPLOAD", "Upload cancelled.");
    try {
      onProgress?.(attempt === 0 ? 20 : 20 + attempt * 10);
      const { error } = await supabase.storage.from(cfg.bucket).upload(path, file, {
        cacheControl: "3600",
        upsert: opts.upsert ?? false,
        contentType: file.type || undefined,
      });
      if (error) throw error;
      onProgress?.(90);
      const url = cfg.public ? getPublicUrl(feature, path) : (await getSignedUrl(feature, path)) ?? "";
      onProgress?.(100);
      return {
        bucket: cfg.bucket,
        path,
        url,
        isPublic: cfg.public,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
      };
    } catch (err) {
      lastError = err;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  const message = (lastError as { message?: string })?.message ?? "Upload failed. Please try again.";
  throw new StorageError("UPLOAD", message);
}

/** Replace an existing object in place (same path), returning a fresh URL. */
export async function replaceFile(opts: UploadOptions & { path: string }): Promise<UploadResult> {
  return uploadFile({ ...opts, upsert: true });
}

export async function deleteFile(feature: StorageFeature, path: string): Promise<void> {
  const cfg = STORAGE_BUCKETS[feature];
  const { error } = await supabase.storage.from(cfg.bucket).remove([path]);
  if (error) throw new StorageError("UPLOAD", error.message);
}

export function getPublicUrl(feature: StorageFeature, path: string): string {
  const cfg = STORAGE_BUCKETS[feature];
  return supabase.storage.from(cfg.bucket).getPublicUrl(path).data.publicUrl;
}

export async function getSignedUrl(feature: StorageFeature, path: string, expiresIn = 60 * 60): Promise<string | null> {
  const cfg = STORAGE_BUCKETS[feature];
  const { data, error } = await supabase.storage.from(cfg.bucket).createSignedUrl(path, expiresIn);
  if (error) return null;
  return data?.signedUrl ?? null;
}

/** Best-effort: derive {feature, path} back from a stored URL. */
export function parseStorageUrl(url: string): { feature: StorageFeature; path: string } | null {
  for (const [feature, cfg] of Object.entries(STORAGE_BUCKETS) as [StorageFeature, BucketConfig][]) {
    const marker = `/${cfg.bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) return { feature, path: url.slice(idx + marker.length).split("?")[0] };
  }
  return null;
}

/** Pick the right feature bucket for a post-like media file. */
export function featureForMedia(file: File | Blob, kind: "post" | "story" | "portfolio" = "post"): StorageFeature {
  const isVideo = file.type.startsWith("video/");
  if (kind === "story") return "story";
  if (kind === "portfolio") return isVideo ? "portfolioVideo" : "portfolioImage";
  return isVideo ? "reel" : "post";
}
