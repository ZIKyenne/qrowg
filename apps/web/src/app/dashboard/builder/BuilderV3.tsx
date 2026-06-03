"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Sparkles, Send, X, ChevronUp, ChevronDown, Trash2, Bot, User as UserIcon, Wand2, Eye, Smartphone, Monitor, Plus, Settings, Save, ExternalLink, GripVertical, Check } from "lucide-react"
import { BLOCK_DEFS, BLOCK_CATEGORIES, SOCIAL_NETWORKS, type Block, type BlockContent } from "./types"
import ImageUpload from "./ImageUpload"
import { createClient } from "@/lib/supabase/client"

// ── AI ────────────────────────────────────────────────────────────────────────
type Message = { role: "user" | "assistant"; content: string }

const AI_SYSTEM = `Tu es expert QRfolio. Quand l'utilisateur décrit son activité, suggère des blocs avec contenu réaliste.
Format exact pour ajouter un bloc (une ligne par bloc):
ADD_BLOCK:{"type":"type_id","content":{"key":"value"}}
Types: profile, bio, cta_button, social_links, heading, rich_text, image, gallery, video, contact_form, testimonials, google_maps, opening_hours, pricing, visit_counter, divider
Réponds en français, sois concis.`

// ── Preview renderers ─────────────────────────────────────────────────────────
function BlockPreview({ block }: { block: Block }) {
  const def = BLOCK_DEFS[block.type]
  const c = block.content
  const G = "#C9A84C"
  const MUTED = "#8A8478"

  switch (block.type) {
    case "profile": return (
      <div style={{ textAlign: "center", padding: "20px 16px" }}>
        {c.avatar ? (
          <img src={c.avatar} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px", display: "block", border: "3px solid rgba(201,168,76,0.4)" }} />
        ) : (
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#C9A84C,#39FF8F)", margin: "0 auto 12px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#080808" }}>
            {(c.name || "?")[0].toUpperCase()}
          </div>
        )}
        <p style={{ color: "#F5F0E8", fontSize: 18, fontWeight: 700, margin: "0 0 4px", fontFamily: "Cormorant Garamond, serif" }}>{c.name || "Mon Nom"}</p>
        <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>{c.tagline || "Mon activité"}</p>
      </div>
    )
    case "bio": return (
      <div style={{ padding: "14px 18px" }}>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 6px" }}>À propos</p>
        <p style={{ color: "#F5F0E8", fontSize: 14, lineHeight: 1.65, margin: 0 }}>{c.text || "Ma bio..."}</p>
      </div>
    )
    case "cta_button": {
      const btnStyles: Record<string, React.CSSProperties> = {
        gold: { background: "linear-gradient(90deg,#C9A84C,#b8953f)", color: "#080808" },
        neon: { background: "rgba(57,255,143,0.12)", border: "1.5px solid #39FF8F", color: "#39FF8F" },
        outline: { background: "transparent", border: "1.5px solid #C9A84C", color: "#C9A84C" },
        ghost: { background: "rgba(255,255,255,0.06)", color: "#F5F0E8" },
      }
      return (
        <div style={{ padding: "12px 18px" }}>
          <a href={c.url || "#"} style={{ ...btnStyles[c.style || "gold"], display: "flex", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, padding: "14px 20px", textDecoration: "none", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            {c.icon && <span>{c.icon}</span>}{c.label || "Bouton"}
          </a>
        </div>
      )
    }
    case "social_links": {
      const active = SOCIAL_NETWORKS.filter(n => c[n.key])
      return (
        <div style={{ padding: "12px 18px" }}>
          {active.length === 0 ? (
            <p style={{ color: MUTED, fontSize: 12, textAlign: "center", margin: 0 }}>Aucun réseau configuré</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {active.map(n => (
                <a key={n.key} href={c[n.key]} target="_blank" rel="noopener noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 12, background: n.bg, border: `1px solid ${n.color}30`, borderRadius: 12, padding: "12px 16px", textDecoration: "none", transition: "all 0.2s" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: n.color + "20", border: `1px solid ${n.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{n.icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 600, margin: 0 }}>{n.label}</p>
                    <p style={{ color: MUTED, fontSize: 11, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{c[n.key]}</p>
                  </div>
                  <ExternalLink size={14} color={n.color} />
                </a>
              ))}
            </div>
          )}
        </div>
      )
    }
    case "heading": {
      const sizes: Record<string, number> = { small: 16, medium: 22, large: 30 }
      const colors: Record<string, string> = { default: "#F5F0E8", gold: G, neon: "#39FF8F", muted: MUTED }
      return (
        <div style={{ padding: "14px 18px", textAlign: (c.align as any) || "center" }}>
          <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: sizes[c.size || "medium"], color: colors[c.color || "default"], fontWeight: 700, margin: 0 }}>{c.text || "Titre"}</h2>
        </div>
      )
    }
    case "rich_text": return (
      <div style={{ padding: "10px 18px", textAlign: (c.align as any) || "left" }}>
        <p style={{ color: MUTED, fontSize: 14, lineHeight: 1.65, margin: 0 }}>{c.text}</p>
      </div>
    )
    case "image": return (
      <div style={{ padding: c.src ? 0 : "12px 18px" }}>
        {c.src ? (
          <div>
            <img src={c.src} alt={c.caption || ""} style={{ width: "100%", maxHeight: 240, objectFit: "cover", display: "block", borderRadius: c.rounded === "circle" ? "50%" : c.rounded === "rounded" ? 12 : 0 }} />
            {c.caption && <p style={{ color: MUTED, fontSize: 11, textAlign: "center", margin: "8px 0 8px", padding: "0 16px" }}>{c.caption}</p>}
          </div>
        ) : (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 10, padding: "32px", textAlign: "center" }}>
            <span style={{ fontSize: 32 }}>🖼️</span>
            <p style={{ color: MUTED, fontSize: 12, margin: "8px 0 0" }}>Aucune image</p>
          </div>
        )}
      </div>
    )
    case "gallery": {
      const imgs = [c.img1, c.img2, c.img3, c.img4].filter(Boolean)
      const cols = parseInt(c.columns || "2")
      return (
        <div style={{ padding: "12px 18px", display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 6 }}>
          {imgs.length > 0 ? imgs.map((img, i) => (
            <img key={i} src={img} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8 }} />
          )) : [0,1,2,3].map(i => (
            <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, aspectRatio: "1", display: "flex", alignItems: "center", justifyContent: "center", color: MUTED, fontSize: 20 }}>🖼️</div>
          ))}
        </div>
      )
    }
    case "video": return (
      <div style={{ padding: "12px 18px" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "28px", textAlign: "center" }}>
          <span style={{ fontSize: 32 }}>▶️</span>
          <p style={{ color: "#F5F0E8", fontSize: 13, margin: "10px 0 0", fontWeight: 600 }}>{c.title || "Vidéo"}</p>
          {c.url && <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.url}</p>}
        </div>
      </div>
    )
    case "contact_form": return (
      <div style={{ padding: "14px 18px" }}>
        <p style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: "0 0 12px" }}>{c.title || "Contact"}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {["Nom", "Email", "Message"].map(f => (
            <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: f === "Message" ? "10px 12px 40px" : "10px 12px", color: MUTED, fontSize: 12 }}>{f}</div>
          ))}
          <div style={{ background: "linear-gradient(90deg,#C9A84C,#b8953f)", borderRadius: 8, padding: "12px", textAlign: "center", color: "#080808", fontSize: 13, fontWeight: 700 }}>{c.button_label || "Envoyer"}</div>
        </div>
      </div>
    )
    case "testimonials": {
      const reviews = [{ n: c.name1, t: c.text1, s: c.stars1 }, { n: c.name2, t: c.text2, s: c.stars2 }].filter(r => r.n)
      return (
        <div style={{ padding: "12px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {reviews.length === 0 ? <p style={{ color: MUTED, fontSize: 12, margin: 0, textAlign: "center" }}>Aucun avis</p> :
            reviews.map((r, i) => (
              <div key={i} style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 700, margin: 0 }}>{r.n}</p>
                  <p style={{ color: G, fontSize: 12, margin: 0 }}>{"★".repeat(parseInt(r.s || "5"))}</p>
                </div>
                <p style={{ color: MUTED, fontSize: 12, margin: 0, fontStyle: "italic" }}>"{r.t}"</p>
              </div>
            ))}
        </div>
      )
    }
    case "google_maps": return (
      <div style={{ padding: "12px 18px" }}>
        <div style={{ background: "rgba(255,230,109,0.06)", border: "1px solid rgba(255,230,109,0.15)", borderRadius: 12, padding: "16px", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>📍</span>
          <div>
            <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>{c.label || "Adresse"}</p>
            <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{c.address}</p>
          </div>
        </div>
      </div>
    )
    case "opening_hours": return (
      <div style={{ padding: "12px 18px" }}>
        <p style={{ color: MUTED, fontSize: 10, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 10px" }}>Horaires</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {[["Lun — Ven", c.mon_fri], ["Samedi", c.saturday], ["Dimanche", c.sunday]].map(([d, h]) => h && (
            <div key={d} style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: MUTED, fontSize: 13 }}>{d}</span>
              <span style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 600 }}>{h}</span>
            </div>
          ))}
        </div>
      </div>
    )
    case "pricing": {
      const plans = [{ t: c.title1, p: c.price1, d: c.desc1 }, { t: c.title2, p: c.price2, d: c.desc2 }].filter(pl => pl.t)
      return (
        <div style={{ padding: "12px 18px", display: "flex", gap: 10 }}>
          {plans.map((pl, i) => (
            <div key={i} style={{ flex: 1, background: i === 1 ? "rgba(201,168,76,0.1)" : "rgba(255,255,255,0.04)", border: `1px solid ${i === 1 ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "14px 12px", textAlign: "center" }}>
              <p style={{ color: MUTED, fontSize: 11, margin: "0 0 4px", textTransform: "uppercase", letterSpacing: 1 }}>{pl.t}</p>
              <p style={{ color: G, fontSize: 24, fontWeight: 700, margin: "0 0 4px", fontFamily: "Cormorant Garamond, serif" }}>{pl.p}</p>
              <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{pl.d}</p>
            </div>
          ))}
        </div>
      )
    }
    case "visit_counter": return (
      <div style={{ padding: "14px 18px", textAlign: "center" }}>
        <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 36, color: G, fontWeight: 700, margin: "0 0 4px" }}>1 234</p>
        <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{c.label || "visiteurs"}</p>
      </div>
    )
    case "divider": {
      const divStyles: Record<string, React.ReactNode> = {
        line: <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)", margin: 0 }} />,
        dots: <div style={{ textAlign: "center", color: MUTED, letterSpacing: 8 }}>• • •</div>,
        gold: <hr style={{ border: "none", borderTop: "1px solid rgba(201,168,76,0.3)", margin: 0 }} />,
      }
      return <div style={{ padding: "8px 18px" }}>{divStyles[c.style || "gold"]}</div>
    }
    case "spacer": {
      const sizes: Record<string, number> = { small: 16, medium: 32, large: 56 }
      return <div style={{ height: sizes[c.size || "medium"] }} />
    }
    default: return (
      <div style={{ padding: "14px 18px", textAlign: "center" }}>
        <span style={{ fontSize: 24 }}>{def?.icon}</span>
        <p style={{ color: "#8A8478", fontSize: 12, margin: "6px 0 0" }}>{def?.label}</p>
      </div>
    )
  }
}

// ── Edit Panel ─────────────────────────────────────────────────────────────────
function EditPanel({ block, onChange }: { block: Block; onChange: (key: string, val: string) => void }) {
  const def = BLOCK_DEFS[block.type]
  if (!def) return null
  const MUTED = "#8A8478"
  const G = "#C9A84C"

  const inputStyle: React.CSSProperties = { width: "100%", background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "10px 12px", color: "#F5F0E8", fontSize: 13, outline: "none", boxSizing: "border-box", fontFamily: "DM Sans, sans-serif" }

  // Special layout for social_links
  if (block.type === "social_links") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={{ color: MUTED, fontSize: 11, margin: 0, lineHeight: 1.5 }}>Ajoute tes liens. Laisse vide pour masquer.</p>
        {SOCIAL_NETWORKS.map(n => (
          <div key={n.key}>
            <label style={{ color: MUTED, fontSize: 11, display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
              <span style={{ fontSize: 16 }}>{n.icon}</span>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {def.fields.map(field => (
        <div key={field.key}>
          <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 500 }}>{field.label}</label>
          {field.type === "image" ? (
            <ImageUpload value={block.content[field.key] || ""} onChange={val => onChange(field.key, val)} hint={field.hint} />
          ) : field.type === "textarea" ? (
            <textarea value={block.content[field.key] || ""} onChange={e => onChange(field.key, e.target.value)}
              placeholder={field.placeholder} rows={4}
              style={{ ...inputStyle, resize: "vertical" }}
              onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"} />
          ) : field.type === "select" ? (
            <select value={block.content[field.key] || field.options?.[0]} onChange={e => onChange(field.key, e.target.value)}
              style={{ ...inputStyle }}>
              {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input type={field.type === "url" ? "url" : "text"} value={block.content[field.key] || ""}
              onChange={e => onChange(field.key, e.target.value)} placeholder={field.placeholder}
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"} />
          )}
          {field.hint && <p style={{ color: MUTED, fontSize: 11, margin: "4px 0 0" }}>{field.hint}</p>}
        </div>
      ))}
    </div>
  )
}

// ── MAIN BUILDER ───────────────────────────────────────────────────────────────
interface BuilderProps {
  pageId?: string
}

export default function BuilderV3({ pageId }: BuilderProps) {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "profile", content: { name: "Mon Nom", tagline: "Mon activité" } },
    { id: "2", type: "bio", content: { text: "Bienvenue sur ma page !" } },
    { id: "3", type: "cta_button", content: { label: "Me contacter", url: "#", style: "gold" } },
  ])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pageName, setPageName] = useState("Ma Page")
  const [pageSlug, setPageSlug] = useState("ma-page")
  const [rightPanel, setRightPanel] = useState<"preview" | "edit" | "ai">("preview")
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile")
  const [activeCategory, setActiveCategory] = useState("identity")
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Salut ! 👋 Décris ton activité et je construis ta page automatiquement avec du contenu prêt à l'emploi." }
  ])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  // Load page data
  useEffect(() => {
    if (!pageId) return
    const supabase = createClient()
    supabase.from("pages").select("title, slug, status").eq("id", pageId).single().then(({ data }) => {
      if (data) { setPageName(data.title); setPageSlug(data.slug) }
    })
    supabase.from("blocks").select("*").eq("page_id", pageId).order("position").then(({ data }) => {
      if (data && data.length > 0) {
        setBlocks(data.map(b => ({ id: b.id, type: b.type, content: b.content || {} })))
      }
    })
  }, [pageId])

  // Auto-save
  const autoSave = useCallback(() => {
    if (!pageId) return
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(async () => {
      setSaving(true)
      const supabase = createClient()
      await supabase.from("pages").update({ title: pageName }).eq("id", pageId)
      await supabase.from("blocks").delete().eq("page_id", pageId)
      if (blocks.length > 0) {
        await supabase.from("blocks").insert(blocks.map((b, i) => ({ page_id: pageId, type: b.type, position: i, content: b.content, is_visible: true, styles: {} })))
      }
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 800)
  }, [pageId, blocks, pageName])

  useEffect(() => { autoSave() }, [blocks, pageName])

  async function handlePublish() {
    if (!pageId) return
    setPublishing(true)
    const supabase = createClient()
    await supabase.from("pages").update({ status: "published", published_at: new Date().toISOString() }).eq("id", pageId)
    setPublishing(false)
    setPublished(true)
    setTimeout(() => setPublished(false), 3000)
  }

  function addBlock(type: string, content?: BlockContent) {
    const def = BLOCK_DEFS[type]
    if (!def) return
    const id = Date.now().toString() + Math.random().toString(36).slice(2)
    const block: Block = { id, type, content: content || { ...def.defaultContent } }
    setBlocks(p => [...p, block])
    setSelectedId(id)
    setRightPanel("edit")
  }

  function updateBlock(id: string, key: string, value: string) {
    setBlocks(p => p.map(b => b.id === id ? { ...b, content: { ...b.content, [key]: value } } : b))
  }

  function removeBlock(id: string) {
    setBlocks(p => p.filter(b => b.id !== id))
    if (selectedId === id) { setSelectedId(null); setRightPanel("preview") }
  }

  function moveBlock(id: string, dir: "up" | "down") {
    setBlocks(p => {
      const idx = p.findIndex(b => b.id === id)
      if (dir === "up" && idx === 0) return p
      if (dir === "down" && idx === p.length - 1) return p
      const n = [...p]; const s = dir === "up" ? idx - 1 : idx + 1
      ;[n[idx], n[s]] = [n[s], n[idx]]; return n
    })
  }

  function parseAIBlocks(text: string) {
    let added = 0
    text.split("\n").forEach(line => {
      if (line.startsWith("ADD_BLOCK:")) {
        try { const j = JSON.parse(line.replace("ADD_BLOCK:", "").trim()); addBlock(j.type, j.content); added++ } catch {}
      }
    })
    return added
  }

  function cleanAI(text: string) {
    return text.split("\n").filter(l => !l.startsWith("ADD_BLOCK:")).join("\n").trim()
  }

  async function sendAI(prompt?: string) {
    const msg = (prompt || aiInput).trim()
    if (!msg || aiLoading) return
    setAiInput("")
    setMessages(p => [...p, { role: "user", content: msg }])
    setAiLoading(true)
    try {
      const hist = [...messages, { role: "user" as const, content: msg }]
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: AI_SYSTEM, messages: hist.map(m => ({ role: m.role, content: m.content })) })
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || "Erreur."
      const added = parseAIBlocks(reply)
      setMessages(p => [...p, { role: "assistant", content: cleanAI(reply) + (added > 0 ? `\n\n✅ ${added} bloc${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""} !` : "") }])
    } catch { setMessages(p => [...p, { role: "assistant", content: "Erreur de connexion." }]) }
    setAiLoading(false)
  }

  async function generateFull() {
    setGenerating(true)
    setRightPanel("ai")
    await sendAI("Génère une page QRfolio complète et professionnelle avec profil, bio, réseaux sociaux, bouton CTA, témoignages et formulaire. Contenu d'exemple accrocheur.")
    setGenerating(false)
  }

  const selectedBlock = blocks.find(b => b.id === selectedId)
  const G = "#C9A84C"
  const MUTED = "#8A8478"
  const SURFACE = "#111009"

  const appUrl = typeof window !== "undefined" ? window.location.origin : "https://qrfolio.app"

  return (
    <div style={{ height: "100vh", background: "#080808", display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif", color: "#F5F0E8", overflow: "hidden" }}>

      {/* ── TOP BAR ── */}
      <div style={{ height: 52, background: "#0C0B09", borderBottom: "1px solid rgba(201,168,76,0.12)", display: "flex", alignItems: "center", padding: "0 16px", gap: 10, flexShrink: 0, zIndex: 20 }}>
        <a href="/dashboard" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: G, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>QRfolio</a>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)" }} />
        <input value={pageName} onChange={e => setPageName(e.target.value)}
          style={{ background: "transparent", border: "none", color: "#F5F0E8", fontSize: 14, outline: "none", width: 150 }} />
        {saving && <span style={{ color: MUTED, fontSize: 11 }}>Sauvegarde...</span>}
        {saved && <span style={{ color: "#39FF8F", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}><Check size={11} /> Sauvegardé</span>}
        <div style={{ flex: 1 }} />
        <button onClick={generateFull} disabled={generating}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 7, padding: "6px 12px", color: G, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <Wand2 size={12} /> {generating ? "Génération..." : "Générer IA"}
        </button>
        <button onClick={() => setRightPanel(p => p === "ai" ? "preview" : "ai")}
          style={{ display: "flex", alignItems: "center", gap: 6, background: rightPanel === "ai" ? "rgba(201,168,76,0.15)" : "transparent", border: `1px solid ${rightPanel === "ai" ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)"}`, borderRadius: 7, padding: "6px 12px", color: rightPanel === "ai" ? G : MUTED, fontSize: 12, cursor: "pointer" }}>
          <Sparkles size={12} /> IA
        </button>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, overflow: "hidden" }}>
          {([["mobile", <Smartphone key="m" size={12} />] as const, ["desktop", <Monitor key="d" size={12} />] as const]).map(([mode, icon]) => (
            <button key={mode} onClick={() => setPreviewMode(mode as any)}
              style={{ background: previewMode === mode ? "rgba(201,168,76,0.15)" : "transparent", border: "none", color: previewMode === mode ? G : MUTED, padding: "6px 10px", cursor: "pointer", display: "flex", alignItems: "center" }}>
              {icon}
            </button>
          ))}
        </div>
        {pageId && (
          <a href={`/${pageSlug}`} target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "6px 12px", color: MUTED, fontSize: 12, textDecoration: "none" }}>
            <Eye size={12} /> Aperçu
          </a>
        )}
        <button onClick={handlePublish} disabled={publishing}
          style={{ display: "flex", alignItems: "center", gap: 6, background: published ? "rgba(57,255,143,0.15)" : `linear-gradient(90deg,${G},#b8953f)`, border: published ? "1px solid rgba(57,255,143,0.4)" : "none", color: published ? "#39FF8F" : "#080808", padding: "6px 16px", borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          {published ? <><Check size={12} /> Publié !</> : publishing ? "..." : "Publier →"}
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT: Block library ── */}
        <div style={{ width: 210, background: "#0C0B09", borderRight: "1px solid rgba(201,168,76,0.1)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          <div style={{ padding: "10px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
            <p style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: G, margin: "0 0 8px", paddingLeft: 6 }}>Bibliothèque</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {BLOCK_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  style={{ display: "flex", alignItems: "center", gap: 4, background: activeCategory === cat.id ? `${cat.color}18` : "transparent", border: `1px solid ${activeCategory === cat.id ? cat.color + "40" : "transparent"}`, borderRadius: 6, padding: "4px 8px", color: activeCategory === cat.id ? cat.color : MUTED, fontSize: 11, cursor: "pointer" }}>
                  <span style={{ fontSize: 12 }}>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {Object.entries(BLOCK_DEFS).filter(([, def]) => def.category === activeCategory).map(([type, def]) => (
              <button key={type} onClick={() => addBlock(type)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 10px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 13, cursor: "pointer", textAlign: "left", marginBottom: 3, transition: "all 0.15s" }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = `${def.color}10`; el.style.color = "#F5F0E8"; el.style.borderColor = `${def.color}25` }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED; el.style.borderColor = "transparent" }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: `${def.color}15`, border: `1px solid ${def.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{def.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: "inherit" }}>{def.label}</p>
                  <p style={{ margin: 0, fontSize: 10, color: MUTED, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{def.description}</p>
                </div>
                <Plus size={11} style={{ opacity: 0.4, flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>

        {/* ── CENTER: Canvas ── */}
        <div style={{ flex: 1, background: "#0A0908", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#4A4640" }}>Canvas</span>
            <span style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "1px 8px", fontSize: 11, color: G }}>{blocks.length} bloc{blocks.length !== 1 ? "s" : ""}</span>
            {!pageId && <span style={{ color: MUTED, fontSize: 11, marginLeft: "auto" }}>Mode démo — non sauvegardé</span>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {blocks.length === 0 ? (
              <div style={{ border: "1px dashed rgba(201,168,76,0.12)", borderRadius: 16, padding: "60px 40px", textAlign: "center", color: "#4A4640", maxWidth: 500, margin: "40px auto" }}>
                <Sparkles size={28} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: 14 }}>Ajoute un bloc ou utilise le Copilote IA →</p>
              </div>
            ) : blocks.map((block, idx) => {
              const def = BLOCK_DEFS[block.type]
              const isSelected = block.id === selectedId
              return (
                <div key={block.id} onClick={() => { setSelectedId(block.id); setRightPanel("edit") }}
                  style={{ maxWidth: 620, margin: "0 auto 10px", background: isSelected ? "rgba(201,168,76,0.04)" : SURFACE, border: `1.5px solid ${isSelected ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.1)"}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", boxShadow: isSelected ? `0 0 0 3px rgba(201,168,76,0.08), 0 4px 20px rgba(0,0,0,0.4)` : "0 2px 8px rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", background: "rgba(0,0,0,0.25)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <GripVertical size={13} color={MUTED} />
                    <div style={{ width: 22, height: 22, borderRadius: 6, background: `${def?.color || G}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>{def?.icon}</div>
                    <span style={{ color: isSelected ? "#F5F0E8" : MUTED, fontSize: 12, fontWeight: 600, flex: 1 }}>{def?.label}</span>
                    {isSelected && <span style={{ fontSize: 9, color: G, background: "rgba(201,168,76,0.1)", borderRadius: 4, padding: "2px 6px", letterSpacing: 0.5 }}>ÉDITION</span>}
                    <div style={{ display: "flex", gap: 3 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => moveBlock(block.id, "up")} disabled={idx === 0}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5, width: 24, height: 24, color: MUTED, cursor: idx === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: idx === 0 ? 0.3 : 1 }}>
                        <ChevronUp size={10} />
                      </button>
                      <button onClick={() => moveBlock(block.id, "down")} disabled={idx === blocks.length - 1}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5, width: 24, height: 24, color: MUTED, cursor: idx === blocks.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: idx === blocks.length - 1 ? 0.3 : 1 }}>
                        <ChevronDown size={10} />
                      </button>
                      <button onClick={() => removeBlock(block.id)}
                        style={{ background: "rgba(255,82,82,0.07)", border: "1px solid rgba(255,82,82,0.15)", borderRadius: 5, width: 24, height: 24, color: "#FF5252", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                  <BlockPreview block={block} />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ width: rightPanel === "ai" ? 360 : 290, background: "#0C0B09", borderLeft: "1px solid rgba(201,168,76,0.1)", display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.25s ease", overflow: "hidden" }}>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            {([["preview", <Eye key="e" size={12} />, "Preview"], ["edit", <Settings key="s" size={12} />, "Éditer"], ["ai", <Sparkles key="a" size={12} />, "IA"]] as const).map(([panel, icon, label]) => (
              <button key={panel} onClick={() => setRightPanel(panel)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 4px", background: "transparent", border: "none", borderBottom: `2px solid ${rightPanel === panel ? G : "transparent"}`, color: rightPanel === panel ? G : MUTED, fontSize: 11, fontWeight: rightPanel === panel ? 700 : 400, cursor: "pointer" }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* PREVIEW */}
          {rightPanel === "preview" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: previewMode === "mobile" ? 220 : 256, background: "#080808", border: previewMode === "mobile" ? "6px solid #1A1812" : "2px solid #1A1812", borderRadius: previewMode === "mobile" ? 32 : 12, overflow: "hidden", boxShadow: "0 0 50px rgba(0,0,0,0.7)" }}>
                {previewMode === "mobile" && <div style={{ height: 10, background: "#1A1812", borderRadius: "0 0 6px 6px", width: 60, margin: "0 auto" }} />}
                <div style={{ minHeight: 380 }}>
                  {blocks.map(block => (
                    <div key={block.id} onClick={() => { setSelectedId(block.id); setRightPanel("edit") }}
                      style={{ cursor: "pointer", outline: selectedId === block.id ? "2px solid rgba(201,168,76,0.4)" : "none" }}>
                      <BlockPreview block={block} />
                    </div>
                  ))}
                  {blocks.length === 0 && <div style={{ padding: 20, textAlign: "center", color: "#4A4640", fontSize: 12 }}>Page vide</div>}
                  <div style={{ textAlign: "center", padding: "12px 0" }}>
                    <p style={{ fontSize: 9, color: "#4A4640", margin: 0, letterSpacing: 1 }}>Créé avec QRfolio</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EDIT */}
          {rightPanel === "edit" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {!selectedBlock ? (
                <div style={{ textAlign: "center", padding: "50px 16px" }}>
                  <Settings size={28} color={MUTED} style={{ margin: "0 auto 10px", opacity: 0.3 }} />
                  <p style={{ color: MUTED, fontSize: 13, margin: 0, lineHeight: 1.6 }}>Clique sur un bloc pour l'éditer</p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ background: `${BLOCK_DEFS[selectedBlock.type]?.color || G}15`, border: `1px solid ${BLOCK_DEFS[selectedBlock.type]?.color || G}30`, borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                      {BLOCK_DEFS[selectedBlock.type]?.icon}
                    </div>
                    <div>
                      <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 700, margin: 0 }}>{BLOCK_DEFS[selectedBlock.type]?.label}</p>
                      <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>{BLOCK_DEFS[selectedBlock.type]?.description}</p>
                    </div>
                  </div>
                  <EditPanel block={selectedBlock} onChange={(key, val) => updateBlock(selectedBlock.id, key, val)} />
                </>
              )}
            </div>
          )}

          {/* AI */}
          {rightPanel === "ai" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: msg.role === "assistant" ? "rgba(201,168,76,0.12)" : "rgba(57,255,143,0.1)", border: `1px solid ${msg.role === "assistant" ? "rgba(201,168,76,0.3)" : "rgba(57,255,143,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {msg.role === "assistant" ? <Bot size={11} color={G} /> : <UserIcon size={11} color="#39FF8F" />}
                    </div>
                    <div style={{ maxWidth: "84%", background: msg.role === "assistant" ? SURFACE : "rgba(57,255,143,0.06)", border: `1px solid ${msg.role === "assistant" ? "rgba(201,168,76,0.1)" : "rgba(57,255,143,0.2)"}`, borderRadius: msg.role === "user" ? "10px 3px 10px 10px" : "3px 10px 10px 10px", padding: "8px 11px" }}>
                      <p style={{ color: "#F5F0E8", fontSize: 12, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}><Bot size={11} color={G} /></div>
                    <div style={{ background: SURFACE, border: "1px solid rgba(201,168,76,0.1)", borderRadius: "3px 10px 10px 10px", padding: "10px 12px", display: "flex", gap: 4 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: G, animation: `bounce 1s ease ${i*0.2}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={messagesEnd} />
              </div>
              <div style={{ padding: "6px 10px", display: "flex", gap: 4, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                {["Freelance", "Restaurant", "Coach", "Artiste", "E-commerce"].map(s => (
                  <button key={s} onClick={() => sendAI(s)} style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 12, padding: "3px 8px", color: MUTED, fontSize: 10, cursor: "pointer" }}>{s}</button>
                ))}
              </div>
              <div style={{ padding: "10px", borderTop: "1px solid rgba(201,168,76,0.1)", display: "flex", gap: 6 }}>
                <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAI() } }}
                  placeholder="Décris ton activité..."
                  style={{ flex: 1, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "9px 11px", color: "#F5F0E8", fontSize: 12, outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"} />
                <button onClick={() => sendAI()} disabled={aiLoading || !aiInput.trim()}
                  style={{ background: `linear-gradient(90deg,${G},#b8953f)`, border: "none", borderRadius: 8, width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: !aiInput.trim() ? 0.5 : 1, flexShrink: 0 }}>
                  <Send size={12} color="#080808" />
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
