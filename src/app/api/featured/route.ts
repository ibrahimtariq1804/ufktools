import { NextResponse } from "next/server";
import { db } from "@/lib/db";



export async function GET() {
  try {
    const post = await db.getFeaturedPost();
    if (!post) {
      return NextResponse.json({ post: null });
    }

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Fetch featured post error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve featured post." },
      { status: 500 }
    );
  }
}
