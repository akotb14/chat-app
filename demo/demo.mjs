/**
 * ChatApp — scripted screen demo.
 *
 * Drives the real app through a fixed timeline while you record the screen
 * with OBS. Deterministic, repeatable, and re-runnable after a UI change.
 *
 *   1. cd server && npm start          (port 5000)
 *   2. cd client && npm start          (port 3000)
 *   3. cd demo   && npm run prepare-data
 *   4. Start the OBS recording
 *   5. cd demo   && npm run demo
 *
 * Timeline (~75s at PACE=1):
 *   1  Hero        mesh backdrop, word reveal, card tilt + spotlight
 *   2  Auth        register, or log in if the account already exists
 *   3  Empty state
 *   4  Sidebar     search, hover, open a conversation
 *   5  Thread      history loads, send a message
 *   6  Split       two windows, live delivery over WebSocket
 *   7  Responsive  collapse to the mobile layout
 *   8  Outro       sign out, land back on the hero
 */

import { chromium } from "playwright";
import { makeApi } from "./lib/api.mjs";
import { ensureAvatar } from "./lib/avatars.mjs";
import { CURSOR_SCRIPT, CAPTION_SCRIPT } from "./lib/cursor.mjs";
import {
  beat,
  caption,
  click,
  glide,
  hover,
  resizeTo,
  setWindowBounds,
  sleep,
  sweep,
  typeHuman,
} from "./lib/motion.mjs";
import {
  APP,
  CAPTIONS,
  HEADLESS,
  HISTORY,
  LIVE_EXCHANGE,
  MAIN_USER,
  PARTNER_USER,
  PACE,
  SCREEN,
  SPLIT_SCALE,
} from "./config.mjs";

/** The app's `md` breakpoint. Above it the sidebar and thread sit side by side. */
const MD = 768;

/**
 * Window geometry is in device-independent pixels, NOT physical screen pixels:
 * `Browser.setWindowBounds` takes DIP, and with --force-device-scale-factor=S a
 * window of W DIP occupies W×S physical pixels while reporting a CSS viewport of
 * roughly W. So the whole screen is SCREEN / SPLIT_SCALE in DIP, and a
 * scale below 1 is what lets a physically-half-width window still report a CSS
 * viewport above `md`. Windows' frame eats ~16px, so innerWidth lands a little
 * under the width set here.
 */
const DIP = {
  width: Math.round(SCREEN.width / SPLIT_SCALE),
  height: Math.round(SCREEN.height / SPLIT_SCALE),
};

const HALF = Math.floor(DIP.width / 2);

const SOLO = {
  width: Math.round(DIP.width * 0.73),
  height: Math.round(DIP.height * 0.93),
};
SOLO.left = Math.round((DIP.width - SOLO.width) / 2);
SOLO.top = Math.round((DIP.height - SOLO.height) / 2);

const LEFT = { left: 0, top: 0, width: HALF, height: DIP.height };
const RIGHT = { left: HALF, top: 0, width: DIP.width - HALF, height: DIP.height };

// Chromium refuses to make a window much narrower than ~500 DIP on Windows, so
// this is about as phone-like as a real browser window gets. Still far below md.
const PHONE = {
  width: 520,
  height: Math.round(DIP.height * 0.95),
};
PHONE.left = Math.round((DIP.width - PHONE.width) / 2);
PHONE.top = Math.round((DIP.height - PHONE.height) / 2);

const log = (scene, msg) => console.log(`  ${scene} │ ${msg}`);

/** Chromium only honours --force-device-scale-factor at launch, so both
 *  windows share one value chosen to keep the split-screen halves above `md`. */
async function launch() {
  return chromium.launch({
    headless: HEADLESS,
    args: [
      `--force-device-scale-factor=${SPLIT_SCALE}`,
      "--hide-crash-restore-bubble",
      "--disable-session-crashed-bubble",
      "--disable-infobars",
      "--no-default-browser-check",
      "--no-first-run",
      "--disable-features=Translate,MediaRouter,AutofillServerCommunication",
    ],
  });
}

async function newWindow(browser, bounds) {
  const context = await browser.newContext({
    viewport: null, // the real OS window drives the viewport
    colorScheme: "dark",
  });
  await context.addInitScript(CURSOR_SCRIPT);
  await context.addInitScript(CAPTION_SCRIPT);
  const page = await context.newPage();
  await setWindowBounds(page, bounds);
  return { context, page };
}

/** CSS-pixel viewport width — what the Tailwind breakpoints actually see. */
const viewportWidth = (page) => page.evaluate(() => window.innerWidth);

const signedInUser = (page) =>
  page.evaluate(() => {
    const raw = localStorage.getItem("chat-app-current-user");
    return raw ? JSON.parse(raw) : null;
  });

/** Seeds a session so the second window does not spend 15s on a login we have
 *  already shown once. Applies on the next navigation. */
const injectSession = (page, user) =>
  page.addInitScript((u) => {
    localStorage.setItem("chat-app-current-user", JSON.stringify(u));
  }, user);

