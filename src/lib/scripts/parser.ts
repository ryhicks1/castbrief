/**
 * Script parsing utilities — extracts text from PDF files
 */

export async function parsePDF(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  // Polyfill DOMMatrix for server-side pdfjs usage
  if (typeof globalThis.DOMMatrix === "undefined") {
    (globalThis as any).DOMMatrix = class DOMMatrix {
      m11 = 1; m12 = 0; m13 = 0; m14 = 0;
      m21 = 0; m22 = 1; m23 = 0; m24 = 0;
      m31 = 0; m32 = 0; m33 = 1; m34 = 0;
      m41 = 0; m42 = 0; m43 = 0; m44 = 1;
      a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
      is2D = true; isIdentity = true;
      constructor(init?: any) {
        if (Array.isArray(init) && init.length === 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
        }
      }
      inverse() { return new DOMMatrix(); }
      multiply() { return new DOMMatrix(); }
      translate() { return new DOMMatrix(); }
      scale() { return new DOMMatrix(); }
      rotate() { return new DOMMatrix(); }
      transformPoint(p: any) { return p || { x: 0, y: 0, z: 0, w: 1 }; }
    };
  }

  const { PDFParse } = await import("pdf-parse");
  const parser: any = new PDFParse({});
  await parser.load(buffer);
  const text: string = await parser.getText();
  // Get page count from info
  let numPages = 1;
  try {
    const info = await parser.getInfo();
    numPages = info?.numPages || info?.pages || 1;
  } catch {
    // Estimate from text
    numPages = Math.max(1, Math.ceil(text.length / 3000));
  }
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
