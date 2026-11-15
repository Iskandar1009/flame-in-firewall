"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { ChevronDown, ArrowUpRight, TriangleAlert } from "lucide-react";
import { BY_ID, STUDIES, TESTS } from "@/lib/data";
import { HABITATS } from "@/lib/habitats";
import { rank, WEIGHTS, type Focus } from "@/lib/score";
import briefs from "@/data/briefs.json";
import { AiBadge, PHASE_COLOR, PillarChips, Section, Seg } from "./ui";

type Brief = { bottomLine: string; know: { text: string; ids: string[] }[]; dontKnow: string[]; actions: string[] };
const BRIEFS = briefs as unknown as Record<string, Brief>;

export default function Advisor({ onOpen }: { onOpen: (id: string) => void }) {
  const [hid, setHid] = useState("moonbase");
  const [focus, setFocus] = useState<Focus>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const h = HABITATS.find((x) => x.id === hid)!;
  const ranked = useMemo(() => rank(STUDIES, h, focus), [h, focus]);
  const cover = useMemo(() => {
    const amb = TESTS.filter((t) => !t.o2Kind && !t.matrix && t.o2 >= h.o2[0] - 0.75 && t.o2 <= h.o2[1] + 0.75);
    return { all: amb.length, solid: amb.filter((t) => t.phase === "solid").length };
  }, [h]);
  const brief = BRIEFS[hid];
  const list = showAll ? ranked : ranked.slice(0, 8);

  return (
    <Section
      id="advisor"
      eyebrow="01 · Mission advisor"
      title="Pick where the crew will live. See which experiments actually speak to it."
      lead="Every PSI combustion investigation is scored against the habitat's atmosphere and your safety focus. The score is a transparent formula, not a black box: open any row to see exactly why it ranks where it does."
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {HABITATS.map((x) => {
          const on = x.id === hid;
          return (
            <button key={x.id} onClick={() => { setHid(x.id); setExpanded(null); }} className={`card card-hover relative overflow-hidden p-4 text-left ${on ? "!border-flame/60 !bg-flame/[0.07]" : ""}`}>
              {on && <motion.span layoutId="hab-glow" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-flame to-transparent" />}
              <div className="display text-[15px] font-medium text-white">{x.name}</div>
              <div className="mt-3 flex items-end gap-1.5">
                <span className="display text-2xl font-semibold text-white">{x.o2[0] === x.o2[1] ? x.o2[0] : `${x.o2[0]}–${x.o2[1]}`}</span>
                <span className="pb-1 text-xs text-muted">% O₂</span>
              </div>
              <div className="mt-1 font-mono text-[11px] text-dim">
                {x.psi[0] === x.psi[1] ? x.psi[0] : `${x.psi[0]}–${x.psi[1]}`} psi · {x.gravityLabel}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
          <AnimatePresence mode="wait">
            <motion.div key={hid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} className="card p-6">
              <div className="flex items-center justify-between gap-3">
                <h3 className="display text-xl font-semibold text-white">{h.name}</h3>
                {h.assumed && <span className="chip !border-warn/40 !text-warn">atmosphere assumed</span>}
              </div>
              <p className="mt-1 text-sm text-muted">{h.crew}</p>
              <p className="mt-4 text-[15px] leading-relaxed text-fg/90">{h.note}</p>
              <p className="mt-2 text-xs text-dim">Source: {h.source}</p>
              <div className="mt-5 grid grid-cols-3 gap-3">
                <Stat value={cover.all.toLocaleString()} label="tests at this oxygen level" />
                <Stat value={String(cover.solid)} label="of them on solid materials" alert={cover.solid === 0} />
                <Stat value={h.gravity === 0 ? "all" : "0"} label={h.gravity === 0 ? "tests at this gravity" : `tests at ${h.gravityLabel}`} alert={h.gravity !== 0} />
              </div>
              {(cover.solid === 0 || h.gravity !== 0) && (
                <div className="mt-4 flex gap-2.5 rounded-xl border border-warn/25 bg-warn/[0.06] p-3 text-sm leading-snug text-warn">
                  <TriangleAlert size={16} className="mt-0.5 shrink-0" />
                  <span>
                    {cover.solid === 0 && "No solid-material test in the PSI tables was run at this oxygen level. "}
                    {h.gravity !== 0 && "PSI holds no partial-gravity combustion data yet; microgravity and Earth results can only bound what happens here."}
                  </span>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <Seg<Focus>
              layoutId="focus-seg"
              value={focus}
              onChange={setFocus}
              options={[{ value: "all", label: "All pillars" }, { value: "prevention", label: "Prevention" }, { value: "detection", label: "Detection" }, { value: "suppression", label: "Suppression" }]}
            />
            <span className="hidden font-mono text-[11px] text-dim xl:inline">
              relevance {WEIGHTS.direct} · pillar {WEIGHTS.focus} · atmosphere {WEIGHTS.atmosphere} · material {WEIGHTS.material}
            </span>
          </div>
          <ol className="space-y-2">
            <AnimatePresence initial={false}>
              {list.map(({ study: s, score }, i) => {
                const open = expanded === s.id;
                return (
                  <motion.li key={s.id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: "spring", stiffness: 380, damping: 36 }} className={`card overflow-hidden ${open ? "!border-line-2" : ""}`}>
                    <button onClick={() => setExpanded(open ? null : s.id)} className="flex w-full items-center gap-4 p-4 text-left">
                      <span className="w-6 shrink-0 font-mono text-xs text-dim">{String(i + 1).padStart(2, "0")}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="display font-medium text-white">{s.name}</span>
                          <span className="h-2 w-2 rounded-full" style={{ background: PHASE_COLOR[s.ai.fuelPhase] }} title={s.ai.fuelPhase} />
                          <PillarChips pillars={s.ai.pillars} />
                        </span>
                        <span className="mt-1 block truncate text-sm text-muted">{s.ai.oneLiner}</span>
                        <span className="mt-2.5 block h-1 overflow-hidden rounded-full bg-white/[0.07]">
                          <motion.span className="block h-full rounded-full bg-gradient-to-r from-flame-2 to-flame" initial={false} animate={{ width: `${score.total}%` }} transition={{ type: "spring", stiffness: 120, damping: 22 }} />
                        </span>
                      </span>
                      <span className="display w-10 shrink-0 text-right text-xl font-semibold text-white">{score.total}</span>
                      <ChevronDown size={16} className={`shrink-0 text-dim transition-transform ${open ? "rotate-180" : ""}`} />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: "easeOut" }} className="overflow-hidden">
                          <div className="border-t border-line px-4 pb-4 pt-3">
                            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                              {score.parts.map((p) => (
                                <div key={p.key}>
                                  <div className="flex justify-between text-xs">
                                    <span className="text-fg/90">{p.label}</span>
                                    <span className="font-mono text-dim">{Math.round(p.value * p.weight)}/{p.weight}</span>
                                  </div>
                                  <div className="mt-1.5 h-1 rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-white/70" style={{ width: `${p.value * 100}%` }} /></div>
                                  <p className="mt-1.5 text-xs leading-snug text-muted">{p.detail}</p>
                                </div>
                              ))}
                            </div>
                            {score.bonus && <p className="mt-3 text-xs text-ok">{score.bonus}</p>}
                            <p className="mt-3 text-sm leading-relaxed text-fg/90"><span className="text-dim">Takeaway · </span>{s.ai.safetyInsight}</p>
                            <button onClick={() => onOpen(s.id)} className="mt-3 inline-flex items-center gap-1 text-sm text-flame hover:underline">
                              Open full record <ArrowUpRight size={14} />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
          <button onClick={() => setShowAll(!showAll)} className="mt-4 w-full rounded-xl border border-line py-2.5 text-sm text-muted transition hover:border-line-2 hover:text-white">
            {showAll ? "Show top 8" : `Show all ${ranked.length} investigations`}
          </button>
        </div>
      </div>
      {brief && (
        <AnimatePresence mode="wait">
          <motion.div key={hid} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="card mt-6 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="display text-xl font-semibold text-white">Fire-safety brief · {h.name}</h3>
              <AiBadge />
            </div>
            <p className="mt-3 max-w-4xl text-[17px] leading-relaxed text-fg">{brief.bottomLine}</p>
            <div className="mt-2 grid gap-x-10 lg:grid-cols-3">
              <BriefList title="What the data supports" tone="ok">
                {brief.know.map((k, i) => (
                  <li key={i}>
                    {k.text}{" "}
                    {k.ids.map((id) => (
                      <button key={id} onClick={() => onOpen(id)} className="mx-0.5 rounded bg-white/[0.07] px-1.5 py-px font-mono text-[11px] text-flame hover:bg-flame/20">{BY_ID.get(id)?.name ?? id}</button>
                    ))}
                  </li>
                ))}
              </BriefList>
              <BriefList title="What it cannot tell you yet" tone="warn">{brief.dontKnow.map((k, i) => <li key={i}>{k}</li>)}</BriefList>
              <BriefList title="What a designer can do now" tone="flame">{brief.actions.map((k, i) => <li key={i}>{k}</li>)}</BriefList>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </Section>
  );
}

function Stat({ value, label, alert }: { value: string; label: string; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${alert ? "border-warn/30 bg-warn/[0.05]" : "border-line bg-white/[0.02]"}`}>
      <div className={`display text-2xl font-semibold ${alert ? "text-warn" : "text-white"}`}>{value}</div>
      <div className="mt-0.5 text-[11px] leading-tight text-muted">{label}</div>
    </div>
  );
}

function BriefList({ title, tone, children }: { title: string; tone: "ok" | "warn" | "flame"; children: React.ReactNode }) {
  const c = { ok: "var(--ok)", warn: "var(--warn)", flame: "var(--flame)" }[tone];
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider" style={{ color: c }}>
        <span className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />
        {title}
      </div>
      <ul className="mt-2 space-y-2 text-sm leading-relaxed text-fg/90 [&>li]:pl-3.5 [&>li]:relative [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[9px] [&>li]:before:h-1 [&>li]:before:w-1 [&>li]:before:rounded-full [&>li]:before:bg-white/30">{children}</ul>
    </div>
  );
}
