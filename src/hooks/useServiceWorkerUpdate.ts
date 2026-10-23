import { useCallback, useEffect, useRef, useState } from "react";

/* =========================================================
   SERVICE WORKER UPDATE HOOK
   ---------------------------------------------------------
   Detects waiting service workers and exposes:
     - hasUpdate  → a new version is ready
     - isOnline   → current network state
     - applyUpdate → activates the waiting SW and reloads
   Also triggers an update check:
     - when the network comes back online
     - every 60 seconds while online
     - when the tab becomes visible again
   ========================================================= */

type UpdateStatus = "idle" | "available" | "applying";

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export function useServiceWorkerUpdate() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const applyingRef = useRef(false);

  /* ---------- Detect waiting SWs ---------- */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (typeof window === "undefined") return;
    if (!import.meta.env.PROD) return; // skip in dev

    let cancelled = false;

    const handleWaiting = (reg: ServiceWorkerRegistration) => {
      if (cancelled) return;
      registrationRef.current = reg;
      // Only show if we're not already in the middle of applying
      if (!applyingRef.current) {
        setStatus("available");
      }
    };

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      if (cancelled) return;
      registrationRef.current = reg;

      // Already-waiting SW (e.g. page reloaded after update installed)
      if (reg.waiting && navigator.serviceWorker.controller) {
        handleWaiting(reg);
      }

      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (
            installing.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            handleWaiting(reg);
          }
        });
      });
    });

    /* Reload when the new SW takes over (after SKIP_WAITING) */
    const onControllerChange = () => {
      if (applyingRef.current) {
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    /* Check for updates on visibility + online + interval */
    const checkForUpdate = () => {
      if (!navigator.onLine) return;
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.update())
        .catch(() => {});
    };

    const onOnline = () => {
      setIsOnline(true);
      checkForUpdate();
    };
    const onOffline = () => setIsOnline(false);
    const onVisibility = () => {
      if (document.visibilityState === "visible") checkForUpdate();
    };

    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(checkForUpdate, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
    };
  }, []);

  /* ---------- Apply the update ---------- */
  const applyUpdate = useCallback(() => {
    const reg = registrationRef.current;
    if (!reg) {
      window.location.reload();
      return;
    }
    applyingRef.current = true;
    setStatus("applying");

    const waiting = reg.waiting;
    if (waiting) {
      // Tell the SW to skipWaiting → it activates →
      // controllerchange fires → we reload
      waiting.postMessage({ type: "SKIP_WAITING" });
      // Safety net: if controllerchange doesn't fire in 3s, reload anyway
      window.setTimeout(() => {
        if (applyingRef.current) window.location.reload();
      }, 3000);
    } else {
      // No waiting SW — just reload
      window.location.reload();
    }
  }, []);

  return {
    hasUpdate: status === "available" || status === "applying",
    isApplying: status === "applying",
    isOnline,
    isStandalone: isStandalone(),
    applyUpdate,
  };
}
