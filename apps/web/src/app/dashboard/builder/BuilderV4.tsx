"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Sparkles, Send, X, ChevronUp, ChevronDown, Trash2, Bot, User as UserIcon,
  Wand2, Eye, Smartphone, Monitor, Plus, Settings, Check, Search,
  Copy, EyeOff, ExternalLink, Palette, Sun, Moon, GripVertical, Star, Clock
} from "lucide-react"
import { BLOCK_DEFS, BLOCK_CATEGORIES, SOCIAL_NETWORKS, PRESET_THEMES, GOOGLE_FONTS, type Block, type BlockContent, type PageTheme } from "./types"
import ImageUpload from "./ImageUpload"
import { createClient } from "@/lib/supabase/client"

type Message = { role: "user" | "assistant"; content: string }

const AI_SYSTEM = `Tu es expert QRfolio. Génère des blocs avec contenu réaliste.
Format: ADD_BLOCK:{"type":"type_id","content":{"key":"value"}}
Types: profile, bio, skills, cta_button, contact_form, calendly, social_links, testimonials, heading, rich_text, faq, image, gallery, video, google_maps, opening_hours, pricing, product, promo_banner, menu_section, services_list, countdown, event_info, spotify_player, music_links, instagram_feed
Réponds en français, sois concis.`

