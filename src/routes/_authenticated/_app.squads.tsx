import { useCallback, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { Users, Plus, X, Search, Sparkles, Filter, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/squads")({
  head: () => ({ meta: [{ title: "Squads — Omnicraft" }] }),
  component: SquadsPage,
});

type Squad = {
  id: string;
  name: string;
  description: string | null;
  specialty: string | null;
  owner_id: string;
  avatar_url?: string | null;
  cover_url?: string | null;
  privacy?: string | null;
  created_at?: string | null;
};

type SquadMembershipRow = { squads?: Squad | null };

function SquadsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mySquads, setMySquads] = useState<Squad[]>([]);
  const [allSquads, setAllSquads] = useState<Squad[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [showMySquadsModal, setShowMySquadsModal] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data: mems } = await supabase
      .from("squad_members")
      .select("squads:squad_id(*)")
      .eq("user_id", user.id);
    const mine = ((mems ?? []) as SquadMembershipRow[])
      .map((m) => m.squads)
      .filter((squad): squad is Squad => Boolean(squad));
    setMySquads(mine);

    const { data: all } = await supabase
      .from("squads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    const { data: memberRows } = await supabase.from("squad_members").select("squad_id");
    const counts = (memberRows ?? []).reduce<Record<string, number>>((acc, row) => {
      const id = row.squad_id;
      acc[id] = (acc[id] ?? 0) + 1;
      return acc;
    }, {});
    setAllSquads((all ?? []) as Squad[]);
    setMemberCounts(counts);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredSquads = useMemo(() => {
    const term = search.trim().toLowerCase();
    let rows = [...allSquads];
    if (category !== "all") {
      rows = rows.filter((s) => (s.specialty || "").toLowerCase().includes(category.toLowerCase()));
    }
    if (term) {
      rows = rows.filter((s) =>
        `${s.name} ${s.description ?? ""} ${s.specialty ?? ""}`.toLowerCase().includes(term),
      );
    }
    rows = rows.sort((a, b) => {
      if (sortBy === "largest") return (b.description?.length ?? 0) - (a.description?.length ?? 0);
      if (sortBy === "trending") return (b.created_at?.length ?? 0) - (a.created_at?.length ?? 0);
      if (sortBy === "newest") {
        return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime();
      }
      return 0;
    });
    return rows;
  }, [allSquads, category, search, sortBy]);

  // This route owns /squads/$squadId. Without this outlet, TanStack Router
  // updates the URL but has nowhere to mount the detail child route.
  if (/^\/squads\/[^/]+$/.test(location.pathname)) return <Outlet />;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-white/60 bg-gradient-to-br from-fuchsia-600 via-pink-600 to-orange-500 p-6 text-white shadow-xl sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-white/90">
            <Sparkles className="h-3.5 w-3.5" /> Squad Studio
          </div>
          <h1 className="text-3xl font-bold">Squads</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/90">
            Build creative collectives, manage members, and keep collaboration moving from one
            shared place.
          </p>
        </div>
        {profile?.role !== "client" && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-fuchsia-700 shadow-lg transition hover:scale-[1.01]"
          >
            <Plus className="h-4 w-4" /> Create Squad
          </button>
        )}
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-border bg-surface/90 p-4 shadow-sm backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                My squads
              </p>
              <p className="text-2xl font-semibold text-foreground">{mySquads.length}</p>
            </div>
            <button
              onClick={() => setShowMySquadsModal(true)}
              className="rounded-full border border-border px-3 py-1.5 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              View all
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {mySquads.slice(0, 4).map((squad) => (
              <Link
                key={squad.id}
                to="/squads/$squadId"
                params={{ squadId: squad.id }}
                className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground transition hover:border-fuchsia-400 hover:text-fuchsia-700"
              >
                {squad.name}
              </Link>
            ))}
            {mySquads.length === 0 && (
              <p className="text-sm text-muted-foreground">
                You are not in any squads yet. Create one or join one below.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface/90 p-4 shadow-sm backdrop-blur">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Filter className="h-4 w-4" /> Discover squads
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 rounded-2xl border border-border bg-background px-3 py-2 text-sm">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search squads, tags, owners"
                className="w-full bg-transparent outline-none"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                <option value="all">All categories</option>
                <option value="photography">Photography</option>
                <option value="video">Video Editing</option>
                <option value="music">Music</option>
                <option value="gaming">Gaming</option>
                <option value="film">Film Making</option>
                <option value="coding">Coding</option>
                <option value="design">Designers</option>
                <option value="marketing">Marketing</option>
                <option value="ai">AI</option>
                <option value="business">Business</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none"
              >
                <option value="newest">Newest</option>
                <option value="largest">Largest</option>
                <option value="trending">Trending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Browse squads
          </h2>
          <p className="text-sm text-muted-foreground">{filteredSquads.length} visible</p>
        </div>
        {loading ? (
          <div className="rounded-3xl border border-border bg-surface/80 p-6 text-sm text-muted-foreground">
            Loading squads…
          </div>
        ) : filteredSquads.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border bg-surface/70 p-10 text-center text-sm text-muted-foreground">
            No squads match that filter yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredSquads.map((squad) => (
              <SquadCard key={squad.id} squad={squad} memberCount={memberCounts[squad.id] ?? 0} />
            ))}
          </div>
        )}
      </section>

      {showCreate && (
        <CreateSquadModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            void load();
            navigate({ to: "/squads" });
          }}
        />
      )}
      {showMySquadsModal && (
        <MySquadsModal squads={mySquads} onClose={() => setShowMySquadsModal(false)} />
      )}
    </div>
  );
}

