import { useEffect, useState } from "react";

export function QuantityInput({
  value,
  onChange,
  min = 1,
  max = 99,
  invalid = false,
  inputRef,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  invalid?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  // Hold the raw string so users can fully erase "1" before typing "2"
  const [draft, setDraft] = useState<string>(String(value));

  // Sync external value changes (e.g. when reopening the modal)
  useEffect(() => {
    setDraft(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, "");
    setDraft(raw);
    const num = parseInt(raw, 10);
    if (!Number.isNaN(num) && num >= min && num <= max) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    const num = parseInt(draft, 10);
    if (Number.isNaN(num) || num < min) {
      onChange(min);
      setDraft(String(min));
    } else if (num > max) {
      onChange(max);
      setDraft(String(max));
    } else {
      setDraft(String(num));
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      className={`quantity-input${invalid ? " invalid" : ""}`}
      value={draft}
      onChange={handleChange}
      onBlur={handleBlur}
      aria-label="Quantity"
    />
  );
}
