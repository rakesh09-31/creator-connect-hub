import { createFileRoute, Link } from "@tanstack/react-router";
import { User, Mail, Shield, Sun, Moon, LogOut, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Omnicraft" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();

  const role = profile?.role ?? profile?.account_type ?? "creator";
  const fullName = profile?.full_name || profile?.username || "Omnicraft User";
  const email = user?.email || "No email available";

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/profile"
          className="p-2 rounded-xl bg-surface border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition"
          title="Back to profile"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your account preferences and session</p>
        </div>
      </div>

      {/* Account Overview Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-border">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Account Info</h2>
          <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" /> Active Session
          </span>
        </div>

        <div className="grid gap-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-soft flex items-center justify-center text-brand">
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Display Name & Handle</p>
                <p className="text-sm font-semibold text-foreground">{fullName}</p>
                <p className="text-xs text-muted-foreground">@{profile?.username || "unknown"}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Email Address</p>
                <p className="text-sm font-semibold text-foreground">{email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role / Account Type</p>
                <p className="text-sm font-semibold text-foreground capitalize">{role}</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded bg-brand-soft text-brand">
              {role}
            </span>
          </div>
        </div>
      </div>

      {/* Preferences Card */}
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Preferences</h2>
        <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Appearance Mode</p>
              <p className="text-xs text-muted-foreground">Current: {theme === "dark" ? "Dark mode" : "Light mode"}</p>
            </div>
          </div>
          <button
            onClick={toggle}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-border bg-surface hover:bg-muted transition"
          >
            Switch to {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      {/* Sign Out Card */}
      <div className="bg-surface border border-destructive/30 rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive">Sign Out</h2>
          <p className="text-xs text-muted-foreground mt-1">
            End your authenticated session on this device. You will be redirected to the sign-in page.
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-destructive text-destructive-foreground hover:opacity-90 transition flex items-center justify-center gap-2 shadow-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Omnicraft</span>
        </button>
      </div>
    </div>
  );
}
