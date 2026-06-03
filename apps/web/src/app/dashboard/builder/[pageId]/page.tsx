"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, Send, Plus, Trash2, ChevronUp, ChevronDown, X, Wand2, Bot, User } from "lucide-react"

const BLOCK_TYPES = [
  { type: "profile",       icon: "👤", label: "Profil" },
  { type: "bio",           icon: "✏️",  label: "Bio" },
  { type: "social_links",  icon: "🔗", label: "Réseaux sociaux" },
  { type: "gallery",       icon: "🖼️",  label: "Galerie" },
  { type: "cta_button",    icon: "⚡", label: "Bouton CTA" },
  { type: "contact_form",  icon: "✉️",  label: "Formulaire" },
  { type: "google_maps",   icon: "📍", label: "Carte" },
  { type: "testimonials",  icon: "💬", label: "Témoignages" },
  { type: "visit_counter", icon: "👁️",  label: "Compteur" },
  { type: "video",         icon: "▶️",  label: "Vidéo" },
  { type: "heading",       icon: "H",  label: "Titre" },
  { type: "rich_text",     icon: "📝", label: "Texte" },
]

type Block = {
  id: string
  type: string
  icon: string
  label: string
  content?: Record<string, string>
}

type Message = {
  role: "user" | "assistant"
  content: string
}

const SYSTEM_PROMPT = `Tu es un assistant expert en création de pages QRfolio. Tu aides les utilisateurs à construire leur page de présentation professionnelle.

Quand l'utilisateur décrit son activité ou ses besoins, tu dois:
1. Suggérer quels blocs ajouter (parmi: profile, bio, social_links, gallery, cta_button, contact_form, google_maps, testimonials, video, heading, rich_text)
2. Proposer du contenu concret pour remplir ces blocs
3. Donner des conseils de design et de structure

IMPORTANT: Quand tu suggères des blocs à ajouter, inclus toujours une ligne JSON au format exact suivant (une par bloc):
ADD_BLOCK:{"type":"nom_du_bloc","content":{"key":"value"}}

Exemples:
ADD_BLOCK:{"type":"bio","content":{"text":"Développeur web freelance passionné par React et Next.js"}}
ADD_BLOCK:{"type":"cta_button","content":{"label":"Me contacter","url":"mailto:email@example.com"}}
ADD_BLOCK:{"type":"social_links","content":{"instagram":"@monpseudo","linkedin":"linkedin.com/in/moi"}}

Réponds toujours en français, de manière concise et actionnable. Commence par une phrase d'intro courte, puis liste les suggestions.`

