"use client"

import { useEffect, useRef, useState } from "react"
import { Download, Link, Check, Lock } from "lucide-react"

type Props = {
  value: string
  shortCode: string
  totalScans?: number
  pageTitle?: string
  userPlan?: string
}

const PRESETS = [
  { label: "Classic",   fg: "#080808", bg: "#FFFFFF", plan: "free" },
  { label: "Gold",      fg: "#C9A84C", bg: "#080808", plan: "free" },
  { label: "Midnight",  fg: "#F5F0E8", bg: "#080808", plan: "free" },
  { label: "Neon",      fg: "#39FF8F", bg: "#0A0A0A", plan: "pro" },
  { label: "Cobalt",    fg: "#0078D4", bg: "#FFFFFF", plan: "pro" },
  { label: "Rose",      fg: "#FF5CA8", bg: "#1A0010", plan: "pro" },
  { label: "Sunset",    fg: "#FF6B35", bg: "#1A0800", plan: "pro" },
  { label: "Arctic",    fg: "#00D4FF", bg: "#001A1F", plan: "pro" },
  { label: "Luxury",    fg: "#C9A84C", bg: "#1A1200", plan: "business" },
  { label: "Emerald",   fg: "#00C896", bg: "#001A12", plan: "business" },
  { label: "Royal",     fg: "#7B61FF", bg: "#0A0015", plan: "business" },
  { label: "Carbon",    fg: "#F5F0E8", bg: "#1A1A1A", plan: "business" },
]

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, business: 2 }

