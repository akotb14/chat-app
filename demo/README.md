# Demo recorder

A scripted [Playwright](https://playwright.dev) driver that walks the real app
through a fixed timeline — register, browse, open a thread, exchange live
messages between two windows, collapse to mobile — while you record the screen.

Nothing here is a mock. It drives the actual client against the actual server,
so the recording is proof the app works, and re-running it after a UI change
produces the same take again.

```
demo/
├── config.mjs        names, pacing, geometry — the only file you need to edit
├── prepare.mjs       downloads photos + creates the supporting cast (run once)
├── reset.mjs         deletes the demo accounts so prepare-data can redo them
├── demo.mjs          the scene timeline
├── avatars/          downloaded profile pictures (git-ignored, auto-created)
├── dem-video/        the capture, and the edit pipeline that publishes it
└── lib/
    ├── api.mjs       off-camera HTTP: accounts + seeded history
    ├── avatars.mjs   fetches and caches the profile pictures
    ├── cursor.mjs    synthetic cursor + caption bar, injected into the page
    └── motion.mjs    eased pointer travel, human typing, CDP window control
```

---

## Requirements

- Node 16+ (Playwright is pinned to **1.44.1**, the last release supporting Node 16)
- The app's server and client both running
- A screen recorder — [OBS Studio](https://obsproject.com/) is the free default

Install once:

```bash
cd demo
npm install
npx playwright install chromium
```

---

## Recording a take

**1. Start the app** — two terminals, left running:

```bash
cd server && npm start     # http://localhost:5000
cd client && npm start     # http://localhost:3000
```

**2. Seed the supporting cast** — once, so the sidebar is populated:

```bash
cd demo && npm run prepare-data
```

Creates Sara, Youssef, Mariam, Khaled and Nour, and downloads a profile photo
for each into `demo/avatars/` (pulled once from the internet, then cached — a
take never depends on the network). Idempotent — safe to re-run.

Photos are assigned at signup, and the API has no way to change a profile after
the fact. If you swap the `avatar` URLs in `config.mjs` — or you want to try
[DiceBear](https://www.dicebear.com) illustrated avatars instead of the default
[i.pravatar.cc](https://i.pravatar.cc) photos — you must recreate the accounts
for the new pictures to take effect:

```bash
cd demo && npm run reset -- --apply   # deletes ONLY the demo accounts (dry run without --apply)
npm run prepare-data                  # recreates them with the new photos
```

**3. Set up OBS**

| Setting | Value |
|---|---|
| Source | **Display Capture** (not Window Capture — the demo moves and resizes windows) |
| Base + output resolution | Match your screen, e.g. `1536×864` |
| FPS | 60 |
| Encoder | Hardware (NVENC / QuickSync / AMF) if offered |
| Rate control | CQP / CRF ≈ 18 for a crisp re-encode |

Close anything you don't want on camera — the demo drives real OS windows and
whatever sits behind them is in the shot.

**4. Record**

```bash
npm run demo
```

The script prints a banner, waits **4 seconds**, then opens the browser. Start
the OBS recording during that pause. It prints `Done` when the timeline ends and
leaves the window up for 8 more seconds so you have a clean final frame.

Pace variants:

```bash
npm run demo:slow     # PACE=1.35 — room for a voiceover
npm run demo:fast     # PACE=0.75 — tighter, good for a looping GIF
PACE=0.3 npm run demo # rough rehearsal, too fast to record
```

---

## The timeline

| # | Scene | What it shows |
|---|---|---|
| 1 | Hero | Mesh backdrop, word-by-word headline, card tilt + cursor spotlight |
| 2 | Auth | Registration — profile photo picked from the file dialog, live password-strength meter — or login |
| 3 | Empty state | The pre-conversation screen |
| 4 | Sidebar | Search filtering, hover states, opening a conversation |
| 5 | Thread | Seeded history loads, a message is sent |
| 6 | Split screen | Two windows, two users, live delivery over WebSocket |
| 7 | Responsive | Collapse to the mobile layout, back button, reopen |
| 8 | Outro | Sign out, land back on the hero |

Roughly **75 seconds** at `PACE=1`.

Scene 2 adapts: if the on-camera username already exists it plays the **login**
scene instead of **register**, so repeat runs never show an error banner. To get
the registration scene back, use a name that does not exist yet:

```bash
DEMO_USER=Omar DEMO_EMAIL=omar@chatapp.dev npm run demo
```

---

## Tuning

Everything adjustable lives in [config.mjs](config.mjs).

**Names and dialogue** — `MAIN_USER`, `PARTNER_USER`, `EXTRA_USERS`, `HISTORY`
(seeded off camera) and `LIVE_EXCHANGE` (typed on camera).

**Profile photos** — each user has an `avatar` URL. The default is
[i.pravatar.cc](https://i.pravatar.cc), a placeholder-avatar service; the `img=`
id pins one face to one person so every run looks identical. Swap in DiceBear
for illustrations rather than photos of real people:

```js
avatar: "https://api.dicebear.com/7.x/notionists/jpg?seed=Sara"
```

Delete the `avatar` field entirely and that user falls back to the server's grey
default. Changing a URL requires `npm run reset -- --apply` first — see step 2.

**Screen size** — defaults to `1536×864`. If yours differs:

```bash
SCREEN_W=1920 SCREEN_H=1080 npm run demo
```

**Captions** — an on-screen caption bar is on by default, which suits a silent
portfolio clip. Turn it off if you plan to narrate:

```bash
CAPTIONS=0 npm run demo
```

**Layout** — `SPLIT_SCALE` is the one setting with a real trap behind it, and
it is worth understanding before you touch it.

---

## Why `SPLIT_SCALE` exists

Chromium's `Browser.setWindowBounds` takes **device-independent pixels**, not
physical screen pixels. With `--force-device-scale-factor=S`, a window of `W`
DIP occupies `W × S` physical pixels on screen while reporting a CSS viewport of
roughly `W`.

That matters because the app switches to its mobile layout below `768px`. On a
1536px screen, two side-by-side windows are 768 physical pixels each — and at
scale 1.0 that yields a CSS viewport of about **752px** once Windows' window
frame is subtracted. Sixteen pixels short, so both halves would collapse to the
mobile layout and drop the sidebar, in the one scene whose whole point is
showing two full desktop clients talking to each other.

At `SPLIT_SCALE = 0.8` each half is 960 DIP → **943px CSS** — comfortably
desktop — while still covering exactly half the physical screen.

The script prints what it actually measured, so you never have to guess:

```
6 │ half-window viewport 943px CSS ✓ desktop layout
7 │ narrow viewport 503px CSS ✓ mobile layout
```

If scene 6 reports `✗ BELOW md`, lower `SPLIT_SCALE`. On a screen wider than
1536px you can raise it toward `1` for physically larger text.

---

## Why there is a hand-drawn cursor

Playwright dispatches mouse events straight into the renderer over CDP. They
never move the physical OS pointer, so a screen recorder captures a page
reacting to hovers and clicks with **no cursor anywhere on screen**.

[lib/cursor.mjs](lib/cursor.mjs) injects an SVG pointer that listens for those
same synthetic events and follows them, with a ripple on click. It is injected
via `addInitScript`, so it survives navigation, and it lives in a
`pointer-events: none` layer, so it can never intercept a click it is drawing.

The motion helpers matter for the same reason. Playwright's built-in
`mouse.move(x, y, {steps})` interpolates linearly, which reads on camera as a
robot sliding at constant speed; [lib/motion.mjs](lib/motion.mjs) eases every
move and jitters every keystroke instead.

---

## Editing the result

Drop the take in [dem-video/](dem-video/) as `my-chat-app.mp4` and run:

```bash
cd dem-video
node edit.mjs
```

That trims the dead head frames, adds title and end cards in the app's own
design language, strips the silent audio track, and writes four files to
`dem-video/out/` — a 1080p master, a 720p cut for platforms with upload caps, a
README-sized GIF of the split-screen scene, and a poster frame. See
[dem-video/README.md](dem-video/README.md) for what each step does and how to
tune it.

**Silent autoplay** is how most people will see it on a portfolio page, which is
why captions default to on and the edit drops the audio track entirely.

---

## Troubleshooting

**`✗ No API server on http://localhost:5000`** — the server isn't running, or
`PORT` in `server/.env` doesn't say 5000.

**`Client dev server not answering`** — `cd client && npm start`. If it exits
with `getaddrinfo ENOTFOUND`, something has set a bare `HOST=<url>` in
`client/.env`; that name is reserved by webpack-dev-server for the interface it
binds to. The API base URL belongs in `REACT_APP_API_HOST`.

**Messages never arrive in scene 6** (`⚠ "..." never arrived`) — the Socket.IO
handshake is being rejected. `CLIENT_ORIGIN` in `server/.env` must be the
**client's** origin (`http://localhost:3000`), not the server's own URL. Check
the browser console for `blocked by CORS policy`. Messages still save over HTTP
when this is broken, so the app looks fine until two windows are open — which is
exactly what this scene is for.

**`Cannot provision "Sara"`** — the account exists with a different password.
Change the name in `config.mjs` or drop the old account.

**`! avatar for Sara: ...`** — the photo download failed. A missing picture is
cosmetic; the demo runs anyway and that user shows the grey default. Check the
`avatar` URL in `config.mjs` or re-run `npm run prepare-data` once the network
is back.

**The cursor is invisible** — you are recording with Window Capture. Switch to
Display Capture; the demo moves and resizes windows as it runs.

**Chromium ignores a very narrow window** — Windows enforces a minimum window
width near 500 DIP, which is why the mobile scene uses 520 rather than something
phone-exact. It is still far below the `md` breakpoint, so the layout is right.
