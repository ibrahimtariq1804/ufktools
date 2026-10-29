"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, ShieldCheck, Zap, UserX, FileText } from "lucide-react";
import { TOOLS } from "@/config/tools.config";

export function Hero() {
  const [searchTerm, setSearchTerm] = useState("");

  const suggestedTools = TOOLS.slice(0, 5);

  const matchedTools = searchTerm.trim()
    ? TOOLS.filter(
        (t) =>
          t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.shortDescription.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <section className="relative overflow-hidden bg-slate-950 pt-16 pb-20 sm:pt-24 sm:pb-28 text-white">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[128px]" />
        <div className="absolute top-20 right-1/4 w-[450px] h-[450px] bg-purple-600/20 rounded-full blur-[128px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Brand pill badge */}
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-900/80 border border-slate-700/80 px-4 py-1.5 text-xs font-medium text-slate-300 shadow-inner mb-8">
          <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span>Free PDF, AI, Converter & Productivity Tools</span>
        </div>

        {/* Master Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
          All the Online Tools You Need in{" "}
          <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
            One Place.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
          Convert, compress, edit, create and manage your files with free online tools designed for everyone. No registration, no watermarks, and zero fees.
        </p>

        {/* Interactive Search Bar in Hero */}
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="relative flex items-center rounded-2xl bg-white/10 p-1.5 backdrop-blur-md border border-white/20 shadow-2xl focus-within:border-blue-400 focus-within:bg-white/15 transition-all">
            <Search className="ml-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search any tool (e.g., Merge PDF, Resume, Currency, Compress)..."
              className="w-full bg-transparent px-3 py-3 text-sm sm:text-base text-white placeholder-slate-400 focus:outline-none"
            />
            <Link
              href="#all-tools"
              className="shrink-0 rounded-xl bg-blue-600 hover:bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all duration-200"
            >
              Browse Tools
            </Link>
          </div>

          {/* Quick matched dropdown if typing */}
          {searchTerm.trim().length > 0 && (
            <div className="absolute z-30 mt-2 w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl text-left overflow-hidden">
              {matchedTools.length > 0 ? (
                <div className="p-2 space-y-1">
                  {matchedTools.slice(0, 5).map((tool) => (
                    <Link
                      key={tool.id}
                      href={`/tools/${tool.slug}`}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 transition-colors group"
                    >
                      <div>
                        <div className="text-sm font-semibold text-white group-hover:text-blue-400">
                          {tool.name}
                        </div>
                        <div className="text-xs text-slate-400">{tool.shortDescription}</div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-slate-500 group-hover:text-blue-400" />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-sm text-slate-400">
                  No tools found for &ldquo;{searchTerm}&rdquo;
                </div>
              )}
            </div>
          )}

          {/* Quick tags */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
            <span className="font-medium text-slate-500">Popular:</span>
            {suggestedTools.map((t) => (
              <Link
                key={t.id}
                href={`/tools/${t.slug}`}
                className="rounded-lg bg-slate-900/60 hover:bg-slate-800 px-2.5 py-1 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-colors"
              >
                {t.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-14 pt-8 border-t border-slate-800/80 max-w-4xl mx-auto grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
          <div className="flex items-center justify-center gap-2 text-slate-300 text-xs sm:text-sm font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>100% Free Forever</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-300 text-xs sm:text-sm font-medium">
            <UserX className="h-4 w-4 text-blue-400 shrink-0" />
            <span>No Account Needed</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-300 text-xs sm:text-sm font-medium">
            <Zap className="h-4 w-4 text-amber-400 shrink-0" />
            <span>Client-Side Speed</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-slate-300 text-xs sm:text-sm font-medium">
            <FileText className="h-4 w-4 text-purple-400 shrink-0" />
            <span>Zero Watermarks</span>
          </div>
        </div>
      </div>
    </section>
  );
}
