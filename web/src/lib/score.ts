import { CABIN_AIR, TESTS } from "./data";
import { PSI_PER_ATM } from "./habitats";
import type { Habitat, Pillar, Study } from "./types";

export type Focus = "all" | Pillar;

export interface Score {
  total: number;
  parts: { key: string; label: string; value: number; weight: number; detail: string }[];
  nearestO2: number | null;
  inferredAir: boolean;
  bonus: string | null;
}

export const WEIGHTS = { direct: 30, focus: 25, atmosphere: 25, material: 20 };

const dist = (x: number, [a, b]: [number, number]) => (x < a ? a - x : x > b ? x - b : 0);

const ambientByInv = new Map<string, { o2: number; p: number | null; pAssumed?: boolean }[]>();
for (const t of TESTS) {
  if (t.o2Kind) continue; // oxidizer-stream values of inverse flames are not an ambient atmosphere
  if (!ambientByInv.has(t.inv)) ambientByInv.set(t.inv, []);
  ambientByInv.get(t.inv)!.push(t);
}

export function scoreStudy(s: Study, h: Habitat, focus: Focus): Score {
  const ai = s.ai;
  const direct = ai.fireSafetyRelevance / 3;
  const pillarMax = Math.max(ai.pillars.prevention, ai.pillars.detection, ai.pillars.suppression);
  const focusV = (focus === "all" ? pillarMax : ai.pillars[focus]) / 3;
  const material = ai.materialRealism / 3;

  const atmRange: [number, number] = [h.psi[0] / PSI_PER_ATM, h.psi[1] / PSI_PER_ATM];
  let pts = ambientByInv.get(s.id) ?? [];
  const inferredAir = pts.length === 0 && CABIN_AIR.has(s.id);
  if (inferredAir) pts = [{ o2: 21, p: 1, pAssumed: true }];

  let atmosphere = 0;
  let nearestO2: number | null = null;
  let detail = "No per-test conditions published in PSI";
  if (pts.length) {
    let best = Infinity;
    for (const t of pts) {
      const d = dist(t.o2, h.o2);
      if (d < best) { best = d; nearestO2 = t.o2; }
    }
    const o2Match = Math.exp(-best / 6);
    const pBest = Math.min(...pts.map((t) => dist(t.p ?? 1, atmRange)));
    const pMatch = Math.exp(-pBest / 0.25);
    atmosphere = 0.7 * o2Match + 0.3 * pMatch;
    detail = best === 0
      ? `Tested inside this oxygen range (${nearestO2}% O2)${inferredAir ? ", cabin air inferred" : ""}`
      : `Closest test: ${nearestO2}% O2, ${best.toFixed(1)} points from this habitat${inferredAir ? " (cabin air inferred)" : ""}`;
  }

  const parts = [
    { key: "direct", label: "Direct fire-safety relevance", value: direct, weight: WEIGHTS.direct, detail: ai.relevanceReason },
    { key: "focus", label: focus === "all" ? "Strongest safety pillar" : `${focus[0].toUpperCase()}${focus.slice(1)} focus`, value: focusV, weight: WEIGHTS.focus,
      detail: `Prevention ${ai.pillars.prevention}/3 · Detection ${ai.pillars.detection}/3 · Suppression ${ai.pillars.suppression}/3` },
    { key: "atmosphere", label: "Atmosphere match", value: atmosphere, weight: WEIGHTS.atmosphere, detail },
    { key: "material", label: "Material realism", value: material, weight: WEIGHTS.material, detail: `${ai.fuelPhase} fuel · ${ai.fuels.slice(0, 3).join(", ") || "—"}` },
  ];
  let total = parts.reduce((a, p) => a + p.value * p.weight, 0);

  // The challenge statement notes that E-FIELD Flames mimicked partial gravity with an electric field.
  let bonus: string | null = null;
  if (h.surface && s.id === "PSI-22") {
    total = Math.min(100, total + 6);
    bonus = "+6: the only PSI investigation that mimics partial gravity (via an electric field)";
  }
  return { total: Math.round(total), parts, nearestO2, inferredAir, bonus };
}

export function rank(studies: Study[], h: Habitat, focus: Focus) {
  return studies
    .map((s) => ({ study: s, score: scoreStudy(s, h, focus) }))
    .sort((a, b) => b.score.total - a.score.total || a.study.num - b.study.num);
}
