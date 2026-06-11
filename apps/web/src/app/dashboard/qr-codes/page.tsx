import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import QRStudio from "./QRStudio"
import { Plus } from "lucide-react"

export const metadata: Metadata = { title: "QR Studio — QRfolio" }

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
    <div style={{ minHeight: "100vh", background: "#080808", padding: "24px", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 28, color: "#F5F0E8", fontWeight: 700, margin: "0 0 4px" }}>
              QR Studio
            </h1>
            <p style={{ color: "#8A8478", fontSize: 13, margin: 0 }}>
              {(qrCodes ?? []).length} QR code{(qrCodes ?? []).length !== 1 ? "s" : ""} — personnalisés et trackés
            </p>
          </div>
          <a href="/dashboard" style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(90deg, #C9A84C, #b8953f)",
            color: "#080808", textDecoration: "none", fontSize: 13, fontWeight: 700,
            padding: "10px 18px", borderRadius: 10
          }}>
            <Plus size={14} /> Nouvelle page
          </a>
        </div>

        <QRStudio
          qrCodes={(qrCodes ?? []) as any}
          userPlan={userPlan}
          appUrl={appUrl}
        />
      </div>
    </div>
  )
}
