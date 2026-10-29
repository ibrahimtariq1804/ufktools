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
  id: "demo-post-1",
  title: "The F-35's Distributed Aperture System & Electro-Optical Targeting",
  fact: "The F-35's AN/AAQ-37 DAS uses six high-resolution infrared sensors embedded around the airframe to project a seamless 360-degree spherical thermal feed directly into the pilot's helmet visor—allowing aviators to look directly through the aircraft floor and track ballistic missile launches from over 800 miles away.",
  imageUrl: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?q=80&w=1200&auto=format&fit=crop",
  youtubeUrl: "https://youtube.com/@ufk?si=Td89kGB6O2X9L2W8",
  publishedAt: "2026-10-28T00:00:00.000Z",
  isFeatured: true,
};

export function useFeaturedPost(initialPost?: FeaturedPost | null) {
  const [post, setPost] = useState<FeaturedPost>(initialPost || DEFAULT_DEMO_POST);

  useEffect(() => {
    // 1. Fetch latest post from database API
    fetch("/api/featured")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.post) {
          setPost(data.post);
        }
      })
      .catch(() => {});

    // 2. Connect to live real-time SSE stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/sse/featured-stream");

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === "NEW_FEATURED_POST" && data.post) {
            setPost(data.post);
          }
        } catch {
          // Ignore parse errors on heartbeat
        }
      };

      eventSource.onerror = () => {
        // SSE disconnected or endpoint not yet active (Phase 1)
        eventSource?.close();
      };
    } catch {
      // Browser does not support EventSource or offline
    }

    return () => {
      eventSource?.close();
    };
  }, []);

  return { post };
}
