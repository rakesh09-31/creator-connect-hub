import { supabase } from "@/integrations/supabase/client";

/**
 * Omnicraft unified storage service.
 *
 * EVERY upload in the app goes through this module — never call
 * `supabase.storage.from("<bucket>")` directly in a component.
 *
 * Bucket names, size limits, MIME rules, folder layout, progress,
 * retries, signed URLs and metadata bookkeeping all live here, so
 * adding a new upload feature is a one-line change to STORAGE_BUCKETS.
 *
 * Folder layout
 *   <bucket>/users/{userId}/{feature}/{YYYY}/{MM}/{uuid}.{ext}
 *   chat-media/conversations/{conversationId}/{uuid}.{ext}
 *   resumes/users/{userId}/resume.{ext}
 */

export type StorageFeature =
  | "profileImage"
  | "coverImage"
  | "portfolioImage"
  | "portfolioVideo"
  | "post"
  | "story"
  | "reel"
  | "thumbnail"
  | "creatorAsset"
  | "clientAsset"
  | "resume"
  | "document"
  | "contract"
  | "invoice"
  | "jobAttachment"
  | "projectAttachment"
  | "chatMedia"
  | "verification"
  | "temp";

type BucketConfig = {
  bucket: string;
  /** shared buckets are readable by every signed-in member */
  shared: boolean;
  maxBytes: number;
  /** prefixes ("image/") or exact types ("application/pdf") */
  mime: string[];
  /** optional sub-folder inside the user folder */
  subfolder?: string;
};

const MB = 1024 * 1024;

export const IMAGE_MIME = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/avif",
];
export const VIDEO_MIME = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/avi",
  "video/webm",
  "video/x-matroska",
];
export const AUDIO_MIME = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/webm", "audio/ogg", "audio/mp4", "audio/aac"];
export const DOC_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
  "application/x-zip-compressed",
  "application/vnd.rar",
  "application/x-rar-compressed",
];
export const RESUME_MIME = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MEDIA = [...IMAGE_MIME, ...VIDEO_MIME];

export const STORAGE_BUCKETS: Record<StorageFeature, BucketConfig> = {
  profileImage: { bucket: "profile-images", shared: true, maxBytes: 8 * MB, mime: IMAGE_MIME },
  coverImage: { bucket: "cover-images", shared: true, maxBytes: 12 * MB, mime: IMAGE_MIME },
  portfolioImage: { bucket: "portfolio", shared: true, maxBytes: 20 * MB, mime: IMAGE_MIME, subfolder: "images" },
  portfolioVideo: { bucket: "portfolio", shared: true, maxBytes: 300 * MB, mime: VIDEO_MIME, subfolder: "videos" },
  post: { bucket: "posts", shared: true, maxBytes: 150 * MB, mime: MEDIA },
  story: { bucket: "stories", shared: true, maxBytes: 150 * MB, mime: MEDIA },
  reel: { bucket: "posts", shared: true, maxBytes: 300 * MB, mime: VIDEO_MIME, subfolder: "reels" },
  thumbnail: { bucket: "thumbnails", shared: true, maxBytes: 5 * MB, mime: IMAGE_MIME },
  creatorAsset: { bucket: "creator-assets", shared: true, maxBytes: 150 * MB, mime: [...MEDIA, ...DOC_MIME] },
  clientAsset: { bucket: "client-assets", shared: true, maxBytes: 150 * MB, mime: [...MEDIA, ...DOC_MIME] },
  resume: { bucket: "resumes", shared: false, maxBytes: 15 * MB, mime: RESUME_MIME },
  document: { bucket: "documents", shared: false, maxBytes: 50 * MB, mime: DOC_MIME },
  contract: { bucket: "documents", shared: false, maxBytes: 50 * MB, mime: DOC_MIME, subfolder: "contracts" },
  invoice: { bucket: "documents", shared: false, maxBytes: 50 * MB, mime: DOC_MIME, subfolder: "invoices" },
  jobAttachment: { bucket: "documents", shared: false, maxBytes: 50 * MB, mime: [...DOC_MIME, ...IMAGE_MIME], subfolder: "jobs" },
  projectAttachment: { bucket: "documents", shared: false, maxBytes: 100 * MB, mime: [...DOC_MIME, ...MEDIA], subfolder: "projects" },
  chatMedia: { bucket: "chat-media", shared: false, maxBytes: 100 * MB, mime: [...MEDIA, ...AUDIO_MIME, ...DOC_MIME] },
  verification: { bucket: "verification", shared: false, maxBytes: 25 * MB, mime: [...IMAGE_MIME, ...DOC_MIME] },
  temp: { bucket: "temp-uploads", shared: false, maxBytes: 150 * MB, mime: [...MEDIA, ...AUDIO_MIME, ...DOC_MIME] },
};

