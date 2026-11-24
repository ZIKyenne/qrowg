"use client"
// Carrousel plein largeur : défilement automatique facultatif, flèches, points,
// glisser du doigt. Vivait dans `[slug]/blocsPublics.tsx` (`CarouselPublic`) ;
// l'aperçu de l'éditeur en dessinait une autre version — une bande de
// vignettes et des points immobiles. Une seule, ici (rendu unique, lot 4).
import { useEffect, useRef, useState, type PointerEvent } from "react"
import SmartImage from "@/components/SmartImage"
import { altGalerie } from "@/lib/texteAlternatif"
import { zoneDeTouche } from "@/lib/cibleTactile"
import type { Photo } from "../models/horairesGalerieReseaux"

const SIZES_PLEINE = "(max-width: 520px) 100vw, 520px"

export function Carrousel({ photos, titre, defilement, hauteur = 240 }: { photos: Photo[]; titre: string; defilement: boolean; hauteur?: number }) {
  const [idx, setIdx] = useState(0)
  const enPause = useRef(false)
  const glisse = useRef<{ x: number } | null>(null)
  const n = photos.length
  const aller = (k: number) => setIdx(((k % n) + n) % n)
  useEffect(() => {
    if (!defilement || n < 2) return
    const t = setInterval(() => { if (!enPause.current) setIdx(i => (i + 1) % n) }, 3500)
    return () => clearInterval(t)
  }, [defilement, n])
  const auPoser = (e: PointerEvent) => { glisse.current = { x: e.clientX }; enPause.current = true }
  const auLever = (e: PointerEvent) => {
    if (glisse.current) { const dx = e.clientX - glisse.current.x; if (dx > 40) aller(idx - 1); else if (dx < -40) aller(idx + 1) }
    glisse.current = null; enPause.current = false
  }
  const fleche = { position: "absolute", top: "50%", transform: "translateY(-50%)", ...zoneDeTouche(34), borderRadius: "50%", background: "rgba(0,0,0,0.45)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" } as const
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: 14, touchAction: "pan-y" }}
      onPointerDown={auPoser} onPointerUp={auLever} onMouseEnter={() => { enPause.current = true }} onMouseLeave={() => { enPause.current = false }}>
      <div style={{ display: "flex", transition: "transform .45s var(--mo-ease-standard)", transform: `translateX(-${idx * 100}%)` }}>
        {photos.map((p, i) => <SmartImage key={i} width={1600} height={1200} sizes={SIZES_PLEINE} eager={i === 0} onError={e => { e.currentTarget.style.display = "none" }} src={p.src} alt={altGalerie(p.legende, titre, i, n)} draggable={false} style={{ width: "100%", height: hauteur, flexShrink: 0, objectFit: "cover", display: "block", userSelect: "none" }} />)}
      </div>
      {n > 1 && <>
        <button type="button" onClick={() => aller(idx - 1)} aria-label="Précédente" style={{ ...fleche, left: 4 }}>‹</button>
        <button type="button" onClick={() => aller(idx + 1)} aria-label="Suivante" style={{ ...fleche, right: 4 }}>›</button>
        {/* Lot v142 : la pastille garde son dessin, c'est le bouton qui fait
            24 px. L'écart passe à 0 — deux zones sensibles ne doivent pas se
            chevaucher, et c'est la distance entre CENTRES qui compte. */}
        <div style={{ position: "absolute", bottom: 4, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 0 }}>
          {photos.map((_, i) => <button key={i} type="button" onClick={() => aller(i)} aria-label={`Photo ${i + 1}`} aria-current={i === idx ? "true" : undefined} style={zoneDeTouche()}>
            <span aria-hidden style={{ width: i === idx ? 18 : 7, height: 7, borderRadius: 4, background: i === idx ? "#fff" : "rgba(255,255,255,0.5)", transition: "width .2s, background .2s", display: "block" }} />
          </button>)}
        </div>
      </>}
    </div>
  )
}
