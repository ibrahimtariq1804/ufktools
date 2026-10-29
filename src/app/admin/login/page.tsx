"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Sparkles,
} from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showHelper, setShowHelper] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Restore remembered email if available
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ufk_admin_email_pref");
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setEmail(saved);
      }
    }
  }, []);

  const handleFillDemo = () => {
    setEmail("admin@ufktools.com");
    setPassword("admin123");
    setShowHelper(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      // Remember email preference
      if (typeof window !== "undefined") {
        localStorage.setItem("ufk_admin_email_pref", email.trim());
      }

      setSuccessMessage("Authenticated successfully! Loading control center...");
      setTimeout(() => {
        router.push("/admin/dashboard");
      }, 700);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication error.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-white relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-32 left-1/4 w-[400px] h-[400px] bg-blue-600/30 rounded-full blur-[128px]" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 px-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to UFK Tools</span>
        </Link>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-500 text-white shadow-xl shadow-blue-500/20 mb-4">
          <Shield className="h-7 w-7" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Admin Control Center
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Sign in to manage the Picture / Fact of the Day & platform content
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 shadow-2xl backdrop-blur-xl">
          {errorMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-rose-950/70 border border-rose-800 p-4 text-xs text-rose-200 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl bg-emerald-950/70 border border-emerald-800 p-4 text-xs text-emerald-200 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
              <div>{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
                Administrator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-xl bg-slate-950 border border-slate-800 pl-10 pr-10 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim() || !password}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isSubmitting ? "Authenticating..." : "Sign In to Dashboard"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* First-Time Setup / Testing Helper */}
          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setShowHelper(!showHelper)}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Key className="h-3 w-3 text-blue-400" />
              <span>{showHelper ? "Hide initial login details" : "First time signing in?"}</span>
            </button>

            {showHelper && (
              <div className="mt-3 text-left rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-semibold text-blue-400 text-[11px]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Initial Setup Credentials</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  The initial seed account is configured as:
                </p>
                <div className="rounded-lg bg-slate-900 p-2 font-mono text-[11px] text-slate-300 space-y-0.5 border border-slate-800/80">
                  <div>Email: <span className="text-white">admin@ufktools.com</span></div>
                  <div>Password: <span className="text-white">admin123</span></div>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Once logged in, go to <strong>Account & Security</strong> in the dashboard sidebar to change your email and set any custom password of your choice.
                </p>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className="w-full mt-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-center py-1.5 font-semibold text-[11px] transition-colors border border-blue-500/30 cursor-pointer"
                >
                  Auto-fill Initial Credentials
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
