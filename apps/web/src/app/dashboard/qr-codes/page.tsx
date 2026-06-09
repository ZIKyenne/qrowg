import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import QRCustomizer from "./QRCustomizer"
import { QrCode, Plus } from "lucide-react"

export const metadata: Metadata = { title: "QR Codes — QRfolio" }

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
    .select("*, pages(title, slug, status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://qrfolio.app"
  const userPlan = profile?.plan || "free"

  return (
    <div style={{ minHeight: "100vh", background: "#080808", padding: "32px 24px", fontFamily: "DM Sans, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 32, color: "#F5F0E8", fontWeight: 700, margin: 0 }}>
              Mes QR Codes
            </h1>
            <p style={{ color: "#8A8478", marginTop: 4, fontSize: 14 }}>
              {(qrCodes ?? []).length} QR code{(qrCodes ?? []).length > 1 ? "s" : ""} — permanents et personnalisables
            </p>
          </div>
          <a href="/dashboard" style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "linear-gradient(90deg, #C9A84C, #b8953f)",
            color: "#080808", textDecoration: "none", fontSize: 14, fontWeight: 700,
            padding: "11px 20px", borderRadius: 10
          }}>
            <Plus size={15} /> Créer une page
          </a>
        </div>

        {/* Empty state */}
        {(qrCodes ?? []).length === 0 ? (
          <div style={{
            border: "1px dashed rgba(201,168,76,0.2)", borderRadius: 20,
            padding: "80px 40px", textAlign: "center"
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: "0 auto 20px",
              background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <QrCode size={32} color="#C9A84C" />
            </div>
            <h2 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 24, color: "#F5F0E8", fontWeight: 700, margin: "0 0 12px" }}>
              Aucun QR code pour l'instant
            </h2>
            <p style={{ color: "#8A8478", marginBottom: 28, fontSize: 14, lineHeight: 1.7 }}>
              Crée ta première page pour générer automatiquement un QR code dynamique.
            </p>
            <a href="/dashboard" style={{
              background: "linear-gradient(90deg, #C9A84C, #b8953f)",
              color: "#080808", textDecoration: "none", fontSize: 14, fontWeight: 700,
              padding: "14px 28px", borderRadius: 10, display: "inline-block"
            }}>
              Créer ma première page →
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {(qrCodes ?? []).map((qr: any) => {
              const page = qr.pages as any
              const qrUrl = `${appUrl}/q/${qr.short_code}`
              return (
                <div key={qr.id} style={{
                  background: "#111009", border: "1px solid rgba(201,168,76,0.15)",
                  borderRadius: 20, padding: "32px", overflow: "hidden", position: "relative"
                }}>
                  {/* Glow top */}
                  <div style={{
                    position: "absolute", top: 0, left: "20%", right: "20%", height: 1,
                    background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.4), transparent)"
                  }} />

                  {/* Card header */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: 10,
                        background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                      }}>
                        <QrCode size={20} color="#C9A84C" />
                      </div>
                      <div>
                        <h3 style={{ color: "#F5F0E8", fontSize: 16, fontWeight: 700, margin: 0 }}>{page?.title || "Sans titre"}</h3>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                          <div style={{
                            width: 6, height: 6, borderRadius: "50%",
                            background: page?.status === "published" ? "#39FF8F" : "#8A8478"
                          }} />
                          <span style={{ color: "#8A8478", fontSize: 12 }}>
                            {page?.status === "published" ? "Publiée" : "Brouillon"} · {appUrl}/{page?.slug}
                          </span>
                        </div>
                      </div>
                    </div>
                    <a href={"/dashboard/builder/" + page?.id} style={{
                      border: "1px solid rgba(201,168,76,0.25)", color: "#C9A84C",
                      padding: "8px 16px", borderRadius: 8, fontSize: 13,
                      textDecoration: "none", fontWeight: 600
                    }}>
                      Modifier la page →
                    </a>
                  </div>

                  <QRCustomizer
                    value={qrUrl}
                    shortCode={qr.short_code}
                    totalScans={qr.total_scans || 0}
                    pageTitle={page?.title}
                    userPlan={userPlan}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
