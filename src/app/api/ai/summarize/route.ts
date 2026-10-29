import { NextResponse } from "next/server";
import { generateSmartSummary } from "@/lib/ai/nlp-engine";

interface SummarizeRequest {
  text: string;
  totalPages?: number;
  wordCount?: number;
  apiKey?: string;
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
                      text: `You are an expert AI document analyst like ChatGPT. Analyze this document (${totalPages} pages, ~${wordCount} words).
Provide a clear, conversational, and highly structured summary strictly in JSON format matching this schema:
{
  "overview": "A clear, authoritative 2-3 sentence overview explaining what this document is, what it covers, and its purpose.",
  "keyFindings": [
    "First core topic explained clearly with key concepts and practical examples",
    "Second core topic explained clearly with key concepts and practical examples",
    "Third core topic explained clearly with key concepts and practical examples",
    "Fourth core topic explained clearly with key concepts and practical examples"
  ],
  "conclusions": "Crisp actionable takeaway or final conclusion",
  "keywords": [{"word": "topic1", "count": 10}, {"word": "topic2", "count": 8}]
}
Return raw JSON only without markdown code fences.

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
            signal: AbortSignal.timeout(9000),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const clean = raw.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
            const parsed = JSON.parse(clean);
            return NextResponse.json({
              success: true,
              engine: "gemini",
              engineLabel: "Google Gemini 1.5 Flash",
              summary: parsed,
            });
          }
        }
      } catch (err) {
        console.warn("Gemini summarization failed, falling back to smart NLP:", err);
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
                  'You are an expert document analyst like ChatGPT. Return a JSON object with: {"overview": string, "keyFindings": string[], "conclusions": string, "keywords": [{"word": string, "count": number}]}. Be clear, educational, and structured.',
              },
              {
                role: "user",
                content: `Analyze and explain this document (${totalPages} pages):\n\n${text.slice(0, 28000)}`,
              },
            ],
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(9000),
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
        console.warn("OpenAI summarization failed, falling back to smart NLP:", err);
      }
    }

    // 3. Built-in High-Accuracy ChatGPT-Style Semantic NLP Engine (Instant & 100% Free)
    const nlpSummary = generateSmartSummary(text, totalPages);
    return NextResponse.json({
      success: true,
      engine: "built-in-nlp",
      engineLabel: "UFK Intelligent AI Engine (100% Free)",
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
