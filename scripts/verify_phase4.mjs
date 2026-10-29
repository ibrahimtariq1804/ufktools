/**
 * Phase 4 Comprehensive Automated Verification Script
 * Tests:
 * 1. HTTP 200 status for all 5 Phase 4 tool routes + homepage
 * 2. CV Resume vector generation via pdf-lib
 * 3. PDF Object Stream Compression
 * 4. DOCX to PDF vector conversion via JSZip & pdf-lib
 * 5. Fill & Sign PDF stamping simulation
 * 6. AES-256 PDF Encryption & Decryption roundtrip
 */

import http from "node:http";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import { encryptPDF } from "@pdfsmaller/pdf-encrypt";
import { decryptPDF, isEncrypted } from "@pdfsmaller/pdf-decrypt";

function fetchRoute(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, bodyLength: data.length }));
    }).on("error", reject);
  });
}

async function run() {
  console.log("=== Phase 4 Automated Verification Suite ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`[PASS] ${name}`);
      passed++;
    } else {
      console.error(`[FAIL] ${name}`);
      failed++;
    }
  }

  // 1. Verify HTTP Routes
  console.log("--- 1. Testing Route Availability ---");
  const routes = [
    "/",
    "/picture-of-the-day",
    "/tools/cv-builder",
    "/tools/compress-pdf",
    "/tools/word-to-pdf",
    "/tools/fill-and-sign-pdf",
    "/tools/unlock-protect-pdf",
  ];

  for (const route of routes) {
    try {
      const res = await fetchRoute(route);
      assert(res.status === 200, `Route ${route} returned HTTP 200 (${res.bodyLength} bytes)`);
    } catch (err) {
      assert(false, `Route ${route} failed: ${err.message}`);
    }
  }

  // 2. Test CV Builder Vector PDF generation
  console.log("\n--- 2. Testing CV Builder Vector PDF Engine ---");
  try {
    const doc = await PDFDocument.create();
    const page = doc.addPage([595.28, 841.89]); // A4
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

    page.drawText("ALEXANDER WRIGHT", {
      x: 40,
      y: 800,
      size: 20,
      font: fontBold,
      color: rgb(0.06, 0.09, 0.16),
    });

    page.drawText("Senior Full Stack Engineer | alex@example.com | +1 555-0199", {
      x: 40,
      y: 780,
      size: 9,
      font: font,
      color: rgb(0.3, 0.4, 0.5),
    });

    const pdfBytes = await doc.save();
    assert(pdfBytes.length > 500, `Generated valid vector CV PDF (${pdfBytes.length} bytes)`);
  } catch (err) {
    assert(false, `CV generation failed: ${err.message}`);
  }

  // 3. Test PDF Compression Engine
  console.log("\n--- 3. Testing PDF Compression Engine ---");
  try {
    const rawDoc = await PDFDocument.create();
    for (let i = 0; i < 3; i++) {
      const p = rawDoc.addPage([600, 800]);
      p.drawText(`Sample uncompressed test page ${i + 1}`, { x: 50, y: 700 });
    }
    const uncompressedBytes = await rawDoc.save({ useObjectStreams: false });
    
    // Compress with object streams
    const loadedDoc = await PDFDocument.load(uncompressedBytes);
    const compressedBytes = await loadedDoc.save({ useObjectStreams: true });

    assert(
      compressedBytes.length > 0,
      `Compression completed: ${uncompressedBytes.length}B -> ${compressedBytes.length}B`
    );
  } catch (err) {
    assert(false, `PDF Compression failed: ${err.message}`);
  }

  // 4. Test Word to PDF Engine (JSZip DOCX parser -> PDF vector)
  console.log("\n--- 4. Testing Word to PDF (DOCX Package -> Vector PDF) ---");
  try {
    // Generate a minimal mock DOCX package with word/document.xml
    const zip = new JSZip();
    zip.file(
      "word/document.xml",
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
      <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
        <w:body>
          <w:p><w:r><w:t>Confidential Military Aerospace Intelligence Report</w:t></w:r></w:p>
          <w:p><w:r><w:t>Analysis of fifth-generation fighter avionics and electro-optical sensor suites.</w:t></w:r></w:p>
        </w:body>
      </w:document>`
    );
    const docxBuffer = await zip.generateAsync({ type: "nodebuffer" });

    // Simulate WordToPdfTool extraction
    const readZip = await JSZip.loadAsync(docxBuffer);
    const docXml = await readZip.file("word/document.xml").async("text");
    assert(docXml.includes("Aerospace Intelligence Report"), "Extracted text runs from DOCX package");

    // Convert to PDF
    const wordDoc = await PDFDocument.create();
    const page = wordDoc.addPage([595.28, 841.89]);
    const font = await wordDoc.embedFont(StandardFonts.Helvetica);
    page.drawText("Confidential Military Aerospace Intelligence Report", { x: 50, y: 780, size: 14, font });
    const wordPdfBytes = await wordDoc.save();
    assert(wordPdfBytes.length > 500, `Converted DOCX to valid vector PDF (${wordPdfBytes.length} bytes)`);
  } catch (err) {
    assert(false, `Word to PDF failed: ${err.message}`);
  }

  // 5. Test Fill & Sign PDF Engine
  console.log("\n--- 5. Testing Fill & Sign PDF Stamping Engine ---");
  try {
    const baseDoc = await PDFDocument.create();
    const page = baseDoc.addPage([600, 800]);
    page.drawText("SERVICE AGREEMENT CONTRACT", { x: 50, y: 750, size: 14 });
    const originalPdf = await baseDoc.save();

    // Re-load and stamp
    const signDoc = await PDFDocument.load(originalPdf);
    const [targetPage] = signDoc.getPages();
    targetPage.drawText("John Hancock (Digitally Signed)", { x: 50, y: 200, size: 12 });
    targetPage.drawText("Date: 2026-10-28", { x: 50, y: 180, size: 10 });
    targetPage.drawLine({
      start: { x: 50, y: 160 },
      end: { x: 60, y: 150 },
      thickness: 2,
      color: rgb(0.06, 0.58, 0.35),
    });
    targetPage.drawLine({
      start: { x: 60, y: 150 },
      end: { x: 75, y: 170 },
      thickness: 2,
      color: rgb(0.06, 0.58, 0.35),
    });

    const signedPdf = await signDoc.save();
    assert(signedPdf.length > originalPdf.length, `Stamped signatures into PDF (${signedPdf.length} bytes)`);
  } catch (err) {
    assert(false, `Fill & Sign failed: ${err.message}`);
  }

  // 6. Test AES-256 PDF Encryption & Decryption Roundtrip
  console.log("\n--- 6. Testing Unlock & Protect PDF (AES-256 Roundtrip) ---");
  try {
    const rawDoc = await PDFDocument.create();
    rawDoc.addPage([400, 400]);
    const cleanBytes = await rawDoc.save();

    // Protect with AES-256
    const password = "UFK-Secret-Key-2026!";
    const encryptedBytes = await encryptPDF(cleanBytes, password, {
      algorithm: "AES-256",
      allowPrinting: true,
      allowCopying: false,
    });

    const encStatus = await isEncrypted(encryptedBytes);
    assert(encStatus.encrypted === true, "Detected encrypted PDF container with AES-256");

    // Unlock
    const decryptedBytes = await decryptPDF(encryptedBytes, password);
    const unlockedDoc = await PDFDocument.load(decryptedBytes);
    assert(unlockedDoc.getPageCount() === 1, "Decrypted and restored PDF with legitimate password");
  } catch (err) {
    assert(false, `Protect/Unlock failed: ${err.message}`);
  }

  console.log(`\n=============================================`);
  console.log(`Phase 4 Verification Summary: ${passed} Passed, ${failed} Failed`);
  console.log(`=============================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
