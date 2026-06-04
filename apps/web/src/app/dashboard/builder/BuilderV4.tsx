"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Sparkles, Send, X, ChevronUp, ChevronDown, Trash2, Bot, User as UserIcon,
  Wand2, Eye, Smartphone, Monitor, Plus, Settings, Check, Search,
  Copy, EyeOff, ExternalLink, Palette, Sun, Moon, Star, Clock,
  LayoutGrid, Type, Link2, Image, BarChart2, ShoppingBag, Calendar,
  Music, MapPin, Hash, Zap, Globe, Phone, ArrowLeft, Save, Layers
} from "lucide-react"
import { BLOCK_DEFS, BLOCK_CATEGORIES, SOCIAL_NETWORKS, PRESET_THEMES, GOOGLE_FONTS, type Block, type BlockContent, type PageTheme } from "./types"
import ImageUpload from "./ImageUpload"
import { createClient } from "@/lib/supabase/client"

type Message = { role: "user" | "assistant"; content: string }

const AI_SYSTEM = `Tu es expert QRfolio. Genere des blocs avec contenu realiste.
Format: ADD_BLOCK:{"type":"type_id","content":{"key":"value"}}
Types: profile, bio, skills, cta_button, contact_form, calendly, social_links, testimonials, heading, rich_text, faq, image, gallery, video, google_maps, opening_hours, pricing, product, promo_banner, menu_section, services_list, countdown, event_info, spotify_player, music_links, instagram_feed
Reponds en francais, sois concis.`

// ── Countdown timer ─────────────────────────────────────────────────────────
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
        <div key={k} style={{ textAlign: "center", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "8px 12px", minWidth: 44 }}>
          <p style={{ color: "#C9A84C", fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{String((time as any)[k]).padStart(2, "0")}</p>
          <p style={{ color: "#8A8478", fontSize: 9, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>{l}</p>
        </div>
      ))}
    </div>
  )
}

// ── FAQ Item ─────────────────────────────────────────────────────────────────
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, overflow: "hidden", marginBottom: 6 }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "transparent", border: "none", color: "#F5F0E8", fontSize: 12, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
        {q}<span style={{ flexShrink: 0, marginLeft: 8, color: "#C9A84C" }}>{open ? "−" : "+"}</span>
      </button>
      {open && <div style={{ padding: "0 14px 12px" }}><p style={{ color: "#8A8478", fontSize: 12, margin: 0, lineHeight: 1.6 }}>{a}</p></div>}
    </div>
  )
}