const say = async (page, text) => {
  if (CAPTIONS) await caption(page, text);
};

const bubbleCount = (page) =>
  page.locator(".animate-bubble-in").count();

/**
 * Picks the profile photo through the real file dialog.
 *
 * The picker button calls `fileInput.current.click()`, which would open a
 * blocking OS dialog that no script can dismiss. Playwright intercepts it
 * instead — so the photo appearing in the preview is a genuine on-camera beat,
 * not a hidden API call. The listener has to be armed before the click lands.
 */
async function pickPhoto(page, filePath) {
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 10000 }),
    click(page, 'button[aria-label="Choose profile photo"]'),
  ]);
  await chooser.setFiles(filePath);
  await page.waitForSelector('img[alt="Selected avatar preview"]', { timeout: 5000 });
}

/** Waits for one more bubble than `before` to be on screen. */
async function waitForDelivery(page, before, label) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if ((await bubbleCount(page)) > before) return true;
    await sleep(120);
  }
  log(6, `⚠ "${label}" never arrived on the receiving side`);
  return false;
}

// ───────────────────────────────────────────────────────────── preflight ────

const api = await makeApi();

if (!(await api.isUp())) {
  console.error(`\n  ✗ No API server on ${APP.server}\n\n    cd server && npm start\n`);
  process.exit(1);
}

let partner;
try {
  partner = await api.ensureUser(PARTNER_USER);
} catch (err) {
  console.error(`\n  ✗ ${err.message}\n\n    Try: npm run prepare-data\n`);
  process.exit(1);
}

// Cached ahead of the take so the registration scene never waits on the network.
// A missing photo is cosmetic: the scene just skips that beat.
const mainAvatar = await ensureAvatar(MAIN_USER).catch((err) => {
  console.warn(`  ! avatar for ${MAIN_USER.username}: ${err.message}`);
  return null;
});

console.log(`
  ChatApp demo
  ────────────────────────────────────────────
  client    ${APP.client}
  server    ${APP.server}
  pace      ${PACE}×
  scale     ${SPLIT_SCALE}  →  screen ${DIP.width}×${DIP.height} DIP, split half ${HALF} (md needs ≥${MD})
  on camera ${MAIN_USER.username}  ↔  ${PARTNER_USER.username}

  Start the OBS recording — the browser opens in 4 seconds.
`);
await sleep(4000);

const browser = await launch();
const A = await newWindow(browser, SOLO);
const page = A.page;

