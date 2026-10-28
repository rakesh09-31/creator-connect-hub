import { supabase } from '../src/integrations/supabase/client';

interface RoleEvidenceDef {
  canonicalRole: string;
  roleAliases: string[];
  genderRequirement?: 'male' | 'female';
  disallowedKeywords?: string[];
  primarySkills: string[];
  secondarySkills: string[];
  primarySpecialties: string[];
  portfolioKeywords: string[];
  irrelevantSkills: string[];
}

const ROLE_TAXONOMY: Record<string, RoleEvidenceDef> = {
  'lead actor': {
    canonicalRole: 'Lead Actor',
    roleAliases: ['lead actor', 'actor', 'hero', 'male lead', 'film actor', 'theatre actor', 'screen actor'],
    genderRequirement: 'male',
    disallowedKeywords: ['actress', 'heroine', 'female actor'],
    primarySkills: ['acting', 'screen acting', 'method acting', 'film acting', 'theatre', 'drama', 'character acting', 'dialogue delivery', 'voice modulation', 'monologue', 'action stunts'],
    secondarySkills: ['improvisation', 'stage performance', 'performance'],
    primarySpecialties: ['actor', 'lead actor', 'film acting', 'screen acting', 'theatre', 'drama', 'action'],
    portfolioKeywords: ['actor', 'acting', 'audition', 'monologue', 'scene', 'reel', 'performance'],
    irrelevantSkills: ['adobe photoshop', 'photoshop', 'adobe illustrator', 'illustrator', 'ui/ux', 'graphic design', 'figma', 'branding', 'cinematography', 'accounting', 'seo', 'web development'],
  },
  'lead actress': {
    canonicalRole: 'Lead Actress',
    roleAliases: ['lead actress', 'actress', 'heroine', 'female lead', 'film actress', 'theatre actress', 'screen actress', 'female actor'],
    genderRequirement: 'female',
    disallowedKeywords: ['male lead', 'hero'],
    primarySkills: ['acting', 'screen acting', 'method acting', 'film acting', 'theatre', 'drama', 'character acting', 'dialogue delivery', 'improvisation', 'female performance', 'voice modulation'],
    secondarySkills: ['stage performance', 'performance'],
    primarySpecialties: ['actress', 'lead actress', 'heroine', 'female actor', 'film acting', 'drama', 'theatre'],
    portfolioKeywords: ['actress', 'heroine', 'acting', 'audition', 'monologue', 'scene', 'reel'],
    irrelevantSkills: ['photoshop', 'illustrator', 'branding', 'cinematography', 'web development'],
  },
  'dancer': {
    canonicalRole: 'Dancer',
    roleAliases: ['dancer', 'dancing', 'lead dancer', 'troupe dancer', 'classical dancer', 'contemporary dancer', 'western dancer', 'choreographer'],
    primarySkills: ['dance', 'dancing', 'choreography', 'bharatanatyam', 'hip-hop', 'contemporary dance', 'classical dance', 'western dance', 'folk dance', 'ballet', 'jazz', 'freestyle', 'dance performance', 'stage dance'],
    secondarySkills: ['stage presence', 'performer', 'rhythmic movement'],
    primarySpecialties: ['dancer', 'lead dancer', 'choreography', 'classical dance', 'contemporary', 'hip hop', 'western dance', 'choreographer'],
    portfolioKeywords: ['dancer', 'dance', 'choreography', 'routine', 'performance'],
    irrelevantSkills: ['photoshop', 'illustrator', 'graphic design', 'accounting', 'ui/ux', 'cinematography'],
  },
  'lead singer': {
    canonicalRole: 'Lead Singer',
    roleAliases: ['lead singer', 'singer', 'playback singer', 'vocalist', 'vocals', 'classical singer', 'melody singer'],
    primarySkills: ['singing', 'singer', 'vocalist', 'playback singing', 'playback singer', 'vocals', 'vocal performance', 'classical music', 'carnatic', 'hindustani', 'melody', 'voice modulation', 'song recording'],
    secondarySkills: ['voice artist', 'stage presence', 'music'],
    primarySpecialties: ['singer', 'playback singer', 'vocalist', 'lead singer', 'classical vocal', 'singing', 'voice artist'],
    portfolioKeywords: ['song', 'track', 'vocal', 'playback', 'acoustic', 'album', 'singing'],
    irrelevantSkills: ['photoshop', 'acting', 'cinematography', 'graphic design', 'video editing'],
  },
  'cinematographer': {
    canonicalRole: 'Cinematographer',
    roleAliases: ['cinematographer', 'director of photography', 'dop', 'camera operator', '1st ac', 'focus puller', 'camera', 'cinematography'],
    primarySkills: ['cinematography', 'camera operation', 'director of photography', 'lighting design', 'lighting setup', 'camera package', 'lenses', 'framing', 'gimbal operation', 'drone cinematography', 'low-key lighting'],
    secondarySkills: ['videographer', 'videography', 'photographer', 'color grading'],
    primarySpecialties: ['cinematographer', 'dop', 'cinematography', 'camera operator', 'director of photography', 'videographer'],
    portfolioKeywords: ['cinematography', 'dop', 'camera', 'lighting', 'reel', 'showreel', 'film'],
    irrelevantSkills: ['actor', 'singing', 'dancing', 'photoshop', 'branding', 'ui/ux'],
  },
  'video editor': {
    canonicalRole: 'Video Editor',
    roleAliases: ['video editor', 'film editor', 'editor', 'colorist', 'color grader', 'post-production editor'],
    primarySkills: ['video editing', 'film editing', 'adobe premiere pro', 'premiere pro', 'davinci resolve', 'final cut pro', 'capcut', 'avid media composer', 'color grading', 'after effects', 'rough cut'],
    secondarySkills: ['motion graphics', 'youtube editing', 'photo editing'],
    primarySpecialties: ['video editor', 'film editor', 'editor', 'youtube editing', 'colorist', 'photo editing'],
    portfolioKeywords: ['cinematic reel', 'editing', 'editor', 'showreel', 'trailer', 'cut', 'reel'],
    irrelevantSkills: ['actor', 'singing', 'dancing', 'branding & identity'],
  },
  'sound designer': {
    canonicalRole: 'Sound Designer',
    roleAliases: ['sound designer', 'sound recordist', 'audio engineer', 'boom operator', 'foley artist', 'sound mixer', 'production sound mixer', 'music composer', 'music producer'],
    primarySkills: ['sound design', 'audio engineering', 'foley', 'audio mixing', '5.1 surround', 'pro tools', 'logic pro', 'sound editing', 'audio production', 'location sound', 'boom microphone', 'ambient sound', 'mixing & mastering', 'music composition'],
    secondarySkills: ['music producer', 'composer', 'voice artist'],
    primarySpecialties: ['sound designer', 'audio engineer', 'sound recordist', 'foley artist', 'audio mixing', 'music producer', 'music composer'],
    portfolioKeywords: ['soundtrack', 'audio', 'sound', 'foley', 'score', 'mix', 'ambient'],
    irrelevantSkills: ['adobe illustrator', 'branding & identity', 'graphic design', 'ui/ux', 'brand identity', 'photoshop', 'web development'],
  },
};