export default function BuilderWithAI() {
  const [blocks, setBlocks] = useState<Block[]>([
    { id: "1", type: "profile", icon: "👤", label: "Profil", content: { name: "Mon Nom" } },
    { id: "2", type: "bio",     icon: "✏️",  label: "Bio",    content: { text: "Ma bio..." } },
  ])
  const [selectedId, setSelectedId] = useState<string | null>("1")
  const [pageName, setPageName] = useState("Ma Page")
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile")

  // AI state
  const [aiOpen, setAiOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Salut ! 👋 Décris-moi ton activité ou ce que tu veux mettre sur ta page, et je vais te suggérer la meilleure structure avec du contenu prêt à l'emploi." }
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function addBlock(type: string, content?: Record<string, string>) {
    const found = BLOCK_TYPES.find(b => b.type === type)
    if (!found) return
    const newBlock: Block = {
      id: Date.now().toString() + Math.random(),
      type: found.type,
      icon: found.icon,
      label: found.label,
      content: content || {}
    }
    setBlocks(prev => [...prev, newBlock])
    setSelectedId(newBlock.id)
  }

  function removeBlock(id: string) {
    setBlocks(prev => prev.filter(b => b.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  function moveBlock(id: string, dir: "up" | "down") {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id)
      if (dir === "up" && idx === 0) return prev
      if (dir === "down" && idx === prev.length - 1) return prev
      const next = [...prev]
      const swap = dir === "up" ? idx - 1 : idx + 1;
      [next[idx], next[swap]] = [next[swap], next[idx]]
      return next
    })
  }

  function parseAndApplyBlocks(text: string) {
    const lines = text.split("\n")
    let added = 0
    lines.forEach(line => {
      if (line.startsWith("ADD_BLOCK:")) {
        try {
          const json = JSON.parse(line.replace("ADD_BLOCK:", "").trim())
          addBlock(json.type, json.content || {})
          added++
        } catch {}
      }
    })
    return added
  }

  function cleanMessage(text: string) {
    return text.split("\n").filter(l => !l.startsWith("ADD_BLOCK:")).join("\n").trim()
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMsg }])
    setLoading(true)

    try {
      const history = [...messages, { role: "user", content: userMsg }]
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: history.map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await response.json()
      const reply = data.content?.[0]?.text || "Désolé, une erreur est survenue."
      const added = parseAndApplyBlocks(reply)
      const clean = cleanMessage(reply)
      const finalMsg = added > 0
        ? clean + `\n\n✅ ${added} bloc${added > 1 ? "s" : ""} ajouté${added > 1 ? "s" : ""} à ta page !`
        : clean
      setMessages(prev => [...prev, { role: "assistant", content: finalMsg }])
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur de connexion. Vérifie ta connexion internet." }])
    }
    setLoading(false)
  }

  async function generateFullPage() {
    setGenerating(true)
    const prompt = `Génère une page QRfolio complète et professionnelle pour un freelance créatif. 
Ajoute tous les blocs essentiels avec du contenu d'exemple réaliste et accrocheur.
Inclus: profil, bio, réseaux sociaux, bouton CTA, formulaire de contact.`

    setMessages(prev => [...prev, 
      { role: "user", content: "Génère une page complète pour moi" },
    ])

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }]
        })
      })
      const data = await response.json()
      const reply = data.content?.[0]?.text || ""
      const added = parseAndApplyBlocks(reply)
      const clean = cleanMessage(reply)
      setMessages(prev => [...prev, { 
        role: "assistant", 
        content: clean + (added > 0 ? `\n\n✅ ${added} blocs ajoutés !` : "")
      }])
      setAiOpen(true)
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Erreur lors de la génération." }])
    }
    setGenerating(false)
  }

  const GOLD = "#C9A84C"
  const BG = "#080808"
  const SURFACE = "#111009"
  const MUTED = "#8A8478"

  return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", flexDirection: "column", fontFamily: "DM Sans, sans-serif", color: "#F5F0E8" }}>

      {/* ── Top Bar ── */}
      <div style={{ height: 56, background: "#0C0B09", borderBottom: "1px solid rgba(201,168,76,0.12)", display: "flex", alignItems: "center", padding: "0 20px", gap: 16, flexShrink: 0, zIndex: 10 }}>
        <a href="/dashboard" style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, color: "#F5F0E8", textDecoration: "none" }}>
          QR<span style={{ color: GOLD, fontWeight: 700 }}>folio</span>
        </a>
        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.08)" }} />
        <input value={pageName} onChange={e => setPageName(e.target.value)}
          style={{ background: "transparent", border: "none", color: "#F5F0E8", fontSize: 14, fontFamily: "DM Sans, sans-serif", outline: "none", width: 160 }} />
        <div style={{ flex: 1 }} />

        {/* AI Generate button */}
        <button onClick={generateFullPage} disabled={generating}
          style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, padding: "7px 14px", color: GOLD, fontSize: 13, fontWeight: 600, cursor: generating ? "wait" : "pointer" }}>
          <Wand2 size={14} /> {generating ? "Génération..." : "Générer avec l'IA"}
        </button>

        {/* AI toggle */}
        <button onClick={() => setAiOpen(o => !o)}
          style={{ display: "flex", alignItems: "center", gap: 7, background: aiOpen ? "rgba(201,168,76,0.15)" : "transparent", border: `1px solid ${aiOpen ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.2)"}`, borderRadius: 8, padding: "7px 14px", color: aiOpen ? GOLD : MUTED, fontSize: 13, cursor: "pointer" }}>
          <Sparkles size={14} /> Copilote IA
        </button>

        {/* Preview toggle */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, overflow: "hidden" }}>
          {(["mobile", "desktop"] as const).map(mode => (
            <button key={mode} onClick={() => setPreviewMode(mode)}
              style={{ background: previewMode === mode ? "rgba(201,168,76,0.15)" : "transparent", border: "none", color: previewMode === mode ? GOLD : MUTED, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
              {mode === "mobile" ? "📱" : "🖥️"} {mode === "mobile" ? "Mobile" : "Desktop"}
            </button>
          ))}
        </div>

        <button style={{ background: "transparent", border: `1px solid rgba(201,168,76,0.25)`, color: GOLD, padding: "7px 16px", borderRadius: 6, fontSize: 13, cursor: "pointer" }}>Aperçu</button>
        <button style={{ background: `linear-gradient(90deg, ${GOLD}, #b8953f)`, border: "none", color: "#080808", padding: "7px 20px", borderRadius: 6, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Publier →</button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* LEFT — Blocs */}
        <div style={{ width: 200, background: "#0C0B09", borderRight: "1px solid rgba(201,168,76,0.1)", padding: "20px 10px", overflowY: "auto", flexShrink: 0 }}>
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: GOLD, marginBottom: 12, paddingLeft: 8 }}>Blocs</p>
          {BLOCK_TYPES.map(block => (
            <button key={block.type} onClick={() => addBlock(block.type)}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", background: "transparent", border: "1px solid transparent", borderRadius: 8, color: MUTED, fontSize: 13, cursor: "pointer", fontFamily: "DM Sans, sans-serif", textAlign: "left", marginBottom: 2 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.06)"; (e.currentTarget as HTMLElement).style.color = "#F5F0E8" }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = MUTED }}>
              <span style={{ fontSize: 15 }}>{block.icon}</span>
              {block.label}
              <span style={{ marginLeft: "auto", opacity: 0.4 }}>+</span>
            </button>
          ))}
        </div>

        {/* CENTER — Canvas */}
        <div style={{ flex: 1, background: "#0A0908", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 24px", overflowY: "auto", gap: 6 }}>
          <p style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: "#4A4640", marginBottom: 12 }}>Canvas — {blocks.length} bloc{blocks.length !== 1 ? "s" : ""}</p>
          {blocks.length === 0 && (
            <div style={{ border: "1px dashed rgba(201,168,76,0.15)", borderRadius: 12, padding: "60px 40px", textAlign: "center", color: "#4A4640", maxWidth: 400 }}>
              <Sparkles size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: 14 }}>Ajoute un bloc ou utilise le Copilote IA →</p>
            </div>
          )}
          {blocks.map((block, idx) => (
            <div key={block.id} onClick={() => setSelectedId(block.id)}
              style={{ width: "100%", maxWidth: 520, background: selectedId === block.id ? "rgba(201,168,76,0.06)" : SURFACE, border: `1px solid ${selectedId === block.id ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.12)"}`, borderRadius: 12, padding: "14px 18px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "all 0.15s" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{block.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#F5F0E8", margin: 0 }}>{block.label}</p>
                {block.content && Object.keys(block.content).length > 0 && (
                  <p style={{ fontSize: 11, color: MUTED, margin: "2px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 300 }}>
                    {Object.values(block.content)[0]}
                  </p>
                )}
              </div>
              <div style={{ display: "flex", gap: 4 }} onClick={e => e.stopPropagation()}>
                <button onClick={() => moveBlock(block.id, "up")} disabled={idx === 0}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, width: 28, height: 28, color: MUTED, cursor: idx === 0 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: idx === 0 ? 0.3 : 1 }}>
                  <ChevronUp size={12} />
                </button>
                <button onClick={() => moveBlock(block.id, "down")} disabled={idx === blocks.length - 1}
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, width: 28, height: 28, color: MUTED, cursor: idx === blocks.length - 1 ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: idx === blocks.length - 1 ? 0.3 : 1 }}>
                  <ChevronDown size={12} />
                </button>
                <button onClick={() => removeBlock(block.id)}
                  style={{ background: "rgba(255,82,82,0.08)", border: "1px solid rgba(255,82,82,0.2)", borderRadius: 6, width: 28, height: 28, color: "#FF5252", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT — Preview + AI */}
        <div style={{ width: aiOpen ? 380 : 280, background: "#0C0B09", borderLeft: "1px solid rgba(201,168,76,0.1)", display: "flex", flexDirection: "column", flexShrink: 0, transition: "width 0.3s ease", overflow: "hidden" }}>

          {aiOpen ? (
            /* ── AI PANEL ── */
            <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
              {/* AI Header */}
              <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(201,168,76,0.1)", display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, padding: 6 }}>
                  <Sparkles size={16} color={GOLD} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: 0 }}>Copilote IA</p>
                  <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>Propulsé par Claude</p>
                </div>
                <button onClick={() => setAiOpen(false)} style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", display: "flex" }}>
                  <X size={16} />
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 12 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: msg.role === "assistant" ? "rgba(201,168,76,0.12)" : "rgba(57,255,143,0.12)", border: `1px solid ${msg.role === "assistant" ? "rgba(201,168,76,0.3)" : "rgba(57,255,143,0.3)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {msg.role === "assistant" ? <Bot size={14} color={GOLD} /> : <User size={14} color="#39FF8F" />}
                    </div>
                    <div style={{ maxWidth: "80%", background: msg.role === "assistant" ? SURFACE : "rgba(57,255,143,0.08)", border: `1px solid ${msg.role === "assistant" ? "rgba(201,168,76,0.12)" : "rgba(57,255,143,0.2)"}`, borderRadius: msg.role === "user" ? "12px 4px 12px 12px" : "4px 12px 12px 12px", padding: "10px 12px" }}>
                      <p style={{ color: "#F5F0E8", fontSize: 13, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{msg.content}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Bot size={14} color={GOLD} />
                    </div>
                    <div style={{ background: SURFACE, border: "1px solid rgba(201,168,76,0.12)", borderRadius: "4px 12px 12px 12px", padding: "12px 16px", display: "flex", gap: 4, alignItems: "center" }}>
                      {[0,1,2].map(i => (
                        <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, animation: `bounce 1s ease-in-out ${i * 0.2}s infinite` }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick suggestions */}
              <div style={{ padding: "8px 16px", display: "flex", gap: 6, flexWrap: "wrap", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                {["Je suis freelance", "Restaurant / café", "Artiste / créatif", "Page événement"].map(s => (
                  <button key={s} onClick={() => { setInput(s); }}
                    style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 16, padding: "4px 10px", color: MUTED, fontSize: 11, cursor: "pointer" }}>
                    {s}
                  </button>
                ))}
              </div>

              {/* Input */}
              <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(201,168,76,0.1)", display: "flex", gap: 8 }}>
                <input
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                  placeholder="Décris ton activité..."
                  style={{ flex: 1, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "10px 12px", color: "#F5F0E8", fontSize: 13, outline: "none", fontFamily: "DM Sans, sans-serif" }}
                  onFocus={e => e.target.style.borderColor = "rgba(201,168,76,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(201,168,76,0.2)"}
                />
                <button onClick={sendMessage} disabled={loading || !input.trim()}
                  style={{ background: `linear-gradient(90deg, ${GOLD}, #b8953f)`, border: "none", borderRadius: 8, width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: loading ? "wait" : "pointer", opacity: !input.trim() ? 0.5 : 1, flexShrink: 0 }}>
                  <Send size={15} color="#080808" />
                </button>
              </div>
            </div>
          ) : (
            /* ── PREVIEW PANEL ── */
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto" }}>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: GOLD, marginBottom: 20 }}>Preview</p>
              <div style={{ width: 220, minHeight: 400, background: BG, border: "6px solid #1A1812", borderRadius: 32, overflow: "hidden", boxShadow: "0 0 40px rgba(0,0,0,0.6)", position: "relative" }}>
                <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 60, height: 12, background: "#1A1812", borderRadius: "0 0 8px 8px", zIndex: 10 }} />
                <div style={{ padding: "28px 14px 16px" }}>
                  <div style={{ textAlign: "center", marginBottom: 14 }}>
                    <div style={{ width: 56, height: 56, background: "rgba(201,168,76,0.15)", border: "2px solid rgba(201,168,76,0.3)", borderRadius: "50%", margin: "0 auto 8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👤</div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#F5F0E8", margin: "0 0 2px" }}>{pageName}</p>
                    <p style={{ fontSize: 10, color: MUTED, margin: 0 }}>qrfolio.app/ma-page</p>
                  </div>
                  {blocks.map(block => (
                    <div key={block.id} style={{ background: selectedId === block.id ? "rgba(201,168,76,0.08)" : "rgba(255,255,255,0.03)", border: `1px solid ${selectedId === block.id ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 6, padding: "8px 10px", marginBottom: 5, display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 12 }}>{block.icon}</span>
                      <span style={{ fontSize: 10, color: MUTED }}>{block.label}</span>
                    </div>
                  ))}
                  <div style={{ textAlign: "center", marginTop: 12 }}>
                    <p style={{ fontSize: 8, color: "#4A4640", letterSpacing: 1, margin: 0 }}>Créé avec QRfolio</p>
                  </div>
                </div>
              </div>

              {/* AI shortcut */}
              <button onClick={() => setAiOpen(true)}
                style={{ marginTop: 20, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "12px", color: GOLD, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <Sparkles size={14} /> Ouvrir le Copilote IA
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
