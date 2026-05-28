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
  const isCreator = role === "creator";
  const theme = isCreator
    ? { active: "text-emerald-600", logo: "from-emerald-500 via-teal-500 to-cyan-500" }
    : { active: "text-fuchsia-600", logo: "from-indigo-500 via-fuchsia-500 to-pink-500" };

  const isActive = (p: string) => location.pathname === p || (p !== "/home" && location.pathname.startsWith(p));

  return (
    <div className="min-h-screen flex flex-col font-sans relative" data-role={role}>
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-rose-50 via-violet-50 to-cyan-50" />
      <div className="fixed -top-32 -left-32 w-96 h-96 bg-fuchsia-300/40 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="fixed top-1/3 -right-32 w-[28rem] h-[28rem] bg-cyan-300/40 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: "1s" }} />
      <div className="fixed -bottom-32 left-1/4 w-[26rem] h-[26rem] bg-amber-200/50 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDelay: "2s" }} />
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/home" className={`text-2xl font-black tracking-tight bg-gradient-to-r ${theme.logo} bg-clip-text text-transparent`}>
            Omnicraft
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/notifications" className="relative p-2 hover:bg-gray-100 rounded-full">
              <Heart className={`w-6 h-6 ${isActive('/notifications') ? 'fill-current text-red-500' : 'text-gray-700'}`} />
            </Link>
            <Link to="/messages" className="relative p-2 hover:bg-gray-100 rounded-full">
              <MessageCircle className={`w-6 h-6 ${isActive('/messages') ? theme.active : 'text-gray-700'}`} />
            </Link>
            <button onClick={() => signOut()} className="p-2 hover:bg-gray-100 rounded-full" title="Sign out">
              <LogOut className="w-5 h-5 text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-around">
          <NavLink to="/home" icon={<HomeIcon className="w-6 h-6" />} active={isActive('/home')} color={theme.active} />
          <NavLink to="/explore" icon={<Search className="w-6 h-6" />} active={isActive('/explore')} color={theme.active} />
          <NavLink to="/create" icon={<PlusSquare className="w-6 h-6" />} active={isActive('/create')} color={theme.active} />
          <NavLink to="/jobs" icon={<Briefcase className="w-6 h-6" />} active={isActive('/jobs')} color={theme.active} />
          <NavLink to="/profile" icon={<UserIcon className="w-6 h-6" />} active={isActive('/profile')} color={theme.active} />
        </div>
      </nav>
    </div>
  );
}

function NavLink({ to, icon, active, color }: { to: string; icon: React.ReactNode; active: boolean; color: string }) {
  return (
    <Link to={to} className="flex flex-col items-center gap-1 p-2">
      <span className={`transition-transform hover:scale-110 ${active ? color : 'text-gray-600'}`}>{icon}</span>
    </Link>
  );
}
