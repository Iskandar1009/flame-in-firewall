import { CABIN_AIR, STUDIES, TESTS } from "./data";
import { HABITATS } from "./habitats";

const count = (xs: (string | undefined)[]) => {
  const c = new Map<string, number>();
  for (const x of xs) if (x) c.set(x, (c.get(x) ?? 0) + 1);
  return [...c.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => `${k} (${v})`).join(", ");
};

/** Plain-text knowledge base handed to the model. Deterministic, so the prompt cache stays warm. */
export function knowledgeBase(): string {
  const real = TESTS.filter((t) => !t.matrix);
  const solids = real.filter((t) => t.phase === "solid");
  const facts = [
    `Per-test conditions parsed from PSI experimental tables: ${real.length} individual tests across ${new Set(real.map((t) => t.inv)).size} investigations.`,
    `Solid-material tests with a listed oxygen value: ${solids.length}; highest oxygen ${Math.max(...solids.map((t) => t.o2))}% by volume; tests at 30% O2 or more: ${solids.filter((t) => t.o2 >= 30).length}.`,
    `Tests at lunar or Martian gravity: 0 (PSI holds no partial-gravity combustion data; LUCI and FM2 are expected to add it).`,
    `Tests with ambient oxygen 30-34% and pressure 8.2-10.2 psi: ${real.filter((t) => !t.o2Kind && t.o2 >= 30 && t.o2 <= 34 && t.p != null && !t.pAssumed && t.p >= 0.54 && t.p <= 0.72).length}, all liquid droplets (FLEX), none solid.`,
    `Suppression-by-dilution tests (FLEX): CO2 ${real.filter((t) => t.diluent === "CO2").length}, helium ${real.filter((t) => t.diluent === "He").length}.`,
  ];
  const habitats = HABITATS.map((h) => `- ${h.name}: ${h.o2[0]}-${h.o2[1]}% O2, ${h.psi[0]}-${h.psi[1]} psi, ${h.gravityLabel}${h.assumed ? " (atmosphere assumed)" : ""}. ${h.note}`).join("\n");
  const studies = STUDIES.map((s) => {
    const a = s.ai;
    const mine = real.filter((t) => t.inv === s.id);
    const stats = mine.length
      ? `Parsed tests: ${mine.length}; O2 ${s.o2Range?.[0]}-${s.o2Range?.[1]}%${s.pRange ? `; pressure ${s.pRange[0]}-${s.pRange[1]} atm` : ""}; fuels: ${count(mine.map((t) => t.fuel))}${count(mine.map((t) => t.outcome)) ? `; outcomes: ${count(mine.map((t) => t.outcome))}` : ""}${count(mine.map((t) => t.diluent)) ? `; diluents: ${count(mine.map((t) => t.diluent))}` : ""}`
      : CABIN_AIR.has(s.id) ? "No oxygen column in its PSI table; ran in ISS/Cygnus cabin air (about 21% O2, 1 atm, inferred)." : "No per-test conditions table.";
    return `### ${s.id} — ${s.name}
Title: ${s.title}. ${s.projectType}${s.platform ? `, ${s.platform}` : ""}. Hardware: ${s.hardware || "not stated"}.
Summary: ${a.summary}
Pillars (0-3): prevention ${a.pillars.prevention}, detection ${a.pillars.detection}, suppression ${a.pillars.suppression}. Direct fire-safety relevance ${a.fireSafetyRelevance}/3: ${a.relevanceReason}
Fuel: ${a.fuelPhase}; ${a.fuels.join(", ")}. Geometry: ${a.geometry}
Conditions: oxygen ${a.conditions.oxygen}; pressure ${a.conditions.pressure}; flow ${a.conditions.flow}; gravity ${a.conditions.gravity}
Varied: ${a.variables.join("; ")}. Measured: ${a.measurements.join("; ")}
${a.findingsAreResults ? "Findings stated in record" : "Record states aims, not results"}: ${a.keyFindings.join(" ")}
Safety takeaway: ${a.safetyInsight}
Informs equipment: ${a.informsEquipment}. Modelling value ${a.modelingValue}/3: ${a.modelingNote}
Limitation: ${a.limitations}
Earth benefit: ${a.earthBenefit}
Table statistics: ${stats}`;
  }).join("\n\n");

  return `# COMPUTED FACTS (counted from PSI experimental tables)\n${facts.map((f) => "- " + f).join("\n")}\n\n# HABITAT ATMOSPHERES\n${habitats}\n\n# INVESTIGATIONS\n${studies}`;
}

export const CHAT_SYSTEM = `You are the fire-safety analyst inside "Flame in Freefall", a dashboard built on NASA's Physical Sciences Informatics (PSI) combustion data. Users are students, professors, aerospace researchers and engineers.

Answer only from the knowledge base below. It contains every PSI combustion investigation, AI-extracted attributes, and statistics counted from the official per-test tables.

How to answer:
- Lead with the direct answer in one or two sentences, then the supporting evidence.
- Cite the investigation for every factual claim using its ID in square brackets, for example [PSI-69]. Use only IDs that appear in the knowledge base.
- When the data does not cover the question (for example partial gravity, or solid materials above 22% oxygen), say so plainly, name the closest evidence, and explain what it can and cannot bound.
- Distinguish results stated in a record from aims a record describes. Do not present an aim as a finding.
- You may use general, well-established combustion physics to explain why something happens, but mark it as background rather than a PSI result, and never invent numbers.
- Keep it under 220 words unless asked for more. Short paragraphs or a few "- " bullets. Use **bold** sparingly for the key term. No tables, no headings.
- Rockets and propellants are out of scope for this data. This is research guidance, not flight certification; say so only when a user asks for a safety decision.`;
