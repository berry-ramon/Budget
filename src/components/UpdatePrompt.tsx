import { useEffect, useRef } from "react";
import { useServiceWorkerUpdate } from "../hooks/useServiceWorkerUpdate";

/* =========================================================
   UPDATE PROMPT
   ---------------------------------------------------------
   Persistent modal — no dismiss button. The only way past
   it is to click "Refresh now".
   ========================================================= */

export function UpdatePrompt() {
  const { hasUpdate, isApplying, isOnline, applyUpdate } =
    useServiceWorkerUpdate();
  const buttonRef = useRef<HTMLButtonElement>(null);

  /* Focus the CTA when the modal appears */
  useEffect(() => {
    if (!hasUpdate) return;
    const t = window.setTimeout(() => buttonRef.current?.focus(), 100);
    return () => window.clearTimeout(t);
  }, [hasUpdate]);

  if (!hasUpdate) return null;

  return (
    <div
      className="update-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="update-title"
      aria-describedby="update-desc"
    >
      <div className="update-modal">
        <div className="update-icon" aria-hidden="true">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
        </div>

        <h2 id="update-title">Update available</h2>
        <p id="update-desc">
          A newer version of Pocket Plan is ready. Refresh now to get the latest
          improvements and fixes.
        </p>

        <div className="update-meta">
          <span className={isOnline ? "online" : "offline"}>
            <i /> {isOnline ? "Online" : "Offline"}
          </span>
        </div>

        <button
          ref={buttonRef}
          type="button"
          className="update-cta"
          onClick={applyUpdate}
          disabled={isApplying}
        >
          {isApplying ? "Refreshing…" : "Refresh now"}
        </button>

        <p className="update-note">
          Pocket Plan will reload and keep your data. Nothing will be lost.
        </p>
      </div>
    </div>
  );
}
