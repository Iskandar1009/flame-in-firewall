"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";
import type { Pillar } from "@/lib/types";

export const PILLAR_META: Record<Pillar, { label: string; color: string; blurb: string }> = {
  prevention: { label: "Prevention", color: "var(--flame)", blurb: "Which materials ignite and keep burning" },
  detection: { label: "Detection", color: "var(--warn)", blurb: "How smoke looks to a sensor" },
  suppression: { label: "Suppression", color: "var(--ok)", blurb: "What puts a flame out" },
};

export const PHASE_COLOR: Record<string, string> = {
  solid: "#ff9a4a",
  "liquid droplet": "#6cc4ff",
  liquid: "#6cc4ff",
  gas: "#a78bfa",
  "gas (emulated solid/liquid)": "#f472b6",
  aerosol: "#ffd166",
  none: "#64708a",
};

export function Section({ id, eyebrow, title, lead, children }: { id: string; eyebrow: string; title: ReactNode; lead?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="eyebrow">{eyebrow}</div>
        <h2 className="display mt-3 max-w-3xl text-3xl font-semibold leading-tight text-white md:text-[2.6rem]">{title}</h2>
        {lead && <p className="mt-4 max-w-2xl text-[17px] leading-relaxed text-muted">{lead}</p>}
      </motion.div>
      <div className="mt-10">{children}</div>
    </section>
  );
}

export function Dots({ value, color = "var(--flame)" }: { value: number; color?: string }) {
  return (
    <span className="inline-flex gap-[3px]" aria-label={`${value} of 3`}>
      {[0, 1, 2].map((i) => (
        <span key={i} className="h-1.5 w-1.5 rounded-full" style={{ background: i < value ? color : "rgba(255,255,255,0.14)" }} />
      ))}
    </span>
  );
}

export function PillarChips({ pillars }: { pillars: Record<Pillar, number> }) {
  return (
    <span className="flex flex-wrap gap-1.5">
      {(Object.keys(PILLAR_META) as Pillar[])
        .filter((p) => pillars[p] >= 2)
        .map((p) => (
          <span key={p} className="chip" style={{ borderColor: `color-mix(in srgb, ${PILLAR_META[p].color} 35%, transparent)`, color: PILLAR_META[p].color }}>
            {PILLAR_META[p].label}
          </span>
        ))}
    </span>
  );
}

export function AiBadge({ children = "AI interpretation" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-flame/30 bg-flame/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-flame">
      <span className="h-1.5 w-1.5 rounded-full bg-flame" />
      {children}
    </span>
  );
}

export function Seg<T extends string>({ value, onChange, options, layoutId }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; layoutId: string }) {
  return (
    <div className="inline-flex flex-wrap rounded-full border border-line bg-panel p-1">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={`relative rounded-full px-3.5 py-1.5 text-sm transition-colors ${value === o.value ? "text-black" : "text-muted hover:text-white"}`}>
          {value === o.value && <motion.span layoutId={layoutId} className="absolute inset-0 rounded-full bg-white" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
          <span className="relative">{o.label}</span>
        </button>
      ))}
    </div>
  );
}
