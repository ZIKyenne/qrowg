"use client"

// L'éditeur à plat du mode « Studio libre » : le support de face, ses éléments
// libres déplaçables (souris, doigt, flèches du clavier), le QR repositionnable,
// et la barre de zoom. Sorti de PrintStudioClient (v384) : l'atelier lui passe
// les éléments et reçoit les changements.

import { useEffect, useRef, useState } from "react"
import { TYPOS, type Item } from "./catalog"
import { color as C } from "./tokens"
import type { Boite, FreeEl, ObstaclesDuSupport } from "./vocabulaireDuSupport"
import { SupportVisual, FreeElView } from "./renduDuSupport"

/* Barre de zoom de l'éditeur à plat : − / % / + / Ajuster. Discrète, ancrée au-dessus du support. */
export function ZoomBar({ zoom, setZoom }: { zoom: number; setZoom: (v: number | ((z: number) => number)) => void }) {
  const btn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, border: `1px solid ${C.hairline}`, background: C.surfaceUp, color: C.fg, cursor: "pointer", fontSize: 16, lineHeight: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 6 }}>
      <button onClick={() => setZoom(z => Math.max(0.5, +(z - 0.1).toFixed(2)))} title="Dézoomer" aria-label="Dézoomer" style={btn}>−</button>
      <span style={{ minWidth: 46, textAlign: "center", fontSize: 12, fontWeight: 700, color: C.fgMuted, fontFamily: "ui-monospace, monospace" }}>{Math.round(zoom * 100)} %</span>
      <button onClick={() => setZoom(z => Math.min(2, +(z + 0.1).toFixed(2)))} title="Zoomer" aria-label="Zoomer" style={btn}>+</button>
      <button onClick={() => setZoom(1)} title="Ajuster à l'écran" style={{ ...btn, width: "auto", padding: "0 12px", fontSize: 12, fontWeight: 700 }}>Ajuster</button>
    </div>
  )
}
/* Éditeur À PLAT (mode Studio libre) : le support de face, éléments libres déplaçables à la souris.
   Positions en fraction du support -> l'aperçu packshot et la planche PDF les rendent au même endroit. */
