"use client"

import { useState, useRef, useEffect } from "react"
import {
  Sparkles, Send, X, ChevronUp, ChevronDown, Trash2, Bot, User as UserIcon,
  Eye, Plus, Settings, Check, Search, Copy, EyeOff,
  ExternalLink, Palette, Sun, Moon, GripVertical, QrCode
} from "lucide-react"
import { BLOCK_DEFS, BLOCK_CATEGORIES, SOCIAL_NETWORKS, PRESET_THEMES, GOOGLE_FONTS, type Block, type BlockContent, type PageTheme } from "./types"
import { createClient } from "@/lib/supabase/client"

const G = "#C9A84C"
const MUTED = "#8A8478"
type Message = { role: "user" | "assistant"; content: string }

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
  const bg = dayMode ? "#FFFFFF" : (theme.bgGradient || theme.bg)
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>Thèmes prédéfinis</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {Object.entries(PRESET_THEMES).map(([key, t]) => (
            <button key={key} onClick={() => onThemeChange(t)}
              style={{ background: t.bg, border: `2px solid ${theme.name===t.name ? G : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "9px 7px", cursor: "pointer", textAlign: "left", position: "relative" }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>{[t.primary,t.accent,t.text].map((col,i) => <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: col }} />)}</div>
              <p style={{ color: t.text, fontSize: 9, fontWeight: 600, margin: 0 }}>{t.name}</p>
              {theme.name===t.name && <div style={{ position: "absolute", top: 3, right: 3, width: 12, height: 12, background: G, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={7} color="#000" /></div>}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>Police d&apos;affichage</p>
        <select value={theme.fontDisplay} onChange={e => onThemeChange({...theme, fontDisplay: e.target.value})} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "8px 10px", color: "#F5F0E8", fontSize: 12, outline: "none" }}>
          {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>Police de corps</p>
        <select value={theme.fontBody} onChange={e => onThemeChange({...theme, fontBody: e.target.value})} style={{ width: "100%", background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "8px 10px", color: "#F5F0E8", fontSize: 12, outline: "none" }}>
          {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>Couleur principale</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="color" value={theme.primary} onChange={e => onThemeChange({...theme, primary: e.target.value})} style={{ width: 34, height: 32, border: "none", borderRadius: 6, cursor: "pointer", padding: 0 }} />
          <input type="text" value={theme.primary} onChange={e => onThemeChange({...theme, primary: e.target.value})} style={{ flex: 1, background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "8px 10px", color: "#F5F0E8", fontSize: 12, outline: "none", fontFamily: "monospace" }} />
        </div>
      </div>
    </div>
  )
}

export default function BuilderV4({ pageId }: { pageId?: string }) {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "profile", content: { name: "Mon Nom", tagline: "Mon activité" }, visible: true },
    { id: "2", type: "bio", content: { text: "Bienvenue sur ma page !" }, visible: true },
    { id: "3", type: "cta_button", content: { label: "Me contacter", url: "#", style: "gold" }, visible: true },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pageName, setPageName] = useState("Ma Page")
  const [pageSlug, setPageSlug] = useState("ma-page")
  const [pageStatus, setPageStatus] = useState("draft")
  const [theme, setTheme] = useState<PageTheme>(PRESET_THEMES.midnight_gold)
  const [rightTab, setRightTab] = useState<"preview"|"edit"|"theme"|"ai">("preview")
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
      if (blks?.length) setBlocks(blks.map(b => ({ id: b.id, type: b.type, content: b.content||{}, visible: b.is_visible!==false })))
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
      if (blocks.length > 0) await supabase.from("blocks").insert(blocks.map((b, i) => ({ page_id: pageId, type: b.type, position: i, content: b.content, is_visible: b.visible, styles: {} })))
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
  }

  function deleteBlock(id: string) {
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

  function moveBlock(id: string, dir: number) {
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

  const filteredBlocks = Object.entries(BLOCK_DEFS).filter(([, def]) => {
    if (search) return def.label.toLowerCase().includes(search.toLowerCase()) || def.description.toLowerCase().includes(search.toLowerCase())
    return def.category === activeCategory
  })

  // selectedBlock recalculé depuis blocks à chaque render — garantit fraîcheur
  const selectedBlock = blocks.find(b => b.id === selectedId)

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

        <button onClick={() => setRightTab("ai")} style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 7, padding: "5px 11px", color: G, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          <Sparkles size={11} /> Générer IA
        </button>

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

        <button onClick={() => setDayMode(d => !d)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: MUTED }}>
          {dayMode ? <Moon size={12} /> : <Sun size={12} />}
        </button>

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
              <div onClick={() => setShowPublishPopup(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#161616", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 14, padding: "18px", zIndex: 200, boxShadow: "0 8px 40px rgba(0,0,0,0.6)", width: 240 }}>
                <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 700, margin: "0 0 8px" }}>Publier la page</p>
                {pageSlug && (
                  <div style={{ background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 10px", marginBottom: 12, display: "flex", alignItems: "center", gap: 7 }}>
                    <p style={{ color: G, fontSize: 11, margin: 0, fontFamily: "monospace", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>/{pageSlug}</p>
                    <button onClick={() => navigator.clipboard.writeText(window.location.origin+"/"+pageSlug)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 0 }}><Copy size={11} /></button>
                  </div>
                )}
                <button onClick={handlePublish} disabled={publishing}
                  style={{ width: "100%", background: `linear-gradient(90deg,${G},#b8953f)`, border: "none", borderRadius: 9, padding: "11px", color: "#080808", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  {publishing ? "Publication..." : pageStatus==="published" ? "✓ Déjà publié" : "Publier maintenant →"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* SIDEBAR BLOCS */}
        <div style={{ width: 230, background: "#0A0A0A", borderRight: "1px solid rgba(201,168,76,0.1)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <Search size={11} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un bloc..."
                style={{ width: "100%", background: "#111", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 7, padding: "7px 7px 7px 24px", color: "#F5F0E8", fontSize: 11, outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.15)"} />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 0 }}><X size={10} /></button>}
            </div>
          </div>

          {!search && (
            <div style={{ padding: "7px 8px 5px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {BLOCK_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} title={cat.desc}
                    style={{ display: "flex", alignItems: "center", gap: 3, background: activeCategory===cat.id ? cat.color+"18" : "transparent", border: `1px solid ${activeCategory===cat.id ? cat.color+"40" : "transparent"}`, borderRadius: 6, padding: "3px 6px", color: activeCategory===cat.id ? cat.color : MUTED, fontSize: 10, cursor: "pointer" }}>
                    <span>{cat.icon}</span>
                    <span style={{ display: activeCategory===cat.id ? "inline" : "none" }}>{cat.label}</span>
                  </button>
                ))}
              </div>
              <p style={{ color: MUTED, fontSize: 9, margin: "4px 0 0", paddingLeft: 2 }}>{BLOCK_CATEGORIES.find(c => c.id===activeCategory)?.desc}</p>
            </div>
          )}

          <div style={{ flex: 1, overflowY: "auto", padding: "5px 6px" }}>
            {filteredBlocks.length===0
              ? <div style={{ padding: "20px 10px", textAlign: "center" }}><p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Aucun résultat</p></div>
              : filteredBlocks.map(([type, def]) => (
                <button key={type} onClick={() => addBlock(type)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left", marginBottom: 2, transition: "all 0.15s" }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = def.color+"10"; el.style.color = "#F5F0E8"; el.style.borderColor = def.color+"20" }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED; el.style.borderColor = "transparent" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: def.color+"12", border: `1px solid ${def.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{def.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "inherit", lineHeight: 1.2 }}>{def.label}</p>
                    <p style={{ margin: 0, fontSize: 9, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>{def.description}</p>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* CANVAS */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px", background: "#101010", backgroundImage: "linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }}>
          <div style={{ maxWidth: 640, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, padding: "6px 12px", background: "#0A0A0A", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 9 }}>
              <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#4A4640" }}>CANVAS</span>
              <span style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 6, padding: "1px 6px", fontSize: 10, color: G }}>{blocks.length} bloc{blocks.length!==1?"s":""}</span>
              {!pageId && <span style={{ color: "#4A4640", fontSize: 9, marginLeft: "auto" }}>Mode démo</span>}
            </div>

            {blocks.length===0 ? (
              <div style={{ border: "1px dashed rgba(201,168,76,0.12)", borderRadius: 16, padding: "60px 30px", textAlign: "center" }}>
                <p style={{ color: "#4A4640", fontSize: 28, margin: "0 0 8px" }}>✦</p>
                <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Page vide — ajoute des blocs depuis la bibliothèque</p>
              </div>
            ) : blocks.map((block, idx) => {
              const def = BLOCK_DEFS[block.type]
              const isSelected = block.id === selectedId
              return (
                <div key={block.id}
                  onClick={() => { setSelectedId(block.id); setRightTab("edit") }}
                  style={{ position: "relative", marginBottom: 8, border: `2px solid ${isSelected ? G+"90" : "rgba(255,255,255,0.04)"}`, borderRadius: 14, overflow: "visible", cursor: "pointer", transition: "all 0.15s", opacity: block.visible ? 1 : 0.45, background: "#131313", boxShadow: isSelected ? `0 0 0 1px ${G}25, 0 4px 20px rgba(0,0,0,0.4)` : "none" }}
                  onMouseEnter={e => {
                    if (!isSelected) { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)" }
                    const overlay = e.currentTarget.querySelector(".block-overlay") as HTMLElement
                    const handle = e.currentTarget.querySelector(".block-handle") as HTMLElement
                    if (overlay) overlay.style.opacity = "1"
                    if (handle) handle.style.opacity = "1"
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.boxShadow = "none" }
                    const overlay = e.currentTarget.querySelector(".block-overlay") as HTMLElement
                    const handle = e.currentTarget.querySelector(".block-handle") as HTMLElement
                    if (overlay) overlay.style.opacity = "0"
                    if (handle) handle.style.opacity = "0"
                  }}>

                  <div className="block-handle" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 18, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s", cursor: "grab", zIndex: 10 }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {[0,1,2,3,4,5].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,168,76,0.5)" }} />)}
                    </div>
                  </div>

                  <div className="block-overlay" style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 3, opacity: 0, transition: "opacity 0.15s", zIndex: 10 }}
                    onClick={e => e.stopPropagation()}>
                    <button onClick={() => moveBlock(block.id, -1)} disabled={idx===0} style={{ width: 24, height: 24, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: idx===0 ? "rgba(255,255,255,0.2)" : "#F5F0E8", cursor: idx===0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}><ChevronUp size={10} /></button>
                    <button onClick={() => moveBlock(block.id, 1)} disabled={idx===blocks.length-1} style={{ width: 24, height: 24, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: idx===blocks.length-1 ? "rgba(255,255,255,0.2)" : "#F5F0E8", cursor: idx===blocks.length-1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}><ChevronDown size={10} /></button>
                    <button onClick={() => duplicateBlock(block.id)} style={{ width: 24, height: 24, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}><Copy size={10} /></button>
                    <button onClick={() => toggleVisible(block.id)} style={{ width: 24, height: 24, background: "rgba(15,15,15,0.92)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: block.visible ? MUTED : "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>{block.visible ? <Eye size={10} /> : <EyeOff size={10} />}</button>
                    <button onClick={() => deleteBlock(block.id)} style={{ width: 24, height: 24, background: "rgba(239,68,68,0.12)", backdropFilter: "blur(4px)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}><Trash2 size={10} /></button>
                  </div>

                  {isSelected && (
                    <div style={{ position: "absolute", bottom: 6, left: 22, display: "flex", alignItems: "center", gap: 4, background: "rgba(8,8,8,0.88)", backdropFilter: "blur(4px)", border: `1px solid ${G}25`, borderRadius: 6, padding: "2px 7px", zIndex: 10 }}>
                      <span style={{ fontSize: 10 }}>{def?.icon}</span>
                      <span style={{ color: G, fontSize: 9, fontWeight: 700 }}>{def?.label}</span>
                    </div>
                  )}

                  <div style={{ borderRadius: 12, overflow: "hidden", minHeight: 36 }}>
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

        {/* PANEL DROIT */}
        <div style={{ width: 340, background: "#161616", borderLeft: "1px solid rgba(201,168,76,0.12)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            {(["preview","edit","theme","ai"] as const).map(tab => (
              <button key={tab} onClick={() => setRightTab(tab)}
                style={{ flex: 1, padding: "10px 4px", background: "transparent", border: "none", borderBottom: `2px solid ${rightTab===tab ? G : "transparent"}`, color: rightTab===tab ? G : MUTED, fontSize: 11, fontWeight: rightTab===tab ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                {tab==="preview" ? "Preview" : tab==="edit" ? "Éditer" : tab==="theme" ? "Thème" : "IA"}
              </button>
            ))}
          </div>

          {rightTab==="preview" && (
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

                    <div style={{ borderRadius: 26, overflow: "hidden", background: dayMode ? "#FAFAFA" : theme.bg }}>
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

                      <div style={{ maxHeight: 420, overflowY: "auto", background: dayMode ? "#FAFAFA" : (theme.bgGradient||theme.bg) }} className="iphone-scroll">
                        {blocks.filter(b => b.visible).length===0
                          ? <div style={{ padding: "40px 14px", textAlign: "center", background: dayMode ? "#FAFAFA" : theme.bg }}><p style={{ fontSize: 24, margin: "0 0 6px" }}>✦</p><p style={{ color: MUTED, fontSize: 10 }}>Ta page apparaîtra ici</p></div>
                          : blocks.filter(b => b.visible).map(b => (
                            <div key={b.id} onClick={() => { setSelectedId(b.id); setRightTab("edit") }} style={{ cursor: "pointer" }}
                              onMouseEnter={e => e.currentTarget.style.opacity="0.85"}
                              onMouseLeave={e => e.currentTarget.style.opacity="1"}>
                              <BlockPreview block={b} theme={theme} dayMode={dayMode} />
                            </div>
                          ))}
                        <div style={{ padding: "8px", textAlign: "center", background: dayMode ? "#FAFAFA" : theme.bg }}>
                          <p style={{ color: MUTED, fontSize: 7, margin: 0, opacity: 0.4 }}>Créé avec QRfolio</p>
                        </div>
                      </div>

                      <div style={{ background: dayMode ? "#FAFAFA" : (theme.bgGradient||theme.bg), padding: "5px 0 7px", display: "flex", justifyContent: "center" }}>
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

          {rightTab==="edit" && (
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
                        <button onClick={() => duplicateBlock(selectedBlock.id)} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: MUTED, display: "flex", alignItems: "center", justifyContent: "center" }}><Copy size={10} /></button>
                        <button onClick={() => deleteBlock(selectedBlock.id)} style={{ background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={10} /></button>
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

          {rightTab==="theme" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              <ThemePanel theme={theme} onThemeChange={setTheme} />
            </div>
          )}

          {rightTab==="ai" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, flexDirection: msg.role==="user" ? "row-reverse" : "row" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: msg.role==="assistant" ? "rgba(201,168,76,0.12)" : "rgba(57,255,143,0.1)", border: `1px solid ${msg.role==="assistant" ? "rgba(201,168,76,0.3)" : "rgba(57,255,143,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {msg.role==="assistant" ? <Bot size={10} color={G} /> : <UserIcon size={10} color="#39FF8F" />}
                    </div>
                    <div style={{ maxWidth: "84%", background: msg.role==="assistant" ? "#111" : "rgba(57,255,143,0.06)", border: `1px solid ${msg.role==="assistant" ? "rgba(201,168,76,0.1)" : "rgba(57,255,143,0.2)"}`, borderRadius: msg.role==="user" ? "9px 3px 9px 9px" : "3px 9px 9px 9px", padding: "7px 10px" }}>
                      <p style={{ color: "#F5F0E8", fontSize: 11, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={10} color={G} /></div>
                    <div style={{ background: "#111", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "3px 9px 9px 9px", padding: "8px 12px", display: "flex", gap: 3 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: G, animation: `bounce 1s ease ${i*0.2}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={messagesEnd} />
              </div>
              <div style={{ padding: "5px 8px", display: "flex", gap: 3, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                {["Freelance","Restaurant","Coach","Artiste","E-commerce","Médecin"].map(s => (
                  <button key={s} onClick={() => sendAI(s)} style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 10, padding: "2px 7px", color: MUTED, fontSize: 9, cursor: "pointer" }}>{s}</button>
                ))}
              </div>
              <div style={{ padding: "8px", borderTop: "1px solid rgba(201,168,76,0.1)", display: "flex", gap: 5 }}>
                <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendAI() } }}
                  placeholder="Décris ton activité..."
                  style={{ flex: 1, background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 7, padding: "8px 10px", color: "#F5F0E8", fontSize: 11, outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"} />
                <button onClick={() => sendAI()} disabled={aiLoading || !aiInput.trim()}
                  style={{ background: `linear-gradient(90deg,${G},#b8953f)`, border: "none", borderRadius: 7, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: !aiInput.trim() ? 0.5 : 1, flexShrink: 0 }}>
                  <Send size={11} color="#080808" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        .iphone-scroll::-webkit-scrollbar{display:none}
        .block-handle:active{cursor:grabbing}
      `}</style>
    </div>
  )
}
