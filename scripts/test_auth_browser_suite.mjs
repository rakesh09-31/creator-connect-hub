import { chromium } from 'playwright';

const BASE_URL = 'http://localhost:8081';

async function runTests() {
  console.log('==============================================');
  console.log('STARTING OMNICRAFT AUTHENTICATION TEST SUITE');
  console.log('==============================================\n');

  const testUser = {
    username: 'e2e_user_' + Date.now().toString().slice(-6),
    email: 'e2e_user_' + Date.now().toString().slice(-6) + '@example.com',
    phone: '9876543210',
    password: 'Password123!',
  };

  const browser = await chromium.launch({ headless: true });
  // Use persistent context storage state simulation
  const context = await browser.newContext();
  const page = await context.newPage();

  const consoleLogs = [];
  const networkErrors = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(`[CONSOLE ${msg.type()}] ${text}`);
    if (msg.type() === 'error') {
      console.log(`  [Browser Error]:`, text);
    }
  });

  page.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      networkErrors.push(`${res.status()} ${res.url()}`);
      console.log(`  [Network ${res.status()}]:`, res.url());
    }
  });

  try {
    // ----------------------------------------------------
    // TEST A: Sign up, complete onboarding, enter app, refresh
    // ----------------------------------------------------
    console.log('\n>>> TEST A: Signup -> Complete Onboarding -> Refresh App <<<');
    console.log(`Navigating to ${BASE_URL}/signup...`);
    await page.goto(`${BASE_URL}/signup`);
    await page.waitForLoadState('networkidle');

    console.log(`Filling signup form with ${testUser.email}...`);
    // Find inputs
    await page.fill('input[placeholder="choose a username"]', testUser.username);
    await page.fill('input[placeholder="you@email.com"]', testUser.email);
    await page.fill('input[placeholder="+1 (555) 000-0000"]', testUser.phone);
    await page.fill('input[placeholder="Create a password"]', testUser.password);
    await page.fill('input[placeholder="Confirm your password"]', testUser.password);

    console.log('Submitting signup...');
    await page.click('button[type="submit"]');

    // Wait for navigation to onboarding
    await page.waitForURL('**/onboarding/role', { timeout: 15000 });
    console.log('Successfully navigated to /onboarding/role');

    // Choose Creator role
    console.log('Selecting Creator role...');
    await page.click('button:has-text("CREATOR")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Continue")');

    // Wait for /onboarding/specialty
    await page.waitForURL('**/onboarding/specialty', { timeout: 15000 });
    console.log('Successfully navigated to /onboarding/specialty (Step 1)');

    // Step 1: Select a role
    await page.waitForSelector('text=What is your primary role?');
    const firstRole = page.locator('button').filter({ hasText: /Video Editor|Filmmaker|Actor|Photographer/i }).first();
    await firstRole.click();
    await page.waitForSelector('text=Selected Roles');
    console.log('Selected role confirmed. Continuing to Step 2...');
    await page.click('button:has-text("Continue")');

    // Step 2: Select a skill
    await page.waitForSelector('text=What are your skills?', { timeout: 10000 });
    console.log('Arrived at Step 2 (Skills)');
    await page.waitForTimeout(500);
    const firstSkill = page.locator('button').filter({ hasText: /Editing|Design|Acting|Directing|Content|Photoshop/i }).first();
    await firstSkill.click();
    await page.waitForTimeout(500);
    console.log('Selected skill. Continuing to Step 3...');
    await page.click('button:has-text("Continue")');

    // Step 3: Select a specialty
    await page.waitForSelector('text=What are your specialties?', { timeout: 10000 });
    console.log('Arrived at Step 3 (Specialties)');
    await page.waitForTimeout(500);
    const firstSpec = page.locator('button').filter({ hasText: /YouTube|Commercials|Short Form|Action|Documentary/i }).first();
    await firstSpec.click();
    await page.waitForTimeout(500);
    console.log('Selected specialty. Continuing to Step 4...');
    await page.click('button:has-text("Continue")');

    // Step 4: Finish setup
    await page.waitForSelector('text=Complete Profile', { timeout: 10000 });
    console.log('Arrived at Step 4. Clicking Complete Profile...');
    await page.click('button:has-text("Complete Profile")');

    // Wait for navigation to /home
    await page.waitForURL('**/home', { timeout: 20000 });
    console.log('Successfully arrived at /home! User is in the application.');

    // Check localStorage
    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    console.log('LocalStorage keys at /home:', storageKeys);
    const hasSupabaseToken = storageKeys.some(k => k.includes('-auth-token'));
    console.log('Supabase auth token present in storage:', hasSupabaseToken);

    // NOW REFRESH
    console.log('\nRefreshing page at /home (F5)...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const urlAfterRefresh = page.url();
    console.log('URL after refresh:', urlAfterRefresh);

    if (urlAfterRefresh.includes('/home')) {
      console.log('✅ TEST A PASSED: User remained authenticated on /home after refresh!');
    } else {
      throw new Error(`TEST A FAILED: Redirected away to ${urlAfterRefresh}`);
    }

    // Save storage state for Test B
    const storageState = await context.storageState();

    // ----------------------------------------------------
    // TEST B: Close browser, reopen with stored session, visit /
    // ----------------------------------------------------
    console.log('\n>>> TEST B: Reopen browser and visit http://localhost:8081/ <<<');
    await context.close();

    const contextB = await browser.newContext({ storageState });
    const pageB = await contextB.newPage();
    pageB.on('console', msg => console.log('  [pageB Console]:', msg.text()));

    console.log(`Opening root URL ${BASE_URL}/ in new browser session...`);
    await pageB.goto(`${BASE_URL}/`);

    // Check localStorage in new session
    const storageB = await pageB.evaluate(() => Object.keys(localStorage));
    console.log('pageB localStorage keys:', storageB);

    // Wait for splash screen to redirect to /home
    console.log('Waiting for splash/root redirection to /home...');
    await pageB.waitForURL('**/home', { timeout: 15000 });

    const urlB = pageB.url();
    console.log('Destination URL after reopening at root /:', urlB);

    if (urlB.includes('/home')) {
      console.log('✅ TEST B PASSED: Existing authenticated session restored and routed directly to /home!');
    } else {
      throw new Error(`TEST B FAILED: Expected /home but got ${urlB}`);
    }

    // ----------------------------------------------------
    // TEST C: Sign out -> open OmniCraft -> verify login/signup
    // ----------------------------------------------------
    console.log('\n>>> TEST C: Sign out -> visit app -> verify login flow <<<');
    // Click Sign out button
    const signOutBtn = pageB.locator('button[title="Sign out"]');
    if (await signOutBtn.isVisible()) {
      console.log('Clicking Sign Out button...');
      await signOutBtn.click();
    } else {
      console.log('Navigating to sign out directly via page evaluation...');
      await pageB.evaluate(async () => {
        const sb = window.__supabase;
        if (sb) await sb.auth.signOut();
      });
      await pageB.goto(`${BASE_URL}/login`);
    }

    await pageB.waitForURL('**/login', { timeout: 10000 });
    console.log('Signed out. Arrived at /login.');

    // Now visit root URL / again
    console.log('Visiting root / while signed out...');
    await pageB.goto(`${BASE_URL}/`);
    await pageB.waitForURL('**/login', { timeout: 10000 });

    const urlAfterSignOut = pageB.url();
    console.log('Destination URL after visiting / while signed out:', urlAfterSignOut);

    if (urlAfterSignOut.includes('/login')) {
      console.log('✅ TEST C PASSED: Unauthenticated user sees login/signup flow!');
    } else {
      throw new Error(`TEST C FAILED: Expected /login or /splash, but got ${urlAfterSignOut}`);
    }

    // ----------------------------------------------------
    // TEST D: Login with existing account -> refresh -> stay logged in
    // ----------------------------------------------------
    console.log('\n>>> TEST D: Login with existing account -> refresh -> remain logged in <<<');
    await pageB.goto(`${BASE_URL}/login`);
    await pageB.waitForLoadState('networkidle');

    console.log(`Logging in with created account: ${testUser.email}...`);
    await pageB.fill('input[type="email"]', testUser.email);
    await pageB.fill('input[type="password"]', testUser.password);
    await pageB.click('button[type="submit"]');

    await pageB.waitForURL('**/home', { timeout: 15000 });
    console.log('Successfully logged in to /home!');

    console.log('Refreshing page (reload)...');
    await pageB.reload({ waitUntil: 'networkidle' });
    await pageB.waitForTimeout(2000);

    const urlDAfterRefresh = pageB.url();
    console.log('URL after refresh:', urlDAfterRefresh);

    if (urlDAfterRefresh.includes('/home')) {
      console.log('✅ TEST D PASSED: User remains logged in after refresh!');
    } else {
      throw new Error(`TEST D FAILED: Redirected away to ${urlDAfterRefresh}`);
    }

    console.log('\n==============================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! (TESTS A, B, C, D)');
    console.log('==============================================');

  } catch (err) {
    console.error('\n❌ TEST RUN ERROR:', err);
    console.log('\nLast URL:', page.url());
  } finally {
    await browser.close();
  }
}

runTests();
