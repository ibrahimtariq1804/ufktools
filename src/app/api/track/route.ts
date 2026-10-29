import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";

// Helper to extract client IP reliably
function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "127.0.0.1";
}

// User-Agent parser for device, browser, and OS
function parseUserAgent(ua: string) {
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    deviceType = "tablet";
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    deviceType = "mobile";
  }

  let browser = "Unknown";
  if (/Edg/i.test(ua)) browser = "Edge";
  else if (/Chrome/i.test(ua)) browser = "Chrome";
  else if (/Safari/i.test(ua)) browser = "Safari";
  else if (/Firefox/i.test(ua)) browser = "Firefox";
  else if (/MSIE|Trident/i.test(ua)) browser = "IE";

  let os = "Unknown";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  return { deviceType, browser, os };
}

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body might be empty or beacon text
    }

    const {
      eventType = "pageview",
      path = "/",
      toolSlug,
      action,
      referrer: clientReferrer,
    } = body;

    // Vercel Edge Geolocation Headers
    const countryCode =
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("cf-ipcountry") ||
      "UNKNOWN";
    const city = req.headers.get("x-vercel-ip-city") || "Unknown";
    const region = req.headers.get("x-vercel-ip-country-region") || "Unknown";

    // Client IP & User Agent
    const clientIp = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "";
    const parsedUa = parseUserAgent(userAgent);

    // Referrer
    const headerReferrer = req.headers.get("referer");
    let referrer = clientReferrer || headerReferrer || "direct";
    try {
      if (referrer.startsWith("http")) {
        const url = new URL(referrer);
        referrer = url.hostname.replace(/^www\./, "");
      }
    } catch {
      // keep raw string if invalid URL
    }

    // Anonymized Salted Visitor Hash (rotates daily, zero raw PII stored)
    const today = new Date().toISOString().slice(0, 10);
    const visitorHash = crypto
      .createHash("sha256")
      .update(`${clientIp}-${userAgent}-${today}-ufk-analytics-salt`)
      .digest("hex")
      .slice(0, 16);

    // Save event asynchronously
    await db.recordAnalyticsEvent({
      eventType: eventType === "tool_action" ? "tool_action" : "pageview",
      path: typeof path === "string" ? path.slice(0, 255) : "/",
      toolSlug: typeof toolSlug === "string" ? toolSlug.slice(0, 100) : undefined,
      action: typeof action === "string" ? action.slice(0, 100) : undefined,
      countryCode: countryCode.toUpperCase().slice(0, 10),
      city: decodeURIComponent(city).slice(0, 100),
      region: decodeURIComponent(region).slice(0, 100),
      deviceType: parsedUa.deviceType,
      browser: parsedUa.browser,
      os: parsedUa.os,
      referrer: referrer.slice(0, 255),
      visitorHash,
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Analytics tracking error:", error);
    // Never fail client tracking request with error status
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
