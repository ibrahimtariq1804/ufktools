"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Shield,
  ArrowUp,
  ArrowDown,
  Layers,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { trackToolAction } from "@/lib/analytics";

interface MergePdfToolProps {
  tool: ToolItem;
}

interface PdfFileItem {
  id: string;
  file: File;
  pageCount?: number;
}

export function MergePdfTool({ tool }: MergePdfToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
  const [mergedStats, setMergedStats] = useState<{ totalPages: number; totalSizeBytes: number } | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleFilesSelected = async (selectedList: FileList | File[]) => {
    setErrorMessage(null);
    const newItems: PdfFileItem[] = [];

    for (let i = 0; i < selectedList.length; i++) {
      const file = selectedList[i];
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setErrorMessage(`"${file.name}" is not a PDF file.`);
        return;
      }

      if (file.size > 100 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" exceeds maximum allowed size of 100 MB.`);
        return;
      }

      // Read page count using pdf-lib
      try {
        const buffer = await file.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        newItems.push({
          id: `${file.name}-${Date.now()}-${i}`,
          file,
          pageCount: doc.getPageCount(),
        });
      } catch {
        newItems.push({
          id: `${file.name}-${Date.now()}-${i}`,
          file,
        });
      }
    }

    if (newItems.length > 0) {
      setFiles((prev) => [...prev, ...newItems]);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
    if (files.length <= 1) {
      reset();
    }
  };

  const reset = () => {
    setFiles([]);
    setIsProcessing(false);
    setProgress(0);
    setMergedBlobUrl(null);
    setMergedStats(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Real client-side PDF Merge execution
  const executeMerge = async () => {
    if (files.length < 2) {
      setErrorMessage("Please select at least 2 PDF documents to merge.");
      return;
    }

    setIsProcessing(true);
    setProgress(10);
    setErrorMessage(null);

    try {
      const mergedPdf = await PDFDocument.create();
      let totalPages = 0;

      for (let i = 0; i < files.length; i++) {
        const item = files[i];
        setProgress(Math.round(10 + (i / files.length) * 70));

        const arrayBuffer = await item.file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
        totalPages += copiedPages.length;
      }

      setProgress(90);
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      setMergedBlobUrl(url);
      setMergedStats({
        totalPages,
        totalSizeBytes: mergedPdfBytes.byteLength,
      });
      setProgress(100);
      trackToolAction("merge-pdf", "merge_completed");
    } catch (err: unknown) {
      console.error("PDF Merge error:", err);
      const msg = err instanceof Error ? err.message : "Failed to merge PDF documents.";
      setErrorMessage(
        msg.includes("password")
          ? "One or more of the selected PDFs is password-protected. Please unlock it before merging."
          : "An error occurred while merging your PDF documents. Please verify that the files are valid PDFs."
      );
    } finally {
      setIsProcessing(false);
    }
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
          <Link href="/#category-pdf-tools" className="hover:text-blue-600 transition-colors">
            {category?.name || "PDF Tools"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Tool Header Card */}
        <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-sm border border-slate-200/80 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white shadow-lg shadow-blue-900/10">
                <Layers className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {category?.name}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    100% In-Browser WebAssembly
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                    Zero Server Cost
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

        {/* Main Processing Card */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-12">
          {!mergedBlobUrl ? (
            <div>
              {/* Dropzone */}
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
                  if (e.dataTransfer.files) handleFilesSelected(e.dataTransfer.files);
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
                  multiple
                  accept=".pdf"
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(e.target.files);
                  }}
                  className="hidden"
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 group-hover:scale-110 transition-transform shadow-inner">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Choose PDF files or drop them here
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm">
                  Select two or more PDF documents to combine into one. Files stay 100% on your device.
                </p>
                <button
                  type="button"
                  className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-500 transition-colors"
                >
                  Select PDF Files
                </button>
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-medium text-rose-700 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* File List for Ordering */}
              {files.length > 0 && (
                <div className="mt-8 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <span>Arrange Documents in Desired Merge Order ({files.length})</span>
                    <button
                      onClick={reset}
                      className="text-slate-400 hover:text-rose-600 normal-case font-semibold transition-colors"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-2">
                    {files.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-3 sm:px-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                            {idx + 1}
                          </span>
                          <FileText className="h-5 w-5 text-blue-600 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate max-w-xs sm:max-w-md">
                              {item.file.name}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <span>{(item.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                              {item.pageCount && <span>• {item.pageCount} pages</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => moveUp(idx)}
                            disabled={idx === 0 || isProcessing}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveDown(idx)}
                            disabled={idx === files.length - 1 || isProcessing}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 disabled:opacity-30 transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeFile(item.id)}
                            disabled={isProcessing}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Remove File"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Execution Progress */}
                  {isProcessing && (
                    <div className="mt-6 space-y-2 rounded-2xl bg-blue-50/60 border border-blue-100 p-5">
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                        <span>Merging PDF byte streams locally...</span>
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

                  {/* Merge Trigger Button */}
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={executeMerge}
                      disabled={isProcessing || files.length < 2}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all"
                    >
                      <Layers className="h-4 w-4" />
                      <span>{isProcessing ? "Merging in Browser..." : `Merge ${files.length} PDFs Now`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Result State */
            <div className="py-10 text-center space-y-6 animate-in fade-in duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  PDF Documents Merged Successfully!
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  Combined {files.length} files into 1 document containing {mergedStats?.totalPages} total pages (
                  {((mergedStats?.totalSizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a
                  href={mergedBlobUrl}
                  download="ufk-tools-merged.pdf"
                  onClick={() => trackToolAction("merge-pdf", "download_merged_pdf")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Merged PDF</span>
                </a>
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Merge More Files</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            How to Merge PDFs with UFK Tools
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

        {/* Privacy Shield */}
        <div className="rounded-2xl bg-slate-900 p-6 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <Shield className="h-8 w-8 text-blue-400 shrink-0" />
            <div>
              <h4 className="text-sm font-bold">Absolute Client-Side Privacy</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Merging occurs 100% inside your browser using WebAssembly. Your documents are never uploaded to any server.
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
