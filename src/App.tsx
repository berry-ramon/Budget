import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  useCallback,
} from "react";
import { InstallPrompt } from "./components/InstallPrompt";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { CurrencyPicker } from "./components/CurrencyPicker";
import { getCurrencySymbol } from "./lib/currencies";
import { Toast } from "./components/Toast";
import { QuantityInput } from "./components/QuantityInput";
import { ItemEditModal } from "./components/ItemEditModal";
import { ListMenu } from "./components/ListMenu";
import { ListSwitcher } from "./components/ListSwitcher";
import { SpendingBreakdown } from "./components/SpendingBreakdown";
import { UpdatePrompt } from "./components/UpdatePrompt";
import { SecuritySetup } from "./components/SecuritySetup";
import { LockScreen } from "./components/LockScreen";
import { AuthPrompt } from "./components/AuthPrompt";
import { useAutoLock } from "./hooks/useAutoLock";
import { PurchaseModal } from "./components/PurchaseModal";
import { SavingsInsights } from "./components/SavingsInsights";

type IconName =
  | "lists"
  | "compare"
  | "heart"
  | "insights"
  | "settings"
  | "search"
  | "plus"
  | "sun"
  | "moon"
  | "chevron"
  | "more"
  | "check"
  | "wallet"
  | "lock"
  | "download"
  | "upload"
  | "trash"
  | "arrow"
  | "close"
  | "spark"
  | "cart"
  | "gift"
  | "market"
  | "eye"
  | "eye-off";

type Tag = "Need" | "Want" | "Maybe";
type ListType =
  | "Window shopping"
  | "Groceries"
  | "Market day"
  | "Gifts"
  | "Custom";
type View = "Lists" | "Compare" | "Wishlist" | "Insights" | "Settings";

type Item = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  tag: Tag;
  removed?: boolean;
  bought?: boolean;
  actualPrice?: number;
  actualQuantity?: number;
  vendor?: string;
  boughtAt?: number;
};

type PlanList = {
  id: string;
  name: string;
  type: ListType;
  date: string;
  currency: string;
  budget: number | null;
  note: string;
  items: Item[];
};

type Wish = {
  id: string;
  name: string;
  price: number;
  saved: number;
  tag: Tag;
  createdAt: number;
};

export type SecuritySettings = {
  pinHash: string | null;
  pinSalt: string | null;
  biometricCredentialId: string | null;
  biometricEnabled: boolean;
  autoLockMinutes: number;
};

type AppData = {
  lists: PlanList[];
  wishes: Wish[];
  currency: string;
  theme: "system" | "light" | "dark";
  hideAmounts: boolean;
  setupComplete: boolean;
  security: SecuritySettings; // ← NEW
};

const initialData: AppData = {
  lists: [],
  wishes: [],
  currency: detectCurrency(),
  theme: "system",
  hideAmounts: false,
  setupComplete: false,
  security: {
    pinHash: null,
    pinSalt: null,
    biometricCredentialId: null,
    biometricEnabled: false,
    autoLockMinutes: 5,
  },
};

const navItems: { label: View; icon: IconName }[] = [
  { label: "Lists", icon: "lists" },
  { label: "Compare", icon: "compare" },
  { label: "Wishlist", icon: "heart" },
  { label: "Insights", icon: "insights" },
];

const tutorial = [
  {
    kicker: "Plan with confidence",
    title: "Plan what you spend before you spend it.",
    text: "A calmer way to decide what fits, while you are out or planning ahead.",
    art: "coins",
  },
  {
    kicker: "One plan for every outing",
    title: "Create a list, then add items and prices.",
    text: "Start with Window shopping, Groceries, Market day, Gifts, or make your own.",
    art: "list",
  },
  {
    kicker: "Know where you stand",
    title: "See what is Left or how much you Need more.",
    text: "The live meter responds instantly as your plan changes.",
    art: "meter",
  },
  {
    kicker: "Make the easy choice",
    title: "Compare lists and see which one fits.",
    text: "Enter what you have and Pocket Plan does the rest.",
    art: "compare",
  },
  {
    kicker: "Private by design",
    title: "Works offline. Your data stays on this phone.",
    text: "No account and no internet needed after setup.",
    art: "lock",
  },
];

function detectCurrency() {
  const region = (navigator.language.split("-")[1] || "").toUpperCase();
  const map: Record<string, string> = {
    KE: "KES",
    US: "USD",
    GB: "GBP",
    UG: "UGX",
    TZ: "TZS",
    RW: "RWF",
    ET: "ETB",
    ZA: "ZAR",
    NG: "NGN",
    GH: "GHS",
    EG: "EGP",
    MA: "MAD",
    IN: "INR",
    CN: "CNY",
    JP: "JPY",
    AE: "AED",
    SA: "SAR",
    CA: "CAD",
    AU: "AUD",
  };
  // Fallback is now KES instead of USD
  return map[region] || "KES";
}

function uid() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function formatMoney(value: number, currency: string, hidden = false) {
  if (hidden) return "••••";
  const amount = value / 100;
  const noDecimals = ["JPY", "UGX", "RWF"].includes(currency);
  let number: string;
  try {
    number = new Intl.NumberFormat(undefined, {
      minimumFractionDigits: noDecimals ? 0 : 2,
      maximumFractionDigits: noDecimals ? 0 : 2,
    }).format(amount);
  } catch {
    number = amount.toFixed(noDecimals ? 0 : 2);
  }
  return `${getCurrencySymbol(currency)} ${number}`;
}

function listTotal(list: PlanList, needsOnly = false) {
  return list.items
    .filter(
      (item) =>
        !item.removed && !item.bought && (!needsOnly || item.tag === "Need"),
    )
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
}

/* ---------- Actual purchase helpers ---------- */

function itemPlannedTotal(item: Item): number {
  return item.price * item.quantity;
}

function itemActualTotal(item: Item): number {
  const qty = item.actualQuantity ?? item.quantity;
  const unit = item.actualPrice ?? item.price;
  return unit * qty;
}

function itemSavings(item: Item): number {
  return itemPlannedTotal(item) - itemActualTotal(item);
}

/* listSpent — now uses ACTUAL prices where available */
function listSpent(list: PlanList) {
  return list.items
    .filter((item) => item.bought && !item.removed)
    .reduce((sum, item) => sum + itemActualTotal(item), 0);
}

/* listSavings — total saved (positive) or overspent (negative) */
function listSavings(list: PlanList) {
  return list.items
    .filter((item) => item.bought && !item.removed)
    .reduce((sum, item) => sum + itemSavings(item), 0);
}

/* listPlannedBought — what they were planning to spend on the bought items */
function listPlannedBought(list: PlanList) {
  return list.items
    .filter((item) => item.bought && !item.removed)
    .reduce((sum, item) => sum + itemPlannedTotal(item), 0);
}
function parseAmount(input: string) {
  const clean = input.replace(/,/g, "").trim();
  if (!/^\d+(?:\.\d+)?(?:\s*[+\-*\/]\s*\d+(?:\.\d+)?)*$/.test(clean))
    return null;
  const parts = clean.split(/\s*([+\-*\/])\s*/).filter(Boolean);
  let value = Number(parts[0]);
  for (let i = 1; i < parts.length; i += 2) {
    const next = Number(parts[i + 1]);
    if (parts[i] === "+") value += next;
    if (parts[i] === "-") value -= next;
    if (parts[i] === "*") value *= next;
    if (parts[i] === "/") value /= next;
  }
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : null;
}

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    lists: (
      <>
        <path d="M8 6h11M8 12h11M8 18h11" />
        <circle cx="4" cy="6" r=".75" />
        <circle cx="4" cy="12" r=".75" />
        <circle cx="4" cy="18" r=".75" />
      </>
    ),
    compare: (
      <>
        <path d="M7 3 3 7l4 4M3 7h14M17 21l4-4-4-4M21 17H7" />
      </>
    ),
    heart: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    insights: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    settings: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </>
    ),
    moon: <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />,
    chevron: <path d="m9 18 6-6-6-6" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    wallet: (
      <>
        <path d="M4 6h14a2 2 0 0 1 2 2v10H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h13" />
        <path d="M16 11h6v4h-6a2 2 0 0 1 0-4Z" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="3" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12M7 10l5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    "eye-off": (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4M7 9l5-5 5 5" />
        <path d="M5 21h14" />
      </>
    ),
    trash: (
      <>
        <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14" />
      </>
    ),
    arrow: <path d="m5 12 14 0M13 6l6 6-6 6" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    spark: (
      <path d="m12 2 1.4 5.1L18 9l-4.6 1.9L12 16l-1.4-5.1L6 9l4.6-1.9L12 2Z" />
    ),
    cart: (
      <>
        <path d="M3 3h2l2.5 12h10l2-8H6" />
        <circle cx="9" cy="20" r="1" />
        <circle cx="17" cy="20" r="1" />
      </>
    ),
    gift: (
      <>
        <rect x="3" y="8" width="18" height="13" rx="2" />
        <path d="M12 8v13M3 12h18M12 8H8.5a2.5 2.5 0 1 1 2.4-3.2L12 8Zm0 0h3.5a2.5 2.5 0 1 0-2.4-3.2L12 8Z" />
      </>
    ),
    market: (
      <>
        <path d="M4 10v11h16V10M3 10l2-6h14l2 6" />
        <path d="M3 10a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2" />
      </>
    ),
  };
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
      {paths[name]}
    </svg>
  );
}

