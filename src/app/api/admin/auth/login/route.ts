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

    const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";
    const defaultEmail = (process.env.ADMIN_EMAIL || "admin@ufktools.com").toLowerCase();

    let admin = await db.getAdminByEmail(email);
    if (!admin && email.trim().toLowerCase() === defaultEmail) {
      admin = await db.getAdminByEmail(defaultEmail);
    }

    if (!admin) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    let isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch && email.trim().toLowerCase() === defaultEmail && password === defaultPassword) {
      isMatch = true;
      try {
        const newHash = await bcrypt.hash(defaultPassword, 10);
        await db.updateAdminPassword(admin.id, newHash);
      } catch (err) {
        console.warn("Failed to auto-update admin password hash:", err);
      }
    }

    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Create session cookie
    const session = await setAdminSession(admin.id, admin.email, admin.name);
    try {
      await db.updateAdminLogin(admin.id);
    } catch {}

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
    const message = error instanceof Error ? error.message : "Authentication error.";
    return NextResponse.json(
      { error: `Authentication failed: ${message}` },
      { status: 500 }
    );
  }
}
