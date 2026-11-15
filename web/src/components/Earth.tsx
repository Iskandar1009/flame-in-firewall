"use client";

import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { STUDIES } from "@/lib/data";
import { Section } from "./ui";

const SPINOFFS = [
  { t: "Fine water-mist extinguishers", d: "Developed for the ISS; the same approach puts out fires on Earth with far less water damage.", href: "https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/", src: "NASA Space Apps challenge statement" },
  { t: "Lighter firefighter air tanks", d: "1970s adaptation of spacesuit technology to firefighters' breathing gear.", href: "https://spinoff.nasa.gov/node/9582", src: "NASA Spinoff" },
  { t: "Smoke detectors that ignore dust", d: "A detector built for the shuttle tells smoke from dust, cutting nuisance alarms in mines and industry.", href: "https://spinoff.nasa.gov/node/9407", src: "NASA Spinoff" },
  { t: "Protective firefighter clothing", d: "1980s application of spacesuit materials to fire attire.", href: "https://spinoff.nasa.gov/node/9918", src: "NASA Spinoff" },
];

export default function Earth({ onOpen }: { onOpen: (id: string) => void }) {
  const stated = STUDIES.filter((s) => s.ai.fireSafetyRelevance >= 2 && !/not stated|no specific|none stated/i.test(s.ai.earthBenefit)).slice(0, 6);
  return (
    <Section id="earth" eyebrow="06 · On Earth" title="What burns in orbit protects people on the ground." lead="Sealed, crowded, hard to escape: submarines, aircraft, mines and tunnels share a spacecraft's fire problem. These are the links the NASA sources themselves draw.">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {SPINOFFS.map((s, i) => (
          <motion.a key={s.t} href={s.href} target="_blank" rel="noreferrer" initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="card card-hover group flex flex-col p-5">
            <div className="display text-base font-medium text-white">{s.t}</div>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{s.d}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs text-dim group-hover:text-flame">{s.src} <ArrowUpRight size={12} /></span>
          </motion.a>
        ))}
      </div>
      <div className="card mt-4 p-6">
        <div className="eyebrow">Earth benefits stated in the PSI records</div>
        <ul className="mt-4 grid gap-x-8 gap-y-3 md:grid-cols-2">
          {stated.map((s) => (
            <li key={s.id} className="text-sm leading-relaxed text-fg/90">
              <button onClick={() => onOpen(s.id)} className="mr-1.5 font-medium text-flame hover:underline">{s.name}</button>
              {s.ai.earthBenefit}
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
