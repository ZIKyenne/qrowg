"use client"

// QR d'un lien — genere un QR code pour n'importe quelle URL (site, reseau, PDF...).
// 100% local (qr-code-styling via qrRender), sans API. Export PNG haute def + SVG.
import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Check } from "lucide-react"
import QRCanvas from "../qr-codes/QRCanvas"
import { getQRBlob, type QROptions } from "../qr-codes/qrRender"

const G = "#C9A84C"
const MUTED = "#A8A190"

// Contraste relatif (WCAG-like) pour prevenir un QR peu/pas scannable.
function lum(hex: string): number {
  const m = hex.replace("#", "").match(/.{2}/g)
  if (!m || m.length < 3) return 1
  const [r, g, b] = m.map(h => {
    const v = parseInt(h, 16) / 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contrast(a: string, b: string): number {
  const l1 = lum(a), l2 = lum(b)
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
}

const ECC_OPTS: { k: "L" | "M" | "Q" | "H"; label: string }[] = [
  { k: "L", label: "Faible" },
  { k: "M", label: "Moyen" },
  { k: "Q", label: "Élevé" },
  { k: "H", label: "Maximum" },
]

const FG_SWATCHES = ["#080808", "#C9A84C", "#1D4ED8", "#059669", "#DB2777", "#DC2626", "#7C3AED", "#0F766E"]
const BG_SWATCHES = ["#FFFFFF", "#F5F0E8", "#FEF3C7", "#E0F2FE", "#F0FDF4", "#111111"]

export default function QrLinkPage() {
  const [url, setUrl] = useState("")
  const [fg, setFg] = useState("#080808")
  const [bg, setBg] = useState("#FFFFFF")
  const [ecc, setEcc] = useState<"L" | "M" | "Q" | "H">("M")
  const [busy, setBusy] = useState<null | "png" | "svg">(null)
  const [done, setDone] = useState(false)

  const normalized = useMemo(() => {
    const v = url.trim()
    if (!v) return ""
    if (/^(https?:\/\/|mailto:|tel:|sms:|geo:|wifi:)/i.test(v)) return v
    return "https://" + v
  }, [url])

  const lowContrast = contrast(fg, bg) < 2.5
  const ready = normalized.length > 0

  async function download(ext: "png" | "svg") {
    if (!ready) return
    setBusy(ext)
    try {
      const opts: QROptions = { data: normalized, fg, bg, ecc, style: {}, size: 1024 }
      const blob = await getQRBlob(opts, ext)
      if (blob) {
        const a = document.createElement("a")
        a.href = URL.createObjectURL(blob)
        a.download = `qrcode.${ext}`
        a.click()
        URL.revokeObjectURL(a.href)
        setDone(true); setTimeout(() => setDone(false), 1800)
      }
    } finally { setBusy(null) }
  }

  const label: React.CSSProperties = { color: MUTED, fontSize: 12, fontWeight: 600, display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }
  const card: React.CSSProperties = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 16 }

  return (
    <div className="rpad" style={{ minHeight: "100dvh", maxWidth: 620, margin: "0 auto", padding: "18px 18px calc(28px + env(safe-area-inset-bottom))" }}>
      <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: MUTED, textDecoration: "none", fontSize: 13, marginBottom: 14 }}>
        <ArrowLeft size={16} /> Retour
      </Link>

      <h1 style={{ color: "#F5F0E8", fontSize: 24, fontWeight: 800, margin: "0 0 4px" }}>QR code d&apos;un lien</h1>
      <p style={{ color: MUTED, fontSize: 14, margin: "0 0 20px", lineHeight: 1.5 }}>Collez n&apos;importe quel lien — site web, réseau social, PDF… — et téléchargez son QR code, prêt à imprimer.</p>

      {/* Lien */}
      <div style={{ ...card, marginBottom: 14 }}>
        <label style={label} htmlFor="qr-url">Lien à encoder</label>
        <input id="qr-url" value={url} onChange={e => setUrl(e.target.value)} inputMode="url" autoComplete="url"
          placeholder="ex : monsite.fr  ou  instagram.com/moncompte"
          style={{ width: "100%", boxSizing: "border-box", height: 50, background: "#0A0A0A", border: `1px solid ${ready ? G + "66" : "rgba(255,255,255,0.14)"}`, borderRadius: 11, color: "#F5F0E8", fontSize: 16, padding: "0 14px", outline: "none" }} />
        {url.trim() && normalized !== url.trim() && (
          <p style={{ color: MUTED, fontSize: 11.5, margin: "8px 2px 0" }}>Sera encodé comme : <span style={{ color: G }}>{normalized}</span></p>
        )}
      </div>

      {/* Aperçu QR */}
      <div style={{ ...card, marginBottom: 14, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
        <div style={{ padding: 16, borderRadius: 16, background: bg, boxShadow: "0 6px 24px rgba(0,0,0,0.35)", transition: "background .2s" }}>
          <QRCanvas value={normalized || "https://qrfolio.app"} size={216} fg={fg} bg={bg} />
        </div>
        {!ready && <p style={{ color: MUTED, fontSize: 12, margin: 0, textAlign: "center" }}>Entrez un lien ci-dessus pour générer votre QR code.</p>}
        {ready && lowContrast && (
          <p style={{ color: "#FBBF24", fontSize: 12, margin: 0, textAlign: "center", background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 9, padding: "8px 12px" }}>
            ⚠ Contraste faible — ce QR risque de mal se scanner. Choisissez une couleur foncée sur fond clair.
          </p>
        )}
      </div>

      {/* Personnalisation */}
      <div style={{ ...card, marginBottom: 14 }}>
        <label style={label}>Couleur du QR</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}>
          {FG_SWATCHES.map(c => (
            <button key={c} onClick={() => setFg(c)} aria-label={`Couleur ${c}`}
              style={{ width: 34, height: 34, borderRadius: 9, background: c, border: fg === c ? `2px solid ${G}` : "2px solid rgba(255,255,255,0.12)", cursor: "pointer", flexShrink: 0 }} />
          ))}
          <label style={{ width: 34, height: 34, borderRadius: 9, border: "2px solid rgba(255,255,255,0.12)", cursor: "pointer", overflow: "hidden", position: "relative", flexShrink: 0, background: "conic-gradient(from 0deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}>
            <input type="color" value={fg} onChange={e => setFg(e.target.value)} style={{ position: "absolute", inset: -4, opacity: 0, cursor: "pointer" }} />
          </label>
        </div>

        <label style={{ ...label, marginTop: 16 }}>Couleur du fond</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {BG_SWATCHES.map(c => (
            <button key={c} onClick={() => setBg(c)} aria-label={`Fond ${c}`}
              style={{ width: 34, height: 34, borderRadius: 9, background: c, border: bg === c ? `2px solid ${G}` : "2px solid rgba(255,255,255,0.12)", cursor: "pointer", flexShrink: 0 }} />
          ))}
          <label style={{ width: 34, height: 34, borderRadius: 9, border: "2px solid rgba(255,255,255,0.12)", cursor: "pointer", overflow: "hidden", position: "relative", flexShrink: 0, background: "conic-gradient(from 0deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}>
            <input type="color" value={bg} onChange={e => setBg(e.target.value)} style={{ position: "absolute", inset: -4, opacity: 0, cursor: "pointer" }} />
          </label>
        </div>

        <label style={{ ...label, marginTop: 16 }}>Correction d&apos;erreur</label>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 3 }}>
          {ECC_OPTS.map(o => (
            <button key={o.k} onClick={() => setEcc(o.k)}
              style={{ flex: 1, minHeight: 40, borderRadius: 8, border: "none", cursor: "pointer", background: ecc === o.k ? G : "transparent", color: ecc === o.k ? "#080808" : MUTED, fontSize: 12.5, fontWeight: ecc === o.k ? 800 : 600 }}>{o.label}</button>
          ))}
        </div>
        <p style={{ color: MUTED, fontSize: 11, margin: "8px 2px 0", lineHeight: 1.4 }}>Plus la correction est élevée, plus le QR reste lisible s&apos;il est abîmé (utile pour l&apos;impression).</p>
      </div>

      {/* Téléchargement */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => download("png")} disabled={!ready || busy !== null}
          style={{ flex: 1, minHeight: 52, borderRadius: 12, border: "none", cursor: ready ? "pointer" : "not-allowed", background: ready ? `linear-gradient(90deg,${G},#b8953f)` : "rgba(255,255,255,0.06)", color: ready ? "#080808" : MUTED, fontSize: 15, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: ready ? "0 4px 16px rgba(201,168,76,0.3)" : "none" }}>
          {busy === "png" ? "…" : done ? <><Check size={17} /> Téléchargé</> : <><Download size={17} /> PNG (haute déf.)</>}
        </button>
        <button onClick={() => download("svg")} disabled={!ready || busy !== null}
          style={{ flexShrink: 0, minHeight: 52, padding: "0 20px", borderRadius: 12, border: `1px solid ${G}40`, cursor: ready ? "pointer" : "not-allowed", background: "rgba(201,168,76,0.08)", color: G, fontSize: 14, fontWeight: 700 }}>
          {busy === "svg" ? "…" : "SVG"}
        </button>
      </div>

      <p style={{ color: "#6E685E", fontSize: 11.5, margin: "16px 0 0", lineHeight: 1.5, textAlign: "center" }}>
        Ce QR pointe directement vers le lien. Pour un QR <strong style={{ color: MUTED }}>modifiable après impression</strong> (changer la destination sans réimprimer), utilisez plutôt <Link href="/dashboard/qr-codes" style={{ color: G }}>Créer un QR code dynamique</Link>.
      </p>
    </div>
  )
}
