import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/** Omnicraft logo mark — gradient tile with sparkle glyph. */
export function BrandMark({ size = 80, className }: { size?: number; className?: string }) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl",
        "bg-[linear-gradient(135deg,#7c3aed,#c026d3_55%,#3b82f6)]",
        "shadow-[0_0_60px_-8px_rgba(168,85,247,0.55),0_0_100px_-24px_rgba(59,130,246,0.4)]",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 bg-black/10" />
      <Sparkles
        className="relative z-10 text-white drop-shadow"
        style={{ width: size * 0.55, height: size * 0.55 }}
        strokeWidth={2.4}
      />
    </div>
  );
}
