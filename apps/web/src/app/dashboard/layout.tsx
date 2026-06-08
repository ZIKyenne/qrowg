"use server"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  LayoutDashboard, QrCode, BarChart2, Settings, Zap,
  User, Globe, LayoutTemplate, ChevronDown, Crown,
  Sparkles, Star, TrendingUp, ChevronRight
} from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, plan, avatar_url, total_pages, total_scans")
    .eq("id", user.id)
    .single()

  const PLAN_LIMITS: Record<string, number> = { free: 500, starter: 5000, pro: 50000, business: Infinity }
  const limit = PLAN_LIMITS[profile?.plan || "free"]

  const { data: pages } = await supabase
    .from("pages")
    .select("total_views")
    .eq("user_id", user.id)

  const totalViews = (pages || []).reduce((s: number, p: any) => s + (p.total_views || 0), 0)
  const usagePct = limit === Infinity ? 0 : Math.min(100, Math.round((totalViews / limit) * 100))

  const planColors: Record<string, string> = { free: "#8A8478", starter: "#38BDF8", pro: "#C9A84C", business: "#39FF8F" }
  const pc = planColors[profile?.plan || "free"]
  const plan = profile?.plan || "free"

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080808", fontFamily: "DM Sans, sans-serif" }}>
      <style>{`
        .nav-link { display: flex; align-items: center; gap: 10px; padding: 9px 12px; border-radius: 8px; text-decoration: none; color: #8A8478; font-size: 13px; transition: all 0.15s; }
        .nav-link:hover { background: rgba(201,168,76,0.07); color: #F5F0E8; }
        .nav-link.active { background: rgba(201,168,76,0.1); color: #C9A84C; }
        .nav-group-header { display: flex; align-items: center; gap: 8px; padding: 6px 12px; cursor: pointer; border-radius: 6px; transition: background 0.15s; width: 100%; background: transparent; border: none; }
        .nav-group-header:hover { background: rgba(255,255,255,0.03); }
        details > summary { list-style: none; }
        details > summary::-webkit-details-marker { display: none; }
        details[open] .chevron { transform: rotate(90deg); }
        .chevron { transition: transform 0.2s; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
      `}</style>

      <aside style={{ width: 220, background: "#0A0A0A", borderRight: "1px solid rgba(201,168,76,0.1)", display: "flex", flexDirection: "column", padding: "0 10px 16px", position: "fixed", top: 0, left: 0, height: "100vh", overflowY: "auto" }}>

        {/* Logo */}
        <div style={{ padding: "20px 12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", marginBottom: 10 }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 24, color: "#C9A84C", fontWeight: 700 }}>QRfolio</span>
          </Link>
        </div>

        {/* Nav principale */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 1 }}>

          {/* Dashboard */}
          <Link href="/dashboard" className="nav-link">
            <LayoutDashboard size={15} /> Dashboard
          </Link>

          {/* Templates */}
          <Link href="/dashboard/templates" className="nav-link">
            <LayoutTemplate size={15} /> Templates
          </Link>

          {/* Analytics */}
          <Link href="/dashboard/analytics" className="nav-link">
            <BarChart2 size={15} /> Analytics
          </Link>

          {/* QR Codes */}
          <Link href="/dashboard/qr-codes" className="nav-link">
            <QrCode size={15} /> QR Codes
          </Link>

          {/* Separateur */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "8px 4px" }} />

          {/* Compte — depliable */}
          <details>
            <summary>
              <div className="nav-group-header">
                <User size={15} color="#8A8478" />
                <span style={{ color: "#8A8478", fontSize: 13, flex: 1, textAlign: "left" }}>Compte</span>
                <ChevronRight size={12} color="#8A8478" className="chevron" />
              </div>
            </summary>
            <div style={{ paddingLeft: 14, display: "flex", flexDirection: "column", gap: 1, marginTop: 2 }}>
              <Link href="/dashboard/profile" className="nav-link" style={{ fontSize: 12, padding: "7px 12px" }}>
                <User size={13} /> Profil
              </Link>
              <Link href="/dashboard/domains" className="nav-link" style={{ fontSize: 12, padding: "7px 12px" }}>
                <Globe size={13} /> Domaines
              </Link>
              <Link href="/dashboard/settings" className="nav-link" style={{ fontSize: 12, padding: "7px 12px" }}>
                <Settings size={13} /> Parametres
              </Link>
            </div>
          </details>

          {/* Separateur */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.04)", margin: "8px 4px" }} />

          {/* Upgrade — toujours visible */}
          <Link href="/upgrade" className="nav-link" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 10, padding: "10px 12px", marginTop: 2 }}>
            <Zap size={15} color="#C9A84C" />
            <div style={{ flex: 1 }}>
              <p style={{ color: "#C9A84C", fontSize: 12, fontWeight: 700, margin: 0 }}>Upgrade</p>
              <p style={{ color: "#8A8478", fontSize: 10, margin: 0 }}>
                {plan === "free" ? "Starter 2,99€/mois" : plan === "starter" ? "Pro 9,99€/mois" : plan === "pro" ? "Business 24,99€/mois" : "Plan actif ✓"}
              </p>
            </div>
            <ChevronRight size={12} color="#C9A84C" style={{ opacity: 0.6 }} />
          </Link>

          {/* Plans apercu depliable */}
          <details style={{ marginTop: 4 }}>
            <summary>
              <div className="nav-group-header" style={{ padding: "6px 12px" }}>
                <Crown size={14} color="#8A8478" />
                <span style={{ color: "#8A8478", fontSize: 12, flex: 1, textAlign: "left" }}>Voir les plans</span>
                <ChevronRight size={11} color="#8A8478" className="chevron" />
              </div>
            </summary>
            <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column", gap: 6, marginTop: 2 }}>
              {[
                { id: "free", label: "Gratuit", price: "0€", color: "#8A8478", icon: "★", perks: "1 page • 500 vues" },
                { id: "starter", label: "Starter", price: "2,99€", color: "#38BDF8", icon: "⚡", perks: "3 pages • 5k vues" },
                { id: "pro", label: "Pro", price: "9,99€", color: "#C9A84C", icon: "🔥", perks: "Illimité • 50k vues" },
                { id: "business", label: "Business", price: "24,99€", color: "#39FF8F", icon: "👑", perks: "Vues illimitées • API" },
              ].map(p => (
                <Link key={p.id} href="/upgrade"
                  style={{ display: "flex", alignItems: "center", gap: 8, background: plan === p.id ? p.color + "12" : "rgba(255,255,255,0.02)", border: `1px solid ${plan === p.id ? p.color + "35" : "rgba(255,255,255,0.05)"}`, borderRadius: 9, padding: "8px 10px", textDecoration: "none", transition: "all 0.15s" }}>
                  <span style={{ fontSize: 14 }}>{p.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <p style={{ color: plan === p.id ? p.color : "#F5F0E8", fontSize: 11, fontWeight: 700, margin: 0 }}>{p.label}</p>
                      {plan === p.id && <span style={{ background: p.color + "20", borderRadius: 4, padding: "1px 5px", fontSize: 8, color: p.color, fontWeight: 700 }}>ACTUEL</span>}
                    </div>
                    <p style={{ color: "#8A8478", fontSize: 9, margin: 0 }}>{p.perks}</p>
                  </div>
                  <span style={{ color: p.color, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{p.price}<span style={{ color: "#8A8478", fontSize: 9, fontWeight: 400 }}>/mois</span></span>
                </Link>
              ))}
            </div>
          </details>

        </nav>

        {/* Quota vues */}
        {limit !== Infinity && (
          <div style={{ marginBottom: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: "#8A8478", fontSize: 10 }}>Vues ce mois</span>
              <span style={{ color: usagePct >= 80 ? "#EF4444" : "#C9A84C", fontSize: 10, fontWeight: 700 }}>{usagePct}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden", marginBottom: 4 }}>
              <div style={{ height: "100%", width: usagePct + "%", background: usagePct >= 80 ? "#EF4444" : "linear-gradient(90deg,#C9A84C,#39FF8F)", borderRadius: 2, transition: "width 0.5s" }} />
            </div>
            <p style={{ color: "#8A8478", fontSize: 9, margin: 0 }}>{totalViews.toLocaleString("fr-FR")} / {limit.toLocaleString("fr-FR")}</p>
          </div>
        )}

        {/* User card */}
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover", border: `1.5px solid ${pc}40`, flexShrink: 0 }} />
              : <div style={{ width: 30, height: 30, borderRadius: "50%", background: `linear-gradient(135deg,${pc},${pc}80)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, fontWeight: 700, color: "#080808" }}>
                  {(profile?.full_name || profile?.email || "?")[0]?.toUpperCase()}
                </div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {profile?.full_name || profile?.email?.split("@")[0]}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: pc, animation: "pulse 2s infinite" }} />
                <p style={{ color: pc, fontSize: 9, margin: 0, fontWeight: 600, textTransform: "capitalize" }}>Plan {plan}</p>
              </div>
            </div>
          </div>
        </div>

      </aside>

      <main style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  )
}
