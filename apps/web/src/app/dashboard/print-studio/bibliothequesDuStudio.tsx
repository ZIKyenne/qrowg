"use client"

// Les bibliothèques de l'atelier d'impression : vignettes de modèles « 1 clic »,
// bibliothèque de templates (recherche, catégories, aperçu au survol) et
// bibliothèque d'éléments « + Ajouter » (textes, formes, icônes). Sorties de
// PrintStudioClient (v384) : elles reçoivent ce qu'elles montrent et rendent
// ce qu'on choisit, sans lire l'état de l'atelier.

import { useState } from "react"
import { STYLE_BY_ID, type Item } from "./catalog"
import { paletteFromStyle } from "./mockup"
import { filterTemplates, type PrintTemplate, type TemplateVariant } from "./templates"
import { color as C } from "./tokens"
import { correspond, correspondAuxChamps } from "@/lib/rechercheSouple"
import { zoneDeTouche } from "@/lib/cibleTactile"
import { inputStyle, secLabel, chipStyle } from "./champsDuStudio"
import { ACCENTS, readableOn, ICON_LIB, ICON_CATS, SHAPES, COMPOSITIONS, type Preset } from "./vocabulaireDuSupport"
import { FauxQR } from "./renduDuSupport"

/* Vignette de modèle « 1 clic » : aperçu représentatif LÉGER (palette + casse/alignement + accent + faux QR).
   Pas un rendu lourd du support complet — juste assez pour VOIR la personnalité du modèle d'un coup d'œil. */
