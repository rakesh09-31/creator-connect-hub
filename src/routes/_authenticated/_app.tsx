import { useEffect } from "react";
import { createFileRoute, Outlet, Link, useNavigate, useLocation } from "@tanstack/react-router";
import { Home as HomeIcon, Search, PlusSquare, User as UserIcon, Heart, MessageCircle, Briefcase, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app")({
  component: AppShell,
});

function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && profile && !profile.onboarded) {
      navigate({ to: "/onboarding/role", replace: true });
    }
  }, [loading, profile, navigate]);

  const role = profile?.role ?? "creator";
  const isActive = (p: string) =>
    location.pathname === p || (p !== "/home" && location.pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground" data-role={role}>
      <header className="bg-surface/85 backdrop-blur-xl border-b border-border/60 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-brand flex items-center justify-center shadow-brand group-hover:scale-105 transition">
              <span className="text-white font-bold text-base tracking-tight">O</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-gradient-brand">Omnicraft</span>
            <span className="hidden sm:inline ml-1 text-[10px] uppercase tracking-widest font-semibold text-white bg-gradient-brand rounded-full px-2 py-0.5">
              {role === "creator" ? "Creator" : "Client"}
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <HeaderBtn to="/notifications" active={isActive("/notifications")}>
              <Heart className="w-5 h-5" />
            </HeaderBtn>
            <HeaderBtn to="/messages" active={isActive("/messages")}>
              <MessageCircle className="w-5 h-5" />
            </HeaderBtn>
            <button
              onClick={() => signOut()}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
              title="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-around">
          <NavLink to="/home" icon={<HomeIcon className="w-5 h-5" />} label="Home" active={isActive("/home")} />
          <NavLink to="/explore" icon={<Search className="w-5 h-5" />} label="Explore" active={isActive("/explore")} />
          <NavLink to="/create" icon={<PlusSquare className="w-5 h-5" />} label="Create" active={isActive("/create")} />
          <NavLink to="/jobs" icon={<Briefcase className="w-5 h-5" />} label="Jobs" active={isActive("/jobs")} />

          <NavLink to="/profile" icon={<UserIcon className="w-5 h-5" />} label="Profile" active={isActive("/profile")} />
        </div>
      </nav>
    </div>
  );
}

function HeaderBtn({ to, active, children }: { to: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      to={to}
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
      className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-md transition min-w-[56px] ${
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <span className={active ? "text-brand" : ""}>{icon}</span>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}
