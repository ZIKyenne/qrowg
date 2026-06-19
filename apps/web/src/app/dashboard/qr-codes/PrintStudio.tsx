"use client"

// =============================================================================
// PrintStudio.tsx — QR Print Studio (Phase 1)
// Editeur de supports marketing type Canva, specialise QR, base sur Fabric.js (v5).
// Plein ecran (overlay). Monte dans l'onglet "Imprimables" de QRStudio derriere un flag.
//
// Garde-fous :
// - Composant CLIENT. Fabric initialise/dispose dans useEffect (StrictMode-safe).
// - Le VRAI QR est injecte (prop qrDataUrl) et marque isQR (regenerable plus tard).
// - Sauvegarde via route serveur /api/print-design (RLS). Jamais d'ecriture client directe.
// - Export haute def via toDataURL({ multiplier }).
// - Charger Fabric via import npm (pas de CDN).
// =============================================================================

import { useEffect, useRef, useState, useCallback } from "react"
import { fabric } from "fabric"
import {
  X, Type as TypeIcon, QrCode, Square, Circle as CircleIcon, Minus,
  Copy, Trash2, Lock, Unlock, ChevronUp, ChevronDown,
  Download, Printer, Loader2, Check, Save,
  Shapes, Star, Award, MousePointerClick, ArrowRight, LayoutTemplate,
  Undo2, Redo2,
} from "lucide-react"

// ---- Constantes design (Midnight Gold) -------------------------------------
const G       = "#C9A84C"
const INK     = "#F5F0E8"
const MUTED   = "#8A8478"
const SURFACE = "#111009"
const BG      = "#080808"
const CANVAS_BG_DEFAULT = "#FFFFFF"

// ---- Formats supportes -----------------------------------------------------
// ratio = largeur / hauteur ; exportW = largeur cible export (~300 DPI / format reseau)
type FormatId = "a4" | "square" | "story"
const FORMATS: Record<FormatId, { label: string; ratio: number; exportW: number }> = {
  a4:     { label: "A4",    ratio: 210 / 297,  exportW: 2480 }, // portrait, ~300 DPI
  square: { label: "Carré", ratio: 1,          exportW: 2000 },
  story:  { label: "Story", ratio: 1080 / 1920, exportW: 1080 }, // 9:16
}
const EDIT_MAX_H = 620 // hauteur max du canvas d'edition a l'ecran

function editDims(fmt: FormatId) {
  const { ratio } = FORMATS[fmt]
  const h = EDIT_MAX_H
  const w = Math.round(h * ratio)
  return { w, h }
}

// ---- Polices web-safe (rendu canvas fiable) --------------------------------
const FONTS = ["Georgia", "Arial", "Helvetica", "Times New Roman", "Courier New", "Verdana", "Trebuchet MS", "Impact"]

// ---- Helpers geometrie (etoile / polygone reguliers) -----------------------
function starPts(spikes: number, outer: number, inner: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  let rot = (Math.PI / 2) * 3
  const step = Math.PI / spikes
  for (let i = 0; i < spikes; i++) {
    pts.push({ x: outer + Math.cos(rot) * outer, y: outer + Math.sin(rot) * outer }); rot += step
    pts.push({ x: outer + Math.cos(rot) * inner, y: outer + Math.sin(rot) * inner }); rot += step
  }
  return pts
}
function polyPts(sides: number, r: number): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  for (let i = 0; i < sides; i++) {
    const a = (Math.PI * 2 * i) / sides - Math.PI / 2
    pts.push({ x: r + r * Math.cos(a), y: r + r * Math.sin(a) })
  }
  return pts
}

// ---- Catalogue d'icones (SVG mono-path => recolorables via le panneau) ------
const LIB_ICONS: { key: string; label: string; d: string }[] = [
  { key:"star",  label:"Avis",      d:"M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" },
  { key:"phone", label:"Téléphone", d:"M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.21z" },
  { key:"mail",  label:"Email",     d:"M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" },
  { key:"pin",   label:"Adresse",   d:"M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" },
  { key:"clock", label:"Horaires",  d:"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" },
  { key:"web",   label:"Site web",  d:"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" },
  { key:"cal",   label:"Réserver",  d:"M19 3h-1V1h-2v2H8V1H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z" },
  { key:"cam",   label:"Photo",     d:"M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15a5 5 0 110-10 5 5 0 010 10zm0-2a3 3 0 100-6 3 3 0 000 6z" },
  { key:"heart", label:"J'aime",    d:"M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" },
  { key:"check", label:"Validé",    d:"M12 2a10 10 0 100 20 10 10 0 000-20zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" },
  { key:"cart",  label:"Commander", d:"M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 15h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" },
  { key:"gift",  label:"Offre",     d:"M20 6h-2.18c.11-.31.18-.65.18-1a2.996 2.996 0 00-5.5-1.65l-.5.67-.5-.68C10.96 2.54 10.05 2 9 2 7.34 2 6 3.34 6 5c0 .35.07.69.18 1H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-5-2c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zM9 4c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm11 15H4v-2h16v2zm0-5H4V8h5.08L7 10.83 8.62 12 12 7.4l3.38 4.6L17 10.83 14.92 8H20v6z" },
]

// ---- Props -----------------------------------------------------------------
type Props = {
  qrId: string
  qrDataUrl: string
  userPlan: string
  onClose: () => void
  onUpsell?: (feature: string, plan: string) => void
  // Donnees deja saisies cote QRStudio, pour pre-remplir les modeles
  prefill?: { name?: string; phone?: string; website?: string }
}

// ---- Etat de selection (pour le panneau proprietes) ------------------------
type SelState = {
  isText: boolean
  fill: string
  opacity: number
  fontFamily: string
  fontSize: number
  bold: boolean
  locked: boolean
  label: string | null    // libelle editable (groupe CTA/badge contenant un texte)
  isGroup: boolean        // true => "Couleur" recolore les formes du groupe
  textFill: string | null // couleur du texte interne (groupe avec texte)
} | null

// Trouve l'objet texte dans un groupe (CTA / badge), s'il y en a un
function groupText(o: fabric.Object | undefined | null): fabric.Text | null {
  if (!o || o.type !== "group") return null
  const child = (o as fabric.Group).getObjects().find(c => c.type === "text" || c.type === "i-text" || c.type === "textbox")
  return (child as fabric.Text) ?? null
}

const TOJSON_PROPS = [
  "isQR",
  "lockMovementX", "lockMovementY",
  "lockScalingX", "lockScalingY",
  "lockRotation", "selectable", "evented",
]

// Couleur de texte lisible (noir/blanc) sur un fond donne
function lum(hex: string): number {
  const h = hex.replace("#", "")
  if (h.length < 6) return 1
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}
function readableOn(hex: string): string { return lum(hex) > 0.6 ? "#111111" : "#FFFFFF" }

// Construit un bouton "pilule" (rect arrondi + texte) dimensionne au texte
function buildPill(label: string, o: { rectFill: string; textFill: string; height: number; fontSize: number }): fabric.Group {
  const txt = new fabric.Text(label, { fontSize: o.fontSize, fontFamily: "Arial", fontWeight: "bold", fill: o.textFill, originX: "center", originY: "center" })
  const padX = o.height * 0.6
  const rw = Math.max(o.height * 2, (txt.width ?? 0) + padX * 2)
  const rect = new fabric.Rect({ width: rw, height: o.height, rx: o.height / 2, ry: o.height / 2, fill: o.rectFill })
  txt.set({ left: rw / 2, top: o.height / 2 })
  return new fabric.Group([rect, txt])
}