function Button({
  children,
  className = "",
  icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icon?: IconName }) {
  return (
    <button className={`button ${className}`} {...props}>
      {icon && <Icon name={icon} />}
      {children}
    </button>
  );
}

function IconButton({
  label,
  icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  icon: IconName;
}) {
  return (
    <button className="icon-button" aria-label={label} title={label} {...props}>
      <Icon name={icon} />
    </button>
  );
}

function Field({
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
      {hint && <small>{hint}</small>}
    </label>
  );
}

function SelectField({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select {...props}>{children}</select>
    </label>
  );
}

function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <small>Pocket Plan</small>
            <h2>{title}</h2>
          </div>
          <IconButton label="Close" icon="close" onClick={onClose} />
        </header>
        {children}
      </section>
    </div>
  );
}

function Tutorial({ onDone }: { onDone: () => void }) {
  const [page, setPage] = useState(0);
  const slide = tutorial[page];
  return (
    <main className="onboarding">
      <div className="onboarding-brand">
        <Logo />
        <Button className="ghost" onClick={onDone}>
          Skip
        </Button>
      </div>
      <section className="tutorial-card" key={page}>
        <TutorialArt type={slide.art} />
        <div className="tutorial-copy">
          <span className="eyebrow">{slide.kicker}</span>
          <h1>{slide.title}</h1>
          <p>{slide.text}</p>
        </div>
      </section>
      <footer className="tutorial-footer">
        <div className="dots" aria-label={`Step ${page + 1} of 5`}>
          {tutorial.map((_, index) => (
            <i key={index} className={index === page ? "active" : ""} />
          ))}
        </div>
        <Button
          className="primary tutorial-next"
          onClick={() => (page === 4 ? onDone() : setPage(page + 1))}
        >
          {page === 4 ? "Get started" : "Next"} <Icon name="arrow" />
        </Button>
      </footer>
    </main>
  );
}

function TutorialArt({ type }: { type: string }) {
  return (
    <div className={`tutorial-art art-${type}`}>
      <div className="art-orbit" />
      <div className="art-card">
        {type === "coins" && (
          <>
            <Icon name="wallet" size={38} />
            <b>Ready when you are</b>
            <span>Plan first, spend calmly</span>
          </>
        )}
        {type === "list" && (
          <>
            <div className="art-row">
              <i /> Window shopping
            </div>
            <div className="art-row">
              <i /> Groceries
            </div>
            <div className="art-row">
              <i /> Market day
            </div>
          </>
        )}
        {type === "meter" && (
          <>
            <div className="art-ring">
              <b>68%</b>
            </div>
            <b>Plenty left</b>
            <span>Your plan is looking good</span>
          </>
        )}
        {type === "compare" && (
          <>
            <div className="mini-compare">
              <i />
              <i />
              <i />
            </div>
            <b>Best fit</b>
            <span>Window shopping</span>
          </>
        )}
        {type === "lock" && (
          <>
            <Icon name="lock" size={42} />
            <b>Yours only</b>
            <span>Private and offline-ready</span>
          </>
        )}
      </div>
    </div>
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="logo" aria-label="Pocket Plan">
      <img
        src="/assets/logo.png"
        alt=""
        style={{
          width: 34,
          height: 34,
          objectFit: "contain",
          borderRadius: 10,
          flexShrink: 0,
          display: "block",
        }}
      />
    </div>
  );
}

function Setup({
  data,
  onComplete,
}: {
  data: AppData;
  onComplete: (data: AppData) => void;
}) {
  const [currency, setCurrency] = useState(data.currency);
  const [theme, setTheme] = useState<AppData["theme"]>(data.theme);
  const [phase, setPhase] = useState<"basics" | "security">("basics");

  if (phase === "security") {
    return (
      <SecuritySetup
        onCancel={() => setPhase("basics")}
        onComplete={(sec) => {
          onComplete({
            ...data,
            currency,
            theme,
            setupComplete: true,
            security: sec,
          });
        }}
      />
    );
  }

  return (
    <main className="setup-page">
      <section className="setup-panel">
        <Logo />
        <div className="setup-heading">
          <span className="eyebrow">Step 1 of 2</span>
          <h1>Make Pocket Plan yours</h1>
          <p>You can change these anytime in Settings.</p>
        </div>
        <div className="setup-fields">
          <CurrencyPicker
            label="Your currency"
            value={currency}
            onChange={setCurrency}
          />
          <fieldset className="theme-choice">
            <legend>Theme</legend>
            {(["system", "light", "dark"] as const).map((choice) => (
              <Button
                key={choice}
                className={theme === choice ? "selected" : "secondary"}
                onClick={() => setTheme(choice)}
              >
                <Icon name={choice === "dark" ? "moon" : "sun"} />{" "}
                {choice[0].toUpperCase() + choice.slice(1)}
              </Button>
            ))}
          </fieldset>
          <div className="privacy-note">
            <Icon name="lock" />
            <p>
              <b>Your plans stay private.</b>
              <span>Everything is saved only on this device.</span>
            </p>
          </div>
        </div>
        <Button className="primary full" onClick={() => setPhase("security")}>
          Next: secure the app <Icon name="arrow" />
        </Button>
      </section>
    </main>
  );
}

