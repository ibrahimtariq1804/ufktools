"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  RotateCcw,
  Shield,
  HelpCircle,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Table,
  Sparkles,
} from "lucide-react";
import * as XLSX from "xlsx";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { getPdfJs } from "@/lib/pdf/pdfjs-helper";

interface PdfToExcelToolProps {
  tool: ToolItem;
}

export function PdfToExcelTool({ tool }: PdfToExcelToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [extractedRows, setExtractedRows] = useState<string[][]>([]);
  const [downloadXlsxUrl, setDownloadXlsxUrl] = useState<string | null>(null);
  const [downloadCsvUrl, setDownloadCsvUrl] = useState<string | null>(null);
  const [downloadFilename, setDownloadFilename] = useState("");
  const [showTablePreview, setShowTablePreview] = useState(true);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid .pdf file.");
      return;
    }
    if (file.size > tool.maxFileSizeMB * 1024 * 1024) {
      setErrorMessage(`File exceeds the ${tool.maxFileSizeMB}MB limit.`);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setExtractedRows([]);
    setDownloadXlsxUrl(null);
    setDownloadCsvUrl(null);
    setProgress(0);
    setStatusMessage("");
  }, [tool.maxFileSizeMB]);

  const handleConvert = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setProgress(10);
    setStatusMessage("Parsing PDF text stream...");
    setErrorMessage(null);

    try {
      const pdfjs = await getPdfJs();
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
      const numPages = pdf.numPages;

      const allTableRows: string[][] = [];

      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round(10 + (i / numPages) * 60));
        setStatusMessage(`Analyzing table coordinates on page ${i} of ${numPages}...`);

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as Array<{
          str: string;
          transform: number[];
          width: number;
        }>;

        if (items.length === 0) continue;

        // Group tokens by row (Y coordinate with 5px tolerance)
        const rowMap = new Map<number, typeof items>();
        for (const item of items) {
          if (!item.str || !item.str.trim()) continue;
          const y = Math.round(item.transform[5]);
          let matchedKey: number | null = null;
          for (const key of rowMap.keys()) {
            if (Math.abs(key - y) <= 5) {
              matchedKey = key;
              break;
            }
          }
          if (matchedKey !== null) {
            rowMap.get(matchedKey)!.push(item);
          } else {
            rowMap.set(y, [item]);
          }
        }

        // Sort rows from top of page to bottom (descending Y)
        const sortedY = Array.from(rowMap.keys()).sort((a, b) => b - a);

        for (const y of sortedY) {
          const rowItems = rowMap.get(y)!;
          // Sort columns left-to-right (ascending X)
          rowItems.sort((a, b) => a.transform[4] - b.transform[4]);

          // Group nearby text into cell columns
          const cells: string[] = [];
          let currentCell = "";
          let lastXEnd = -1;

          for (const item of rowItems) {
            const startX = item.transform[4];
            if (lastXEnd === -1) {
              currentCell = item.str;
            } else if (startX - lastXEnd > 24) {
              // Significant gap -> distinct column cell
              cells.push(currentCell.trim());
              currentCell = item.str;
            } else {
              currentCell += " " + item.str;
            }
            lastXEnd = startX + (item.width || 0);
          }
          if (currentCell.trim()) {
            cells.push(currentCell.trim());
          }

          if (cells.length > 0) {
            allTableRows.push(cells);
          }
        }
      }

      setProgress(75);
      setStatusMessage("Structuring worksheet rows & columns...");

      if (allTableRows.length === 0) {
        throw new Error("No structured text or tabular data was detected in this PDF.");
      }

      setExtractedRows(allTableRows);

      setProgress(85);
      setStatusMessage("Generating Microsoft Excel (.xlsx) workbook...");

      // Generate XLSX via SheetJS
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(allTableRows);

      // Auto-fit column widths
      const maxCols = Math.max(...allTableRows.map((r) => r.length));
      const colWidths = [];
      for (let c = 0; c < maxCols; c++) {
        let maxLen = 10;
        for (const row of allTableRows) {
          if (row[c]) maxLen = Math.max(maxLen, Math.min(row[c].length + 2, 40));
        }
        colWidths.push({ wch: maxLen });
      }
      ws["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, "Extracted Data");

      // Generate binary XLSX
      const xlsxData = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const xlsxBlob = new Blob([xlsxData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const xlsxUrl = URL.createObjectURL(xlsxBlob);
      const baseName = selectedFile.name.replace(/\.pdf$/i, "");
      setDownloadXlsxUrl(xlsxUrl);
      setDownloadFilename(`${baseName}.xlsx`);

      // Generate CSV
      const csvData = XLSX.utils.sheet_to_csv(ws);
      const csvBlob = new Blob([csvData], { type: "text/csv;charset=utf-8" });
      const csvUrl = URL.createObjectURL(csvBlob);
      setDownloadCsvUrl(csvUrl);

      setProgress(100);
      setStatusMessage("Conversion complete!");
    } catch (err: unknown) {
      console.error("Excel conversion error:", err);
      setErrorMessage(
        err instanceof Error ? `Extraction failed: ${err.message}` : "Failed to extract tables to Excel."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setExtractedRows([]);
    setDownloadXlsxUrl(null);
    setDownloadCsvUrl(null);
    setProgress(0);
    setStatusMessage("");
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3.5">
          <nav className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/" className="hover:text-blue-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link href="/tools" className="hover:text-blue-600 transition-colors">
              Tools
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            {category && (
              <>
                <Link href={`/tools#${category.slug}`} className="hover:text-blue-600 transition-colors">
                  {category.name}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </>
            )}
            <span className="font-semibold text-slate-800">{tool.name}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200 mb-3">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
            <span>Table Coordinate Mapping & XLSX Generation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Convert PDF to Excel (.xlsx)
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Extract data tables, financial statements, and grids from PDF files directly into clean Microsoft Excel and CSV spreadsheets. 100% in-browser.
          </p>
        </div>

        {/* Work Area */}
        <div className="rounded-2xl bg-white shadow-xl border border-slate-200/80 p-6 sm:p-8">
          {downloadXlsxUrl ? (
            /* Success State */
            <div className="space-y-6">
              <div className="text-center py-4 max-w-md mx-auto space-y-3">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-sm">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">Spreadsheet Ready!</h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  Extracted {extractedRows.length} rows of tabular data into a structured Excel workbook.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <a
                    href={downloadXlsxUrl}
                    download={downloadFilename}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Excel (.xlsx)</span>
                  </a>

                  {downloadCsvUrl && (
                    <a
                      href={downloadCsvUrl}
                      download={`${selectedFile?.name.replace(/\.pdf$/i, "")}.csv`}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-700 transition-colors"
                    >
                      <Table className="h-4 w-4 text-slate-500" />
                      <span>Download CSV</span>
                    </a>
                  )}

                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-colors"
                  >
                    <RotateCcw className="h-4 w-4 text-slate-500" />
                    <span>New File</span>
                  </button>
                </div>
              </div>

              {/* Table Preview */}
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Table className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Extracted Table Preview ({extractedRows.length} rows)</span>
                  </h3>
                  <button
                    onClick={() => setShowTablePreview(!showTablePreview)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    {showTablePreview ? "Hide Preview" : "Show Preview"}
                  </button>
                </div>

                {showTablePreview && (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white max-h-72">
                    <table className="w-full text-left text-xs border-collapse">
                      <tbody>
                        {extractedRows.slice(0, 15).map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={`border-b border-slate-100 ${
                              rIdx === 0 ? "bg-slate-50 font-bold text-slate-900" : "hover:bg-slate-50/50 text-slate-700"
                            }`}
                          >
                            <td className="px-3 py-2 text-[10px] text-slate-400 border-r border-slate-100 select-none">
                              {rIdx + 1}
                            </td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="px-3 py-2 border-r border-slate-100 truncate max-w-xs">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {extractedRows.length > 15 && (
                      <div className="p-2.5 text-center text-[11px] text-slate-400 bg-slate-50 border-t border-slate-200">
                        ...and {extractedRows.length - 15} more rows included in downloaded Excel file.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Upload State */
            <div className="space-y-6">
              {!selectedFile ? (
                /* Dropzone */
                <div
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileSelect(e.dataTransfer.files[0]);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50/50 hover:bg-emerald-50/30 p-8 sm:p-12 text-center transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-200 group-hover:scale-110 transition-transform">
                    <FileSpreadsheet className="h-7 w-7 text-emerald-600" />
                  </div>
                  <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">
                    Drop PDF to Convert to Excel
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-slate-500">
                    Drag and drop your file here, or click to browse
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                    <FileText className="h-3 w-3" />
                    <span>PDF format up to {tool.maxFileSizeMB}MB</span>
                  </div>
                </div>
              ) : (
                /* Selected File Card & Actions */
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{selectedFile.name}</h4>
                        <p className="text-xs text-slate-500">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for table extraction
                        </p>
                      </div>
                    </div>

                    {!isProcessing && (
                      <button
                        onClick={handleReset}
                        className="text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors"
                      >
                        Change File
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  {isProcessing && (
                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                        <span className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-emerald-600 animate-spin" />
                          <span>{statusMessage}</span>
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-emerald-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-xs text-red-700">
                      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <span>100% private in-browser extraction. Zero server storage.</span>
                    </div>

                    <button
                      onClick={handleConvert}
                      disabled={isProcessing}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 px-7 py-3 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all"
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>{isProcessing ? "Extracting Tables..." : "Extract to Excel (.xlsx)"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3.5">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Genuine Microsoft Excel (.xlsx)</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Outputs valid multi-cell spreadsheets with auto-formatted column widths, ready for Excel or Google Sheets.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3.5">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Zero Server Cost</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Processing runs directly inside your web browser. No third-party data transmission or API costs.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3.5">
              <Table className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Live Grid Preview</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Inspect your extracted rows and columns directly in the browser before downloading.
            </p>
          </div>
        </div>

        {/* How-to & FAQ */}
        <div className="mt-12 rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 space-y-8">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-emerald-600" />
              <span>How to Convert PDF Tables to Excel</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white mb-2">
                  1
                </span>
                <h4 className="text-xs font-bold text-slate-800">Select PDF</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Upload your PDF bank statement, invoice, or data report.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white mb-2">
                  2
                </span>
                <h4 className="text-xs font-bold text-slate-800">Extract Grid</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Our algorithm aligns coordinate rows and column gaps into cells.
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white mb-2">
                  3
                </span>
                <h4 className="text-xs font-bold text-slate-800">Save Spreadsheet</h4>
                <p className="text-[11px] text-slate-600 mt-1">
                  Download your `.xlsx` or `.csv` spreadsheet immediately.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
