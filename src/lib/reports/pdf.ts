import jsPDF from "jspdf";
import "jspdf-autotable";
import type { TalentReportRow } from "./csv";

// Extend jsPDF type for autotable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number };
  }
}

interface ReportMetadata {
  title: string;
  subtitle?: string;
  projectName?: string;
  roleName?: string;
  agencyName?: string;
  generatedFor?: string;
}

async function fetchImageAsBase64(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    const contentType = res.headers.get("content-type") || "image/jpeg";
    return `data:${contentType};base64,${base64}`;
  } catch {
    return null;
  }
}

export async function generateTalentPDF(
  talents: (TalentReportRow & { photo_url?: string | null })[],
  metadata: ReportMetadata
): Promise<Uint8Array> {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;

  // Pre-fetch all photos
  const photoCache = new Map<string, string | null>();
  await Promise.all(
    talents.map(async (t) => {
      if (t.photo_url) {
        const data = await fetchImageAsBase64(t.photo_url);
        photoCache.set(t.photo_url, data);
      }
    })
  );

  function drawHeader(pageNum: number, totalPages: number) {
    // Header bar
    doc.setFillColor(15, 15, 18); // #0F0F12
    doc.rect(0, 0, pageWidth, 18, "F");

    // Brand
    doc.setTextColor(184, 150, 76); // #B8964C
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CastingBrief", margin, 12);

    // Title
    doc.setTextColor(232, 227, 216); // #E8E3D8
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const titleText = metadata.title;
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, pageWidth / 2 - titleWidth / 2, 12);

    // Date
    doc.setTextColor(139, 141, 147); // #8B8D93
    doc.setFontSize(8);
    const dateStr = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), 12);

    // Subtitle / metadata line
    if (metadata.subtitle || metadata.projectName || metadata.roleName) {
      doc.setFillColor(22, 25, 32); // #161920
      doc.rect(0, 18, pageWidth, 8, "F");
      doc.setTextColor(139, 141, 147);
      doc.setFontSize(8);
      const parts = [
        metadata.projectName && `Project: ${metadata.projectName}`,
        metadata.roleName && `Role: ${metadata.roleName}`,
        metadata.agencyName && `Agency: ${metadata.agencyName}`,
        metadata.generatedFor && `For: ${metadata.generatedFor}`,
        metadata.subtitle,
      ].filter(Boolean);
      doc.text(parts.join("  |  "), margin, 23.5);
    }

    // Footer
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.text(
      `Page ${pageNum} of ${totalPages}`,
      pageWidth - margin - 20,
      pageHeight - 5
    );
  }

  // Calculate layout
  const headerHeight = metadata.subtitle || metadata.projectName ? 30 : 22;
  const cardWidth = (pageWidth - margin * 3) / 2;
  const cardHeight = 50;
  const cardsPerPage = Math.floor((pageHeight - headerHeight - 10) / (cardHeight + 4)) * 2;
  const totalPages = Math.ceil(talents.length / cardsPerPage);

  let currentPage = 1;
  let talentIndex = 0;

  while (talentIndex < talents.length) {
    if (currentPage > 1) doc.addPage();
    drawHeader(currentPage, totalPages || 1);

    const startY = headerHeight + 4;
    let col = 0;
    let row = 0;

    while (talentIndex < talents.length) {
      const x = margin + col * (cardWidth + margin);
      const y = startY + row * (cardHeight + 4);

      if (y + cardHeight > pageHeight - 10) break;

      const t = talents[talentIndex];

      // Card background
      doc.setFillColor(19, 21, 26); // #13151A
      doc.setDrawColor(30, 33, 40); // #1E2128
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, "FD");

      // Photo
      const photoSize = 38;
      const photoX = x + 3;
      const photoY = y + 6;

      if (t.photo_url && photoCache.get(t.photo_url)) {
        try {
          doc.addImage(
            photoCache.get(t.photo_url)!,
            "JPEG",
            photoX,
            photoY,
            photoSize,
            photoSize
          );
        } catch {
          // Draw placeholder
          doc.setFillColor(30, 33, 40);
          doc.rect(photoX, photoY, photoSize, photoSize, "F");
        }
      } else {
        doc.setFillColor(30, 33, 40);
        doc.rect(photoX, photoY, photoSize, photoSize, "F");
        doc.setTextColor(139, 141, 147);
        doc.setFontSize(16);
        const initials = (t.full_name || "?")
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        doc.text(initials, photoX + photoSize / 2 - 5, photoY + photoSize / 2 + 3);
      }

      // Text area
      const textX = photoX + photoSize + 5;
      const textWidth = cardWidth - photoSize - 12;
      let textY = y + 8;

      // Name
      doc.setTextColor(232, 227, 216);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(t.full_name || "Unknown", textX, textY, { maxWidth: textWidth });
      textY += 5;

      // Age & Location
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(139, 141, 147);
      const ageLocParts = [
        t.age != null ? `Age: ${t.age}` : null,
        t.location || null,
      ].filter(Boolean);
      if (ageLocParts.length) {
        doc.text(ageLocParts.join("  |  "), textX, textY, { maxWidth: textWidth });
        textY += 4;
      }

      // Agency
      if (t.agency_name) {
        doc.setTextColor(184, 150, 76);
        doc.text(t.agency_name, textX, textY, { maxWidth: textWidth });
        textY += 4;
        doc.setTextColor(139, 141, 147);
      }

      // Contact
      const contactParts = [t.email, t.phone].filter(Boolean);
      if (contactParts.length) {
        doc.setFontSize(7);
        doc.text(contactParts.join("  |  "), textX, textY, { maxWidth: textWidth });
        textY += 3.5;
      }

      // Cultural background
      if (t.cultural_background) {
        doc.setFontSize(7);
        doc.text(`Background: ${t.cultural_background}`, textX, textY, { maxWidth: textWidth });
        textY += 3.5;
      }

      // Physical
      const physParts = [
        t.height_cm != null ? `${t.height_cm}cm` : null,
        t.weight_kg != null ? `${t.weight_kg}kg` : null,
      ].filter(Boolean);
      if (physParts.length) {
        doc.setFontSize(7);
        doc.text(physParts.join(" / "), textX, textY, { maxWidth: textWidth });
        textY += 3.5;
      }

      // Tags
      if (t.tags?.length) {
        doc.setFontSize(6);
        doc.setTextColor(184, 150, 76);
        doc.text(t.tags.slice(0, 5).join(", "), textX, textY, { maxWidth: textWidth });
        textY += 3.5;
      }

      // Client status indicator
      if (t.client_status) {
        const statusX = x + cardWidth - 18;
        const statusY = y + 3;
        const statusColors: Record<string, [number, number, number]> = {
          yes: [74, 222, 128],
          no: [248, 113, 113],
          maybe: [251, 191, 36],
        };
        const color = statusColors[t.client_status] || [139, 141, 147];
        doc.setFillColor(...color);
        doc.circle(statusX + 3, statusY + 2, 2, "F");
        doc.setTextColor(...color);
        doc.setFontSize(6);
        doc.text(t.client_status.toUpperCase(), statusX - 2, statusY + 7);
      }

      talentIndex++;
      col++;
      if (col >= 2) {
        col = 0;
        row++;
      }
    }

    currentPage++;
  }

  // Handle empty report
  if (talents.length === 0) {
    drawHeader(1, 1);
    doc.setTextColor(139, 141, 147);
    doc.setFontSize(12);
    doc.text("No talent data available", pageWidth / 2 - 25, 60);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
