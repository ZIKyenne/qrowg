"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import TEMPLATES from "./templates-data"
import { Sparkles, ArrowRight, Check, X } from "lucide-react"

const CATEGORIES = ["Tous", "Food & Drink", "Business", "Créatif", "Bien-être", "Commerce", "Event", "Beauté"]

export default function TemplatesPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState("Tous")
  const [creating, setCreating] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const router = useRouter()

  const filtered = TEMPLATES.filter(t => activeCategory === "Tous" || t.category === activeCategory)

  async function createFromTemplate(templateId: string) {
    const template = TEMPLATES.find(t => t.id === templateId)
    if (!template) return
    setCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    // Créer la page
    const slug = template.id + "-" + Date.now().toString(36)
    const { data: page, error } = await supabase.from("pages").insert({
      user_id: user.id,
      title: template.name,
      slug,
      status: "draft",
      template_id: template.id,
      theme: template.theme,
    }).select().single()

    if (error || !page) { setCreating(false); return }

    // Créer les blocs
    const blocksToInsert = template.blocks.map((b, i) => ({
      page_id: page.id,
      type: b.type,
      position: i,
      content: b.content,
      is_visible: true,
      styles: {},
    }))
    await supabase.from("blocks").insert(blocksToInsert)

    // Créer le QR code
    const { nanoid } = await import("nanoid")
    const shortCode = nanoid(8)
    await supabase.from("qr_codes").insert({
      page_id: page.id,
      user_id: user.id,
      short_code: shortCode,
    })

    router.push(`/dashboard/builder/${page.id}`)
  }

  const G = "#C9A84C"
  const MUTED = "#8A8478"

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 24px", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 20, padding: "6px 16px", marginBottom: 16 }}>
            <Sparkles size={14} color={G} />
            <span style={{ color: G, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>Templates prêts à l'emploi</span>
          </div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px,4vw,44px)", color: "#F5F0E8", fontWeight: 700, margin: "0 0 12px" }}>
            Choisis ton template
          </h1>
          <p style={{ color: MUTED, fontSize: 15, margin: 0, lineHeight: 1.7 }}>
            Sélectionne un template, personnalise-le, publie en 5 minutes.
          </p>
        </div>

        {/* Categories */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 32 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)}
              style={{ background: activeCategory === cat ? "rgba(201,168,76,0.12)" : "transparent", border: `1px solid ${activeCategory === cat ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: "7px 16px", color: activeCategory === cat ? G : MUTED, fontSize: 13, fontWeight: activeCategory === cat ? 700 : 400, cursor: "pointer", transition: "all 0.2s" }}>
              {cat}
            </button>
          ))}
        </div>

        {/* Templates grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 20, marginBottom: 32 }}>
          {filtered.map(template => {
            const isSelected = selected === template.id
            return (
              <div key={template.id}
                onClick={() => setSelected(isSelected ? null : template.id)}
                style={{ background: isSelected ? "rgba(201,168,76,0.06)" : "#111009", border: `2px solid ${isSelected ? "rgba(201,168,76,0.6)" : "rgba(201,168,76,0.1)"}`, borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all 0.2s", transform: isSelected ? "scale(1.02)" : "scale(1)", boxShadow: isSelected ? "0 0 30px rgba(201,168,76,0.15)" : "none" }}>

                {/* Preview header */}
                <div style={{ height: 120, background: template.theme.bgGradient || template.theme.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, position: "relative", overflow: "hidden" }}>
                  {/* Mini preview blocs */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, width: "70%", opacity: 0.6 }}>
                    {template.preview_blocks.slice(0, 3).map((b, i) => (
                      <div key={i} style={{ background: template.theme.primary + "20", border: `1px solid ${template.theme.primary}30`, borderRadius: 4, height: 10, width: i === 0 ? "100%" : i === 1 ? "80%" : "60%" }} />
                    ))}
                  </div>
                  <div style={{ position: "absolute", top: 10, right: 10 }}>
                    <span style={{ fontSize: 28 }}>{template.emoji}</span>
                  </div>
                  {isSelected && (
                    <div style={{ position: "absolute", top: 10, left: 10, background: G, borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={13} color="#080808" />
                    </div>
                  )}
                  {/* Color accent */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${template.color}, ${template.theme.accent || template.color})` }} />
                </div>

                {/* Info */}
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <h3 style={{ color: "#F5F0E8", fontSize: 15, fontWeight: 700, margin: 0 }}>{template.name}</h3>
                    <span style={{ background: template.color + "15", border: `1px solid ${template.color}30`, borderRadius: 10, padding: "2px 8px", fontSize: 10, color: template.color, fontWeight: 600 }}>{template.category}</span>
                  </div>
                  <p style={{ color: MUTED, fontSize: 12, margin: "0 0 10px", lineHeight: 1.5 }}>{template.description}</p>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {template.preview_blocks.map((b, i) => (
                      <span key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "2px 6px", fontSize: 10, color: MUTED }}>{b}</span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        {selected && (
          <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0C0B09", borderTop: "1px solid rgba(201,168,76,0.2)", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 24 }}>{TEMPLATES.find(t => t.id === selected)?.emoji}</span>
              <div>
                <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: 0 }}>{TEMPLATES.find(t => t.id === selected)?.name}</p>
                <p style={{ color: MUTED, fontSize: 12, margin: 0 }}>{TEMPLATES.find(t => t.id === selected)?.blocks.length} blocs préconfigurés</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSelected(null)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                <X size={14} /> Annuler
              </button>
              <button onClick={() => createFromTemplate(selected!)} disabled={creating}
                style={{ display: "flex", alignItems: "center", gap: 8, background: `linear-gradient(90deg,${G},#b8953f)`, border: "none", borderRadius: 10, padding: "10px 24px", color: "#080808", fontSize: 14, fontWeight: 700, cursor: creating ? "wait" : "pointer", opacity: creating ? 0.7 : 1 }}>
                {creating ? "Création en cours..." : <><Sparkles size={14} /> Utiliser ce template <ArrowRight size={14} /></>}
              </button>
            </div>
          </div>
        )}

        {/* Blank option */}
        <div style={{ textAlign: "center", paddingBottom: selected ? 80 : 0 }}>
          <button onClick={() => router.push("/dashboard/pages/new")} style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "12px 24px", color: MUTED, fontSize: 13, cursor: "pointer" }}>
            Ou commencer avec une page vide →
          </button>
        </div>

      </div>
    </div>
  )
}
