"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Check, Plus, Search, X } from "lucide-react";
import { STUDIES, fmtBytes } from "@/lib/data";
import type { Pillar, Study } from "@/lib/types";
import { Dots, PHASE_COLOR, PILLAR_META, PillarChips, Section, Seg } from "./ui";

type PF = "all" | Pillar;
const PHASES = ["all", "solid", "liquid", "gas", "aerosol"] as const;

export default function Explorer({ onOpen }: { onOpen: (id: string) => void }) {
  const [q, setQ] = useState("");
  const [pillar, setPillar] = useState<PF>("all");
  const [phase, setPhase] = useState<(typeof PHASES)[number]>("all");
  const [sort, setSort] = useState<"relevance" | "data" | "tests">("relevance");
  const [cmp, setCmp] = useState<string[]>([]);
  const [showCmp, setShowCmp] = useState(false);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return STUDIES.filter((s) => {
      if (pillar !== "all" && s.ai.pillars[pillar] < 2) return false;
      if (phase !== "all" && s.ai.fuelPhase !== phase) return false;
      if (!needle) return true;
      return [s.id, s.name, s.title, s.ai.oneLiner, s.ai.fuels.join(" "), s.hardware, s.ai.measurements.join(" ")].join(" ").toLowerCase().includes(needle);
    }).sort((a, b) =>
      sort === "data" ? b.bytes - a.bytes : sort === "tests" ? b.nTests - a.nTests
        : b.ai.fireSafetyRelevance - a.ai.fireSafetyRelevance || b.ai.materialRealism - a.ai.materialRealism || a.num - b.num);
  }, [q, pillar, phase, sort]);

  const toggle = (id: string) => setCmp((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length < 3 ? [...c, id] : c));

  return (
    <Section
      id="explore"
      eyebrow="04 · Investigations"
      title="Every combustion investigation in PSI, in one readable format."
      lead="Objectives, fuels, test conditions, sensors and findings are extracted by AI from each official record, so different experiments can finally be read side by side. Select up to three to compare."
    >
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex h-10 min-w-[220px] flex-1 items-center gap-2 rounded-full border border-line bg-panel px-4 focus-within:border-flame/60">
          <Search size={15} className="text-dim" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fuel, material, sensor, hardware…" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-dim" />
        </label>
        <Seg<PF> layoutId="ex-pillar" value={pillar} onChange={setPillar} options={[{ value: "all", label: "All" }, { value: "prevention", label: "Prevention" }, { value: "detection", label: "Detection" }, { value: "suppression", label: "Suppression" }]} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {PHASES.map((p) => (
            <button key={p} onClick={() => setPhase(p)} className={`chip capitalize transition ${phase === p ? "!border-white/50 !text-white" : ""}`}>
              {p !== "all" && <span className="h-2 w-2 rounded-full" style={{ background: PHASE_COLOR[p] }} />}
              {p === "all" ? "Any fuel" : p}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-dim">
          Sort
          {(["relevance", "tests", "data"] as const).map((s) => (
            <button key={s} onClick={() => setSort(s)} className={`rounded-full px-2.5 py-1 ${sort === s ? "bg-panel-2 text-white" : "hover:text-white"}`}>
              {s === "relevance" ? "Fire-safety relevance" : s === "tests" ? "Tests parsed" : "Data volume"}
            </button>
          ))}
        </div>
      </div>

      <motion.div layout className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((s) => {
            const sel = cmp.includes(s.id);
            return (
              <motion.article key={s.id} layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.22 }}
                className={`card card-hover group relative flex cursor-pointer flex-col p-5 ${sel ? "!border-flame/60" : ""}`} onClick={() => onOpen(s.id)}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[11px] text-dim">{s.id} · {s.projectType.replace(" Investigation", "")}</div>
                    <h3 className="display mt-1 text-lg font-semibold leading-snug text-white">{s.name}</h3>
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggle(s.id); }} aria-label="Add to comparison" title="Compare"
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border transition ${sel ? "border-flame bg-flame text-black" : "border-line-2 text-muted hover:text-white"}`}>
                    {sel ? <Check size={14} /> : <Plus size={14} />}
                  </button>
                </div>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.ai.oneLiner}</p>
                <div className="mt-4 flex flex-wrap items-center gap-1.5">
                  <span className="chip capitalize"><span className="h-2 w-2 rounded-full" style={{ background: PHASE_COLOR[s.ai.fuelPhase] }} />{s.ai.fuelPhase === "none" ? "not combustion" : s.ai.fuelPhase}</span>
                  <PillarChips pillars={s.ai.pillars} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[11px] text-dim">
                  <span>Relevance<br /><span className="mt-1 inline-block"><Dots value={s.ai.fireSafetyRelevance} /></span></span>
                  <span>Tests parsed<br /><b className="font-mono text-[13px] font-normal text-fg">{s.nTests || "—"}</b></span>
                  <span>Data<br /><b className="font-mono text-[13px] font-normal text-fg">{fmtBytes(s.bytes)}</b></span>
                </div>
              </motion.article>
            );
          })}
        </AnimatePresence>
      </motion.div>
      {list.length === 0 && <p className="mt-10 text-center text-muted">No investigation matches these filters.</p>}

      <AnimatePresence>
        {cmp.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed inset-x-0 bottom-5 z-30 mx-auto flex w-fit max-w-[92vw] items-center gap-3 rounded-full border border-line-2 bg-bg-2/95 py-2 pl-5 pr-2 shadow-2xl backdrop-blur-xl">
            <span className="truncate text-sm text-muted">{cmp.map((id) => STUDIES.find((s) => s.id === id)!.name).join(" · ")}</span>
            <button onClick={() => setCmp([])} className="text-dim hover:text-white" aria-label="Clear"><X size={15} /></button>
            <button disabled={cmp.length < 2} onClick={() => setShowCmp(true)} className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black disabled:opacity-40">
              Compare {cmp.length}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>{showCmp && <Compare ids={cmp} onClose={() => setShowCmp(false)} />}</AnimatePresence>
    </Section>
  );
}

const ROWS: [string, (s: Study) => React.ReactNode][] = [
  ["What it did", (s) => s.ai.oneLiner],
  ["Safety pillars", (s) => (
    <span className="space-y-1">{(Object.keys(PILLAR_META) as Pillar[]).map((p) => (
      <span key={p} className="flex items-center justify-between gap-3"><span>{PILLAR_META[p].label}</span><Dots value={s.ai.pillars[p]} color={PILLAR_META[p].color} /></span>
    ))}</span>
  )],
  ["Fuel", (s) => `${s.ai.fuelPhase}: ${s.ai.fuels.join(", ") || "—"}`],
  ["Shape and size", (s) => s.ai.geometry],
  ["Oxygen", (s) => s.ai.conditions.oxygen],
  ["Pressure", (s) => s.ai.conditions.pressure],
  ["Air flow", (s) => s.ai.conditions.flow],
  ["What varied", (s) => s.ai.variables.join(" · ")],
  ["Measurements", (s) => s.ai.measurements.join(" · ")],
  ["Hardware", (s) => s.hardware || "Not stated in record"],
  ["Tests parsed", (s) => (s.nTests ? `${s.nTests}${s.o2Range ? ` · ${s.o2Range[0]}–${s.o2Range[1]}% O₂` : ""}` : "No per-test table with conditions")],
  ["Safety takeaway", (s) => s.ai.safetyInsight],
  ["Limitation", (s) => s.ai.limitations],
];

function Compare({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const items = ids.map((id) => STUDIES.find((s) => s.id === id)!);
  const shared = (f: (s: Study) => string) => new Set(items.map(f)).size === 1;
  const same = [
    shared((s) => s.ai.fuelPhase) && `same fuel phase (${items[0].ai.fuelPhase})`,
    shared((s) => s.hardware) && items[0].hardware && "same hardware",
    shared((s) => s.platform) && items[0].platform && `same platform (${items[0].platform})`,
  ].filter(Boolean);
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ y: 30, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="scroll-thin max-h-[88vh] w-full max-w-6xl overflow-auto rounded-3xl border border-line-2 bg-bg-2 p-6 md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Side-by-side</div>
            <h3 className="display mt-2 text-2xl font-semibold text-white">{items.map((s) => s.name).join(" vs ")}</h3>
            <p className="mt-1 text-sm text-muted">{same.length ? `In common: ${same.join(", ")}.` : "These investigations share no fuel phase, hardware or platform."}</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line-2 text-muted hover:text-white" aria-label="Close"><X size={16} /></button>
        </div>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="w-36" />
                {items.map((s) => <th key={s.id} className="border-b border-line-2 px-3 pb-3 text-left"><span className="display text-base text-white">{s.name}</span><br /><span className="font-mono text-[11px] font-normal text-dim">{s.id}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, f]) => (
                <tr key={label} className="align-top">
                  <td className="border-b border-line py-3 pr-3 text-xs uppercase tracking-wider text-dim">{label}</td>
                  {items.map((s) => <td key={s.id} className="border-b border-line px-3 py-3 leading-relaxed text-fg/90">{f(s)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
