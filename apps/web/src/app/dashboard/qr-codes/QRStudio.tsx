"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  QrCode, Download, Link, Check, Lock, Pencil,
  Eye, EyeOff, ChevronRight, Scan, Clock,
  Palette, Settings, Share2, ExternalLink, Copy,
  RotateCcw, Loader, Search, Trash2, Archive,
  MoreVertical, AlertTriangle, X
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type QRCode = {
  id:               string
  page_id:          string
  short_code:       string
  foreground_color: string
  background_color: string
  corner_style:     "square" | "rounded" | "dot"
  error_correction: "L" | "M" | "Q" | "H"
  style_config:     Record<string, any>
  logo_url:         string | null
  total_scans:      number
  last_scan_at:     string | null
  created_at:       string
  pages: {
    id:          string
    title:       string
    slug:        string
    status:      string
    total_views: number
    updated_at:  string
  } | null
}

interface Props {
  qrCodes:  QRCode[]
  userPlan: string
  appUrl:   string
}

// ── QR Style Config type ─────────────────────────────────────────────────────
type QRStyleConfig = {
  fg2?:          string    // couleur secondaire (dégradé)
  cornerColor?:  string    // couleur des coins
  eyeColor?:     string    // couleur des yeux (centres)
  transparent?:  boolean   // fond transparent
  gradient?:     "none"|"linear"|"radial"|"diagonal"
  gradientBg?:   string    // couleur fin de dégradé fond
  dotStyle?:     "square"|"rounded"|"dot"|"softSquare"|"pixel"|"minimal"|"neon"|"luxury"
  cornerStyle?:  "square"|"rounded"|"circle"|"diamond"|"luxury"|"minimal"
  margin?:       number    // 0–30
  density?:      "low"|"medium"|"high"
  logoUrl?:      string    // data URL ou URL Supabase
  logoSize?:     number    // % du QR, 10-30, défaut 18
  logoShape?:    "square"|"rounded"|"circle"
  logoBg?:       "transparent"|"white"|"black"|"custom"
  logoBgColor?:  string
  logoPadding?:  number    // px, 0-12, défaut 4
}

const DOT_STYLES: { id: QRStyleConfig["dotStyle"]; label: string; emoji: string }[] = [
  { id:"square",     label:"Classique",    emoji:"⬛" },
  { id:"rounded",    label:"Arrondi",      emoji:"🔵" },
  { id:"dot",        label:"Dots",         emoji:"⚫" },
  { id:"softSquare", label:"Carres doux",  emoji:"🟦" },
  { id:"pixel",      label:"Pixel",        emoji:"🟧" },
  { id:"minimal",    label:"Minimal",      emoji:"▪️" },
  { id:"neon",       label:"Neon",         emoji:"💜" },
  { id:"luxury",     label:"Luxury",       emoji:"✨" },
]

const CORNER_STYLE_LIST: { id: QRStyleConfig["cornerStyle"]; label: string }[] = [
  { id:"square",   label:"Carre"   },
  { id:"rounded",  label:"Arrondi" },
  { id:"circle",   label:"Cercle"  },
  { id:"diamond",  label:"Diamond" },
  { id:"luxury",   label:"Luxury"  },
  { id:"minimal",  label:"Minimal" },
]

const GRADIENT_OPTS: { id: QRStyleConfig["gradient"]; label: string }[] = [
  { id:"none",     label:"Aucun"    },
  { id:"linear",   label:"Lineaire" },
  { id:"radial",   label:"Radial"   },
  { id:"diagonal", label:"Diagonal" },
]

const DEFAULT_STYLE: QRStyleConfig = {
  fg2: "", cornerColor: "", eyeColor: "", transparent: false,
  gradient: "none", gradientBg: "", dotStyle: "square",
  cornerStyle: "square", margin: 10, density: "medium",
  logoUrl: "", logoSize: 18, logoShape: "rounded",
  logoBg: "white", logoBgColor: "#FFFFFF", logoPadding: 4,
}

// ── Bibliothèque de presets premium ──────────────────────────────────────────
type Preset = {
  id:       string
  label:    string
  cat:      string
  fg:       string
  bg:       string
  fg2?:     string
  corner?:  string
  eye?:     string
  gradient?: "none"|"linear"|"radial"|"diagonal"
  dotStyle?: string
  cornerStyle?: string
  plan:     string
}

const PRESET_CATS = [
  { id:"all",        label:"Tous",       emoji:"✦" },
  { id:"classic",    label:"Classic",    emoji:"⬛" },
  { id:"business",   label:"Business",   emoji:"💼" },
  { id:"luxury",     label:"Luxury",     emoji:"✨" },
  { id:"restaurant", label:"Restaurant", emoji:"🍽" },
  { id:"nightlife",  label:"Nightlife",  emoji:"🌙" },
  { id:"creator",    label:"Creator",    emoji:"🎨" },
  { id:"realestate", label:"Immobilier", emoji:"🏠" },
  { id:"event",      label:"Event",      emoji:"🎉" },
  { id:"minimal",    label:"Minimal",    emoji:"▪️" },
  { id:"neon",       label:"Neon",       emoji:"💜" },
]

const PRESETS: Preset[] = [
  // ── Classic ────────────────────────────────────────────────────────────────
  { id:"classic-black",   label:"Classic Black",  cat:"classic",    fg:"#080808", bg:"#FFFFFF", plan:"free"     },
  { id:"midnight-gold",   label:"Midnight Gold",  cat:"classic",    fg:"#C9A84C", bg:"#080808", plan:"free"     },
  { id:"snow-white",      label:"Snow White",     cat:"classic",    fg:"#1A1A1A", bg:"#F8F8F8", plan:"free"     },

  // ── Business ───────────────────────────────────────────────────────────────
  { id:"emerald-biz",     label:"Emerald Biz",    cat:"business",   fg:"#00C896", bg:"#001A12", plan:"pro"      },
  { id:"cobalt-pro",      label:"Cobalt Pro",     cat:"business",   fg:"#0078D4", bg:"#FFFFFF", plan:"pro"      },
  { id:"slate-corp",      label:"Slate Corp",     cat:"business",   fg:"#64748B", bg:"#F1F5F9", plan:"pro"      },
  { id:"tech-matrix",     label:"Tech Matrix",    cat:"business",   fg:"#00FF41", bg:"#0D0D0D", dotStyle:"dot",  plan:"pro" },

  // ── Luxury ─────────────────────────────────────────────────────────────────
  { id:"luxury-gold",     label:"Luxury Gold",    cat:"luxury",     fg:"#C9A84C", bg:"#1A1200", plan:"business" },
  { id:"royal-purple",    label:"Royal Purple",   cat:"luxury",     fg:"#7B61FF", bg:"#0A0015", plan:"business" },
  { id:"carbon-fiber",    label:"Carbon Fiber",   cat:"luxury",     fg:"#F5F0E8", bg:"#1A1A1A", plan:"business" },
  { id:"champagne",       label:"Champagne",      cat:"luxury",     fg:"#D4AF37", bg:"#FAF7F0", gradient:"linear", fg2:"#B8960C", plan:"business" },
  { id:"obsidian",        label:"Obsidian",       cat:"luxury",     fg:"#C0C0C0", bg:"#0A0A0A", cornerStyle:"rounded", plan:"business" },

  // ── Restaurant ─────────────────────────────────────────────────────────────
  { id:"restaurant-red",  label:"Restaurant Red", cat:"restaurant", fg:"#E63946", bg:"#FFF8F8", plan:"free"     },
  { id:"coffee-brown",    label:"Coffee Brown",   cat:"restaurant", fg:"#6B3F2A", bg:"#FDF6EE", plan:"free"     },
  { id:"bistro-noir",     label:"Bistro Noir",    cat:"restaurant", fg:"#2D2D2D", bg:"#F5F0E0", plan:"pro"      },
  { id:"saffron-spice",   label:"Saffron Spice",  cat:"restaurant", fg:"#FF9500", bg:"#1A0D00", gradient:"radial", fg2:"#FF6B00", plan:"pro" },

  // ── Nightlife ──────────────────────────────────────────────────────────────
  { id:"cocktail-sunset", label:"Cocktail Sunset",cat:"nightlife",  fg:"#FF6B35", bg:"#1A0800", gradient:"linear", fg2:"#FF0080", plan:"pro" },
  { id:"velvet-night",    label:"Velvet Night",   cat:"nightlife",  fg:"#FF2D78", bg:"#0D0008", plan:"pro"      },
  { id:"arctic-blue",     label:"Arctic Blue",    cat:"nightlife",  fg:"#00D4FF", bg:"#001A1F", plan:"pro"      },
  { id:"festival-purple", label:"Festival Purple",cat:"nightlife",  fg:"#BF5FFF", bg:"#0D0020", gradient:"radial", fg2:"#FF2D78", plan:"business" },

  // ── Creator ────────────────────────────────────────────────────────────────
  { id:"beauty-rose",     label:"Beauty Rose",    cat:"creator",    fg:"#FF5CA8", bg:"#1A0010", plan:"pro"      },
  { id:"creator-coral",   label:"Creator Coral",  cat:"creator",    fg:"#FF6B6B", bg:"#FFF5F5", plan:"pro"      },
  { id:"retro-amber",     label:"Retro Amber",    cat:"creator",    fg:"#FFAA00", bg:"#1A0F00", dotStyle:"rounded", plan:"pro" },
  { id:"wedding-cream",   label:"Wedding Cream",  cat:"creator",    fg:"#C9A84C", bg:"#FFFFF0", cornerStyle:"rounded", plan:"business" },

  // ── Immobilier ─────────────────────────────────────────────────────────────
  { id:"navy-realestate", label:"Real Estate Navy",cat:"realestate", fg:"#1B3A5C", bg:"#F0F4F8", plan:"pro"     },
  { id:"forest-green",    label:"Forest Green",   cat:"realestate", fg:"#2D6A4F", bg:"#F0F7F4", plan:"pro"      },
  { id:"marble-luxe",     label:"Marble Luxe",    cat:"realestate", fg:"#8B7355", bg:"#FAFAFA",  cornerStyle:"rounded", plan:"business" },

  // ── Event ──────────────────────────────────────────────────────────────────
  { id:"event-gold",      label:"Event Gold",     cat:"event",      fg:"#FFD700", bg:"#0D0D00", gradient:"radial", fg2:"#FF8C00", plan:"pro" },
  { id:"confetti",        label:"Confetti",       cat:"event",      fg:"#FF2D78", bg:"#FFF0F5", dotStyle:"dot",  plan:"pro"      },

  // ── Minimal ────────────────────────────────────────────────────────────────
  { id:"minimal-ink",     label:"Minimal Ink",    cat:"minimal",    fg:"#1A1A1A", bg:"#FAFAFA", plan:"free"     },
  { id:"minimal-gray",    label:"Minimal Gray",   cat:"minimal",    fg:"#6B7280", bg:"#F9FAFB", cornerStyle:"rounded", plan:"free" },

  // ── Neon ───────────────────────────────────────────────────────────────────
  { id:"neon-green",      label:"Neon Green",     cat:"neon",       fg:"#39FF8F", bg:"#0A0A0A", plan:"pro"      },
  { id:"neon-pink",       label:"Neon Pink",      cat:"neon",       fg:"#FF2D78", bg:"#0D0008", dotStyle:"dot",  plan:"pro"      },
  { id:"neon-cyber",      label:"Neon Cyber",     cat:"neon",       fg:"#00FFFF", bg:"#001A1A", gradient:"linear", fg2:"#7B61FF", plan:"business" },
]

