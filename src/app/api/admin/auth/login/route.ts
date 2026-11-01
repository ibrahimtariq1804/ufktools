import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { setAdminSession } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`login-${ip}`, {
      intervalMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 30, // 30 attempts max
    });

    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: "Too many login attempts. Please try again in a few minutes.",
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

    const cleanEmail = String(email).trim().toLowerCase();
    const defaultEmail = (process.env.ADMIN_EMAIL || "admin@ufktools.com").trim().toLowerCase();
    const defaultPassword = process.env.ADMIN_PASSWORD || "admin123";
    const isDefaultAdmin = cleanEmail === defaultEmail;
    const isDefaultPassword = password === defaultPassword;

    const admin = await db.getAdminByEmail(cleanEmail);
    let authenticatedAdmin = null;

    if (admin) {
      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (isMatch) {
        authenticatedAdmin = admin;
      } else if (isDefaultAdmin && isDefaultPassword) {
        // Self-heal: Admin exists in DB but stored password hash is out of sync or corrupted
        try {
          const repairedHash = await bcrypt.hash(defaultPassword, 10);
          await db.updateAdminPassword(admin.id, repairedHash);
          authenticatedAdmin = { ...admin, passwordHash: repairedHash };
        } catch {
          authenticatedAdmin = admin;
        }
      }
    } else if (isDefaultAdmin && isDefaultPassword) {
      // Auto-provision initial administrator in DB if missing
      try {
        const hash = await bcrypt.hash(defaultPassword, 10);
        authenticatedAdmin = await db.createAdmin({
          email: defaultEmail,
          passwordHash: hash,
          name: process.env.ADMIN_NAME || "UFK Administrator",
        });
      } catch (e) {
        console.error("Auto-provision error in login:", e);
      }
    }

    if (!authenticatedAdmin) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Create session cookie
    const session = await setAdminSession(
      authenticatedAdmin.id,
      authenticatedAdmin.email,
      authenticatedAdmin.name
    );
    try {
      await db.updateAdminLogin(authenticatedAdmin.id);
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
