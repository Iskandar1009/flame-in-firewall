// Generates src/data/insights.json: one AI interpretation per PSI investigation.
// Every field is grounded in the official PSI record + its experimental table.
// Run: node --env-file=.env.local scripts/gen-insights.mjs [PSI-69 ...]
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import fs from "node:fs";
import path from "node:path";

const MODEL = "claude-opus-5-5";
const root = path.resolve(import.meta.dirname, "..");
const invs = JSON.parse(fs.readFileSync(path.join(root, "src/data/investigations.json"), "utf8"));
const tests = JSON.parse(fs.readFileSync(path.join(root, "src/data/tests.json"), "utf8"));
const tablesDir = path.resolve(root, "../data/raw/samples/experimental_tables");
const outPath = path.join(root, "src/data/insights.json");

const score = z.number().int().describe("0 = none, 1 = indirect, 2 = clear, 3 = direct and central");
const Insight = z.object({
  oneLiner: z.string().describe("What this investigation did, in at most 22 plain words. No acronym expansion needed."),
  summary: z.string().describe("60-90 words for an undergraduate engineer: what was burned, how, what varied, why it matters for fire safety."),
  pillars: z.object({ prevention: score, detection: score, suppression: score }).describe(
    "NASA's three fire-safety pillars. Prevention = material flammability limits and ignition; detection = smoke/aerosol sensing; suppression = extinguishment and extinguishing agents."),
  fireSafetyRelevance: score.describe("How strongly and directly this informs fire safety of crewed habitats (not rockets/propellants)."),
  relevanceReason: z.string().describe("One sentence justifying fireSafetyRelevance."),
  fuelPhase: z.enum(["solid", "liquid", "gas", "aerosol", "none"]),
  fuels: z.array(z.string()).describe("Fuels or sample materials, short names, max 8."),
  materialRealism: score.describe("3 = real spacecraft cabin materials at realistic scale; 2 = real materials at small scale; 1 = model fuels that emulate materials; 0 = fundamental fuels only or not combustion."),
  geometry: z.string().describe("Sample or burner shape and size, short."),
  conditions: z.object({
    oxygen: z.string(), pressure: z.string(), flow: z.string(), gravity: z.string(),
  }).describe("Test conditions as short phrases with numbers when the record gives them; write 'not stated in record' otherwise."),
  variables: z.array(z.string()).describe("What differed between tests of this investigation, max 6 short items."),
  measurements: z.array(z.string()).describe("Sensors, diagnostics or measured quantities, max 6 short items."),
  keyFindings: z.array(z.string()).describe("2-4 findings or, if the record states no results, what the data lets a researcher determine. Each one sentence."),
  findingsAreResults: z.boolean().describe("true only if keyFindings are results stated in the record; false if they describe intended outcomes."),
  safetyInsight: z.string().describe("The single most useful fire-safety takeaway for a habitat designer, one or two sentences."),
  informsEquipment: z.string().describe("Which next-generation fire-safety control or equipment this informs (e.g. smoke detectors, extinguishers, material screening tests), or 'None directly'."),
  modelingValue: score.describe("Value of the released data for predictive modelling of flammability / fire scenarios."),
  modelingNote: z.string().describe("Which quantities a modeller could extract, one sentence."),
  earthBenefit: z.string().describe("Application to fire safety on Earth if the record supports one, else 'Not stated in record'."),
  limitations: z.string().describe("Main limitation for exploration use (e.g. no partial gravity, oxygen below exploration atmosphere, small scale), one sentence."),
});

const SYSTEM = `You interpret NASA microgravity combustion investigations for a fire-safety dashboard built on the Physical Sciences Informatics (PSI) repository.
Audience: students, professors, aerospace researchers and engineers.

Context you can rely on:
- Without buoyancy, flames in microgravity depend on diffusion and forced air flow; flammability depends strongly on oxygen concentration.
- NASA fire safety has three pillars: prevention (ignition control, material selection, flammability limits), detection (smoke), suppression.
- Planned Moon base and pressurized rovers are expected to use about 30% or more oxygen at 10.2 psi or less, which makes materials more flammable than in Earth air (21% O2, 14.7 psi).
- PSI currently holds no partial-gravity (lunar or Martian) combustion data.
- Rocket and propellant fire safety is out of scope.

Rules:
- Use only the record and table statistics provided. Do not add facts, numbers or results from memory.
- If the record does not state something, say so rather than guessing.
- Plain, precise English. No hype. Write numbers with units.
- Never state an experimental outcome the record does not state. When the record gives aims but no results, set findingsAreResults to false, and write keyFindings and safetyInsight as what the data can be used to determine, not as a conclusion. Rows of the experimental table count as stated results.
- safetyInsight must follow from this record alone. Do not generalise beyond the fuels, oxygen levels and scale actually tested.
- Score honestly: fundamental flame studies are valuable science but only indirectly relevant to habitat fire safety; non-combustion records score 0.`;

