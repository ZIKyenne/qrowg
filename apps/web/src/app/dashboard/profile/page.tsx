"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Copy, Check, Gift, Star, TrendingUp, Users, QrCode, Eye, Crown, Zap } from "lucide-react"

type Profile = {
  id: string; email: string; full_name: string | null; username: string | null
  bio: string | null; avatar_url: string | null; plan: string
  total_pages: number; total_scans: number; created_at: string; ref_code: string | null
}

type Referral = { id: string; status: string; reward_months: number; created_at: string }

const PLAN_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string; perks: string[] }> = {
  free: { color: "#8A8478", icon: <Star size={16} />, label: "Free", perks: ["1 page", "500 vues/mois", "QR code basique", "Analytics de base"] },
  pro: { color: "#C9A84C", icon: <Zap size={16} />, label: "Pro", perks: ["Pages illimitées", "Vues illimitées", "Domaine personnalisé", "Analytics avancés", "Sans branding"] },
  business: { color: "#39FF8F", icon: <Crown size={16} />, label: "Business", perks: ["Tout Pro inclus", "Gestion d'équipe", "Accès API", "Support prioritaire 24/7"] },
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: "15%", right: "15%", height: 1, background: "linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent)" }} />
      <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, color: "#F5F0E8", fontWeight: 700, margin: "0 0 24px", paddingBottom: 16, borderBottom: "1px solid rgba(201,168,76,0.1)" }}>{title}</h2>
      {children}
    </div>
  )
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = "/auth/login"; return }
      const [{ data: prof }, { data: refs }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
      ])
      if (prof) setProfile(prof)
      if (refs) setReferrals(refs)
      setLoading(false)
    }
    load()
  }, [])

  function copyReferral() {
    const link = `https://qrfolio.app?ref=${profile?.ref_code || profile?.id?.slice(0, 8)}`
    navigator.clipboard.writeText(link).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
  }

  function getMemberSince(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 40, height: 40, border: "2px solid rgba(201,168,76,0.2)", borderTopColor: "#C9A84C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const planCfg = PLAN_CONFIG[profile?.plan || "free"]
  const planColor = planCfg.color
  const referralLink = `https://qrfolio.app?ref=${profile?.ref_code || profile?.id?.slice(0, 8)}`
  const validatedRefs = referrals.filter(r => r.status === "validated" || r.status === "rewarded").length
  const totalRewardMonths = referrals.reduce((s, r) => s + r.reward_months, 0)

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 24px", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.6}}`}</style>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "#F5F0E8", fontWeight: 700, margin: 0 }}>Mon Profil</h1>
          <p style={{ color: "#8A8478", marginTop: 4, fontSize: 14 }}>Ton compte, ton plan, tes stats</p>
        </div>

        {/* Identity card */}
        <div style={{ background: "linear-gradient(135deg,#111009,#1a1508)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 20, padding: "32px", marginBottom: 24, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle,${planColor}15 0%,transparent 70%)`, pointerEvents: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{ width: 90, height: 90, borderRadius: "50%", background: `linear-gradient(135deg,${planColor},${planColor}80)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 700, color: "#080808", fontFamily: "Cormorant Garamond, serif", boxShadow: `0 0 30px ${planColor}40` }}>
                {(profile?.full_name || profile?.email || "?")[0].toUpperCase()}
              </div>
              <div style={{ position: "absolute", inset: -3, borderRadius: "50%", border: `2px solid ${planColor}60`, animation: "pulse 3s ease-in-out infinite" }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6, flexWrap: "wrap" }}>
                <h2 style={{ color: "#F5F0E8", fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{profile?.full_name || "Sans nom"}</h2>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: planColor + "18", border: `1px solid ${planColor}40`, borderRadius: 20, padding: "4px 12px" }}>
                  <span style={{ color: planColor }}>{planCfg.icon}</span>
                  <span style={{ color: planColor, fontSize: 12, fontWeight: 700 }}>Plan {planCfg.label}</span>
                </div>
              </div>
              <p style={{ color: "#8A8478", fontSize: 14, margin: "0 0 4px" }}>{profile?.email}</p>
              {profile?.username && <p style={{ color: "#C9A84C", fontSize: 13, margin: "0 0 4px" }}>@{profile.username}</p>}
              {profile?.created_at && <p style={{ color: "#8A8478", fontSize: 12, margin: 0 }}>Membre depuis {getMemberSince(profile.created_at)}</p>}
            </div>
            <div style={{ display: "flex", gap: 24, flexShrink: 0 }}>
              {[{ value: profile?.total_pages || 0, label: "Pages" }, { value: profile?.total_scans || 0, label: "Scans" }].map((s, i) => (
                <div key={i} style={{ textAlign: "center" }}>
                  <p style={{ color: planColor, fontSize: 28, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{s.value}</p>
                  <p style={{ color: "#8A8478", fontSize: 12, margin: 0 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { icon: <QrCode size={18} />, label: "Scans totaux", value: profile?.total_scans || 0, color: "#C9A84C" },
            { icon: <Eye size={18} />, label: "Pages créées", value: profile?.total_pages || 0, color: "#39FF8F" },
            { icon: <Users size={18} />, label: "Parrainages validés", value: validatedRefs, color: "#7B61FF" },
            { icon: <Gift size={18} />, label: "Mois Pro gagnés", value: totalRewardMonths, color: "#EC4899" },
          ].map((kpi, i) => (
            <div key={i} style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 12, padding: "20px 22px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ color: kpi.color, background: kpi.color + "15", borderRadius: 8, padding: 10, flexShrink: 0 }}>{kpi.icon}</div>
              <div>
                <p style={{ color: "#8A8478", fontSize: 12, margin: 0 }}>{kpi.label}</p>
                <p style={{ color: "#F5F0E8", fontSize: 22, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Plan */}
        <Section title="Mon abonnement">
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ color: planColor, background: planColor + "18", borderRadius: 8, padding: 8 }}>{planCfg.icon}</div>
                <div>
                  <p style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700, margin: 0 }}>Plan {planCfg.label}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#39FF8F", animation: "pulse 2s infinite" }} />
                    <span style={{ color: "#39FF8F", fontSize: 12 }}>Actif</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {planCfg.perks.map((perk, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "#39FF8F", fontSize: 14 }}>✓</span>
                    <span style={{ color: "#8A8478", fontSize: 14 }}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
            {profile?.plan !== "business" && (
              <div style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 12, padding: "20px", minWidth: 200, display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700, margin: 0 }}>{profile?.plan === "free" ? "🚀 Passer Pro" : "👑 Passer Business"}</p>
                <p style={{ color: "#8A8478", fontSize: 13, margin: 0, lineHeight: 1.6 }}>{profile?.plan === "free" ? "Pages illimitées, analytics avancés, domaine perso..." : "Équipe, API, intégrations premium..."}</p>
                <a href="/upgrade" style={{ background: "linear-gradient(90deg,#C9A84C,#b8953f)", color: "#080808", textDecoration: "none", fontSize: 13, fontWeight: 700, padding: "10px 20px", borderRadius: 8, textAlign: "center", display: "block" }}>Voir les offres →</a>
              </div>
            )}
          </div>
        </Section>

        {/* Parrainage */}
        <Section title="Programme de parrainage 🎁">
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Steps */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {[
                { icon: "1️⃣", title: "Partage ton lien", desc: "Envoie à tes amis ou clients" },
                { icon: "2️⃣", title: "Ils s'inscrivent", desc: "Via ton lien de parrainage" },
                { icon: "3️⃣", title: "Tu gagnes 1 mois Pro", desc: "Par parrainage validé" },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, minWidth: 130, background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 10, padding: "14px" }}>
                  <p style={{ fontSize: 22, margin: "0 0 6px" }}>{s.icon}</p>
                  <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 700, margin: "0 0 3px" }}>{s.title}</p>
                  <p style={{ color: "#8A8478", fontSize: 11, margin: 0, lineHeight: 1.5 }}>{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Stats parrainage */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <div style={{ background: "rgba(123,97,255,0.08)", border: "1px solid rgba(123,97,255,0.2)", borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                <Gift size={18} color="#7B61FF" />
                <div>
                  <p style={{ color: "#7B61FF", fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{validatedRefs}</p>
                  <p style={{ color: "#8A8478", fontSize: 11, margin: 0 }}>Parrainages validés</p>
                </div>
              </div>
              <div style={{ background: "rgba(57,255,143,0.08)", border: "1px solid rgba(57,255,143,0.2)", borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                <Star size={18} color="#39FF8F" />
                <div>
                  <p style={{ color: "#39FF8F", fontSize: 20, fontWeight: 700, margin: 0, fontFamily: "Cormorant Garamond, serif" }}>{totalRewardMonths} mois</p>
                  <p style={{ color: "#8A8478", fontSize: 11, margin: 0 }}>Pro offerts gagnés</p>
                </div>
              </div>
              {profile?.ref_code && (
                <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "14px 20px", display: "flex", alignItems: "center", gap: 10 }}>
                  <TrendingUp size={18} color="#C9A84C" />
                  <div>
                    <p style={{ color: "#C9A84C", fontSize: 16, fontWeight: 700, margin: 0, fontFamily: "monospace" }}>{profile.ref_code}</p>
                    <p style={{ color: "#8A8478", fontSize: 11, margin: 0 }}>Ton code perso</p>
                  </div>
                </div>
              )}
            </div>

            {/* Lien parrainage */}
            <div>
              <p style={{ color: "#8A8478", fontSize: 13, margin: "0 0 10px" }}>Ton lien de parrainage :</p>
              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1, background: "#0d0c09", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 10, padding: "12px 16px", color: "#C9A84C", fontSize: 13, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {referralLink}
                </div>
                <button onClick={copyReferral} style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0, background: copied ? "rgba(57,255,143,0.1)" : "rgba(201,168,76,0.1)", border: `1px solid ${copied ? "rgba(57,255,143,0.4)" : "rgba(201,168,76,0.3)"}`, borderRadius: 10, padding: "12px 18px", color: copied ? "#39FF8F" : "#C9A84C", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.2s" }}>
                  {copied ? <><Check size={14} /> Copié !</> : <><Copy size={14} /> Copier</>}
                </button>
              </div>
            </div>

            {/* Historique parrainages */}
            {referrals.length > 0 && (
              <div>
                <p style={{ color: "#8A8478", fontSize: 13, margin: "0 0 10px" }}>Historique :</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {referrals.slice(0, 5).map((r, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "10px 14px" }}>
                      <span style={{ color: "#8A8478", fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                      <span style={{ color: r.status === "validated" || r.status === "rewarded" ? "#39FF8F" : "#8A8478", fontSize: 12, fontWeight: 600, textTransform: "capitalize" }}>{r.status === "pending" ? "En attente" : r.status === "validated" ? "Validé ✓" : "Récompensé 🎁"}</span>
                      {r.reward_months > 0 && <span style={{ color: "#C9A84C", fontSize: 12 }}>+{r.reward_months} mois Pro</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>
      </div>
    </div>
  )
}
