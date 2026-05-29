import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Users, UserPlus, Trash2, ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/squads/$squadId")({
  component: SquadDetailPage,
});

type Squad = { id: string; name: string; description: string | null; specialty: string | null; owner_id: string };
type Member = { id: string; user_id: string; role: string; profile?: { username: string; full_name: string | null; avatar_url: string | null; role: string | null } };

function SquadDetailPage() {
  const { squadId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: s } = await supabase.from("squads").select("*").eq("id", squadId).maybeSingle();
    setSquad(s as Squad | null);
    const { data: m } = await supabase.from("squad_members").select("*").eq("squad_id", squadId);
    const list = (m ?? []) as Member[];
    const ids = list.map((x) => x.user_id);
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, full_name, avatar_url, role").in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      list.forEach((mm) => (mm.profile = map.get(mm.user_id)));
    }
    setMembers(list);
    setLoading(false);
  };

  useEffect(() => { load(); }, [squadId]);

  const isOwner = squad && user && squad.owner_id === user.id;
  const isMember = members.some((m) => m.user_id === user?.id);

  const join = async () => {
    if (!user) return;
    const { error } = await supabase.from("squad_members").insert({ squad_id: squadId, user_id: user.id, role: "member" });
    if (error) { toast.error(error.message); return; }
    toast.success("Joined squad");
    load();
  };

  const leave = async () => {
    if (!user) return;
    await supabase.from("squad_members").delete().eq("squad_id", squadId).eq("user_id", user.id);
    toast.success("Left squad");
    load();
  };

  const removeMember = async (uid: string) => {
    await supabase.from("squad_members").delete().eq("squad_id", squadId).eq("user_id", uid);
    load();
  };

  const deleteSquad = async () => {
    if (!confirm("Delete this squad? This cannot be undone.")) return;
    await supabase.from("squads").delete().eq("id", squadId);
    toast.success("Squad deleted");
    navigate({ to: "/squads" });
  };

  if (loading) return <div className="text-center py-16 text-gray-500">Loading...</div>;
  if (!squad) return <div className="text-center py-16 text-gray-500">Squad not found</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <button onClick={() => navigate({ to: "/squads" })} className="flex items-center gap-1 text-sm text-gray-600 mb-4 hover:text-gray-900">
        <ArrowLeft className="w-4 h-4" /> All squads
      </button>

      <div className="rounded-3xl p-8 text-white shadow-lg bg-gradient-to-br from-fuchsia-600 via-pink-600 to-orange-500">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-3xl font-black border-2 border-white/40">
            {squad.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{squad.name}</h1>
            {squad.specialty && <p className="mt-1 text-white/90 text-sm">{squad.specialty}</p>}
            {squad.description && <p className="mt-2 text-sm text-white/90">{squad.description}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {!isMember && <button onClick={join} className="px-4 py-1.5 bg-white text-pink-700 rounded-xl text-sm font-bold">Join</button>}
              {isMember && !isOwner && <button onClick={leave} className="px-4 py-1.5 bg-white/20 text-white rounded-xl text-sm font-bold">Leave</button>}
              {isOwner && <button onClick={deleteSquad} className="px-4 py-1.5 bg-white/20 text-white rounded-xl text-sm font-bold flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5" /> Members ({members.length})</h2>
        {isOwner && (
          <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
            <UserPlus className="w-4 h-4" /> Add member
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {members.map((m) => (
          <div key={m.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">
              {m.profile?.avatar_url ? <img src={m.profile.avatar_url} className="w-full h-full rounded-full object-cover" /> : (m.profile?.username ?? "?").slice(0, 1).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{m.profile?.full_name || m.profile?.username}</p>
              <p className="text-xs text-gray-500">@{m.profile?.username} · {m.role}</p>
            </div>
            {isOwner && m.user_id !== squad.owner_id && (
              <button onClick={() => removeMember(m.user_id)} className="p-1.5 hover:bg-red-50 rounded-full text-red-500"><Trash2 className="w-4 h-4" /></button>
            )}
          </div>
        ))}
      </div>

      {showAdd && isOwner && <AddMemberModal squadId={squad.id} existing={members.map((m) => m.user_id)} onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function AddMemberModal({ squadId, existing, onClose, onAdded }: { squadId: string; existing: string[]; onClose: () => void; onAdded: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim();
      if (!term) { setResults([]); return; }
      const { data } = await supabase.from("profiles").select("id, username, full_name, avatar_url, role")
        .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`).limit(10);
      setResults((data ?? []).filter((p: any) => !existing.includes(p.id)));
    }, 200);
    return () => clearTimeout(t);
  }, [q, existing]);

  const add = async (uid: string) => {
    const { error } = await supabase.from("squad_members").insert({ squad_id: squadId, user_id: uid, role: "member" });
    if (error) { toast.error(error.message); return; }
    toast.success("Added");
    onAdded();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Add Member</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username or name..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 mb-3" />
        <div className="space-y-2">
          {results.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold">
                {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full rounded-full object-cover" /> : p.username.slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.full_name || p.username}</p>
                <p className="text-xs text-gray-500">@{p.username}</p>
              </div>
              <button onClick={() => add(p.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Add</button>
            </div>
          ))}
          {q && results.length === 0 && <p className="text-center text-sm text-gray-500 py-4">No matches</p>}
        </div>
      </div>
    </div>
  );
}