/** shared buckets are private today (workspace policy blocks public buckets),
 *  so display URLs are long-lived signed URLs. Flip to `true` once the
 *  buckets are made public and `getPublicUrl` is used instead. */
const SHARED_BUCKETS_ARE_PUBLIC = false;
const LONG_SIGNED_TTL = 60 * 60 * 24 * 365; // 1 year

export type UploadOptions = {
  feature: StorageFeature;
  file: File | Blob;
  userId: string;
  /** extra sub folder inside the generated path */
  folder?: string;
  /** conversation id — required for chatMedia */
  conversationId?: string;
  /** overwrite an existing object at this exact path */
  path?: string;
  fileName?: string;
  upsert?: boolean;
  retries?: number;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
  /** link the upload to a row, e.g. { entityType: "post", entityId } */
  entityType?: string;
  entityId?: string;
  /** set false to skip writing to public.file_uploads */
  recordMetadata?: boolean;
};

export type UploadResult = {
  bucket: string;
  path: string;
  url: string;
  isPublic: boolean;
  size: number;
  mimeType: string;
  fileName: string;
};

export class StorageError extends Error {
  code: "VALIDATION" | "SIZE" | "MIME" | "UPLOAD" | "NOT_FOUND" | "AUTH";
  constructor(code: StorageError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "StorageError";
  }
}

/* -------------------------------------------------- helpers */

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/avif": "avif",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
  "video/x-msvideo": "avi",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/webm": "weba",
  "application/pdf": "pdf",
};

export const fileNameOf = (file: File | Blob, fallback = "upload") =>
  ((file as File).name || fallback).replace(/[^\w.\-]+/g, "_").slice(-120);

const extOf = (file: File | Blob) => {
  const name = (file as File).name ?? "";
  const fromName = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (fromName && /^[a-z0-9]{1,5}$/.test(fromName)) return fromName;
  return EXT_BY_MIME[file.type] ?? (file.type.startsWith("video/") ? "mp4" : file.type.startsWith("audio/") ? "mp3" : "jpg");
};

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const mimeAllowed = (type: string, allowed: string[]) =>
  allowed.some((a) => (a.endsWith("/") ? type.startsWith(a) : type === a));

export function validateFile(feature: StorageFeature, file: File | Blob) {
  const cfg = STORAGE_BUCKETS[feature];
  if (!cfg) throw new StorageError("VALIDATION", `Unknown storage feature: ${feature}`);
  if (!file || file.size === 0) throw new StorageError("VALIDATION", "The selected file is empty.");
  if (file.size > cfg.maxBytes)
    throw new StorageError("SIZE", `File is too large. Max ${Math.round(cfg.maxBytes / MB)}MB for this upload.`);
  const type = (file.type || "").toLowerCase();
  if (type && !mimeAllowed(type, cfg.mime))
    throw new StorageError("MIME", `Unsupported file type "${type}" for this upload.`);
  return cfg;
}

/** users/{userId}/{feature}/{YYYY}/{MM}/{uuid}.{ext} (or the chat / resume layouts) */
export function buildPath(opts: {
  feature: StorageFeature;
  userId: string;
  file: File | Blob;
  folder?: string;
  conversationId?: string;
  fileName?: string;
}): string {
  const { feature, userId, file, folder, conversationId, fileName } = opts;
  const cfg = STORAGE_BUCKETS[feature];
  const ext = extOf(file);
  const now = new Date();
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const name = fileName ?? `${feature}_${uuid()}.${ext}`;

  if (feature === "chatMedia") {
    if (!conversationId) throw new StorageError("VALIDATION", "conversationId is required for chat uploads.");
    return ["conversations", conversationId, name].join("/");
  }
  if (feature === "resume") return ["users", userId, "resume", `resume_${uuid()}.${ext}`].join("/");

  return ["users", userId, cfg.subfolder ?? feature, folder, yyyy, mm, name].filter(Boolean).join("/");
}

