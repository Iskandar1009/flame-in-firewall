"use client";

import { useMemo, useState } from "react";
import { BY_ID, TESTS } from "@/lib/data";
import { EXPLORATION_ZONE, REFERENCES } from "@/lib/habitats";
import type { TestPoint } from "@/lib/types";
import { Download } from "lucide-react";
import { download, testsToCsv } from "@/lib/csv";
import { PHASE_COLOR, Section, Seg } from "./ui";

const W = 880, H = 520, M = { l: 58, r: 20, t: 18, b: 46 };
const Y0 = 0.22, Y1 = 6.6;
// Piecewise oxygen axis: 10-45% (where nearly all tests and every habitat sit) gets 76% of the width.
const XB = 45, XF = 0.76, PW = W - M.l - M.r;
// Rounded so server and client render identical attribute strings (Math.log differs in the last bit).
const r1 = (v: number) => Math.round(v * 10) / 10;
const x = (o2: number) => r1(M.l + PW * (o2 <= XB ? ((o2 - 10) / (XB - 10)) * XF : XF + ((o2 - XB) / (102 - XB)) * (1 - XF)));
const y = (atm: number) => r1(M.t + (1 - (Math.log(atm) - Math.log(Y0)) / (Math.log(Y1) - Math.log(Y0))) * (H - M.t - M.b));

const PHASES = [
  { key: "solid", label: "Solid materials" },
  { key: "liquid droplet", label: "Liquid droplets" },
  { key: "gas", label: "Gas flames" },
  { key: "gas (emulated solid/liquid)", label: "Emulated solids (BRE)" },
];
const OUTCOME_COLOR: Record<string, string> = {
  Extinction: "#5fe0a8", "Self-extinguished": "#5fe0a8", Completion: "#ff5d5d", "Flow terminated": "#ff9a4a", Disruption: "#94a0b8",
};

// Deterministic jitter so repeated test conditions show as a cluster instead of one dot.
function jit(i: number, s: number) {
  const v = Math.sin(i * 12.9898 + s * 78.233) * 43758.5453;
  return (v - Math.floor(v) - 0.5) * 2;
}

