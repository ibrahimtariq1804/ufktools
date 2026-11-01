/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Calendar,
  ArrowLeft,
  Radio,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { YoutubeIcon } from "@/components/ui/BrandIcons";
import { FeaturedPost } from "./useFeaturedPost";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?q=80&w=1200&auto=format&fit=crop";

interface PictureOfTheDayClientProps {
  initialFeaturedPost?: FeaturedPost | null;
  initialPastPosts?: FeaturedPost[];
}

export function PictureOfTheDayClient({
  initialFeaturedPost = null,
  initialPastPosts = [],
}: PictureOfTheDayClientProps) {
  const [featuredPost, setFeaturedPost] = useState<FeaturedPost | null>(initialFeaturedPost);
  const [pastPosts, setPastPosts] = useState<FeaturedPost[]>(initialPastPosts);
  const [isLoading, setIsLoading] = useState<boolean>(!initialFeaturedPost);

  // Live client-side data fetch & real-time SSE listener
  useEffect(() => {
    let isMounted = true;

    const fetchLatest = () => {
      fetch(`/api/featured?t=${Date.now()}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (data && "post" in data) {
            setFeaturedPost(data.post || null);
          }
          if (data && Array.isArray(data.pastPosts)) {
            setPastPosts(data.pastPosts);
          }
        })
        .catch((err) => {
          console.warn("Client featured post fetch error:", err);
        })
        .finally(() => {
          if (isMounted) setIsLoading(false);
        });
    };

    // 1. Initial live fetch to bypass any server-cached or prefetched stale state
    fetchLatest();

    // 2. Real-time updates via Server-Sent Events
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/sse/featured-stream");
      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const msg = JSON.parse(event.data);
          if (
            msg &&
            (msg.type === "NEW_FEATURED_POST" || msg.type === "FEATURED_POST_DELETED")
          ) {
            fetchLatest();
          }
        } catch {
          // Ignore heartbeat or parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {
      // Browser offline or unsupported
    }

    return () => {
      isMounted = false;
      eventSource?.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Navigation Breadcrumb */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tools Directory</span>
        </Link>

        {/* Page Header */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700 border border-rose-200 mb-2.5">
            <Sparkles className="h-3.5 w-3.5 fill-rose-600 text-rose-600" />
            <span>Official UFK Channel Curation</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Defense & Aerospace Fact of the Day
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
            Curated daily defense intelligence, military aerospace breakthroughs, naval engineering, and geopolitical technology briefs from the creators of the <strong>UFK Channel</strong>.
          </p>
        </div>

        {/* Official YouTube Channel Spotlight Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 p-5 sm:p-6 text-white border border-slate-800 shadow-lg mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-md shadow-red-600/30">
                <YoutubeIcon className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-white">
                    UFK Channel (@UFK)
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-semibold text-red-300 border border-red-500/30">
                    <CheckCircle2 className="h-3 w-3 text-red-400" />
                    Official
                  </span>
                </div>
                <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                  In-depth, unbiased military analyses, fighter jet market breakdowns, and global defense economics. Pure facts, zero clickbait.
                </p>
              </div>
            </div>

            <div className="flex items-center shrink-0">
              <a
                href="https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-red-600/30 transition-all"
              >
                <YoutubeIcon className="h-3.5 w-3.5" />
                <span>Visit Channel</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Live Featured Item Showcase */}
        {featuredPost ? (
          <div className="rounded-2xl sm:rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden mb-12 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Image Column */}
              <div className="lg:col-span-5 h-64 sm:h-80 lg:h-auto lg:min-h-[320px] lg:max-h-[380px] overflow-hidden bg-slate-900 group relative">
                <img
                  src={featuredPost.imageUrl}
                  alt={featuredPost.title}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                  }}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Content Column */}
              <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-500" />
                      Currently Featured Brief
                    </span>
                    <span className="text-xs text-slate-400">
                      • {new Date(featuredPost.publishedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                    {featuredPost.title}
                  </h2>

                  <div className="rounded-2xl bg-slate-50 border border-slate-200/90 p-4 sm:p-5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1.5">
                      Did You Know?
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
                      {featuredPost.fact}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <a
                    href={featuredPost.youtubeUrl || "https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition-all"
                  >
                    <YoutubeIcon className="h-3.5 w-3.5" />
                    <span>Watch Deep-Dive on YouTube</span>
                  </a>
                  <span className="text-xs text-slate-400">
                    Broadcasted live via SSE
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : isLoading ? (
          <div className="rounded-2xl sm:rounded-3xl bg-white shadow-xl border border-slate-200 p-12 text-center mb-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4" />
            <p className="text-sm font-semibold text-slate-600">Loading daily intelligence brief...</p>
          </div>
        ) : (
          <div className="rounded-2xl sm:rounded-3xl bg-white shadow-xl border border-slate-200 p-8 sm:p-12 text-center mb-12 animate-in fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 mb-4 border border-rose-100 shadow-sm">
              <Sparkles className="h-7 w-7 text-rose-500" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              No Featured Stories Currently Published
            </h2>
            <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
              There are currently no featured facts or defense stories published. Check back soon or visit the official UFK Channel for the latest video deep-dives.
            </p>
            <a
              href="https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all"
            >
              <YoutubeIcon className="h-4 w-4" />
              <span>Explore UFK YouTube Channel</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Historical Archive Grid */}
        {pastPosts.length > 0 && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <ShieldCheck className="h-6 w-6 text-blue-600" />
              <span>Past Intelligence Briefs</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {pastPosts.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow group"
                >
                  <div className="aspect-[16/9] overflow-hidden bg-slate-900">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = FALLBACK_IMAGE;
                      }}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                        <Calendar className="h-3.5 w-3.5 text-blue-600" />
                        <span>
                          {new Date(item.publishedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </span>
                        <span>•</span>
                        <span className="text-blue-600 font-semibold">Military Tech</span>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        {item.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {item.fact}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                      <a
                        href={item.youtubeUrl || "https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 transition-colors"
                      >
                        <YoutubeIcon className="h-3.5 w-3.5" />
                        <span>Watch on UFK Channel</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
