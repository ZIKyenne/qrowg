import { createServerSupabaseClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import QRStudioSwitch from "./QRStudioSwitch"
import { accessibleOwnerIds } from "@/lib/team"
import { pageLimit } from "@/lib/plans"
import { Plus, Link2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"

export const metadata: Metadata = { title: "QR de mes pages - QRowg" }

export default async function QRCodesPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single()

  // Contenu accessible : le sien + celui des équipes dont il est membre.
  const ownerIds = await accessibleOwnerIds(supabase, user.id)

  const { data: qrCodes } = await supabase
    .from("qr_codes")
    .select("*, pages(id, title, slug, status, total_views, updated_at)")
    .in("user_id", ownerIds)
    .order("created_at", { ascending: false })

  const appUrl   = process.env.NEXT_PUBLIC_APP_URL || "https://qrowg.com"
  const userPlan = profile?.plan || "free"

  const totalScans = (qrCodes ?? []).reduce((a, q) => a + (q.total_scans ?? 0), 0)
  const activeQR   = (qrCodes ?? []).filter((q: any) => (q.status ?? "active") === "active").length
  // Quota du plan = QR ACTIFS (visitables). null = illimité.
  const activeLimit = pageLimit(userPlan)
  // Compteur QR actifs : % de quota (barre) + couleur d'état (vert / or ≥80% / rouge à 100%).
  const quotaPct  = activeLimit ? Math.min(100, Math.round((activeQR / activeLimit) * 100)) : 100
  const dotColor  = activeLimit == null ? "#6fbf73" : quotaPct >= 100 ? "#d9534f" : quotaPct >= 80 ? "#e8c877" : "#6fbf73"

  return (
    <div style={{ minHeight: "100dvh", background: "transparent", fontFamily: "DM Sans, sans-serif", position: "relative" }}>

      {/* ===== Header ===== */}
      <style>{`
        .qrh-content { max-width:1320px; margin:0 auto; padding:20px 24px 40px; }
        .qrh-kpis { display:flex; align-items:center; gap:10px; }
        .qrh-cta-group { display:flex; align-items:center; gap:10px; }
        @media (max-width:860px) {
          .qrh-content { padding:16px 16px 130px !important; }
          /* KPIs (QR actifs / scans total) masqués sur mobile : peu d'info pour la
             place prise ; les scans restent consultables dans l'onglet Stats. */
          .qrh-kpis { display:none !important; }
          /* « Créer un QR » + Nouvelle page + QR masqués sur mobile : déjà accessibles via le « + » de la barre du bas. */
          .qrh-cta-group { display:none !important; }
        }
      `}</style>

      {/* ===== Studio ===== */}
      <div className="qrh-content">
        <PageHeader kicker="Mes QR codes" title="QR de mes pages" gap={18}
          sub="Le QR code de chacune de vos pages QRowg — personnalisez-le et exportez-le"
          actions={<>
            {/* Compteurs d'en-tête : valeurs réelles, sans animation. */}
            <div className="qrh-kpis">
              <div className="kpi-chip" aria-label={activeLimit != null ? `${activeQR} QR actifs sur ${activeLimit}` : `${activeQR} QR actifs`}>
                <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flex: "none" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em", color: "var(--ink)", lineHeight: 1 }}>{activeQR}{activeLimit != null && <span style={{ color: "var(--faint)", fontWeight: 500 }}> / {activeLimit}</span>}</div>
                  <div style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>QR actifs</div>
                </div>
                {activeLimit != null && (
                  <div aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 2, background: "var(--surface-2)" }}>
                    <div style={{ height: "100%", width: `${quotaPct}%`, background: "var(--accent)", transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
                  </div>
                )}
              </div>
              <div className="kpi-chip" aria-label={`${totalScans} scans au total`}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-.01em", color: "var(--ink)", lineHeight: 1 }}>{totalScans.toLocaleString("fr-FR")}</div>
                  <div style={{ fontSize: 9.5, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 600 }}>Scans total</div>
                </div>
              </div>
            </div>
            {/* « Créer un QR » + Nouvelle page + QR — masqués sur mobile (redondants avec le « + » de la barre du bas). */}
            <div className="qrh-cta-group">
              <a href="/dashboard/qr-link" className="da-btn-ghost da-btn-ghost--sm">
                <Link2 size={15} aria-hidden="true" /> Créer un QR
              </a>
              <a href="/dashboard/templates" className="da-btn-primary da-btn-primary--sm">
                <Plus size={16} aria-hidden="true" /> <span>Nouvelle page + QR</span>
              </a>
            </div>
          </>} />
        <QRStudioSwitch
          qrCodes={(qrCodes ?? []) as any}
          userPlan={userPlan}
          appUrl={appUrl}
        />
      </div>
    </div>
  )
}
