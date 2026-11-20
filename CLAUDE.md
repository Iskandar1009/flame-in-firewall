# Flame in Freefall — project context

NASA Space Apps Challenge 2026, local event Dushanbe. Team: IY Team (Iskandar Ismoil, Yusuf Saifutdinov).
Challenge: "Flame in Freefall: SI-Powered Fire Safety Insights from Microgravity Combustion Data" (full statement in `CHALLENGE.md`).

Status: submitted on 2026-11-15, selected into the local top 25. Final pitch: 21 Nov 2026, 14:00, 2 minutes in English plus one question from the judges. On stage the team can only use its page on spaceappschallenge.org (links to the live site and the slides); no own laptop.

- Live site: https://flame-in-freefall-theta.vercel.app
- Demo slides (submitted): https://docs.google.com/presentation/d/16AQ1Ad7mKKl8WeuqjJR_B1mQZDpKY6_bTJOK8_ZMrrk/edit
- Repo: https://github.com/Iskandar1009/flame-in-firewall
- Text that was pasted into the submission form: `SUBMISSION.md`

## What the challenge asks

Build an AI-powered web dashboard that summarizes, ranks and interprets NASA's microgravity combustion investigations (PSI repository) for fire safety. Users should be able to:
1. find the investigations most relevant to a crewed habitat (spacecraft, station, Moon or Mars base, rover);
2. extract data that supports predictive modelling of flammability;
3. see which research informs next-generation fire-safety equipment.

## Why it matters (background for explaining the project)

- Without gravity there is no buoyancy, so hot gas does not rise. A flame becomes a dim blue sphere fed by slow diffusion. Earth experience does not transfer.
- NASA fire safety has three pillars: prevention (which materials ignite), detection (smoke), suppression (putting flames out).
- Moon bases and rovers are expected to use 30% or more oxygen at 10.2 psi or less (Earth: 21% at 14.7 psi), to shorten pre-breathing before spacewalks. More oxygen makes materials much more flammable.
- Key experiments: BASS / BASS-II and Saffire (solid materials), SAME / SAME-R (smoke), FLEX (droplet extinction with CO2 and helium), ACME (gas flames, including BRE, which emulates solids at up to 40% oxygen).

## What we built (sections of the site, top to bottom)

| Section | What it answers |
|---|---|
| First screen | Gravity slider morphs the flame from Earth teardrop to microgravity sphere; main finding in a yellow card |
| Mission advisor | Pick a habitat and a safety focus; all 26 investigations are ranked with a score breakdown; AI brief per habitat |
| Flammability map | Every parsed test plotted by oxygen and pressure, with the Moon-base atmosphere as a yellow box; CSV download |
| Knowledge gaps | Six gaps counted from the tables, closest evidence, what would close each |
| Investigations | Catalogue with search and filters; views "Overview / For modellers / For equipment"; compare up to three; detail drawer |
| Ask the data | Chat that answers only from the PSI records and cites investigations as [PSI-69] |
| On Earth, How this was built | Earth benefits; data pipeline and method |

## Main finding (all counted from official PSI test tables)

- 26 investigations returned by the PSI search for "combustion"; 28 experimental tables; about 14 TB of raw data behind them.
- 1,353 parsed rows = 1,193 individual tests + 160 planned FLEX-2 matrix conditions.
- 0 of 140 solid-material tests were run above 22.2% oxygen.
- 17 tests fall inside the Moon-base atmosphere (30–34% O2, 8.2–10.2 psi); all are liquid droplets (FLEX).
- 0 tests at lunar or Martian gravity (PSI holds no partial-gravity combustion data; LUCI and FM2 are expected to add it).
- Only 7 of 26 PSI records state results; the rest describe aims. The site labels this.
- Caveat to state honestly: this is what is published in PSI. NASA may hold data outside this repository (for example later Saffire flights).

## How AI is used

1. `web/scripts/gen-insights.mjs`: Claude (`claude-opus-5-5`) reads each PSI record plus its table statistics and returns fixed fields (summary, fuels, conditions, sensors, findings, limitations, 0–3 scores) → `web/src/data/insights.json`. It may use only the record and must label aims as aims.
2. `web/scripts/gen-briefs.mjs`: one brief per habitat → `web/src/data/briefs.json`.
3. `web/src/app/api/chat/route.ts`: live chat, knowledge base built in `web/src/lib/kb.ts`, answers must cite PSI IDs and admit when data is missing.

The ranking is NOT AI: `web/src/lib/score.ts`. Score = direct relevance (30) + chosen safety pillar (25) + atmosphere match computed from real test oxygen and pressure (25) + material realism (20).

## Data pipeline

```
tools/fetch_psi.py   download PSI records (public API psi.nasa.gov/geode-py/ws)   -> data/raw/investigations/ (not in git, ~70 MB)
data/raw/samples/    official experimental tables (CSV), as downloaded
tools/build_data.py  parse records and tables  -> web/src/data/investigations.json, tests.json
```

Assumptions marked in the UI: cabin pressure 1 atm for solid tests whose table lists no pressure; oxidizer-stream oxygen for inverse flames.

## Stack and operations

Next.js 16 (App Router, read `web/AGENTS.md` before changing code), React 19, TypeScript, Tailwind 4, Motion, Anthropic SDK. Hosted on Vercel (project `flame-in-freefall`, deployed with the Vercel CLI from `web/`).
The chat needs `ANTHROPIC_API_KEY` (in `web/.env.local` locally and in Vercel env). Everything else works without a key because AI content is generated in advance.

Do not delete or rename the Vercel project, the repository or the Google Slides file while judging is in progress (nominees December 2026, global winners January 2027).

## If you are helping a teammate prepare the pitch

The pitch script, the click path on stage and likely judge questions with answers are in `PITCH.md` (ask a teammate for it if it is not in the repository). Useful ways to help: explain any part of the project in plain words, quiz the speaker with judge-style questions in English, time the script, shorten it on request. Keep every number consistent with the "Main finding" section above.
