import { evaluateRoleMatchEvidence } from '../src/lib/omniforge/matcher';
import { RealCreatorProfile } from '../src/lib/omniforge/types';

const raviProfile: RealCreatorProfile = {
  id: "485f7840-3ead-443e-8438-1eb2a6dfe2c1",
  username: "ravi_edits",
  fullName: "ravi_edits",
  avatarUrl: null,
  role: "creator",
  bio: "Creator on Omnicraft. Open to collabs and briefs.",
  skills: [],
  specialties: [],
  roles: [],
  portfolioItemsCount: 0,
  portfolioSamples: [],
  availability: "available",
};

console.log("Ravi for Video Editor:", evaluateRoleMatchEvidence(raviProfile, "Video Editor"));
console.log("Ravi for Lead Actress:", evaluateRoleMatchEvidence(raviProfile, "Lead Actress"));
console.log("Ravi for Lead Actor:", evaluateRoleMatchEvidence(raviProfile, "Lead Actor"));
