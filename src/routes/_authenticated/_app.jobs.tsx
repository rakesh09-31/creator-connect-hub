import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, MapPin, Clock, Plus, X, Send, Search, ExternalLink, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/jobs")({
  head: () => ({ meta: [{ title: "Opportunities — Omnicraft" }] }),
  component: JobsPage,
});

type Job = {
  id: string; title: string; description: string; category: string | null;
  location: string | null; budget: string | null; status: string;
  client_id: string; created_at: string;
  client?: { username: string; full_name: string | null; avatar_url: string | null };
};

type Squad = { id: string; name: string };

type CreatorProfile = {
  id: string; username: string; full_name: string | null; avatar_url: string | null;
  bio: string | null; portfolio_url: string | null;
  specialties: string[];
};

function JobsPage() {
  const { profile } = useAuth();
  const isClient = profile?.role === "client";

  // Default tab: for clients, "Find creators"; for creators, "Briefs"
  const [tab, setTab] = useState<"briefs" | "creators">(isClient ? "creators" : "briefs");

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Opportunities</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">
          {isClient ? "Hire creators & post briefs" : "Briefs matched to your specialty"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isClient
            ? "Post project briefs or reach out directly to creators that fit your field."
            : "We only show open briefs that align with your specialties."}
        </p>
      </div>

      {isClient && (
        <div className="flex gap-1 border-b border-border mb-5">
          <TabBtn active={tab === "creators"} onClick={() => setTab("creators")}>Find creators</TabBtn>
          <TabBtn active={tab === "briefs"} onClick={() => setTab("briefs")}>My briefs</TabBtn>
        </div>
      )}

      {(!isClient || tab === "briefs") && <BriefsPanel />}
      {isClient && tab === "creators" && <CreatorsPanel />}
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
        active ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

/* ---------------------- Briefs (jobs) panel ---------------------- */

function BriefsPanel() {
  const { profile, user } = useAuth();
  const isClient = profile?.role === "client";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [mySpecialties, setMySpecialties] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [searchQ, setSearchQ] = useState("");

  const load = async () => {
    setLoading(true);
    let q = supabase.from("jobs").select("*").eq("status", "open").order("created_at", { ascending: false });
    if (isClient && user) q = q.eq("client_id", user.id);
    const { data } = await q;
    const list = (data ?? []) as Job[];
    const ids = Array.from(new Set(list.map((j) => j.client_id)));
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      list.forEach((j) => (j.client = map.get(j.client_id)));
    }
    setJobs(list);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      if (user && !isClient) {
        const { data } = await supabase.from("creator_specialties").select("specialty").eq("user_id", user.id);
        setMySpecialties((data ?? []).map((x: any) => x.specialty.toLowerCase()));
      }
      load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isClient]);

  // For creators, only show jobs whose category or title/description matches one of their specialties.
  const visibleJobs = useMemo(() => {
    let base = jobs;
    if (!isClient && mySpecialties.length > 0) {
      base = base.filter((j) => {
        const hay = `${j.category ?? ""} ${j.title} ${j.description}`.toLowerCase();
        return mySpecialties.some((s) => hay.includes(s));
      });
    }
    const term = searchQ.trim().toLowerCase();
    if (!term) return base;
    return base.filter((j) => {
      const hay = `${j.title} ${j.description} ${j.category ?? ""} ${j.location ?? ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [jobs, isClient, mySpecialties, searchQ]);

  return (
    <div>
      {!isClient && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search jobs by title, category, location…"
            className="w-full pl-10 pr-3 h-11 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
          />
        </div>
      )}

      {isClient && (
        <div className="flex justify-end mb-4">
          <button onClick={() => setShowPost(true)} className="bg-primary text-primary-foreground hover:opacity-90 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition">
            <Plus className="w-4 h-4" /> Post brief
          </button>
        </div>
      )}

      {!isClient && mySpecialties.length === 0 && (
        <div className="mb-4 p-4 rounded-xl bg-brand-soft/50 border border-brand/20 text-sm text-foreground/80">
          Add specialties to your profile during onboarding to see matched briefs.
        </div>
      )}

      {loading ? (
        <div className="text-center text-muted-foreground py-12 text-sm">Loading…</div>
      ) : visibleJobs.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center border border-border">
          <Briefcase className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {isClient ? "No briefs posted yet" : "No briefs match your specialties right now"}
          </p>
          {isClient && <button onClick={() => setShowPost(true)} className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm">Post the first one</button>}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleJobs.map((j) => (
            <JobCard key={j.id} job={j} canApply={!isClient && j.client_id !== user?.id} onApply={() => setApplyJob(j)} />
          ))}
        </div>
      )}

      {showPost && <PostJobModal onClose={() => setShowPost(false)} onCreated={() => { setShowPost(false); load(); }} />}
      {applyJob && <ApplyJobModal job={applyJob} onClose={() => setApplyJob(null)} />}
    </div>
  );
}

function JobCard({ job, canApply, onApply }: { job: Job; canApply: boolean; onApply: () => void }) {
  return (
    <div className="bg-surface rounded-xl p-5 border border-border hover:border-brand/40 hover:shadow-sm transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-brand-soft flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-base tracking-tight">{job.title}</h3>
            <Link to="/user/$username" params={{ username: job.client?.username ?? "" }} className="text-xs text-muted-foreground hover:text-brand">
              @{job.client?.username ?? "client"}
            </Link>
            <p className="text-sm text-foreground/80 mt-2 line-clamp-2 leading-relaxed">{job.description}</p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mt-3 text-[11px] text-muted-foreground">
              {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(job.created_at).toLocaleDateString()}</span>
              {job.category && <span className="px-2 py-0.5 bg-muted rounded-full font-semibold text-foreground/70">{job.category}</span>}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {job.budget && <div className="text-sm font-semibold text-brand">{job.budget}</div>}
          {canApply && (
            <button onClick={onApply} className="mt-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold hover:opacity-90 transition">Apply</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------- Find Creators panel (clients only) ---------------------- */

type SquadWithOwner = {
  id: string; name: string; description: string | null; specialty: string | null;
  avatar_url: string | null; owner_id: string; owner_username?: string; owner_full_name?: string | null;
};

function CreatorsPanel() {
  const { profile } = useAuth();
  const [creators, setCreators] = useState<CreatorProfile[]>([]);
  const [squads, setSquads] = useState<SquadWithOwner[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>(profile?.client_field ?? "");
  const [reqTarget, setReqTarget] = useState<CreatorProfile | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: profs }, { data: sqs }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, bio, portfolio_url, role")
          .eq("role", "creator")
          .limit(200),
        supabase
          .from("squads")
          .select("id, name, description, specialty, avatar_url, owner_id")
          .limit(100),
      ]);
      const list = (profs ?? []) as any[];
      const ids = list.map((p) => p.id);
      let specMap = new Map<string, string[]>();
      if (ids.length) {
        const { data: specs } = await supabase
          .from("creator_specialties")
          .select("user_id, specialty")
          .in("user_id", ids);
        (specs ?? []).forEach((s: any) => {
          const arr = specMap.get(s.user_id) ?? [];
          arr.push(s.specialty);
          specMap.set(s.user_id, arr);
        });
      }
      const enriched: CreatorProfile[] = list.map((p) => ({
        id: p.id, username: p.username, full_name: p.full_name,
        avatar_url: p.avatar_url, bio: p.bio, portfolio_url: p.portfolio_url,
        specialties: specMap.get(p.id) ?? [],
      }));
      const profMap = new Map(list.map((p: any) => [p.id, p]));
      const sqList: SquadWithOwner[] = ((sqs ?? []) as any[]).map((s) => ({
        ...s,
        owner_username: profMap.get(s.owner_id)?.username,
        owner_full_name: profMap.get(s.owner_id)?.full_name,
      }));
      setCreators(enriched);
      setSquads(sqList);
      setLoading(false);
    })();
  }, []);

  const allSpecialties = useMemo(() => {
    const s = new Set<string>();
    creators.forEach((c) => c.specialties.forEach((sp) => s.add(sp)));
    return Array.from(s).sort();
  }, [creators]);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return creators.filter((c) => {
      if (specialtyFilter && !c.specialties.some((sp) => sp.toLowerCase().includes(specialtyFilter.toLowerCase()))) return false;
      if (!term) return true;
      return (
        c.username.toLowerCase().includes(term) ||
        (c.full_name ?? "").toLowerCase().includes(term) ||
        (c.bio ?? "").toLowerCase().includes(term) ||
        c.specialties.some((sp) => sp.toLowerCase().includes(term))
      );
    });
  }, [creators, q, specialtyFilter]);

  const visibleSquads = useMemo(() => {
    const term = q.trim().toLowerCase();
    return squads.filter((s) => {
      if (specialtyFilter && !(s.specialty ?? "").toLowerCase().includes(specialtyFilter.toLowerCase())) return false;
      if (!term) return true;
      return (
        s.name.toLowerCase().includes(term) ||
        (s.description ?? "").toLowerCase().includes(term) ||
        (s.specialty ?? "").toLowerCase().includes(term) ||
        (s.owner_username ?? "").toLowerCase().includes(term)
      );
    });
  }, [squads, q, specialtyFilter]);

  return (
    <div>
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search creators or squads by name, bio, or specialty…"
          className="w-full pl-10 pr-3 h-11 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <FilterChip active={specialtyFilter === ""} onClick={() => setSpecialtyFilter("")}>All</FilterChip>
        {allSpecialties.map((s) => (
          <FilterChip key={s} active={specialtyFilter === s} onClick={() => setSpecialtyFilter(s)}>{s}</FilterChip>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-12 text-sm">Loading…</div>
      ) : visible.length === 0 && visibleSquads.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center border border-border text-sm text-muted-foreground">
          No creators or squads match your filters
        </div>
      ) : (
        <div className="space-y-5">
          {visibleSquads.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Squads ({visibleSquads.length})</h3>
              <div className="space-y-2">
                {visibleSquads.map((s) => (
                  <Link
                    key={s.id}
                    to="/squads/$squadId"
                    params={{ squadId: s.id }}
                    className="flex items-start gap-3 p-4 bg-surface rounded-xl border border-border hover:border-brand/40 hover:shadow-sm transition"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-brand text-primary-foreground flex items-center justify-center font-semibold flex-shrink-0">
                      {s.name.slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm truncate">{s.name}</p>
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-soft text-brand">Squad</span>
                      </div>
                      {s.owner_username && (
                        <p className="text-[11px] text-muted-foreground">led by @{s.owner_username}</p>
                      )}
                      {s.description && <p className="text-xs text-foreground/70 mt-1 line-clamp-2">{s.description}</p>}
                      {s.specialty && (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground/70 font-semibold mt-1.5">{s.specialty}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {visible.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Creators ({visible.length})</h3>
              <div className="space-y-2">
                {visible.map((c) => (
                  <div key={c.id} className="bg-surface rounded-xl p-4 border border-border hover:border-brand/40 hover:shadow-sm transition flex items-start gap-3">
                    <Link to="/user/$username" params={{ username: c.username }} className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold">
                      {c.avatar_url ? <img src={c.avatar_url} className="w-full h-full object-cover" /> : c.username.slice(0, 1).toUpperCase()}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Link to="/user/$username" params={{ username: c.username }} className="font-semibold text-sm truncate hover:text-brand">
                          {c.full_name || c.username}
                        </Link>
                        <span className="text-xs text-muted-foreground">@{c.username}</span>
                      </div>
                      {c.bio && <p className="text-xs text-foreground/70 mt-0.5 line-clamp-2">{c.bio}</p>}
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.specialties.slice(0, 4).map((s) => (
                          <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-brand-soft text-brand font-semibold">{s}</span>
                        ))}
                      </div>
                      {c.portfolio_url && (
                        <a href={c.portfolio_url} target="_blank" rel="noreferrer" className="text-[11px] text-brand inline-flex items-center gap-1 mt-1.5 hover:underline">
                          <ExternalLink className="w-3 h-3" /> Portfolio
                        </a>
                      )}
                    </div>
                    <button
                      onClick={() => setReqTarget(c)}
                      className="px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-semibold flex items-center gap-1 hover:opacity-90"
                    >
                      <MessageCircle className="w-3 h-3" /> Hire
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {reqTarget && <RequestCreatorModal creator={reqTarget} onClose={() => setReqTarget(null)} />}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
        active ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-foreground/70 border-border hover:border-brand/40"
      }`}
    >
      {children}
    </button>
  );
}

function RequestCreatorModal({ creator, onClose }: { creator: CreatorProfile; onClose: () => void }) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!subject.trim()) { toast.error("Subject required"); return; }
    setBusy(true);
    const { error } = await supabase.from("creator_requests").insert({
      client_id: user.id,
      creator_id: creator.id,
      subject: subject.trim(),
      message: message.trim() || null,
      budget: budget.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Request sent to @${creator.username}`);
    onClose();
  };

  return (
    <Modal onClose={onClose} title={`Hire @${creator.username}`}>
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Subject (e.g. Wedding shoot in Mumbai)" value={subject} onChange={setSubject} />
        <textarea
          placeholder="Describe the project, dates, deliverables…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none"
        />
        <Input placeholder="Budget (e.g. ₹50,000)" value={budget} onChange={setBudget} />
        <button disabled={busy} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          <Send className="w-4 h-4" /> {busy ? "Sending…" : "Send request"}
        </button>
      </form>
    </Modal>
  );
}

/* ---------------------- Post / Apply modals ---------------------- */

function PostJobModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ title: "", description: "", category: "", location: "", budget: "" });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.description.trim()) { toast.error("Title and description required"); return; }
    setBusy(true);
    const { error } = await supabase.from("jobs").insert({
      client_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || null,
      location: form.location.trim() || null,
      budget: form.budget.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Project posted");
    onCreated();
  };

  return (
    <Modal onClose={onClose} title="Post a brief">
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <textarea
          placeholder="Describe the project, deliverables, timeline…"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={5}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Category (Video, Design…)" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Input placeholder="Location (or Remote)" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        </div>
        <Input placeholder="Budget (e.g. ₹50,000)" value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} />
        <button disabled={busy} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60">
          {busy ? "Posting…" : "Post brief"}
        </button>
      </form>
    </Modal>
  );
}

function ApplyJobModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const { user, profile } = useAuth();
  const [portfolio, setPortfolio] = useState(profile?.portfolio_url ?? "");
  const [message, setMessage] = useState("");
  const [squadId, setSquadId] = useState<string>("");
  const [squads, setSquads] = useState<Squad[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from("squads").select("id, name").eq("owner_id", user.id);
      setSquads((data ?? []) as Squad[]);
    })();
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("job_applications").insert({
      job_id: job.id,
      applicant_id: squadId ? null : user.id,
      squad_id: squadId || null,
      portfolio_url: portfolio.trim() || null,
      message: message.trim() || null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Application sent");
    onClose();
  };

  return (
    <Modal onClose={onClose} title={`Apply to: ${job.title}`}>
      <form onSubmit={submit} className="space-y-3">
        {squads.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">Apply as</label>
            <select value={squadId} onChange={(e) => setSquadId(e.target.value)} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm">
              <option value="">Myself</option>
              {squads.map((s) => <option key={s.id} value={s.id}>Squad: {s.name}</option>)}
            </select>
          </div>
        )}
        <Input placeholder="Portfolio URL (website, drive…)" value={portfolio} onChange={setPortfolio} />
        <textarea
          placeholder="Why are you the right fit? Past work, rates, timing…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none"
        />
        <button disabled={busy} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60">
          <Send className="w-4 h-4" /> {busy ? "Sending…" : "Send application"}
        </button>
      </form>
    </Modal>
  );
}

function Input({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
    />
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
