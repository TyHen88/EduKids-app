import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { assertAdminOrParent } from "@/actions/tools";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    await assertAdminOrParent();

    const { messages } = await req.json();

    const coreMessages = messages.map((m: any) => ({
      role: m.role,
      content: m.parts ? m.parts.map((p: any) => p.type === 'text' ? p.text : '').join('') : m.content
    }));

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system:
        "You are a specialized AI assistant for the EduKids language learning platform. Your primary focus is to assist admins and parents with the system, specifically by helping them write courses, challenges, and quizzes, which serve as tips for users. You also act as a secondary external search engine to provide general knowledge when necessary, but always prioritize EduKids-related tasks. IMPORTANT: Always respond in the EXACT same language that the user uses to prompt you. If the user writes in Khmer, your entire response must be in Khmer. Do not mix languages or default to English unless explicitly asked to do so.",
      messages: coreMessages,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error("[Chat API Error]:", error);
    if (error instanceof Error && error.message === "Unauthorized.") {
      return new Response("Unauthorized", { status: 401 });
    }
    return new Response("Internal Server Error", { status: 500 });
  }
}
