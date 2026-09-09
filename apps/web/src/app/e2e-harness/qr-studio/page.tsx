// Banc d'essai de « QR de mes pages » (tests, captures) : monte le studio client sans la
// garde d'auth, avec deux QR de démonstration clairement fictifs. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import QRStudioSwitch from "@/app/dashboard/qr-codes/QRStudioSwitch"
import type { QRCode } from "@/app/dashboard/qr-codes/QRStudio"

export const dynamic = "force-dynamic"

const base = (n: number, titre: string, slug: string, scans: number): QRCode => ({
  id: `demo-qr-${n}`, page_id: `demo-page-${n}`, short_code: `demo${n}`,
  foreground_color: "#111411", background_color: "#F4F1E8", corner_style: "rounded", error_correction: "M",
  style_config: {}, logo_url: null, dest_override: null, dest_history: [], status: "active", pause_message: null,
  expires_at: null, total_scans: scans, last_scan_at: "2026-09-08T10:00:00Z", created_at: "2026-08-01T10:00:00Z",
  pages: { id: `demo-page-${n}`, title: titre, slug, status: "published", total_views: scans * 3, updated_at: "2026-09-08T10:00:00Z" },
})

export default async function E2EQrStudioPage() {
  if (!harnessAutorise()) notFound()
  return (
    <ToastProvider><ConfirmProvider><div style={{ maxWidth: 1320, margin: "0 auto", padding: "20px 24px 40px" }}>
      <QRStudioSwitch qrCodes={[base(1, "Carte restaurant (démo)", "carte-restaurant-demo", 128), base(2, "Avis Google (démo)", "avis-google-demo", 41)]} userPlan="pro" appUrl="https://qrowg.com" />
    </div></ConfirmProvider></ToastProvider>
  )
}
