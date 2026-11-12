import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`like-${ip}`, {
      intervalMs: 60 * 1000,
      maxRequests: 30,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Post ID is required." }, { status: 400 });
    }

    const likes = await db.likePost(id);

    return NextResponse.json({
      success: true,
      likes,
    });
  } catch (error) {
    console.error("Like post error:", error);
    return NextResponse.json({ error: "Failed to record like." }, { status: 500 });
  }
}

