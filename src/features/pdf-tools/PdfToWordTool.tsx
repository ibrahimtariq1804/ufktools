"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  RotateCcw,
  Shield,
  HelpCircle,
  Sparkles,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileType,
  FileCheck,
  Eye,
} from "lucide-react";
import JSZip from "jszip";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { getPdfJs } from "@/lib/pdf/pdfjs-helper";

interface PdfToWordToolProps {
  tool: ToolItem;
}

interface ExtractedParagraph {
  text: string;
  isHeading: boolean;
  headingLevel?: 1 | 2;
  isBullet: boolean;
  pageNumber: number;
}

export function PdfToWordTool({ tool }: PdfToWordToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [docxSizeMB, setDocxSizeMB] = useState("");
  const [extractedParagraphs, setExtractedParagraphs] = useState<ExtractedParagraph[]>([]);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid .pdf file.");
      return;
    }

    if (file.size > tool.maxFileSizeMB * 1024 * 1024) {
      setErrorMessage(`File exceeds the maximum size limit of ${tool.maxFileSizeMB}MB.`);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setDownloadUrl(null);
    setExtractedParagraphs([]);
    setProgress(0);
    setStatusMessage("");
  }, [tool.maxFileSizeMB]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(10);
    setStatusMessage("Initializing PDF rendering engine...");
    setErrorMessage(null);

    try {
      const pdfjs = await getPdfJs();
      const arrayBuffer = await selectedFile.arrayBuffer();

      setProgress(25);
      setStatusMessage("Loading PDF document stream...");

      const pdf = await pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      const numPages = pdf.numPages;
      const paragraphs: ExtractedParagraph[] = [];
      let totalWords = 0;

      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round(25 + (i / numPages) * 45));
        setStatusMessage(`Extracting text and structure from page ${i} of ${numPages}...`);

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as Array<{
          str: string;
          transform: number[];
          width: number;
          height: number;
        }>;

        if (items.length === 0) continue;

        // Group items by line based on Y coordinate
        const linesMap = new Map<number, typeof items>();
        for (const item of items) {
          if (!item.str || item.str.trim() === "") continue;
          const y = Math.round(item.transform[5]); // Y coordinate
          let foundKey: number | null = null;
          for (const key of linesMap.keys()) {
            if (Math.abs(key - y) <= 4) {
              foundKey = key;
              break;
            }
          }
          if (foundKey !== null) {
            linesMap.get(foundKey)!.push(item);
          } else {
            linesMap.set(y, [item]);
          }
        }

        // Sort lines from top to bottom (higher Y first)
        const sortedY = Array.from(linesMap.keys()).sort((a, b) => b - a);

        for (const y of sortedY) {
          const lineItems = linesMap.get(y)!;
          // Sort items in line from left to right (X coordinate = transform[4])
          lineItems.sort((a, b) => a.transform[4] - b.transform[4]);

          const lineText = lineItems.map((item) => item.str).join(" ").trim();
          if (!lineText) continue;

          totalWords += lineText.split(/\s+/).length;

          // Estimate font size from transform[0] or transform[3]
          const maxFontSize = Math.max(...lineItems.map((item) => Math.abs(item.transform[0]) || 12));
          const isHeading1 = maxFontSize >= 18;
          const isHeading2 = maxFontSize >= 14 && maxFontSize < 18;
          const isBullet = /^([•\-*]|(\d+\.))\s+/.test(lineText);

          paragraphs.push({
            text: lineText,
            isHeading: isHeading1 || isHeading2,
            headingLevel: isHeading1 ? 1 : isHeading2 ? 2 : undefined,
            isBullet,
            pageNumber: i,
          });
        }
      }

      setExtractedParagraphs(paragraphs);
      setTotalWordCount(totalWords);

      setProgress(75);
      setStatusMessage("Constructing Microsoft Word (.docx) document package...");

      // Build genuine DOCX OpenXML package via JSZip
      const zip = new JSZip();

      // 1. [Content_Types].xml
      zip.file(
        "[Content_Types].xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`
      );

      // 2. _rels/.rels
      zip.file(
        "_rels/.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
      );

      // 3. word/_rels/document.xml.rels
      zip.file(
        "word/_rels/document.xml.rels",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
      );

      // 4. word/styles.xml
      zip.file(
        "word/styles.xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:szCs w:val="22"/>
        <w:color w:val="2A2A2A"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:sz w:val="36"/>
      <w:color w:val="0F172A"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:rPr>
      <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
      <w:b/>
      <w:sz w:val="28"/>
      <w:color w:val="1E293B"/>
    </w:rPr>
  </w:style>
</w:styles>`
      );

      // 5. word/document.xml
      const escapeXml = (unsafe: string) =>
        unsafe.replace(/[<>&'"]/g, (c) => {
          switch (c) {
            case "<":
              return "&lt;";
            case ">":
              return "&gt;";
            case "&":
              return "&amp;";
            case "'":
              return "&apos;";
            case '"':
              return "&quot;";
            default:
              return c;
          }
        });

      let docXmlBody = "";
      for (const p of paragraphs) {
        const escaped = escapeXml(p.text);
        if (p.isHeading && p.headingLevel === 1) {
          docXmlBody += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading1"/>
        <w:spacing w:before="240" w:after="120"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="36"/></w:rPr>
        <w:t>${escaped}</w:t>
      </w:r>
    </w:p>`;
        } else if (p.isHeading && p.headingLevel === 2) {
          docXmlBody += `
    <w:p>
      <w:pPr>
        <w:pStyle w:val="Heading2"/>
        <w:spacing w:before="180" w:after="80"/>
      </w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="28"/></w:rPr>
        <w:t>${escaped}</w:t>
      </w:r>
    </w:p>`;
        } else if (p.isBullet) {
          docXmlBody += `
    <w:p>
      <w:pPr>
        <w:ind w:left="360"/>
        <w:spacing w:after="80"/>
      </w:pPr>
      <w:r>
        <w:t>${escaped}</w:t>
      </w:r>
    </w:p>`;
        } else {
          docXmlBody += `
    <w:p>
      <w:pPr>
        <w:spacing w:after="140" w:line="276" w:lineRule="auto"/>
      </w:pPr>
      <w:r>
        <w:t>${escaped}</w:t>
      </w:r>
    </w:p>`;
        }
      }

      // If document was completely empty (e.g. pure image scan), add helpful notice
      if (paragraphs.length === 0) {
        docXmlBody = `
    <w:p>
      <w:r>
        <w:t>This document contains non-selectable visual content. If this was a scanned image document, please run it through our OCR PDF tool to extract readable text.</w:t>
      </w:r>
    </w:p>`;
      }

      zip.file(
        "word/document.xml",
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
${docXmlBody}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/>
    </w:sectPr>
  </w:body>
</w:document>`
      );

      setProgress(90);
      setStatusMessage("Packaging Microsoft Word (.docx) archive...");

      const docxBlob = await zip.generateAsync({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        compression: "DEFLATE",
      });

      const url = URL.createObjectURL(docxBlob);
      const outputName = selectedFile.name.replace(/\.pdf$/i, "") + ".docx";

      setDownloadUrl(url);
      setDownloadFilename(outputName);
      setDocxSizeMB((docxBlob.size / (1024 * 1024)).toFixed(2));

      setProgress(100);
      setStatusMessage("Conversion complete!");
    } catch (err: unknown) {
      console.error("PDF to Word conversion error:", err);
      setErrorMessage(
        err instanceof Error ? `Conversion failed: ${err.message}` : "Failed to convert PDF to Word."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setDownloadUrl(null);
    setExtractedParagraphs([]);
    setProgress(0);
    setStatusMessage("");
    setErrorMessage(null);
    setShowPreview(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb Navigation */}
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
            <FileType className="h-3.5 w-3.5 text-blue-600" />
            <span>High-Fidelity PDF to DOCX Extraction</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Convert PDF to Editable Word (.docx)
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Transform read-only PDF documents into fully editable Microsoft Word files with preserved headings, paragraphs, and lists. 100% private in-browser conversion.
          </p>
        </div>

        {/* Main Work Card */}
        <div className="rounded-2xl bg-white shadow-xl border border-slate-200/80 p-6 sm:p-8">
          {downloadUrl ? (
            /* Success State */
            <div className="text-center py-6 max-w-md mx-auto space-y-5">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                <CheckCircle2 className="h-8 w-8" />
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Conversion Complete!</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Your PDF was converted into an editable Microsoft Word document.
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-left space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span className="font-semibold text-slate-800 truncate mr-2">{downloadFilename}</span>
                  <span className="shrink-0">{docxSizeMB} MB</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center justify-between">
                  <span>{extractedParagraphs.length} paragraphs reconstructed</span>
                  <span>{totalWordCount.toLocaleString()} words</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Word Document (.docx)</span>
                </a>

                <button
                  onClick={handleReset}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 text-slate-500" />
                  <span>Convert Another File</span>
                </button>
              </div>

              {/* Toggle text extraction preview */}
              {extractedParagraphs.length > 0 && (
                <div className="pt-2">
                  <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    <span>{showPreview ? "Hide Extracted Content" : "Preview Extracted Content"}</span>
                  </button>

                  {showPreview && (
                    <div className="mt-3 max-h-60 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-xs text-slate-700 space-y-2">
                      {extractedParagraphs.slice(0, 20).map((p, idx) => (
                        <p key={idx} className={p.isHeading ? "font-bold text-slate-900" : ""}>
                          {p.text}
                        </p>
                      ))}
                      {extractedParagraphs.length > 20 && (
                        <p className="text-[11px] text-slate-400 italic">
                          ...and {extractedParagraphs.length - 20} more paragraphs included in download.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Upload / Process State */
            <div className="space-y-6">
              {!selectedFile ? (
                /* Dropzone */
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
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
                    <FileType className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">
                    Drop PDF to Convert to Word
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
                /* Selected File Card & Progress */
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{selectedFile.name}</h4>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Word conversion
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

                  {/* Error Notification */}
                  {errorMessage && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-xs text-red-700">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Convert Action Button */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span>100% private in-browser conversion. Zero server storage.</span>
                    </div>

                    <button
                      onClick={handleConvert}
                      disabled={isProcessing}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 px-7 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                    >
                      <FileCheck className="h-4 w-4" />
                      <span>{isProcessing ? "Converting to Word..." : "Convert to Word (.docx)"}</span>
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
              <FileType className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Editable Word Format (.docx)</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Outputs universal OpenXML Word documents compatible with Microsoft Word, Office 365, Google Docs, and LibreOffice.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3.5">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Zero Server Storage ($0 Cost)</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Document parsing and OpenXML compilation run 100% inside your web browser. Your sensitive files are never uploaded.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3.5">
              <FileCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Structure Reconstruction</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Automatically detects and formats document headings, regular paragraphs, and bulleted lists for clean editing.
            </p>
          </div>
        </div>

        {/* How-to & FAQ */}
        <div className="mt-12 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-600" />
              <span>How to Convert PDF to Word</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  1
                </span>
                <h4 className="text-xs font-bold text-slate-800">Select PDF File</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Drag and drop or browse your PDF file from your device.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  2
                </span>
                <h4 className="text-xs font-bold text-slate-800">Automatic Extraction</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Our engine analyzes text hierarchies, line coordinates, and headings.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-[11px] font-bold text-white mb-2">
                  3
                </span>
                <h4 className="text-xs font-bold text-slate-800">Download DOCX</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Save your fully editable Microsoft Word document instantly.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <h3 className="text-base font-bold text-slate-900 mb-4">Frequently Asked Questions</h3>
            <div className="space-y-3">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">Can I convert scanned paper documents?</h4>
                <p className="text-xs text-slate-600 mt-1">
                  For scanned photo PDFs that do not contain selectable text, please use our <strong>OCR PDF</strong> tool first to extract the text layer.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <h4 className="text-xs font-bold text-slate-800">Is this tool free with no limits?</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Yes, UFK Tools PDF to Word is completely free with no registration, no daily quota, and no watermark.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
