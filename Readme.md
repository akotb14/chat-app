<div align="center">

# 💬 ChatApp

**Real-time one-to-one messaging.** React + Tailwind on the front, Express +
Socket.IO + MongoDB on the back. Messages land the instant they are sent — no
refresh, no polling.

![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-16+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.18-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.5-010101?style=for-the-badge&logo=socket.io)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)

</div>

---

## Overview

A full-stack chat application built as a portfolio project. Two people sign up,
find each other in the sidebar, and talk — with delivery over WebSockets and
history persisted to MongoDB.

The interesting parts:

- **Two independent paths per message.** The socket carries the live copy for
  instant delivery; a REST call writes the durable one. Neither waits on the
  other, so a bubble appears the moment you hit send.
- **Optimistic UI.** Your message renders locally before the network round-trip
  completes.
- **A hand-built design system.** No UI kit and no animation library — the dark
  "Midnight Aurora" theme is Tailwind tokens plus about 200 lines of CSS: glass
  panels, a drifting gradient mesh, cursor-tracked spotlights and tilt, and
  word-by-word headline reveals. All of it degrades to a static page under
  `prefers-reduced-motion`.
- **Passwords hashed with bcrypt** at cost factor 10, never returned by any
  endpoint.

> **Before you deploy this:** authentication is `localStorage`-based with no
> signed token, and no API route is protected. See
> [Security status](#security-status) — it is the honest list of what would need
> to change first.

---

## Screenshots

| | |
| --- | --- |
| Sign in | Register |
| Conversation | Mobile |

> Drop your captures in `docs/` and link them here.

---

## Architecture

```
┌─────────────────────────────┐
│  Browser — React 18 SPA     │
│  :3000                      │
└──────┬───────────────┬──────┘
       │               │
   axios / REST    socket.io-client
       │               │
┌──────▼───────────────▼──────┐
│  Express 4  +  Socket.IO    │
│  :5000                      │
│                             │
│  /api/*      REST routes    │
│  /image/*    static avatars │
│  onlineUsers Map (presence) │
└──────────────┬──────────────┘
               │ Mongoose 6
        ┌──────▼──────┐
        │  MongoDB    │
        │  Users      │
        │  Chats      │
        └─────────────┘
```

**Sending a message** — the client emits `send-msg` on the socket *and* appends
the bubble to local state immediately, then `POST`s to `/api/postMessage` in the
background. The server looks up the recipient's socket id in an in-memory
`Map<userId, socketId>` and forwards the text as `msg-recieve`. If the recipient
is offline the socket event is simply dropped — the message is already persisted,
so it appears the next time they open the thread.

---

## Tech stack

| Layer | Choices |
| ----- | ------- |
| **Frontend** | React 18, React Router 6, axios, `socket.io-client`, Tailwind CSS 3.4, Create React App 5 |
| **Backend** | Node.js (ESM), Express 4.18, Socket.IO 4.5, Multer, `validator` |
| **Database** | MongoDB Atlas, Mongoose 6 |
| **Security** | bcrypt password hashing |
| **Fonts / icons** | Josefin Sans, Material Symbols Rounded |

---

## Project structure

```
chat-app/
├── client/                     # React SPA  →  client/README.md
│   ├── public/
│   ├── src/
│   │   ├── pages/              # Login, Register, Chat
│   │   ├── components/         # Navbar (sidebar), Main (thread), ui/ primitives
│   │   ├── hooks/              # usePointer — spotlight + tilt
│   │   ├── utils/APIRoutes.js  # every endpoint URL
│   │   └── index.css           # Tailwind layers + component classes
│   ├── tailwind.config.js      # design tokens
│   └── .env
│
├── server/                     # Express API  →  server/README.md
│   ├── index.js                # bootstrap, CORS, static /image, Socket.IO
│   ├── controller/             # user.controller.js, chat.controller.js
│   ├── router/                 # user.router.js (+ Multer), chat.router.js
│   ├── models/                 # user.model.js, chat.model.js, connect_db.js
│   ├── images/                 # uploaded avatars, served at /image/<filename>
│   └── .env
│
└── Readme.md
```

Each half has its own README with the details:

- **[client/README.md](client/README.md)** — design tokens, component classes,
  the motion system, how the pointer hook works, data flow
- **[server/README.md](server/README.md)** — full API reference, socket events,
  schemas, upload handling, limitations

---

## Getting started

### Prerequisites

- **Node.js 16+** and npm (developed on Node 16.20.2 / npm 8.19.4)
- A **MongoDB** database — Atlas or local

### 1. Clone

```bash
git clone https://github.com/akotb14/chat-app.git
cd chat-app
```

### 2. Backend

```bash
cd server
npm install
npm start
```

Listens on port **5000** and logs `Connected to MongoDB`.

### 3. Frontend

In a second terminal:

```bash
cd client
npm install
npm start
```

Opens **http://localhost:3000**. Register two accounts (two browsers, or one
plus a private window) to watch messages move between them live.

