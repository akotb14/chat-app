/**
 * Thin API client used for everything that should NOT happen on camera:
 * creating the supporting cast, and seeding conversation history so a thread
 * has something in it the moment it opens.
 *
 * Uses Playwright's own request context so the demo needs no HTTP dependency
 * (Node 16 has no global fetch).
 */

import fs from "fs";
import path from "path";
import { request } from "playwright";
import { APP } from "../config.mjs";
import { ensureAvatar } from "./avatars.mjs";

export async function makeApi() {
  const ctx = await request.newContext({ baseURL: APP.server, timeout: 30000 });

  /** The API answers validation failures with HTTP 200 + {status:false}. */
  const post = async (path, form) => {
    const res = await ctx.post(path, { form });
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`${path} returned non-JSON (${res.status()}): ${text.slice(0, 120)}`);
    }
  };

  const api = {
    /**
     * Registers a user, uploading their profile picture when one is configured.
     * The server reads the file from the `image` field and stores whatever
     * filename multer assigns; omitting the field entirely makes it fall back
     * to its own default avatar.
     */
    async register(u) {
      const fields = {
        username: u.username,
        email: u.email,
        password: u.password,
        confirmPassword: u.password,
      };

      const avatar = await ensureAvatar(u).catch(() => null);
      if (!avatar) return post("/api/register", fields);

      const res = await ctx.post("/api/register", {
        multipart: {
          ...fields,
          image: {
            name: path.basename(avatar),
            mimeType: "image/jpeg",
            buffer: fs.readFileSync(avatar),
          },
        },
      });
      return res.json();
    },

    async login(u) {
      return post("/api/login", { username: u.username, password: u.password });
    },

    /** Idempotent: signs in if the account exists, creates it otherwise. */
    async ensureUser(u) {
      const inResult = await api.login(u);
      if (inResult.status) return inResult.user;

      const upResult = await api.register(u);
      if (upResult.status) return upResult.user;

      // Registered previously with a different password — surface it clearly
      // rather than failing later with an empty sidebar.
      throw new Error(
        `Cannot provision "${u.username}": ${upResult.message || "unknown error"}`
      );
    },

    async postMessage(senderId, receiverId, message) {
      // `recieve` is the server's spelling. Part of the wire contract.
      return post("/api/postMessage", {
        sender: senderId,
        recieve: receiverId,
        message,
      });
    },

    async getMessages(a, b) {
      const res = await ctx.get(`/api/getMessages/${a}/${b}`);
      return res.json();
    },

    async isUp() {
      try {
        const res = await ctx.post("/api/login", {
          form: { username: "__ping__", password: "__ping__" },
        });
        return res.status() < 500;
      } catch {
        return false;
      }
    },

    async dispose() {
      await ctx.dispose();
    },
  };

  return api;
}
