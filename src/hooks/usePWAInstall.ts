import { useCallback, useEffect, useState } from "react";

/* =========================================================
   PWA INSTALL HOOK
   ---------------------------------------------------------
   Captures `beforeinstallprompt` as early as possible so
   it survives splash screens, StrictMode double-mounts, and
   route transitions.
   ========================================================= */

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

type WindowWithBIP = Window & { __BIP_EVENT__?: BIPEvent };

let deferredPrompt: BIPEvent | null = null;
let installedFlag = false;
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((fn) => fn());
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return (
    nav.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches
  );
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return isIOS || isIPadOS;
}

/* ---------- Attach listeners at module load ---------- */

if (typeof window !== "undefined") {
  installedFlag = detectStandalone();

  // Check if anything (like an inline script) already captured the event
  const preCaptured = (window as WindowWithBIP).__BIP_EVENT__;
  if (preCaptured) {
    deferredPrompt = preCaptured;
  }

  // Listen for the event if it hasn't fired yet
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event as BIPEvent;
    (window as WindowWithBIP).__BIP_EVENT__ = event as BIPEvent;
    notify();
  });

  window.addEventListener("appinstalled", () => {
    installedFlag = true;
    deferredPrompt = null;
    delete (window as WindowWithBIP).__BIP_EVENT__;
    notify();
  });

  const mql = window.matchMedia("(display-mode: standalone)");
  mql.addEventListener?.("change", (e) => {
    if (e.matches) {
      installedFlag = true;
      deferredPrompt = null;
      notify();
    }
  });
}

/* =========================================================
   HOOK
   ========================================================= */

export function usePWAInstall() {
  const [hasPrompt, setHasPrompt] = useState(!!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(installedFlag);

  useEffect(() => {
    const sync = () => {
      setHasPrompt(!!deferredPrompt);
      setIsInstalled(installedFlag);
    };
    sync();
    subscribers.add(sync);
    return () => {
      subscribers.delete(sync);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<
    "accepted" | "dismissed" | "unavailable"
  > => {
    const evt = deferredPrompt;
    if (!evt) {
      console.warn("[PWA] promptInstall called but no event available");
      return "unavailable";
    }
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      deferredPrompt = null;
      setHasPrompt(false);
      if (choice.outcome === "accepted") {
        installedFlag = true;
        setIsInstalled(true);
      }
      return choice.outcome;
    } catch (err) {
      console.error("[PWA] prompt failed:", err);
      return "unavailable";
    }
  }, []);

  const isIOS = detectIOS();

  return {
    canInstall: !isInstalled && (hasPrompt || isIOS),
    hasNativePrompt: !isInstalled && hasPrompt,
    isInstalled,
    isIOS,
    promptInstall,
  };
}
