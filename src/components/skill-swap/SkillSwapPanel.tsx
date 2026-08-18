import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { 
  Search, 
  Plus, 
  Sparkles, 
  Award, 
  ShieldCheck, 
  MessageCircle, 
  Check, 
  X, 
  Inbox, 
  Send, 
  Filter, 
  RefreshCw,
  Users,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import SkillSwapCard, { SkillSwapListing } from "./SkillSwapCard";
import PostSkillSwapModal from "./PostSkillSwapModal";

export default function SkillSwapPanel() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [myListings, setMyListings] = useState<SkillSwapListing[]>([]);
  const [recommendedListings, setRecommendedListings] = useState<SkillSwapListing[]>([]);
  const [otherListings, setOtherListings] = useState<SkillSwapListing[]>([]);
  const [sentRequests, setSentRequests] = useState<any[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingListing, setEditingListing] = useState<SkillSwapListing | null>(null);

  const [searchQ, setSearchQ] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [activeRequestsTab, setActiveRequestsTab] = useState<"received" | "sent" | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async () => {
    setLoading(true);

    try {
      // 1. Fetch active listings
      const { data: rawListings, error: listingsError } = await (supabase as any)
        .from("skill_swap_listings")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (listingsError) {
        console.error("Error loading skill swap listings:", listingsError);
        toast.error(`Could not load listings: ${listingsError.message}`);
        setLoading(false);
        return;
      }

      const allListings = (rawListings || []) as any[];

      if (allListings.length === 0) {
        setMyListings([]);
        setRecommendedListings([]);
        setOtherListings([]);
        setLoading(false);
        return;
      }

      const listingIds = allListings.map(l => l.id);
      const userIds = [...new Set(allListings.map(l => l.user_id).filter(Boolean))];

      // 2. Fetch profiles safely
      let profileMap: Record<string, { username: string; full_name: string | null; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        try {
          const { data: profilesData } = await (supabase as any)
            .from("profiles")
            .select("id, username, full_name, avatar_url")
            .in("id", userIds);

          if (profilesData) {
            profilesData.forEach((p: any) => {
              profileMap[p.id] = {
                username: p.username || "creator",
                full_name: p.full_name || p.username || "Creator",
                avatar_url: p.avatar_url || null,
              };
            });
          }
        } catch (e) {
          console.warn("Profiles fetch fallback:", e);
        }
      }

      // Ensure current user's profile is populated
      if (user && profile) {
        profileMap[user.id] = {
          username: profile.username || "me",
          full_name: profile.full_name || profile.username || "Me",
          avatar_url: profile.avatar_url || null,
        };
      }

      // 3. Fetch teach skills safely
      let teachSkillsByListing: Record<string, any[]> = {};
      try {
        const { data: teachData } = await (supabase as any)
          .from("skill_swap_listing_teach_skills")
          .select("*")
          .in("listing_id", listingIds);

        if (teachData) {
          teachData.forEach((ts: any) => {
            if (!teachSkillsByListing[ts.listing_id]) teachSkillsByListing[ts.listing_id] = [];
            teachSkillsByListing[ts.listing_id].push({
              skill: { id: ts.skill_id || ts.id, name: ts.skill_name || "Skill" },
              skill_level: ts.skill_level || "Intermediate",
              software: ts.software || [],
              sub_skills: ts.sub_skills || [],
              specialties: ts.specialties || [],
            });
          });
        }
      } catch (e) {
        console.warn("Teach skills query fallback:", e);
      }

      // 4. Fetch learn skills safely
      let learnSkillsByListing: Record<string, any[]> = {};
      try {
        const { data: learnData } = await (supabase as any)
          .from("skill_swap_listing_learn_skills")
          .select("*")
          .in("listing_id", listingIds);

        if (learnData) {
          learnData.forEach((ls: any) => {
            if (!learnSkillsByListing[ls.listing_id]) learnSkillsByListing[ls.listing_id] = [];
            learnSkillsByListing[ls.listing_id].push({
              skill: { id: ls.skill_id || ls.id, name: ls.skill_name || "Skill" },
              desired_level: ls.desired_level || "Any",
              requirements: ls.requirements || ls.requirement || "",
            });
          });
        }
      } catch (e) {
        console.warn("Learn skills query fallback:", e);
      }

      // 5. Construct full processed listings
      const processedListings: SkillSwapListing[] = allListings.map(l => {
        let teach = teachSkillsByListing[l.id] || [];
        let learn = learnSkillsByListing[l.id] || [];

        // Fallback synthesis if child tables are empty
        if (teach.length === 0) {
          teach = [{
            skill: { id: l.id, name: l.role || l.title || "Creator Skills" },
            skill_level: l.skill_level || l.declared_level || "Intermediate",
            specialties: [],
            software: [],
            sub_skills: [],
          }];
        }

        if (learn.length === 0) {
          learn = [{
            skill: { id: l.id + "-learn", name: "Creative Skills Exchange" },
            desired_level: "Intermediate",
            requirements: l.description || "Open to learning complementary skills.",
          }];
        }

        return {
          ...l,
          profile: profileMap[l.user_id] || {
            username: "creator",
            full_name: l.role ? `${l.role}` : "Creator",
            avatar_url: null,
          },
          teach_skills: teach,
          learn_skills: learn,
        };
      });

      // Split into my listings and others
      const mine = processedListings.filter(l => l.user_id === user?.id);
      const others = processedListings.filter(l => l.user_id !== user?.id);

      setMyListings(mine);

      // Fetch requests sent and received
      if (user) {
        try {
          const { data: sentData } = await (supabase as any)
            .from("skill_swap_requests")
            .select("*")
            .eq("sender_id", user.id)
            .order("created_at", { ascending: false });

          if (sentData && sentData.length > 0) {
            const receiverIds = [...new Set(sentData.map((s: any) => s.receiver_id).filter(Boolean))];
            if (receiverIds.length > 0) {
              const { data: recProfiles } = await (supabase as any)
                .from("profiles")
                .select("id, username, full_name, avatar_url")
                .in("id", receiverIds);
              const recMap: Record<string, any> = {};
              (recProfiles || []).forEach((p: any) => { recMap[p.id] = p; });
              setSentRequests(sentData.map((s: any) => ({ ...s, receiver: recMap[s.receiver_id] || { username: "creator" } })));
            } else {
              setSentRequests(sentData);
            }
          } else {
            setSentRequests([]);
          }
        } catch (e) {
          console.warn("Sent requests fallback:", e);
        }

        try {
          const { data: recData } = await (supabase as any)
            .from("skill_swap_requests")
            .select("*")
            .eq("receiver_id", user.id)
            .order("created_at", { ascending: false });

          if (recData && recData.length > 0) {
            const senderIds = [...new Set(recData.map((r: any) => r.sender_id).filter(Boolean))];
            if (senderIds.length > 0) {
              const { data: sendProfiles } = await (supabase as any)
                .from("profiles")
                .select("id, username, full_name, avatar_url")
                .in("id", senderIds);
              const sendMap: Record<string, any> = {};
              (sendProfiles || []).forEach((p: any) => { sendMap[p.id] = p; });
              setReceivedRequests(recData.map((r: any) => ({ ...r, sender: sendMap[r.sender_id] || { username: "creator" } })));
            } else {
              setReceivedRequests(recData);
            }
          } else {
            setReceivedRequests([]);
          }
        } catch (e) {
          console.warn("Received requests fallback:", e);
        }
      }

      // Prioritization logic
      const primaryMyListing = mine[0] || null;
      if (primaryMyListing) {
        const myTeachSkillNames = primaryMyListing.teach_skills.map(ts => ts.skill.name.toLowerCase());
        const myLearnSkillNames = primaryMyListing.learn_skills.map(ls => ls.skill.name.toLowerCase());

        const scoredOthers = others.map(listing => {
          const theirTeachSkillNames = listing.teach_skills.map(ts => ts.skill.name.toLowerCase());
          const theirLearnSkillNames = listing.learn_skills.map(ls => ls.skill.name.toLowerCase());

          const theyTeachWhatIWant = theirTeachSkillNames.some(t => 
            myLearnSkillNames.some(m => m.includes(t) || t.includes(m))
          );
          const theyWantWhatITeach = theirLearnSkillNames.some(t => 
            myTeachSkillNames.some(m => m.includes(t) || t.includes(m))
          );

          let match_score = 0;
          let match_type = "";

          if (theyTeachWhatIWant && theyWantWhatITeach) {
            match_score = 100;
            match_type = "Perfect Mutual Match";
          } else if (theyTeachWhatIWant) {
            match_score = 85;
            match_type = "Teaches What You Want";
          } else if (theyWantWhatITeach) {
            match_score = 65;
            match_type = "Wants What You Teach";
          } else {
            match_score = 30;
          }

          if (listing.verification_status === "verified") {
            match_score += 5;
          }

          return {
            ...listing,
            match_score: Math.min(100, match_score),
            match_type: match_type || (listing.verification_status === "verified" ? "AI Verified Creator" : "")
          };
        });

        const highlyMatched = scoredOthers
          .filter(l => (l.match_score || 0) >= 65)
          .sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

        const remaining = scoredOthers
          .filter(l => (l.match_score || 0) < 65)
          .sort((a, b) => (b.overall_score || 0) - (a.overall_score || 0));

        setRecommendedListings(highlyMatched);
        setOtherListings(remaining);
      } else {
        setRecommendedListings([]);
        setOtherListings(others);
      }
    } catch (err: any) {
      console.error("Failed to load skill swaps:", err);
      toast.error("Failed to load skill swap listings");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadData();
  };

  const handleUpdateReqStatus = async (requestId: string, status: "accepted" | "rejected" | "cancelled") => {
    const { error } = await (supabase as any)
      .from("skill_swap_requests")
      .update({ status, responded_at: new Date().toISOString() })
      .eq("id", requestId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success(`Request ${status}`);
    loadData();
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to deactivate this Skill Swap post?")) return;
    const { error } = await (supabase as any)
      .from("skill_swap_listings")
      .update({ is_active: false })
      .eq("id", listingId);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Skill Swap post deactivated");
    loadData();
  };

  const handleMessageUser = async (otherUserId: string) => {
    if (!user) {
      toast.error("Please sign in to message");
      return;
    }
    try {
      const { data, error } = await (supabase.rpc as any)("get_or_create_dm", { _other: otherUserId });
      if (error) throw error;
      if (data) {
        navigate({ to: "/messages", search: { c: data } as any });
      }
    } catch (err: any) {
      toast.error(`Could not open conversation: ${err.message}`);
    }
  };

  // Filter application helper
  const filterListings = (list: SkillSwapListing[]) => {
    let result = list;

    if (levelFilter) {
      result = result.filter(l => 
        l.teach_skills.some(ts => ts.skill_level === levelFilter) ||
        l.demonstrated_level === levelFilter ||
        l.skill_level === levelFilter
      );
    }

    if (modeFilter) {
      result = result.filter(l => l.learning_mode === modeFilter || l.learning_mode === "Both");
    }

    const term = searchQ.trim().toLowerCase();
    if (term) {
      result = result.filter(l => {
        const hay = [
          l.title,
          l.role,
          l.description,
          ...l.teach_skills.map(ts => ts.skill.name),
          ...l.teach_skills.flatMap(ts => ts.software || []),
          ...l.teach_skills.flatMap(ts => ts.specialties || []),
          ...l.learn_skills.map(ls => ls.skill.name),
          l.profile?.full_name,
          l.profile?.username
        ].filter(Boolean).join(" ").toLowerCase();
        return hay.includes(term);
      });
    }

    return result;
  };

  const visibleRecommended = useMemo(() => filterListings(recommendedListings), [recommendedListings, searchQ, levelFilter, modeFilter]);
  const visibleOthers = useMemo(() => filterListings(otherListings), [otherListings, searchQ, levelFilter, modeFilter]);
  const visibleMyListings = useMemo(() => filterListings(myListings), [myListings, searchQ, levelFilter, modeFilter]);

  const pendingReceivedCount = receivedRequests.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER & ACTION BAR */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-surface rounded-2xl p-5 border border-border shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand" /> Skill Swap Network
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Teach what you love, learn what you need, and connect with verified creators.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="p-2.5 rounded-xl bg-muted hover:bg-muted/80 border border-border text-foreground transition text-xs font-semibold"
              title="Refresh listings"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-brand" : ""}`} />
            </button>
            <button
              onClick={() => { setEditingListing(null); setShowPostModal(true); }}
              className="bg-primary text-primary-foreground hover:opacity-90 px-4 h-11 rounded-xl font-bold text-sm flex items-center gap-2 transition shadow-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Create Skill Swap
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-3 border-t border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search by skill, software, role, or creator name…"
              className="w-full pl-10 pr-3.5 h-10 rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-xs"
            />
          </div>

          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-background border border-border text-xs font-medium focus:outline-none"
            >
              <option value="">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Expert">Expert</option>
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="h-10 px-3 rounded-xl bg-background border border-border text-xs font-medium focus:outline-none"
            >
              <option value="">All Modes</option>
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
              <option value="Both">Both</option>
            </select>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: MY SKILL SWAP POSTS */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-brand" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              My Skill Swap Posts {myListings.length > 0 && `(${myListings.length})`}
            </h3>
          </div>

          {myListings.length > 0 && (
            <button
              onClick={() => { setEditingListing(null); setShowPostModal(true); }}
              className="text-xs text-brand hover:underline font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Post Another Skill
            </button>
          )}
        </div>

        {myListings.length === 0 ? (
          <div className="bg-surface rounded-2xl p-6 border border-dashed border-border text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-soft/40 text-brand mx-auto flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-foreground">You haven't published a Skill Swap post yet</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                Publish your skills and what you want to learn. Our AI verification and smart matching will connect you with compatible creators!
              </p>
            </div>
            <button
              onClick={() => { setEditingListing(null); setShowPostModal(true); }}
              className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-xs font-bold hover:opacity-90 transition shadow-sm inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create Your Skill Swap Post
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* My Active Listings */}
            <div className="space-y-4">
              {visibleMyListings.map(listing => (
                <SkillSwapCard
                  key={listing.id}
                  listing={listing}
                  isOwner={true}
                  onEdit={() => {
                    setEditingListing(listing);
                    setShowPostModal(true);
                  }}
                  onDelete={() => handleDeleteListing(listing.id)}
                />
              ))}
            </div>

            {/* Applications & Requests Dashboard */}
            <div className="bg-surface rounded-2xl p-4 border border-border space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveRequestsTab(activeRequestsTab === "received" ? null : "received")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeRequestsTab === "received"
                        ? "bg-brand text-white shadow-sm"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" /> Received Requests
                    {pendingReceivedCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                        {pendingReceivedCount}
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveRequestsTab(activeRequestsTab === "sent" ? null : "sent")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      activeRequestsTab === "sent"
                        ? "bg-brand text-white shadow-sm"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" /> Sent Applications ({sentRequests.length})
                  </button>
                </div>

                <span className="text-[11px] text-muted-foreground font-medium">
                  {activeRequestsTab ? "Click tab to collapse" : "Click to view applications"}
                </span>
              </div>

              {/* RECEIVED REQUESTS CONTENT */}
              {activeRequestsTab === "received" && (
                <div className="space-y-3 pt-1">
                  {receivedRequests.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      No incoming Skill Swap requests received yet.
                    </div>
                  ) : (
                    receivedRequests.map(req => (
                      <div key={req.id} className="bg-muted/30 rounded-xl p-4 border border-border/80 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Link
                              to="/user/$username"
                              params={{ username: req.sender?.username || "" }}
                              className="w-10 h-10 rounded-xl bg-muted overflow-hidden flex items-center justify-center font-bold text-sm border border-border"
                            >
                              {req.sender?.avatar_url ? (
                                <img src={req.sender.avatar_url} className="w-full h-full object-cover" alt="" />
                              ) : (
                                (req.sender?.username || "?").slice(0, 1).toUpperCase()
                              )}
                            </Link>
                            <div>
                              <Link
                                to="/user/$username"
                                params={{ username: req.sender?.username || "" }}
                                className="font-bold text-sm hover:text-brand transition"
                              >
                                {req.sender?.full_name || req.sender?.username}
                              </Link>
                              <p className="text-xs text-muted-foreground">@{req.sender?.username}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${
                              req.status === "accepted" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" :
                              req.status === "rejected" ? "bg-rose-500/15 text-rose-600 border-rose-500/30" :
                              "bg-amber-500/15 text-amber-600 border-amber-500/30"
                            }`}>
                              {req.status}
                            </span>
                            <button
                              onClick={() => handleMessageUser(req.sender_id)}
                              className="p-1.5 bg-muted hover:bg-muted/80 rounded-lg text-foreground transition"
                              title="Message applicant"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {req.message && (
                          <div className="p-2.5 bg-background rounded-lg text-xs text-foreground/80 border border-border/50">
                            <p className="italic">"{req.message}"</p>
                          </div>
                        )}

                        {req.status === "pending" && (
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleUpdateReqStatus(req.id, "accepted")}
                              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" /> Accept Swap
                            </button>
                            <button
                              onClick={() => handleUpdateReqStatus(req.id, "rejected")}
                              className="flex-1 py-2 bg-muted hover:bg-muted/80 text-foreground rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition"
                            >
                              <X className="w-3.5 h-3.5" /> Decline
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SENT APPLICATIONS CONTENT */}
              {activeRequestsTab === "sent" && (
                <div className="space-y-3 pt-1">
                  {sentRequests.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      You haven't sent any Skill Swap requests yet.
                    </div>
                  ) : (
                    sentRequests.map(req => (
                      <div key={req.id} className="bg-muted/30 rounded-xl p-3.5 border border-border/80 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <Link
                            to="/user/$username"
                            params={{ username: req.receiver?.username || "" }}
                            className="w-9 h-9 rounded-xl bg-muted overflow-hidden flex items-center justify-center font-bold text-xs border border-border"
                          >
                            {req.receiver?.avatar_url ? (
                              <img src={req.receiver.avatar_url} className="w-full h-full object-cover" alt="" />
                            ) : (
                              (req.receiver?.username || "?").slice(0, 1).toUpperCase()
                            )}
                          </Link>
                          <div>
                            <p className="text-xs font-bold">
                              To: <Link to="/user/$username" params={{ username: req.receiver?.username || "" }} className="hover:text-brand">
                                @{req.receiver?.username}
                              </Link>
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              Sent on {new Date(req.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${
                            req.status === "accepted" ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" :
                            req.status === "rejected" ? "bg-rose-500/15 text-rose-600 border-rose-500/30" :
                            req.status === "cancelled" ? "bg-muted text-muted-foreground border-border" :
                            "bg-amber-500/15 text-amber-600 border-amber-500/30"
                          }`}>
                            {req.status}
                          </span>
                          {req.status === "accepted" && (
                            <button
                              onClick={() => handleMessageUser(req.receiver_id)}
                              className="px-2.5 py-1 bg-brand text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                            >
                              <MessageCircle className="w-3 h-3" /> Chat
                            </button>
                          )}
                          {req.status === "pending" && (
                            <button
                              onClick={() => handleUpdateReqStatus(req.id, "cancelled")}
                              className="text-[11px] text-muted-foreground hover:text-rose-500 underline font-medium"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: RECOMMENDED SKILL SWAPS FOR YOU */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Recommended Skill Swaps For You {visibleRecommended.length > 0 && `(${visibleRecommended.length})`}
            </h3>
          </div>
          {visibleRecommended.length > 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              Matched to your learning goals
            </span>
          )}
        </div>

        {myListings.length === 0 ? (
          <div className="bg-surface rounded-2xl p-6 border border-border text-center space-y-2">
            <p className="text-xs text-muted-foreground">
              Create your Skill Swap post to enable personalized recommendations matching your exact learning desires!
            </p>
          </div>
        ) : visibleRecommended.length === 0 ? (
          <div className="bg-surface rounded-2xl p-8 text-center border border-border">
            <p className="text-xs text-muted-foreground">
              No highly matched creators found matching the current search filters. Check all posts below!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleRecommended.map(listing => {
              const req = sentRequests.find(r => r.receiver_id === listing.user_id && r.receiver_listing_id === listing.id);
              return (
                <SkillSwapCard
                  key={listing.id}
                  listing={listing}
                  isOwner={false}
                  existingRequest={req ? { id: req.id, status: req.status } : null}
                  onStatusChange={loadData}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 3: ALL SKILL SWAP POSTS */}
      {/* ------------------------------------------------------------- */}
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-2.5">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              All Skill Swap Posts {visibleOthers.length > 0 && `(${visibleOthers.length})`}
            </h3>
          </div>
          <span className="text-xs text-muted-foreground font-medium">
            Explore all creator offerings
          </span>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground py-12 text-xs">Loading Skill Swaps…</div>
        ) : visibleOthers.length === 0 ? (
          <div className="bg-surface rounded-2xl p-10 text-center border border-border text-xs text-muted-foreground">
            No other Skill Swap posts found matching your search.
          </div>
        ) : (
          <div className="space-y-4">
            {visibleOthers.map(listing => {
              const req = sentRequests.find(r => r.receiver_id === listing.user_id && r.receiver_listing_id === listing.id);
              return (
                <SkillSwapCard
                  key={listing.id}
                  listing={listing}
                  isOwner={false}
                  existingRequest={req ? { id: req.id, status: req.status } : null}
                  onStatusChange={loadData}
                />
              );
            })}
          </div>
        )}
      </section>

      {/* Post/Edit Skill Swap Modal */}
      {showPostModal && (
        <PostSkillSwapModal 
          onClose={() => { setShowPostModal(false); setEditingListing(null); }} 
          onCreated={() => { setShowPostModal(false); setEditingListing(null); loadData(); }} 
          existingListing={editingListing}
        />
      )}
    </div>
  );
}
