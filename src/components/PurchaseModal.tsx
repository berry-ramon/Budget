import { useEffect, useRef, useState } from "react";

export type PurchasedItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  actualPrice?: number;
  actualQuantity?: number;
  vendor?: string;
};

function formatUnit(value: number): string {
  return (value / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function PurchaseModal({
  item,
  currencySymbol,
  parseAmount,
  onConfirm,
  onCancel,
}: {
  item: PurchasedItem;
  currencySymbol: string;
  parseAmount: (input: string) => number | null;
  onConfirm: (data: {
    actualPrice: number;
    actualQuantity: number;
    vendor?: string;
  }) => void;
  onCancel: () => void;
}) {
  const plannedUnitPrice = item.price;
  const plannedTotal = item.price * item.quantity;
  const plannedUnitFormatted = formatUnit(plannedUnitPrice);

  /* Quantity — prefill from prior actual if editing, else planned */
  const initialQty = item.actualQuantity ?? item.quantity;
  const [qty, setQty] = useState(String(initialQty));

  /* Price starts EMPTY unless editing a purchase with a different price.
     Empty means "paid as planned". */
  const [priceInput, setPriceInput] = useState(
    item.actualPrice !== undefined && item.actualPrice !== item.price
      ? formatUnit(item.actualPrice)
      : "",
  );

  const [vendor, setVendor] = useState(item.vendor ?? "");
  const [error, setError] = useState("");
  const [showVendor, setShowVendor] = useState(!!item.vendor);

  const priceRef = useRef<HTMLInputElement>(null);

  /* No autofocus — let the user read both options first */

  const parsedQty = Math.max(1, parseInt(qty, 10) || 1);
  const priceEntered = priceInput.trim().length > 0;
  const parsedUnit = priceEntered ? parseAmount(priceInput) : null;
  const validPrice = parsedUnit !== null && parsedUnit > 0;

  /* Live total & savings preview */
  const effectiveUnit =
    priceEntered && validPrice ? parsedUnit! : plannedUnitPrice;
  const actualTotal = effectiveUnit * parsedQty;
  const savings = plannedTotal - actualTotal;

  const canConfirmCustom = priceEntered && validPrice && parsedQty >= 1;

  /* ---------- Action 1: Paid as budgeted (instant) ---------- */
  const handlePayPlanned = () => {
    onConfirm({
      actualPrice: plannedUnitPrice,
      actualQuantity: parsedQty,
      vendor: vendor.trim() || undefined,
    });
  };

  /* ---------- Action 2: Custom price ---------- */
  const handleConfirmCustom = () => {
    if (!canConfirmCustom) {
      setError("Enter a valid price");
      priceRef.current?.focus();
      return;
    }
    onConfirm({
      actualPrice: parsedUnit!,
      actualQuantity: parsedQty,
      vendor: vendor.trim() || undefined,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onCancel}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Record purchase"
        onMouseDown={(e) => e.stopPropagation()}
        style={{ maxWidth: 420 }}
      >
        <header>
          <div>
            <small>Pocket Plan</small>
            <h2>How much did you pay?</h2>
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

        <div style={{ padding: "18px 20px 22px" }}>
          {/* ---------- Item preview ---------- */}
          <div className="purchase-item-preview">
            <b>{item.name}</b>
            <span>
              Planned: {currencySymbol} {plannedUnitFormatted} × {item.quantity}{" "}
              = {currencySymbol} {formatUnit(plannedTotal)}
            </span>
          </div>

          {/* ---------- Quantity ---------- */}
          <label className="field">
            <span>Quantity bought</span>
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
            />
          </label>

          {/* ---------- Price ---------- */}
          <label className="field" style={{ marginTop: 12 }}>
            <span>Unit price ({currencySymbol})</span>
            <input
              ref={priceRef}
              type="text"
              inputMode="decimal"
              value={priceInput}
              onChange={(e) => {
                setPriceInput(e.target.value);
                setError("");
              }}
              placeholder={plannedUnitFormatted}
            />
            <small className="purchase-price-hint">
              Leave blank to pay the budgeted price of {currencySymbol}{" "}
              {plannedUnitFormatted}
            </small>
          </label>

          {/* ---------- Vendor (optional, expands on tap) ---------- */}
          {showVendor ? (
            <label className="field" style={{ marginTop: 12 }}>
              <span>Where from (optional)</span>
              <input
                type="text"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Wakulima Market"
              />
            </label>
          ) : (
            <button
              type="button"
              className="purchase-add-vendor"
              onClick={() => setShowVendor(true)}
            >
              + Add where you bought it
            </button>
          )}

          {/* ---------- Live preview ---------- */}
          {priceEntered && validPrice && (
            <div
              className={`purchase-savings ${
                savings > 0 ? "saved" : savings < 0 ? "over" : "same"
              }`}
            >
              {savings === 0 ? (
                <>
                  <b>Same as planned</b>
                  <span>
                    {currencySymbol} {formatUnit(actualTotal)}
                  </span>
                </>
              ) : savings > 0 ? (
                <>
                  <b>
                    You saved {currencySymbol} {formatUnit(savings)}
                  </b>
                  <span>
                    Paid {currencySymbol} {formatUnit(actualTotal)} vs planned{" "}
                    {currencySymbol} {formatUnit(plannedTotal)}
                  </span>
                </>
              ) : (
                <>
                  <b>
                    You paid {currencySymbol} {formatUnit(Math.abs(savings))}{" "}
                    more
                  </b>
                  <span>
                    Paid {currencySymbol} {formatUnit(actualTotal)} vs planned{" "}
                    {currencySymbol} {formatUnit(plannedTotal)}
                  </span>
                </>
              )}
            </div>
          )}

          {error && <p className="form-error">{error}</p>}

          {/* ---------- Adaptive primary action ---------- */}
          <div className="purchase-actions">
            {priceEntered ? (
              <button
                type="button"
                className="button primary full"
                onClick={handleConfirmCustom}
                disabled={!canConfirmCustom}
              >
                Confirm purchase · {currencySymbol} {formatUnit(actualTotal)}
              </button>
            ) : (
              <button
                type="button"
                className="button primary full"
                onClick={handlePayPlanned}
              >
                Paid as budgeted · {currencySymbol} {formatUnit(plannedTotal)}
              </button>
            )}

            <button
              type="button"
              className="button secondary full"
              onClick={onCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
