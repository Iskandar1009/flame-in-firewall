"use client";

import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { useState } from "react";
import { ArrowDown, Flame as FlameIcon } from "lucide-react";

const Flame = dynamic(() => import("./Flame"), { ssr: false });

const PRESETS = [
  { label: "Earth", g: 1, note: "Buoyancy lifts hot gas: a tall, flickering, yellow teardrop." },
  { label: "Mars", g: 0.38, note: "No combustion data at this gravity level exists in PSI yet." },
  { label: "Moon", g: 0.166, note: "No combustion data at this gravity level exists in PSI yet." },
  { label: "Orbit", g: 0, note: "No buoyancy: a dim blue sphere fed only by slow diffusion." },
];

export default function Hero({ stats }: { stats: { label: string; value: string }[] }) {
  const [g, setG] = useState(0);
  const nearest = PRESETS.reduce((a, b) => (Math.abs(b.g - g) < Math.abs(a.g - g) ? b : a));

  return (
    <section id="top" className="relative overflow-hidden">
      <div className="stars absolute inset-0 opacity-70" aria-hidden />
      <div className="relative mx-auto grid max-w-7xl items-center gap-6 px-5 pb-14 pt-28 md:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pb-20 lg:pt-36">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
          <div className="eyebrow mb-5 flex items-center gap-2">
            <FlameIcon size={14} /> NASA Space Apps 2026 · Flame in Freefall
          </div>
          <h1 className="display text-[2.6rem] font-semibold leading-[1.04] text-white sm:text-6xl lg:text-[4.2rem]">
            Fire behaves differently
            <br />
            <span className="bg-gradient-to-r from-flame via-white to-flame-2 bg-clip-text text-transparent">when nothing falls.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted">
            Decades of NASA microgravity combustion experiments, turned into clear fire-safety answers for the
            spacecraft, Moon base and Mars habitats of the next frontier. Summarized, ranked and interpreted by AI —
            every claim traceable to the PSI record it came from.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#advisor" className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-flame">
              Start with a mission
            </a>
            <a href="#map" className="rounded-full border border-line-2 px-5 py-2.5 text-sm font-medium text-fg transition hover:bg-panel-2">
              See the flammability map
            </a>
          </div>
          <dl className="mt-12 grid max-w-xl grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.08 }}>
                <dt className="text-xs text-dim">{s.label}</dt>
                <dd className="display mt-1 text-2xl font-semibold text-white">{s.value}</dd>
              </motion.div>
            ))}
          </dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.15 }}
          className="relative mx-auto w-full max-w-[520px]"
        >
          <div className="relative aspect-square">
            <Flame gravity={g} oxygen={0.5} />
          </div>
          <div className="card -mt-6 p-5">
            <div className="flex items-baseline justify-between">
              <span className="eyebrow">Gravity</span>
              <span className="font-mono text-sm text-white">{g.toFixed(2)} g</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={g}
              onChange={(e) => setG(parseFloat(e.target.value))}
              className="mt-4 w-full"
              aria-label="Gravity level"
            />
            <div className="mt-3 flex justify-between gap-1">
              {[...PRESETS].reverse().map((p) => (
                <button
                  key={p.label}
                  onClick={() => setG(p.g)}
                  className={`rounded-full px-3 py-1 text-xs transition ${nearest.label === p.label ? "bg-white text-black" : "text-muted hover:text-white"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="mt-3 min-h-10 text-sm leading-snug text-muted">{nearest.note}</p>
            <p className="mt-1 text-[11px] text-dim">Illustrative rendering, not a simulation.</p>
          </div>
        </motion.div>
      </div>
      <a href="#advisor" className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 text-dim lg:block" aria-label="Scroll down">
        <ArrowDown size={18} className="animate-bounce" />
      </a>
    </section>
  );
}
