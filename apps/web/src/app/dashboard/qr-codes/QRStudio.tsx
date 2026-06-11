"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  QrCode, Download, Link, Check, Lock, Pencil,
  Eye, EyeOff, ChevronRight, Scan, Clock,
  Palette, Settings, Share2, ExternalLink, Copy,
  RotateCcw, Loader
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

// ── Types ─────────────────────────────────────────────────────────────────────
type QRCode = {
  id:               string
  page_id:          string
  short_code:       string
  foreground_color: string
  background_color: string
  corner_style:     "square" | "rounded" | "dot"
  error_correction: "L" | "M" | "Q" | "H"
  total_scans:      number
  last_scan_at:     string | null
  created_at:       string
  pages: {
    id:         string
    title:      string
    slug:       string
    status:     string
    total_views: number
    updated_at: string
  } | null
}

interface Props {
  qrCodes:  QRCode[]
  userPlan: string
  appUrl:   string
}

// ── Presets ───────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: "Classic",  fg: "#080808", bg: "#FFFFFF", plan: "free" },
  { label: "Gold",     fg: "#C9A84C", bg: "#080808", plan: "free" },
  { label: "Midnight", fg: "#F5F0E8", bg: "#080808", plan: "free" },
  { label: "Neon",     fg: "#39FF8F", bg: "#0A0A0A", plan: "pro"  },
  { label: "Cobalt",   fg: "#0078D4", bg: "#FFFFFF", plan: "pro"  },
  { label: "Rose",     fg: "#FF5CA8", bg: "#1A0010", plan: "pro"  },
  { label: "Sunset",   fg: "#FF6B35", bg: "#1A0800", plan: "pro"  },
  { label: "Arctic",   fg: "#00D4FF", bg: "#001A1F", plan: "pro"  },
  { label: "Luxury",   fg: "#C9A84C", bg: "#1A1200", plan: "business" },
  { label: "Emerald",  fg: "#00C896", bg: "#001A12", plan: "business" },
  { label: "Royal",    fg: "#7B61FF", bg: "#0A0015", plan: "business" },
  { label: "Carbon",   fg: "#F5F0E8", bg: "#1A1A1A", plan: "business" },
]

const CORNER_STYLES = [
  { id: "square",  label: "Carré",  icon: "⬛" },
  { id: "rounded", label: "Arrondi", icon: "🔲" },
  { id: "dot",     label: "Points",  icon: "⚫" },
]

const EC_LEVELS = [
  { id: "L", label: "L · 7%",  desc: "Léger" },
  { id: "M", label: "M · 15%", desc: "Standard" },
  { id: "Q", label: "Q · 25%", desc: "Élevé" },
  { id: "H", label: "H · 30%", desc: "Maximum" },
]

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, business: 2 }

