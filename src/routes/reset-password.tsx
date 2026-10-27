import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "./login";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — Omnicraft" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated successfully!");
      navigate({ to: "/login" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Set new password"
      subtitle="Choose a secure password for your account"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
            New password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter at least 6 characters"
              autoComplete="new-password"
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

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
            Confirm new password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-purple-400/50 focus:bg-white/10"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="group relative mt-2 w-full overflow-hidden rounded-xl bg-[linear-gradient(135deg,#7c3aed,#c026d3_55%,#3b82f6)] py-3 text-sm font-bold text-white shadow-[0_0_30px_-8px_rgba(168,85,247,0.7)] transition disabled:opacity-60"
        >
          <span className="relative z-10">{submitting ? "Updating..." : "Update password"}</span>
          <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
        </button>

        <div className="pt-2 text-center">
          <Link
            to="/login"
            className="text-xs font-semibold text-purple-300 hover:text-purple-200 transition"
          >
            Cancel and back to sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