// ---- Modeles orientes objectifs (points de depart editables) ---------------
// Chaque modele compose un design (fond + titre + sous-titre + QR + decor) dans
// l'editeur. Les couleurs sont reprises des palettes signature de QRStudio.
const PRINT_TEMPLATES: { id: string; label: string; obj: string; emoji: string; desc: string; bg: string; ink: string; accent: string }[] = [
  { id:"avis-or",       label:"Avis — Or",          obj:"Avis",     emoji:"⭐", desc:"5 étoiles dorées + invitation à noter",   bg:"#0B0805", ink:"#F4E7C4", accent:"#D4AF37" },
  { id:"avis-clair",    label:"Avis — Clair",       obj:"Avis",     emoji:"⭐", desc:"Fond crème, sobre et lisible",            bg:"#FFF9EF", ink:"#2A2419", accent:"#C0392B" },
  { id:"menu",          label:"Menu — Élégant",     obj:"Menu",     emoji:"🍽️", desc:"Bandeau coloré + « Notre carte »",        bg:"#101010", ink:"#F5F0E8", accent:"#C9A84C" },
  { id:"menu-clair",    label:"Menu — Clair",       obj:"Menu",     emoji:"🍽️", desc:"Fond crème, bandeau doré",               bg:"#FBF3E7", ink:"#3A2316", accent:"#B8860B" },
  { id:"reserver",      label:"Réservation",        obj:"Réserver", emoji:"📅", desc:"Picto agenda + « Réservez votre table »", bg:"#06231C", ink:"#EAF7F0", accent:"#34D399" },
  { id:"reserver-clair",label:"Réservation — Clair",obj:"Réserver", emoji:"📅", desc:"Fond clair, accent vert",                bg:"#F2F7F4", ink:"#10271E", accent:"#0E7A5F" },
  { id:"insta",         label:"Instagram",          obj:"Abonnés",  emoji:"📷", desc:"Picto photo + « Suivez-nous » + @compte", bg:"#1A0A14", ink:"#FFF0F6", accent:"#E1306C" },
  { id:"insta-clair",   label:"Instagram — Clair",  obj:"Abonnés",  emoji:"📷", desc:"Fond clair, accent rose",                bg:"#FFF5F8", ink:"#2A0A18", accent:"#E1306C" },
  { id:"contact",       label:"Carte contact",      obj:"Contact",  emoji:"💳", desc:"Nom, métier, coordonnées + QR",          bg:"#0F1729", ink:"#F1F5FF", accent:"#5B8DEF" },
  { id:"contact-clair", label:"Carte contact — Clair",obj:"Contact",emoji:"💳", desc:"Fond clair, sobre",                      bg:"#F7F9FC", ink:"#0F2540", accent:"#1D4ED8" },
  { id:"decouvrir",     label:"Découvrir",          obj:"Page",     emoji:"🔗", desc:"Invitation simple à scanner",            bg:"#FFFFFF", ink:"#1A1A1A", accent:"#1D4ED8" },
  { id:"decouvrir-or",  label:"Découvrir — Or",     obj:"Page",     emoji:"🔗", desc:"Fond sombre, accent or",                 bg:"#0B0805", ink:"#F4E7C4", accent:"#D4AF37" },
]

// Mini-apercu schematique d'un modele (fond + couleurs + disposition)
function tplThumb(t: { id: string; bg: string; ink: string; accent: string }) {
  const isMenu = t.id.startsWith("menu")
  const isContact = t.id.startsWith("contact")
  const isAvis = t.id.startsWith("avis")
  const starClip = "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)"
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 4", background: t.bg, borderRadius: 6, overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", gap: "6%", padding: isMenu ? "0 10% 12%" : "13% 10%", boxSizing: "border-box" }}>
      {isMenu && <div style={{ width: "100%", height: "18%", background: t.accent, marginBottom: "8%" }} />}
      <div style={{ width: "68%", height: 5, borderRadius: 3, background: t.ink, opacity: 0.92 }} />
      {isAvis ? (
        <div style={{ display: "flex", gap: "4%", width: "52%", justifyContent: "center" }}>
          {[0, 1, 2, 3, 4].map(i => <div key={i} style={{ width: "13%", aspectRatio: "1", background: t.accent, clipPath: starClip }} />)}
        </div>
      ) : (
        <div style={{ width: "38%", height: 4, borderRadius: 2, background: t.accent }} />
      )}
      <div style={{ width: "44%", aspectRatio: "1", background: "#fff", borderRadius: 3, marginTop: "2%" }} />
      {isContact ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 5, width: "72%", alignItems: "center", marginTop: "5%" }}>
          <div style={{ width: "82%", height: 3, borderRadius: 2, background: t.ink, opacity: 0.7 }} />
          <div style={{ width: "64%", height: 3, borderRadius: 2, background: t.ink, opacity: 0.7 }} />
        </div>
      ) : (
        <div style={{ width: "56%", height: 8, borderRadius: 5, background: t.accent, marginTop: "6%" }} />
      )}
    </div>
  )
}

