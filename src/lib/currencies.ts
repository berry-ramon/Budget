/* =========================================================
   CURRENCY DATA
   ---------------------------------------------------------
   Country name is derived from the region code via
   Intl.DisplayNames, so the labels are localized for free.
   Symbols are hardcoded for the most common currencies
   because Intl sometimes returns the code itself as the
   "symbol" (unhelpful in a picker).
   ========================================================= */

const CURRENCY_TO_REGION: Record<string, string> = {
  // ── Africa ──
  KES: "KE",
  UGX: "UG",
  TZS: "TZ",
  RWF: "RW",
  ETB: "ET",
  ZAR: "ZA",
  NGN: "NG",
  GHS: "GH",
  EGP: "EG",
  MAD: "MA",
  TND: "TN",
  DZD: "DZ",
  MZN: "MZ",
  ZMW: "ZM",
  MWK: "MW",
  BWP: "BW",
  NAD: "NA",
  MUR: "MU",
  XOF: "SN", // West African CFA (Senegal as representative)
  XAF: "CM", // Central African CFA (Cameroon)
  // ── Middle East ──
  AED: "AE",
  SAR: "SA",
  QAR: "QA",
  KWD: "KW",
  BHD: "BH",
  OMR: "OM",
  JOD: "JO",
  ILS: "IL",
  // ── Asia ──
  INR: "IN",
  PKR: "PK",
  BDT: "BD",
  LKR: "LK",
  CNY: "CN",
  JPY: "JP",
  KRW: "KR",
  SGD: "SG",
  MYR: "MY",
  THB: "TH",
  IDR: "ID",
  PHP: "PH",
  VND: "VN",
  HKD: "HK",
  TWD: "TW",
  // ── Europe ──
  EUR: "EU",
  GBP: "GB",
  CHF: "CH",
  NOK: "NO",
  SEK: "SE",
  DKK: "DK",
  PLN: "PL",
  CZK: "CZ",
  HUF: "HU",
  RON: "RO",
  TRY: "TR",
  RUB: "RU",
  UAH: "UA",
  // ── Americas ──
  USD: "US",
  CAD: "CA",
  MXN: "MX",
  BRL: "BR",
  ARS: "AR",
  CLP: "CL",
  COP: "CO",
  PEN: "PE",
  // ── Oceania ──
  AUD: "AU",
  NZD: "NZ",
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  KES: "KSh",
  USD: "$",
  GBP: "£",
  EUR: "€",
  UGX: "USh",
  TZS: "TSh",
  RWF: "FRw",
  ETB: "Br",
  ZAR: "R",
  NGN: "₦",
  GHS: "₵",
  EGP: "E£",
  MAD: "DH",
  TND: "DT",
  DZD: "DA",
  MZN: "MT",
  ZMW: "ZK",
  MWK: "MK",
  BWP: "P",
  NAD: "$",
  MUR: "₨",
  XOF: "CFA",
  XAF: "FCFA",
  AED: "د.إ",
  SAR: "﷼",
  QAR: "﷼",
  KWD: "د.ك",
  BHD: ".د.ب",
  OMR: "﷼",
  JOD: "د.ا",
  ILS: "₪",
  INR: "₹",
  PKR: "₨",
  BDT: "৳",
  LKR: "₨",
  CNY: "¥",
  JPY: "¥",
  KRW: "₩",
  SGD: "S$",
  MYR: "RM",
  THB: "฿",
  IDR: "Rp",
  PHP: "₱",
  VND: "₫",
  HKD: "HK$",
  TWD: "NT$",
  CHF: "Fr",
  NOK: "kr",
  SEK: "kr",
  DKK: "kr",
  PLN: "zł",
  CZK: "Kč",
  HUF: "Ft",
  RON: "lei",
  TRY: "₺",
  RUB: "₽",
  UAH: "₴",
  CAD: "C$",
  MXN: "MX$",
  BRL: "R$",
  ARS: "$",
  CLP: "$",
  COP: "$",
  PEN: "S/",
  AUD: "A$",
  NZD: "NZ$",
};

/* Pin these at the top of the picker, in this order */
export const POPULAR_CURRENCIES = [
  "KES",
  "USD",
  "GBP",
  "EUR",
  "ZAR",
  "UGX",
  "TZS",
  "RWF",
  "NGN",
  "GHS",
  "AED",
  "INR",
];

/* ---------- Types ---------- */

export type CurrencyInfo = {
  code: string;
  country: string;
  countryCode: string;
  name: string;
  symbol: string;
  flag: string;
};

/* ---------- Helpers ---------- */

function flagFromRegion(code: string): string {
  if (!code || code.length !== 2) return "🌐";
  try {
    return code
      .toUpperCase()
      .replace(/./g, (ch) =>
        String.fromCodePoint(0x1f1e6 + ch.charCodeAt(0) - 65),
      );
  } catch {
    return "🌐";
  }
}

function buildCurrencyInfo(
  code: string,
  locale: string,
  regionNames: Intl.DisplayNames,
  currencyNames: Intl.DisplayNames,
): CurrencyInfo {
  const regionCode = CURRENCY_TO_REGION[code];
  const country = regionCode ? (regionNames.of(regionCode) ?? code) : code;
  const name = currencyNames.of(code) ?? code;
  const symbol = CURRENCY_SYMBOLS[code] ?? code;
  const flag = regionCode ? flagFromRegion(regionCode) : "🌐";
  return {
    code,
    country,
    countryCode: regionCode ?? "",
    name,
    symbol,
    flag,
  };
}

/* ---------- Public: full sorted list ---------- */

export function getCurrencies(locale: string = "en"): CurrencyInfo[] {
  const regionNames = new Intl.DisplayNames([locale], { type: "region" });
  const currencyNames = new Intl.DisplayNames([locale], {
    type: "currency",
  });

  const supported = (
    Intl as typeof Intl & {
      supportedValuesOf?: (key: string) => string[];
    }
  ).supportedValuesOf?.("currency") ?? [
    "KES",
    "USD",
    "GBP",
    "EUR",
    "UGX",
    "TZS",
    "RWF",
    "ZAR",
    "NGN",
    "GHS",
    "AED",
    "INR",
  ];

  return supported
    .map((code) => buildCurrencyInfo(code, locale, regionNames, currencyNames))
    .sort((a, b) => a.country.localeCompare(b.country));
}

/* ---------- Public: single lookup ---------- */

export function getCurrency(code: string, locale: string = "en"): CurrencyInfo {
  const regionNames = new Intl.DisplayNames([locale], { type: "region" });
  const currencyNames = new Intl.DisplayNames([locale], {
    type: "currency",
  });
  return buildCurrencyInfo(code, locale, regionNames, currencyNames);
}

/* ---------- Public: search index ---------- */

export function currencySearchKey(c: CurrencyInfo): string {
  return [c.code, c.country, c.name, c.symbol].join(" ").toLowerCase();
}
