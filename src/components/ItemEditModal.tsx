import { useEffect, useRef, useState } from "react";

export type ItemTag = "Need" | "Want" | "Maybe";

export type EditableItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  tag: ItemTag;
};

export function ItemEditModal({
  item,
  currencySymbol,
  parseAmount,
  onSave,
  onDelete,
  onClose,
}: {
  item: EditableItem;
  currencySymbol: string;
  parseAmount: (input: string) => number | null;
  onSave: (next: EditableItem) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price / 100));
  const [quantity, setQuantity] = useState(item.quantity);
  const [tag, setTag] = useState<ItemTag>(item.tag);
  const [error, setError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  const parsedPrice = parseAmount(price);
  const priceValid = parsedPrice !== null && parsedPrice > 0;
  const nameValid = name.trim().length > 0;
  const qtyValid = quantity >= 1;
  const canSubmit = nameValid && priceValid && qtyValid;

  // Focus first invalid input when user tries to submit
  useEffect(() => {
    if (!error) return;
    if (!nameValid) nameRef.current?.focus();
    else if (!priceValid) priceRef.current?.focus();
    else if (!qtyValid) qtyRef.current?.focus();
  }, [error, nameValid, priceValid, qtyValid]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameValid) return setError("Add an item name.");
    if (!priceValid) return setError("Enter a valid price.");
    if (!qtyValid) return setError("Quantity must be at least 1.");
    onSave({
      id: item.id,
      name: name.trim(),
      price: parsedPrice!,
      quantity,
      tag,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Edit item"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header>
          <div>
            <small>Pocket Plan</small>
            <h2>Edit item</h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <form className="modal-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Item name</span>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What are you considering?"
            />
          </label>

          <label className="field">
            <span>Price ({currencySymbol})</span>
            <input
              ref={priceRef}
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
            <small>Calculator input works: 250*3 or 1200-200</small>
          </label>

          <label className="field">
            <span>Quantity</span>
            <input
              ref={qtyRef}
              type="number"
              min="1"
              max="99"
              className="quantity-input"
              value={quantity === 0 ? "" : quantity}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === "") {
                  setQuantity(0);
                  return;
                }
                const num = parseInt(raw, 10);
                if (!Number.isNaN(num)) setQuantity(num);
              }}
              onBlur={() => {
                if (quantity < 1) setQuantity(1);
              }}
            />
          </label>

          <fieldset className="tag-picker">
            <legend>Tag</legend>
            {(["Need", "Want", "Maybe"] as ItemTag[]).map((value) => (
              <button
                type="button"
                key={value}
                className={`button tag-option ${value.toLowerCase()} ${tag === value ? "selected" : ""}`}
                onClick={() => setTag(value)}
              >
                <i />
                {value}
              </button>
            ))}
          </fieldset>

          {error && <p className="form-error">{error}</p>}

          <div
            className="modal-actions"
            style={{ justifyContent: "space-between" }}
          >
            <button
              type="button"
              className="button danger"
              onClick={() => {
                if (!confirmDelete) return setConfirmDelete(true);
                onDelete();
              }}
            >
              {confirmDelete ? "Tap again to delete" : "Delete"}
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                className="button secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button primary"
                disabled={!canSubmit}
              >
                Save changes
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
