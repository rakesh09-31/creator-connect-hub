import { useState, useEffect } from "react";
import { X, Search, Send, Loader2, Link2, Share as ShareIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { VideoItem } from "./VideoViewer";

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
};

export function ShareVideoDialog({ item, onClose }: { item: VideoItem; onClose: () => void }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [recentUsers, setRecentUsers] = useState<Profile[]>([]);
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: mems } = await supabase
        .from("conversation_members")
        .select("conversation_id")
        .eq("user_id", user.id)
        .order("last_read_at", { ascending: false })
        .limit(20);
        
      if (mems && mems.length > 0) {
        const cIds = mems.map(m => m.conversation_id);
        const { data: others } = await supabase
          .from("conversation_members")
          .select("user_id")
          .in("conversation_id", cIds)
          .neq("user_id", user.id);
          
        if (others && others.length > 0) {
          const uniqueIds = Array.from(new Set(others.map(o => o.user_id))).slice(0, 10);
          const { data: profs } = await supabase
            .from("profiles")
            .select("id, username, full_name, avatar_url, role")
            .in("id", uniqueIds);
          if (profs) setRecentUsers(profs as Profile[]);
        }
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!search.trim() || !user) {
      setSearchResults([]);
      return;
    }
    const delay = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, role")
        .neq("id", user.id)
        .or(`username.ilike.%${search}%,full_name.ilike.%${search}%`)
        .limit(10);
      setSearchResults((data as Profile[]) || []);
      setLoading(false);
    }, 400);
    return () => clearTimeout(delay);
  }, [search, user]);

  const handleShareExternal = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === 'function') await navigator.share({ url, title: item.title || "Video" });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied!");
      }
    } catch {}
  };

  const handleSend = async () => {
    if (!selectedUser || !user) return;
    setSending(true);
    try {
      const { data: convId, error: convErr } = await supabase.rpc("get_or_create_dm", { _other: selectedUser.id });
      if (convErr) throw convErr;
      
      const bodyPayload = JSON.stringify({
        id: item.id,
        title: item.title,
        poster: item.poster
      });

      const { error: msgErr } = await supabase
        .from("messages")
        .insert({
          conversation_id: convId as unknown as string,
          sender_id: user.id,
          attachment_url: item.url,
          attachment_type: "shared_video",
          body: bodyPayload
        });
        
      if (msgErr) throw msgErr;
      
      toast.success("Creative shared successfully!");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Unable to share this video. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const displayList = search.trim() ? searchResults : recentUsers;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-surface border border-border w-full max-w-md rounded-2xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground">Share this creative</h2>
          <button onClick={onClose} className="p-1.5 rounded-full text-muted-foreground hover:bg-muted transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto max-h-[60vh]">


          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search Omnicraft users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-muted/50 border border-border rounded-xl text-sm focus:outline-none focus:border-brand"
            />
          </div>

          {selectedUser && (
            <div className="mb-4 p-3 bg-brand-soft/20 border border-brand/30 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex-shrink-0">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-semibold">{selectedUser.username[0]?.toUpperCase()}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{selectedUser.full_name || selectedUser.username}</p>
                  <p className="text-xs text-muted-foreground truncate">@{selectedUser.username}</p>
                </div>
              </div>
              <button onClick={() => setSelectedUser(null)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {!selectedUser && (
            <>
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
                {search.trim() ? "Search Results" : "Recent"}
              </h3>
              
              {loading ? (
                <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : displayList.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  {search.trim() ? "No Omnicraft users found." : "No recent contacts."}
                </div>
              ) : (
                <ul className="space-y-1">
                  {displayList.map(p => (
                    <li key={p.id}>
                      <button
                        onClick={() => setSelectedUser(p)}
                        className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-surface border border-border overflow-hidden flex-shrink-0">
                          {p.avatar_url ? (
                            <img src={p.avatar_url} className="w-full h-full object-cover" alt="" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-muted-foreground">{p.username[0]?.toUpperCase()}</div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">{p.full_name || p.username}</p>
                            {p.role && <span className="text-[10px] uppercase font-bold text-brand bg-brand-soft px-1.5 py-0.5 rounded">{p.role}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">@{p.username}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}

          {/* External Apps Section at the Bottom */}
          <div className="mt-6 pt-6 border-t border-border">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
              Share Elsewhere
            </h3>
            <div className="flex gap-4">
              <button onClick={handleShareExternal} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground group">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-brand group-hover:text-white transition">
                  {typeof navigator.share === 'function' ? <ShareIcon className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                </div>
                <span className="text-xs font-semibold">{typeof navigator.share === 'function' ? "Native Share" : "Copy Link"}</span>
              </button>
              <button onClick={async () => {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied to clipboard!");
              }} className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground group">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-brand group-hover:text-white transition">
                  <Link2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold">Copy Link</span>
              </button>
            </div>
          </div>
        </div>

        {selectedUser && (
          <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/30">
            <button onClick={() => setSelectedUser(null)} className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-xl transition">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex items-center gap-2 px-6 py-2 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand/90 transition disabled:opacity-50"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