const G     = "#C9A84C"
const MUTED = "#8A8478"
const SURF  = "#0F0E0B"
const BG    = "#080808"

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso)
  const now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diff < 60)   return `il y a ${diff}min`
  if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`
  if (diff < 10080) return `il y a ${Math.floor(diff / 1440)}j`
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function QRStudio({ qrCodes: initialQRCodes, userPlan, appUrl }: Props) {
  const [qrCodes,    setQRCodes]    = useState<QRCode[]>(initialQRCodes)
  const [activeId,   setActiveId]   = useState<string | null>(initialQRCodes[0]?.id ?? null)
  const [activeTab,  setActiveTab]  = useState<"style" | "export">("style")
  const [fg,         setFg]         = useState("")
  const [bg,         setBg]         = useState("")
  const [corner,     setCorner]     = useState<"square"|"rounded"|"dot">("square")
  const [ecLevel,    setEcLevel]    = useState<"L"|"M"|"Q"|"H">("M")
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [copied,     setCopied]     = useState<"link"|"short"|null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const active = qrCodes.find(q => q.id === activeId) ?? null
  const qrUrl  = active ? `${appUrl}/q/${active.short_code}` : ""
  const pageUrl = active?.pages ? `${appUrl}/${active.pages.slug}` : ""

  // Charger les paramètres du QR actif
  useEffect(() => {
    if (!active) return
    setFg(active.foreground_color)
    setBg(active.background_color)
    setCorner(active.corner_style)
    setEcLevel(active.error_correction)
  }, [activeId])

  // Générer le QR code sur le canvas
  useEffect(() => {
    if (!canvasRef.current || !qrUrl) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext("2d")
    if (!ctx) return
    const img    = new Image()
    const url    = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&color=${fg.replace("#","")}&bgcolor=${bg.replace("#","")}&ecc=${ecLevel}&margin=10`
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = 400; canvas.height = 400
      ctx.clearRect(0, 0, 400, 400)
      if (corner === "rounded") {
        ctx.save()
        const r = 20
        ctx.beginPath()
        ctx.moveTo(r, 0)
        ctx.lineTo(400 - r, 0)
        ctx.quadraticCurveTo(400, 0, 400, r)
        ctx.lineTo(400, 400 - r)
        ctx.quadraticCurveTo(400, 400, 400 - r, 400)
        ctx.lineTo(r, 400)
        ctx.quadraticCurveTo(0, 400, 0, 400 - r)
        ctx.lineTo(0, r)
        ctx.quadraticCurveTo(0, 0, r, 0)
        ctx.closePath()
        ctx.clip()
      }
      ctx.drawImage(img, 0, 0, 400, 400)
      if (corner === "rounded") ctx.restore()
    }
    img.src = url
  }, [qrUrl, fg, bg, corner, ecLevel])

  // Sauvegarder la personnalisation
  const saveCustomization = useCallback(async () => {
    if (!active) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("qr_codes").update({
      foreground_color: fg,
      background_color: bg,
      corner_style:     corner,
      error_correction: ecLevel,
      updated_at:       new Date().toISOString(),
    }).eq("id", active.id)
    setQRCodes(prev => prev.map(q => q.id === active.id
      ? { ...q, foreground_color: fg, background_color: bg, corner_style: corner, error_correction: ecLevel }
      : q
    ))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [active, fg, bg, corner, ecLevel])

  function downloadPNG(size = 400) {
    const canvas = canvasRef.current
    if (!canvas) return
    if (size === 400) {
      const link = document.createElement("a")
      link.download = `qrfolio-${active?.short_code ?? "qr"}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
    } else {
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrUrl)}&color=${fg.replace("#","")}&bgcolor=${bg.replace("#","")}&ecc=${ecLevel}&margin=10`
      window.open(url, "_blank")
    }
  }

  function downloadSVG() {
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&color=${fg.replace("#","")}&bgcolor=${bg.replace("#","")}&ecc=${ecLevel}&format=svg`
    window.open(url, "_blank")
  }

  function copy(type: "link"|"short") {
    const text = type === "link" ? pageUrl : qrUrl
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  function resetColors() {
    if (!active) return
    setFg(active.foreground_color)
    setBg(active.background_color)
    setCorner(active.corner_style)
    setEcLevel(active.error_correction)
  }

  const canPro      = PLAN_RANK[userPlan] >= 1
  const canBusiness = PLAN_RANK[userPlan] >= 2

  if (qrCodes.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"80px 40px", border:"1px dashed rgba(201,168,76,0.2)", borderRadius:20 }}>
        <div style={{ width:72, height:72, borderRadius:20, margin:"0 auto 20px", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <QrCode size={32} color={G}/>
        </div>
        <h2 style={{ fontFamily:"Cormorant Garamond, serif", fontSize:24, color:"#F5F0E8", fontWeight:700, margin:"0 0 10px" }}>
          Aucun QR code
        </h2>
        <p style={{ color:MUTED, fontSize:14, lineHeight:1.7, margin:"0 0 28px" }}>
          Crée ta première page pour générer automatiquement un QR code.
        </p>
        <a href="/dashboard" style={{ background:"linear-gradient(90deg,#C9A84C,#b8953f)", color:"#080808", textDecoration:"none", fontSize:14, fontWeight:700, padding:"14px 28px", borderRadius:10, display:"inline-block" }}>
          Créer ma première page →
        </a>
      </div>
    )
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns:"280px 1fr 300px", gap:0, height:"calc(100vh - 140px)", background:BG, borderRadius:16, border:"1px solid rgba(201,168,76,0.1)", overflow:"hidden", fontFamily:"DM Sans, sans-serif" }}>

      {/* ── COL 1 : Liste QR Codes ──────────────────────────────────────────── */}
      <div style={{ borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        <div style={{ padding:"16px 16px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          <p style={{ color:MUTED, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>
            Mes QR Codes ({qrCodes.length})
          </p>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {qrCodes.map(qr => {
            const page    = qr.pages
            const isActive = qr.id === activeId
            const published = page?.status === "published"

            return (
              <div key={qr.id} onClick={() => setActiveId(qr.id)}
                style={{ padding:"12px 14px", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.04)", background: isActive ? "rgba(201,168,76,0.07)" : "transparent", borderLeft: isActive ? `2px solid ${G}` : "2px solid transparent", transition:"all 0.15s" }}>

                <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
                  {/* Mini QR preview color swatch */}
                  <div style={{ width:36, height:36, borderRadius:8, background:qr.background_color, border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <QrCode size={18} color={qr.foreground_color}/>
                  </div>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:3 }}>
                      <span style={{ color: isActive ? "#F5F0E8" : "#D4CFC7", fontSize:12, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {page?.title ?? "Page sans titre"}
                      </span>
                    </div>

                    <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background: published ? "#39FF8F" : MUTED }}/>
                        <span style={{ color:MUTED, fontSize:10 }}>{published ? "Publié" : "Brouillon"}</span>
                      </div>
                      <span style={{ color:MUTED, fontSize:10 }}>·</span>
                      <div style={{ display:"flex", alignItems:"center", gap:3 }}>
                        <Scan size={9} color={MUTED}/>
                        <span style={{ color: qr.total_scans > 0 ? G : MUTED, fontSize:10, fontWeight: qr.total_scans > 0 ? 700 : 400 }}>
                          {qr.total_scans}
                        </span>
                      </div>
                    </div>

                    <div style={{ display:"flex", alignItems:"center", gap:3, marginTop:3 }}>
                      <Clock size={9} color={MUTED}/>
                      <span style={{ color:MUTED, fontSize:9 }}>
                        {qr.last_scan_at ? formatDate(qr.last_scan_at) : "Jamais scanné"}
                      </span>
                    </div>
                  </div>

                  {isActive && <ChevronRight size={13} color={G}/>}
                </div>

                {/* Actions rapides inline */}
                {isActive && (
                  <div style={{ display:"flex", gap:5, marginTop:8, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.05)" }}>
                    <a href={`/dashboard/builder/${page?.id}`}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"5px", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:7, color:G, fontSize:10, fontWeight:600, textDecoration:"none" }}>
                      <Pencil size={10}/> Modifier
                    </a>
                    <button type="button" onClick={e => { e.stopPropagation(); downloadPNG(400) }}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"5px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, color:MUTED, fontSize:10, cursor:"pointer" }}>
                      <Download size={10}/> PNG
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── COL 2 : Preview centrale ────────────────────────────────────────── */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px", gap:24, background:"#0A0907" }}>
        {active ? (
          <>
            {/* QR Card */}
            <div style={{ position:"relative", padding:24, borderRadius:24, background:bg, boxShadow:`0 0 0 1px rgba(201,168,76,0.2), 0 20px 60px rgba(0,0,0,0.8), 0 0 80px rgba(201,168,76,0.06)`, transition:"background 0.3s" }}>
              {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h], i) => (
                <div key={i} style={{ position:"absolute", [v]:10, [h]:10, width:14, height:14,
                  borderTop:    v==="top"    ? `2px solid rgba(201,168,76,0.6)` : "none",
                  borderBottom: v==="bottom" ? `2px solid rgba(201,168,76,0.6)` : "none",
                  borderLeft:   h==="left"   ? `2px solid rgba(201,168,76,0.6)` : "none",
                  borderRight:  h==="right"  ? `2px solid rgba(201,168,76,0.6)` : "none",
                }}/>
              ))}
              <canvas ref={canvasRef} width={400} height={400}
                style={{ display:"block", width:240, height:240, imageRendering:"pixelated" }}/>
            </div>

            {/* Page title */}
            <div style={{ textAlign:"center" }}>
              <p style={{ color:"#F5F0E8", fontSize:16, fontWeight:700, margin:"0 0 4px" }}>
                {active.pages?.title}
              </p>
              <p style={{ color:MUTED, fontSize:11, margin:0 }}>
                {appUrl}/q/{active.short_code}
              </p>
            </div>

            {/* Stats */}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, width:"100%", maxWidth:360 }}>
              {[
                { label:"Scans",      value:active.total_scans.toLocaleString(), color:G },
                { label:"Vues page",  value:(active.pages?.total_views ?? 0).toLocaleString(), color:"#39FF8F" },
                { label:"Dernier",    value:formatDate(active.last_scan_at), color:MUTED },
              ].map((s, i) => (
                <div key={i} style={{ background:SURF, border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"10px 12px", textAlign:"center" }}>
                  <p style={{ color:s.color, fontSize:16, fontWeight:800, margin:"0 0 2px" }}>{s.value}</p>
                  <p style={{ color:MUTED, fontSize:10, textTransform:"uppercase", letterSpacing:1, margin:0 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Créé le */}
            <p style={{ color:MUTED, fontSize:11 }}>
              Créé le {new Date(active.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}
            </p>
          </>
        ) : (
          <p style={{ color:MUTED }}>Sélectionne un QR code</p>
        )}
      </div>

      {/* ── COL 3 : Personnalisation + Export ──────────────────────────────── */}
      <div style={{ borderLeft:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
          {([["style","Style","🎨"],["export","Export","📤"]] as const).map(([id, label, emoji]) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              style={{ flex:1, padding:"12px 8px", background: activeTab===id ? "rgba(201,168,76,0.06)" : "transparent", border:"none", borderBottom: activeTab===id ? `2px solid ${G}` : "2px solid transparent", color: activeTab===id ? G : MUTED, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <span>{emoji}</span>{label}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
          {activeTab === "style" && active && (
            <div style={{ display:"flex", flexDirection:"column", gap:18 }}>

              {/* Couleurs */}
              <div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                  <p style={{ color:MUTED, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>Couleurs</p>
                  <button type="button" onClick={resetColors}
                    style={{ background:"none", border:"none", color:MUTED, cursor:"pointer", display:"flex", alignItems:"center", gap:3, fontSize:10 }}>
                    <RotateCcw size={10}/> Reset
                  </button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {[
                    { label:"QR Code", val:fg, set:setFg },
                    { label:"Fond",    val:bg, set:setBg },
                  ].map(c => (
                    <div key={c.label}>
                      <label style={{ color:MUTED, fontSize:11, display:"block", marginBottom:5 }}>{c.label}</label>
                      <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                        <div style={{ position:"relative", width:32, height:32, borderRadius:7, overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)", flexShrink:0 }}>
                          <input type="color" value={c.val} onChange={e => c.set(e.target.value)}
                            style={{ position:"absolute", inset:-4, width:"calc(100% + 8px)", height:"calc(100% + 8px)", cursor:"pointer", border:"none" }}/>
                        </div>
                        <input type="text" value={c.val} onChange={e => c.set(e.target.value)}
                          style={{ flex:1, background:"#111009", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"6px 8px", color:"#F5F0E8", fontSize:11, fontFamily:"monospace", outline:"none" }}/>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Coins */}
              <div>
                <p style={{ color:MUTED, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Style des coins</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
                  {CORNER_STYLES.map(cs => (
                    <button key={cs.id} type="button" onClick={() => setCorner(cs.id as any)}
                      style={{ padding:"8px 6px", background: corner===cs.id ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.03)", border: `1px solid ${corner===cs.id ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius:8, color: corner===cs.id ? G : MUTED, fontSize:10, fontWeight: corner===cs.id ? 700 : 500, cursor:"pointer", textAlign:"center" as const }}>
                      <div style={{ fontSize:16, marginBottom:3 }}>{cs.icon}</div>
                      {cs.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Correction */}
              <div>
                <p style={{ color:MUTED, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>
                  Correction d'erreur {!canPro && <span style={{ color:"#FF6B6B", fontSize:9 }}>· Pro</span>}
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  {EC_LEVELS.map(ec => {
                    const locked = ec.id !== "L" && ec.id !== "M" && !canPro
                    return (
                      <button key={ec.id} type="button" onClick={() => !locked && setEcLevel(ec.id as any)} disabled={locked}
                        style={{ position:"relative", padding:"7px 8px", background: ecLevel===ec.id ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.02)", border:`1px solid ${ecLevel===ec.id ? "rgba(201,168,76,0.35)" : "rgba(255,255,255,0.07)"}`, borderRadius:8, color: locked ? MUTED : ecLevel===ec.id ? G : "#F5F0E8", fontSize:10, cursor:locked?"not-allowed":"pointer", opacity:locked?0.5:1, textAlign:"center" as const }}>
                        <div style={{ fontWeight:700, marginBottom:1 }}>{ec.label}</div>
                        <div style={{ color:MUTED, fontSize:9 }}>{ec.desc}</div>
                        {locked && <Lock size={9} color={MUTED} style={{ position:"absolute", top:4, right:4 }}/>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Presets */}
              <div>
                <p style={{ color:MUTED, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Presets</p>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:6 }}>
                  {PRESETS.map(preset => {
                    const canAccess = PLAN_RANK[userPlan] >= PLAN_RANK[preset.plan]
                    const isActive  = fg === preset.fg && bg === preset.bg
                    return (
                      <div key={preset.label} onClick={() => { if (canAccess) { setFg(preset.fg); setBg(preset.bg) } }}
                        style={{ position:"relative", cursor:canAccess?"pointer":"not-allowed", borderRadius:8, overflow:"hidden", border:`1.5px solid ${isActive?"#C9A84C":"rgba(255,255,255,0.07)"}`, opacity:canAccess?1:0.45, transition:"all 0.15s" }}>
                        <div style={{ background:preset.bg, padding:"8px 6px", display:"flex", justifyContent:"center" }}>
                          <div style={{ width:22, height:22, borderRadius:5, background:`linear-gradient(135deg,${preset.fg} 50%,${preset.bg} 50%)`, border:`1px solid ${preset.fg}40` }}/>
                        </div>
                        <div style={{ background:"#111009", padding:"4px 2px", textAlign:"center" as const }}>
                          <p style={{ color: isActive?G:"#F5F0E8", fontSize:9, fontWeight:600, margin:0 }}>{preset.label}</p>
                        </div>
                        {!canAccess && (
                          <div style={{ position:"absolute", inset:0, background:"rgba(8,8,8,0.6)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <Lock size={12} color={MUTED}/>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Bouton sauvegarder */}
              <button type="button" onClick={saveCustomization} disabled={saving}
                style={{ padding:"11px", background: saved ? "rgba(57,255,143,0.12)" : "linear-gradient(90deg,#C9A84C,#b8953f)", border: saved ? "1px solid rgba(57,255,143,0.3)" : "none", borderRadius:10, color: saved ? "#39FF8F" : "#080808", fontSize:13, fontWeight:700, cursor:saving?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, opacity:saving?0.7:1, transition:"all 0.2s" }}>
                {saving ? <><Loader size={13} style={{ animation:"spin 0.8s linear infinite" }}/> Enregistrement…</>
                  : saved  ? <><Check size={13}/> Sauvegardé !</>
                  : <><Palette size={13}/> Enregistrer le style</>}
              </button>
            </div>
          )}

          {activeTab === "export" && active && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

              {/* Liens */}
              <div>
                <p style={{ color:MUTED, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Liens</p>
                {[
                  { label:"Lien de scan", val:qrUrl,   type:"short" as const, icon:<Link size={12}/> },
                  { label:"Lien de page",  val:pageUrl, type:"link"  as const, icon:<ExternalLink size={12}/> },
                ].map(l => (
                  <div key={l.type} style={{ marginBottom:8 }}>
                    <label style={{ color:MUTED, fontSize:10, display:"block", marginBottom:4 }}>{l.label}</label>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <code style={{ flex:1, background:"#111009", border:"1px solid rgba(255,255,255,0.07)", borderRadius:7, padding:"7px 9px", color:G, fontSize:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {l.val}
                      </code>
                      <button type="button" onClick={() => copy(l.type)}
                        style={{ width:28, height:28, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color: copied===l.type ? "#39FF8F" : MUTED, flexShrink:0 }}>
                        {copied === l.type ? <Check size={11}/> : <Copy size={11}/>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Téléchargements */}
              <div>
                <p style={{ color:MUTED, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Télécharger</p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  <button type="button" onClick={() => downloadPNG(400)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", border:"none", borderRadius:9, color:"#080808", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    <Download size={13}/> PNG 400×400
                  </button>
                  <button type="button" onClick={() => downloadPNG(1200)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background: canPro ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)", border:`1px solid ${canPro?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.07)"}`, borderRadius:9, color: canPro?G:MUTED, fontSize:12, cursor:canPro?"pointer":"not-allowed" }}>
                    {!canPro && <Lock size={12}/>}
                    <Download size={13}/> HD 1200×1200 {!canPro && "· Pro"}
                  </button>
                  <button type="button" onClick={() => canPro && downloadSVG()}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background: canPro ? "rgba(57,255,143,0.08)" : "rgba(255,255,255,0.03)", border:`1px solid ${canPro?"rgba(57,255,143,0.25)":"rgba(255,255,255,0.07)"}`, borderRadius:9, color: canPro?"#39FF8F":MUTED, fontSize:12, cursor:canPro?"pointer":"not-allowed" }}>
                    {!canPro && <Lock size={12}/>}
                    <Share2 size={13}/> SVG Vectoriel {!canPro && "· Pro"}
                  </button>
                </div>
              </div>

              {/* Partage */}
              <div>
                <p style={{ color:MUTED, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Voir la page</p>
                <a href={pageUrl} target="_blank" rel="noopener noreferrer"
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:9, color:MUTED, fontSize:12, textDecoration:"none" }}>
                  <ExternalLink size={13}/> Ouvrir {active.pages?.slug}
                </a>
              </div>

              {/* Upgrade CTA */}
              {!canPro && (
                <div style={{ marginTop:8, padding:"12px 14px", background:"rgba(201,168,76,0.05)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:10 }}>
                  <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:600, margin:"0 0 5px" }}>🔓 Débloquer les exports HD</p>
                  <p style={{ color:MUTED, fontSize:11, margin:"0 0 10px" }}>PNG 1200px, SVG vectoriel, tous les presets</p>
                  <a href="/dashboard/upgrade" style={{ display:"inline-block", background:"linear-gradient(90deg,#C9A84C,#b8953f)", color:"#080808", textDecoration:"none", fontSize:11, fontWeight:700, padding:"6px 14px", borderRadius:7 }}>
                    Passer Pro →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
