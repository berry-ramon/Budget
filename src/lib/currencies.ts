/* =========================================================
   CURRENCIES
   ---------------------------------------------------------
   Curated, hardcoded list of ~40 currencies for a budgeting
   app. No dependency on Intl.supportedValuesOf or
   Intl.DisplayNames — both are unreliable on mobile WebViews.

   Adding a new currency: add one line to the CURRENCIES
   array and one symbol entry to CURRENCY_SYMBOLS.
   ========================================================= */

export type CurrencyInfo = {
  code: string;
  country: string;
  countryCode: string;
  name: string;
  symbol: string;
  flag: string;
};

/* ---------- Symbols used by formatMoney ---------- */

export const CURRENCY_SYMBOLS: Record<string, string> = {
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
  AED: "د.إ",
  SAR: "﷼",
  QAR: "﷼",
  KWD: "د.ك",
  BHD: ".د.ب",
  INR: "₹",
  PKR: "₨",
  BDT: "৳",
  CNY: "¥",
  JPY: "¥",
  KRW: "₩",
  SGD: "S$",
  MYR: "RM",
  THB: "฿",
  IDR: "Rp",
  PHP: "₱",
  HKD: "HK$",
  CHF: "Fr",
  NOK: "kr",
  SEK: "kr",
  DKK: "kr",
  PLN: "zł",
  TRY: "₺",
  CAD: "C$",
  MXN: "MX$",
  BRL: "R$",
  AUD: "A$",
  NZD: "NZ$",
};

/* ---------- Full currency catalog ----------
   Order matters: KES first, then common African currencies,
   then major global currencies.
*/

