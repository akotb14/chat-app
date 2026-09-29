/**
 * Off-camera data prep.
 *
 * Downloads profile pictures, then creates the supporting cast so the sidebar
 * is populated — and photographed — instead of empty on camera. Idempotent.
 *
 *   npm run prepare-data
 *
 * Accounts that already exist are left alone. Since the API has no
 * update-profile endpoint, an existing account cannot gain a picture after the
 * fact; `npm run reset -- --apply` drops them so this can recreate them.
 */

import { makeApi } from "./lib/api.mjs";
import { ensureAvatars } from "./lib/avatars.mjs";
import { PARTNER_USER, EXTRA_USERS, APP } from "./config.mjs";

const CAST = [PARTNER_USER, ...EXTRA_USERS];

/** The picture the server assigns when no file is uploaded. */
const DEFAULT_AVATAR = "1677169550414_f10ff70a7155e5ab666bcdd1b45b726d.jpg";

const api = await makeApi();

try {
  console.log(`\n  Downloading profile pictures…\n`);
  const avatars = await ensureAvatars(CAST);
  console.log(`  ${avatars.size}/${CAST.length} cached in demo/avatars/\n`);

  console.log(`  Provisioning accounts against ${APP.server}\n`);

  let plain = 0;
  for (const u of CAST) {
    const user = await api.ensureUser(u);
    const hasPhoto = user.profileImage && user.profileImage !== DEFAULT_AVATAR;
    if (!hasPhoto) plain++;
    console.log(
      `  ${hasPhoto ? "✓" : "·"} ${u.username.padEnd(10)} ${String(user._id).padEnd(26)} ${
        hasPhoto ? "photo" : "no photo"
      }`
    );
  }

  console.log(`\n  Done. ${CAST.length} accounts ready.`);
  console.log(`  Shared password: ${PARTNER_USER.password}`);

  if (plain > 0) {
    console.log(`
  ${plain} account${plain === 1 ? "" : "s"} still on the default picture. They were
  created before pictures were configured, and the API has no way to change a
  profile after signup. To give them real photos:

      npm run reset -- --apply
      npm run prepare-data
`);
  } else {
    console.log(`  History is seeded by demo.mjs once the on-camera user exists.\n`);
  }
} catch (err) {
  console.error(`
  ✗ ${err.message}

  Is the server running?  cd server && npm start
`);
  process.exitCode = 1;
} finally {
  await api.dispose();
}