function scoreCreatorForRole(creator: any, targetRole: string) {
  const normTarget = targetRole.toLowerCase().trim();
  const def = ROLE_TAXONOMY[normTarget] || Object.values(ROLE_TAXONOMY).find(d => 
    d.roleAliases.some(a => normTarget.includes(a) || a.includes(normTarget))
  );

  if (!def) {
    return { score: 0, reason: 'Role definition not found', skillsMatched: [], specialtiesMatched: [], portfolioMatches: [], roleAlignment: false };
  }

  const pRoles = (creator.roles || []).map((r: string) => r.toLowerCase().trim()).filter(Boolean);
  const pSpecs = (creator.specialties || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean);
  const pSkills = (creator.skills || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean);
  const pPorts = (creator.portfolioSamples || []).map((p: any) => ({
    title: (p.title || '').toLowerCase().trim(),
    desc: (p.description || '').toLowerCase().trim(),
  }));
  const bio = (creator.bio || '').toLowerCase().trim();
  const username = (creator.username || '').toLowerCase().trim();

  // Strict gender/role exclusion
  if (def.genderRequirement === 'female') {
    const hasFemaleEvidence = 
      pRoles.some(r => /actress|heroine|female/i.test(r)) ||
      pSpecs.some(s => /actress|heroine|female/i.test(s)) ||
      pSkills.some(s => /actress|heroine|female/i.test(s)) ||
      /actress|heroine|female|woman|lady/i.test(bio) ||
      /actress|heroine/i.test(username);
    
    if (!hasFemaleEvidence) {
      return { score: 0, reason: 'No female/actress evidence found in profile.', skillsMatched: [], specialtiesMatched: [], portfolioMatches: [], roleAlignment: false };
    }
  }

  if (def.disallowedKeywords && def.disallowedKeywords.length > 0) {
    if (def.genderRequirement === 'male') {
      const hasFemaleEvidence = pRoles.some(r => /actress|heroine/i.test(r)) || pSpecs.some(s => /actress|heroine/i.test(s));
      if (hasFemaleEvidence) {
        return { score: 0, reason: 'Profile is designated as actress, not male lead.', skillsMatched: [], specialtiesMatched: [], portfolioMatches: [], roleAlignment: false };
      }
    }
  }

  let roleScore = 0;
  let skillScore = 0;
  let specialtyScore = 0;
  let portfolioScore = 0;
  let expScore = 0;

  let roleAlignment = false;
  let matchedRoleName: string | null = null;
  const skillsMatched: string[] = [];
  const specialtiesMatched: string[] = [];
  const portfolioMatches: string[] = [];

  // 1. Role match
  for (const r of creator.roles || []) {
    const rLower = r.toLowerCase().trim();
    if (rLower && def.roleAliases.some(a => rLower === a || (rLower.includes(a) && a.length >= 4))) {
      roleAlignment = true;
      matchedRoleName = r;
      roleScore = Math.max(roleScore, 40);
      break;
    }
  }

  // 2. Specialty match
  for (const s of creator.specialties || []) {
    const sLower = s.toLowerCase().trim();
    if (!sLower) continue;

    // Do NOT allow generic "designer" to match "sound designer", or "actor" to match "voice actor" when searching voice, etc.
    if (def.canonicalRole === 'Sound Designer' && (sLower === 'designer' || sLower === 'graphic designer' || sLower === 'ui/ux' || sLower === 'brand identity')) {
      continue;
    }

    if (def.primarySpecialties.some(sp => sLower === sp || sLower.includes(sp))) {
      specialtiesMatched.push(s);
      specialtyScore += 25;
      roleAlignment = true;
    }
  }
  specialtyScore = Math.min(specialtyScore, 35);

  // 3. Skills match
  for (const sk of creator.skills || []) {
    const skLower = sk.toLowerCase().trim();
    if (!skLower) continue;

    if (def.irrelevantSkills.some(irr => skLower.includes(irr))) {
      continue; // 0 points for irrelevant skills!
    }

    if (def.primarySkills.some(ps => skLower === ps || skLower.includes(ps) || ps.includes(skLower))) {
      skillsMatched.push(sk);
      skillScore += 20;
    } else if (def.secondarySkills.some(ss => skLower === ss || skLower.includes(ss) || ss.includes(skLower))) {
      skillsMatched.push(sk);
      skillScore += 10;
    }
  }
  skillScore = Math.min(skillScore, 30);

  // 4. Portfolio evidence
  for (const item of creator.portfolioSamples || []) {
    const tLower = (item.title || '').toLowerCase();
    const dLower = (item.description || '').toLowerCase();
    const combined = `${tLower} ${dLower}`;

    if (def.portfolioKeywords.some(pk => combined.includes(pk))) {
      portfolioMatches.push(item.title);
      portfolioScore += 20;
    }
  }
  portfolioScore = Math.min(portfolioScore, 25);

  // 5. Experience bonus ONLY if role evidence exists
  if (roleAlignment || skillsMatched.length > 0) {
    if (creator.experienceLevel) expScore += 5;
    if (bio && def.roleAliases.some(a => bio.includes(a))) expScore += 5;
  }

  // Calculate raw score
  let rawScore = roleScore + specialtyScore + skillScore + portfolioScore + expScore;

  // Has ANY role-specific evidence?
  const hasRoleEvidence = roleScore > 0 || specialtyScore > 0 || skillsMatched.length > 0 || portfolioMatches.length > 0;
  if (!hasRoleEvidence) {
    return { score: 0, reason: 'Limited role-specific evidence found.', skillsMatched: [], specialtiesMatched: [], portfolioMatches: [], roleAlignment: false };
  }

  // Apply Score Caps (Requirement 5)
  // - Strong role-specific evidence (role + skill or role + portfolio): can reach 70-85%
  // - Exact role + strong skills + relevant portfolio: can reach 85-98%
  // - Only role or only weak indirect evidence: cap at 50-65%
  let finalScore = rawScore;
  const isSuperComplete = (roleScore > 0 || specialtyScore > 0) && skillsMatched.length > 0 && portfolioMatches.length > 0;
  const isStrong = (roleScore > 0 && (skillsMatched.length > 0 || portfolioMatches.length > 0)) || (specialtyScore > 0 && (skillsMatched.length > 0 || portfolioMatches.length > 0));
  const isModerate = roleScore > 0 || specialtyScore > 0 || skillsMatched.length > 0;

  if (isSuperComplete) {
    finalScore = Math.min(98, Math.max(85, rawScore));
  } else if (isStrong) {
    finalScore = Math.min(85, Math.max(70, rawScore));
  } else if (isModerate) {
    finalScore = Math.min(65, Math.max(45, rawScore));
  } else {
    finalScore = Math.min(50, rawScore);
  }

  // Explainable reason (Requirement 6)
  const reasonParts: string[] = [];
  if (matchedRoleName) {
    reasonParts.push(`profile role = ${matchedRoleName}`);
  }
  if (specialtiesMatched.length > 0) {
    reasonParts.push(`specialty = ${specialtiesMatched.slice(0, 2).join(', ')}`);
  }
  if (skillsMatched.length > 0) {
    reasonParts.push(`skill = ${skillsMatched.slice(0, 2).join(', ')}`);
  }
  if (portfolioMatches.length > 0) {
    reasonParts.push(`portfolio = "${portfolioMatches[0]}"`);
  }

  const reason = reasonParts.length > 0 
    ? `Matched because ${reasonParts.join(', ')}.`
    : 'Limited role-specific evidence found.';

  return {
    score: finalScore,
    reason,
    skillsMatched,
    specialtiesMatched,
    portfolioMatches,
    roleAlignment
  };
}

