"use client";

import { motion } from "motion/react";
import { useEffect } from "react";
import { ArrowUpRight, X } from "lucide-react";
import { BY_ID, TESTS, fmtBytes } from "@/lib/data";
import type { Pillar } from "@/lib/types";
import { AiBadge, Dots, PHASE_COLOR, PILLAR_META } from "./ui";

export default function Detail({ id, onClose }: { id: string; onClose: () => void }) {
  const s = BY_ID.get(id)!;
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  if (!s) return null;
  const ai = s.ai;
  const mine = TESTS.filter((t) => t.inv === id && !t.matrix);
  const bins = new Map<number, number>();
  for (const t of mine) { const b = Math.round(t.o2 / 2) * 2; bins.set(b, (bins.get(b) ?? 0) + 1); }
  const hist = [...bins.entries()].sort((a, b) => a[0] - b[0]);
  const maxBin = Math.max(1, ...hist.map((h) => h[1]));
  const outcomes = new Map<string, number>();
  for (const t of mine) if (t.outcome) outcomes.set(t.outcome, (outcomes.get(t.outcome) ?? 0) + 1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.aside
        initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 320, damping: 36 }}
        onClick={(e) => e.stopPropagation()} role="dialog" aria-label={s.title}
        className="scroll-thin absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto border-l border-line-2 bg-bg-2 p-6 md:p-9"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="font-mono text-xs text-dim">{s.id} · {s.projectType}{s.platform ? ` · ${s.platform}` : ""}</div>
            <h3 className="display mt-2 text-3xl font-semibold text-white">{s.name}</h3>
            <p className="mt-1 text-sm text-muted">{s.title}</p>
          </div>
          <button onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line-2 text-muted hover:text-white" aria-label="Close"><X size={16} /></button>
        </div>

        <div className="mt-6 rounded-2xl border border-flame/25 bg-flame/[0.05] p-5">
          <div className="flex items-center justify-between"><span className="eyebrow">Summary</span><AiBadge /></div>
          <p className="mt-3 text-[15px] leading-relaxed text-fg">{ai.summary}</p>
          <p className="mt-4 border-t border-flame/15 pt-4 text-[15px] leading-relaxed text-white"><span className="text-flame">Fire-safety takeaway · </span>{ai.safetyInsight}</p>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {(Object.keys(PILLAR_META) as Pillar[]).map((p) => (
            <div key={p} className="rounded-xl border border-line p-3">
              <div className="text-xs" style={{ color: PILLAR_META[p].color }}>{PILLAR_META[p].label}</div>
              <div className="mt-2"><Dots value={ai.pillars[p]} color={PILLAR_META[p].color} /></div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted">{ai.relevanceReason}</p>

        <H>Test conditions</H>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <KV k="Fuel"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: PHASE_COLOR[ai.fuelPhase] }} />{ai.fuelPhase} · {ai.fuels.join(", ") || "—"}</KV>
          <KV k="Shape and size">{ai.geometry}</KV>
          <KV k="Oxygen">{ai.conditions.oxygen}</KV>
          <KV k="Pressure">{ai.conditions.pressure}</KV>
          <KV k="Air flow">{ai.conditions.flow}</KV>
          <KV k="Gravity">{ai.conditions.gravity}</KV>
          <KV k="What varied between tests">{ai.variables.join(" · ")}</KV>
          <KV k="Sensors and measurements">{ai.measurements.join(" · ")}</KV>
        </dl>

        {hist.length > 0 && (
          <>
            <H>Oxygen levels tested <span className="ml-2 font-mono text-[11px] normal-case tracking-normal text-dim">{mine.length} tests from the PSI table</span></H>
            <div className="flex h-24 items-end gap-1">
              {hist.map(([b, n]) => (
                <div key={b} className="flex h-full flex-1 flex-col items-center justify-end" title={`${b}% O2: ${n} tests`}>
                  <motion.div initial={{ height: 0 }} animate={{ height: `${(n / maxBin) * 100}%` }} transition={{ duration: 0.5, delay: 0.1 }} className="w-full min-h-[2px] rounded-t" style={{ background: b >= 30 && b <= 34 ? "var(--warn)" : PHASE_COLOR[mine[0].phase] ?? "var(--flame)" }} />
                </div>
              ))}
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px] text-dim"><span>{hist[0][0]}%</span><span>{hist[hist.length - 1][0]}% O₂</span></div>
            {outcomes.size > 0 && <p className="mt-2 text-xs text-muted">Recorded outcomes: {[...outcomes.entries()].map(([k, v]) => `${k} ${v}`).join(" · ")}</p>}
          </>
        )}

        <H>{ai.findingsAreResults ? "Key findings" : "What the data lets you determine"}</H>
        <ul className="space-y-2.5">
          {ai.keyFindings.map((f, i) => <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-fg/90"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-flame" />{f}</li>)}
        </ul>
        {!ai.findingsAreResults && <p className="mt-2 text-xs text-dim">The PSI record describes aims and data, not results; see the publications below for conclusions.</p>}

        <H>For modellers and designers</H>
        <dl className="grid gap-y-3">
          <KV k={<>Value for predictive modelling <span className="ml-1.5"><Dots value={ai.modelingValue} /></span></>}>{ai.modelingNote}</KV>
          <KV k="Informs equipment">{ai.informsEquipment}</KV>
          <KV k="Limitation for exploration">{ai.limitations}</KV>
          <KV k="Benefit on Earth">{ai.earthBenefit}</KV>
        </dl>

        <H>Official record</H>
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          <KV k="Principal investigator">{s.pis.join(", ") || "Not listed"}</KV>
          <KV k="Hardware">{s.hardware || "Not stated"}</KV>
          <KV k="Dates">{s.start || "?"} → {s.end || "?"}</KV>
          <KV k="Data">{s.nFiles.toLocaleString()} file groups · {fmtBytes(s.bytes)} · {s.license}</KV>
        </dl>
        {s.pubs.length > 0 && (
          <details className="mt-4 rounded-xl border border-line p-4 text-sm">
            <summary className="cursor-pointer text-fg">Publications ({s.nPubs})</summary>
            <ul className="mt-3 space-y-2 text-muted">{s.pubs.map((p, i) => <li key={i}>{p.title}{p.authors && <span className="text-dim"> — {p.authors}</span>}</li>)}</ul>
          </details>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-medium text-black hover:bg-flame">Open in NASA PSI <ArrowUpRight size={14} /></a>
          {s.doi && <a href={`https://doi.org/${s.doi}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-line-2 px-4 py-2 text-sm text-fg hover:bg-panel-2">DOI {s.doi}</a>}
        </div>
        <p className="mt-6 text-[11px] leading-relaxed text-dim">Summary, scores and extracted attributes were generated by {ai.model} on {ai.generatedAt} from this PSI record and its experimental table only. Verify against the source before engineering use.</p>
      </motion.aside>
    </motion.div>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h4 className="mb-3 mt-8 text-xs font-medium uppercase tracking-[0.14em] text-dim">{children}</h4>;
}
function KV({ k, children }: { k: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-dim">{k}</dt>
      <dd className="mt-0.5 text-sm leading-relaxed text-fg/90">{children}</dd>
    </div>
  );
}
