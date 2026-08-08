import React from "react";

function Logo({ className = "", size = "md" }) {
  const big = size === "lg";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span
        className={`material-symbols-rounded relative flex items-center justify-center rounded-xl text-white shadow-glow ${
          big ? "h-11 w-11 text-[26px]" : "h-9 w-9 text-[21px]"
        }`}
        style={{
          background: "linear-gradient(135deg,#4F7CFF 0%,#3B63E8 55%,#22D3EE 130%)",
        }}
      >
        forum
      </span>
      <span
        className={`font-bold tracking-tight text-fg ${
          big ? "text-[22px]" : "text-[17px]"
        }`}
      >
        ChatApp
      </span>
    </div>
  );
}

export default Logo;
