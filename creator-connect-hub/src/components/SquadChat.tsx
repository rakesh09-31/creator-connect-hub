import { useEffect, useRef, useState } from "react";
import { Send, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type ChatMessage = { id: string; conversation_id: string; sender_id: string; body: string | null; attachment_url: string | null; created_at: string };
type Sender = { username: string; full_name: string | null; avatar_url: string | null };

export function SquadChat({ squadId, userId }: { squadId: string; userId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [senders, setSenders] = useState<Record<string, Sender>>({});
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const scrollDown = () => requestAnimationFrame(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; });
  const hydrate = async (rows: ChatMessage[]) => {
    const ids = [...new Set(rows.map((row) => row.sender_id))];
    if (!ids.length) return;
    const { data } = await supabase.from("profiles").select("id,username,full_name,avatar_url").in("id", ids);
    setSenders((old) => ({ ...old, ...Object.fromEntries((data ?? []).map((profile) => [profile.id, profile])) }));
  };

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data: id, error: conversationError } = await supabase.rpc("get_or_create_squad_conversation", { _squad_id: squadId });
      if (conversationError || !id) { toast.error(conversationError?.message ?? "Unable to open squad chat"); return; }
      if (!cancelled) setConversationId(id);
    })();
    return () => { cancelled = true; };
  }, [squadId]);

  useEffect(() => {
    if (!conversationId) return;
    let cancelled = false;
    const load = async () => {
      const { data, error } = await supabase.from("messages").select("id,conversation_id,sender_id,body,attachment_url,created_at").eq("conversation_id", conversationId).order("created_at", { ascending: true }).limit(200);
      if (error) { toast.error(error.message); return; }
      const rows = (data ?? []) as ChatMessage[];
      await hydrate(rows);
      if (!cancelled) { setMessages(rows); scrollDown(); }
    };
    void load();
    const channel = supabase.channel(`squad-chat:${conversationId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` }, async ({ new: row }) => {
        const message = row as ChatMessage;
        await hydrate([message]);
        if (!cancelled) setMessages((old) => old.some((item) => item.id === message.id) ? old : [...old, message]);
        scrollDown();
      }).subscribe();
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [conversationId]);

  const send = async () => {
    const message = text.trim();
    if (!message || sending || !conversationId) return;
    setText(""); setSending(true);
    const { data, error } = await supabase.from("messages").insert({ conversation_id: conversationId, sender_id: userId, body: message }).select("id,conversation_id,sender_id,body,attachment_url,created_at").single();
    if (error) { setText(message); toast.error(error.message); }
    else if (data) { const row = data as ChatMessage; setMessages((old) => old.some((item) => item.id === row.id) ? old : [...old, row]); scrollDown(); }
    setSending(false);
  };

  return <section className="mt-6 rounded-2xl border border-border bg-surface overflow-hidden">
    <div className="flex items-center gap-2 p-4 border-b border-border"><Users className="w-5 h-5 text-brand" /><div><h2 className="font-bold">Squad chat</h2><p className="text-xs text-muted-foreground">Messages are visible to every squad member.</p></div></div>
    <div ref={listRef} className="h-80 overflow-y-auto p-4 space-y-3 bg-background/40">
      {messages.length === 0 && <p className="text-sm text-center text-muted-foreground py-12">Start the squad conversation.</p>}
      {messages.map((item) => {
        const mine = item.sender_id === userId; const sender = senders[item.sender_id]; const name = sender?.full_name || sender?.username || "Squad member";
        return <div key={item.id} className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
          {!mine && <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold">{sender?.avatar_url ? <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" /> : name[0]}</div>}
          <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-brand text-white rounded-br-md" : "bg-muted rounded-bl-md"}`}><p className={`text-[11px] font-semibold mb-0.5 ${mine ? "text-white/75" : "text-muted-foreground"}`}>{mine ? "You" : name}</p><p className="whitespace-pre-wrap">{item.body}</p><p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p></div>
        </div>;
      })}
    </div>
    <div className="p-3 border-t border-border flex gap-2"><textarea value={text} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} rows={1} placeholder="Message the squad…" className="flex-1 resize-none rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm focus:outline-none focus:border-brand" /><button onClick={() => void send()} disabled={!text.trim() || sending || !conversationId} className="rounded-xl bg-brand text-white p-2.5 disabled:opacity-40" aria-label="Send squad message"><Send className="w-4 h-4" /></button></div>
  </section>;
}
