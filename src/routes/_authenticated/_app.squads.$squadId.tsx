import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Users, UserPlus, Trash2, ArrowLeft, X, Check, Clock, Shield, ShieldOff, MessageCircle, Info, MessagesSquare } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ChatThread, type Conv } from "./_app.messages";

export const Route = createFileRoute("/_authenticated/_app/squads/$squadId")({
  component: SquadDetailPage,
});

type Squad = { id: string; name: string; description: string | null; specialty: string | null; owner_id: string; conversation_id: string | null };
type Profile = { id: string; username: string; full_name: string | null; avatar_url: string | null; role: string | null };
type Member = { id: string; user_id: string; role: string; profile?: Profile };
type Invite = { id: string; squad_id: string; inviter_id: string; invitee_id: string; status: string; profile?: Profile };
type JoinRequest = { id: string; squad_id: string; user_id: string; message: string | null; status: string; profile?: Profile };

const sb: any = supabase;

function SquadDetailPage() {
  const { squadId } = Route.useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [squad, setSquad] = useState<Squad | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [joinReqs, setJoinReqs] = useState<JoinRequest[]>([]);
  const [myInvite, setMyInvite] = useState<Invite | null>(null);
  const [myRequest, setMyRequest] = useState<JoinRequest | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [tab, setTab] = useState<"about" | "chat">("about");
  const [convObj, setConvObj] = useState<Conv | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);

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

    const { data: inv } = await sb.from("squad_invitations").select("*").eq("squad_id", squadId).eq("status", "pending");
    setInvites(await hydrateProfiles((inv ?? []) as Invite[], "invitee_id"));

    const { data: jr } = await sb.from("squad_join_requests").select("*").eq("squad_id", squadId).eq("status", "pending");
    setJoinReqs(await hydrateProfiles((jr ?? []) as JoinRequest[], "user_id"));

    if (user) {
      const { data: mine } = await sb.from("squad_invitations").select("*").eq("squad_id", squadId).eq("invitee_id", user.id).eq("status", "pending").maybeSingle();
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
  const isClient = (profile as any)?.role === "client";

  const loadChat = async () => {
    if (!user || !squad) return;
    setLoadingChat(true);
    try {
      const rpc = isClient && !isMember
        ? sb.rpc("add_client_to_squad_conversation", { _squad_id: squadId, _client_id: user.id })
        : sb.rpc("get_or_create_squad_conversation", { _squad_id: squadId });
      const { data: convId, error } = await rpc;
      if (error) throw error;
      
      setConvObj({
        id: convId as string,
        is_group: true,
        title: squad.name,
        last_message_at: new Date().toISOString(),
        last_read_at: new Date().toISOString(),
        other: null,
        last_body: null,
        unread: 0,
      });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not open the squad chat.");
      setTab("about");
    } finally {
      setLoadingChat(false);
    }
  };

  useEffect(() => {
    if (tab === "chat" && !convObj) {
      loadChat();
    }
  }, [tab, convObj]);

  const respondInvite = async (status: "accepted" | "rejected") => {
    if (!myInvite) return;
    const { error } = await sb.rpc(
      status === "accepted" ? "accept_squad_invitation" : "reject_squad_invitation",
      { p_invitation_id: myInvite.id }
    );
    if (error) {
      toast.error(error.message);
      return;
    }
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
    await sb.from("squad_invitations").delete().eq("id", id);
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

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;
  if (!squad) return <div className="text-center py-16 text-muted-foreground">Squad not found</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <button onClick={() => navigate({ to: "/squads" })} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> All squads
      </button>

      {/* Header */}
      <div className="rounded-3xl p-8 text-white shadow-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-4xl font-black border-2 border-white/30 shadow-inner">
            {squad.name.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{squad.name}</h1>
            {squad.specialty && <p className="mt-1 text-white/90 text-sm font-medium">{squad.specialty}</p>}
            {squad.description && <p className="mt-3 text-sm text-white/95 max-w-2xl leading-relaxed">{squad.description}</p>}
            
            <div className="mt-5 flex flex-wrap gap-2">
              {!isMember && myInvite && (
                <>
                  <button onClick={() => respondInvite("accepted")} className="px-5 py-2 bg-white text-purple-700 rounded-xl text-sm font-bold flex items-center gap-1.5 transition hover:bg-white/90 shadow-sm"><Check className="w-4 h-4" /> Accept invite</button>
                  <button onClick={() => respondInvite("rejected")} className="px-5 py-2 bg-black/20 text-white rounded-xl text-sm font-bold transition hover:bg-black/30">Decline</button>
                </>
              )}
              {!isMember && !myInvite && !myRequest && !isClient && (
                <button onClick={requestJoin} className="px-5 py-2 bg-white text-purple-700 rounded-xl text-sm font-bold transition hover:bg-white/90 shadow-sm">Request to join</button>
              )}
              {!isMember && myRequest && (
                <button onClick={cancelRequest} className="px-5 py-2 bg-black/20 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition hover:bg-black/30"><Clock className="w-4 h-4" /> Request pending</button>
              )}
              {(isMember || isClient) && (
                <button onClick={() => setTab("chat")} className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition shadow-sm ${tab === "chat" ? "bg-white text-purple-700" : "bg-white/20 text-white hover:bg-white/30"}`}>
                  <MessageCircle className="w-4 h-4" /> Squad Chat
                </button>
              )}
              {isMember && !isOwner && <button onClick={leave} className="px-5 py-2 bg-black/20 text-white rounded-xl text-sm font-bold transition hover:bg-black/30">Leave</button>}
              {isOwner && <button onClick={deleteSquad} className="px-5 py-2 bg-red-500/80 text-white rounded-xl text-sm font-bold flex items-center gap-1.5 transition hover:bg-red-500"><Trash2 className="w-4 h-4" /> Delete Squad</button>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6">
        <button
          onClick={() => setTab("about")}
          className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${tab === "about" ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
        >
          <Info className="w-4 h-4" /> About & Members
        </button>
        {(isMember || isClient) && (
          <button
            onClick={() => setTab("chat")}
            className={`flex items-center gap-2 px-4 py-3 font-semibold text-sm border-b-2 transition-colors ${tab === "chat" ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <MessagesSquare className="w-4 h-4" /> Squad Chat
          </button>
        )}
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {tab === "about" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
            
            {isAdmin && joinReqs.length > 0 && (
              <section className="bg-surface border border-border p-5 rounded-2xl">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Join requests ({joinReqs.length})</h2>
                <div className="space-y-2">
                  {joinReqs.map((r) => (
                    <div key={r.id} className="bg-background rounded-xl p-3 border border-border flex items-center gap-3">
                      <Avatar profile={r.profile} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{r.profile?.full_name || r.profile?.username}</p>
                        <p className="text-xs text-muted-foreground">@{r.profile?.username}</p>
                      </div>
                      <button onClick={() => respondJoinReq(r.id, "accepted")} className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold">Accept</button>
                      <button onClick={() => respondJoinReq(r.id, "rejected")} className="px-4 py-1.5 bg-muted text-foreground rounded-lg text-xs font-bold">Reject</button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {isAdmin && invites.length > 0 && (
              <section className="bg-surface border border-border p-5 rounded-2xl">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">Pending invites ({invites.length})</h2>
                <div className="space-y-2">
                  {invites.map((i) => (
                    <div key={i.id} className="bg-background rounded-xl p-3 border border-border flex items-center gap-3">
                      <Avatar profile={i.profile} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{i.profile?.full_name || i.profile?.username}</p>
                        <p className="text-xs text-muted-foreground">@{i.profile?.username} · awaiting response</p>
                      </div>
                      <button onClick={() => cancelInvite(i.id)} className="p-2 hover:bg-destructive/10 rounded-full text-destructive"><X className="w-4 h-4" /></button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-surface border border-border p-5 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold flex items-center gap-2"><Users className="w-5 h-5" /> Members ({members.length})</h2>
                {isAdmin && (
                  <button onClick={() => setShowAdd(true)} className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 transition hover:opacity-90">
                    <UserPlus className="w-4 h-4" /> Invite
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {members.map((m) => (
                  <div key={m.id} className="bg-background rounded-xl p-3 border border-border flex items-center gap-3">
                    <Avatar profile={m.profile} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{m.profile?.full_name || m.profile?.username}</p>
                      <p className="text-xs text-muted-foreground">@{m.profile?.username} · {m.role}</p>
                    </div>
                    {isOwner && m.user_id !== squad.owner_id && (
                      <div className="flex items-center gap-1">
                        {m.role === "admin" ? (
                          <button onClick={() => setRole(m.user_id, "member")} title="Demote" className="p-2 hover:bg-muted rounded-full text-foreground"><ShieldOff className="w-4 h-4" /></button>
                        ) : (
                          <button onClick={() => setRole(m.user_id, "admin")} title="Promote to admin" className="p-2 hover:bg-primary/10 rounded-full text-primary"><Shield className="w-4 h-4" /></button>
                        )}
                        <button onClick={() => removeMember(m.user_id)} className="p-2 hover:bg-destructive/10 rounded-full text-destructive"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

        {tab === "chat" && (
          <div className="h-[600px] max-h-[70vh] bg-surface border border-border rounded-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 shadow-sm relative">
            {loadingChat ? (
              <div className="flex items-center justify-center flex-1 text-muted-foreground">Connecting to Squad Chat...</div>
            ) : convObj && user ? (
              <ChatThread 
                conv={convObj} 
                meId={user.id} 
                onBack={() => setTab("about")} 
                onRead={() => {}} 
              />
            ) : (
              <div className="flex items-center justify-center flex-1 text-muted-foreground">Failed to load chat.</div>
            )}
          </div>
        )}
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
    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground font-bold flex-shrink-0 overflow-hidden border border-border shadow-sm">
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

  const [sending, setSending] = useState(false);

  const invite = async (uid: string) => {
    if (sending) return;
    setSending(true);
    const { error } = await sb.from("squad_invitations").insert({ squad_id: squadId, invitee_id: uid, inviter_id: inviterId });
    setSending(false);
    
    if (error) { 
      if (error.code === '23505') {
        toast.error("Invitation already sent.");
      } else {
        toast.error(error.message); 
      }
      return; 
    }
    
    toast.success("Invite sent");
    onAdded();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background border border-border w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 max-h-[80vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Invite to squad</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search username or name..." className="w-full px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:border-brand mb-3" />
        <div className="space-y-2">
          {results.map((p) => (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition">
              <Avatar profile={p} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{p.full_name || p.username}</p>
                <p className="text-xs text-muted-foreground">@{p.username}</p>
              </div>
              <button 
                onClick={() => invite(p.id)} 
                disabled={sending}
                className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
              >
                {sending ? "Sending..." : "Invite"}
              </button>
            </div>
          ))}
          {q && results.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No matches found</p>}
        </div>
      </div>
    </div>
  );
}
