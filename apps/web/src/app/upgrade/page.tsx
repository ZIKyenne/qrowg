"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Check, Zap, Crown, Star, ArrowLeft } from "lucide-react"
import Link from "next/link"

const PLANS = [
  {
    id: "free", name: "Free", price: "0€", period: "", color: "#8A8478",
    icon: <Star size={20} />,
    description: "Pour démarrer",
    perks: ["1 page", "500 vues / mois", "QR code basique", "Analytics de base", "Branding QRfolio"],
    cta: "Plan actuel", ctaDisabled: true,
  },
  {
    id: "pro", name: "Pro", price: "9,90€", period: "/mois", color: "#C9A84C",
    icon: <Zap size={20} />,
    description: "Pour les créatifs & freelances",
    highlight: true,
    badge: "POPULAIRE",
    perks: ["Pages illimitées", "Vues illimitées", "Domaine personnalisé", "Analytics avancés", "Sans branding QRfolio", "Presets QR premium", "Support prioritaire"],
    cta: "Commencer l'essai gratuit",
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID,
  },
  {
    id: "business", name: "Business", price: "24,90€", period: "/mois", color: "#39FF8F",
    icon: <Crown size={20} />,
    description: "Pour les équipes & agences",
    perks: ["Tout Plan Pro inclus", "Gestion d'équipe (5 membres)", "Accès API complet", "Intégrations premium", "Pages en marque blanche", "Support 24/7 dédié", "Onboarding personnalisé"],
    cta: "Contacter l'équipe",
    priceId: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_PRICE_ID,
  },
]

