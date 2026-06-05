"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Check, Zap, Crown, Star, ArrowLeft, Sparkles } from "lucide-react"
import Link from "next/link"

const PLANS = [
  {
    id: "free",
    name: "Gratuit",
    price: { monthly: "0", annual: "0" },
    color: "#8A8478",
    icon: <Star size={20} />,
    description: "Pour decouvrir QRfolio",
    badge: null,
    perks: [
      { text: "1 page", included: true },
      { text: "500 vues / mois", included: true },
      { text: "1 QR code basique", included: true },
      { text: "Analytics de base", included: true },
      { text: "Branding QRfolio visible", included: true },
      { text: "Domaine personnalise", included: false },
      { text: "QR codes personnalises", included: false },
      { text: "Analytics avances", included: false },
      { text: "Templates premium", included: false },
    ],
    cta: "Plan actuel",
    ctaDisabled: true,
  },
  {
    id: "starter",
    name: "Starter",
    price: { monthly: "2.99", annual: "2.39" },
    color: "#38BDF8",
    icon: <Zap size={20} />,
    description: "Pour les createurs individuels",
    badge: "POPULAIRE",
    highlight: true,
    perks: [
      { text: "3 pages", included: true },
      { text: "5 000 vues / mois", included: true },
      { text: "QR codes personnalises", included: true },
      { text: "Sans branding QRfolio", included: true },
      { text: "Analytics standard", included: true },
      { text: "Domaine personnalise", included: true },
      { text: "Templates Starter", included: true },
      { text: "Support par email", included: true },
      { text: "Analytics avances", included: false },
    ],
    cta: "Commencer l essai gratuit",
    priceId: "starter",
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: "9.99", annual: "7.99" },
    color: "#C9A84C",
    icon: <Sparkles size={20} />,
    description: "Pour les professionnels et commerces",
    badge: null,
    perks: [
      { text: "Pages illimitees", included: true },
      { text: "50 000 vues / mois", included: true },
      { text: "QR codes personnalises avances", included: true },
      { text: "Sans branding QRfolio", included: true },
      { text: "Analytics avances + export", included: true },
      { text: "Domaine personnalise", included: true },
      { text: "Tous les templates", included: true },
      { text: "Support prioritaire", included: true },
      { text: "Rapport hebdo par IA", included: true },
    ],
    cta: "Passer a Pro",
    priceId: "pro",
  },
  {
    id: "business",
    name: "Business",
    price: { monthly: "24.99", annual: "19.99" },
    color: "#39FF8F",
    icon: <Crown size={20} />,
    description: "Pour les agences et equipes",
    badge: null,
    perks: [
      { text: "Vues illimitees", included: true },
      { text: "Tout Plan Pro inclus", included: true },
      { text: "Gestion equipe (5 membres)", included: true },
      { text: "Acces API complet", included: true },
      { text: "Pages en marque blanche", included: true },
      { text: "Support dedie 24/7", included: true },
      { text: "Onboarding personnalise", included: true },
      { text: "SLA garanti 99.9%", included: true },
      { text: "Facturation entreprise", included: true },
    ],
    cta: "Contacter l equipe",
    priceId: "business",
  },
]

const COMPARISON = [
  { feature: "Pages", free: "1", starter: "3", pro: "Illimitees", business: "Illimitees" },
  { feature: "Vues / mois", free: "500", starter: "5 000", pro: "50 000", business: "Illimitees" },
  { feature: "QR codes", free: "Basique", starter: "Personnalise", pro: "Avance", business: "Avance" },
  { feature: "Branding QRfolio", free: "Oui", starter: "Non", pro: "Non", business: "Non" },
  { feature: "Domaine perso", free: "—", starter: "✓", pro: "✓", business: "✓" },
  { feature: "Analytics", free: "De base", starter: "Standard", pro: "Avances + export", business: "Avances + export" },
  { feature: "Templates", free: "6 gratuits", starter: "+4 Starter", pro: "Tous", business: "Tous" },
  { feature: "Rapport IA", free: "—", starter: "—", pro: "✓", business: "✓" },
  { feature: "Equipe", free: "—", starter: "—", pro: "—", business: "5 membres" },
  { feature: "API", free: "—", starter: "—", pro: "—", business: "✓" },
  { feature: "Support", free: "FAQ", starter: "Email", pro: "Prioritaire", business: "Dedie 24/7" },
]

