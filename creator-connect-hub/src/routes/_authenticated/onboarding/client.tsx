import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Video, Clapperboard, MonitorPlay, Gamepad2, Music, User } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/onboarding/client")({
  component: ClientFieldPage,
});

const FIELDS = [
  { id: "Director", icon: Clapperboard },
  { id: "Producer", icon: Video },
  { id: "YouTuber", icon: MonitorPlay },
  { id: "Gamer", icon: Gamepad2 },
  { id: "Music Composer", icon: Music },
  { id: "Other", icon: User },
];

function ClientFieldPage() {
  const navigate = useNavigate();
  const { user, refresh } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const [custom, setCustom] = useState("");
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!selected || !user) return;
    const field = selected === "Other" && custom.trim() ? custom.trim() : selected;
    setSaving(true);
    try {
      await supabase.from("profiles").update({ client_field: field, onboarded: true }).eq("id", user.id);
      await refresh();
      toast.success("Welcome to Omnicraft!");
      navigate({ to: "/home" });
    } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-cyan-600 to-teal-500 flex items-center justify-center p-6">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">What's Your Role?</h1>
          <p className="text-xl text-white/90">Select your field to find the perfect creators for your needs</p>
        </div>
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {FIELDS.map(f => {
              const Icon = f.icon;
              const isSel = selected === f.id;
              return (
                <button key={f.id} onClick={() => setSelected(f.id)}
                  className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                    isSel ? "border-blue-600 bg-blue-50 text-blue-600"
                      : "border-gray-100 hover:border-blue-200 hover:bg-gray-50 text-gray-600"
                  }`}>
                  <Icon className={`w-8 h-8 ${isSel ? "text-blue-600" : "text-gray-400"}`} />
                  <span className="font-semibold">{f.id}</span>
                </button>
              );
            })}
          </div>
          {selected === "Other" && (
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Type your field..."
              className="w-full mb-6 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500" />
          )}
          <button onClick={handleContinue} disabled={!selected || saving}
            className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 ${
              selected ? "bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-500 text-white hover:opacity-90"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}>
            {saving ? "Saving..." : "Continue"} <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
