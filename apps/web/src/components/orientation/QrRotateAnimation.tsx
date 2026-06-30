"use client"

import { useEffect, useMemo, useRef } from "react"

/**
 * QR « vivant » 3D — battement de cœur, onde lumineuse de scan, ombre qui respire.
 * Porté du prototype « Respiration ». Piloté par var(--accent), aucun asset externe.
 * Respecte prefers-reduced-motion (rendu statique).
 */

type Mod = { left: string; top: string; size: string }

function buildMatrix(): { structural: Mod[]; arrow: Mod[] } {
  const N = 21, c = (N - 1) / 2, cell = 100 / N
  const pos = (x: number, y: number, f: number): Mod => ({
    left: ((x + 0.5) * cell).toFixed(3) + "%",
    top: ((y + 0.5) * cell).toFixed(3) + "%",
    size: (cell * f).toFixed(3) + "%",
  })
  const rng = (seed: number) => () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const finderCell = (x: number, y: number): boolean | null => {
    const blk = (ax: number, ay: number): boolean | null => {
      const lx = x - ax, ly = y - ay
      if (lx < 0 || ly < 0 || lx > 6 || ly > 6) return null
      return (lx === 0 || lx === 6 || ly === 0 || ly === 6) || (lx >= 2 && lx <= 4 && ly >= 2 && ly <= 4)
    }
    const a = blk(0, 0), b = blk(N - 7, 0), d = blk(0, N - 7)
    return a !== null ? a : b !== null ? b : d
  }
  const midR = 5.7, ringHalf = 1.15, tipA = 2, baseA = 40
  const angOf = (x: number, y: number) => (Math.atan2(-(y - c), x - c) * 180) / Math.PI
  const isArrow = (x: number, y: number) => {
    const rr = Math.hypot(x - c, y - c), a = angOf(x, y)
    if (!(a > -75 && a < 10) && Math.abs(rr - midR) <= ringHalf) return true
    if (a >= tipA && a <= baseA) {
      const frac = Math.min(1, Math.max(0, (a - tipA) / (baseA - tipA)))
      if (Math.abs(rr - midR) <= 0.5 + 2.4 * frac) return true
    }
    return false
  }
  const structural: Mod[] = [], arrow: Mod[] = []
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    if (isArrow(x, y)) { arrow.push(pos(x, y, 0.9)); continue }
    const fc = finderCell(x, y)
    if (fc !== null) { if (fc) structural.push(pos(x, y, 0.84)); continue }
    if (Math.hypot(x - c, y - c) < 8.0) continue
    const sx = Math.min(x, N - 1 - x)
    if (rng(((sx + 1) * 131 + (y + 1) * 977) >>> 0)() < 0.42) structural.push(pos(x, y, 0.84))
  }
  return { structural, arrow }
}

export default function QrRotateAnimation({ size = "min(46vmin, 260px)" }: { size?: string }) {
  const { structural, arrow } = useMemo(buildMatrix, [])
  const rotator = useRef<HTMLDivElement>(null)
  const modWrap = useRef<HTMLDivElement>(null)
  const wave = useRef<HTMLDivElement>(null)
  const shadow = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0, t0: number | null = null
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
    const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2)
    const hash = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x) }
    const breath = (p: number) => (p < 0.3 ? easeOutCubic(p / 0.3) : p < 0.6 ? 1 - easeInOutQuad((p - 0.3) / 0.3) : 0)
    const loop = (now: number) => {
      if (t0 == null) t0 = now
      const t = now - t0, cyc = Math.floor(t / 1500), p = (t % 1500) / 1500
      const amp = 0.034 + hash(cyc + 9) * 0.012
      const b = breath(p)
      if (rotator.current) rotator.current.style.transform = `translateZ(${(26 * b).toFixed(2)}px) scale(${(1 + amp * b).toFixed(4)})`
      if (modWrap.current) modWrap.current.style.filter = `brightness(${(1 + 0.2 * b).toFixed(3)})`
      if (wave.current) { wave.current.style.transform = `translateX(${(-90 + 300 * p).toFixed(1)}%) skewX(-12deg)`; wave.current.style.opacity = (b * 0.9).toFixed(3) }
      if (shadow.current) { shadow.current.style.transform = `translateX(-50%) scale(${(1 + 0.22 * b).toFixed(3)})`; shadow.current.style.opacity = (0.55 - 0.22 * b).toFixed(3) }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div aria-hidden style={{ perspective: 1500, transformStyle: "preserve-3d", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "relative", transformStyle: "preserve-3d", transform: "rotateX(13deg) rotateY(-6deg)" }}>
        <div ref={rotator} style={{ position: "relative", width: size, aspectRatio: "1 / 1", transformStyle: "preserve-3d" }}>
          <div ref={modWrap} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
            {structural.map((m, i) => (
              <div key={"s" + i} style={{ position: "absolute", left: m.left, top: m.top, width: m.size, height: m.size, transform: "translate(-50%,-50%)", borderRadius: "24%", background: "linear-gradient(150deg, #e9ebf2, #b0b4c1)", opacity: 0.6, boxShadow: "0 1px 0 rgba(255,255,255,0.45) inset, 0 -1px 1px rgba(0,0,0,0.35) inset, 0 3px 4px rgba(0,0,0,0.55), 0 6px 11px rgba(0,0,0,0.4)" }} />
            ))}
            {arrow.map((m, i) => (
              <div key={"a" + i} style={{ position: "absolute", left: m.left, top: m.top, width: m.size, height: m.size, transform: "translate(-50%,-50%)", borderRadius: "24%", background: "linear-gradient(150deg, color-mix(in srgb, var(--accent), #ffffff 26%), color-mix(in srgb, var(--accent), #000000 24%))", boxShadow: "0 1px 0 rgba(255,255,255,0.4) inset, 0 0 10px color-mix(in srgb, var(--accent) 70%, transparent), 0 0 22px color-mix(in srgb, var(--accent) 42%, transparent), 0 3px 5px rgba(0,0,0,0.5)" }} />
            ))}
          </div>
          <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", transform: "translateZ(20px)" }}>
            <div ref={wave} style={{ position: "absolute", top: "-12%", left: 0, width: "42%", height: "124%", background: "linear-gradient(100deg, transparent 0%, color-mix(in srgb, var(--accent) 60%, transparent) 50%, transparent 100%)", mixBlendMode: "screen", filter: "blur(4px)", opacity: 0, transform: "translateX(-90%) skewX(-12deg)" }} />
          </div>
        </div>
        <div ref={shadow} style={{ position: "absolute", left: "50%", bottom: -34, width: "58%", height: 24, borderRadius: "50%", background: "radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, color-mix(in srgb, var(--accent) 18%, transparent) 45%, transparent 72%)", filter: "blur(9px)", transform: "translateX(-50%)", opacity: 0.55 }} />
      </div>
    </div>
  )
}
