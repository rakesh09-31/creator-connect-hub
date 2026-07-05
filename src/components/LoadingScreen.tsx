import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";

/** Fullscreen premium loading screen used during auth transitions. */
export function LoadingScreen({ message = "Loading" }: { message?: string }) {
  const [dots, setDots] = useState("");
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? "" : d + ".")), 400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black">
      {/* soft glowing orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-600/25 blur-3xl animate-pulse-slow" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/25 blur-3xl animate-pulse-slow [animation-delay:1s]" />
        <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-600/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 animate-fade-in">
        <div className="relative">
          <div className="absolute inset-0 -m-6 rounded-full bg-purple-500/30 blur-2xl animate-pulse-slow" />
          <BrandMark size={88} />
          {/* spinner ring */}
          <svg
            className="absolute -inset-3 h-[calc(100%+1.5rem)] w-[calc(100%+1.5rem)] animate-spin-slow"
            viewBox="0 0 100 100"
            fill="none"
          >
            <defs>
              <linearGradient id="ls-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
            <circle
              cx="50"
              cy="50"
              r="46"
              stroke="url(#ls-grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="60 300"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-2xl font-bold tracking-tight text-white">Omnicraft</p>
          <p className="mt-2 text-sm font-medium text-white/60 tabular-nums">
            {message}
            <span className="inline-block w-4 text-left">{dots}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
