import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const _url = request.url;
    const post = await db.getFeaturedPost();
    if (!post) {
      return NextResponse.json(
        { post: null },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    return NextResponse.json(
      {
        post: {
          id: post.id,
          title: post.title,
          fact: post.fact,
          imageUrl: post.imageUrl,
          thumbnailUrl: post.thumbnailUrl,
          youtubeUrl: post.youtubeUrl,
          publishedAt: post.publishedAt,
          isFeatured: post.isFeatured,
        },
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
