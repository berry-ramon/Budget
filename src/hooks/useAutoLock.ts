import { useEffect, useRef } from "react";

export function useAutoLock({
  enabled,
  minutes,
  onLock,
}: {
  enabled: boolean;
  minutes: number;
  onLock: () => void;
}) {
  const onLockRef = useRef(onLock);
  useEffect(() => {
    onLockRef.current = onLock;
  });

  useEffect(() => {
    if (!enabled || minutes <= 0) return;
    const timeoutMs = minutes * 60 * 1000;
    let timer = window.setTimeout(() => onLockRef.current(), timeoutMs);

    const reset = () => {
      localStorage.setItem("pocket-plan-last-active", String(Date.now()));
      window.clearTimeout(timer);
      timer = window.setTimeout(() => onLockRef.current(), timeoutMs);
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        localStorage.setItem("pocket-plan-last-active", String(Date.now()));
        window.clearTimeout(timer);
      } else {
        const last = Number(
          localStorage.getItem("pocket-plan-last-active") || 0,
        );
        if (last && Date.now() - last >= timeoutMs) {
          onLockRef.current();
        } else {
          reset();
        }
      }
    };

    window.addEventListener("mousedown", reset);
    window.addEventListener("keydown", reset);
    window.addEventListener("touchstart", reset, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("mousedown", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("touchstart", reset);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, minutes]);
}
