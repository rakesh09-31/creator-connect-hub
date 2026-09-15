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
  experience_level?: string | null;
  experience_years?: number | null;
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
  const role = meta.role || null;

  const { data: created, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: user.id,
        username,
        full_name: fullName,
        role,
        account_type: role,
        onboarded: false,
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[Auth] ensureProfile upsert error:", error);
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

  const loadProfile = async (u: User): Promise<Profile | null> => {
    try {
      const data = await ensureProfile(u);
      let role_count = 0;
      let isOnboarded = !!data.onboarded;

      if (data) {
        const type = data.account_type || data.role;
        if (!isOnboarded) {
          if (type === "creator") {
            const { count } = await supabase
              .from("creator_roles")
              .select("role_id", { count: "exact" })
              .eq("creator_id", u.id);
            role_count = count || 0;
            // If the creator already has roles assigned in DB, mark them onboarded
            if (role_count > 0) {
              isOnboarded = true;
              supabase
                .from("profiles")
                .update({ onboarded: true })
                .eq("id", u.id)
                .then(() => {});
            }
          } else if (type === "client") {
            const { count } = await supabase
              .from("client_roles")
              .select("role_id", { count: "exact" })
              .eq("client_id", u.id);
            role_count = count || 0;
            if (role_count > 0) {
              isOnboarded = true;
              supabase
                .from("profiles")
                .update({ onboarded: true })
                .eq("id", u.id)
                .then(() => {});
            }
          }
        } else {
          role_count = 1;
        }

        const merged: Profile = {
          ...(data as Profile),
          onboarded: isOnboarded,
          role_count,
        };
        setProfile(merged);
        return merged;
      } else {
        setProfile(null);
        return null;
      }
    } catch (err) {
      console.error("[Auth] Failed to load/ensure profile:", err);
      setProfile(null);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      if (!isMounted) return;

      setSession(s);
      if (s?.user) {
        // Must yield to next tick so Supabase Auth client releases its internal event lock
        setTimeout(async () => {
          if (!isMounted) return;
          try {
            await loadProfile(s.user);
          } catch (err) {
            console.error("[Auth] loadProfile error:", err);
          } finally {
            if (isMounted) setLoading(false);
          }
        }, 0);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value: AuthState = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    refresh: async () => {
      if (session?.user) {
        await loadProfile(session.user);
      }
    },
    signOut: async () => {
      try {
        setLoading(true);
        await supabase.auth.signOut();
      } catch (err) {
        console.error("[Auth] Sign out error:", err);
      } finally {
        setSession(null);
        setProfile(null);
        setLoading(false);
        window.location.href = "/login";
      }
    },
  };

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
