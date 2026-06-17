"use client"

import { useEffect, useRef, useState, useCallback, type ReactNode } from "react"
import {
  QrCode, Download, Link, Check, Lock, Pencil, Plus,
  Eye, EyeOff, ChevronRight, ScanLine, Clock,
  Palette, Settings, Share2, ExternalLink, Copy,
  RotateCcw, Loader2, Search, Trash2, Archive,
  MoreVertical, AlertTriangle, X,
  ImageIcon, FileText, Maximize2, ClipboardList, SlidersHorizontal,
  Printer, LayoutGrid, TrendingUp, TrendingDown, BarChart, Sparkles
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { createQR, updateQR, getQRBlob, downloadBlob, blobToDataUrl, buildAndDownloadPdf, type QROptions } from "./qrRender"
import type QRCodeStyling from "qr-code-styling"

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
  dest_override:    Record<string, any> | null
  dest_history:     Array<Record<string, any>>
  status:           "active"|"draft"|"paused"|"archived"|"expired"
  pause_message:    string | null
  expires_at:       string | null
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

// -- QR Style Config type -----------------------------------------------------
type QRStyleConfig = {
  fg2?:          string    // couleur secondaire (degrade)
  cornerColor?:  string    // couleur des coins
  eyeColor?:     string    // couleur des yeux (centres)
  transparent?:  boolean   // fond transparent
  gradient?:     "none"|"linear"|"radial"|"diagonal"
  gradientBg?:   string    // couleur fin de degrade fond
  dotStyle?:     "square"|"rounded"|"dot"|"softSquare"|"pixel"|"minimal"|"neon"|"luxury"
  cornerStyle?:  "square"|"rounded"|"circle"|"diamond"|"luxury"|"minimal"
  margin?:       number    // 0-30
  density?:      "low"|"medium"|"high"
  logoUrl?:      string    // data URL ou URL Supabase
  logoSize?:     number    // % du QR, 10-30, defaut 18
  logoShape?:    "square"|"rounded"|"circle"
  logoBg?:       "transparent"|"white"|"black"|"custom"
  logoBgColor?:  string
  logoPadding?:  number    // px, 0-12, defaut 4
}

const DOT_STYLES: { id: QRStyleConfig["dotStyle"]; label: string; emoji: string }[] = [
  { id:"square",     label:"Classique",    emoji:"⬛" },
  { id:"rounded",    label:"Arrondi",      emoji:"🔵" },
  { id:"dot",        label:"Dots",         emoji:"⚫" },
  { id:"softSquare", label:"Carrés doux",  emoji:"🟦" },
  { id:"pixel",      label:"Pixel",        emoji:"🟧" },
  { id:"minimal",    label:"Minimal",      emoji:"▫️" },
  { id:"neon",       label:"Neon",         emoji:"💜" },
  { id:"luxury",     label:"Luxury",       emoji:"💎" },
]

const CORNER_STYLE_LIST: { id: QRStyleConfig["cornerStyle"]; label: string }[] = [
  { id:"square",   label:"Carré"   },
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

// -- Bibliotheque de presets premium ------------------------------------------
type Preset = {
  id:       string
  label:    string
  cat:      string
  fg:       string
  bg:       string
  fg2?:     string
  cornerColor?: string
  eyeColor?:    string
  gradient?: "none"|"linear"|"radial"|"diagonal"
  gradientBg?:  string
  dotStyle?:    string
  cornerStyle?: string
  ecc?:     "L"|"M"|"Q"|"H"
  margin?:  number
  density?: "low"|"medium"|"high"
  transparent?: boolean
  plan:     string
}

const PRESET_CATS = [
  { id:"all",        label:"Tous",       emoji:"🎨" },
  { id:"classic",    label:"Classique",  emoji:"⚫" },
  { id:"business",   label:"Business",   emoji:"💼" },
  { id:"restaurant", label:"Restaurant", emoji:"🍽️" },
  { id:"luxury",     label:"Luxe",       emoji:"💎" },
  { id:"creator",    label:"Createur",   emoji:"🎬" },
  { id:"tech",       label:"Tech",       emoji:"⚡" },
  { id:"event",      label:"Event",      emoji:"🎉" },
]

const PRESETS: Preset[] = [
  // == CLASSIQUE ==============================================================
  { id:"classic-black",     label:"Classic Black",   cat:"classic", fg:"#0A0A0A", bg:"#FFFFFF", dotStyle:"square",  cornerStyle:"square",  plan:"free" },
  { id:"snow-white",        label:"Snow White",      cat:"classic", fg:"#1A1A1A", bg:"#F8F8F8", dotStyle:"rounded", cornerStyle:"rounded", plan:"free" },
  { id:"minimal-gray",      label:"Minimal Gray",    cat:"classic", fg:"#4B5563", bg:"#F9FAFB", dotStyle:"minimal", cornerStyle:"minimal", plan:"free" },
  { id:"midnight-gold",     label:"Midnight Gold",   cat:"classic", fg:"#C9A84C", bg:"#0A0A0A", dotStyle:"square",  cornerStyle:"square",  plan:"free" },
  { id:"soft-blue",         label:"Soft Blue",       cat:"classic", fg:"#2563EB", bg:"#EFF6FF", dotStyle:"rounded", cornerStyle:"circle",  plan:"free" },
  { id:"corporate-navy",    label:"Corporate Navy",  cat:"classic", fg:"#1E3A5F", bg:"#FFFFFF", dotStyle:"square",  cornerStyle:"square",  plan:"free" },
  { id:"graphite",          label:"Graphite",        cat:"classic", fg:"#2D2D2D", bg:"#E5E5E5", dotStyle:"dot",     cornerStyle:"rounded", plan:"free" },
  { id:"ivory-noir",        label:"Ivory Noir",      cat:"classic", fg:"#1A1A1A", bg:"#FBF8F0", dotStyle:"rounded", cornerStyle:"rounded", plan:"pro" },

  // == BUSINESS ===============================================================
  { id:"corporate-blue",    label:"Corporate Blue",  cat:"business", fg:"#0A4DA6", bg:"#FFFFFF", dotStyle:"square",  cornerStyle:"square",  plan:"free" },
  { id:"executive-gold",    label:"Executive Gold",  cat:"business", fg:"#B8860B", bg:"#0F0F0F", dotStyle:"rounded", cornerStyle:"rounded", ecc:"H", density:"high", margin:12, plan:"pro" },
  { id:"realestate-navy",   label:"Real Estate Navy",cat:"business", fg:"#14274E", bg:"#F4F6FB", dotStyle:"square",  cornerStyle:"circle",  plan:"pro" },
  { id:"emerald-business",  label:"Emerald Business",cat:"business", fg:"#047857", bg:"#ECFDF5", dotStyle:"rounded", cornerStyle:"rounded", plan:"pro" },
  { id:"startup-indigo",    label:"Startup Indigo",  cat:"business", fg:"#4F46E5", bg:"#FFFFFF", dotStyle:"dot",     cornerStyle:"circle",  plan:"pro" },
  { id:"finance-elite",     label:"Finance Elite",   cat:"business", fg:"#0B3D2E", bg:"#F0FFF8", dotStyle:"square",  cornerStyle:"square",  ecc:"H", density:"high", plan:"pro" },
  { id:"consulting-premium",label:"Consulting Premium",cat:"business",fg:"#334155",bg:"#F8FAFC", dotStyle:"rounded", cornerStyle:"rounded", plan:"pro" },
  { id:"platinum-executive",label:"Platinum Executive",cat:"business",fg:"#6B7280",bg:"#0D0D0D", dotStyle:"luxury",  cornerStyle:"luxury",  eyeColor:"#9CA3AF", ecc:"H", density:"high", margin:14, plan:"business" },

  // == RESTAURANT =============================================================
  { id:"italian-bistro",    label:"Italian Bistro",  cat:"restaurant", fg:"#B91C1C", bg:"#FFF7ED", dotStyle:"rounded", cornerStyle:"rounded", plan:"free" },
  { id:"french-gourmet",    label:"French Gourmet",  cat:"restaurant", fg:"#1F2937", bg:"#F5EFE0", dotStyle:"minimal", cornerStyle:"circle",  plan:"pro" },
  { id:"steak-house",       label:"Steak House",     cat:"restaurant", fg:"#7F1D1D", bg:"#1A0F0A", dotStyle:"square",  cornerStyle:"square",  ecc:"H", density:"high", plan:"pro" },
  { id:"sushi-premium",     label:"Sushi Premium",   cat:"restaurant", fg:"#0F172A", bg:"#FEF2F2", eyeColor:"#DC2626", dotStyle:"rounded", cornerStyle:"rounded", plan:"pro" },
  { id:"cocktail-bar",      label:"Cocktail Bar",    cat:"restaurant", fg:"#DB2777", bg:"#1A0A14", dotStyle:"neon",    cornerStyle:"diamond", gradient:"diagonal", fg2:"#F59E0B", plan:"pro" },
  { id:"coffee-house",      label:"Coffee House",    cat:"restaurant", fg:"#6B3F2A", bg:"#FDF6EE", dotStyle:"rounded", cornerStyle:"rounded", plan:"free" },
  { id:"wine-cellar",       label:"Wine Cellar",     cat:"restaurant", fg:"#7B1E3B", bg:"#1A0610", dotStyle:"luxury",  cornerStyle:"luxury",  ecc:"H", density:"high", margin:12, plan:"business" },
  { id:"fast-casual",       label:"Fast Casual",     cat:"restaurant", fg:"#EA580C", bg:"#FFFBEB", dotStyle:"dot",     cornerStyle:"circle",  plan:"free" },

  // == LUXE ===================================================================
  { id:"luxury-gold",       label:"Luxury Gold",     cat:"luxury", fg:"#C9A84C", bg:"#0A0700", dotStyle:"luxury",  cornerStyle:"luxury",  eyeColor:"#E8C766", ecc:"H", density:"high", margin:16, plan:"business" },
  { id:"royal-black",       label:"Royal Black",     cat:"luxury", fg:"#E5E5E5", bg:"#050505", dotStyle:"luxury",  cornerStyle:"diamond", ecc:"H", density:"high", margin:14, plan:"business" },
  { id:"diamond-elite",     label:"Diamond Elite",   cat:"luxury", fg:"#BFD7EA", bg:"#0A0F14", dotStyle:"luxury",  cornerStyle:"diamond", gradient:"linear", fg2:"#7FA8C9", ecc:"H", density:"high", plan:"business" },
  { id:"platinum-white",    label:"Platinum White",  cat:"luxury", fg:"#8A8478", bg:"#FAFAF7", dotStyle:"luxury",  cornerStyle:"luxury",  ecc:"H", margin:14, plan:"business" },
  { id:"luxury-emerald",    label:"Luxury Emerald",  cat:"luxury", fg:"#0FB37A", bg:"#021410", dotStyle:"luxury",  cornerStyle:"luxury",  eyeColor:"#34D399", ecc:"H", density:"high", plan:"business" },
  { id:"midnight-prestige", label:"Midnight Prestige",cat:"luxury",fg:"#C0A062", bg:"#0A0A12", dotStyle:"luxury",  cornerStyle:"diamond", gradient:"radial", fg2:"#8A6E3A", ecc:"H", density:"high", plan:"business" },
  { id:"black-velvet",      label:"Black Velvet",    cat:"luxury", fg:"#D4AF37", bg:"#0D0A05", dotStyle:"luxury",  cornerStyle:"luxury",  ecc:"H", density:"high", margin:16, plan:"business" },
  { id:"monaco-gold",       label:"Monaco Gold",     cat:"luxury", fg:"#E0B84C", bg:"#14110A", dotStyle:"luxury",  cornerStyle:"diamond", gradient:"diagonal", fg2:"#B8860B", ecc:"H", density:"high", plan:"business" },

  // == CREATEUR ===============================================================
  { id:"youtube-creator",   label:"YouTube Creator", cat:"creator", fg:"#FF0000", bg:"#0F0F0F", dotStyle:"rounded", cornerStyle:"circle",  plan:"pro" },
  { id:"twitch-streamer",   label:"Twitch Streamer", cat:"creator", fg:"#9146FF", bg:"#0E0B16", dotStyle:"neon",    cornerStyle:"diamond", gradient:"linear", fg2:"#C77DFF", plan:"pro" },
  { id:"tiktok-neon",       label:"TikTok Neon",     cat:"creator", fg:"#00F2EA", bg:"#010101", dotStyle:"neon",    cornerStyle:"circle",  gradient:"diagonal", fg2:"#FF0050", plan:"pro" },
  { id:"instagram-creator", label:"Instagram Creator",cat:"creator",fg:"#E1306C", bg:"#1A0A14", dotStyle:"rounded", cornerStyle:"circle",  gradient:"diagonal", fg2:"#F77737", plan:"pro" },
  { id:"podcast-pro",       label:"Podcast Pro",     cat:"creator", fg:"#A855F7", bg:"#150A1F", dotStyle:"rounded", cornerStyle:"rounded", plan:"pro" },
  { id:"personal-brand",    label:"Personal Brand",  cat:"creator", fg:"#F5F0E8", bg:"#1A1A1A", dotStyle:"dot",     cornerStyle:"rounded", plan:"pro" },
  { id:"purple-influence",  label:"Purple Influence",cat:"creator", fg:"#7C3AED", bg:"#FAF5FF", dotStyle:"dot",     cornerStyle:"circle",  plan:"free" },
  { id:"creator-gold",      label:"Creator Gold",    cat:"creator", fg:"#E0B84C", bg:"#0F0D0A", dotStyle:"luxury",  cornerStyle:"luxury",  ecc:"H", density:"high", plan:"business" },

  // == TECH ===================================================================
  { id:"cyber-neon",        label:"Cyber Neon",      cat:"tech", fg:"#00FFD1", bg:"#050810", dotStyle:"neon",    cornerStyle:"diamond", gradient:"linear", fg2:"#0EA5E9", plan:"pro" },
  { id:"matrix-green",      label:"Matrix Green",    cat:"tech", fg:"#00FF41", bg:"#000800", dotStyle:"pixel",   cornerStyle:"square",  density:"high", plan:"pro" },
  { id:"ai-future",         label:"AI Future",       cat:"tech", fg:"#38BDF8", bg:"#020617", dotStyle:"neon",    cornerStyle:"circle",  gradient:"diagonal", fg2:"#818CF8", plan:"pro" },
  { id:"web3-purple",       label:"Web3 Purple",     cat:"tech", fg:"#A78BFA", bg:"#0B0614", dotStyle:"pixel",   cornerStyle:"diamond", gradient:"linear", fg2:"#7C3AED", plan:"pro" },
  { id:"startup-tech",      label:"Startup Tech",    cat:"tech", fg:"#2DD4BF", bg:"#042F2E", dotStyle:"rounded", cornerStyle:"rounded", plan:"pro" },
  { id:"hacker-mode",       label:"Hacker Mode",     cat:"tech", fg:"#22C55E", bg:"#0A0A0A", dotStyle:"pixel",   cornerStyle:"square",  ecc:"H", density:"high", plan:"pro" },
  { id:"quantum-blue",      label:"Quantum Blue",    cat:"tech", fg:"#3B82F6", bg:"#060A18", dotStyle:"neon",    cornerStyle:"circle",  gradient:"diagonal", fg2:"#22D3EE", plan:"pro" },
  { id:"digital-grid",      label:"Digital Grid",    cat:"tech", fg:"#E2E8F0", bg:"#0F172A", dotStyle:"pixel",   cornerStyle:"square",  plan:"pro" },

  // == EVENT ==================================================================
  { id:"wedding-elegant",   label:"Wedding Elegant", cat:"event", fg:"#B08D57", bg:"#FBF7F0", dotStyle:"rounded", cornerStyle:"circle",  plan:"pro" },
  { id:"gala-night",        label:"Gala Night",      cat:"event", fg:"#D4AF37", bg:"#0A0A0A", dotStyle:"luxury",  cornerStyle:"diamond", gradient:"radial", fg2:"#8A6E3A", ecc:"H", density:"high", plan:"business" },
  { id:"festival-neon",     label:"Festival Neon",   cat:"event", fg:"#FF2EF0", bg:"#0A0014", dotStyle:"neon",    cornerStyle:"diamond", gradient:"diagonal", fg2:"#00F0FF", plan:"pro" },
  { id:"conference-pro",    label:"Conference Pro",  cat:"event", fg:"#1D4ED8", bg:"#F8FAFC", dotStyle:"square",  cornerStyle:"rounded", plan:"pro" },
  { id:"vip-event",         label:"VIP Event",       cat:"event", fg:"#C9A84C", bg:"#0D0D0D", dotStyle:"luxury",  cornerStyle:"luxury",  ecc:"H", density:"high", margin:14, plan:"business" },
  { id:"concert-live",      label:"Concert Live",    cat:"event", fg:"#EF4444", bg:"#0A0A0A", dotStyle:"neon",    cornerStyle:"circle",  gradient:"linear", fg2:"#F59E0B", plan:"pro" },
  { id:"birthday-gold",     label:"Birthday Gold",   cat:"event", fg:"#E0B84C", bg:"#1A140A", dotStyle:"rounded", cornerStyle:"circle",  plan:"free" },
  { id:"networking-elite",  label:"Networking Elite",cat:"event", fg:"#334155", bg:"#F1F5F9", dotStyle:"minimal", cornerStyle:"rounded", plan:"pro" },
]

const CORNER_STYLES = [
  { id: "square",  label: "Carré",   icon: "⬛" },
  { id: "rounded", label: "Arrondi", icon: "🔲" },
  { id: "dot",     label: "Points",  icon: "⚫" },
]

const EC_LEVELS = [
  { id: "L", label: "L 7%",  desc: "Léger" },
  { id: "M", label: "M 15%", desc: "Standard" },
  { id: "Q", label: "Q 25%", desc: "Eleve" },
  { id: "H", label: "H 30%", desc: "Maximum" },
]

const PLAN_RANK: Record<string, number> = { free: 0, pro: 1, business: 2 }

// -- Statuts pages (pour l'affichage de la page liee)
const STATUS_CFG: Record<string, { label: string; dot: string; badge: string; text: string }> = {
  published: { label: "Publié",    dot: "#39FF8F", badge: "rgba(57,255,143,0.12)",  text: "#39FF8F" },
  draft:     { label: "Brouillon", dot: "#8A8478", badge: "rgba(138,132,120,0.12)", text: "#8A8478" },
  archived:  { label: "Archivé",   dot: "#F97316", badge: "rgba(249,115,22,0.12)",  text: "#F97316" },
  paused:    { label: "En pause",  dot: "#FF6B6B", badge: "rgba(255,107,107,0.12)", text: "#FF6B6B" },
}

// -- Statuts QR Code
const QR_STATUS_CFG: Record<string, { label: string; dot: string; badge: string; text: string; desc: string }> = {
  active:   { label: "Actif",     dot: "#39FF8F", badge: "rgba(57,255,143,0.12)",  text: "#39FF8F", desc: "Redirection normale" },
  draft:    { label: "Brouillon", dot: "#8A8478", badge: "rgba(138,132,120,0.12)", text: "#8A8478", desc: "Visible dans le dashboard uniquement" },
  paused:   { label: "En pause",  dot: "#F97316", badge: "rgba(249,115,22,0.12)",  text: "#F97316", desc: "Page indisponible affichee" },
  archived: { label: "Archivé",   dot: "#6B7280", badge: "rgba(107,114,128,0.12)", text: "#6B7280", desc: "Masque et bloque" },
  expired:  { label: "Expire",    dot: "#FF6B6B", badge: "rgba(255,107,107,0.12)", text: "#FF6B6B", desc: "Acces expire" },
}

const PLAN_BADGE: Record<string, { color: string; label: string } | null> = {
  free: null, pro: { color: "#C9A84C", label: "PRO" }, business: { color: "#39FF8F", label: "BIZ" },
}

const G     = "#C9A84C"
const MUTED = "#8A8478"
const SURF  = "#0F0E0B"
const BG    = "#080808"

function formatDate(iso: string | null): string {
  if (!iso) return "--"
  const d = new Date(iso), now = new Date()
  const diff = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diff < 60)   return `il y a ${diff}min`
  if (diff < 1440) return `il y a ${Math.floor(diff / 60)}h`
  if (diff < 10080) return `il y a ${Math.floor(diff / 1440)}j`
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
}

// -- Section accordeon depliable (une seule ouverte a la fois) --------------
function AccSection({ id, title, icon, openId, setOpenId, children }: {
  id: string; title: string; icon?: string;
  openId: string; setOpenId: (v: string) => void; children: ReactNode
}) {
  const open = openId === id
  return (
    <div style={{ border:`1px solid ${open?"rgba(201,168,76,0.25)":"rgba(255,255,255,0.07)"}`, borderRadius:10, overflow:"hidden", background:"rgba(255,255,255,0.015)", transition:"border-color 0.2s" }}>
      <button type="button" onClick={() => setOpenId(open ? "" : id)}
        style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"11px 13px", background: open ? "rgba(201,168,76,0.06)" : "transparent", border:"none", cursor:"pointer" }}>
        <span style={{ display:"flex", alignItems:"center", gap:8, color: open ? "#C9A84C" : "#F5F0E8", fontSize:12, fontWeight:700 }}>
          {icon && <span style={{ fontSize:14 }}>{icon}</span>}{title}
        </span>
        <ChevronRight size={15} color={open ? "#C9A84C" : "#8A8478"} style={{ transform: open ? "rotate(90deg)" : "rotate(0deg)", transition:"transform 0.2s" }}/>
      </button>
      {open && (
        <div style={{ padding:"6px 13px 14px" }}>
          {children}
        </div>
      )}
    </div>
  )
}

