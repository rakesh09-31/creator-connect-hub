import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Lock, Mail, User, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { LoadingScreen } from "@/components/LoadingScreen";
import { AuthShell, TextField } from "./login";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create account — Omnicraft" }] }),
  component: SignupPage,
});

const schema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers and underscores only"),
  email: z.string().trim().email("Enter a valid email").max(255),
  phone: z.string().trim().min(7, "Enter a valid phone number").max(20),
  password: z.string().min(6, "Password must be at least 6 characters").max(100),
});

function SignupPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const set = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (form.password !== form.confirmPassword) return toast.error("Passwords do not match");
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0].message);

    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/splash`,
        data: {
          username: parsed.data.username,
          full_name: parsed.data.username,
          phone: parsed.data.phone,
        },
      },
    });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }
    toast.success("Welcome to Omnicraft!");
    navigate({ to: "/onboarding/role" });
  };

  if (submitting) return <LoadingScreen message="Creating your account" />;

  return (
    <AuthShell title="Create your account" subtitle="Join Omnicraft — free forever">
      <form onSubmit={handleSignup} className="space-y-4">
        <TextField
          label="Username"
          icon={<User className="h-4 w-4" />}
          value={form.username}
          onChange={set("username")}
          placeholder="choose a username"
          autoComplete="username"
        />
        <TextField
          label="Email"
          icon={<Mail className="h-4 w-4" />}
          type="email"
          value={form.email}
          onChange={set("email")}
          placeholder="you@email.com"
          autoComplete="email"
        />
        <TextField
          label="Phone"
          icon={<Phone className="h-4 w-4" />}
          type="tel"
          value={form.phone}
          onChange={set("phone")}
          placeholder="+1 (555) 000-0000"
          autoComplete="tel"
        />

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password")(e.target.value)}
              placeholder="Create a password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-11 text-sm text-white placeholder:text-white/30 outline-none transition focus:border-purple-400/50 focus:bg-white/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <TextField
          label="Confirm password"
          icon={<Lock className="h-4 w-4" />}
          type={showPassword ? "text" : "password"}
          value={form.confirmPassword}
          onChange={set("confirmPassword")}
          placeholder="Confirm your password"
          autoComplete="new-password"
        />

        <button
          type="submit"
          disabled={submitting}
          className="group relative mt-3 w-full overflow-hidden rounded-xl bg-[linear-gradient(135deg,#7c3aed,#c026d3_55%,#3b82f6)] py-3 text-sm font-bold text-white shadow-[0_0_30px_-8px_rgba(168,85,247,0.7)] transition disabled:opacity-60"
        >
          Create account
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-white/60">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-white hover:text-purple-300">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
