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
  skill_count?: number;
  specialty_count?: number;
  client_field: string | null;
  onboarded: boolean;
  portfolio_url: string | null;
  experience_level?: string | null;
  experience_years?: number | null;
  auth_user_id?: string | null;
};

export type OnboardingStatus =
  | "LOADING"             // Session or profile is resolving
  | "UNAUTHENTICATED"     // No active session
  | "ERROR"               // Persistent database/profile load failure
  | "NEED_ROLE"           // Authenticated user has not selected creator vs client -> /onboarding/role
  | "NEED_CREATOR_SETUP"  // Creator chosen, but has not completed specialty/skills -> /onboarding/specialty
  | "NEED_CLIENT_SETUP"   // Client chosen, but has not completed client roles -> /onboarding/client
  | "COMPLETE";           // Fully onboarded -> /home

export function getOnboardingStatus(
  profile: Profile | null,
  loading: boolean,
  session: Session | null,
  error?: string | null
): OnboardingStatus {
  if (loading) return "LOADING";
  if (!session || !session.user) return "UNAUTHENTICATED";
  if (error && !profile) return "ERROR";
  if (!profile) return "LOADING";
  if (profile.onboarded) return "COMPLETE";

  const type = profile.account_type || profile.role;
  if (!type) return "NEED_ROLE";

  if (type === "creator") {
    // If existing creator already has roles and skills/specialties in DB
    if (profile.role_count && profile.role_count > 0 && ((profile.skill_count ?? 0) > 0 || (profile.specialty_count ?? 0) > 0)) {
      return "COMPLETE";
    }
    return "NEED_CREATOR_SETUP";
  }

  if (type === "client") {
    if (profile.role_count && profile.role_count > 0) {
      return "COMPLETE";
    }
    return "NEED_CLIENT_SETUP";
  }

  if (type === "admin") return "COMPLETE";

  return "NEED_ROLE";
}

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  error: string | null;
  onboardingStatus: OnboardingStatus;
  refresh: () => Promise<Profile | null>;
  setProfileOptimistic: (p: Profile) => void;
  retry: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthCtx = createContext<AuthState | null>(null);

/**
 * Guarantees that an authenticated user has an active row in public.profiles.
 * Never overwrites existing user profiles with null roles or false onboarded status.
 */
