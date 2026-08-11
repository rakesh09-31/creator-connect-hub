import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Download, ExternalLink, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/applications/$applicationId")({
  component: ApplicationReviewPage,
});

function ApplicationReviewPage() {
  const { applicationId } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [application, setApplication] = useState<any>(null);
  const [job, setJob] = useState<any>(null);
  const [creator, setCreator] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const { data: app, error } = await supabase.from("job_applications").select("*").eq("id", applicationId).maybeSingle();
      if (error || !app) { if (!cancelled) setLoading(false); return; }
      const [{ data: jobRow }, { data: person }, { data: work }, { data: specialties }] = await Promise.all([
        supabase.from("jobs").select("*").eq("id", app.job_id).maybeSingle(),
        app.applicant_id ? supabase.from("profiles").select("*").eq("id", app.applicant_id).maybeSingle() : Promise.resolve({ data: null }),
        app.applicant_id ? supabase.from("portfolios").select("*").eq("user_id", app.applicant_id).order("created_at", { ascending: false }) : Promise.resolve({ data: [] }),
        app.applicant_id ? supabase.from("creator_specialties").select("specialty").eq("user_id", app.applicant_id) : Promise.resolve({ data: [] }),
      ]);
      if (!cancelled) { setApplication(app); setJob(jobRow); setCreator(person); setPortfolio(work ?? []); setSkills((specialties ?? []).map((s: any) => s.specialty)); setLoading(false); }
    };
    load();
    return () => { cancelled = true; };
  }, [applicationId]);

  const decide = async (status: "accepted" | "rejected") => {
    setBusy(true);
    const { data, error } = await (supabase.rpc as any)("decide_job_application", { _application_id: applicationId, _status: status });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setApplication((current: any) => ({ ...current, status }));
    toast.success(status === "accepted" ? "Creator accepted and assigned" : "Application rejected");
    if (status === "accepted" && data) navigate({ to: "/messages", search: { c: data as string } });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-muted-foreground" /></div>;
  if (!application || !job) return <div className="max-w-3xl mx-auto px-4 py-10"><p>Application not found or you do not have access to it.</p><Link to="/jobs" className="text-brand text-sm">Back to jobs</Link></div>;
  const resume = application.resume_url || creator?.resume_url;
  const owner = user?.id === job.client_id;

  return <main className="max-w-4xl mx-auto px-4 py-6">
    <Link to="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="w-4 h-4" /> Back to applications</Link>
    <div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Application review</p><h1 className="text-2xl font-bold mt-1">{job.title}</h1><p className="text-sm text-muted-foreground mt-1">Applied {new Date(application.created_at).toLocaleDateString()}</p></div><span className="rounded-full bg-brand-soft px-3 py-1 text-sm font-semibold capitalize text-brand">{application.status}</span></div>
    <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center gap-4"><div className="h-14 w-14 rounded-full bg-brand-soft overflow-hidden flex items-center justify-center font-bold text-brand">{creator?.avatar_url ? <img src={creator.avatar_url} className="w-full h-full object-cover" alt="" /> : (creator?.username?.[0] ?? "?").toUpperCase()}</div><div><h2 className="text-lg font-bold">{creator?.full_name || creator?.username || "Creator"}</h2><p className="text-sm text-muted-foreground">@{creator?.username ?? "creator"} · {creator?.location ?? "Location not listed"}</p></div></div>
      {creator?.bio && <p className="mt-4 text-sm leading-relaxed text-foreground/80">{creator.bio}</p>}
      {skills.length > 0 && <div className="mt-4 flex flex-wrap gap-1.5">{skills.map((skill) => <span key={skill} className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">{skill}</span>)}</div>}
      <div className="mt-5 flex flex-wrap gap-2">
        {creator?.username && <Link to="/user/$username" params={{ username: creator.username }} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold">View profile</Link>}
        {creator?.id && <Link to="/messages" search={{ with: creator.id }} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold"><MessageCircle className="w-4 h-4" /> Message</Link>}
        {resume && <a href={resume} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold"><Download className="w-4 h-4" /> Resume</a>}
      </div>
    </section>
    {(application.message || application.cover_letter) && <section className="mt-4 rounded-2xl border border-border bg-surface p-5"><h2 className="font-bold">Application message</h2><p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80">{application.message || application.cover_letter}</p></section>}
    <section className="mt-4 rounded-2xl border border-border bg-surface p-5"><h2 className="font-bold">Work samples</h2>{portfolio.length ? <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">{portfolio.map((item) => <a key={item.id} href={item.project_link || item.media_url || "#"} target="_blank" rel="noreferrer" className="rounded-xl border border-border p-3 hover:border-brand/40"><p className="font-semibold text-sm">{item.title}</p><p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description || item.media_type}</p><ExternalLink className="mt-2 w-4 h-4 text-brand" /></a>)}</div> : <p className="mt-2 text-sm text-muted-foreground">No uploaded work samples yet.</p>}</section>
    {owner && application.status === "pending" && <div className="sticky bottom-4 mt-6 flex justify-end gap-2 rounded-2xl border border-border bg-background/95 p-3 backdrop-blur"><button disabled={busy} onClick={() => decide("rejected")} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold disabled:opacity-50">Reject</button><button disabled={busy || !application.applicant_id} onClick={() => decide("accepted")} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">{busy ? "Saving…" : "Accept & assign"}</button></div>}
  </main>;
}
