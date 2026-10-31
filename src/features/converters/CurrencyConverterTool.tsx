"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Coins,
  ArrowRightLeft,
  Copy,
  Check,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Shield,
  RefreshCw,
  Globe2,
} from "lucide-react";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { trackToolAction } from "@/lib/analytics";

interface CurrencyConverterToolProps {
  tool: ToolItem;
}

interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag: string;
}

const CURRENCIES: CurrencyInfo[] = [
  { code: "USD", name: "United States Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound Sterling", symbol: "£", flag: "🇬🇧" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", flag: "🇨🇦" },
  { code: "AUD", name: "Australian Dollar", symbol: "AU$", flag: "🇦🇺" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "CNY", name: "Chinese Yuan Renminbi", symbol: "¥", flag: "🇨🇳" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "AED", name: "United Arab Emirates Dirham", symbol: "د.إ", flag: "🇦🇪" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦" },
  { code: "PKR", name: "Pakistani Rupee", symbol: "₨", flag: "🇵🇰" },
  { code: "BDT", name: "Bangladeshi Taka", symbol: "৳", flag: "🇧🇩" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
  { code: "MXN", name: "Mexican Peso", symbol: "Mex$", flag: "🇲🇽" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$", flag: "🇹🇼" },
  { code: "ILS", name: "Israeli New Shekel", symbol: "₪", flag: "🇮🇱" },
  { code: "EGP", name: "Egyptian Pound", symbol: "E£", flag: "🇪🇬" },
];

const MULTI_PREVIEW_CODES = ["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "INR", "AED", "SGD", "PKR", "CNY"];

export function CurrencyConverterTool({ tool }: CurrencyConverterToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);

  const [rates, setRates] = useState<Record<string, number>>({
    USD: 1.0,
    EUR: 0.923,
    GBP: 0.791,
    JPY: 154.2,
    CAD: 1.385,
    AUD: 1.524,
    CHF: 0.884,
    CNY: 7.235,
    INR: 83.45,
    AED: 3.6725,
    SAR: 3.751,
    PKR: 278.5,
    BDT: 117.2,
    SGD: 1.352,
  });

  const [ratesDate, setRatesDate] = useState<string>("Latest");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [inputValue, setInputValue] = useState<string>("100");
  const [fromCode, setFromCode] = useState<string>("USD");
  const [toCode, setToCode] = useState<string>("EUR");
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const fetchRates = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/rates");
      if (res.ok) {
        const data = await res.json();
        if (data.rates) {
          setRates(data.rates);
          if (data.date) setRatesDate(data.date);
        }
      }
    } catch (err) {
      console.warn("Rates fetch error:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadInitialRates() {
      try {
        const res = await fetch("/api/rates");
        if (res.ok && !ignore) {
          const data = await res.json();
          if (data.rates) {
            setRates(data.rates);
            if (data.date) setRatesDate(data.date);
          }
        }
      } catch (err) {
        console.warn("Rates fetch error:", err);
      }
    }
    loadInitialRates();
    return () => {
      ignore = true;
    };
  }, []);

  const fromCurrency = useMemo(
    () => CURRENCIES.find((c) => c.code === fromCode) || CURRENCIES[0],
    [fromCode]
  );

  const toCurrency = useMemo(
    () => CURRENCIES.find((c) => c.code === toCode) || CURRENCIES[1],
    [toCode]
  );

  // Cross rate math relative to base USD
  const fromRate = rates[fromCode] ?? 1.0;
  const toRate = rates[toCode] ?? 1.0;

  const convertedValue = useMemo(() => {
    const num = parseFloat(inputValue);
    if (isNaN(num) || fromRate === 0) return null;
    // (amount in fromCurrency / fromRate) * toRate
    const inUSD = num / fromRate;
    return inUSD * toRate;
  }, [inputValue, fromRate, toRate]);

  const unitRate = useMemo(() => {
    if (fromRate === 0) return 1.0;
    return (1 / fromRate) * toRate;
  }, [fromRate, toRate]);

  const inverseUnitRate = useMemo(() => {
    if (toRate === 0) return 1.0;
    return (1 / toRate) * fromRate;
  }, [fromRate, toRate]);

  const swapCurrencies = () => {
    const temp = fromCode;
    setFromCode(toCode);
    setToCode(temp);
    trackToolAction("currency-converter", "swap_currencies");
  };

  const handleCopy = () => {
    if (convertedValue !== null) {
      const text = `${inputValue} ${fromCode} = ${convertedValue.toFixed(2)} ${toCode}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      trackToolAction("currency-converter", "copy_conversion_rate");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatCurrency = (val: number | null): string => {
    if (val === null) return "0.00";
    return val.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/#category-${category?.slug || ""}`}
            className="hover:text-blue-600 transition-colors"
          >
            {category?.name || "Converters"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Tool Header Card */}
        <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-sm border border-slate-200/80 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-700 text-white shadow-lg shadow-emerald-700/10">
                <Coins className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                    {category?.name}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    Live Central Bank Rates
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                    32+ Global Currencies
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {tool.name}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  Real-time foreign exchange calculator with zero server cost, automatic 12-hour caching, and instant cross-currency rates.
                </p>
              </div>
            </div>

            {/* Live Update Badge */}
            <div className="shrink-0 flex items-center gap-2 rounded-2xl bg-slate-50 border border-slate-200 p-2.5 px-3.5">
              <div className="flex flex-col text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Rate Market Date
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {ratesDate}
                </span>
              </div>
              <button
                type="button"
                onClick={fetchRates}
                disabled={isRefreshing}
                title="Refresh Rates"
                className="p-1.5 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-white transition-all disabled:opacity-40"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin text-blue-600" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Interactive Converter Box */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
            {/* FROM Column */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-50 border border-slate-200/90 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>You Send / Convert</span>
                <span className="text-blue-600 font-semibold">{fromCurrency.name}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-bold text-slate-400">
                  {fromCurrency.symbol}
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-3xl sm:text-4xl font-extrabold text-slate-900 bg-transparent outline-none border-b border-slate-200 pb-2 focus:border-blue-600 transition-colors"
                />
              </div>

              <div className="pt-1">
                <select
                  value={fromCode}
                  onChange={(e) => setFromCode(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Amount Presets */}
              <div className="flex items-center gap-1.5 pt-1 text-xs">
                <span className="text-slate-400 font-medium">Quick:</span>
                {[10, 50, 100, 500, 1000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setInputValue(String(val))}
                    className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    {fromCurrency.symbol}{val}
                  </button>
                ))}
              </div>
            </div>

            {/* Swap Button (Middle) */}
            <div className="lg:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={swapCurrencies}
                title="Swap Currencies"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm hover:bg-emerald-600 hover:text-white hover:scale-105 active:scale-95 transition-all"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </button>
            </div>

            {/* TO Column */}
            <div className="lg:col-span-5 rounded-2xl bg-emerald-50/40 border border-emerald-200/80 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>You Receive</span>
                <span className="text-emerald-700 font-semibold">{toCurrency.name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-2xl sm:text-3xl font-bold text-emerald-700">
                    {toCurrency.symbol}
                  </span>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-950 truncate">
                    {formatCurrency(convertedValue)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 rounded-xl bg-white text-slate-600 border border-emerald-200 hover:text-emerald-700 transition-colors shrink-0 shadow-sm"
                  title="Copy Result"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="pt-1">
                <select
                  value={toCode}
                  onChange={(e) => setToCode(e.target.value)}
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-emerald-600 focus:outline-none cursor-pointer"
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Conversion Rate Formula Line */}
              <div className="pt-1 text-xs text-slate-600 font-medium flex flex-wrap items-center justify-between gap-2">
                <span>
                  1 {fromCode} = <strong>{unitRate.toFixed(4)} {toCode}</strong>
                </span>
                <span className="text-slate-400">
                  1 {toCode} = {inverseUnitRate.toFixed(4)} {fromCode}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Currency Comparison Grid */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-12">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Globe2 className="h-5 w-5 text-emerald-600" />
                <span>Multi-Currency Quick Matrix</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated value of {inputValue || "100"} {fromCode} across major global economic currencies
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {MULTI_PREVIEW_CODES.map((targetCode) => {
              const targetCurr = CURRENCIES.find((c) => c.code === targetCode);
              if (!targetCurr) return null;
              const tRate = rates[targetCode] ?? 1.0;
              const num = parseFloat(inputValue);
              const val = isNaN(num) || fromRate === 0 ? 0 : (num / fromRate) * tRate;

              return (
                <div
                  key={targetCode}
                  onClick={() => setToCode(targetCode)}
                  className={`cursor-pointer rounded-2xl border p-3.5 transition-all text-left ${
                    toCode === targetCode
                      ? "border-emerald-600 bg-emerald-50/50 shadow-sm"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-base">{targetCurr.flag}</span>
                    <span className="font-extrabold text-slate-700">{targetCode}</span>
                  </div>
                  <div className="text-sm font-extrabold text-slate-900 truncate">
                    {targetCurr.symbol}{formatCurrency(val)}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                    1 {fromCode} = {((1 / fromRate) * tRate).toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center sm:text-left">
            How to Convert Currencies in 3 Simple Steps
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {tool.howToSteps.map((step) => (
              <div
                key={step.step}
                className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-sm relative overflow-hidden"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-sm mb-4">
                  {step.step}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">
                  {step.title}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Features Grid */}
        <div className="mb-14 rounded-3xl bg-white p-8 sm:p-10 border border-slate-200/80 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            Key Features of {tool.name}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tool.features.map((feature, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500 mt-0.5" />
                <span className="text-sm text-slate-700 font-medium">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Accordion */}
        {tool.faqs.length > 0 && (
          <div className="mb-14">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-blue-600" />
              <span>Frequently Asked Questions</span>
            </h2>
            <div className="space-y-3">
              {tool.faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl bg-white border border-slate-200/80 overflow-hidden shadow-sm"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-sm text-slate-600 border-t border-slate-100 bg-slate-50/50 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Privacy Notice Banner */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Shield className="h-8 w-8 text-blue-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold">100% Free & Transparent Financial Utility</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Exchange calculations are performed on the fly with no commission, hidden margins, or account tracking.
              </p>
            </div>
          </div>
          <Link
            href="/privacy"
            className="shrink-0 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Read Privacy Guarantee →
          </Link>
        </div>
      </div>
    </div>
  );
}
