import jsPDF from "jspdf";

export interface SelfTapeData {
  projectName: string;
  brand: string;
  location: string;
  productionDates: string;
  roleName: string;
  videos: Array<{ label: string; description: string }>;
  photos: string[];
  filmingNotes: string[];
  formUrl?: string;
  referenceLinks?: string[];
}

// Colors matching the CastingBrief brand
const GOLD: [number, number, number] = [184, 150, 76]; // #B8964C
const BLACK_BAR: [number, number, number] = [15, 15, 18]; // #0F0F12
const DARK_BG: [number, number, number] = [22, 25, 32]; // #161920
const TEXT_WHITE: [number, number, number] = [232, 227, 216]; // #E8E3D8
const TEXT_MUTED: [number, number, number] = [139, 141, 147]; // #8B8D93
const WHITE: [number, number, number] = [255, 255, 255];

export async function generateSelfTapeInstructionsPDF(
  data: SelfTapeData
): Promise<Uint8Array> {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  function checkPageBreak(needed: number) {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = 15;
    }
  }

  // ── Header ──
  // Black bar across top
  doc.setFillColor(...BLACK_BAR);
  doc.rect(0, 0, pageWidth, 28, "F");

  // Logo text
  doc.setTextColor(...GOLD);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("CastingBrief", margin, 18);

  // Date on right
  doc.setTextColor(...TEXT_MUTED);
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  const dateStr = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.text(dateStr, pageWidth - margin - doc.getTextWidth(dateStr), 18);

  y = 35;

  // ── Title ──
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("SELF-TAPE AUDITION INSTRUCTIONS", margin, y);
  y += 10;

  // ── Job Info Table ──
  const infoRows = [
    ["Project", data.projectName],
    ["Brand", data.brand],
    ["Location", data.location],
    ["Production Dates", data.productionDates],
    ["Role Name", data.roleName],
  ];

  // Table header bar
  doc.setFillColor(...BLACK_BAR);
  doc.rect(margin, y, contentWidth, 8, "F");
  doc.setTextColor(...WHITE);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("JOB INFORMATION", margin + 4, y + 5.5);
  y += 8;

  const labelWidth = 45;
  for (let i = 0; i < infoRows.length; i++) {
    const [label, value] = infoRows[i];
    const rowH = 7;
    // Alternate row background
    if (i % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y, contentWidth, rowH, "F");
    }
    // Border
    doc.setDrawColor(220, 220, 220);
    doc.rect(margin, y, contentWidth, rowH, "S");

    // Label
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin + 4, y + 5);

    // Value
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(value || "", margin + labelWidth, y + 5);

    y += rowH;
  }

  y += 10;

  // ── Helper: Section header bar ──
  function drawSectionHeader(title: string) {
    checkPageBreak(20);
    doc.setFillColor(...BLACK_BAR);
    doc.rect(margin, y, contentWidth, 8, "F");
    doc.setTextColor(...WHITE);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(title, margin + 4, y + 5.5);
    y += 12;
  }

  // ── Step 1: Online Talent Form ──
  drawSectionHeader("STEP 1: ONLINE TALENT FORM");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const formText =
    "Please complete the Online Talent Form. Submissions cannot be accepted without a completed form.";
  const formLines = doc.splitTextToSize(formText, contentWidth);
  doc.text(formLines, margin, y);
  y += formLines.length * 5 + 3;

  if (data.formUrl) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("Talent form link: ", margin, y);
    const linkOffset = doc.getTextWidth("Talent form link: ");

    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 70, 180);
    doc.textWithLink(data.formUrl, margin + linkOffset, y, {
      url: data.formUrl,
    });
    y += 7;
  }

  y += 5;

  // ── Step 2: Record Audition Videos ──
  drawSectionHeader("STEP 2: RECORD AUDITION VIDEOS");

  for (let i = 0; i < data.videos.length; i++) {
    const video = data.videos[i];
    checkPageBreak(25);

    // Video header
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(
      `VIDEO ${i + 1} (LABEL IT '${video.label}')`,
      margin,
      y
    );
    y += 6;

    // Description
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const descLines = doc.splitTextToSize(video.description, contentWidth - 5);
    checkPageBreak(descLines.length * 4.5 + 5);
    doc.text(descLines, margin + 3, y);
    y += descLines.length * 4.5 + 5;
  }

  y += 3;

  // ── Step 3: Photos ──
  if (data.photos.length > 0) {
    drawSectionHeader("STEP 3: PHOTOS");

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    for (let i = 0; i < data.photos.length; i++) {
      checkPageBreak(8);
      const bullet = `${i + 1}. ${data.photos[i]}`;
      const photoLines = doc.splitTextToSize(bullet, contentWidth - 10);
      doc.text(photoLines, margin + 3, y);
      y += photoLines.length * 4.5 + 2;
    }

    y += 5;
  }

  // ── Step 4: Upload ──
  drawSectionHeader("STEP 4: UPLOAD");

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  const uploadText =
    "Please upload your audition videos and photos via the link provided by your agent.";
  const uploadLines = doc.splitTextToSize(uploadText, contentWidth);
  doc.text(uploadLines, margin, y);
  y += uploadLines.length * 5 + 8;

  // ── Filming Notes ──
  if (data.filmingNotes.length > 0) {
    drawSectionHeader("FILMING NOTES");

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    for (let i = 0; i < data.filmingNotes.length; i++) {
      checkPageBreak(10);
      const note = `${i + 1}. ${data.filmingNotes[i]}`;
      const noteLines = doc.splitTextToSize(note, contentWidth - 10);
      doc.text(noteLines, margin + 3, y);
      y += noteLines.length * 4.5 + 2;
    }

    y += 5;
  }

  // ── Reference Links ──
  if (data.referenceLinks && data.referenceLinks.length > 0) {
    drawSectionHeader("REFERENCE LINKS");

    doc.setFontSize(9);
    for (const link of data.referenceLinks) {
      checkPageBreak(8);
      doc.setTextColor(0, 70, 180);
      doc.textWithLink(link, margin + 3, y, { url: link });
      y += 5;
    }
  }

  // ── Footer on each page ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor(...BLACK_BAR);
    doc.rect(0, pageHeight - 12, pageWidth, 12, "F");
    doc.setTextColor(...TEXT_MUTED);
    doc.setFontSize(7);
    doc.text(
      `Page ${p} of ${totalPages}`,
      pageWidth - margin - 18,
      pageHeight - 5
    );
    doc.setTextColor(...GOLD);
    doc.setFontSize(7);
    doc.text("Generated by CastingBrief", margin, pageHeight - 5);
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
