import { useEffect, useState } from "react";
import { hashPin } from "../lib/crypto";
import { isBiometricAvailable, registerBiometric } from "../lib/webauthn";
import { PinInput } from "./PinInput";

const LOCK_OPTIONS = [
  { value: 0, label: "Only on app open" },
  { value: 1, label: "After 1 minute" },
  { value: 5, label: "After 5 minutes" },
  { value: 15, label: "After 15 minutes" },
  { value: 30, label: "After 30 minutes" },
  { value: 60, label: "After 1 hour" },
];

export function SecuritySetup({
  onComplete,
  onCancel,
}: {
  onComplete: (security: {
    pinHash: string;
    pinSalt: string;
    biometricEnabled: boolean;
    biometricCredentialId: string | null;
    autoLockMinutes: number;
  }) => void;
  onCancel?: () => void;
}) {
  const [step, setStep] = useState<"pin" | "confirm" | "options">("pin");
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pinError, setPinError] = useState("");

  /* null = still checking, false = unavailable, true = available */
  const [bioAvailable, setBioAvailable] = useState<boolean | null>(null);
  const [biometricCredentialId, setBiometricCredentialId] = useState<
    string | null
  >(null);
  const [testingBiometric, setTestingBiometric] = useState(false);
  const [biometricError, setBiometricError] = useState("");

  const [autoLockMinutes, setAutoLockMinutes] = useState(5);
  const [saving, setSaving] = useState(false);

  /* ---------- Initial detection ---------- */
  useEffect(() => {
    void isBiometricAvailable().then(setBioAvailable);
  }, []);

  const handlePinComplete = (value: string) => {
    if (value.length < 4) {
      setPinError("PIN must be 4 digits");
      return;
    }
    setPinError("");
    setStep("confirm");
  };

  const handleConfirmComplete = (value: string) => {
    if (value !== pin) {
      setPinError("PINs didn't match. Try again.");
      setConfirm("");
      setStep("pin");
      setPin("");
      return;
    }
    setPinError("");
    setStep("options");
  };

  /* ---------- Biometric test — runs the moment the box is checked ---------- */
  const handleBiometricToggle = async (checked: boolean) => {
    if (!checked) {
      setBiometricCredentialId(null);
      setBiometricError("");
      return;
    }

    setBiometricError("");
    setTestingBiometric(true);
    const credentialId = await registerBiometric();
    setTestingBiometric(false);

    if (credentialId) {
      setBiometricCredentialId(credentialId);
    } else {
      /* Registration failed → hardware doesn't actually support it */
      setBioAvailable(false);
      setBiometricCredentialId(null);
      setBiometricError(
        "Your device couldn't complete biometric setup. You can still use your PIN.",
      );
    }
  };

  /* ---------- Save ---------- */
  const handleSave = async () => {
    setSaving(true);
    try {
      const { hash, salt } = await hashPin(pin);
      onComplete({
        pinHash: hash,
        pinSalt: salt,
        biometricEnabled: !!biometricCredentialId,
        biometricCredentialId,
        autoLockMinutes,
      });
    } catch (e) {
      setPinError(e instanceof Error ? e.message : "Could not set up security");
      setSaving(false);
    }
  };

  return (
    <main className="security-page">
      <section className="security-card">
        <div className="security-icon">
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

        {step === "pin" && (
          <>
            <h1>Set a PIN</h1>
            <p>
              Your PIN protects your lists. It stays on this device — we never
              send it anywhere.
            </p>
            <PinInput
              value={pin}
              onChange={setPin}
              length={4}
              autoFocus
              onComplete={handlePinComplete}
              error={!!pinError}
            />
            {pinError && <p className="form-error">{pinError}</p>}
            <button
              type="button"
              className="button primary full"
              onClick={() => handlePinComplete(pin)}
              disabled={pin.length < 4}
            >
              Continue
            </button>
          </>
        )}

        {step === "confirm" && (
          <>
            <h1>Confirm your PIN</h1>
            <p>Enter the same PIN again to make sure it's right.</p>
            <PinInput
              value={confirm}
              onChange={setConfirm}
              length={4}
              autoFocus
              onComplete={handleConfirmComplete}
              error={!!pinError}
            />
            {pinError && <p className="form-error">{pinError}</p>}
            <button
              type="button"
              className="button primary full"
              onClick={() => handleConfirmComplete(confirm)}
              disabled={confirm.length < 4}
            >
              Confirm
            </button>
            <button
              type="button"
              className="button ghost full"
              onClick={() => {
                setStep("pin");
                setPin("");
                setConfirm("");
                setPinError("");
              }}
            >
              Change PIN
            </button>
          </>
        )}

        {step === "options" && (
          <>
            <h1>Almost done</h1>
            <p>Choose how you want to unlock Pocket Plan.</p>

            {/* ---------- Biometric: only shows when actually usable ---------- */}
            {bioAvailable === true && (
              <label
                className={`security-option ${
                  testingBiometric ? "testing" : ""
                }`}
              >
                <div className="security-option-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
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
                </div>
                <div className="security-option-copy">
                  <b>
                    {biometricCredentialId
                      ? "Biometrics enabled"
                      : testingBiometric
                        ? "Confirm on your device…"
                        : "Use biometrics"}
                  </b>
                  <span>
                    {biometricCredentialId
                      ? "Fingerprint or face unlock is set up"
                      : "Fingerprint, Face ID, or device unlock"}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={!!biometricCredentialId}
                  onChange={(e) => handleBiometricToggle(e.target.checked)}
                  disabled={testingBiometric}
                />
              </label>
            )}

            {/* ---------- Not available ---------- */}
            {bioAvailable === false && (
              <div className="security-note">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  style={{ flexShrink: 0 }}
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 16v-4M12 8h.01" />
                </svg>
                <span>
                  Biometrics aren't available on this device. You can still use
                  your PIN.
                </span>
              </div>
            )}

            {biometricError && (
              <p className="form-error" style={{ textAlign: "left" }}>
                {biometricError}
              </p>
            )}

            <label className="security-field">
              <span>Auto-lock</span>
              <select
                value={autoLockMinutes}
                onChange={(e) => setAutoLockMinutes(Number(e.target.value))}
              >
                {LOCK_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            <p className="security-warning">
              If you forget your PIN, you'll need to reset the app and lose your
              data. Keep it somewhere safe.
            </p>

            {pinError && <p className="form-error">{pinError}</p>}

            <button
              type="button"
              className="button primary full"
              onClick={handleSave}
              disabled={saving || testingBiometric}
            >
              {saving ? "Securing…" : "Enable security"}
            </button>

            {onCancel && (
              <button
                type="button"
                className="button ghost full"
                onClick={onCancel}
                disabled={saving}
              >
                Cancel
              </button>
            )}
          </>
        )}
      </section>
    </main>
  );
}
