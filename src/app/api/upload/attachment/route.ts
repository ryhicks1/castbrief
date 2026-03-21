import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === "media-attachments");
    if (!bucketExists) {
      await supabase.storage.createBucket("media-attachments", {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10MB
      });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin";
    const uniqueName = `${crypto.randomBytes(12).toString("base64url")}.${ext}`;
    const filePath = `attachments/${uniqueName}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("media-attachments")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json(
        { error: "Upload failed" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("media-attachments").getPublicUrl(filePath);

    return NextResponse.json({ url: publicUrl });
  } catch (error) {
    console.error("Attachment upload error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
