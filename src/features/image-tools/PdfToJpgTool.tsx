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
  Shield,
  Images,
  Archive,
  HelpCircle,
  ChevronDown,
  Sparkles,
  Sliders,
  CheckSquare,
  Square,
} from "lucide-react";
import JSZip from "jszip";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { getPdfJs } from "@/lib/pdf/pdfjs-helper";
import { trackToolAction } from "@/lib/analytics";

interface PdfToJpgToolProps {
  tool: ToolItem;
}

interface PagePreview {
  pageNumber: number;
  thumbnailUrl: string;
  selected: boolean;
  width: number;
  height: number;
}

export function PdfToJpgTool({ tool }: PdfToJpgToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pages, setPages] = useState<PagePreview[]>([]);
  const [format, setFormat] = useState<"jpeg" | "png">("jpeg");
  const [renderScale, setRenderScale] = useState<number>(1.5); // 1.5x crisp balance
  const [imageQuality, setImageQuality] = useState<number>(0.92);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>("converted.zip");
  const [downloadStats, setDownloadStats] = useState<{ count: number; format: string } | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Clean up object URLs on unmount or reset
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
    setStatusMessage("Analyzing PDF pages...");

    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdfDoc = await loadingTask.promise;
      const count = pdfDoc.numPages;

      setTotalPages(count);
      setSelectedFile(file);

      // Render low-res thumbnails for quick preview
      const previewItems: PagePreview[] = [];
      const thumbScale = 0.35; // lightweight thumbnail scale

      for (let i = 1; i <= count; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: thumbScale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          // Fill white background for PDF page rendering
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvasContext: ctx,
            viewport,
          }).promise;

          previewItems.push({
            pageNumber: i,
            thumbnailUrl: canvas.toDataURL("image/jpeg", 0.7),
            selected: true,
            width: viewport.width,
            height: viewport.height,
          });
        }
      }

      setPages(previewItems);
    } catch (err: unknown) {
      console.error("PDF preview error:", err);
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

  const togglePageSelect = (pageNumber: number) => {
    setPages((prev) =>
      prev.map((p) =>
        p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p
      )
    );
  };

  const selectAll = (select: boolean) => {
    setPages((prev) => prev.map((p) => ({ ...p, selected: select })));
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

  const handleConvert = async () => {
    const selectedPages = pages.filter((p) => p.selected);
    if (!selectedFile || selectedPages.length === 0) {
      setErrorMessage("Please select at least one page to convert.");
      return;
    }

    setIsProcessing(true);
    setProgress(5);
    setStatusMessage("Initializing high-resolution renderer...");

    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;

      const baseName = selectedFile.name.replace(/\.pdf$/i, "");
      const mimeType = format === "jpeg" ? "image/jpeg" : "image/png";
      const fileExt = format === "jpeg" ? "jpg" : "png";

      if (selectedPages.length === 1) {
        // Single page export
        const pageNum = selectedPages[0].pageNumber;
        setStatusMessage(`Rendering page ${pageNum}...`);
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          await page.render({ canvasContext: ctx, viewport }).promise;
        }

        setProgress(90);
        setStatusMessage("Generating final image blob...");

        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), mimeType, imageQuality)
        );

        if (!blob) throw new Error("Canvas rendering failed");

        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setDownloadFilename(`${baseName}-page-${pageNum}.${fileExt}`);
        setDownloadStats({ count: 1, format: fileExt.toUpperCase() });
      } else {
        // Multiple pages -> ZIP
        const zip = new JSZip();
        const total = selectedPages.length;

        for (let i = 0; i < total; i++) {
          const pageNum = selectedPages[i].pageNumber;
          const currentProgress = Math.round(10 + (i / total) * 75);
          setProgress(currentProgress);
          setStatusMessage(`Rendering page ${pageNum} (${i + 1} of ${total})...`);

          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale: renderScale });
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (ctx) {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport }).promise;
          }

          const blob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), mimeType, imageQuality)
          );

          if (blob) {
            const paddedNum = String(pageNum).padStart(3, "0");
            zip.file(`${baseName}-page-${paddedNum}.${fileExt}`, blob);
          }
        }

        setProgress(90);
        setStatusMessage("Compressing images into high-speed ZIP archive...");

        const zipBlob = await zip.generateAsync({
          type: "blob",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        const url = URL.createObjectURL(zipBlob);
        setDownloadUrl(url);
        setDownloadFilename(`${baseName}-images.zip`);
        setDownloadStats({ count: total, format: fileExt.toUpperCase() });
      }

      setProgress(100);
      setStatusMessage("Conversion complete!");
      trackToolAction("pdf-to-jpg", "convert_pdf_to_images");
    } catch (err: unknown) {
      console.error("Conversion error:", err);
      setErrorMessage(
        err instanceof Error
          ? `Conversion failed: ${err.message}`
          : "An error occurred while converting pages."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCount = pages.filter((p) => p.selected).length;

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
            {category?.name || "Image & File Tools"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Tool Header Card */}
        <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-sm border border-slate-200/80 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-cyan-700 text-white shadow-lg shadow-blue-900/10">
                <Images className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {category?.name}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    100% Client-Side Privacy
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                    High-Res Canvas Engine
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {tool.name}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  Extract individual PDF pages into razor-sharp JPG or lossless PNG images directly inside your browser. No files are ever sent to an external server.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Processing Box */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-12">
          {/* Step 1: Dropzone when no file selected */}
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
                Fast, secure in-browser rasterization. Maximum file size: 100 MB.
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

          {/* Step 2: Configuration & Page Selection */}
          {selectedFile && !isLoadingDoc && !downloadUrl && (
            <div className="space-y-8">
              {/* Document Summary Bar */}
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
                      {totalPages} {totalPages === 1 ? "page" : "pages"} • {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>

                <button
                  onClick={resetAll}
                  disabled={isProcessing}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
                >
                  Choose Different File
                </button>
              </div>

              {/* Conversion Settings Controls */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <Sliders className="h-4 w-4 text-blue-600" />
                  <span>Output Settings</span>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Format Selector */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Image Format
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormat("jpeg")}
                        className={`rounded-xl py-2 text-xs font-bold transition-all border ${
                          format === "jpeg"
                            ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        JPG (Smallest)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormat("png")}
                        className={`rounded-xl py-2 text-xs font-bold transition-all border ${
                          format === "png"
                            ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        PNG (Lossless)
                      </button>
                    </div>
                  </div>

                  {/* Render Resolution Scale */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Resolution / DPI Scale
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { scale: 1.0, label: "1x (Normal)" },
                        { scale: 1.5, label: "1.5x (Crisp)" },
                        { scale: 2.0, label: "2x (Ultra)" },
                      ].map((item) => (
                        <button
                          key={item.scale}
                          type="button"
                          onClick={() => setRenderScale(item.scale)}
                          className={`rounded-xl py-2 text-[11px] font-bold transition-all border ${
                            renderScale === item.scale
                              ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                              : "border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* JPG Quality */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                      Quality: {Math.round(imageQuality * 100)}%
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1.0"
                      step="0.05"
                      disabled={format === "png"}
                      value={imageQuality}
                      onChange={(e) => setImageQuality(parseFloat(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer disabled:opacity-40 mt-2"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>Standard</span>
                      <span>Maximum</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Page Selection Bar */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Select Pages to Convert ({selectedCount} of {totalPages} selected)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Click thumbnails to include or exclude pages from output.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => selectAll(true)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <CheckSquare className="h-3.5 w-3.5 text-blue-600" />
                      <span>Select All</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => selectAll(false)}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      <Square className="h-3.5 w-3.5 text-slate-400" />
                      <span>Deselect All</span>
                    </button>
                  </div>
                </div>

                {/* Page Thumbnails Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[460px] overflow-y-auto p-2 border border-slate-100 rounded-2xl bg-slate-50/50">
                  {pages.map((p) => (
                    <div
                      key={p.pageNumber}
                      onClick={() => togglePageSelect(p.pageNumber)}
                      className={`relative cursor-pointer rounded-xl border-2 p-2 bg-white transition-all shadow-sm group ${
                        p.selected
                          ? "border-blue-600 ring-2 ring-blue-500/20"
                          : "border-slate-200 opacity-60 hover:opacity-90"
                      }`}
                    >
                      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-lg bg-slate-100 flex items-center justify-center">
                        {p.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.thumbnailUrl}
                            alt={`Page ${p.pageNumber}`}
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">
                            Page {p.pageNumber}
                          </span>
                        )}
                        <div
                          className={`absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-white text-[11px] font-bold shadow ${
                            p.selected ? "bg-blue-600" : "bg-slate-400/80"
                          }`}
                        >
                          {p.selected ? "✓" : ""}
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs px-1">
                        <span className="font-bold text-slate-700">
                          Page {p.pageNumber}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {p.selected ? "Selected" : "Skip"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Progress Indicator */}
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

              {/* Convert Action Bar */}
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
                  onClick={handleConvert}
                  disabled={isProcessing || selectedCount === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 transition-all"
                >
                  <Images className="h-4 w-4" />
                  <span>
                    {isProcessing
                      ? "Converting..."
                      : `Convert ${selectedCount} ${selectedCount === 1 ? "Page" : "Pages"} to ${format.toUpperCase()}`}
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
                  Rasterization Complete!
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  Successfully converted {downloadStats?.count} {downloadStats?.count === 1 ? "page" : "pages"} into crisp {downloadStats?.format} format.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  onClick={() => trackToolAction("pdf-to-jpg", "download_converted_images")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all"
                >
                  {downloadStats && downloadStats.count > 1 ? (
                    <Archive className="h-4 w-4" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>
                    Download {downloadStats && downloadStats.count > 1 ? "ZIP Archive" : "Image"} ({downloadFilename})
                  </span>
                </a>
                <button
                  onClick={resetAll}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Convert Another PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center sm:text-left">
            How to Convert PDF to Images in 3 Simple Steps
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
              <h4 className="text-sm font-bold">Guaranteed Client-Side Processing</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Every page is rendered to pixels locally on your GPU/CPU using HTML5 Canvas. Your sensitive documents never leave your browser.
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
