import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { MessageCircle, Send, Search as SearchIcon, ArrowLeft, Check, CheckCheck, Loader2, Smile, Paperclip, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { uploadFile, optimizeImage, kindOfFile } from "@/lib/storage";

type MessagesSearch = { with?: string; c?: string };

export const Route = createFileRoute("/_authenticated/_app/messages")({
  head: () => ({ meta: [{ title: "Messages — Omnicraft" }] }),
  validateSearch: (s: Record<string, unknown>): MessagesSearch => ({
    with: typeof s.with === "string" ? s.with : undefined,
    c: typeof s.c === "string" ? s.c : undefined,
  }),
  component: MessagesPage,
});

type Profile = { id: string; username: string; full_name: string | null; avatar_url: string | null; role: string | null };
type Conv = {
  id: string;
  is_group: boolean;
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

  // Bootstrap DM if ?with=<userId> is present
  useEffect(() => {
    if (!user?.id || !search.with) return;
    (async () => {
      const { data, error } = await supabase.rpc("get_or_create_dm", { _other: search.with! });
      if (error) { toast.error(error.message); return; }
      const convId = data as unknown as string;
      navigate({ to: "/messages", search: { c: convId }, replace: true });
      setActiveId(convId);
    })();
  }, [user?.id, search.with, navigate]);

  const loadConvs = async () => {
    if (!user?.id) return;
    const { data: memberships } = await supabase
      .from("conversation_members")
      .select("conversation_id, last_read_at, conversations(id, is_group, title, last_message_at)")
      .eq("user_id", user.id)
      .order("last_read_at", { ascending: false });
    const rows = (memberships ?? []) as any[];
    if (!rows.length) { setConvs([]); setLoading(false); return; }
    const convIds = rows.map((r) => r.conversation_id);

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
      if (!otherByConv[r.conversation_id]) otherByConv[r.conversation_id] = profMap[r.user_id] ?? null;
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
          ? last.body ?? (last.attachment_type ? `[${last.attachment_type}]` : null)
          : null;
        const { count } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", r.conversation_id)
          .gt("created_at", r.last_read_at)
          .neq("sender_id", user.id);
        unreadCounts[r.conversation_id] = count ?? 0;
      })
    );

    const list: Conv[] = rows
      .map((r) => ({
        id: r.conversation_id,
        is_group: r.conversations?.is_group ?? false,
        title: r.conversations?.title ?? null,
        last_message_at: r.conversations?.last_message_at ?? new Date(0).toISOString(),
        last_read_at: r.last_read_at,
        other: otherByConv[r.conversation_id] ?? null,
        last_body: lastBodies[r.conversation_id] ?? null,
        unread: unreadCounts[r.conversation_id] ?? 0,
      }))
      .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    setConvs(list);
    setLoading(false);
  };

  useEffect(() => {
    if (!user?.id) return;
    loadConvs();
    const ch = supabase
      .channel(`convs:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => loadConvs())
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_members", filter: `user_id=eq.${user.id}` }, () => loadConvs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return convs;
    return convs.filter((c) => {
      const n = c.other?.full_name || c.other?.username || c.title || "";
      return n.toLowerCase().includes(t);
    });
  }, [convs, q]);

  const activeConv = convs.find((c) => c.id === activeId) ?? null;

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-9rem)] px-0 sm:px-4 py-0 sm:py-4">
      <div className="h-full bg-surface border border-border rounded-none sm:rounded-2xl overflow-hidden flex">
        {/* List */}
        <aside className={`${activeId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 md:border-r border-border`}>
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
              <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <MessageCircle className="w-10 h-10 mx-auto mb-2 opacity-40" />
                No chats yet.
              </div>
            ) : (
              <ul>
                {filtered.map((c) => {
                  const name = c.other?.full_name || c.other?.username || c.title || "Chat";
                  const active = c.id === activeId;
                  return (
                    <li key={c.id}>
                      <button
                        onClick={() => { setActiveId(c.id); navigate({ to: "/messages", search: { c: c.id }, replace: true }); }}
                        className={`w-full text-left px-4 py-3 flex items-start gap-3 border-b border-border/60 hover:bg-muted/40 transition ${active ? "bg-brand-soft/40" : ""}`}
                      >
                        <div className="w-11 h-11 rounded-full bg-muted overflow-hidden flex-shrink-0 flex items-center justify-center text-sm font-semibold">
                          {c.other?.avatar_url ? <img src={c.other.avatar_url} alt="" className="w-full h-full object-cover" /> : name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-sm truncate">{name}</span>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">{timeShort(c.last_message_at)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <span className={`text-xs truncate ${c.unread > 0 ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
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
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className={`${activeId ? "flex" : "hidden md:flex"} flex-1 flex-col min-w-0`}>
          {activeConv ? (
            <ChatThread
              conv={activeConv}
              meId={user!.id}
              onBack={() => { setActiveId(null); navigate({ to: "/messages", search: {}, replace: true }); }}
              onRead={() => loadConvs()}
            />
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

function ChatThread({ conv, meId, onBack, onRead }: { conv: Conv; meId: string; onBack: () => void; onRead: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [attaching, setAttaching] = useState(0);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);


  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  const markRead = async () => {
    await supabase.from("conversation_members").update({ last_read_at: new Date().toISOString() }).eq("conversation_id", conv.id).eq("user_id", meId);
    onRead();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!cancelled) {
        setMsgs((data ?? []) as Msg[]);
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
        .then(({ data }) => { if (!cancelled && data) setOtherReadAt((data as any).last_read_at); });
    }

    const ch = supabase
      .channel(`conv:${conv.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conv.id}` }, (payload) => {
        const m = payload.new as Msg;
        setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
        scrollToBottom();
        if (m.sender_id !== meId) markRead();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "conversation_members", filter: `conversation_id=eq.${conv.id}` }, (payload) => {
        const row = payload.new as any;
        if (row.user_id !== meId) setOtherReadAt(row.last_read_at);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "typing_status", filter: `conversation_id=eq.${conv.id}` }, async () => {
        if (!conv.other) return;
        const { data } = await supabase
          .from("typing_status")
          .select("updated_at")
          .eq("conversation_id", conv.id)
          .eq("user_id", conv.other.id)
          .maybeSingle();
        if (!data) { setOtherTyping(false); return; }
        const fresh = new Date().getTime() - new Date((data as any).updated_at).getTime() < 5000;
        setOtherTyping(fresh);
      })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.id]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    // optimistic
    const tempId = `temp-${Date.now()}`;
    setMsgs((prev) => [...prev, { id: tempId, conversation_id: conv.id, sender_id: meId, body, attachment_url: null, attachment_type: null, created_at: new Date().toISOString(), deleted: false }]);
    scrollToBottom();
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conv.id, sender_id: meId, body })
      .select("*")
      .single();
    if (error) {
      toast.error(error.message);
      setMsgs((prev) => prev.filter((m) => m.id !== tempId));
    } else if (data) {
      setMsgs((prev) => prev.map((m) => (m.id === tempId ? (data as Msg) : m)));
    }
    setSending(false);
  };

  const handleTyping = async (v: string) => {
    setText(v);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    await supabase.from("typing_status").upsert({ conversation_id: conv.id, user_id: meId, updated_at: new Date().toISOString() });
    typingTimer.current = setTimeout(async () => {
      await supabase.from("typing_status").delete().eq("conversation_id", conv.id).eq("user_id", meId);
    }, 3000);
  };

  const name = conv.other?.full_name || conv.other?.username || conv.title || "Chat";
  const lastMineIdx = (() => { for (let i = msgs.length - 1; i >= 0; i--) if (msgs[i].sender_id === meId) return i; return -1; })();

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-border">
        <button onClick={onBack} className="md:hidden p-1.5 rounded-md hover:bg-muted"><ArrowLeft className="w-5 h-5" /></button>
        <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-sm font-semibold">
          {conv.other?.avatar_url ? <img src={conv.other.avatar_url} alt="" className="w-full h-full object-cover" /> : name[0]?.toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {otherTyping ? <span className="text-brand">typing…</span> : `@${conv.other?.username ?? ""}`}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 bg-background/40">
        {msgs.map((m, i) => {
          const mine = m.sender_id === meId;
          const prev = msgs[i - 1];
          const showGap = !prev || prev.sender_id !== m.sender_id;
          const isLastMine = mine && i === lastMineIdx;
          const seen = isLastMine && otherReadAt && new Date(otherReadAt) >= new Date(m.created_at);
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"} ${showGap ? "mt-2" : ""}`}>
              <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm animate-fade-in ${mine ? "bg-brand text-white rounded-br-md" : "bg-muted text-foreground rounded-bl-md"}`}>
                {m.body}
                <div className={`flex items-center gap-1 mt-0.5 text-[10px] ${mine ? "text-white/70 justify-end" : "text-muted-foreground"}`}>
                  <span>{new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  {mine && (seen ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />)}
                </div>
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
        <button className="p-2 rounded-lg hover:bg-muted text-muted-foreground" title="Emoji"><Smile className="w-5 h-5" /></button>
        <textarea
          value={text}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 resize-none max-h-32 px-3 py-2 bg-muted/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-brand"
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="p-2.5 rounded-full bg-brand text-white disabled:opacity-40 hover:scale-105 transition"
          aria-label="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
