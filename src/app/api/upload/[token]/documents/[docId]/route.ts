import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

/**
 * Public document download for the upload portal.
 * Validates the upload token, then serves the document with optional watermark.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string; docId: string }> }
) {
  try {
    const { token, docId } = await params;
    const supabase = createAdminClient();

    // Validate the upload token exists
    const { data: pt, error: ptError } = await supabase
      .from("package_talents")
      .select("id, package_id, talents(email)")
      .eq("upload_token", token)
      .single();

    if (ptError || !pt) {
      return NextResponse.json({ error: "Invalid upload link" }, { status: 404 });
    }

    // Fetch the document
    const { data: doc } = await supabase
      .from("documents")
      .select("*")
      .eq("id", docId)
      .single();

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const watermark = searchParams.get("watermark");

    // If no watermark or not a PDF, redirect to the file URL
    if (!watermark || doc.file_type !== "pdf") {
      return NextResponse.redirect(doc.url);
    }

    // Fetch the PDF and apply watermark
    const pdfResponse = await fetch(doc.url);
    if (!pdfResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch PDF" }, { status: 500 });
    }

    const pdfBytes = await pdfResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = Math.min(width, height) * 0.06;
      const textWidth = font.widthOfTextAtSize(watermark, fontSize);

      const x = (width - textWidth * Math.cos(Math.PI / 4)) / 2;
      const y = height / 2 - (textWidth * Math.sin(Math.PI / 4)) / 2;

      page.drawText(watermark, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.1,
        rotate: degrees(45),
      });

      page.drawText(watermark, {
        x: x - width * 0.2,
        y: y + height * 0.25,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.08,
        rotate: degrees(45),
      });

      page.drawText(watermark, {
        x: x + width * 0.15,
        y: y - height * 0.25,
        size: fontSize,
        font,
        color: rgb(0.5, 0.5, 0.5),
        opacity: 0.08,
        rotate: degrees(45),
      });
    }

    const modifiedPdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(modifiedPdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${doc.name || "document"}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Public document download error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
