"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  Key,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  Check,
  RefreshCw,
  Sparkles,
} from "lucide-react";

export default function AdminSettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [adminId, setAdminId] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Profile Form State
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Fetch current admin profile
  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.admin) {
          setName(data.admin.name || "Administrator");
          setEmail(data.admin.email || "");
          setAdminId(data.admin.id || "");
        }
      })
      .catch(() => {
        setProfileError("Could not retrieve account details.");
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, []);

  // Password strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "None", color: "bg-slate-700" };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;

    if (score <= 1) return { score: 1, label: "Weak", color: "bg-rose-500" };
    if (score === 2) return { score: 2, label: "Moderate", color: "bg-amber-500" };
    if (score === 3) return { score: 3, label: "Good", color: "bg-blue-500" };
    return { score: 4, label: "Strong", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(newPassword);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setIsSavingProfile(true);

    try {
      const res = await fetch("/api/admin/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile.");
      }

      setProfileSuccess("Administrator credentials updated successfully!");
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error updating profile.";
      setProfileError(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const res = await fetch("/api/admin/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to change password.");
      }

      setPasswordSuccess("Password updated successfully! Keep your new password safe.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error changing password.";
      setPasswordError(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400 border border-blue-500/20 mb-3">
          <Key className="h-3.5 w-3.5" />
          <span>Security & Credentials</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
          Account & Login Credentials
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Personalize your administrator login email and set a strong password of your choice.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Forms */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card 1: Administrator Identity & Email */}
          <div className="rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-800/80 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Administrator Profile</h2>
                <p className="text-xs text-slate-400">Set the email you will use to sign in</p>
              </div>
            </div>

            {profileError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-950/70 border border-rose-800 p-3 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{profileError}</span>
              </div>
            )}

            {profileSuccess && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800 p-3 text-xs text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{profileSuccess}</span>
              </div>
            )}

            {isLoadingProfile ? (
              <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                <span>Loading account profile...</span>
              </div>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                    Login Email Address (Your Choice)
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. you@yourcompany.com"
                      className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    You will use this email address to log in to the admin panel next time.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-500 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {isSavingProfile ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>Save Profile & Email</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Card 2: Change Password */}
          <div className="rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-7 shadow-xl">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-800/80 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Change Password</h2>
                <p className="text-xs text-slate-400">Set a custom password of your choice</p>
              </div>
            </div>

            {passwordError && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-rose-950/70 border border-rose-800 p-3 text-xs text-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{passwordError}</span>
              </div>
            )}

            {passwordSuccess && (
              <div className="mb-5 flex items-start gap-2.5 rounded-xl bg-emerald-950/70 border border-emerald-800 p-3 text-xs text-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Current Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showCurrentPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  New Password (Your Choice)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type={showNewPass ? "text" : "password"}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showNewPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400">Password Strength:</span>
                      <span className={`font-semibold ${strength.score >= 3 ? "text-emerald-400" : "text-amber-400"}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden flex gap-1">
                      {[1, 2, 3, 4].map((step) => (
                        <div
                          key={step}
                          className={`h-full flex-1 transition-all rounded-full ${
                            step <= strength.score ? strength.color : "bg-slate-800"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full rounded-xl bg-slate-950 border border-slate-800 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isChangingPassword || !currentPassword || !newPassword}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isChangingPassword ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <Key className="h-3.5 w-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Security Status Overview */}
        <div className="lg:col-span-4 space-y-5">
          <div className="rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Authentication Architecture</span>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800/80">
                <div className="text-[11px] text-slate-400">Password Encryption</div>
                <div className="text-white font-mono font-semibold mt-0.5">Bcrypt (10 Salt Rounds)</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Passwords are one-way hashed with salted cryptographic algorithms.
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800/80">
                <div className="text-[11px] text-slate-400">Session Cookie</div>
                <div className="text-white font-mono font-semibold mt-0.5">HMAC-SHA256 Signed</div>
                <div className="text-[10px] text-slate-500 mt-1">
                  HTTP-Only, Secure, SameSite=Lax. Active for 7 days.
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800/80">
                <div className="text-[11px] text-slate-400">Brute Force Protection</div>
                <div className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />
                  <span>Rate Limiting Active</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Locks out suspicious IP addresses after 5 failed attempts for 15 minutes.
                </div>
              </div>

              <div className="rounded-xl bg-slate-950 p-3.5 border border-slate-800/80">
                <div className="text-[11px] text-slate-400">Account ID</div>
                <div className="text-slate-400 font-mono text-[10px] truncate mt-0.5">
                  {adminId || "admin-default-uuid"}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-950/40 via-indigo-950/20 to-purple-950/40 border border-blue-800/40 p-5">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-2">
              <Sparkles className="h-4 w-4" />
              <span>Tip for VPS Deployment</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              You can also specify initial credentials directly in your VPS <code className="text-blue-300 bg-blue-950/60 px-1 py-0.5 rounded font-mono">.env.production</code> file:
            </p>
            <div className="mt-2.5 rounded-lg bg-slate-950 p-2.5 font-mono text-[10px] text-slate-300 space-y-1">
              <div>ADMIN_EMAIL=your@email.com</div>
              <div>ADMIN_PASSWORD=your_secret_pass</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
