import React, { useState, useEffect } from "react";
import {
  Send,
  X,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { RealCreatorProfile, OmniForgeProject } from "@/lib/omniforge/types";
import { CreatorAvatar } from "./CreatorAvatar";
import {
  getOrCreateProjectSquad,
  sendCreatorInvitation,
  SquadInvitation,
} from "@/lib/omniforge/collaboration";

interface InviteCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  creator: RealCreatorProfile | null;
  roleName: string;
  project: OmniForgeProject | null;
  currentUserId?: string;
  onInvitationSent: (invitation: SquadInvitation) => void;
}

export function InviteCreatorModal({
  isOpen,
  onClose,
  creator,
  roleName,
  project,
  currentUserId,
  onInvitationSent,
}: InviteCreatorModalProps) {
  const [role, setRole] = useState(roleName || "");
  const [projectName, setProjectName] = useState("");
  const [brief, setBrief] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && creator) {
      setRole(roleName || creator.roles[0] || "Creative Collaborator");
      setProjectName(project?.title || "Short Film Project");
      setBrief(
        project?.description ||
          project?.storyPremise ||
          `We are assembling our core team for ${project?.title || "an exciting production"}. We would love to have you join as ${roleName}.`
      );
      setBudget(project?.budget || "₹15,000");
      setTimeline(project?.estimatedTotalDuration || "2 weeks");
      setErrorMessage(null);
    }
  }, [isOpen, creator, roleName, project]);

  if (!isOpen || !creator) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      toast.error("You must be signed in to send project invitations.");
      return;
    }
    if (!role.trim()) {
      setErrorMessage("Please specify the project role.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Get or create the underlying Project Squad
      const squadRes = await getOrCreateProjectSquad(
        project || {
          id: `proj-${Date.now()}`,
          ownerId: currentUserId,
          title: projectName,
          description: brief,
          domain: "Film",
          userType: "creator",
          stage: "planning",
          goal: "",
          targetAudience: "",
          expectedFinalOutcome: "",
          complexity: "Moderate",
          estimatedTotalDuration: timeline,
          budget,
          deliverables: [],
          phases: [],
          roles: [],
          parallelWorkstreams: [],
          recommendations: [],
          coverage: { totalRequired: 1, totalCovered: 0, percentage: 0, coveredCapabilities: [], missingCapabilities: [] },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        currentUserId
      );

      if (!squadRes.success || !squadRes.squadId) {
        setErrorMessage(squadRes.error || "Failed to initialize squad workspace.");
        setIsSubmitting(false);
        return;
      }

      // 2. Dispatch real creator invitation
      const invRes = await sendCreatorInvitation({
        squadId: squadRes.squadId,
        inviterId: currentUserId,
        inviteeId: creator.id,
        role: role.trim(),
        projectName: projectName.trim(),
        brief: brief.trim(),
        budget: budget.trim(),
        timeline: timeline.trim(),
      });

      if (!invRes.success || !invRes.invitation) {
        const err = invRes.error || "Failed to send invitation.";
        setErrorMessage(err);
        toast.error(err);
        setIsSubmitting(false);
        return;
      }

      toast.success(`Invitation sent to ${creator.fullName || creator.username}!`);
      onInvitationSent(invRes.invitation);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border/80 bg-surface-muted/50">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand" />
            <h3 className="font-bold text-sm text-foreground">Invite Creator to Project</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-muted transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Creator Identity Preview */}
        <div className="p-4 bg-brand-soft/20 border-b border-brand/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreatorAvatar
              url={creator.avatarUrl}
              name={creator.fullName || creator.username}
              size="md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  {creator.fullName || creator.username}
                </span>
                <span className="text-[10px] text-muted-foreground">@{creator.username}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Verified Creator • {creator.specialties[0] || creator.roles[0] || "Creative"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-500 font-semibold px-2 py-1 rounded-md bg-emerald-500/10">
            <ShieldCheck className="w-3.5 h-3.5" />
            Verified Profile
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-surface-muted border border-border text-xs text-foreground focus:outline-none focus:border-brand"
              placeholder="e.g. Suspense Short Film"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Assigned Role
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-surface-muted border border-border text-xs text-foreground focus:outline-none focus:border-brand"
                placeholder="e.g. Video Editor, Lead Actor"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Estimated Timeline
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                <input
                  type="text"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface-muted border border-border text-xs text-foreground focus:outline-none focus:border-brand"
                  placeholder="e.g. 2 weeks shoot"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Role Budget / Compensation
            </label>
            <div className="relative">
              <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-surface-muted border border-border text-xs text-foreground focus:outline-none focus:border-brand"
                placeholder="e.g. ₹15,000 / Skill Swap"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Project Brief & Expectations
            </label>
            <textarea
              rows={3}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-xl bg-surface-muted border border-border text-xs text-foreground focus:outline-none focus:border-brand resize-none"
              placeholder="Outline the story premise, scene requirements, deliverables, and expectations..."
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-border/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-2 rounded-xl bg-surface hover:bg-surface-muted border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-brand text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
