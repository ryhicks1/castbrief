import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseScript } from "@/lib/scripts/parser";
import { analyzeScript } from "@/lib/scripts/analyze";

export const maxDuration = 60; // Allow up to 60s for AI analysis

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
    const projectId = formData.get("project_id") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!projectId) {
      return NextResponse.json(
        { error: "project_id required" },
        { status: 400 }
      );
    }

    // Verify project ownership
    const { data: project } = await supabase
      .from("projects")
      .select("id, client_id")
      .eq("id", projectId)
      .single();

    if (!project || project.client_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse the script file
    const buffer = Buffer.from(await file.arrayBuffer());
    const { text, numPages } = await parseScript(buffer, file.type);

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: "Could not extract sufficient text from the file" },
        { status: 400 }
      );
    }

    // Upload the original script to storage for later use
    const ext = file.name.split(".").pop() || "pdf";
    const storagePath = `documents/script_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("media-attachments")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    let scriptUrl = "";
    if (!uploadError) {
      const {
        data: { publicUrl },
      } = supabase.storage.from("media-attachments").getPublicUrl(storagePath);
      scriptUrl = publicUrl;
    }

    // Analyze with AI
    const breakdown = await analyzeScript(text);

    return NextResponse.json({
      ...breakdown,
      numPages,
      scriptUrl,
      scriptFileName: file.name,
    });
  } catch (error: any) {
    console.error("Script breakdown error:", error);
    return NextResponse.json(
      { error: error.message || "Script analysis failed" },
      { status: 500 }
    );
  }
}
