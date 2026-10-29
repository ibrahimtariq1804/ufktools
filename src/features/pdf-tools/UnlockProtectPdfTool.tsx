"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Lock,
  Unlock,
  ShieldCheck,
  KeyRound,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Printer,
  ChevronRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import { ToolItem } from "@/config/tools.config";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";
import { decryptPDF, isEncrypted } from "@pdfsmaller/pdf-decrypt";

interface UnlockProtectPdfToolProps {
  tool: ToolItem;
}

type Mode = "protect" | "unlock";

export function UnlockProtectPdfTool({ tool }: UnlockProtectPdfToolProps) {
  const [mode, setMode] = useState<Mode>("protect");
  const [file, setFile] = useState<File | null>(null);
  const [isEncryptedFile, setIsEncryptedFile] = useState<boolean | null>(null);
  const [checkingEncryption, setCheckingEncryption] = useState<boolean>(false);

  // Form State
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(true);

  // Execution State
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    downloadUrl: string;
    filename: string;
    sizeMB: string;
    mode: Mode;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password strength calculation
  const getPasswordStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: "None", color: "bg-slate-200" };
    let score = 0;
    if (pwd.length >= 6) score += 1;
    if (pwd.length >= 10) score += 1;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score: 25, label: "Weak", color: "bg-amber-500" };
    if (score <= 3) return { score: 60, label: "Good", color: "bg-blue-500" };
    return { score: 100, label: "Strong (AES-256)", color: "bg-emerald-500" };
  };

  const strength = getPasswordStrength(password);

  // Handle File Input
  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith(".pdf")) {
      setError("Please select a valid .pdf file.");
      return;
    }

    if (selectedFile.size > tool.maxFileSizeMB * 1024 * 1024) {
      setError(`File exceeds maximum size limit of ${tool.maxFileSizeMB}MB.`);
      return;
    }

    setError(null);
    setSuccessResult(null);
    setFile(selectedFile);
    setPassword("");
    setConfirmPassword("");
    setCheckingEncryption(true);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const uint8 = new Uint8Array(buffer);
      const encInfo = await isEncrypted(uint8);
      const isEnc = Boolean(encInfo && encInfo.encrypted);
      setIsEncryptedFile(isEnc);

      // Auto-suggest mode if mismatch
      if (isEnc && mode === "protect") {
        setMode("unlock");
      } else if (!isEnc && mode === "unlock") {
        // file is not encrypted, warn gently
      }
    } catch {
      setIsEncryptedFile(false);
    } finally {
      setCheckingEncryption(false);
    }
  }, [tool.maxFileSizeMB, mode]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Execute Action
  const handleProcess = async () => {
    if (!file) {
      setError("Please select a PDF file first.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (mode === "protect" && password !== confirmPassword) {
      setError("Passwords do not match. Please re-type your password.");
      return;
    }

    if (mode === "protect" && password.length < 4) {
      setError("Password should be at least 4 characters long.");
      return;
    }

    setError(null);
    setIsProcessing(true);

    try {
      const fileBytes = new Uint8Array(await file.arrayBuffer());

      if (mode === "protect") {
        const encryptedBytes = await encryptPDF(fileBytes, password, {
          algorithm: "AES-256",
          allowPrinting: allowPrinting,
          allowHighQualityPrint: allowPrinting,
          allowCopying: allowCopying,
          allowModifying: false,
          allowAnnotating: true,
          allowFillingForms: true,
        });

        const blob = new Blob([encryptedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
        const downloadUrl = URL.createObjectURL(blob);
        const filename = file.name.replace(/\.pdf$/i, "") + "_protected.pdf";
        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);

        setSuccessResult({ downloadUrl, filename, sizeMB, mode: "protect" });
      } else {
        // Unlock Mode
        try {
          const decryptedBytes = await decryptPDF(fileBytes, password);
          const blob = new Blob([decryptedBytes.buffer as ArrayBuffer], { type: "application/pdf" });
          const downloadUrl = URL.createObjectURL(blob);
          const filename = file.name.replace(/\.pdf$/i, "") + "_unlocked.pdf";
          const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);

          setSuccessResult({ downloadUrl, filename, sizeMB, mode: "unlock" });
        } catch (decryptErr: unknown) {
          const msg = decryptErr instanceof Error ? decryptErr.message : String(decryptErr);
          if (msg.toLowerCase().includes("password") || msg.toLowerCase().includes("incorrect") || msg.toLowerCase().includes("decrypt")) {
            throw new Error("Incorrect password. Please verify the password and try again.");
          }
          throw decryptErr;
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to process PDF.";
      setError(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setIsEncryptedFile(null);
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setSuccessResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb Navigation */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link href="/tools" className="hover:text-blue-600 transition-colors">
              Tools
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="font-semibold text-slate-800">{tool.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 mb-3">
            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
            <span>Military-Grade AES-256 Protection & Instant Unlock</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Protect or Unlock PDF Files
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Encrypt documents with strong passwords or remove security restrictions from authorized files. 100% processed in your browser.
          </p>
        </div>

        {/* Mode Toggle Switch */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1 shadow-inner border border-slate-300/60">
            <button
              onClick={() => {
                setMode("protect");
                setError(null);
                setSuccessResult(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                mode === "protect"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Lock className="h-4 w-4" />
              <span>Protect PDF (Encrypt)</span>
            </button>
            <button
              onClick={() => {
                setMode("unlock");
                setError(null);
                setSuccessResult(null);
              }}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                mode === "unlock"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Unlock className="h-4 w-4" />
              <span>Unlock PDF (Decrypt)</span>
            </button>
          </div>
        </div>

        {/* Main Work Area */}
        <div className="rounded-2xl bg-white shadow-xl border border-slate-200/80 p-6 sm:p-8">
          {successResult ? (
            /* Success State */
            <div className="text-center py-6 max-w-md mx-auto">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {successResult.mode === "protect" ? "PDF Encrypted Successfully!" : "PDF Unlocked Successfully!"}
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600">
                {successResult.mode === "protect"
                  ? "Your PDF is now encrypted with military-grade AES-256 bit security."
                  : "Password restrictions have been removed. Your document is ready to save."}
              </p>

              <div className="my-6 rounded-xl bg-slate-50 border border-slate-200 p-4 text-left">
                <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                  <span className="font-semibold text-slate-800 truncate mr-2">{successResult.filename}</span>
                  <span className="shrink-0">{successResult.sizeMB} MB</span>
                </div>
                <div className="text-[11px] text-emerald-600 flex items-center gap-1 mt-1 font-medium">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>
                    {successResult.mode === "protect" ? "AES-256 standard encryption applied" : "Decrypted & unrestricted"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={successResult.downloadUrl}
                  download={successResult.filename}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download {successResult.mode === "protect" ? "Protected PDF" : "Unlocked PDF"}</span>
                </a>

                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 text-slate-500" />
                  <span>Process Another File</span>
                </button>
              </div>
            </div>
          ) : (
            /* Upload & Configure State */
            <div className="space-y-6">
              {!file ? (
                /* Dropzone */
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 p-8 sm:p-12 text-center transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-200 group-hover:scale-110 transition-transform">
                    {mode === "protect" ? (
                      <Lock className="h-7 w-7 text-blue-600" />
                    ) : (
                      <Unlock className="h-7 w-7 text-emerald-600" />
                    )}
                  </div>
                  <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">
                    {mode === "protect" ? "Drop PDF to Protect" : "Drop Locked PDF to Unlock"}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Drag and drop your file here, or click to browse
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF format up to {tool.maxFileSizeMB}MB</span>
                  </div>
                </div>
              ) : (
                /* Selected File Card & Settings Form */
                <div className="space-y-6">
                  {/* File Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{file.name}</h4>
                        <p className="text-xs text-slate-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                          {checkingEncryption && " • Checking encryption status..."}
                          {isEncryptedFile === true && (
                            <span className="ml-2 inline-flex items-center gap-1 text-amber-600 font-semibold">
                              <Lock className="h-3 w-3" /> Password-Protected
                            </span>
                          )}
                          {isEncryptedFile === false && (
                            <span className="ml-2 inline-flex items-center gap-1 text-slate-500">
                              <Unlock className="h-3 w-3 text-slate-400" /> Unprotected
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleReset}
                      className="text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors"
                    >
                      Change File
                    </button>
                  </div>

                  {/* Mode mismatch alert */}
                  {mode === "protect" && isEncryptedFile === true && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 flex items-start gap-2.5 text-xs text-amber-800">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-bold">This file is already password-protected.</span>
                        <p className="mt-0.5">
                          Do you want to unlock it instead?{" "}
                          <button
                            onClick={() => setMode("unlock")}
                            className="font-bold underline text-amber-900 ml-1"
                          >
                            Switch to Unlock Mode
                          </button>
                        </p>
                      </div>
                    </div>
                  )}

                  {mode === "unlock" && isEncryptedFile === false && (
                    <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 flex items-start gap-2.5 text-xs text-blue-800">
                      <AlertCircle className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                      <div>
                        <span className="font-bold">Notice:</span> This file does not appear to have an open password lock. You can still set protection by switching to{" "}
                        <button
                          onClick={() => setMode("protect")}
                          className="font-bold underline text-blue-900"
                        >
                          Protect Mode
                        </button>
                        .
                      </div>
                    </div>
                  )}

                  {/* Password Controls */}
                  <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-blue-600" />
                      <span>{mode === "protect" ? "Set Document Password" : "Enter Password to Unlock"}</span>
                    </h3>

                    {/* Password Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        {mode === "protect" ? "Choose Password" : "File Password"}
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={mode === "protect" ? "Enter a strong secret password..." : "Enter file password..."}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Mode: Protect Confirm & Strength Meter */}
                    {mode === "protect" && (
                      <>
                        {/* Password Strength Meter */}
                        {password && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500">Security Strength:</span>
                              <span className="font-bold text-slate-700">{strength.label}</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className={`h-full ${strength.color} transition-all duration-300`}
                                style={{ width: `${strength.score}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Confirm Password
                          </label>
                          <input
                            type={showPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Re-enter password to confirm..."
                            className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>

                        {/* Granular Permission Options */}
                        <div className="pt-2 border-t border-slate-100">
                          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                            Permissions & Restrictions
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={allowPrinting}
                                onChange={(e) => setAllowPrinting(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <Printer className="h-3.5 w-3.5 text-slate-500" />
                                <span>Allow Printing</span>
                              </div>
                            </label>

                            <label className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-2.5 cursor-pointer hover:bg-slate-50 transition-colors">
                              <input
                                type="checkbox"
                                checked={allowCopying}
                                onChange={(e) => setAllowCopying(e.target.checked)}
                                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                <Copy className="h-3.5 w-3.5 text-slate-500" />
                                <span>Allow Text Copying</span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Error Notification */}
                  {error && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-xs text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Submit Action */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span>Zero server uploads. 100% private in-browser WebCrypto.</span>
                    </div>

                    <button
                      onClick={handleProcess}
                      disabled={isProcessing}
                      className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-7 py-3 text-sm font-bold text-white shadow-md transition-all ${
                        isProcessing
                          ? "bg-slate-400 cursor-not-allowed"
                          : mode === "protect"
                          ? "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"
                          : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                      }`}
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Processing PDF...</span>
                        </>
                      ) : mode === "protect" ? (
                        <>
                          <Lock className="h-4 w-4" />
                          <span>Encrypt & Protect PDF</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="h-4 w-4" />
                          <span>Unlock & Decrypt PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature Cards */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3.5">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Standard AES-256 Bit Encryption</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Secures your document using PDF 2.0 compliant AES-256 algorithms. Only authorized individuals with the password can view the content.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3.5">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">100% Client-Side Privacy</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Your files and passwords never touch an external cloud or server. All cryptographic operations execute within your local web browser.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3.5">
              <KeyRound className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Permission Control</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Customize owner permissions to allow or forbid printing and copying text, ensuring full authority over document distribution.
            </p>
          </div>
        </div>

        {/* How-to & FAQ */}
        <div className="mt-12 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span>How to Protect or Unlock a PDF</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  1
                </span>
                <h4 className="text-xs font-bold text-slate-800">Select Mode & Upload</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Choose Protect to add a password, or Unlock to remove an existing restriction. Drop your PDF.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  2
                </span>
                <h4 className="text-xs font-bold text-slate-800">Set or Enter Password</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Provide your secret password. For protection, check your desired permissions like printing.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  3
                </span>
                <h4 className="text-xs font-bold text-slate-800">Instant Download</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Click Encrypt or Unlock. Your clean, cryptographically transformed PDF is saved immediately.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">Can UFK Tools see my password or document?</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Never. Cryptographic operations are performed locally using the browser&apos;s WebCrypto API. Your document data is never sent across the internet.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">Can you unlock a PDF without the password?</h4>
                <p className="text-xs text-slate-600 mt-1">
                  No. Modern AES-256 PDF encryption cannot be bypassed without the legitimate decryption password. You must enter the correct password to unlock and strip protection.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
