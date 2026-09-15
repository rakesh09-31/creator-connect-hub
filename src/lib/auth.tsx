import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: "creator" | "client" | "admin" | null;
  account_type: "creator" | "client" | "admin" | null;
  role_count?: number;
  client_field: string | null;
  onboarded: boolean;
  portfolio_url: string | null;
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

/**
 * Guarantees that an authenticated user has an active row in public.profiles.
 * If the profile does not exist, an initial profile row is upserted from user metadata.
 */
export async function ensureProfile(user: User): Promise<Profile> {
  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) return existing as Profile;

  const meta = user.user_metadata || {};
  const emailPrefix = user.email?.split("@")[0] || `user_${user.id.slice(0, 8)}`;
  const username = (meta.username || emailPrefix).replace(/[^a-zA-Z0-9_]/g, "_");
  const fullName = meta.full_name || meta.name || username;
  const role = meta.role || "creator";

  const { data: created, error } = await supabase
    .from("profiles")
    .upsert({
      id: user.id,
      username,
      full_name: fullName,
      role,
      account_type: role,
      onboarded: false,
    }, { onConflict: "id" })
    .select()
    .single();

  if (error) {
    console.error("[Auth] ensureProfile upsert error:", error);
    // Fallback attempt to read again in case another process inserted it
    const { data: retry } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (retry) return retry as Profile;
    throw error;
  }

  return created as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = async (u: User) => {
    try {
      const data = await ensureProfile(u);
      let role_count = 0;
      if (data) {
        const type = data.account_type || data.role;
        if (type === "creator") {
          const { count } = await supabase.from("creator_roles").select("*", { count: "exact", head: true }).eq("creator_id", u.id);
          role_count = count || 0;
        } else if (type === "client") {
          const { count } = await supabase.from("client_roles").select("*", { count: "exact", head: true }).eq("client_id", u.id);
          role_count = count || 0;
        }
        setProfile({ ...(data as Profile), role_count });
      } else {
        setProfile(null);
      }
    } catch (err) {
      console.error("[Auth] Failed to load/ensure profile:", err);
      setProfile(null);
    }
  };

  useEffect(() => {
    // 1. Subscribe FIRST
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        // block loading state until profile is fetched
        setLoading(true);
        setTimeout(() => loadProfile(s.user).finally(() => setLoading(false)), 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    // 2. Then read existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value: AuthState = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    refresh: async () => {
      if (session?.user) await loadProfile(session.user);
    },
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
