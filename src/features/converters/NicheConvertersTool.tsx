"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Download,
  RotateCcw,
  Shield,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Boxes,
  Code2,
  FileCode,
  Image as ImageIcon,
  Table,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolItem, CATEGORIES } from "@/config/tools.config";

interface NicheConvertersToolProps {
  tool: ToolItem;
}

type NicheFormat = "markdown-pdf" | "text-pdf" | "svg-png" | "json-csv";

export function NicheConvertersTool({ tool }: NicheConvertersToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeFormat, setActiveFormat] = useState<NicheFormat>("markdown-pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [textInput, setTextInput] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");

  const handleFileSelect = useCallback((file: File) => {
    setErrorMessage(null);
    setSelectedFile(file);
    setDownloadUrl(null);

    // Read file text if text-based
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setTextInput(content || "");
    };
    reader.readAsText(file);
  }, []);

  const handleConvert = async () => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      if (activeFormat === "markdown-pdf" || activeFormat === "text-pdf") {
        const text = textInput || (selectedFile ? await selectedFile.text() : "");
        if (!text.trim()) {
          throw new Error("Please provide some text or upload a file first.");
        }

        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

        const lines = text.split("\n");
        let currentPage = pdfDoc.addPage([595.28, 841.89]); // A4
        let yPos = 800;
        const marginX = 50;

        const checkNewPage = (neededHeight: number) => {
          if (yPos - neededHeight < 50) {
            currentPage = pdfDoc.addPage([595.28, 841.89]);
            yPos = 800;
          }
        };

        for (const line of lines) {
          const trimmed = line.trim();

          if (activeFormat === "markdown-pdf") {
            if (trimmed.startsWith("# ")) {
              checkNewPage(35);
              currentPage.drawText(trimmed.replace(/^#\s+/, ""), {
                x: marginX,
                y: yPos,
                size: 18,
                font: fontBold,
                color: rgb(0.06, 0.09, 0.16),
              });
              yPos -= 28;
            } else if (trimmed.startsWith("## ")) {
              checkNewPage(28);
              currentPage.drawText(trimmed.replace(/^##\s+/, ""), {
                x: marginX,
                y: yPos,
                size: 14,
                font: fontBold,
                color: rgb(0.12, 0.16, 0.22),
              });
              yPos -= 22;
            } else if (trimmed.startsWith("### ")) {
              checkNewPage(24);
              currentPage.drawText(trimmed.replace(/^###\s+/, ""), {
                x: marginX,
                y: yPos,
                size: 12,
                font: fontBold,
                color: rgb(0.2, 0.25, 0.3),
              });
              yPos -= 18;
            } else if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
              checkNewPage(18);
              currentPage.drawText(`•  ${trimmed.replace(/^[-*]\s+/, "")}`, {
                x: marginX + 15,
                y: yPos,
                size: 10,
                font: font,
                color: rgb(0.15, 0.2, 0.25),
              });
              yPos -= 16;
            } else if (trimmed.startsWith("```")) {
              // Code block delimiter
              yPos -= 6;
            } else if (trimmed === "") {
              yPos -= 10;
            } else {
              // Regular paragraph line with word wrap simulation
              checkNewPage(18);
              currentPage.drawText(trimmed.slice(0, 95), {
                x: marginX,
                y: yPos,
                size: 10,
                font: font,
                color: rgb(0.15, 0.2, 0.25),
              });
              yPos -= 16;
            }
          } else {
            // Text to PDF (Monospace)
            checkNewPage(16);
            if (trimmed) {
              currentPage.drawText(line.slice(0, 90), {
                x: marginX,
                y: yPos,
                size: 9.5,
                font: fontMono,
                color: rgb(0.1, 0.1, 0.1),
              });
            }
            yPos -= 14;
          }
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const name = (selectedFile?.name.replace(/\.[^/.]+$/, "") || "document") + ".pdf";

        setDownloadUrl(url);
        setDownloadFilename(name);
      } else if (activeFormat === "svg-png") {
        const svgContent = textInput || (selectedFile ? await selectedFile.text() : "");
        if (!svgContent.trim() || !svgContent.includes("<svg")) {
          throw new Error("Please upload or paste a valid SVG image string.");
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        const svgBlob = new Blob([svgContent], { type: "image/svg+xml;charset=utf-8" });
        const svgUrl = URL.createObjectURL(svgBlob);

        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            canvas.width = img.width || 800;
            canvas.height = img.height || 600;
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0);
            }
            URL.revokeObjectURL(svgUrl);
            resolve();
          };
          img.onerror = () => {
            URL.revokeObjectURL(svgUrl);
            reject(new Error("Failed to render SVG onto canvas."));
          };
          img.src = svgUrl;
        });

        const pngDataUrl = canvas.toDataURL("image/png");
        const blob = await (await fetch(pngDataUrl)).blob();
        const url = URL.createObjectURL(blob);
        const name = (selectedFile?.name.replace(/\.svg$/i, "") || "vector") + ".png";

        setDownloadUrl(url);
        setDownloadFilename(name);
      } else if (activeFormat === "json-csv") {
        const content = textInput || (selectedFile ? await selectedFile.text() : "");
        if (!content.trim()) throw new Error("Please provide JSON or CSV data.");

        if (content.trim().startsWith("{") || content.trim().startsWith("[")) {
          // JSON to CSV
          const parsed = JSON.parse(content);
          const array = Array.isArray(parsed) ? parsed : [parsed];
          if (array.length === 0) throw new Error("JSON array is empty.");

          const headers = Object.keys(array[0]);
          const csvRows = [headers.join(",")];

          for (const item of array) {
            const vals = headers.map((h) => {
              const v = item[h] !== undefined && item[h] !== null ? String(item[h]) : "";
              return `"${v.replace(/"/g, '""')}"`;
            });
            csvRows.push(vals.join(","));
          }

          const csvBlob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8" });
          const url = URL.createObjectURL(csvBlob);
          setDownloadUrl(url);
          setDownloadFilename((selectedFile?.name.replace(/\.json$/i, "") || "data") + ".csv");
        } else {
          // CSV to JSON
          const lines = content.trim().split("\n");
          if (lines.length < 2) throw new Error("CSV requires at least a header row and 1 data row.");

          const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
          const jsonArray = [];

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            const vals = line.split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
            const obj: Record<string, string> = {};
            headers.forEach((h, idx) => {
              obj[h] = vals[idx] || "";
            });
            jsonArray.push(obj);
          }

          const jsonBlob = new Blob([JSON.stringify(jsonArray, null, 2)], {
            type: "application/json;charset=utf-8",
          });
          const url = URL.createObjectURL(jsonBlob);
          setDownloadUrl(url);
          setDownloadFilename((selectedFile?.name.replace(/\.csv$/i, "") || "data") + ".json");
        }
      }
    } catch (err: unknown) {
      console.error("Niche conversion error:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to convert niche format."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setTextInput("");
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
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200 mb-3">
            <Boxes className="h-3.5 w-3.5 text-amber-600" />
            <span>Multi-Format Developer & Specialist Tools</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Niche Format Document Converters
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Convert Markdown, plain text, SVG vectors, JSON, and CSV data into clean, universal formats. 100% in-browser processing.
          </p>
        </div>

        {/* Format Selector Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => {
              setActiveFormat("markdown-pdf");
              handleReset();
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeFormat === "markdown-pdf"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Code2 className="h-4 w-4" />
            <span>Markdown (.md) → PDF</span>
          </button>

          <button
            onClick={() => {
              setActiveFormat("text-pdf");
              handleReset();
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeFormat === "text-pdf"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <FileCode className="h-4 w-4" />
            <span>Text (.txt) → PDF</span>
          </button>

          <button
            onClick={() => {
              setActiveFormat("svg-png");
              handleReset();
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeFormat === "svg-png"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            <span>SVG Vector → PNG</span>
          </button>

          <button
            onClick={() => {
              setActiveFormat("json-csv");
              handleReset();
            }}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
              activeFormat === "json-csv"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            <Table className="h-4 w-4" />
            <span>JSON ↔ CSV</span>
          </button>
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
                <h2 className="text-xl font-extrabold text-slate-900">Converted Successfully!</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Your document has been transformed and is ready for download.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download {downloadFilename}</span>
                </a>

                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 text-slate-500" />
                  <span>Convert Another File</span>
                </button>
              </div>
            </div>
          ) : (
            /* Input & Upload State */
            <div className="space-y-6">
              {/* File Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 p-6 text-center transition-all"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-xs border border-slate-200 group-hover:scale-110 transition-transform">
                  <Boxes className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-slate-900">
                  {selectedFile ? selectedFile.name : "Upload File or Drag & Drop"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click to select a file from your device, or paste text below
                </p>
              </div>

              {/* Direct Text Editor / Paste Box */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    {activeFormat === "markdown-pdf"
                      ? "Markdown Input"
                      : activeFormat === "text-pdf"
                      ? "Text Input"
                      : activeFormat === "svg-png"
                      ? "SVG XML Code"
                      : "JSON or CSV Input"}
                  </label>
                  {textInput && (
                    <button
                      onClick={() => setTextInput("")}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <textarea
                  rows={8}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={
                    activeFormat === "markdown-pdf"
                      ? "# Title\n\n## Subheading\n\n- Bullet item 1\n- Bullet item 2\n\nParagraph text here..."
                      : activeFormat === "svg-png"
                      ? "<svg width='200' height='200'>...</svg>"
                      : activeFormat === "json-csv"
                      ? '[{"id": 1, "name": "Item A", "price": 49.99}]'
                      : "Type or paste your text here..."
                  }
                  className="w-full rounded-xl border border-slate-300 p-3.5 text-xs font-mono text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {errorMessage && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <span>Zero server storage. 100% in-browser transformation.</span>
                </div>

                <button
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 px-7 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>{isProcessing ? "Converting..." : "Convert Document"}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3.5">
              <Code2 className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Developer-Friendly Formats</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Tailored for documentation, README files, vector graphics, and data payloads like JSON and CSV.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3.5">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">100% Client-Side Privacy</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Your source code, JSON data, and internal documentation are processed only on your local device.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3.5">
              <Boxes className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Universal PDF Output</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Generates high-resolution vector PDFs ready to print, email, or archive with standard formatting.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
