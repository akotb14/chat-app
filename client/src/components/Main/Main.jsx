import React, { useEffect, useRef, useState } from "react";
import axios from "axios";

import Avatar from "../ui/Avatar";
import usePointer from "../../hooks/usePointer";
import { getMessages, host, postMessage } from "../../utils/APIRoutes";

function Main({ user, socket, onBack }) {
  const pointer = usePointer();
  const [message, setMessage] = useState("");
  const [sendMessage, setSendMessage] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [items] = useState(
    JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))
  );
  const bottomRef = useRef();

  useEffect(() => {
    let cancelled = false;
    const getData = async () => {
      setLoading(true);
      try {
        const data = await axios.get(`${getMessages}/${items._id}/${user._id}`);
        if (!cancelled) setSendMessage(data.data.messageSender || []);
      } catch (e) {
        if (!cancelled) setSendMessage([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    getData();
    return () => {
      cancelled = true;
    };
  }, [user._id, items._id]);

  const postMessageHandler = async (e) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || sending) return;

    setSending(true);
    socket.current.emit("send-msg", {
      sender: items._id,
      recieve: user._id,
      message: text,
    });
    // Echo locally first so the bubble lands immediately, then persist.
    setSendMessage((prev) => [...prev, { message: text, sender: items._id }]);
    setMessage("");
    try {
      await axios.post(postMessage, {
        message: text,
        sender: items._id,
        recieve: user._id,
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const s = socket.current;
    if (!s) return;
    const handler = (mge) =>
      setArrivalMessage({ sender: user._id, message: mge });
    s.on("msg-recieve", handler);
    // Without this the handler stacks up on every switch and duplicates messages.
    return () => s.off("msg-recieve", handler);
  }, [socket, user._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [sendMessage, loading]);

  useEffect(() => {
    arrivalMessage && setSendMessage((prev) => [...prev, arrivalMessage]);
  }, [arrivalMessage]);

  const visible = sendMessage.filter((c) => c && c.message);

  return (
    <div
      ref={pointer.ref}
      onPointerMove={pointer.onPointerMove}
      className="panel spotlight edge relative flex h-full w-full animate-reveal-up flex-col overflow-hidden rounded-none md:rounded-2xl"
    >
      {/* ---- Thread header ---- */}
      <header className="relative z-10 flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.02] px-4 py-3">
        <button
          onClick={onBack}
          aria-label="Back to people list"
          className="icon-btn md:hidden"
        >
          <span className="material-symbols-rounded text-[19px]">
            arrow_back
          </span>
        </button>
        <Avatar
          src={`${host}/image/${user.profileImage}`}
          alt={user.username}
          size={40}
          status
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-fg">
            {user.username}
          </p>
          <p className="flex items-center gap-1.5 text-[13px] text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Active now
          </p>
        </div>
        <span className="material-symbols-rounded hidden text-[18px] text-fg-faint sm:block">
          bolt
        </span>
      </header>

      {/* ---- Messages ---- */}
      <div className="scroll-slim relative z-10 min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="h-9 animate-pulse rounded-2xl bg-white/[0.06]"
                  style={{ width: `${34 + (i % 3) * 14}%` }}
                />
              </div>
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="material-symbols-rounded grid h-14 w-14 place-items-center rounded-2xl border border-white/[0.09] bg-white/[0.04] text-[26px] text-accent-400 shadow-rim">
              chat_bubble
            </span>
            <p className="mt-4 text-[15px] font-semibold text-fg">
              No messages yet
            </p>
            <p className="mt-1 text-sm text-fg-muted">
              Say hello to {user.username} — it lands instantly.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {visible.map((chatt, i) => {
              const mine = items._id === chatt.sender;
              const prev = visible[i - 1];
              // Only the first bubble of a run gets the squared corner + gap.
              const startsRun = !prev || prev.sender !== chatt.sender;
              return (
                <div
                  key={i}
                  className={`flex animate-bubble-in ${
                    mine ? "justify-end" : "justify-start"
                  } ${startsRun ? "pt-3 first:pt-0" : ""}`}
                >
                  <div
                    className={`max-w-[80%] break-words rounded-2xl px-3.5 py-2 text-[15px] leading-relaxed sm:max-w-[65%] ${
                      mine
                        ? "text-white shadow-glow"
                        : "border border-white/[0.09] bg-white/[0.055] text-fg shadow-rim backdrop-blur-sm"
                    } ${
                      startsRun ? (mine ? "rounded-tr-md" : "rounded-tl-md") : ""
                    }`}
                    style={
                      mine
                        ? {
                            background:
                              "linear-gradient(135deg,#4F7CFF 0%,#3B63E8 60%,#22D3EE 165%)",
                          }
                        : undefined
                    }
                  >
                    {chatt.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ---- Composer ---- */}
      <form
        onSubmit={postMessageHandler}
        className="relative z-10 flex items-center gap-2.5 border-t border-white/[0.07] bg-white/[0.02] px-4 py-3"
      >
        <Avatar
          src={`${host}/image/${items.profileImage}`}
          alt={items.username}
          size={34}
          className="hidden sm:block"
        />
        <input
          type="text"
          placeholder={`Message ${user.username}…`}
          value={message}
          name="message"
          autoComplete="off"
          aria-label="Message"
          onChange={(e) => setMessage(e.target.value)}
          className="field flex-1 py-2.5"
        />
        <button
          type="submit"
          disabled={!message.trim() || sending}
          aria-label="Send message"
          className="btn-primary h-11 w-11 shrink-0 rounded-xl px-0 py-0"
        >
          <span className="material-symbols-rounded text-[20px]">send</span>
        </button>
      </form>
    </div>
  );
}

export default Main;
