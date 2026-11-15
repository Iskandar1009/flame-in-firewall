"use client";

import { useEffect, useState } from "react";

const LINKS = [
  ["advisor", "Mission advisor"],
  ["map", "Flammability map"],
  ["gaps", "Knowledge gaps"],
  ["explore", "Investigations"],
  ["ask", "Ask the data"],
  ["earth", "On Earth"],
];

export default function Nav() {
  const [active, setActive] = useState("");
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" },
    );
    LINKS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => { window.removeEventListener("scroll", onScroll); io.disconnect(); };
  }, []);
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${scrolled ? "border-b border-line bg-bg/75 backdrop-blur-xl" : ""}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 md:px-8">
        <a href="#top" className="display flex items-center gap-2.5 text-[15px] font-semibold text-white">
          <span className="relative grid h-7 w-7 place-items-center">
            <span className="absolute inset-0 rounded-full bg-flame/30 blur-md" />
            <span className="relative h-3.5 w-3.5 rounded-full bg-gradient-to-br from-white to-flame-2 shadow-[0_0_14px_var(--flame)]" />
          </span>
          Flame in Freefall
        </a>
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map(([id, label]) => (
            <a key={id} href={`#${id}`} className={`rounded-full px-3 py-1.5 text-sm transition-colors ${active === id ? "bg-panel-2 text-white" : "text-muted hover:text-white"}`}>
              {label}
            </a>
          ))}
        </nav>
        <a href="https://psi.nasa.gov/physci/repo/search?q=combustion" target="_blank" rel="noreferrer" className="rounded-full border border-line-2 px-3.5 py-1.5 text-xs text-muted transition hover:text-white">
          Data: NASA PSI ↗
        </a>
      </div>
    </header>
  );
}
