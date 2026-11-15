import { BY_ID } from "./data";
import type { TestPoint } from "./types";

const COLS = ["psi_id", "investigation", "test", "fuel", "fuel_phase", "oxygen_percent", "oxygen_refers_to", "pressure_atm", "pressure_assumed", "diluent", "flow_cm_s", "outcome", "flame_type", "planned_matrix_point", "source"] as const;

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** One row per test, as parsed from the official PSI experimental tables. */
export function testsToCsv(tests: TestPoint[]): string {
  const rows = tests.map((t) => [
    t.inv, BY_ID.get(t.inv)?.name ?? "", t.test, t.fuel, t.phase, t.o2, t.o2Kind ?? "ambient", t.p ?? "", t.pAssumed ? "yes" : "no",
    t.diluent ?? "", t.flow ?? "", t.outcome ?? "", t.flame ?? "", t.matrix ? "yes" : "no", BY_ID.get(t.inv)?.url ?? "",
  ]);
  return [COLS.join(","), ...rows.map((r) => r.map(cell).join(","))].join("\n");
}

export function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
