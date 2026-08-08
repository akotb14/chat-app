import { useCallback, useEffect, useRef } from "react";

/**
 * Tracks the pointer over an element and writes it to CSS custom properties:
 *   --mx / --my  pointer position in px, consumed by `.spotlight`
 *   --rx / --ry  tilt angles in deg, consumed by `.tilt`
 *
 * Everything happens through style properties inside a rAF, so pointer motion
 * never triggers a React render.
 */
export default function usePointer({ tilt = 0 } = {}) {
  const ref = useRef(null);
  const frame = useRef(0);

  const onPointerMove = useCallback(
    (e) => {
      const el = ref.current;
      if (!el) return;
      // Read coordinates now — the event must not be referenced inside rAF.
      const { clientX, clientY } = e;
      if (frame.current) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = 0;
        const r = el.getBoundingClientRect();
        const x = clientX - r.left;
        const y = clientY - r.top;
        el.style.setProperty("--mx", `${x}px`);
        el.style.setProperty("--my", `${y}px`);
        if (tilt) {
          // Normalise to -1..1 around the centre, then scale to degrees.
          const nx = (x / r.width - 0.5) * 2;
          const ny = (y / r.height - 0.5) * 2;
          el.style.setProperty("--ry", `${nx * tilt}deg`);
          el.style.setProperty("--rx", `${-ny * tilt}deg`);
        }
      });
    },
    [tilt]
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }, []);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  return { ref, onPointerMove, onPointerLeave };
}
