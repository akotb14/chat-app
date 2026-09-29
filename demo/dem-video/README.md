# Video

The raw screen capture, and the pipeline that turns it into something publishable.

```
dem-video/
├── my-chat-app.mp4     the raw OBS capture (source of truth, never modified)
├── card.html           title + end cards, in the app's own design language
├── render-cards.mjs    renders those cards to 1920×1080 PNG
├── edit.mjs            trim → cards → fades → encode → poster → GIF
└── out/                the publishable files
```

---

## Rebuild everything

```bash
cd demo/dem-video
node edit.mjs
```

Takes about 2½ minutes. Nothing writes back to `my-chat-app.mp4`, so it is always
safe to re-run.

```bash
node edit.mjs --no-gif       # skip the GIF
node edit.mjs --cards-only   # just re-render the cards while editing wording
```

Needs [ffmpeg](https://ffmpeg.org). If it isn't installed:

```bash
winget install Gyan.FFmpeg
```

The script finds it on `PATH`, falls back to the winget package directory (winget
only adds it to `PATH` for *new* shells), and finally honours `FFMPEG=` /
`FFPROBE=` env vars pointing at the binaries.

---

## What comes out

| File | Size | Where it goes |
|---|---|---|
| `chatapp-demo.mp4` | 10.1 MB | Portfolio site, GitHub release, direct link |
| `chatapp-demo-720p.mp4` | 3.5 MB | LinkedIn, X — anywhere with an upload cap |
| `chatapp-demo.gif` | 2.7 MB | README — autoplays, no player chrome |
| `poster.jpg` | 0.1 MB | `<video poster>`, social preview card |

Down from a **30 MB** source, and 67s long against the source's 63s — the extra
four seconds are the title and end cards.

---

## What the edit actually does

Each step earns its place; none of it is decoration.

**Trim 0.9s off the head.** The capture opens on a still frame — OBS was rolling
before the demo script started moving. Dead air at the start is the fastest way
to lose someone scrolling a feed.

**Title and end cards.** Rendered from [card.html](card.html) by Playwright at
1920×1080, cross-faded in over 0.6s. They use the app's own tokens — the same
near-black `#08080A` spine, the same single blue→cyan accent, the same Josefin
Sans — so they read as part of the product rather than bolted on afterwards.
Change the wording in the `COPY` object at the bottom of that file.

**Drop the audio track.** The source carries stereo AAC at 192 kbps whose peak
amplitude is **−91 dB** — digital silence. It costs ~1.5 MB and makes players
show a volume control that does nothing.

**Re-encode.** The source is 3.8 Mbps H.264 **Main**. Screen content is mostly
static, so a CRF encode at **High** profile is both smaller *and* cleaner —
1.27 Mbps for better quality than the original. `aq-mode=3` biases bit
allocation toward dark frames, which here is the entire video; without it the
mesh gradients band visibly.

**Fade from and to black**, applied last so it sits over the finished cut.

**`+faststart`.** Moves the `moov` atom to the front of the file so a browser can
begin playing before the download finishes. Verified at byte 36.

**BT.709 colour tags.** Without them the same file looks flatter in Safari than
in Chrome, because each player guesses differently.

**GIF in two passes** — build a palette from the clip's own colours, then map to
it. A generic web palette turns these dark blue gradients into visible bands.

---

## Tuning

Every number lives in the `EDIT` object at the top of [edit.mjs](edit.mjs):

```js
trimStart: 0.9,    // dead frames at the head
titleHold: 2.8,    // total time on the title card, fade included
endHold:   3.4,
xfade:     0.6,    // card ↔ footage cross-fade
posterAt:  41,     // split-screen scene — the strongest single frame
gif: { start: 37.5, dur: 8, width: 640, fps: 12 },
```

Card holds must stay longer than `xfade` — the filter fails rather than clamping.

Quality is one number, `x264(18)` in the master encode. Lower is better and
bigger; 18 is visually lossless for screen content. CRF 20 lands around 5 MB,
CRF 22 around 4 MB.

---

## Embedding it

**GitHub README** — the GIF just works:

```markdown
![ChatApp demo](demo/dem-video/out/chatapp-demo.gif)
```

GitHub also accepts a real video: drag `chatapp-demo.mp4` into an issue or PR
comment box, and paste the URL it gives you back.

**A web page** — poster first, so the frame is there before the video loads:

```html
<video src="chatapp-demo.mp4" poster="poster.jpg"
       autoplay muted loop playsinline preload="metadata"></video>
```

`muted` is required for `autoplay` in every current browser. The file has no
audio track at all, so nothing is lost.

**LinkedIn / X** — upload `chatapp-demo-720p.mp4`. They re-encode whatever you
give them, so a smaller upload means their encoder has less to throw away.

---

## Recapturing

If you re-record, drop the new file in as `my-chat-app.mp4` and re-run
`node edit.mjs`. The one thing to check is `trimStart` — how long OBS rolled
before the demo started moving:

```bash
ffmpeg -i my-chat-app.mp4 -vf "freezedetect=n=-58dB:d=1.0" -f null - 2>&1 | grep freeze
```

The first `freeze_duration` is your trim point. See [../README.md](../README.md)
for how the capture itself is produced.
