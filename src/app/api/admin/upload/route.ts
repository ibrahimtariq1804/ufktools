import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { getAdminSession } from "@/lib/auth/session";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const limit = checkRateLimit(`upload-${ip}`, {
      intervalMs: 60 * 1000,
      maxRequests: 20,
    });

    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Upload rate limit reached. Please wait a moment." },
        { status: 429 }
      );
    }

    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid image format. Supported formats: JPG, PNG, and WebP." },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds maximum allowed size of 10 MB." },
        { status: 400 }
      );
    }

    // Derive safe extension
    let extension = "jpg";
    if (file.type === "image/png") extension = "png";
    if (file.type === "image/webp") extension = "webp";

    const uniqueFilename = `${crypto.randomUUID()}.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Option 1: ImgBB Cloud Upload if API key is provided
    if (process.env.IMGBB_API_KEY) {
      try {
        const imgbbForm = new FormData();
        imgbbForm.append("image", buffer.toString("base64"));
        const imgbbRes = await fetch(
          `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
          {
            method: "POST",
            body: imgbbForm,
            signal: AbortSignal.timeout(8000),
          }
        );
        if (imgbbRes.ok) {
          const imgbbData = await imgbbRes.json();
          if (imgbbData?.data?.url) {
            return NextResponse.json({
              success: true,
              url: imgbbData.data.url,
              filename: uniqueFilename,
              size: file.size,
            });
          }
        }
      } catch (imgbbErr) {
        console.warn("ImgBB upload failed, trying next strategy:", imgbbErr);
      }
    }

    // Option 2: Local Disk Storage if filesystem is writable (Local Dev, Docker, VPS)
    let isLocalDiskWritable = false;
    const uploadDir = path.join(process.cwd(), "public", "uploads", "featured");
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const testFile = path.join(uploadDir, `.test-write-${Date.now()}`);
      fs.writeFileSync(testFile, "test");
      fs.unlinkSync(testFile);
      isLocalDiskWritable = true;
    } catch {
      isLocalDiskWritable = false;
    }

    if (isLocalDiskWritable) {
      try {
        const targetFilePath = path.join(uploadDir, uniqueFilename);
        fs.writeFileSync(targetFilePath, buffer);
        const publicUrl = `/uploads/featured/${uniqueFilename}`;
        return NextResponse.json({
          success: true,
          url: publicUrl,
          filename: uniqueFilename,
          size: file.size,
        });
      } catch (writeErr) {
        console.warn("Local disk write error, falling back to cloud/data URI:", writeErr);
      }
    }

    // Option 3: Serverless Cloud Upload (Catbox.moe permanent free hosting)
    try {
      const catboxForm = new FormData();
      catboxForm.append("reqtype", "fileupload");
      const blob = new Blob([buffer], { type: file.type || "image/jpeg" });
      catboxForm.append("fileToUpload", blob, uniqueFilename);

      const catboxRes = await fetch("https://catbox.moe/user/api.php", {
        method: "POST",
        body: catboxForm,
        signal: AbortSignal.timeout(10000),
      });

      if (catboxRes.ok) {
        const directUrl = (await catboxRes.text()).trim();
        if (directUrl.startsWith("http")) {
          return NextResponse.json({
            success: true,
            url: directUrl,
            filename: uniqueFilename,
            size: file.size,
          });
        }
      }
    } catch (catboxErr) {
      console.warn("Catbox cloud upload error, falling back to Base64 Data URI:", catboxErr);
    }

    // Option 4: Zero-dependency Serverless Base64 Data URI (100% resilient fallback)
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";
    const dataUri = `data:${mimeType};base64,${base64Data}`;

    return NextResponse.json({
      success: true,
      url: dataUri,
      filename: uniqueFilename,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image. Please check file format and try again." },
      { status: 500 }
    );
  }
}
