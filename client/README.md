# ChatApp — Client

React single-page app for ChatApp: authentication, a people sidebar, and a live
message thread over Socket.IO. Styled with Tailwind CSS in a dark design system
called **Midnight Aurora**.

- **Framework:** React 18 on Create React App 5 (`react-scripts`)
- **Routing:** React Router 6
- **HTTP:** axios
- **Realtime:** `socket.io-client`
- **Styling:** Tailwind CSS 3.4 + a small hand-written component layer
- **Icons:** Material Symbols Rounded (loaded from Google Fonts in `public/index.html`)
- **Typeface:** Josefin Sans

No animation library, no UI kit, no state manager — the motion is CSS keyframes
and one 40-line pointer hook.

---

## Quick start

```bash
cd client
npm install
npm start          # http://localhost:3000
```

The server must be running on **port 5000** first — see [`../server/README.md`](../server/README.md).

| Script | What it does |
| ------ | ------------ |
| `npm start` | Dev server with fast refresh on port 3000 |
| `npm run build` | Production bundle into `build/` |
| `npm test` | CRA/Jest watch mode (no tests written yet) |

### Environment

`client/.env`:

```env
REACT_APP_LOCALHOST_KEY="chat-app-current-user"
```

That is the `localStorage` key the signed-in user object is stored under. The API
host itself is **not** an environment variable — it is a constant in
[src/utils/APIRoutes.js](src/utils/APIRoutes.js):

```js
export const host = "http://localhost:5000";
```

Change it there when pointing at a deployed backend.

---

## Routes

| Path | Component | Notes |
| ---- | --------- | ----- |
| `/` | `pages/Chat` | Redirects to `/register` when no user is in `localStorage` |
| `/login` | `pages/Login` | Redirects to `/` when already signed in |
| `/register` | `pages/Register` | Redirects to `/` when already signed in |

Route protection is a `useEffect` guard inside each page, not a wrapper
component. It checks `localStorage` only — there is no token to validate.

---

## Project layout

```
client/
├── public/
│   └── index.html               # Material Symbols <link> lives here
├── src/
│   ├── pages/
│   │   ├── Login/Login.jsx
│   │   ├── Register/Register.jsx
│   │   └── Chat/Chat.jsx        # layout shell + empty state
│   ├── components/
│   │   ├── Navbar/Navbar.jsx    # people sidebar (search, presence, sign out)
│   │   ├── Main/Main.jsx        # message thread + composer
│   │   └── ui/
│   │       ├── AuthShell.jsx    # split hero/form layout for the auth pages
│   │       ├── AuthCard.jsx     # tilting glass card wrapper
│   │       ├── MeshBackdrop.jsx # animated gradient background
│   │       ├── Avatar.jsx       # gradient rim + presence dot
│   │       └── Logo.jsx
│   ├── hooks/
│   │   └── usePointer.js        # pointer → CSS custom properties
│   ├── utils/APIRoutes.js       # every endpoint URL
│   ├── index.css                # Tailwind layers + component classes
│   ├── App.js                   # router
│   └── index.js
├── tailwind.config.js           # design tokens
└── postcss.config.js
```

`src/assets/` still holds sample avatars from earlier iterations; nothing in the
current source imports from it.

---

## Design system — Midnight Aurora

A near-black canvas, glass surfaces, and exactly **one** accent family: electric
blue sliding into cyan. Colour comes from the accent and the animated backdrop —
never from the surfaces, which stay achromatic so the accent is always the
brightest thing on screen.

### Tokens

Defined in [tailwind.config.js](tailwind.config.js):

| Group | Scale | Purpose |
| ----- | ----- | ------- |
| `night` | `950 #08080A` → `500 #3A3D48` | Backgrounds and borders. Untinted on purpose. |
| `fg` | `DEFAULT #EDEFF5`, `muted #9BA3B4`, `faint #666D7D` | Text hierarchy |
| `accent` | `300 #A5BEFF` → `700 #2C4BC4` | Primary — `500 #4F7CFF` is the anchor |
| `aqua` | `300 #67E8F9` → `500 #06B6D4` | Gradient partner, never used alone |

Plus `shadow-e1/e2/e3` (elevation), `shadow-rim` (the inset top highlight that
makes glass read as lit), `shadow-glow` / `glow-lg` (accent bloom), and two easing
curves: `ease-smooth` for arrivals, `ease-spring` for anything that should feel
physical.

### Component classes

Written by hand in [src/index.css](src/index.css) under `@layer components`:

