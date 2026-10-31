"use client";

import { useState, useEffect } from "react";

export interface FeaturedPost {
  id: string;
  title: string;
  fact: string;
  imageUrl: string;
  thumbnailUrl?: string;
  youtubeUrl?: string;
  publishedAt: string;
  isFeatured: boolean;
}

const DEFAULT_DEMO_POST: FeaturedPost = {
  id: "post-seed-001",
  title: "The James Webb Space Telescope's Cosmic Marvel",
  fact: "Did you know? Light from galaxies captured in deep-field images by modern space observatories has traveled through space for over 13.4 billion years—originating shortly after the dawn of our universe itself.",
  imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop",
  youtubeUrl: "https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8",
  publishedAt: "2026-10-28T00:00:00.000Z",
  isFeatured: true,
};

export function useFeaturedPost(initialPost?: FeaturedPost | null) {
  const [post, setPost] = useState<FeaturedPost | null>(
    initialPost !== undefined ? initialPost : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(initialPost === undefined);

  useEffect(() => {
    let isMounted = true;

    // 1. Fetch latest post from database API
    fetch(`/api/featured?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data && "post" in data) {
          setPost(data.post || null);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    // 2. Connect to live real-time SSE stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/sse/featured-stream");

      eventSource.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === "NEW_FEATURED_POST") {
            setPost(data.post || null);
          }
        } catch {
          // Ignore parse errors on heartbeat
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch {
      // Browser does not support EventSource or offline
    }

    return () => {
      isMounted = false;
      eventSource?.close();
    };
  }, []);

  return { post, isLoading };
}
