import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const ip = getClientIp(request);
    const limit = checkRateLimit(`password-change-${ip}`, {
      intervalMs: 15 * 60 * 1000,
      maxRequests: 5,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Too many password change attempts. Please try again later." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Both current password and new password are required." },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters long." },
        { status: 400 }
      );
    }

    const admin = await db.getAdminById(session.adminId);
    if (!admin) {
      return NextResponse.json({ error: "Administrator record not found." }, { status: 404 });
    }

    // Verify current password
    const isCurrentMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
    if (!isCurrentMatch) {
      return NextResponse.json(
        { error: "Current password does not match our records." },
        { status: 400 }
      );
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await db.updateAdminPassword(session.adminId, newPasswordHash);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully! Please use your new password for future sign-ins.",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to change password.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
