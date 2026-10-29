/**
 * UFK Tools — Client-side PDF.js Loader
 * Uses the self-hosted browser-compatible distribution (pdfjs-dist/build/pdf.min.js)
 * with the matching worker (/pdf.worker.min.js).
 *
 * This completely avoids the Node.js 'canvas' binary requirement in pdfjs-dist/build/pdf.js,
 * ensuring flawless Turbopack/Vercel builds and zero external CDN latency.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedPdfJs: any = null;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function getPdfJs(): Promise<any> {
  if (typeof window === "undefined") {
    throw new Error("PDF.js can only be executed in a client browser context.");
  }

  if (cachedPdfJs) {
    return cachedPdfJs;
  }

  // Import the dedicated browser distribution to avoid Node 'canvas' resolution
  // @ts-expect-error - version-specific browser bundle path for pdfjs-dist 3.x
  const pdfjsModule = await import("pdfjs-dist/build/pdf.min.js");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = pdfjsModule.default || pdfjsModule;

  if (pdfjs.GlobalWorkerOptions && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }

  cachedPdfJs = pdfjs;
  return pdfjs;
}
