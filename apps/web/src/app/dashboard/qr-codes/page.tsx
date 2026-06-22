import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import QRStudio from "./QRStudio"
import { Plus, QrCode } from "lucide-react"

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

  return (
    <div style={{ minHeight: "100vh", background: "#080808", fontFamily: "DM Sans, sans-serif" }}>

      {/* ===== Header ===== */}
      <div style={{ borderBottom: "1px solid rgba(201,168,76,0.1)", background: "rgba(15,14,11,0.85)", backdropFilter: "blur(14px)", position: "sticky", top: 0, zIndex: 50, padding: "0 24px" }}>
        <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 66 }}>

          {/* Identite */}
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: "linear-gradient(135deg, rgba(201,168,76,0.2), rgba(201,168,76,0.08))", border: "1px solid rgba(201,168,76,0.25)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(201,168,76,0.12)" }}>
              <QrCode size={19} color="#C9A84C"/>
            </div>
            <div>
              <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 22, color: "#F5F0E8", fontWeight: 700, margin: 0, lineHeight: 1.15 }}>
                QR Studio
              </h1>
              <p style={{ color: "#8A8478", fontSize: 11, margin: 0 }}>
                Créez, personnalisez et exportez vos QR Codes
              </p>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <a href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 7, background: "linear-gradient(90deg,#C9A84C,#b8953f)", color: "#080808", textDecoration: "none", fontSize: 12.5, fontWeight: 700, padding: "10px 18px", borderRadius: 10, whiteSpace: "nowrap" as const, boxShadow: "0 4px 14px rgba(201,168,76,0.2)" }}>
              <Plus size={14}/> Nouvelle page
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
