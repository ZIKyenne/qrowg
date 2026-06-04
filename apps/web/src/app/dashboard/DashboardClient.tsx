"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Plus, QrCode, BarChart2, Eye, Zap, ArrowRight, TrendingUp, Clock, Globe } from "lucide-react"
import OnboardingChecklist from "./OnboardingChecklist"

type Page = { id: string; title: string; slug: string; status: string; total_views: number; created_at: string }
type Profile = { full_name: string | null; plan: string; total_scans: number; total_pages: number; avatar_url: string | null }

const PLAN_CONFIG: Record<string, { color: string; label: string }> = {
  free: { color: "#8A8478", label: "Free" },
  pro: { color: "#C9A84C", label: "Pro" },
  business: { color: "#39FF8F", label: "Business" },
}

export default function DashboardClient() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [hour] = useState(new Date().getHours())

  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir"

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = "/auth/login"; return }

    const [{ data: prof }, { data: pgs }] = await Promise.all([
      supabase.from("profiles").select("full_name,plan,total_scans,total_pages,avatar_url").eq("id", user.id).single(),
      supabase.from("pages").select("id,title,slug,status,total_views,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    ])
    if (prof) setProfile(prof)
    if (pgs) setPages(pgs)
    setLoading(false)
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  const planCfg = PLAN_CONFIG[profile?.plan || "free"]
  const G = "#C9A84C"
  const MUTED = "#8A8478"
  const publishedCount = pages.filter(p => p.status === "published").length

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#080808", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 36, height: 36, border: "2px solid rgba(201,168,76,0.15)", borderTopColor: G, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 28px", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 30, color: "#F5F0E8", fontWeight: 700, margin: "0 0 4px" }}>
              {greeting}{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""} 👋
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: planCfg.color, boxShadow: `0 0 6px ${planCfg.color}80` }} />
              <span style={{ color: planCfg.color, fontSize: 12, fontWeight: 600 }}>Plan {planCfg.label}</span>
            </div>
          </div>
          <Link href="/dashboard/templates"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "linear-gradient(90deg,#C9A84C,#b8953f)", borderRadius: 12, padding: "10px 20px", color: "#080808", textDecoration: "none", fontSize: 14, fontWeight: 700, boxShadow: "0 4px 20px rgba(201,168,76,0.25)", flexShrink: 0 }}>
            <Plus size={16} /> Nouvelle page
          </Link>
        </div>

        {/* Onboarding */}
        <OnboardingChecklist />

        {/* KPI stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14, marginBottom: 28 }}>
          {[
            { icon: <Eye size={18} />, label: "Pages créées", value: profile?.total_pages || 0, color: G, sub: `${publishedCount} publiée${publishedCount > 1 ? "s" : ""}` },
            { icon: <QrCode size={18} />, label: "Scans totaux", value: profile?.total_scans || 0, color: "#39FF8F", sub: "tous temps" },
            { icon: <BarChart2 size={18} />, label: "Vues totales", value: pages.reduce((s, p) => s + (p.total_views || 0), 0), color: "#7B61FF", sub: "toutes pages" },
            { icon: <Globe size={18} />, label: "Publiées", value: publishedCount, color: "#38BDF8", sub: `sur ${pages.length} pages` },
          ].map((kpi, i) => (
            <div key={i} style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, padding: "18px 20px", position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: `radial-gradient(circle,${kpi.color}12,transparent 70%)` }} />
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ color: kpi.color, background: kpi.color + "15", borderRadius: 8, padding: 8 }}>{kpi.icon}</div>
              </div>
              <p style={{ color: "#F5F0E8", fontSize: 28, fontWeight: 700, margin: "0 0 2px", fontFamily: "Cormorant Garamond, serif" }}>{kpi.value}</p>
              <p style={{ color: MUTED, fontSize: 11, margin: "0 0 2px" }}>{kpi.label}</p>
              <p style={{ color: kpi.color + "80", fontSize: 10, margin: 0 }}>{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Pages list */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
          {/* Recent pages */}
          <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: 0 }}>Mes pages</p>
              <Link href="/dashboard/templates" style={{ display: "flex", alignItems: "center", gap: 4, color: G, fontSize: 11, textDecoration: "none" }}>
                <Plus size={11} /> Nouvelle
              </Link>
            </div>
            {pages.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center" }}>
                <p style={{ fontSize: 32, margin: "0 0 10px" }}>📄</p>
                <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 600, margin: "0 0 6px" }}>Aucune page</p>
                <p style={{ color: MUTED, fontSize: 12, margin: "0 0 16px" }}>Crée ta première page avec un template</p>
                <Link href="/dashboard/templates" style={{ background: `linear-gradient(90deg,${G},#b8953f)`, color: "#080808", textDecoration: "none", padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  Choisir un template →
                </Link>
              </div>
            ) : (
              <div>
                {pages.slice(0, 6).map((page, i) => (
                  <Link key={page.id} href={`/dashboard/builder/${page.id}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < pages.slice(0, 6).length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", textDecoration: "none", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: page.status === "published" ? "#39FF8F" : MUTED, flexShrink: 0, boxShadow: page.status === "published" ? "0 0 6px #39FF8F60" : "none" }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{page.title}</p>
                      <p style={{ color: MUTED, fontSize: 10, margin: 0 }}>/{page.slug}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p style={{ color: G, fontSize: 13, fontWeight: 700, margin: 0 }}>{page.total_views}</p>
                      <p style={{ color: MUTED, fontSize: 9, margin: 0 }}>vues</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Upgrade banner si free */}
            {profile?.plan === "free" && (
              <div style={{ background: "linear-gradient(135deg,rgba(201,168,76,0.1),rgba(57,255,143,0.05))", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Zap size={16} color={G} />
                  <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 700, margin: 0 }}>Passe à Pro</p>
                </div>
                <p style={{ color: MUTED, fontSize: 12, margin: "0 0 12px", lineHeight: 1.5 }}>Pages illimitées, domaine perso, analytics avancés</p>
                <Link href="/upgrade" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: `linear-gradient(90deg,${G},#b8953f)`, color: "#080808", textDecoration: "none", padding: "9px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
                  Voir les offres <ArrowRight size={11} />
                </Link>
              </div>
            )}

            {/* Quick actions */}
            <div style={{ background: "#111009", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                <p style={{ color: "#F5F0E8", fontSize: 14, fontWeight: 700, margin: 0 }}>Actions rapides</p>
              </div>
              {[
                { icon: "📋", label: "Choisir un template", href: "/dashboard/templates", color: G },
                { icon: "📊", label: "Voir les analytics", href: "/dashboard/analytics", color: "#7B61FF" },
                { icon: "🎨", label: "Mes QR codes", href: "/dashboard/qr-codes", color: "#38BDF8" },
                { icon: "🌐", label: "Domaines perso", href: "/dashboard/domains", color: "#39FF8F" },
              ].map((action, i, arr) => (
                <Link key={i} href={action.href}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 18px", textDecoration: "none", borderBottom: i < arr.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <span style={{ fontSize: 18 }}>{action.icon}</span>
                  <span style={{ color: "#F5F0E8", fontSize: 13 }}>{action.label}</span>
                  <ChevronRight size={13} color={MUTED} style={{ marginLeft: "auto" }} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
