import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Briefcase, MapPin, Clock, Plus, X, Send, Search, ExternalLink, MessageCircle, Calendar, Award, Building2, Sparkles } from "lucide-react";
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
  company_name?: string | null; skills_required?: string[] | null;
  experience_level?: string | null; duration?: string | null; deadline?: string | null;
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
  const [applications, setApplications] = useState<Record<string, { id: string; status: string }>>({});

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
    if (user && !isClient) {
      const { data: mine } = await supabase.from("job_applications").select("id, job_id, status").eq("applicant_id", user.id);
      setApplications(Object.fromEntries((mine ?? []).map((a: any) => [a.job_id, a])));
    }
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

  // Smart matching: score each job by overlap with the creator's specialties +
  // required skills, category, and title. Hide jobs with no overlap when the
  // creator has specialties set.
  const visibleJobs = useMemo(() => {
    const term = searchQ.trim().toLowerCase();
    const scored = jobs.map((j) => {
      const hay = `${j.category ?? ""} ${j.title} ${j.description} ${(j.skills_required ?? []).join(" ")}`.toLowerCase();
      let score = 0;
      if (!isClient && mySpecialties.length) {
        mySpecialties.forEach((s) => { if (hay.includes(s)) score += 2; });
      }
      if (term && hay.includes(term)) score += 1;
      return { j, score };
    });
    let base = scored;
    if (!isClient && mySpecialties.length > 0) base = base.filter((x) => x.score > 0);
    if (term) base = base.filter((x) => {
      const hay = `${x.j.title} ${x.j.description} ${x.j.category ?? ""} ${x.j.location ?? ""} ${(x.j.skills_required ?? []).join(" ")}`.toLowerCase();
      return hay.includes(term);
    });
    return base.sort((a, b) => b.score - a.score).map((x) => x.j);
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
            <JobCard key={j.id} job={j} application={applications[j.id]} canApply={!isClient && j.client_id !== user?.id && !applications[j.id]} onApply={() => setApplyJob(j)} />
          ))}
        </div>
      )}

      {showPost && <PostJobModal onClose={() => setShowPost(false)} onCreated={() => { setShowPost(false); load(); }} />}
      {isClient && <ClientApplications />}
      {!isClient && <><AssignedProjects /><MyApplications applications={applications} jobs={jobs} /></>}
      {applyJob && <ApplyJobModal job={applyJob} onClose={() => setApplyJob(null)} onApplied={() => { setApplyJob(null); load(); }} />}
    </div>
  );
}