function tableStats(inv) {
  const mine = tests.filter((t) => t.inv === inv.id);
  const count = (key) => {
    const c = {};
    for (const t of mine) if (t[key] != null) c[t[key]] = (c[t[key]] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, v]) => `${k} (${v})`).join(", ");
  };
  const out = [];
  if (mine.length) {
    out.push(`Parsed test points: ${mine.length}${mine.some((t) => t.matrix) ? " (expanded from a published test matrix, not individual tests)" : ""}`);
    out.push(`Oxygen range: ${inv.o2Range[0]}-${inv.o2Range[1]} % by volume${mine.some((t) => t.o2Kind) ? " (some values are the oxidizer stream of inverse flames, not the ambient)" : ""}`);
    if (inv.pRange) out.push(`Pressure range: ${inv.pRange[0]}-${inv.pRange[1]} atm`);
    out.push(`Fuels/materials: ${count("fuel")}`);
    if (count("outcome")) out.push(`Recorded outcomes: ${count("outcome")}`);
    if (count("diluent")) out.push(`Diluents: ${count("diluent")}`);
  }
  const dir = path.join(tablesDir, inv.id);
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir)) {
      const raw = fs.readFileSync(path.join(dir, f), "latin1").split(/\r?\n/).filter((l) => l.replace(/,/g, "").trim());
      out.push(`\nExperimental table "${f}" (${raw.length - 1} rows). Header and first rows:\n${raw.slice(0, 7).map((l) => l.slice(0, 600)).join("\n")}`);
    }
  }
  return out.join("\n") || "No experimental table in the record.";
}

function prompt(inv) {
  return `PSI record ${inv.id}
Title: ${inv.title}${inv.acronym ? ` (${inv.acronym})` : ""}
Research sub-area: ${inv.subArea || "not stated"} | Type: ${inv.projectType} | Platform: ${inv.platform || "not stated"}
Hardware: ${inv.hardware || "not stated"}
Dates: ${inv.start || "?"} to ${inv.end || "?"} | Publications listed: ${inv.nPubs} | Files: ${inv.nFiles} (${(inv.bytes / 1e9).toFixed(1)} GB)

OBJECTIVE
${inv.objective}

HYPOTHESIS
${inv.hypothesis || "(empty)"}

APPROACH
${inv.approach}

RESEARCH IMPACTS
${inv.impacts}

PUBLICATION TITLES
${inv.pubs.map((p) => "- " + p.title).join("\n") || "(none)"}

EXPERIMENTAL TABLE STATISTICS (computed from the official PSI table)
${tableStats(inv)}

Interpret this investigation for the dashboard.`;
}

const client = new Anthropic();
const only = process.argv.slice(2);
const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, "utf8")) : {};
const all = only.includes('--all');
const todo = invs.filter((i) => (all ? true : only.length ? only.includes(i.id) : !existing[i.id]));
let usage = { in: 0, out: 0 };

async function one(inv) {
  const res = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    system: SYSTEM,
    messages: [{ role: "user", content: prompt(inv) }],
    output_config: { format: zodOutputFormat(Insight) },
  });
  usage.in += res.usage.input_tokens;
  usage.out += res.usage.output_tokens;
  if (res.stop_reason !== "end_turn" || !res.parsed_output) throw new Error(`${inv.id}: stop_reason=${res.stop_reason}`);
  existing[inv.id] = { ...res.parsed_output, model: MODEL, generatedAt: new Date().toISOString().slice(0, 10) };
  fs.writeFileSync(outPath, JSON.stringify(existing, null, 1));
  console.log("ok", inv.id, inv.acronym);
}

const queue = [...todo];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const inv = queue.shift();
    try { await one(inv); } catch (e) {
      if (e instanceof Anthropic.RateLimitError) { queue.push(inv); await new Promise((r) => setTimeout(r, 15000)); }
      else console.error("FAIL", inv.id, e instanceof Anthropic.APIError ? `${e.status} ${e.message}` : e.message);
    }
  }
}));
console.log(`done ${Object.keys(existing).length}/${invs.length}; tokens in ${usage.in} out ${usage.out}`);
