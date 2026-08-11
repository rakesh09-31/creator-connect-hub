import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import {
  MessageCircle,
  Send,
  Search as SearchIcon,
  ArrowLeft,
  Check,
  CheckCheck,
  Loader2,
  Smile,
  Paperclip,
  Reply,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { BUCKETS, uploadMedia } from "@/lib/uploadMedia";

type MessagesSearch = { with?: string; c?: string };

export const Route = createFileRoute("/_authenticated/_app/messages")({
  head: () => ({ meta: [{ title: "Messages — Omnicraft" }] }),
  validateSearch: (s: Record<string, unknown>): MessagesSearch => ({
    with: typeof s.with === "string" ? s.with : undefined,
    c: typeof s.c === "string" ? s.c : undefined,
  }),
  component: MessagesPage,
});

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};
type Conv = {
  id: string;
  is_group: boolean;
  type: "direct" | "squad";
  squad_id: string | null;
  title: string | null;
  last_message_at: string;
  last_read_at: string;
  other: Profile | null;
  last_body: string | null;
  unread: number;
};
type Msg = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  deleted: boolean;
  reply_to?: string | null;
  edited?: boolean;
};

function timeShort(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return d.toLocaleDateString();
}

function MessagesPage() {
  const { user } = useAuth();
  const search = useSearch({ from: "/_authenticated/_app/messages" }) as MessagesSearch;
  const navigate = useNavigate();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(search.c ?? null);
  const [q, setQ] = useState("");
  const [requestedProfile, setRequestedProfile] = useState<Profile | null>(null);

  // Bootstrap DM if ?with=<userId> is present
  useEffect(() => {
    if (!user?.id || !search.with || search.c) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_or_create_dm", { _other: search.with! });
      if (error) {
        toast.error(error.message);
        return;
      }
      const convId = data as unknown as string;
      await loadConvs();
      navigate({ to: "/messages", search: { c: convId }, replace: true });
      setActiveId(convId);
    })();
    // loadConvs is declared below but is initialized before this effect runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, search.with, navigate]);

  // Resolve the recipient for an explicitly selected DM. This keeps a valid
  // /messages?c=<conversation> route usable while the sidebar is hydrating
  // (and also supports the older ?with=<user> links).
  useEffect(() => {
    if (!user?.id || (!search.with && !search.c)) {
      setRequestedProfile(null);
      return;
    }
    let cancelled = false;
    const loadSelectedProfile = async () => {
      let profileId = search.with;
      if (!profileId && search.c) {
        const { data: members } = await supabase
          .from("conversation_members")
          .select("user_id")
          .eq("conversation_id", search.c)
          .neq("user_id", user.id)
          .limit(1);
        profileId = members?.[0]?.user_id;
      }
      if (!profileId) {
        if (!cancelled) setRequestedProfile(null);
        return;
      }
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, role")
        .eq("id", profileId)
        .maybeSingle();
      if (!cancelled) setRequestedProfile((data as Profile | null) ?? null);
    };
    void loadSelectedProfile();
    return () => {
      cancelled = true;
    };
  }, [user?.id, search.with, search.c]);

  const loadConvs = async () => {
    if (!user?.id) return;
    // Do not use the generated nested conversations relation here. It is
    // schema-cache dependent and an error from it used to turn populated
    // memberships into an empty sidebar. Conversations are fetched below.
    const { data: memberships, error: membershipsError } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at")
      .eq("user_id", user.id)
      .order("last_read_at", { ascending: false });
    if (membershipsError) {
      console.error("Unable to load conversations", membershipsError);
      setLoading(false);
      return;
    }
    const rows = (memberships ?? []) as any[];
    if (!rows.length) {
      setConvs([]);
      setLoading(false);
      return;
    }
    const convIds = rows.map((r) => r.conversation_id);
    // Fetch conversation records explicitly. The generated nested relation is
    // not stable across Supabase schema refreshes and was causing populated
    // memberships to render as an empty/untitled sidebar.
    const { data: conversationRows } = await supabase
      .from("conversations")
      .select("id, is_group, type, squad_id, title, last_message_at")
      .in("id", convIds);
    const conversationById = new Map((conversationRows ?? []).map((conversation) => [conversation.id, conversation]));

    // Other members (for DMs)
    const { data: others } = await supabase
      .from("conversation_members")
      .select("conversation_id, user_id")
      .in("conversation_id", convIds)
      .neq("user_id", user.id);
    const otherIds = Array.from(new Set(((others ?? []) as any[]).map((r) => r.user_id)));
    const profMap: Record<string, Profile> = {};
    if (otherIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, role")
        .in("id", otherIds);
      for (const p of (profs ?? []) as Profile[]) profMap[p.id] = p;
    }
    const otherByConv: Record<string, Profile | null> = {};
    for (const r of (others ?? []) as any[]) {
      if (!otherByConv[r.conversation_id])
        otherByConv[r.conversation_id] = profMap[r.user_id] ?? null;
    }

    // Last message per conv (simple: fetch latest 1 per conv via multiple queries)
    const lastBodies: Record<string, string | null> = {};
    const unreadCounts: Record<string, number> = {};
    await Promise.all(
      rows.map(async (r) => {
        const { data: last } = await supabase
          .from("messages")
          .select("body, attachment_type, created_at")
          .eq("conversation_id", r.conversation_id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        lastBodies[r.conversation_id] = last
          ? (last.body ?? (last.attachment_type ? `[${last.attachment_type}]` : null))
          : null;
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", r.conversation_id)
          .gt("created_at", r.last_read_at)
          .neq("sender_id", user.id);
        unreadCounts[r.conversation_id] = count ?? 0;
      }),
    );

    const list: Conv[] = rows
      .map((r) => {
        const conversation = conversationById.get(r.conversation_id);
        return {
        id: r.conversation_id,
        is_group: conversation?.is_group ?? false,
        type: conversation?.type === "squad" ? "squad" : "direct",
        squad_id: conversation?.squad_id ?? null,
        title: conversation?.title ?? null,
        last_message_at: conversation?.last_message_at ?? new Date(0).toISOString(),
        last_read_at: r.last_read_at,
        other: otherByConv[r.conversation_id] ?? null,
        last_body: lastBodies[r.conversation_id] ?? null,
        unread: unreadCounts[r.conversation_id] ?? 0,
      };
      })
      .sort(
        (a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime(),
      );
    setConvs(list);
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadConvs();
    const ch = supabase
      .channel(`convs:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () =>
        loadConvs(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversation_members",
          filter: `user_id=eq.${user.id}`,
        },
        () => loadConvs(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (search.c) setActiveId(search.c);
  }, [search.c]);

  // Opening the inbox should immediately show the newest available thread.
  // Keep an explicit valid selection, but never leave a real inbox on the
  // blank "Select a chat" state.
  useEffect(() => {
    if (!convs.length) return;
    const selected = search.c ?? activeId;
    if (selected && convs.some((conversation) => conversation.id === selected)) return;
    const conversationId = convs[0].id;
    setActiveId(conversationId);
    navigate({ to: "/messages", search: { c: conversationId }, replace: true });
  }, [convs, search.c, activeId, navigate]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return convs;
    return convs.filter((c) => {
      const n = c.other?.full_name || c.other?.username || c.title || "";
      return n.toLowerCase().includes(t);
    });
  }, [convs, q]);

  const activeConv =
    convs.find((c) => c.id === activeId) ??
    (activeId && requestedProfile
      ? ({
          id: activeId,
          is_group: false,
          type: "direct",
          squad_id: null,
          title: null,
          last_message_at: new Date().toISOString(),
          last_read_at: new Date().toISOString(),
          other: requestedProfile,
          last_body: null,
          unread: 0,
        } satisfies Conv)
      : null);

  const personalChats = filtered.filter((conversation) => conversation.type === "direct");
  const squadChats = filtered.filter((conversation) => conversation.type === "squad");

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-9rem)] px-0 sm:px-4 py-0 sm:py-4">
      <div className="h-full bg-surface border border-border rounded-none sm:rounded-2xl overflow-hidden flex">
        {/* List */}
        <aside
          className={`${activeId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 md:border-r border-border`}
        >
          <div className="p-4 border-b border-border">
            <h1 className="text-xl font-bold mb-3">Messages</h1>
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-9 pr-3 py-2 bg-muted/50 border border-border rounded-lg text-sm focus:outline-none focus:border-brand"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                No chats yet.
              </div>
            ) : (
              <div>
                <div className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Personal chats
                </div>
                <ul>
                  {personalChats.map((c) => {
                    const name = c.other?.full_name || c.other?.username || c.title || "Chat";
                    const active = c.id === activeId;
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => {
                            setActiveId(c.id);
                            navigate({ to: "/messages", search: { c: c.id }, replace: true });
                          }}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/60 hover:bg-muted/40 transition ${active ? "bg-brand-soft/40" : ""}`}
                        >
                          <div className="w-11 h-11 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-semibold">
                            {c.other?.avatar_url ? (
                              <img
                                src={c.other.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              name[0]?.toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm truncate">{name}</span>
                              <span className="text-[10px] text-muted-foreground flex-shrink-0">
                                {timeShort(c.last_message_at)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <span
                                className={`text-xs truncate ${c.unread > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                              >
                                {c.last_body ?? "Say hi 👋"}
                              </span>
                              {c.unread > 0 && (
                                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center leading-none flex-shrink-0">
                                  {c.unread > 99 ? "99+" : c.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="border-t border-border/60 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Squad chats
                </div>
                <ul>
                  {squadChats.map((c) => {
                    const name = c.title || "Squad chat";
                    const active = c.id === activeId;
                    return (
                      <li key={c.id}>
                        <button
                          onClick={() => {
                            setActiveId(c.id);
                            navigate({ to: "/messages", search: { c: c.id }, replace: true });
                          }}
                          className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-muted/40 transition ${active ? "bg-brand-soft/40" : ""}`}
                        >
                          <div className="w-11 h-11 rounded-2xl bg-brand/15 text-brand flex items-center justify-center text-sm font-semibold">
                            {name[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-sm truncate">{name}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {timeShort(c.last_message_at)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-0.5">
                              <span className="text-xs truncate text-muted-foreground">
                                {c.last_body ?? "Start the squad conversation"}
                              </span>
                              {c.unread > 0 && (
                                <span className="min-w-[18px] h-[18px] rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">
                                  {c.unread}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className={`${activeId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
          {activeConv ? (
            <ChatThread
              conv={activeConv}
              meId={user!.id}
              onBack={() => {
                setActiveId(null);
                navigate({ to: "/messages", search: {}, replace: true });
              }}
              onRead={() => loadConvs()}
            />
          ) : activeId && (loading || !!search.with) ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-muted-foreground p-8">
              <MessageCircle className="w-14 h-14 mb-3 opacity-40" />
              <p className="font-semibold text-foreground">Select a chat</p>
              <p className="text-sm">Your conversations appear here.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ChatThread({
  conv,
  meId,
  onBack,
  onRead,
}: {
  conv: Conv;
  meId: string;
  onBack: () => void;
  onRead: () => void;
}) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null);
  const [otherLastSeen, setOtherLastSeen] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasOlder, setHasOlder] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  const markRead = async () => {
    await supabase
      .from("conversation_members")
      .update({ last_read_at: new Date().toISOString() })
      .eq("conversation_id", conv.id)
      .eq("user_id", meId);
    onRead();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true });
      if (!cancelled) {
        setMsgs((data ?? []) as Msg[]);
        setHasOlder(false);
        scrollToBottom();
        markRead();
      }
    })();

    // Load other's last_read_at
    if (conv.other) {
      supabase
        .from("conversation_members")
        .select("last_read_at")
        .eq("conversation_id", conv.id)
        .eq("user_id", conv.other.id)
        .maybeSingle()
        .then(({ data }) => {
          if (!cancelled && data) setOtherReadAt((data as any).last_read_at);
        });
      (supabase.from("user_presence" as any) as any)
        .select("last_seen_at")
        .eq("user_id", conv.other.id)
        .maybeSingle()
        .then(({ data }: any) => {
          if (!cancelled) setOtherLastSeen(data?.last_seen_at ?? null);
        });
    }

    const ch = supabase
      .channel(`conv:${conv.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conv.id}`,
        },
        (payload) => {
          const m = payload.new as Msg;
          setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          scrollToBottom();
          if (m.sender_id !== meId) markRead();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "conversation_members",
          filter: `conversation_id=eq.${conv.id}`,
        },
        (payload) => {
          const row = payload.new as any;
          if (row.user_id !== meId) setOtherReadAt(row.last_read_at);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `user_id=eq.${conv.other?.id ?? ""}`,
        },
        (payload) => setOtherLastSeen((payload.new as any).last_seen_at),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "typing_status",
          filter: `conversation_id=eq.${conv.id}`,
        },
        async () => {
          if (!conv.other) return;
          const { data } = await supabase
            .from("typing_status")
            .select("updated_at")
            .eq("conversation_id", conv.id)
            .eq("user_id", conv.other.id)
            .maybeSingle();
          if (!data) {
            setOtherTyping(false);
            return;
          }
          const fresh = new Date().getTime() - new Date((data as any).updated_at).getTime() < 5000;
          setOtherTyping(fresh);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.id]);

  const send = async () => {
    const body = text.trim();
    if ((!body && !file) || sending) return;
    setSending(true);
    setText("");
    const sendingFile = file;
    setFile(null);
    if (editingId) {
      const { error } = await supabase
        .from("messages")
        .update({ body, edited: true })
        .eq("id", editingId)
        .eq("sender_id", meId);
      if (error) {
        toast.error(error.message);
        setText(body);
      } else
        setMsgs((prev) => prev.map((m) => (m.id === editingId ? { ...m, body, edited: true } : m)));
      setEditingId(null);
      setSending(false);
      return;
    }
    // optimistic
    const tempId = `temp-${Date.now()}`;
    setMsgs((prev) => [
      ...prev,
      {
        id: tempId,
        conversation_id: conv.id,
        sender_id: meId,
        body: body || null,
        attachment_url: null,
        attachment_type: sendingFile?.type ?? null,
        created_at: new Date().toISOString(),
        deleted: false,
        reply_to: replyTo?.id ?? null,
      },
    ]);
    scrollToBottom();
    let attachment_url: string | null = null;
    try {
if (sendingFile) attachment_url = await uploadMedia(sendingFile, meId, BUCKETS.CHAT_MEDIA, "chat");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
      setMsgs((prev) => prev.filter((m) => m.id !== tempId));
      setSending(false);
      return;
    }
    const { data, error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conv.id,
        sender_id: meId,
        body: body || null,
        attachment_url,
        attachment_type: sendingFile?.type ?? null,
        reply_to: replyTo?.id ?? null,
      })
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
      setMsgs((prev) => prev.filter((m) => m.id !== tempId));
    } else if (data) {
      setMsgs((prev) => prev.map((m) => (m.id === tempId ? (data as Msg) : m)));
    }
    setReplyTo(null);
    setSending(false);
  };

  const loadOlder = async () => {
    if (loadingOlder || !hasOlder || !msgs.length) return;
    setLoadingOlder(true);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .lt("created_at", msgs[0].created_at)
      .order("created_at", { ascending: false })
      .limit(50);
    const older = ((data ?? []) as Msg[]).reverse();
    setMsgs((prev) => [...older, ...prev]);
    setHasOlder(older.length === 50);
    setLoadingOlder(false);
  };

  const removeMessage = async (message: Msg) => {
    const { error } = await supabase
      .from("messages")
      .update({ body: null, attachment_url: null, deleted: true })
      .eq("id", message.id)
      .eq("sender_id", meId);
    if (error) toast.error(error.message);
    else
      setMsgs((prev) =>
        prev.map((m) =>
          m.id === message.id ? { ...m, body: null, attachment_url: null, deleted: true } : m,
        ),
      );
  };

  const handleTyping = async (v: string) => {
    setText(v);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    await supabase
      .from("typing_status")
      .upsert({ conversation_id: conv.id, user_id: meId, updated_at: new Date().toISOString() });
    typingTimer.current = setTimeout(async () => {
      await supabase
        .from("typing_status")
        .delete()
        .eq("conversation_id", conv.id)
        .eq("user_id", meId);
    }, 3000);
  };

  const name = conv.other?.full_name || conv.other?.username || conv.title || "Chat";
  const isOnline = !!otherLastSeen && Date.now() - new Date(otherLastSeen).getTime() < 65_000;
  const lastMineIdx = (() => {
    for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].sender_id === meId) return i;
    return -1;
  })();

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <button onClick={onBack} className="md:hidden p-1.5 rounded-md hover:bg-muted">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold">
          {conv.other?.avatar_url ? (
            <img src={conv.other.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            name[0]?.toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {otherTyping ? (
              <span className="text-brand">typing…</span>
            ) : isOnline ? (
              <span className="text-emerald-500">Active now</span>
            ) : otherLastSeen ? (
              `Last seen ${timeShort(otherLastSeen)} ago`
            ) : (
              `@${conv.other?.username ?? ""}`
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 bg-background/40"
      >
        {hasOlder && (
          <button
            onClick={() => void loadOlder()}
            disabled={loadingOlder}
            className="block mx-auto text-xs text-brand hover:underline disabled:opacity-50"
          >
            {loadingOlder ? "Loading…" : "Load earlier messages"}
          </button>
        )}
        {msgs.map((m, i) => {
          const mine = m.sender_id === meId;
          const prev = msgs[i - 1];
          const showGap = !prev || prev.sender_id !== m.sender_id;
          const isLastMine = mine && i === lastMineIdx;
          const seen = isLastMine && otherReadAt && new Date(otherReadAt) >= new Date(m.created_at);
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"} ${showGap ? "mt-2" : ""}`}
            >
              <div
                className={`group max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm animate-fade-in ${mine ? "bg-brand text-white rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}
              >
                {m.reply_to && (
                  <p
                    className={`mb-1 border-l-2 pl-2 text-[11px] ${mine ? "border-white/50 text-white/75" : "border-brand text-muted-foreground"}`}
                  >
                    Replying to a message
                  </p>
                )}
                {m.deleted ? (
                  <i className="opacity-70">This message was deleted</i>
                ) : (
                  <>
                    {m.body && <p>{m.body}</p>}
                    {m.attachment_url &&
                      (m.attachment_type?.startsWith("image/") ? (
                        <img
                          src={m.attachment_url}
                          alt="Attachment"
                          className="mt-2 max-h-60 rounded-lg"
                        />
                      ) : m.attachment_type?.startsWith("video/") ? (
                        <video
                          controls
                          src={m.attachment_url}
                          className="mt-2 max-h-60 rounded-lg"
                        />
                      ) : (
                        <a
                          href={m.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-1 block underline"
                        >
                          Download attachment
                        </a>
                      ))}
                  </>
                )}
                <div
                  className={`flex items-center gap-1 mt-0.5 text-[10px] ${mine ? "text-white/70 justify-end" : "text-muted-foreground"}`}
                >
                  <span>
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {m.edited && <span>edited</span>}
                  {mine &&
                    (seen ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                </div>
                {!m.deleted && (
                  <div className="mt-1 flex gap-1 opacity-70 group-hover:opacity-100">
                    <button onClick={() => setReplyTo(m)} title="Reply">
                      <Reply className="w-3.5 h-3.5" />
                    </button>
                    {mine && (
                      <>
                        <button
                          onClick={() => {
                            setEditingId(m.id);
                            setText(m.body ?? "");
                          }}
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => void removeMessage(m)} title="Delete for everyone">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {msgs.length === 0 && (
          <div className="text-center text-sm text-muted-foreground py-10">Say hi 👋</div>
        )}
      </div>

      {/* Composer */}
      <div className="p-3 border-t border-border flex items-end gap-2">
        {(replyTo || editingId || file) && (
          <div className="absolute mb-16 ml-10 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs shadow">
            <span>
              {editingId
                ? "Editing message"
                : file
                  ? `Attached: ${file.name}`
                  : "Replying to a message"}
            </span>
            <button
              onClick={() => {
                setReplyTo(null);
                setEditingId(null);
                setFile(null);
              }}
              className="ml-2"
            >
              <X className="inline w-3 h-3" />
            </button>
          </div>
        )}
        <label
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
          <input
            type="file"
            className="hidden"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title="Emoji">
          <Smile className="w-5 h-5" />
        </button>
        <textarea
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none max-h-32 px-3 py-2 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-brand"
        />
        <button
          onClick={send}
          disabled={(!text.trim() && !file) || sending}
          className="p-2.5 rounded-full bg-brand text-white disabled:opacity-40 hover:scale-105 transition"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
