"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Eye,
  Wrench,
  Globe,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  ArrowUpRight,
  Clock,
  Sparkles,
  MapPin,
  TrendingUp,
  Activity,
  Layers,
  Compass,
} from "lucide-react";

interface AnalyticsData {
  totalEvents: number;
  totalPageviews: number;
  totalToolActions: number;
  uniqueVisitors: number;
  topCountry: string;
  topCountryCount: number;
  topCountries: Array<{ countryCode: string; count: number; percentage: number }>;
  topTools: Array<{ toolSlug: string; count: number; percentage: number }>;
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  topReferrers: Array<{ referrer: string; count: number }>;
  recentEvents: Array<{
    id: string;
    eventType: "pageview" | "tool_action";
    path: string;
    toolSlug?: string;
    action?: string;
    countryCode?: string;
    city?: string;
    region?: string;
    deviceType?: "desktop" | "mobile" | "tablet";
    browser?: string;
    os?: string;
    referrer?: string;
    createdAt: string;
  }>;
}

// Convert 2-letter ISO country code into country flag emoji
function getCountryFlag(countryCode?: string): string {
  if (!countryCode || countryCode === "UNKNOWN") return "🌐";
  const code = countryCode.toUpperCase();
  if (code.length !== 2) return "🌐";
  try {
    const offset = 127397;
    return String.fromCodePoint(code.charCodeAt(0) + offset, code.charCodeAt(1) + offset);
  } catch {
    return "🌐";
  }
}

// Friendly country names lookup
const COUNTRY_NAMES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  PK: "Pakistan",
  IN: "India",
  CA: "Canada",
  AU: "Australia",
  DE: "Germany",
  FR: "France",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  TR: "Turkey",
  BR: "Brazil",
  IT: "Italy",
  ES: "Spain",
  NL: "Netherlands",
  JP: "Japan",
  SG: "Singapore",
  UNKNOWN: "Global / Unknown",
};