export default function App() {
  const [data, setData] = useState<AppData>(initialData);
  const [loaded, setLoaded] = useState(false);
  const [showTutorial, setShowTutorial] = useState(
    () => localStorage.getItem("pocket-plan-tutorial") !== "seen",
  );
  const [view, setView] = useState<View>("Lists");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modal, setModal] = useState<"list" | "item" | "wish" | null>(null);
  const [quickMenu, setQuickMenu] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [saved, setSaved] = useState(true);
  const selected =
    data.lists.find((list) => list.id === selectedId) || data.lists[0];
  const dismissToast = useCallback(() => setToast(""), []);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [pendingShowAmounts, setPendingShowAmounts] = useState(false);

  const [purchaseItemId, setPurchaseItemId] = useState<string | null>(null);

  useEffect(() => {
    loadData().then((stored) => {
      if (stored) {
        setData(stored);
        if (stored.security.pinHash) {
          const last = Number(
            localStorage.getItem("pocket-plan-last-active") || 0,
          );
          const timeoutMs = stored.security.autoLockMinutes * 60 * 1000;
          if (timeoutMs > 0 && last && Date.now() - last < timeoutMs) {
            setUnlocked(true);
          }
        }
      }
      setLoaded(true);
    });
    navigator.storage?.persist?.();
    if ("serviceWorker" in navigator && import.meta.env.PROD)
      navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    setSaved(false);
    const timer = window.setTimeout(() => {
      saveData(data);
      setSaved(true);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [data, loaded]);

  useEffect(() => {
    const dark =
      data.theme === "dark" ||
      (data.theme === "system" &&
        matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", dark ? "#0F172A" : "#F8FAFC");
  }, [data.theme]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLSelectElement
      )
        return;
      if (event.key.toLowerCase() === "n") setModal("list");
      if (event.key.toLowerCase() === "a" && selected) setModal("item");
      if (event.key === "/") {
        event.preventDefault();
        document.querySelector<HTMLInputElement>(".search input")?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [selected]);

  function update(next: Partial<AppData>) {
    setData((current) => ({ ...current, ...next }));
  }

  useAutoLock({
    enabled: unlocked && !!data.security.pinHash,
    minutes: data.security.autoLockMinutes,
    onLock: () => setUnlocked(false),
  });

  function updateList(listId: string, transform: (list: PlanList) => PlanList) {
    update({
      lists: data.lists.map((list) =>
        list.id === listId ? transform(list) : list,
      ),
    });
  }

  function createQuick(type: Exclude<ListType, "Custom">) {
    const list: PlanList = {
      id: uid(),
      name: type,
      type,
      date: new Date().toISOString().slice(0, 10),
      currency: data.currency,
      budget: null,
      note: "",
      items: [],
    };
    update({ lists: [list, ...data.lists] });
    setSelectedId(list.id);
    setToast(`${type} list created`);
  }

  function removeItem(itemId: string) {
    if (!selected) return;
    updateList(selected.id, (list) => ({
      ...list,
      items: list.items.map((item) =>
        item.id === itemId ? { ...item, removed: true } : item,
      ),
    }));
    setToast("Moved to Removed");
  }

  function duplicateList(listId: string) {
    const source = data.lists.find((l) => l.id === listId);
    if (!source) return;
    const copy: PlanList = {
      ...source,
      id: uid(),
      name: `${source.name} (copy)`,
      date: new Date().toISOString().slice(0, 10),
      items: source.items.map((i) => ({ ...i, id: uid() })),
    };
    update({ lists: [copy, ...data.lists] });
    setSelectedId(copy.id);
    setToast("List duplicated");
  }

  function deleteList(listId: string) {
    update({ lists: data.lists.filter((l) => l.id !== listId) });
    if (selectedId === listId) setSelectedId(null);
    setToast("List deleted");
  }

  function toggleHide() {
    if (data.hideAmounts) {
      /* Currently hidden → require auth before revealing */
      if (data.security.pinHash) {
        setPendingShowAmounts(true);
      } else {
        update({ hideAmounts: false });
      }
    } else {
      /* Currently visible → hide immediately, no auth needed */
      update({ hideAmounts: true });
    }
  }

  function toggleBought(itemId: string) {
    if (!selected) return;
    const item = selected.items.find((i) => i.id === itemId);
    if (!item) return;

    if (item.bought) {
      /* Unmark immediately — no modal */
      updateList(selected.id, (list) => ({
        ...list,
        items: list.items.map((entry) =>
          entry.id === itemId
            ? {
                ...entry,
                bought: false,
                actualPrice: undefined,
                actualQuantity: undefined,
                vendor: undefined,
                boughtAt: undefined,
              }
            : entry,
        ),
      }));
      setToast("Marked as not bought");
    } else {
      /* Open purchase modal */
      setPurchaseItemId(itemId);
    }
  }

  if (!loaded)
    return (
      <div className="splash">
        <Logo />
        <div className="loader" />
      </div>
    );

  if (showTutorial)
    return (
      <Tutorial
        onDone={() => {
          localStorage.setItem("pocket-plan-tutorial", "seen");
          setShowTutorial(false);
        }}
      />
    );

  /* New-user onboarding (currency + theme + security in one flow) */
  if (!data.setupComplete)
    return (
      <Setup
        data={data}
        onComplete={(next) => {
          setData(next);
          setUnlocked(true);
          localStorage.setItem("pocket-plan-last-active", String(Date.now()));
        }}
      />
    );

  /* Migration: existing users who upgraded before security was added */
  if (!data.security.pinHash) {
    return (
      <SecuritySetup
        onComplete={(sec) => {
          update({ security: sec });
          setUnlocked(true);
          localStorage.setItem("pocket-plan-last-active", String(Date.now()));
        }}
      />
    );
  }

  /* Returning users — show lock screen if not in auto-unlock grace period */
  if (!unlocked) {
    return (
      <LockScreen
        security={data.security}
        onSuccess={() => {
          setUnlocked(true);
          localStorage.setItem("pocket-plan-last-active", String(Date.now()));
        }}
      />
    );
  }
  const filteredLists = data.lists.filter((list) =>
    list.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-top">
          <Logo />
        </div>
        <nav>
          {navItems.map((item) => (
            <Button
              key={item.label}
              className={
                view === item.label ? "nav-button active" : "nav-button"
              }
              icon={item.icon}
              onClick={() => setView(item.label)}
            >
              {item.label}
            </Button>
          ))}
        </nav>
        <Button
          className="primary new-list"
          icon="plus"
          onClick={() => setModal("list")}
        >
          New list <kbd>N</kbd>
        </Button>
        <div className="sidebar-bottom">
          <Button
            className={view === "Settings" ? "nav-button active" : "nav-button"}
            icon="settings"
            onClick={() => setView("Settings")}
          >
            Settings
          </Button>
          <div className="offline-pill">
            <i /> Offline-ready
          </div>
        </div>
      </aside>

      <div className="app-main">
        <header className="topbar">
          <div className="mobile-title">
            <Logo compact />
            <h1>{view}</h1>
          </div>
          <div className="desktop-title">
            <span>{view === "Lists" ? "Your plans" : view}</span>
            <small>
              {data.lists.length} {data.lists.length === 1 ? "list" : "lists"} ·{" "}
              {saved ? "Saved" : "Saving…"}
            </small>
          </div>
          <label className="search">
            <Icon name="search" />
            <input
              aria-label="Search"
              placeholder="Search plans…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>/</kbd>
          </label>
          <div className="top-actions">
            <span className="currency-chip">{data.currency}</span>
            <IconButton
              label="Toggle theme"
              icon={data.theme === "dark" ? "sun" : "moon"}
              onClick={() =>
                update({ theme: data.theme === "dark" ? "light" : "dark" })
              }
            />
            <IconButton
              label="Settings"
              icon="settings"
              onClick={() => setView("Settings")}
            />
          </div>
        </header>

        <main className="content">
          {view === "Lists" && (
            <ListsView
              data={data}
              lists={filteredLists}
              selected={selected}
              setSelected={setSelectedId}
              setModal={setModal}
              createQuick={createQuick}
              updateList={updateList}
              removeItem={removeItem}
              hidden={data.hideAmounts}
              onEditItem={setEditingItemId}
              onDuplicateList={duplicateList}
              onDeleteList={deleteList}
              onToggleHide={toggleHide}
              onToggleBought={toggleBought}
              onEditPurchase={setPurchaseItemId}
            />
          )}
          {view === "Compare" && (
            <CompareView data={data} hidden={data.hideAmounts} />
          )}
          {view === "Wishlist" && (
            <WishlistView
              data={data}
              setData={setData}
              openAdd={() => setModal("wish")}
            />
          )}
          {view === "Insights" && <InsightsView data={data} />}
          {view === "Settings" && (
            <SettingsView
              data={data}
              update={update}
              replay={() => setShowTutorial(true)}
            />
          )}
        </main>
      </div>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <Button
            key={item.label}
            className={view === item.label ? "bottom-tab active" : "bottom-tab"}
            onClick={() => setView(item.label)}
          >
            <span>
              <Icon name={item.icon} />
            </span>
            {item.label}
          </Button>
        ))}
      </nav>
      <div className={`fab-wrap ${quickMenu ? "open" : ""}`}>
        {quickMenu && (
          <div className="quick-actions">
            <Button
              onClick={() => {
                setModal("list");
                setQuickMenu(false);
              }}
            >
              <span>New list</span>
              <i>
                <Icon name="lists" />
              </i>
            </Button>
            <Button
              disabled={!selected}
              onClick={() => {
                setModal("item");
                setQuickMenu(false);
              }}
            >
              <span>Add item</span>
              <i>
                <Icon name="plus" />
              </i>
            </Button>
          </div>
        )}
        <Button
          aria-label="Quick actions"
          className="fab"
          onClick={() => setQuickMenu(!quickMenu)}
        >
          <Icon name={quickMenu ? "close" : "plus"} />
        </Button>
      </div>

      {modal === "list" && (
        <NewListModal
          currency={data.currency}
          onClose={() => setModal(null)}
          onSave={(list) => {
            update({ lists: [list, ...data.lists] });
            setSelectedId(list.id);
            setModal(null);
            setView("Lists");
            setToast("List created");
          }}
        />
      )}
      {modal === "item" && selected && (
        <NewItemModal
          currency={selected.currency}
          onClose={() => setModal(null)}
          onSave={(item) => {
            updateList(selected.id, (list) => ({
              ...list,
              items: [...list.items, item],
            }));
            setModal(null);
            setToast("Item added");
          }}
        />
      )}
      {modal === "wish" && (
        <NewWishModal
          currency={data.currency}
          onClose={() => setModal(null)}
          onSave={(wish) => {
            update({ wishes: [wish, ...data.wishes] });
            setModal(null);
            setToast("Added to Wishlist");
          }}
        />
      )}

      {editingItemId &&
        selected &&
        (() => {
          const editing = selected.items.find((i) => i.id === editingItemId);
          if (!editing) return null;
          return (
            <ItemEditModal
              item={{
                id: editing.id,
                name: editing.name,
                price: editing.price,
                quantity: editing.quantity,
                tag: editing.tag,
              }}
              currencySymbol={getCurrencySymbol(selected.currency)}
              parseAmount={parseAmount}
              onSave={(next) => {
                updateList(selected.id, (list) => ({
                  ...list,
                  items: list.items.map((i) =>
                    i.id === next.id ? { ...i, ...next } : i,
                  ),
                }));
                setEditingItemId(null);
                setToast("Item updated");
              }}
              onDelete={() => {
                updateList(selected.id, (list) => ({
                  ...list,
                  items: list.items.filter((i) => i.id !== editingItemId),
                }));
                setEditingItemId(null);
                setToast("Item deleted");
              }}
              onClose={() => setEditingItemId(null)}
            />
          );
        })()}
      {purchaseItemId &&
        selected &&
        (() => {
          const item = selected.items.find((i) => i.id === purchaseItemId);
          if (!item) return null;
          return (
            <PurchaseModal
              item={{
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                actualPrice: item.actualPrice,
                actualQuantity: item.actualQuantity,
                vendor: item.vendor,
              }}
              currencySymbol={getCurrencySymbol(selected.currency)}
              parseAmount={parseAmount}
              onConfirm={({ actualPrice, actualQuantity, vendor }) => {
                updateList(selected.id, (list) => ({
                  ...list,
                  items: list.items.map((entry) =>
                    entry.id === purchaseItemId
                      ? {
                          ...entry,
                          bought: true,
                          actualPrice,
                          actualQuantity,
                          vendor,
                          boughtAt: Date.now(),
                        }
                      : entry,
                  ),
                }));
                setPurchaseItemId(null);
                setToast(`${item.name} recorded`);
              }}
              onCancel={() => setPurchaseItemId(null)}
            />
          );
        })()}
      <InstallPrompt enabled={true} />
      <UpdatePrompt />

      {pendingShowAmounts && data.security.pinHash && (
        <AuthPrompt
          title="Confirm it's you"
          message="Authenticate to reveal your amounts."
          security={data.security}
          onSuccess={() => {
            update({ hideAmounts: false });
            setPendingShowAmounts(false);
          }}
          onCancel={() => setPendingShowAmounts(false)}
        />
      )}

      {toast && <Toast message={toast} onDismiss={dismissToast} />}
    </div>
  );
}

