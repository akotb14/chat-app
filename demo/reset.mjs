/**
 * Deletes the demo accounts and every message they took part in, so
 * `npm run prepare-data` can recreate them cleanly — with profile pictures.
 *
 * The API has no delete or update-profile endpoint, so this talks to MongoDB
 * directly, reusing the server's own connection and models. No extra
 * dependency: bare imports inside those files resolve from server/node_modules.
 *
 *   npm run reset            # show what would be deleted
 *   npm run reset -- --apply # actually delete
 *
 * Only ever touches the exact usernames in config.mjs.
 */

import ConnectDB from "../server/models/connect_db.js";
import Users from "../server/models/user.model.js";
import Chats from "../server/models/chat.model.js";
import { MAIN_USER, PARTNER_USER, EXTRA_USERS } from "./config.mjs";

const names = [MAIN_USER, PARTNER_USER, ...EXTRA_USERS].map((u) => u.username);
const apply = process.argv.includes("--apply");

ConnectDB.connect_DB();
await Users.db.asPromise();

const users = await Users.find({ username: { $in: names } }, "username profileImage");

if (users.length === 0) {
  console.log(`\n  Nothing to delete — none of these exist yet:\n    ${names.join(", ")}\n`);
  await Users.db.close();
  process.exit(0);
}

const ids = users.map((u) => String(u._id));
const messages = await Chats.countDocuments({ users: { $in: ids } });

console.log(`\n  ${apply ? "Deleting" : "Would delete"}:`);
for (const u of users) console.log(`    ${u.username.padEnd(10)} ${u._id}`);
console.log(`    ${messages} message${messages === 1 ? "" : "s"}\n`);

if (apply) {
  const c = await Chats.deleteMany({ users: { $in: ids } });
  const u = await Users.deleteMany({ _id: { $in: users.map((x) => x._id) } });
  console.log(`  Deleted ${u.deletedCount} accounts and ${c.deletedCount} messages.`);
  console.log(`  Now run:  npm run prepare-data\n`);
} else {
  console.log("  Dry run. Add --apply to actually delete.\n");
}

await Users.db.close();
