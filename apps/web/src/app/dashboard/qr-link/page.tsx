"use client"

// QR d'un lien — genere un QR code pour n'importe quelle URL (site, reseau, PDF...).
// 100% local (qr-code-styling via qrRender), sans API. Export PNG haute def + SVG.
import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Check, QrCode as QrIcon, ShieldCheck, AlertTriangle } from "lucide-react"
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

  const ratio = contrast(fg, bg)
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

  const secTitle: React.CSSProperties = { color: MUTED, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 7, marginBottom: 11, textTransform: "uppercase", letterSpacing: 1.4 }
  const accentBar = <span style={{ width: 3, height: 13, borderRadius: 2, background: G, flexShrink: 0 }} />
  const card: React.CSSProperties = { background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 18, padding: 18 }
  const swatch = (c: string, on: boolean, onClick: () => void, aria: string) => (
    <button key={c} onClick={onClick} aria-label={aria}
      style={{ width: 38, height: 38, borderRadius: 11, background: c, border: on ? `2.5px solid ${G}` : "2px solid rgba(255,255,255,0.14)", boxShadow: on ? `0 0 0 3px ${G}22` : "none", cursor: "pointer", flexShrink: 0, transition: "all .15s" }} />
  )

  return (
    <div className="rpad" style={{ minHeight: "100dvh", maxWidth: 640, margin: "0 auto", padding: "18px 18px calc(30px + env(safe-area-inset-bottom))" }}>
      <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: MUTED, textDecoration: "none", fontSize: 13, marginBottom: 16 }}>
        <ArrowLeft size={16} /> Retour
      </Link>

      {/* En-tête premium */}
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 22 }}>
        <div style={{ width: 50, height: 50, borderRadius: 14, flexShrink: 0, background: "linear-gradient(145deg,rgba(201,168,76,0.22),rgba(201,168,76,0.06))", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <QrIcon size={24} color={G} />
        </div>
        <div>
          <h1 style={{ color: "#F5F0E8", fontSize: 23, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>QR code d&apos;un lien</h1>
          <p style={{ color: MUTED, fontSize: 13, margin: "2px 0 0", lineHeight: 1.4 }}>Site, réseau, PDF… un QR prêt à imprimer en 3 secondes.</p>
        </div>
      </div>

      {/* Lien */}
      <div style={{ ...card, marginBottom: 14 }}>
        <p style={secTitle}>{accentBar} Lien à encoder</p>
        <input id="qr-url" value={url} onChange={e => setUrl(e.target.value)} inputMode="url" autoComplete="url"
          placeholder="ex : monsite.fr  ou  instagram.com/moncompte"
          style={{ width: "100%", boxSizing: "border-box", height: 52, background: "#0A0A0A", border: `1px solid ${ready ? G + "80" : "rgba(255,255,255,0.14)"}`, borderRadius: 12, color: "#F5F0E8", fontSize: 16, padding: "0 15px", outline: "none", transition: "border-color .15s" }} />
        {url.trim() && normalized !== url.trim() && (
          <p style={{ color: MUTED, fontSize: 11.5, margin: "9px 2px 0" }}>Encodé comme : <span style={{ color: G, fontWeight: 600 }}>{normalized}</span></p>
        )}
      </div>

      {/* Aperçu — poster QR */}
      <div style={{ position: "relative", borderRadius: 20, padding: "26px 18px", marginBottom: 14, overflow: "hidden", background: "radial-gradient(120% 90% at 50% 0%, rgba(201,168,76,0.12), transparent 60%), rgba(255,255,255,0.02)", border: "1px solid rgba(201,168,76,0.16)", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {/* La "carte" QR (surface = couleur de fond choisie) */}
        <div style={{ background: bg, borderRadius: 20, padding: 20, boxShadow: "0 14px 40px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, transition: "background .2s", maxWidth: "100%" }}>
          <QRCanvas value={normalized || "https://qrfolio.app"} size={210} fg={fg} bg={bg} />
          {ready && (
            <p style={{ margin: 0, maxWidth: 210, color: fg, opacity: 0.85, fontSize: 10.5, fontWeight: 600, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", letterSpacing: 0.2 }}>
              {normalized.replace(/^https?:\/\//, "")}
            </p>
          )}
        </div>

        {!ready
          ? <p style={{ color: MUTED, fontSize: 12.5, margin: 0, textAlign: "center" }}>Entrez un lien ci-dessus pour générer votre QR code.</p>
          : ratio < 2.5
            ? <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#FBBF24", fontSize: 12, fontWeight: 600, background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)", borderRadius: 999, padding: "6px 14px" }}>
                <AlertTriangle size={14} /> Contraste faible — risque de mal se scanner
              </div>
            : <div style={{ display: "flex", alignItems: "center", gap: 7, color: "#39FF8F", fontSize: 12, fontWeight: 600, background: "rgba(57,255,143,0.09)", border: "1px solid rgba(57,255,143,0.28)", borderRadius: 999, padding: "6px 14px" }}>
                <ShieldCheck size={14} /> Scannable
              </div>}
      </div>

      {/* Personnalisation */}
      <div style={{ ...card, marginBottom: 14 }}>
        <p style={secTitle}>{accentBar} Couleur du QR</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 4 }}>
          {FG_SWATCHES.map(c => swatch(c, fg === c, () => setFg(c), `Couleur ${c}`))}
          <label style={{ width: 38, height: 38, borderRadius: 11, border: "2px solid rgba(255,255,255,0.14)", cursor: "pointer", overflow: "hidden", position: "relative", flexShrink: 0, background: "conic-gradient(from 0deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}>
            <input type="color" value={fg} onChange={e => setFg(e.target.value)} style={{ position: "absolute", inset: -4, opacity: 0, cursor: "pointer" }} />
          </label>
        </div>

        <p style={{ ...secTitle, marginTop: 20 }}>{accentBar} Couleur du fond</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
          {BG_SWATCHES.map(c => swatch(c, bg === c, () => setBg(c), `Fond ${c}`))}
          <label style={{ width: 38, height: 38, borderRadius: 11, border: "2px solid rgba(255,255,255,0.14)", cursor: "pointer", overflow: "hidden", position: "relative", flexShrink: 0, background: "conic-gradient(from 0deg,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)" }}>
            <input type="color" value={bg} onChange={e => setBg(e.target.value)} style={{ position: "absolute", inset: -4, opacity: 0, cursor: "pointer" }} />
          </label>
        </div>

        <p style={{ ...secTitle, marginTop: 20 }}>{accentBar} Correction d&apos;erreur</p>
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.04)", borderRadius: 11, padding: 3 }}>
          {ECC_OPTS.map(o => (
            <button key={o.k} onClick={() => setEcc(o.k)}
              style={{ flex: 1, minHeight: 42, borderRadius: 8, border: "none", cursor: "pointer", background: ecc === o.k ? G : "transparent", color: ecc === o.k ? "#080808" : MUTED, fontSize: 12.5, fontWeight: ecc === o.k ? 800 : 600, transition: "all .15s" }}>{o.label}</button>
          ))}
        </div>
        <p style={{ color: MUTED, fontSize: 11, margin: "9px 2px 0", lineHeight: 1.45 }}>Plus la correction est élevée, plus le QR reste lisible s&apos;il est abîmé (utile pour l&apos;impression).</p>
      </div>

      {/* Téléchargement */}
      <div style={{ display: "flex", gap: 10 }}>
        <button onClick={() => download("png")} disabled={!ready || busy !== null}
          style={{ flex: 1, minHeight: 54, borderRadius: 14, border: "none", cursor: ready ? "pointer" : "not-allowed", background: ready ? `linear-gradient(90deg,${G},#b8953f)` : "rgba(255,255,255,0.06)", color: ready ? "#080808" : MUTED, fontSize: 15.5, fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: ready ? "0 6px 20px rgba(201,168,76,0.32)" : "none", transition: "all .15s" }}>
          {busy === "png" ? "…" : done ? <><Check size={18} /> Téléchargé</> : <><Download size={18} /> Télécharger PNG</>}
        </button>
        <button onClick={() => download("svg")} disabled={!ready || busy !== null}
          style={{ flexShrink: 0, minHeight: 54, padding: "0 22px", borderRadius: 14, border: `1px solid ${G}45`, cursor: ready ? "pointer" : "not-allowed", background: "rgba(201,168,76,0.08)", color: ready ? G : MUTED, fontSize: 14, fontWeight: 700 }}>
          {busy === "svg" ? "…" : "SVG"}
        </button>
      </div>

      <p style={{ color: "#6E685E", fontSize: 11.5, margin: "18px 0 0", lineHeight: 1.55, textAlign: "center" }}>
        Ce QR pointe directement vers le lien. Pour pouvoir <strong style={{ color: MUTED }}>changer la destination sans réimprimer</strong>, créez plutôt un <Link href="/dashboard/qr-codes" style={{ color: G, fontWeight: 600 }}>QR code dynamique</Link>.
      </p>
    </div>
  )
}