export default function UpgradePage() {
  const [currentPlan, setCurrentPlan] = useState("free")
  const [loading, setLoading] = useState<string | null>(null)
  const [annual, setAnnual] = useState(false)

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
    if (plan.id === "business") { window.location.href = "mailto:hello@qrfolio.app?subject=Plan Business"; return }
    setLoading(plan.id)
    // Rediriger vers Stripe checkout
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/auth/login"; return }
    // Appel API Stripe
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId: plan.priceId, userId: user.id }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch { setLoading(null) }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "DM Sans, sans-serif", padding: "0 24px 80px" }}>
      <style>{`@keyframes gradientShift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>

      {/* Back */}
      <div style={{ maxWidth: 1000, margin: "0 auto", paddingTop: 32 }}>
        <Link href="/dashboard" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#8A8478", textDecoration: "none", fontSize: 14, marginBottom: 48 }}>
          <ArrowLeft size={16} /> Retour au dashboard
        </Link>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-block", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 20, padding: "6px 16px", marginBottom: 20, fontSize: 12, color: "#C9A84C", letterSpacing: 2, textTransform: "uppercase" }}>
            ✦ Passez à la vitesse supérieure
          </div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "clamp(32px,5vw,56px)", color: "#F5F0E8", fontWeight: 700, margin: "0 0 16px", lineHeight: 1.1 }}>
            Choisissez votre plan
          </h1>
          <p style={{ color: "#8A8478", fontSize: 17, maxWidth: 480, margin: "0 auto 28px", lineHeight: 1.7 }}>
            Sans engagement, sans carte bancaire pour l'essai. Annulez à tout moment.
          </p>

          {/* Annual toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 12, background: "#111009", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 30, padding: "8px 16px" }}>
            <span style={{ color: !annual ? "#F5F0E8" : "#8A8478", fontSize: 14, fontWeight: !annual ? 600 : 400 }}>Mensuel</span>
            <button onClick={() => setAnnual(a => !a)} style={{ width: 44, height: 24, borderRadius: 12, background: annual ? "#C9A84C" : "rgba(255,255,255,0.1)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ position: "absolute", top: 3, left: annual ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
            </button>
            <span style={{ color: annual ? "#F5F0E8" : "#8A8478", fontSize: 14, fontWeight: annual ? 600 : 400 }}>Annuel</span>
            {annual && <span style={{ background: "rgba(57,255,143,0.15)", border: "1px solid rgba(57,255,143,0.3)", borderRadius: 10, padding: "2px 8px", fontSize: 11, color: "#39FF8F", fontWeight: 700 }}>-20%</span>}
          </div>
        </div>

        {/* Plans grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, alignItems: "center" }}>
          {PLANS.map(plan => {
            const isCurrentPlan = currentPlan === plan.id
            const price = annual && plan.price !== "0€" ? `${(parseFloat(plan.price) * 0.8).toFixed(2).replace(".",",")}€` : plan.price
            return (
              <div key={plan.id}
                style={{ background: plan.highlight ? "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(57,255,143,0.04))" : "#111009", border: `1px solid ${plan.highlight ? "rgba(201,168,76,0.5)" : isCurrentPlan ? "rgba(57,255,143,0.3)" : "rgba(201,168,76,0.12)"}`, borderRadius: 20, padding: "32px 28px", position: "relative", overflow: "hidden", transform: plan.highlight ? "scale(1.03)" : "scale(1)", boxShadow: plan.highlight ? "0 0 60px rgba(201,168,76,0.12)" : "none", transition: "transform 0.2s" }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: 16, right: 16, background: "linear-gradient(90deg,#C9A84C,#39FF8F)", borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 700, color: "#080808", letterSpacing: 1 }}>{plan.badge}</div>
                )}
                {isCurrentPlan && (
                  <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(57,255,143,0.15)", border: "1px solid rgba(57,255,143,0.3)", borderRadius: 20, padding: "4px 12px", fontSize: 10, fontWeight: 700, color: "#39FF8F", letterSpacing: 1 }}>ACTUEL</div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <div style={{ color: plan.color, background: plan.color + "18", borderRadius: 8, padding: 8 }}>{plan.icon}</div>
                  <div>
                    <p style={{ color: "#F5F0E8", fontSize: 18, fontWeight: 700, margin: 0 }}>{plan.name}</p>
                    <p style={{ color: "#8A8478", fontSize: 12, margin: 0 }}>{plan.description}</p>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, margin: "20px 0 24px" }}>
                  <span style={{ color: plan.color, fontSize: 42, fontWeight: 700, fontFamily: "Cormorant Garamond, serif" }}>{price}</span>
                  {plan.period && <span style={{ color: "#8A8478", fontSize: 14 }}>{plan.period}</span>}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                  {plan.perks.map((perk, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Check size={14} color="#39FF8F" style={{ flexShrink: 0 }} />
                      <span style={{ color: "#8A8478", fontSize: 14 }}>{perk}</span>
                    </div>
                  ))}
                </div>
                <button onClick={() => handleUpgrade(plan)} disabled={loading === plan.id || isCurrentPlan}
                  style={{ width: "100%", padding: "14px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: isCurrentPlan ? "default" : "pointer", background: isCurrentPlan ? "rgba(57,255,143,0.08)" : plan.highlight ? "linear-gradient(90deg,#C9A84C,#b8953f)" : `${plan.color}15`, color: isCurrentPlan ? "#39FF8F" : plan.highlight ? "#080808" : plan.color, border: isCurrentPlan ? "1px solid rgba(57,255,143,0.2)" : plan.highlight ? "none" : `1px solid ${plan.color}30`, transition: "all 0.2s" }}>
                  {loading === plan.id ? "Chargement..." : isCurrentPlan ? "✓ Plan actuel" : plan.cta}
                </button>
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div style={{ marginTop: 64, textAlign: "center" }}>
          <p style={{ color: "#8A8478", fontSize: 14, marginBottom: 8 }}>Des questions ? <a href="mailto:hello@qrfolio.app" style={{ color: "#C9A84C", textDecoration: "none" }}>Contactez-nous</a></p>
          <p style={{ color: "#8A8478", fontSize: 13 }}>✓ Paiement sécurisé par Stripe · ✓ Annulation à tout moment · ✓ Remboursement sous 14 jours</p>
        </div>
      </div>
    </div>
  )
}
