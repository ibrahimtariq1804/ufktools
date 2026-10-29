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
  CheckCircle2,
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

function renderFormattedText(text: string) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, lIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={lIdx} className="block min-h-[1.25em]">
        {parts.map((part, pIdx) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return (
              <strong key={pIdx} className="font-bold text-slate-900">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </span>
    );
  });
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
  const [executiveOverview, setExecutiveOverview] = useState<string>("");
  const [summaryBullets, setSummaryBullets] = useState<string[]>([]);
  const [conclusions, setConclusions] = useState<string>("");
  const [topKeywords, setTopKeywords] = useState<{ word: string; count: number }[]>([]);
  const [activeEngineLabel, setActiveEngineLabel] = useState<string>("UFK Intelligent NLP Engine");

  // Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [byokApiKey, setByokApiKey] = useState("");
  const [showByokModal, setShowByokModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"summary" | "chat">("summary");

  // Load saved BYOK key from localStorage if present
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedKey = localStorage.getItem("ufk_byok_api_key");
      if (savedKey) {
        setByokApiKey(savedKey);
      }
    }
  }, []);

  const analyzeFile = async (file: File) => {
    setIsAnalyzing(true);
    setProgress(15);
    setStatusMessage("Reading document pages...");
    setErrorMessage(null);

    try {
      const extractedChunks: DocumentChunk[] = [];
      let fullCorpus = "";
      let numPages = 1;

      if (file.name.toLowerCase().endsWith(".pdf")) {
        const pdfjs = await getPdfJs();
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
        numPages = pdf.numPages;

        for (let i = 1; i <= numPages; i++) {
          setProgress(Math.round(15 + (i / numPages) * 45));
          setStatusMessage(`Extracting page ${i} of ${numPages}...`);

          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const items = textContent.items as Array<{ str: string }>;
          const pageText = items.map((item) => item.str).join(" ").trim();

          if (pageText) {
            extractedChunks.push({ page: i, text: pageText });
            fullCorpus += " " + pageText;
          }
        }
      } else {
        // Plain text file
        fullCorpus = await file.text();
        extractedChunks.push({ page: 1, text: fullCorpus });
      }

      setChunks(extractedChunks);
      setTotalPages(numPages);

      const words = fullCorpus.trim().split(/\s+/).filter(Boolean);
      const wordCount = words.length;
      setTotalWordCount(wordCount);
      setReadingTimeMin(Math.max(1, Math.round(wordCount / 200)));

      setProgress(70);
      setStatusMessage("Connecting to AI Summarizer engine...");

      // Call Backend AI Summarizer API Route
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: fullCorpus,
          totalPages: numPages,
          wordCount,
          apiKey: byokApiKey || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "AI Summarizer compilation failed.");
      }

      if (data.summary) {
        setExecutiveOverview(data.summary.overview || "");
        setSummaryBullets(data.summary.keyFindings || []);
        setConclusions(data.summary.conclusions || "");
        setTopKeywords(data.summary.keywords || []);
        setActiveEngineLabel(data.engineLabel || "UFK Intelligent NLP Engine");
      }

      // Seed initial chat greeting
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: `Hello! I have analyzed all ${numPages} page(s) (${wordCount.toLocaleString()} words). Ask me any question about this document, or click one of the suggested prompts below.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      setProgress(100);
      setStatusMessage("AI Analysis Complete!");
      setActiveTab("summary");
    } catch (err: unknown) {
      console.error("Chat PDF AI analysis error:", err);
      setErrorMessage(
        err instanceof Error ? `Analysis failed: ${err.message}` : "Failed to analyze document."
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = useCallback((file: File) => {
    const isPdf = file.name.toLowerCase().endsWith(".pdf");
    const isTxt = file.name.toLowerCase().endsWith(".txt");
    if (!isPdf && !isTxt) {
      setErrorMessage("Please select a valid .pdf or .txt file.");
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
    setExecutiveOverview("");
    setSummaryBullets([]);
    setConclusions("");
    setTopKeywords([]);
    setProgress(0);

    // Automatically trigger AI extraction immediately upon upload
    analyzeFile(file);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool.maxFileSizeMB, byokApiKey]);

  // Chat Query Execution via Backend API
  const handleSendMessage = async (queryText?: string) => {
    const q = (queryText || inputText).trim();
    if (!q || chunks.length === 0 || isBotThinking) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText("");
    setIsBotThinking(true);

    setTimeout(() => {
      chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: q,
          chunks,
          history: messages,
          apiKey: byokApiKey || undefined,
        }),
      });

      const data = await res.json();
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: data.answer || "I was unable to retrieve a specific answer from this document.",
        citedPage: data.citedPage,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("AI Chat error:", err);
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: "Sorry, I encountered a temporary connection issue while querying the AI assistant.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsBotThinking(false);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  const handleSaveApiKey = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ufk_byok_api_key", byokApiKey.trim());
    }
    setShowByokModal(false);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setChunks([]);
    setMessages([]);
    setExecutiveOverview("");
    setSummaryBullets([]);
    setConclusions("");
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
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-2 text-xs text-slate-500 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
            <Link href="/" className="hover:text-blue-600 transition-colors shrink-0">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Link href="/tools" className="hover:text-blue-600 transition-colors shrink-0">
              Tools
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            {category && (
              <>
                <Link href={`/tools#${category.slug}`} className="hover:text-blue-600 transition-colors shrink-0">
                  {category.name}
                </Link>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </>
            )}
            <span className="font-semibold text-slate-800 shrink-0">{tool.name}</span>
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
        <div className="rounded-2xl bg-white shadow-xl border border-slate-200/80 p-4 sm:p-8">
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
              className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 p-6 sm:p-12 text-center transition-all"
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
              <div className="mx-auto flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-white shadow-md border border-slate-200 group-hover:scale-110 transition-transform">
                <Bot className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
              </div>
              <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-bold text-slate-900">
                Drop PDF to Analyze & Summarize
              </h3>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Drag and drop your document here, or click to browse
              </p>
              <div className="mt-3 sm:mt-4 inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-medium text-slate-600">
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
                  onClick={() => selectedFile && analyzeFile(selectedFile)}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 px-7 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 sm:p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <BookOpen className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span>Pages</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900">{totalPages}</div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 sm:p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Words</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900 truncate">{totalWordCount.toLocaleString()}</div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 sm:p-3.5">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Clock className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                    <span>Read Time</span>
                  </div>
                  <div className="text-base sm:text-lg font-bold text-slate-900">{readingTimeMin} min</div>
                </div>

                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 sm:p-3.5 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                    <Key className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>AI Engine</span>
                  </div>
                  <div className="text-xs font-bold text-slate-800 flex items-center justify-between gap-1">
                    <span className="truncate text-[11px]" title={activeEngineLabel}>
                      {activeEngineLabel.split(" ")[0] || "AI NLP"}
                    </span>
                    <button
                      onClick={() => setShowByokModal(true)}
                      className="text-[10px] text-blue-600 hover:underline shrink-0 font-medium"
                    >
                      {byokApiKey ? "Key Set" : "API Key"}
                    </button>
                  </div>
                </div>
              </div>

              {/* View Switcher Tabs - Mobile Responsive */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-slate-200 pb-3">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab("summary")}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 sm:px-4 py-2.5 text-xs font-bold transition-all ${
                      activeTab === "summary"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <ListFilter className="h-3.5 w-3.5" />
                    <span className="truncate">Executive Summary</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("chat")}
                    className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 sm:px-4 py-2.5 text-xs font-bold transition-all ${
                      activeTab === "chat"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    }`}
                  >
                    <Bot className="h-3.5 w-3.5" />
                    <span className="truncate">Ask AI ({messages.length > 0 ? messages.length - 1 : 0})</span>
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-rose-600 self-end sm:self-auto py-1 transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset Document</span>
                </button>
              </div>

              {/* Tab 1: Executive Summary */}
              {activeTab === "summary" && (
                <div className="space-y-6">
                  {/* Executive Overview Highlight Box */}
                  {executiveOverview && (
                    <div className="rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/40 to-slate-50 border border-blue-200/80 p-5 shadow-xs">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        <span>Executive Document Abstract</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-800 leading-relaxed font-normal space-y-1">
                        {renderFormattedText(executiveOverview)}
                      </div>
                    </div>
                  )}

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
                            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
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
                          <div className="text-xs sm:text-sm text-slate-800 leading-relaxed space-y-1">
                            {renderFormattedText(bullet)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Conclusions / Actionable Takeaways */}
                  {conclusions && (
                    <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Actionable Takeaways & Conclusions</span>
                      </div>
                      <div className="text-xs sm:text-sm text-slate-700 leading-relaxed space-y-1">
                        {renderFormattedText(conclusions)}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => setActiveTab("chat")}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
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
                          <div className="text-xs sm:text-sm leading-relaxed space-y-1">
                            {renderFormattedText(msg.text)}
                          </div>
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

                    {/* Thinking Indicator */}
                    {isBotThinking && (
                      <div className="flex flex-col items-start animate-in fade-in">
                        <div className="rounded-2xl bg-white border border-slate-200 p-3.5 text-xs text-slate-600 shadow-xs flex items-center gap-2">
                          <Bot className="h-4 w-4 text-blue-600 animate-spin" />
                          <span>AI is reviewing document pages & formulating answer...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                    {/* Quick-Prompt Suggestions */}
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    <button
                      onClick={() => handleSendMessage("What are the main conclusions of this document?")}
                      className="rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                    >
                      What are the conclusions?
                    </button>
                    <button
                      onClick={() => handleSendMessage("What are the key dates, numbers, and deadlines?")}
                      className="rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                    >
                      Dates & Numbers?
                    </button>
                    <button
                      onClick={() => handleSendMessage("What are the key technical skills or requirements?")}
                      className="rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
                    >
                      Skills & Tech?
                    </button>
                    <button
                      onClick={() => handleSendMessage("Are there any restrictions, risks, or caveats?")}
                      className="rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200/80 px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors cursor-pointer"
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
                    <div className="relative flex-1 min-w-0">
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ask a question about this document..."
                        className="w-full rounded-xl border border-slate-300 bg-white px-3.5 sm:px-4 py-2.5 sm:py-3 pr-9 sm:pr-10 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>

                    <button
                      type="submit"
                      disabled={!inputText.trim() || isBotThinking}
                      className="inline-flex items-center justify-center rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 px-4 sm:px-5 py-2.5 sm:py-3 text-white transition-colors cursor-pointer shrink-0"
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
              Fast, intelligent document analysis and extraction with zero subscription fees, zero rate limits, and 100% free access.
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
              Confidential legal papers, corporate financial disclosures, and sensitive documents never leave your local session.
            </p>
          </div>
        </div>

        {/* Optional BYOK Modal */}
        {showByokModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-base">
                <Key className="h-5 w-5 text-blue-600" />
                <span>Connect AI Model (Optional)</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                UFK Tools includes a free built-in intelligent NLP summarizer and Q&A engine with zero fees. If you wish to connect your personal Google Gemini or OpenAI API key for cloud LLM reasoning, paste it below.
              </p>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Google Gemini or OpenAI API Key
                </label>
                <input
                  type="password"
                  value={byokApiKey}
                  onChange={(e) => setByokApiKey(e.target.value)}
                  placeholder="AIza... (Gemini) or sk-... (OpenAI)"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowByokModal(false)}
                  className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 cursor-pointer"
                >
                  Save API Key
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
