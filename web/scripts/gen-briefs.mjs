// Generates src/data/briefs.json: one AI fire-safety brief per habitat, grounded in the
// per-investigation insights and statistics counted from the PSI tables.
// Run: node --env-file=.env.local scripts/gen-briefs.mjs
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import fs from "node:fs";
import path from "node:path";

const MODEL = "claude-opus-5-5";
const root = path.resolve(import.meta.dirname, "..");
const read = (f) => JSON.parse(fs.readFileSync(path.join(root, "src/data", f), "utf8"));
const invs = read("investigations.json"), insights = read("insights.json"), tests = read("tests.json").filter((t) => !t.matrix);

const HABITATS = [
  { id: "station", name: "Space station (ISS-class)", o2: [21, 21], psi: "14.7", g: "microgravity", note: "Earth-like air." },
  { id: "transit", name: "Deep-space spacecraft (crew capsule in transit)", o2: [21, 26.5], psi: "10.2-14.7", g: "microgravity", note: "Small volume, days from help; cabin pressure may be lowered and oxygen raised before spacewalks (assumed range)." },
  { id: "moonbase", name: "Moon base", o2: [30, 34], psi: "8.2-10.2", g: "0.17 g", note: "Oxygen 30% or more at 10.2 psi or less, per the challenge statement." },
  { id: "rover", name: "Pressurized rover", o2: [30, 34], psi: "8.2-10.2", g: "0.17 g", note: "Same atmosphere as the Moon base, very small sealed cabin, two crew, far from base." },
  { id: "mars", name: "Mars base", o2: [30, 34], psi: "8.2-10.2", g: "0.38 g", note: "Atmosphere not yet defined; assumed to match the lunar exploration atmosphere. Months from resupply." },
];

const Brief = z.object({
  bottomLine: z.string().describe("Two sentences: how well the PSI data covers fire safety for this habitat, and the single biggest caveat."),
  know: z.array(z.object({
    text: z.string().describe("One sentence the data supports, relevant to this habitat."),
    ids: z.array(z.string()).describe("PSI IDs that support it, 1-3, exactly as given."),
  })).describe("3 or 4 items."),
  dontKnow: z.array(z.string()).describe("2 or 3 items: what the data cannot tell a designer of this habitat, each one sentence with the number that shows it."),
  actions: z.array(z.string()).describe("2 or 3 concrete things a designer or researcher can do now with this data, each one sentence."),
});

const solids = tests.filter((t) => t.phase === "solid");
const catalogue = invs.map((i) => {
  const a = insights[i.id];
  return `${i.id} ${i.acronym || i.title} | relevance ${a.fireSafetyRelevance}/3 | prevention ${a.pillars.prevention} detection ${a.pillars.detection} suppression ${a.pillars.suppression} | ${a.fuelPhase}: ${a.fuels.slice(0, 4).join(", ")} | O2 tested: ${i.o2Range ? i.o2Range.join("-") + "%" : a.conditions.oxygen} | ${a.findingsAreResults ? "states results" : "states aims only"}
  ${a.oneLiner} Takeaway: ${a.safetyInsight} Limitation: ${a.limitations}`;
}).join("\n");

const client = new Anthropic();
const out = {};
for (const h of HABITATS) {
  const inRange = tests.filter((t) => !t.o2Kind && t.o2 >= h.o2[0] - 0.75 && t.o2 <= h.o2[1] + 0.75);
  const facts = `Tests in the PSI tables at this habitat's oxygen level: ${inRange.length} (solid materials: ${inRange.filter((t) => t.phase === "solid").length}; liquid droplets: ${inRange.filter((t) => t.phase === "liquid droplet").length}; gas: ${inRange.filter((t) => t.phase.startsWith("gas")).length}).
Highest oxygen in any solid-material test: ${Math.max(...solids.map((t) => t.o2))}% (${solids.length} solid tests in total).
Tests at this habitat's gravity (${h.g}): ${h.g === "microgravity" ? "all flight tests" : "0; PSI holds no partial-gravity combustion data"}.`;
  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: `You write short fire-safety briefs for a dashboard built on NASA PSI microgravity combustion data. Audience: aerospace engineers and students.
Use only the catalogue and counted facts in the user message. Do not add facts or numbers from memory. Cite only PSI IDs from the catalogue.
Every "know" item must restate a result stated in the catalogue or a counted fact. If an investigation is marked "states aims only", you may say what it tested, never what it found.
Be specific to the habitat: its oxygen, pressure, gravity and cabin size change what matters. Do not present an investigation's aims as results.
Plain, direct English; no hype; no first person. This is research guidance, not certification.`,
    messages: [{ role: "user", content: `HABITAT: ${h.name}\nAtmosphere: ${h.o2[0]}-${h.o2[1]}% O2 at ${h.psi} psi, ${h.g}. ${h.note}\n\nCOUNTED FACTS\n${facts}\n\nCATALOGUE OF PSI COMBUSTION INVESTIGATIONS\n${catalogue}\n\nWrite the brief for this habitat.` }],
    output_config: { format: zodOutputFormat(Brief) },
  });
  if (!res.parsed_output) throw new Error(`${h.id}: ${res.stop_reason}`);
  const ok = new Set(invs.map((i) => i.id));
  res.parsed_output.know.forEach((k) => (k.ids = k.ids.filter((id) => ok.has(id))));
  out[h.id] = { ...res.parsed_output, model: MODEL };
  fs.writeFileSync(path.join(root, "src/data/briefs.json"), JSON.stringify(out, null, 1));
  console.log("ok", h.id);
}
