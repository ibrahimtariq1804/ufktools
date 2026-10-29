"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  RotateCw,
  Shield,
  Trash2,
  ArrowLeft,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  Sparkles,
  RefreshCw,
  FileCheck,
} from "lucide-react";
import { PDFDocument, degrees } from "pdf-lib";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { getPdfJs } from "@/lib/pdf/pdfjs-helper";

interface RotateReorderToolProps {
  tool: ToolItem;
}

interface PageItem {
  id: string;
  originalIndex: number; // 0-indexed in original PDF
  thumbnailUrl: string;
  rotationDelta: number; // 0, 90, 180, 270
  isDeleted: boolean;
}

export function RotateReorderTool({ tool }: RotateReorderToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>("organized.pdf");
  const [downloadStats, setDownloadStats] = useState<{ pagesRemaining: number; sizeBytes: number } | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleFile = async (file: File) => {
    setErrorMessage(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrorMessage("File exceeds 100 MB limit.");
      return;
    }

    setIsLoadingDoc(true);
    setStatusMessage("Extracting page thumbnails...");

    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const count = pdfDoc.numPages;

      setTotalPages(count);
      setSelectedFile(file);

      const items: PageItem[] = [];
      const thumbScale = 0.35;

      for (let i = 1; i <= count; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: thumbScale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          items.push({
            id: `page-${i}-${Date.now()}`,
            originalIndex: i - 1,
            thumbnailUrl: canvas.toDataURL("image/jpeg", 0.7),
            rotationDelta: 0,
            isDeleted: false,
          });
        }
      }

      setPages(items);
    } catch (err: unknown) {
      console.error("PDF thumbnail load error:", err);
      setErrorMessage(
        err instanceof Error
          ? `Could not parse PDF: ${err.message}`
          : "Could not open this PDF document. It may be password-protected or corrupted."
      );
      setSelectedFile(null);
    } finally {
      setIsLoadingDoc(false);
      setStatusMessage("");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const rotatePage = (index: number, direction: "cw" | "ccw") => {
    setPages((prev) => {
      const updated = [...prev];
      const delta = direction === "cw" ? 90 : -90;
      let newRot = (updated[index].rotationDelta + delta) % 360;
      if (newRot < 0) newRot += 360;
      updated[index] = { ...updated[index], rotationDelta: newRot };
      return updated;
    });
  };

  const rotateAll = (direction: "cw" | "ccw") => {
    setPages((prev) =>
      prev.map((p) => {
        const delta = direction === "cw" ? 90 : -90;
        let newRot = (p.rotationDelta + delta) % 360;
        if (newRot < 0) newRot += 360;
        return { ...p, rotationDelta: newRot };
      })
    );
  };

  const movePage = (index: number, direction: "left" | "right") => {
    const targetIndex = direction === "left" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    setPages((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      return updated;
    });
  };

  const toggleDelete = (index: number) => {
    setPages((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], isDeleted: !updated[index].isDeleted };
      return updated;
    });
  };

  const restoreAll = () => {
    setPages((prev) =>
      prev.map((p) => ({ ...p, isDeleted: false, rotationDelta: 0 }))
    );
  };

  const resetAll = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setSelectedFile(null);
    setTotalPages(0);
    setPages([]);
    setIsProcessing(false);
    setProgress(0);
    setStatusMessage("");
    setDownloadUrl(null);
    setDownloadStats(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveDocument = async () => {
    const activePages = pages.filter((p) => !p.isDeleted);
    if (!selectedFile || activePages.length === 0) {
      setErrorMessage("At least one page must remain in the document.");
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setStatusMessage("Loading PDF structure in memory...");

    try {
      const originalBuffer = await selectedFile.arrayBuffer();
      const sourceDoc = await PDFDocument.load(originalBuffer, { ignoreEncryption: true });
      const newDoc = await PDFDocument.create();

      setProgress(40);
      setStatusMessage("Reordering and applying rotational angles...");

      const indicesToCopy = activePages.map((p) => p.originalIndex);
      const copiedPages = await newDoc.copyPages(sourceDoc, indicesToCopy);

      for (let i = 0; i < copiedPages.length; i++) {
        const pageItem = activePages[i];
        const page = copiedPages[i];

        if (pageItem.rotationDelta !== 0) {
          const existingAngle = page.getRotation().angle;
          const targetAngle = (existingAngle + pageItem.rotationDelta) % 360;
          page.setRotation(degrees(targetAngle));
        }

        newDoc.addPage(page);
      }

      setProgress(80);
      setStatusMessage("Compiling and optimizing PDF output stream...");

      const modifiedBytes = await newDoc.save();
      const blob = new Blob([modifiedBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const baseName = selectedFile.name.replace(/\.pdf$/i, "");
      setDownloadUrl(url);
      setDownloadFilename(`${baseName}-modified.pdf`);
      setDownloadStats({
        pagesRemaining: activePages.length,
        sizeBytes: modifiedBytes.byteLength,
      });

      setProgress(100);
      setStatusMessage("Done!");
    } catch (err: unknown) {
      console.error("Save error:", err);
      setErrorMessage(
        err instanceof Error
          ? `Operation failed: ${err.message}`
          : "Could not compile the modified PDF."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const activeCount = pages.filter((p) => !p.isDeleted).length;
  const deletedCount = pages.length - activeCount;

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
            {category?.name || "PDF Tools"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Tool Header Card */}
        <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-sm border border-slate-200/80 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-700 text-white shadow-lg shadow-blue-900/10">
                <RefreshCw className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {category?.name}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    100% In-Browser Engine
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                    Lossless Page Assembly
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {tool.name}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  Rotate misaligned pages, rearrange page order, and permanently delete unwanted pages with real visual thumbnail feedback.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Processing Box */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-12">
          {/* Step 1: Upload state */}
          {!selectedFile && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 sm:p-16 text-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-blue-500 bg-blue-50/60 scale-[1.01]"
                  : "border-slate-300 hover:border-blue-400 hover:bg-slate-50/60"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 group-hover:scale-110 transition-transform shadow-inner">
                <UploadCloud className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">
                Choose a PDF file or drop it here
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                Rearrange, rotate, or delete pages in seconds. 100% private.
              </p>
              <button
                type="button"
                className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-500 transition-colors"
              >
                Select PDF from Device
              </button>
            </div>
          )}

          {/* Loading Doc Indicator */}
          {isLoadingDoc && (
            <div className="py-12 text-center space-y-4">
              <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              <div className="text-sm font-semibold text-slate-700">
                {statusMessage}
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-medium text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 2: Interactive Page Grid Editor */}
          {selectedFile && !isLoadingDoc && !downloadUrl && (
            <div className="space-y-6">
              {/* Document Summary & Global Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                      {selectedFile.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {activeCount} of {totalPages} active {totalPages === 1 ? "page" : "pages"}
                      {deletedCount > 0 && ` (${deletedCount} deleted)`} • {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>

                {/* Bulk Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => rotateAll("ccw")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Rotate All -90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => rotateAll("cw")}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    <span>Rotate All +90°</span>
                  </button>
                  <button
                    type="button"
                    onClick={restoreAll}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                  >
                    Reset Changes
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Page Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2 bg-slate-50/50 rounded-2xl border border-slate-100 max-h-[580px] overflow-y-auto">
                {pages.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`relative rounded-2xl border-2 p-3 bg-white transition-all shadow-sm flex flex-col justify-between ${
                      item.isDeleted
                        ? "border-rose-200 bg-rose-50/40 opacity-50 grayscale"
                        : "border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-extrabold text-slate-800">
                        Page {idx + 1}
                        {item.originalIndex !== idx && (
                          <span className="text-[10px] font-normal text-slate-400 ml-1">
                            (was {item.originalIndex + 1})
                          </span>
                        )}
                      </span>
                      {item.rotationDelta !== 0 && !item.isDeleted && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200">
                          {item.rotationDelta}°
                        </span>
                      )}
                      {item.isDeleted && (
                        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                          Deleted
                        </span>
                      )}
                    </div>

                    {/* Thumbnail with rotation transform */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-slate-100 flex items-center justify-center p-1 border border-slate-100">
                      <div
                        className="h-full w-full flex items-center justify-center transition-transform duration-300"
                        style={{ transform: `rotate(${item.rotationDelta}deg)` }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.thumbnailUrl}
                          alt={`Page ${item.originalIndex + 1}`}
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Controls Footer */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1">
                      {/* Move Left / Right */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => movePage(idx, "left")}
                          disabled={idx === 0 || item.isDeleted}
                          title="Move Earlier"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-20 transition-colors"
                        >
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => movePage(idx, "right")}
                          disabled={idx === pages.length - 1 || item.isDeleted}
                          title="Move Later"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-20 transition-colors"
                        >
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Rotate Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => rotatePage(idx, "ccw")}
                          disabled={item.isDeleted}
                          title="Rotate Left 90°"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-20 transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => rotatePage(idx, "cw")}
                          disabled={item.isDeleted}
                          title="Rotate Right 90°"
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-blue-600 disabled:opacity-20 transition-colors"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Delete / Restore */}
                      <button
                        type="button"
                        onClick={() => toggleDelete(idx)}
                        title={item.isDeleted ? "Restore Page" : "Delete Page"}
                        className={`p-1.5 rounded-lg transition-colors ${
                          item.isDeleted
                            ? "text-emerald-600 hover:bg-emerald-50"
                            : "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        }`}
                      >
                        {item.isDeleted ? (
                          <RotateCcw className="h-3.5 w-3.5" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              {isProcessing && (
                <div className="space-y-3 rounded-2xl bg-blue-50/70 border border-blue-200/80 p-6 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 animate-spin text-blue-600" />
                      {statusMessage}
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-blue-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Save Changes Action Bar */}
              <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={resetAll}
                  disabled={isProcessing}
                  className="rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDocument}
                  disabled={isProcessing || activeCount === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 transition-all"
                >
                  <FileCheck className="h-4 w-4" />
                  <span>
                    {isProcessing
                      ? "Compiling PDF..."
                      : `Apply & Download PDF (${activeCount} Pages)`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Download Complete State */}
          {downloadUrl && (
            <div className="py-10 text-center space-y-6 animate-in fade-in duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  PDF Organized Successfully!
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  New document compiled with {downloadStats?.pagesRemaining} pages ({downloadStats ? (downloadStats.sizeBytes / (1024 * 1024)).toFixed(2) : "0"} MB).
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Organized PDF</span>
                </a>
                <button
                  onClick={resetAll}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Organize Another PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center sm:text-left">
            How to Organize PDF Pages in 3 Simple Steps
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
              <h4 className="text-sm font-bold">100% In-Browser Privacy</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Every page reorder, rotation angle, and deletion is computed locally in memory with pdf-lib. No documents are transmitted across the web.
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
