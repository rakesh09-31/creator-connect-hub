import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { 
  Award, 
  ShieldCheck, 
  Sparkles, 
  MessageCircle, 
  ExternalLink, 
  Layers, 
  Cpu, 
  Wrench, 
  TrendingUp, 
  BrainCircuit, 
  Clock, 
  MapPin, 
  Send, 
  Briefcase,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Modal } from "./SharedUI";
import { SkillSwapListing } from "./SkillSwapCard";
import RequestSkillSwapModal from "./RequestSkillSwapModal";

type PortfolioProject = {
  id: string;
  title: string;
  description: string | null;
  project_link: string | null;
  website_url: string | null;
  tech: string[] | null;
  cover_url: string | null;
  media_url: string | null;
  media_type: string | null;
  created_at: string | null;
};

export default function SkillSwapDetailsModal({
  listing,
  isOwner,
  onClose,
  onEdit,
  hasExistingRequest,
  requestStatus,
}: {
  listing: SkillSwapListing;
  isOwner: boolean;
  onClose: () => void;
  onEdit?: () => void;
  hasExistingRequest?: boolean;
  requestStatus?: string;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"overview" | "verification" | "projects">("overview");
  const [projects, setProjects] = useState<PortfolioProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);

  const isVerified = listing.verification_status === "verified";
  const confidence = listing.verification_confidence || "low";
  const demonstratedLevel = listing.demonstrated_level || listing.skill_level;
  const declaredLevel = listing.declared_level || listing.skill_level;

  useEffect(() => {
    async function loadProjects() {
      if (!listing.user_id) return;
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("user_id", listing.user_id)
        .order("created_at", { ascending: false });

      if (!error && data) {
        setProjects(data as PortfolioProject[]);
      }
      setLoadingProjects(false);
    }
    loadProjects();
  }, [listing.user_id]);

  const handleStartChat = async () => {
    if (!user) {
      toast.error("Please sign in to chat");
      return;
    }
    try {
      const { data, error } = await (supabase.rpc as any)("get_or_create_dm", { _other: listing.user_id });
      if (error) throw error;
      if (data) {
        onClose();
        navigate({ to: "/messages", search: { c: data } as any });
      }
    } catch (err: any) {
      toast.error(`Could not start chat: ${err.message}`);
    }
  };

  const competencyScores = [
    { label: "Technical Knowledge", score: listing.technical_score ?? listing.technical_knowledge_score ?? listing.stage2_score, icon: <Cpu className="w-4 h-4 text-blue-500" /> },
    { label: "Scenario Reasoning", score: listing.scenario_score ?? listing.decision_making_score, icon: <BrainCircuit className="w-4 h-4 text-purple-500" /> },
    { label: "Software & Tools", score: listing.software_score ?? listing.stage3_score, icon: <Wrench className="w-4 h-4 text-emerald-500" /> },
    { label: "Practical Execution", score: listing.practical_score ?? listing.overall_score, icon: <Layers className="w-4 h-4 text-amber-500" /> },
    { label: "Theory & Principles", score: listing.theory_score, icon: <TrendingUp className="w-4 h-4 text-indigo-500" /> },
    { label: "Troubleshooting", score: listing.troubleshooting_score, icon: <AlertCircle className="w-4 h-4 text-rose-500" /> },
  ].filter(c => c.score != null);

  return (
    <Modal onClose={onClose} title="Creator Skill Swap Profile" maxWidth="max-w-2xl">
      <div className="space-y-5">
        {/* Profile Header */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-muted/40 border border-border">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              to="/user/$username"
              params={{ username: listing.profile?.username || "" }}
              className="w-14 h-14 rounded-2xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-lg border border-border shadow-sm"
            >
              {listing.profile?.avatar_url ? (
                <img src={listing.profile.avatar_url} className="w-full h-full object-cover" alt="" />
              ) : (
                (listing.profile?.username || "?").slice(0, 1).toUpperCase()
              )}
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link
                  to="/user/$username"
                  params={{ username: listing.profile?.username || "" }}
                  className="font-bold text-lg hover:text-brand transition truncate"
                >
                  {listing.profile?.full_name || listing.profile?.username}
                </Link>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {listing.role} <span className="mx-1">•</span> @{listing.profile?.username}
              </p>
              {listing.match_type && (
                <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-brand-soft/40 text-brand rounded border border-brand/30">
                  {listing.match_type} {listing.match_score ? `(${listing.match_score}%)` : ""}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {!isOwner && (
              <button
                onClick={handleStartChat}
                className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-border transition"
                title="Message creator"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Message
              </button>
            )}
            <Link
              to="/user/$username"
              params={{ username: listing.profile?.username || "" }}
              className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-border transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Profile
            </Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-border pb-1">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-1 transition ${
              activeTab === "overview" ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Skills & Goals
          </button>
          <button
            onClick={() => setActiveTab("verification")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-1 transition flex items-center gap-1.5 ${
              activeTab === "verification" ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> AI Verification Report
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-1 transition flex items-center gap-1.5 ${
              activeTab === "projects" ? "border-brand text-brand" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Portfolio Projects ({projects.length})
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* Description */}
            {listing.description && (
              <div className="p-3.5 bg-surface rounded-xl border border-border text-xs text-foreground/80 leading-relaxed whitespace-pre-line">
                <p className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground mb-1">About this Skill Swap</p>
                {listing.description}
              </div>
            )}

            {/* Skills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Teaching */}
              <div className="bg-muted/30 rounded-xl p-3.5 border border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-brand" /> What {isOwner ? "You Teach" : "They Teach"}
                </p>
                <div className="space-y-2">
                  {listing.teach_skills?.map((ts, i) => (
                    <div key={i} className="bg-background rounded-lg p-2.5 border border-border/60 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">{ts.skill?.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-semibold text-muted-foreground">
                          {ts.skill_level}
                        </span>
                      </div>
                      {ts.software && ts.software.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {ts.software.map(sw => (
                            <span key={sw} className="px-1.5 py-0.5 bg-brand-soft/20 text-brand text-[9px] font-semibold rounded border border-brand/20">
                              {sw}
                            </span>
                          ))}
                        </div>
                      )}
                      {ts.specialties && ts.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {ts.specialties.map(sp => (
                            <span key={sp} className="px-1.5 py-0.5 bg-muted text-[9px] rounded text-foreground/70">
                              {sp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Learning */}
              <div className="bg-muted/30 rounded-xl p-3.5 border border-border">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" /> What {isOwner ? "You Want to Learn" : "They Want to Learn"}
                </p>
                <div className="space-y-2">
                  {listing.learn_skills?.map((ls, i) => (
                    <div key={i} className="bg-background rounded-lg p-2.5 border border-border/60 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">{ls.skill?.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted font-semibold text-muted-foreground">
                          {ls.desired_level}
                        </span>
                      </div>
                      {ls.requirements && (
                        <p className="text-[11px] text-foreground/80 mt-1 bg-muted/40 p-1.5 rounded">{ls.requirements}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Meta tags */}
            <div className="flex flex-wrap gap-3 p-3 bg-surface rounded-xl border border-border text-xs text-muted-foreground">
              {listing.learning_mode && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Mode: <strong className="text-foreground">{listing.learning_mode}</strong>
                </div>
              )}
              {listing.availability && (
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Availability: <strong className="text-foreground">{listing.availability}</strong>
                </div>
              )}
              {listing.experience_duration && (
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" /> Experience: <strong className="text-foreground">{listing.experience_duration}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: AI VERIFICATION REPORT */}
        {activeTab === "verification" && (
          <div className="space-y-4">
            {isVerified ? (
              <>
                {/* Score Summary Banner */}
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-black text-xl">
                      {listing.overall_score || 0}%
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">AI Verified Competency Score</p>
                      <p className="text-xs text-foreground/70">
                        Demonstrated Level: <strong className="text-foreground font-bold">{demonstratedLevel}</strong> (Declared: {declaredLevel})
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border ${
                    confidence === "high" ? "bg-emerald-500/20 text-emerald-700 border-emerald-500/30" :
                    confidence === "medium" ? "bg-amber-500/20 text-amber-700 border-amber-500/30" :
                    "bg-muted text-foreground/70 border-border"
                  }`}>
                    {confidence} Confidence
                  </span>
                </div>

                {/* 8-Competency Score Breakdown */}
                {competencyScores.length > 0 && (
                  <div className="bg-surface rounded-xl p-4 border border-border">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Multi-Competency Assessment Scores</p>
                    <div className="grid grid-cols-2 gap-3">
                      {competencyScores.map(comp => (
                        <div key={comp.label} className="p-2.5 rounded-lg bg-muted/30 border border-border/50">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-1.5 font-medium text-foreground/90">
                              {comp.icon} {comp.label}
                            </span>
                            <span className="font-bold">{comp.score}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                (comp.score || 0) >= 80 ? "bg-emerald-500" :
                                (comp.score || 0) >= 60 ? "bg-brand" : "bg-amber-500"
                              }`}
                              style={{ width: `${Math.min(100, Math.max(0, comp.score || 0))}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths & Recommendations */}
                {listing.strengths_summary && (
                  <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-emerald-700 mb-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Strengths
                    </p>
                    <p className="text-foreground/80 leading-relaxed">{listing.strengths_summary}</p>
                  </div>
                )}

                {listing.recommendations_summary && (
                  <div className="p-3.5 bg-brand-soft/30 border border-brand/20 rounded-xl text-xs">
                    <p className="font-bold text-[10px] uppercase tracking-widest text-brand mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Learning Recommendations
                    </p>
                    <p className="text-foreground/80 leading-relaxed">{listing.recommendations_summary}</p>
                  </div>
                )}
              </>
            ) : (
              <div className="p-8 text-center bg-surface rounded-2xl border border-border">
                <ShieldCheck className="w-10 h-10 mx-auto text-muted-foreground mb-2 opacity-50" />
                <p className="text-sm font-semibold">Self-Declared Skill Swap</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  This creator has declared their skills and learning goals. AI multi-stage voice & mock verification is optional.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PORTFOLIO PROJECTS */}
        {activeTab === "projects" && (
          <div className="space-y-3">
            {loadingProjects ? (
              <div className="text-center py-10 text-xs text-muted-foreground">Loading portfolio projects…</div>
            ) : projects.length === 0 ? (
              <div className="text-center py-10 bg-surface rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                No portfolio projects published yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.map(proj => (
                  <div key={proj.id} className="p-3 bg-surface rounded-xl border border-border hover:border-brand/40 transition flex flex-col justify-between">
                    <div>
                      {proj.cover_url && (
                        <div className="aspect-video w-full rounded-lg bg-muted overflow-hidden mb-2">
                          <img src={proj.cover_url} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h4 className="font-bold text-xs tracking-tight text-foreground">{proj.title}</h4>
                      {proj.description && (
                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{proj.description}</p>
                      )}
                      {proj.tech && proj.tech.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {proj.tech.map(t => (
                            <span key={t} className="px-1.5 py-0.5 bg-muted text-[9px] rounded font-semibold text-foreground/70">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {(proj.project_link || proj.website_url) && (
                      <a
                        href={proj.project_link || proj.website_url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-[11px] text-brand hover:underline font-semibold"
                      >
                        <ExternalLink className="w-3 h-3" /> View Project Link
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3 border-t border-border flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>

          <div className="flex items-center gap-2">
            {isOwner ? (
              <button
                onClick={() => { onClose(); onEdit?.(); }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition"
              >
                Edit My Skill Swap
              </button>
            ) : hasExistingRequest ? (
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-xl ${
                  requestStatus === "accepted" ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30" :
                  requestStatus === "rejected" ? "bg-rose-500/15 text-rose-600 border border-rose-500/30" :
                  "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                }`}>
                  Request {requestStatus || "Pending"}
                </span>
                <button
                  onClick={handleStartChat}
                  className="px-4 py-2 bg-brand text-white rounded-xl text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Message
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" /> Request Skill Swap
              </button>
            )}
          </div>
        </div>
      </div>

      {showRequestModal && (
        <RequestSkillSwapModal
          listing={listing}
          onClose={() => { setShowRequestModal(false); onClose(); }}
        />
      )}
    </Modal>
  );
}
