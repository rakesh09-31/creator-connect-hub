import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/onboarding/client")({
  component: ClientOnboardingPage,
});

type Role = { id: string; name: string; emoji?: string };

const CURATED_ROLES = [
  { name: "Producer", emoji: "🎬" },
  { name: "Director", emoji: "🎥" },
  { name: "YouTuber", emoji: "▶️" },
  { name: "Gamer", emoji: "🎮" },
  { name: "Filmmaker", emoji: "🎞️" },
  { name: "Brand", emoji: "🏢" },
  { name: "Agency", emoji: "📢" },
  { name: "Event Organizer", emoji: "🎪" },
  { name: "Content Creator", emoji: "📱" },
];

function ClientOnboardingPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  
  const [saving, setSaving] = useState(false);

  // State
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [showCustomRole, setShowCustomRole] = useState(false);

  const handleAddCustomRole = async () => {
    if (!customRoleInput.trim() || !user) return;
    const name = customRoleInput.trim();
    
    // First, check if it already exists to avoid unnecessary insert failure
    const { data: existing } = await supabase.from("professional_roles").select("id, name").ilike("name", name).limit(1).maybeSingle();
    
    if (existing) {
      if (!selectedRoles.find(r => r.id === existing.id)) {
        setSelectedRoles([...selectedRoles, { ...existing, emoji: "✨" }]);
      }
    } else {
      const { data, error } = await supabase.from("professional_roles")
        .insert({ name, role_type: "client", is_custom: true, created_by: user.id })
        .select("id, name")
        .single();
        
      if (error) {
        console.error("Failed to add custom role:", error);
        toast.error(`Error: ${error.message}`);
        return;
      } else if (data) {
        setSelectedRoles([...selectedRoles, { ...data, emoji: "✨" }]);
      }
    }
    setCustomRoleInput("");
    setShowCustomRole(false);
  };

  const toggleCuratedRole = async (curatedName: string, emoji: string) => {
    if (!user) return;
    // Check if it's already selected
    const existingIndex = selectedRoles.findIndex(r => r.name === curatedName);
    if (existingIndex >= 0) {
      setSelectedRoles(selectedRoles.filter((_, i) => i !== existingIndex));
      return;
    }
    
    // Fetch or create the role in professional_roles
    let roleId = "";
    const { data: existingRole } = await supabase.from("professional_roles").select("id").eq("name", curatedName).maybeSingle();
    if (existingRole) {
      roleId = existingRole.id;
    } else {
      const { data: newRole } = await supabase.from("professional_roles")
        .insert({ name: curatedName, role_type: "client", is_custom: false })
        .select("id")
        .single();
      if (newRole) roleId = newRole.id;
    }
    
    if (roleId) {
      setSelectedRoles([...selectedRoles, { id: roleId, name: curatedName, emoji }]);
    }
  };

  const removeRole = (id: string) => {
    setSelectedRoles(selectedRoles.filter(r => r.id !== id));
  };

  const handleFinish = async () => {
    if (!user) return;
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role to continue.");
      return;
    }
    setSaving(true);
    try {
      // Insert roles
      const roleRows = selectedRoles.map(r => ({ client_id: user.id, role_id: r.id }));
      await supabase.from("client_roles").upsert(roleRows, { onConflict: "client_id,role_id" });
      
      // Update profile
      await supabase.from("profiles").update({ 
        account_type: "client",
        onboarded: true 
      }).eq("id", user.id);
      
      await refresh();
      toast.success("Profile setup complete!");
      navigate({ to: "/home" });
    } catch (e: any) {
      toast.error(e.message);
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 relative overflow-y-auto">
      {/* Background glowing effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-20 h-96 w-96 rounded-full bg-blue-600/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-cyan-600/15 blur-[120px] animate-pulse-slow [animation-delay:1s]" />
      </div>

      <div className="max-w-4xl w-full bg-surface/80 backdrop-blur-md border border-border rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] relative z-10 animate-fade-up">
        {/* Header */}
        <div className="bg-surface/50 backdrop-blur-md px-8 py-6 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Client Profile</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Step 1 of 1</span>
              <div className="flex gap-1.5">
                <div className="h-1.5 rounded-full transition-all duration-500 w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto grow custom-scrollbar">
          <div className="space-y-8 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">What type of client are you?</h2>
              <p className="text-muted-foreground mt-2 text-lg">Choose your roles to get started</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {CURATED_ROLES.map(r => {
                const isSel = selectedRoles.some(x => x.name === r.name);
                return (
                  <button key={r.name} onClick={() => toggleCuratedRole(r.name, r.emoji)}
                    className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 group ${
                      isSel 
                        ? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)] -translate-y-1" 
                        : "border-border bg-surface hover:bg-muted hover:border-border/80"
                    }`}>
                    {isSel && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                    <span className="text-4xl group-hover:scale-110 transition-transform">{r.emoji}</span>
                    <span className="font-bold text-foreground tracking-wide">{r.name}</span>
                  </button>
                );
              })}

              <button onClick={() => setShowCustomRole(true)}
                className="relative p-5 rounded-2xl border-2 border-dashed border-border bg-surface hover:bg-muted hover:border-border/80 transition-all flex flex-col items-center justify-center gap-3 group">
                <span className="text-4xl group-hover:scale-110 transition-transform">✨</span>
                <span className="font-bold text-foreground tracking-wide">Other</span>
              </button>
            </div>

            {selectedRoles.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">Selected Roles</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRoles.map(r => (
                    <span key={r.id || r.name} className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-500 px-4 py-2 rounded-xl text-sm font-bold border border-blue-500/30">
                      {r.emoji} {r.name}
                      <button onClick={() => removeRole(r.id)} className="hover:bg-blue-500/30 rounded-full p-1 transition-colors"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {showCustomRole && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                <div className="bg-surface border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl">
                  <h3 className="text-2xl font-black text-foreground mb-2">Add your role</h3>
                  <p className="text-muted-foreground text-sm mb-6">Type a role if you couldn't find it in the list.</p>
                  
                  <input
                    type="text"
                    value={customRoleInput}
                    onChange={e => setCustomRoleInput(e.target.value)}
                    placeholder="e.g. Executive Producer"
                    className="w-full bg-background border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all mb-6"
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleAddCustomRole();
                      if (e.key === 'Escape') setShowCustomRole(false);
                    }}
                  />
                  
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setShowCustomRole(false)}
                      className="px-6 py-2.5 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleAddCustomRole}
                      disabled={!customRoleInput.trim() || saving}
                      className="px-6 py-2.5 rounded-xl font-bold bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      Add Role
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-surface/50 backdrop-blur-md px-8 py-6 border-t border-border flex items-center justify-end shrink-0">
          <button 
            onClick={handleFinish} 
            disabled={saving}
            className="px-8 py-3 bg-[linear-gradient(135deg,#3b82f6,#06b6d4)] text-white rounded-xl font-black tracking-wide flex items-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] disabled:opacity-50">
            {saving ? "Saving..." : "Complete Profile"}
            {!saving && <ArrowRight className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
