"use client";

import { motion } from "motion/react";
import { useMemo } from "react";
import { BY_ID, CABIN_AIR, STUDIES, TESTS } from "@/lib/data";
import { Section } from "./ui";

export default function Gaps({ onOpen }: { onOpen: (id: string) => void }) {
  const g = useMemo(() => {
    const real = TESTS.filter((t) => !t.matrix);
    const solids = real.filter((t) => t.phase === "solid");
    const dil = (d: string) => real.filter((t) => t.inv === "PSI-69" && t.diluent === d).length;
    const detect = STUDIES.filter((s) => s.ai.pillars.detection >= 2);
    return {
      n: real.length,
      solids: solids.length,
      solidMax: Math.max(...solids.map((t) => t.o2)),
      solidHigh: solids.filter((t) => t.o2 >= 30).length,
      solidLowP: solids.filter((t) => !t.pAssumed && t.p != null && t.p < 0.9).length,
      // Saffire-I and Saffire-III each list two SIBAL fabric sheets of about 0.94 m x 0.41 m in their PSI tables.
      large: 4,
      co2: dil("CO2"), he: dil("He"),
      detect: detect.length,
      detectAir: detect.filter((s) => CABIN_AIR.has(s.id)).length,
    };
  }, []);

  const cards = [
    {
      big: "0", unit: `of ${g.n.toLocaleString()} tests`, title: "at lunar or Martian gravity",
      body: "Every test in the PSI tables ran in microgravity or on the ground. Between those two lies the Moon (0.17 g) and Mars (0.38 g), where weak buoyancy returns and flames may behave like neither.",
      close: "The E-FIELD Flames experiment mimicked partial gravity with an electric field acting on flame ions.",
      next: "NASA expects partial-gravity data from the Lunar-g Combustion Investigation (LUCI) and Flammability of Materials on the Moon (FM2).",
      ids: ["PSI-22"], level: "Critical",
    },
    {
      big: String(g.solidHigh), unit: `of ${g.solids} solid tests`, title: "at 30% oxygen or more",
      body: `Fabrics and plastics were burned at ${g.solidMax}% oxygen or less. The Moon base and rovers are expected to hold 30% or more, where the same materials ignite more easily and burn faster.`,
      close: "BRE emulated burning solids with a gas burner at up to 40% oxygen; FLEX burned droplets at 30–34%.",
      next: "Repeat BASS-style and Saffire-style solid tests in the exploration atmosphere.",
      ids: ["PSI-20", "PSI-69", "PSI-25"], level: "Critical",
    },
    {
      big: String(g.solidLowP), unit: `of ${g.solids} solid tests`, title: "below cabin pressure",
      body: "No solid-fuel table lists a reduced pressure. Exploration habitats will run at 8.2–10.2 psi, about 56–69% of Earth sea level, which changes heat loss and flame spread.",
      close: "FLEX, CFI and the ACME gas flames span 0.4–3.3 atm, so pressure effects are known for liquids and gases.",
      next: "Add pressure as a variable to solid-material flammability tests.",
      ids: ["PSI-69", "PSI-159"], level: "High",
    },
    {
      big: String(g.large), unit: "burns", title: "at metre scale",
      body: "Saffire-I and Saffire-III each burned two fabric sheets about 0.94 m long in an uncrewed cargo vehicle. Every other sample in PSI is centimetres in size, so fire growth in a real cabin rests on four data points, all at about 21% oxygen.",
      close: "Saffire-II added nine 5 cm × 29 cm samples of real cabin materials, with Earth burn lengths for comparison.",
      next: "More large-scale burns across materials, oxygen levels and flow speeds.",
      ids: ["PSI-98", "PSI-99", "PSI-100"], level: "High",
    },
    {
      big: "0", unit: `of ${g.detect} smoke studies`, title: "in oxygen-enriched air",
      body: "Smoke particle size decides whether a detector alarms. The smoke tables list no oxygen or pressure: the flight tests ran in station cabin air. How smoke forms in oxygen-rich, low-pressure air is not in the published data.",
      close: "SAME and SAME-R characterised smoke from Teflon, Kapton, silicone rubber, cellulose and Pyrell.",
      next: "Smoke characterisation in the exploration atmosphere, to tune next-generation detectors.",
      ids: ["PSI-102", "PSI-101"], level: "Medium",
    },
    {
      big: `${g.co2 + g.he}`, unit: "dilution tests", title: "all on liquid droplets",
      body: `FLEX diluted the atmosphere with carbon dioxide (${g.co2} tests) and helium (${g.he} tests) to find where flames go out. The fuels were methanol and heptane droplets, not cabin materials.`,
      close: "FLEX maps extinction limits; BASS observed solid samples extinguishing as flow was reduced.",
      next: "Suppressant tests on burning solids, including water mist, in enriched oxygen.",
      ids: ["PSI-69", "PSI-26"], level: "Medium",
    },
  ];
  const tone: Record<string, string> = { Critical: "var(--hot)", High: "var(--ember)", Medium: "var(--warn)" };

  return (
    <Section
      id="gaps"
      eyebrow="03 · Knowledge gaps"
      title="What the data cannot tell us yet."
      lead="Counted directly from the PSI experimental tables, not estimated. Each gap lists the closest existing evidence and what would close it."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c, i) => (
          <motion.div key={c.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ delay: (i % 3) * 0.08, duration: 0.5 }} className="card flex flex-col p-6">
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest" style={{ color: tone[c.level] }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: tone[c.level] }} />{c.level} gap
            </div>
            <div className="mt-4 flex items-baseline gap-2">
              <span className="display text-5xl font-semibold text-white">{c.big}</span>
              <span className="text-sm text-muted">{c.unit}</span>
            </div>
            <div className="display mt-1 text-lg font-medium text-white">{c.title}</div>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">{c.body}</p>
            <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm leading-relaxed">
              <p><span className="text-ok">Closest evidence · </span><span className="text-fg/90">{c.close}</span></p>
              <p><span className="text-flame">To close it · </span><span className="text-fg/90">{c.next}</span></p>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {c.ids.map((id) => (
                <button key={id} onClick={() => onOpen(id)} className="chip transition hover:!border-flame/60 hover:!text-flame">{BY_ID.get(id)?.name}</button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}
