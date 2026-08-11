import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { ArrowLeft, MessageCircle, UserCheck, UserPlus, Search as SearchIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { openOrCreateConversation } from "@/lib/messaging";

type SearchParams = { tab?: "followers" | "following" };

export const Route = createFileRoute("/_authenticated/_app/connections/$username")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    tab: search.tab === "following" ? "following" : "followers",
  }),
  component: ConnectionsPage,
});

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
};

function ConnectionsPage() {
  const { username } = Route.useParams();
  const { tab = "followers" } = useSearch({ from: "/_authenticated/_app/connections/$username" }) as SearchParams;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [owner, setOwner] = useState<Profile | null>(null);
  const [people, setPeople] = useState<Profile[]>([]);
  const [myFollowing, setMyFollowing] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: p } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, role")
        .eq("username", username)
        .maybeSingle();
      setOwner(p as Profile | null);
      if (!p) { setLoading(false); return; }

      const [{ count: fc }, { count: gc }] = await Promise.all([
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", p.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", p.id),
      ]);
      setCounts({ followers: fc ?? 0, following: gc ?? 0 });

      // Followers = users who follow owner; Following = users owner follows
      const col = tab === "followers" ? "follower_id" : "following_id";
      const filterCol = tab === "followers" ? "following_id" : "follower_id";
      const { data: rows } = await supabase.from("follows").select(col).eq(filterCol, p.id);
      const ids = ((rows ?? []) as any[]).map((r) => r[col]);
      if (ids.length === 0) { setPeople([]); setLoading(false); return; }
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, bio, role")
        .in("id", ids);
      setPeople((profs ?? []) as Profile[]);

      if (user) {
        const { data: mine } = await supabase.from("follows").select("following_id").eq("follower_id", user.id);
        setMyFollowing(new Set(((mine ?? []) as any[]).map((r) => r.following_id)));
      }
      setLoading(false);
    })();
  }, [username, tab, user?.id]);

  const toggleFollow = async (uid: string) => {
    if (!user) return;
    if (myFollowing.has(uid)) {
      await supabase.from("follows").delete().eq("follower_id", user.id).eq("following_id", uid);
      const next = new Set(myFollowing); next.delete(uid); setMyFollowing(next);
    } else {
      const { error } = await supabase.from("follows").insert({ follower_id: user.id, following_id: uid });
      if (error) { toast.error(error.message); return; }
      const next = new Set(myFollowing); next.add(uid); setMyFollowing(next);
    }
  };

  const openMessage = async (targetUserId: string) => {
    try {
      const conversationId = await openOrCreateConversation(targetUserId);
      navigate({ to: "/messages", search: { c: conversationId } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to open this conversation");
    }
  };

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return people;
    return people.filter((p) =>
      p.username.toLowerCase().includes(t) || (p.full_name ?? "").toLowerCase().includes(t)
    );
  }, [people, q]);

  if (loading) return <div className="text-center py-16 text-muted-foreground">Loading...</div>;
  if (!owner) return <div className="text-center py-16 text-muted-foreground">User not found</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <button onClick={() => window.history.back()} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">@{owner.username}</h1>
        <p className="text-sm text-muted-foreground">{owner.full_name}</p>
      </div>

      <div className="flex border-b border-border mb-4">
        <TabLink to="/connections/$username" params={{ username }} search={{ tab: "followers" as const }} active={tab === "followers"} label={`Followers · ${counts.followers}`} />
        <TabLink to="/connections/$username" params={{ username }} search={{ tab: "following" as const }} active={tab === "following"} label={`Following · ${counts.following}`} />
      </div>

      <div className="relative mb-4">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={`Search ${tab}...`}
          className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm focus:outline-none focus:border-brand text-foreground"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {tab === "followers" ? "No followers yet" : "Not following anyone yet"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const isMe = p.id === user?.id;
            const isFollowed = myFollowing.has(p.id);
            return (
              <div key={p.id} className="bg-surface border border-border rounded-xl p-3 flex items-center gap-3 hover:shadow-sm transition">
                <Link to="/user/$username" params={{ username: p.username }} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-sm font-semibold overflow-hidden ring-2 ring-border flex-shrink-0">
                    {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" alt="" /> : p.username.slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">{p.full_name || p.username}</p>
                    <p className="text-xs text-muted-foreground truncate">@{p.username}{p.bio ? ` · ${p.bio}` : ""}</p>
                  </div>
                </Link>
                {!isMe && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => void openMessage(p.id)}
                      className="p-2 rounded-lg bg-muted hover:bg-muted/70 text-foreground"
                      title="Message"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleFollow(p.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                        isFollowed
                          ? "bg-muted text-foreground border border-border"
                          : "bg-brand text-brand-foreground"
                      }`}
                    >
                      {isFollowed ? <><UserCheck className="w-3.5 h-3.5" /> Following</> : <><UserPlus className="w-3.5 h-3.5" /> Follow</>}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabLink({ to, params, search, active, label }: { to: string; params: any; search: any; active: boolean; label: string }) {
  return (
    <Link
      to={to as any}
      params={params}
      search={search}
      className={`flex-1 text-center py-3 text-sm font-semibold border-b-2 -mb-px transition ${
        active ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );
}
