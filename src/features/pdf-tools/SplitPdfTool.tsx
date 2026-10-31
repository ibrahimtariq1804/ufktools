"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Shield,
  Scissors,
  Archive,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { trackToolAction } from "@/lib/analytics";

interface SplitPdfToolProps {
  tool: ToolItem;
}

export function SplitPdfTool({ tool }: SplitPdfToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [splitMode, setSplitMode] = useState<"range" | "all">("range");
  const [rangeInput, setRangeInput] = useState<string>("1");
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>("split.pdf");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file.");
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = doc.getPageCount();
      setSelectedFile(file);
      setTotalPages(pages);
      setRangeInput(pages > 1 ? `1-${Math.min(pages, 2)}` : "1");
    } catch (err) {
      console.error("PDF read error:", err);
      setErrorMessage("Could not read this PDF. It may be corrupt or encrypted.");
    }
  };

  const parseRanges = (input: string, max: number): number[] => {
    const pages = new Set<number>();
    const parts = input.split(",");

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes("-")) {
        const [startStr, endStr] = trimmed.split("-");
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.max(1, start); p <= Math.min(max, end); p++) {
            pages.add(p);
          }
        }
      } else {
        const p = parseInt(trimmed, 10);
        if (!isNaN(p) && p >= 1 && p <= max) {
          pages.add(p);
        }
      }
    }
    return Array.from(pages).sort((a, b) => a - b);
  };

  const executeSplit = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setProgress(15);
    setErrorMessage(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const sourcePdf = await PDFDocument.load(arrayBuffer);

      if (splitMode === "range") {
        const targetPages = parseRanges(rangeInput, totalPages);
        if (targetPages.length === 0) {
          setErrorMessage("Please specify at least one valid page number within the document range.");
          setIsProcessing(false);
          return;
        }

        setProgress(40);
        const newPdf = await PDFDocument.create();
        // 0-indexed indices
        const indicesToCopy = targetPages.map((p) => p - 1);
        const copiedPages = await newPdf.copyPages(sourcePdf, indicesToCopy);
        copiedPages.forEach((page) => newPdf.addPage(page));

        setProgress(80);
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);

        setDownloadUrl(url);
        setDownloadFilename(`${selectedFile.name.replace(".pdf", "")}-extracted.pdf`);
        setProgress(100);
      } else {
        // Split every page into separate PDFs inside a ZIP
        setProgress(25);
        const zip = new JSZip();

        for (let i = 0; i < totalPages; i++) {
          const singlePagePdf = await PDFDocument.create();
          const [copiedPage] = await singlePagePdf.copyPages(sourcePdf, [i]);
          singlePagePdf.addPage(copiedPage);
          const singleBytes = await singlePagePdf.save();
          zip.file(`page-${i + 1}.pdf`, singleBytes);
          setProgress(Math.round(25 + ((i + 1) / totalPages) * 60));
        }

        const zipBlob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(zipBlob);
        setDownloadUrl(url);
        setDownloadFilename(`${selectedFile.name.replace(".pdf", "")}-all-pages.zip`);
        setProgress(100);
      }
      trackToolAction("split-pdf", "split_completed");
    } catch (err: unknown) {
      console.error("Split error:", err);
      const msg = err instanceof Error ? err.message : "Failed to split PDF.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setTotalPages(0);
    setDownloadUrl(null);
    setProgress(0);
    setIsProcessing(false);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/#category-pdf-tools" className="hover:text-blue-600 transition-colors">
            {category?.name || "PDF Tools"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Header */}
        <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-sm border border-slate-200/80 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white shadow-lg shadow-blue-900/10">
              <Scissors className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {category?.name}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  Client-Side WebAssembly
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

        {/* Main Processing Box */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-12">
          {!downloadUrl ? (
            <div>
              {!selectedFile ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFile(e.dataTransfer.files[0]);
                    }
                  }}
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
                    accept=".pdf"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
                    }}
                    className="hidden"
                  />
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 group-hover:scale-110 transition-transform shadow-inner">
                    <UploadCloud className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Choose PDF file to split
                  </h3>
                  <p className="mt-1 text-sm text-slate-500 max-w-sm">
                    Drop a document to extract specific pages or separate all pages.
                  </p>
                  <button
                    type="button"
                    className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-500 transition-colors"
                  >
                    Select PDF Document
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Selected Document Info */}
                  <div className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex items-center gap-3">
                      <FileText className="h-6 w-6 text-blue-600 shrink-0" />
                      <div>
                        <div className="text-sm font-semibold text-slate-900 truncate max-w-sm">
                          {selectedFile.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          Total Pages: <strong className="text-slate-800">{totalPages}</strong> • {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={reset}
                      className="text-xs font-semibold text-slate-500 hover:text-rose-600"
                    >
                      Change File
                    </button>
                  </div>

                  {/* Mode Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setSplitMode("range")}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        splitMode === "range"
                          ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Scissors className="h-4 w-4 text-blue-600" />
                        <h4 className="text-sm font-bold text-slate-900">Custom Page Range</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        Extract specific pages into a single new PDF document.
                      </p>
                    </div>

                    <div
                      onClick={() => setSplitMode("all")}
                      className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                        splitMode === "all"
                          ? "border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <Archive className="h-4 w-4 text-purple-600" />
                        <h4 className="text-sm font-bold text-slate-900">Extract Every Page (ZIP)</h4>
                      </div>
                      <p className="text-xs text-slate-500">
                        Splits each page into an individual PDF file bundled in a ZIP archive.
                      </p>
                    </div>
                  </div>

                  {/* Range Input Field */}
                  {splitMode === "range" && (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 space-y-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Pages to Extract (1 to {totalPages})
                      </label>
                      <input
                        type="text"
                        value={rangeInput}
                        onChange={(e) => setRangeInput(e.target.value)}
                        placeholder="e.g. 1-3, 5, 8"
                        className="w-full rounded-xl bg-white border border-slate-300 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                      />
                      <p className="text-xs text-slate-500">
                        Tip: Use hyphens for ranges (e.g., <code className="text-blue-600 font-mono">1-4</code>) and commas for individual pages (e.g., <code className="text-blue-600 font-mono">1, 3, 5</code>).
                      </p>
                    </div>
                  )}

                  {/* Error Alert */}
                  {errorMessage && (
                    <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-medium text-rose-700 animate-in fade-in">
                      <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Progress */}
                  {isProcessing && (
                    <div className="space-y-2 rounded-2xl bg-blue-50/60 border border-blue-100 p-5">
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                        <span>Extracting pages locally...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-blue-200/60">
                        <div
                          className="h-full bg-blue-600 transition-all duration-200 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={executeSplit}
                      disabled={isProcessing}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all"
                    >
                      <Scissors className="h-4 w-4" />
                      <span>{isProcessing ? "Splitting..." : "Extract & Download PDF"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Download State */
            <div className="py-10 text-center space-y-6 animate-in fade-in duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Pages Extracted Successfully!
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  Your extracted file ({downloadFilename}) is ready for download.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  onClick={() => trackToolAction("split-pdf", "download_split_pdf")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download {downloadFilename.endsWith(".zip") ? "ZIP Archive" : "Extracted PDF"}</span>
                </a>
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Split Another Document</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            How to Split PDFs with UFK Tools
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {tool.howToSteps.map((step) => (
              <div
                key={step.step}
                className="rounded-2xl bg-white p-6 border border-slate-200/80 shadow-sm"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-sm mb-4">
                  {step.step}
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-1.5">{step.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
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

        {/* Privacy Notice */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Shield className="h-8 w-8 text-blue-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold">100% In-Browser Privacy</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Splitting executes purely inside your device memory. Your files are never sent to external servers.
              </p>
            </div>
          </div>
          <Link
            href="/privacy"
            className="shrink-0 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
          >
            Learn more →
          </Link>
        </div>
      </div>
    </div>
  );
}
