import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Settings, Grid3x3, Bookmark, Users, Plus, ExternalLink, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/_app/profile")({
  head: () => ({ meta: [{ title: "Profile — Omnicraft" }] }),
  component: ProfilePage,
});

type Squad = { id: string; name: string; description: string | null; specialty: string | null; avatar_url: string | null };

function ProfilePage() {
  const { profile, user, refresh } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [squads, setSquads] = useState<Squad[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [tab, setTab] = useState<"posts" | "squads" | "saved">("posts");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: p }, { data: s }, { data: mems }, { count: fc }, { count: gc }] = await Promise.all([
        supabase.from("posts").select("*").eq("author_id", user.id).order("created_at", { ascending: false }),
        supabase.from("creator_specialties").select("specialty").eq("user_id", user.id),
        supabase.from("squad_members").select("squad_id, squads:squad_id(id, name, description, specialty, avatar_url)").eq("user_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", user.id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", user.id),
      ]);
      setPosts(p ?? []);
      setSpecialties((s ?? []).map((x: any) => x.specialty));
      const sq = (mems ?? []).map((m: any) => m.squads).filter(Boolean);
      setSquads(sq as Squad[]);
      setCounts({ followers: fc ?? 0, following: gc ?? 0 });
    })();
  }, [user]);

  if (!profile) return null;
  const isCreator = profile.role === "creator";

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-surface border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-5">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-2xl font-semibold overflow-hidden ring-2 ring-border">
            {profile.avatar_url
              ? <img src={profile.avatar_url} className="w-full h-full rounded-full object-cover" />
              : profile.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight truncate">{profile.full_name || profile.username}</h1>
                <p className="text-sm text-muted-foreground">@{profile.username}</p>
              </div>
              <button onClick={() => setEditOpen(true)} className="p-2 hover:bg-muted rounded-md text-muted-foreground transition" aria-label="Edit profile">
                <Pencil className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${
                isCreator ? "bg-brand-soft text-brand" : "bg-muted text-foreground/70"
              }`}>
                {profile.role ?? "creator"}
              </span>
            </div>
            {profile.bio && <p className="mt-3 text-sm text-foreground/80 leading-relaxed">{profile.bio}</p>}
            {profile.portfolio_url && (
              <a
                href={profile.portfolio_url}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
              >
                <ExternalLink className="w-3 h-3" /> Portfolio
              </a>
            )}
          </div>
        </div>

        <div className={`grid ${isCreator ? "grid-cols-4" : "grid-cols-3"} gap-2 mt-6 pt-5 border-t border-border`}>
          <Stat label="Posts" value={posts.length} />
          {isCreator && <Stat label="Squads" value={squads.length} />}
          <Stat label="Followers" value={counts.followers} />
          <Stat label="Following" value={counts.following} />
        </div>
      </div>

      {specialties.length > 0 && (
        <div className="mt-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Specialties</h2>
          <div className="flex flex-wrap gap-1.5">
            {specialties.map((s) => (
              <span key={s} className="bg-surface border border-border px-2.5 py-1 rounded-md text-xs font-medium text-foreground/80">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 border-b border-border">
        <div className="flex">
          <TabBtn active={tab === "posts"} onClick={() => setTab("posts")} icon={<Grid3x3 className="w-4 h-4" />} label="Posts" />
          {isCreator && (
            <TabBtn active={tab === "squads"} onClick={() => setTab("squads")} icon={<Users className="w-4 h-4" />} label="Squads" />
          )}
          <TabBtn active={tab === "saved"} onClick={() => setTab("saved")} icon={<Bookmark className="w-4 h-4" />} label="Saved" />
        </div>
      </div>

      {tab === "posts" && (
        posts.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 text-sm">No posts yet</div>
        ) : (
          <div className="grid grid-cols-3 gap-1 mt-2">
            {posts.map((p) => {
              const isVid = p.post_type === "video" || p.post_type === "reel";
              return (
                <div key={p.id} className="aspect-square bg-muted overflow-hidden relative rounded-sm">
                  {p.media_url ? (
                    isVid
                      ? <video src={p.media_url} className="w-full h-full object-cover" muted />
                      : <img src={p.media_url} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-3 text-[11px] text-muted-foreground text-center">{p.caption}</div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}

      {tab === "squads" && isCreator && (
        <div className="mt-4 space-y-2">
          <Link to="/squads" className="flex items-center justify-between p-4 rounded-xl bg-surface border border-dashed border-border hover:border-brand/50 transition">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center"><Plus className="w-4 h-4" /></div>
              <div>
                <p className="font-semibold text-sm">Create or join a squad</p>
                <p className="text-xs text-muted-foreground">Team up to apply for bigger projects</p>
              </div>
            </div>
          </Link>
          {squads.length === 0 ? (
            <div className="text-center text-muted-foreground py-10 text-sm">You're not in any squads yet</div>
          ) : (
            squads.map((s) => (
              <Link key={s.id} to="/squads/$squadId" params={{ squadId: s.id }} className="flex items-center gap-3 p-4 bg-surface rounded-xl border border-border hover:border-brand/40 hover:shadow-sm transition">
                <div className="w-10 h-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold">
                  {s.name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  {s.specialty && <p className="text-xs text-muted-foreground truncate">{s.specialty}</p>}
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {tab === "saved" && <div className="text-center text-muted-foreground py-16 text-sm">Nothing saved yet</div>}

      {editOpen && <EditProfileModal onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); refresh(); }} />}
    </div>
  );
}

function EditProfileModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const { profile, user } = useAuth();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    bio: profile?.bio ?? "",
    portfolio_url: profile?.portfolio_url ?? "",
    avatar_url: profile?.avatar_url ?? "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim() || null,
      bio: form.bio.trim() || null,
      portfolio_url: form.portfolio_url.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
    }).eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Profile updated");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-background w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl p-6 max-h-[90vh] overflow-y-auto border border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit profile</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Full name">
            <input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
          </Field>
          <Field label="Bio">
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm resize-none" />
          </Field>
          <Field label="Portfolio URL">
            <input value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://…" className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
          </Field>
          <Field label="Avatar URL">
            <input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="https://…" className="w-full px-3 py-2.5 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-ring/40 text-sm" />
          </Field>
          <button disabled={busy} className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold text-sm disabled:opacity-60">
            {busy ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <div className="text-xl font-semibold tracking-tight">{value}</div>
      <div className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">{label}</div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
        active ? "border-brand text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}
