import { NextResponse } from "next/server";

interface SummarizeRequest {
  text: string;
  totalPages?: number;
  wordCount?: number;
  apiKey?: string;
}

const STOP_WORDS = new Set([
  "the", "and", "to", "of", "in", "for", "with", "is", "a", "an", "on", "that", "this",
  "by", "at", "as", "from", "are", "be", "or", "it", "was", "were", "which", "have", "has",
  "had", "not", "but", "we", "they", "you", "their", "our", "all", "can", "will", "would",
  "been", "more", "also", "into", "than", "other", "its", "any", "no", "may", "such",
  "these", "them", "then", "there", "about", "could", "should", "their", "being", "what",
  "when", "where", "who", "how", "each", "both", "under", "between", "over"
]);

function extractIntelligentSummary(text: string, totalPages: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const freqMap = new Map<string, number>();

  for (const w of words) {
    const cleaned = w.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (cleaned.length >= 4 && !STOP_WORDS.has(cleaned)) {
      freqMap.set(cleaned, (freqMap.get(cleaned) || 0) + 1);
    }
  }

  const sortedKeywords = Array.from(freqMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word, count]) => ({ word, count }));

  // Sentence tokenization
  const rawSentences = text.match(/[^.!?\n]+[.!?\n]+/g) || [text];
  const candidates: Array<{ text: string; score: number; pos: number }> = [];

  rawSentences.forEach((raw, idx) => {
    const cleaned = raw.replace(/\s+/g, " ").trim();
    if (cleaned.length < 35 || cleaned.length > 320) return;
    if (/^[0-9\s.,-]+$/.test(cleaned)) return; // skip bare numeric rows

    const sWords = cleaned.toLowerCase().split(/\s+/);
    let score = 0;
    for (const sw of sWords) {
      const wClean = sw.replace(/[^a-z0-9]/g, "");
      if (freqMap.has(wClean)) {
        score += freqMap.get(wClean)!;
      }
    }

    // Length normalization & position bonus
    const normScore = score / Math.sqrt(sWords.length || 1);
    const posBonus = idx < 8 ? 1.4 : idx > rawSentences.length - 8 ? 1.2 : 1.0;

    candidates.push({
      text: cleaned,
      score: normScore * posBonus,
      pos: idx,
    });
  });

  candidates.sort((a, b) => b.score - a.score);

  // Pick top distinctive sentences
  const selected: string[] = [];
  for (const cand of candidates) {
    if (selected.length >= 6) break;
    // ensure not redundant with an existing selected sentence
    const isRedundant = selected.some((s) => {
      const sWords = new Set(s.toLowerCase().split(/\s+/));
      const candWords = cand.text.toLowerCase().split(/\s+/);
      const overlap = candWords.filter((w) => sWords.has(w)).length;
      return overlap / Math.max(candWords.length, 1) > 0.65;
    });

    if (!isRedundant) {
      selected.push(cand.text);
    }
  }

  const overview = selected.slice(0, 2).join(" ");
  const keyFindings = selected.slice(2, 6);
  const conclusions = selected[selected.length - 1] || "The document presents structured domain insights summarized across its pages.";

  return {
    overview: overview || "This document contains structured analytical findings and operational details.",
    keyFindings: keyFindings.length > 0 ? keyFindings : [
      "Key topics analyzed based on predominant terminology across all sections.",
      `Document analyzed across ${totalPages} page(s) and ${words.length.toLocaleString()} words.`
    ],
    conclusions,
    keywords: sortedKeywords,
  };
}

export async function POST(req: Request) {
  try {
    const body: SummarizeRequest = await req.json();
    const { text, totalPages = 1, wordCount = 0, apiKey: clientApiKey } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ error: "No document text provided." }, { status: 400 });
    }

    const geminiKey = (clientApiKey && !clientApiKey.startsWith("sk-")) ? clientApiKey : process.env.GEMINI_API_KEY;
    const openAiKey = clientApiKey?.startsWith("sk-") ? clientApiKey : process.env.OPENAI_API_KEY;

    // 1. Google Gemini Generative API if key available
    if (geminiKey) {
      try {
        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an expert executive document analyst. Analyze the following document text (${totalPages} pages, ~${wordCount} words) and return a concise, high-value executive summary strictly in JSON format.
                      
JSON Structure:
{
  "overview": "A polished 2-3 sentence executive abstract explaining what this document is about",
  "keyFindings": [
    "First core finding or highlight",
    "Second core finding or highlight",
    "Third core finding or highlight",
    "Fourth core finding or highlight"
  ],
  "conclusions": "Key actionable takeaway or overall conclusion",
  "keywords": [{"word": "topic1", "count": 10}, {"word": "topic2", "count": 8}]
}

Document Content:
${text.slice(0, 32000)}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json",
              },
            }),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw);
            return NextResponse.json({
              success: true,
              engine: "gemini",
              engineLabel: "Google Gemini 1.5 Flash",
              summary: parsed,
            });
          }
        }
      } catch (err) {
        console.warn("Gemini summarization failed, falling back to local NLP:", err);
      }
    }

    // 2. OpenAI API if key available
    if (openAiKey) {
      try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              {
                role: "system",
                content:
                  'You are an expert document analyst. Return a JSON object with: {"overview": string, "keyFindings": string[], "conclusions": string, "keywords": [{"word": string, "count": number}]}',
              },
              {
                role: "user",
                content: `Analyze this document (${totalPages} pages):\n\n${text.slice(0, 28000)}`,
              },
            ],
            temperature: 0.2,
          }),
        });

        if (openaiRes.ok) {
          const data = await openaiRes.json();
          const raw = data.choices?.[0]?.message?.content;
          if (raw) {
            const parsed = JSON.parse(raw);
            return NextResponse.json({
              success: true,
              engine: "openai",
              engineLabel: "OpenAI GPT-4o Mini",
              summary: parsed,
            });
          }
        }
      } catch (err) {
        console.warn("OpenAI summarization failed, falling back to local NLP:", err);
      }
    }

    // 3. Built-in High-Accuracy Intelligent NLP Summarizer
    const nlpSummary = extractIntelligentSummary(text, totalPages);
    return NextResponse.json({
      success: true,
      engine: "built-in-nlp",
      engineLabel: "UFK Intelligent NLP Engine (100% Free)",
      summary: nlpSummary,
    });
  } catch (error) {
    console.error("Summarization API error:", error);
    return NextResponse.json(
      { error: "Failed to compile document summary." },
      { status: 500 }
    );
  }
}
