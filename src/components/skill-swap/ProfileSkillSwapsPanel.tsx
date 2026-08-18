import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Check, X, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import SkillSwapCard, { SkillSwapListing } from "./SkillSwapCard";
import PostSkillSwapModal from "./PostSkillSwapModal";

export default function ProfileSkillSwapsPanel() {
  const { user, profile } = useAuth();
  const [listing, setListing] = useState<SkillSwapListing | null>(null);
  const [requestsSent, setRequestsSent] = useState<any[]>([]);
  const [requestsReceived, setRequestsReceived] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // 1. Load active listing for current user
      const { data: myListingData, error: myListingError } = await (supabase as any)
        .from("skill_swap_listings")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (myListingData) {
        // Fetch teach skills
        const { data: teachData } = await (supabase as any)
          .from("skill_swap_listing_teach_skills")
          .select("*")
          .eq("listing_id", myListingData.id);

        // Fetch learn skills
        const { data: learnData } = await (supabase as any)
          .from("skill_swap_listing_learn_skills")
          .select("*")
          .eq("listing_id", myListingData.id);

        const teach = (teachData || []).map((ts: any) => ({
          skill: { id: ts.skill_id || ts.id, name: ts.skill_name || "Skill" },
          skill_level: ts.skill_level || "Intermediate",
          software: ts.software || [],
          sub_skills: ts.sub_skills || [],
          specialties: ts.specialties || []
        }));

        const learn = (learnData || []).map((ls: any) => ({
          skill: { id: ls.skill_id || ls.id, name: ls.skill_name || "Skill" },
          desired_level: ls.desired_level || "Intermediate",
          requirements: ls.requirements || ""
        }));

        setListing({
          ...myListingData,
          profile: {
            username: profile?.username || "me",
            full_name: profile?.full_name || profile?.username || "Me",
            avatar_url: profile?.avatar_url || null
          },
          teach_skills: teach.length > 0 ? teach : [{
            skill: { id: myListingData.id, name: myListingData.role || myListingData.title || "Creator" },
            skill_level: myListingData.skill_level || "Intermediate",
            specialties: [],
            software: [],
            sub_skills: []
          }],
          learn_skills: learn
        });
      } else {
        setListing(null);
      }

      // 2. Load requests sent
      const { data: sent } = await (supabase as any)
        .from("skill_swap_requests")
        .select("*")
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      if (sent && sent.length > 0) {
        const receiverIds = [...new Set(sent.map((s: any) => s.receiver_id).filter(Boolean))];
        const { data: recProfiles } = await (supabase as any)
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", receiverIds);

        const recMap: Record<string, any> = {};
        (recProfiles || []).forEach((p: any) => { recMap[p.id] = p; });
        setRequestsSent(sent.map((s: any) => ({ ...s, receiver: recMap[s.receiver_id] || { username: "creator" } })));
      } else {
        setRequestsSent([]);
      }

      // 3. Load requests received
      const { data: received } = await (supabase as any)
        .from("skill_swap_requests")
        .select("*")
        .eq("receiver_id", user.id)
        .order("created_at", { ascending: false });

      if (received && received.length > 0) {
        const senderIds = [...new Set(received.map((r: any) => r.sender_id).filter(Boolean))];
        const { data: sendProfiles } = await (supabase as any)
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", senderIds);

        const sendMap: Record<string, any> = {};
        (sendProfiles || []).forEach((p: any) => { sendMap[p.id] = p; });
        setRequestsReceived(received.map((r: any) => ({ ...r, sender: sendMap[r.sender_id] || { username: "creator" } })));
      } else {
        setRequestsReceived([]);
      }
    } catch (err: any) {
      console.error("Profile skill swaps loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const updateRequestStatus = async (requestId: string, status: "accepted" | "rejected" | "cancelled") => {
    const { error } = await (supabase as any)
      .from("skill_swap_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Request ${status}`);
    load();
  };

  const deleteListing = async () => {
    if (!listing || !confirm("Are you sure you want to delete your active Skill Swap listing?")) return;
    
    const { error } = await (supabase as any)
      .from("skill_swap_listings")
      .update({ is_active: false })
      .eq("id", listing.id);

    if (error) {
      toast.error(error.message);
      return;
    }
    
    toast.success("Skill Swap listing deleted");
    load();
  };

  if (loading) return <div className="text-center py-10 text-sm text-muted-foreground">Loading Skill Swaps...</div>;

  return (
    <div className="space-y-8 mt-4">
      {/* My Listing */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Active Listing</h3>
          {listing && (
            <button 
              onClick={deleteListing}
              className="text-xs text-rose-500 hover:underline font-semibold"
            >
              Delete listing
            </button>
          )}
        </div>
        
        {listing ? (
          <SkillSwapCard
            listing={listing}
            isOwner={true}
            onEdit={() => setShowEdit(true)}
            onDelete={deleteListing}
          />
        ) : (
          <div className="bg-surface rounded-xl p-6 text-center border border-dashed border-border">
            <p className="text-sm text-muted-foreground mb-3">You don't have an active Skill Swap listing.</p>
            <button 
              onClick={() => setShowEdit(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition"
            >
              Post Skill Swap
            </button>
          </div>
        )}
      </section>

      {/* Received Requests */}
      {requestsReceived.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Requests Received</h3>
          <div className="space-y-4">
            {requestsReceived.map(req => (
              <div key={req.id} className="bg-surface rounded-xl border border-border overflow-hidden">
                {/* Applicant header */}
                <div className="flex items-start justify-between gap-4 p-4">
                  <div className="flex items-start gap-3">
                    <Link
                      to="/user/$username"
                      params={{ username: req.sender?.username || "" }}
                      className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold"
                    >
                      {req.sender?.avatar_url ? (
                        <img src={req.sender.avatar_url} className="w-full h-full object-cover" alt="" />
                      ) : (
                        (req.sender?.username || "?").slice(0, 1).toUpperCase()
                      )}
                    </Link>
                    <div>
                      <p className="text-sm font-semibold">
                        <Link to="/user/$username" params={{ username: req.sender?.username || "" }} className="hover:text-brand">
                          {req.sender?.full_name || req.sender?.username}
                        </Link>
                      </p>
                      <p className="text-xs text-muted-foreground">@{req.sender?.username}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded flex-shrink-0 ${
                    req.status === 'accepted' ? 'bg-emerald-500/15 text-emerald-600' :
                    req.status === 'rejected' ? 'bg-rose-500/15 text-rose-600' :
                    req.status === 'cancelled' ? 'bg-muted text-foreground/70' :
                    'bg-amber-500/15 text-amber-600'
                  }`}>
                    {req.status}
                  </span>
                </div>

                {/* Message */}
                {req.message && (
                  <div className="mx-4 mb-3 text-sm text-foreground/80 bg-muted/50 p-3 rounded-lg flex items-start gap-2">
                    <MessageCircle className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <p className="whitespace-pre-line">{req.message}</p>
                  </div>
                )}

                {/* Accept / Reject */}
                {req.status === 'pending' && (
                  <div className="flex gap-2 p-4 pt-0">
                    <button
                      onClick={() => updateRequestStatus(req.id, "accepted")}
                      className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                    <button
                      onClick={() => updateRequestStatus(req.id, "rejected")}
                      className="flex-1 py-2 bg-muted text-foreground rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sent Requests */}
      {requestsSent.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Requests Sent</h3>
          <div className="space-y-3">
            {requestsSent.map(req => (
              <div key={req.id} className="bg-surface rounded-xl p-4 border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Link
                    to="/user/$username"
                    params={{ username: req.receiver?.username || "" }}
                    className="w-8 h-8 rounded-full bg-muted overflow-hidden flex items-center justify-center font-semibold text-xs"
                  >
                    {req.receiver?.avatar_url ? (
                      <img src={req.receiver.avatar_url} className="w-full h-full object-cover" alt="" />
                    ) : (
                      (req.receiver?.username || "?").slice(0, 1).toUpperCase()
                    )}
                  </Link>
                  <div>
                    <p className="text-sm font-semibold">To: @{req.receiver?.username}</p>
                    <p className="text-xs text-muted-foreground">Sent on {new Date(req.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded ${
                    req.status === 'accepted' ? 'bg-emerald-500/15 text-emerald-600' :
                    req.status === 'rejected' ? 'bg-rose-500/15 text-rose-600' :
                    req.status === 'cancelled' ? 'bg-muted text-foreground/70' :
                    'bg-amber-500/15 text-amber-600'
                  }`}>
                    {req.status}
                  </span>
                  
                  {req.status === 'pending' && (
                    <button
                      onClick={() => updateRequestStatus(req.id, "cancelled")}
                      className="text-[10px] text-muted-foreground hover:text-foreground underline font-semibold"
                    >
                      Cancel request
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showEdit && (
        <PostSkillSwapModal 
          onClose={() => setShowEdit(false)}
          onCreated={() => { setShowEdit(false); load(); }}
          existingListing={listing}
        />
      )}
    </div>
  );
}
