import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Creates a signed upload URL for direct browser-to-storage uploads.
 * Bypasses Vercel's 4.5MB body limit by letting the browser upload
 * directly to Supabase Storage.
 */
export async function POST(request: Request) {
  try {
    const { fileName, contentType, token } = await request.json();

    if (!fileName) {
      return NextResponse.json({ error: "fileName required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Generate a unique path
    const ext = fileName.split(".").pop() || "mp4";
    const timestamp = Date.now();
    const random = Math.random().toString(36).slice(2, 8);
    const path = `attachments/self-tapes/${token || "anon"}_${timestamp}_${random}.${ext}`;

    // Create signed upload URL (valid for 10 minutes)
    const { data, error } = await supabase.storage
      .from("media-attachments")
      .createSignedUploadUrl(path);

    if (error) {
      console.error("Signed URL error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get the public URL for after upload
    const { data: publicData } = supabase.storage
      .from("media-attachments")
      .getPublicUrl(path);

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl: publicData.publicUrl,
    });
  } catch (error) {
    console.error("Signed URL creation error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