export function FlatEditor({ item, design, freeEls, setFreeEls, selEl, setSelEl, onQrMove, zoom = 1 }: { item: Item; design: any; freeEls: FreeEl[]; setFreeEls: React.Dispatch<React.SetStateAction<FreeEl[]>>; selEl: string | null; setSelEl: (v: string | null) => void; onQrMove: (x: number, y: number) => void; zoom?: number }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  // Police du corps = celle du thème/typo (pas Inter en dur) → WYSIWYG : même rendu à l'édition et à l'export.
  const efTypo = TYPOS.find(t => t.id === design.eTypo)
  const editorBodyFont: string = efTypo?.b ? `"${efTypo.b}",Helvetica,Arial,sans-serif` : (design.pal?.bodyFont || "Inter, system-ui, sans-serif")
  const [avail, setAvail] = useState(460)   // largeur dispo mesurée → l'éditeur TIENT à l'écran à 100 % (mobile inclus)
  useEffect(() => { const m = () => { const cw = wrapRef.current?.clientWidth; if (cw) setAvail(cw) }; m(); window.addEventListener("resize", m); return () => window.removeEventListener("resize", m) }, [])
  const ref = useRef<HTMLDivElement>(null)
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number; wpx: number; hpx: number } | null>(null)
  const rez = useRef<{ id: string; sx: number; sy: number; sw: number; sh: number; ss: number; kind: string } | null>(null)   // redimensionnement en cours
  const [editingId, setEditingId] = useState<string | null>(null)   // texte en édition INLINE (double-clic)
  const [guide, setGuide] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })
  const ratio = item.shape === "round" ? 1 : item.ratio
  const box = Math.round(Math.min(460, Math.max(180, avail)) * zoom)   // 100 % = ajusté à l'écran ; zoom>1 agrandit (défilement)
  const w = ratio >= 1 ? box : Math.round(box * ratio)
  const h = ratio >= 1 ? Math.round(box / ratio) : box
  const unit = Math.min(w, h)
  const wmm = item.shape === "round" ? item.hMm : item.hMm * item.ratio
  const qrFrac = Math.max(0.1, Math.min(0.9, (item.qrMm * (design.size?.factor || 1)) / wmm))  // taille du QR en fraction de largeur
  function startDrag(e: React.PointerEvent, id: string, ox: number, oy: number, wpx: number, hpx: number) {
    e.stopPropagation(); try { (e.target as HTMLElement).setPointerCapture(e.pointerId) } catch {}
    drag.current = { id, sx: e.clientX, sy: e.clientY, ox, oy, wpx, hpx }
  }
  function onDown(e: React.PointerEvent, el: FreeEl) {
    setSelEl(el.id)
    if (el.locked) { e.stopPropagation(); return }   // verrouillé : sélectionnable mais pas déplaçable
    const wpx = (el.kind === "text" || el.kind === "shape") ? el.w * w : unit * el.size
    const hpx = el.kind === "shape" ? (el.h2 ?? 0.12) * h : el.kind === "text" ? unit * el.size * 1.2 : unit * el.size
    startDrag(e, el.id, el.x, el.y, wpx, hpx)
  }
  function onMove(e: React.PointerEvent) {
    const r = ref.current?.getBoundingClientRect(); if (!r) return
    const cl = (v: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v))
    // Redimensionnement (poignée coin bas-droite) prioritaire sur le déplacement.
    const z = rez.current
    if (z) {
      const dx = (e.clientX - z.sx) / r.width, dy = (e.clientY - z.sy) / r.height
      const mfx = item.margin / wmm, mfy = item.margin / item.hMm   // marges de sécurité (fraction)
      setFreeEls(els => els.map(x => {
        if (x.id !== z.id) return x
        // Bornes de redimensionnement (P0 review) : jamais au-delà de la zone imprimable, ni assez gros pour tout recouvrir.
        if (z.kind === "shape") return { ...x, w: cl(z.sw + dx, 0.03, Math.max(0.06, 1 - mfx - x.x)), h2: cl(z.sh + dy, 0.01, Math.max(0.03, 1 - mfy - x.y)) }
        if (z.kind === "icon") { const m = Math.max(0.06, Math.min(0.4, 1 - mfx - x.x, 1 - mfy - x.y)); return { ...x, size: cl(z.ss + (dx + dy) / 2, 0.03, m) } }
        const dd = (dx + dy) / 2   // texte : police plafonnée + largeur bornée à la zone imprimable
        return { ...x, size: cl(z.ss + dd, 0.02, 0.2), w: cl(z.sw + dd * 2, 0.05, Math.max(0.1, 1 - mfx - x.x)) }
      }))
      return
    }
    const d = drag.current; if (!d) return
    const clamp = (v: number) => Math.max(0, Math.min(1, v))
    let nx = clamp(d.ox + (e.clientX - d.sx) / r.width)
    let ny = clamp(d.oy + (e.clientY - d.sy) / r.height)
    const TH = 7  // aimantation (px) : centre/marges du support + BORDS des autres éléments (avec écart mini) → guides dorés.
    const mX = (item.margin / wmm) * w, mY = (item.margin / item.hMm) * h
    const GAP = Math.max(6, Math.round(unit * 0.03))   // écart minimal entre éléments (snap aux bords + gap)
    // Cibles = position du bord GAUCHE/HAUT de l'élément déplacé → [cible, ligne-guide à afficher].
    const xt: [number, number][] = [[w / 2 - d.wpx / 2, w / 2], [mX, mX], [w - mX - d.wpx, w - mX]]
    const yt: [number, number][] = [[h / 2 - d.hpx / 2, h / 2], [mY, mY], [h - mY - d.hpx, h - mY]]
    for (const el of freeEls) {
      if (el.hidden || el.id === d.id) continue
      const ewp = (el.kind === "text" || el.kind === "shape") ? el.w * w : unit * el.size
      const ehp = el.kind === "shape" ? (el.h2 ?? 0.12) * h : el.kind === "text" ? unit * el.size * 1.2 : unit * el.size
      const nl = el.x * w, nr = nl + ewp, nt = el.y * h, nb = nt + ehp
      // centre · alignements de bord (gauche/droite, haut/bas) · placement avec écart (à côté / au-dessus / en-dessous)
      xt.push([nl + ewp / 2 - d.wpx / 2, nl + ewp / 2], [nl, nl], [nr - d.wpx, nr], [nr + GAP, nr + GAP], [nl - GAP - d.wpx, nl - GAP])
      yt.push([nt + ehp / 2 - d.hpx / 2, nt + ehp / 2], [nt, nt], [nb - d.hpx, nb], [nb + GAP, nb + GAP], [nt - GAP - d.hpx, nt - GAP])
    }
    let gx: number | null = null, gy: number | null = null
    const leftPx = nx * w, topPx = ny * h
    let bestX = TH; for (const [p, g] of xt) { const q = Math.abs(leftPx - p); if (q < bestX) { bestX = q; nx = clamp(p / w); gx = g } }
    let bestY = TH; for (const [p, g] of yt) { const q = Math.abs(topPx - p); if (q < bestY) { bestY = q; ny = clamp(p / h); gy = g } }
    // Bounding (P0 review) : l'élément reste dans la ZONE IMPRIMABLE (marges de sécurité) — plus de sortie de cadre.
    const loX = mX / w, hiX = Math.max(loX, (w - mX - d.wpx) / w)
    const loY = mY / h, hiY = Math.max(loY, (h - mY - d.hpx) / h)
    nx = Math.max(loX, Math.min(hiX, nx)); ny = Math.max(loY, Math.min(hiY, ny))
    if (d.id === "__qr__") onQrMove(nx, ny)
    else setFreeEls(els => els.map(x => (x.id === d.id ? { ...x, x: nx, y: ny } : x)))
    setGuide({ x: gx, y: gy })
  }
  // Anti-collision DOUCE (P0 review) : à la POSE, si l'élément recouvre un voisin, on le glisse juste EN-DESSOUS
  // (+ écart), borné à la zone imprimable. Déterministe, une seule fois (pas de tremblement pendant le drag).
  function resolveOverlap(id: string) {
    setFreeEls(els => {
      const me = els.find(e => e.id === id); if (!me || me.hidden) return els
      const box = (el: FreeEl) => {
        const ewp = (el.kind === "text" || el.kind === "shape") ? el.w * w : unit * el.size
        const ehp = el.kind === "shape" ? (el.h2 ?? 0.12) * h : el.kind === "text" ? unit * el.size * 1.2 : unit * el.size
        return { l: el.x * w, t: el.y * h, r: el.x * w + ewp, b: el.y * h + ehp, ehp }
      }
      const m = box(me)
      let maxBottom = -1
      for (const el of els) {
        if (el.id === id || el.hidden) continue
        const b = box(el)
        if (m.l < b.r && m.r > b.l && m.t < b.b && m.b > b.t) maxBottom = Math.max(maxBottom, b.b)
      }
      if (maxBottom < 0) return els
      const GAP = Math.max(6, Math.round(unit * 0.03)), my2 = (item.margin / item.hMm) * h
      const newTop = Math.min(Math.max(my2, maxBottom + GAP), Math.max(my2, h - my2 - m.ehp))
      return els.map(e => e.id === id ? { ...e, y: newTop / h } : e)
    })
  }
  const onUp = () => { const d = drag.current; if (d && d.id !== "__qr__") resolveOverlap(d.id); drag.current = null; rez.current = null; setGuide({ x: null, y: null }) }
  return (
    <div ref={wrapRef} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
    <div ref={ref} data-support-apercu="" onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} onPointerDown={() => setSelEl(null)}
      style={{ position: "relative", width: w, height: h, borderRadius: item.shape === "round" ? "50%" : 12, overflow: "hidden", touchAction: "none", boxShadow: "0 14px 44px rgba(0,0,0,.55)" }}>
      <SupportVisual {...design} item={item} freeEls={[]} physW={wmm} w={w} h={h} />
      {/* Zone de sécurité (marge d'impression) — repère discret : rien d'important au-delà. */}
      <div style={{ position: "absolute", left: (item.margin / wmm) * w, top: (item.margin / item.hMm) * h, right: (item.margin / wmm) * w, bottom: (item.margin / item.hMm) * h, border: `1px dashed ${C.goldA33}`, borderRadius: item.shape === "round" ? "50%" : 6, pointerEvents: "none", zIndex: 1 }} />
      {design.qrFree && <div onPointerDown={e => startDrag(e, "__qr__", design.qrFx ?? 0.32, design.qrFy ?? 0.55, qrFrac * w, qrFrac * w)}
        style={{ position: "absolute", left: `${(design.qrFx ?? 0.32) * 100}%`, top: `${(design.qrFy ?? 0.55) * 100}%`, width: qrFrac * w, height: qrFrac * w, cursor: "move", outline: `2px solid ${C.gold}`, outlineOffset: 2, zIndex: 7, touchAction: "none" }} title="Déplacer le QR" />}
      {freeEls.filter(el => !el.hidden).map(el => {
        // Édition INLINE : un textarea calé sur le texte (mêmes police/taille/couleur/largeur) — WYSIWYG.
        if (editingId === el.id && el.kind === "text") {
          return <textarea key={el.id} autoFocus value={el.text}
            onChange={e => setFreeEls(els => els.map(x => x.id === el.id ? { ...x, text: e.target.value } : x))}
            onBlur={() => setEditingId(null)}
            onKeyDown={e => { if (e.key === "Escape") e.currentTarget.blur() }}
            onPointerDown={e => e.stopPropagation()}
            rows={Math.max(1, el.text.split("\n").length)}
            style={{ position: "absolute", left: `${el.x * 100}%`, top: `${el.y * 100}%`, width: `${el.w * 100}%`, fontSize: unit * el.size, color: el.color, textAlign: el.align, fontFamily: el.font || editorBodyFont, fontWeight: el.weight, lineHeight: 1.15, background: "rgba(0,0,0,0.18)", border: `1px solid ${C.gold}`, outline: "none", resize: "none", overflow: "hidden", padding: 0, margin: 0, zIndex: 8, boxSizing: "border-box", transform: el.rot ? `rotate(${el.rot}deg)` : undefined, transformOrigin: "top left", opacity: el.opacity ?? 1 }} />
        }
        return <FreeElView key={el.id} el={el} unit={unit} bodyFont={editorBodyFont} editable selected={selEl === el.id} onDown={onDown} onEdit={() => { if (!el.locked) setEditingId(el.id) }} />
      })}
      {/* Poignée de redimensionnement (coin bas-droite de l'élément sélectionné). */}
      {(() => {
        const s = freeEls.find(e => e.id === selEl)
        if (!s || s.hidden || s.locked || editingId === s.id) return null
        const wpx = (s.kind === "text" || s.kind === "shape") ? s.w * w : unit * s.size
        const hpx = s.kind === "shape" ? (s.h2 ?? 0.12) * h : s.kind === "text" ? unit * s.size * 1.2 : unit * s.size
        return <div title="Redimensionner" onPointerDown={e => { e.stopPropagation(); try { (e.target as HTMLElement).setPointerCapture(e.pointerId) } catch {} rez.current = { id: s.id, sx: e.clientX, sy: e.clientY, sw: s.w, sh: s.h2 ?? 0.12, ss: s.size, kind: s.kind } }}
          style={{ position: "absolute", left: s.x * w + wpx - 7, top: s.y * h + hpx - 7, width: 14, height: 14, borderRadius: 4, background: C.gold, border: "2px solid var(--field)", cursor: "nwse-resize", zIndex: 9, touchAction: "none" }} />
      })()}
      {guide.x != null && <div style={{ position: "absolute", left: guide.x, top: 0, bottom: 0, width: 1, background: C.gold, opacity: 0.85, pointerEvents: "none", zIndex: 6 }} />}
      {guide.y != null && <div style={{ position: "absolute", top: guide.y, left: 0, right: 0, height: 1, background: C.gold, opacity: 0.85, pointerEvents: "none", zIndex: 6 }} />}
    </div>
    </div>
  )
}
/* Ce qui occupe le support affiché (éditeur à plat ou aperçu), en fractions du
   support : le QR à part — il ne doit jamais être couvert —, les éléments de
   l'utilisateur, et les textes de la mise en page. Mesuré à l'écran, donc juste quelle que
   soit la mise en page. Repères : data-support-apercu, data-qr-du-support,
   data-contenu-du-support, data-element-libre. */
export function obstaclesALEcran(): ObstaclesDuSupport {
  const sup = document.querySelector<HTMLElement>("[data-support-apercu]")
  const a = sup?.getBoundingClientRect()
  if (!sup || !a || !a.width || !a.height) return { qr: null, libres: [], contenu: [] }
  const boite = (n: Element): Boite => { const b = n.getBoundingClientRect(); return { x: (b.left - a.left) / a.width, y: (b.top - a.top) / a.height, w: b.width / a.width, h: b.height / a.height } }
  const qr = sup.querySelector("[data-qr-du-support]")
  return { qr: qr ? boite(qr) : null, libres: [...sup.querySelectorAll("[data-element-libre]")].map(boite), contenu: [...sup.querySelectorAll("[data-contenu-du-support]")].map(boite) }
}
