"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  Sparkles, Send, X, ChevronUp, ChevronDown, Trash2,
  Bot, User, Wand2, Eye, Smartphone, Monitor,
  Plus, GripVertical, Settings, ExternalLink
} from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────
type BlockContent = Record<string, string>

type Block = {
  id: string
  type: string
  icon: string
  label: string
  content: BlockContent
}

type Message = { role: "user" | "assistant"; content: string }

// ─── Block definitions ────────────────────────────────────────────────────────
const BLOCK_DEFS: Record<string, {
  icon: string; label: string; category: string;
  fields: { key: string; label: string; type: "text" | "textarea" | "url" | "color" | "select"; placeholder?: string; options?: string[] }[]
  defaultContent: BlockContent
  preview: (c: BlockContent) => React.ReactNode
}> = {
  profile: {
    icon: "👤", label: "Profil", category: "Identité",
    fields: [
      { key: "name", label: "Nom", type: "text", placeholder: "Jean Dupont" },
      { key: "tagline", label: "Accroche", type: "text", placeholder: "Développeur freelance" },
      { key: "avatar_url", label: "URL Avatar", type: "url", placeholder: "https://..." },
    ],
    defaultContent: { name: "Mon Nom", tagline: "Mon activité" },
    preview: (c) => (
      <div style={{ textAlign: "center", padding: "16px 12px" }}>
        <div style={{ width: 64, height: 64, borderRadius: "50%", background: "linear-gradient(135deg,#C9A84C,#39FF8F)", margin: "0 auto 10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, color: "#080808" }}>
          {(c.name || "?")[0].toUpperCase()}
        </div>
        <p style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>{c.name || "Mon Nom"}</p>
        <p style={{ color: "#8A8478", fontSize: 13, margin: 0 }}>{c.tagline || "Mon activité"}</p>
      </div>
    )
  },
  bio: {
    icon: "✏️", label: "Bio", category: "Identité",
    fields: [
      { key: "text", label: "Texte", type: "textarea", placeholder: "Parle de toi en quelques mots..." },
    ],
    defaultContent: { text: "Bienvenue sur ma page ! Je suis passionné par..." },
    preview: (c) => (
      <div style={{ padding: "12px 16px" }}>
        <p style={{ color: "#8A8478", fontSize: 12, textTransform: "uppercase", letterSpacing: 1.5, margin: "0 0 6px" }}>À propos</p>
        <p style={{ color: "#F5F0E8", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{c.text || "Ma bio..."}</p>
      </div>
    )
  },
  cta_button: {
    icon: "⚡", label: "Bouton CTA", category: "Action",
    fields: [
      { key: "label", label: "Texte du bouton", type: "text", placeholder: "Me contacter" },
      { key: "url", label: "Lien", type: "url", placeholder: "https://..." },
      { key: "style", label: "Style", type: "select", options: ["primary", "outline", "neon"] },
    ],
    defaultContent: { label: "Me contacter", url: "#", style: "primary" },
    preview: (c) => {
      const styles: Record<string, React.CSSProperties> = {
        primary: { background: "linear-gradient(90deg,#C9A84C,#b8953f)", color: "#080808" },
        outline: { background: "transparent", border: "1.5px solid #C9A84C", color: "#C9A84C" },
        neon: { background: "rgba(57,255,143,0.12)", border: "1.5px solid #39FF8F", color: "#39FF8F" },
      }
      const s = styles[c.style || "primary"]
      return (
        <div style={{ padding: "12px 16px" }}>
          <div style={{ ...s, borderRadius: 10, padding: "12px 20px", textAlign: "center", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
            {c.label || "Bouton"}
          </div>
        </div>
      )
    }
  },
  social_links: {
    icon: "🔗", label: "Réseaux sociaux", category: "Social",
    fields: [
      { key: "instagram", label: "Instagram", type: "text", placeholder: "@monpseudo" },
      { key: "linkedin", label: "LinkedIn", type: "url", placeholder: "linkedin.com/in/moi" },
      { key: "twitter", label: "Twitter/X", type: "text", placeholder: "@monpseudo" },
      { key: "tiktok", label: "TikTok", type: "text", placeholder: "@monpseudo" },
      { key: "youtube", label: "YouTube", type: "url", placeholder: "youtube.com/c/..." },
    ],
    defaultContent: { instagram: "@moi" },
    preview: (c) => {
      const networks = [
        { key: "instagram", icon: "📸", color: "#E1306C" },
        { key: "linkedin", icon: "💼", color: "#0077B5" },
        { key: "twitter", icon: "🐦", color: "#1DA1F2" },
        { key: "tiktok", icon: "🎵", color: "#F5F0E8" },
        { key: "youtube", icon: "▶️", color: "#FF0000" },
      ].filter(n => c[n.key])
      return (
        <div style={{ padding: "12px 16px", display: "flex", gap: 8, flexWrap: "wrap" }}>
          {networks.length === 0 ? <p style={{ color: "#8A8478", fontSize: 12, margin: 0 }}>Aucun réseau configuré</p> :
            networks.map(n => (
              <div key={n.key} style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 12px" }}>
                <span style={{ fontSize: 14 }}>{n.icon}</span>
                <span style={{ color: "#F5F0E8", fontSize: 12 }}>{c[n.key]}</span>
              </div>
            ))
          }
        </div>
      )
    }
  },
  heading: {
    icon: "H", label: "Titre", category: "Contenu",
    fields: [
      { key: "text", label: "Titre", type: "text", placeholder: "Mon titre..." },
      { key: "align", label: "Alignement", type: "select", options: ["left", "center", "right"] },
    ],
    defaultContent: { text: "Mon titre", align: "center" },
    preview: (c) => (
      <div style={{ padding: "12px 16px", textAlign: (c.align as any) || "center" }}>
        <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, color: "#F5F0E8", fontWeight: 700, margin: 0 }}>{c.text || "Titre"}</h2>
      </div>
    )
  },
  rich_text: {
    icon: "📝", label: "Texte", category: "Contenu",
    fields: [
      { key: "text", label: "Contenu", type: "textarea", placeholder: "Ton texte ici..." },
    ],
    defaultContent: { text: "Mon texte..." },
    preview: (c) => (
      <div style={{ padding: "10px 16px" }}>
        <p style={{ color: "#8A8478", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{c.text}</p>
      </div>
    )
  },
  contact_form: {
    icon: "✉️", label: "Formulaire", category: "Action",
    fields: [
      { key: "title", label: "Titre", type: "text", placeholder: "Contactez-moi" },
      { key: "button_label", label: "Bouton", type: "text", placeholder: "Envoyer" },
    ],
    defaultContent: { title: "Contactez-moi", button_label: "Envoyer" },
    preview: (c) => (
      <div style={{ padding: "12px 16px" }}>
        <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 600, margin: "0 0 10px" }}>{c.title || "Contact"}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {["Nom", "Email", "Message"].map(f => (
            <div key={f} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "8px 10px", color: "#8A8478", fontSize: 11 }}>{f}</div>
          ))}
          <div style={{ background: "linear-gradient(90deg,#C9A84C,#b8953f)", borderRadius: 6, padding: "9px", textAlign: "center", color: "#080808", fontSize: 12, fontWeight: 700 }}>{c.button_label || "Envoyer"}</div>
        </div>
      </div>
    )
  },
  testimonials: {
    icon: "💬", label: "Témoignages", category: "Social",
    fields: [
      { key: "name1", label: "Nom 1", type: "text", placeholder: "Marie D." },
      { key: "text1", label: "Avis 1", type: "textarea", placeholder: "Excellent travail !" },
      { key: "name2", label: "Nom 2", type: "text", placeholder: "Paul M." },
      { key: "text2", label: "Avis 2", type: "textarea", placeholder: "Je recommande vivement." },
    ],
    defaultContent: { name1: "Marie D.", text1: "Excellent travail !" },
    preview: (c) => (
      <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {[{ n: c.name1, t: c.text1 }, { n: c.name2, t: c.text2 }].filter(r => r.n).map((r, i) => (
          <div key={i} style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 8, padding: "10px 12px" }}>
            <p style={{ color: "#F5F0E8", fontSize: 12, margin: "0 0 4px", fontWeight: 600 }}>{r.n}</p>
            <p style={{ color: "#8A8478", fontSize: 11, margin: 0, fontStyle: "italic" }}>"{r.t}"</p>
          </div>
        ))}
      </div>
    )
  },
  video: {
    icon: "▶️", label: "Vidéo", category: "Contenu",
    fields: [
      { key: "url", label: "URL YouTube/Vimeo", type: "url", placeholder: "https://youtube.com/watch?v=..." },
      { key: "title", label: "Titre", type: "text", placeholder: "Ma vidéo" },
    ],
    defaultContent: { url: "", title: "Ma vidéo" },
    preview: (c) => (
      <div style={{ padding: "12px 16px" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "24px", textAlign: "center" }}>
          <span style={{ fontSize: 28 }}>▶️</span>
          <p style={{ color: "#8A8478", fontSize: 12, margin: "8px 0 0" }}>{c.title || "Vidéo"}</p>
        </div>
      </div>
    )
  },
  google_maps: {
    icon: "📍", label: "Carte", category: "Local",
    fields: [
      { key: "address", label: "Adresse", type: "text", placeholder: "12 rue de la Paix, Paris" },
    ],
    defaultContent: { address: "Paris, France" },
    preview: (c) => (
      <div style={{ padding: "12px 16px" }}>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "20px", textAlign: "center" }}>
          <span style={{ fontSize: 24 }}>📍</span>
          <p style={{ color: "#F5F0E8", fontSize: 12, margin: "6px 0 0" }}>{c.address}</p>
        </div>
      </div>
    )
  },
  gallery: {
    icon: "🖼️", label: "Galerie", category: "Contenu",
    fields: [
      { key: "img1", label: "Image 1 URL", type: "url", placeholder: "https://..." },
      { key: "img2", label: "Image 2 URL", type: "url", placeholder: "https://..." },
      { key: "img3", label: "Image 3 URL", type: "url", placeholder: "https://..." },
    ],
    defaultContent: {},
    preview: (_c) => (
      <div style={{ padding: "12px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, paddingBottom: "100%", position: "relative" }}>
            <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#8A8478" }}>🖼️</span>
          </div>
        ))}
      </div>
    )
  },
  visit_counter: {
    icon: "👁️", label: "Compteur", category: "Social",
    fields: [
      { key: "label", label: "Texte", type: "text", placeholder: "visiteurs" },
    ],
    defaultContent: { label: "visiteurs ce mois" },
    preview: (c) => (
      <div style={{ padding: "12px 16px", textAlign: "center" }}>
        <p style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "#C9A84C", fontWeight: 700, margin: 0 }}>1 234</p>
        <p style={{ color: "#8A8478", fontSize: 12, margin: "4px 0 0" }}>{c.label || "visiteurs"}</p>
      </div>
    )
  },
}

