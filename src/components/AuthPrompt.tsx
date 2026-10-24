import { useCallback, useState } from "react";
import { verifyPin } from "../lib/crypto";
import { verifyBiometric } from "../lib/webauthn";
import { PinInput } from "./PinInput";
import type { SecuritySettings } from "../App";

export function AuthPrompt({
  title = "Confirm it's you",
  message,
  security,
  onSuccess,
  onCancel,
}: {
  title?: string;
  message?: string;
  security: SecuritySettings;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const tryPin = useCallback(
    async (value: string) => {
      if (!security.pinHash || !security.pinSalt) return;
      setBusy(true);
      const ok = await verifyPin(value, security.pinHash, security.pinSalt);
      setBusy(false);
      if (ok) onSuccess();
      else {
        setError("Incorrect PIN");
        setPin("");
      }
    },
    [security.pinHash, security.pinSalt, onSuccess],
  );

  const tryBiometric = useCallback(async () => {
    if (!security.biometricCredentialId) return;
    setBusy(true);
    const ok = await verifyBiometric(security.biometricCredentialId);
    setBusy(false);
    if (ok) onSuccess();
    else setError("Biometric failed — use your PIN");
  }, [security.biometricCredentialId, onSuccess]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 380 }}
      >
        <header>
          <div>
            <small>Pocket Plan</small>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onCancel}
            aria-label="Close"
          >
            ×
          </button>
        </header>
        <div style={{ padding: "20px 20px 24px" }}>
          {message && (
            <p
              style={{
                color: "var(--muted)",
                fontSize: 13,
                marginBottom: 16,
                textAlign: "center",
              }}
            >
              {message}
            </p>
          )}

          <PinInput
            value={pin}
            onChange={setPin}
            length={4}
            autoFocus
            autoComplete={tryPin}
            error={!!error}
          />

          {error && <p className="form-error">{error}</p>}

          {security.biometricEnabled && security.biometricCredentialId && (
            <button
              type="button"
              className="button secondary full"
              onClick={tryBiometric}
              disabled={busy}
              style={{ marginTop: 12 }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                style={{ marginRight: 8 }}
              >
                <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
                <path d="M14 13.12c0 2.38 0 6.38-1 8.88" />
                <path d="M17.29 21.02c.12-.6.43-2.3.5-3.02" />
                <path d="M2 12a10 10 0 0 1 18-6" />
                <path d="M2 16h.01" />
                <path d="M21.8 16c.2-2 .131-5.354 0-6" />
                <path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2" />
                <path d="M8.65 22c.21-.66.45-1.32.57-2" />
                <path d="M9 6.8a6 6 0 0 1 9 5.2v2" />
              </svg>
              {busy ? "Checking…" : "Use biometrics"}
            </button>
          )}

          <button
            type="button"
            className="button ghost full"
            onClick={onCancel}
            disabled={busy}
            style={{ marginTop: 8 }}
          >
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}
