import { useEffect, useState, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Search, Plus, X, Star, Sparkles, Clock, Check, AlertCircle } from "lucide-react";
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

const ROLE_SPECIALTIES: Record<string, string[]> = {
  "Actor": ["Film Acting", "Action", "Dialogue", "Theatre", "Voice Acting", "Commercials", "Method Acting", "Improv"],
  "Video Editor": ["YouTube Editing", "Short Form Content", "Color Grading", "Commercials", "Documentary", "Music Videos", "Sound Design", "VFX"],
  "Dancer": ["Contemporary", "Hip Hop", "Choreography", "Ballet", "Jazz", "Street Dance", "Freestyle"],
  "Photographer": ["Portrait", "Commercial", "Fashion", "Event", "Street Photography", "Product", "Landscape"],
  "Singer": ["Pop", "Classical", "R&B", "Jazz", "Playback", "Rock", "Acoustic", "Hip Hop"],
  "Designer": ["Brand Identity", "UI/UX", "Typography", "Illustrations", "Packaging", "Motion Graphics", "Thumbnails"],
  "Writer": ["Screenwriting", "Copywriting", "Creative Writing", "Fiction", "Technical Writing", "Poetry", "SEO Content"],
  "Content Creator": ["Vlogging", "Reels & Shorts", "Storytelling", "Livestreaming", "Tech Reviews", "Lifestyle"],
  "Voice Artist": ["Audiobooks", "Character Voices", "Narration", "Commercials", "Dubbing", "Podcasts"],
};

const DEFAULT_SPECIALTIES = [
  "Film Acting", "Action", "Dialogue", "YouTube Editing", "Short Form Content", "Color Grading",
  "Commercials", "Brand Identity", "UI/UX", "Portrait", "Contemporary", "Storytelling"
];