function ListsView({
  data,
  lists,
  selected,
  setSelected,
  setModal,
  createQuick,
  updateList,
  removeItem,
  hidden,
  onEditItem,
  onDuplicateList,
  onDeleteList,
  onToggleHide,
  onToggleBought,
  onEditPurchase,
}: {
  data: AppData;
  lists: PlanList[];
  selected?: PlanList;
  setSelected: (id: string) => void;
  setModal: (modal: "list" | "item") => void;
  createQuick: (type: Exclude<ListType, "Custom">) => void;
  updateList: (id: string, transform: (list: PlanList) => PlanList) => void;
  removeItem: (id: string) => void;
  hidden: boolean;
  onEditItem: (id: string) => void;
  onDuplicateList: (id: string) => void;
  onDeleteList: (id: string) => void;
  onToggleHide: () => void;
  onToggleBought: (id: string) => void;
  onEditPurchase: (id: string) => void;
}) {
  if (!data.lists.length)
    return (
      <EmptyLists createQuick={createQuick} onNew={() => setModal("list")} />
    );

  const totalPlanned = data.lists.reduce(
    (sum, list) => sum + listTotal(list),
    0,
  );

  return (
    <div className="lists-layout">
      {/* Mobile-only list switcher */}
      {selected && (
        <ListSwitcher
          lists={data.lists.map((l) => ({
            id: l.id,
            name: l.name,
            type: l.type,
          }))}
          selectedId={selected.id}
          onSelect={setSelected}
        />
      )}

      <section className="list-index">
        <div className="month-strip">
          <div>
            <span>This month</span>
            <b>{formatMoney(totalPlanned, data.currency, hidden)}</b>
          </div>
          <small>
            {data.lists.length} active{" "}
            {data.lists.length === 1 ? "plan" : "plans"}
          </small>
        </div>
        <div className="section-heading">
          <h2>Recent lists</h2>
          <Button className="ghost" onClick={() => setModal("list")}>
            <Icon name="plus" /> New
          </Button>
        </div>
        <div className="list-rows">
          {lists.map((list, index) => (
            <ListRow
              key={list.id}
              list={list}
              active={selected?.id === list.id}
              hidden={hidden}
              onClick={() => setSelected(list.id)}
              index={index}
            />
          ))}
        </div>
      </section>

      {selected && (
        <ListDetail
          list={selected}
          hidden={hidden}
          update={(transform) => updateList(selected.id, transform)}
          addItem={() => setModal("item")}
          removeItem={removeItem}
          onEditItem={onEditItem}
          onDuplicateList={() => onDuplicateList(selected.id)}
          onDeleteList={() => onDeleteList(selected.id)}
          onToggleHide={onToggleHide}
          onToggleBought={onToggleBought}
          onEditPurchase={onEditPurchase}
        />
      )}

      {selected && (
        <SummaryPanel
          list={selected}
          hidden={hidden}
          update={(transform) => updateList(selected.id, transform)}
          otherLists={data.lists.filter((list) => list.id !== selected.id)}
        />
      )}
    </div>
  );
}

function EmptyLists({
  createQuick,
  onNew,
}: {
  createQuick: (type: Exclude<ListType, "Custom">) => void;
  onNew: () => void;
}) {
  const choices: {
    type: Exclude<ListType, "Custom">;
    icon: IconName;
    text: string;
  }[] = [
    { type: "Window shopping", icon: "spark", text: "Plan before deciding" },
    { type: "Groceries", icon: "cart", text: "Keep the basket in view" },
    { type: "Market day", icon: "market", text: "Collect prices as you go" },
    { type: "Gifts", icon: "gift", text: "Thoughtful, within your plan" },
  ];
  return (
    <section className="empty-lists">
      <div className="empty-hero">
        <div className="empty-art">
          <div className="wallet-illustration">
            <Icon name="wallet" size={46} />
            <i />
            <i />
            <i />
          </div>
        </div>
        <span className="eyebrow">A fresh start</span>
        <h1>Create your first list</h1>
        <p>
          Plan an outing, add what catches your eye, and know what fits before
          you spend.
        </p>
        <Button className="primary" icon="plus" onClick={onNew}>
          Create a custom list
        </Button>
      </div>
      <div className="quick-start">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Quick start</span>
            <h2>What are you planning?</h2>
          </div>
        </div>
        <div className="quick-grid">
          {choices.map((choice) => (
            <Button
              key={choice.type}
              className="quick-choice"
              onClick={() => createQuick(choice.type)}
            >
              <i>
                <Icon name={choice.icon} />
              </i>
              <span>
                <b>{choice.type}</b>
                <small>{choice.text}</small>
              </span>
              <Icon name="chevron" />
            </Button>
          ))}
        </div>
      </div>
      <div className="offline-banner">
        <Icon name="lock" />
        <div>
          <b>Private. Offline. Yours.</b>
          <span>Your plans stay on this device and work without internet.</span>
        </div>
        <span className="status">
          <i /> Ready
        </span>
      </div>
    </section>
  );
}

