"use client";

import React, { useState, useRef, useCallback } from "react";
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
  ScanText,
  Copy,
  Check,
  Eye,
  Sparkles,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import Tesseract from "tesseract.js";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { getPdfJs } from "@/lib/pdf/pdfjs-helper";

interface OcrPdfToolProps {
  tool: ToolItem;
}

interface PageOcrResult {
  pageNumber: number;
  text: string;
  confidence: number;
}

export function OcrPdfTool({ tool }: OcrPdfToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Results
  const [results, setResults] = useState<PageOcrResult[]>([]);
  const [downloadPdfUrl, setDownloadPdfUrl] = useState<string | null>(null);
  const [downloadTxtUrl, setDownloadTxtUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [copied, setCopied] = useState(false);
  const [showTextPreview, setShowTextPreview] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid .pdf file.");
      return;
    }
    if (file.size > tool.maxFileSizeMB * 1024 * 1024) {
      setErrorMessage(`File exceeds the ${tool.maxFileSizeMB}MB limit.`);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setResults([]);
    setDownloadPdfUrl(null);
    setDownloadTxtUrl(null);
    setProgress(0);
    setStatusMessage("");
  }, [tool.maxFileSizeMB]);

  const handleRunOcr = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(5);
    setStatusMessage("Initializing PDF rasterizer...");
    setErrorMessage(null);

    try {
      const pdfjs = await getPdfJs();
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
      const totalPages = Math.min(pdf.numPages, 10); // cap at 10 pages for browser performance

      const ocrResults: PageOcrResult[] = [];
      const newPdfDoc = await PDFDocument.create();
      const helvetica = await newPdfDoc.embedFont(StandardFonts.Helvetica);

      for (let i = 1; i <= totalPages; i++) {
        setProgress(Math.round(5 + ((i - 0.5) / totalPages) * 80));
        setStatusMessage(`Rendering page ${i} of ${totalPages}...`);

        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 }); // 2.0 scale for high OCR accuracy

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");

        if (!ctx) throw new Error("Could not create canvas context.");
        await page.render({ canvasContext: ctx, viewport }).promise;

        setStatusMessage(`Running Optical Character Recognition on page ${i}...`);

        // Run Tesseract OCR in WebWorker
        const { data } = await Tesseract.recognize(canvas, "eng", {
          logger: (m) => {
            if (m.status === "recognizing text") {
              const subProgress = Math.round((m.progress || 0) * 100);
              setStatusMessage(`OCR Page ${i}: Recognizing text (${subProgress}%)...`);
            }
          },
        });

        const pageText = data.text || "";
        const confidence = Math.round(data.confidence || 0);

        ocrResults.push({
          pageNumber: i,
          text: pageText,
          confidence,
        });

        // Add page to searchable sandwich PDF
        const pdfPage = newPdfDoc.addPage([viewport.width / 2, viewport.height / 2]);
        const pWidth = viewport.width / 2;
        const pHeight = viewport.height / 2;

        // Embed scan background image
        const imgDataUrl = canvas.toDataURL("image/jpeg", 0.85);
        const imgBase64 = imgDataUrl.split(",")[1];
        const imgBytes = Uint8Array.from(atob(imgBase64), (c) => c.charCodeAt(0));
        const embeddedImg = await newPdfDoc.embedJpg(imgBytes);

        pdfPage.drawImage(embeddedImg, {
          x: 0,
          y: 0,
          width: pWidth,
          height: pHeight,
        });

        // Add invisible searchable text layer over the scan image
        const ocrLines =
          data.blocks?.flatMap((b) => b.paragraphs?.flatMap((p) => p.lines) || []) || [];
        if (ocrLines.length > 0) {
          for (const line of ocrLines) {
            if (!line.text.trim()) continue;
            const bbox = line.bbox;
            if (!bbox) continue;

            const scaleX = 0.5;
            const scaleY = 0.5;
            const x = bbox.x0 * scaleX;
            const y = pHeight - bbox.y1 * scaleY;
            const fontSize = Math.max(8, Math.min(24, (bbox.y1 - bbox.y0) * scaleY * 0.8));

            try {
              pdfPage.drawText(line.text.trim(), {
                x,
                y,
                size: fontSize,
                font: helvetica,
                color: rgb(0, 0, 0),
                opacity: 0.0, // Invisible selectable text layer
              });
            } catch {
              // Ignore non-standard char draw issues
            }
          }
        }
      }

      setProgress(90);
      setStatusMessage("Compiling searchable Sandwich PDF...");

      setResults(ocrResults);

      // Save PDF
      const pdfBytes = await newPdfDoc.save();
      const pdfBlob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const baseName = selectedFile.name.replace(/\.pdf$/i, "");
      setDownloadPdfUrl(pdfUrl);
      setDownloadFilename(`${baseName}_searchable.pdf`);

      // Save TXT
      const fullText = ocrResults
        .map((r) => `--- PAGE ${r.pageNumber} (Confidence: ${r.confidence}%) ---\n\n${r.text}`)
        .join("\n\n");
      const txtBlob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
      const txtUrl = URL.createObjectURL(txtBlob);
      setDownloadTxtUrl(txtUrl);

      setProgress(100);
      setStatusMessage("OCR recognition completed!");
    } catch (err: unknown) {
      console.error("OCR error:", err);
      setErrorMessage(err instanceof Error ? `OCR failed: ${err.message}` : "Failed to process OCR on PDF.");
    } finally {
      setIsProcessing(false);
    }
  };

  const fullExtractedText = results.map((r) => r.text).join("\n\n");
  const avgConfidence =
    results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + r.confidence, 0) / results.length)
      : 0;

  const handleCopyText = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(fullExtractedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResults([]);
    setDownloadPdfUrl(null);
    setDownloadTxtUrl(null);
    setProgress(0);
    setStatusMessage("");
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
            <ScanText className="h-3.5 w-3.5 text-blue-600" />
            <span>Tesseract Neural Optical Character Recognition</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            OCR PDF — Make Scans Searchable
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Convert non-selectable image scans and paper photos into searchable sandwich PDFs with selectable text layers. Extract text with high accuracy.
          </p>
        </div>

        {/* Work Area */}
        <div className="rounded-2xl bg-white shadow-xl border border-slate-200/80 p-6 sm:p-8">
          {downloadPdfUrl ? (
            /* Success State */
            <div className="text-center py-6 max-w-md mx-auto space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">OCR Recognition Complete!</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Selectable text layer generated with {avgConfidence}% average neural confidence.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">{results.length} Pages Processed</span>
                  <span className="font-bold text-emerald-700">{avgConfidence}% Accuracy</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Searchable PDF and plain text formats are both available below.
                </p>
              </div>

              <div className="flex flex-col gap-2.5">
                <a
                  href={downloadPdfUrl}
                  download={downloadFilename}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Searchable PDF</span>
                </a>

                {downloadTxtUrl && (
                  <a
                    href={downloadTxtUrl}
                    download={`${selectedFile?.name.replace(/\.pdf$/i, "")}_ocr.txt`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-2.5 text-xs font-semibold text-slate-700 transition-colors"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-500" />
                    <span>Download Extracted Text (.txt)</span>
                  </a>
                )}

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleCopyText}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span className="text-emerald-600">Copied to Clipboard!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Copy All Text</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setShowTextPreview(!showTextPreview)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{showTextPreview ? "Hide Preview" : "Preview Text"}</span>
                  </button>
                </div>
              </div>

              {showTextPreview && (
                <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs font-mono text-slate-800 whitespace-pre-wrap">
                  {fullExtractedText || "No readable text detected."}
                </div>
              )}

              <button
                onClick={handleReset}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-2.5 text-xs font-semibold text-slate-700 transition-colors"
              >
                <RotateCcw className="h-3.5 w-3.5 text-slate-500" />
                <span>Process Another File</span>
              </button>
            </div>
          ) : (
            /* Upload / Process State */
            <div className="space-y-6">
              {!selectedFile ? (
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
                    <ScanText className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">
                    Drop Scanned PDF for OCR
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Drag and drop your scan or photo PDF here, or click to browse
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF format up to {tool.maxFileSizeMB}MB</span>
                  </div>
                </div>
              ) : (
                /* File Selected & Progress */
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{selectedFile.name}</h4>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for OCR processing
                        </p>
                      </div>
                    </div>

                    {!isProcessing && (
                      <button
                        onClick={handleReset}
                        className="text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors"
                      >
                        Change File
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {isProcessing && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                          <span>{statusMessage}</span>
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-xs text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span>Client-side WebWorker OCR. Zero cloud uploads.</span>
                    </div>

                    <button
                      onClick={handleRunOcr}
                      disabled={isProcessing}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 px-7 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                    >
                      <ScanText className="h-4 w-4" />
                      <span>{isProcessing ? "Processing OCR..." : "Start OCR Recognition"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3.5">
              <ScanText className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Sandwich PDF Generation</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Creates dual-layer PDFs that preserve original scan fidelity while embedding invisible selectable text for keyword searching (Ctrl+F).
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3.5">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">100% In-Browser Privacy</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Tesseract WebWorker executes locally in your browser. Document scans never travel over the internet.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3.5">
              <Copy className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Direct Text Export</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Copy extracted text directly with one click or download formatted `.txt` files for quick archiving and analysis.
            </p>
          </div>
        </div>

        {/* How-to & FAQ */}
        <div className="mt-12 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span>How to Make a Scanned PDF Searchable</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  1
                </span>
                <h4 className="text-xs font-bold text-slate-800">Upload Scan</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Select your scanned paper document or photo PDF.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  2
                </span>
                <h4 className="text-xs font-bold text-slate-800">Run Neural OCR</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Tesseract scans character forms and maps letter bounding boxes.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  3
                </span>
                <h4 className="text-xs font-bold text-slate-800">Download Result</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Save your searchable PDF and search or copy text freely.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
