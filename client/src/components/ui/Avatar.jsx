import React from "react";

/**
 * Avatar with a gradient rim and, when online, an expanding pulse ring.
 * `status` is true (online) / false (offline) / null (no dot).
 */
function Avatar({
  src,
  alt = "avatar",
  size = 40,
  status = null,
  ring = true,
  className = "",
}) {
  const dot = Math.max(10, size * 0.27);
  return (
    <div
      className={`relative shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {ring && (
        <span
          className="absolute -inset-px rounded-full opacity-70"
          style={{
            background:
              "linear-gradient(140deg,#4F7CFF,#22D3EE 60%,rgba(255,255,255,.15))",
          }}
        />
      )}
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="relative h-full w-full rounded-full bg-night-800 object-cover"
        style={ring ? { padding: 1.5 } : undefined}
      />
      {status !== null && (
        <span
          className="absolute bottom-0 right-0 grid place-items-center"
          style={{ width: dot, height: dot }}
        >
          {status && (
            <span className="absolute inset-0 animate-pulse-dot rounded-full bg-emerald-400" />
          )}
          <span
            className={`relative h-full w-full rounded-full border-2 border-night-900 ${
              status ? "bg-emerald-400" : "bg-night-500"
            }`}
          />
        </span>
      )}
    </div>
  );
}

export default Avatar;