function SquadCard({ squad, memberCount }: { squad: Squad; memberCount: number }) {
  const badge = (squad.privacy || "public").toLowerCase();
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate({ to: "/squads/$squadId", params: { squadId: squad.id } })}
      className="group flex w-full items-start gap-3 rounded-3xl border border-border bg-surface/90 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-fuchsia-500 to-pink-500 text-xl font-black text-white">
        {squad.avatar_url ? (
          <img src={squad.avatar_url} alt="" className="h-full w-full object-cover" />
        ) : (
          squad.name.slice(0, 1).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-foreground">{squad.name}</p>
          <span className="rounded-full border border-fuchsia-200 bg-fuchsia-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-fuchsia-700">
            {badge}
          </span>
        </div>
        {squad.specialty && (
          <p className="mt-1 text-sm font-medium text-fuchsia-700">{squad.specialty}</p>
        )}
        {squad.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{squad.description}</p>
        )}
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {memberCount} member{memberCount === 1 ? "" : "s"}
          </span>
          <ChevronRight className="ml-auto h-4 w-4 transition group-hover:translate-x-0.5" />
        </div>
      </div>
    </button>
  );
}

function MySquadsModal({ squads, onClose }: { squads: Squad[]; onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl border border-border bg-background p-6 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">My Squads</h2>
            <p className="text-sm text-muted-foreground">
              Jump back into the squads you already belong to.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          {squads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              You are not in any squads yet.
            </div>
          ) : (
            squads.map((squad) => (
              <button
                key={squad.id}
                type="button"
                onClick={() => navigate({ to: "/squads/$squadId", params: { squadId: squad.id } })}
                className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface/70 px-3 py-3 text-left transition hover:border-fuchsia-400"
              >
                <div>
                  <p className="font-semibold text-foreground">{squad.name}</p>
                  {squad.specialty && (
                    <p className="text-sm text-muted-foreground">{squad.specialty}</p>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function CreateSquadModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;
    if (profile?.role === "client") {
      toast.error("Client accounts cannot create squads");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from("squads")
      .insert({
        owner_id: user.id,
        name: name.trim(),
        specialty: specialty.trim() || null,
        description: description.trim() || null,
      })
      .select()
      .single();
    if (error || !data) {
      setBusy(false);
      toast.error(error?.message ?? "Failed to create squad");
      return;
    }
    await supabase
      .from("squad_members")
      .insert({ squad_id: data.id, user_id: user.id, role: "owner" });
    setBusy(false);
    toast.success("Squad created");
    onCreated();
    navigate({ to: "/squads/$squadId", params: { squadId: data.id } });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-t-3xl border border-border bg-background p-6 sm:rounded-3xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">New Squad</h2>
            <p className="text-sm text-muted-foreground">
              Start a focused creative team in minutes.
            </p>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Squad name"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
          />
          <input
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            placeholder="Focus (e.g. Photography, Video Editing)"
            className="w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will the squad do?"
            rows={4}
            className="w-full resize-none rounded-2xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-fuchsia-500"
          />
          <button
            disabled={busy}
            className="w-full rounded-2xl bg-gradient-to-r from-fuchsia-600 to-pink-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Creating..." : "Create Squad"}
          </button>
        </form>
      </div>
    </div>
  );
}
