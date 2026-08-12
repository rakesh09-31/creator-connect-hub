import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BrandMark } from "@/components/BrandMark";
import { LoadingScreen } from "@/components/LoadingScreen";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Omnicraft" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { session, profile, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (session && profile !== undefined) {
      // If the user already has a role, they are recognised — go home.
      // Only truly new accounts (role === null and not onboarded) see role selection.
      const hasRole = profile?.role != null;
      if (hasRole || profile?.onboarded) {
        navigate({ to: "/home", replace: true });
      } else {
        navigate({ to: "/onboarding/role", replace: true });
      }
    }
  }, [loading, session, profile, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!email || !password) return toast.error("Enter your email and password");
    if (!email.includes("@")) return toast.error("Please sign in with your email address");
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }
    toast.success("Welcome back!");
    // keep loader visible until auth context redirects
  };

  if (submitting) return <LoadingScreen message="Signing you in" />;

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to Omnicraft">
      <form onSubmit={handleLogin} className="space-y-5">
        <TextField
          label="Email"
          icon={<Mail className="h-4 w-4" />}
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="you@email.com"
          autoComplete="email"
        />

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-purple-300 hover:text-purple-200"
            >
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-11 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-purple-400/50 focus:bg-white/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="group relative mt-2 w-full overflow-hidden rounded-xl bg-[linear-gradient(135deg,#7c3aed,#c026d3_55%,#3b82f6)] py-3 text-sm font-bold text-white shadow-[0_0_30px_-8px_rgba(168,85,247,0.7)] transition disabled:opacity-60"
        >
          <span className="relative z-10">Sign in</span>
          <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-widest text-white/30">
        <div className="h-px flex-1 bg-white/10" />
        or
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <p className="text-center text-sm text-white/60">
        New to Omnicraft?{" "}
        <Link to="/signup" className="font-semibold text-white hover:text-purple-300">
          Create an account
        </Link>
      </p>
    </AuthShell>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* glowing orbs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-purple-600/25 blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-40 right-1/4 h-[28rem] w-[28rem] rounded-full bg-blue-600/20 blur-[120px] animate-pulse-slow [animation-delay:1s]" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-600/15 blur-[100px]" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 flex flex-col items-center text-center">
            <BrandMark size={72} />
            <h1 className="mt-5 text-3xl font-black tracking-tight text-white">{title}</h1>
            <p className="mt-1.5 text-sm text-white/50">{subtitle}</p>
          </div>

          <div className="glass-card rounded-2xl p-7 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.9)]">
            {children}
          </div>

          <p className="mt-6 text-center text-xs text-white/30">
            By continuing you agree to our Terms &amp; Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}

export function TextField({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  icon: React.ReactNode;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-purple-400/50 focus:bg-white/10"
        />
      </div>
    </div>
  );
}
