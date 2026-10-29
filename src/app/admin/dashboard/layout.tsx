"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Wrench,
  LayoutDashboard,
  Sparkles,
  History,
  ExternalLink,
  LogOut,
  Shield,
  Menu,
  X,
  Radio,
  Key,
} from "lucide-react";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminName, setAdminName] = useState<string>("Administrator");
  const [isVerifying, setIsVerifying] = useState(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    // Check active session
    fetch("/api/admin/auth/me")
      .then((res) => {
        if (!res.ok) {
          router.push("/admin/login");
        } else {
          return res.json();
        }
      })
      .then((data) => {
        if (data && data.admin) {
          setAdminName(data.admin.name || "Administrator");
        }
        setIsVerifying(false);
      })
      .catch(() => {
        router.push("/admin/login");
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch {
      router.push("/admin/login");
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 animate-pulse mb-3">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <p className="text-xs text-slate-400">Verifying administrator authorization...</p>
      </div>
    );
  }

  const navItems = [
    {
      name: "Dashboard Overview",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/admin/dashboard",
    },
    {
      name: "Manage Featured Content",
      href: "/admin/dashboard/manage-featured",
      icon: Sparkles,
      active: pathname === "/admin/dashboard/manage-featured",
    },
    {
      name: "Publication History",
      href: "/admin/dashboard/history",
      icon: History,
      active: pathname === "/admin/dashboard/history",
    },
    {
      name: "Account & Security",
      href: "/admin/dashboard/settings",
      icon: Key,
      active: pathname === "/admin/dashboard/settings",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Wrench className="h-4 w-4" />
          </div>
          <span className="font-bold text-sm">UFK Admin</span>
        </div>
        <button
          onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300"
        >
          {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Desktop & Mobile Sidebar */}
      <aside
        className={`${
          isMobileNavOpen ? "block" : "hidden"
        } md:flex flex-col justify-between w-full md:w-64 bg-slate-900 border-r border-slate-800 p-6 z-30 shrink-0`}
      >
        <div>
          {/* Logo & Portal Branding */}
          <Link href="/admin/dashboard" className="hidden md:flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-500 text-white shadow-lg shadow-blue-600/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <div className="font-black text-sm tracking-tight text-white">
                UFK <span className="text-blue-500">ADMIN</span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Control Center</div>
            </div>
          </Link>

          {/* Realtime Stream Badge */}
          <div className="mb-6 rounded-xl bg-slate-950/80 border border-slate-800/80 p-3">
            <div className="flex items-center justify-between text-[11px] font-semibold">
              <span className="text-slate-400">SSE Realtime:</span>
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
                Active
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileNavOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    item.active
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Footer Actions */}
        <div className="pt-6 border-t border-slate-800/80 mt-6 space-y-3">
          <div className="px-1">
            <div className="text-xs font-bold text-white truncate">{adminName}</div>
            <div className="text-[11px] text-slate-500">Administrator Access</div>
          </div>

          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <span>Public Website</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
        <div className="max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
