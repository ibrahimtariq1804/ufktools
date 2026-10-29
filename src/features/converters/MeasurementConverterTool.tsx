"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Ruler,
  Scale,
  Thermometer,
  Grid,
  Droplets,
  Gauge,
  Clock,
  HardDrive,
  ArrowRightLeft,
  Copy,
  Check,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  Shield,
  Calculator,
} from "lucide-react";
import { ToolItem, CATEGORIES } from "@/config/tools.config";

interface MeasurementConverterToolProps {
  tool: ToolItem;
}

type UnitCategoryKey =
  | "length"
  | "weight"
  | "temperature"
  | "area"
  | "volume"
  | "speed"
  | "time"
  | "digital";

interface UnitDefinition {
  id: string;
  name: string;
  symbol: string;
  // ratio to base unit, or custom conversion function
  toBase?: (val: number) => number;
  fromBase?: (baseVal: number) => number;
  factor?: number; // baseVal = val * factor
}

interface CategoryConfig {
  key: UnitCategoryKey;
  label: string;
  icon: React.ElementType;
  baseUnit: string;
  units: UnitDefinition[];
  popularPairs: { from: string; to: string; label: string }[];
}

const CONVERTER_CATEGORIES: CategoryConfig[] = [
  {
    key: "length",
    label: "Length",
    icon: Ruler,
    baseUnit: "m",
    units: [
      { id: "m", name: "Meter", symbol: "m", factor: 1 },
      { id: "km", name: "Kilometer", symbol: "km", factor: 1000 },
      { id: "cm", name: "Centimeter", symbol: "cm", factor: 0.01 },
      { id: "mm", name: "Millimeter", symbol: "mm", factor: 0.001 },
      { id: "mi", name: "Mile", symbol: "mi", factor: 1609.344 },
      { id: "yd", name: "Yard", symbol: "yd", factor: 0.9144 },
      { id: "ft", name: "Foot", symbol: "ft", factor: 0.3048 },
      { id: "in", name: "Inch", symbol: "in", factor: 0.0254 },
      { id: "nmi", name: "Nautical Mile", symbol: "NM", factor: 1852 },
    ],
    popularPairs: [
      { from: "m", to: "ft", label: "Meters to Feet" },
      { from: "km", to: "mi", label: "Kilometers to Miles" },
      { from: "cm", to: "in", label: "Centimeters to Inches" },
      { from: "yd", to: "m", label: "Yards to Meters" },
    ],
  },
  {
    key: "weight",
    label: "Weight & Mass",
    icon: Scale,
    baseUnit: "kg",
    units: [
      { id: "kg", name: "Kilogram", symbol: "kg", factor: 1 },
      { id: "g", name: "Gram", symbol: "g", factor: 0.001 },
      { id: "mg", name: "Milligram", symbol: "mg", factor: 0.000001 },
      { id: "t", name: "Metric Ton", symbol: "t", factor: 1000 },
      { id: "lb", name: "Pound", symbol: "lb", factor: 0.45359237 },
      { id: "oz", name: "Ounce", symbol: "oz", factor: 0.028349523125 },
      { id: "st", name: "Stone", symbol: "st", factor: 6.35029318 },
    ],
    popularPairs: [
      { from: "kg", to: "lb", label: "Kilograms to Pounds" },
      { from: "g", to: "oz", label: "Grams to Ounces" },
      { from: "lb", to: "kg", label: "Pounds to Kilograms" },
      { from: "t", to: "kg", label: "Metric Tons to Kilograms" },
    ],
  },
  {
    key: "temperature",
    label: "Temperature",
    icon: Thermometer,
    baseUnit: "c",
    units: [
      {
        id: "c",
        name: "Celsius",
        symbol: "°C",
        toBase: (v) => v,
        fromBase: (b) => b,
      },
      {
        id: "f",
        name: "Fahrenheit",
        symbol: "°F",
        toBase: (v) => ((v - 32) * 5) / 9,
        fromBase: (b) => (b * 9) / 5 + 32,
      },
      {
        id: "k",
        name: "Kelvin",
        symbol: "K",
        toBase: (v) => v - 273.15,
        fromBase: (b) => b + 273.15,
      },
    ],
    popularPairs: [
      { from: "c", to: "f", label: "Celsius to Fahrenheit" },
      { from: "f", to: "c", label: "Fahrenheit to Celsius" },
      { from: "c", to: "k", label: "Celsius to Kelvin" },
    ],
  },
  {
    key: "area",
    label: "Area",
    icon: Grid,
    baseUnit: "sqm",
    units: [
      { id: "sqm", name: "Square Meter", symbol: "m²", factor: 1 },
      { id: "sqkm", name: "Square Kilometer", symbol: "km²", factor: 1000000 },
      { id: "sqft", name: "Square Foot", symbol: "ft²", factor: 0.09290304 },
      { id: "sqin", name: "Square Inch", symbol: "in²", factor: 0.00064516 },
      { id: "acre", name: "Acre", symbol: "ac", factor: 4046.8564224 },
      { id: "ha", name: "Hectare", symbol: "ha", factor: 10000 },
    ],
    popularPairs: [
      { from: "sqm", to: "sqft", label: "Square Meters to Square Feet" },
      { from: "acre", to: "ha", label: "Acres to Hectares" },
      { from: "sqkm", to: "sqmi", label: "Square Km to Acres" },
    ],
  },
  {
    key: "volume",
    label: "Volume & Liquid",
    icon: Droplets,
    baseUnit: "l",
    units: [
      { id: "l", name: "Liter", symbol: "L", factor: 1 },
      { id: "ml", name: "Milliliter", symbol: "mL", factor: 0.001 },
      { id: "cum", name: "Cubic Meter", symbol: "m³", factor: 1000 },
      { id: "gal_us", name: "US Gallon", symbol: "gal", factor: 3.785411784 },
      { id: "qt_us", name: "US Quart", symbol: "qt", factor: 0.946352946 },
      { id: "pt_us", name: "US Pint", symbol: "pt", factor: 0.473176473 },
      { id: "cup", name: "US Cup", symbol: "cup", factor: 0.2365882365 },
      { id: "floz_us", name: "US Fluid Ounce", symbol: "fl oz", factor: 0.0295735295625 },
    ],
    popularPairs: [
      { from: "l", to: "gal_us", label: "Liters to US Gallons" },
      { from: "ml", to: "floz_us", label: "Milliliters to Fluid Ounces" },
      { from: "gal_us", to: "l", label: "US Gallons to Liters" },
      { from: "cup", to: "ml", label: "Cups to Milliliters" },
    ],
  },
  {
    key: "speed",
    label: "Speed",
    icon: Gauge,
    baseUnit: "mps",
    units: [
      { id: "mps", name: "Meter per second", symbol: "m/s", factor: 1 },
      { id: "kmh", name: "Kilometer per hour", symbol: "km/h", factor: 1 / 3.6 },
      { id: "mph", name: "Mile per hour", symbol: "mph", factor: 0.44704 },
      { id: "knot", name: "Knot", symbol: "kn", factor: 0.514444 },
    ],
    popularPairs: [
      { from: "kmh", to: "mph", label: "Km/h to Mph" },
      { from: "mph", to: "kmh", label: "Mph to Km/h" },
      { from: "knot", to: "kmh", label: "Knots to Km/h" },
    ],
  },
  {
    key: "time",
    label: "Time",
    icon: Clock,
    baseUnit: "s",
    units: [
      { id: "s", name: "Second", symbol: "s", factor: 1 },
      { id: "ms", name: "Millisecond", symbol: "ms", factor: 0.001 },
      { id: "min", name: "Minute", symbol: "min", factor: 60 },
      { id: "hr", name: "Hour", symbol: "hr", factor: 3600 },
      { id: "day", name: "Day", symbol: "d", factor: 86400 },
      { id: "wk", name: "Week", symbol: "wk", factor: 604800 },
      { id: "yr", name: "Year (Gregorian)", symbol: "yr", factor: 31557600 },
    ],
    popularPairs: [
      { from: "hr", to: "min", label: "Hours to Minutes" },
      { from: "day", to: "hr", label: "Days to Hours" },
      { from: "min", to: "s", label: "Minutes to Seconds" },
    ],
  },
  {
    key: "digital",
    label: "Digital Storage",
    icon: HardDrive,
    baseUnit: "byte",
    units: [
      { id: "byte", name: "Byte", symbol: "B", factor: 1 },
      { id: "bit", name: "Bit", symbol: "b", factor: 0.125 },
      { id: "kb", name: "Kilobyte (KB)", symbol: "KB", factor: 1024 },
      { id: "mb", name: "Megabyte (MB)", symbol: "MB", factor: 1048576 },
      { id: "gb", name: "Gigabyte (GB)", symbol: "GB", factor: 1073741824 },
      { id: "tb", name: "Terabyte (TB)", symbol: "TB", factor: 1099511627776 },
      { id: "pb", name: "Petabyte (PB)", symbol: "PB", factor: 1125899906842624 },
    ],
    popularPairs: [
      { from: "gb", to: "mb", label: "Gigabytes to Megabytes" },
      { from: "tb", to: "gb", label: "Terabytes to Gigabytes" },
      { from: "mb", to: "kb", label: "Megabytes to Kilobytes" },
      { from: "byte", to: "bit", label: "Bytes to Bits" },
    ],
  },
];

