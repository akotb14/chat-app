/**
 * Synthetic cursor.
 *
 * Playwright's mouse events are dispatched straight into the renderer through
 * CDP — they never move the physical OS pointer. A screen recorder therefore
 * captures a page reacting to hovers and clicks with no visible cursor at all.
 *
 * So we draw our own: a pointer that listens for the same synthetic events and
 * follows them, plus a ripple on click. Because it is injected via
 * addInitScript it survives navigation, and because it lives in its own
 * container with pointer-events:none it can never intercept a real click.
 */

export const CURSOR_SCRIPT = `
(() => {
  if (window.__demoCursorInstalled) return;
  window.__demoCursorInstalled = true;

  const mount = () => {
    if (!document.body || document.getElementById("__demo-cursor")) return;

    const style = document.createElement("style");
    style.textContent = \`
      #__demo-cursor-layer {
        position: fixed; inset: 0; z-index: 2147483647;
        pointer-events: none; overflow: hidden;
      }
      #__demo-cursor {
        position: absolute; top: 0; left: 0; width: 24px; height: 24px;
        margin: -2px 0 0 -2px;
        transition: transform .09s cubic-bezier(.22,1,.36,1);
        will-change: transform;
      }
      #__demo-cursor svg { display: block; filter: drop-shadow(0 2px 5px rgba(0,0,0,.55)); }
      #__demo-cursor.is-down { transform-origin: 3px 3px; }
      .__demo-ripple {
        position: absolute; width: 14px; height: 14px; margin: -7px 0 0 -7px;
        border-radius: 9999px; border: 2px solid rgba(79,124,255,.95);
        background: rgba(79,124,255,.22);
        animation: __demo-ripple .5s cubic-bezier(.16,1,.3,1) forwards;
      }
      @keyframes __demo-ripple {
        from { transform: scale(.35); opacity: 1; }
        to   { transform: scale(3.1); opacity: 0; }
      }
    \`;
    document.head.appendChild(style);

    const layer = document.createElement("div");
    layer.id = "__demo-cursor-layer";

    const cur = document.createElement("div");
    cur.id = "__demo-cursor";
    // Standard arrow pointer: white fill, dark outline, so it reads on any
    // background — including this app's near-black one.
    cur.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" fill="none">' +
      '<path d="M5 2.5 L5 19.2 L9.3 15.1 L12.1 21.4 L15.1 20.1 L12.3 13.9 L18.2 13.6 Z" ' +
      'fill="#fff" stroke="#0b0b0e" stroke-width="1.4" stroke-linejoin="round"/></svg>';

    layer.appendChild(cur);
    document.documentElement.appendChild(layer);

    let x = window.innerWidth / 2, y = window.innerHeight / 2;
    const draw = () => { cur.style.transform = \`translate3d(\${x}px, \${y}px, 0)\`; };
    draw();

    window.addEventListener("mousemove", (e) => {
      x = e.clientX; y = e.clientY; draw();
    }, true);

    window.addEventListener("mousedown", () => {
      cur.style.transform = \`translate3d(\${x}px, \${y}px, 0) scale(.82)\`;
      const r = document.createElement("div");
      r.className = "__demo-ripple";
      r.style.left = x + "px";
      r.style.top = y + "px";
      layer.appendChild(r);
      setTimeout(() => r.remove(), 520);
    }, true);

    window.addEventListener("mouseup", draw, true);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
  // The app is an SPA; re-mount if a route swap ever detaches the layer.
  setInterval(mount, 1000);
})();
`;

/**
 * Optional caption bar. Handy for a silent GIF where there is no voiceover to
 * carry the explanation — call showCaption(page, "...") from a scene.
 */
export const CAPTION_SCRIPT = `
(() => {
  if (window.__demoCaptionInstalled) return;
  window.__demoCaptionInstalled = true;
  window.__demoCaption = (text) => {
    let el = document.getElementById("__demo-caption");
    if (!el) {
      el = document.createElement("div");
      el.id = "__demo-caption";
      el.style.cssText = [
        "position:fixed","left:50%","bottom:38px","transform:translateX(-50%) translateY(12px)",
        "z-index:2147483646","pointer-events:none","max-width:76vw",
        "padding:12px 22px","border-radius:14px",
        "background:rgba(12,13,17,.86)","backdrop-filter:blur(14px)",
        "border:1px solid rgba(255,255,255,.12)",
        "box-shadow:0 12px 40px -8px rgba(0,0,0,.7)",
        "font:600 16px/1.4 'Josefin Sans',system-ui,sans-serif",
        "color:#EDEFF5","text-align:center","letter-spacing:.01em",
        "opacity:0","transition:opacity .35s ease, transform .35s cubic-bezier(.16,1,.3,1)",
      ].join(";");
      document.documentElement.appendChild(el);
    }
    if (text === null) {
      el.style.opacity = "0";
      el.style.transform = "translateX(-50%) translateY(12px)";
      return;
    }
    el.textContent = text;
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translateX(-50%) translateY(0)";
    });
  };
})();
`;
