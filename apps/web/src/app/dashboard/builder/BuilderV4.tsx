"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  X, ChevronUp, ChevronDown, Trash2,
  Eye, Plus, Settings, Check, Search, Copy, EyeOff,
  ExternalLink, Palette, GripVertical, QrCode
} from "lucide-react"
import { BLOCK_DEFS, BLOCK_CATEGORIES, SOCIAL_NETWORKS, PRESET_THEMES, GOOGLE_FONTS, type Block, type BlockContent, type PageTheme } from "./types"
import { createClient } from "@/lib/supabase/client"

const G = "#C9A84C"
const MUTED = "#8A8478"
type Message = { role: "user" | "assistant"; content: string }

// ── Historique Undo/Redo ─────────────────────────────────────────────────
const MAX_HISTORY = 50

function useUndoRedo(initial: Block[]) {
  const historyRef = useRef<Block[][]>([JSON.parse(JSON.stringify(initial))])
  const cursorRef = useRef(0)
  const [, forceRender] = useState(0)

  const getState = () => historyRef.current[cursorRef.current]

  const push = useCallback((next: Block[]) => {
    // Tronquer le futur
    historyRef.current = historyRef.current.slice(0, cursorRef.current + 1)
    // Deep clone
    historyRef.current.push(JSON.parse(JSON.stringify(next)))
    // Limiter
    if (historyRef.current.length > MAX_HISTORY + 1) {
      historyRef.current.shift()
    } else {
      cursorRef.current++
    }
  }, [])

  const undo = useCallback(() => {
    if (cursorRef.current > 0) {
      cursorRef.current--
      forceRender(n => n + 1)
      return historyRef.current[cursorRef.current]
    }
    return null
  }, [])

  const redo = useCallback(() => {
    if (cursorRef.current < historyRef.current.length - 1) {
      cursorRef.current++
      forceRender(n => n + 1)
      return historyRef.current[cursorRef.current]
    }
    return null
  }, [])

  const canUndo = () => cursorRef.current > 0
  const canRedo = () => cursorRef.current < historyRef.current.length - 1
  const size = () => historyRef.current.length
  const pos = () => cursorRef.current

  return { getState, push, undo, redo, canUndo, canRedo, size, pos }
}

// ── Hook resize panneau ────────────────────────────────────────────────────
function useResize(key: string, defaultW: number, min: number, max: number) {
  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`qrfolio_resize_${key}`)
      if (saved) return Math.min(max, Math.max(min, parseInt(saved)))
    }
    return defaultW
  })
  const dragging = useRef(false)
  const startX = useRef(0)
  const startW = useRef(0)

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    dragging.current = true
    startX.current = e.clientX
    startW.current = width
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const onMove = (ev: MouseEvent) => {
      if (!dragging.current) return
      const delta = ev.clientX - startX.current
      const next = Math.min(max, Math.max(min, startW.current + delta))
      setWidth(next)
    }
    const onUp = () => {
      dragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
      setWidth(prev => {
        localStorage.setItem(`qrfolio_resize_${key}`, String(prev))
        return prev
      })
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
  }, [width, min, max, key])

  return { width, onMouseDown }
}


function FAQItem({ q, a, theme }: { q: string; a: string; theme: PageTheme }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: `1px solid ${theme.muted}20`, borderRadius: 8, overflow: "hidden", marginBottom: 5 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: open ? theme.primary + "08" : "transparent", border: "none", color: theme.text, fontSize: 13, cursor: "pointer", textAlign: "left" }}>
        {q} <span style={{ color: theme.primary }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "8px 12px 12px" }}><p style={{ color: theme.muted, fontSize: 12, lineHeight: 1.6, margin: 0 }}>{a}</p></div>}
    </div>
  )
}

function CountdownDisplay({ date, theme }: { date: string; theme: PageTheme }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    const update = () => {
      const diff = new Date(date).getTime() - Date.now()
      if (diff > 0) setTime({ d: Math.floor(diff/86400000), h: Math.floor(diff/3600000)%24, m: Math.floor(diff/60000)%60, s: Math.floor(diff/1000)%60 })
    }
    update(); const t = setInterval(update, 1000); return () => clearInterval(t)
  }, [date])
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
      {[["d","J"],["h","H"],["m","M"],["s","S"]].map(([k,l]) => (
        <div key={k} style={{ textAlign: "center", background: theme.primary+"15", border: `1px solid ${theme.primary}30`, borderRadius: 8, padding: "8px 10px", minWidth: 44 }}>
          <p style={{ color: theme.primary, fontSize: 20, fontWeight: 700, margin: 0 }}>{String((time as any)[k]).padStart(2,"0")}</p>
          <p style={{ color: theme.muted, fontSize: 9, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>{l}</p>
        </div>
      ))}
    </div>
  )
}

