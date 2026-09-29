/**
 * Motion helpers.
 *
 * Playwright's own `mouse.move(x, y, {steps})` interpolates linearly, which on
 * camera reads as a robot sliding at constant speed. Everything here eases
 * instead — accelerate out, decelerate in — and types with jittered delays, so
 * the recording looks driven rather than scripted.
 */

import { PACE } from "../config.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Every duration in the demo passes through here, so PACE scales the whole run. */
export const beat = (ms) => sleep(Math.round(ms * PACE));

const easeInOut = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// Playwright exposes no cursor position, so we track our own per page.
const cursorAt = new WeakMap();

export function cursorPos(page) {
  return cursorAt.get(page) || { x: 40, y: 40 };
}

/**
 * Eased pointer travel. Duration scales with distance so short hops feel snappy
 * and long crossings still read as deliberate.
 */
export async function glide(page, x, y, { duration } = {}) {
  const from = cursorPos(page);
  const dist = Math.hypot(x - from.x, y - from.y);
  const ms = Math.round(
    (duration ?? Math.min(900, Math.max(240, dist * 1.15))) * PACE
  );
  const frames = Math.max(12, Math.round(ms / 14));

  for (let i = 1; i <= frames; i++) {
    const t = easeInOut(i / frames);
    await page.mouse.move(from.x + (x - from.x) * t, from.y + (y - from.y) * t);
    await sleep(ms / frames);
  }
  cursorAt.set(page, { x, y });
}

async function boxOf(page, selector, { timeout = 15000 } = {}) {
  const el = page.locator(selector).first();
  await el.waitFor({ state: "visible", timeout });
  await el.scrollIntoViewIfNeeded();
  const box = await el.boundingBox();
  if (!box) throw new Error(`No bounding box for ${selector}`);
  return box;
}

/** Glide onto an element and stop — used to trigger hover states on camera. */
export async function hover(page, selector, opts = {}) {
  const box = await boxOf(page, selector, opts);
  await glide(page, box.x + box.width / 2, box.y + box.height / 2, opts);
}

/** Glide onto an element, pause so the hover state registers, then click. */
export async function click(page, selector, opts = {}) {
  await hover(page, selector, opts);
  await beat(opts.settle ?? 170);
  await page.mouse.down();
  await beat(70);
  await page.mouse.up();
  await beat(opts.after ?? 110);
}

/**
 * Sweep the pointer across an element without clicking. The cards in this app
 * tilt toward the cursor and paint a spotlight under it, and neither effect is
 * visible unless something actually moves across them.
 */
export async function sweep(page, selector, { loops = 1, duration = 1500 } = {}) {
  const b = await boxOf(page, selector);
  const path = [
    [b.x + b.width * 0.16, b.y + b.height * 0.78],
    [b.x + b.width * 0.5, b.y + b.height * 0.2],
    [b.x + b.width * 0.87, b.y + b.height * 0.62],
    [b.x + b.width * 0.42, b.y + b.height * 0.85],
  ];
  for (let i = 0; i < loops; i++) {
    for (const [x, y] of path) {
      await glide(page, x, y, { duration: duration / path.length });
    }
  }
}

/**
 * Types with per-character jitter and a longer pause after spaces and
 * punctuation. Fixed-delay typing is the tell that gives a scripted demo away.
 */
export async function typeHuman(page, selector, text, { cps = 15 } = {}) {
  await click(page, selector);
  const base = 1000 / cps;
  for (const ch of text) {
    await page.keyboard.type(ch);
    let d = base * (0.62 + Math.random() * 0.85);
    if (ch === " ") d *= 1.3;
    if (".,!?".includes(ch)) d *= 2.1;
    await sleep(d * PACE);
  }
}

// One CDP session per page. A resize sends ~26 bounds updates; opening a
// session for each one is both slow and visibly janky.
const cdpSessions = new WeakMap();

async function cdp(page) {
  let s = cdpSessions.get(page);
  if (!s) {
    s = await page.context().newCDPSession(page);
    cdpSessions.set(page, s);
  }
  return s;
}

/** Current OS window rect, in the same physical pixels setWindowBounds expects. */
export async function getWindowBounds(page) {
  const session = await cdp(page);
  const { bounds } = await session.send("Browser.getWindowForTarget");
  return bounds;
}

/** Position and size the real OS window. Chromium only, via CDP. */
export async function setWindowBounds(page, { left, top, width, height }) {
  const session = await cdp(page);
  const { windowId } = await session.send("Browser.getWindowForTarget");
  await session.send("Browser.setWindowBounds", {
    windowId,
    bounds: { left, top, width, height, windowState: "normal" },
  });
}

/**
 * Smoothly resize the window — used for the responsive scene.
 *
 * Reads the starting rect over CDP rather than from `window.outerWidth`: with
 * --force-device-scale-factor in play those are different units, and mixing
 * them makes the first frame of the animation jump.
 */
export async function resizeTo(page, bounds, { steps = 26, duration = 1100 } = {}) {
  const start = await getWindowBounds(page);
  for (let i = 1; i <= steps; i++) {
    const t = easeInOut(i / steps);
    await setWindowBounds(page, {
      left: Math.round(start.left + (bounds.left - start.left) * t),
      top: Math.round(start.top + (bounds.top - start.top) * t),
      width: Math.round(start.width + (bounds.width - start.width) * t),
      height: Math.round(start.height + (bounds.height - start.height) * t),
    });
    await sleep((duration / steps) * PACE);
  }
}

/** Show / hide the on-screen caption injected by CAPTION_SCRIPT. */
export async function caption(page, text) {
  await page.evaluate((t) => window.__demoCaption?.(t), text).catch(() => {});
}

export { sleep };
