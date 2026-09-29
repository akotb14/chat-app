/**
 * Demo configuration.
 *
 * Everything you would want to tweak before a take lives here. Nothing in
 * lib/ or demo.mjs should need editing to change names, pacing, or geometry.
 */

export const APP = {
  client: "http://localhost:3000",
  server: "http://localhost:5000",
};

/**
 * Profile pictures.
 *
 * Pulled from pravatar.cc, a placeholder-avatar service built for exactly this
 * (the "lorem ipsum" of profile photos), then cached in demo/avatars/ so a take
 * never depends on the network. The `img=` id pins each person to one face, so
 * every run is identical.
 *
 * Prefer illustrated avatars over stock faces? Swap the URLs for DiceBear —
 * same shape, no photos of real people:
 *   https://api.dicebear.com/7.x/notionists/jpg?seed=Sara
 *
 * Drop the `avatar` field entirely and the server falls back to its own default
 * picture for that user.
 */
const face = (id) => `https://i.pravatar.cc/400?img=${id}`;

/**
 * The account that gets created (or signed into) on camera.
 *
 * If this username already exists the demo automatically plays the LOGIN
 * scene instead of the REGISTER scene, so repeat runs never show an error
 * banner. Change the name when you want the registration scene back.
 */
export const MAIN_USER = {
  username: process.env.DEMO_USER || "Ahmed",
  email: process.env.DEMO_EMAIL || "ahmed@chatapp.dev",
  password: "Demo1234!",
  avatar: face(12),
};

/** The other side of the conversation. Created off-camera by prepare.mjs. */
export const PARTNER_USER = {
  username: "Sara",
  email: "sara@chatapp.dev",
  password: "Demo1234!",
  avatar: face(45),
};

/** Extra accounts so the sidebar looks populated rather than empty. */
export const EXTRA_USERS = [
  { username: "Youssef", email: "youssef@chatapp.dev", password: "Demo1234!", avatar: face(33) },
  { username: "Mariam", email: "mariam@chatapp.dev", password: "Demo1234!", avatar: face(47) },
  { username: "Khaled", email: "khaled@chatapp.dev", password: "Demo1234!", avatar: face(60) },
  { username: "Nour", email: "nour@chatapp.dev", password: "Demo1234!", avatar: face(26) },
];

/** Seeded so the thread has history the moment it opens. */
export const HISTORY = [
  { from: "partner", text: "Morning! Did the deploy go out last night?" },
  { from: "main", text: "It did — 2:14am. Zero downtime." },
  { from: "partner", text: "How's the error rate looking?" },
  { from: "main", text: "Flat. Latency actually dropped about 40%." },
  { from: "partner", text: "That's the connection pooling change paying off 🎉" },
];

/** Typed live, on camera, during the split-screen scene. */
export const LIVE_EXCHANGE = [
  { from: "main", text: "Want me to write it up for the team?" },
  { from: "partner", text: "Please — and add the latency graph" },
  { from: "main", text: "On it. Sending in five 👌" },
];

/** Your physical screen size, in real pixels. Used to tile the demo windows. */
export const SCREEN = {
  width: Number(process.env.SCREEN_W) || 1920,
  height: Number(process.env.SCREEN_H) || 1080,
};

/**
 * Chromium device scale factor, applied at launch.
 *
 * Window bounds are set in device-independent pixels, and a window of W DIP
 * renders at W × SPLIT_SCALE physical pixels while reporting a CSS viewport of
 * about W. Dropping below 1 is therefore what lets a window covering half a
 * 1536px screen still report a CSS viewport above the app's 768px `md`
 * breakpoint — without it each half lands at ~752px and collapses to the mobile
 * layout, dropping the sidebar.
 *
 * Lower it if the split-screen scene reports "BELOW md"; raise it toward 1 for
 * physically larger text if your screen is wider than 1536px.
 */
export const SPLIT_SCALE = Number(process.env.SPLIT_SCALE) || 0.8;

/**
 * Global pacing multiplier — every beat and glide is scaled by this.
 *
 * Accepts `--pace 1.35` as well as PACE=1.35, because `VAR=x cmd` is not valid
 * in cmd.exe and npm runs scripts through it on Windows.
 */
const paceFlag = process.argv.indexOf("--pace");
export const PACE =
  (paceFlag !== -1 && Number(process.argv[paceFlag + 1])) ||
  Number(process.env.PACE) ||
  1;

/**
 * On-screen caption bar. Worth leaving on for a silent portfolio clip; turn it
 * off with CAPTIONS=0 when you plan to record a voiceover over the top.
 */
export const CAPTIONS = process.env.CAPTIONS !== "0";

/** Set HEADLESS=1 to sanity-check the timeline without windows appearing. */
export const HEADLESS = process.env.HEADLESS === "1";
