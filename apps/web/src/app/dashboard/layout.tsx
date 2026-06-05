"use server"
import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { LayoutDashboard, QrCode, BarChart2, Settings, Zap, User, Globe, LayoutTemplate, Star } from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, plan, avatar_url, total_pages")
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

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/templates", label: "Templates", icon: LayoutTemplate },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/dashboard/qr-codes", label: "QR Codes", icon: QrCode },
    { href: "/dashboard/profile", label: "Profil", icon: User },
    { href: "/dashboard/domains", label: "Domaines", icon: Globe },
    { href: "/dashboard/settings", label: "Parametres", icon: Settings },
  ]

  const planColors: Record<string, string> = { free: "#8A8478", starter: "#38BDF8", pro: "#C9A84C", business: "#39FF8F" }
  const pc = planColors[profile?.plan || "free"]

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080808", fontFamily: "DM Sans, sans-serif" }}>
      <aside style={{ width: 220, background: "#0C0B09", borderRight: "1px solid rgba(201,168,76,0.1)", display: "flex", flexDirection: "column", padding: "20px 14px", position: "fixed", top: 0, left: 0, height: "100vh", overflowY: "auto" }}>

        {/* Logo */}
        <Link href="/dashboard" style={{ textDecoration: "none", marginBottom: 28, display: "block" }}>
          <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, color: "#C9A84C", fontWeight: 700 }}>QRfolio</span>
        </Link>

        {/* Nav */}
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, textDecoration: "none", color: "#8A8478", fontSize: 13, transition: "all 0.15s" }}
              onMouseOver={undefined}>
              <Icon size={15} />{label}
            </Link>
          ))}
        </nav>

        {/* Quota vues */}
        {limit !== Infinity && (
          <div style={{ marginBottom: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "10px 12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ color: "#8A8478", fontSize: 11 }}>Vues ce mois</span>
              <span style={{ color: usagePct >= 80 ? "#EF4444" : "#C9A84C", fontSize: 11, fontWeight: 700 }}>{usagePct}%</span>
            </div>
            <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: usagePct + "%", background: usagePct >= 80 ? "#EF4444" : "linear-gradient(90deg,#C9A84C,#39FF8F)", borderRadius: 2 }} />
            </div>
            <p style={{ color: "#8A8478", fontSize: 10, margin: "4px 0 0" }}>{totalViews.toLocaleString("fr-FR")} / {limit.toLocaleString("fr-FR")}</p>
          </div>
        )}

        {/* Upgrade banner */}
        {(profile?.plan === "free" || profile?.plan === "starter") && (
          <Link href="/upgrade"
            style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.25)", borderRadius: 10, padding: "10px 12px", textDecoration: "none", color: "#C9A84C", fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
            <Zap size={13} />
            {profile?.plan === "free" ? "Passer a Starter — 2,99€" : "Passer a Pro — 9,99€"}
          </Link>
        )}

        {/* User info */}
        <div style={{ padding: "10px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg," + pc + "," + pc + "80)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 12, fontWeight: 700, color: "#080808" }}>
              {(profile?.full_name || profile?.email || "?")[0]?.toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: "#F5F0E8", fontSize: 12, fontWeight: 600, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{profile?.full_name || profile?.email?.split("@")[0]}</p>
              <p style={{ color: pc, fontSize: 10, margin: 0, textTransform: "capitalize" }}>Plan {profile?.plan || "free"}</p>
            </div>
          </div>
        </div>
      </aside>

      <main style={{ marginLeft: 220, flex: 1, minWidth: 0 }}>{children}</main>
    </div>
  )
}