function CreatorOnboardingPage() {
  const navigate = useNavigate();
  const { user, profile, refresh } = useAuth();
  
  // Steps: 1 = Roles, 2 = Skills, 3 = Specialties, 4 = Experience
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Data
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);

  // State
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  
  const [searchSkill, setSearchSkill] = useState("");
  const [searchSpecialty, setSearchSpecialty] = useState("");
  
  const [customRoleInput, setCustomRoleInput] = useState("");
  const [customSkillInput, setCustomSkillInput] = useState("");
  const [customSpecialtyInput, setCustomSpecialtyInput] = useState("");
  
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [showCustomSkill, setShowCustomSkill] = useState(false);
  const [showCustomSpecialty, setShowCustomSpecialty] = useState(false);

  const [experienceLevel, setExperienceLevel] = useState<string>("Intermediate");
  const [experienceYears, setExperienceYears] = useState<string>("");

  useEffect(() => {
    if (profile?.onboarded) {
      navigate({ to: "/home", replace: true });
      return;
    }
  }, [profile, navigate]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      const [skillsRes, rolesRes, userSkillsRes, userSpecRes] = await Promise.all([
        supabase.from("skills").select("id, name").eq("is_custom", false).order("name"),
        supabase.from("creator_roles").select("role_id, professional_roles(id, name)").eq("creator_id", user.id),
        supabase.from("creator_skills").select("skill_id, skills(id, name)").eq("creator_id", user.id),
        supabase.from("creator_specialties").select("specialty").eq("user_id", user.id),
      ]);

      if (skillsRes.data) setAvailableSkills(skillsRes.data);

      const existingRoles = (rolesRes.data || [])
        .map((x: any) => x.professional_roles)
        .filter(Boolean);

      if (existingRoles.length > 0) {
        setSelectedRoles(existingRoles.map((r: any) => ({ ...r, emoji: "✨" })));
      }

      const existingSkills = (userSkillsRes.data || [])
        .map((x: any) => x.skills)
        .filter(Boolean);

      if (existingSkills.length > 0) {
        setSelectedSkills(existingSkills);
      }

      const existingSpecialties = (userSpecRes.data || [])
        .map((x: any) => x.specialty)
        .filter(Boolean);

      if (existingSpecialties.length > 0) {
        setSelectedSpecialties(existingSpecialties);
      }

      if (profile?.experience_level) {
        setExperienceLevel(profile.experience_level);
      }
      if (profile?.experience_years != null) {
        setExperienceYears(String(profile.experience_years));
      }

      // Resume at appropriate step based on progress
      if (existingRoles.length > 0 && existingSkills.length === 0) {
        setStep(2);
      } else if (existingRoles.length > 0 && existingSkills.length > 0 && existingSpecialties.length === 0) {
        setStep(3);
      }
    }
    loadData();
  }, [user, profile]);

  // Compute available specialties dynamically based on selected roles
  const suggestedSpecialties = useMemo(() => {
    const list = new Set<string>();
    selectedRoles.forEach((r) => {
      const specs = ROLE_SPECIALTIES[r.name] || [];
      specs.forEach((s) => list.add(s));
    });
    if (list.size === 0) {
      DEFAULT_SPECIALTIES.forEach((s) => list.add(s));
    }
    return Array.from(list);
  }, [selectedRoles]);

  const handleAddCustomRole = async () => {
    if (!customRoleInput.trim() || !user) return;
    const name = customRoleInput.trim();
    
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

  const handleAddCustomSpecialty = () => {
    const val = customSpecialtyInput.trim();
    if (!val) return;
    const normalized = val.charAt(0).toUpperCase() + val.slice(1);
    if (!selectedSpecialties.some(s => s.toLowerCase() === normalized.toLowerCase())) {
      setSelectedSpecialties([...selectedSpecialties, normalized]);
    }
    setCustomSpecialtyInput("");
    setShowCustomSpecialty(false);
  };

  const toggleCuratedRole = async (curatedName: string, emoji: string) => {
    if (!user) return;
    const existingIndex = selectedRoles.findIndex(r => r.name === curatedName);
    if (existingIndex >= 0) {
      setSelectedRoles(selectedRoles.filter((_, i) => i !== existingIndex));
      return;
    }
    
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
    if (selectedSkills.find(x => x.id === s.id)) {
      setSelectedSkills(selectedSkills.filter(x => x.id !== s.id));
    } else {
      setSelectedSkills([...selectedSkills, s]);
    }
  };

  const toggleSpecialty = (spec: string) => {
    if (selectedSpecialties.includes(spec)) {
      setSelectedSpecialties(selectedSpecialties.filter(x => x !== spec));
    } else {
      setSelectedSpecialties([...selectedSpecialties, spec]);
    }
  };

  const handleContinueStep1 = async () => {
    if (!user) return;
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one professional role.");
      return;
    }
    setSaving(true);
    try {
      const roleRows = selectedRoles.map(r => ({ creator_id: user.id, role_id: r.id }));
      await supabase.from("creator_roles").upsert(roleRows, { onConflict: "creator_id,role_id" });
      await supabase.from("profiles").update({ account_type: "creator", role: "creator" }).eq("id", user.id);
      setStep(2);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleContinueStep2 = async () => {
    if (!user) return;
    if (selectedSkills.length === 0) {
      toast.error("Please select at least one skill.");
      return;
    }
    setSaving(true);
    try {
      await supabase.from("creator_skills").delete().eq("creator_id", user.id);
      const skillRows = selectedSkills.map(s => ({ creator_id: user.id, skill_id: s.id }));
      await supabase.from("creator_skills").insert(skillRows);
      setStep(3);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleContinueStep3 = async () => {
    if (!user) return;
    if (selectedSpecialties.length === 0) {
      toast.error("Please select at least one specialty.");
      return;
    }
    setSaving(true);
    try {
      await supabase.from("creator_specialties").delete().eq("user_id", user.id);
      const specRows = selectedSpecialties.map(sp => ({ user_id: user.id, specialty: sp }));
      await supabase.from("creator_specialties").insert(specRows);
      setStep(4);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    if (!user) return;
    
    // Strict requirement validation
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one professional role.");
      setStep(1);
      return;
    }
    if (selectedSkills.length === 0) {
      toast.error("Please select at least one skill.");
      setStep(2);
      return;
    }
    if (selectedSpecialties.length === 0) {
      toast.error("Please select at least one specialty.");
      setStep(3);
      return;
    }

    setSaving(true);
    try {
      // 1. Save roles
      const roleRows = selectedRoles.map(r => ({ creator_id: user.id, role_id: r.id }));
      await supabase.from("creator_roles").upsert(roleRows, { onConflict: "creator_id,role_id" });

      // 2. Save skills
      await supabase.from("creator_skills").delete().eq("creator_id", user.id);
      const skillRows = selectedSkills.map(s => ({ creator_id: user.id, skill_id: s.id }));
      await supabase.from("creator_skills").insert(skillRows);

      // 3. Save specialties
      await supabase.from("creator_specialties").delete().eq("user_id", user.id);
      const specRows = selectedSpecialties.map(sp => ({ user_id: user.id, specialty: sp }));
      await supabase.from("creator_specialties").insert(specRows);

      // 4. Finalize profile
      await supabase.from("profiles").update({ 
        onboarded: true,
        role: "creator",
        account_type: "creator",
        experience_level: experienceLevel || "Intermediate",
        experience_years: experienceYears ? parseInt(experienceYears) : null
      }).eq("id", user.id);
      
      await refresh();
      toast.success("Profile setup complete! Welcome to OmniCraft.");
      navigate({ to: "/home" });
    } catch (e: any) {
      toast.error(e.message);
    } finally { 
      setSaving(false); 
    }
  };

  const filteredSkills = availableSkills.filter(s => s.name.toLowerCase().includes(searchSkill.toLowerCase()));
  const filteredSpecialties = suggestedSpecialties.filter(s => s.toLowerCase().includes(searchSpecialty.toLowerCase()));

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
            <h1 className="text-2xl font-black text-foreground tracking-tight">Creator Profile Setup</h1>
            <div className="flex items-center gap-4 mt-2">
              <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Step {step} of 4</span>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === step ? 'w-8 bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]' 
                    : i < step ? 'w-4 bg-purple-500/50' 
                    : 'w-4 bg-muted'
                  }`} />
                ))}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-muted/60 px-3 py-1.5 rounded-full border border-border">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>AI Matching Setup</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto grow custom-scrollbar">
          {/* STEP 1: ROLES */}
          {step === 1 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">What is your primary role?</h2>
                <p className="text-muted-foreground mt-2 text-lg">Select at least 1 professional role (required)</p>
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
                  <span className="font-bold text-foreground tracking-wide">Other Role</span>
                </button>
              </div>

              {selectedRoles.length > 0 && (
                <div className="mt-8 pt-6 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                    Selected Roles ({selectedRoles.length})
                  </h3>
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
                    <h3 className="text-2xl font-black text-foreground mb-2">Add custom role</h3>
                    <p className="text-muted-foreground mb-6">What is your creative profession?</p>
                    
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

          {/* STEP 2: SKILLS (REQUIRED) */}
          {step === 2 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-purple-500/30">
                  <Star className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-foreground">What are your skills?</h2>
                <p className="text-muted-foreground mt-2">
                  Select at least 1 technical skill or tool you use (required)
                </p>
              </div>

              {selectedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-4 bg-surface rounded-2xl border border-border">
                  {selectedSkills.map(s => (
                    <span key={s.id} className="inline-flex items-center gap-1 bg-purple-500/20 text-purple-500 px-3 py-1.5 rounded-lg text-sm font-bold border border-purple-500/30">
                      <Check className="w-3.5 h-3.5" /> {s.name}
                      <button onClick={() => toggleSkill(s)} className="hover:bg-purple-500/40 rounded-full p-0.5 ml-1"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Skills are mandatory for AI matching. Please select at least 1 skill.</span>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="text" value={searchSkill} onChange={(e) => setSearchSkill(e.target.value)}
                  placeholder="Search skills (e.g. Video Editing, Acting, Photoshop)..."
                  className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl focus:outline-none focus:border-purple-500 text-foreground transition-colors" />
              </div>

              <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                {filteredSkills.map(s => {
                  const isSel = selectedSkills.some(x => x.id === s.id);
                  return (
                    <button key={s.id} onClick={() => toggleSkill(s)}
                      className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${
                        isSel ? "border-purple-500 bg-purple-500/20 text-purple-500 shadow-sm"
                          : "border-border bg-surface hover:border-purple-500/50 text-foreground hover:bg-muted"
                      }`}>
                      {isSel ? `✓ ${s.name}` : s.name}
                    </button>
                  );
                })}
              </div>

              {showCustomSkill ? (
                <div className="flex gap-2">
                  <input autoFocus value={customSkillInput} onChange={(e) => setCustomSkillInput(e.target.value)} placeholder="E.g. DaVinci Resolve, Voice Acting"
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

          {/* STEP 3: SPECIALTIES (REQUIRED) */}
          {step === 3 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-fuchsia-500/20 text-fuchsia-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-fuchsia-500/30">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-foreground">What are your specialties?</h2>
                <p className="text-muted-foreground mt-2">
                  Select at least 1 creative specialty or niche area (required)
                </p>
              </div>

              {selectedSpecialties.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-4 bg-surface rounded-2xl border border-border">
                  {selectedSpecialties.map(sp => (
                    <span key={sp} className="inline-flex items-center gap-1 bg-fuchsia-500/20 text-fuchsia-500 px-3 py-1.5 rounded-lg text-sm font-bold border border-fuchsia-500/30">
                      <Check className="w-3.5 h-3.5" /> {sp}
                      <button onClick={() => toggleSpecialty(sp)} className="hover:bg-fuchsia-500/40 rounded-full p-0.5 ml-1"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>Specialties are mandatory for AI matching. Please select at least 1 specialty.</span>
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input type="text" value={searchSpecialty} onChange={(e) => setSearchSpecialty(e.target.value)}
                  placeholder="Search specialties (e.g. YouTube Editing, Film Acting, Short Form)..."
                  className="w-full pl-12 pr-4 py-4 bg-background border border-border rounded-xl focus:outline-none focus:border-fuchsia-500 text-foreground transition-colors" />
              </div>

              <div className="flex flex-wrap gap-2 max-h-[250px] overflow-y-auto pr-2 pb-2 custom-scrollbar">
                {filteredSpecialties.map(sp => {
                  const isSel = selectedSpecialties.includes(sp);
                  return (
                    <button key={sp} onClick={() => toggleSpecialty(sp)}
                      className={`px-4 py-2 rounded-full border text-sm font-bold transition-all ${
                        isSel ? "border-fuchsia-500 bg-fuchsia-500/20 text-fuchsia-500 shadow-sm"
                          : "border-border bg-surface hover:border-fuchsia-500/50 text-foreground hover:bg-muted"
                      }`}>
                      {isSel ? `✓ ${sp}` : sp}
                    </button>
                  );
                })}
              </div>

              {showCustomSpecialty ? (
                <div className="flex gap-2">
                  <input autoFocus value={customSpecialtyInput} onChange={(e) => setCustomSpecialtyInput(e.target.value)} placeholder="E.g. Action, Music Videos, TikTok Strategy"
                    className="flex-1 px-4 py-3 bg-background border border-border rounded-xl focus:outline-none focus:border-fuchsia-500 text-foreground" />
                  <button onClick={handleAddCustomSpecialty} className="px-6 py-3 bg-fuchsia-600 text-white rounded-xl font-bold hover:bg-fuchsia-500 transition-colors">Add</button>
                  <button onClick={() => setShowCustomSpecialty(false)} className="px-4 py-3 border border-border rounded-xl font-bold text-muted-foreground hover:bg-muted">Cancel</button>
                </div>
              ) : (
                <button onClick={() => setShowCustomSpecialty(true)}
                  className="w-full py-4 border-2 border-dashed border-border text-muted-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-muted hover:border-fuchsia-500/50 hover:text-fuchsia-500 transition-colors">
                  <Plus className="w-5 h-5" /> Add custom specialty
                </button>
              )}
            </div>
          )}

          {/* STEP 4: EXPERIENCE LEVEL */}
          {step === 4 && (
            <div className="space-y-8 animate-fade-in">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-pink-500/30">
                  <Clock className="w-8 h-8" />
                </div>
                <h2 className="text-3xl font-black text-foreground">Experience Level</h2>
                <p className="text-muted-foreground mt-2">Help clients and AI match you with the right opportunities</p>
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

              {/* Summary verification pill */}
              <div className="p-4 rounded-xl bg-surface border border-border text-xs space-y-2">
                <p className="font-bold text-muted-foreground uppercase tracking-wider">Your Matching Profile Summary:</p>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="font-semibold text-foreground">Roles:</span>
                  {selectedRoles.map(r => <span key={r.name} className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500 font-semibold">{r.name}</span>)}
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="font-semibold text-foreground">Skills:</span>
                  {selectedSkills.map(s => <span key={s.name} className="px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-500 font-semibold">{s.name}</span>)}
                </div>
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="font-semibold text-foreground">Specialties:</span>
                  {selectedSpecialties.map(sp => <span key={sp} className="px-2 py-0.5 rounded-full bg-fuchsia-500/15 text-fuchsia-500 font-semibold">{sp}</span>)}
                </div>
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
            <button 
              onClick={() => {
                if (step === 1) {
                  handleContinueStep1();
                } else if (step === 2) {
                  handleContinueStep2();
                } else if (step === 3) {
                  handleContinueStep3();
                } else {
                  handleFinish();
                }
              }} 
              disabled={saving}
              className="px-8 py-3 bg-[linear-gradient(135deg,#7c3aed,#c026d3_55%,#3b82f6)] text-white rounded-xl font-black tracking-wide flex items-center gap-2 hover:opacity-90 transition-all shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] disabled:opacity-50">
              {saving ? "Saving..." : step < 4 ? "Continue" : "Complete Profile"}
              {!saving && <ArrowRight className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
