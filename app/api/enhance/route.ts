import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function POST(req: Request) {
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

    const { text: refinedText } = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: text,
    });

    return new Response(JSON.stringify({ text: refinedText }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[Enhance API Error]:", error);
    return new Response("Internal Error", { status: 500 });
  }
}