// ── Block Preview ─────────────────────────────────────────────────────────────
function BlockPreview({ block, theme }: { block: Block; theme: PageTheme }) {
  const G = theme.primary || "#C9A84C"
  const MUTED = theme.muted || "#8A8478"
  const TEXT = theme.text || "#F5F0E8"
  const c = block.content

  const SOCIAL_MAP: Record<string, { icon: string; color: string }> = {
    instagram: { icon: "📸", color: "#E1306C" }, facebook: { icon: "👥", color: "#1877F2" },
    tiktok: { icon: "🎵", color: "#F5F0E8" }, linkedin: { icon: "💼", color: "#0A66C2" },
    twitter: { icon: "🐦", color: "#1DA1F2" }, youtube: { icon: "▶️", color: "#FF0000" },
    snapchat: { icon: "👻", color: "#FFFC00" }, whatsapp: { icon: "💬", color: "#25D366" },
    telegram: { icon: "✈️", color: "#26A5E4" }, spotify: { icon: "🎧", color: "#1DB954" },
    github: { icon: "💻", color: "#F5F0E8" }, website: { icon: "🌐", color: G },
    email: { icon: "✉️", color: "#39FF8F" }, phone: { icon: "📞", color: "#4ADE80" },
  }

  switch (block.type) {
    case "profile": return (
      <div style={{ textAlign: "center", padding: "20px 16px 14px" }}>
        {c.avatar
          ? <img src={c.avatar} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", margin: "0 auto 10px", display: "block", border: `2px solid ${G}50` }} />
          : <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg,${G},${theme.accent || "#39FF8F"})`, margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#080808", boxShadow: `0 0 20px ${G}30` }}>{(c.name || "M")[0]?.toUpperCase()}</div>}
        <p style={{ color: TEXT, fontSize: 18, fontWeight: 700, margin: "0 0 4px", fontFamily: theme.fontDisplay }}>{c.name || "Mon Nom"}</p>
        <p style={{ color: MUTED, fontSize: 12, margin: c.badge ? "0 0 8px" : "0" }}>{c.tagline}</p>
        {c.badge && <span style={{ background: `${G}15`, border: `1px solid ${G}30`, borderRadius: 20, padding: "3px 10px", fontSize: 11, color: G }}>{c.badge}</span>}
      </div>
    )
    case "bio": return <div style={{ padding: "6px 16px 12px", textAlign: (c.align as any) || "left" }}><p style={{ color: TEXT, fontSize: 13, lineHeight: 1.7, margin: 0 }}>{c.text || "Votre bio..."}</p></div>
    case "skills": {
      const tags = (c.tags || "").split(",").map((t: string) => t.trim()).filter(Boolean)
      return (
        <div style={{ padding: "6px 16px 12px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 8px" }}>{c.title}</p>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {tags.map((tag: string, i: number) => <span key={i} style={{ background: `${G}12`, border: `1px solid ${G}25`, borderRadius: 16, padding: "3px 10px", fontSize: 11, color: G, fontWeight: 600 }}>{tag}</span>)}
          </div>
        </div>
      )
    }
    case "cta_button": {
      const btnStyles: Record<string, React.CSSProperties> = {
        gold: { background: `linear-gradient(90deg,${G},${G}cc)`, color: "#080808", border: "none", boxShadow: `0 4px 16px ${G}35` },
        neon: { background: `${theme.accent || "#39FF8F"}15`, border: `1.5px solid ${theme.accent || "#39FF8F"}`, color: theme.accent || "#39FF8F" },
        outline: { background: "transparent", border: `2px solid ${G}`, color: G },
        ghost: { background: "rgba(255,255,255,0.06)", color: TEXT, border: "1px solid rgba(255,255,255,0.1)" },
        red: { background: "rgba(239,68,68,0.12)", border: "1.5px solid #EF4444", color: "#EF4444" },
      }
      const s = btnStyles[c.style || "gold"]
      return (
        <div style={{ padding: "6px 16px 12px" }}>
          <div style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, borderRadius: 12, padding: "13px 20px", fontSize: 14, fontWeight: 700, width: "100%", boxSizing: "border-box" }}>
            {c.icon && <span>{c.icon}</span>}{c.label || "Bouton CTA"}
          </div>
        </div>
      )
    }
    case "social_links": {
      const active = Object.entries(SOCIAL_MAP).filter(([key]) => c[key])
      return (
        <div style={{ padding: "6px 16px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
          {active.slice(0, 4).map(([key, n]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, background: `${n.color}10`, border: `1px solid ${n.color}25`, borderRadius: 10, padding: "10px 14px" }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
              <span style={{ color: TEXT, fontSize: 12, fontWeight: 600 }}>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
              <ExternalLink size={10} color={n.color} style={{ marginLeft: "auto" }} />
            </div>
          ))}
          {active.length > 4 && <p style={{ color: MUTED, fontSize: 10, textAlign: "center", margin: 0 }}>+{active.length - 4} autres</p>}
          {active.length === 0 && <p style={{ color: MUTED, fontSize: 11, textAlign: "center", margin: 0 }}>Aucun reseau configure</p>}
        </div>
      )
    }
    case "heading": {
      const sizes: Record<string, number> = { small: 15, medium: 20, large: 26, xl: 34 }
      const hColors: Record<string, string> = { default: TEXT, primary: G, accent: theme.accent || "#39FF8F", muted: MUTED }
      return (
        <div style={{ padding: "10px 16px 6px", textAlign: (c.align as any) || "center" }}>
          <p style={{ fontFamily: theme.fontDisplay, fontSize: sizes[c.size || "medium"], color: hColors[c.color || "default"], fontWeight: 700, margin: "0 0 3px" }}>{c.text || "Titre"}</p>
          {c.subtitle && <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.subtitle}</p>}
        </div>
      )
    }
    case "rich_text": return <div style={{ padding: "4px 16px 12px", textAlign: (c.align as any) || "left" }}><p style={{ color: MUTED, fontSize: 12, lineHeight: 1.7, margin: 0 }}>{c.text || "Texte..."}</p></div>
    case "divider": return (
      <div style={{ padding: "8px 16px" }}>
        {c.style === "dots" ? <div style={{ textAlign: "center", color: MUTED, letterSpacing: 8 }}>• • •</div>
          : c.style === "stars" ? <div style={{ textAlign: "center", color: G, letterSpacing: 8 }}>✦ ✦ ✦</div>
          : <div style={{ height: 1, background: c.style === "gold" ? `linear-gradient(90deg,transparent,${G}60,transparent)` : "rgba(255,255,255,0.07)" }} />}
      </div>
    )
    case "spacer": {
      const spSizes: Record<string, number> = { xs: 8, sm: 16, md: 24, lg: 40, xl: 60 }
      return <div style={{ height: spSizes[c.size || "md"] }} />
    }
    case "testimonials": {
      const reviews = [[c.name1, c.text1, c.stars1], [c.name2, c.text2, c.stars2], [c.name3, c.text3, c.stars3]].filter(([n]) => n)
      return reviews.length > 0 ? (
        <div style={{ padding: "6px 16px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
          {reviews.map(([n, t, s], i) => (
            <div key={i} style={{ background: `${G}06`, border: `1px solid ${G}12`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0 }}>{n}</p>
                <p style={{ color: "#FFD700", fontSize: 11, margin: 0 }}>{"★".repeat(parseInt(s || "5"))}</p>
              </div>
              <p style={{ color: MUTED, fontSize: 11, margin: 0, fontStyle: "italic", lineHeight: 1.5 }}>"{t}"</p>
            </div>
          ))}
        </div>
      ) : <div style={{ padding: "12px 16px", textAlign: "center" }}><p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Ajouter des temoignages dans l'editeur</p></div>
    }
    case "faq": return (
      <div style={{ padding: "6px 16px 12px" }}>
        {[[c.q1, c.a1], [c.q2, c.a2], [c.q3, c.a3]].filter(([q]) => q).map(([q, a], i) => <FAQItem key={i} q={q!} a={a || ""} />)}
        {!c.q1 && <p style={{ color: MUTED, fontSize: 11, textAlign: "center", margin: 0 }}>Ajouter des questions dans l'editeur</p>}
      </div>
    )
    case "image": return c.src ? (
      <div><img src={c.src} alt={c.caption || ""} style={{ width: "100%", maxHeight: 260, objectFit: "cover", display: "block", borderRadius: c.rounded === "circle" ? "50%" : c.rounded === "rounded" ? 12 : 0 }} />
        {c.caption && <p style={{ color: MUTED, fontSize: 10, textAlign: "center", margin: "5px 16px" }}>{c.caption}</p>}
      </div>
    ) : <div style={{ margin: "0 16px 12px", height: 100, background: `${G}08`, border: `1px dashed ${G}30`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Ajouter une image</p></div>
    case "gallery": {
      const imgs = [c.img1, c.img2, c.img3, c.img4, c.img5, c.img6].filter(Boolean)
      return imgs.length > 0
        ? <div style={{ padding: "6px 16px 12px", display: "grid", gridTemplateColumns: `repeat(${c.columns || 3}, 1fr)`, gap: 5 }}>{imgs.map((img, i) => <img key={i} src={img} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 7 }} />)}</div>
        : <div style={{ margin: "0 16px 12px", padding: 16, background: `${G}06`, border: `1px dashed ${G}20`, borderRadius: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 5 }}>{[0,1,2,3,4,5].map(i => <div key={i} style={{ aspectRatio: "1", background: "rgba(255,255,255,0.04)", borderRadius: 5 }} />)}</div>
    }
    case "video": return c.url ? (
      <div style={{ padding: "6px 16px 12px" }}>
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, borderRadius: 10, overflow: "hidden" }}>
          <iframe src={c.url.replace("watch?v=", "embed/").replace("youtu.be/", "www.youtube.com/embed/")} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }} allowFullScreen />
        </div>
      </div>
    ) : <div style={{ margin: "0 16px 12px", padding: "20px 16px", background: "rgba(255,0,0,0.05)", border: "1px dashed rgba(255,0,0,0.2)", borderRadius: 10, textAlign: "center" }}><p style={{ color: MUTED, fontSize: 11, margin: 0 }}>▶ Ajouter un lien YouTube/Vimeo</p></div>
    case "contact_form": return (
      <div style={{ padding: "6px 16px 12px" }}>
        {c.title && <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 10px", fontFamily: theme.fontDisplay }}>{c.title}</p>}
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {["Nom", "Email", "Message"].map((f, i) => (
            <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: i === 2 ? "10px 12px" : "10px 12px", color: MUTED, fontSize: 12, height: i === 2 ? 60 : "auto" }}>{f}</div>
          ))}
          <div style={{ background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 9, padding: "11px", textAlign: "center", color: "#080808", fontSize: 12, fontWeight: 700 }}>{c.button_label || "Envoyer"}</div>
        </div>
      </div>
    )
    case "google_maps": return (
      <div style={{ padding: "6px 16px 12px" }}>
        <div style={{ background: "rgba(255,230,109,0.05)", border: "1px solid rgba(255,230,109,0.15)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ fontSize: 20 }}>📍</span>
          <div><p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>{c.label || "Adresse"}</p><p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.address || "Adresse non renseignee"}</p></div>
        </div>
      </div>
    )
    case "opening_hours": return (
      <div style={{ padding: "6px 16px 12px" }}>
        {c.title && <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 8px" }}>{c.title}</p>}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, overflow: "hidden" }}>
          {[["Lun — Ven", c.mon_fri], ["Samedi", c.saturday], ["Dimanche", c.sunday]].filter(([, h]) => h).map(([d, h], i, arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <span style={{ color: MUTED, fontSize: 12 }}>{d}</span><span style={{ color: TEXT, fontSize: 12, fontWeight: 600 }}>{h}</span>
            </div>
          ))}
          {!c.mon_fri && !c.saturday && !c.sunday && <div style={{ padding: "10px 14px" }}><p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Ajouter les horaires dans l'editeur</p></div>}
        </div>
      </div>
    )
    case "pricing": {
      const plans = [[c.title1, c.price1, c.desc1], [c.title2, c.price2, c.desc2], [c.title3, c.price3, c.desc3]].filter(([t]) => t)
      return plans.length > 0 ? (
        <div style={{ padding: "6px 16px 12px" }}>
          {c.title && <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 8px" }}>{c.title}</p>}
          <div style={{ display: "flex", gap: 7 }}>
            {plans.map(([t, p, d], i) => (
              <div key={i} style={{ flex: 1, background: i === 1 ? `${G}10` : "rgba(255,255,255,0.03)", border: `1px solid ${i === 1 ? G + "40" : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                <p style={{ color: MUTED, fontSize: 9, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>{t}</p>
                <p style={{ color: G, fontSize: 20, fontWeight: 700, margin: "0 0 3px", fontFamily: theme.fontDisplay }}>{p}</p>
                <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      ) : <div style={{ padding: "12px 16px", textAlign: "center" }}><p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Configurer les tarifs dans l'editeur</p></div>
    }
    case "product": return (
      <div style={{ padding: "6px 16px 12px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
          {c.image && <img src={c.image} alt="" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />}
          <div style={{ padding: "12px 14px" }}>
            <p style={{ color: TEXT, fontSize: 13, fontWeight: 700, margin: "0 0 4px", fontFamily: theme.fontDisplay }}>{c.name || "Nom du produit"}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
              <span style={{ color: G, fontSize: 16, fontWeight: 700 }}>{c.price || "0€"}</span>
              {c.old_price && <span style={{ color: MUTED, fontSize: 12, textDecoration: "line-through" }}>{c.old_price}</span>}
            </div>
            {c.description && <p style={{ color: MUTED, fontSize: 11, margin: "0 0 8px", lineHeight: 1.5 }}>{c.description}</p>}
            <div style={{ background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 8, padding: "9px", textAlign: "center", color: "#080808", fontSize: 12, fontWeight: 700 }}>{c.cta_label || "Commander"}</div>
          </div>
        </div>
      </div>
    )
    case "promo_banner": return (
      <div style={{ padding: "6px 16px 12px" }}>
        <div style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.12),rgba(249,115,22,0.06))", border: "1px solid rgba(249,115,22,0.25)", borderRadius: 12, padding: "16px 14px", textAlign: "center" }}>
          {c.emoji && <span style={{ fontSize: 26, display: "block", marginBottom: 6 }}>{c.emoji}</span>}
          <p style={{ color: TEXT, fontSize: 14, fontWeight: 700, margin: "0 0 3px", fontFamily: theme.fontDisplay }}>{c.text || "Titre promo"}</p>
          {c.subtext && <p style={{ color: MUTED, fontSize: 11, margin: "0 0 10px" }}>{c.subtext}</p>}
          {c.cta_label && <div style={{ display: "inline-block", background: "#F97316", color: "#fff", padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{c.cta_label}</div>}
        </div>
      </div>
    )
    case "menu_section": return (
      <div style={{ padding: "6px 16px 12px" }}>
        {c.category && <p style={{ color: G, fontSize: 11, fontWeight: 700, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: 1.5 }}>{c.category}</p>}
        <div>
          {[[c.item1_name, c.item1_price, c.item1_desc], [c.item2_name, c.item2_price, c.item2_desc], [c.item3_name, c.item3_price, c.item3_desc]].filter(([n]) => n).map(([n, p, d], i, arr) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
              <div style={{ flex: 1 }}><p style={{ color: TEXT, fontSize: 12, fontWeight: 600, margin: "0 0 2px" }}>{n}</p>{d && <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{d}</p>}</div>
              <span style={{ color: G, fontSize: 12, fontWeight: 700 }}>{p}</span>
            </div>
          ))}
          {!c.item1_name && <p style={{ color: MUTED, fontSize: 11, textAlign: "center", margin: 0 }}>Ajouter les plats dans l'editeur</p>}
        </div>
      </div>
    )
    case "services_list": {
      const svcs = [[c.s1_icon, c.s1_name, c.s1_desc], [c.s2_icon, c.s2_name, c.s2_desc], [c.s3_icon, c.s3_name, c.s3_desc]].filter(([, n]) => n)
      return svcs.length > 0 ? (
        <div style={{ padding: "6px 16px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
          {c.title && <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 4px" }}>{c.title}</p>}
          {svcs.map(([icon, name, desc], i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.12)", borderRadius: 9, padding: "10px 12px" }}>
              <span style={{ fontSize: 20 }}>{icon}</span>
              <div><p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0 }}>{name}</p>{desc && <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{desc}</p>}</div>
            </div>
          ))}
        </div>
      ) : <div style={{ padding: "12px 16px", textAlign: "center" }}><p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Ajouter les services dans l'editeur</p></div>
    }
    case "countdown": return (
      <div style={{ padding: "12px 16px 16px", textAlign: "center" }}>
        {c.title && <p style={{ color: MUTED, fontSize: 10, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: 1.5 }}>{c.title}</p>}
        <CountdownDisplay date={c.date || "2025-12-31"} />
        {c.subtitle && <p style={{ color: MUTED, fontSize: 11, margin: "10px 0 0", lineHeight: 1.5 }}>{c.subtitle}</p>}
      </div>
    )
    case "event_info": return (
      <div style={{ padding: "6px 16px 12px" }}>
        <div style={{ background: "rgba(236,72,153,0.07)", border: "1px solid rgba(236,72,153,0.18)", borderRadius: 12, padding: "14px 14px" }}>
          <p style={{ color: TEXT, fontSize: 16, fontWeight: 700, margin: "0 0 10px", fontFamily: theme.fontDisplay }}>{c.name || "Nom de l'evenement"}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {[["📅", c.date], ["🕐", c.time], ["📍", c.location], ["🎟️", c.price]].filter(([, v]) => v).map(([icon, val]) => (
              <p key={String(icon)} style={{ color: MUTED, fontSize: 11, margin: 0 }}>{icon} {val}</p>
            ))}
          </div>
          {c.cta_label && <div style={{ marginTop: 10, background: "#EC4899", color: "#fff", textAlign: "center", padding: "10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>{c.cta_label}</div>}
        </div>
      </div>
    )
    case "spotify_player": return (
      <div style={{ padding: "6px 16px 12px" }}>
        <div style={{ background: "rgba(29,185,84,0.07)", border: "1px solid rgba(29,185,84,0.18)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 40, height: 40, background: "#1DB954", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎧</div>
          <div style={{ flex: 1 }}><p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: "0 0 1px" }}>{c.title || "Ma musique"}</p><p style={{ color: MUTED, fontSize: 10, margin: 0 }}>Ecouter sur Spotify</p></div>
          {c.url && <div style={{ background: "#1DB954", color: "#000", padding: "5px 12px", borderRadius: 16, fontSize: 11, fontWeight: 700 }}>▶</div>}
        </div>
      </div>
    )
    case "music_links": {
      const platforms = [["spotify", "🎵", "#1DB954", "Spotify"], ["apple_music", "🍎", "#FC3C44", "Apple Music"], ["deezer", "🎶", "#A238FF", "Deezer"], ["youtube_music", "▶️", "#FF0000", "YouTube"]].filter(([k]) => c[k as string])
      return platforms.length > 0 ? (
        <div style={{ padding: "6px 16px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          {platforms.map(([k, icon, color, label]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 10, background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 9, padding: "9px 12px" }}>
              <span style={{ fontSize: 16 }}>{icon}</span>
              <span style={{ color: TEXT, fontSize: 12, fontWeight: 600 }}>{label}</span>
              <ExternalLink size={10} color={color as string} style={{ marginLeft: "auto" }} />
            </div>
          ))}
        </div>
      ) : <div style={{ padding: "12px 16px", textAlign: "center" }}><p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Ajouter vos plateformes musicales</p></div>
    }
    case "visit_counter": return (
      <div style={{ padding: "12px 16px", textAlign: "center" }}>
        <p style={{ fontFamily: theme.fontDisplay, fontSize: 36, color: G, fontWeight: 700, margin: "0 0 3px" }}>1 234</p>
        <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{c.label || "visiteurs"}</p>
      </div>
    )
    case "calendly": return (
      <div style={{ padding: "6px 16px 12px" }}>
        <div style={{ background: `${G}07`, border: `1px solid ${G}20`, borderRadius: 12, padding: "14px" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
            <div style={{ width: 36, height: 36, background: `${G}15`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📅</div>
            <div><p style={{ color: TEXT, fontSize: 12, fontWeight: 700, margin: 0 }}>{c.label || "Reserver"}</p>{c.description && <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{c.description}</p>}</div>
          </div>
          <div style={{ background: `linear-gradient(90deg,${G},${G}cc)`, borderRadius: 8, padding: "10px", textAlign: "center", color: "#080808", fontSize: 12, fontWeight: 700 }}>{c.label || "Reserver un creneau"}</div>
        </div>
      </div>
    )
    case "instagram_feed": return (
      <div style={{ padding: "6px 16px 12px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginBottom: 8 }}>
          {[0,1,2,3,4,5].map(i => <div key={i} style={{ aspectRatio: "1", background: "linear-gradient(135deg,#E1306C20,#E1306C08)", border: "1px solid rgba(225,48,108,0.1)", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 16 }}>📸</span></div>)}
        </div>
        <div style={{ background: "rgba(225,48,108,0.08)", border: "1px solid rgba(225,48,108,0.2)", borderRadius: 8, padding: "9px", textAlign: "center", color: "#E1306C", fontSize: 11, fontWeight: 700 }}>{c.cta_label || "Me suivre"}</div>
      </div>
    )
    default: return <div style={{ padding: "12px 16px", textAlign: "center" }}><p style={{ color: "#8A8478", fontSize: 11, margin: 0 }}>Bloc "{block.type}" — apercu non disponible</p></div>
  }
}

// ── Edit Panel ────────────────────────────────────────────────────────────────
function EditPanel({ block, onChange }: { block: Block; onChange: (key: string, val: string) => void }) {
  const def = BLOCK_DEFS[block.type]
  if (!def) return null
  const MUTED = "#8A8478"
  const G = "#C9A84C"

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)",
    borderRadius: 8, padding: "9px 11px", color: "#F5F0E8", fontSize: 12, outline: "none", boxSizing: "border-box"
  }
  const labelStyle: React.CSSProperties = { color: MUTED, fontSize: 11, display: "block", marginBottom: 5, fontWeight: 500 }

  if (block.type === "social_links") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "8px 10px", marginBottom: 4 }}>
          <p style={{ color: MUTED, fontSize: 10, margin: 0, lineHeight: 1.5 }}>💡 Laisse un champ vide pour masquer le reseau sur ta page.</p>
        </div>
        {SOCIAL_NETWORKS.map(n => (
          <div key={n.key}>
            <label style={{ color: MUTED, fontSize: 11, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 14 }}>{n.icon}</span>
              <span style={{ color: block.content[n.key] ? n.color : MUTED, fontWeight: 600 }}>{n.label}</span>
              {block.content[n.key] && <span style={{ marginLeft: "auto", color: "#39FF8F", fontSize: 10 }}>✓ Actif</span>}
            </label>
            <input type="url" value={block.content[n.key] || ""} onChange={e => onChange(n.key, e.target.value)}
              placeholder={`https://${n.key}.com/monprofil`}
              style={{ ...inputStyle, borderColor: block.content[n.key] ? n.color + "50" : "rgba(201,168,76,0.2)" }}
              onFocus={e => { e.target.style.borderColor = n.color + "80"; e.target.style.background = "#111009" }}
              onBlur={e => { e.target.style.borderColor = block.content[n.key] ? n.color + "50" : "rgba(201,168,76,0.2)"; e.target.style.background = "#0d0c09" }} />
          </div>
        ))}
      </div>
    )
  }

  // Grouper les champs par section si le bloc en a beaucoup
  const fields = def.fields
  const hasImage = fields.some(f => f.type === "image")

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
      {/* Tip contextuel */}
      {block.type === "cta_button" && (
        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "8px 10px" }}>
          <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>💡 Styles: gold (rempli), neon (contour neon), outline (contour), ghost (transparent), red (rouge)</p>
        </div>
      )}
      {block.type === "profile" && (
        <div style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "8px 10px" }}>
          <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>💡 L'avatar peut etre une URL d'image ou laisse vide pour utiliser l'initiale.</p>
        </div>
      )}

      {fields.map(field => (
        <div key={field.key}>
          <label style={labelStyle}>{field.label}</label>
          {field.type === "image"
            ? <ImageUpload value={block.content[field.key] || ""} onChange={val => onChange(field.key, val)} />
            : field.type === "textarea"
            ? <textarea value={block.content[field.key] || ""} onChange={e => onChange(field.key, e.target.value)}
                rows={3} placeholder={field.placeholder}
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }}
                onFocus={e => { e.target.style.borderColor = "rgba(201,168,76,0.5)"; e.target.style.background = "#111009" }}
                onBlur={e => { e.target.style.borderColor = "rgba(201,168,76,0.2)"; e.target.style.background = "#0d0c09" }} />
            : field.type === "select"
            ? <select value={block.content[field.key] || field.options?.[0]} onChange={e => onChange(field.key, e.target.value)}
                style={{ ...inputStyle, cursor: "pointer" }}>
                {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            : field.type === "color"
            ? <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input type="color" value={block.content[field.key] || "#C9A84C"} onChange={e => onChange(field.key, e.target.value)}
                  style={{ width: 36, height: 36, borderRadius: 8, border: "none", background: "none", cursor: "pointer", padding: 0 }} />
                <input type="text" value={block.content[field.key] || "#C9A84C"} onChange={e => onChange(field.key, e.target.value)}
                  style={{ ...inputStyle, flex: 1 }}
                  onFocus={e => { e.target.style.borderColor = "rgba(201,168,76,0.5)"; e.target.style.background = "#111009" }}
                  onBlur={e => { e.target.style.borderColor = "rgba(201,168,76,0.2)"; e.target.style.background = "#0d0c09" }} />
              </div>
            : <input type={field.type === "url" ? "url" : "text"} value={block.content[field.key] || ""}
                onChange={e => onChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = "rgba(201,168,76,0.5)"; e.target.style.background = "#111009" }}
                onBlur={e => { e.target.style.borderColor = "rgba(201,168,76,0.2)"; e.target.style.background = "#0d0c09" }} />
          }
          {field.hint && <p style={{ color: MUTED, fontSize: 10, margin: "3px 0 0", lineHeight: 1.4 }}>{field.hint}</p>}
        </div>
      ))}
    </div>
  )
}

