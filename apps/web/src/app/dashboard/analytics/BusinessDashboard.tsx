"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts"
import {
  Eye, QrCode, TrendingUp, MousePointerClick, Globe,
  Layers, MapPin, LayoutGrid, GripVertical, RotateCcw,
  ArrowUpRight, ArrowDownRight, Minus
} from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────
type View    = { viewed_at: string; device: string; source: string | null; country: string | null; page_id: string }
type Scan    = { scanned_at: string; device: string; country: string | null; page_id: string }
type Click   = { block_id: string; click_target: string | null; clicked_at: string; page_id: string; block_type?: string }
type Block   = { id: string; type: string; page_id: string }
type GeoScan = { country: string | null; page_id: string; scanned_at: string }
type Page    = { id: string; title: string; slug: string; total_views: number }
type Profile = { plan: string; total_scans: number } | null

interface Props {
  profile:   Profile
  pages:     Page[]
  views:     View[]
  scans:     Scan[]
  clicks:    Click[]
  blocks:    Block[]
  geoScans:  GeoScan[]
}

// ── Widgets catalogue ─────────────────────────────────────────────────────────
const WIDGET_CATALOG = [
  { id: "kpi_visits",   label: "Visites",         icon: "👁️",  size: "sm" },
  { id: "kpi_scans",    label: "Scans QR",        icon: "◼",   size: "sm" },
  { id: "kpi_ctr",      label: "CTR global",      icon: "📈",  size: "sm" },
  { id: "kpi_conv",     label: "Conversions",     icon: "⚡",  size: "sm" },
  { id: "chart_trend",  label: "Tendance",        icon: "📊",  size: "lg" },
  { id: "top_pages",    label: "Top pages",       icon: "📄",  size: "md" },
  { id: "top_blocs",    label: "Top blocs",       icon: "🧱",  size: "md" },
  { id: "top_liens",    label: "Top liens",       icon: "🔗",  size: "md" },
  { id: "sources",      label: "Sources trafic",  icon: "🌐",  size: "md" },
  { id: "geo",          label: "Pays",            icon: "🌍",  size: "md" },
] as const

type WidgetId = typeof WIDGET_CATALOG[number]["id"]

const DEFAULT_LAYOUT: WidgetId[] = [
  "kpi_visits","kpi_scans","kpi_ctr","kpi_conv",
  "chart_trend",
  "top_pages","sources",
  "top_blocs","top_liens",
  "geo",
]

const STORAGE_KEY = "qrfolio_dashboard_layout"

// ── Couleurs ───────────────────────────────────────────────────────────────────
const G     = "var(--accent)"
const NEON  = "#39FF8F"
const MUTED = "#A8A190"
const SURF  = "#0F0E0B"
const BORD  = "color-mix(in srgb, var(--accent) 12%, transparent)"

const PALETTE = ["var(--accent)","#39FF8F","#7B61FF","#FF6B6B","#38BDF8","#F97316","#E1306C","#25D366","#818CF8","#67E8F9"]

const COUNTRY_NAMES: Record<string,string> = {
  FR:"France",US:"États-Unis",GB:"Royaume-Uni",DE:"Allemagne",
  ES:"Espagne",IT:"Italie",BE:"Belgique",CH:"Suisse",CA:"Canada",
  AU:"Australie",NL:"Pays-Bas",PT:"Portugal",BR:"Brésil",MX:"Mexique",
}

const BLOCK_LABELS: Record<string,string> = {
  cta_button:"Bouton CTA",social_links:"Liens sociaux",whatsapp:"WhatsApp",
  stripe_product:"Produit",calendly:"Réservation",contact_form:"Contact",
  video:"Vidéo",google_maps:"Maps",instagram_feed:"Instagram",
}

