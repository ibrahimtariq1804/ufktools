import React from "react";
import { Metadata } from "next";
import { db } from "@/lib/db";
import { PictureOfTheDayClient } from "@/features/picture-of-day/PictureOfTheDayClient";


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
  const featuredPost = posts.find((p) => p.isFeatured) || posts[0] || null;
  const pastPosts = posts.filter((p) => p.id !== featuredPost?.id);

  const sanitize = (p: typeof featuredPost) =>
    p
      ? {
          id: p.id,
          title: p.title,
          fact: p.fact,
          imageUrl: p.imageUrl,
          thumbnailUrl: p.thumbnailUrl,
          youtubeUrl: p.youtubeUrl,
          publishedAt: p.publishedAt,
          isFeatured: p.isFeatured,
        }
      : null;

  return (
    <PictureOfTheDayClient
      initialFeaturedPost={sanitize(featuredPost)}
      initialPastPosts={pastPosts.map((p) => sanitize(p)!)}
    />
  );
}
