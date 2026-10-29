import { NextResponse } from "next/server";
import { getAdminSession, setAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const ip = getClientIp(request);
    const limit = checkRateLimit(`profile-update-${ip}`, {
      intervalMs: 60 * 1000,
      maxRequests: 10,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many profile update requests. Please wait a moment." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { name, email } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name must be at least 2 characters long." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const updatedAdmin = await db.updateAdminProfile(
      session.adminId,
      name.trim(),
      email.trim()
    );

    // Refresh the admin session cookie with the new email/name
    await setAdminSession(updatedAdmin.id, updatedAdmin.email, updatedAdmin.name);

    return NextResponse.json({
      success: true,
      message: "Admin profile updated successfully.",
      admin: {
        id: updatedAdmin.id,
        email: updatedAdmin.email,
        name: updatedAdmin.name,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update profile.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