// ── Countdown timer ────────────────────────────────────────────────────────
function CountdownDisplay({ date }: { date: string }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 })
  useEffect(() => {
    function update() {
      const diff = new Date(date).getTime() - Date.now()
      if (diff <= 0) return
      setTime({ d: Math.floor(diff / 86400000), h: Math.floor(diff / 3600000) % 24, m: Math.floor(diff / 60000) % 60, s: Math.floor(diff / 1000) % 60 })
    }
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [date])
  return (
    <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
      {[["d", "J"], ["h", "H"], ["m", "M"], ["s", "S"]].map(([k, l]) => (
        <div key={k} style={{ textAlign: "center", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 10, padding: "10px 14px", minWidth: 52 }}>
          <p style={{ color: "#C9A84C", fontSize: 24, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{String((time as any)[k]).padStart(2, "0")}</p>
          <p style={{ color: "#8A8478", fontSize: 10, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>{l}</p>
        </div>
      ))}
    </div>
  )
}

// ── FAQ Item ───────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden", marginBottom: 6 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: open ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.02)", border: "none", color: "#F5F0E8", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
        {q} <span style={{ color: "#C9A84C", fontSize: 16 }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "10px 14px 14px", background: "rgba(255,255,255,0.02)" }}><p style={{ color: "#8A8478", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{a}</p></div>}
    </div>
  )
}

// ── Block Preview ──────────────────────────────────────────────────────────
function BlockPreview({ block, theme }: { block: Block; theme: PageTheme }) {
  const c = block.content
  const G = theme.primary
  const MUTED = theme.muted
  const TEXT = theme.text

  switch (block.type) {
    case "profile": return (
      <div style={{ textAlign: "center", padding: "22px 18px" }}>
        {c.avatar ? <img src={c.avatar} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px", display: "block", border: `3px solid ${G}60` }} />
          : <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${G},${theme.accent})`, margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, color: "#080808" }}>{(c.name || "?")[0].toUpperCase()}</div>}
        <p style={{ color: TEXT, fontSize: 20, fontWeight: 700, margin: "0 0 4px", fontFamily: theme.fontDisplay }}>{c.name || "Mon Nom"}</p>
        <p style={{ color: MUTED, fontSize: 14, margin: c.badge ? "0 0 8px" : "0" }}>{c.tagline}</p>
        {c.badge && <span style={{ background: `${G}18`, border: `1px solid ${G}40`, borderRadius: 20, padding: "3px 12px", fontSize: 12, color: G }}>{c.badge}</span>}
      </div>
    )
    case "bio": return (
      <div style={{ padding: "14px 18px", textAlign: (c.align as any) || "left" }}>
        <p style={{ color: TEXT, fontSize: 14, lineHeight: 1.7, margin: 0, fontFamily: theme.fontBody }}>{c.text}</p>
      </div>
    )
    case "skills": {
      const tags = (c.tags || "").split(",").map(t => t.trim()).filter(Boolean)
      return (
        <div style={{ padding: "14px 18px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {tags.map((tag, i) => <span key={i} style={{ background: `${G}12`, border: `1px solid ${G}30`, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: G, fontWeight: 600 }}>{tag}</span>)}
          </div>
        </div>
      )
    }
    case "cta_button": {
      const btnS: Record<string, React.CSSProperties> = {
        gold: { background: `linear-gradient(90deg,${G},${G}cc)`, color: "#080808", border: "none" },
        neon: { background: `${theme.accent}15`, border: `1.5px solid ${theme.accent}`, color: theme.accent },
        outline: { background: "transparent", border: `1.5px solid ${G}`, color: G },
        ghost: { background: "rgba(255,255,255,0.06)", color: TEXT, border: "1px solid rgba(255,255,255,0.1)" },
        red: { background: "rgba(239,68,68,0.15)", border: "1.5px solid #EF4444", color: "#EF4444" },
      }
      return (
        <div style={{ padding: "12px 18px" }}>
          <a href={c.url || "#"} style={{ ...btnS[c.style || "gold"], display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, padding: "14px 20px", textDecoration: "none", fontSize: 15, fontWeight: 700, cursor: "pointer", width: c.full_width !== "no" ? "100%" : "auto", boxSizing: "border-box" }}>
            {c.icon && <span>{c.icon}</span>}{c.label || "Bouton"}
          </a>
        </div>
      )
    }
    case "calendly": return (
      <div style={{ padding: "14px 18px" }}>
        <div style={{ background: `${G}08`, border: `1px solid ${G}25`, borderRadius: 14, padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, background: `${G}15`, border: `1px solid ${G}30`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📅</div>
            <div>
              <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>{c.label || "Réserver"}</p>
              {c.description && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.description}</p>}
            </div>
          </div>
          <a href={c.url || "#"} style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, color: "#080808", textAlign: "center", padding: "10px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>{c.label || "Réserver"}</a>
        </div>
      </div>
    )
    case "social_links": {
      const active = SOCIAL_NETWORKS.filter(n => c[n.key])
      return (
        <div style={{ padding: "12px 18px" }}>
          {active.length === 0 ? <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: 0 }}>Aucun réseau configuré</p> :
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {active.map(n => (
                <a key={n.key} href={c[n.key]} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 12, background: n.bg, border: `1px solid ${n.color}30`, borderRadius: 12, padding: "11px 14px", textDecoration: "none" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: n.color + "25", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>{n.icon}</div>
                  <span style={{ color: TEXT, fontSize: 14, fontWeight: 600, flex: 1 }}>{n.label}</span>
                  <ExternalLink size={13} color={n.color} />
                </a>
              ))}
            </div>}
        </div>
      )
    }
    case "instagram_feed": return (
      <div style={{ padding: "14px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, marginBottom: 12 }}>
          {[0,1,2,3,4,5].map(i => <div key={i} style={{ background: "rgba(225,48,108,0.06)", border: "1px solid rgba(225,48,108,0.1)", borderRadius: 6, aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📸</div>)}
        </div>
        {c.username && <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: "0 0 10px" }}>{c.username}</p>}
        {c.cta_label && <a href={c.cta_url || "#"} style={{ display: "block", background: "rgba(225,48,108,0.15)", border: "1px solid rgba(225,48,108,0.3)", color: "#E1306C", textAlign: "center", padding: "10px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>{c.cta_label}</a>}
      </div>
    )
    case "heading": {
      const sizes: Record<string, number> = { small: 16, medium: 22, large: 30, xl: 38 }
      const hColors: Record<string, string> = { default: TEXT, primary: G, accent: theme.accent, muted: MUTED }
      return (
        <div style={{ padding: "16px 18px", textAlign: (c.align as any) || "center" }}>
          <h2 style={{ fontFamily: theme.fontDisplay, fontSize: sizes[c.size || "medium"], color: hColors[c.color || "default"], fontWeight: 700, margin: "0 0 4px" }}>{c.text || "Titre"}</h2>
          {c.subtitle && <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{c.subtitle}</p>}
        </div>
      )
    }
    case "rich_text": {
      const tSizes: Record<string, number> = { small: 12, normal: 14, large: 16 }
      return <div style={{ padding: "10px 18px", textAlign: (c.align as any) || "left" }}><p style={{ color: MUTED, fontSize: tSizes[c.size || "normal"], lineHeight: 1.7, margin: 0 }}>{c.text}</p></div>
    }
    case "faq": return (
      <div style={{ padding: "14px 18px" }}>
        {c.title && <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
        {[[c.q1, c.a1], [c.q2, c.a2], [c.q3, c.a3]].filter(([q]) => q).map(([q, a], i) => <FAQItem key={i} q={q!} a={a || ""} />)}
      </div>
    )
    case "skills": return null
    case "image": return (
      <div style={{ padding: c.src ? 0 : "14px 18px" }}>
        {c.src ? (
          <div>
            <img src={c.src} alt={c.caption || ""} style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block", borderRadius: c.rounded === "circle" ? "50%" : c.rounded === "rounded" ? 12 : 0 }} />
            {c.caption && <p style={{ color: MUTED, fontSize: 11, textAlign: "center", margin: "8px 16px" }}>{c.caption}</p>}
          </div>
        ) : <div style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10, padding: "32px", textAlign: "center" }}><span style={{ fontSize: 32 }}>🖼️</span><p style={{ color: MUTED, fontSize: 12, margin: "8px 0 0" }}>Aucune image</p></div>}
      </div>
    )
    case "gallery": {
      const imgs = [c.img1, c.img2, c.img3, c.img4, c.img5, c.img6].filter(Boolean)
      const cols = parseInt(c.columns || "3")
      return (
        <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: `repeat(${cols},1fr)`, gap: 5 }}>
          {imgs.length > 0 ? imgs.map((img, i) => <img key={i} src={img} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8 }} />)
            : [0,1,2,3,4,5].map(i => <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED }}>🖼️</div>)}
        </div>
      )
    }
    case "video": return (
      <div style={{ padding: "12px 18px" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "28px", textAlign: "center" }}>
          <span style={{ fontSize: 32 }}>▶️</span>
          <p style={{ color: TEXT, fontSize: 14, margin: "10px 0 0", fontWeight: 600 }}>{c.title || "Vidéo"}</p>
        </div>
      </div>
    )
    case "contact_form": return (
      <div style={{ padding: "14px 18px" }}>
        <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>{c.title || "Contact"}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {["Nom", "Email", ...(c.show_phone === "yes" ? ["Téléphone"] : []), "Message"].map(f => <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: f === "Message" ? "8px 12px 40px" : "8px 12px", color: MUTED, fontSize: 12 }}>{f}</div>)}
          <div style={{ background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 8, padding: "11px", textAlign: "center", color: "#080808", fontSize: 13, fontWeight: 700 }}>{c.button_label || "Envoyer"}</div>
        </div>
      </div>
    )
    case "testimonials": {
      const reviews = [[c.name1, c.text1, c.stars1], [c.name2, c.text2, c.stars2], [c.name3, c.text3, c.stars3]].filter(([n]) => n)
      return (
        <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 8 }}>
          {reviews.length === 0 ? <p style={{ color: MUTED, fontSize: 12, margin: 0, textAlign: "center" }}>Aucun avis</p> :
            reviews.map(([n, t, s], i) => (
              <div key={i} style={{ background: `${G}06`, border: `1px solid ${G}12`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>{n}</p>
                  <p style={{ color: "#FFD700", fontSize: 12, margin: 0 }}>{"★".repeat(parseInt(s || "5"))}</p>
                </div>
                <p style={{ color: MUTED, fontSize: 12, margin: 0, fontStyle: "italic" }}>"{t}"</p>
              </div>
            ))}
        </div>
      )
    }
    case "google_maps": return (
      <div style={{ padding: "12px 18px" }}>
        <div style={{ background: "rgba(255,230,109,0.06)", border: "1px solid rgba(255,230,109,0.15)", borderRadius: 12, padding: "14px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span style={{ fontSize: 24, flexShrink: 0 }}>📍</span>
            <div>
              <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{c.label || "Adresse"}</p>
              <p style={{ color: MUTED, fontSize: 12, margin: c.transport ? "0 0 4px" : "0" }}>{c.address}</p>
              {c.transport && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>🚇 {c.transport}</p>}
            </div>
          </div>
        </div>
      </div>
    )
    case "opening_hours": return (
      <div style={{ padding: "14px 18px" }}>
        {c.title && <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>{c.title}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[["Lun — Ven", c.mon_fri], ["Samedi", c.saturday], ["Dimanche", c.sunday]].filter(([, h]) => h).map(([d, h]) => (
            <div key={d} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color: MUTED, fontSize: 13 }}>{d}</span>
              <span style={{ color: TEXT, fontSize: 13, fontWeight: 600 }}>{h}</span>
            </div>
          ))}
          {c.note && <p style={{ color: MUTED, fontSize: 11, margin: "6px 0 0", fontStyle: "italic" }}>{c.note}</p>}
        </div>
      </div>
    )
    case "pricing": {
      const plans = [[c.title1, c.price1, c.desc1], [c.title2, c.price2, c.desc2], [c.title3, c.price3, c.desc3]].filter(([t]) => t)
      return (
        <div style={{ padding: "14px 18px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {plans.map(([t, p, d], i) => (
              <div key={i} style={{ flex: 1, minWidth: 80, background: i === 1 ? `${G}12` : "rgba(255,255,255,0.04)", border: `1px solid ${i === 1 ? G + "40" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "14px 10px", textAlign: "center" }}>
                <p style={{ color: MUTED, fontSize: 10, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>{t}</p>
                <p style={{ color: G, fontSize: 22, fontWeight: 700, margin: "0 0 4px", fontFamily: theme.fontDisplay }}>{p}</p>
                <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "product": return (
      <div style={{ padding: "14px 18px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
          {c.image ? <img src={c.image} alt={c.name} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
            : <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(249,115,22,0.06)", fontSize: 32 }}>🛍️</div>}
          <div style={{ padding: "12px 14px" }}>
            <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 4px" }}>{c.name || "Produit"}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ color: G, fontSize: 18, fontWeight: 700 }}>{c.price}</span>
              {c.old_price && <span style={{ color: MUTED, fontSize: 13, textDecoration: "line-through" }}>{c.old_price}</span>}
            </div>
            {c.description && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 10px", lineHeight: 1.5 }}>{c.description}</p>}
            {c.cta_label && <a href={c.cta_url || "#"} style={{ display: "block", background: `linear-gradient(90deg,${G},${G}cc)`, color: "#080808", textAlign: "center", padding: "10px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>{c.cta_label}</a>}
          </div>
        </div>
      </div>
    )
    case "promo_banner": return (
      <div style={{ padding: "12px 18px" }}>
        <div style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.15),rgba(249,115,22,0.08))", border: "1px solid rgba(249,115,22,0.3)", borderRadius: 12, padding: "14px 16px", textAlign: "center" }}>
          {c.emoji && <span style={{ fontSize: 28 }}>{c.emoji}</span>}
          <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "6px 0 2px" }}>{c.text}</p>
          {c.subtext && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 10px" }}>{c.subtext}</p>}
          {c.cta_label && <a href={c.cta_url || "#"} style={{ display: "inline-block", background: "#F97316", color: "#fff", padding: "8px 20px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>{c.cta_label}</a>}
        </div>
      </div>
    )
    case "menu_section": return (
      <div style={{ padding: "14px 18px" }}>
        {c.category && <p style={{ color: G, fontSize: 13, fontWeight: 700, margin: "0 0 10px", textTransform: "uppercase", letterSpacing: 1 }}>{c.category}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[[c.item1_name, c.item1_price, c.item1_desc], [c.item2_name, c.item2_price, c.item2_desc], [c.item3_name, c.item3_price, c.item3_desc]].filter(([n]) => n).map(([n, p, d], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ flex: 1 }}>
                <p style={{ color: TEXT, fontSize: 14, fontWeight: 600, margin: "0 0 2px" }}>{n}</p>
                {d && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{d}</p>}
              </div>
              <span style={{ color: G, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>{p}</span>
            </div>
          ))}
        </div>
      </div>
    )
    case "reservation_form": return (
      <div style={{ padding: "14px 18px" }}>
        <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>{c.title || "Réserver"}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {["Nom", "Date souhaitée", "Nb de personnes", "Téléphone"].map(f => <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 12px", color: MUTED, fontSize: 12 }}>{f}</div>)}
          {c.phone && <a href={`tel:${c.phone}`} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", padding: "10px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>📞 {c.phone}</a>}
          <div style={{ background: "linear-gradient(90deg,#EF4444,#dc2626)", borderRadius: 8, padding: "11px", textAlign: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>{c.button_label || "Réserver"}</div>
        </div>
      </div>
    )
    case "services_list": {
      const services = [[c.s1_icon, c.s1_name, c.s1_desc], [c.s2_icon, c.s2_name, c.s2_desc], [c.s3_icon, c.s3_name, c.s3_desc]].filter(([, n]) => n)
      return (
        <div style={{ padding: "14px 18px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 12px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {services.map(([icon, name, desc], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 10 }}>
                <span style={{ fontSize: 22 }}>{icon}</span>
                <div>
                  <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: 0 }}>{name}</p>
                  {desc && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{desc}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "countdown": return (
      <div style={{ padding: "16px 18px", textAlign: "center" }}>
        {c.title && <p style={{ color: MUTED, fontSize: 12, margin: "0 0 14px", textTransform: "uppercase", letterSpacing: 1 }}>{c.title}</p>}
        <CountdownDisplay date={c.date || "2025-12-31"} />
        {c.subtitle && <p style={{ color: MUTED, fontSize: 12, margin: "12px 0 0" }}>{c.subtitle}</p>}
      </div>
    )
    case "event_info": return (
      <div style={{ padding: "14px 18px" }}>
        <div style={{ background: "rgba(236,72,153,0.08)", border: "1px solid rgba(236,72,153,0.2)", borderRadius: 14, padding: "16px" }}>
          <p style={{ color: TEXT, fontSize: 18, fontWeight: 700, margin: "0 0 12px", fontFamily: theme.fontDisplay }}>{c.name}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {[[" 📅", c.date], ["🕐", c.time], ["📍", c.location], ["🎟️", c.price]].filter(([, v]) => v).map(([icon, val]) => (
              <p key={icon} style={{ color: MUTED, fontSize: 13, margin: 0 }}>{icon} {val}</p>
            ))}
          </div>
          {c.cta_label && <a href={c.cta_url || "#"} style={{ display: "block", background: "#EC4899", color: "#fff", textAlign: "center", padding: "10px", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>{c.cta_label}</a>}
        </div>
      </div>
    )
    case "spotify_player": return (
      <div style={{ padding: "14px 18px" }}>
        <div style={{ background: "rgba(29,185,84,0.08)", border: "1px solid rgba(29,185,84,0.2)", borderRadius: 14, padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 48, height: 48, background: "#1DB954", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🎧</div>
          <div style={{ flex: 1 }}>
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{c.title || "Ma musique"}</p>
            <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.url ? "Écouter sur Spotify" : "URL non configurée"}</p>
          </div>
          <a href={c.url || "#"} style={{ background: "#1DB954", color: "#000", padding: "6px 14px", borderRadius: 20, textDecoration: "none", fontSize: 12, fontWeight: 700 }}>▶ Play</a>
        </div>
      </div>
    )
    case "music_links": {
      const platforms = [["spotify", "🎵", "#1DB954", "Spotify"], ["apple_music", "🍎", "#FC3C44", "Apple Music"], ["deezer", "🎶", "#A238FF", "Deezer"], ["youtube_music", "▶️", "#FF0000", "YouTube Music"], ["soundcloud", "☁️", "#FF5500", "SoundCloud"]].filter(([k]) => c[k as string])
      return (
        <div style={{ padding: "14px 18px" }}>
          {c.artist_name && <p style={{ color: TEXT, fontSize: 15, fontWeight: 700, margin: "0 0 12px", textAlign: "center" }}>{c.artist_name}</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {platforms.length === 0 ? <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: 0 }}>Aucune plateforme configurée</p> :
              platforms.map(([k, icon, color, label]) => (
                <a key={k} href={(c as any)[k as string]} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 12, background: (color as string) + "12", border: `1px solid ${color}30`, borderRadius: 10, padding: "10px 14px", textDecoration: "none" }}>
                  <span style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ color: TEXT, fontSize: 13, fontWeight: 600, flex: 1 }}>{label}</span>
                  <ExternalLink size={12} color={color as string} />
                </a>
              ))}
          </div>
        </div>
      )
    }
    case "visit_counter": return (
      <div style={{ padding: "14px 18px", textAlign: "center" }}>
        <p style={{ fontFamily: theme.fontDisplay, fontSize: 38, color: G, fontWeight: 700, margin: "0 0 4px" }}>1 234</p>
        <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{c.label || "visiteurs"}</p>
      </div>
    )
    case "divider": {
      const dStyles: Record<string, React.ReactNode> = {
        gold: <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${G}60,transparent)` }} />,
        line: <div style={{ height: 1, background: "rgba(255,255,255,0.08)" }} />,
        dots: <div style={{ textAlign: "center", color: MUTED, letterSpacing: 8, fontSize: 16 }}>• • •</div>,
        stars: <div style={{ textAlign: "center", color: G, letterSpacing: 8 }}>✦ ✦ ✦</div>,
      }
      return <div style={{ padding: "8px 18px" }}>{dStyles[c.style || "gold"]}</div>
    }
    case "spacer": {
      const sSizes: Record<string, number> = { xs: 8, sm: 16, md: 28, lg: 48, xl: 72 }
      return <div style={{ height: sSizes[c.size || "md"] }} />
    }
    default: {
      const def = BLOCK_DEFS[block.type]
      return <div style={{ padding: "14px 18px", textAlign: "center" }}><span style={{ fontSize: 28 }}>{def?.icon}</span><p style={{ color: MUTED, fontSize: 12, margin: "6px 0 0" }}>{def?.label}</p></div>
    }
  }
}

// ── Edit Panel ─────────────────────────────────────────────────────────────
function EditPanel({ block, onChange }: { block: Block; onChange: (key: string, val: string) => void }) {
  const def = BLOCK_DEFS[block.type]
  if (!def) return null
  const MUTED = "#8A8478"
  const G = "#C9A84C"
  const inputStyle: React.CSSProperties = { width: "100%", background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "9px 11px", color: "#F5F0E8", fontSize: 12, outline: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif" }

  if (block.type === "social_links") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Laisse vide pour masquer le réseau.</p>
        {SOCIAL_NETWORKS.map(n => (
          <div key={n.key}>
            <label style={{ color: MUTED, fontSize: 11, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 15 }}>{n.icon}</span>
              <span style={{ color: n.color, fontWeight: 600 }}>{n.label}</span>
            </label>
            <input type="url" value={block.content[n.key] || ""} onChange={e => onChange(n.key, e.target.value)}
              placeholder={`https://${n.key}.com/...`}
              style={{ ...inputStyle, borderColor: block.content[n.key] ? n.color + "60" : "rgba(201,168,76,0.2)" }}
              onFocus={e => e.target.style.borderColor = n.color + "80"}
              onBlur={e => e.target.style.borderColor = block.content[n.key] ? n.color + "60" : "rgba(201,168,76,0.2)"} />
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
          {field.type === "image" ? <ImageUpload value={block.content[field.key] || ""} onChange={val => onChange(field.key, val)} hint={field.hint} />
          : field.type === "textarea" ? <textarea value={block.content[field.key] || ""} onChange={e => onChange(field.key, e.target.value)} placeholder={field.placeholder} rows={3} style={{ ...inputStyle, resize: "vertical" }} onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"} />
          : field.type === "select" ? <select value={block.content[field.key] || field.options?.[0]} onChange={e => onChange(field.key, e.target.value)} style={inputStyle}>{field.options?.map(o => <option key={o} value={o}>{o}</option>)}</select>
          : <input type={field.type === "url" ? "url" : "text"} value={block.content[field.key] || ""} onChange={e => onChange(field.key, e.target.value)} placeholder={field.placeholder} style={inputStyle} onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"} onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"} />}
          {field.hint && <p style={{ color: MUTED, fontSize: 10, margin: "3px 0 0" }}>{field.hint}</p>}
        </div>
      ))}
    </div>
  )
}

// ── Theme Panel ────────────────────────────────────────────────────────────
function ThemePanel({ theme, onThemeChange }: { theme: PageTheme; onThemeChange: (t: PageTheme) => void }) {
  const MUTED = "#8A8478"
  const G = "#C9A84C"
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>Thèmes prédéfinis</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {Object.entries(PRESET_THEMES).map(([key, t]) => (
            <button key={key} onClick={() => onThemeChange(t)}
              style={{ background: t.bg, border: `2px solid ${theme.name === t.name ? G : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "10px 8px", cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 5 }}>
                {[t.primary, t.accent, t.text].map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c }} />)}
              </div>
              <p style={{ color: t.text, fontSize: 10, fontWeight: 600, margin: 0 }}>{t.name}</p>
              {theme.name === t.name && <div style={{ position: "absolute", top: 4, right: 4, width: 14, height: 14, background: G, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={8} color="#000" /></div>}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>Police d'affichage</p>
        <select value={theme.fontDisplay} onChange={e => onThemeChange({ ...theme, fontDisplay: e.target.value })}
          style={{ width: "100%", background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "8px 10px", color: "#F5F0E8", fontSize: 12, outline: "none" }}>
          {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>Police de corps</p>
        <select value={theme.fontBody} onChange={e => onThemeChange({ ...theme, fontBody: e.target.value })}
          style={{ width: "100%", background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "8px 10px", color: "#F5F0E8", fontSize: 12, outline: "none" }}>
          {GOOGLE_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>Couleur principale</p>
        <div style={{ display: "flex", gap: 8 }}>
          <input type="color" value={theme.primary} onChange={e => onThemeChange({ ...theme, primary: e.target.value })}
            style={{ width: 36, height: 34, border: "none", borderRadius: 6, cursor: "pointer", padding: 0, background: "none" }} />
          <input type="text" value={theme.primary} onChange={e => onThemeChange({ ...theme, primary: e.target.value })}
            style={{ flex: 1, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "8px 10px", color: "#F5F0E8", fontSize: 12, outline: "none", fontFamily: "monospace" }} />
        </div>
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────
export default function BuilderV4({ pageId }: { pageId?: string }) {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "profile", content: { name: "Mon Nom", tagline: "Mon activité" }, visible: true },
    { id: "2", type: "bio", content: { text: "Bienvenue sur ma page !" }, visible: true },
    { id: "3", type: "cta_button", content: { label: "Me contacter", url: "#", style: "gold" }, visible: true },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pageName, setPageName] = useState("Ma Page")
  const [pageSlug, setPageSlug] = useState("ma-page")
  const [theme, setTheme] = useState<PageTheme>(PRESET_THEMES.midnight_gold)
  const [rightPanel, setRightPanel] = useState<"preview" | "edit" | "ai" | "theme">("preview")
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile")
  const [previewDark, setPreviewDark] = useState(true)
  const [activeCategory, setActiveCategory] = useState("identity")
  const [search, setSearch] = useState("")
  const [recentTypes, setRecentTypes] = useState<string[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Salut ! 👋 Décris ton activité et je construis ta page avec du contenu prêt à l'emploi." }])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [history, setHistory] = useState<Block[][]>([[]])
  const [histIdx, setHistIdx] = useState(0)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // Load Google Fonts
  useEffect(() => {
    const fonts = [theme.fontDisplay, theme.fontBody].filter(Boolean).map(f => f.replace(/ /g, "+")).join("&family=")
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?family=${fonts}&display=swap`
    document.head.appendChild(link)
  }, [theme.fontDisplay, theme.fontBody])

  // Load page
  useEffect(() => {
    if (!pageId) return
    const supabase = createClient()
    supabase.from("pages").select("title,slug,status,theme").eq("id", pageId).single().then(({ data }) => {
      if (data) { setPageName(data.title); setPageSlug(data.slug); if (data.theme) setTheme(data.theme as PageTheme) }
    })
    supabase.from("blocks").select("*").eq("page_id", pageId).order("position").then(({ data }) => {
      if (data?.length) setBlocks(data.map(b => ({ id: b.id, type: b.type, content: b.content || {}, visible: b.is_visible ?? true })))
    })
  }, [pageId])

  // History
  const pushHistory = useCallback((newBlocks: Block[]) => {
    setHistory(h => { const n = h.slice(0, histIdx + 1); n.push(newBlocks); return n.slice(-30) })
    setHistIdx(h => Math.min(h + 1, 29))
  }, [histIdx])

  // Undo/Redo
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault()
        if (histIdx > 0) { setHistIdx(h => h - 1); setBlocks(history[histIdx - 1] || []) }
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault()
        if (histIdx < history.length - 1) { setHistIdx(h => h + 1); setBlocks(history[histIdx + 1] || []) }
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [histIdx, history])

  // Auto-save
  useEffect(() => {
    if (!pageId) return
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      const supabase = createClient()
      await supabase.from("pages").update({ title: pageName, theme }).eq("id", pageId)
      await supabase.from("blocks").delete().eq("page_id", pageId)
      if (blocks.length > 0) {
        await supabase.from("blocks").insert(blocks.map((b, i) => ({ page_id: pageId, type: b.type, position: i, content: b.content, is_visible: b.visible, styles: {} })))
      }
      setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000)
    }, 800)
  }, [blocks, pageName, theme, pageId])

  async function handlePublish() {
    if (!pageId) return
    setPublishing(true)
    await createClient().from("pages").update({ status: "published", published_at: new Date().toISOString() }).eq("id", pageId)
    setPublishing(false); setPublished(true); setTimeout(() => setPublished(false), 3000)
  }

  function addBlock(type: string, content?: BlockContent) {
    const def = BLOCK_DEFS[type]; if (!def) return
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const block: Block = { id, type, content: content || { ...def.defaultContent }, visible: true }
    const next = [...blocks, block]
    pushHistory(next); setBlocks(next)
    setSelectedId(id); setRightPanel("edit")
    setRecentTypes(r => [type, ...r.filter(t => t !== type)].slice(0, 5))
  }

  function duplicateBlock(id: string) {
    const block = blocks.find(b => b.id === id); if (!block) return
    const newId = Date.now().toString(36) + Math.random().toString(36).slice(2)
    const dup: Block = { ...block, id: newId, content: { ...block.content } }
    const idx = blocks.findIndex(b => b.id === id)
    const next = [...blocks.slice(0, idx + 1), dup, ...blocks.slice(idx + 1)]
    pushHistory(next); setBlocks(next); setSelectedId(newId)
  }

  function toggleVisible(id: string) {
    const next = blocks.map(b => b.id === id ? { ...b, visible: !b.visible } : b)
    pushHistory(next); setBlocks(next)
  }

  function removeBlock(id: string) {
    const next = blocks.filter(b => b.id !== id)
    pushHistory(next); setBlocks(next)
    if (selectedId === id) { setSelectedId(null); setRightPanel("preview") }
  }

  function moveBlock(id: string, dir: "up" | "down") {
    const idx = blocks.findIndex(b => b.id === id)
    if (dir === "up" && idx === 0) return
    if (dir === "down" && idx === blocks.length - 1) return
    const next = [...blocks]; const s = dir === "up" ? idx - 1 : idx + 1
    ;[next[idx], next[s]] = [next[s], next[idx]]
    pushHistory(next); setBlocks(next)
  }

  function updateBlock(id: string, key: string, value: string) {
    setBlocks(p => p.map(b => b.id === id ? { ...b, content: { ...b.content, [key]: value } } : b))
  }

  function toggleFavorite(type: string) {
    setFavorites(f => f.includes(type) ? f.filter(t => t !== type) : [...f, type])
  }

  function parseAI(text: string) {
    let added = 0
    text.split(/\r?\n/).forEach(line => {
      if (line.startsWith("ADD_BLOCK:")) {
        try { const j = JSON.parse(line.replace("ADD_BLOCK:", "").trim()); addBlock(j.type, j.content); added++ } catch {}
      }
    })
    return added
  }

  async function sendAI(prompt?: string) {
    const msg = (prompt || aiInput).trim(); if (!msg || aiLoading) return
    setAiInput("")
    setMessages(p => [...p, { role: "user", content: msg }])
    setAiLoading(true)
    try {
      const hist = [...messages, { role: "user" as const, content: msg }]
      const res = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: AI_SYSTEM, messages: hist.map(m => ({ role: m.role, content: m.content })) }) })
      const data = await res.json()
      const reply = data.content?.[0]?.text || "Erreur."
      const added = parseAI(reply)
      const clean = reply.split(/\r?\n/).filter((l: string) => !l.startsWith("ADD_BLOCK:")).join("\n").trim()
      setMessages(p => [...p, { role: "assistant", content: clean + (added > 0 ? `\n✅ ${added} bloc${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""} !` : "") }])
    } catch { setMessages(p => [...p, { role: "assistant", content: "Erreur de connexion." }]) }
    setAiLoading(false)
  }

  async function generateFull() {
    setGenerating(true); setRightPanel("ai")
    await sendAI("Génère une page QRfolio complète et professionnelle avec: profil, bio, compétences, réseaux sociaux, bouton CTA, avis clients, formulaire de contact. Contenu d'exemple accrocheur.")
    setGenerating(false)
  }

  // Filtered blocks for library
  const filteredBlocks = Object.entries(BLOCK_DEFS).filter(([type, def]) => {
    if (search) return def.label.toLowerCase().includes(search.toLowerCase()) || def.description.toLowerCase().includes(search.toLowerCase())
    if (activeCategory === "favorites") return favorites.includes(type)
    if (activeCategory === "recent") return recentTypes.includes(type)
    return def.category === activeCategory
  })

  const selectedBlock = blocks.find(b => b.id === selectedId)
  const G = "#C9A84C"
  const MUTED = "#8A8478"
  const SURFACE = "#111009"

  return (
    <div style={{ height: "100vh", background: "#080808", display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif", color: "#F5F0E8", overflow: "hidden" }}>

      {/* TOP BAR */}
      <div style={{ height: 50, background: "#0C0B09", borderBottom: "1px solid rgba(201,168,76,0.12)", display: "flex", alignItems: "center", padding: "0 14px", gap: 10, flexShrink: 0, zIndex: 20 }}>
        <a href="/dashboard" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 17, color: G, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>QRfolio</a>
        <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.08)" }} />
        <input value={pageName} onChange={e => setPageName(e.target.value)} style={{ background: "transparent", border: "none", color: "#F5F0E8", fontSize: 13, outline: "none", width: 140 }} />
        {saving && <span style={{ color: MUTED, fontSize: 10 }}>Enregistrement...</span>}
        {saved && <span style={{ color: "#39FF8F", fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}><Check size={10} /> Enregistré</span>}
        <div style={{ flex: 1 }} />
        {/* Undo/Redo */}
        <div style={{ display: "flex", gap: 3 }}>
          <button onClick={() => { if (histIdx > 0) { setHistIdx(h => h - 1); setBlocks(history[histIdx - 1] || []) } }} disabled={histIdx === 0}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 5, width: 26, height: 26, color: histIdx === 0 ? "#4A4640" : MUTED, cursor: histIdx === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>↩</button>
          <button onClick={() => { if (histIdx < history.length - 1) { setHistIdx(h => h + 1); setBlocks(history[histIdx + 1] || []) } }} disabled={histIdx >= history.length - 1}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 5, width: 26, height: 26, color: histIdx >= history.length - 1 ? "#4A4640" : MUTED, cursor: histIdx >= history.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12 }}>↪</button>
        </div>
        <button onClick={generateFull} disabled={generating} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 7, padding: "5px 11px", color: G, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
          <Wand2 size={11} /> {generating ? "..." : "Générer IA"}
        </button>
        <button onClick={() => setRightPanel(p => p === "theme" ? "preview" : "theme")} style={{ display: "flex", alignItems: "center", gap: 5, background: rightPanel === "theme" ? "rgba(201,168,76,0.15)" : "transparent", border: `1px solid ${rightPanel === "theme" ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)"}`, borderRadius: 7, padding: "5px 11px", color: rightPanel === "theme" ? G : MUTED, fontSize: 11, cursor: "pointer" }}>
          <Palette size={11} /> Thème
        </button>
        <button onClick={() => setRightPanel(p => p === "ai" ? "preview" : "ai")} style={{ display: "flex", alignItems: "center", gap: 5, background: rightPanel === "ai" ? "rgba(201,168,76,0.15)" : "transparent", border: `1px solid ${rightPanel === "ai" ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)"}`, borderRadius: 7, padding: "5px 11px", color: rightPanel === "ai" ? G : MUTED, fontSize: 11, cursor: "pointer" }}>
          <Sparkles size={11} /> IA
        </button>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, overflow: "hidden" }}>
          {([["mobile", <Smartphone key="m" size={11} />], ["desktop", <Monitor key="d" size={11} />]] as const).map(([mode, icon]) => (
            <button key={mode} onClick={() => setPreviewMode(mode as any)} style={{ background: previewMode === mode ? "rgba(201,168,76,0.15)" : "transparent", border: "none", color: previewMode === mode ? G : MUTED, padding: "5px 9px", cursor: "pointer", display: "flex", alignItems: "center" }}>{icon}</button>
          ))}
        </div>
        <button onClick={() => setPreviewDark(d => !d)} title="Jour / Nuit"
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: MUTED }}>
          {previewDark ? <Sun size={12} /> : <Moon size={12} />}
        </button>
        {pageId && <a href={`/${pageSlug}`} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "5px 11px", color: MUTED, fontSize: 11, textDecoration: "none" }}><Eye size={11} /> Aperçu</a>}
        <button onClick={handlePublish} disabled={publishing} style={{ display: "flex", alignItems: "center", gap: 5, background: published ? "rgba(57,255,143,0.15)" : `linear-gradient(90deg,${G},#b8953f)`, border: published ? "1px solid rgba(57,255,143,0.4)" : "none", color: published ? "#39FF8F" : "#080808", padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
          {published ? <><Check size={11} /> Publié !</> : publishing ? "..." : "Publier →"}
        </button>
      </div>

      {/* BODY */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT PANEL */}
        <div style={{ width: 220, background: "#0C0B09", borderRight: "1px solid rgba(201,168,76,0.1)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          {/* Search */}
          <div style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <Search size={12} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un bloc..."
                style={{ width: "100%", background: "#0d0c09", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 7, padding: "7px 7px 7px 26px", color: "#F5F0E8", fontSize: 11, outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.15)"} />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 0 }}><X size={11} /></button>}
            </div>
          </div>
          {/* Categories */}
          {!search && (
            <div style={{ padding: "8px 8px 4px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {[
                  { id: "favorites", label: "⭐", color: "#FFD700", desc: "Favoris" },
                  { id: "recent", label: "🕐", color: "#8A8478", desc: "Récents" },
                  ...BLOCK_CATEGORIES
                ].map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)} title={cat.desc || cat.label}
                    style={{ display: "flex", alignItems: "center", gap: 3, background: activeCategory === cat.id ? `${cat.color}18` : "transparent", border: `1px solid ${activeCategory === cat.id ? cat.color + "40" : "transparent"}`, borderRadius: 6, padding: "3px 6px", color: activeCategory === cat.id ? cat.color : MUTED, fontSize: 10, cursor: "pointer", flexShrink: 0 }}>
                    <span>{cat.icon || cat.label}</span>
                    <span style={{ display: activeCategory === cat.id ? "inline" : "none" }}>{"label" in cat && cat.id !== "favorites" && cat.id !== "recent" ? (cat as any).label : ""}</span>
                  </button>
                ))}
              </div>
              {activeCategory !== "favorites" && activeCategory !== "recent" && (
                <p style={{ color: MUTED, fontSize: 9, margin: "5px 0 0", paddingLeft: 2 }}>
                  {BLOCK_CATEGORIES.find(c => c.id === activeCategory)?.desc}
                </p>
              )}
            </div>
          )}
          {/* Block list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "6px" }}>
            {filteredBlocks.length === 0 ? (
              <div style={{ padding: "20px 10px", textAlign: "center" }}>
                <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>
                  {activeCategory === "favorites" ? "Aucun favori — clique ⭐" : activeCategory === "recent" ? "Aucun bloc récent" : "Aucun résultat"}
                </p>
              </div>
            ) : filteredBlocks.map(([type, def]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", marginBottom: 3 }}>
                <button onClick={() => addBlock(type)}
                  style={{ flex: 1, display: "flex", alignItems: "center", gap: 9, padding: "8px 9px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 12, cursor: "pointer", textAlign: "left", transition: "all 0.15s" }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = `${def.color}10`; el.style.color = "#F5F0E8"; el.style.borderColor = `${def.color}20` }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED; el.style.borderColor = "transparent" }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: `${def.color}12`, border: `1px solid ${def.color}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{def.icon}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "inherit", lineHeight: 1.2 }}>{def.label}</p>
                    <p style={{ margin: 0, fontSize: 9, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3 }}>{def.description}</p>
                  </div>
                </button>
                <button onClick={() => toggleFavorite(type)} style={{ background: "none", border: "none", color: favorites.includes(type) ? "#FFD700" : "#4A4640", cursor: "pointer", padding: "4px", fontSize: 11, flexShrink: 0 }}>
                  ★
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* CENTER CANVAS */}
        <div style={{ flex: 1, background: "#0A0908", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "8px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#4A4640" }}>Canvas</span>
            <span style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "1px 7px", fontSize: 10, color: G }}>{blocks.length}</span>
            {!pageId && <span style={{ color: "#4A4640", fontSize: 9, marginLeft: "auto" }}>Mode démo — non sauvegardé</span>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
            {blocks.length === 0 ? (
              <div style={{ border: "1px dashed rgba(201,168,76,0.1)", borderRadius: 14, padding: "50px 30px", textAlign: "center", color: "#4A4640", maxWidth: 480, margin: "40px auto" }}>
                <Sparkles size={24} style={{ margin: "0 auto 8px", opacity: 0.25 }} />
                <p style={{ margin: 0, fontSize: 13 }}>Ajoute un bloc depuis la bibliothèque →</p>
              </div>
            ) : blocks.map((block, idx) => {
              const def = BLOCK_DEFS[block.type]
              const isSel = block.id === selectedId
              return (
                <div key={block.id} onClick={() => { setSelectedId(block.id); setRightPanel("edit") }}
                  style={{ maxWidth: 640, margin: "0 auto 8px", opacity: block.visible ? 1 : 0.4, background: isSel ? "rgba(201,168,76,0.04)" : SURFACE, border: `1.5px solid ${isSel ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.1)"}`, borderRadius: 12, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", boxShadow: isSel ? "0 0 0 3px rgba(201,168,76,0.07), 0 4px 16px rgba(0,0,0,0.4)" : "0 2px 6px rgba(0,0,0,0.3)" }}>
                  {/* Block header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 12px", background: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <GripVertical size={11} color={MUTED} />
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: `${def?.color || G}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>{def?.icon}</div>
                    <span style={{ color: isSel ? "#F5F0E8" : MUTED, fontSize: 11, fontWeight: 600, flex: 1 }}>{def?.label}</span>
                    {!block.visible && <span style={{ fontSize: 9, color: MUTED, background: "rgba(255,255,255,0.06)", borderRadius: 4, padding: "1px 5px" }}>MASQUÉ</span>}
                    {isSel && <span style={{ fontSize: 9, color: G, background: "rgba(201,168,76,0.08)", borderRadius: 4, padding: "1px 5px" }}>ÉDITION</span>}
                    <div style={{ display: "flex", gap: 2 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => moveBlock(block.id, "up")} disabled={idx === 0} style={{ background: "transparent", border: "none", color: idx === 0 ? "#4A4640" : MUTED, cursor: idx === 0 ? "default" : "pointer", padding: 3, display: "flex" }}><ChevronUp size={11} /></button>
                      <button onClick={() => moveBlock(block.id, "down")} disabled={idx === blocks.length - 1} style={{ background: "transparent", border: "none", color: idx === blocks.length - 1 ? "#4A4640" : MUTED, cursor: idx === blocks.length - 1 ? "default" : "pointer", padding: 3, display: "flex" }}><ChevronDown size={11} /></button>
                      <button onClick={() => duplicateBlock(block.id)} title="Dupliquer" style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", padding: 3, display: "flex" }}><Copy size={11} /></button>
                      <button onClick={() => toggleVisible(block.id)} title="Masquer/Afficher" style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", padding: 3, display: "flex" }}><EyeOff size={11} /></button>
                      <button onClick={() => removeBlock(block.id)} style={{ background: "transparent", border: "none", color: "#FF5252", cursor: "pointer", padding: 3, display: "flex" }}><Trash2 size={11} /></button>
                    </div>
                  </div>
                  {block.visible && <BlockPreview block={block} theme={theme} />}
                </div>
              )
            })}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ width: rightPanel === "ai" ? 340 : 280, background: "#0C0B09", borderLeft: "1px solid rgba(201,168,76,0.1)", display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.2s ease", overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            {([["preview", <Eye key="e" size={11} />, "Preview"], ["edit", <Settings key="s" size={11} />, "Éditer"], ["theme", <Palette key="p" size={11} />, "Thème"], ["ai", <Sparkles key="a" size={11} />, "IA"]] as const).map(([p, icon, label]) => (
              <button key={p} onClick={() => setRightPanel(p)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "9px 2px", background: "transparent", border: "none", borderBottom: `2px solid ${rightPanel === p ? G : "transparent"}`, color: rightPanel === p ? G : MUTED, fontSize: 10, fontWeight: rightPanel === p ? 700 : 400, cursor: "pointer" }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* PREVIEW TAB */}
          {rightPanel === "preview" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: previewMode === "mobile" ? 210 : 252, background: previewDark ? theme.bg : "#FAFAFA", border: previewMode === "mobile" ? "5px solid #1A1812" : "2px solid #1A1812", borderRadius: previewMode === "mobile" ? 28 : 10, overflow: "hidden", boxShadow: "0 0 40px rgba(0,0,0,0.6)" }}>
                {previewMode === "mobile" && <div style={{ height: 8, background: "#1A1812", borderRadius: "0 0 5px 5px", width: 50, margin: "0 auto" }} />}
                <div style={{ minHeight: 360, background: previewDark ? theme.bgGradient || theme.bg : "#FAFAFA" }}>
                  {blocks.filter(b => b.visible).map(b => (
                    <div key={b.id} onClick={() => { setSelectedId(b.id); setRightPanel("edit") }} style={{ cursor: "pointer", outline: selectedId === b.id ? `2px solid ${G}60` : "none" }}>
                      <BlockPreview block={b} theme={previewDark ? theme : { ...theme, bg: "#FAFAFA", surface: "#FFFFFF", text: "#1A1A1A", muted: "#6B7280" }} />
                    </div>
                  ))}
                  {blocks.filter(b => b.visible).length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#4A4640", fontSize: 11 }}>Page vide</div>}
                  <div style={{ textAlign: "center", padding: "10px 0" }}><p style={{ fontSize: 8, color: "#4A4640", margin: 0, letterSpacing: 1 }}>Créé avec QRfolio</p></div>
                </div>
              </div>
            </div>
          )}

          {/* EDIT TAB */}
          {rightPanel === "edit" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              {!selectedBlock ? (
                <div style={{ textAlign: "center", padding: "40px 14px" }}>
                  <Settings size={24} color={MUTED} style={{ margin: "0 auto 8px", opacity: 0.25 }} />
                  <p style={{ color: MUTED, fontSize: 12, margin: 0, lineHeight: 1.6 }}>Clique sur un bloc pour l'éditer</p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ background: `${BLOCK_DEFS[selectedBlock.type]?.color || G}12`, border: `1px solid ${BLOCK_DEFS[selectedBlock.type]?.color || G}25`, borderRadius: 7, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>{BLOCK_DEFS[selectedBlock.type]?.icon}</div>
                    <div>
                      <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 700, margin: 0 }}>{BLOCK_DEFS[selectedBlock.type]?.label}</p>
                      <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{BLOCK_DEFS[selectedBlock.type]?.description}</p>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 4 }}>
                      <button onClick={() => duplicateBlock(selectedBlock.id)} title="Dupliquer" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: MUTED, display: "flex", alignItems: "center", justifyContent: "center" }}><Copy size={11} /></button>
                      <button onClick={() => removeBlock(selectedBlock.id)} title="Supprimer" style={{ background: "rgba(255,82,82,0.07)", border: "1px solid rgba(255,82,82,0.15)", borderRadius: 6, width: 26, height: 26, cursor: "pointer", color: "#FF5252", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 size={11} /></button>
                    </div>
                  </div>
                  <EditPanel block={selectedBlock} onChange={(key, val) => updateBlock(selectedBlock.id, key, val)} />
                </>
              )}
            </div>
          )}

          {/* THEME TAB */}
          {rightPanel === "theme" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
              <ThemePanel theme={theme} onThemeChange={setTheme} />
            </div>
          )}

          {/* AI TAB */}
          {rightPanel === "ai" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 9 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: msg.role === "assistant" ? "rgba(201,168,76,0.12)" : "rgba(57,255,143,0.1)", border: `1px solid ${msg.role === "assistant" ? "rgba(201,168,76,0.3)" : "rgba(57,255,143,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {msg.role === "assistant" ? <Bot size={10} color={G} /> : <UserIcon size={10} color="#39FF8F" />}
                    </div>
                    <div style={{ maxWidth: "85%", background: msg.role === "assistant" ? SURFACE : "rgba(57,255,143,0.06)", border: `1px solid ${msg.role === "assistant" ? "rgba(201,168,76,0.1)" : "rgba(57,255,143,0.2)"}`, borderRadius: msg.role === "user" ? "9px 3px 9px 9px" : "3px 9px 9px 9px", padding: "7px 10px" }}>
                      <p style={{ color: "#F5F0E8", fontSize: 11, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: 7 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={10} color={G} /></div>
                    <div style={{ background: SURFACE, border: "1px solid rgba(201,168,76,0.1)", borderRadius: "3px 9px 9px 9px", padding: "9px 12px", display: "flex", gap: 3 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: G, animation: `bounce 1s ease ${i*0.2}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={messagesEnd} />
              </div>
              <div style={{ padding: "5px 8px", display: "flex", gap: 3, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                {["Freelance", "Restaurant", "Coach", "Artiste", "E-commerce", "Médecin"].map(s => (
                  <button key={s} onClick={() => sendAI(s)} style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 10, padding: "2px 7px", color: MUTED, fontSize: 9, cursor: "pointer" }}>{s}</button>
                ))}
              </div>
              <div style={{ padding: "8px", borderTop: "1px solid rgba(201,168,76,0.1)", display: "flex", gap: 5 }}>
                <input value={aiInput} onChange={e => setAiInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAI() } }}
                  placeholder="Décris ton activité..."
                  style={{ flex: 1, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 7, padding: "8px 10px", color: "#F5F0E8", fontSize: 11, outline: "none" }}
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
      <style>{`@keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}`}</style>
    </div>
  )
}
