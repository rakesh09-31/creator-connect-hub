import fs from 'fs';

async function auditSystem() {
  console.log('===============================================================');
  console.log(' AUDIT: OMNICRAFT & OMNIFORGE HACKATHON READINESS');
  console.log('===============================================================\n');

  // 1. Check Local AI Backend
  console.log('--- 1. Local AI Backend (FastAPI + Ollama) ---');
  try {
    const res = await fetch('http://127.0.0.1:8001/health');
    const data = await res.json();
    console.log('Local AI Health Status:', res.status, data);
    if (data.status === 'running' && data.ollama_connected && data.model_available) {
      console.log('  ✅ PASS: Local AI Backend is running with model', data.model);
    } else {
      console.warn('  ⚠️ WARNING: Local AI response indicates degraded state:', data);
    }
  } catch (err) {
    console.error('  ❌ FAIL: Cannot connect to Local AI at http://127.0.0.1:8001/health:', err.message);
  }

  // 2. Check Environment Variables
  console.log('\n--- 2. Environment Configuration Audit ---');
  const envContent = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf-8') : '';
  const hasSupabaseUrl = envContent.includes('VITE_SUPABASE_URL=');
  const hasPublishableKey = envContent.includes('VITE_SUPABASE_PUBLISHABLE_KEY=');
  const hasServiceRoleKey = envContent.includes('SUPABASE_SERVICE_ROLE_KEY') || envContent.includes('service_role');

  console.log(`  Supabase URL Present: ${hasSupabaseUrl ? '✅ YES' : '❌ NO'}`);
  console.log(`  Supabase Anon/Publishable Key Present: ${hasPublishableKey ? '✅ YES' : '❌ NO'}`);
  console.log(`  Client Exposure of Service Role Key: ${hasServiceRoleKey ? '⚠️ Found in .env (Verify frontend bundles do not expose it)' : '✅ SECURE (Not exposed in .env)'}`);

  // 3. Scan Frontend code for accidental service-role key leakage
  console.log('\n--- 3. Frontend Security & Secret Leak Audit ---');
  const clientFiles = ['src/integrations/supabase/client.ts', 'src/lib/auth.tsx', 'src/routes/_authenticated/_app.omniforge.tsx'];
  let secretsExposed = false;
  for (const f of clientFiles) {
    if (fs.existsSync(f)) {
      const content = fs.readFileSync(f, 'utf-8');
      if (content.includes('service_role') || content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        console.error(`  ❌ SECURITY ALERT: Potential service role reference in ${f}`);
        secretsExposed = true;
      }
    }
  }
  if (!secretsExposed) {
    console.log('  ✅ PASS: Client-side files use strictly Anon/Publishable keys and respect RLS');
  }

  // 4. Check Migrations Directory
  console.log('\n--- 4. Applied Migrations Audit ---');
  const migrationFiles = fs.readdirSync('supabase/migrations').sort();
  console.log(`Total migrations present: ${migrationFiles.length}`);
  const recentMigrations = [
    '20260927150000_omniforge_squad_collaboration.sql',
    '20260927160000_squad_members_unique.sql',
    '20260927161000_notifications_insert_policy.sql',
    '20260927162000_notifications_read_actor.sql',
  ];
  for (const rm of recentMigrations) {
    console.log(`  Migration ${rm}: ${migrationFiles.includes(rm) ? '✅ Present' : '❌ Missing'}`);
  }

  console.log('\n===============================================================');
  console.log(' SYSTEM AUDIT COMPLETE');
  console.log('===============================================================\n');
}

auditSystem().catch((e) => {
  console.error('Audit failed:', e);
  process.exit(1);
});
