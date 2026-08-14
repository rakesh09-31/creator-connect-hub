import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search, Plus, X, Star, Clock, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/onboarding/specialty")({
  component: CreatorOnboardingPage,
});

type Role = { id: string; name: string; emoji?: string };
type Skill = { id: string; name: string };

const CURATED_ROLES = [
  { name: "Actor", emoji: "🎬" },
  { name: "Dancer", emoji: "💃" },
  { name: "Video Editor", emoji: "🎥" },
  { name: "Photographer", emoji: "📸" },
  { name: "Singer", emoji: "🎤" },
  { name: "Designer", emoji: "🎨" },
  { name: "Writer", emoji: "✍️" },
  { name: "Content Creator", emoji: "📱" },
  { name: "Voice Artist", emoji: "🎙️" },
];

function CreatorOnboardingPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Data
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);

  // State
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  
  const [searchSkill, setSearchSkill] = useState("");
  
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [showCustomSkill, setShowCustomSkill] = useState(false);

  const [experienceLevel, setExperienceLevel] = useState<string>("");
  const [experienceYears, setExperienceYears] = useState<string>("");

  useEffect(() => {
    async function loadData() {
      const { data: skills } = await supabase.from("skills")
        .select("id, name")
        .eq("is_custom", false)
        .order("name");
      if (skills) setAvailableSkills(skills);
    }
    loadData();
  }, []);

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
        .insert({ name, role_type: "creator", is_custom: true, created_by: user.id })
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

  const handleAddCustomSkill = async () => {
    if (!customSkillInput.trim() || !user) return;
    const name = customSkillInput.trim();
    
    // First, check if it already exists to avoid unnecessary insert failure
    const { data: existing } = await supabase.from("skills").select("id, name").ilike("name", name).limit(1).maybeSingle();
    
    if (existing) {
      if (!selectedSkills.find(s => s.id === existing.id)) {
        setSelectedSkills([...selectedSkills, existing]);
      }
    } else {
      const { data, error } = await supabase.from("skills")
        .insert({ name, is_custom: true, created_by: user.id })
        .select("id, name")
        .single();
        
      if (error) {
        console.error("Failed to add custom skill:", error);
        toast.error(`Error: ${error.message}`);
        return;
      } else if (data) {
        setSelectedSkills([...selectedSkills, data]);
        setAvailableSkills([...availableSkills, data]);
      }
    }
    setCustomSkillInput("");
    setShowCustomSkill(false);
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
        .insert({ name: curatedName, role_type: "creator", is_custom: false })
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

  const toggleSkill = (s: Skill) => {
    if (selectedSkills.find(x => x.id === s.id)) setSelectedSkills(selectedSkills.filter(x => x.id !== s.id));
    else setSelectedSkills([...selectedSkills, s]);
  };

  const handleContinueStep1 = async () => {
    if (!user) return;
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role to continue.");
      return;
    }
    setSaving(true);
    try {
      // Immediately save roles to database so role_count > 0
      const roleRows = selectedRoles.map(r => ({ creator_id: user.id, role_id: r.id }));
      await supabase.from("creator_roles").upsert(roleRows, { onConflict: "creator_id,role_id" });
      
      // Update profile account_type if it wasn't already set correctly
      await supabase.from("profiles").update({ account_type: "creator" }).eq("id", user.id);
      
      await refresh();
      setStep(2);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Insert skills
      if (selectedSkills.length > 0) {
        const skillRows = selectedSkills.map(s => ({ creator_id: user.id, skill_id: s.id }));
        await supabase.from("creator_skills").upsert(skillRows, { onConflict: "creator_id,skill_id" });
      }
      
      // Update profile
      await supabase.from("profiles").update({ 
        onboarded: true,
        experience_level: experienceLevel || null,
        experience_years: experienceYears ? parseInt(experienceYears) : null
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

  const filteredSkills = availableSkills.filter(s => s.name.toLowerCase().includes(searchSkill.toLowerCase()));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 md:p-8 relative overflow-y-auto">
      {/* Background glowing effects */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full bg-purple-600/15 blur-[120px] animate-pulse-slow [animation-delay:1s]" />
      </div>

      <div className="max-w-4xl w-full bg-surface/80 backdrop-blur-md border border-border rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] relative z-10 animate-fade-up">
        {/* Header */}
        <div className="bg-surface/50 backdrop-blur-md px-8 py-6 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Creator Profile</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Step {step} of 3</span>
              <div className="flex gap-1.5">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === step ? 'w-8 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' 
                    : i < step ? 'w-4 bg-purple-500/50' 
                    : 'w-4 bg-muted'
                  }`} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto grow custom-scrollbar">
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">What do you do?</h2>
                <p className="text-muted-foreground mt-2 text-lg">Choose your roles to get started</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {CURATED_ROLES.map(r => {
                  const isSel = selectedRoles.some(x => x.name === r.name);
                  return (
                    <button key={r.name} onClick={() => toggleCuratedRole(r.name, r.emoji)}
                      className={`relative p-5 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-3 group ${
                        isSel 
                          ? "border-purple-500 bg-purple-500/10 shadow-[0_0_20px_-5px_rgba(168,85,247,0.3)] -translate-y-1" 
                          : "border-border bg-surface hover:bg-muted hover:border-border/80"
                      }`}>
                      {isSel && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
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
                      <span key={r.id || r.name} className="inline-flex items-center gap-2 bg-purple-500/20 text-purple-500 px-4 py-2 rounded-xl text-sm font-bold border border-purple-500/30">
                        {r.emoji} {r.name}
                        <button onClick={() => removeRole(r.id)} className="hover:bg-purple-500/30 rounded-full p-1 transition-colors"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {showCustomRole && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
                  <div className="bg-surface border border-border rounded-3xl p-8 max-w-md w-full shadow-2xl">
                    <h3 className="text-2xl font-black text-foreground mb-2">Add your role</h3>
                    <p className="text-muted-foreground mb-6">What is your role?</p>
                    
                    <input 
                      autoFocus
                      value={customRoleInput} 
                      onChange={(e) => setCustomRoleInput(e.target.value)} 
                      placeholder="e.g. Cinematographer"
                      className="w-full px-4 py-4 bg-background border border-border rounded-xl focus:outline-none focus:border-purple-500 text-foreground font-medium mb-6" 
                    />
                    
                    <div className="flex gap-3">
                      <button onClick={() => setShowCustomRole(false)} className="flex-1 py-3 border border-border rounded-xl font-bold text-muted-foreground hover:bg-muted transition-colors">Cancel</button>
                      <button onClick={handleAddCustomRole} className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors">Add Role</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <Star className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-foreground">What are your skills?</h2>
                <p className="text-muted-foreground mt-2">Tools, software, and abilities you possess</p>
              </div>

              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 bg-surface rounded-2xl border border-border">
                  {selectedSkills.map(s => (
                    <span key={s.id} className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-500 px-3 py-1.5 rounded-lg text-sm font-bold border border-purple-500/30">
                      {s.name}
                      <button onClick={() => toggleSkill(s)} className="hover:bg-purple-500/40 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="text" value={searchSkill} onChange={(e) => setSearchSkill(e.target.value)}
                  placeholder="Search skills..."
                  className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl focus:outline-none focus:border-purple-500 text-foreground transition-colors" />
              </div>

              <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                {filteredSkills.map(s => {
                  const isSel = selectedSkills.some(x => x.id === s.id);
                  return (
                    <button key={s.id} onClick={() => toggleSkill(s)}
                      className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${
                        isSel ? "border-purple-500 bg-purple-500/20 text-purple-500"
                          : "border-border bg-surface hover:border-purple-500/50 text-foreground hover:bg-muted"
                      }`}>
                      {s.name}
                    </button>
                  );
                })}
              </div>

              {showCustomSkill ? (
                <div className="flex gap-2">
                  <input value={customSkillInput} onChange={(e) => setCustomSkillInput(e.target.value)} placeholder="E.g. Final Cut Pro"
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-purple-500 text-foreground" />
                  <button onClick={handleAddCustomSkill} className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 transition-colors">Add</button>
                  <button onClick={() => setShowCustomSkill(false)} className="px-4 py-3 border border-border rounded-xl font-bold text-muted-foreground hover:bg-muted">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setShowCustomSkill(true)}
                  className="w-full py-4 border-2 border-dashed border-border text-muted-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-muted hover:border-purple-500/50 hover:text-purple-500 transition-colors">
                  <Plus className="w-5 h-5" /> Add custom skill
                </button>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pink-500/30">
                  <Clock className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-foreground">Experience Level</h2>
                <p className="text-muted-foreground mt-2">Help clients understand your expertise</p>
              </div>

              <div>
                <div className="grid grid-cols-2 gap-4">
                  {["Beginner", "Intermediate", "Advanced", "Professional"].map(level => (
                    <button key={level} onClick={() => setExperienceLevel(level)}
                      className={`p-5 rounded-2xl border-2 text-center font-black tracking-wide transition-all ${
                        experienceLevel === level 
                          ? "border-pink-500 bg-pink-500/20 text-pink-500 shadow-[0_0_20px_-5px_rgba(236,72,153,0.3)] -translate-y-1" 
                          : "border-border bg-surface text-foreground/70 hover:border-border/80 hover:bg-muted"
                      }`}>
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-foreground/70 mb-3 uppercase tracking-wider">Years of Experience (Optional)</label>
                <input type="number" min="0" max="50" value={experienceYears} onChange={(e) => setExperienceYears(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full px-4 py-4 bg-background border border-border rounded-xl focus:outline-none focus:border-pink-500 text-foreground text-lg font-bold transition-colors placeholder:text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-surface/50 backdrop-blur-md p-6 border-t border-border flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="px-6 py-3 font-bold text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors">
              Back
            </button>
          ) : (
            <div />
          )}
          
          <div className="flex gap-4">
            {step > 1 && (
              <button 
                onClick={() => step < 3 ? setStep(step + 1) : handleFinish()}
                className="px-4 py-3 font-bold text-muted-foreground hover:text-foreground transition-colors">
                Skip for now
              </button>
            )}
            <button 
              onClick={() => {
                if (step === 1) {
                  handleContinueStep1();
                } else if (step < 3) {
                  setStep(step + 1);
                } else {
                  handleFinish();
                }
              }} 
              disabled={saving}
              className="px-8 py-3 bg-[linear-gradient(135deg,#7c3aed,#c026d3_55%,#3b82f6)] text-white rounded-xl font-black tracking-wide flex items-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] disabled:opacity-50">
              {saving ? "Saving..." : step < 3 ? "Continue" : "Complete Profile"}
              {!saving && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
