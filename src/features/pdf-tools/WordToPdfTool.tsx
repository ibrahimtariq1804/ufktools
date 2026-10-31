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
  HelpCircle,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import JSZip from "jszip";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { trackToolAction } from "@/lib/analytics";

interface WordToPdfToolProps {
  tool: ToolItem;
}

interface ParsedParagraph {
  text: string;
  isHeading: boolean;
  isBullet: boolean;
  bold: boolean;
}

export function WordToPdfTool({ tool }: WordToPdfToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");

  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState<string>("document.pdf");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const handleFile = (file: File) => {
    setErrorMessage(null);
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (ext !== ".docx" && ext !== ".doc") {
      setErrorMessage("Please select a valid Word document (.docx or .doc).");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMessage("File exceeds 50 MB limit.");
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const resetAll = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    setSelectedFile(null);
    setIsProcessing(false);
    setProgress(0);
    setStatusMessage("");
    setDownloadUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(15);
    setStatusMessage("Unpacking DOCX XML archive streams...");

    try {
      const buffer = await selectedFile.arrayBuffer();
      const zip = new JSZip();
      const loadedZip = await zip.loadAsync(buffer);

      const documentXmlFile = loadedZip.file("word/document.xml");
      if (!documentXmlFile) {
        throw new Error("Invalid DOCX format: missing word/document.xml");
      }

      setProgress(40);
      setStatusMessage("Extracting typography runs & layout paragraphs...");

      const xmlText = await documentXmlFile.async("string");
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "application/xml");

      // Extract paragraphs
      const paragraphs: ParsedParagraph[] = [];
      const pElements = xmlDoc.getElementsByTagName("w:p");

      for (let i = 0; i < pElements.length; i++) {
        const p = pElements[i];
        let pText = "";
        let isBold = false;

        // Check if paragraph is a heading or bullet
        const pStyle = p.getElementsByTagName("w:pStyle")[0]?.getAttribute("w:val") || "";
        const numPr = p.getElementsByTagName("w:numPr").length > 0;
        const isHeading = /heading/i.test(pStyle) || /title/i.test(pStyle);

        const rElements = p.getElementsByTagName("w:r");
        for (let j = 0; j < rElements.length; j++) {
          const r = rElements[j];
          const tElements = r.getElementsByTagName("w:t");
          for (let k = 0; k < tElements.length; k++) {
            pText += tElements[k].textContent || "";
          }
          if (r.getElementsByTagName("w:b").length > 0) {
            isBold = true;
          }
        }

        if (pText.trim()) {
          paragraphs.push({
            text: pText.trim(),
            isHeading,
            isBullet: numPr,
            bold: isBold || isHeading,
          });
        }
      }

      setProgress(70);
      setStatusMessage("Synthesizing vector PDF pages with pdf-lib...");

      // Synthesize clean vector PDF
      const pdfDoc = await PDFDocument.create();
      let page = pdfDoc.addPage([595.28, 841.89]); // A4
      const { width, height } = page.getSize();

      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const margin = 50;
      let y = height - margin;

      const checkPageBreak = (needed: number) => {
        if (y - needed < margin) {
          page = pdfDoc.addPage([595.28, 841.89]);
          y = height - margin;
        }
      };

      for (const p of paragraphs) {
        const fontSize = p.isHeading ? 14 : 10;
        const font = p.bold ? fontBold : fontRegular;
        const color = p.isHeading ? rgb(0.1, 0.15, 0.3) : rgb(0.15, 0.15, 0.18);
        const lineSpacing = p.isHeading ? 18 : 14;
        const indent = p.isBullet ? 15 : 0;
        const maxWidth = width - margin * 2 - indent;

        if (p.isBullet) {
          checkPageBreak(lineSpacing);
          page.drawText("•", {
            x: margin + 4,
            y: y - fontSize,
            size: fontSize,
            font: fontBold,
            color: rgb(0.2, 0.4, 0.8),
          });
        }

        // Word wrap
        const words = p.text.split(/\s+/);
        let currentLine = "";

        for (const word of words) {
          const testLine = currentLine ? `${currentLine} ${word}` : word;
          const textWidth = font.widthOfTextAtSize(testLine, fontSize);

          if (textWidth > maxWidth && currentLine) {
            checkPageBreak(lineSpacing);
            page.drawText(currentLine, {
              x: margin + indent,
              y: y - fontSize,
              size: fontSize,
              font,
              color,
            });
            y -= lineSpacing;
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }

        if (currentLine) {
          checkPageBreak(lineSpacing);
          page.drawText(currentLine, {
            x: margin + indent,
            y: y - fontSize,
            size: fontSize,
            font,
            color,
          });
          y -= lineSpacing;
        }

        // Paragraph spacing
        y -= p.isHeading ? 8 : 4;
      }

      setProgress(90);
      setStatusMessage("Finalizing PDF byte array...");

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const baseName = selectedFile.name.replace(/\.(docx|doc)$/i, "");
      setDownloadUrl(url);
      setDownloadFilename(`${baseName}.pdf`);

      setProgress(100);
      setStatusMessage("Conversion complete!");
      trackToolAction("word-to-pdf", "convert_docx_to_pdf");
    } catch (err: unknown) {
      console.error("DOCX conversion error:", err);
      setErrorMessage(
        err instanceof Error ? `Conversion failed: ${err.message}` : "Failed to convert Word document."
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
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-800 via-indigo-900 to-slate-900 text-white shadow-lg shadow-blue-900/10">
                <FileText className="h-7 w-7" />
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
                    Vector Typography
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {tool.name}
                </h1>
                <p className="mt-2 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
                  Convert Microsoft Word documents (.docx) to standardized vector PDF format instantly inside your browser with complete privacy.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Box */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-12">
          {/* Upload Dropzone */}
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
                accept=".docx,.doc,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword"
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
                Choose a Word document or drop it here
              </h3>
              <p className="mt-1 text-sm text-slate-500 max-w-sm">
                Supported formats: .docx, .doc (Up to 50 MB)
              </p>
              <button
                type="button"
                className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-500 transition-colors"
              >
                Select Word Document
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-medium text-rose-700 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Selected File State */}
          {selectedFile && !downloadUrl && (
            <div className="space-y-6">
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
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetAll}
                  disabled={isProcessing}
                  className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Change Document
                </button>
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
                  onClick={handleConvert}
                  disabled={isProcessing}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 transition-all"
                >
                  <FileText className="h-4 w-4" />
                  <span>{isProcessing ? "Converting DOCX..." : "Convert to PDF"}</span>
                </button>
              </div>
            </div>
          )}

          {/* Download Complete State */}
          {downloadUrl && (
            <div className="py-8 text-center space-y-6 animate-in fade-in duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  Conversion Complete!
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  Your Word document was converted to vector PDF format successfully.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  onClick={() => trackToolAction("word-to-pdf", "download_pdf")}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF Document</span>
                </a>
                <button
                  onClick={resetAll}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-3.5 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Convert Another Word File</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How It Works Section */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-slate-900 mb-6 text-center sm:text-left">
            How to Convert Word to PDF in 3 Simple Steps
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
              <h4 className="text-sm font-bold">100% In-Browser Conversion</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Your Word documents are unzipped and translated directly on your device. Zero bytes ever touch a cloud server.
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
