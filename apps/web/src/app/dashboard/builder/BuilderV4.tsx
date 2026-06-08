"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  ChevronUp, ChevronDown, Trash2, Eye, EyeOff, Copy,
  Plus, Check, Search, ExternalLink, Sun, Moon,
  GripVertical, X, Share2, Link, Smartphone
} from "lucide-react"
import { BLOCK_DEFS, BLOCK_CATEGORIES, PRESET_THEMES, GOOGLE_FONTS, type Block, type BlockContent, type PageTheme } from "./types"
import { createClient } from "@/lib/supabase/client"

// ── Helpers ────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10) }

function patternCSS(pattern: string, color: string): string {
  switch (pattern) {
    case "dots": return `radial-gradient(circle, ${color}30 1px, transparent 1px) 0 0 / 20px 20px`
    case "grid": return `linear-gradient(${color}15 1px, transparent 1px) 0 0 / 24px 24px, linear-gradient(90deg, ${color}15 1px, transparent 1px) 0 0 / 24px 24px`
    case "stars": return `radial-gradient(circle, ${color}40 1px, transparent 1px) 0 0 / 30px 30px, radial-gradient(circle, ${color}20 1px, transparent 1px) 15px 15px / 30px 30px`
    case "matrix": return `repeating-linear-gradient(0deg, ${color}08 0px, ${color}08 1px, transparent 1px, transparent 20px)`
    case "hexagons": return `radial-gradient(circle at center, ${color}15 0, transparent 60%) 0 0 / 40px 40px`
    case "waves": return `repeating-linear-gradient(45deg, ${color}10 0px, ${color}10 2px, transparent 2px, transparent 20px)`
    default: return ""
  }
}

// ── ImageUpload inline ──────────────────────────────────────────────────────
function ImageUpload({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  async function upload(file: File) {
    setUploading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setUploading(false); return }
    const path = `blocks/${user.id}/${uid()}.${file.name.split(".").pop()}`
    const { error } = await supabase.storage.from("page-assets").upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("page-assets").getPublicUrl(path)
      onChange(publicUrl)
    }
    setUploading(false)
  }
  return (
    <div>
      <div onClick={() => ref.current?.click()}
        style={{ border: "2px dashed rgba(201,168,76,0.3)", borderRadius: 10, padding: "16px", textAlign: "center", cursor: "pointer", background: "rgba(201,168,76,0.04)", transition: "all 0.2s" }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)")}
        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)")}>
        {value ? (
          <img src={value} alt="" style={{ maxHeight: 80, borderRadius: 8, display: "block", margin: "0 auto 8px" }} />
        ) : (
          <div style={{ fontSize: 28, marginBottom: 6 }}>🖼️</div>
        )}
        <p style={{ color: "#8A8478", fontSize: 11, margin: 0 }}>{uploading ? "Upload..." : value ? "Changer l image" : "Clique ou glisse une image"}</p>
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} />
    </div>
  )
}

