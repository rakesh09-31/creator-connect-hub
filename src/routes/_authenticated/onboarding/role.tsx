import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Briefcase, Palette, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/onboarding/role")({
  component: SelectRolePage,
});

function SelectRolePage() {
  const navigate = useNavigate();
  const { user, profile, refresh } = useAuth();
  const [selected, setSelected] = useState<"creator" | "client" | null>(null);
  const [saving, setSaving] = useState(false);

  // Guard: if this user already has a role, never show role selection again.
  useEffect(() => {
    if (profile?.role) {
      navigate({ to: "/home", replace: true });
    }
  }, [profile, navigate]);

  const handleContinue = async () => {
    if (!selected || !user) return;
    // Double-check: do NOT overwrite an existing role
    const { data: existing } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (existing?.role) {
      toast.error("Your account already has a role assigned. Redirecting...");
      navigate({ to: "/home", replace: true });
      return;
    }
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ role: selected })
        .eq("id", user.id);
      if (pErr) { toast.error(pErr.message); return; }
      await supabase.from("user_roles").upsert({ user_id: user.id, role: selected }, { onConflict: "user_id,role" });
      await refresh();
      navigate({ to: selected === "creator" ? "/onboarding/specialty" : "/onboarding/client" });
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Choose Your Path</h1>
          <p className="text-xl text-white/90">How will you be using Omnicraft?</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <RoleCard
              active={selected === "creator"}
              onClick={() => setSelected("creator")}
              icon={<Palette className="w-10 h-10 text-white" />}
              title="I'm a Creator"
              desc="Showcase your work, build your portfolio, and get hired for amazing projects"
              bullets={["Build professional portfolio", "Join creative squads", "Apply to client projects", "Share your creative work"]}
              accent="indigo"
              gradient="from-indigo-500 to-purple-500"
            />
            <RoleCard
              active={selected === "client"}
              onClick={() => setSelected("client")}
              icon={<Briefcase className="w-10 h-10 text-white" />}
              title="I'm a Client"
              desc="Find talented creators and squads to bring your projects to life"
              bullets={["Post projects with budget", "Browse creator portfolios", "Review squad applications", "Hire the best talent"]}
              accent="blue"
              gradient="from-blue-500 to-cyan-500"
            />
          </div>
          <button onClick={handleContinue} disabled={!selected || saving}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              selected ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}>
            {saving ? "Saving..." : "Continue"} <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, icon, title, desc, bullets, accent, gradient }: any) {
  const colorMap: Record<string, string> = {
    indigo: "border-indigo-600 bg-indigo-50 hover:border-indigo-300",
    blue: "border-blue-600 bg-blue-50 hover:border-blue-300",
  };
  const dotMap: Record<string, string> = { indigo: "bg-indigo-600", blue: "bg-blue-600" };
  return (
    <button onClick={onClick}
      className={`relative p-8 rounded-2xl border-4 transition-all hover:scale-105 text-left ${
        active ? colorMap[accent] + " shadow-lg" : "border-gray-200 bg-white hover:border-gray-300"
      }`}>
      {active && (
        <div className={`absolute top-4 right-4 w-8 h-8 ${dotMap[accent]} rounded-full flex items-center justify-center`}>
          <Check className="w-5 h-5 text-white" />
        </div>
      )}
      <div className={`w-20 h-20 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center mx-auto mb-6`}>{icon}</div>
      <h3 className="text-2xl font-bold mb-3 text-center">{title}</h3>
      <p className="text-gray-600 text-sm mb-4 text-center">{desc}</p>
      <div className="space-y-2">
        {bullets.map((b: string) => (
          <div key={b} className="flex items-center gap-2 text-sm text-gray-700">
            <div className={`w-1.5 h-1.5 ${dotMap[accent]} rounded-full`} />
            <span>{b}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
