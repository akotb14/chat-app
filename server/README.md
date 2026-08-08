# ChatApp — Server

REST + WebSocket backend for ChatApp. Express 5-style ESM on Express 4, MongoDB via
Mongoose, real-time delivery through Socket.IO, avatar uploads through Multer.

- **Runtime:** Node.js (ESM — `"type": "module"`)
- **HTTP:** Express 4.18
- **Realtime:** Socket.IO 4.5
- **Database:** MongoDB (Mongoose 6)
- **Passwords:** bcrypt, cost factor 10
- **Uploads:** Multer, disk storage

---

## Quick start

```bash
cd server
npm install
npm start          # nodemon index.js
```

The server listens on `PORT` (default in `.env` is `5000`) and prints
`listening on port 5000` followed by `Connected to MongoDB`.

### Environment

`server/.env`:

```env
PORT = 5000
```

> **The MongoDB connection string is currently hardcoded** in
> [models/connect_db.js](models/connect_db.js) rather than read from the
> environment — see [Security notes](#security-notes) before deploying or
> sharing this repository.

---

## Project layout

```
server/
├── index.js                      # app bootstrap, CORS, static /image, Socket.IO
├── controller/
│   ├── user.controller.js        # register, login, getUser, getUsers, logout
│   └── chat.controller.js        # postMessage, getMessages
├── router/
│   ├── user.router.js            # + Multer disk-storage config
│   └── chat.router.js
├── models/
│   ├── user.model.js             # Users schema
│   ├── chat.model.js             # Chats schema
│   └── connect_db.js             # Mongoose connection
├── images/                       # uploaded avatars, served at /image/<filename>
└── .env
```

---

## HTTP API

All routes are mounted under `/api`.

| Method | Path | Payload | Success response |
| ------ | ---- | ------- | ---------------- |
| `POST` | `/api/register` | `multipart/form-data` — `username`, `email`, `password`, `confirmPassword`, `image` *(optional)* | `{ status: true, user }` |
| `POST` | `/api/login` | JSON — `username`, `password` | `{ status: true, message, user }` |
| `GET` | `/api/getUser/:id` | — | `{ status: true, user }` |
| `GET` | `/api/getUsers/:id` | — | `{ status: true, user: [...], newOnlineUser: [...] }` |
| `GET` | `/api/logout/:id` | — | `200` with an empty body |
| `POST` | `/api/postMessage` | JSON — `sender`, `recieve`, `message` | `{ status: true }` |
| `GET` | `/api/getMessages/:sender/:recieve` | — | `{ status: true, getMessage, messageSender }` |
| `GET` | `/image/:filename` | — | the image file (static) |

> **Spelling:** the receiver parameter is `recieve` (sic) throughout the API and
> the socket payloads. It is part of the wire contract — renaming it means
> changing the client in lockstep.

### Error convention

Validation and auth failures return **HTTP 200** with `status: false` and a
human-readable `message`. Only unexpected exceptions use a 4xx/5xx status.

```jsonc
// POST /api/login with a wrong password → 200 OK
{ "status": false, "message": "username or email or password is not correct" }
```

Clients must therefore branch on `data.status`, not on the HTTP status code —
which is exactly what `client/src/pages/Login/Login.jsx` does.

### Registration rules

Enforced in `addUser` before anything touches the database:

| Field | Rule |
| ----- | ---- |
| `username` | required, 3–19 characters, unique |
| `email` | required, valid per `validator.isEmail`, under 50 characters, unique |
| `password` | required, at least 6 characters, must equal `confirmPassword` |
| `image` | optional — omitted uploads fall back to a bundled default avatar |

Passwords are hashed with `bcrypt.hash(password, 10)`. The stored hash is never
returned: `login` builds an explicit `{_id, username, email, profileImage}`
object, and `getUser`/`getUsers` project `password` out of the query.

### Avatar uploads

`POST /api/register` runs through `upload.single("image")`. Files land in
`server/images/` named `<epoch-ms>_<original-name-with-spaces-dashed>`, and the
generated filename is what gets stored on the user document. The folder is
exposed read-only at `/image`, so a stored `profileImage` of `1677166345470_kotb.jpeg`
is fetched as:

```
GET http://localhost:5000/image/1677166345470_kotb.jpeg
```

---

## Socket.IO

The Socket.IO server is attached to the same HTTP server and accepts connections
from `http://localhost:3000` only (hardcoded in [index.js](index.js)).

| Direction | Event | Payload |
| --------- | ----- | ------- |
| client → server | `add-user` | `userId` — registers the socket in the presence map |
| client → server | `send-msg` | `{ sender, recieve, message }` |
| server → client | `msg-recieve` | `message` *(the text only)* |

Presence lives in `global.onlineUsers`, a `Map<userId, socketId>` held in process
memory. `send-msg` looks up the recipient's socket and forwards to it; if the
recipient is offline the event is dropped — the message still persists, because
the client also `POST`s it to `/api/postMessage`.

**Persistence and delivery are independent paths.** The socket carries the live
copy, the REST call writes the durable one. Neither one waits on the other.

---

## Data models

### `Users`

```js
{
  username:     String,  // required, unique, 3–20
  email:        String,  // required, unique, max 50
  password:     String,  // bcrypt hash
  profileImage: String,  // filename inside server/images/
}
```

### `Chats`

```js
{
  message: { text: String },        // required
  users:   Array,                   // [senderId, receiverId] — queried with $all
  sender:  ObjectId,                // ref: "User"
  createdAt, updatedAt              // timestamps: true
}
```

A conversation is not a document — it is derived. `getMessages` finds every chat
whose `users` array contains **both** ids (`$all`), sorted by `updatedAt`, and
flattens each to `{message, sender}` for the client.

---

## Security notes

This is a portfolio/learning project, and the auth model reflects that. Read this
section before deploying it anywhere public.

1. **Database credentials are committed to the repository.**
   [models/connect_db.js](models/connect_db.js) contains a live MongoDB Atlas
   connection string including username and password. Anyone with the repo has
   full read/write access to the cluster. **Rotate that password**, move the URI
   into `MONGO_URI` in `.env`, and add `.env` to `.gitignore` (it is currently
   tracked).

2. **There is no session token.** `POST /api/login` returns the user object and
   the browser keeps it in `localStorage`. Nothing is signed, so nothing can be
   verified on a later request.

3. **No route is authenticated.** Every endpoint is reachable by anyone who can
   reach the port. `GET /api/getUsers/:id` enumerates the whole user table, and
   `POST /api/postMessage` accepts any `sender` id you care to put in the body —
   messages can be forged as any user. Adding JWT issuance at login plus an
   `authenticate` middleware in front of the routers is the single highest-value
   fix here.

4. **Uploads are unrestricted.** Multer accepts any file type and any size under
   the `image` field. Add `fileFilter` and `limits`.

5. **CORS is wide open for HTTP** (`app.use(cors())`) while the Socket.IO origin
   is pinned to `localhost:3000` — worth making both read from one config value.

---

## Known limitations

- **Presence is per-process.** `global.onlineUsers` resets on restart and does
  not survive horizontal scaling; multiple instances would each see a different
  slice of who is online. A shared store (Redis adapter) is the usual answer.
- **`msg-recieve` carries no sender id.** The receiving client attributes the
  arriving text to whichever conversation is currently open, so a message from a
  *different* contact lands in the wrong thread while that thread is focused.
  Emitting `{sender, message}` and filtering on the client fixes it.
- **No pagination.** `getMessages` returns every message in the conversation.
- **No delivery/read receipts, no typing events** — the client's typing
  indicator on the login page is a static mock, not a live signal.
- **No tests.** `npm test` is still the placeholder.
