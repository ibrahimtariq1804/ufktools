"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  RotateCcw,
  Shield,
  HelpCircle,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  PenTool,
  Type,
  Highlighter,
  Square,
  Check,
  Undo2,
  Trash2,
  ChevronLeft,
  MousePointer,
  ZoomIn,
  ZoomOut,
  Palette,
} from "lucide-react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { getPdfJs } from "@/lib/pdf/pdfjs-helper";

interface EditPdfToolProps {
  tool: ToolItem;
}

type EditToolMode = "select" | "text" | "draw" | "highlight" | "rectangle" | "checkmark";

interface TextAnnotation {
  id: string;
  type: "text";
  page: number;
  x: number; // percentage of page width
  y: number; // percentage of page height from top
  text: string;
  fontSize: number;
  color: string; // hex
}

interface DrawStroke {
  id: string;
  type: "draw" | "highlight";
  page: number;
  points: { x: number; y: number }[]; // percentage coordinates
  color: string;
  width: number;
}

interface ShapeAnnotation {
  id: string;
  type: "rectangle" | "checkmark";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

type Annotation = TextAnnotation | DrawStroke | ShapeAnnotation;

const COLORS = [
  { name: "Black", hex: "#0f172a", rgb: [0.06, 0.09, 0.16] },
  { name: "Navy Blue", hex: "#1d4ed8", rgb: [0.11, 0.31, 0.85] },
  { name: "Crimson Red", hex: "#dc2626", rgb: [0.86, 0.15, 0.15] },
  { name: "Emerald Green", hex: "#059669", rgb: [0.02, 0.59, 0.41] },
  { name: "Amber Orange", hex: "#d97706", rgb: [0.85, 0.47, 0.02] },
];

export function EditPdfTool({ tool }: EditPdfToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isLoadingPage, setIsLoadingPage] = useState(false);

  // Editor State
  const [mode, setMode] = useState<EditToolMode>("select");
  const [selectedColor, setSelectedColor] = useState<string>("#1d4ed8");
  const [selectedFontSize, setSelectedFontSize] = useState<number>(16);
  const [selectedStrokeWidth, setSelectedStrokeWidth] = useState<number>(3);

