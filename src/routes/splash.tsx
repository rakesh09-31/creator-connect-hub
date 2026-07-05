import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BrandMark } from "@/components/BrandMark";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/splash")({
  component: SplashPage,
});

function SplashPage() {
  const navigate = useNavigate();
  const { loading, session, profile } = useAuth();

  useEffect(() => {
    const t = setTimeout(() => {
      if (loading) return;
      if (!session) navigate({ to: "/login" });
      else if (!profile?.onboarded) navigate({ to: "/onboarding/role" });
      else navigate({ to: "/home" });
    }, 2400);
    return () => clearTimeout(t);
  }, [loading, session, profile, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Subtle glowing background orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute left-[15%] top-[20%] h-72 w-72 rounded-full bg-fuchsia-600/20 blur-[100px] animate-pulse-slow [animation-delay:0.6s]" />
        <div className="absolute bottom-[15%] right-[15%] h-80 w-80 rounded-full bg-blue-600/20 blur-[100px] animate-pulse-slow [animation-delay:1.2s]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.8) 1px, transparent 0)",
            backgroundSize: "36px 36px",
          }}
        />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="animate-splash-pop">
          <div className="relative">
            <div className="absolute inset-0 -m-8 rounded-full bg-purple-500/25 blur-3xl animate-pulse-slow" />
            <BrandMark size={128} className="relative" />
          </div>
        </div>

        <h1 className="mt-8 text-6xl font-black tracking-tight text-white animate-fade-up drop-shadow-lg">
          Omnicraft
        </h1>
        <p className="mt-3 text-base font-medium text-white/50 animate-fade-up [animation-delay:0.35s]">
          Where creativity meets opportunity
        </p>

        <div className="mt-14 flex gap-1.5 animate-fade-up [animation-delay:0.7s]">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-white/70 animate-pulse-dot"
              style={{ animationDelay: `${i * 0.18}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
