import { uploadFile, featureForMedia, type StorageFeature } from "@/lib/storage";

/**
 * Backwards-compatible helper. Prefer importing `uploadFile` from
 * "@/lib/storage" directly and passing an explicit feature bucket.
 */
export async function uploadMedia(
  file: File,
  userId: string,
  feature?: StorageFeature,
): Promise<string> {
  const res = await uploadFile({ feature: feature ?? featureForMedia(file, "post"), file, userId });
  return res.url;
}
