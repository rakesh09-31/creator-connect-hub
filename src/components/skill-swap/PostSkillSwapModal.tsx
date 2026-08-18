/**
 * OmniCraft – Post Skill Swap Modal (v2)
 *
 * 4-Step Progressive Workflow:
 *   Step 1: Skill Profile Builder (Hierarchical Role -> Skill -> Sub-skills -> Software -> Specialties -> Declared Level -> Learning Target -> Details)
 *   Step 2: AI Voice Verification (Technical speech/voice questions, 0 HR fluff)
 *   Step 3: Mock Assessment (Interactive multi-format written exam)
 *   Step 4: Assessment Result & Review (Declared vs Demonstrated level, 6-competency bars, confidence badge, publish)
 *
 * Fully supports Custom Roles, Custom Skills, Custom Sub-Skills, and Custom Specialties with live DB persistence.
 */

import { useEffect, useState } from "react";
import { Plus, X, ArrowRight, Save, Sparkles, AlertCircle, Check, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Modal } from "./SharedUI";
import AIVoiceVerification from "./AIVoiceVerification";
import MockAssessment from "./MockAssessment";
import AssessmentResult from "./AssessmentResult";
import {
  ROLES,
  RoleCategory,
  getSkillsForRole,
  getSubSkillsForSkill,
  getSoftwareForSkill,
  getSpecialtiesForSoftware,
  getGeneralSpecialtiesForSkill,
  SkillDef,
  RoleDef,
} from "@/lib/skill-hierarchy";
import { CreatorSkillProfile, QuestionDifficulty } from "@/lib/assessment-engine";
import type { AIResult } from "./AIVoiceVerification";
import type { MockResult } from "./MockAssessment";

const SKILL_LEVELS: QuestionDifficulty[] = ["Beginner", "Intermediate", "Advanced", "Expert"];
const EXPERIENCE_OPTIONS = [
  "Less than 6 months",
  "6–12 months",
  "1–2 years",
  "2–5 years",
  "5+ years",
];
const AVAILABILITY_OPTIONS = ["Weekdays", "Weekends", "Flexible"];
const LEARNING_MODES = ["Online", "Offline", "Both"];

