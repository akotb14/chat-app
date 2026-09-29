/**
 * Renders card.html to PNG at 1920×1080, once per card.
 *
 * Kept separate from edit.mjs so the cards can be re-rendered on their own
 * while iterating on wording, without re-encoding the whole video.
 *
 *   node render-cards.mjs
 *
 * Playwright resolves from ../node_modules — Node walks up, so dem-video needs
 * no package.json of its own.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { chromium } from "playwright";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const BUILD_DIR = path.join(HERE, "_build");
const CARD_HTML = path.join(HERE, "card.html");

export const CARDS = ["title", "end"];

export async function renderCards() {
  fs.mkdirSync(BUILD_DIR, { recursive: true });

  const browser = await chromium.launch({
    args: ["--force-device-scale-factor=1", "--hide-scrollbars"],
  });
  const page = await browser.newPage({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    colorScheme: "dark",
  });

  const out = {};
  try {
    for (const kind of CARDS) {
      const url = `${pathToFileURL(CARD_HTML).href}?kind=${kind}`;
      await page.goto(url, { waitUntil: "load" });

      // Josefin Sans arrives from Google Fonts; screenshotting before it lands
      // would bake in the fallback face and change every metric on the card.
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(250);

      const dest = path.join(BUILD_DIR, `card-${kind}.png`);
      await page.screenshot({ path: dest, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
      out[kind] = dest;
      console.log(`  ✓ card-${kind}.png`);
    }
  } finally {
    await browser.close();
  }
  return out;
}

// Only render when run directly, so edit.mjs can import the function instead.
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  console.log("\n  Rendering cards…\n");
  await renderCards();
  console.log(`\n  Done → ${path.relative(process.cwd(), BUILD_DIR)}\n`);
}
