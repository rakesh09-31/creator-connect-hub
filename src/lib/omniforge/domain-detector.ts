import { CanonicalDomain, OmniForgeProject } from "./types";

/**
 * Detects whether the user's prompt explicitly establishes or switches the canonical domain.
 * A new explicit domain request overrides any previous domain.
 */
export function detectCanonicalDomain(
  text: string,
  activeDomain?: CanonicalDomain | null
): CanonicalDomain | null {
  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. MUSIC_BAND
  // "form a squad for music band", "build a music band", "I need musicians for my band",
  // "I want to create a band", "I need a music team", "I am forming a music band and need musicians.",
  // "not that i need only related to music creators like singer,piano player,drum master,and guitarist"
  if (
    /\b(?:music\s+band|music\s+squad|music\s+team|musicians?\s+for\s+(?:my\s+)?band|form\s+(?:a\s+)?(?:squad\s+for\s+)?music\s+band|build\s+(?:a\s+|my\s+|the\s+)?(?:complete\s+)?(?:music\s+)?band|create\s+(?:a\s+|my\s+)?(?:music\s+)?band|forming\s+(?:a\s+)?music\s+band|want\s+to\s+form\s+(?:a\s+)?music\s+band|need\s+(?:a\s+)?music\s+(?:team|band|squad)|musicians?\s+related\s+to\s+music|music\s+creators?\s+like\s+singer|talent\s+musician|musician\s+creators?|all\s+music\s+creators|search\s+musicians|find\s+musicians|find\s+all\s+musicians)\b/i.test(lower) ||
    (/\b(?:band|musicians?)\b/i.test(lower) && /\b(?:squad|team|singer|guitarist|drummer|piano|bass)\b/i.test(lower))
  ) {
    return "MUSIC_BAND";
  }

  // 2. FILM
  if (
    /\b(?:short\s+film|feature\s+film|movie|film\s+production|film\s+squad|film\s+team|make\s+a\s+film|direct\s+a\s+film|romantic\s+musical\s+film|screenplay|cinematography|director\s+of\s+photography)\b/i.test(lower) &&
    !/\b(?:festival|music\s+band)\b/i.test(lower)
  ) {
    return "FILM";
  }

  // 3. EVENT
  if (
    /\b(?:college\s+cultural\s+festival|cultural\s+festival|festival|event|hackathon|conference|exhibition)\b/i.test(lower) &&
    !/\b(?:film\s+festival)\b/i.test(lower)
  ) {
    return "EVENT";
  }

  // 4. SOFTWARE / TECH
  if (
    /\b(?:web\s*app|website|mobile\s*app|software|application|backend\s+api|food\s*delivery\s*app|cybersecurity\s*platform)\b/i.test(lower)
  ) {
    return "SOFTWARE";
  }

  // 5. STARTUP / BUSINESS
  if (/\b(?:startup|fintech|saas\s+platform|marketplace\s+platform)\b/i.test(lower)) {
    return "STARTUP";
  }

  // 6. CONTENT_CREATION
  if (/\b(?:youtube\s+channel|podcast|vlog\s+series|social\s+media\s+campaign)\b/i.test(lower)) {
    return "CONTENT_CREATION";
  }

  return activeDomain || null;
}

/**
 * Returns true if the user's prompt explicitly requests a domain that differs
 * from the active project's domain, requiring an active project switch.
 */
export function isExplicitDomainSwitch(
  userText: string,
  activeProject: OmniForgeProject | null
): boolean {
  if (!activeProject) return false;
  const currentCanonical: CanonicalDomain =
    activeProject.canonicalDomain ||
    (activeProject.domain === "Film"
      ? "FILM"
      : activeProject.domain === "Music"
      ? "MUSIC_BAND"
      : activeProject.domain === "Events"
      ? "EVENT"
      : "OTHER");

  const detected = detectCanonicalDomain(userText, null);
  if (!detected) return false;

  return detected !== currentCanonical;
}