const CORNER_STYLES = [
  { id: "square",  label: "Carre",   icon: "⬛" },
  { id: "rounded", label: "Arrondi", icon: "🔲" },
  { id: "dot",     label: "Points",  icon: "⚫" },
]

const EC_LEVELS = [
  { id: "L", label: "L 7%",  desc: "Leger" },
  { id: "M", label: "M 15%", desc: "Standard" },
  { id: "Q", label: "Q 25%", desc: "Eleve" },
  { id: "H", label: "H 30%", desc: "Maximum" },
]

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, business: 2 }

const STATUS_CFG: Record<string, { label: string; dot: string; badge: string; text: string }> = {
  published: { label: "Publie",    dot: "#39FF8F", badge: "rgba(57,255,143,0.12)",  text: "#39FF8F" },
  draft:     { label: "Brouillon", dot: "#8A8478", badge: "rgba(138,132,120,0.12)", text: "#8A8478" },
  archived:  { label: "Archive",   dot: "#F97316", badge: "rgba(249,115,22,0.12)",  text: "#F97316" },
  paused:    { label: "En pause",  dot: "#FF6B6B", badge: "rgba(255,107,107,0.12)", text: "#FF6B6B" },
}

const PLAN_BADGE: Record<string, { color: string; label: string } | null> = {
  free: null, pro: { color: "#C9A84C", label: "PRO" }, business: { color: "#39FF8F", label: "BIZ" },
}

