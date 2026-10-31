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
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo / Brand */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-slate-950 via-blue-900 to-blue-600 text-white shadow-md shadow-blue-900/20 group-hover:shadow-blue-600/30 transition-all duration-300">
                <Wrench className="h-5 w-5 transition-transform group-hover:rotate-12 duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                  UFK <span className="text-blue-600 font-extrabold">TOOLS</span>
                </span>
                <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase -mt-1">
                  Free Utility Suite
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
              <Link
                href="/"
                className={`px-3 py-2 rounded-lg transition-colors hover:text-blue-600 hover:bg-slate-50 ${
                  pathname === "/" ? "text-blue-600 font-semibold bg-blue-50/50" : ""
                }`}
              >
                Home
              </Link>

              {/* Categories Dropdown */}
              <div
                className="relative"
                onMouseEnter={() => setIsCategoryDropdownOpen(true)}
                onMouseLeave={() => setIsCategoryDropdownOpen(false)}
              >
                <button
                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:text-blue-600 hover:bg-slate-50 transition-colors"
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                >
                  <span>Categories</span>
                  <ChevronDown className="h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:rotate-180" />
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute top-full left-0 w-72 rounded-2xl bg-white p-3 shadow-xl border border-slate-200 animate-in fade-in slide-in-from-top-2 duration-150">
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
                )}
              </div>

              <Link
                href="/#all-tools"
                className="px-3 py-2 rounded-lg transition-colors hover:text-blue-600 hover:bg-slate-50"
              >
                All Tools
              </Link>

              <Link
                href="/picture-of-the-day"
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50/60 transition-colors font-medium"
              >
                <Sparkles className="h-4 w-4 text-rose-500 fill-rose-500" />
                <span>Fact of the Day</span>
              </Link>

              <Link
                href="/about"
                className={`px-3 py-2 rounded-lg transition-colors hover:text-blue-600 hover:bg-slate-50 ${
                  pathname === "/about" ? "text-blue-600 font-semibold bg-blue-50/50" : ""
                }`}
              >
                About
              </Link>

              {/* Build Your Professional CV Button — on the right of ABOUT and left of search */}
              <Link
                href="/tools/cv-builder"
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ml-1.5 shadow-sm group ${
                  pathname === "/tools/cv-builder"
                    ? "bg-red-700 text-white ring-2 ring-red-400/50 shadow-md shadow-red-700/30"
                    : "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 hover:shadow-red-600/35 border border-red-500 hover:border-red-600 active:scale-[0.98]"
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-white/90" />
                <span>
                  Build your professional <strong className="font-black text-white tracking-wide">CV</strong>
                </span>
              </Link>
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2.5">
            {/* Search Trigger Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-500 hover:text-slate-800 px-3.5 py-2 text-xs font-medium transition-colors border border-slate-200/60"
              aria-label="Search tools"
            >
              <Search className="h-4 w-4 text-slate-400" />
              <span className="hidden sm:inline">Search tools...</span>
              <kbd className="hidden sm:inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-200">
                Ctrl K
              </kbd>
            </button>

            {/* YouTube Channel Link */}
            <a
              href="https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-red-600 hover:bg-red-50/60 rounded-xl transition-colors"
              title="Visit UFK Channel on YouTube"
            >
              <YoutubeIcon className="h-4 w-4 text-red-600" />
              <span>@UFK</span>
            </a>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-4 duration-200">
            <div className="space-y-1">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-slate-800 rounded-lg hover:bg-slate-50"
              >
                Home
              </Link>
              <Link
                href="/#all-tools"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-slate-800 rounded-lg hover:bg-slate-50"
              >
                All Tools
              </Link>
              <Link
                href="/picture-of-the-day"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-base font-medium text-rose-600 bg-rose-50/50 rounded-lg"
              >
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 fill-rose-500" />
                  Fact of the Day
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block px-3 py-2 text-base font-medium text-slate-800 rounded-lg hover:bg-slate-50"
              >
                About UFK Tools
              </Link>

              {/* Build Professional CV in mobile menu */}
              <Link
                href="/tools/cv-builder"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-sm border border-red-500 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-white" />
                  <span>
                    Build your professional <strong className="font-black text-white">CV</strong>
                  </span>
                </span>
              </Link>

              <a
                href="https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-base font-medium text-red-600 rounded-lg hover:bg-red-50"
              >
                <YoutubeIcon className="h-4 w-4 text-red-600" />
                UFK Channel on YouTube
              </a>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="px-3 py-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Categories
              </div>
              <div className="grid grid-cols-1 gap-1 mt-1">
                {CATEGORIES.map((cat) => (
                  <Link
                    key={cat.id}
                    href={cat.id === "picture-of-day" ? "/picture-of-the-day" : `/#category-${cat.slug}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-slate-700 rounded-lg hover:bg-slate-50"
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
