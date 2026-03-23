import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { PDFDocument, rgb, degrees, StandardFonts } from "pdf-lib";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch document record
    const { data: doc } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .single();

    if (!doc) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const watermark = searchParams.get("watermark");

    // If no watermark or not a PDF, redirect to storage URL
    if (!watermark || doc.file_type !== "pdf") {
      return NextResponse.redirect(doc.url);
    }

    // Fetch the PDF from storage
    const pdfResponse = await fetch(doc.url);
    if (!pdfResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch PDF" },
        { status: 500 }
      );
    }

    const pdfBytes = await pdfResponse.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();

    for (const page of pages) {
      const { width, height } = page.getSize();
      const fontSize = Math.min(width, height) * 0.06;
      const textWidth = font.widthOfTextAtSize(watermark, fontSize);

      // Draw diagonal watermark text across the page
      // Center it on the page
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

      // Add a second watermark offset for better coverage
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
    console.error("Document download error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
