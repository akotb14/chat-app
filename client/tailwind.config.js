/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Josefin Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        // Achromatic near-black spine. Deliberately NOT tinted — the colour in
        // this design comes from the accent and the mesh, never the surfaces.
        night: {
          950: "#08080A",
          900: "#0C0D11",
          850: "#111217",
          800: "#16171D",
          700: "#1D1F26",
          600: "#282A33",
          500: "#3A3D48",
        },
        fg: {
          DEFAULT: "#EDEFF5",
          muted: "#9BA3B4",
          faint: "#666D7D",
        },
        // One accent family only: electric blue sliding to cyan.
        accent: {
          300: "#A5BEFF",
          400: "#7BA0FF",
          500: "#4F7CFF",
          600: "#3B63E8",
          700: "#2C4BC4",
        },
        aqua: {
          300: "#67E8F9",
          400: "#22D3EE",
          500: "#06B6D4",
        },
      },
      boxShadow: {
        e1: "0 1px 2px rgba(0,0,0,.45)",
        e2: "0 2px 4px rgba(0,0,0,.35), 0 8px 24px -4px rgba(0,0,0,.5)",
        e3: "0 4px 12px rgba(0,0,0,.4), 0 20px 50px -12px rgba(0,0,0,.65)",
        // Rim light along the top edge — how a glass surface reads as lit.
        rim: "inset 0 1px 0 rgba(255,255,255,.09)",
        "rim-strong": "inset 0 1px 0 rgba(255,255,255,.16)",
        glow: "0 8px 32px -8px rgba(79,124,255,.55)",
        "glow-lg": "0 12px 48px -8px rgba(79,124,255,.6)",
        ring: "0 0 0 3px rgba(79,124,255,.28)",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(.34,1.56,.64,1)",
        smooth: "cubic-bezier(.16,1,.3,1)",
      },
      keyframes: {
        // Three independent drift paths so the mesh never visibly loops.
        "mesh-a": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1)" },
          "33%": { transform: "translate3d(8%,-10%,0) scale(1.18)" },
          "66%": { transform: "translate3d(-6%,7%,0) scale(.9)" },
        },
        "mesh-b": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(1.05)" },
          "40%": { transform: "translate3d(-12%,8%,0) scale(.88)" },
          "70%": { transform: "translate3d(7%,10%,0) scale(1.22)" },
        },
        "mesh-c": {
          "0%,100%": { transform: "translate3d(0,0,0) scale(.95)" },
          "50%": { transform: "translate3d(10%,12%,0) scale(1.15)" },
        },
        "reveal-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "reveal-word": {
          "0%": { opacity: "0", transform: "translateY(100%) rotate(4deg)" },
          "100%": { opacity: "1", transform: "translateY(0) rotate(0deg)" },
        },
        "bubble-in": {
          "0%": { opacity: "0", transform: "translateY(10px) scale(.9)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "spin-slow": {
          // Consumed by `.aurora-border` in index.css, not via an animate-*
          // utility — but keeping it here documents it as part of the system.
          to: { transform: "rotate(1turn)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        "pulse-dot": {
          "0%": { transform: "scale(.9)", opacity: ".8" },
          "70%,100%": { transform: "scale(2.2)", opacity: "0" },
        },
        typing: {
          "0%,60%,100%": { transform: "translateY(0)", opacity: ".35" },
          "30%": { transform: "translateY(-4px)", opacity: "1" },
        },
      },
      animation: {
        "mesh-a": "mesh-a 26s ease-in-out infinite",
        "mesh-b": "mesh-b 34s ease-in-out infinite",
        "mesh-c": "mesh-c 30s ease-in-out infinite",
        "reveal-up": "reveal-up .7s cubic-bezier(.16,1,.3,1) both",
        "reveal-word": "reveal-word .8s cubic-bezier(.16,1,.3,1) both",
        "bubble-in": "bubble-in .38s cubic-bezier(.34,1.56,.64,1) both",
        "spin-slow": "spin-slow 6s linear infinite",
        shimmer: "shimmer 6s linear infinite",
        "pulse-dot": "pulse-dot 2.4s cubic-bezier(0,0,.2,1) infinite",
        typing: "typing 1.3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
