"use client"
// Comparateur avant / après : l'image « après » se découvre en glissant.
// Vivait dans `[slug]/blocsPublics.tsx` (`BeforeAfterPublic`) ; l'aperçu de
// l'éditeur n'en avait pas — il montrait deux images côte à côte et prévenait
// « curseur glissant en ligne ». Une seule, ici (rendu unique, lot 4).
//
// Annoncé « curseur » sans être atteignable au clavier : il n'avait ni focus,
// ni bornes, ni flèches. Il les a — ←/→ par pas de 5 %, Début/Fin.
import { useRef, useState, type KeyboardEvent } from "react"
import SmartImage from "@/components/SmartImage"

const SIZES_PLEINE = "(max-width: 520px) 100vw, 520px"

export function CurseurAvantApres({ avant, apres, labelAvant, labelApres, hauteur = 260 }: { avant: string; apres: string; labelAvant: string; labelApres: string; hauteur?: number }) {
  const [pos, setPos] = useState(50)
  const cadre = useRef<HTMLDivElement>(null)
  const glisse = useRef(false)
  const borne = (v: number) => Math.min(100, Math.max(0, v))
  const suivre = (x: number) => { const b = cadre.current?.getBoundingClientRect(); if (b) setPos(borne(((x - b.left) / b.width) * 100)) }
  const auClavier = (e: KeyboardEvent<HTMLDivElement>) => {
    const cible = e.key === "ArrowLeft" ? pos - 5 : e.key === "ArrowRight" ? pos + 5 : e.key === "Home" ? 0 : e.key === "End" ? 100 : null
    if (cible === null) return
    e.preventDefault()
    setPos(borne(cible))
  }
  return (
    <div ref={cadre} role="slider" tabIndex={0} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)}
      aria-valuetext={`${Math.round(pos)} % de « ${labelApres} » découvert`} aria-label={`Comparateur ${labelAvant} / ${labelApres}`}
      onKeyDown={auClavier}
      onPointerDown={e => { glisse.current = true; e.currentTarget.setPointerCapture(e.pointerId); suivre(e.clientX) }}
      onPointerMove={e => { if (glisse.current) suivre(e.clientX) }}
      onPointerUp={() => { glisse.current = false }} onPointerCancel={() => { glisse.current = false }}
      style={{ position: "relative", height: hauteur, borderRadius: 12, overflow: "hidden", touchAction: "pan-y", userSelect: "none", cursor: "ew-resize" }}>
      <SmartImage width={1600} height={1200} sizes={SIZES_PLEINE} onError={e => { e.currentTarget.style.display = "none" }} src={avant} alt={labelAvant} draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <SmartImage width={1600} height={1200} sizes={SIZES_PLEINE} onError={e => { e.currentTarget.style.display = "none" }} src={apres} alt={labelApres} draggable={false} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
      <div aria-hidden style={{ position: "absolute", top: 0, bottom: 0, left: `${pos}%`, width: 2, background: "#fff", transform: "translateX(-1px)", boxShadow: "0 0 8px rgba(0,0,0,0.5)" }} />
      <div aria-hidden style={{ position: "absolute", top: "50%", left: `${pos}%`, transform: "translate(-50%,-50%)", width: 34, height: 34, borderRadius: "50%", background: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", color: "#080808", fontSize: 14, fontWeight: 700 }}>⇔</div>
      <span aria-hidden style={{ position: "absolute", bottom: 10, left: 10, background: "rgba(239,68,68,0.85)", color: "#fff", fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 9px" }}>{labelAvant}</span>
      <span aria-hidden style={{ position: "absolute", bottom: 10, right: 10, background: "rgba(57,255,143,0.85)", color: "#080808", fontSize: 11, fontWeight: 700, borderRadius: 6, padding: "3px 9px" }}>{labelApres}</span>
    </div>
  )
}
