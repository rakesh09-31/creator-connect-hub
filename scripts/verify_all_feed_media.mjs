import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const debuggingPort = 9225;
const tempUserDataDir = path.join(process.cwd(), 'temp_edge_verify_' + Date.now());

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function runComprehensiveTest() {
  console.log('===========================================================');
  console.log('      STARTING COMPREHENSIVE FEED MEDIA CDP VERIFICATION   ');
  console.log('===========================================================\n');

  const edgeProcess = spawn(edgePath, [
    '--headless=new',
    `--remote-debugging-port=${debuggingPort}`,
    '--user-data-dir=' + tempUserDataDir,
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ], { stdio: 'ignore' });

  for (let i = 0; i < 20; i++) {
    await sleep(500);
    try {
      const res = await fetch(`http://127.0.0.1:${debuggingPort}/json/version`);
      if (res.ok) break;
    } catch (e) {}
  }

  const listRes = await fetch(`http://127.0.0.1:${debuggingPort}/json/list`);
  const targets = await listRes.json();
  const pageTarget = targets.find((t) => t.type === 'page');
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let msgId = 1;
  const pending = new Map();
  const consoleErrors = [];
  const networkErrors = [];

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.method === 'Console.messageAdded') {
        const msg = data.params?.message;
        if (msg?.level === 'error') {
          console.log('  [BROWSER ERROR]:', msg.text);
          consoleErrors.push(msg.text);
        }
      }
      if (data.method === 'Network.responseReceived') {
        const { response } = data.params;
        if (response.status >= 400) {
          console.log(`  [HTTP ${response.status}]: ${response.url}`);
          networkErrors.push({ url: response.url, status: response.status });
        }
      }
      if (data.id && pending.has(data.id)) {
        const resolve = pending.get(data.id);
        pending.delete(data.id);
        resolve(data.result || data.error);
      }
    } catch (e) {}
  };

  await new Promise((r) => { ws.onopen = r; });

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = msgId++;
      pending.set(id, (res) => {
        if (res && res.code) reject(new Error(res.message));
        else resolve(res);
      });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async function evaluate(expression) {
    const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    return res?.result?.value;
  }

  async function captureScreenshot(fileName) {
    const res = await send('Page.captureScreenshot', { format: 'png' });
    if (res?.data) {
      const filePath = path.join('C:\\Users\\rakes\\.gemini\\antigravity-ide\\brain\\32f0aeec-3399-43d5-b03c-e3c0722224bc', fileName);
      fs.writeFileSync(filePath, Buffer.from(res.data, 'base64'));
      console.log(`Saved screenshot: ${fileName}`);
    }
  }

  await send('Page.enable');
  await send('DOM.enable');
  await send('Runtime.enable');
  await send('Console.enable');
  await send('Network.enable');

  // STEP 1: Login
  console.log('1. Navigating to Login...');
  await send('Page.navigate', { url: 'http://localhost:8081/login' });
  await sleep(2500);

  await evaluate(`
    (() => {
      const setVal = (input, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const inputs = Array.from(document.querySelectorAll('input'));
      const emailInput = inputs.find(i => i.type === 'email');
      const passInput = inputs.find(i => i.type === 'password');
      if (emailInput) setVal(emailInput, 'creator_1789410388281@testomnicraft.dev');
      if (passInput) setVal(passInput, 'TestPassword123!#');
    })()
  `);
  await sleep(500);

  await evaluate(`
    (() => {
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    })()
  `);

  console.log('2. Waiting for /home...');
  for (let s = 1; s <= 12; s++) {
    await sleep(1000);
    const atHome = await evaluate(`window.location.href.includes('/home')`);
    if (atHome) {
      console.log(`   Navigated to /home at second ${s}`);
      break;
    }
  }

  await sleep(4000);
  await captureScreenshot('feed_initial_load.png');

  // STEP 2: Inspect feed posts
  console.log('\n3. Inspecting Feed posts...');
  const feedReport = await evaluate(`
    (() => {
      const articles = Array.from(document.querySelectorAll('article'));
      return articles.map((art, idx) => {
        const text = art.innerText.slice(0, 60).replace(/\\n/g, ' ');
        const img = art.querySelector('img:not([alt*="avatar"])');
        const video = art.querySelector('video');
        const fallback = art.innerText.includes('Media unavailable');
        const pulse = art.querySelector('div[class*="animate-pulse"]');
        return {
          idx,
          text,
          hasImg: !!img,
          imgSrc: img ? img.src.slice(0, 80) : null,
          imgComplete: img ? (img.complete && img.naturalWidth > 0) : null,
          hasVideo: !!video,
          hasFallback: fallback,
          isPulsing: !!pulse
        };
      });
    })()
  `);

  console.log(`Total feed posts rendered: ${feedReport?.length}`);
  const loadedImgs = feedReport?.filter(r => r.hasImg && r.imgComplete);
  const fallbackPosts = feedReport?.filter(r => r.hasFallback);
  const pulsingPosts = feedReport?.filter(r => r.isPulsing);
  const brokenImgs = feedReport?.filter(r => r.hasImg && !r.imgComplete);

  console.log(`  ✓ Successfully loaded post images: ${loadedImgs?.length}`);
  console.log(`  ✓ Clean fallback cards shown: ${fallbackPosts?.length}`);
  console.log(`  ✓ Infinite pulse placeholders remaining: ${pulsingPosts?.length}`);
  console.log(`  ✓ Broken images: ${brokenImgs?.length}`);

  // STEP 3: Test Uploading a New Post with Image
  console.log('\n4. Testing New Post Upload via /create...');
  await send('Page.navigate', { url: 'http://localhost:8081/create' });
  await sleep(3000);

  const testCaption = `Omnicraft Verified Live Post ${Date.now()}`;
  await evaluate(`
    (() => {
      const ta = document.querySelector('textarea');
      if (ta) {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        setter.call(ta, ${JSON.stringify(testCaption)});
        ta.dispatchEvent(new Event('input', { bubbles: true }));
      }
    })()
  `);
  await sleep(500);

  // Set file on input[type="file"] via CDP DOM and DOM.setFileInputFiles
  const doc = await send('DOM.getDocument');
  const fileInputNode = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: 'input[type="file"]' });
  
  if (fileInputNode?.nodeId) {
    const testImgPath = path.join(process.cwd(), 'scripts', 'test_verified_post.png');
    // Valid 2x2 png
    const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mNk+M9QzwAEjAwMDAwAAt4C/dVvW2gAAAAASUVORK5CYII=';
    fs.writeFileSync(testImgPath, Buffer.from(pngBase64, 'base64'));

    await send('DOM.setFileInputFiles', {
      files: [testImgPath],
      nodeId: fileInputNode.nodeId
    });
    console.log('   File attached to file input.');
    await sleep(1500);

    // Click Publish / Share button
    await evaluate(`
      (() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const pub = btns.find(b => b.innerText.includes('Share') || b.innerText.includes('Post') || b.innerText.includes('Publish'));
        if (pub) pub.click();
      })()
    `);
    console.log('   Publish button clicked.');

    // Wait for redirect to /home
    for (let s = 1; s <= 15; s++) {
      await sleep(1000);
      const atHome = await evaluate(`window.location.href.includes('/home')`);
      if (atHome) {
        console.log(`   Navigated back to /home at second ${s}`);
        break;
      }
    }

    try { fs.unlinkSync(testImgPath); } catch {}
  }

  await sleep(4000);
  await captureScreenshot('feed_with_new_post.png');

    // Scroll the new post into view and wait for it to load
    await evaluate(`
      (() => {
        const articles = Array.from(document.querySelectorAll('article'));
        const found = articles.find(a => a.innerText.includes(${JSON.stringify(testCaption)}));
        if (found) found.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()
    `);
    await sleep(2500);

    // Verify new post in feed
    const newPostVerification = await evaluate(`
      (() => {
        const articles = Array.from(document.querySelectorAll('article'));
        const found = articles.find(a => a.innerText.includes(${JSON.stringify(testCaption)}));
        if (!found) return { found: false };
        const img = found.querySelector('img:not([alt*="avatar"])');
        return {
          found: true,
          hasImg: !!img,
          src: img ? img.src.slice(0, 100) : null,
          loaded: img ? (img.complete && img.naturalWidth > 0) : false
        };
      })()
    `);
    console.log('   Newly uploaded post check:', newPostVerification);

    // STEP 4: Refresh Feed
    console.log('\n5. Refreshing Feed...');
    await send('Page.reload');
    await sleep(4000);

    await evaluate(`
      (() => {
        const articles = Array.from(document.querySelectorAll('article'));
        const found = articles.find(a => a.innerText.includes(${JSON.stringify(testCaption)}));
        if (found) found.scrollIntoView({ behavior: 'instant', block: 'center' });
      })()
    `);
    await sleep(2500);
    await captureScreenshot('feed_after_refresh.png');

    const refreshedVerification = await evaluate(`
      (() => {
        const articles = Array.from(document.querySelectorAll('article'));
        const found = articles.find(a => a.innerText.includes(${JSON.stringify(testCaption)}));
        if (!found) return { found: false };
        const img = found.querySelector('img:not([alt*="avatar"])');
        return {
          found: true,
          loaded: img ? (img.complete && img.naturalWidth > 0) : false
        };
      })()
    `);
    console.log('   Refreshed post check:', refreshedVerification);

  // STEP 5: Logout & Login
  console.log('\n6. Testing Logout & Re-login...');
  await send('Page.navigate', { url: 'http://localhost:8081/settings' });
  await sleep(2500);

  await evaluate(`
    (() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const logoutBtn = btns.find(b => b.innerText.includes('Log Out') || b.innerText.includes('Logout'));
      if (logoutBtn) logoutBtn.click();
    })()
  `);
  await sleep(2500);

  console.log('   Logging back in...');
  await evaluate(`
    (() => {
      const setVal = (input, val) => {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, val);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      };
      const inputs = Array.from(document.querySelectorAll('input'));
      const emailInput = inputs.find(i => i.type === 'email');
      const passInput = inputs.find(i => i.type === 'password');
      if (emailInput) setVal(emailInput, 'creator_1789410388281@testomnicraft.dev');
      if (passInput) setVal(passInput, 'TestPassword123!#');
      const submitBtn = document.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.click();
    })()
  `);

  for (let s = 1; s <= 12; s++) {
    await sleep(1000);
    const atHome = await evaluate(`window.location.href.includes('/home')`);
    if (atHome) {
      console.log(`   Back at /home at second ${s}`);
      break;
    }
  }

  await sleep(4000);
  await captureScreenshot('feed_after_relogin.png');

  // STEP 6: Check for 403 / 404 or [object Object] errors
  console.log('\n7. Auditing Network & Console errors...');
  const stories403 = networkErrors.filter(e => e.status === 403 && e.url.includes('stories'));
  const objectObjectErrors = consoleErrors.filter(e => e.includes('[object Object]'));
  const storage400Errors = networkErrors.filter(e => e.url.includes('/storage/v1/object/public/'));

  console.log(`   Stories 403 RLS errors: ${stories403.length} (Expected: 0)`);
  console.log(`   [object Object] errors: ${objectObjectErrors.length} (Expected: 0)`);
  console.log(`   Storage 400 NoSuchBucket/Unauthorized: ${storage400Errors.length} (Expected: 0)`);

  ws.close();
  edgeProcess.kill();

  console.log('\n===========================================================');
  console.log('                 VERIFICATION SUMMARY                       ');
  console.log('===========================================================');
  console.log(`Old & new post images loaded: ${loadedImgs?.length > 0}`);
  console.log(`Clean fallbacks displayed: ${fallbackPosts?.length > 0}`);
  console.log(`Zero stuck pulse placeholders: ${pulsingPosts?.length === 0}`);
  console.log(`Newly uploaded image appeared: ${newPostVerification?.loaded}`);
  console.log(`Refresh feed persisted: ${refreshedVerification?.loaded}`);
  console.log(`Stories 403 eliminated: ${stories403.length === 0}`);
  console.log('===========================================================\n');
}

runComprehensiveTest().catch(err => {
  console.error('Error during test:', err);
  process.exit(1);
});