function ListRow({
  list,
  active,
  hidden,
  onClick,
  index,
}: {
  list: PlanList;
  active: boolean;
  hidden: boolean;
  onClick: () => void;
  index: number;
}) {
  const total = listTotal(list);
  const spent = listSpent(list);
  const budget = list.budget;
  const ratio = budget ? Math.min(total / budget, 1) : 0;
  const over = budget !== null && total > budget;
  const near = budget !== null && total <= budget && total / budget > 0.8;

  return (
    <button
      className={`list-row ${active ? "active" : ""}`}
      onClick={onClick}
      style={{ "--delay": `${index * 45}ms` } as React.CSSProperties}
    >
      <div
        className={`type-icon type-${list.type
          .toLowerCase()
          .replaceAll(" ", "-")}`}
      >
        <Icon
          name={
            list.type === "Groceries"
              ? "cart"
              : list.type === "Gifts"
                ? "gift"
                : list.type === "Market day"
                  ? "market"
                  : "spark"
          }
        />
      </div>
      <div className="list-row-main">
        <div className="list-row-top">
          <b>{list.name}</b>
          <strong>{formatMoney(total, list.currency, hidden)}</strong>
        </div>
        <div className="list-meta">
          <span>{list.date}</span>
          <i />
          <span>{list.items.filter((item) => !item.removed).length} items</span>
          {spent > 0 && (
            <>
              <i />
              <span style={{ color: "var(--primary)" }}>
                {formatMoney(spent, list.currency, hidden)} spent
              </span>
            </>
          )}
        </div>
        <div className={`budget-line ${over ? "over" : near ? "near" : ""}`}>
          <i style={{ transform: `scaleX(${ratio})` }} />
        </div>
        <div className="list-row-bottom">
          <span>
            {budget
              ? `${formatMoney(total, list.currency, hidden)} / ${formatMoney(budget, list.currency, hidden)}`
              : "Total only"}
          </span>
          <span className={`status-chip ${over ? "over" : near ? "near" : ""}`}>
            {!budget
              ? "No limit"
              : over
                ? `Need ${formatMoney(total - budget, list.currency, hidden)} more`
                : near
                  ? "Nearly there"
                  : "Under budget"}
          </span>
        </div>
      </div>
      <Icon name="chevron" />
    </button>
  );
}

