import React from "react";
import usePointer from "../../hooks/usePointer";

/**
 * Glass card with a rotating aurora border, cursor spotlight, and a small
 * pointer-tracked tilt. Used as the shell for both auth forms.
 */
function AuthCard({ children }) {
  const pointer = usePointer({ tilt: 3 });
  return (
    <div
      ref={pointer.ref}
      onPointerMove={pointer.onPointerMove}
      onPointerLeave={pointer.onPointerLeave}
      className="tilt animate-reveal-up"
    >
      <div className="aurora-border panel spotlight edge relative overflow-hidden rounded-2xl p-7 sm:p-8">
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

export default AuthCard;
