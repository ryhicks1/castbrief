import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const project_id = searchParams.get("project_id");
    const role_id = searchParams.get("role_id");

    let query = supabase.from("documents").select("*");
    if (project_id) query = query.eq("project_id", project_id);
    if (role_id) query = query.eq("role_id", role_id);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Documents GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const name = formData.get("name") as string | null;
    const project_id = formData.get("project_id") as string | null;
    const role_id = formData.get("role_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Ensure bucket exists
    const { data: buckets } = await admin.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === "media-attachments");
    if (!bucketExists) {
      await admin.storage.createBucket("media-attachments", {
        public: true,
        fileSizeLimit: 25 * 1024 * 1024,
      });
    }

    // Generate unique filename
    const ext = file.name.split(".").pop() || "bin";
    const uniqueName = `${crypto.randomBytes(12).toString("base64url")}.${ext}`;
    const filePath = `documents/${uniqueName}`;

    // Upload file
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await admin.storage
      .from("media-attachments")
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Document upload error:", uploadError);
      return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("media-attachments").getPublicUrl(filePath);

    // Determine file_type from extension
    const fileType = ext.toLowerCase();

    // Insert document record
    const { data: doc, error: insertError } = await supabase
      .from("documents")
      .insert({
        project_id: project_id || null,
        role_id: role_id || null,
        name: name || file.name,
        url: publicUrl,
        file_type: fileType,
        size_bytes: file.size,
        created_by: user.id,
      })
      .select("*")
      .single();

    if (insertError) {
      console.error("Document insert error:", insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(doc);
  } catch (error) {
    console.error("Documents POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing document id" },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: doc } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("created_by", user.id)
      .single();

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Delete from storage
    if (doc.url) {
      const admin = createAdminClient();
      // Extract storage path from URL
      const urlParts = doc.url.split("/media-attachments/");
      if (urlParts.length > 1) {
        const storagePath = urlParts[1];
        await admin.storage.from("media-attachments").remove([storagePath]);
      }
    }

    // Delete from DB
    const { error } = await supabase.from("documents").delete().eq("id", id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Documents DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
