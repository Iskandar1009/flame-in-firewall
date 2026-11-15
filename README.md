# Flame in Freefall

**Fire-safety insights from NASA microgravity combustion data.**
NASA Space Apps Challenge 2026 · challenge: *Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data*

Live demo: https://flame-in-freefall-theta.vercel.app

## What it does

NASA's Physical Sciences Informatics (PSI) repository holds decades of combustion experiments run in
microgravity. The records are hard to find, compare and interpret. This dashboard summarizes, ranks and
interprets all of them for the fire safety of crewed habitats.

| Section | Question it answers |
|---|---|
| Mission advisor | For a given habitat (station, spacecraft, Moon base, rover, Mars base), which investigations matter most, and why? |
| Flammability map | At what oxygen and pressure was each test run, and how does that compare with where crews will live? |
| Knowledge gaps | What can the data not tell us yet? |
| Investigations | What did each experiment burn, vary and measure? Compare up to three side by side. |
| Ask the data | Free-form questions, answered only from the PSI records, with citations. |
| On Earth | How the same research protects people on the ground. |

### Main finding

Counted from the official per-test tables:

- 0 of 140 solid-material tests were run above 22.2% oxygen. The Moon base and rovers are expected to hold 30% or more.
- Only 17 tests fall inside the expected exploration atmosphere (30–34% O2, 8.2–10.2 psi), and all of them burned liquid droplets.
- 0 tests were run at lunar or Martian gravity.

## Data

All data comes from NASA PSI (https://psi.nasa.gov, CC0-1.0): the 26 records returned by the search for
"combustion" and the 28 experimental tables published with them. Habitat atmospheres come from the challenge
statement. Nothing was added by hand.

```
tools/fetch_psi.py     1. download the PSI records (public API)            -> data/raw/investigations/
data/raw/samples/      the official experimental tables (CSV), as downloaded
tools/build_data.py    2. parse records and tables                         -> web/src/data/{investigations,tests}.json
web/scripts/gen-insights.mjs   3. AI interpretation of each record         -> web/src/data/insights.json
web/scripts/gen-briefs.mjs     4. AI fire-safety brief per habitat         -> web/src/data/briefs.json
```

Assumptions are marked in the interface where they appear: cabin pressure of 1 atm for solid tests whose table
lists no pressure, and oxidizer-stream oxygen for inverse flames.

## How AI is used

Claude (`claude-opus-5-5`, Anthropic API) is used in three places:

1. **Interpretation.** For each PSI record, the model returns a fixed set of fields (summary, fuels, conditions,
   sensors, findings, limitations, 0–3 scores). It is instructed to use only the record and its table, and to
   label aims as aims when the record states no results.
2. **Habitat briefs.** One short brief per habitat, restricted to stated results and counted facts.
3. **Chat.** Answers come only from the dashboard's knowledge base and cite the PSI record for each claim.

The ranking itself is a transparent formula (`web/src/lib/score.ts`), not a model output:
direct relevance (30) + chosen safety pillar (25) + atmosphere match computed from real test conditions (25) +
material realism (20).

Parts of this project's code were written with AI assistance (Claude Code).

## Run locally

```bash
cd web
npm install
echo "ANTHROPIC_API_KEY=your-key" > .env.local   # only needed for the chat and for regenerating AI content
npm run dev
```

Everything except the live chat works without a key: summaries, briefs and rankings are generated in advance
and stored in `web/src/data/`.

To rebuild the data from scratch:

```bash
python3 tools/fetch_psi.py data/raw
python3 tools/build_data.py
cd web && node --env-file=.env.local scripts/gen-insights.mjs --all && node --env-file=.env.local scripts/gen-briefs.mjs
```

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion, Anthropic SDK. Deployed on Vercel.

## Limits

Scores and summaries are a reading aid for researchers and students, not a safety certification.
NASA does not endorse this project.
