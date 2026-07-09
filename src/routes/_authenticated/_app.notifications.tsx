import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Heart, MessageCircle, UserPlus, Briefcase, Check, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Omnicraft" }] }),
  component: NotificationsPage,
});

type Notif = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  entity_type: string | null;
  entity_id: string | null;
  data: Record<string, any>;
  read: boolean;
  created_at: string;
  actor?: { username: string; full_name: string | null; avatar_url: string | null } | null;
};

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  if (d < 604800) return `${Math.floor(d / 86400)}d`;
  return new Date(iso).toLocaleDateString();
}

function iconFor(type: string) {
  if (type === "like") return <Heart className="w-4 h-4 text-rose-500" />;
  if (type === "comment") return <MessageCircle className="w-4 h-4 text-blue-500" />;
  if (type === "follow") return <UserPlus className="w-4 h-4 text-emerald-500" />;
  if (type.startsWith("hire")) return <Briefcase className="w-4 h-4 text-amber-500" />;
  return <Bell className="w-4 h-4 text-brand" />;
}

function labelFor(n: Notif) {
  const name = n.actor?.full_name || n.actor?.username || "Someone";
  switch (n.type) {
    case "like": return `${name} liked your post`;
    case "comment": return `${name} commented: “${n.data?.preview ?? ""}”`;
    case "follow": return `${name} started following you`;
    case "hire_request": return `${name} sent a hire request${n.data?.subject ? `: ${n.data.subject}` : ""}`;
    case "hire_accepted": return `${name} accepted your hire request`;
    case "hire_rejected": return `${name} declined your hire request`;
    case "message": return `${name}: ${n.data?.preview ?? "sent you a message"}`;
    default: return `${name} · ${n.type}`;
  }
}

function linkFor(n: Notif): string {
  if (n.type === "follow" && n.actor?.username) return `/user/${n.actor.username}`;
  if (n.entity_type === "post" && n.entity_id) return `/home`;
  if (n.entity_type === "creator_request") return `/messages`;
  return "/notifications";
}

function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"all" | "unread">("all");

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      const { data: notifs } = await supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      const rows = (notifs ?? []) as unknown as Notif[];
      const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean))) as string[];
      let actorMap: Record<string, Notif["actor"]> = {};
      if (actorIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username, full_name, avatar_url")
          .in("id", actorIds);
        actorMap = Object.fromEntries((profs ?? []).map((p) => [p.id, p]));
      }
      if (!cancelled) {
        setItems(rows.map((r) => ({ ...r, actor: r.actor_id ? actorMap[r.actor_id] : null })));
        setLoading(false);
      }
    };
    load();

    const channel = supabase
      .channel(`notif-page:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => load()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const visible = useMemo(() => (tab === "unread" ? items.filter((i) => !i.read) : items), [items, tab]);
  const unreadCount = items.filter((i) => !i.read).length;

  const markAllRead = async () => {
    if (!user?.id || !unreadCount) return;
    await supabase.from("notifications" as any).update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  const markOne = async (id: string, read: boolean) => {
    await supabase.from("notifications" as any).update({ read }).eq("id", id);
  };

  const remove = async (id: string) => {
    await supabase.from("notifications" as any).delete().eq("id", id);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="text-sm font-semibold text-brand hover:underline">
            Mark all read
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {(["all", "unread"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              tab === t ? "bg-brand text-white" : "bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "all" ? "All" : `Unread${unreadCount ? ` · ${unreadCount}` : ""}`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : visible.length === 0 ? (
        <div className="bg-surface rounded-2xl p-12 text-center border border-border">
          <Bell className="w-12 h-12 mx-auto text-brand mb-3" />
          <h3 className="text-xl font-bold mb-1">You're all caught up</h3>
          <p className="text-muted-foreground">Likes, follows, comments, and hire requests will show up here.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((n) => (
            <li key={n.id}>
              <div className={`group flex items-start gap-3 p-3 rounded-2xl border transition ${
                n.read ? "bg-surface border-border" : "bg-brand-soft/40 border-brand/30"
              }`}>
                <Link
                  to={linkFor(n)}
                  onClick={() => !n.read && markOne(n.id, true)}
                  className="flex-1 flex items-start gap-3 min-w-0"
                >
                  <div className="relative shrink-0">
                    {n.actor?.avatar_url ? (
                      <img src={n.actor.avatar_url} alt="" className="w-11 h-11 rounded-full object-cover" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-brand flex items-center justify-center text-white font-bold">
                        {(n.actor?.username?.[0] ?? "?").toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center">
                      {iconFor(n.type)}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{labelFor(n)}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                </Link>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  {!n.read && (
                    <button
                      onClick={() => markOne(n.id, true)}
                      className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                      title="Mark read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => remove(n.id)}
                    className="p-1.5 rounded-md hover:bg-muted text-muted-foreground"
                    title="Delete"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