export async function ensureProfile(user: User): Promise<Profile> {
  // 1. Primary lookup: Check for official profile where id = user.id
  const { data: byId, error: errById } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (errById) {
    console.error("[Auth] ensureProfile query error by id:", errById);
    throw new Error(`Profile query failed: ${errById.message}`);
  }

  if (byId) {
    if (!byId.auth_user_id || byId.auth_user_id !== user.id) {
      await supabase
        .from("profiles")
        .update({ auth_user_id: user.id })
        .eq("id", user.id);
      byId.auth_user_id = user.id;
    }
    return byId as Profile;
  }

  // 2. Secondary lookup: Check if profile is linked via auth_user_id = user.id
  const { data: byAuthId, error: errByAuthId } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (errByAuthId) {
    console.error("[Auth] ensureProfile query error by auth_user_id:", errByAuthId);
  }

  if (byAuthId) {
    return byAuthId as Profile;
  }

  // 3. Username matching: Check if an unlinked directory profile exists for this username
  const meta = user.user_metadata || {};
  const emailPrefix = user.email?.split("@")[0] || `user_${user.id.slice(0, 8)}`;
  const rawUsername = (meta.username || emailPrefix).replace(/[^a-zA-Z0-9_]/g, "_");
  const fullName = meta.full_name || meta.name || rawUsername;
  const role = meta.role || null;

  const { data: dirProfiles, error: dirErr } = await supabase
    .from("profiles")
    .select("*")
    .ilike("username", rawUsername)
    .limit(1);

  if (dirErr) {
    console.error("[Auth] ensureProfile directory check error:", dirErr);
  }

  const directoryProfile = dirProfiles?.[0];

  const initialRole = directoryProfile?.role || role || null;
  const initialAccountType = directoryProfile?.account_type || directoryProfile?.role || role || null;
  const initialOnboarded = !!directoryProfile?.onboarded;

  // Insert owned profile with id: user.id to satisfy RLS (auth.uid() = id)
  const { data: created, error: insertErr } = await supabase
    .from("profiles")
    .insert({
      id: user.id,
      auth_user_id: user.id,
      username: directoryProfile?.username || rawUsername,
      full_name: directoryProfile?.full_name || fullName,
      avatar_url: directoryProfile?.avatar_url || null,
      bio: directoryProfile?.bio || null,
      role: initialRole,
      account_type: initialAccountType,
      onboarded: initialOnboarded,
      portfolio_url: directoryProfile?.portfolio_url || null,
      experience_level: directoryProfile?.experience_level || null,
      experience_years: directoryProfile?.experience_years || null,
    })
    .select()
    .single();

  if (insertErr) {
    console.error("[Auth] ensureProfile insert error:", insertErr);
    // If insert failed due to conflict/race condition, fetch the existing profile
    const { data: existingAfterConflict } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (existingAfterConflict) {
      return existingAfterConflict as Profile;
    }
    throw insertErr;
  }

  return created as Profile;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async (u: User): Promise<Profile | null> => {
    try {
      setError(null);
      const data = await ensureProfile(u);
      let role_count = 0;
      let skill_count = 0;
      let specialty_count = 0;
      let isOnboarded = !!data?.onboarded;

      if (data) {
        const type = data.account_type || data.role;
        const profileId = data.id;

        if (type === "creator") {
          const [{ count: rCount }, { count: sCount }, { count: spCount }] = await Promise.all([
            supabase
              .from("creator_roles")
              .select("role_id", { count: "exact", head: true })
              .or(`creator_id.eq.${u.id},creator_id.eq.${profileId}`),
            supabase
              .from("creator_skills")
              .select("skill_id", { count: "exact", head: true })
              .or(`creator_id.eq.${u.id},creator_id.eq.${profileId}`),
            supabase
              .from("creator_specialties")
              .select("id", { count: "exact", head: true })
              .or(`user_id.eq.${u.id},user_id.eq.${profileId}`),
          ]);
          role_count = rCount || 0;
          skill_count = sCount || 0;
          specialty_count = spCount || 0;

          // If existing creator already has roles AND (skills or specialties), mark onboarded in DB and memory
          if (!isOnboarded && role_count > 0 && (skill_count > 0 || specialty_count > 0)) {
            isOnboarded = true;
            const { error: updErr } = await supabase
              .from("profiles")
              .update({ onboarded: true, role: "creator", account_type: "creator" })
              .eq("id", u.id);
            if (updErr) console.warn("[Auth] Failed to backfill creator onboarded flag:", updErr);
          }
        } else if (type === "client") {
          const { count: cCount } = await supabase
            .from("client_roles")
            .select("role_id", { count: "exact", head: true })
            .or(`client_id.eq.${u.id},client_id.eq.${profileId}`);
          role_count = cCount || 0;

          if (!isOnboarded && role_count > 0) {
            isOnboarded = true;
            const { error: updErr } = await supabase
              .from("profiles")
              .update({ onboarded: true, role: "client", account_type: "client" })
              .eq("id", u.id);
            if (updErr) console.warn("[Auth] Failed to backfill client onboarded flag:", updErr);
          }
        } else if (type === "admin") {
          isOnboarded = true;
        }

        const merged: Profile = {
          ...(data as Profile),
          onboarded: isOnboarded,
          role_count,
          skill_count,
          specialty_count,
        };
        setProfile(merged);
        return merged;
      } else {
        setProfile(null);
        return null;
      }
    } catch (err: any) {
      console.error("[Auth] Failed to load/ensure profile:", err);
      setError(err?.message || "Failed to load profile. Please check network connection.");
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    let initialCheckDone = false;
    let pendingTimeout: any = null;

    const handleSessionChange = (s: Session | null, source: string) => {
      if (!isMounted) return;
      setSession(s);

      if (pendingTimeout) {
        clearTimeout(pendingTimeout);
        pendingTimeout = null;
      }

      if (s?.user) {
        pendingTimeout = setTimeout(async () => {
          if (!isMounted) return;
          try {
            await loadProfile(s.user);
          } catch (err) {
            console.error("[Auth] Error loading profile for session user:", err);
          } finally {
            if (isMounted) {
              setLoading(false);
            }
          }
        }, 0);
      } else {
        setProfile(null);
        setError(null);
        if (source === "INITIAL_SESSION" || source === "getSession" || initialCheckDone) {
          setLoading(false);
        }
      }
    };

    // 1. Fetch initial session to guarantee local storage session restoration
    supabase.auth
      .getSession()
      .then(async ({ data: { session: s }, error }) => {
        if (!isMounted) return;
        initialCheckDone = true;
        if (error) {
          console.error("[Auth] getSession error:", error);
          setError(error.message);
        }
        handleSessionChange(s, "getSession");
      })
      .catch((err) => {
        console.error("[Auth] getSession exception:", err);
        if (isMounted) {
          initialCheckDone = true;
          setError(err?.message || "Authentication network error");
          setLoading(false);
        }
      });

    // 2. Subscribe to auth state changes (login, logout, token refresh, etc.)
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, s) => {
      if (!isMounted) return;

      if (event === "INITIAL_SESSION") {
        initialCheckDone = true;
      }

      if (event === "SIGNED_OUT") {
        if (pendingTimeout) clearTimeout(pendingTimeout);
        setSession(null);
        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }

      handleSessionChange(s, event);
    });

    return () => {
      isMounted = false;
      if (pendingTimeout) clearTimeout(pendingTimeout);
      sub.subscription.unsubscribe();
    };
  }, []);

  const onboardingStatus = getOnboardingStatus(profile, loading, session, error);

  const value: AuthState = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    error,
    onboardingStatus,
    setProfileOptimistic: (p: Profile) => {
      setProfile(p);
    },
    refresh: async (): Promise<Profile | null> => {
      if (session?.user) {
        return await loadProfile(session.user);
      }
      return null;
    },
    retry: async () => {
      if (session?.user) {
        setLoading(true);
        await loadProfile(session.user);
        setLoading(false);
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
        setError(null);
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