/* -------------------------------------------------- URLs */

const signedCache = new Map<string, { url: string; expires: number }>();

export function getPublicUrl(feature: StorageFeature, path: string): string {
  const cfg = STORAGE_BUCKETS[feature];
  return supabase.storage.from(cfg.bucket).getPublicUrl(path).data.publicUrl;
}

export async function getSignedUrl(
  feature: StorageFeature,
  path: string,
  expiresIn = 60 * 60,
): Promise<string | null> {
  const cfg = STORAGE_BUCKETS[feature];
  const key = `${cfg.bucket}:${path}:${expiresIn}`;
  const hit = signedCache.get(key);
  if (hit && hit.expires > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from(cfg.bucket).createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) return null;
  signedCache.set(key, { url: data.signedUrl, expires: Date.now() + Math.min(expiresIn, 3600) * 900 });
  return data.signedUrl;
}

/** URL that can be dropped straight into <img src> / <video src> and stored in the DB. */
export async function getDisplayUrl(feature: StorageFeature, path: string): Promise<string> {
  const cfg = STORAGE_BUCKETS[feature];
  if (cfg.shared && SHARED_BUCKETS_ARE_PUBLIC) return getPublicUrl(feature, path);
  const ttl = cfg.shared ? LONG_SIGNED_TTL : 60 * 60 * 24;
  return (await getSignedUrl(feature, path, ttl)) ?? getPublicUrl(feature, path);
}

/** Best-effort: derive {feature, path} back from a stored URL. */
export function parseStorageUrl(url: string): { feature: StorageFeature; path: string } | null {
  const entries = Object.entries(STORAGE_BUCKETS) as [StorageFeature, BucketConfig][];
  for (const [feature, cfg] of entries) {
    const marker = `/${cfg.bucket}/`;
    const idx = url.indexOf(marker);
    if (idx !== -1) {
      const path = url.slice(idx + marker.length).split("?")[0];
      const match = entries.find(([, c]) => c.bucket === cfg.bucket && c.subfolder && path.includes(`/${c.subfolder}/`));
      return { feature: match?.[0] ?? feature, path };
    }
  }
  return null;
}

/** Refresh a possibly-expired signed URL that was stored in the database. */
export async function refreshUrl(url: string): Promise<string> {
  const parsed = parseStorageUrl(url);
  if (!parsed) return url;
  return getDisplayUrl(parsed.feature, parsed.path);
}

/* -------------------------------------------------- upload */

async function putWithProgress(
  bucket: string,
  path: string,
  file: File | Blob,
  upsert: boolean,
  onProgress?: (p: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  const baseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const apiKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

  // XHR gives real progress events; fall back to the SDK when unavailable.
  if (!token || !baseUrl || !apiKey || typeof XMLHttpRequest === "undefined") {
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert,
      contentType: file.type || undefined,
    });
    if (error) throw error;
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(upsert ? "PUT" : "POST", `${baseUrl}/storage/v1/object/${bucket}/${encodeURI(path)}`);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("apikey", apiKey);
    xhr.setRequestHeader("x-upsert", String(upsert));
    xhr.setRequestHeader("cache-control", "max-age=3600");
    if (file.type) xhr.setRequestHeader("content-type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.min(95, Math.round((e.loaded / e.total) * 90) + 5));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(safeMessage(xhr.responseText) ?? `Upload failed (${xhr.status})`));
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.onabort = () => reject(new StorageError("UPLOAD", "Upload cancelled."));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(file);
  });
}

const safeMessage = (text: string) => {
  try {
    return JSON.parse(text)?.message as string | undefined;
  } catch {
    return undefined;
  }
};

async function recordMetadata(result: UploadResult, opts: UploadOptions, feature: StorageFeature) {
  try {
    await supabase.from("file_uploads").upsert(
      {
        bucket_name: result.bucket,
        file_path: result.path,
        file_name: result.fileName,
        file_size: result.size,
        mime_type: result.mimeType,
        feature,
        is_public: result.isPublic,
        public_url: result.isPublic ? result.url : null,
        entity_type: opts.entityType ?? null,
        entity_id: opts.entityId ?? null,
        uploaded_by: opts.userId,
      },
      { onConflict: "bucket_name,file_path" },
    );
  } catch {
    /* metadata is best-effort; never block an upload */
  }
}

