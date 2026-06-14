import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import QRStudio from "./QRStudio"
import { Plus, QrCode, TrendingUp, Activity } from "lucide-react"

export const metadata: Metadata = { title: "QR Studio - QRfolio" }

export default async function QRCodesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single()

  const { data: qrCodes } = await supabase
    .from("qr_codes")
    .select("*, pages(id, title, slug, status, total_views, updated_at)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || "https://qrfolio.app"
  const userPlan = profile?.plan || "free"

  const totalQR    = (qrCodes ?? []).length
  const totalScans = (qrCodes ?? []).reduce((a, q) => a + (q.total_scans ?? 0), 0)
  const activeQR   = (qrCodes ?? []).filter((q: any) => (q.status ?? "active") === "active").length

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "DM Sans, sans-serif" }}>

      {/* ===== Header ===== */}
      <div style={{ borderBottom: "1px solid rgba(201,168,76,0.1)", background: "rgba(15,14,11,0.8)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50, padding: "0 24px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <QrCode size={16} color="#C9A84C"/>
            </div>
            <div>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 20, color: "#F5F0E8", fontWeight: 700, margin: 0, lineHeight: 1.2 }}>
                QR Studio
              </h1>
              <p style={{ color: "#8A8478", fontSize: 11, margin: 0 }}>
                Gerez, personnalisez et exportez vos QR Codes dynamiques
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* KPIs rapides */}
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              {[
                { label: "QR actifs", value: activeQR, icon: <Activity size={11} color="#39FF8F"/>, color: "#39FF8F" },
                { label: "Scans total", value: totalScans.toLocaleString("fr-FR"), icon: <TrendingUp size={11} color="#C9A84C"/>, color: "#C9A84C" },
              ].map((k, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {k.icon}
                  <div>
                    <p style={{ color: k.color, fontSize: 13, fontWeight: 700, margin: 0, lineHeight: 1 }}>{k.value}</p>
                    <p style={{ color: "#8A8478", fontSize: 9, margin: 0, textTransform: "uppercase", letterSpacing: 0.8 }}>{k.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)" }}/>

            <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(90deg,#C9A84C,#b8953f)", color: "#080808", textDecoration: "none", fontSize: 12, fontWeight: 700, padding: "8px 16px", borderRadius: 9, whiteSpace: "nowrap" as const }}>
              <Plus size={13}/> Nouvelle page
            </a>
          </div>
        </div>
      </div>

      {/* ===== Studio ===== */}
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 24px 40px" }}>
        <QRStudio
          qrCodes={(qrCodes ?? []) as any}
          userPlan={userPlan}
          appUrl={appUrl}
        />
      </div>
    </div>
  )
}
