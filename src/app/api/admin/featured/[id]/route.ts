import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { broadcastFeaturedUpdate } from "@/lib/sse/broadcaster";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    if (action === "set_featured") {
      const updated = await db.setFeaturedPost(id);
      if (!updated) {
        return NextResponse.json({ error: "Post not found." }, { status: 404 });
      }

      // Live broadcast to all active visitors
      broadcastFeaturedUpdate(updated);

      // Invalidate static / PPR cache across the site
      try {
        revalidatePath("/");
        revalidatePath("/picture-of-the-day");
        revalidatePath("/admin/dashboard");
        revalidatePath("/admin/dashboard/history");
      } catch (e) {
        console.warn("Revalidation error:", e);
      }

      return NextResponse.json(
        {
          success: true,
          post: updated,
        },
        { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
      );
    }

    return NextResponse.json({ error: "Unsupported action." }, { status: 400 });
  } catch (error) {
    console.error("Patch post error:", error);
    return NextResponse.json(
      { error: "Failed to update post." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const { id } = await params;
    const deleted = await db.deletePost(id);

    if (!deleted) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    // Invalidate static / PPR cache across the site immediately
    try {
      revalidatePath("/");
      revalidatePath("/picture-of-the-day");
      revalidatePath("/admin/dashboard");
      revalidatePath("/admin/dashboard/history");
    } catch (e) {
      console.warn("Revalidation error:", e);
    }

    // Broadcast current featured post update (or null if all posts deleted) to all active live homepage visitors
    const currentFeatured = await db.getFeaturedPost();
    broadcastFeaturedUpdate(currentFeatured);

    return NextResponse.json(
      { success: true, message: "Post deleted successfully.", featuredPost: currentFeatured },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json(
      { error: "Failed to delete post." },
      { status: 500 }
    );
  }
}
