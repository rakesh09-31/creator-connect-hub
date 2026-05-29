import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Users, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/squads")({
  head: () => ({ meta: [{ title: "Squads — Omnicraft" }] }),
  component: SquadsPage,
});

type Squad = { id: string; name: string; description: string | null; specialty: string | null; owner_id: string };

function SquadsPage() {
  const { user } = useAuth();
  const [mySquads, setMySquads] = useState<Squad[]>([]);
  const [allSquads, setAllSquads] = useState<Squad[]>([]);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    if (!user) return;
    const { data: mems } = await supabase
      .from("squad_members")
      .select("squads:squad_id(*)")
      .eq("user_id", user.id);
    const mine = ((mems ?? []).map((m: any) => m.squads).filter(Boolean)) as Squad[];
    setMySquads(mine);

    const { data: all } = await supabase.from("squads").select("*").order("created_at", { ascending: false }).limit(30);
    setAllSquads((all ?? []) as Squad[]);
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Squads</h1>
          <p className="text-sm text-gray-600 mt-1">Form teams of creators to win bigger projects together</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Squad
        </button>
      </div>

      <section className="mb-8">
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Your squads</h2>
        {mySquads.length === 0 ? (
          <div className="bg-white/80 backdrop-blur rounded-2xl p-6 text-center text-gray-600 border border-white">
            You're not in any squads yet. Create one or join below.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {mySquads.map((s) => <SquadCard key={s.id} squad={s} />)}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Discover squads</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {allSquads.map((s) => <SquadCard key={s.id} squad={s} />)}
        </div>
      </section>

      {showCreate && <CreateSquadModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); load(); }} />}
    </div>
  );
}

function SquadCard({ squad }: { squad: Squad }) {
  return (
    <Link to="/squads/$squadId" params={{ squadId: squad.id }} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition flex items-center gap-3">
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-500 flex items-center justify-center text-white font-black text-xl flex-shrink-0">
        {squad.name.slice(0, 1).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-bold truncate">{squad.name}</p>
        {squad.specialty && <p className="text-xs text-fuchsia-600 font-semibold">{squad.specialty}</p>}
        {squad.description && <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{squad.description}</p>}
      </div>
    </Link>
  );
}

function CreateSquadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.from("squads").insert({
      owner_id: user.id,
      name: name.trim(),
      specialty: specialty.trim() || null,
      description: description.trim() || null,
    }).select().single();
    if (error || !data) { setBusy(false); toast.error(error?.message ?? "Failed"); return; }
    // Add owner as member
    await supabase.from("squad_members").insert({ squad_id: data.id, user_id: user.id, role: "owner" });
    setBusy(false);
    toast.success("Squad created");
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Users className="w-5 h-5" /> New Squad</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Squad name" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-fuchsia-500" />
          <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Focus (e.g. Wedding films, Brand design)" className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-fuchsia-500" />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What does this squad do?" rows={4} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-fuchsia-500 resize-none" />
          <button disabled={busy} className="w-full py-3 bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-bold rounded-xl disabled:opacity-60">
            {busy ? "Creating..." : "Create Squad"}
          </button>
        </form>
      </div>
    </div>
  );
}