const G     = "#C9A84C"
const MUTED = "#8A8478"
const SURF  = "#0F0E0B"
const BG    = "#080808"

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  const d = new Date(iso), now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diff < 60)   return `il y a ${diff}min`
  if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`
  if (diff < 10080) return `il y a ${Math.floor(diff / 1440)}j`
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

export default function QRStudio({ qrCodes: initialQRCodes, userPlan, appUrl }: Props) {
  const [qrCodes,    setQRCodes]    = useState<QRCode[]>(initialQRCodes)
  const [activeId,   setActiveId]   = useState<string | null>(initialQRCodes[0]?.id ?? null)
  const [activeTab,  setActiveTab]  = useState<"style" | "export">("style")
  const [fg,         setFg]         = useState("")
  const [bg,         setBg]         = useState("")
  const [corner,     setCorner]     = useState<"square"|"rounded"|"dot">("square")
  const [ecLevel,    setEcLevel]    = useState<"L"|"M"|"Q"|"H">("M")
  const [styleConf,  setStyleConf]  = useState<QRStyleConfig>({ ...DEFAULT_STYLE })
  const [styleTab,   setStyleTab]   = useState<"colors"|"logo"|"style"|"corners"|"advanced">("colors")
  const [applyAllOk,   setApplyAllOk]   = useState(false)
  const [selectedCat,  setSelectedCat]  = useState("all")
  const [upsellPreset, setUpsellPreset] = useState<string | null>(null)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [copied,     setCopied]     = useState<"link"|"short"|null>(null)
  const [search,     setSearch]     = useState("")
  const [filterSt,   setFilterSt]   = useState("all")
  const [sortKey,    setSortKey]    = useState("date-desc")
  const [menuId,     setMenuId]     = useState<string | null>(null)
  const [confirmId,  setConfirmId]  = useState<string | null>(null)
  const [archivingId,setArchivingId]= useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copyQRId,   setCopyQRId]   = useState<string | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [diagFg,     setDiagFg]     = useState("")
  const [diagBg,     setDiagBg]     = useState("")
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const canvasRef      = useRef<HTMLCanvasElement>(null)
  const canvasModalRef = useRef<HTMLCanvasElement>(null)

  const active  = qrCodes.find(q => q.id === activeId) ?? null
  const qrUrl   = active ? `${appUrl}/q/${active.short_code}` : ""
  const pageUrl = active?.pages ? `${appUrl}/${active.pages.slug}` : ""

  useEffect(() => {
    if (!active) return
    setFg(active.foreground_color)
    setBg(active.background_color)
    setCorner(active.corner_style)
    setEcLevel(active.error_correction)
    const sc = { ...DEFAULT_STYLE, ...(active.style_config ?? {}) }
    // Initialiser logoUrl depuis style_config ou logo_url de la page
    if (!sc.logoUrl && active.logo_url) sc.logoUrl = active.logo_url
    setStyleConf(sc)
  }, [activeId])

  // Construire l'URL QR en tenant compte du style_config
  // ECC forcé H si logo actif (logo masque des modules QR)
  const effectiveEcc = styleConf.logoUrl ? "H" : ecLevel

  function buildQRUrl(size: number): string {
    const fgHex = fg.replace("#","")
    const bgHex = styleConf.transparent ? "ffffff00" : bg.replace("#","")
    const margin = styleConf.margin ?? 10
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrUrl)}&color=${fgHex}&bgcolor=${bgHex}&ecc=${effectiveEcc}&margin=${margin}`
  }

  useEffect(() => {
    if (!canvasRef.current || !qrUrl) return
    const canvas = canvasRef.current
    const ctx    = canvas.getContext("2d")
    if (!ctx) return
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = 400; canvas.height = 400
      ctx.clearRect(0, 0, 400, 400)

      // Fond (dégradé ou uni)
      if (!styleConf.transparent) {
        if (styleConf.gradient !== "none" && styleConf.gradientBg) {
          let grad: CanvasGradient
          if (styleConf.gradient === "radial") {
            grad = ctx.createRadialGradient(200,200,0,200,200,200)
          } else if (styleConf.gradient === "diagonal") {
            grad = ctx.createLinearGradient(0,0,400,400)
          } else {
            grad = ctx.createLinearGradient(0,0,0,400)
          }
          grad.addColorStop(0, bg)
          grad.addColorStop(1, styleConf.gradientBg)
          ctx.fillStyle = grad
          ctx.fillRect(0,0,400,400)
        } else {
          ctx.fillStyle = bg
          ctx.fillRect(0,0,400,400)
        }
      }

      // Coins arrondis
      if (corner === "rounded") {
        ctx.save(); const r = 20
        ctx.beginPath(); ctx.moveTo(r,0)
        ctx.lineTo(400-r,0); ctx.quadraticCurveTo(400,0,400,r)
        ctx.lineTo(400,400-r); ctx.quadraticCurveTo(400,400,400-r,400)
        ctx.lineTo(r,400); ctx.quadraticCurveTo(0,400,0,400-r)
        ctx.lineTo(0,r); ctx.quadraticCurveTo(0,0,r,0)
        ctx.closePath(); ctx.clip()
      }

      // Dégradé sur le QR
      if (styleConf.gradient !== "none" && styleConf.fg2) {
        ctx.globalCompositeOperation = "source-over"
        let grad: CanvasGradient
        if (styleConf.gradient === "radial") {
          grad = ctx.createRadialGradient(200,200,0,200,200,200)
        } else if (styleConf.gradient === "diagonal") {
          grad = ctx.createLinearGradient(0,0,400,400)
        } else {
          grad = ctx.createLinearGradient(0,0,0,400)
        }
        grad.addColorStop(0, fg)
        grad.addColorStop(1, styleConf.fg2)
        // Dessin QR puis colorisation
        ctx.drawImage(img,0,0,400,400)
        ctx.globalCompositeOperation = "multiply"
        ctx.fillStyle = grad
        ctx.fillRect(0,0,400,400)
        ctx.globalCompositeOperation = "source-over"
      } else {
        ctx.drawImage(img,0,0,400,400)
      }

      if (corner === "rounded") ctx.restore()

      // ── Dessin du logo central ───────────────────────────────────────
      if (styleConf.logoUrl) {
        const logoImg  = new Image()
        logoImg.crossOrigin = "anonymous"
        logoImg.onload = () => {
          const pct      = (styleConf.logoSize ?? 18) / 100
          const maxRatio = 0.30  // jamais > 30% du QR
          const ratio    = Math.min(pct, maxRatio)
          const size     = canvas.width * ratio
          const pad      = styleConf.logoPadding ?? 4
          const cx       = canvas.width  / 2
          const cy       = canvas.height / 2
          const bgSize   = size + pad * 2
          const r        = styleConf.logoShape === "circle"
                             ? bgSize / 2
                             : styleConf.logoShape === "rounded"
                             ? bgSize * 0.2
                             : 0
          // Fond du conteneur
          if (styleConf.logoBg !== "transparent") {
            ctx.save()
            ctx.beginPath()
            if (r > 0) {
              ctx.moveTo(cx - bgSize/2 + r, cy - bgSize/2)
              ctx.lineTo(cx + bgSize/2 - r, cy - bgSize/2)
              ctx.quadraticCurveTo(cx + bgSize/2, cy - bgSize/2, cx + bgSize/2, cy - bgSize/2 + r)
              ctx.lineTo(cx + bgSize/2, cy + bgSize/2 - r)
              ctx.quadraticCurveTo(cx + bgSize/2, cy + bgSize/2, cx + bgSize/2 - r, cy + bgSize/2)
              ctx.lineTo(cx - bgSize/2 + r, cy + bgSize/2)
              ctx.quadraticCurveTo(cx - bgSize/2, cy + bgSize/2, cx - bgSize/2, cy + bgSize/2 - r)
              ctx.lineTo(cx - bgSize/2, cy - bgSize/2 + r)
              ctx.quadraticCurveTo(cx - bgSize/2, cy - bgSize/2, cx - bgSize/2 + r, cy - bgSize/2)
              ctx.closePath()
            } else {
              ctx.rect(cx - bgSize/2, cy - bgSize/2, bgSize, bgSize)
            }
            ctx.fillStyle = styleConf.logoBg === "custom"
              ? (styleConf.logoBgColor ?? "#FFFFFF")
              : styleConf.logoBg === "black" ? "#000000" : "#FFFFFF"
            ctx.fill()
            ctx.restore()
          }
          // Clipping pour le logo
          ctx.save()
          ctx.beginPath()
          if (styleConf.logoShape === "circle") {
            ctx.arc(cx, cy, size / 2, 0, Math.PI * 2)
          } else if (styleConf.logoShape === "rounded") {
            const rr = size * 0.2
            ctx.moveTo(cx - size/2 + rr, cy - size/2)
            ctx.lineTo(cx + size/2 - rr, cy - size/2)
            ctx.quadraticCurveTo(cx + size/2, cy - size/2, cx + size/2, cy - size/2 + rr)
            ctx.lineTo(cx + size/2, cy + size/2 - rr)
            ctx.quadraticCurveTo(cx + size/2, cy + size/2, cx + size/2 - rr, cy + size/2)
            ctx.lineTo(cx - size/2 + rr, cy + size/2)
            ctx.quadraticCurveTo(cx - size/2, cy + size/2, cx - size/2, cy + size/2 - rr)
            ctx.lineTo(cx - size/2, cy - size/2 + rr)
            ctx.quadraticCurveTo(cx - size/2, cy - size/2, cx - size/2 + rr, cy - size/2)
            ctx.closePath()
          } else {
            ctx.rect(cx - size/2, cy - size/2, size, size)
          }
          ctx.clip()
          ctx.drawImage(logoImg, cx - size/2, cy - size/2, size, size)
          ctx.restore()
        }
        logoImg.src = styleConf.logoUrl
      }
    }
    img.src = buildQRUrl(400)
  }, [qrUrl, fg, bg, corner, ecLevel, styleConf, showModal])

  async function archiveQR(id: string) {
    setArchivingId(id)
    const sb = createClient()
    const pid = qrCodes.find(q => q.id === id)?.page_id ?? ""
    if (pid) await sb.from("pages").update({ status: "archived" }).eq("id", pid)
    setQRCodes(prev => prev.map(q => q.id === id
      ? { ...q, pages: q.pages ? { ...q.pages, status: "archived" } : null } : q))
    setArchivingId(null); setMenuId(null)
  }

  async function deleteQR(id: string) {
    setDeletingId(id)
    const sb = createClient()
    await sb.from("qr_codes").delete().eq("id", id)
    const rest = qrCodes.filter(q => q.id !== id)
    setQRCodes(rest)
    if (activeId === id) setActiveId(rest[0]?.id ?? null)
    setDeletingId(null); setConfirmId(null); setMenuId(null)
  }

  function copyQRLink(id: string, url: string) {
    navigator.clipboard.writeText(url).catch(() => {})
    setCopyQRId(id); setTimeout(() => setCopyQRId(null), 2000)
  }

  // ── Calcul contraste WCAG ─────────────────────────────────────────────────
  function hexToRgb(hex: string): [number,number,number] {
    const h = hex.replace("#","")
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)]
  }
  function relativeLuminance(r:number,g:number,b:number): number {
    const c = [r,g,b].map(v => { const s=v/255; return s<=0.03928?s/12.92:Math.pow((s+0.055)/1.055,2.4) })
    return 0.2126*c[0]+0.7152*c[1]+0.0722*c[2]
  }
  function contrastRatio(hex1:string, hex2:string): number {
    const [r1,g1,b1] = hexToRgb(hex1)
    const [r2,g2,b2] = hexToRgb(hex2)
    const l1 = relativeLuminance(r1,g1,b1)
    const l2 = relativeLuminance(r2,g2,b2)
    const lMax = Math.max(l1,l2), lMin = Math.min(l1,l2)
    return (lMax+0.05)/(lMin+0.05)
  }
  function getDiagnostic(fgHex:string, bgHex:string) {
    if (!fgHex || !bgHex) return null
    const ratio   = contrastRatio(fgHex, bgHex)
    const percent = Math.min(100, Math.round(((ratio-1)/(21-1))*100))
    let readability: "Excellente"|"Bonne"|"Moyenne"|"Risquee"
    let readColor:   string
    if (ratio >= 7)    { readability = "Excellente"; readColor = "#39FF8F" }
    else if (ratio >= 4.5) { readability = "Bonne";  readColor = "#C9A84C" }
    else if (ratio >= 3)   { readability = "Moyenne"; readColor = "#F97316" }
    else                   { readability = "Risquee"; readColor = "#FF6B6B" }
    const minSize = ratio >= 7 ? "15mm" : ratio >= 4.5 ? "20mm" : ratio >= 3 ? "25mm" : "30mm+"
    return { ratio: ratio.toFixed(1), percent, readability, readColor, minSize,
      warnContrast: ratio < 3, warnLow: ratio < 4.5 }
  }

  // Canvas modal plein écran
  const drawModalCanvas = useCallback(() => {
    if (!canvasModalRef.current || !qrUrl) return
    const canvas = canvasModalRef.current
    const ctx    = canvas.getContext("2d"); if (!ctx) return
    const img    = new Image()
    const url    = buildQRUrl(800)
    img.crossOrigin = "anonymous"
    img.onload = () => {
      canvas.width = 800; canvas.height = 800
      ctx.clearRect(0, 0, 800, 800)
      // Fond
      if (!styleConf.transparent) {
        if (styleConf.gradient !== "none" && styleConf.gradientBg) {
          const grad = styleConf.gradient === "radial"
            ? ctx.createRadialGradient(400,400,0,400,400,400)
            : ctx.createLinearGradient(styleConf.gradient==="diagonal"?0:0, 0, styleConf.gradient==="diagonal"?800:0, 800)
          grad.addColorStop(0, bg); grad.addColorStop(1, styleConf.gradientBg)
          ctx.fillStyle = grad
        } else { ctx.fillStyle = bg }
        ctx.fillRect(0, 0, 800, 800)
      }
      // QR dégradé
      if (styleConf.gradient !== "none" && styleConf.fg2) {
        ctx.drawImage(img, 0, 0, 800, 800)
        const grad = styleConf.gradient === "radial"
          ? ctx.createRadialGradient(400,400,0,400,400,400)
          : ctx.createLinearGradient(styleConf.gradient==="diagonal"?0:0, 0, styleConf.gradient==="diagonal"?800:0, 800)
        grad.addColorStop(0, fg); grad.addColorStop(1, styleConf.fg2)
        ctx.globalCompositeOperation = "multiply"
        ctx.fillStyle = grad; ctx.fillRect(0, 0, 800, 800)
        ctx.globalCompositeOperation = "source-over"
      } else {
        ctx.drawImage(img, 0, 0, 800, 800)
      }
      // Logo
      if (styleConf.logoUrl) {
        const logoImg = new Image(); logoImg.crossOrigin = "anonymous"
        logoImg.onload = () => {
          const ratio = Math.min((styleConf.logoSize ?? 18) / 100, 0.30)
          const size  = 800 * ratio; const pad = (styleConf.logoPadding ?? 4) * 2
          const bgSz  = size + pad; const cx = 400; const cy = 400
          const r = styleConf.logoShape === "circle" ? bgSz/2 : styleConf.logoShape === "rounded" ? bgSz*0.2 : 0
          if (styleConf.logoBg !== "transparent") {
            ctx.save(); ctx.beginPath()
            if (r > 0) {
              ctx.moveTo(cx-bgSz/2+r, cy-bgSz/2); ctx.lineTo(cx+bgSz/2-r, cy-bgSz/2)
              ctx.quadraticCurveTo(cx+bgSz/2, cy-bgSz/2, cx+bgSz/2, cy-bgSz/2+r)
              ctx.lineTo(cx+bgSz/2, cy+bgSz/2-r)
              ctx.quadraticCurveTo(cx+bgSz/2, cy+bgSz/2, cx+bgSz/2-r, cy+bgSz/2)
              ctx.lineTo(cx-bgSz/2+r, cy+bgSz/2)
              ctx.quadraticCurveTo(cx-bgSz/2, cy+bgSz/2, cx-bgSz/2, cy+bgSz/2-r)
              ctx.lineTo(cx-bgSz/2, cy-bgSz/2+r)
              ctx.quadraticCurveTo(cx-bgSz/2, cy-bgSz/2, cx-bgSz/2+r, cy-bgSz/2)
              ctx.closePath()
            } else { ctx.rect(cx-bgSz/2, cy-bgSz/2, bgSz, bgSz) }
            ctx.fillStyle = styleConf.logoBg==="custom"?(styleConf.logoBgColor??"#FFF"):styleConf.logoBg==="black"?"#000":"#FFF"
            ctx.fill(); ctx.restore()
          }
          ctx.save(); ctx.beginPath()
          if (styleConf.logoShape==="circle") { ctx.arc(cx, cy, size/2, 0, Math.PI*2) }
          else if (styleConf.logoShape==="rounded") {
            const rr=size*0.2; ctx.moveTo(cx-size/2+rr,cy-size/2); ctx.lineTo(cx+size/2-rr,cy-size/2)
            ctx.quadraticCurveTo(cx+size/2,cy-size/2,cx+size/2,cy-size/2+rr); ctx.lineTo(cx+size/2,cy+size/2-rr)
            ctx.quadraticCurveTo(cx+size/2,cy+size/2,cx+size/2-rr,cy+size/2); ctx.lineTo(cx-size/2+rr,cy+size/2)
            ctx.quadraticCurveTo(cx-size/2,cy+size/2,cx-size/2,cy+size/2-rr); ctx.lineTo(cx-size/2,cy-size/2+rr)
            ctx.quadraticCurveTo(cx-size/2,cy-size/2,cx-size/2+rr,cy-size/2); ctx.closePath()
          } else { ctx.rect(cx-size/2, cy-size/2, size, size) }
          ctx.clip(); ctx.drawImage(logoImg, cx-size/2, cy-size/2, size, size); ctx.restore()
        }
        logoImg.src = styleConf.logoUrl
      }
    }
    img.src = url
  }, [qrUrl, fg, bg, corner, ecLevel, styleConf])

  useEffect(() => { if (showModal) drawModalCanvas() }, [showModal, drawModalCanvas])
  useEffect(() => { setDiagFg(fg); setDiagBg(bg) }, [fg, bg])

  const saveCustomization = useCallback(async () => {
    if (!active) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("qr_codes").update({
      foreground_color: fg, background_color: bg,
      corner_style: corner, error_correction: ecLevel,
      style_config: styleConf,
      updated_at: new Date().toISOString(),
    }).eq("id", active.id)
    setQRCodes(prev => prev.map(q => q.id === active.id
      ? { ...q, foreground_color: fg, background_color: bg, corner_style: corner, error_correction: ecLevel, style_config: styleConf }
      : q))
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }, [active, fg, bg, corner, ecLevel, styleConf])

  function downloadPNG(size = 400) {
    if (size === 400) {
      const canvas = canvasRef.current; if (!canvas) return
      const link = document.createElement("a")
      link.download = `qrfolio-${active?.short_code ?? "qr"}.png`
      link.href = canvas.toDataURL("image/png"); link.click()
    } else {
      window.open(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(qrUrl)}&color=${fg.replace("#","")}&bgcolor=${bg.replace("#","")}&ecc=${ecLevel}&margin=10`, "_blank")
    }
  }

  function downloadSVG() {
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&color=${fg.replace("#","")}&bgcolor=${bg.replace("#","")}&ecc=${ecLevel}&format=svg`, "_blank")
  }

  function copy(type: "link"|"short") {
    navigator.clipboard.writeText(type === "link" ? pageUrl : qrUrl).catch(() => {})
    setCopied(type); setTimeout(() => setCopied(null), 2000)
  }

  function resetColors() {
    if (!active) return
    setFg(active.foreground_color); setBg(active.background_color)
    setCorner(active.corner_style); setEcLevel(active.error_correction)
    setStyleConf({ ...DEFAULT_STYLE, ...(active.style_config ?? {}) })
    setUpsellPreset(null)
    setSelectedCat("all")
  }

  // Upload logo → Supabase Storage OU data URL si pas encore uploadé
  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) return
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo trop volumineux (max 2 Mo)")
      return
    }
    setLogoUploading(true)
    try {
      // Convertir en data URL pour preview immédiate
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setStyleConf(p => ({ ...p, logoUrl: dataUrl }))
        // Si ECC n'est pas déjà H, le forcer (effectiveEcc s'en charge automatiquement)
        setLogoUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setLogoUploading(false)
    }
  }

  function removeLogo() {
    setStyleConf(p => ({ ...p, logoUrl: "" }))
  }

  function applyPreset(preset: Preset) {
    const canAccess = PLAN_RANK[userPlan] >= PLAN_RANK[preset.plan]
    if (!canAccess) { setUpsellPreset(preset.id); return }
    setFg(preset.fg)
    setBg(preset.bg)
    // Sync corner state legacy (utilisé pour le clipping canvas)
    if (preset.cornerStyle === "rounded" || preset.dotStyle === "rounded") setCorner("rounded")
    else if (preset.dotStyle === "dot") setCorner("dot")
    else setCorner("square")
    setStyleConf(p => ({
      ...p,
      fg2:          preset.fg2 ?? "",
      gradient:     preset.gradient ?? "none",
      dotStyle:     (preset.dotStyle as any) ?? "square",
      cornerStyle:  (preset.cornerStyle as any) ?? "square",
    }))
    setUpsellPreset(null)
  }

  async function applyToAll() {
    const sb = createClient()
    const payload = { foreground_color:fg, background_color:bg, corner_style:corner, error_correction:ecLevel, style_config:styleConf, updated_at:new Date().toISOString() }
    await sb.from("qr_codes").update(payload).eq("user_id", qrCodes[0]?.user_id ?? "")
    setQRCodes(prev => prev.map(q => ({ ...q, ...payload })))
    setApplyAllOk(true); setTimeout(()=>setApplyAllOk(false), 2500)
  }

  const [sb_asc, sb_dir] = sortKey.split("-")
  const filteredQR = qrCodes
    .filter(qr => {
      const t = qr.pages?.title?.toLowerCase() ?? ""
      const c = qr.short_code?.toLowerCase() ?? ""
      const s = qr.pages?.status ?? "draft"
      return (!search || t.includes(search.toLowerCase()) || c.includes(search.toLowerCase()))
        && (filterSt === "all" || s === filterSt)
    })
    .sort((a, b) => {
      let cmp = 0
      if (sb_asc === "scans") cmp = (a.total_scans ?? 0) - (b.total_scans ?? 0)
      if (sb_asc === "date")  cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      if (sb_asc === "name")  cmp = (a.pages?.title ?? "").localeCompare(b.pages?.title ?? "")
      return sb_dir === "desc" ? -cmp : cmp
    })

  const canPro      = PLAN_RANK[userPlan] >= 1
  const canBusiness = PLAN_RANK[userPlan] >= 2

  if (qrCodes.length === 0) {
    return (
      <div style={{ textAlign:"center", padding:"80px 40px", border:"1px dashed rgba(201,168,76,0.2)", borderRadius:20 }}>
        <div style={{ width:72, height:72, borderRadius:20, margin:"0 auto 20px", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <QrCode size={32} color={G}/>
        </div>
        <h2 style={{ fontFamily:"Cormorant Garamond, serif", fontSize:24, color:"#F5F0E8", fontWeight:700, margin:"0 0 10px" }}>Aucun QR code</h2>
        <p style={{ color:MUTED, fontSize:14, lineHeight:1.7, margin:"0 0 28px" }}>Cree ta premiere page pour generer automatiquement un QR code.</p>
        <a href="/dashboard" style={{ background:"linear-gradient(90deg,#C9A84C,#b8953f)", color:"#080808", textDecoration:"none", fontSize:14, fontWeight:700, padding:"14px 28px", borderRadius:10, display:"inline-block" }}>
          Creer ma premiere page
        </a>
      </div>
    )
  }

  return (
    <div style={{ display:"grid", gridTemplateColumns:"280px 1fr 300px", gap:0, height:"calc(100vh - 140px)", background:BG, borderRadius:16, border:"1px solid rgba(201,168,76,0.1)", overflow:"hidden", fontFamily:"DM Sans, sans-serif", position:"relative" }}>


      {/* ── Modal preview plein écran ─────────────────────────────────────────── */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:32 }}
          onClick={() => setShowModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, maxWidth:600, width:"100%" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%" }}>
              <div>
                <p style={{ color:"#F5F0E8", fontSize:16, fontWeight:700, margin:"0 0 3px" }}>{active?.pages?.title}</p>
                <p style={{ color:"#8A8478", fontSize:11, margin:0 }}>Scannez pour tester • {appUrl}/q/{active?.short_code}</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)}
                style={{ width:36, height:36, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#8A8478" }}>
                <X size={16}/>
              </button>
            </div>

            {/* QR grand */}
            <div style={{ padding:28, borderRadius:24, background:bg, boxShadow:"0 0 0 1px rgba(201,168,76,0.3), 0 32px 80px rgba(0,0,0,0.9)" }}>
              <canvas ref={canvasModalRef} width={800} height={800} style={{ display:"block", width:320, height:320, imageRendering:"pixelated" }}/>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:10, width:"100%", maxWidth:400 }}>
              <button type="button" onClick={() => downloadPNG(1200)}
                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", border:"none", borderRadius:10, color:"#080808", fontSize:13, fontWeight:700, cursor:"pointer" }}>
                <Download size={14}/> PNG HD
              </button>
              <button type="button" onClick={() => copy("short")}
                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px", background: copied==="short"?"rgba(57,255,143,0.12)":"rgba(255,255,255,0.05)", border:`1px solid ${copied==="short"?"rgba(57,255,143,0.3)":"rgba(255,255,255,0.1)"}`, borderRadius:10, color:copied==="short"?"#39FF8F":"#F5F0E8", fontSize:13, cursor:"pointer" }}>
                {copied==="short" ? <Check size={14}/> : <Copy size={14}/>}
                {copied==="short" ? "Copie !" : "Copier lien"}
              </button>
              <a href={pageUrl} target="_blank" rel="noopener noreferrer"
                style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#F5F0E8", fontSize:13, textDecoration:"none" }}>
                <ExternalLink size={14}/> Ouvrir
              </a>
            </div>

            {/* Diagnostic dans la modal */}
            {(() => {
              const diag = getDiagnostic(diagFg || fg, diagBg || bg)
              if (!diag) return null
              return (
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" as const, justifyContent:"center" }}>
                  {[
                    { label: diag.readability, color: diag.readColor },
                    { label: `Contraste ${diag.ratio}:1`, color: diag.warnContrast?"#FF6B6B":diag.warnLow?"#F97316":"#39FF8F" },
                    { label: `Min ${diag.minSize}`, color: "#8A8478" },
                    { label: `ECC ${ecLevel}`, color: "#C9A84C" },
                  ].map((b,i) => (
                    <span key={i} style={{ background:`${b.color}12`, border:`1px solid ${b.color}35`, borderRadius:7, padding:"4px 12px", fontSize:11, color:b.color, fontWeight:600 }}>{b.label}</span>
                  ))}
                </div>
              )
            })()}

            <p style={{ color:"rgba(138,132,120,0.6)", fontSize:11, textAlign:"center" as const }}>
              Cliquez en dehors pour fermer
            </p>
          </div>
        </div>
      )}

      {/* ── Modale suppression ────────────────────────────────────────────────── */}
      {confirmId !== null && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }} onClick={() => setConfirmId(null)}>
          <div style={{ background:"#111009", border:"1px solid rgba(255,107,107,0.3)", borderRadius:16, padding:28, maxWidth:380, width:"100%", fontFamily:"DM Sans, sans-serif" }} onClick={e => e.stopPropagation()}>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
              <AlertTriangle size={20} color="#FF6B6B"/>
              <p style={{ color:"#F5F0E8", fontSize:15, fontWeight:700, margin:0 }}>Supprimer ce QR Code ?</p>
            </div>
            <p style={{ color:MUTED, fontSize:13, margin:"0 0 24px", lineHeight:1.6 }}>Action irreversible. Toutes les statistiques seront perdues.</p>
            <div style={{ display:"flex", gap:10 }}>
              <button type="button" onClick={() => setConfirmId(null)} style={{ flex:1, padding:"10px", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, color:MUTED, fontSize:13, cursor:"pointer" }}>Annuler</button>
              <button type="button" onClick={() => deleteQR(confirmId)} disabled={!!deletingId} style={{ flex:1, padding:"10px", background:deletingId?"rgba(255,107,107,0.3)":"linear-gradient(90deg,#FF6B6B,#e05555)", border:"none", borderRadius:9, color:"#F5F0E8", fontSize:13, fontWeight:700, cursor:deletingId?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
                {deletingId ? <><Loader size={13} style={{ animation:"spin 0.8s linear infinite" }}/> Suppression...</> : <><Trash2 size={13}/> Supprimer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay fermeture menu */}
      {menuId !== null && (
        <div style={{ position:"fixed", inset:0, zIndex:90 }} onClick={() => setMenuId(null)}/>
      )}

      {/* ── COL 1 : Liste ────────────────────────────────────────────────────── */}
      <div style={{ borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header + filtres */}
        <div style={{ padding:"12px 12px 10px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <p style={{ color:MUTED, fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>QR Codes</p>
            <span style={{ background:"rgba(201,168,76,0.12)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:5, padding:"1px 7px", fontSize:10, color:G, fontWeight:700 }}>{filteredQR.length}/{qrCodes.length}</span>
          </div>
          <div style={{ position:"relative" }}>
            <Search size={11} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", color:MUTED, pointerEvents:"none" }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Nom, URL..."
              style={{ width:"100%", background:"#111009", border:"1px solid rgba(255,255,255,0.07)", borderRadius:8, padding:"6px 26px 6px 26px", color:"#F5F0E8", fontSize:11, outline:"none", boxSizing:"border-box" as const }}/>
            {search && (
              <button type="button" onClick={() => setSearch("")} style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:MUTED, display:"flex" }}>
                <X size={11}/>
              </button>
            )}
          </div>
          <div style={{ display:"flex", gap:5 }}>
            <select value={filterSt} onChange={e => setFilterSt(e.target.value)}
              style={{ flex:1, background:"#111009", border:"1px solid rgba(255,255,255,0.07)", borderRadius:7, color:MUTED, padding:"5px 6px", fontSize:10, outline:"none", cursor:"pointer" }}>
              <option value="all">Tous</option>
              <option value="published">Publie</option>
              <option value="draft">Brouillon</option>
              <option value="archived">Archive</option>
              <option value="paused">En pause</option>
            </select>
            <select value={sortKey} onChange={e => setSortKey(e.target.value)}
              style={{ flex:1, background:"#111009", border:"1px solid rgba(255,255,255,0.07)", borderRadius:7, color:MUTED, padding:"5px 6px", fontSize:10, outline:"none", cursor:"pointer" }}>
              <option value="date-desc">Date rec.</option>
              <option value="date-asc">Date anc.</option>
              <option value="scans-desc">+ scans</option>
              <option value="scans-asc">- scans</option>
              <option value="name-asc">A - Z</option>
              <option value="name-desc">Z - A</option>
            </select>
          </div>
        </div>

        {/* Liste */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {filteredQR.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 12px", color:MUTED }}>
              <QrCode size={24} color={MUTED} style={{ marginBottom:8 }}/>
              <p style={{ fontSize:12, margin:"0 0 3px", color:"#F5F0E8" }}>Aucun resultat</p>
              <p style={{ fontSize:10, margin:0 }}>Modifier les filtres</p>
            </div>
          ) : filteredQR.map(qr => {
            const page = qr.pages
            const isA  = qr.id === activeId
            const st   = page?.status ?? "draft"
            const sCfg = STATUS_CFG[st] ?? STATUS_CFG.draft
            const url  = `${appUrl}/q/${qr.short_code}`
            const isM  = menuId === qr.id
            const isC  = copyQRId === qr.id
            const pb   = PLAN_BADGE[userPlan]
            return (
              <div key={qr.id} onClick={() => { setActiveId(qr.id); setMenuId(null) }}
                style={{ padding:"11px 12px", cursor:"pointer", borderBottom:"1px solid rgba(255,255,255,0.04)", background:isA?"rgba(201,168,76,0.06)":"transparent", borderLeft:isA?`2px solid ${G}`:"2px solid transparent", position:"relative" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
                  <div style={{ width:34, height:34, borderRadius:8, background:qr.background_color, border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, position:"relative" }}>
                    <QrCode size={16} color={qr.foreground_color}/>
                    {pb && (
                      <span style={{ position:"absolute", top:-4, right:-4, background:pb.color, color:"#080808", fontSize:7, fontWeight:800, borderRadius:3, padding:"1px 3px" }}>
                        {pb.label}
                      </span>
                    )}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ color:isA?"#F5F0E8":"#D4CFC7", fontSize:12, fontWeight:700, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                      {page?.title ?? "Sans titre"}
                    </p>
                    <p style={{ color:MUTED, fontSize:9, margin:"0 0 4px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const, fontFamily:"monospace" }}>
                      /q/{qr.short_code}
                    </p>
                    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                      <span style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"1px 6px", background:sCfg.badge, borderRadius:4, fontSize:9, color:sCfg.text, fontWeight:600 }}>
                        <div style={{ width:4, height:4, borderRadius:"50%", background:sCfg.dot }}/>
                        {sCfg.label}
                      </span>
                      <span style={{ color:qr.total_scans>0?G:MUTED, fontSize:9 }}>{qr.total_scans} scans</span>
                    </div>
                    <p style={{ color:MUTED, fontSize:9, margin:"3px 0 0" }}>
                      {qr.last_scan_at ? formatDate(qr.last_scan_at) : "Jamais scanne"}
                    </p>
                  </div>
                  <button type="button" onClick={e => { e.stopPropagation(); setMenuId(isM ? null : qr.id) }}
                    style={{ width:22, height:22, background:"none", border:"none", color:MUTED, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <MoreVertical size={13}/>
                  </button>
                </div>

                {/* Menu contextuel */}
                {isM && (
                  <div style={{ position:"absolute", right:8, top:38, zIndex:200, background:"#1A1710", border:"1px solid rgba(201,168,76,0.2)", borderRadius:10, padding:"5px", boxShadow:"0 8px 32px rgba(0,0,0,0.7)", minWidth:158 }}
                    onClick={e => e.stopPropagation()}>
                    {([
                      { icon: <Pencil size={11}/>,  label: "Modifier",   action: () => { window.location.href = `/dashboard/builder/${page?.id}` }, color: "#F5F0E8", disabled: false },
                      { icon: isC ? <Check size={11}/> : <Copy size={11}/>, label: isC ? "Copie !" : "Copier lien", action: () => copyQRLink(qr.id, url), color: isC ? "#39FF8F" : "#F5F0E8", disabled: false },
                      { icon: <Download size={11}/>, label: "PNG",        action: () => { setActiveId(qr.id); setTimeout(() => downloadPNG(400), 100); setMenuId(null) }, color: "#F5F0E8", disabled: false },
                      { icon: <Archive size={11}/>,  label: "Archiver",   action: () => archiveQR(qr.id), color: "#F97316", disabled: st === "archived" },
                      { icon: <Trash2 size={11}/>,   label: "Supprimer",  action: () => { setConfirmId(qr.id); setMenuId(null) }, color: "#FF6B6B", disabled: false },
                    ]).map((item, i) => (
                      <button key={i} type="button" onClick={item.disabled ? undefined : item.action} disabled={item.disabled}
                        style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"none", border:"none", color:item.disabled ? "rgba(138,132,120,0.4)" : item.color, fontSize:11, cursor:item.disabled ? "not-allowed" : "pointer", borderRadius:7, textAlign:"left" as const }}>
                        {archivingId === qr.id && item.label === "Archiver"
                          ? <Loader size={11} style={{ animation:"spin 0.8s linear infinite" }}/>
                          : item.icon
                        }
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions rapides si sélectionné */}
                {isA && (
                  <div style={{ display:"flex", gap:5, marginTop:8, paddingTop:8, borderTop:"1px solid rgba(255,255,255,0.04)" }}
                    onClick={e => e.stopPropagation()}>
                    <a href={`/dashboard/builder/${page?.id}`}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"5px", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:7, color:G, fontSize:10, fontWeight:600, textDecoration:"none" }}>
                      <Pencil size={10}/> Modifier
                    </a>
                    <button type="button" onClick={() => copyQRLink(qr.id, url)}
                      style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:4, padding:"5px", background:isC?"rgba(57,255,143,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${isC?"rgba(57,255,143,0.3)":"rgba(255,255,255,0.08)"}`, borderRadius:7, color:isC?"#39FF8F":MUTED, fontSize:10, cursor:"pointer" }}>
                      {isC ? <Check size={10}/> : <Copy size={10}/>} Lien
                    </button>
                    <button type="button" onClick={() => downloadPNG(400)}
                      style={{ width:28, display:"flex", alignItems:"center", justifyContent:"center", padding:"5px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, color:MUTED, cursor:"pointer" }}>
                      <Download size={10}/>
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── COL 2 : Preview premium ──────────────────────────────────────────── */}
      <div style={{ display:"flex", flexDirection:"column", overflow:"hidden", background:"#0A0907" }}>
        {active ? (() => {
          const diag = getDiagnostic(diagFg || fg, diagBg || bg)
          return (
            <div style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>

              {/* QR Card */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"24px 24px 16px", gap:16, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"relative", padding:20, borderRadius:20, background:bg, boxShadow:`0 0 0 1px rgba(201,168,76,0.2), 0 20px 60px rgba(0,0,0,0.8)`, transition:"background 0.3s", cursor:"pointer" }}
                    onClick={() => setShowModal(true)}>
                    {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h], i) => (
                      <div key={i} style={{ position:"absolute", [v]:8, [h]:8, width:12, height:12,
                        borderTop:    v==="top"    ? "2px solid rgba(201,168,76,0.6)" : "none",
                        borderBottom: v==="bottom" ? "2px solid rgba(201,168,76,0.6)" : "none",
                        borderLeft:   h==="left"   ? "2px solid rgba(201,168,76,0.6)" : "none",
                        borderRight:  h==="right"  ? "2px solid rgba(201,168,76,0.6)" : "none",
                      }}/>
                    ))}
                    <canvas ref={canvasRef} width={400} height={400} style={{ display:"block", width:200, height:200, imageRendering:"pixelated" }}/>
                    {/* Hover overlay */}
                    <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0)", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:20, transition:"background 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.background="rgba(0,0,0,0.4)")}
                      onMouseLeave={e => (e.currentTarget.style.background="rgba(0,0,0,0)")}>
                      <span style={{ color:"rgba(255,255,255,0)", fontSize:11, fontWeight:700, transition:"color 0.2s", pointerEvents:"none" }}
                        onMouseEnter={e => (e.currentTarget.style.color="#F5F0E8")}
                        onMouseLeave={e => (e.currentTarget.style.color="rgba(255,255,255,0)")}>
                        Agrandir
                      </span>
                    </div>
                  </div>
                </div>

                {/* Nom + URL + statut */}
                <div style={{ textAlign:"center", width:"100%" }}>
                  <p style={{ color:"#F5F0E8", fontSize:15, fontWeight:700, margin:"0 0 4px" }}>{active.pages?.title ?? "Sans titre"}</p>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginBottom:6 }}>
                    <code style={{ color:"#C9A84C", fontSize:10, background:"rgba(201,168,76,0.08)", padding:"2px 8px", borderRadius:5 }}>
                      /q/{active.short_code}
                    </code>
                    <button type="button" onClick={() => copy("short")}
                      style={{ width:20, height:20, background:"none", border:"none", cursor:"pointer", color:copied==="short"?"#39FF8F":"#8A8478", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {copied==="short" ? <Check size={11}/> : <Copy size={11}/>}
                    </button>
                  </div>
                  {(() => {
                    const st   = active.pages?.status ?? "draft"
                    const sCfg = ({ published:{dot:"#39FF8F",label:"Publie"}, draft:{dot:"#8A8478",label:"Brouillon"}, archived:{dot:"#F97316",label:"Archive"}, paused:{dot:"#FF6B6B",label:"En pause"} } as any)[st] ?? {dot:"#8A8478",label:"Inconnu"}
                    return (
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, color:sCfg.dot, background:`${sCfg.dot}15`, border:`1px solid ${sCfg.dot}40`, borderRadius:6, padding:"2px 8px", fontWeight:600 }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:sCfg.dot }}/>{sCfg.label}
                      </span>
                    )
                  })()}
                </div>

                {/* Actions rapides */}
                <div style={{ display:"flex", gap:6, width:"100%" }}>
                  <button type="button" onClick={() => copy("link")}
                    style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"8px", background:copied==="link"?"rgba(57,255,143,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${copied==="link"?"rgba(57,255,143,0.3)":"rgba(255,255,255,0.08)"}`, borderRadius:9, color:copied==="link"?"#39FF8F":"#8A8478", fontSize:11, cursor:"pointer", transition:"all 0.15s" }}>
                    {copied==="link" ? <Check size={12}/> : <Copy size={12}/>}
                    {copied==="link" ? "Copie !" : "Copier"}
                  </button>
                  <a href={pageUrl} target="_blank" rel="noopener noreferrer"
                    style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"8px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:9, color:"#8A8478", fontSize:11, textDecoration:"none" }}>
                    <ExternalLink size={12}/> Ouvrir
                  </a>
                  <button type="button" onClick={() => setShowModal(true)}
                    style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:5, padding:"8px", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:9, color:"#C9A84C", fontSize:11, cursor:"pointer" }}>
                    <Eye size={12}/> Tester
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label:"Scans total",   value:active.total_scans.toLocaleString(),               color:"#C9A84C", icon:"📡" },
                  { label:"Vues page",     value:(active.pages?.total_views ?? 0).toLocaleString(),  color:"#39FF8F", icon:"👁" },
                  { label:"Dernier scan",  value:formatDate(active.last_scan_at),                   color:"#8A8478", icon:"🕐" },
                  { label:"Cree le",       value:new Date(active.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}), color:"#8A8478", icon:"📅" },
                ].map((s,i) => (
                  <div key={i} style={{ background:"#0F0E0B", border:"1px solid rgba(255,255,255,0.06)", borderRadius:9, padding:"10px 12px" }}>
                    <p style={{ color:"#8A8478", fontSize:9, textTransform:"uppercase", letterSpacing:1.2, margin:"0 0 4px" }}>{s.icon} {s.label}</p>
                    <p style={{ color:s.color, fontSize:12, fontWeight:700, margin:0 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Destination */}
              <div style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ color:"#8A8478", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, margin:"0 0 7px" }}>Destination</p>
                <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"#0F0E0B", border:"1px solid rgba(255,255,255,0.06)", borderRadius:9 }}>
                  <div style={{ width:6, height:6, borderRadius:"50%", background: active.pages?.status==="published"?"#39FF8F":"#8A8478", flexShrink:0 }}/>
                  <code style={{ flex:1, color:"#C9A84C", fontSize:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                    {pageUrl || "—"}
                  </code>
                  <a href={pageUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color:"#8A8478", textDecoration:"none", flexShrink:0 }}>
                    <ExternalLink size={10}/>
                  </a>
                </div>
              </div>

              {/* Diagnostic */}
              {diag && (
                <div style={{ padding:"12px 16px" }}>
                  <p style={{ color:"#8A8478", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, margin:"0 0 10px" }}>Diagnostic lisibilite</p>

                  {/* Lisibilité badge */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ color:"#8A8478", fontSize:11 }}>Lisibilite</span>
                    <span style={{ background:`${diag.readColor}15`, border:`1px solid ${diag.readColor}40`, borderRadius:6, padding:"2px 10px", fontSize:10, color:diag.readColor, fontWeight:700 }}>
                      {diag.readability}
                    </span>
                  </div>

                  {/* Contraste */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                      <span style={{ color:"#8A8478", fontSize:11 }}>Contraste</span>
                      <span style={{ color: diag.warnContrast?"#FF6B6B":diag.warnLow?"#F97316":"#39FF8F", fontSize:11, fontWeight:700 }}>
                        {diag.ratio}:1
                      </span>
                    </div>
                    <div style={{ height:5, background:"rgba(255,255,255,0.07)", borderRadius:3, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${diag.percent}%`, background: diag.warnContrast?"#FF6B6B":diag.warnLow?"#F97316":"linear-gradient(90deg,#C9A84C,#39FF8F)", borderRadius:3, transition:"width 0.4s, background 0.3s" }}/>
                    </div>
                  </div>

                  {/* Badges info */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const }}>
                    <span style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"3px 8px", fontSize:9, color:"#8A8478" }}>
                      Min {diag.minSize}
                    </span>
                    <span style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"3px 8px", fontSize:9, color:"#8A8478" }}>
                      Marge 10px
                    </span>
                    <span style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"3px 8px", fontSize:9, color: ecLevel==="H"||ecLevel==="Q"?"#39FF8F":"#C9A84C" }}>
                      ECC {ecLevel}
                    </span>
                  </div>

                  {/* Warnings */}
                  {diag.warnContrast && (
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:10, padding:"8px 10px", background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:8 }}>
                      <AlertTriangle size={12} color="#FF6B6B"/>
                      <p style={{ color:"#FF6B6B", fontSize:11, margin:0 }}>Contraste trop faible — QR risque d&apos;etre illisible</p>
                    </div>
                  )}
                  {!diag.warnContrast && diag.warnLow && (
                    <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:10, padding:"8px 10px", background:"rgba(249,115,22,0.08)", border:"1px solid rgba(249,115,22,0.2)", borderRadius:8 }}>
                      <AlertTriangle size={12} color="#F97316"/>
                      <p style={{ color:"#F97316", fontSize:11, margin:0 }}>Contraste moyen — privilegiez une impression a 25mm+</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })() : (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"100%", color:"#8A8478" }}>
            <p style={{ fontSize:12 }}>Selectionne un QR code</p>
          </div>
        )}
      </div>

      {/* ── COL 3 : Personnalisation premium ──────────────────────────────────── */}
      <div style={{ borderLeft:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Tabs principaux Style/Export */}
        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
          {([["style","Style","🎨"],["export","Export","📤"]] as const).map(([id,label,emoji]) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              style={{ flex:1, padding:"11px 8px", background:activeTab===id?"rgba(201,168,76,0.06)":"transparent", border:"none", borderBottom:activeTab===id?`2px solid ${G}`:"2px solid transparent", color:activeTab===id?G:MUTED, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <span>{emoji}</span>{label}
            </button>
          ))}
        </div>

        {activeTab === "style" && active && (
          <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>

            {/* Sous-tabs Couleurs/Style/Coins/Avancé */}
            <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"0 8px", flexShrink:0, overflowX:"auto" }}>
              {([
                ["colors",   "Couleurs", "🎨"],
                ["logo",     "Logo",     "🖼"],
                ["style",    "Style",    "✦"],
                ["corners",  "Coins",    "⬡"],
                ["advanced", "Avance",   "⚙"],
              ] as const).map(([id,label,emoji]) => (
                <button key={id} type="button" onClick={() => setStyleTab(id)}
                  style={{ padding:"8px 10px", background:"none", border:"none", borderBottom:styleTab===id?`2px solid ${G}`:"2px solid transparent", color:styleTab===id?G:MUTED, fontSize:10, fontWeight:styleTab===id?700:500, cursor:"pointer", whiteSpace:"nowrap" as const, display:"flex", alignItems:"center", gap:4 }}>
                  <span style={{ fontSize:11 }}>{emoji}</span>{label}
                </button>
              ))}
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"14px" }}>

              {/* ── COULEURS ────────────────────────────────────────────────── */}
              {styleTab === "colors" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                  {/* Couleurs principales */}
                  <div>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Couleurs principales</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {([
                        { label:"QR principal",    key:"fg",  val:fg,  set:(v:string)=>setFg(v) },
                        { label:"Fond",             key:"bg",  val:bg,  set:(v:string)=>setBg(v) },
                      ]).map(c => (
                        <div key={c.key} style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <label style={{ color:MUTED, fontSize:11, flex:1 }}>{c.label}</label>
                          <div style={{ position:"relative", width:28, height:28, borderRadius:6, overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)", flexShrink:0 }}>
                            <input type="color" value={c.val} onChange={e => c.set(e.target.value)}
                              style={{ position:"absolute", inset:-4, width:"calc(100%+8px)", height:"calc(100%+8px)", cursor:"pointer", border:"none" }}/>
                          </div>
                          <input type="text" value={c.val} onChange={e => c.set(e.target.value)}
                            style={{ width:72, background:"#111009", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"5px 7px", color:"#F5F0E8", fontSize:10, fontFamily:"monospace", outline:"none" }}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Couleurs avancées */}
                  <div>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Couleurs avancees</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {([
                        { label:"QR secondaire",   key:"fg2",         val:styleConf.fg2??""          },
                        { label:"Couleur coins",   key:"cornerColor", val:styleConf.cornerColor??""  },
                        { label:"Couleur yeux",    key:"eyeColor",    val:styleConf.eyeColor??""     },
                        { label:"Fond degrade",    key:"gradientBg",  val:styleConf.gradientBg??""   },
                      ]).map(c => (
                        <div key={c.key} style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <label style={{ color:MUTED, fontSize:11, flex:1 }}>{c.label}</label>
                          <div style={{ position:"relative", width:28, height:28, borderRadius:6, overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)", flexShrink:0 }}>
                            <input type="color" value={c.val || "#080808"} onChange={e => setStyleConf(p => ({ ...p, [c.key]: e.target.value }))}
                              style={{ position:"absolute", inset:-4, width:"calc(100%+8px)", height:"calc(100%+8px)", cursor:"pointer", border:"none" }}/>
                          </div>
                          <input type="text" value={c.val} onChange={e => setStyleConf(p => ({ ...p, [c.key]: e.target.value }))}
                            placeholder="#——"
                            style={{ width:72, background:"#111009", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"5px 7px", color:c.val?"#F5F0E8":MUTED, fontSize:10, fontFamily:"monospace", outline:"none" }}/>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Fond transparent */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:9 }}>
                    <div>
                      <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:600, margin:"0 0 2px" }}>Fond transparent</p>
                      <p style={{ color:MUTED, fontSize:10, margin:0 }}>PNG avec canal alpha</p>
                    </div>
                    <button type="button" onClick={() => setStyleConf(p => ({ ...p, transparent: !p.transparent }))}
                      style={{ width:38, height:22, borderRadius:11, background:styleConf.transparent?"linear-gradient(90deg,#C9A84C,#b8953f)":"rgba(255,255,255,0.1)", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
                      <div style={{ position:"absolute", top:3, left:styleConf.transparent?18:3, width:16, height:16, borderRadius:"50%", background:"#F5F0E8", transition:"left 0.2s" }}/>
                    </button>
                  </div>

                  {/* Dégradé */}
                  <div>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Degrade</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {GRADIENT_OPTS.map(g => (
                        <button key={g.id ?? "none"} type="button" onClick={() => setStyleConf(p => ({ ...p, gradient: g.id ?? "none" }))}
                          style={{ padding:"7px 8px", background:(styleConf.gradient??"none")===(g.id??"none")?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${(styleConf.gradient??"none")===(g.id??"none")?"rgba(201,168,76,0.35)":"rgba(255,255,255,0.07)"}`, borderRadius:8, color:(styleConf.gradient??"none")===(g.id??"none")?G:MUTED, fontSize:10, cursor:"pointer", fontWeight:(styleConf.gradient??"none")===(g.id??"none")?700:400 }}>
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Bibliothèque de presets ──────────────────── */}
                  <div>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Bibliotheque de presets</p>

                    {/* Filtres catégorie */}
                    <div style={{ display:"flex", gap:4, overflowX:"auto", paddingBottom:8, marginBottom:10 }}>
                      {PRESET_CATS.map(cat => (
                        <button key={cat.id} type="button" onClick={() => setSelectedCat(cat.id)}
                          style={{ display:"inline-flex", alignItems:"center", gap:3, padding:"4px 9px", background:selectedCat===cat.id?"rgba(201,168,76,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${selectedCat===cat.id?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.08)"}`, borderRadius:20, color:selectedCat===cat.id?G:MUTED, fontSize:9, fontWeight:selectedCat===cat.id?700:500, cursor:"pointer", whiteSpace:"nowrap" as const, flexShrink:0 }}>
                          <span>{cat.emoji}</span>{cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Grille presets */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6 }}>
                      {PRESETS.filter(p => selectedCat==="all" || p.cat===selectedCat).map(preset => {
                        const canAccess = PLAN_RANK[userPlan] >= PLAN_RANK[preset.plan]
                        const isActive  = fg===preset.fg && bg===preset.bg
                        const planLabel = preset.plan === "free" ? null : preset.plan === "pro" ? "PRO" : "BIZ"
                        return (
                          <div key={preset.id} onClick={() => applyPreset(preset)}
                            style={{ position:"relative", cursor:"pointer", borderRadius:9, overflow:"hidden", border:`1.5px solid ${isActive?"#C9A84C":canAccess?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.04)"}`, transition:"all 0.15s", opacity:canAccess?1:0.7 }}>

                            {/* Preview miniature */}
                            <div style={{ background:preset.bg, padding:"10px 8px", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", minHeight:42 }}>
                              {preset.gradient && preset.gradient !== "none" && preset.fg2 && (
                                <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg,${preset.fg}30,${preset.fg2}30)` }}/>
                              )}
                              <div style={{ position:"relative", width:28, height:28 }}>
                                <div style={{ position:"absolute", inset:0, background:preset.fg, borderRadius:3, opacity:0.9 }}/>
                                <div style={{ position:"absolute", inset:4, background:preset.bg, borderRadius:2 }}/>
                                <div style={{ position:"absolute", inset:8, background:preset.fg, borderRadius:1 }}/>
                              </div>
                              {isActive && (
                                <div style={{ position:"absolute", top:3, left:3, width:10, height:10, background:G, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                  <Check size={6} color="#080808"/>
                                </div>
                              )}
                            </div>

                            {/* Nom + badge plan */}
                            <div style={{ background:"#0F0E0B", padding:"5px 5px 6px", textAlign:"center" as const }}>
                              <p style={{ color:isActive?G:"#F5F0E8", fontSize:8, fontWeight:isActive?700:500, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                                {preset.label}
                              </p>
                              {planLabel && (
                                <span style={{ background:canAccess?(preset.plan==="pro"?"rgba(201,168,76,0.15)":"rgba(57,255,143,0.12)"):"rgba(255,255,255,0.06)", borderRadius:3, padding:"1px 4px", fontSize:7, color:canAccess?(preset.plan==="pro"?G:"#39FF8F"):MUTED, fontWeight:700 }}>
                                  {planLabel}
                                </span>
                              )}
                            </div>

                            {/* Overlay lock */}
                            {!canAccess && (
                              <div style={{ position:"absolute", inset:0, background:"rgba(8,8,8,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <Lock size={12} color={MUTED}/>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Upsell modal inline */}
                    {upsellPreset !== null && (
                      <div style={{ marginTop:10, padding:"12px 14px", background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:10 }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                          <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:700, margin:0 }}>Preset premium</p>
                          <button type="button" onClick={() => setUpsellPreset(null)}
                            style={{ background:"none", border:"none", color:MUTED, cursor:"pointer", display:"flex" }}>
                            <X size={13}/>
                          </button>
                        </div>
                        <p style={{ color:MUTED, fontSize:11, margin:"0 0 10px", lineHeight:1.5 }}>
                          Ce preset necessite un plan superieur. Passez a Pro ou Business pour debloquer tous les presets.
                        </p>
                        <a href="/dashboard/upgrade"
                          style={{ display:"block", textAlign:"center" as const, padding:"8px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", borderRadius:8, color:"#080808", fontSize:11, fontWeight:700, textDecoration:"none" }}>
                          Voir les plans
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}


              {/* ── LOGO ─────────────────────────────────────────────────── */}
              {styleTab === "logo" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                  {/* ECC warning automatique */}
                  {styleConf.logoUrl && (
                    <div style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 12px", background:"rgba(201,168,76,0.07)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:9 }}>
                      <AlertTriangle size={13} color={G}/>
                      <p style={{ color:G, fontSize:11, margin:0, lineHeight:1.4 }}>
                        Correction d&apos;erreur forcee a <strong>H</strong> automatiquement pour garantir la scannabilite.
                      </p>
                    </div>
                  )}

                  {/* Dropzone / aperçu */}
                  <div>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Logo central</p>

                    {!styleConf.logoUrl ? (
                      <div
                        onClick={() => logoInputRef.current?.click()}
                        onDragOver={e => { e.preventDefault(); (e.currentTarget as HTMLElement).style.borderColor = G }}
                        onDragLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)" }}
                        onDrop={e => {
                          e.preventDefault();
                          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)"
                          const file = e.dataTransfer.files[0]
                          if (file) handleLogoUpload(file)
                        }}
                        style={{ border:"2px dashed rgba(255,255,255,0.1)", borderRadius:12, padding:"24px 16px", textAlign:"center" as const, cursor:"pointer", transition:"border-color 0.2s", background:"rgba(255,255,255,0.01)" }}>
                        <div style={{ fontSize:28, marginBottom:8 }}>{logoUploading ? "⏳" : "🖼"}</div>
                        <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:600, margin:"0 0 4px" }}>
                          {logoUploading ? "Chargement..." : "Deposer votre logo"}
                        </p>
                        <p style={{ color:MUTED, fontSize:10, margin:"0 0 10px" }}>PNG, SVG, WEBP — max 2 Mo</p>
                        <span style={{ display:"inline-block", padding:"5px 14px", background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.25)", borderRadius:7, color:G, fontSize:11, fontWeight:600 }}>
                          Parcourir
                        </span>
                        <input ref={logoInputRef} type="file" accept="image/*" style={{ display:"none" }}
                          onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(f); e.target.value = "" }}/>
                      </div>
                    ) : (
                      <div style={{ display:"flex", gap:10, alignItems:"center", padding:"12px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:10 }}>
                        <div style={{ width:48, height:48, borderRadius:8, overflow:"hidden", flexShrink:0, background:"rgba(255,255,255,0.05)", display:"flex", alignItems:"center", justifyContent:"center", border:"1px solid rgba(255,255,255,0.1)" }}>
                          <img src={styleConf.logoUrl} alt="Logo" style={{ width:"100%", height:"100%", objectFit:"contain" }}/>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:600, margin:"0 0 2px" }}>Logo actif</p>
                          <p style={{ color:MUTED, fontSize:10, margin:0 }}>ECC force H — scannabilite optimale</p>
                        </div>
                        <button type="button" onClick={removeLogo}
                          style={{ width:30, height:30, background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#FF6B6B", flexShrink:0 }}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    )}

                    {/* Utiliser logo de la page */}
                    {active.pages && !styleConf.logoUrl && (
                      <button type="button" onClick={() => {
                        const pageLogoUrl = (active as any).pages?.logo_url
                        if (pageLogoUrl) setStyleConf(p => ({ ...p, logoUrl: pageLogoUrl }))
                        else logoInputRef.current?.click()
                      }}
                        style={{ marginTop:8, width:"100%", padding:"8px", background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.1)", borderRadius:8, color:MUTED, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                        <span>🔗</span> Utiliser le logo/avatar de la page
                      </button>
                    )}
                  </div>

                  {/* Options logo (si logo actif) */}
                  {styleConf.logoUrl && (
                    <>
                      {/* Taille */}
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>Taille du logo</p>
                          <span style={{ color: (styleConf.logoSize ?? 18) > 25 ? "#FF6B6B" : G, fontSize:11, fontWeight:700 }}>
                            {styleConf.logoSize ?? 18}%
                          </span>
                        </div>
                        <input type="range" min={10} max={30} step={1} value={styleConf.logoSize ?? 18}
                          onChange={e => setStyleConf(p => ({ ...p, logoSize: Number(e.target.value) }))}
                          style={{ width:"100%", accentColor: (styleConf.logoSize ?? 18) > 25 ? "#FF6B6B" : G, cursor:"pointer" }}/>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:4 }}>
                          <span style={{ color:MUTED, fontSize:9 }}>10% — Min</span>
                          <span style={{ color:G, fontSize:9, fontWeight:600 }}>✦ 15-20% recommande</span>
                          <span style={{ color:MUTED, fontSize:9 }}>30% — Max</span>
                        </div>
                        {(styleConf.logoSize ?? 18) > 25 && (
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:7, padding:"7px 10px", background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:8 }}>
                            <AlertTriangle size={12} color="#FF6B6B"/>
                            <p style={{ color:"#FF6B6B", fontSize:10, margin:0 }}>Logo trop grand — risque de rendre le QR illisible</p>
                          </div>
                        )}
                      </div>

                      {/* Forme du conteneur */}
                      <div>
                        <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Forme du conteneur</p>
                        <div style={{ display:"flex", gap:6 }}>
                          {([
                            { id:"square",  label:"Carre",   icon:"⬛" },
                            { id:"rounded", label:"Arrondi", icon:"🔲" },
                            { id:"circle",  label:"Cercle",  icon:"⚪" },
                          ] as const).map(s => (
                            <button key={s.id} type="button" onClick={() => setStyleConf(p => ({ ...p, logoShape: s.id }))}
                              style={{ flex:1, padding:"9px 6px", background:(styleConf.logoShape??"rounded")===s.id?"rgba(201,168,76,0.12)":"rgba(255,255,255,0.03)", border:`1px solid ${(styleConf.logoShape??"rounded")===s.id?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius:9, cursor:"pointer", textAlign:"center" as const }}>
                              <div style={{ fontSize:16, marginBottom:3 }}>{s.icon}</div>
                              <p style={{ color:(styleConf.logoShape??"rounded")===s.id?G:MUTED, fontSize:9, margin:0, fontWeight:(styleConf.logoShape??"rounded")===s.id?700:400 }}>{s.label}</p>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fond du conteneur */}
                      <div>
                        <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Fond du conteneur</p>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:8 }}>
                          {([
                            { id:"transparent", label:"Transparent" },
                            { id:"white",       label:"Blanc" },
                            { id:"black",       label:"Noir" },
                            { id:"custom",      label:"Personnalise" },
                          ] as const).map(b => (
                            <button key={b.id} type="button" onClick={() => setStyleConf(p => ({ ...p, logoBg: b.id }))}
                              style={{ padding:"7px 8px", background:(styleConf.logoBg??"white")===b.id?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${(styleConf.logoBg??"white")===b.id?"rgba(201,168,76,0.35)":"rgba(255,255,255,0.07)"}`, borderRadius:8, color:(styleConf.logoBg??"white")===b.id?G:MUTED, fontSize:10, cursor:"pointer", fontWeight:(styleConf.logoBg??"white")===b.id?700:400 }}>
                              {b.label}
                            </button>
                          ))}
                        </div>
                        {styleConf.logoBg === "custom" && (
                          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                            <div style={{ position:"relative", width:28, height:28, borderRadius:6, overflow:"hidden", border:"1px solid rgba(255,255,255,0.1)", flexShrink:0 }}>
                              <input type="color" value={styleConf.logoBgColor ?? "#FFFFFF"} onChange={e => setStyleConf(p => ({ ...p, logoBgColor: e.target.value }))}
                                style={{ position:"absolute", inset:-4, width:"calc(100%+8px)", height:"calc(100%+8px)", cursor:"pointer", border:"none" }}/>
                            </div>
                            <input type="text" value={styleConf.logoBgColor ?? "#FFFFFF"} onChange={e => setStyleConf(p => ({ ...p, logoBgColor: e.target.value }))}
                              style={{ flex:1, background:"#111009", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, padding:"6px 8px", color:"#F5F0E8", fontSize:10, fontFamily:"monospace", outline:"none" }}/>
                          </div>
                        )}
                      </div>

                      {/* Padding */}
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>Padding</p>
                          <span style={{ color:G, fontSize:11, fontWeight:700 }}>{styleConf.logoPadding ?? 4}px</span>
                        </div>
                        <input type="range" min={0} max={12} step={1} value={styleConf.logoPadding ?? 4}
                          onChange={e => setStyleConf(p => ({ ...p, logoPadding: Number(e.target.value) }))}
                          style={{ width:"100%", accentColor:G, cursor:"pointer" }}/>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── STYLE QR ────────────────────────────────────────────────── */}
              {styleTab === "style" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 10px" }}>Style des modules</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                      {DOT_STYLES.map(ds => {
                        const isActive = (styleConf.dotStyle??"square") === ds.id
                        const isPro = ["pixel","neon","luxury"].includes(ds.id ?? "")
                        const canAccess = !isPro || PLAN_RANK[userPlan] >= 1
                        return (
                          <button key={ds.id ?? "sq"} type="button" onClick={() => canAccess && setStyleConf(p => ({ ...p, dotStyle: ds.id }))}
                            style={{ position:"relative", padding:"10px 8px", background:isActive?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${isActive?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius:9, cursor:canAccess?"pointer":"not-allowed", opacity:canAccess?1:0.5, textAlign:"center" as const }}>
                            <div style={{ fontSize:18, marginBottom:4 }}>{ds.emoji}</div>
                            <p style={{ color:isActive?G:"#F5F0E8", fontSize:10, fontWeight:isActive?700:500, margin:0 }}>{ds.label}</p>
                            {isPro && !canAccess && (
                              <span style={{ position:"absolute", top:4, right:4, background:"rgba(201,168,76,0.15)", borderRadius:4, padding:"1px 4px", fontSize:7, color:G, fontWeight:800 }}>PRO</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* ── COINS ───────────────────────────────────────────────────── */}
              {styleTab === "corners" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                  <div>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 10px" }}>Style des coins</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                      {CORNER_STYLE_LIST.map(cs => {
                        const isActive = (styleConf.cornerStyle??"square") === cs.id
                        const isPro = ["diamond","luxury"].includes(cs.id ?? "")
                        const canAccess = !isPro || PLAN_RANK[userPlan] >= 1
                        return (
                          <button key={cs.id ?? "sq"} type="button" onClick={() => {
                        if (!canAccess) return
                        setStyleConf(p => ({ ...p, cornerStyle: cs.id }))
                        // Sync le state corner pour le clipping canvas
                        if (cs.id === "rounded" || cs.id === "circle" || cs.id === "luxury") setCorner("rounded")
                        else if (cs.id === "minimal") setCorner("dot")
                        else setCorner("square")
                      }}
                            style={{ padding:"10px 8px", background:isActive?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${isActive?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius:9, cursor:canAccess?"pointer":"not-allowed", opacity:canAccess?1:0.5, position:"relative" as const }}>
                            <p style={{ color:isActive?G:"#F5F0E8", fontSize:11, fontWeight:isActive?700:500, margin:0, textAlign:"center" as const }}>{cs.label}</p>
                            {isPro && !canAccess && (
                              <span style={{ position:"absolute", top:4, right:4, background:"rgba(201,168,76,0.15)", borderRadius:4, padding:"1px 4px", fontSize:7, color:G, fontWeight:800 }}>PRO</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Corner style legacy (arrondi canvas) */}
                  <div>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Arrondi general</p>
                    <div style={{ display:"flex", gap:6 }}>
                      {(["square","rounded","dot"] as const).map(c => (
                        <button key={c} type="button" onClick={() => setCorner(c)}
                          style={{ flex:1, padding:"7px 6px", background:corner===c?"rgba(201,168,76,0.12)":"rgba(255,255,255,0.03)", border:`1px solid ${corner===c?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius:8, color:corner===c?G:MUTED, fontSize:10, cursor:"pointer", fontWeight:corner===c?700:400 }}>
                          {c==="square"?"Carre":c==="rounded"?"Arrondi":"Dots"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── AVANCÉ ──────────────────────────────────────────────────── */}
              {styleTab === "advanced" && (
                <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

                  {/* Marge */}
                  <div>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:7 }}>
                      <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>Marge</p>
                      <span style={{ color:G, fontSize:11, fontWeight:700 }}>{styleConf.margin ?? 10}px</span>
                    </div>
                    <input type="range" min={0} max={30} value={styleConf.margin ?? 10}
                      onChange={e => setStyleConf(p => ({ ...p, margin: Number(e.target.value) }))}
                      style={{ width:"100%", accentColor:G, cursor:"pointer" }}/>
                    <div style={{ display:"flex", justifyContent:"space-between" }}>
                      <span style={{ color:MUTED, fontSize:9 }}>0</span>
                      <span style={{ color:MUTED, fontSize:9 }}>30</span>
                    </div>
                  </div>

                  {/* Correction d'erreur */}
                  <div>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Correction erreur</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {EC_LEVELS.map(ec => {
                        const locked = (ec.id==="Q"||ec.id==="H") && !canPro
                        return (
                          <button key={ec.id} type="button" onClick={() => !locked && setEcLevel(ec.id as any)} disabled={locked}
                            style={{ position:"relative", padding:"7px 8px", background:ecLevel===ec.id?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${ecLevel===ec.id?"rgba(201,168,76,0.35)":"rgba(255,255,255,0.07)"}`, borderRadius:8, color:locked?MUTED:ecLevel===ec.id?G:"#F5F0E8", fontSize:10, cursor:locked?"not-allowed":"pointer", opacity:locked?0.5:1, textAlign:"center" as const }}>
                            <div style={{ fontWeight:700, marginBottom:1 }}>{ec.label}</div>
                            <div style={{ color:MUTED, fontSize:9 }}>{ec.desc}</div>
                            {locked && <Lock size={9} color={MUTED} style={{ position:"absolute", top:4, right:4 }}/>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Densité visuelle */}
                  <div>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Densite visuelle</p>
                    <div style={{ display:"flex", gap:6 }}>
                      {(["low","medium","high"] as const).map(d => (
                        <button key={d} type="button" onClick={() => setStyleConf(p => ({ ...p, density: d }))}
                          style={{ flex:1, padding:"7px 6px", background:(styleConf.density??"medium")===d?"rgba(201,168,76,0.12)":"rgba(255,255,255,0.03)", border:`1px solid ${(styleConf.density??"medium")===d?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius:8, color:(styleConf.density??"medium")===d?G:MUTED, fontSize:10, cursor:"pointer", fontWeight:(styleConf.density??"medium")===d?700:400 }}>
                          {d==="low"?"Faible":d==="medium"?"Normale":"Forte"}
                        </button>
                      ))}
                    </div>
                    <p style={{ color:MUTED, fontSize:10, margin:"6px 0 0", lineHeight:1.5 }}>
                      Une densite forte augmente la complexite — preferer ECC H.
                    </p>
                  </div>

                  {/* Reset */}
                  <button type="button" onClick={resetColors}
                    style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"9px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:9, color:MUTED, fontSize:12, cursor:"pointer" }}>
                    <RotateCcw size={12}/> Reinitialiser par defaut
                  </button>
                </div>
              )}
            </div>

            {/* Actions en bas */}
            <div style={{ padding:"12px 14px", borderTop:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", gap:7, flexShrink:0 }}>
              <button type="button" onClick={saveCustomization} disabled={saving}
                style={{ padding:"10px", background:saved?"rgba(57,255,143,0.12)":"linear-gradient(90deg,#C9A84C,#b8953f)", border:saved?"1px solid rgba(57,255,143,0.3)":"none", borderRadius:9, color:saved?"#39FF8F":"#080808", fontSize:12, fontWeight:700, cursor:saving?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, opacity:saving?0.7:1, transition:"all 0.2s" }}>
                {saving ? <><Loader size={12} style={{ animation:"spin 0.8s linear infinite" }}/> Enregistrement...</>
                  : saved ? <><Check size={12}/> Sauvegarde !</>
                  : <><Palette size={12}/> Enregistrer le style</>}
              </button>
              <button type="button" onClick={applyToAll}
                style={{ padding:"9px", background:applyAllOk?"rgba(57,255,143,0.1)":"rgba(255,255,255,0.03)", border:`1px solid ${applyAllOk?"rgba(57,255,143,0.25)":"rgba(255,255,255,0.08)"}`, borderRadius:9, color:applyAllOk?"#39FF8F":MUTED, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {applyAllOk ? <><Check size={11}/> Applique a tous !</> : <><Settings size={11}/> Appliquer a tous mes QR</>}
              </button>
            </div>
          </div>
        )}

        {/* ── Export tab ────────────────────────────────────────────────────── */}
        {activeTab === "export" && active && (
          <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              <div>
                <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Liens</p>
                {([
                  { label:"Lien de scan", val:qrUrl,   type:"short" as const, icon:<Link size={12}/> },
                  { label:"Lien de page", val:pageUrl, type:"link"  as const, icon:<ExternalLink size={12}/> },
                ]).map(l => (
                  <div key={l.type} style={{ marginBottom:8 }}>
                    <label style={{ color:MUTED, fontSize:10, display:"block", marginBottom:4 }}>{l.label}</label>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <code style={{ flex:1, background:"#111009", border:"1px solid rgba(255,255,255,0.07)", borderRadius:7, padding:"7px 9px", color:G, fontSize:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{l.val}</code>
                      <button type="button" onClick={() => copy(l.type)}
                        style={{ width:28, height:28, background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:copied===l.type?"#39FF8F":MUTED, flexShrink:0 }}>
                        {copied===l.type ? <Check size={11}/> : <Copy size={11}/>}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Telecharger</p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  <button type="button" onClick={() => downloadPNG(400)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", border:"none", borderRadius:9, color:"#080808", fontSize:12, fontWeight:700, cursor:"pointer" }}>
                    <Download size={13}/> PNG 400x400
                  </button>
                  <button type="button" onClick={() => canPro && downloadPNG(1200)}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:canPro?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.03)", border:`1px solid ${canPro?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.07)"}`, borderRadius:9, color:canPro?G:MUTED, fontSize:12, cursor:canPro?"pointer":"not-allowed" }}>
                    {!canPro && <Lock size={12}/>}<Download size={13}/> HD 1200x1200 {!canPro && "- Pro"}
                  </button>
                  <button type="button" onClick={() => canPro && downloadSVG()}
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 14px", background:canPro?"rgba(57,255,143,0.08)":"rgba(255,255,255,0.03)", border:`1px solid ${canPro?"rgba(57,255,143,0.25)":"rgba(255,255,255,0.07)"}`, borderRadius:9, color:canPro?"#39FF8F":MUTED, fontSize:12, cursor:canPro?"pointer":"not-allowed" }}>
                    {!canPro && <Lock size={12}/>}<Share2 size={13}/> SVG {!canPro && "- Pro"}
                  </button>
                </div>
              </div>
              {!canPro && (
                <div style={{ padding:"12px 14px", background:"rgba(201,168,76,0.05)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:10 }}>
                  <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:600, margin:"0 0 5px" }}>Debloquer les exports HD</p>
                  <a href="/dashboard/upgrade" style={{ display:"inline-block", background:"linear-gradient(90deg,#C9A84C,#b8953f)", color:"#080808", textDecoration:"none", fontSize:11, fontWeight:700, padding:"6px 14px", borderRadius:7 }}>Passer Pro</a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