export default function PrintStudio({ qrId, qrDataUrl, userPlan, onClose, onUpsell, prefill }: Props) {
  const elRef   = useRef<HTMLCanvasElement>(null)
  const fcRef   = useRef<fabric.Canvas | null>(null)
  const qrUrlRef = useRef(qrDataUrl)
  const vGuideRef = useRef<fabric.Line | null>(null)
  const hGuideRef = useRef<fabric.Line | null>(null)
  const clipRef = useRef<fabric.Object | null>(null) // presse-papier (copier/coller)
  const histRef = useRef<{ stack: string[]; i: number; lock: boolean }>({ stack: [], i: -1, lock: false })
  const pushTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [format, setFormat]   = useState<FormatId>("a4")
  const [sel, setSel]         = useState<SelState>(null)
  const [bgColor, setBgColor] = useState(CANVAS_BG_DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [exporting, setExporting] = useState(false)
  const [libOpen, setLibOpen] = useState(false)
  const [libCat, setLibCat]   = useState<"cta" | "icons" | "badges" | "shapes" | "arrows">("cta")
  const [tplOpen, setTplOpen] = useState(false)
  const [histVer, setHistVer] = useState(0) // force le rafraichissement des boutons undo/redo

  const isPro = userPlan === "pro" || userPlan === "business"

  // ---- Lecture d'un objet -> etat de selection -----------------------------
  const readSel = useCallback((o: fabric.Object | undefined | null): SelState => {
    if (!o) return null
    const isText = o.type === "i-text" || o.type === "text" || o.type === "textbox"
    const isGroup = o.type === "group"
    const t = o as any
    const txtChild = groupText(o)
    // Pour un groupe, la "couleur" affichee = celle de la 1re forme (non-texte)
    let fill = typeof o.fill === "string" ? o.fill : "#C9A84C"
    if (isGroup) {
      const shape = (o as fabric.Group).getObjects().find(c => c.type !== "text" && c.type !== "i-text" && c.type !== "textbox")
      if (shape && typeof shape.fill === "string") fill = shape.fill
    }
    return {
      isText,
      fill,
      opacity: o.opacity ?? 1,
      fontFamily: isText ? (t.fontFamily ?? "Georgia") : "Georgia",
      fontSize: isText ? (t.fontSize ?? 40) : 40,
      bold: isText ? (t.fontWeight === "bold" || t.fontWeight === 700) : false,
      locked: !!o.lockMovementX,
      label: txtChild?.text ?? null,
      isGroup,
      textFill: txtChild && typeof txtChild.fill === "string" ? txtChild.fill : null,
    }
  }, [])

  const refreshSel = useCallback(() => {
    const fc = fcRef.current
    setSel(readSel(fc?.getActiveObject()))
  }, [readSel])

  // ---- Centrer un objet ----------------------------------------------------
  const centerObj = useCallback((o: fabric.Object) => {
    const fc = fcRef.current; if (!fc) return
    fc.add(o)
    fc.viewportCenterObject(o)
    fc.setActiveObject(o)
    fc.requestRenderAll()
    refreshSel()
  }, [refreshSel])

  // ---- Historique (undo / redo) --------------------------------------------
  // Snapshot du canvas en JSON (guides exclus). Le verrou evite que la
  // restauration (loadFromJSON) ne reempile des etats.
  const snapshot = (fc: fabric.Canvas): string => {
    const json = fc.toJSON([...TOJSON_PROPS, "isGuide"]) as { objects?: { isGuide?: boolean }[] }
    json.objects = (json.objects ?? []).filter(o => !o.isGuide)
    return JSON.stringify(json)
  }
  const pushHistory = () => {
    const fc = fcRef.current, h = histRef.current
    if (!fc || h.lock) return
    h.stack = h.stack.slice(0, h.i + 1)
    h.stack.push(snapshot(fc))
    if (h.stack.length > 60) h.stack.shift()
    h.i = h.stack.length - 1
    setHistVer(v => v + 1)
  }
  const pushHistorySoon = () => {
    if (histRef.current.lock) return
    clearTimeout(pushTimerRef.current)
    pushTimerRef.current = setTimeout(pushHistory, 350)
  }
  const restoreHistory = (s: string) => {
    const fc = fcRef.current; if (!fc) return
    histRef.current.lock = true
    fc.loadFromJSON(JSON.parse(s), () => {
      const vG = vGuideRef.current, hG = hGuideRef.current
      if (vG) fc.add(vG)
      if (hG) fc.add(hG)
      const bgc = (fc.backgroundColor as string) || CANVAS_BG_DEFAULT
      setBgColor(typeof bgc === "string" ? bgc : CANVAS_BG_DEFAULT)
      fc.discardActiveObject(); fc.requestRenderAll()
      histRef.current.lock = false
      setSel(null)
    })
  }
  const undo = () => {
    const h = histRef.current
    if (h.i <= 0) return
    h.i--; restoreHistory(h.stack[h.i]); setHistVer(v => v + 1)
  }
  const redo = () => {
    const h = histRef.current
    if (h.i >= h.stack.length - 1) return
    h.i++; restoreHistory(h.stack[h.i]); setHistVer(v => v + 1)
  }

  // ---- Init Fabric (une seule fois) ---------------------------------------
  useEffect(() => {
    if (!elRef.current) return
    const { w, h } = editDims("a4")
    const fc = new fabric.Canvas(elRef.current, {
      width: w,
      height: h,
      backgroundColor: CANVAS_BG_DEFAULT,
      preserveObjectStacking: true,
    })
    fcRef.current = fc

    // Guides de centrage (dores), exclus de l'export
    const guideOpts = {
      stroke: G, strokeWidth: 1, selectable: false, evented: false,
      excludeFromExport: true, visible: false,
    }
    const vG = new fabric.Line([0, 0, 0, 0], guideOpts)
    const hG = new fabric.Line([0, 0, 0, 0], guideOpts)
    ;(vG as any).isGuide = true; (hG as any).isGuide = true
    fc.add(vG); fc.add(hG)
    vGuideRef.current = vG; hGuideRef.current = hG

    // Snap au centre + guides
    fc.on("object:moving", (e) => {
      const o = e.target; if (!o) return
      const cx = fc.getWidth() / 2, cy = fc.getHeight() / 2, snap = 8
      const c = o.getCenterPoint()
      if (Math.abs(c.x - cx) < snap) {
        o.setPositionByOrigin(new fabric.Point(cx, c.y), "center", "center")
        vG.set({ x1: cx, y1: 0, x2: cx, y2: fc.getHeight(), visible: true })
      } else { vG.set({ visible: false }) }
      const c2 = o.getCenterPoint()
      if (Math.abs(c2.y - cy) < snap) {
        o.setPositionByOrigin(new fabric.Point(c2.x, cy), "center", "center")
        hG.set({ x1: 0, y1: cy, x2: fc.getWidth(), y2: cy, visible: true })
      } else { hG.set({ visible: false }) }
      fc.bringToFront(vG); fc.bringToFront(hG)
    })
    fc.on("object:modified", () => { vG.set({ visible: false }); hG.set({ visible: false }); fc.requestRenderAll() })
    fc.on("mouse:up",       () => { vG.set({ visible: false }); hG.set({ visible: false }); fc.requestRenderAll() })

    fc.on("selection:created", refreshSel)
    fc.on("selection:updated", refreshSel)
    fc.on("selection:cleared", () => setSel(null))

    // Historique : capter ajout / suppression / modification (drag, scale, rotate)
    fc.on("object:added", pushHistory)
    fc.on("object:removed", pushHistory)
    fc.on("object:modified", pushHistory)

    // ---- Chargement du design existant ou QR initial ----------------------
    ;(async () => {
      try {
        const res = await fetch(`/api/print-design?qr_id=${encodeURIComponent(qrId)}`)
        const json = res.ok ? await res.json() : null
        if (json?.format && (json.format in FORMATS)) {
          setFormat(json.format)
          const d = editDims(json.format)
          fc.setDimensions({ width: d.w, height: d.h })
        }
        if (json?.design) {
          histRef.current.lock = true // ne pas empiler pendant le chargement
          fc.loadFromJSON(json.design, () => {
            // remettre les guides au-dessus apres rechargement
            fc.add(vG); fc.add(hG)
            const bgc = (fc.backgroundColor as string) || CANVAS_BG_DEFAULT
            setBgColor(typeof bgc === "string" ? bgc : CANVAS_BG_DEFAULT)
            fc.requestRenderAll()
            histRef.current.lock = false
            pushHistory() // etat initial = design charge
            setLoading(false)
          })
          return
        }
      } catch { /* pas de design : on pose le QR */ }
      // Aucun design sauvegarde -> poser le vrai QR au centre
      placeQr(fc)
      setLoading(false)
    })()

    return () => { fc.dispose(); fcRef.current = null }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---- Maj de la ref qrDataUrl + regeneration du QR present ----------------
  useEffect(() => {
    qrUrlRef.current = qrDataUrl
    const fc = fcRef.current; if (!fc) return
    const existing = fc.getObjects().find(o => (o as any).isQR) as fabric.Image | undefined
    if (existing) {
      fabric.Image.fromURL(qrDataUrl, (img) => {
        existing.setElement((img as any).getElement())
        fc.requestRenderAll()
      })
    }
  }, [qrDataUrl])

  // ---- Raccourcis clavier (supprimer, copier/coller, dupliquer, deplacer) --
  useEffect(() => {
    const isTyping = () => {
      const el = document.activeElement as HTMLElement | null
      return !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)
    }
    // Clone + ajoute au canvas, decale et selectionne
    const dropClone = (fc: fabric.Canvas, src: fabric.Object, dx: number, dy: number) => {
      src.clone((c: fabric.Object) => {
        c.set({ left: (src.left ?? 0) + dx, top: (src.top ?? 0) + dy })
        ;(c as any).isQR = (src as any).isQR
        fc.add(c); fc.setActiveObject(c); fc.requestRenderAll(); refreshSel()
      }, TOJSON_PROPS)
    }
    const onKey = (e: KeyboardEvent) => {
      const fc = fcRef.current; if (!fc) return
      const o = fc.getActiveObject()
      if (isTyping() || (o as any)?.isEditing) return // ne pas gener la saisie de texte
      const meta = e.ctrlKey || e.metaKey

      if (e.key === "Delete" || e.key === "Backspace") {
        const objs = fc.getActiveObjects() // gere la selection multiple
        if (!objs.length) return
        e.preventDefault(); objs.forEach(x => fc.remove(x)); fc.discardActiveObject(); fc.requestRenderAll(); setSel(null)
      } else if (e.key === "Escape") {
        fc.discardActiveObject(); fc.requestRenderAll(); setSel(null)
      } else if (meta && (e.key === "c" || e.key === "C")) {
        if (!o) return
        e.preventDefault(); o.clone((c: fabric.Object) => { clipRef.current = c }, TOJSON_PROPS)
      } else if (meta && (e.key === "v" || e.key === "V")) {
        if (!clipRef.current) return
        e.preventDefault(); dropClone(fc, clipRef.current, 24, 24)
      } else if (meta && (e.key === "d" || e.key === "D")) {
        if (!o) return
        e.preventDefault(); dropClone(fc, o, 24, 24)
      } else if (meta && (e.key === "z" || e.key === "Z")) {
        e.preventDefault(); if (e.shiftKey) redo(); else undo()
      } else if (meta && (e.key === "y" || e.key === "Y")) {
        e.preventDefault(); redo()
      } else if (o && e.key.startsWith("Arrow")) {
        e.preventDefault()
        const s = e.shiftKey ? 10 : 1
        if (e.key === "ArrowLeft")  o.set("left", (o.left ?? 0) - s)
        if (e.key === "ArrowRight") o.set("left", (o.left ?? 0) + s)
        if (e.key === "ArrowUp")    o.set("top",  (o.top  ?? 0) - s)
        if (e.key === "ArrowDown")  o.set("top",  (o.top  ?? 0) + s)
        o.setCoords(); fc.requestRenderAll(); pushHistorySoon()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [refreshSel])

  // ---- Poser le vrai QR ----------------------------------------------------
  function placeQr(fc: fabric.Canvas) {
    fabric.Image.fromURL(qrUrlRef.current, (img) => {
      img.scaleToWidth(Math.round(fc.getWidth() * 0.42))
      ;(img as any).isQR = true
      fc.add(img)
      fc.viewportCenterObject(img)
      fc.setActiveObject(img)
      fc.requestRenderAll()
      refreshSel()
    })
  }

  // ---- Outils d'ajout ------------------------------------------------------
  const addText = () => {
    const t = new fabric.IText("Votre texte", {
      fontFamily: "Georgia", fill: INK, fontSize: 40, fontWeight: "bold",
    })
    centerObj(t)
  }
  const addQr = () => { const fc = fcRef.current; if (fc) placeQr(fc) }
  const addRect = () => centerObj(new fabric.Rect({ width: 180, height: 100, fill: G, rx: 6, ry: 6 }))
  const addCircle = () => centerObj(new fabric.Circle({ radius: 60, fill: G }))
  const addLine = () => centerObj(new fabric.Line([0, 0, 200, 0], { stroke: G, strokeWidth: 4 }))

  // ---- Bibliotheque d'elements ---------------------------------------------
  // Icone : SVG mono-path => Fabric renvoie un Path unique (recolorable via panneau)
  const addIcon = (d: string) => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}" fill="${G}"/></svg>`
    fabric.loadSVGFromString(svg, (objects, options) => {
      const obj = fabric.util.groupSVGElements(objects, options) as fabric.Object
      obj.scaleToWidth(110)
      centerObj(obj)
    })
  }
  // Formes decoratives
  const addShape = (k: string) => {
    let o: fabric.Object
    switch (k) {
      case "rrect":  o = new fabric.Rect({ width: 220, height: 130, rx: 18, ry: 18, fill: G }); break
      case "circle": o = new fabric.Circle({ radius: 75, fill: G }); break
      case "tri":    o = new fabric.Triangle({ width: 160, height: 140, fill: G }); break
      case "star":   o = new fabric.Polygon(starPts(5, 85, 36), { fill: G }); break
      case "hexa":   o = new fabric.Polygon(polyPts(6, 85), { fill: G }); break
      case "banner": o = new fabric.Rect({ width: 300, height: 70, fill: G }); break
      default:       o = new fabric.Rect({ width: 200, height: 120, fill: G })
    }
    centerObj(o)
  }
  // Bouton CTA (pilule dimensionnee au texte)
  const addCTA = (label: string) => {
    centerObj(buildPill(label, { rectFill: G, textFill: "#080808", height: 80, fontSize: 30 }))
  }
  // Badge rond (sceau cranté) ou ruban (fanion)
  const addBadge = (label: string, kind: "seal" | "ribbon") => {
    if (kind === "seal") {
      const burst = new fabric.Polygon(starPts(16, 95, 80), { fill: G })
      const txt   = new fabric.Text(label, { fontSize: 26, fontFamily: "DM Sans", fontWeight: "bold", fill: "#080808", originX: "center", originY: "center", left: 95, top: 95 })
      centerObj(new fabric.Group([burst, txt]))
    } else {
      const W = 300, H = 74, N = 30
      const ribbon = new fabric.Polygon([
        { x: 0, y: 0 }, { x: W, y: 0 }, { x: W - N, y: H / 2 }, { x: W, y: H }, { x: 0, y: H }, { x: N, y: H / 2 },
      ], { fill: G })
      const txt = new fabric.Text(label, { fontSize: 28, fontFamily: "DM Sans", fontWeight: "bold", fill: "#080808", originX: "center", originY: "center", left: W / 2, top: H / 2 })
      centerObj(new fabric.Group([ribbon, txt]))
    }
  }
  // Fleche (polygone), pointant vers la droite par defaut + rotation
  const addArrow = (angle: number) => {
    const w = 230, h = 130
    const pts = [
      { x: 0, y: h * 0.3 }, { x: w * 0.6, y: h * 0.3 }, { x: w * 0.6, y: 0 }, { x: w, y: h * 0.5 },
      { x: w * 0.6, y: h }, { x: w * 0.6, y: h * 0.7 }, { x: 0, y: h * 0.7 },
    ]
    centerObj(new fabric.Polygon(pts, { fill: G, angle }))
  }

  // ---- Mutation de l'objet actif -------------------------------------------
  const mutate = (fn: (o: fabric.Object) => void) => {
    const fc = fcRef.current; if (!fc) return
    const o = fc.getActiveObject(); if (!o) return
    fn(o)
    fc.requestRenderAll()
    refreshSel()
    pushHistorySoon()
  }

  // Changer le libelle d'un groupe CTA / badge (texte interne) + ajuster la pilule
  const setLabel = (value: string) => {
    const fc = fcRef.current; if (!fc) return
    const grp = fc.getActiveObject() as fabric.Group | undefined
    const txt = groupText(grp)
    if (!grp || !txt) return
    txt.set({ text: value })
    ;(txt as unknown as { initDimensions?: () => void }).initDimensions?.()
    // Pilule (rect arrondi + texte) : ajuster la largeur au texte, garder centre
    const kids = grp.getObjects()
    const rect = kids.find(o => o.type === "rect") as fabric.Rect | undefined
    if (rect && kids.length === 2) {
      const h = rect.height ?? 60
      const newW = Math.max(h * 2, (txt.width ?? 0) + h * 0.6 * 2)
      rect.set({ width: newW, left: -newW / 2 })
      txt.set({ left: 0 })
      grp.set({ width: newW })
    }
    grp.dirty = true
    grp.setCoords()
    fc.requestRenderAll()
    refreshSel()
    pushHistorySoon()
  }

  // Couleur : recolore les formes (non-texte) d'un groupe, ou l'objet simple
  const setFill = (color: string) => mutate(o => {
    if (o.type === "group") {
      ;(o as fabric.Group).getObjects().forEach(c => {
        if (c.type !== "text" && c.type !== "i-text" && c.type !== "textbox") c.set("fill", color)
      })
      o.dirty = true
    } else {
      o.set("fill", color)
    }
  })

  // Couleur du texte interne d'un groupe (CTA / badge)
  const setTextColor = (color: string) => mutate(o => {
    const txt = groupText(o); if (!txt) return
    txt.set("fill", color)
    o.dirty = true
  })

  // ---- Calques -------------------------------------------------------------
  const layer = (action: "front" | "back" | "fwd" | "bwd" | "dup" | "lock" | "del") => {
    const fc = fcRef.current; if (!fc) return
    const o = fc.getActiveObject(); if (!o) return
    switch (action) {
      case "front": fc.bringToFront(o); break
      case "back":  fc.sendToBack(o);   break
      case "fwd":   fc.bringForward(o); break
      case "bwd":   fc.sendBackwards(o); break
      case "dup":
        o.clone((c: fabric.Object) => {
          c.set({ left: (o.left ?? 0) + 20, top: (o.top ?? 0) + 20 })
          ;(c as any).isQR = (o as any).isQR
          fc.add(c); fc.setActiveObject(c); fc.requestRenderAll(); refreshSel()
        }, TOJSON_PROPS)
        return
      case "lock": {
        const locked = !o.lockMovementX
        o.set({
          lockMovementX: locked, lockMovementY: locked,
          lockScalingX: locked, lockScalingY: locked, lockRotation: locked,
          hasControls: !locked,
        })
        break
      }
      case "del":
        fc.remove(o); fc.discardActiveObject(); setSel(null); fc.requestRenderAll()
        return
    }
    // garder les guides au sommet
    if (vGuideRef.current) fc.bringToFront(vGuideRef.current)
    if (hGuideRef.current) fc.bringToFront(hGuideRef.current)
    fc.requestRenderAll(); refreshSel()
    pushHistorySoon() // front/back/fwd/bwd/lock ne declenchent pas d'evenement
  }

  // ---- Alignement sur le support -------------------------------------------
  const align = (action: "left" | "centerH" | "right" | "top" | "centerV" | "bottom") => {
    const fc = fcRef.current; if (!fc) return
    const o = fc.getActiveObject(); if (!o) return
    const W = fc.getWidth(), H = fc.getHeight()
    const b = o.getBoundingRect(true) // boite englobante en coords canvas
    switch (action) {
      case "left":    o.set("left", (o.left ?? 0) - b.left); break
      case "centerH": o.set("left", (o.left ?? 0) + (W / 2 - (b.left + b.width / 2))); break
      case "right":   o.set("left", (o.left ?? 0) + (W - (b.left + b.width))); break
      case "top":     o.set("top",  (o.top ?? 0) - b.top); break
      case "centerV": o.set("top",  (o.top ?? 0) + (H / 2 - (b.top + b.height / 2))); break
      case "bottom":  o.set("top",  (o.top ?? 0) + (H - (b.top + b.height))); break
    }
    o.setCoords(); fc.requestRenderAll(); pushHistorySoon()
  }

  // ---- Format --------------------------------------------------------------
  const applyFormat = (fmt: FormatId) => {
    const fc = fcRef.current; if (!fc) return
    const d = editDims(fmt)
    fc.setDimensions({ width: d.w, height: d.h })
    fc.requestRenderAll()
    setFormat(fmt)
  }

  // ---- Couleur de fond -----------------------------------------------------
  const applyBg = (color: string) => {
    const fc = fcRef.current; if (!fc) return
    fc.setBackgroundColor(color, fc.renderAll.bind(fc))
    setBgColor(color)
    pushHistorySoon()
  }

  // ---- Appliquer un modele oriente objectif --------------------------------
  // Vide le canvas (hors guides), pose un design complet et editable, place le vrai QR.
  const applyTemplate = async (id: string) => {
    const fc = fcRef.current; if (!fc) return
    const meta = PRINT_TEMPLATES.find(t => t.id === id); if (!meta) return
    const vG = vGuideRef.current, hG = hGuideRef.current
    const hasContent = fc.getObjects().some(o => o !== vG && o !== hG)
    if (hasContent && !window.confirm("Remplacer le contenu actuel par ce modèle ?")) return

    histRef.current.lock = true // tout le modele = une seule etape d'historique
    fc.getObjects().slice().forEach(o => { if (o !== vG && o !== hG) fc.remove(o) })
    const W = fc.getWidth(), H = fc.getHeight()
    const { bg, ink, accent } = meta
    fc.setBackgroundColor(bg, () => {}); setBgColor(bg)

    const addText = (s: string, top: number, size: number, o: { weight?: string; fill?: string; font?: string; width?: number } = {}) => {
      fc.add(new fabric.Textbox(s, {
        width: o.width ?? W * 0.82, left: W / 2, top, originX: "center", textAlign: "center",
        fontFamily: o.font ?? "Georgia", fontWeight: o.weight ?? "normal", fontSize: size, fill: o.fill ?? ink,
      }))
    }
    const addStars = (n: number, cy: number, s: number, color: string) => {
      const objs: fabric.Object[] = []
      for (let i = 0; i < n; i++) objs.push(new fabric.Polygon(starPts(5, s / 2, s / 5), { fill: color, left: i * (s * 1.25), top: 0 }))
      fc.add(new fabric.Group(objs, { originX: "center", left: W / 2, top: cy }))
    }
    const addCTA = (label: string, top: number) => {
      const rh = Math.round(Math.min(W * 0.7, 360) * 0.2)
      const g = buildPill(label, { rectFill: accent, textFill: readableOn(accent), height: rh, fontSize: Math.round(rh * 0.42) })
      g.set({ originX: "center", left: W / 2, top })
      fc.add(g)
    }
    const addIconT = (d: string, size: number, top: number, color: string) => new Promise<void>(res => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}" fill="${color}"/></svg>`
      fabric.loadSVGFromString(svg, (objs, opt) => {
        const o = fabric.util.groupSVGElements(objs, opt) as fabric.Object
        o.scaleToWidth(size); o.set({ originX: "center", originY: "top", left: W / 2, top }); fc.add(o); res()
      })
    })
    const placeQrT = (top: number, wFrac: number) => new Promise<void>(res => {
      fabric.Image.fromURL(qrUrlRef.current, (img) => {
        img.scaleToWidth(W * wFrac); (img as any).isQR = true
        img.set({ originX: "center", originY: "top", left: W / 2, top }); fc.add(img); res()
      })
    })
    const ICON = (k: string) => LIB_ICONS.find(i => i.key === k)!.d

    // Donnees reelles (deja saisies cote QRStudio) ; sinon placeholders
    const name    = (prefill?.name ?? "").trim()
    const phone   = (prefill?.phone ?? "").trim()
    const website = (prefill?.website ?? "").trim()
    // Ligne de marque (nom de l'etablissement) ajoutee si dispo
    const brand = (top: number) => { if (name) addText(name, top, W * 0.038, { font: "Arial", weight: "bold", fill: accent }) }

    switch (id) {
      case "avis-or":
      case "avis-clair":
        brand(H * 0.02)
        addText("Vous avez aimé ?", H * 0.06, W * 0.075, { weight: "bold" })
        addStars(5, H * 0.19, W * 0.07, accent)
        addText("Laissez-nous un avis en 30 secondes", H * 0.27, W * 0.034, { font: "Arial", width: W * 0.72 })
        await placeQrT(H * 0.37, 0.46)
        addCTA("Scannez-moi", H * 0.85)
        break
      case "menu":
      case "menu-clair":
        fc.add(new fabric.Rect({ left: 0, top: 0, width: W, height: Math.round(H * 0.16), fill: accent }))
        addText(name || "Notre Carte", H * 0.045, W * 0.085, { weight: "bold", fill: readableOn(accent) })
        addText("Scannez pour découvrir nos plats", H * 0.24, W * 0.034, { font: "Arial" })
        await placeQrT(H * 0.34, 0.5)
        addCTA("Voir le menu", H * 0.85)
        break
      case "reserver":
      case "reserver-clair":
        brand(H * 0.015)
        await addIconT(ICON("cal"), W * 0.14, H * 0.07, accent)
        addText("Réservez votre table", H * 0.2, W * 0.07, { weight: "bold" })
        addText("En quelques secondes, où que vous soyez", H * 0.28, W * 0.032, { font: "Arial", width: W * 0.72 })
        await placeQrT(H * 0.38, 0.44)
        addCTA("Réservez", H * 0.85)
        break
      case "insta":
      case "insta-clair":
        brand(H * 0.015)
        await addIconT(ICON("cam"), W * 0.14, H * 0.07, accent)
        addText("Suivez-nous", H * 0.2, W * 0.085, { weight: "bold" })
        addText("@votrecompte", H * 0.29, W * 0.04, { font: "Arial", fill: accent })
        await placeQrT(H * 0.38, 0.44)
        addCTA("Suivez-nous", H * 0.85)
        break
      case "contact":
      case "contact-clair":
        addText(name || "Prénom Nom", H * 0.09, W * 0.08, { weight: "bold" })
        addText("Votre métier", H * 0.18, W * 0.036, { font: "Arial", fill: accent })
        await placeQrT(H * 0.28, 0.5)
        addText(`📞  ${phone || "06 12 34 56 78"}`, H * 0.76, W * 0.034, { font: "Arial" })
        addText(`🌐  ${website || "monsite.fr"}`, H * 0.83, W * 0.034, { font: "Arial" })
        break
      case "decouvrir":
      case "decouvrir-or":
        brand(H * 0.035)
        addText("Découvrez-nous", H * 0.1, W * 0.08, { weight: "bold" })
        addText("Scannez pour en savoir plus", H * 0.19, W * 0.034, { font: "Arial" })
        await placeQrT(H * 0.3, 0.5)
        addCTA("En savoir plus", H * 0.85)
        break
    }

    if (vG) fc.bringToFront(vG)
    if (hG) fc.bringToFront(hG)
    fc.discardActiveObject(); setSel(null); fc.requestRenderAll()
    histRef.current.lock = false
    pushHistory() // modele applique = une etape
    setTplOpen(false)
  }

  // ---- Sauvegarde ----------------------------------------------------------
  const save = async () => {
    const fc = fcRef.current; if (!fc) return
    setSaving(true); setSaved(false)
    try {
      // ne pas serialiser les guides (excludeFromExport ne suffit pas pour toJSON)
      const vG = vGuideRef.current, hG = hGuideRef.current
      if (vG) fc.remove(vG)
      if (hG) fc.remove(hG)
      const design = fc.toJSON(TOJSON_PROPS)
      if (vG) fc.add(vG)
      if (hG) fc.add(hG)

      const res = await fetch("/api/print-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_id: qrId, design, format }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error ?? "Echec")
      setSaved(true)
      setTimeout(() => setSaved(false), 2200)
    } catch (e) {
      alert("Sauvegarde impossible : " + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  // ---- Export --------------------------------------------------------------
  const prepExport = (fc: fabric.Canvas) => {
    fc.discardActiveObject()
    const vG = vGuideRef.current, hG = hGuideRef.current
    if (vG) vG.set({ visible: false })
    if (hG) hG.set({ visible: false })
    fc.requestRenderAll()
  }

  const exportPng = async () => {
    const fc = fcRef.current; if (!fc) return
    setExporting(true)
    try {
      prepExport(fc)
      const multiplier = FORMATS[format].exportW / fc.getWidth()
      const url = fc.toDataURL({ format: "png", multiplier })
      const a = document.createElement("a")
      a.href = url; a.download = `qrfolio-${format}.png`; a.click()
    } finally { setExporting(false) }
  }

  const exportPdf = async () => {
    if (!isPro) { onUpsell?.("l'export PDF prêt à imprimer", "pro"); return }
    const fc = fcRef.current; if (!fc) return
    setExporting(true)
    try {
      prepExport(fc)
      const multiplier = FORMATS[format].exportW / fc.getWidth()
      const url = fc.toDataURL({ format: "png", multiplier })
      const w = FORMATS[format].exportW
      const h = Math.round(w / FORMATS[format].ratio)
      const { jsPDF } = await import("jspdf")
      const pdf = new jsPDF({ orientation: w > h ? "l" : "p", unit: "px", format: [w, h] })
      pdf.addImage(url, "PNG", 0, 0, w, h)
      pdf.save(`qrfolio-${format}.pdf`)
    } finally { setExporting(false) }
  }

  // ==========================================================================
  // UI
  // ==========================================================================
  const btnTool = {
    display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 4,
    width: "100%", padding: "10px 4px", background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, color: INK,
    fontSize: 9.5, cursor: "pointer",
  }
  const topBtn = (primary = false) => ({
    display: "flex", alignItems: "center", gap: 6, padding: "8px 13px",
    background: primary ? "linear-gradient(90deg,#C9A84C,#b8953f)" : "rgba(255,255,255,0.05)",
    border: primary ? "none" : "1px solid rgba(255,255,255,0.1)",
    borderRadius: 9, color: primary ? "#080808" : INK, fontSize: 12,
    fontWeight: primary ? 700 : 500, cursor: "pointer",
  })
  const layerBtn = {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
    padding: "8px", background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: INK,
    fontSize: 10, cursor: "pointer",
  }

  const canUndo = histVer >= 0 && histRef.current.i > 0
  const canRedo = histVer >= 0 && histRef.current.i < histRef.current.stack.length - 1
  const histBtn = (enabled: boolean) => ({
    display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32,
    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
    color: enabled ? INK : MUTED, cursor: enabled ? "pointer" : "not-allowed", opacity: enabled ? 1 : 0.4,
  })

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 3000, background: BG,
      display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif",
    }}>
      {/* ---- Barre du haut ---- */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
        background: SURFACE, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: G, fontWeight: 800, fontSize: 14, letterSpacing: 0.3 }}>QR Print Studio</span>
          <span style={{ color: MUTED, fontSize: 10, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 6, padding: "2px 7px", fontWeight: 700 }}>BÊTA</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Formats */}
          <div style={{ display: "flex", gap: 3, background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: 3 }}>
            {(Object.keys(FORMATS) as FormatId[]).map(f => (
              <button key={f} type="button" onClick={() => applyFormat(f)}
                style={{
                  padding: "6px 12px", borderRadius: 7, border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: format === f ? 700 : 500,
                  background: format === f ? "rgba(201,168,76,0.18)" : "transparent",
                  color: format === f ? G : MUTED,
                }}>
                {FORMATS[f].label}
              </button>
            ))}
          </div>

          <button type="button" onClick={undo} disabled={!canUndo} aria-label="Annuler" title="Annuler (Ctrl/⌘+Z)" style={histBtn(canUndo)}>
            <Undo2 size={15} />
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} aria-label="Rétablir" title="Rétablir (Ctrl/⌘+Maj+Z)" style={histBtn(canRedo)}>
            <Redo2 size={15} />
          </button>

          <button type="button" onClick={save} disabled={saving} style={topBtn(false)}>
            {saving ? <Loader2 size={13} style={{ animation: "spin 0.8s linear infinite" }} />
              : saved ? <Check size={13} color="#39FF8F" /> : <Save size={13} />}
            {saved ? "Enregistré" : "Enregistrer"}
          </button>
          <button type="button" onClick={exportPng} disabled={exporting} style={topBtn(true)}>
            <Download size={13} /> PNG
          </button>
          <button type="button" onClick={exportPdf} disabled={exporting} style={topBtn(false)}>
            <Printer size={13} /> PDF{!isPro ? " 🔒" : ""}
          </button>
          <button type="button" onClick={onClose} aria-label="Fermer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, color: MUTED, cursor: "pointer" }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* ---- Corps : rail outils | canvas | proprietes ---- */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Rail outils */}
        <div style={{ width: 92, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", padding: 12, display: "flex", flexDirection: "column", gap: 8, background: SURFACE }}>
          <button type="button" onClick={() => { setTplOpen(v => !v); setLibOpen(false) }}
            style={{ ...btnTool, background: tplOpen ? "rgba(201,168,76,0.16)" : "linear-gradient(180deg,rgba(201,168,76,0.14),rgba(201,168,76,0.05))", border: `1px solid ${tplOpen ? G : "rgba(201,168,76,0.3)"}`, color: tplOpen ? G : INK, fontWeight: 700 }}>
            <LayoutTemplate size={16} /> Modèles
          </button>
          <p style={{ color: MUTED, fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "6px 0 2px" }}>Ajouter</p>
          <button type="button" onClick={addText}   style={btnTool}><TypeIcon size={16} /> Texte</button>
          <button type="button" onClick={addQr}     style={btnTool}><QrCode size={16} /> QR</button>
          <button type="button" onClick={addRect}   style={btnTool}><Square size={16} /> Rect.</button>
          <button type="button" onClick={addCircle} style={btnTool}><CircleIcon size={16} /> Cercle</button>
          <button type="button" onClick={addLine}   style={btnTool}><Minus size={16} /> Ligne</button>
          <button type="button" onClick={() => { setLibOpen(v => !v); setTplOpen(false) }}
            style={{ ...btnTool, marginTop: 4, background: libOpen ? "rgba(201,168,76,0.16)" : "linear-gradient(180deg,rgba(201,168,76,0.12),rgba(201,168,76,0.05))", border: `1px solid ${libOpen ? G : "rgba(201,168,76,0.3)"}`, color: libOpen ? G : INK, fontWeight: 700 }}>
            <Shapes size={16} /> Éléments
          </button>
        </div>

        {/* Modeles orientes objectif (flyout) */}
        {tplOpen && (
          <div className="qr-scroll" style={{ width: 250, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", background: SURFACE, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <span style={{ color: INK, fontWeight: 800, fontSize: 12.5 }}>Modèles par objectif</span>
              <button type="button" onClick={() => setTplOpen(false)} aria-label="Fermer les modèles"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 7, color: MUTED, cursor: "pointer" }}>
                <X size={13} />
              </button>
            </div>
            <div className="qr-scroll" style={{ flex: 1, overflowY: "auto", padding: "10px 10px 16px" }}>
              {["Avis", "Menu", "Réserver", "Abonnés", "Contact", "Page"].map(obj => {
                const items = PRINT_TEMPLATES.filter(t => t.obj === obj)
                if (!items.length) return null
                return (
                  <div key={obj} style={{ marginBottom: 12 }}>
                    <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 6px" }}>{obj}</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {items.map(t => (
                        <button key={t.id} type="button" onClick={() => applyTemplate(t.id)} title={t.desc}
                          style={{ display: "flex", flexDirection: "column", gap: 5, padding: 6, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, cursor: "pointer" }}>
                          {tplThumb(t)}
                          <span style={{ color: INK, fontSize: 10, fontWeight: 700, textAlign: "center", lineHeight: 1.2 }}>{t.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              <p style={{ color: MUTED, fontSize: 9, margin: "4px 2px 0", lineHeight: 1.4 }}>
                Un modèle remplace le contenu actuel. Tout reste ensuite modifiable (textes, couleurs, position…).
              </p>
            </div>
          </div>
        )}

        {/* Bibliotheque d'elements (flyout) */}
        {libOpen && (
          <div className="qr-scroll" style={{ width: 234, flexShrink: 0, borderRight: "1px solid rgba(255,255,255,0.07)", background: SURFACE, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
              <span style={{ color: INK, fontWeight: 800, fontSize: 12.5 }}>Bibliothèque</span>
              <button type="button" onClick={() => setLibOpen(false)} aria-label="Fermer la bibliothèque"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 24, height: 24, background: "rgba(255,255,255,0.05)", border: "none", borderRadius: 7, color: MUTED, cursor: "pointer" }}>
                <X size={13} />
              </button>
            </div>

            {/* Onglets categories */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, padding: "8px 10px", flexShrink: 0 }}>
              {([
                ["cta",    "CTA",     <MousePointerClick size={12} key="i" />],
                ["icons",  "Icônes",  <Star size={12} key="i" />],
                ["badges", "Badges",  <Award size={12} key="i" />],
                ["shapes", "Formes",  <Shapes size={12} key="i" />],
                ["arrows", "Flèches", <ArrowRight size={12} key="i" />],
              ] as const).map(([id, label, icon]) => {
                const on = libCat === id
                return (
                  <button key={id} type="button" onClick={() => setLibCat(id)}
                    style={{ display: "flex", alignItems: "center", gap: 4, padding: "5px 8px", borderRadius: 7, cursor: "pointer", fontSize: 10, fontWeight: on ? 700 : 500, background: on ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)", border: `1px solid ${on ? G : "rgba(255,255,255,0.07)"}`, color: on ? G : MUTED }}>
                    {icon} {label}
                  </button>
                )
              })}
            </div>

            <div className="qr-scroll" style={{ flex: 1, overflowY: "auto", padding: "4px 10px 16px" }}>
              {/* CTA */}
              {libCat === "cta" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {["Scannez-moi", "Réservez", "Voir le menu", "Suivez-nous", "Commandez", "En savoir plus"].map(l => (
                    <button key={l} type="button" onClick={() => addCTA(l)}
                      style={{ width: "100%", padding: "11px 0", borderRadius: 22, border: "none", cursor: "pointer", background: "linear-gradient(90deg,#C9A84C,#b8953f)", color: "#080808", fontSize: 11.5, fontWeight: 800 }}>
                      {l}
                    </button>
                  ))}
                </div>
              )}
              {/* Icones */}
              {libCat === "icons" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {LIB_ICONS.map(ic => (
                    <button key={ic.key} type="button" onClick={() => addIcon(ic.d)} title={ic.label}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "9px 2px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24"><path d={ic.d} fill={INK} /></svg>
                      <span style={{ color: MUTED, fontSize: 8 }}>{ic.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {/* Badges & rubans */}
              {libCat === "badges" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {([
                    ["NOUVEAU", "ribbon"], ["-20%", "ribbon"], ["PROMO", "seal"], ["TOP", "seal"], ["VIP", "seal"],
                  ] as const).map(([l, k]) => (
                    <button key={l} type="button" onClick={() => addBadge(l, k)}
                      style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", minWidth: 54, padding: "4px 8px", background: G, color: "#080808", fontSize: 10, fontWeight: 800, borderRadius: k === "seal" ? "50%" : 4, width: k === "seal" ? 32 : "auto", height: k === "seal" ? 32 : "auto" }}>{l}</span>
                      <span style={{ color: INK, fontSize: 10.5 }}>{k === "seal" ? "Sceau rond" : "Ruban"}</span>
                    </button>
                  ))}
                </div>
              )}
              {/* Formes */}
              {libCat === "shapes" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {([
                    ["rrect", "Rectangle", <svg width="30" height="22" key="s"><rect x="2" y="3" width="26" height="16" rx="4" fill={G} /></svg>],
                    ["circle", "Cercle",   <svg width="24" height="24" key="s"><circle cx="12" cy="12" r="10" fill={G} /></svg>],
                    ["tri", "Triangle",    <svg width="26" height="24" key="s"><polygon points="13,2 24,22 2,22" fill={G} /></svg>],
                    ["star", "Étoile",     <svg width="24" height="24" viewBox="0 0 24 24" key="s"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={G} /></svg>],
                    ["hexa", "Hexagone",   <svg width="24" height="24" viewBox="0 0 24 24" key="s"><path d="M12 2l8.66 5v10L12 22 3.34 17V7z" fill={G} /></svg>],
                    ["banner", "Bandeau",  <svg width="30" height="16" key="s"><rect x="1" y="3" width="28" height="10" fill={G} /></svg>],
                  ] as const).map(([k, label, prev]) => (
                    <button key={k} type="button" onClick={() => addShape(k)} title={label}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 2px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer" }}>
                      {prev}
                      <span style={{ color: MUTED, fontSize: 8 }}>{label}</span>
                    </button>
                  ))}
                </div>
              )}
              {/* Fleches */}
              {libCat === "arrows" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {([["→", 0], ["↓", 90], ["←", 180], ["↑", 270]] as const).map(([sym, ang]) => (
                    <button key={ang} type="button" onClick={() => addArrow(ang)}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "16px 0", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, cursor: "pointer", color: G, fontSize: 22, fontWeight: 800 }}>
                      {sym}
                    </button>
                  ))}
                  <p style={{ gridColumn: "1 / 3", color: MUTED, fontSize: 9, margin: "2px 0 0", lineHeight: 1.4 }}>Astuce : fais pointer une flèche vers ton QR pour guider le scan.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Zone canvas */}
        <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#0A0907", position: "relative" }}>
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: MUTED, zIndex: 5, pointerEvents: "none" }}>
              <Loader2 size={18} style={{ animation: "spin 0.8s linear infinite" }} /> Chargement…
            </div>
          )}
          <div style={{ boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.15)", borderRadius: 4, overflow: "hidden" }}>
            <canvas ref={elRef} />
          </div>
        </div>

        {/* Panneau proprietes + calques */}
        <div className="qr-scroll" style={{ width: 264, flexShrink: 0, borderLeft: "1px solid rgba(255,255,255,0.07)", padding: 14, overflowY: "auto", background: SURFACE, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Fond du canvas */}
          <div>
            <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Fond du support</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="color" value={/^#/.test(bgColor) ? bgColor : "#FFFFFF"} onChange={e => applyBg(e.target.value)}
                style={{ width: 34, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", padding: 0 }} />
              <input value={bgColor} onChange={e => applyBg(e.target.value)}
                style={{ flex: 1, background: BG, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "7px 9px", color: INK, fontSize: 11, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
            </div>
          </div>

          {/* Proprietes de l'objet selectionne */}
          {sel ? (
            <>
              <div>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Élément sélectionné</p>

                {/* Texte du bouton / badge (groupe avec texte) */}
                {sel.label !== null && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Texte du bouton</label>
                    <input value={sel.label} onChange={e => setLabel(e.target.value)} placeholder="Votre texte"
                      style={{ width: "100%", background: BG, border: "1px solid rgba(201,168,76,0.25)", borderRadius: 7, padding: "7px 9px", color: INK, fontSize: 11, outline: "none", boxSizing: "border-box", marginBottom: 8 }} />
                    {sel.textFill !== null && (
                      <>
                        <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Couleur du texte</label>
                        <input type="color" value={/^#/.test(sel.textFill) ? sel.textFill : "#080808"}
                          onChange={e => setTextColor(e.target.value)}
                          style={{ width: 34, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", padding: 0 }} />
                      </>
                    )}
                  </div>
                )}

                {/* Couleur (fond du groupe ou objet simple) */}
                <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>{sel.isGroup ? "Couleur du fond" : "Couleur"}</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <input type="color" value={/^#/.test(sel.fill) ? sel.fill : "#C9A84C"}
                    onChange={e => setFill(e.target.value)}
                    style={{ width: 34, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", padding: 0 }} />
                  <input value={sel.fill} onChange={e => setFill(e.target.value)}
                    style={{ flex: 1, background: BG, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "7px 9px", color: INK, fontSize: 11, fontFamily: "monospace", outline: "none", boxSizing: "border-box" }} />
                </div>

                {/* Opacite */}
                <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>
                  Opacité — {Math.round(sel.opacity * 100)}%
                </label>
                <input type="range" min={0} max={1} step={0.05} value={sel.opacity}
                  onChange={e => mutate(o => o.set("opacity", parseFloat(e.target.value)))}
                  style={{ width: "100%", accentColor: G, marginBottom: 12 }} />

                {/* Texte uniquement */}
                {sel.isText && (
                  <>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Police</label>
                    <select value={sel.fontFamily}
                      onChange={e => mutate(o => (o as fabric.IText).set("fontFamily", e.target.value))}
                      style={{ width: "100%", background: BG, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "7px 9px", color: INK, fontSize: 11, outline: "none", cursor: "pointer", marginBottom: 10, boxSizing: "border-box" }}>
                      {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                    </select>

                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>
                      Taille — {sel.fontSize}px
                    </label>
                    <input type="range" min={10} max={140} step={1} value={sel.fontSize}
                      onChange={e => mutate(o => (o as fabric.IText).set("fontSize", parseInt(e.target.value)))}
                      style={{ width: "100%", accentColor: G, marginBottom: 10 }} />

                    <button type="button"
                      onClick={() => mutate(o => (o as fabric.IText).set("fontWeight", sel.bold ? "normal" : "bold"))}
                      style={{ ...layerBtn, width: "100%", background: sel.bold ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)", color: sel.bold ? G : INK, fontWeight: 700 }}>
                      Gras
                    </button>
                  </>
                )}
              </div>

              {/* Alignement sur le support */}
              <div>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Aligner sur le support</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                  {([
                    ["left", "Gauche", "v", 1.5], ["centerH", "Centre H", "v", 7], ["right", "Droite", "v", 12.5],
                    ["top", "Haut", "h", 1.5], ["centerV", "Centre V", "h", 7], ["bottom", "Bas", "h", 12.5],
                  ] as const).map(([action, label, axis, pos]) => (
                    <button key={action} type="button" onClick={() => align(action)} title={label}
                      style={{ ...layerBtn, padding: "7px" }}>
                      <svg width="16" height="16" viewBox="0 0 16 16">
                        <rect x="0.5" y="0.5" width="15" height="15" rx="2" fill="none" stroke={MUTED} strokeWidth="1" />
                        {axis === "v"
                          ? <rect x={pos} y="3" width="2" height="10" rx="1" fill={G} />
                          : <rect x="3" y={pos} width="10" height="2" rx="1" fill={G} />}
                      </svg>
                    </button>
                  ))}
                </div>
              </div>

              {/* Calques */}
              <div>
                <p style={{ color: MUTED, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 8px" }}>Calques</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  <button type="button" onClick={() => layer("front")} style={layerBtn}><ChevronUp size={12} /> Devant</button>
                  <button type="button" onClick={() => layer("back")}  style={layerBtn}><ChevronDown size={12} /> Derrière</button>
                  <button type="button" onClick={() => layer("fwd")}   style={layerBtn}>+1</button>
                  <button type="button" onClick={() => layer("bwd")}   style={layerBtn}>−1</button>
                  <button type="button" onClick={() => layer("dup")}   style={layerBtn}><Copy size={12} /> Dupliquer</button>
                  <button type="button" onClick={() => layer("lock")}  style={{ ...layerBtn, color: sel.locked ? G : INK }}>
                    {sel.locked ? <Lock size={12} /> : <Unlock size={12} />} {sel.locked ? "Verr." : "Libre"}
                  </button>
                </div>
                <button type="button" onClick={() => layer("del")}
                  style={{ ...layerBtn, width: "100%", marginTop: 6, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.2)", color: "#FF6B6B" }}>
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            </>
          ) : (
            <div style={{ color: MUTED, fontSize: 11, lineHeight: 1.6, padding: "10px 2px" }}>
              Sélectionne un élément pour modifier sa couleur, son opacité, sa position…<br /><br />
              Double-clic sur un texte pour l'éditer.<br />
              <strong style={{ color: INK }}>Suppr</strong> retire · <strong style={{ color: INK }}>Ctrl/⌘+C/V</strong> copier-coller · <strong style={{ color: INK }}>Ctrl/⌘+D</strong> dupliquer · <strong style={{ color: INK }}>Ctrl/⌘+Z</strong> annuler · <strong style={{ color: INK }}>flèches</strong> déplacer (Maj ×10).
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
