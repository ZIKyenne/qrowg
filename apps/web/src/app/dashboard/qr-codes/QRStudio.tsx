"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import {
  QrCode, Download, Link, Check, Lock, Pencil,
  Eye, EyeOff, ChevronRight, Scan, Clock,
  Palette, Settings, Share2, ExternalLink, Copy,
  RotateCcw, Loader, Search, Trash2, Archive,
  MoreVertical, AlertTriangle, X,
  Image, FileText, Maximize2, Clipboard, Sliders,
  Printer, LayoutGrid, TrendingUp, TrendingDown, BarChart2
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
  const [activeTab,  setActiveTab]  = useState<"style" | "supports" | "export">("style")
  const [fg,         setFg]         = useState("")
  const [bg,         setBg]         = useState("")
  const [corner,     setCorner]     = useState<"square"|"rounded"|"dot">("square")
  const [ecLevel,    setEcLevel]    = useState<"L"|"M"|"Q"|"H">("M")
  const [styleConf,  setStyleConf]  = useState<QRStyleConfig>({ ...DEFAULT_STYLE })
  const [styleTab,   setStyleTab]   = useState<"colors"|"logo"|"style"|"corners"|"advanced">("colors")
  const [applyAllOk,   setApplyAllOk]   = useState(false)
  const [selectedCat,  setSelectedCat]  = useState("all")
  const [upsellPreset,  setUpsellPreset]  = useState<string | null>(null)
  const [expFormat,     setExpFormat]     = useState<"png"|"png-t"|"webp"|"svg"|"pdf">("png")
  const [expSize,       setExpSize]       = useState<512|1024|2048|4096|"custom">(1024)
  const [expCustomSize, setExpCustomSize] = useState(1024)
  const [expMargin,     setExpMargin]     = useState(10)
  const [expFilename,   setExpFilename]   = useState("")
  const [expIncludeName,setExpIncludeName]= useState(false)
  const [expIncludeUrl, setExpIncludeUrl] = useState(false)
  const [expExporting,  setExpExporting]  = useState(false)
  const [expCopied,     setExpCopied]     = useState<string | null>(null)
  // ── Types stats ─────────────────────────────────────────────────────────
  type QRStats = {
    total: number; current: number; prev: number; evolution: number
    last_scan: string | null; top_device: string | null; top_country: string | null
    sparkline: number[]; period: number; created_at: string
  }

  const exportCanvasRef   = useRef<HTMLCanvasElement>(null)
  const supportCanvasRef  = useRef<HTMLCanvasElement>(null)
  const sparkCanvasRef    = useRef<HTMLCanvasElement>(null)
  const [stats,         setStats]         = useState<QRStats | null>(null)
  const [statsLoading,  setStatsLoading]  = useState(false)
  const [statsPeriod,   setStatsPeriod]   = useState<7|30>(7)
  const [statsExporting,setStatsExporting]= useState(false)
  const [suppTplId,   setSuppTplId]   = useState("a4-poster")
  const [suppTitle,   setSuppTitle]   = useState("")
  const [suppSubtitle,setSuppSubtitle]= useState("Scannez pour voir le menu")
  const [suppRendered,setSuppRendered]= useState(false)
  const [suppExporting,setSuppExporting]=useState(false)
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

  // Charger stats QR au changement de sélection ou période
  useEffect(() => {
    if (!activeId) return
    setStats(null)
    setStatsLoading(true)
    fetch(`/api/qr-stats/${activeId}?period=${statsPeriod}`)
      .then(r => r.json())
      .then(d => { if (!d.error) setStats(d) })
      .catch(() => {})
      .finally(() => setStatsLoading(false))
  }, [activeId, statsPeriod])

  // Dessiner la sparkline quand stats change
  useEffect(() => {
    const canvas = sparkCanvasRef.current
    if (!canvas || !stats?.sparkline?.length) return
    const ctx   = canvas.getContext("2d"); if (!ctx) return
    const data  = stats.sparkline
    const W     = canvas.offsetWidth || 260
    const H     = 48
    canvas.width  = W * 2; canvas.height = H * 2
    ctx.scale(2, 2)
    ctx.clearRect(0, 0, W, H)
    const max   = Math.max(...data, 1)
    const step  = W / (data.length - 1 || 1)
    const pts   = data.map((v, i) => [i * step, H - 4 - (v / max) * (H - 10)] as [number,number])
    // Zone de remplissage
    const grad  = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, "rgba(201,168,76,0.3)")
    grad.addColorStop(1, "rgba(201,168,76,0)")
    ctx.beginPath()
    ctx.moveTo(pts[0][0], H)
    pts.forEach(([x,y]) => ctx.lineTo(x, y))
    ctx.lineTo(pts[pts.length-1][0], H)
    ctx.closePath()
    ctx.fillStyle = grad; ctx.fill()
    // Ligne
    ctx.beginPath()
    pts.forEach(([x,y], i) => i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y))
    ctx.strokeStyle = "#C9A84C"; ctx.lineWidth = 1.5
    ctx.lineJoin = "round"; ctx.stroke()
    // Points
    pts.forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI*2)
      ctx.fillStyle = "#C9A84C"; ctx.fill()
    })
  }, [stats])

  // Export CSV des scans
  async function exportQRCSV() {
    if (!active || !stats) return
    setStatsExporting(true)
    try {
      const res  = await fetch(`/api/qr-stats/${activeId}?period=30`)
      const d    = await res.json()
      const rows = d.sparkline?.map((v: number, i: number) => {
        const date = new Date(); date.setDate(date.getDate() - 30 + i)
        return `${date.toLocaleDateString("fr-FR")},${v}`
      }) ?? []
      const csv  = ["Date,Scans", ...rows].join("\r\n")
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement("a")
      a.href = url; a.download = `scans-${active.short_code}.csv`; a.click()
      URL.revokeObjectURL(url)
    } catch {}
    setStatsExporting(false)
  }

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

  // ── Nom de fichier auto ────────────────────────────────────────────────────
  function getFilename(ext: string): string {
    const base = expFilename.trim() || active?.pages?.title?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || active?.short_code || "qr"
    return `${base}.${ext}`
  }

  // ── Construire canvas export à la taille voulue (avec logo) ────────────────
  async function buildExportCanvas(px: number, transparent: boolean): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      canvas.width = px; canvas.height = px
      const ctx    = canvas.getContext("2d")!
      const margin = expMargin

      // URL QR à la bonne taille
      const fgH  = fg.replace("#","")
      const bgH  = transparent ? "ffffff00" : (styleConf.transparent ? "ffffff00" : bg.replace("#",""))
      const url  = `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(qrUrl)}&color=${fgH}&bgcolor=ffffff&ecc=${effectiveEcc}&margin=${margin}`

      const img  = new Image(); img.crossOrigin = "anonymous"
      img.onerror = () => reject(new Error("QR load failed"))
      img.onload  = () => {
        ctx.clearRect(0, 0, px, px)
        // Fond
        if (!transparent && !styleConf.transparent) {
          if (styleConf.gradient !== "none" && styleConf.gradientBg) {
            const grad = styleConf.gradient === "radial"
              ? ctx.createRadialGradient(px/2,px/2,0,px/2,px/2,px/2)
              : ctx.createLinearGradient(styleConf.gradient==="diagonal"?0:0,0,styleConf.gradient==="diagonal"?px:0,px)
            grad.addColorStop(0, bg); grad.addColorStop(1, styleConf.gradientBg)
            ctx.fillStyle = grad
          } else { ctx.fillStyle = bg }
          ctx.fillRect(0, 0, px, px)
        }
        // QR + dégradé
        if (styleConf.gradient !== "none" && styleConf.fg2) {
          ctx.drawImage(img, 0, 0, px, px)
          const grad = styleConf.gradient === "radial"
            ? ctx.createRadialGradient(px/2,px/2,0,px/2,px/2,px/2)
            : ctx.createLinearGradient(styleConf.gradient==="diagonal"?0:0,0,styleConf.gradient==="diagonal"?px:0,px)
          grad.addColorStop(0, fg); grad.addColorStop(1, styleConf.fg2)
          ctx.globalCompositeOperation = "multiply"
          ctx.fillStyle = grad; ctx.fillRect(0, 0, px, px)
          ctx.globalCompositeOperation = "source-over"
        } else { ctx.drawImage(img, 0, 0, px, px) }

        // Bandeau bas: nom page + URL
        let bannerH = 0
        if (expIncludeName || expIncludeUrl) {
          bannerH = Math.round(px * 0.08)
          ctx.fillStyle = "rgba(0,0,0,0.7)"
          ctx.fillRect(0, px - bannerH, px, bannerH)
          ctx.fillStyle = "#F5F0E8"
          const fSize = Math.round(bannerH * 0.32)
          ctx.font = `600 ${fSize}px 'DM Sans', Arial, sans-serif`
          ctx.textAlign = "center"
          if (expIncludeName && active?.pages?.title) {
            ctx.fillText(active.pages.title, px/2, px - bannerH + fSize*1.1, px*0.9)
          }
          if (expIncludeUrl) {
            ctx.fillStyle = "#C9A84C"; ctx.font = `400 ${Math.round(fSize*0.8)}px monospace`
            ctx.fillText(qrUrl, px/2, px - bannerH + (expIncludeName?fSize*2.2:fSize*1.5), px*0.9)
          }
          ctx.textAlign = "start"
        }

        // Logo
        if (styleConf.logoUrl) {
          const logoImg = new Image(); logoImg.crossOrigin = "anonymous"
          logoImg.onload = () => {
            const ratio = Math.min((styleConf.logoSize ?? 18)/100, 0.30)
            const size  = px * ratio; const pad = (styleConf.logoPadding ?? 4) * (px/400)
            const bgSz  = size + pad*2; const cx  = px/2; const cy = (px - bannerH)/2
            const r     = styleConf.logoShape === "circle" ? bgSz/2 : styleConf.logoShape === "rounded" ? bgSz*0.2 : 0
            if (styleConf.logoBg !== "transparent") {
              ctx.save(); ctx.beginPath()
              if (r > 0) {
                ctx.moveTo(cx-bgSz/2+r,cy-bgSz/2); ctx.lineTo(cx+bgSz/2-r,cy-bgSz/2)
                ctx.quadraticCurveTo(cx+bgSz/2,cy-bgSz/2,cx+bgSz/2,cy-bgSz/2+r)
                ctx.lineTo(cx+bgSz/2,cy+bgSz/2-r); ctx.quadraticCurveTo(cx+bgSz/2,cy+bgSz/2,cx+bgSz/2-r,cy+bgSz/2)
                ctx.lineTo(cx-bgSz/2+r,cy+bgSz/2); ctx.quadraticCurveTo(cx-bgSz/2,cy+bgSz/2,cx-bgSz/2,cy+bgSz/2-r)
                ctx.lineTo(cx-bgSz/2,cy-bgSz/2+r); ctx.quadraticCurveTo(cx-bgSz/2,cy-bgSz/2,cx-bgSz/2+r,cy-bgSz/2)
                ctx.closePath()
              } else { ctx.rect(cx-bgSz/2,cy-bgSz/2,bgSz,bgSz) }
              ctx.fillStyle = styleConf.logoBg==="custom"?(styleConf.logoBgColor??"#FFF"):styleConf.logoBg==="black"?"#000":"#FFF"
              ctx.fill(); ctx.restore()
            }
            ctx.save(); ctx.beginPath()
            if (styleConf.logoShape==="circle") { ctx.arc(cx,cy,size/2,0,Math.PI*2) }
            else if (styleConf.logoShape==="rounded") {
              const rr=size*0.2; ctx.moveTo(cx-size/2+rr,cy-size/2); ctx.lineTo(cx+size/2-rr,cy-size/2)
              ctx.quadraticCurveTo(cx+size/2,cy-size/2,cx+size/2,cy-size/2+rr); ctx.lineTo(cx+size/2,cy+size/2-rr)
              ctx.quadraticCurveTo(cx+size/2,cy+size/2,cx+size/2-rr,cy+size/2); ctx.lineTo(cx-size/2+rr,cy+size/2)
              ctx.quadraticCurveTo(cx-size/2,cy+size/2,cx-size/2,cy+size/2-rr); ctx.lineTo(cx-size/2,cy-size/2+rr)
              ctx.quadraticCurveTo(cx-size/2,cy-size/2,cx-size/2+rr,cy-size/2); ctx.closePath()
            } else { ctx.rect(cx-size/2,cy-size/2,size,size) }
            ctx.clip(); ctx.drawImage(logoImg,cx-size/2,cy-size/2,size,size); ctx.restore()
            resolve(canvas)
          }
          logoImg.onerror = () => resolve(canvas)
          logoImg.src = styleConf.logoUrl
        } else { resolve(canvas) }
      }
      img.src = url
    })
  }

  // ── Templates supports imprimables ─────────────────────────────────────────
  type SuppTpl = {
    id: string; label: string; emoji: string; w: number; h: number
    plan: string; cat: string; desc: string
  }

  const SUPP_TPLS: SuppTpl[] = [
    { id:"qr-only",     label:"QR seul",           emoji:"⬛", w:800,  h:800,  plan:"free",     cat:"Base",       desc:"QR Code sans decoration" },
    { id:"a4-poster",   label:"Affiche A4",         emoji:"📋", w:795,  h:1122, plan:"free",     cat:"Print",      desc:"Portrait A4 avec titre et fond" },
    { id:"flyer",       label:"Flyer",              emoji:"📄", w:795,  h:561,  plan:"free",     cat:"Print",      desc:"Demi A4 paysage" },
    { id:"sticker",     label:"Sticker vitrine",    emoji:"🏷️",  w:600,  h:600,  plan:"free",     cat:"Print",      desc:"Carre 6cm avec cadre" },
    { id:"table-card",  label:"Carte de table",     emoji:"🪧",  w:900,  h:506,  plan:"pro",      cat:"Restaurant", desc:"Format paysage 9x5cm" },
    { id:"menu-qr",     label:"Menu QR",            emoji:"🍽",  w:600,  h:900,  plan:"pro",      cat:"Restaurant", desc:"Carte portrait avec titre menu" },
    { id:"business",    label:"Carte de visite",    emoji:"💳", w:1063, h:591,  plan:"pro",      cat:"Business",   desc:"Format CR80 standard" },
    { id:"event-badge", label:"Badge evenement",    emoji:"🎫", w:680,  h:400,  plan:"pro",      cat:"Event",      desc:"Badge horizontal 85x50mm" },
    { id:"story",       label:"Story Instagram",    emoji:"📱", w:1080, h:1920, plan:"business", cat:"Social",     desc:"9:16 vertical stories" },
    { id:"post",        label:"Post Instagram",     emoji:"🟫", w:1080, h:1080, plan:"business", cat:"Social",     desc:"Carre 1:1" },
  ]

  // ── Rendu d'un support sur canvas ────────────────────────────────────────
  async function renderSupport(
    canvas: HTMLCanvasElement,
    tpl: SuppTpl,
    opts: { title: string; subtitle: string; qrDataUrl: string; logoUrl?: string; scale?: number }
  ): Promise<void> {
    const sc  = opts.scale ?? 1
    const w   = Math.round(tpl.w * sc)
    const h   = Math.round(tpl.h * sc)
    canvas.width  = w
    canvas.height = h
    const ctx = canvas.getContext("2d")!
    ctx.clearRect(0, 0, w, h)

    const fgColor  = fg || "#080808"
    const bgColor  = bg || "#FFFFFF"
    const isDark   = parseInt(bgColor.replace("#","").slice(0,2), 16) < 128
    const textCol  = isDark ? "#F5F0E8" : "#1A1A1A"
    const accentCol= fgColor
    const gold     = "#C9A84C"

    const loadImg  = (src: string): Promise<HTMLImageElement> =>
      new Promise((res, rej) => {
        const i = new Image(); i.crossOrigin = "anonymous"
        i.onload = () => res(i); i.onerror = () => rej(); i.src = src
      })

    // Charger le QR
    const qrImg = await loadImg(opts.qrDataUrl).catch(() => null)

    // ── QR seul ────────────────────────────────────────────────────────────
    if (tpl.id === "qr-only") {
      if (qrImg) ctx.drawImage(qrImg, 0, 0, w, h)
      return
    }

    // ── Fond commun ────────────────────────────────────────────────────────
    if (tpl.id === "story" || tpl.id === "post") {
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, bgColor); grad.addColorStop(1, isDark ? "#0A0A0A" : "#E8E8E8")
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = bgColor
    }
    ctx.fillRect(0, 0, w, h)

    // ── Bande de couleur latérale (sauf social) ────────────────────────────
    if (!["story","post","qr-only"].includes(tpl.id)) {
      ctx.fillStyle = fgColor
      const bw = Math.round(w * 0.04)
      ctx.fillRect(0, 0, bw, h)
    }

    // ── Templates spécifiques ─────────────────────────────────────────────
    const pad    = Math.round(w * 0.06)
    const bw     = Math.round(w * 0.04)  // largeur bande

    const drawQR = (x: number, y: number, size: number) => {
      if (!qrImg) return
      // Fond blanc derrière le QR si fond sombre
      if (isDark) {
        ctx.fillStyle = "#FFFFFF"
        const margin = Math.round(size * 0.04)
        ctx.fillRect(x - margin, y - margin, size + margin*2, size + margin*2)
      }
      ctx.drawImage(qrImg, x, y, size, size)
    }

    const drawTitle = (text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left", maxW?: number) => {
      if (!text) return
      ctx.fillStyle = color; ctx.font = `700 ${size}px 'Arial', sans-serif`; ctx.textAlign = align
      ctx.fillText(text, x, y, maxW ?? w * 0.9)
      ctx.textAlign = "left"
    }

    const drawSub = (text: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "left") => {
      if (!text) return
      ctx.fillStyle = color; ctx.font = `400 ${size}px 'Arial', sans-serif`; ctx.textAlign = align
      ctx.fillText(text, x, y, w * 0.85)
      ctx.textAlign = "left"
    }

    const drawAccentLine = (x: number, y: number, lineW: number) => {
      ctx.fillStyle = accentCol
      ctx.fillRect(x, y, lineW, Math.max(3, Math.round(w * 0.005)))
    }

    // ── A4 Poster ──────────────────────────────────────────────────────────
    if (tpl.id === "a4-poster") {
      const qrSize = Math.round(w * 0.52)
      const qrX    = bw + pad
      const qrY    = Math.round(h * 0.28)
      drawAccentLine(bw + pad, Math.round(h * 0.07), Math.round(w * 0.2))
      drawTitle(opts.title || active?.pages?.title || "", bw + pad, Math.round(h * 0.13), Math.round(w * 0.045), textCol, "left", w - bw - pad*2)
      drawSub(opts.subtitle, bw + pad, Math.round(h * 0.19), Math.round(w * 0.03), accentCol)
      drawQR(qrX + (w - bw - pad*2 - qrSize)/2, qrY, qrSize)
      drawSub(qrUrl, w/2, Math.round(h * 0.89), Math.round(w * 0.022), isDark ? "rgba(245,240,232,0.5)" : "rgba(26,26,26,0.4)", "center")
      ctx.fillStyle = accentCol; ctx.fillRect(bw, h - Math.round(h*0.04), w - bw, Math.round(h*0.04))
    }

    // ── Flyer ──────────────────────────────────────────────────────────────
    else if (tpl.id === "flyer") {
      const qrSize = Math.round(h * 0.72)
      const qrX    = w - qrSize - pad
      const qrY    = Math.round((h - qrSize) / 2)
      const txtX   = bw + pad
      ctx.fillStyle = fgColor; ctx.fillRect(w - qrSize - pad*2, 0, Math.round(w * 0.004), h)
      drawTitle(opts.title || active?.pages?.title || "", txtX, Math.round(h * 0.32), Math.round(w * 0.038), textCol, "left", qrX - txtX - pad)
      drawAccentLine(txtX, Math.round(h * 0.37), Math.round(w * 0.15))
      drawSub(opts.subtitle, txtX, Math.round(h * 0.55), Math.round(w * 0.026), accentCol)
      drawQR(qrX, qrY, qrSize)
    }

    // ── Sticker ────────────────────────────────────────────────────────────
    else if (tpl.id === "sticker") {
      const r = Math.round(w * 0.08)
      ctx.save(); ctx.beginPath()
      ctx.moveTo(r,0); ctx.lineTo(w-r,0); ctx.quadraticCurveTo(w,0,w,r)
      ctx.lineTo(w,h-r); ctx.quadraticCurveTo(w,h,w-r,h)
      ctx.lineTo(r,h); ctx.quadraticCurveTo(0,h,0,h-r)
      ctx.lineTo(0,r); ctx.quadraticCurveTo(0,0,r,0); ctx.closePath()
      ctx.clip()
      ctx.fillStyle = bgColor; ctx.fillRect(0, 0, w, h)
      // Bordure accent
      ctx.strokeStyle = accentCol; ctx.lineWidth = Math.round(w * 0.025)
      ctx.beginPath()
      ctx.moveTo(r,0); ctx.lineTo(w-r,0); ctx.quadraticCurveTo(w,0,w,r)
      ctx.lineTo(w,h-r); ctx.quadraticCurveTo(w,h,w-r,h)
      ctx.lineTo(r,h); ctx.quadraticCurveTo(0,h,0,h-r)
      ctx.lineTo(0,r); ctx.quadraticCurveTo(0,0,r,0); ctx.closePath(); ctx.stroke()
      ctx.restore()
      const qrSize = Math.round(w * 0.62)
      drawQR((w - qrSize)/2, Math.round(h * 0.12), qrSize)
      drawSub(opts.subtitle, w/2, Math.round(h * 0.88), Math.round(w * 0.038), accentCol, "center")
    }

    // ── Carte de table ─────────────────────────────────────────────────────
    else if (tpl.id === "table-card") {
      const qrSize = Math.round(h * 0.7)
      const qrY    = Math.round((h - qrSize) / 2)
      const qrX    = w - qrSize - pad
      ctx.fillStyle = fgColor
      ctx.fillRect(0, 0, w, Math.round(h * 0.08))
      ctx.fillRect(0, h - Math.round(h*0.08), w, Math.round(h * 0.08))
      const txtX   = bw + pad
      drawTitle(opts.title || active?.pages?.title || "", txtX, Math.round(h * 0.38), Math.round(h * 0.09), textCol, "left", qrX - txtX - pad)
      drawAccentLine(txtX, Math.round(h * 0.44), Math.round(w * 0.1))
      drawSub(opts.subtitle, txtX, Math.round(h * 0.6), Math.round(h * 0.065), accentCol)
      drawQR(qrX, qrY, qrSize)
    }

    // ── Menu QR ────────────────────────────────────────────────────────────
    else if (tpl.id === "menu-qr") {
      const headerH = Math.round(h * 0.22)
      ctx.fillStyle = fgColor; ctx.fillRect(0, 0, w, headerH)
      const qrSize  = Math.round(w * 0.62)
      drawTitle(opts.title || active?.pages?.title || "Notre Menu", w/2, Math.round(headerH * 0.55), Math.round(w * 0.055), bgColor, "center", w * 0.85)
      drawSub(opts.subtitle, w/2, Math.round(headerH * 0.80), Math.round(w * 0.034), isDark ? "rgba(201,168,76,0.85)" : "rgba(255,255,255,0.75)", "center")
      drawQR((w - qrSize)/2, Math.round(h * 0.3), qrSize)
      drawSub(qrUrl, w/2, Math.round(h * 0.93), Math.round(w * 0.027), isDark ? "rgba(245,240,232,0.4)" : "rgba(26,26,26,0.35)", "center")
      ctx.fillStyle = fgColor; ctx.fillRect(0, h - Math.round(h*0.035), w, Math.round(h*0.035))
    }

    // ── Carte de visite ────────────────────────────────────────────────────
    else if (tpl.id === "business") {
      const qrSize  = Math.round(h * 0.72)
      const qrX     = w - qrSize - pad
      const qrY     = Math.round((h - qrSize) / 2)
      ctx.fillStyle = fgColor; ctx.fillRect(0, 0, Math.round(w * 0.38), h)
      ctx.fillStyle = bgColor
      const lx = Math.round(w * 0.19); const ly = Math.round(h * 0.3)
      drawTitle(opts.title || active?.pages?.title || "", lx, ly, Math.round(h * 0.11), isDark?"#F5F0E8":"#FFFFFF", "center", Math.round(w * 0.32))
      ctx.fillStyle = isDark ? "rgba(201,168,76,0.8)" : "rgba(255,255,255,0.6)"
      ctx.fillRect(lx - Math.round(w * 0.05), ly + Math.round(h*0.04), Math.round(w * 0.14), Math.round(h*0.007))
      drawSub(opts.subtitle, lx, Math.round(h * 0.67), Math.round(h * 0.07), isDark?"rgba(201,168,76,0.9)":"rgba(255,255,255,0.8)", "center")
      drawQR(qrX, qrY, qrSize)
    }

    // ── Badge événement ────────────────────────────────────────────────────
    else if (tpl.id === "event-badge") {
      const qrSize  = Math.round(h * 0.68)
      const qrX     = Math.round(w * 0.52)
      const qrY     = Math.round((h - qrSize) / 2)
      ctx.fillStyle = fgColor; ctx.fillRect(0, 0, w, Math.round(h * 0.14))
      ctx.fillStyle = fgColor; ctx.fillRect(0, h - Math.round(h*0.14), w, Math.round(h*0.14))
      drawTitle(opts.title || active?.pages?.title || "", pad, Math.round(h * 0.44), Math.round(h * 0.1), textCol, "left", qrX - pad - Math.round(w*0.03))
      drawAccentLine(pad, Math.round(h * 0.51), Math.round(w * 0.12))
      drawSub(opts.subtitle, pad, Math.round(h * 0.68), Math.round(h * 0.075), accentCol)
      drawQR(qrX, qrY, qrSize)
    }

    // ── Story Instagram ────────────────────────────────────────────────────
    else if (tpl.id === "story") {
      const qrSize  = Math.round(w * 0.55)
      const qrY     = Math.round(h * 0.35)
      ctx.fillStyle = fgColor + "22"
      ctx.fillRect(0, 0, w, Math.round(h * 0.28))
      ctx.fillRect(0, Math.round(h * 0.72), w, Math.round(h * 0.28))
      drawTitle(opts.title || active?.pages?.title || "", w/2, Math.round(h * 0.12), Math.round(w * 0.055), textCol, "center", w * 0.82)
      drawAccentLine(Math.round(w*0.3), Math.round(h * 0.16), Math.round(w * 0.4))
      drawSub(opts.subtitle, w/2, Math.round(h * 0.21), Math.round(w * 0.038), accentCol, "center")
      drawQR((w - qrSize)/2, qrY, qrSize)
      drawSub(qrUrl, w/2, Math.round(h * 0.82), Math.round(w * 0.028), isDark?"rgba(245,240,232,0.5)":"rgba(26,26,26,0.4)", "center")
      ctx.fillStyle = accentCol
      ctx.fillRect(Math.round(w*0.1), Math.round(h*0.87), Math.round(w*0.8), Math.round(h*0.005))
    }

    // ── Post Instagram ─────────────────────────────────────────────────────
    else if (tpl.id === "post") {
      const qrSize  = Math.round(w * 0.52)
      ctx.fillStyle = fgColor + "18"; ctx.fillRect(0, 0, w, h)
      drawTitle(opts.title || active?.pages?.title || "", w/2, Math.round(h * 0.14), Math.round(w * 0.052), textCol, "center", w * 0.82)
      drawAccentLine(Math.round(w*0.35), Math.round(h * 0.18), Math.round(w * 0.3))
      drawSub(opts.subtitle, w/2, Math.round(h * 0.24), Math.round(w * 0.036), accentCol, "center")
      drawQR((w - qrSize)/2, Math.round(h * 0.31), qrSize)
      drawSub(qrUrl, w/2, Math.round(h * 0.91), Math.round(w * 0.026), isDark?"rgba(245,240,232,0.4)":"rgba(26,26,26,0.35)", "center")
      ctx.strokeStyle = accentCol + "40"; ctx.lineWidth = Math.round(w * 0.018)
      ctx.strokeRect(Math.round(w*0.009), Math.round(h*0.009), w - Math.round(w*0.018), h - Math.round(h*0.018))
    }
  }

  // ── Générer preview support ───────────────────────────────────────────────
  async function previewSupport() {
    const canvas = supportCanvasRef.current; if (!canvas) return
    const tpl    = SUPP_TPLS.find(t => t.id === suppTplId)
    if (!tpl) return
    setSuppRendered(false)
    try {
      // Générer le QR à la bonne taille
      const qrPx    = Math.min(tpl.w, tpl.h)
      const qrUrl2  = buildQRUrl(qrPx)
      const qrImg   = new Image(); qrImg.crossOrigin = "anonymous"
      await new Promise<void>((res, rej) => { qrImg.onload = () => res(); qrImg.onerror = () => rej(); qrImg.src = qrUrl2 })
      const tmpC    = document.createElement("canvas")
      tmpC.width = qrPx; tmpC.height = qrPx
      const tmpCtx  = tmpC.getContext("2d")!
      // Dessiner QR avec fond/dégradé/logo
      tmpCtx.fillStyle = bg; tmpCtx.fillRect(0, 0, qrPx, qrPx)
      tmpCtx.drawImage(qrImg, 0, 0, qrPx, qrPx)
      if (styleConf.logoUrl) {
        const logoI = new Image(); logoI.crossOrigin = "anonymous"
        await new Promise<void>((res) => { logoI.onload = () => res(); logoI.onerror = () => res(); logoI.src = styleConf.logoUrl! })
        const ls = Math.round(qrPx * Math.min((styleConf.logoSize??18)/100, 0.28))
        tmpCtx.drawImage(logoI, (qrPx-ls)/2, (qrPx-ls)/2, ls, ls)
      }
      const qrDataUrl = tmpC.toDataURL("image/png")
      // Scale pour la preview (max 300px de large)
      const previewScale = Math.min(1, 280 / tpl.w)
      await renderSupport(canvas, tpl, { title:suppTitle, subtitle:suppSubtitle, qrDataUrl, logoUrl:styleConf.logoUrl, scale:previewScale })
      setSuppRendered(true)
    } catch { setSuppRendered(false) }
  }

  // ── Export support ────────────────────────────────────────────────────────
  async function exportSupport(fmt: "png"|"pdf") {
    const tpl = SUPP_TPLS.find(t => t.id === suppTplId); if (!tpl) return
    setSuppExporting(true)
    try {
      const qrPx    = Math.min(tpl.w, tpl.h) * 2
      const qrUrl2  = buildQRUrl(qrPx)
      const qrImg   = new Image(); qrImg.crossOrigin = "anonymous"
      await new Promise<void>((res, rej) => { qrImg.onload = () => res(); qrImg.onerror = () => rej(); qrImg.src = qrUrl2 })
      const tmpC    = document.createElement("canvas")
      tmpC.width = qrPx; tmpC.height = qrPx
      const tmpCtx  = tmpC.getContext("2d")!
      tmpCtx.fillStyle = bg; tmpCtx.fillRect(0, 0, qrPx, qrPx)
      tmpCtx.drawImage(qrImg, 0, 0, qrPx, qrPx)
      if (styleConf.logoUrl) {
        const logoI = new Image(); logoI.crossOrigin = "anonymous"
        await new Promise<void>((res) => { logoI.onload = () => res(); logoI.onerror = () => res(); logoI.src = styleConf.logoUrl! })
        const ls = Math.round(qrPx * Math.min((styleConf.logoSize??18)/100, 0.28))
        tmpCtx.drawImage(logoI, (qrPx-ls)/2, (qrPx-ls)/2, ls, ls)
      }
      const qrDataUrl = tmpC.toDataURL("image/png")
      const outCanvas = document.createElement("canvas")
      await renderSupport(outCanvas, tpl, { title:suppTitle, subtitle:suppSubtitle, qrDataUrl, scale:2 })
      const filename  = `${(tpl.label).replace(/\s+/g,"-").toLowerCase()}-${active?.short_code ?? "qr"}.${fmt}`
      if (fmt === "pdf") {
        const dpr = window.devicePixelRatio || 1
        const dataUrl = outCanvas.toDataURL("image/png", 1.0)
        const isPort  = tpl.h > tpl.w
        const pw = isPort ? 595 : 842; const ph = isPort ? 842 : 595
        const pdfC = document.createElement("canvas")
        pdfC.width = pw; pdfC.height = ph
        const pdfCtx = pdfC.getContext("2d")!
        pdfCtx.fillStyle = "#FFFFFF"; pdfCtx.fillRect(0, 0, pw, ph)
        const img2 = new Image(); img2.src = dataUrl
        await new Promise<void>(r => { img2.onload = () => r() })
        const ratio   = Math.min(pw / outCanvas.width, ph / outCanvas.height)
        const iw = outCanvas.width * ratio; const ih = outCanvas.height * ratio
        pdfCtx.drawImage(img2, (pw-iw)/2, (ph-ih)/2, iw, ih)
        const a = document.createElement("a"); a.href = pdfC.toDataURL("image/png",1.0); a.download = filename; a.click()
      } else {
        const a = document.createElement("a"); a.href = outCanvas.toDataURL("image/png",1.0); a.download = filename; a.click()
      }
    } catch (e) { console.error("Export support error:", e) }
    setSuppExporting(false)
  }

    // ── Export principal ───────────────────────────────────────────────────────
  async function runExport() {
    if (!active || expExporting) return
    setExpExporting(true)
    try {
      const px          = expSize === "custom" ? Math.max(256, Math.min(8192, expCustomSize)) : expSize
      const isTransparent = expFormat === "png-t"
      const canvas      = await buildExportCanvas(px, isTransparent)

      if (expFormat === "svg") {
        // SVG via qrserver (vecteur pur)
        const svgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${px}x${px}&data=${encodeURIComponent(qrUrl)}&color=${fg.replace("#","")}&bgcolor=${bg.replace("#","")}&ecc=${effectiveEcc}&margin=${expMargin}&format=svg`
        const resp   = await fetch(svgUrl)
        const text   = await resp.text()
        const blob   = new Blob([text], { type: "image/svg+xml" })
        const url    = URL.createObjectURL(blob)
        const a      = document.createElement("a"); a.href = url; a.download = getFilename("svg"); a.click()
        URL.revokeObjectURL(url)

      } else if (expFormat === "pdf") {
        // PDF via canvas → data URL → lien download (simple iframe)
        const dataUrl = canvas.toDataURL("image/png", 1.0)
        // Créer un PDF A4 avec le QR centré via jsPDF-like en pur canvas
        const pdfCanvas = document.createElement("canvas")
        const dpi = 96; const a4w = Math.round(8.27 * dpi); const a4h = Math.round(11.69 * dpi)
        pdfCanvas.width = a4w; pdfCanvas.height = a4h
        const pdfCtx = pdfCanvas.getContext("2d")!
        pdfCtx.fillStyle = "#FFFFFF"; pdfCtx.fillRect(0, 0, a4w, a4h)
        const imgEl = new Image(); imgEl.src = dataUrl
        await new Promise<void>(r => { imgEl.onload = () => r() })
        const qrDisplaySize = Math.min(a4w * 0.7, a4h * 0.5)
        const qrX = (a4w - qrDisplaySize) / 2; const qrY = (a4h - qrDisplaySize) / 2 - 40
        pdfCtx.drawImage(imgEl, qrX, qrY, qrDisplaySize, qrDisplaySize)
        // Titre + URL
        pdfCtx.fillStyle = "#1A1A1A"; pdfCtx.font = `bold 22px Arial`; pdfCtx.textAlign = "center"
        pdfCtx.fillText(active?.pages?.title ?? "", a4w/2, qrY - 24, a4w*0.8)
        pdfCtx.fillStyle = "#C9A84C"; pdfCtx.font = `14px monospace`
        pdfCtx.fillText(qrUrl, a4w/2, qrY + qrDisplaySize + 30, a4w*0.8)
        pdfCtx.textAlign = "start"
        const pdfData = pdfCanvas.toDataURL("image/png", 1.0)
        const a = document.createElement("a"); a.href = pdfData; a.download = getFilename("pdf"); a.click()

      } else {
        // PNG / PNG transparent / WEBP
        const mime    = expFormat === "webp" ? "image/webp" : "image/png"
        const quality = expFormat === "webp" ? 0.92 : undefined
        const dataUrl = quality !== undefined ? canvas.toDataURL(mime, quality) : canvas.toDataURL(mime)
        const ext     = expFormat === "webp" ? "webp" : "png"
        const a       = document.createElement("a"); a.href = dataUrl; a.download = getFilename(ext); a.click()
      }
    } catch (e) { console.error("Export error:", e) }
    setExpExporting(false)
  }

  // ── Copier image dans le presse-papier ────────────────────────────────────
  async function copyImageToClipboard() {
    if (!active) return
    try {
      const px     = 512
      const canvas = await buildExportCanvas(px, false)
      canvas.toBlob(async blob => {
        if (!blob) return
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        setExpCopied("img"); setTimeout(() => setExpCopied(null), 2000)
      }, "image/png")
    } catch { setExpCopied("img-err"); setTimeout(() => setExpCopied(null), 2000) }
  }

  // ── Copier SVG texte ──────────────────────────────────────────────────────
  async function copySVG() {
    if (!active) return
    try {
      const svgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qrUrl)}&color=${fg.replace("#","")}&bgcolor=${bg.replace("#","")}&ecc=${effectiveEcc}&format=svg`
      const text   = await fetch(svgUrl).then(r => r.text())
      await navigator.clipboard.writeText(text)
      setExpCopied("svg"); setTimeout(() => setExpCopied(null), 2000)
    } catch { setExpCopied("svg-err"); setTimeout(() => setExpCopied(null), 2000) }
  }

  // Legacy compat
  function downloadPNG(size = 400) { runExport() }

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

              {/* ── Performance QR ───────────────────────────────────────── */}
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <BarChart2 size={13} color={G}/>
                    <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:700, margin:0 }}>Performance</p>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    {([7,30] as const).map(p => (
                      <button key={p} type="button" onClick={() => setStatsPeriod(p)}
                        style={{ padding:"2px 8px", background:statsPeriod===p?"rgba(201,168,76,0.15)":"transparent", border:`1px solid ${statsPeriod===p?"rgba(201,168,76,0.35)":"rgba(255,255,255,0.1)"}`, borderRadius:5, color:statsPeriod===p?G:MUTED, fontSize:9, fontWeight:statsPeriod===p?700:400, cursor:"pointer" }}>
                        {p}j
                      </button>
                    ))}
                    <a href={`/dashboard/analytics`}
                      style={{ padding:"2px 8px", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:5, color:MUTED, fontSize:9, textDecoration:"none", display:"flex", alignItems:"center", gap:3 }}>
                      <ExternalLink size={8}/> Tout
                    </a>
                  </div>
                </div>

                {statsLoading ? (
                  <div style={{ display:"flex", justifyContent:"center", padding:"16px 0" }}>
                    <Loader size={16} color={MUTED} style={{ animation:"spin 0.8s linear infinite" }}/>
                  </div>
                ) : !stats || stats.total === 0 ? (
                  <div style={{ textAlign:"center", padding:"16px 0" }}>
                    <Scan size={20} color={MUTED} style={{ marginBottom:6 }}/>
                    <p style={{ color:MUTED, fontSize:11, margin:"0 0 2px" }}>Aucun scan pour le moment</p>
                    <p style={{ color:"rgba(138,132,120,0.6)", fontSize:9, margin:0 }}>Partagez votre QR code pour voir les stats</p>
                  </div>
                ) : (
                  <>
                    {/* KPIs 2x2 */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:12 }}>
                      {[
                        { label:"Total",       value:stats.total.toLocaleString(),   color:G,        sub:null },
                        { label:`${statsPeriod}j`,  value:stats.current.toLocaleString(), color:"#F5F0E8",
                          sub: stats.evolution !== 0 ? (
                            <span style={{ display:"inline-flex", alignItems:"center", gap:2, fontSize:9, color:stats.evolution>0?"#39FF8F":"#FF6B6B", fontWeight:700 }}>
                              {stats.evolution>0 ? <TrendingUp size={8}/> : <TrendingDown size={8}/>}
                              {stats.evolution>0?"+":""}{stats.evolution}%
                            </span>
                          ) : null
                        },
                        { label:"Top appareil", value: stats.top_device
                            ? ({"mobile":"📱 Mobile","desktop":"🖥 Desktop","tablet":"📟 Tablet"} as any)[stats.top_device] ?? stats.top_device
                            : "—",
                          color:"#F5F0E8", sub:null },
                        { label:"Top pays",    value:stats.top_country ? `🌍 ${stats.top_country}` : "—", color:"#F5F0E8", sub:null },
                      ].map((k,i) => (
                        <div key={i} style={{ background:"#0F0E0B", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"8px 10px" }}>
                          <p style={{ color:MUTED, fontSize:8, textTransform:"uppercase", letterSpacing:1, margin:"0 0 3px" }}>{k.label}</p>
                          <p style={{ color:k.color, fontSize:13, fontWeight:700, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>{k.value}</p>
                          {k.sub && <div style={{ marginTop:2 }}>{k.sub}</div>}
                        </div>
                      ))}
                    </div>

                    {/* Dernier scan */}
                    {stats.last_scan && (
                      <p style={{ color:MUTED, fontSize:9, margin:"0 0 10px", display:"flex", alignItems:"center", gap:4 }}>
                        <Clock size={9}/> Dernier scan : {formatDate(stats.last_scan)}
                      </p>
                    )}

                    {/* Sparkline */}
                    <div style={{ marginBottom:10 }}>
                      <p style={{ color:MUTED, fontSize:8, textTransform:"uppercase", letterSpacing:1, margin:"0 0 5px" }}>
                        Scans / jour ({statsPeriod}j)
                      </p>
                      <canvas ref={sparkCanvasRef} style={{ width:"100%", height:48, borderRadius:6, display:"block" }}/>
                    </div>

                    {/* Export CSV */}
                    <button type="button" onClick={exportQRCSV} disabled={statsExporting}
                      style={{ width:"100%", padding:"6px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:7, color:MUTED, fontSize:10, cursor:statsExporting?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                      {statsExporting ? <><Loader size={10} style={{ animation:"spin 0.8s linear infinite" }}/> Export...</> : <><Download size={10}/> Exporter CSV</>}
                    </button>
                  </>
                )}
              </div>

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
          {([["style","Style","🎨"],["supports","Supports","🖨️"],["export","Export","📤"]] as const).map(([id,label,emoji]) => (
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
        {activeTab === "supports" && active && (() => {
          const tpl = SUPP_TPLS.find(t => t.id === suppTplId) ?? SUPP_TPLS[0]
          const canTpl = PLAN_RANK[userPlan] >= PLAN_RANK[tpl.plan]
          return (
          <div style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>

            {/* ── Sélecteur templates ──────────────────────────────────── */}
            <div style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
              <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Support</p>
              <div style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:220, overflowY:"auto" }}>
                {SUPP_TPLS.map(t => {
                  const can   = PLAN_RANK[userPlan] >= PLAN_RANK[t.plan]
                  const isA   = t.id === suppTplId
                  const badge = t.plan === "free" ? null : t.plan === "pro" ? "PRO" : "BIZ"
                  return (
                    <button key={t.id} type="button"
                      onClick={() => { setSuppTplId(t.id); setSuppRendered(false) }}
                      style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 9px", background:isA?"rgba(201,168,76,0.08)":"rgba(255,255,255,0.02)", border:`1px solid ${isA?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.06)"}`, borderRadius:8, cursor:"pointer", textAlign:"left" as const, opacity:can?1:0.6, position:"relative" as const }}>
                      <span style={{ fontSize:16, flexShrink:0 }}>{t.emoji}</span>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ color:isA?G:"#F5F0E8", fontSize:11, fontWeight:isA?700:500, margin:"0 0 1px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                          {t.label}
                        </p>
                        <p style={{ color:MUTED, fontSize:9, margin:0 }}>{t.desc}</p>
                      </div>
                      {badge && (
                        <span style={{ background:can?(t.plan==="pro"?"rgba(201,168,76,0.15)":"rgba(57,255,143,0.12)"):"rgba(255,255,255,0.06)", borderRadius:4, padding:"1px 5px", fontSize:7, color:can?(t.plan==="pro"?G:"#39FF8F"):MUTED, fontWeight:800, flexShrink:0 }}>
                          {badge}
                        </span>
                      )}
                      {!can && <Lock size={10} color={MUTED} style={{ flexShrink:0 }}/>}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ flex:1, overflowY:"auto", padding:"12px" }}>

              {/* ── Textes ───────────────────────────────────────────── */}
              <div style={{ marginBottom:12 }}>
                <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Textes</p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  <div>
                    <label style={{ color:MUTED, fontSize:10, display:"block", marginBottom:4 }}>Titre</label>
                    <input value={suppTitle} onChange={e => { setSuppTitle(e.target.value); setSuppRendered(false) }}
                      placeholder={active?.pages?.title ?? "Titre de votre page"}
                      style={{ width:"100%", background:"#111009", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"7px 9px", color:"#F5F0E8", fontSize:11, outline:"none", boxSizing:"border-box" as const }}/>
                  </div>
                  <div>
                    <label style={{ color:MUTED, fontSize:10, display:"block", marginBottom:4 }}>Sous-titre / Appel à l&apos;action</label>
                    <select value={suppSubtitle} onChange={e => { setSuppSubtitle(e.target.value); setSuppRendered(false) }}
                      style={{ width:"100%", background:"#111009", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"7px 9px", color:"#F5F0E8", fontSize:11, outline:"none", cursor:"pointer", boxSizing:"border-box" as const }}>
                      {[
                        "Scannez pour voir le menu",
                        "Scannez pour reserver",
                        "Scannez pour laisser un avis",
                        "Scannez pour nous suivre",
                        "Scannez pour decouvrir la page",
                        "Scannez pour telecharger le fichier",
                        "Scannez pour en savoir plus",
                      ].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Preview ──────────────────────────────────────────── */}
              <div style={{ marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>Apercu</p>
                  <span style={{ color:MUTED, fontSize:9 }}>{tpl.w}×{tpl.h}px</span>
                </div>

                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:12, display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                  {canTpl ? (
                    <>
                      <canvas ref={supportCanvasRef} style={{ maxWidth:"100%", borderRadius:6, display: suppRendered ? "block" : "none" }}/>
                      {!suppRendered && (
                        <div style={{ width:"100%", height:160, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                          <span style={{ fontSize:28 }}>{tpl.emoji}</span>
                          <p style={{ color:MUTED, fontSize:11, margin:0 }}>Cliquez pour generer</p>
                        </div>
                      )}
                      <button type="button" onClick={previewSupport}
                        style={{ width:"100%", padding:"8px", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:8, color:G, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                        <Eye size={12}/> {suppRendered ? "Regenerer l'apercu" : "Generer l'apercu"}
                      </button>
                    </>
                  ) : (
                    <div style={{ padding:"20px 0", textAlign:"center" as const }}>
                      <Lock size={22} color={MUTED} style={{ marginBottom:8 }}/>
                      <p style={{ color:MUTED, fontSize:12, margin:"0 0 10px" }}>
                        {tpl.plan === "pro" ? "Necessites le plan Pro" : "Necessites le plan Business"}
                      </p>
                      <a href="/dashboard/upgrade" style={{ display:"inline-block", padding:"7px 16px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", borderRadius:8, color:"#080808", fontSize:11, fontWeight:700, textDecoration:"none" }}>
                        Voir les plans
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Export ───────────────────────────────────────────── */}
              {canTpl && (
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 2px" }}>Exporter</p>
                  <button type="button" onClick={() => exportSupport("png")} disabled={suppExporting}
                    style={{ padding:"10px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", border:"none", borderRadius:9, color:"#080808", fontSize:12, fontWeight:700, cursor:suppExporting?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, opacity:suppExporting?0.7:1 }}>
                    {suppExporting ? <><Loader size={13} style={{ animation:"spin 0.8s linear infinite" }}/> Export...</>
                      : <><Download size={13}/> PNG haute resolution</>}
                  </button>
                  <button type="button" onClick={() => exportSupport("pdf")} disabled={suppExporting}
                    style={{ padding:"9px", background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:9, color:"#FF6B6B", fontSize:11, cursor:suppExporting?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, opacity:suppExporting?0.7:1 }}>
                    {suppExporting ? <><Loader size={12} style={{ animation:"spin 0.8s linear infinite" }}/></> : <><Printer size={12}/> PDF pret a imprimer</>}
                  </button>
                </div>
              )}
            </div>
          </div>
          )
        })()}

        {activeTab === "export" && active && (() => {
          const realPx = expSize === "custom" ? Math.max(256, Math.min(8192, expCustomSize)) : expSize
          const FORMAT_CFG: Record<string, { label: string; ext: string; color: string; desc: string; plan: string }> = {
            "png":   { label:"PNG",       ext:"png",  color:"#38BDF8", desc:"Universel, opaque",        plan:"free"     },
            "png-t": { label:"PNG Alpha", ext:"png",  color:"#39FF8F", desc:"Fond transparent, sticker", plan:"pro"      },
            "webp":  { label:"WEBP",      ext:"webp", color:"#818CF8", desc:"Web optimise, plus leger",  plan:"pro"      },
            "svg":   { label:"SVG",       ext:"svg",  color:"#C9A84C", desc:"Vectoriel, impression HD",  plan:"pro"      },
            "pdf":   { label:"PDF",       ext:"pdf",  color:"#FF6B6B", desc:"Impression A4 avec titre",  plan:"business" },
          }
          const fmt = FORMAT_CFG[expFormat] ?? FORMAT_CFG["png"]
          const RECO = [
            { emoji:"🌐", label:"Web",           fmt:"png",   size:1024, note:"PNG 1024px — standard" },
            { emoji:"🖨️", label:"Impression",    fmt:"pdf",   size:2048, note:"PDF / SVG 2048px+" },
            { emoji:"🏷️",  label:"Sticker",      fmt:"png-t", size:1024, note:"PNG transparent 1024px" },
            { emoji:"📱",  label:"Reseaux",       fmt:"png",   size:512,  note:"PNG 512px — leger" },
          ]
          return (
          <div style={{ flex:1, overflowY:"auto", padding:"14px" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* ── Recommandations ────────────────────────────────────────── */}
              <div>
                <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>
                  Recommandations
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
                  {RECO.map(r => {
                    const canReco = PLAN_RANK[userPlan] >= PLAN_RANK[FORMAT_CFG[r.fmt]?.plan ?? "free"]
                    return (
                      <button key={r.label} type="button"
                        onClick={() => { if (!canReco) return; setExpFormat(r.fmt as any); setExpSize(r.size as any) }}
                        style={{ padding:"8px 7px", background:"rgba(255,255,255,0.02)", border:`1px solid ${expFormat===r.fmt&&expSize===r.size?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius:9, cursor:canReco?"pointer":"not-allowed", textAlign:"left" as const, opacity:canReco?1:0.6, position:"relative" as const }}>
                        <p style={{ color:"#F5F0E8", fontSize:10, fontWeight:600, margin:"0 0 2px" }}>{r.emoji} {r.label}</p>
                        <p style={{ color:MUTED, fontSize:9, margin:0 }}>{r.note}</p>
                        {!canReco && <Lock size={9} color={MUTED} style={{ position:"absolute", top:5, right:5 }}/>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Format ─────────────────────────────────────────────────── */}
              <div>
                <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Format</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:5 }}>
                  {Object.entries(FORMAT_CFG).map(([id, cfg]) => {
                    const canFmt = PLAN_RANK[userPlan] >= PLAN_RANK[cfg.plan]
                    const isA    = expFormat === id
                    const badge  = cfg.plan === "free" ? null : cfg.plan === "pro" ? "PRO" : "BIZ"
                    return (
                      <button key={id} type="button"
                        onClick={() => canFmt && setExpFormat(id as any)}
                        style={{ padding:"9px 8px", background:isA?`${cfg.color}12`:"rgba(255,255,255,0.02)", border:`1px solid ${isA?cfg.color+"50":"rgba(255,255,255,0.07)"}`, borderRadius:9, cursor:canFmt?"pointer":"not-allowed", opacity:canFmt?1:0.55, position:"relative" as const, textAlign:"left" as const }}>
                        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
                          <span style={{ color:isA?cfg.color:"#F5F0E8", fontSize:11, fontWeight:700 }}>{cfg.label}</span>
                          {badge && <span style={{ background:`${cfg.color}20`, borderRadius:3, padding:"1px 4px", fontSize:7, color:cfg.color, fontWeight:800 }}>{badge}</span>}
                        </div>
                        <p style={{ color:MUTED, fontSize:9, margin:0 }}>{cfg.desc}</p>
                        {!canFmt && <Lock size={9} color={MUTED} style={{ position:"absolute", top:5, right:5 }}/>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* ── Taille ─────────────────────────────────────────────────── */}
              <div>
                <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Taille</p>
                <div style={{ display:"flex", gap:5, flexWrap:"wrap" as const, marginBottom:8 }}>
                  {([512, 1024, 2048, 4096, "custom"] as const).map(s => {
                    const isHD  = s === 4096 || s === 2048
                    const canHD = !isHD || canPro
                    return (
                      <button key={String(s)} type="button"
                        onClick={() => canHD && setExpSize(s as any)}
                        style={{ padding:"5px 10px", background:expSize===s?"rgba(201,168,76,0.12)":"rgba(255,255,255,0.03)", border:`1px solid ${expSize===s?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius:8, color:expSize===s?G:canHD?"#F5F0E8":MUTED, fontSize:10, cursor:canHD?"pointer":"not-allowed", fontWeight:expSize===s?700:400, opacity:canHD?1:0.55 }}>
                        {s === "custom" ? "Perso" : `${s}px`}
                        {isHD && !canHD && <Lock size={8} color={MUTED} style={{ marginLeft:3 }}/>}
                      </button>
                    )
                  })}
                </div>
                {expSize === "custom" && (
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <input type="number" min={256} max={8192} value={expCustomSize}
                      onChange={e => setExpCustomSize(Math.max(256, Math.min(8192, Number(e.target.value))))}
                      style={{ flex:1, background:"#111009", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"7px 10px", color:"#F5F0E8", fontSize:12, outline:"none" }}/>
                    <span style={{ color:MUTED, fontSize:11 }}>px</span>
                  </div>
                )}
                <p style={{ color:MUTED, fontSize:10, margin:"5px 0 0" }}>
                  Export : <strong style={{ color:G }}>{realPx}×{realPx}px</strong>
                  {(expIncludeName || expIncludeUrl) && " + bandeau"}
                </p>
              </div>

              {/* ── Options ────────────────────────────────────────────────── */}
              <div>
                <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Options</p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>

                  {/* Marge */}
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <span style={{ color:MUTED, fontSize:11 }}>Marge</span>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <input type="range" min={0} max={30} value={expMargin}
                        onChange={e => setExpMargin(Number(e.target.value))}
                        style={{ width:80, accentColor:G, cursor:"pointer" }}/>
                      <span style={{ color:G, fontSize:11, fontWeight:700, width:28, textAlign:"right" as const }}>{expMargin}px</span>
                    </div>
                  </div>

                  {/* Nom de fichier */}
                  <div>
                    <label style={{ color:MUTED, fontSize:11, display:"block", marginBottom:4 }}>Nom du fichier</label>
                    <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                      <input type="text" value={expFilename}
                        onChange={e => setExpFilename(e.target.value)}
                        placeholder={active?.pages?.title?.replace(/[^a-z0-9]/gi,"-").toLowerCase() ?? "qr-code"}
                        style={{ flex:1, background:"#111009", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"7px 9px", color:"#F5F0E8", fontSize:11, outline:"none" }}/>
                      <span style={{ color:MUTED, fontSize:11 }}>.{fmt.ext}</span>
                    </div>
                  </div>

                  {/* Inclure nom + URL (sauf SVG) */}
                  {expFormat !== "svg" && (
                    <>
                      {[
                        { state:expIncludeName, set:setExpIncludeName, label:"Inclure nom de la page", plan:"free"     },
                        { state:expIncludeUrl,  set:setExpIncludeUrl,  label:"Inclure URL courte",    plan:"pro"      },
                      ].map((opt, i) => {
                        const can = PLAN_RANK[userPlan] >= PLAN_RANK[opt.plan]
                        return (
                          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", opacity:can?1:0.5 }}>
                            <span style={{ color:MUTED, fontSize:11 }}>{opt.label}{!can&&" (Pro)"}</span>
                            <button type="button" onClick={() => can && opt.set(!opt.state)}
                              style={{ width:34, height:20, borderRadius:10, background:opt.state&&can?"linear-gradient(90deg,#C9A84C,#b8953f)":"rgba(255,255,255,0.1)", border:"none", cursor:can?"pointer":"not-allowed", position:"relative" as const, transition:"background 0.2s" }}>
                              <div style={{ position:"absolute", top:2, left:opt.state&&can?16:2, width:16, height:16, borderRadius:"50%", background:"#F5F0E8", transition:"left 0.2s" }}/>
                            </button>
                          </div>
                        )
                      })}
                    </>
                  )}

                  {/* Logo actif */}
                  {styleConf.logoUrl && (
                    <div style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 10px", background:"rgba(57,255,143,0.06)", border:"1px solid rgba(57,255,143,0.15)", borderRadius:8 }}>
                      <Check size={11} color="#39FF8F"/>
                      <span style={{ color:"#39FF8F", fontSize:10 }}>Logo inclus dans l&apos;export</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── Actions ────────────────────────────────────────────────── */}
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>

                {/* Bouton principal Télécharger */}
                <button type="button" onClick={runExport} disabled={expExporting}
                  style={{ padding:"11px", background:`linear-gradient(90deg,${fmt.color},${fmt.color}cc)`, border:"none", borderRadius:10, color:"#080808", fontSize:13, fontWeight:700, cursor:expExporting?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, opacity:expExporting?0.7:1 }}>
                  {expExporting
                    ? <><Loader size={14} style={{ animation:"spin 0.8s linear infinite" }}/> Export en cours...</>
                    : <><Download size={14}/> Telecharger {fmt.label} {realPx}px</>}
                </button>

                {/* Copier image */}
                <button type="button" onClick={copyImageToClipboard}
                  style={{ padding:"9px", background:expCopied==="img"?"rgba(57,255,143,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${expCopied==="img"?"rgba(57,255,143,0.3)":"rgba(255,255,255,0.08)"}`, borderRadius:9, color:expCopied==="img"?"#39FF8F":expCopied==="img-err"?"#FF6B6B":MUTED, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  {expCopied==="img" ? <><Check size={12}/> Image copiee !</>
                    : expCopied==="img-err" ? <><AlertTriangle size={12}/> Non supporte</>
                    : <><Clipboard size={12}/> Copier l&apos;image (PNG 512px)</>}
                </button>

                {/* Copier SVG */}
                <button type="button" onClick={copySVG}
                  style={{ padding:"9px", background:expCopied==="svg"?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${expCopied==="svg"?"rgba(201,168,76,0.3)":"rgba(255,255,255,0.08)"}`, borderRadius:9, color:expCopied==="svg"?G:MUTED, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  {expCopied==="svg" ? <><Check size={12}/> SVG copie !</> : <><Copy size={12}/> Copier le SVG</>}
                </button>

                {/* Copier lien */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                  {[
                    { key:"short", label:"Lien scan", val:qrUrl   },
                    { key:"link",  label:"Lien page", val:pageUrl  },
                  ].map(l => (
                    <button key={l.key} type="button" onClick={() => copy(l.key as any)}
                      style={{ padding:"7px", background:copied===l.key?"rgba(57,255,143,0.08)":"rgba(255,255,255,0.03)", border:`1px solid ${copied===l.key?"rgba(57,255,143,0.2)":"rgba(255,255,255,0.07)"}`, borderRadius:8, color:copied===l.key?"#39FF8F":MUTED, fontSize:10, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                      {copied===l.key ? <Check size={10}/> : <Link size={10}/>} {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upsell */}
              {!canPro && (
                <div style={{ padding:"12px 14px", background:"rgba(201,168,76,0.05)", border:"1px solid rgba(201,168,76,0.15)", borderRadius:10 }}>
                  <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:600, margin:"0 0 4px" }}>Formats HD + SVG + PDF</p>
                  <p style={{ color:MUTED, fontSize:10, margin:"0 0 8px" }}>Pro: PNG alpha, WEBP, SVG · Business: PDF A4</p>
                  <a href="/dashboard/upgrade" style={{ display:"block", textAlign:"center" as const, padding:"7px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", borderRadius:7, color:"#080808", fontSize:11, fontWeight:700, textDecoration:"none" }}>
                    Voir les plans
                  </a>
                </div>
              )}

            </div>
          </div>
          )
        })()}

      </div>


      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
