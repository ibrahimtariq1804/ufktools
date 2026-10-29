"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  UploadCloud,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Radio,
  Image as ImageIcon,
  X,
} from "lucide-react";

export default function ManageFeaturedPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [fact, setFact] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8");
  const [isFeatured, setIsFeatured] = useState(true);

  // File states
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedFilename, setUploadedFilename] = useState<string | null>(null);

  // Submission states
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Please select a valid image file (JPG, PNG, or WebP).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Image exceeds 10 MB limit.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Auto-upload image to server
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image.");
      }

      setUploadedUrl(data.url);
      setUploadedFilename(data.filename);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Image upload failed.";
      setErrorMessage(message);
    } finally {
      setIsUploading(false);
    }
  };

  const removeSelectedImage = () => {
    setPreviewUrl(null);
    setUploadedUrl(null);
    setUploadedFilename(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!uploadedUrl) {
      setErrorMessage("Please select and upload a featured image.");
      return;
    }

    if (!title.trim() || !fact.trim()) {
      setErrorMessage("Please provide both a title and the interesting fact description.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/featured", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          fact: fact.trim(),
          imageUrl: uploadedUrl,
          imageFilename: uploadedFilename,
          youtubeUrl: youtubeUrl.trim() || undefined,
          isFeatured,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to publish discovery.");
      }

      setSuccessMessage(
        "Published successfully! Live homepage visitors have received this update in real time via Server-Sent Events."
      );

      setTimeout(() => {
        router.push("/admin/dashboard/history");
      }, 1500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Publication failed.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          Publish Picture & Fact of the Day
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Upload captivating imagery and verified knowledge. Publishing will broadcast to all active visitors in realtime.
        </p>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-950/70 border border-emerald-800 p-4 text-xs sm:text-sm text-emerald-200 animate-in fade-in">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl bg-rose-950/70 border border-rose-800 p-4 text-xs sm:text-sm text-rose-200 animate-in fade-in">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-7">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6"
          >
            {/* Image Uploader */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Featured Image (JPG, PNG, WebP — Max 10MB)
              </label>

              {!previewUrl ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-950/40 hover:bg-slate-950/70"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-400 mx-auto mb-3">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-semibold text-white">
                    Click to select image from device
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    High resolution landscape (16:9 or 16:10) recommended
                  </div>
                </div>
              ) : (
                <div className="relative rounded-2xl overflow-hidden border border-slate-700 aspect-[16/9] bg-slate-950">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Selected preview"
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={removeSelectedImage}
                    className="absolute top-3 right-3 p-1.5 rounded-xl bg-slate-900/80 hover:bg-rose-600 text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center text-xs font-bold text-white">
                      Uploading to secure server storage...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                Headline / Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., The James Webb Space Telescope's Cosmic Marvel"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Fact Description */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
                  Fascinating Fact / Story
                </label>
                <span className="text-[11px] text-slate-500">{fact.length} characters</span>
              </div>
              <textarea
                required
                rows={4}
                value={fact}
                onChange={(e) => setFact(e.target.value)}
                placeholder="The F-35's AN/AAQ-37 DAS uses six infrared sensors embedded around the airframe..."
                className="w-full rounded-xl bg-slate-950 border border-slate-800 p-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none leading-relaxed"
              />
            </div>

            {/* YouTube Link */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                UFK YouTube Video Link (Optional)
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... or https://youtube.com/@ufk"
                className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Adds a direct &quot;Watch on UFK Channel&quot; action button on the featured card.
              </p>
            </div>

            {/* Featured Checkbox */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <input
                type="checkbox"
                id="isFeatured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="isFeatured" className="text-xs sm:text-sm text-slate-300 cursor-pointer">
                <strong className="text-white">Make this the active featured post immediately</strong>
                <p className="text-xs text-slate-500">
                  Replaces the current homepage featured post and broadcasts via SSE to active visitors.
                </p>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isSubmitting ? "Broadcasting to Homepage..." : "Publish & Broadcast Live"}</span>
            </button>
          </form>
        </div>

        {/* Right: Real-time Live Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Eye className="h-4 w-4 text-blue-400" />
              <span>Homepage Live Preview</span>
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              Realtime Appearance
            </span>
          </div>

          <div className="rounded-3xl bg-white text-slate-900 border border-slate-200 overflow-hidden shadow-2xl">
            {/* Image Preview */}
            <div className="aspect-[16/10] overflow-hidden bg-slate-900 relative">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Live preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 p-6 text-center">
                  <ImageIcon className="h-8 w-8 mb-2 text-slate-600" />
                  <span className="text-xs">Select an image to preview homepage layout</span>
                </div>
              )}
            </div>

            {/* Text Preview */}
            <div className="p-6 space-y-3">
              <div className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider">
                Today&apos;s Featured Discovery
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {title.trim() || "Your Discovery Title Appears Here"}
              </h3>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                <span className="text-[10px] font-bold text-blue-600 uppercase block mb-1">
                  Did You Know?
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {fact.trim() ||
                    "Enter your interesting fact description on the left to see how it renders on the live public homepage."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