function ListDetail({
  list,
  hidden,
  update,
  addItem,
  removeItem,
  onEditItem,
  onDuplicateList,
  onDeleteList,
  onToggleHide,
  onToggleBought,
  onEditPurchase,
}: {
  list: PlanList;
  hidden: boolean;
  update: (fn: (list: PlanList) => PlanList) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  onEditItem: (id: string) => void;
  onDuplicateList: () => void;
  onDeleteList: () => void;
  onToggleHide: () => void;
  onToggleBought: (id: string) => void;
  onEditPurchase: (id: string) => void;
}) {
  const total = listTotal(list);
  const needs = listTotal(list, true);
  const spent = listSpent(list);

  const active = list.items.filter((item) => !item.removed && !item.bought);
  const bought = list.items.filter((item) => item.bought && !item.removed);
  const removed = list.items.filter((item) => item.removed);

  const budget = list.budget;
  const remaining = budget === null ? null : budget - total;
  const over = remaining !== null && remaining < 0;
  const near =
    remaining !== null && remaining >= 0 && remaining < budget! * 0.2;
  const status =
    budget === null ? "total" : over ? "over" : near ? "near" : "healthy";

  const [budgetDraft, setBudgetDraft] = useState(
    budget === null ? "" : String(budget / 100),
  );

  useEffect(() => {
    setBudgetDraft(budget === null ? "" : String(budget / 100));
  }, [budget]);

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setBudgetDraft(raw);
    update((current) => ({
      ...current,
      budget: raw.trim() ? parseAmount(raw) : null,
    }));
  };

  const chipClass =
    budget === null ? "neutral" : over ? "over" : near ? "near" : "left";
  const chipText =
    budget === null
      ? "Set a budget"
      : hidden
        ? over
          ? "Over budget"
          : "On budget"
        : over
          ? `Over ${formatMoney(Math.abs(remaining!), list.currency, false)}`
          : `Left ${formatMoney(remaining!, list.currency, false)}`;

  const meterLabel =
    budget === null
      ? "Total planned"
      : over
        ? "Over budget by"
        : "Left to spend";
  const meterValue = budget === null ? total : Math.abs(remaining!);
  const meterHint =
    budget === null
      ? `${active.length} planned item${active.length === 1 ? "" : "s"}`
      : over
        ? "Reduce some items or bump your budget"
        : near
          ? "You're close to your limit"
          : "You're on track";

  const ringProgress = budget ? Math.min((total / budget) * 360, 360) : 270;

  return (
    <section className="list-detail">
      <div className="detail-title">
        <div>
          <span className="eyebrow">
            {list.type} · {list.date}
          </span>
          <input
            aria-label="List name"
            value={list.name}
            onChange={(e) =>
              update((current) => ({ ...current, name: e.target.value }))
            }
          />
        </div>
        <ListMenu
          listName={list.name}
          onRename={() => {
            const next = prompt("Rename list", list.name);
            if (next && next.trim())
              update((c) => ({ ...c, name: next.trim() }));
          }}
          onDuplicate={onDuplicateList}
          onDelete={onDeleteList}
          onHideAmounts={onToggleHide}
          hideAmounts={hidden}
        />
      </div>

      {/* BUDGET METER */}
      <div className={`budget-meter ${status}`}>
        <div className="meter-input-row">
          <label className="meter-budget-input">
            <span>I have</span>
            <span className="meter-budget-symbol">
              {getCurrencySymbol(list.currency)}
            </span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0"
              value={budgetDraft}
              onChange={handleBudgetChange}
              aria-label="Budget amount"
            />
          </label>
          <span className={`meter-status-chip ${chipClass}`}>
            <i />
            {chipText}
          </span>
          <button
            type="button"
            className="meter-hide-btn"
            onClick={onToggleHide}
            aria-label={hidden ? "Show amounts" : "Hide amounts"}
          >
            <Icon name={hidden ? "eye" : "eye-off"} size={16} />
          </button>
        </div>

        <div className="meter-body">
          <div className="meter-copy">
            <span>{meterLabel}</span>
            <strong>{formatMoney(meterValue, list.currency, hidden)}</strong>
            <small>{meterHint}</small>
          </div>
          <div
            className="meter-ring"
            style={
              { "--progress": `${ringProgress}deg` } as React.CSSProperties
            }
          >
            <span>
              <Icon name={over ? "spark" : "check"} />
            </span>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="items-heading">
        <div>
          <h2>Items</h2>
          <span>{active.length}</span>
        </div>
        <Button className="ghost" onClick={addItem}>
          <Icon name="plus" /> Add item
        </Button>
      </div>

      {!active.length ? (
        <div className="items-empty">
          <span>
            <Icon name="plus" />
          </span>
          <b>Your list is ready</b>
          <p>Tap Add item to start planning.</p>
        </div>
      ) : (
        <div className="item-list">
          {active.map((item) => (
            <div className="item-row" key={item.id}>
              <button
                className="buy-check"
                aria-label={`Mark ${item.name} as bought`}
                onClick={() => onToggleBought(item.id)}
              >
                <Icon name="check" />
              </button>
              <button
                className="tag-dot"
                aria-label={`Change ${item.name} tag`}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    items: current.items.map((entry) =>
                      entry.id === item.id
                        ? {
                            ...entry,
                            tag:
                              entry.tag === "Need"
                                ? "Want"
                                : entry.tag === "Want"
                                  ? "Maybe"
                                  : "Need",
                          }
                        : entry,
                    ),
                  }))
                }
              >
                <i className={item.tag.toLowerCase()} />
              </button>
              <button
                type="button"
                className="item-edit-btn"
                onClick={() => onEditItem(item.id)}
                aria-label={`Edit ${item.name}`}
              >
                <div>
                  <b>{item.name}</b>
                  <span>
                    {item.quantity > 1
                      ? `${item.quantity} × ${formatMoney(item.price, list.currency, hidden)}`
                      : item.tag}
                  </span>
                </div>
              </button>
              <strong>
                {formatMoney(item.price * item.quantity, list.currency, hidden)}
              </strong>
              <IconButton
                label={`Remove ${item.name}`}
                icon="trash"
                onClick={() => removeItem(item.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      {!!active.length && (
        <>
          <div className="totals">
            <div>
              <span>Still to buy</span>
              <strong>{formatMoney(total, list.currency, hidden)}</strong>
            </div>
            <div>
              <span>Needs only</span>
              <strong>{formatMoney(needs, list.currency, hidden)}</strong>
            </div>
            {spent > 0 && (
              <div>
                <span>Already spent</span>
                <strong>{formatMoney(spent, list.currency, hidden)}</strong>
              </div>
            )}
          </div>
          <div className="reminder">
            <Icon name="spark" />
            <span>Did you include transport and food?</span>
          </div>
        </>
      )}

      {/* Bought items */}
      {!!bought.length && (
        <details className="removed" open>
          <summary>
            Bought <span>{bought.length}</span>
            <b>
              Spent{" "}
              {formatMoney(
                bought.reduce((sum, item) => sum + itemActualTotal(item), 0),
                list.currency,
                hidden,
              )}
              {listSavings(list) !== 0 && (
                <>
                  {" · "}
                  {listSavings(list) > 0
                    ? `Saved ${formatMoney(listSavings(list), list.currency, hidden)}`
                    : `Over ${formatMoney(Math.abs(listSavings(list)), list.currency, hidden)}`}
                </>
              )}
            </b>
          </summary>
          {bought.map((item) => {
            const saved = itemSavings(item);
            return (
              <div className="removed-row" key={item.id}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ textDecoration: "line-through" }}>
                    {item.name}
                  </span>
                  {item.actualPrice !== undefined && (
                    <small
                      className={`bought-delta ${saved > 0 ? "saved" : saved < 0 ? "over" : "same"}`}
                      style={{ display: "block", fontSize: "10.5px" }}
                    >
                      {saved === 0
                        ? `Paid ${formatMoney(itemActualTotal(item), list.currency, hidden)}`
                        : saved > 0
                          ? `Saved ${formatMoney(saved, list.currency, hidden)}`
                          : `Paid ${formatMoney(Math.abs(saved), list.currency, hidden)} extra`}
                    </small>
                  )}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Button
                    className="ghost"
                    onClick={() => onEditPurchase(item.id)}
                  >
                    Edit
                  </Button>
                  <Button
                    className="ghost"
                    onClick={() => onToggleBought(item.id)}
                  >
                    Unmark
                  </Button>
                </div>
              </div>
            );
          })}
        </details>
      )}

      {/* Removed items */}
      {!!removed.length && (
        <details className="removed">
          <summary>
            Removed <span>{removed.length}</span>
            <b>
              You chose not to spend{" "}
              {formatMoney(
                removed.reduce(
                  (sum, item) => sum + item.price * item.quantity,
                  0,
                ),
                list.currency,
                hidden,
              )}
            </b>
          </summary>
          {removed.map((item) => (
            <div className="removed-row" key={item.id}>
              <span>{item.name}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <Button
                  className="ghost"
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      items: current.items.map((entry) =>
                        entry.id === item.id
                          ? { ...entry, removed: false }
                          : entry,
                      ),
                    }))
                  }
                >
                  Restore
                </Button>
                <Button
                  className="danger"
                  onClick={() => {
                    if (!confirm(`Permanently delete "${item.name}"?`)) return;
                    update((current) => ({
                      ...current,
                      items: current.items.filter(
                        (entry) => entry.id !== item.id,
                      ),
                    }));
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </details>
      )}
    </section>
  );
}

function SummaryPanel({
  list,
  hidden,
  update,
  otherLists,
}: {
  list: PlanList;
  hidden: boolean;
  update: (fn: (list: PlanList) => PlanList) => void;
  otherLists: PlanList[];
}) {
  const total = listTotal(list);
  const spent = listSpent(list);
  const budget = list.budget;
  const remaining = budget === null ? null : budget - total;
  const over = remaining !== null && remaining < 0;

  return (
    <aside className="summary-panel">
      <div className="panel-heading">
        <span className="eyebrow">Live summary</span>
        <div className="saved-indicator">
          <Icon name="check" /> Saved
        </div>
      </div>

      {/* ---------- Numbers only, no input here ---------- */}
      <div className="summary-lines" style={{ borderTop: 0, paddingTop: 0 }}>
        <div>
          <span>Planned</span>
          <b>{formatMoney(total, list.currency, hidden)}</b>
        </div>
        {spent > 0 && (
          <div>
            <span>Spent (bought)</span>
            <b style={{ color: "var(--primary)" }}>
              {formatMoney(spent, list.currency, hidden)}
            </b>
          </div>
        )}
        <div className="accent">
          <span>{budget === null ? "Budget" : over ? "Need" : "Left"}</span>
          <b style={over ? { color: "var(--coral)" } : undefined}>
            {budget === null
              ? "Not set"
              : formatMoney(Math.abs(remaining!), list.currency, hidden)}
          </b>
        </div>
      </div>

      {/* ---------- Compare quick view ---------- */}
      <div className="panel-section">
        <div className="section-heading">
          <h3>Compare quick view</h3>
          <Icon name="compare" />
        </div>
        {otherLists.length ? (
          otherLists.slice(0, 2).map((other) => (
            <div className="quick-compare-row" key={other.id}>
              <span>{other.name}</span>
              <b>{formatMoney(listTotal(other), other.currency, hidden)}</b>
            </div>
          ))
        ) : (
          <p className="muted">Create another list to compare what fits.</p>
        )}
      </div>

      {/* ---------- Tip ---------- */}
      <div className="tip">
        <Icon name="spark" />
        <div>
          <b>Small choices add up</b>
          <span>Tag items Maybe to spot easy savings.</span>
        </div>
      </div>
    </aside>
  );
}

function CurrencyInput({
  value,
  currency,
  onChange,
}: {
  value: number | null;
  currency: string;
  onChange: (value: number | null) => void;
}) {
  const [draft, setDraft] = useState(value === null ? "" : String(value / 100));
  useEffect(() => setDraft(value === null ? "" : String(value / 100)), [value]);
  return (
    <div className="currency-input">
      <b>{currency}</b>
      <input
        inputMode="decimal"
        aria-label="I have amount"
        placeholder="Not set"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          onChange(e.target.value ? parseAmount(e.target.value) : null);
        }}
      />
    </div>
  );
}

