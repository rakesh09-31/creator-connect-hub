import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface CreatorAvatarProps {
  url?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function CreatorAvatar({
  url,
  name,
  size = "md",
  className = "",
}: CreatorAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  }[size];

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "C";

  return (
    <Avatar className={`${sizeClasses} ${className} shrink-0`}>
      {url ? <AvatarImage src={url} alt={name} className="object-cover" /> : null}
      <AvatarFallback className="bg-gradient-brand text-white font-bold tracking-tight">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