// ── Tooltip générique ─────────────────────────────────────────────────────────
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:"#111009", border:"1px solid color-mix(in srgb, var(--accent) 30%, transparent)", borderRadius:8, padding:"8px 12px" }}>
      <p style={{ color:MUTED, fontSize:11, margin:"0 0 4px" }}>{label}</p>
      {payload.map((p:any,i:number) => (
        <p key={i} style={{ color:p.color??G, fontSize:12, fontWeight:700, margin:"2px 0" }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

// ── Badge croissance ──────────────────────────────────────────────────────────
function Growth({ curr, prev }: { curr:number; prev:number }) {
  if (!prev) return null
  const pct = Math.round(((curr-prev)/prev)*100)
  const up  = pct >= 0
  const color = pct > 0 ? NEON : pct < 0 ? "#FF6B6B" : MUTED
  const Icon  = pct > 0 ? ArrowUpRight : pct < 0 ? ArrowDownRight : Minus
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:2, color, fontSize:11, fontWeight:700 }}>
      <Icon size={11}/>{Math.abs(pct)}%
    </span>
  )
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function BusinessDashboard({ profile, pages, views, scans, clicks, blocks, geoScans }: Props) {
  const [layout,    setLayout]    = useState<WidgetId[]>(DEFAULT_LAYOUT)
  const [period,    setPeriod]    = useState(30)
  const [pageId,    setPageId]    = useState("all")
  const [dragging,  setDragging]  = useState<WidgetId|null>(null)
  const [dragOver,  setDragOver]  = useState<WidgetId|null>(null)
  const [editMode,  setEditMode]  = useState(false)

  // Charger layout depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setLayout(JSON.parse(saved))
    } catch {}
  }, [])

  function saveLayout(l: WidgetId[]) {
    setLayout(l)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(l)) } catch {}
  }

  function resetLayout() { saveLayout([...DEFAULT_LAYOUT]) }

  // Drag & Drop
  function onDragStart(id: WidgetId) { setDragging(id) }
  function onDragOver(e: React.DragEvent, id: WidgetId) { e.preventDefault(); setDragOver(id) }
  function onDrop(targetId: WidgetId) {
    if (!dragging || dragging === targetId) { setDragging(null); setDragOver(null); return }
    const next = [...layout]
    const fromIdx = next.indexOf(dragging)
    const toIdx   = next.indexOf(targetId)
    next.splice(fromIdx, 1)
    next.splice(toIdx, 0, dragging)
    saveLayout(next)
    setDragging(null); setDragOver(null)
  }

  function removeWidget(id: WidgetId) {
    saveLayout(layout.filter(w => w !== id))
  }

  function addWidget(id: WidgetId) {
    if (!layout.includes(id)) saveLayout([...layout, id])
  }

  // ── Données filtrées ────────────────────────────────────────────────────────
  const cutoff = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - period); return d
  }, [period])

  const prevCutoff = useMemo(() => {
    const d = new Date(); d.setDate(d.getDate() - period * 2); return d
  }, [period])

  const fViews  = useMemo(() => views.filter(v  => new Date(v.viewed_at)   >= cutoff && (pageId==="all"||v.page_id===pageId)),  [views, cutoff, pageId])
  const fScans  = useMemo(() => scans.filter(s  => new Date(s.scanned_at)  >= cutoff && (pageId==="all"||s.page_id===pageId)),  [scans, cutoff, pageId])
  const fClicks = useMemo(() => clicks.filter(c => new Date(c.clicked_at)  >= cutoff && (pageId==="all"||c.page_id===pageId)), [clicks, cutoff, pageId])
  const fGeo    = useMemo(() => geoScans.filter(g=> new Date(g.scanned_at) >= cutoff && (pageId==="all"||g.page_id===pageId)), [geoScans, cutoff, pageId])

  const pViews  = useMemo(() => views.filter(v  => { const d=new Date(v.viewed_at);   return d>=prevCutoff && d<cutoff }), [views, prevCutoff, cutoff])
  const pScans  = useMemo(() => scans.filter(s  => { const d=new Date(s.scanned_at);  return d>=prevCutoff && d<cutoff }), [scans, prevCutoff, cutoff])
  const pClicks = useMemo(() => clicks.filter(c => { const d=new Date(c.clicked_at);  return d>=prevCutoff && d<cutoff }), [clicks, prevCutoff, cutoff])

  const totalViews  = fViews.length
  const totalScans  = fScans.length
  const totalClicks = fClicks.length
  const ctr         = totalViews ? parseFloat(((totalClicks/totalViews)*100).toFixed(1)) : 0
  const prevCtr     = pViews.length ? parseFloat(((pClicks.length/pViews.length)*100).toFixed(1)) : 0

  // Tendance quotidienne
  const trendData = useMemo(() => {
    const map: Record<string,{date:string;views:number;scans:number}> = {}
    for (let i=period-1;i>=0;i--) {
      const d=new Date(); d.setDate(d.getDate()-i)
      const k=d.toISOString().slice(0,10)
      map[k]={date:k.slice(5),views:0,scans:0}
    }
    fViews.forEach(v  => { const k=v.viewed_at.slice(0,10);  if (map[k]) map[k].views++ })
    fScans.forEach(s  => { const k=s.scanned_at.slice(0,10); if (map[k]) map[k].scans++ })
    return Object.values(map)
  }, [fViews, fScans, period])

  // Top pages
  const topPages = useMemo(() => {
    const m: Record<string,number> = {}
    fViews.forEach(v => { m[v.page_id]=(m[v.page_id]||0)+1 })
    return Object.entries(m)
      .map(([id,n]) => ({ name: pages.find(p=>p.id===id)?.title??id, views:n }))
      .sort((a,b)=>b.views-a.views).slice(0,6)
  }, [fViews, pages])

  // Top blocs
  const topBlocs = useMemo(() => {
    const m: Record<string,number> = {}
    fClicks.forEach(c => { const t=c.block_type??"other"; m[t]=(m[t]||0)+1 })
    return Object.entries(m)
      .map(([type,n]) => ({ name: BLOCK_LABELS[type]??type, clicks:n, type }))
      .sort((a,b)=>b.clicks-a.clicks).slice(0,6)
  }, [fClicks])

  // Top liens
  const topLiens = useMemo(() => {
    const m: Record<string,number> = {}
    fClicks.forEach(c => { if (c.click_target) m[c.click_target]=(m[c.click_target]||0)+1 })
    return Object.entries(m)
      .map(([url,n]) => {
        let label = url
        try { label = new URL(url).hostname.replace(/^www\./,"") } catch {}
        return { label: label.slice(0,30), url, clicks:n }
      })
      .sort((a,b)=>b.clicks-a.clicks).slice(0,6)
  }, [fClicks])

  // Sources
  const sourcesData = useMemo(() => {
    const m: Record<string,number> = {}
    fViews.forEach(v => { const s=v.source??"direct"; m[s]=(m[s]||0)+1 })
    const total=fViews.length||1
    return Object.entries(m)
      .map(([src,n]) => ({ name:src, value:n, pct:Math.round(n/total*100) }))
      .sort((a,b)=>b.value-a.value).slice(0,6)
  }, [fViews])

  // Pays
  const geoData = useMemo(() => {
    const m: Record<string,number> = {}
    fGeo.forEach(g => { const k=(g.country??"??").toUpperCase(); m[k]=(m[k]||0)+1 })
    fViews.forEach(v => { const k=(v.country??"??").toUpperCase(); m[k]=(m[k]||0)+1 })
    return Object.entries(m)
      .map(([code,n]) => ({ name: COUNTRY_NAMES[code]??code, value:n }))
      .sort((a,b)=>b.value-a.value).slice(0,6)
  }, [fGeo, fViews])

  // ── Rendu d'un widget ────────────────────────────────────────────────────────
  function renderWidget(id: WidgetId) {
    const card = (content: React.ReactNode, span?: string) => (
      <div
        key={id}
        draggable={editMode}
        onDragStart={() => onDragStart(id)}
        onDragOver={e => onDragOver(e, id)}
        onDrop={() => onDrop(id)}
        style={{
          gridColumn: span,
          background: SURF, border: dragOver===id ? `1px solid ${G}` : `1px solid ${BORD}`,
          borderRadius: 16, padding: 20, position: "relative",
          cursor: editMode ? "grab" : "default",
          opacity: dragging===id ? 0.5 : 1,
          transition: "border-color 0.15s, opacity 0.15s",
        }}>
        {editMode && (
          <div style={{ position:"absolute", top:10, right:10, display:"flex", gap:6, zIndex:2 }}>
            <div style={{ color:MUTED, cursor:"grab" }}><GripVertical size={14}/></div>
            <button type="button" onClick={() => removeWidget(id)}
              style={{ background:"rgba(255,100,100,0.15)", border:"none", borderRadius:5, color:"#FF6B6B", fontSize:11, cursor:"pointer", padding:"2px 7px", fontWeight:700 }}>
              ✕
            </button>
          </div>
        )}
        {content}
      </div>
    )

    const kpiCard = (label: string, value: string|number, color: string, curr: number, prev: number, icon: React.ReactNode) =>
      card(
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:44, height:44, background:`${color}15`, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", color, flexShrink:0 }}>{icon}</div>
          <div>
            <p style={{ color:MUTED, fontSize:11, margin:"0 0 3px", textTransform:"uppercase", letterSpacing:1 }}>{label}</p>
            <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
              <p style={{ color:"#F5F0E8", fontSize:24, fontWeight:800, margin:0 }}>{value}</p>
              <Growth curr={curr} prev={prev}/>
            </div>
          </div>
        </div>
      )

    switch(id) {
      case "kpi_visits": return kpiCard("Visites", totalViews.toLocaleString(), NEON, totalViews, pViews.length, <Eye size={20}/>)
      case "kpi_scans":  return kpiCard("Scans QR", totalScans.toLocaleString(), G, totalScans, pScans.length, <QrCode size={20}/>)
      case "kpi_ctr":    return kpiCard("CTR", ctr+"%", "#818CF8", ctr, prevCtr, <TrendingUp size={20}/>)
      case "kpi_conv":   return kpiCard("Interactions", totalClicks.toLocaleString(), "#FF6B6B", totalClicks, pClicks.length, <MousePointerClick size={20}/>)

      case "chart_trend": return card(
        <div>
          <p style={{ color:"#F5F0E8", fontSize:13, fontWeight:700, margin:"0 0 16px", display:"flex", alignItems:"center", gap:7 }}>
            <TrendingUp size={14} color={G}/> Tendance — {period}j
          </p>
          <div style={{ height:200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{top:4,right:4,bottom:0,left:-20}}>
                <defs>
                  <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={NEON} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={NEON} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={G} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={G} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="date" tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false} interval={Math.floor(trendData.length/5)}/>
                <YAxis tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false}/>
                <Tooltip content={<Tip/>}/>
                <Area type="monotone" dataKey="views" name="Vues" stroke={NEON} strokeWidth={2} fill="url(#gV)"/>
                <Area type="monotone" dataKey="scans" name="Scans" stroke={G}    strokeWidth={2} fill="url(#gS)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>,
        "1 / -1"
      )

      case "top_pages": return card(
        <div>
          <p style={{ color:"#F5F0E8", fontSize:13, fontWeight:700, margin:"0 0 14px", display:"flex", alignItems:"center", gap:7 }}>
            <Eye size={14} color={NEON}/> Top pages
          </p>
          {topPages.length === 0
            ? <p style={{ color:MUTED, fontSize:12, textAlign:"center", padding:"20px 0" }}>Aucune donnée</p>
            : topPages.map((p,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom: i<topPages.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ color:i<3?G:MUTED, fontSize:11, fontWeight:700, minWidth:20 }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}</span>
                <span style={{ color:"#F5F0E8", fontSize:12, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</span>
                <span style={{ color:NEON, fontSize:12, fontWeight:700 }}>{p.views}</span>
              </div>
            ))
          }
        </div>
      )

      case "top_blocs": return card(
        <div>
          <p style={{ color:"#F5F0E8", fontSize:13, fontWeight:700, margin:"0 0 14px", display:"flex", alignItems:"center", gap:7 }}>
            <Layers size={14} color="#818CF8"/> Top blocs
          </p>
          {topBlocs.length === 0
            ? <p style={{ color:MUTED, fontSize:12, textAlign:"center", padding:"20px 0" }}>Aucun clic enregistré</p>
            : topBlocs.map((b,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom: i<topBlocs.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ color:i<3?G:MUTED, fontSize:11, fontWeight:700, minWidth:20 }}>#{i+1}</span>
                <span style={{ color:"#F5F0E8", fontSize:12, flex:1 }}>{b.name}</span>
                <span style={{ color:"#818CF8", fontSize:12, fontWeight:700 }}>{b.clicks}</span>
              </div>
            ))
          }
        </div>
      )

      case "top_liens": return card(
        <div>
          <p style={{ color:"#F5F0E8", fontSize:13, fontWeight:700, margin:"0 0 14px", display:"flex", alignItems:"center", gap:7 }}>
            <MousePointerClick size={14} color={G}/> Top liens
          </p>
          {topLiens.length === 0
            ? <p style={{ color:MUTED, fontSize:12, textAlign:"center", padding:"20px 0" }}>Aucun clic enregistré</p>
            : topLiens.map((l,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 0", borderBottom: i<topLiens.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ color:i<3?G:MUTED, fontSize:11, fontWeight:700, minWidth:20 }}>#{i+1}</span>
                <span style={{ color:"#F5F0E8", fontSize:12, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{l.label}</span>
                <span style={{ color:G, fontSize:12, fontWeight:700 }}>{l.clicks}</span>
              </div>
            ))
          }
        </div>
      )

      case "sources": return card(
        <div>
          <p style={{ color:"#F5F0E8", fontSize:13, fontWeight:700, margin:"0 0 14px", display:"flex", alignItems:"center", gap:7 }}>
            <Globe size={14} color="#38BDF8"/> Sources trafic
          </p>
          {sourcesData.length === 0
            ? <p style={{ color:MUTED, fontSize:12, textAlign:"center", padding:"20px 0" }}>Aucune donnée</p>
            : <div style={{ height:160 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sourcesData} layout="vertical" margin={{top:0,right:30,bottom:0,left:50}}>
                    <XAxis type="number" tick={{fill:MUTED,fontSize:10}} axisLine={false} tickLine={false}/>
                    <YAxis type="category" dataKey="name" width={48} tick={{fill:"#F5F0E8",fontSize:10}} axisLine={false} tickLine={false}/>
                    <Tooltip content={<Tip/>}/>
                    <Bar dataKey="value" name="Vues" radius={[0,5,5,0]}>
                      {sourcesData.map((_,i) => <Cell key={i} fill={PALETTE[i%PALETTE.length]} fillOpacity={0.8}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
          }
        </div>
      )

      case "geo": return card(
        <div>
          <p style={{ color:"#F5F0E8", fontSize:13, fontWeight:700, margin:"0 0 14px", display:"flex", alignItems:"center", gap:7 }}>
            <MapPin size={14} color="#F472B6"/> Pays
          </p>
          {geoData.length === 0
            ? <p style={{ color:MUTED, fontSize:12, textAlign:"center", padding:"20px 0" }}>Aucune donnée géo</p>
            : geoData.map((g,i) => {
                const max = geoData[0].value||1
                return (
                  <div key={i} style={{ marginBottom:8 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:3 }}>
                      <span style={{ color:"#F5F0E8", fontSize:12 }}>{g.name}</span>
                      <span style={{ color:G, fontSize:12, fontWeight:700 }}>{g.value}</span>
                    </div>
                    <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:2, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${g.value/max*100}%`, background:`linear-gradient(90deg,${G},${NEON})`, borderRadius:2, transition:"width 0.6s" }}/>
                    </div>
                  </div>
                )
              })
          }
        </div>
      )

      default: return null
    }
  }

  const hidden = WIDGET_CATALOG.filter(w => !layout.includes(w.id))

  return (
    <div style={{ minHeight:"100vh", background:"#080808", padding:"28px 20px 80px", fontFamily:"DM Sans, sans-serif" }}>
      <div style={{ maxWidth:1200, margin:"0 auto" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
              <LayoutGrid size={20} color={G}/>
              <h1 style={{ fontFamily:"Cormorant Garamond, serif", fontSize:26, color:"#F5F0E8", fontWeight:700, margin:0 }}>
                Dashboard
              </h1>
            </div>
            <p style={{ color:MUTED, fontSize:12, margin:0 }}>Vue d'ensemble de vos performances</p>
          </div>

          <div style={{ display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
            {/* Filtre page */}
            {pages.length > 1 && (
              <select value={pageId} onChange={e => setPageId(e.target.value)}
                style={{ background:"#111009", border:`1px solid ${BORD}`, borderRadius:9, color:"#F5F0E8", padding:"7px 12px", fontSize:12, cursor:"pointer", outline:"none" }}>
                <option value="all">Toutes les pages</option>
                {pages.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            )}

            {/* Période */}
            <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:10, padding:3, gap:3 }}>
              {[{v:7,l:"7j"},{v:30,l:"30j"},{v:90,l:"90j"}].map(o => (
                <button key={o.v} type="button" onClick={() => setPeriod(o.v)}
                  style={{ padding:"5px 10px", borderRadius:8, border:"none", fontSize:11, fontWeight:600, cursor:"pointer", transition:"all 0.15s", background:period===o.v?G:"transparent", color:period===o.v?"#080808":MUTED }}>
                  {o.l}
                </button>
              ))}
            </div>

            {/* Mode édition */}
            <button type="button" onClick={() => setEditMode(e => !e)}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"7px 14px", background:editMode?"color-mix(in srgb, var(--accent) 15%, transparent)":"rgba(255,255,255,0.04)", border:editMode?`1px solid color-mix(in srgb, var(--accent) 25%, transparent)`:"1px solid rgba(255,255,255,0.08)", borderRadius:9, color:editMode?G:MUTED, fontSize:12, fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
              <GripVertical size={13}/>{editMode ? "Terminer" : "Réorganiser"}
            </button>

            {editMode && (
              <button type="button" onClick={resetLayout}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"7px 12px", background:"transparent", border:"1px solid rgba(255,255,255,0.08)", borderRadius:9, color:MUTED, fontSize:12, cursor:"pointer" }}>
                <RotateCcw size={12}/> Reset
              </button>
            )}
          </div>
        </div>

        {/* Ajouter widgets masqués */}
        {editMode && hidden.length > 0 && (
          <div style={{ marginBottom:16, padding:"12px 16px", background:"color-mix(in srgb, var(--accent) 5%, transparent)", border:"1px dashed color-mix(in srgb, var(--accent) 20%, transparent)", borderRadius:12, display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
            <span style={{ color:MUTED, fontSize:11, fontWeight:600 }}>Widgets masqués :</span>
            {hidden.map(w => (
              <button key={w.id} type="button" onClick={() => addWidget(w.id)}
                style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:7, color:"#F5F0E8", fontSize:11, cursor:"pointer" }}>
                {w.icon} {w.label} <span style={{ color:NEON, fontSize:12 }}>+</span>
              </button>
            ))}
          </div>
        )}

        {/* Grille widgets */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:16 }}>
          {layout.map(id => renderWidget(id))}
        </div>
      </div>
    </div>
  )
}
