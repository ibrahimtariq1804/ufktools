import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setAdminSession } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`login-${ip}`, {
      intervalMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5, // 5 attempts max
    });

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again after 15 minutes.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const admin = await db.getAdminByEmail(email);
    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Create session cookie
    const session = await setAdminSession(admin.id, admin.email, admin.name);
    await db.updateAdminLogin(admin.id);

    return NextResponse.json({
      success: true,
      admin: {
        id: session.adminId,
        email: session.email,
        name: session.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected authentication error occurred." },
      { status: 500 }
    );
  }
}
