/**
 * OmniForge Learning Activity & Daily Study Streak Engine
 * 
 * Strict Streak Integrity:
 * - A streak advances ONLY when a qualifying learning activity is actually completed and persisted.
 * - Qualifying activities:
 *   1. Toggling / completing a roadmap topic checklist item
 *   2. Completing a milestone practical exercise
 *   3. Submitting a milestone project or review
 *   4. Completing a verified skill assessment
 * - Opening a page or asking a general question NEVER awards a streak.
 * - Uses the user's local calendar day consistently (YYYY-MM-DD), handles timezone boundaries,
 *   and prevents duplicate credit for the same day.
 */

export interface LearningActivityRecord {
  id: string;
  userId?: string;
  timestamp: string; // ISO string
  localDate: string; // YYYY-MM-DD
  activityType: "CHECKLIST_ITEM" | "PRACTICE_EXERCISE" | "PROJECT_SUBMISSION" | "SKILL_ASSESSMENT";
  roadmapId?: string;
  roadmapTitle?: string;
  milestoneLevel?: number;
  milestoneTitle?: string;
  description: string;
}

export interface UserStreakProfile {
  currentStreak: number;
  longestStreak: number;
  lastActiveLocalDate: string | null; // YYYY-MM-DD
  totalActivitiesCompleted: number;
  activityHistory: LearningActivityRecord[];
}

const STREAK_STORAGE_KEY = "omniforge_user_streak_profile";

/**
 * Get current date in local YYYY-MM-DD
 */
export function getLocalTodayDate(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get yesterday's date in local YYYY-MM-DD
 */
export function getLocalYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Load streak profile from local storage
 */
const inMemoryStreakCache = new Map<string, UserStreakProfile>();

export function loadUserStreakProfile(userId?: string): UserStreakProfile {
  const key = userId ? `${STREAK_STORAGE_KEY}_${userId}` : STREAK_STORAGE_KEY;
  if (inMemoryStreakCache.has(key)) {
    return inMemoryStreakCache.get(key)!;
  }
  try {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveLocalDate: null,
        totalActivitiesCompleted: 0,
        activityHistory: [],
      };
    }
    const raw = localStorage.getItem(key);
    if (!raw) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveLocalDate: null,
        totalActivitiesCompleted: 0,
        activityHistory: [],
      };
    }
    const parsed = JSON.parse(raw) as UserStreakProfile;
    // Check if streak was broken (last active date was before yesterday)
    const yesterday = getLocalYesterdayDate();
    const today = getLocalTodayDate();
    if (parsed.lastActiveLocalDate && parsed.lastActiveLocalDate !== today && parsed.lastActiveLocalDate !== yesterday) {
      // Streak lapsed
      parsed.currentStreak = 0;
    }
    inMemoryStreakCache.set(key, parsed);
    return parsed;
  } catch {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveLocalDate: null,
      totalActivitiesCompleted: 0,
      activityHistory: [],
    };
  }
}

/**
 * Save streak profile to local storage
 */
export function saveUserStreakProfile(profile: UserStreakProfile, userId?: string): void {
  const key = userId ? `${STREAK_STORAGE_KEY}_${userId}` : STREAK_STORAGE_KEY;
  inMemoryStreakCache.set(key, profile);
  try {
    if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
      localStorage.setItem(key, JSON.stringify(profile));
    }
  } catch (err) {
    console.error("[OmniForge Streak] Failed to save streak profile:", err);
  }
}

/**
 * Record a qualifying learning activity and advance daily streak if eligible.
 * Returns updated streak information.
 */
export function recordQualifyingLearningActivity(
  activity: Omit<LearningActivityRecord, "id" | "timestamp" | "localDate">,
  userId?: string
): { profile: UserStreakProfile; streakAdvancedToday: boolean } {
  const profile = loadUserStreakProfile(userId);
  const today = getLocalTodayDate();
  const yesterday = getLocalYesterdayDate();

  const record: LearningActivityRecord = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    timestamp: new Date().toISOString(),
    localDate: today,
    ...activity,
  };

  let streakAdvancedToday = false;

  if (profile.lastActiveLocalDate === today) {
    // Already credited for today; keep streak unchanged
    streakAdvancedToday = false;
  } else if (profile.lastActiveLocalDate === yesterday) {
    // Consecutive day! Advance streak
    profile.currentStreak += 1;
    profile.lastActiveLocalDate = today;
    streakAdvancedToday = true;
  } else {
    // Streak reset or first day
    profile.currentStreak = 1;
    profile.lastActiveLocalDate = today;
    streakAdvancedToday = true;
  }

  if (profile.currentStreak > profile.longestStreak) {
    profile.longestStreak = profile.currentStreak;
  }

  profile.totalActivitiesCompleted += 1;
  profile.activityHistory = [record, ...(profile.activityHistory || [])].slice(0, 100);

  saveUserStreakProfile(profile, userId);

  return { profile, streakAdvancedToday };
}
