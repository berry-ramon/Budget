import { useEffect, useState } from "react";
import { usePWAInstall } from "../hooks/usePWAInstall";

const DISMISS_KEY = "pocket-plan-install-dismissed";
const DISMISS_DAYS = 14;
const DISMISS_MS = DISMISS_DAYS * 24 * 60 * 60 * 1000;

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    return Number.isFinite(ts) && Date.now() - ts < DISMISS_MS;
  } catch {
    return false;
  }
}

export function InstallPrompt({ enabled }: { enabled: boolean }) {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(recentlyDismissed);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  /* Debug log — remove after fixing */
  useEffect(() => {
    console.log("[InstallPrompt state]", {
      enabled,
      canInstall,
      isInstalled,
      isIOS,
      dismissed,
    });
  }, [enabled, canInstall, isInstalled, isIOS, dismissed]);

  /* Hide FAB while pill shows */
  useEffect(() => {
    const visible = enabled && canInstall && !dismissed && !isInstalled;
    document.body.classList.toggle("install-prompt-visible", visible);
    return () => {
      document.body.classList.remove("install-prompt-visible");
    };
  }, [enabled, canInstall, dismissed, isInstalled]);

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* private browsing */
    }
    setDismissed(true);
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSHint(true);
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "dismissed") {
      handleDismiss();
    } else if (outcome === "unavailable") {
      // No native prompt — show manual instructions
      setShowFallback(true);
    }
  };

  const showPill = enabled && canInstall && !dismissed && !isInstalled;

  return (
    <>
      {showPill && (
        <div
          className="install-prompt"
          role="dialog"
          aria-label="Install Pocket Plan"
        >
          <div className="install-prompt-icon" aria-hidden="true">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12M7 10l5 5 5-5" />
              <path d="M5 21h14" />
            </svg>
          </div>
          <div className="install-prompt-text">
            Install Pocket Plan for offline access
          </div>
          <button
            type="button"
            className="install-prompt-cta"
            onClick={handleInstall}
          >
            Install
          </button>
          <button
            type="button"
            className="install-prompt-dismiss"
            aria-label="Dismiss"
            onClick={handleDismiss}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {showIOSHint && (
        <div
          className="install-ios-hint"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowIOSHint(false)}
        >
          <div
            className="install-ios-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="install-ios-close"
              onClick={() => setShowIOSHint(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3>Install Pocket Plan</h3>
            <ol>
              <li>
                Tap the <strong>Share</strong> button in Safari.
              </li>
              <li>
                Scroll down and tap <strong>Add to Home Screen</strong>.
              </li>
              <li>
                Tap <strong>Add</strong> in the top-right corner.
              </li>
            </ol>
            <p>Pocket Plan will work offline once installed.</p>
          </div>
        </div>
      )}

      {showFallback && (
        <div
          className="install-ios-hint"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowFallback(false)}
        >
          <div
            className="install-ios-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="install-ios-close"
              onClick={() => setShowFallback(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h3>Install Pocket Plan</h3>
            <p style={{ paddingTop: 0, borderTop: 0, marginBottom: 16 }}>
              Your browser doesn't support one-click install. Here's how to add
              Pocket Plan to your home screen:
            </p>
            <ol>
              <li>Open your browser menu (⋮ or ••• in the corner).</li>
              <li>
                Look for <strong>"Install app"</strong> or{" "}
                <strong>"Add to Home screen"</strong>.
              </li>
              <li>Confirm — Pocket Plan will open as an app.</li>
            </ol>
          </div>
        </div>
      )}
    </>
  );
}
