type Row = {
  key: "needs" | "wants" | "maybe" | "bought";
  label: string;
  value: number;
  count: number;
};

export function SpendingBreakdown({
  needs,
  wants,
  maybe,
  bought,
  total,
  formatMoney,
  currency,
  hidden,
}: {
  needs: number;
  wants: number;
  maybe: number;
  bought: number;
  total: number;
  formatMoney: (v: number, c: string, hidden?: boolean) => string;
  currency: string;
  hidden: boolean;
}) {
  const rows: Row[] = [
    { key: "needs", label: "Needs", value: needs, count: 0 },
    { key: "wants", label: "Wants", value: wants, count: 0 },
    { key: "maybe", label: "Maybe", value: maybe, count: 0 },
    { key: "bought", label: "Bought", value: bought, count: 0 },
  ];

  const max = Math.max(...rows.map((r) => r.value), 1);

  return (
    <article className="spending-card">
      <h3>Where your money is going</h3>
      <p>Needs vs wants vs what you actually spent</p>

      <div className="spending-bars">
        {rows.map((row) => {
          const pct = total ? Math.round((row.value / total) * 100) : 0;
          return (
            <div key={row.key} className={`spending-bar ${row.key}`}>
              <span className="spending-bar-label">
                <i />
                {row.label}
              </span>
              <span className="spending-bar-track">
                <span
                  className="spending-bar-fill"
                  style={{
                    width: `${Math.max((row.value / max) * 100, 2)}%`,
                    display: "block",
                  }}
                />
              </span>
              <span className="spending-bar-value">
                {hidden ? "••••" : formatMoney(row.value, currency, false)}
              </span>
            </div>
          );
        })}
      </div>

      <p
        style={{
          marginTop: 18,
          paddingTop: 12,
          borderTop: "1px solid var(--border)",
          color: "var(--muted)",
          fontSize: 11,
          lineHeight: 1.5,
        }}
      >
        {bought > 0
          ? `You've spent ${hidden ? "••••" : formatMoney(bought, currency, false)} so far. Planned total still includes the rest.`
          : "Tick items off as you buy them to track actual spend."}
      </p>
    </article>
  );
}
