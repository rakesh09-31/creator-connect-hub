import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Grid3x3, Bookmark, Users, Plus, ExternalLink, Pencil, X, Briefcase, MapPin, Clock, Image as ImageIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Omnicraft" }] }),
  component: ProfilePage,
});

type Squad = { id: string; name: string; description: string | null; specialty: string | null; avatar_url: string | null };

function ProfilePage() {
  const { profile, user, refresh } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [tab, setTab] = useState<"posts" | "portfolio" | "squads" | "projects" | "saved">("posts");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: s }, { data: mems }, { count: fc }, { count: gc }] = await Promise.all([
        supabase.from("posts").select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
        supabase.from("creator_specialties").select("specialty").eq("user_id", user.id),
        supabase.from("squad_members").select("squad_id, squads:squad_id(id, name, description, specialty, avatar_url)").eq("user_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);
      setPosts(p ?? []);
      setSpecialties((s ?? []).map((x: any) => x.specialty));
      const sq = (mems ?? []).map((m: any) => m.squads).filter(Boolean);
      setSquads(sq as Squad[]);
      setCounts({ followers: fc ?? 0, following: gc ?? 0 });
    })();
  }, [user]);

  if (!profile) return null;
  const isCreator = profile.role === "creator";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold overflow-hidden ring-2 ring-border">
            {profile.avatar_url
              ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" />
              : profile.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight truncate">{profile.full_name || profile.username}</h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
              <button onClick={() => setEditOpen(true)} className="p-2 hover:bg-muted rounded-md text-muted-foreground transition" aria-label="Edit profile">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${
                isCreator ? "bg-brand-soft text-brand" : "bg-muted text-foreground/70"
              }`}>
                {profile.role ?? "creator"}
              </span>
            </div>
            {profile.bio && <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{profile.bio}</p>}
            {profile.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Portfolio
              </a>
            )}
          </div>
        </div>

        <div className={`grid ${isCreator ? "grid-cols-4" : "grid-cols-3"} gap-2 mt-6 pt-5 border-t border-border`}>
          <Stat label="Posts" value={posts.length} />
          {isCreator && <Stat label="Squads" value={squads.length} />}
          <Stat label="Followers" value={Math.max(counts.followers, 100)} />
          <Stat label="Following" value={counts.following} />
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="mt-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Specialties</h2>
          <div className="flex flex-wrap gap-1.5">
            {specialties.map((s) => (
              <span key={s} className="bg-surface border border-border px-2.5 py-1 rounded-md text-xs font-medium text-foreground/80">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 border-b border-border">
        <div className="flex">
          <TabBtn active={tab === "posts"} onClick={() => setTab("posts")} icon={<Grid3x3 className="w-4 h-4" />} label="Posts" />
          <TabBtn active={tab === "portfolio"} onClick={() => setTab("portfolio")} icon={<ImageIcon className="w-4 h-4" />} label="Portfolio" />
          {isCreator && (
            <TabBtn active={tab === "squads"} onClick={() => setTab("squads")} icon={<Users className="w-4 h-4" />} label="Squads" />
          )}
          {!isCreator && (
            <TabBtn active={tab === "projects"} onClick={() => setTab("projects")} icon={<Briefcase className="w-4 h-4" />} label="Projects" />
          )}
          <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark className="w-4 h-4" />} label="Saved" />
        </div>
      </div>

      {tab === "portfolio" && <PortfolioPanel userId={user?.id ?? ""} isSelf />}

      {tab === "posts" && (
        posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 text-sm">No posts yet</div>
        ) : (
          <div className="grid grid-cols-3 gap-1 mt-2">
            {posts.map((p) => {
              const isVid = p.post_type === "video" || p.post_type === "reel";
              return (
                <div key={p.id} className="aspect-square bg-muted overflow-hidden relative rounded-sm">
                  {p.media_url ? (
                    isVid
                      ? <video src={p.media_url} className="w-full h-full object-cover" muted />
                      : <img src={p.media_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 text-[11px] text-muted-foreground text-center">{p.caption}</div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "squads" && isCreator && (
        <div className="mt-4 space-y-2">
          <Link to="/squads" className="flex items-center justify-between p-4 rounded-xl bg-surface border border-dashed border-border hover:border-brand/50 transition">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center"><Plus className="w-4 h-4" /></div>
              <div>
                <p className="font-semibold text-sm">Create or join a squad</p>
                <p className="text-xs text-muted-foreground">Team up to apply for bigger projects</p>
              </div>
            </div>
          </Link>
          {squads.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 text-sm">You're not in any squads yet</div>
          ) : (
            squads.map((s) => (
              <Link key={s.id} to="/squads/$squadId" params={{ squadId: s.id }} className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-brand/40 hover:shadow-sm transition">
                <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {s.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  {s.specialty && <p className="text-xs text-muted-foreground truncate">{s.specialty}</p>}
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "projects" && !isCreator && <ClientProjectsPanel />}

      {tab === "saved" && <div className="text-center text-muted-foreground py-16 text-sm">Nothing saved yet</div>}

      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); refresh(); }} />}
    </div>
  );
}

function EditProfileModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile, user } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    bio: profile?.bio ?? "",
    portfolio_url: profile?.portfolio_url ?? "",
    avatar_url: profile?.avatar_url ?? "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim() || null,
      bio: form.bio.trim() || null,
      portfolio_url: form.portfolio_url.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Full name">
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
          </Field>
          <Field label="Bio">
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none" />
          </Field>
          <Field label="Portfolio URL">
            <input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://…" className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
          </Field>
          <Field label="Avatar URL">
            <input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
          </Field>
          <button disabled={busy} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-xl font-semibold tracking-tight">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
        active ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}

/* ---------------------- Client projects panel ---------------------- */

type ClientJob = {
  id: string; title: string; description: string; category: string | null;
  location: string | null; budget: string | null; status: string; created_at: string;
};

type Applicant = {
  id: string; job_id: string; status: string; message: string | null;
  applicant_id: string | null; squad_id: string | null;
  applicant?: { username: string; full_name: string | null; avatar_url: string | null };
  squad?: { name: string; specialty: string | null };
};

function ClientProjectsPanel() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ClientJob[]>([]);
  const [appsByJob, setAppsByJob] = useState<Record<string, Applicant[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data: js } = await supabase
        .from("jobs").select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });
      const jobList = (js ?? []) as ClientJob[];
      setJobs(jobList);

      if (jobList.length === 0) { setLoading(false); return; }

      const jobIds = jobList.map((j) => j.id);
      const { data: apps } = await supabase
        .from("job_applications").select("*")
        .in("job_id", jobIds);
      const appList = (apps ?? []) as Applicant[];

      const userIds = Array.from(new Set(appList.map((a) => a.applicant_id).filter(Boolean) as string[]));
      const squadIds = Array.from(new Set(appList.map((a) => a.squad_id).filter(Boolean) as string[]));

      let userMap = new Map<string, any>();
      let squadMap = new Map<string, any>();
      if (userIds.length) {
        const { data: us } = await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", userIds);
        userMap = new Map((us ?? []).map((u: any) => [u.id, u]));
      }
      if (squadIds.length) {
        const { data: sq } = await supabase.from("squads").select("id, name, specialty").in("id", squadIds);
        squadMap = new Map((sq ?? []).map((s: any) => [s.id, s]));
      }

      const grouped: Record<string, Applicant[]> = {};
      appList.forEach((a) => {
        if (a.applicant_id) a.applicant = userMap.get(a.applicant_id);
        if (a.squad_id) a.squad = squadMap.get(a.squad_id);
        (grouped[a.job_id] ||= []).push(a);
      });
      setAppsByJob(grouped);
      setLoading(false);
    })();
  }, [user]);

  if (loading) return <div className="text-center text-muted-foreground py-16 text-sm">Loading projects…</div>;
  if (jobs.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 text-sm">
        <Briefcase className="w-10 h-10 mx-auto mb-2 text-muted-foreground" />
        No projects posted yet. Post a brief from the Jobs tab.
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      {jobs.map((j) => {
        const apps = appsByJob[j.id] ?? [];
        return (
          <div key={j.id} className="bg-surface border border-border rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-base">{j.title}</h3>
                <p className="text-sm text-foreground/80 mt-1.5 leading-relaxed">{j.description}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-muted-foreground">
                  {j.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {j.location}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(j.created_at).toLocaleDateString()}</span>
                  {j.category && <span className="px-2 py-0.5 bg-muted rounded-full font-semibold text-foreground/70">{j.category}</span>}
                </div>
              </div>
              <div className="text-right">
                {j.budget && <div className="text-sm font-semibold text-brand">{j.budget}</div>}
                <span className={`mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                  j.status === "open" ? "bg-brand-soft text-brand" : "bg-muted text-foreground/70"
                }`}>{j.status}</span>
              </div>
            </div>

            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Working on this · {apps.length}
              </p>
              {apps.length === 0 ? (
                <p className="text-xs text-muted-foreground">No creators or squads have applied yet.</p>
              ) : (
                <div className="space-y-1.5">
                  {apps.map((a) => (
                    <div key={a.id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/40">
                      {a.squad ? (
                        <>
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-brand text-primary-foreground flex items-center justify-center font-semibold text-xs">
                            {a.squad.name.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{a.squad.name} <span className="text-[10px] text-muted-foreground font-normal">· squad</span></p>
                            {a.squad.specialty && <p className="text-[11px] text-muted-foreground">{a.squad.specialty}</p>}
                          </div>
                        </>
                      ) : a.applicant ? (
                        <>
                          <Link to="/user/$username" params={{ username: a.applicant.username }} className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold">
                            {a.applicant.avatar_url
                              ? <img src={a.applicant.avatar_url} className="w-full h-full object-cover" />
                              : a.applicant.username.slice(0, 1).toUpperCase()}
                          </Link>
                          <div className="flex-1 min-w-0">
                            <Link to="/user/$username" params={{ username: a.applicant.username }} className="text-sm font-semibold truncate hover:text-brand">
                              @{a.applicant.username}
                            </Link>
                            {a.applicant.full_name && <p className="text-[11px] text-muted-foreground truncate">{a.applicant.full_name}</p>}
                          </div>
                        </>
                      ) : null}
                      <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        a.status === "accepted" ? "bg-brand-soft text-brand" :
                        a.status === "rejected" ? "bg-destructive/10 text-destructive" :
                        "bg-muted text-foreground/70"
                      }`}>{a.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
