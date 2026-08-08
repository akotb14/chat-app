import React, { useEffect } from "react";
import MeshBackdrop from "./MeshBackdrop";
import Logo from "./Logo";
import usePointer from "../../hooks/usePointer";

/**
 * Renders a headline where each word rises into place on its own delay.
 * Each word needs an overflow-hidden wrapper so it is masked before it
 * arrives rather than fading in from nowhere.
 */
function RevealHeadline({ lines, base = 0.15 }) {
  let n = 0;
  return (
    <h1 className="display text-[clamp(2.6rem,5.4vw,4.25rem)]">
      {lines.map((line, li) => (
        <span key={li} className="block overflow-hidden py-[0.06em]">
          <span className="flex flex-wrap gap-x-[0.26em]">
            {line.words.map((w, wi) => (
              <span
                key={wi}
                className={`inline-block animate-reveal-word ${
                  line.accent ? "text-aurora" : "text-fg"
                }`}
                style={{ animationDelay: `${base + n++ * 0.075}s` }}
              >
                {w}
              </span>
            ))}
          </span>
        </span>
      ))}
    </h1>
  );
}

/** Static mock thread — shows what the product looks like before signing in. */
function ThreadPreview() {
  const rows = [
    { mine: false, text: "Deploy went out 2 minutes ago 🚀" },
    { mine: true, text: "Nice. Any errors in the logs?" },
    { mine: false, text: "Clean so far. Latency is down 40%." },
  ];
  return (
    <div className="panel edge relative w-full max-w-sm overflow-hidden p-4">
      <div className="mb-3.5 flex items-center gap-2.5 border-b border-white/[0.07] pb-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span className="eyebrow">Live</span>
      </div>

      <div className="space-y-2">
        {rows.map((r, i) => (
          <div
            key={i}
            className={`flex animate-bubble-in ${
              r.mine ? "justify-end" : "justify-start"
            }`}
            style={{ animationDelay: `${0.9 + i * 0.22}s` }}
          >
            <div
              className={`max-w-[82%] rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug ${
                r.mine
                  ? "rounded-tr-md text-white shadow-glow"
                  : "rounded-tl-md border border-white/[0.09] bg-white/[0.05] text-fg"
              }`}
              style={
                r.mine
                  ? {
                      background:
                        "linear-gradient(135deg,#4F7CFF 0%,#3B63E8 60%,#22D3EE 150%)",
                    }
                  : undefined
              }
            >
              {r.text}
            </div>
          </div>
        ))}

        {/* Typing indicator — three dots on staggered delays */}
        <div
          className="flex animate-bubble-in justify-start"
          style={{ animationDelay: "1.56s" }}
        >
          <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-white/[0.09] bg-white/[0.05] px-3.5 py-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-typing rounded-full bg-fg-muted"
                style={{ animationDelay: `${i * 0.16}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthShell({ children }) {
  const pointer = usePointer();

  useEffect(() => {
    document.body.classList.add("allow-scroll");
    return () => document.body.classList.remove("allow-scroll");
  }, []);

  return (
    <div
      ref={pointer.ref}
      onPointerMove={pointer.onPointerMove}
      className="relative flex min-h-screen w-full flex-col"
    >
      <MeshBackdrop />

      <header className="relative z-10 px-6 py-6 sm:px-10 lg:px-14">
        <Logo />
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-center gap-14 px-6 pb-16 sm:px-10 lg:flex-row lg:items-center lg:gap-16 lg:px-14">
        {/* ---- Hero ---- */}
        <div className="order-2 w-full lg:order-1 lg:flex-1">
          <div
            className="mb-6 inline-flex animate-reveal-up items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 shadow-rim"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-aqua-400" />
            <span className="text-[12px] font-medium tracking-wide text-fg-muted">
              Powered by WebSockets
            </span>
          </div>

          <RevealHeadline
            lines={[
              { words: ["Talk", "in"] },
              { words: ["real", "time."], accent: true },
            ]}
          />

          <p
            className="mt-6 max-w-md animate-reveal-up text-[16px] leading-relaxed text-fg-muted"
            style={{ animationDelay: "0.55s" }}
          >
            Messages land the instant they are sent — no refresh, no polling.
            Credentials are hashed with bcrypt and every session is scoped to
            your account.
          </p>

          <div
            className="mt-10 hidden animate-reveal-up lg:block"
            style={{ animationDelay: "0.7s" }}
          >
            <ThreadPreview />
          </div>
        </div>

        {/* ---- Form ---- */}
        <div className="order-1 w-full max-w-[440px] lg:order-2 lg:w-[440px]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthShell;
