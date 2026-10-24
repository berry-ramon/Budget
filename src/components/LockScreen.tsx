import { useCallback, useState } from "react";
import { verifyPin } from "../lib/crypto";
import { verifyBiometric } from "../lib/webauthn";
import { PinInput } from "./PinInput";
import type { SecuritySettings } from "../App";

export function LockScreen({
  security,
  onSuccess,
}: {
  security: SecuritySettings;
  onSuccess: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [biometricBusy, setBiometricBusy] = useState(false);

  const tryPin = useCallback(
    async (value: string) => {
      if (!security.pinHash || !security.pinSalt) return;
      setChecking(true);
      const ok = await verifyPin(value, security.pinHash, security.pinSalt);
      setChecking(false);
      if (ok) {
        onSuccess();
      } else {
        setError("Incorrect PIN");
        setPin("");
        setAttempts((a) => a + 1);
      }
    },
    [security.pinHash, security.pinSalt, onSuccess],
  );

  const tryBiometric = useCallback(async () => {
    if (!security.biometricCredentialId) return;
    setBiometricBusy(true);
    const ok = await verifyBiometric(security.biometricCredentialId);
    setBiometricBusy(false);
    if (ok) {
      onSuccess();
    } else {
      setError("Biometric check failed — use your PIN");
    }
  }, [security.biometricCredentialId, onSuccess]);

  return (
    <main className="lock-page">
      <section className="lock-card">
        <div className="lock-icon">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="10" width="16" height="11" rx="3" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
          </svg>
        </div>
        <h1>Unlock Pocket Plan</h1>
        <p>Enter your PIN to continue</p>

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
            disabled={biometricBusy || checking}
          >
            <svg
              width="18"
              height="18"
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
            {biometricBusy ? "Checking…" : "Use biometrics"}
          </button>
        )}

        {attempts >= 3 && (
          <p className="lock-hint">
            Forgot your PIN? Clear app data from browser settings to reset. This
            will delete all lists.
          </p>
        )}
      </section>
    </main>
  );
}
