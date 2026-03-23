/**
 * Script parsing — extracts text from PDF files using unpdf/pdfjs
 * Uses getDocumentProxy + page-by-page text extraction to avoid
 * structuredClone issues with extractText in serverless environments.
 */

export async function parsePDF(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const { getDocumentProxy } = await import("unpdf");
  const uint8 = new Uint8Array(buffer);

  const pdf = await getDocumentProxy(uint8);
  const numPages = pdf.numPages;

  // Extract text page by page
  let fullText = "";
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = (content.items as any[])
      .map((item) => item.str || "")
      .join(" ");
    fullText += `--- PAGE ${i} ---\n${pageText}\n\n`;
  }

  return { text: fullText, numPages };
}

export async function parseScript(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; numPages: number }> {
  if (
    mimeType === "application/pdf" ||
    mimeType === "application/x-pdf"
  ) {
    return parsePDF(buffer);
  }

  throw new Error(`Unsupported file type: ${mimeType}. Please upload a PDF.`);
}
