import { supabase } from "@/integrations/supabase/client";

// ============================================================================
// Centralized storage configuration for Omnicraft.
// Every feature uses a dedicated bucket. Bucket names are defined once here
// and never hardcoded in feature code.
// ============================================================================

export const BUCKETS = {
  PROFILE_IMAGES: "profile-images",
  COVER_IMAGES: "cover-images",
  POSTS: "posts",
  STORIES: "stories",
  PORTFOLIO: "portfolio",
  CHAT_MEDIA: "chat-media",
  DOCUMENTS: "documents",
  VERIFICATION: "verification",
  RESUMES: "resumes",
  THUMBNAILS: "thumbnails",
  TEMP_UPLOADS: "temp-uploads",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];

// Stories always use the dedicated stories bucket.
export const STORIES_BUCKET = BUCKETS.STORIES;

// ---------------------------------------------------------------------------
// File type + size validation
// ---------------------------------------------------------------------------

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);
const VIDEO_TYPES = new Set(["video/mp4", "video/quicktime", "video/webm", "video/x-msvideo"]);
const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
]);

export type MediaKind = "image" | "video";
export type FileKind = MediaKind | "document";

function detectKind(file: File): FileKind | null {
  const mime = file.type.toLowerCase();
  if (IMAGE_TYPES.has(mime)) return "image";
  if (VIDEO_TYPES.has(mime)) return "video";
  if (DOCUMENT_TYPES.has(mime)) return "document";
  return null;
}

const IMAGE_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"]);
const VIDEO_EXT = new Set(["mp4", "mov", "webm", "avi"]);
const DOC_EXT = new Set(["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx", "zip"]);

function detectKindFromExt(file: File): FileKind | null {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (IMAGE_EXT.has(ext)) return "image";
  if (VIDEO_EXT.has(ext)) return "video";
  if (DOC_EXT.has(ext)) return "document";
  return null;
}

/** Guesses the kind of a file, preferring the MIME type, then the extension. */
export function detectFileKind(file: File): FileKind | null {
  return detectKind(file) ?? detectKindFromExt(file);
}

export const STORY_MAX_FILE_SIZE = 100 * 1024 * 1024;

/** Validates a story media file (images and videos only, stories never accept documents). */
export function validateStoryFile(file: File): MediaKind {
  const kind = detectKind(file) ?? detectKindFromExt(file);
  if (kind !== "image" && kind !== "video") {
    throw new Error("Stories support JPG, PNG, WEBP, GIF, HEIC, MP4, MOV, WEBM, and AVI files.");
  }
  if (file.size === 0) throw new Error("The selected story file is empty.");
  if (file.size > STORY_MAX_FILE_SIZE) {
    throw new Error("Story files must be smaller than 100 MB.");
  }
  return kind;
}

/** Validates a generic feature file against a set of allowed kinds and a size cap. */
export function validateFile(file: File, allowedKinds: FileKind[], maxBytes: number): FileKind {
  const kind = detectFileKind(file);
  if (!kind || !allowedKinds.includes(kind)) {
    const allowedLabel = allowedKinds.join(", ");
    throw new Error(`Unsupported file type. Allowed: ${allowedLabel}.`);
  }
  if (file.size === 0) throw new Error("The selected file is empty.");
  if (file.size > maxBytes) {
    throw new Error(`File must be smaller than ${Math.round(maxBytes / 1024 / 1024)} MB.`);
  }
  return kind;
}

export const FILE_LIMITS: Record<BucketName, { kinds: FileKind[]; bytes: number }> = {
  [BUCKETS.PROFILE_IMAGES]: { kinds: ["image"], bytes: 5 * 1024 * 1024 },
  [BUCKETS.COVER_IMAGES]: { kinds: ["image"], bytes: 10 * 1024 * 1024 },
  [BUCKETS.POSTS]: { kinds: ["image", "video"], bytes: 100 * 1024 * 1024 },
  [BUCKETS.STORIES]: { kinds: ["image", "video"], bytes: 100 * 1024 * 1024 },
  [BUCKETS.PORTFOLIO]: { kinds: ["image", "video"], bytes: 100 * 1024 * 1024 },
  [BUCKETS.CHAT_MEDIA]: { kinds: ["image", "video", "document"], bytes: 50 * 1024 * 1024 },
  [BUCKETS.DOCUMENTS]: { kinds: ["document"], bytes: 50 * 1024 * 1024 },
  [BUCKETS.VERIFICATION]: { kinds: ["image", "document"], bytes: 50 * 1024 * 1024 },
  [BUCKETS.RESUMES]: { kinds: ["document"], bytes: 10 * 1024 * 1024 },
  [BUCKETS.THUMBNAILS]: { kinds: ["image"], bytes: 5 * 1024 * 1024 },
  [BUCKETS.TEMP_UPLOADS]: { kinds: ["image", "video", "document"], bytes: 50 * 1024 * 1024 },
};

