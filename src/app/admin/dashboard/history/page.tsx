"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Trash2,
  Radio,
  Calendar,
  Check,
  PlusCircle,
  RefreshCw,
} from "lucide-react";
import { FeaturedPostRecord } from "@/lib/db";

export default function HistoryPage() {
  const [posts, setPosts] = useState<FeaturedPostRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadPosts = () => {
    setIsLoading(true);
    fetch("/api/admin/featured")
      .then((res) => res.json())
      .then((data) => setPosts(data.posts || []))
      .catch((err) => console.error("Failed to load history:", err))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    let ignore = false;

    fetch("/api/admin/featured")
      .then((res) => res.json())
      .then((data) => {
        if (!ignore) {
          setPosts(data.posts || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error("Failed to load history:", err);
          setIsLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleSetFeatured = async (id: string, title: string) => {
    try {
      const res = await fetch(`/api/admin/featured/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_featured" }),
      });

      if (res.ok) {
        setActionMessage(
          `"${title}" is now the active featured story! Broadcasted live to all open homepages.`
        );
        loadPosts();
        setTimeout(() => setActionMessage(null), 3500);
      }
    } catch (err) {
      console.error("Failed to set featured:", err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/featured/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setActionMessage(`"${title}" deleted successfully.`);
        loadPosts();
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Publication History & Featured Selector
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Choose which story is featured on the homepage, or delete past entries. Only 1 story is featured at a time.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadPosts}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <Link
            href="/admin/dashboard/manage-featured"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Post</span>
          </Link>
        </div>
      </div>

      {actionMessage && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-950/70 border border-emerald-800 p-4 text-xs sm:text-sm text-emerald-200 animate-in fade-in">
          <Check className="h-5 w-5 shrink-0 text-emerald-400" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* History Cards List */}
      <div className="space-y-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              className={`rounded-2xl p-5 border transition-all ${
                post.isFeatured
                  ? "bg-slate-900/90 border-blue-500/60 ring-2 ring-blue-500/20"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                {/* Image & Text Preview */}
                <div className="flex items-start gap-4">
                  <div className="h-20 w-28 shrink-0 rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {post.isFeatured ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-800">
                          <Radio className="h-2.5 w-2.5 animate-pulse text-emerald-400" />
                          Currently Featured on Homepage
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-[11px] font-semibold text-slate-400">
                          Archived
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-slate-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white">{post.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 max-w-2xl leading-relaxed">
                      {post.fact}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                  {!post.isFeatured && (
                    <button
                      onClick={() => handleSetFeatured(post.id, post.title)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-blue-600/20 transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Set as Featured</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(post.id, post.title)}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 border border-slate-700/80 transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-slate-500 rounded-2xl bg-slate-900 border border-slate-800">
            No published posts in history.
          </div>
        )}
      </div>
    </div>
  );
}
