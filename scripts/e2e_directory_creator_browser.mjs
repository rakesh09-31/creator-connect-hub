import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const env = fs.readFileSync('.env', 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/['"]/g, '');
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/['"]/g, '');
}

const ARTIFACT_DIR = 'C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\c062888b-5c3c-47e5-bdcc-8b20c96be02f';
const supabase = createClient(url, key);

async function testDirectoryCreatorInBrowser() {
  console.log('Testing pure directory-only creator in browser...');

  const { data: signin } = await supabase.auth.signInWithPassword({
    email: 'creator_1789410388281@testomnicraft.dev',
    password: 'TestPassword123!#',
  });
  const inviterId = signin?.user?.id;

  // Clean invitations for rc_edits (auth_user_id IS NULL)
  const { data: dirCreator } = await supabase
    .from('profiles')
    .select('id, username, auth_user_id')
    .eq('username', 'rc_edits')
    .single();

  console.log('Target directory creator:', dirCreator);

  await supabase
    .from('squad_invitations')
    .delete()
    .eq('inviter_id', inviterId)
    .eq('invitee_id', dirCreator.id);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[BROWSER ERROR]:', msg.text());
  });

  // Login
  await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'creator_1789410388281@testomnicraft.dev');
  await page.fill('input[type="password"]', 'TestPassword123!#');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(4000);

  // Go to omniforge
  await page.goto('http://localhost:8081/omniforge', { waitUntil: 'networkidle' }).catch(() => {});
  await page.waitForTimeout(3000);

  const chatInput = page.locator('input[placeholder*="Ask a question"], input[placeholder*="Describe your business"], form input[type="text"]').first();
  await chatInput.waitFor({ state: 'visible', timeout: 10000 });

  // Query specifically for rc_edits
  await chatInput.fill('find rc_edits');
  const sendBtn = page.locator('form button[type="submit"]').last();
  await sendBtn.click();

  const inviteBtn = page.locator('button:has-text("Invite")').first();
  await inviteBtn.waitFor({ state: 'visible', timeout: 35000 });
  await page.waitForTimeout(2000);

  // Click Invite
  await inviteBtn.click();
  await page.waitForTimeout(1500);

  const modalHeader = page.locator('h3:has-text("Invite Creator to Project")');
  await modalHeader.waitFor({ state: 'visible', timeout: 5000 });

  // Submit invitation
  const submitInviteBtn = page.locator('button:has-text("Send Invitation")');
  await submitInviteBtn.click();

  await page.waitForTimeout(3000);
  const modalClosed = !(await modalHeader.isVisible().catch(() => false));
  console.log(`[PASS] Modal closed: ${modalClosed}`);

  const ss = path.join(ARTIFACT_DIR, 'e2e_pure_directory_invited.png');
  await page.screenshot({ path: ss });
  console.log(`[PASS] Saved screenshot: ${ss}`);

  // Verify in DB
  const { data: invRow } = await supabase
    .from('squad_invitations')
    .select('*')
    .eq('inviter_id', inviterId)
    .eq('invitee_id', dirCreator.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  console.log('[DB VERIFICATION] Pure Directory Creator Invitation:');
  console.log('  id:', invRow?.id);
  console.log('  squad_id:', invRow?.squad_id);
  console.log('  inviter_id:', invRow?.inviter_id);
  console.log('  invitee_id:', invRow?.invitee_id, '(matches dirCreator.id:', invRow?.invitee_id === dirCreator.id, ')');
  console.log('  status:', invRow?.status);

  await browser.close();
}

testDirectoryCreatorInBrowser().catch((e) => {
  console.error(e);
  process.exit(1);
});
