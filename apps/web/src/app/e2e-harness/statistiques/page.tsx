// Banc d'essai de « Statistiques » (tests, captures) : monte l'écran client sans la garde
// d'auth, avec un jeu de données de démonstration clairement fictif. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import AnalyticsShell from "@/app/dashboard/analytics/AnalyticsShell"

export const dynamic = "force-dynamic"

export default async function E2EStatistiquesPage({ searchParams }: { searchParams: Promise<{ debut?: string }> }) {
  if (!harnessAutorise()) notFound()
  // `?debut=1` : ce que voit quelqu'un qui vient de publier — une page, trois scans.
  // C'est l'état dans lequel se trouve TOUT nouvel utilisateur, et celui qu'aucun
  // banc d'essai ne montrait : ils partaient tous d'un compte déjà fourni.
  const { debut } = await searchParams
  const jeune = debut === "1"
  const now = Date.now()
  const iso = (jours: number, h = 10) => new Date(now - jours * 864e5 - h * 36e5).toISOString()
  const pages = jeune
    ? [{ id: "demo-page-1", title: "Ma carte (démo)", slug: "ma-carte-demo", total_views: 4, unique_views: 3, status: "published" }]
    : [
      { id: "demo-page-1", title: "Carte restaurant (démo)", slug: "carte-restaurant-demo", total_views: 384, unique_views: 250, status: "published" },
      { id: "demo-page-2", title: "Avis Google (démo)", slug: "avis-google-demo", total_views: 123, unique_views: 90, status: "published" },
    ]
  const N = { scans: jeune ? 3 : 90, vues: jeune ? 4 : 200, clics: jeune ? 1 : 60, events: jeune ? 6 : 120 }
  const devices = ["mobile", "mobile", "mobile", "desktop", "tablet"]
  const pays = ["FR", "FR", "FR", "BE", "CH", null]
  const recentScans = Array.from({ length: N.scans }, (_, i) => ({ scanned_at: iso(i % 30, i % 12), device: devices[i % 5], country: pays[i % 6], page_id: i % 3 ? "demo-page-1" : "demo-page-2", qr_code_id: i % 3 ? "demo-qr-1" : "demo-qr-2" }))
  const recentViews = Array.from({ length: N.vues }, (_, i) => ({ viewed_at: iso(i % 30, i % 14), device: devices[i % 5], source: i % 4 ? "qr" : "direct", country: pays[i % 6], page_id: i % 3 ? "demo-page-1" : "demo-page-2" }))
  const blocks = [
    { id: "demo-b1", type: "cta_button", page_id: "demo-page-1", position: 0, is_visible: true },
    { id: "demo-b2", type: "menu_section", page_id: "demo-page-1", position: 1, is_visible: true },
    { id: "demo-b3", type: "social_links", page_id: "demo-page-2", position: 0, is_visible: true },
  ]
  const clicks = Array.from({ length: N.clics }, (_, i) => ({ block_id: ["demo-b1", "demo-b2", "demo-b3"][i % 3], click_target: "https://exemple.fr", clicked_at: iso(i % 30, i % 9), page_id: i % 3 === 2 ? "demo-page-2" : "demo-page-1", block_type: ["cta_button", "menu_section", "social_links"][i % 3] }))
  const geoScans = recentScans.map(s => ({ country: s.country, city: s.country === "FR" ? "Reims" : null, page_id: s.page_id, scanned_at: s.scanned_at }))
  const deviceScans = recentScans.map(s => ({ device: s.device, os: s.device === "desktop" ? "Windows" : "iOS", browser: "Safari", page_id: s.page_id, scanned_at: s.scanned_at }))
  const pageEvents = Array.from({ length: N.events }, (_, i) => ({ kind: (["scroll", "impression", "dwell", "tap"] as const)[i % 4], ref: i % 4 === 0 ? String(25 * ((i % 4) + 1)) : "demo-b1", value: i % 4 === 0 ? 25 * ((i >> 2) % 4 + 1) : 3, x: 0.3 + (i % 5) / 10, y: 0.2 + (i % 7) / 10, page_id: "demo-page-1", created_at: iso(i % 30, i % 8) }))
  return (
    <ToastProvider><ConfirmProvider><AnalyticsShell
      profile={{ total_pages: jeune ? 1 : 2, total_scans: jeune ? 3 : 169, plan: jeune ? "free" : "pro", email: "demo@qrowg.fr", full_name: jeune ? "Nouveau compte (démo)" : "Studio Horizon (démo)" }}
      pages={pages} recentScans={recentScans} recentViews={recentViews} clicks={clicks} blocks={blocks}
      geoScans={geoScans} deviceScans={deviceScans} pageEvents={pageEvents} userEmail="demo@qrowg.fr"
      supportQrs={[{ id: "demo-qr-1", short_code: "demo1", label: "Sticker de table (démo)", page_id: "demo-page-1" }, { id: "demo-qr-2", short_code: "demo2", label: "Chevalet (démo)", page_id: "demo-page-2" }]}
      supportViews={recentViews.map(v => ({ qr_source: v.source === "qr" ? "demo1" : null }))}
      supportClicks={clicks.map((_, i) => ({ qr_source: i % 2 ? "demo1" : "demo2" }))}
      supportLeads={[{ qr_source: "demo1" }, { qr_source: "demo1" }]}
    /></ConfirmProvider></ToastProvider>
  )
}
