import investigations from "@/data/investigations.json";
import insights from "@/data/insights.json";
import tests from "@/data/tests.json";
import type { Insight, Investigation, Study, TestPoint } from "./types";

// Display names for ground investigations that have no acronym in PSI.
const SHORT_NAMES: Record<string, string> = {
  "PSI-60": "SPICE data analysis",
  "PSI-62": "Flame-spread modeling",
  "PSI-115": "SAME data modeling",
  "PSI-117": "Cool-flame perturbation",
  "PSI-142": "Cool-flame transitions",
  "PSI-181": "Solder microstructure",
};

// Two records match the PSI search term "combustion" but belong to other research areas.
// They stay in the catalogue (the ranking shows why they score low) instead of being hidden.
export const STUDIES: Study[] = (investigations as unknown as Investigation[])
  .filter((i) => (insights as unknown as Record<string, Insight>)[i.id])
  .map((i) => ({
    ...i,
    ai: (insights as unknown as Record<string, Insight>)[i.id],
    name: i.acronym || SHORT_NAMES[i.id] || shortTitle(i.title),
  }));

export const BY_ID = new Map(STUDIES.map((s) => [s.id, s]));

export const TESTS = tests as unknown as TestPoint[];

function shortTitle(t: string) {
  const w = t.split(" ");
  return w.length > 6 ? w.slice(0, 6).join(" ") + "…" : t;
}

// Investigations run in ISS / Cygnus cabin air whose PSI table has no oxygen column.
// Treated as 21% O2 at 1 atm and labelled "inferred" wherever shown.
export const CABIN_AIR = new Set(["PSI-26", "PSI-100", "PSI-101", "PSI-102", "PSI-106", "PSI-107", "PSI-47", "PSI-21", "PSI-22", "PSI-23"]);

export const fmtBytes = (b: number) =>
  b >= 1e12 ? `${(b / 1e12).toFixed(1)} TB` : b >= 1e9 ? `${(b / 1e9).toFixed(0)} GB` : b >= 1e6 ? `${(b / 1e6).toFixed(0)} MB` : `${Math.max(1, Math.round(b / 1e3))} KB`;
