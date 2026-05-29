import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Briefcase, MapPin, Clock, Plus, X, Users, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/jobs")({
  head: () => ({ meta: [{ title: "Jobs — Omnicraft" }] }),
  component: JobsPage,
});

type Job = {
  id: string; title: string; description: string; category: string | null;
  location: string | null; budget: string | null; status: string;
  client_id: string; created_at: string;
  client?: { username: string; full_name: string | null; avatar_url: string | null };
};

type Squad = { id: string; name: string };

function JobsPage() {
  const { profile, user } = useAuth();
  const isClient = profile?.role === "client";
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("jobs").select("*").order("created_at", { ascending: false });
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

  useEffect(() => { load(); }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Open Projects</h1>
          <p className="text-sm text-gray-600 mt-1">{isClient ? "Manage your project posts" : "Find work that fits your craft"}</p>
        </div>
        {isClient && (
          <button onClick={() => setShowPost(true)} className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-1">
            <Plus className="w-4 h-4" /> Post Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center text-gray-500 py-12">Loading...</div>
      ) : jobs.length === 0 ? (
        <div className="bg-white/80 backdrop-blur rounded-2xl p-12 text-center border border-white shadow">
          <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-600">No jobs posted yet</p>
          {isClient && <button onClick={() => setShowPost(true)} className="mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold text-sm">Post the first one</button>}
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((j) => (
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
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-lg">{job.title}</h3>
            <p className="text-sm text-gray-600">by @{job.client?.username ?? "client"}</p>
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{job.description}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-500">
              {job.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {job.location}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(job.created_at).toLocaleDateString()}</span>
              {job.category && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full font-semibold">{job.category}</span>}
            </div>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {job.budget && <div className="text-lg font-bold text-emerald-600">{job.budget}</div>}
          {canApply && (
            <button onClick={onApply} className="mt-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold">Apply</button>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <Modal onClose={onClose} title="Post a Project">
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} />
        <textarea
          placeholder="Describe the project, deliverables, timeline..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={5}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
        />
        <div className="grid grid-cols-2 gap-3">
          <Input placeholder="Category (Video, Design...)" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
          <Input placeholder="Location (or Remote)" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
        </div>
        <Input placeholder="Budget (e.g. $2,000)" value={form.budget} onChange={(v) => setForm({ ...form, budget: v })} />
        <button disabled={busy} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl disabled:opacity-60">
          {busy ? "Posting..." : "Post Project"}
        </button>
      </form>
    </Modal>
  );
}

function ApplyJobModal({ job, onClose }: { job: Job; onClose: () => void }) {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState("");
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Apply as</label>
            <select value={squadId} onChange={(e) => setSquadId(e.target.value)} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500">
              <option value="">Myself</option>
              {squads.map((s) => <option key={s.id} value={s.id}>Squad: {s.name}</option>)}
            </select>
          </div>
        )}
        <Input placeholder="Portfolio URL (website, drive...)" value={portfolio} onChange={setPortfolio} />
        <textarea
          placeholder="Why are you the right fit? Add relevant past work, rates, timing..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 resize-none"
        />
        <button disabled={busy} className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
          <Send className="w-4 h-4" /> {busy ? "Sending..." : "Send Application"}
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
      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500"
    />
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
