import Link from "next/link"
import { createServerSupabaseClient } from "@/lib/supabase/client"
import { redirect } from "next/navigation"
import { LayoutDashboard, QrCode, BarChart2, Settings, Zap } from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, plan, avatar_url")
    .eq("id", user.id)
    .single()

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: "Analytics", icon: BarChart2 },
    { href: "/dashboard/qr-codes", label: "QR Codes", icon: QrCode },
    { href: "/dashboard/settings", label: "Parametres", icon: Settings },
  ]

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080808", fontFamily: "DM Sans, sans-serif" }}>
      <aside style={{ width: 220, background: "#111009", borderRight: "1px solid rgba(201,168,76,0.15)", display: "flex", flexDirection: "column", padding: "24px 16px", position: "fixed", top: 0, left: 0, height: "100vh" }}>
        <Link href="/dashboard" style={{ textDecoration: "none", marginBottom: 32 }}>
          <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, color: "#C9A84C", fontWeight: 700 }}>QRfolio</span>
        </Link>
        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, textDecoration: "none", color: "#8A8478", fontSize: 14 }}>
              <Icon size={16} />{label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: "auto" }}>
          {profile?.plan === "free" && (
            <Link href="/upgrade" style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 8, padding: "10px 12px", textDecoration: "none", color: "#C9A84C", fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
              <Zap size={14} /> Passer Pro
            </Link>
          )}
          <div style={{ padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)" }}>
            <p style={{ color: "#F5F0E8", fontSize: 13, fontWeight: 600, margin: 0 }}>{profile?.full_name || profile?.email?.split("@")[0]}</p>
            <p style={{ color: "#8A8478", fontSize: 11, margin: "2px 0 0", textTransform: "capitalize" }}>Plan {profile?.plan || "free"}</p>
          </div>
        </div>
      </aside>
      <main style={{ marginLeft: 220, flex: 1 }}>{children}</main>
    </div>
  )
}
