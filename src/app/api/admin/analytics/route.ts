import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {

    const { searchParams } = new URL(request.url);
    const rangeParam = searchParams.get("range") || "7d";
    const range = (["today", "7d", "30d", "all"].includes(rangeParam)
      ? rangeParam
      : "7d") as "today" | "7d" | "30d" | "all";

    const data = await db.getAnalyticsSummary(range);

    return NextResponse.json({
      success: true,
      range,
      data,
    });
  } catch (error) {
    console.error("Admin analytics fetch error:", error);
    return NextResponse.json(
      { error: "Failed to compile analytics metrics." },
      { status: 500 }
    );
  }
}
