/**
 * Turns the raw OBS capture into a set of publish-ready assets.
 *
 *   node edit.mjs              # everything
 *   node edit.mjs --no-gif     # skip the GIF (much the slowest step)
 *   node edit.mjs --cards-only # just re-render the cards
 *
 * What it does, and why each step is here:
 *
 *   trim      The capture opens on 1.4s of a still frame — OBS was rolling
 *             before the script started moving. Dead air at the head is the
 *             single fastest way to lose a viewer who is scrolling a feed.
 *   cards     A title and an end card, rendered from card.html in the app's
 *             own design language, cross-faded in. Turns a screen recording
 *             into something that reads as finished.
 *   drop audio  The source carries a stereo AAC track at 192 kbps whose peak
 *             amplitude is -91 dB — silence. It costs ~1.5 MB and makes
 *             players show an audio control that does nothing.
 *   re-encode The source is 3.8 Mbps H.264 Main. Screen content is mostly
 *             static, so a CRF encode at High profile is both smaller and
 *             cleaner. `aq-mode=3` biases bit allocation toward dark frames,
 *             which is the whole video.
 *   faststart Moves the moov atom to the front so a browser can start playing
 *             before the file has finished downloading.
 *
 * Outputs land in out/. Nothing here mutates the source capture.
 */

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath, pathToFileURL } from "url";
import { renderCards, BUILD_DIR } from "./render-cards.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(HERE, "my-chat-app.mp4");
const OUT = path.join(HERE, "out");

/** Timeline, in seconds. Every number here is safe to tune. */
const EDIT = {
  trimStart: 0.9, // drop the still frame at the head
  titleHold: 2.8, // total time the title card occupies, fade included
  endHold: 3.4,
  xfade: 0.6, // cross-fade between a card and the footage
  fadeIn: 0.5, // from black, over the title card
  fadeOut: 0.9, // to black, over the end card
  posterAt: 41, // split-screen scene — the strongest single frame
  gif: { start: 37.5, dur: 8, width: 640, fps: 12 },
};

/**
 * winget installs ffmpeg with a shim that only lands on PATH for shells opened
 * after install, so fall back to the package directory rather than failing.
 */
function resolveBin(name) {
  if (process.env[name.toUpperCase()]) return process.env[name.toUpperCase()];

  const probe = spawnSync(name, ["-version"], { encoding: "utf8" });
  if (!probe.error) return name;

  const root = path.join(
    process.env.LOCALAPPDATA || "",
    "Microsoft/WinGet/Packages"
  );
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.name.toLowerCase() === `${name}.exe`) return full;
    }
  }
  throw new Error(
    `${name} not found. Install it with:  winget install Gyan.FFmpeg\n` +
      `  Or point at it directly:  set ${name.toUpperCase()}=C:\\path\\to\\${name}.exe`
  );
}

const FFMPEG = resolveBin("ffmpeg");
const FFPROBE = resolveBin("ffprobe");

function run(bin, args, label) {
  const started = Date.now();
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) {
    const tail = (r.stderr || "").trim().split("\n").slice(-12).join("\n");
    throw new Error(`${label} failed:\n${tail}`);
  }
  const secs = ((Date.now() - started) / 1000).toFixed(1);
  console.log(`  ✓ ${label}  (${secs}s)`);
  return r.stdout;
}

function duration(file) {
  const out = run(
    FFPROBE,
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file],
    `probe ${path.basename(file)}`
  );
  return Number(String(out).trim());
}

const mb = (f) => (fs.statSync(f).size / 1024 / 1024).toFixed(2);

/** Shared x264 settings. Dark, mostly-static, text-heavy screen content. */
const x264 = (crf) => [
  "-c:v", "libx264",
  "-preset", "slow",
  "-profile:v", "high",
  "-level", "4.1",
  "-crf", String(crf),
  "-x264-params", "aq-mode=3:aq-strength=0.9:ref=4:bframes=3",
  "-pix_fmt", "yuv420p",
  // Tag the colour space rather than leaving players to guess — without this
  // the same file can look flatter in Safari than in Chrome.
  "-color_primaries", "bt709",
  "-color_trc", "bt709",
  "-colorspace", "bt709",
  "-movflags", "+faststart",
];

// ────────────────────────────────────────────────────────────────── build ────

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);