async function run() {
  const { data: profiles } = await supabase.from('profiles').select('id, username, full_name, role, bio, experience_level');
  const ids = (profiles || []).map(p => p.id);
  const [
    { data: skillsData },
    { data: specData },
    { data: rolesData },
    { data: portData }
  ] = await Promise.all([
    supabase.from('creator_skills').select('creator_id, skills:skill_id(name)').in('creator_id', ids),
    supabase.from('creator_specialties').select('user_id, specialty').in('user_id', ids),
    supabase.from('creator_roles').select('creator_id, professional_roles:role_id(name)').in('creator_id', ids),
    supabase.from('portfolios').select('user_id, title, description').in('user_id', ids)
  ]);

  const creators = (profiles || []).map(p => ({
    id: p.id,
    username: p.username,
    fullName: p.full_name,
    role: p.role,
    bio: p.bio,
    experienceLevel: p.experience_level,
    skills: (skillsData || []).filter((r: any) => r.creator_id === p.id).map((r: any) => r.skills?.name).filter(Boolean),
    specialties: (specData || []).filter((r: any) => r.user_id === p.id).map((r: any) => r.specialty).filter(Boolean),
    roles: (rolesData || []).filter((r: any) => r.creator_id === p.id).map((r: any) => r.professional_roles?.name).filter(Boolean),
    portfolioSamples: (portData || []).filter((r: any) => r.user_id === p.id)
  }));

  const testRoles = ['Lead Actor', 'Lead Actress', 'Dancer', 'Lead Singer', 'Cinematographer', 'Video Editor', 'Sound Designer'];
  for (const tr of testRoles) {
    console.log(`\n=================== ${tr} ===================`);
    const scored = creators
      .map(c => ({ creator: c, ...scoreCreatorForRole(c, tr) }))
      .filter(c => c.score > 0)
      .sort((a, b) => b.score - a.score);

    console.log(`Found ${scored.length} matching candidates`);
    scored.slice(0, 5).forEach(s => {
      console.log(`- @${s.creator.username}: ${s.score}% | ${s.reason}`);
    });
  }
}

run().catch(console.error);
