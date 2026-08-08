import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import Avatar from "../ui/Avatar";
import Logo from "../ui/Logo";
import usePointer from "../../hooks/usePointer";
import { getUsers, host, logout } from "../../utils/APIRoutes";

function Navbar({ items, chathand, activeId }) {
  const navigator = useNavigate();
  const pointer = usePointer();
  const [user, setUser] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    const response = async () => {
      try {
        const users = await axios.get(`${getUsers}/${items._id}`);
        if (!cancelled) setUser(users.data.user);
      } catch (e) {
        if (!cancelled) setUser([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    response();
    return () => {
      cancelled = true;
    };
  }, [items]);

  const chatHandler = (da) => {
    chathand(da);
  };

  const handerLogOut = async () => {
    try {
      await axios.get(`${logout}/${items._id}`);
    } finally {
      localStorage.clear();
      navigator("/login");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return user;
    return user.filter((u) => u.username?.toLowerCase().includes(q));
  }, [user, query]);

  return (
    <div
      ref={pointer.ref}
      onPointerMove={pointer.onPointerMove}
      className="panel spotlight edge relative flex h-full w-full animate-reveal-up flex-col overflow-hidden rounded-none md:rounded-2xl"
    >
      {/* ---- Brand ---- */}
      <div className="relative z-10 flex items-center justify-between border-b border-white/[0.07] px-4 py-3.5">
        <Logo />
        <button
          onClick={handerLogOut}
          title="Sign out"
          aria-label="Sign out"
          className="icon-btn hover:border-rose-400/40 hover:bg-rose-500/[0.12] hover:text-rose-300"
        >
          <span className="material-symbols-rounded text-[19px]">logout</span>
        </button>
      </div>

      {/* ---- Signed-in account ---- */}
      <div className="relative z-10 flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-3">
        <Avatar
          src={`${host}/image/${items.profileImage}`}
          alt={items.username}
          size={40}
          status
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">
            {items.username}
          </p>
          <p className="text-[13px] text-emerald-400">Online</p>
        </div>
      </div>

      {/* ---- Search ---- */}
      <div className="relative z-10 px-4 pb-2 pt-3.5">
        <div className="relative">
          <span className="material-symbols-rounded pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[19px] text-fg-faint">
            search
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search people"
            aria-label="Search people"
            className="field py-2 pl-[2.35rem] pr-3 text-sm"
          />
        </div>
      </div>

      {/* ---- People ---- */}
      <div className="relative z-10 flex items-baseline justify-between px-4 pb-1.5 pt-2.5">
        <h2 className="eyebrow">People</h2>
        <span className="text-[13px] tabular-nums text-fg-faint">
          {filtered.length}
        </span>
      </div>

      <div className="scroll-slim relative z-10 min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex animate-pulse items-center gap-3 rounded-xl px-2 py-2.5"
            >
              <div className="h-10 w-10 shrink-0 rounded-full bg-white/[0.06]" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 rounded-full bg-white/[0.06]" />
                <div className="h-2.5 w-1/3 rounded-full bg-white/[0.04]" />
              </div>
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <span className="material-symbols-rounded text-[32px] text-fg-faint">
              person_search
            </span>
            <p className="mt-1.5 text-sm text-fg-muted">
              {query ? "No one matches that search." : "No other users yet."}
            </p>
          </div>
        ) : (
          filtered.map((ele, i) => {
            const active = activeId === ele._id;
            return (
              <button
                key={ele._id}
                onClick={() => chatHandler(ele)}
                aria-current={active ? "true" : undefined}
                // Rows arrive one after another; capped so a long list does not
                // leave the last row waiting seconds to appear.
                style={{ animationDelay: `${Math.min(i, 12) * 0.045}s` }}
                className={`group relative flex w-full animate-reveal-up items-center gap-3 overflow-hidden rounded-xl px-2 py-2.5 text-left transition-all duration-200 ${
                  active
                    ? "border border-accent-500/35 bg-accent-500/[0.14] shadow-rim"
                    : "border border-transparent hover:-translate-y-px hover:border-white/[0.08] hover:bg-white/[0.05]"
                }`}
              >
                {/* Accent bar marks the open conversation */}
                <span
                  className={`absolute left-0 top-1/2 h-7 w-[3px] -translate-y-1/2 rounded-r-full transition-all duration-300 ${
                    active ? "opacity-100" : "opacity-0"
                  }`}
                  style={{
                    background: "linear-gradient(180deg,#4F7CFF,#22D3EE)",
                  }}
                />
                <Avatar
                  src={`${host}/image/${ele.profileImage}`}
                  alt={ele.username}
                  size={40}
                  ring={active}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">
                    {ele.username}
                  </p>
                  <p
                    className={`truncate text-[13px] ${
                      active ? "text-accent-300" : "text-fg-faint"
                    }`}
                  >
                    {active ? "Conversation open" : "Tap to chat"}
                  </p>
                </div>
                <span
                  className={`material-symbols-rounded text-[18px] transition-all duration-200 ${
                    active
                      ? "text-accent-400"
                      : "-translate-x-1 text-fg-faint opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                  }`}
                >
                  chevron_right
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default Navbar;
