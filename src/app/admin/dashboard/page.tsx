"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Layers,
  Radio,
  PlusCircle,
  Database,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { FeaturedPostRecord } from "@/lib/db";

export default function AdminDashboardPage() {
  const [featuredPost, setFeaturedPost] = useState<FeaturedPostRecord | null>(null);
  const [totalPosts, setTotalPosts] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = () => {
    setIsLoading(true);
    fetch("/api/admin/featured")
      .then((res) => res.json())
      .then((data) => {
        const posts: FeaturedPostRecord[] = data.posts || [];
        setTotalPosts(posts.length);
        const active = posts.find((p) => p.isFeatured) || posts[0] || null;
        setFeaturedPost(active);
      })
      .catch((err) => console.error("Dashboard data load error:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let ignore = false;

    fetch("/api/admin/featured")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          const posts: FeaturedPostRecord[] = data.posts || [];
          setTotalPosts(posts.length);
          const active = posts.find((p) => p.isFeatured) || posts[0] || null;
          setFeaturedPost(active);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Dashboard load error:", err);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Realtime administration for UFK Tools Picture & Fact of the Day
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin/dashboard/manage-featured"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Publish New Post</span>
          </Link>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Currently Featured */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Featured Story
            </span>
            <Sparkles className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-lg font-bold text-white truncate">
            {featuredPost ? featuredPost.title : "None Selected"}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold">
            <Radio className="h-3 w-3 animate-pulse" />
            <span>Broadcasting Live</span>
          </div>
        </div>

        {/* Card 2: Total Published Posts */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Discoveries
            </span>
            <Layers className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-white">{totalPosts}</div>
          <div className="text-[11px] text-slate-500">Stored in repository</div>
        </div>

        {/* Card 3: Realtime Status */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Realtime Engine
            </span>
            <Radio className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">SSE Active</div>
          <div className="text-[11px] text-slate-500">Instant visitor dispatch</div>
        </div>

        {/* Card 4: Database Storage */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Database
            </span>
            <Database className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-lg font-bold text-white">PostgreSQL / Local</div>
          <div className="text-[11px] text-slate-500">Zero subscription cost</div>
        </div>
      </div>

      {/* Active Featured Showcase Banner */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base font-bold text-white uppercase tracking-wider">
              Currently Live on Public Homepage
            </h2>
          </div>
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            <span>View on Homepage</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>

        {featuredPost ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-slate-950/60 p-5 rounded-2xl border border-slate-800/80">
            <div className="md:col-span-4 aspect-[16/10] overflow-hidden rounded-xl bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featuredPost.imageUrl}
                alt={featuredPost.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="md:col-span-8 space-y-3">
              <div className="text-xs text-blue-400 font-semibold">
                Published on {new Date(featuredPost.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white">
                {featuredPost.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/80 p-4 rounded-xl border border-slate-800">
                {featuredPost.fact}
              </p>
              <div className="pt-2">
                <Link
                  href="/admin/dashboard/history"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300"
                >
                  <span>Switch or replace featured story</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            No featured post currently active.
          </div>
        )}
      </div>
    </div>
  );
}
