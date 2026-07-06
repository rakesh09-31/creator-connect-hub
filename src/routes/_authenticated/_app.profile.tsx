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
          <Stat label="Followers" value={counts.followers} />
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

/* ---------------------- Portfolio website builder ---------------------- */

type PortfolioItem = { id: string; title: string; description: string | null; media_url: string | null; media_type: string; project_link: string | null };
type Service = { title: string; description: string; price?: string };
type Testimonial = { name: string; role?: string; quote: string };

const TEMPLATES = [
  { id: "classic", label: "Classic", desc: "Clean grid layout" },
  { id: "showcase", label: "Showcase", desc: "Bold hero, large media" },
  { id: "minimal", label: "Minimal", desc: "Typography forward" },
];

function PortfolioPanel({ userId, isSelf }: { userId: string; isSelf?: boolean }) {
  const { profile, refresh } = useAuth();
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);

  const template = (profile as any)?.portfolio_template ?? "classic";
  const tagline = (profile as any)?.portfolio_tagline ?? "";
  const services: Service[] = (profile as any)?.services ?? [];
  const testimonials: Testimonial[] = (profile as any)?.testimonials ?? [];
  const social: Record<string, string> = (profile as any)?.social_links ?? {};
  const resumeUrl = (profile as any)?.resume_url ?? "";

  const load = async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase.from("portfolios").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    setItems((data ?? []) as PortfolioItem[]);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);

  const remove = async (id: string) => {
    if (!confirm("Remove this portfolio item?")) return;
    await supabase.from("portfolios").delete().eq("id", id);
    load();
  };

  const heroClass =
    template === "showcase"
      ? "bg-gradient-to-br from-primary/15 via-brand/10 to-transparent p-8 text-center"
      : template === "minimal"
      ? "p-6 border-l-4 border-brand"
      : "p-6 bg-surface";

  return (
    <div className="mt-4 space-y-6">
      {isSelf && (
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowCustomize(true)} className="px-3 py-1.5 bg-muted hover:bg-muted/70 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5">
            <Pencil className="w-3.5 h-3.5" /> Customize site
          </button>
          <button onClick={() => setShowAdd(true)} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add project
          </button>
        </div>
      )}

      {/* HERO / About */}
      <section className={`rounded-2xl border border-border ${heroClass}`}>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">About</h2>
        <p className="text-2xl font-bold tracking-tight">{profile?.full_name || profile?.username}</p>
        {tagline && <p className="text-sm text-foreground/80 mt-1">{tagline}</p>}
        {profile?.bio && <p className="text-sm text-foreground/70 mt-2 leading-relaxed">{profile.bio}</p>}
        <div className="flex flex-wrap gap-2 mt-3">
          {resumeUrl && (
            <a href={resumeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold">
              <ExternalLink className="w-3 h-3" /> Download resume
            </a>
          )}
          {Object.entries(social).filter(([_, v]) => v).map(([k, v]) => (
            <a key={k} href={v} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 bg-muted hover:bg-muted/70 rounded-lg text-xs font-semibold capitalize">
              {k}
            </a>
          ))}
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {services.map((s, i) => (
              <div key={i} className="p-4 bg-surface border border-border rounded-xl">
                <p className="font-semibold text-sm">{s.title}</p>
                {s.description && <p className="text-xs text-muted-foreground mt-1">{s.description}</p>}
                {s.price && <p className="text-xs font-bold text-brand mt-2">{s.price}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects gallery */}
      <section>
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Projects & Gallery</h2>
        {loading ? (
          <div className="text-center text-muted-foreground py-12 text-sm">Loading…</div>
        ) : items.length === 0 ? (
          <div className="text-center text-muted-foreground py-12 text-sm bg-surface border border-border rounded-xl">
            <ImageIcon className="w-10 h-10 mx-auto mb-2" />
            {isSelf ? "Add your first project to build your portfolio" : "No projects yet"}
          </div>
        ) : (
          <div className={template === "showcase"
            ? "grid grid-cols-1 sm:grid-cols-2 gap-3"
            : "grid grid-cols-2 sm:grid-cols-3 gap-3"}>
            {items.map((p) => (
              <div key={p.id} className="bg-surface border border-border rounded-xl overflow-hidden group relative">
                {p.media_url && <img src={p.media_url} className={`w-full ${template === "showcase" ? "aspect-video" : "aspect-square"} object-cover`} alt={p.title} />}
                <div className="p-3">
                  <p className="font-semibold text-sm truncate">{p.title}</p>
                  {p.description && <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{p.description}</p>}
                  {p.project_link && (
                    <a href={p.project_link} target="_blank" rel="noreferrer" className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-brand font-semibold hover:underline">
                      <ExternalLink className="w-3 h-3" /> View
                    </a>
                  )}
                </div>
                {isSelf && (
                  <button onClick={() => remove(p.id)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition">
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Testimonials</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {testimonials.map((t, i) => (
              <blockquote key={i} className="p-4 bg-surface border border-border rounded-xl">
                <p className="text-sm italic text-foreground/80">"{t.quote}"</p>
                <footer className="text-xs text-muted-foreground mt-2 font-semibold">— {t.name}{t.role ? `, ${t.role}` : ""}</footer>
              </blockquote>
            ))}
          </div>
        </section>
      )}

      {showAdd && <AddPortfolioModal userId={userId} onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
      {showCustomize && <CustomizePortfolioModal onClose={() => setShowCustomize(false)} onSaved={() => { setShowCustomize(false); refresh(); }} />}
    </div>
  );
}

function AddPortfolioModal({ userId, onClose, onCreated }: { userId: string; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ title: "", description: "", media_url: "", project_link: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("Title required"); return; }
    setBusy(true);
    const { error } = await supabase.from("portfolios").insert({
      user_id: userId,
      title: form.title.trim(),
      description: form.description.trim() || null,
      media_url: form.media_url.trim() || null,
      project_link: form.project_link.trim() || null,
      media_type: "image",
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Added to portfolio");
    onCreated();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add portfolio project</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Project title" className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short description" rows={3} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm resize-none" />
          <input value={form.media_url} onChange={(e) => setForm({ ...form, media_url: e.target.value })} placeholder="Image URL" className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm" />
          <input value={form.project_link} onChange={(e) => setForm({ ...form, project_link: e.target.value })} placeholder="Project link (optional)" className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm" />
          <button disabled={busy} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60">
            {busy ? "Saving…" : "Save"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CustomizePortfolioModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile, user } = useAuth();
  const p = profile as any;
  const [template, setTemplate] = useState<string>(p?.portfolio_template ?? "classic");
  const [tagline, setTagline] = useState<string>(p?.portfolio_tagline ?? "");
  const [resumeUrl, setResumeUrl] = useState<string>(p?.resume_url ?? "");
  const [social, setSocial] = useState<Record<string, string>>(p?.social_links ?? {});
  const [services, setServices] = useState<Service[]>(p?.services ?? []);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(p?.testimonials ?? []);
  const [busy, setBusy] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      portfolio_template: template,
      portfolio_tagline: tagline.trim() || null,
      resume_url: resumeUrl.trim() || null,
      social_links: social,
      services: services.filter((s) => s.title.trim()),
      testimonials: testimonials.filter((t) => t.quote.trim()),
    } as any).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Portfolio updated");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Customize portfolio website</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={save} className="space-y-5">
          {/* Template */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Template</span>
            <div className="grid grid-cols-3 gap-2">
              {TEMPLATES.map((t) => (
                <button type="button" key={t.id} onClick={() => setTemplate(t.id)}
                  className={`p-3 rounded-xl border text-left transition ${
                    template === t.id ? "border-brand bg-brand-soft" : "border-border hover:border-brand/40"
                  }`}>
                  <p className="font-semibold text-sm">{t.label}</p>
                  <p className="text-[11px] text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <Field label="Tagline (one-line)">
            <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="e.g. Choreographer crafting cinematic dance reels" className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm" />
          </Field>

          <Field label="Resume URL">
            <input value={resumeUrl} onChange={(e) => setResumeUrl(e.target.value)} placeholder="https://… (link to your CV/PDF)" className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border text-sm" />
          </Field>

          {/* Socials */}
          <div>
            <span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Social links</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {["instagram", "youtube", "linkedin", "twitter", "website", "behance"].map((k) => (
                <input key={k} value={social[k] ?? ""} onChange={(e) => setSocial({ ...social, [k]: e.target.value })}
                  placeholder={`${k} URL`}
                  className="px-3 py-2 rounded-lg bg-surface border border-border text-sm" />
              ))}
            </div>
          </div>

          {/* Services */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">Services offered</span>
              <button type="button" onClick={() => setServices([...services, { title: "", description: "", price: "" }])} className="text-xs font-semibold text-brand inline-flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <div className="space-y-2">
              {services.map((s, i) => (
                <div key={i} className="p-3 bg-surface border border-border rounded-lg space-y-2 relative">
                  <button type="button" onClick={() => setServices(services.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 hover:bg-muted rounded"><X className="w-3 h-3" /></button>
                  <input value={s.title} onChange={(e) => { const c = [...services]; c[i] = { ...s, title: e.target.value }; setServices(c); }} placeholder="Service title" className="w-full px-2 py-1.5 rounded bg-background border border-border text-sm" />
                  <input value={s.description} onChange={(e) => { const c = [...services]; c[i] = { ...s, description: e.target.value }; setServices(c); }} placeholder="Description" className="w-full px-2 py-1.5 rounded bg-background border border-border text-sm" />
                  <input value={s.price ?? ""} onChange={(e) => { const c = [...services]; c[i] = { ...s, price: e.target.value }; setServices(c); }} placeholder="Price (e.g. from $500)" className="w-full px-2 py-1.5 rounded bg-background border border-border text-sm" />
                </div>
              ))}
            </div>
          </div>

          {/* Testimonials */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="block text-xs font-bold uppercase tracking-widest text-muted-foreground">Testimonials</span>
              <button type="button" onClick={() => setTestimonials([...testimonials, { name: "", role: "", quote: "" }])} className="text-xs font-semibold text-brand inline-flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
            </div>
            <div className="space-y-2">
              {testimonials.map((t, i) => (
                <div key={i} className="p-3 bg-surface border border-border rounded-lg space-y-2 relative">
                  <button type="button" onClick={() => setTestimonials(testimonials.filter((_, idx) => idx !== i))} className="absolute top-2 right-2 p-1 hover:bg-muted rounded"><X className="w-3 h-3" /></button>
                  <input value={t.name} onChange={(e) => { const c = [...testimonials]; c[i] = { ...t, name: e.target.value }; setTestimonials(c); }} placeholder="Client name" className="w-full px-2 py-1.5 rounded bg-background border border-border text-sm" />
                  <input value={t.role ?? ""} onChange={(e) => { const c = [...testimonials]; c[i] = { ...t, role: e.target.value }; setTestimonials(c); }} placeholder="Role / Company" className="w-full px-2 py-1.5 rounded bg-background border border-border text-sm" />
                  <textarea value={t.quote} onChange={(e) => { const c = [...testimonials]; c[i] = { ...t, quote: e.target.value }; setTestimonials(c); }} placeholder="Quote" rows={2} className="w-full px-2 py-1.5 rounded bg-background border border-border text-sm resize-none" />
                </div>
              ))}
            </div>
          </div>

          <button disabled={busy} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60">
            {busy ? "Saving…" : "Save portfolio"}
          </button>
        </form>
      </div>
    </div>
  );
}

