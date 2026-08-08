import React from "react";

/**
 * Animated mesh-gradient backdrop.
 *
 * Four large radial blobs on independent drift timings, each blurred hard
 * enough that the edges never resolve — so the composite reads as one moving
 * gradient field rather than four circles. Everything animates on `transform`
 * only, which keeps it on the compositor.
 *
 * `intensity="soft"` is the in-app variant: same field, much lower alpha, so
 * chat content stays readable on top of it.
 */
function MeshBackdrop({ intensity = "full" }) {
  const soft = intensity === "soft";
  const a = soft ? 0.45 : 1;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-night-950" />

      <div
        className="absolute -left-[18%] -top-[22%] h-[46rem] w-[46rem] animate-mesh-a rounded-full blur-[120px]"
        style={{ background: `rgba(79,124,255,${0.34 * a})` }}
      />
      <div
        className="absolute -right-[14%] top-[6%] h-[40rem] w-[40rem] animate-mesh-b rounded-full blur-[130px]"
        style={{ background: `rgba(34,211,238,${0.2 * a})` }}
      />
      <div
        className="absolute -bottom-[26%] left-[22%] h-[44rem] w-[44rem] animate-mesh-c rounded-full blur-[140px]"
        style={{ background: `rgba(59,99,232,${0.3 * a})` }}
      />
      <div
        className="absolute bottom-[8%] right-[16%] h-[26rem] w-[26rem] animate-mesh-a rounded-full blur-[100px]"
        style={{
          background: `rgba(165,190,255,${0.14 * a})`,
          animationDelay: "-13s",
        }}
      />

      {/* Hairline grid gives the field a sense of scale */}
      <div
        className="absolute inset-0"
        style={{
          opacity: soft ? 0.035 : 0.06,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse at 50% 40%, #000 20%, transparent 78%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at 50% 40%, #000 20%, transparent 78%)",
        }}
      />

      {/* Noise kills the banding that large blurred gradients produce on 8-bit displays */}
      <div
        className="absolute inset-0 opacity-[0.22] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,transparent_28%,rgba(8,8,10,.82)_100%)]" />
    </div>
  );
}

export default MeshBackdrop;
