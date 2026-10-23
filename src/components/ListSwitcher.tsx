import { useState } from "react";

export type SwitchList = {
  id: string;
  name: string;
  type: string;
};

export function ListSwitcher({
  lists,
  selectedId,
  onSelect,
}: {
  lists: SwitchList[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = lists.find((l) => l.id === selectedId);

  return (
    <>
      <div className="list-switcher">
        <button
          type="button"
          className="list-switcher-back"
          onClick={() => {
            onSelect(lists[0].id);
          }}
          aria-label="Back to lists"
          style={{ display: lists.length === 0 ? "none" : "none" }}
        >
          ‹
        </button>
        <button
          type="button"
          className="list-switcher-current"
          onClick={() => setOpen(true)}
        >
          <span>{current?.name ?? "Select list"}</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Browse lists"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M8 6h11M8 12h11M8 18h11" />
            <circle cx="4" cy="6" r="0.75" />
            <circle cx="4" cy="12" r="0.75" />
            <circle cx="4" cy="18" r="0.75" />
          </svg>
        </button>
      </div>

      {open && (
        <div
          className="list-switcher-backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            className="list-switcher-sheet"
            role="dialog"
            aria-modal="true"
            aria-label="Switch list"
            onClick={(e) => e.stopPropagation()}
          >
            <header>
              <h2>Your lists</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </header>
            <div className="list-switcher-list">
              {lists.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  className={l.id === selectedId ? "active" : ""}
                  onClick={() => {
                    onSelect(l.id);
                    setOpen(false);
                  }}
                >
                  <span className="switcher-icon">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                    >
                      <path d="M8 6h11M8 12h11M8 18h11" />
                    </svg>
                  </span>
                  <span className="switcher-copy">
                    <b>{l.name}</b>
                    <small>{l.type}</small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