/** Upload a file to the bucket that belongs to `feature`. */
export async function uploadFile(opts: UploadOptions): Promise<UploadResult> {
  const { feature, file, userId, retries = 2, onProgress, signal } = opts;
  const cfg = validateFile(feature, file);
  const path =
    opts.path ??
    buildPath({
      feature,
      userId,
      file,
      folder: opts.folder,
      conversationId: opts.conversationId,
      fileName: opts.fileName,
    });

  onProgress?.(3);
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw new StorageError("UPLOAD", "Upload cancelled.");
    try {
      await putWithProgress(cfg.bucket, path, file, opts.upsert ?? false, onProgress, signal);
      const url = await getDisplayUrl(feature, path);
      onProgress?.(100);
      const result: UploadResult = {
        bucket: cfg.bucket,
        path,
        url,
        isPublic: cfg.shared && SHARED_BUCKETS_ARE_PUBLIC,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        fileName: opts.fileName ?? fileNameOf(file),
      };
      if (opts.recordMetadata !== false) void recordMetadata(result, opts, feature);
      return result;
    } catch (err) {
      lastError = err;
      if (err instanceof StorageError && err.message === "Upload cancelled.") throw err;
      if (attempt === retries) break;
      await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
  }
  throw new StorageError("UPLOAD", (lastError as { message?: string })?.message ?? "Upload failed. Please try again.");
}

/** Replace an existing object in place (same path), returning a fresh URL. */
export async function replaceFile(opts: UploadOptions & { path: string }): Promise<UploadResult> {
  return uploadFile({ ...opts, upsert: true });
}

/** Upload several files at once, with a combined progress callback. */
export async function uploadMany(
  files: Array<Omit<UploadOptions, "onProgress">>,
  onProgress?: (percent: number) => void,
): Promise<UploadResult[]> {
  const progress = new Array(files.length).fill(0);
  const report = () => onProgress?.(Math.round(progress.reduce((a, b) => a + b, 0) / files.length));
  return Promise.all(
    files.map((f, i) =>
      uploadFile({
        ...f,
        onProgress: (p) => {
          progress[i] = p;
          report();
        },
      }),
    ),
  );
}

export async function deleteFile(feature: StorageFeature, path: string): Promise<void> {
  const cfg = STORAGE_BUCKETS[feature];
  const { error } = await supabase.storage.from(cfg.bucket).remove([path]);
  if (error) throw new StorageError("UPLOAD", error.message);
  await supabase.from("file_uploads").delete().eq("bucket_name", cfg.bucket).eq("file_path", path);
}

/** Delete by the URL stored in the database. */
export async function deleteByUrl(url: string): Promise<void> {
  const parsed = parseStorageUrl(url);
  if (!parsed) return;
  await deleteFile(parsed.feature, parsed.path);
}

/* -------------------------------------------------- feature pickers */

/** Pick the right feature bucket for a post-like media file. */
export function featureForMedia(file: File | Blob, kind: "post" | "story" | "portfolio" | "chat" = "post"): StorageFeature {
  const isVideo = file.type.startsWith("video/");
  if (kind === "chat") return "chatMedia";
  if (kind === "story") return "story";
  if (kind === "portfolio") return isVideo ? "portfolioVideo" : "portfolioImage";
  return isVideo ? "reel" : "post";
}

export const kindOfFile = (file: File | Blob): "image" | "video" | "audio" | "document" => {
  const t = file.type || "";
  if (t.startsWith("image/")) return "image";
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  return "document";
};

/** Downscale oversized images client-side before upload (best effort). */
export async function optimizeImage(file: File, maxDimension = 2048, quality = 0.85): Promise<File | Blob> {
  if (typeof document === "undefined" || !file.type.startsWith("image/") || file.type === "image/gif") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 2 * MB) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/webp", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".webp"), { type: "image/webp" });
  } catch {
    return file;
  }
}

/** Grab a poster frame from a video file and upload it to the thumbnails bucket. */
export async function generateVideoThumbnail(file: File | Blob): Promise<Blob | null> {
  if (typeof document === "undefined" || !file.type.startsWith("video/")) return null;
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const src = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(src);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = src;
    video.onloadeddata = () => {
      video.currentTime = Math.min(1, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return (cleanup(), resolve(null));
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => {
        cleanup();
        resolve(b);
      }, "image/jpeg", 0.8);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
  });
}
