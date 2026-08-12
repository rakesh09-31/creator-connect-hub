import { useMediaUrl } from "@/hooks/useMediaUrl";

export function ProfileAvatar({ url, className = "", alt = "" }: { url: string | null | undefined; className?: string; alt?: string }) {
  const { resolvedUrl } = useMediaUrl("profileImage", url);
  if (!resolvedUrl) return null;
  return <img src={resolvedUrl} className={className} alt={alt} />;
}
