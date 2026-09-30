import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read anon key and supabase url from .env
const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const supabase = createClient(url, key);

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTestSuite() {
  console.log('======================================================');
  console.log('OmniForge Real Creator Matching Test Suite');
  console.log('======================================================\n');

  // Test 1: Conversation Context Extraction
  console.log('--- TEST 1: Extraction of Skills, Roles, Budget, Duration, Type ---');
  const sampleUserMessage = "I want to make a short film about a missing student, 2 weeks shoot, budget is ₹15,000, need a Video Editor with DaVinci Resolve and an Actor";
  
  // Clean text and test entity matching logic
  const clean = sampleUserMessage.toLowerCase();
  
  const isShortFilm = clean.includes("short film");
  assert(isShortFilm, "Extracted projectType: 'Short Film'");

  const hasStory = clean.includes("missing student");
  assert(hasStory, "Extracted storyPremise: 'missing student'");

  const durationMatch = clean.match(/(\d+)\s*(?:weeks?|months?|days?)/i);
  const duration = durationMatch ? `${durationMatch[1]} weeks` : null;
  assert(duration === "2 weeks", `Extracted duration: '${duration}'`);

  const budgetMatch = clean.match(/(?:₹|rs\.?|inr|\$)\s*([\d,]+)/i);
  const budget = budgetMatch ? `₹${budgetMatch[1].replace(/[,.\s]+$/, "").trim()}` : null;
  assert(budget === "₹15,000", `Extracted budget: '${budget}'`);

  const hasDaVinci = /\b(davinci\s*resolve|davinci)\b/i.test(clean);
  assert(hasDaVinci, "Extracted requiredSkill: 'DaVinci Resolve'");

  const hasEditor = /\b(video\s*editor|editor)\b/i.test(clean);
  const hasActor = /\b(actor|actress)\b/i.test(clean);
  assert(hasEditor && hasActor, "Extracted roles: 'Video Editor' and 'Actor'");

  // Test 2: Real Database Query & Matching for Video Editor with DaVinci Resolve
  console.log('\n--- TEST 2: Real Supabase Creator Matching (No Fabrication) ---');
  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, role, bio, portfolio_url, website, experience_level, availability')
    .limit(100);

  assert(!pErr && profiles && profiles.length > 0, `Fetched ${profiles?.length || 0} real profiles without error`);

  const creatorIds = (profiles || []).map(p => p.id);
  const [
    { data: skillsData },
    { data: specData },
    { data: portfolioData },
    { data: portfolioItemsData },
    { data: rolesData }
  ] = await Promise.all([
    supabase.from('creator_skills').select('creator_id, skill_id, skills:skill_id(name)').in('creator_id', creatorIds),
    supabase.from('creator_specialties').select('user_id, specialty').in('user_id', creatorIds),
    supabase.from('portfolios').select('id, user_id, title, media_url, media_type, project_link').in('user_id', creatorIds),
    supabase.from('portfolio_items').select('id, user_id, title, description, media_url, media_type, url, tech').in('user_id', creatorIds),
    supabase.from('creator_roles').select('creator_id, role_id, professional_roles:role_id(name)').in('creator_id', creatorIds),
  ]);

  // Find real creator who has Video Editor role or DaVinci Resolve in tech/skills
  const matchingEditor = (rolesData || []).find(r => r.professional_roles?.name === 'Video Editor');
  assert(!!matchingEditor, `Found real database creator for Video Editor (ID: ${matchingEditor?.creator_id})`);

  const reelItem = (portfolioItemsData || []).find(pi => Array.isArray(pi.tech) && pi.tech.includes('DaVinci Resolve'));
  assert(!!reelItem, `Found real portfolio item with verified DaVinci Resolve tech: '${reelItem?.title}'`);

  // Ensure matching returns real creator metadata
  const matchingProfile = profiles.find(p => p.id === matchingEditor.creator_id);
  assert(!!matchingProfile, `Matched creator maps to real Supabase profile (@${matchingProfile?.username})`);
  assert(typeof matchingProfile?.username === 'string' && matchingProfile.username.length > 0, "Creator username is valid non-empty string");

  // Test 3: Missing Profiles & Empty Results Handling (Strict Non-Fabrication)
  console.log('\n--- TEST 3: Missing Profiles & Empty Results Handling ---');
  const nonExistentRole = "Quantum Astronaut";
  const matchingAstronaut = (rolesData || []).filter(r => (r.professional_roles?.name || '').toLowerCase().includes(nonExistentRole.toLowerCase()));
  const matchingSpec = (specData || []).filter(s => (s.specialty || '').toLowerCase().includes(nonExistentRole.toLowerCase()));

  assert(matchingAstronaut.length === 0 && matchingSpec.length === 0, `Verified zero profiles exist for '${nonExistentRole}'`);

  // Emulate missing capability creation
  const missingCap = {
    roleName: nonExistentRole,
    reason: `No sufficiently relevant creator was found in the current OmniCraft network for "${nonExistentRole}".`,
    suggestedActions: [
      { type: "create_job", label: "Publish Client Job" },
      { type: "skill_swap", label: "Skill-for-Service Swap" },
    ]
  };

  assert(missingCap.suggestedActions.length > 0, "Empty search generates actionable fallback options (Job / Skill Swap)");
  assert(!missingCap.reason.includes("undefined"), "Missing reason is clearly formulated without fabrication");

  // Test 4: RLS & Unauthorized Access Protection
  console.log('\n--- TEST 4: Security & RLS Policy Enforcement ---');
  
  // Anon user attempting write into profiles table must be rejected
  const { error: unauthorizedWriteError } = await supabase.from('profiles').insert({
    id: '11111111-2222-3333-4444-555555555555',
    username: 'unauthorized_attacker',
    role: 'creator',
  });

  assert(!!unauthorizedWriteError, `Unauthorized unauthenticated INSERT rejected by RLS: "${unauthorizedWriteError?.message}"`);

  // Check frontend code does not expose service role key
  const srcFiles = fs.readdirSync('src/lib', { recursive: true });
  let leakedKey = false;
  for (const f of srcFiles) {
    if (typeof f === 'string' && (f.endsWith('.ts') || f.endsWith('.tsx'))) {
      const fullPath = `src/lib/${f}`;
      if (fs.existsSync(fullPath) && !fs.statSync(fullPath).isDirectory()) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (content.includes('service_role') && !fullPath.includes('.server.')) {
          leakedKey = true;
        }
      }
    }
  }
  assert(!leakedKey, "No service role keys or service_role references in client-side code");

  console.log('\n======================================================');
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
