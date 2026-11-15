import Anthropic from "@anthropic-ai/sdk";
import { CHAT_SYSTEM, knowledgeBase } from "@/lib/kb";

export const maxDuration = 60;

const MODEL = "claude-opus-5-5";
const KB = knowledgeBase();

// Small in-memory limiter so a public demo link cannot drain the API budget.
const hits = new Map<string, number[]>();
const WINDOW = 10 * 60_000, LIMIT = 25;

type Msg = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "Live AI is not configured on this deployment. The briefs, rankings and summaries on this page were generated in advance and still work." }, { status: 503 });
  }
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "local";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= LIMIT) return Response.json({ error: "Too many questions in a short time. Please wait a few minutes." }, { status: 429 });
  hits.set(ip, [...recent, now]);

  let messages: Msg[];
  try {
    const body = await req.json();
    messages = (body.messages as Msg[])
      .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim())
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
    if (!messages.length || messages[messages.length - 1].role !== "user") throw new Error("bad");
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const client = new Anthropic();
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 6000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low" },
    system: [
      { type: "text", text: CHAT_SYSTEM },
      { type: "text", text: KB, cache_control: { type: "ephemeral" } },
    ],
    messages,
  });

  const enc = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") controller.enqueue(enc.encode(event.delta.text));
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") controller.enqueue(enc.encode("\n\nThe model declined to answer this question. Try asking about the experiments, materials or atmospheres in the dashboard."));
        else if (final.stop_reason === "max_tokens") controller.enqueue(enc.encode("\n\n(Answer cut short; ask a narrower question for the rest.)"));
      } catch (e) {
        const msg = e instanceof Anthropic.RateLimitError ? "The AI service is busy. Please try again in a moment."
          : e instanceof Anthropic.AuthenticationError ? "The AI key on this deployment is not valid."
          : e instanceof Anthropic.APIError ? `The AI service returned an error (${e.status}).`
          : "The connection to the AI service was interrupted.";
        controller.enqueue(enc.encode(`\n\n${msg}`));
      } finally {
        controller.close();
      }
    },
    cancel() { stream.abort(); },
  });
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
}
