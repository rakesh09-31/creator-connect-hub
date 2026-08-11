import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export function MessageBadge({ active }: { active: boolean }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    let disposed = false;
    const load = async () => {
      const { data: members } = await supabase.from("conversation_members").select("conversation_id,last_read_at").eq("user_id", user.id);
      const ids = members?.map((m) => m.conversation_id) ?? [];
      if (!ids.length) return !disposed && setCount(0);
      const counts = await Promise.all(members!.map(async (m) => {
        const { count: unread } = await supabase.from("messages").select("id", { count: "exact", head: true }).eq("conversation_id", m.conversation_id).neq("sender_id", user.id).gt("created_at", m.last_read_at);
        return unread ? 1 : 0;
      }));
      if (!disposed) setCount(counts.reduce((sum, value) => sum + value, 0));
    };
    void load();
    const channel = supabase.channel(`message-badge:${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_members", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { disposed = true; supabase.removeChannel(channel); };
  }, [user?.id]);

  return <Link to="/messages" aria-label="Messages" className={`relative p-2 rounded-md transition ${active ? "text-brand bg-brand-soft" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}>
    <MessageCircle className="w-5 h-5" />
    {count > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-bold flex items-center justify-center">{count > 99 ? "99+" : count}</span>}
  </Link>;
}
