import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Pencil, Video, Film, Music, Camera, Palette, Code, PenTool, Mic, Radio,
  Laptop, Smartphone, Globe, Layout, Scissors, ArrowRight, Search, Plus, X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/onboarding/specialty")({
  component: SpecialtyPage,
});

const SPECIALTIES = [
  { id: "Content Writer", icon: Pencil, color: "from-blue-500 to-cyan-500" },
  { id: "Videographer", icon: Video, color: "from-red-500 to-pink-500" },
  { id: "Video Editor", icon: Film, color: "from-purple-500 to-indigo-500" },
  { id: "Actor", icon: Film, color: "from-orange-500 to-red-500" },
  { id: "Dancer", icon: Music, color: "from-pink-500 to-rose-500" },
  { id: "Choreographer", icon: Music, color: "from-fuchsia-500 to-purple-500" },
  { id: "Photographer", icon: Camera, color: "from-yellow-500 to-orange-500" },
  { id: "Graphic Designer", icon: Palette, color: "from-green-500 to-teal-500" },
  { id: "UI/UX Designer", icon: Layout, color: "from-indigo-500 to-blue-500" },
  { id: "Web Developer", icon: Code, color: "from-cyan-500 to-blue-500" },
  { id: "Mobile Developer", icon: Smartphone, color: "from-violet-500 to-purple-500" },
  { id: "Illustrator", icon: PenTool, color: "from-rose-500 to-pink-500" },
  { id: "Voice Artist", icon: Mic, color: "from-amber-500 to-orange-500" },
  { id: "Podcaster", icon: Radio, color: "from-emerald-500 to-green-500" },
  { id: "Animator", icon: Film, color: "from-teal-500 to-cyan-500" },
  { id: "3D Artist", icon: Laptop, color: "from-purple-500 to-pink-500" },
  { id: "Social Media Manager", icon: Globe, color: "from-blue-500 to-indigo-500" },
  { id: "Photo Editor", icon: Scissors, color: "from-lime-500 to-green-500" },
];

function SpecialtyPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [custom, setCustom] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const addCustom = () => {
    const v = customInput.trim();
    if (v && !custom.includes(v)) setCustom([...custom, v]);
    setCustomInput(""); setShowCustom(false);
  };

  const filtered = SPECIALTIES.filter(s => s.id.toLowerCase().includes(search.toLowerCase()));
  const total = selected.length + custom.length;

  const handleContinue = async () => {
    if (total === 0 || !user) return;
    setSaving(true);
    try {
      const all = [...selected, ...custom];
      const rows = all.map(specialty => ({ user_id: user.id, specialty }));
      await supabase.from("creator_specialties").insert(rows);
      await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
      await refresh();
      toast.success("Welcome to Omnicraft!");
      navigate({ to: "/home" });
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">Choose Your Specialties</h1>
          <p className="text-xl text-white/90 mb-2">Select all areas you specialize in</p>
          <p className="text-white/70">{total} selected</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search specialties..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6 max-h-[350px] overflow-y-auto pr-2">
            {filtered.map(s => {
              const Icon = s.icon;
              const isSel = selected.includes(s.id);
              return (
                <button key={s.id} onClick={() => toggle(s.id)}
                  className={`relative p-5 rounded-xl border-2 transition-all ${
                    isSel ? "border-indigo-600 bg-indigo-50 shadow-lg scale-105"
                      : "border-gray-200 bg-white hover:border-indigo-300 hover:scale-105"
                  }`}>
                  {isSel && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">✓</span>
                    </div>
                  )}
                  <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-gray-800 text-center leading-tight">{s.id}</p>
                </button>
              );
            })}
          </div>

          {custom.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">Custom:</p>
              <div className="flex flex-wrap gap-2">
                {custom.map(c => (
                  <span key={c} className="inline-flex items-center gap-1 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-semibold">
                    {c}
                    <button onClick={() => setCustom(custom.filter(x => x !== c))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {showCustom ? (
            <div className="flex gap-2 mb-6">
              <input value={customInput} onChange={(e) => setCustomInput(e.target.value)} placeholder="Add custom specialty..."
                className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500" />
              <button onClick={addCustom} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-semibold">Add</button>
              <button onClick={() => setShowCustom(false)} className="px-4 py-2 border-2 border-gray-200 rounded-xl">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setShowCustom(true)}
              className="w-full mb-6 py-3 border-2 border-dashed border-indigo-300 text-indigo-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-indigo-50">
              <Plus className="w-5 h-5" /> Add custom specialty
            </button>
          )}

          <button onClick={handleContinue} disabled={total === 0 || saving}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${
              total > 0 ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white hover:opacity-90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}>
            {saving ? "Saving..." : "Continue"} <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