// ── Theme Panel ───────────────────────────────────────────────────────────────
function ThemePanel({ theme, onThemeChange }: { theme: PageTheme; onThemeChange: (t: PageTheme) => void }) {
  const MUTED = "#8A8478"
  const G = "#C9A84C"
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Presets */}
      <div>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>Themes predefinies</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
          {Object.entries(PRESET_THEMES).map(([key, t]) => (
            <button key={key} onClick={() => onThemeChange(t)}
              style={{ background: t.bg, border: `2px solid ${theme.name === t.name ? G : "rgba(255,255,255,0.06)"}`, borderRadius: 10, padding: "10px 8px", cursor: "pointer", textAlign: "left", position: "relative", overflow: "hidden", transition: "border-color 0.2s" }}>
              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                {[t.primary, t.accent, t.text].map((c, i) => <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: c, boxShadow: `0 0 6px ${c}50` }} />)}
              </div>
              <p style={{ color: t.text, fontSize: 10, fontWeight: 600, margin: 0, opacity: 0.9 }}>{t.name}</p>
              {theme.name === t.name && <div style={{ position: "absolute", top: 5, right: 5, width: 16, height: 16, background: G, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}><Check size={9} color="#080808" /></div>}
            </button>
          ))}
        </div>
      </div>

      {/* Couleurs custom */}
      <div>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>Couleurs personnalisees</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[
            ["Couleur principale", "primary"],
            ["Couleur accent", "accent"],
            ["Fond", "bg"],
          ].map(([label, key]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input type="color" value={(theme as any)[key] || "#C9A84C"} onChange={e => onThemeChange({ ...theme, [key]: e.target.value })}
                style={{ width: 32, height: 32, borderRadius: 7, border: "1px solid rgba(255,255,255,0.1)", background: "none", cursor: "pointer", padding: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ color: MUTED, fontSize: 11, margin: "0 0 1px" }}>{label}</p>
                <p style={{ color: (theme as any)[key], fontSize: 10, margin: 0, fontFamily: "monospace" }}>{(theme as any)[key]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Polices */}
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

      {/* Preview theme */}
      <div>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 8px" }}>Apercu</p>
        <div style={{ background: theme.bg, border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "14px", overflow: "hidden" }}>
          <p style={{ fontFamily: theme.fontDisplay, fontSize: 16, color: theme.primary, fontWeight: 700, margin: "0 0 4px" }}>Titre de la page</p>
          <p style={{ fontFamily: theme.fontBody, fontSize: 11, color: theme.muted || "#8A8478", margin: "0 0 8px" }}>Texte de description ici</p>
          <div style={{ background: theme.primary, borderRadius: 6, padding: "7px", textAlign: "center", color: "#080808", fontSize: 11, fontWeight: 700 }}>Bouton CTA</div>
        </div>
      </div>
    </div>
  )
}