function BlockPreview({ block, theme, dayMode }: { block: Block; theme: PageTheme; dayMode: boolean }) {
  const c = block.content
  const bg = "transparent"
  const text = dayMode ? "#1A1A1A" : theme.text
  const muted = dayMode ? "#6B7280" : theme.muted
  const primary = theme.primary
  const accent = theme.accent
  const s = { background: bg }

  switch (block.type) {
    case "profile": return (
      <div style={{ textAlign: "center", padding: "20px 16px", ...s }}>
        {c.avatar
          ? <img src={c.avatar} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px", display: "block", border: `3px solid ${primary}60` }} />
          : <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${primary},${accent})`, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#080808" }}>{(c.name||"?")[0].toUpperCase()}</div>}
        <p style={{ color: text, fontSize: 18, fontWeight: 700, margin: "0 0 3px", fontFamily: theme.fontDisplay }}>{c.name || "Mon Nom"}</p>
        <p style={{ color: muted, fontSize: 13, margin: c.badge ? "0 0 7px" : "0" }}>{c.tagline}</p>
        {c.badge && <span style={{ background: primary+"18", border: `1px solid ${primary}40`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: primary }}>{c.badge}</span>}
      </div>
    )
    case "bio": return (
      <div style={{ padding: "12px 16px", textAlign: (c.align as any)||"left", ...s }}>
        <p style={{ color: text, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{c.text}</p>
      </div>
    )
    case "skills": {
      const tags = (c.tags||"").split(",").map((t:string)=>t.trim()).filter(Boolean)
      return (
        <div style={{ padding: "12px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {tags.map((tag:string, i:number) => <span key={i} style={{ background: primary+"12", border: `1px solid ${primary}30`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: primary, fontWeight: 600 }}>{tag}</span>)}
          </div>
        </div>
      )
    }
    case "cta_button": {
      const btnStyles: Record<string,any> = {
        gold: { background: `linear-gradient(90deg,${primary},${primary}cc)`, color: "#080808", border: "none" },
        neon: { background: accent+"15", border: `1.5px solid ${accent}`, color: accent },
        outline: { background: "transparent", border: `1.5px solid ${primary}`, color: primary },
        ghost: { background: "rgba(255,255,255,0.06)", color: text, border: "1px solid rgba(255,255,255,0.1)" },
        red: { background: "rgba(239,68,68,0.15)", border: "1.5px solid #EF4444", color: "#EF4444" },
      }
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          <div style={{ ...btnStyles[c.style||"gold"], display: "flex", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, padding: "13px 18px", fontSize: 14, fontWeight: 700 }}>
            {c.icon && <span>{c.icon}</span>}{c.label||"Bouton"}
          </div>
        </div>
      )
    }
    case "heading": {
      const sizes: Record<string,number> = { small: 15, medium: 20, large: 27, xl: 34 }
      const hColors: Record<string,string> = { default: text, primary, accent, muted }
      return (
        <div style={{ padding: "14px 16px", textAlign: (c.align as any)||"center", ...s }}>
          <h2 style={{ fontFamily: theme.fontDisplay, fontSize: sizes[c.size||"medium"], color: hColors[c.color||"default"], fontWeight: 700, margin: "0 0 3px" }}>{c.text||"Titre"}</h2>
          {c.subtitle && <p style={{ color: muted, fontSize: 12, margin: 0 }}>{c.subtitle}</p>}
        </div>
      )
    }
    case "rich_text": {
      const tSizes: Record<string,number> = { small: 11, normal: 13, large: 15 }
      return <div style={{ padding: "8px 16px", textAlign: (c.align as any)||"left", ...s }}><p style={{ color: muted, fontSize: tSizes[c.size||"normal"], lineHeight: 1.7, margin: 0 }}>{c.text}</p></div>
    }
    case "faq": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
        {[[c.q1,c.a1],[c.q2,c.a2],[c.q3,c.a3]].filter(([q])=>q).map(([q,a],i) => <FAQItem key={i} q={q!} a={a||""} theme={theme} />)}
      </div>
    )
    case "social_links": {
      const active = SOCIAL_NETWORKS.filter(n => c[n.key])
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {active.length === 0
            ? <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: 0 }}>Aucun réseau configuré</p>
            : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {active.map(n => (
                  <div key={n.key} style={{ display: "flex", alignItems: "center", gap: 10, background: n.color+"10", border: `1px solid ${n.color}25`, borderRadius: 10, padding: "9px 12px" }}>
                    <span style={{ fontSize: 15 }}>{n.icon}</span>
                    <span style={{ color: text, fontSize: 12, fontWeight: 600, flex: 1 }}>{n.label}</span>
                    <ExternalLink size={11} color={n.color} />
                  </div>
                ))}
              </div>}
        </div>
      )
    }
    case "testimonials": {
      const reviews = [[c.name1,c.text1,c.stars1],[c.name2,c.text2,c.stars2],[c.name3,c.text3,c.stars3]].filter(([n])=>n)
      return (
        <div style={{ padding: "10px 16px", display: "flex", flexDirection: "column", gap: 7, ...s }}>
          {reviews.map(([n,t,stars],i) => (
            <div key={i} style={{ background: primary+"06", border: `1px solid ${primary}12`, borderRadius: 9, padding: "10px 12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{n}</p>
                <p style={{ color: "#FFD700", fontSize: 11, margin: 0 }}>{"★".repeat(parseInt(stars||"5"))}</p>
              </div>
              <p style={{ color: muted, fontSize: 11, margin: 0, fontStyle: "italic" }}>"{t}"</p>
            </div>
          ))}
        </div>
      )
    }
    case "image": return (
      <div style={{ ...s }}>
        {c.src
          ? <div><img src={c.src} alt={c.caption||""} style={{ width: "100%", maxHeight: 220, objectFit: "cover", display: "block", borderRadius: c.rounded==="circle" ? "50%" : c.rounded==="rounded" ? 10 : 0 }} />{c.caption && <p style={{ color: muted, fontSize: 10, textAlign: "center", margin: "6px 14px" }}>{c.caption}</p>}</div>
          : <div style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 8, padding: "28px", textAlign: "center", margin: "10px 16px" }}><span style={{ fontSize: 28 }}>🖼️</span><p style={{ color: muted, fontSize: 11, margin: "6px 0 0" }}>Aucune image</p></div>}
      </div>
    )
    case "gallery": {
      const imgs = [c.img1,c.img2,c.img3,c.img4,c.img5,c.img6].filter(Boolean)
      return (
        <div style={{ padding: "10px 14px", display: "grid", gridTemplateColumns: `repeat(${parseInt(c.columns||"3")},1fr)`, gap: 4, ...s }}>
          {imgs.length>0 ? imgs.map((img,i) => <img key={i} src={img} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 6 }} />)
            : [0,1,2,3,4,5].map(i => <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, color: muted }}>🖼️</div>)}
        </div>
      )
    }
    case "video": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "24px", textAlign: "center" }}>
          <span style={{ fontSize: 28 }}>▶️</span>
          <p style={{ color: text, fontSize: 13, margin: "8px 0 0", fontWeight: 600 }}>{c.title||"Vidéo"}</p>
        </div>
      </div>
    )
    case "visit_counter": return (
      <div style={{ padding: "14px 16px", textAlign: "center", ...s }}>
        <p style={{ fontFamily: theme.fontDisplay, fontSize: 34, color: primary, fontWeight: 700, margin: "0 0 3px" }}>1 234</p>
        <p style={{ color: muted, fontSize: 11, margin: 0 }}>{c.label||"visiteurs"}</p>
      </div>
    )
    case "google_maps": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(255,230,109,0.06)", border: "1px solid rgba(255,230,109,0.15)", borderRadius: 10, padding: "12px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <span style={{ fontSize: 20, flexShrink: 0 }}>📍</span>
            <div><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{c.label||"Adresse"}</p><p style={{ color: muted, fontSize: 11, margin: 0 }}>{c.address}</p>{c.transport && <p style={{ color: muted, fontSize: 10, margin: "3px 0 0" }}>🚇 {c.transport}</p>}</div>
          </div>
        </div>
      </div>
    )
    case "opening_hours": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>{c.title}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {[["Lun — Ven",c.mon_fri],["Samedi",c.saturday],["Dimanche",c.sunday]].filter(([,h])=>h).map(([d,h]) => (
            <div key={String(d)} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: muted, fontSize: 12 }}>{d}</span>
              <span style={{ color: text, fontSize: 12, fontWeight: 600 }}>{h}</span>
            </div>
          ))}
        </div>
      </div>
    )
    case "pricing": {
      const plans = [[c.title1,c.price1,c.desc1],[c.title2,c.price2,c.desc2],[c.title3,c.price3,c.desc3]].filter(([t])=>t)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {plans.map(([t,p,d],i) => (
              <div key={i} style={{ flex: 1, minWidth: 70, background: i===1 ? primary+"12" : "rgba(255,255,255,0.04)", border: `1px solid ${i===1 ? primary+"40" : "rgba(255,255,255,0.08)"}`, borderRadius: 9, padding: "12px 8px", textAlign: "center" }}>
                <p style={{ color: muted, fontSize: 9, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: 1 }}>{t}</p>
                <p style={{ color: primary, fontSize: 20, fontWeight: 700, margin: "0 0 3px", fontFamily: theme.fontDisplay }}>{p}</p>
                <p style={{ color: muted, fontSize: 9, margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "product": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
          {c.image ? <img src={c.image} alt={c.name} style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
            : <div style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(249,115,22,0.06)", fontSize: 28 }}>🛍️</div>}
          <div style={{ padding: "10px 12px" }}>
            <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 3px" }}>{c.name||"Produit"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
              <span style={{ color: primary, fontSize: 16, fontWeight: 700 }}>{c.price}</span>
              {c.old_price && <span style={{ color: muted, fontSize: 12, textDecoration: "line-through" }}>{c.old_price}</span>}
            </div>
            {c.cta_label && <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 7, padding: "8px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#080808" }}>{c.cta_label}</div>}
          </div>
        </div>
      </div>
    )
    case "promo_banner": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.15),rgba(249,115,22,0.08))", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 10, padding: "12px 14px", textAlign: "center" }}>
          {c.emoji && <span style={{ fontSize: 24 }}>{c.emoji}</span>}
          <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "5px 0 2px" }}>{c.text}</p>
          {c.subtext && <p style={{ color: muted, fontSize: 11, margin: "0 0 8px" }}>{c.subtext}</p>}
          {c.cta_label && <div style={{ display: "inline-block", background: "#F97316", color: "#fff", padding: "6px 16px", borderRadius: 7, fontSize: 12, fontWeight: 700 }}>{c.cta_label}</div>}
        </div>
      </div>
    )
    case "menu_section": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.category && <p style={{ color: primary, fontSize: 12, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1 }}>{c.category}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[[c.item1_name,c.item1_price,c.item1_desc],[c.item2_name,c.item2_price,c.item2_desc],[c.item3_name,c.item3_price,c.item3_desc]].filter(([n])=>n).map(([n,p,d],i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 7, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 13, fontWeight: 600, margin: "0 0 1px" }}>{n}</p>{d && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{d}</p>}</div>
              <span style={{ color: primary, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    )
    case "reservation_form": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>{c.title||"Réserver"}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["Nom","Date souhaitée","Nb personnes"].map(f => <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: "7px 10px", color: muted, fontSize: 11 }}>{f}</div>)}
          <div style={{ background: "linear-gradient(90deg,#EF4444,#dc2626)", borderRadius: 7, padding: "9px", textAlign: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>{c.button_label||"Réserver"}</div>
        </div>
      </div>
    )
    case "services_list": {
      const services = [[c.s1_icon,c.s1_name,c.s1_desc],[c.s2_icon,c.s2_name,c.s2_desc],[c.s3_icon,c.s3_name,c.s3_desc]].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {services.map(([icon,name,desc],i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 9 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <div><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{name}</p>{desc && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{desc}</p>}</div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "countdown": return (
      <div style={{ padding: "14px 16px", textAlign: "center", ...s }}>
        {c.title && <p style={{ color: muted, fontSize: 11, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1 }}>{c.title}</p>}
        <CountdownDisplay date={c.date||"2026-12-31"} theme={theme} />
        {c.subtitle && <p style={{ color: muted, fontSize: 11, margin: "10px 0 0" }}>{c.subtitle}</p>}
      </div>
    )
    case "event_info": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 12, padding: "14px" }}>
          <p style={{ color: text, fontSize: 16, fontWeight: 700, margin: "0 0 10px", fontFamily: theme.fontDisplay }}>{c.name}</p>
          {[["📅",c.date],["🕐",c.time],["📍",c.location],["🎟️",c.price]].filter(([,v])=>v).map(([icon,val]) => (
            <p key={String(icon)} style={{ color: muted, fontSize: 12, margin: "0 0 4px" }}>{icon} {val}</p>
          ))}
          {c.cta_label && <div style={{ background: "#EC4899", color: "#fff", textAlign: "center", padding: "9px", borderRadius: 7, fontSize: 12, fontWeight: 700, marginTop: 10 }}>{c.cta_label}</div>}
        </div>
      </div>
    )
    case "spotify_player": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.2)", borderRadius: 12, padding: "14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 42, height: 42, background: "#1DB954", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎧</div>
          <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{c.title||"Ma musique"}</p><p style={{ color: muted, fontSize: 10, margin: 0 }}>Écouter sur Spotify</p></div>
          <div style={{ background: "#1DB954", color: "#000", padding: "5px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>▶ Play</div>
        </div>
      </div>
    )
    case "music_links": {
      const platforms = [["spotify","🎵","#1DB954","Spotify"],["apple_music","🍎","#FC3C44","Apple Music"],["deezer","🎶","#A238FF","Deezer"],["youtube_music","▶️","#FF0000","YouTube Music"],["soundcloud","☁️","#FF5500","SoundCloud"]].filter(([k])=>c[k as string])
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.artist_name && <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 10px", textAlign: "center" }}>{c.artist_name}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {platforms.length===0 ? <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: 0 }}>Aucune plateforme configurée</p>
              : platforms.map(([k,icon,color,label]) => (
                <div key={String(k)} style={{ display: "flex", alignItems: "center", gap: 10, background: (color as string)+"12", border: `1px solid ${color}25`, borderRadius: 9, padding: "9px 12px" }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span style={{ color: text, fontSize: 12, fontWeight: 600, flex: 1 }}>{label}</span>
                  <ExternalLink size={11} color={color as string} />
                </div>
              ))}
          </div>
        </div>
      )
    }
    case "instagram_feed": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3, marginBottom: 10 }}>
          {[0,1,2,3,4,5].map(i => <div key={i} style={{ background: "rgba(225,48,108,0.06)", border: "1px solid rgba(225,48,108,0.1)", borderRadius: 5, aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📸</div>)}
        </div>
        {c.username && <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: "0 0 8px" }}>{c.username}</p>}
        {c.cta_label && <div style={{ background: "rgba(225,48,108,0.15)", border: "1px solid rgba(225,48,108,0.3)", color: "#E1306C", textAlign: "center", padding: "9px", borderRadius: 7, fontSize: 12, fontWeight: 700 }}>{c.cta_label}</div>}
      </div>
    )
    case "contact_form": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 10px" }}>{c.title||"Contact"}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["Nom","Email","Message"].map(f => <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, padding: f==="Message" ? "7px 10px 32px" : "7px 10px", color: muted, fontSize: 11 }}>{f}</div>)}
          <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 7, padding: "9px", textAlign: "center", color: "#080808", fontSize: 12, fontWeight: 700 }}>{c.button_label||"Envoyer"}</div>
        </div>
      </div>
    )
    case "divider": {
      const dStyles: Record<string,any> = {
        gold: <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${primary}60,transparent)` }} />,
        line: <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />,
        dots: <div style={{ textAlign: "center", color: muted, letterSpacing: 8, fontSize: 14 }}>• • •</div>,
        stars: <div style={{ textAlign: "center", color: primary, letterSpacing: 8 }}>✦ ✦ ✦</div>,
      }
      return <div style={{ padding: "6px 16px", ...s }}>{dStyles[c.style||"gold"]}</div>
    }
    case "spacer": {
      const sSizes: Record<string,number> = { xs: 6, sm: 12, md: 24, lg: 40, xl: 60 }
      return <div style={{ height: sSizes[c.size||"md"] }} />
    }
    case "call_button": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(57,255,143,0.1)", border: "1.5px solid rgba(57,255,143,0.3)", borderRadius: 12, padding: "13px 18px" }}>
          <span style={{ fontSize: 16 }}>{c.icon||"📞"}</span>
          <span style={{ color: "#39FF8F", fontSize: 13, fontWeight: 700 }}>{c.label||"Appeler maintenant"}</span>
        </div>
      </div>
    )
    case "whatsapp_button": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(37,211,102,0.1)", border: "1.5px solid rgba(37,211,102,0.3)", borderRadius: 12, padding: "13px 18px" }}>
          <span style={{ fontSize: 16 }}>💬</span>
          <span style={{ color: "#25D366", fontSize: 13, fontWeight: 700 }}>{c.label||"Discuter sur WhatsApp"}</span>
        </div>
      </div>
    )
    case "email_button": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(56,189,248,0.1)", border: "1.5px solid rgba(56,189,248,0.3)", borderRadius: 12, padding: "13px 18px" }}>
          <span style={{ fontSize: 16 }}>✉️</span>
          <span style={{ color: "#38BDF8", fontSize: 13, fontWeight: 700 }}>{c.label||"Envoyer un email"}</span>
        </div>
      </div>
    )
    case "download_file": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(167,139,250,0.08)", border: "1.5px solid rgba(167,139,250,0.25)", borderRadius: 12, padding: "11px 14px" }}>
          <div style={{ width: 36, height: 36, background: "rgba(167,139,250,0.15)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{c.icon||"📄"}</div>
          <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{c.label||"Télécharger"}</p>{c.type_doc && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{c.type_doc}</p>}</div>
          <span style={{ color: "#A78BFA", fontSize: 16 }}>↓</span>
        </div>
      </div>
    )
    case "vcard": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ background: primary+"08", border: `1.5px solid ${primary}25`, borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,${primary},${primary}80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>👤</div>
            <div>{c.name && <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.name}</p>}{c.company && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{c.company}</p>}</div>
          </div>
          <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#080808" }}>{c.label||"Ajouter à mes contacts"}</div>
        </div>
      </div>
    )
    case "google_review": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(251,191,36,0.08)", border: "1.5px solid rgba(251,191,36,0.25)", borderRadius: 12, padding: "11px 14px" }}>
          <div style={{ display: "flex", gap: 1 }}>{Array.from({length: parseInt(c.stars||"5")}).map((_,i) => <span key={i} style={{ color: "#FBBF24", fontSize: 12 }}>★</span>)}</div>
          <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{c.label||"Donner un avis"}</p><p style={{ color: muted, fontSize: 9, margin: 0 }}>Google Reviews</p></div>
          <span style={{ fontSize: 18 }}>⭐</span>
        </div>
      </div>
    )
    case "table_booking": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(239,68,68,0.1)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 12, padding: "13px 18px" }}>
          <span style={{ fontSize: 16 }}>🍽️</span>
          <p style={{ color: "#EF4444", fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label||"Réserver une table"}</p>
        </div>
      </div>
    )
    case "order_online": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(249,115,22,0.1)", border: "1.5px solid rgba(249,115,22,0.25)", borderRadius: 12, padding: "13px 18px" }}>
          <span style={{ fontSize: 16 }}>🛒</span>
          <p style={{ color: "#F97316", fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label||"Commander maintenant"}</p>
        </div>
      </div>
    )
    case "free_gift": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ background: "rgba(236,72,153,0.08)", border: "1.5px solid rgba(236,72,153,0.25)", borderRadius: 12, padding: "12px 14px", textAlign: "center" }}>
          <span style={{ fontSize: 28, display: "block", marginBottom: 6 }}>{c.emoji||"🎁"}</span>
          {c.description && <p style={{ color: muted, fontSize: 10, margin: "0 0 8px" }}>{c.description}</p>}
          <div style={{ background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700, color: "#fff" }}>{c.label||"Recevoir mon guide gratuit"}</div>
        </div>
      </div>
    )
    case "donation": {
      const dc = ({"Ko-fi":"#FF5E5B","Buy Me A Coffee":"#FFDD00","Patreon":"#FF424D","PayPal":"#009CDE","Tipeee":"#E55100"} as any)[c.platform||"Ko-fi"]||"#F59E0B"
      return (
        <div style={{ padding: "4px 16px 10px", ...s }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: dc+"12", border: `1.5px solid ${dc}30`, borderRadius: 12, padding: "13px 18px" }}>
            <span style={{ fontSize: 18 }}>☕</span>
            <p style={{ color: dc, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label||"Soutenir mon travail"}</p>
          </div>
        </div>
      )
    }
    case "multi_cta": {
      const btns = [[c.btn1_icon,c.btn1_label],[c.btn2_icon,c.btn2_label],[c.btn3_icon,c.btn3_label],[c.btn4_icon,c.btn4_label]].filter(([,l])=>l)
      return (
        <div style={{ padding: "4px 16px 10px", ...s }}>
          <div style={{ display: "grid", gridTemplateColumns: btns.length<=2 ? "1fr 1fr" : "1fr 1fr", gap: 6 }}>
            {btns.map(([icon,label],i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, background: primary+"10", border: `1px solid ${primary}20`, borderRadius: 10, padding: "10px 6px" }}>
                <span style={{ fontSize: 20 }}>{icon||"⚡"}</span>
                <span style={{ color: text, fontSize: 10, fontWeight: 600, textAlign: "center" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "app_download": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {c.ios_url && <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 11, padding: "10px 14px" }}><span style={{ fontSize: 22 }}>🍎</span><div><p style={{ color: muted, fontSize: 8, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Disponible sur</p><p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>App Store</p></div></div>}
          {c.android_url && <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(0,0,0,0.25)", border: "1.5px solid rgba(255,255,255,0.12)", borderRadius: 11, padding: "10px 14px" }}><span style={{ fontSize: 22 }}>🤖</span><div><p style={{ color: muted, fontSize: 8, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>Disponible sur</p><p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>Google Play</p></div></div>}
          {!c.ios_url && !c.android_url && <div style={{ textAlign: "center", padding: "14px", color: muted, fontSize: 11 }}>Ajoutez vos liens App Store / Play Store</div>}
        </div>
      </div>
    )
    case "promo_code": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ background: "rgba(249,115,22,0.08)", border: "2px dashed rgba(249,115,22,0.3)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
          {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 8px" }}>{c.description}</p>}
          <div style={{ background: "rgba(249,115,22,0.15)", border: "2px solid rgba(249,115,22,0.4)", borderRadius: 8, padding: "9px 16px", fontFamily: "monospace", fontSize: 18, fontWeight: 700, color: "#F97316", letterSpacing: 3 }}>{c.code||"PROMO10"}</div>
          {c.expires && <p style={{ color: muted, fontSize: 9, margin: "5px 0 0" }}>Expire le {c.expires}</p>}
        </div>
      </div>
    )
    case "limited_offer": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}><span style={{ color: "#EF4444" }}>⚡</span><p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.title||"Offre limitée"}</p></div>
          {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 6px" }}>{c.description}</p>}
          {c.expires && <p style={{ color: "#EF4444", fontSize: 10, margin: "0 0 8px", fontWeight: 600 }}>⏰ Expire le {c.expires}</p>}
          {c.cta_label && <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, padding: "9px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#EF4444" }}>{c.cta_label}</div>}
        </div>
      </div>
    )
    case "booking_button": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(56,189,248,0.08)", border: "1.5px solid rgba(56,189,248,0.25)", borderRadius: 12, padding: "11px 14px" }}>
          <div style={{ width: 38, height: 38, background: "rgba(56,189,248,0.12)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📅</div>
          <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{c.label||"Prendre rendez-vous"}</p>{c.description && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{c.description}</p>}</div>
        </div>
      </div>
    )
    case "payment_button": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(57,255,143,0.1)", border: "1.5px solid rgba(57,255,143,0.3)", borderRadius: 12, padding: "13px 18px" }}>
          <span style={{ fontSize: 16 }}>💳</span>
          <p style={{ color: "#39FF8F", fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label||"Payer maintenant"}{c.amount ? ` — ${c.amount}` : ""}</p>
        </div>
      </div>
    )
    case "quote_request": return (
      <div style={{ padding: "4px 16px 10px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, background: primary+"08", border: `1.5px solid ${primary}20`, borderRadius: 12, padding: "11px 14px" }}>
          <div style={{ width: 38, height: 38, background: primary+"12", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📋</div>
          <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{c.label||"Demander un devis"}</p>{c.description && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{c.description}</p>}</div>
          <span style={{ color: primary, fontSize: 14 }}>→</span>
        </div>
      </div>
    )
    case "cover_banner": return (
      <div style={{ position: "relative", overflow: "hidden", borderRadius: "10px 10px 0 0" }}>
        {c.src
          ? <img src={c.src} alt="" style={{ width: "100%", height: c.height==="lg" ? 140 : c.height==="sm" ? 70 : 100, objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: c.height==="lg" ? 140 : c.height==="sm" ? 70 : 100, background: `linear-gradient(135deg,${primary}30,${accent}20)`, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: muted, fontSize: 11 }}>Bannière / Cover</span></div>}
        {c.cover_title && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: "10px 14px" }}><p style={{ color: "#fff", fontSize: 16, fontWeight: 700, margin: 0, textShadow: "0 2px 8px rgba(0,0,0,0.5)", fontFamily: theme.fontDisplay }}>{c.cover_title}</p></div>}
      </div>
    )
    case "about": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.emoji && <span style={{ fontSize: 18, display: "block", marginBottom: 5 }}>{c.emoji}</span>}
        {c.title && <p style={{ color: primary, fontSize: 10, fontWeight: 700, margin: "0 0 5px", textTransform: "uppercase", letterSpacing: 1.5 }}>{c.title}</p>}
        <p style={{ color: text, fontSize: 12, lineHeight: 1.75, margin: 0 }}>{c.text||"Votre histoire ici..."}</p>
        {c.collapsible==="yes" && <button style={{ color: primary, fontSize: 10, background: "none", border: "none", cursor: "pointer", padding: "5px 0 0", fontWeight: 600 }}>Lire la suite →</button>}
      </div>
    )
    case "availability": {
      const scMap: Record<string,any> = {
        available: { color: "#39FF8F", bg: "rgba(57,255,143,0.08)", border: "rgba(57,255,143,0.25)", label: "Disponible" },
        busy: { color: "#F97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", label: "En mission" },
        closed: { color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)", label: "Indisponible" },
      }
      const sc = scMap[c.status||"available"]
      return (
        <div style={{ padding: "8px 16px", ...s }}>
          <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 12, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: c.message ? 5 : 0 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: sc.color, boxShadow: `0 0 6px ${sc.color}80`, flexShrink: 0 }} />
              <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>{sc.label}</p>
              {c.available_from && <span style={{ color: muted, fontSize: 10, marginLeft: "auto" }}>dès {c.available_from}</span>}
            </div>
            {c.message && <p style={{ color: muted, fontSize: 11, margin: "0 0 8px", lineHeight: 1.5 }}>{c.message}</p>}
            {c.cta_label && <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#080808" }}>{c.cta_label}</div>}
          </div>
        </div>
      )
    }
    case "journey": {
      const lines = [c.line_1,c.line_2,c.line_3,c.line_4].filter(Boolean)
      return lines.length>0 ? (
        <div style={{ padding: "8px 16px 12px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {lines.map((line:string,i:number) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 9, background: primary+"06", border: `1px solid ${primary}12`, borderRadius: 9, padding: "9px 10px" }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>{line.split(" ")[0]}</span>
                <span style={{ color: text, fontSize: 12, lineHeight: 1.5 }}>{line.split(" ").slice(1).join(" ")}</span>
              </div>
            ))}
          </div>
        </div>
      ) : <div style={{ padding: "14px", textAlign: "center", color: muted, fontSize: 11, ...s }}>Ajoutez vos chiffres clés</div>
    }
    case "expertise": {
      const skills = [[c.s1_name,c.s1_level,c.s1_icon],[c.s2_name,c.s2_level,c.s2_icon],[c.s3_name,c.s3_level,c.s3_icon],[c.s4_name,c.s4_level,c.s4_icon],[c.s5_name,c.s5_level,c.s5_icon]].filter(([n])=>n)
      return skills.length>0 ? (
        <div style={{ padding: "8px 16px 12px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {skills.map(([name,level,icon],i:number) => {
              const pct = Math.round((parseInt(String(level)||"3")/5)*100)
              return (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ color: text, fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>{icon && <span>{icon}</span>}{name}</span>
                    <span style={{ color: primary, fontSize: 9, fontWeight: 700 }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.07)", borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${primary},${accent})`, borderRadius: 2 }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : <div style={{ padding: "14px", textAlign: "center", color: muted, fontSize: 11, ...s }}>Ajoutez vos expertises</div>
    }
    case "languages": {
      const langs = [[c.lang_1_flag,c.lang_1_name,c.lang_1_level],[c.lang_2_flag,c.lang_2_name,c.lang_2_level],[c.lang_3_flag,c.lang_3_name,c.lang_3_level],[c.lang_4_flag,c.lang_4_name,c.lang_4_level]].filter(([,n])=>n)
      return langs.length>0 ? (
        <div style={{ padding: "8px 16px 12px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {langs.map(([flag,name,level],i:number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9 }}>
                <span style={{ fontSize: 18 }}>{flag||"🌐"}</span>
                <span style={{ color: text, fontSize: 12, fontWeight: 600, flex: 1 }}>{name}</span>
                <span style={{ background: primary+"15", border: `1px solid ${primary}25`, borderRadius: 20, padding: "2px 8px", color: primary, fontSize: 9, fontWeight: 600 }}>{level||"Courant"}</span>
              </div>
            ))}
          </div>
        </div>
      ) : <div style={{ padding: "14px", textAlign: "center", color: muted, fontSize: 11, ...s }}>Ajoutez vos langues</div>
    }
    case "certifications": {
      const certs = [[c.cert_1_icon,c.cert_1_name,c.cert_1_org,c.cert_1_year],[c.cert_2_icon,c.cert_2_name,c.cert_2_org,c.cert_2_year],[c.cert_3_icon,c.cert_3_name,c.cert_3_org,c.cert_3_year],[c.cert_4_icon,c.cert_4_name,c.cert_4_org,c.cert_4_year]].filter(([,n])=>n)
      return certs.length>0 ? (
        <div style={{ padding: "8px 16px 12px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {certs.map(([icon,name,org,year],i:number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: primary+"06", border: `1px solid ${primary}12`, borderRadius: 10 }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{icon||"🏆"}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: text, fontSize: 11, fontWeight: 700, margin: 0 }}>{name}</p>
                  <p style={{ color: muted, fontSize: 9, margin: 0 }}>{org}{year ? ` · ${year}` : ""}</p>
                </div>
                <Check size={11} color={primary} style={{ flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      ) : <div style={{ padding: "14px", textAlign: "center", color: muted, fontSize: 11, ...s }}>Ajoutez vos certifications</div>
    }
    case "company": return (
      <div style={{ padding: "8px 16px 12px", ...s }}>
        <div style={{ display: "flex", gap: 11, alignItems: "center", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "11px 12px" }}>
          {c.logo_url
            ? <img src={c.logo_url} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: 40, height: 40, borderRadius: 9, background: primary+"15", border: `1px solid ${primary}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏢</div>}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 1px", fontFamily: theme.fontDisplay }}>{c.company_name||"Mon Entreprise"}</p>
            <p style={{ color: muted, fontSize: 10, margin: 0 }}>{c.sector}{c.founded_year ? ` · Depuis ${c.founded_year}` : ""}</p>
          </div>
        </div>
      </div>
    )

    case "tiktok_feed": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 3, marginBottom: 10 }}>
          {[0,1,2,3,4,5].map(i => <div key={i} style={{ background: "rgba(245,240,232,0.06)", border: "1px solid rgba(245,240,232,0.1)", borderRadius: 5, aspectRatio: "9/16", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎵</div>)}
        </div>
        {c.username && <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: "0 0 8px" }}>{c.username}</p>}
        {c.cta_label && <div style={{ background: "rgba(245,240,232,0.08)", border: "1px solid rgba(245,240,232,0.2)", color: text, textAlign: "center", padding: "9px", borderRadius: 7, fontSize: 12, fontWeight: 700 }}>{c.cta_label}</div>}
      </div>
    )

    case "youtube_channel": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "rgba(255,0,0,0.15)", border: "2px solid rgba(255,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>▶️</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{c.channel_name||"Ma Chaîne"}</p>
            {c.subscribers && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{c.subscribers}</p>}
          </div>
        </div>
        {c.cta_label && <div style={{ background: "#FF0000", color: "#fff", textAlign: "center", padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{c.cta_label}</div>}
      </div>
    )

    case "twitch_live": {
      const isLive = c.status === "live"
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          <div style={{ background: isLive ? "rgba(145,70,255,0.1)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${isLive ? "rgba(145,70,255,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 9, background: "rgba(145,70,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🎮</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.username||"monpseudo"}</p>
                  {isLive && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 4, padding: "1px 6px", fontSize: 9, fontWeight: 700 }}>● LIVE</span>}
                </div>
                {c.game && <p style={{ color: muted, fontSize: 10, margin: 0 }}>🎯 {c.game}</p>}
                {c.viewers && isLive && <p style={{ color: "#9146FF", fontSize: 10, margin: 0 }}>👁 {c.viewers}</p>}
                {!isLive && <p style={{ color: muted, fontSize: 10, margin: 0 }}>Hors ligne</p>}
              </div>
            </div>
            <div style={{ background: "#9146FF", color: "#fff", textAlign: "center", padding: "9px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{c.cta_label||"Rejoindre le live"}</div>
          </div>
        </div>
      )
    }

    case "discord_server": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(88,101,242,0.08)", border: "1.5px solid rgba(88,101,242,0.25)", borderRadius: 12, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(88,101,242,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎮</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 1px" }}>{c.server_name||"Mon Serveur"}</p>
              {c.members && <p style={{ color: muted, fontSize: 10, margin: "0 0 1px" }}>👥 {c.members}</p>}
              {c.description && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{c.description}</p>}
            </div>
          </div>
          <div style={{ background: "#5865F2", color: "#fff", textAlign: "center", padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{c.cta_label||"Rejoindre le Discord"}</div>
        </div>
      </div>
    )

    case "telegram_channel": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(38,165,228,0.08)", border: "1.5px solid rgba(38,165,228,0.25)", borderRadius: 12, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(38,165,228,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>✈️</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 1px" }}>{c.channel_name||"Mon Canal"}</p>
              {c.members && <p style={{ color: muted, fontSize: 10, margin: "0 0 1px" }}>👥 {c.members}</p>}
              {c.description && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{c.description}</p>}
            </div>
          </div>
          <div style={{ background: "#26A5E4", color: "#fff", textAlign: "center", padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{c.cta_label||"Rejoindre le canal"}</div>
        </div>
      </div>
    )

    case "podcast_links": {
      const platforms = [["spotify_url","🟢","#1DB954","Spotify Podcasts"],["apple_url","🍎","#B150E2","Apple Podcasts"],["pocket_url","📻","#F43E37","Pocket Casts"],["rss_url","📡","#F97316","RSS Feed"]].filter(([k])=>c[k as string])
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11, marginBottom: 12 }}>
            {c.cover_url
              ? <img src={c.cover_url} alt="" style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 52, height: 52, borderRadius: 10, background: "rgba(177,80,226,0.15)", border: "1px solid rgba(177,80,226,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, flexShrink: 0 }}>🎙️</div>}
            <div>
              <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 2px" }}>{c.podcast_name||"Mon Podcast"}</p>
              {c.description && <p style={{ color: muted, fontSize: 11, margin: 0 }}>{c.description}</p>}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {platforms.length===0
              ? <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: 0 }}>Ajoutez vos plateformes d écoute</p>
              : platforms.map(([k,icon,color,label]) => (
                <div key={String(k)} style={{ display: "flex", alignItems: "center", gap: 10, background: (color as string)+"12", border: `1px solid ${color}25`, borderRadius: 9, padding: "9px 12px" }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>
                  <span style={{ color: text, fontSize: 12, fontWeight: 600, flex: 1 }}>{label}</span>
                  <ExternalLink size={11} color={color as string} />
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "favorite_links": {
      const links = [
        [c.link_1_icon, c.link_1_label, c.link_1_url],
        [c.link_2_icon, c.link_2_label, c.link_2_url],
        [c.link_3_icon, c.link_3_label, c.link_3_url],
        [c.link_4_icon, c.link_4_label, c.link_4_url],
        [c.link_5_icon, c.link_5_label, c.link_5_url],
      ].filter(([,l])=>l)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          {links.length===0
            ? <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: 0 }}>Ajoutez vos liens favoris</p>
            : <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                {links.map(([icon,label,url],i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: primary+"08", border: `1px solid ${primary}15`, borderRadius: 10, padding: "10px 12px" }}>
                    <span style={{ fontSize: 20, flexShrink: 0 }}>{icon||"🔗"}</span>
                    <span style={{ color: text, fontSize: 13, fontWeight: 600, flex: 1 }}>{label}</span>
                    <ExternalLink size={11} color={primary} />
                  </div>
                ))}
              </div>}
        </div>
      )
    }


    case "product_catalog": {
      const products = [
        [c.p1_img, c.p1_name, c.p1_price, c.p1_desc, c.p1_url],
        [c.p2_img, c.p2_name, c.p2_price, c.p2_desc, c.p2_url],
        [c.p3_img, c.p3_name, c.p3_price, c.p3_desc, c.p3_url],
      ].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {products.length===0
              ? <div style={{ textAlign: "center", padding: "20px", color: muted, fontSize: 11 }}>Ajoutez vos produits</div>
              : products.map(([img,name,price,desc,url],i) => (
                <div key={i} style={{ display: "flex", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
                  {img
                    ? <img src={String(img)} alt="" style={{ width: 70, height: 70, objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 70, height: 70, background: "rgba(249,115,22,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>🛍️</div>}
                  <div style={{ flex: 1, padding: "8px 10px 8px 0" }}>
                    <p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{name}</p>
                    {desc && <p style={{ color: muted, fontSize: 10, margin: "0 0 4px" }}>{desc}</p>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ color: primary, fontSize: 14, fontWeight: 700 }}>{price}</span>
                      {c.cta_label && <span style={{ background: primary, color: "#080808", borderRadius: 6, padding: "3px 9px", fontSize: 10, fontWeight: 700 }}>{c.cta_label}</span>}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "featured_product": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: `linear-gradient(135deg,${primary}10,${accent}08)`, border: `1.5px solid ${primary}30`, borderRadius: 14, overflow: "hidden" }}>
          {c.badge && <div style={{ background: primary, color: "#080808", padding: "6px 14px", fontSize: 11, fontWeight: 700, textAlign: "center" }}>{c.badge}</div>}
          {c.image
            ? <img src={c.image} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
            : <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(249,115,22,0.06)", fontSize: 40 }}>⭐</div>}
          <div style={{ padding: "14px" }}>
            <p style={{ color: text, fontSize: 16, fontWeight: 700, margin: "0 0 6px", fontFamily: theme.fontDisplay }}>{c.name||"Mon produit phare"}</p>
            {c.description && <p style={{ color: muted, fontSize: 12, margin: "0 0 10px", lineHeight: 1.5 }}>{c.description}</p>}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ color: primary, fontSize: 22, fontWeight: 700 }}>{c.price||"99€"}</span>
              {c.old_price && <span style={{ color: muted, fontSize: 14, textDecoration: "line-through" }}>{c.old_price}</span>}
              {c.old_price && <span style={{ background: "#EF4444", color: "#fff", borderRadius: 6, padding: "2px 7px", fontSize: 10, fontWeight: 700 }}>Promo</span>}
            </div>
            {c.cta_label && <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#080808" }}>{c.cta_label}</div>}
          </div>
        </div>
      </div>
    )

    case "offer_comparison": {
      const plans = [
        { name: c.plan1_name, price: c.plan1_price, features: c.plan1_features, highlight: false },
        { name: c.plan2_name, price: c.plan2_price, features: c.plan2_features, highlight: c.plan2_highlight==="yes" },
        { name: c.plan3_name, price: c.plan3_price, features: c.plan3_features, highlight: false },
      ].filter(p => p.name)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", textAlign: "center" }}>{c.title}</p>}
          <div style={{ display: "flex", gap: 7 }}>
            {plans.map((plan, i) => (
              <div key={i} style={{ flex: 1, background: plan.highlight ? primary+"12" : "rgba(255,255,255,0.03)", border: `1.5px solid ${plan.highlight ? primary+"50" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "12px 10px", position: "relative" }}>
                {plan.highlight && <div style={{ position: "absolute", top: -8, left: "50%", transform: "translateX(-50%)", background: primary, color: "#080808", borderRadius: 20, padding: "2px 10px", fontSize: 9, fontWeight: 700, whiteSpace: "nowrap" }}>⭐ Populaire</div>}
                <p style={{ color: plan.highlight ? primary : text, fontSize: 11, fontWeight: 700, margin: "0 0 4px", textAlign: "center" }}>{plan.name}</p>
                <p style={{ color: primary, fontSize: 18, fontWeight: 700, margin: "0 0 8px", textAlign: "center", fontFamily: theme.fontDisplay }}>{plan.price}</p>
                {plan.features && plan.features.split("\n").filter(Boolean).map((f: string, j: number) => (
                  <p key={j} style={{ color: muted, fontSize: 9, margin: "0 0 3px", display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ color: "#39FF8F" }}>✓</span> {f}
                  </p>
                ))}
                {c.cta_label && <div style={{ background: plan.highlight ? `linear-gradient(90deg,${primary},${primary}cc)` : "rgba(255,255,255,0.06)", borderRadius: 7, padding: "8px", textAlign: "center", fontSize: 10, fontWeight: 700, color: plan.highlight ? "#080808" : text, marginTop: 8 }}>{c.cta_label}</div>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "packs": {
      const packs = [
        [c.pack1_icon, c.pack1_name, c.pack1_price, c.pack1_content, c.pack1_url],
        [c.pack2_icon, c.pack2_name, c.pack2_price, c.pack2_content, c.pack2_url],
        [c.pack3_icon, c.pack3_name, c.pack3_price, c.pack3_content, c.pack3_url],
      ].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {packs.map(([icon, name, price, content, url], i) => (
              <div key={i} style={{ background: i===1 ? primary+"10" : "rgba(255,255,255,0.03)", border: `1.5px solid ${i===1 ? primary+"35" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "13px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 20 }}>{icon||"🚀"}</span>
                    <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: 0 }}>{name}</p>
                  </div>
                  <span style={{ color: primary, fontSize: 16, fontWeight: 700 }}>{price}</span>
                </div>
                {content && content.split("\n").filter(Boolean).map((line: string, j: number) => (
                  <p key={j} style={{ color: muted, fontSize: 11, margin: "0 0 3px", display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#39FF8F", fontSize: 10 }}>✓</span> {line}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "before_after": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.title && <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 10px", textAlign: "center" }}>{c.title}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ borderRadius: 10, overflow: "hidden" }}>
            {c.before_img
              ? <img src={c.before_img} alt="Avant" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
              : <div style={{ height: 120, background: "rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📸</div>}
            <div style={{ background: "rgba(239,68,68,0.15)", padding: "5px", textAlign: "center" }}>
              <p style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, margin: 0 }}>{c.before_label||"Avant"}</p>
            </div>
          </div>
          <div style={{ borderRadius: 10, overflow: "hidden" }}>
            {c.after_img
              ? <img src={c.after_img} alt="Après" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
              : <div style={{ height: 120, background: "rgba(57,255,143,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>✨</div>}
            <div style={{ background: "rgba(57,255,143,0.15)", padding: "5px", textAlign: "center" }}>
              <p style={{ color: "#39FF8F", fontSize: 11, fontWeight: 700, margin: 0 }}>{c.after_label||"Après"}</p>
            </div>
          </div>
        </div>
        {c.description && <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: "8px 0 0" }}>{c.description}</p>}
      </div>
    )

    case "portfolio_work": {
      const works = [[c.work1_img,c.work1_title,c.work1_desc],[c.work2_img,c.work2_title,c.work2_desc],[c.work3_img,c.work3_title,c.work3_desc]].filter(([,t])=>t)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {works.map(([img,title,desc],i) => (
              <div key={i} style={{ borderRadius: 10, overflow: "hidden", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                {img
                  ? <img src={String(img)} alt="" style={{ width: "100%", height: 80, objectFit: "cover", display: "block" }} />
                  : <div style={{ height: 80, background: primary+"08", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📂</div>}
                <div style={{ padding: "8px" }}>
                  <p style={{ color: text, fontSize: 11, fontWeight: 700, margin: "0 0 2px" }}>{title}</p>
                  {desc && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{desc}</p>}
                </div>
              </div>
            ))}
          </div>
          {c.cta_label && <div style={{ marginTop: 10, background: primary+"10", border: `1px solid ${primary}25`, borderRadius: 9, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: primary }}>{c.cta_label}</div>}
        </div>
      )
    }

    case "google_reviews_block": {
      const reviews = [[c.r1_name,c.r1_text,c.r1_stars],[c.r2_name,c.r2_text,c.r2_stars],[c.r3_name,c.r3_text,c.r3_stars]].filter(([n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {(c.avg_rating || c.title) && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, padding: "10px 12px", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 10 }}>
              <div style={{ textAlign: "center" }}>
                <p style={{ color: "#FBBF24", fontSize: 28, fontWeight: 700, margin: 0, fontFamily: theme.fontDisplay }}>{c.avg_rating||"5.0"}</p>
                <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ color: "#FBBF24", fontSize: 10 }}>★</span>)}</div>
              </div>
              <div>
                <p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{c.title||"Avis clients"}</p>
                {c.total_reviews && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{c.total_reviews} avis</p>}
              </div>
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {reviews.map(([name,text_review,stars],i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: "10px 12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <p style={{ color: text, fontSize: 11, fontWeight: 700, margin: 0 }}>{name}</p>
                  <p style={{ color: "#FBBF24", fontSize: 10, margin: 0 }}>{"★".repeat(parseInt(stars||"5"))}</p>
                </div>
                <p style={{ color: muted, fontSize: 11, margin: 0, lineHeight: 1.5, fontStyle: "italic" }}>"{text_review}"</p>
              </div>
            ))}
          </div>
          {c.google_url && <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#4285F4", fontSize: 11, fontWeight: 600 }}>
            <span>📍</span> Voir sur Google
          </div>}
        </div>
      )
    }

    case "business_stats": {
      const stats = [
        [c.stat1_icon, c.stat1_value, c.stat1_label],
        [c.stat2_icon, c.stat2_value, c.stat2_label],
        [c.stat3_icon, c.stat3_value, c.stat3_label],
        [c.stat4_icon, c.stat4_value, c.stat4_label],
      ].filter(([,v])=>v)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          <div style={{ display: "grid", gridTemplateColumns: stats.length<=2 ? "1fr 1fr" : stats.length===3 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8 }}>
            {stats.map(([icon,value,label],i) => (
              <div key={i} style={{ background: primary+"08", border: `1px solid ${primary}15`, borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                {icon && <span style={{ fontSize: 20, display: "block", marginBottom: 5 }}>{icon}</span>}
                <p style={{ color: primary, fontSize: 22, fontWeight: 700, margin: "0 0 3px", fontFamily: theme.fontDisplay, lineHeight: 1 }}>{value}</p>
                <p style={{ color: muted, fontSize: 10, margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "partners": {
      const logos = [
        [c.logo1_img, c.logo1_name],[c.logo2_img, c.logo2_name],[c.logo3_img, c.logo3_name],
        [c.logo4_img, c.logo4_name],[c.logo5_img, c.logo5_name],[c.logo6_img, c.logo6_name],
      ].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", textAlign: "center" }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
            {logos.length===0
              ? [0,1,2,3,4,5].map(i => <div key={i} style={{ height: 44, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontSize: 10 }}>Logo</div>)
              : logos.map(([img,name],i) => (
                <div key={i} style={{ height: 44, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {img
                    ? <img src={String(img)} alt={String(name)} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", padding: 4 }} />
                    : <p style={{ color: muted, fontSize: 10, margin: 0, textAlign: "center", padding: "0 4px" }}>{name}</p>}
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "brands": {
      const brandList = [
        [c.brand1_icon, c.brand1_name],[c.brand2_icon, c.brand2_name],[c.brand3_icon, c.brand3_name],
        [c.brand4_icon, c.brand4_name],[c.brand5_icon, c.brand5_name],[c.brand6_icon, c.brand6_name],
      ].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {brandList.map(([icon,name],i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "5px 12px" }}>
                {icon && <span style={{ fontSize: 16 }}>{icon}</span>}
                <span style={{ color: text, fontSize: 11, fontWeight: 600 }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "gift_card": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: `linear-gradient(135deg,#EC489915,#F472B610)`, border: "1.5px solid rgba(236,72,153,0.3)", borderRadius: 14, padding: "16px" }}>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>🎁</span>
            <p style={{ color: text, fontSize: 15, fontWeight: 700, margin: "6px 0 3px" }}>{c.title||"Offrez une expérience"}</p>
            {c.description && <p style={{ color: muted, fontSize: 11, margin: 0 }}>{c.description}</p>}
          </div>
          <div style={{ display: "flex", gap: 7, justifyContent: "center", marginBottom: 12 }}>
            {[c.amount1, c.amount2, c.amount3].filter(Boolean).map((amount, i) => (
              <div key={i} style={{ background: i===1 ? "rgba(236,72,153,0.2)" : "rgba(255,255,255,0.06)", border: `1.5px solid ${i===1 ? "rgba(236,72,153,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "10px 14px", textAlign: "center" }}>
                <p style={{ color: i===1 ? "#EC4899" : text, fontSize: 16, fontWeight: 700, margin: 0 }}>{amount}</p>
              </div>
            ))}
          </div>
          {c.cta_label && <div style={{ background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 10, padding: "11px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.cta_label}</div>}
        </div>
      </div>
    )

    case "services_pricing": {
      const svcs = [
        [c.s1_name, c.s1_price, c.s1_duration, c.s1_desc],
        [c.s2_name, c.s2_price, c.s2_duration, c.s2_desc],
        [c.s3_name, c.s3_price, c.s3_duration, c.s3_desc],
        [c.s4_name, c.s4_price, c.s4_duration, c.s4_desc],
        [c.s5_name, c.s5_price, c.s5_duration, c.s5_desc],
      ].filter(([n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {svcs.map(([name, price, duration, desc], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i<svcs.length-1 ? `1px solid ${dayMode?"rgba(0,0,0,0.06)":"rgba(255,255,255,0.05)"}` : "none" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ color: text, fontSize: 13, fontWeight: 600, margin: "0 0 1px" }}>{name}</p>
                  {desc && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{desc}</p>}
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <p style={{ color: primary, fontSize: 14, fontWeight: 700, margin: 0 }}>{price}</p>
                  {duration && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{duration}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "external_shop": return (
      <div style={{ padding: "4px 16px 12px", ...s }}>
        {c.description && <p style={{ color: muted, fontSize: 12, margin: "0 0 10px", textAlign: "center" }}>{c.description}</p>}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, background: primary+"10", border: `1.5px solid ${primary}30`, borderRadius: 12, padding: "14px 18px" }}>
          <span style={{ fontSize: 20 }}>🛒</span>
          <div>
            <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label||"Voir la boutique"}</p>
            {c.platform && <p style={{ color: muted, fontSize: 9, margin: 0 }}>via {c.platform}</p>}
          </div>
          <ExternalLink size={13} color={primary} style={{ marginLeft: "auto" }} />
        </div>
      </div>
    )

    case "advantages": {
      const advList = [c.adv1, c.adv2, c.adv3, c.adv4, c.adv5, c.adv6].filter(Boolean)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {advList.length===0
              ? <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: 0 }}>Ajoutez vos avantages</p>
              : advList.map((adv: string, i: number) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "rgba(57,255,143,0.05)", border: "1px solid rgba(57,255,143,0.15)", borderRadius: 9 }}>
                  <p style={{ color: text, fontSize: 13, margin: 0 }}>{adv}</p>
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "reassurance": {
      const guarantees = [
        [c.g1_icon, c.g1_label, c.g1_desc],
        [c.g2_icon, c.g2_label, c.g2_desc],
        [c.g3_icon, c.g3_label, c.g3_desc],
        [c.g4_icon, c.g4_label, c.g4_desc],
      ].filter(([,l])=>l)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          <div style={{ display: "grid", gridTemplateColumns: guarantees.length<=2 ? "1fr 1fr" : "1fr 1fr", gap: 8 }}>
            {guarantees.map(([icon, label, desc], i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, background: "rgba(57,255,143,0.05)", border: "1px solid rgba(57,255,143,0.12)", borderRadius: 11, padding: "12px 8px", textAlign: "center" }}>
                <span style={{ fontSize: 24 }}>{icon||"✅"}</span>
                <p style={{ color: text, fontSize: 11, fontWeight: 700, margin: 0 }}>{label}</p>
                {desc && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{desc}</p>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "sales_counter": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.25)", borderRadius: 14, padding: "16px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: c.subtext ? 6 : 0 }}>
            <span style={{ fontSize: 28 }}>{c.emoji||"🔥"}</span>
            <div>
              <p style={{ color: "#EF4444", fontSize: 28, fontWeight: 700, margin: 0, fontFamily: theme.fontDisplay, lineHeight: 1 }}>
                <span style={{ color: text }}>{c.count||"127"}</span> <span style={{ fontSize: 14 }}>{c.label||"ventes"}</span>
              </p>
              {c.period && <p style={{ color: muted, fontSize: 11, margin: 0 }}>{c.period}</p>}
            </div>
          </div>
          {c.subtext && <p style={{ color: "#EF4444", fontSize: 12, fontWeight: 600, margin: 0 }}>{c.subtext}</p>}
        </div>
      </div>
    )

    case "popular_products": {
      const tops = [
        [c.p1_rank, c.p1_img, c.p1_name, c.p1_price, c.p1_sales, c.p1_url],
        [c.p2_rank, c.p2_img, c.p2_name, c.p2_price, c.p2_sales, c.p2_url],
        [c.p3_rank, null, c.p3_name, c.p3_price, c.p3_sales, c.p3_url],
      ].filter(([,, n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {tops.map(([rank, img, name, price, sales], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: i===0 ? primary+"08" : "rgba(255,255,255,0.03)", border: `1px solid ${i===0 ? primary+"20" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, padding: "10px 12px" }}>
                {rank && <span style={{ fontSize: 18, flexShrink: 0 }}>{rank.split(" ")[0]}</span>}
                {img
                  ? <img src={String(img)} alt="" style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 7, flexShrink: 0 }} />
                  : <div style={{ width: 40, height: 40, background: primary+"10", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏆</div>}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                  {sales && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{sales}</p>}
                </div>
                {price && <span style={{ color: primary, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{price}</span>}
              </div>
            ))}
          </div>
        </div>
      )
    }


    case "image_carousel": {
      const imgs = [c.img1,c.img2,c.img3,c.img4,c.img5,c.img6].filter(Boolean)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }} className="iphone-scroll">
            {imgs.length===0
              ? [0,1,2].map(i => <div key={i} style={{ width: 120, height: 120, flexShrink: 0, background: "rgba(78,205,196,0.06)", border: "1px solid rgba(78,205,196,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📸</div>)
              : imgs.map((img, i) => <img key={i} src={String(img)} alt="" style={{ width: 120, height: 120, flexShrink: 0, objectFit: "cover", borderRadius: 10 }} />)}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 5, marginTop: 8 }}>
            {Array.from({length: Math.max(imgs.length, 3)}).map((_,i) => <div key={i} style={{ width: i===0 ? 16 : 6, height: 6, borderRadius: 3, background: i===0 ? primary : "rgba(255,255,255,0.2)" }} />)}
          </div>
        </div>
      )
    }

    case "media_before_after": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.title && <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 10px", textAlign: "center" }}>{c.title}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ borderRadius: 10, overflow: "hidden" }}>
            {c.before_img
              ? <img src={c.before_img} alt="Avant" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
              : <div style={{ height: 130, background: "rgba(239,68,68,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📸</div>}
            <div style={{ background: "rgba(239,68,68,0.15)", padding: "6px", textAlign: "center" }}>
              <p style={{ color: "#EF4444", fontSize: 11, fontWeight: 700, margin: 0 }}>{c.before_label||"Avant"}</p>
            </div>
          </div>
          <div style={{ borderRadius: 10, overflow: "hidden" }}>
            {c.after_img
              ? <img src={c.after_img} alt="Après" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
              : <div style={{ height: 130, background: "rgba(57,255,143,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>✨</div>}
            <div style={{ background: "rgba(57,255,143,0.15)", padding: "6px", textAlign: "center" }}>
              <p style={{ color: "#39FF8F", fontSize: 11, fontWeight: 700, margin: 0 }}>{c.after_label||"Après"}</p>
            </div>
          </div>
        </div>
        {c.description && <p style={{ color: muted, fontSize: 11, textAlign: "center", margin: "8px 0 0" }}>{c.description}</p>}
      </div>
    )

    case "video_local": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.src
          ? <div style={{ borderRadius: 12, overflow: "hidden", background: "#000" }}>
              <video src={c.src} poster={c.poster||undefined} controls style={{ width: "100%", maxHeight: 200, display: "block" }}
                autoPlay={c.autoplay==="yes"} loop={c.loop==="yes"} muted={c.muted!=="no"} playsInline />
            </div>
          : <div style={{ background: "rgba(78,205,196,0.06)", border: "1px dashed rgba(78,205,196,0.25)", borderRadius: 12, padding: "32px", textAlign: "center" }}>
              {c.poster ? <img src={c.poster} alt="" style={{ width: "100%", maxHeight: 160, objectFit: "cover", borderRadius: 8, display: "block", marginBottom: 10 }} /> : null}
              <span style={{ fontSize: 32 }}>🎥</span>
              <p style={{ color: muted, fontSize: 11, margin: "8px 0 0" }}>Ajoutez l&apos;URL de votre vidéo</p>
            </div>}
        {c.title && <p style={{ color: text, fontSize: 13, fontWeight: 600, margin: "8px 0 0", textAlign: "center" }}>{c.title}</p>}
      </div>
    )

    case "pdf_viewer": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(78,205,196,0.06)", border: "1.5px solid rgba(78,205,196,0.2)", borderRadius: 14, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: c.url ? 12 : 0 }}>
            <div style={{ width: 44, height: 52, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📄</div>
            <div style={{ flex: 1 }}>
              <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{c.title||"Mon document PDF"}</p>
              {c.description && <p style={{ color: muted, fontSize: 11, margin: 0 }}>{c.description}</p>}
            </div>
          </div>
          {c.url && (
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 8, overflow: "hidden", marginBottom: 10, height: 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <p style={{ color: muted, fontSize: 11, margin: 0 }}>Aperçu PDF</p>
            </div>
          )}
          <div style={{ display: "flex", gap: 7 }}>
            {c.cta_label && <div style={{ flex: 1, background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#080808" }}>{c.cta_label}</div>}
            {c.show_download!=="no" && <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 600, color: muted }}>↓ PDF</div>}
          </div>
        </div>
      </div>
    )

    case "youtube_gallery": {
      const videos = [[c.video1_url,c.video1_title],[c.video2_url,c.video2_title],[c.video3_url,c.video3_title]].filter(([u])=>u)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {videos.length===0
              ? [0,1,2].map(i => <div key={i} style={{ height: 90, background: "rgba(255,0,0,0.06)", border: "1px solid rgba(255,0,0,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}><span style={{ fontSize: 24 }}>▶️</span><p style={{ color: muted, fontSize: 11, margin: 0 }}>Vidéo YouTube {i+1}</p></div>)
              : videos.map(([url, title], i) => {
                  const videoId = String(url).match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]
                  return (
                    <div key={i} style={{ borderRadius: 10, overflow: "hidden", background: "#000", position: "relative" }}>
                      {videoId
                        ? <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" style={{ width: "100%", height: 90, objectFit: "cover", display: "block" }} />
                        : <div style={{ height: 90, background: "rgba(255,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>▶️</div>}
                      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ width: 32, height: 32, background: "rgba(255,0,0,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ color: "#fff", fontSize: 12, marginLeft: 2 }}>▶</span>
                        </div>
                      </div>
                      {title && <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent,rgba(0,0,0,0.8))", padding: "20px 10px 8px" }}><p style={{ color: "#fff", fontSize: 10, margin: 0 }}>{title}</p></div>}
                    </div>
                  )
                })}
          </div>
          {c.cta_label && <div style={{ marginTop: 10, background: "rgba(255,0,0,0.1)", border: "1px solid rgba(255,0,0,0.25)", borderRadius: 9, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#FF0000" }}>{c.cta_label}</div>}
        </div>
      )
    }

    case "tiktok_gallery": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
        {c.username && <p style={{ color: muted, fontSize: 11, margin: "0 0 10px", textAlign: "center" }}>{c.username}</p>}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 5 }}>
          {[c.video1_url, c.video2_url, c.video3_url].map((url, i) => (
            <div key={i} style={{ aspectRatio: "9/16", background: "rgba(245,240,232,0.06)", border: "1px solid rgba(245,240,232,0.1)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
              {url ? "🎵" : "📱"}
            </div>
          ))}
        </div>
        {c.cta_label && <div style={{ marginTop: 10, background: "rgba(245,240,232,0.06)", border: "1px solid rgba(245,240,232,0.15)", borderRadius: 9, padding: "10px", textAlign: "center", fontSize: 12, fontWeight: 700, color: text }}>{c.cta_label}</div>}
      </div>
    )

    case "video_testimonials": {
      const testi = [[c.t1_video_url,c.t1_name,c.t1_company,c.t1_quote],[c.t2_video_url,c.t2_name,c.t2_company,c.t2_quote]].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {testi.length===0
              ? <div style={{ height: 80, background: "rgba(78,205,196,0.06)", border: "1px dashed rgba(78,205,196,0.2)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontSize: 11 }}>Ajoutez vos témoignages vidéo</div>
              : testi.map(([url, name, company, quote], i) => {
                const videoId = String(url||"").match(/(?:v=|youtu\.be\/)([^&\s]+)/)?.[1]
                return (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, overflow: "hidden" }}>
                    {videoId
                      ? <div style={{ position: "relative" }}>
                          <img src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`} alt="" style={{ width: "100%", height: 100, objectFit: "cover", display: "block" }} />
                          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ width: 36, height: 36, background: "rgba(0,0,0,0.7)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#fff", fontSize: 14, marginLeft: 2 }}>▶</span></div>
                          </div>
                        </div>
                      : <div style={{ height: 80, background: "rgba(78,205,196,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🎬</div>}
                    <div style={{ padding: "10px 12px" }}>
                      {quote && <p style={{ color: muted, fontSize: 11, fontStyle: "italic", margin: "0 0 7px" }}>"{quote}"</p>}
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: "50%", background: primary+"20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👤</div>
                        <div><p style={{ color: text, fontSize: 11, fontWeight: 700, margin: 0 }}>{name}</p>{company && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{company}</p>}</div>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )
    }

    case "logo_wall": {
      const logos = [
        [c.logo1,c.logo1_name],[c.logo2,c.logo2_name],[c.logo3,c.logo3_name],[c.logo4,c.logo4_name],
        [c.logo5,c.logo5_name],[c.logo6,c.logo6_name],[c.logo7,c.logo7_name],[c.logo8,c.logo8_name],
      ].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px", textAlign: "center" }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {logos.length===0
              ? [0,1,2,3,4,5,6,7].map(i => <div key={i} style={{ height: 36, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: muted, fontSize: 9 }}>Logo</div>)
              : logos.map(([img,name],i) => (
                <div key={i} style={{ height: 36, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {img
                    ? <img src={String(img)} alt={String(name)} style={{ maxWidth: "90%", maxHeight: "90%", objectFit: "contain" }} />
                    : <p style={{ color: muted, fontSize: 8, margin: 0, textAlign: "center", padding: "0 3px", lineHeight: 1.2 }}>{name}</p>}
                </div>
              ))}
          </div>
        </div>
      )
    }


    case "stats_block": {
      const stats = [[c.s1_icon,c.s1_value,c.s1_label],[c.s2_icon,c.s2_value,c.s2_label],[c.s3_icon,c.s3_value,c.s3_label],[c.s4_icon,c.s4_value,c.s4_label]].filter(([,v])=>v)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          <div style={{ display: "grid", gridTemplateColumns: stats.length<=2 ? "1fr 1fr" : stats.length===3 ? "1fr 1fr 1fr" : "1fr 1fr", gap: 8 }}>
            {stats.length===0
              ? [0,1,2].map(i => <div key={i} style={{ background: primary+"08", border: `1px solid ${primary}15`, borderRadius: 12, padding: "14px 10px", textAlign: "center" }}><p style={{ color: primary, fontSize: 22, fontWeight: 700, margin: "0 0 3px" }}>—</p><p style={{ color: muted, fontSize: 10, margin: 0 }}>Label</p></div>)
              : stats.map(([icon,value,label],i) => (
                <div key={i} style={{ background: primary+"08", border: `1px solid ${primary}15`, borderRadius: 12, padding: "14px 10px", textAlign: "center" }}>
                  {icon && <span style={{ fontSize: 20, display: "block", marginBottom: 4 }}>{icon}</span>}
                  <p style={{ color: primary, fontSize: 22, fontWeight: 700, margin: "0 0 3px", fontFamily: theme.fontDisplay, lineHeight: 1 }}>{value}</p>
                  <p style={{ color: muted, fontSize: 10, margin: 0 }}>{label}</p>
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "scan_counter": return (
      <div style={{ padding: "14px 16px", textAlign: "center", ...s }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(57,255,143,0.08)", border: "1px solid rgba(57,255,143,0.2)", borderRadius: 14, padding: "16px 24px" }}>
          <span style={{ fontSize: 28 }}>{c.emoji||"📱"}</span>
          <div>
            <p style={{ color: "#39FF8F", fontSize: 32, fontWeight: 700, margin: 0, fontFamily: theme.fontDisplay, lineHeight: 1 }}>1 284</p>
            <p style={{ color: muted, fontSize: 11, margin: "3px 0 0" }}>{c.label||"scans QR ce mois"}</p>
          </div>
        </div>
      </div>
    )

    case "timeline": {
      const events = [[c.e1_date,c.e1_title,c.e1_desc],[c.e2_date,c.e2_title,c.e2_desc],[c.e3_date,c.e3_title,c.e3_desc],[c.e4_date,c.e4_title,c.e4_desc]].filter(([,t])=>t)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 14px" }}>{c.title}</p>}
          <div style={{ position: "relative", paddingLeft: 20 }}>
            <div style={{ position: "absolute", left: 6, top: 8, bottom: 8, width: 2, background: `linear-gradient(180deg,${primary},${primary}40)`, borderRadius: 1 }} />
            {events.length===0
              ? [0,1,2].map(i => (
                <div key={i} style={{ position: "relative", marginBottom: 16 }}>
                  <div style={{ position: "absolute", left: -17, top: 4, width: 10, height: 10, borderRadius: "50%", background: primary, border: `2px solid ${primary}40` }} />
                  <p style={{ color: primary, fontSize: 11, fontWeight: 700, margin: "0 0 2px" }}>202{i+2}</p>
                  <p style={{ color: text, fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>Étape {i+1}</p>
                  <p style={{ color: muted, fontSize: 11, margin: 0 }}>Description</p>
                </div>
              ))
              : events.map(([date,title,desc],i) => (
                <div key={i} style={{ position: "relative", marginBottom: i<events.length-1 ? 16 : 0 }}>
                  <div style={{ position: "absolute", left: -17, top: 4, width: 10, height: 10, borderRadius: "50%", background: i===events.length-1 ? "#39FF8F" : primary, border: `2px solid ${i===events.length-1 ? "#39FF8F40" : primary+"40"}` }} />
                  <p style={{ color: primary, fontSize: 11, fontWeight: 700, margin: "0 0 2px" }}>{date}</p>
                  <p style={{ color: text, fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>{title}</p>
                  {desc && <p style={{ color: muted, fontSize: 11, margin: 0 }}>{desc}</p>}
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "process_steps": {
      const steps = [[c.s1_icon,c.s1_title,c.s1_desc],[c.s2_icon,c.s2_title,c.s2_desc],[c.s3_icon,c.s3_title,c.s3_desc],[c.s4_icon,c.s4_title,c.s4_desc]].filter(([,t])=>t)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {steps.length===0
              ? [1,2,3].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: primary, color: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{i}</div>
                  <div><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>Étape {i}</p></div>
                </div>
              ))
              : steps.map(([icon,title,desc],i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${primary},${accent})`, color: "#080808", display: "flex", alignItems: "center", justifyContent: "center", fontSize: icon ? 16 : 13, fontWeight: 700, flexShrink: 0 }}>{icon||i+1}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "4px 0 2px" }}>{title}</p>
                    {desc && <p style={{ color: muted, fontSize: 11, margin: 0 }}>{desc}</p>}
                  </div>
                  {i < steps.length-1 && <div style={{ position: "absolute", left: 31, marginTop: 32, width: 2, height: 16, background: primary+"30" }} />}
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "values": {
      const vals = [[c.v1_icon,c.v1_label,c.v1_desc],[c.v2_icon,c.v2_label,c.v2_desc],[c.v3_icon,c.v3_label,c.v3_desc],[c.v4_icon,c.v4_label,c.v4_desc]].filter(([,l])=>l)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(vals.length===0 ? [[" 🤝","Transparence",""],[" ⚡","Réactivité",""],[" 🎯","Qualité",""]] : vals).map(([icon,label,desc],i) => (
              <div key={i} style={{ background: primary+"08", border: `1px solid ${primary}15`, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                <span style={{ fontSize: 24, display: "block", marginBottom: 6 }}>{icon}</span>
                <p style={{ color: text, fontSize: 12, fontWeight: 700, margin: desc ? "0 0 3px" : "0" }}>{label}</p>
                {desc && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{desc}</p>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "team": {
      const members = [[c.m1_photo,c.m1_name,c.m1_role,c.m1_bio],[c.m2_photo,c.m2_name,c.m2_role,c.m2_bio],[c.m3_photo,c.m3_name,c.m3_role,c.m3_bio]].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {members.length===0
              ? [0,1].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: primary+"20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>👤</div>
                  <div><p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>Prénom Nom</p><p style={{ color: muted, fontSize: 11, margin: 0 }}>Poste</p></div>
                </div>
              ))
              : members.map(([photo,name,role,bio],i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
                  {photo
                    ? <img src={String(photo)} alt={String(name)} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${primary}40` }} />
                    : <div style={{ width: 44, height: 44, borderRadius: "50%", background: `linear-gradient(135deg,${primary},${accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#080808", flexShrink: 0 }}>{String(name)[0]}</div>}
                  <div>
                    <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{name}</p>
                    <p style={{ color: primary, fontSize: 11, margin: "0 0 1px" }}>{role}</p>
                    {bio && <p style={{ color: muted, fontSize: 10, margin: 0 }}>{bio}</p>}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "engagements": {
      const engList = [c.e1,c.e2,c.e3,c.e4,c.e5,c.e6].filter(Boolean)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {(engList.length===0 ? ["✅ Réponse sous 24h","✅ Satisfaction garantie","✅ Sans engagement"] : engList).map((eng: string, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(57,255,143,0.05)", border: "1px solid rgba(57,255,143,0.15)", borderRadius: 10 }}>
                <p style={{ color: text, fontSize: 13, margin: 0, lineHeight: 1.4 }}>{eng}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "trust_badge": {
      const badges = [[c.b1_icon,c.b1_label],[c.b2_icon,c.b2_label],[c.b3_icon,c.b3_label],[c.b4_icon,c.b4_label]].filter(([,l])=>l)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px", textAlign: "center" }}>{c.title}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
            {(badges.length===0 ? [["✔","Vérifié"],["🏆","Certifié"],["⭐","Partenaire officiel"]] : badges).map(([icon,label],i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(57,255,143,0.08)", border: "1px solid rgba(57,255,143,0.2)", borderRadius: 20, padding: "7px 14px" }}>
                <span style={{ color: "#39FF8F", fontSize: 14, fontWeight: 700 }}>{icon}</span>
                <span style={{ color: text, fontSize: 12, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "quote_block": return (
      <div style={{ padding: "14px 16px", ...s }}>
        <div style={{ background: primary+"08", border: `1px solid ${primary}20`, borderRadius: 14, padding: "18px 16px", position: "relative" }}>
          <span style={{ position: "absolute", top: 10, left: 14, color: primary, fontSize: 36, fontFamily: "Georgia, serif", lineHeight: 1, opacity: 0.4 }}>"</span>
          <p style={{ color: text, fontSize: 15, fontStyle: "italic", lineHeight: 1.7, margin: "0 0 10px", paddingTop: 10, fontFamily: theme.fontDisplay }}>{c.quote||"La qualité n est jamais un accident."}</p>
          {c.author && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 2, background: primary, borderRadius: 1 }} />
              <p style={{ color: primary, fontSize: 12, fontWeight: 700, margin: 0 }}>{c.author}{c.source ? <span style={{ color: muted, fontWeight: 400 }}> — {c.source}</span> : null}</p>
            </div>
          )}
        </div>
      </div>
    )

    case "announcement": {
      const typeStyles: Record<string,any> = {
        warning: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.3)", color: "#FBBF24" },
        info: { bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.3)", color: "#38BDF8" },
        success: { bg: "rgba(57,255,143,0.08)", border: "rgba(57,255,143,0.3)", color: "#39FF8F" },
        promo: { bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.3)", color: "#C9A84C" },
      }
      const ts = typeStyles[c.type||"warning"]
      return (
        <div style={{ padding: "8px 16px", ...s }}>
          <div style={{ background: ts.bg, border: `1.5px solid ${ts.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{c.emoji||"⚠️"}</span>
              <div>
                {c.title && <p style={{ color: ts.color, fontSize: 13, fontWeight: 700, margin: "0 0 4px" }}>{c.title}</p>}
                {c.message && <p style={{ color: text, fontSize: 12, margin: 0, lineHeight: 1.5 }}>{c.message}</p>}
              </div>
            </div>
          </div>
        </div>
      )
    }

    case "info_table": {
      const rows = [[c.r1_label,c.r1_value],[c.r2_label,c.r2_value],[c.r3_label,c.r3_value],[c.r4_label,c.r4_value],[c.r5_label,c.r5_value],[c.r6_label,c.r6_value]].filter(([l])=>l)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {(rows.length===0 ? [["Création","2020"],["Clients","500+"],["Pays","12"]] : rows).map(([label,value],i,arr) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i<arr.length-1 ? `1px solid ${dayMode?"rgba(0,0,0,0.06)":"rgba(255,255,255,0.05)"}` : "none" }}>
                <span style={{ color: muted, fontSize: 12 }}>{label}</span>
                <span style={{ color: text, fontSize: 12, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "founder_message": return (
      <div style={{ padding: "12px 16px", ...s }}>
        <div style={{ background: primary+"06", border: `1px solid ${primary}15`, borderRadius: 14, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            {c.photo
              ? <img src={c.photo} alt="" style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${primary}40` }} />
              : <div style={{ width: 50, height: 50, borderRadius: "50%", background: `linear-gradient(135deg,${primary},${accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>👤</div>}
            <div>
              <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 2px", fontFamily: theme.fontDisplay }}>{c.name||"Jean Dupont"}</p>
              <p style={{ color: primary, fontSize: 11, margin: 0 }}>{c.role||"Fondateur & CEO"}</p>
            </div>
          </div>
          <p style={{ color: muted, fontSize: 12, lineHeight: 1.7, margin: c.signature ? "0 0 10px" : "0", fontStyle: "italic" }}>"{c.message||"Bienvenue ! Notre mission est de vous offrir le meilleur service possible."}"</p>
          {c.signature && <p style={{ color: primary, fontSize: 14, fontFamily: "Georgia, serif", margin: 0, fontStyle: "italic" }}>{c.signature}</p>}
        </div>
      </div>
    )


    case "google_maps_embed": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.label && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.label}</p>}
        {c.embed_url
          ? <iframe src={c.embed_url} width="100%" height={c.height==="lg" ? 200 : c.height==="sm" ? 120 : 160} style={{ border: "none", borderRadius: 12, display: "block" }} loading="lazy" />
          : <div style={{ height: 160, background: "rgba(66,133,244,0.06)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <span style={{ fontSize: 32 }}>🗺️</span>
              <p style={{ color: muted, fontSize: 11, margin: 0, textAlign: "center" }}>{c.address||"Ajoutez l URL embed Google Maps"}</p>
            </div>}
        {c.show_directions!=="no" && c.address && (
          <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(c.address)}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 10, background: "rgba(66,133,244,0.1)", border: "1px solid rgba(66,133,244,0.25)", borderRadius: 9, padding: "10px", color: "#4285F4", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
            🧭 Obtenir l&apos;itinéraire
          </a>
        )}
      </div>
    )

    case "quote_form": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"Demander un devis"}</p>
        {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 12px" }}>{c.description}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {["Nom complet","Email"].map(f => <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>{f}</div>)}
          {c.show_phone!=="no" && <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>Téléphone</div>}
          {c.show_budget==="yes" && <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>Budget estimé</div>}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px 36px", color: muted, fontSize: 11 }}>Description du projet</div>
          <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#080808" }}>{c.button_label||"Envoyer ma demande"}</div>
        </div>
      </div>
    )

    case "quick_contact": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            [c.phone, "📞", "#39FF8F", `tel:${c.phone}`],
            [c.email, "✉️", "#38BDF8", `mailto:${c.email}`],
            [c.whatsapp, "💬", "#25D366", `https://wa.me/${c.whatsapp}`],
            [c.address, "📍", primary, null],
            [c.hours, "🕐", MUTED, null],
          ].filter(([v]) => v).map(([value, icon, color, href], i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: (color as string)+"10", border: `1px solid ${color as string}20`, borderRadius: 10, padding: "11px 14px" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{icon}</span>
              <span style={{ color: text, fontSize: 12, fontWeight: 600, flex: 1 }}>{value}</span>
              {href && <ExternalLink size={11} color={color as string} style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>
    )

    case "multi_contact": {
      const contacts = [
        [c.c1_photo, c.c1_name, c.c1_role, c.c1_phone, c.c1_email],
        [c.c2_photo, c.c2_name, c.c2_role, c.c2_phone, c.c2_email],
        [c.c3_photo, c.c3_name, c.c3_role, c.c3_phone, c.c3_email],
      ].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {contacts.length===0
              ? [0,1].map(i => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: primary+"20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>👤</div>
                  <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>Prénom Nom</p><p style={{ color: primary, fontSize: 10, margin: "0 0 3px" }}>Poste</p></div>
                </div>
              ))
              : contacts.map(([photo,name,role,phone,email],i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: (phone||email) ? 10 : 0 }}>
                    {photo
                      ? <img src={String(photo)} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${primary}40` }} />
                      : <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg,${primary},${accent})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#080808", flexShrink: 0 }}>{String(name)[0]}</div>}
                    <div><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{name}</p><p style={{ color: primary, fontSize: 10, margin: 0 }}>{role}</p></div>
                  </div>
                  {(phone||email) && (
                    <div style={{ display: "flex", gap: 7 }}>
                      {phone && <a href={`tel:${phone}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "rgba(57,255,143,0.08)", border: "1px solid rgba(57,255,143,0.2)", borderRadius: 8, padding: "7px", color: "#39FF8F", textDecoration: "none", fontSize: 11, fontWeight: 600 }}>📞 Appeler</a>}
                      {email && <a href={`mailto:${email}`} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.2)", borderRadius: 8, padding: "7px", color: "#38BDF8", textDecoration: "none", fontSize: 11, fontWeight: 600 }}>✉️ Email</a>}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "service_area": {
      const cities = [c.city1,c.city2,c.city3,c.city4,c.city5,c.city6].filter(Boolean)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          {c.area && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: 10, padding: "11px 14px", marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>📍</span>
              <div>
                <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{c.area}</p>
                {c.radius && <p style={{ color: muted, fontSize: 11, margin: 0 }}>{c.radius}</p>}
              </div>
            </div>
          )}
          {cities.length>0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {cities.map((city: string, i: number) => (
                <span key={i} style={{ background: "rgba(66,133,244,0.08)", border: "1px solid rgba(66,133,244,0.2)", borderRadius: 20, padding: "5px 12px", color: text, fontSize: 12 }}>📍 {city}</span>
              ))}
            </div>
          )}
          {c.note && <p style={{ color: muted, fontSize: 11, margin: "10px 0 0", fontStyle: "italic" }}>{c.note}</p>}
        </div>
      )
    }

    case "legal_info": {
      const rows = [
        ["Société", c.company_name],
        ["SIRET", c.siret],
        ["N° TVA", c.tva],
        ["Siège social", c.address],
        ["Capital", c.capital],
        ["RCS", c.rcs],
        ["Email", c.email],
      ].filter(([,v])=>v)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            {rows.map(([label,value],i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", borderBottom: i<rows.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                <span style={{ color: muted, fontSize: 11 }}>{label}</span>
                <span style={{ color: text, fontSize: 11, fontWeight: 600, maxWidth: "55%", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</span>
              </div>
            ))}
            {rows.length===0 && <p style={{ color: muted, fontSize: 11, textAlign: "center", padding: "20px", margin: 0 }}>Ajoutez vos informations légales</p>}
          </div>
        </div>
      )
    }

    case "business_certifications": {
      const certs = [
        [c.c1_icon,c.c1_name,c.c1_org,c.c1_year],
        [c.c2_icon,c.c2_name,c.c2_org,c.c2_year],
        [c.c3_icon,c.c3_name,c.c3_org,c.c3_year],
        [c.c4_icon,c.c4_name,c.c4_org,c.c4_year],
      ].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {certs.length===0
              ? [["✅","Qualiopi","Ministère du Travail","2023"],["🏆","RGE","ADEME","2024"]].map(([icon,name,org,year],i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: primary+"06", border: `1px solid ${primary}15`, borderRadius: 11, padding: "10px 12px" }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{name}</p><p style={{ color: muted, fontSize: 10, margin: 0 }}>{org} · {year}</p></div>
                  <Check size={13} color={primary} />
                </div>
              ))
              : certs.map(([icon,name,org,year],i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: primary+"06", border: `1px solid ${primary}15`, borderRadius: 11, padding: "10px 12px" }}>
                  <span style={{ fontSize: 20 }}>{icon||"🏅"}</span>
                  <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 12, fontWeight: 700, margin: 0 }}>{name}</p><p style={{ color: muted, fontSize: 10, margin: 0 }}>{org}{year ? ` · ${year}` : ""}</p></div>
                  <Check size={13} color={primary} />
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "on_site_services": {
      const svcs = [
        [c.s1_icon,c.s1_label],[c.s2_icon,c.s2_label],[c.s3_icon,c.s3_label],[c.s4_icon,c.s4_label],
        [c.s5_icon,c.s5_label],[c.s6_icon,c.s6_label],[c.s7_icon,c.s7_label],[c.s8_icon,c.s8_label],
      ].filter(([,l])=>l)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {(svcs.length===0 ? [["♿","Accès PMR"],["📶","WiFi gratuit"],["🚗","Parking"],["💳","CB acceptée"]] : svcs).map(([icon,label],i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 9, background: "rgba(66,133,244,0.06)", border: "1px solid rgba(66,133,244,0.15)", borderRadius: 10, padding: "10px 12px" }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
                <span style={{ color: text, fontSize: 11, fontWeight: 600 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }


    case "spotify_embed": {
      const getSpotifyId = (url: string, type: string) => {
        const match = url?.match(new RegExp(`spotify\.com\/${type}\/([a-zA-Z0-9]+)`))
        return match?.[1] || null
      }
      const embedType = c.type || "track"
      const spotifyId = c.url ? getSpotifyId(c.url, embedType) : null
      const height = c.size==="lg" ? 352 : c.size==="sm" ? 80 : 152
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {spotifyId
            ? <iframe src={`https://open.spotify.com/embed/${embedType}/${spotifyId}?utm_source=generator&theme=0`}
                width="100%" height={height} style={{ borderRadius: 12, border: "none", display: "block" }}
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
            : <div style={{ height: 152, background: "rgba(29,185,84,0.08)", border: "1.5px solid rgba(29,185,84,0.25)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 32 }}>🎧</span>
                <p style={{ color: muted, fontSize: 11, margin: 0 }}>Ajoutez un lien Spotify</p>
                <p style={{ color: MUTED, fontSize: 9, margin: 0 }}>track / album / playlist / artist</p>
              </div>}
        </div>
      )
    }

    case "latest_release": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "linear-gradient(135deg,rgba(29,185,84,0.12),rgba(29,185,84,0.06))", border: "1.5px solid rgba(29,185,84,0.3)", borderRadius: 16, overflow: "hidden" }}>
          {c.badge && <div style={{ background: "rgba(29,185,84,0.2)", padding: "6px 14px", fontSize: 11, fontWeight: 700, color: "#1DB954", textAlign: "center" }}>{c.badge}</div>}
          <div style={{ display: "flex", gap: 14, padding: "14px" }}>
            {c.cover
              ? <img src={c.cover} alt="" style={{ width: 80, height: 80, borderRadius: 10, objectFit: "cover", flexShrink: 0, boxShadow: "0 4px 16px rgba(0,0,0,0.4)" }} />
              : <div style={{ width: 80, height: 80, borderRadius: 10, background: "rgba(29,185,84,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, flexShrink: 0 }}>🎵</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: text, fontSize: 16, fontWeight: 700, margin: "0 0 3px", fontFamily: theme.fontDisplay, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title||"Nouveau titre"}</p>
              {c.artist && <p style={{ color: muted, fontSize: 12, margin: "0 0 4px" }}>{c.artist}</p>}
              {c.release_date && <p style={{ color: "#1DB954", fontSize: 11, margin: "0 0 10px", fontWeight: 600 }}>📅 {c.release_date}</p>}
              <div style={{ display: "flex", gap: 6 }}>
                {c.spotify_url && <div style={{ background: "#1DB954", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#000" }}>🎧 Spotify</div>}
                {c.apple_url && <div style={{ background: "rgba(252,60,68,0.15)", border: "1px solid rgba(252,60,68,0.3)", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#FC3C44" }}>🍎 Apple</div>}
                {c.youtube_url && <div style={{ background: "rgba(255,0,0,0.12)", border: "1px solid rgba(255,0,0,0.25)", borderRadius: 6, padding: "4px 10px", fontSize: 10, fontWeight: 700, color: "#FF0000" }}>▶ YT</div>}
              </div>
            </div>
          </div>
          {c.cta_label && <div style={{ margin: "0 14px 14px", background: "#1DB954", borderRadius: 10, padding: "11px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#000" }}>{c.cta_label}</div>}
        </div>
      </div>
    )

    case "discography": {
      const albums = [[c.a1_cover,c.a1_title,c.a1_year,c.a1_type,c.a1_url],[c.a2_cover,c.a2_title,c.a2_year,c.a2_type,c.a2_url],[c.a3_cover,c.a3_title,c.a3_year,c.a3_type,c.a3_url]].filter(([,t])=>t)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {albums.length===0
              ? [["","Album 1","2024","Album"],["","Single","2023","Single"]].map(([,title,year,type],i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 8, background: "rgba(29,185,84,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>💿</div>
                  <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{title}</p><p style={{ color: muted, fontSize: 11, margin: 0 }}>{type} · {year}</p></div>
                  <span style={{ color: "#1DB954", fontSize: 18 }}>▶</span>
                </div>
              ))
              : albums.map(([cover,title,year,type],i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {cover
                    ? <img src={String(cover)} alt="" style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: 52, height: 52, borderRadius: 8, background: "rgba(29,185,84,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>💿</div>}
                  <div style={{ flex: 1 }}>
                    <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{title}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ background: "rgba(29,185,84,0.12)", border: "1px solid rgba(29,185,84,0.2)", borderRadius: 10, padding: "1px 7px", color: "#1DB954", fontSize: 9, fontWeight: 700 }}>{type}</span>
                      <span style={{ color: muted, fontSize: 11 }}>{year}</span>
                    </div>
                  </div>
                  <span style={{ color: "#1DB954", fontSize: 18 }}>▶</span>
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "album_block": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(29,185,84,0.06)", border: "1px solid rgba(29,185,84,0.2)", borderRadius: 14, overflow: "hidden" }}>
          {c.cover
            ? <img src={c.cover} alt="" style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
            : <div style={{ height: 140, background: "rgba(29,185,84,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>💿</div>}
          <div style={{ padding: "14px" }}>
            <p style={{ color: text, fontSize: 18, fontWeight: 700, margin: "0 0 3px", fontFamily: theme.fontDisplay }}>{c.title||"Mon Album"}</p>
            {c.artist && <p style={{ color: muted, fontSize: 12, margin: "0 0 3px" }}>{c.artist}</p>}
            <div style={{ display: "flex", gap: 10, marginBottom: c.description ? 10 : 12 }}>
              {c.year && <span style={{ color: "#1DB954", fontSize: 11, fontWeight: 600 }}>{c.year}</span>}
              {c.tracks && <span style={{ color: muted, fontSize: 11 }}>· {c.tracks}</span>}
            </div>
            {c.description && <p style={{ color: muted, fontSize: 12, margin: "0 0 12px", lineHeight: 1.6 }}>{c.description}</p>}
            <div style={{ display: "flex", gap: 7, marginBottom: 12 }}>
              {c.spotify_url && <div style={{ flex: 1, background: "#1DB954", borderRadius: 8, padding: "8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#000" }}>🎧 Spotify</div>}
              {c.apple_url && <div style={{ flex: 1, background: "rgba(252,60,68,0.15)", border: "1px solid rgba(252,60,68,0.3)", borderRadius: 8, padding: "8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#FC3C44" }}>🍎 Apple</div>}
              {c.deezer_url && <div style={{ flex: 1, background: "rgba(162,56,255,0.12)", border: "1px solid rgba(162,56,255,0.25)", borderRadius: 8, padding: "8px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#A238FF" }}>🎶 Deezer</div>}
            </div>
            {!c.spotify_url && !c.apple_url && !c.deezer_url && c.cta_label && (
              <div style={{ background: "#1DB954", borderRadius: 9, padding: "11px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#000" }}>{c.cta_label}</div>
            )}
          </div>
        </div>
      </div>
    )

    case "playlist_block": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          {c.cover
            ? <img src={c.cover} alt="" style={{ width: 60, height: 60, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
            : <div style={{ width: 60, height: 60, borderRadius: 10, background: "rgba(29,185,84,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>📋</div>}
          <div style={{ flex: 1 }}>
            <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 3px" }}>{c.title||"Ma Playlist"}</p>
            {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 3px" }}>{c.description}</p>}
            {c.tracks_count && <p style={{ color: "#1DB954", fontSize: 11, margin: 0, fontWeight: 600 }}>🎵 {c.tracks_count}</p>}
          </div>
        </div>
        <div style={{ display: "flex", gap: 7 }}>
          {c.spotify_url && <div style={{ flex: 1, background: "#1DB954", borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#000" }}>🎧 Spotify</div>}
          {c.apple_url && <div style={{ flex: 1, background: "rgba(252,60,68,0.15)", border: "1px solid rgba(252,60,68,0.3)", borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#FC3C44" }}>🍎 Apple</div>}
          {c.deezer_url && <div style={{ flex: 1, background: "rgba(162,56,255,0.12)", border: "1px solid rgba(162,56,255,0.25)", borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#A238FF" }}>🎶 Deezer</div>}
          {!c.spotify_url && !c.apple_url && !c.deezer_url && (
            <div style={{ flex: 1, background: "#1DB954", borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#000" }}>{c.cta_label||"Écouter la playlist"}</div>
          )}
        </div>
      </div>
    )

    case "concerts": {
      const shows = [[c.c1_date,c.c1_city,c.c1_venue,c.c1_url],[c.c2_date,c.c2_city,c.c2_venue,c.c2_url],[c.c3_date,c.c3_city,c.c3_venue,c.c3_url],[c.c4_date,c.c4_city,c.c4_venue,c.c4_url]].filter(([,city])=>city)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {shows.length===0
              ? [["15 juin","Paris","L Olympia"],["22 juin","Lyon","Le Transbordeur"]].map(([date,city,venue],i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(145,70,255,0.06)", border: "1px solid rgba(145,70,255,0.2)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ textAlign: "center", flexShrink: 0, minWidth: 44 }}><p style={{ color: "#9146FF", fontSize: 13, fontWeight: 700, margin: 0 }}>{date}</p></div>
                  <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{city}</p><p style={{ color: muted, fontSize: 11, margin: 0 }}>🎭 {venue}</p></div>
                  <div style={{ background: "#9146FF", borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#fff" }}>Billets</div>
                </div>
              ))
              : shows.map(([date,city,venue,url],i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: "rgba(145,70,255,0.06)", border: "1px solid rgba(145,70,255,0.2)", borderRadius: 12, padding: "12px 14px" }}>
                  <div style={{ textAlign: "center", flexShrink: 0, minWidth: 44 }}><p style={{ color: "#9146FF", fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{date}</p></div>
                  <div style={{ flex: 1 }}><p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{city}</p>{venue && <p style={{ color: muted, fontSize: 11, margin: 0 }}>🎭 {venue}</p>}</div>
                  {url && <div style={{ background: "#9146FF", borderRadius: 7, padding: "6px 12px", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0 }}>Billets →</div>}
                </div>
              ))}
          </div>
        </div>
      )
    }

    case "ticketing": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(145,70,255,0.08)", border: "1.5px solid rgba(145,70,255,0.3)", borderRadius: 14, padding: "16px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>🎟️</span>
            <div>
              <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 3px" }}>{c.event_name||"Mon Concert"}</p>
              {c.date && <p style={{ color: muted, fontSize: 11, margin: "0 0 2px" }}>📅 {c.date}</p>}
              {c.venue && <p style={{ color: muted, fontSize: 11, margin: "0 0 2px" }}>📍 {c.venue}</p>}
              {c.price && <p style={{ color: "#9146FF", fontSize: 12, fontWeight: 700, margin: 0 }}>💶 {c.price}</p>}
            </div>
          </div>
          <div style={{ background: "#9146FF", borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
            {c.label||"Acheter mes billets"} {c.platform && c.platform!=="URL personnalisée" ? `— ${c.platform}` : ""}
          </div>
        </div>
      </div>
    )

    case "presave": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "linear-gradient(135deg,rgba(29,185,84,0.1),rgba(29,185,84,0.05))", border: "1.5px solid rgba(29,185,84,0.3)", borderRadius: 16, padding: "16px", textAlign: "center" }}>
          {c.cover
            ? <img src={c.cover} alt="" style={{ width: 100, height: 100, borderRadius: 12, objectFit: "cover", margin: "0 auto 12px", display: "block", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }} />
            : <div style={{ width: 100, height: 100, borderRadius: 12, background: "rgba(29,185,84,0.15)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40 }}>💾</div>}
          <p style={{ color: text, fontSize: 16, fontWeight: 700, margin: "0 0 3px", fontFamily: theme.fontDisplay }}>{c.release_name||"Mon prochain titre"}</p>
          {c.release_date && <p style={{ color: "#1DB954", fontSize: 12, fontWeight: 600, margin: "0 0 14px" }}>📅 Sortie le {c.release_date}</p>}
          <div style={{ display: "flex", gap: 8 }}>
            {c.spotify_url && <div style={{ flex: 1, background: "#1DB954", borderRadius: 9, padding: "11px", fontSize: 12, fontWeight: 700, color: "#000" }}>💾 Pré-save Spotify</div>}
            {c.apple_url && <div style={{ flex: 1, background: "rgba(252,60,68,0.15)", border: "1px solid rgba(252,60,68,0.3)", borderRadius: 9, padding: "11px", fontSize: 12, fontWeight: 700, color: "#FC3C44" }}>🍎 Apple Music</div>}
          </div>
          {!c.spotify_url && !c.apple_url && (
            <div style={{ background: "#1DB954", borderRadius: 9, padding: "12px", fontSize: 13, fontWeight: 700, color: "#000" }}>{c.cta_label||"Pré-sauvegarder sur Spotify"}</div>
          )}
        </div>
      </div>
    )

    case "booking_request": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"Réserver pour un événement"}</p>
        {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 12px" }}>{c.description}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {["Nom / Organisation","Email","Type d événement","Date souhaitée"].map(f => (
            <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>{f}</div>
          ))}
          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px 32px", color: muted, fontSize: 11 }}>Message</div>
          <div style={{ background: "linear-gradient(90deg,#9146FF,#7B3FCC)", borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.button_label||"Envoyer ma demande"}</div>
        </div>
      </div>
    )

    case "merch": {
      const products = [[c.img1,c.name1,c.price1],[c.img2,c.name2,c.price2],[c.img3,c.name3,c.price3]].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 12px" }}>{c.description}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 12 }}>
            {(products.length===0 ? [[null,"T-shirt","25€"],[null,"Vinyle","35€"],[null,"Casquette","20€"]] : products).map(([img,name,price],i) => (
              <div key={i} style={{ background: "rgba(145,70,255,0.06)", border: "1px solid rgba(145,70,255,0.15)", borderRadius: 10, overflow: "hidden" }}>
                {img
                  ? <img src={String(img)} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }} />
                  : <div style={{ aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>👕</div>}
                <div style={{ padding: "6px 8px" }}>
                  <p style={{ color: text, fontSize: 10, fontWeight: 700, margin: "0 0 1px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</p>
                  <p style={{ color: "#9146FF", fontSize: 11, fontWeight: 700, margin: 0 }}>{price}</p>
                </div>
              </div>
            ))}
          </div>
          {c.cta_label && <div style={{ background: "linear-gradient(90deg,#9146FF,#7B3FCC)", borderRadius: 9, padding: "11px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.cta_label}</div>}
        </div>
      )
    }


    case "event_program": {
      const steps = [
        [c.s1_time, c.s1_title, c.s1_desc],
        [c.s2_time, c.s2_title, c.s2_desc],
        [c.s3_time, c.s3_title, c.s3_desc],
        [c.s4_time, c.s4_title, c.s4_desc],
        [c.s5_time, c.s5_title, c.s5_desc],
      ].filter(([,t])=>t)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {(steps.length===0 ? [["18h00","Accueil","Espace lounge"],["19h00","Concert live","Scène principale"],["22h00","DJ Set","Jusqu au matin"]] : steps).map(([time,title,desc],i,arr) => (
              <div key={i} style={{ display: "flex", gap: 14, paddingBottom: i<arr.length-1 ? 14 : 0 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg,#EC4899,#F472B6)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff", flexShrink: 0 }}>{time}</div>
                  {i<arr.length-1 && <div style={{ width: 2, flex: 1, background: "rgba(236,72,153,0.2)", marginTop: 4 }} />}
                </div>
                <div style={{ flex: 1, paddingTop: 6 }}>
                  <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{title}</p>
                  {desc && <p style={{ color: muted, fontSize: 11, margin: 0 }}>{desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "event_ticketing": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(236,72,153,0.08)", border: "1.5px solid rgba(236,72,153,0.3)", borderRadius: 14, padding: "16px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <span style={{ fontSize: 32, flexShrink: 0 }}>🎟️</span>
            <div style={{ flex: 1 }}>
              <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 3px" }}>{c.event_name||"Mon événement"}</p>
              {c.date && <p style={{ color: muted, fontSize: 11, margin: "0 0 2px" }}>📅 {c.date}</p>}
              {c.location && <p style={{ color: muted, fontSize: 11, margin: "0 0 2px" }}>📍 {c.location}</p>}
              {c.price && <p style={{ color: "#EC4899", fontSize: 12, fontWeight: 700, margin: 0 }}>💶 {c.price}</p>}
            </div>
          </div>
          <div style={{ background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 10, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
            {c.label||"Réserver ma place"} {c.platform && c.platform!=="URL personnalisée" ? `— ${c.platform}` : ""}
          </div>
        </div>
      </div>
    )

    case "event_guests": {
      const guests = [[c.g1_photo,c.g1_name,c.g1_role,c.g1_desc],[c.g2_photo,c.g2_name,c.g2_role,c.g2_desc],[c.g3_photo,c.g3_name,c.g3_role,c.g3_desc],[c.g4_photo,c.g4_name,c.g4_role,c.g4_desc]].filter(([,n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(guests.length===0 ? [[null,"DJ Shadow","Headliner","DJ & Producteur"],[null,"Marie D.","Conférencière","CEO Startup"]] : guests).map(([photo,name,role,desc],i) => (
              <div key={i} style={{ background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.15)", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
                {photo
                  ? <img src={String(photo)} alt="" style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", margin: "0 auto 8px", display: "block", border: "2px solid rgba(236,72,153,0.4)" }} />
                  : <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#EC4899,#F472B6)", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#fff" }}>{String(name)[0]}</div>}
                <p style={{ color: text, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{name}</p>
                {role && <span style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.25)", borderRadius: 20, padding: "2px 8px", color: "#EC4899", fontSize: 9, fontWeight: 700 }}>{role}</span>}
                {desc && <p style={{ color: muted, fontSize: 10, margin: "4px 0 0" }}>{desc}</p>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "lineup": {
      const artists = [[c.a1_name,c.a1_stage,c.a1_time,c.a1_headliner],[c.a2_name,c.a2_stage,c.a2_time,c.a2_headliner],[c.a3_name,c.a3_stage,c.a3_time,c.a3_headliner],[c.a4_name,c.a4_stage,c.a4_time,c.a4_headliner]].filter(([n])=>n)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {(artists.length===0 ? [["DJ Shadow","Scène principale","22h00","yes"],["The Blaze","Scène 2","20h00","no"],["Polo & Pan","Scène électro","18h00","no"]] : artists).map(([name,stage,time,headliner],i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: headliner==="yes" ? "rgba(236,72,153,0.1)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${headliner==="yes" ? "rgba(236,72,153,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 12, padding: "11px 14px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <p style={{ color: headliner==="yes" ? "#EC4899" : text, fontSize: headliner==="yes" ? 15 : 13, fontWeight: 700, margin: 0 }}>{name}</p>
                    {headliner==="yes" && <span style={{ background: "#EC4899", color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 8, fontWeight: 700 }}>HEADLINER</span>}
                  </div>
                  {stage && <p style={{ color: muted, fontSize: 10, margin: "2px 0 0" }}>🎭 {stage}</p>}
                </div>
                {time && <span style={{ color: headliner==="yes" ? "#EC4899" : muted, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{time}</span>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "event_access": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
        {c.embed_url
          ? <iframe src={c.embed_url} width="100%" height={150} style={{ border: "none", borderRadius: 12, display: "block", marginBottom: 10 }} loading="lazy" />
          : <div style={{ height: 130, background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 10 }}>
              <span style={{ fontSize: 28 }}>🗺️</span>
              {c.address && <p style={{ color: muted, fontSize: 11, margin: 0, textAlign: "center", padding: "0 14px" }}>📍 {c.address}</p>}
            </div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[
            [c.transport1_icon, c.transport1_label],
            [c.transport2_icon, c.transport2_label],
            [c.transport3_icon, c.transport3_label],
          ].filter(([,l])=>l).map(([icon,label],i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 9, padding: "9px 12px" }}>
              <span style={{ fontSize: 18 }}>{icon}</span>
              <span style={{ color: text, fontSize: 12 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    )

    case "event_register": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"S inscrire gratuitement"}</p>
        {c.description && <p style={{ color: "#EC4899", fontSize: 11, margin: "0 0 12px", fontWeight: 600 }}>⚡ {c.description}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {["Prénom & Nom","Email"].map(f => <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>{f}</div>)}
          {c.show_phone==="yes" && <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>Téléphone</div>}
          {c.show_company==="yes" && <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 11px", color: muted, fontSize: 11 }}>Société</div>}
          <div style={{ background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 9, padding: "12px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.button_label||"Je m inscris"}</div>
        </div>
      </div>
    )

    case "rsvp": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <p style={{ color: text, fontSize: 14, fontWeight: 700, margin: "0 0 4px" }}>{c.title||"Serez-vous présent ?"}</p>
        {c.description && <p style={{ color: muted, fontSize: 11, margin: "0 0 14px" }}>{c.description}</p>}
        <div style={{ display: "flex", gap: 8 }}>
          <button style={{ flex: 2, background: "rgba(57,255,143,0.1)", border: "1.5px solid rgba(57,255,143,0.3)", borderRadius: 10, padding: "12px 8px", color: "#39FF8F", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{c.yes_label||"✅ Oui, je viens"}</button>
          <button style={{ flex: 1, background: "rgba(251,191,36,0.08)", border: "1.5px solid rgba(251,191,36,0.25)", borderRadius: 10, padding: "12px 8px", color: "#FBBF24", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{c.maybe_label||"🤔 Peut-être"}</button>
          <button style={{ flex: 1, background: "rgba(239,68,68,0.08)", border: "1.5px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 8px", color: "#EF4444", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{c.no_label||"❌ Non"}</button>
        </div>
      </div>
    )

    case "add_to_calendar": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: "rgba(236,72,153,0.06)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 14, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: "rgba(236,72,153,0.12)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>📅</div>
            <div>
              <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{c.event_name||"Mon événement"}</p>
              {c.start_date && <p style={{ color: muted, fontSize: 11, margin: 0 }}>🕐 {c.start_date}</p>}
              {c.location && <p style={{ color: muted, fontSize: 11, margin: 0 }}>📍 {c.location}</p>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            {c.google_url
              ? <>
                  <div style={{ flex: 1, background: "rgba(66,133,244,0.12)", border: "1px solid rgba(66,133,244,0.25)", borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#4285F4" }}>📅 Google</div>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 11, fontWeight: 700, color: text }}>🍎 Apple</div>
                  <div style={{ flex: 1, background: "rgba(0,120,212,0.1)", border: "1px solid rgba(0,120,212,0.2)", borderRadius: 8, padding: "9px", textAlign: "center", fontSize: 11, fontWeight: 700, color: "#0078D4" }}>📆 Outlook</div>
                </>
              : <div style={{ flex: 1, background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 9, padding: "11px", textAlign: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>{c.cta_label||"Ajouter à mon agenda"}</div>}
          </div>
        </div>
      </div>
    )

    case "participants_count": {
      const total = parseInt(c.count||"287")
      const max = parseInt(c.max||"500")
      const pct = Math.min(100, Math.round((total/max)*100))
      return (
        <div style={{ padding: "14px 16px", textAlign: "center", ...s }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 14, padding: "16px 24px", marginBottom: c.show_progress!=="no" ? 12 : 0 }}>
            <span style={{ fontSize: 28 }}>{c.emoji||"👥"}</span>
            <div>
              <p style={{ color: "#EC4899", fontSize: 32, fontWeight: 700, margin: 0, fontFamily: theme.fontDisplay, lineHeight: 1 }}>{c.count||"287"}</p>
              <p style={{ color: muted, fontSize: 11, margin: "3px 0 0" }}>{c.label||"participants inscrits"}</p>
            </div>
          </div>
          {c.show_progress!=="no" && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ color: muted, fontSize: 10 }}>Inscriptions</span>
                <span style={{ color: "#EC4899", fontSize: 10, fontWeight: 700 }}>{pct}% · {total}/{max}</span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.07)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#EC4899,#F472B6)", borderRadius: 3 }} />
              </div>
            </div>
          )}
        </div>
      )
    }

    case "tickets_left": {
      const urgencyStyles: Record<string,any> = {
        high: { bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.4)", color: "#EF4444", pulse: true },
        medium: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.3)", color: "#FBBF24", pulse: false },
        low: { bg: "rgba(57,255,143,0.08)", border: "rgba(57,255,143,0.25)", color: "#39FF8F", pulse: false },
      }
      const us = urgencyStyles[c.urgency||"high"]
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          <div style={{ background: us.bg, border: `1.5px solid ${us.border}`, borderRadius: 14, padding: "16px", textAlign: "center" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: 28 }}>🎟️</span>
              <div>
                <p style={{ color: us.color, fontSize: 32, fontWeight: 700, margin: 0, fontFamily: theme.fontDisplay, lineHeight: 1 }}>{c.count||"14"}</p>
                <p style={{ color: muted, fontSize: 11, margin: "3px 0 0" }}>{c.label||"places restantes"}</p>
              </div>
            </div>
            {c.cta_label && <div style={{ background: us.color, borderRadius: 10, padding: "12px", fontSize: 13, fontWeight: 700, color: c.urgency==="medium" ? "#080808" : "#fff" }}>{c.cta_label}</div>}
          </div>
        </div>
      )
    }


    case "qr_code_block": return (
      <div style={{ padding: "16px", textAlign: "center", ...s }}>
        <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <div style={{ background: "#FFFFFF", border: `3px solid ${primary}30`, borderRadius: 14, padding: c.size==="lg" ? 14 : c.size==="sm" ? 7 : 10, boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
            <div style={{ width: c.size==="lg" ? 160 : c.size==="sm" ? 80 : 120, height: c.size==="lg" ? 160 : c.size==="sm" ? 80 : 120, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 2, width: "100%", height: "100%" }}>
                {Array.from({length:25}).map((_,i) => {
                  const corners = [0,1,2,3,4,5,9,10,14,15,19,20,21,22,23,24]
                  return <div key={i} style={{ background: corners.includes(i) ? "#111" : Math.random()>0.4 ? "#111" : "transparent", borderRadius: 1 }} />
                })}
              </div>
            </div>
          </div>
          {c.label && <p style={{ color: text, fontSize: 12, fontWeight: 600, margin: 0 }}>{c.label}</p>}
          {c.show_url!=="no" && <p style={{ color: muted, fontSize: 10, margin: 0, fontFamily: "monospace" }}>/q/...</p>}
        </div>
      </div>
    )

    case "hero_banner": {
      const h = c.height==="lg" ? 220 : c.height==="sm" ? 140 : 180
      const align = c.align==="left" ? "flex-start" : "center"
      const textAlign = c.align==="left" ? "left" : "center"
      return (
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 12 }}>
          {c.bg_image
            ? <img src={c.bg_image} alt="" style={{ width: "100%", height: h, objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: h, background: c.bg_color ? c.bg_color : `linear-gradient(135deg,${primary}30,${accent}15,#080808)` }} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 20%,rgba(0,0,0,0.7) 100%)" }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: align, justifyContent: "flex-end", padding: c.height==="sm" ? "14px" : "20px" }}>
            {c.title && <h2 style={{ color: "#fff", fontSize: c.height==="lg" ? 26 : 20, fontWeight: 700, margin: "0 0 6px", fontFamily: theme.fontDisplay, textAlign, textShadow: "0 2px 10px rgba(0,0,0,0.5)", lineHeight: 1.2 }}>{c.title}</h2>}
            {c.subtitle && <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, margin: "0 0 14px", textAlign }}>{c.subtitle}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start" }}>
              {c.cta_label && <div style={{ background: `linear-gradient(90deg,${primary},${primary}cc)`, borderRadius: 9, padding: "10px 18px", fontSize: 12, fontWeight: 700, color: "#080808" }}>{c.cta_label}</div>}
              {c.cta2_label && <div style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 9, padding: "10px 18px", fontSize: 12, fontWeight: 600, color: "#fff" }}>{c.cta2_label}</div>}
            </div>
          </div>
        </div>
      )
    }

    case "section_banner": {
      const bannerStyles: Record<string,any> = {
        lines: <div style={{ display: "flex", alignItems: "center", gap: 12 }}><div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,transparent,${primary}60)` }} /><span style={{ color: c.color||primary, fontSize: 12, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", whiteSpace: "nowrap" }}>{c.title||"SECTION"}</span><div style={{ flex: 1, height: 1, background: `linear-gradient(90deg,${primary}60,transparent)` }} /></div>,
        dots: <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ display: "flex", gap: 3 }}>{[0,1,2].map(i=><div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: c.color||primary }}/>)}</div><span style={{ color: c.color||primary, fontSize: 12, fontWeight: 700, letterSpacing: 3 }}>{c.title||"SECTION"}</span><div style={{ display: "flex", gap: 3 }}>{[0,1,2].map(i=><div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: c.color||primary }}/>)}</div></div>,
        gradient: <div style={{ background: `linear-gradient(90deg,${primary}15,${accent}10)`, borderRadius: 8, padding: "10px 16px", textAlign: "center" }}><span style={{ color: c.color||primary, fontSize: 13, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>{c.title||"SECTION"}</span></div>,
        minimal: <p style={{ color: c.color||primary, fontSize: 13, fontWeight: 700, letterSpacing: 4, textTransform: "uppercase", textAlign: "center", margin: 0 }}>{c.title||"SECTION"}</p>,
        badge: <div style={{ textAlign: "center" }}><span style={{ background: (c.color||primary)+"18", border: `1px solid ${c.color||primary}35`, borderRadius: 20, padding: "6px 18px", color: c.color||primary, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>{c.title||"SECTION"}</span></div>,
      }
      return <div style={{ padding: "12px 16px", ...s }}>{bannerStyles[c.style||"lines"]}</div>
    }

    case "two_columns": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {[[c.col1_icon,c.col1_title,c.col1_text],[c.col2_icon,c.col2_title,c.col2_text]].map(([icon,title,text_col],i) => (
            <div key={i} style={{ background: primary+"06", border: `1px solid ${primary}15`, borderRadius: 12, padding: "13px 12px" }}>
              {icon && <span style={{ fontSize: 24, display: "block", marginBottom: 8 }}>{icon}</span>}
              {title && <p style={{ color: text, fontSize: 13, fontWeight: 700, margin: "0 0 5px" }}>{title}</p>}
              {text_col && <p style={{ color: muted, fontSize: 11, margin: 0, lineHeight: 1.6 }}>{text_col}</p>}
              {!title && !text_col && <p style={{ color: muted, fontSize: 11, margin: 0 }}>Colonne {i+1}</p>}
            </div>
          ))}
        </div>
      </div>
    )

    case "grid_section": {
      const cols = parseInt(c.columns||"3")
      const cards = [
        [c.c1_icon,c.c1_title,c.c1_text],[c.c2_icon,c.c2_title,c.c2_text],
        [c.c3_icon,c.c3_title,c.c3_text],[c.c4_icon,c.c4_title,c.c4_text],
        [c.c5_icon,c.c5_title,c.c5_text],[c.c6_icon,c.c6_title,c.c6_text],
      ].filter(([,t])=>t)
      const displayCards = cards.length===0 ? Array.from({length:cols}).map((_,i)=>["⚡",`Carte ${i+1}`,"Description"]) : cards
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>
            {displayCards.slice(0, cols*2).map(([icon,title,txt],i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "12px 10px", textAlign: "center" }}>
                {icon && <span style={{ fontSize: 22, display: "block", marginBottom: 6 }}>{icon}</span>}
                <p style={{ color: text, fontSize: 11, fontWeight: 700, margin: "0 0 3px" }}>{title}</p>
                {txt && <p style={{ color: muted, fontSize: 9, margin: 0 }}>{txt}</p>}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "section_block": return (
      <div style={{ padding: "10px 16px", ...s }}>
        <div style={{ background: c.bg_style==="card" ? "rgba(255,255,255,0.03)" : c.bg_style==="highlight" ? primary+"08" : "transparent", border: c.bg_style==="card" ? "1px solid rgba(255,255,255,0.07)" : c.bg_style==="highlight" ? `1px solid ${primary}20` : "none", borderRadius: c.bg_style!=="transparent" ? 12 : 0, padding: c.bg_style!=="transparent" ? "14px" : "0" }}>
          {c.title && <p style={{ color: primary, fontSize: 14, fontWeight: 700, margin: "0 0 3px", fontFamily: theme.fontDisplay }}>{c.title}</p>}
          {c.subtitle && <p style={{ color: muted, fontSize: 12, margin: c.show_divider!=="no" ? "0 0 10px" : "0" }}>{c.subtitle}</p>}
          {c.show_divider!=="no" && <div style={{ height: 1, background: `linear-gradient(90deg,${primary}50,transparent)`, marginTop: c.title && !c.subtitle ? 8 : 0 }} />}
          {!c.title && <p style={{ color: muted, fontSize: 11, margin: 0, textAlign: "center" }}>Section — ajoutez un titre</p>}
        </div>
      </div>
    )

    case "embed_block": return (
      <div style={{ padding: "10px 16px", ...s }}>
        {c.url
          ? <div>
              {c.title && <p style={{ color: muted, fontSize: 10, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1.5 }}>{c.title}</p>}
              <iframe src={c.url} width="100%" height={parseInt(c.height||"400")} style={{ border: "none", borderRadius: 12, display: "block" }} loading="lazy" />
            </div>
          : <div style={{ background: "rgba(201,168,76,0.06)", border: "1.5px dashed rgba(201,168,76,0.25)", borderRadius: 12, padding: "30px", textAlign: "center" }}>
              <span style={{ fontSize: 32, display: "block", marginBottom: 10 }}>🔗</span>
              <p style={{ color: text, fontSize: 13, fontWeight: 600, margin: "0 0 5px" }}>{c.title||"Embed externe"}</p>
              <p style={{ color: muted, fontSize: 11, margin: 0 }}>{c.type||"Google Forms, Typeform, Notion..."}</p>
            </div>}
      </div>
    )

    case "tabs_block": { const [activeTab, setActiveTab] = [0, (_:number) => {}] as const
      const tabs = [[c.tab1_label,c.tab1_content],[c.tab2_label,c.tab2_content],[c.tab3_label,c.tab3_content]].filter(([l])=>l)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 12 }}>
            {(tabs.length===0 ? [["Présentation"],["Tarifs"],["FAQ"]] : tabs).map(([label],i) => (
              <button key={i} onClick={() => setActiveTab(i)}
                style={{ padding: "8px 14px", background: "transparent", border: "none", borderBottom: `2px solid ${activeTab===i ? primary : "transparent"}`, color: activeTab===i ? primary : muted, fontSize: 11, fontWeight: activeTab===i ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                {label}
              </button>
            ))}
          </div>
          <div style={{ minHeight: 60 }}>
            {tabs.length===0
              ? <p style={{ color: muted, fontSize: 11, margin: 0 }}>Contenu de l onglet {activeTab+1}</p>
              : <p style={{ color: text, fontSize: 12, margin: 0, lineHeight: 1.7 }}>{tabs[activeTab]?.[1]||"Ajoutez du contenu..."}</p>}
          </div>
        </div>
      )
    }

    case "accordion_block": { const [openIdx, setOpenIdx] = [null as number|null, (_:number|null) => {}] as const
      const items = [[c.a1_title,c.a1_content],[c.a2_title,c.a2_content],[c.a3_title,c.a3_content],[c.a4_title,c.a4_content]].filter(([t])=>t)
      return (
        <div style={{ padding: "10px 16px", ...s }}>
          {c.title && <p style={{ color: muted, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(items.length===0 ? [["Nos services","Détail des services..."],["Nos tarifs","Détail des tarifs..."],["Conditions","Nos conditions..."]] : items).map(([title,content],i) => (
              <div key={i} style={{ border: `1px solid ${openIdx===i ? primary+"40" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, overflow: "hidden" }}>
                <button onClick={() => setOpenIdx(openIdx===i ? null : i)}
                  style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 14px", background: openIdx===i ? primary+"08" : "transparent", border: "none", color: openIdx===i ? primary : text, fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                  {title}
                  <span style={{ color: primary, fontSize: 16, lineHeight: 1 }}>{openIdx===i ? "−" : "+"}</span>
                </button>
                {openIdx===i && content && (
                  <div style={{ padding: "4px 14px 12px", background: "rgba(0,0,0,0.15)" }}>
                    <p style={{ color: muted, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )
    }

    case "info_box": {
      const boxStyles: Record<string,any> = {
        info: { bg: "rgba(56,189,248,0.08)", border: "rgba(56,189,248,0.3)", color: "#38BDF8" },
        warning: { bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.3)", color: "#FBBF24" },
        success: { bg: "rgba(57,255,143,0.08)", border: "rgba(57,255,143,0.3)", color: "#39FF8F" },
        tip: { bg: "rgba(201,168,76,0.08)", border: "rgba(201,168,76,0.3)", color: "#C9A84C" },
        important: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)", color: "#EF4444" },
      }
      const bs = boxStyles[c.type||"info"]
      return (
        <div style={{ padding: "8px 16px", ...s }}>
          <div style={{ background: bs.bg, border: `1.5px solid ${bs.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{c.emoji||"💡"}</span>
              <div>
                {c.title && <p style={{ color: bs.color, fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>{c.title}</p>}
                <p style={{ color: text, fontSize: 12, margin: 0, lineHeight: 1.6 }}>{c.message||"Information importante à retenir."}</p>
              </div>
            </div>
          </div>
        </div>
      )
    }

    default: {
      const def = BLOCK_DEFS[block.type]
      return <div style={{ padding: "12px 16px", textAlign: "center", ...s }}><span style={{ fontSize: 22 }}>{def?.icon||"📦"}</span><p style={{ color: muted, fontSize: 11, margin: "5px 0 0" }}>{def?.label||block.type}</p></div>
    }
  }
}

function EditPanel({ block, onChange }: { block: Block; onChange: (key: string, val: string) => void }) {
  const def = BLOCK_DEFS[block.type]
  if (!def) return null
  const inputStyle: React.CSSProperties = { width: "100%", background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "9px 11px", color: "#F5F0E8", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif" }

  if (block.type === "social_links") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>Laisse vide pour masquer le réseau.</p>
        {SOCIAL_NETWORKS.map(n => (
          <div key={n.key}>
            <label style={{ color: MUTED, fontSize: 11, display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              <span style={{ color: n.color, fontWeight: 600 }}>{n.label}</span>
            </label>
            <input type="url" value={block.content[n.key]||""} onChange={e => onChange(n.key, e.target.value)}
              placeholder={`https://${n.key}.com/...`}
              style={{ ...inputStyle, borderColor: block.content[n.key] ? n.color+"50" : "rgba(201,168,76,0.2)" }}
              onFocus={e => e.target.style.borderColor = n.color+"80"}
              onBlur={e => e.target.style.borderColor = block.content[n.key] ? n.color+"50" : "rgba(201,168,76,0.2)"} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {def.fields.map(field => (
        <div key={field.key}>
          <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 5, fontWeight: 500 }}>{field.label}</label>
          {field.type === "textarea"
            ? <textarea value={block.content[field.key]||""} onChange={e => onChange(field.key, e.target.value)}
                placeholder={field.placeholder} rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"} />
            : field.type === "select"
            ? <select value={block.content[field.key]||field.options?.[0]} onChange={e => onChange(field.key, e.target.value)} style={inputStyle}>
                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            : field.type === "color"
            ? <div style={{ display: "flex", gap: 7 }}>
                <input type="color" value={block.content[field.key]||"#C9A84C"} onChange={e => onChange(field.key, e.target.value)} style={{ width: 34, height: 32, border: "none", borderRadius: 6, cursor: "pointer", padding: 0 }} />
                <input type="text" value={block.content[field.key]||""} onChange={e => onChange(field.key, e.target.value)} placeholder={field.placeholder} style={{ ...inputStyle, flex: 1 }} onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"} />
              </div>
            : <input type={field.type==="url" ? "url" : "text"} value={block.content[field.key]||""}
                onChange={e => onChange(field.key, e.target.value)}
                placeholder={field.placeholder} style={inputStyle}
                onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"} />}
          {field.hint && <p style={{ color: MUTED, fontSize: 9, margin: "3px 0 0" }}>{field.hint}</p>}
        </div>
      ))}
    </div>
  )
}

function ThemePanel({ theme, onThemeChange }: { theme: PageTheme; onThemeChange: (t: PageTheme) => void }) {
  const [themeTab, setThemeTab] = useState<"themes"|"colors"|"fonts"|"bg">("themes")
  const [bgMode, setBgMode] = useState<string>(theme.bgMode||"solid")
  const [bgSubTab, setBgSubTab] = useState<"type"|"effects"|"animation"|"presets"|"advanced">("presets")
  const [patternTypeLocal, setPatternType] = useState<string>((theme as any).bgPattern||"dots")
  const [effectNoise, setEffectNoise] = useState(false)
  const [effectGlow, setEffectGlow] = useState(false)
  const [effectVignette, setEffectVignette] = useState(false)
  const [animation, setAnimation] = useState<string>("none")
  const [copiedStyle, setCopiedStyle] = useState(false)

  const G = "#C9A84C"
  const MUTED = "#8A8478"

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: 8, padding: "8px 10px", color: "#F5F0E8", fontSize: 12,
    outline: "none", boxSizing: "border-box" as const, fontFamily: "monospace"
  }

  // 40+ presets
  const PRESETS = [
    // Business
    { name: "Executive Blue", group: "Business", bg: "#0A1628", primary: "#1E88E5", accent: "#42A5F5", text: "#F5F0E8", muted: "#8A9BA8", gradient: "linear-gradient(135deg,#0A1628 0%,#1A2A4A 100%)" },
    { name: "Corporate Black", group: "Business", bg: "#080808", primary: "#C9A84C", accent: "#39FF8F", text: "#F5F0E8", muted: "#8A8478", gradient: "linear-gradient(135deg,#080808 0%,#111111 100%)" },
    { name: "Premium Navy", group: "Business", bg: "#0D1B2A", primary: "#C9A84C", accent: "#E8C96A", text: "#F5F0E8", muted: "#7A8B9A", gradient: "linear-gradient(135deg,#0D1B2A 0%,#1A3050 100%)" },
    { name: "Midnight Gold", group: "Business", bg: "#080808", primary: "#C9A84C", accent: "#39FF8F", text: "#F5F0E8", muted: "#8A8478", gradient: "linear-gradient(135deg,#080808,#1a1a08)" },
    { name: "Boardroom", group: "Business", bg: "#1A1A1A", primary: "#E0E0E0", accent: "#C9A84C", text: "#F5F0E8", muted: "#888888", gradient: "linear-gradient(160deg,#1A1A1A,#2D2D2D)" },
    // Luxury
    { name: "Velvet Noir", group: "Luxury", bg: "#0D0A1A", primary: "#9B59B6", accent: "#E056FD", text: "#F5F0E8", muted: "#8A7A9A", gradient: "linear-gradient(135deg,#0D0A1A 0%,#1A0D2E 100%)" },
    { name: "Golden Luxury", group: "Luxury", bg: "#0A0800", primary: "#FFD700", accent: "#FFA500", text: "#F5EDD0", muted: "#9A8A70", gradient: "linear-gradient(135deg,#0A0800,#1A1200)" },
    { name: "Royal Purple", group: "Luxury", bg: "#0A0015", primary: "#8B00FF", accent: "#DA70D6", text: "#F5F0E8", muted: "#8A7A9A", gradient: "linear-gradient(135deg,#0A0015,#150020)" },
    { name: "Diamond White", group: "Luxury", bg: "#FAFAFA", primary: "#1A1A1A", accent: "#C9A84C", text: "#1A1A1A", muted: "#6B7280", gradient: "linear-gradient(135deg,#FAFAFA,#F0F0F5)" },
    { name: "Prestige", group: "Luxury", bg: "#0C0C0C", primary: "#C9A84C", accent: "#FFD700", text: "#F5EDD0", muted: "#8A8478", gradient: "linear-gradient(160deg,#0C0C0C,#1A1500)" },
    // SaaS
    { name: "Deep Space", group: "SaaS", bg: "#020B18", primary: "#00D4FF", accent: "#7B2FBE", text: "#F5F0E8", muted: "#8A9BA8", gradient: "linear-gradient(135deg,#020B18,#0A1628)" },
    { name: "Aurora", group: "SaaS", bg: "#0A0F1E", primary: "#00FF9D", accent: "#FF6B6B", text: "#F5F0E8", muted: "#8A8FA0", gradient: "linear-gradient(135deg,#0A0F1E,#0D1628)" },
    { name: "Ocean Tech", group: "SaaS", bg: "#050F1A", primary: "#00B4D8", accent: "#0096C7", text: "#F5F0E8", muted: "#6A8A9A", gradient: "linear-gradient(160deg,#050F1A,#0A1E2A)" },
    { name: "Matrix Code", group: "SaaS", bg: "#000D00", primary: "#00FF41", accent: "#00CC33", text: "#00FF41", muted: "#006B1A", gradient: "linear-gradient(180deg,#000D00,#001500)" },
    { name: "Future Grid", group: "SaaS", bg: "#08001A", primary: "#7B2FBE", accent: "#9B59B6", text: "#F5F0E8", muted: "#7A6A8A", gradient: "linear-gradient(135deg,#08001A,#100028)" },
    // Restaurant
    { name: "Wine Red", group: "Restaurant", bg: "#1A0008", primary: "#C0392B", accent: "#E74C3C", text: "#F5E8E0", muted: "#9A7A78", gradient: "linear-gradient(135deg,#1A0008,#2D0010)" },
    { name: "Sunset Fire", group: "Restaurant", bg: "#1A0500", primary: "#FF6B00", accent: "#FF8C00", text: "#F5E8D0", muted: "#9A7A5A", gradient: "linear-gradient(135deg,#1A0500,#2D0A00)" },
    { name: "Coffee House", group: "Restaurant", bg: "#1A0F0A", primary: "#8B4513", accent: "#D2691E", text: "#F5EDE0", muted: "#9A8A7A", gradient: "linear-gradient(135deg,#1A0F0A,#2D1A10)" },
    { name: "Olive Garden", group: "Restaurant", bg: "#0A0F05", primary: "#556B2F", accent: "#6B8E23", text: "#F5F0E8", muted: "#7A8A6A", gradient: "linear-gradient(135deg,#0A0F05,#141A08)" },
    { name: "Italian Night", group: "Restaurant", bg: "#0D0808", primary: "#8B0000", accent: "#C9A84C", text: "#F5E8D0", muted: "#9A8070", gradient: "linear-gradient(160deg,#0D0808,#1A0D0D)" },
    // Creator
    { name: "Neon Pink", group: "Creator", bg: "#0D0010", primary: "#FF0080", accent: "#FF69B4", text: "#F5F0E8", muted: "#8A7A8A", gradient: "linear-gradient(135deg,#0D0010,#180015)" },
    { name: "TikTok Vibes", group: "Creator", bg: "#010101", primary: "#FF0050", accent: "#00F2EA", text: "#F5F0E8", muted: "#888888", gradient: "linear-gradient(135deg,#010101,#0A000A)" },
    { name: "Cyber Purple", group: "Creator", bg: "#0A0015", primary: "#BF00FF", accent: "#7B2FBE", text: "#F5F0E8", muted: "#7A6A8A", gradient: "linear-gradient(135deg,#0A0015,#150020)" },
    { name: "Creator Blue", group: "Creator", bg: "#000A20", primary: "#0066FF", accent: "#4A90FF", text: "#F5F0E8", muted: "#6A7A9A", gradient: "linear-gradient(135deg,#000A20,#000F30)" },
    { name: "Electric Neon", group: "Creator", bg: "#050505", primary: "#39FF8F", accent: "#00FFFF", text: "#F5F0E8", muted: "#5A8A7A", gradient: "linear-gradient(135deg,#050505,#050F0A)" },
    // Minimal
    { name: "Pure White", group: "Minimal", bg: "#FFFFFF", primary: "#1A1A1A", accent: "#C9A84C", text: "#1A1A1A", muted: "#6B7280", gradient: "linear-gradient(135deg,#FFFFFF,#F8F8F8)" },
    { name: "Minimal Cream", group: "Minimal", bg: "#FAF7F2", primary: "#1A1A1A", accent: "#C9A84C", text: "#2D2D2D", muted: "#7A7060", gradient: "linear-gradient(135deg,#FAF7F2,#F0EDE8)" },
    { name: "Graphite", group: "Minimal", bg: "#1C1C1E", primary: "#AEAEB2", accent: "#C9A84C", text: "#F5F0E8", muted: "#8E8E93", gradient: "linear-gradient(135deg,#1C1C1E,#2C2C2E)" },
    { name: "Stone", group: "Minimal", bg: "#F5F5F0", primary: "#5A5A5A", accent: "#8A8478", text: "#2D2D2D", muted: "#8A8A8A", gradient: "linear-gradient(135deg,#F5F5F0,#EDEDEA)" },
    { name: "Soft Grey", group: "Minimal", bg: "#F0F0F0", primary: "#333333", accent: "#666666", text: "#1A1A1A", muted: "#888888", gradient: "linear-gradient(135deg,#F0F0F0,#E8E8E8)" },
    // Nature
    { name: "Forest Zen", group: "Nature", bg: "#0A1A0E", primary: "#2ECC71", accent: "#27AE60", text: "#F5F0E8", muted: "#6A8A6A", gradient: "linear-gradient(135deg,#0A1A0E,#0F2414)" },
    { name: "Emerald", group: "Nature", bg: "#022A22", primary: "#00A878", accent: "#00C896", text: "#F5F0E8", muted: "#5A8A7A", gradient: "linear-gradient(135deg,#022A22,#043830)" },
    { name: "Ocean Green", group: "Nature", bg: "#021A1A", primary: "#1ABC9C", accent: "#16A085", text: "#F5F0E8", muted: "#5A8A80", gradient: "linear-gradient(135deg,#021A1A,#042828)" },
    { name: "Arctic", group: "Nature", bg: "#E8F4F8", primary: "#2980B9", accent: "#3498DB", text: "#1A2A3A", muted: "#6A8A9A", gradient: "linear-gradient(135deg,#E8F4F8,#D8ECF8)" },
    { name: "Bamboo", group: "Nature", bg: "#F5F0E8", primary: "#4A7C3F", accent: "#6B9E5E", text: "#2D2D1A", muted: "#7A8A6A", gradient: "linear-gradient(135deg,#F5F0E8,#EDE8D8)" },
    // Event
    { name: "Festival Night", group: "Event", bg: "#050008", primary: "#FF6B35", accent: "#FF8C42", text: "#F5F0E8", muted: "#8A7A6A", gradient: "linear-gradient(135deg,#050008,#0A000F)" },
    { name: "Party Purple", group: "Event", bg: "#0A0015", primary: "#9B59B6", accent: "#8E44AD", text: "#F5F0E8", muted: "#7A6A8A", gradient: "linear-gradient(135deg,#0A0015,#150020)" },
    { name: "Celebration", group: "Event", bg: "#0A0500", primary: "#F39C12", accent: "#E67E22", text: "#F5EDD0", muted: "#9A8A6A", gradient: "linear-gradient(135deg,#0A0500,#150A00)" },
    { name: "Fireworks", group: "Event", bg: "#000008", primary: "#FF0000", accent: "#FFD700", text: "#F5F0E8", muted: "#8A8A8A", gradient: "linear-gradient(135deg,#000008,#050010)" },
    { name: "Spotlight", group: "Event", bg: "#080808", primary: "#FFFFFF", accent: "#C9A84C", text: "#F5F0E8", muted: "#8A8A8A", gradient: "linear-gradient(180deg,#1A1A1A,#080808)" },
  ]

  const PATTERNS_LIST = [
    { id: "dots", label: "Points", icon: "·" },
    { id: "grid", label: "Grille", icon: "#" },
    { id: "lines", label: "Lignes", icon: "═" },
    { id: "waves", label: "Vagues", icon: "～" },
    { id: "diagonals", label: "Diagonales", icon: "╱" },
    { id: "hexagons", label: "Hexagones", icon: "⬡" },
    { id: "squares", label: "Carrés", icon: "□" },
    { id: "circles", label: "Cercles", icon: "○" },
    { id: "zigzag", label: "Zigzag", icon: "∧" },
    { id: "stars", label: "Étoiles", icon: "✦" },
  ]

  const getPatternCSS = (pattern: string, color: string, size: number, opacity: number) => {
    const c = color + Math.round(opacity * 255).toString(16).padStart(2, "0")
    const s = size
    switch(pattern) {
      case "dots": return `radial-gradient(circle, ${c} 1px, transparent 1px)`
      case "grid": return `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`
      case "lines": return `linear-gradient(0deg, ${c} 1px, transparent 1px)`
      case "waves": return `radial-gradient(ellipse at 50% 50%, ${c} 0%, transparent 70%)`
      case "diagonals": return `linear-gradient(45deg, ${c} 1px, transparent 1px)`
      case "hexagons": return `radial-gradient(circle at 50% 50%, ${c} 2px, transparent 2px)`
      case "squares": return `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`
      case "circles": return `radial-gradient(circle, transparent ${s*0.3}px, ${c} ${s*0.3}px, ${c} ${s*0.35}px, transparent ${s*0.35}px)`
      case "zigzag": return `linear-gradient(135deg, ${c} 25%, transparent 25%), linear-gradient(225deg, ${c} 25%, transparent 25%)`
      case "stars": return `radial-gradient(circle, ${c} 1px, transparent 1px)`
      default: return `radial-gradient(circle, ${c} 1px, transparent 1px)`
    }
  }

  const presetGroups = Array.from(new Set(PRESETS.map(p => p.group)))
  const [activePresetGroup, setActivePresetGroup] = useState("Business")

  // Appliquer un preset complet
  const applyPreset = (preset: typeof PRESETS[0]) => {
    onThemeChange({
      ...theme,
      bg: preset.bg,
      bgGradient: preset.gradient,
      bgMode: "gradient",
      primary: preset.primary,
      accent: preset.accent,
      text: preset.text,
      muted: preset.muted,
      name: preset.name,
    } as any)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Onglets principaux */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", marginBottom: 14, flexShrink: 0 }}>
        {(["themes","colors","fonts","bg"] as const).map(tab => (
          <button key={tab} onClick={() => setThemeTab(tab)}
            style={{ flex: 1, padding: "10px 2px", background: "transparent", border: "none", borderBottom: `2px solid ${themeTab===tab ? G : "transparent"}`, color: themeTab===tab ? G : MUTED, fontSize: 11, fontWeight: themeTab===tab ? 700 : 400, cursor: "pointer" }}>
            {tab==="themes" ? "Thèmes" : tab==="colors" ? "Couleurs" : tab==="fonts" ? "Polices" : "Fond"}
          </button>
        ))}
      </div>

      {/* ── ONGLET THÈMES ── */}
      {themeTab==="themes" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          {Object.entries(PRESET_THEMES).map(([key, t]) => (
            <button key={key} onClick={() => onThemeChange(t)}
              style={{ background: t.bgGradient || t.bg, border: `2px solid ${theme.name===t.name ? G : "rgba(255,255,255,0.08)"}`, borderRadius: 12, padding: "10px 8px", cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                {[t.primary, t.accent, t.text].map((col, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: col, boxShadow: `0 0 4px ${col}60` }} />)}
              </div>
              <p style={{ color: t.text, fontSize: 10, fontWeight: 700, margin: 0, fontFamily: t.fontDisplay }}>{t.name}</p>
              {theme.name===t.name && <div style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, background: G, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={8} color="#000" /></div>}
            </button>
          ))}
        </div>
      )}

      {/* ── ONGLET COULEURS ── */}
      {themeTab==="colors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { key: "primary", label: "Couleur principale", hint: "Boutons, accents" },
            { key: "accent", label: "Couleur d accent", hint: "Hover, highlights" },
            { key: "bg", label: "Fond principal", hint: "" },
            { key: "text", label: "Texte principal", hint: "" },
            { key: "muted", label: "Texte secondaire", hint: "" },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4, fontWeight: 500 }}>{label}</label>
              {hint && <p style={{ color: MUTED, fontSize: 9, margin: "-2px 0 4px", opacity: 0.7 }}>{hint}</p>}
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={(theme as any)[key]||"#000000"} onChange={e => onThemeChange({...theme, [key]: e.target.value})}
                  style={{ width: 34, height: 32, border: "none", borderRadius: 6, cursor: "pointer", padding: 0, flexShrink: 0 }} />
                <input type="text" value={(theme as any)[key]||""} onChange={e => onThemeChange({...theme, [key]: e.target.value})}
                  style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ONGLET POLICES ── */}
      {themeTab==="fonts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {[
            { key: "fontDisplay", label: "Police titres" },
            { key: "fontBody", label: "Police corps" },
          ].map(({ key, label }) => (
            <div key={key}>
              <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 8, fontWeight: 500, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>{label}</label>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }} className="iphone-scroll">
                {GOOGLE_FONTS.map(f => (
                  <button key={f} onClick={() => onThemeChange({...theme, [key]: f})}
                    style={{ padding: "9px 12px", background: (theme as any)[key]===f ? G+"12" : "rgba(255,255,255,0.03)", border: `1px solid ${(theme as any)[key]===f ? G+"30" : "rgba(255,255,255,0.06)"}`, borderRadius: 8, color: (theme as any)[key]===f ? G : "#F5F0E8", fontSize: 14, cursor: "pointer", textAlign: "left", fontFamily: f, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {f}
                    {(theme as any)[key]===f && <Check size={11} color={G} />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── ONGLET FOND ── */}
      {themeTab==="bg" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {/* Sous-onglets Fond */}
          <div style={{ display: "flex", gap: 4, marginBottom: 14, flexWrap: "wrap" }}>
            {(["presets","type","effects","animation","advanced"] as const).map(sub => (
              <button key={sub} onClick={() => setBgSubTab(sub)}
                style={{ flex: 1, minWidth: 60, padding: "7px 4px", background: bgSubTab===sub ? G+"15" : "rgba(255,255,255,0.03)", border: `1px solid ${bgSubTab===sub ? G+"40" : "rgba(255,255,255,0.07)"}`, borderRadius: 8, color: bgSubTab===sub ? G : MUTED, fontSize: 10, fontWeight: bgSubTab===sub ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                {sub==="presets" ? "Presets" : sub==="type" ? "Type" : sub==="effects" ? "Effets" : sub==="animation" ? "Anim" : "Avancé"}
              </button>
            ))}
          </div>

          {/* PRESETS */}
          {bgSubTab==="presets" && (
            <div>
              {/* Groupes */}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
                {presetGroups.map(group => (
                  <button key={group} onClick={() => setActivePresetGroup(group)}
                    style={{ padding: "4px 10px", background: activePresetGroup===group ? G+"15" : "rgba(255,255,255,0.04)", border: `1px solid ${activePresetGroup===group ? G+"40" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, color: activePresetGroup===group ? G : MUTED, fontSize: 10, fontWeight: activePresetGroup===group ? 700 : 400, cursor: "pointer" }}>
                    {group}
                  </button>
                ))}
              </div>
              {/* Presets du groupe */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                {PRESETS.filter(p => p.group===activePresetGroup).map(preset => (
                  <button key={preset.name} onClick={() => applyPreset(preset)}
                    style={{ background: preset.gradient, border: `2px solid ${theme.name===preset.name ? G : "rgba(255,255,255,0.1)"}`, borderRadius: 12, padding: "12px 10px", cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden", minHeight: 70 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                      {[preset.primary, preset.accent, preset.text].map((col, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: col, boxShadow: `0 0 4px ${col}80` }} />)}
                    </div>
                    <p style={{ color: preset.text, fontSize: 10, fontWeight: 700, margin: 0, textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}>{preset.name}</p>
                    {theme.name===preset.name && <div style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, background: G, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={8} color="#000" /></div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TYPE DE FOND */}
          {bgSubTab==="type" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Type selector */}
              <div>
                <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 8, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>Type de fond</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>
                  {[
                    { id: "solid", label: "Uni", icon: "🎨" },
                    { id: "gradient", label: "Dégradé", icon: "🌈" },
                    { id: "mesh", label: "Mesh", icon: "✨" },
                    { id: "pattern", label: "Motif", icon: "▦" },
                    { id: "image", label: "Image", icon: "🖼️" },
                  ].map(({ id, label, icon }) => (
                    <button key={id} onClick={() => { setBgMode(id); onThemeChange({...theme, bgMode: id} as any) }}
                      style={{ background: bgMode===id ? G+"15" : "rgba(255,255,255,0.03)", border: `1.5px solid ${bgMode===id ? G+"50" : "rgba(255,255,255,0.08)"}`, borderRadius: 9, padding: "9px 5px", cursor: "pointer", color: bgMode===id ? G : MUTED, fontSize: 10, fontWeight: bgMode===id ? 700 : 400, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                      <span style={{ fontSize: 16 }}>{icon}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* UNI */}
              {bgMode==="solid" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ color: MUTED, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>Couleur de fond</label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input type="color" value={theme.bg} onChange={e => onThemeChange({...theme, bg: e.target.value})}
                      style={{ width: 44, height: 40, border: "none", borderRadius: 8, cursor: "pointer", padding: 0 }} />
                    <input type="text" value={theme.bg} onChange={e => onThemeChange({...theme, bg: e.target.value})} style={{ ...inputStyle, flex: 1 }} />
                  </div>
                </div>
              )}

              {/* DÉGRADÉ */}
              {bgMode==="gradient" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ color: MUTED, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>Dégradé linéaire</label>
                  <div style={{ height: 50, borderRadius: 10, background: theme.bgGradient||"linear-gradient(135deg,#080808,#1a1a08)", border: "1px solid rgba(255,255,255,0.1)" }} />
                  {[
                    { label: "Couleur 1", key: "grad_c1", default: "#080808" },
                    { label: "Couleur 2", key: "grad_c2", default: "#C9A84C" },
                    { label: "Couleur 3 (optionnel)", key: "grad_c3", default: "" },
                  ].map(({ label, key, default: def }) => (
                    <div key={key}>
                      <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>{label}</label>
                      <div style={{ display: "flex", gap: 7 }}>
                        <input type="color" value={(theme as any)[key]||def||"#080808"} onChange={e => {
                          const t2 = {...theme, [key]: e.target.value}
                          const c1 = (t2 as any).grad_c1||"#080808"
                          const c2 = (t2 as any).grad_c2||"#C9A84C"
                          const c3 = (t2 as any).grad_c3
                          const angle = (t2 as any).grad_angle||135
                          onThemeChange({...t2, bgGradient: `linear-gradient(${angle}deg,${c1},${c2}${c3?`,${c3}`:""})` } as any)
                        }} style={{ width: 34, height: 32, border: "none", borderRadius: 6, cursor: "pointer", padding: 0 }} />
                        <input type="text" value={(theme as any)[key]||""} onChange={e => onThemeChange({...theme, [key]: e.target.value} as any)}
                          placeholder={def} style={{ ...inputStyle, flex: 1 }} />
                      </div>
                    </div>
                  ))}
                  <div>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Angle: {(theme as any).grad_angle||135}°</label>
                    <input type="range" min="0" max="360" value={(theme as any).grad_angle||135}
                      onChange={e => {
                        const angle = parseInt(e.target.value)
                        const c1 = (theme as any).grad_c1||theme.bg||"#080808"
                        const c2 = (theme as any).grad_c2||"#C9A84C"
                        const c3 = (theme as any).grad_c3
                        onThemeChange({...theme, grad_angle: angle, bgGradient: `linear-gradient(${angle}deg,${c1},${c2}${c3?`,${c3}`:""})` } as any)
                      }}
                      style={{ width: "100%", accentColor: G }} />
                  </div>
                  <label style={{ color: MUTED, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1.5, marginTop: 4 }}>Presets rapides</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      "linear-gradient(135deg,#080808,#1a1a08)",
                      "linear-gradient(135deg,#020B18,#0A1628)",
                      "linear-gradient(135deg,#0D0A1A,#1A0D2E)",
                      "linear-gradient(135deg,#0A1A0E,#0F2414)",
                      "linear-gradient(135deg,#1A0A00,#2D1500)",
                      "linear-gradient(135deg,#FAFAFA,#F0F0F0)",
                      "linear-gradient(135deg,#0A0F1E,#1A0A28)",
                      "linear-gradient(160deg,#080808,#1A0010)",
                    ].map((g, i) => (
                      <button key={i} onClick={() => onThemeChange({...theme, bgGradient: g, bgMode: "gradient"} as any)}
                        style={{ height: 32, background: g, border: `2px solid ${theme.bgGradient===g ? G : "rgba(255,255,255,0.08)"}`, borderRadius: 8, cursor: "pointer", position: "relative" }}>
                        {theme.bgGradient===g && <Check size={11} color={G} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)" }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* MESH */}
              {bgMode==="mesh" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ color: MUTED, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>Dégradé Mesh</label>
                  <div style={{ height: 60, borderRadius: 10, background: `radial-gradient(ellipse at 0% 0%, ${(theme as any).mesh_c1||"#C9A84C"}80, transparent 50%), radial-gradient(ellipse at 100% 100%, ${(theme as any).mesh_c2||"#39FF8F"}80, transparent 50%), radial-gradient(ellipse at 100% 0%, ${(theme as any).mesh_c3||"#7B2FBE"}60, transparent 50%), ${theme.bg}`, border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, filter: `blur(${Math.round(((theme as any).mesh_blur||40)/5)}px)`, overflow: "hidden" }} />
                  {[
                    { label: "Couleur 1", key: "mesh_c1", default: "#C9A84C" },
                    { label: "Couleur 2", key: "mesh_c2", default: "#39FF8F" },
                    { label: "Couleur 3", key: "mesh_c3", default: "#7B2FBE" },
                  ].map(({ label, key, default: def }) => (
                    <div key={key} style={{ display: "flex", gap: 7, alignItems: "center" }}>
                      <input type="color" value={(theme as any)[key]||def} onChange={e => onThemeChange({...theme, [key]: e.target.value} as any)}
                        style={{ width: 34, height: 32, border: "none", borderRadius: 6, cursor: "pointer", padding: 0 }} />
                      <span style={{ color: MUTED, fontSize: 11 }}>{label}</span>
                    </div>
                  ))}
                  <div>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Flou: {(theme as any).mesh_blur||40}px</label>
                    <input type="range" min="0" max="100" value={(theme as any).mesh_blur||40}
                      onChange={e => onThemeChange({...theme, mesh_blur: parseInt(e.target.value)} as any)}
                      style={{ width: "100%", accentColor: G }} />
                  </div>
                </div>
              )}

              {/* MOTIF */}
              {bgMode==="pattern" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ color: MUTED, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>Motif</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5 }}>
                    {PATTERNS_LIST.map(p => (
                      <button key={p.id} onClick={() => setPatternType(p.id)}
                        style={{ padding: "8px 4px", background: patternType===p.id ? G+"15" : "rgba(255,255,255,0.03)", border: `1.5px solid ${patternType===p.id ? G+"50" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, cursor: "pointer", color: patternType===p.id ? G : MUTED, fontSize: 9, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                        <span style={{ fontSize: 16 }}>{p.icon}</span>
                        <span>{p.label}</span>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Taille: {(theme as any).pattern_size||20}px</label>
                    <input type="range" min="5" max="80" value={(theme as any).pattern_size||20} onChange={e => onThemeChange({...theme, pattern_size: parseInt(e.target.value)} as any)} style={{ width: "100%", accentColor: G }} />
                  </div>
                  <div>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Opacité: {Math.round(((theme as any).pattern_opacity||0.15)*100)}%</label>
                    <input type="range" min="1" max="100" value={Math.round(((theme as any).pattern_opacity||0.15)*100)} onChange={e => onThemeChange({...theme, pattern_opacity: parseInt(e.target.value)/100} as any)} style={{ width: "100%", accentColor: G }} />
                  </div>
                  <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                    <input type="color" value={(theme as any).pattern_color||"#C9A84C"} onChange={e => onThemeChange({...theme, pattern_color: e.target.value} as any)} style={{ width: 34, height: 32, border: "none", borderRadius: 6, cursor: "pointer", padding: 0 }} />
                    <span style={{ color: MUTED, fontSize: 11 }}>Couleur du motif</span>
                  </div>
                  <div style={{ height: 50, borderRadius: 8, background: theme.bg, backgroundImage: getPatternCSS(patternType, (theme as any).pattern_color||"#C9A84C", (theme as any).pattern_size||20, (theme as any).pattern_opacity||0.15), backgroundSize: `${(theme as any).pattern_size||20}px ${(theme as any).pattern_size||20}px`, border: "1px solid rgba(255,255,255,0.08)" }} />
                </div>
              )}

              {/* IMAGE */}
              {bgMode==="image" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ color: MUTED, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>Image de fond</label>
                  {/* Upload fichier */}
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, height: 48, background: "rgba(201,168,76,0.08)", border: "1.5px dashed rgba(201,168,76,0.3)", borderRadius: 10, cursor: "pointer", color: G, fontSize: 12, fontWeight: 600 }}>
                    <span>📁</span> Choisir une image
                    <input type="file" accept="image/*" style={{ display: "none" }} onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const reader = new FileReader()
                        reader.onload = ev => onThemeChange({...theme, bgImage: ev.target?.result as string, bgMode: "image"} as any)
                        reader.readAsDataURL(file)
                      }
                    }} />
                  </label>
                  {/* OU lien URL */}
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                    <span style={{ color: MUTED, fontSize: 10 }}>ou URL</span>
                    <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.1)" }} />
                  </div>
                  <input type="url" value={(theme as any).bgImage?.startsWith("data:") ? "" : (theme as any).bgImage||""} onChange={e => onThemeChange({...theme, bgImage: e.target.value} as any)}
                    placeholder="https://..." style={{ ...inputStyle }} />
                  {(theme as any).bgImage && (
                    <div style={{ position: "relative" }}>
                      <img src={(theme as any).bgImage} alt="" style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 8, display: "block" }} />
                      <button onClick={() => onThemeChange({...theme, bgImage: ""} as any)} style={{ position: "absolute", top: 4, right: 4, background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%", width: 22, height: 22, color: "#fff", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
                    </div>
                  )}
                  <div>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Taille</label>
                    <select value={(theme as any).bgImageSize||"cover"} onChange={e => onThemeChange({...theme, bgImageSize: e.target.value} as any)} style={{ ...inputStyle }}>
                      {["cover","contain","repeat","center"].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Overlay: {Math.round(((theme as any).bgOverlayOpacity||0.5)*100)}%</label>
                    <input type="range" min="0" max="100" value={Math.round(((theme as any).bgOverlayOpacity||0.5)*100)} onChange={e => onThemeChange({...theme, bgOverlayOpacity: parseInt(e.target.value)/100} as any)} style={{ width: "100%", accentColor: G }} />
                  </div>
                  <div>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Flou: {(theme as any).bgBlur||0}px</label>
                    <input type="range" min="0" max="20" value={(theme as any).bgBlur||0} onChange={e => onThemeChange({...theme, bgBlur: parseInt(e.target.value)} as any)} style={{ width: "100%", accentColor: G }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* EFFETS */}
          {bgSubTab==="effects" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Preview fond actuel avec effets */}
              <div style={{ position: "relative", height: 80, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 4 }}>
                <div style={{ position: "absolute", inset: 0, background: theme.bgGradient||theme.bg }} />
                {effectNoise && <div style={{ position: "absolute", inset: 0, background: "rgba(128,128,128,0.15)", opacity: 0.2, mixBlendMode: "overlay" as const }} />}
                {effectGlow && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${(theme as any).glow_color||G}${Math.round(((theme as any).glow_intensity||30)/100*255).toString(16).padStart(2,"0")}, transparent ${(theme as any).glow_size||200}px)` }} />}
                {effectVignette && <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at center, transparent ${100-(theme as any).vignette_intensity||60}%, rgba(0,0,0,0.8) 100%)` }} />}
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: 0, letterSpacing: 2, textTransform: "uppercase" as const }}>Aperçu des effets</p>
                </div>
              </div>
              {/* Noise */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: (theme as any).effect_noise ? 10 : 0 }}>
                  <label style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600 }}>🌫️ Noise</label>
                  <button onClick={() => onThemeChange({...theme, effect_noise: !(theme as any).effect_noise} as any)} style={{ width: 36, height: 20, borderRadius: 10, background: (theme as any).effect_noise ? G : "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: (theme as any).effect_noise ? 18 : 2, transition: "left 0.2s" }} />
                  </button>
                </div>
                {(theme as any).effect_noise && (
                  <div>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Opacité: {(theme as any).noise_opacity||20}%</label>
                    <input type="range" min="1" max="80" value={(theme as any).noise_opacity||20} onChange={e => onThemeChange({...theme, noise_opacity: parseInt(e.target.value)} as any)} style={{ width: "100%", accentColor: G }} />
                  </div>
                )}
              </div>

              {/* Glow */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: (theme as any).effect_glow ? 10 : 0 }}>
                  <label style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600 }}>✨ Glow</label>
                  <button onClick={() => onThemeChange({...theme, effect_glow: !(theme as any).effect_glow} as any)} style={{ width: 36, height: 20, borderRadius: 10, background: (theme as any).effect_glow ? G : "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: (theme as any).effect_glow ? 18 : 2, transition: "left 0.2s" }} />
                  </button>
                </div>
                {(theme as any).effect_glow && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ display: "flex", gap: 7, alignItems: "center" }}>
                      <input type="color" value={(theme as any).glow_color||G} onChange={e => onThemeChange({...theme, glow_color: e.target.value} as any)} style={{ width: 34, height: 32, border: "none", borderRadius: 6, cursor: "pointer", padding: 0 }} />
                      <span style={{ color: MUTED, fontSize: 11 }}>Couleur</span>
                    </div>
                    <div>
                      <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Intensité: {(theme as any).glow_intensity||30}%</label>
                      <input type="range" min="5" max="100" value={(theme as any).glow_intensity||30} onChange={e => onThemeChange({...theme, glow_intensity: parseInt(e.target.value)} as any)} style={{ width: "100%", accentColor: G }} />
                    </div>
                    <div>
                      <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Taille: {(theme as any).glow_size||200}px</label>
                      <input type="range" min="50" max="600" value={(theme as any).glow_size||200} onChange={e => onThemeChange({...theme, glow_size: parseInt(e.target.value)} as any)} style={{ width: "100%", accentColor: G }} />
                    </div>
                  </div>
                )}
              </div>

              {/* Vignette */}
              <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: (theme as any).effect_vignette ? 10 : 0 }}>
                  <label style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600 }}>🌑 Vignette</label>
                  <button onClick={() => onThemeChange({...theme, effect_vignette: !(theme as any).effect_vignette} as any)} style={{ width: 36, height: 20, borderRadius: 10, background: (theme as any).effect_vignette ? G : "rgba(255,255,255,0.15)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: (theme as any).effect_vignette ? 18 : 2, transition: "left 0.2s" }} />
                  </button>
                </div>
                {(theme as any).effect_vignette && (
                  <div>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Intensité: {(theme as any).vignette_intensity||40}%</label>
                    <input type="range" min="5" max="100" value={(theme as any).vignette_intensity||40} onChange={e => onThemeChange({...theme, vignette_intensity: parseInt(e.target.value)} as any)} style={{ width: "100%", accentColor: G }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ANIMATION */}
          {bgSubTab==="animation" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Preview animation */}
              <div style={{ position: "relative", height: 80, borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", marginBottom: 4 }}>
                <div style={{
                  position: "absolute", inset: 0,
                  background: animation==="aurora"
                    ? `radial-gradient(ellipse at 20% 50%, ${theme.primary}40, transparent 50%), radial-gradient(ellipse at 80% 20%, ${theme.accent||"#39FF8F"}30, transparent 50%), ${theme.bgGradient||theme.bg}`
                    : theme.bgGradient||theme.bg,
                  animation: animation==="gradient-flow" ? `gradientShift ${(theme as any).anim_speed||8}s ease infinite` : animation==="aurora" ? `auroraShift ${(theme as any).anim_speed||12}s ease infinite` : "none",
                  backgroundSize: "200% 200%",
                }} />
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, margin: 0, letterSpacing: 2, textTransform: "uppercase" as const }}>
                    {animation==="none" ? "Statique" : animation==="gradient-flow" ? "🌊 Gradient Flow" : animation==="aurora" ? "🌌 Aurora" : animation}
                  </p>
                </div>
              </div>
              <label style={{ color: MUTED, fontSize: 10, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>Animation de fond</label>
              {[
                { id: "none", label: "Statique", desc: "Aucune animation", icon: "⏸" },
                { id: "gradient-flow", label: "Gradient Flow", desc: "Dégradé animé lent", icon: "🌊" },
                { id: "aurora", label: "Aurora", desc: "Effet Stripe Aurora", icon: "🌌" },
                { id: "pulse", label: "Pulse", desc: "Pulsation douce", icon: "💫", soon: true },
                { id: "wave", label: "Wave", desc: "Vagues animées", icon: "〰", soon: true },
              ].map(({ id, label, desc, icon, soon }) => (
                <button key={id} onClick={() => { if (!soon) { setAnimation(id); onThemeChange({...theme, bgAnimation: id} as any) } }}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: animation===id ? G+"10" : "rgba(255,255,255,0.03)", border: `1.5px solid ${animation===id ? G+"40" : "rgba(255,255,255,0.07)"}`, borderRadius: 11, cursor: soon ? "not-allowed" : "pointer", opacity: soon ? 0.5 : 1 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <p style={{ color: animation===id ? G : "#F5F0E8", fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{label} {soon && <span style={{ color: MUTED, fontSize: 9, fontWeight: 400 }}>— Bientôt</span>}</p>
                    <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{desc}</p>
                  </div>
                  {animation===id && <Check size={13} color={G} style={{ flexShrink: 0 }} />}
                </button>
              ))}
              {animation==="gradient-flow" && (
                <div style={{ marginTop: 6 }}>
                  <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Vitesse: {(theme as any).anim_speed||8}s</label>
                  <input type="range" min="2" max="30" value={(theme as any).anim_speed||8} onChange={e => onThemeChange({...theme, anim_speed: parseInt(e.target.value)} as any)} style={{ width: "100%", accentColor: G }} />
                </div>
              )}
              {animation==="aurora" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 6 }}>
                  <div>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Vitesse: {(theme as any).anim_speed||12}s</label>
                    <input type="range" min="4" max="40" value={(theme as any).anim_speed||12} onChange={e => onThemeChange({...theme, anim_speed: parseInt(e.target.value)} as any)} style={{ width: "100%", accentColor: G }} />
                  </div>
                  <div>
                    <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 4 }}>Intensité: {(theme as any).anim_intensity||60}%</label>
                    <input type="range" min="10" max="100" value={(theme as any).anim_intensity||60} onChange={e => onThemeChange({...theme, anim_intensity: parseInt(e.target.value)} as any)} style={{ width: "100%", accentColor: G }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* AVANCÉ */}
          {bgSubTab==="advanced" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>CSS personnalisé</label>
                <textarea value={(theme as any).customCSS||""} onChange={e => onThemeChange({...theme, bgGradient: e.target.value, customCSS: e.target.value} as any)}
                  placeholder={"linear-gradient(135deg, #080808, #1a1a08)\n\n/* Ou tout CSS valide pour 'background' */"}
                  rows={5}
                  style={{ ...inputStyle, resize: "vertical" as const, lineHeight: 1.6 }} />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => {
                  const style = { bg: theme.bg, bgGradient: theme.bgGradient, bgMode: (theme as any).bgMode, bgImage: (theme as any).bgImage }
                  navigator.clipboard.writeText(JSON.stringify(style, null, 2))
                  setCopiedStyle(true)
                  setTimeout(() => setCopiedStyle(false), 2000)
                }} style={{ flex: 1, background: copiedStyle ? "#39FF8F20" : "rgba(255,255,255,0.05)", border: `1px solid ${copiedStyle ? "#39FF8F40" : "rgba(255,255,255,0.1)"}`, borderRadius: 9, padding: "10px", color: copiedStyle ? "#39FF8F" : MUTED, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  {copiedStyle ? "✓ Copié !" : "📋 Copier le style"}
                </button>
                <button onClick={() => {
                  const input = prompt("Collez le JSON du style:")
                  if (input) {
                    try {
                      const parsed = JSON.parse(input)
                      onThemeChange({...theme, ...parsed} as any)
                    } catch { alert("JSON invalide") }
                  }
                }} style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "10px", color: MUTED, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                  📥 Importer
                </button>
              </div>
              <button onClick={() => {
                const exportData = {
                  background: { bg: theme.bg, bgGradient: theme.bgGradient, bgMode: (theme as any).bgMode, bgImage: (theme as any).bgImage },
                  effects: { noise: (theme as any).noise_opacity, glow: (theme as any).glow_color, vignette: (theme as any).vignette_intensity },
                  animation: { type: (theme as any).bgAnimation, speed: (theme as any).anim_speed }
                }
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" })
                const url = URL.createObjectURL(blob)
                const a = document.createElement("a"); a.href = url; a.download = "qrfolio-style.json"; a.click()
              }} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 9, padding: "10px", color: G, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                📤 Exporter le style complet
              </button>
              {/* Aperçu fond actuel */}
              <div>
                <label style={{ color: MUTED, fontSize: 10, display: "block", marginBottom: 6 }}>Aperçu fond actuel</label>
                <div style={{ height: 60, borderRadius: 10, background: theme.bgGradient || theme.bg, backgroundImage: (theme as any).bgMode==="pattern" ? getPatternCSS(patternType, (theme as any).pattern_color||G, (theme as any).pattern_size||20, (theme as any).pattern_opacity||0.15) : undefined, backgroundSize: (theme as any).bgMode==="pattern" ? `${(theme as any).pattern_size||20}px ${(theme as any).pattern_size||20}px` : undefined, border: "1px solid rgba(255,255,255,0.1)" }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



export default function BuilderV4({ pageId }: { pageId?: string }) {
  const undoRedo = useUndoRedo([
    { id: "1", type: "profile", content: { name: "Mon Nom", tagline: "Mon activité" }, visible: true },
    { id: "2", type: "bio", content: { text: "Bienvenue sur ma page !" }, visible: true },
    { id: "3", type: "cta_button", content: { label: "Me contacter", url: "#", style: "gold" }, visible: true },
  ])
  const [blocks, setBlocksRaw] = useState<Block[]>([
    { id: "1", type: "profile", content: { name: "Mon Nom", tagline: "Mon activité" }, visible: true },
    { id: "2", type: "bio", content: { text: "Bienvenue sur ma page !" }, visible: true },
    { id: "3", type: "cta_button", content: { label: "Me contacter", url: "#", style: "gold" }, visible: true },
  ])

  // setBlocks avec push historique automatique
  const setBlocks = useCallback((updater: Block[] | ((prev: Block[]) => Block[]), skipHistory = false) => {
    setBlocksRaw(prev => {
      const next = typeof updater === "function" ? updater(prev) : updater
      if (!skipHistory) undoRedo.push(next)
      return next
    })
  }, [undoRedo])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pageName, setPageName] = useState("Ma Page")
  const [pageSlug, setPageSlug] = useState("ma-page")
  const [pageStatus, setPageStatus] = useState("draft")
  const [theme, setTheme] = useState<PageTheme>(PRESET_THEMES.midnight_gold)
  const [rightTab, setRightTab] = useState<"preview"|"edit"|"theme">("preview")
  const [activeCategory, setActiveCategory] = useState("identity")
  const [search, setSearch] = useState("")
  const [dayMode, setDayMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPublishPopup, setShowPublishPopup] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [qrShortCode, setQrShortCode] = useState("")
  const [showQrPanel, setShowQrPanel] = useState(false)
  const [pageStats, setPageStats] = useState({ views: 0, scans: 0 })
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Salut ! 👋 Décris ton activité et je construis ta page." }])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>()

  // ── États collapse panneaux ────────────────────────────────────────────────
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("qrfolio_sidebar_collapsed") === "true"
    return false
  })
  const [blocksCollapsed, setBlocksCollapsed] = useState(() => {
    if (typeof window !== "undefined") return localStorage.getItem("qrfolio_blocks_collapsed") === "true"
    return false
  })
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [drawerCategory, setDrawerCategory] = useState<string|null>(null)
  const drawerRef = useRef<HTMLDivElement>(null)

  // Persister collapse sidebar
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("qrfolio_sidebar_collapsed", String(sidebarCollapsed))
  }, [sidebarCollapsed])

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("qrfolio_blocks_collapsed", String(blocksCollapsed))
  }, [blocksCollapsed])

  // ── Raccourcis clavier ────────────────────────────────────────────────────
  useEffect(() => {
    const isEditing = (e: KeyboardEvent) =>
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement ||
      e.target instanceof HTMLSelectElement ||
      (e.target as HTMLElement)?.isContentEditable

    const handler = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey // Ctrl Windows / Cmd Mac

      // Ctrl+Z — Undo
      if (ctrl && !e.shiftKey && (e.key === "z" || e.key === "Z") && !isEditing(e)) {
        e.preventDefault()
        const prev = undoRedo.undo()
        if (prev) setBlocksRaw(prev)
        return
      }
      // Ctrl+Shift+Z / Ctrl+Y — Redo
      if (ctrl && (e.shiftKey && (e.key === "z" || e.key === "Z") || e.key === "y" || e.key === "Y") && !isEditing(e)) {
        e.preventDefault()
        const next = undoRedo.redo()
        if (next) setBlocksRaw(next)
        return
      }

      // Ctrl+B — Bibliothèque de blocs
      if (ctrl && (e.key === "b" || e.key === "B") && !isEditing(e)) {
        e.preventDefault()
        setBlocksCollapsed(p => !p)
        setFocusMode(false)
        return
      }
      // Ctrl+E — Éditeur (panel droit)
      if (ctrl && (e.key === "e" || e.key === "E") && !isEditing(e)) {
        e.preventDefault()
        setRightCollapsed(p => !p)
        setFocusMode(false)
        return
      }
      // Ctrl+P — Preview (switch onglet)
      if (ctrl && (e.key === "p" || e.key === "P") && !isEditing(e)) {
        e.preventDefault()
        setRightCollapsed(false)
        setRightTab("preview")
        return
      }
      // Ctrl+F — Mode Focus
      if (ctrl && (e.key === "f" || e.key === "F") && !isEditing(e)) {
        e.preventDefault()
        setFocusMode(prev => {
          const next = !prev
          setSidebarCollapsed(next)
          setBlocksCollapsed(next)
          setRightCollapsed(next)
          return next
        })
        return
      }
      // F seul — Mode Focus (fallback sans modificateur)
      if (!ctrl && !e.shiftKey && !e.altKey && (e.key === "f" || e.key === "F") && !isEditing(e)) {
        setFocusMode(prev => {
          const next = !prev
          setSidebarCollapsed(next)
          setBlocksCollapsed(next)
          setRightCollapsed(next)
          return next
        })
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  // Fermer drawer au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) setDrawerCategory(null)
    }
    if (drawerCategory) document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [drawerCategory])

  function toggleSidebar() { setSidebarCollapsed(p => !p); setFocusMode(false) }
  function toggleBlocks() { setBlocksCollapsed(p => !p); setFocusMode(false) }
  function toggleRight() { setRightCollapsed(p => !p); setFocusMode(false) }

  // ── Resize panneaux ────────────────────────────────────────────────────
  const blocksResize = useResize("blocks", 230, 180, 480)
  const rightResize = useResize("right", 340, 280, 520)

  // ── Favoris ───────────────────────────────────────────────────────────────
  const [favorites, setFavorites] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("qrfolio_fav_blocks") || "[]") } catch { return [] }
    }
    return []
  })

  const toggleFav = useCallback((type: string) => {
    setFavorites(prev => {
      const next = prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
      localStorage.setItem("qrfolio_fav_blocks", JSON.stringify(next))
      return next
    })
  }, [])

  const isFav = useCallback((type: string) => favorites.includes(type), [favorites])

  // ── Blocs récents ─────────────────────────────────────────────────────────
  const [recentBlocks, setRecentBlocks] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("qrfolio_recent_blocks") || "[]") } catch { return [] }
    }
    return []
  })

  const pushRecent = useCallback((type: string) => {
    setRecentBlocks(prev => {
      const next = [type, ...prev.filter(t => t !== type)].slice(0, 8)
      localStorage.setItem("qrfolio_recent_blocks", JSON.stringify(next))
      return next
    })
  }, [])
  function toggleFocus() {
    setFocusMode(p => {
      const next = !p
      setSidebarCollapsed(next); setBlocksCollapsed(next); setRightCollapsed(next)
      return next
    })
  }

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  useEffect(() => {
    const fonts = [theme.fontDisplay, theme.fontBody].filter(Boolean).map(f => f.replace(/ /g,"+")).join("&family=")
    const link = document.createElement("link"); link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?family=${fonts}&display=swap`
    document.head.appendChild(link)
  }, [theme.fontDisplay, theme.fontBody])

  useEffect(() => {
    if (!pageId) return
    const supabase = createClient()
    async function load() {
      const { data: pg } = await supabase.from("pages").select("title,slug,status,theme,total_views").eq("id", pageId).single()
      if (pg) { setPageName(pg.title); setPageSlug(pg.slug); setPageStatus(pg.status||"draft"); if (pg.theme) setTheme(pg.theme as PageTheme); setPageStats(s => ({ ...s, views: pg.total_views||0 })) }
      const { data: blks } = await supabase.from("blocks").select("*").eq("page_id", pageId).order("position")
      if (blks?.length) {
          const loaded = blks.map(b => ({ id: b.id, type: b.type, content: b.content||{}, visible: b.is_visible!==false, draft: b.is_draft||false, locked: b.is_locked||false }))
          setBlocksRaw(loaded)
          undoRedo.push(loaded)
        }
      const { data: qr } = await supabase.from("qr_codes").select("short_code,total_scans").eq("page_id", pageId).single()
      if (qr) {
        setQrShortCode(qr.short_code||"")
        const appUrl = typeof window !== "undefined" ? window.location.origin : ""
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl+"/q/"+qr.short_code)}&color=C9A84C&bgcolor=080808&margin=10`)
        setPageStats(s => ({ ...s, scans: qr.total_scans||0 }))
      }
    }
    load()
  }, [pageId])

  useEffect(() => {
    if (!pageId) return
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      const supabase = createClient()
      await supabase.from("pages").update({ title: pageName, theme }).eq("id", pageId)
      await supabase.from("blocks").delete().eq("page_id", pageId)
      if (blocks.length > 0) await supabase.from("blocks").insert(blocks.map((b, i) => ({ page_id: pageId, type: b.type, position: i, content: b.content, is_visible: b.visible && !b.draft, is_draft: b.draft || false, is_locked: b.locked || false, styles: {} })))
      setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
    }, 800)
  }, [blocks, pageName, theme, pageId])

  async function handlePublish() {
    if (!pageId) return
    setPublishing(true)
    await createClient().from("pages").update({ status: "published", published_at: new Date().toISOString() }).eq("id", pageId)
    setPageStatus("published"); setPublishing(false); setShowPublishPopup(false)
  }

  function addBlock(type: string, content?: BlockContent) {
    const def = BLOCK_DEFS[type]; if (!def) return
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    setBlocks(p => [...p, { id, type, content: content||{...def.defaultContent}, visible: true }])
    setSelectedId(id); setRightTab("edit")
    pushRecent(type)
  }

  function deleteBlock(id: string) {
    if (blocks.find(b => b.id === id)?.locked) return
    setBlocks(p => p.filter(b => b.id !== id))
    if (selectedId === id) { setSelectedId(null); setRightTab("preview") }
  }

  function duplicateBlock(id: string) {
    const block = blocks.find(b => b.id === id); if (!block) return
    const newId = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const idx = blocks.findIndex(b => b.id === id)
    setBlocks(p => [...p.slice(0, idx+1), { ...block, id: newId, content: {...block.content} }, ...p.slice(idx+1)])
    setSelectedId(newId)
  }

  function toggleVisible(id: string) { setBlocks(p => p.map(b => b.id===id ? {...b, visible: !b.visible} : b)) }
  function toggleDraft(id: string) { setBlocks(p => p.map(b => b.id===id ? {...b, draft: !b.draft} : b)) }
  function toggleLock(id: string) { setBlocks(p => p.map(b => b.id===id ? {...b, locked: !b.locked} : b)) }

  function moveBlock(id: string, dir: number) {
    const block = blocks.find(b => b.id === id)
    if (block?.locked) return // Bloc verrouillé — déplacement interdit
    const idx = blocks.findIndex(b => b.id === id)
    const ni = idx + dir; if (ni < 0 || ni >= blocks.length) return
    setBlocks(p => { const n = [...p]; [n[idx], n[ni]] = [n[ni], n[idx]]; return n })
  }

  // ── FIX CRITIQUE: updateBlock immédiat + EditPanel key ────────────────────
  function updateBlock(id: string, key: string, value: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: { ...b.content, [key]: value } } : b))
  }

  async function sendAI(prompt?: string) {
    const msg = (prompt || aiInput).trim(); if (!msg || aiLoading) return
    setAiInput("")
    setMessages(p => [...p, { role: "user", content: msg }])
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages, { role: "user", content: msg }] }) })
      const data = await res.json()
      const reply = data.content?.[0]?.text || "Erreur."
      let added = 0
      reply.split("\n").forEach((line: string) => {
        if (line.startsWith("ADD_BLOCK:")) { try { const j = JSON.parse(line.replace("ADD_BLOCK:","").trim()); addBlock(j.type, j.content); added++ } catch {} }
      })
      const clean = reply.split("\n").filter((l: string) => !l.startsWith("ADD_BLOCK:")).join("\n").trim()
      setMessages(p => [...p, { role: "assistant", content: clean + (added>0 ? `\n\n✅ ${added} bloc${added>1?"s":""} ajouté${added>1?"s":""}!` : "") }])
    } catch { setMessages(p => [...p, { role: "assistant", content: "Erreur de connexion." }]) }
    setAiLoading(false)
  }

  // ── Synonymes et recherche enrichie ───────────────────────────────────────
  const SYNONYMS: Record<string, string[]> = {
    "téléphone": ["appel","phone","tel","call"],
    "mail": ["email","courriel","message","@"],
    "maps": ["adresse","localisation","lieu","carte","direction","itinéraire"],
    "avis": ["témoignage","review","note","étoile","recommandation","client"],
    "musique": ["spotify","deezer","apple music","soundcloud","chanson","album","playlist","artiste"],
    "restaurant": ["menu","carte","réservation","plat","cuisine","table"],
    "vente": ["produit","tarif","prix","service","boutique","achat","paiement"],
    "photo": ["image","galerie","picture","visuel","cover","bannière"],
    "vidéo": ["youtube","tiktok","clip","stream","twitch","live","vimeo"],
    "réseau": ["instagram","facebook","twitter","linkedin","snapchat","social"],
    "événement": ["concert","festival","soirée","date","billet","ticket"],
    "contact": ["formulaire","email","téléphone","whatsapp","message"],
    "lien": ["bouton","cta","url","action","click"],
    "profil": ["bio","présentation","avatar","identité","nom"],
    "podcast": ["audio","son","écoute","radio","épisode"],
    "stats": ["statistique","chiffre","nombre","compteur"],
    "qr": ["qr code","scan","flash"],
  }

  function searchScore(type: string, def: {label:string;description:string;category:string}, q: string): number {
    const query = q.toLowerCase().trim()
    if (!query) return 0
    const label = def.label.toLowerCase()
    const desc = def.description.toLowerCase()
    const cat = def.category.toLowerCase()
    if (label === query) return 100
    if (label.startsWith(query)) return 90
    if (label.includes(query)) return 80
    if (desc.includes(query)) return 60
    if (type.toLowerCase().includes(query)) return 50
    if (cat.includes(query)) return 40
    for (const [syn, aliases] of Object.entries(SYNONYMS)) {
      const allTerms = [syn, ...aliases]
      if (allTerms.some(t => query.includes(t) || t.includes(query))) {
        if (allTerms.some(t => label.includes(t))) return 35
        if (allTerms.some(t => desc.includes(t))) return 25
      }
    }
    return 0
  }

  const filteredBlocks = (() => {
    if (!search) {
      if (activeCategory === "recents") {
        return recentBlocks
          .filter(type => BLOCK_DEFS[type])
          .map(type => [type, BLOCK_DEFS[type]] as [string, (typeof BLOCK_DEFS)[string]])
      }
      if (activeCategory === "favorites") {
        return Object.entries(BLOCK_DEFS).filter(([type]) => favorites.includes(type))
      }
      return Object.entries(BLOCK_DEFS).filter(([, def]) => def.category === activeCategory)
    }
    return Object.entries(BLOCK_DEFS)
      .map(([type, def]) => ({ type, def, score: searchScore(type, def, search) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ type, def }) => [type, def] as [string, (typeof BLOCK_DEFS)[string]])
  })()

  const groupedResults = search
    ? BLOCK_CATEGORIES.map(cat => ({
        cat,
        blocks: filteredBlocks.filter(([, def]) => def.category === cat.id)
      })).filter(({ blocks }) => blocks.length > 0)
    : null

  function hlText(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text
    const lo = text.toLowerCase()
    const idx = lo.indexOf(query.toLowerCase())
    if (idx === -1) return text
    return <>{text.slice(0, idx)}<mark style={{ background: "rgba(201,168,76,0.25)", color: "#F5F0E8", borderRadius: 2, padding: "0 1px" }}>{text.slice(idx, idx + query.length)}</mark>{text.slice(idx + query.length)}</>
  }

  // selectedBlock recalculé depuis blocks à chaque render — garantit fraîcheur
  const selectedBlock = blocks.find(b => b.id === selectedId)

  // Fond du thème appliqué partout
  function bgStyle(): React.CSSProperties {
    if (dayMode) return { background: "#FAFAFA" }
    const t = theme as any
    let base: React.CSSProperties = {}

    if (t.bgMode === "pattern") {
      const patSize = t.pattern_size || 20
      const patOpacity = t.pattern_opacity || 0.15
      const patColor = t.pattern_color || "#C9A84C"
      const alpha = Math.round(patOpacity * 255).toString(16).padStart(2, "0")
      const c = patColor + alpha
      let bgImg = ""
      switch(t.bgPattern || patternType || "dots") {
        case "dots": bgImg = `radial-gradient(circle, ${c} 1px, transparent 1px)`; break
        case "grid": bgImg = `linear-gradient(${c} 1px, transparent 1px), linear-gradient(90deg, ${c} 1px, transparent 1px)`; break
        case "lines": bgImg = `linear-gradient(0deg, ${c} 1px, transparent 1px)`; break
        case "diagonals": bgImg = `linear-gradient(45deg, ${c} 1px, transparent 1px)`; break
        case "hexagons": bgImg = `radial-gradient(circle, ${c} 2px, transparent 2px)`; break
        case "circles": bgImg = `radial-gradient(circle, transparent ${patSize*0.3}px, ${c} ${patSize*0.3}px, ${c} ${patSize*0.32}px, transparent ${patSize*0.32}px)`; break
        case "zigzag": bgImg = `linear-gradient(135deg, ${c} 25%, transparent 25%), linear-gradient(225deg, ${c} 25%, transparent 25%)`; break
        default: bgImg = `radial-gradient(circle, ${c} 1px, transparent 1px)`
      }
      base = { background: theme.bg, backgroundImage: bgImg, backgroundSize: `${patSize}px ${patSize}px` }
    } else if (t.bgMode === "mesh") {
      const c1 = t.mesh_c1 || "#C9A84C"; const c2 = t.mesh_c2 || "#39FF8F"; const c3 = t.mesh_c3 || "#7B2FBE"
      const blurPx = Math.round((t.mesh_blur||40)/3)
      base = {
        background: `radial-gradient(ellipse at 10% 20%, ${c1}90, transparent 55%), radial-gradient(ellipse at 90% 80%, ${c2}90, transparent 55%), radial-gradient(ellipse at 80% 10%, ${c3}70, transparent 55%), ${theme.bg}`,
        ...(blurPx > 0 ? { backdropFilter: `blur(${blurPx}px)` } : {})
      }
    } else if (t.bgMode === "image" && t.bgImage) {
      base = {
        backgroundImage: `url(${t.bgImage})`,
        backgroundSize: t.bgImageSize || "cover",
        backgroundPosition: "center",
        ...(t.bgBlur > 0 ? { filter: `blur(${t.bgBlur}px)` } : {})
      }
    } else {
      const animStyle: React.CSSProperties = t.bgAnimation === "gradient-flow"
        ? { backgroundSize: "400% 400%", animation: `gradientShift ${t.anim_speed||8}s ease infinite` }
        : t.bgAnimation === "aurora"
        ? { backgroundSize: "300% 300%", animation: `auroraShift ${t.anim_speed||12}s ease infinite` }
        : {}
      base = { background: theme.bgGradient || theme.bg, ...animStyle }
    }
    return base
  }

  return (
    <div style={{ height: "100vh", background: "#080808", display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif", color: "#F5F0E8", overflow: "hidden" }}>

      {/* TOPBAR */}
      <div style={{ height: 50, background: "#0D0D0D", borderBottom: "1px solid rgba(201,168,76,0.12)", display: "flex", alignItems: "center", padding: "0 14px", gap: 10, flexShrink: 0, zIndex: 20 }}>
        <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 4, textDecoration: "none", color: G, fontFamily: "Cormorant Garamond, serif", fontSize: 16, fontWeight: 700 }}>← QRfolio</a>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
        <input value={pageName} onChange={e => setPageName(e.target.value)} style={{ background: "transparent", border: "none", color: "#F5F0E8", fontSize: 13, fontWeight: 600, outline: "none", width: 160 }} />
        {saving && <span style={{ color: MUTED, fontSize: 10 }}>Enregistrement...</span>}
        {saved && <span style={{ color: "#39FF8F", fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}><Check size={10} /> Enregistré</span>}
        {!pageId && <span style={{ color: "#4A4640", fontSize: 9 }}>Mode démo</span>}
        <div style={{ flex: 1 }} />

        {/* Boutons Undo / Redo */}
        <div style={{ display: "flex", gap: 3 }}>
          <button onClick={() => { const p = undoRedo.undo(); if(p) setBlocksRaw(p) }}
            disabled={!undoRedo.canUndo()}
            title="Annuler — Ctrl+Z"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, cursor: undoRedo.canUndo() ? "pointer" : "default", color: undoRedo.canUndo() ? "#F5F0E8" : "rgba(255,255,255,0.2)", fontSize: 13, transition: "all 0.15s" }}
            onMouseEnter={e => { if(undoRedo.canUndo()) { e.currentTarget.style.background="rgba(201,168,76,0.1)"; e.currentTarget.style.borderColor="rgba(201,168,76,0.3)" }}}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.08)" }}>
            ↩
          </button>
          <button onClick={() => { const n = undoRedo.redo(); if(n) setBlocksRaw(n) }}
            disabled={!undoRedo.canRedo()}
            title="Rétablir — Ctrl+Shift+Z"
            style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, cursor: undoRedo.canRedo() ? "pointer" : "default", color: undoRedo.canRedo() ? "#F5F0E8" : "rgba(255,255,255,0.2)", fontSize: 13, transition: "all 0.15s" }}
            onMouseEnter={e => { if(undoRedo.canRedo()) { e.currentTarget.style.background="rgba(201,168,76,0.1)"; e.currentTarget.style.borderColor="rgba(201,168,76,0.3)" }}}
            onMouseLeave={e => { e.currentTarget.style.background="rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor="rgba(255,255,255,0.08)" }}>
            ↪
          </button>
        </div>

        {/* Bouton Focus Mode */}
        <button onClick={toggleFocus} title="Mode Focus — Ctrl+F"
          style={{ display: "flex", alignItems: "center", gap: 5, background: focusMode ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${focusMode ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 7, padding: "5px 10px", color: focusMode ? G : MUTED, fontSize: 10, fontWeight: focusMode ? 700 : 400, cursor: "pointer" }}>
          {focusMode ? "⊞" : "⊡"} Focus
        </button>

        {/* Raccourcis clavier — tooltip */}
        <div style={{ position: "relative" }}>
          <button
            style={{ width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, cursor: "pointer", color: MUTED, fontSize: 11, fontWeight: 700 }}
            title="Raccourcis clavier"
            onMouseEnter={e => { const t = e.currentTarget.nextElementSibling as HTMLElement; if(t) t.style.opacity = "1"; if(t) t.style.pointerEvents = "none" }}
            onMouseLeave={e => { const t = e.currentTarget.nextElementSibling as HTMLElement; if(t) t.style.opacity = "0" }}>
            ?
          </button>
          <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#161616", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, padding: "12px 14px", zIndex: 200, opacity: 0, transition: "opacity 0.15s", pointerEvents: "none", minWidth: 200, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
            <p style={{ color: MUTED, fontSize: 9, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>Raccourcis</p>
            {[
              ["Ctrl+B", "Bibliothèque"],
              ["Ctrl+E", "Éditeur"],
              ["Ctrl+P", "Preview"],
              ["Ctrl+F", "Mode Focus"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ color: MUTED, fontSize: 11 }}>{v}</span>
                <kbd style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 5, padding: "2px 7px", color: G, fontSize: 10, fontFamily: "monospace", fontWeight: 700 }}>{k}</kbd>
              </div>
            ))}
          </div>
        </div>

        <button onClick={() => setRightTab(t => t==="theme" ? "preview" : "theme")} style={{ display: "flex", alignItems: "center", gap: 5, background: rightTab==="theme" ? "rgba(201,168,76,0.12)" : "transparent", border: `1px solid ${rightTab==="theme" ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.2)"}`, borderRadius: 7, padding: "5px 11px", color: rightTab==="theme" ? G : MUTED, fontSize: 11, cursor: "pointer" }}>
          <Palette size={11} /> Thème
        </button>

        {qrCodeUrl && (
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowQrPanel(p => !p)} style={{ display: "flex", alignItems: "center", gap: 5, background: showQrPanel ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.06)", border: `1px solid ${showQrPanel ? "rgba(201,168,76,0.4)" : "rgba(201,168,76,0.2)"}`, borderRadius: 8, padding: "5px 11px", color: G, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
              <QrCode size={11} /> QR Code
            </button>
            {showQrPanel && (
              <>
                <div onClick={() => setShowQrPanel(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#161616", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 16, padding: "18px", zIndex: 200, boxShadow: "0 8px 40px rgba(0,0,0,0.6)", width: 200 }}>
                  <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 700, margin: "0 0 10px", textAlign: "center" }}>Mon QR Code</p>
                  <div style={{ background: "#FFFFFF", borderRadius: 10, padding: 8, marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <img src={qrCodeUrl} alt="QR" style={{ width: 120, height: 120, imageRendering: "pixelated", display: "block" }} />
                  </div>
                  <div style={{ background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 7, padding: "6px 9px", marginBottom: 8 }}>
                    <p style={{ color: MUTED, fontSize: 8, margin: "0 0 1px", textTransform: "uppercase", letterSpacing: 1 }}>URL de scan</p>
                    <p style={{ color: G, fontSize: 10, margin: 0, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/q/{qrShortCode}</p>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    <a href={qrCodeUrl} download="qrcode.png" style={{ flex: 1, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 7, padding: "7px", color: G, textDecoration: "none", fontSize: 10, fontWeight: 600, textAlign: "center" }}>↓ PNG</a>
                    <a href="/dashboard/qr-codes" style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "7px", color: MUTED, textDecoration: "none", fontSize: 10, textAlign: "center" }}>Perso →</a>
                  </div>
                </div>
              </>
            )}
          </div>
        )}



        {pageId && pageSlug && (
          <a href={`/${pageSlug}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 7, padding: "5px 11px", color: G, textDecoration: "none", fontSize: 11, fontWeight: 600 }}>
            <ExternalLink size={11} /> Voir en direct
          </a>
        )}

        <div style={{ position: "relative" }}>
          <button onClick={() => setShowPublishPopup(p => !p)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: pageStatus==="published" ? "rgba(57,255,143,0.12)" : `linear-gradient(90deg,${G},#b8953f)`, border: pageStatus==="published" ? "1px solid rgba(57,255,143,0.35)" : "none", borderRadius: 9, padding: "8px 18px", color: pageStatus==="published" ? "#39FF8F" : "#080808", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: pageStatus==="published" ? "none" : `0 4px 16px rgba(201,168,76,0.3)` }}>
            {pageStatus==="published" ? <><Check size={13} /> Publié</> : "Publier"}
          </button>
          {showPublishPopup && (
            <>
              <div onClick={() => setShowPublishPopup(false)} style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
              <div style={{ position: "absolute", top: "calc(100% + 12px)", right: 0, background: "#0F0F0F", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "24px", zIndex: 200, boxShadow: "0 20px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(201,168,76,0.1)", width: 320 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: pageStatus==="published" ? "rgba(57,255,143,0.12)" : "rgba(201,168,76,0.12)", border: `1px solid ${pageStatus==="published" ? "rgba(57,255,143,0.3)" : "rgba(201,168,76,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {pageStatus==="published" ? "🌐" : "🚀"}
                  </div>
                  <div>
                    <p style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: 0 }}>{pageStatus==="published" ? "Page en ligne" : "Publier la page"}</p>
                    <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{pageStatus==="published" ? "Votre page est accessible" : "Rendre la page accessible"}</p>
                  </div>
                </div>

                {/* Statut */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, background: pageStatus==="published" ? "rgba(57,255,143,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${pageStatus==="published" ? "rgba(57,255,143,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "10px 12px", marginBottom: 14 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: pageStatus==="published" ? "#39FF8F" : MUTED, boxShadow: pageStatus==="published" ? "0 0 6px #39FF8F80" : "none" }} />
                  <span style={{ color: pageStatus==="published" ? "#39FF8F" : MUTED, fontSize: 12, fontWeight: 600 }}>{pageStatus==="published" ? "En ligne" : "Brouillon"}</span>
                  <span style={{ color: MUTED, fontSize: 11, marginLeft: "auto" }}>{blocks.length} bloc{blocks.length!==1?"s":""}</span>
                </div>

                {/* URL */}
                {pageSlug && (
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ color: MUTED, fontSize: 10, margin: "0 0 6px", textTransform: "uppercase", letterSpacing: 1.5 }}>URL de la page</p>
                    <div style={{ background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 8 }}>
                      <p style={{ color: G, fontSize: 12, margin: 0, fontFamily: "JetBrains Mono, monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {typeof window !== "undefined" ? window.location.origin : ""}/{pageSlug}
                      </p>
                      <button onClick={() => { navigator.clipboard.writeText((typeof window !== "undefined" ? window.location.origin : "")+"/"+pageSlug) }}
                        style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 6, padding: "4px 8px", color: G, cursor: "pointer", fontSize: 10, fontWeight: 600, flexShrink: 0 }}>
                        Copier
                      </button>
                    </div>
                  </div>
                )}

                {/* Stats rapides */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                  <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                    <p style={{ color: G, fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{pageStats.views}</p>
                    <p style={{ color: MUTED, fontSize: 9, margin: 0 }}>👁 Vues</p>
                  </div>
                  <div style={{ background: "rgba(57,255,143,0.06)", border: "1px solid rgba(57,255,143,0.15)", borderRadius: 10, padding: "10px", textAlign: "center" }}>
                    <p style={{ color: "#39FF8F", fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{pageStats.scans}</p>
                    <p style={{ color: MUTED, fontSize: 9, margin: 0 }}>📱 Scans</p>
                  </div>
                </div>

                {/* Bouton principal */}
                <button onClick={handlePublish} disabled={publishing || pageStatus==="published"}
                  style={{ width: "100%", background: pageStatus==="published" ? "rgba(57,255,143,0.1)" : `linear-gradient(90deg,${G},#b8953f)`, border: pageStatus==="published" ? "1px solid rgba(57,255,143,0.3)" : "none", borderRadius: 12, padding: "14px", color: pageStatus==="published" ? "#39FF8F" : "#080808", fontSize: 14, fontWeight: 700, cursor: pageStatus==="published" ? "default" : "pointer", marginBottom: pageSlug ? 10 : 0, boxShadow: pageStatus==="published" ? "none" : "0 4px 20px rgba(201,168,76,0.3)" }}>
                  {publishing ? "⏳ Publication..." : pageStatus==="published" ? "✓ Déjà publié" : "🚀 Publier maintenant"}
                </button>

                {/* Voir la page */}
                {pageSlug && (
                  <a href={`/${pageSlug}`} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px", color: MUTED, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                    <ExternalLink size={13} /> Voir la page
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>

        {/* SIDEBAR BLOCS */}
        <div style={{ width: blocksCollapsed ? 64 : blocksResize.width, background: "#0A0A0A", borderRight: "none", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden", transition: blocksCollapsed ? "width 0.25s ease" : "none", position: "relative" }}>
          {/* Bouton collapse/expand */}
          <button onClick={toggleBlocks} title={blocksCollapsed ? "Ouvrir" : "Réduire"}
            style={{ position: "absolute", top: 8, right: 8, zIndex: 20, width: 22, height: 22, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>
            {blocksCollapsed ? "›" : "‹"}
          </button>
          {/* Mode étendu: recherche normale */}
          {!blocksCollapsed && (
            <div style={{ padding: "10px 8px 10px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <Search size={11} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un bloc..."
                  style={{ width: "100%", background: "#111", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 7, padding: "7px 7px 7px 24px", color: "#F5F0E8", fontSize: 11, outline: "none", boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.15)"} />
                {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 0 }}><X size={10} /></button>}
              </div>
            </div>
          )}
          {/* Mode réduit: icône loupe */}
          {blocksCollapsed && (
            <div style={{ padding: "10px 0", display: "flex", justifyContent: "center", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
              <button onClick={toggleBlocks} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 4 }}>
                <Search size={16} />
              </button>
            </div>
          )}

          {!search && !blocksCollapsed && (
            <div style={{ padding: "7px 8px 5px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {/* Catégorie Récents — visible seulement si au moins 1 récent */}
                {recentBlocks.length > 0 && (
                  <button onClick={() => setActiveCategory("recents")} title="Blocs récemment utilisés"
                    style={{ display: "flex", alignItems: "center", gap: 5, background: activeCategory==="recents" ? "#38BDF818" : "rgba(255,255,255,0.03)", border: `1px solid ${activeCategory==="recents" ? "#38BDF850" : "rgba(255,255,255,0.06)"}`, borderRadius: 8, padding: "6px 9px", color: activeCategory==="recents" ? "#38BDF8" : MUTED, fontSize: 11, fontWeight: activeCategory==="recents" ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                    <span style={{ fontSize: 14 }}>🕐</span>
                    <span>Récents</span>
                  </button>
                )}
                {/* Catégorie Favoris — visible seulement si au moins 1 favori */}
                {favorites.length > 0 && (
                  <button onClick={() => setActiveCategory("favorites")} title="Vos blocs favoris"
                    style={{ display: "flex", alignItems: "center", gap: 5, background: activeCategory==="favorites" ? "#FFD70018" : "rgba(255,255,255,0.03)", border: `1px solid ${activeCategory==="favorites" ? "#FFD70050" : "rgba(255,255,255,0.06)"}`, borderRadius: 8, padding: "6px 9px", color: activeCategory==="favorites" ? "#FFD700" : MUTED, fontSize: 11, fontWeight: activeCategory==="favorites" ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                    <span style={{ fontSize: 14 }}>⭐</span>
                    <span>Favoris</span>
                    <span style={{ background: "rgba(255,215,0,0.15)", borderRadius: 10, padding: "0px 5px", fontSize: 9, fontWeight: 700 }}>{favorites.length}</span>
                  </button>
                )}
                {BLOCK_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} title={cat.desc}
                    style={{ display: "flex", alignItems: "center", gap: 5, background: activeCategory===cat.id ? cat.color+"18" : "rgba(255,255,255,0.03)", border: `1px solid ${activeCategory===cat.id ? cat.color+"50" : "rgba(255,255,255,0.06)"}`, borderRadius: 8, padding: "6px 9px", color: activeCategory===cat.id ? cat.color : MUTED, fontSize: 11, fontWeight: activeCategory===cat.id ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                    <span style={{ fontSize: 14 }}>{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
              <p style={{ color: MUTED, fontSize: 10, margin: "6px 0 0", paddingLeft: 2 }}>
                {activeCategory==="recents" ? `${recentBlocks.length} bloc${recentBlocks.length>1?"s":""} récent${recentBlocks.length>1?"s":""}` : activeCategory==="favorites" ? `${favorites.length} bloc${favorites.length>1?"s":""} favori${favorites.length>1?"s":""}` : BLOCK_CATEGORIES.find(c => c.id===activeCategory)?.desc}
              </p>
            </div>
          )}
          {/* Mode réduit : icônes catégories + drawer flottant */}
          {blocksCollapsed && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "8px 4px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
              {recentBlocks.length > 0 && (
                <button onClick={() => { setDrawerCategory("recents"); setActiveCategory("recents") }}
                  title={`Récents (${recentBlocks.length})`}
                  style={{ width: 44, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: (drawerCategory==="recents" || activeCategory==="recents") ? "#38BDF818" : "transparent", border: `1px solid ${(drawerCategory==="recents" || activeCategory==="recents") ? "#38BDF840" : "transparent"}`, borderRadius: 8, cursor: "pointer", fontSize: 16, transition: "all 0.15s" }}>
                  🕐
                </button>
              )}
              {favorites.length > 0 && (
                <button onClick={() => { setDrawerCategory("favorites"); setActiveCategory("favorites") }}
                  title={`Favoris (${favorites.length})`}
                  style={{ width: 44, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: (drawerCategory==="favorites" || activeCategory==="favorites") ? "#FFD70018" : "transparent", border: `1px solid ${(drawerCategory==="favorites" || activeCategory==="favorites") ? "#FFD70040" : "transparent"}`, borderRadius: 8, cursor: "pointer", fontSize: 16, transition: "all 0.15s" }}>
                  ⭐
                </button>
              )}
              {BLOCK_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => { setDrawerCategory(drawerCategory===cat.id ? null : cat.id); setActiveCategory(cat.id) }}
                  title={cat.label}
                  style={{ width: 44, height: 36, display: "flex", alignItems: "center", justifyContent: "center", background: (drawerCategory===cat.id || activeCategory===cat.id) ? cat.color+"18" : "transparent", border: `1px solid ${(drawerCategory===cat.id || activeCategory===cat.id) ? cat.color+"40" : "transparent"}`, borderRadius: 8, cursor: "pointer", fontSize: 16, transition: "all 0.15s" }}>
                  {cat.icon}
                </button>
              ))}
            </div>
          )}

          {!blocksCollapsed && <div style={{ flex: 1, overflowY: "auto", padding: "5px 6px" }}>
            {filteredBlocks.length===0
              ? (
                <div style={{ padding: "30px 14px", textAlign: "center" }}>
                  <p style={{ fontSize: 22, margin: "0 0 8px" }}>🔍</p>
                  <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600, margin: "0 0 3px" }}>Aucun bloc trouvé</p>
                  <p style={{ color: MUTED, fontSize: 10, margin: "0 0 12px" }}>"{search}"</p>
                  <button onClick={() => setSearch("")} style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 7, padding: "5px 12px", color: G, fontSize: 10, fontWeight: 600, cursor: "pointer" }}>Effacer</button>
                </div>
              )
              : search && groupedResults
              ? (<>
                {groupedResults.map(({ cat, blocks: catBlocks }) => (
                  <div key={cat.id} style={{ marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 6px 3px" }}>
                      <span style={{ fontSize: 11 }}>{cat.icon}</span>
                      <span style={{ color: cat.color, fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: 1.5 }}>{cat.label}</span>
                      <span style={{ color: MUTED, fontSize: 9 }}>·{catBlocks.length}</span>
                    </div>
                    {catBlocks.map(([type, def]) => (
                      <button key={type} onClick={() => addBlock(type)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left" as const, marginBottom: 1 }}
                        onMouseEnter={e => { e.currentTarget.style.background = def.color+"10"; e.currentTarget.style.color = "#F5F0E8" }}
                        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = MUTED }}>
                        <div style={{ width: 26, height: 26, borderRadius: 6, background: def.color+"12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>{def.icon}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hlText(def.label, search)}</p>
                          <p style={{ margin: 0, fontSize: 9, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{hlText(def.description, search)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </>)
              : filteredBlocks.map(([type, def]) => (
                <button key={type} onClick={() => addBlock(type)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left", marginBottom: 2, transition: "all 0.15s" }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = def.color+"10"; el.style.color = "#F5F0E8"; el.style.borderColor = def.color+"20"; const star = el.querySelector(".fav-star") as HTMLElement; if(star && !isFav(type)) star.style.opacity = "0.5" }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED; el.style.borderColor = "transparent"; const star = el.querySelector(".fav-star") as HTMLElement; if(star && !isFav(type)) star.style.opacity = "0" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: def.color+"12", border: `1px solid ${def.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{def.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "inherit", lineHeight: 1.2 }}>{def.label}</p>
                    <p style={{ margin: 0, fontSize: 9, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>{def.description}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleFav(type) }}
                    title={isFav(type) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    style={{ width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", flexShrink: 0, fontSize: 13, opacity: isFav(type) ? 1 : 0, transition: "opacity 0.15s, transform 0.15s", color: isFav(type) ? "#FFD700" : MUTED }}
                    className="fav-star">
                    {isFav(type) ? "⭐" : "☆"}
                  </button>
                </button>
              ))}
          </div>}
        </div>

        {/* POIGNÉE RESIZE sidebar blocs */}
        {!blocksCollapsed && (
          <div
            onMouseDown={blocksResize.onMouseDown}
            style={{
              width: 4, flexShrink: 0, background: "rgba(201,168,76,0.1)",
              borderRight: "1px solid rgba(201,168,76,0.1)",
              cursor: "col-resize", position: "relative", zIndex: 10,
              transition: "background 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.4)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(201,168,76,0.1)"}
          >
            {/* Indicateur visuel */}
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", gap: 3 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: "rgba(201,168,76,0.6)" }} />)}
            </div>
          </div>
        )}

        {/* DRAWER FLOTTANT — mode réduit blocs */}
        {blocksCollapsed && drawerCategory && (
          <div ref={drawerRef} style={{ position: "absolute", left: 64, top: 0, width: 240, height: "100%", background: "#0D0D0D", borderRight: "1px solid rgba(201,168,76,0.15)", zIndex: 50, display: "flex", flexDirection: "column", boxShadow: "4px 0 24px rgba(0,0,0,0.5)" }}>
            <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <span style={{ fontSize: 14 }}>{drawerCategory==="recents" ? "🕐" : drawerCategory==="favorites" ? "⭐" : BLOCK_CATEGORIES.find(c => c.id===drawerCategory)?.icon}</span>
                <span style={{ color: drawerCategory==="recents" ? "#38BDF8" : drawerCategory==="favorites" ? "#FFD700" : "#F5F0E8", fontSize: 12, fontWeight: 700 }}>{drawerCategory==="recents" ? `Récents (${recentBlocks.length})` : drawerCategory==="favorites" ? `Favoris (${favorites.length})` : BLOCK_CATEGORIES.find(c => c.id===drawerCategory)?.label}</span>
              </div>
              <button onClick={() => setDrawerCategory(null)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 2 }}><X size={13} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: "5px 6px" }}>
              {(drawerCategory === "recents"
                ? recentBlocks.filter(t => BLOCK_DEFS[t]).map(t => [t, BLOCK_DEFS[t]] as [string, (typeof BLOCK_DEFS)[string]])
                : drawerCategory === "favorites"
                ? Object.entries(BLOCK_DEFS).filter(([type]) => favorites.includes(type))
                : Object.entries(BLOCK_DEFS).filter(([, def]) => def.category === drawerCategory)
              ).map(([type, def]) => (
                <button key={type} onClick={() => { addBlock(type); setDrawerCategory(null) }}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left" as const, marginBottom: 2 }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = BLOCK_DEFS[type]?.color+"10"; el.style.color = "#F5F0E8" }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: def.color+"12", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{def.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "inherit", lineHeight: 1.2 }}>{def.label}</p>
                    <p style={{ margin: 0, fontSize: 9, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{def.description}</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); toggleFav(type) }}
                    title={isFav(type) ? "Retirer des favoris" : "Ajouter aux favoris"}
                    style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", flexShrink: 0, fontSize: 12, color: isFav(type) ? "#FFD700" : "rgba(255,255,255,0.25)" }}>
                    {isFav(type) ? "⭐" : "☆"}
                  </button>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* CANVAS */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#0A0A0A" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, padding: "6px 12px", background: "rgba(10,10,10,0.8)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 9, backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 10 }}>
              <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#4A4640" }}>CANVAS</span>
              <span style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 6, padding: "1px 6px", fontSize: 10, color: G }}>{blocks.length} bloc{blocks.length!==1?"s":""}</span>
              {blocks.filter(b => b.draft).length > 0 && (
                <span style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.25)", borderRadius: 6, padding: "1px 6px", fontSize: 10, color: "#FBBF24" }}>
                  ✏ {blocks.filter(b => b.draft).length} brouillon{blocks.filter(b => b.draft).length > 1 ? "s" : ""}
                </span>
              )}
              {!pageId && <span style={{ color: "#4A4640", fontSize: 9, marginLeft: "auto" }}>Mode démo</span>}
            </div>

            <div style={{ ...bgStyle(), borderRadius: 20, overflow: "hidden", minHeight: 200, position: "relative", boxShadow: "0 8px 60px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
            {/* Effets overlay */}
            {(theme as any).effect_glow && <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: `radial-gradient(ellipse at 50% 0%, ${(theme as any).glow_color||"#C9A84C"}${Math.round(((theme as any).glow_intensity||40)/100*180).toString(16).padStart(2,"0")}, transparent ${(theme as any).glow_size||300}px)` }} />}
            {(theme as any).effect_vignette && <div style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none", background: `radial-gradient(ellipse at 50% 50%, transparent ${Math.max(10, 100-((theme as any).vignette_intensity||40))}%, rgba(0,0,0,${((theme as any).vignette_intensity||40)/100}) 100%)` }} />}
            {blocks.length===0 ? (
              <div style={{ padding: "60px 30px", textAlign: "center" }}>
                <p style={{ color: "#4A4640", fontSize: 28, margin: "0 0 8px" }}>✦</p>
                <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Page vide — ajoute des blocs depuis la bibliothèque</p>
              </div>
            ) : blocks.map((block, idx) => {
              const def = BLOCK_DEFS[block.type]
              const isSelected = block.id === selectedId
              return (
                <div key={block.id}
                  onClick={() => { setSelectedId(block.id); setRightTab("edit") }}
                  style={{ position: "relative", marginBottom: 0, border: "none", overflow: "visible", cursor: block.locked ? "default" : "pointer", transition: "box-shadow 0.15s", opacity: block.visible ? (block.draft ? 0.6 : 1) : 0.35, background: block.draft ? "rgba(251,191,36,0.03)" : "transparent", boxShadow: isSelected ? `inset 3px 0 0 ${G}` : block.draft ? "inset 3px 0 0 rgba(251,191,36,0.5)" : block.locked ? "inset 3px 0 0 rgba(99,102,241,0.5)" : "none" }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.boxShadow = `inset 3px 0 0 rgba(201,168,76,0.3)`
                    const overlay = e.currentTarget.querySelector(".block-overlay") as HTMLElement
                    const handle = e.currentTarget.querySelector(".block-handle") as HTMLElement
                    if (overlay) overlay.style.opacity = "1"
                    if (handle) handle.style.opacity = "1"
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.boxShadow = "none"
                    const overlay = e.currentTarget.querySelector(".block-overlay") as HTMLElement
                    const handle = e.currentTarget.querySelector(".block-handle") as HTMLElement
                    if (overlay) overlay.style.opacity = "0"
                    if (handle) handle.style.opacity = "0"
                  }}>

                  <div className="block-handle" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s", cursor: block.locked ? "not-allowed" : "grab", zIndex: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {[0,1,2,3,4,5].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,168,76,0.5)" }} />)}
                    </div>
                  </div>

                  <div className="block-overlay" style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 3, opacity: 0, transition: "opacity 0.15s", zIndex: 10 }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => moveBlock(block.id, -1)} disabled={idx===0} style={{ width: 24, height: 24, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: idx===0 ? "rgba(255,255,255,0.2)" : "#F5F0E8", cursor: idx===0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}><ChevronUp size={10} /></button>
                    <button onClick={() => moveBlock(block.id, 1)} disabled={idx===blocks.length-1} style={{ width: 24, height: 24, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: idx===blocks.length-1 ? "rgba(255,255,255,0.2)" : "#F5F0E8", cursor: idx===blocks.length-1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}><ChevronDown size={10} /></button>
                    <button onClick={() => duplicateBlock(block.id)} style={{ width: 24, height: 24, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}><Copy size={10} /></button>
                    <button onClick={() => toggleVisible(block.id)} title={block.visible ? "Masquer" : "Afficher"}
                      style={{ width: 24, height: 24, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: block.visible ? MUTED : "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>
                      {block.visible ? <Eye size={10} /> : <EyeOff size={10} />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleDraft(block.id) }} title={block.draft ? "Retirer du brouillon" : "Mettre en brouillon"}
                      style={{ width: 24, height: 24, background: block.draft ? "rgba(251,191,36,0.15)" : "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: `1px solid ${block.draft ? "rgba(251,191,36,0.4)" : "rgba(255,255,255,0.1)"}`, color: block.draft ? "#FBBF24" : MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontSize: 10, fontWeight: 700 }}>
                      ✏
                    </button>
                    <button onClick={e => { e.stopPropagation(); toggleLock(block.id) }} title={block.locked ? "Déverrouiller" : "Verrouiller"}
                      style={{ width: 24, height: 24, background: block.locked ? "rgba(99,102,241,0.15)" : "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: `1px solid ${block.locked ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.1)"}`, color: block.locked ? "#818CF8" : MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, fontSize: 10 }}>
                      {block.locked ? "🔒" : "🔓"}
                    </button>
                    {!block.locked && (
                      <button onClick={() => deleteBlock(block.id)} style={{ width: 24, height: 24, background: "rgba(239,68,68,0.12)", backdropFilter: "blur(4px)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}><Trash2 size={10} /></button>
                    )}
                  </div>

                  {isSelected && (
                    <div style={{ position: "absolute", bottom: 6, left: 22, display: "flex", alignItems: "center", gap: 4, background: "rgba(8,8,8,0.88)", backdropFilter: "blur(4px)", border: `1px solid ${G}25`, borderRadius: 6, padding: "2px 7px", zIndex: 10 }}>
                      <span style={{ fontSize: 10 }}>{def?.icon}</span>
                      <span style={{ color: G, fontSize: 9, fontWeight: 700 }}>{def?.label}</span>
                    </div>
                  )}
                  {block.draft && !block.locked && (
                    <div style={{ position: "absolute", top: 6, left: 22, display: "flex", alignItems: "center", gap: 4, background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.35)", borderRadius: 5, padding: "2px 7px", zIndex: 10, pointerEvents: "none" }}>
                      <span style={{ fontSize: 8 }}>✏️</span>
                      <span style={{ color: "#FBBF24", fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const }}>Brouillon</span>
                    </div>
                  )}
                  {block.locked && (
                    <div style={{ position: "absolute", top: 6, right: 8, display: "flex", alignItems: "center", gap: 3, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 5, padding: "2px 6px", zIndex: 10, pointerEvents: "none" }}>
                      <span style={{ fontSize: 8 }}>🔒</span>
                      <span style={{ color: "#818CF8", fontSize: 8, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" as const }}>Verrouillé</span>
                    </div>
                  )}

                  <div style={{ overflow: "hidden", minHeight: 36, position: "relative", zIndex: 2 }}>
                    <BlockPreview block={block} theme={theme} dayMode={dayMode} />
                  </div>
                </div>
              )
            })}

            <button onClick={() => { setActiveCategory("identity"); setSearch("") }}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(201,168,76,0.04)", border: "2px dashed rgba(201,168,76,0.2)", borderRadius: 14, padding: "18px", color: MUTED, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 8, transition: "all 0.2s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="rgba(201,168,76,0.5)"; e.currentTarget.style.color=G; e.currentTarget.style.background="rgba(201,168,76,0.08)"; e.currentTarget.style.transform="translateY(-1px)" }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="rgba(201,168,76,0.2)"; e.currentTarget.style.color=MUTED; e.currentTarget.style.background="rgba(201,168,76,0.04)"; e.currentTarget.style.transform="translateY(0)" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={14} color={G} /></div>
              Ajouter un nouveau bloc
            </button>
            </div>
          </div>
        </div>

        {/* PANEL DROIT */}
        {/* POIGNÉE RESIZE panel droit */}
        {!rightCollapsed && (
          <div
            onMouseDown={rightResize.onMouseDown}
            style={{
              width: 4, flexShrink: 0, background: "rgba(201,168,76,0.1)",
              borderLeft: "1px solid rgba(201,168,76,0.1)",
              cursor: "col-resize", position: "relative", zIndex: 10,
              transition: "background 0.15s"
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.4)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(201,168,76,0.1)"}
          >
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", display: "flex", flexDirection: "column", gap: 3 }}>
              {[0,1,2].map(i => <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: "rgba(201,168,76,0.6)" }} />)}
            </div>
          </div>
        )}
        <div style={{ width: rightCollapsed ? 48 : rightResize.width, background: "#161616", borderLeft: "none", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden", transition: rightCollapsed ? "width 0.25s ease" : "none", position: "relative" }}>
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            {rightCollapsed
              ? /* Mode réduit: onglets verticaux */
                <div style={{ display: "flex", flexDirection: "column", width: "100%", gap: 0 }}>
                  {(["preview","edit","theme"] as const).map(tab => (
                    <button key={tab} onClick={() => { setRightTab(tab); setRightCollapsed(false) }}
                      style={{ padding: "14px 4px", background: "transparent", border: "none", borderLeft: `2px solid ${rightTab===tab ? G : "transparent"}`, color: rightTab===tab ? G : MUTED, fontSize: 9, fontWeight: rightTab===tab ? 700 : 400, cursor: "pointer", writingMode: "vertical-rl" as const, textOrientation: "mixed" as const, letterSpacing: 1 }}>
                      {tab==="preview" ? "▶" : tab==="edit" ? "✏" : "🎨"}
                    </button>
                  ))}
                  <button onClick={toggleRight} style={{ padding: "12px 4px", background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 14, marginTop: "auto" }}>›</button>
                </div>
              : /* Mode normal: onglets horizontaux */
                <>
                  {(["preview","edit","theme"] as const).map(tab => (
                    <button key={tab} onClick={() => setRightTab(tab)}
                      style={{ flex: 1, padding: "11px 4px", background: "transparent", border: "none", borderBottom: `2px solid ${rightTab===tab ? G : "transparent"}`, color: rightTab===tab ? G : MUTED, fontSize: 12, fontWeight: rightTab===tab ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                      {tab==="preview" ? "Preview" : tab==="edit" ? "Éditer" : "Thème"}
                    </button>
                  ))}
                  <button onClick={toggleRight} title="Réduire" style={{ padding: "11px 8px", background: "none", border: "none", color: MUTED, cursor: "pointer", fontSize: 12 }}>‹</button>
                </>
            }
          </div>

          {!rightCollapsed && rightTab==="preview" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "14px 10px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontSize: 12, color: "#F5F0E8", fontWeight: 600 }}>Aperçu live</span>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#39FF8F", animation: "pulse 2s infinite" }} />
                </div>
                {pageSlug && <a href={`/${pageSlug}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 7, padding: "5px 10px", color: G, textDecoration: "none", fontSize: 10, fontWeight: 700 }}><ExternalLink size={10} /> Voir en direct</a>}
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ position: "relative", width: 220 }}>
                  <div style={{ width: 220, background: "linear-gradient(145deg,#2A2A2A,#1A1A1A)", borderRadius: 34, padding: "10px 8px", boxShadow: "0 0 0 1px #3A3A3A, 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)", position: "relative" }}>
                    <div style={{ position: "absolute", left: -3, top: 68, width: 3, height: 24, background: "#2A2A2A", borderRadius: "2px 0 0 2px" }} />
                    <div style={{ position: "absolute", left: -3, top: 100, width: 3, height: 38, background: "#2A2A2A", borderRadius: "2px 0 0 2px" }} />
                    <div style={{ position: "absolute", left: -3, top: 146, width: 3, height: 38, background: "#2A2A2A", borderRadius: "2px 0 0 2px" }} />
                    <div style={{ position: "absolute", right: -3, top: 96, width: 3, height: 58, background: "#2A2A2A", borderRadius: "0 2px 2px 0" }} />

                    <div style={{ borderRadius: 26, overflow: "hidden", ...bgStyle() }}>
                      <div style={{ background: dayMode ? "#FAFAFA" : (theme.bgGradient||theme.bg), padding: "9px 0 3px", display: "flex", justifyContent: "center", position: "relative" }}>
                        <div style={{ width: 78, height: 20, background: "#000", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#111", border: "1px solid #222" }} />
                          <div style={{ width: 36, height: 7, borderRadius: 3.5, background: "#111" }} />
                        </div>
                        <div style={{ position: "absolute", right: 12, top: 5, display: "flex", gap: 3, alignItems: "center" }}>
                          <span style={{ color: dayMode ? "#333" : "#F5F0E8", fontSize: 6, fontWeight: 600, opacity: 0.6 }}>9:41</span>
                          <div style={{ width: 10, height: 5, border: `1px solid ${dayMode?"#333":"#F5F0E8"}`, borderRadius: 1.5, opacity: 0.5 }}><div style={{ width: "75%", height: "100%", background: "#39FF8F", borderRadius: 1 }} /></div>
                        </div>
                      </div>

                      <div style={{ maxHeight: 420, overflowY: "auto", ...bgStyle() }} className="iphone-scroll">
                        {blocks.filter(b => b.visible).length===0
                          ? <div style={{ padding: "40px 14px", textAlign: "center", ...bgStyle() }}><p style={{ fontSize: 24, margin: "0 0 6px" }}>✦</p><p style={{ color: MUTED, fontSize: 10 }}>Ta page apparaîtra ici</p></div>
                          : blocks.filter(b => b.visible && !b.draft).map(b => (
                            <div key={b.id} onClick={() => { setSelectedId(b.id); setRightTab("edit") }} style={{ cursor: "pointer" }}
                              onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
                              onMouseLeave={e => e.currentTarget.style.opacity="1"}>
                              <BlockPreview block={b} theme={theme} dayMode={dayMode} />
                            </div>
                          ))}
                        <div style={{ padding: "8px", textAlign: "center", ...bgStyle() }}>
                          <p style={{ color: MUTED, fontSize: 7, margin: 0, opacity: 0.4 }}>Créé avec QRfolio</p>
                        </div>
                      </div>

                      <div style={{ ...bgStyle(), padding: "5px 0 7px", display: "flex", justifyContent: "center" }}>
                        <div style={{ width: 72, height: 3.5, background: dayMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)", borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 34, background: "linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 40%)", pointerEvents: "none" }} />
                </div>
              </div>

              <div style={{ marginTop: 22, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                  <p style={{ color: MUTED, fontSize: 10, margin: 0, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>QR Code</p>
                  {qrCodeUrl
                    ? <div style={{ background: "#FFFFFF", border: "3px solid rgba(201,168,76,0.3)", borderRadius: 14, padding: 9, boxShadow: "0 8px 30px rgba(0,0,0,0.5)" }}>
                        <img src={qrCodeUrl} alt="QR" style={{ width: 130, height: 130, imageRendering: "pixelated", display: "block" }} />
                      </div>
                    : <div style={{ background: "#FFFFFF", border: "3px solid rgba(201,168,76,0.2)", borderRadius: 14, width: 130, height: 130, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 30px rgba(0,0,0,0.4)" }}>
                        <QrCode size={48} color="#C9A84C" />
                      </div>}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "3px 10px" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: pageStatus==="published" ? "#39FF8F" : MUTED, boxShadow: pageStatus==="published" ? "0 0 5px #39FF8F70" : "none" }} />
                    <span style={{ color: MUTED, fontSize: 9, fontFamily: "monospace" }}>{qrShortCode ? `/q/${qrShortCode}` : "en attente"}</span>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9, width: "100%" }}>
                  <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.18)", borderRadius: 11, padding: "12px 10px", textAlign: "center" }}>
                    <p style={{ color: G, fontSize: 24, fontWeight: 700, margin: "0 0 2px", fontFamily: "Cormorant Garamond, serif", lineHeight: 1 }}>{pageStats.views.toLocaleString("fr-FR")}</p>
                    <p style={{ color: MUTED, fontSize: 9, margin: 0 }}>👁 Vues</p>
                  </div>
                  <div style={{ background: "rgba(57,255,143,0.06)", border: "1px solid rgba(57,255,143,0.18)", borderRadius: 11, padding: "12px 10px", textAlign: "center" }}>
                    <p style={{ color: "#39FF8F", fontSize: 24, fontWeight: 700, margin: "0 0 2px", fontFamily: "Cormorant Garamond, serif", lineHeight: 1 }}>{pageStats.scans.toLocaleString("fr-FR")}</p>
                    <p style={{ color: MUTED, fontSize: 9, margin: 0 }}>📱 Scans</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "7px 14px", background: pageStatus==="published" ? "rgba(57,255,143,0.06)" : "rgba(255,255,255,0.03)", border: `1px solid ${pageStatus==="published" ? "rgba(57,255,143,0.2)" : "rgba(255,255,255,0.07)"}`, borderRadius: 20 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: pageStatus==="published" ? "#39FF8F" : MUTED, boxShadow: pageStatus==="published" ? "0 0 5px #39FF8F50" : "none" }} />
                  <span style={{ color: pageStatus==="published" ? "#39FF8F" : MUTED, fontSize: 10, fontWeight: 600 }}>{pageStatus==="published" ? "En ligne" : "Brouillon"}</span>
                  <span style={{ color: MUTED, fontSize: 9 }}>• {blocks.filter(b=>b.visible).length} bloc{blocks.filter(b=>b.visible).length!==1?"s":""}</span>
                </div>
              </div>
            </div>
          )}

          {!rightCollapsed && rightTab==="edit" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              {!selectedBlock
                ? <div style={{ textAlign: "center", padding: "50px 14px" }}>
                    <Settings size={28} color={MUTED} style={{ margin: "0 auto 8px", opacity: 0.2, display: "block" }} />
                    <p style={{ color: MUTED, fontSize: 12, margin: 0, lineHeight: 1.7 }}>Clique sur un bloc dans le canvas pour l&apos;éditer</p>
                  </div>
                : <>
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ background: `${BLOCK_DEFS[selectedBlock.type]?.color||G}12`, border: `1px solid ${BLOCK_DEFS[selectedBlock.type]?.color||G}25`, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                        {BLOCK_DEFS[selectedBlock.type]?.icon}
                      </div>
                      <div>
                        <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 700, margin: 0 }}>{BLOCK_DEFS[selectedBlock.type]?.label}</p>
                        <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{BLOCK_DEFS[selectedBlock.type]?.description}</p>
                      </div>
                      <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                        <button onClick={() => duplicateBlock(selectedBlock.id)} title="Dupliquer" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: MUTED, display: "flex", alignItems: "center", justifyContent: "center" }}><Copy size={10} /></button>
                        <button onClick={() => toggleDraft(selectedBlock.id)} title={selectedBlock.draft ? "Retirer du brouillon" : "Mettre en brouillon"}
                          style={{ background: selectedBlock.draft ? "rgba(251,191,36,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedBlock.draft ? "rgba(251,191,36,0.35)" : "rgba(255,255,255,0.07)"}`, borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: selectedBlock.draft ? "#FBBF24" : MUTED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                          ✏
                        </button>
                        <button onClick={() => toggleLock(selectedBlock.id)} title={selectedBlock.locked ? "Déverrouiller" : "Verrouiller"}
                          style={{ background: selectedBlock.locked ? "rgba(99,102,241,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${selectedBlock.locked ? "rgba(99,102,241,0.35)" : "rgba(255,255,255,0.07)"}`, borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: selectedBlock.locked ? "#818CF8" : MUTED, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>
                          {selectedBlock.locked ? "🔒" : "🔓"}
                        </button>
                        {!selectedBlock.locked && (
                          <button onClick={() => deleteBlock(selectedBlock.id)} title="Supprimer" style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={10} /></button>
                        )}
                      </div>
                    </div>
                    {/* key=selectedBlock.id force le remount quand on change de bloc */}
                    <EditPanel
                      key={selectedBlock.id}
                      block={selectedBlock}
                      onChange={(key, val) => updateBlock(selectedBlock.id, key, val)}
                    />
                  </>
              }
            </div>
          )}

          {!rightCollapsed && rightTab==="theme" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              <ThemePanel theme={theme} onThemeChange={setTheme} />
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes auroraShift{0%{background-position:0% 0%}33%{background-position:100% 0%}66%{background-position:50% 100%}100%{background-position:0% 0%}}
        .iphone-scroll::-webkit-scrollbar{display:none}
        .block-handle:active{cursor:grabbing}
        .panel-collapse{transition:width 0.25s cubic-bezier(0.4,0,0.2,1)}
        .focus-mode .sidebar{width:64px!important}
      `}</style>
    </div>
  )
}