let exitCode = 0;
try {
  // ─────────────────────────────────────────────── scene 1 — the hero ───────

  log(1, "Hero");
  const res = await page.goto(`${APP.client}/login`, {
    waitUntil: "networkidle",
    timeout: 30000,
  });
  if (!res || !res.ok()) {
    throw new Error(`Client dev server not answering on ${APP.client} — cd client && npm start`);
  }

  log(1, `viewport ${await viewportWidth(page)}px CSS`);
  await beat(2400); // let the word-by-word headline finish arriving

  await glide(page, SOLO.width * 0.3, SOLO.height * 0.55, { duration: 900 });
  await beat(500);
  await sweep(page, ".aurora-border", { loops: 1, duration: 2200 });
  await beat(600);

  // ───────────────────────────────────────── scene 2 — authentication ───────

  const already = await api.login(MAIN_USER);

  if (already.status) {
    log(2, `Login — "${MAIN_USER.username}" already exists`);
    await say(page, "Sign in — bcrypt-hashed credentials");
    await typeHuman(page, "#login-username", MAIN_USER.username);
    await beat(260);
    await typeHuman(page, "#login-password", MAIN_USER.password);
    await beat(400);
    await say(page, null);
    await hover(page, 'button[type="submit"]');
    await beat(480);
    await click(page, 'button[type="submit"]');
  } else {
    log(2, `Register — creating "${MAIN_USER.username}"`);
    await click(page, 'a[href="/register"]');
    await page.waitForURL("**/register");
    await beat(1400);

    if (mainAvatar) {
      await say(page, "Pick a profile photo");
      await pickPhoto(page, mainAvatar);
      await beat(1100);
    }

    await say(page, "Validated sign-up — live password strength");
    await typeHuman(page, "#reg-username", MAIN_USER.username);
    await beat(200);
    await typeHuman(page, "#reg-email", MAIN_USER.email);
    await beat(200);
    // Deliberately slow: the strength meter filling up is the shot.
    await typeHuman(page, "#reg-password", MAIN_USER.password, { cps: 9 });
    await beat(650);
    await typeHuman(page, "#reg-confirm", MAIN_USER.password, { cps: 13 });
    await beat(550);
    await say(page, null);
    await hover(page, 'button[type="submit"]');
    await beat(480);
    await click(page, 'button[type="submit"]');
  }

  await page.waitForURL(`${APP.client}/`, { timeout: 20000 });
  await page.waitForLoadState("networkidle");

  const me = await signedInUser(page);
  if (!me) throw new Error("Sign-in completed but localStorage has no user");
  log(2, `signed in as ${me.username} (${me._id})`);

  // ───────────────────────────────────────── scene 3 — the empty state ──────

  log(3, "Empty state");
  await beat(2200);

  // Seed the backlog off camera, now that both ids are known.
  const existing = await api.getMessages(me._id, partner._id);
  if ((existing.messageSender || []).length === 0) {
    for (const m of HISTORY) {
      const mine = m.from === "main";
      await api.postMessage(
        mine ? me._id : partner._id,
        mine ? partner._id : me._id,
        m.text
      );
    }
    log(3, `seeded ${HISTORY.length} history messages`);
  }

  // ──────────────────────────────────────────── scene 4 — the sidebar ───────

  log(4, "Sidebar");
  await glide(page, 200, 300, { duration: 700 });
  await beat(350);

  await say(page, "Everyone online, searchable");
  await typeHuman(page, 'input[aria-label="Search people"]', "sa", { cps: 6 });
  await beat(1300);
  // Clear it so the whole roster is on screen when the thread opens.
  await page.keyboard.press("Control+A");
  await page.keyboard.press("Backspace");
  await beat(800);
  await say(page, null);

  const partnerRow = `button:has-text("${PARTNER_USER.username}")`;
  await hover(page, partnerRow);
  await beat(750);
  await click(page, partnerRow);

  // ───────────────────────────────────────────── scene 5 — the thread ───────

  log(5, "Thread");
  await page.waitForSelector('form input[aria-label="Message"]', { timeout: 15000 });
  await beat(1900);

  await typeHuman(
    page,
    'form input[aria-label="Message"]',
    "Just pushed the fix — take a look when you can",
    { cps: 16 }
  );
  await beat(420);
  await click(page, 'button[aria-label="Send message"]');
  await beat(1500);

  // ───────────────────────────────────── scene 6 — two users, live ──────────

  log(6, "Split screen");
  await resizeTo(page, LEFT, { duration: 900 });
  await beat(400);

  const halfWidth = await viewportWidth(page);
  log(6, `half-window viewport ${halfWidth}px CSS ${halfWidth >= MD ? "✓ desktop layout" : "✗ BELOW md — lower SPLIT_SCALE"}`);

  const B = await newWindow(browser, RIGHT);
  await injectSession(B.page, partner);
  await B.page.goto(`${APP.client}/`, { waitUntil: "networkidle" });
  await beat(1100);

  // The partner opens the same conversation from their side.
  await click(B.page, `button:has-text("${me.username}")`);
  await B.page.waitForSelector('form input[aria-label="Message"]', { timeout: 15000 });
  await beat(1500);

  await say(page, "Two users. One WebSocket.");
  await beat(900);
  await say(page, null);

  for (const line of LIVE_EXCHANGE) {
    const fromMain = line.from === "main";
    const sender = fromMain ? page : B.page;
    const receiver = fromMain ? B.page : page;

    const before = await bubbleCount(receiver);
    await typeHuman(sender, 'form input[aria-label="Message"]', line.text, { cps: 17 });
    await beat(300);
    await click(sender, 'button[aria-label="Send message"]');

    // Holding on the receiving side IS the demo.
    await waitForDelivery(receiver, before, line.text.slice(0, 28));
    await beat(1400);
  }

  await beat(1100);
  await B.context.close();

  // ─────────────────────────────────────────── scene 7 — responsive ─────────

  log(7, "Responsive");
  await resizeTo(page, PHONE, { duration: 1600 });
  await beat(600);

  const narrow = await viewportWidth(page);
  log(7, `narrow viewport ${narrow}px CSS ${narrow < MD ? "✓ mobile layout" : "✗ still ≥ md — shrink PHONE.width"}`);
  await beat(1200);

  // Below md the thread owns the screen and a back button appears.
  await click(page, 'button[aria-label="Back to people list"]');
  await beat(1700);
  await click(page, partnerRow);
  await beat(1900);

  // ─────────────────────────────────────────────────────── scene 8 — outro ──

  log(8, "Outro");
  await resizeTo(page, SOLO, { duration: 1200 });
  await beat(700);
  await click(page, 'button[aria-label="Sign out"]');
  await page.waitForURL("**/login", { timeout: 10000 });
  await beat(2400);
  await glide(page, SOLO.width * 0.45, SOLO.height * 0.42, { duration: 900 });
  await beat(2000);

  console.log(`
  ────────────────────────────────────────────
  Done — stop the OBS recording.
  The window stays open 8s in case you want a final frame.
`);
  await sleep(8000);
} catch (err) {
  exitCode = 1;
  console.error(`\n  ✗ Demo stopped: ${err.message}\n`);
  console.error("  The browser stays open 20s so you can see where it stalled.\n");
  await sleep(20000);
} finally {
  await browser.close().catch(() => {});
  await api.dispose().catch(() => {});
  process.exit(exitCode);
}
