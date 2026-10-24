import type { Item } from "../App";

function formatUnit(cents: number): string {
  return (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function itemPlanned(item: Item): number {
  return item.price * item.quantity;
}

function itemActual(item: Item): number {
  const qty = item.actualQuantity ?? item.quantity;
  const unit = item.actualPrice ?? item.price;
  return unit * qty;
}

function itemSaved(item: Item): number {
  return itemPlanned(item) - itemActual(item);
}

export function SavingsInsights({
  items,
  currencySymbol,
  hidden,
}: {
  items: Item[];
  currencySymbol: string;
  hidden: boolean;
}) {
  const bought = items.filter((i) => i.bought && !i.removed);

  if (bought.length === 0) return null;

  const totalPlanned = bought.reduce((s, i) => s + itemPlanned(i), 0);
  const totalActual = bought.reduce((s, i) => s + itemActual(i), 0);
  const totalSaved = totalPlanned - totalActual;
  const savingsRate = totalPlanned > 0 ? (totalSaved / totalPlanned) * 100 : 0;

  /* Top 3 savings — sorted by amount saved descending */
  const topSavings = [...bought]
    .map((i) => ({ item: i, saved: itemSaved(i) }))
    .filter((x) => x.saved > 0)
    .sort((a, b) => b.saved - a.saved)
    .slice(0, 3);

  /* Top 3 overruns — sorted by amount over descending */
  const topOverruns = [...bought]
    .map((i) => ({ item: i, saved: itemSaved(i) }))
    .filter((x) => x.saved < 0)
    .sort((a, b) => a.saved - b.saved)
    .slice(0, 3);

  /* Impulse purchases — paid more than 20% over plan */
  const impulses = bought.filter((i) => {
    const planned = itemPlanned(i);
    const actual = itemActual(i);
    return planned > 0 && actual > planned * 1.2;
  });

  /* Vendor breakdown — if user recorded vendors */
  const vendorMap = new Map<string, { saved: number; count: number }>();
  for (const item of bought) {
    if (!item.vendor) continue;
    const key = item.vendor.trim();
    const entry = vendorMap.get(key) ?? { saved: 0, count: 0 };
    entry.saved += itemSaved(item);
    entry.count += 1;
    vendorMap.set(key, entry);
  }
  const topVendors = [...vendorMap.entries()]
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.saved - a.saved)
    .slice(0, 3);

  const displayMoney = (cents: number) =>
    hidden ? "••••" : `${currencySymbol} ${formatUnit(cents)}`;

  /* Bar proportions */
  const maxBar = Math.max(totalPlanned, totalActual, 1);

  return (
    <article className="savings-card">
      {/* ---------- Header ---------- */}
      <div className="savings-header">
        <div>
          <span className="eyebrow">Where your money went</span>
          <h3>Savings & overspend</h3>
        </div>
        <span
          className={`savings-badge ${
            totalSaved >= 0 ? "positive" : "negative"
          }`}
        >
          {totalSaved >= 0 ? "+" : "−"}
          {displayMoney(Math.abs(totalSaved))}
        </span>
      </div>

      {/* ---------- Planned vs Actual bar ---------- */}
      <div className="savings-bars">
        <div className="savings-bar-row">
          <span className="savings-bar-label">Planned</span>
          <div className="savings-bar-track">
            <div
              className="savings-bar-fill planned"
              style={{ width: `${(totalPlanned / maxBar) * 100}%` }}
            />
          </div>
          <span className="savings-bar-value">
            {displayMoney(totalPlanned)}
          </span>
        </div>
        <div className="savings-bar-row">
          <span className="savings-bar-label">Actual</span>
          <div className="savings-bar-track">
            <div
              className="savings-bar-fill actual"
              style={{ width: `${(totalActual / maxBar) * 100}%` }}
            />
          </div>
          <span className="savings-bar-value">{displayMoney(totalActual)}</span>
        </div>
      </div>

      {/* ---------- Rate note ---------- */}
      <p className="savings-rate-note">
        {totalSaved > 0 ? (
          <>
            You saved{" "}
            <strong className="positive">
              {Math.abs(savingsRate).toFixed(1)}%
            </strong>{" "}
            across {bought.length} purchased item
            {bought.length === 1 ? "" : "s"} this month.
          </>
        ) : totalSaved < 0 ? (
          <>
            You spent{" "}
            <strong className="negative">
              {Math.abs(savingsRate).toFixed(1)}%
            </strong>{" "}
            more than planned across {bought.length} purchased item
            {bought.length === 1 ? "" : "s"}.
          </>
        ) : (
          <>Your actual spending matched your plan exactly.</>
        )}
      </p>

      {/* ---------- Best deals ---------- */}
      {topSavings.length > 0 && (
        <div className="savings-list">
          <h4>Best deals</h4>
          {topSavings.map(({ item, saved }) => (
            <div key={item.id} className="savings-row">
              <span className="savings-row-name">{item.name}</span>
              <b className="positive">+{displayMoney(saved)}</b>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Overruns ---------- */}
      {topOverruns.length > 0 && (
        <div className="savings-list">
          <h4>Where plans went over</h4>
          {topOverruns.map(({ item, saved }) => (
            <div key={item.id} className="savings-row">
              <span className="savings-row-name">{item.name}</span>
              <b className="negative">{displayMoney(Math.abs(saved))}</b>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Vendors ---------- */}
      {topVendors.length > 0 && (
        <div className="savings-list">
          <h4>Best places to buy</h4>
          {topVendors.map((v) => (
            <div key={v.name} className="savings-row">
              <span className="savings-row-name">
                {v.name}
                <small className="savings-row-count">
                  {" "}
                  · {v.count} purchase{v.count === 1 ? "" : "s"}
                </small>
              </span>
              <b className={v.saved >= 0 ? "positive" : "negative"}>
                {v.saved >= 0 ? "+" : "−"}
                {displayMoney(Math.abs(v.saved))}
              </b>
            </div>
          ))}
        </div>
      )}

      {/* ---------- Impulse warning ---------- */}
      {impulses.length > 0 && (
        <div className="savings-note">
          <strong>
            {impulses.length} purchase{impulses.length === 1 ? "" : "s"}
          </strong>{" "}
          went more than 20% over plan this month.
          {impulses.length <= 2 && (
            <> ({impulses.map((i) => i.name).join(", ")})</>
          )}
        </div>
      )}
    </article>
  );
}