const CATEGORIES = ["Identité", "Action", "Social", "Contenu", "Local"]

const SYSTEM_PROMPT = `Tu es un assistant expert en création de pages QRfolio. Quand l'utilisateur décrit son activité, suggère des blocs et leur contenu.

Pour ajouter un bloc, utilise ce format exact sur une ligne séparée:
ADD_BLOCK:{"type":"nom_type","content":{"key":"value"}}

Types disponibles: profile, bio, cta_button, social_links, heading, rich_text, contact_form, testimonials, video, google_maps, gallery, visit_counter

Réponds en français, sois concis et actionnable.`

// ─── Main Component ───────────────────────────────────────────────────────────
export default function BuilderV2() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "profile", icon: "👤", label: "Profil", content: { name: "Mon Nom", tagline: "Mon activité" } },
    { id: "2", type: "bio", icon: "✏️", label: "Bio", content: { text: "Bienvenue sur ma page !" } },
    { id: "3", type: "cta_button", icon: "⚡", label: "Bouton CTA", content: { label: "Me contacter", url: "#", style: "primary" } },
  ])
  const [selectedId, setSelectedId] = useState<string | null>("1")
  const [pageName, setPageName] = useState("Ma Page")
  const [rightPanel, setRightPanel] = useState<"edit" | "ai" | "preview">("preview")
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile")
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Salut ! 👋 Décris ton activité et je construis ta page avec les bons blocs et du contenu prêt à l'emploi." }
  ])
  const [aiInput, setAiInput] = useState("")
  const [aiLoading, setAiLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [activeCategory, setActiveCategory] = useState("Identité")
  const messagesEnd = useRef<HTMLDivElement>(null)

  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const selectedBlock = blocks.find(b => b.id === selectedId)
  const selectedDef = selectedBlock ? BLOCK_DEFS[selectedBlock.type] : null

  function addBlock(type: string, content?: BlockContent) {
    const def = BLOCK_DEFS[type]
    if (!def) return
    const id = Date.now().toString() + Math.random()
    const block: Block = { id, type, icon: def.icon, label: def.label, content: content || { ...def.defaultContent } }
    setBlocks(p => [...p, block])
    setSelectedId(id)
    setRightPanel("edit")
  }

  function updateContent(id: string, key: string, value: string) {
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
      const n = [...p]; const s = dir === "up" ? idx - 1 : idx + 1;
      [n[idx], n[s]] = [n[s], n[idx]]; return n
    })
  }

  function parseBlocks(text: string) {
    let added = 0
    text.split("\n").forEach(line => {
      if (line.startsWith("ADD_BLOCK:")) {
        try { const j = JSON.parse(line.replace("ADD_BLOCK:", "").trim()); addBlock(j.type, j.content); added++ } catch {}
      }
    })
    return added
  }

  function cleanMsg(text: string) {
    return text.split("\n").filter(l => !l.startsWith("ADD_BLOCK:")).join("\n").trim()
  }

  async function sendAI(prompt?: string) {
    const msg = prompt || aiInput.trim()
    if (!msg || aiLoading) return
    setAiInput("")
    setMessages(p => [...p, { role: "user", content: msg }])
    setAiLoading(true)
    try {
      const hist = [...messages, { role: "user" as const, content: msg }]
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM_PROMPT, messages: hist.map(m => ({ role: m.role, content: m.content })) })
      })
      const data = await res.json()
      const reply = data.content?.[0]?.text || "Erreur."
      const added = parseBlocks(reply)
      const clean = cleanMsg(reply)
      setMessages(p => [...p, { role: "assistant", content: clean + (added > 0 ? `\n\n✅ ${added} bloc${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""} !` : "") }])
    } catch { setMessages(p => [...p, { role: "assistant", content: "Erreur de connexion." }]) }
    setAiLoading(false)
  }

  async function generateFull() {
    setGenerating(true)
    setRightPanel("ai")
    await sendAI("Génère une page QRfolio complète et professionnelle. Ajoute profil, bio, réseaux sociaux, bouton CTA et formulaire de contact avec du contenu d'exemple accrocheur.")
    setGenerating(false)
  }

  const G = "#C9A84C"
  const SURFACE = "#111009"
  const MUTED = "#8A8478"

  // ── Render block in preview ──
  function renderPreviewBlock(block: Block) {
    const def = BLOCK_DEFS[block.type]
    if (!def) return null
    const isSelected = block.id === selectedId
    return (
      <div key={block.id} onClick={() => { setSelectedId(block.id); setRightPanel("edit") }}
        style={{ background: isSelected ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${isSelected ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.05)"}`, borderRadius: 10, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", marginBottom: 6 }}>
        {def.preview(block.content)}
      </div>
    )
  }

  return (
    <div style={{ height: "100vh", background: "#080808", display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif", color: "#F5F0E8", overflow: "hidden" }}>

      {/* ── TOP BAR ── */}
      <div style={{ height: 52, background: "#0C0B09", borderBottom: "1px solid rgba(201,168,76,0.12)", display: "flex", alignItems: "center", padding: "0 16px", gap: 12, flexShrink: 0, zIndex: 20 }}>
        <a href="/dashboard" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: G, fontWeight: 700, textDecoration: "none", flexShrink: 0 }}>QRfolio</a>
        <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.08)" }} />
        <input value={pageName} onChange={e => setPageName(e.target.value)}
          style={{ background: "transparent", border: "none", color: "#F5F0E8", fontSize: 14, outline: "none", width: 140 }} />
        <div style={{ flex: 1 }} />
        <button onClick={generateFull} disabled={generating}
          style={{ display: "flex", alignItems: "center", gap: 7, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, padding: "6px 14px", color: G, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          <Wand2 size={13} /> {generating ? "Génération..." : "Générer avec l'IA"}
        </button>
        <button onClick={() => setRightPanel(rightPanel === "ai" ? "preview" : "ai")}
          style={{ display: "flex", alignItems: "center", gap: 7, background: rightPanel === "ai" ? "rgba(201,168,76,0.15)" : "transparent", border: `1px solid ${rightPanel === "ai" ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)"}`, borderRadius: 8, padding: "6px 14px", color: rightPanel === "ai" ? G : MUTED, fontSize: 12, cursor: "pointer" }}>
          <Sparkles size={13} /> IA
        </button>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, overflow: "hidden" }}>
          {([["mobile", <Smartphone key="m" size={13} />], ["desktop", <Monitor key="d" size={13} />]] as const).map(([mode, icon]) => (
            <button key={mode} onClick={() => setPreviewMode(mode as any)}
              style={{ background: previewMode === mode ? "rgba(201,168,76,0.15)" : "transparent", border: "none", color: previewMode === mode ? G : MUTED, padding: "6px 12px", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              {icon}
            </button>
          ))}
        </div>
        <button style={{ background: "transparent", border: `1px solid rgba(201,168,76,0.25)`, color: G, padding: "6px 14px", borderRadius: 6, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <Eye size={12} /> Aperçu
        </button>
        <button style={{ background: `linear-gradient(90deg,${G},#b8953f)`, border: "none", color: "#080808", padding: "6px 18px", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Publier →
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT: Block library ── */}
        <div style={{ width: 200, background: "#0C0B09", borderRight: "1px solid rgba(201,168,76,0.1)", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>
          {/* Categories */}
          <div style={{ padding: "12px 8px 8px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <p style={{ fontSize: 9, letterSpacing: 2, textTransform: "uppercase", color: G, margin: "0 0 8px", paddingLeft: 8 }}>Blocs</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  style={{ background: activeCategory === cat ? "rgba(201,168,76,0.12)" : "transparent", border: `1px solid ${activeCategory === cat ? "rgba(201,168,76,0.3)" : "transparent"}`, borderRadius: 6, padding: "3px 8px", color: activeCategory === cat ? G : MUTED, fontSize: 10, cursor: "pointer" }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
          {/* Block list */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
            {Object.entries(BLOCK_DEFS).filter(([, def]) => def.category === activeCategory).map(([type, def]) => (
              <button key={type} onClick={() => addBlock(type)}
                style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 13, cursor: "pointer", textAlign: "left", marginBottom: 2, transition: "all 0.15s" }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.background = "rgba(201,168,76,0.07)"; el.style.color = "#F5F0E8"; el.style.borderColor = "rgba(201,168,76,0.15)" }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.background = "transparent"; el.style.color = MUTED; el.style.borderColor = "transparent" }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{def.icon}</span>
                <span style={{ flex: 1 }}>{def.label}</span>
                <Plus size={12} style={{ opacity: 0.4, flexShrink: 0 }} />
              </button>
            ))}
          </div>
        </div>

        {/* ── CENTER: Canvas ── */}
        <div style={{ flex: 1, background: "#0A0908", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Canvas header */}
          <div style={{ padding: "12px 24px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#4A4640" }}>Canvas</span>
            <span style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "1px 8px", fontSize: 11, color: G }}>{blocks.length}</span>
          </div>
          {/* Blocks */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
            {blocks.length === 0 ? (
              <div style={{ border: "1px dashed rgba(201,168,76,0.15)", borderRadius: 16, padding: "60px 40px", textAlign: "center", color: "#4A4640", maxWidth: 480, margin: "40px auto" }}>
                <Sparkles size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: 14 }}>Ajoute un bloc depuis la librairie ou utilise l'IA</p>
              </div>
            ) : blocks.map((block, idx) => {
              const isSelected = block.id === selectedId
              const def = BLOCK_DEFS[block.type]
              return (
                <div key={block.id}
                  onClick={() => { setSelectedId(block.id); setRightPanel("edit") }}
                  style={{ maxWidth: 600, margin: "0 auto 10px", background: isSelected ? "rgba(201,168,76,0.05)" : SURFACE, border: `1.5px solid ${isSelected ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.1)"}`, borderRadius: 14, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", boxShadow: isSelected ? "0 0 0 3px rgba(201,168,76,0.1)" : "none" }}>
                  {/* Block header */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderBottom: isSelected ? "1px solid rgba(201,168,76,0.15)" : "1px solid rgba(255,255,255,0.04)", background: "rgba(0,0,0,0.2)" }}>
                    <GripVertical size={14} color={MUTED} style={{ cursor: "grab" }} />
                    <span style={{ fontSize: 16 }}>{block.icon}</span>
                    <span style={{ color: isSelected ? "#F5F0E8" : MUTED, fontSize: 13, fontWeight: 600, flex: 1 }}>{block.label}</span>
                    {isSelected && <span style={{ fontSize: 10, color: G, background: "rgba(201,168,76,0.1)", borderRadius: 4, padding: "2px 6px" }}>Sélectionné</span>}
                    <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => moveBlock(block.id, "up")} disabled={idx === 0}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5, width: 26, height: 26, color: MUTED, cursor: idx === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: idx === 0 ? 0.3 : 1 }}>
                        <ChevronUp size={11} />
                      </button>
                      <button onClick={() => moveBlock(block.id, "down")} disabled={idx === blocks.length - 1}
                        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 5, width: 26, height: 26, color: MUTED, cursor: idx === blocks.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: idx === blocks.length - 1 ? 0.3 : 1 }}>
                        <ChevronDown size={11} />
                      </button>
                      <button onClick={() => removeBlock(block.id)}
                        style={{ background: "rgba(255,82,82,0.08)", border: "1px solid rgba(255,82,82,0.15)", borderRadius: 5, width: 26, height: 26, color: "#FF5252", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  {/* Block preview */}
                  {def && def.preview(block.content)}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ width: rightPanel === "ai" ? 360 : 300, background: "#0C0B09", borderLeft: "1px solid rgba(201,168,76,0.1)", display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.3s ease", overflow: "hidden" }}>

          {/* Panel tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
            {([
              ["preview", <Eye key="e" size={13} />, "Preview"],
              ["edit", <Settings key="s" size={13} />, "Éditer"],
              ["ai", <Sparkles key="a" size={13} />, "IA"],
            ] as const).map(([panel, icon, label]) => (
              <button key={panel} onClick={() => setRightPanel(panel)}
                style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 4px", background: "transparent", border: "none", borderBottom: `2px solid ${rightPanel === panel ? G : "transparent"}`, color: rightPanel === panel ? G : MUTED, fontSize: 12, fontWeight: rightPanel === panel ? 700 : 400, cursor: "pointer", transition: "all 0.2s" }}>
                {icon} {label}
              </button>
            ))}
          </div>

          {/* PREVIEW TAB */}
          {rightPanel === "preview" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: previewMode === "mobile" ? 220 : 260, background: "#080808", border: previewMode === "mobile" ? "6px solid #1A1812" : "2px solid #1A1812", borderRadius: previewMode === "mobile" ? 32 : 12, overflow: "hidden", boxShadow: "0 0 40px rgba(0,0,0,0.6)", position: "relative" }}>
                {previewMode === "mobile" && <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 60, height: 10, background: "#1A1812", borderRadius: "0 0 6px 6px", zIndex: 10 }} />}
                <div style={{ padding: previewMode === "mobile" ? "20px 12px 12px" : "16px 12px", minHeight: 400 }}>
                  <div style={{ textAlign: "center", marginBottom: 12 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "#F5F0E8", margin: "0 0 2px" }}>{pageName}</p>
                    <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>qrfolio.app/ma-page</p>
                  </div>
                  {blocks.map(b => renderPreviewBlock(b))}
                  <div style={{ textAlign: "center", marginTop: 10 }}>
                    <p style={{ fontSize: 8, color: "#4A4640", margin: 0, letterSpacing: 1 }}>Créé avec QRfolio</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* EDIT TAB */}
          {rightPanel === "edit" && (
            <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
              {!selectedBlock ? (
                <div style={{ textAlign: "center", padding: "40px 16px" }}>
                  <Settings size={32} color={MUTED} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                  <p style={{ color: MUTED, fontSize: 13, margin: 0 }}>Sélectionne un bloc sur le canvas pour l'éditer</p>
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <div style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{selectedBlock.icon}</div>
                    <div>
                      <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: 0 }}>{selectedBlock.label}</p>
                      <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Édition du contenu</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    {selectedDef?.fields.map(field => (
                      <div key={field.key}>
                        <label style={{ color: MUTED, fontSize: 12, display: "block", marginBottom: 6, fontWeight: 500 }}>{field.label}</label>
                        {field.type === "textarea" ? (
                          <textarea
                            value={selectedBlock.content[field.key] || ""}
                            onChange={e => updateContent(selectedBlock.id, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            rows={3}
                            style={{ width: "100%", background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "10px 12px", color: "#F5F0E8", fontSize: 13, outline: "none", resize: "vertical", fontFamily: "DM Sans, sans-serif", boxSizing: "border-box" }}
                            onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                            onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                          />
                        ) : field.type === "select" ? (
                          <select
                            value={selectedBlock.content[field.key] || field.options?.[0]}
                            onChange={e => updateContent(selectedBlock.id, field.key, e.target.value)}
                            style={{ width: "100%", background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "10px 12px", color: "#F5F0E8", fontSize: 13, outline: "none" }}>
                            {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                        ) : (
                          <input
                            type={field.type === "url" ? "url" : "text"}
                            value={selectedBlock.content[field.key] || ""}
                            onChange={e => updateContent(selectedBlock.id, field.key, e.target.value)}
                            placeholder={field.placeholder}
                            style={{ width: "100%", background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "10px 12px", color: "#F5F0E8", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                            onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                            onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* AI TAB */}
          {rightPanel === "ai" && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
              <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: msg.role === "assistant" ? "rgba(201,168,76,0.12)" : "rgba(57,255,143,0.1)", border: `1px solid ${msg.role === "assistant" ? "rgba(201,168,76,0.3)" : "rgba(57,255,143,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {msg.role === "assistant" ? <Bot size={12} color={G} /> : <User size={12} color="#39FF8F" />}
                    </div>
                    <div style={{ maxWidth: "82%", background: msg.role === "assistant" ? SURFACE : "rgba(57,255,143,0.07)", border: `1px solid ${msg.role === "assistant" ? "rgba(201,168,76,0.1)" : "rgba(57,255,143,0.2)"}`, borderRadius: msg.role === "user" ? "10px 3px 10px 10px" : "3px 10px 10px 10px", padding: "9px 12px" }}>
                      <p style={{ color: "#F5F0E8", fontSize: 12, margin: 0, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bot size={12} color={G} />
                    </div>
                    <div style={{ background: SURFACE, border: "1px solid rgba(201,168,76,0.1)", borderRadius: "3px 10px 10px 10px", padding: "10px 14px", display: "flex", gap: 4 }}>
                      {[0,1,2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: G, animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />)}
                    </div>
                  </div>
                )}
                <div ref={messagesEnd} />
              </div>
              <div style={{ padding: "8px 12px", display: "flex", gap: 5, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                {["Freelance créatif", "Restaurant", "Coach sportif", "Artiste"].map(s => (
                  <button key={s} onClick={() => sendAI(s)}
                    style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 12, padding: "3px 9px", color: MUTED, fontSize: 10, cursor: "pointer" }}>{s}</button>
                ))}
              </div>
              <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(201,168,76,0.1)", display: "flex", gap: 7 }}>
                <input value={aiInput} onChange={e => setAiInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAI() } }}
                  placeholder="Décris ton activité..."
                  style={{ flex: 1, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "9px 11px", color: "#F5F0E8", fontSize: 12, outline: "none" }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"} />
                <button onClick={() => sendAI()} disabled={aiLoading || !aiInput.trim()}
                  style={{ background: `linear-gradient(90deg,${G},#b8953f)`, border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: !aiInput.trim() ? 0.5 : 1, flexShrink: 0 }}>
                  <Send size={13} color="#080808" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0);opacity:.4} 40%{transform:translateY(-5px);opacity:1} }
      `}</style>
    </div>
  )
}
