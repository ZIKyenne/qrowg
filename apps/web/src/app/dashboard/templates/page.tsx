"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Sparkles, ArrowRight, Check, X, Lock, Star, Zap, Crown, Search } from "lucide-react"

// Templates data inline pour éviter les problèmes d'encodage
const TEMPLATES = [
  // ── GRATUITS ──────────────────────────────────────────────────────────────
  {
    id: "freelance", name: "Freelance Pro", category: "Business", plan: "free",
    description: "Portfolio, services, tarifs, prise de contact",
    emoji: "💼", color: "#C9A84C", accent: "#39FF8F",
    bg: "#080808", surface: "#111009",
    tags: ["Services", "Tarifs", "Contact", "Calendly"],
    blockCount: 8,
  },
  {
    id: "restaurant", name: "Restaurant & Bar", category: "Food", plan: "free",
    description: "Menu, horaires, reservation, reseaux",
    emoji: "🍽️", color: "#EF4444", accent: "#F97316",
    bg: "#0D0505", surface: "#1A0A0A",
    tags: ["Menu", "Horaires", "Carte", "Reservation"],
    blockCount: 8,
  },
  {
    id: "artiste", name: "Artiste & Musicien", category: "Creatif", plan: "free",
    description: "Bio, musique, concerts, reseaux sociaux",
    emoji: "🎵", color: "#A78BFA", accent: "#F472B6",
    bg: "#0A0510", surface: "#130A20",
    tags: ["Spotify", "Concerts", "Reseaux", "Bio"],
    blockCount: 7,
  },
  {
    id: "coach", name: "Coach & Therapeute", category: "Bien-etre", plan: "free",
    description: "Presentation, methode, temoignages, RDV",
    emoji: "🧘", color: "#4ADE80", accent: "#86EFAC",
    bg: "#040D06", surface: "#081A0C",
    tags: ["Services", "Temoignages", "Tarifs", "RDV"],
    blockCount: 7,
  },
  {
    id: "createur", name: "Createur de contenu", category: "Creatif", plan: "free",
    description: "Liens reseaux, partenariats, stats",
    emoji: "📱", color: "#FF6B6B", accent: "#FFD93D",
    bg: "#080810", surface: "#10101E",
    tags: ["Reseaux", "Stats", "Partenariats", "Feed"],
    blockCount: 8,
  },
  {
    id: "event", name: "Evenement & Soiree", category: "Event", plan: "free",
    description: "Countdown, programme, billetterie",
    emoji: "🎉", color: "#EC4899", accent: "#A855F7",
    bg: "#05020D", surface: "#0D0620",
    tags: ["Countdown", "Programme", "Billets", "Lieu"],
    blockCount: 7,
  },
  // ── PRO ───────────────────────────────────────────────────────────────────
  {
    id: "ecommerce", name: "Boutique E-commerce", category: "Commerce", plan: "pro",
    description: "Produits phares, promos, avis, boutique",
    emoji: "🛍️", color: "#F97316", accent: "#FCD34D",
    bg: "#0D0700", surface: "#1A1000",
    tags: ["Produits", "Promo", "Avis", "Boutique"],
    blockCount: 7,
    highlight: "Catalogue produits + promo automatique",
  },
  {
    id: "coiffeur", name: "Salon Beaute", category: "Beaute", plan: "pro",
    description: "Services, galerie, avis, prise de RDV",
    emoji: "✂️", color: "#F472B6", accent: "#FB7185",
    bg: "#0D0508", surface: "#1A0812",
    tags: ["Services", "Galerie", "Avis", "RDV"],
    blockCount: 6,
    highlight: "Galerie avant/apres + reservations en ligne",
  },
  {
    id: "agence", name: "Agence & Studio", category: "Business", plan: "pro",
    description: "Portfolio, services, tarifs, contact pro",
    emoji: "🏢", color: "#38BDF8", accent: "#818CF8",
    bg: "#020C18", surface: "#041828",
    tags: ["Portfolio", "Services", "Tarifs", "Contact"],
    blockCount: 7,
    highlight: "Portfolio interactif + tunnel de conversion",
  },
  {
    id: "medecin", name: "Medecin & Praticien", category: "Sante", plan: "pro",
    description: "Cabinet, specialites, horaires, RDV Doctolib",
    emoji: "🏥", color: "#34D399", accent: "#6EE7B7",
    bg: "#020D08", surface: "#041A10",
    tags: ["Cabinet", "Specialites", "Horaires", "RDV"],
    blockCount: 7,
    highlight: "Integration Doctolib + informations cabinet",
  },
  // ── BUSINESS ──────────────────────────────────────────────────────────────
  {
    id: "vente_produits", name: "Vente Produits Digitaux", category: "Commerce", plan: "business",
    description: "Formations, ebooks, templates, acces membres",
    emoji: "📦", color: "#A78BFA", accent: "#F472B6",
    bg: "#060410", surface: "#0E0820",
    tags: ["Formations", "Produits", "Temoignages", "Acces"],
    blockCount: 7,
    highlight: "Tunnel de vente complet + social proof",
  },
  {
    id: "immobilier", name: "Agent Immobilier", category: "Immobilier", plan: "business",
    description: "Biens, expertises, contact, avis clients",
    emoji: "🏠", color: "#FBBF24", accent: "#F59E0B",
    bg: "#0A0800", surface: "#171200",
    tags: ["Biens", "Expertise", "Avis", "Contact"],
    blockCount: 8,
    highlight: "Vitrine biens + CRM integre + avis Google",
  },
  {
    id: "startup", name: "Startup & SaaS", category: "Tech", plan: "business",
    description: "Pitch, features, pricing, waitlist",
    emoji: "🚀", color: "#22D3EE", accent: "#818CF8",
    bg: "#030A14", surface: "#06152A",
    tags: ["Features", "Pricing", "Waitlist", "Stats"],
    blockCount: 9,
    highlight: "Landing page SaaS avec waitlist integree",
  },
  {
    id: "influenceur", name: "Influenceur & Personal Brand", category: "Creatif", plan: "business",
    description: "Media kit, statistiques, partenariats premium",
    emoji: "⭐", color: "#F59E0B", accent: "#EF4444",
    bg: "#0A0500", surface: "#150B00",
    tags: ["Media Kit", "Stats", "Partenariats", "Feed"],
    blockCount: 10,
    highlight: "Media kit professionnel + stats en temps reel",
  },
]

