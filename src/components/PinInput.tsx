import { useEffect, useRef, useState } from "react";

export function PinInput({
  value,
  onChange,
  length = 4,
  autoFocus = false,
  autoComplete,
  error = false,
  onComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  autoFocus?: boolean;
  autoComplete?: (pin: string) => void;
  error?: boolean;
  onComplete?: (pin: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (autoFocus) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 100);
      return () => window.clearTimeout(t);
    }
  }, [autoFocus]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/\D/g, "").slice(0, length);
    onChange(cleaned);
    if (cleaned.length === length) {
      if (autoComplete) autoComplete(cleaned);
      if (onComplete) onComplete(cleaned);
    }
  };

  return (
    <div
      className={`pin-wrap ${error ? "pin-error" : ""} ${focused ? "pin-focused" : ""}`}
      onClick={() => inputRef.current?.focus()}
    >
      <div className="pin-dots" aria-hidden="true">
        {Array.from({ length }).map((_, i) => {
          const filled = i < value.length;
          const isNext = focused && i === value.length;
          return (
            <span
              key={i}
              className={`pin-dot ${filled ? "filled" : ""} ${isNext ? "next" : ""}`}
            />
          );
        })}
      </div>
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={length}
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="pin-input"
        aria-label={`PIN, ${length} digits`}
        autoComplete="off"
      />
    </div>
  );
}
