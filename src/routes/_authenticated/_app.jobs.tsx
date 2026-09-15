import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Briefcase,
  MapPin,
  Clock,
  Plus,
  X,
  Send,
  Search,
  ExternalLink,
  MessageCircle,
  Calendar,
  Award,
  Building2,
  Sparkles,
  Users,
  Check,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import SkillSwapPanel from "@/components/skill-swap/SkillSwapPanel";
import {
  calculateJobMatchScore,
  calculateCreatorMatchForBrief,
  CreatorMatchProfile,
  JobMatchRequirements,
  JobMatchResult,
  CreatorMatchResult,
} from "@/lib/job-matching";

export const Route = createFileRoute("/_authenticated/_app/jobs")({
  head: () => ({ meta: [{ title: "Opportunities — Omnicraft" }] }),
  component: JobsPage,
});

type Job = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  location: string | null;
  budget: string | null;
  status: string;
  client_id: string;
  created_at: string;
  company_name?: string | null;
  skills_required?: string[] | null;
  experience_level?: string | null;
  duration?: string | null;
  deadline?: string | null;
  client?: { username: string; full_name: string | null; avatar_url: string | null };
  job_roles?: Array<{ professional_roles?: { name: string } | null }>;
  job_skills?: Array<{ skills?: { name: string } | null }>;
  roles_required?: string[];
  matchResult?: JobMatchResult;
};

type Squad = { id: string; name: string };

type EnrichedCreatorProfile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  portfolio_url: string | null;
  experience_level?: string | null;
  specialties: string[];
  roles: string[];
  skills: string[];
  learningSkills: string[];
  matchResult?: CreatorMatchResult;
};

function parseBudgetValue(budgetStr: string | null | undefined): number {
  if (!budgetStr) return 0;
  const numbers = budgetStr.replace(/,/g, "").match(/\d+/g);
  if (!numbers || numbers.length === 0) return 0;
  return Math.max(...numbers.map((n) => parseInt(n, 10)));
}

function parseDeadlineValue(deadlineStr: string | null | undefined): number {
  if (!deadlineStr) return Infinity;
  const time = new Date(deadlineStr).getTime();
  return isNaN(time) ? Infinity : time;
}

