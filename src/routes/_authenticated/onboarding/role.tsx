import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check } from "lucide-react";
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

  useEffect(() => {
    if (profile?.account_type || profile?.role) {
      if (profile.role_count && profile.role_count > 0) {
        navigate({ to: "/home", replace: true });
      }
    }
  }, [profile, navigate]);

  const handleContinue = async () => {
    if (!selected || !user) return;
    
    setSaving(true);
    try {
      const { error: pErr } = await supabase
        .from("profiles")
        .update({ role: selected, account_type: selected })
        .eq("id", user.id);
      if (pErr) { toast.error(pErr.message); return; }
      
      await supabase.from("user_roles").upsert({ user_id: user.id, role: selected }, { onConflict: "user_id,role" });
      await refresh();
      navigate({ to: selected === "creator" ? "/onboarding/specialty" : "/onboarding/client", replace: true });
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-40 right-1/4 h-[28rem] w-[28rem] rounded-full bg-blue-600/15 blur-[120px] animate-pulse-slow [animation-delay:1s]" />
      </div>

      <div className="max-w-3xl w-full relative z-10 animate-fade-up">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-foreground mb-4 tracking-tight">Create Account</h1>
          <p className="text-xl text-muted-foreground">What are you?</p>
        </div>
        
        <div className="bg-surface/80 backdrop-blur-md rounded-3xl p-8 border border-border shadow-xl">
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <RoleCard
              active={selected === "creator"}
              onClick={() => setSelected("creator")}
              emoji="🎨"
              title="CREATOR"
              accent="purple"
            />
            <RoleCard
              active={selected === "client"}
              onClick={() => setSelected("client")}
              emoji="💼"
              title="CLIENT"
              accent="blue"
            />
          </div>
          
          <button onClick={handleContinue} disabled={!selected || saving}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
              selected ? "bg-[linear-gradient(135deg,#7c3aed,#c026d3_55%,#3b82f6)] text-white shadow-[0_0_30px_-8px_rgba(168,85,247,0.7)] hover:scale-[1.02]"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}>
            {saving ? "Saving..." : "Continue"} <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ active, onClick, emoji, title, accent }: { active: boolean, onClick: () => void, emoji: string, title: string, accent: "purple" | "blue" }) {
  return (
    <button onClick={onClick}
      className={`relative p-8 rounded-2xl border-2 transition-all group hover:-translate-y-1 ${
        active 
          ? accent === 'purple' ? "border-purple-500 bg-purple-500/10 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]" : "border-blue-500 bg-blue-500/10 shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]"
          : "border-border bg-surface hover:border-border/80 hover:bg-muted"
      }`}>
      {active && (
        <div className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center ${accent === 'purple' ? 'bg-purple-500' : 'bg-blue-500'}`}>
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="flex flex-col items-center justify-center space-y-4">
        <span className="text-6xl group-hover:scale-110 transition-transform">{emoji}</span>
        <h3 className="text-2xl font-black tracking-widest text-foreground">{title}</h3>
      </div>
    </button>
  );
}
