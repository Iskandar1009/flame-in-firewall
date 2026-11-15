"use client";

import { AnimatePresence } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { BY_ID, STUDIES, TESTS, fmtBytes } from "@/lib/data";
import Advisor from "./Advisor";
import Ask from "./Ask";
import Detail from "./Detail";
import Earth from "./Earth";
import Explorer from "./Explorer";
import FlamMap from "./FlamMap";
import Gaps from "./Gaps";
import Hero from "./Hero";
import Nav from "./Nav";
import Method from "./Method";

export default function Dashboard() {
  const [open, setOpen] = useState<string | null>(null);
  const onOpen = useCallback((id: string) => setOpen(id), []);
  // Deep link: /?inv=PSI-69 opens that record.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("inv");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL after hydration
    if (id && BY_ID.has(id)) setOpen(id);
  }, []);
  const stats = [
    { label: "PSI investigations", value: String(STUDIES.length) },
    { label: "tests mapped", value: TESTS.filter((t) => !t.matrix).length.toLocaleString() },
    { label: "of raw NASA data", value: fmtBytes(STUDIES.reduce((a, s) => a + s.bytes, 0)) },
    { label: "publications linked", value: String(STUDIES.reduce((a, s) => a + s.nPubs, 0)) },
  ];
  return (
    <>
      <Nav />
      <main>
        <Hero stats={stats} />
        <Advisor onOpen={onOpen} />
        <FlamMap onOpen={onOpen} />
        <Gaps onOpen={onOpen} />
        <Explorer onOpen={onOpen} />
        <Ask onOpen={onOpen} />
        <Earth onOpen={onOpen} />
        <Method />
      </main>
      <AnimatePresence>{open && <Detail key={open} id={open} onClose={() => setOpen(null)} />}</AnimatePresence>
    </>
  );
}