export default function QRCustomizer({ value, shortCode, totalScans = 0, pageTitle = "", userPlan = "free" }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fgColor, setFgColor] = useState("#080808")
  const [bgColor, setBgColor] = useState("#FFFFFF")
  const [copied, setCopied] = useState(false)
  const [activePreset, setActivePreset] = useState("Classic")

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const img = new Image()
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(value)}&color=${fgColor.replace("#","")}&bgcolor=${bgColor.replace("#","")}&format=png&qzone=1`
    img.onload = () => { canvas.width = 240; canvas.height = 240; ctx.drawImage(img, 0, 0, 240, 240) }
    img.crossOrigin = "anonymous"
    img.src = qrUrl
  }, [value, fgColor, bgColor])

  function applyPreset(preset: typeof PRESETS[0]) {
    const canAccess = PLAN_RANK[userPlan] >= PLAN_RANK[preset.plan]
    if (!canAccess) return
    setFgColor(preset.fg)
    setBgColor(preset.bg)
    setActivePreset(preset.label)
  }

  function downloadPNG() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `qrfolio-${shortCode}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  function downloadHD() {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=1200x1200&data=${encodeURIComponent(value)}&color=${fgColor.replace("#","")}&bgcolor=${bgColor.replace("#","")}&format=png&qzone=2`
    window.open(url, "_blank")
  }

  function copyLink() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const planBadgeColor: Record<string, string> = { free: "#8A8478", pro: "#C9A84C", business: "#39FF8F" }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 40, alignItems: "start" }}>

      {/* ── Left: QR Preview ── */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
        {/* QR Card */}
        <div style={{
          position: "relative", padding: 20, borderRadius: 20,
          background: bgColor,
          boxShadow: `0 0 0 1px rgba(201,168,76,0.2), 0 8px 40px rgba(0,0,0,0.6), 0 0 60px rgba(201,168,76,0.08)`,
          transition: "box-shadow 0.3s"
        }}>
          <canvas ref={canvasRef} width={240} height={240} style={{ display: "block", width: 200, height: 200, borderRadius: 8 }} />
          {/* Corner decorations */}
          {["top-left","top-right","bottom-left","bottom-right"].map(pos => (
            <div key={pos} style={{
              position: "absolute",
              top: pos.includes("top") ? 8 : "auto",
              bottom: pos.includes("bottom") ? 8 : "auto",
              left: pos.includes("left") ? 8 : "auto",
              right: pos.includes("right") ? 8 : "auto",
              width: 12, height: 12,
              borderTop: pos.includes("top") ? `2px solid rgba(201,168,76,0.6)` : "none",
              borderBottom: pos.includes("bottom") ? `2px solid rgba(201,168,76,0.6)` : "none",
              borderLeft: pos.includes("left") ? `2px solid rgba(201,168,76,0.6)` : "none",
              borderRight: pos.includes("right") ? `2px solid rgba(201,168,76,0.6)` : "none",
            }} />
          ))}
        </div>

        {/* Scan counter */}
        <div style={{
          background: "#111009", border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: 12, padding: "12px 24px", textAlign: "center", width: "100%"
        }}>
          <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "#C9A84C", fontWeight: 700, margin: 0, lineHeight: 1 }}>
            {totalScans.toLocaleString()}
          </p>
          <p style={{ color: "#8A8478", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "4px 0 0" }}>Scans totaux</p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%" }}>
          <button onClick={downloadPNG} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            background: "linear-gradient(90deg, #C9A84C, #b8953f)",
            border: "none", borderRadius: 10, padding: "11px",
            color: "#080808", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%"
          }}>
            <Download size={14} /> Télécharger PNG
          </button>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button onClick={downloadHD} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: "transparent", border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: 10, padding: "9px", color: "#C9A84C", fontSize: 12, cursor: "pointer"
            }}>
              <Download size={12} /> HD Print
            </button>
            <button onClick={copyLink} style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              background: copied ? "rgba(57,255,143,0.1)" : "transparent",
              border: `1px solid ${copied ? "rgba(57,255,143,0.4)" : "rgba(255,255,255,0.1)"}`,
              borderRadius: 10, padding: "9px",
              color: copied ? "#39FF8F" : "#8A8478", fontSize: 12, cursor: "pointer",
              transition: "all 0.2s"
            }}>
              {copied ? <Check size={12} /> : <Link size={12} />}
              {copied ? "Copié !" : "Lien"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Right: Customization ── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

        {/* URL */}
        <div style={{
          background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: 10, padding: "12px 16px"
        }}>
          <p style={{ color: "#8A8478", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 4px" }}>URL du QR Code</p>
          <p style={{ color: "#C9A84C", fontSize: 13, fontFamily: "monospace", margin: 0, wordBreak: "break-all" }}>{value}</p>
        </div>

        {/* Couleurs custom */}
        <div>
          <p style={{ color: "#8A8478", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 12px" }}>Couleurs personnalisées</p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Couleur QR", value: fgColor, onChange: setFgColor },
              { label: "Fond", value: bgColor, onChange: setBgColor },
            ].map(c => (
              <div key={c.label}>
                <label style={{ color: "#8A8478", fontSize: 12, display: "block", marginBottom: 6 }}>{c.label}</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div style={{ position: "relative", width: 36, height: 36, borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", flexShrink: 0 }}>
                    <input type="color" value={c.value} onChange={e => c.onChange(e.target.value)}
                      style={{ position: "absolute", inset: -4, width: "calc(100% + 8px)", height: "calc(100% + 8px)", cursor: "pointer", border: "none", padding: 0 }} />
                  </div>
                  <input type="text" value={c.value} onChange={e => c.onChange(e.target.value)}
                    style={{
                      flex: 1, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)",
                      borderRadius: 8, padding: "8px 10px", color: "#F5F0E8",
                      fontSize: 13, fontFamily: "monospace", outline: "none"
                    }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Presets */}
        <div>
          <p style={{ color: "#8A8478", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 12px" }}>Presets de couleurs</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {PRESETS.map(preset => {
              const canAccess = PLAN_RANK[userPlan] >= PLAN_RANK[preset.plan]
              const isActive = activePreset === preset.label
              const badgeColor = planBadgeColor[preset.plan]
              return (
                <div key={preset.label} onClick={() => applyPreset(preset)}
                  style={{
                    position: "relative", cursor: canAccess ? "pointer" : "not-allowed",
                    borderRadius: 10, overflow: "hidden",
                    border: `2px solid ${isActive ? "#C9A84C" : "rgba(255,255,255,0.08)"}`,
                    transition: "all 0.2s",
                    opacity: canAccess ? 1 : 0.5,
                    transform: isActive ? "scale(1.04)" : "scale(1)",
                  }}
                >
                  {/* Color swatch */}
                  <div style={{ background: preset.bg, padding: "10px 8px", display: "flex", justifyContent: "center" }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 6,
                      background: `linear-gradient(135deg, ${preset.fg} 50%, ${preset.bg} 50%)`,
                      border: `1px solid ${preset.fg}40`
                    }} />
                  </div>
                  {/* Label */}
                  <div style={{ background: "#111009", padding: "6px 4px", textAlign: "center" }}>
                    <p style={{ color: isActive ? "#C9A84C" : "#F5F0E8", fontSize: 11, fontWeight: 600, margin: 0 }}>{preset.label}</p>
                    {preset.plan !== "free" && (
                      <p style={{ color: badgeColor, fontSize: 9, textTransform: "uppercase", letterSpacing: 1, margin: "2px 0 0" }}>{preset.plan}</p>
                    )}
                  </div>
                  {/* Lock overlay */}
                  {!canAccess && (
                    <div style={{
                      position: "absolute", inset: 0, background: "rgba(8,8,8,0.6)",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                      <Lock size={16} color="#8A8478" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          {userPlan === "free" && (
            <div style={{
              marginTop: 12, background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)",
              borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", justifyContent: "space-between"
            }}>
              <p style={{ color: "#8A8478", fontSize: 12, margin: 0 }}>🔒 Débloquer tous les presets</p>
              <a href="/upgrade" style={{
                background: "linear-gradient(90deg, #C9A84C, #b8953f)", color: "#080808",
                textDecoration: "none", fontSize: 11, fontWeight: 700,
                padding: "5px 12px", borderRadius: 6
              }}>Passer Pro</a>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
