/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Metadata } from "next";
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
import { db } from "@/lib/db";
import { YoutubeIcon } from "@/components/ui/BrandIcons";

export const metadata: Metadata = {
  title: "Defense & Aerospace Fact of the Day — Presented by UFK Channel",
  description:
    "Curated daily defense intelligence, military aviation engineering, naval stealth systems, and aerospace discoveries presented by the official UFK YouTube Channel.",
  openGraph: {
    title: "Picture & Fact of the Day — UFK Channel Intelligence",
    description: "Daily defense & military technology facts curated by UFK.",
  },
};

export default async function PictureOfTheDayPage() {
  const posts = await db.getAllPosts();
  const featuredPost = posts.find((p) => p.isFeatured) || posts[0];
  const pastPosts = posts.filter((p) => p.id !== featuredPost?.id);

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

        {/* Live Featured Item Showcase - Adjusted & Balanced Size */}
        {featuredPost && (
          <div className="rounded-2xl sm:rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Image Column - 5/12 columns with Max Height */}
              <div className="lg:col-span-5 h-60 sm:h-72 lg:h-auto lg:min-h-[290px] lg:max-h-[340px] overflow-hidden bg-slate-900 group">
                <img
                  src={featuredPost.imageUrl}
                  alt={featuredPost.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>

              {/* Content Column - 7/12 columns with comfortable padding */}
              <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                      <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-500" />
                      Currently Featured Brief
                    </span>
                    <span className="text-xs text-slate-400">
                      • Defense & Aerospace
                    </span>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                    {featuredPost.title}
                  </h2>

                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block mb-1">
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
        )}

        {/* Historical Archive Grid */}
        {pastPosts.length > 0 && (
          <div>
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