function CompareView({ data, hidden }: { data: AppData; hidden: boolean }) {
  const [amount, setAmount] = useState("");
  const available = parseAmount(amount);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ---------- Auto-focus on mount ---------- */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => window.clearTimeout(timer);
  }, []);

  /* ---------- Focus + scroll helper ---------- */
  const focusInput = () => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    /* Scroll the field into view so the user sees it on mobile */
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Choose with confidence</span>
          <h1>Compare</h1>
          <p>See which plan fits what you have today.</p>
        </div>

        {/* ---------- If I have — clickable label + focusable input ---------- */}
        <label
          className="field compare-input-field"
          onClick={(e) => {
            /* Ensure clicking anywhere on the label focuses the input */
            e.preventDefault();
            focusInput();
          }}
        >
          <span>If I have</span>
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            placeholder="Enter an amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
      </div>

      {!data.lists.length ? (
        <PageEmpty
          icon="compare"
          title="Nothing to compare yet"
          text="Create two lists and they will appear here."
        />
      ) : (
        <div className="compare-grid">
          {data.lists.slice(0, 3).map((list, index) => {
            const total = listTotal(list);
            const balance = available === null ? null : available - total;
            return (
              <article className="compare-card" key={list.id}>
                <header>
                  <span>Option {index + 1}</span>
                  <Icon name={index === 0 ? "spark" : "lists"} />
                </header>

                {/* Mobile: title + price on one row. Desktop: stacked. */}
                <div className="compare-card-mobile-row">
                  <h2>{list.name}</h2>
                  <strong>{formatMoney(total, list.currency, hidden)}</strong>
                </div>

                <p>
                  {list.items.filter((item) => !item.removed).length} items ·{" "}
                  {list.type}
                </p>

                {balance === null ? (
                  <button
                    type="button"
                    className="fit-result fit-result-prompt"
                    onClick={focusInput}
                  >
                    Enter what you have
                  </button>
                ) : (
                  <div className={`fit-result ${balance < 0 ? "over" : ""}`}>
                    {balance >= 0
                      ? `Fits, ${formatMoney(balance, list.currency, hidden)} left`
                      : `Need ${formatMoney(Math.abs(balance), list.currency, hidden)} more`}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function WishlistView({
  data,
  setData,
  openAdd,
}: {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
  openAdd: () => void;
}) {
  const total = data.wishes.reduce((sum, wish) => sum + wish.price, 0);
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">For later, not never</span>
          <h1>Wishlist</h1>
          <p>Give future purchases a little space before deciding.</p>
        </div>
        <Button className="primary" icon="plus" onClick={openAdd}>
          Add to Wishlist
        </Button>
      </div>
      {!data.wishes.length ? (
        <PageEmpty
          icon="heart"
          title="Save ideas for later"
          text="Wishlist has no budget pressure. Add something you are considering."
          action={
            <Button className="secondary" onClick={openAdd}>
              Add your first item
            </Button>
          }
        />
      ) : (
        <div className="wishlist-layout">
          <div className="wish-list">
            {data.wishes.map((wish) => {
              const progress = wish.price
                ? Math.min(wish.saved / wish.price, 1)
                : 0;
              const hours = Math.max(
                0,
                24 - Math.floor((Date.now() - wish.createdAt) / 3600000),
              );
              return (
                <article className="wish-row" key={wish.id}>
                  <div className="wish-icon">
                    <Icon name="heart" />
                  </div>
                  <div>
                    <div className="wish-top">
                      <b>{wish.name}</b>
                      <span className={`tag ${wish.tag.toLowerCase()}`}>
                        {wish.tag}
                      </span>
                    </div>
                    <strong>
                      {formatMoney(wish.price, data.currency, data.hideAmounts)}
                    </strong>
                    <div className="saving-bar">
                      <i style={{ transform: `scaleX(${progress})` }} />
                    </div>
                    <small>
                      {formatMoney(wish.saved, data.currency, data.hideAmounts)}{" "}
                      saved · Think about it: {hours}h left
                    </small>
                  </div>
                  <IconButton
                    label={`Remove ${wish.name}`}
                    icon="trash"
                    onClick={() =>
                      setData((current) => ({
                        ...current,
                        wishes: current.wishes.filter(
                          (item) => item.id !== wish.id,
                        ),
                      }))
                    }
                  />
                </article>
              );
            })}
          </div>
          <aside className="wishlist-summary">
            <span className="eyebrow">Total needed</span>
            <strong>
              {formatMoney(total, data.currency, data.hideAmounts)}
            </strong>
            <p>No rush. A clear plan is progress too.</p>
          </aside>
        </div>
      )}
    </section>
  );
}

function InsightsView({ data }: { data: AppData }) {
  const totals = data.lists.map((list) => listTotal(list));
  const total = totals.reduce((sum, value) => sum + value, 0);
  const needs = data.lists.reduce(
    (sum, list) => sum + listTotal(list, true),
    0,
  );
  const wants = total - needs;
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Your patterns, gently</span>
          <h1>Insights</h1>
          <p>See what your planning habits are telling you.</p>
        </div>
        <span className="date-chip">This month</span>
      </div>
      {!data.lists.length ? (
        <PageEmpty
          icon="insights"
          title="Insights grow with your plans"
          text="Create a list and add items to start seeing helpful patterns."
        />
      ) : (
        <div className="insights-grid">
          <SavingsInsights
            items={data.lists.flatMap((l) => l.items)}
            currencySymbol={getCurrencySymbol(data.currency)}
            hidden={data.hideAmounts}
          />
          <SpendingBreakdown
            needs={needs}
            wants={data.lists.reduce(
              (sum, l) =>
                sum +
                l.items
                  .filter((i) => !i.removed && !i.bought && i.tag === "Want")
                  .reduce((s, i) => s + i.price * i.quantity, 0),
              0,
            )}
            maybe={data.lists.reduce(
              (sum, l) =>
                sum +
                l.items
                  .filter((i) => !i.removed && !i.bought && i.tag === "Maybe")
                  .reduce((s, i) => s + i.price * i.quantity, 0),
              0,
            )}
            bought={data.lists.reduce((sum, l) => sum + listSpent(l), 0)}
            total={total}
            formatMoney={formatMoney}
            currency={data.currency}
            hidden={data.hideAmounts}
          />
          <article className="insight-stat">
            <span>Total planned</span>
            <strong>
              {formatMoney(total, data.currency, data.hideAmounts)}
            </strong>
            <small>Across {data.lists.length} lists</small>
          </article>
          <article className="insight-stat good">
            <span>Needs</span>
            <strong>
              {formatMoney(needs, data.currency, data.hideAmounts)}
            </strong>
            <small>
              {total ? Math.round((needs / total) * 100) : 0}% of your plans
            </small>
          </article>
          <article className="insight-stat gold">
            <span>Wants + Maybe</span>
            <strong>
              {formatMoney(wants, data.currency, data.hideAmounts)}
            </strong>
            <small>Room to choose</small>
          </article>
          <article className="insight-chart">
            <div className="section-heading">
              <div>
                <span className="eyebrow">Monthly overview</span>
                <h2>Planned by list</h2>
              </div>
            </div>
            <div className="bars">
              {data.lists.slice(0, 6).map((list, index) => (
                <div key={list.id}>
                  <span>{list.name}</span>
                  <i>
                    <b
                      style={{
                        transform: `scaleY(${total ? listTotal(list) / Math.max(...totals) : 0})`,
                        animationDelay: `${index * 60}ms`,
                      }}
                    />
                  </i>
                  <strong>
                    {formatMoney(
                      listTotal(list),
                      list.currency,
                      data.hideAmounts,
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </article>
          <article className="insight-message">
            <Icon name="spark" />
            <div>
              <b>You are building a useful habit.</b>
              <p>
                Planning before spending makes every choice more intentional.
              </p>
            </div>
          </article>
        </div>
      )}
    </section>
  );
}

function SettingsView({
  data,
  update,
  replay,
}: {
  data: AppData;
  update: (next: Partial<AppData>) => void;
  replay: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pocket-plan-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return (
    <section className="page-section settings-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Make it yours</span>
          <h1>Settings</h1>
          <p>Privacy, appearance, backups, and offline access.</p>
        </div>
        <div className="offline-pill">
          <i /> Offline-ready
        </div>
      </div>
      <div className="settings-grid">
        <section className="settings-group">
          <h2>Preferences</h2>
          <div className="setting-row">
            <div>
              <b>Currency</b>
              <span>Used for new lists</span>
            </div>
            <div style={{ width: 200 }}>
              <CurrencyPicker
                value={data.currency}
                onChange={(code) => update({ currency: code })}
              />
            </div>
          </div>
          <div className="setting-row">
            <div>
              <b>Theme</b>
              <span>Light, Dark, or follow your device</span>
            </div>
            <select
              aria-label="Theme"
              value={data.theme}
              onChange={(e) =>
                update({ theme: e.target.value as AppData["theme"] })
              }
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>
          <div className="setting-row">
            <div>
              <b>Hide amounts</b>
              <span>Mask money everywhere</span>
            </div>
            <button
              role="switch"
              aria-checked={data.hideAmounts}
              className={`switch ${data.hideAmounts ? "on" : ""}`}
              onClick={() => update({ hideAmounts: !data.hideAmounts })}
            >
              <i />
            </button>
          </div>
        </section>
        <section className="settings-group">
          <h2>Install App</h2>
          <p>
            Add Pocket Plan to your home screen for faster access and offline
            use.
          </p>
          <InstallButton />
        </section>
        <section className="settings-group">
          <h2>Backup</h2>
          <p className="warning">
            Your data is only on this device. Export a backup regularly in case
            you clear your browser data or change phones.
          </p>
          <div className="settings-actions">
            <Button className="secondary" icon="download" onClick={exportData}>
              Export backup
            </Button>
            <Button
              className="secondary"
              icon="upload"
              onClick={() => fileRef.current?.click()}
            >
              Import backup
            </Button>
            <input
              ref={fileRef}
              hidden
              type="file"
              accept=".json"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                file.text().then((text) => update(JSON.parse(text)));
              }}
            />
          </div>
        </section>
        <section className="settings-group">
          <h2>About and offline</h2>
          <div className="about-mark">
            <Logo />
            <span>Version 1.0</span>
          </div>
          <p>
            Mostly offline: everything works without internet. Only optional
            currency conversion needs a connection.
          </p>
          <Button className="ghost" onClick={replay}>
            Replay tutorial
          </Button>
        </section>
        <section className="settings-group danger-zone">
          <h2>Danger zone</h2>
          <p>Deleting data cannot be undone without a backup.</p>
          <div className="settings-actions">
            <Button
              className="danger"
              icon="trash"
              disabled={!data.lists.length}
              onClick={() => {
                if (confirm("Delete all lists and Wishlist items?"))
                  update({ lists: [], wishes: [] });
              }}
            >
              Delete all data
            </Button>
          </div>
        </section>
      </div>
    </section>
  );
}

function PageEmpty({
  icon,
  title,
  text,
  action,
}: {
  icon: IconName;
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-empty">
      <span>
        <Icon name={icon} size={30} />
      </span>
      <h2>{title}</h2>
      <p>{text}</p>
      {action}
    </div>
  );
}

function NewListModal({
  currency,
  onClose,
  onSave,
}: {
  currency: string;
  onClose: () => void;
  onSave: (list: PlanList) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState<ListType>("Window shopping");
  const [budget, setBudget] = useState("");
  const [unsure, setUnsure] = useState(false);
  const [error, setError] = useState("");
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Add a name for this list.");
      return;
    }
    const amount = unsure || !budget ? null : parseAmount(budget);
    if (!unsure && budget && amount === null) {
      setError("Enter a valid amount.");
      return;
    }
    onSave({
      id: uid(),
      name: name.trim(),
      type,
      date: new Date().toISOString().slice(0, 10),
      currency,
      budget: amount,
      note: "",
      items: [],
    });
  }
  return (
    <Modal title="New list" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <Field
          label="List name"
          autoFocus
          value={name}
          placeholder="e.g. Saturday in town"
          onChange={(e) => setName(e.target.value)}
        />
        <SelectField
          label="Type"
          value={type}
          onChange={(e) => setType(e.target.value as ListType)}
        >
          {[
            "Window shopping",
            "Groceries",
            "Market day",
            "Gifts",
            "Custom",
          ].map((value) => (
            <option key={value}>{value}</option>
          ))}
        </SelectField>
        {!unsure && (
          <Field
            label="I have"
            value={budget}
            inputMode="decimal"
            placeholder="Optional"
            hint="You can use calculations like 250*3"
            onChange={(e) => setBudget(e.target.value)}
          />
        )}
        <label className="check-row">
          <input
            type="checkbox"
            checked={unsure}
            onChange={(e) => setUnsure(e.target.checked)}
          />
          <i>
            <Icon name="check" />
          </i>
          <span>I'm not sure how much I have</span>
        </label>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <Button type="button" className="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="primary">
            Create list
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function NewItemModal({
  currency,
  onClose,
  onSave,
}: {
  currency: string;
  onClose: () => void;
  onSave: (item: Item) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [tag, setTag] = useState<Tag>("Need");
  const [error, setError] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);

  const parsedPrice = parseAmount(price);
  const priceValid = parsedPrice !== null && parsedPrice > 0;
  const nameValid = name.trim().length > 0;
  const qtyValid = quantity >= 1;
  const canSubmit = nameValid && priceValid && qtyValid;

  useEffect(() => {
    if (!error) return;
    if (!nameValid) nameRef.current?.focus();
    else if (!priceValid) priceRef.current?.focus();
    else if (!qtyValid) qtyRef.current?.focus();
  }, [error, nameValid, priceValid, qtyValid]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!nameValid) return setError("Add an item name.");
    if (!priceValid) return setError("Enter a valid price.");
    if (!qtyValid) return setError("Quantity must be at least 1.");
    onSave({
      id: uid(),
      name: name.trim(),
      price: parsedPrice!,
      quantity,
      tag,
    });
    navigator.vibrate?.(20);
  }

  return (
    <Modal title="Add item" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <label className="field">
          <span>Item name</span>
          <input
            ref={nameRef}
            type="text"
            value={name}
            placeholder="What are you considering?"
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label className="field">
          <span>Price ({getCurrencySymbol(currency)})</span>
          <input
            ref={priceRef}
            type="text"
            inputMode="decimal"
            value={price}
            placeholder="0.00"
            onChange={(e) => setPrice(e.target.value)}
          />
          <small>Calculator input works: 250*3 or 1200-200</small>
        </label>
        <label className="field">
          <span>Quantity</span>
          <QuantityInput
            value={quantity}
            onChange={setQuantity}
            invalid={!qtyValid}
            inputRef={qtyRef}
          />
        </label>
        <fieldset className="tag-picker">
          <legend>Tag</legend>
          {(["Need", "Want", "Maybe"] as Tag[]).map((value) => (
            <Button
              type="button"
              key={value}
              className={`tag-option ${value.toLowerCase()} ${
                tag === value ? "selected" : ""
              }`}
              onClick={() => setTag(value)}
            >
              <i />
              {value}
            </Button>
          ))}
        </fieldset>
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <Button type="button" className="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="primary" disabled={!canSubmit}>
            Add item
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function NewWishModal({
  currency,
  onClose,
  onSave,
}: {
  currency: string;
  onClose: () => void;
  onSave: (wish: Wish) => void;
}) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [tag, setTag] = useState<Tag>("Want");
  return (
    <Modal title="Add to Wishlist" onClose={onClose}>
      <form
        className="modal-form"
        onSubmit={(e) => {
          e.preventDefault();
          const amount = parseAmount(price);
          if (name && amount !== null)
            onSave({
              id: uid(),
              name,
              price: amount,
              saved: 0,
              tag,
              createdAt: Date.now(),
            });
        }}
      >
        <Field
          label="Item name"
          value={name}
          autoFocus
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label={`Target price (${currency})`}
          value={price}
          inputMode="decimal"
          onChange={(e) => setPrice(e.target.value)}
        />
        <fieldset className="tag-picker">
          <legend>Tag</legend>
          {(["Need", "Want", "Maybe"] as Tag[]).map((value) => (
            <Button
              type="button"
              key={value}
              className={`tag-option ${value.toLowerCase()} ${tag === value ? "selected" : ""}`}
              onClick={() => setTag(value)}
            >
              <i />
              {value}
            </Button>
          ))}
        </fieldset>
        <div className="modal-actions">
          <Button type="button" className="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="primary">
            Save for later
          </Button>
        </div>
      </form>
    </Modal>
  );
}

async function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("pocket-plan", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("app");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadData() {
  try {
    const db = await openDB();
    const stored = await new Promise<AppData | undefined>((resolve) => {
      const request = db.transaction("app").objectStore("app").get("data");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
    });
    /* Migration: records saved before the security feature existed
       won't have a `security` field — add sensible defaults. */
    if (stored && !stored.security) {
      stored.security = {
        pinHash: null,
        pinSalt: null,
        biometricCredentialId: null,
        biometricEnabled: false,
        autoLockMinutes: 5,
      };
    }
    return stored;
  } catch {
    return undefined;
  }
}

async function saveData(data: AppData) {
  try {
    const db = await openDB();
    db.transaction("app", "readwrite").objectStore("app").put(data, "data");
  } catch {
    /* Private browsing may block IndexedDB. */
  }
}

function InstallButton() {
  const { canInstall, isInstalled, isIOS, promptInstall } = usePWAInstall();
  const [feedback, setFeedback] = useState("");

  const handleClick = async () => {
    if (isIOS) {
      setFeedback("On iOS: tap Share → Add to Home Screen.");
      return;
    }
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      setFeedback("Installed!");
    } else if (outcome === "dismissed") {
      setFeedback("Install cancelled.");
    } else {
      setFeedback(
        "Your browser doesn't support one-click install. Use the browser menu → Install app.",
      );
    }
  };

  if (isInstalled) {
    return (
      <p style={{ color: "var(--primary)", fontWeight: 600 }}>
        ✓ Pocket Plan is installed
      </p>
    );
  }

  return (
    <>
      <button
        className="button secondary"
        onClick={handleClick}
        disabled={!canInstall}
      >
        <Icon name="download" /> Install Pocket Plan
      </button>
      {feedback && (
        <p style={{ marginTop: 10, fontSize: 12, color: "var(--muted)" }}>
          {feedback}
        </p>
      )}
    </>
  );
}
