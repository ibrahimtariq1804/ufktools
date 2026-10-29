"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wrench,
  ShieldCheck,
  Zap,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { YoutubeIcon } from "@/components/ui/BrandIcons";
import { CATEGORIES } from "@/config/tools.config";

export function Footer() {
  const pathname = usePathname();
  const currentYear = 2026;

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <footer className="w-full border-t border-slate-200 bg-slate-900 text-slate-400">
      {/* Top Trust Pillars Banner */}
      <div className="border-b border-slate-800 bg-slate-950/60 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">100% Free Forever</h4>
                <p className="text-xs text-slate-400">No subscriptions, no trials, no paywalls.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600/10 text-emerald-400 border border-emerald-500/20">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Privacy Guaranteed</h4>
                <p className="text-xs text-slate-400">Client-side processing & auto file purge.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-600/10 text-purple-400 border border-purple-500/20">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Lightning Fast</h4>
                <p className="text-xs text-slate-400">In-browser conversions with zero queue.</p>
              </div>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-600/10 text-rose-400 border border-rose-500/20">
                <YoutubeIcon className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Powered by UFK</h4>
                <p className="text-xs text-slate-400">Supporting the UFK YouTube community.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Multi-Column Footer */}
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Column 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
                <Wrench className="h-5 w-5" />
              </div>
              <span className="text-xl font-black tracking-tight text-white">
                UFK <span className="text-blue-500">TOOLS</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400 max-w-sm">
              All the online tools you need in one place. Convert, compress, edit, create and manage your documents with free, privacy-first utilities designed for everyone.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-red-600/20 hover:text-red-400 border border-slate-700 hover:border-red-500/40 px-3.5 py-2 text-xs font-semibold text-slate-300 transition-all duration-200"
              >
                <YoutubeIcon className="h-4 w-4 text-red-500" />
                <span>UFK Channel on YouTube</span>
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* Column 2: Popular Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Popular Utilities
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/tools/merge-pdf" className="hover:text-white transition-colors">
                  Merge PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/compress-pdf" className="hover:text-white transition-colors">
                  Compress PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/pdf-to-word" className="hover:text-white transition-colors">
                  PDF to Word
                </Link>
              </li>
              <li>
                <Link href="/tools/cv-builder" className="hover:text-white transition-colors">
                  Make Your Resume / CV
                </Link>
              </li>
              <li>
                <Link href="/tools/jpg-to-pdf" className="hover:text-white transition-colors">
                  JPG to PDF
                </Link>
              </li>
              <li>
                <Link href="/tools/currency-converter" className="hover:text-white transition-colors">
                  Currency Converter
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Tool Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Categories
            </h4>
            <ul className="space-y-2.5 text-sm">
              {CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={cat.id === "picture-of-day" ? "/picture-of-the-day" : `/#category-${cat.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/picture-of-the-day" className="hover:text-rose-400 transition-colors">
                  Daily Fact Archive
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Platform & Legal */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Company & Legal
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About UFK Tools
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Copyright bar */}
      <div className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {currentYear} UFK Tools. All rights reserved. Free Online Tools for Everyone.</p>
          <p className="flex items-center gap-1.5">
            Designed for high productivity and zero cost.
          </p>
        </div>
      </div>
    </footer>
  );
}