export function MeasurementConverterTool({ tool }: MeasurementConverterToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);

  const [activeCategoryKey, setActiveCategoryKey] = useState<UnitCategoryKey>("length");
  const currentCategory = useMemo(
    () => CONVERTER_CATEGORIES.find((c) => c.key === activeCategoryKey)!,
    [activeCategoryKey]
  );

  const [inputValue, setInputValue] = useState<string>("1");
  const [fromUnitId, setFromUnitId] = useState<string>("m");
  const [toUnitId, setToUnitId] = useState<string>("ft");
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Switch category handler resets unit selections gracefully
  const handleCategoryChange = (key: UnitCategoryKey) => {
    setActiveCategoryKey(key);
    const cat = CONVERTER_CATEGORIES.find((c) => c.key === key)!;
    setFromUnitId(cat.units[0].id);
    setToUnitId(cat.units[1]?.id || cat.units[0].id);
  };

  const fromUnit = useMemo(
    () => currentCategory.units.find((u) => u.id === fromUnitId) || currentCategory.units[0],
    [currentCategory, fromUnitId]
  );

  const toUnit = useMemo(
    () => currentCategory.units.find((u) => u.id === toUnitId) || currentCategory.units[1] || currentCategory.units[0],
    [currentCategory, toUnitId]
  );

  // Conversion math
  const convertedValue = useMemo(() => {
    const num = parseFloat(inputValue);
    if (isNaN(num)) return null;

    if (currentCategory.key === "temperature") {
      const baseCelsius = fromUnit.toBase ? fromUnit.toBase(num) : num;
      const result = toUnit.fromBase ? toUnit.fromBase(baseCelsius) : baseCelsius;
      return result;
    }

    // Standard linear conversion: input * fromFactor / toFactor
    const fromFactor = fromUnit.factor ?? 1;
    const toFactor = toUnit.factor ?? 1;
    const baseValue = num * fromFactor;
    return baseValue / toFactor;
  }, [inputValue, fromUnit, toUnit, currentCategory]);

  const formatNumber = (num: number | null): string => {
    if (num === null) return "—";
    if (Math.abs(num) === 0) return "0";
    if (Math.abs(num) < 0.000001 || Math.abs(num) >= 1000000000) {
      return num.toExponential(6);
    }
    // Clean precision formatting
    const fixed = parseFloat(num.toFixed(8));
    return fixed.toLocaleString("en-US", { maximumFractionDigits: 6 });
  };

  const swapUnits = () => {
    const temp = fromUnitId;
    setFromUnitId(toUnitId);
    setToUnitId(temp);
  };

  const handleCopy = () => {
    if (convertedValue !== null) {
      const text = `${inputValue} ${fromUnit.symbol} = ${formatNumber(convertedValue)} ${toUnit.symbol}`;
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // 1-unit baseline formula ratio
  const singleUnitConversion = useMemo(() => {
    if (currentCategory.key === "temperature") {
      return null;
    }
    const fromFactor = fromUnit.factor ?? 1;
    const toFactor = toUnit.factor ?? 1;
    const ratio = fromFactor / toFactor;
    return `1 ${fromUnit.symbol} = ${formatNumber(ratio)} ${toUnit.symbol}`;
  }, [fromUnit, toUnit, currentCategory]);

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
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 via-indigo-700 to-cyan-600 text-white shadow-lg shadow-blue-700/10">
                <Calculator className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {category?.name}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    Real-Time Zero Latency
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                    8 Scientific Domains
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {tool.name}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  Accurate, bidirectional conversion across metric and imperial systems for length, mass, temperature, area, volume, speed, time, and digital storage.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
          {CONVERTER_CATEGORIES.map((cat) => {
            const IconComponent = cat.icon;
            const isActive = cat.key === activeCategoryKey;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => handleCategoryChange(cat.key)}
                className={`flex items-center gap-2 shrink-0 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all border ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                <IconComponent className="h-4 w-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Main Interactive Converter Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-10">
          <div className="grid grid-cols-1 lg:grid-cols-11 gap-4 items-center">
            {/* FROM Input Column */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-50 border border-slate-200/90 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>From</span>
                <span className="text-blue-600 font-semibold">{fromUnit.name}</span>
              </div>

              <input
                type="number"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="0"
                className="w-full text-3xl sm:text-4xl font-extrabold text-slate-900 bg-transparent outline-none border-b border-slate-200 pb-2 focus:border-blue-600 transition-colors"
              />

              <div className="pt-1">
                <select
                  value={fromUnitId}
                  onChange={(e) => setFromUnitId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  {currentCategory.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-1.5 pt-1 text-xs">
                <span className="text-slate-400 font-medium">Quick:</span>
                {[1, 5, 10, 50, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setInputValue(String(val))}
                    className="rounded-lg bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 border border-slate-200 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            {/* Swap Button (Middle) */}
            <div className="lg:col-span-1 flex justify-center">
              <button
                type="button"
                onClick={swapUnits}
                title="Swap Units"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 shadow-sm hover:bg-blue-600 hover:text-white hover:scale-105 active:scale-95 transition-all"
              >
                <ArrowRightLeft className="h-5 w-5" />
              </button>
            </div>

            {/* TO Output Column */}
            <div className="lg:col-span-5 rounded-2xl bg-blue-50/50 border border-blue-200/80 p-5 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>To (Result)</span>
                <span className="text-blue-600 font-semibold">{toUnit.name}</span>
              </div>

              <div className="flex items-center justify-between border-b border-blue-200/70 pb-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-900 truncate">
                  {formatNumber(convertedValue)}
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 rounded-xl bg-white text-slate-600 border border-blue-200 hover:text-blue-600 transition-colors shrink-0 shadow-sm"
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
                  value={toUnitId}
                  onChange={(e) => setToUnitId(e.target.value)}
                  className="w-full rounded-xl border border-blue-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-blue-600 focus:outline-none cursor-pointer"
                >
                  {currentCategory.units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.symbol})
                    </option>
                  ))}
                </select>
              </div>

              {/* Conversion formula badge */}
              <div className="pt-1 text-xs text-slate-500 font-medium">
                {singleUnitConversion ? (
                  <span>Formula: <strong>{singleUnitConversion}</strong></span>
                ) : (
                  <span>Dynamic thermodynamic formula</span>
                )}
              </div>
            </div>
          </div>

          {/* Popular Pairs Shortcuts for this category */}
          {currentCategory.popularPairs.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Common {currentCategory.label} Conversions
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {currentCategory.popularPairs.map((pair, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setFromUnitId(pair.from);
                      setToUnitId(pair.to);
                    }}
                    className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all"
                  >
                    {pair.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cheat Sheet Table for Active Domain */}
        <div className="rounded-3xl bg-white p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-12">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>{currentCategory.label} Units Reference Matrix</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4 rounded-l-xl">Unit Name</th>
                  <th className="py-3 px-4">Symbol</th>
                  <th className="py-3 px-4">Standard Base Equivalent</th>
                  <th className="py-3 px-4 rounded-r-xl">Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentCategory.units.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-800">{u.name}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-600">{u.symbol}</td>
                    <td className="py-3 px-4 text-slate-600">
                      {u.factor ? `${u.factor} ${currentCategory.baseUnit}` : "Direct Formula"}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {["ft", "in", "mi", "yd", "lb", "oz", "gal_us", "cup", "f"].includes(u.id)
                        ? "Imperial / US Customary"
                        : ["byte", "bit", "kb", "mb", "gb", "tb", "pb"].includes(u.id)
                        ? "Binary / IEC Standard"
                        : "SI / International Metric"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center sm:text-left">
            How to Use {tool.name}
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
              <h4 className="text-sm font-bold">100% Client-Side Calculations</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                All conversions run natively in your browser using IEEE 754 precision math. Zero requests are sent across the network.
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