// ── BlockPreview ────────────────────────────────────────────────────────────
function BlockPreview({ block, theme, dayMode }: { block: Block; theme: PageTheme; dayMode: boolean }) {
  const c = block.content
  const G = dayMode ? "#8B6914" : (theme.primary || "#C9A84C")
  const TEXT = dayMode ? "#111111" : (theme.text || "#F5F0E8")
  const MUTED = dayMode ? "#6B7280" : (theme.muted || "#8A8478")
  const SURFACE = dayMode ? "#F3F4F6" : (theme.surface || "#111009")
  const BG = dayMode ? "#FFFFFF" : (theme.bg || "#080808")
  const FD = theme.fontDisplay || "Cormorant Garamond"
  const FB = theme.fontBody || "DM Sans"

  const s = { fontFamily: `${FB}, sans-serif` }

  switch (block.type) {
    case "profile": return (
      <div style={{ textAlign: "center", padding: "20px 16px 12px", ...s }}>
        {c.avatar
          ? <img src={c.avatar} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px", display: "block", border: `2px solid ${G}50` }} />
          : <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${G},${G}80)`, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: dayMode ? "#fff" : "#080808", fontFamily: `${FD}, serif` }}>{(c.name || "?")[0]?.toUpperCase()}</div>}
        <h2 style={{ color: TEXT, fontSize: 20, fontWeight: 700, margin: "0 0 3px", fontFamily: `${FD}, serif` }}>{c.name || "Mon Nom"}</h2>
        <p style={{ color: MUTED, fontSize: 13, margin: c.badge ? "0 0 7px" : "0" }}>{c.tagline}</p>
        {c.badge && <span style={{ background: `${G}15`, border: `1px solid ${G}30`, borderRadius: 20, padding: "3px 12px", fontSize: 11, color: G }}>{c.badge}</span>}
      </div>
    )
    case "bio": return (
      <div style={{ padding: "4px 16px 12px", textAlign: (c.align as any) || "left", ...s }}>
        <p style={{ color: TEXT, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{c.text || "Texte de bio..."}</p>
      </div>
    )
    case "skills": {
      const tags = (c.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean)
      return (
        <div style={{ padding: "4px 16px 12px", ...s }}>
          {c.title && <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {tags.map((t: string, i: number) => <span key={i} style={{ background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 20, padding: "4px 10px", fontSize: 11, color: G, fontWeight: 600 }}>{t}</span>)}
          </div>
        </div>
      )
    }
    case "cta_button": {
      const btnS: Record<string, React.CSSProperties> = {
        gold: { background: `linear-gradient(90deg,${G},${G}cc)`, color: dayMode ? "#fff" : "#080808", border: "none" },
        neon: { background: `${theme.accent || "#39FF8F"}15`, border: `1.5px solid ${theme.accent || "#39FF8F"}`, color: theme.accent || "#39FF8F" },
        outline: { background: "transparent", border: `2px solid ${G}`, color: G },
        ghost: { background: dayMode ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)", color: TEXT, border: `1px solid ${dayMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.1)"}` },
        red: { background: "rgba(239,68,68,0.12)", border: "1.5px solid #EF4444", color: "#EF4444" },
      }
      return (
        <div style={{ padding: "4px 16px 8px", ...s }}>
          <div style={{ ...btnS[c.style || "gold"], borderRadius: 12, padding: "12px 20px", textAlign: "center", fontSize: 14, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {c.icon && <span>{c.icon}</span>}{c.label || "Bouton"}
          </div>
        </div>
      )
    }
    case "social_links": return (
      <div style={{ padding: "4px 16px 12px", display: "flex", flexDirection: "column", gap: 7, ...s }}>
        {Object.entries(c).slice(0, 3).map(([k, v]) => v ? (
          <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, background: dayMode ? "#F3F4F6" : "rgba(255,255,255,0.04)", border: `1px solid ${dayMode ? "#E5E7EB" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "10px 12px" }}>
            <span style={{ fontSize: 16 }}>🔗</span>
            <span style={{ color: TEXT, fontSize: 13, fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k}</span>
            <ExternalLink size={11} color={MUTED} />
          </div>
        ) : null)}
      </div>
    )
    case "heading": return (
      <div style={{ padding: "10px 16px 6px", textAlign: (c.align as any) || "center", ...s }}>
        <h2 style={{ color: c.color === "primary" ? G : c.color === "accent" ? (theme.accent || "#39FF8F") : TEXT, fontSize: c.size === "xl" ? 32 : c.size === "large" ? 24 : c.size === "small" ? 16 : 20, fontWeight: 700, margin: "0 0 3px", fontFamily: `${FD}, serif` }}>{c.text || "Titre"}</h2>
        {c.subtitle && <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{c.subtitle}</p>}
      </div>
    )
    case "testimonials": return (
      <div style={{ padding: "4px 16px 12px", display: "flex", flexDirection: "column", gap: 8, ...s }}>
        {[[c.name1, c.text1, c.stars1], [c.name2, c.text2, c.stars2]].filter(([n]) => n).map(([n, t, s], i) => (
          <div key={i} style={{ background: `${G}06`, border: `1px solid ${G}15`, borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0 }}>{n}</p>
              <p style={{ color: "#FFD700", fontSize: 11, margin: 0 }}>{"★".repeat(parseInt(String(s || "5")))}</p>
            </div>
            <p style={{ color: MUTED, fontSize: 11, margin: 0, fontStyle: "italic", lineHeight: 1.6 }}>"{t}"</p>
          </div>
        ))}
      </div>
    )
    case "pricing": {
      const plans = [[c.title1, c.price1, c.desc1], [c.title2, c.price2, c.desc2], [c.title3, c.price3, c.desc3]].filter(([t]) => t)
      return (
        <div style={{ padding: "4px 16px 12px", ...s }}>
          {c.title && <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>{c.title}</p>}
          <div style={{ display: "flex", gap: 6 }}>
            {plans.map(([t, p, d], i) => (
              <div key={i} style={{ flex: 1, background: i === 1 ? `${G}12` : dayMode ? "#F3F4F6" : "rgba(255,255,255,0.03)", border: `1px solid ${i === 1 ? G + "40" : dayMode ? "#E5E7EB" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                <p style={{ color: MUTED, fontSize: 9, margin: "0 0 3px", textTransform: "uppercase" }}>{t}</p>
                <p style={{ color: G, fontSize: 18, fontWeight: 700, margin: "0 0 2px", fontFamily: `${FD}, serif` }}>{p}</p>
                <p style={{ color: MUTED, fontSize: 9, margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "image": return c.src ? (
      <div style={{ overflow: "hidden" }}>
        <img src={c.src} alt={c.caption || ""} style={{ width: "100%", maxHeight: 160, objectFit: "cover", display: "block", borderRadius: c.rounded === "circle" ? "50%" : c.rounded === "rounded" ? 10 : 0 }} />
        {c.caption && <p style={{ color: MUTED, fontSize: 10, textAlign: "center", margin: "4px 0", ...s }}>{c.caption}</p>}
      </div>
    ) : <div style={{ padding: "20px 16px", textAlign: "center", color: MUTED, fontSize: 13, ...s }}>🖼️ Aucune image</div>
    case "product": return (
      <div style={{ padding: "4px 16px 12px", ...s }}>
        <div style={{ background: dayMode ? "#F9FAFB" : "rgba(255,255,255,0.03)", border: `1px solid ${dayMode ? "#E5E7EB" : "rgba(255,255,255,0.06)"}`, borderRadius: 12, overflow: "hidden" }}>
          {c.image && <img src={c.image} alt="" style={{ width: "100%", height: 100, objectFit: "cover" }} />}
          <div style={{ padding: "10px 12px" }}>
            <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 3px", fontFamily: `${FD}, serif` }}>{c.name}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: G, fontSize: 16, fontWeight: 700 }}>{c.price}</span>
              {c.old_price && <span style={{ color: MUTED, fontSize: 12, textDecoration: "line-through" }}>{c.old_price}</span>}
            </div>
          </div>
        </div>
      </div>
    )
    case "divider": {
      const dvMap: Record<string, React.ReactNode> = {
        gold: <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${G}60,transparent)` }} />,
        line: <div style={{ height: 1, background: dayMode ? "rgba(0,0,0,0.1)" : "rgba(255,255,255,0.06)" }} />,
        dots: <div style={{ textAlign: "center", color: MUTED, letterSpacing: 8, fontSize: 16 }}>• • •</div>,
        stars: <div style={{ textAlign: "center", color: G, letterSpacing: 8, fontSize: 14 }}>✦ ✦ ✦</div>,
      }
      return <div style={{ padding: "8px 16px" }}>{dvMap[c.style || "gold"]}</div>
    }
    case "spacer": {
      const spMap: Record<string, number> = { xs: 8, sm: 14, md: 24, lg: 40, xl: 60 }
      return <div style={{ height: spMap[c.size || "md"] }} />
    }
    case "contact_form": return (
      <div style={{ padding: "4px 16px 12px", ...s }}>
        {c.title && <h3 style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 10px", fontFamily: `${FD}, serif` }}>{c.title}</h3>}
        {["Nom", "Email", "Message"].map(f => f === "Message"
          ? <div key={f} style={{ height: 50, background: dayMode ? "#F3F4F6" : "rgba(255,255,255,0.04)", border: `1px solid ${dayMode ? "#E5E7EB" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, marginBottom: 6, display: "flex", alignItems: "flex-start", padding: "8px 12px" }}><span style={{ color: MUTED, fontSize: 12 }}>{f}...</span></div>
          : <div key={f} style={{ height: 34, background: dayMode ? "#F3F4F6" : "rgba(255,255,255,0.04)", border: `1px solid ${dayMode ? "#E5E7EB" : "rgba(255,255,255,0.08)"}`, borderRadius: 8, marginBottom: 6, display: "flex", alignItems: "center", padding: "0 12px" }}><span style={{ color: MUTED, fontSize: 12 }}>{f}...</span></div>
        )}
        <div style={{ background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 9, padding: "10px", textAlign: "center", fontSize: 13, fontWeight: 700, color: dayMode ? "#fff" : "#080808" }}>{c.button_label || "Envoyer"}</div>
      </div>
    )
    case "opening_hours": return (
      <div style={{ padding: "4px 16px 12px", ...s }}>
        {c.title && <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>{c.title}</p>}
        <div style={{ background: dayMode ? "#F3F4F6" : "rgba(255,255,255,0.03)", border: `1px solid ${dayMode ? "#E5E7EB" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, overflow: "hidden" }}>
          {[[c.mon_fri, "Lun-Ven"], [c.saturday, "Sam"], [c.sunday, "Dim"]].filter(([h]) => h).map(([h, d], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color: MUTED, fontSize: 11 }}>{d}</span>
              <span style={{ color: TEXT, fontSize: 11, fontWeight: 600 }}>{h}</span>
            </div>
          ))}
        </div>
      </div>
    )
    case "google_maps": return (
      <div style={{ padding: "4px 16px 12px", ...s }}>
        <div style={{ display: "flex", gap: 10, background: "rgba(255,230,109,0.06)", border: "1px solid rgba(255,230,109,0.15)", borderRadius: 12, padding: "12px 14px" }}>
          <span style={{ fontSize: 22 }}>📍</span>
          <div>
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{c.label || "Adresse"}</p>
            <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.address}</p>
          </div>
        </div>
      </div>
    )
    case "countdown": return (
      <div style={{ padding: "12px 16px", textAlign: "center", ...s }}>
        {c.title && <p style={{ color: MUTED, fontSize: 10, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 1.5 }}>{c.title}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
          {[["00", "J"], ["00", "H"], ["00", "M"], ["00", "S"]].map(([v, l], i) => (
            <div key={i} style={{ background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 8, padding: "8px 10px", textAlign: "center" }}>
              <p style={{ color: G, fontSize: 18, fontWeight: 700, margin: 0, fontFamily: `${FD}, serif` }}>{v}</p>
              <p style={{ color: MUTED, fontSize: 9, margin: 0, textTransform: "uppercase" }}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    )
    case "event_info": return (
      <div style={{ padding: "4px 16px 12px", ...s }}>
        <div style={{ background: "rgba(236,72,153,0.07)", border: "1px solid rgba(236,72,153,0.18)", borderRadius: 12, padding: "14px" }}>
          <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 8px", fontFamily: `${FD}, serif` }}>{c.name}</p>
          {[[c.date, "📅"], [c.time, "🕐"], [c.location, "📍"], [c.price, "🎟️"]].filter(([v]) => v).map(([v, i]) => (
            <p key={String(i)} style={{ color: MUTED, fontSize: 11, margin: "3px 0" }}>{i} {v}</p>
          ))}
        </div>
      </div>
    )
    case "promo_banner": return (
      <div style={{ padding: "4px 16px 12px", ...s }}>
        <div style={{ background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)", borderRadius: 12, padding: "14px", textAlign: "center" }}>
          {c.emoji && <span style={{ fontSize: 24, display: "block", marginBottom: 6 }}>{c.emoji}</span>}
          <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 3px", fontFamily: `${FD}, serif` }}>{c.text}</p>
          {c.subtext && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.subtext}</p>}
        </div>
      </div>
    )
    case "menu_section": return (
      <div style={{ padding: "4px 16px 12px", ...s }}>
        {c.category && <p style={{ color: G, fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1.5 }}>{c.category}</p>}
        {[[c.item1_name, c.item1_price], [c.item2_name, c.item2_price], [c.item3_name, c.item3_price]].filter(([n]) => n).map(([n, p], i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ color: TEXT, fontSize: 12 }}>{n}</span>
            <span style={{ color: G, fontSize: 12, fontWeight: 700 }}>{p}</span>
          </div>
        ))}
      </div>
    )
    case "services_list": return (
      <div style={{ padding: "4px 16px 12px", display: "flex", flexDirection: "column", gap: 7, ...s }}>
        {[[c.s1_icon, c.s1_name, c.s1_desc], [c.s2_icon, c.s2_name, c.s2_desc], [c.s3_icon, c.s3_name, c.s3_desc]].filter(([, n]) => n).map(([icon, name, desc], i) => (
          <div key={i} style={{ display: "flex", gap: 10, background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 10, padding: "10px 12px" }}>
            <span style={{ fontSize: 18 }}>{icon}</span>
            <div>
              <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0 }}>{name}</p>
              {desc && <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{desc}</p>}
            </div>
          </div>
        ))}
      </div>
    )
    case "spotify_player": return (
      <div style={{ padding: "4px 16px 12px", ...s }}>
        <div style={{ background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.2)", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ width: 40, height: 40, background: "#1DB954", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎧</div>
          <div>
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.title || "Ma musique"}</p>
            <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Ecouter sur Spotify</p>
          </div>
        </div>
      </div>
    )
    case "faq": return (
      <div style={{ padding: "4px 16px 12px", ...s }}>
        {[[c.q1, c.a1], [c.q2, c.a2]].filter(([q]) => q).map(([q, a], i) => (
          <div key={i} style={{ border: `1px solid ${dayMode ? "#E5E7EB" : "rgba(255,255,255,0.07)"}`, borderRadius: 9, marginBottom: 6, overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: dayMode ? "#F9FAFB" : "rgba(255,255,255,0.02)" }}>
              <span style={{ color: TEXT, fontSize: 12, fontWeight: 600 }}>{q}</span>
              <span style={{ color: G }}>+</span>
            </div>
          </div>
        ))}
      </div>
    )
    default: return (
      <div style={{ padding: "12px 16px", textAlign: "center", ...s }}>
        <span style={{ fontSize: 24 }}>{BLOCK_DEFS[block.type]?.icon || "📦"}</span>
        <p style={{ color: MUTED, fontSize: 12, margin: "4px 0 0" }}>{BLOCK_DEFS[block.type]?.label || block.type}</p>
      </div>
    )
  }
}

// ── Edit Panel ──────────────────────────────────────────────────────────────
function EditPanel({ block, onChange }: { block: Block; onChange: (content: BlockContent) => void }) {
  const def = BLOCK_DEFS[block.type]
  if (!def) return null

  const G = "#C9A84C"; const MUTED = "#8A8478"
  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: 9, padding: "9px 12px", color: "#F5F0E8", fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif",
    transition: "border-color 0.2s"
  }

  return (
    <div style={{ padding: "16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: def.color + "15", border: `1px solid ${def.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{def.icon}</div>
        <div>
          <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: 0 }}>{def.label}</p>
          <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{def.description}</p>
        </div>
      </div>
      <style>{`
        .qrf-input:focus { border-color: rgba(201,168,76,0.5) !important; background: #111009 !important; }
        .qrf-input::placeholder { color: #4A4640; }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {def.fields.map(field => (
          <div key={field.key}>
            <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 5, fontWeight: 500 }}>{field.label}</label>
            {field.type === "image" ? (
              <ImageUpload value={block.content[field.key] || ""} onChange={v => onChange({ ...block.content, [field.key]: v })} />
            ) : field.type === "textarea" ? (
              <textarea className="qrf-input" value={block.content[field.key] || ""} onChange={e => onChange({ ...block.content, [field.key]: e.target.value })}
                placeholder={field.placeholder} rows={3}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
            ) : field.type === "select" ? (
              <select className="qrf-input" value={block.content[field.key] || ""} onChange={e => onChange({ ...block.content, [field.key]: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}>
                {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : field.type === "date" ? (
              <input type="date" className="qrf-input" value={block.content[field.key] || ""} onChange={e => onChange({ ...block.content, [field.key]: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }} />
            ) : (
              <input type={field.type === "url" ? "url" : "text"} className="qrf-input"
                value={block.content[field.key] || ""} onChange={e => onChange({ ...block.content, [field.key]: e.target.value })}
                placeholder={field.placeholder} style={inputStyle} />
            )}
            {field.hint && <p style={{ color: MUTED, fontSize: 10, margin: "3px 0 0", fontStyle: "italic" }}>{field.hint}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Theme Panel ─────────────────────────────────────────────────────────────
function ThemePanel({ theme, onChange }: { theme: PageTheme; onChange: (t: PageTheme) => void }) {
  const G = "#C9A84C"; const MUTED = "#8A8478"
  const [activeTab, setActiveTab] = useState<"presets" | "colors" | "fonts" | "bg">("presets")

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: 9, padding: "9px 12px", color: "#F5F0E8", fontSize: 13,
    outline: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif"
  }

  // Charger Google Fonts pour la preview
  useEffect(() => {
    const families = GOOGLE_FONTS.slice(0, 20).map(f => f.replace(/ /g, "+")).join("&family=")
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?family=${families}:wght@400;700&display=swap`
    document.head.appendChild(link)
  }, [])

  return (
    <div style={{ padding: "14px" }}>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "#0d0c09", borderRadius: 8, padding: 3 }}>
        {(["presets", "colors", "fonts", "bg"] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{ flex: 1, background: activeTab === tab ? "#111009" : "transparent", border: activeTab === tab ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent", borderRadius: 6, padding: "6px 4px", color: activeTab === tab ? "#F5F0E8" : MUTED, fontSize: 10, cursor: "pointer", fontFamily: "DM Sans, sans-serif", fontWeight: activeTab === tab ? 600 : 400 }}>
            {tab === "presets" ? "Thèmes" : tab === "colors" ? "Couleurs" : tab === "fonts" ? "Polices" : "Fond"}
          </button>
        ))}
      </div>

      {activeTab === "presets" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {Object.entries(PRESET_THEMES).map(([key, t]) => (
            <button key={key} onClick={() => onChange(t)}
              style={{ background: t.bg, border: `2px solid ${theme.name === t.name ? t.primary : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: "10px 8px", cursor: "pointer", position: "relative", overflow: "hidden", transition: "border-color 0.2s" }}>
              {/* Mini preview */}
              <div style={{ height: 4, background: `linear-gradient(90deg,${t.primary},${t.accent})`, borderRadius: 2, marginBottom: 6 }} />
              <p style={{ color: t.text, fontSize: 10, fontWeight: 700, margin: "0 0 1px", fontFamily: `${t.fontDisplay}, serif`, textAlign: "left" }}>{t.name}</p>
              <div style={{ display: "flex", gap: 3 }}>
                {[t.primary, t.accent, t.surface].map((c, i) => (
                  <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                ))}
              </div>
              {theme.name === t.name && (
                <div style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, background: G, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={8} color="#080808" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {activeTab === "colors" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { key: "primary", label: "Couleur principale", hint: "Boutons, accents" },
            { key: "accent", label: "Couleur d accent", hint: "Hover, highlights" },
            { key: "bg", label: "Fond principal" },
            { key: "surface", label: "Fond surface" },
            { key: "text", label: "Texte principal" },
            { key: "muted", label: "Texte secondaire" },
          ].map(({ key, label, hint }) => (
            <div key={key}>
              <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 5 }}>{label}</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={(theme as any)[key] || "#000000"} onChange={e => onChange({ ...theme, [key]: e.target.value })}
                  style={{ width: 36, height: 36, borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", cursor: "pointer", background: "transparent" }} />
                <input value={(theme as any)[key] || ""} onChange={e => onChange({ ...theme, [key]: e.target.value })}
                  style={{ ...inputStyle, flex: 1, padding: "7px 10px", fontFamily: "JetBrains Mono, monospace", fontSize: 12 }} />
              </div>
              {hint && <p style={{ color: MUTED, fontSize: 10, margin: "3px 0 0" }}>{hint}</p>}
            </div>
          ))}
        </div>
      )}

      {activeTab === "fonts" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 8 }}>Police titres</label>
            <div style={{ maxHeight: 200, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {GOOGLE_FONTS.map(f => (
                <button key={f} onClick={() => onChange({ ...theme, fontDisplay: f })}
                  style={{ background: theme.fontDisplay === f ? "rgba(201,168,76,0.1)" : "transparent", border: `1px solid ${theme.fontDisplay === f ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.04)"}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: `"${f}", serif`, color: "#F5F0E8", fontSize: 14 }}>{f}</span>
                  {theme.fontDisplay === f && <Check size={11} color="#C9A84C" />}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 8 }}>Police corps</label>
            <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
              {GOOGLE_FONTS.map(f => (
                <button key={f} onClick={() => onChange({ ...theme, fontBody: f })}
                  style={{ background: theme.fontBody === f ? "rgba(201,168,76,0.1)" : "transparent", border: `1px solid ${theme.fontBody === f ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.04)"}`, borderRadius: 7, padding: "8px 12px", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: `"${f}", sans-serif`, color: "#F5F0E8", fontSize: 13 }}>{f}</span>
                  {theme.fontBody === f && <Check size={11} color="#C9A84C" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "bg" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 8 }}>Type de fond</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {(["solid", "gradient", "pattern", "image"] as const).map(mode => (
                <button key={mode} onClick={() => onChange({ ...theme, bgMode: mode })}
                  style={{ background: theme.bgMode === mode ? "rgba(201,168,76,0.1)" : "#0d0c09", border: `1px solid ${theme.bgMode === mode ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.06)"}`, borderRadius: 8, padding: "10px 8px", cursor: "pointer", textAlign: "center" }}>
                  <p style={{ color: theme.bgMode === mode ? "#C9A84C" : MUTED, fontSize: 11, fontWeight: 600, margin: 0 }}>
                    {mode === "solid" ? "🎨 Uni" : mode === "gradient" ? "🌈 Degradé" : mode === "pattern" ? "✦ Motif" : "🖼️ Image"}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {theme.bgMode === "gradient" && (
            <div>
              <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 8 }}>Dégradés prédéfinis</label>
              {[
                "linear-gradient(135deg, #080808 0%, #1a0830 100%)",
                "linear-gradient(135deg, #020C18 0%, #041828 100%)",
                "linear-gradient(135deg, #080808 0%, #1a0808 100%)",
                "linear-gradient(135deg, #04080D 0%, #0A1628 50%, #040808 100%)",
                "linear-gradient(180deg, #080808 0%, #111009 100%)",
                "linear-gradient(135deg, #0A0500 0%, #1A1000 100%)",
              ].map((g, i) => (
                <button key={i} onClick={() => onChange({ ...theme, bgGradient: g })}
                  style={{ width: "100%", height: 32, background: g, border: `2px solid ${theme.bgGradient === g ? "#C9A84C" : "rgba(255,255,255,0.08)"}`, borderRadius: 7, cursor: "pointer", marginBottom: 6 }} />
              ))}
              <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 5 }}>CSS personnalisé</label>
              <input value={theme.bgGradient || ""} onChange={e => onChange({ ...theme, bgGradient: e.target.value })}
                placeholder="linear-gradient(135deg, #000 0%, #111 100%)"
                style={{ ...inputStyle, fontFamily: "JetBrains Mono, monospace", fontSize: 10 }} />
            </div>
          )}

          {theme.bgMode === "pattern" && (
            <div>
              <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 8 }}>Motif</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {(["dots", "grid", "stars", "matrix", "hexagons", "waves"] as const).map(p => (
                  <button key={p} onClick={() => onChange({ ...theme, bgPattern: p })}
                    style={{ height: 50, border: `2px solid ${theme.bgPattern === p ? "#C9A84C" : "rgba(255,255,255,0.06)"}`, borderRadius: 8, cursor: "pointer", position: "relative", overflow: "hidden", background: theme.bg }}>
                    <div style={{ position: "absolute", inset: 0, backgroundImage: patternCSS(p, theme.primary) }} />
                    <span style={{ position: "relative", color: "#F5F0E8", fontSize: 10, fontWeight: 600 }}>{p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {theme.bgMode === "image" && (
            <div>
              <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 5 }}>URL de l image</label>
              <input value={theme.bgImage || ""} onChange={e => onChange({ ...theme, bgImage: e.target.value })}
                placeholder="https://..." style={{ ...inputStyle }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Publish Modal ────────────────────────────────────────────────────────────
function PublishModal({ slug, onClose, onPublish, publishing }: { slug: string; onClose: () => void; onPublish: () => void; publishing: boolean }) {
  const [copied, setCopied] = useState(false)
  const url = typeof window !== "undefined" ? `${window.location.origin}/${slug}` : `https://qrfolio.app/${slug}`

  function copy() {
    navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
      <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "32px", maxWidth: 440, width: "100%", fontFamily: "DM Sans, sans-serif" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🚀</div>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 26, color: "#F5F0E8", fontWeight: 700, margin: "0 0 8px" }}>Publier ta page</h2>
          <p style={{ color: "#8A8478", fontSize: 14, margin: 0, lineHeight: 1.6 }}>Ta page sera visible par tous les visiteurs qui scannent ton QR code.</p>
        </div>

        <div style={{ background: "#0d0c09", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, padding: "14px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <Link size={14} color="#C9A84C" style={{ flexShrink: 0 }} />
          <span style={{ color: "#C9A84C", fontSize: 13, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "JetBrains Mono, monospace" }}>{url}</span>
          <button onClick={copy} style={{ background: copied ? "rgba(57,255,143,0.1)" : "rgba(201,168,76,0.1)", border: `1px solid ${copied ? "rgba(57,255,143,0.3)" : "rgba(201,168,76,0.25)"}`, borderRadius: 7, padding: "5px 10px", color: copied ? "#39FF8F" : "#C9A84C", fontSize: 12, cursor: "pointer", flexShrink: 0, fontFamily: "DM Sans, sans-serif" }}>
            {copied ? "✓ Copié" : "Copier"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "12px", color: "#8A8478", fontSize: 14, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            Annuler
          </button>
          <button onClick={onPublish} disabled={publishing}
            style={{ flex: 2, background: "linear-gradient(90deg,#C9A84C,#b8953f)", border: "none", borderRadius: 12, padding: "12px", color: "#080808", fontSize: 14, fontWeight: 700, cursor: publishing ? "wait" : "pointer", fontFamily: "DM Sans, sans-serif", opacity: publishing ? 0.7 : 1 }}>
            {publishing ? "Publication..." : "Publier maintenant ✓"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Builder ────────────────────────────────────────────────────────────
export default function BuilderV4({ pageId }: { pageId: string }) {
  const [blocks, setBlocks] = useState<Block[]>([])
  const [theme, setTheme] = useState<PageTheme>(PRESET_THEMES.midnight_gold)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rightTab, setRightTab] = useState<"preview" | "edit" | "theme">("preview")
  const [dayMode, setDayMode] = useState(false)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("identity")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pageSlug, setPageSlug] = useState("")
  const [pageStatus, setPageStatus] = useState("draft")
  const [showPublish, setShowPublish] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [pageName, setPageName] = useState("")
  const [demoMode, setDemoMode] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState("")
  const [qrShortCode, setQrShortCode] = useState("")
  const [showQrPanel, setShowQrPanel] = useState(false)
  const [pageStats, setPageStats] = useState({ views: 0, scans: 0, trend: 0 })
  const G = "#C9A84C"; const MUTED = "#8A8478"

  // Load
  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: page } = await supabase.from("pages").select("*").eq("id", pageId).single()
      if (!page) { setDemoMode(true); return }
      setPageSlug(page.slug || "")
      setPageStatus(page.status || "draft")
      setPageName(page.title || "Ma Page")
      if (page.theme && typeof page.theme === "object") setTheme({ ...PRESET_THEMES.midnight_gold, ...page.theme })
      const { data: blks } = await supabase.from("blocks").select("*").eq("page_id", pageId).order("position")
      if (blks) setBlocks(blks.map(b => ({ id: b.id, type: b.type, content: b.content || {}, visible: b.is_visible !== false })))

      // Charger le QR code
      const { data: qr } = await supabase.from("qr_codes").select("short_code, qr_url, total_scans").eq("page_id", pageId).single()
      if (qr) {
        setQrShortCode(qr.short_code || "")
        const appUrl = typeof window !== "undefined" ? window.location.origin : ""
        setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(appUrl + "/q/" + qr.short_code)}&color=C9A84C&bgcolor=080808&margin=10`)
        setPageStats(s => ({ ...s, scans: qr.total_scans || 0 }))
      }

      // Charger les stats de la page
      const { data: pageData } = await supabase.from("pages").select("total_views").eq("id", pageId).single()
      if (pageData) setPageStats(s => ({ ...s, views: pageData.total_views || 0 }))
    }
    load()
  }, [pageId])

  // Load Google Fonts
  useEffect(() => {
    const fonts = [theme.fontDisplay, theme.fontBody].filter(Boolean).map(f => f.replace(/ /g, "+")).join("&family=")
    if (fonts) {
      const id = "qrf-fonts-" + fonts.slice(0, 20)
      if (!document.getElementById(id)) {
        const link = document.createElement("link")
        link.id = id; link.rel = "stylesheet"
        link.href = `https://fonts.googleapis.com/css2?family=${fonts}:wght@400;600;700&display=swap`
        document.head.appendChild(link)
      }
    }
  }, [theme.fontDisplay, theme.fontBody])

  // Auto-save
  const save = useCallback(async (b: Block[], t: PageTheme) => {
    if (demoMode) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from("pages").update({ theme: t, updated_at: new Date().toISOString() }).eq("id", pageId)
    await supabase.from("blocks").delete().eq("page_id", pageId)
    if (b.length > 0) {
      await supabase.from("blocks").insert(b.map((blk, i) => ({ id: blk.id, page_id: pageId, type: blk.type, position: i, content: blk.content, is_visible: blk.visible, styles: {} })))
    }
    setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
  }, [pageId, demoMode])

  function addBlock(type: string) {
    const def = BLOCK_DEFS[type]
    if (!def) return
    const b: Block = { id: uid(), type, content: { ...def.defaultContent }, visible: true }
    const newBlocks = [...blocks, b]
    setBlocks(newBlocks)
    setSelectedId(b.id)
    setRightTab("edit")
    save(newBlocks, theme)
  }

  function updateBlock(id: string, content: BlockContent) {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, content } : b)
    setBlocks(newBlocks)
    save(newBlocks, theme)
  }

  function deleteBlock(id: string) {
    const newBlocks = blocks.filter(b => b.id !== id)
    setBlocks(newBlocks)
    if (selectedId === id) setSelectedId(null)
    save(newBlocks, theme)
  }

  function moveBlock(id: string, dir: -1 | 1) {
    const idx = blocks.findIndex(b => b.id === id)
    if ((dir === -1 && idx === 0) || (dir === 1 && idx === blocks.length - 1)) return
    const newBlocks = [...blocks]
    ;[newBlocks[idx], newBlocks[idx + dir]] = [newBlocks[idx + dir], newBlocks[idx]]
    setBlocks(newBlocks)
    save(newBlocks, theme)
  }

  function toggleVisible(id: string) {
    const newBlocks = blocks.map(b => b.id === id ? { ...b, visible: !b.visible } : b)
    setBlocks(newBlocks)
    save(newBlocks, theme)
  }

  function duplicateBlock(id: string) {
    const b = blocks.find(x => x.id === id)
    if (!b) return
    const clone = { ...b, id: uid() }
    const idx = blocks.findIndex(x => x.id === id)
    const newBlocks = [...blocks.slice(0, idx + 1), clone, ...blocks.slice(idx + 1)]
    setBlocks(newBlocks)
    save(newBlocks, theme)
  }

  function updateTheme(t: PageTheme) {
    setTheme(t)
    save(blocks, t)
  }

  async function publish() {
    setPublishing(true)
    const supabase = createClient()
    await supabase.from("pages").update({ status: "published" }).eq("id", pageId)
    await save(blocks, theme)
    setPageStatus("published")
    setPublishing(false)
  }

  // Filtres
  const filteredBlocks = Object.entries(BLOCK_DEFS).filter(([type, def]) => {
    const matchCat = !activeCategory || def.category === activeCategory
    const matchSearch = !search || def.label.toLowerCase().includes(search.toLowerCase()) || type.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const selected = blocks.find(b => b.id === selectedId)

  // Calcul du style de fond
  function bgStyle(): React.CSSProperties {
    const base = theme.bg || "#080808"
    if (dayMode) return { background: "#FFFFFF" }
    if (theme.bgMode === "gradient" && theme.bgGradient) return { background: theme.bgGradient }
    if (theme.bgMode === "pattern" && theme.bgPattern) return { background: base, backgroundImage: patternCSS(theme.bgPattern, theme.primary) }
    if (theme.bgMode === "image" && theme.bgImage) return { background: base, backgroundImage: `url(${theme.bgImage})`, backgroundSize: "cover", backgroundPosition: "center" }
    return { background: base }
  }

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#080808", fontFamily: "DM Sans, sans-serif" }}>
      {/* Fonts */}
      {showQrPanel && <div onClick={() => setShowQrPanel(false)} style={{ position: "fixed", inset: 0, zIndex: 199 }} />}

      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}} .iphone-scroll::-webkit-scrollbar{display:none}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:2px}
        .qrf-block-item:hover{background:rgba(201,168,76,0.05)!important;border-color:rgba(201,168,76,0.2)!important}
        .block-drag-handle:active{cursor:grabbing}
        @keyframes blockIn{from{opacity:0;transform:scale(0.98) translateY(4px)}to{opacity:1;transform:scale(1) translateY(0)}}
      `}</style>

      {/* ── SIDEBAR GAUCHE — Bibliothèque ─────────────────────────────────── */}
      <div style={{ width: 260, background: "#0A0A0A", borderRight: "1px solid rgba(201,168,76,0.1)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Search */}
        <div style={{ padding: "14px 12px 8px" }}>
          <div style={{ position: "relative" }}>
            <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
            <input value={search} onChange={e => { setSearch(e.target.value); if (e.target.value) setActiveCategory("") }}
              placeholder="Rechercher un bloc..." style={{ width: "100%", background: "#111009", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "8px 8px 8px 30px", color: "#F5F0E8", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
          </div>
        </div>

        {/* Categories */}
        {!search && (
          <div style={{ padding: "0 10px 8px", display: "flex", flexWrap: "wrap", gap: 4 }}>
            {BLOCK_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                style={{ display: "flex", alignItems: "center", gap: 5, background: activeCategory === cat.id ? cat.color + "15" : "transparent", border: `1px solid ${activeCategory === cat.id ? cat.color + "40" : "rgba(255,255,255,0.06)"}`, borderRadius: 16, padding: "4px 8px", cursor: "pointer", transition: "all 0.15s" }}>
                <span style={{ fontSize: 13 }}>{cat.icon}</span>
                <span style={{ color: activeCategory === cat.id ? cat.color : MUTED, fontSize: 10, fontWeight: activeCategory === cat.id ? 700 : 400 }}>{cat.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Category desc */}
        {activeCategory && !search && (
          <div style={{ padding: "0 12px 8px" }}>
            <p style={{ color: MUTED, fontSize: 10, margin: 0, fontStyle: "italic" }}>
              {BLOCK_CATEGORIES.find(c => c.id === activeCategory)?.desc}
            </p>
          </div>
        )}

        {/* Block list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {filteredBlocks.map(([type, def]) => (
              <button key={type}
                className="qrf-block-item"
                onClick={() => addBlock(type)}
                style={{ display: "flex", alignItems: "center", gap: 10, background: "transparent", border: "1px solid transparent", borderRadius: 9, padding: "8px 10px", cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.15s" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: def.color + "15", border: `1px solid ${def.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {def.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{def.label}</p>
                  <p style={{ color: MUTED, fontSize: 10, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{def.description}</p>
                </div>
                <Plus size={12} color={MUTED} style={{ flexShrink: 0, opacity: 0.5 }} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── TOPBAR ─────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ height: 50, background: "#0D0D0D", borderBottom: "1px solid rgba(201,168,76,0.12)", display: "flex", alignItems: "center", padding: "0 16px", gap: 10, flexShrink: 0 }}>
          {/* Back */}
          <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, textDecoration: "none", fontSize: 12, marginRight: 6 }}>
            ← <span style={{ fontFamily: "Cormorant Garamond, serif", color: G, fontSize: 18, fontWeight: 700 }}>QRfolio</span>
          </a>
          <span style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 600, flex: 1 }}>{pageName}</span>

          {/* Status */}
          {demoMode && <span style={{ color: MUTED, fontSize: 11, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 8px" }}>Mode demo — non sauvegarde</span>}

          {/* Save indicator */}
          {saving && <div style={{ width: 14, height: 14, border: "2px solid rgba(201,168,76,0.2)", borderTopColor: G, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />}
          {saved && <span style={{ color: "#39FF8F", fontSize: 11 }}>✓ Sauvegarde</span>}

          {/* Day/Night */}
          <button onClick={() => setDayMode(d => !d)} title={dayMode ? "Mode nuit" : "Mode jour"}
            style={{ width: 30, height: 30, background: dayMode ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)", border: `1px solid ${dayMode ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.08)"}`, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: dayMode ? "#F59E0B" : MUTED }}>
            {dayMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          {/* QR Code button */}
          {qrCodeUrl && (
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowQrPanel(p => !p)}
                style={{ display: "flex", alignItems: "center", gap: 6, background: showQrPanel ? "rgba(201,168,76,0.15)" : "rgba(201,168,76,0.08)", border: `1px solid ${showQrPanel ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)"}`, borderRadius: 8, padding: "5px 12px", color: G, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <span style={{ fontSize: 14 }}>⬛</span> QR Code
              </button>

              {showQrPanel && (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#161616", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 16, padding: "20px", zIndex: 200, boxShadow: "0 8px 40px rgba(0,0,0,0.6)", width: 220 }}>
                  <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 700, margin: "0 0 12px", textAlign: "center", fontFamily: "Cormorant Garamond, serif" }}>Mon QR Code</p>

                  {/* QR image */}
                  <div style={{ background: "#080808", borderRadius: 12, padding: 12, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(201,168,76,0.15)" }}>
                    <img src={qrCodeUrl} alt="QR Code" style={{ width: 140, height: 140, imageRendering: "pixelated" }} />
                  </div>

                  {/* URL courte */}
                  <div style={{ background: "#0A0A0A", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "8px 10px", marginBottom: 10 }}>
                    <p style={{ color: MUTED, fontSize: 9, margin: "0 0 2px", textTransform: "uppercase", letterSpacing: 1 }}>URL de scan</p>
                    <p style={{ color: G, fontSize: 11, margin: 0, fontFamily: "JetBrains Mono, monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {typeof window !== "undefined" ? window.location.origin : ""}/q/{qrShortCode}
                    </p>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 6 }}>
                    <a href={qrCodeUrl} download="qrcode.png"
                      style={{ flex: 1, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 8, padding: "8px", color: G, textDecoration: "none", fontSize: 11, fontWeight: 600, textAlign: "center" }}>
                      ↓ PNG
                    </a>
                    <a href="/dashboard/qr-codes"
                      style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "8px", color: MUTED, textDecoration: "none", fontSize: 11, textAlign: "center" }}>
                      Perso →
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Preview plein ecran */}
          {pageStatus === "published" && pageSlug && (
            <a href={`/${pageSlug}`} target="_blank" rel="noopener noreferrer"
              style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "5px 10px", color: MUTED, textDecoration: "none", fontSize: 12 }}>
              <ExternalLink size={12} /> Voir
            </a>
          )}

          {/* Devices */}
          <div style={{ display: "flex", gap: 2 }}>
            <button style={{ width: 28, height: 28, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: MUTED }}>
              <Smartphone size={12} />
            </button>
          </div>

          {/* Publish */}
          <button onClick={() => setShowPublish(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: pageStatus === "published" ? "rgba(57,255,143,0.1)" : "linear-gradient(90deg,#C9A84C,#b8953f)", border: pageStatus === "published" ? "1px solid rgba(57,255,143,0.3)" : "none", borderRadius: 10, padding: "9px 22px", color: pageStatus === "published" ? "#39FF8F" : "#080808", fontSize: 14, fontWeight: 700, cursor: "pointer", boxShadow: pageStatus === "published" ? "none" : "0 4px 20px rgba(201,168,76,0.35)" }}>
            {pageStatus === "published" ? <><Check size={13} /> Publie</> : "Publier"}
          </button>
        </div>

        {/* ── CANVAS ────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px", display: "flex", justifyContent: "center", background: "#101010", backgroundImage: "linear-gradient(rgba(201,168,76,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(201,168,76,0.04) 1px, transparent 1px)", backgroundSize: "32px 32px" }}>
          <div style={{ width: "100%", maxWidth: 540 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <span style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 6, padding: "2px 10px", fontSize: 11, color: G, fontWeight: 600 }}>CANVAS</span>
              <span style={{ background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "2px 8px", fontSize: 11, color: MUTED }}>{blocks.length} bloc{blocks.length > 1 ? "s" : ""}</span>
            </div>

            {blocks.length === 0 ? (
              <div style={{ border: "2px dashed rgba(201,168,76,0.15)", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
                <p style={{ fontSize: 36, margin: "0 0 12px" }}>✦</p>
                <p style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 600, margin: "0 0 6px" }}>Page vide</p>
                <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Ajoute des blocs depuis la bibliotheque a gauche</p>
              </div>
            ) : (
              blocks.map((block, idx) => {
                const isSelected = selectedId === block.id
                const def = BLOCK_DEFS[block.type]
                return (
                  <div key={block.id}
                    onClick={() => { setSelectedId(block.id); setRightTab("edit") }}
                    style={{ position: "relative", marginBottom: 8, border: `2px solid ${isSelected ? G + "90" : "rgba(255,255,255,0.03)"}`, borderRadius: 14, overflow: "visible", cursor: "pointer", transition: "all 0.2s", opacity: block.visible ? 1 : 0.4, background: "#131313", boxShadow: isSelected ? `0 0 0 1px ${G}30, 0 4px 20px rgba(0,0,0,0.4)` : "none" }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"
                      if (!isSelected) e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.3)"
                      const overlay = e.currentTarget.querySelector(".block-actions-overlay") as HTMLElement
                      const handle = e.currentTarget.querySelector(".block-drag-handle") as HTMLElement
                      if (overlay) overlay.style.opacity = "1"
                      if (handle) handle.style.opacity = "1"
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.borderColor = "rgba(255,255,255,0.03)"
                      if (!isSelected) e.currentTarget.style.boxShadow = "none"
                      const overlay = e.currentTarget.querySelector(".block-actions-overlay") as HTMLElement
                      const handle = e.currentTarget.querySelector(".block-drag-handle") as HTMLElement
                      if (overlay) overlay.style.opacity = "0"
                      if (handle) handle.style.opacity = "0"
                    }}>

                    {/* Overlay actions — apparaissent au hover */}
                    <div className="block-actions-overlay" style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 3, opacity: 0, transition: "opacity 0.15s", zIndex: 10 }}
                      onClick={e => e.stopPropagation()}>
                      <button onClick={() => moveBlock(block.id, -1)} disabled={idx === 0} title="Monter"
                        style={{ width: 24, height: 24, background: "rgba(15,15,15,0.9)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: idx === 0 ? "rgba(255,255,255,0.2)" : "#F5F0E8", cursor: idx === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>
                        <ChevronUp size={11} />
                      </button>
                      <button onClick={() => moveBlock(block.id, 1)} disabled={idx === blocks.length - 1} title="Descendre"
                        style={{ width: 24, height: 24, background: "rgba(15,15,15,0.9)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: idx === blocks.length - 1 ? "rgba(255,255,255,0.2)" : "#F5F0E8", cursor: idx === blocks.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>
                        <ChevronDown size={11} />
                      </button>
                      <button onClick={() => duplicateBlock(block.id)} title="Dupliquer"
                        style={{ width: 24, height: 24, background: "rgba(15,15,15,0.9)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>
                        <Copy size={11} />
                      </button>
                      <button onClick={() => toggleVisible(block.id)} title={block.visible ? "Masquer" : "Afficher"}
                        style={{ width: 24, height: 24, background: "rgba(15,15,15,0.9)", backdropFilter: "blur(4px)", border: "1px solid rgba(255,255,255,0.1)", color: block.visible ? MUTED : "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>
                        {block.visible ? <Eye size={11} /> : <EyeOff size={11} />}
                      </button>
                      <button onClick={() => deleteBlock(block.id)} title="Supprimer"
                        style={{ width: 24, height: 24, background: "rgba(239,68,68,0.15)", backdropFilter: "blur(4px)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6 }}>
                        <Trash2 size={11} />
                      </button>
                    </div>

                    {/* Drag handle — gauche, apparait au hover */}
                    <div className="block-drag-handle" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 20, display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 0.15s", cursor: "grab", zIndex: 10 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {[0,1,2,3,4,5].map(i => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(201,168,76,0.6)" }} />)}
                      </div>
                    </div>

                    {/* Badge type — coin bas gauche, discret */}
                    {isSelected && (
                      <div style={{ position: "absolute", bottom: 6, left: 24, display: "flex", alignItems: "center", gap: 4, background: "rgba(8,8,8,0.85)", backdropFilter: "blur(4px)", border: `1px solid ${G}30`, borderRadius: 6, padding: "2px 7px", zIndex: 10 }}>
                        <span style={{ fontSize: 10 }}>{def?.icon}</span>
                        <span style={{ color: G, fontSize: 9, fontWeight: 700 }}>{def?.label}</span>
                      </div>
                    )}

                    {/* Block preview — pleine largeur, rendu final */}
                    <div style={{ ...bgStyle(), borderRadius: 10, overflow: "hidden", minHeight: 40 }}>
                      <BlockPreview block={block} theme={theme} dayMode={dayMode} />
                    </div>
                  </div>
                )
              })
            )}

            {/* Add block — CTA principal */}
            <button onClick={() => { setActiveCategory("identity"); setSearch("") }}
              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(201,168,76,0.04)", border: "2px dashed rgba(201,168,76,0.2)", borderRadius: 14, padding: "18px", color: MUTED, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 10, transition: "all 0.2s", fontFamily: "DM Sans, sans-serif" }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"
                e.currentTarget.style.color = G
                e.currentTarget.style.background = "rgba(201,168,76,0.08)"
                e.currentTarget.style.transform = "translateY(-1px)"
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(201,168,76,0.1)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"
                e.currentTarget.style.color = MUTED
                e.currentTarget.style.background = "rgba(201,168,76,0.04)"
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
              }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Plus size={14} color={G} />
              </div>
              Ajouter un nouveau bloc
            </button>
          </div>
        </div>
      </div>

      {/* ── PANEL DROIT ───────────────────────────────────────────────────── */}
      <div style={{ width: 340, background: "#161616", borderLeft: "1px solid rgba(201,168,76,0.12)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid rgba(201,168,76,0.1)", flexShrink: 0 }}>
          {(["preview", "edit", "theme"] as const).map(tab => (
            <button key={tab} onClick={() => setRightTab(tab)}
              style={{ flex: 1, padding: "12px 4px", background: "transparent", border: "none", borderBottom: `2px solid ${rightTab === tab ? G : "transparent"}`, color: rightTab === tab ? G : MUTED, fontSize: 12, fontWeight: rightTab === tab ? 700 : 400, cursor: "pointer", fontFamily: "DM Sans, sans-serif", transition: "all 0.15s" }}>
              {tab === "preview" ? "Preview" : tab === "edit" ? "Editer" : "Theme"}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {/* Preview iPhone Mockup */}
          {rightTab === "preview" && (
            <div style={{ padding: "14px 10px" }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Smartphone size={13} color={G} />
                  <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600, margin: 0 }}>Apercu live</p>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#39FF8F", animation: "pulse 2s infinite" }} />
                </div>
                <a href={pageSlug ? `/${pageSlug}` : "#"} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 7, padding: "5px 10px", color: G, textDecoration: "none", fontSize: 11, fontWeight: 600 }}>
                  <ExternalLink size={11} /> Voir
                </a>
              </div>

              {/* iPhone Mockup */}
              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ position: "relative", width: 240, flexShrink: 0 }}>
                  {/* iPhone outer frame */}
                  <div style={{
                    width: 240,
                    background: "linear-gradient(145deg, #2A2A2A, #1A1A1A)",
                    borderRadius: 36,
                    padding: "10px 8px",
                    boxShadow: "0 0 0 1px #3A3A3A, 0 20px 60px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)",
                    position: "relative"
                  }}>
                    {/* Side buttons */}
                    <div style={{ position: "absolute", left: -3, top: 72, width: 3, height: 26, background: "#2A2A2A", borderRadius: "2px 0 0 2px" }} />
                    <div style={{ position: "absolute", left: -3, top: 108, width: 3, height: 40, background: "#2A2A2A", borderRadius: "2px 0 0 2px" }} />
                    <div style={{ position: "absolute", left: -3, top: 158, width: 3, height: 40, background: "#2A2A2A", borderRadius: "2px 0 0 2px" }} />
                    <div style={{ position: "absolute", right: -3, top: 100, width: 3, height: 60, background: "#2A2A2A", borderRadius: "0 2px 2px 0" }} />

                    {/* Screen */}
                    <div style={{
                      borderRadius: 28,
                      overflow: "hidden",
                      position: "relative",
                      background: theme.bg || "#080808",
                      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.5)"
                    }}>
                      {/* Dynamic Island / Notch */}
                      <div style={{ ...bgStyle(), padding: "10px 0 4px", display: "flex", justifyContent: "center", position: "relative" }}>
                        <div style={{ width: 80, height: 22, background: "#000", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
                          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#111", border: "1px solid #222" }} />
                          <div style={{ width: 40, height: 8, borderRadius: 4, background: "#111" }} />
                        </div>
                        {/* Status bar */}
                        <div style={{ position: "absolute", right: 14, top: 6, display: "flex", gap: 4, alignItems: "center" }}>
                          <span style={{ color: dayMode ? "#333" : "#F5F0E8", fontSize: 7, fontWeight: 600, opacity: 0.6 }}>9:41</span>
                          <div style={{ display: "flex", gap: 1 }}>
                            {[3,2,1].map(i => <div key={i} style={{ width: 2, height: i * 2 + 2, background: dayMode ? "#333" : "#F5F0E8", opacity: 0.5, borderRadius: 1 }} />)}
                          </div>
                          <div style={{ width: 12, height: 6, border: `1px solid ${dayMode ? "#333" : "#F5F0E8"}`, borderRadius: 2, opacity: 0.5, position: "relative" }}>
                            <div style={{ width: "80%", height: "100%", background: "#39FF8F", borderRadius: 1 }} />
                          </div>
                        </div>
                      </div>

                      {/* Page content */}
                      <div style={{ maxHeight: 440, overflowY: "auto", ...bgStyle() }}
                        className="iphone-scroll">
                        {blocks.filter(b => b.visible).length === 0 ? (
                          <div style={{ padding: "40px 16px", textAlign: "center" }}>
                            <p style={{ fontSize: 28, margin: "0 0 8px" }}>✦</p>
                            <p style={{ color: MUTED, fontSize: 11 }}>Ta page apparaitra ici</p>
                          </div>
                        ) : (
                          blocks.filter(b => b.visible).map(block => (
                            <div key={block.id}
                              onClick={() => { setSelectedId(block.id); setRightTab("edit") }}
                              style={{ cursor: "pointer", transition: "opacity 0.15s" }}
                              onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                              onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                              <BlockPreview block={block} theme={theme} dayMode={dayMode} />
                            </div>
                          ))
                        )}
                        {/* Branding */}
                        <div style={{ padding: "10px", textAlign: "center", borderTop: `1px solid ${dayMode ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)"}` }}>
                          <p style={{ color: MUTED, fontSize: 8, margin: 0, opacity: 0.4, fontFamily: "DM Sans, sans-serif" }}>Cree avec QRfolio</p>
                        </div>
                      </div>

                      {/* Home indicator */}
                      <div style={{ ...bgStyle(), padding: "6px 0 8px", display: "flex", justifyContent: "center" }}>
                        <div style={{ width: 80, height: 4, background: dayMode ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.2)", borderRadius: 2 }} />
                      </div>
                    </div>
                  </div>

                  {/* Reflet */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 36, background: "linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%)", pointerEvents: "none" }} />
                </div>
              </div>

              {/* QR Code + Stats sous l iPhone */}
              <div style={{ marginTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>

                {/* QR Code */}
                {qrCodeUrl ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                    <div style={{ background: "#080808", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 14, padding: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
                      <img src={qrCodeUrl} alt="QR" style={{ width: 90, height: 90, imageRendering: "pixelated", display: "block" }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: pageStatus === "published" ? "#39FF8F" : MUTED, boxShadow: pageStatus === "published" ? "0 0 6px #39FF8F60" : "none" }} />
                      <span style={{ color: MUTED, fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}>/q/{qrShortCode}</span>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: "#080808", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, padding: 16, textAlign: "center", width: 110 }}>
                    <p style={{ fontSize: 28, margin: "0 0 4px" }}>⬛</p>
                    <p style={{ color: MUTED, fontSize: 9, margin: 0 }}>QR apres publication</p>
                  </div>
                )}

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, width: "100%" }}>
                  <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <p style={{ color: "#C9A84C", fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{pageStats.views.toLocaleString("fr-FR")}</p>
                    <p style={{ color: MUTED, fontSize: 9, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>👁 Vues</p>
                  </div>
                  <div style={{ background: "rgba(57,255,143,0.06)", border: "1px solid rgba(57,255,143,0.15)", borderRadius: 10, padding: "10px 12px", textAlign: "center" }}>
                    <p style={{ color: "#39FF8F", fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{pageStats.scans.toLocaleString("fr-FR")}</p>
                    <p style={{ color: MUTED, fontSize: 9, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>📱 Scans</p>
                  </div>
                </div>

                {/* Status + blocs */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: pageStatus === "published" ? "#39FF8F" : MUTED }} />
                  <span style={{ color: MUTED, fontSize: 10 }}>{pageStatus === "published" ? "En ligne" : "Brouillon"} • {blocks.filter(b => b.visible).length} bloc{blocks.filter(b => b.visible).length > 1 ? "s" : ""}</span>
                </div>
              </div>
            </div>
          )}

          {/* Edit */}
          {rightTab === "edit" && (
            selected
              ? <EditPanel block={selected} onChange={content => updateBlock(selected.id, content)} />
              : (
                <div style={{ padding: "40px 20px", textAlign: "center" }}>
                  <p style={{ fontSize: 32, margin: "0 0 10px" }}>👆</p>
                  <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 600, margin: "0 0 6px" }}>Selectionne un bloc</p>
                  <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>Clique sur un bloc du canvas pour l'editer</p>
                </div>
              )
          )}

          {/* Theme */}
          {rightTab === "theme" && (
            <ThemePanel theme={theme} onChange={updateTheme} />
          )}
        </div>

        {/* Bottom info */}
        <div style={{ padding: "10px 16px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: pageStatus === "published" ? "#39FF8F" : MUTED, boxShadow: pageStatus === "published" ? "0 0 6px #39FF8F60" : "none" }} />
          <span style={{ color: MUTED, fontSize: 11 }}>{pageStatus === "published" ? "Page publiee" : "Brouillon"}</span>
          {pageStatus === "published" && pageSlug && (
            <a href={`/${pageSlug}`} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", color: G, fontSize: 10, textDecoration: "none" }}>
              Voir la page →
            </a>
          )}
        </div>
      </div>

      {/* Publish Modal */}
      {showPublish && (
        <PublishModal
          slug={pageSlug}
          onClose={() => setShowPublish(false)}
          onPublish={async () => { await publish(); setShowPublish(false) }}
          publishing={publishing}
        />
      )}
    </div>
  )
}
