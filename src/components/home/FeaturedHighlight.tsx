/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  Share2,
  Check,
  ArrowRight,
  Radio,
  ExternalLink,
} from "lucide-react";
import { YoutubeIcon } from "@/components/ui/BrandIcons";
import { useFeaturedPost, FeaturedPost } from "@/features/picture-of-day/useFeaturedPost";

interface FeaturedHighlightProps {
  initialPost?: FeaturedPost | null;
}

export function FeaturedHighlight({ initialPost }: FeaturedHighlightProps) {
  const { post } = useFeaturedPost(initialPost);
  const [copied, setCopied] = useState(false);

  const formattedDate = new Date(post.publishedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <section className="relative -mt-6 sm:-mt-8 z-20 mx-auto max-w-5xl px-4 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-xl border border-slate-200/90 hover:shadow-2xl transition-all">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-blue-50/25 to-purple-50/30 px-5 py-2.5 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-6.5 w-6.5 items-center justify-center rounded-lg bg-rose-500 text-white shadow-sm shadow-rose-500/20">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-900">
                Picture & Fact of the Day
              </h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                <Radio className="h-2 w-2 animate-pulse text-emerald-500" />
                Live
              </span>
            </div>
            <span className="hidden sm:inline-block text-xs text-slate-300">|</span>
            <p className="hidden sm:inline-block text-xs text-slate-500">
              Defense & aerospace intelligence by UFK Channel
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-slate-500" />
                  <span>Share</span>
                </>
              )}
            </button>

            <Link
              href="/picture-of-the-day"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              <span>Archive</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Content Body Grid - Well Proportioned */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Featured Image - 260px-285px Height */}
          <div className="relative md:col-span-5 h-52 md:h-auto md:min-h-[260px] md:max-h-[290px] overflow-hidden bg-slate-950 group">
            <img
              src={post.imageUrl}
              alt={post.title}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?q=80&w=1200&auto=format&fit=crop";
              }}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent md:hidden" />
          </div>

          {/* Fact & Description Panel */}
          <div className="md:col-span-7 flex flex-col justify-between p-5 sm:p-6 bg-white">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
                <Calendar className="h-3 w-3 text-blue-600" />
                <span>{formattedDate}</span>
                <span>•</span>
                <span className="text-blue-600 font-semibold">Intelligence Brief</span>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-snug line-clamp-2">
                {post.title}
              </h3>

              <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 sm:p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
                  Did You Know?
                </span>
                <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
                  {post.fact}
                </p>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <a
                href={post.youtubeUrl || "https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all group"
              >
                <YoutubeIcon className="h-3.5 w-3.5 text-white group-hover:scale-110 transition-transform" />
                <span>Watch on UFK Channel</span>
              </a>

              <Link
                href="/picture-of-the-day"
                className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
              >
                <span>Read Full Story</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