  // Annotations Store
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [currentStroke, setCurrentStroke] = useState<{ x: number; y: number }[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load and render page
  const renderPage = useCallback(
    async (pageIndex: number, file: File, scale: number) => {
      await Promise.resolve();
      setIsLoadingPage(true);
      try {
        const pdfjs = await getPdfJs();
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
        setTotalPages(pdf.numPages);

        const page = await pdf.getPage(pageIndex);
        const viewport = page.getViewport({ scale: 1.5 * scale });

        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            await page.render({ canvasContext: ctx, viewport }).promise;
          }
        }
      } catch (err) {
        console.error("Render error:", err);
        setErrorMessage("Failed to render PDF page.");
      } finally {
        setIsLoadingPage(false);
      }
    },
    []
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith(".pdf")) {
        setErrorMessage("Please select a valid .pdf file.");
        return;
      }
      if (file.size > tool.maxFileSizeMB * 1024 * 1024) {
        setErrorMessage(`File exceeds ${tool.maxFileSizeMB}MB limit.`);
        return;
      }

      setErrorMessage(null);
      setSelectedFile(file);
      setCurrentPage(1);
      setAnnotations([]);
      setDownloadUrl(null);
    },
    [tool.maxFileSizeMB]
  );

  useEffect(() => {
    if (selectedFile) {
      // Synchronize PDF canvas rendering with external PDF.js worker
      // eslint-disable-next-line react-hooks/set-state-in-effect
      renderPage(currentPage, selectedFile, zoomScale);
    }
  }, [currentPage, selectedFile, zoomScale, renderPage]);

  // Page clicking / drawing
  const getRelativeCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = overlayRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) };
  };

  const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const coords = getRelativeCoords(e);

    if (mode === "text") {
      const newId = `text-${Date.now()}`;
      const newAnnotation: TextAnnotation = {
        id: newId,
        type: "text",
        page: currentPage,
        x: coords.x,
        y: coords.y,
        text: "Double-click to edit text",
        fontSize: selectedFontSize,
        color: selectedColor,
      };
      setAnnotations((prev) => [...prev, newAnnotation]);
      setMode("select");
    } else if (mode === "draw" || mode === "highlight") {
      setIsDrawing(true);
      setCurrentStroke([coords]);
    } else if (mode === "rectangle") {
      const newRect: ShapeAnnotation = {
        id: `rect-${Date.now()}`,
        type: "rectangle",
        page: currentPage,
        x: coords.x,
        y: coords.y,
        width: 15,
        height: 8,
        color: selectedColor,
      };
      setAnnotations((prev) => [...prev, newRect]);
      setMode("select");
    } else if (mode === "checkmark") {
      const newCheck: ShapeAnnotation = {
        id: `check-${Date.now()}`,
        type: "checkmark",
        page: currentPage,
        x: coords.x,
        y: coords.y,
        width: 4,
        height: 4,
        color: selectedColor,
      };
      setAnnotations((prev) => [...prev, newCheck]);
      setMode("select");
    }
  };

  const handleOverlayMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing) return;
    const coords = getRelativeCoords(e);
    setCurrentStroke((prev) => [...prev, coords]);
  };

  const handleOverlayMouseUp = () => {
    if (isDrawing && currentStroke.length > 1) {
      const newStroke: DrawStroke = {
        id: `stroke-${Date.now()}`,
        type: mode === "highlight" ? "highlight" : "draw",
        page: currentPage,
        points: currentStroke,
        color: mode === "highlight" ? "#fef08a" : selectedColor,
        width: mode === "highlight" ? 14 : selectedStrokeWidth,
      };
      setAnnotations((prev) => [...prev, newStroke]);
    }
    setIsDrawing(false);
    setCurrentStroke([]);
  };

  const undoLast = () => {
    setAnnotations((prev) => prev.slice(0, -1));
  };

  const clearPageAnnotations = () => {
    if (confirm("Remove all annotations on this page?")) {
      setAnnotations((prev) => prev.filter((a) => a.page !== currentPage));
    }
  };

  // Compile Annotations into PDF via pdf-lib
  const handleExportPdf = async () => {
    if (!selectedFile) return;

    setIsExporting(true);
    setErrorMessage(null);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);

      const hexToRgb = (hex: string) => {
        const cleaned = hex.replace("#", "");
        const num = parseInt(cleaned, 16);
        return rgb(((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255);
      };

      for (const ann of annotations) {
        const pageIndex = ann.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        const page = pages[pageIndex];
        const { width: pWidth, height: pHeight } = page.getSize();

        if (ann.type === "text") {
          const x = (ann.x / 100) * pWidth;
          const y = pHeight - (ann.y / 100) * pHeight - ann.fontSize;
          page.drawText(ann.text, {
            x,
            y,
            size: ann.fontSize,
            font: helvetica,
            color: hexToRgb(ann.color),
          });
        } else if (ann.type === "draw" || ann.type === "highlight") {
          for (let i = 0; i < ann.points.length - 1; i++) {
            const p1 = ann.points[i];
            const p2 = ann.points[i + 1];
            page.drawLine({
              start: { x: (p1.x / 100) * pWidth, y: pHeight - (p1.y / 100) * pHeight },
              end: { x: (p2.x / 100) * pWidth, y: pHeight - (p2.y / 100) * pHeight },
              thickness: ann.width,
              color: hexToRgb(ann.color),
              opacity: ann.type === "highlight" ? 0.35 : 1.0,
            });
          }
        } else if (ann.type === "rectangle") {
          const x = (ann.x / 100) * pWidth;
          const w = (ann.width / 100) * pWidth;
          const h = (ann.height / 100) * pHeight;
          const y = pHeight - (ann.y / 100) * pHeight - h;
          page.drawRectangle({
            x,
            y,
            width: w,
            height: h,
            borderColor: hexToRgb(ann.color),
            borderWidth: 2,
            color: undefined,
          });
        } else if (ann.type === "checkmark") {
          const x = (ann.x / 100) * pWidth;
          const y = pHeight - (ann.y / 100) * pHeight;
          const strokeColor = hexToRgb(ann.color);
          page.drawLine({
            start: { x: x, y: y - 8 },
            end: { x: x + 6, y: y - 14 },
            thickness: 2.5,
            color: strokeColor,
          });
          page.drawLine({
            start: { x: x + 6, y: y - 14 },
            end: { x: x + 16, y: y },
            thickness: 2.5,
            color: strokeColor,
          });
        }
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const filename = selectedFile.name.replace(/\.pdf$/i, "") + "-edited.pdf";

      setDownloadUrl(url);
      setDownloadFilename(filename);
    } catch (err: unknown) {
      console.error("Export error:", err);
      setErrorMessage(
        err instanceof Error ? `Export failed: ${err.message}` : "Failed to export annotated PDF."
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setAnnotations([]);
    setDownloadUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
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
            {category && (
              <>
                <Link href={`/tools#${category.slug}`} className="hover:text-blue-600 transition-colors">
                  {category.name}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </>
            )}
            <span className="font-semibold text-slate-800">{tool.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 mb-3">
            <PenTool className="h-3.5 w-3.5 text-blue-600" />
            <span>Interactive Visual PDF Editor & Annotator</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Edit & Annotate PDF Documents
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Add custom text overlays, draw freehand notes, highlight key sentences, and place shapes or checkmarks onto any PDF. 100% private in-browser.
          </p>
        </div>

        {/* Work Area */}
        <div className="rounded-2xl bg-white shadow-xl border border-slate-200/80 p-6 sm:p-8">
          {downloadUrl ? (
            /* Success State */
            <div className="text-center py-6 max-w-md mx-auto space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">PDF Saved Successfully!</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  All annotations and text overlays have been baked into your new PDF.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Edited PDF</span>
                </a>
                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 text-slate-500" />
                  <span>Edit Another PDF</span>
                </button>
              </div>
            </div>
          ) : !selectedFile ? (
            /* Dropzone */
            <div
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileSelect(e.dataTransfer.files[0]);
                }
              }}
              onDragOver={(e) => e.preventDefault()}
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
                <PenTool className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">
                Drop PDF to Edit & Annotate
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
            /* Interactive Editor */
            <div className="space-y-4">
              {/* Top Controls Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-slate-100 p-3 border border-slate-200">
                {/* Tool Selectors */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setMode("select")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                      mode === "select" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <MousePointer className="h-3.5 w-3.5" />
                    <span>Select</span>
                  </button>

                  <button
                    onClick={() => setMode("text")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                      mode === "text" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Type className="h-3.5 w-3.5" />
                    <span>Add Text</span>
                  </button>

                  <button
                    onClick={() => setMode("draw")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                      mode === "draw" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    <span>Draw</span>
                  </button>

                  <button
                    onClick={() => setMode("highlight")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                      mode === "highlight" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Highlighter className="h-3.5 w-3.5 text-amber-500" />
                    <span>Highlight</span>
                  </button>

                  <button
                    onClick={() => setMode("rectangle")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                      mode === "rectangle" ? "bg-white text-blue-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Square className="h-3.5 w-3.5" />
                    <span>Box</span>
                  </button>

                  <button
                    onClick={() => setMode("checkmark")}
                    className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-all ${
                      mode === "checkmark" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Checkmark</span>
                  </button>
                </div>

                {/* Color and Actions */}
                <div className="flex items-center gap-2">
                  {/* Color Picker */}
                  <div className="flex items-center gap-1">
                    <Palette className="h-3.5 w-3.5 text-slate-400 mr-1" />
                    {COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setSelectedColor(c.hex)}
                        title={c.name}
                        className={`h-5 w-5 rounded-full border-2 transition-transform ${
                          selectedColor === c.hex ? "scale-125 border-blue-600 shadow-sm" : "border-white"
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  {/* Undo & Clear */}
                  <button
                    onClick={undoLast}
                    disabled={annotations.length === 0}
                    className="p-1 rounded-lg text-slate-600 hover:bg-white disabled:opacity-40"
                    title="Undo"
                  >
                    <Undo2 className="h-4 w-4" />
                  </button>

                  <button
                    onClick={clearPageAnnotations}
                    className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
                    title="Clear Page"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Sub-toolbar for Text / Drawing Controls */}
              {mode === "text" && (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700">Text Size:</span>
                  <select
                    value={selectedFontSize}
                    onChange={(e) => setSelectedFontSize(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value={12}>12 px</option>
                    <option value={16}>16 px</option>
                    <option value={20}>20 px</option>
                    <option value={24}>24 px</option>
                    <option value={32}>32 px</option>
                  </select>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">Click anywhere on the document to place text box.</span>
                </div>
              )}

              {mode === "draw" && (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 border border-slate-200 text-xs">
                  <span className="font-semibold text-slate-700">Line Thickness:</span>
                  <select
                    value={selectedStrokeWidth}
                    onChange={(e) => setSelectedStrokeWidth(Number(e.target.value))}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value={2}>Thin (2px)</option>
                    <option value={4}>Medium (4px)</option>
                    <option value={8}>Thick (8px)</option>
                  </select>
                </div>
              )}

              {/* Canvas Viewport Container */}
              <div className="relative mx-auto flex justify-center overflow-auto rounded-2xl border border-slate-200 bg-slate-100/70 p-4 min-h-[450px]">
                {isLoadingPage && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/70 backdrop-blur-xs">
                    <span className="text-xs font-semibold text-slate-600">Rendering page...</span>
                  </div>
                )}

                <div className="relative shadow-lg rounded-lg overflow-hidden bg-white select-none">
                  {/* Underlay PDF Page Canvas */}
                  <canvas ref={canvasRef} className="block" />

                  {/* Interactive Annotation Overlay */}
                  <div
                    ref={overlayRef}
                    onMouseDown={handleOverlayMouseDown}
                    onMouseMove={handleOverlayMouseMove}
                    onMouseUp={handleOverlayMouseUp}
                    className={`absolute inset-0 ${
                      mode === "text"
                        ? "cursor-text"
                        : mode === "draw" || mode === "highlight"
                        ? "cursor-crosshair"
                        : "cursor-default"
                    }`}
                  >
                    {/* Render Annotations on Current Page */}
                    {annotations
                      .filter((ann) => ann.page === currentPage)
                      .map((ann) => {
                        if (ann.type === "text") {
                          return (
                            <div
                              key={ann.id}
                              style={{
                                left: `${ann.x}%`,
                                top: `${ann.y}%`,
                                fontSize: `${ann.fontSize}px`,
                                color: ann.color,
                              }}
                              className="absolute -translate-x-1 -translate-y-1 z-20 group"
                            >
                              <input
                                type="text"
                                value={ann.text}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setAnnotations((prev) =>
                                    prev.map((a) => (a.id === ann.id ? { ...a, text: val } : a))
                                  );
                                }}
                                className="bg-transparent border border-dashed border-slate-300 hover:border-blue-500 focus:border-blue-600 focus:bg-white/80 rounded px-1.5 py-0.5 outline-none font-sans"
                              />
                            </div>
                          );
                        } else if (ann.type === "rectangle") {
                          return (
                            <div
                              key={ann.id}
                              style={{
                                left: `${ann.x}%`,
                                top: `${ann.y}%`,
                                width: `${ann.width}%`,
                                height: `${ann.height}%`,
                                borderColor: ann.color,
                              }}
                              className="absolute border-2 rounded-xs z-10"
                            />
                          );
                        } else if (ann.type === "checkmark") {
                          return (
                            <div
                              key={ann.id}
                              style={{
                                left: `${ann.x}%`,
                                top: `${ann.y}%`,
                                color: ann.color,
                              }}
                              className="absolute font-bold text-xl select-none z-10 leading-none"
                            >
                              ✓
                            </div>
                          );
                        }
                        return null;
                      })}

                    {/* SVG Vector Layer for Freehand and Highlight Strokes */}
                    <svg className="absolute inset-0 h-full w-full pointer-events-none z-10">
                      {annotations
                        .filter((ann) => ann.page === currentPage && (ann.type === "draw" || ann.type === "highlight"))
                        .map((ann) => {
                          const stroke = ann as DrawStroke;
                          if (stroke.points.length < 2) return null;
                          const pathData = stroke.points.reduce(
                            (acc, pt, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${pt.x}% ${pt.y}%`,
                            ""
                          );
                          return (
                            <path
                              key={stroke.id}
                              d={pathData}
                              fill="none"
                              stroke={stroke.color}
                              strokeWidth={stroke.width}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              opacity={stroke.type === "highlight" ? 0.35 : 1.0}
                            />
                          );
                        })}

                      {/* Currently Active Stroke Being Drawn */}
                      {isDrawing && currentStroke.length > 1 && (
                        <path
                          d={currentStroke.reduce(
                            (acc, pt, idx) => `${acc} ${idx === 0 ? "M" : "L"} ${pt.x}% ${pt.y}%`,
                            ""
                          )}
                          fill="none"
                          stroke={mode === "highlight" ? "#fef08a" : selectedColor}
                          strokeWidth={mode === "highlight" ? 14 : selectedStrokeWidth}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          opacity={mode === "highlight" ? 0.35 : 1.0}
                        />
                      )}
                    </svg>
                  </div>
                </div>
              </div>

              {/* Bottom Navigation & Save Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                {/* Page Selector & Zoom */}
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-300 mx-1" />

                  {/* Zoom Controls */}
                  <button
                    onClick={() => setZoomScale((s) => Math.max(0.75, s - 0.25))}
                    className="p-1 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Zoom out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] text-slate-500">{Math.round(zoomScale * 100)}%</span>
                  <button
                    onClick={() => setZoomScale((s) => Math.min(2.0, s + 0.25))}
                    className="p-1 rounded-lg text-slate-600 hover:bg-slate-200"
                    title="Zoom in"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Save Button */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleReset}
                    className="text-xs font-semibold text-slate-600 hover:text-red-600 px-3 py-2"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    <span>{isExporting ? "Compiling PDF..." : `Save & Download PDF (${annotations.length})`}</span>
                  </button>
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3.5">
              <Type className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Custom Text Overlays</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Place custom text annotations anywhere on your document with selectable font sizes and colors.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3.5">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">100% Private in Browser</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              All rendering, drawing, and vector modifications happen strictly on your local computer.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3.5">
              <PenTool className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Freehand & Highlighter</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Highlight key sections or draw freehand ink annotations with smooth vector rendering.
            </p>
          </div>
        </div>

        {/* How-to & FAQ */}
        <div className="mt-12 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span>How to Edit a PDF Document</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  1
                </span>
                <h4 className="text-xs font-bold text-slate-800">Upload PDF</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Drag and drop your PDF to open the interactive editor.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  2
                </span>
                <h4 className="text-xs font-bold text-slate-800">Add Overlays & Marks</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Use the toolbar to type text, draw, highlight, or insert boxes.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  3
                </span>
                <h4 className="text-xs font-bold text-slate-800">Export & Save</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Click Save to bake your annotations into a fresh vector PDF.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
