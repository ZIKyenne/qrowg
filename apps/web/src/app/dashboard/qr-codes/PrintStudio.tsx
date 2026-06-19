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

// ---- Props -----------------------------------------------------------------
type Props = {
  qrId: string
  qrDataUrl: string
  userPlan: string
  onClose: () => void
  onUpsell?: (feature: string, plan: string) => void
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
} | null

const TOJSON_PROPS = [
  "isQR",
  "lockMovementX", "lockMovementY",
  "lockScalingX", "lockScalingY",
  "lockRotation", "selectable", "evented",
]

export default function PrintStudio({ qrId, qrDataUrl, userPlan, onClose, onUpsell }: Props) {
  const elRef   = useRef<HTMLCanvasElement>(null)
  const fcRef   = useRef<fabric.Canvas | null>(null)
  const qrUrlRef = useRef(qrDataUrl)
  const vGuideRef = useRef<fabric.Line | null>(null)
  const hGuideRef = useRef<fabric.Line | null>(null)

  const [format, setFormat]   = useState<FormatId>("a4")
  const [sel, setSel]         = useState<SelState>(null)
  const [bgColor, setBgColor] = useState(CANVAS_BG_DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [saved, setSaved]     = useState(false)
  const [exporting, setExporting] = useState(false)

  const isPro = userPlan === "pro" || userPlan === "business"

  // ---- Lecture d'un objet -> etat de selection -----------------------------
  const readSel = useCallback((o: fabric.Object | undefined | null): SelState => {
    if (!o) return null
    const isText = o.type === "i-text" || o.type === "text" || o.type === "textbox"
    const t = o as any
    return {
      isText,
      fill: typeof o.fill === "string" ? o.fill : "#C9A84C",
      opacity: o.opacity ?? 1,
      fontFamily: isText ? (t.fontFamily ?? "Georgia") : "Georgia",
      fontSize: isText ? (t.fontSize ?? 40) : 40,
      bold: isText ? (t.fontWeight === "bold" || t.fontWeight === 700) : false,
      locked: !!o.lockMovementX,
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
          fc.loadFromJSON(json.design, () => {
            // remettre les guides au-dessus apres rechargement
            fc.add(vG); fc.add(hG)
            const bgc = (fc.backgroundColor as string) || CANVAS_BG_DEFAULT
            setBgColor(typeof bgc === "string" ? bgc : CANVAS_BG_DEFAULT)
            fc.requestRenderAll()
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

  // ---- Suppression au clavier ----------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return
      const fc = fcRef.current; if (!fc) return
      const o = fc.getActiveObject()
      if (o && !(o as any).isEditing) {
        e.preventDefault()
        fc.remove(o); fc.discardActiveObject(); fc.requestRenderAll(); setSel(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

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

  // ---- Mutation de l'objet actif -------------------------------------------
  const mutate = (fn: (o: fabric.Object) => void) => {
    const fc = fcRef.current; if (!fc) return
    const o = fc.getActiveObject(); if (!o) return
    fn(o)
    fc.requestRenderAll()
    refreshSel()
  }

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
          <p style={{ color: MUTED, fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, margin: "0 0 2px" }}>Ajouter</p>
          <button type="button" onClick={addText}   style={btnTool}><TypeIcon size={16} /> Texte</button>
          <button type="button" onClick={addQr}     style={btnTool}><QrCode size={16} /> QR</button>
          <button type="button" onClick={addRect}   style={btnTool}><Square size={16} /> Rect.</button>
          <button type="button" onClick={addCircle} style={btnTool}><CircleIcon size={16} /> Cercle</button>
          <button type="button" onClick={addLine}   style={btnTool}><Minus size={16} /> Ligne</button>
        </div>

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

                {/* Couleur */}
                <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Couleur</label>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <input type="color" value={/^#/.test(sel.fill) ? sel.fill : "#C9A84C"}
                    onChange={e => mutate(o => o.set("fill", e.target.value))}
                    style={{ width: 34, height: 30, borderRadius: 7, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", cursor: "pointer", padding: 0 }} />
                  <input value={sel.fill} onChange={e => mutate(o => o.set("fill", e.target.value))}
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
              Double-clic sur un texte pour l'éditer. Touche <strong style={{ color: INK }}>Suppr</strong> pour retirer l'élément sélectionné.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