function JobCard({ job, application, canApply, onApply }: { job: Job; application?: { id: string; status: string }; canApply: boolean; onApply: () => void }) {
  const deadlineLabel = job.deadline ? new Date(job.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" }) : null;
  return (
    <div className="bg-surface rounded-2xl p-5 border border-border hover:border-brand/40 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-base tracking-tight leading-snug">{job.title}</h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              {job.company_name && <span className="inline-flex items-center gap-1 font-semibold text-foreground/80"><Building2 className="w-3 h-3" />{job.company_name}</span>}
              {job.client?.username && (
                <Link to="/user/$username" params={{ username: job.client.username }} className="hover:text-brand">@{job.client.username}</Link>
              )}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {job.budget && <div className="text-base font-bold text-brand">{job.budget}</div>}
          {job.category && <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-foreground/70">{job.category}</span>}
        </div>
      </div>

      <p className="text-sm text-foreground/80 mt-3 line-clamp-3 leading-relaxed whitespace-pre-line">{job.description}</p>

      {job.skills_required && job.skills_required.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Skills required</p>
          <div className="flex flex-wrap gap-1.5">
            {job.skills_required.map((s) => (
              <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-brand-soft text-brand font-semibold">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-border text-[11px]">
        {job.experience_level && (
          <div className="flex items-center gap-1.5 text-muted-foreground"><Award className="w-3.5 h-3.5" /><span><span className="font-semibold text-foreground/80">{job.experience_level}</span> level</span></div>
        )}
        {job.duration && (
          <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="w-3.5 h-3.5" /><span>{job.duration}</span></div>
        )}
        {job.location && (
          <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="w-3.5 h-3.5" /><span>{job.location}</span></div>
        )}
        {deadlineLabel && (
          <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="w-3.5 h-3.5" /><span>Deadline {deadlineLabel}</span></div>
        )}
      </div>

      {canApply && (
        <div className="mt-4 flex justify-end">
          <button onClick={onApply} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" /> Apply now
          </button>
        </div>
      )}
      {application && (
        <div className="mt-4 flex justify-end">
          <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${application.status === "accepted" ? "bg-emerald-100 text-emerald-700" : application.status === "rejected" ? "bg-rose-100 text-rose-700" : "bg-brand-soft text-brand"}`}>
            {application.status === "pending" ? "Application sent" : `Application ${application.status}`}
          </span>
        </div>
      )}
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
  const [form, setForm] = useState({
    title: "", description: "", category: "", location: "", budget: "",
    company_name: "", skills: "", experience_level: "Intermediate", duration: "", deadline: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.description.trim()) { toast.error("Title and description required"); return; }
    setBusy(true);
    const payload: any = {
      client_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || null,
      location: form.location.trim() || null,
      budget: form.budget.trim() || null,
      company_name: form.company_name.trim() || null,
      experience_level: form.experience_level || null,
      duration: form.duration.trim() || null,
      deadline: form.deadline || null,
      skills_required: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
    };
    const { error } = await supabase.from("jobs").insert(payload);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Project posted");
    onCreated();
  };

  return (
    <Modal onClose={onClose} title="Post a brief">
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Job title (e.g. Need Instagram Reel Editor)" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Company / brand name" value={form.company_name} onChange={(v) => setForm({ ...form, company_name: v })} />
          <Input placeholder="Category (Video, Design…)" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        </div>
        <textarea
          placeholder="Project description, deliverables, references…"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={5}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none"
        />
        <Input placeholder="Required skills, comma separated (Premiere Pro, After Effects)" value={form.skills} onChange={(v) => setForm({ ...form, skills: v })} />
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Budget (e.g. ₹10,000)" value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} />
          <Input placeholder="Duration (e.g. 30 days)" value={form.duration} onChange={(v) => setForm({ ...form, duration: v })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Location (or Remote)" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
          <select
            value={form.experience_level}
            onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
          >
            <option>Entry</option><option>Intermediate</option><option>Senior</option>
          </select>
        </div>
        <label className="block">
          <span className="block text-xs font-semibold text-muted-foreground mb-1">Deadline</span>
          <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
        </label>
        <button disabled={busy} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60">
          {busy ? "Posting…" : "Post brief"}
        </button>
      </form>
    </Modal>
  );
}

function ApplyJobModal({ job, onClose, onApplied }: { job: Job; onClose: () => void; onApplied: () => void }) {
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
    onApplied();
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

function ClientApplications() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await supabase.from("job_applications").select("id, job_id, applicant_id, portfolio_url, resume_url, status, created_at").order("created_at", { ascending: false }).limit(50);
      const rows = data ?? [];
      const ids = rows.map((row: any) => row.applicant_id).filter(Boolean);
      const jobIds = Array.from(new Set(rows.map((row: any) => row.job_id)));
      const [{ data: people }, { data: jobs }, { data: specialties }] = await Promise.all([
        ids.length ? supabase.from("profiles").select("id, username, full_name, avatar_url, portfolio_url, resume_url").in("id", ids) : Promise.resolve({ data: [] }),
        jobIds.length ? supabase.from("jobs").select("id, title").in("id", jobIds) : Promise.resolve({ data: [] }),
        ids.length ? supabase.from("creator_specialties").select("user_id, specialty").in("user_id", ids) : Promise.resolve({ data: [] }),
      ]);
      const peopleById = new Map((people ?? []).map((person: any) => [person.id, person]));
      const jobsById = new Map((jobs ?? []).map((job: any) => [job.id, job]));
      const skillsById = new Map<string, string[]>();
      (specialties ?? []).forEach((specialty: any) => skillsById.set(specialty.user_id, [...(skillsById.get(specialty.user_id) ?? []), specialty.specialty]));
      setItems(rows.map((row: any) => ({ ...row, person: peopleById.get(row.applicant_id), job: jobsById.get(row.job_id), skills: skillsById.get(row.applicant_id) ?? [] })));
    };
    load();
    const channel = supabase.channel(`client-apps:${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "job_applications" }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const decide = async (id: string, status: "accepted" | "rejected") => {
    setBusyId(id);
    const { error } = await (supabase.rpc as any)("decide_job_application", { _application_id: id, _status: status });
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    toast.success(status === "accepted" ? "Creator accepted and assigned" : "Application rejected");
  };

  if (!items.length) return null;
  const counts = { pending: items.filter((item) => item.status === "pending").length, accepted: items.filter((item) => item.status === "accepted").length, rejected: items.filter((item) => item.status === "rejected").length };
  return <section className="mt-8 border-t border-border pt-6">
    <h2 className="text-lg font-bold">Applications ({items.length})</h2>
    <div className="mt-2 flex gap-2 text-xs font-semibold"><span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-800">Pending {counts.pending}</span><span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-800">Accepted {counts.accepted}</span><span className="rounded-full bg-rose-100 px-2.5 py-1 text-rose-800">Rejected {counts.rejected}</span></div>
    <div className="mt-3 space-y-3">{items.map((item) => <div key={item.id} className="rounded-xl border border-border bg-surface p-4">
      <div className="flex gap-3"><Link to="/applications/$applicationId" params={{ applicationId: item.id }} className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-brand-soft flex items-center justify-center font-bold text-brand">{item.person?.avatar_url ? <img src={item.person.avatar_url} className="h-full w-full object-cover" alt="" /> : (item.person?.username?.[0] ?? "?").toUpperCase()}</Link><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><Link to="/applications/$applicationId" params={{ applicationId: item.id }} className="font-semibold hover:text-brand">{item.person?.full_name || item.person?.username || "Applicant"}</Link><span className="capitalize text-xs font-semibold text-muted-foreground">{item.status}</span></div><p className="text-xs text-muted-foreground">@{item.person?.username ?? "creator"} · {item.job?.title ?? "Project"} · {new Date(item.created_at).toLocaleDateString()}</p><div className="mt-2 flex flex-wrap gap-1">{item.skills.slice(0, 4).map((skill: string) => <span key={skill} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">{skill}</span>)}{(item.resume_url || item.person?.resume_url) && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">Resume available</span>}{(item.portfolio_url || item.person?.portfolio_url) && <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-brand">Portfolio</span>}</div></div></div>
      {item.status === "pending" && <div className="mt-3 flex justify-end gap-2"><button disabled={busyId === item.id} onClick={() => decide(item.id, "rejected")} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-50">Reject</button><button disabled={busyId === item.id || !item.applicant_id} onClick={() => decide(item.id, "accepted")} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">Accept</button></div>}
    </div>)}</div>
  </section>;
}

function MyApplications({ applications, jobs }: { applications: Record<string, { id: string; status: string }>; jobs: Job[] }) {
  const rows = Object.entries(applications);
  if (!rows.length) return null;
  const titles = new Map(jobs.map((job) => [job.id, job.title]));
  return <section className="mt-8 border-t border-border pt-6">
    <h2 className="text-lg font-bold">My applications</h2>
    <div className="mt-3 space-y-2">{rows.map(([jobId, application]) => <div key={application.id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3"><span className="text-sm font-semibold">{titles.get(jobId) ?? "Job application"}</span><span className="capitalize text-xs font-semibold text-muted-foreground">{application.status}</span></div>)}</div>
  </section>;
}

function AssignedProjects() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data } = await (supabase as any).from("project_assignments").select("job_id, status, joined_at").eq("creator_id", user.id).order("joined_at", { ascending: false });
      const rows = data ?? [];
      const ids = rows.map((row: any) => row.job_id);
      const { data: jobs } = ids.length ? await supabase.from("jobs").select("id, title").in("id", ids) : { data: [] };
      const byId = new Map((jobs ?? []).map((job: any) => [job.id, job]));
      setItems(rows.map((row: any) => ({ ...row, job: byId.get(row.job_id) })));
    };
    load();
    const channel = supabase.channel(`assigned-projects:${user.id}`).on("postgres_changes", { event: "*", schema: "public", table: "project_assignments", filter: `creator_id=eq.${user.id}` }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);
  if (!items.length) return null;
  return <section className="mt-8 border-t border-border pt-6"><h2 className="text-lg font-bold">Assigned projects</h2><div className="mt-3 space-y-2">{items.map((item) => <div key={item.job_id} className="flex items-center justify-between rounded-xl border border-border bg-surface p-3"><span className="text-sm font-semibold">{item.job?.title ?? "Project"}</span><span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">Active</span></div>)}</div></section>;
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
