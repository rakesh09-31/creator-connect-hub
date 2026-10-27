import { useEffect, useState } from "react";
import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  Home as HomeIcon,
  Search,
  PlusSquare,
  User as UserIcon,
  MessageCircle,
  Briefcase,
  LogOut,
  Sun,
  Moon,
  Settings,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { NotificationBell } from "@/components/NotificationBell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/_app")({
  component: AppShell,
});

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading, signOut, refresh } = useAuth();
  const { theme, toggle } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (loading || !profile) return;
    
    // If user is onboarded, do not redirect to onboarding
    if (profile.onboarded) return;

    const type = profile.account_type || profile.role;
    if (!type) {
      if (location.pathname !== "/onboarding/role") navigate({ to: "/onboarding/role", replace: true });
      return;
    }

    if (type === "creator" && location.pathname !== "/onboarding/specialty") {
      navigate({ to: "/onboarding/specialty", replace: true });
      return;
    }
    
    if (type === "client" && location.pathname !== "/onboarding/client") {
      navigate({ to: "/onboarding/client", replace: true });
      return;
    }
  }, [loading, profile, navigate, location.pathname]);

  const role = profile?.role ?? "creator";
  const isActive = (p: string) =>
    location.pathname === p || (p !== "/home" && location.pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" data-role={role}>
      <header className="bg-surface/85 backdrop-blur-xl border-b border-border/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 h-16 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <Link to="/home" className="flex items-center gap-2 sm:gap-2.5 group shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand group-hover:scale-105 transition shrink-0">
              <span className="text-white font-bold text-sm sm:text-base tracking-tight">O</span>
            </div>
            <span className="text-lg sm:text-xl font-bold tracking-tight text-gradient-brand">Omnicraft</span>
            <span className="hidden sm:inline ml-1 text-[10px] uppercase tracking-widest font-semibold text-white bg-gradient-brand rounded-full px-2 py-0.5">
              {role === "creator" ? "Creator" : "Client"}
            </span>
          </Link>

          {/* Action Navigation Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* OmniForge Button */}
            <Link
              to="/omniforge"
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                isActive("/omniforge")
                  ? "bg-gradient-brand text-white shadow-brand"
                  : "bg-brand-soft text-brand hover:bg-brand hover:text-white"
              }`}
              title="OmniForge AI Workspace"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse-slow shrink-0" />
              <span className="hidden xs:inline">OmniForge</span>
              <span className="hidden sm:inline">AI</span>
            </Link>

            {/* Essential Social Buttons */}
            <NotificationBell active={isActive("/notifications")} />
            <HeaderBtn to="/messages" active={isActive("/messages")} title="Messages">
              <MessageCircle className="w-5 h-5" />
            </HeaderBtn>

            {/* Desktop-only individual Controls (Settings, Theme, Sign Out) */}
            <div className="hidden sm:flex items-center gap-1.5">
              <HeaderBtn to="/settings" active={isActive("/settings")} title="Settings">
                <Settings className="w-5 h-5" />
              </HeaderBtn>
              <button
                onClick={toggle}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                title={theme === "dark" ? "Light mode" : "Dark mode"}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button
                onClick={() => signOut()}
                className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile-only compact menu toggle */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="sm:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              title="Open menu"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu drawer */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-t border-border/80 bg-surface/95 backdrop-blur-xl px-4 py-4 space-y-3 animate-fade-in shadow-xl">
            {/* User Info Strip */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground truncate">
                  {profile?.full_name || profile?.username || "Creator"}
                </p>
                <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-white bg-gradient-brand rounded-full px-2.5 py-0.5">
                {role === "creator" ? "Creator" : "Client"}
              </span>
            </div>

            {/* Menu Links */}
            <div className="grid gap-1">
              <Link
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive("/settings") ? "bg-brand-soft text-brand font-bold" : "text-foreground hover:bg-muted"
                }`}
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                <span>Account Settings</span>
              </Link>

              <button
                onClick={() => {
                  toggle();
                }}
                className="flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition cursor-pointer"
              >
                <span className="flex items-center gap-3">
                  {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-400" />}
                  <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                </span>
                <span className="text-xs text-muted-foreground font-normal capitalize">{theme}</span>
              </button>

              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-destructive" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 overflow-y-auto pb-24 pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md sm:max-w-lg md:max-w-xl mx-auto px-4 h-16 grid grid-cols-5 items-center justify-items-center">
          <NavLink to="/home" icon={<HomeIcon className="w-5 h-5" />} label="Home" active={isActive("/home")} />
          <NavLink to="/explore" icon={<Search className="w-5 h-5" />} label="Search" active={isActive("/explore")} />
          <NavLink to="/create" icon={<PlusSquare className="w-5 h-5" />} label="Create" active={isActive("/create")} />
          <NavLink to="/jobs" icon={<Briefcase className="w-5 h-5" />} label="Jobs" active={isActive("/jobs")} />
          <NavLink to="/profile" icon={<UserIcon className="w-5 h-5" />} label="Profile" active={isActive("/profile")} />
        </div>
      </nav>
    </div>
  );
}

function HeaderBtn({
  to,
  active,
  title,
  children,
}: {
  to: string;
  active: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to}
      title={title}
      aria-label={title}
      className={`p-2 rounded-md transition ${
        active ? "text-brand bg-brand-soft" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
}

function NavLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={`flex flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-md transition w-full ${
        active ? "text-foreground font-semibold" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className={active ? "text-brand" : ""}>{icon}</span>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}
