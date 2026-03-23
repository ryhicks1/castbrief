/**
 * Sides generation — extracts specific pages from a PDF for each character
 */
import { PDFDocument } from "pdf-lib";

/**
 * Extracts specific pages from a PDF buffer to create sides for a character.
 * Pages are 1-indexed to match script page numbers.
 */
export async function generateSides(
  pdfBuffer: Buffer | Uint8Array,
  pageNumbers: number[]
): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(pdfBuffer);
  const sidesPdf = await PDFDocument.create();

  const totalPages = sourcePdf.getPageCount();

  // Convert 1-indexed page numbers to 0-indexed, filter out invalid
  const validIndices = pageNumbers
    .map((p) => p - 1)
    .filter((i) => i >= 0 && i < totalPages)
    .sort((a, b) => a - b);

  if (validIndices.length === 0) {
    // Return a single blank page with a message if no valid pages
    const page = sidesPdf.addPage();
    page.drawText("No matching pages found in the script.", {
      x: 50,
      y: page.getHeight() / 2,
      size: 14,
    });
    return sidesPdf.save();
  }

  // Copy the specified pages
  const copiedPages = await sidesPdf.copyPages(sourcePdf, validIndices);
  for (const page of copiedPages) {
    sidesPdf.addPage(page);
  }

  return sidesPdf.save();
}