export function PresetThumb({ preset, item, on, onClick }: { preset: Preset; item: Item; on: boolean; onClick: () => void }) {
  const s = STYLE_BY_ID[preset.style] || STYLE_BY_ID.premiumdark
  const pal = paletteFromStyle(s)
  const accHex = ACCENTS.find(a => a.id === preset.accent)?.hex || pal.band
  const align = preset.eAlign === "left" ? "flex-start" : preset.eAlign === "right" ? "flex-end" : "center"
  const titleTxt = preset.titleCase === "upper" ? "TITRE" : "Titre"
  return (
    <button onClick={onClick} title={preset.label} style={{ borderRadius: 12, overflow: "hidden", border: `2px solid ${on ? C.gold : "transparent"}`, background: "none", padding: 0, cursor: "pointer" }}>
      <div style={{ height: 72, background: pal.bg, display: "flex", flexDirection: "column", alignItems: align, justifyContent: "center", gap: 5, padding: 8 }}>
        <span style={{ fontFamily: pal.titleFont, fontSize: 11, fontWeight: 700, color: pal.fg, lineHeight: 1, letterSpacing: pal.titleLs }}>{titleTxt}</span>
        <FauxQR size={22} fg={pal.ink} bg={pal.qrBg} />
        <span style={{ width: 26, height: 6, borderRadius: preset.eCorner === "rond" ? 999 : 2, background: accHex }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color: on ? C.gold : C.fgMuted, padding: "4px 6px", background: C.surface, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>{preset.label}</div>
    </button>
  )
}
/* Vignette de TEMPLATE : aperçu représentatif léger (palette + titre réel + casse/alignement + accent + faux QR).
   Reflète le contenu du modèle, pas juste un look — l'utilisateur reconnaît le point de départ. */
export function TemplateThumb({ t, onClick, item, grand }: { t: PrintTemplate; onClick: () => void; item?: Item; grand?: boolean }) {
  const L = t.look
  const s = STYLE_BY_ID[L.style] || STYLE_BY_ID.premiumdark
  const pal = paletteFromStyle(s)
  const accHex = ACCENTS.find(a => a.id === L.accent)?.hex || pal.band
  const align = L.eAlign === "left" ? "flex-start" : L.eAlign === "right" ? "flex-end" : "center"
  const raw = t.content.title || "Titre"
  const titleTxt = L.titleCase === "upper" ? raw.toUpperCase() : raw
  // La vignette prend la FORME et le RATIO du support choisi : un modèle vu dans
  // un rectangle puis appliqué sur un sticker rond ne ressemblait à rien de ce
  // qui avait été montré. On voit maintenant ce qu'on choisit.
  const rond = item?.shape === "round"
  const ratio = item ? Math.max(0.5, Math.min(2.2, item.ratio)) : 1
  // `grand` : l'écran « Choisissez un modèle » — c'est tout ce qu'on y regarde,
  // la vignette doit se lire (titre sur deux lignes, QR et bouton à l'échelle).
  const k = grand ? 1.9 : 1
  const haut = Math.round(78 * k)
  const larg = rond ? haut : Math.round(Math.max(46 * k, Math.min(104 * k, haut * ratio)))
  return (
    <button onClick={onClick} title={t.name} className="ps-tpl" style={{ borderRadius: 12, overflow: "hidden", border: "2px solid transparent", background: "none", padding: 0, cursor: "pointer", width: grand ? "100%" : undefined }}>
      <div style={{ height: haut, display: "flex", alignItems: "center", justifyContent: "center", padding: grand ? "8px 0" : 0, boxSizing: "content-box" }}>
      <div style={{ width: larg, height: haut, borderRadius: rond ? "50%" : 6 * k, overflow: "hidden", background: pal.bg, display: "flex", flexDirection: "column", alignItems: align, justifyContent: "center", gap: 5 * k, padding: grand ? (rond ? 18 : 9) : (rond ? 12 : 8), boxShadow: grand ? "0 8px 24px rgba(0,0,0,.45)" : undefined }}>
        <span style={{ fontFamily: pal.titleFont, fontSize: grand ? 13.5 : 10.5, fontWeight: 700, color: pal.fg, lineHeight: 1.05, letterSpacing: pal.titleLs, maxWidth: "100%", overflow: "hidden", textAlign: align === "center" ? "center" : undefined,
          ...(grand ? { display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as any, overflowWrap: "anywhere" as const } : { textOverflow: "ellipsis", whiteSpace: "nowrap" }) }}>{titleTxt}</span>
        <FauxQR size={Math.round(22 * k)} fg={pal.ink} bg={pal.qrBg} />
        <span style={{ width: 24 * k, height: 6 * k, borderRadius: L.eCorner === "rond" ? 999 : 2, background: accHex }} />
      </div>
      </div>
      <div style={{ fontSize: grand ? 12.5 : 10.5, fontWeight: 700, color: grand ? C.fg : C.fgMuted, padding: grand ? "8px 6px" : "4px 6px", background: C.surface, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textAlign: "center" }}>{t.name}</div>
    </button>
  )
}
/* Bibliothèque de TEMPLATES (§3-4/19-20) : recherche + catégories + « Recommandés » + grille.
   Réutilisée desktop (volet Modèles) et mobile (onglet Thème). Ne montre jamais un mur brut. */
export const TPL_CATS: { id: string; label: string; m?: (t: PrintTemplate) => boolean }[] = [
  { id: "pour-vous", label: "Pour vous" },
  { id: "resto", label: "Restaurant", m: t => t.business.includes("Restaurant") || t.business.includes("Café") || t.business.includes("Boulangerie") },
  { id: "bar", label: "Bar", m: t => t.business.includes("Bar") || t.business.includes("Caviste") },
  { id: "commerce", label: "Commerce", m: t => t.business.some(b => ["Boutique", "Food truck", "Boucherie", "Traiteur"].includes(b)) },
  { id: "avis", label: "Avis", m: t => t.objective.includes("Avis") },
  { id: "wifi", label: "wifi", m: t => t.objective.includes("wifi") },
  { id: "event", label: "Événement", m: t => t.business.includes("Événement") },
  { id: "reseaux", label: "Réseaux", m: t => t.objective.includes("Réseaux") },
  { id: "business", label: "Business", m: t => t.business.some(b => ["Freelance", "Artisan", "Immobilier", "Coach", "Photographe"].includes(b)) || t.objective.includes("Contact") },
]
// Aperçu RICHE au survol (#4) — rendu représentatif agrandi + méta (objectif). Desktop `hover:fine` uniquement,
// en position fixed (échappe à l'overflow du volet), non interactif (pointer-events none).
export function TemplateHoverCard({ t }: { t: PrintTemplate }) {
  const L = t.look
  const s = STYLE_BY_ID[L.style] || STYLE_BY_ID.premiumdark
  const pal = paletteFromStyle(s)
  const accHex = ACCENTS.find(a => a.id === L.accent)?.hex || pal.band
  const align = L.eAlign === "left" ? "flex-start" : L.eAlign === "right" ? "flex-end" : "center"
  const raw = t.content.title || "Titre"
  const titleTxt = L.titleCase === "upper" ? raw.toUpperCase() : raw
  return (
    <div style={{ width: 210, borderRadius: 14, overflow: "hidden", border: `1px solid ${C.hairline}`, background: C.surface, boxShadow: "0 18px 50px rgba(0,0,0,.6)" }}>
      <div style={{ height: 184, background: pal.bg, display: "flex", flexDirection: "column", alignItems: align, justifyContent: "center", gap: 9, padding: 18, textAlign: align === "center" ? "center" : align === "flex-end" ? "right" : "left" }}>
        <span style={{ fontFamily: pal.bodyFont, fontSize: 8.5, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: accHex }}>{t.business[0] || "QRowg"}</span>
        <span style={{ fontFamily: pal.titleFont, fontSize: 17, fontWeight: 700, color: pal.fg, lineHeight: 1.05, letterSpacing: pal.titleLs, maxWidth: "100%", overflowWrap: "anywhere" }}>{titleTxt}</span>
        {t.content.subtitle && <span style={{ fontFamily: pal.bodyFont, fontSize: 9.5, fontWeight: 500, color: pal.fg, opacity: 0.8, lineHeight: 1.2, maxWidth: "100%" }}>{t.content.subtitle}</span>}
        <FauxQR size={46} fg={pal.ink} bg={pal.qrBg} />
        {t.content.cta && <span style={{ fontFamily: pal.bodyFont, fontSize: 9, fontWeight: 700, color: readableOn(accHex), background: accHex, borderRadius: L.eCorner === "rond" ? 999 : L.eCorner === "vif" ? 0 : 6, padding: "5px 12px", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.content.cta}</span>}
      </div>
      <div style={{ padding: "9px 12px", background: C.surface }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.fg, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.name}</div>
        {t.objective.length > 0 && <div style={{ fontSize: 11, color: C.fgMuted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.objective.slice(0, 3).join(" · ")}</div>}
      </div>
    </div>
  )
}
export function TemplateLibrary({ item, onApply, onApplyVariant, grand }: { item: Item; onApply: (t: PrintTemplate) => void; onApplyVariant: (t: PrintTemplate, v: TemplateVariant) => void; grand?: boolean }) {
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("pour-vous")
  const [hoverT, setHoverT] = useState<{ t: PrintTemplate; x: number; y: number } | null>(null)
  const ql = q.trim().toLowerCase()
  const matchSearch = (t: PrintTemplate) => correspondAuxChamps([t.name, ...t.business, ...t.objective, ...t.style], ql)
  let list = filterTemplates(item).filter(matchSearch)
  if (!ql && cat !== "pour-vous") { const c = TPL_CATS.find(x => x.id === cat); if (c?.m) list = list.filter(c.m) }
  const showReco = !ql && cat === "pour-vous"
  const reco = showReco ? list.slice(0, 6) : []
  const rest = showReco ? list.slice(6) : list
  const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: `repeat(auto-fill,minmax(${grand ? 140 : 96}px,1fr))`, gap: grand ? 14 : 10 }
  // Survol enrichi (desktop pointeur fin) : positionne la carte à côté du thumbnail, repliée dans le viewport.
  function onHover(t: PrintTemplate, e: React.MouseEvent | React.FocusEvent) {
    if (!window.matchMedia || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const W = 210, H = 232, gap = 12
    const x = r.right + gap + W <= window.innerWidth ? r.right + gap : Math.max(8, r.left - gap - W)
    const y = Math.max(8, Math.min(r.top - 24, window.innerHeight - H - 8))
    setHoverT({ t, x, y })
  }
  const card = (t: PrintTemplate) => (
    <div key={t.id} style={{ display: "flex", flexDirection: "column", gap: 5 }} onFocus={e => onHover(t, e)} onBlur={() => setHoverT(h => (h?.t.id === t.id ? null : h))}
      onMouseEnter={e => onHover(t, e)} onMouseMove={e => onHover(t, e)} onMouseLeave={() => setHoverT(h => (h?.t.id === t.id ? null : h))}>
      <TemplateThumb t={t} item={item} grand={grand} onClick={() => onApply(t)} />
      {t.variants && t.variants.length > 0 && <div style={{ display: "flex", gap: 0, flexWrap: "wrap" }}>{t.variants.map(v => <button key={v.id} onClick={() => onApplyVariant(t, v)} title={`${t.name} — ${v.label}`} aria-label={`${t.name} — ${v.label}`} style={zoneDeTouche(16)}><span aria-hidden style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${C.hairline}`, background: v.hex, display: "block" }} /></button>)}</div>}
    </div>
  )
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <style>{`.ps-tpl{transition:transform var(--mo-fast) var(--mo-ease-standard)}.ps-tpl:hover{transform:scale(1.04)}@media(prefers-reduced-motion:reduce){.ps-tpl:hover{transform:none}}`}</style>
      {hoverT && <div className="mo-pop-in" style={{ position: "fixed", left: hoverT.x, top: hoverT.y, zIndex: 200, pointerEvents: "none" }}><TemplateHoverCard t={hoverT.t} /></div>}
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Rechercher un modèle…" style={{ ...inputStyle, height: 42 }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {TPL_CATS.map(c => <button key={c.id} onClick={() => { setCat(c.id); setQ("") }} style={{ ...chipStyle(!ql && cat === c.id), minHeight: 40, fontSize: 12 }}>{c.label}</button>)}
      </div>
      {showReco && reco.length > 0 && <>
        <p style={{ margin: 0, fontSize: 11.5, fontWeight: 700, color: C.gold }}>Recommandés pour ce support</p>
        <div style={grid}>{reco.map(card)}</div>
        <p style={secLabel}>Tous les modèles</p>
      </>}
      <div style={grid}>{rest.map(card)}</div>
      {list.length === 0 && <p style={{ color: C.fgMuted, fontSize: 13, textAlign: "center", padding: "8px 0" }}>Aucun modèle pour « {q} ».</p>}
    </div>
  )
}
/* Bibliothèque d'éléments « + Ajouter » : Texte + Formes + Icônes catégorisées, avec recherche FR.
   Ne montre pas 40 boutons en vrac — sections claires + filtre. Sur choix : ajoute l'élément et ferme. */
export function AddLibrary({ query, setQuery, onComp, onText, onShape, onIcon }: { query: string; setQuery: (v: string) => void; onComp: (id: string) => void; onText: () => void; onShape: (id: string) => void; onIcon: (name: string) => void }) {
  const q = query.trim().toLowerCase()
  const comps = COMPOSITIONS.filter(c => correspondAuxChamps([c.label, c.hint], q))
  const shownShapes = SHAPES.filter(s => correspond(s.label, q))
  const cats = ICON_CATS.map(c => ({ cat: c.cat, items: c.items.filter(i => correspondAuxChamps([i.label, i.name], q)) })).filter(c => c.items.length)
  const showText = !q || correspond("texte text", q)
  const empty = !comps.length && !showText && !shownShapes.length && !cats.length
  const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(74px,1fr))", gap: 8 }
  const tile: React.CSSProperties = { display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 6px", borderRadius: 10, border: `1px solid ${C.hairline}`, background: C.surfaceUp, color: C.fg, cursor: "pointer", fontSize: 11, minHeight: 62 }
  const secLbl: React.CSSProperties = { margin: "0 0 8px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, color: C.fgFaint }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher (avis, Wi-Fi, réserver…)" style={{ ...inputStyle, height: 44 }} />
      {comps.length > 0 && <div><p style={secLbl}>Compositions prêtes</p><div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(132px,1fr))", gap: 8 }}>{comps.map(c => <button key={c.id} className="ps-chip" onClick={() => onComp(c.id)} style={{ ...tile, flexDirection: "row", alignItems: "flex-start", justifyContent: "flex-start", textAlign: "left", minHeight: 0, padding: "10px 12px" }}><span style={{ display: "flex", flexDirection: "column", gap: 2 }}><span style={{ fontSize: 12.5, fontWeight: 700 }}>{c.label}</span><span style={{ fontSize: 11, color: C.fgFaint }}>{c.hint}</span></span></button>)}</div></div>}
      {showText && <div><p style={secLbl}>Texte</p><div style={gridStyle}><button className="ps-chip" onClick={onText} style={tile}><span style={{ fontSize: 20, fontWeight: 700, lineHeight: 1 }}>T</span>Texte</button></div></div>}
      {shownShapes.length > 0 && <div><p style={secLbl}>Formes</p><div style={gridStyle}>{shownShapes.map(s => <button key={s.id} className="ps-chip" onClick={() => onShape(s.id)} style={tile}><span style={{ fontSize: 18, lineHeight: 1 }}>{s.g}</span>{s.label}</button>)}</div></div>}
      {cats.map(c => <div key={c.cat}><p style={secLbl}>{c.cat}</p><div style={gridStyle}>{c.items.map(i => { const Ico = ICON_LIB[i.name]; return <button key={i.name} className="ps-chip" onClick={() => onIcon(i.name)} style={tile}>{Ico ? <Ico size={20} /> : null}{i.label}</button> })}</div></div>)}
      {empty && <p style={{ color: C.fgMuted, fontSize: 13, textAlign: "center", padding: "12px 0" }}>Aucun élément pour « {query} ».</p>}
    </div>
  )
}