export const CURRENCIES: CurrencyInfo[] = [
  /* ── Kenya and East Africa ── */
  {
    code: "KES",
    country: "Kenya",
    countryCode: "KE",
    name: "Kenyan Shilling",
    symbol: "KSh",
    flag: "🇰🇪",
  },
  {
    code: "UGX",
    country: "Uganda",
    countryCode: "UG",
    name: "Ugandan Shilling",
    symbol: "USh",
    flag: "🇺🇬",
  },
  {
    code: "TZS",
    country: "Tanzania",
    countryCode: "TZ",
    name: "Tanzanian Shilling",
    symbol: "TSh",
    flag: "🇹🇿",
  },
  {
    code: "RWF",
    country: "Rwanda",
    countryCode: "RW",
    name: "Rwandan Franc",
    symbol: "FRw",
    flag: "🇷🇼",
  },
  {
    code: "ETB",
    country: "Ethiopia",
    countryCode: "ET",
    name: "Ethiopian Birr",
    symbol: "Br",
    flag: "🇪🇹",
  },
  {
    code: "BIF",
    country: "Burundi",
    countryCode: "BI",
    name: "Burundian Franc",
    symbol: "FBu",
    flag: "🇧🇮",
  },
  {
    code: "SSP",
    country: "South Sudan",
    countryCode: "SS",
    name: "South Sudanese Pound",
    symbol: "SS£",
    flag: "🇸🇸",
  },

  /* ── Rest of Africa ── */
  {
    code: "ZAR",
    country: "South Africa",
    countryCode: "ZA",
    name: "South African Rand",
    symbol: "R",
    flag: "🇿🇦",
  },
  {
    code: "NGN",
    country: "Nigeria",
    countryCode: "NG",
    name: "Nigerian Naira",
    symbol: "₦",
    flag: "🇳🇬",
  },
  {
    code: "GHS",
    country: "Ghana",
    countryCode: "GH",
    name: "Ghanaian Cedi",
    symbol: "₵",
    flag: "🇬🇭",
  },
  {
    code: "EGP",
    country: "Egypt",
    countryCode: "EG",
    name: "Egyptian Pound",
    symbol: "E£",
    flag: "🇪🇬",
  },
  {
    code: "MAD",
    country: "Morocco",
    countryCode: "MA",
    name: "Moroccan Dirham",
    symbol: "DH",
    flag: "🇲🇦",
  },
  {
    code: "TND",
    country: "Tunisia",
    countryCode: "TN",
    name: "Tunisian Dinar",
    symbol: "DT",
    flag: "🇹🇳",
  },
  {
    code: "ZMW",
    country: "Zambia",
    countryCode: "ZM",
    name: "Zambian Kwacha",
    symbol: "ZK",
    flag: "🇿🇲",
  },
  {
    code: "BWP",
    country: "Botswana",
    countryCode: "BW",
    name: "Botswana Pula",
    symbol: "P",
    flag: "🇧🇼",
  },
  {
    code: "MZN",
    country: "Mozambique",
    countryCode: "MZ",
    name: "Mozambican Metical",
    symbol: "MT",
    flag: "🇲🇿",
  },

  /* ── Middle East ── */
  {
    code: "AED",
    country: "United Arab Emirates",
    countryCode: "AE",
    name: "UAE Dirham",
    symbol: "د.إ",
    flag: "🇦🇪",
  },
  {
    code: "SAR",
    country: "Saudi Arabia",
    countryCode: "SA",
    name: "Saudi Riyal",
    symbol: "﷼",
    flag: "🇸🇦",
  },
  {
    code: "QAR",
    country: "Qatar",
    countryCode: "QA",
    name: "Qatari Riyal",
    symbol: "﷼",
    flag: "🇶🇦",
  },
  {
    code: "KWD",
    country: "Kuwait",
    countryCode: "KW",
    name: "Kuwaiti Dinar",
    symbol: "د.ك",
    flag: "🇰🇼",
  },
  {
    code: "BHD",
    country: "Bahrain",
    countryCode: "BH",
    name: "Bahraini Dinar",
    symbol: ".د.ب",
    flag: "🇧🇭",
  },
  {
    code: "OMR",
    country: "Oman",
    countryCode: "OM",
    name: "Omani Rial",
    symbol: "﷼",
    flag: "🇴🇲",
  },
  {
    code: "JOD",
    country: "Jordan",
    countryCode: "JO",
    name: "Jordanian Dinar",
    symbol: "د.ا",
    flag: "🇯🇴",
  },

  /* ── Europe ── */
  {
    code: "EUR",
    country: "European Union",
    countryCode: "EU",
    name: "Euro",
    symbol: "€",
    flag: "🇪🇺",
  },
  {
    code: "GBP",
    country: "United Kingdom",
    countryCode: "GB",
    name: "British Pound",
    symbol: "£",
    flag: "🇬🇧",
  },
  {
    code: "CHF",
    country: "Switzerland",
    countryCode: "CH",
    name: "Swiss Franc",
    symbol: "Fr",
    flag: "🇨🇭",
  },
  {
    code: "NOK",
    country: "Norway",
    countryCode: "NO",
    name: "Norwegian Krone",
    symbol: "kr",
    flag: "🇳🇴",
  },
  {
    code: "SEK",
    country: "Sweden",
    countryCode: "SE",
    name: "Swedish Krona",
    symbol: "kr",
    flag: "🇸🇪",
  },
  {
    code: "DKK",
    country: "Denmark",
    countryCode: "DK",
    name: "Danish Krone",
    symbol: "kr",
    flag: "🇩🇰",
  },
  {
    code: "PLN",
    country: "Poland",
    countryCode: "PL",
    name: "Polish Zloty",
    symbol: "zł",
    flag: "🇵🇱",
  },
  {
    code: "TRY",
    country: "Turkey",
    countryCode: "TR",
    name: "Turkish Lira",
    symbol: "₺",
    flag: "🇹🇷",
  },

  /* ── Asia ── */
  {
    code: "INR",
    country: "India",
    countryCode: "IN",
    name: "Indian Rupee",
    symbol: "₹",
    flag: "🇮🇳",
  },
  {
    code: "PKR",
    country: "Pakistan",
    countryCode: "PK",
    name: "Pakistani Rupee",
    symbol: "₨",
    flag: "🇵🇰",
  },
  {
    code: "BDT",
    country: "Bangladesh",
    countryCode: "BD",
    name: "Bangladeshi Taka",
    symbol: "৳",
    flag: "🇧🇩",
  },
  {
    code: "CNY",
    country: "China",
    countryCode: "CN",
    name: "Chinese Yuan",
    symbol: "¥",
    flag: "🇨🇳",
  },
  {
    code: "JPY",
    country: "Japan",
    countryCode: "JP",
    name: "Japanese Yen",
    symbol: "¥",
    flag: "🇯🇵",
  },
  {
    code: "KRW",
    country: "South Korea",
    countryCode: "KR",
    name: "South Korean Won",
    symbol: "₩",
    flag: "🇰🇷",
  },
  {
    code: "SGD",
    country: "Singapore",
    countryCode: "SG",
    name: "Singapore Dollar",
    symbol: "S$",
    flag: "🇸🇬",
  },
  {
    code: "MYR",
    country: "Malaysia",
    countryCode: "MY",
    name: "Malaysian Ringgit",
    symbol: "RM",
    flag: "🇲🇾",
  },
  {
    code: "THB",
    country: "Thailand",
    countryCode: "TH",
    name: "Thai Baht",
    symbol: "฿",
    flag: "🇹🇭",
  },
  {
    code: "IDR",
    country: "Indonesia",
    countryCode: "ID",
    name: "Indonesian Rupiah",
    symbol: "Rp",
    flag: "🇮🇩",
  },
  {
    code: "PHP",
    country: "Philippines",
    countryCode: "PH",
    name: "Philippine Peso",
    symbol: "₱",
    flag: "🇵🇭",
  },

  /* ── Americas ── */
  {
    code: "USD",
    country: "United States",
    countryCode: "US",
    name: "US Dollar",
    symbol: "$",
    flag: "🇺🇸",
  },
  {
    code: "CAD",
    country: "Canada",
    countryCode: "CA",
    name: "Canadian Dollar",
    symbol: "C$",
    flag: "🇨🇦",
  },
  {
    code: "MXN",
    country: "Mexico",
    countryCode: "MX",
    name: "Mexican Peso",
    symbol: "MX$",
    flag: "🇲🇽",
  },
  {
    code: "BRL",
    country: "Brazil",
    countryCode: "BR",
    name: "Brazilian Real",
    symbol: "R$",
    flag: "🇧🇷",
  },

  /* ── Oceania ── */
  {
    code: "AUD",
    country: "Australia",
    countryCode: "AU",
    name: "Australian Dollar",
    symbol: "A$",
    flag: "🇦🇺",
  },
  {
    code: "NZD",
    country: "New Zealand",
    countryCode: "NZ",
    name: "New Zealand Dollar",
    symbol: "NZ$",
    flag: "🇳🇿",
  },
];

