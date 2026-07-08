import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Users, UserPlus, Trash2, ArrowLeft, X, Check, Clock, Shield, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/squads/$squadId")({
  component: SquadDetailPage,
});

type Squad = { id: string; name: string; description: string | null; specialty: string | null; owner_id: string };
type Profile = { id: string; username: string; full_name: string | null; avatar_url: string | null; role: string | null };
type Member = { id: string; user_id: string; role: string; profile?: Profile };
type Invite = { id: string; squad_id: string; inviter_id: string; invitee_id: string; status: string; profile?: Profile };
type JoinRequest = { id: string; squad_id: string; user_id: string; message: string | null; status: string; profile?: Profile };

const sb: any = supabase;

function SquadDetailPage() {
  const { squadId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [joinReqs, setJoinReqs] = useState<JoinRequest[]>([]);
  const [myInvite, setMyInvite] = useState<Invite | null>(null);
  const [myRequest, setMyRequest] = useState<JoinRequest | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const hydrateProfiles = async <T extends { user_id?: string; invitee_id?: string }>(rows: T[], key: "user_id" | "invitee_id"): Promise<any[]> => {
    const ids = Array.from(new Set(rows.map((r) => (r as any)[key]).filter(Boolean)));
    if (!ids.length) return rows.map((r) => ({ ...r }));
    const { data } = await supabase.from("profiles").select("id, username, full_name, avatar_url, role").in("id", ids);
    const map = new Map((data ?? []).map((p: any) => [p.id, p]));
    return rows.map((r) => ({ ...r, profile: map.get((r as any)[key]) }));
  };

  const load = async () => {
    const { data: s } = await supabase.from("squads").select("*").eq("id", squadId).maybeSingle();
    setSquad(s as Squad | null);
    const { data: m } = await supabase.from("squad_members").select("*").eq("squad_id", squadId);
    setMembers(await hydrateProfiles((m ?? []) as Member[], "user_id"));

    const { data: inv } = await sb.from("squad_invites").select("*").eq("squad_id", squadId).eq("status", "pending");
    setInvites(await hydrateProfiles((inv ?? []) as Invite[], "invitee_id"));

    const { data: jr } = await sb.from("squad_join_requests").select("*").eq("squad_id", squadId).eq("status", "pending");
    setJoinReqs(await hydrateProfiles((jr ?? []) as JoinRequest[], "user_id"));

    if (user) {
      const { data: mine } = await sb.from("squad_invites").select("*").eq("squad_id", squadId).eq("invitee_id", user.id).eq("status", "pending").maybeSingle();
      setMyInvite(mine as Invite | null);
      const { data: myReq } = await sb.from("squad_join_requests").select("*").eq("squad_id", squadId).eq("user_id", user.id).eq("status", "pending").maybeSingle();
      setMyRequest(myReq as JoinRequest | null);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [squadId, user?.id]);

  const meMember = members.find((m) => m.user_id === user?.id);
  const isOwner = squad && user && squad.owner_id === user.id;
  const isAdmin = isOwner || meMember?.role === "admin";
  const isMember = !!meMember;

  const respondInvite = async (status: "accepted" | "rejected") => {
    if (!myInvite) return;
    await sb.from("squad_invites").update({ status }).eq("id", myInvite.id);
    toast.success(status === "accepted" ? "Joined squad" : "Invite declined");
    load();
  };

  const requestJoin = async () => {
    if (!user) return;
    const { error } = await sb.from("squad_join_requests").insert({ squad_id: squadId, user_id: user.id });
    if (error) { toast.error(error.message); return; }
    toast.success("Request sent");
    load();
  };

  const cancelRequest = async () => {
    if (!myRequest) return;
    await sb.from("squad_join_requests").delete().eq("id", myRequest.id);
    load();
  };

  const respondJoinReq = async (id: string, status: "accepted" | "rejected") => {
    await sb.from("squad_join_requests").update({ status }).eq("id", id);
    load();
  };

  const cancelInvite = async (id: string) => {
    await sb.from("squad_invites").delete().eq("id", id);
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

  const setRole = async (uid: string, role: "member" | "admin") => {
    await supabase.from("squad_members").update({ role }).eq("squad_id", squadId).eq("user_id", uid);
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
              {!isMember && myInvite && (
                <>
                  <button onClick={() => respondInvite("accepted")} className="px-4 py-1.5 bg-white text-pink-700 rounded-xl text-sm font-bold flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Accept invite</button>
                  <button onClick={() => respondInvite("rejected")} className="px-4 py-1.5 bg-white/20 text-white rounded-xl text-sm font-bold">Decline</button>
                </>
              )}
              {!isMember && !myInvite && !myRequest && (
                <button onClick={requestJoin} className="px-4 py-1.5 bg-white text-pink-700 rounded-xl text-sm font-bold">Request to join</button>
              )}
              {!isMember && myRequest && (
                <button onClick={cancelRequest} className="px-4 py-1.5 bg-white/20 text-white rounded-xl text-sm font-bold flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Request pending — cancel</button>
              )}
              {isMember && !isOwner && <button onClick={leave} className="px-4 py-1.5 bg-white/20 text-white rounded-xl text-sm font-bold">Leave</button>}
              {isOwner && <button onClick={deleteSquad} className="px-4 py-1.5 bg-white/20 text-white rounded-xl text-sm font-bold flex items-center gap-1"><Trash2 className="w-3.5 h-3.5" /> Delete</button>}
            </div>
          </div>
        </div>
      </div>

      {isAdmin && joinReqs.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Join requests ({joinReqs.length})</h2>
          <div className="space-y-2">
            {joinReqs.map((r) => (
              <div key={r.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
                <Avatar profile={r.profile} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-gray-900">{r.profile?.full_name || r.profile?.username}</p>
                  <p className="text-xs text-gray-500">@{r.profile?.username}</p>
                </div>
                <button onClick={() => respondJoinReq(r.id, "accepted")} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold">Accept</button>
                <button onClick={() => respondJoinReq(r.id, "rejected")} className="px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-xs font-bold">Reject</button>
              </div>
            ))}
          </div>
        </section>
      )}

      {isAdmin && invites.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Pending invites ({invites.length})</h2>
          <div className="space-y-2">
            {invites.map((i) => (
              <div key={i.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
                <Avatar profile={i.profile} />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate text-gray-900">{i.profile?.full_name || i.profile?.username}</p>
                  <p className="text-xs text-gray-500">@{i.profile?.username} · awaiting response</p>
                </div>
                <button onClick={() => cancelInvite(i.id)} className="p-1.5 hover:bg-red-50 rounded-full text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-lg font-bold flex items-center gap-2 text-gray-900"><Users className="w-5 h-5" /> Members ({members.length})</h2>
        {isAdmin && (
          <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold flex items-center gap-1">
            <UserPlus className="w-4 h-4" /> Invite
          </button>
        )}
      </div>

      <div className="mt-3 space-y-2">
        {members.map((m) => (
          <div key={m.id} className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm flex items-center gap-3">
            <Avatar profile={m.profile} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate text-gray-900">{m.profile?.full_name || m.profile?.username}</p>
              <p className="text-xs text-gray-500">@{m.profile?.username} · {m.role}</p>
            </div>
            {isOwner && m.user_id !== squad.owner_id && (
              <>
                {m.role === "admin" ? (
                  <button onClick={() => setRole(m.user_id, "member")} title="Demote" className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600"><ShieldOff className="w-4 h-4" /></button>
                ) : (
                  <button onClick={() => setRole(m.user_id, "admin")} title="Promote to admin" className="p-1.5 hover:bg-indigo-50 rounded-full text-indigo-600"><Shield className="w-4 h-4" /></button>
                )}
                <button onClick={() => removeMember(m.user_id)} className="p-1.5 hover:bg-red-50 rounded-full text-red-500"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>

      {showAdd && isAdmin && (
        <InviteModal
          squadId={squad.id}
          existing={[...members.map((m) => m.user_id), ...invites.map((i) => i.invitee_id)]}
          inviterId={user!.id}
          onClose={() => setShowAdd(false)}
          onAdded={() => { setShowAdd(false); load(); }}
        />
      )}
    </div>
  );
}

function Avatar({ profile }: { profile?: Profile }) {
  return (
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden">
      {profile?.avatar_url ? <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" /> : (profile?.username ?? "?").slice(0, 1).toUpperCase()}
    </div>
  );
}

function InviteModal({ squadId, existing, inviterId, onClose, onAdded }: { squadId: string; existing: string[]; inviterId: string; onClose: () => void; onAdded: () => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Profile[]>([]);

  useEffect(() => {
    const t = setTimeout(async () => {
      const term = q.trim();
      if (!term) { setResults([]); return; }
      const { data } = await supabase.from("profiles").select("id, username, full_name, avatar_url, role")
        .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`).limit(10);
      setResults(((data ?? []) as Profile[]).filter((p) => !existing.includes(p.id)));
    }, 200);
    return () => clearTimeout(t);
  }, [q, existing]);

  const invite = async (uid: string) => {
    const { error } = await sb.from("squad_invites").insert({ squad_id: squadId, invitee_id: uid, inviter_id: inviterId });
    if (error) { toast.error(error.message); return; }
    toast.success("Invite sent");
    onAdded();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Invite to squad</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username or name..." className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 mb-3 text-gray-900" />
        <div className="space-y-2">
          {results.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50">
              <Avatar profile={p} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate text-gray-900">{p.full_name || p.username}</p>
                <p className="text-xs text-gray-500">@{p.username}</p>
              </div>
              <button onClick={() => invite(p.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Invite</button>
            </div>
          ))}
          {q && results.length === 0 && <p className="text-center text-sm text-gray-500 py-4">No matches</p>}
        </div>
      </div>
    </div>
  );
}
