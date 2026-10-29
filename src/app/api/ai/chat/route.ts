import { NextResponse } from "next/server";
import { answerDocumentQuery, cleanDocumentText } from "@/lib/ai/nlp-engine";

interface ChatRequest {
  query: string;
  chunks: Array<{ page: number; text: string }>;
  history?: Array<{ sender: "user" | "bot"; text: string }>;
  apiKey?: string;
}

export async function POST(req: Request) {
  try {
    const body: ChatRequest = await req.json();
    const { query, chunks, history = [], apiKey: clientApiKey } = body;

    if (!query || !chunks || chunks.length === 0) {
      return NextResponse.json(
        { error: "Query and document context are required." },
        { status: 400 }
      );
    }

    const cleanQuery = query.trim();
    const qTokens = cleanQuery
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    // Score chunks by query keyword frequency
    const scoredChunks = chunks.map((ch) => {
      let score = 0;
      const lower = ch.text.toLowerCase();
      for (const tok of qTokens) {
        if (lower.includes(tok)) score += 1;
      }
      return { chunk: ch, score };
    });

    scoredChunks.sort((a, b) => b.score - a.score);
    const topChunks = scoredChunks.slice(0, 3).filter((s) => s.score > 0);
    const primaryChunk = topChunks[0]?.chunk || chunks[0];

    const contextText = (
      topChunks.length > 0
        ? topChunks.map((tc) => `[Page ${tc.chunk.page}]: ${cleanDocumentText(tc.chunk.text)}`)
        : chunks.slice(0, 2).map((c) => `[Page ${c.page}]: ${cleanDocumentText(c.text)}`)
    ).join("\n\n");

    const geminiKey = (clientApiKey && !clientApiKey.startsWith("sk-")) ? clientApiKey : process.env.GEMINI_API_KEY;
    const openAiKey = clientApiKey?.startsWith("sk-") ? clientApiKey : process.env.OPENAI_API_KEY;

    // 1. Google Gemini
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
                      text: `You are an expert AI document assistant like ChatGPT. Answer the user's question directly, conversationally, and accurately using only the provided document excerpts.
Format your answer with clear markdown (bold terms, bullet points) when explaining concepts or lists. State the relevant page number. Do not make up facts.

Document Excerpts:
${contextText.slice(0, 18000)}

User Question: ${cleanQuery}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 600,
              },
            }),
            signal: AbortSignal.timeout(9000),
          }
        );

        if (geminiRes.ok) {
          const data = await geminiRes.json();
          const answer = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (answer) {
            return NextResponse.json({
              success: true,
              engine: "gemini",
              engineLabel: "Google Gemini 1.5 Flash",
              answer: answer.trim(),
              citedPage: primaryChunk.page,
            });
          }
        }
      } catch (err) {
        console.warn("Gemini chat error, falling back to smart NLP:", err);
      }
    }

    // 2. OpenAI
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
            messages: [
              {
                role: "system",
                content: `You are an expert AI document assistant like ChatGPT. Answer the question directly, conversationally, and accurately based on the excerpts. Use markdown bullet points and bolding for clarity. Always state the relevant page number.\n\nDocument Excerpts:\n${contextText.slice(0, 16000)}`,
              },
              ...history.slice(-3).map((h) => ({
                role: h.sender === "user" ? ("user" as const) : ("assistant" as const),
                content: h.text,
              })),
              { role: "user" as const, content: cleanQuery },
            ],
            temperature: 0.2,
            max_tokens: 500,
          }),
          signal: AbortSignal.timeout(9000),
        });

        if (openaiRes.ok) {
          const data = await openaiRes.json();
          const answer = data.choices?.[0]?.message?.content;
          if (answer) {
            return NextResponse.json({
              success: true,
              engine: "openai",
              engineLabel: "OpenAI GPT-4o Mini",
              answer: answer.trim(),
              citedPage: primaryChunk.page,
            });
          }
        }
      } catch (err) {
        console.warn("OpenAI chat error, falling back to smart NLP:", err);
      }
    }

    // 3. Built-in Entity-Aware Semantic Answer Engine (Instant & 100% Free)
    const localResult = answerDocumentQuery(cleanQuery, chunks);
    return NextResponse.json({
      success: true,
      engine: "built-in-nlp",
      engineLabel: "UFK Intelligent AI Engine (100% Free)",
      answer: localResult.answer,
      citedPage: localResult.citedPage,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to process chat query." }, { status: 500 });
  }
}
