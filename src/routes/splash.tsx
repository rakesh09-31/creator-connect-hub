import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
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
      if (!session) {
        navigate({ to: "/login" });
      } else if (!profile?.onboarded) {
        navigate({ to: "/onboarding/role" });
      } else {
        navigate({ to: "/home" });
      }
    }, 1800);
    return () => clearTimeout(t);
  }, [loading, session, profile, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      {/* floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 24 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-2 w-2 rounded-full bg-white/30 animate-float"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              animationDelay: `${(i % 6) * 0.3}s`,
              animationDuration: `${3 + (i % 4)}s`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center text-center px-6">
        <div className="mb-6 animate-pop">
          <div className="relative mx-auto flex h-32 w-32 items-center justify-center overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90" />
            <Sparkles className="relative z-10 h-16 w-16 text-white animate-wiggle" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="text-6xl font-black tracking-tight text-white drop-shadow-lg animate-fade-up">
          Omnicraft
        </h1>
        <p className="mt-3 text-xl font-medium text-white/90 animate-fade-up [animation-delay:0.3s]">
          Where Creativity Meets Opportunity
        </p>
        <div className="mt-12 flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-3 w-3 rounded-full bg-white animate-pulse-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
