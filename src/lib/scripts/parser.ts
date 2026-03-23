/**
 * Script parsing utilities — extracts text from PDF and DOCX files
 */

export async function parsePDF(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  // pdf-parse uses pdfjs-dist which needs DOMMatrix in Node.js
  // Polyfill it before importing
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
          this.m11 = this.a; this.m12 = this.b;
          this.m21 = this.c; this.m22 = this.d;
          this.m41 = this.e; this.m42 = this.f;
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
