"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  RotateCcw,
  Shield,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Presentation,
  ArrowRightLeft,
  Sparkles,
} from "lucide-react";
import JSZip from "jszip";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { getPdfJs } from "@/lib/pdf/pdfjs-helper";

interface PowerpointToPdfToolProps {
  tool: ToolItem;
}

type Mode = "pptx-to-pdf" | "pdf-to-pptx";

interface ExtractedSlide {
  title: string;
  bulletPoints: string[];
}

export function PowerpointToPdfTool({ tool }: PowerpointToPdfToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("pptx-to-pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [slideCount, setSlideCount] = useState<number>(0);

  const handleFileSelect = useCallback(
    (file: File) => {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (mode === "pptx-to-pdf" && ext !== "pptx" && ext !== "ppt") {
        setErrorMessage("Please select a valid PowerPoint presentation (.pptx or .ppt).");
        return;
      }
      if (mode === "pdf-to-pptx" && ext !== "pdf") {
        setErrorMessage("Please select a valid .pdf file to convert into PowerPoint slides.");
        return;
      }
      if (file.size > tool.maxFileSizeMB * 1024 * 1024) {
        setErrorMessage(`File exceeds ${tool.maxFileSizeMB}MB limit.`);
        return;
      }

      setErrorMessage(null);
      setSelectedFile(file);
      setDownloadUrl(null);
      setSlideCount(0);
      setProgress(0);
      setStatusMessage("");
    },
    [mode, tool.maxFileSizeMB]
  );

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(10);
    setErrorMessage(null);

    try {
      if (mode === "pptx-to-pdf") {
        setStatusMessage("Unpacking PowerPoint presentation package (.pptx)...");
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(selectedFile);

        // Find all slide XML files
        const slideFiles = Object.keys(zipContent.files)
          .filter((f) => /^ppt\/slides\/slide\d+\.xml$/i.test(f))
          .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)![0], 10);
            const numB = parseInt(b.match(/\d+/)![0], 10);
            return numA - numB;
          });

        if (slideFiles.length === 0) {
          throw new Error("No readable slides found in this presentation package.");
        }

        setProgress(30);
        setStatusMessage(`Extracting presentation typography & content (${slideFiles.length} slides)...`);

        const extractedSlides: ExtractedSlide[] = [];
        const parser = new DOMParser();

        for (const slidePath of slideFiles) {
          const xmlText = await zipContent.files[slidePath].async("text");
          const xmlDoc = parser.parseFromString(xmlText, "application/xml");

          // Extract text runs inside shapes
          const textElements = xmlDoc.getElementsByTagName("a:t");
          const texts: string[] = [];
          for (let i = 0; i < textElements.length; i++) {
            const val = textElements[i].textContent?.trim();
            if (val) texts.push(val);
          }

          const title = texts.length > 0 ? texts[0] : "Slide Title";
          const bulletPoints = texts.slice(1);
          extractedSlides.push({ title, bulletPoints });
        }

        setProgress(60);
        setStatusMessage("Generating landscape vector PDF presentation...");

        // Create Landscape Widescreen PDF (842 x 595 - A4 Landscape)
        const pdfDoc = await PDFDocument.create();
        const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

        for (let idx = 0; idx < extractedSlides.length; idx++) {
          const slide = extractedSlides[idx];
          const page = pdfDoc.addPage([842, 595]);

          // Draw dark navy executive slide header bar
          page.drawRectangle({
            x: 0,
            y: 500,
            width: 842,
            height: 95,
            color: rgb(0.06, 0.09, 0.16),
          });

          // Draw Slide Title
          page.drawText(slide.title.slice(0, 75), {
            x: 45,
            y: 540,
            size: 22,
            font: titleFont,
            color: rgb(1, 1, 1),
          });

          // Draw Slide Number Footer
          page.drawText(`Slide ${idx + 1} of ${extractedSlides.length} • UFK Tools Presentation`, {
            x: 45,
            y: 25,
            size: 9,
            font: bodyFont,
            color: rgb(0.5, 0.5, 0.5),
          });

          // Draw Bullet Points
          let yPos = 440;
          for (const bp of slide.bulletPoints.slice(0, 10)) {
            page.drawText(`•  ${bp.slice(0, 100)}`, {
              x: 60,
              y: yPos,
              size: 13,
              font: bodyFont,
              color: rgb(0.12, 0.16, 0.22),
            });
            yPos -= 32;
          }
        }

        setProgress(90);
        setStatusMessage("Compiling PDF slide deck...");

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as BlobPart], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const outputName = selectedFile.name.replace(/\.(pptx|ppt)$/i, "") + ".pdf";

        setDownloadUrl(url);
        setDownloadFilename(outputName);
        setSlideCount(extractedSlides.length);
      } else {
        // PDF to PPTX
        setStatusMessage("Rendering PDF pages for PowerPoint presentation...");
        const pdfjs = await getPdfJs();
        const buffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
        const totalPages = pdf.numPages;

        setProgress(30);
        setStatusMessage(`Converting ${totalPages} PDF pages into slide deck...`);

        const pptxZip = new JSZip();

        // Standard PPTX OpenXML Package Structure
        pptxZip.file(
          "[Content_Types].xml",
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${Array.from({ length: totalPages }, (_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}
</Types>`
        );

        pptxZip.file(
          "_rels/.rels",
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
        );

        // Build slide relationships and minimal presentation.xml
        let sldIdLst = "";
        let presRels = "";
        for (let i = 1; i <= totalPages; i++) {
          sldIdLst += `<p:sldId id="${255 + i}" r:id="rId${i}"/>`;
          presRels += `<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i}.xml"/>`;
        }

        pptxZip.file(
          "ppt/presentation.xml",
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldMasterIdLst/>
  <p:sldIdLst>${sldIdLst}</p:sldIdLst>
  <p:sldSz cx="9144000" cy="5143500"/>
</p:presentation>`
        );

        pptxZip.file(
          "ppt/_rels/presentation.xml.rels",
          `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels}
</Relationships>`
        );

        // Render each page to an image and place on slide
        for (let i = 1; i <= totalPages; i++) {
          setProgress(Math.round(30 + (i / totalPages) * 55));
          setStatusMessage(`Packaging Slide ${i} of ${totalPages}...`);

          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;
            const imgData = canvas.toDataURL("image/jpeg", 0.85);
            const imgBase64 = imgData.split(",")[1];
            pptxZip.file(`ppt/media/image${i}.jpeg`, imgBase64, { base64: true });
          }

          // Slide XML
          pptxZip.file(
            `ppt/slides/slide${i}.xml`,
            `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:pic>
        <p:nvPicPr><p:cNvPr id="2" name="PageImage"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
        <p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
        <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="9144000" cy="5143500"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
      </p:pic>
    </p:spTree>
  </p:cSld>
</p:sld>`
          );

          pptxZip.file(
            `ppt/slides/_rels/slide${i}.xml.rels`,
            `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image${i}.jpeg"/>
</Relationships>`
          );
        }

        setProgress(90);
        setStatusMessage("Zipping Microsoft PowerPoint (.pptx) presentation package...");

        const pptxBlob = await pptxZip.generateAsync({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          compression: "DEFLATE",
        });

        const url = URL.createObjectURL(pptxBlob);
        const outputName = selectedFile.name.replace(/\.pdf$/i, "") + ".pptx";

        setDownloadUrl(url);
        setDownloadFilename(outputName);
        setSlideCount(totalPages);
      }

      setProgress(100);
      setStatusMessage("Conversion complete!");
    } catch (err: unknown) {
      console.error("Presentation conversion error:", err);
      setErrorMessage(
        err instanceof Error ? `Conversion failed: ${err.message}` : "Failed to convert presentation."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setDownloadUrl(null);
    setSlideCount(0);
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
            <Presentation className="h-3.5 w-3.5 text-blue-600" />
            <span>Two-Way Presentation Conversion</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            PowerPoint to PDF / PDF to PowerPoint
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Convert PPTX presentations into landscape vector PDFs, or transform PDF documents into PowerPoint slide decks. 100% in-browser.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-xl bg-slate-200/80 p-1 shadow-inner border border-slate-300/60">
            <button
              onClick={() => {
                setMode("pptx-to-pdf");
                handleReset();
              }}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                mode === "pptx-to-pdf"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Presentation className="h-4 w-4" />
              <span>PowerPoint to PDF (.pptx → .pdf)</span>
            </button>
            <button
              onClick={() => {
                setMode("pdf-to-pptx");
                handleReset();
              }}
              className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                mode === "pdf-to-pptx"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ArrowRightLeft className="h-4 w-4" />
              <span>PDF to PowerPoint (.pdf → .pptx)</span>
            </button>
          </div>
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
                <h2 className="text-xl font-extrabold text-slate-900">Conversion Complete!</h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  {mode === "pptx-to-pdf"
                    ? `Converted ${slideCount} slides into a landscape presentation PDF.`
                    : `Packaged ${slideCount} pages into a Microsoft PowerPoint presentation (.pptx).`}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href={downloadUrl}
                  download={downloadFilename}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download {mode === "pptx-to-pdf" ? "Presentation PDF" : "PowerPoint (.pptx)"}</span>
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
            /* Upload State */
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
                    accept={mode === "pptx-to-pdf" ? ".pptx,.ppt" : ".pdf"}
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-200 group-hover:scale-110 transition-transform">
                    <Presentation className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">
                    {mode === "pptx-to-pdf" ? "Drop PowerPoint Presentation (.pptx)" : "Drop PDF Document (.pdf)"}
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Drag and drop your file here, or click to browse
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                    <FileText className="h-3 w-3" />
                    <span>Up to {tool.maxFileSizeMB}MB</span>
                  </div>
                </div>
              ) : (
                /* File Selected Card */
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Presentation className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{selectedFile.name}</h4>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to convert
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
                      <span>100% private in-browser conversion. Zero server storage.</span>
                    </div>

                    <button
                      onClick={handleConvert}
                      disabled={isProcessing}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 px-7 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                    >
                      <Presentation className="h-4 w-4" />
                      <span>
                        {isProcessing
                          ? "Converting..."
                          : mode === "pptx-to-pdf"
                          ? "Convert to PDF"
                          : "Convert to PowerPoint (.pptx)"}
                      </span>
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
              <Presentation className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Landscape Presentation PDF</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Produces modern widescreen landscape PDFs formatted cleanly for projectors, monitors, and online presentations.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3.5">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Zero Server Cost</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Slide extraction and OpenXML creation happen on your client machine with zero API subscriptions or cloud charges.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3.5">
              <ArrowRightLeft className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Bidirectional Conversion</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Switch easily between converting PowerPoint presentations into PDF and turning PDF pages into presentation slides.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