function formatToolName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AnalyticsDashboardPage() {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("7d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");

  const handleRefresh = () => {
    setIsLoading(true);
    fetch(`/api/admin/analytics?range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or failed request");
        return res.json();
      })
      .then((json) => {
        if (json.data) {
          setData(json.data);
          setLastRefreshed(new Date().toLocaleTimeString());
        }
      })
      .catch((err) => {
        console.error("Failed to load analytics:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    let ignore = false;

    fetch(`/api/admin/analytics?range=${range}`)
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized or failed request");
        return res.json();
      })
      .then((json) => {
        if (!ignore && json.data) {
          setData(json.data);
          setLastRefreshed(new Date().toLocaleTimeString());
        }
      })
      .catch((err) => {
        if (!ignore) console.error("Failed to load analytics:", err);
      })
      .finally(() => {
        if (!ignore) setIsLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [range]);

  const totalDevices =
    (data?.deviceBreakdown.desktop || 0) +
    (data?.deviceBreakdown.mobile || 0) +
    (data?.deviceBreakdown.tablet || 0) || 1;

  const desktopPct = Math.round(((data?.deviceBreakdown.desktop || 0) / totalDevices) * 100);
  const mobilePct = Math.round(((data?.deviceBreakdown.mobile || 0) / totalDevices) * 100);
  const tabletPct = Math.round(((data?.deviceBreakdown.tablet || 0) / totalDevices) * 100);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30">
              <Activity className="h-4 w-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Traffic & Visitor Analytics
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Real-time geolocation tracking, tool actions, and visitor activity stream.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Range Pills */}
          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            {(
              [
                { id: "today", label: "Today" },
                { id: "7d", label: "7 Days" },
                { id: "30d", label: "30 Days" },
                { id: "all", label: "All Time" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setRange(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  range === item.id
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
            title="Refresh analytics data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Top 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Pageviews */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900/90 border border-slate-800 p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-blue-600/10 rounded-full blur-2xl group-hover:bg-blue-600/20 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Pageviews
            </span>
            <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/20">
              <Eye className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {isLoading ? "..." : (data?.totalPageviews || 0).toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-400" />
            <span>Across all public routes & tools</span>
          </p>
        </div>

        {/* Unique Visitors */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900/90 border border-slate-800 p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-emerald-600/10 rounded-full blur-2xl group-hover:bg-emerald-600/20 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Unique Visitors
            </span>
            <span className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/20">
              <Users className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {isLoading ? "..." : (data?.uniqueVisitors || 0).toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>Anonymous daily unique sessions</span>
          </p>
        </div>

        {/* Tools Executed */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900/90 border border-slate-800 p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-purple-600/10 rounded-full blur-2xl group-hover:bg-purple-600/20 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Tool Operations
            </span>
            <span className="p-2 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/20">
              <Wrench className="h-4 w-4" />
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-tight">
            {isLoading ? "..." : (data?.totalToolActions || 0).toLocaleString()}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <Layers className="h-3 w-3 text-purple-400" />
            <span>Conversions & file processes</span>
          </p>
        </div>

        {/* Top Country */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-900/90 border border-slate-800 p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-rose-600/10 rounded-full blur-2xl group-hover:bg-rose-600/20 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Top Geographic Area
            </span>
            <span className="p-2 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/20">
              <Globe className="h-4 w-4" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">
              {getCountryFlag(data?.topCountry)}
            </span>
            <span className="text-2xl font-extrabold text-white tracking-tight truncate">
              {isLoading
                ? "..."
                : COUNTRY_NAMES[data?.topCountry || ""] || data?.topCountry || "None"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-rose-400" />
            <span>
              {data?.topCountryCount ? `${data.topCountryCount} visitor hits` : "Awaiting traffic"}
            </span>
          </p>
        </div>
      </div>

      {/* Middle Row: Geographic Breakdown & Tool Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Country Breakdown (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="h-4 w-4 text-blue-400" />
                <span>Geographic Distribution (By Area)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Visitor origin resolved via Vercel Edge network headers
              </p>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Top {data?.topCountries.length || 0} Areas
            </span>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Loading geographic records...
            </div>
          ) : !data?.topCountries || data.topCountries.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-1">
              <Globe className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p>No geographic hits recorded in this timeframe.</p>
              <p className="text-[11px] text-slate-600">
                Visitor areas will appear here automatically as people visit your site.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.topCountries.map((c) => {
                const countryName = COUNTRY_NAMES[c.countryCode] || c.countryCode;
                const flag = getCountryFlag(c.countryCode);
                return (
                  <div key={c.countryCode} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{flag}</span>
                        <span className="font-semibold text-slate-200">{countryName}</span>
                        <span className="text-[10px] text-slate-500 font-mono">({c.countryCode})</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-slate-400">
                        <span className="text-white font-bold">{c.count}</span>
                        <span className="text-slate-500">({c.percentage}%)</span>
                      </div>
                    </div>
                    {/* Progress Bar */}
                    <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(c.percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Most Popular Tools (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Wrench className="h-4 w-4 text-purple-400" />
                <span>Tool Activity Rankings</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Which utilities visitors are using the most
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Calculating tool usage...
            </div>
          ) : !data?.topTools || data.topTools.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-1">
              <Layers className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p>No tool operations recorded yet in this timeframe.</p>
              <p className="text-[11px] text-slate-600">
                Actions like Merge PDF, CV Builder, or Converters will rank here.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.topTools.map((t, idx) => (
                <div key={t.toolSlug} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[10px] font-bold text-slate-400">
                        #{idx + 1}
                      </span>
                      <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                        {formatToolName(t.toolSlug)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono text-xs">
                      <span className="text-purple-400 font-bold">{t.count}</span>
                      <span className="text-slate-500 text-[10px]">ops</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(t.percentage, 5)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Devices, Referrers, and Live Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Device & Referrer Breakdown (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Device Types */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Compass className="h-4 w-4 text-emerald-400" />
              <span>Visitor Devices</span>
            </h2>

            <div className="space-y-3">
              {/* Desktop */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2 text-slate-300">
                  <Monitor className="h-4 w-4 text-blue-400" />
                  <span>Desktop</span>
                </div>
                <div className="font-mono text-white font-bold">
                  {desktopPct}% <span className="text-slate-500 font-normal">({data?.deviceBreakdown.desktop || 0})</span>
                </div>
              </div>

              {/* Mobile */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2 text-slate-300">
                  <Smartphone className="h-4 w-4 text-emerald-400" />
                  <span>Mobile</span>
                </div>
                <div className="font-mono text-white font-bold">
                  {mobilePct}% <span className="text-slate-500 font-normal">({data?.deviceBreakdown.mobile || 0})</span>
                </div>
              </div>

              {/* Tablet */}
              <div className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                <div className="flex items-center gap-2 text-slate-300">
                  <Tablet className="h-4 w-4 text-purple-400" />
                  <span>Tablet</span>
                </div>
                <div className="font-mono text-white font-bold">
                  {tabletPct}% <span className="text-slate-500 font-normal">({data?.deviceBreakdown.tablet || 0})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Referrers */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
            <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-amber-400" />
              <span>Top Traffic Sources</span>
            </h2>

            {!data?.topReferrers || data.topReferrers.length === 0 ? (
              <p className="text-xs text-slate-500 py-3 text-center">No referrers recorded.</p>
            ) : (
              <div className="space-y-2">
                {data.topReferrers.map((r) => (
                  <div
                    key={r.referrer}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/40 border border-slate-800/40"
                  >
                    <span className="text-slate-300 font-medium truncate max-w-[160px]">
                      {r.referrer === "direct" ? "Direct Navigation" : r.referrer}
                    </span>
                    <span className="font-mono text-amber-400 font-bold">{r.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Live Event Stream (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span>Live Activity Log</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Recent visitor clicks, page transitions, and tool actions
              </p>
            </div>
            {lastRefreshed && (
              <span className="text-[11px] text-slate-500 font-mono">
                Updated {lastRefreshed}
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-500 text-xs">
              Fetching activity stream...
            </div>
          ) : !data?.recentEvents || data.recentEvents.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-xs space-y-1">
              <Activity className="h-8 w-8 mx-auto text-slate-600 mb-2" />
              <p>No recent activity detected.</p>
              <p className="text-[11px] text-slate-600">
                Visitor actions across the site will be streamed here in real time.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800/80 max-h-[460px] overflow-y-auto pr-1">
              {data.recentEvents.map((event) => {
                const flag = getCountryFlag(event.countryCode);
                const isTool = event.eventType === "tool_action";

                return (
                  <div
                    key={event.id}
                    className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-800/30 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{flag}</span>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isTool
                                ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                            }`}
                          >
                            {isTool ? "TOOL ACTION" : "PAGEVIEW"}
                          </span>

                          <span className="font-semibold text-slate-200">
                            {event.toolSlug
                              ? formatToolName(event.toolSlug)
                              : event.path}
                          </span>

                          {event.action && (
                            <span className="text-slate-400 font-mono text-[10px]">
                              [{event.action}]
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-400">
                          {event.city && event.city !== "Unknown" ? `${event.city}, ` : ""}
                          {COUNTRY_NAMES[event.countryCode || ""] || event.countryCode || "Global"}
                          {event.browser ? ` • ${event.browser}` : ""}
                          {event.os ? ` • ${event.os}` : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 shrink-0 self-start sm:self-auto pl-8 sm:pl-0">
                      <span className="font-mono text-[11px]">
                        {timeAgo(event.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
