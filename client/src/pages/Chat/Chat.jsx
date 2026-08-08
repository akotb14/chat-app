import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";

import Navbar from "../../components/Navbar/Navbar";
import Main from "../../components/Main/Main";
import MeshBackdrop from "../../components/ui/MeshBackdrop";
import Logo from "../../components/ui/Logo";

import { host } from "../../utils/APIRoutes";

const Chat = () => {
  const socket = useRef();
  const [items] = useState(
    JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))
  );
  const [userState, setUser] = useState({});
  // On phones the sidebar and the thread cannot coexist; one owns the screen.
  const [mobileView, setMobileView] = useState("list");
  const navigator = useNavigate();

  useEffect(() => {
    if (items) {
      socket.current = io(host);
      socket.current.emit("add-user", items._id);
    }
    return () => socket.current?.disconnect();
  }, [items]);

  useEffect(() => {
    if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
      navigator("/register");
    }
  });

  const chatHandler = (e) => {
    setUser(e);
    setMobileView("thread");
  };

  if (!items) return <div />;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <MeshBackdrop intensity="soft" />

      <div className="relative z-10 mx-auto flex h-full w-full max-w-[1600px] gap-0 p-0 md:gap-4 md:p-4">
        {/* ---- Sidebar ---- */}
        <aside
          className={`h-full w-full shrink-0 md:w-[320px] lg:w-[360px] ${
            mobileView === "list" ? "flex" : "hidden"
          } md:flex`}
        >
          <Navbar
            items={items}
            chathand={chatHandler}
            activeId={userState._id}
          />
        </aside>

        {/* ---- Thread / empty state ---- */}
        <main
          className={`h-full min-w-0 flex-1 ${
            mobileView === "thread" ? "flex" : "hidden"
          } md:flex`}
        >
          {userState.username ? (
            <Main
              key={userState._id}
              user={userState}
              socket={socket}
              onBack={() => setMobileView("list")}
            />
          ) : (
            <EmptyState username={items.username} />
          )}
        </main>
      </div>
    </div>
  );
};

function EmptyState({ username }) {
  return (
    <div className="panel edge relative flex h-full w-full animate-reveal-up items-center justify-center overflow-hidden rounded-none md:rounded-2xl">
      <div className="relative max-w-md px-8 text-center">
        {/* Halo behind the mark so the empty pane still has a focal point */}
        <div
          className="pointer-events-none absolute left-1/2 top-4 h-56 w-56 -translate-x-1/2 rounded-full blur-[70px]"
          style={{ background: "rgba(79,124,255,.28)" }}
        />

        <div className="relative mx-auto flex justify-center">
          <Logo size="lg" />
        </div>

        <h2 className="relative mt-7 text-[26px] font-bold tracking-tight text-fg">
          Welcome back,{" "}
          <span className="text-aurora">{username}</span>
        </h2>
        <p className="relative mt-3 text-[15px] leading-relaxed text-fg-muted">
          Pick someone from the list to open a conversation. Messages arrive the
          instant they are sent — no refresh needed.
        </p>

        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-2">
          {[
            { icon: "bolt", label: "Realtime" },
            { icon: "lock", label: "Hashed auth" },
            { icon: "wifi_tethering", label: "Live presence" },
          ].map((f, i) => (
            <span
              key={f.label}
              className="inline-flex animate-reveal-up items-center gap-1.5 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[12.5px] font-medium text-fg-muted shadow-rim"
              style={{ animationDelay: `${0.25 + i * 0.09}s` }}
            >
              <span className="material-symbols-rounded text-[15px] text-accent-400">
                {f.icon}
              </span>
              {f.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Chat;