// ---------------------------------------------------------------------------
// Path helpers (organized, per-feature)
// ---------------------------------------------------------------------------

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function yearMonth(): { year: string; month: string } {
  const d = new Date();
  return { year: d.getFullYear().toString(), month: pad(d.getMonth() + 1) };
}

/** Builds an organized path: {prefix}/users/{userId}/YYYY/MM/{label}-{uuid}.{ext} */
function userDatedPath(prefix: string, userId: string, ext: string, label: string): string {
  const { year, month } = yearMonth();
  return `${prefix}/users/${userId}/${year}/${month}/${label}-${crypto.randomUUID()}.${ext}`;
}

function extensionFor(file: File, kind: MediaKind): string {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && (IMAGE_EXT.has(ext) || VIDEO_EXT.has(ext))) return ext;
  return kind === "video" ? "mp4" : "jpg";
}

// ---------------------------------------------------------------------------
// Storage error handling
// ---------------------------------------------------------------------------

function storageError(error: { message?: string; statusCode?: string | number }, bucket: string) {
  console.error(`[Storage] Upload to "${bucket}" failed`, error);
  if (error.message?.toLowerCase().includes("bucket not found") || error.statusCode === 404) {
    return new Error(
      `The "${bucket}" storage bucket is missing. Please contact support to finish storage setup.`,
    );
  }
  return new Error("Upload failed because storage is not configured. Please try again.");
}

// ---------------------------------------------------------------------------
// Centralized upload primitives
// ---------------------------------------------------------------------------

/** Uploads story media to the single, dedicated `stories` bucket. */
export async function uploadStoryMedia(
  file: File,
  userId: string,
): Promise<{ mediaUrl: string; mediaType: "image" | "video"; path: string }> {
  const mediaType = validateStoryFile(file);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user || user.id !== userId) {
    throw new Error("You must be signed in to upload a story.");
  }

  const { error: bucketError } = await supabase.storage
    .from(BUCKETS.STORIES)
    .list(`users/${userId}`, { limit: 1, search: "" });
  if (bucketError) throw storageError(bucketError, BUCKETS.STORIES);

  const ext = extensionFor(file, mediaType);
  const path = userDatedPath("users", userId, ext, "story");

  const { error } = await supabase.storage.from(BUCKETS.STORIES).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw storageError(error, BUCKETS.STORIES);

  const { data } = supabase.storage.from(BUCKETS.STORIES).getPublicUrl(path);
  return { mediaUrl: data.publicUrl, mediaType, path };
}

/** Removes an uploaded story when its database record could not be created. */
export async function removeStoryMedia(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKETS.STORIES).remove([path]);
  if (error) console.error("[Stories] Unable to remove orphaned story media", error);
}

/** Removes any file from the given bucket via its storage path. */
export async function removeStorageFile(bucket: BucketName, path: string): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);
  if (error) console.error(`[Storage] Unable to remove "${bucket}/${path}"`, error);
}

/**
 * Generic upload for a feature. Bucket and path layout are derived from the
 * bucket constant; the caller never hardcodes a bucket name.
 *
 * Examples:
 *  - uploadFeatureMedia(file, user.id, BUCKETS.POSTS, "post")
 *  - uploadFeatureMedia(file, user.id, BUCKETS.PORTFOLIO, "portfolio")
 */
export async function uploadFeatureMedia(
  file: File,
  userId: string,
  bucket: BucketName,
  label: string,
): Promise<{ mediaUrl: string; path: string; kind: FileKind }> {
  const limit = FILE_LIMITS[bucket];
  const kind = validateFile(file, limit.kinds, limit.bytes);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user || user.id !== userId) {
    throw new Error("You must be signed in to upload.");
  }

  const ext =
    file.name.split(".").pop()?.toLowerCase() ||
    (kind === "video" ? "mp4" : kind === "image" ? "jpg" : "pdf");
  const path = userDatedPath("users", userId, ext, label);

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw storageError(error, bucket);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { mediaUrl: data.publicUrl, path, kind };
}

/**
 * Backward-compatible generic media upload. Kept for callers that do not yet
 * distinguish buckets. New code should use uploadFeatureMedia with an explicit
 * bucket constant.
 * @deprecated Use uploadFeatureMedia / uploadStoryMedia instead.
 */
export async function uploadMedia(
  file: File,
  userId: string,
  bucket: BucketName = BUCKETS.POSTS,
  label = "media",
): Promise<string> {
  if (bucket === BUCKETS.STORIES) {
    return (await uploadStoryMedia(file, userId)).mediaUrl;
  }
  const result = await uploadFeatureMedia(file, userId, bucket, label);
  return result.mediaUrl;
}
