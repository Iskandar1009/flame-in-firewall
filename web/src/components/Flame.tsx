"use client";

import { useEffect, useRef } from "react";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const BLUE = [70, 140, 255], CYAN = [150, 225, 255], YELLOW = [255, 214, 110], ORANGE = [255, 120, 40];

/**
 * Illustrative flame drawn on a 2D canvas. gravity 0 gives the dim blue sphere of a
 * microgravity diffusion flame; gravity 1 gives a buoyant, flickering teardrop.
 */
export default function Flame({ gravity, oxygen }: { gravity: number; oxygen: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const target = useRef({ g: gravity, o: oxygen });
  useEffect(() => {
    target.current = { g: gravity, o: oxygen };
  }, [gravity, oxygen]);

  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d")!;
    let raf = 0, g = target.current.g, o = target.current.o, last = performance.now(), t = 0;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const draw = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += reduce ? 0 : dt;
      g += (target.current.g - g) * Math.min(1, dt * 6);
      o += (target.current.o - o) * Math.min(1, dt * 6);

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = cv.clientWidth, h = cv.clientHeight;
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      const e = g * g * (3 - 2 * g); // eased gravity
      const R = Math.min(w, h) * (0.2 + 0.035 * o) * (1 - 0.3 * e);
      const cx = w / 2, baseY = h * lerp(0.5, 0.74, e);
      const height = R * lerp(0, 3.3, e);

      // soft outer glow
      const glowC = mix(BLUE, ORANGE, e);
      const gy = baseY - height * 0.45;
      const glow = ctx.createRadialGradient(cx, gy, 0, cx, gy, Math.min(w, h) * 0.49);
      glow.addColorStop(0, rgba(glowC, lerp(0.2, 0.26, e)));
      glow.addColorStop(1, rgba(glowC, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // body: a stack of blobs from base to tip. With no gravity they collapse into one sphere.
      const N = 26;
      for (let i = 0; i < N; i++) {
        const u = i / (N - 1);
        const flick = Math.sin(t * 7 + u * 9) * 0.5 + Math.sin(t * 11.3 + u * 5.1) * 0.35 + Math.sin(t * 3.1 + u * 2.2) * 0.3;
        const sway = flick * R * 0.16 * e * u;
        const breathe = 1 + Math.sin(t * 0.9) * 0.012 * (1 - e);
        const r = R * breathe * lerp(1, Math.pow(1 - u, 0.75) * 0.95 + 0.06, e);
        const x = cx + sway, y = baseY - u * height * (1 + flick * 0.035 * e);
        const hot = mix(mix(BLUE, YELLOW, Math.min(1, u * 3.2)), ORANGE, Math.max(0, u - 0.45) * 1.5);
        const col = mix(BLUE, hot, e);
        const a = lerp(0.03, 0.115, e) * (0.75 + 0.5 * o);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, rgba(col, a * lerp(0.5, 1.5, e)));
        grad.addColorStop(0.7, rgba(col, a));
        grad.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // microgravity: thin, bright reaction shell around a nearly dark core
      const shellA = (1 - e) * (0.55 + 0.35 * o);
      if (shellA > 0.01) {
        const rr = R * (1 + Math.sin(t * 0.9) * 0.012);
        const shell = ctx.createRadialGradient(cx, baseY, rr * 0.62, cx, baseY, rr * 1.12);
        shell.addColorStop(0, rgba(CYAN, 0));
        shell.addColorStop(0.62, rgba(CYAN, shellA * 0.75));
        shell.addColorStop(0.8, rgba(BLUE, shellA * 0.5));
        shell.addColorStop(1, rgba(BLUE, 0));
        ctx.fillStyle = shell;
        ctx.beginPath();
        ctx.arc(cx, baseY, rr * 1.12, 0, Math.PI * 2);
        ctx.fill();
        // fuel source at the centre
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - e)})`;
        ctx.beginPath();
        ctx.arc(cx, baseY, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className="h-full w-full" aria-hidden />;
}
