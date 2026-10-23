import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { InstallPrompt } from "./components/InstallPrompt";
import { usePWAInstall } from "./hooks/usePWAInstall";

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
  | "market";

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

type AppData = {
  lists: PlanList[];
  wishes: Wish[];
  currency: string;
  theme: "system" | "light" | "dark";
  hideAmounts: boolean;
  setupComplete: boolean;
};

const initialData: AppData = {
  lists: [],
  wishes: [],
  currency: detectCurrency(),
  theme: "system",
  hideAmounts: false,
  setupComplete: false,
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
  return map[region] || "USD";
}

function uid() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function formatMoney(value: number, currency: string, hidden = false) {
  if (hidden) return "••••";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: ["JPY", "UGX", "RWF"].includes(currency) ? 0 : 2,
  }).format(value / 100);
}

function listTotal(list: PlanList, needsOnly = false) {
  return list.items
    .filter((item) => !item.removed && (!needsOnly || item.tag === "Need"))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function currencyOptions() {
  try {
    return (
      (
        Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] }
      ).supportedValuesOf?.("currency") || ["USD", "EUR", "GBP", "KES"]
    );
  } catch {
    return ["USD", "EUR", "GBP", "KES", "UGX", "TZS", "RWF", "JPY", "INR"];
  }
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
  return (
    <main className="setup-page">
      <section className="setup-panel">
        <Logo />
        <div className="setup-heading">
          <span className="eyebrow">One quick setup</span>
          <h1>Make Pocket Plan yours</h1>
          <p>You can change these anytime in Settings.</p>
        </div>
        <div className="setup-fields">
          <SelectField
            label="Your currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {currencyOptions().map((code) => (
              <option value={code} key={code}>
                {code} -{" "}
                {new Intl.DisplayNames([navigator.language], {
                  type: "currency",
                }).of(code)}
              </option>
            ))}
          </SelectField>
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
        <Button
          className="primary full"
          onClick={() =>
            onComplete({ ...data, currency, theme, setupComplete: true })
          }
        >
          Start planning <Icon name="arrow" />
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

  useEffect(() => {
    loadData().then((stored) => {
      if (stored) setData(stored);
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
  if (!data.setupComplete) return <Setup data={data} onComplete={setData} />;

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
            {view === "Lists" && (
              <Button
                className="primary add-desktop"
                icon="plus"
                disabled={!selected}
                onClick={() => setModal("item")}
              >
                Add item <kbd>A</kbd>
              </Button>
            )}
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
      <InstallPrompt enabled={true} />
      {toast && (
        <div className="toast">
          <Icon name="check" />
          <span>{toast}</span>
          <Button className="ghost" onClick={() => setToast("")}>
            Dismiss
          </Button>
          <i />
        </div>
      )}
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
        className={`type-icon type-${list.type.toLowerCase().replaceAll(" ", "-")}`}
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
          <i />{" "}
          <span>{list.items.filter((item) => !item.removed).length} items</span>
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
}: {
  list: PlanList;
  hidden: boolean;
  update: (fn: (list: PlanList) => PlanList) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
}) {
  const total = listTotal(list);
  const needs = listTotal(list, true);
  const active = list.items.filter((item) => !item.removed);
  const removed = list.items.filter((item) => item.removed);
  const status =
    list.budget === null
      ? "total"
      : total > list.budget
        ? "over"
        : total / list.budget > 0.8
          ? "near"
          : "healthy";
  const difference = list.budget === null ? 0 : list.budget - total;
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
        <IconButton label="More options" icon="more" />
      </div>
      <div className={`budget-meter ${status}`}>
        <div className="meter-copy">
          <span>
            {list.budget === null
              ? "Total"
              : difference >= 0
                ? "Left"
                : "Need more"}
          </span>
          <strong>
            {formatMoney(
              list.budget === null ? total : Math.abs(difference),
              list.currency,
              hidden,
            )}
          </strong>
          <small>
            {list.budget === null
              ? `${active.length} planned items`
              : difference >= 0
                ? `Nice, you're ${formatMoney(difference, list.currency, hidden)} under budget`
                : `A small edit can bring this plan in`}
          </small>
        </div>
        <div
          className="meter-ring"
          style={
            {
              "--progress": `${list.budget ? Math.min(total / list.budget, 1) * 360 : 270}deg`,
            } as React.CSSProperties
          }
        >
          <span>
            <Icon name={status === "over" ? "spark" : "check"} />
          </span>
        </div>
      </div>
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
              <div>
                <b>{item.name}</b>
                <span>
                  {item.quantity > 1
                    ? `${item.quantity} × ${formatMoney(item.price, list.currency, hidden)}`
                    : item.tag}
                </span>
              </div>
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
      {!!active.length && (
        <>
          <div className="totals">
            <div>
              <span>Everything</span>
              <strong>{formatMoney(total, list.currency, hidden)}</strong>
            </div>
            <div>
              <span>Needs only</span>
              <strong>{formatMoney(needs, list.currency, hidden)}</strong>
            </div>
          </div>
          <div className="reminder">
            <Icon name="spark" />
            <span>Did you include transport and food?</span>
          </div>
        </>
      )}
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
  return (
    <aside className="summary-panel">
      <div className="panel-heading">
        <span className="eyebrow">Live summary</span>
        <div className="saved-indicator">
          <Icon name="check" /> Saved
        </div>
      </div>
      <div className="have-field">
        <span>I have</span>
        <CurrencyInput
          value={list.budget}
          currency={list.currency}
          onChange={(budget) => update((current) => ({ ...current, budget }))}
        />
        <small>Updates your plan instantly</small>
      </div>
      <div className="summary-lines">
        <div>
          <span>Spent</span>
          <b>{formatMoney(total, list.currency, hidden)}</b>
        </div>
        <div className="accent">
          <span>
            {list.budget !== null && total > list.budget ? "Need" : "Left"}
          </span>
          <b>
            {formatMoney(
              list.budget === null ? 0 : Math.abs(list.budget - total),
              list.currency,
              hidden,
            )}
          </b>
        </div>
      </div>
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
  return (
    <section className="page-section">
      <div className="page-heading">
        <div>
          <span className="eyebrow">Choose with confidence</span>
          <h1>Compare</h1>
          <p>See which plan fits what you have today.</p>
        </div>
        <Field
          label="If I have"
          value={amount}
          placeholder="Enter an amount"
          inputMode="decimal"
          onChange={(e) => setAmount(e.target.value)}
        />
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
                <h2>{list.name}</h2>
                <p>
                  {list.items.filter((item) => !item.removed).length} items ·{" "}
                  {list.type}
                </p>
                <strong>{formatMoney(total, list.currency, hidden)}</strong>
                <div
                  className={`fit-result ${balance !== null && balance < 0 ? "over" : ""}`}
                >
                  {balance === null
                    ? "Enter what you have"
                    : balance >= 0
                      ? `Fits, ${formatMoney(balance, list.currency, hidden)} left`
                      : `Need ${formatMoney(Math.abs(balance), list.currency, hidden)} more`}
                </div>
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
            <select
              aria-label="Currency"
              value={data.currency}
              onChange={(e) => update({ currency: e.target.value })}
            >
              {currencyOptions().map((code) => (
                <option key={code}>{code}</option>
              ))}
            </select>
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
  function submit(event: React.FormEvent) {
    event.preventDefault();
    const amount = parseAmount(price);
    if (!name.trim()) return setError("Add an item name.");
    if (amount === null) return setError("Enter a valid price.");
    onSave({ id: uid(), name: name.trim(), price: amount, quantity, tag });
    navigator.vibrate?.(20);
  }
  return (
    <Modal title="Add item" onClose={onClose}>
      <form className="modal-form" onSubmit={submit}>
        <Field
          label="Item name"
          autoFocus
          value={name}
          placeholder="What are you considering?"
          onChange={(e) => setName(e.target.value)}
        />
        <Field
          label={`Price (${currency})`}
          value={price}
          inputMode="decimal"
          placeholder="0.00"
          hint="Calculator input works: 250*3 or 1200-200"
          onChange={(e) => setPrice(e.target.value)}
        />
        <Field
          label="Quantity"
          type="number"
          min="1"
          max="99"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
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
        {error && <p className="form-error">{error}</p>}
        <div className="modal-actions">
          <Button type="button" className="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="primary">
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
    return await new Promise<AppData | undefined>((resolve) => {
      const request = db.transaction("app").objectStore("app").get("data");
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(undefined);
    });
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
