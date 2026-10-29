/**
 * UFK Tools — Client-side PDF.js Loader
 * Uses self-hosted worker located in /public/pdf.worker.min.js
 * Ensuring 0 latency, 0 external CDN reliance, and complete offline privacy.
 */

export async function getPdfJs() {
  const pdfjs = await import("pdfjs-dist");
  if (typeof window !== "undefined" && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  }
  return pdfjs;
}
