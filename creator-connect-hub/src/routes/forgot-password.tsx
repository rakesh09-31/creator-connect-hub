import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

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
    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Enter a valid email");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      setSent(true);
      toast.success("Check your email for a reset link");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-white rounded-2xl shadow-xl flex items-center justify-center mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 opacity-90" />
            <Sparkles className="w-10 h-10 text-white relative z-10" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-white/80">We'll email you a recovery link</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center py-6">
              <Mail className="w-12 h-12 text-indigo-600 mx-auto mb-3" />
              <h3 className="font-bold text-lg mb-2">Email sent</h3>
              <p className="text-gray-600 text-sm">Check <span className="font-semibold">{email}</span> and follow the link to set a new password.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <button type="submit" disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-60">
                {submitting ? "Sending..." : "Send recovery email"}
              </button>
            </form>
          )}
          <Link to="/login" className="mt-6 flex items-center justify-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
            <ArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
