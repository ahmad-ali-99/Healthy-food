import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { db } from "@/lib/db";
import { MAX_IMAGE_SIZE_MB, THUMB_SIZE } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const slotId = parseInt(formData.get("slotId") as string);
    const email = formData.get("email") as string;
    const title = (formData.get("title") as string) || null;
    const linkUrl = (formData.get("linkUrl") as string) || null;
    const file = formData.get("image") as File | null;

    if (!file || !email || isNaN(slotId)) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate slot ownership
    const slot = await db.slot.findUnique({ where: { id: slotId } });
    if (!slot) return NextResponse.json({ error: "Slot not found" }, { status: 404 });
    if (slot.status !== "sold") {
      return NextResponse.json({ error: "Slot not purchased" }, { status: 403 });
    }
    if (slot.ownerEmail !== email) {
      return NextResponse.json({ error: "Not your slot" }, { status: 403 });
    }

    // Validate file size (8MB max)
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json({ error: `Image must be under ${MAX_IMAGE_SIZE_MB}MB` }, { status: 413 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const allowed = ["jpg", "jpeg", "png", "webp", "gif"];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: "Unsupported image format" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const thumbsDir = path.join(process.cwd(), "public", "thumbs");
    await mkdir(uploadsDir, { recursive: true });
    await mkdir(thumbsDir, { recursive: true });

    const filename = `${slotId}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save full image
    await writeFile(path.join(uploadsDir, filename), buffer);

    // Generate thumbnail with Sharp
    let thumbUrl = `/uploads/${filename}`;
    let dominantColor = "#1e1b4b";
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const sharp = require("sharp");
      const thumbFilename = `${slotId}.jpg`;
      const { data: thumbData } = await sharp(buffer)
        .resize(THUMB_SIZE, THUMB_SIZE, { fit: "cover" })
        .jpeg({ quality: 85 })
        .toBuffer({ resolveWithObject: true });

      await writeFile(path.join(thumbsDir, thumbFilename), thumbData);
      thumbUrl = `/thumbs/${thumbFilename}`;

      const { dominant } = await sharp(buffer).stats();
      dominantColor = `rgb(${dominant.r},${dominant.g},${dominant.b})`;
    } catch {
      // Sharp not available in all environments
    }

    await db.slot.update({
      where: { id: slotId },
      data: {
        imageUrl: `/uploads/${filename}`,
        thumbUrl,
        dominantColor,
        title,
        linkUrl,
      },
    });

    return NextResponse.json({ success: true, imageUrl: `/uploads/${filename}` });
  } catch (e: unknown) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
