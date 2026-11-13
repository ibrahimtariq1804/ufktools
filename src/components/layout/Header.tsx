"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Menu,
  X,
  Sparkles,
  ChevronDown,
  Wrench,
  ArrowRight,
  FileText,
} from "lucide-react";
import { CATEGORIES } from "@/config/tools.config";
import { DynamicIcon } from "@/components/ui/DynamicIcon";
import { YoutubeIcon } from "@/components/ui/BrandIcons";
import { SearchModal } from "./SearchModal";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand / Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-950 via-blue-900 to-blue-600 text-white shadow-md shadow-blue-900/20 group-hover:shadow-blue-600/30 transition-all duration-300">
              <Wrench className="h-4.5 w-4.5 transition-transform group-hover:rotate-12 duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors leading-none">
                UFK <span className="text-blue-600 font-extrabold">TOOLS</span>
              </span>
              <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase mt-0.5 leading-none">
                Free Utility Suite
              </span>
            </div>
          </Link>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-sm font-medium text-slate-600">
            <Link
              href="/"
              className={`inline-flex items-center px-3 h-9 rounded-xl text-xs xl:text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-blue-600 font-bold bg-blue-50/80"
                  : "hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              Home
            </Link>

            {/* Categories Dropdown with Anti-Flicker Bridge */}
            <div
              className="relative"
              onMouseEnter={() => setIsCategoryDropdownOpen(true)}
              onMouseLeave={() => setIsCategoryDropdownOpen(false)}
            >
              <button
                className={`inline-flex items-center gap-1 px-3 h-9 rounded-xl text-xs xl:text-sm font-medium transition-colors ${
                  isCategoryDropdownOpen
                    ? "text-blue-600 bg-blue-50/60 font-semibold"
                    : "hover:text-slate-900 hover:bg-slate-100/80"
                }`}
                onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
              >
                <span>Categories</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
                    isCategoryDropdownOpen ? "rotate-180 text-blue-600" : ""
                  }`}
                />
              </button>

              {isCategoryDropdownOpen && (
                <div className="absolute top-full left-0 pt-1.5 z-50">
                  <div className="w-72 rounded-2xl bg-white p-3 shadow-xl border border-slate-200/90 animate-in fade-in slide-in-from-top-1 duration-150">
                    <div className="space-y-1">
                      {CATEGORIES.map((cat) => (
                        <Link
                          key={cat.id}
                          href={cat.id === "picture-of-day" ? "/picture-of-the-day" : `/#category-${cat.slug}`}
                          onClick={() => setIsCategoryDropdownOpen(false)}
                          className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <DynamicIcon name={cat.iconName} className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-600">
                              {cat.name}
                            </div>
                            <div className="text-[11px] text-slate-400 line-clamp-1">
                              {cat.description}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/#all-tools"
              className="inline-flex items-center px-3 h-9 rounded-xl text-xs xl:text-sm font-medium transition-colors hover:text-slate-900 hover:bg-slate-100/80"
            >
              All Tools
            </Link>

            <Link
              href="/picture-of-the-day"
              className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs xl:text-sm font-medium transition-colors ${
                pathname === "/picture-of-the-day"
                  ? "text-rose-600 font-bold bg-rose-50/80"
                  : "text-slate-600 hover:text-rose-600 hover:bg-rose-50/60"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-rose-500 fill-rose-500" />
              <span>Fact of the Day</span>
            </Link>

            <Link
              href="/about"
              className={`inline-flex items-center px-3 h-9 rounded-xl text-xs xl:text-sm font-medium transition-colors ${
                pathname === "/about"
                  ? "text-blue-600 font-bold bg-blue-50/80"
                  : "hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              About
            </Link>

            <Link
              href="/contact"
              className={`inline-flex items-center px-3 h-9 rounded-xl text-xs xl:text-sm font-medium transition-colors ${
                pathname === "/contact"
                  ? "text-blue-600 font-bold bg-blue-50/80"
                  : "hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Right: Action Bar (Build CV Button, Search & YouTube) */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Build Your Professional CV Button */}
            <Link
              href="/tools/cv-builder"
              className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
                pathname === "/tools/cv-builder"
                  ? "bg-red-700 text-white ring-2 ring-red-400/50 shadow-md shadow-red-700/30"
                  : "bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/20 hover:shadow-red-600/30 active:scale-[0.98]"
              }`}
            >
              <FileText className="h-3.5 w-3.5 text-white/90" />
              <span className="hidden xl:inline">Build Professional </span>
              <span>CV</span>
            </Link>

            {/* Search Trigger Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 px-3 h-9 text-xs font-medium transition-colors border border-slate-200/60"
              aria-label="Search tools"
            >
              <Search className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden md:inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-200">
                Ctrl K
              </kbd>
            </button>

            {/* YouTube Channel Link */}
            <a
              href="https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 h-9 px-2.5 text-xs font-semibold text-slate-700 hover:text-red-600 hover:bg-red-50/60 rounded-xl transition-colors"
              title="Visit UFK Channel on YouTube"
            >
              <YoutubeIcon className="h-4 w-4 text-red-600" />
              <span className="hidden xl:inline">@UFK</span>
            </a>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="space-y-1">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  pathname === "/" ? "text-blue-600 bg-blue-50/80" : "text-slate-800 hover:bg-slate-50"
                }`}
              >
                Home
              </Link>
              <Link
                href="/#all-tools"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-slate-800 rounded-xl hover:bg-slate-50"
              >
                All Tools
              </Link>
              <Link
                href="/picture-of-the-day"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-xl transition-colors ${
                  pathname === "/picture-of-the-day" ? "text-rose-600 bg-rose-50" : "text-rose-600 bg-rose-50/40"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 fill-rose-500" />
                  Fact of the Day
                </span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  pathname === "/about" ? "text-blue-600 bg-blue-50/80 font-semibold" : "text-slate-800 hover:bg-slate-50"
                }`}
              >
                About UFK Tools
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2 text-sm font-medium rounded-xl transition-colors ${
                  pathname === "/contact" ? "text-blue-600 bg-blue-50/80 font-semibold" : "text-slate-800 hover:bg-slate-50"
                }`}
              >
                Contact & Support
              </Link>

              {/* Build Professional CV in mobile menu */}
              <div className="pt-2">
                <Link
                  href="/tools/cv-builder"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-between px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-xl shadow-md shadow-red-600/20 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-white" />
                    <span>Build your professional CV</span>
                  </span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="pt-1">
                <a
                  href="https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 rounded-xl hover:bg-red-50"
                >
                  <YoutubeIcon className="h-4 w-4 text-red-600" />
                  <span>UFK Channel on YouTube</span>
                </a>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <div className="px-3 py-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Categories
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={cat.id === "picture-of-day" ? "/picture-of-the-day" : `/#category-${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 rounded-xl hover:bg-slate-50"
                  >
                    <DynamicIcon name={cat.iconName} className="h-4 w-4 text-blue-600" />
                    <span>{cat.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Global Search Dialog Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