if (!fs.existsSync(SRC)) {
  console.error(`\n  ✗ No source capture at ${path.relative(process.cwd(), SRC)}\n`);
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(BUILD_DIR, { recursive: true });

console.log(`\n  Editing ${path.basename(SRC)}  (${mb(SRC)} MB)\n`);

console.log("  Cards");
const cards = await renderCards();

if (flag("cards-only")) {
  console.log(`\n  Cards only — nothing else rebuilt.\n`);
  process.exit(0);
}

console.log("\n  Timeline");

const srcDur = duration(SRC);
const bodyDur = srcDur - EDIT.trimStart;

/**
 * The cards are stills, so they become video by looping a single PNG. Each is
 * held for its full duration and then cross-faded into (or out of) the footage.
 *
 * xfade consumes `xfade` seconds of BOTH inputs at the join, so the finished
 * length is title + body + end − 2×xfade. Anything shorter than the fade on
 * either side would make xfade fail rather than clamp, which is why the card
 * holds are generous.
 */
const filter = [
  // Title card → footage
  `[0:v]fps=30,format=yuv420p,setsar=1[title]`,
  `[1:v]fps=30,format=yuv420p,setsar=1[body]`,
  `[2:v]fps=30,format=yuv420p,setsar=1[endcard]`,
  `[title][body]xfade=transition=fade:duration=${EDIT.xfade}:offset=${(
    EDIT.titleHold - EDIT.xfade
  ).toFixed(3)}[withtitle]`,
  // Footage → end card. The offset is measured on the joined stream.
  `[withtitle][endcard]xfade=transition=fade:duration=${EDIT.xfade}:offset=${(
    EDIT.titleHold + bodyDur - 2 * EDIT.xfade
  ).toFixed(3)}[joined]`,
  // Fade from and to black last, so it sits over the finished cut.
  `[joined]fade=t=in:st=0:d=${EDIT.fadeIn},fade=t=out:st=${(
    EDIT.titleHold + bodyDur + EDIT.endHold - 2 * EDIT.xfade - EDIT.fadeOut
  ).toFixed(3)}:d=${EDIT.fadeOut}[v]`,
].join(";");

const finalDur = EDIT.titleHold + bodyDur + EDIT.endHold - 2 * EDIT.xfade;

const MP4 = path.join(OUT, "chatapp-demo.mp4");
run(
  FFMPEG,
  [
    "-hide_banner", "-loglevel", "error", "-y",
    "-loop", "1", "-t", String(EDIT.titleHold), "-i", cards.title,
    "-ss", String(EDIT.trimStart), "-i", SRC,
    "-loop", "1", "-t", String(EDIT.endHold), "-i", cards.end,
    "-filter_complex", filter,
    "-map", "[v]",
    "-an", // the source audio track is digital silence
    ...x264(18),
    "-r", "30",
    MP4,
  ],
  `1080p master → ${path.basename(MP4)}`
);

// A 720p cut for places that re-encode anyway (LinkedIn, Twitter/X) — smaller
// upload, and their encoder has less to throw away.
const MP4_720 = path.join(OUT, "chatapp-demo-720p.mp4");
run(
  FFMPEG,
  [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", MP4,
    "-vf", "scale=1280:720:flags=lanczos",
    ...x264(20),
    MP4_720,
  ],
  `720p cut → ${path.basename(MP4_720)}`
);

// Poster frame — what shows before playback starts, and what a README <img>
// falls back to. Taken from the master so it matches the graded output.
const POSTER = path.join(OUT, "poster.jpg");
run(
  FFMPEG,
  [
    "-hide_banner", "-loglevel", "error", "-y",
    "-ss", String(EDIT.posterAt + EDIT.titleHold - EDIT.trimStart - EDIT.xfade),
    "-i", MP4,
    "-frames:v", "1", "-q:v", "2",
    POSTER,
  ],
  `poster → ${path.basename(POSTER)}`
);

if (!flag("no-gif")) {
  // Two passes: build a palette from the clip's own colours, then map to it.
  // A generic 216-colour web palette turns these dark blue gradients into
  // visible bands.
  const PAL = path.join(BUILD_DIR, "palette.png");
  const vf =
    `fps=${EDIT.gif.fps},scale=${EDIT.gif.width}:-1:flags=lanczos`;

  run(
    FFMPEG,
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-ss", String(EDIT.gif.start), "-t", String(EDIT.gif.dur), "-i", SRC,
      "-vf", `${vf},palettegen=max_colors=192:stats_mode=diff`,
      PAL,
    ],
    "gif palette"
  );

  const GIF = path.join(OUT, "chatapp-demo.gif");
  run(
    FFMPEG,
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-ss", String(EDIT.gif.start), "-t", String(EDIT.gif.dur), "-i", SRC,
      "-i", PAL,
      "-lavfi", `${vf}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3:diff_mode=rectangle`,
      "-loop", "0",
      GIF,
    ],
    `gif → ${path.basename(GIF)}`
  );
}

// ───────────────────────────────────────────────────────────────── report ────

console.log(`
  ────────────────────────────────────────────
  Source   ${mb(SRC).padStart(6)} MB   ${srcDur.toFixed(1)}s   1920×1080, silent audio track
  Output   ${mb(MP4).padStart(6)} MB   ${finalDur.toFixed(1)}s   1920×1080, no audio, faststart
`);

for (const f of fs.readdirSync(OUT).sort()) {
  const full = path.join(OUT, f);
  console.log(`    ${f.padEnd(24)} ${mb(full).padStart(7)} MB`);
}

console.log(`
  Where each one goes:
    chatapp-demo.mp4        portfolio site, GitHub release, direct link
    chatapp-demo-720p.mp4   LinkedIn / X / anywhere with an upload cap
    chatapp-demo.gif        README — autoplays, no player chrome
    poster.jpg              <video poster> and social preview
`);