const PLAN_CONFIG = {
  free: { label: "Gratuit", color: "#8A8478", icon: "★", bg: "rgba(138,132,120,0.1)" },
  pro: { label: "Pro", color: "#C9A84C", icon: "⚡", bg: "rgba(201,168,76,0.1)" },
  business: { label: "Business", color: "#39FF8F", icon: "👑", bg: "rgba(57,255,143,0.1)" },
}

const CATEGORIES = ["Tous", "Business", "Food", "Creatif", "Bien-etre", "Commerce", "Event", "Beaute", "Sante", "Tech", "Immobilier"]

export default function TemplatesPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState("Tous")
  const [activePlan, setActivePlan] = useState<"all" | "free" | "pro" | "business">("all")
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const [userPlan] = useState("free") // TODO: fetch from profile
  const router = useRouter()

  const filtered = TEMPLATES.filter(t => {
    const matchCat = activeCategory === "Tous" || t.category === activeCategory
    const matchPlan = activePlan === "all" || t.plan === activePlan
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.description.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchPlan && matchSearch
  })

  const planRank: Record<string, number> = { free: 0, pro: 1, business: 2 }
  function canUse(templatePlan: string) {
    return planRank[userPlan] >= planRank[templatePlan]
  }

  async function createFromTemplate(templateId: string) {
    const template = TEMPLATES.find(t => t.id === templateId)
    if (!template) return
    if (!canUse(template.plan)) {
      router.push("/upgrade"); return
    }
    setCreating(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/auth/login"); return }

    const slug = template.id + "-" + Date.now().toString(36)
    const { data: page } = await supabase.from("pages").insert({
      user_id: user.id,
      title: template.name,
      slug,
      status: "draft",
      template_id: template.id,
      theme: { name: template.name, bg: template.bg, surface: template.surface, primary: template.color, accent: template.accent, text: "#F5F0E8", muted: "#8A8478", fontDisplay: "Cormorant Garamond", fontBody: "DM Sans", bgMode: "solid" },
    }).select().single()

    if (!page) { setCreating(false); return }

    // QR code
    const shortCode = Math.random().toString(36).slice(2, 10)
    await supabase.from("qr_codes").insert({ page_id: page.id, user_id: user.id, short_code: shortCode })

    router.push(`/dashboard/builder/${page.id}`)
  }

  const G = "#C9A84C"; const MUTED = "#8A8478"
  const selectedTemplate = TEMPLATES.find(t => t.id === selected)

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 24px 100px", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 20, padding: "6px 16px", marginBottom: 14 }}>
            <Sparkles size={14} color={G} />
            <span style={{ color: G, fontSize: 12, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>14 templates disponibles</span>
          </div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(28px,4vw,44px)", color: "#F5F0E8", fontWeight: 700, margin: "0 0 10px" }}>
            Choisis ton template
          </h1>
          <p style={{ color: MUTED, fontSize: 15, margin: 0 }}>
            Page pre-configuree, contenu ready, publie en 5 minutes.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
          {/* Search */}
          <div style={{ position: "relative", maxWidth: 400, margin: "0 auto", width: "100%" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: MUTED }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un template..."
              style={{ width: "100%", background: "#111009", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 10, padding: "10px 10px 10px 34px", color: "#F5F0E8", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
          </div>

          {/* Plan filter */}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {([["all", "Tous les plans", "#8A8478"], ["free", "Gratuit ★", "#8A8478"], ["pro", "Pro ⚡", "#C9A84C"], ["business", "Business 👑", "#39FF8F"]] as const).map(([plan, label, color]) => (
              <button key={plan} onClick={() => setActivePlan(plan)}
                style={{ background: activePlan === plan ? `${color}15` : "transparent", border: `1px solid ${activePlan === plan ? color + "50" : "rgba(255,255,255,0.08)"}`, borderRadius: 20, padding: "6px 16px", color: activePlan === plan ? color : MUTED, fontSize: 12, fontWeight: activePlan === plan ? 700 : 400, cursor: "pointer" }}>
                {label}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                style={{ background: activeCategory === cat ? "rgba(201,168,76,0.1)" : "transparent", border: `1px solid ${activeCategory === cat ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.06)"}`, borderRadius: 16, padding: "5px 12px", color: activeCategory === cat ? G : MUTED, fontSize: 11, cursor: "pointer" }}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 28 }}>
          {[
            { count: TEMPLATES.filter(t => t.plan === "free").length, label: "Gratuits", color: "#8A8478" },
            { count: TEMPLATES.filter(t => t.plan === "pro").length, label: "Pro", color: G },
            { count: TEMPLATES.filter(t => t.plan === "business").length, label: "Business", color: "#39FF8F" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <p style={{ color: s.color, fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{s.count}</p>
              <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Templates grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 18 }}>
          {filtered.map(template => {
            const isSelected = selected === template.id
            const planCfg = PLAN_CONFIG[template.plan]
            const locked = !canUse(template.plan)

            return (
              <div key={template.id} onClick={() => !locked && setSelected(isSelected ? null : template.id)}
                style={{ background: isSelected ? "rgba(201,168,76,0.06)" : "#111009", border: `2px solid ${isSelected ? "rgba(201,168,76,0.6)" : locked ? "rgba(255,255,255,0.05)" : "rgba(201,168,76,0.1)"}`, borderRadius: 16, overflow: "hidden", cursor: locked ? "not-allowed" : "pointer", transition: "all 0.2s", transform: isSelected ? "scale(1.02)" : "scale(1)", opacity: locked ? 0.7 : 1, position: "relative" }}>

                {/* Preview header */}
                <div style={{ height: 130, background: `linear-gradient(135deg, ${template.bg}, ${template.surface})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                  {/* Glow */}
                  <div style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 50% 50%, ${template.color}15, transparent 70%)` }} />

                  {/* Mini page preview */}
                  <div style={{ width: 100, background: template.bg, border: `1px solid ${template.color}30`, borderRadius: 8, overflow: "hidden", zIndex: 1 }}>
                    <div style={{ height: 6, background: `linear-gradient(90deg,${template.color},${template.accent})` }} />
                    <div style={{ padding: "8px 6px", display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ width: "60%", height: 4, background: template.color + "60", borderRadius: 2, margin: "0 auto" }} />
                      <div style={{ width: "40%", height: 3, background: MUTED + "40", borderRadius: 2, margin: "0 auto" }} />
                      {template.tags.slice(0, 3).map((_, i) => (
                        <div key={i} style={{ width: `${80 - i * 15}%`, height: 3, background: template.color + "20", borderRadius: 2 }} />
                      ))}
                      <div style={{ height: 8, background: template.color + "40", borderRadius: 2, marginTop: 2 }} />
                    </div>
                  </div>

                  {/* Emoji */}
                  <div style={{ position: "absolute", top: 10, right: 12, fontSize: 26 }}>{template.emoji}</div>

                  {/* Plan badge */}
                  <div style={{ position: "absolute", top: 10, left: 12, display: "flex", alignItems: "center", gap: 4, background: planCfg.bg, border: `1px solid ${planCfg.color}30`, borderRadius: 12, padding: "3px 8px" }}>
                    <span style={{ fontSize: 10 }}>{planCfg.icon}</span>
                    <span style={{ color: planCfg.color, fontSize: 10, fontWeight: 700 }}>{planCfg.label}</span>
                  </div>

                  {/* Selected check */}
                  {isSelected && (
                    <div style={{ position: "absolute", bottom: 8, right: 8, background: G, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={12} color="#080808" />
                    </div>
                  )}

                  {/* Lock overlay */}
                  {locked && (
                    <div style={{ position: "absolute", inset: 0, background: "rgba(8,8,8,0.5)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <Lock size={20} color={planCfg.color} />
                      <span style={{ color: planCfg.color, fontSize: 11, fontWeight: 700 }}>Plan {planCfg.label} requis</span>
                    </div>
                  )}

                  {/* Bottom accent */}
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${template.color},${template.accent})` }} />
                </div>

                {/* Info */}
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <h3 style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: 0, flex: 1 }}>{template.name}</h3>
                    <span style={{ background: template.color + "12", border: `1px solid ${template.color}25`, borderRadius: 8, padding: "2px 7px", fontSize: 9, color: template.color, fontWeight: 600 }}>{template.category}</span>
                  </div>
                  <p style={{ color: MUTED, fontSize: 11, margin: "0 0 8px", lineHeight: 1.5 }}>{template.description}</p>

                  {template.highlight && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, background: template.color + "08", border: `1px solid ${template.color}15`, borderRadius: 6, padding: "5px 8px", marginBottom: 8 }}>
                      <span style={{ color: template.color, fontSize: 10 }}>✦</span>
                      <span style={{ color: template.color, fontSize: 10, fontWeight: 600 }}>{template.highlight}</span>
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {template.tags.slice(0, 3).map((tag, i) => (
                        <span key={i} style={{ background: "rgba(255,255,255,0.05)", borderRadius: 4, padding: "2px 5px", fontSize: 9, color: MUTED }}>{tag}</span>
                      ))}
                    </div>
                    <span style={{ color: MUTED, fontSize: 10 }}>{template.blockCount} blocs</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 24px", color: MUTED }}>
            <p style={{ fontSize: 32, margin: "0 0 12px" }}>🔍</p>
            <p style={{ fontSize: 14 }}>Aucun template pour cette recherche</p>
          </div>
        )}

        {/* Blank option */}
        <div style={{ textAlign: "center", marginTop: 32 }}>
          <button onClick={() => router.push("/dashboard")}
            style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "12px 24px", color: MUTED, fontSize: 13, cursor: "pointer" }}>
            Commencer avec une page vide →
          </button>
        </div>
      </div>

      {/* Bottom CTA */}
      {selected && selectedTemplate && (
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0C0B09", borderTop: "1px solid rgba(201,168,76,0.2)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, zIndex: 100, boxShadow: "0 -8px 30px rgba(0,0,0,0.5)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 44, height: 44, background: selectedTemplate.bg, border: `1px solid ${selectedTemplate.color}30`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{selectedTemplate.emoji}</div>
            <div>
              <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: 0 }}>{selectedTemplate.name}</p>
              <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{selectedTemplate.blockCount} blocs · theme {selectedTemplate.category}</p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setSelected(null)}
              style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", color: MUTED, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 13 }}>
              <X size={13} /> Annuler
            </button>
            <button onClick={() => createFromTemplate(selected)} disabled={creating}
              style={{ display: "flex", alignItems: "center", gap: 8, background: `linear-gradient(90deg,${G},#b8953f)`, border: "none", borderRadius: 10, padding: "10px 22px", color: "#080808", fontSize: 13, fontWeight: 700, cursor: creating ? "wait" : "pointer", opacity: creating ? 0.7 : 1, boxShadow: `0 4px 20px rgba(201,168,76,0.3)` }}>
              {creating ? "Creation..." : <><Sparkles size={13} /> Utiliser ce template <ArrowRight size={13} /></>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
