import { useEffect, useState } from "react";
import { X, Send, Users, Clock, Briefcase, Sparkles, Loader2, ShieldCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export type SquadTarget = {
  id: string;
  name: string;
  description?: string | null;
  specialty?: string | null;
  avatar_url?: string | null;
  owner_id: string;
  owner_username?: string | null;
  owner_full_name?: string | null;
};

export type ClientBrief = {
  id: string;
  title: string;
  description?: string | null;
  budget?: string | null;
  duration?: string | null;
  category?: string | null;
};

interface HireSquadModalProps {
  squad: SquadTarget;
  onClose: () => void;
  onSuccess?: (requestId: string) => void;
  initialBriefs?: ClientBrief[];
}

export function HireSquadModal({
  squad,
  onClose,
  onSuccess,
  initialBriefs,
}: HireSquadModalProps) {
  const { user, profile } = useAuth();

  const [briefs, setBriefs] = useState<ClientBrief[]>(initialBriefs || []);
  const [selectedBriefId, setSelectedBriefId] = useState<string>("custom");
  const [projectName, setProjectName] = useState("");
  const [projectBrief, setProjectBrief] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingBriefs, setLoadingBriefs] = useState(!initialBriefs);
  const [resolvedLeader, setResolvedLeader] = useState<{
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  // Load client briefs & resolve full leader profile
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      if (!user) return;

      // 1. Resolve squad leader profile
      const { data: leaderData } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("id", squad.owner_id)
        .maybeSingle();

      if (!cancelled && leaderData) {
        setResolvedLeader(leaderData);
      }

      // 2. Load briefs if not passed
      if (!initialBriefs || initialBriefs.length === 0) {
        setLoadingBriefs(true);
        const { data: jobsData } = await supabase
          .from("jobs")
          .select("id, title, description, budget, duration, category")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false });

        if (!cancelled) {
          const list = (jobsData || []) as ClientBrief[];
          setBriefs(list);
          if (list.length > 0) {
            setSelectedBriefId(list[0].id);
            setProjectName(list[0].title);
            setProjectBrief(list[0].description || "");
            setBudget(list[0].budget || "");
            setTimeline(list[0].duration || "");
          }
          setLoadingBriefs(false);
        }
      } else if (initialBriefs.length > 0) {
        setSelectedBriefId(initialBriefs[0].id);
        setProjectName(initialBriefs[0].title);
        setProjectBrief(initialBriefs[0].description || "");
        setBudget(initialBriefs[0].budget || "");
        setTimeline(initialBriefs[0].duration || "");
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [user, squad.owner_id, initialBriefs]);

  // Handle brief selection changes
  const handleSelectBrief = (briefId: string) => {
    setSelectedBriefId(briefId);
    if (briefId === "custom") {
      setProjectName("");
      setProjectBrief("");
      setBudget("");
      setTimeline("");
    } else {
      const b = briefs.find((item) => item.id === briefId);
      if (b) {
        setProjectName(b.title);
        setProjectBrief(b.description || "");
        setBudget(b.budget || "");
        setTimeline(b.duration || "");
      }
    }
  };

  const leaderUsername =
    resolvedLeader?.username || squad.owner_username || "leader";
  const leaderFullName =
    resolvedLeader?.full_name || squad.owner_full_name || null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to send a hiring request");
      return;
    }

    if (!projectName.trim()) {
      toast.error("Project name is required");
      return;
    }

    setBusy(true);

    try {
      const { data, error } = await supabase.rpc("send_squad_hiring_request", {
        p_squad_id: squad.id,
        p_project_name: projectName.trim(),
        p_project_brief: projectBrief.trim() || null,
        p_budget: budget.trim() || null,
        p_timeline: timeline.trim() || null,
        p_message: message.trim() || null,
        p_project_id: selectedBriefId !== "custom" ? selectedBriefId : null,
      });

      if (error) {
        throw error;
      }

      const res = data as any;
      toast.success(`Hiring request sent to @${leaderUsername} for ${squad.name}`);
      if (onSuccess && res?.request_id) {
        onSuccess(res.request_id);
      }
      onClose();
    } catch (err: any) {
      console.error("[HireSquadModal] submission error:", err);
      toast.error(err.message || "Failed to send squad hiring request");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-background w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl p-6 max-h-[92vh] overflow-y-auto border border-border shadow-2xl space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-brand text-primary-foreground flex items-center justify-center font-bold text-lg shadow-sm">
              {squad.avatar_url ? (
                <img
                  src={squad.avatar_url}
                  alt=""
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                squad.name.slice(0, 1).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Hire {squad.name}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-soft text-brand">
                  Squad
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Collaborative team request
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Squad Leader Info Banner */}
        <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center font-semibold text-foreground shrink-0 overflow-hidden">
              {resolvedLeader?.avatar_url ? (
                <img
                  src={resolvedLeader.avatar_url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                leaderUsername.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-foreground truncate">
                  {leaderFullName || leaderUsername}
                </span>
                <span className="text-muted-foreground truncate">
                  @{leaderUsername}
                </span>
                <ShieldCheck className="w-3.5 h-3.5 text-brand shrink-0" />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Squad Leader · Receives & coordinates this request
              </p>
            </div>
          </div>
          {squad.specialty && (
            <span className="px-2 py-0.5 rounded bg-muted text-[10px] font-semibold text-muted-foreground whitespace-nowrap shrink-0">
              {squad.specialty}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Project / Brief</span>
              {briefs.length > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  Select existing or type custom
                </span>
              )}
            </label>
            {briefs.length > 0 ? (
              <select
                value={selectedBriefId}
                onChange={(e) => handleSelectBrief(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring/40 text-foreground cursor-pointer"
              >
                {briefs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} {b.budget ? `(${b.budget})` : ""}
                  </option>
                ))}
                <option value="custom">+ Create / Enter Custom Project</option>
              </select>
            ) : null}

            <input
              type="text"
              placeholder="Project Name (e.g. Short Film: A Village Singer's Dream)"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm font-medium"
            />
          </div>

          {/* Project Brief */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Project Brief & Scope
            </label>
            <textarea
              placeholder="Describe deliverables, key requirements, creative vision, and locations…"
              value={projectBrief}
              onChange={(e) => setProjectBrief(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none"
            />
          </div>

          {/* Budget & Timeline Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Budget
              </label>
              <input
                type="text"
                placeholder="e.g. ₹15,000 or $2,500"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Timeline
              </label>
              <input
                type="text"
                placeholder="e.g. 4–6 weeks or May 1 – June 15"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
              />
            </div>
          </div>

          {/* Message to Squad Leader */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Message to Squad Leader
            </label>
            <textarea
              placeholder={`Write a personal message to @${leaderUsername} explaining why your project is a good fit for ${squad.name}…`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-border hover:bg-muted text-foreground transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !projectName.trim()}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition shadow-sm"
            >
              {busy ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending…
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Hiring Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
