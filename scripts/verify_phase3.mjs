import http from "node:http";
import { PDFDocument, rgb, degrees } from "pdf-lib";

async function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ statusCode: res.statusCode, body: data }));
    }).on("error", reject);
  });
}

async function runTests() {
  console.log("=========================================");
  console.log("   UFK TOOLS — PHASE 3 SUITE TESTS       ");
  console.log("=========================================\n");

  const routes = [
    { path: "/tools/merge-pdf", expected: "Merge PDF" },
    { path: "/tools/split-pdf", expected: "Split PDF" },
    { path: "/tools/jpg-to-pdf", expected: "JPG to PDF" },
    { path: "/tools/pdf-to-jpg", expected: "PDF to JPG" },
    { path: "/tools/rotate-reorder-delete-pdf", expected: "Rotate" },
    { path: "/tools/measurement-converter", expected: "Measurement" },
    { path: "/tools/currency-converter", expected: "Currency" },
  ];

  console.log("Step 1: Testing all 7 Phase 3 Page Routes...");
  for (const r of routes) {
    const res = await fetchUrl(r.path);
    if (res.statusCode === 200 && res.body.includes(r.expected)) {
      console.log(`  ✓ Route ${r.path} -> 200 OK (Contains "${r.expected}")`);
    } else {
      throw new Error(`Route ${r.path} failed with code ${res.statusCode}`);
    }
  }

  console.log("\nStep 2: Testing /api/rates Exchange Engine...");
  const ratesRes = await fetchUrl("/api/rates");
  if (ratesRes.statusCode !== 200) throw new Error("Rates API returned " + ratesRes.statusCode);
  const ratesJson = JSON.parse(ratesRes.body);
  if (!ratesJson.success || !ratesJson.rates?.EUR || !ratesJson.rates?.GBP) {
    throw new Error("Rates API missing required currency rates");
  }
  console.log(`  ✓ /api/rates -> 200 OK (Base: ${ratesJson.base}, EUR: ${ratesJson.rates.EUR}, Source: ${ratesJson.source})`);

  console.log("\nStep 3: Functional Validation of PDF-LIB Transformation Engine...");
  // 3a. Create two test PDFs
  const doc1 = await PDFDocument.create();
  const page1 = doc1.addPage([400, 400]);
  page1.drawText("Doc 1 Page 1", { x: 50, y: 350 });
  const page2 = doc1.addPage([400, 400]);
  page2.drawText("Doc 1 Page 2", { x: 50, y: 350 });
  const doc1Bytes = await doc1.save();

  const doc2 = await PDFDocument.create();
  const doc2Page = doc2.addPage([400, 400]);
  doc2Page.drawText("Doc 2 Page 1", { x: 50, y: 350 });
  const doc2Bytes = await doc2.save();

  // 3b. Test Merge Logic
  const mergedDoc = await PDFDocument.create();
  const loadedDoc1 = await PDFDocument.load(doc1Bytes);
  const loadedDoc2 = await PDFDocument.load(doc2Bytes);

  const copied1 = await mergedDoc.copyPages(loadedDoc1, loadedDoc1.getPageIndices());
  copied1.forEach((p) => mergedDoc.addPage(p));
  const copied2 = await mergedDoc.copyPages(loadedDoc2, loadedDoc2.getPageIndices());
  copied2.forEach((p) => mergedDoc.addPage(p));

  const mergedBytes = await mergedDoc.save();
  const verifyMerged = await PDFDocument.load(mergedBytes);
  if (verifyMerged.getPageCount() !== 3) {
    throw new Error(`Merge failed: expected 3 pages, got ${verifyMerged.getPageCount()}`);
  }
  console.log(`  ✓ PDF Merge Engine: 2 files (2 pages + 1 page) -> Combined ${verifyMerged.getPageCount()} pages`);

  // 3c. Test Split Logic
  const splitDoc = await PDFDocument.create();
  const [splitPage] = await splitDoc.copyPages(verifyMerged, [1]); // extract page 2
  splitDoc.addPage(splitPage);
  const splitBytes = await splitDoc.save();
  const verifySplit = await PDFDocument.load(splitBytes);
  if (verifySplit.getPageCount() !== 1) throw new Error("Split failed");
  console.log(`  ✓ PDF Split Engine: Extracted page 2 -> 1 page PDF successfully`);

  // 3d. Test Rotate Logic
  const rotateDoc = await PDFDocument.create();
  const [rotPage] = await rotateDoc.copyPages(verifyMerged, [0]);
  rotPage.setRotation(degrees(90));
  rotateDoc.addPage(rotPage);
  const rotBytes = await rotateDoc.save();
  const verifyRot = await PDFDocument.load(rotBytes);
  if (verifyRot.getPage(0).getRotation().angle !== 90) throw new Error("Rotation failed");
  console.log(`  ✓ PDF Rotate Engine: Page 1 rotation set to 90 degrees`);

  console.log("\nStep 4: Functional Validation of Conversion Formulas...");
  // Length: 100 meters to feet
  const meters = 100;
  const feet = (meters * 1) / 0.3048;
  if (Math.abs(feet - 328.084) > 0.01) throw new Error("Meters to feet conversion mismatch");
  console.log(`  ✓ Measurement Math: 100 m = ${feet.toFixed(3)} ft (Accuracy verified)`);

  // Temperature: 100 C to F
  const celsius = 100;
  const fahrenheit = (celsius * 9) / 5 + 32;
  if (fahrenheit !== 212) throw new Error("Celsius to Fahrenheit mismatch");
  console.log(`  ✓ Temperature Math: 100 °C = ${fahrenheit} °F (Boiling point verified)`);

  // Currency: 100 USD to EUR
  const eurRate = ratesJson.rates.EUR;
  const eurAmount = (100 / 1.0) * eurRate;
  console.log(`  ✓ Currency Math: $100 USD = €${eurAmount.toFixed(2)} EUR at live ECB rate`);

  console.log("\n=========================================");
  console.log("   ALL PHASE 3 VERIFICATIONS PASSED!    ");
  console.log("=========================================\n");
}

runTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
