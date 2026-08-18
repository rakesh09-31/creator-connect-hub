import { Link, useNavigate } from "@tanstack/react-router";
import { 
  Sparkles, 
  MessageCircle, 
  Clock, 
  MapPin, 
  Award, 
  ShieldCheck, 
  Briefcase, 
  Eye, 
  Send,
  CheckCircle,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import RequestSkillSwapModal from "./RequestSkillSwapModal";
import SkillSwapDetailsModal from "./SkillSwapDetailsModal";

export type SkillSwapListing = {
  id: string;
  user_id: string;
  title: string;
  role: string;
  description: string;
  learning_mode: string;
  availability: string;
  is_active: boolean;
  verification_status: string;
  overall_score: number | null;
  skill_level: string;
  declared_level?: string | null;
  demonstrated_level?: string | null;
  verification_confidence?: string | null;
  theory_score?: number | null;
  technical_score?: number | null;
  scenario_score?: number | null;
  practical_score?: number | null;
  software_score?: number | null;
  troubleshooting_score?: number | null;
  decision_making_score?: number | null;
  communication_score?: number | null;
  technical_knowledge_score?: number | null;
  knowledge_score?: number | null;
  problem_solving_score?: number | null;
  stage2_score?: number | null;
  stage3_score?: number | null;
  strengths_summary?: string | null;
  weaknesses_summary?: string | null;
  recommendations_summary?: string | null;
  ai_feedback?: string | null;
  experience_duration?: string | null;
  ai_verified_at: string | null;
  profile?: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  teach_skills: { skill: { id: string; name: string }; skill_level: string; specialties: string[]; software?: string[]; sub_skills?: string[] }[];
  learn_skills: { skill: { id: string; name: string }; desired_level: string; requirements: string }[];
  match_score?: number;
  match_type?: string;
};

export default function SkillSwapCard({
  listing,
  isOwner,
  onEdit,
  onDelete,
  existingRequest,
  onStatusChange,
}: {
  listing: SkillSwapListing;
  isOwner: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  existingRequest?: { id: string; status: string } | null;
  onStatusChange?: () => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const isVerified = listing.verification_status === "verified";
  const confidence = listing.verification_confidence || "low";
  const demonstratedLevel = listing.demonstrated_level || listing.skill_level;
  const declaredLevel = listing.declared_level || listing.skill_level;

  const handleMessageCreator = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Please sign in to message this creator");
      return;
    }
    try {
      const { data, error } = await (supabase.rpc as any)("get_or_create_dm", { _other: listing.user_id });
      if (error) throw error;
      if (data) {
        navigate({ to: "/messages", search: { c: data } as any });
      }
    } catch (err: any) {
      toast.error(`Could not start chat: ${err.message}`);
    }
  };

  const confidenceBadge = isVerified ? (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${
      confidence === "high" ? "text-emerald-700 bg-emerald-500/15 border-emerald-500/30" :
      confidence === "medium" ? "text-amber-700 bg-amber-500/15 border-amber-500/30" :
      "text-muted-foreground bg-muted border-border"
    }`}>
      <ShieldCheck className="w-3 h-3" />
      {confidence === "high" ? "High Confidence" : confidence === "medium" ? "Med Confidence" : "Low Confidence"}
    </span>
  ) : null;

  return (
    <div className="bg-surface rounded-2xl p-5 border border-border hover:border-brand/40 hover:shadow-md transition">
      {/* Top row: Creator Identity + Badges */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 flex-1 min-w-0">
          <Link
            to="/user/$username"
            params={{ username: listing.profile?.username || "" }}
            className="w-12 h-12 rounded-2xl bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-base border border-border hover:opacity-90 transition"
          >
            {listing.profile?.avatar_url ? (
              <img src={listing.profile.avatar_url} className="w-full h-full object-cover" alt="" />
            ) : (
              (listing.profile?.username || "?").slice(0, 1).toUpperCase()
            )}
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                to="/user/$username"
                params={{ username: listing.profile?.username || "" }}
                className="font-bold text-base tracking-tight leading-snug hover:text-brand transition"
              >
                {listing.profile?.full_name || listing.profile?.username}
              </Link>
              {isOwner && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-brand/10 text-brand px-2 py-0.5 rounded-md border border-brand/20">
                  Your Post
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5 font-medium flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-foreground/80">{listing.role || "Creator"}</span>
              <span>•</span>
              <Link to="/user/$username" params={{ username: listing.profile?.username || "" }} className="hover:underline">
                @{listing.profile?.username}
              </Link>
            </div>
          </div>
        </div>
        
        {/* Match and Verification Badges */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          {listing.match_type && (
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                listing.match_type === "Perfect Mutual Match"
                  ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                  : listing.match_type === "Strong Match"
                  ? "bg-brand-soft text-brand border border-brand/30"
                  : "bg-muted text-foreground/70 border border-border"
              }`}
            >
              {listing.match_type} {listing.match_score ? `(${listing.match_score}%)` : ""}
            </span>
          )}
          
          {isVerified && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              <ShieldCheck className="w-3.5 h-3.5" /> AI Verified {listing.overall_score}%
            </span>
          )}
          {confidenceBadge}
        </div>
      </div>

      {/* Multi-Stage Verification score tags */}
      {isVerified && (listing.stage2_score != null || listing.stage3_score != null || listing.scenario_score != null || listing.technical_score != null) && (
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          {listing.stage2_score != null && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 border border-border text-foreground/80 font-semibold">
              Voice Exam: <strong className="text-foreground">{listing.stage2_score}%</strong>
            </span>
          )}
          {listing.stage3_score != null && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 border border-border text-foreground/80 font-semibold">
              Mock Test: <strong className="text-foreground">{listing.stage3_score}%</strong>
            </span>
          )}
          {listing.scenario_score != null && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-muted/60 border border-border text-foreground/80 font-semibold">
              Scenario: <strong className="text-foreground">{listing.scenario_score}%</strong>
            </span>
          )}
          {listing.demonstrated_level && (
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-brand-soft/30 border border-brand/20 text-brand font-semibold">
              Demonstrated Level: <strong>{demonstratedLevel}</strong>
            </span>
          )}
        </div>
      )}

      {/* Skills Grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Can Teach */}
        <div className="bg-muted/30 rounded-xl p-3.5 border border-border/60">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-brand" /> Can Teach
          </p>
          <div className="space-y-2">
            {listing.teach_skills?.map((ts, i) => (
              <div key={i} className="bg-background rounded-lg p-2.5 text-xs border border-border/50 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{ts.skill?.name}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isVerified && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 px-1 bg-emerald-500/10 rounded">
                        Verified
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground font-semibold">
                      {demonstratedLevel || ts.skill_level}
                    </span>
                  </div>
                </div>
                {/* Software tags */}
                {ts.software && ts.software.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-1 mt-1.5">
                    {ts.software.map((sw) => (
                      <span key={sw} className="bg-brand-soft/25 text-brand text-[9px] px-1.5 py-0.5 rounded border border-brand/20 font-semibold">
                        {sw}
                      </span>
                    ))}
                  </div>
                )}
                {/* Specialties */}
                {ts.specialties && ts.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ts.specialties.map((sp) => (
                      <span key={sp} className="bg-muted text-[9px] px-1.5 py-0.5 rounded text-foreground/70">
                        {sp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wants to Learn */}
        <div className="bg-muted/30 rounded-xl p-3.5 border border-border/60">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" /> Wants to Learn
          </p>
          <div className="space-y-2">
            {listing.learn_skills?.map((ls, i) => (
              <div key={i} className="bg-background rounded-lg p-2.5 text-xs border border-border/50 shadow-2xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{ls.skill?.name}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold">{ls.desired_level}</span>
                </div>
                {ls.requirements && (
                  <p className="text-[11px] text-foreground/80 mt-1 bg-muted/40 p-1.5 rounded">{ls.requirements}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Description */}
      {listing.description && (
        <p className="text-sm text-foreground/80 mt-3.5 line-clamp-2 leading-relaxed whitespace-pre-line">
          {listing.description}
        </p>
      )}

      {/* Verified Strengths Pill */}
      {isVerified && listing.strengths_summary && (
        <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-xs text-foreground/80">
          <p className="font-semibold text-emerald-700 text-[10px] uppercase tracking-widest mb-0.5">Verified Strengths</p>
          <p className="line-clamp-2">{listing.strengths_summary}</p>
        </div>
      )}

      {/* Bottom Metadata & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-border">
        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {listing.learning_mode && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Mode: <strong className="text-foreground/90">{listing.learning_mode}</strong></span>
            </div>
          )}
          {listing.availability && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Availability: <strong className="text-foreground/90">{listing.availability}</strong></span>
            </div>
          )}
          {listing.experience_duration && (
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>Exp: <strong className="text-foreground/90">{listing.experience_duration}</strong></span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Details & Projects */}
          <button
            onClick={() => setShowDetailsModal(true)}
            className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-border transition"
          >
            <Eye className="w-3.5 h-3.5" /> Details & Projects
          </button>

          {isOwner ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition"
              >
                Edit Post
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-xl text-xs font-semibold transition"
                >
                  Delete
                </button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              {/* Message / Chat Button */}
              <button
                onClick={handleMessageCreator}
                className="px-3 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-border transition"
                title="Message creator"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Message
              </button>

              {/* Request or Status Badge */}
              {existingRequest ? (
                <span className={`px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border flex items-center gap-1 ${
                  existingRequest.status === "accepted" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" :
                  existingRequest.status === "rejected" ? "bg-rose-500/15 text-rose-600 border-rose-500/30" :
                  "bg-amber-500/15 text-amber-600 border-amber-500/30"
                }`}>
                  <CheckCircle className="w-3.5 h-3.5" /> Request {existingRequest.status}
                </span>
              ) : (
                <button
                  onClick={() => setShowRequestModal(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" /> Request Skill Swap
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showRequestModal && (
        <RequestSkillSwapModal
          listing={listing}
          onClose={() => {
            setShowRequestModal(false);
            onStatusChange?.();
          }}
        />
      )}

      {showDetailsModal && (
        <SkillSwapDetailsModal
          listing={listing}
          isOwner={isOwner}
          onClose={() => setShowDetailsModal(false)}
          onEdit={onEdit}
          hasExistingRequest={!!existingRequest}
          requestStatus={existingRequest?.status}
        />
      )}
    </div>
  );
}