/* ---------- Aliases for richer search ---------- */

const ALIASES: Record<string, string[]> = {
  KES: ["ksh", "kshs", "shilling", "shillings", "kenyan", "kenya shillings"],
  UGX: ["shilling", "shillings", "ugandan"],
  TZS: ["shilling", "shillings", "tanzanian"],
  USD: ["dollar", "dollars", "american", "usa", "us"],
  GBP: ["pound", "pounds", "british", "uk", "sterling"],
  EUR: ["euro", "euros"],
  ZAR: ["rand", "south african"],
  NGN: ["naira"],
  GHS: ["cedi"],
  INR: ["rupee", "rupees"],
  JPY: ["yen"],
  CNY: ["yuan", "renminbi"],
  CAD: ["dollar", "dollars", "canadian"],
  AUD: ["dollar", "dollars", "australian"],
  AED: ["dirham", "dirhams"],
  SAR: ["riyal", "riyals"],
};

/* ---------- Popular currencies (pinned at top of picker) ---------- */

export const POPULAR_CURRENCIES = [
  "KES",
  "USD",
  "GBP",
  "EUR",
  "UGX",
  "TZS",
  "ZAR",
  "NGN",
  "AED",
  "INR",
];

/* ---------- Public API ---------- */

export function getCurrencies(): CurrencyInfo[] {
  return CURRENCIES;
}

export function getCurrency(code: string): CurrencyInfo {
  return (
    CURRENCIES.find((c) => c.code === code) ?? {
      code,
      country: code,
      countryCode: "",
      name: code,
      symbol: CURRENCY_SYMBOLS[code] ?? code,
      flag: "🌐",
    }
  );
}

export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code] ?? code;
}

/* ---------- Search key ---------- */

export function currencySearchKey(c: CurrencyInfo): string {
  const alias = ALIASES[c.code] ?? [];
  return [c.code, c.country, c.name, c.symbol, c.countryCode, ...alias]
    .join(" ")
    .toLowerCase();
}