| Class | Effect |
| ----- | ------ |
| `.glass` / `.panel` | Translucent surface: hairline border, blur, rim light |
| `.edge` | `::before` hairline along the top edge, fading at the corners |
| `.spotlight` | `::after` radial accent wash that follows the cursor |
| `.tilt` | `perspective()` + `rotateX/Y` driven by CSS variables |
| `.aurora-border` | Rotating conic gradient masked to a 1px ring |
| `.text-aurora` | Gradient headline text with a slow shimmer sweep |
| `.display`, `.label`, `.eyebrow` | Type roles |
| `.field`, `.field-invalid` | Inputs, with hover / focus / error states |
| `.btn`, `.btn-primary`, `.btn-ghost`, `.icon-btn` | Buttons |
| `.scroll-slim` | Thin scrollbars, cross-browser |

### Motion

Every animation is a Tailwind keyframe. Staggering is done with inline
`animationDelay` — never with generated class names, which would be purged.

| Animation | Where |
| --------- | ----- |
| `mesh-a/b/c` | Four backdrop blobs drifting on 26s / 34s / 30s loops |
| `reveal-word` | Hero headline — each word rises out of an `overflow-hidden` mask |
| `reveal-up` | Cards, sidebar rows, badges, error banners |
| `bubble-in` | Messages, on a spring curve |
| `typing` | The three-dot indicator |
| `pulse-dot` | Expanding ring behind an online avatar |
| `shimmer` | Gradient text sweep |
| `spin-slow` | The rotating card border |

`prefers-reduced-motion: reduce` collapses every duration to `0.01ms` in the base
layer, so the whole system degrades to a static page in one rule.

> **Gotcha worth knowing:** Tailwind only emits an `@keyframes` block when some
> `animate-*` utility references it. A keyframe driven from raw CSS silently
> vanishes from the bundle. `spin-slow` is therefore declared directly in
> `index.css` next to `.aurora-border`, the only thing that uses it.

### Pointer tracking

[`usePointer`](src/hooks/usePointer.js) is the only JavaScript involved in the
motion. It writes four CSS custom properties inside a `requestAnimationFrame`:

```jsx
const pointer = usePointer({ tilt: 3 });   // tilt in degrees; omit for spotlight only

<div
  ref={pointer.ref}
  onPointerMove={pointer.onPointerMove}
  onPointerLeave={pointer.onPointerLeave}
  className="tilt spotlight"
>
```

| Property | Consumed by |
| -------- | ----------- |
| `--mx`, `--my` | `.spotlight` — radial gradient origin |
| `--rx`, `--ry` | `.tilt` — rotation angles |

Because it mutates `style` directly, **pointer movement never triggers a React
render** — the tilt and spotlight run entirely on the compositor.

---

## Data flow

**Sign in** → `POST /api/login` → user object into `localStorage` → navigate to `/`.

**Chat** mounts, opens the socket, and emits `add-user` with the current user id.
Picking someone from the sidebar mounts `Main` keyed by their id, which fetches
`GET /api/getMessages/:sender/:recieve`.

**Sending** does two things at once: emits `send-msg` over the socket for live
delivery, and appends the bubble locally before the network round-trip so it lands
instantly. The `POST /api/postMessage` that persists it happens in the background.

**Receiving** listens for `msg-recieve`. The listener is registered per
conversation and removed on cleanup — without that it stacks up on every switch
and duplicates every message.

---

## Notes and limitations

- **Errors arrive as HTTP 200.** The API signals failure with
  `{status: false, message}` in the body, so every call branches on `data.status`,
  not the status code.
- **The receive handler trusts the open thread.** `msg-recieve` carries only the
  message text, so an incoming message is attributed to whoever is currently
  selected — a message from a different contact appears in the wrong thread.
  Fixing it properly needs the server to include the sender id.
- **Presence is partly cosmetic.** The green dot on your own avatar and the
  "Active now" line in the thread header are static. `getUsers` does return a
  `newOnlineUser` array from the server's presence map, but the sidebar does not
  consume it yet.
- **Mobile is one pane at a time.** Below `md` the sidebar and the thread swap;
  `Chat` holds a `mobileView` state and `Main` gets a back button.
- **`uuid` and `swiper` are still in `package.json`** but nothing imports them.
- **Tailwind is pinned to v3.** v4 requires Node 18+; this project builds on Node
  16.20.2. Don't let an `npm update` pull v4 in.

---

## Verifying a change

`CI=true` turns warnings into errors, which is the quickest way to catch an unused
import or a bad hook dependency:

```bash
CI=true npx react-scripts build
```

To confirm a design token actually made it into the bundle — rather than being
purged for a dynamically-constructed class name:

```bash
grep -o '@keyframes [a-z-]*' build/static/css/main.*.css | sort -u
grep -oiE '#(08080a|4f7cff|22d3ee)' build/static/css/main.*.css | sort -u
```
