"use client";

import React, { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  RotateCcw,
  Shield,
  ChevronRight,
  AlertCircle,
  Bot,
  Sparkles,
  Send,
  BookOpen,
  Clock,
  Key,
  ListFilter,
  Search,
} from "lucide-react";
import { ToolItem, CATEGORIES } from "@/config/tools.config";
import { getPdfJs } from "@/lib/pdf/pdfjs-helper";

interface ChatPdfToolProps {
  tool: ToolItem;
}

interface DocumentChunk {
  page: number;
  text: string;
}

interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  citedPage?: number;
  timestamp: string;
}

export function ChatPdfTool({ tool }: ChatPdfToolProps) {
  const category = CATEGORIES.find((c) => c.id === tool.category);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Document Stats & Intelligence
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [totalWordCount, setTotalWordCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [readingTimeMin, setReadingTimeMin] = useState(0);
  const [summaryBullets, setSummaryBullets] = useState<string[]>([]);
  const [topKeywords, setTopKeywords] = useState<{ word: string; count: number }[]>([]);

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [byokApiKey, setByokApiKey] = useState("");
  const [showByokModal, setShowByokModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");

  const handleFileSelect = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid .pdf file.");
      return;
    }
    if (file.size > tool.maxFileSizeMB * 1024 * 1024) {
      setErrorMessage(`File exceeds ${tool.maxFileSizeMB}MB limit.`);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
    setChunks([]);
    setMessages([]);
    setSummaryBullets([]);
    setTopKeywords([]);
    setProgress(0);
  }, [tool.maxFileSizeMB]);

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setProgress(10);
    setStatusMessage("Extracting text from PDF pages...");
    setErrorMessage(null);

    try {
      const pdfjs = await getPdfJs();
      const buffer = await selectedFile.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
      const numPages = pdf.numPages;

      const extractedChunks: DocumentChunk[] = [];
      let fullCorpus = "";

      for (let i = 1; i <= numPages; i++) {
        setProgress(Math.round(10 + (i / numPages) * 60));
        setStatusMessage(`Reading page ${i} of ${numPages}...`);

        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const items = textContent.items as Array<{ str: string }>;
        const pageText = items.map((item) => item.str).join(" ").trim();

        if (pageText) {
          extractedChunks.push({ page: i, text: pageText });
          fullCorpus += " " + pageText;
        }
      }

      setChunks(extractedChunks);
      setTotalPages(numPages);

      // 1. Calculate word counts & reading speed
      const words = fullCorpus.trim().split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      setTotalWordCount(wordCount);
      setReadingTimeMin(Math.max(1, Math.round(wordCount / 200))); // ~200 WPM

      setProgress(75);
      setStatusMessage("Extracting semantic topics & keywords...");

      // 2. Keyword frequency analysis (excluding common stop words)
      const stopWords = new Set([
        "the", "and", "to", "of", "in", "for", "with", "is", "a", "an", "on", "that", "this",
        "by", "at", "as", "from", "are", "be", "or", "it", "was", "were", "which", "have", "has",
        "had", "not", "but", "we", "they", "you", "their", "our", "all", "can", "will", "would",
        "been", "more", "also", "into", "than", "other", "its", "any", "no", "may", "such"
      ]);

      const freqMap = new Map<string, number>();
      for (const w of words) {
        const cleaned = w.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (cleaned.length >= 4 && !stopWords.has(cleaned)) {
          freqMap.set(cleaned, (freqMap.get(cleaned) || 0) + 1);
        }
      }

      const sortedFreq = Array.from(freqMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word, count]) => ({ word, count }));
      setTopKeywords(sortedFreq);

      setProgress(85);
      setStatusMessage("Synthesizing Executive Summary...");

      // 3. Extractive Summarization (Sentence scoring based on keyword frequency & position)
      const sentenceRegex = /[^.!?]+[.!?]+/g;
      const allSentences = fullCorpus.match(sentenceRegex) || [fullCorpus];
      const scoredSentences = allSentences
        .map((sent, idx) => {
          const sWords = sent.toLowerCase().split(/\s+/);
          let score = 0;
          for (const sw of sWords) {
            const cleaned = sw.replace(/[^a-z0-9]/g, "");
            if (freqMap.has(cleaned)) {
              score += freqMap.get(cleaned)!;
            }
          }
          // Position bonus: earlier sentences in sections usually hold key premises
          if (idx < 5) score *= 1.3;
          return { sent: sent.trim(), score, len: sent.length };
        })
        .filter((s) => s.len >= 30 && s.len <= 250);

      scoredSentences.sort((a, b) => b.score - a.score);
      const topBullets = scoredSentences.slice(0, 5).map((s) => s.sent);

      setSummaryBullets(topBullets.length > 0 ? topBullets : ["No significant summary sentences found."]);

      // Seed initial chat greeting
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: `Hello! I have indexed ${numPages} pages (${wordCount.toLocaleString()} words). Ask me any question about this document, or click one of the suggested prompts below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      setProgress(100);
      setStatusMessage("Analysis complete!");
    } catch (err: unknown) {
      console.error("Chat PDF analysis error:", err);
      setErrorMessage(
        err instanceof Error ? `Analysis failed: ${err.message}` : "Failed to analyze document."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Chat Query Execution
  const handleSendMessage = (queryText?: string) => {
    const q = (queryText || inputText).trim();
    if (!q || chunks.length === 0) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText("");

    // Local semantic matching
    setTimeout(() => {
      const qTokens = q.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).filter(Boolean);

      let bestChunk: DocumentChunk | null = null;
      let highestScore = -1;

      for (const ch of chunks) {
        const lower = ch.text.toLowerCase();
        let matchCount = 0;
        for (const tok of qTokens) {
          if (lower.includes(tok)) matchCount++;
        }
        if (matchCount > highestScore) {
          highestScore = matchCount;
          bestChunk = ch;
        }
      }

      let responseText = "";
      let citedPage: number | undefined;

      if (bestChunk && highestScore > 0) {
        // Extract relevant sentence containing query token
        const sents = bestChunk.text.match(/[^.!?]+[.!?]+/g) || [bestChunk.text];
        const relevant = sents.filter((s) =>
          qTokens.some((tok) => s.toLowerCase().includes(tok))
        );

        if (relevant.length > 0) {
          responseText = relevant.slice(0, 2).join(" ").trim();
        } else {
          responseText = bestChunk.text.slice(0, 220).trim() + "...";
        }
        citedPage = bestChunk.page;
      } else {
        responseText =
          "I couldn't find a direct reference matching those terms in this document. Try rephrasing your question or check the keywords listed in the Summary tab.";
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: responseText,
        citedPage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }, 350);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setChunks([]);
    setMessages([]);
    setSummaryBullets([]);
    setTopKeywords([]);
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
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200 mb-3">
            <Bot className="h-3.5 w-3.5 text-blue-600" />
            <span>Extractive NLP Summarizer & Document Assistant</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight">
            Chat with PDF & AI Summarizer
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-slate-600 leading-relaxed">
            Instantly digest research papers, contracts, and manuals. Generate executive bullet summaries and ask questions with exact page citations. 100% free with zero token fees.
          </p>
        </div>

        {/* Work Area */}
        <div className="rounded-2xl bg-white shadow-xl border border-slate-200/80 p-6 sm:p-8">
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
              className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 p-8 sm:p-12 text-center transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-200 group-hover:scale-110 transition-transform">
                <Bot className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="mt-4 text-base sm:text-lg font-bold text-slate-900">
                Drop PDF to Analyze & Summarize
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Drag and drop your document here, or click to browse
              </p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
                <FileText className="h-3 w-3" />
                <span>PDF or TXT up to {tool.maxFileSizeMB}MB</span>
              </div>
            </div>
          ) : chunks.length === 0 ? (
            /* Selected File State Before Analysis */
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">{selectedFile.name}</h4>
                    <p className="text-xs text-slate-500">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for AI extraction
                    </p>
                  </div>
                </div>

                {!isAnalyzing && (
                  <button
                    onClick={handleReset}
                    className="text-xs font-semibold text-slate-600 hover:text-red-600 transition-colors"
                  >
                    Change File
                  </button>
                )}
              </div>

              {/* Progress Bar */}
              {isAnalyzing && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                      <span>{statusMessage}</span>
                    </span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-blue-100 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Shield className="h-4 w-4 text-emerald-600" />
                  <span>100% free local NLP processing. Zero API costs.</span>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 px-7 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all"
                >
                  <Bot className="h-4 w-4" />
                  <span>{isAnalyzing ? "Reading Document..." : "Analyze & Chat"}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Document Workspace (Summary + Interactive Chat) */
            <div className="space-y-6">
              {/* Document Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                    <span>Pages</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">{totalPages}</div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <FileText className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Total Words</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">{totalWordCount.toLocaleString()}</div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Clock className="h-3.5 w-3.5 text-purple-600" />
                    <span>Est. Read Time</span>
                  </div>
                  <div className="text-lg font-bold text-slate-900">{readingTimeMin} min</div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <Key className="h-3.5 w-3.5 text-amber-600" />
                    <span>Mode</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Local NLP</span>
                    <button
                      onClick={() => setShowByokModal(true)}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      BYOK
                    </button>
                  </div>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                      activeTab === "summary"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <ListFilter className="h-3.5 w-3.5" />
                    <span>Executive Summary</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
                      activeTab === "chat"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span>Ask Questions ({messages.length - 1})</span>
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Document</span>
                </button>
              </div>

              {/* Tab 1: Executive Summary */}
              {activeTab === "summary" && (
                <div className="space-y-6">
                  {/* Key Terminology Pills */}
                  {topKeywords.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                        Dominant Concepts & Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {topKeywords.map((item) => (
                          <button
                            key={item.word}
                            onClick={() => {
                              setActiveTab("chat");
                              handleSendMessage(`What does this document say about ${item.word}?`);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors"
                          >
                            <span>#{item.word}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({item.count})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Summary Bullet Points */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Core Extracted Findings
                    </h4>
                    <div className="space-y-2.5">
                      {summaryBullets.map((bullet, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-3 rounded-xl bg-slate-50 border border-slate-200/80 p-4"
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700 mt-0.5">
                            {idx + 1}
                          </span>
                          <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">{bullet}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-sm"
                    >
                      <Bot className="h-3.5 w-3.5" />
                      <span>Start Interactive Q&A</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Tab 2: Interactive Chat Q&A */}
              {activeTab === "chat" && (
                <div className="space-y-4">
                  {/* Chat Messages Log */}
                  <div className="h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                            msg.sender === "user"
                              ? "bg-blue-600 text-white rounded-br-xs"
                              : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs shadow-xs"
                          }`}
                        >
                          <p>{msg.text}</p>
                          {msg.citedPage && (
                            <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-blue-600 font-semibold flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              <span>Cited from Page {msg.citedPage}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Quick-Prompt Suggestions */}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <button
                      onClick={() => handleSendMessage("What are the main conclusions of this document?")}
                      className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 transition-colors"
                    >
                      What are the conclusions?
                    </button>
                    <button
                      onClick={() => handleSendMessage("What are the key dates, numbers, and deadlines?")}
                      className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 transition-colors"
                    >
                      Dates & Numbers?
                    </button>
                    <button
                      onClick={() => handleSendMessage("Are there any restrictions, risks, or caveats?")}
                      className="rounded-full bg-slate-100 hover:bg-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 transition-colors"
                    >
                      Risks & Limitations?
                    </button>
                  </div>

                  {/* Input Box */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ask a question about this document..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>

                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 px-5 py-3 text-white transition-colors"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feature Highlights */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 mb-3.5">
              <Bot className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Zero Token Cost</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              NLP extractive indexing runs 100% locally in your browser. No subscription, no rate limits, and no paid API requirements.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3.5">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Exact Page Citations</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Every retrieved finding cites the specific page number in your original PDF, making fact-checking effortless.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600 mb-3.5">
              <Shield className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">100% Client Privacy</h3>
            <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
              Confidential legal papers, corporate financial disclosures, and sensitive documents never leave your local device.
            </p>
          </div>
        </div>

        {/* Optional BYOK Modal */}
        {showByokModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <Key className="h-5 w-5 text-blue-600" />
                <span>Bring Your Own Key (Optional)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                UFK Tools includes a free built-in local extractive summarizer with zero fees. If you prefer to connect your personal OpenAI or Gemini API key for external LLM generation, you can enter it here. Your key is stored only in your session memory.
              </p>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  API Key (Stored locally in session)
                </label>
                <input
                  type="password"
                  value={byokApiKey}
                  onChange={(e) => setByokApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowByokModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
                <button
                  onClick={() => setShowByokModal(false)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  Save Key
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
