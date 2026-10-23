import { useEffect } from "react";

export type ToastKind = "success" | "error" | "info";

function ToastIcon({ kind }: { kind: ToastKind }) {
  if (kind === "error") {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path d="M12 8v5M12 17h.01" />
      </svg>
    );
  }
  if (kind === "info") {
    return (
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    );
  }
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export function Toast({
  message,
  kind = "success",
  onDismiss,
  duration = 4000,
}: {
  message: string;
  kind?: ToastKind;
  onDismiss: () => void;
  duration?: number;
}) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, duration);
    return () => window.clearTimeout(timer);
  }, [message, duration, onDismiss]);

  return (
    <div className={`toast toast-${kind}`} role="status" aria-live="polite">
      <span className="toast-icon">
        <ToastIcon kind={kind} />
      </span>
      <span className="toast-message">{message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={onDismiss}
        aria-label="Dismiss notification"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden="true"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
      <i
        className="toast-progress"
        style={{ animationDuration: `${duration}ms` }}
      />
    </div>
  );
}