---

## Configuration

### `server/.env`

```env
PORT = 5000
```

### `client/.env`

```env
REACT_APP_LOCALHOST_KEY="chat-app-current-user"
```

### Values that are currently hardcoded

These are not yet environment variables — change them in source when moving off
localhost:

| Value | Location |
| ----- | -------- |
| MongoDB connection string | [`server/models/connect_db.js`](server/models/connect_db.js) |
| Socket.IO allowed origin (`http://localhost:3000`) | [`server/index.js`](server/index.js) |
| API host (`http://localhost:5000`) | [`client/src/utils/APIRoutes.js`](client/src/utils/APIRoutes.js) |

---

## API at a glance

Full reference — payloads, validation rules, error shapes — in
[server/README.md](server/README.md).

| Method | Endpoint | Purpose |
| ------ | -------- | ------- |
| `POST` | `/api/register` | Create an account (multipart, optional avatar) |
| `POST` | `/api/login` | Sign in |
| `GET` | `/api/getUser/:id` | One user |
| `GET` | `/api/getUsers/:id` | Everyone except `:id`, plus who is online |
| `GET` | `/api/logout/:id` | Drop from the presence map |
| `POST` | `/api/postMessage` | Persist a message |
| `GET` | `/api/getMessages/:sender/:recieve` | Conversation history |
| `GET` | `/image/:filename` | Uploaded avatar |

**Socket events:** `add-user` and `send-msg` from the client; `msg-recieve` back.

Two contract quirks to know about:

1. **Validation failures return HTTP 200** with `{status: false, message}` in the
   body. Clients branch on `data.status`, not the status code.
2. **The receiver field is spelled `recieve`** (sic) in every route and payload.
   It is part of the wire contract — renaming it means changing both halves at
   once.

---

## Security status

Stated plainly, because a chat app that looks finished but isn't secure is worse
than one that says so:

| # | Issue | Fix |
| - | ----- | --- |
| 1 | **MongoDB credentials are committed** to `server/models/connect_db.js`, and `server/.env` is tracked by git | Rotate the Atlas password, move the URI to `MONGO_URI`, add `.env` to `.gitignore`, purge from history |
| 2 | **No signed session token.** Login returns the user object; the browser keeps it in `localStorage` | Issue a JWT at login, store it, send it as a bearer token |
| 3 | **No route is authenticated.** Anyone reaching the port can list all users or post a message as any `sender` id | Add an `authenticate` middleware in front of both routers |
| 4 | **Uploads are unrestricted** — any type, any size | Multer `fileFilter` + `limits` |
| 5 | **HTTP CORS is fully open** while the socket origin is pinned | Drive both from one config value |

Items 1–3 are the ones that matter. Everything else in this project works as
documented.

---

## Known limitations

- **Presence is per-process.** The `onlineUsers` map lives in memory: it resets on
  restart and cannot scale past one instance.
- **`msg-recieve` carries no sender id**, so the client attributes an arriving
  message to whichever thread is open — a message from a different contact lands
  in the wrong one.
- **No pagination.** A conversation loads in full, every time.
- **No read receipts, no live typing indicator.** The typing dots on the auth
  pages are a static mock.
- **No tests** on either side.

---

## Roadmap

**Correctness first**

- [ ] JWT auth + protected routes *(unblocks everything else)*
- [ ] Include the sender id in `msg-recieve`
- [ ] Move secrets to environment variables and rotate the exposed ones
- [ ] Message pagination

**Then features**

- [ ] Live typing indicator and real presence in the sidebar
- [ ] Read receipts
- [ ] Group conversations
- [ ] Image and file sharing
- [ ] Emoji picker, message reactions
- [ ] Push notifications

**Then infrastructure**

- [ ] Redis adapter for Socket.IO so presence survives scaling
- [ ] Object storage for avatars instead of local disk
- [ ] Unit and integration tests
- [ ] Dockerfile + CI

---

## What this project demonstrates

- Real-time bidirectional communication with Socket.IO, and the design decision
  of separating live delivery from durable persistence
- REST API design with Express, Mongoose schemas, and derived conversations
  (`$all` on a participants array rather than a conversation document)
- Password hashing and input validation on the server, never trusting the client
- React 18 patterns: effect cleanup that prevents duplicate socket listeners,
  keyed remounts on conversation switch, optimistic updates, object-URL lifecycle
  management under StrictMode
- A design system built from scratch — tokens, component classes, and a motion
  language — including compositor-only animation that never triggers a re-render

---

## Author

**Ahmed Mohamed Kotb** — Backend Developer (.NET & Node.js)

GitHub: [@akotb14](https://github.com/akotb14)

---

<div align="center">

If this project is useful to you, a ⭐ is appreciated.

</div>
