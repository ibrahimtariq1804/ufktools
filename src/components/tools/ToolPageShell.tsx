"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  File,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Shield,
  HelpCircle,
  ChevronDown,
  Info,
} from "lucide-react";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { DynamicIcon } from "@/components/ui/DynamicIcon";

interface ToolPageShellProps {
  tool: ToolItem;
}

export function ToolPageShell({ tool }: ToolPageShellProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isComplete, setIsComplete] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFiles = (newFiles: FileList | File[]) => {
    setErrorMessage(null);
    const validList: File[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();

      // Format validation if tool has acceptedFormats
      if (
        tool.acceptedFormats.length > 0 &&
        !tool.acceptedFormats.includes(ext)
      ) {
        setErrorMessage(
          `Invalid file format "${file.name}". Accepted formats: ${tool.acceptedFormats.join(", ")}`
        );
        return;
      }

      // Size check
      if (
        tool.maxFileSizeMB > 0 &&
        file.size > tool.maxFileSizeMB * 1024 * 1024
      ) {
        setErrorMessage(
          `File "${file.name}" exceeds maximum allowed size of ${tool.maxFileSizeMB} MB.`
        );
        return;
      }

      validList.push(file);
    }

    if (validList.length > 0) {
      setFiles((prev) => [...prev, ...validList]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (files.length <= 1) {
      resetState();
    }
  };

  const resetState = () => {
    setFiles([]);
    setIsProcessing(false);
    setProgress(0);
    setStatusMessage("");
    setIsComplete(false);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSimulateAction = () => {
    if (files.length === 0 && tool.acceptedFormats.length > 0) {
      setErrorMessage("Please select or drop at least one file to proceed.");
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setStatusMessage("Verifying file structures and parameters...");

    setTimeout(() => {
      setProgress(50);
      setStatusMessage("Executing transformation pipeline...");
    }, 600);

    setTimeout(() => {
      setProgress(85);
      setStatusMessage("Packaging output stream...");
    }, 1200);

    setTimeout(() => {
      setProgress(100);
      setStatusMessage("Process completed successfully!");
      setIsProcessing(false);
      setIsComplete(true);
    }, 1800);
  };

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
            {category?.name || "Tools"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Tool Header Card */}
        <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-sm border border-slate-200/80 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white shadow-lg shadow-blue-900/10">
                <DynamicIcon name={tool.iconName} className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {category?.name}
                  </span>
                  {tool.badge && (
                    <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200/60">
                      {tool.badge}
                    </span>
                  )}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                      tool.processingMode === "client"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : tool.processingMode === "server"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-cyan-50 text-cyan-700 border-cyan-200"
                    }`}
                  >
                    {tool.processingMode === "client"
                      ? "100% In-Browser"
                      : tool.processingMode === "server"
                      ? "FastAPI Microservice"
                      : "Hybrid Engine"}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {tool.name}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  {tool.fullDescription}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 1 Demonstration Notice */}
        <div className="flex items-center gap-3 rounded-2xl bg-blue-50/70 border border-blue-200/70 p-4 mb-8 text-xs sm:text-sm text-blue-800">
          <Info className="h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <strong>Phase 1 Frontend Foundation Active:</strong> This page presents the complete UI, dropzone validation, responsive controls, and preview states. Real document transformation engines will be wired up during Phases 3, 4, and 5.
          </div>
        </div>

        {/* Interactive Processing Box */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-12">
          {tool.acceptedFormats.length > 0 ? (
            <div>
              {/* Drag & Drop Area */}
              {!isComplete && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-14 text-center cursor-pointer transition-all duration-300 ${
                    isDragging
                      ? "border-blue-500 bg-blue-50/60 scale-[1.01]"
                      : "border-slate-300 hover:border-blue-400 hover:bg-slate-50/60"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple={tool.id.includes("merge") || tool.id.includes("jpg-to-pdf")}
                    accept={tool.acceptedFormats.join(",")}
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Choose file or drop it here
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 max-w-sm">
                    Supported formats: {tool.acceptedFormats.join(", ")}
                    {tool.maxFileSizeMB > 0 && ` (Max: ${tool.maxFileSizeMB} MB)`}
                  </p>
                  <button
                    type="button"
                    className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-500 transition-colors"
                  >
                    Select File from Device
                  </button>
                </div>
              )}

              {/* Error Alert */}
              {errorMessage && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-medium text-rose-700 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Selected Files List */}
              {files.length > 0 && !isComplete && (
                <div className="mt-6 space-y-2">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Selected Documents ({files.length})
                  </div>
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <File className="h-5 w-5 text-blue-600 shrink-0" />
                        <div>
                          <div className="text-sm font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
                            {file.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        disabled={isProcessing}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  {/* Action Bar */}
                  <div className="mt-6 flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                      onClick={resetState}
                      disabled={isProcessing}
                      className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Clear All
                    </button>
                    <button
                      onClick={handleSimulateAction}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 transition-all"
                    >
                      {isProcessing ? "Processing..." : `Execute ${tool.name}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Processing Progress Bar */}
              {isProcessing && (
                <div className="mt-8 space-y-3 rounded-2xl bg-blue-50/60 border border-blue-100 p-6">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                    <span>{statusMessage}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-blue-200/60">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Completion & Download Area */}
              {isComplete && (
                <div className="py-8 text-center space-y-5 animate-in fade-in duration-300">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md">
                    <CheckCircle2 className="h-9 w-9" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-slate-900">
                      Processing Complete!
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
                      Your document has been processed successfully and is ready for download.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={() => alert(`Downloaded file for ${tool.name} (Demonstration)`)}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Result</span>
                    </button>
                    <button
                      onClick={resetState}
                      className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Process Another File</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Non-file tools (Calculators, Converters, Builders) */
            <div className="py-8 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <DynamicIcon name={tool.iconName} className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                Interactive {tool.name} Engine
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {tool.shortDescription}
              </p>
              <div className="pt-2">
                <button
                  onClick={handleSimulateAction}
                  className="rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500 transition-colors"
                >
                  Launch Interactive Interface
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center sm:text-left">
            How to Use {tool.name} in 3 Simple Steps
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
              <h4 className="text-sm font-bold">Your Privacy is Protected</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                We never read, harvest, or sell your files. Client-processed operations never leave your computer.
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
