import type { NextRequest } from "next/server";

// Ollama endpoint + model (override with env vars). For Ollama Cloud set
// OLLAMA_URL=https://ollama.com and provide OLLAMA_API_KEY.
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { text, isHtml } = await req.json();

    if (!text) {
      return new Response("Missing text", { status: 400 });
    }

    const systemPrompt = isHtml
      ? `You are a helpful AI assistant for an educational platform.
Your task is to refine and improve the HTML content provided by the user.
Fix any grammar issues, make it clear, concise, and professional.
IMPORTANT:
- ALWAYS respond in the exact same language as the user's input.
- Prioritize supporting Khmer and English.
- PRESERVE ALL HTML TAGS AND STRUCTURE EXACTLY. Only modify the text content inside the tags.
- Return ONLY the refined HTML. Do not include quotes, explanations, conversational filler, or Markdown formatting around the text. Just the raw HTML.`
      : `You are a helpful AI assistant for an educational platform.
Your task is to refine and improve the text provided by the user for input fields like course titles, categories, or descriptions.
Fix any grammar issues, make it clear, concise, and professional.
IMPORTANT:
- ALWAYS respond in the exact same language as the user's input.
- Prioritize supporting Khmer and English.
- Return ONLY the refined text. Do not include quotes, explanations, conversational filler, or Markdown formatting around the text. Just the polished text.`;

    let ollamaRes: Response;
    try {
      ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(OLLAMA_API_KEY
            ? { Authorization: `Bearer ${OLLAMA_API_KEY}` }
            : {}),
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          stream: false,
        }),
      });
    } catch {
      return new Response(
        `Could not reach Ollama at ${OLLAMA_URL}.`,
        { status: 502 }
      );
    }

    if (!ollamaRes.ok) {
      const detail = await ollamaRes.text().catch(() => "");
      return new Response(`Ollama error (${ollamaRes.status}): ${detail}`, {
        status: 502,
      });
    }

    const data = await ollamaRes.json();
    const refinedText: string = data.message?.content ?? "";

    return new Response(JSON.stringify({ text: refinedText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Enhance API Error]:", error);
    return new Response("Internal Error", { status: 500 });
  }
}
