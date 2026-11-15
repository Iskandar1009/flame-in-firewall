import { WEIGHTS } from "@/lib/score";

export default function Method() {
  const steps = [
    ["1 · Collect", "All 26 records returned by the PSI search for “combustion” were downloaded through the repository's public interface, with the 28 experimental tables PSI publishes for them. Nothing was scraped from papers or added by hand."],
    ["2 · Parse", "Oxygen, pressure, fuel and outcome were read from each table by a script that is part of this project. Assumptions are marked where they appear: cabin pressure for solid tests, and oxidizer-stream oxygen for inverse flames."],
    ["3 · Interpret", "Claude read each record and its table statistics and returned a fixed set of fields: summary, fuels, conditions, sensors, findings, limitations and 0–3 scores. It was instructed to use only the record and to say when something is not stated."],
    ["4 · Rank", `Score = direct fire-safety relevance (${WEIGHTS.direct}) + chosen safety pillar (${WEIGHTS.focus}) + atmosphere match (${WEIGHTS.atmosphere}) + material realism (${WEIGHTS.material}). Atmosphere match is computed from how close an investigation's real tests come to the habitat's oxygen and pressure.`],
  ];
  return (
    <footer className="border-t border-line bg-black/30">
      <div className="mx-auto max-w-7xl px-5 py-16 md:px-8">
        <div className="eyebrow">How this was built</div>
        <h2 className="display mt-3 text-2xl font-semibold text-white md:text-3xl">Every number on this page can be traced.</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map(([t, d]) => (
            <div key={t}>
              <div className="display text-base font-medium text-white">{t}</div>
              <p className="mt-2 text-sm leading-relaxed text-muted">{d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-6 border-t border-line pt-8 text-sm leading-relaxed text-muted md:grid-cols-2">
          <p>
            <span className="text-fg">Limits.</span> Two records in the search results are not combustion science and score zero rather than being hidden. PSI records describe aims more often than results, so findings are labelled accordingly. Scores are a reading aid for researchers, not a safety certification.
          </p>
          <p>
            <span className="text-fg">Sources.</span>{" "}
            <a className="text-flame hover:underline" href="https://psi.nasa.gov/physci/repo/search?q=combustion" target="_blank" rel="noreferrer">NASA Physical Sciences Informatics</a> (data, CC0-1.0) ·{" "}
            <a className="text-flame hover:underline" href="https://www.spaceappschallenge.org/2026/challenges/flame-in-freefall/" target="_blank" rel="noreferrer">NASA Space Apps 2026 challenge statement</a> (habitat atmospheres) ·{" "}
            <a className="text-flame hover:underline" href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/" target="_blank" rel="noreferrer">NASA Glenn Combustion Science</a>. NASA does not endorse this project.
          </p>
        </div>
        <p className="mt-10 font-mono text-[11px] text-dim">Flame in Freefall · NASA Space Apps Challenge 2026 · Dushanbe</p>
      </div>
    </footer>
  );
}
