import { NextResponse } from "next/server";

interface ChatRequest {
  query: string;
  chunks: Array<{ page: number; text: string }>;
  history?: Array<{ sender: "user" | "bot"; text: string }>;
  apiKey?: string;
}

function synthesizeLocalAnswer(
  query: string,
  chunks: Array<{ page: number; text: string }>
) {
  const qTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  // Score chunks
  const scored = chunks.map((chunk) => {
    let matches = 0;
    const lower = chunk.text.toLowerCase();
    for (const tok of qTokens) {
      if (lower.includes(tok)) matches += 1;
    }
    return { chunk, matches };
  });

  scored.sort((a, b) => b.matches - a.matches);
  const best = scored[0];

  if (!best || best.matches === 0) {
    return {
      answer: `I analyzed all ${chunks.length} pages of your document, but could not find a direct section discussing "${query}". Try searching for one of the primary keywords extracted in the Summary tab.`,
      citedPage: undefined,
    };
  }

  // Extract the most relevant 2 sentences from the best chunk
  const sentences = best.chunk.text.match(/[^.!?\n]+[.!?\n]+/g) || [best.chunk.text];
  const relevantSentences = sentences
    .map((s) => {
      const sLower = s.toLowerCase();
      let matchCount = 0;
      for (const tok of qTokens) {
        if (sLower.includes(tok)) matchCount += 1;
      }
      return { text: s.replace(/\s+/g, " ").trim(), matchCount };
    })
    .filter((s) => s.matchCount > 0 && s.text.length >= 25);

  relevantSentences.sort((a, b) => b.matchCount - a.matchCount);

  let answerText = "";
  if (relevantSentences.length > 0) {
    answerText = `According to Page ${best.chunk.page}: "${relevantSentences.slice(0, 2).map((s) => s.text).join(" ")}"`;
  } else {
    answerText = `From Page ${best.chunk.page}: ${best.chunk.text.slice(0, 260).trim()}...`;
  }

  return {
    answer: answerText,
    citedPage: best.chunk.page,
  };
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

    const qTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length >= 3);

    // Score and get top relevant excerpts
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
        ? topChunks.map((tc) => `[Page ${tc.chunk.page}]: ${tc.chunk.text}`)
        : chunks.slice(0, 2).map((c) => `[Page ${c.page}]: ${c.text}`)
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
                      text: `You are an intelligent document research assistant. Answer the user's question accurately using the provided document excerpts. Keep answers clear, natural, and helpful. Always cite the relevant page numbers from the excerpts.

Document Excerpts:
${contextText.slice(0, 16000)}

User Question: ${query}`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 600,
              },
            }),
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
        console.warn("Gemini chat error, falling back:", err);
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
                content: `You are an intelligent document research assistant. Answer questions based on the document excerpts provided. Keep answers concise and mention relevant page numbers.\n\nDocument Excerpts:\n${contextText.slice(0, 14000)}`,
              },
              ...history.slice(-3).map((h) => ({
                role: h.sender === "user" ? ("user" as const) : ("assistant" as const),
                content: h.text,
              })),
              { role: "user" as const, content: query },
            ],
            temperature: 0.3,
            max_tokens: 500,
          }),
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
        console.warn("OpenAI chat error, falling back:", err);
      }
    }

    // 3. Built-in Local Semantic Answer Engine
    const localResult = synthesizeLocalAnswer(query, chunks);
    return NextResponse.json({
      success: true,
      engine: "built-in-nlp",
      engineLabel: "UFK Intelligent NLP Engine (100% Free)",
      answer: localResult.answer,
      citedPage: localResult.citedPage,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to process chat query." }, { status: 500 });
  }
}