// -- Color picker premium integre --------------------------------------------
function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!m) return [0, 0, 0]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function rgbToHex(r: number, g: number, b: number): string {
  const h = (x: number) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")
  return `#${h(r)}${h(g)}${h(b)}`.toUpperCase()
}
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60; if (h < 0) h += 360
  }
  return [h, max === 0 ? 0 : d / max, max]
}
function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x } else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x } else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c } else { r = c; b = x }
  return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255)
}

function ColorField({ label, value, onChange, onClear }: {
  label: string; value: string; onChange: (hex: string) => void; onClear?: () => void
}) {
  const [open, setOpen] = useState(false)
  const valid = /^#[0-9a-fA-F]{6}$/.test(value)
  const safe  = valid ? value : "#080808"
  const [hr, hg, hb] = hexToRgb(safe)
  const [h, s, v] = rgbToHsv(hr, hg, hb)
  const svRef  = useRef<HTMLDivElement>(null)
  const hueRef = useRef<HTMLDivElement>(null)

  const onSV = (e: React.PointerEvent) => {
    const r = svRef.current?.getBoundingClientRect(); if (!r) return
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    const y = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height))
    onChange(hsvToHex(h, x, 1 - y))
  }
  const onHue = (e: React.PointerEvent) => {
    const r = hueRef.current?.getBoundingClientRect(); if (!r) return
    const x = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width))
    onChange(hsvToHex(x * 360, s || 1, v || 1))
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <label style={{ color:"#8A8478", fontSize:11, flex:1 }}>{label}</label>
        <button type="button" onClick={() => setOpen(o => !o)}
          style={{ width:28, height:28, borderRadius:6, border:`1px solid ${open?"#C9A84C":"rgba(255,255,255,0.15)"}`, background: valid ? safe : "transparent", cursor:"pointer", flexShrink:0, position:"relative", overflow:"hidden", padding:0 }}>
          {!valid && <span style={{ position:"absolute", inset:0, background:"repeating-linear-gradient(45deg,#222,#222 3px,#444 3px,#444 6px)" }}/>}
        </button>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder="#----"
          style={{ width:72, background:"#111009", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"5px 7px", color:valid?"#F5F0E8":"#8A8478", fontSize:10, fontFamily:"monospace", outline:"none" }}/>
        {onClear && (
          <button type="button" onClick={onClear} title="Effacer"
            style={{ width:24, height:24, borderRadius:6, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"#8A8478", cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, padding:0 }}>×</button>
        )}
      </div>

      {open && (
        <div style={{ padding:10, background:"rgba(255,255,255,0.02)", border:"1px solid rgba(201,168,76,0.25)", borderRadius:10, display:"flex", flexDirection:"column", gap:9 }}>
          {/* Carre saturation / valeur */}
          <div ref={svRef} onPointerDown={e => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); onSV(e) }}
            onPointerMove={e => { if (e.buttons === 1) onSV(e) }}
            style={{ position:"relative", width:"100%", height:120, borderRadius:8, cursor:"crosshair", touchAction:"none",
              background:`linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hsvToHex(h,1,1)})` }}>
            <div style={{ position:"absolute", left:`${s*100}%`, top:`${(1-v)*100}%`, width:12, height:12, borderRadius:"50%", border:"2px solid #fff", boxShadow:"0 0 0 1px rgba(0,0,0,0.4)", transform:"translate(-50%,-50%)", pointerEvents:"none", background:safe }}/>
          </div>
          {/* Slider teinte */}
          <div ref={hueRef} onPointerDown={e => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); onHue(e) }}
            onPointerMove={e => { if (e.buttons === 1) onHue(e) }}
            style={{ position:"relative", width:"100%", height:14, borderRadius:7, cursor:"pointer", touchAction:"none",
              background:"linear-gradient(to right,#ff0000,#ffff00,#00ff00,#00ffff,#0000ff,#ff00ff,#ff0000)" }}>
            <div style={{ position:"absolute", left:`${(h/360)*100}%`, top:"50%", width:14, height:14, borderRadius:"50%", border:"2px solid #fff", boxShadow:"0 0 0 1px rgba(0,0,0,0.4)", transform:"translate(-50%,-50%)", pointerEvents:"none", background:hsvToHex(h,1,1) }}/>
          </div>
        </div>
      )}
    </div>
  )
}

