"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  X,
  CheckCircle2,
  AlertCircle,
  Download,
  RotateCcw,
  Shield,
  Images,
  ArrowUp,
  ArrowDown,
  Settings2,
  HelpCircle,
  ChevronDown,
} from "lucide-react";
import { PDFDocument, PageSizes } from "pdf-lib";
import { ToolItem, CATEGORIES } from "@/config/tools.config";

interface JpgToPdfToolProps {
  tool: ToolItem;
}

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

export function JpgToPdfTool({ tool }: JpgToPdfToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<"A4" | "Letter" | "Fit">("A4");
  const [orientation, setOrientation] = useState<"portrait" | "landscape" | "auto">("auto");
  const [margin, setMargin] = useState<"none" | "small" | "large">("small");

  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleFiles = (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const newItems: ImageItem[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!validExtensions.includes(ext)) {
        setErrorMessage(`"${file.name}" is not a supported image (JPG, PNG, WebP).`);
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setErrorMessage(`"${file.name}" exceeds 50 MB limit.`);
        return;
      }

      newItems.push({
        id: `${file.name}-${Date.now()}-${i}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (newItems.length > 0) {
      setImages((prev) => [...prev, ...newItems]);
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const moveDown = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      return updated;
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const reset = () => {
    images.forEach((img) => URL.revokeObjectURL(img.previewUrl));
    setImages([]);
    setPdfBlobUrl(null);
    setProgress(0);
    setIsProcessing(false);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Convert File to Image bitmap / JPEG buffer via Canvas
  const processImageToJpegBytes = (file: File): Promise<Uint8Array> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            reject(new Error("Could not create canvas context."));
            return;
          }
          // White background for transparent PNG/WebP
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const buffer = await blob.arrayBuffer();
                resolve(new Uint8Array(buffer));
              } else {
                reject(new Error("Image conversion failed."));
              }
            },
            "image/jpeg",
            0.92
          );
        };
        img.onerror = () => reject(new Error("Failed to load image."));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error("Failed to read file."));
      reader.readAsDataURL(file);
    });
  };

  const executeCompilePdf = async () => {
    if (images.length === 0) return;
    setIsProcessing(true);
    setProgress(10);
    setErrorMessage(null);

    try {
      const pdfDoc = await PDFDocument.create();
      const marginPt = margin === "none" ? 0 : margin === "small" ? 18 : 36;

      for (let i = 0; i < images.length; i++) {
        setProgress(Math.round(10 + (i / images.length) * 80));
        const item = images[i];

        const jpegBytes = await processImageToJpegBytes(item.file);
        const embeddedImage = await pdfDoc.embedJpg(jpegBytes);
        const { width: imgW, height: imgH } = embeddedImage;

        let pageW = 0;
        let pageH = 0;

        if (pageSize === "Fit") {
          pageW = imgW + marginPt * 2;
          pageH = imgH + marginPt * 2;
        } else {
          const baseSize = pageSize === "A4" ? PageSizes.A4 : PageSizes.Letter;
          let isLandscape = false;
          if (orientation === "landscape") isLandscape = true;
          else if (orientation === "portrait") isLandscape = false;
          else isLandscape = imgW > imgH; // auto

          pageW = isLandscape ? baseSize[1] : baseSize[0];
          pageH = isLandscape ? baseSize[0] : baseSize[1];
        }

        const page = pdfDoc.addPage([pageW, pageH]);

        // Calculate fitted dimensions within margins
        const availableW = pageW - marginPt * 2;
        const availableH = pageH - marginPt * 2;
        const scale = Math.min(availableW / imgW, availableH / imgH);

        const drawW = imgW * scale;
        const drawH = imgH * scale;
        const drawX = marginPt + (availableW - drawW) / 2;
        const drawY = marginPt + (availableH - drawH) / 2;

        page.drawImage(embeddedImage, {
          x: drawX,
          y: drawY,
          width: drawW,
          height: drawH,
        });
      }

      setProgress(95);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
      setProgress(100);
    } catch (err: unknown) {
      console.error("JPG to PDF compile error:", err);
      const msg = err instanceof Error ? err.message : "Failed to convert images to PDF.";
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/#category-image-tools" className="hover:text-blue-600 transition-colors">
            {category?.name || "Image Tools"}
          </Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{tool.name}</span>
        </nav>

        {/* Header Card */}
        <div className="rounded-3xl bg-white p-8 sm:p-10 shadow-sm border border-slate-200/80 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 text-white shadow-lg shadow-blue-900/10">
              <Images className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  {category?.name}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                  100% In-Browser Compilation
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

        {/* Processing Box */}
        <div className="rounded-3xl bg-white p-6 sm:p-10 shadow-sm border border-slate-200/80 mb-12">
          {!pdfBlobUrl ? (
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
                  if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 sm:p-12 text-center cursor-pointer transition-all duration-300 ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/60 scale-[1.01]"
                    : "border-slate-300 hover:border-blue-400 hover:bg-slate-50/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    if (e.target.files) handleFiles(e.target.files);
                  }}
                  className="hidden"
                />
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 group-hover:scale-110 transition-transform shadow-inner">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  Choose images or drop them here
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-sm">
                  Add JPG, PNG, or WebP pictures. Reorder pages and customize margins freely.
                </p>
                <button
                  type="button"
                  className="mt-6 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-600/20 group-hover:bg-blue-500 transition-colors"
                >
                  Select Photos
                </button>
              </div>

              {/* Error */}
              {errorMessage && (
                <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs font-medium text-rose-700 animate-in fade-in">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Image Arranger & Settings */}
              {images.length > 0 && (
                <div className="mt-8 space-y-6">
                  {/* Settings Bar */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">
                      <Settings2 className="h-4 w-4 text-blue-600" />
                      <span>PDF Page Layout Settings</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Page Size */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Page Size
                        </label>
                        <select
                          value={pageSize}
                          onChange={(e) => setPageSize(e.target.value as "A4" | "Letter" | "Fit")}
                          className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="A4">A4 (Standard)</option>
                          <option value="Letter">US Letter</option>
                          <option value="Fit">Fit to Image Size</option>
                        </select>
                      </div>

                      {/* Orientation */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Orientation
                        </label>
                        <select
                          value={orientation}
                          onChange={(e) => setOrientation(e.target.value as "portrait" | "landscape" | "auto")}
                          className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="auto">Auto (Match Image Ratio)</option>
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>

                      {/* Margins */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                          Margins
                        </label>
                        <select
                          value={margin}
                          onChange={(e) => setMargin(e.target.value as "none" | "small" | "large")}
                          className="w-full rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                        >
                          <option value="none">No Margin (Full Bleed)</option>
                          <option value="small">Small Margin</option>
                          <option value="large">Big Margin</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Thumbnail Arrange List */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                      <span>Selected Photos ({images.length})</span>
                      <button
                        onClick={reset}
                        className="text-slate-400 hover:text-rose-600 normal-case font-semibold"
                      >
                        Remove All
                      </button>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {images.map((item, idx) => (
                        <div
                          key={item.id}
                          className="relative rounded-2xl bg-slate-50 border border-slate-200 overflow-hidden group shadow-sm flex flex-col justify-between"
                        >
                          <div className="aspect-[4/3] bg-slate-900 overflow-hidden relative">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.previewUrl}
                              alt={item.file.name}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute top-1.5 left-1.5 flex h-5 w-5 items-center justify-center rounded-md bg-slate-950/80 text-white font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <button
                              onClick={() => removeImage(item.id)}
                              className="absolute top-1.5 right-1.5 p-1 rounded-md bg-slate-950/80 hover:bg-rose-600 text-white transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="p-2 flex items-center justify-between bg-white border-t border-slate-100">
                            <span className="text-[10px] text-slate-500 truncate max-w-[80px]">
                              {item.file.name}
                            </span>
                            <div className="flex items-center gap-0.5">
                              <button
                                onClick={() => moveUp(idx)}
                                disabled={idx === 0}
                                className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => moveDown(idx)}
                                disabled={idx === images.length - 1}
                                className="p-1 rounded text-slate-400 hover:text-slate-800 disabled:opacity-20"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {isProcessing && (
                    <div className="space-y-2 rounded-2xl bg-blue-50/60 border border-blue-100 p-5">
                      <div className="flex items-center justify-between text-xs font-semibold text-blue-900">
                        <span>Compiling images into vector PDF...</span>
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

                  {/* Submit Button */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={executeCompilePdf}
                      disabled={isProcessing || images.length === 0}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all"
                    >
                      <Images className="h-4 w-4" />
                      <span>{isProcessing ? "Converting..." : `Convert ${images.length} Photos to PDF`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Download State */
            <div className="py-10 text-center space-y-6 animate-in fade-in duration-300">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-md">
                <CheckCircle2 className="h-9 w-9" />
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">
                  PDF Generated Successfully!
                </h3>
                <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
                  Your photos have been compiled into a clean PDF document with {images.length} pages.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a
                  href={pdfBlobUrl}
                  download="ufk-tools-images.pdf"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/30 transition-all"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Converted PDF</span>
                </a>
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Convert More Images</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mb-14">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            How to Convert JPG to PDF with UFK Tools
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
              <h4 className="text-sm font-bold">100% In-Browser Photo Conversion</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Your personal photos are processed locally on your device. They never touch any server or cloud storage.
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
