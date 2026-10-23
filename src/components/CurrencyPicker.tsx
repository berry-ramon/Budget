import { useEffect, useMemo, useRef, useState } from "react";
import {
  POPULAR_CURRENCIES,
  currencySearchKey,
  getCurrencies,
  getCurrency,
} from "../lib/currencies";

/* =========================================================
   LOCAL ICONS
   Just the two the picker needs, inlined so this file
   doesn't depend on App.tsx's Icon component.
   ========================================================= */

function ChevronIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      className="icon"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

/* =========================================================
   CURRENCY PICKER
   ========================================================= */

export function CurrencyPicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (code: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(() => getCurrency(value), [value]);
  const all = useMemo(() => getCurrencies(), []);

  const popular = useMemo(() => {
    const byCode = new Map(all.map((c) => [c.code, c]));
    return POPULAR_CURRENCIES.map((code) => byCode.get(code)).filter(
      (c): c is NonNullable<typeof c> => Boolean(c),
    );
  }, [all]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((c) => currencySearchKey(c).includes(q));
  }, [all, query]);

  /* Auto-focus search when the sheet opens */
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => searchRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open]);

  /* Escape closes; lock body scroll */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  /* Reset query when the sheet closes */
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const choose = (code: string) => {
    onChange(code);
    setOpen(false);
  };

  const trigger = (
    <button
      type="button"
      className="currency-trigger"
      onClick={() => setOpen(true)}
      aria-haspopup="listbox"
      aria-expanded={open}
    >
      <span className="currency-flag" aria-hidden="true">
        {selected.flag}
      </span>
      <span className="currency-info">
        <b>{selected.country}</b>
        <small>
          {selected.code} · {selected.name}
        </small>
      </span>
      <ChevronIcon />
    </button>
  );

  return (
    <>
      {label ? (
        <label className="field" style={{ display: "grid", gap: 8 }}>
          <span style={{ fontSize: 12, color: "var(--muted)" }}>{label}</span>
          {trigger}
        </label>
      ) : (
        trigger
      )}

      {open && (
        <div
          className="currency-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="currency-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Choose currency"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <h2>Choose currency</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </header>

            <input
              ref={searchRef}
              type="search"
              className="currency-search"
              placeholder="Search country or currency…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />

            <div className="currency-list" role="listbox">
              {!query && (
                <>
                  <p className="currency-section-label">Popular</p>
                  {popular.map((c) => (
                    <CurrencyRow
                      key={`p-${c.code}`}
                      c={c}
                      selected={c.code === value}
                      onSelect={() => choose(c.code)}
                    />
                  ))}
                  <p className="currency-section-label">All countries</p>
                </>
              )}

              {filtered.map((c) => (
                <CurrencyRow
                  key={c.code}
                  c={c}
                  selected={c.code === value}
                  onSelect={() => choose(c.code)}
                />
              ))}

              {filtered.length === 0 && (
                <p className="currency-empty">No currencies match “{query}”</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Row ---------- */

function CurrencyRow({
  c,
  selected,
  onSelect,
}: {
  c: {
    code: string;
    country: string;
    name: string;
    symbol: string;
    flag: string;
  };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={`currency-row${selected ? " selected" : ""}`}
      onClick={onSelect}
    >
      <span className="currency-flag" aria-hidden="true">
        {c.flag}
      </span>
      <span className="currency-row-info">
        <b>{c.country}</b>
        <small>
          {c.name} · {c.symbol}
        </small>
      </span>
      <span className="currency-row-code">{c.code}</span>
      {selected && (
        <span className="currency-row-check" aria-hidden="true">
          <CheckIcon />
        </span>
      )}
    </button>
  );
}
