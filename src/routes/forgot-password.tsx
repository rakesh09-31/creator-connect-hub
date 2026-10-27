import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, TextField } from "./login";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Recover account — Omnicraft" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    const parsed = z.string().email().safeParse(trimmed);
    if (!parsed.success) {
      toast.error("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
      toast.success("Check your email for a reset link");
    } catch (err: any) {
      toast.error(err?.message || "Failed to send reset link");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      title={sent ? "Check your inbox" : "Reset password"}
      subtitle={sent ? "We've sent a recovery link to your email" : "Enter your email and we'll send you a recovery link"}
    >
      {sent ? (
        <div className="space-y-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
            <Mail className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-white/80">
              We sent a password reset link to:
            </p>
            <p className="text-sm font-semibold text-purple-300 break-all">
              {email}
            </p>
            <p className="text-xs text-white/50 pt-2">
              Didn't receive it? Check your spam folder or try again in a few minutes.
            </p>
          </div>

          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 text-sm font-bold text-white transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" /> Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <TextField
            label="Email"
            icon={<Mail className="h-4 w-4" />}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@email.com"
            autoComplete="email"
          />

          <button
            type="submit"
            disabled={submitting}
            className="group relative mt-2 w-full overflow-hidden rounded-xl bg-[linear-gradient(135deg,#7c3aed,#c026d3_55%,#3b82f6)] py-3 text-sm font-bold text-white shadow-[0_0_30px_-8px_rgba(168,85,247,0.7)] transition disabled:opacity-60"
          >
            <span className="relative z-10">{submitting ? "Sending..." : "Send recovery link"}</span>
            <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
          </button>

          <div className="pt-2 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-300 hover:text-purple-200 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
            </Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
