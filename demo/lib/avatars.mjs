/**
 * Avatar fetching.
 *
 * Profile pictures are pulled once from the internet and cached in demo/avatars/
 * so a take never depends on the network, and so every run uses the identical
 * face for the identical person.
 *
 * Node 16 has no global fetch, hence the raw https module.
 */

import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const AVATAR_DIR = path.join(HERE, "..", "avatars");

/** Follows redirects — the avatar services bounce through a CDN. */
function download(url, dest, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { "User-Agent": "chat-app-demo" } }, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          res.resume();
          if (redirectsLeft === 0) return reject(new Error(`Too many redirects: ${url}`));
          return resolve(download(res.headers.location, dest, redirectsLeft - 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`${res.statusCode} from ${url}`));
        }

        // Write to a temp file and rename, so an interrupted download can never
        // leave a truncated image in the cache.
        const tmp = `${dest}.part`;
        const file = fs.createWriteStream(tmp);
        res.pipe(file);
        file.on("finish", () => {
          file.close(() => {
            fs.renameSync(tmp, dest);
            resolve(dest);
          });
        });
        file.on("error", (err) => {
          fs.unlink(tmp, () => reject(err));
        });
      })
      .on("error", reject);
  });
}

/**
 * Returns a local path to this user's avatar, downloading it on first use.
 * Returns null when the user has no `avatar` configured, which makes the server
 * fall back to its own default picture.
 */
export async function ensureAvatar(user) {
  if (!user.avatar) return null;

  fs.mkdirSync(AVATAR_DIR, { recursive: true });
  const dest = path.join(AVATAR_DIR, `${user.username.toLowerCase()}.jpg`);

  // A zero-byte file means a previous run died mid-download; refetch it.
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return dest;

  await download(user.avatar, dest);
  return dest;
}

/** Warms the cache for a whole cast up front. Returns username → path. */
export async function ensureAvatars(users) {
  const out = new Map();
  for (const u of users) {
    try {
      const p = await ensureAvatar(u);
      if (p) out.set(u.username, p);
    } catch (err) {
      // A missing picture is cosmetic — never let it abort a take.
      console.warn(`  ! avatar for ${u.username}: ${err.message}`);
    }
  }
  return out;
}