function JobsPage() {
  const { profile } = useAuth();
  const isClient = profile?.role === "client";

  const [topTab, setTopTab] = useState<"jobs" | "skill_swap">("jobs");
  // Default tab for Brief Matching: for clients, "Find creators"; for creators, "Briefs"
  const [tab, setTab] = useState<"briefs" | "creators">(isClient ? "creators" : "briefs");

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Opportunities</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1">
          {topTab === "skill_swap"
            ? "Skill Swap"
            : isClient
              ? "Hire creators & post briefs"
              : "Smart Brief Matching"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {topTab === "skill_swap"
            ? "Exchange skills with other creators and learn from each other."
            : isClient
              ? "Post project briefs and discover matched creators ranked by skills and compatibility."
              : "Explore briefs ranked intelligently by how closely they match your roles, skills, and specialties."}
        </p>
      </div>

      <div className="flex gap-1 border-b border-border mb-5">
        <TabBtn active={topTab === "jobs"} onClick={() => setTopTab("jobs")}>
          Brief Matching
        </TabBtn>
        <TabBtn active={topTab === "skill_swap"} onClick={() => setTopTab("skill_swap")}>
          Skill Swap
        </TabBtn>
      </div>

      {topTab === "jobs" && (
        <>
          {isClient && (
            <div className="flex gap-1 border-b border-border mb-5">
              <TabBtn active={tab === "creators"} onClick={() => setTab("creators")}>
                Find creators
              </TabBtn>
              <TabBtn active={tab === "briefs"} onClick={() => setTab("briefs")}>
                My briefs
              </TabBtn>
            </div>
          )}

          {(!isClient || tab === "briefs") && <BriefsPanel />}
          {isClient && tab === "creators" && <CreatorsPanel />}
        </>
      )}

      {topTab === "skill_swap" && <SkillSwapPanel />}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition ${
        active
          ? "border-brand text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
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
  const [creatorProfile, setCreatorProfile] = useState<CreatorMatchProfile>({
    id: user?.id ?? "",
    username: profile?.username ?? "",
    roles: [],
    skills: [],
    specialties: [],
    learningSkills: [],
  });
  const [myApps, setMyApps] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [showPost, setShowPost] = useState(false);
  const [applyJob, setApplyJob] = useState<Job | null>(null);

  // Discovery Controls: Search, Sort, Filters
  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState<"relevant" | "newest" | "budget_high" | "budget_low" | "deadline">("relevant");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState<"all" | "remote" | "onsite">("all");
  const [showFilters, setShowFilters] = useState(false);

  // job_id -> status for every application this creator (or their squads) sent
  const loadMyApps = async () => {
    if (!user || isClient) return;
    const { data: squads } = await supabase.from("squads").select("id").eq("owner_id", user.id);
    const squadIds = (squads ?? []).map((s: any) => s.id);
    const filters = [`applicant_id.eq.${user.id}`];
    if (squadIds.length) filters.push(`squad_id.in.(${squadIds.join(",")})`);
    const { data } = await supabase
      .from("job_applications")
      .select("job_id, status")
      .or(filters.join(","));
    const map: Record<string, string> = {};
    (data ?? []).forEach((a: any) => {
      const rank = (s: string) => (s === "accepted" ? 3 : s === "pending" ? 2 : 1);
      if (!map[a.job_id] || rank(a.status) > rank(map[a.job_id])) map[a.job_id] = a.status;
    });
    setMyApps(map);
  };

  const loadCreatorProfile = async () => {
    if (!user || isClient) return;
    try {
      const [rolesRes, skillsRes, specRes, learnRes] = await Promise.all([
        supabase.from("creator_roles").select("professional_roles(name)").eq("creator_id", user.id),
        supabase.from("creator_skills").select("skills(name)").eq("creator_id", user.id),
        supabase.from("creator_specialties").select("specialty").eq("user_id", user.id),
        supabase.from("creator_learning_skills").select("skills(name)").eq("user_id", user.id),
      ]);

      const myRoles = (rolesRes.data ?? [])
        .map((r: any) => r.professional_roles?.name)
        .filter(Boolean);
      const mySkills = (skillsRes.data ?? [])
        .map((s: any) => s.skills?.name)
        .filter(Boolean);
      const mySpecialties = (specRes.data ?? [])
        .map((sp: any) => sp.specialty)
        .filter(Boolean);
      const myLearn = (learnRes.data ?? [])
        .map((l: any) => l.skills?.name)
        .filter(Boolean);

      setCreatorProfile({
        id: user.id,
        username: profile?.username ?? "",
        roles: myRoles,
        skills: mySkills,
        specialties: mySpecialties,
        learningSkills: myLearn,
        experienceLevel: (profile as any)?.experience_level || undefined,
        bio: profile?.bio || undefined,
      });
    } catch (err) {
      console.error("Error loading creator profile for matching:", err);
    }
  };

  const load = async () => {
    setLoading(true);
    let q = supabase
      .from("jobs")
      .select("*, job_roles(professional_roles(name)), job_skills(skills(name))")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    if (isClient && user) q = q.eq("client_id", user.id);
    const { data, error } = await q;
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }

    const list = (data ?? []) as any[];

    // Extract joined roles and skills into normalized properties
    list.forEach((j) => {
      const joinedRoles: string[] = (j.job_roles ?? [])
        .map((jr: any) => jr.professional_roles?.name)
        .filter(Boolean);
      const joinedSkills: string[] = (j.job_skills ?? [])
        .map((js: any) => js.skills?.name)
        .filter(Boolean);

      j.roles_required = joinedRoles;
      const combinedSkills = Array.from(new Set([...(j.skills_required ?? []), ...joinedSkills]));
      j.skills_required = combinedSkills;
    });

    const ids = Array.from(new Set(list.map((j) => j.client_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .in("id", ids);
      const map = new Map((profs ?? []).map((p: any) => [p.id, p]));
      list.forEach((j) => (j.client = map.get(j.client_id)));
    }
    setJobs(list);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      if (user && !isClient) {
        await Promise.all([loadCreatorProfile(), loadMyApps()]);
      }
      load();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isClient]);

  // Extract all categories available in the jobs
  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    jobs.forEach((j) => {
      if (j.category) cats.add(j.category);
    });
    return Array.from(cats).sort();
  }, [jobs]);

  // Filter and rank jobs based on creator profile & user preferences
  const { scoredJobs, topMatches, relevantMatches, otherJobs } = useMemo(() => {
    const term = searchQ.trim().toLowerCase();

    // 1. First, apply user filters (Category, Experience, Location)
    const filtered = jobs.filter((j) => {
      if (categoryFilter && (j.category ?? "").toLowerCase() !== categoryFilter.toLowerCase()) {
        return false;
      }
      if (
        experienceFilter &&
        (j.experience_level ?? "").toLowerCase() !== experienceFilter.toLowerCase()
      ) {
        return false;
      }
      if (locationFilter === "remote") {
        const loc = (j.location ?? "").toLowerCase();
        if (!loc.includes("remote")) return false;
      } else if (locationFilter === "onsite") {
        const loc = (j.location ?? "").toLowerCase();
        if (loc.includes("remote")) return false;
      }
      return true;
    });

    // 2. Score each job using our smart matching engine
    const scored: Job[] = filtered.map((job) => {
      const requirements: JobMatchRequirements = {
        id: job.id,
        title: job.title,
        description: job.description,
        category: job.category ?? undefined,
        skillsRequired: job.skills_required ?? [],
        rolesRequired: job.roles_required ?? [],
        experienceLevel: job.experience_level ?? undefined,
        location: job.location ?? undefined,
        budget: job.budget ?? undefined,
        deadline: job.deadline ?? undefined,
        createdAt: job.created_at,
      };

      const matchResult = calculateJobMatchScore(
        creatorProfile,
        requirements,
        term || undefined
      );

      return {
        ...job,
        matchResult,
      };
    });

    // 3. If there is a search term, optionally filter out jobs with 0 relevance if creator has entered text
    let results = scored;
    if (term) {
      results = results.filter((j) => {
        const hay = `${j.title} ${j.description} ${j.category ?? ""} ${j.location ?? ""} ${(j.skills_required ?? []).join(" ")} ${(j.roles_required ?? []).join(" ")}`.toLowerCase();
        return hay.includes(term) || (j.matchResult && j.matchResult.matchScore > 0);
      });
    }

    // 4. Sort according to selected sort criteria
    results.sort((a, b) => {
      if (sortBy === "relevant") {
        const scoreDiff = (b.matchResult?.matchScore ?? 0) - (a.matchResult?.matchScore ?? 0);
        if (scoreDiff !== 0) return scoreDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "budget_high") {
        return parseBudgetValue(b.budget) - parseBudgetValue(a.budget);
      }
      if (sortBy === "budget_low") {
        return parseBudgetValue(a.budget) - parseBudgetValue(b.budget);
      }
      if (sortBy === "deadline") {
        return parseDeadlineValue(a.deadline) - parseDeadlineValue(b.deadline);
      }
      return 0;
    });

    // 5. Partition for Tiered Views when viewing by relevance
    const top = results.filter((j) => (j.matchResult?.matchScore ?? 0) >= 60);
    const rel = results.filter(
      (j) => (j.matchResult?.matchScore ?? 0) >= 25 && (j.matchResult?.matchScore ?? 0) < 60
    );
    const other = results.filter((j) => (j.matchResult?.matchScore ?? 0) < 25);

    return {
      scoredJobs: results,
      topMatches: top,
      relevantMatches: rel,
      otherJobs: other,
    };
  }, [
    jobs,
    creatorProfile,
    searchQ,
    sortBy,
    categoryFilter,
    experienceFilter,
    locationFilter,
  ]);

  const hasActiveFilters =
    categoryFilter !== "" || experienceFilter !== "" || locationFilter !== "all";

  const clearAllFilters = () => {
    setCategoryFilter("");
    setExperienceFilter("");
    setLocationFilter("all");
    setSearchQ("");
  };

  return (
    <div>
      {/* Search and Sort controls */}
      {!isClient && (
        <div className="space-y-3 mb-5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchQ}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search briefs by title, skills, keywords…"
                className="w-full pl-10 pr-9 h-11 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-brand/40 text-sm placeholder:text-muted-foreground"
              />
              {searchQ && (
                <button
                  onClick={() => setSearchQ("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:flex-initial">
                <div className="flex items-center gap-1.5 h-11 px-3 rounded-xl bg-surface border border-border text-xs font-semibold">
                  <ArrowUpDown className="w-3.5 h-3.5 text-brand" />
                  <span className="text-muted-foreground whitespace-nowrap">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e: any) => setSortBy(e.target.value)}
                    className="bg-transparent border-none outline-none font-semibold text-foreground cursor-pointer pr-1"
                  >
                    <option value="relevant" className="bg-surface text-foreground">
                      Most Relevant ⭐
                    </option>
                    <option value="newest" className="bg-surface text-foreground">
                      Newest First
                    </option>
                    <option value="budget_high" className="bg-surface text-foreground">
                      Budget: High to Low
                    </option>
                    <option value="budget_low" className="bg-surface text-foreground">
                      Budget: Low to High
                    </option>
                    <option value="deadline" className="bg-surface text-foreground">
                      Deadline: Soonest
                    </option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => setShowFilters((v) => !v)}
                className={`h-11 px-3.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                  hasActiveFilters || showFilters
                    ? "bg-brand-soft text-brand border-brand/40"
                    : "bg-surface text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                )}
              </button>
            </div>
          </div>

          {/* Expandable Filter Controls */}
          {showFilters && (
            <div className="p-4 rounded-xl bg-surface border border-border space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5" /> Filter Opportunities
                </span>
                {hasActiveFilters && (
                  <button
                    onClick={clearAllFilters}
                    className="text-xs font-semibold text-brand hover:underline"
                  >
                    Reset all
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-background border border-border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="">All Categories</option>
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Experience Level
                  </label>
                  <select
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-background border border-border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="">Any Experience</option>
                    <option value="entry">Entry Level</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="senior">Senior Level</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                    Location / Remote
                  </label>
                  <select
                    value={locationFilter}
                    onChange={(e: any) => setLocationFilter(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-lg bg-background border border-border text-xs font-medium focus:outline-none focus:ring-1 focus:ring-brand"
                  >
                    <option value="all">Any Location</option>
                    <option value="remote">Remote Only</option>
                    <option value="onsite">On-site Only</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {isClient && (
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowPost(true)}
            className="bg-primary text-primary-foreground hover:opacity-90 px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-1.5 transition shadow-sm"
          >
            <Plus className="w-4 h-4" /> Post brief
          </button>
        </div>
      )}

      {!isClient &&
        creatorProfile.skills.length === 0 &&
        creatorProfile.roles.length === 0 &&
        creatorProfile.specialties.length === 0 && (
          <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-foreground/80 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-600 dark:text-amber-400">
                Enhance your match precision
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add your skills and roles to your creator profile to unlock personalized 90%+ match
                recommendations.
              </p>
            </div>
          </div>
        )}

      {loading ? (
        <div className="text-center text-muted-foreground py-16 text-sm flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span>Finding matched opportunities…</span>
        </div>
      ) : scoredJobs.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center border border-border">
          <Briefcase className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold text-base">
            {isClient ? "No briefs posted yet" : "No briefs match your selected filters"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isClient
              ? "Post your first project brief to start hiring talented creators."
              : "Try clearing filters or search terms to see all available opportunities."}
          </p>
          {isClient ? (
            <button
              onClick={() => setShowPost(true)}
              className="mt-4 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm"
            >
              Post the first one
            </button>
          ) : hasActiveFilters || searchQ ? (
            <button
              onClick={clearAllFilters}
              className="mt-4 px-4 py-2 bg-brand text-white rounded-lg font-semibold text-xs inline-flex items-center gap-1.5"
            >
              Reset filters
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          {/* If sorting by Relevance and Creator has matches, group by relevance tiers */}
          {!isClient && sortBy === "relevant" ? (
            <>
              {/* Fallback Banner if no Top Matches (>=60%) exist */}
              {topMatches.length === 0 && (
                <div className="p-4 rounded-xl bg-brand-soft/40 border border-brand/20 text-sm flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-brand flex-shrink-0" />
                  <p className="text-xs text-foreground/80">
                    No high-relevance matches found for your exact skills right now, but explore all
                    other open opportunities ranked below:
                  </p>
                </div>
              )}

              {/* Tier 1: Top Matches */}
              {topMatches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Top Matches for Your Skills ({topMatches.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {topMatches.map((j) => (
                      <JobCard
                        key={j.id}
                        job={j}
                        canApply={!isClient && j.client_id !== user?.id}
                        appStatus={myApps[j.id]}
                        isOwner={!!user && j.client_id === user.id}
                        onApply={() => setApplyJob(j)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tier 2: Relevant Opportunities */}
              {relevantMatches.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-brand" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-brand">
                      Relevant Opportunities ({relevantMatches.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {relevantMatches.map((j) => (
                      <JobCard
                        key={j.id}
                        job={j}
                        canApply={!isClient && j.client_id !== user?.id}
                        appStatus={myApps[j.id]}
                        isOwner={!!user && j.client_id === user.id}
                        onApply={() => setApplyJob(j)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tier 3: Other Opportunities */}
              {otherJobs.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Other Open Briefs ({otherJobs.length})
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {otherJobs.map((j) => (
                      <JobCard
                        key={j.id}
                        job={j}
                        canApply={!isClient && j.client_id !== user?.id}
                        appStatus={myApps[j.id]}
                        isOwner={!!user && j.client_id === user.id}
                        onApply={() => setApplyJob(j)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Flat list when sorted by Newest, Budget, Deadline or when viewed by Client */
            <div className="space-y-3">
              {scoredJobs.map((j) => (
                <JobCard
                  key={j.id}
                  job={j}
                  canApply={!isClient && j.client_id !== user?.id}
                  appStatus={myApps[j.id]}
                  isOwner={!!user && j.client_id === user.id}
                  onApply={() => setApplyJob(j)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showPost && (
        <PostJobModal
          onClose={() => setShowPost(false)}
          onCreated={() => {
            setShowPost(false);
            load();
          }}
        />
      )}

      {applyJob && (
        <ApplyJobModal
          job={applyJob}
          onClose={() => setApplyJob(null)}
          onApplied={() => {
            setApplyJob(null);
            loadMyApps();
          }}
        />
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  accepted: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
  rejected: "bg-rose-500/15 text-rose-600 border-rose-500/30",
  withdrawn: "bg-muted text-muted-foreground border-border",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-3 py-1.5 rounded-lg text-sm font-semibold border capitalize ${
        STATUS_STYLES[status] ?? STATUS_STYLES.withdrawn
      }`}
    >
      {status}
    </span>
  );
}

function JobCard({
  job,
  canApply,
  onApply,
  appStatus,
  isOwner,
}: {
  job: Job;
  canApply: boolean;
  onApply: () => void;
  appStatus?: string;
  isOwner?: boolean;
}) {
  const [showApplicants, setShowApplicants] = useState(false);
  const deadlineLabel = job.deadline
    ? new Date(job.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  const match = job.matchResult;

  // Match badge styling depending on match score
  const getBadgeStyle = (score: number) => {
    if (score >= 75) {
      return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
    }
    if (score >= 40) {
      return "bg-brand-soft text-brand border-brand/30";
    }
    if (score >= 20) {
      return "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30";
    }
    return "bg-muted/70 text-muted-foreground border-border";
  };

  const matchedSet = new Set((match?.matchedSkills ?? []).map((s: string) => s.toLowerCase()));

  return (
    <div className="bg-surface rounded-2xl p-5 border border-border hover:border-brand/40 hover:shadow-md transition">
      {/* Top row: Match badge + budget + category */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-brand-soft flex items-center justify-center flex-shrink-0">
            <Briefcase className="w-5 h-5 text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-base tracking-tight leading-snug">{job.title}</h3>
              {/* Match Relevance Badge */}
              {match && match.matchScore > 0 && (
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getBadgeStyle(
                    match.matchScore
                  )}`}
                >
                  <Sparkles className="w-3 h-3" />
                  {match.tierLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              {job.company_name && (
                <span className="inline-flex items-center gap-1 font-semibold text-foreground/80">
                  <Building2 className="w-3 h-3" />
                  {job.company_name}
                </span>
              )}
              {job.client?.username && (
                <Link
                  to="/user/$username"
                  params={{ username: job.client.username }}
                  className="hover:text-brand"
                >
                  @{job.client.username}
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          {job.budget && <div className="text-base font-bold text-brand">{job.budget}</div>}
          {job.category && (
            <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-foreground/70">
              {job.category}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-foreground/80 mt-3 line-clamp-3 leading-relaxed whitespace-pre-line">
        {job.description}
      </p>

      {/* Required Roles (if present) */}
      {job.roles_required && job.roles_required.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Role:
          </span>
          {job.roles_required.map((r) => {
            const isMatched = match?.matchedRoles.includes(r);
            return (
              <span
                key={r}
                className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                  isMatched
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-muted text-foreground/80 border-border"
                }`}
              >
                {isMatched ? `✓ ${r}` : r}
              </span>
            );
          })}
        </div>
      )}

      {/* Required Skills breakdown (Matched vs Missing) */}
      {job.skills_required && job.skills_required.length > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-brand" /> Required Skills ({job.skills_required.length})
            </p>
            {match && match.missingSkills.length === 0 && match.matchedSkills.length > 0 && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 100% Required Skills Match
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {job.skills_required.map((s) => {
              const lower = s.toLowerCase();
              const isDirectMatch = matchedSet.has(lower);

              if (isDirectMatch) {
                return (
                  <span
                    key={s}
                    title="Required skill: Matched with your profile"
                    className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/30 inline-flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> {s}
                  </span>
                );
              }

              return (
                <span
                  key={s}
                  title="Required skill: Missing from your profile"
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-muted/60 text-muted-foreground font-medium border border-border/70 inline-flex items-center gap-1"
                >
                  <span className="text-[9px] opacity-70">○</span> {s}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Explicit "Your Matching Skills" section (Requirement 9) */}
      {match && match.yourMatchingSkills && match.yourMatchingSkills.length > 0 && (
        <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Your Matching Skills ({match.yourMatchingSkills.length}):
            </p>
            <span className="text-[10px] font-semibold text-emerald-600/90 dark:text-emerald-400/90">
              {match.tierLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {match.yourMatchingSkills.map((s) => (
              <span
                key={s}
                className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-500/30 inline-flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Missing Skills note (if any) */}
      {match && match.missingSkills && match.missingSkills.length > 0 && match.matchedSkills.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span className="text-[10px] font-semibold">Missing from your skills:</span>
          {match.missingSkills.map((s) => (
            <span
              key={s}
              className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border"
            >
              ○ {s}
            </span>
          ))}
        </div>
      )}

      {/* Metadata bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-border text-[11px]">
        {job.experience_level && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Award className="w-3.5 h-3.5" />
            <span>
              <span className="font-semibold text-foreground/80">{job.experience_level}</span> level
            </span>
          </div>
        )}
        {job.duration && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>{job.duration}</span>
          </div>
        )}
        {job.location && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span>{job.location}</span>
          </div>
        )}
        {deadlineLabel && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>Deadline {deadlineLabel}</span>
          </div>
        )}
      </div>

      {canApply && (
        <div className="mt-4 flex justify-end">
          {appStatus ? (
            <StatusBadge status={appStatus} />
          ) : (
            <button
              onClick={onApply}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5 shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Apply now
            </button>
          )}
        </div>
      )}

      {isOwner && (
        <div className="mt-4 pt-3 border-t border-border">
          <button
            onClick={() => setShowApplicants((v) => !v)}
            className="text-sm font-semibold text-brand inline-flex items-center gap-1.5 hover:underline"
          >
            <Users className="w-4 h-4" />{" "}
            {showApplicants ? "Hide applications" : "Review applications"}
          </button>
          {showApplicants && <ApplicantsPanel jobId={job.id} />}
        </div>
      )}
    </div>
  );
}

/* ---------------------- Applications review (client) ---------------------- */

type Application = {
  id: string;
  job_id: string;
  applicant_id: string | null;
  squad_id: string | null;
  portfolio_url: string | null;
  message: string | null;
  status: string;
  created_at: string;
  applicant?: { username: string; full_name: string | null; avatar_url: string | null } | null;
  squad?: { name: string } | null;
};

function ApplicantsPanel({ jobId }: { jobId: string }) {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as Application[];
    const userIds = Array.from(
      new Set(list.map((a) => a.applicant_id).filter(Boolean))
    ) as string[];
    const squadIds = Array.from(new Set(list.map((a) => a.squad_id).filter(Boolean))) as string[];
    const [{ data: profs }, { data: sqs }] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", userIds)
        : Promise.resolve({ data: [] as any[] }),
      squadIds.length
        ? supabase.from("squads").select("id, name").in("id", squadIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);
    const pMap = new Map((profs ?? []).map((p: any) => [p.id, p]));
    const sMap = new Map((sqs ?? []).map((s: any) => [s.id, s]));
    list.forEach((a) => {
      a.applicant = a.applicant_id ? pMap.get(a.applicant_id) ?? null : null;
      a.squad = a.squad_id ? sMap.get(a.squad_id) ?? null : null;
    });
    setApps(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  const decide = async (id: string, status: "accepted" | "rejected") => {
    setBusyId(id);
    const { data, error } = await supabase.rpc("decide_job_application", {
      _application_id: id,
      _status: status,
    });
    setBusyId(null);
    if (error) {
      console.error("Application decision failed:", error);
      toast.error(`${error.message}${error.code ? ` (${error.code})` : ""}`);
      return;
    }
    if (!data || data.status !== status) {
      toast.error("The application status was not updated. Please refresh and try again.");
      await load();
      return;
    }
    toast.success(status === "accepted" ? "Application accepted" : "Application rejected");
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  };

  if (loading) return <p className="text-sm text-muted-foreground py-3">Loading applications…</p>;
  if (apps.length === 0)
    return <p className="text-sm text-muted-foreground py-3">No applications yet.</p>;

  return (
    <div className="mt-3 space-y-2">
      {apps.map((a) => (
        <div key={a.id} className="rounded-xl border border-border bg-background p-3">
          <div className="flex items-start gap-3">
            {a.applicant ? (
              <Link
                to="/user/$username"
                params={{ username: a.applicant.username || a.applicant.id }}
                className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold flex-shrink-0 hover:opacity-80 transition"
              >
                {a.applicant?.avatar_url ? (
                  <img src={a.applicant.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (a.squad?.name ?? a.applicant?.username ?? "?").slice(0, 1).toUpperCase()
                )}
              </Link>
            ) : (
              <div className="w-9 h-9 rounded-full bg-muted overflow-hidden flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {(a.squad?.name ?? "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              {a.squad ? (
                <p className="text-sm font-semibold truncate">Squad: {a.squad.name}</p>
              ) : a.applicant ? (
                <Link
                  to="/user/$username"
                  params={{ username: a.applicant.username }}
                  className="text-sm font-semibold truncate hover:text-brand"
                >
                  {a.applicant.full_name || a.applicant.username}
                </Link>
              ) : (
                <p className="text-sm font-semibold">Applicant</p>
              )}
              {a.message && (
                <p className="text-xs text-foreground/75 mt-1 whitespace-pre-line">{a.message}</p>
              )}
              {a.portfolio_url && (
                <a
                  href={a.portfolio_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-brand inline-flex items-center gap-1 mt-1 hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> Portfolio
                </a>
              )}
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border capitalize ${
                STATUS_STYLES[a.status] ?? STATUS_STYLES.withdrawn
              }`}
            >
              {a.status}
            </span>
          </div>

          {a.status === "pending" && (
            <div className="flex gap-2 mt-3">
              <button
                disabled={busyId === a.id}
                onClick={() => decide(a.id, "accepted")}
                className="flex-1 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <Check className="w-3.5 h-3.5" /> Accept
              </button>
              <button
                disabled={busyId === a.id}
                onClick={() => decide(a.id, "rejected")}
                className="flex-1 py-2 rounded-lg bg-muted text-foreground text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------------------- Find Creators panel (clients only) ---------------------- */

type SquadWithOwner = {
  id: string;
  name: string;
  description: string | null;
  specialty: string | null;
  avatar_url: string | null;
  owner_id: string;
  owner_username?: string;
  owner_full_name?: string | null;
};

function CreatorsPanel() {
  const { profile, user } = useAuth();
  const [creators, setCreators] = useState<EnrichedCreatorProfile[]>([]);
  const [squads, setSquads] = useState<SquadWithOwner[]>([]);
  const [clientBriefs, setClientBriefs] = useState<Job[]>([]);
  const [selectedBriefId, setSelectedBriefId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [specialtyFilter, setSpecialtyFilter] = useState<string>(profile?.client_field ?? "");
  const [reqTarget, setReqTarget] = useState<EnrichedCreatorProfile | null>(null);
  const [inviteTarget, setInviteTarget] = useState<EnrichedCreatorProfile | null>(null);

  // Load client's open briefs for smart matching
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*, job_roles(professional_roles(name)), job_skills(skills(name))")
        .eq("client_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      const list = (data ?? []) as any[];
      list.forEach((j) => {
        const jr: string[] = (j.job_roles ?? [])
          .map((r: any) => r.professional_roles?.name)
          .filter(Boolean);
        const js: string[] = (j.job_skills ?? []).map((s: any) => s.skills?.name).filter(Boolean);
        j.roles_required = jr;
        j.skills_required = Array.from(new Set([...(j.skills_required ?? []), ...js]));
      });

      setClientBriefs(list);
      // Auto-select first brief if available
      if (list.length > 0) {
        setSelectedBriefId(list[0].id);
      }
    })();
  }, [user]);

  // Load creators and squads with all roles, skills, and specialties
  useEffect(() => {
    (async () => {
      setLoading(true);
      const [{ data: profs }, { data: sqs }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url, bio, portfolio_url, role, experience_level")
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
      let rolesMap = new Map<string, string[]>();
      let skillsMap = new Map<string, string[]>();

      if (ids.length) {
        const [specsRes, rolesRes, skillsRes] = await Promise.all([
          supabase.from("creator_specialties").select("user_id, specialty").in("user_id", ids),
          supabase
            .from("creator_roles")
            .select("creator_id, professional_roles(name)")
            .in("creator_id", ids),
          supabase.from("creator_skills").select("creator_id, skills(name)").in("creator_id", ids),
        ]);

        (specsRes.data ?? []).forEach((s: any) => {
          const arr = specMap.get(s.user_id) ?? [];
          arr.push(s.specialty);
          specMap.set(s.user_id, arr);
        });

        (rolesRes.data ?? []).forEach((r: any) => {
          const roleName = r.professional_roles?.name;
          if (roleName) {
            const arr = rolesMap.get(r.creator_id) ?? [];
            arr.push(roleName);
            rolesMap.set(r.creator_id, arr);
          }
        });

        (skillsRes.data ?? []).forEach((s: any) => {
          const skillName = s.skills?.name;
          if (skillName) {
            const arr = skillsMap.get(s.creator_id) ?? [];
            arr.push(skillName);
            skillsMap.set(s.creator_id, arr);
          }
        });
      }

      const enriched: EnrichedCreatorProfile[] = list.map((p) => ({
        id: p.id,
        username: p.username,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        bio: p.bio,
        portfolio_url: p.portfolio_url,
        experience_level: p.experience_level,
        specialties: specMap.get(p.id) ?? [],
        roles: rolesMap.get(p.id) ?? [],
        skills: skillsMap.get(p.id) ?? [],
        learningSkills: [],
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

  const activeBrief = useMemo(() => {
    return clientBriefs.find((b) => b.id === selectedBriefId);
  }, [clientBriefs, selectedBriefId]);

  // Rank creators by relevance to selected brief or filter by search query
  const rankedCreators = useMemo(() => {
    const term = q.trim().toLowerCase();

    // If a brief is selected, score each creator
    const scored = creators.map((creator) => {
      let matchResult: CreatorMatchResult | undefined = undefined;

      if (activeBrief) {
        const briefReq: JobMatchRequirements = {
          id: activeBrief.id,
          title: activeBrief.title,
          description: activeBrief.description,
          category: activeBrief.category ?? undefined,
          skillsRequired: activeBrief.skills_required ?? [],
          rolesRequired: activeBrief.roles_required ?? [],
          experienceLevel: activeBrief.experience_level ?? undefined,
        };

        const matchProfile: CreatorMatchProfile = {
          id: creator.id,
          username: creator.username,
          full_name: creator.full_name,
          avatar_url: creator.avatar_url,
          bio: creator.bio,
          portfolio_url: creator.portfolio_url,
          roles: creator.roles,
          skills: creator.skills,
          specialties: creator.specialties,
          learningSkills: creator.learningSkills,
          experienceLevel: creator.experience_level,
        };

        matchResult = calculateCreatorMatchForBrief(briefReq, matchProfile, term || undefined);
      }

      return {
        ...creator,
        matchResult,
      };
    });

    return scored
      .filter((c) => {
        if (
          specialtyFilter &&
          !c.specialties.some((sp) => sp.toLowerCase().includes(specialtyFilter.toLowerCase()))
        ) {
          return false;
        }
        if (!term) return true;
        return (
          c.username.toLowerCase().includes(term) ||
          (c.full_name ?? "").toLowerCase().includes(term) ||
          (c.bio ?? "").toLowerCase().includes(term) ||
          c.roles.some((r) => r.toLowerCase().includes(term)) ||
          c.skills.some((s) => s.toLowerCase().includes(term)) ||
          c.specialties.some((sp) => sp.toLowerCase().includes(term))
        );
      })
      .sort((a, b) => {
        if (activeBrief) {
          const scoreDiff =
            (b.matchResult?.matchScore ?? 0) - (a.matchResult?.matchScore ?? 0);
          if (scoreDiff !== 0) return scoreDiff;
        }
        return (a.full_name || a.username).localeCompare(b.full_name || b.username);
      });
  }, [creators, activeBrief, q, specialtyFilter]);

  const visibleSquads = useMemo(() => {
    const term = q.trim().toLowerCase();
    return squads.filter((s) => {
      if (
        specialtyFilter &&
        !(s.specialty ?? "").toLowerCase().includes(specialtyFilter.toLowerCase())
      )
        return false;
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
      {/* Smart Brief Matching Selector for Clients */}
      {clientBriefs.length > 0 && (
        <div className="mb-4 p-4 rounded-xl bg-surface border border-brand/20 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                Match Creators For Brief:
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedBriefId}
                onChange={(e) => setSelectedBriefId(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-background border border-border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-brand/40 text-foreground cursor-pointer"
              >
                <option value="">All Creators (No brief selected)</option>
                {clientBriefs.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} {b.budget ? `(${b.budget})` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {activeBrief && (
            <div className="mt-2.5 pt-2.5 border-t border-border/60 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground/80">Brief criteria:</span>
              {(activeBrief.roles_required ?? []).map((r) => (
                <span
                  key={r}
                  className="px-2 py-0.5 rounded-full bg-brand-soft text-brand text-[10px] font-semibold"
                >
                  Role: {r}
                </span>
              ))}
              {(activeBrief.skills_required ?? []).slice(0, 4).map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded-full bg-muted text-foreground/80 text-[10px] font-semibold"
                >
                  {s}
                </span>
              ))}
              {activeBrief.experience_level && (
                <span className="text-[10px] text-muted-foreground">
                  • {activeBrief.experience_level} level
                </span>
              )}
            </div>
          )}
        </div>
      )}

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search creators by name, skill, role, specialty, or bio…"
          className="w-full pl-10 pr-3 h-11 rounded-xl bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        <FilterChip active={specialtyFilter === ""} onClick={() => setSpecialtyFilter("")}>
          All
        </FilterChip>
        {allSpecialties.map((s) => (
          <FilterChip
            key={s}
            active={specialtyFilter === s}
            onClick={() => setSpecialtyFilter(s)}
          >
            {s}
          </FilterChip>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-muted-foreground py-16 text-sm flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
          <span>Discovering creators…</span>
        </div>
      ) : rankedCreators.length === 0 && visibleSquads.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center border border-border text-sm text-muted-foreground">
          No creators or squads match your filters
        </div>
      ) : (
        <div className="space-y-6">
          {visibleSquads.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Squads ({visibleSquads.length})
              </h3>
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
                        <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-brand-soft text-brand">
                          Squad
                        </span>
                      </div>
                      {s.owner_username && (
                        <p className="text-[11px] text-muted-foreground">
                          led by @{s.owner_username}
                        </p>
                      )}
                      {s.description && (
                        <p className="text-xs text-foreground/70 mt-1 line-clamp-2">
                          {s.description}
                        </p>
                      )}
                      {s.specialty && (
                        <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-muted text-foreground/70 font-semibold mt-1.5">
                          {s.specialty}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {rankedCreators.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Creators ({rankedCreators.length})
                </h3>
                {activeBrief && (
                  <span className="text-[11px] font-semibold text-brand flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Ranked by match to {activeBrief.title}
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {rankedCreators.map((c) => {
                  const m = c.matchResult;
                  return (
                    <div
                      key={c.id}
                      className="bg-surface rounded-xl p-4 border border-border hover:border-brand/40 hover:shadow-sm transition flex flex-col sm:flex-row items-start gap-3"
                    >
                      <Link
                        to="/user/$username"
                        params={{ username: c.username }}
                        className="w-12 h-12 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold text-foreground/80"
                      >
                        {c.avatar_url ? (
                          <img src={c.avatar_url} className="w-full h-full object-cover" />
                        ) : (
                          c.username.slice(0, 1).toUpperCase()
                        )}
                      </Link>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            to="/user/$username"
                            params={{ username: c.username }}
                            className="font-semibold text-sm truncate hover:text-brand"
                          >
                            {c.full_name || c.username}
                          </Link>
                          <span className="text-xs text-muted-foreground">@{c.username}</span>

                          {/* Match Badge for Client */}
                          {m && m.matchScore > 0 && (
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 ${
                                m.matchScore >= 75
                                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                  : m.matchScore >= 40
                                    ? "bg-brand-soft text-brand border-brand/30"
                                    : "bg-muted text-muted-foreground border-border"
                              }`}
                            >
                              <Sparkles className="w-3 h-3" />
                              {m.tierLabel}
                            </span>
                          )}
                        </div>

                        {c.bio && (
                          <p className="text-xs text-foreground/70 mt-0.5 line-clamp-2 leading-relaxed">
                            {c.bio}
                          </p>
                        )}

                        {/* Roles & Specialties */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {c.roles.map((r) => (
                            <span
                              key={r}
                              className="text-[10px] px-2 py-0.5 rounded bg-brand-soft text-brand font-semibold"
                            >
                              {r}
                            </span>
                          ))}
                          {c.specialties.map((s) => (
                            <span
                              key={s}
                              className="text-[10px] px-2 py-0.5 rounded bg-muted text-foreground/80 font-medium"
                            >
                              {s}
                            </span>
                          ))}
                        </div>

                        {/* Matched skills indicator against active brief */}
                        {m && m.matchedSkills.length > 0 && (
                          <div className="mt-2 flex flex-wrap items-center gap-1 text-[11px]">
                            <span className="text-[10px] font-semibold text-muted-foreground">
                              Matched:
                            </span>
                            {m.matchedSkills.map((ms) => (
                              <span
                                key={ms}
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20"
                              >
                                <Check className="w-2.5 h-2.5" /> {ms}
                              </span>
                            ))}
                          </div>
                        )}

                        {c.portfolio_url && (
                          <a
                            href={c.portfolio_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-brand inline-flex items-center gap-1 mt-2 hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" /> Portfolio
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-start mt-2 sm:mt-0 flex-shrink-0">
                        {activeBrief && (
                          <button
                            onClick={() => setInviteTarget(c)}
                            className="px-3 py-1.5 bg-brand-soft text-brand rounded-lg text-xs font-semibold flex items-center gap-1 hover:bg-brand hover:text-white transition"
                          >
                            <Send className="w-3 h-3" /> Invite
                          </button>
                        )}
                        <button
                          onClick={() => setReqTarget(c)}
                          className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold flex items-center gap-1 hover:opacity-90 transition shadow-sm"
                        >
                          <MessageCircle className="w-3 h-3" /> Hire
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {reqTarget && (
        <RequestCreatorModal creator={reqTarget} onClose={() => setReqTarget(null)} />
      )}
      {inviteTarget && (
        <InviteToJobModal creator={inviteTarget} onClose={() => setInviteTarget(null)} />
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface text-foreground/70 border-border hover:border-brand/40"
      }`}
    >
      {children}
    </button>
  );
}

function RequestCreatorModal({
  creator,
  onClose,
}: {
  creator: EnrichedCreatorProfile;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!subject.trim()) {
      toast.error("Subject required");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("creator_requests").insert({
      client_id: user.id,
      creator_id: creator.id,
      subject: subject.trim(),
      message: message.trim() || null,
      budget: budget.trim() || null,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Request sent to @${creator.username}`);
    onClose();
  };

  return (
    <Modal onClose={onClose} title={`Hire @${creator.username}`}>
      <form onSubmit={submit} className="space-y-3">
        <Input
          placeholder="Subject (e.g. Wedding shoot in Mumbai)"
          value={subject}
          onChange={setSubject}
        />
        <textarea
          placeholder="Describe the project, dates, deliverables…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none"
        />
        <Input placeholder="Budget (e.g. ₹50,000)" value={budget} onChange={setBudget} />
        <button
          disabled={busy}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
        >
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
    title: "",
    description: "",
    location: "",
    budget: "",
    company_name: "",
    category: "",
    experience_level: "Intermediate",
    duration: "",
    deadline: "",
  });
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([]);
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [{ data: r }, { data: s }] = await Promise.all([
        supabase.from("professional_roles").select("id, name").eq("is_custom", false),
        supabase.from("skills").select("id, name").eq("is_custom", false),
      ]);
      if (r) setRoles(r);
      if (s) setSkills(s);
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Title and description required");
      return;
    }
    if (selectedRoles.length === 0) {
      toast.error("Please select at least one role");
      return;
    }
    setBusy(true);

    const selectedSkillNames = skills
      .filter((s) => selectedSkills.includes(s.id))
      .map((s) => s.name);

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
      skills_required: selectedSkillNames,
    };

    const { data: job, error } = await supabase.from("jobs").insert(payload).select("id").single();
    if (error) {
      toast.error(error.message);
      setBusy(false);
      return;
    }

    if (selectedRoles.length > 0) {
      await supabase
        .from("job_roles")
        .insert(selectedRoles.map((rid) => ({ job_id: job.id, role_id: rid })));
    }
    if (selectedSkills.length > 0) {
      await supabase
        .from("job_skills")
        .insert(selectedSkills.map((sid) => ({ job_id: job.id, skill_id: sid })));
    }
    setBusy(false);
    toast.success("Project posted");
    onCreated();
  };

  return (
    <Modal onClose={onClose} title="Post a brief">
      <form onSubmit={submit} className="space-y-3">
        <Input
          placeholder="Job title (e.g. Need Instagram Reel Editor)"
          value={form.title}
          onChange={(v) => setForm({ ...form, title: v })}
        />
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Company / brand name"
            value={form.company_name}
            onChange={(v) => setForm({ ...form, company_name: v })}
          />
          <Input
            placeholder="Category (e.g. Video, Design, Audio)"
            value={form.category}
            onChange={(v) => setForm({ ...form, category: v })}
          />
        </div>
        <textarea
          placeholder="Project description, deliverables, references…"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={4}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none"
        />
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Required Roles
          </label>
          <div className="flex flex-wrap gap-1 border border-border p-2 rounded-lg bg-surface max-h-32 overflow-y-auto">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() =>
                  setSelectedRoles((prev) =>
                    prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id]
                  )
                }
                className={`px-2 py-1 text-xs rounded-full transition ${
                  selectedRoles.includes(r.id) ? "bg-brand text-white" : "bg-muted text-foreground"
                }`}
              >
                {r.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1">
            Required Skills
          </label>
          <div className="flex flex-wrap gap-1 border border-border p-2 rounded-lg bg-surface max-h-32 overflow-y-auto">
            {skills.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() =>
                  setSelectedSkills((prev) =>
                    prev.includes(s.id) ? prev.filter((id) => id !== s.id) : [...prev, s.id]
                  )
                }
                className={`px-2 py-1 text-xs rounded-full transition ${
                  selectedSkills.includes(s.id) ? "bg-brand text-white" : "bg-muted text-foreground"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Budget (e.g. ₹10,000)"
            value={form.budget}
            onChange={(v) => setForm({ ...form, budget: v })}
          />
          <Input
            placeholder="Duration (e.g. 30 days)"
            value={form.duration}
            onChange={(v) => setForm({ ...form, duration: v })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="Location (or Remote)"
            value={form.location}
            onChange={(v) => setForm({ ...form, location: v })}
          />
          <select
            value={form.experience_level}
            onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
          >
            <option>Entry</option>
            <option>Intermediate</option>
            <option>Senior</option>
          </select>
        </div>
        <label className="block">
          <span className="block text-xs font-semibold text-muted-foreground mb-1">Deadline</span>
          <input
            type="date"
            value={form.deadline}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
          />
        </label>
        <button
          disabled={busy}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60 transition"
        >
          {busy ? "Posting…" : "Post brief"}
        </button>
      </form>
    </Modal>
  );
}

function ApplyJobModal({
  job,
  onClose,
  onApplied,
}: {
  job: Job;
  onClose: () => void;
  onApplied?: () => void;
}) {
  const { user, profile } = useAuth();
  const [portfolio, setPortfolio] = useState(profile?.portfolio_url ?? "");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [mySquads, setMySquads] = useState<Squad[]>([]);
  const [applyAs, setApplyAs] = useState<string>("self");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("squads")
        .select("id, name")
        .eq("owner_id", user.id);
      setMySquads(data ?? []);
    })();
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);

    const isSquad = applyAs !== "self";
    const payload: any = {
      job_id: job.id,
      applicant_id: isSquad ? null : user.id,
      squad_id: isSquad ? applyAs : null,
      message: message.trim() || null,
      portfolio_url: portfolio.trim() || null,
    };

    const { error } = await supabase.from("job_applications").insert(payload);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application submitted!");
    onApplied?.();
  };

  return (
    <Modal onClose={onClose} title={`Apply: ${job.title}`}>
      <form onSubmit={submit} className="space-y-3">
        {mySquads.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1">
              Apply as
            </label>
            <select
              value={applyAs}
              onChange={(e) => setApplyAs(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
            >
              <option value="self">Myself (@{profile?.username})</option>
              {mySquads.map((s) => (
                <option key={s.id} value={s.id}>
                  Squad: {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <Input
          placeholder="Portfolio URL (website, drive…)"
          value={portfolio}
          onChange={setPortfolio}
        />
        <textarea
          placeholder="Why are you the right fit? Past work, rates, timing…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none"
        />
        <button
          disabled={busy}
          className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition shadow-sm"
        >
          <Send className="w-4 h-4" /> {busy ? "Sending…" : "Send application"}
        </button>
      </form>
    </Modal>
  );
}

function Input({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm"
    />
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-border"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InviteToJobModal({
  creator,
  onClose,
}: {
  creator: EnrichedCreatorProfile;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("client_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false });
      setJobs(data || []);
      setLoading(false);
    })();
  }, [user]);

  const handleInvite = async (job: any) => {
    if (!user) return;
    setBusy(true);

    const { error } = await supabase.from("notifications").insert({
      user_id: creator.id,
      actor_id: user.id,
      type: "job_invite",
      entity_type: "job",
      entity_id: job.id,
      read: false,
    });

    setBusy(false);
    if (error) {
      toast.error("Failed to send invite: " + error.message);
    } else {
      toast.success(`Invited @${creator.username} to ${job.title}`);
      onClose();
    }
  };

  return (
    <Modal onClose={onClose} title={`Invite @${creator.username} to a Brief`}>
      {loading ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          Loading your briefs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground text-sm">
          You don't have any open briefs.
        </div>
      ) : (
        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="p-3 border border-border rounded-xl flex justify-between items-center gap-3 hover:bg-surface"
            >
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{j.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {j.budget ? j.budget : "Unpaid/Negotiable"}
                </p>
              </div>
              <button
                onClick={() => handleInvite(j)}
                disabled={busy}
                className="px-3 py-1.5 bg-brand text-white rounded-lg text-xs font-semibold whitespace-nowrap disabled:opacity-50"
              >
                Invite
              </button>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
