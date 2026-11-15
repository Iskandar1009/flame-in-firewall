# Submission form: text to paste

## Project Name
Flame in Freefall: Fire-Safety Insights for the Next Frontier

## Summary
Flame in Freefall is an AI-powered web dashboard that summarizes, ranks and interprets every combustion investigation in NASA's Physical Sciences Informatics (PSI) repository, so that students, researchers and engineers can get fire-safety answers for crewed habitats in minutes instead of weeks.

Choose a habitat (space station, spacecraft, Moon base, pressurized rover or Mars base) and the dashboard ranks all 26 investigations for it with a transparent score. A flammability map plots 1,193 real tests by oxygen and pressure against the atmosphere planned for the Moon. An AI assistant answers questions only from the PSI records and cites the investigation behind each claim. Parsed test data can be downloaded as one CSV table for predictive modelling.

The data itself produced our main finding: none of the 140 solid-material tests in PSI was run above 22.2% oxygen, while Moon bases and rovers are expected to hold 30% or more. No test was run at lunar or Martian gravity. The dashboard shows what is known, what is not, and what to test next.

## Project Demonstration (link)
https://github.com/Iskandar1009/flame-in-firewall/blob/main/demo/Flame-in-Freefall-demo.pdf

## Project (link)
https://flame-in-freefall-theta.vercel.app

## Project Details

**What it does**

Flame in Freefall turns NASA's microgravity combustion data into answers about fire safety in the places people will live next. It has six parts:

- **Mission advisor.** Pick a habitat and a safety focus (prevention, detection or suppression). All 26 PSI combustion investigations are ranked for it. Each score opens into its four parts, and an AI brief states what the data supports, what it cannot tell you yet, and what a designer can do now.
- **Flammability map.** Every test from the official PSI experimental tables is plotted by oxygen concentration and pressure, coloured by fuel type or by outcome, against the atmosphere expected for the Moon base and rovers (30–34% oxygen at 8.2–10.2 psi).
- **Knowledge gaps.** Six gaps counted directly from the tables, each with the closest existing evidence and what would close it.
- **Investigations.** One readable format for every record: fuels, sample shape, oxygen, pressure, flow, what varied, sensors, findings, limitations. Three views: overview, "for modellers" (which data can be extracted to predict flammability) and "for equipment" (which detectors, extinguishing agents and screening tests each investigation informs). Up to three investigations can be compared side by side.
- **Ask the data.** A chat that answers only from the PSI records, cites the investigation for each claim, and says so when the data does not cover the question.
- **On Earth.** How the same research protects people in submarines, aircraft, mines and buildings.

**How it works**

1. *Collect.* We downloaded the 26 records returned by the PSI search for "combustion" and the 28 experimental tables published with them, through the repository's public interface.
2. *Parse.* A Python script reads oxygen, pressure, fuel, diluent and outcome from each table into one table of 1,353 rows (1,193 individual tests plus the planned FLEX-2 matrix). Assumptions are marked where they appear.
3. *Interpret.* A large language model reads each record with its table statistics and returns a fixed set of fields. It is instructed to use only that record and to label aims as aims when the record states no results.
4. *Rank.* The score is a published formula, not a model output: direct fire-safety relevance (30) + chosen safety pillar (25) + atmosphere match computed from real test conditions (25) + material realism (20).

**What we found**

- 0 of 140 solid-material tests were run above 22.2% oxygen.
- Only 17 tests fall inside the expected Moon-base atmosphere, and all of them burned liquid droplets.
- 0 tests were run at lunar or Martian gravity.
- Only 7 of the 26 records state results; the rest describe aims. The dashboard labels this on every record.

**Benefits and intended impact**

Students and professors get a way into 14 TB of data in minutes. Researchers get one comparable format and a downloadable test table for modelling. Engineers see which evidence they can rely on for a 30% oxygen cabin and which tests are still missing. The gaps view can help prioritise future experiments such as LUCI and FM2.

**What makes it creative**

Instead of only summarising the records, we asked the data a question it could answer on its own: where were the experiments run, compared with where crews are going? Plotting every test on one map made the gap visible. We also treated honesty as a design feature: the assistant cites its sources, separates results from aims, and admits when the data does not cover a question.

**What we considered**

Accuracy over polish: every number is counted from NASA tables and every AI statement is labelled as such. Transparency: the ranking formula and the data pipeline are public in the repository. Scope: two records in the search results are not combustion science, so they score zero rather than being hidden. Rocket and propellant safety is outside the scope of the PSI data, as the challenge notes.

**Tools**

Next.js 16, React 19, TypeScript, Tailwind CSS 4, Motion (animation), Python (data parsing), Anthropic Claude API (interpretation and chat), Vercel (hosting). Code: https://github.com/Iskandar1009/flame-in-firewall

## Use of Super Intelligence (SI)
Select every option that mentions **code** and **text / data**. We did not generate images, video or audio with SI.

Where SI was used (already stated in the project footer, in the README and marked "AI interpretation" on the site):
- Code: the site and the data scripts were written with AI assistance (Claude Code).
- Text and data: per-investigation summaries, scores, habitat briefs and chat answers are generated by Claude (claude-opus-5-5) from NASA PSI records.
- The demo slides were prepared with AI assistance; the images in them are screenshots of the live project.

## NASA Data (Link Text → Link URL)
- PSI Data Repository: Combustion Science → https://psi.nasa.gov/physci/repo/search?q=combustion
- NASA Space Apps 2026 challenge statement: Flame in Freefall → https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/
- NASA Combustion Science (Glenn Research Center) → https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/
- NASA Spinoff: Fireman's Air Tanks → https://spinoff.nasa.gov/node/9582
- NASA Spinoff: Fire Detector → https://spinoff.nasa.gov/node/9407
- NASA Spinoff: New Technology for the Fire Attire → https://spinoff.nasa.gov/node/9918

## Space Agency Partner & Other Data (Link Text → Link URL)
- Anthropic Claude API (language model) → https://platform.claude.com
- Claude Code (AI coding assistant) → https://claude.com/claude-code
- Next.js → https://nextjs.org
- React → https://react.dev
- Tailwind CSS → https://tailwindcss.com
- Motion (animation library) → https://motion.dev
- Lucide (icons) → https://lucide.dev
- Geist font → https://vercel.com/font
- Space Grotesk font (Google Fonts) → https://fonts.google.com/specimen/Space+Grotesk
- Inter font (Google Fonts, used in slides) → https://fonts.google.com/specimen/Inter
- Vercel (hosting) → https://vercel.com