export default function PostSkillSwapModal({
  onClose,
  onCreated,
  existingListing = null,
}: {
  onClose: () => void;
  onCreated: () => void;
  existingListing?: any;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [busy, setBusy] = useState(false);

  // ── Step 1: Teaching profile ──────────────────────────────
  const [roleCategory, setRoleCategory] = useState<string>("All");
  const [roleSearch, setRoleSearch] = useState<string>("");
  const [role, setRole] = useState<string>(existingListing?.role || "");
  const [teachSkill, setTeachSkill] = useState<string>("");
  const [teachSubSkills, setTeachSubSkills] = useState<string[]>([]);
  const [teachSoftware, setTeachSoftware] = useState<string[]>([]);
  const [teachSpecialties, setTeachSpecialties] = useState<Record<string, string[]>>({});
  const [declaredLevel, setDeclaredLevel] = useState<QuestionDifficulty>("Intermediate");
  const [experienceDuration, setExperienceDuration] = useState<string>("");

  // ── Step 1: Learning profile ──────────────────────────────
  const [learnRole, setLearnRole] = useState<string>("");
  const [learnSkill, setLearnSkill] = useState<string>("");
  const [learnSubSkills, setLearnSubSkills] = useState<string[]>([]);
  const [learnSoftware, setLearnSoftware] = useState<string[]>([]);
  const [desiredLevel, setDesiredLevel] = useState<string>("Intermediate");
  const [learnRequirements, setLearnRequirements] = useState<string>("");

  // ── Step 1: General Details ────────────────────────────────
  const [description, setDescription] = useState<string>(existingListing?.description || "");
  const [learningMode, setLearningMode] = useState<string>(existingListing?.learning_mode || "Online");
  const [availability, setAvailability] = useState<string[]>(
    existingListing?.availability ? existingListing.availability.split(", ") : ["Flexible"]
  );

  // ── Custom Item Modals ────────────────────────────────────
  const [customRoleModal, setCustomRoleModal] = useState(false);
  const [customRoleName, setCustomRoleName] = useState("");

  const [customSkillModal, setCustomSkillModal] = useState<{ open: boolean; target: "teach" | "learn" }>({ open: false, target: "teach" });
  const [customSkillName, setCustomSkillName] = useState("");

  const [customSubSkillModal, setCustomSubSkillModal] = useState(false);
  const [customSubSkillName, setCustomSubSkillName] = useState("");

  const [customSpecialtyModal, setCustomSpecialtyModal] = useState(false);
  const [customSpecialtyName, setCustomSpecialtyName] = useState("");

  const [customRolesList, setCustomRolesList] = useState<RoleDef[]>([]);
  const [customSkillsList, setCustomSkillsList] = useState<{ id: string; name: string }[]>([]);

  // ── Step 1 sub-view ───────────────────────────────────────
  const [step1View, setStep1View] = useState<
    "role" | "teach_skill" | "teach_subskills" | "teach_software" | "teach_specialties" | "teach_level" | "learn_role" | "learn_skill" | "learn_details" | "general"
  >("role");

  // ── Assessment results ────────────────────────────────────
  const [voiceResult, setVoiceResult] = useState<AIResult | null>(null);
  const [mockResult, setMockResult] = useState<MockResult | null>(null);

  useEffect(() => {
    loadCustomItems();
  }, []);

  const loadCustomItems = async () => {
    try {
      const { data: skillsData } = await (supabase as any).from("skills").select("id, name").eq("is_custom", true).order("name");
      if (skillsData) setCustomSkillsList(skillsData);

      const { data: rolesData } = await (supabase as any).from("professional_roles").select("id, name, category, description").eq("is_custom", true);
      if (rolesData) {
        const mapped: RoleDef[] = rolesData.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: (r.category || "Custom") as RoleCategory,
          description: r.description || "Custom role created by user",
          skills: [],
        }));
        setCustomRolesList(mapped);
      }
    } catch (e) {
      // ignore
    }
  };

  // ── Derived profile object for the AI assessor ────────────
  const creatorProfile: CreatorSkillProfile = {
    role,
    primarySkill: teachSkill,
    skills: teachSkill ? [teachSkill] : [],
    subSkills: teachSubSkills,
    software: teachSoftware,
    specialties: Object.values(teachSpecialties).flat(),
    declaredLevel,
    experienceDuration,
  };

  // ── Validation ────────────────────────────────────────────
  const validateStep1 = () => {
    if (!role) { toast.error("Please select your professional role"); return false; }
    if (!teachSkill) { toast.error("Please select a skill you can teach"); return false; }
    if (!declaredLevel) { toast.error("Please select your skill level"); return false; }
    if (!learnSkill) { toast.error("Please select a skill you want to learn"); return false; }
    if (availability.length === 0) { toast.error("Select your availability"); return false; }
    return true;
  };

  // ── Custom Role Handler ───────────────────────────────────
  const handleAddCustomRole = async () => {
    if (!customRoleName.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await (supabase as any)
        .from("professional_roles")
        .insert({
          name: customRoleName.trim(),
          role_type: "creator",
          is_custom: true,
          created_by: user?.id,
          category: "Custom",
        })
        .select("id, name, category, description")
        .single();

      if (error) throw error;

      const newRole: RoleDef = {
        id: data.id,
        name: data.name,
        category: "Custom",
        description: "Custom user role",
        skills: [],
      };

      setCustomRolesList(prev => [...prev, newRole]);
      setRole(data.name);
      setCustomRoleModal(false);
      setCustomRoleName("");
      toast.success(`Role '${data.name}' created!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create custom role");
    } finally {
      setBusy(false);
    }
  };

  // ── Custom Skill Handler ──────────────────────────────────
  const handleAddCustomSkill = async () => {
    if (!customSkillName.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("skills")
        .insert({ name: customSkillName.trim(), is_custom: true, created_by: user?.id })
        .select("id, name")
        .single();

      if (error) throw error;

      setCustomSkillsList((prev) => [...prev, data]);
      if (customSkillModal.target === "teach") setTeachSkill(data.name);
      else setLearnSkill(data.name);

      setCustomSkillModal({ open: false, target: "teach" });
      setCustomSkillName("");
      toast.success(`Skill '${data.name}' added!`);
    } catch (err: any) {
      toast.error(err.message || "Failed to add custom skill");
    } finally {
      setBusy(false);
    }
  };

  // ── Custom Sub-Skill Handler ──────────────────────────────
  const handleAddCustomSubSkill = () => {
    if (!customSubSkillName.trim()) return;
    const name = customSubSkillName.trim();
    if (!teachSubSkills.includes(name)) {
      setTeachSubSkills(prev => [...prev, name]);
    }
    setCustomSubSkillModal(false);
    setCustomSubSkillName("");
    toast.success(`Sub-skill '${name}' added!`);
  };

  // ── Custom Specialty Handler ──────────────────────────────
  const handleAddCustomSpecialty = () => {
    if (!customSpecialtyName.trim()) return;
    const name = customSpecialtyName.trim();
    const primaryKey = teachSoftware[0] || "general";
    const current = teachSpecialties[primaryKey] || [];
    if (!current.includes(name)) {
      setTeachSpecialties({
        ...teachSpecialties,
        [primaryKey]: [...current, name],
      });
    }
    setCustomSpecialtyModal(false);
    setCustomSpecialtyName("");
    toast.success(`Specialty '${name}' added!`);
  };

  // ── Final Submit ──────────────────────────────────────────
  const submitFinal = async () => {
    if (!user) return;
    setBusy(true);
    try {
      let listingId = existingListing?.id;

      const combinedScore = voiceResult && mockResult
        ? Math.round(voiceResult.overall_score * 0.4 + mockResult.overall_score * 0.6)
        : mockResult?.overall_score || voiceResult?.overall_score || null;

      const demonstratedLevel = mockResult?.demonstrated_level || voiceResult?.verified_level || declaredLevel;
      const confidence = mockResult?.verification_confidence || "low";

      const payload = {
        user_id: user.id,
        title: `${role} swapping ${teachSkill} for ${learnSkill}`,
        role,
        description,
        learning_mode: learningMode,
        availability: availability.join(", "),
        is_active: true,
        verification_status: (combinedScore || 0) >= 50 ? "verified" : "pending",
        overall_score: combinedScore,
        theory_score: mockResult?.theory_score || null,
        technical_score: mockResult?.technical_score || null,
        scenario_score: mockResult?.scenario_score || null,
        practical_score: mockResult?.practical_score || null,
        software_score: mockResult?.software_score || null,
        troubleshooting_score: mockResult?.troubleshooting_score || null,
        decision_making_score: mockResult?.decision_making_score || null,
        communication_score: mockResult?.communication_score || null,
        technical_knowledge_score: mockResult?.technical_score || null,
        skill_level: declaredLevel,
        declared_level: declaredLevel,
        demonstrated_level: demonstratedLevel,
        verification_confidence: confidence,
        stage2_score: voiceResult?.overall_score || null,
        stage3_score: mockResult?.overall_score || null,
        strengths_summary: mockResult?.strengths?.join("; ") || voiceResult?.strengths || null,
        weaknesses_summary: mockResult?.weaknesses?.join("; ") || voiceResult?.weaknesses || null,
        recommendations_summary: mockResult?.recommendations?.join("; ") || null,
        ai_feedback: `Verified ${demonstratedLevel} level in ${teachSkill} with ${combinedScore}% composite score across theory, technical, scenario, practical, software, and troubleshooting dimensions.`,
        experience_duration: experienceDuration || null,
        ai_verified_at: new Date().toISOString(),
      };

      if (listingId) {
        const { error } = await supabase.from("skill_swap_listings").update(payload).eq("id", listingId);
        if (error) {
          // Retry with core fields if any newly added column is missing
          const corePayload = {
            user_id: user.id,
            title: payload.title,
            role: payload.role,
            description: payload.description,
            learning_mode: payload.learning_mode,
            availability: payload.availability,
            is_active: true,
            verification_status: payload.verification_status,
            overall_score: payload.overall_score,
            skill_level: payload.skill_level,
            declared_level: payload.declared_level,
            demonstrated_level: payload.demonstrated_level,
            scenario_score: payload.scenario_score,
            recommendations_summary: payload.recommendations_summary,
            experience_duration: payload.experience_duration,
          };
          const { error: coreErr } = await supabase.from("skill_swap_listings").update(corePayload).eq("id", listingId);
          if (coreErr) throw coreErr;
        }
        try {
          await supabase.from("skill_swap_listing_teach_skills").delete().eq("listing_id", listingId);
          await supabase.from("skill_swap_listing_learn_skills").delete().eq("listing_id", listingId);
          await supabase.from("skill_swap_specialties").delete().eq("listing_id", listingId);
        } catch (e) {
          console.warn("Clean child rows fallback:", e);
        }
      } else {
        const { data, error } = await supabase.from("skill_swap_listings").insert(payload).select("id").single();
        if (error) {
          // Retry with core fields if any column is missing in schema
          const corePayload = {
            user_id: user.id,
            title: payload.title,
            role: payload.role,
            description: payload.description,
            learning_mode: payload.learning_mode,
            availability: payload.availability,
            is_active: true,
            verification_status: payload.verification_status,
            overall_score: payload.overall_score,
            skill_level: payload.skill_level,
            declared_level: payload.declared_level,
            demonstrated_level: payload.demonstrated_level,
            scenario_score: payload.scenario_score,
            recommendations_summary: payload.recommendations_summary,
            experience_duration: payload.experience_duration,
          };
          const { data: coreData, error: coreErr } = await supabase.from("skill_swap_listings").insert(corePayload).select("id").single();
          if (coreErr) throw coreErr;
          listingId = coreData.id;
        } else {
          listingId = data.id;
        }
      }

      // Find or create teach skill safely
      try {
        let teachSkillId: string | undefined;
        const { data: existingTeach } = await supabase.from("skills").select("id").eq("name", teachSkill).maybeSingle();
        if (existingTeach) {
          teachSkillId = existingTeach.id;
        } else {
          const { data: inserted } = await supabase.from("skills").insert({ name: teachSkill }).select("id").single();
          teachSkillId = inserted?.id;
        }

        if (teachSkillId && listingId) {
          const allSpecialties = Object.values(teachSpecialties).flat();
          await supabase.from("skill_swap_listing_teach_skills").insert({
            listing_id: listingId,
            skill_id: teachSkillId,
            skill_name: teachSkill,
            skill_level: declaredLevel,
            sub_skills: teachSubSkills,
            software: teachSoftware,
            specialties: allSpecialties,
          });

          if (allSpecialties.length > 0) {
            await supabase.from("skill_swap_specialties").insert(
              allSpecialties.map((sp) => ({ listing_id: listingId, skill_id: teachSkillId!, specialty_name: sp }))
            );
          }
        }
      } catch (teachErr) {
        console.warn("Teach skills insertion fallback:", teachErr);
      }

      // Find or create learn skill safely
      try {
        let learnSkillId: string | undefined;
        const { data: existingLearn } = await supabase.from("skills").select("id").eq("name", learnSkill).maybeSingle();
        if (existingLearn) {
          learnSkillId = existingLearn.id;
        } else {
          const { data: inserted } = await supabase.from("skills").insert({ name: learnSkill }).select("id").single();
          learnSkillId = inserted?.id;
        }

        if (learnSkillId && listingId) {
          await supabase.from("skill_swap_listing_learn_skills").insert({
            listing_id: listingId,
            skill_id: learnSkillId,
            skill_name: learnSkill,
            desired_level: desiredLevel,
            requirements: learnRequirements,
            sub_skills: learnSubSkills,
            desired_software: learnSoftware,
          });
        }
      } catch (learnErr) {
        console.warn("Learn skills insertion fallback:", learnErr);
      }

      toast.success(existingListing ? "Skill Swap listing updated!" : "Skill Swap listing verified and published!");
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Failed to publish listing");
    } finally {
      setBusy(false);
    }
  };

  // ── Helper: chip multi-select ─────────────────────────────
  const ChipSelect = ({
    options,
    selected,
    onToggle,
    multi = true,
  }: {
    options: string[];
    selected: string[] | string;
    onToggle: (val: string) => void;
    multi?: boolean;
  }) => (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const isSelected = multi ? (selected as string[]).includes(opt) : selected === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              isSelected
                ? "bg-primary/10 text-primary border-primary"
                : "bg-muted text-foreground/70 border-border hover:border-primary/40"
            }`}
          >
            {isSelected && <Check className="inline w-3 h-3 mr-1 -mt-0.5" />}
            {opt}
          </button>
        );
      })}
    </div>
  );

  const toggleItem = (list: string[], setter: (v: string[]) => void, val: string) => {
    setter(list.includes(val) ? list.filter((x) => x !== val) : [...list, val]);
  };

  // Combine built-in and custom roles
  const allRoles = [...ROLES, ...customRolesList];
  const filteredRoles = allRoles.filter((r) => {
    const matchesCategory = roleCategory === "All" || r.category === roleCategory;
    const matchesSearch = r.name.toLowerCase().includes(roleSearch.toLowerCase()) || r.description.toLowerCase().includes(roleSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const roleSkills = getSkillsForRole(role);
  const subSkillGroups = teachSkill ? getSubSkillsForSkill(teachSkill) : [];
  const softwareDefs = teachSkill ? getSoftwareForSkill(teachSkill) : [];
  const generalSpecialties = teachSkill ? getGeneralSpecialtiesForSkill(teachSkill) : [];

  const learnRoleSkills = getSkillsForRole(learnRole);
  const learnSubSkillGroups = learnSkill ? getSubSkillsForSkill(learnSkill) : [];
  const learnSoftwareDefs = learnSkill ? getSoftwareForSkill(learnSkill) : [];

  // ── STEP TITLES ───────────────────────────────────────────
  const stepTitle = () => {
    if (step === 1) {
      const views: Record<string, string> = {
        role: "Step 1: Select Your Professional Role",
        teach_skill: "Step 1: Skill You Can Teach",
        teach_subskills: "Step 1: Specific Sub-Skills",
        teach_software: "Step 1: Software / Tools You Use",
        teach_specialties: "Step 1: Your Specialties",
        teach_level: "Step 1: Declared Skill Level",
        learn_role: "Step 1: Target Learning Field",
        learn_skill: "Step 1: Skill You Want to Learn",
        learn_details: "Step 1: Learning Goals & Software",
        general: "Step 1: Availability & Description",
      };
      return views[step1View] || "Step 1: Skill Profile";
    }
    if (step === 2) return "Step 2: AI Technical Voice Assessment";
    if (step === 3) return "Step 3: Interactive Mock Assessment";
    return "Step 4: Skill Verification Report";
  };

  // ── STEP 1 RENDER ─────────────────────────────────────────
  const renderStep1 = () => {
    const views = ["role", "teach_skill", "teach_subskills", "teach_software", "teach_specialties", "teach_level", "learn_role", "learn_skill", "learn_details", "general"];
    const currentIdx = views.indexOf(step1View);
    const progress = Math.round(((currentIdx + 1) / views.length) * 100);

    return (
      <div className="space-y-5">
        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">
            <span>Step 1 of 4: Profile Configuration</span>
            <span>{progress}% complete</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>

        {/* ── 1. ROLE SELECTION ── */}
        {step1View === "role" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">What is your primary professional role?</h3>
              <p className="text-xs text-muted-foreground">Select from 50+ specialized creator & technical disciplines.</p>
            </div>

            {/* Category tabs */}
            <div className="flex flex-wrap gap-1 border-b border-border pb-2">
              {["All", "Creative", "Technology", "Business / Marketing", "Communication"].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setRoleCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    roleCategory === cat
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Search roles (e.g. Video Editor, React, UI/UX, Python)..."
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>

            {/* Roles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {filteredRoles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRole(r.name);
                    setTeachSkill("");
                    setTeachSubSkills([]);
                    setTeachSoftware([]);
                    setTeachSpecialties({});
                  }}
                  className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                    role === r.name
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-surface text-foreground/80 border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-foreground">{r.name}</span>
                    {role === r.name && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-2">{r.description}</p>
                </button>
              ))}
            </div>

            {/* Add Custom Role Button */}
            <button
              type="button"
              onClick={() => setCustomRoleModal(true)}
              className="w-full py-2 bg-muted border border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Custom Role
            </button>

            <button
              type="button"
              disabled={!role}
              onClick={() => setStep1View("teach_skill")}
              className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              Continue to Skill Selection <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ── 2. TEACH SKILL ── */}
        {step1View === "teach_skill" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">Which exact skill do you teach?</h3>
              <p className="text-xs text-muted-foreground">
                In OmniCraft, <strong>Role ≠ Skill</strong>. Choose the exact discipline you offer for {role}.
              </p>
            </div>

            <div className="space-y-2">
              {roleSkills.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    setTeachSkill(s.name);
                    setTeachSubSkills([]);
                    setTeachSoftware([]);
                    setTeachSpecialties({});
                  }}
                  className={`w-full p-3.5 rounded-xl text-xs border text-left transition-all ${
                    teachSkill === s.name
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-surface text-foreground/80 border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-foreground">{s.name}</span>
                    {teachSkill === s.name && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{s.description}</p>
                </button>
              ))}

              {customSkillsList.map((cs) => (
                <button
                  key={cs.id}
                  type="button"
                  onClick={() => {
                    setTeachSkill(cs.name);
                    setTeachSubSkills([]);
                    setTeachSoftware([]);
                    setTeachSpecialties({});
                  }}
                  className={`w-full p-3.5 rounded-xl text-xs border text-left transition-all ${
                    teachSkill === cs.name
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-surface text-foreground/80 border-border hover:border-primary/40"
                  }`}
                >
                  <span className="font-bold text-sm text-foreground">{cs.name}</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCustomSkillModal({ open: true, target: "teach" })}
              className="w-full py-2 bg-muted border border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Custom Skill
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep1View("role")} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl font-semibold text-sm">
                Back
              </button>
              <button
                type="button"
                disabled={!teachSkill}
                onClick={() => setStep1View("teach_subskills")}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 3. TEACH SUB-SKILLS ── */}
        {step1View === "teach_subskills" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">Select your sub-skills in {teachSkill}</h3>
              <p className="text-xs text-muted-foreground">Select all specific technical competencies you possess.</p>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {subSkillGroups.map((group) => (
                <div key={group.category} className="bg-surface border border-border/50 rounded-xl p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">{group.category}</p>
                  <ChipSelect
                    options={group.items}
                    selected={teachSubSkills}
                    onToggle={(v) => toggleItem(teachSubSkills, setTeachSubSkills, v)}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCustomSubSkillModal(true)}
              className="w-full py-2 bg-muted border border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Custom Sub-Skill
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep1View("teach_skill")} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl font-semibold text-sm">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep1View(softwareDefs.length > 0 ? "teach_software" : "teach_specialties")}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 4. TEACH SOFTWARE ── */}
        {step1View === "teach_software" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">Which software & tools do you use for {teachSkill}?</h3>
              <p className="text-xs text-muted-foreground">The AI examiner will ask software-specific workflow questions only for selected tools.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {softwareDefs.map((sw) => {
                const isSelected = teachSoftware.includes(sw.name);
                return (
                  <button
                    key={sw.name}
                    type="button"
                    onClick={() => toggleItem(teachSoftware, setTeachSoftware, sw.name)}
                    className={`p-3 rounded-xl text-xs font-semibold border text-left transition-all ${
                      isSelected
                        ? "bg-primary/10 text-primary border-primary"
                        : "bg-surface text-foreground/80 border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{sw.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep1View("teach_subskills")} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl font-semibold text-sm">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep1View("teach_specialties")}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 5. TEACH SPECIALTIES ── */}
        {step1View === "teach_specialties" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">Your Key Specialties</h3>
              <p className="text-xs text-muted-foreground">Choose specific focus areas for your technical examination.</p>
            </div>

            {teachSoftware.map((sw) => {
              const specs = getSpecialtiesForSoftware(teachSkill, sw);
              if (specs.length === 0) return null;
              const selectedForSw = teachSpecialties[sw] || [];
              return (
                <div key={sw} className="bg-surface border border-border/50 rounded-xl p-3 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-brand">{sw} Specialties</p>
                  <ChipSelect
                    options={specs}
                    selected={selectedForSw}
                    onToggle={(v) => {
                      const updated = selectedForSw.includes(v)
                        ? selectedForSw.filter((x) => x !== v)
                        : [...selectedForSw, v];
                      setTeachSpecialties({ ...teachSpecialties, [sw]: updated });
                    }}
                  />
                </div>
              );
            })}

            {generalSpecialties.length > 0 && (
              <div className="bg-surface border border-border/50 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">General Specialties</p>
                <ChipSelect
                  options={generalSpecialties}
                  selected={teachSpecialties["general"] || []}
                  onToggle={(v) => {
                    const current = teachSpecialties["general"] || [];
                    const updated = current.includes(v) ? current.filter((x) => x !== v) : [...current, v];
                    setTeachSpecialties({ ...teachSpecialties, general: updated });
                  }}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setCustomSpecialtyModal(true)}
              className="w-full py-2 bg-muted border border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Custom Specialty
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep1View(softwareDefs.length > 0 ? "teach_software" : "teach_subskills")}
                className="flex-1 py-2.5 bg-muted text-foreground rounded-xl font-semibold text-sm"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep1View("teach_level")}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 6. TEACH LEVEL ── */}
        {step1View === "teach_level" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">What is your declared skill level in {teachSkill}?</h3>
              <p className="text-xs text-muted-foreground">The AI examiner will assess you against this target level and verify your demonstrated capability.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {SKILL_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDeclaredLevel(lvl)}
                  className={`p-4 rounded-xl text-xs font-semibold border text-center transition-all ${
                    declaredLevel === lvl
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-surface text-foreground/80 border-border hover:border-primary/40"
                  }`}
                >
                  <p className="text-base font-bold mb-1">{lvl}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {lvl === "Beginner" && "Foundational knowledge & basic tools"}
                    {lvl === "Intermediate" && "Standard workflows & troubleshooting"}
                    {lvl === "Advanced" && "Complex optimization & trade-offs"}
                    {lvl === "Expert" && "Deep pipelines & system design"}
                  </p>
                </button>
              ))}
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">How long have you been practicing this skill?</label>
              <ChipSelect
                options={EXPERIENCE_OPTIONS}
                selected={experienceDuration}
                onToggle={(v) => setExperienceDuration(v)}
                multi={false}
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep1View("teach_specialties")} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl font-semibold text-sm">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep1View("learn_role")}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                Set Learning Goals <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 7. LEARN ROLE ── */}
        {step1View === "learn_role" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">What field do you want to learn in exchange?</h3>
              <p className="text-xs text-muted-foreground">We will find reciprocal creators to swap skills with.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {allRoles.slice(0, 16).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setLearnRole(r.name); setLearnSkill(""); setLearnSubSkills([]); setLearnSoftware([]); }}
                  className={`p-2.5 rounded-xl text-xs font-semibold border text-left transition-all ${
                    learnRole === r.name
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-surface text-foreground/80 border-border hover:border-primary/40"
                  }`}
                >
                  <span className="truncate block">{r.name}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep1View("teach_level")} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl font-semibold text-sm">
                Back
              </button>
              <button
                type="button"
                disabled={!learnRole}
                onClick={() => setStep1View("learn_skill")}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 8. LEARN SKILL ── */}
        {step1View === "learn_skill" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">Which skill do you want to learn in {learnRole}?</h3>
            </div>

            <div className="space-y-2">
              {learnRoleSkills.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setLearnSkill(s.name)}
                  className={`w-full p-3 rounded-xl text-xs font-bold border text-left transition-all ${
                    learnSkill === s.name
                      ? "bg-primary/10 text-primary border-primary"
                      : "bg-surface text-foreground/80 border-border hover:border-primary/40"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setCustomSkillModal({ open: true, target: "learn" })}
              className="w-full py-2 bg-muted border border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Custom Skill
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep1View("learn_role")} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl font-semibold text-sm">
                Back
              </button>
              <button
                type="button"
                disabled={!learnSkill}
                onClick={() => setStep1View("learn_details")}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 9. LEARN DETAILS ── */}
        {step1View === "learn_details" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">What level do you want to reach in {learnSkill}?</h3>
            </div>

            <ChipSelect
              options={["Beginner", "Intermediate", "Advanced"]}
              selected={desiredLevel}
              onToggle={(v) => setDesiredLevel(v)}
              multi={false}
            />

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">Specific goals or project requirements</label>
              <textarea
                value={learnRequirements}
                onChange={(e) => setLearnRequirements(e.target.value)}
                placeholder="e.g. I want to build a full portfolio website, or learn how to grade S-Log3 footage..."
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep1View("learn_skill")} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl font-semibold text-sm">
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep1View("general")}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── 10. GENERAL DETAILS ── */}
        {step1View === "general" && (
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">Availability & Preferences</h3>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">When are you available for swap sessions?</label>
              <ChipSelect
                options={AVAILABILITY_OPTIONS}
                selected={availability}
                onToggle={(v) => toggleItem(availability, setAvailability, v)}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Learning Mode</label>
              <ChipSelect
                options={LEARNING_MODES}
                selected={learningMode}
                onToggle={(v) => setLearningMode(v)}
                multi={false}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Public Swap Pitch (Bio)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`I have experience in ${teachSkill} (${declaredLevel}) and want to swap knowledge with someone skilled in ${learnSkill}...`}
                rows={4}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs resize-none focus:outline-none focus:ring-2 focus:ring-ring/40"
              />
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep1View("learn_details")} className="flex-1 py-2.5 bg-muted text-foreground rounded-xl font-semibold text-sm">
                Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) {
                    setStep(2);
                  }
                }}
                className="flex-1 py-3 bg-primary text-primary-foreground rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              >
                Proceed to AI Verification <ShieldCheck className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal onClose={onClose} title={stepTitle()}>
      <div className="p-5">
        {step === 1 && renderStep1()}

        {step === 2 && (
          <AIVoiceVerification
            profile={creatorProfile}
            onCancel={() => setStep(1)}
            onComplete={(res) => {
              setVoiceResult(res);
              setStep(3);
            }}
          />
        )}

        {step === 3 && (
          <MockAssessment
            profile={creatorProfile}
            stage2Result={voiceResult}
            onCancel={() => setStep(2)}
            onComplete={(res) => {
              setMockResult(res);
              setStep(4);
            }}
          />
        )}

        {step === 4 && (
          <AssessmentResult
            profile={creatorProfile}
            voiceResult={voiceResult}
            mockResult={mockResult}
            busy={busy}
            onBack={() => setStep(1)}
            onPublish={submitFinal}
          />
        )}
      </div>

      {/* ── CUSTOM ROLE MODAL ── */}
      {customRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm">Add Custom Role</h4>
              <button onClick={() => setCustomRoleModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={customRoleName}
              onChange={(e) => setCustomRoleName(e.target.value)}
              placeholder="e.g. AI Prompt Engineer, Unreal Engine Technical Artist..."
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <div className="flex gap-2">
              <button onClick={() => setCustomRoleModal(false)} className="flex-1 py-2 bg-muted text-foreground rounded-lg text-xs font-semibold">
                Cancel
              </button>
              <button
                disabled={!customRoleName.trim() || busy}
                onClick={handleAddCustomRole}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-40"
              >
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM SKILL MODAL ── */}
      {customSkillModal.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm">Add Custom Skill</h4>
              <button onClick={() => setCustomSkillModal({ open: false, target: "teach" })} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={customSkillName}
              onChange={(e) => setCustomSkillName(e.target.value)}
              placeholder="e.g. Rust Systems Programming, Character Animation..."
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <div className="flex gap-2">
              <button onClick={() => setCustomSkillModal({ open: false, target: "teach" })} className="flex-1 py-2 bg-muted text-foreground rounded-lg text-xs font-semibold">
                Cancel
              </button>
              <button
                disabled={!customSkillName.trim() || busy}
                onClick={handleAddCustomSkill}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-40"
              >
                Save Skill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM SUB-SKILL MODAL ── */}
      {customSubSkillModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm">Add Custom Sub-Skill</h4>
              <button onClick={() => setCustomSubSkillModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={customSubSkillName}
              onChange={(e) => setCustomSubSkillName(e.target.value)}
              placeholder="e.g. Planar Motion Tracking, Custom GLSL Shaders..."
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <div className="flex gap-2">
              <button onClick={() => setCustomSubSkillModal(false)} className="flex-1 py-2 bg-muted text-foreground rounded-lg text-xs font-semibold">
                Cancel
              </button>
              <button
                disabled={!customSubSkillName.trim()}
                onClick={handleAddCustomSubSkill}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-40"
              >
                Add Sub-Skill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM SPECIALTY MODAL ── */}
      {customSpecialtyModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex justify-between items-center">
              <h4 className="font-bold text-sm">Add Custom Specialty</h4>
              <button onClick={() => setCustomSpecialtyModal(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={customSpecialtyName}
              onChange={(e) => setCustomSpecialtyName(e.target.value)}
              placeholder="e.g. Frequency Separation, Next.js Server Actions..."
              className="w-full px-3 py-2 bg-background border border-border rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-ring/40"
            />
            <div className="flex gap-2">
              <button onClick={() => setCustomSpecialtyModal(false)} className="flex-1 py-2 bg-muted text-foreground rounded-lg text-xs font-semibold">
                Cancel
              </button>
              <button
                disabled={!customSpecialtyName.trim()}
                onClick={handleAddCustomSpecialty}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold disabled:opacity-40"
              >
                Add Specialty
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
