import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { broadcastFeaturedUpdate } from "@/lib/sse/broadcaster";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const posts = await db.getAllPosts();
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const body = await request.json();
    const { title, fact, imageUrl, imageFilename, youtubeUrl, isFeatured } = body;

    if (!title || !fact || !imageUrl) {
      return NextResponse.json(
        { error: "Title, fact description, and an uploaded image are required." },
        { status: 400 }
      );
    }

    const newPost = await db.createPost({
      title: title.trim(),
      fact: fact.trim(),
      imageUrl: imageUrl.trim(),
      imageFilename: imageFilename || "featured-image.jpg",
      youtubeUrl: youtubeUrl ? String(youtubeUrl).trim() : undefined,
      isFeatured: Boolean(isFeatured),
      createdBy: session.adminId,
    });

    // If marked featured, broadcast immediately to all live visitors
    if (newPost.isFeatured) {
      broadcastFeaturedUpdate(newPost);
    }

    return NextResponse.json({
      success: true,
      post: newPost,
    });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json(
      { error: "Failed to publish featured post." },
      { status: 500 }
    );
  }
}
