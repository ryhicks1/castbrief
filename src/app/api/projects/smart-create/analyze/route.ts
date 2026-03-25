import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePDF } from "@/lib/scripts/parser";
import { analyzeProjectDocuments } from "@/lib/scripts/analyze-project";

export const maxDuration = 120; // Allow up to 120s for multi-doc AI analysis

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
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    // Upload files to storage and extract text
    const texts: string[] = [];
    const uploadedFiles: Array<{ name: string; url: string }> = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload to storage
      const ext = file.name.split(".").pop() || "pdf";
      const storagePath = `documents/smart_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("media-attachments")
        .upload(storagePath, buffer, {
          contentType: file.type,
          upsert: false,
        });

      if (!uploadError) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("media-attachments").getPublicUrl(storagePath);
        uploadedFiles.push({ name: file.name, url: publicUrl });
      }

      // Extract text from PDF
      if (
        file.type === "application/pdf" ||
        file.type === "application/x-pdf"
      ) {
        try {
          const { text } = await parsePDF(buffer);
          if (text && text.trim().length > 50) {
            texts.push(`=== FILE: ${file.name} ===\n\n${text}`);
          }
        } catch (parseErr) {
          console.error(`Failed to parse ${file.name}:`, parseErr);
        }
      }
    }

    if (texts.length === 0) {
      return NextResponse.json(
        {
          error:
            "Could not extract text from any of the uploaded files. Please ensure they are readable PDFs.",
        },
        { status: 400 }
      );
    }

    // Analyze with AI
    const analysis = await analyzeProjectDocuments(texts);

    return NextResponse.json({
      analysis,
      uploadedFiles,
    });
  } catch (error: any) {
    console.error("Smart create analyze error:", error);
    return NextResponse.json(
      { error: error.message || "Document analysis failed" },
      { status: 500 }
    );
  }
}
