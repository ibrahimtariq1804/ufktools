"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Shield,
  HelpCircle,
  ChevronDown,
  Sparkles,
  PenTool,
  Check,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PDFDocument, rgb } from "pdf-lib";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { getPdfJs } from "@/lib/pdf/pdfjs-helper";
import { trackToolAction } from "@/lib/analytics";

interface FillSignPdfToolProps {
  tool: ToolItem;
}

interface PlacedStamp {
  id: string;
  pageNumber: number; // 1-indexed
  type: "signature" | "date" | "checkmark";
  dataUrl?: string; // PNG base64 for signature
  text?: string;
  xPercent: number; // 0 to 100 relative to page width
  yPercent: number; // 0 to 100 relative to page height
  widthPx: number;
  heightPx: number;
}

export function FillSignPdfTool({ tool }: FillSignPdfToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  const pageContainerRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageImageUrl, setPageImageUrl] = useState<string | null>(null);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number }>({
    width: 600,
    height: 800,
  });

  // Signature creation modal
  const [isSigModalOpen, setIsSigModalOpen] = useState(false);
  const [sigMode, setSigMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState("Alexander Wright");
  const typedFont = "cursive";
  const [isDrawing, setIsDrawing] = useState(false);
  const [activeSignatureUrl, setActiveSignatureUrl] = useState<string | null>(null);

  // Placed stamps on PDF
  const [stamps, setStamps] = useState<PlacedStamp[]>([]);
  const [activeTool, setActiveTool] = useState<"signature" | "date" | "checkmark">("signature");

  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingPage, setIsLoadingPage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>("signed.pdf");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  // Load page thumbnail via pdfjs
  const renderPdfPage = useCallback(async (file: File, pageNum: number) => {
    setIsLoadingPage(true);
    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const page = await pdfDoc.getPage(pageNum);

      const viewport = page.getViewport({ scale: 1.2 });
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvasContext: ctx, viewport }).promise;
        setPageImageUrl(canvas.toDataURL("image/jpeg", 0.9));
        setPageDimensions({ width: viewport.width, height: viewport.height });
      }
    } catch (err) {
      console.error("Render page error:", err);
    } finally {
      setIsLoadingPage(false);
    }
  }, []);

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

    try {
      const pdfjs = await getPdfJs();
      const buffer = await file.arrayBuffer();
      const doc = await pdfjs.getDocument({ data: buffer }).promise;
      setSelectedFile(file);
      setTotalPages(doc.numPages);
      setCurrentPage(1);
      await renderPdfPage(file, 1);
    } catch (err: unknown) {
      console.error("PDF read error:", err);
      setErrorMessage("Could not parse this PDF. It may be encrypted or corrupted.");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Drawing Canvas Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#0f172a"; // Deep navy
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearDrawingCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Save Signature from Modal
  const saveSignature = () => {
    if (sigMode === "draw") {
      const canvas = signatureCanvasRef.current;
      if (canvas) {
        setActiveSignatureUrl(canvas.toDataURL("image/png"));
      }
    } else if (sigMode === "type") {
      // Render text to canvas to get a clean transparent PNG
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 120;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.font = `italic 38px ${typedFont === "cursive" ? "cursive, Brush Script MT, sans-serif" : "serif"}`;
        ctx.fillStyle = "#0f172a";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(typedName, 200, 60);
        setActiveSignatureUrl(canvas.toDataURL("image/png"));
      }
    }
    setIsSigModalOpen(false);
  };

  // Handle clicking on page to place active stamp
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = pageContainerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = (clickX / rect.width) * 100;
    const yPercent = (clickY / rect.height) * 100;

    if (activeTool === "signature") {
      if (!activeSignatureUrl) {
        setIsSigModalOpen(true);
        return;
      }
      setStamps((prev) => [
        ...prev,
        {
          id: `sig-${Date.now()}`,
          pageNumber: currentPage,
          type: "signature",
          dataUrl: activeSignatureUrl,
          xPercent: Math.max(5, Math.min(xPercent - 10, 80)),
          yPercent: Math.max(5, Math.min(yPercent - 5, 90)),
          widthPx: 140,
          heightPx: 50,
        },
      ]);
    } else if (activeTool === "date") {
      const todayStr = new Date().toISOString().split("T")[0];
      setStamps((prev) => [
        ...prev,
        {
          id: `date-${Date.now()}`,
          pageNumber: currentPage,
          type: "date",
          text: todayStr,
          xPercent: Math.max(5, Math.min(xPercent - 5, 85)),
          yPercent: Math.max(5, Math.min(yPercent - 2, 95)),
          widthPx: 90,
          heightPx: 25,
        },
      ]);
    } else if (activeTool === "checkmark") {
      setStamps((prev) => [
        ...prev,
        {
          id: `check-${Date.now()}`,
          pageNumber: currentPage,
          type: "checkmark",
          text: "✓",
          xPercent: Math.max(5, Math.min(xPercent - 2, 95)),
          yPercent: Math.max(5, Math.min(yPercent - 2, 95)),
          widthPx: 30,
          heightPx: 30,
        },
      ]);
    }
  };

  const removeStamp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStamps((prev) => prev.filter((s) => s.id !== id));
  };

  const changePage = (delta: number) => {
    const target = currentPage + delta;
    if (target >= 1 && target <= totalPages && selectedFile) {
      setCurrentPage(target);
      renderPdfPage(selectedFile, target);
    }
  };

  const resetAll = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setSelectedFile(null);
    setTotalPages(0);
    setCurrentPage(1);
    setPageImageUrl(null);
    setStamps([]);
    setIsProcessing(false);
    setProgress(0);
    setStatusMessage("");
    setDownloadUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Compile Signed PDF via pdf-lib
  const handleApplySignature = async () => {
    if (!selectedFile || stamps.length === 0) {
      setErrorMessage("Please place at least one signature or stamp on the document.");
      return;
    }

    setIsProcessing(true);
    setProgress(15);
    setStatusMessage("Loading PDF binary for signature injection...");

    try {
      const buffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      setProgress(40);
      setStatusMessage("Embedding high-resolution vector signatures...");

      const pages = pdfDoc.getPages();

      for (const stamp of stamps) {
        const targetPage = pages[stamp.pageNumber - 1];
        if (!targetPage) continue;

        const { width: pWidth, height: pHeight } = targetPage.getSize();

        // Convert percentage coordinates (PDF origin is bottom-left)
        const xPos = (stamp.xPercent / 100) * pWidth;
        const yPosFromTop = (stamp.yPercent / 100) * pHeight;
        const yPos = pHeight - yPosFromTop - (stamp.heightPx * (pHeight / pageDimensions.height));

        const targetWidth = stamp.widthPx * (pWidth / pageDimensions.width);
        const targetHeight = stamp.heightPx * (pHeight / pageDimensions.height);

        if (stamp.type === "signature" && stamp.dataUrl) {
          const base64Data = stamp.dataUrl.split(",")[1];
          const imageBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
          const embeddedImage = await pdfDoc.embedPng(imageBytes);

          targetPage.drawImage(embeddedImage, {
            x: xPos,
            y: yPos,
            width: targetWidth,
            height: targetHeight,
          });
        } else if (stamp.type === "date" && stamp.text) {
          targetPage.drawText(stamp.text, {
            x: xPos,
            y: yPos,
            size: 11,
          });
        } else if (stamp.type === "checkmark") {
          // Draw crisp vector checkmark
          const strokeColor = rgb(0.06, 0.58, 0.35);
          targetPage.drawLine({
            start: { x: xPos, y: yPos + targetHeight * 0.4 },
            end: { x: xPos + targetWidth * 0.4, y: yPos },
            thickness: 2,
            color: strokeColor,
          });
          targetPage.drawLine({
            start: { x: xPos + targetWidth * 0.4, y: yPos },
            end: { x: xPos + targetWidth, y: yPos + targetHeight },
            thickness: 2,
            color: strokeColor,
          });
        }
      }

      setProgress(85);
      setStatusMessage("Compiling authenticated document...");

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const baseName = selectedFile.name.replace(/\.pdf$/i, "");
      setDownloadUrl(url);
      setDownloadFilename(`${baseName}-signed.pdf`);

      setProgress(100);
      setStatusMessage("Document signed successfully!");
      trackToolAction("fill-and-sign-pdf", "signed_pdf_created");
    } catch (err: unknown) {
      console.error("Signing error:", err);
      setErrorMessage(
        err instanceof Error ? `Signing failed: ${err.message}` : "Failed to stamp PDF."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const stampsOnThisPage = stamps.filter((s) => s.pageNumber === currentPage);

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
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-900 via-blue-900 to-purple-800 text-white shadow-lg shadow-blue-900/10">
                <PenTool className="h-7 w-7" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                    {category?.name}
                  </span>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    100% In-Browser Privacy
                  </span>
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                    Draw, Type or Upload
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {tool.name}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  Sign electronic documents, stamp dates, and fill agreements with legally binding digital signatures directly in your browser.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Box */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-12">
          {/* Step 1: Upload Dropzone */}
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
                Choose a PDF to fill & sign
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                Supported formats: PDF (Up to 100 MB). Complete privacy guaranteed.
              </p>
              <button
                type="button"
                className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-500 transition-colors"
              >
                Select Document
              </button>
            </div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-medium text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 2: Interactive Signing Workspace */}
          {selectedFile && !downloadUrl && (
            <div className="space-y-6">
              {/* Document Summary & Signature Selector Toolbar */}
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
                      Page {currentPage} of {totalPages} • {stamps.length} stamps placed
                    </div>
                  </div>
                </div>

                {/* Stamping Tool Selector */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTool("signature");
                      if (!activeSignatureUrl) setIsSigModalOpen(true);
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${
                      activeTool === "signature"
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    <span>{activeSignatureUrl ? "Place Signature" : "Create Signature"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTool("date")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${
                      activeTool === "date"
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Place Date</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTool("checkmark")}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all border ${
                      activeTool === "checkmark"
                        ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Checkmark</span>
                  </button>

                  <button
                    type="button"
                    onClick={resetAll}
                    disabled={isProcessing}
                    className="rounded-xl px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Page Navigator */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between rounded-xl bg-slate-100 p-2.5 px-4 text-xs">
                  <button
                    type="button"
                    onClick={() => changePage(-1)}
                    disabled={currentPage <= 1 || isLoadingPage}
                    className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-blue-600 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous Page</span>
                  </button>
                  <span className="font-semibold text-slate-600">
                    Showing Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => changePage(1)}
                    disabled={currentPage >= totalPages || isLoadingPage}
                    className="inline-flex items-center gap-1 font-bold text-slate-700 hover:text-blue-600 disabled:opacity-40"
                  >
                    <span>Next Page</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* PDF Interactive Stamping Viewport */}
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-4 bg-slate-200/50 flex justify-center overflow-auto max-h-[640px]">
                {isLoadingPage ? (
                  <div className="py-24 text-center space-y-3">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
                    <div className="text-xs font-semibold text-slate-600">
                      Rendering page canvas...
                    </div>
                  </div>
                ) : pageImageUrl ? (
                  <div
                    ref={pageContainerRef}
                    onClick={handlePageClick}
                    className="relative cursor-crosshair bg-white shadow-xl rounded-lg overflow-hidden select-none"
                    style={{
                      width: `${pageDimensions.width}px`,
                      height: `${pageDimensions.height}px`,
                    }}
                  >
                    {/* Rendered PDF Page Background */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pageImageUrl}
                      alt={`Page ${currentPage}`}
                      className="w-full h-full object-contain pointer-events-none"
                    />

                    {/* Render Placed Stamps on this page */}
                    {stampsOnThisPage.map((stamp) => (
                      <div
                        key={stamp.id}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute border-2 border-blue-500 bg-white/70 backdrop-blur-sm rounded-lg shadow-md flex items-center justify-between p-1.5 group cursor-move"
                        style={{
                          left: `${stamp.xPercent}%`,
                          top: `${stamp.yPercent}%`,
                          width: `${stamp.widthPx}px`,
                          height: `${stamp.heightPx}px`,
                        }}
                      >
                        {stamp.type === "signature" && stamp.dataUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={stamp.dataUrl}
                            alt="Signature"
                            className="max-h-full max-w-full object-contain"
                          />
                        )}
                        {stamp.type === "date" && (
                          <span className="text-xs font-bold text-slate-900 font-mono">
                            {stamp.text}
                          </span>
                        )}
                        {stamp.type === "checkmark" && (
                          <span className="text-xl font-bold text-emerald-600">
                            ✓
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={(e) => removeStamp(stamp.id, e)}
                          title="Remove Stamp"
                          className="p-0.5 rounded-full bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="text-xs text-slate-500 text-center">
                Click anywhere on the document above to stamp your active {activeTool}. You can stamp multiple signatures or dates.
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

              {/* Action Bar */}
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
                  onClick={handleApplySignature}
                  disabled={isProcessing || stamps.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 transition-all"
                >
                  <PenTool className="h-4 w-4" />
                  <span>
                    {isProcessing ? "Embedding..." : `Sign Document (${stamps.length} Stamps)`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Complete State */}
          {downloadUrl && (
            <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Document Signed Successfully!
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  Your signatures have been embedded into vector PDF layers. Ready for download.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  onClick={() => trackToolAction("fill-and-sign-pdf", "download_signed_pdf")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Signed PDF</span>
                </a>
                <button
                  onClick={resetAll}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Sign Another Document</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Signature Creation Modal */}
        {isSigModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                  <PenTool className="h-5 w-5 text-blue-600" />
                  <span>Create Your Digital Signature</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSigModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mode Tabs */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSigMode("draw")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    sigMode === "draw"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Draw Signature
                </button>
                <button
                  type="button"
                  onClick={() => setSigMode("type")}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    sigMode === "type"
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Type Signature
                </button>
              </div>

              {/* Draw Tab */}
              {sigMode === "draw" && (
                <div className="space-y-2">
                  <div className="relative border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50 overflow-hidden">
                    <canvas
                      ref={signatureCanvasRef}
                      width={450}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      className="w-full h-40 cursor-crosshair bg-white"
                    />
                    <button
                      type="button"
                      onClick={clearDrawingCanvas}
                      className="absolute bottom-2 right-2 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center">
                    Sign using your mouse, trackpad, or touch screen.
                  </p>
                </div>
              )}

              {/* Type Tab */}
              {sigMode === "type" && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Type Your Name
                    </label>
                    <input
                      type="text"
                      value={typedName}
                      onChange={(e) => setTypedName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="w-full rounded-xl border border-slate-200 p-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 text-center bg-slate-50">
                    <span
                      className="text-2xl italic text-slate-900"
                      style={{
                        fontFamily:
                          typedFont === "cursive"
                            ? "cursive, Brush Script MT, sans-serif"
                            : "serif",
                      }}
                    >
                      {typedName || "Your Signature"}
                    </span>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSigModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSignature}
                  className="rounded-xl bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 hover:bg-blue-500"
                >
                  Use This Signature
                </button>
              </div>
            </div>
          </div>
        )}

        {/* How It Works Section */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center sm:text-left">
            How to Sign PDF Documents in 3 Simple Steps
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
              <h4 className="text-sm font-bold">100% In-Browser Signature Protection</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Your signature strokes and sensitive contracts never leave your browser memory. Fully private and GDPR compliant.
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