export default function FlamMap({ onOpen }: { onOpen: (id: string) => void }) {
  const [mode, setMode] = useState<"phase" | "outcome">("phase");
  const [off, setOff] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<{ t: TestPoint; cx: number; cy: number } | null>(null);

  const pts = useMemo(
    () => TESTS.filter((t) => t.p != null).map((t, i) => ({
      t,
      // rounded so server and client render identical attribute strings
      cx: Math.round((x(t.o2) + jit(i, 1) * 5) * 10) / 10,
      cy: Math.round((y(t.p!) + jit(i, 2) * (t.pAssumed ? 9 : 4)) * 10) / 10,
    })),
    [],
  );
  const z = EXPLORATION_ZONE;
  const inZone = useMemo(() => {
    const a = TESTS.filter((t) => !t.o2Kind && !t.matrix && t.o2 >= z.o2[0] && t.o2 <= z.o2[1] && t.p != null && !t.pAssumed && t.p >= z.atm[0] && t.p <= z.atm[1]);
    const by = (ph: string) => a.filter((t) => t.phase === ph).length;
    return { n: a.length, solid: by("solid"), drop: by("liquid droplet"), gas: by("gas") };
  }, [z]);
  const solidMax = useMemo(() => Math.max(...TESTS.filter((t) => t.phase === "solid").map((t) => t.o2)), []);
  const nSolid = TESTS.filter((t) => t.phase === "solid").length;

  return (
    <Section
      id="map"
      eyebrow="02 · Flammability map"
      title={<>Where the experiments were run, and where the crew is going.</>}
      lead={<>Each dot is one test from an official PSI experimental table: {TESTS.filter((t) => !t.matrix).length.toLocaleString()} tests from {new Set(TESTS.filter((t) => !t.matrix).map((t) => t.inv)).size} investigations, placed by the oxygen and pressure they burned in. The outlined box is the atmosphere expected for the Moon base and rovers.</>}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="card relative p-3 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <Seg layoutId="map-mode" value={mode} onChange={setMode} options={[{ value: "phase", label: "By fuel type" }, { value: "outcome", label: "By outcome" }]} />
            <div className="flex flex-wrap gap-1.5">
              {PHASES.map((p) => {
                const on = !off.has(p.key);
                return (
                  <button key={p.key} onClick={() => { const n = new Set(off); if (on) n.add(p.key); else n.delete(p.key); setOff(n); }} className={`chip transition ${on ? "!text-fg" : "opacity-40"}`}>
                    <span className="h-2 w-2 rounded-full" style={{ background: PHASE_COLOR[p.key] }} />
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Scatter plot of test oxygen concentration against pressure" onMouseLeave={() => setHover(null)}>
            {[15, 20, 25, 30, 35, 40, 45, 60, 85, 100].map((v) => (
              <g key={v}>
                <line x1={x(v)} x2={x(v)} y1={M.t} y2={H - M.b} stroke="rgba(255,255,255,0.06)" />
                <text x={x(v)} y={H - M.b + 18} textAnchor="middle" fontSize="11" fill="#64708a" fontFamily="var(--font-geist-mono)">{v}</text>
              </g>
            ))}
            {[0.25, 0.5, 1, 2, 3, 5].map((v) => (
              <g key={v}>
                <line x1={M.l} x2={W - M.r} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.06)" />
                <text x={M.l - 10} y={y(v) + 4} textAnchor="end" fontSize="11" fill="#64708a" fontFamily="var(--font-geist-mono)">{v}</text>
              </g>
            ))}
            <text x={(M.l + W - M.r) / 2} y={H - 6} textAnchor="middle" fontSize="12" fill="#94a0b8">Oxygen concentration, % by volume (axis compressed above 45%)</text>
            <line x1={x(XB)} x2={x(XB)} y1={M.t} y2={H - M.b} stroke="rgba(255,255,255,0.22)" strokeDasharray="2 5" />
            <text transform={`translate(15 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" fontSize="12" fill="#94a0b8">Pressure, atm (log scale)</text>

            <g>
              <rect x={x(z.o2[0])} y={y(z.atm[1])} width={x(z.o2[1]) - x(z.o2[0])} height={y(z.atm[0]) - y(z.atm[1])} rx="5" fill="rgba(255,209,102,0.12)" stroke="#ffd166" strokeWidth="1.6" />
              <line x1={x(32)} x2={x(32)} y1={y(z.atm[0]) + 3} y2={y(0.36) - 14} stroke="#ffd166" strokeWidth="1" opacity="0.7" />
              <text x={x(32)} y={y(0.36)} textAnchor="middle" fontSize="12.5" fill="#ffd166" fontWeight="600">Moon base · rover</text>
              <text x={x(32)} y={y(0.36) + 15} textAnchor="middle" fontSize="10.5" fill="#ffd166" opacity="0.85">30–34% O₂ · 8.2–10.2 psi</text>
            </g>

            {pts.map(({ t, cx, cy }, i) => {
              if (off.has(t.phase)) return null;
              const c = mode === "phase" ? PHASE_COLOR[t.phase] : t.outcome ? OUTCOME_COLOR[t.outcome] : "rgba(255,255,255,0.13)";
              const hollow = !!t.o2Kind;
              return (
                <circle key={i} cx={cx} cy={cy} r={t.matrix ? 2.2 : 3} fill={hollow ? "none" : c} stroke={hollow ? c : "none"} strokeWidth="1" opacity={t.matrix ? 0.35 : hollow ? 0.55 : 0.72}
                  onMouseEnter={() => setHover({ t, cx, cy })} onClick={() => onOpen(t.inv)} className="cursor-pointer" />
              );
            })}

            {REFERENCES.map((r) => (
              <g key={r.id} transform={`translate(${x(r.o2)} ${y(r.atm)})`}>
                <circle r="9" fill="none" stroke="#fff" strokeWidth="1.2" opacity="0.9" />
                <circle r="2" fill="#fff" />
                <text x={r.id === "suit" ? -14 : 12} y={r.id === "suit" ? 4 : -14} textAnchor={r.id === "suit" ? "end" : "start"} fontSize="11.5" fill="#fff" fontWeight="600">{r.label}</text>
              </g>
            ))}
            {hover && <circle cx={hover.cx} cy={hover.cy} r="7" fill="none" stroke="#fff" strokeWidth="1.5" pointerEvents="none" />}
          </svg>
          {hover && (
            <div className="pointer-events-none absolute z-10 w-60 rounded-xl border border-line-2 bg-bg-2/95 p-3 text-xs shadow-2xl backdrop-blur"
              style={{ left: `min(calc(${(hover.cx / W) * 100}% + 18px), calc(100% - 250px))`, top: `calc(${(hover.cy / H) * 100}% + 40px)` }}>
              <div className="display text-sm font-medium text-white">{BY_ID.get(hover.t.inv)?.name} <span className="font-mono text-[10px] text-dim">{hover.t.inv}</span></div>
              <div className="mt-1 text-muted">{hover.t.fuel} · {hover.t.phase}</div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px] text-fg">
                <span>O₂ {hover.t.o2}%</span>
                <span>{hover.t.p != null ? `${hover.t.p} atm` : "p n/a"}{hover.t.pAssumed ? "*" : ""}</span>
                {hover.t.diluent && <span>diluent {hover.t.diluent}</span>}
                {hover.t.outcome && <span>{hover.t.outcome}</span>}
              </div>
              {hover.t.o2Kind && <div className="mt-1.5 text-[10px] text-dim">Inverse flame: oxygen value is the burner stream, not the surrounding gas.</div>}
              {hover.t.pAssumed && <div className="mt-1.5 text-[10px] text-dim">*Cabin pressure assumed 1 atm; not listed in the table.</div>}
              {hover.t.matrix && <div className="mt-1.5 text-[10px] text-dim">Planned test-matrix condition, not an individual run.</div>}
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
            <span className="text-xs text-muted">One unified table of every test shown, ready for modelling.</span>
            <button
              onClick={() => { const rows = TESTS.filter((t) => !off.has(t.phase)); download(`psi-combustion-tests-${rows.length}.csv`, testsToCsv(rows)); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line-2 px-3.5 py-1.5 text-xs text-fg transition hover:border-flame/60 hover:text-flame"
            >
              <Download size={13} /> Download {TESTS.filter((t) => !off.has(t.phase)).length.toLocaleString()} tests (CSV)
            </button>
          </div>
          <p className="mt-2 px-1 text-[11px] leading-relaxed text-dim">
            Filled dots: oxygen in the surrounding atmosphere. Hollow dots: inverse flames, where the value is the oxidizer stream. Faint dots: FLEX-2 planned matrix.
            {mode === "outcome" && " Green: flame went out on its own. Red: fuel burned to completion. Orange: flow was stopped. Grey: no outcome recorded."}
          </p>
        </div>

        <div className="space-y-4">
          <div className="card border-warn/30 p-5">
            <div className="eyebrow !text-warn">Inside the exploration box</div>
            <div className="display mt-2 text-5xl font-semibold text-white">{inZone.solid}</div>
            <div className="text-sm text-muted">solid-material tests</div>
            <p className="mt-4 text-sm leading-relaxed text-fg/90">
              {inZone.n} tests reach this atmosphere{inZone.gas ? `: ${inZone.drop} on liquid droplets and ${inZone.gas} on gas flames` : ", and every one burned a liquid droplet"}. Fabrics and plastics, which are what a cabin is made of, were tested no higher than <b className="text-white">{solidMax}% O₂</b> across {nSolid} solid tests.
            </p>
          </div>
          <div className="card p-5">
            <div className="eyebrow">Why it matters</div>
            <p className="mt-2 text-sm leading-relaxed text-fg/90">
              Raising oxygen from 21% to 30% or more is over a 40% increase. Flammability depends strongly on oxygen, so a material that passes at station conditions is not cleared for a Moon base.
            </p>
          </div>
          <div className="card p-5">
            <div className="eyebrow">Closest evidence</div>
            <ul className="mt-2 space-y-2 text-sm">
              {[["PSI-69", "droplets at 30–34% O₂, ~10.2 psi"], ["PSI-20", "emulated solids up to 40% O₂"], ["PSI-25", "real solids, low oxygen limits"]].map(([id, why]) => (
                <li key={id}>
                  <button onClick={() => onOpen(id)} className="text-left text-flame hover:underline">{BY_ID.get(id)?.name}</button>
                  <span className="text-muted"> · {why}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </Section>
  );
}