// ── Main Builder ──────────────────────────────────────────────────────────────
export default function BuilderV4({ pageId }: { pageId?: string }) {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "profile", content: { name: "Mon Nom", tagline: "Mon activite" }, visible: true },
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
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", content: "Salut ! Decris ton activite et je construis ta page. Ex: restaurant italien, coach sportif..." }])
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

  useEffect(() => {
    const fonts = [theme.fontDisplay, theme.fontBody].filter(Boolean).map(f => f.replace(/ /g, "+")).join("&family=")
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = `https://fonts.googleapis.com/css2?family=${fonts}&display=swap`
    document.head.appendChild(link)
  }, [theme.fontDisplay, theme.fontBody])

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

  const pushHistory = useCallback((newBlocks: Block[]) => {
    setHistory(h => { const n = h.slice(0, histIdx + 1); n.push(newBlocks); return n.slice(-30) })
    setHistIdx(h => Math.min(h + 1, 29))
  }, [histIdx])

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

  useEffect(() => {
    if (!pageId) return
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      const supabase = createClient()
      await supabase.from("pages").update({ title: pageName, theme }).eq("id", pageId)
      await supabase.from("blocks").delete().eq("page_id", pageId)
      if (blocks.length > 0) {
        await supabase.from("blocks").insert(blocks.map((b, i) => ({ page_id: pageId, type: b.type, position: i, content: b.content, is_visible: b.visible })))
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
    const idx = blocks.findIndex(b => b.id === id)
    const next = [...blocks.slice(0, idx + 1), { ...block, id: newId }, ...blocks.slice(idx + 1)]
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
    const next = [...blocks]
    const swap = dir === "up" ? idx - 1 : idx + 1
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    pushHistory(next); setBlocks(next)
  }

  function toggleVisible(id: string) {
    const next = blocks.map(b => b.id === id ? { ...b, visible: !b.visible } : b)
    setBlocks(next)
  }

  function updateBlock(id: string, key: string, val: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, content: { ...b.content, [key]: val } } : b))
  }

  function toggleFavorite(type: string) {
    setFavorites(f => f.includes(type) ? f.filter(t => t !== type) : [...f, type])
  }

  async function sendAI(preset?: string) {
    const text = preset || aiInput.trim()
    if (!text) return
    setAiInput("")
    const userMsg: Message = { role: "user", content: text }
    setMessages(p => [...p, userMsg])
    setAiLoading(true)
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: AI_SYSTEM,
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || "Erreur."
      const added = parseAI(reply)
      const clean = reply.split(/?
/).filter((l: string) => !l.startsWith("ADD_BLOCK:")).join("
").trim()
      setMessages(p => [...p, { role: "assistant", content: clean + (added > 0 ? `
✅ ${added} bloc${added > 1 ? "s" : ""} ajoute${added > 1 ? "s" : ""} !` : "") }])
    } catch { setMessages(p => [...p, { role: "assistant", content: "Erreur de connexion." }]) }
    setAiLoading(false)
  }

  function parseAI(text: string) {
    let added = 0
    text.split(/?
/).forEach(line => {
      if (line.startsWith("ADD_BLOCK:")) {
        try { const j = JSON.parse(line.replace("ADD_BLOCK:", "").trim()); addBlock(j.type, j.content); added++ } catch {}
      }
    })
    return added
  }

  async function generateFull() {
    setGenerating(true)
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: AI_SYSTEM,
          messages: [{ role: "user", content: `Genere une page complete pour: ${pageName}. Ajoute 6-8 blocs varies et bien remplis.` }],
        }),
      })
      const data = await res.json()
      parseAI(data.content?.[0]?.text || "")
    } catch {}
    setGenerating(false)
  }

  // Filtrage blocs bibliothèque
  const filteredBlocks = (() => {
    const entries = Object.entries(BLOCK_DEFS)
    if (search) return entries.filter(([type, def]) => def.label.toLowerCase().includes(search.toLowerCase()) || def.description?.toLowerCase().includes(search.toLowerCase()) || type.toLowerCase().includes(search.toLowerCase()))
    if (activeCategory === "favorites") return entries.filter(([type]) => favorites.includes(type))
    if (activeCategory === "recent") return entries.filter(([type]) => recentTypes.includes(type)).sort((a, b) => recentTypes.indexOf(a[0]) - recentTypes.indexOf(b[0]))
    return entries.filter(([, def]) => def.category === activeCategory)
  })()

  const selectedBlock = blocks.find(b => b.id === selectedId)
  const G = "#C9A84C"
  const MUTED = "#8A8478"
  const SURFACE = "#111009"

  return (
    <div style={{ height: "100vh", background: "#080808", display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif", overflow: "hidden" }}>
      <style>{`
        @keyframes bounce{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        @keyframes slideIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.2);border-radius:2px}
        ::-webkit-scrollbar-thumb:hover{background:rgba(201,168,76,0.4)}
      `}</style>

      {/* ── TOP BAR ── */}
      <div style={{ height: 52, background: "#0C0B09", borderBottom: "1px solid rgba(201,168,76,0.12)", display: "flex", alignItems: "center", gap: 10, padding: "0 16px", flexShrink: 0 }}>
        <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", color: G, fontFamily: "Cormorant Garamond, serif", fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
          <ArrowLeft size={14} style={{ opacity: 0.6 }} />QRfolio
        </a>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)" }} />
        <input value={pageName} onChange={e => setPageName(e.target.value)}
          style={{ background: "transparent", border: "none", color: "#F5F0E8", fontSize: 13, fontWeight: 600, outline: "none", minWidth: 0, flex: "0 1 200px" }}
          onFocus={e => { e.target.style.background = "rgba(255,255,255,0.04)"; e.target.style.borderRadius = "6px"; e.target.style.padding = "3px 8px" }}
          onBlur={e => { e.target.style.background = "transparent"; e.target.style.padding = "0" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
          {saving && <span style={{ color: MUTED, fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}><Save size={10} style={{ animation: "pulse 1s infinite" }} />Sauvegarde...</span>}
          {saved && <span style={{ color: "#39FF8F", fontSize: 10, display: "flex", alignItems: "center", gap: 3 }}><Check size={10} />Sauvegarde</span>}
        </div>
        <div style={{ flex: 1 }} />
        {/* Undo/Redo */}
        <div style={{ display: "flex", gap: 2 }}>
          <button onClick={() => { if (histIdx > 0) { setHistIdx(h => h - 1); setBlocks(history[histIdx - 1] || []) } }} disabled={histIdx === 0}
            title="Annuler (Ctrl+Z)"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 5, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: histIdx === 0 ? "#3A3630" : MUTED, opacity: histIdx === 0 ? 0.4 : 1 }}>
            ↩
          </button>
          <button onClick={() => { if (histIdx < history.length - 1) { setHistIdx(h => h + 1); setBlocks(history[histIdx + 1] || []) } }} disabled={histIdx >= history.length - 1}
            title="Refaire (Ctrl+Y)"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 5, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: histIdx >= history.length - 1 ? "#3A3630" : MUTED, opacity: histIdx >= history.length - 1 ? 0.4 : 1 }}>
            ↪
          </button>
        </div>
        <div style={{ width: 1, height: 14, background: "rgba(255,255,255,0.08)" }} />
        <button onClick={generateFull} disabled={generating}
          title="Generer la page avec l'IA"
          style={{ display: "flex", alignItems: "center", gap: 5, background: generating ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 7, padding: "5px 10px", color: G, fontSize: 11, fontWeight: 600, cursor: generating ? "wait" : "pointer" }}>
          <Wand2 size={11} /> {generating ? "Generation..." : "Generer IA"}
        </button>
        <button onClick={() => setRightPanel(p => p === "theme" ? "preview" : "theme")}
          title="Personnaliser le theme"
          style={{ display: "flex", alignItems: "center", gap: 5, background: rightPanel === "theme" ? "rgba(201,168,76,0.15)" : "transparent", border: `1px solid ${rightPanel === "theme" ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 7, padding: "5px 10px", color: rightPanel === "theme" ? G : MUTED, fontSize: 11, cursor: "pointer" }}>
          <Palette size={11} /> Theme
        </button>
        <button onClick={() => setRightPanel(p => p === "ai" ? "preview" : "ai")}
          title="Assistant IA"
          style={{ display: "flex", alignItems: "center", gap: 5, background: rightPanel === "ai" ? "rgba(57,255,143,0.1)" : "transparent", border: `1px solid ${rightPanel === "ai" ? "rgba(57,255,143,0.3)" : "rgba(255,255,255,0.08)"}`, borderRadius: 7, padding: "5px 10px", color: rightPanel === "ai" ? "#39FF8F" : MUTED, fontSize: 11, cursor: "pointer" }}>
          <Sparkles size={11} /> IA
        </button>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 7, overflow: "hidden" }}>
          {(["mobile", "desktop"] as const).map(mode => (
            <button key={mode} onClick={() => setPreviewMode(mode)}
              style={{ background: previewMode === mode ? "rgba(201,168,76,0.15)" : "transparent", border: "none", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: previewMode === mode ? G : MUTED }}>
              {mode === "mobile" ? <Smartphone size={11} /> : <Monitor size={11} />}
            </button>
          ))}
        </div>
        <button onClick={() => setPreviewDark(d => !d)} title="Jour / Nuit"
          style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, cursor: "pointer" }}>
          {previewDark ? <Sun size={11} /> : <Moon size={11} />}
        </button>
        {pageId && (
          <a href={`/${pageSlug}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 7, padding: "5px 10px", color: MUTED, textDecoration: "none", fontSize: 11 }}>
            <ExternalLink size={11} /> Voir
          </a>
        )}
        <button onClick={handlePublish} disabled={publishing}
          style={{ display: "flex", alignItems: "center", gap: 5, background: published ? "rgba(57,255,143,0.15)" : "linear-gradient(90deg,#C9A84C,#b8953f)", border: published ? "1px solid rgba(57,255,143,0.3)" : "none", borderRadius: 8, padding: "7px 14px", color: published ? "#39FF8F" : "#080808", fontSize: 12, fontWeight: 700, cursor: publishing ? "wait" : "pointer", boxShadow: published ? "none" : "0 2px 12px rgba(201,168,76,0.25)" }}>
          {published ? <><Check size={11} /> Publie !</> : publishing ? "..." : "Publier"}
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT PANEL — Bibliotheque ── */}
        <div style={{ width: 230, background: "#0C0B09", borderRight: "1px solid rgba(201,168,76,0.08)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Search */}
          <div style={{ padding: "8px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
            <div style={{ position: "relative" }}>
              <Search size={11} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un bloc..."
                style={{ width: "100%", background: "#0d0c09", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 7, padding: "7px 7px 7px 24px", color: "#F5F0E8", fontSize: 11, outline: "none", boxSizing: "border-box" }}
                onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.12)"} />
              {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 6, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: MUTED, cursor: "pointer" }}><X size={10} /></button>}
            </div>
          </div>

          {/* Categories */}
          {!search && (
            <div style={{ padding: "6px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
                {[
                  { id: "favorites", icon: "⭐", label: "Favoris", color: "#FFD700" },
                  { id: "recent", icon: "🕐", label: "Recents", color: "#8A8478" },
                  ...BLOCK_CATEGORIES
                ].map(cat => (
                  <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                    title={cat.label}
                    style={{ display: "flex", alignItems: "center", gap: 3, background: activeCategory === cat.id ? `${"color" in cat ? (cat as any).color : "#C9A84C"}15` : "transparent", border: `1px solid ${activeCategory === cat.id ? `${"color" in cat ? (cat as any).color : "#C9A84C"}40` : "rgba(255,255,255,0.06)"}`, borderRadius: 6, padding: "4px 7px", cursor: "pointer", color: activeCategory === cat.id ? ("color" in cat ? (cat as any).color : "#C9A84C") : MUTED, fontSize: 11, transition: "all 0.15s" }}>
                    <span style={{ fontSize: 13 }}>{"icon" in cat ? cat.icon : ""}</span>
                    {activeCategory === cat.id && <span style={{ fontSize: 10, fontWeight: 600 }}>{cat.label}</span>}
                  </button>
                ))}
              </div>
              {activeCategory !== "favorites" && activeCategory !== "recent" && (
                <p style={{ color: MUTED, fontSize: 9, margin: "5px 0 0 2px" }}>
                  {BLOCK_CATEGORIES.find(c => c.id === activeCategory)?.desc || ""}
                </p>
              )}
            </div>
          )}

          {/* Block list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "5px" }}>
            {filteredBlocks.length === 0 ? (
              <div style={{ padding: "20px 10px", textAlign: "center" }}>
                <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>
                  {activeCategory === "favorites" ? "Aucun favori — clique ⭐" : activeCategory === "recent" ? "Aucun bloc recent" : "Aucun resultat"}
                </p>
              </div>
            ) : filteredBlocks.map(([type, def]) => (
              <div key={type} style={{ display: "flex", alignItems: "center", marginBottom: 2, borderRadius: 8, overflow: "hidden" }}>
                <button onClick={() => addBlock(type)}
                  style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", background: "transparent", border: "none", borderRadius: 8, cursor: "pointer", color: MUTED, textAlign: "left", transition: "all 0.12s", width: "100%" }}
                  onMouseEnter={e => { const el = e.currentTarget; el.style.background = `${def.color}10`; el.style.color = "#F5F0E8" }}
                  onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${def.color}15`, border: `1px solid ${def.color}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
                    {def.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "inherit", lineHeight: 1.2 }}>{def.label}</p>
                    <p style={{ margin: 0, fontSize: 9, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.3, marginTop: 1 }}>{def.description}</p>
                  </div>
                </button>
                <button onClick={() => toggleFavorite(type)}
                  title={favorites.includes(type) ? "Retirer des favoris" : "Ajouter aux favoris"}
                  style={{ background: "none", border: "none", color: favorites.includes(type) ? "#FFD700" : "rgba(255,255,255,0.1)", cursor: "pointer", padding: "5px 6px", fontSize: 12, flexShrink: 0 }}>
                  ★
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER CANVAS ── */}
        <div style={{ flex: 1, background: "#0A0908", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Canvas header */}
          <div style={{ padding: "7px 16px", borderBottom: "1px solid rgba(255,255,255,0.03)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: "#3A3630" }}>Canvas</span>
            <span style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "1px 7px", color: G, fontSize: 9, fontWeight: 700 }}>
              {blocks.length} bloc{blocks.length > 1 ? "s" : ""}
            </span>
            {!pageId && <span style={{ color: "#3A3630", fontSize: 9, marginLeft: "auto" }}>Mode demo — non sauvegarde</span>}
            {blocks.length > 0 && pageId && (
              <span style={{ color: MUTED, fontSize: 9, marginLeft: "auto" }}>Clic sur un bloc pour l'editer</span>
            )}
          </div>

          {/* Blocks list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
            {blocks.length === 0 ? (
              <div style={{ border: "1px dashed rgba(201,168,76,0.1)", borderRadius: 14, padding: "48px 30px", textAlign: "center", color: MUTED, marginTop: 8 }}>
                <Layers size={28} style={{ margin: "0 auto 10px", opacity: 0.2 }} />
                <p style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 600 }}>Canvas vide</p>
                <p style={{ margin: 0, fontSize: 11 }}>Ajoute un bloc depuis la bibliotheque a gauche</p>
              </div>
            ) : blocks.map((block, idx) => {
              const def = BLOCK_DEFS[block.type]
              const isSel = block.id === selectedId
              return (
                <div key={block.id}
                  onClick={() => { setSelectedId(block.id); setRightPanel("edit") }}
                  style={{
                    maxWidth: 600, margin: "0 auto 8px",
                    opacity: block.visible ? 1 : 0.35,
                    background: isSel ? "rgba(201,168,76,0.04)" : "rgba(255,255,255,0.015)",
                    border: `1px solid ${isSel ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.05)"}`,
                    borderRadius: 12, overflow: "hidden", cursor: "pointer",
                    transition: "all 0.15s",
                    boxShadow: isSel ? "0 0 20px rgba(201,168,76,0.08)" : "none",
                    animation: "slideIn 0.2s ease"
                  }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.borderColor = "rgba(201,168,76,0.15)" }}
                  onMouseLeave={e => { if (!isSel) e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)" }}>

                  {/* Block header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", background: isSel ? "rgba(201,168,76,0.05)" : "rgba(0,0,0,0.2)", borderBottom: `1px solid ${isSel ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.03)"}` }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 2, cursor: "grab", color: MUTED, opacity: 0.4 }}>
                      <div style={{ width: 10, display: "flex", justifyContent: "space-between" }}>
                        {[0,1].map(i => <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: "currentColor" }} />)}
                      </div>
                      <div style={{ width: 10, display: "flex", justifyContent: "space-between" }}>
                        {[0,1].map(i => <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: "currentColor" }} />)}
                      </div>
                      <div style={{ width: 10, display: "flex", justifyContent: "space-between" }}>
                        {[0,1].map(i => <div key={i} style={{ width: 2, height: 2, borderRadius: "50%", background: "currentColor" }} />)}
                      </div>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: `${def?.color || G}15`, border: `1px solid ${def?.color || G}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11 }}>
                      {def?.icon}
                    </div>
                    <span style={{ color: isSel ? "#F5F0E8" : MUTED, fontSize: 11, fontWeight: isSel ? 700 : 500, flex: 1 }}>{def?.label || block.type}</span>
                    {!block.visible && <span style={{ fontSize: 9, color: MUTED, background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "1px 5px" }}>Masque</span>}
                    {isSel && <span style={{ fontSize: 9, color: G, background: "rgba(201,168,76,0.1)", borderRadius: 4, padding: "1px 5px", fontWeight: 700 }}>Selectionne</span>}
                    <div style={{ display: "flex", gap: 1 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => moveBlock(block.id, "up")} disabled={idx === 0}
                        style={{ background: "transparent", border: "none", color: idx === 0 ? "#2A2620" : MUTED, cursor: idx === 0 ? "default" : "pointer", padding: "2px 4px", borderRadius: 4, fontSize: 11 }}>
                        ↑
                      </button>
                      <button onClick={() => moveBlock(block.id, "down")} disabled={idx === blocks.length - 1}
                        style={{ background: "transparent", border: "none", color: idx === blocks.length - 1 ? "#2A2620" : MUTED, cursor: idx === blocks.length - 1 ? "default" : "pointer", padding: "2px 4px", borderRadius: 4, fontSize: 11 }}>
                        ↓
                      </button>
                      <button onClick={() => duplicateBlock(block.id)} title="Dupliquer"
                        style={{ background: "transparent", border: "none", color: MUTED, cursor: "pointer", padding: "2px 4px", borderRadius: 4 }}>
                        <Copy size={9} />
                      </button>
                      <button onClick={() => toggleVisible(block.id)} title={block.visible ? "Masquer" : "Afficher"}
                        style={{ background: "transparent", border: "none", color: block.visible ? MUTED : G, cursor: "pointer", padding: "2px 4px", borderRadius: 4 }}>
                        {block.visible ? <EyeOff size={9} /> : <Eye size={9} />}
                      </button>
                      <button onClick={() => removeBlock(block.id)} title="Supprimer"
                        style={{ background: "transparent", border: "none", color: "#FF5252", cursor: "pointer", padding: "2px 4px", borderRadius: 4 }}>
                        <Trash2 size={9} />
                      </button>
                    </div>
                  </div>

                  {/* Block content preview */}
                  {block.visible && <BlockPreview block={block} theme={theme} />}
                </div>
              )
            })}

            {/* Add block button at bottom */}
            {blocks.length > 0 && (
              <div style={{ maxWidth: 600, margin: "4px auto 20px" }}>
                <button onClick={() => { setActiveCategory("identity"); setSearch("") }}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: "transparent", border: "1px dashed rgba(201,168,76,0.15)", borderRadius: 10, padding: "10px", color: MUTED, fontSize: 11, cursor: "pointer" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; e.currentTarget.style.color = G }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.15)"; e.currentTarget.style.color = MUTED }}>
                  <Plus size={12} /> Ajouter un bloc
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ width: rightPanel === "ai" ? 320 : 270, background: "#0C0B09", borderLeft: "1px solid rgba(201,168,76,0.08)", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
            {([
              ["preview", <Eye key="e" size={10} />, "Preview"],
              ["edit", <Settings key="s" size={10} />, "Editer"],
              ["theme", <Palette key="p" size={10} />, "Theme"],
              ["ai", <Sparkles key="a" size={10} />, "IA"],
            ] as const).map(([p, icon, label]) => (
              <button key={p} onClick={() => setRightPanel(p)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 3, padding: "9px 3px", background: rightPanel === p ? "rgba(201,168,76,0.06)" : "transparent", border: "none", color: rightPanel === p ? G : MUTED, fontSize: 10, fontWeight: rightPanel === p ? 700 : 400, cursor: "pointer", borderBottom: rightPanel === p ? `2px solid ${G}` : "2px solid transparent", transition: "all 0.15s" }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* PREVIEW TAB */}
          {rightPanel === "preview" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: previewMode === "mobile" ? 200 : 250, background: previewDark ? theme.bg : "#FAFAFA", border: previewDark ? "1px solid rgba(201,168,76,0.2)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 16, overflow: "hidden", boxShadow: "0 8px 30px rgba(0,0,0,0.3)" }}>
                {previewMode === "mobile" && <div style={{ height: 6, background: "#1A1812", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 30, height: 2, background: "#2A2620", borderRadius: 1 }} /></div>}
                <div style={{ minHeight: 320, background: previewDark ? theme.bgGradient || theme.bg : "#FAFAFA" }}>
                  {blocks.filter(b => b.visible).map(b => (
                    <div key={b.id} onClick={() => { setSelectedId(b.id); setRightPanel("edit") }}
                      style={{ cursor: "pointer", outline: b.id === selectedId ? `1.5px solid ${G}50` : "none", outlineOffset: -1 }}>
                      <BlockPreview block={b} theme={previewDark ? theme : { ...theme, bg: "#FAFAFA", surface: "#FFFFFF", text: "#111", muted: "#666", bgGradient: undefined }} />
                    </div>
                  ))}
                  {blocks.filter(b => b.visible).length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#4A4640" }}><p style={{ fontSize: 10, margin: 0 }}>Aucun bloc visible</p></div>}
                  <div style={{ textAlign: "center", padding: "8px 0" }}><p style={{ fontSize: 7, color: "#3A3630", margin: 0 }}>Cree avec QRfolio</p></div>
                </div>
              </div>
              <p style={{ color: MUTED, fontSize: 9, marginTop: 8, textAlign: "center" }}>Clic sur un element pour l'editer</p>
            </div>
          )}

          {/* EDIT TAB */}
          {rightPanel === "edit" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 13 }}>
              {!selectedBlock ? (
                <div style={{ textAlign: "center", padding: "40px 14px" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                    <Settings size={20} color={MUTED} style={{ opacity: 0.3 }} />
                  </div>
                  <p style={{ color: MUTED, fontSize: 12, margin: "0 0 4px", fontWeight: 600 }}>Aucun bloc selectionne</p>
                  <p style={{ color: "#4A4640", fontSize: 11, margin: 0, lineHeight: 1.5 }}>Clique sur un bloc dans le canvas pour l'editer</p>
                </div>
              ) : (
                <>
                  {/* Block identity */}
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 16, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: `${BLOCK_DEFS[selectedBlock.type]?.color || G}15`, border: `1px solid ${BLOCK_DEFS[selectedBlock.type]?.color || G}25`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      {BLOCK_DEFS[selectedBlock.type]?.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 700, margin: 0 }}>{BLOCK_DEFS[selectedBlock.type]?.label}</p>
                      <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{BLOCK_DEFS[selectedBlock.type]?.description}</p>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => duplicateBlock(selectedBlock.id)} title="Dupliquer"
                        style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: MUTED }}>
                        <Copy size={10} />
                      </button>
                      <button onClick={() => removeBlock(selectedBlock.id)} title="Supprimer"
                        style={{ background: "rgba(255,82,82,0.08)", border: "1px solid rgba(255,82,82,0.2)", borderRadius: 6, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#FF5252" }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>

                  {/* Visibilite */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <span style={{ color: MUTED, fontSize: 11 }}>Visible sur la page</span>
                    <button onClick={() => toggleVisible(selectedBlock.id)}
                      style={{ display: "flex", alignItems: "center", gap: 5, background: selectedBlock.visible ? "rgba(57,255,143,0.1)" : "rgba(255,255,255,0.06)", border: `1px solid ${selectedBlock.visible ? "rgba(57,255,143,0.25)" : "rgba(255,255,255,0.1)"}`, borderRadius: 20, padding: "4px 10px", cursor: "pointer", color: selectedBlock.visible ? "#39FF8F" : MUTED, fontSize: 11, fontWeight: 600 }}>
                      {selectedBlock.visible ? <><Eye size={10} /> Visible</> : <><EyeOff size={10} /> Masque</>}
                    </button>
                  </div>

                  {/* Fields */}
                  <EditPanel block={selectedBlock} onChange={(key, val) => updateBlock(selectedBlock.id, key, val)} />
                </>
              )}
            </div>
          )}

          {/* THEME TAB */}
          {rightPanel === "theme" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 13 }}>
              <ThemePanel theme={theme} onThemeChange={setTheme} />
            </div>
          )}

          {/* AI TAB */}
          {rightPanel === "ai" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", gap: 7, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: msg.role === "assistant" ? "rgba(201,168,76,0.12)" : "rgba(57,255,143,0.1)", border: `1px solid ${msg.role === "assistant" ? "rgba(201,168,76,0.2)" : "rgba(57,255,143,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {msg.role === "assistant" ? <Bot size={10} color={G} /> : <UserIcon size={10} color="#39FF8F" />}
                    </div>
                    <div style={{ maxWidth: "85%", background: msg.role === "assistant" ? SURFACE : "rgba(57,255,143,0.06)", border: `1px solid ${msg.role === "assistant" ? "rgba(201,168,76,0.08)" : "rgba(57,255,143,0.12)"}`, borderRadius: msg.role === "assistant" ? "3px 9px 9px 9px" : "9px 3px 9px 9px", padding: "8px 10px" }}>
                      <p style={{ color: "#F5F0E8", fontSize: 11, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: 7 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={10} color={G} /></div>
                    <div style={{ background: SURFACE, border: "1px solid rgba(201,168,76,0.08)", borderRadius: "3px 9px 9px 9px", padding: "10px 12px", display: "flex", gap: 4 }}>
                      {[0, 1, 2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: G, animation: "bounce 1.2s infinite", animationDelay: `${i * 0.2}s` }} />)}
                    </div>
                  </div>
                )}
                <div ref={messagesEnd} />
              </div>
              {/* Quick presets */}
              <div style={{ padding: "6px 8px", display: "flex", gap: 4, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                {["Freelance", "Restaurant", "Coach", "Artiste", "E-commerce"].map(s => (
                  <button key={s} onClick={() => sendAI(s)}
                    style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 5, padding: "3px 7px", color: G, fontSize: 10, cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>
              {/* Input */}
              <div style={{ padding: "8px", borderTop: "1px solid rgba(201,168,76,0.08)", display: "flex", gap: 5 }}>
                <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAI() } }}
                  placeholder="Decris ton activite..."
                  style={{ flex: 1, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 7, padding: "8px 10px", color: "#F5F0E8", fontSize: 11, outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.4)"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.15)"} />
                <button onClick={() => sendAI()} disabled={aiLoading || !aiInput.trim()}
                  style={{ background: aiLoading || !aiInput.trim() ? "rgba(201,168,76,0.2)" : "linear-gradient(90deg,#C9A84C,#b8953f)", border: "none", borderRadius: 7, width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: aiLoading || !aiInput.trim() ? "default" : "pointer" }}>
                  <Send size={11} color={aiLoading || !aiInput.trim() ? "#8A8478" : "#080808"} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