export default function UpgradePage() {
  const [currentPlan, setCurrentPlan] = useState("free")
  const [loading, setLoading] = useState<string | null>(null)
  const [annual, setAnnual] = useState(false)
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from("profiles").select("plan").eq("id", user.id).single().then(({ data }) => {
        if (data) setCurrentPlan(data.plan)
      })
    })
  }, [])

  async function handleUpgrade(plan: typeof PLANS[0]) {
    if (plan.ctaDisabled || currentPlan === plan.id) return
    if (plan.id === "business") {
      window.location.href = "mailto:hello@qrfolio.app?subject=Plan Business QRfolio"
      return
    }
    setLoading(plan.id)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/auth/login"; return }
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.id, annual, userId: user.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { setLoading(null) }
  }

  const G = "#C9A84C"; const MUTED = "#8A8478"

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "DM Sans, sans-serif", padding: "0 24px 80px" }}>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Back */}
        <div style={{ paddingTop: 32, marginBottom: 40 }}>
          <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: MUTED, textDecoration: "none", fontSize: 14 }}>
            <ArrowLeft size={16} /> Retour au dashboard
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ display: "inline-block", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "6px 16px", marginBottom: 18, fontSize: 12, color: G, letterSpacing: 2, textTransform: "uppercase" }}>
            Choisissez votre plan
          </div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(32px,5vw,52px)", color: "#F5F0E8", fontWeight: 700, margin: "0 0 14px", lineHeight: 1.1 }}>
            Simple, transparent, efficace
          </h1>
          <p style={{ color: MUTED, fontSize: 16, maxWidth: 500, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Sans engagement. Annulez a tout moment. Essai gratuit 14 jours sur les plans payes.
          </p>

          {/* Toggle annuel */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#111009", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 30, padding: "8px 16px" }}>
            <span style={{ color: !annual ? "#F5F0E8" : MUTED, fontSize: 14, fontWeight: !annual ? 600 : 400 }}>Mensuel</span>
            <button onClick={() => setAnnual(a => !a)} style={{ width: 44, height: 24, borderRadius: 12, background: annual ? G : "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 3, left: annual ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </button>
            <span style={{ color: annual ? "#F5F0E8" : MUTED, fontSize: 14, fontWeight: annual ? 600 : 400 }}>Annuel</span>
            {annual && <span style={{ background: "rgba(57,255,143,0.15)", border: "1px solid rgba(57,255,143,0.3)", borderRadius: 10, padding: "2px 8px", fontSize: 11, color: "#39FF8F", fontWeight: 700 }}>-20%</span>}
          </div>
        </div>

        {/* Plans grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 16, alignItems: "start", marginBottom: 40 }}>
          {PLANS.map(plan => {
            const isCurrentPlan = currentPlan === plan.id
            const price = annual ? plan.price.annual : plan.price.monthly
            const pc = plan.color

            return (
              <div key={plan.id}
                style={{ background: plan.highlight ? "linear-gradient(135deg,rgba(56,189,248,0.08),rgba(56,189,248,0.03))" : "#111009", border: "1px solid " + (plan.highlight ? "rgba(56,189,248,0.4)" : isCurrentPlan ? "rgba(57,255,143,0.3)" : "rgba(201,168,76,0.12)"), borderRadius: 20, padding: "28px 24px", position: "relative", overflow: "hidden", transform: plan.highlight ? "scale(1.02)" : "scale(1)", boxShadow: plan.highlight ? "0 0 50px rgba(56,189,248,0.1)" : "none" }}>

                {plan.badge && (
                  <div style={{ position: "absolute", top: 16, right: 16, background: "linear-gradient(90deg,#38BDF8,#818CF8)", borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 700, color: "#080808", letterSpacing: 1 }}>{plan.badge}</div>
                )}
                {isCurrentPlan && (
                  <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(57,255,143,0.15)", border: "1px solid rgba(57,255,143,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 700, color: "#39FF8F" }}>ACTUEL</div>
                )}

                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <div style={{ color: pc, background: pc + "18", borderRadius: 8, padding: 8 }}>{plan.icon}</div>
                  <div>
                    <p style={{ color: "#F5F0E8", fontSize: 17, fontWeight: 700, margin: 0 }}>{plan.name}</p>
                    <p style={{ color: MUTED, fontSize: 11, margin: 0 }}>{plan.description}</p>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "18px 0 20px" }}>
                  <span style={{ color: pc, fontSize: 40, fontWeight: 700, fontFamily: "Cormorant Garamond, serif" }}>{price === "0" ? "Gratuit" : price + "€"}</span>
                  {price !== "0" && <span style={{ color: MUTED, fontSize: 13 }}>/mois</span>}
                </div>

                {annual && price !== "0" && (
                  <p style={{ color: "#39FF8F", fontSize: 11, margin: "-14px 0 16px", fontWeight: 600 }}>
                    Soit {(parseFloat(price) * 12).toFixed(0)}€/an — economisez {(parseFloat(plan.price.monthly) * 12 - parseFloat(price) * 12).toFixed(0)}€
                  </p>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                  {plan.perks.map((perk, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, opacity: perk.included ? 1 : 0.35 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: perk.included ? pc + "20" : "rgba(255,255,255,0.04)", border: "1px solid " + (perk.included ? pc + "40" : "rgba(255,255,255,0.08)"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {perk.included ? <Check size={9} color={pc} /> : <span style={{ color: MUTED, fontSize: 8 }}>—</span>}
                      </div>
                      <span style={{ color: perk.included ? "#F5F0E8" : MUTED, fontSize: 13 }}>{perk.text}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => handleUpgrade(plan)} disabled={loading === plan.id || isCurrentPlan || plan.ctaDisabled}
                  style={{ width: "100%", padding: "13px 20px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: isCurrentPlan || plan.ctaDisabled ? "default" : "pointer", background: isCurrentPlan ? "rgba(57,255,143,0.08)" : plan.highlight ? "linear-gradient(90deg,#38BDF8,#818CF8)" : pc + "15", color: isCurrentPlan ? "#39FF8F" : plan.highlight ? "#080808" : pc, border: isCurrentPlan ? "1px solid rgba(57,255,143,0.2)" : plan.highlight ? "none" : "1px solid " + pc + "30", transition: "all 0.2s", fontFamily: "DM Sans, sans-serif" }}>
                  {loading === plan.id ? "Chargement..." : isCurrentPlan ? "Plan actuel" : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {/* Tableau comparatif */}
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <button onClick={() => setShowComparison(s => !s)}
            style={{ background: "transparent", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "10px 20px", color: MUTED, fontSize: 13, cursor: "pointer" }}>
            {showComparison ? "Masquer" : "Voir"} le tableau comparatif complet
          </button>
        </div>

        {showComparison && (
          <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 16, overflow: "hidden", marginBottom: 40 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ padding: "14px 20px" }}><span style={{ color: MUTED, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Fonctionnalite</span></div>
              {["Gratuit", "Starter", "Pro", "Business"].map((h, i) => (
                <div key={i} style={{ padding: "14px 12px", textAlign: "center" }}>
                  <span style={{ color: ["#8A8478","#38BDF8","#C9A84C","#39FF8F"][i], fontSize: 12, fontWeight: 700 }}>{h}</span>
                </div>
              ))}
            </div>
            {COMPARISON.map((row, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr", borderBottom: i < COMPARISON.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
                <div style={{ padding: "11px 20px" }}><span style={{ color: "#F5F0E8", fontSize: 13 }}>{row.feature}</span></div>
                {[row.free, row.starter, row.pro, row.business].map((val, j) => (
                  <div key={j} style={{ padding: "11px 12px", textAlign: "center" }}>
                    <span style={{ color: val === "—" ? "rgba(255,255,255,0.15)" : val === "✓" ? ["#8A8478","#38BDF8","#C9A84C","#39FF8F"][j] : "#F5F0E8", fontSize: 12 }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center" }}>
          <p style={{ color: MUTED, fontSize: 13, margin: "0 0 6px" }}>
            Des questions ? <a href="mailto:hello@qrfolio.app" style={{ color: G, textDecoration: "none" }}>Contactez-nous</a>
          </p>
          <p style={{ color: "#4A4640", fontSize: 12, margin: 0 }}>
            Paiement securise par Stripe · Annulation a tout moment · Remboursement 14 jours · Sans engagement
          </p>
        </div>
      </div>
    </div>
  )
}
