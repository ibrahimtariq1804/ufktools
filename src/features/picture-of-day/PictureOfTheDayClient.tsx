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
  Heart,
  Share2,
  Copy,
  Check,
  CheckCircle2,
} from "lucide-react";
import {
  YoutubeIcon,
  FacebookIcon,
  XTwitterIcon,
  InstagramIcon,
} from "@/components/ui/BrandIcons";
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

  // Likes tracking
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const [localLikes, setLocalLikes] = useState<Record<string, number>>({});

  // Share UI states
  const [copiedLink, setCopiedLink] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize liked state from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem("ufk_liked_posts_map");
      if (stored) {
        setLikedPosts(JSON.parse(stored));
      }
    } catch {}
  }, []);

  // Sync initial likes
  useEffect(() => {
    const map: Record<string, number> = {};
    if (featuredPost) {
      map[featuredPost.id] = featuredPost.likes ?? 0;
    }
    pastPosts.forEach((p) => {
      map[p.id] = p.likes ?? 0;
    });
    setLocalLikes((prev) => ({ ...map, ...prev }));
  }, [featuredPost, pastPosts]);

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

    fetchLatest();

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
        } catch {}
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {}

    return () => {
      isMounted = false;
      eventSource?.close();
    };
  }, []);

  const handleLike = async (postId: string) => {
    if (likedPosts[postId]) {
      setToastMessage("You already liked this story! Thank you for the support.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    // Optimistic UI update
    setLikedPosts((prev) => {
      const next = { ...prev, [postId]: true };
      try {
        localStorage.setItem("ufk_liked_posts_map", JSON.stringify(next));
      } catch {}
      return next;
    });

    setLocalLikes((prev) => ({
      ...prev,
      [postId]: (prev[postId] || 0) + 1,
    }));

    try {
      const res = await fetch(`/api/featured/${postId}/like`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        if (typeof data.likes === "number") {
          setLocalLikes((prev) => ({ ...prev, [postId]: data.likes }));
        }
      }
    } catch (err) {
      console.warn("Failed to submit like:", err);
    }
  };

  const shareFacebook = (post: FeaturedPost) => {
    const url = typeof window !== "undefined" ? window.location.href : "https://ufktools.com/picture-of-the-day";
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=500"
    );
  };

  const shareXTwitter = (post: FeaturedPost) => {
    const url = typeof window !== "undefined" ? window.location.href : "https://ufktools.com/picture-of-the-day";
    const text = `Did you know? ${post.title} — Defense & aerospace intelligence by @ufk`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer,width=600,height=500"
    );
  };

  const shareInstagram = (post: FeaturedPost) => {
    const url = typeof window !== "undefined" ? window.location.href : "https://ufktools.com/picture-of-the-day";
    const textToCopy = `${post.title}\n\nDid You Know?\n${post.fact}\n\nExplore daily defense & aerospace facts: ${url}`;

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setToastMessage("Caption & link copied! Open Instagram to paste in your Story or DM.");
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setToastMessage("Link copied to clipboard!");
      setTimeout(() => {
        setCopiedLink(false);
        setToastMessage(null), 3000;
      }, 2500);
    }
  };

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

        {/* Global Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-2xl bg-slate-900 text-white border border-slate-700 px-5 py-3 shadow-2xl text-xs sm:text-sm animate-in fade-in slide-in-from-bottom-3 duration-300">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Live Featured Item Showcase */}
        {featuredPost ? (
          <div className="rounded-2xl sm:rounded-3xl bg-white shadow-xl border border-slate-200 overflow-hidden mb-12 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
              {/* Image Column */}
              <div className="lg:col-span-7 h-80 sm:h-[30rem] lg:h-auto lg:min-h-[30rem] overflow-hidden bg-slate-900 group relative">
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
              <div className="lg:col-span-5 p-6 sm:p-8 lg:p-9 flex flex-col justify-between">
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

                  {/* Like & Engagement Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleLike(featuredPost.id)}
                      className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all shadow-sm ${
                        likedPosts[featuredPost.id]
                          ? "bg-rose-50 text-rose-600 border border-rose-300 ring-2 ring-rose-200/60"
                          : "bg-white text-slate-700 border border-slate-200 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50/40"
                      }`}
                      title={likedPosts[featuredPost.id] ? "You liked this post" : "Like this discovery"}
                    >
                      <Heart
                        className={`h-4 w-4 transition-transform active:scale-125 ${
                          likedPosts[featuredPost.id] ? "fill-rose-500 text-rose-500" : "text-slate-400"
                        }`}
                      />
                      <span>{likedPosts[featuredPost.id] ? "Liked" : "Like"}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-extrabold text-slate-700">
                        {localLikes[featuredPost.id] ?? (featuredPost.likes || 0)}
                      </span>
                    </button>

                    {/* Social Share Buttons */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
                        Share:
                      </span>

                      {/* Facebook */}
                      <button
                        type="button"
                        onClick={() => shareFacebook(featuredPost)}
                        title="Share on Facebook"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-xs"
                      >
                        <FacebookIcon className="h-4 w-4" />
                      </button>

                      {/* X / Twitter */}
                      <button
                        type="button"
                        onClick={() => shareXTwitter(featuredPost)}
                        title="Share on X (Twitter)"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-900 hover:bg-black hover:text-white transition-all shadow-xs"
                      >
                        <XTwitterIcon className="h-3.5 w-3.5" />
                      </button>

                      {/* Instagram */}
                      <button
                        type="button"
                        onClick={() => shareInstagram(featuredPost)}
                        title="Share on Instagram (Copies Story Caption & Link)"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white hover:opacity-90 transition-all shadow-xs"
                      >
                        <InstagramIcon className="h-4 w-4" />
                      </button>

                      {/* Copy Link */}
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        title="Copy direct story link"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all shadow-xs"
                      >
                        {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
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

                    <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLike(item.id)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                            likedPosts[item.id]
                              ? "bg-rose-50 text-rose-600 border border-rose-200"
                              : "bg-slate-50 text-slate-600 hover:text-rose-600 hover:bg-rose-50"
                          }`}
                        >
                          <Heart
                            className={`h-3.5 w-3.5 ${
                              likedPosts[item.id] ? "fill-rose-500 text-rose-500" : "text-slate-400"
                            }`}
                          />
                          <span>{localLikes[item.id] ?? (item.likes || 0)}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => shareFacebook(item)}
                          title="Share to Facebook"
                          className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                          <FacebookIcon className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => shareXTwitter(item)}
                          title="Share to X"
                          className="p-1 rounded-md text-slate-400 hover:text-black hover:bg-slate-100 transition-colors"
                        >
                          <XTwitterIcon className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => shareInstagram(item)}
                          title="Share to Instagram"
                          className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <InstagramIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>

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
