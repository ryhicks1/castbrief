/**
 * Script parsing — extracts text from PDF files using unpdf
 */

export async function parsePDF(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const { extractText, getDocumentProxy } = await import("unpdf");
  const uint8 = new Uint8Array(buffer);

  const pdf = await getDocumentProxy(uint8);
  const numPages = pdf.numPages;

  const { text } = await extractText(uint8, { mergePages: true });

  return { text, numPages };
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
