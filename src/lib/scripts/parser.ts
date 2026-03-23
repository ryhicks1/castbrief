/**
 * Script parsing utilities — extracts text from PDF and DOCX files
 */

export async function parsePDF(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  // pdf-parse is a CommonJS module
  const mod = await import("pdf-parse");
  const pdfParse = (mod as any).default || mod;
  const data = await pdfParse(buffer);
  return { text: data.text, numPages: data.numpages };
}

export async function parseDocx(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  // Estimate pages from text length (roughly 3000 chars per page)
  const estimatedPages = Math.max(1, Math.ceil(result.value.length / 3000));
  return { text: result.value, numPages: estimatedPages };
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

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword" ||
    mimeType === "application/docx"
  ) {
    return parseDocx(buffer);
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}
