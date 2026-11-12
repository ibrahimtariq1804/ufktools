import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const _url = request.url;
    const posts = await db.getAllPosts();
    const featuredPost = posts.find((p) => p.isFeatured) || posts[0] || null;
    const pastPosts = posts.filter((p) => p.id !== featuredPost?.id);

    const sanitizePost = (p: typeof featuredPost) =>
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
            likes: p.likes ?? 0,
          }
        : null;

    return NextResponse.json(
      {
        database: db.isPostgresConnected() ? "postgres" : "local-ephemeral",
        post: sanitizePost(featuredPost),
        posts: posts.map((p) => sanitizePost(p)!),
        pastPosts: pastPosts.map((p) => sanitizePost(p)!),
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
      }
    );
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      String((error as { digest?: string }).digest).startsWith("NEXT_")
    ) {
      throw error;
    }
    console.error("Fetch featured post error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve featured post." },
      { status: 500 }
    );
  }
}
