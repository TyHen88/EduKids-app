import type { NextRequest } from "next/server";
import { assertAdminOrParent } from "@/actions/tools";

export const maxDuration = 30;

// Ollama endpoint + model (override with env vars). For Ollama Cloud set
// OLLAMA_URL=https://ollama.com and provide OLLAMA_API_KEY.
const OLLAMA_URL = process.env.OLLAMA_URL ?? "http://127.0.0.1:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? "llama3.2";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;

const SYSTEM_PROMPT =
  "You are a specialized AI assistant for the EduKids language learning platform. Your primary focus is to assist admins and parents with the system, specifically by helping them write courses, challenges, and quizzes, which serve as tips for users. You also act as a secondary external search engine to provide general knowledge when necessary, but always prioritize EduKids-related tasks. IMPORTANT: Always respond in the EXACT same language that the user uses to prompt you. If the user writes in Khmer, your entire response must be in Khmer. Do not mix languages or default to English unless explicitly asked to do so.";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export async function POST(req: NextRequest) {
  // Gate to admins/parents (same guard as before).
  try {
    await assertAdminOrParent();
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized.") {
      return new Response("Unauthorized", { status: 401 });
    }
    console.error("[Chat API Error]:", error);
    return new Response("Internal Server Error", { status: 500 });
  }

  let incoming: any[];
  try {
    const body = await req.json();
    incoming = body.messages;
    if (!Array.isArray(incoming)) throw new Error("`messages` must be an array");
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  // Prepend the system prompt and normalize each message to plain
  // { role, content } (older clients may send AI-SDK-style `parts`).
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...incoming.map((m) => ({
      role: m.role,
      content:
        typeof m.content === "string"
          ? m.content
          : m.parts
              ?.map((p: any) => (p.type === "text" ? p.text : ""))
              .join("") ?? "",
    })),
  ];

  let ollamaRes: Response;
  try {
    ollamaRes = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages,
        stream: true,
      }),
    });
  } catch {
    return new Response(
      `Could not reach Ollama at ${OLLAMA_URL}. Is it running? (\`ollama serve\`)`,
      { status: 502 }
    );
  }

  if (!ollamaRes.ok || !ollamaRes.body) {
    const detail = await ollamaRes.text().catch(() => "");
    return new Response(`Ollama error (${ollamaRes.status}): ${detail}`, {
      status: 502,
    });
  }

  // Ollama streams newline-delimited JSON. Re-emit just the token text so the
  // client can render it as a plain text stream.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = ollamaRes.body!.getReader();
      let buffer = "";

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep the trailing partial line

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            try {
              const json = JSON.parse(trimmed);
              const token: string = json.message?.content ?? "";
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // ignore malformed lines
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
