"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";
import { BY_ID } from "@/lib/data";
import { Section } from "./ui";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTED = [
  "A fabric panel ignites in a pressurized rover at 34% oxygen. What does the data say will happen?",
  "Which experiments should I read to choose materials for a Moon base?",
  "Does carbon dioxide or helium put out a flame better in microgravity?",
  "Why can a flame burn at lower oxygen in space than on Earth?",
  "What data could I use to train a model that predicts flame extinction?",
  "How should a smoke detector for a spacecraft differ from one at home?",
];

function Rich({ text, onOpen }: { text: string; onOpen: (id: string) => void }) {
  // Render **bold**, bullet lines and [PSI-69] citations; nothing else is interpreted.
  const inline = (s: string, key: string) =>
    s.split(/(\[PSI-\d+(?:,\s*PSI-\d+)*\]|\*\*[^*]+\*\*)/g).map((part, i) => {
      if (/^\[PSI-/.test(part)) {
        return part.slice(1, -1).split(/,\s*/).map((id) => (
          <button key={`${key}-${i}-${id}`} onClick={() => BY_ID.has(id) && onOpen(id)} title={BY_ID.get(id)?.title}
            className="mx-0.5 inline-flex translate-y-[-1px] items-center rounded-md bg-flame/15 px-1.5 py-px font-mono text-[11px] text-flame transition hover:bg-flame/30">
            {BY_ID.get(id)?.name ?? id}
          </button>
        ));
      }
      if (/^\*\*/.test(part)) return <strong key={`${key}-${i}`} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
      return <span key={`${key}-${i}`}>{part}</span>;
    });
  const lines = text.split("\n");
  return (
    <div className="space-y-2.5 text-[15px] leading-relaxed text-fg/95">
      {lines.map((l, i) => {
        if (!l.trim()) return null;
        if (/^\s*[-•]\s+/.test(l)) return <div key={i} className="flex gap-2.5 pl-1"><span className="mt-[10px] h-1 w-1 shrink-0 rounded-full bg-flame" /><span>{inline(l.replace(/^\s*[-•]\s+/, ""), `l${i}`)}</span></div>;
        if (/^#+\s/.test(l)) return <div key={i} className="display pt-1 font-medium text-white">{l.replace(/^#+\s/, "")}</div>;
        return <p key={i}>{inline(l, `l${i}`)}</p>;
      })}
    </div>
  );
}

export default function Ask({ onOpen }: { onOpen: (id: string) => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const box = useRef<HTMLDivElement>(null);

  async function send(text: string) {
    const q = text.trim();
    if (!q || busy) return;
    const history: Msg[] = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: history }) });
      if (!res.ok || !res.body) throw new Error((await res.json().catch(() => null))?.error ?? `Request failed (${res.status})`);
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...history, { role: "assistant", content: acc }]);
        box.current?.scrollTo({ top: box.current.scrollHeight });
      }
      if (!acc.trim()) throw new Error("The model returned no answer. Try rephrasing the question.");
    } catch (e) {
      setMsgs(history);
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Section id="ask" eyebrow="05 · Ask the data" title="Ask a fire-safety question. Get an answer with its sources." lead="The assistant reads only the 26 PSI records and the test tables behind this dashboard. It cites the investigation for every claim and says so when the data does not cover your question.">
      <div className="card overflow-hidden">
        <div ref={box} className="scroll-thin max-h-[560px] min-h-[280px] space-y-6 overflow-y-auto p-5 md:p-8">
          {msgs.length === 0 && (
            <div>
              <div className="flex items-center gap-2 text-sm text-muted"><Sparkles size={15} className="text-flame" /> Try one of these</div>
              <div className="mt-4 grid gap-2.5 md:grid-cols-2">
                {SUGGESTED.map((s, i) => (
                  <motion.button key={s} initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} onClick={() => send(s)}
                    className="rounded-xl border border-line bg-white/[0.02] p-3.5 text-left text-sm leading-snug text-fg/90 transition hover:border-flame/50 hover:bg-flame/[0.06]">
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          <AnimatePresence initial={false}>
            {msgs.map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={m.role === "user" ? "flex justify-end" : ""}>
                {m.role === "user" ? (
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-white/[0.09] px-4 py-2.5 text-[15px] text-white">{m.content}</div>
                ) : m.content ? (
                  <Rich text={m.content} onOpen={onOpen} />
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span className="flex gap-1">{[0, 1, 2].map((d) => <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-flame" animate={{ opacity: [0.25, 1, 0.25] }} transition={{ repeat: Infinity, duration: 1.1, delay: d * 0.18 }} />)}</span>
                    Reading the PSI records…
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {error && <div className="rounded-xl border border-hot/30 bg-hot/[0.07] p-3 text-sm text-hot">{error}</div>}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-3 border-t border-line bg-white/[0.02] p-3 md:px-6">
          <input value={input} onChange={(e) => setInput(e.target.value)} maxLength={600} placeholder="Ask about materials, oxygen, smoke, extinguishing…" className="h-11 flex-1 bg-transparent px-2 text-[15px] text-white outline-none placeholder:text-dim" />
          {msgs.length > 0 && !busy && <button type="button" onClick={() => { setMsgs([]); setError(null); }} className="text-xs text-dim hover:text-white">Clear</button>}
          <button disabled={busy || !input.trim()} className="grid h-10 w-10 place-items-center rounded-full bg-white text-black transition hover:bg-flame disabled:opacity-30" aria-label="Send"><ArrowUp size={18} /></button>
        </form>
      </div>
      <p className="mt-3 text-xs text-dim">Answers are generated by Claude from the data behind this dashboard. They are research guidance, not flight-safety certification.</p>
    </Section>
  );
}
