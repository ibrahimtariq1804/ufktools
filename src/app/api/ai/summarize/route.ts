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
                      text: `You are an expert executive document analyst. Analyze this document (${totalPages} pages, ~${wordCount} words).
Provide a sharp, to-the-point, and highly structured summary strictly in JSON format. Do not include vague filler phrases or markdown code fences.

JSON Structure:
{
  "overview": "A clear, authoritative 2-sentence overview stating the specific subject/candidate/purpose and core competencies or scope",
  "keyFindings": [
    "First crucial finding, metric, or requirement with exact numbers if present",
    "Second crucial finding, metric, or requirement",
    "Third crucial finding, metric, or requirement",
    "Fourth crucial finding, metric, or requirement"
  ],
  "conclusions": "Crisp actionable takeaway or final qualification verdict",
  "keywords": [{"word": "topic1", "count": 10}, {"word": "topic2", "count": 8}]
}

Document Content:
${text.slice(0, 32000)}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.15,
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
                  'You are an expert document analyst. Return a JSON object with: {"overview": string, "keyFindings": string[], "conclusions": string, "keywords": [{"word": string, "count": number}]}. Be to-the-point and factual.',
              },
              {
                role: "user",
                content: `Analyze this document (${totalPages} pages):\n\n${text.slice(0, 28000)}`,
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
        console.warn("OpenAI summarization failed, falling back to local NLP:", err);
      }
    }

    // 3. High-Speed Cloud LLM Proxy (Free tier with 4s timeout)
    try {
      const freeLlmRes = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an expert document analyst. Return ONLY a valid JSON object without backticks or markdown:
{"overview": "2-sentence executive summary with specific names, titles, and scope", "keyFindings": ["Finding 1 with exact numbers", "Finding 2", "Finding 3", "Finding 4"], "conclusions": "Crisp verdict or takeaway", "keywords": [{"word": "key1", "count": 5}]}`,
            },
            {
              role: "user",
              content: `Document Content:\n\n${text.slice(0, 16000)}`,
            },
          ],
          model: "openai",
          jsonMode: true,
        }),
        signal: AbortSignal.timeout(4500),
      });

      if (freeLlmRes.ok) {
        const rawText = await freeLlmRes.text();
        // Clean possible markdown code fences
        const cleanJson = rawText.replace(/^```json\s*/i, "").replace(/```\s*$/, "").trim();
        const parsed = JSON.parse(cleanJson);
        if (parsed.overview && Array.isArray(parsed.keyFindings) && parsed.keyFindings.length > 0) {
          return NextResponse.json({
            success: true,
            engine: "cloud-llm",
            engineLabel: "High-Precision Cloud AI (Free)",
            summary: parsed,
          });
        }
      }
    } catch {
      // Gracefully fall through to smart NLP engine
    }

    // 4. Built-in High-Accuracy Semantic NLP Summarizer (Entity & structure-aware)
    const nlpSummary = generateSmartSummary(text, totalPages);
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