export default function QRStudio({ qrCodes: initialQRCodes, userPlan, appUrl }: Props) {
  const [qrCodes,    setQRCodes]    = useState<QRCode[]>(initialQRCodes)
  const [activeId,   setActiveId]   = useState<string | null>(initialQRCodes[0]?.id ?? null)
  const [activeTab,  setActiveTab]  = useState<"style" | "supports" | "export">("style")
  const [showMoreFmt, setShowMoreFmt] = useState(false)
  const [fg,         setFg]         = useState("")
  const [bg,         setBg]         = useState("")
  const [corner,     setCorner]     = useState<"square"|"rounded"|"dot">("square")
  const [ecLevel,    setEcLevel]    = useState<"L"|"M"|"Q"|"H">("M")
  const [styleConf,  setStyleConf]  = useState<QRStyleConfig>({ ...DEFAULT_STYLE })
  const [styleTab,   setStyleTab]   = useState<"apparence"|"branding"|"qualite">("apparence")
  const [openAcc,    setOpenAcc]    = useState<string>("presets")
  const [autoMsg,    setAutoMsg]    = useState<string>("")
  const [applyAllOk,   setApplyAllOk]   = useState(false)
  const [selectedCat,  setSelectedCat]  = useState("all")
  const [upsell,        setUpsell]        = useState<{ feature: string; plan: string } | null>(null)
  const [expFormat,     setExpFormat]     = useState<"png"|"png-t"|"webp"|"svg"|"pdf">("png")
  const [expSize,       setExpSize]       = useState<512|1024|2048|4096|"custom">(1024)
  const [expCustomSize, setExpCustomSize] = useState(1024)
  const [expMargin,     setExpMargin]     = useState(10)
  const [expFilename,   setExpFilename]   = useState("")
  const [expIncludeName,setExpIncludeName]= useState(false)
  const [expIncludeUrl, setExpIncludeUrl] = useState(false)
  const [expExporting,  setExpExporting]  = useState(false)
  const [expCopied,     setExpCopied]     = useState<string | null>(null)
  // -- Types stats ---------------------------------------------------------
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
  // -- Destination states -----------------------------------------------
  type DestEntry = { type:string; value:string; url?:string; label?:string|null; set_at?:string|null }
  const [destMode,    setDestMode]    = useState<"view"|"edit">("view")
  const [destType,    setDestType]    = useState<"page"|"url"|"file"|"email"|"phone"|"whatsapp">("page")
  const [destValue,   setDestValue]   = useState("")
  const [destLabel,   setDestLabel]   = useState("")
  const [destLoading, setDestLoading] = useState(false)
  const [destError,   setDestError]   = useState("")
  const [destSaved,   setDestSaved]   = useState(false)
  const [destOverride,setDestOverride]= useState<DestEntry | null>(null)
  const [destHistory, setDestHistory] = useState<DestEntry[]>([])
  const [destConfirm, setDestConfirm] = useState(false)
  const [destCopied,  setDestCopied]  = useState(false)
  // -- QR Status states -------------------------------------------------
  const [qrStatusLoading,setQrStatusLoading]= useState<string | null>(null)
  const [pauseMsg,       setPauseMsg]       = useState("")
  const [showPauseMsgEdit,setShowPauseMsgEdit]=useState(false)
  const [confirmAction,  setConfirmAction]  = useState<{action:string;qrId:string;label:string}|null>(null)
  const [showArchived,   setShowArchived]   = useState(false)
  const [suppTplId,   setSuppTplId]   = useState("a4-poster")
  const [suppTitle,   setSuppTitle]   = useState("")
  const [suppSubtitle,setSuppSubtitle]= useState("Scannez pour voir le menu")
  const [suppRendered,setSuppRendered]= useState(false)
  const [suppExporting,setSuppExporting]=useState(false)
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [saveErr,    setSaveErr]    = useState("")
  const [copied,     setCopied]     = useState<"link"|"short"|null>(null)
  const [search,     setSearch]     = useState("")
  const [filterSt,   setFilterSt]   = useState("all")
  const [sortKey,    setSortKey]    = useState("date-desc")
  const [menuId,     setMenuId]     = useState<string | null>(null)
  const [confirmId,  setConfirmId]  = useState<string | null>(null)
  const [archivingId,setArchivingId]= useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [copyQRId,   setCopyQRId]   = useState<string | null>(null)
  const [dupId,      setDupId]      = useState<string | null>(null)
  const [showModal,  setShowModal]  = useState(false)
  const [diagFg,     setDiagFg]     = useState("")
  const [diagBg,     setDiagBg]     = useState("")
  const [logoUploading, setLogoUploading] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const canvasRef      = useRef<HTMLDivElement>(null)
  const canvasModalRef = useRef<HTMLDivElement>(null)
  const qrInstRef      = useRef<QRCodeStyling | null>(null)
  const qrModalInstRef = useRef<QRCodeStyling | null>(null)
  const scanWidgetRef  = useRef<HTMLDivElement>(null)

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
  // ECC force H si logo actif (logo masque des modules QR)
  const effectiveEcc = styleConf.logoUrl ? "H" : ecLevel

  // Construit les options de rendu QR a partir de l'etat courant
  function qrOpts(size: number): QROptions {
    return { data: qrUrl, fg, bg, ecc: effectiveEcc, style: styleConf, size }
  }

  // Rendu de l'apercu principal via qr-code-styling
  useEffect(() => {
    if (!canvasRef.current || !qrUrl) return
    const container = canvasRef.current
    if (!qrInstRef.current) {
      qrInstRef.current = createQR(qrOpts(720))
      container.innerHTML = ""
      qrInstRef.current.append(container)
    } else {
      updateQR(qrInstRef.current, qrOpts(720))
    }
  }, [qrUrl, fg, bg, corner, ecLevel, styleConf])

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

  // -- Calcul contraste WCAG -------------------------------------------------
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
  // -- Moteur de scannabilite complet ------------------------------------------
  type ScanIssue = {
    id:       string
    severity: "critical"|"warning"|"info"
    title:    string
    detail:   string
    fix?:     string   // label du fix auto
    fixable:  boolean
  }

  type ScanScore = {
    score:      number   // 0-100
    grade:      "Excellent"|"Bon"|"Moyen"|"Risque"
    gradeColor: string
    issues:     ScanIssue[]
    ratio:      string
    minSize:    string
    canAutoFix: boolean
  }

  function computeScannability(): ScanScore {
    const issues: ScanIssue[] = []
    let score = 100

    const fgHex = diagFg || fg || "#080808"
    const bgHex = diagBg || bg || "#FFFFFF"

    // -- 1. Contraste QR/fond --------------------------------------------------
    const ratio = contrastRatio(fgHex, bgHex)
    if (ratio < 2) {
      issues.push({ id:"contrast-critical", severity:"critical",
        title:"Contraste insuffisant", detail:`Ratio ${ratio.toFixed(1)}:1 -- le QR sera illisible sur la plupart des scanners.`,
        fix:"Passer en noir sur blanc", fixable:true })
      score -= 35
    } else if (ratio < 3) {
      issues.push({ id:"contrast-low", severity:"critical",
        title:"Contraste trop faible", detail:`Ratio ${ratio.toFixed(1)}:1 -- moins de 50% des scanners liront ce QR.`,
        fix:"Renforcer le contraste", fixable:true })
      score -= 25
    } else if (ratio < 4.5) {
      issues.push({ id:"contrast-warn", severity:"warning",
        title:"Contraste moyen", detail:`Ratio ${ratio.toFixed(1)}:1 -- privilegiez 4.5:1 minimum pour le print.`,
        fix:"Renforcer le contraste", fixable:true })
      score -= 12
    }

    // -- 2. Fond transparent risque --------------------------------------------
    if (styleConf.transparent) {
      issues.push({ id:"transparent", severity:"warning",
        title:"Fond transparent", detail:"Le fond transparent peut rendre le QR illisible sur les surfaces colorees.",
        fix:"Ajouter un fond blanc", fixable:true })
      score -= 10
    }

    // -- 3. Logo trop grand ----------------------------------------------------
    if (styleConf.logoUrl) {
      const logoSize = styleConf.logoSize ?? 18
      if (logoSize > 25) {
        issues.push({ id:"logo-big", severity:"critical",
          title:"Logo trop grand", detail:`${logoSize}% du QR est masque -- max recommande : 25%.`,
          fix:"Reduire le logo a 20%", fixable:true })
        score -= 20
      } else if (logoSize > 20) {
        issues.push({ id:"logo-warn", severity:"warning",
          title:"Logo un peu grand", detail:`${logoSize}% -- recommande : 15-20%.`,
          fix:"Reduire le logo a 18%", fixable:true })
        score -= 8
      }
      // ECC insuffisant avec logo
      if (effectiveEcc !== "H") {
        issues.push({ id:"ecc-logo", severity:"critical",
          title:"Correction insuffisante pour le logo", detail:"Avec un logo, la correction H est obligatoire.",
          fix:"Passer en ECC H", fixable:true })
        score -= 15
      }
    }

    // -- 4. Correction d'erreur faible sans logo -------------------------------
    if (!styleConf.logoUrl) {
      if (ecLevel === "L") {
        issues.push({ id:"ecc-l", severity:"warning",
          title:"Correction L trop légère", detail:"ECC L (7%) est insuffisant pour l'impression ou les surfaces abimees.",
          fix:"Passer en ECC M", fixable:true })
        score -= 8
      }
    }

    // -- 5. Marge insuffisante -------------------------------------------------
    const margin = styleConf.margin ?? 10
    if (margin < 4) {
      issues.push({ id:"margin-none", severity:"critical",
        title:"Marge trop petite", detail:`Marge ${margin}px -- minimum 4 modules (10px) requis pour la decouverte.`,
        fix:"Ajouter une marge de 12px", fixable:true })
      score -= 18
    } else if (margin < 8) {
      issues.push({ id:"margin-low", severity:"warning",
        title:"Marge réduite", detail:`Marge ${margin}px -- 10px+ recommande pour l'impression.`,
        fix:"Ajouter une marge de 10px", fixable:true })
      score -= 6
    }

    // -- 6. Style trop complexe ------------------------------------------------
    const dotStyle = styleConf.dotStyle ?? "square"
    if (dotStyle === "neon" || dotStyle === "luxury") {
      issues.push({ id:"style-complex", severity:"warning",
        title:"Style QR complexe", detail:"Les styles Néon/Luxury peuvent perturber la détection par certains scanners anciens.",
        fix:undefined, fixable:false })
      score -= 6
    }

    // -- 7. Couleurs trop proches (QR ~ fond) ----------------------------------
    const fgComponents = hexToRgb(fgHex)
    const bgComponents = hexToRgb(bgHex)
    const colorDist = Math.sqrt(
      Math.pow(fgComponents[0]-bgComponents[0], 2) +
      Math.pow(fgComponents[1]-bgComponents[1], 2) +
      Math.pow(fgComponents[2]-bgComponents[2], 2)
    )
    if (colorDist < 60 && ratio >= 3) {
      issues.push({ id:"colors-close", severity:"info",
        title:"Couleurs proches", detail:"La distance chromatique est faible — peut poser problème sur écrans à faible gamme.",
        fix:undefined, fixable:false })
      score -= 4
    }

    // -- 8. Degrades risques ---------------------------------------------------
    if (styleConf.gradient !== "none" && styleConf.fg2) {
      const ratio2 = contrastRatio(styleConf.fg2, bgHex)
      if (ratio2 < 3) {
        issues.push({ id:"gradient-contrast", severity:"warning",
          title:"Dégradé — couleur secondaire peu contrastée",
          detail:`La couleur fin de degrade a un contraste de ${ratio2.toFixed(1)}:1 avec le fond.`,
          fix:"Supprimer le dégradé", fixable:true })
        score -= 10
      }
    }

    score = Math.max(0, Math.min(100, score))
    const grade: ScanScore["grade"] = score >= 85 ? "Excellent" : score >= 65 ? "Bon" : score >= 40 ? "Moyen" : "Risque"
    const gradeColor = score >= 85 ? "#39FF8F" : score >= 65 ? "#C9A84C" : score >= 40 ? "#F97316" : "#FF6B6B"
    const minSize = ratio >= 7 ? "15mm" : ratio >= 4.5 ? "20mm" : ratio >= 3 ? "25mm" : "30mm+"
    const canAutoFix = issues.some(i => i.fixable)

    return { score, grade, gradeColor, issues, ratio: ratio.toFixed(1), minSize, canAutoFix }
  }

  // Compat getDiagnostic (utilise dans la modal)
  function getDiagnostic(fgHex: string, bgHex: string) {
    if (!fgHex || !bgHex) return null
    const ratio   = contrastRatio(fgHex, bgHex)
    const percent = Math.min(100, Math.round(((ratio-1)/(21-1))*100))
    const warnContrast = ratio < 3; const warnLow = ratio < 4.5
    const readability = ratio >= 7 ? "Excellente" : ratio >= 4.5 ? "Bonne" : ratio >= 3 ? "Moyenne" : "Risquee"
    const readColor   = ratio >= 7 ? "#39FF8F" : ratio >= 4.5 ? "#C9A84C" : ratio >= 3 ? "#F97316" : "#FF6B6B"
    const minSize = ratio >= 7 ? "15mm" : ratio >= 4.5 ? "20mm" : ratio >= 3 ? "25mm" : "30mm+"
    return { ratio: ratio.toFixed(1), percent, readability, readColor, minSize, warnContrast, warnLow }
  }

  // Canvas modal plein ecran
  // Rendu du QR plein ecran (modal) via qr-code-styling
  useEffect(() => {
    if (!showModal || !canvasModalRef.current || !qrUrl) return
    const container = canvasModalRef.current
    container.innerHTML = ""
    qrModalInstRef.current = createQR(qrOpts(800))
    qrModalInstRef.current.append(container)
  }, [showModal, qrUrl, fg, bg, corner, ecLevel, styleConf])
  useEffect(() => {
    if (!active) return
    setDestOverride((active.dest_override ?? null) as DestEntry | null)
    setDestHistory((active.dest_history ?? []) as DestEntry[])
    setDestMode("view")
    setDestError("")
  }, [activeId])

  useEffect(() => { setDiagFg(fg); setDiagBg(bg) }, [fg, bg])

  // Score scannabilite calcule a chaque changement de config
  const scanScore = active ? computeScannability() : null

  // Charger stats QR au changement de selection ou periode
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
    setSaveErr("")
    try {
      const res = await fetch("/api/qr-style", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          qr_id: active.id,
          foreground_color: fg,
          background_color: bg,
          corner_style: corner,
          error_correction: ecLevel,
          style_config: styleConf,
        }),
      })
      const d = await res.json()
      setSaving(false)
      if (!res.ok || d.error) {
        setSaveErr(d.error || "Echec de l'enregistrement")
        return
      }
      setQRCodes(prev => prev.map(q => q.id === active.id
        ? { ...q, foreground_color: fg, background_color: bg, corner_style: corner, error_correction: ecLevel, style_config: styleConf }
        : q))
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaving(false)
      setSaveErr("Erreur reseau")
    }
  }, [active, fg, bg, corner, ecLevel, styleConf])

  // -- Nom de fichier auto ----------------------------------------------------
  function getFilename(ext: string): string {
    const base = expFilename.trim() || active?.pages?.title?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || active?.short_code || "qr"
    return `${base}.${ext}`
  }

  // -- Construire canvas export a la taille voulue (avec logo) ----------------
  // Construit un canvas d'export via qr-code-styling (logo gere nativement)
  // + bandeau optionnel (nom page / url) dessine par-dessus.
  async function buildExportCanvas(px: number, transparent: boolean): Promise<HTMLCanvasElement> {
    const opts: QROptions = {
      data: qrUrl, fg, bg, ecc: effectiveEcc,
      style: { ...styleConf, transparent: transparent || styleConf.transparent },
      size: px,
    }
    const blob = await getQRBlob(opts, "png")
    if (!blob) throw new Error("QR generation failed")
    const url  = URL.createObjectURL(blob)
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = () => reject(new Error("QR image load failed"))
        i.src = url
      })
      const canvas = document.createElement("canvas")
      canvas.width = px; canvas.height = px
      const ctx = canvas.getContext("2d")!
      ctx.clearRect(0, 0, px, px)
      ctx.drawImage(img, 0, 0, px, px)

      // Bandeau bas : nom page + URL
      if (expIncludeName || expIncludeUrl) {
        const bannerH = Math.round(px * 0.08)
        ctx.fillStyle = "rgba(0,0,0,0.7)"
        ctx.fillRect(0, px - bannerH, px, bannerH)
        const fSize = Math.round(bannerH * 0.32)
        ctx.textAlign = "center"
        if (expIncludeName && active?.pages?.title) {
          ctx.fillStyle = "#F5F0E8"; ctx.font = `600 ${fSize}px 'DM Sans', Arial, sans-serif`
          ctx.fillText(active.pages.title, px/2, px - bannerH + fSize*1.1, px*0.9)
        }
        if (expIncludeUrl) {
          ctx.fillStyle = "#C9A84C"; ctx.font = `400 ${Math.round(fSize*0.8)}px monospace`
          ctx.fillText(qrUrl, px/2, px - bannerH + (expIncludeName?fSize*2.2:fSize*1.5), px*0.9)
        }
        ctx.textAlign = "start"
      }
      return canvas
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  }

  // -- Dupliquer un QR ----------------------------------------------------------
  async function duplicateQR(id: string) {
    setMenuId(null)
    if (dupId) return
    setDupId(id)
    try {
      const res = await fetch("/api/qr-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_id: id }),
      })
      const d = await res.json()
      if (!res.ok || d.error || !d.qr) {
        window.alert("Duplication impossible : " + (d.error || "erreur inconnue"))
        return
      }
      setQRCodes(prev => [d.qr, ...prev])
      setActiveId(d.qr.id)
    } catch {
      window.alert("Duplication impossible : erreur reseau")
    } finally {
      setDupId(null)
    }
  }

  // -- Fonctions QR Status ------------------------------------------------------
  async function changeQRStatus(qrId: string, action: string, extra?: Record<string, any>) {
    setQrStatusLoading(qrId)
    try {
      const res = await fetch("/api/qr-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_id: qrId, action, ...extra }),
      })
      const d = await res.json()
      if (d.ok) {
        setQRCodes(prev => prev.map(q => q.id === qrId
          ? { ...q, status: d.status, ...(extra?.pause_message !== undefined ? { pause_message: extra.pause_message } : {}) }
          : q
        ))
        if (activeId === qrId && d.status) {
          // Mettre a jour le qr actif
        }
      }
    } catch {}
    setQrStatusLoading(null)
    setConfirmAction(null)
    setMenuId(null)
  }

  async function hardDeleteQR(qrId: string) {
    setQrStatusLoading(qrId)
    try {
      await fetch("/api/qr-status", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_id: qrId }),
      })
      const rest = qrCodes.filter(q => q.id !== qrId)
      setQRCodes(rest)
      if (activeId === qrId) setActiveId(rest[0]?.id ?? null)
    } catch {}
    setQrStatusLoading(null)
    setConfirmAction(null)
  }

  function requestAction(qrId: string, action: string, label: string) {
    setConfirmAction({ action, qrId, label })
    setMenuId(null)
  }

  // -- Auto-fix scannabilite ----------------------------------------------------
  function autoFix() {
    if (!scanScore) return
    let newFg = fg; let newBg = bg; let newEc = ecLevel
    let newStyleConf = { ...styleConf }

    for (const issue of scanScore.issues) {
      if (!issue.fixable) continue
      switch (issue.id) {
        case "contrast-critical":
        case "contrast-low":
          newFg = "#080808"; newBg = "#FFFFFF"
          break
        case "contrast-warn":
          // Assombrir fg si fond clair, eclaircir si fond sombre
          newFg = parseInt(bg.replace("#","").slice(0,2),16) > 128 ? "#000000" : "#FFFFFF"
          break
        case "transparent":
          newStyleConf = { ...newStyleConf, transparent: false }
          break
        case "logo-big":
          newStyleConf = { ...newStyleConf, logoSize: 20 }
          break
        case "logo-warn":
          newStyleConf = { ...newStyleConf, logoSize: 18 }
          break
        case "ecc-logo":
        case "ecc-l":
          newEc = "H"
          break
        case "margin-none":
          newStyleConf = { ...newStyleConf, margin: 12 }
          break
        case "margin-low":
          newStyleConf = { ...newStyleConf, margin: 10 }
          break
        case "gradient-contrast":
          newStyleConf = { ...newStyleConf, gradient: "none", fg2: "" }
          break
      }
    }
    setFg(newFg); setBg(newBg); setEcLevel(newEc); setStyleConf(newStyleConf)
  }

  // -- Fonctions destination dynamique -----------------------------------------
  const DEST_TYPES = [
    { id:"page",     label:"Page QRfolio", icon:"📄", ph:"ID ou slug de la page" },
    { id:"url",      label:"URL externe",  icon:"🌐", ph:"https://mon-site.com"  },
    { id:"file",     label:"Fichier",      icon:"📎", ph:"https://drive.google.com/..." },
    { id:"email",    label:"Email",        icon:"✉️",  ph:"contact@mon-site.com" },
    { id:"phone",    label:"Telephone",    icon:"📞", ph:"+33 6 12 34 56 78"    },
    { id:"whatsapp", label:"WhatsApp",     icon:"💬", ph:"+33612345678"          },
  ]
  function getDestUrl(e: DestEntry | null): string { return e ? (e.url || e.value || pageUrl) : pageUrl }
  function getDestLabel(e: DestEntry | null): string {
    if (!e) return active?.pages?.title ?? "Page QRfolio"
    const cfg = DEST_TYPES.find(d => d.id === e.type)
    return e.label || cfg?.label || e.type
  }
  function getDestStatusColor(e: DestEntry | null): string {
    if (!e) return active?.pages?.status === "published" ? "#39FF8F" : "#8A8478"
    return e.type === "page" ? (active?.pages?.status === "published" ? "#39FF8F" : "#F97316") : "#38BDF8"
  }
  async function saveDest() {
    if (!active || !destValue.trim()) return
    setDestLoading(true); setDestError("")
    try {
      const res = await fetch("/api/qr-destination", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ qr_id:active.id, type:destType, value:destValue.trim(), label:destLabel.trim()||null }),
      })
      const d = await res.json()
      if (d.error) { setDestError(d.error); return }
      setDestOverride(d.dest_override); setDestHistory(d.dest_history ?? [])
      setQRCodes(prev => prev.map(q => q.id === active.id
        ? { ...q, dest_override:d.dest_override, dest_history:d.dest_history??[] } : q))
      setDestMode("view"); setDestSaved(true); setTimeout(()=>setDestSaved(false), 2500)
    } catch { setDestError("Erreur reseau") }
    setDestLoading(false); setDestConfirm(false)
  }
  async function removeDest() {
    if (!active) return
    setDestLoading(true)
    try {
      await fetch("/api/qr-destination", { method:"DELETE", headers:{"Content-Type":"application/json"}, body:JSON.stringify({qr_id:active.id}) })
      setDestOverride(null)
      setQRCodes(prev => prev.map(q => q.id === active.id ? {...q,dest_override:null} : q))
    } catch {}
    setDestLoading(false)
  }
  async function restoreDest(index: number) {
    if (!active) return; setDestLoading(true)
    try {
      const res = await fetch("/api/qr-destination", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({qr_id:active.id, index}) })
      const d   = await res.json()
      if (d.ok) {
        const hd = await fetch(`/api/qr-destination?qr_id=${active.id}`).then(r=>r.json())
        setDestOverride(hd.dest_override); setDestHistory(hd.dest_history??[])
      }
    } catch {}
    setDestLoading(false)
  }
  function copyDest() {
    navigator.clipboard.writeText(getDestUrl(destOverride)).catch(()=>{})
    setDestCopied(true); setTimeout(()=>setDestCopied(false), 2000)
  }

  // -- Templates supports imprimables -----------------------------------------
  type SuppTpl = {
    id: string; label: string; emoji: string; w: number; h: number
    plan: string; cat: string; desc: string
  }

  const SUPP_TPLS: SuppTpl[] = [
    { id:"qr-only",     label:"QR seul",           emoji:"▣", w:800,  h:800,  plan:"free",     cat:"Base",       desc:"QR Code sans decoration" },
    { id:"a4-poster",   label:"Affiche A4",         emoji:"📋", w:795,  h:1122, plan:"free",     cat:"Print",      desc:"Portrait A4 avec titre et fond" },
    { id:"flyer",       label:"Flyer",              emoji:"📄", w:795,  h:561,  plan:"free",     cat:"Print",      desc:"Demi A4 paysage" },
    { id:"sticker",     label:"Sticker vitrine",    emoji:"🏷️",  w:600,  h:600,  plan:"free",     cat:"Print",      desc:"Carré 6cm avec cadre" },
    { id:"table-card",  label:"Carte de table",     emoji:"🪧",  w:900,  h:506,  plan:"pro",      cat:"Restaurant", desc:"Format paysage 9x5cm" },
    { id:"menu-qr",     label:"Menu QR",            emoji:"🍽",  w:600,  h:900,  plan:"pro",      cat:"Restaurant", desc:"Carte portrait avec titre menu" },
    { id:"business",    label:"Carte de visite",    emoji:"💳", w:1063, h:591,  plan:"pro",      cat:"Business",   desc:"Format CR80 standard" },
    { id:"event-badge", label:"Badge evenement",    emoji:"🎫", w:680,  h:400,  plan:"pro",      cat:"Event",      desc:"Badge horizontal 85x50mm" },
    { id:"story",       label:"Story Instagram",    emoji:"📱", w:1080, h:1920, plan:"business", cat:"Social",     desc:"9:16 vertical stories" },
    { id:"post",        label:"Post Instagram",     emoji:"🟫", w:1080, h:1080, plan:"business", cat:"Social",     desc:"Carré 1:1" },
  ]

  // -- Rendu d'un support sur canvas ----------------------------------------
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

    // -- QR seul ------------------------------------------------------------
    if (tpl.id === "qr-only") {
      if (qrImg) ctx.drawImage(qrImg, 0, 0, w, h)
      return
    }

    // -- Fond commun --------------------------------------------------------
    if (tpl.id === "story" || tpl.id === "post") {
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, bgColor); grad.addColorStop(1, isDark ? "#0A0A0A" : "#E8E8E8")
      ctx.fillStyle = grad
    } else {
      ctx.fillStyle = bgColor
    }
    ctx.fillRect(0, 0, w, h)

    // -- Bande de couleur laterale (sauf social) ----------------------------
    if (!["story","post","qr-only"].includes(tpl.id)) {
      ctx.fillStyle = fgColor
      const bw = Math.round(w * 0.04)
      ctx.fillRect(0, 0, bw, h)
    }

    // -- Templates specifiques ---------------------------------------------
    const pad    = Math.round(w * 0.06)
    const bw     = Math.round(w * 0.04)  // largeur bande

    const drawQR = (x: number, y: number, size: number) => {
      if (!qrImg) return
      // Fond blanc derriere le QR si fond sombre
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

    // -- A4 Poster ----------------------------------------------------------
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

    // -- Flyer --------------------------------------------------------------
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

    // -- Sticker ------------------------------------------------------------
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

    // -- Carte de table -----------------------------------------------------
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

    // -- Menu QR ------------------------------------------------------------
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

    // -- Carte de visite ----------------------------------------------------
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

    // -- Badge evenement ----------------------------------------------------
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

    // -- Story Instagram ----------------------------------------------------
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

    // -- Post Instagram -----------------------------------------------------
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

  // -- Generer preview support -----------------------------------------------
  const previewSupport = useCallback(async () => {
    const canvas = supportCanvasRef.current; if (!canvas) return
    const tpl    = SUPP_TPLS.find(t => t.id === suppTplId)
    if (!tpl) return
    try {
      // Generer le QR a la bonne taille via qr-code-styling (logo inclus)
      const qrPx    = Math.min(tpl.w, tpl.h)
      const qrBlob  = await getQRBlob({ data: qrUrl, fg, bg, ecc: effectiveEcc, style: styleConf, size: qrPx }, "png")
      if (!qrBlob) throw new Error("qr gen failed")
      const qrDataUrl = await blobToDataUrl(qrBlob)
      // Scale pour la preview (max 300px de large)
      const previewScale = Math.min(1, 280 / tpl.w)
      await renderSupport(canvas, tpl, { title:suppTitle, subtitle:suppSubtitle, qrDataUrl, logoUrl:styleConf.logoUrl, scale:previewScale })
      setSuppRendered(true)
    } catch { setSuppRendered(false) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suppTplId, qrUrl, fg, bg, ecLevel, styleConf, suppTitle, suppSubtitle])

  // Preview LIVE : regenere automatiquement quand un parametre change (debounce)
  useEffect(() => {
    if (activeTab !== "supports" || !active) return
    const t = setTimeout(() => { previewSupport() }, 250)
    return () => clearTimeout(t)
  }, [activeTab, active, previewSupport])

  // -- Export support --------------------------------------------------------
  async function exportSupport(fmt: "png"|"pdf") {
    const tpl = SUPP_TPLS.find(t => t.id === suppTplId); if (!tpl) return
    setSuppExporting(true)
    try {
      const qrPx    = Math.min(tpl.w, tpl.h) * 2
      const qrBlob  = await getQRBlob({ data: qrUrl, fg, bg, ecc: effectiveEcc, style: styleConf, size: qrPx }, "png")
      if (!qrBlob) throw new Error("qr gen failed")
      const qrDataUrl = await blobToDataUrl(qrBlob)
      const outCanvas = document.createElement("canvas")
      await renderSupport(outCanvas, tpl, { title:suppTitle, subtitle:suppSubtitle, qrDataUrl, scale:2 })
      const filename  = `${(tpl.label).replace(/\s+/g,"-").toLowerCase()}-${active?.short_code ?? "qr"}.${fmt}`
      if (fmt === "pdf") {
        // Vrai PDF via jsPDF, oriente selon le support
        const { jsPDF } = await import("jspdf")
        const isPort = tpl.h > tpl.w
        const pdf = new jsPDF({ unit: "pt", format: "a4", orientation: isPort ? "portrait" : "landscape" })
        const PW = pdf.internal.pageSize.getWidth()
        const PH = pdf.internal.pageSize.getHeight()
        const dataUrl = outCanvas.toDataURL("image/png", 1.0)
        const ratio = Math.min(PW / outCanvas.width, PH / outCanvas.height)
        const iw = outCanvas.width * ratio
        const ih = outCanvas.height * ratio
        pdf.setFillColor(255, 255, 255); pdf.rect(0, 0, PW, PH, "F")
        pdf.addImage(dataUrl, "PNG", (PW - iw) / 2, (PH - ih) / 2, iw, ih)
        pdf.save(filename)
      } else {
        const a = document.createElement("a"); a.href = outCanvas.toDataURL("image/png",1.0); a.download = filename; a.click()
      }
    } catch (e) { console.error("Export support error:", e) }
    setSuppExporting(false)
  }

    // -- Export principal -------------------------------------------------------
  async function runExport() {
    if (!active || expExporting) return
    if (scanScore && scanScore.score < 30) {
      const crits = scanScore.issues.filter(i => i.severity === "critical")
      if (crits.length > 0 && !window.confirm("Score critique (" + scanScore.score + "/100). Exporter quand meme ?")) return
    }
    setExpExporting(true)
    try {
      const px = expSize === "custom" ? Math.max(256, Math.min(8192, expCustomSize)) : expSize
      const isTransparent = expFormat === "png-t"
      const opts: QROptions = {
        data: qrUrl, fg, bg, ecc: effectiveEcc,
        style: { ...styleConf, transparent: isTransparent || styleConf.transparent, margin: expMargin },
        size: px,
      }

      if (expFormat === "svg") {
        const blob = await getQRBlob(opts, "svg")
        if (blob) downloadBlob(blob, getFilename("svg"))

      } else if (expFormat === "pdf") {
        // Vrai PDF A4 via jsPDF (QR PNG haute def + titre + url)
        const pngBlob = await getQRBlob({ ...opts, style: { ...opts.style, transparent: false } }, "png")
        if (pngBlob) {
          await buildAndDownloadPdf(pngBlob, getFilename("pdf"), {
            title: active?.pages?.title ?? "",
            url: qrUrl,
          })
        }

      } else {
        // PNG / PNG transparent / WEBP — avec bandeau optionnel si demande
        const ext = expFormat === "webp" ? "webp" : "png"
        if (expIncludeName || expIncludeUrl) {
          const canvas = await buildExportCanvas(px, isTransparent)
          const mime = expFormat === "webp" ? "image/webp" : "image/png"
          const dataUrl = expFormat === "webp" ? canvas.toDataURL(mime, 0.92) : canvas.toDataURL(mime)
          const a = document.createElement("a"); a.href = dataUrl; a.download = getFilename(ext); a.click()
        } else {
          const blob = await getQRBlob(opts, ext as "png" | "webp")
          if (blob) downloadBlob(blob, getFilename(ext))
        }
      }
    } catch (e) { console.error("Export error:", e) }
    setExpExporting(false)
  }

  // -- Copier image dans le presse-papier ------------------------------------
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

  // -- Copier SVG texte ------------------------------------------------------
  async function copySVG() {
    if (!active) return
    try {
      const blob = await getQRBlob(qrOpts(400), "svg")
      if (!blob) throw new Error("no svg")
      const text = await blob.text()
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
    setSelectedCat("all")
  }

  // Upload logo -> Supabase Storage OU data URL si pas encore uploade
  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith("image/")) return
    if (file.size > 2 * 1024 * 1024) {
      alert("Logo trop volumineux (max 2 Mo)")
      return
    }
    setLogoUploading(true)
    try {
      // Convertir en data URL pour preview immediate
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setStyleConf(p => ({ ...p, logoUrl: dataUrl }))
        // Si ECC n'est pas deja H, le forcer (effectiveEcc s'en charge automatiquement)
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
    if (!canAccess) { setUpsell({ feature: `le style « ${preset.label} »`, plan: preset.plan }); return }
    setFg(preset.fg)
    setBg(preset.bg)
    // Sync corner state legacy (utilise pour le clipping canvas)
    if (preset.cornerStyle === "rounded" || preset.cornerStyle === "circle" || preset.cornerStyle === "luxury" || preset.dotStyle === "rounded") setCorner("rounded")
    else if (preset.dotStyle === "dot" || preset.cornerStyle === "minimal") setCorner("dot")
    else setCorner("square")
    // ECC (uniquement si defini par le preset)
    if (preset.ecc) setEcLevel(preset.ecc)
    setStyleConf(p => ({
      ...p,
      fg2:          preset.fg2 ?? "",
      cornerColor:  preset.cornerColor ?? "",
      eyeColor:     preset.eyeColor ?? "",
      gradient:     preset.gradient ?? "none",
      gradientBg:   preset.gradientBg ?? "",
      dotStyle:     (preset.dotStyle as any) ?? "square",
      cornerStyle:  (preset.cornerStyle as any) ?? "square",
      ...(preset.margin  !== undefined ? { margin: preset.margin }   : {}),
      ...(preset.density !== undefined ? { density: preset.density } : {}),
      ...(preset.transparent !== undefined ? { transparent: preset.transparent } : {}),
    }))
  }

  // -- Style automatique : detecte la categorie via le titre/destination -------
  const RECO_KEYWORDS: { cat: string; words: string[] }[] = [
    { cat:"restaurant", words:["resto","restaurant","pizz","bistro","cafe","café","coffee","brasserie","burger","sushi","food","cuisine","traiteur","cocktail","wine","vin","boulang","patiss","menu","gourmet","steak","kebab","tacos","glace","trattoria","grill","tapas","ramen"] },
    { cat:"creator",    words:["photo","studio","portfolio","createur","créateur","creator","artist","artiste","design","youtube","tiktok","insta","twitch","stream","podcast","influence","blog","music","musique","beauty","makeup","tattoo","dj","mix","prod","beatmaker","danse","model"] },
    { cat:"tech",       words:["tech","dev","software","app","saas","web3","crypto","blockchain","data","cyber","code","digital","startup","ia "," ai","robot","quantum","gaming","game","esport"] },
    { cat:"event",      words:["mariage","wedding","event","evenement","événement","gala","soiree","soirée","concert","festival","conference","conférence","anniversaire","birthday","networking","seminaire","club","party","fete","fête"] },
    { cat:"luxury",     words:["luxe","luxury","premium","joaill","bijou","jewel","prestige","diamond","exclusif","exclusive","monaco","yacht","or fin","haute","spa","institut"] },
    { cat:"business",   words:["agence","agency","consult","avocat","cabinet","finance","immo","immobilier","entreprise","corporate","conseil","expert","comptable","assurance","freelance","b2b","coach","notaire","salon","coiffure","barber","auto","garage"] },
  ]

  function detectCat(): string {
    const blob = `${active?.pages?.title ?? ""} ${active?.pages?.slug ?? ""} ${destValue}`.toLowerCase()
    if (blob.trim()) {
      for (const g of RECO_KEYWORDS) {
        if (g.words.some(w => blob.includes(w))) return g.cat
      }
    }
    return "classic"
  }

  function pickPreset(cat: string): Preset | null {
    const inCat = PRESETS.filter(p => p.cat === cat)
    if (!inCat.length) return null
    const accessible = inCat.filter(p => PLAN_RANK[userPlan] >= PLAN_RANK[p.plan])
    const pool = accessible.length ? accessible : inCat
    // eviter de re-appliquer le style deja actif -> garantit un changement visible
    const different = pool.find(p => !(p.fg === fg && p.bg === bg))
    return different ?? pool[0]
  }

  function autoStyle() {
    const cat = detectCat()
    setSelectedCat(cat)
    const p = pickPreset(cat)
    if (p) {
      applyPreset(p)
      const catLabel = PRESET_CATS.find(c => c.id === cat)?.label ?? cat
      setAutoMsg(`Style « ${p.label} » applique (${catLabel})`)
      setTimeout(() => setAutoMsg(""), 3500)
    }
  }

  // -- Generateur de palette coherente (contraste garanti) ----------------------
  function hslToHex(h: number, s: number, l: number): string {
    s /= 100; l /= 100
    const k = (n: number) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n: number) => {
      const c = l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
      return Math.round(255 * c).toString(16).padStart(2, "0")
    }
    return `#${f(0)}${f(8)}${f(4)}`
  }

  function genPalette() {
    const hue = Math.floor(Math.random() * 360)
    const darkBg = Math.random() < 0.5
    let newFg: string, newBg: string, cornerC: string, eyeC: string
    if (darkBg) {
      newBg   = hslToHex(hue, 35, 8)
      newFg   = hslToHex(hue, 15, 92)
      cornerC = hslToHex((hue + 30) % 360, 80, 62)
      eyeC    = hslToHex((hue + 30) % 360, 85, 72)
    } else {
      newBg   = hslToHex(hue, 30, 97)
      newFg   = hslToHex(hue, 60, 20)
      cornerC = hslToHex((hue + 30) % 360, 70, 38)
      eyeC    = hslToHex((hue + 30) % 360, 72, 48)
    }
    setFg(newFg)
    setBg(newBg)
    setStyleConf(p => ({ ...p, cornerColor: cornerC, eyeColor: eyeC, gradient: "none", fg2: "", gradientBg: "" }))
  }

  async function applyToAll() {
    const sb = createClient()
    const payload = { foreground_color:fg, background_color:bg, corner_style:corner, error_correction:ecLevel, style_config:styleConf, updated_at:new Date().toISOString() }
    await sb.from("qr_codes").update(payload).eq("user_id", (qrCodes[0] as any)?.user_id ?? "")
    setQRCodes(prev => prev.map(q => ({ ...q, ...payload })))
    setApplyAllOk(true); setTimeout(()=>setApplyAllOk(false), 2500)
  }

  const [sb_asc, sb_dir] = sortKey.split("-")
  const filteredQR = qrCodes
    .filter(qr => {
      const t  = qr.pages?.title?.toLowerCase() ?? ""
      const c  = qr.short_code?.toLowerCase() ?? ""
      const qs = qr.status ?? "active"
      // Masquer les archives sauf si filtre explicite ou showArchived
      if (qs === "archived" && filterSt !== "archived" && !showArchived) return false
      return (!search || t.includes(search.toLowerCase()) || c.includes(search.toLowerCase()))
        && (filterSt === "all" || qs === filterSt)
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
    <div className="qr-grid" style={{ display:"grid", gridTemplateColumns:"clamp(240px,20vw,300px) 1.4fr clamp(280px,24vw,340px)", gap:0, minHeight:"calc(100vh - 80px)", background:BG, borderRadius:16, border:"1px solid rgba(201,168,76,0.1)", overflow:"hidden", fontFamily:"DM Sans, sans-serif", position:"relative" }}>


      {/* -- Modal preview plein ecran ------------------------------------------- */}
      {showModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.92)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2000, padding:32 }}
          onClick={() => setShowModal(false)}>
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20, maxWidth:600, width:"100%" }}
            onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", width:"100%" }}>
              <div>
                <p style={{ color:"#F5F0E8", fontSize:16, fontWeight:700, margin:"0 0 3px" }}>{active?.pages?.title}</p>
                <p style={{ color:"#8A8478", fontSize:11, margin:0 }}>Scannez pour tester * {appUrl}/q/{active?.short_code}</p>
              </div>
              <button type="button" onClick={() => setShowModal(false)}
                style={{ width:36, height:36, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#8A8478" }}>
                <X size={16}/>
              </button>
            </div>

            {/* QR grand */}
            <div style={{ padding:28, borderRadius:24, background:bg, boxShadow:"0 0 0 1px rgba(201,168,76,0.3), 0 32px 80px rgba(0,0,0,0.9)" }}>
              <div ref={canvasModalRef} data-qr-container style={{ display:"flex", width:320, height:320, alignItems:"center", justifyContent:"center" }}/>
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

      {/* -- Modale UPGRADE (conversion) ---------------------------------------- */}
      {upsell && (() => {
        const isBiz = upsell.plan === "business"
        const planName = isBiz ? "Business" : "Pro"
        const accent = isBiz ? "#39FF8F" : "#C9A84C"
        const benefits = isBiz
          ? ["Tous les presets premium ET luxe", "Modules & coins luxe", "Export PDF, SVG et WEBP", "Correction d'erreur maximale", "Logo central + branding complet"]
          : ["Tous les presets premium", "Modules avances (pixel, neon...)", "Coins avances (diamond...)", "Export SVG et WEBP", "Correction d'erreur elevee (H)"]
        return (
          <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", backdropFilter:"blur(4px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:2100, padding:24 }}
            onClick={() => setUpsell(null)}>
            <div onClick={e => e.stopPropagation()}
              style={{ width:"100%", maxWidth:380, background:"linear-gradient(180deg,#14120C,#0C0B08)", border:`1px solid ${accent}40`, borderRadius:18, padding:"24px 22px", position:"relative", boxShadow:`0 24px 80px rgba(0,0,0,0.7), 0 0 40px ${accent}15` }}>
              <button type="button" onClick={() => setUpsell(null)}
                style={{ position:"absolute", top:14, right:14, background:"rgba(255,255,255,0.05)", border:"none", borderRadius:8, width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:MUTED }}>
                <X size={15}/>
              </button>

              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center" as const, gap:6, marginBottom:18 }}>
                <div style={{ width:52, height:52, borderRadius:14, background:`${accent}18`, border:`1px solid ${accent}40`, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:4 }}>
                  <Sparkles size={24} color={accent}/>
                </div>
                <p style={{ color:"#F5F0E8", fontSize:18, fontWeight:800, margin:0, fontFamily:"Cormorant Garamond, serif" }}>Passez à {planName}</p>
                <p style={{ color:MUTED, fontSize:12, margin:0, lineHeight:1.5 }}>Pour débloquer {upsell.feature} et bien plus.</p>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:9, marginBottom:20 }}>
                {benefits.map((b, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:9 }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", background:`${accent}20`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <Check size={11} color={accent}/>
                    </div>
                    <span style={{ color:"#F5F0E8", fontSize:12.5 }}>{b}</span>
                  </div>
                ))}
              </div>

              <a href="/dashboard/upgrade"
                style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7, width:"100%", padding:"13px", background:`linear-gradient(90deg,${accent},${isBiz?"#2bd673":"#b8953f"})`, borderRadius:11, color:"#080808", fontSize:14, fontWeight:800, textDecoration:"none", boxShadow:`0 6px 20px ${accent}30` }}>
                Voir les offres {planName}
              </a>
              <button type="button" onClick={() => setUpsell(null)}
                style={{ width:"100%", marginTop:8, padding:"8px", background:"none", border:"none", color:MUTED, fontSize:11, cursor:"pointer" }}>
                Plus tard
              </button>
            </div>
          </div>
        )
      })()}

      {/* -- Modale suppression -------------------------------------------------- */}
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
                {deletingId ? <><Loader2 size={13} style={{ animation:"spin 0.8s linear infinite" }}/> Suppression...</> : <><Trash2 size={13}/> Supprimer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay fermeture menu */}
      {menuId !== null && (
        <div style={{ position:"fixed", inset:0, zIndex:90 }} onClick={() => setMenuId(null)}/>
      )}

      {/* -- COL 1 : Liste ------------------------------------------------------ */}
      <div className="qr-col-list" style={{ borderRight:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", overflow:"hidden" }}>

        {/* Header + filtres */}
        <div style={{ padding:"12px 12px 10px", borderBottom:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", gap:8 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <p style={{ color:"#F5F0E8", fontSize:11, fontWeight:700, margin:"0 0 1px" }}>QR Codes</p>
              <p style={{ color:MUTED, fontSize:9, margin:0 }}>
                {qrCodes.length} total
              </p>
            </div>
            <div style={{ display:"flex", gap:5, alignItems:"center" }}>
              <span style={{ background:"rgba(201,168,76,0.12)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:5, padding:"1px 7px", fontSize:10, color:G, fontWeight:700 }}>{filteredQR.length}/{qrCodes.length}</span>
              <button type="button" onClick={() => setShowArchived(p => !p)}
                style={{ padding:"1px 6px", background:showArchived?"rgba(107,114,128,0.2)":"transparent", border:"1px solid rgba(107,114,128,0.2)", borderRadius:5, color:MUTED, fontSize:8, cursor:"pointer" }}>
                {showArchived?"- Archives":"+ Archives"}
              </button>
            </div>
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
              <option value="active">Actif</option>
              <option value="draft">Brouillon</option>
              <option value="paused">En pause</option>
              <option value="archived">Archive</option>
              <option value="expired">Expire</option>
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
        <div className="qr-scroll" style={{ flex:1, overflowY:"auto", paddingTop:10 }}>
          {filteredQR.length === 0 ? (
            <div style={{ textAlign:"center", padding:"32px 12px", color:MUTED }}>
              <QrCode size={24} color={MUTED} style={{ marginBottom:8 }}/>
              {qrCodes.length === 0 ? (
                <>
                  <p style={{ fontSize:12, margin:"0 0 3px", color:"#F5F0E8", fontWeight:600 }}>Aucun QR pour l'instant</p>
                  <p style={{ fontSize:10, margin:0, lineHeight:1.5 }}>Creez votre premiere page<br/>pour demarrer</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize:12, margin:"0 0 3px", color:"#F5F0E8", fontWeight:600 }}>Aucun resultat</p>
                  <p style={{ fontSize:10, margin:0, lineHeight:1.5 }}>Aucun QR ne correspond<br/>a vos filtres</p>
                </>
              )}
            </div>
          ) : filteredQR.map(qr => {
            const page = qr.pages
            const isA  = qr.id === activeId
            const qs   = qr.status ?? "active"
            const sCfg = QR_STATUS_CFG[qs] ?? QR_STATUS_CFG.active
            const url  = `${appUrl}/q/${qr.short_code}`
            const isM  = menuId === qr.id
            const isC  = copyQRId === qr.id
            const pb   = PLAN_BADGE[userPlan]
            return (
              <div key={qr.id} onClick={() => { setActiveId(qr.id); setMenuId(null) }}
                style={{ margin:"0 10px 8px", padding:"12px", cursor:"pointer", borderRadius:12, border:`1px solid ${isA?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.07)"}`, background:isA?"rgba(201,168,76,0.07)":"rgba(255,255,255,0.02)", boxShadow:isA?"0 4px 16px rgba(201,168,76,0.08)":"none", position:"relative", transition:"all 0.15s" }}
                onMouseEnter={e => { if (!isA) e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)" }}
                onMouseLeave={e => { if (!isA) e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)" }}>
                <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
                  <div style={{ width:34, height:34, borderRadius:8, background:qr.background_color, border:`1px solid ${qs==="active"?"rgba(57,255,143,0.3)":qs==="paused"?"rgba(249,115,22,0.3)":qs==="expired"?"rgba(255,107,107,0.3)":"rgba(255,255,255,0.1)"}`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, position:"relative" }}>
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
                    <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:3 }}>
                      {qr.last_scan_at && (new Date().getTime() - new Date(qr.last_scan_at).getTime()) < 86400000 && (
                        <div style={{ width:5, height:5, borderRadius:"50%", background:"#39FF8F", animation:"pulse 1.5s infinite", flexShrink:0 }}/>
                      )}
                      <p style={{ color:MUTED, fontSize:9, margin:0 }}>
                        {qr.last_scan_at ? formatDate(qr.last_scan_at) : "Jamais scanné"}
                      </p>
                    </div>
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
                      { icon: <Pencil size={11}/>,  label: "Modifier",     action: () => { window.location.href = `/dashboard/builder/${page?.id}` }, color: "#F5F0E8", disabled: false },
                      { icon: isC ? <Check size={11}/> : <Copy size={11}/>, label: isC ? "Copie !" : "Copier lien", action: () => copyQRLink(qr.id, url), color: isC ? "#39FF8F" : "#F5F0E8", disabled: false },
                      { icon: <Download size={11}/>, label: "PNG",          action: () => { setActiveId(qr.id); setTimeout(() => downloadPNG(400), 100); setMenuId(null) }, color: "#F5F0E8", disabled: false },
                      { icon: dupId === qr.id ? <Loader2 size={11} style={{ animation:"spin 0.8s linear infinite" }}/> : <Copy size={11}/>, label: dupId === qr.id ? "Duplication..." : "Dupliquer", action: () => duplicateQR(qr.id), color: "#F5F0E8", disabled: dupId === qr.id },
                      ...(qs === "active" ? [{ icon: <Archive size={11}/>, label: "Mettre en pause", action: () => requestAction(qr.id, "pause", "Mettre en pause"), color: "#F97316", disabled: false }] : []),
                      ...(qs === "paused" || qs === "draft" ? [{ icon: <Check size={11}/>, label: "Activer", action: () => changeQRStatus(qr.id, "activate"), color: "#39FF8F", disabled: false }] : []),
                      ...(qs !== "archived" ? [{ icon: <Archive size={11}/>, label: "Archiver", action: () => requestAction(qr.id, "archive", "Archiver ce QR"), color: "#6B7280", disabled: false }] : [{ icon: <RotateCcw size={11}/>, label: "Restaurer", action: () => changeQRStatus(qr.id, "restore"), color: "#38BDF8", disabled: false }]),
                      { icon: <Trash2 size={11}/>,   label: "Supprimer definitif", action: () => requestAction(qr.id, "delete", "Supprimer definitivement ce QR ?"), color: "#FF6B6B", disabled: qs !== "archived" },
                    ]).map((item, i) => (
                      <button key={i} type="button" onClick={item.disabled ? undefined : item.action} disabled={item.disabled}
                        style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"none", border:"none", color:item.disabled ? "rgba(138,132,120,0.4)" : item.color, fontSize:11, cursor:item.disabled ? "not-allowed" : "pointer", borderRadius:7, textAlign:"left" as const }}>
                        {archivingId === qr.id && item.label === "Archiver"
                          ? <Loader2 size={11} style={{ animation:"spin 0.8s linear infinite" }}/>
                          : item.icon
                        }
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Actions rapides si selectionne */}
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

      {/* -- COL 2 : Preview premium -------------------------------------------- */}
      <div className="qr-col-preview" style={{ display:"flex", flexDirection:"column", overflow:"hidden", background:"#0A0907" }}>
        {/* Section label */}
        <div style={{ padding:"10px 16px 8px", borderBottom:"1px solid rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>Aperçu</p>
          {active && (
            <span style={{ color:MUTED, fontSize:9 }}>
              {new Date(active.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"short", year:"numeric" })}
            </span>
          )}
        </div>
        {active ? (() => {
          const diag = getDiagnostic(diagFg || fg, diagBg || bg)
          return (
            <div className="qr-scroll" style={{ display:"flex", flexDirection:"column", height:"100%", overflowY:"auto" }}>

              {/* QR Card */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:"36px 24px 24px", gap:20, borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ position:"relative" }}>
                  <div style={{ position:"relative", padding:28, borderRadius:28, background:bg, boxShadow:`0 0 0 1px rgba(201,168,76,0.25), 0 28px 80px rgba(0,0,0,0.85)`, transition:"background 0.3s", cursor:"pointer" }}
                    onClick={() => setShowModal(true)}>
                    {[["top","left"],["top","right"],["bottom","left"],["bottom","right"]].map(([v,h], i) => (
                      <div key={i} style={{ position:"absolute", [v]:10, [h]:10, width:18, height:18,
                        borderTop:    v==="top"    ? "2px solid rgba(201,168,76,0.7)" : "none",
                        borderBottom: v==="bottom" ? "2px solid rgba(201,168,76,0.7)" : "none",
                        borderLeft:   h==="left"   ? "2px solid rgba(201,168,76,0.7)" : "none",
                        borderRight:  h==="right"  ? "2px solid rgba(201,168,76,0.7)" : "none",
                      }}/>
                    ))}
                    <div ref={canvasRef} data-qr-container style={{ display:"flex", width:"min(46vh, 360px)", height:"min(46vh, 360px)", alignItems:"center", justifyContent:"center" }}/>
                    {/* Hover overlay */}
                    <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0)", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:28, transition:"background 0.2s" }}
                      onMouseEnter={e => (e.currentTarget.style.background="rgba(0,0,0,0.4)")}
                      onMouseLeave={e => (e.currentTarget.style.background="rgba(0,0,0,0)")}>
                      <span style={{ color:"rgba(255,255,255,0)", fontSize:13, fontWeight:700, transition:"color 0.2s", pointerEvents:"none" }}
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
                    const sCfg = ({ published:{dot:"#39FF8F",label:"Publié"}, draft:{dot:"#8A8478",label:"Brouillon"}, archived:{dot:"#F97316",label:"Archivé"}, paused:{dot:"#FF6B6B",label:"En pause"} } as any)[st] ?? {dot:"#8A8478",label:"Inconnu"}
                    return (
                      <span style={{ display:"inline-flex", alignItems:"center", gap:4, fontSize:10, color:sCfg.dot, background:`${sCfg.dot}15`, border:`1px solid ${sCfg.dot}40`, borderRadius:6, padding:"2px 8px", fontWeight:600 }}>
                        <div style={{ width:5, height:5, borderRadius:"50%", background:sCfg.dot }}/>{sCfg.label}
                      </span>
                    )
                  })()}

                  {/* Pastille score scannabilite (permanente) */}
                  {scanScore && (
                    <div
                      onClick={() => scanWidgetRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })}
                      style={{ display:"inline-flex", alignItems:"center", gap:8, marginTop:10, marginLeft:6, padding:"6px 12px", background:`${scanScore.gradeColor}12`, border:`1px solid ${scanScore.gradeColor}40`, borderRadius:20, cursor:"pointer", verticalAlign:"middle" }}>
                      <span style={{ display:"flex", alignItems:"center", justifyContent:"center", width:22, height:22, borderRadius:"50%", background:scanScore.gradeColor, color:"#080808", fontSize:10, fontWeight:800 }}>
                        {scanScore.score}
                      </span>
                      <span style={{ color:scanScore.gradeColor, fontSize:12, fontWeight:700 }}>{scanScore.grade}</span>
                      <span style={{ color:MUTED, fontSize:10 }}>scannabilite</span>
                    </div>
                  )}
                </div>

                {/* Actions rapides */}
                <div style={{ display:"flex", flexDirection:"column", gap:7, width:"100%" }}>
                  <button type="button" onClick={() => downloadPNG(1024)}
                    style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"11px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", border:"none", borderRadius:10, color:"#080808", fontSize:13, fontWeight:700, cursor:"pointer", boxShadow:"0 4px 14px rgba(201,168,76,0.2)" }}>
                    <Download size={15}/> Télécharger
                  </button>
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
              </div>

              {/* Stats */}
              {/* Stats QR */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
                {[
                  { label:"Scans total",   value:active.total_scans.toLocaleString(),               color:"#C9A84C", icon:"📡" },
                  { label:"Vues page",     value:(active.pages?.total_views ?? 0).toLocaleString(),  color:"#39FF8F", icon:"👁" },
                  { label:"Dernier scan",  value:formatDate(active.last_scan_at),                   color:"#8A8478", icon:"🕐" },
                  { label:"Créé le",       value:new Date(active.created_at).toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric"}), color:"#8A8478", icon:"📅" },
                ].map((s,i) => (
                  <div key={i} style={{ background:"#0F0E0B", border:"1px solid rgba(255,255,255,0.06)", borderRadius:9, padding:"10px 12px" }}>
                    <p style={{ color:"#8A8478", fontSize:9, textTransform:"uppercase", letterSpacing:1.2, margin:"0 0 4px" }}>{s.icon} {s.label}</p>
                    <p style={{ color:s.color, fontSize:12, fontWeight:700, margin:0 }}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Destination */}
              <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)" }}>

                {/* Header */}
                <div style={{ padding:"12px 16px 10px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <div style={{ width:7, height:7, borderRadius:"50%", background:getDestStatusColor(destOverride) }}/>
                    <p style={{ color:"#8A8478", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, margin:0 }}>
                      Destination {destOverride ? "* Modifiee" : "* Page par defaut"}
                    </p>
                  </div>
                  <div style={{ display:"flex", gap:4 }}>
                    <button type="button" onClick={copyDest}
                      style={{ width:22, height:22, background:"none", border:"none", cursor:"pointer", color:destCopied?"#39FF8F":"#8A8478", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      {destCopied ? <Check size={11}/> : <Copy size={11}/>}
                    </button>
                    <a href={getDestUrl(destOverride)} target="_blank" rel="noopener noreferrer"
                      style={{ width:22, height:22, background:"none", border:"none", color:"#8A8478", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <ExternalLink size={11}/>
                    </a>
                    {destMode === "view" ? (
                      <button type="button" onClick={() => { setDestMode("edit"); setDestType("url"); setDestValue(""); setDestError("") }}
                        style={{ width:22, height:22, background:"none", border:"none", cursor:"pointer", color:"#C9A84C", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Pencil size={11}/>
                      </button>
                    ) : (
                      <button type="button" onClick={() => setDestMode("view")}
                        style={{ width:22, height:22, background:"none", border:"none", cursor:"pointer", color:"#8A8478", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <X size={11}/>
                      </button>
                    )}
                  </div>
                </div>

                {/* URL actuelle */}
                <div style={{ padding:"0 16px 10px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7, padding:"7px 10px", background:"#0F0E0B", border:`1px solid ${destOverride?"rgba(56,189,248,0.25)":"rgba(255,255,255,0.07)"}`, borderRadius:8 }}>
                    <span style={{ fontSize:13, flexShrink:0 }}>
                      {DEST_TYPES.find(d => d.id === (destOverride?.type ?? "page"))?.icon ?? "📄"}
                    </span>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ color:"#8A8478", fontSize:8, textTransform:"uppercase", letterSpacing:1, margin:"0 0 1px" }}>
                        {getDestLabel(destOverride)}
                      </p>
                      <code style={{ color:"#C9A84C", fontSize:9, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const, display:"block" }}>
                        {getDestUrl(destOverride)}
                      </code>
                    </div>
                    {destOverride && (
                      <button type="button" onClick={removeDest} disabled={destLoading}
                        style={{ width:20, height:20, background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:5, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#FF6B6B", flexShrink:0 }}>
                        <X size={10}/>
                      </button>
                    )}
                  </div>

                  {/* Message dynamique */}
                  {!destOverride && (
                    <p style={{ color:"rgba(138,132,120,0.6)", fontSize:9, margin:"5px 0 0", lineHeight:1.5 }}>
                      ?️ Ce QR est dynamique : changez la destination sans reimprimer.
                    </p>
                  )}
                </div>

                {/* Formulaire edition */}
                {destMode === "edit" && (
                  <div style={{ padding:"0 16px 12px", display:"flex", flexDirection:"column", gap:8 }}>

                    {/* Type */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:4 }}>
                      {DEST_TYPES.map(dt => (
                        <button key={dt.id} type="button" onClick={() => { setDestType(dt.id as any); setDestValue(""); setDestError("") }}
                          style={{ padding:"5px 4px", background:destType===dt.id?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${destType===dt.id?"rgba(201,168,76,0.35)":"rgba(255,255,255,0.07)"}`, borderRadius:7, cursor:"pointer", textAlign:"center" as const }}>
                          <span style={{ fontSize:12, display:"block", marginBottom:1 }}>{dt.icon}</span>
                          <span style={{ color:destType===dt.id?G:"#8A8478", fontSize:8, fontWeight:destType===dt.id?700:400 }}>{dt.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* Valeur */}
                    <input
                      value={destValue}
                      onChange={e => { setDestValue(e.target.value); setDestError("") }}
                      placeholder={DEST_TYPES.find(d => d.id === destType)?.ph ?? ""}
                      style={{ width:"100%", background:"#111009", border:`1px solid ${destError?"rgba(255,107,107,0.4)":"rgba(255,255,255,0.08)"}`, borderRadius:8, padding:"8px 10px", color:"#F5F0E8", fontSize:11, outline:"none", boxSizing:"border-box" as const }}/>

                    {/* Label optionnel */}
                    <input
                      value={destLabel}
                      onChange={e => setDestLabel(e.target.value)}
                      placeholder="Note interne (optionnel)"
                      style={{ width:"100%", background:"#111009", border:"1px solid rgba(255,255,255,0.06)", borderRadius:8, padding:"7px 10px", color:"#F5F0E8", fontSize:10, outline:"none", boxSizing:"border-box" as const }}/>

                    {destError && (
                      <div style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 9px", background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:7 }}>
                        <AlertTriangle size={11} color="#FF6B6B"/>
                        <span style={{ color:"#FF6B6B", fontSize:10 }}>{destError}</span>
                      </div>
                    )}

                    {/* Warning changement critique */}
                    {destValue && !destConfirm && (
                      <div style={{ display:"flex", alignItems:"flex-start", gap:6, padding:"7px 9px", background:"rgba(201,168,76,0.07)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:7 }}>
                        <AlertTriangle size={10} color="#C9A84C" style={{ marginTop:1, flexShrink:0 }}/>
                        <p style={{ color:"#C9A84C", fontSize:9, margin:0, lineHeight:1.5 }}>
                          Les QR deja imprimes pointeront vers cette nouvelle destination.
                        </p>
                      </div>
                    )}

                    <div style={{ display:"flex", gap:6 }}>
                      <button type="button" onClick={() => setDestMode("view")}
                        style={{ flex:1, padding:"8px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, color:"#8A8478", fontSize:11, cursor:"pointer" }}>
                        Annuler
                      </button>
                      <button type="button" onClick={() => destValue ? setDestConfirm(true) : null} disabled={!destValue || destLoading}
                        style={{ flex:2, padding:"8px", background:destValue?"linear-gradient(90deg,#C9A84C,#b8953f)":"rgba(255,255,255,0.05)", border:"none", borderRadius:8, color:destValue?"#080808":"#8A8478", fontSize:11, fontWeight:700, cursor:destValue&&!destLoading?"pointer":"not-allowed", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                        {destLoading ? <><Loader2 size={11} style={{ animation:"spin 0.8s linear infinite" }}/> Enregistrement...</> : destSaved ? <><Check size={11}/> Applique !</> : "Appliquer la destination"}
                      </button>
                    </div>

                    {/* Modal confirmation */}
                    {destConfirm && (
                      <div style={{ padding:"10px 12px", background:"rgba(255,107,107,0.07)", border:"1px solid rgba(255,107,107,0.25)", borderRadius:9 }}>
                        <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:700, margin:"0 0 6px" }}>Confirmer le changement</p>
                        <p style={{ color:"#8A8478", fontSize:10, margin:"0 0 10px", lineHeight:1.5 }}>
                          Tous les QR codes imprimes pointeront vers <strong style={{ color:"#F5F0E8" }}>{destValue}</strong>. Cette action est immediate.
                        </p>
                        <div style={{ display:"flex", gap:6 }}>
                          <button type="button" onClick={() => setDestConfirm(false)}
                            style={{ flex:1, padding:"7px", background:"transparent", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, color:"#8A8478", fontSize:11, cursor:"pointer" }}>
                            Annuler
                          </button>
                          <button type="button" onClick={saveDest} disabled={destLoading}
                            style={{ flex:2, padding:"7px", background:"linear-gradient(90deg,#FF6B6B,#e05555)", border:"none", borderRadius:7, color:"#F5F0E8", fontSize:11, fontWeight:700, cursor:"pointer" }}>
                            Confirmer le changement
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Historique */}
                {destMode === "view" && destHistory.length > 0 && (
                  <div style={{ padding:"0 16px 12px" }}>
                    <p style={{ color:"#8A8478", fontSize:8, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, margin:"0 0 6px" }}>
                      Historique ({destHistory.length})
                    </p>
                    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                      {destHistory.slice(0, 5).map((h, i) => {
                        const cfg = DEST_TYPES.find(d => d.id === h.type)
                        return (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:7, padding:"5px 8px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:7 }}>
                            <span style={{ fontSize:11, flexShrink:0 }}>{cfg?.icon ?? "📄"}</span>
                            <div style={{ flex:1, minWidth:0 }}>
                              <p style={{ color:"#8A8478", fontSize:9, margin:0, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                                {h.label || cfg?.label || h.type}
                              </p>
                              <code style={{ color:"rgba(201,168,76,0.6)", fontSize:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const, display:"block" }}>
                                {h.url || h.value}
                              </code>
                            </div>
                            <button type="button" onClick={() => restoreDest(i)} disabled={destLoading}
                              style={{ padding:"3px 7px", background:"rgba(201,168,76,0.08)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:5, color:"#C9A84C", fontSize:8, cursor:"pointer", flexShrink:0, display:"flex", alignItems:"center" }}>
                              <RotateCcw size={11}/>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              
{/* Diagnostic scannabilite premium */}
              {scanScore && (
                <div ref={scanWidgetRef} style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"16px" }}>

                  {/* Header */}
                  <p style={{ color:"#8A8478", fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.2, margin:"0 0 14px" }}>
                    Scannabilite
                  </p>

                  {/* Score central premium */}
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, marginBottom:14 }}>
                    <div style={{ position:"relative", width:96, height:96 }}>
                      <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform:"rotate(-90deg)" }}>
                        <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7"/>
                        <circle cx="48" cy="48" r="40" fill="none"
                          stroke={scanScore.gradeColor} strokeWidth="7"
                          strokeDasharray={`${(scanScore.score/100)*251.2} 251.2`}
                          strokeLinecap="round"
                          style={{ transition:"stroke-dasharray 0.6s ease, stroke 0.3s", filter:`drop-shadow(0 0 6px ${scanScore.gradeColor}66)` }}/>
                      </svg>
                      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                        <span style={{ color:scanScore.gradeColor, fontSize:28, fontWeight:800, lineHeight:1 }}>{scanScore.score}</span>
                        <span style={{ color:"#8A8478", fontSize:9, marginTop:2 }}>/ 100</span>
                      </div>
                    </div>
                    <span style={{ background:`${scanScore.gradeColor}15`, border:`1px solid ${scanScore.gradeColor}40`, borderRadius:8, padding:"4px 14px", fontSize:13, color:scanScore.gradeColor, fontWeight:700 }}>
                      {scanScore.grade}
                    </span>
                  </div>

                  {/* Chips infos */}
                  <div style={{ display:"flex", gap:6, flexWrap:"wrap" as const, justifyContent:"center", marginBottom:14 }}>
                    <span style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"3px 9px", fontSize:9, color:"#8A8478" }}>
                      Contraste {scanScore.ratio}:1
                    </span>
                    <span style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:6, padding:"3px 9px", fontSize:9, color:"#8A8478" }}>
                      Taille min {scanScore.minSize}
                    </span>
                    <span style={{ background:`${ecLevel==="H"?"rgba(57,255,143,0.1)":ecLevel==="M"?"rgba(201,168,76,0.1)":"rgba(249,115,22,0.1)"}`, border:`1px solid ${ecLevel==="H"?"rgba(57,255,143,0.25)":ecLevel==="M"?"rgba(201,168,76,0.25)":"rgba(249,115,22,0.25)"}`, borderRadius:6, padding:"3px 9px", fontSize:9, color:ecLevel==="H"?"#39FF8F":ecLevel==="M"?G:"#F97316" }}>
                      ECC {ecLevel}
                    </span>
                  </div>

                  {/* Bouton corriger auto (proeminent) */}
                  {scanScore.canAutoFix && (
                    <button type="button" onClick={autoFix}
                      style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:7, padding:"10px", marginBottom:12, background:"rgba(201,168,76,0.1)", border:"1px solid rgba(201,168,76,0.3)", borderRadius:9, color:G, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      <Check size={13}/> Corriger automatiquement
                    </button>
                  )}

                  {/* Etat : tout bon -> checklist verte */}
                  {scanScore.issues.length === 0 ? (
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {[
                        `Contraste parfait (${scanScore.ratio}:1)`,
                        "Marge suffisante pour la détection",
                        `Correction d'erreur optimale (ECC ${ecLevel})`,
                      ].map((txt, i) => (
                        <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 10px", background:"rgba(57,255,143,0.05)", border:"1px solid rgba(57,255,143,0.15)", borderRadius:8 }}>
                          <Check size={13} color="#39FF8F" style={{ flexShrink:0 }}/>
                          <span style={{ color:"#F5F0E8", fontSize:11 }}>{txt}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Liste des problemes */
                    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                      {scanScore.issues.map(issue => (
                        <div key={issue.id} style={{ display:"flex", alignItems:"flex-start", gap:8, padding:"9px 10px", background:`${issue.severity==="critical"?"rgba(255,107,107,0.07)":issue.severity==="warning"?"rgba(249,115,22,0.06)":"rgba(255,255,255,0.03)"}`, border:`1px solid ${issue.severity==="critical"?"rgba(255,107,107,0.2)":issue.severity==="warning"?"rgba(249,115,22,0.18)":"rgba(255,255,255,0.07)"}`, borderRadius:9 }}>
                          <span style={{ fontSize:12, flexShrink:0, marginTop:1 }}>
                            {issue.severity==="critical"?"🔴":issue.severity==="warning"?"🟡":"🔵"}
                          </span>
                          <div style={{ flex:1, minWidth:0 }}>
                            <p style={{ color:"#F5F0E8", fontSize:11, fontWeight:600, margin:"0 0 2px" }}>{issue.title}</p>
                            <p style={{ color:"#8A8478", fontSize:9, margin:0, lineHeight:1.5 }}>{issue.detail}</p>
                            {issue.fix && (
                              <p style={{ color:`${issue.severity==="critical"?"#FF6B6B":"#F97316"}`, fontSize:9, margin:"3px 0 0", fontWeight:600 }}>
                                {issue.fix}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

              
{/* -- Performance QR ----------------------------------------- */}
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <BarChart size={13} color={G}/>
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
                    <Loader2 size={16} color={MUTED} style={{ animation:"spin 0.8s linear infinite" }}/>
                  </div>
                ) : !stats || stats.total === 0 ? (
                  <div style={{ textAlign:"center", padding:"16px 0" }}>
                    <ScanLine size={20} color={MUTED} style={{ marginBottom:6 }}/>
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
                            : "--",
                          color:"#F5F0E8", sub:null },
                        { label:"Top pays",    value:stats.top_country ? `🌍 ${stats.top_country}` : "--", color:"#F5F0E8", sub:null },
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
                      {statsExporting ? <><Loader2 size={10} style={{ animation:"spin 0.8s linear infinite" }}/> Export...</> : <><Download size={10}/> Exporter CSV</>}
                    </button>
                  </>
                )}
              </div>

            </div>
          )
        })() : (
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", height:"100%", gap:16, padding:32 }}>
            <div style={{ width:72, height:72, borderRadius:20, background:"rgba(201,168,76,0.06)", border:"1px solid rgba(201,168,76,0.12)", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <QrCode size={28} color="rgba(201,168,76,0.4)"/>
            </div>
            {qrCodes.length === 0 ? (
              <>
                <div style={{ textAlign:"center" as const }}>
                  <p style={{ color:"#F5F0E8", fontSize:15, fontWeight:700, margin:"0 0 6px" }}>Bienvenue dans QR Studio</p>
                  <p style={{ color:MUTED, fontSize:12, margin:0, lineHeight:1.6 }}>Creez votre premiere page pour generer<br/>un QR Code personnalisable.</p>
                </div>
                <a href="/dashboard" style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"11px 20px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", borderRadius:10, color:"#080808", fontSize:13, fontWeight:700, textDecoration:"none", boxShadow:"0 4px 14px rgba(201,168,76,0.2)" }}>
                  <Plus size={15}/> Creer ma premiere page
                </a>
              </>
            ) : (
              <div style={{ textAlign:"center" as const }}>
                <p style={{ color:"#F5F0E8", fontSize:14, fontWeight:600, margin:"0 0 6px" }}>Aucun QR selectionne</p>
                <p style={{ color:MUTED, fontSize:12, margin:0, lineHeight:1.6 }}>Choisissez un QR dans la liste<br/>pour le personnaliser</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* -- COL 3 : Personnalisation premium ------------------------------------ */}
      <div className="qr-col-settings" style={{ borderLeft:"1px solid rgba(255,255,255,0.06)", display:"flex", flexDirection:"column", overflow:"hidden" }}>
        {/* Section label */}
        <div style={{ padding:"10px 16px 8px", borderBottom:"1px solid rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>Personnalisation & Export</p>
          {active && saved && (
            <span style={{ color:"#39FF8F", fontSize:9, display:"flex", alignItems:"center", gap:3 }}>
              <Check size={9}/> Sauvegarde
            </span>
          )}
        </div>

        {/* Tabs principaux Style/Export */}
        <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
          {([["style","Style","🎨"],["supports","Imprimables","🖨️"],["export","Export","📤"]] as const).map(([id,label,emoji]) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)}
              style={{ flex:1, padding:"11px 8px", background:activeTab===id?"rgba(201,168,76,0.06)":"transparent", border:"none", borderBottom:activeTab===id?`2px solid ${G}`:"2px solid transparent", color:activeTab===id?G:MUTED, fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
              <span>{emoji}</span>{label}
            </button>
          ))}
        </div>

        {activeTab === "style" && active && (
          <div className="qr-scroll" style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>

            {/* Sous-tabs Apparence/Branding/Qualite */}
            <div style={{ display:"flex", borderBottom:"1px solid rgba(255,255,255,0.05)", padding:"0 8px", flexShrink:0, overflowX:"auto" }}>
              {([
                ["apparence", "Apparence", "🎨"],
                ["branding",  "Branding",  "🖼"],
                ["qualite",   "Qualité",   "🛡"],
              ] as const).map(([id,label,emoji]) => (
                <button key={id} type="button" onClick={() => setStyleTab(id)}
                  style={{ flex:1, padding:"10px 10px", background:"none", border:"none", borderBottom:styleTab===id?`2px solid ${G}`:"2px solid transparent", color:styleTab===id?G:MUTED, fontSize:11, fontWeight:styleTab===id?700:500, cursor:"pointer", whiteSpace:"nowrap" as const, display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                  <span style={{ fontSize:12 }}>{emoji}</span>{label}
                </button>
              ))}
            </div>

            <div className="qr-scroll" style={{ flex:1, overflowY:"auto", padding:"14px" }}>

              {/* -- APPARENCE (accordeons) ----------------------------------- */}
              {styleTab === "apparence" && (
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>

                  {/* 1. Bibliotheque de presets (ouvert par defaut) */}
                  <AccSection id="presets" title="Choisir un style" icon="✨" openId={openAcc} setOpenId={setOpenAcc}>
                    {/* Bouton style automatique */}
                    <button type="button" onClick={autoStyle}
                      style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginBottom:autoMsg?6:12, padding:"10px", background:"linear-gradient(90deg, rgba(201,168,76,0.18), rgba(201,168,76,0.08))", border:"1px solid rgba(201,168,76,0.35)", borderRadius:10, color:G, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      <Sparkles size={14}/> Generer un style automatiquement
                    </button>
                    {autoMsg && (
                      <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12, padding:"7px 10px", background:"rgba(57,255,143,0.08)", border:"1px solid rgba(57,255,143,0.25)", borderRadius:8, color:"#39FF8F", fontSize:11, fontWeight:600 }}>
                        <Check size={12}/> {autoMsg}
                      </div>
                    )}

                    {/* Filtres par metier */}
                    <div style={{ display:"flex", gap:4, overflowX:"auto", paddingBottom:8, marginBottom:10 }}>
                      {PRESET_CATS.map(cat => {
                        const isReco = cat.id !== "all" && cat.id === detectCat()
                        return (
                        <button key={cat.id} type="button" onClick={() => setSelectedCat(cat.id)}
                          style={{ position:"relative" as const, display:"inline-flex", alignItems:"center", gap:3, padding:"5px 10px", background:selectedCat===cat.id?"rgba(201,168,76,0.15)":"rgba(255,255,255,0.04)", border:`1px solid ${selectedCat===cat.id?"rgba(201,168,76,0.4)":isReco?"rgba(57,255,143,0.4)":"rgba(255,255,255,0.08)"}`, borderRadius:20, color:selectedCat===cat.id?G:MUTED, fontSize:10, fontWeight:selectedCat===cat.id?700:500, cursor:"pointer", whiteSpace:"nowrap" as const, flexShrink:0 }}>
                          <span>{cat.emoji}</span>{cat.label}
                          {isReco && <span style={{ width:5, height:5, borderRadius:"50%", background:"#39FF8F", flexShrink:0 }}/>}
                        </button>
                      )})}
                    </div>

                    {/* Grille presets avec apercu QR realiste */}
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:7 }}>
                      {PRESETS.filter(p => selectedCat==="all" || p.cat===selectedCat).map(preset => {
                        const canAccess = PLAN_RANK[userPlan] >= PLAN_RANK[preset.plan]
                        const isActive  = fg===preset.fg && bg===preset.bg
                        const planLabel = preset.plan === "free" ? null : preset.plan === "pro" ? "PRO" : "BIZ"
                        // forme des modules de l'apercu selon le style du preset
                        const dotR = preset.dotStyle === "dot" ? "50%" : preset.dotStyle === "rounded" ? "30%" : "2px"
                        const cornR = preset.cornerStyle === "circle" || preset.cornerStyle === "rounded" || preset.cornerStyle === "luxury" ? "30%" : "2px"
                        return (
                          <div key={preset.id} onClick={() => applyPreset(preset)}
                            onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = "rgba(201,168,76,0.45)"; e.currentTarget.style.transform = "translateY(-2px)" } }}
                            onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = canAccess?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.04)"; e.currentTarget.style.transform = "translateY(0)" } }}
                            style={{ position:"relative", cursor:"pointer", borderRadius:10, overflow:"hidden", border:`1.5px solid ${isActive?"#C9A84C":canAccess?"rgba(255,255,255,0.08)":"rgba(255,255,255,0.04)"}`, transition:"all 0.15s", opacity:canAccess?1:0.7 }}>

                            {/* Apercu QR miniature realiste */}
                            <div style={{ background:preset.bg, padding:"12px", display:"flex", alignItems:"center", justifyContent:"center", position:"relative", minHeight:64 }}>
                              {preset.gradient && preset.gradient !== "none" && preset.fg2 && (
                                <div style={{ position:"absolute", inset:0, background:`linear-gradient(135deg,${preset.fg}25,${preset.fg2}25)` }}/>
                              )}
                              <div style={{ position:"relative", display:"grid", gridTemplateColumns:"repeat(5,1fr)", gridTemplateRows:"repeat(5,1fr)", gap:2, width:38, height:38 }}>
                                {/* 3 coins (finder patterns) + modules pseudo-aleatoires */}
                                {Array.from({ length: 25 }).map((_, i) => {
                                  const row = Math.floor(i/5), col = i%5
                                  const isCorner = (row<2&&col<2) || (row<2&&col>2) || (row>2&&col<2)
                                  if (isCorner && ((row===0||row===1)&&(col===0||col===1) || (row===0||row===1)&&(col===3||col===4) || (row===3||row===4)&&(col===0||col===1))) {
                                    // afficher le finder comme un carre plein avec la couleur coin
                                    if ((row===0&&col===0)||(row===0&&col===3)||(row===3&&col===0)) {
                                      return <div key={i} style={{ gridColumn: col===3?"4 / 6":"1 / 3", gridRow: row===3?"4 / 6":"1 / 3", background:preset.cornerColor||preset.fg, borderRadius:cornR }}/>
                                    }
                                    return null
                                  }
                                  // modules data : motif pseudo-aleatoire stable
                                  const on = (i*7 + 3) % 5 < 2
                                  return on ? <div key={i} style={{ background:preset.fg, borderRadius:dotR }}/> : <div key={i}/>
                                })}
                              </div>
                              {isActive && (
                                <div style={{ position:"absolute", top:5, left:5, width:14, height:14, background:G, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                  <Check size={8} color="#080808"/>
                                </div>
                              )}
                            </div>

                            {/* Nom + badge plan */}
                            <div style={{ background:"#0F0E0B", padding:"6px 5px 7px", textAlign:"center" as const }}>
                              <p style={{ color:isActive?G:"#F5F0E8", fontSize:9, fontWeight:isActive?700:500, margin:"0 0 2px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" as const }}>
                                {preset.label}
                              </p>
                              {planLabel && (
                                <span style={{ background:canAccess?(preset.plan==="pro"?"rgba(201,168,76,0.15)":"rgba(57,255,143,0.12)"):"rgba(255,255,255,0.06)", borderRadius:3, padding:"1px 4px", fontSize:7, color:canAccess?(preset.plan==="pro"?G:"#39FF8F"):MUTED, fontWeight:700 }}>
                                  {planLabel}
                                </span>
                              )}
                            </div>

                            {!canAccess && (
                              <div style={{ position:"absolute", inset:0, background:"rgba(8,8,8,0.5)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                <Lock size={13} color={MUTED}/>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>

                    {/* Upsell modal inline */}
                  </AccSection>

                  {/* 2. Couleurs principales (ouvert par defaut) */}
                  <AccSection id="couleurs" title="Couleurs" icon="🎨" openId={openAcc} setOpenId={setOpenAcc}>
                    {/* Generer une palette */}
                    <button type="button" onClick={genPalette}
                      style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:7, marginBottom:10, padding:"9px", background:"linear-gradient(90deg, rgba(201,168,76,0.16), rgba(201,168,76,0.06))", border:"1px solid rgba(201,168,76,0.3)", borderRadius:9, color:G, fontSize:12, fontWeight:700, cursor:"pointer" }}>
                      <Sparkles size={13}/> Generer une palette
                    </button>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      <ColorField label="QR principal" value={fg} onChange={setFg}/>
                      <ColorField label="Fond"          value={bg} onChange={setBg}/>
                    </div>
                    {/* Indicateur de contraste en direct */}
                    {(() => {
                      const r = contrastRatio(fg, bg)
                      const ok = r >= 4.5, mid = r >= 3
                      const col = ok ? "#39FF8F" : mid ? "#F97316" : "#FF6B6B"
                      const txt = ok ? "Bon contraste" : mid ? "Contraste moyen" : "Contraste insuffisant"
                      return (
                        <div style={{ display:"flex", alignItems:"center", gap:7, marginTop:10, padding:"7px 10px", background:`${col}10`, border:`1px solid ${col}30`, borderRadius:8 }}>
                          {ok ? <Check size={12} color={col}/> : <AlertTriangle size={12} color={col}/>}
                          <span style={{ color:col, fontSize:11, fontWeight:600 }}>{txt}</span>
                          <span style={{ color:MUTED, fontSize:10, marginLeft:"auto" }}>{r.toFixed(1)}:1</span>
                        </div>
                      )
                    })()}
                  </AccSection>

                  {/* 3. Style des modules (ferme) */}
                  <AccSection id="modules" title="Style des modules" icon="🔲" openId={openAcc} setOpenId={setOpenAcc}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                      {DOT_STYLES.map(ds => {
                        const isActive = (styleConf.dotStyle??"square") === ds.id
                        const isPro = ["pixel","neon","luxury"].includes(ds.id ?? "")
                        const canAccess = !isPro || PLAN_RANK[userPlan] >= 1
                        return (
                          <button key={ds.id ?? "sq"} type="button" onClick={() => canAccess ? setStyleConf(p => ({ ...p, dotStyle: ds.id })) : setUpsell({ feature: `le style de modules « ${ds.label} »`, plan: "pro" })}
                            style={{ position:"relative", padding:"10px 8px", background:isActive?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${isActive?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius:9, cursor:"pointer", opacity:canAccess?1:0.5, textAlign:"center" as const }}>
                            <div style={{ fontSize:18, marginBottom:4 }}>{ds.emoji}</div>
                            <p style={{ color:isActive?G:"#F5F0E8", fontSize:10, fontWeight:isActive?700:500, margin:0 }}>{ds.label}</p>
                            {isPro && !canAccess && (
                              <span style={{ position:"absolute", top:4, right:4, background:"rgba(201,168,76,0.15)", borderRadius:4, padding:"1px 4px", fontSize:7, color:G, fontWeight:800 }}>PRO</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </AccSection>

                  {/* 4. Style des coins (ferme) */}
                  <AccSection id="coins" title="Style des coins" icon="⬛" openId={openAcc} setOpenId={setOpenAcc}>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:14 }}>
                      {CORNER_STYLE_LIST.map(cs => {
                        const isActive = (styleConf.cornerStyle??"square") === cs.id
                        const isPro = ["diamond","luxury"].includes(cs.id ?? "")
                        const canAccess = !isPro || PLAN_RANK[userPlan] >= 1
                        return (
                          <button key={cs.id ?? "sq"} type="button" onClick={() => {
                        if (!canAccess) { setUpsell({ feature: `le style de coins « ${cs.label} »`, plan: "pro" }); return }
                        setStyleConf(p => ({ ...p, cornerStyle: cs.id }))
                        if (cs.id === "rounded" || cs.id === "circle" || cs.id === "luxury") setCorner("rounded")
                        else if (cs.id === "minimal") setCorner("dot")
                        else setCorner("square")
                      }}
                            style={{ padding:"10px 8px", background:isActive?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${isActive?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius:9, cursor:"pointer", opacity:canAccess?1:0.5, position:"relative" as const }}>
                            <p style={{ color:isActive?G:"#F5F0E8", fontSize:11, fontWeight:isActive?700:500, margin:0, textAlign:"center" as const }}>{cs.label}</p>
                            {isPro && !canAccess && (
                              <span style={{ position:"absolute", top:4, right:4, background:"rgba(201,168,76,0.15)", borderRadius:4, padding:"1px 4px", fontSize:7, color:G, fontWeight:800 }}>PRO</span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Arrondi general</p>
                    <div style={{ display:"flex", gap:6 }}>
                      {(["square","rounded","dot"] as const).map(c => (
                        <button key={c} type="button" onClick={() => setCorner(c)}
                          style={{ flex:1, padding:"7px 6px", background:corner===c?"rgba(201,168,76,0.12)":"rgba(255,255,255,0.03)", border:`1px solid ${corner===c?"rgba(201,168,76,0.4)":"rgba(255,255,255,0.07)"}`, borderRadius:8, color:corner===c?G:MUTED, fontSize:10, cursor:"pointer", fontWeight:corner===c?700:400 }}>
                          {c==="square"?"Carré":c==="rounded"?"Arrondi":"Dots"}
                        </button>
                      ))}
                    </div>
                  </AccSection>

                  {/* 5. Reglages avances (ferme) : couleurs avancees + degrade */}
                  <AccSection id="avances" title="Réglages avancés" icon="⚙️" openId={openAcc} setOpenId={setOpenAcc}>
                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Couleurs avancees</p>
                    <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:14 }}>
                      {([
                        { label:"QR secondaire",   key:"fg2"         },
                        { label:"Couleur coins",   key:"cornerColor" },
                        { label:"Couleur yeux",    key:"eyeColor"    },
                        { label:"Fond dégradé",    key:"gradientBg"  },
                      ] as const).map(c => (
                        <ColorField key={c.key} label={c.label}
                          value={(styleConf as any)[c.key] ?? ""}
                          onChange={(hex) => setStyleConf(p => ({ ...p, [c.key]: hex }))}
                          onClear={() => setStyleConf(p => ({ ...p, [c.key]: "" }))}/>
                      ))}
                    </div>

                    {/* Fond transparent */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 12px", background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:9, marginBottom:14 }}>
                      <div>
                        <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:600, margin:"0 0 2px" }}>Fond transparent</p>
                        <p style={{ color:MUTED, fontSize:10, margin:0 }}>PNG avec canal alpha</p>
                      </div>
                      <button type="button" onClick={() => setStyleConf(p => ({ ...p, transparent: !p.transparent }))}
                        style={{ width:38, height:22, borderRadius:11, background:styleConf.transparent?"linear-gradient(90deg,#C9A84C,#b8953f)":"rgba(255,255,255,0.1)", border:"none", cursor:"pointer", position:"relative", transition:"background 0.2s" }}>
                        <div style={{ position:"absolute", top:3, left:styleConf.transparent?18:3, width:16, height:16, borderRadius:"50%", background:"#F5F0E8", transition:"left 0.2s" }}/>
                      </button>
                    </div>

                    <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Degrade</p>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
                      {GRADIENT_OPTS.map(g => (
                        <button key={g.id ?? "none"} type="button" onClick={() => setStyleConf(p => ({ ...p, gradient: g.id ?? "none" }))}
                          style={{ padding:"7px 8px", background:(styleConf.gradient??"none")===(g.id??"none")?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${(styleConf.gradient??"none")===(g.id??"none")?"rgba(201,168,76,0.35)":"rgba(255,255,255,0.07)"}`, borderRadius:8, color:(styleConf.gradient??"none")===(g.id??"none")?G:MUTED, fontSize:10, cursor:"pointer", fontWeight:(styleConf.gradient??"none")===(g.id??"none")?700:400 }}>
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </AccSection>

                </div>
              )}


              {/* -- LOGO --------------------------------------------------- */}
              {styleTab === "branding" && (
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

                  {/* Dropzone / apercu */}
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
                        <div style={{ fontSize:28, marginBottom:8 }}>{logoUploading ? "⏳" : "🖼️"}</div>
                        <p style={{ color:"#F5F0E8", fontSize:12, fontWeight:600, margin:"0 0 4px" }}>
                          {logoUploading ? "Chargement..." : "Deposer votre logo"}
                        </p>
                        <p style={{ color:MUTED, fontSize:10, margin:"0 0 10px" }}>PNG, SVG, WEBP -- max 2 Mo</p>
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
                          <p style={{ color:MUTED, fontSize:10, margin:0 }}>ECC force H -- scannabilite optimale</p>
                        </div>
                        <button type="button" onClick={removeLogo}
                          style={{ width:30, height:30, background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"#FF6B6B", flexShrink:0 }}>
                          <Trash2 size={13}/>
                        </button>
                      </div>
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
                          <span style={{ color:MUTED, fontSize:9 }}>10% -- Min</span>
                          <span style={{ color:G, fontSize:9, fontWeight:600 }}>✓ 15-20% recommande</span>
                          <span style={{ color:MUTED, fontSize:9 }}>30% -- Max</span>
                        </div>
                        {(styleConf.logoSize ?? 18) > 25 && (
                          <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:7, padding:"7px 10px", background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:8 }}>
                            <AlertTriangle size={12} color="#FF6B6B"/>
                            <p style={{ color:"#FF6B6B", fontSize:10, margin:0 }}>Logo trop grand -- risque de rendre le QR illisible</p>
                          </div>
                        )}
                      </div>

                      {/* Forme du conteneur */}
                      <div>
                        <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Forme du conteneur</p>
                        <div style={{ display:"flex", gap:6 }}>
                          {([
                            { id:"square",  label:"Carré",   icon:"⬛" },
                            { id:"rounded", label:"Arrondi", icon:"🔲" },
                            { id:"circle",  label:"Cercle",  icon:"⚫" },
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

              {/* -- AVANCE ---------------------------------------------------- */}
              {styleTab === "qualite" && (
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
                          <button key={ec.id} type="button" onClick={() => locked ? setUpsell({ feature: `la correction d'erreur « ${ec.label} »`, plan: "pro" }) : setEcLevel(ec.id as any)}
                            style={{ position:"relative", padding:"7px 8px", background:ecLevel===ec.id?"rgba(201,168,76,0.1)":"rgba(255,255,255,0.02)", border:`1px solid ${ecLevel===ec.id?"rgba(201,168,76,0.35)":"rgba(255,255,255,0.07)"}`, borderRadius:8, color:locked?MUTED:ecLevel===ec.id?G:"#F5F0E8", fontSize:10, cursor:"pointer", opacity:locked?0.5:1, textAlign:"center" as const }}>
                            <div style={{ fontWeight:700, marginBottom:1 }}>{ec.label}</div>
                            <div style={{ color:MUTED, fontSize:9 }}>{ec.desc}</div>
                            {locked && <Lock size={9} color={MUTED} style={{ position:"absolute", top:4, right:4 }}/>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Explication simple ECC */}
                  <p style={{ color:MUTED, fontSize:10, margin:"-4px 0 0", lineHeight:1.5 }}>
                    La correction d&apos;erreur permet au QR de rester lisible meme abime, sale ou partiellement couvert (logo). Plus elle est elevee, plus le QR est robuste -- mais aussi plus dense.
                  </p>
                  {styleConf.logoUrl && (
                    <div style={{ display:"flex", alignItems:"center", gap:7, padding:"8px 10px", background:"rgba(201,168,76,0.07)", border:"1px solid rgba(201,168,76,0.2)", borderRadius:8 }}>
                      <AlertTriangle size={12} color={G}/>
                      <p style={{ color:G, fontSize:10, margin:0, lineHeight:1.4 }}>Un logo est actif : correction forcee a H quel que soit le choix ci-dessus.</p>
                    </div>
                  )}

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
                {saving ? <><Loader2 size={12} style={{ animation:"spin 0.8s linear infinite" }}/> Enregistrement...</>
                  : saved ? <><Check size={12}/> Sauvegarde !</>
                  : <><Palette size={12}/> Enregistrer le style</>}
              </button>
              {saveErr && (
                <div style={{ padding:"8px 10px", background:"rgba(255,107,107,0.08)", border:"1px solid rgba(255,107,107,0.25)", borderRadius:8, color:"#FF6B6B", fontSize:10, lineHeight:1.4 }}>
                  Echec de l'enregistrement : {saveErr}
                </div>
              )}
              <button type="button" onClick={applyToAll}
                style={{ padding:"9px", background:applyAllOk?"rgba(57,255,143,0.1)":"rgba(255,255,255,0.03)", border:`1px solid ${applyAllOk?"rgba(57,255,143,0.25)":"rgba(255,255,255,0.08)"}`, borderRadius:9, color:applyAllOk?"#39FF8F":MUTED, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {applyAllOk ? <><Check size={11}/> Applique a tous !</> : <><Settings size={11}/> Appliquer a tous mes QR</>}
              </button>
            </div>
          </div>
        )}

        {/* -- Export tab ------------------------------------------------------ */}
        {activeTab === "supports" && active && (() => {
          const tpl = SUPP_TPLS.find(t => t.id === suppTplId) ?? SUPP_TPLS[0]
          const canTpl = PLAN_RANK[userPlan] >= PLAN_RANK[tpl.plan]
          return (
          <div className="qr-scroll" style={{ display:"flex", flexDirection:"column", flex:1, overflow:"hidden" }}>

            {/* -- Selecteur templates ------------------------------------ */}
            <div style={{ padding:"10px 12px", borderBottom:"1px solid rgba(255,255,255,0.06)", flexShrink:0 }}>
              <p style={{ color:"#F5F0E8", fontSize:13, fontWeight:700, margin:"0 0 3px" }}>Modeles prets a imprimer</p>
              <p style={{ color:MUTED, fontSize:10, margin:"0 0 10px", lineHeight:1.4 }}>Votre QR place dans un support fini : carte, flyer, affiche, sticker...</p>
              <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Support</p>
              <div className="qr-scroll" style={{ display:"flex", flexDirection:"column", gap:4, maxHeight:220, overflowY:"auto" }}>
                {SUPP_TPLS.map(t => {
                  const can   = PLAN_RANK[userPlan] >= PLAN_RANK[t.plan]
                  const isA   = t.id === suppTplId
                  const badge = t.plan === "free" ? null : t.plan === "pro" ? "PRO" : "BIZ"
                  return (
                    <button key={t.id} type="button"
                      onClick={() => setSuppTplId(t.id)}
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

            <div className="qr-scroll" style={{ flex:1, overflowY:"auto", padding:"12px" }}>

              {/* -- Textes --------------------------------------------- */}
              <div style={{ marginBottom:12 }}>
                <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 8px" }}>Textes</p>
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  <div>
                    <label style={{ color:MUTED, fontSize:10, display:"block", marginBottom:4 }}>Titre</label>
                    <input value={suppTitle} onChange={e => setSuppTitle(e.target.value)}
                      placeholder={active?.pages?.title ?? "Titre de votre page"}
                      style={{ width:"100%", background:"#111009", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"7px 9px", color:"#F5F0E8", fontSize:11, outline:"none", boxSizing:"border-box" as const }}/>
                  </div>
                  <div>
                    <label style={{ color:MUTED, fontSize:10, display:"block", marginBottom:4 }}>Sous-titre / Appel a l&apos;action</label>
                    <select value={suppSubtitle} onChange={e => setSuppSubtitle(e.target.value)}
                      style={{ width:"100%", background:"#111009", border:"1px solid rgba(255,255,255,0.08)", borderRadius:8, padding:"7px 9px", color:"#F5F0E8", fontSize:11, outline:"none", cursor:"pointer", boxSizing:"border-box" as const }}>
                      {[
                        "Scannez pour voir le menu",
                        "Scannez pour réserver",
                        "Scannez pour laisser un avis",
                        "Scannez pour nous suivre",
                        "Scannez pour découvrir la page",
                        "Scannez pour télécharger le fichier",
                        "Scannez pour en savoir plus",
                      ].map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* -- Preview -------------------------------------------- */}
              <div style={{ marginBottom:12 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                  <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:0 }}>Aperçu</p>
                  <span style={{ color:MUTED, fontSize:9 }}>{tpl.w}×{tpl.h}px</span>
                </div>

                <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:12, display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
                  {canTpl ? (
                    <>
                      <canvas ref={supportCanvasRef} style={{ maxWidth:"100%", borderRadius:6, display: suppRendered ? "block" : "none" }}/>
                      {!suppRendered && (
                        <div style={{ width:"100%", height:160, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8 }}>
                          <Loader2 size={20} color={MUTED} style={{ animation:"spin 0.8s linear infinite" }}/>
                          <p style={{ color:MUTED, fontSize:11, margin:0 }}>Generation de l&apos;apercu...</p>
                        </div>
                      )}
                      <p style={{ color:MUTED, fontSize:10, margin:0, display:"flex", alignItems:"center", gap:5 }}>
                        <Eye size={11}/> Apercu en temps reel
                      </p>
                    </>
                  ) : (
                    <div style={{ padding:"20px 0", textAlign:"center" as const }}>
                      <Lock size={22} color={MUTED} style={{ marginBottom:8 }}/>
                      <p style={{ color:MUTED, fontSize:12, margin:"0 0 10px" }}>
                        {tpl.plan === "pro" ? "Nécessite le plan Pro" : "Nécessite le plan Business"}
                      </p>
                      <a href="/dashboard/upgrade" style={{ display:"inline-block", padding:"7px 16px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", borderRadius:8, color:"#080808", fontSize:11, fontWeight:700, textDecoration:"none" }}>
                        Voir les plans
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* -- Export --------------------------------------------- */}
              {canTpl && (
                <div style={{ display:"flex", flexDirection:"column", gap:7 }}>
                  <p style={{ color:MUTED, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:1.5, margin:"0 0 2px" }}>Exporter</p>
                  <button type="button" onClick={() => exportSupport("png")} disabled={suppExporting}
                    style={{ padding:"10px", background:"linear-gradient(90deg,#C9A84C,#b8953f)", border:"none", borderRadius:9, color:"#080808", fontSize:12, fontWeight:700, cursor:suppExporting?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, opacity:suppExporting?0.7:1 }}>
                    {suppExporting ? <><Loader2 size={13} style={{ animation:"spin 0.8s linear infinite" }}/> Export...</>
                      : <><Download size={13}/> PNG haute resolution</>}
                  </button>
                  <button type="button" onClick={() => exportSupport("pdf")} disabled={suppExporting}
                    style={{ padding:"9px", background:"rgba(255,107,107,0.1)", border:"1px solid rgba(255,107,107,0.2)", borderRadius:9, color:"#FF6B6B", fontSize:11, cursor:suppExporting?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, opacity:suppExporting?0.7:1 }}>
                    {suppExporting ? <><Loader2 size={12} style={{ animation:"spin 0.8s linear infinite" }}/></> : <><Printer size={12}/> PDF pret a imprimer</>}
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
            "webp":  { label:"WEBP",      ext:"webp", color:"#818CF8", desc:"Web optimisé, plus léger",  plan:"pro"      },
            "svg":   { label:"SVG",       ext:"svg",  color:"#C9A84C", desc:"Vectoriel, impression HD",  plan:"pro"      },
            "pdf":   { label:"PDF",       ext:"pdf",  color:"#FF6B6B", desc:"Impression A4 avec titre",  plan:"business" },
          }
          const fmt = FORMAT_CFG[expFormat] ?? FORMAT_CFG["png"]
          return (
          <div className="qr-scroll" style={{ flex:1, overflowY:"auto", padding:"14px" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>

              {/* -- Format (cartes) ------------------------------------------ */}
              <div>
                <p style={{ color:"#F5F0E8", fontSize:13, fontWeight:700, margin:"0 0 3px" }}>Télécharger votre QR en fichier</p>
                <p style={{ color:MUTED, fontSize:10, margin:"0 0 12px", lineHeight:1.4 }}>L'image de votre QR a integrer ou imprimer ou vous voulez.</p>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {([
                    { id:"png",   emoji:"🌐", usage:"Usage web",        desc:"Universel, fond opaque. Le plus polyvalent." },
                    { id:"svg",   emoji:"🖨️", usage:"Impression HD",     desc:"Vectoriel, net à toutes les tailles." },
                    { id:"pdf",   emoji:"📄", usage:"Flyers & affiches", desc:"Document A4 prêt à imprimer, avec titre." },
                    ...(showMoreFmt ? [
                      { id:"webp",  emoji:"⚡", usage:"Web optimise", desc:"Plus léger que le PNG, idéal sites rapides." },
                      { id:"png-t", emoji:"🏷️", usage:"Sticker",     desc:"PNG à fond transparent, pour autocollants." },
                    ] : []),
                  ] as const).map(f => {
                    const cfg   = FORMAT_CFG[f.id]
                    const canFmt = PLAN_RANK[userPlan] >= PLAN_RANK[cfg.plan]
                    const isA    = expFormat === f.id
                    return (
                      <button key={f.id} type="button"
                        onClick={() => canFmt ? setExpFormat(f.id as any) : setUpsell({ feature: `l'export ${cfg.label}`, plan: cfg.plan })}
                        style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:isA?`${cfg.color}14`:"rgba(255,255,255,0.02)", border:`1.5px solid ${isA?cfg.color+"66":"rgba(255,255,255,0.07)"}`, borderRadius:12, cursor:"pointer", opacity:canFmt?1:0.5, textAlign:"left" as const, position:"relative" as const, transition:"all 0.15s" }}>
                        <div style={{ width:38, height:38, borderRadius:10, background:isA?`${cfg.color}22`:"rgba(255,255,255,0.04)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>
                          {f.emoji}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:2 }}>
                            <span style={{ color:isA?cfg.color:"#F5F0E8", fontSize:13, fontWeight:700 }}>{cfg.label}</span>
                            <span style={{ color:MUTED, fontSize:11 }}>{f.usage}</span>
                          </div>
                          <p style={{ color:MUTED, fontSize:10, margin:0, lineHeight:1.4 }}>{f.desc}</p>
                        </div>
                        <div style={{ flexShrink:0 }}>
                          {canFmt ? (
                            cfg.plan === "free"
                              ? <span style={{ display:"inline-flex", alignItems:"center", gap:3, background:"rgba(57,255,143,0.12)", border:"1px solid rgba(57,255,143,0.3)", borderRadius:6, padding:"3px 8px", fontSize:9, color:"#39FF8F", fontWeight:700 }}><Check size={9}/> Gratuit</span>
                              : <span style={{ background:`${cfg.color}20`, border:`1px solid ${cfg.color}40`, borderRadius:6, padding:"3px 8px", fontSize:9, color:cfg.color, fontWeight:800 }}>{cfg.plan === "pro" ? "PRO" : "BIZ"}</span>
                          ) : (
                            <span style={{ display:"inline-flex", alignItems:"center", gap:3, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:6, padding:"3px 8px", fontSize:9, color:MUTED, fontWeight:700 }}><Lock size={9}/> {cfg.plan === "pro" ? "Pro" : "Business"}</span>
                          )}
                        </div>
                        {isA && (
                          <div style={{ position:"absolute", left:0, top:"50%", transform:"translateY(-50%)", width:3, height:"60%", background:cfg.color, borderRadius:"0 3px 3px 0" }}/>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Toggle autres formats */}
                <button type="button" onClick={() => setShowMoreFmt(v => !v)}
                  style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:8, padding:"8px", background:"none", border:"1px dashed rgba(255,255,255,0.12)", borderRadius:9, color:MUTED, fontSize:10, cursor:"pointer" }}>
                  <ChevronRight size={12} style={{ transform: showMoreFmt ? "rotate(90deg)" : "rotate(0deg)", transition:"transform 0.2s" }}/>
                  {showMoreFmt ? "Masquer les autres formats" : "Autres formats (WEBP, transparent)"}
                </button>
              </div>

              {/* -- Taille --------------------------------------------------- */}
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

              {/* -- Options -------------------------------------------------- */}
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

              {/* -- Actions -------------------------------------------------- */}
              <div style={{ display:"flex", flexDirection:"column", gap:7 }}>

                {/* Bouton principal Telecharger */}
                <button type="button" onClick={runExport} disabled={expExporting}
                  style={{ padding:"11px", background:`linear-gradient(90deg,${fmt.color},${fmt.color}cc)`, border:"none", borderRadius:10, color:"#080808", fontSize:13, fontWeight:700, cursor:expExporting?"wait":"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:7, opacity:expExporting?0.7:1 }}>
                  {expExporting
                    ? <><Loader2 size={14} style={{ animation:"spin 0.8s linear infinite" }}/> Export en cours...</>
                    : <><Download size={14}/> Télécharger {fmt.label} {realPx}px</>}
                </button>

                {/* Copier image */}
                <button type="button" onClick={copyImageToClipboard}
                  style={{ padding:"9px", background:expCopied==="img"?"rgba(57,255,143,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${expCopied==="img"?"rgba(57,255,143,0.3)":"rgba(255,255,255,0.08)"}`, borderRadius:9, color:expCopied==="img"?"#39FF8F":expCopied==="img-err"?"#FF6B6B":MUTED, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                  {expCopied==="img" ? <><Check size={12}/> ImageIcon copiee !</>
                    : expCopied==="img-err" ? <><AlertTriangle size={12}/> Non supporte</>
                    : <><ClipboardList size={12}/> Copier l&apos;image (PNG 512px)</>}
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
                  <p style={{ color:MUTED, fontSize:10, margin:"0 0 8px" }}>Pro: PNG alpha, WEBP, SVG . Business: PDF A4</p>
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


      <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} } [data-qr-container] canvas, [data-qr-container] svg { width:100% !important; height:100% !important; display:block; } @media (max-width: 859px) { .qr-grid { display:flex !important; flex-direction:column !important; min-height:0 !important; overflow:visible !important; } .qr-col-preview { order:1 !important; width:100% !important; overflow:visible !important; } .qr-col-settings { order:2 !important; width:100% !important; overflow:visible !important; border-left:none !important; border-top:1px solid rgba(255,255,255,0.06) !important; } .qr-col-list { order:3 !important; width:100% !important; overflow:visible !important; border-right:none !important; border-top:1px solid rgba(255,255,255,0.06) !important; } .qr-scroll { flex:none !important; height:auto !important; max-height:none !important; overflow:visible !important; } }`}</style>
    </div>
  )
}
