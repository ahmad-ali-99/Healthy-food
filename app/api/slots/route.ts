import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const x1 = parseInt(searchParams.get("x1") ?? "0");
  const y1 = parseInt(searchParams.get("y1") ?? "0");
  const x2 = parseInt(searchParams.get("x2") ?? "100");
  const y2 = parseInt(searchParams.get("y2") ?? "100");

  // Clamp to grid bounds and limit viewport size
  const c1 = Math.max(0, x1);
  const r1 = Math.max(0, y1);
  const c2 = Math.min(999, x2);
  const r2 = Math.min(999, y2);

  if (c2 - c1 > 250 || r2 - r1 > 250) {
    return NextResponse.json({ error: "Viewport too large" }, { status: 400 });
  }

  try {
    const slots = await db.slot.findMany({
      where: {
        col: { gte: c1, lte: c2 },
        row: { gte: r1, lte: r2 },
        status: { not: "available" }, // only return non-empty slots to reduce payload
      },
      select: {
        id: true,
        row: true,
        col: true,
        status: true,
        title: true,
        linkUrl: true,
        thumbUrl: true,
        imageUrl: true,
        dominantColor: true,
      },
    });

    return NextResponse.json(slots, {
      headers: { "Cache-Control": "public, max-age=30, stale-while-revalidate=60" },
    });
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}
