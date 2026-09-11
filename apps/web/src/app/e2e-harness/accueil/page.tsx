// Banc d'essai de « Accueil connecté » (captures, tests) : monte l'écran client sans la garde
// d'auth, avec des données de démonstration clairement fictives. GATÉ : 404 en production.
import { notFound } from "next/navigation"
import { harnessAutorise } from "../gate"
import { ToastProvider } from "@/components/Toast"
import { ConfirmProvider } from "@/components/ui/Confirm"
import DashboardClient from "@/app/dashboard/DashboardClient"

export const dynamic = "force-dynamic"

// ?debut=1 : le compte qui revient trois jours après avoir publié sa première page.
// ?debut=2 : le même, mais dont le QR tourne (64 scans) — l'offre payante a alors une raison.
// C'est l'état que personne ne regarde jamais — l'écran est dessiné pour 3 pages
// et 507 vues — alors que c'est celui que tout nouveau client traverse.
export default async function E2EAccueilPage({ searchParams }: { searchParams?: Promise<{ debut?: string }> }) {
  if (!harnessAutorise()) notFound()
  const { debut } = (await searchParams) ?? {}
  const jeune = debut === "1"
  const lance = debut === "2"   // compte gratuit dont le QR tourne : l'offre a une raison
  const il_y_a = (j: number) => new Date(Date.now() - j * 864e5).toISOString()
  const pages = (jeune || lance) ? [
    { id: "demo-page-1", title: "Ma carte (démo)", slug: "ma-carte-demo", status: "published", total_views: lance ? 88 : 4, created_at: il_y_a(lance ? 26 : 3) },
  ] : [
    { id: "demo-page-1", title: "Carte restaurant (démo)", slug: "carte-restaurant-demo", status: "published", total_views: 384, created_at: il_y_a(40) },
    { id: "demo-page-2", title: "Avis Google (démo)", slug: "avis-google-demo", status: "published", total_views: 123, created_at: il_y_a(12) },
    { id: "demo-page-3", title: "Menu du soir (démo)", slug: "menu-du-soir-demo", status: "draft", total_views: 0, created_at: il_y_a(2) },
  ]
  const profil = lance
    ? { full_name: "Compte lancé (démo)", plan: "free", total_scans: 64, total_pages: 1, avatar_url: null }
    : jeune
    ? { full_name: "Nouveau compte (démo)", plan: "free", total_scans: 3, total_pages: 1, avatar_url: null }
    : { full_name: "Studio Horizon (démo)", plan: "pro", total_scans: 169, total_pages: 3, avatar_url: null }
  return <ToastProvider><ConfirmProvider><DashboardClient
      initialProfile={profil}
      initialPages={pages}
      initialMonthViews={lance ? 88 : jeune ? 4 : 507}
      initialTodayViews={lance ? 6 : jeune ? 0 : 23}
      initialWeekViews={lance ? [7, 9, 12, 8, 15, 11, 6] : jeune ? [0, 0, 0, 1, 2, 1, 0] : [41, 58, 73, 66, 90, 102, 77]} /></ConfirmProvider></ToastProvider>
}
